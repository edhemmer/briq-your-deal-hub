-- Specification 011 Slice 4 repair: give amendment-impact idempotency a stable
-- conflict target name for Supabase lint.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.contract_amendment_impact_results'::regclass
      and conname = 'contract_amendment_impacts_run_hash_unique'
  ) then
    alter table public.contract_amendment_impact_results
      add constraint contract_amendment_impacts_run_hash_unique unique (workspace_id, analysis_run_id, deterministic_hash);
  end if;
end $$;

create or replace function public.record_contract_perspective_analysis_result(target_contract_id uuid, result_input jsonb, expected_contract_version integer, idempotency_key text)
returns table (analysis_run_id uuid, analysis_run_version integer, analysis_state text, perspective text, deterministic_hash text, prior_valid_preserved boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(result_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_run public.contract_perspective_analysis_runs%rowtype;
  existing_current public.contract_perspective_analysis_runs%rowtype;
  item jsonb;
  amendment_item jsonb;
  normalized_perspective text := coalesce(nullif(btrim(safe_input ->> 'perspective'), ''), 'buyer');
  normalized_state text := coalesce(nullif(btrim(safe_input ->> 'analysisState'), ''), 'partial');
  normalized_hash text := nullif(btrim(safe_input ->> 'deterministicHash'), '');
  normalized_input_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to record ContractIQ perspective analysis.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'ContractIQ perspective analysis result must be an object.' using errcode = '22023'; end if;
  if normalized_hash is null then raise exception 'ContractIQ perspective analysis requires a deterministic hash.' using errcode = '22023'; end if;
  if safe_input ->> 'analysisContractVersion' <> 'contractiq-perspective-analysis-v1' then raise exception 'Unsupported ContractIQ perspective analysis version.' using errcode = '22023'; end if;
  if coalesce((safe_input ->> 'downstreamMutationAllowed')::boolean, false) then raise exception 'ContractIQ perspective analysis cannot mutate downstream modules.' using errcode = '22023'; end if;

  target_contract := public.authorized_contract(target_contract_id);
  if expected_contract_version is not null and target_contract.version <> expected_contract_version then
    raise exception 'Contract changed before this perspective analysis could be accepted.' using errcode = '40001';
  end if;
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to save ContractIQ perspective analysis.' using errcode = '42501';
  end if;

  normalized_input_hash := md5(coalesce((safe_input -> 'sourceVersionGraph')::text, '{}') || normalized_perspective || target_contract.version::text);
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'record_contract_perspective_analysis_result', idempotency_key, safe_input);
  if command.result ? 'analysis_run_id' then
    select id, version, contract_perspective_analysis_runs.analysis_state, contract_perspective_analysis_runs.perspective, contract_perspective_analysis_runs.deterministic_hash, contract_perspective_analysis_runs.prior_valid_preserved
      into analysis_run_id, analysis_run_version, analysis_state, perspective, deterministic_hash, prior_valid_preserved
    from public.contract_perspective_analysis_runs
    where id = (command.result ->> 'analysis_run_id')::uuid;
    return next; return;
  end if;

  select * into existing_current
  from public.contract_perspective_analysis_runs run
  where run.workspace_id = target_contract.workspace_id
    and run.contract_id = target_contract.id
    and run.perspective = normalized_perspective
    and run.is_current is true
  for update;

  update public.contract_perspective_analysis_runs prior
  set is_current = false,
      analysis_state = case when prior.analysis_state in ('current', 'current_with_conflicts', 'professional_review_required') then 'stale' else prior.analysis_state end,
      stale_reason = coalesce(prior.stale_reason, 'Superseded by newer ContractIQ perspective analysis result.'),
      updated_by = current_user_id
  where prior.workspace_id = target_contract.workspace_id
    and prior.contract_id = target_contract.id
    and prior.perspective = normalized_perspective
    and prior.is_current is true;

  insert into public.contract_perspective_analysis_runs (
    workspace_id, deal_id, property_id, contract_id, contract_version, analysis_contract_version,
    perspective, analysis_state, completeness_state, source_version_graph, result_payload,
    deterministic_hash, correlation_id, input_hash, prior_valid_analysis_run_id, prior_valid_preserved,
    failure_code, stale_reason, benefit_count, risk_count, unusual_term_count, missing_protection_count,
    missing_information_count, conflict_count, amendment_impact_count, obligation_count, question_count,
    negotiation_concept_count, professional_review_count, downstream_candidate_count, is_current,
    generated_at, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id,
    target_contract.version, 'contractiq-perspective-analysis-v1', normalized_perspective, normalized_state,
    coalesce(nullif(btrim(safe_input ->> 'completenessState'), ''), 'partial'),
    case when jsonb_typeof(safe_input -> 'sourceVersionGraph') = 'object' then safe_input -> 'sourceVersionGraph' else '{}'::jsonb end,
    safe_input, normalized_hash, coalesce(nullif(safe_input ->> 'correlationId', '')::uuid, gen_random_uuid()),
    normalized_input_hash, coalesce(nullif(safe_input ->> 'priorValidAnalysisRunId', '')::uuid, existing_current.id),
    coalesce((safe_input ->> 'priorValidPreserved')::boolean, false),
    nullif(btrim(safe_input ->> 'failureCode'), ''), nullif(btrim(safe_input ->> 'staleReason'), ''),
    jsonb_array_length(coalesce(safe_input -> 'benefitFindings', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'riskFindings', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'unusualTermFindings', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'missingProtectionFindings', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'missingInformationFindings', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'conflictFindings', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'amendmentImpactFindings', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'obligationFindings', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'questions', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'negotiationConcepts', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'professionalReviewItems', '[]'::jsonb)),
    jsonb_array_length(coalesce(safe_input -> 'downstreamImpactCandidates', '[]'::jsonb)),
    true, coalesce(nullif(safe_input ->> 'generatedAt', '')::timestamptz, now()), current_user_id, current_user_id
  )
  returning * into inserted_run;

  for item in
    select value from jsonb_array_elements(
      coalesce(safe_input -> 'benefitFindings', '[]'::jsonb) ||
      coalesce(safe_input -> 'riskFindings', '[]'::jsonb) ||
      coalesce(safe_input -> 'unusualTermFindings', '[]'::jsonb) ||
      coalesce(safe_input -> 'missingProtectionFindings', '[]'::jsonb) ||
      coalesce(safe_input -> 'missingInformationFindings', '[]'::jsonb) ||
      coalesce(safe_input -> 'conflictFindings', '[]'::jsonb) ||
      coalesce(safe_input -> 'amendmentImpactFindings', '[]'::jsonb) ||
      coalesce(safe_input -> 'obligationFindings', '[]'::jsonb) ||
      coalesce(safe_input -> 'professionalReviewItems', '[]'::jsonb)
    )
  loop
    insert into public.contract_perspective_analysis_items (
      workspace_id, deal_id, property_id, contract_id, analysis_run_id, item_kind, finding_group,
      finding_type, category, severity, title, summary, perspective, source_refs, payload,
      professional_review_required, status, created_by, updated_by
    )
    values (
      inserted_run.workspace_id, inserted_run.deal_id, inserted_run.property_id, inserted_run.contract_id,
      inserted_run.id, 'finding', nullif(item ->> 'group', ''), nullif(item ->> 'findingType', ''),
      nullif(item ->> 'category', ''), nullif(item ->> 'severity', ''), coalesce(nullif(item ->> 'title', ''), 'Contract perspective finding'),
      coalesce(nullif(item ->> 'summary', ''), 'Contract perspective finding requires review.'),
      inserted_run.perspective, case when jsonb_typeof(item -> 'sourceRefs') = 'array' then item -> 'sourceRefs' else '[]'::jsonb end,
      item, coalesce((item ->> 'professionalReviewRequired')::boolean, false), coalesce(nullif(item ->> 'status', ''), 'current'),
      current_user_id, current_user_id
    );
  end loop;

  for item in select value from jsonb_array_elements(coalesce(safe_input -> 'questions', '[]'::jsonb))
  loop
    insert into public.contract_perspective_analysis_items (
      workspace_id, deal_id, property_id, contract_id, analysis_run_id, item_kind, title, summary,
      perspective, source_refs, payload, professional_review_required, status, created_by, updated_by
    )
    values (
      inserted_run.workspace_id, inserted_run.deal_id, inserted_run.property_id, inserted_run.contract_id,
      inserted_run.id, 'question', coalesce(nullif(item ->> 'question', ''), 'Contract question'),
      coalesce(nullif(item ->> 'reason', ''), 'Question requires review.'), inserted_run.perspective,
      case when jsonb_typeof(item -> 'sourceRefs') = 'array' then item -> 'sourceRefs' else '[]'::jsonb end,
      item, coalesce((item ->> 'professionalReviewRequired')::boolean, false), 'open', current_user_id, current_user_id
    );
  end loop;

  for item in select value from jsonb_array_elements(coalesce(safe_input -> 'negotiationConcepts', '[]'::jsonb))
  loop
    insert into public.contract_perspective_analysis_items (
      workspace_id, deal_id, property_id, contract_id, analysis_run_id, item_kind, title, summary,
      perspective, source_refs, payload, professional_review_required, status, created_by, updated_by
    )
    values (
      inserted_run.workspace_id, inserted_run.deal_id, inserted_run.property_id, inserted_run.contract_id,
      inserted_run.id, 'negotiation_concept', coalesce(nullif(item ->> 'title', ''), 'Discussion draft negotiation concept'),
      coalesce(nullif(item ->> 'concept', ''), 'Discussion draft concept requires professional review.'),
      inserted_run.perspective, case when jsonb_typeof(item -> 'sourceRefs') = 'array' then item -> 'sourceRefs' else '[]'::jsonb end,
      item || jsonb_build_object('discussionDraftLabel', 'DISCUSSION DRAFT', 'professionalReviewLabel', 'FOR LICENSED PROFESSIONAL REVIEW'),
      true, 'candidate_only', current_user_id, current_user_id
    );
  end loop;

  for item in select value from jsonb_array_elements(coalesce(safe_input -> 'downstreamImpactCandidates', '[]'::jsonb))
  loop
    insert into public.contract_perspective_analysis_items (
      workspace_id, deal_id, property_id, contract_id, analysis_run_id, item_kind, finding_group,
      title, summary, perspective, source_refs, payload, professional_review_required,
      downstream_mutation_allowed, status, created_by, updated_by
    )
    values (
      inserted_run.workspace_id, inserted_run.deal_id, inserted_run.property_id, inserted_run.contract_id,
      inserted_run.id, 'downstream_impact_candidate', 'professional_review',
      coalesce(nullif(item ->> 'impactType', ''), 'Downstream impact candidate'),
      coalesce(nullif(item ->> 'summary', ''), 'Downstream candidate requires explicit acceptance in owning module.'),
      inserted_run.perspective, case when jsonb_typeof(item -> 'sourceRefs') = 'array' then item -> 'sourceRefs' else '[]'::jsonb end,
      item || jsonb_build_object('mutationAllowed', false), false, false, 'candidate_only', current_user_id, current_user_id
    );
  end loop;

  for amendment_item in select value from jsonb_array_elements(coalesce(safe_input -> 'amendmentImpactFindings', '[]'::jsonb))
  loop
    insert into public.contract_amendment_impact_results (
      workspace_id, deal_id, property_id, contract_id, analysis_run_id, relationship_id,
      impact_type, impact_summary, source_refs, professional_review_required, deterministic_hash,
      created_by, updated_by
    )
    values (
      inserted_run.workspace_id, inserted_run.deal_id, inserted_run.property_id, inserted_run.contract_id,
      inserted_run.id, nullif(amendment_item #>> '{payload,relationshipId}', '')::uuid,
      coalesce(nullif(amendment_item ->> 'findingType', ''), 'amendment_relationship_impact'),
      coalesce(nullif(amendment_item ->> 'summary', ''), 'Amendment impact candidate requires review.'),
      case when jsonb_typeof(amendment_item -> 'sourceRefs') = 'array' then amendment_item -> 'sourceRefs' else '[]'::jsonb end,
      coalesce((amendment_item ->> 'professionalReviewRequired')::boolean, true),
      md5(inserted_run.id::text || amendment_item::text),
      current_user_id, current_user_id
    )
    on conflict on constraint contract_amendment_impacts_run_hash_unique do nothing;
  end loop;

  update public.contracts
  set analysis_state = case
        when inserted_run.analysis_state = 'current_with_conflicts' then 'current_with_conflicts'
        when inserted_run.analysis_state = 'professional_review_required' then 'professional_review_required'
        when inserted_run.analysis_state = 'failed_with_prior_analysis' then 'failed_with_prior_analysis'
        when inserted_run.analysis_state = 'stale' then 'stale'
        else analysis_state
      end,
      updated_by = current_user_id
  where id = target_contract.id;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (
    inserted_run.workspace_id, inserted_run.deal_id, inserted_run.property_id, current_user_id,
    case when inserted_run.analysis_state = 'failed_with_prior_analysis' then 'contract.perspective_analysis_failed_with_prior_valid' else 'contract.perspective_analysis_completed' end,
    'contract_perspective_analysis_run', inserted_run.id, inserted_run.version,
    'record_contract_perspective_analysis_result', idempotency_key,
    jsonb_build_object('contract_id', inserted_run.contract_id, 'perspective', inserted_run.perspective, 'deterministic_hash', inserted_run.deterministic_hash, 'downstream_mutation', false, 'professional_legal_conclusion', false)
  );

  if inserted_run.amendment_impact_count > 0 then
    insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
    values (
      inserted_run.workspace_id, inserted_run.deal_id, inserted_run.property_id, current_user_id,
      'contract.amendment_impact_identified', 'contract_perspective_analysis_run', inserted_run.id, inserted_run.version,
      'record_contract_perspective_analysis_result', idempotency_key || ':amendment_impact',
      jsonb_build_object('contract_id', inserted_run.contract_id, 'amendment_impact_count', inserted_run.amendment_impact_count, 'downstream_mutation', false)
    );
  end if;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (
    inserted_run.workspace_id, inserted_run.deal_id, inserted_run.property_id, current_user_id,
    'contract.perspective_analysis_completed', 'contract_perspective_analysis_runs', 'contract_perspective_analysis_run',
    inserted_run.id, 'record_contract_perspective_analysis_result', idempotency_key || ':audit',
    jsonb_build_object('analysis_state', inserted_run.analysis_state, 'perspective', inserted_run.perspective, 'deterministic_hash', inserted_run.deterministic_hash),
    jsonb_build_object('downstream_mutation', false, 'professional_legal_conclusion', false, 'risk_score', false)
  );

  update public.contract_command_requests
  set result = jsonb_build_object('analysis_run_id', inserted_run.id, 'analysis_run_version', inserted_run.version)
  where id = command.id;

  analysis_run_id := inserted_run.id;
  analysis_run_version := inserted_run.version;
  analysis_state := inserted_run.analysis_state;
  perspective := inserted_run.perspective;
  deterministic_hash := inserted_run.deterministic_hash;
  prior_valid_preserved := inserted_run.prior_valid_preserved;
  return next;
end;
$$;

revoke execute on function public.record_contract_perspective_analysis_result(uuid, jsonb, integer, text) from public, anon;
grant execute on function public.record_contract_perspective_analysis_result(uuid, jsonb, integer, text) to authenticated;

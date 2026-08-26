-- Specification 011 Slice 4: ContractIQ perspective-aware risk, conflict /
-- amendment intelligence, professional-review questions, discussion-draft
-- negotiation concepts, and downstream impact candidates. This slice stores
-- deterministic source-linked analysis snapshots only. It does not create a
-- legal conclusion, risk score, report output, OfferIQ workflow, or silent
-- downstream mutation.

create extension if not exists pgcrypto;

insert into public.contract_finding_category_definitions (category_key, label, sort_order)
values
  ('benefit', 'Perspective Benefit', 1200),
  ('risk', 'Perspective Risk', 1210),
  ('unusual_term', 'Unusual Term', 1220),
  ('missing_protection', 'Missing Protection', 1230),
  ('missing_information', 'Missing Information', 1240),
  ('amendment_impact', 'Amendment Impact', 1250),
  ('obligation', 'Obligation / Deliverable', 1260),
  ('downstream_candidate', 'Downstream Impact Candidate', 1270)
on conflict (category_key) do update set label = excluded.label, sort_order = excluded.sort_order;

create table if not exists public.contract_perspective_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  contract_id uuid not null,
  contract_version integer not null check (contract_version > 0),
  analysis_contract_version text not null default 'contractiq-perspective-analysis-v1',
  perspective text not null references public.contract_perspective_definitions(perspective_key),
  analysis_state text not null check (analysis_state in ('current', 'current_with_conflicts', 'partial', 'stale', 'failed_with_prior_analysis', 'professional_review_required')),
  completeness_state text not null check (completeness_state in ('complete', 'partial', 'missing_source', 'missing_signature', 'conflicted', 'stale', 'failed_with_prior_valid')),
  source_version_graph jsonb not null default '{}'::jsonb check (jsonb_typeof(source_version_graph) = 'object'),
  result_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(result_payload) = 'object'),
  deterministic_hash text not null,
  correlation_id uuid not null default gen_random_uuid(),
  input_hash text not null,
  prior_valid_analysis_run_id uuid,
  prior_valid_preserved boolean not null default false,
  failure_code text check (failure_code is null or failure_code in ('provider_unavailable', 'provider_timeout', 'malformed_response', 'incomplete_extraction', 'insufficient_context', 'unsupported_file', 'illegible_source', 'source_anchor_incomplete', 'validation_failed', 'unknown_error')),
  stale_reason text,
  benefit_count integer not null default 0 check (benefit_count >= 0),
  risk_count integer not null default 0 check (risk_count >= 0),
  unusual_term_count integer not null default 0 check (unusual_term_count >= 0),
  missing_protection_count integer not null default 0 check (missing_protection_count >= 0),
  missing_information_count integer not null default 0 check (missing_information_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  amendment_impact_count integer not null default 0 check (amendment_impact_count >= 0),
  obligation_count integer not null default 0 check (obligation_count >= 0),
  question_count integer not null default 0 check (question_count >= 0),
  negotiation_concept_count integer not null default 0 check (negotiation_concept_count >= 0),
  professional_review_count integer not null default 0 check (professional_review_count >= 0),
  downstream_candidate_count integer not null default 0 check (downstream_candidate_count >= 0),
  is_current boolean not null default true,
  generated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_perspective_analysis_runs_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_perspective_analysis_runs_deal_fk foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contract_perspective_analysis_runs_property_fk foreign key (workspace_id, property_id) references public.properties(workspace_id, id) on delete restrict,
  constraint contract_perspective_analysis_runs_prior_fk foreign key (workspace_id, prior_valid_analysis_run_id) references public.contract_perspective_analysis_runs(workspace_id, id) on delete set null,
  unique (workspace_id, id),
  unique (workspace_id, contract_id, perspective, deterministic_hash)
);

create table if not exists public.contract_perspective_analysis_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  contract_id uuid not null,
  analysis_run_id uuid not null,
  item_kind text not null check (item_kind in ('finding', 'question', 'negotiation_concept', 'professional_review_item', 'downstream_impact_candidate')),
  finding_group text check (finding_group is null or finding_group in ('benefit', 'risk', 'unusual_term', 'missing_protection', 'missing_information', 'conflict', 'amendment_impact', 'obligation', 'professional_review')),
  finding_type text,
  category text,
  severity text check (severity is null or severity in ('informational', 'low', 'moderate', 'high', 'critical', 'unknown')),
  title text not null,
  summary text not null,
  perspective text not null references public.contract_perspective_definitions(perspective_key),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  professional_review_required boolean not null default false,
  downstream_mutation_allowed boolean not null default false,
  status text not null default 'current' check (status in ('current', 'open', 'candidate_only', 'needs_review', 'stale', 'superseded')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_perspective_items_no_mutation check (downstream_mutation_allowed = false),
  constraint contract_perspective_items_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_perspective_items_run_fk foreign key (workspace_id, analysis_run_id) references public.contract_perspective_analysis_runs(workspace_id, id) on delete cascade,
  constraint contract_perspective_items_deal_fk foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contract_perspective_items_property_fk foreign key (workspace_id, property_id) references public.properties(workspace_id, id) on delete restrict,
  unique (workspace_id, id)
);

create table if not exists public.contract_amendment_impact_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  contract_id uuid not null,
  analysis_run_id uuid not null,
  relationship_id uuid,
  base_contract_id uuid,
  amendment_contract_id uuid,
  impact_type text not null,
  impact_summary text not null,
  changed_term_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(changed_term_ids) = 'array'),
  superseded_term_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(superseded_term_ids) = 'array'),
  added_term_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(added_term_ids) = 'array'),
  changed_deadline_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(changed_deadline_ids) = 'array'),
  conflict_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(conflict_ids) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  professional_review_required boolean not null default true,
  downstream_mutation_allowed boolean not null default false,
  deterministic_hash text not null,
  status text not null default 'candidate_only' check (status in ('candidate_only', 'accepted_for_review', 'superseded', 'stale')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_amendment_impacts_no_mutation check (downstream_mutation_allowed = false),
  constraint contract_amendment_impacts_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_amendment_impacts_run_fk foreign key (workspace_id, analysis_run_id) references public.contract_perspective_analysis_runs(workspace_id, id) on delete cascade,
  constraint contract_amendment_impacts_relationship_fk foreign key (workspace_id, relationship_id) references public.contract_relationships(workspace_id, id) on delete set null,
  constraint contract_amendment_impacts_base_contract_fk foreign key (workspace_id, base_contract_id) references public.contracts(workspace_id, id) on delete set null,
  constraint contract_amendment_impacts_amendment_contract_fk foreign key (workspace_id, amendment_contract_id) references public.contracts(workspace_id, id) on delete set null,
  constraint contract_amendment_impacts_deal_fk foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contract_amendment_impacts_property_fk foreign key (workspace_id, property_id) references public.properties(workspace_id, id) on delete restrict,
  unique (workspace_id, id),
  constraint contract_amendment_impacts_run_hash_unique unique (workspace_id, analysis_run_id, deterministic_hash)
);

create unique index if not exists idx_contract_perspective_runs_current
  on public.contract_perspective_analysis_runs(workspace_id, contract_id, perspective)
  where is_current is true;
create index if not exists idx_contract_perspective_runs_contract on public.contract_perspective_analysis_runs(workspace_id, contract_id, generated_at desc);
create index if not exists idx_contract_perspective_runs_deal on public.contract_perspective_analysis_runs(workspace_id, deal_id, generated_at desc);
create index if not exists idx_contract_perspective_runs_property on public.contract_perspective_analysis_runs(workspace_id, property_id, generated_at desc);
create index if not exists idx_contract_perspective_runs_prior_fk on public.contract_perspective_analysis_runs(workspace_id, prior_valid_analysis_run_id);
create index if not exists idx_contract_perspective_runs_created_by_fk on public.contract_perspective_analysis_runs(created_by);
create index if not exists idx_contract_perspective_runs_updated_by_fk on public.contract_perspective_analysis_runs(updated_by);

create index if not exists idx_contract_perspective_items_run on public.contract_perspective_analysis_items(workspace_id, analysis_run_id);
create index if not exists idx_contract_perspective_items_contract_kind on public.contract_perspective_analysis_items(workspace_id, contract_id, item_kind, finding_group);
create index if not exists idx_contract_perspective_items_deal on public.contract_perspective_analysis_items(workspace_id, deal_id);
create index if not exists idx_contract_perspective_items_property on public.contract_perspective_analysis_items(workspace_id, property_id);
create index if not exists idx_contract_perspective_items_created_by_fk on public.contract_perspective_analysis_items(created_by);
create index if not exists idx_contract_perspective_items_updated_by_fk on public.contract_perspective_analysis_items(updated_by);

create index if not exists idx_contract_amendment_impacts_run on public.contract_amendment_impact_results(workspace_id, analysis_run_id);
create index if not exists idx_contract_amendment_impacts_contract on public.contract_amendment_impact_results(workspace_id, contract_id);
create index if not exists idx_contract_amendment_impacts_relationship_fk on public.contract_amendment_impact_results(workspace_id, relationship_id);
create index if not exists idx_contract_amendment_impacts_base_contract_fk on public.contract_amendment_impact_results(workspace_id, base_contract_id);
create index if not exists idx_contract_amendment_impacts_amendment_contract_fk on public.contract_amendment_impact_results(workspace_id, amendment_contract_id);
create index if not exists idx_contract_amendment_impacts_created_by_fk on public.contract_amendment_impact_results(created_by);
create index if not exists idx_contract_amendment_impacts_updated_by_fk on public.contract_amendment_impact_results(updated_by);

drop trigger if exists touch_contract_perspective_analysis_runs on public.contract_perspective_analysis_runs;
create trigger touch_contract_perspective_analysis_runs before update on public.contract_perspective_analysis_runs for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_perspective_analysis_items on public.contract_perspective_analysis_items;
create trigger touch_contract_perspective_analysis_items before update on public.contract_perspective_analysis_items for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_amendment_impact_results on public.contract_amendment_impact_results;
create trigger touch_contract_amendment_impact_results before update on public.contract_amendment_impact_results for each row execute function public.touch_versioned_record();

alter table public.contract_perspective_analysis_runs enable row level security;
alter table public.contract_perspective_analysis_items enable row level security;
alter table public.contract_amendment_impact_results enable row level security;

create policy "contract perspective analysis runs read workspace members" on public.contract_perspective_analysis_runs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "contract perspective analysis runs no direct insert" on public.contract_perspective_analysis_runs for insert to authenticated with check (false);
create policy "contract perspective analysis runs no direct update" on public.contract_perspective_analysis_runs for update to authenticated using (false) with check (false);
create policy "contract perspective analysis runs no direct delete" on public.contract_perspective_analysis_runs for delete to authenticated using (false);

create policy "contract perspective analysis items read workspace members" on public.contract_perspective_analysis_items for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "contract perspective analysis items no direct insert" on public.contract_perspective_analysis_items for insert to authenticated with check (false);
create policy "contract perspective analysis items no direct update" on public.contract_perspective_analysis_items for update to authenticated using (false) with check (false);
create policy "contract perspective analysis items no direct delete" on public.contract_perspective_analysis_items for delete to authenticated using (false);

create policy "contract amendment impacts read workspace members" on public.contract_amendment_impact_results for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "contract amendment impacts no direct insert" on public.contract_amendment_impact_results for insert to authenticated with check (false);
create policy "contract amendment impacts no direct update" on public.contract_amendment_impact_results for update to authenticated using (false) with check (false);
create policy "contract amendment impacts no direct delete" on public.contract_amendment_impact_results for delete to authenticated using (false);

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

drop view if exists public.contract_projection;

create or replace view public.contract_projection
with (security_invoker = true)
as
select
  contract.id as contract_id,
  contract.version as contract_version,
  contract.workspace_id,
  contract.deal_id,
  contract.property_id,
  contract.contract_type,
  contract.title,
  contract.perspective,
  contract.status,
  contract.verification_state,
  contract.analysis_state,
  contract.classification_state,
  contract.extraction_freshness_state,
  contract.confidence,
  count(distinct evidence_link.id) filter (where evidence_link.archived_at is null) as evidence_count,
  count(distinct party.id) filter (where party.archived_at is null) as party_count,
  count(distinct party.id) filter (where party.verification_state in ('verified', 'professional_verified') and party.archived_at is null) as verified_party_count,
  count(distinct party.id) filter (where party.verification_state in ('unverified', 'unknown', 'conflicted', 'source_backed') and party.archived_at is null) as unverified_party_count,
  count(distinct term.id) filter (where term.archived_at is null) as term_count,
  count(distinct term.id) filter (where term.proposal_state = 'accepted' and term.archived_at is null) as accepted_term_count,
  count(distinct term.id) filter (where term.proposal_state = 'proposed' and term.archived_at is null) as proposed_term_count,
  count(distinct term.id) filter (where term.term_category = 'contingency' and term.archived_at is null) + count(distinct deadline.id) filter (where deadline.status = 'pending_verification' and deadline.archived_at is null) as contingency_count,
  count(distinct relationship.id) filter (where relationship.relationship_type in ('amends','amended_by','supersedes','superseded_by','supplements','restates') and relationship.archived_at is null)
    + count(distinct base_match.id) filter (where base_match.archived_at is null) as amendment_count,
  count(distinct deadline.id) filter (where deadline.archived_at is null) as deadline_count,
  count(distinct finding.id) filter (where finding.archived_at is null) as finding_count,
  count(distinct finding.id) filter (where finding.finding_category in ('missing_party','missing_signature','incomplete_legal_description','missing_contingency_detail','missing_base_contract','unreadable_clause','incomplete_source') and finding.archived_at is null) as missing_input_count,
  count(distinct conflict.id) filter (where conflict.resolution_state in ('unresolved', 'under_review', 'professional_review_required') and conflict.archived_at is null) as unresolved_conflict_count,
  count(distinct question.id) filter (where question.status in ('open', 'in_progress') and question.archived_at is null) as open_question_count,
  count(distinct finding.id) filter (where finding.professional_review_required and finding.archived_at is null)
    + count(distinct conflict.id) filter (where conflict.professional_review_required and conflict.archived_at is null)
    + count(distinct supersession.id) filter (where supersession.professional_review_required and supersession.archived_at is null)
    + count(distinct base_match.id) filter (where base_match.professional_review_required and base_match.archived_at is null)
    + coalesce(max(perspective_run.professional_review_count), 0) as professional_review_count,
  contract.prior_valid_analysis_run_id is not null and contract.analysis_state = 'failed_with_prior_analysis' as prior_valid_after_failure,
  bool_or(finding.professional_review_required) filter (where finding.archived_at is null)
    or bool_or(deadline.professional_review_required) filter (where deadline.archived_at is null)
    or bool_or(conflict.professional_review_required) filter (where conflict.archived_at is null)
    or bool_or(base_match.professional_review_required) filter (where base_match.archived_at is null)
    or bool_or(supersession.professional_review_required) filter (where supersession.archived_at is null)
    or bool_or(result.status in ('uncertain', 'missing_trigger', 'missing_rule', 'failed_with_prior_valid')) filter (where deadline.archived_at is null)
    or bool_or(perspective_run.analysis_state in ('current_with_conflicts', 'professional_review_required', 'failed_with_prior_analysis')) filter (where perspective_run.is_current is true)
    or contract.analysis_state = 'professional_review_required'
    as professional_review_required,
  jsonb_build_object(
    'sourceEvidenceId', contract.source_evidence_id,
    'classificationState', contract.classification_state,
    'extractionFreshnessState', contract.extraction_freshness_state,
    'sourceAnchoredTermCount', count(distinct term.id) filter (where term.source_anchor <> '{}'::jsonb and term.archived_at is null),
    'sourceAnchoredExtractionCount', count(distinct extraction.id) filter (where extraction.source_anchor <> '{}'::jsonb and extraction.archived_at is null),
    'verificationRequiredCount',
      count(distinct term.id) filter (where term.verification_state in ('unverified', 'unknown', 'conflicted') and term.archived_at is null)
      + count(distinct deadline.id) filter (where deadline.verification_state in ('unverified', 'unknown', 'conflicted') and deadline.archived_at is null)
      + count(distinct party.id) filter (where party.verification_state in ('unverified', 'unknown', 'conflicted') and party.archived_at is null),
    'deadlineCounts',
      jsonb_build_object(
        'current', count(distinct deadline.id) filter (where result.status = 'current' and result.is_current is true and deadline.archived_at is null),
        'proposed', count(distinct deadline.id) filter (where result.status = 'proposed' and deadline.archived_at is null),
        'uncertain', count(distinct deadline.id) filter (where result.status in ('uncertain', 'missing_trigger', 'missing_rule') and deadline.archived_at is null),
        'missed', count(distinct deadline.id) filter (where result.status = 'missed' and result.is_current is true and deadline.archived_at is null),
        'stale', count(distinct deadline.id) filter (where result.status in ('stale', 'failed_with_prior_valid') and deadline.archived_at is null),
        'conflict', count(distinct deadline.id) filter (where result.warnings ? 'DEADLINE_CONFLICT' and deadline.archived_at is null)
      ),
    'perspectiveAnalysis',
      jsonb_build_object(
        'state', max(perspective_run.analysis_state) filter (where perspective_run.is_current is true),
        'perspective', max(perspective_run.perspective) filter (where perspective_run.is_current is true),
        'benefits', coalesce(max(perspective_run.benefit_count), 0),
        'risks', coalesce(max(perspective_run.risk_count), 0),
        'unusualTerms', coalesce(max(perspective_run.unusual_term_count), 0),
        'missingProtections', coalesce(max(perspective_run.missing_protection_count), 0),
        'missingInformation', coalesce(max(perspective_run.missing_information_count), 0),
        'conflicts', coalesce(max(perspective_run.conflict_count), 0),
        'amendmentImpacts', coalesce(max(perspective_run.amendment_impact_count), 0),
        'obligations', coalesce(max(perspective_run.obligation_count), 0),
        'questions', coalesce(max(perspective_run.question_count), 0),
        'negotiationConcepts', coalesce(max(perspective_run.negotiation_concept_count), 0),
        'downstreamCandidates', coalesce(max(perspective_run.downstream_candidate_count), 0),
        'priorValidAvailable', bool_or(perspective_run.prior_valid_preserved) filter (where perspective_run.is_current is true)
      ),
    'nextDeadlineDueAt', min(result.due_at) filter (where result.status in ('current', 'missed') and result.is_current is true and deadline.archived_at is null)
  ) as verification_summary,
  case
    when contract.archived_at is not null then 'archived'
    when contract.status = 'superseded' or contract.analysis_state = 'superseded' then 'superseded'
    when contract.status = 'expired' or contract.analysis_state = 'expired' then 'expired'
    when count(distinct perspective_run.id) filter (where perspective_run.is_current is true and perspective_run.analysis_state in ('current_with_conflicts', 'professional_review_required', 'failed_with_prior_analysis', 'stale')) > 0 then max(perspective_run.analysis_state) filter (where perspective_run.is_current is true)
    when contract.analysis_state in ('no_contract','uploaded','processing','partial','awaiting_verification','stale','failed_with_prior_analysis','professional_review_required','current_with_conflicts','current') then contract.analysis_state
    when count(distinct conflict.id) filter (where conflict.resolution_state in ('unresolved', 'under_review', 'professional_review_required') and conflict.archived_at is null) > 0 then 'current_with_conflicts'
    when count(distinct result.id) filter (where result.status in ('uncertain', 'missing_trigger', 'missing_rule') and result.is_current is false and deadline.archived_at is null) > 0 then 'current_with_conflicts'
    else 'partial'
  end as projection_state,
  contract.updated_at,
  now() as loaded_at,
  count(distinct deadline.id) filter (where result.status = 'current' and result.is_current is true and deadline.archived_at is null) as verified_current_deadline_count,
  count(distinct deadline.id) filter (where result.status = 'proposed' and deadline.archived_at is null) as proposed_deadline_count,
  count(distinct deadline.id) filter (where result.status in ('uncertain', 'missing_trigger', 'missing_rule') and deadline.archived_at is null) as uncertain_deadline_count,
  count(distinct deadline.id) filter (where result.status = 'missed' and result.is_current is true and deadline.archived_at is null) as missed_deadline_count,
  count(distinct deadline.id) filter (where result.status in ('stale', 'failed_with_prior_valid') and deadline.archived_at is null) as deadline_stale_count,
  count(distinct deadline.id) filter (where result.warnings ? 'DEADLINE_CONFLICT' and deadline.archived_at is null) as deadline_conflict_count,
  min(result.due_at) filter (where result.status in ('current', 'missed') and result.is_current is true and deadline.archived_at is null) as next_deadline_due_at,
  max(perspective_run.analysis_state) filter (where perspective_run.is_current is true) as current_perspective_analysis_state,
  max(perspective_run.perspective) filter (where perspective_run.is_current is true) as current_perspective,
  coalesce(max(perspective_run.benefit_count), 0) as perspective_benefit_count,
  coalesce(max(perspective_run.risk_count), 0) as perspective_risk_count,
  coalesce(max(perspective_run.unusual_term_count), 0) as perspective_unusual_term_count,
  coalesce(max(perspective_run.missing_protection_count), 0) as perspective_missing_protection_count,
  coalesce(max(perspective_run.missing_information_count), 0) as perspective_missing_information_count,
  coalesce(max(perspective_run.conflict_count), 0) as perspective_conflict_count,
  coalesce(max(perspective_run.amendment_impact_count), 0) as perspective_amendment_impact_count,
  coalesce(max(perspective_run.obligation_count), 0) as perspective_obligation_count,
  coalesce(max(perspective_run.question_count), 0) as perspective_question_count,
  coalesce(max(perspective_run.negotiation_concept_count), 0) as perspective_negotiation_concept_count,
  coalesce(max(perspective_run.downstream_candidate_count), 0) as perspective_downstream_candidate_count,
  bool_or(perspective_run.prior_valid_preserved) filter (where perspective_run.is_current is true) as perspective_prior_valid_available
from public.contracts contract
left join public.contract_evidence_links evidence_link on evidence_link.workspace_id = contract.workspace_id and evidence_link.contract_id = contract.id
left join public.contract_parties party on party.workspace_id = contract.workspace_id and party.contract_id = contract.id
left join public.contract_terms term on term.workspace_id = contract.workspace_id and term.contract_id = contract.id
left join public.contract_deadlines deadline on deadline.workspace_id = contract.workspace_id and deadline.contract_id = contract.id
left join public.contract_deadline_results result on result.workspace_id = deadline.workspace_id and result.contract_deadline_id = deadline.id
left join public.contract_findings finding on finding.workspace_id = contract.workspace_id and finding.contract_id = contract.id
left join public.contract_conflicts conflict on conflict.workspace_id = contract.workspace_id and conflict.contract_id = contract.id
left join public.contract_questions question on question.workspace_id = contract.workspace_id and question.contract_id = contract.id
left join public.contract_relationships relationship on relationship.workspace_id = contract.workspace_id and relationship.contract_id = contract.id
left join public.contract_base_match_candidates base_match on base_match.workspace_id = contract.workspace_id and base_match.contract_id = contract.id
left join public.contract_supersession_candidates supersession on supersession.workspace_id = contract.workspace_id and supersession.contract_id = contract.id
left join public.contract_extraction_items extraction on extraction.workspace_id = contract.workspace_id and extraction.contract_id = contract.id
left join public.contract_perspective_analysis_runs perspective_run on perspective_run.workspace_id = contract.workspace_id and perspective_run.contract_id = contract.id and perspective_run.is_current is true
group by contract.id;

create or replace function public.load_contract_perspective_analysis_detail(target_contract_id uuid)
returns table (
  record_type text,
  record_id uuid,
  record_version integer,
  workspace_id uuid,
  contract_id uuid,
  deal_id uuid,
  property_id uuid,
  label text,
  status text,
  verification_state text,
  source_evidence_id uuid,
  source_anchor jsonb,
  payload jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_contract public.contracts%rowtype;
begin
  target_contract := public.authorized_contract(target_contract_id);
  return query
  select 'perspective_analysis_run'::text, run.id, run.version, run.workspace_id, run.contract_id, run.deal_id, run.property_id, run.perspective, run.analysis_state, run.completeness_state, null::uuid, '{}'::jsonb, run.result_payload, run.updated_at
  from public.contract_perspective_analysis_runs run
  where run.workspace_id = target_contract.workspace_id and run.contract_id = target_contract.id
  union all
  select 'perspective_analysis_item'::text, item.id, item.version, item.workspace_id, item.contract_id, item.deal_id, item.property_id, item.title, item.status, coalesce(item.severity, 'unknown'), null::uuid, '{}'::jsonb, item.payload, item.updated_at
  from public.contract_perspective_analysis_items item
  where item.workspace_id = target_contract.workspace_id and item.contract_id = target_contract.id
  union all
  select 'amendment_impact_result'::text, impact.id, impact.version, impact.workspace_id, impact.contract_id, impact.deal_id, impact.property_id, impact.impact_type, impact.status, case when impact.professional_review_required then 'unknown' else 'source_backed' end, null::uuid, '{}'::jsonb, to_jsonb(impact.*) - 'workspace_id' - 'contract_id' - 'deal_id' - 'property_id', impact.updated_at
  from public.contract_amendment_impact_results impact
  where impact.workspace_id = target_contract.workspace_id and impact.contract_id = target_contract.id;
end;
$$;

revoke insert, update, delete on public.contract_perspective_analysis_runs from authenticated;
revoke insert, update, delete on public.contract_perspective_analysis_items from authenticated;
revoke insert, update, delete on public.contract_amendment_impact_results from authenticated;
grant select on public.contract_perspective_analysis_runs to authenticated;
grant select on public.contract_perspective_analysis_items to authenticated;
grant select on public.contract_amendment_impact_results to authenticated;

revoke execute on function public.record_contract_perspective_analysis_result(uuid, jsonb, integer, text) from public, anon;
grant execute on function public.record_contract_perspective_analysis_result(uuid, jsonb, integer, text) to authenticated;
revoke execute on function public.load_contract_perspective_analysis_detail(uuid) from public, anon;
grant execute on function public.load_contract_perspective_analysis_detail(uuid) to authenticated;

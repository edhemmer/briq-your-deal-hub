-- Specification 011 Slice 2 repair: replace staging proposal RPCs with
-- name-resolution-safe definitions.

create or replace function public.propose_contract_party_match(target_contract_party_id uuid, match_input jsonb, idempotency_key text)
returns table (contract_party_match_proposal_id uuid, contract_party_match_proposal_version integer, workspace_id uuid, match_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_party public.contract_parties%rowtype;
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(match_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to propose ContractIQ party match.' using errcode = '42501'; end if;
  select * into target_party from public.contract_parties party where party.id = target_contract_party_id and party.archived_at is null;
  if target_party.id is null then raise exception 'Contract party was not found.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(target_party.contract_id);
  if target_party.workspace_id <> target_contract.workspace_id then raise exception 'Contract party is not available in this workspace.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'propose_contract_party_match', idempotency_key, safe_input);
  insert into public.contract_party_match_proposals (
    workspace_id, contract_id, contract_party_id, target_type, target_contact_id, target_organization_id, match_state,
    deterministic_signals, source_anchor, confidence, analysis_run_id, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, target_party.id, nullif(safe_input ->> 'targetType', ''),
    nullif(safe_input ->> 'targetContactId', '')::uuid, nullif(safe_input ->> 'targetOrganizationId', '')::uuid,
    coalesce(nullif(safe_input ->> 'matchState', ''), 'manual_review_required'),
    coalesce(safe_input -> 'deterministicSignals', '[]'::jsonb), coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50), nullif(safe_input ->> 'analysisRunId', '')::uuid,
    current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_party_id, coalesce(target_contact_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(target_organization_id, '00000000-0000-0000-0000-000000000000'::uuid), match_state) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, match_state into contract_party_match_proposal_id, contract_party_match_proposal_version, workspace_id, match_state;
  update public.contract_parties party set match_state = propose_contract_party_match.match_state, updated_by = current_user_id where party.id = target_party.id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.party_match_proposed', 'contract_party_match_proposal', contract_party_match_proposal_id, contract_party_match_proposal_version, 'propose_contract_party_match', command.idempotency_key || ':contract.party_match_proposed', jsonb_build_object('contract_id', target_contract.id, 'contract_party_id', target_party.id, 'match_state', match_state))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.party_match_proposed', 'contract_party_match_proposals', 'contract_party_match_proposal', contract_party_match_proposal_id, 'propose_contract_party_match', command.idempotency_key || ':audit', jsonb_build_object('contract_party_id', target_party.id, 'match_state', match_state), array['match_state','source_anchor'], jsonb_build_object('proposal_only', true))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_party_match_proposal_id', contract_party_match_proposal_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.propose_contract_base_match(target_contract_id uuid, match_input jsonb, idempotency_key text)
returns table (contract_base_match_candidate_id uuid, contract_base_match_candidate_version integer, workspace_id uuid, match_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(match_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to propose base contract match.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'propose_contract_base_match', idempotency_key, safe_input);
  insert into public.contract_base_match_candidates (
    workspace_id, contract_id, candidate_base_contract_id, match_state, evidence_signals, source_evidence_id, source_anchor,
    confidence, professional_review_required, analysis_run_id, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, nullif(safe_input ->> 'candidateBaseContractId', '')::uuid,
    coalesce(nullif(safe_input ->> 'matchState', ''), 'manual_review_required'), coalesce(safe_input -> 'evidenceSignals', '[]'::jsonb),
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, true),
    nullif(safe_input ->> 'analysisRunId', '')::uuid, current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_id, coalesce(candidate_base_contract_id, '00000000-0000-0000-0000-000000000000'::uuid), match_state) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, match_state into contract_base_match_candidate_id, contract_base_match_candidate_version, workspace_id, match_state;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.base_match_proposed', 'contract_base_match_candidate', contract_base_match_candidate_id, contract_base_match_candidate_version, 'propose_contract_base_match', command.idempotency_key || ':contract.base_match_proposed', jsonb_build_object('contract_id', target_contract.id, 'match_state', match_state, 'uses_upload_order', false))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.base_match_proposed', 'contract_base_match_candidates', 'contract_base_match_candidate', contract_base_match_candidate_id, 'propose_contract_base_match', command.idempotency_key || ':audit', jsonb_build_object('match_state', match_state), array['match_state','evidence_signals','source_anchor'], jsonb_build_object('proposal_only', true, 'upload_order_authority', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_base_match_candidate_id', contract_base_match_candidate_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_contract_supersession_candidate(target_contract_id uuid, supersession_input jsonb, idempotency_key text)
returns table (contract_supersession_candidate_id uuid, contract_supersession_candidate_version integer, workspace_id uuid, supersession_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(supersession_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to record ContractIQ supersession candidate.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb) = '{}'::jsonb then raise exception 'SOURCE_ANCHOR_INCOMPLETE' using errcode = '22023'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'record_contract_supersession_candidate', idempotency_key, safe_input);
  insert into public.contract_supersession_candidates (
    workspace_id, contract_id, old_contract_term_id, replacement_contract_term_id, relationship_id, source_evidence_id,
    source_anchor, supersession_state, evidence_signals, confidence, professional_review_required, analysis_run_id, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, nullif(safe_input ->> 'oldContractTermId', '')::uuid,
    nullif(safe_input ->> 'replacementContractTermId', '')::uuid, nullif(safe_input ->> 'relationshipId', '')::uuid,
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'supersessionState', ''), 'superseded_candidate'),
    coalesce(safe_input -> 'evidenceSignals', '[]'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, true),
    nullif(safe_input ->> 'analysisRunId', '')::uuid, current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_id, coalesce(old_contract_term_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(replacement_contract_term_id, '00000000-0000-0000-0000-000000000000'::uuid)) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, supersession_state into contract_supersession_candidate_id, contract_supersession_candidate_version, workspace_id, supersession_state;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.supersession_candidate_recorded', 'contract_supersession_candidate', contract_supersession_candidate_id, contract_supersession_candidate_version, 'record_contract_supersession_candidate', command.idempotency_key || ':contract.supersession_candidate_recorded', jsonb_build_object('contract_id', target_contract.id, 'supersession_state', supersession_state))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.supersession_candidate_recorded', 'contract_supersession_candidates', 'contract_supersession_candidate', contract_supersession_candidate_id, 'record_contract_supersession_candidate', command.idempotency_key || ':audit', jsonb_build_object('supersession_state', supersession_state), array['supersession_state','source_anchor'], jsonb_build_object('proposal_only', true))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_supersession_candidate_id', contract_supersession_candidate_id) where id = command.id;
  return next;
end;
$$;

revoke execute on function public.propose_contract_party_match(uuid, jsonb, text) from public, anon;
revoke execute on function public.propose_contract_base_match(uuid, jsonb, text) from public, anon;
revoke execute on function public.record_contract_supersession_candidate(uuid, jsonb, text) from public, anon;
grant execute on function public.propose_contract_party_match(uuid, jsonb, text) to authenticated;
grant execute on function public.propose_contract_base_match(uuid, jsonb, text) to authenticated;
grant execute on function public.record_contract_supersession_candidate(uuid, jsonb, text) to authenticated;

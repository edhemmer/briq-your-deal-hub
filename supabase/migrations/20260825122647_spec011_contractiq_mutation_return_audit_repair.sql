create or replace function public.set_contract_term_acceptance(target_contract_term_id uuid, acceptance_state text, expected_version integer, idempotency_key text, decision_reason text default null)
returns table (contract_term_id uuid, contract_term_version integer, contract_id uuid, workspace_id uuid, proposal_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  existing_term public.contract_terms%rowtype;
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  normalized_state text := nullif(btrim(acceptance_state), '');
  event_name text;
begin
  if current_user_id is null then raise exception 'Authentication required to decide ContractIQ terms.' using errcode = '42501'; end if;
  if normalized_state not in ('accepted', 'rejected', 'disputed', 'superseded', 'expired') then raise exception 'Unsupported ContractIQ term decision.' using errcode = '22023'; end if;
  select * into existing_term from public.contract_terms where id = target_contract_term_id and archived_at is null for update;
  if existing_term.id is null then raise exception 'Contract term is not available.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(existing_term.contract_id);
  if not public.has_workspace_permission(existing_term.workspace_id, 'deals:manage') then raise exception 'You do not have permission to decide ContractIQ terms.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(existing_term.workspace_id, target_contract.deal_id, target_contract.property_id, existing_term.contract_id, 'set_contract_term_acceptance', idempotency_key, jsonb_build_object('termId', target_contract_term_id, 'acceptanceState', normalized_state, 'expectedVersion', expected_version, 'reason', decision_reason));
  if command.result ? 'contract_term_id' then
    select term.id, term.version, term.contract_id, term.workspace_id, term.proposal_state into contract_term_id, contract_term_version, contract_id, workspace_id, proposal_state from public.contract_terms term where term.id = (command.result ->> 'contract_term_id')::uuid;
    return next; return;
  end if;
  if existing_term.version <> expected_version then raise exception 'This contract term changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  update public.contract_terms as term
  set proposal_state = normalized_state,
      accepted_by = case when normalized_state = 'accepted' then current_user_id else term.accepted_by end,
      accepted_at = case when normalized_state = 'accepted' then now() else term.accepted_at end,
      rejected_by = case when normalized_state = 'rejected' then current_user_id else term.rejected_by end,
      rejected_at = case when normalized_state = 'rejected' then now() else term.rejected_at end,
      decision_reason = set_contract_term_acceptance.decision_reason,
      updated_by = current_user_id
  where term.id = existing_term.id
  returning term.id, term.version, term.contract_id, term.workspace_id, term.proposal_state into contract_term_id, contract_term_version, contract_id, workspace_id, proposal_state;
  event_name := case when normalized_state = 'accepted' then 'contract.term_accepted' else 'contract.term_rejected' end;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_term.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, event_name, 'contract_term', contract_term_id, contract_term_version, 'set_contract_term_acceptance', command.idempotency_key || ':' || event_name, jsonb_build_object('contract_id', contract_id, 'contract_term_id', contract_term_id, 'proposal_state', proposal_state, 'downstream_mutation', false))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_term.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, event_name, 'contract_terms', 'contract_term', contract_term_id, 'set_contract_term_acceptance', command.idempotency_key || ':audit', to_jsonb(existing_term), jsonb_build_object('contract_term_id', contract_term_id, 'version', contract_term_version, 'proposal_state', proposal_state), jsonb_build_object('downstream_mutation', false, 'professional_legal_conclusion', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_term_id', contract_term_id, 'contract_term_version', contract_term_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.resolve_contract_conflict(target_contract_conflict_id uuid, resolution_input jsonb, expected_version integer, idempotency_key text)
returns table (contract_conflict_id uuid, contract_conflict_version integer, contract_id uuid, workspace_id uuid, resolution_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(resolution_input, '{}'::jsonb));
  existing_conflict public.contract_conflicts%rowtype;
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to resolve ContractIQ conflicts.' using errcode = '42501'; end if;
  select * into existing_conflict from public.contract_conflicts where id = target_contract_conflict_id and archived_at is null for update;
  if existing_conflict.id is null then raise exception 'Contract conflict is not available.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(existing_conflict.contract_id);
  if not public.has_workspace_permission(existing_conflict.workspace_id, 'deals:manage') then raise exception 'You do not have permission to resolve ContractIQ conflicts.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(existing_conflict.workspace_id, target_contract.deal_id, target_contract.property_id, existing_conflict.contract_id, 'resolve_contract_conflict', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'contract_conflict_id' then
    select conflict.id, conflict.version, conflict.contract_id, conflict.workspace_id, conflict.resolution_state into contract_conflict_id, contract_conflict_version, contract_id, workspace_id, resolution_state from public.contract_conflicts conflict where conflict.id = (command.result ->> 'contract_conflict_id')::uuid;
    return next; return;
  end if;
  if existing_conflict.version <> expected_version then raise exception 'This contract conflict changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  update public.contract_conflicts as conflict
  set resolution_state = coalesce(nullif(btrim(safe_input ->> 'resolutionState'), ''), 'resolved'),
      resolution_notes = coalesce(nullif(btrim(safe_input ->> 'resolutionNotes'), ''), conflict.resolution_notes),
      resolved_by = coalesce(conflict.resolved_by, current_user_id),
      resolved_at = coalesce(conflict.resolved_at, now()),
      professional_review_required = case when safe_input ? 'professionalReviewRequired' then coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, conflict.professional_review_required) else conflict.professional_review_required end,
      updated_by = current_user_id
  where conflict.id = existing_conflict.id
  returning conflict.id, conflict.version, conflict.contract_id, conflict.workspace_id, conflict.resolution_state into contract_conflict_id, contract_conflict_version, contract_id, workspace_id, resolution_state;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_conflict.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.conflict_resolution_recorded', 'contract_conflict', contract_conflict_id, contract_conflict_version, 'resolve_contract_conflict', command.idempotency_key || ':contract.conflict_resolution_recorded', jsonb_build_object('contract_id', contract_id, 'contract_conflict_id', contract_conflict_id, 'resolution_state', resolution_state, 'downstream_mutation', false))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_conflict.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.conflict_resolution_recorded', 'contract_conflicts', 'contract_conflict', contract_conflict_id, 'resolve_contract_conflict', command.idempotency_key || ':audit', to_jsonb(existing_conflict), jsonb_build_object('contract_conflict_id', contract_conflict_id, 'version', contract_conflict_version, 'resolution_state', resolution_state), jsonb_build_object('downstream_mutation', false, 'professional_review_required', true))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_conflict_id', contract_conflict_id, 'contract_conflict_version', contract_conflict_version) where id = command.id;
  return next;
end;
$$;

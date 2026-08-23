-- Specification 010 Slice 1 repair: remove an unused governance record lookup
-- from finding acceptance decisions so schema lint remains clean.

create or replace function public.set_governance_finding_acceptance(target_governance_finding_id uuid, target_acceptance_state text, expected_version integer, idempotency_key text, decision_reason text default null)
returns table (governance_finding_id uuid, governance_finding_version integer, workspace_id uuid, governance_record_id uuid, acceptance_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  existing_finding public.governance_findings%rowtype;
  command public.governance_command_requests%rowtype;
  event_name text;
begin
  if current_user_id is null then raise exception 'Authentication required to decide governance findings.' using errcode = '42501'; end if;
  if target_acceptance_state not in ('accepted', 'rejected', 'disputed') then raise exception 'Governance finding acceptance must be accepted, rejected, or disputed.' using errcode = '22023'; end if;
  select * into existing_finding from public.governance_findings where id = target_governance_finding_id and archived_at is null for update;
  if existing_finding.id is null then raise exception 'Governance finding is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_finding.workspace_id, 'deals:manage') then raise exception 'You do not have permission to decide GovernanceIQ findings.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(existing_finding.workspace_id, existing_finding.deal_id, existing_finding.property_id, existing_finding.governance_record_id, 'set_governance_finding_acceptance', idempotency_key, jsonb_build_object('expectedVersion', expected_version, 'acceptanceState', target_acceptance_state, 'reason', decision_reason));
  if command.result ? 'governance_finding_id' then
    select id, version, workspace_id, governance_record_id, acceptance_state into governance_finding_id, governance_finding_version, workspace_id, governance_record_id, acceptance_state from public.governance_findings where id = (command.result ->> 'governance_finding_id')::uuid;
    return next;
    return;
  end if;
  if existing_finding.version <> expected_version then raise exception 'This governance finding changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.governance_findings as finding
  set acceptance_state = target_acceptance_state,
      accepted_by = case when target_acceptance_state = 'accepted' then current_user_id else finding.accepted_by end,
      accepted_at = case when target_acceptance_state = 'accepted' then now() else finding.accepted_at end,
      rejected_by = case when target_acceptance_state in ('rejected', 'disputed') then current_user_id else finding.rejected_by end,
      rejected_at = case when target_acceptance_state in ('rejected', 'disputed') then now() else finding.rejected_at end,
      updated_by = current_user_id
  where finding.id = existing_finding.id
  returning id, version, workspace_id, governance_record_id, acceptance_state into governance_finding_id, governance_finding_version, workspace_id, governance_record_id, acceptance_state;

  event_name := case when target_acceptance_state = 'accepted' then 'governance.finding_accepted' when target_acceptance_state = 'rejected' then 'governance.finding_rejected' else 'governance.finding_disputed' end;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_finding.workspace_id, existing_finding.deal_id, existing_finding.property_id, current_user_id, event_name, 'governance_finding', governance_finding_id, governance_finding_version, 'set_governance_finding_acceptance', command.idempotency_key || ':' || event_name, jsonb_build_object('governance_record_id', governance_record_id, 'governance_finding_id', governance_finding_id, 'acceptance_state', acceptance_state, 'downstream_mutation', false))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_finding.workspace_id, existing_finding.deal_id, existing_finding.property_id, current_user_id, event_name, 'governance_findings', 'governance_finding', governance_finding_id, 'set_governance_finding_acceptance', command.idempotency_key || ':audit', to_jsonb(existing_finding), jsonb_build_object('acceptance_state', acceptance_state, 'version', governance_finding_version), jsonb_build_object('reason', decision_reason, 'downstream_mutation', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_finding_id', governance_finding_id, 'governance_finding_version', governance_finding_version) where id = command.id;
  return next;
end;
$$;

revoke all on function public.set_governance_finding_acceptance(uuid, text, integer, text, text) from public;
revoke execute on function public.set_governance_finding_acceptance(uuid, text, integer, text, text) from public, anon;
grant execute on function public.set_governance_finding_acceptance(uuid, text, integer, text, text) to authenticated;

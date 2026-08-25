-- Specification 011 Slice 2 repair: replace staging stale-analysis RPC with
-- qualified table references.

create or replace function public.mark_contract_analysis_stale(target_contract_id uuid, stale_input jsonb, idempotency_key text)
returns table (contract_id uuid, workspace_id uuid, stale_analysis_count integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(stale_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to mark ContractIQ analysis stale.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'mark_contract_analysis_stale', idempotency_key, safe_input);
  update public.contract_analysis_runs run set status = 'stale', updated_by = current_user_id, updated_at = now()
  where run.workspace_id = target_contract.workspace_id and run.contract_id = target_contract.id and run.status in ('completed', 'partial');
  get diagnostics stale_analysis_count = row_count;
  update public.contracts contract set analysis_state = 'stale', extraction_freshness_state = 'stale', stale_reason = nullif(safe_input ->> 'reason', ''), updated_by = current_user_id where contract.id = target_contract.id;
  contract_id := target_contract.id;
  workspace_id := target_contract.workspace_id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.analysis_stale', 'contract', target_contract.id, target_contract.version, 'mark_contract_analysis_stale', command.idempotency_key || ':contract.analysis_stale', jsonb_build_object('reason', safe_input ->> 'reason'))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_id', contract_id, 'stale_analysis_count', stale_analysis_count) where id = command.id;
  return next;
end;
$$;

revoke execute on function public.mark_contract_analysis_stale(uuid, jsonb, text) from public, anon;
grant execute on function public.mark_contract_analysis_stale(uuid, jsonb, text) to authenticated;

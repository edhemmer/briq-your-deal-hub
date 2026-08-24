-- Spec 010 Slice 3 repair: clear new lint findings from Slice 3 RPCs.

create or replace function public.mark_governance_intelligence_stale(target_governance_record_id uuid, stale_input jsonb, idempotency_key text)
returns table (governance_record_id uuid, workspace_id uuid, stale_result_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(stale_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
  financial_count integer := 0;
  restriction_count integer := 0;
begin
  if current_user_id is null then raise exception 'Authentication required to mark GovernanceIQ intelligence stale.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'mark_governance_intelligence_stale', idempotency_key, safe_input);

  update public.governance_financial_analysis_results
  set stale_at = now(), analysis_state = 'stale', updated_by = current_user_id
  where public.governance_financial_analysis_results.workspace_id = target_record.workspace_id
    and public.governance_financial_analysis_results.governance_record_id = target_record.id
    and public.governance_financial_analysis_results.stale_at is null;
  get diagnostics financial_count = row_count;

  update public.governance_restriction_intelligence_results
  set stale_at = now(), updated_by = current_user_id
  where public.governance_restriction_intelligence_results.workspace_id = target_record.workspace_id
    and public.governance_restriction_intelligence_results.governance_record_id = target_record.id
    and public.governance_restriction_intelligence_results.stale_at is null;
  get diagnostics restriction_count = row_count;

  governance_record_id := target_record.id;
  workspace_id := target_record.workspace_id;
  stale_result_count := financial_count + restriction_count;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.analysis_stale', 'governance_record', target_record.id, target_record.version, 'mark_governance_intelligence_stale', command.idempotency_key || ':governance.analysis_stale', jsonb_build_object('reason', safe_input ->> 'reason', 'stale_result_count', stale_result_count))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('stale_result_count', stale_result_count) where id = command.id;
  return next;
end;
$$;

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.run_governance_restriction_intelligence(uuid,jsonb,text)'::regprocedure)
  into function_definition;
  function_definition := replace(function_definition, E'  inserted_result_id uuid;\n', '');
  function_definition := replace(function_definition, E'\n    returning id into inserted_result_id;', ';');
  execute function_definition;
end $$;

revoke all on function public.mark_governance_intelligence_stale(uuid, jsonb, text) from public;
revoke all on function public.run_governance_restriction_intelligence(uuid, jsonb, text) from public;
revoke execute on function public.mark_governance_intelligence_stale(uuid, jsonb, text) from public, anon;
revoke execute on function public.run_governance_restriction_intelligence(uuid, jsonb, text) from public, anon;
grant execute on function public.mark_governance_intelligence_stale(uuid, jsonb, text) to authenticated;
grant execute on function public.run_governance_restriction_intelligence(uuid, jsonb, text) to authenticated;

-- Specification 011 Slice 2 repair: replace staging analysis completion RPC
-- with fixed column qualification and preserved prior-valid behavior.

create or replace function public.complete_contract_analysis_run(target_analysis_run_id uuid, result_input jsonb, expected_version integer, idempotency_key text)
returns table (contract_analysis_run_id uuid, contract_analysis_run_version integer, contract_id uuid, workspace_id uuid, status text)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  existing_run public.contract_analysis_runs%rowtype;
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(result_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  next_status text := coalesce(nullif(safe_input ->> 'status', ''), 'completed');
begin
  if current_user_id is null then raise exception 'Authentication required to complete ContractIQ analysis.' using errcode = '42501'; end if;
  select * into existing_run from public.contract_analysis_runs run where run.id = target_analysis_run_id for update;
  if existing_run.id is null then raise exception 'ContractIQ analysis run was not found.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(existing_run.contract_id);
  if existing_run.version <> expected_version then raise exception 'ContractIQ analysis run version conflict.' using errcode = '40001'; end if;
  command := public.ensure_contract_command(existing_run.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'complete_contract_analysis_run', idempotency_key, safe_input);
  if command.result ? 'contract_analysis_run_id' then
    select run.id, run.version, run.contract_id, run.workspace_id, run.status
    into contract_analysis_run_id, contract_analysis_run_version, contract_id, workspace_id, status
    from public.contract_analysis_runs run where run.id = (command.result ->> 'contract_analysis_run_id')::uuid;
    return next;
    return;
  end if;
  update public.contract_analysis_runs as run
  set status = next_status,
      error_code = nullif(safe_input ->> 'errorCode', ''),
      safe_error_message = nullif(safe_input ->> 'safeErrorMessage', ''),
      result_hash = encode(digest(coalesce(safe_input ->> 'resultHash', (safe_input - 'safeErrorMessage')::text), 'sha256'), 'hex'),
      completed_at = now(),
      warnings = coalesce(safe_input -> 'warnings', run.warnings),
      version = run.version + 1,
      updated_by = current_user_id,
      updated_at = now()
  where run.id = existing_run.id
  returning run.id, run.version, run.contract_id, run.workspace_id, run.status
  into contract_analysis_run_id, contract_analysis_run_version, contract_id, workspace_id, status;
  update public.contracts contract
  set analysis_state = case
        when next_status in ('completed') then 'awaiting_verification'
        when next_status in ('partial') then 'partial'
        when next_status in ('provider_failed', 'failed', 'malformed_response') and existing_run.prior_valid_run_id is not null then 'failed_with_prior_analysis'
        when next_status in ('provider_failed', 'failed', 'malformed_response') then 'partial'
        when next_status = 'stale' then 'stale'
        else contract.analysis_state
      end,
      prior_valid_analysis_run_id = case when next_status in ('provider_failed', 'failed', 'malformed_response') then existing_run.prior_valid_run_id else contract.prior_valid_analysis_run_id end,
      extraction_freshness_state = case when next_status in ('provider_failed', 'failed', 'malformed_response') and existing_run.prior_valid_run_id is not null then 'failed_with_prior_valid' else contract.extraction_freshness_state end,
      updated_by = current_user_id
  where contract.id = existing_run.contract_id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, case when next_status in ('provider_failed','failed','malformed_response') then 'contract.analysis_failed' else 'contract.analysis_completed' end, 'contract_analysis_run', contract_analysis_run_id, contract_analysis_run_version, 'complete_contract_analysis_run', command.idempotency_key || ':contract.analysis_completed', jsonb_build_object('contract_id', existing_run.contract_id, 'status', next_status, 'prior_valid_preserved', existing_run.prior_valid_run_id is not null))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_analysis_run_id', contract_analysis_run_id, 'contract_analysis_run_version', contract_analysis_run_version) where id = command.id;
  return next;
end;
$$;

revoke execute on function public.complete_contract_analysis_run(uuid, jsonb, integer, text) from public, anon;
grant execute on function public.complete_contract_analysis_run(uuid, jsonb, integer, text) to authenticated;

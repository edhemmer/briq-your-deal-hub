-- Specification 011 Slice 2 repair: qualify analysis-run lookups so PL/pgSQL
-- output column names cannot shadow table columns.

create or replace function public.start_contract_analysis_run(target_contract_id uuid, run_input jsonb, idempotency_key text)
returns table (contract_analysis_run_id uuid, contract_analysis_run_version integer, workspace_id uuid, status text, prior_valid_run_id uuid)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(run_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  evidence_id_value uuid := nullif(safe_input ->> 'evidenceId', '')::uuid;
  computed_input_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to start ContractIQ analysis.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if evidence_id_value is not null and not exists (select 1 from public.evidence_items evidence where evidence.workspace_id = target_contract.workspace_id and evidence.id = evidence_id_value) then
    raise exception 'Evidence is not available in this workspace.' using errcode = '42501';
  end if;
  computed_input_hash := encode(digest(coalesce(safe_input ->> 'inputHash', safe_input::text), 'sha256'), 'hex');
  select run.id into prior_valid_run_id
  from public.contract_analysis_runs run
  where run.workspace_id = target_contract.workspace_id and run.contract_id = target_contract.id and run.status in ('completed', 'partial')
  order by run.completed_at desc nulls last, run.requested_at desc limit 1;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'start_contract_analysis_run', idempotency_key, safe_input || jsonb_build_object('inputHash', computed_input_hash));
  if command.result ? 'contract_analysis_run_id' then
    select run.id, run.version, run.workspace_id, run.status, run.prior_valid_run_id
    into contract_analysis_run_id, contract_analysis_run_version, workspace_id, status, prior_valid_run_id
    from public.contract_analysis_runs run
    where run.id = (command.result ->> 'contract_analysis_run_id')::uuid;
    return next;
    return;
  end if;
  insert into public.contract_analysis_runs (
    workspace_id, contract_id, evidence_id, contract_version, analysis_contract_version, extraction_contract_version,
    provider_id, provider_method, requested_by, started_at, status, input_hash, prior_valid_run_id,
    retry_count, warnings, provider_metadata, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, evidence_id_value, target_contract.version,
    coalesce(nullif(safe_input ->> 'analysisContractVersion', ''), 'contractiq-document-analysis-v1'),
    coalesce(nullif(safe_input ->> 'extractionContractVersion', ''), 'contractiq-extraction-v1'),
    coalesce(nullif(safe_input ->> 'providerId', ''), 'deterministic_contractiq'),
    coalesce(nullif(safe_input ->> 'providerMethod', ''), 'manual_or_provider_structured'),
    current_user_id, now(), coalesce(nullif(safe_input ->> 'status', ''), 'processing'), computed_input_hash,
    prior_valid_run_id, coalesce(nullif(safe_input ->> 'retryCount', '')::integer, 0),
    coalesce(safe_input -> 'warnings', '[]'::jsonb), coalesce(safe_input -> 'providerMetadata', '{}'::jsonb),
    current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_id, coalesce(evidence_id, '00000000-0000-0000-0000-000000000000'::uuid), analysis_contract_version, extraction_contract_version, provider_id, provider_method, input_hash) where status <> 'superseded'
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, status, prior_valid_run_id into contract_analysis_run_id, contract_analysis_run_version, workspace_id, status, prior_valid_run_id;
  update public.contracts set analysis_state = 'processing', updated_by = current_user_id where id = target_contract.id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.analysis_started', 'contract_analysis_run', contract_analysis_run_id, contract_analysis_run_version, 'start_contract_analysis_run', command.idempotency_key || ':contract.analysis_started', jsonb_build_object('contract_id', target_contract.id, 'evidence_id', evidence_id_value))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_analysis_run_id', contract_analysis_run_id, 'contract_analysis_run_version', contract_analysis_run_version) where id = command.id;
  return next;
end;
$$;

revoke execute on function public.start_contract_analysis_run(uuid, jsonb, text) from public, anon;
grant execute on function public.start_contract_analysis_run(uuid, jsonb, text) to authenticated;

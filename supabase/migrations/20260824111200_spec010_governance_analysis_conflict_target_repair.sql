-- Spec 010 Slice 2 repair: RETURNS TABLE output names collide with INSERT
-- conflict-target columns inside PL/pgSQL. Keep the RPC contract and make SQL
-- ambiguity resolve to table columns, matching established BRIX function style.

create or replace function public.start_governance_analysis_run(target_governance_record_id uuid, analysis_input jsonb, idempotency_key text)
returns table (governance_analysis_run_id uuid, governance_analysis_run_version integer, workspace_id uuid, status text, prior_valid_run_id uuid, input_hash text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  target_document public.governance_documents%rowtype;
  target_evidence_id uuid;
  safe_input jsonb := public.safe_event_jsonb(coalesce(analysis_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to start GovernanceIQ analysis.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to analyze GovernanceIQ documents.' using errcode = '42501'; end if;
  if safe_input ? 'governanceDocumentId' then
    select doc.* into target_document
    from public.governance_documents doc
    where doc.id = (safe_input ->> 'governanceDocumentId')::uuid
      and doc.workspace_id = target_record.workspace_id
      and doc.governance_record_id = target_record.id
      and doc.archived_at is null;
    if target_document.id is null then raise exception 'Governance document is not available for analysis.' using errcode = 'P0002'; end if;
    target_evidence_id := target_document.evidence_id;
  end if;
  input_hash := encode(extensions.digest(coalesce(safe_input ->> 'inputHash', safe_input::text), 'sha256'), 'hex');
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'start_governance_analysis_run', idempotency_key, safe_input || jsonb_build_object('inputHash', input_hash));
  if command.result ? 'governance_analysis_run_id' then
    select run.id, run.version, run.workspace_id, run.status, run.prior_valid_run_id, run.input_hash
    into governance_analysis_run_id, governance_analysis_run_version, workspace_id, status, prior_valid_run_id, input_hash
    from public.governance_analysis_runs run
    where run.id = (command.result ->> 'governance_analysis_run_id')::uuid;
    return next;
    return;
  end if;
  select run.id into prior_valid_run_id
  from public.governance_analysis_runs run
  where run.workspace_id = target_record.workspace_id
    and run.governance_record_id = target_record.id
    and (target_document.id is null or run.governance_document_id = target_document.id)
    and run.status = 'completed'
  order by run.completed_at desc nulls last
  limit 1;
  insert into public.governance_analysis_runs (
    workspace_id, governance_record_id, governance_document_id, evidence_id, analysis_version, extraction_contract_version,
    provider_id, provider_method, requested_by, started_at, status, input_hash, prior_valid_run_id, metadata, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, target_document.id, target_evidence_id,
    coalesce(nullif(safe_input ->> 'analysisVersion', ''), 'governanceiq-document-analysis-v1'),
    coalesce(nullif(safe_input ->> 'extractionContractVersion', ''), 'governanceiq-extraction-v1'),
    coalesce(nullif(safe_input ->> 'providerId', ''), 'deterministic_orchestration'),
    coalesce(nullif(safe_input ->> 'providerMethod', ''), 'manual_or_provider_structured'),
    current_user_id, now(), 'processing', input_hash, prior_valid_run_id, safe_input - 'rawText' - 'rawDocumentText' - 'fullText', current_user_id, current_user_id
  )
  on conflict (workspace_id, governance_record_id, coalesce(governance_document_id, '00000000-0000-0000-0000-000000000000'::uuid), input_hash) where status <> 'superseded'
  do update set retry_count = public.governance_analysis_runs.retry_count + 1, updated_by = current_user_id, updated_at = now()
  returning public.governance_analysis_runs.id, public.governance_analysis_runs.version, public.governance_analysis_runs.workspace_id, public.governance_analysis_runs.status, public.governance_analysis_runs.prior_valid_run_id, public.governance_analysis_runs.input_hash
  into governance_analysis_run_id, governance_analysis_run_version, workspace_id, status, prior_valid_run_id, input_hash;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.analysis_requested', 'governance_analysis_run', governance_analysis_run_id, governance_analysis_run_version, 'start_governance_analysis_run', command.idempotency_key || ':governance.analysis_requested', jsonb_build_object('governance_record_id', target_record.id, 'governance_document_id', target_document.id, 'prior_valid_run_id', prior_valid_run_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.analysis_requested', 'governance_analysis_runs', 'governance_analysis_run', governance_analysis_run_id, 'start_governance_analysis_run', command.idempotency_key || ':audit', jsonb_build_object('status', status, 'input_hash', input_hash), jsonb_build_object('raw_private_content_logged', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_analysis_run_id', governance_analysis_run_id) where id = command.id;
  return next;
end;
$$;

revoke all on function public.start_governance_analysis_run(uuid, jsonb, text) from public;
revoke execute on function public.start_governance_analysis_run(uuid, jsonb, text) from public, anon;
grant execute on function public.start_governance_analysis_run(uuid, jsonb, text) to authenticated;

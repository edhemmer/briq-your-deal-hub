-- Spec 010 Slice 2 repair: security-definer functions use a restricted
-- search_path, so pgcrypto must be schema-qualified without changing RPC
-- signatures accepted by staging.

create or replace function public.start_governance_analysis_run(target_governance_record_id uuid, analysis_input jsonb, idempotency_key text)
returns table (governance_analysis_run_id uuid, governance_analysis_run_version integer, workspace_id uuid, status text, prior_valid_run_id uuid, input_hash text)
language plpgsql
security definer
set search_path = public
as $$
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

create or replace function public.complete_governance_analysis_run(target_analysis_run_id uuid, result_input jsonb, expected_version integer, idempotency_key text)
returns table (governance_analysis_run_id uuid, governance_analysis_run_version integer, workspace_id uuid, status text, prior_valid_run_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_run public.governance_analysis_runs%rowtype;
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(result_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
  event_name text;
begin
  if current_user_id is null then raise exception 'Authentication required to complete GovernanceIQ analysis.' using errcode = '42501'; end if;
  select * into existing_run from public.governance_analysis_runs where id = target_analysis_run_id for update;
  if existing_run.id is null then raise exception 'GovernanceIQ analysis run is not available.' using errcode = 'P0002'; end if;
  target_record := public.authorized_governance_record(existing_run.governance_record_id);
  if existing_run.version <> expected_version then raise exception 'This GovernanceIQ analysis run changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' then
    raise exception 'GovernanceIQ analysis results cannot persist raw private document text.' using errcode = '22023';
  end if;
  command := public.ensure_governance_command(existing_run.workspace_id, target_record.deal_id, target_record.property_id, existing_run.governance_record_id, 'complete_governance_analysis_run', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'governance_analysis_run_id' then
    select run.id, run.version, run.workspace_id, run.status, run.prior_valid_run_id
    into governance_analysis_run_id, governance_analysis_run_version, workspace_id, status, prior_valid_run_id
    from public.governance_analysis_runs run
    where run.id = (command.result ->> 'governance_analysis_run_id')::uuid;
    return next;
    return;
  end if;
  update public.governance_analysis_runs
  set status = coalesce(nullif(safe_input ->> 'status', ''), 'completed'),
      completed_at = case when coalesce(nullif(safe_input ->> 'status', ''), 'completed') in ('completed', 'partial', 'failed', 'provider_failed', 'malformed_response', 'unsupported_file') then now() else completed_at end,
      error_code = nullif(safe_input ->> 'errorCode', ''),
      safe_error_message = nullif(safe_input ->> 'safeErrorMessage', ''),
      result_hash = encode(extensions.digest(coalesce(safe_input ->> 'resultHash', safe_input::text), 'sha256'), 'hex'),
      warnings = coalesce(safe_input -> 'warnings', warnings),
      updated_by = current_user_id
  where id = existing_run.id
  returning public.governance_analysis_runs.id, public.governance_analysis_runs.version, public.governance_analysis_runs.workspace_id, public.governance_analysis_runs.status, public.governance_analysis_runs.prior_valid_run_id
  into governance_analysis_run_id, governance_analysis_run_version, workspace_id, status, prior_valid_run_id;
  if status in ('failed', 'provider_failed', 'malformed_response', 'unsupported_file') then
    update public.governance_records set status = case when prior_valid_run_id is null then 'partial' else 'failed_with_prior_analysis' end, updated_by = current_user_id where id = existing_run.governance_record_id;
    event_name := 'governance.analysis_failed';
  else
    event_name := 'governance.analysis_completed';
  end if;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_run.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, event_name, 'governance_analysis_run', governance_analysis_run_id, governance_analysis_run_version, 'complete_governance_analysis_run', command.idempotency_key || ':' || event_name, jsonb_build_object('governance_record_id', existing_run.governance_record_id, 'status', status, 'prior_valid_run_id', prior_valid_run_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_run.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, event_name, 'governance_analysis_runs', 'governance_analysis_run', governance_analysis_run_id, 'complete_governance_analysis_run', command.idempotency_key || ':audit', to_jsonb(existing_run), jsonb_build_object('status', status, 'version', governance_analysis_run_version), jsonb_build_object('prior_valid_preserved', prior_valid_run_id is not null, 'raw_private_content_logged', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_analysis_run_id', governance_analysis_run_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_governance_extraction_item(target_governance_record_id uuid, extraction_input jsonb, idempotency_key text)
returns table (governance_extraction_item_id uuid, governance_extraction_item_version integer, workspace_id uuid, extraction_type text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(extraction_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
  computed_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to record GovernanceIQ extraction.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  if coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb) = '{}'::jsonb then raise exception 'SOURCE_ANCHOR_INCOMPLETE' using errcode = '22023'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' then raise exception 'GovernanceIQ extraction cannot persist raw private document text.' using errcode = '22023'; end if;
  computed_hash := encode(extensions.digest(coalesce(safe_input ->> 'inputHash', (safe_input - 'warnings')::text), 'sha256'), 'hex');
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'record_governance_extraction_item', idempotency_key, safe_input || jsonb_build_object('inputHash', computed_hash));
  if command.result ? 'governance_extraction_item_id' then
    select item.id, item.version, item.workspace_id, item.extraction_type
    into governance_extraction_item_id, governance_extraction_item_version, workspace_id, extraction_type
    from public.governance_extraction_items item
    where item.id = (command.result ->> 'governance_extraction_item_id')::uuid;
    return next;
    return;
  end if;
  insert into public.governance_extraction_items (
    workspace_id, governance_record_id, governance_document_id, evidence_id, analysis_run_id, extraction_contract_version,
    extraction_type, finding_category, source_anchor, normalized_value, normalized_requirement, ambiguity, warnings,
    confidence, verification_state, provider_metadata, proposed_governance_finding_id, proposed_governance_financial_id,
    input_hash, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, (safe_input ->> 'governanceDocumentId')::uuid, (safe_input ->> 'evidenceId')::uuid,
    nullif(safe_input ->> 'analysisRunId', '')::uuid,
    coalesce(nullif(safe_input ->> 'extractionContractVersion', ''), 'governanceiq-extraction-v1'),
    coalesce(nullif(safe_input ->> 'extractionType', ''), 'restriction'),
    coalesce(nullif(safe_input ->> 'findingCategory', ''), 'other'),
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(safe_input -> 'normalizedValue', '{}'::jsonb),
    nullif(safe_input ->> 'normalizedRequirement', ''),
    nullif(safe_input ->> 'ambiguity', ''),
    coalesce(safe_input -> 'warnings', '[]'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'verificationState', ''), 'document_extracted'),
    coalesce(safe_input -> 'providerMetadata', '{}'::jsonb),
    nullif(safe_input ->> 'proposedGovernanceFindingId', '')::uuid,
    nullif(safe_input ->> 'proposedGovernanceFinancialId', '')::uuid,
    computed_hash, current_user_id, current_user_id
  )
  on conflict (workspace_id, governance_record_id, governance_document_id, evidence_id, extraction_contract_version, input_hash) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning public.governance_extraction_items.id, public.governance_extraction_items.version, public.governance_extraction_items.workspace_id, public.governance_extraction_items.extraction_type
  into governance_extraction_item_id, governance_extraction_item_version, workspace_id, extraction_type;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.finding_created', 'governance_extraction_item', governance_extraction_item_id, governance_extraction_item_version, 'record_governance_extraction_item', command.idempotency_key || ':governance.extraction_recorded', jsonb_build_object('extraction_type', extraction_type))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_extraction_item_id', governance_extraction_item_id) where id = command.id;
  return next;
end;
$$;

revoke all on function public.start_governance_analysis_run(uuid, jsonb, text) from public;
revoke execute on function public.start_governance_analysis_run(uuid, jsonb, text) from public, anon;
grant execute on function public.start_governance_analysis_run(uuid, jsonb, text) to authenticated;

revoke all on function public.complete_governance_analysis_run(uuid, jsonb, integer, text) from public;
revoke execute on function public.complete_governance_analysis_run(uuid, jsonb, integer, text) from public, anon;
grant execute on function public.complete_governance_analysis_run(uuid, jsonb, integer, text) to authenticated;

revoke all on function public.record_governance_extraction_item(uuid, jsonb, text) from public;
revoke execute on function public.record_governance_extraction_item(uuid, jsonb, text) from public, anon;
grant execute on function public.record_governance_extraction_item(uuid, jsonb, text) to authenticated;

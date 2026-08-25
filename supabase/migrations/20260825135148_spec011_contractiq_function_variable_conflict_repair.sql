-- Specification 011 Slice 2 repair: replace staging functions that were
-- created before PL/pgSQL name-resolution hardening.

create or replace function public.record_contract_document_classification(target_contract_id uuid, classification_input jsonb, expected_version integer, idempotency_key text)
returns table (contract_id uuid, contract_version integer, workspace_id uuid, classification_state text, contract_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(classification_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  proposed_type text := nullif(safe_input ->> 'proposedContractType', '');
begin
  if current_user_id is null then raise exception 'Authentication required to classify ContractIQ document.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if target_contract.version <> expected_version then raise exception 'Contract version conflict.' using errcode = '40001'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' or safe_input ? 'documentText' then
    raise exception 'ContractIQ classification cannot persist raw private document text.' using errcode = '22023';
  end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'record_contract_document_classification', idempotency_key, safe_input);
  if command.result ? 'contract_id' then
    select contract.id, contract.version, contract.workspace_id, contract.classification_state, contract.contract_type
    into contract_id, contract_version, workspace_id, classification_state, contract_type
    from public.contracts contract where contract.id = (command.result ->> 'contract_id')::uuid;
    return next;
    return;
  end if;
  update public.contracts as contract
  set contract_type = coalesce(proposed_type, contract.contract_type),
      classification_state = coalesce(nullif(safe_input ->> 'classificationState', ''), 'classified_proposed'),
      classification_method = coalesce(nullif(safe_input ->> 'classificationMethod', ''), 'provider_structured'),
      classification_evidence = coalesce(safe_input -> 'classificationEvidence', '[]'::jsonb),
      classification_warnings = coalesce(safe_input -> 'warnings', '[]'::jsonb),
      classification_ambiguity = coalesce(safe_input -> 'ambiguity', '[]'::jsonb),
      classification_source_anchor = coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
      classification_run_id = nullif(safe_input ->> 'analysisRunId', '')::uuid,
      prior_valid_classification_run_id = nullif(safe_input ->> 'priorValidRunId', '')::uuid,
      verification_state = coalesce(nullif(safe_input ->> 'verificationState', ''), contract.verification_state),
      analysis_state = case
        when coalesce(nullif(safe_input ->> 'classificationState', ''), '') = 'classification_conflict' then 'current_with_conflicts'
        when coalesce(nullif(safe_input ->> 'classificationState', ''), '') in ('illegible', 'manual_review_required') then 'professional_review_required'
        when coalesce(nullif(safe_input ->> 'classificationState', ''), '') = 'provider_failed' and nullif(safe_input ->> 'priorValidRunId', '') is not null then 'failed_with_prior_analysis'
        else contract.analysis_state
      end,
      version = contract.version + 1,
      updated_by = current_user_id,
      updated_at = now()
  where contract.id = target_contract.id
  returning contract.id, contract.version, contract.workspace_id, contract.classification_state, contract.contract_type
  into contract_id, contract_version, workspace_id, classification_state, contract_type;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.document_classified', 'contract', contract_id, contract_version, 'record_contract_document_classification', command.idempotency_key || ':contract.document_classified', jsonb_build_object('classification_state', classification_state, 'contract_type', contract_type, 'source_anchor_incomplete', coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb) = '{}'::jsonb))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.document_classified', 'contracts', 'contract', contract_id, 'record_contract_document_classification', command.idempotency_key || ':audit', jsonb_build_object('classification_state', classification_state, 'contract_type', contract_type), array['classification_state','contract_type'], jsonb_build_object('legal_conclusion_authority', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_id', contract_id, 'contract_version', contract_version) where id = command.id;
  return next;
end;
$$;

revoke execute on function public.record_contract_document_classification(uuid, jsonb, integer, text) from public, anon;
grant execute on function public.record_contract_document_classification(uuid, jsonb, integer, text) to authenticated;

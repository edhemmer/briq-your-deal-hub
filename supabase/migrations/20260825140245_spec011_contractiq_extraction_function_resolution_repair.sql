-- Specification 011 Slice 2 repair: replace the staging extraction RPC with
-- the hardened version that resolves output/table column names safely.

create or replace function public.record_contract_extraction_item(target_contract_id uuid, extraction_input jsonb, idempotency_key text)
returns table (contract_extraction_item_id uuid, contract_extraction_item_version integer, workspace_id uuid, extraction_type text, normalized_type text)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(extraction_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  evidence_id_value uuid := (safe_input ->> 'evidenceId')::uuid;
  computed_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to record ContractIQ extraction.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb) = '{}'::jsonb then raise exception 'SOURCE_ANCHOR_INCOMPLETE' using errcode = '22023'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' or safe_input ? 'documentText' or safe_input ? 'fileContents' then raise exception 'ContractIQ extraction cannot persist raw private document text.' using errcode = '22023'; end if;
  if safe_input ? 'legalConclusion' or safe_input ? 'isLegallyEnforceable' or safe_input ? 'canonicalDealMutation' or safe_input ? 'financeIqMutation' or safe_input ? 'calculatedDueAt' then raise exception 'ContractIQ extraction cannot persist legal authority, downstream mutations, or calculated deadlines.' using errcode = '22023'; end if;
  if not exists (select 1 from public.evidence_items evidence where evidence.workspace_id = target_contract.workspace_id and evidence.id = evidence_id_value) then raise exception 'Evidence is not available in this workspace.' using errcode = '42501'; end if;
  computed_hash := encode(digest(coalesce(safe_input ->> 'inputHash', (safe_input - 'warnings')::text), 'sha256'), 'hex');
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'record_contract_extraction_item', idempotency_key, safe_input || jsonb_build_object('inputHash', computed_hash));
  if command.result ? 'contract_extraction_item_id' then
    select item.id, item.version, item.workspace_id, item.extraction_type, item.normalized_type
    into contract_extraction_item_id, contract_extraction_item_version, workspace_id, extraction_type, normalized_type
    from public.contract_extraction_items item
    where item.id = (command.result ->> 'contract_extraction_item_id')::uuid;
    return next;
    return;
  end if;
  insert into public.contract_extraction_items (
    workspace_id, contract_id, evidence_id, analysis_run_id, extraction_contract_version, extraction_type, normalized_type,
    raw_source_ref, source_anchor, proposed_normalized_value, display_value, unit, currency, confidence, verification_state,
    ambiguity_state, applicable_party_id, applicable_perspective, effective_date, expiration_date, warnings, provider_metadata,
    input_hash, proposed_contract_party_id, proposed_contract_term_id, proposed_contract_deadline_id, proposed_contract_finding_id,
    proposed_contract_conflict_id, currentness_state, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, evidence_id_value, nullif(safe_input ->> 'analysisRunId', '')::uuid,
    coalesce(nullif(safe_input ->> 'extractionContractVersion', ''), 'contractiq-extraction-v1'),
    coalesce(nullif(safe_input ->> 'extractionType', ''), 'finding'),
    coalesce(nullif(safe_input ->> 'normalizedType', ''), 'other'),
    nullif(safe_input ->> 'rawSourceRef', ''), coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(safe_input -> 'proposedNormalizedValue', '{}'::jsonb), nullif(safe_input ->> 'displayValue', ''),
    nullif(safe_input ->> 'unit', ''), nullif(safe_input ->> 'currency', ''),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'verificationState', ''), 'unverified'),
    coalesce(nullif(safe_input ->> 'ambiguityState', ''), 'none'),
    nullif(safe_input ->> 'applicablePartyId', '')::uuid,
    nullif(safe_input ->> 'applicablePerspective', ''),
    nullif(safe_input ->> 'effectiveDate', '')::date,
    nullif(safe_input ->> 'expirationDate', '')::date,
    coalesce(safe_input -> 'warnings', '[]'::jsonb),
    coalesce(safe_input -> 'providerMetadata', '{}'::jsonb),
    computed_hash,
    nullif(safe_input ->> 'proposedContractPartyId', '')::uuid,
    nullif(safe_input ->> 'proposedContractTermId', '')::uuid,
    nullif(safe_input ->> 'proposedContractDeadlineId', '')::uuid,
    nullif(safe_input ->> 'proposedContractFindingId', '')::uuid,
    nullif(safe_input ->> 'proposedContractConflictId', '')::uuid,
    coalesce(nullif(safe_input ->> 'currentnessState', ''), 'current_candidate'),
    current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_id, evidence_id, extraction_contract_version, input_hash) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, extraction_type, normalized_type into contract_extraction_item_id, contract_extraction_item_version, workspace_id, extraction_type, normalized_type;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.extraction_recorded', 'contract_extraction_item', contract_extraction_item_id, contract_extraction_item_version, 'record_contract_extraction_item', command.idempotency_key || ':contract.extraction_recorded', jsonb_build_object('contract_id', target_contract.id, 'extraction_type', extraction_type, 'normalized_type', normalized_type))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.extraction_recorded', 'contract_extraction_items', 'contract_extraction_item', contract_extraction_item_id, 'record_contract_extraction_item', command.idempotency_key || ':audit', jsonb_build_object('extraction_type', extraction_type, 'normalized_type', normalized_type), array['extraction_type','normalized_type','source_anchor'], jsonb_build_object('source_linked', true, 'legal_conclusion_authority', false, 'downstream_mutation', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_extraction_item_id', contract_extraction_item_id, 'contract_extraction_item_version', contract_extraction_item_version) where id = command.id;
  return next;
end;
$$;

revoke execute on function public.record_contract_extraction_item(uuid, jsonb, text) from public, anon;
grant execute on function public.record_contract_extraction_item(uuid, jsonb, text) to authenticated;

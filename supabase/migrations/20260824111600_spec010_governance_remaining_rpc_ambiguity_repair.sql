-- Spec 010 Slice 2 repair: resolve RETURNS TABLE output-variable collisions in remaining mutation RPCs.
-- Generated mechanically from 20260824103622 function bodies with #variable_conflict use_column and qualified pgcrypto.

create or replace function public.record_governance_document_classification(target_governance_document_id uuid, classification_input jsonb, expected_version integer, idempotency_key text)
returns table (governance_document_id uuid, governance_document_version integer, workspace_id uuid, classification_state text, document_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  existing_document public.governance_documents%rowtype;
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(classification_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to classify GovernanceIQ documents.' using errcode = '42501'; end if;
  select * into existing_document from public.governance_documents where id = target_governance_document_id and archived_at is null for update;
  if existing_document.id is null then raise exception 'Governance document is not available.' using errcode = 'P0002'; end if;
  target_record := public.authorized_governance_record(existing_document.governance_record_id);
  if existing_document.version <> expected_version then raise exception 'This governance document changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' then raise exception 'GovernanceIQ classification cannot persist raw private document text.' using errcode = '22023'; end if;
  command := public.ensure_governance_command(existing_document.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'record_governance_document_classification', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'governance_document_id' then
    select id, version, workspace_id, classification_state, document_type into governance_document_id, governance_document_version, workspace_id, classification_state, document_type from public.governance_documents where id = (command.result ->> 'governance_document_id')::uuid;
    return next;
    return;
  end if;
  update public.governance_documents
  set document_type = coalesce(nullif(safe_input ->> 'proposedDocumentType', ''), document_type),
      classification_state = coalesce(nullif(safe_input ->> 'classificationState', ''), 'classified_proposed'),
      classification_method = nullif(safe_input ->> 'classificationMethod', ''),
      classification_evidence = coalesce(safe_input -> 'evidenceBasis', classification_evidence),
      classification_warnings = coalesce(safe_input -> 'warnings', classification_warnings),
      classification_ambiguity_candidates = coalesce(safe_input -> 'ambiguityCandidates', classification_ambiguity_candidates),
      classification_source_anchor = coalesce(safe_input -> 'sourceAnchor', classification_source_anchor),
      classification_run_id = nullif(safe_input ->> 'analysisRunId', '')::uuid,
      prior_valid_classification_run_id = nullif(safe_input ->> 'priorValidRunId', '')::uuid,
      analysis_state = case when coalesce(nullif(safe_input ->> 'classificationState', ''), '') in ('provider_failed', 'unsupported_format', 'illegible') then 'failed_with_prior_analysis' else 'awaiting_verification' end,
      source_classification = 'document_extracted',
      verification_state = case when coalesce(nullif(safe_input ->> 'classificationState', ''), '') = 'classified_verified' then 'confirmed' else 'document_extracted' end,
      confidence = coalesce(nullif(safe_input ->> 'confidence', '')::integer, confidence),
      stale_analysis = false,
      updated_by = current_user_id
  where id = existing_document.id
  returning id, version, workspace_id, classification_state, document_type into governance_document_id, governance_document_version, workspace_id, classification_state, document_type;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_document.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_classified', 'governance_document', governance_document_id, governance_document_version, 'record_governance_document_classification', command.idempotency_key || ':governance.document_classified', jsonb_build_object('classification_state', classification_state, 'document_type', document_type))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_document.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_classified', 'governance_documents', 'governance_document', governance_document_id, 'record_governance_document_classification', command.idempotency_key || ':audit', to_jsonb(existing_document), jsonb_build_object('classification_state', classification_state, 'document_type', document_type), jsonb_build_object('filename_alone_authoritative', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_document_id', governance_document_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.propose_governance_document_relationship(target_governance_record_id uuid, relationship_input jsonb, idempotency_key text)
returns table (governance_document_relationship_id uuid, governance_document_relationship_version integer, workspace_id uuid, relationship_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(relationship_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to propose GovernanceIQ relationships.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'propose_governance_document_relationship', idempotency_key, safe_input);
  if command.result ? 'governance_document_relationship_id' then
    select id, version, workspace_id, relationship_state into governance_document_relationship_id, governance_document_relationship_version, workspace_id, relationship_state from public.governance_document_relationships where id = (command.result ->> 'governance_document_relationship_id')::uuid;
    return next;
    return;
  end if;
  insert into public.governance_document_relationships (
    workspace_id, governance_record_id, source_governance_document_id, target_governance_document_id, relationship_type,
    relationship_state, source_anchor, confidence, effective_at, adopted_at, reasoning_code, professional_review_recommended,
    analysis_run_id, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, (safe_input ->> 'sourceGovernanceDocumentId')::uuid, (safe_input ->> 'targetGovernanceDocumentId')::uuid,
    coalesce(nullif(safe_input ->> 'relationshipType', ''), 'unknown_relationship'),
    coalesce(nullif(safe_input ->> 'relationshipState', ''), 'proposed'),
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    nullif(safe_input ->> 'effectiveAt', '')::timestamptz,
    nullif(safe_input ->> 'adoptedAt', '')::timestamptz,
    coalesce(nullif(safe_input ->> 'reasoningCode', ''), 'source_relationship_proposed'),
    coalesce(nullif(safe_input ->> 'professionalReviewRecommended', '')::boolean, true),
    nullif(safe_input ->> 'analysisRunId', '')::uuid,
    current_user_id, current_user_id
  )
  on conflict (workspace_id, source_governance_document_id, target_governance_document_id, relationship_type) where archived_at is null
  do update set relationship_state = excluded.relationship_state, source_anchor = excluded.source_anchor, confidence = excluded.confidence, updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, relationship_state into governance_document_relationship_id, governance_document_relationship_version, workspace_id, relationship_state;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.hierarchy_changed', 'governance_document_relationship', governance_document_relationship_id, governance_document_relationship_version, 'propose_governance_document_relationship', command.idempotency_key || ':governance.hierarchy_changed', jsonb_build_object('relationship_state', relationship_state))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_document_relationship_id', governance_document_relationship_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_governance_hierarchy_candidate(target_governance_document_id uuid, hierarchy_input jsonb, idempotency_key text)
returns table (governance_hierarchy_candidate_id uuid, governance_hierarchy_candidate_version integer, workspace_id uuid, hierarchy_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_document public.governance_documents%rowtype;
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(hierarchy_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to record GovernanceIQ hierarchy.' using errcode = '42501'; end if;
  select * into target_document from public.governance_documents where id = target_governance_document_id and archived_at is null;
  if target_document.id is null then raise exception 'Governance document is not available.' using errcode = 'P0002'; end if;
  target_record := public.authorized_governance_record(target_document.governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'record_governance_hierarchy_candidate', idempotency_key, safe_input);
  if command.result ? 'governance_hierarchy_candidate_id' then
    select id, version, workspace_id, hierarchy_state into governance_hierarchy_candidate_id, governance_hierarchy_candidate_version, workspace_id, hierarchy_state from public.governance_hierarchy_candidates where id = (command.result ->> 'governance_hierarchy_candidate_id')::uuid;
    return next;
    return;
  end if;
  update public.governance_hierarchy_candidates set stale_at = now(), updated_by = current_user_id where workspace_id = target_record.workspace_id and governance_document_id = target_document.id and archived_at is null and stale_at is null;
  insert into public.governance_hierarchy_candidates (
    workspace_id, governance_record_id, governance_document_id, hierarchy_state, relationship_ids, source_anchor,
    reasoning_code, confidence, professional_review_recommended, analysis_run_id, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, target_document.id,
    coalesce(nullif(safe_input ->> 'hierarchyState', ''), 'hierarchy_uncertain'),
    coalesce(array(select jsonb_array_elements_text(safe_input -> 'relationshipIds')::uuid), '{}'::uuid[]),
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'reasoningCode', ''), 'hierarchy_uncertain'),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'professionalReviewRecommended', '')::boolean, true),
    nullif(safe_input ->> 'analysisRunId', '')::uuid,
    current_user_id, current_user_id
  )
  returning id, version, workspace_id, hierarchy_state into governance_hierarchy_candidate_id, governance_hierarchy_candidate_version, workspace_id, hierarchy_state;
  update public.governance_documents set hierarchy_classification = case when hierarchy_state = 'candidate_superseded' then 'superseded' else hierarchy_state end, updated_by = current_user_id where id = target_document.id;
  update public.governance_command_requests set result = jsonb_build_object('governance_hierarchy_candidate_id', governance_hierarchy_candidate_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_governance_extraction_item(target_governance_record_id uuid, extraction_input jsonb, idempotency_key text)
returns table (governance_extraction_item_id uuid, governance_extraction_item_version integer, workspace_id uuid, extraction_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
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
    select id, version, workspace_id, extraction_type into governance_extraction_item_id, governance_extraction_item_version, workspace_id, extraction_type from public.governance_extraction_items where id = (command.result ->> 'governance_extraction_item_id')::uuid;
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
  returning id, version, workspace_id, extraction_type into governance_extraction_item_id, governance_extraction_item_version, workspace_id, extraction_type;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.finding_created', 'governance_extraction_item', governance_extraction_item_id, governance_extraction_item_version, 'record_governance_extraction_item', command.idempotency_key || ':governance.extraction_recorded', jsonb_build_object('extraction_type', extraction_type))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_extraction_item_id', governance_extraction_item_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.create_governance_question(target_governance_record_id uuid, question_input jsonb, idempotency_key text)
returns table (governance_question_id uuid, governance_question_version integer, workspace_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(question_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to create GovernanceIQ questions.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'create_governance_question', idempotency_key, safe_input);
  if command.result ? 'governance_question_id' then
    select id, version, workspace_id, status into governance_question_id, governance_question_version, workspace_id, status from public.governance_questions where id = (command.result ->> 'governance_question_id')::uuid;
    return next;
    return;
  end if;
  insert into public.governance_questions (
    workspace_id, governance_record_id, governance_document_id, governance_conflict_id, governance_finding_id,
    question, target_role, why_it_matters, source_reason, source_anchor, professional_review_recommended,
    analysis_run_id, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, nullif(safe_input ->> 'governanceDocumentId', '')::uuid,
    nullif(safe_input ->> 'governanceConflictId', '')::uuid, nullif(safe_input ->> 'governanceFindingId', '')::uuid,
    coalesce(nullif(safe_input ->> 'question', ''), 'What source fact needs verification?'),
    coalesce(nullif(safe_input ->> 'targetRole', ''), 'unknown'),
    coalesce(nullif(safe_input ->> 'whyItMatters', ''), 'This may affect the Deal review.'),
    coalesce(nullif(safe_input ->> 'sourceReason', ''), 'Source-linked GovernanceIQ ambiguity.'),
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'professionalReviewRecommended', '')::boolean, false),
    nullif(safe_input ->> 'analysisRunId', '')::uuid, current_user_id, current_user_id
  )
  returning id, version, workspace_id, status into governance_question_id, governance_question_version, workspace_id, status;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.question_created', 'governance_questions', 'governance_question', governance_question_id, 'create_governance_question', command.idempotency_key || ':audit', jsonb_build_object('status', status), jsonb_build_object('source_linked', safe_input ? 'sourceAnchor'))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_question_id', governance_question_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.mark_governance_analysis_stale(target_governance_record_id uuid, stale_input jsonb, idempotency_key text)
returns table (governance_record_id uuid, workspace_id uuid, stale_analysis_count integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(stale_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to mark GovernanceIQ stale.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'mark_governance_analysis_stale', idempotency_key, safe_input);
  update public.governance_documents set stale_analysis = true, updated_by = current_user_id where workspace_id = target_record.workspace_id and governance_record_id = target_record.id and archived_at is null;
  update public.governance_analysis_runs set status = 'stale', updated_by = current_user_id where workspace_id = target_record.workspace_id and governance_record_id = target_record.id and status in ('completed', 'partial');
  get diagnostics stale_analysis_count = row_count;
  governance_record_id := target_record.id;
  workspace_id := target_record.workspace_id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.analysis_stale', 'governance_record', target_record.id, target_record.version, 'mark_governance_analysis_stale', command.idempotency_key || ':governance.analysis_stale', jsonb_build_object('reason', safe_input ->> 'reason'))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_record_id', governance_record_id, 'stale_analysis_count', stale_analysis_count) where id = command.id;
  return next;
end;
$$;

revoke all on function public.record_governance_document_classification(uuid, jsonb, integer, text) from public;
revoke execute on function public.record_governance_document_classification(uuid, jsonb, integer, text) from public, anon;
grant execute on function public.record_governance_document_classification(uuid, jsonb, integer, text) to authenticated;

revoke all on function public.propose_governance_document_relationship(uuid, jsonb, text) from public;
revoke execute on function public.propose_governance_document_relationship(uuid, jsonb, text) from public, anon;
grant execute on function public.propose_governance_document_relationship(uuid, jsonb, text) to authenticated;

revoke all on function public.record_governance_hierarchy_candidate(uuid, jsonb, text) from public;
revoke execute on function public.record_governance_hierarchy_candidate(uuid, jsonb, text) from public, anon;
grant execute on function public.record_governance_hierarchy_candidate(uuid, jsonb, text) to authenticated;

revoke all on function public.record_governance_extraction_item(uuid, jsonb, text) from public;
revoke execute on function public.record_governance_extraction_item(uuid, jsonb, text) from public, anon;
grant execute on function public.record_governance_extraction_item(uuid, jsonb, text) to authenticated;

revoke all on function public.create_governance_question(uuid, jsonb, text) from public;
revoke execute on function public.create_governance_question(uuid, jsonb, text) from public, anon;
grant execute on function public.create_governance_question(uuid, jsonb, text) to authenticated;

revoke all on function public.mark_governance_analysis_stale(uuid, jsonb, text) from public;
revoke execute on function public.mark_governance_analysis_stale(uuid, jsonb, text) from public, anon;
grant execute on function public.mark_governance_analysis_stale(uuid, jsonb, text) to authenticated;


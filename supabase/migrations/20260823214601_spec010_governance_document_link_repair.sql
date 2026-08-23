-- Specification 010 Slice 1 repair: avoid partial-index ON CONFLICT inference
-- for GovernanceIQ document linking; explicitly lock existing active link first.

create or replace function public.link_governance_document(target_governance_record_id uuid, document_input jsonb, idempotency_key text)
returns table (governance_document_id uuid, governance_document_version integer, governance_record_id uuid, workspace_id uuid, evidence_id uuid, document_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(document_input, '{}'::jsonb));
  target_record public.governance_records%rowtype;
  command public.governance_command_requests%rowtype;
  inserted_document public.governance_documents%rowtype;
  requested_evidence_id uuid := nullif(safe_input ->> 'evidenceId', '')::uuid;
  requested_document_type text := coalesce(nullif(btrim(safe_input ->> 'documentType'), ''), 'other');
begin
  if current_user_id is null then raise exception 'Authentication required to link governance documents.' using errcode = '42501'; end if;
  select * into target_record from public.governance_records where id = target_governance_record_id and archived_at is null for update;
  if target_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to link GovernanceIQ documents.' using errcode = '42501'; end if;

  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'link_governance_document', idempotency_key, safe_input);
  if command.result ? 'governance_document_id' then
    select id, version, governance_record_id, workspace_id, evidence_id, document_type into governance_document_id, governance_document_version, governance_record_id, workspace_id, evidence_id, document_type from public.governance_documents where id = (command.result ->> 'governance_document_id')::uuid;
    return next;
    return;
  end if;

  select * into inserted_document
  from public.governance_documents
  where workspace_id = target_record.workspace_id
    and governance_record_id = target_record.id
    and evidence_id = requested_evidence_id
    and document_type = requested_document_type
    and archived_at is null
  for update;

  if inserted_document.id is null then
    insert into public.governance_documents (
      workspace_id, governance_record_id, evidence_id, document_type, title, adopted_at, effective_at, expires_at,
      supersedes_governance_document_id, hierarchy_rank, hierarchy_classification, analysis_state,
      source_classification, verification_state, confidence, created_by, updated_by
    )
    values (
      target_record.workspace_id,
      target_record.id,
      requested_evidence_id,
      requested_document_type,
      coalesce(nullif(btrim(safe_input ->> 'title'), ''), 'Governance document'),
      nullif(safe_input ->> 'adoptedAt', '')::timestamptz,
      nullif(safe_input ->> 'effectiveAt', '')::timestamptz,
      nullif(safe_input ->> 'expiresAt', '')::timestamptz,
      nullif(safe_input ->> 'supersedesGovernanceDocumentId', '')::uuid,
      nullif(safe_input ->> 'hierarchyRank', '')::integer,
      coalesce(nullif(btrim(safe_input ->> 'hierarchyClassification'), ''), 'hierarchy_uncertain'),
      coalesce(nullif(btrim(safe_input ->> 'analysisState'), ''), 'not_started'),
      coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'document_extracted'),
      coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
      greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
      current_user_id,
      current_user_id
    )
    returning * into inserted_document;
  end if;

  update public.governance_records set status = case when status in ('suspected', 'identified', 'documents_requested') then 'documents_received' else status end, updated_by = current_user_id where id = target_record.id;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_received', 'governance_document', inserted_document.id, inserted_document.version, 'link_governance_document', command.idempotency_key || ':governance.document_received', jsonb_build_object('governance_record_id', target_record.id, 'governance_document_id', inserted_document.id, 'evidence_id', inserted_document.evidence_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_received', 'governance_documents', 'governance_document', inserted_document.id, 'link_governance_document', command.idempotency_key || ':audit', jsonb_build_object('governance_document_id', inserted_document.id, 'evidence_id', inserted_document.evidence_id), array['governance_documents'], jsonb_build_object('evidence_storage_reused', true))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_document_id', inserted_document.id, 'governance_document_version', inserted_document.version) where id = command.id;

  governance_document_id := inserted_document.id;
  governance_document_version := inserted_document.version;
  governance_record_id := inserted_document.governance_record_id;
  workspace_id := inserted_document.workspace_id;
  evidence_id := inserted_document.evidence_id;
  document_type := inserted_document.document_type;
  return next;
end;
$$;

revoke all on function public.link_governance_document(uuid, jsonb, text) from public;
revoke execute on function public.link_governance_document(uuid, jsonb, text) from public, anon;
grant execute on function public.link_governance_document(uuid, jsonb, text) to authenticated;

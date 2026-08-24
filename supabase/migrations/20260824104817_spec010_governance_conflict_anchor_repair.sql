-- Specification 010 Slice 2 repair: persist source anchors and normalized
-- values when deterministic conflict detection creates GovernanceIQ conflicts.

create or replace function public.create_governance_conflict(target_governance_record_id uuid, conflict_input jsonb, idempotency_key text)
returns table (governance_conflict_id uuid, governance_conflict_version integer, governance_record_id uuid, workspace_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(conflict_input, '{}'::jsonb));
  target_record public.governance_records%rowtype;
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to create governance conflicts.' using errcode = '42501'; end if;
  select * into target_record from public.governance_records where id = target_governance_record_id and archived_at is null for update;
  if target_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to create GovernanceIQ conflicts.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'create_governance_conflict', idempotency_key, safe_input);
  if command.result ? 'governance_conflict_id' then
    select id, version, governance_record_id, workspace_id, status
    into governance_conflict_id, governance_conflict_version, governance_record_id, workspace_id, status
    from public.governance_conflicts
    where id = (command.result ->> 'governance_conflict_id')::uuid;
    return next;
    return;
  end if;

  insert into public.governance_conflicts (
    workspace_id, governance_record_id, category, conflict_type, status, summary,
    source_a_document_id, source_a_finding_id, source_b_document_id, source_b_finding_id,
    source_a_anchor, source_b_anchor, normalized_a, normalized_b, conflict_severity,
    detection_method, confidence, governing_source_candidate, professional_review_required,
    created_by, updated_by
  )
  values (
    target_record.workspace_id,
    target_record.id,
    coalesce(nullif(btrim(safe_input ->> 'category'), ''), 'other'),
    coalesce(nullif(btrim(safe_input ->> 'conflictType'), ''), 'other'),
    coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'unresolved'),
    coalesce(nullif(btrim(safe_input ->> 'summary'), ''), 'Governance source conflict'),
    nullif(safe_input ->> 'sourceADocumentId', '')::uuid,
    nullif(safe_input ->> 'sourceAFindingId', '')::uuid,
    nullif(safe_input ->> 'sourceBDocumentId', '')::uuid,
    nullif(safe_input ->> 'sourceBFindingId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAAnchor') = 'object' then safe_input -> 'sourceAAnchor' else '{}'::jsonb end,
    case when jsonb_typeof(safe_input -> 'sourceBAnchor') = 'object' then safe_input -> 'sourceBAnchor' else '{}'::jsonb end,
    case when jsonb_typeof(safe_input -> 'normalizedA') = 'object' then safe_input -> 'normalizedA' else '{}'::jsonb end,
    case when jsonb_typeof(safe_input -> 'normalizedB') = 'object' then safe_input -> 'normalizedB' else '{}'::jsonb end,
    coalesce(nullif(btrim(safe_input ->> 'conflictSeverity'), ''), 'unknown'),
    nullif(btrim(safe_input ->> 'detectionMethod'), ''),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    case when jsonb_typeof(safe_input -> 'governingSourceCandidate') = 'object' then safe_input -> 'governingSourceCandidate' else '{}'::jsonb end,
    coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, true),
    current_user_id,
    current_user_id
  )
  returning id, version, governance_record_id, workspace_id, status
  into governance_conflict_id, governance_conflict_version, governance_record_id, workspace_id, status;

  update public.governance_records as record
  set status = case when record.status = 'current' then 'current_with_conflicts' else record.status end,
      updated_by = current_user_id
  where record.id = target_record.id;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (
    target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id,
    'governance.conflict_detected', 'governance_conflict', governance_conflict_id, governance_conflict_version,
    'create_governance_conflict', command.idempotency_key || ':governance.conflict_detected',
    jsonb_build_object('governance_record_id', target_record.id, 'governance_conflict_id', governance_conflict_id, 'conflict_type', safe_input ->> 'conflictType')
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (
    target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id,
    'governance.conflict_detected', 'governance_conflicts', 'governance_conflict', governance_conflict_id,
    'create_governance_conflict', command.idempotency_key || ':audit',
    jsonb_build_object('governance_conflict_id', governance_conflict_id, 'version', governance_conflict_version),
    jsonb_build_object('professional_review_required', coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, true), 'source_anchors_preserved', true)
  )
  on conflict do nothing;

  update public.governance_command_requests
  set result = jsonb_build_object('governance_conflict_id', governance_conflict_id, 'governance_conflict_version', governance_conflict_version)
  where id = command.id;

  return next;
end;
$$;

revoke all on function public.create_governance_conflict(uuid, jsonb, text) from public;
revoke execute on function public.create_governance_conflict(uuid, jsonb, text) from public, anon;
grant execute on function public.create_governance_conflict(uuid, jsonb, text) to authenticated;

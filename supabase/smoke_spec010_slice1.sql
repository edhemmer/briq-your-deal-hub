begin;

do $$
declare
  test_user_id uuid := gen_random_uuid();
  other_user_id uuid := gen_random_uuid();
  test_workspace_id uuid := gen_random_uuid();
  other_workspace_id uuid := gen_random_uuid();
  test_property_id uuid := gen_random_uuid();
  other_property_id uuid := gen_random_uuid();
  test_deal_id uuid := gen_random_uuid();
  other_deal_id uuid := gen_random_uuid();
  intake_id uuid := gen_random_uuid();
  evidence_id uuid := gen_random_uuid();
  source_record_id uuid := gen_random_uuid();
  created_governance_record_id uuid;
  governance_record_version integer;
  duplicate_record_id uuid;
  governance_document_id uuid;
  governance_document_version integer;
  governance_finding_id uuid;
  governance_finding_version integer;
  duplicate_finding_id uuid;
  governance_conflict_id uuid;
  governance_conflict_version integer;
  governance_financial_id uuid;
  projection_result record;
  detail_count integer;
  event_count integer;
  audit_count integer;
  direct_write_denied boolean := false;
  cross_workspace_denied boolean := false;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (test_user_id, 'authenticated', 'authenticated', 'spec010-slice1-smoke@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (other_user_id, 'authenticated', 'authenticated', 'spec010-slice1-smoke-other@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.workspaces (id, name, owner_user_id, status)
  values
    (test_workspace_id, 'Spec 010 Slice 1 Smoke Workspace', test_user_id, 'active'),
    (other_workspace_id, 'Spec 010 Slice 1 Smoke Other Workspace', other_user_id, 'active');

  insert into public.workspace_memberships (workspace_id, user_id, role_id, status, accepted_at)
  values
    (test_workspace_id, test_user_id, 'owner', 'active', now()),
    (other_workspace_id, other_user_id, 'owner', 'active', now());

  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.properties (id, workspace_id, display_address, address_line1, country, created_by, updated_by)
  values
    (test_property_id, test_workspace_id, 'Spec 010 Governance Smoke Property', 'Spec 010 Governance Smoke Property', 'US', test_user_id, test_user_id),
    (other_property_id, other_workspace_id, 'Spec 010 Other Governance Smoke Property', 'Spec 010 Other Governance Smoke Property', 'US', other_user_id, other_user_id);

  insert into public.brix_deals (id, owner_id, workspace_id, address, display_name, strategy_id, strategy_intent, created_by, updated_by)
  values
    (test_deal_id, test_user_id, test_workspace_id, 'Spec 010 Governance Smoke Property', 'Spec 010 Governance Smoke Deal', 'buy_hold_rental', 'buy_hold_rental', test_user_id, test_user_id),
    (other_deal_id, other_user_id, other_workspace_id, 'Spec 010 Other Governance Smoke Property', 'Spec 010 Other Governance Smoke Deal', 'buy_hold_rental', 'buy_hold_rental', other_user_id, other_user_id);

  insert into public.deal_properties (workspace_id, deal_id, property_id, role, inclusion_status, created_by, updated_by)
  values
    (test_workspace_id, test_deal_id, test_property_id, 'primary', 'active', test_user_id, test_user_id),
    (other_workspace_id, other_deal_id, other_property_id, 'primary', 'active', other_user_id, other_user_id);

  insert into public.property_intakes (
    id, workspace_id, user_id, state, source_type, original_input, normalized_location,
    resulting_property_id, resulting_deal_id, idempotency_key, completed_at
  )
  values (
    intake_id, test_workspace_id, test_user_id, 'complete', 'document',
    jsonb_build_object('source', 'spec010 smoke'), '{}'::jsonb, test_property_id,
    test_deal_id, 'spec010-slice1-smoke-intake', now()
  );

  insert into public.evidence_items (
    id, workspace_id, intake_id, deal_id, property_id, evidence_type, original_filename, sanitized_filename, detected_mime_type,
    byte_size, content_hash, storage_object_key, uploaded_by, processing_status, extraction_status
  )
  values (
    evidence_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document', 'spec010-ccrs.pdf', 'spec010-ccrs.pdf',
    'application/pdf', 256, repeat('b', 64), 'spec010/slice1/ccrs.pdf', test_user_id, 'complete', 'complete'
  );

  insert into public.manual_source_records (
    id, workspace_id, intake_id, deal_id, property_id, source_type, source_name, original_values, classification,
    verification_state, evidence_id, content_hash, retrieved_at, created_by
  )
  values (
    source_record_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document', 'Spec 010 CC&Rs',
    '{}'::jsonb, jsonb_build_object('evidence', 'user_provided_source'), 'unverified', evidence_id,
    repeat('b', 64), now(), test_user_id
  );

  select result.governance_record_id, result.governance_record_version
  into created_governance_record_id, governance_record_version
  from public.create_governance_record(
    test_workspace_id,
    jsonb_build_object(
      'dealId', test_deal_id,
      'propertyId', test_property_id,
      'governanceType', 'homeowners_association',
      'name', 'Spec 010 Smoke HOA',
      'status', 'identified',
      'sourceEvidenceId', evidence_id,
      'sourceRecordId', source_record_id,
      'sourceAnchor', jsonb_build_object('page', 1, 'section', 'Association'),
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'confidence', 70
    ),
    'spec010-slice1-record-create'
  ) result;

  select result.governance_record_id
  into duplicate_record_id
  from public.create_governance_record(
    test_workspace_id,
    jsonb_build_object('dealId', test_deal_id, 'propertyId', test_property_id, 'governanceType', 'homeowners_association', 'name', 'Spec 010 Smoke HOA', 'status', 'identified', 'sourceEvidenceId', evidence_id, 'sourceRecordId', source_record_id, 'sourceAnchor', jsonb_build_object('page', 1, 'section', 'Association'), 'sourceClassification', 'document_extracted', 'verificationState', 'document_extracted', 'confidence', 70),
    'spec010-slice1-record-create'
  ) result;

  if duplicate_record_id is distinct from created_governance_record_id then
    raise exception 'Expected governance record create retry to return original record.';
  end if;

  select result.governance_record_version into governance_record_version
  from public.update_governance_record(
    created_governance_record_id,
    jsonb_build_object('status', 'documents_requested'),
    governance_record_version,
    'spec010-slice1-record-update'
  ) result;

  select result.governance_document_id, result.governance_document_version
  into governance_document_id, governance_document_version
  from public.link_governance_document(
    created_governance_record_id,
    jsonb_build_object(
      'evidenceId', evidence_id,
      'documentType', 'declaration_ccrs',
      'title', 'Spec 010 Smoke CC&Rs',
      'hierarchyClassification', 'hierarchy_uncertain',
      'analysisState', 'awaiting_verification',
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'confidence', 80
    ),
    'spec010-slice1-document-link'
  ) result;

  select result.governance_document_version into governance_document_version
  from public.update_governance_document(
    governance_document_id,
    jsonb_build_object('hierarchyClassification', 'candidate_current', 'analysisState', 'current'),
    governance_document_version,
    'spec010-slice1-document-update'
  ) result;

  select result.governance_finding_id, result.governance_finding_version
  into governance_finding_id, governance_finding_version
  from public.upsert_governance_finding(
    created_governance_record_id,
    jsonb_build_object(
      'governanceDocumentId', governance_document_id,
      'findingType', 'restriction',
      'findingCategory', 'parking',
      'summary', 'Overnight trailer parking requires approval.',
      'normalizedValue', jsonb_build_object('approvalRequired', true),
      'normalizedRequirement', 'approval_required',
      'severity', 'moderate',
      'impactType', 'parking',
      'sourceEvidenceId', evidence_id,
      'sourceRecordId', source_record_id,
      'sourceAnchor', jsonb_build_object('page', 12, 'clause', '7.4'),
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'professionalReviewRecommended', true,
      'confidence', 75
    ),
    null,
    'spec010-slice1-finding-create'
  ) result;

  select result.governance_finding_id
  into duplicate_finding_id
  from public.upsert_governance_finding(
    created_governance_record_id,
    jsonb_build_object(
      'governanceDocumentId', governance_document_id,
      'findingType', 'restriction',
      'findingCategory', 'parking',
      'summary', 'Overnight trailer parking requires approval.',
      'normalizedValue', jsonb_build_object('approvalRequired', true),
      'normalizedRequirement', 'approval_required',
      'severity', 'moderate',
      'impactType', 'parking',
      'sourceEvidenceId', evidence_id,
      'sourceRecordId', source_record_id,
      'sourceAnchor', jsonb_build_object('page', 12, 'clause', '7.4'),
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'professionalReviewRecommended', true,
      'confidence', 75
    ),
    null,
    'spec010-slice1-finding-create'
  ) result;

  if duplicate_finding_id is distinct from governance_finding_id then
    raise exception 'Expected governance finding retry to return original finding.';
  end if;

  select result.governance_finding_version
  into governance_finding_version
  from public.set_governance_finding_acceptance(
    governance_finding_id,
    'accepted',
    governance_finding_version,
    'spec010-slice1-finding-accept',
    'source-backed smoke acceptance'
  ) result;

  select result.governance_conflict_id, result.governance_conflict_version
  into governance_conflict_id, governance_conflict_version
  from public.create_governance_conflict(
    created_governance_record_id,
    jsonb_build_object(
      'category', 'parking',
      'conflictType', 'restriction_language',
      'summary', 'Parking rule summary conflicts with disclosure statement.',
      'sourceADocumentId', governance_document_id,
      'sourceAFindingId', governance_finding_id,
      'professionalReviewRequired', true
    ),
    'spec010-slice1-conflict-create'
  ) result;

  select result.governance_conflict_version
  into governance_conflict_version
  from public.resolve_governance_conflict(
    governance_conflict_id,
    jsonb_build_object('resolution', 'Manual review marked CC&Rs as governing candidate.', 'professionalReviewRequired', false),
    governance_conflict_version,
    'spec010-slice1-conflict-resolve'
  ) result;

  select result.governance_financial_id
  into governance_financial_id
  from public.upsert_governance_financial(
    created_governance_record_id,
    jsonb_build_object(
      'governanceDocumentId', governance_document_id,
      'periodStart', '2026-01-01',
      'periodEnd', '2026-12-31',
      'duesAmount', 325,
      'duesFrequency', 'monthly',
      'reserveBalance', 120000,
      'delinquencyRate', 0.04,
      'insuranceDeductibleAmount', 10000,
      'sourceEvidenceId', evidence_id,
      'sourceRecordId', source_record_id,
      'sourceAnchor', jsonb_build_object('page', 19, 'budgetLine', 'Insurance'),
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'confidence', 74
    ),
    null,
    'spec010-slice1-financial-upsert'
  ) result;

  select * into projection_result
  from public.list_governance_record_projection(test_deal_id, test_property_id) as projection
  where projection.governance_record_id = created_governance_record_id;

  if projection_result.governance_record_id is null
     or projection_result.document_count <> 1
     or projection_result.accepted_finding_count <> 1
     or projection_result.professional_review_required is not true then
    raise exception 'Expected GovernanceIQ projection to reopen with document/finding/review state.';
  end if;

  select count(*) into detail_count
  from public.load_governance_record_detail(created_governance_record_id);

  if detail_count <> 5 then
    raise exception 'Expected record detail to include record, document, finding, conflict, and financial rows; got %.', detail_count;
  end if;

  select count(*) into event_count
  from public.domain_events
  where workspace_id = test_workspace_id
    and event_type in ('governance.record_created', 'governance.document_received', 'governance.finding_created', 'governance.conflict_detected', 'governance.finding_accepted');

  select count(*) into audit_count
  from public.audit_events
  where workspace_id = test_workspace_id
    and action in ('governance.record_created', 'governance.document_received', 'governance.finding_saved', 'governance.conflict_detected', 'governance.finding_accepted');

  if event_count < 5 or audit_count < 5 then
    raise exception 'Expected GovernanceIQ events/audits, got events %, audits %.', event_count, audit_count;
  end if;

  begin
    execute 'set local role authenticated';
    insert into public.governance_records (workspace_id, deal_id, property_id, governance_type, name, created_by, updated_by)
    values (test_workspace_id, test_deal_id, test_property_id, 'homeowners_association', 'Direct write should fail', test_user_id, test_user_id);
  exception when insufficient_privilege or check_violation then
    direct_write_denied := true;
  end;
  execute 'reset role';

  if not direct_write_denied then
    raise exception 'Expected direct governance_records insert to be denied.';
  end if;

  perform set_config('request.jwt.claim.sub', other_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  begin
    perform *
    from public.upsert_governance_finding(created_governance_record_id, jsonb_build_object('summary', 'Cross workspace should fail'), null, 'spec010-slice1-cross-workspace');
  exception when insufficient_privilege then
    cross_workspace_denied := true;
  end;

  if not cross_workspace_denied then
    raise exception 'Expected cross-workspace GovernanceIQ write to be denied.';
  end if;

  raise notice 'SPEC010_SLICE1_STAGING_SMOKE_OK record=% document=% finding=% conflict=% financial=%',
    created_governance_record_id, governance_document_id, governance_finding_id, governance_conflict_id, governance_financial_id;
end $$;

rollback;

do $$
begin
  if exists (select 1 from auth.users where email in ('spec010-slice1-smoke@example.invalid', 'spec010-slice1-smoke-other@example.invalid')) then
    raise exception 'Rollback residue found in auth.users.';
  end if;

  if exists (select 1 from public.workspaces where name like 'Spec 010 Slice 1 Smoke%') then
    raise exception 'Rollback residue found in workspaces.';
  end if;

  raise notice 'SPEC010_SLICE1_ROLLBACK_RESIDUE_OK';
end $$;

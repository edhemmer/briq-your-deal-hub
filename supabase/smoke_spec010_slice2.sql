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
  declaration_evidence_id uuid := gen_random_uuid();
  rules_evidence_id uuid := gen_random_uuid();
  source_record_id uuid := gen_random_uuid();
  created_governance_record_id uuid;
  governance_record_version integer;
  declaration_document_id uuid;
  declaration_document_version integer;
  rules_document_id uuid;
  rules_document_version integer;
  analysis_run_id uuid;
  analysis_run_version integer;
  duplicate_run_id uuid;
  failed_run_id uuid;
  prior_valid_run_id uuid;
  relationship_id uuid;
  hierarchy_id uuid;
  rental_finding_id uuid;
  rental_finding_version integer;
  rules_finding_id uuid;
  financial_id uuid;
  extraction_item_id uuid;
  duplicate_extraction_item_id uuid;
  conflict_id uuid;
  conflict_version integer;
  question_id uuid;
  projection_result record;
  detail_count integer;
  conflict_anchor record;
  event_count integer;
  audit_count integer;
  direct_write_denied boolean := false;
  cross_workspace_denied boolean := false;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (test_user_id, 'authenticated', 'authenticated', 'spec010-slice2-smoke@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (other_user_id, 'authenticated', 'authenticated', 'spec010-slice2-smoke-other@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.workspaces (id, name, owner_user_id, status)
  values
    (test_workspace_id, 'Spec 010 Slice 2 Smoke Workspace', test_user_id, 'active'),
    (other_workspace_id, 'Spec 010 Slice 2 Smoke Other Workspace', other_user_id, 'active');

  insert into public.workspace_memberships (workspace_id, user_id, role_id, status, accepted_at)
  values
    (test_workspace_id, test_user_id, 'owner', 'active', now()),
    (other_workspace_id, other_user_id, 'owner', 'active', now());

  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.properties (id, workspace_id, display_address, address_line1, country, created_by, updated_by)
  values
    (test_property_id, test_workspace_id, 'Spec 010 Slice 2 Governance Property', 'Spec 010 Slice 2 Governance Property', 'US', test_user_id, test_user_id),
    (other_property_id, other_workspace_id, 'Spec 010 Slice 2 Other Property', 'Spec 010 Slice 2 Other Property', 'US', other_user_id, other_user_id);

  insert into public.brix_deals (id, owner_id, workspace_id, address, display_name, strategy_id, strategy_intent, created_by, updated_by)
  values
    (test_deal_id, test_user_id, test_workspace_id, 'Spec 010 Slice 2 Governance Property', 'Spec 010 Slice 2 Governance Deal', 'buy_hold_rental', 'buy_hold_rental', test_user_id, test_user_id),
    (other_deal_id, other_user_id, other_workspace_id, 'Spec 010 Slice 2 Other Property', 'Spec 010 Slice 2 Other Deal', 'buy_hold_rental', 'buy_hold_rental', other_user_id, other_user_id);

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
    jsonb_build_object('source', 'spec010 slice2 smoke'), '{}'::jsonb, test_property_id,
    test_deal_id, 'spec010-slice2-smoke-intake', now()
  );

  insert into public.evidence_items (
    id, workspace_id, intake_id, deal_id, property_id, evidence_type, original_filename, sanitized_filename, detected_mime_type,
    byte_size, content_hash, storage_object_key, uploaded_by, processing_status, extraction_status
  )
  values
    (declaration_evidence_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document', 'misleading-rules-final.pdf', 'misleading-rules-final.pdf', 'application/pdf', 256, repeat('c', 64), 'spec010/slice2/declaration.pdf', test_user_id, 'complete', 'complete'),
    (rules_evidence_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document', 'parking-rules.pdf', 'parking-rules.pdf', 'application/pdf', 256, repeat('d', 64), 'spec010/slice2/rules.pdf', test_user_id, 'complete', 'complete');

  insert into public.manual_source_records (
    id, workspace_id, intake_id, deal_id, property_id, source_type, source_name, original_values, classification,
    verification_state, evidence_id, content_hash, retrieved_at, created_by
  )
  values (
    source_record_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document', 'Spec 010 Governance Source',
    '{}'::jsonb, jsonb_build_object('evidence', 'user_provided_source'), 'unverified', declaration_evidence_id,
    repeat('c', 64), now(), test_user_id
  );

  select result.governance_record_id, result.governance_record_version
  into created_governance_record_id, governance_record_version
  from public.create_governance_record(
    test_workspace_id,
    jsonb_build_object(
      'dealId', test_deal_id,
      'propertyId', test_property_id,
      'governanceType', 'homeowners_association',
      'name', 'Spec 010 Slice 2 HOA',
      'status', 'documents_received',
      'sourceEvidenceId', declaration_evidence_id,
      'sourceRecordId', source_record_id,
      'sourceAnchor', jsonb_build_object('page', 1, 'section', 'Association'),
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'confidence', 70
    ),
    'spec010-slice2-record-create'
  ) result;

  select result.governance_document_id, result.governance_document_version
  into declaration_document_id, declaration_document_version
  from public.link_governance_document(
    created_governance_record_id,
    jsonb_build_object(
      'evidenceId', declaration_evidence_id,
      'documentType', 'other',
      'title', 'Misleading Rules Filename But Declaration Content',
      'hierarchyClassification', 'hierarchy_uncertain',
      'analysisState', 'awaiting_verification',
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'confidence', 50
    ),
    'spec010-slice2-document-declaration'
  ) result;

  select result.governance_document_id, result.governance_document_version
  into rules_document_id, rules_document_version
  from public.link_governance_document(
    created_governance_record_id,
    jsonb_build_object(
      'evidenceId', rules_evidence_id,
      'documentType', 'rules_regulations',
      'title', 'Parking and Leasing Rules',
      'hierarchyClassification', 'hierarchy_uncertain',
      'analysisState', 'awaiting_verification',
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'confidence', 60
    ),
    'spec010-slice2-document-rules'
  ) result;

  select result.governance_analysis_run_id, result.governance_analysis_run_version
  into analysis_run_id, analysis_run_version
  from public.start_governance_analysis_run(
    created_governance_record_id,
    jsonb_build_object('governanceDocumentId', declaration_document_id, 'inputHash', 'declaration-v1', 'providerId', 'deterministic_fixture'),
    'spec010-slice2-analysis-start'
  ) result;

  select result.governance_analysis_run_id into duplicate_run_id
  from public.start_governance_analysis_run(
    created_governance_record_id,
    jsonb_build_object('governanceDocumentId', declaration_document_id, 'inputHash', 'declaration-v1', 'providerId', 'deterministic_fixture'),
    'spec010-slice2-analysis-start'
  ) result;

  if duplicate_run_id is distinct from analysis_run_id then
    raise exception 'Expected identical analysis retry to return original run.';
  end if;

  select result.governance_document_version
  into declaration_document_version
  from public.record_governance_document_classification(
    declaration_document_id,
    jsonb_build_object(
      'proposedDocumentType', 'declaration_ccrs',
      'classificationState', 'classified_proposed',
      'classificationMethod', 'content_pattern',
      'evidenceBasis', jsonb_build_array('content:declaration language'),
      'sourceAnchor', jsonb_build_object('page', 1, 'article', 'I'),
      'warnings', jsonb_build_array('Filename alone was ignored.'),
      'confidence', 82,
      'analysisRunId', analysis_run_id
    ),
    declaration_document_version,
    'spec010-slice2-classify-declaration'
  ) result;

  select result.governance_analysis_run_version
  into analysis_run_version
  from public.complete_governance_analysis_run(
    analysis_run_id,
    jsonb_build_object('status', 'completed', 'resultHash', 'declaration-result-v1'),
    analysis_run_version,
    'spec010-slice2-analysis-complete'
  ) result;

  select result.governance_document_relationship_id
  into relationship_id
  from public.propose_governance_document_relationship(
    created_governance_record_id,
    jsonb_build_object(
      'sourceGovernanceDocumentId', rules_document_id,
      'targetGovernanceDocumentId', declaration_document_id,
      'relationshipType', 'conflicts_with',
      'relationshipState', 'proposed',
      'sourceAnchor', jsonb_build_object('page', 2, 'section', 'Leasing'),
      'confidence', 77,
      'reasoningCode', 'source_conflict_language',
      'professionalReviewRecommended', true,
      'analysisRunId', analysis_run_id
    ),
    'spec010-slice2-relationship'
  ) result;

  select result.governance_hierarchy_candidate_id
  into hierarchy_id
  from public.record_governance_hierarchy_candidate(
    rules_document_id,
    jsonb_build_object(
      'hierarchyState', 'hierarchy_uncertain',
      'relationshipIds', jsonb_build_array(relationship_id),
      'sourceAnchor', jsonb_build_object('page', 2, 'section', 'Leasing'),
      'reasoningCode', 'date_without_explicit_supersession_not_controlling',
      'confidence', 35,
      'professionalReviewRecommended', true,
      'analysisRunId', analysis_run_id
    ),
    'spec010-slice2-hierarchy'
  ) result;

  select result.governance_finding_id, result.governance_finding_version
  into rental_finding_id, rental_finding_version
  from public.upsert_governance_finding(
    created_governance_record_id,
    jsonb_build_object(
      'governanceDocumentId', declaration_document_id,
      'findingType', 'restriction',
      'findingCategory', 'rental',
      'summary', 'Rentals allowed with 12-month minimum.',
      'normalizedValue', jsonb_build_object('allowed', true, 'minimumLeaseMonths', 12),
      'normalizedRequirement', 'allowed_with_12_month_minimum',
      'severity', 'high',
      'impactType', 'leasing',
      'sourceEvidenceId', declaration_evidence_id,
      'sourceRecordId', source_record_id,
      'sourceAnchor', jsonb_build_object('page', 10, 'section', 'Leasing'),
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'professionalReviewRecommended', true,
      'confidence', 81
    ),
    null,
    'spec010-slice2-rental-finding'
  ) result;

  select result.governance_finding_id
  into rules_finding_id
  from public.upsert_governance_finding(
    created_governance_record_id,
    jsonb_build_object(
      'governanceDocumentId', rules_document_id,
      'findingType', 'restriction',
      'findingCategory', 'rental',
      'summary', 'Rules state rentals are prohibited.',
      'normalizedValue', jsonb_build_object('allowed', false),
      'normalizedRequirement', 'prohibited',
      'severity', 'high',
      'impactType', 'leasing',
      'sourceEvidenceId', rules_evidence_id,
      'sourceAnchor', jsonb_build_object('page', 4, 'section', 'Leasing Rules'),
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'professionalReviewRecommended', true,
      'confidence', 79
    ),
    null,
    'spec010-slice2-rules-finding'
  ) result;

  select result.governance_financial_id
  into financial_id
  from public.upsert_governance_financial(
    created_governance_record_id,
    jsonb_build_object(
      'governanceDocumentId', declaration_document_id,
      'periodStart', '2026-01-01',
      'periodEnd', '2026-12-31',
      'duesAmount', 450,
      'duesFrequency', 'monthly',
      'reserveBalance', 120000,
      'sourceEvidenceId', declaration_evidence_id,
      'sourceRecordId', source_record_id,
      'sourceAnchor', jsonb_build_object('page', 8, 'table', 'Resale certificate', 'row', 'Current dues'),
      'sourceClassification', 'document_extracted',
      'verificationState', 'document_extracted',
      'confidence', 74
    ),
    null,
    'spec010-slice2-financial'
  ) result;

  select result.governance_extraction_item_id
  into extraction_item_id
  from public.record_governance_extraction_item(
    created_governance_record_id,
    jsonb_build_object(
      'governanceDocumentId', declaration_document_id,
      'evidenceId', declaration_evidence_id,
      'analysisRunId', analysis_run_id,
      'extractionType', 'financial_input',
      'findingCategory', 'dues',
      'sourceAnchor', jsonb_build_object('page', 8, 'table', 'Resale certificate', 'row', 'Current dues'),
      'normalizedValue', jsonb_build_object('amount', 450, 'currency', 'USD', 'period', 'monthly', 'unitScope', 'per_unit', 'amountType', 'actual'),
      'warnings', jsonb_build_array('Do not annualize without verification.'),
      'confidence', 74,
      'providerMetadata', jsonb_build_object('providerId', 'deterministic_fixture', 'method', 'deterministic_fixture'),
      'proposedGovernanceFinancialId', financial_id,
      'inputHash', 'dues-monthly-v1'
    ),
    'spec010-slice2-extraction'
  ) result;

  select result.governance_extraction_item_id
  into duplicate_extraction_item_id
  from public.record_governance_extraction_item(
    created_governance_record_id,
    jsonb_build_object(
      'governanceDocumentId', declaration_document_id,
      'evidenceId', declaration_evidence_id,
      'analysisRunId', analysis_run_id,
      'extractionType', 'financial_input',
      'findingCategory', 'dues',
      'sourceAnchor', jsonb_build_object('page', 8, 'table', 'Resale certificate', 'row', 'Current dues'),
      'normalizedValue', jsonb_build_object('amount', 450, 'currency', 'USD', 'period', 'monthly', 'unitScope', 'per_unit', 'amountType', 'actual'),
      'warnings', jsonb_build_array('Do not annualize without verification.'),
      'confidence', 74,
      'providerMetadata', jsonb_build_object('providerId', 'deterministic_fixture', 'method', 'deterministic_fixture'),
      'proposedGovernanceFinancialId', financial_id,
      'inputHash', 'dues-monthly-v1'
    ),
    'spec010-slice2-extraction'
  ) result;

  if duplicate_extraction_item_id is distinct from extraction_item_id then
    raise exception 'Expected identical extraction retry to return original item.';
  end if;

  select result.governance_conflict_id, result.governance_conflict_version
  into conflict_id, conflict_version
  from public.create_governance_conflict(
    created_governance_record_id,
    jsonb_build_object(
      'category', 'rental',
      'conflictType', 'restriction_conflict',
      'summary', 'Declaration allows rentals with 12-month minimum, rules prohibit rentals.',
      'sourceADocumentId', declaration_document_id,
      'sourceAFindingId', rental_finding_id,
      'sourceBDocumentId', rules_document_id,
      'sourceBFindingId', rules_finding_id,
      'sourceAAnchor', jsonb_build_object('page', 10, 'section', 'Leasing'),
      'sourceBAnchor', jsonb_build_object('page', 4, 'section', 'Leasing Rules'),
      'normalizedA', jsonb_build_object('allowed', true, 'minimumLeaseMonths', 12),
      'normalizedB', jsonb_build_object('allowed', false),
      'conflictSeverity', 'high',
      'detectionMethod', 'deterministic_normalized_value',
      'confidence', 79,
      'professionalReviewRequired', true
    ),
    'spec010-slice2-conflict'
  ) result;

  select result.governance_question_id
  into question_id
  from public.create_governance_question(
    created_governance_record_id,
    jsonb_build_object(
      'governanceDocumentId', rules_document_id,
      'governanceConflictId', conflict_id,
      'question', 'Which rental provision currently controls?',
      'targetRole', 'attorney',
      'whyItMatters', 'Rental restrictions can affect strategy compatibility.',
      'sourceReason', 'Declaration and rules contain conflicting rental provisions.',
      'sourceAnchor', jsonb_build_object('page', 4, 'section', 'Leasing Rules'),
      'professionalReviewRecommended', true,
      'analysisRunId', analysis_run_id
    ),
    'spec010-slice2-question'
  ) result;

  select result.governance_analysis_run_id, result.governance_analysis_run_version, result.prior_valid_run_id
  into failed_run_id, analysis_run_version, prior_valid_run_id
  from public.start_governance_analysis_run(
    created_governance_record_id,
    jsonb_build_object('governanceDocumentId', declaration_document_id, 'inputHash', 'declaration-provider-fail-v2', 'providerId', 'deterministic_fixture'),
    'spec010-slice2-analysis-fail-start'
  ) result;

  if prior_valid_run_id is distinct from analysis_run_id then
    raise exception 'Expected failed retry candidate to preserve prior valid run %, got %.', analysis_run_id, prior_valid_run_id;
  end if;

  perform *
  from public.complete_governance_analysis_run(
    failed_run_id,
    jsonb_build_object('status', 'provider_failed', 'errorCode', 'provider_unavailable', 'safeErrorMessage', 'Provider unavailable; prior valid analysis preserved.'),
    analysis_run_version,
    'spec010-slice2-analysis-fail-complete'
  );

  select * into projection_result
  from public.governance_record_projection projection
  where projection.governance_record_id = created_governance_record_id;

  if projection_result.proposed_document_count < 1
     or projection_result.hierarchy_uncertain_count < 1
     or projection_result.extraction_item_count < 1
     or projection_result.open_question_count < 1
     or (projection_result.verification_summary ->> 'analysisFailureWithPriorValid')::boolean is not true then
    raise exception 'Expected Slice 2 projection state, got %.', row_to_json(projection_result);
  end if;

  select source_a_anchor, source_b_anchor, normalized_a, normalized_b
  into conflict_anchor
  from public.governance_conflicts
  where id = conflict_id;

  if conflict_anchor.source_a_anchor = '{}'::jsonb or conflict_anchor.normalized_b = '{}'::jsonb then
    raise exception 'Expected conflict anchors and normalized values to be preserved.';
  end if;

  select count(*) into detail_count
  from public.load_governance_record_detail(created_governance_record_id);

  if detail_count < 5 then
    raise exception 'Expected GovernanceIQ detail reopen rows, got %.', detail_count;
  end if;

  select count(*) into event_count
  from public.domain_events
  where workspace_id = test_workspace_id
    and event_type in ('governance.analysis_requested', 'governance.analysis_completed', 'governance.analysis_failed', 'governance.document_classified', 'governance.conflict_detected');

  select count(*) into audit_count
  from public.audit_events
  where workspace_id = test_workspace_id
    and action in ('governance.analysis_requested', 'governance.analysis_completed', 'governance.analysis_failed', 'governance.document_classified', 'governance.question_created');

  if event_count < 5 or audit_count < 5 then
    raise exception 'Expected Slice 2 events/audits, got events %, audits %.', event_count, audit_count;
  end if;

  begin
    execute 'set local role authenticated';
    insert into public.governance_analysis_runs (workspace_id, governance_record_id, input_hash, created_by, updated_by)
    values (test_workspace_id, created_governance_record_id, 'direct-write-should-fail', test_user_id, test_user_id);
  exception when insufficient_privilege or check_violation then
    direct_write_denied := true;
  end;
  execute 'reset role';

  if not direct_write_denied then
    raise exception 'Expected direct governance_analysis_runs insert to be denied.';
  end if;

  perform set_config('request.jwt.claim.sub', other_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  begin
    perform *
    from public.record_governance_extraction_item(
      created_governance_record_id,
      jsonb_build_object('governanceDocumentId', declaration_document_id, 'evidenceId', declaration_evidence_id, 'sourceAnchor', jsonb_build_object('page', 1), 'findingCategory', 'rental'),
      'spec010-slice2-cross-workspace'
    );
  exception when insufficient_privilege then
    cross_workspace_denied := true;
  end;

  if not cross_workspace_denied then
    raise exception 'Expected cross-workspace Slice 2 write to be denied.';
  end if;

  raise notice 'SPEC010_SLICE2_STAGING_SMOKE_OK record=% declaration=% rules=% run=% conflict=% question=%',
    created_governance_record_id, declaration_document_id, rules_document_id, analysis_run_id, conflict_id, question_id;
end $$;

rollback;

do $$
begin
  if exists (select 1 from auth.users where email in ('spec010-slice2-smoke@example.invalid', 'spec010-slice2-smoke-other@example.invalid')) then
    raise exception 'Rollback residue found in auth.users.';
  end if;

  if exists (select 1 from public.workspaces where name like 'Spec 010 Slice 2 Smoke%') then
    raise exception 'Rollback residue found in workspaces.';
  end if;

  raise notice 'SPEC010_SLICE2_ROLLBACK_RESIDUE_OK';
end $$;

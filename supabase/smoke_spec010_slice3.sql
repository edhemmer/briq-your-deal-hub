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
  financial_evidence_id uuid := gen_random_uuid();
  rules_evidence_id uuid := gen_random_uuid();
  source_record_id uuid := gen_random_uuid();
  created_governance_record_id uuid;
  governance_record_version integer;
  financial_document_id uuid;
  rules_document_id uuid;
  governance_document_version integer;
  financial_2025_id uuid;
  financial_2026_id uuid;
  str_finding_id uuid;
  str_finding_version integer;
  vehicle_finding_id uuid;
  vehicle_finding_version integer;
  trailer_finding_id uuid;
  trailer_finding_version integer;
  financial_result_id uuid;
  duplicate_financial_result_id uuid;
  financial_hash text;
  duplicate_financial_hash text;
  restriction_count integer;
  duplicate_restriction_count integer;
  projection_result record;
  detail_count integer;
  direct_write_denied boolean := false;
  cross_workspace_denied boolean := false;
  event_count integer;
  audit_count integer;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (test_user_id, 'authenticated', 'authenticated', 'spec010-slice3-smoke@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (other_user_id, 'authenticated', 'authenticated', 'spec010-slice3-smoke-other@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.workspaces (id, name, owner_user_id, status)
  values
    (test_workspace_id, 'Spec 010 Slice 3 Smoke Workspace', test_user_id, 'active'),
    (other_workspace_id, 'Spec 010 Slice 3 Smoke Other Workspace', other_user_id, 'active');

  insert into public.workspace_memberships (workspace_id, user_id, role_id, status, accepted_at)
  values
    (test_workspace_id, test_user_id, 'owner', 'active', now()),
    (other_workspace_id, other_user_id, 'owner', 'active', now());

  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.properties (id, workspace_id, display_address, address_line1, country, created_by, updated_by)
  values
    (test_property_id, test_workspace_id, 'Spec 010 Slice 3 Governance Property', 'Spec 010 Slice 3 Governance Property', 'US', test_user_id, test_user_id),
    (other_property_id, other_workspace_id, 'Spec 010 Slice 3 Other Property', 'Spec 010 Slice 3 Other Property', 'US', other_user_id, other_user_id);

  insert into public.brix_deals (id, owner_id, workspace_id, address, display_name, strategy_id, strategy_intent, created_by, updated_by)
  values
    (test_deal_id, test_user_id, test_workspace_id, 'Spec 010 Slice 3 Governance Property', 'Spec 010 Slice 3 Governance Deal', 'buy_hold_rental', 'buy_hold_rental', test_user_id, test_user_id),
    (other_deal_id, other_user_id, other_workspace_id, 'Spec 010 Slice 3 Other Property', 'Spec 010 Slice 3 Other Deal', 'buy_hold_rental', 'buy_hold_rental', other_user_id, other_user_id);

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
    jsonb_build_object('source', 'spec010 slice3 smoke'), '{}'::jsonb, test_property_id,
    test_deal_id, 'spec010-slice3-smoke-intake', now()
  );

  insert into public.evidence_items (
    id, workspace_id, intake_id, deal_id, property_id, evidence_type, original_filename, sanitized_filename, detected_mime_type,
    byte_size, content_hash, storage_object_key, uploaded_by, processing_status, extraction_status
  )
  values
    (financial_evidence_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document', '2026-budget-reserve.pdf', '2026-budget-reserve.pdf', 'application/pdf', 256, repeat('e', 64), 'spec010/slice3/financial.pdf', test_user_id, 'complete', 'complete'),
    (rules_evidence_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document', 'rules-restrictions.pdf', 'rules-restrictions.pdf', 'application/pdf', 256, repeat('f', 64), 'spec010/slice3/rules.pdf', test_user_id, 'complete', 'complete');

  insert into public.manual_source_records (
    id, workspace_id, intake_id, deal_id, property_id, source_type, source_name, original_values, classification,
    verification_state, evidence_id, content_hash, retrieved_at, created_by
  )
  values (
    source_record_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document', 'Spec 010 Slice 3 Source',
    '{}'::jsonb, jsonb_build_object('evidence', 'user_provided_source'), 'unverified', financial_evidence_id,
    repeat('e', 64), now(), test_user_id
  );

  select result.governance_record_id, result.governance_record_version
  into created_governance_record_id, governance_record_version
  from public.create_governance_record(
    test_workspace_id,
    jsonb_build_object(
      'dealId', test_deal_id,
      'propertyId', test_property_id,
      'governanceType', 'condominium_association',
      'name', 'Spec 010 Slice 3 Association',
      'status', 'current',
      'sourceEvidenceId', financial_evidence_id,
      'sourceRecordId', source_record_id,
      'sourceAnchor', jsonb_build_object('page', 1, 'section', 'Association'),
      'sourceClassification', 'document_extracted',
      'verificationState', 'confirmed',
      'confidence', 86
    ),
    'spec010-slice3-record-create'
  ) result;

  select result.governance_document_id, result.governance_document_version
  into financial_document_id, governance_document_version
  from public.link_governance_document(
    created_governance_record_id,
    jsonb_build_object('evidenceId', financial_evidence_id, 'documentType', 'budget', 'title', 'Budget and Reserve Package', 'hierarchyClassification', 'candidate_current', 'analysisState', 'current', 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'confidence', 86),
    'spec010-slice3-financial-document'
  ) result;

  select result.governance_document_id
  into rules_document_id
  from public.link_governance_document(
    created_governance_record_id,
    jsonb_build_object('evidenceId', rules_evidence_id, 'documentType', 'rules_regulations', 'title', 'Rules and Restrictions', 'hierarchyClassification', 'candidate_current', 'analysisState', 'current', 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'confidence', 82),
    'spec010-slice3-rules-document'
  ) result;

  select result.governance_financial_id
  into financial_2025_id
  from public.upsert_governance_financial(
    created_governance_record_id,
    jsonb_build_object('governanceDocumentId', financial_document_id, 'periodStart', '2025-01-01', 'periodEnd', '2025-12-31', 'duesAmount', 400, 'duesFrequency', 'monthly', 'revenueAmount', 120000, 'expenseAmount', 90000, 'reserveBalance', 45000, 'delinquencyAmount', 12000, 'sourceEvidenceId', financial_evidence_id, 'sourceRecordId', source_record_id, 'sourceAnchor', jsonb_build_object('page', 8, 'table', 'Budget', 'row', '2025'), 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'confidence', 86),
    null,
    'spec010-slice3-financial-2025'
  ) result;

  select result.governance_financial_id
  into financial_2026_id
  from public.upsert_governance_financial(
    created_governance_record_id,
    jsonb_build_object('governanceDocumentId', financial_document_id, 'periodStart', '2026-01-01', 'periodEnd', '2026-12-31', 'duesAmount', 430, 'duesFrequency', 'monthly', 'revenueAmount', 129000, 'expenseAmount', 100000, 'reserveBalance', 50000, 'delinquencyAmount', 12900, 'assessmentAmount', 8000, 'associationDebtAmount', 75000, 'insuranceExpenseAmount', 18000, 'insuranceDeductibleAmount', 25000, 'plannedProjectAmount', 100000, 'sourceEvidenceId', financial_evidence_id, 'sourceRecordId', source_record_id, 'sourceAnchor', jsonb_build_object('page', 9, 'table', 'Budget', 'row', '2026'), 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'confidence', 88),
    null,
    'spec010-slice3-financial-2026'
  ) result;

  select result.governance_finding_id, result.governance_finding_version
  into str_finding_id, str_finding_version
  from public.upsert_governance_finding(
    created_governance_record_id,
    jsonb_build_object('governanceDocumentId', rules_document_id, 'findingType', 'restriction', 'findingCategory', 'short_term_rental', 'summary', 'Short-term rentals under 30 days are prohibited.', 'normalizedValue', jsonb_build_object('allowed', false, 'maximumLeaseDays', 30), 'normalizedRequirement', 'short_term_rentals_under_30_days_prohibited', 'severity', 'high', 'impactType', 'leasing', 'sourceEvidenceId', rules_evidence_id, 'sourceAnchor', jsonb_build_object('page', 12, 'clause', '7.4'), 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'professionalReviewRecommended', false, 'confidence', 84),
    null,
    'spec010-slice3-str-finding'
  ) result;
  perform * from public.set_governance_finding_acceptance(str_finding_id, 'accepted', str_finding_version, 'spec010-slice3-str-accept', 'accepted for Slice 3 smoke');

  select version into str_finding_version from public.governance_findings where id = str_finding_id;

  select result.governance_finding_id, result.governance_finding_version
  into vehicle_finding_id, vehicle_finding_version
  from public.upsert_governance_finding(
    created_governance_record_id,
    jsonb_build_object('governanceDocumentId', rules_document_id, 'findingType', 'restriction', 'findingCategory', 'commercial_vehicle', 'summary', 'Commercial vehicle rule references pickup signage without defining personal pickups.', 'normalizedValue', jsonb_build_object('requirement', 'No commercial vehicles, including pickup-mounted contractor signs.'), 'normalizedRequirement', 'commercial_vehicle_scope_uncertain_for_pickups', 'severity', 'moderate', 'impactType', 'parking', 'sourceEvidenceId', rules_evidence_id, 'sourceAnchor', jsonb_build_object('page', 14, 'clause', '8.1'), 'sourceClassification', 'document_extracted', 'verificationState', 'document_extracted', 'professionalReviewRecommended', true, 'confidence', 72),
    null,
    'spec010-slice3-vehicle-finding'
  ) result;
  perform * from public.set_governance_finding_acceptance(vehicle_finding_id, 'accepted', vehicle_finding_version, 'spec010-slice3-vehicle-accept', 'accepted for Slice 3 smoke');

  select result.governance_finding_id, result.governance_finding_version
  into trailer_finding_id, trailer_finding_version
  from public.upsert_governance_finding(
    created_governance_record_id,
    jsonb_build_object('governanceDocumentId', rules_document_id, 'findingType', 'restriction', 'findingCategory', 'trailer', 'summary', 'Trailers are prohibited except temporary loading and unloading.', 'normalizedValue', jsonb_build_object('allowed', false, 'exception', 'Temporary loading and unloading is allowed.'), 'normalizedRequirement', 'trailers_prohibited_except_loading', 'severity', 'high', 'impactType', 'parking', 'sourceEvidenceId', rules_evidence_id, 'sourceAnchor', jsonb_build_object('page', 15, 'clause', '8.2'), 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'professionalReviewRecommended', false, 'confidence', 83),
    null,
    'spec010-slice3-trailer-finding'
  ) result;
  perform * from public.set_governance_finding_acceptance(trailer_finding_id, 'accepted', trailer_finding_version, 'spec010-slice3-trailer-accept', 'accepted for Slice 3 smoke');

  select result.governance_financial_analysis_result_id, result.result_hash
  into financial_result_id, financial_hash
  from public.run_governance_financial_analysis(created_governance_record_id, jsonb_build_object('assessmentStatus', 'PROPOSED'), 'spec010-slice3-financial-analysis') result;

  select result.governance_financial_analysis_result_id, result.result_hash
  into duplicate_financial_result_id, duplicate_financial_hash
  from public.run_governance_financial_analysis(created_governance_record_id, jsonb_build_object('assessmentStatus', 'PROPOSED'), 'spec010-slice3-financial-analysis') result;

  if duplicate_financial_result_id is distinct from financial_result_id or duplicate_financial_hash is distinct from financial_hash then
    raise exception 'Expected deterministic/idempotent financial result.';
  end if;

  select result.restriction_result_count
  into restriction_count
  from public.run_governance_restriction_intelligence(created_governance_record_id, '{}'::jsonb, 'spec010-slice3-restriction-analysis') result;

  select result.restriction_result_count
  into duplicate_restriction_count
  from public.run_governance_restriction_intelligence(created_governance_record_id, '{}'::jsonb, 'spec010-slice3-restriction-analysis') result;

  if restriction_count <> 3 or duplicate_restriction_count <> 3 then
    raise exception 'Expected three restriction intelligence results, got %, duplicate %.', restriction_count, duplicate_restriction_count;
  end if;

  if not exists (
    select 1
    from public.governance_financial_analysis_results
    where id = financial_result_id
      and (dues_indicator ->> 'growthPct')::numeric = 0.075
      and (reserve_indicator ->> 'reserveToAnnualExpenseRatio')::numeric = 0.50
      and (delinquency_indicator ->> 'delinquencyRate')::numeric = 0.100000
      and assessment_indicator ->> 'state' = 'proposed_only'
      and insurance_indicator ->> 'state' = 'descriptive_only'
  ) then
    raise exception 'Expected financial golden indicators to be persisted.';
  end if;

  if not exists (
    select 1
    from public.governance_restriction_intelligence_results
    where source_governance_finding_id = vehicle_finding_id
      and restriction_state = 'uncertain'
      and force_level = 'professional_review_required'
      and explanation_code = 'commercial_vehicle_pickup_scope_uncertain'
  ) then
    raise exception 'Expected commercial vehicle pickup scope uncertainty.';
  end if;

  if not exists (
    select 1
    from public.governance_restriction_intelligence_results
    where source_governance_finding_id = trailer_finding_id
      and restriction_state = 'prohibited'
      and exceptions ? 'Temporary loading and unloading is allowed.'
  ) then
    raise exception 'Expected trailer exception to be preserved.';
  end if;

  select * into projection_result
  from public.governance_record_projection projection
  where projection.governance_record_id = created_governance_record_id;

  if projection_result.financial_analysis_state is distinct from 'current'
     or projection_result.restriction_result_count <> 3
     or projection_result.hard_restriction_count < 2
     or projection_result.restriction_professional_review_count < 1
     or projection_result.open_question_count <> 0 then
    raise exception 'Expected Slice 3 projection state, got %.', row_to_json(projection_result);
  end if;

  select count(*) into detail_count
  from public.load_governance_record_detail(created_governance_record_id);

  if detail_count < 7 then
    raise exception 'Expected GovernanceIQ detail reopen rows, got %.', detail_count;
  end if;

  begin
    execute 'set local role authenticated';
    insert into public.governance_financial_analysis_results (workspace_id, governance_record_id, governance_record_version, input_hash, result_hash, created_by, updated_by)
    values (test_workspace_id, created_governance_record_id, governance_record_version, 'direct-write-should-fail', 'direct-write-should-fail', test_user_id, test_user_id);
  exception when insufficient_privilege or check_violation then
    direct_write_denied := true;
  end;
  execute 'reset role';

  if not direct_write_denied then
    raise exception 'Expected direct governance_financial_analysis_results insert to be denied.';
  end if;

  perform set_config('request.jwt.claim.sub', other_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  begin
    perform * from public.run_governance_financial_analysis(created_governance_record_id, '{}'::jsonb, 'spec010-slice3-cross-workspace');
  exception when insufficient_privilege then
    cross_workspace_denied := true;
  end;

  if not cross_workspace_denied then
    raise exception 'Expected cross-workspace Slice 3 analysis to be denied.';
  end if;

  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  select count(*) into event_count
  from public.domain_events
  where workspace_id = test_workspace_id
    and event_type in ('governance.financial_analysis_completed', 'governance.restriction_analysis_completed');

  select count(*) into audit_count
  from public.audit_events
  where workspace_id = test_workspace_id
    and action in ('governance.financial_analysis_completed', 'governance.restriction_analysis_completed');

  if event_count < 2 or audit_count < 2 then
    raise exception 'Expected Slice 3 events/audits, got events %, audits %.', event_count, audit_count;
  end if;

  raise notice 'SPEC010_SLICE3_STAGING_SMOKE_OK record=% financial_result=% restriction_count=% financial_2025=% financial_2026=%',
    created_governance_record_id, financial_result_id, restriction_count, financial_2025_id, financial_2026_id;
end $$;

rollback;

do $$
begin
  if exists (select 1 from auth.users where email in ('spec010-slice3-smoke@example.invalid', 'spec010-slice3-smoke-other@example.invalid')) then
    raise exception 'Rollback residue found in auth.users.';
  end if;

  if exists (select 1 from public.workspaces where name like 'Spec 010 Slice 3 Smoke%') then
    raise exception 'Rollback residue found in workspaces.';
  end if;

  raise notice 'SPEC010_SLICE3_ROLLBACK_RESIDUE_OK';
end $$;

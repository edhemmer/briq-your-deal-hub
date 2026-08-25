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
  governance_record_id uuid;
  governance_document_id uuid;
  dues_finding_id uuid;
  dues_finding_version integer;
  str_finding_id uuid;
  str_finding_version integer;
  litigation_finding_id uuid;
  litigation_finding_version integer;
  dues_propagation_id uuid;
  duplicate_dues_propagation_id uuid;
  stale_version_denied boolean := false;
  direct_write_denied boolean := false;
  cross_workspace_denied boolean := false;
  proposal_count integer;
  event_count integer;
  audit_count integer;
  projection_result record;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (test_user_id, 'authenticated', 'authenticated', 'spec010-slice4-smoke@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (other_user_id, 'authenticated', 'authenticated', 'spec010-slice4-smoke-other@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.workspaces (id, name, owner_user_id, status)
  values
    (test_workspace_id, 'Spec 010 Slice 4 Smoke Workspace', test_user_id, 'active'),
    (other_workspace_id, 'Spec 010 Slice 4 Smoke Other Workspace', other_user_id, 'active');

  insert into public.workspace_memberships (workspace_id, user_id, role_id, status, accepted_at)
  values
    (test_workspace_id, test_user_id, 'owner', 'active', now()),
    (other_workspace_id, other_user_id, 'owner', 'active', now());

  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.properties (id, workspace_id, display_address, address_line1, country, created_by, updated_by)
  values
    (test_property_id, test_workspace_id, 'Spec 010 Slice 4 Governance Property', 'Spec 010 Slice 4 Governance Property', 'US', test_user_id, test_user_id),
    (other_property_id, other_workspace_id, 'Spec 010 Slice 4 Other Property', 'Spec 010 Slice 4 Other Property', 'US', other_user_id, other_user_id);

  insert into public.brix_deals (id, owner_id, workspace_id, address, display_name, strategy_id, strategy_intent, created_by, updated_by)
  values
    (test_deal_id, test_user_id, test_workspace_id, 'Spec 010 Slice 4 Governance Property', 'Spec 010 Slice 4 Governance Deal', 'buy_hold_rental', 'buy_hold_rental', test_user_id, test_user_id),
    (other_deal_id, other_user_id, other_workspace_id, 'Spec 010 Slice 4 Other Property', 'Spec 010 Slice 4 Other Deal', 'buy_hold_rental', 'buy_hold_rental', other_user_id, other_user_id);

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
    jsonb_build_object('source', 'spec010 slice4 smoke'), '{}'::jsonb, test_property_id,
    test_deal_id, 'spec010-slice4-smoke-intake', now()
  );

  insert into public.evidence_items (
    id, workspace_id, intake_id, deal_id, property_id, evidence_type, original_filename, sanitized_filename, detected_mime_type,
    byte_size, content_hash, storage_object_key, uploaded_by, processing_status, extraction_status
  )
  values (
    evidence_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document',
    'governance-propagation.pdf', 'governance-propagation.pdf', 'application/pdf', 256,
    repeat('9', 64), 'spec010/slice4/governance.pdf', test_user_id, 'complete', 'complete'
  );

  insert into public.manual_source_records (
    id, workspace_id, intake_id, deal_id, property_id, source_type, source_name, original_values, classification,
    verification_state, evidence_id, content_hash, retrieved_at, created_by
  )
  values (
    source_record_id, test_workspace_id, intake_id, test_deal_id, test_property_id, 'document', 'Spec 010 Slice 4 Source',
    '{}'::jsonb, jsonb_build_object('evidence', 'user_provided_source'), 'unverified', evidence_id,
    repeat('9', 64), now(), test_user_id
  );

  select result.governance_record_id
  into governance_record_id
  from public.create_governance_record(
    test_workspace_id,
    jsonb_build_object(
      'dealId', test_deal_id,
      'propertyId', test_property_id,
      'governanceType', 'condominium_association',
      'name', 'Spec 010 Slice 4 Association',
      'status', 'current',
      'sourceEvidenceId', evidence_id,
      'sourceRecordId', source_record_id,
      'sourceAnchor', jsonb_build_object('page', 1),
      'sourceClassification', 'document_extracted',
      'verificationState', 'confirmed',
      'confidence', 91
    ),
    'spec010-slice4-record-create'
  ) result;

  select result.governance_document_id
  into governance_document_id
  from public.link_governance_document(
    governance_record_id,
    jsonb_build_object('evidenceId', evidence_id, 'documentType', 'rules_regulations', 'title', 'Rules and Budget', 'hierarchyClassification', 'candidate_current', 'analysisState', 'current', 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'confidence', 91),
    'spec010-slice4-document'
  ) result;

  select result.governance_finding_id, result.governance_finding_version
  into dues_finding_id, dues_finding_version
  from public.upsert_governance_finding(
    governance_record_id,
    jsonb_build_object('governanceDocumentId', governance_document_id, 'findingType', 'financial', 'findingCategory', 'dues', 'summary', 'Monthly dues increased from 400 to 450.', 'normalizedValue', jsonb_build_object('amount', 450, 'frequency', 'monthly', 'currency', 'USD'), 'normalizedRequirement', 'monthly_dues_450', 'severity', 'moderate', 'impactType', 'cost', 'sourceEvidenceId', evidence_id, 'sourceAnchor', jsonb_build_object('page', 8), 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'professionalReviewRecommended', false, 'confidence', 91),
    null,
    'spec010-slice4-dues-finding'
  ) result;
  perform * from public.set_governance_finding_acceptance(dues_finding_id, 'accepted', dues_finding_version, 'spec010-slice4-dues-accept', 'accepted for Slice 4 smoke');
  select version into dues_finding_version from public.governance_findings where id = dues_finding_id;

  select result.governance_change_propagation_id
  into dues_propagation_id
  from public.propagate_accepted_governance_change(
    dues_finding_id,
    jsonb_build_object('expectedFindingVersion', dues_finding_version, 'previousAcceptedValue', jsonb_build_object('amount', 400, 'frequency', 'monthly', 'currency', 'USD'), 'priorValidDownstream', true, 'staleDownstreamResultIds', jsonb_build_array('underwriting:snapshot-previous')),
    'spec010-slice4-dues-propagate'
  ) result;

  select result.governance_change_propagation_id
  into duplicate_dues_propagation_id
  from public.propagate_accepted_governance_change(
    dues_finding_id,
    jsonb_build_object('expectedFindingVersion', dues_finding_version, 'previousAcceptedValue', jsonb_build_object('amount', 400, 'frequency', 'monthly', 'currency', 'USD'), 'priorValidDownstream', true, 'staleDownstreamResultIds', jsonb_build_array('underwriting:snapshot-previous')),
    'spec010-slice4-dues-propagate'
  ) result;

  if duplicate_dues_propagation_id is distinct from dues_propagation_id then
    raise exception 'Expected duplicate dues propagation to return the same row.';
  end if;

  if not exists (
    select 1
    from public.governance_change_propagations propagation
    where propagation.id = dues_propagation_id
      and propagation.materiality = 'material'
      and propagation.impact_domains ? 'underwriting'
      and propagation.downstream_states ->> 'underwriting' = 'stale'
      and propagation.prior_valid_downstream
      and propagation.stale_downstream_result_ids ? 'underwriting:snapshot-previous'
  ) then
    raise exception 'Expected dues propagation to stale underwriting with prior valid downstream state.';
  end if;

  if not exists (
    select 1
    from public.governance_downstream_proposals proposal
    where proposal.propagation_id = dues_propagation_id
      and proposal.domain = 'underwriting'
      and proposal.proposal_type = 'underwriting_input'
      and proposal.target_field = 'operating_expenses.hoa_dues'
  ) then
    raise exception 'Expected dues underwriting input proposal.';
  end if;

  select result.governance_finding_id, result.governance_finding_version
  into str_finding_id, str_finding_version
  from public.upsert_governance_finding(
    governance_record_id,
    jsonb_build_object('governanceDocumentId', governance_document_id, 'findingType', 'restriction', 'findingCategory', 'short_term_rental', 'summary', 'Short-term rentals under 30 days are prohibited.', 'normalizedValue', jsonb_build_object('allowed', false, 'maximumLeaseDays', 30), 'normalizedRequirement', 'short_term_rentals_under_30_days_prohibited', 'severity', 'high', 'impactType', 'leasing', 'sourceEvidenceId', evidence_id, 'sourceAnchor', jsonb_build_object('page', 12), 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'professionalReviewRecommended', false, 'confidence', 89),
    null,
    'spec010-slice4-str-finding'
  ) result;
  perform * from public.set_governance_finding_acceptance(str_finding_id, 'accepted', str_finding_version, 'spec010-slice4-str-accept', 'accepted for Slice 4 smoke');
  select version into str_finding_version from public.governance_findings where id = str_finding_id;
  perform * from public.propagate_accepted_governance_change(str_finding_id, jsonb_build_object('expectedFindingVersion', str_finding_version), 'spec010-slice4-str-propagate');

  if exists (
    select 1
    from public.governance_downstream_proposals proposal
    where proposal.governance_finding_id = str_finding_id
      and proposal.domain = 'underwriting'
  ) then
    raise exception 'STR propagation must not create underwriting proposal.';
  end if;

  if not exists (
    select 1
    from public.governance_downstream_proposals proposal
    where proposal.governance_finding_id = str_finding_id
      and proposal.domain = 'strategy'
      and proposal.proposal_type = 'strategy_constraint'
      and proposal.target_field = 'governance_rental_constraint'
      and proposal.target_strategy_ids ? 'residential.short_term_rental'
  ) then
    raise exception 'Expected STR strategy constraint proposal.';
  end if;

  select result.governance_finding_id, result.governance_finding_version
  into litigation_finding_id, litigation_finding_version
  from public.upsert_governance_finding(
    governance_record_id,
    jsonb_build_object('governanceDocumentId', governance_document_id, 'findingType', 'risk', 'findingCategory', 'litigation', 'summary', 'Association disclosed pending roof litigation.', 'normalizedValue', jsonb_build_object('present', true, 'descriptionCode', 'pending_roof_litigation'), 'normalizedRequirement', 'pending_roof_litigation_disclosed', 'severity', 'high', 'impactType', 'financing', 'sourceEvidenceId', evidence_id, 'sourceAnchor', jsonb_build_object('page', 18), 'sourceClassification', 'document_extracted', 'verificationState', 'confirmed', 'professionalReviewRecommended', true, 'confidence', 87),
    null,
    'spec010-slice4-litigation-finding'
  ) result;
  perform * from public.set_governance_finding_acceptance(litigation_finding_id, 'accepted', litigation_finding_version, 'spec010-slice4-litigation-accept', 'accepted for Slice 4 smoke');
  select version into litigation_finding_version from public.governance_findings where id = litigation_finding_id;
  perform * from public.propagate_accepted_governance_change(litigation_finding_id, jsonb_build_object('expectedFindingVersion', litigation_finding_version), 'spec010-slice4-litigation-propagate');

  if not exists (
    select 1
    from public.governance_downstream_proposals proposal
    where proposal.governance_finding_id = litigation_finding_id
      and proposal.domain = 'finance'
      and proposal.proposal_type = 'finance_condition'
      and proposal.target_field = 'governance_litigation_review'
  ) then
    raise exception 'Expected litigation finance condition proposal.';
  end if;

  select * into projection_result
  from public.governance_change_propagation_projection projection
  where projection.governance_change_propagation_id = dues_propagation_id;

  if projection_result.underwriting_proposal_count <> 1
     or projection_result.cockpit_proposal_count <> 1
     or projection_result.downstream_proposal_count <> 2 then
    raise exception 'Expected dues propagation projection counts, got %.', row_to_json(projection_result);
  end if;

  update public.governance_findings
  set normalized_value = jsonb_build_object('amount', 475, 'frequency', 'monthly', 'currency', 'USD'),
      version = version + 1,
      updated_by = test_user_id
  where id = dues_finding_id;

  begin
    perform * from public.propagate_accepted_governance_change(
      dues_finding_id,
      jsonb_build_object('expectedFindingVersion', dues_finding_version),
      'spec010-slice4-dues-stale-replay'
    );
  exception when serialization_failure then
    stale_version_denied := true;
  end;

  if not stale_version_denied then
    raise exception 'Expected stale accepted-finding version replay to be rejected.';
  end if;

  begin
    execute 'set local role authenticated';
    insert into public.governance_downstream_proposals (
      workspace_id, deal_id, property_id, propagation_id, governance_finding_id, finding_version,
      domain, proposal_type, proposal_key, target_field, normalized_value, explanation, idempotency_key
    )
    values (
      test_workspace_id, test_deal_id, test_property_id, dues_propagation_id, dues_finding_id, dues_finding_version,
      'underwriting', 'underwriting_input', 'direct-write-should-fail', 'operating_expenses.hoa_dues', '{}'::jsonb, 'direct write should fail', 'direct-write-should-fail'
    );
  exception when insufficient_privilege or check_violation then
    direct_write_denied := true;
  end;
  execute 'reset role';

  if not direct_write_denied then
    raise exception 'Expected direct governance downstream proposal write to be denied.';
  end if;

  perform set_config('request.jwt.claim.sub', other_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  begin
    perform * from public.propagate_accepted_governance_change(str_finding_id, jsonb_build_object('expectedFindingVersion', str_finding_version), 'spec010-slice4-cross-workspace');
  exception when insufficient_privilege then
    cross_workspace_denied := true;
  end;

  if not cross_workspace_denied then
    raise exception 'Expected cross-workspace propagation to be denied.';
  end if;

  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  select count(*) into proposal_count
  from public.governance_downstream_proposals
  where workspace_id = test_workspace_id;

  select count(*) into event_count
  from public.domain_events
  where workspace_id = test_workspace_id
    and event_type in ('governance.financials_changed', 'governance.restriction_changed', 'governance.finding_accepted');

  select count(*) into audit_count
  from public.audit_events
  where workspace_id = test_workspace_id
    and action = 'governance.change_propagated'
    and metadata ->> 'downstream_mutation' = 'false';

  if proposal_count < 6 or event_count < 3 or audit_count < 3 then
    raise exception 'Expected Slice 4 proposals/events/audits, got proposals %, events %, audits %.', proposal_count, event_count, audit_count;
  end if;

  raise notice 'SPEC010_SLICE4_STAGING_SMOKE_OK record=% dues_propagation=% proposals=% events=% audits=%',
    governance_record_id, dues_propagation_id, proposal_count, event_count, audit_count;
end $$;

rollback;

do $$
begin
  if exists (select 1 from auth.users where email in ('spec010-slice4-smoke@example.invalid', 'spec010-slice4-smoke-other@example.invalid')) then
    raise exception 'Rollback residue found in auth.users.';
  end if;

  if exists (select 1 from public.workspaces where name like 'Spec 010 Slice 4 Smoke%') then
    raise exception 'Rollback residue found in workspaces.';
  end if;

  raise notice 'SPEC010_SLICE4_ROLLBACK_RESIDUE_OK';
end $$;

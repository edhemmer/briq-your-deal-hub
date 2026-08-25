begin;

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'spec011-smoke@example.test', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.workspaces (id, name, owner_user_id, status)
values ('22222222-2222-4222-8222-222222222222', 'Spec 011 Smoke Workspace', '11111111-1111-4111-8111-111111111111', 'active');

insert into public.workspace_memberships (workspace_id, user_id, role_id, status)
values ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'owner', 'active');

insert into public.properties (id, workspace_id, display_address, address_line1, city, region, postal_code, country, created_by, updated_by)
values ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', '11 Contract Way', '11 Contract Way', 'Testville', 'IL', '60000', 'US', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

insert into public.brix_deals (id, owner_id, workspace_id, display_name, deal_type, stage, operating_status, priority, source, strategy_intent, status, address, strategy_id, facts, verification, analysis, created_by, updated_by)
values ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Spec 011 Smoke Deal', 'acquisition', 'under_contract', 'active', 'normal', 'manual', 'buy_and_hold', 'under_contract', '11 Contract Way', 'buy_and_hold', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

insert into public.deal_properties (id, workspace_id, deal_id, property_id, role, inclusion_status, created_by, updated_by)
values ('55555555-5555-4555-8555-555555555555', '22222222-2222-4222-8222-222222222222', '44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333', 'primary', 'active', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111');

insert into public.property_intakes (id, workspace_id, user_id, state, source_type, original_input, normalized_location, selected_property_id, resulting_property_id, resulting_deal_id, idempotency_key)
values ('88888888-8888-4888-8888-888888888888', '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'complete', 'document', '{"filename":"purchase-agreement.pdf"}'::jsonb, '{"address":"11 Contract Way"}'::jsonb, '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444', 'spec011:smoke-intake');

insert into public.manual_source_records (id, workspace_id, intake_id, deal_id, property_id, source_type, source_name, original_values, status, classification, verification_state, created_by, canonical_source_class, classification_confidence_tier, classification_version, classification_method, classification_evidence, processing_eligibility, allowed_extraction_engines, supported_downstream_modules)
values ('66666666-6666-4666-8666-666666666666', '22222222-2222-4222-8222-222222222222', '88888888-8888-4888-8888-888888888888', '44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333', 'document', 'Smoke contract upload', '{"filename":"purchase-agreement.pdf"}'::jsonb, 'active', '{"canonicalClass":"purchase_contract"}'::jsonb, 'unverified', '11111111-1111-4111-8111-111111111111', 'purchase_contract', 'strong', 'smoke-v1', 'manual_review', '[]'::jsonb, '{}'::jsonb, array['contractiq'], array['contractiq']);

insert into public.evidence_items (id, workspace_id, intake_id, deal_id, property_id, source_record_id, evidence_type, original_filename, sanitized_filename, detected_mime_type, byte_size, content_hash, storage_object_key, uploaded_by, processing_status, extraction_status)
values ('77777777-7777-4777-8777-777777777777', '22222222-2222-4222-8222-222222222222', '88888888-8888-4888-8888-888888888888', '44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333', '66666666-6666-4666-8666-666666666666', 'document', 'purchase-agreement.pdf', 'purchase-agreement.pdf', 'application/pdf', 1024, repeat('a', 64), 'spec011/purchase-agreement.pdf', '11111111-1111-4111-8111-111111111111', 'complete', 'complete');

set local role authenticated;

create temp table spec011_contract as
select * from public.create_contract(
  '22222222-2222-4222-8222-222222222222',
  '{"dealId":"44444444-4444-4444-8444-444444444444","propertyId":"33333333-3333-4333-8333-333333333333","title":"Smoke Purchase Agreement","contractType":"purchase_agreement","perspective":"buyer","status":"under_review","sourceEvidenceId":"77777777-7777-4777-8777-777777777777","verificationState":"source_backed","analysisState":"awaiting_verification","confidence":88}'::jsonb,
  'spec011:create-contract'
);

create temp table spec011_contract_retry as
select * from public.create_contract(
  '22222222-2222-4222-8222-222222222222',
  '{"dealId":"44444444-4444-4444-8444-444444444444","propertyId":"33333333-3333-4333-8333-333333333333","title":"Smoke Purchase Agreement","contractType":"purchase_agreement","perspective":"buyer","status":"under_review","sourceEvidenceId":"77777777-7777-4777-8777-777777777777","verificationState":"source_backed","analysisState":"awaiting_verification","confidence":88}'::jsonb,
  'spec011:create-contract'
);

create temp table spec011_evidence as
select * from public.link_contract_evidence((select contract_id from spec011_contract), '{"evidenceId":"77777777-7777-4777-8777-777777777777","linkRole":"addendum","sourceAnchor":{"kind":"attachment","label":"PDF attachment"}}'::jsonb, 'spec011:link-evidence');

create temp table spec011_party as
select * from public.add_contract_party((select contract_id from spec011_contract), '{"partyRole":"seller","displayName":"Smoke Seller LLC","sourceEvidenceId":"77777777-7777-4777-8777-777777777777","sourceAnchor":{"kind":"signature_block","page":12},"verificationState":"source_backed","confidence":80}'::jsonb, 'spec011:add-party');

create temp table spec011_term as
select * from public.add_contract_term((select contract_id from spec011_contract), '{"termCategory":"economic","termType":"purchase_price","title":"Purchase price","normalizedValue":{"amount":350000,"currency":"USD"},"displayValue":"$350,000","sourceEvidenceId":"77777777-7777-4777-8777-777777777777","sourceAnchor":{"kind":"clause","page":2,"clause":"2"},"verificationState":"source_backed","materiality":"critical"}'::jsonb, 'spec011:add-term');

create temp table spec011_accept as
select * from public.accept_contract_term((select contract_term_id from spec011_term), (select contract_term_version from spec011_term), 'spec011:accept-term', 'Smoke acceptance only; no downstream mutation.');

create temp table spec011_deadline as
select * from public.add_contract_deadline(
  (select contract_id from spec011_contract),
  jsonb_build_object(
    'contractTermId', (select contract_term_id from spec011_term),
    'deadlineType', 'inspection_period',
    'triggerType', 'execution_date',
    'triggerDate', '2026-08-25',
    'offsetValue', 5,
    'offsetUnit', 'business_days',
    'businessDayRule', 'professional_review_required',
    'timezone', 'America/Chicago',
    'sourceEvidenceId', '77777777-7777-4777-8777-777777777777',
    'sourceAnchor', jsonb_build_object('kind', 'clause', 'page', 4, 'clause', '8'),
    'verificationState', 'unverified',
    'status', 'pending_verification',
    'professionalReviewRequired', true
  ),
  'spec011:add-deadline'
);

create temp table spec011_finding as
select * from public.add_contract_finding(
  (select contract_id from spec011_contract),
  jsonb_build_object(
    'contractTermId', (select contract_term_id from spec011_term),
    'findingCategory', 'money',
    'findingType', 'price_term',
    'summary', 'Purchase price is source-backed but still requires buyer verification.',
    'severity', 'moderate',
    'perspective', 'buyer',
    'sourceEvidenceId', '77777777-7777-4777-8777-777777777777',
    'sourceAnchor', jsonb_build_object('kind', 'clause', 'page', 2, 'clause', '2'),
    'verificationState', 'source_backed',
    'professionalReviewRequired', false
  ),
  'spec011:add-finding'
);

create temp table spec011_conflict as
select * from public.create_contract_conflict((select contract_id from spec011_contract), '{"conflictType":"date_conflict","summary":"Inspection deadline trigger date conflicts with email note.","severity":"high","sourceAEvidenceId":"77777777-7777-4777-8777-777777777777","sourceAAnchor":{"kind":"clause","page":4,"clause":"8"},"sourceBEvidenceId":"77777777-7777-4777-8777-777777777777","sourceBAnchor":{"kind":"email_message","label":"broker email"},"professionalReviewRequired":true}'::jsonb, 'spec011:add-conflict');

create temp table spec011_resolved as
select * from public.resolve_contract_conflict((select contract_conflict_id from spec011_conflict), '{"resolutionState":"professional_review_required","resolutionNotes":"Keep both sources visible until attorney confirms trigger."}'::jsonb, (select contract_conflict_version from spec011_conflict), 'spec011:resolve-conflict');

create temp table spec011_question as
select * from public.add_contract_question(
  (select contract_id from spec011_contract),
  jsonb_build_object(
    'contractTermId', (select contract_term_id from spec011_term),
    'contractConflictId', (select contract_conflict_id from spec011_conflict),
    'question', 'Which date starts the inspection period?',
    'recipientRole', 'buyer_attorney',
    'priority', 'high',
    'rationale', 'Conflicting source anchors affect a deadline.',
    'sourceEvidenceId', '77777777-7777-4777-8777-777777777777',
    'sourceAnchor', jsonb_build_object('kind', 'clause', 'page', 4, 'clause', '8'),
    'perspective', 'buyer'
  ),
  'spec011:add-question'
);

create temp table spec011_proposal as
select * from public.add_contract_change_proposal(
  (select contract_id from spec011_contract),
  jsonb_build_object(
    'contractTermId', (select contract_term_id from spec011_term),
    'contractFindingId', (select contract_finding_id from spec011_finding),
    'proposalType', 'discussion_draft',
    'suggestedLanguage', 'Discussion draft only: clarify the inspection-period trigger date.',
    'rationale', 'The sources conflict and require professional review.',
    'recipientRole', 'buyer_attorney',
    'priority', 'high',
    'sourceEvidenceId', '77777777-7777-4777-8777-777777777777',
    'sourceAnchor', jsonb_build_object('kind', 'clause', 'page', 4, 'clause', '8')
  ),
  'spec011:add-proposal'
);

create temp table spec011_projection as
select * from public.list_contract_projection('44444444-4444-4444-8444-444444444444', null);

create temp table spec011_detail as
select * from public.load_contract_detail((select contract_id from spec011_contract));

create temp table spec011_direct_write_denial as
select exists (
  select 1 from pg_policies
  where schemaname = 'public'
    and tablename = 'contract_terms'
    and policyname = 'contract terms no direct insert'
) as direct_insert_denied_policy_present;

select
  (select count(*) = 1 from spec011_contract) as step_01_contract_created,
  (select c.contract_id = r.contract_id from spec011_contract c cross join spec011_contract_retry r) as step_02_idempotent_create,
  (select count(*) >= 1 from spec011_evidence) as step_03_evidence_linked,
  (select count(*) = 1 from spec011_party) as step_04_party_created,
  (select count(*) = 1 from spec011_term) as step_05_term_created,
  (select proposal_state = 'accepted' from spec011_accept) as step_06_term_accepted,
  (select status = 'pending_verification' from spec011_deadline) as step_07_deadline_modeled_not_calculated,
  (select count(*) = 1 from spec011_finding) as step_08_finding_created,
  (select resolution_state = 'unresolved' from spec011_conflict) as step_09_conflict_preserved,
  (select resolution_state = 'professional_review_required' from spec011_resolved) as step_10_conflict_resolution_versioned,
  (select status = 'open' from spec011_question) as step_11_question_created,
  (select status = 'proposed' from spec011_proposal) as step_12_discussion_draft_proposal_created,
  (select term_count = 1 and accepted_term_count = 1 from spec011_projection) as step_13_projection_terms_reconcile,
  (select unresolved_conflict_count = 1 and open_question_count = 1 from spec011_projection) as step_14_projection_attention_counts,
  (select professional_review_required from spec011_projection) as step_15_professional_review_flag,
  (select count(*) >= 8 from spec011_detail) as step_16_detail_loads_all_children,
  (select count(*) >= 2 from public.domain_events where workspace_id = '22222222-2222-4222-8222-222222222222' and event_type like 'contract.%') as step_17_domain_events_emitted,
  (select count(*) >= 2 from public.audit_events where workspace_id = '22222222-2222-4222-8222-222222222222' and action like 'contract.%') as step_18_audit_events_emitted,
  (select count(*) >= 2 from public.contract_command_requests where workspace_id = '22222222-2222-4222-8222-222222222222') as step_19_idempotency_ledger_written,
  (select count(*) >= 1 from public.contract_record_versions where workspace_id = '22222222-2222-4222-8222-222222222222') as step_20_version_history_written,
  (select direct_insert_denied_policy_present from spec011_direct_write_denial) as step_21_direct_write_denial_policy,
  (select source_anchor <> '{}'::jsonb from public.contract_terms where id = (select contract_term_id from spec011_term)) as step_22_source_anchor_preserved,
  (select not exists (select 1 from public.contract_deadlines where id = (select contract_deadline_id from spec011_deadline) and calculated_due_at is not null)) as step_23_no_deadline_engine_claim;

rollback;

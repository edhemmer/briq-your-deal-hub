begin;

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111112', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('11111111-1111-4111-8111-111111111112', 'authenticated', 'authenticated', 'spec011-slice2-smoke@example.test', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

insert into public.workspaces (id, name, owner_user_id, status)
values ('22222222-2222-4222-8222-222222222223', 'Spec 011 Slice 2 Smoke Workspace', '11111111-1111-4111-8111-111111111112', 'active');

insert into public.workspace_memberships (workspace_id, user_id, role_id, status)
values ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111112', 'owner', 'active');

insert into public.properties (id, workspace_id, display_address, address_line1, city, region, postal_code, country, created_by, updated_by)
values ('33333333-3333-4333-8333-333333333334', '22222222-2222-4222-8222-222222222223', '22 Extraction Way', '22 Extraction Way', 'Testville', 'IL', '60000', 'US', '11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111112');

insert into public.brix_deals (id, owner_id, workspace_id, display_name, deal_type, stage, operating_status, priority, source, strategy_intent, status, address, strategy_id, facts, verification, analysis, created_by, updated_by)
values ('44444444-4444-4444-8444-444444444445', '11111111-1111-4111-8111-111111111112', '22222222-2222-4222-8222-222222222223', 'Spec 011 Slice 2 Smoke Deal', 'acquisition', 'under_contract', 'active', 'normal', 'manual', 'buy_and_hold', 'under_contract', '22 Extraction Way', 'buy_and_hold', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111112');

insert into public.deal_properties (id, workspace_id, deal_id, property_id, role, inclusion_status, created_by, updated_by)
values ('55555555-5555-4555-8555-555555555556', '22222222-2222-4222-8222-222222222223', '44444444-4444-4444-8444-444444444445', '33333333-3333-4333-8333-333333333334', 'primary', 'active', '11111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111112');

insert into public.property_intakes (id, workspace_id, user_id, state, source_type, original_input, normalized_location, selected_property_id, resulting_property_id, resulting_deal_id, idempotency_key)
values ('88888888-8888-4888-8888-888888888889', '22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111112', 'complete', 'document', '{"filename":"purchase-agreement.pdf"}'::jsonb, '{"address":"22 Extraction Way"}'::jsonb, '33333333-3333-4333-8333-333333333334', '33333333-3333-4333-8333-333333333334', '44444444-4444-4444-8444-444444444445', 'spec011:slice2-smoke-intake');

insert into public.manual_source_records (id, workspace_id, intake_id, deal_id, property_id, source_type, source_name, original_values, status, classification, verification_state, created_by, canonical_source_class, classification_confidence_tier, classification_version, classification_method, classification_evidence, processing_eligibility, allowed_extraction_engines, supported_downstream_modules)
values ('66666666-6666-4666-8666-666666666667', '22222222-2222-4222-8222-222222222223', '88888888-8888-4888-8888-888888888889', '44444444-4444-4444-8444-444444444445', '33333333-3333-4333-8333-333333333334', 'document', 'Smoke contract upload batch', '{"filename":"purchase-agreement.pdf"}'::jsonb, 'active', '{"canonicalClass":"purchase_contract"}'::jsonb, 'unverified', '11111111-1111-4111-8111-111111111112', 'purchase_contract', 'strong', 'contractiq-source-classification-v1', 'content_pattern', '[]'::jsonb, '{}'::jsonb, array['contractiq'], array['contractiq']);

insert into public.evidence_items (id, workspace_id, intake_id, deal_id, property_id, source_record_id, evidence_type, original_filename, sanitized_filename, detected_mime_type, byte_size, content_hash, storage_object_key, uploaded_by, processing_status, extraction_status)
values
  ('77777777-7777-4777-8777-777777777778', '22222222-2222-4222-8222-222222222223', '88888888-8888-4888-8888-888888888889', '44444444-4444-4444-8444-444444444445', '33333333-3333-4333-8333-333333333334', '66666666-6666-4666-8666-666666666667', 'document', 'purchase-agreement.pdf', 'purchase-agreement.pdf', 'application/pdf', 1024, repeat('b', 64), 'spec011/slice2/purchase-agreement.pdf', '11111111-1111-4111-8111-111111111112', 'complete', 'complete'),
  ('77777777-7777-4777-8777-777777777779', '22222222-2222-4222-8222-222222222223', '88888888-8888-4888-8888-888888888889', '44444444-4444-4444-8444-444444444445', '33333333-3333-4333-8333-333333333334', '66666666-6666-4666-8666-666666666667', 'document', 'amendment-1.pdf', 'amendment-1.pdf', 'application/pdf', 1024, repeat('c', 64), 'spec011/slice2/amendment-1.pdf', '11111111-1111-4111-8111-111111111112', 'complete', 'complete');

set local role authenticated;

create temp table spec011_base_contract as
select * from public.create_contract(
  '22222222-2222-4222-8222-222222222223',
  '{"dealId":"44444444-4444-4444-8444-444444444445","propertyId":"33333333-3333-4333-8333-333333333334","title":"Smoke Purchase Agreement","contractType":"other","perspective":"buyer","status":"under_review","sourceEvidenceId":"77777777-7777-4777-8777-777777777778","verificationState":"source_backed","analysisState":"uploaded","confidence":70}'::jsonb,
  'spec011:slice2-create-base'
);

create temp table spec011_amendment_contract as
select * from public.create_contract(
  '22222222-2222-4222-8222-222222222223',
  '{"dealId":"44444444-4444-4444-8444-444444444445","propertyId":"33333333-3333-4333-8333-333333333334","title":"Smoke First Amendment","contractType":"other","perspective":"buyer","status":"under_review","sourceEvidenceId":"77777777-7777-4777-8777-777777777779","verificationState":"source_backed","analysisState":"uploaded","confidence":70}'::jsonb,
  'spec011:slice2-create-amendment'
);

create temp table spec011_run as
select * from public.start_contract_analysis_run(
  (select contract_id from spec011_base_contract),
  '{"evidenceId":"77777777-7777-4777-8777-777777777778","analysisContractVersion":"contractiq-document-analysis-v1","extractionContractVersion":"contractiq-extraction-v1","providerId":"deterministic_fixture","providerMethod":"deterministic_fixture","inputHash":"purchase-v1"}'::jsonb,
  'spec011:slice2-run-start'
);

create temp table spec011_classification as
select * from public.record_contract_document_classification(
  (select contract_id from spec011_base_contract),
  jsonb_build_object(
    'classificationState', 'classified_proposed',
    'classificationMethod', 'content_pattern',
    'proposedContractType', 'purchase_agreement',
    'classificationEvidence', jsonb_build_array(jsonb_build_object('pattern', 'purchase agreement', 'sourceAnchor', jsonb_build_object('kind', 'page', 'page', 1))),
    'sourceAnchor', jsonb_build_object('kind', 'page', 'page', 1),
    'analysisRunId', (select contract_analysis_run_id from spec011_run),
    'verificationState', 'source_backed'
  ),
  (select version from public.contracts where id = (select contract_id from spec011_base_contract)),
  'spec011:slice2-classify-base'
);

create temp table spec011_seller_party as
select * from public.add_contract_party((select contract_id from spec011_base_contract), '{"partyRole":"seller","displayName":"Extraction Seller LLC","sourceEvidenceId":"77777777-7777-4777-8777-777777777778","sourceAnchor":{"kind":"signature_block","page":12},"verificationState":"source_backed","confidence":84}'::jsonb, 'spec011:slice2-add-seller');

create temp table spec011_price_term as
select * from public.add_contract_term((select contract_id from spec011_base_contract), '{"termCategory":"economic","termType":"purchase_price","title":"Purchase price","normalizedValue":{"amount":350000,"currency":"USD"},"displayValue":"$350,000","sourceEvidenceId":"77777777-7777-4777-8777-777777777778","sourceAnchor":{"kind":"clause","page":2,"clause":"2"},"verificationState":"source_backed","materiality":"critical"}'::jsonb, 'spec011:slice2-add-price');

create temp table spec011_inspection_term as
select * from public.add_contract_term((select contract_id from spec011_base_contract), '{"termCategory":"contingency","termType":"inspection_contingency","title":"Inspection contingency","normalizedValue":{"periodValue":10,"periodUnit":"calendar_days","trigger":"execution_date","exception":"seller repairs excluded unless separately agreed"},"displayValue":"10 calendar days after execution","sourceEvidenceId":"77777777-7777-4777-8777-777777777778","sourceAnchor":{"kind":"clause","page":5,"clause":"8"},"verificationState":"unverified","materiality":"critical"}'::jsonb, 'spec011:slice2-add-inspection');

create temp table spec011_party_extraction as
select * from public.record_contract_extraction_item((select contract_id from spec011_base_contract), jsonb_build_object('evidenceId','77777777-7777-4777-8777-777777777778','analysisRunId',(select contract_analysis_run_id from spec011_run),'extractionType','party','normalizedType','seller','proposedNormalizedValue',jsonb_build_object('displayName','Extraction Seller LLC','signatureStatus','signed','entityType','organization'),'displayValue','Extraction Seller LLC signed as Seller','sourceAnchor',jsonb_build_object('kind','signature_block','page',12),'confidence',84,'verificationState','source_backed','proposedContractPartyId',(select contract_party_id from spec011_seller_party)), 'spec011:slice2-party-extraction');

create temp table spec011_price_extraction as
select * from public.record_contract_extraction_item((select contract_id from spec011_base_contract), jsonb_build_object('evidenceId','77777777-7777-4777-8777-777777777778','analysisRunId',(select contract_analysis_run_id from spec011_run),'extractionType','economic_term','normalizedType','purchase_price','proposedNormalizedValue',jsonb_build_object('amount',350000,'currency','USD'),'displayValue','$350,000','sourceAnchor',jsonb_build_object('kind','clause','page',2,'clause','2'),'confidence',89,'verificationState','source_backed','proposedContractTermId',(select contract_term_id from spec011_price_term),'unit','total','currency','USD'), 'spec011:slice2-price-extraction');

create temp table spec011_contingency_extraction as
select * from public.record_contract_extraction_item((select contract_id from spec011_base_contract), jsonb_build_object('evidenceId','77777777-7777-4777-8777-777777777778','analysisRunId',(select contract_analysis_run_id from spec011_run),'extractionType','contingency','normalizedType','inspection_period','proposedNormalizedValue',jsonb_build_object('periodValue',10,'periodUnit','calendar_days','trigger','execution_date','exception','seller repairs excluded unless separately agreed'),'displayValue','10 calendar days after execution','sourceAnchor',jsonb_build_object('kind','clause','page',5,'clause','8'),'confidence',78,'verificationState','unverified','ambiguityState','incomplete','proposedContractTermId',(select contract_term_id from spec011_inspection_term),'warnings',jsonb_build_array('Deadline due date is not calculated in Slice 2.')), 'spec011:slice2-contingency-extraction');

create temp table spec011_duplicate_price_extraction as
select * from public.record_contract_extraction_item((select contract_id from spec011_base_contract), jsonb_build_object('evidenceId','77777777-7777-4777-8777-777777777778','analysisRunId',(select contract_analysis_run_id from spec011_run),'extractionType','economic_term','normalizedType','purchase_price','proposedNormalizedValue',jsonb_build_object('amount',350000,'currency','USD'),'displayValue','$350,000','sourceAnchor',jsonb_build_object('kind','clause','page',2,'clause','2'),'confidence',89,'verificationState','source_backed','proposedContractTermId',(select contract_term_id from spec011_price_term),'unit','total','currency','USD'), 'spec011:slice2-price-extraction');

create temp table spec011_party_match as
select * from public.propose_contract_party_match((select contract_party_id from spec011_seller_party), jsonb_build_object('targetType','organization','matchState','manual_review_required','deterministicSignals',jsonb_build_array('name_similarity'),'sourceAnchor',jsonb_build_object('kind','signature_block','page',12),'confidence',58,'analysisRunId',(select contract_analysis_run_id from spec011_run)), 'spec011:slice2-party-match');

create temp table spec011_relationship as
select * from public.add_contract_relationship((select contract_id from spec011_amendment_contract), jsonb_build_object('relatedContractId',(select contract_id from spec011_base_contract),'relationshipType','amends','sourceEvidenceId','77777777-7777-4777-8777-777777777779','sourceAnchor',jsonb_build_object('kind','clause','page',1,'clause','Recitals'),'verificationState','source_backed','confidence',82), 'spec011:slice2-relationship');

create temp table spec011_base_match as
select * from public.propose_contract_base_match((select contract_id from spec011_amendment_contract), jsonb_build_object('candidateBaseContractId',(select contract_id from spec011_base_contract),'matchState','likely_base_match','evidenceSignals',jsonb_build_array('explicit amendment recitals','same property identity'),'sourceEvidenceId','77777777-7777-4777-8777-777777777779','sourceAnchor',jsonb_build_object('kind','clause','page',1,'clause','Recitals'),'confidence',82,'analysisRunId',(select contract_analysis_run_id from spec011_run)), 'spec011:slice2-base-match');

create temp table spec011_amended_price_term as
select * from public.add_contract_term((select contract_id from spec011_amendment_contract), '{"termCategory":"economic","termType":"purchase_price","title":"Amended purchase price","normalizedValue":{"amount":345000,"currency":"USD"},"displayValue":"$345,000","sourceEvidenceId":"77777777-7777-4777-8777-777777777779","sourceAnchor":{"kind":"clause","page":1,"clause":"1"},"verificationState":"source_backed","materiality":"critical"}'::jsonb, 'spec011:slice2-add-amended-price');

create temp table spec011_supersession as
select * from public.record_contract_supersession_candidate((select contract_id from spec011_amendment_contract), jsonb_build_object('oldContractTermId',(select contract_term_id from spec011_price_term),'replacementContractTermId',(select contract_term_id from spec011_amended_price_term),'relationshipId',(select contract_relationship_id from spec011_relationship),'sourceEvidenceId','77777777-7777-4777-8777-777777777779','sourceAnchor',jsonb_build_object('kind','clause','page',1,'clause','1'),'supersessionState','superseded_candidate','evidenceSignals',jsonb_build_array('deleted and replaced'),'confidence',86,'professionalReviewRequired',true,'analysisRunId',(select contract_analysis_run_id from spec011_run)), 'spec011:slice2-supersession');

create temp table spec011_conflict as
select * from public.create_contract_conflict((select contract_id from spec011_amendment_contract), '{"conflictType":"purchase_price_conflict","summary":"Base price and amendment price both remain visible until amendment effect is accepted.","severity":"high","sourceAEvidenceId":"77777777-7777-4777-8777-777777777778","sourceAAnchor":{"kind":"clause","page":2,"clause":"2"},"sourceBEvidenceId":"77777777-7777-4777-8777-777777777779","sourceBAnchor":{"kind":"clause","page":1,"clause":"1"},"professionalReviewRequired":true}'::jsonb, 'spec011:slice2-conflict');

create temp table spec011_question as
select * from public.add_contract_question((select contract_id from spec011_amendment_contract), jsonb_build_object('contractConflictId',(select contract_conflict_id from spec011_conflict),'question','Does Amendment 1 supersede only the purchase price or all economic terms?','recipientRole','buyer_attorney','priority','high','rationale','Supersession is a proposal only.','sourceEvidenceId','77777777-7777-4777-8777-777777777779','sourceAnchor',jsonb_build_object('kind','clause','page',1,'clause','1'),'perspective','buyer'), 'spec011:slice2-question');

create temp table spec011_complete as
select * from public.complete_contract_analysis_run((select contract_analysis_run_id from spec011_run), '{"status":"completed","resultHash":"purchase-result-v1","warnings":[]}'::jsonb, (select contract_analysis_run_version from spec011_run), 'spec011:slice2-complete');

create temp table spec011_failed_run as
select * from public.start_contract_analysis_run((select contract_id from spec011_base_contract), '{"evidenceId":"77777777-7777-4777-8777-777777777778","providerId":"deterministic_fixture","providerMethod":"deterministic_fixture","inputHash":"purchase-v2"}'::jsonb, 'spec011:slice2-failed-start');

create temp table spec011_failed_complete as
select * from public.complete_contract_analysis_run((select contract_analysis_run_id from spec011_failed_run), '{"status":"provider_failed","errorCode":"provider_timeout","safeErrorMessage":"Provider timed out after upload parsing."}'::jsonb, (select contract_analysis_run_version from spec011_failed_run), 'spec011:slice2-failed-complete');

create temp table spec011_projection as
select * from public.contract_projection where deal_id = '44444444-4444-4444-8444-444444444445';

select
  (select classification_state = 'classified_proposed' and contract_type = 'purchase_agreement' from spec011_classification) as step_01_source_classification,
  (select count(*) = 3 from public.contract_extraction_items where workspace_id = '22222222-2222-4222-8222-222222222223') as step_02_source_linked_extractions,
  (select contract_extraction_item_id = (select contract_extraction_item_id from spec011_price_extraction) from spec011_duplicate_price_extraction) as step_03_extraction_idempotency,
  (select match_state = 'manual_review_required' from spec011_party_match) as step_04_party_match_proposed,
  (select match_state = 'likely_base_match' from spec011_base_match) as step_05_base_match_source_backed,
  (select supersession_state = 'superseded_candidate' from spec011_supersession) as step_06_supersession_proposed,
  (select resolution_state = 'unresolved' from spec011_conflict) as step_07_conflict_preserved,
  (select status = 'open' from spec011_question) as step_08_question_created,
  (select status = 'provider_failed' from spec011_failed_complete) as step_09_provider_failure_recorded,
  (select analysis_state = 'failed_with_prior_analysis' and prior_valid_analysis_run_id = (select contract_analysis_run_id from spec011_run) from public.contracts where id = (select contract_id from spec011_base_contract)) as step_10_prior_valid_preserved,
  (select source_anchor <> '{}'::jsonb and proposed_normalized_value ? 'exception' from public.contract_extraction_items where id = (select contract_extraction_item_id from spec011_contingency_extraction)) as step_11_negation_exception_preserved,
  (select not exists (select 1 from public.contract_extraction_items where workspace_id = '22222222-2222-4222-8222-222222222223' and proposed_normalized_value ? 'calculatedDueAt')) as step_12_no_calculated_deadline_persisted,
  (select amendment_count >= 1 and unresolved_conflict_count = 1 and open_question_count = 1 from spec011_projection where contract_id = (select contract_id from spec011_amendment_contract)) as step_13_projection_reconciles,
  (select count(*) >= 7 from public.domain_events where workspace_id = '22222222-2222-4222-8222-222222222223' and event_type like 'contract.%') as step_14_domain_events_emitted,
  (select count(*) >= 5 from public.audit_events where workspace_id = '22222222-2222-4222-8222-222222222223' and action like 'contract.%') as step_15_audit_events_emitted,
  (select exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'contract_extraction_items' and policyname = 'contract extraction items no direct insert')) as step_16_direct_write_denial_policy;

rollback;

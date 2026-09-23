create temporary table spec011a_r4_smoke_result (
  test_name text primary key,
  passed boolean not null,
  detail jsonb not null default '{}'::jsonb
) on commit drop;

do $smoke$
#variable_conflict use_variable
declare
  user_id constant uuid := 'c1111111-1111-4111-8111-111111111111';
  other_user_id constant uuid := 'c1111111-1111-4111-8111-111111111112';
  workspace_id constant uuid := 'c2222222-2222-4222-8222-222222222222';
  property_id constant uuid := 'c3333333-3333-4333-8333-333333333333';
  deal_id constant uuid := 'c4444444-4444-4444-8444-444444444444';
  contract_id constant uuid := 'c5555555-5555-4555-8555-555555555555';
  evidence_id constant uuid := 'c6666666-6666-4666-8666-666666666666';
  evidence_link_id constant uuid := 'c6666666-6666-4666-8666-666666666667';
  term_id constant uuid := 'c7777777-7777-4777-8777-777777777777';
  deadline_id constant uuid := 'c8888888-8888-4888-8888-888888888888';
  deadline_result_id constant uuid := 'c8888888-8888-4888-8888-888888888889';
  analysis_id constant uuid := 'c9999999-9999-4999-8999-999999999999';
  finding_id constant uuid := 'ca111111-1111-4111-8111-111111111111';
  solar_finding_id constant uuid := 'ca111111-1111-4111-8111-111111111112';
  solar_transfer_id constant uuid := 'ca111111-1111-4111-8111-111111111113';
  conflict_id constant uuid := 'cb111111-1111-4111-8111-111111111111';
  question_id constant uuid := 'cc111111-1111-4111-8111-111111111111';
  snapshot_one jsonb;
  snapshot_two jsonb;
  snapshot_three jsonb;
  definition_one jsonb;
  definition_retry jsonb;
  definition_two jsonb;
  summary_one jsonb;
  summary_retry jsonb;
  summary_two jsonb;
  summary_failure jsonb;
  summary_one_id uuid;
  summary_two_id uuid;
  failure_result jsonb;
  reconcile_result jsonb;
  snapshot_one_id uuid;
  snapshot_two_id uuid;
  snapshot_three_id uuid;
  definition_one_id uuid;
  definition_two_id uuid;
  direct_write_denied boolean := false;
  cross_workspace_denied boolean := false;
  section_count integer;
  included_item_count integer;
  source_ref_count integer;
  event_count integer;
  audit_count integer;
  current_count integer;
begin
  begin
    insert into auth.users (
      instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at
    ) values
      ('00000000-0000-0000-0000-000000000000',user_id,'authenticated','authenticated','spec011a-r3@example.invalid','',now(),'{}','{}',now(),now()),
      ('00000000-0000-0000-0000-000000000000',other_user_id,'authenticated','authenticated','spec011a-r4-other@example.invalid','',now(),'{}','{}',now(),now());

    insert into public.workspaces(id,name,owner_user_id)
    values(workspace_id,'Spec 011A R3 rollback smoke',user_id);
    insert into public.workspace_memberships(workspace_id,user_id,role_id,status)
    values(workspace_id,user_id,'owner','active');
    insert into public.properties(id,workspace_id,display_address,created_by)
    values(property_id,workspace_id,'300 Definition Way',user_id);
    insert into public.brix_deals(id,owner_id,address,strategy_id,workspace_id,display_name,created_by)
    values(deal_id,user_id,'300 Definition Way','buy_and_hold',workspace_id,'R3 rollback deal',user_id);
    insert into public.deal_properties(workspace_id,deal_id,property_id,role,inclusion_status,created_by)
    values(workspace_id,deal_id,property_id,'primary','active',user_id);

    insert into public.evidence_items(
      id,workspace_id,deal_id,property_id,evidence_type,original_filename,sanitized_filename,
      detected_mime_type,byte_size,content_hash,storage_object_key,uploaded_by,processing_status,extraction_status
    ) values(
      evidence_id,workspace_id,deal_id,property_id,'document','purchase-contract.pdf','purchase-contract.pdf',
      'application/pdf',2048,repeat('c',64),'spec011a-r3/purchase-contract.pdf',user_id,'complete','complete'
    );
    insert into public.contracts(
      id,user_id,workspace_id,deal_id,property_id,title,contract_name,contract_type,perspective,
      status,verification_state,analysis_state,confidence,version,source_evidence_id,created_by,updated_by
    ) values(
      contract_id,user_id,workspace_id,deal_id,property_id,'R3 Purchase Contract','R3 Purchase Contract',
      'purchase_agreement','buyer','executed','verified','current',100,1,evidence_id,user_id,user_id
    );
    insert into public.contract_evidence_links(
      id,workspace_id,contract_id,evidence_id,link_role,source_anchor,verification_state,created_by,updated_by
    ) values(
      evidence_link_id,workspace_id,contract_id,evidence_id,'source_document',
      '{"kind":"document","label":"Purchase Contract"}'::jsonb,'source_backed',user_id,user_id
    );
    insert into public.contract_parties(
      workspace_id,contract_id,party_role,legal_name,display_name,authority_capacity,signature_status,
      source_evidence_id,source_anchor,verification_state,confidence,created_by,updated_by
    ) values(
      workspace_id,contract_id,'buyer','R3 Buyer LLC','R3 Buyer LLC','authorized signatory','signed',
      evidence_id,'{"kind":"signature_page","label":"Buyer signature"}'::jsonb,'source_backed',100,user_id,user_id
    );
    insert into public.contract_terms(
      id,workspace_id,contract_id,term_category,term_type,title,normalized_value,display_value,currency,
      source_evidence_id,source_anchor,source_quote_ref,confidence,verification_state,materiality,
      proposal_state,applicable_perspective,accepted_by,accepted_at,created_by,updated_by
    ) values(
      term_id,workspace_id,contract_id,'economic','purchase_price','Purchase price',
      '{"amount":425000}'::jsonb,'$425,000','USD',evidence_id,
      '{"kind":"section","label":"Purchase Price"}'::jsonb,'Section 2',100,'source_backed','material',
      'accepted','buyer',user_id,now(),user_id,user_id
    );
    insert into public.contract_deadlines(
      id,workspace_id,contract_id,contract_term_id,deadline_type,trigger_type,trigger_date,offset_value,
      offset_unit,business_day_rule,timezone,calculated_due_at,source_evidence_id,source_anchor,
      verification_state,status,professional_review_required,confidence,created_by,updated_by
    ) values(
      deadline_id,workspace_id,contract_id,term_id,'inspection_period','effective_date',current_date,10,
      'calendar_days','none','America/Chicago',now() + interval '10 days',evidence_id,
      '{"kind":"section","label":"Inspection Period"}'::jsonb,'verified','current',false,100,user_id,user_id
    );
    insert into public.contract_deadline_results(
      id,workspace_id,deal_id,contract_id,contract_deadline_id,calculation_version,contract_deadline_version,
      trigger_at,trigger_verification,due_at,timezone,offset_value,offset_unit,counting_rule,business_day_rule,
      weekend_rule,source_evidence_id,source_anchor,status,calculation_contract_version,deterministic_hash,
      is_current,correlation_id,generated_at,created_by
    ) values(
      deadline_result_id,workspace_id,deal_id,contract_id,deadline_id,1,1,now(),'source_verified',now() + interval '10 days',
      'America/Chicago',10,'calendar_days','start_after_trigger','none','no_adjustment',evidence_id,
      '{"kind":"section","label":"Inspection Period"}'::jsonb,'current','contractiq-deadline-engine-v1',
      repeat('d',64),true,'spec011a-r4-deadline',now(),user_id
    );

    insert into public.contract_perspective_analysis_runs(
      id,workspace_id,deal_id,property_id,contract_id,contract_version,perspective,analysis_state,
      completeness_state,source_version_graph,result_payload,deterministic_hash,input_hash,is_current,created_by,updated_by
    ) values(
      analysis_id,workspace_id,deal_id,property_id,contract_id,1,'buyer','current','complete',
      jsonb_build_object('contractId',contract_id,'contractVersion',1),
      jsonb_build_object(
        'currentPosition','Proceed with Conditions',
        'recommendationRationaleRefs',jsonb_build_array(term_id),
        'recommendationConditions',jsonb_build_array('Resolve title conflict before closing.')
      ),repeat('e',64),repeat('f',64),true,user_id,user_id
    );
    insert into public.contract_perspective_analysis_items(
      id,workspace_id,deal_id,property_id,contract_id,analysis_run_id,item_kind,finding_group,finding_type,
      category,severity,title,summary,perspective,source_refs,professional_review_required,status,created_by,updated_by
    ) values(
      finding_id,workspace_id,deal_id,property_id,contract_id,analysis_id,'finding','risk','inspection_access',
      'property_condition','high','Inspection access requires confirmation','Access timing remains material to diligence.','buyer',
      jsonb_build_array(jsonb_build_object('evidenceId',evidence_id,'recordType','finding','recordId',finding_id,'recordVersion',1,
        'sourceAnchor',jsonb_build_object('kind','section','label','Inspection Period'),'verificationState','source_backed')),
      false,'current',user_id,user_id
    );
    insert into public.contract_perspective_analysis_items(
      id,workspace_id,deal_id,property_id,contract_id,analysis_run_id,item_kind,finding_group,finding_type,
      category,severity,title,summary,perspective,source_refs,professional_review_required,status,created_by,updated_by
    ) values
      (solar_finding_id,workspace_id,deal_id,property_id,contract_id,analysis_id,'finding','risk','payment_escalation',
        'solar','high','Solar payment escalation','The source agreement has scheduled escalation.','buyer',
        jsonb_build_array(jsonb_build_object('evidenceId',evidence_id,'recordType','finding','recordId',solar_finding_id,
          'recordVersion',1,'sourceAnchor',jsonb_build_object('kind','section','label','Solar payment'),
          'verificationState','source_backed')),true,'current',user_id,user_id),
      (solar_transfer_id,workspace_id,deal_id,property_id,contract_id,analysis_id,'finding','missing_information','transfer_terms',
        'solar','high','Solar transfer terms missing','Transfer rights require provider review.','buyer',
        jsonb_build_array(jsonb_build_object('evidenceId',evidence_id,'recordType','finding','recordId',solar_transfer_id,
          'recordVersion',1,'sourceAnchor',jsonb_build_object('kind','section','label','Solar transfer'),
          'verificationState','source_backed')),true,'current',user_id,user_id);
    insert into public.contract_conflicts(
      id,workspace_id,contract_id,conflict_type,summary,severity,source_a_contract_id,source_a_evidence_id,
      source_a_anchor,source_b_contract_id,source_b_evidence_id,source_b_anchor,resolution_state,
      professional_review_required,created_by,updated_by
    ) values(
      conflict_id,workspace_id,contract_id,'property_conflict','Legal descriptions require reconciliation.','high',
      contract_id,evidence_id,'{"kind":"exhibit","label":"Exhibit A"}'::jsonb,contract_id,evidence_id,
      '{"kind":"schedule","label":"Schedule 1"}'::jsonb,'unresolved',true,user_id,user_id
    );
    insert into public.contract_questions(
      id,workspace_id,contract_id,property_id,contract_version,question,recipient_role,priority,category,
      rationale,why_it_matters,semantic_key,deterministic_key,perspective,status,resolution_state,
      source_evidence_id,source_anchor,contract_conflict_id,contract_conflict_version,
      professional_review_required,report_inclusion,content_hash,created_by,updated_by
    ) values(
      question_id,workspace_id,contract_id,property_id,1,'Which legal description controls for closing?','title_company',
      'high','title','The contract exhibits conflict.','Closing requires one controlling description.',
      'title:controlling-legal-description',repeat('1',64),'buyer','open','unresolved',evidence_id,
      '{"kind":"exhibit","label":"Exhibit A"}'::jsonb,conflict_id,1,true,
      '{"fullReport":true,"summaryReport":true,"standaloneQuestionsReport":true,"roleExport":true}'::jsonb,
      repeat('2',64),user_id,user_id
    );

    perform set_config('request.jwt.claims',jsonb_build_object('sub',user_id,'role','authenticated')::text,true);
    execute 'set local role authenticated';

    snapshot_one := public.create_contractiq_report_snapshot(
      contract_id,'buyer',analysis_id,'spec011a-r4-snapshot-1','cd111111-1111-4111-8111-111111111111'
    );
    snapshot_one_id := (snapshot_one ->> 'snapshotId')::uuid;
    if snapshot_one_id is null or snapshot_one ->> 'failureCode' is not null then
      raise exception 'representative R1 snapshot failed: %',snapshot_one;
    end if;

    definition_one := public.create_contractiq_full_report_definition(
      snapshot_one_id,'contractiq-full-report-template-v1','spec011a-r4-definition-1',
      'ce111111-1111-4111-8111-111111111111',false
    );
    definition_one_id := (definition_one ->> 'reportDefinitionId')::uuid;
    if definition_one_id is null or definition_one ->> 'reportState' <> 'current'
       or coalesce((definition_one ->> 'validationEligible')::boolean,false) is false then
      raise exception 'Full Report definition creation failed: %',definition_one;
    end if;

    summary_one := public.create_contractiq_buyer_summary_definition(
      definition_one_id,'contractiq-buyer-summary-template-v1','spec011a-r4-summary-1',
      'cf111111-1111-4111-8111-111111111111',false
    );
    summary_one_id := (summary_one ->> 'summaryDefinitionId')::uuid;
    if summary_one_id is null or summary_one ->> 'summaryState' not in
      ('current','current_with_open_questions','current_with_conflicts','professional_review_recommended')
      or coalesce((summary_one ->> 'validationEligible')::boolean,false) is false then
      raise exception 'Buyer Summary creation failed: %',summary_one;
    end if;
    if not exists(select 1 from public.contractiq_buyer_summary_definitions s
      join public.contractiq_full_report_definitions f on f.id=s.full_report_definition_id
      where s.id=summary_one_id and s.snapshot_id=f.snapshot_id and s.snapshot_version=f.snapshot_version
        and s.recommendation_state=f.recommendation_state and s.source_cutoff_at=f.source_cutoff_at
        and s.definition_payload #>> '{identity,fullReportDefinitionId}'=f.id::text
        and jsonb_array_length(s.definition_payload -> 'sectionDefinitions')=7
        and jsonb_array_length(s.definition_payload -> 'quickReviewRows') between 1 and 7
        and (s.validation_result ->> 'materialOmissionCount')::integer=0
        and (s.validation_result ->> 'duplicatePrimaryItemCount')::integer=0
        and s.definition_payload #>> '{rendererGuidance,preferredPageTarget}'='9'
    ) then raise exception 'Buyer Summary content failed reconciliation'; end if;
    if not exists(select 1 from public.contractiq_buyer_summary_definitions s,
      lateral jsonb_array_elements(s.definition_payload -> 'materialQuestions') q
      where s.id=summary_one_id and q ->> 'questionId'=question_id::text
        and (q ->> 'questionVersion')::integer=1
    ) then raise exception 'Buyer Summary lost a canonical R2 question'; end if;
    if not exists(select 1 from public.contractiq_buyer_summary_definitions s,
      lateral jsonb_array_elements(s.definition_payload -> 'criticalDeadlines') d
      where s.id=summary_one_id and d ->> 'itemId'='deadline:' || deadline_id::text
        and d ->> 'fullAnchor'='deadlines'
    ) then raise exception 'Buyer Summary lost the frozen deadline or R3 anchor'; end if;
    if not exists(select 1 from public.contractiq_buyer_summary_definition_projection s,
      lateral jsonb_array_elements(s.definition_payload -> 'contractTransactionTerms') item
      where s.summary_definition_id=summary_one_id
        and item ->> 'itemId'='term:' || term_id::text
        and item #>> '{canonicalContent,displayValue}'='$425,000'
        and item ->> 'fullAnchor'='economic-terms'
    ) then raise exception 'Buyer Summary projection lost the current purchase price'; end if;
    if not exists(select 1 from public.contractiq_buyer_summary_definition_projection s,
      lateral jsonb_array_elements(s.definition_payload -> 'includedItemReferences') item
      where s.summary_definition_id=summary_one_id
        and item ->> 'itemId'='conflict:' || conflict_id::text
        and item ->> 'fullAnchor'='conflicts'
        and item #>> '{canonicalContent,resolutionState}'='unresolved'
    ) then raise exception 'Buyer Summary lost the unresolved conflict state'; end if;
    if not exists(select 1 from public.contractiq_buyer_summary_definition_projection s
      where s.summary_definition_id=summary_one_id
        and s.definition_payload #>> '{primaryLongTermObligation,primaryItem,fullAnchor}'='solar-service'
        and jsonb_array_length(s.definition_payload #> '{primaryLongTermObligation,relatedMaterialItems}')=2
    ) then raise exception 'material solar obligation was fragmented or omitted'; end if;
    summary_retry := public.create_contractiq_buyer_summary_definition(
      definition_one_id,'contractiq-buyer-summary-template-v1','spec011a-r4-summary-1',
      'cf111111-1111-4111-8111-111111111111',false
    );
    if (summary_retry ->> 'summaryDefinitionId')::uuid<>summary_one_id
      or not coalesce((summary_retry ->> 'reused')::boolean,false) then
      raise exception 'Buyer Summary idempotency failed: %',summary_retry; end if;

    select jsonb_array_length(section_definitions),
           (select count(*) from jsonb_array_elements(section_definitions) section
             cross join lateral jsonb_array_elements(section -> 'itemReferences') item),
           (select count(*) from jsonb_array_elements(section_definitions) section
             cross join lateral jsonb_array_elements(section -> 'sourceRefs') source_ref)
    into section_count,included_item_count,source_ref_count
    from public.contractiq_full_report_definitions where id=definition_one_id;
    if section_count <> 27 or included_item_count < 9 or source_ref_count < 7 then
      raise exception 'definition coverage incomplete: sections %, items %, sources %',section_count,included_item_count,source_ref_count;
    end if;
    if exists (
      select 1 from public.contractiq_full_report_definitions definition,
      lateral jsonb_array_elements(definition.section_definitions) section
      where definition.id=definition_one_id
        and (section ->> 'anchor' is null or (section ->> 'orderingKey')::integer <= 0)
    ) then raise exception 'section anchors or ordering are incomplete'; end if;
    if not exists (
      select 1 from public.contractiq_full_report_definitions definition,
      lateral jsonb_array_elements(definition.question_references) question
      where definition.id=definition_one_id and question ->> 'questionId'=question_id::text
        and (question ->> 'questionVersion')::integer=1
    ) then raise exception 'canonical question version was not frozen'; end if;
    if not exists (
      select 1 from public.contractiq_full_report_definitions definition,
      lateral jsonb_array_elements(definition.section_definitions) section,
      lateral jsonb_array_elements(section -> 'itemReferences') item
      where definition.id=definition_one_id and item ->> 'itemId'='deadline:' || deadline_id::text
    ) then raise exception 'canonical deadline result was not included'; end if;
    if not exists (
      select 1 from public.contractiq_full_report_definitions definition,
      lateral jsonb_array_elements(definition.section_definitions) section,
      lateral jsonb_array_elements(section -> 'itemReferences') item
      where definition.id=definition_one_id and item ->> 'itemId'='conflict:' || conflict_id::text
    ) then raise exception 'unresolved conflict was not included'; end if;
    if not exists (
      select 1 from public.contractiq_full_report_definitions definition
      where definition.id=definition_one_id
        and definition.recommendation_state='Proceed with Conditions'
        and jsonb_array_length(definition.recommendation_references)=1
        and definition.definition_payload #>> '{executiveOverview,independentConclusionGenerated}'='false'
        and definition.definition_payload #>> '{rendererPaginationOwnedExternally}'='true'
    ) then raise exception 'recommendation linkage or ownership boundary failed'; end if;

    definition_retry := public.create_contractiq_full_report_definition(
      snapshot_one_id,'contractiq-full-report-template-v1','spec011a-r4-definition-1',
      'ce111111-1111-4111-8111-111111111111',false
    );
    if (definition_retry ->> 'reportDefinitionId')::uuid <> definition_one_id
       or coalesce((definition_retry ->> 'reused')::boolean,false) is false then
      raise exception 'idempotent definition retry failed: %',definition_retry;
    end if;

    execute 'reset role';
    update public.contract_questions set why_it_matters='Updated material title explanation.' where id=question_id;
    execute 'set local role authenticated';
    snapshot_two := public.create_contractiq_report_snapshot(
      contract_id,'buyer',analysis_id,'spec011a-r4-snapshot-2','cd111111-1111-4111-8111-111111111112'
    );
    snapshot_two_id := (snapshot_two ->> 'snapshotId')::uuid;
    if snapshot_two_id is null or snapshot_two_id=snapshot_one_id then raise exception 'changed canonical state did not create R1 snapshot 2'; end if;
    if not exists(select 1 from public.contractiq_full_report_definitions where id=definition_one_id and report_state='stale' and not is_current) then
      raise exception 'old Full Report definition did not become stale with its R1 snapshot';
    end if;
    if not exists(select 1 from public.contractiq_buyer_summary_definitions
      where id=summary_one_id and summary_state='stale' and not is_current) then
      raise exception 'R1/R3 staleness did not propagate to Buyer Summary'; end if;

    definition_two := public.create_contractiq_full_report_definition(
      snapshot_two_id,'contractiq-full-report-template-v1','spec011a-r4-definition-2',
      'ce111111-1111-4111-8111-111111111112',false
    );
    definition_two_id := (definition_two ->> 'reportDefinitionId')::uuid;
    if definition_two_id is null or definition_two_id=definition_one_id
       or not exists(select 1 from public.contractiq_full_report_definitions where id=definition_one_id and report_state='superseded' and superseded_by_definition_id=definition_two_id)
       or not exists(select 1 from public.contractiq_full_report_definitions where id=definition_two_id and report_state='current' and is_current) then
      raise exception 'new snapshot definition did not supersede the stale definition: %',definition_two;
    end if;
    summary_two := public.create_contractiq_buyer_summary_definition(
      definition_two_id,'contractiq-buyer-summary-template-v1','spec011a-r4-summary-2',
      'cf111111-1111-4111-8111-111111111112',false
    );
    summary_two_id := (summary_two ->> 'summaryDefinitionId')::uuid;
    if summary_two_id is null or summary_two_id=summary_one_id
      or not exists(select 1 from public.contractiq_buyer_summary_definitions
        where id=summary_one_id and summary_state='superseded' and superseded_by_definition_id=summary_two_id)
      or not exists(select 1 from public.contractiq_buyer_summary_definitions
        where id=summary_two_id and is_current) then
      raise exception 'new Buyer Summary did not supersede prior version: %',summary_two; end if;
    if not exists(select 1 from public.contractiq_buyer_summary_definition_projection s
      where s.summary_definition_id=summary_two_id and s.is_current
        and jsonb_array_length(s.history)>=2
        and s.full_report_definition_id=definition_two_id
    ) then raise exception 'Buyer Summary save/reopen projection or history failed'; end if;

    execute 'reset role';
    update public.contract_questions set rationale='A failed regeneration must retain the prior valid definition.' where id=question_id;
    execute 'set local role authenticated';
    snapshot_three := public.create_contractiq_report_snapshot(
      contract_id,'buyer',analysis_id,'spec011a-r4-snapshot-3','cd111111-1111-4111-8111-111111111113'
    );
    snapshot_three_id := (snapshot_three ->> 'snapshotId')::uuid;
    failure_result := public.create_contractiq_full_report_definition(
      snapshot_three_id,'contractiq-full-report-template-v1','spec011a-r4-definition-failure',
      'ce111111-1111-4111-8111-111111111113',true
    );
    if failure_result ->> 'reportState' <> 'failed_with_prior_valid'
       or coalesce((failure_result ->> 'priorValidPreserved')::boolean,false) is false
       or not exists(select 1 from public.contractiq_full_report_definitions where id=definition_two_id and not is_current and report_state='stale') then
      raise exception 'failed regeneration did not preserve the prior valid definition: %',failure_result;
    end if;
    summary_failure := public.create_contractiq_buyer_summary_definition(
      (failure_result ->> 'reportDefinitionId')::uuid,'contractiq-buyer-summary-template-v1',
      'spec011a-r4-summary-failure','cf111111-1111-4111-8111-111111111113',false
    );
    if summary_failure ->> 'summaryState'<>'failed_with_prior_valid'
      or not coalesce((summary_failure ->> 'priorValidPreserved')::boolean,false)
      or not exists(select 1 from public.contractiq_buyer_summary_definitions
        where id=summary_two_id and summary_state='stale') then
      raise exception 'failed Buyer Summary did not retain prior valid version: %',summary_failure; end if;

    reconcile_result := public.reconcile_contractiq_full_report_definition(definition_two_id,'spec011a-r4-reconcile-1');
    if reconcile_result ->> 'reportState' <> 'stale'
       or not exists(select 1 from public.contractiq_full_report_definitions where id=definition_two_id and reconciliation_state='stale') then
      raise exception 'definition reconciliation did not expose stale state: %',reconcile_result;
    end if;

    begin
      insert into public.contractiq_full_report_definitions(
        workspace_id,deal_id,property_id,contract_id,perspective,snapshot_id,snapshot_version,snapshot_hash,
        analysis_version,report_definition_version,report_state,snapshot_state,reconciliation_state,
        source_cutoff_at,title,created_by
      ) values(
        workspace_id,deal_id,property_id,contract_id,'buyer',snapshot_three_id,3,repeat('a',64),1,99,
        'current','current','reconciled',now(),'Unauthorized direct write',user_id
      );
    exception when insufficient_privilege then direct_write_denied := true; end;
    if not direct_write_denied then raise exception 'direct authenticated definition write was accepted'; end if;

    direct_write_denied := false;
    begin
      insert into public.contractiq_buyer_summary_definitions(
        workspace_id,deal_id,property_id,contract_id,snapshot_id,snapshot_version,snapshot_hash,
        full_report_definition_id,full_report_definition_version,full_report_content_hash,
        analysis_version,summary_definition_version,summary_state,reconciliation_state,source_cutoff_at
      ) values(workspace_id,deal_id,property_id,contract_id,snapshot_three_id,3,repeat('a',64),
        definition_two_id,2,repeat('b',64),1,99,'current','reconciled',now());
    exception when insufficient_privilege then direct_write_denied := true; end;
    if not direct_write_denied then raise exception 'direct authenticated Buyer Summary write was accepted'; end if;

    execute 'reset role';
    perform set_config('request.jwt.claims',jsonb_build_object('sub',other_user_id,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    begin
      perform public.create_contractiq_full_report_definition(
        snapshot_three_id,'contractiq-full-report-template-v1','spec011a-r4-cross-workspace',
        'ce111111-1111-4111-8111-111111111114',false
      );
    exception when insufficient_privilege then cross_workspace_denied := true; end;
    if not cross_workspace_denied then raise exception 'cross-workspace definition access was accepted'; end if;

    cross_workspace_denied := false;
    begin
      perform public.create_contractiq_buyer_summary_definition(
        definition_two_id,'contractiq-buyer-summary-template-v1','spec011a-r4-cross-workspace',
        'cf111111-1111-4111-8111-111111111114',false);
    exception when insufficient_privilege then cross_workspace_denied := true; end;
    if not cross_workspace_denied then raise exception 'cross-workspace Buyer Summary access was accepted'; end if;

    execute 'reset role';
    select count(*) into current_count from public.contractiq_full_report_definitions definition
      where definition.workspace_id=workspace_id and definition.contract_id=contract_id and definition.is_current;
    select count(*) into event_count from public.domain_events event
      where event.workspace_id=workspace_id and event.event_type like 'contractiq.full_report_definition_%';
    select count(*) into audit_count from public.audit_events audit
      where audit.workspace_id=workspace_id and audit.action like 'contractiq.full_report_definition_%';
    if current_count <> 0 or event_count < 5 or audit_count < 3 then
      raise exception 'lifecycle evidence incomplete: current %, events %, audits %',current_count,event_count,audit_count;
    end if;
    if not exists(select 1 from public.domain_events
      where workspace_id=workspace_id and event_type='contractiq.summary_definition_created')
      or not exists(select 1 from public.domain_events
        where workspace_id=workspace_id and event_type='contractiq.summary_definition_stale')
      or not exists(select 1 from public.domain_events
        where workspace_id=workspace_id and event_type='contractiq.summary_definition_failed')
      or not exists(select 1 from public.audit_events
        where workspace_id=workspace_id and action='contractiq.summary_definition_created') then
      raise exception 'Buyer Summary event/audit evidence incomplete'; end if;

    raise exception using errcode='BR003',message='SPEC011A_R4_ROLLBACK';
  exception when sqlstate 'BR003' then null; end;

  if exists(select 1 from public.contractiq_full_report_definitions where contract_id=contract_id)
     or exists(select 1 from public.contractiq_buyer_summary_definitions where contract_id=contract_id)
     or exists(select 1 from public.contracts where id=contract_id)
     or exists(select 1 from auth.users where id=user_id) then
    raise exception 'rollback smoke left persistent fixture data';
  end if;

  insert into spec011a_r4_smoke_result(test_name,passed,detail)
  values('buyer_summary_report_definition',true,jsonb_build_object(
    'sections',section_count,'includedItems',included_item_count,'sourceReferences',source_ref_count,
    'firstDefinitionId',definition_one_id,'secondDefinitionId',definition_two_id,
    'idempotentRetry',definition_retry ->> 'reused','priorValidPreserved',failure_result ->> 'priorValidPreserved',
    'crossWorkspaceDenied',cross_workspace_denied,'directWriteDenied',direct_write_denied,
    'summaryOneId',summary_one_id,'summaryTwoId',summary_two_id,
    'summaryIdempotentRetry',summary_retry ->> 'reused',
    'summaryPriorValidPreserved',summary_failure ->> 'priorValidPreserved',
    'events',event_count,'audits',audit_count,'fixtureRollbackVerified',true
  ));
end
$smoke$;

select * from spec011a_r4_smoke_result;

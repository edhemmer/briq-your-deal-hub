-- R4 staging hardening: retain every material continuing obligation and unresolved canonical question.
create or replace function public.create_contractiq_buyer_summary_definition(
  target_full_report_definition_id uuid,
  target_template_version text,
  idempotency_key text,
  correlation_id uuid,
  simulate_failure boolean default false
)
returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  full_definition public.contractiq_full_report_definitions%rowtype;
  target_snapshot public.contractiq_report_snapshots%rowtype;
  prior_definition public.contractiq_buyer_summary_definitions%rowtype;
  existing_definition public.contractiq_buyer_summary_definitions%rowtype;
  inserted_definition public.contractiq_buyer_summary_definitions%rowtype;
  command public.contract_command_requests%rowtype;
  started_at timestamptz := clock_timestamp();
  reference jsonb;
  section jsonb;
  source_item jsonb;
  summary_item jsonb;
  summary_items jsonb := '[]'::jsonb;
  material_dispositions jsonb := '[]'::jsonb;
  top_issues jsonb := '[]'::jsonb;
  quick_review jsonb := '[]'::jsonb;
  terms jsonb := '[]'::jsonb;
  deadlines jsonb := '[]'::jsonb;
  property_findings jsonb := '[]'::jsonb;
  obligation jsonb;
  obligation_items jsonb := '[]'::jsonb;
  questions jsonb := '[]'::jsonb;
  open_items jsonb := '[]'::jsonb;
  full_refs jsonb := '[]'::jsonb;
  section_definitions jsonb := '[]'::jsonb;
  payload jsonb := '{}'::jsonb;
  validation_result jsonb := '{}'::jsonb;
  content_hash text;
  definition_hash text;
  failure_code text;
  definition_version integer;
  prior_valid_preserved boolean;
  material_count integer;
  missing_count integer;
  duplicate_count integer;
  critical_deadline_count integer;
  state_label text;
  main_section text;
begin
  if current_user_id is null then raise exception 'Authentication required to create a Buyer Summary.' using errcode='42501'; end if;
  if coalesce(nullif(btrim(target_template_version),''),'') <> 'contractiq-buyer-summary-template-v1' then
    raise exception 'Unsupported Buyer Summary template.' using errcode='22023';
  end if;
  select * into full_definition from public.contractiq_full_report_definitions where id=target_full_report_definition_id;
  if full_definition.id is null or not public.is_workspace_member(full_definition.workspace_id) then
    raise exception 'Full Report definition not found.' using errcode='42501';
  end if;
  if not public.has_workspace_permission(full_definition.workspace_id,'deals:manage') then
    raise exception 'You do not have permission to create Buyer Summaries.' using errcode='42501';
  end if;
  select * into target_snapshot from public.contractiq_report_snapshots
  where workspace_id=full_definition.workspace_id and id=full_definition.snapshot_id;
  command := public.ensure_contract_command(
    full_definition.workspace_id,full_definition.deal_id,full_definition.property_id,full_definition.contract_id,
    'create_contractiq_buyer_summary_definition',idempotency_key,
    jsonb_build_object('fullReportDefinitionId',full_definition.id,'fullReportDefinitionVersion',full_definition.report_definition_version,
      'fullReportContentHash',full_definition.content_hash,'snapshotId',full_definition.snapshot_id,
      'templateVersion',target_template_version,'simulateFailure',simulate_failure)
  );
  perform pg_advisory_xact_lock(hashtextextended(full_definition.workspace_id::text || ':' || full_definition.contract_id::text || ':buyer-summary',0));
  if command.result ? 'summaryDefinitionId' then return command.result || jsonb_build_object('reused',true); end if;
  select * into existing_definition from public.contractiq_buyer_summary_definitions definition
  where definition.workspace_id=full_definition.workspace_id and definition.snapshot_id=full_definition.snapshot_id
    and definition.full_report_definition_id=full_definition.id and definition.template_version=target_template_version
    and definition.summary_state <> 'failed_with_prior_valid';
  if existing_definition.id is not null then
    update public.contract_command_requests set result=jsonb_build_object(
      'summaryDefinitionId',existing_definition.id,'summaryDefinitionVersion',existing_definition.summary_definition_version,
      'summaryState',existing_definition.summary_state,'contentHash',existing_definition.content_hash,
      'deterministicDefinitionHash',existing_definition.deterministic_definition_hash,
      'validationEligible',coalesce((existing_definition.validation_result ->> 'eligible')::boolean,false),
      'failureCode',existing_definition.failure_code) where id=command.id;
    return (select result from public.contract_command_requests where id=command.id) || jsonb_build_object('reused',true);
  end if;
  select * into prior_definition from public.contractiq_buyer_summary_definitions definition
  where definition.workspace_id=full_definition.workspace_id and definition.contract_id=full_definition.contract_id
    and definition.summary_state <> 'failed_with_prior_valid'
  order by definition.summary_definition_version desc limit 1;
  prior_valid_preserved := prior_definition.id is not null;
  begin
    if target_snapshot.id is null or target_snapshot.snapshot_version<>full_definition.snapshot_version
      or target_snapshot.content_hash<>full_definition.snapshot_hash
      or target_snapshot.source_document_cutoff_at<>full_definition.source_cutoff_at
      or target_snapshot.analysis_run_version<>full_definition.analysis_version
      or target_snapshot.reconciliation_status<>'reconciled'
      or target_snapshot.snapshot_state in ('stale','superseded')
      or coalesce((target_snapshot.report_eligibility #>> '{summaryReport,eligible}')::boolean,false) is not true
      or full_definition.report_state<>'current' or not full_definition.is_current
      or full_definition.reconciliation_state<>'reconciled'
      or coalesce((full_definition.validation_result ->> 'eligible')::boolean,false) is not true
      or full_definition.perspective<>'buyer' then
      raise exception 'R1 and R3 are not current and reconciled for a Buyer Summary.' using errcode='23514';
    end if;
    if full_definition.recommendation_state is null
      or full_definition.recommendation_state is distinct from target_snapshot.snapshot_payload #>> '{recommendation,currentPosition}' then
      raise exception 'Canonical recommendation is missing or mismatched.' using errcode='23514';
    end if;
    if simulate_failure then raise exception 'Simulated Buyer Summary failure.' using errcode='P0001'; end if;

    for section in select value from jsonb_array_elements(full_definition.section_definitions) loop
      if section ->> 'state' <> 'included' then continue; end if;
      for reference in select value from jsonb_array_elements(coalesce(section -> 'itemReferences','[]'::jsonb)) loop
        select item into source_item from (
          select 'document' kind,value item from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'documentInventory','[]'::jsonb))
          union all select 'evidence',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'evidenceInventory','[]'::jsonb))
          union all select 'party',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload #> '{partiesProperty,parties}','[]'::jsonb))
          union all select 'term',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'economicTerms','[]'::jsonb))
          union all select 'term',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'contingenciesRightsObligations','[]'::jsonb))
          union all select 'deadline',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'deadlines','[]'::jsonb))
          union all select 'finding',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'findings','[]'::jsonb))
          union all select 'conflict',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'conflicts','[]'::jsonb))
          union all select 'question',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'questions','[]'::jsonb))
          union all select 'open_item',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'openItems','[]'::jsonb))
          union all select 'amendment',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'amendmentImpacts','[]'::jsonb))
          union all select 'cross_module',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'crossModuleContext','[]'::jsonb))
          union all select 'external_research',value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'externalResearch','[]'::jsonb))
          union all select 'ownership_exposure',coalesce(target_snapshot.snapshot_payload -> 'ownershipExposure','{}'::jsonb)
        ) source where source.kind=reference ->> 'itemType'
          and public.contractiq_full_report_item_id(source.kind,source.item)=reference ->> 'itemId' limit 1;
        if source_item is null then raise exception 'R3 item is absent from the frozen R1 snapshot.' using errcode='23514'; end if;
        main_section := case
          when section ->> 'sectionId' in ('solar-service','ownership-exposure') then 'primary-long-term-obligation'
          when section ->> 'sectionId' in ('property-condition','seller-disclosures') then 'material-property-findings'
          when section ->> 'sectionId'='professional-questions' then 'questions-resolution-plan'
          when section ->> 'sectionId'='open-items' then 'open-items-final-decision'
          else 'contract-transaction-terms' end;
        summary_item := jsonb_build_object(
          'itemId',reference ->> 'itemId','itemVersion',reference -> 'itemVersion',
          'itemType',reference ->> 'itemType','materiality',reference ->> 'materiality',
          'evidenceClassification',reference ->> 'evidenceClassification',
          'status',reference ->> 'status','sourceRefs',reference -> 'sourceRefs',
          'fullSectionId',section ->> 'sectionId','fullAnchor',section ->> 'anchor',
          'summarySectionId',main_section,'canonicalContent',source_item
        );
        if reference ->> 'materiality' in ('material','critical')
          or coalesce((source_item #>> '{inclusion,summaryReport}')::boolean,false)
          or coalesce((source_item #>> '{reportInclusion,summaryReport}')::boolean,false) then
          summary_items := summary_items || jsonb_build_array(summary_item);
          material_dispositions := material_dispositions || jsonb_build_array(jsonb_build_object(
            'itemId',reference ->> 'itemId','disposition','included','summarySectionId',main_section,
            'fullSectionId',section ->> 'sectionId','fullAnchor',section ->> 'anchor'));
        else
          material_dispositions := material_dispositions || jsonb_build_array(jsonb_build_object(
            'itemId',reference ->> 'itemId','disposition','full_report_only',
            'reason','R3 informational supporting detail; no material or explicit summary inclusion',
            'fullSectionId',section ->> 'sectionId','fullAnchor',section ->> 'anchor'));
        end if;
      end loop;
    end loop;

    select count(*) into material_count from jsonb_array_elements(full_definition.section_definitions) s
      cross join lateral jsonb_array_elements(coalesce(s -> 'itemReferences','[]'::jsonb)) item
      where item ->> 'materiality' in ('material','critical');
    select count(*) into missing_count from jsonb_array_elements(full_definition.section_definitions) s
      cross join lateral jsonb_array_elements(coalesce(s -> 'itemReferences','[]'::jsonb)) item
      where item ->> 'materiality' in ('material','critical') and not exists (
        select 1 from jsonb_array_elements(material_dispositions) disposition
        where disposition ->> 'itemId'=item ->> 'itemId' and disposition ->> 'disposition'='included');
    select count(*) into duplicate_count from (
      select item ->> 'itemId' from jsonb_array_elements(summary_items) item
      group by item ->> 'itemId' having count(*) > 1
    ) duplicate;
    if missing_count>0 or duplicate_count>0 then
      raise exception 'Buyer Summary material omission or duplicate primary placement.' using errcode='23514';
    end if;

    select coalesce(jsonb_agg(item order by
      case item ->> 'materiality' when 'critical' then 0 else 1 end,
      case item #>> '{canonicalContent,severity}' when 'critical' then 0 when 'high' then 1 else 2 end,
      case when item #>> '{canonicalContent,resolutionState}' in ('unresolved','under_review','professional_review_required')
        or item #>> '{canonicalContent,status}' in ('open','urgent','missed') then 0 else 1 end,
      case when item ->> 'itemType'='deadline' then 0 else 1 end,
      case when item ->> 'fullSectionId' in ('solar-service','ownership-exposure','economic-terms','money-obligations') then 0 else 1 end,
      case when coalesce((item #>> '{canonicalContent,professionalReviewRequired}')::boolean,false) then 0 else 1 end,
      item ->> 'itemId'),'[]'::jsonb) into top_issues
    from (select value item from jsonb_array_elements(summary_items) value
      where value ->> 'materiality' in ('material','critical')
      order by case value ->> 'materiality' when 'critical' then 0 else 1 end,
        case value #>> '{canonicalContent,severity}' when 'critical' then 0 when 'high' then 1 else 2 end,
        case when value #>> '{canonicalContent,resolutionState}' in ('unresolved','under_review','professional_review_required')
          or value #>> '{canonicalContent,status}' in ('open','urgent','missed') then 0 else 1 end,
        case when value ->> 'itemType'='deadline' then 0 else 1 end,
        case when value ->> 'fullSectionId' in ('solar-service','ownership-exposure','economic-terms','money-obligations') then 0 else 1 end,
        case when coalesce((value #>> '{canonicalContent,professionalReviewRequired}')::boolean,false) then 0 else 1 end,
        value ->> 'itemId' limit 7) ranked;
    select coalesce(jsonb_agg(jsonb_build_object(
      'priority',ordinality,'verifiedFinding',coalesce(item #>> '{canonicalContent,title}',item #>> '{canonicalContent,summary}',item #>> '{canonicalContent,displayValue}',item #>> '{canonicalContent,wording}',item ->> 'itemId'),
      'whatIsMissing',case when item #>> '{canonicalContent,evidenceClassification}'='open_question' then item #>> '{canonicalContent,summary}' end,
      'currentRecommendation',full_definition.recommendation_state,
      'evidenceClassification',item ->> 'evidenceClassification',
      'fullSectionId',item ->> 'fullSectionId','fullAnchor',item ->> 'fullAnchor',
      'itemId',item ->> 'itemId','itemVersion',item -> 'itemVersion',
      'snapshotItemId',item ->> 'itemId','sourceRefs',item -> 'sourceRefs'
    ) order by ordinality),'[]'::jsonb) into quick_review
    from jsonb_array_elements(top_issues) with ordinality as top(item,ordinality);
    select coalesce(jsonb_agg(item order by item ->> 'itemId'),'[]'::jsonb) into terms
      from jsonb_array_elements(summary_items) item where item ->> 'summarySectionId'='contract-transaction-terms' and item ->> 'itemType'<>'deadline';
    select coalesce(jsonb_agg(item order by item #>> '{canonicalContent,dueAt}',item ->> 'itemId'),'[]'::jsonb) into deadlines
      from jsonb_array_elements(summary_items) item where item ->> 'itemType'='deadline';
    select count(*) into critical_deadline_count from jsonb_array_elements(deadlines) item
      where item #>> '{canonicalContent,status}' in ('urgent','missed','uncertain');
    select item into obligation from jsonb_array_elements(summary_items) item
      where item ->> 'summarySectionId'='primary-long-term-obligation'
      order by case item ->> 'fullSectionId' when 'solar-service' then 0 else 1 end,
        case item ->> 'materiality' when 'critical' then 0 else 1 end,item ->> 'itemId' limit 1;
    select coalesce(jsonb_agg(item order by item ->> 'itemId'),'[]'::jsonb) into obligation_items
      from jsonb_array_elements(summary_items) item
      where item ->> 'summarySectionId'='primary-long-term-obligation';
    select coalesce(jsonb_agg(item order by item ->> 'itemId'),'[]'::jsonb) into property_findings
      from jsonb_array_elements(summary_items) item where item ->> 'summarySectionId'='material-property-findings';
    select coalesce(jsonb_agg(jsonb_build_object(
      'questionId',question ->> 'questionId','questionVersion',question -> 'questionVersion',
      'wording',question ->> 'wording','targetRole',question ->> 'targetRole',
      'priority',question ->> 'priority','rationale',question ->> 'rationale',
      'status',question ->> 'status','resolutionState',question ->> 'resolutionState',
      'professionalReviewRequired',question -> 'professionalReviewRequired',
      'sourceRefs',question -> 'sourceRefs','fullSectionId','professional-questions',
      'fullAnchor','professional-questions'
    ) order by question ->> 'targetRole',question ->> 'questionId'),'[]'::jsonb) into questions
    from jsonb_array_elements(full_definition.question_references) question
    where question ->> 'status' in ('open','in_progress','blocked')
      and exists(select 1 from jsonb_array_elements(summary_items) item
        where item ->> 'itemId'='question:' || (question ->> 'questionId'));
    select coalesce(jsonb_agg(jsonb_build_object(
      'item',item ->> 'item','responsibleParty',item ->> 'responsibleRole',
      'evidenceNeeded',item ->> 'evidenceNeeded','preferredResolution',item ->> 'preferredResolution',
      'status',item ->> 'status','canonicalItemId',item ->> 'itemId','canonicalItemVersion',item -> 'version',
      'fullSectionId','open-items','fullAnchor','open-items'
    ) order by item ->> 'itemId'),'[]'::jsonb) into open_items
    from jsonb_array_elements(full_definition.open_item_references) item;
    select coalesce(jsonb_agg(distinct jsonb_build_object('sectionId',item ->> 'fullSectionId','anchor',item ->> 'fullAnchor')),'[]'::jsonb)
      into full_refs from jsonb_array_elements(summary_items) item;

    for section in select value from jsonb_array_elements(jsonb_build_array(
      jsonb_build_object('sectionId','executive-decision-summary','title','Executive Decision Summary'),
      jsonb_build_object('sectionId','quick-review','title','Quick Review'),
      jsonb_build_object('sectionId','contract-transaction-terms','title','Contract & Transaction Terms'),
      jsonb_build_object('sectionId','primary-long-term-obligation','title','Primary Financial / Long-Term Obligation'),
      jsonb_build_object('sectionId','material-property-findings','title','Material Property Findings'),
      jsonb_build_object('sectionId','questions-resolution-plan','title','Questions & Resolution Plan'),
      jsonb_build_object('sectionId','open-items-final-decision','title','Open Items & Final Decision')
    )) loop
      section_definitions := section_definitions || jsonb_build_array(section || jsonb_build_object('anchor',section ->> 'sectionId'));
    end loop;
    state_label := case target_snapshot.snapshot_state
      when 'current_with_conflicts' then 'current_with_conflicts'
      when 'current_with_open_questions' then 'current_with_open_questions'
      when 'professional_review_recommended' then 'professional_review_recommended'
      else 'current' end;
    validation_result := jsonb_build_object('eligible',true,'errors','[]'::jsonb,
      'materialR3ItemCount',material_count,'materialOmissionCount',missing_count,
      'duplicatePrimaryItemCount',duplicate_count,'sameSnapshot',true,'sameFullDefinition',true,
      'sameRecommendation',true,'sameQuestions',true,'sameDeadlines',true,'sameConflicts',true);
    payload := jsonb_build_object(
      'identity',jsonb_build_object('workspaceId',full_definition.workspace_id,'dealId',full_definition.deal_id,
        'propertyId',full_definition.property_id,'contractId',full_definition.contract_id,'perspective','buyer',
        'snapshotId',target_snapshot.id,'snapshotVersion',target_snapshot.snapshot_version,
        'fullReportDefinitionId',full_definition.id,'fullReportDefinitionVersion',full_definition.report_definition_version,
        'analysisVersion',full_definition.analysis_version,'sourceCutoffAt',full_definition.source_cutoff_at),
      'sectionDefinitions',section_definitions,
      'frontMatter',jsonb_build_object('recommendation',full_definition.recommendation_state,
        'overallConclusion',full_definition.executive_overview,'topIssues',top_issues,
        'quickReviewRows',quick_review,'criticalDeadlines',deadlines,
        'immediateRequiredActions',coalesce(target_snapshot.snapshot_payload #> '{recommendation,conditions}','[]'::jsonb)),
      'executiveDecisionSummary',jsonb_build_object('recommendation',full_definition.recommendation_state,
        'supportingReferenceIds',full_definition.recommendation_references,
        'conditions',coalesce(target_snapshot.snapshot_payload #> '{recommendation,conditions}','[]'::jsonb),
        'unresolvedBlockers',coalesce(target_snapshot.snapshot_payload #> '{recommendation,unresolvedBlockers}','[]'::jsonb)),
      'quickReviewRows',quick_review,'contractTransactionTerms',terms,'criticalDeadlines',deadlines,
      'primaryLongTermObligation',jsonb_build_object('primaryItem',obligation,'relatedMaterialItems',obligation_items),
      'materialPropertyFindings',property_findings,
      'materialQuestions',questions,'resolutionPlan',jsonb_build_object(
        'conditions',coalesce(target_snapshot.snapshot_payload #> '{recommendation,conditions}','[]'::jsonb),
        'unresolvedBlockers',coalesce(target_snapshot.snapshot_payload #> '{recommendation,unresolvedBlockers}','[]'::jsonb)),
      'openItems',open_items,
      'finalDecision',jsonb_build_object('recommendation',full_definition.recommendation_state,
        'supportingReferenceIds',full_definition.recommendation_references,
        'conditions',coalesce(target_snapshot.snapshot_payload #> '{recommendation,conditions}','[]'::jsonb)),
      'includedItemReferences',summary_items,'materialDispositions',material_dispositions,
      'fullReportReferences',full_refs,
      'rendererGuidance',jsonb_build_object('preferredPageRange',jsonb_build_array(8,10),
        'preferredPageTarget',9,'targetTopIssueRange',jsonb_build_array(5,7),
        'targetQuickReviewRange',jsonb_build_array(5,7),'paginationOwnedExternally',true),
      'validation',validation_result,'templateVersion',target_template_version,
      'definitionContractVersion','contractiq-buyer-summary-definition-v1',
      'independentAnalysisGenerated',false
    );
    content_hash := public.contractiq_report_hash(payload);
    definition_hash := public.contractiq_report_hash(jsonb_build_object(
      'snapshotId',target_snapshot.id,'snapshotVersion',target_snapshot.snapshot_version,
      'fullReportDefinitionId',full_definition.id,'fullReportContentHash',full_definition.content_hash,
      'templateVersion',target_template_version,'contentHash',content_hash));
    select coalesce(max(definition.summary_definition_version),0)+1 into definition_version
      from public.contractiq_buyer_summary_definitions definition
      where definition.workspace_id=full_definition.workspace_id and definition.contract_id=full_definition.contract_id;
    if prior_definition.id is not null then
      update public.contractiq_buyer_summary_definitions set summary_state='stale',is_current=false,
        stale_reason='new_full_report_summary_pending' where id=prior_definition.id;
    end if;
    insert into public.contractiq_buyer_summary_definitions (
      workspace_id,deal_id,property_id,contract_id,perspective,snapshot_id,snapshot_version,snapshot_hash,
      full_report_definition_id,full_report_definition_version,full_report_content_hash,analysis_version,
      summary_definition_version,template_version,summary_state,recommendation_state,reconciliation_state,
      source_cutoff_at,definition_payload,validation_result,top_issue_count,material_question_count,
      open_item_count,critical_deadline_count,content_hash,deterministic_definition_hash,is_current,
      generation_duration_ms,correlation_id,completed_at,created_by
    ) values (
      full_definition.workspace_id,full_definition.deal_id,full_definition.property_id,full_definition.contract_id,
      'buyer',target_snapshot.id,target_snapshot.snapshot_version,target_snapshot.content_hash,
      full_definition.id,full_definition.report_definition_version,full_definition.content_hash,full_definition.analysis_version,
      definition_version,target_template_version,state_label,full_definition.recommendation_state,'reconciled',
      full_definition.source_cutoff_at,payload,validation_result,jsonb_array_length(top_issues),jsonb_array_length(questions),
      jsonb_array_length(open_items),critical_deadline_count,content_hash,definition_hash,true,
      greatest(0,(extract(epoch from clock_timestamp()-started_at)*1000)::integer),coalesce(correlation_id,gen_random_uuid()),now(),current_user_id
    ) returning * into inserted_definition;
    if prior_definition.id is not null then
      update public.contractiq_buyer_summary_definitions set summary_state='superseded',is_current=false,
        stale_reason='new_summary_definition_created',superseded_by_definition_id=inserted_definition.id
      where id=prior_definition.id;
      insert into public.domain_events (workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,
        source_command,idempotency_key,correlation_id,payload)
      values (prior_definition.workspace_id,prior_definition.deal_id,prior_definition.property_id,current_user_id,
        'contractiq.summary_definition_superseded','contractiq_buyer_summary_definition',prior_definition.id,
        prior_definition.summary_definition_version,'create_contractiq_buyer_summary_definition',command.idempotency_key || ':superseded',
        coalesce(correlation_id,inserted_definition.correlation_id),jsonb_build_object('summaryDefinitionId',prior_definition.id,
          'successorDefinitionId',inserted_definition.id));
    end if;
    insert into public.domain_events (workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,
      source_command,idempotency_key,correlation_id,payload)
    values (inserted_definition.workspace_id,inserted_definition.deal_id,inserted_definition.property_id,current_user_id,
      'contractiq.summary_definition_created','contractiq_buyer_summary_definition',inserted_definition.id,
      inserted_definition.summary_definition_version,'create_contractiq_buyer_summary_definition',command.idempotency_key || ':created',
      coalesce(correlation_id,inserted_definition.correlation_id),jsonb_build_object('summaryDefinitionId',inserted_definition.id,
        'snapshotId',target_snapshot.id,'fullReportDefinitionId',full_definition.id,'recommendation',inserted_definition.recommendation_state,
        'topIssueCount',inserted_definition.top_issue_count,'materialQuestionCount',inserted_definition.material_question_count,
        'openItemCount',inserted_definition.open_item_count,'generationDurationMs',inserted_definition.generation_duration_ms,
        'reconciliationState',inserted_definition.reconciliation_state));
    insert into public.audit_events (workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,
      source_command,idempotency_key,after_values,changed_fields,metadata)
    values (inserted_definition.workspace_id,inserted_definition.deal_id,inserted_definition.property_id,current_user_id,
      'contractiq.summary_definition_created','contractiq_buyer_summary_definitions','contractiq_buyer_summary_definition',inserted_definition.id,
      'create_contractiq_buyer_summary_definition',command.idempotency_key || ':audit',
      jsonb_build_object('summaryDefinitionVersion',definition_version,'snapshotId',target_snapshot.id,
        'fullReportDefinitionId',full_definition.id,'contentHash',content_hash),
      array['summary_state','snapshot_id','full_report_definition_id','content_hash'],
      jsonb_build_object('correlationId',coalesce(correlation_id,inserted_definition.correlation_id),
        'templateVersion',target_template_version));
    update public.contract_command_requests set result=jsonb_build_object(
      'summaryDefinitionId',inserted_definition.id,'summaryDefinitionVersion',definition_version,
      'summaryState',inserted_definition.summary_state,'contentHash',content_hash,
      'deterministicDefinitionHash',definition_hash,'validationEligible',true,'failureCode',null)
      where id=command.id;
    return (select result from public.contract_command_requests where id=command.id)
      || jsonb_build_object('reused',false,'priorValidPreserved',prior_valid_preserved);
  exception when others then
    get stacked diagnostics failure_code=returned_sqlstate;
    select coalesce(max(definition.summary_definition_version),0)+1 into definition_version
      from public.contractiq_buyer_summary_definitions definition
      where definition.workspace_id=full_definition.workspace_id and definition.contract_id=full_definition.contract_id;
    insert into public.contractiq_buyer_summary_definitions (
      workspace_id,deal_id,property_id,contract_id,snapshot_id,snapshot_version,snapshot_hash,
      full_report_definition_id,full_report_definition_version,full_report_content_hash,analysis_version,
      summary_definition_version,template_version,summary_state,reconciliation_state,source_cutoff_at,
      validation_result,failure_code,generation_duration_ms,correlation_id,failed_at,created_by
    ) values (
      full_definition.workspace_id,full_definition.deal_id,full_definition.property_id,full_definition.contract_id,
      full_definition.snapshot_id,full_definition.snapshot_version,full_definition.snapshot_hash,
      full_definition.id,full_definition.report_definition_version,coalesce(full_definition.content_hash,repeat('0',64)),
      full_definition.analysis_version,definition_version,target_template_version,'failed_with_prior_valid',
      'stale',full_definition.source_cutoff_at,
      jsonb_build_object('eligible',false,'errors',jsonb_build_array('summary_generation_failed')),
      failure_code,greatest(0,(extract(epoch from clock_timestamp()-started_at)*1000)::integer),
      coalesce(correlation_id,gen_random_uuid()),now(),current_user_id
    ) returning * into inserted_definition;
    insert into public.domain_events (workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,
      source_command,idempotency_key,correlation_id,payload)
    values (inserted_definition.workspace_id,inserted_definition.deal_id,inserted_definition.property_id,current_user_id,
      'contractiq.summary_definition_failed','contractiq_buyer_summary_definition',inserted_definition.id,
      inserted_definition.summary_definition_version,'create_contractiq_buyer_summary_definition',command.idempotency_key || ':failed',
      coalesce(correlation_id,inserted_definition.correlation_id),jsonb_build_object('summaryDefinitionId',inserted_definition.id,
        'snapshotId',full_definition.snapshot_id,'fullReportDefinitionId',full_definition.id,
        'failureCode',failure_code,'priorValidPreserved',prior_valid_preserved));
    insert into public.audit_events (workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,
      source_command,idempotency_key,metadata)
    values (inserted_definition.workspace_id,inserted_definition.deal_id,inserted_definition.property_id,current_user_id,
      'contractiq.summary_definition_failed','contractiq_buyer_summary_definitions','contractiq_buyer_summary_definition',
      inserted_definition.id,'create_contractiq_buyer_summary_definition',command.idempotency_key || ':failed:audit',
      jsonb_build_object('failureCode',failure_code,'priorValidPreserved',prior_valid_preserved));
    update public.contract_command_requests set result=jsonb_build_object(
      'summaryDefinitionId',inserted_definition.id,'summaryDefinitionVersion',definition_version,
      'summaryState','failed_with_prior_valid','validationEligible',false,
      'failureCode',failure_code,'priorValidPreserved',prior_valid_preserved) where id=command.id;
    return (select result from public.contract_command_requests where id=command.id) || jsonb_build_object('reused',false);
  end;
end; $$;

create temporary table spec011a_r2_smoke_result (
  test_name text primary key, passed boolean not null, detail jsonb not null default '{}'::jsonb
) on commit drop;

do $smoke$
#variable_conflict use_variable
declare
  user_id constant uuid:='a1111111-1111-4111-8111-111111111111'; other_user_id constant uuid:='a1111111-1111-4111-8111-111111111112';
  workspace_id constant uuid:='a2222222-2222-4222-8222-222222222222'; other_workspace_id constant uuid:='a2222222-2222-4222-8222-222222222223';
  property_id constant uuid:='a3333333-3333-4333-8333-333333333333'; other_property_id constant uuid:='a3333333-3333-4333-8333-333333333334';
  deal_id constant uuid:='a4444444-4444-4444-8444-444444444444'; other_deal_id constant uuid:='a4444444-4444-4444-8444-444444444445';
  contract_id constant uuid:='a5555555-5555-4555-8555-555555555555'; other_contract_id constant uuid:='a5555555-5555-4555-8555-555555555556';
  analysis_id constant uuid:='a6666666-6666-4666-8666-666666666666'; finding_id constant uuid:='a7777777-7777-4777-8777-777777777777';
  conflict_id constant uuid:='a8888888-8888-4888-8888-888888888888'; other_question_id constant uuid:='a9999999-9999-4999-8999-999999999999';
  attorney jsonb; attorney_retry jsonb; lender jsonb; response_result jsonb; resolve_result jsonb; update_result jsonb; title_result jsonb;
  snapshot_one jsonb; snapshot_two jsonb; reconciliation jsonb; question_id uuid; lender_id uuid; title_id uuid; first_snapshot_id uuid;
  stale_denied boolean:=false; cross_workspace_denied boolean:=false; evidence_denied boolean:=false; direct_write_denied boolean:=false; professional_gate_denied boolean:=false;
  response_count integer; history_count integer; event_count integer; audit_count integer; projection_count integer; old_snapshot_version integer;
begin
  begin
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
    values ('00000000-0000-0000-0000-000000000000',user_id,'authenticated','authenticated','spec011a-r2@example.invalid','',now(),'{}','{}',now(),now()),
           ('00000000-0000-0000-0000-000000000000',other_user_id,'authenticated','authenticated','spec011a-r2-other@example.invalid','',now(),'{}','{}',now(),now());
    insert into public.workspaces(id,name,owner_user_id) values(workspace_id,'Spec 011A R2 rollback',user_id),(other_workspace_id,'Spec 011A R2 other',other_user_id);
    insert into public.workspace_memberships(workspace_id,user_id,role_id,status) values(workspace_id,user_id,'owner','active'),(other_workspace_id,other_user_id,'owner','active');
    insert into public.properties(id,workspace_id,display_address,created_by) values(property_id,workspace_id,'200 Question Way',user_id),(other_property_id,other_workspace_id,'201 Question Way',other_user_id);
    insert into public.brix_deals(id,owner_id,address,strategy_id,workspace_id,display_name,created_by)
    values(deal_id,user_id,'200 Question Way','buy_and_hold',workspace_id,'R2 rollback deal',user_id),(other_deal_id,other_user_id,'201 Question Way','buy_and_hold',other_workspace_id,'R2 other deal',other_user_id);
    insert into public.deal_properties(workspace_id,deal_id,property_id,role,inclusion_status,created_by)
    values(workspace_id,deal_id,property_id,'primary','active',user_id),(other_workspace_id,other_deal_id,other_property_id,'primary','active',other_user_id);
    insert into public.contracts(id,user_id,workspace_id,deal_id,property_id,title,contract_name,contract_type,perspective,status,verification_state,analysis_state,confidence,version,created_by,updated_by)
    values(contract_id,user_id,workspace_id,deal_id,property_id,'R2 Purchase Contract','R2 Purchase Contract','purchase_agreement','buyer','executed','verified','current',100,1,user_id,user_id),
          (other_contract_id,other_user_id,other_workspace_id,other_deal_id,other_property_id,'Other Contract','Other Contract','purchase_agreement','buyer','executed','verified','current',100,1,other_user_id,other_user_id);
    insert into public.contract_findings(id,workspace_id,contract_id,finding_category,finding_type,summary,severity,perspective,source_anchor,confidence,verification_state,professional_review_required,created_by,updated_by)
    values(finding_id,workspace_id,contract_id,'assignment_transfer','affiliate_exception','Assignment consent exception requires review.','high','buyer','{"kind":"clause","label":"Assignment"}',90,'source_backed',true,user_id,user_id);
    insert into public.contract_conflicts(id,workspace_id,contract_id,conflict_type,summary,severity,source_a_anchor,source_b_anchor,resolution_state,professional_review_required,created_by,updated_by)
    values(conflict_id,workspace_id,contract_id,'property_conflict','Legal descriptions disagree.','high','{"kind":"exhibit","label":"A"}','{"kind":"exhibit","label":"B"}','unresolved',true,user_id,user_id);
    insert into public.contract_questions(id,workspace_id,contract_id,property_id,contract_version,question,recipient_role,priority,category,rationale,why_it_matters,semantic_key,deterministic_key,perspective,status,resolution_state,report_inclusion,content_hash,created_by,updated_by)
    values(other_question_id,other_workspace_id,other_contract_id,other_property_id,1,'Other workspace question?','buyer','normal','other','Private question.','It is private.','other:private',repeat('9',64),'buyer','open','unresolved','{}',repeat('8',64),other_user_id,other_user_id);
    insert into public.contract_perspective_analysis_runs(id,workspace_id,deal_id,property_id,contract_id,contract_version,perspective,analysis_state,completeness_state,source_version_graph,result_payload,deterministic_hash,input_hash,is_current,created_by,updated_by)
    values(analysis_id,workspace_id,deal_id,property_id,contract_id,1,'buyer','current','complete',jsonb_build_object('contractId',contract_id,'contractVersion',1),'{}',repeat('a',64),repeat('b',64),true,user_id,user_id);

    perform set_config('request.jwt.claims',jsonb_build_object('sub',user_id,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    attorney:=public.create_contractiq_canonical_question(contract_id,jsonb_build_object('question','Does the affiliate exception apply to the intended buyer entity?','rationale','The assignment clause conditions consent.','whyItMatters','An incorrect interpretation may affect assignment rights.','priority','high','category','legal_review','targetRole','buyer_attorney','perspective','buyer','semanticKey','assignment:affiliate-exception','contractFindingId',finding_id,'contractFindingVersion',1,'professionalReviewRequired',true,'sourceAnchors',jsonb_build_array(jsonb_build_object('kind','clause','label','Assignment')),'reportInclusion',jsonb_build_object('fullReport',true,'summaryReport',true,'standaloneQuestionsReport',true,'roleExport',true)),'r2-attorney-1','b1111111-1111-4111-8111-111111111111');
    attorney_retry:=public.create_contractiq_canonical_question(contract_id,jsonb_build_object('question','Could the affiliate exception cover the buyer?','rationale','Same source issue.','priority','high','category','legal_review','targetRole','buyer_attorney','semanticKey','assignment:affiliate-exception','contractFindingId',finding_id,'contractFindingVersion',1,'professionalReviewRequired',true),'r2-attorney-2','b1111111-1111-4111-8111-111111111112');
    question_id:=(attorney ->> 'questionId')::uuid;
    if question_id<>(attorney_retry ->> 'questionId')::uuid or not (attorney_retry ->> 'reused')::boolean then raise exception 'semantic deduplication failed'; end if;

    lender:=public.create_contractiq_canonical_question(contract_id,jsonb_build_object('question','Has the lender issued the required loan commitment?','rationale','Commitment status is unclear.','priority','high','category','financing','targetRole','lender','semanticKey','financing:loan-commitment','contractFindingId',finding_id,'contractFindingVersion',1),'r2-lender-1','b1111111-1111-4111-8111-111111111113');
    lender_id:=(lender ->> 'questionId')::uuid;
    response_result:=public.add_contractiq_question_response(lender_id,jsonb_build_object('response','Yes, see commitment letter.','responderRole','lender','sourceClassification','lender','verificationState','unverified'),1,'r2-response-1','b1111111-1111-4111-8111-111111111114');
    begin perform public.add_contractiq_question_response(lender_id,jsonb_build_object('response','Stale answer.','sourceClassification','lender'),1,'r2-response-stale','b1111111-1111-4111-8111-111111111115'); exception when serialization_failure then stale_denied:=true; end;
    if not stale_denied then raise exception 'stale response was accepted'; end if;
    begin perform public.resolve_contractiq_question(question_id,jsonb_build_object('resolutionState','verified_resolved','verificationState','verified'),1,'r2-professional-invalid','b1111111-1111-4111-8111-111111111116'); exception when invalid_parameter_value then professional_gate_denied:=true; end;
    if not professional_gate_denied then raise exception 'professional review gate was bypassed'; end if;
    resolve_result:=public.resolve_contractiq_question(lender_id,jsonb_build_object('resolutionState','verified_resolved','verificationState','verified'),(response_result ->> 'questionVersion')::integer,'r2-resolve-1','b1111111-1111-4111-8111-111111111117');
    snapshot_one:=public.create_contractiq_report_snapshot(contract_id,'buyer',analysis_id,'r2-snapshot-1','b1111111-1111-4111-8111-111111111118'); first_snapshot_id:=(snapshot_one ->> 'snapshotId')::uuid;
    select (item ->> 'version')::integer into old_snapshot_version from public.contractiq_report_snapshots s cross join lateral jsonb_array_elements(s.snapshot_payload -> 'questions') item where s.id=first_snapshot_id and item ->> 'questionId'=lender_id::text;
    update_result:=public.update_contractiq_canonical_question(lender_id,jsonb_build_object('whyItMatters','Updated material explanation after verification.'),(resolve_result ->> 'questionVersion')::integer,'r2-update-1','b1111111-1111-4111-8111-111111111119');
    snapshot_two:=public.create_contractiq_report_snapshot(contract_id,'buyer',analysis_id,'r2-snapshot-2','b1111111-1111-4111-8111-111111111120');
    if old_snapshot_version is null or old_snapshot_version=(update_result ->> 'questionVersion')::integer then raise exception 'snapshot did not freeze prior question version'; end if;

    title_result:=public.create_contractiq_canonical_question(contract_id,jsonb_build_object('question','Which legal description should control for closing and title?','rationale','Current sources disagree.','whyItMatters','The controlling legal description is required for title.','priority','high','category','title','targetRole','title_company','semanticKey','title:legal-description-conflict','contractConflictId',conflict_id,'contractConflictVersion',1,'professionalReviewRequired',true,'sourceAnchors',jsonb_build_array(jsonb_build_object('kind','exhibit','label','A'),jsonb_build_object('kind','exhibit','label','B'))),'r2-title-1','b1111111-1111-4111-8111-111111111121'); title_id:=(title_result ->> 'questionId')::uuid;
    perform public.resolve_contractiq_question(title_id,jsonb_build_object('resolutionState','superseded'),1,'r2-title-supersede','b1111111-1111-4111-8111-111111111122');
    reconciliation:=public.reconcile_contractiq_question_registry(contract_id);
    if not (reconciliation ->> 'reconciled')::boolean then raise exception 'question registry reconciliation failed: %',reconciliation; end if;
    begin perform public.add_contractiq_question_response(other_question_id,jsonb_build_object('response','Unauthorized.','sourceClassification','user'),1,'r2-cross-workspace','b1111111-1111-4111-8111-111111111123'); exception when insufficient_privilege or no_data_found then cross_workspace_denied:=true; end;
    if not cross_workspace_denied then raise exception 'cross-workspace response was accepted'; end if;
    begin perform public.add_contractiq_question_response(question_id,jsonb_build_object('response','Unauthorized evidence.','sourceClassification','document','responseEvidenceId','ffffffff-ffff-4fff-8fff-ffffffffffff'),1,'r2-bad-evidence','b1111111-1111-4111-8111-111111111124'); exception when insufficient_privilege then evidence_denied:=true; end;
    if not evidence_denied then raise exception 'unauthorized Evidence was accepted'; end if;
    begin insert into public.contract_question_responses(workspace_id,contract_id,question_id,question_version,response_version,response_text,responder_role,source_classification,idempotency_key,content_hash) values(workspace_id,contract_id,question_id,1,99,'Direct write','other','user','direct',repeat('d',64)); exception when insufficient_privilege then direct_write_denied:=true; end;
    if not direct_write_denied then raise exception 'direct response write was accepted'; end if;
    select count(*) into response_count from public.contract_question_responses r where r.question_id=lender_id;
    select jsonb_array_length(q.version_history) into history_count from public.contractiq_question_detail_projection q where q.question_id=lender_id;
    select count(*) into projection_count from public.contractiq_question_registry_projection p where p.contract_id=contract_id;
    select count(*) into event_count from public.domain_events e where e.workspace_id=workspace_id and e.event_type like 'contractiq.question_%';
    select count(*) into audit_count from public.audit_events a where a.workspace_id=workspace_id and a.action like 'contractiq.question_%';
    if response_count<>1 or history_count<2 or projection_count<>1 or event_count<7 or audit_count<5 then raise exception 'lifecycle evidence incomplete: responses %, history %, projection %, events %, audits %',response_count,history_count,projection_count,event_count,audit_count; end if;
    execute 'reset role';
    raise exception using errcode='BR002',message='SPEC011A_R2_ROLLBACK';
  exception when sqlstate 'BR002' then null; end;
  if exists(select 1 from public.contracts c where c.id=contract_id) or exists(select 1 from auth.users u where u.id=user_id) then raise exception 'rollback smoke left fixture data'; end if;
  insert into spec011a_r2_smoke_result values('canonical_questions',true,jsonb_build_object('semanticDeduplication',true,'responseHistory',response_count,'versionHistory',history_count,'registryProjection',projection_count,'registryReconciled',reconciliation ->> 'reconciled','staleWriteDenied',stale_denied,'professionalGateDenied',professional_gate_denied,'crossWorkspaceDenied',cross_workspace_denied,'unauthorizedEvidenceDenied',evidence_denied,'directWriteDenied',direct_write_denied,'events',event_count,'audits',audit_count,'r1FrozenVersion',old_snapshot_version,'fixtureRollbackVerified',true));
end $smoke$;

select * from spec011a_r2_smoke_result;

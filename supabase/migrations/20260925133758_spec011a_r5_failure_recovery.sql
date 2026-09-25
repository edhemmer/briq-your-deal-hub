-- Keep the validated generator private; this command records a durable failure
-- only when an authorized caller has a prior valid definition to preserve.
alter function public.create_contractiq_questions_report_definition(uuid,text,text,jsonb,text,text,uuid)
  rename to generate_contractiq_questions_report_definition;
revoke all on function public.generate_contractiq_questions_report_definition(uuid,text,text,jsonb,text,text,uuid)
  from public,anon,authenticated;

create function public.create_contractiq_questions_report_definition(
  target_snapshot_id uuid, target_mode text, target_role text, requested_filters jsonb,
  target_template_version text, idempotency_key text, correlation_id uuid default gen_random_uuid()
) returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
#variable_conflict use_variable
declare
  actor uuid:=auth.uid(); snap public.contractiq_report_snapshots%rowtype;
  target_contract public.contracts%rowtype; prior public.contractiq_questions_report_definitions%rowtype;
  failed public.contractiq_questions_report_definitions%rowtype; command public.contract_command_requests%rowtype;
  failure_sqlstate text; failure_code text; next_version integer;
begin
  if actor is null then raise exception 'Authentication required.' using errcode='42501'; end if;
  select * into snap from public.contractiq_report_snapshots s where s.id=target_snapshot_id;
  if snap.id is null then raise exception 'ContractIQ snapshot not found.' using errcode='P0002'; end if;
  target_contract:=public.authorized_contract(snap.contract_id);
  if target_contract.workspace_id<>snap.workspace_id or not public.has_workspace_permission(snap.workspace_id,'deals:manage') then
    raise exception 'Insufficient permission for ContractIQ definition.' using errcode='42501'; end if;
  begin
    return public.generate_contractiq_questions_report_definition(target_snapshot_id,target_mode,target_role,
      requested_filters,target_template_version,idempotency_key,correlation_id);
  exception when others then
    get stacked diagnostics failure_sqlstate=returned_sqlstate;
    if failure_sqlstate in ('42501','22023','P0002') then raise; end if;
  end;
  select * into prior from public.contractiq_questions_report_definitions d
    where d.workspace_id=snap.workspace_id and d.contract_id=snap.contract_id and d.perspective=snap.perspective
      and d.report_mode=target_mode and d.selected_role is not distinct from target_role
      and d.report_state in ('current','current_with_open_questions','stale','superseded')
    order by d.report_definition_version desc limit 1;
  if prior.id is null then
    raise exception 'Questions Report generation failed without a prior valid definition.' using errcode='40001';
  end if;
  failure_code:=case when failure_sqlstate='40001' then 'SOURCE_STATE_CHANGED' else 'DEFINITION_GENERATION_FAILED' end;
  command:=public.ensure_contract_command(snap.workspace_id,snap.deal_id,snap.property_id,snap.contract_id,
    'create_contractiq_questions_report_definition_failed',idempotency_key,
    jsonb_build_object('snapshotId',snap.id,'mode',target_mode,'role',target_role,
      'filters',coalesce(requested_filters,'{}'::jsonb),'templateVersion',target_template_version));
  if command.result ? 'reportDefinitionId' then return command.result || jsonb_build_object('reused',true); end if;
  perform pg_advisory_xact_lock(hashtextextended(snap.workspace_id::text||snap.contract_id::text||target_mode||coalesce(target_role,''),0));
  select coalesce(max(d.report_definition_version),0)+1 into next_version from public.contractiq_questions_report_definitions d
    where d.workspace_id=snap.workspace_id and d.contract_id=snap.contract_id and d.perspective=snap.perspective
      and d.report_mode=target_mode and d.selected_role is not distinct from target_role;
  insert into public.contractiq_questions_report_definitions(workspace_id,deal_id,property_id,contract_id,perspective,
    snapshot_id,snapshot_version,snapshot_hash,question_set_version,analysis_version,report_definition_version,
    template_version,report_mode,selected_role,filter_rules,grouped_questions,canonical_question_refs,content_scope,
    counts,source_cutoff_at,content_hash,deterministic_definition_hash,report_state,reconciliation_state,
    is_current,stale_reason,failure_code,correlation_id,created_by)
  values(snap.workspace_id,snap.deal_id,snap.property_id,snap.contract_id,snap.perspective,snap.id,snap.snapshot_version,
    snap.content_hash,snap.question_registry_version,snap.analysis_run_version,next_version,target_template_version,
    target_mode,target_role,case when jsonb_typeof(requested_filters)='object' then requested_filters else '{}'::jsonb end,
    '[]'::jsonb,'[]'::jsonb,jsonb_build_object('priorValidDefinitionId',prior.id,'privateBuyerNotesExcluded',true),
    jsonb_build_object('priorValidDefinitionId',prior.id),snap.source_document_cutoff_at,
    public.contractiq_report_hash(jsonb_build_object('snapshotId',snap.id,'priorValidDefinitionId',prior.id,
      'failureCode',failure_code,'idempotencyKey',idempotency_key)),
    public.contractiq_report_hash(jsonb_build_object('snapshotId',snap.id,'mode',target_mode,'role',target_role,
      'templateVersion',target_template_version,'failureCode',failure_code,'idempotencyKey',idempotency_key)),
    'failed_with_prior_valid','failed',false,'generation_failed',failure_code,correlation_id,actor)
  returning * into failed;
  update public.contract_command_requests set result=jsonb_build_object('reportDefinitionId',failed.id,
    'reportDefinitionVersion',next_version,'reportState',failed.report_state,'failureCode',failure_code,
    'priorValidDefinitionId',prior.id,'priorValidPreserved',true,'reused',false) where id=command.id;
  insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,
    source_command,idempotency_key,correlation_id,payload)
  values(snap.workspace_id,snap.deal_id,snap.property_id,actor,'contractiq.questions_report_definition_failed',
    'contractiq_questions_report_definition',failed.id,next_version,'create_contractiq_questions_report_definition',
    idempotency_key,correlation_id,jsonb_build_object('definitionId',failed.id,'snapshotId',snap.id,
      'priorValidDefinitionId',prior.id,'failureCode',failure_code,'mode',target_mode,'selectedRole',target_role));
  insert into public.audit_events(workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,
    source_command,idempotency_key,correlation_id,after_values,changed_fields,metadata)
  values(snap.workspace_id,snap.deal_id,snap.property_id,actor,'contractiq.questions_report_definition_failed',
    'contractiq_questions_report_definitions','contractiq_questions_report_definition',failed.id,
    'create_contractiq_questions_report_definition',idempotency_key,correlation_id,
    jsonb_build_object('version',next_version,'state','failed_with_prior_valid','failureCode',failure_code),
    array['report_state','failure_code'],jsonb_build_object('priorValidDefinitionId',prior.id));
  return (select result from public.contract_command_requests where id=command.id);
end $$;
revoke all on function public.create_contractiq_questions_report_definition(uuid,text,text,jsonb,text,text,uuid)
  from public,anon;
grant execute on function public.create_contractiq_questions_report_definition(uuid,text,text,jsonb,text,text,uuid)
  to authenticated;

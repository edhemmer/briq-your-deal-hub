alter function public.reportiq_finish_generation(uuid,text,text,text,bigint,text,boolean)
  rename to reportiq_finish_generation_unchecked;
revoke execute on function public.reportiq_finish_generation_unchecked(uuid,text,text,text,bigint,text,boolean)
  from public,anon,authenticated,service_role;

create function public.reportiq_finish_generation(
  target_job_id uuid,result_storage_path text,result_file_hash text,result_mime_type text,
  result_size_bytes bigint,result_failure_code text default null,result_retryable boolean default false
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  j public.background_jobs%rowtype;
  newer public.reportiq_artifacts%rowtype;
  created public.reportiq_artifacts%rowtype;
  snap public.contractiq_report_snapshots%rowtype;
  def record;
  counterpart record;
  result jsonb;
begin
  select * into j from public.background_jobs where id=target_job_id;
  if j.id is null then raise exception 'Report job unavailable.' using errcode='P0002'; end if;
  perform pg_advisory_xact_lock(hashtextextended(concat_ws('|',j.workspace_id,j.contract_id,j.report_type,
    j.perspective,coalesce(j.selected_role,'')),0));
  select * into j from public.background_jobs where id=target_job_id for update;
  if j.status='running' and result_failure_code is null then
    select a.* into newer from public.reportiq_artifacts a
    join public.background_jobs newer_job on newer_job.workspace_id=a.workspace_id and newer_job.id=a.job_id
    where a.workspace_id=j.workspace_id and a.contract_id=j.contract_id and a.report_type=j.report_type
      and a.perspective=j.perspective and a.selected_role is not distinct from j.selected_role
      and a.state='current' and (newer_job.requested_at,newer_job.id)>(j.requested_at,j.id)
    limit 1;
    if newer.id is not null then
      if result_storage_path is null or result_file_hash !~ '^[0-9a-f]{64}$'
        or result_mime_type not in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        or result_size_bytes is null or result_size_bytes<1 or result_size_bytes>52428800
        or not exists(select 1 from storage.objects o where o.bucket_id='report-artifacts' and o.name=result_storage_path) then
        return public.reportiq_finish_generation_unchecked(target_job_id,result_storage_path,result_file_hash,
          result_mime_type,result_size_bytes,'storage_object_missing',true);
      end if;
      select * into snap from public.contractiq_report_snapshots where workspace_id=j.workspace_id and id=j.snapshot_id;
      select * into def from public.contractiq_report_definition_lineage
        where workspace_id=j.workspace_id and definition_id=j.definition_id and report_type=j.report_type;
      insert into public.reportiq_artifacts(workspace_id,deal_id,property_id,contract_id,job_id,report_type,perspective,
        selected_role,snapshot_id,snapshot_version,analysis_version,definition_id,definition_version,definition_hash,
        template_version,renderer_version,file_hash,source_cutoff_at,storage_bucket,storage_path,mime_type,size_bytes,
        state,stale_reasons,superseded_by_artifact_id)
      values(j.workspace_id,j.deal_id,j.property_id,j.contract_id,j.id,j.report_type,j.perspective,j.selected_role,
        j.snapshot_id,snap.snapshot_version,snap.analysis_run_version,j.definition_id,j.definition_version,j.definition_hash,
        j.template_version,j.renderer_version,result_file_hash,def.source_cutoff_at,'report-artifacts',result_storage_path,
        result_mime_type,result_size_bytes,'superseded',array['completed_out_of_order'],newer.id)
      returning * into created;
      update public.background_jobs set status='completed',artifact_id=created.id,completed_at=now(),
        failure_code='completed_out_of_order' where id=j.id;
      insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,actor_type,event_type,entity_type,
        entity_id,source_command,idempotency_key,correlation_id,payload)
      values(j.workspace_id,j.deal_id,j.property_id,null,'system','reportiq.artifact_generated','reportiq_artifact',
        created.id,'reportiq_finish_generation',j.id::text || ':historical',j.correlation_id,
        jsonb_build_object('jobId',j.id,'artifactId',created.id,'current',false,'newerArtifactId',newer.id));
      return jsonb_build_object('jobId',j.id,'status','completed','artifactId',created.id,'current',false);
    end if;
  end if;
  result:=public.reportiq_finish_generation_unchecked(target_job_id,result_storage_path,result_file_hash,
    result_mime_type,result_size_bytes,result_failure_code,result_retryable);
  if coalesce((result->>'current')::boolean,false) and j.report_type in ('full_due_diligence','buyer_summary') then
    select a.id,a.snapshot_id,a.analysis_version,a.source_cutoff_at,d.recommendation_state into counterpart
    from public.reportiq_artifacts a
    join public.contractiq_report_definition_lineage d on d.workspace_id=a.workspace_id and d.definition_id=a.definition_id
    where a.workspace_id=j.workspace_id and a.contract_id=j.contract_id and a.perspective=j.perspective
      and a.report_type=case j.report_type when 'full_due_diligence' then 'buyer_summary' else 'full_due_diligence' end
      and a.state='current' limit 1;
    select * into created from public.reportiq_artifacts where id=(result->>'artifactId')::uuid;
    select * into def from public.contractiq_report_definition_lineage where workspace_id=j.workspace_id
      and definition_id=j.definition_id and report_type=j.report_type;
    if counterpart.id is not null and
      (counterpart.snapshot_id<>created.snapshot_id or counterpart.analysis_version<>created.analysis_version
        or counterpart.source_cutoff_at<>created.source_cutoff_at
        or counterpart.recommendation_state is distinct from def.recommendation_state) then
      update public.reportiq_artifacts set state='stale',
        stale_reasons=array['family_lineage_mismatch'],state_changed_at=now() where id=counterpart.id;
    end if;
  end if;
  return result;
end $$;
revoke execute on function public.reportiq_finish_generation(uuid,text,text,text,bigint,text,boolean)
  from public,anon,authenticated;
grant execute on function public.reportiq_finish_generation(uuid,text,text,text,bigint,text,boolean)
  to service_role;

-- R6: ReportIQ owns durable artifact attempts and immutable rendered history.
-- ContractIQ definitions remain the sole authority for report content and freshness.
create table public.background_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  contract_id uuid not null,
  job_type text not null check (job_type = 'contractiq_report_render'),
  report_type text not null check (report_type in ('full_due_diligence','buyer_summary','questions_all','questions_grouped','role_export')),
  perspective text not null references public.contract_perspective_definitions(perspective_key),
  selected_role text references public.contract_question_recipient_role_definitions(role_key),
  snapshot_id uuid not null,
  definition_id uuid not null,
  definition_version integer not null check (definition_version > 0),
  definition_hash text not null check (definition_hash ~ '^[0-9a-f]{64}$'),
  template_version text not null,
  renderer_version text not null,
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  idempotency_key text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','retrying','cancelled','blocked')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  max_attempts integer not null default 3 check (max_attempts between 1 and 3),
  failure_code text,
  failure_retryable boolean,
  artifact_id uuid,
  requested_by uuid references auth.users(id) on delete set null,
  correlation_id uuid not null default gen_random_uuid(),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  heartbeat_at timestamptz,
  completed_at timestamptz,
  next_retry_at timestamptz,
  constraint background_jobs_deal_fk foreign key (workspace_id,deal_id) references public.brix_deals(workspace_id,id) on delete cascade,
  constraint background_jobs_property_fk foreign key (workspace_id,property_id) references public.properties(workspace_id,id) on delete restrict,
  constraint background_jobs_contract_fk foreign key (workspace_id,contract_id) references public.contracts(workspace_id,id) on delete cascade,
  constraint background_jobs_snapshot_fk foreign key (workspace_id,snapshot_id) references public.contractiq_report_snapshots(workspace_id,id) on delete restrict,
  constraint background_jobs_role_shape check ((report_type='role_export') = (selected_role is not null)),
  unique (workspace_id,id),
  unique (workspace_id,idempotency_key),
  unique (workspace_id,request_fingerprint)
);
create index background_jobs_queue on public.background_jobs(status,next_retry_at,requested_at) where status in ('queued','retrying');
create index background_jobs_context on public.background_jobs(workspace_id,contract_id,report_type,perspective,selected_role,requested_at desc);
create index background_jobs_deal_fk_idx on public.background_jobs(workspace_id,deal_id);
create index background_jobs_property_fk_idx on public.background_jobs(workspace_id,property_id);
create index background_jobs_contract_fk_idx on public.background_jobs(workspace_id,contract_id);
create index background_jobs_snapshot_fk_idx on public.background_jobs(workspace_id,snapshot_id);
create index background_jobs_requested_by_fk_idx on public.background_jobs(requested_by) where requested_by is not null;

create table public.reportiq_artifacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  contract_id uuid not null,
  job_id uuid not null,
  report_type text not null check (report_type in ('full_due_diligence','buyer_summary','questions_all','questions_grouped','role_export')),
  perspective text not null references public.contract_perspective_definitions(perspective_key),
  selected_role text references public.contract_question_recipient_role_definitions(role_key),
  snapshot_id uuid not null,
  snapshot_version integer not null check (snapshot_version > 0),
  analysis_version integer not null check (analysis_version > 0),
  definition_id uuid not null,
  definition_version integer not null check (definition_version > 0),
  definition_hash text not null check (definition_hash ~ '^[0-9a-f]{64}$'),
  template_version text not null,
  renderer_version text not null,
  file_hash text not null check (file_hash ~ '^[0-9a-f]{64}$'),
  source_cutoff_at timestamptz not null,
  storage_bucket text not null check (storage_bucket='report-artifacts'),
  storage_path text not null,
  mime_type text not null check (mime_type in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  state text not null check (state in ('current','stale','failed_with_prior_valid_artifact','superseded','blocked','revoked')),
  stale_reasons text[] not null default '{}'::text[],
  superseded_by_artifact_id uuid,
  generated_at timestamptz not null default now(),
  state_changed_at timestamptz not null default now(),
  constraint reportiq_artifacts_deal_fk foreign key (workspace_id,deal_id) references public.brix_deals(workspace_id,id) on delete cascade,
  constraint reportiq_artifacts_property_fk foreign key (workspace_id,property_id) references public.properties(workspace_id,id) on delete restrict,
  constraint reportiq_artifacts_contract_fk foreign key (workspace_id,contract_id) references public.contracts(workspace_id,id) on delete cascade,
  constraint reportiq_artifacts_snapshot_fk foreign key (workspace_id,snapshot_id) references public.contractiq_report_snapshots(workspace_id,id) on delete restrict,
  constraint reportiq_artifacts_job_fk foreign key (workspace_id,job_id) references public.background_jobs(workspace_id,id) on delete restrict,
  constraint reportiq_artifacts_role_shape check ((report_type='role_export') = (selected_role is not null)),
  constraint reportiq_artifacts_path_scope check (storage_path like workspace_id::text || '/' || deal_id::text || '/%'),
  unique (workspace_id,id),
  unique (workspace_id,job_id),
  unique (storage_bucket,storage_path)
);
alter table public.reportiq_artifacts add constraint reportiq_artifacts_superseded_fk
  foreign key (workspace_id,superseded_by_artifact_id) references public.reportiq_artifacts(workspace_id,id);
alter table public.background_jobs add constraint background_jobs_artifact_fk
  foreign key (workspace_id,artifact_id) references public.reportiq_artifacts(workspace_id,id);
create unique index reportiq_one_current_artifact on public.reportiq_artifacts
  (workspace_id,contract_id,report_type,perspective,coalesce(selected_role,'')) where state='current';
create index reportiq_artifact_history on public.reportiq_artifacts(workspace_id,contract_id,report_type,perspective,selected_role,generated_at desc);
create index reportiq_artifacts_deal_fk_idx on public.reportiq_artifacts(workspace_id,deal_id);
create index reportiq_artifacts_property_fk_idx on public.reportiq_artifacts(workspace_id,property_id);
create index reportiq_artifacts_snapshot_fk_idx on public.reportiq_artifacts(workspace_id,snapshot_id);
create index reportiq_artifacts_superseded_fk_idx on public.reportiq_artifacts(workspace_id,superseded_by_artifact_id) where superseded_by_artifact_id is not null;

create function public.protect_reportiq_artifact_history()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if (to_jsonb(new)-'state'-'stale_reasons'-'superseded_by_artifact_id'-'state_changed_at')
    is distinct from (to_jsonb(old)-'state'-'stale_reasons'-'superseded_by_artifact_id'-'state_changed_at') then
    raise exception 'Rendered artifact content and lineage are immutable.' using errcode='42501';
  end if;
  return new;
end $$;
create trigger protect_reportiq_artifact_history before update on public.reportiq_artifacts
for each row execute function public.protect_reportiq_artifact_history();

alter table public.background_jobs enable row level security;
alter table public.reportiq_artifacts enable row level security;
create policy "background jobs workspace read" on public.background_jobs
  for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "report artifacts workspace read" on public.reportiq_artifacts
  for select to authenticated using (public.is_workspace_member(workspace_id));
revoke all on public.background_jobs,public.reportiq_artifacts from anon,authenticated;
grant select on public.background_jobs,public.reportiq_artifacts to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('report-artifacts','report-artifacts',false,52428800,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create table public.reportiq_renderers (
  renderer_version text primary key,
  available boolean not null default false,
  activated_at timestamptz,
  check (length(renderer_version) between 1 and 100)
);
alter table public.reportiq_renderers enable row level security;
revoke all on public.reportiq_renderers from anon,authenticated;

create table public.reportiq_templates (
  report_type text not null check (report_type in ('full_due_diligence','buyer_summary','questions_all','questions_grouped','role_export')),
  template_version text not null,
  available boolean not null default true,
  primary key (report_type,template_version),
  check (length(template_version) between 1 and 100)
);
alter table public.reportiq_templates enable row level security;
revoke all on public.reportiq_templates from anon,authenticated;

create view public.contractiq_report_definition_lineage with (security_invoker=true) as
select f.id as definition_id,f.workspace_id,f.deal_id,f.property_id,f.contract_id,f.perspective,
  'full_due_diligence'::text as report_type,null::text as selected_role,
  f.snapshot_id,f.snapshot_version,f.analysis_version,f.report_definition_version as definition_version,
  f.deterministic_definition_hash as definition_hash,f.template_contract_version as template_version,
  f.source_cutoff_at,f.recommendation_state,f.report_state as definition_state,f.is_current
from public.contractiq_full_report_definitions f
union all
select s.id,s.workspace_id,s.deal_id,s.property_id,s.contract_id,s.perspective,
  'buyer_summary'::text,null::text,s.snapshot_id,s.snapshot_version,s.analysis_version,
  s.summary_definition_version,s.deterministic_definition_hash,s.template_version,
  s.source_cutoff_at,s.recommendation_state,s.summary_state,s.is_current
from public.contractiq_buyer_summary_definitions s
union all
select q.id,q.workspace_id,q.deal_id,q.property_id,q.contract_id,q.perspective,
  case q.report_mode when 'all_questions' then 'questions_all' when 'grouped_by_role' then 'questions_grouped' else 'role_export' end,
  q.selected_role,q.snapshot_id,q.snapshot_version,q.analysis_version,q.report_definition_version,
  q.deterministic_definition_hash,q.template_version,q.source_cutoff_at,
  snap.recommendation_state,q.report_state,q.is_current
from public.contractiq_questions_report_definitions q
join public.contractiq_report_snapshots snap on snap.workspace_id=q.workspace_id and snap.id=q.snapshot_id;
grant select on public.contractiq_report_definition_lineage to authenticated;

create function public.request_contractiq_report_regeneration(
  target_definition_id uuid,target_report_type text,target_selected_role text,
  expected_definition_version integer,target_template_version text,target_renderer_version text,
  idempotency_key text,correlation_id uuid default gen_random_uuid()
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
#variable_conflict use_variable
declare
  def record;
  snap public.contractiq_report_snapshots%rowtype;
  target_contract public.contracts%rowtype;
  fingerprint text;
  existing public.background_jobs%rowtype;
  created public.background_jobs%rowtype;
  available_renderer boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode='42501'; end if;
  if nullif(btrim(idempotency_key),'') is null or length(idempotency_key)>200 then
    raise exception 'Valid idempotency key required.' using errcode='22023';
  end if;
  select * into def from public.contractiq_report_definition_lineage
    where definition_id=target_definition_id and report_type=target_report_type;
  if def.definition_id is null then raise exception 'Report definition unavailable.' using errcode='P0002'; end if;
  target_contract:=public.authorized_contract(def.contract_id);
  if target_contract.workspace_id<>def.workspace_id or target_contract.deal_id<>def.deal_id then
    raise exception 'Report context mismatch.' using errcode='42501';
  end if;
  if def.selected_role is distinct from target_selected_role or def.definition_version<>expected_definition_version then
    raise exception 'Report definition version or role changed.' using errcode='40001';
  end if;
  if not def.is_current or def.definition_state not in ('current','current_with_open_questions','current_with_conflicts','professional_review_recommended')
    or def.definition_hash is null then
    raise exception 'A current validated report definition is required.' using errcode='40001';
  end if;
  select * into snap from public.contractiq_report_snapshots where workspace_id=def.workspace_id and id=def.snapshot_id;
  if not snap.is_current or snap.reconciliation_status<>'reconciled'
    or snap.snapshot_state not in ('current','current_with_open_questions','current_with_conflicts','professional_review_recommended') then
    raise exception 'Report snapshot is stale.' using errcode='40001';
  end if;
  if not exists(select 1 from public.reportiq_templates t where t.report_type=target_report_type
      and t.template_version=target_template_version and t.available) then
    raise exception 'Report template is unavailable.' using errcode='22023';
  end if;
  select available into available_renderer from public.reportiq_renderers where renderer_version=target_renderer_version;
  if not coalesce(available_renderer,false) then
    raise exception 'Renderer is unavailable; no generation was queued.' using errcode='P0001';
  end if;
  fingerprint:=encode(extensions.digest(concat_ws('|',def.workspace_id,def.contract_id,target_report_type,
    def.perspective,coalesce(def.selected_role,''),def.definition_id,def.definition_hash,
    target_template_version,target_renderer_version),'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(fingerprint,0));
  select * into existing from public.background_jobs j where j.workspace_id=def.workspace_id and j.idempotency_key=idempotency_key for update;
  if existing.id is not null then
    if existing.request_fingerprint<>fingerprint then raise exception 'Retry key reused for different report input.' using errcode='23505'; end if;
    return jsonb_build_object('jobId',existing.id,'status',existing.status,'artifactId',existing.artifact_id,'reused',true);
  end if;
  select * into existing from public.background_jobs j where j.workspace_id=def.workspace_id and j.request_fingerprint=fingerprint for update;
  if existing.id is not null then
    return jsonb_build_object('jobId',existing.id,'status',existing.status,'artifactId',existing.artifact_id,'reused',true);
  end if;
  insert into public.background_jobs(workspace_id,deal_id,property_id,contract_id,job_type,report_type,perspective,
    selected_role,snapshot_id,definition_id,definition_version,definition_hash,template_version,renderer_version,
    request_fingerprint,idempotency_key,requested_by,correlation_id)
  values(def.workspace_id,def.deal_id,def.property_id,def.contract_id,'contractiq_report_render',target_report_type,
    def.perspective,def.selected_role,def.snapshot_id,def.definition_id,def.definition_version,def.definition_hash,
    target_template_version,target_renderer_version,fingerprint,idempotency_key,auth.uid(),correlation_id)
  returning * into created;
  insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,
    entity_version,source_command,idempotency_key,correlation_id,payload)
  values(def.workspace_id,def.deal_id,def.property_id,auth.uid(),'contractiq.report_regeneration_requested',
    'background_job',created.id,def.definition_version,'request_contractiq_report_regeneration',idempotency_key,
    correlation_id,jsonb_build_object('jobId',created.id,'definitionId',def.definition_id,'reportType',target_report_type));
  insert into public.audit_events(workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,
    source_command,idempotency_key,correlation_id,metadata)
  values(def.workspace_id,def.deal_id,def.property_id,auth.uid(),'reportiq.regeneration_requested','background_jobs',
    'background_job',created.id,'request_contractiq_report_regeneration',idempotency_key,correlation_id,
    jsonb_build_object('definitionId',def.definition_id,'snapshotId',def.snapshot_id,'reportType',target_report_type));
  return jsonb_build_object('jobId',created.id,'status',created.status,'artifactId',null,'reused',false);
end $$;
revoke execute on function public.request_contractiq_report_regeneration(uuid,text,text,integer,text,text,text,uuid) from public,anon;
grant execute on function public.request_contractiq_report_regeneration(uuid,text,text,integer,text,text,text,uuid) to authenticated;

create function public.reportiq_start_generation(target_job_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j public.background_jobs%rowtype; def record; snap public.contractiq_report_snapshots%rowtype;
begin
  select * into j from public.background_jobs where id=target_job_id for update;
  if j.id is null then raise exception 'Report job unavailable.' using errcode='P0002'; end if;
  if j.status not in ('queued','retrying') then
    return jsonb_build_object('jobId',j.id,'status',j.status,'reused',true);
  end if;
  select * into def from public.contractiq_report_definition_lineage
    where workspace_id=j.workspace_id and definition_id=j.definition_id and report_type=j.report_type;
  select * into snap from public.contractiq_report_snapshots where workspace_id=j.workspace_id and id=j.snapshot_id;
  if def.definition_id is null or not def.is_current or def.definition_hash<>j.definition_hash
    or def.definition_state not in ('current','current_with_open_questions','current_with_conflicts','professional_review_recommended')
    or snap.id is null or not snap.is_current or snap.reconciliation_status<>'reconciled' then
    update public.background_jobs set status='blocked',failure_code='definition_stale',failure_retryable=false,
      completed_at=now() where id=j.id;
    return jsonb_build_object('jobId',j.id,'status','blocked','failureCode','definition_stale');
  end if;
  update public.background_jobs set status='running',attempt_count=attempt_count+1,started_at=now(),heartbeat_at=now(),
    failure_code=null,failure_retryable=null,next_retry_at=null where id=j.id;
  insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,actor_type,event_type,entity_type,entity_id,
    source_command,idempotency_key,correlation_id,payload)
  values(j.workspace_id,j.deal_id,j.property_id,null,'system','reportiq.artifact_generation_started','background_job',j.id,
    'reportiq_start_generation',j.id::text || ':start:' || (j.attempt_count+1),j.correlation_id,
    jsonb_build_object('jobId',j.id,'attempt',j.attempt_count+1));
  return jsonb_build_object('jobId',j.id,'status','running','attempt',j.attempt_count+1);
end $$;
revoke execute on function public.reportiq_start_generation(uuid) from public,anon,authenticated;
grant execute on function public.reportiq_start_generation(uuid) to service_role;

create function public.reportiq_finish_generation(
  target_job_id uuid,result_storage_path text,result_file_hash text,result_mime_type text,
  result_size_bytes bigint,result_failure_code text default null,result_retryable boolean default false
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  j public.background_jobs%rowtype;
  def record;
  snap public.contractiq_report_snapshots%rowtype;
  prior public.reportiq_artifacts%rowtype;
  created public.reportiq_artifacts%rowtype;
  valid_lineage boolean;
  file_found boolean;
  failure text;
begin
  select * into j from public.background_jobs where id=target_job_id for update;
  if j.id is null then raise exception 'Report job unavailable.' using errcode='P0002'; end if;
  if j.status='completed' then return jsonb_build_object('jobId',j.id,'status',j.status,'artifactId',j.artifact_id,'reused',true); end if;
  if j.status<>'running' then raise exception 'Report job is not running.' using errcode='40001'; end if;
  failure:=nullif(btrim(result_failure_code),'');
  if failure is null then
    if result_storage_path is null or result_file_hash !~ '^[0-9a-f]{64}$'
      or result_mime_type not in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      or result_size_bytes is null or result_size_bytes<1 or result_size_bytes>52428800 then
      failure:='invalid_artifact_metadata';
    else
      select exists(select 1 from storage.objects o where o.bucket_id='report-artifacts' and o.name=result_storage_path)
        into file_found;
      if not file_found then failure:='storage_object_missing'; end if;
    end if;
  end if;
  if failure is not null then
    update public.background_jobs set status='failed',failure_code=left(failure,100),
      failure_retryable=result_retryable and failure in ('storage_object_missing','storage_unavailable','renderer_timeout'),
      completed_at=now() where id=j.id;
    update public.reportiq_artifacts a set state='failed_with_prior_valid_artifact',
      stale_reasons=array(select distinct x from unnest(a.stale_reasons || array['generation_failed']) x),state_changed_at=now()
    where a.workspace_id=j.workspace_id and a.contract_id=j.contract_id and a.report_type=j.report_type
      and a.perspective=j.perspective and a.selected_role is not distinct from j.selected_role and a.state='stale';
    insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,actor_type,event_type,entity_type,entity_id,
      source_command,idempotency_key,correlation_id,payload)
    values(j.workspace_id,j.deal_id,j.property_id,null,'system','reportiq.artifact_generation_failed','background_job',j.id,
      'reportiq_finish_generation',j.id::text || ':fail:' || j.attempt_count,j.correlation_id,
      jsonb_build_object('jobId',j.id,'failureCode',failure,'attempt',j.attempt_count));
    return jsonb_build_object('jobId',j.id,'status','failed','failureCode',failure,'retryable',result_retryable);
  end if;
  select * into def from public.contractiq_report_definition_lineage
    where workspace_id=j.workspace_id and definition_id=j.definition_id and report_type=j.report_type;
  select * into snap from public.contractiq_report_snapshots where workspace_id=j.workspace_id and id=j.snapshot_id;
  valid_lineage:=coalesce(def.definition_id is not null and def.is_current and def.definition_hash=j.definition_hash
    and def.definition_version=j.definition_version and def.snapshot_id=j.snapshot_id
    and def.definition_state in ('current','current_with_open_questions','current_with_conflicts','professional_review_recommended')
    and snap.id is not null and snap.is_current and snap.reconciliation_status='reconciled',false);
  if valid_lineage then
    select * into prior from public.reportiq_artifacts a where a.workspace_id=j.workspace_id and a.contract_id=j.contract_id
      and a.report_type=j.report_type and a.perspective=j.perspective
      and a.selected_role is not distinct from j.selected_role and a.state='current' for update;
    if prior.id is not null then
      update public.reportiq_artifacts set state='superseded',stale_reasons=array['new_artifact_generated'],
        state_changed_at=now() where id=prior.id;
    end if;
  end if;
  insert into public.reportiq_artifacts(workspace_id,deal_id,property_id,contract_id,job_id,report_type,perspective,
    selected_role,snapshot_id,snapshot_version,analysis_version,definition_id,definition_version,definition_hash,
    template_version,renderer_version,file_hash,source_cutoff_at,storage_bucket,storage_path,mime_type,size_bytes,
    state,stale_reasons)
  values(j.workspace_id,j.deal_id,j.property_id,j.contract_id,j.id,j.report_type,j.perspective,j.selected_role,
    j.snapshot_id,snap.snapshot_version,snap.analysis_run_version,j.definition_id,j.definition_version,j.definition_hash,
    j.template_version,j.renderer_version,result_file_hash,def.source_cutoff_at,'report-artifacts',result_storage_path,
    result_mime_type,result_size_bytes,case when valid_lineage then 'current' else 'superseded' end,
    case when valid_lineage then '{}'::text[] else array['completed_from_stale_definition'] end)
  returning * into created;
  if prior.id is not null then
    update public.reportiq_artifacts set superseded_by_artifact_id=created.id where id=prior.id;
  end if;
  update public.background_jobs set status='completed',artifact_id=created.id,completed_at=now(),
    failure_code=case when valid_lineage then null else 'completed_from_stale_definition' end where id=j.id;
  insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,actor_type,event_type,entity_type,entity_id,
    source_command,idempotency_key,correlation_id,payload)
  values(j.workspace_id,j.deal_id,j.property_id,null,'system','reportiq.artifact_generated','reportiq_artifact',created.id,
    'reportiq_finish_generation',j.id::text || ':complete',j.correlation_id,
    jsonb_build_object('jobId',j.id,'artifactId',created.id,'current',valid_lineage,'priorArtifactId',prior.id));
  if prior.id is not null then
    insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,actor_type,event_type,entity_type,entity_id,
      source_command,idempotency_key,correlation_id,payload)
    values(j.workspace_id,j.deal_id,j.property_id,null,'system','reportiq.artifact_superseded','reportiq_artifact',prior.id,
      'reportiq_finish_generation',j.id::text || ':supersede',j.correlation_id,
      jsonb_build_object('priorArtifactId',prior.id,'newArtifactId',created.id));
  end if;
  insert into public.audit_events(workspace_id,deal_id,property_id,actor_id,actor_type,action,target_table,target_type,target_id,
    source_command,idempotency_key,correlation_id,metadata)
  values(j.workspace_id,j.deal_id,j.property_id,null,'system','reportiq.artifact_generation_completed',
    'reportiq_artifacts','reportiq_artifact',created.id,'reportiq_finish_generation',j.id::text || ':complete',j.correlation_id,
    jsonb_build_object('jobId',j.id,'definitionId',j.definition_id,'priorArtifactId',prior.id,'current',valid_lineage));
  return jsonb_build_object('jobId',j.id,'status','completed','artifactId',created.id,'current',valid_lineage);
end $$;
revoke execute on function public.reportiq_finish_generation(uuid,text,text,text,bigint,text,boolean) from public,anon,authenticated;
grant execute on function public.reportiq_finish_generation(uuid,text,text,text,bigint,text,boolean) to service_role;

create function public.retry_contractiq_report_generation(target_job_id uuid,idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j public.background_jobs%rowtype; target_contract public.contracts%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required.' using errcode='42501'; end if;
  if nullif(btrim(idempotency_key),'') is null then raise exception 'Retry key required.' using errcode='22023'; end if;
  select * into j from public.background_jobs where id=target_job_id for update;
  if j.id is null then raise exception 'Report job unavailable.' using errcode='P0002'; end if;
  target_contract:=public.authorized_contract(j.contract_id);
  if target_contract.workspace_id<>j.workspace_id then raise exception 'Report context mismatch.' using errcode='42501'; end if;
  if j.status in ('queued','running','retrying','completed') then
    return jsonb_build_object('jobId',j.id,'status',j.status,'reused',true);
  end if;
  if j.status<>'failed' or not coalesce(j.failure_retryable,false) or j.attempt_count>=j.max_attempts then
    raise exception 'This report generation cannot be retried.' using errcode='40001';
  end if;
  update public.background_jobs set status='retrying',next_retry_at=now(),failure_code=null,
    failure_retryable=null,completed_at=null where id=j.id;
  insert into public.audit_events(workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,
    source_command,idempotency_key,correlation_id,metadata)
  values(j.workspace_id,j.deal_id,j.property_id,auth.uid(),'reportiq.generation_retried','background_jobs','background_job',j.id,
    'retry_contractiq_report_generation',idempotency_key,j.correlation_id,jsonb_build_object('attempt',j.attempt_count+1));
  return jsonb_build_object('jobId',j.id,'status','retrying','reused',false);
end $$;
revoke execute on function public.retry_contractiq_report_generation(uuid,text) from public,anon;
grant execute on function public.retry_contractiq_report_generation(uuid,text) to authenticated;

create function public.stale_reportiq_artifacts_on_definition_change()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare reason text; report_kind text;
begin
  if tg_table_name='contractiq_full_report_definitions' then
    report_kind:='full_due_diligence';
    if new.is_current and new.report_state='current' then return new; end if;
    if old.is_current is not true and old.report_state not in ('current') then return new; end if;
    reason:=coalesce(new.stale_reason,'definition_superseded');
  elsif tg_table_name='contractiq_buyer_summary_definitions' then
    report_kind:='buyer_summary';
    if new.is_current and new.summary_state in ('current','current_with_open_questions','current_with_conflicts','professional_review_recommended') then return new; end if;
    if old.is_current is not true then return new; end if;
    reason:=coalesce(new.stale_reason,'definition_superseded');
  else
    report_kind:=case new.report_mode when 'all_questions' then 'questions_all'
      when 'grouped_by_role' then 'questions_grouped' else 'role_export' end;
    if new.is_current and new.report_state in ('current','current_with_open_questions','professional_review_recommended') then return new; end if;
    if old.is_current is not true then return new; end if;
    reason:=coalesce(new.stale_reason,'definition_superseded');
  end if;
  update public.reportiq_artifacts a set state='stale',
    stale_reasons=array(select distinct x from unnest(a.stale_reasons || array[reason]) x),state_changed_at=now()
  where a.workspace_id=new.workspace_id and a.definition_id=new.id and a.report_type=report_kind and a.state='current';
  return new;
end $$;
create trigger stale_full_artifacts after update of report_state,is_current on public.contractiq_full_report_definitions
for each row execute function public.stale_reportiq_artifacts_on_definition_change();
create trigger stale_summary_artifacts after update of summary_state,is_current on public.contractiq_buyer_summary_definitions
for each row execute function public.stale_reportiq_artifacts_on_definition_change();
create trigger stale_question_artifacts after update of report_state,is_current on public.contractiq_questions_report_definitions
for each row execute function public.stale_reportiq_artifacts_on_definition_change();

create function public.stale_contractiq_definitions_on_snapshot_change()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if new.snapshot_state<>'superseded' and new.reconciliation_status='reconciled' then return new; end if;
  if old.is_current is not true then return new; end if;
  update public.contractiq_questions_report_definitions set report_state='stale',is_current=false,
    reconciliation_state='stale',stale_reason=coalesce(new.stale_reason,'snapshot_superseded')
  where workspace_id=new.workspace_id and snapshot_id=new.id and is_current;
  return new;
end $$;
create trigger stale_contractiq_definitions_on_snapshot_change
after update of snapshot_state,is_current,reconciliation_status on public.contractiq_report_snapshots
for each row execute function public.stale_contractiq_definitions_on_snapshot_change();

create function public.stale_contractiq_definitions_on_question_change()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare q public.contract_questions%rowtype; prior_role text; reason text;
begin
  if tg_op='UPDATE' then
    if (to_jsonb(new)-'version'-'updated_at'-'updated_by') is not distinct from
      (to_jsonb(old)-'version'-'updated_at'-'updated_by') then return new; end if;
    q:=new; prior_role:=old.recipient_role;
    reason:=case when new.status in ('resolved','accepted') and old.status not in ('resolved','accepted')
      then 'question_resolved' else 'question_changed' end;
  else
    q:=new; reason:='question_changed';
  end if;
  update public.contractiq_questions_report_definitions d set report_state='stale',is_current=false,stale_reason=reason
  where d.workspace_id=q.workspace_id and d.contract_id=q.contract_id and d.is_current
    and (d.report_mode<>'selected_role' or d.selected_role in (q.recipient_role,prior_role)
      or exists(select 1 from jsonb_array_elements(d.canonical_question_refs) ref where ref->>'questionId'=q.id::text));
  update public.contractiq_full_report_definitions d set report_state='stale',is_current=false,stale_reason=reason
  where d.workspace_id=q.workspace_id and d.contract_id=q.contract_id and d.is_current
    and exists(select 1 from jsonb_array_elements(d.question_references) ref where ref->>'questionId'=q.id::text);
  return new;
end $$;
create trigger stale_contractiq_definitions_on_question_update after update on public.contract_questions
for each row execute function public.stale_contractiq_definitions_on_question_change();
create trigger stale_contractiq_definitions_on_question_insert after insert on public.contract_questions
for each row execute function public.stale_contractiq_definitions_on_question_change();

create view public.reportiq_artifact_history_projection with (security_invoker=true) as
select a.id as artifact_id,a.workspace_id,a.deal_id,a.property_id,a.contract_id,a.report_type,a.perspective,
  a.selected_role,a.snapshot_id,a.snapshot_version,a.analysis_version,a.definition_id,a.definition_version,
  a.definition_hash,a.template_version,a.renderer_version,a.file_hash,a.source_cutoff_at,a.storage_bucket,
  a.storage_path,a.mime_type,a.size_bytes,a.state,a.stale_reasons,a.superseded_by_artifact_id,a.generated_at,
  a.job_id,j.status as job_status,j.failure_code as generation_failure_code
from public.reportiq_artifacts a
join public.background_jobs j on j.workspace_id=a.workspace_id and j.id=a.job_id;
grant select on public.reportiq_artifact_history_projection to authenticated;

create view public.reportiq_current_artifact_projection with (security_invoker=true) as
select d.workspace_id,d.deal_id,d.property_id,d.contract_id,d.report_type,d.perspective,d.selected_role,
  d.definition_id,d.definition_version,d.snapshot_id,d.snapshot_version,d.definition_hash,
  d.definition_state,d.is_current as definition_is_current,
  current_artifact.id as current_artifact_id,current_artifact.generated_at as current_generated_at,
  current_artifact.template_version as current_template_version,current_artifact.renderer_version as current_renderer_version,
  prior_artifact.id as prior_valid_artifact_id,prior_artifact.state as prior_valid_state,
  prior_artifact.stale_reasons as stale_reasons,
  latest_job.id as latest_job_id,latest_job.status as latest_job_status,
  latest_job.failure_code as latest_failure_code,
  (d.is_current and d.definition_state in ('current','current_with_open_questions','current_with_conflicts','professional_review_recommended'))
    as regeneration_available
from public.contractiq_report_definition_lineage d
left join lateral (
  select a.* from public.reportiq_artifacts a where a.workspace_id=d.workspace_id and a.contract_id=d.contract_id
    and a.report_type=d.report_type and a.perspective=d.perspective
    and a.selected_role is not distinct from d.selected_role and a.state='current' limit 1
) current_artifact on true
left join lateral (
  select a.* from public.reportiq_artifacts a where a.workspace_id=d.workspace_id and a.contract_id=d.contract_id
    and a.report_type=d.report_type and a.perspective=d.perspective
    and a.selected_role is not distinct from d.selected_role and a.state<>'revoked'
  order by a.generated_at desc,a.id desc limit 1
) prior_artifact on true
left join lateral (
  select j.* from public.background_jobs j where j.workspace_id=d.workspace_id and j.contract_id=d.contract_id
    and j.report_type=d.report_type and j.perspective=d.perspective
    and j.selected_role is not distinct from d.selected_role
  order by j.requested_at desc,j.id desc limit 1
) latest_job on true
where d.is_current or d.definition_id=prior_artifact.definition_id;
grant select on public.reportiq_current_artifact_projection to authenticated;

create view public.reportiq_family_reconciliation_projection with (security_invoker=true) as
select f.workspace_id,f.deal_id,f.property_id,f.contract_id,f.perspective,
  f.id as full_definition_id,s.id as summary_definition_id,
  fa.id as full_artifact_id,sa.id as summary_artifact_id,
  case
    when fa.id is not null and sa.id is not null and f.snapshot_id=s.snapshot_id
      and f.analysis_version=s.analysis_version and f.source_cutoff_at=s.source_cutoff_at
      and f.recommendation_state is not distinct from s.recommendation_state
      and fa.snapshot_id=sa.snapshot_id and fa.analysis_version=sa.analysis_version
      and fa.source_cutoff_at=sa.source_cutoff_at then 'aligned'
    when fa.id is not null and sa.id is not null then 'inconsistent_blocked'
    when exists(select 1 from public.background_jobs j where j.workspace_id=f.workspace_id and j.contract_id=f.contract_id
      and j.report_type in ('full_due_diligence','buyer_summary') and j.status in ('queued','running','retrying'))
      then 'regeneration_in_progress'
    when exists(select 1 from public.background_jobs j where j.workspace_id=f.workspace_id and j.contract_id=f.contract_id
      and j.report_type in ('full_due_diligence','buyer_summary') and j.status='failed')
      then 'failed_with_prior_valid'
    else 'partially_stale' end as alignment_state
from public.contractiq_full_report_definitions f
left join public.contractiq_buyer_summary_definitions s on s.workspace_id=f.workspace_id
  and s.full_report_definition_id=f.id and s.is_current
left join public.reportiq_artifacts fa on fa.workspace_id=f.workspace_id and fa.definition_id=f.id and fa.state='current'
left join public.reportiq_artifacts sa on sa.workspace_id=s.workspace_id and sa.definition_id=s.id and sa.state='current'
where f.is_current;
grant select on public.reportiq_family_reconciliation_projection to authenticated;

create function public.stale_contractiq_reports_on_material_source()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare
  current_row jsonb:=to_jsonb(new);
  prior_row jsonb;
  source_id text;
  linked_id text;
  reason text;
  changed_snapshot record;
begin
  if tg_op='UPDATE' then
    prior_row:=to_jsonb(old);
    if (current_row-'version'-'updated_at'-'updated_by'-'last_reconciled_at') is not distinct from
      (prior_row-'version'-'updated_at'-'updated_by'-'last_reconciled_at') then return new; end if;
  end if;
  if tg_table_name='contract_terms' and
    (current_row->>'proposal_state'<>'accepted' or current_row->>'materiality' in ('immaterial','informational')) then
    return new;
  end if;
  if tg_table_name='contract_analysis_runs' and current_row->>'analysis_state' not in ('current','stale') then return new; end if;
  source_id:=current_row->>'id';
  linked_id:=case when tg_table_name='contract_deadline_results' then current_row->>'contract_deadline_id' else source_id end;
  reason:=case tg_table_name
    when 'contract_terms' then 'source_changed'
    when 'contract_deadlines' then 'deadline_changed'
    when 'contract_deadline_results' then 'deadline_changed'
    when 'contract_conflicts' then 'conflict_changed'
    when 'contract_evidence_links' then 'source_changed'
    when 'contract_analysis_runs' then 'recommendation_changed'
    else 'source_changed' end;
  for changed_snapshot in
    update public.contractiq_report_snapshots s set snapshot_state='stale',is_current=false,
      stale_reason=reason,updated_at=now()
    where s.workspace_id=(current_row->>'workspace_id')::uuid and s.contract_id=(current_row->>'contract_id')::uuid
      and s.is_current
    returning s.id,s.workspace_id,s.deal_id,s.property_id,s.snapshot_version,s.correlation_id
  loop
    insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,actor_type,event_type,entity_type,
      entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
    values(changed_snapshot.workspace_id,changed_snapshot.deal_id,changed_snapshot.property_id,null,'system',
      'contractiq.report_snapshot_stale','contractiq_report_snapshot',changed_snapshot.id,changed_snapshot.snapshot_version,
      'material_source_change','material-source:' || changed_snapshot.id || ':' || tg_table_name || ':' || source_id,
      changed_snapshot.correlation_id,jsonb_build_object('snapshotId',changed_snapshot.id,'sourceId',source_id,'reason',reason));
  end loop;
  if tg_table_name in ('contract_terms','contract_deadlines','contract_deadline_results','contract_findings',
    'contract_conflicts','contract_evidence_links') then
    update public.contractiq_questions_report_definitions d set report_state='stale',is_current=false,
      reconciliation_state='stale',stale_reason=reason
    where d.workspace_id=(current_row->>'workspace_id')::uuid and d.contract_id=(current_row->>'contract_id')::uuid
      and d.is_current and exists(
        select 1 from jsonb_array_elements(d.canonical_question_refs) ref
        where (tg_table_name in ('contract_deadlines','contract_deadline_results') and
          coalesce(ref->'relevantDeadlineIds','[]'::jsonb) ? linked_id)
          or exists(select 1 from public.contract_questions q
            where q.workspace_id=d.workspace_id and q.contract_id=d.contract_id and q.id::text=ref->>'questionId'
              and ((tg_table_name='contract_terms' and q.contract_term_id::text=linked_id)
                or (tg_table_name='contract_findings' and q.contract_finding_id::text=linked_id)
                or (tg_table_name='contract_conflicts' and q.contract_conflict_id::text=linked_id)
                or (tg_table_name='contract_evidence_links' and q.source_evidence_id::text=current_row->>'evidence_id')))
      );
  end if;
  return new;
end $$;
create trigger stale_reports_on_term after insert or update on public.contract_terms
for each row execute function public.stale_contractiq_reports_on_material_source();
create trigger stale_reports_on_deadline after insert or update on public.contract_deadlines
for each row execute function public.stale_contractiq_reports_on_material_source();
create trigger stale_reports_on_deadline_result after insert or update on public.contract_deadline_results
for each row execute function public.stale_contractiq_reports_on_material_source();
create trigger stale_reports_on_finding after insert or update on public.contract_findings
for each row execute function public.stale_contractiq_reports_on_material_source();
create trigger stale_reports_on_conflict after insert or update on public.contract_conflicts
for each row execute function public.stale_contractiq_reports_on_material_source();
create trigger stale_reports_on_evidence_link after insert or update on public.contract_evidence_links
for each row execute function public.stale_contractiq_reports_on_material_source();
create trigger stale_reports_on_relationship after insert or update on public.contract_relationships
for each row execute function public.stale_contractiq_reports_on_material_source();
create trigger stale_reports_on_analysis after insert or update on public.contract_analysis_runs
for each row execute function public.stale_contractiq_reports_on_material_source();

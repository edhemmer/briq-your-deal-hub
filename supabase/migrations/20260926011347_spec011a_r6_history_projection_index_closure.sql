create index background_jobs_artifact_fk_idx on public.background_jobs(workspace_id,artifact_id)
  where artifact_id is not null;
create index background_jobs_perspective_fk_idx on public.background_jobs(perspective);
create index background_jobs_selected_role_fk_idx on public.background_jobs(selected_role)
  where selected_role is not null;
create index reportiq_artifacts_perspective_fk_idx on public.reportiq_artifacts(perspective);
create index reportiq_artifacts_selected_role_fk_idx on public.reportiq_artifacts(selected_role)
  where selected_role is not null;

create or replace view public.reportiq_family_reconciliation_projection with (security_invoker=true) as
with latest_full as (
  select distinct on (f.workspace_id,f.contract_id,f.perspective) f.*
  from public.contractiq_full_report_definitions f
  order by f.workspace_id,f.contract_id,f.perspective,f.report_definition_version desc
)
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
from latest_full f
left join public.contractiq_buyer_summary_definitions s on s.workspace_id=f.workspace_id
  and s.full_report_definition_id=f.id and s.is_current
left join public.reportiq_artifacts fa on fa.workspace_id=f.workspace_id and fa.definition_id=f.id and fa.state='current'
left join public.reportiq_artifacts sa on sa.workspace_id=s.workspace_id and sa.definition_id=s.id and sa.state='current';

create function public.record_reportiq_artifact_staleness()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if old.state='current' and new.state='stale' then
    insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,actor_type,event_type,entity_type,
      entity_id,source_command,idempotency_key,payload)
    values(new.workspace_id,new.deal_id,new.property_id,null,'system','reportiq.artifact_marked_stale',
      'reportiq_artifact',new.id,'reportiq_artifact_state_change','artifact-stale:' || new.id,
      jsonb_build_object('artifactId',new.id,'definitionId',new.definition_id,'reasons',to_jsonb(new.stale_reasons)));
    insert into public.audit_events(workspace_id,deal_id,property_id,actor_id,actor_type,action,target_table,
      target_type,target_id,source_command,idempotency_key,metadata)
    values(new.workspace_id,new.deal_id,new.property_id,null,'system','reportiq.artifact_marked_stale',
      'reportiq_artifacts','reportiq_artifact',new.id,'reportiq_artifact_state_change','artifact-stale:' || new.id,
      jsonb_build_object('definitionId',new.definition_id,'reasons',to_jsonb(new.stale_reasons)));
  end if;
  return new;
end $$;
create trigger record_reportiq_artifact_staleness after update of state on public.reportiq_artifacts
for each row execute function public.record_reportiq_artifact_staleness();

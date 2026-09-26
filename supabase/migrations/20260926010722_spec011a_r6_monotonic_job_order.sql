create function public.order_reportiq_generation_job()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare previous_requested_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(concat_ws('|',new.workspace_id,new.contract_id,
    new.report_type,new.perspective,coalesce(new.selected_role,'')),0));
  select max(j.requested_at) into previous_requested_at from public.background_jobs j
  where j.workspace_id=new.workspace_id and j.contract_id=new.contract_id
    and j.report_type=new.report_type and j.perspective=new.perspective
    and j.selected_role is not distinct from new.selected_role;
  new.requested_at:=greatest(clock_timestamp(),coalesce(previous_requested_at + interval '1 microsecond',clock_timestamp()));
  return new;
end $$;
create trigger order_reportiq_generation_job before insert on public.background_jobs
for each row execute function public.order_reportiq_generation_job();

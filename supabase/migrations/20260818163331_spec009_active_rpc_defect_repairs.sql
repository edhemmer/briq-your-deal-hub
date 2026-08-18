-- Spec 009 final gate: repair two active pre-existing RPC defects surfaced
-- after PL/pgSQL ambiguity hardening.

do $$
declare
  target_definition text;
begin
  target_definition := pg_get_functiondef('public.record_email_intake_result(uuid,text,jsonb,jsonb,jsonb)'::regprocedure);
  target_definition := replace(
    target_definition,
    E'\n      email_body_hash,\n      plain_text_body,\n',
    E'\n      body_hash,\n      plain_text_body,\n'
  );

  execute target_definition;
end;
$$;

create or replace function public.list_deal_work(target_deal_id uuid)
returns table (
  record_type text,
  record_id uuid,
  record_version integer,
  workspace_id uuid,
  deal_id uuid,
  title text,
  body text,
  status text,
  priority text,
  work_type text,
  due_at timestamptz,
  due_date date,
  is_all_day boolean,
  timezone text,
  source_type text,
  source_record_id uuid,
  verification_state text,
  completed_at timestamptz,
  archived_at timestamptz,
  pinned boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  target_deal public.brix_deals%rowtype;
begin
  target_deal := public.get_authorized_deal(target_deal_id);
  return query
  select
    work.record_type,
    work.record_id,
    work.record_version,
    work.workspace_id,
    work.deal_id,
    work.title,
    work.body,
    work.status,
    work.priority,
    work.work_type,
    work.due_at,
    work.due_date,
    work.is_all_day,
    work.timezone,
    work.source_type,
    work.source_record_id,
    work.verification_state,
    work.completed_at,
    work.archived_at,
    work.pinned,
    work.created_at,
    work.updated_at
  from (
    select
      'task'::text as record_type,
      task.id as record_id,
      task.version as record_version,
      task.workspace_id,
      task.deal_id,
      task.title,
      task.description as body,
      task.status,
      task.priority,
      task.task_type as work_type,
      task.due_at,
      task.due_date,
      task.is_all_day,
      task.timezone,
      task.source_type,
      task.source_record_id,
      null::text as verification_state,
      task.completed_at,
      task.archived_at,
      false as pinned,
      task.created_at,
      task.updated_at,
      coalesce(task.due_at, task.due_date::timestamptz, task.updated_at) as sort_at
    from public.tasks task
    where task.deal_id = target_deal.id
      and task.workspace_id = target_deal.workspace_id
      and task.archived_at is null
    union all
    select
      'deadline'::text as record_type,
      deadline.id as record_id,
      deadline.version as record_version,
      deadline.workspace_id,
      deadline.deal_id,
      deadline.title,
      deadline.source_description as body,
      deadline.status,
      null::text as priority,
      'deadline'::text as work_type,
      deadline.due_at,
      deadline.due_date,
      deadline.is_all_day,
      deadline.timezone,
      deadline.source_type,
      deadline.source_record_id,
      deadline.verification_state,
      deadline.completed_at,
      deadline.archived_at,
      false as pinned,
      deadline.created_at,
      deadline.updated_at,
      coalesce(deadline.due_at, deadline.due_date::timestamptz, deadline.updated_at) as sort_at
    from public.deadlines deadline
    where deadline.deal_id = target_deal.id
      and deadline.workspace_id = target_deal.workspace_id
      and deadline.archived_at is null
  ) work
  order by work.sort_at asc, work.updated_at desc;
end;
$$;

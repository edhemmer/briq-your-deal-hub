-- Specification 003 slice 3: Tasks, Deadlines, Notes, Timeline, and Activity.
-- Legacy public.brix_tasks and public.brix_project_tasks are superseded by this
-- canonical Deal-scoped work system. They remain untouched for historical data.

create extension if not exists pgcrypto;

alter table public.domain_events add column if not exists deal_id uuid;
alter table public.audit_events add column if not exists deal_id uuid;

create index if not exists idx_domain_events_workspace_deal_created
  on public.domain_events(workspace_id, deal_id, created_at desc)
  where deal_id is not null;

create index if not exists idx_audit_events_workspace_deal_created
  on public.audit_events(workspace_id, deal_id, created_at desc)
  where deal_id is not null;

create table if not exists public.task_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.task_priority_definitions (
  priority_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.task_type_definitions (
  type_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.deadline_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.deadline_verification_state_definitions (
  state_key text primary key,
  label text not null,
  sort_order integer not null unique,
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.note_type_definitions (
  type_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

insert into public.task_status_definitions (status_key, label, sort_order, is_terminal)
values
  ('open', 'Open', 10, false),
  ('in_progress', 'In Progress', 20, false),
  ('blocked', 'Blocked', 30, false),
  ('completed', 'Completed', 40, true),
  ('cancelled', 'Cancelled', 50, true)
on conflict (status_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_terminal = excluded.is_terminal;

insert into public.task_priority_definitions (priority_key, label, sort_order)
values
  ('low', 'Low', 10),
  ('normal', 'Normal', 20),
  ('high', 'High', 30),
  ('urgent', 'Urgent', 40)
on conflict (priority_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

insert into public.task_type_definitions (type_key, label, sort_order)
values
  ('general', 'General', 10),
  ('verification', 'Verification', 20),
  ('research', 'Research', 30),
  ('visit', 'Visit', 40),
  ('offer', 'Offer', 50),
  ('contract', 'Contract', 60),
  ('financing', 'Financing', 70),
  ('due_diligence', 'Due Diligence', 80)
on conflict (type_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

insert into public.deadline_status_definitions (status_key, label, sort_order, is_terminal)
values
  ('open', 'Open', 10, false),
  ('changed', 'Changed', 20, false),
  ('completed', 'Completed', 30, true),
  ('cancelled', 'Cancelled', 40, true)
on conflict (status_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_terminal = excluded.is_terminal;

insert into public.deadline_verification_state_definitions (state_key, label, sort_order, requires_review)
values
  ('unverified', 'Unverified', 10, false),
  ('user_verified', 'User Verified', 20, false),
  ('source_verified', 'Source Verified', 30, false),
  ('professional_review_recommended', 'Professional Review Recommended', 40, true),
  ('rejected', 'Rejected', 50, true),
  ('superseded', 'Superseded', 60, false)
on conflict (state_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  requires_review = excluded.requires_review;

insert into public.note_type_definitions (type_key, label, sort_order)
values
  ('general', 'General', 10),
  ('call', 'Call', 20),
  ('visit', 'Visit', 30),
  ('research', 'Research', 40),
  ('decision', 'Decision', 50)
on conflict (type_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  title text not null,
  description text,
  task_type text not null default 'general' references public.task_type_definitions(type_key),
  status text not null default 'open' references public.task_status_definitions(status_key),
  priority text not null default 'normal' references public.task_priority_definitions(priority_key),
  due_at timestamptz,
  due_date date,
  is_all_day boolean not null default false,
  timezone text not null default 'UTC',
  source_type text not null default 'manual',
  source_record_id uuid,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint tasks_title_not_blank check (length(btrim(title)) > 0),
  constraint tasks_exactly_one_due_shape check (
    (is_all_day = true and due_at is null)
    or (is_all_day = false and due_date is null)
  ),
  constraint tasks_timezone_not_blank check (length(btrim(timezone)) > 0),
  constraint tasks_source_type_not_blank check (length(btrim(source_type)) > 0)
);

create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  title text not null,
  status text not null default 'open' references public.deadline_status_definitions(status_key),
  due_at timestamptz,
  due_date date,
  is_all_day boolean not null default false,
  timezone text not null default 'UTC',
  source_type text not null default 'manual',
  source_record_id uuid,
  source_term text,
  source_description text,
  trigger_date date,
  calculation_rule text,
  verification_state text not null default 'unverified' references public.deadline_verification_state_definitions(state_key),
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deadlines_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint deadlines_title_not_blank check (length(btrim(title)) > 0),
  constraint deadlines_need_due_value check (due_at is not null or due_date is not null),
  constraint deadlines_exactly_one_due_shape check (
    (is_all_day = true and due_date is not null and due_at is null)
    or (is_all_day = false and due_at is not null and due_date is null)
  ),
  constraint deadlines_timezone_not_blank check (length(btrim(timezone)) > 0),
  constraint deadlines_source_type_not_blank check (length(btrim(source_type)) > 0)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  body text not null,
  note_type text not null default 'general' references public.note_type_definitions(type_key),
  pinned boolean not null default false,
  source_type text not null default 'manual',
  source_record_id uuid,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint notes_body_not_blank check (length(btrim(body)) > 0),
  constraint notes_source_type_not_blank check (length(btrim(source_type)) > 0)
);

create table if not exists public.note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  version integer not null,
  body text not null,
  note_type text not null,
  pinned boolean not null default false,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  constraint note_versions_note_version_unique unique (note_id, version),
  constraint note_versions_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade
);

create table if not exists public.work_command_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid,
  command_name text not null,
  idempotency_key text not null,
  request_hash text not null,
  task_id uuid,
  deadline_id uuid,
  note_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index if not exists idx_tasks_workspace_deal_due
  on public.tasks(workspace_id, deal_id, due_at, due_date, updated_at desc)
  where archived_at is null;

create index if not exists idx_tasks_workspace_status
  on public.tasks(workspace_id, status, priority, updated_at desc)
  where archived_at is null;

create index if not exists idx_deadlines_workspace_deal_due
  on public.deadlines(workspace_id, deal_id, due_at, due_date, updated_at desc)
  where archived_at is null;

create index if not exists idx_deadlines_workspace_verification
  on public.deadlines(workspace_id, verification_state, updated_at desc)
  where archived_at is null;

create index if not exists idx_notes_workspace_deal_updated
  on public.notes(workspace_id, deal_id, pinned desc, updated_at desc)
  where archived_at is null;

create index if not exists idx_note_versions_note
  on public.note_versions(note_id, version desc);

create index if not exists idx_work_command_requests_created_by
  on public.work_command_requests(created_by, created_at desc);

drop trigger if exists touch_tasks on public.tasks;
create trigger touch_tasks before update on public.tasks
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_deadlines on public.deadlines;
create trigger touch_deadlines before update on public.deadlines
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_notes on public.notes;
create trigger touch_notes before update on public.notes
for each row execute function public.touch_versioned_record();

create or replace function public.record_note_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.body is distinct from new.body
    or old.note_type is distinct from new.note_type
    or old.pinned is distinct from new.pinned
  then
    insert into public.note_versions (note_id, workspace_id, deal_id, version, body, note_type, pinned, changed_by)
    values (old.id, old.workspace_id, old.deal_id, old.version, old.body, old.note_type, old.pinned, new.updated_by);
  end if;
  return new;
end;
$$;

drop trigger if exists record_note_version_on_update on public.notes;
create trigger record_note_version_on_update after update on public.notes
for each row execute function public.record_note_version();

alter table public.task_status_definitions enable row level security;
alter table public.task_priority_definitions enable row level security;
alter table public.task_type_definitions enable row level security;
alter table public.deadline_status_definitions enable row level security;
alter table public.deadline_verification_state_definitions enable row level security;
alter table public.note_type_definitions enable row level security;
alter table public.tasks enable row level security;
alter table public.deadlines enable row level security;
alter table public.notes enable row level security;
alter table public.note_versions enable row level security;
alter table public.work_command_requests enable row level security;

drop policy if exists "task definitions readable" on public.task_status_definitions;
create policy "task definitions readable" on public.task_status_definitions for select to authenticated using (true);
drop policy if exists "task priority definitions readable" on public.task_priority_definitions;
create policy "task priority definitions readable" on public.task_priority_definitions for select to authenticated using (true);
drop policy if exists "task type definitions readable" on public.task_type_definitions;
create policy "task type definitions readable" on public.task_type_definitions for select to authenticated using (true);
drop policy if exists "deadline status definitions readable" on public.deadline_status_definitions;
create policy "deadline status definitions readable" on public.deadline_status_definitions for select to authenticated using (true);
drop policy if exists "deadline verification definitions readable" on public.deadline_verification_state_definitions;
create policy "deadline verification definitions readable" on public.deadline_verification_state_definitions for select to authenticated using (true);
drop policy if exists "note type definitions readable" on public.note_type_definitions;
create policy "note type definitions readable" on public.note_type_definitions for select to authenticated using (true);

drop policy if exists "tasks read workspace members" on public.tasks;
create policy "tasks read workspace members" on public.tasks for select to authenticated
  using (public.is_workspace_member(workspace_id));
drop policy if exists "tasks no direct insert" on public.tasks;
create policy "tasks no direct insert" on public.tasks for insert to authenticated with check (false);
drop policy if exists "tasks no direct update" on public.tasks;
create policy "tasks no direct update" on public.tasks for update to authenticated using (false) with check (false);
drop policy if exists "tasks no direct delete" on public.tasks;
create policy "tasks no direct delete" on public.tasks for delete to authenticated using (false);

drop policy if exists "deadlines read workspace members" on public.deadlines;
create policy "deadlines read workspace members" on public.deadlines for select to authenticated
  using (public.is_workspace_member(workspace_id));
drop policy if exists "deadlines no direct insert" on public.deadlines;
create policy "deadlines no direct insert" on public.deadlines for insert to authenticated with check (false);
drop policy if exists "deadlines no direct update" on public.deadlines;
create policy "deadlines no direct update" on public.deadlines for update to authenticated using (false) with check (false);
drop policy if exists "deadlines no direct delete" on public.deadlines;
create policy "deadlines no direct delete" on public.deadlines for delete to authenticated using (false);

drop policy if exists "notes read workspace members" on public.notes;
create policy "notes read workspace members" on public.notes for select to authenticated
  using (public.is_workspace_member(workspace_id));
drop policy if exists "notes no direct insert" on public.notes;
create policy "notes no direct insert" on public.notes for insert to authenticated with check (false);
drop policy if exists "notes no direct update" on public.notes;
create policy "notes no direct update" on public.notes for update to authenticated using (false) with check (false);
drop policy if exists "notes no direct delete" on public.notes;
create policy "notes no direct delete" on public.notes for delete to authenticated using (false);

drop policy if exists "note versions read workspace members" on public.note_versions;
create policy "note versions read workspace members" on public.note_versions for select to authenticated
  using (public.is_workspace_member(workspace_id));
drop policy if exists "note versions no direct insert" on public.note_versions;
create policy "note versions no direct insert" on public.note_versions for insert to authenticated with check (false);
drop policy if exists "work command requests read creator" on public.work_command_requests;
create policy "work command requests read creator" on public.work_command_requests for select to authenticated
  using (created_by = auth.uid() and public.is_workspace_member(workspace_id));
drop policy if exists "work command requests no direct insert" on public.work_command_requests;
create policy "work command requests no direct insert" on public.work_command_requests for insert to authenticated with check (false);

create or replace function public.get_authorized_deal(target_deal_id uuid)
returns public.brix_deals
language plpgsql
security definer
set search_path = public
as $$
declare
  target_deal public.brix_deals%rowtype;
begin
  select * into target_deal from public.brix_deals where id = target_deal_id and deleted_at is null;
  if target_deal.id is null then
    raise exception 'Deal is not available.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(target_deal.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to manage work on this Deal.' using errcode = '42501';
  end if;

  return target_deal;
end;
$$;

create or replace function public.ensure_work_command(
  target_workspace_id uuid,
  target_deal_id uuid,
  command_name text,
  idempotency_key text,
  request_body jsonb
)
returns public.work_command_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  request_hash text;
  existing_request public.work_command_requests%rowtype;
begin
  if cleaned_key is null then
    raise exception 'A retry key is required to safely save Deal work.' using errcode = '22023';
  end if;

  request_hash := md5(target_workspace_id::text || ':' || target_deal_id::text || ':' || command_name || ':' || request_body::text);

  insert into public.work_command_requests (workspace_id, deal_id, command_name, idempotency_key, request_hash, created_by)
  values (target_workspace_id, target_deal_id, command_name, cleaned_key, request_hash, current_user_id)
  on conflict (workspace_id, idempotency_key) do nothing;

  select * into existing_request
  from public.work_command_requests
  where workspace_id = target_workspace_id and idempotency_key = cleaned_key;

  if existing_request.request_hash <> request_hash or existing_request.command_name <> command_name then
    raise exception 'This retry key was already used for different Deal work.' using errcode = '23505';
  end if;

  return existing_request;
end;
$$;

create or replace function public.create_deal_task(target_deal_id uuid, task_input jsonb, idempotency_key text)
returns table (task_id uuid, task_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_deal public.brix_deals%rowtype;
  command public.work_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to create a task.' using errcode = '42501'; end if;
  target_deal := public.get_authorized_deal(target_deal_id);
  command := public.ensure_work_command(target_deal.workspace_id, target_deal.id, 'create_deal_task', idempotency_key, task_input);
  if command.task_id is not null then
    select id, version into task_id, task_version from public.tasks where id = command.task_id;
    return next;
    return;
  end if;

  insert into public.tasks (workspace_id, deal_id, title, description, task_type, status, priority, due_at, due_date, is_all_day, timezone, source_type, source_record_id, created_by, updated_by)
  values (
    target_deal.workspace_id,
    target_deal.id,
    btrim(task_input ->> 'title'),
    nullif(btrim(task_input ->> 'description'), ''),
    coalesce(nullif(btrim(task_input ->> 'task_type'), ''), 'general'),
    coalesce(nullif(btrim(task_input ->> 'status'), ''), 'open'),
    coalesce(nullif(btrim(task_input ->> 'priority'), ''), 'normal'),
    nullif(task_input ->> 'due_at', '')::timestamptz,
    nullif(task_input ->> 'due_date', '')::date,
    coalesce((task_input ->> 'is_all_day')::boolean, false),
    coalesce(nullif(btrim(task_input ->> 'timezone'), ''), 'UTC'),
    coalesce(nullif(btrim(task_input ->> 'source_type'), ''), 'manual'),
    nullif(task_input ->> 'source_record_id', '')::uuid,
    current_user_id,
    current_user_id
  )
  returning id, version into task_id, task_version;

  update public.work_command_requests set task_id = create_deal_task.task_id where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (target_deal.workspace_id, target_deal.id, current_user_id, 'task.created', jsonb_build_object('task_id', task_id, 'task_version', task_version, 'title', btrim(task_input ->> 'title')));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (target_deal.workspace_id, target_deal.id, current_user_id, 'task.created', 'tasks', task_id, jsonb_build_object('task_version', task_version));
  return next;
end;
$$;

create or replace function public.update_deal_task(target_task_id uuid, task_input jsonb, expected_version integer default null)
returns table (task_id uuid, task_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_task public.tasks%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to update a task.' using errcode = '42501'; end if;
  select * into existing_task from public.tasks where id = target_task_id for update;
  if existing_task.id is null then raise exception 'Task is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_task.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update this task.' using errcode = '42501'; end if;
  if expected_version is not null and existing_task.version <> expected_version then raise exception 'This task changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.tasks set
    title = coalesce(nullif(btrim(task_input ->> 'title'), ''), title),
    description = case when task_input ? 'description' then nullif(btrim(task_input ->> 'description'), '') else description end,
    task_type = coalesce(nullif(btrim(task_input ->> 'task_type'), ''), task_type),
    status = coalesce(nullif(btrim(task_input ->> 'status'), ''), status),
    priority = coalesce(nullif(btrim(task_input ->> 'priority'), ''), priority),
    due_at = case when task_input ? 'due_at' then nullif(task_input ->> 'due_at', '')::timestamptz else due_at end,
    due_date = case when task_input ? 'due_date' then nullif(task_input ->> 'due_date', '')::date else due_date end,
    is_all_day = case when task_input ? 'is_all_day' then (task_input ->> 'is_all_day')::boolean else is_all_day end,
    timezone = coalesce(nullif(btrim(task_input ->> 'timezone'), ''), timezone),
    source_type = coalesce(nullif(btrim(task_input ->> 'source_type'), ''), source_type),
    source_record_id = case when task_input ? 'source_record_id' then nullif(task_input ->> 'source_record_id', '')::uuid else source_record_id end,
    completed_at = case when coalesce(nullif(btrim(task_input ->> 'status'), ''), status) = 'completed' then coalesce(completed_at, now()) else completed_at end,
    completed_by = case when coalesce(nullif(btrim(task_input ->> 'status'), ''), status) = 'completed' then coalesce(completed_by, current_user_id) else completed_by end,
    updated_by = current_user_id
  where id = target_task_id
  returning id, version into task_id, task_version;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (existing_task.workspace_id, existing_task.deal_id, current_user_id, 'task.updated', jsonb_build_object('task_id', task_id, 'task_version', task_version));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (existing_task.workspace_id, existing_task.deal_id, current_user_id, 'task.updated', 'tasks', task_id, jsonb_build_object('task_version', task_version));
  return next;
end;
$$;

create or replace function public.complete_deal_task(target_task_id uuid, expected_version integer default null)
returns table (task_id uuid, task_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  completed_task public.tasks%rowtype;
begin
  select updated.task_id, updated.task_version into task_id, task_version
  from public.update_deal_task(target_task_id, '{"status":"completed"}'::jsonb, expected_version) updated;

  select * into completed_task from public.tasks where id = task_id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (completed_task.workspace_id, completed_task.deal_id, current_user_id, 'task.completed', jsonb_build_object('task_id', task_id, 'task_version', task_version));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (completed_task.workspace_id, completed_task.deal_id, current_user_id, 'task.completed', 'tasks', task_id, jsonb_build_object('task_version', task_version));
  return next;
end;
$$;

create or replace function public.cancel_deal_task(target_task_id uuid, expected_version integer default null)
returns table (task_id uuid, task_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cancelled_task public.tasks%rowtype;
begin
  select updated.task_id, updated.task_version into task_id, task_version
  from public.update_deal_task(target_task_id, '{"status":"cancelled"}'::jsonb, expected_version) updated;

  select * into cancelled_task from public.tasks where id = task_id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (cancelled_task.workspace_id, cancelled_task.deal_id, current_user_id, 'task.cancelled', jsonb_build_object('task_id', task_id, 'task_version', task_version));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (cancelled_task.workspace_id, cancelled_task.deal_id, current_user_id, 'task.cancelled', 'tasks', task_id, jsonb_build_object('task_version', task_version));
  return next;
end;
$$;

create or replace function public.create_deal_deadline(target_deal_id uuid, deadline_input jsonb, idempotency_key text)
returns table (deadline_id uuid, deadline_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_deal public.brix_deals%rowtype;
  command public.work_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to create a deadline.' using errcode = '42501'; end if;
  target_deal := public.get_authorized_deal(target_deal_id);
  command := public.ensure_work_command(target_deal.workspace_id, target_deal.id, 'create_deal_deadline', idempotency_key, deadline_input);
  if command.deadline_id is not null then
    select id, version into deadline_id, deadline_version from public.deadlines where id = command.deadline_id;
    return next;
    return;
  end if;

  insert into public.deadlines (workspace_id, deal_id, title, status, due_at, due_date, is_all_day, timezone, source_type, source_record_id, source_term, source_description, trigger_date, calculation_rule, verification_state, created_by, updated_by)
  values (
    target_deal.workspace_id,
    target_deal.id,
    btrim(deadline_input ->> 'title'),
    coalesce(nullif(btrim(deadline_input ->> 'status'), ''), 'open'),
    nullif(deadline_input ->> 'due_at', '')::timestamptz,
    nullif(deadline_input ->> 'due_date', '')::date,
    coalesce((deadline_input ->> 'is_all_day')::boolean, false),
    coalesce(nullif(btrim(deadline_input ->> 'timezone'), ''), 'UTC'),
    coalesce(nullif(btrim(deadline_input ->> 'source_type'), ''), 'manual'),
    nullif(deadline_input ->> 'source_record_id', '')::uuid,
    nullif(btrim(deadline_input ->> 'source_term'), ''),
    nullif(btrim(deadline_input ->> 'source_description'), ''),
    nullif(deadline_input ->> 'trigger_date', '')::date,
    nullif(btrim(deadline_input ->> 'calculation_rule'), ''),
    coalesce(nullif(btrim(deadline_input ->> 'verification_state'), ''), 'unverified'),
    current_user_id,
    current_user_id
  )
  returning id, version into deadline_id, deadline_version;

  update public.work_command_requests set deadline_id = create_deal_deadline.deadline_id where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (target_deal.workspace_id, target_deal.id, current_user_id, 'deadline.created', jsonb_build_object('deadline_id', deadline_id, 'deadline_version', deadline_version, 'title', btrim(deadline_input ->> 'title')));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (target_deal.workspace_id, target_deal.id, current_user_id, 'deadline.created', 'deadlines', deadline_id, jsonb_build_object('deadline_version', deadline_version));
  return next;
end;
$$;

create or replace function public.update_deal_deadline(target_deadline_id uuid, deadline_input jsonb, expected_version integer default null)
returns table (deadline_id uuid, deadline_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_deadline public.deadlines%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to update a deadline.' using errcode = '42501'; end if;
  select * into existing_deadline from public.deadlines where id = target_deadline_id for update;
  if existing_deadline.id is null then raise exception 'Deadline is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_deadline.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update this deadline.' using errcode = '42501'; end if;
  if expected_version is not null and existing_deadline.version <> expected_version then raise exception 'This deadline changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.deadlines set
    title = coalesce(nullif(btrim(deadline_input ->> 'title'), ''), title),
    status = coalesce(nullif(btrim(deadline_input ->> 'status'), ''), status),
    due_at = case when deadline_input ? 'due_at' then nullif(deadline_input ->> 'due_at', '')::timestamptz else due_at end,
    due_date = case when deadline_input ? 'due_date' then nullif(deadline_input ->> 'due_date', '')::date else due_date end,
    is_all_day = case when deadline_input ? 'is_all_day' then (deadline_input ->> 'is_all_day')::boolean else is_all_day end,
    timezone = coalesce(nullif(btrim(deadline_input ->> 'timezone'), ''), timezone),
    source_type = coalesce(nullif(btrim(deadline_input ->> 'source_type'), ''), source_type),
    source_record_id = case when deadline_input ? 'source_record_id' then nullif(deadline_input ->> 'source_record_id', '')::uuid else source_record_id end,
    source_term = case when deadline_input ? 'source_term' then nullif(btrim(deadline_input ->> 'source_term'), '') else source_term end,
    source_description = case when deadline_input ? 'source_description' then nullif(btrim(deadline_input ->> 'source_description'), '') else source_description end,
    trigger_date = case when deadline_input ? 'trigger_date' then nullif(deadline_input ->> 'trigger_date', '')::date else trigger_date end,
    calculation_rule = case when deadline_input ? 'calculation_rule' then nullif(btrim(deadline_input ->> 'calculation_rule'), '') else calculation_rule end,
    verification_state = coalesce(nullif(btrim(deadline_input ->> 'verification_state'), ''), verification_state),
    completed_at = case when coalesce(nullif(btrim(deadline_input ->> 'status'), ''), status) = 'completed' then coalesce(completed_at, now()) else completed_at end,
    completed_by = case when coalesce(nullif(btrim(deadline_input ->> 'status'), ''), status) = 'completed' then coalesce(completed_by, current_user_id) else completed_by end,
    updated_by = current_user_id
  where id = target_deadline_id
  returning id, version into deadline_id, deadline_version;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (existing_deadline.workspace_id, existing_deadline.deal_id, current_user_id, 'deadline.changed', jsonb_build_object('deadline_id', deadline_id, 'deadline_version', deadline_version));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (existing_deadline.workspace_id, existing_deadline.deal_id, current_user_id, 'deadline.changed', 'deadlines', deadline_id, jsonb_build_object('deadline_version', deadline_version));
  return next;
end;
$$;

create or replace function public.complete_deal_deadline(target_deadline_id uuid, expected_version integer default null)
returns table (deadline_id uuid, deadline_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  completed_deadline public.deadlines%rowtype;
begin
  select updated.deadline_id, updated.deadline_version into deadline_id, deadline_version
  from public.update_deal_deadline(target_deadline_id, '{"status":"completed"}'::jsonb, expected_version) updated;

  select * into completed_deadline from public.deadlines where id = deadline_id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (completed_deadline.workspace_id, completed_deadline.deal_id, current_user_id, 'deadline.completed', jsonb_build_object('deadline_id', deadline_id, 'deadline_version', deadline_version));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (completed_deadline.workspace_id, completed_deadline.deal_id, current_user_id, 'deadline.completed', 'deadlines', deadline_id, jsonb_build_object('deadline_version', deadline_version));
  return next;
end;
$$;

create or replace function public.create_deal_note(target_deal_id uuid, note_input jsonb, idempotency_key text)
returns table (note_id uuid, note_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_deal public.brix_deals%rowtype;
  command public.work_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to create a note.' using errcode = '42501'; end if;
  target_deal := public.get_authorized_deal(target_deal_id);
  command := public.ensure_work_command(target_deal.workspace_id, target_deal.id, 'create_deal_note', idempotency_key, note_input);
  if command.note_id is not null then
    select id, version into note_id, note_version from public.notes where id = command.note_id;
    return next;
    return;
  end if;

  insert into public.notes (workspace_id, deal_id, body, note_type, pinned, source_type, source_record_id, created_by, updated_by)
  values (
    target_deal.workspace_id,
    target_deal.id,
    btrim(note_input ->> 'body'),
    coalesce(nullif(btrim(note_input ->> 'note_type'), ''), 'general'),
    coalesce((note_input ->> 'pinned')::boolean, false),
    coalesce(nullif(btrim(note_input ->> 'source_type'), ''), 'manual'),
    nullif(note_input ->> 'source_record_id', '')::uuid,
    current_user_id,
    current_user_id
  )
  returning id, version into note_id, note_version;

  update public.work_command_requests set note_id = create_deal_note.note_id where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (target_deal.workspace_id, target_deal.id, current_user_id, 'note.created', jsonb_build_object('note_id', note_id, 'note_version', note_version));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (target_deal.workspace_id, target_deal.id, current_user_id, 'note.created', 'notes', note_id, jsonb_build_object('note_version', note_version));
  return next;
end;
$$;

create or replace function public.update_deal_note(target_note_id uuid, note_input jsonb, expected_version integer default null)
returns table (note_id uuid, note_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_note public.notes%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to update a note.' using errcode = '42501'; end if;
  select * into existing_note from public.notes where id = target_note_id and archived_at is null for update;
  if existing_note.id is null then raise exception 'Note is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_note.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update this note.' using errcode = '42501'; end if;
  if expected_version is not null and existing_note.version <> expected_version then raise exception 'This note changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.notes set
    body = coalesce(nullif(btrim(note_input ->> 'body'), ''), body),
    note_type = coalesce(nullif(btrim(note_input ->> 'note_type'), ''), note_type),
    pinned = case when note_input ? 'pinned' then (note_input ->> 'pinned')::boolean else pinned end,
    source_type = coalesce(nullif(btrim(note_input ->> 'source_type'), ''), source_type),
    source_record_id = case when note_input ? 'source_record_id' then nullif(note_input ->> 'source_record_id', '')::uuid else source_record_id end,
    updated_by = current_user_id
  where id = target_note_id
  returning id, version into note_id, note_version;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (existing_note.workspace_id, existing_note.deal_id, current_user_id, 'note.updated', jsonb_build_object('note_id', note_id, 'note_version', note_version));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (existing_note.workspace_id, existing_note.deal_id, current_user_id, 'note.updated', 'notes', note_id, jsonb_build_object('note_version', note_version));
  return next;
end;
$$;

create or replace function public.archive_deal_note(target_note_id uuid, expected_version integer default null)
returns table (note_id uuid, note_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_note public.notes%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to archive a note.' using errcode = '42501'; end if;
  select * into existing_note from public.notes where id = target_note_id and archived_at is null for update;
  if existing_note.id is null then raise exception 'Note is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_note.workspace_id, 'deals:manage') then raise exception 'You do not have permission to archive this note.' using errcode = '42501'; end if;
  if expected_version is not null and existing_note.version <> expected_version then raise exception 'This note changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.notes set archived_at = now(), updated_by = current_user_id
  where id = target_note_id
  returning id, version into note_id, note_version;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (existing_note.workspace_id, existing_note.deal_id, current_user_id, 'note.archived', jsonb_build_object('note_id', note_id, 'note_version', note_version));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (existing_note.workspace_id, existing_note.deal_id, current_user_id, 'note.archived', 'notes', note_id, jsonb_build_object('note_version', note_version));
  return next;
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
declare
  target_deal public.brix_deals%rowtype;
begin
  target_deal := public.get_authorized_deal(target_deal_id);
  return query
  select 'task'::text, task.id, task.version, task.workspace_id, task.deal_id, task.title, task.description, task.status, task.priority, task.task_type,
         task.due_at, task.due_date, task.is_all_day, task.timezone, task.source_type, task.source_record_id, null::text,
         task.completed_at, task.archived_at, false, task.created_at, task.updated_at
  from public.tasks task
  where task.deal_id = target_deal.id and task.workspace_id = target_deal.workspace_id and task.archived_at is null
  union all
  select 'deadline'::text, deadline.id, deadline.version, deadline.workspace_id, deadline.deal_id, deadline.title, deadline.source_description, deadline.status, null::text, 'deadline'::text,
         deadline.due_at, deadline.due_date, deadline.is_all_day, deadline.timezone, deadline.source_type, deadline.source_record_id, deadline.verification_state,
         deadline.completed_at, deadline.archived_at, false, deadline.created_at, deadline.updated_at
  from public.deadlines deadline
  where deadline.deal_id = target_deal.id and deadline.workspace_id = target_deal.workspace_id and deadline.archived_at is null
  order by
    coalesce(due_at, due_date::timestamptz, updated_at) asc,
    updated_at desc;
end;
$$;

create or replace function public.list_deal_notes(target_deal_id uuid)
returns table (
  note_id uuid,
  note_version integer,
  workspace_id uuid,
  deal_id uuid,
  body text,
  note_type text,
  pinned boolean,
  source_type text,
  source_record_id uuid,
  archived_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_deal public.brix_deals%rowtype;
begin
  target_deal := public.get_authorized_deal(target_deal_id);
  return query
  select note.id, note.version, note.workspace_id, note.deal_id, note.body, note.note_type, note.pinned, note.source_type, note.source_record_id, note.archived_at, note.created_at, note.updated_at
  from public.notes note
  where note.deal_id = target_deal.id and note.workspace_id = target_deal.workspace_id and note.archived_at is null
  order by note.pinned desc, note.updated_at desc;
end;
$$;

create or replace function public.load_deal_timeline(target_deal_id uuid, before_time timestamptz default null, page_size integer default 30)
returns table (
  timeline_id uuid,
  workspace_id uuid,
  deal_id uuid,
  event_type text,
  source_type text,
  source_record_id uuid,
  safe_title text,
  safe_summary text,
  actor_id uuid,
  occurred_at timestamptz,
  canonical_order text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_deal public.brix_deals%rowtype;
begin
  target_deal := public.get_authorized_deal(target_deal_id);
  return query
  select
    event.id,
    event.workspace_id,
    target_deal.id,
    event.event_type,
    split_part(event.event_type, '.', 1),
    case
      when event.payload ? 'task_id' then nullif(event.payload ->> 'task_id', '')::uuid
      when event.payload ? 'deadline_id' then nullif(event.payload ->> 'deadline_id', '')::uuid
      when event.payload ? 'note_id' then nullif(event.payload ->> 'note_id', '')::uuid
      when event.payload ? 'relationship_id' then nullif(event.payload ->> 'relationship_id', '')::uuid
      else null::uuid
    end,
    case event.event_type
      when 'task.created' then 'Task added'
      when 'task.updated' then 'Task updated'
      when 'task.completed' then 'Task completed'
      when 'task.cancelled' then 'Task cancelled'
      when 'deadline.created' then 'Deadline added'
      when 'deadline.changed' then 'Deadline changed'
      when 'deadline.completed' then 'Deadline completed'
      when 'note.created' then 'Note added'
      when 'note.updated' then 'Note updated'
      when 'note.archived' then 'Note archived'
      when 'relationship.created' then 'Relationship added'
      when 'relationship.updated' then 'Relationship updated'
      when 'relationship.deactivated' then 'Relationship removed'
      else initcap(replace(event.event_type, '.', ' '))
    end,
    left(coalesce(event.payload ->> 'title', event.event_type), 240),
    event.actor_id,
    event.created_at,
    to_char(event.created_at, 'YYYYMMDDHH24MISSUS') || ':' || event.id::text
  from public.domain_events event
  where event.workspace_id = target_deal.workspace_id
    and (
      event.deal_id = target_deal.id
      or event.payload ->> 'deal_id' = target_deal.id::text
      or event.payload ->> 'task_id' in (select task.id::text from public.tasks task where task.deal_id = target_deal.id)
      or event.payload ->> 'deadline_id' in (select deadline.id::text from public.deadlines deadline where deadline.deal_id = target_deal.id)
      or event.payload ->> 'note_id' in (select note.id::text from public.notes note where note.deal_id = target_deal.id)
      or event.payload ->> 'relationship_id' in (select relationship.id::text from public.deal_relationships relationship where relationship.deal_id = target_deal.id)
    )
    and (before_time is null or event.created_at < before_time)
  order by event.created_at desc, event.id desc
  limit greatest(1, least(coalesce(page_size, 30), 100));
end;
$$;

revoke all on function public.get_authorized_deal(uuid) from public;
revoke all on function public.ensure_work_command(uuid, uuid, text, text, jsonb) from public;
revoke all on function public.create_deal_task(uuid, jsonb, text) from public;
revoke all on function public.update_deal_task(uuid, jsonb, integer) from public;
revoke all on function public.complete_deal_task(uuid, integer) from public;
revoke all on function public.cancel_deal_task(uuid, integer) from public;
revoke all on function public.create_deal_deadline(uuid, jsonb, text) from public;
revoke all on function public.update_deal_deadline(uuid, jsonb, integer) from public;
revoke all on function public.complete_deal_deadline(uuid, integer) from public;
revoke all on function public.create_deal_note(uuid, jsonb, text) from public;
revoke all on function public.update_deal_note(uuid, jsonb, integer) from public;
revoke all on function public.archive_deal_note(uuid, integer) from public;
revoke all on function public.list_deal_work(uuid) from public;
revoke all on function public.list_deal_notes(uuid) from public;
revoke all on function public.load_deal_timeline(uuid, timestamptz, integer) from public;

grant execute on function public.create_deal_task(uuid, jsonb, text) to authenticated;
grant execute on function public.update_deal_task(uuid, jsonb, integer) to authenticated;
grant execute on function public.complete_deal_task(uuid, integer) to authenticated;
grant execute on function public.cancel_deal_task(uuid, integer) to authenticated;
grant execute on function public.create_deal_deadline(uuid, jsonb, text) to authenticated;
grant execute on function public.update_deal_deadline(uuid, jsonb, integer) to authenticated;
grant execute on function public.complete_deal_deadline(uuid, integer) to authenticated;
grant execute on function public.create_deal_note(uuid, jsonb, text) to authenticated;
grant execute on function public.update_deal_note(uuid, jsonb, integer) to authenticated;
grant execute on function public.archive_deal_note(uuid, integer) to authenticated;
grant execute on function public.list_deal_work(uuid) to authenticated;
grant execute on function public.list_deal_notes(uuid) to authenticated;
grant execute on function public.load_deal_timeline(uuid, timestamptz, integer) to authenticated;

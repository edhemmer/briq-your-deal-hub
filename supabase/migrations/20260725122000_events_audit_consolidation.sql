-- Specification 003 final slice: Events and Audit.
-- Consolidates the existing canonical domain_events and audit_events ledgers.

create extension if not exists pgcrypto;

alter table public.domain_events add column if not exists event_version integer not null default 1;
alter table public.domain_events add column if not exists property_id uuid;
alter table public.domain_events add column if not exists entity_type text;
alter table public.domain_events add column if not exists entity_id uuid;
alter table public.domain_events add column if not exists entity_version integer;
alter table public.domain_events add column if not exists actor_type text not null default 'user';
alter table public.domain_events add column if not exists source_client text not null default 'server';
alter table public.domain_events add column if not exists source_command text;
alter table public.domain_events add column if not exists idempotency_key text;
alter table public.domain_events add column if not exists correlation_id uuid not null default gen_random_uuid();
alter table public.domain_events add column if not exists causation_id uuid;
alter table public.domain_events add column if not exists occurred_at timestamptz not null default now();
alter table public.domain_events add column if not exists persisted_at timestamptz not null default now();
alter table public.domain_events add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.audit_events add column if not exists property_id uuid;
alter table public.audit_events add column if not exists actor_type text not null default 'user';
alter table public.audit_events add column if not exists target_type text;
alter table public.audit_events add column if not exists source_client text not null default 'server';
alter table public.audit_events add column if not exists source_command text;
alter table public.audit_events add column if not exists idempotency_key text;
alter table public.audit_events add column if not exists correlation_id uuid not null default gen_random_uuid();
alter table public.audit_events add column if not exists causation_id uuid;
alter table public.audit_events add column if not exists before_values jsonb not null default '{}'::jsonb;
alter table public.audit_events add column if not exists after_values jsonb not null default '{}'::jsonb;
alter table public.audit_events add column if not exists changed_fields text[] not null default '{}'::text[];
alter table public.audit_events add column if not exists reason text;
alter table public.audit_events add column if not exists occurred_at timestamptz not null default now();
alter table public.audit_events add column if not exists success boolean not null default true;

alter table public.domain_events drop constraint if exists domain_events_event_version_supported;
alter table public.domain_events add constraint domain_events_event_version_supported check (event_version = 1);
alter table public.domain_events drop constraint if exists domain_events_payload_is_object;
alter table public.domain_events add constraint domain_events_payload_is_object check (jsonb_typeof(payload) = 'object');
alter table public.domain_events drop constraint if exists domain_events_metadata_is_object;
alter table public.domain_events add constraint domain_events_metadata_is_object check (jsonb_typeof(metadata) = 'object');
alter table public.domain_events drop constraint if exists domain_events_source_client_supported;
alter table public.domain_events add constraint domain_events_source_client_supported check (source_client in ('web', 'ios', 'system', 'migration', 'server'));
alter table public.domain_events drop constraint if exists domain_events_actor_type_supported;
alter table public.domain_events add constraint domain_events_actor_type_supported check (actor_type in ('user', 'system', 'migration', 'server'));
alter table public.domain_events drop constraint if exists domain_events_type_shape;
alter table public.domain_events add constraint domain_events_type_shape check (event_type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$');

alter table public.audit_events drop constraint if exists audit_events_before_values_is_object;
alter table public.audit_events add constraint audit_events_before_values_is_object check (jsonb_typeof(before_values) = 'object');
alter table public.audit_events drop constraint if exists audit_events_after_values_is_object;
alter table public.audit_events add constraint audit_events_after_values_is_object check (jsonb_typeof(after_values) = 'object');
alter table public.audit_events drop constraint if exists audit_events_metadata_is_object;
alter table public.audit_events add constraint audit_events_metadata_is_object check (jsonb_typeof(metadata) = 'object');
alter table public.audit_events drop constraint if exists audit_events_source_client_supported;
alter table public.audit_events add constraint audit_events_source_client_supported check (source_client in ('web', 'ios', 'system', 'migration', 'server'));
alter table public.audit_events drop constraint if exists audit_events_actor_type_supported;
alter table public.audit_events add constraint audit_events_actor_type_supported check (actor_type in ('user', 'system', 'migration', 'server'));
alter table public.audit_events drop constraint if exists audit_events_action_shape;
alter table public.audit_events add constraint audit_events_action_shape check (action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$');

create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
begin
  if value is null or btrim(value) = '' then
    return null;
  end if;
  return value::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function public.safe_event_jsonb(input_value jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  sanitized jsonb := '{}'::jsonb;
  sanitized_array jsonb := '[]'::jsonb;
  pair record;
  element record;
begin
  if input_value is null then
    return '{}'::jsonb;
  end if;

  if jsonb_typeof(input_value) = 'object' then
    for pair in select key, value as item from jsonb_each(input_value) loop
      if pair.key ~* '(password|token|secret|authorization|api[_-]?key|refresh|service[_-]?role|recovery|invite.*hash)' then
        continue;
      end if;
      sanitized := sanitized || jsonb_build_object(
        pair.key,
        case
          when jsonb_typeof(pair.item) in ('object', 'array') then public.safe_event_jsonb(pair.item)
          else pair.item
        end
      );
    end loop;
    return sanitized;
  end if;

  if jsonb_typeof(input_value) = 'array' then
    for element in select value as item from jsonb_array_elements(input_value) loop
      sanitized_array := sanitized_array || jsonb_build_array(
        case
          when jsonb_typeof(element.item) in ('object', 'array') then public.safe_event_jsonb(element.item)
          else element.item
        end
      );
    end loop;
    return sanitized_array;
  end if;

  return input_value;
end;
$$;

create or replace function public.safe_changed_fields(before_state jsonb, after_state jsonb)
returns text[]
language sql
immutable
set search_path = public
as $$
  with keys as (
    select key as field from jsonb_object_keys(coalesce(before_state, '{}'::jsonb)) as key
    union
    select key as field from jsonb_object_keys(coalesce(after_state, '{}'::jsonb)) as key
  )
  select coalesce(array_agg(field order by field), '{}'::text[])
  from keys
  where field !~* '(password|token|secret|authorization|api[_-]?key|refresh|service[_-]?role|recovery|invite.*hash)'
    and coalesce(before_state -> field, 'null'::jsonb) is distinct from coalesce(after_state -> field, 'null'::jsonb);
$$;

create or replace function public.event_entity_type(event_name text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when event_name like 'property.%' then 'property'
    when event_name like 'deal.%' then 'deal'
    when event_name like 'relationship.%' then 'relationship'
    when event_name like 'task.%' then 'task'
    when event_name like 'deadline.%' then 'deadline'
    when event_name like 'note.%' then 'note'
    when event_name like 'contact.%' then 'contact'
    when event_name like 'organization.%' then 'organization'
    when event_name like 'workspace.%' then 'workspace'
    when event_name like 'invitation.%' then 'invitation'
    when event_name like 'membership.%' then 'membership'
    when event_name like 'account.%' then 'account'
    else split_part(event_name, '.', 1)
  end;
$$;

create or replace function public.event_entity_id(event_name text, event_payload jsonb)
returns uuid
language sql
immutable
set search_path = public
as $$
  select case public.event_entity_type(event_name)
    when 'property' then public.safe_uuid(event_payload ->> 'property_id')
    when 'deal' then public.safe_uuid(event_payload ->> 'deal_id')
    when 'relationship' then public.safe_uuid(event_payload ->> 'relationship_id')
    when 'task' then public.safe_uuid(event_payload ->> 'task_id')
    when 'deadline' then public.safe_uuid(event_payload ->> 'deadline_id')
    when 'note' then public.safe_uuid(event_payload ->> 'note_id')
    when 'contact' then public.safe_uuid(event_payload ->> 'contact_id')
    when 'organization' then public.safe_uuid(event_payload ->> 'organization_id')
    when 'workspace' then public.safe_uuid(event_payload ->> 'workspace_id')
    else null
  end;
$$;

create or replace function public.event_entity_version(event_name text, event_payload jsonb)
returns integer
language sql
immutable
set search_path = public
as $$
  select nullif(event_payload ->> (public.event_entity_type(event_name) || '_version'), '')::integer;
$$;

create or replace function public.normalize_domain_event_envelope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.event_version := coalesce(new.event_version, 1);
  if new.event_version <> 1 then
    raise exception 'Unsupported domain event schema version.' using errcode = '22023';
  end if;
  if new.event_type !~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' then
    raise exception 'Unsupported domain event name.' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(new.payload, '{}'::jsonb)) <> 'object' then
    raise exception 'Domain event payload must be a JSON object.' using errcode = '22023';
  end if;

  new.payload := public.safe_event_jsonb(new.payload);
  new.metadata := public.safe_event_jsonb(coalesce(new.metadata, '{}'::jsonb));
  new.actor_type := coalesce(nullif(new.actor_type, ''), case when new.actor_id is null then 'system' else 'user' end);
  new.source_client := coalesce(nullif(new.source_client, ''), 'server');
  new.source_command := coalesce(nullif(new.source_command, ''), new.payload ->> 'source_command');
  new.idempotency_key := coalesce(nullif(new.idempotency_key, ''), nullif(new.payload ->> 'idempotency_key', ''));
  new.correlation_id := coalesce(new.correlation_id, public.safe_uuid(new.payload ->> 'correlation_id'), gen_random_uuid());
  new.causation_id := coalesce(new.causation_id, public.safe_uuid(new.payload ->> 'causation_id'));
  new.occurred_at := coalesce(new.occurred_at, new.created_at, now());
  new.persisted_at := coalesce(new.persisted_at, new.created_at, now());
  new.deal_id := coalesce(new.deal_id, public.safe_uuid(new.payload ->> 'deal_id'));
  new.property_id := coalesce(new.property_id, public.safe_uuid(new.payload ->> 'property_id'));
  new.entity_type := coalesce(nullif(new.entity_type, ''), public.event_entity_type(new.event_type));
  new.entity_id := coalesce(new.entity_id, public.event_entity_id(new.event_type, new.payload));
  new.entity_version := coalesce(new.entity_version, public.event_entity_version(new.event_type, new.payload));
  new.metadata := new.metadata || jsonb_strip_nulls(jsonb_build_object(
    'schema_version', new.event_version,
    'source_command', new.source_command,
    'idempotency_key', new.idempotency_key
  ));
  return new;
end;
$$;

create or replace function public.normalize_audit_event_envelope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.action !~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$' then
    raise exception 'Unsupported audit action name.' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(new.metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'Audit metadata must be a JSON object.' using errcode = '22023';
  end if;

  new.metadata := public.safe_event_jsonb(new.metadata);
  new.before_values := public.safe_event_jsonb(coalesce(nullif(new.before_values, '{}'::jsonb), new.metadata -> 'before', '{}'::jsonb));
  new.after_values := public.safe_event_jsonb(coalesce(nullif(new.after_values, '{}'::jsonb), new.metadata -> 'after', '{}'::jsonb));
  if jsonb_typeof(new.before_values) <> 'object' then new.before_values := '{}'::jsonb; end if;
  if jsonb_typeof(new.after_values) <> 'object' then new.after_values := '{}'::jsonb; end if;

  new.actor_type := coalesce(nullif(new.actor_type, ''), case when new.actor_id is null then 'system' else 'user' end);
  new.source_client := coalesce(nullif(new.source_client, ''), 'server');
  new.source_command := coalesce(nullif(new.source_command, ''), new.metadata ->> 'source_command');
  new.idempotency_key := coalesce(nullif(new.idempotency_key, ''), nullif(new.metadata ->> 'idempotency_key', ''));
  new.correlation_id := coalesce(new.correlation_id, public.safe_uuid(new.metadata ->> 'correlation_id'), gen_random_uuid());
  new.causation_id := coalesce(new.causation_id, public.safe_uuid(new.metadata ->> 'causation_id'));
  new.occurred_at := coalesce(new.occurred_at, new.created_at, now());
  new.target_type := coalesce(nullif(new.target_type, ''), nullif(new.target_table, ''), public.event_entity_type(new.action));
  new.property_id := coalesce(new.property_id, public.safe_uuid(new.metadata ->> 'property_id'));
  if coalesce(array_length(new.changed_fields, 1), 0) = 0 then
    new.changed_fields := public.safe_changed_fields(new.before_values, new.after_values);
  end if;
  new.metadata := new.metadata || jsonb_strip_nulls(jsonb_build_object(
    'source_command', new.source_command,
    'idempotency_key', new.idempotency_key
  ));
  return new;
end;
$$;

update public.domain_events
set
  event_version = coalesce(event_version, 1),
  occurred_at = coalesce(occurred_at, created_at),
  persisted_at = coalesce(persisted_at, created_at),
  payload = public.safe_event_jsonb(payload),
  metadata = public.safe_event_jsonb(metadata),
  actor_type = coalesce(actor_type, case when actor_id is null then 'system' else 'user' end),
  source_client = coalesce(source_client, 'migration'),
  deal_id = coalesce(deal_id, public.safe_uuid(payload ->> 'deal_id')),
  property_id = coalesce(property_id, public.safe_uuid(payload ->> 'property_id')),
  entity_type = coalesce(entity_type, public.event_entity_type(event_type)),
  entity_id = coalesce(entity_id, public.event_entity_id(event_type, payload)),
  entity_version = coalesce(entity_version, public.event_entity_version(event_type, payload));

update public.audit_events
set
  occurred_at = coalesce(occurred_at, created_at),
  metadata = public.safe_event_jsonb(metadata),
  before_values = public.safe_event_jsonb(coalesce(nullif(before_values, '{}'::jsonb), metadata -> 'before', '{}'::jsonb)),
  after_values = public.safe_event_jsonb(coalesce(nullif(after_values, '{}'::jsonb), metadata -> 'after', '{}'::jsonb)),
  actor_type = coalesce(actor_type, case when actor_id is null then 'system' else 'user' end),
  source_client = coalesce(source_client, 'migration'),
  target_type = coalesce(target_type, target_table, public.event_entity_type(action)),
  property_id = coalesce(property_id, public.safe_uuid(metadata ->> 'property_id')),
  changed_fields = case
    when coalesce(array_length(changed_fields, 1), 0) = 0 then public.safe_changed_fields(coalesce(metadata -> 'before', '{}'::jsonb), coalesce(metadata -> 'after', '{}'::jsonb))
    else changed_fields
  end;

create index if not exists idx_domain_events_workspace_occurred
  on public.domain_events(workspace_id, occurred_at desc, id desc);

create index if not exists idx_domain_events_entity
  on public.domain_events(workspace_id, entity_type, entity_id, occurred_at desc)
  where entity_id is not null;

create unique index if not exists idx_domain_events_command_event_once
  on public.domain_events(workspace_id, event_type, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists idx_audit_events_command_action_once
  on public.audit_events(workspace_id, action, idempotency_key)
  where idempotency_key is not null;

drop trigger if exists normalize_domain_event_envelope on public.domain_events;
create trigger normalize_domain_event_envelope
before insert on public.domain_events
for each row execute function public.normalize_domain_event_envelope();

drop trigger if exists normalize_audit_event_envelope on public.audit_events;
create trigger normalize_audit_event_envelope
before insert on public.audit_events
for each row execute function public.normalize_audit_event_envelope();

create or replace function public.prevent_event_audit_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Canonical event and audit history is immutable.' using errcode = '42501';
end;
$$;

drop trigger if exists domain_events_immutable on public.domain_events;
create trigger domain_events_immutable
before update or delete on public.domain_events
for each row execute function public.prevent_event_audit_mutation();

drop trigger if exists audit_events_immutable on public.audit_events;
create trigger audit_events_immutable
before update or delete on public.audit_events
for each row execute function public.prevent_event_audit_mutation();

drop policy if exists "domain events insert actor" on public.domain_events;
drop policy if exists "domain events no direct insert" on public.domain_events;
create policy "domain events no direct insert"
  on public.domain_events for insert to authenticated
  with check (false);

drop policy if exists "domain events no direct update" on public.domain_events;
create policy "domain events no direct update"
  on public.domain_events for update to authenticated
  using (false)
  with check (false);

drop policy if exists "domain events no direct delete" on public.domain_events;
create policy "domain events no direct delete"
  on public.domain_events for delete to authenticated
  using (false);

drop policy if exists "audit events read workspace members" on public.audit_events;
drop policy if exists "audit events read actor or access managers" on public.audit_events;
create policy "audit events read actor or access managers"
  on public.audit_events for select to authenticated
  using (
    actor_id = auth.uid()
    or (workspace_id is not null and public.has_workspace_permission(workspace_id, 'members:manage'))
  );

drop policy if exists "audit events insert actor" on public.audit_events;
drop policy if exists "audit events no direct insert" on public.audit_events;
create policy "audit events no direct insert"
  on public.audit_events for insert to authenticated
  with check (false);

drop policy if exists "audit events no direct update" on public.audit_events;
create policy "audit events no direct update"
  on public.audit_events for update to authenticated
  using (false)
  with check (false);

drop policy if exists "audit events no direct delete" on public.audit_events;
create policy "audit events no direct delete"
  on public.audit_events for delete to authenticated
  using (false);

create or replace function public.complete_deal_task(target_task_id uuid, expected_version integer default null)
returns table (task_id uuid, task_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_task public.tasks%rowtype;
  after_state jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required to complete a task.' using errcode = '42501'; end if;

  select * into existing_task from public.tasks where id = target_task_id and archived_at is null for update;
  if existing_task.id is null then raise exception 'Task is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_task.workspace_id, 'deals:manage') then raise exception 'You do not have permission to complete this task.' using errcode = '42501'; end if;
  if expected_version is not null and existing_task.version <> expected_version then raise exception 'This task changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  if existing_task.status = 'completed' then
    task_id := existing_task.id;
    task_version := existing_task.version;
    return next;
    return;
  end if;

  update public.tasks
  set status = 'completed',
      completed_at = coalesce(completed_at, now()),
      completed_by = coalesce(completed_by, current_user_id),
      updated_by = current_user_id
  where id = target_task_id
  returning id, version into task_id, task_version;

  after_state := jsonb_build_object('status', 'completed', 'task_version', task_version);
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, payload)
  values (existing_task.workspace_id, existing_task.deal_id, current_user_id, 'task.completed', 'task', task_id, task_version, 'complete_deal_task', jsonb_build_object('task_id', task_id, 'task_version', task_version, 'title', existing_task.title, 'from_status', existing_task.status, 'to_status', 'completed'));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, before_values, after_values, changed_fields, metadata)
  values (existing_task.workspace_id, existing_task.deal_id, current_user_id, 'task.completed', 'tasks', 'task', task_id, 'complete_deal_task', jsonb_build_object('status', existing_task.status, 'task_version', existing_task.version), after_state, array['status'], jsonb_build_object('task_version', task_version));
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
  existing_task public.tasks%rowtype;
  after_state jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required to cancel a task.' using errcode = '42501'; end if;

  select * into existing_task from public.tasks where id = target_task_id and archived_at is null for update;
  if existing_task.id is null then raise exception 'Task is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_task.workspace_id, 'deals:manage') then raise exception 'You do not have permission to cancel this task.' using errcode = '42501'; end if;
  if expected_version is not null and existing_task.version <> expected_version then raise exception 'This task changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  if existing_task.status = 'cancelled' then
    task_id := existing_task.id;
    task_version := existing_task.version;
    return next;
    return;
  end if;

  update public.tasks
  set status = 'cancelled',
      updated_by = current_user_id
  where id = target_task_id
  returning id, version into task_id, task_version;

  after_state := jsonb_build_object('status', 'cancelled', 'task_version', task_version);
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, payload)
  values (existing_task.workspace_id, existing_task.deal_id, current_user_id, 'task.cancelled', 'task', task_id, task_version, 'cancel_deal_task', jsonb_build_object('task_id', task_id, 'task_version', task_version, 'title', existing_task.title, 'from_status', existing_task.status, 'to_status', 'cancelled'));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, before_values, after_values, changed_fields, metadata)
  values (existing_task.workspace_id, existing_task.deal_id, current_user_id, 'task.cancelled', 'tasks', 'task', task_id, 'cancel_deal_task', jsonb_build_object('status', existing_task.status, 'task_version', existing_task.version), after_state, array['status'], jsonb_build_object('task_version', task_version));
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
  existing_deadline public.deadlines%rowtype;
  after_state jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required to complete a deadline.' using errcode = '42501'; end if;

  select * into existing_deadline from public.deadlines where id = target_deadline_id and archived_at is null for update;
  if existing_deadline.id is null then raise exception 'Deadline is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_deadline.workspace_id, 'deals:manage') then raise exception 'You do not have permission to complete this deadline.' using errcode = '42501'; end if;
  if expected_version is not null and existing_deadline.version <> expected_version then raise exception 'This deadline changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  if existing_deadline.status = 'completed' then
    deadline_id := existing_deadline.id;
    deadline_version := existing_deadline.version;
    return next;
    return;
  end if;

  update public.deadlines
  set status = 'completed',
      completed_at = coalesce(completed_at, now()),
      completed_by = coalesce(completed_by, current_user_id),
      updated_by = current_user_id
  where id = target_deadline_id
  returning id, version into deadline_id, deadline_version;

  after_state := jsonb_build_object('status', 'completed', 'deadline_version', deadline_version);
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, payload)
  values (existing_deadline.workspace_id, existing_deadline.deal_id, current_user_id, 'deadline.completed', 'deadline', deadline_id, deadline_version, 'complete_deal_deadline', jsonb_build_object('deadline_id', deadline_id, 'deadline_version', deadline_version, 'title', existing_deadline.title, 'from_status', existing_deadline.status, 'to_status', 'completed'));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, before_values, after_values, changed_fields, metadata)
  values (existing_deadline.workspace_id, existing_deadline.deal_id, current_user_id, 'deadline.completed', 'deadlines', 'deadline', deadline_id, 'complete_deal_deadline', jsonb_build_object('status', existing_deadline.status, 'deadline_version', existing_deadline.version), after_state, array['status'], jsonb_build_object('deadline_version', deadline_version));
  return next;
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
    coalesce(event.entity_type, split_part(event.event_type, '.', 1)),
    coalesce(
      event.entity_id,
      public.safe_uuid(event.payload ->> 'task_id'),
      public.safe_uuid(event.payload ->> 'deadline_id'),
      public.safe_uuid(event.payload ->> 'note_id'),
      public.safe_uuid(event.payload ->> 'relationship_id'),
      public.safe_uuid(event.payload ->> 'deal_id'),
      public.safe_uuid(event.payload ->> 'property_id')
    ),
    case event.event_type
      when 'property.created' then 'Property created'
      when 'property.updated' then 'Property updated'
      when 'deal.created' then 'Deal created'
      when 'deal.updated' then 'Deal details updated'
      when 'deal.stage_changed' then 'Stage changed'
      when 'deal.status_changed' then 'Status changed'
      when 'deal.archived' then 'Deal archived'
      when 'deal.restored' then 'Deal restored'
      when 'relationship.created' then 'Person added to Deal'
      when 'relationship.updated' then 'Relationship updated'
      when 'relationship.deactivated' then 'Relationship removed'
      when 'task.created' then 'Task added'
      when 'task.updated' then 'Task updated'
      when 'task.completed' then 'Task completed'
      when 'task.cancelled' then 'Task cancelled'
      when 'deadline.created' then 'Deadline added'
      when 'deadline.changed' then 'Deadline updated'
      when 'deadline.completed' then 'Deadline completed'
      when 'note.created' then 'Note added'
      when 'note.updated' then 'Note updated'
      when 'note.archived' then 'Note archived'
      else 'Deal activity'
    end,
    left(
      coalesce(
        case
          when event.event_type = 'deal.stage_changed' then 'Moved from ' || coalesce(event.payload ->> 'from_stage', 'prior stage') || ' to ' || coalesce(event.payload ->> 'to_stage', 'new stage')
          when event.event_type = 'deal.status_changed' then 'Status changed from ' || coalesce(event.payload ->> 'from_status', 'prior status') || ' to ' || coalesce(event.payload ->> 'to_status', 'new status')
          when event.event_type in ('deal.archived', 'deal.restored') then nullif(event.payload ->> 'reason', '')
          else nullif(event.payload ->> 'title', '')
        end,
        case event.event_type
          when 'property.created' then 'Property saved to this Deal.'
          when 'property.updated' then 'Property details were updated.'
          when 'deal.created' then 'Deal workspace created.'
          when 'deal.updated' then 'Deal details were updated.'
          when 'relationship.created' then 'Relationship saved.'
          when 'relationship.updated' then 'Relationship details were updated.'
          when 'relationship.deactivated' then 'Relationship removed from this Deal.'
          when 'task.completed' then 'Task marked complete.'
          when 'task.cancelled' then 'Task cancelled.'
          when 'deadline.completed' then 'Deadline marked complete.'
          else replace(event.event_type, '.', ' ')
        end
      ),
      240
    ),
    event.actor_id,
    event.occurred_at,
    to_char(event.occurred_at, 'YYYYMMDDHH24MISSUS') || ':' || event.id::text
  from public.domain_events event
  where event.workspace_id = target_deal.workspace_id
    and event.event_version = 1
    and event.event_type in (
      'property.created',
      'property.updated',
      'deal.created',
      'deal.updated',
      'deal.stage_changed',
      'deal.status_changed',
      'deal.archived',
      'deal.restored',
      'relationship.created',
      'relationship.updated',
      'relationship.deactivated',
      'task.created',
      'task.updated',
      'task.completed',
      'task.cancelled',
      'deadline.created',
      'deadline.changed',
      'deadline.completed',
      'note.created',
      'note.updated',
      'note.archived'
    )
    and (
      event.deal_id = target_deal.id
      or event.payload ->> 'deal_id' = target_deal.id::text
      or event.entity_id = target_deal.id
      or event.payload ->> 'task_id' in (select task.id::text from public.tasks task where task.deal_id = target_deal.id)
      or event.payload ->> 'deadline_id' in (select deadline.id::text from public.deadlines deadline where deadline.deal_id = target_deal.id)
      or event.payload ->> 'note_id' in (select note.id::text from public.notes note where note.deal_id = target_deal.id)
      or event.payload ->> 'relationship_id' in (select relationship.id::text from public.deal_relationships relationship where relationship.deal_id = target_deal.id)
    )
    and (before_time is null or event.occurred_at < before_time)
  order by event.occurred_at desc, event.id desc
  limit greatest(1, least(coalesce(page_size, 30), 100));
end;
$$;

revoke all on function public.safe_uuid(text) from public;
revoke all on function public.safe_event_jsonb(jsonb) from public;
revoke all on function public.safe_changed_fields(jsonb, jsonb) from public;
revoke all on function public.event_entity_type(text) from public;
revoke all on function public.event_entity_id(text, jsonb) from public;
revoke all on function public.event_entity_version(text, jsonb) from public;
revoke all on function public.complete_deal_task(uuid, integer) from public;
revoke all on function public.cancel_deal_task(uuid, integer) from public;
revoke all on function public.complete_deal_deadline(uuid, integer) from public;
revoke all on function public.load_deal_timeline(uuid, timestamptz, integer) from public;

grant execute on function public.complete_deal_task(uuid, integer) to authenticated;
grant execute on function public.cancel_deal_task(uuid, integer) to authenticated;
grant execute on function public.complete_deal_deadline(uuid, integer) to authenticated;
grant execute on function public.load_deal_timeline(uuid, timestamptz, integer) to authenticated;

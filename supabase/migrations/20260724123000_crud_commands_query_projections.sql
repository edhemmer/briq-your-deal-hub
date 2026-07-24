-- Specification 003 slice 4: CRUD Commands and Query Projections.
-- This adapts existing canonical Property, Deal, relationship, work, note, and
-- timeline records behind server-owned commands and bounded read projections.

create extension if not exists pgcrypto;

create table if not exists public.deal_command_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid,
  property_id uuid,
  command_name text not null,
  idempotency_key text not null,
  request_hash text not null,
  result jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index if not exists idx_deal_command_requests_created_by
  on public.deal_command_requests(created_by, created_at desc);

create index if not exists idx_deal_command_requests_workspace_deal
  on public.deal_command_requests(workspace_id, deal_id, created_at desc)
  where deal_id is not null;

create index if not exists idx_deal_properties_workspace_deal_role_status
  on public.deal_properties(workspace_id, deal_id, role, inclusion_status, updated_at desc);

create index if not exists idx_deal_relationships_workspace_deal_status
  on public.deal_relationships(workspace_id, deal_id, status, updated_at desc);

alter table public.deal_command_requests enable row level security;

drop policy if exists "deal command requests read creator" on public.deal_command_requests;
create policy "deal command requests read creator"
  on public.deal_command_requests for select to authenticated
  using (created_by = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "deal command requests no direct insert" on public.deal_command_requests;
create policy "deal command requests no direct insert"
  on public.deal_command_requests for insert to authenticated
  with check (false);

drop policy if exists "deal command requests no direct update" on public.deal_command_requests;
create policy "deal command requests no direct update"
  on public.deal_command_requests for update to authenticated
  using (false)
  with check (false);

drop policy if exists "deal command requests no direct delete" on public.deal_command_requests;
create policy "deal command requests no direct delete"
  on public.deal_command_requests for delete to authenticated
  using (false);

create or replace function public.authorized_deal_for_read(target_deal_id uuid)
returns public.brix_deals
language plpgsql
security definer
set search_path = public
as $$
declare
  target_deal public.brix_deals%rowtype;
begin
  select * into target_deal
  from public.brix_deals
  where id = target_deal_id
    and deleted_at is null;

  if target_deal.id is null then
    raise exception 'Deal is not available.' using errcode = 'P0002';
  end if;

  if not public.is_workspace_member(target_deal.workspace_id) then
    raise exception 'You do not have permission to view this Deal.' using errcode = '42501';
  end if;

  return target_deal;
end;
$$;

create or replace function public.ensure_deal_command(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_property_id uuid,
  command_name text,
  idempotency_key text,
  request_body jsonb
)
returns public.deal_command_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  request_hash text;
  existing_request public.deal_command_requests%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if cleaned_key is null then
    raise exception 'A retry key is required to safely save this change.' using errcode = '22023';
  end if;

  request_hash := md5(
    target_workspace_id::text ||
    coalesce(target_deal_id::text, '') ||
    coalesce(target_property_id::text, '') ||
    command_name ||
    coalesce(request_body::text, '{}')
  );

  insert into public.deal_command_requests (workspace_id, deal_id, property_id, command_name, idempotency_key, request_hash, created_by)
  values (target_workspace_id, target_deal_id, target_property_id, command_name, cleaned_key, request_hash, current_user_id)
  on conflict (workspace_id, idempotency_key) do nothing;

  select * into existing_request
  from public.deal_command_requests
  where workspace_id = target_workspace_id
    and idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash or existing_request.command_name <> command_name then
    raise exception 'This retry key was already used for a different Deal command.' using errcode = '23505';
  end if;

  return existing_request;
end;
$$;

create or replace function public.update_canonical_property(
  target_property_id uuid,
  property_input jsonb,
  expected_version integer,
  idempotency_key text
)
returns table (
  property_id uuid,
  property_version integer,
  workspace_id uuid,
  display_address text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text,
  parcel_identifier text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_property public.properties%rowtype;
  command public.deal_command_requests%rowtype;
  before_state jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required to update a Property.' using errcode = '42501'; end if;

  select * into existing_property
  from public.properties
  where id = target_property_id
    and deleted_at is null
  for update;

  if existing_property.id is null then raise exception 'Property is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_property.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update this Property.' using errcode = '42501'; end if;

  command := public.ensure_deal_command(existing_property.workspace_id, null, existing_property.id, 'update_canonical_property', idempotency_key, property_input || jsonb_build_object('expected_version', expected_version));
  if command.result ? 'property_id' then
    select p.id, p.version, p.workspace_id, p.display_address, p.address_line1, p.address_line2, p.city, p.region, p.postal_code, p.country, p.parcel_identifier, p.updated_at
    into property_id, property_version, workspace_id, display_address, address_line1, address_line2, city, region, postal_code, country, parcel_identifier, updated_at
    from public.properties p
    where p.id = (command.result ->> 'property_id')::uuid;
    return next;
    return;
  end if;

  if existing_property.version <> expected_version then
    raise exception 'This Property changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  before_state := jsonb_build_object(
    'display_address', existing_property.display_address,
    'address_line1', existing_property.address_line1,
    'address_line2', existing_property.address_line2,
    'city', existing_property.city,
    'region', existing_property.region,
    'postal_code', existing_property.postal_code,
    'country', existing_property.country,
    'parcel_identifier', existing_property.parcel_identifier,
    'version', existing_property.version
  );

  update public.properties
  set
    display_address = coalesce(nullif(btrim(property_input ->> 'display_address'), ''), display_address),
    address_line1 = case when property_input ? 'address_line1' then nullif(btrim(property_input ->> 'address_line1'), '') else address_line1 end,
    address_line2 = case when property_input ? 'address_line2' then nullif(btrim(property_input ->> 'address_line2'), '') else address_line2 end,
    city = case when property_input ? 'city' then nullif(btrim(property_input ->> 'city'), '') else city end,
    region = case when property_input ? 'region' then upper(nullif(btrim(property_input ->> 'region'), '')) else region end,
    postal_code = case when property_input ? 'postal_code' then nullif(btrim(property_input ->> 'postal_code'), '') else postal_code end,
    country = coalesce(upper(nullif(btrim(property_input ->> 'country'), '')), country),
    parcel_identifier = case when property_input ? 'parcel_identifier' then nullif(btrim(property_input ->> 'parcel_identifier'), '') else parcel_identifier end,
    updated_by = current_user_id
  where id = target_property_id
  returning id, version, workspace_id, display_address, address_line1, address_line2, city, region, postal_code, country, parcel_identifier, updated_at
  into property_id, property_version, workspace_id, display_address, address_line1, address_line2, city, region, postal_code, country, parcel_identifier, updated_at;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (workspace_id, current_user_id, 'property.updated', jsonb_build_object('property_id', property_id, 'property_version', property_version, 'before', before_state));

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (workspace_id, current_user_id, 'property.updated', 'properties', property_id, jsonb_build_object('property_version', property_version, 'before', before_state));

  update public.deal_command_requests
  set result = jsonb_build_object('property_id', property_id, 'property_version', property_version)
  where id = command.id;

  return next;
end;
$$;

create or replace function public.update_canonical_deal(
  target_deal_id uuid,
  deal_input jsonb,
  expected_version integer,
  idempotency_key text
)
returns table (
  deal_id uuid,
  deal_version integer,
  workspace_id uuid,
  display_name text,
  deal_type text,
  priority text,
  source text,
  strategy_intent text,
  stage text,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_deal public.brix_deals%rowtype;
  command public.deal_command_requests%rowtype;
  before_state jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required to update a Deal.' using errcode = '42501'; end if;
  existing_deal := public.get_authorized_deal(target_deal_id);
  select * into existing_deal from public.brix_deals where id = target_deal_id for update;

  command := public.ensure_deal_command(existing_deal.workspace_id, existing_deal.id, null, 'update_canonical_deal', idempotency_key, deal_input || jsonb_build_object('expected_version', expected_version));
  if command.result ? 'deal_id' then
    select d.id, d.version, d.workspace_id, d.display_name, d.deal_type, d.priority, d.source, d.strategy_intent, d.stage, d.operating_status, d.updated_at
    into deal_id, deal_version, workspace_id, display_name, deal_type, priority, source, strategy_intent, stage, status, updated_at
    from public.brix_deals d
    where d.id = (command.result ->> 'deal_id')::uuid;
    return next;
    return;
  end if;

  if existing_deal.version <> expected_version then
    raise exception 'This Deal changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  if deal_input ? 'stage' or deal_input ? 'operating_status' then
    raise exception 'Use the lifecycle command to change Deal stage or status.' using errcode = '22023';
  end if;

  if deal_input ? 'deal_type' and not (deal_input ->> 'deal_type' in ('acquisition', 'disposition', 'refinance', 'operation', 'research')) then
    raise exception 'Deal type is not available.' using errcode = '22023';
  end if;

  if deal_input ? 'priority' and not (deal_input ->> 'priority' in ('low', 'normal', 'high', 'urgent')) then
    raise exception 'Deal priority is not available.' using errcode = '22023';
  end if;

  before_state := jsonb_build_object(
    'display_name', existing_deal.display_name,
    'deal_type', existing_deal.deal_type,
    'priority', existing_deal.priority,
    'source', existing_deal.source,
    'strategy_intent', existing_deal.strategy_intent,
    'version', existing_deal.version
  );

  update public.brix_deals
  set
    display_name = coalesce(nullif(btrim(deal_input ->> 'display_name'), ''), display_name),
    deal_type = coalesce(nullif(btrim(deal_input ->> 'deal_type'), ''), deal_type),
    priority = coalesce(nullif(btrim(deal_input ->> 'priority'), ''), priority),
    source = coalesce(nullif(btrim(deal_input ->> 'source'), ''), source),
    strategy_intent = case when deal_input ? 'strategy_intent' then nullif(btrim(deal_input ->> 'strategy_intent'), '') else strategy_intent end,
    source_url = case when deal_input ? 'source_url' then nullif(btrim(deal_input ->> 'source_url'), '') else source_url end,
    source_text = case when deal_input ? 'source_text' then nullif(btrim(deal_input ->> 'source_text'), '') else source_text end,
    strategy_id = coalesce(nullif(btrim(deal_input ->> 'strategy_id'), ''), strategy_id),
    facts = case when deal_input ? 'facts' and jsonb_typeof(deal_input -> 'facts') = 'object' then deal_input -> 'facts' else facts end,
    verification = case when deal_input ? 'verification' and jsonb_typeof(deal_input -> 'verification') = 'object' then deal_input -> 'verification' else verification end,
    updated_by = current_user_id
  where id = target_deal_id
  returning id, version, workspace_id, display_name, deal_type, priority, source, strategy_intent, stage, operating_status, updated_at
  into deal_id, deal_version, workspace_id, display_name, deal_type, priority, source, strategy_intent, stage, status, updated_at;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (workspace_id, deal_id, current_user_id, 'deal.updated', jsonb_build_object('deal_id', deal_id, 'deal_version', deal_version, 'before', before_state));

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (workspace_id, deal_id, current_user_id, 'deal.updated', 'brix_deals', deal_id, jsonb_build_object('deal_version', deal_version, 'before', before_state));

  update public.deal_command_requests
  set result = jsonb_build_object('deal_id', deal_id, 'deal_version', deal_version)
  where id = command.id;

  return next;
end;
$$;

create or replace function public.update_deal_lifecycle(
  target_deal_id uuid,
  lifecycle_input jsonb,
  expected_version integer,
  idempotency_key text
)
returns table (
  deal_id uuid,
  deal_version integer,
  workspace_id uuid,
  stage text,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_deal public.brix_deals%rowtype;
  command public.deal_command_requests%rowtype;
  requested_stage text := nullif(btrim(lifecycle_input ->> 'stage'), '');
  requested_status text := nullif(btrim(lifecycle_input ->> 'operating_status'), '');
  reason text := coalesce(nullif(btrim(lifecycle_input ->> 'reason'), ''), 'user_update');
begin
  if current_user_id is null then raise exception 'Authentication required to update Deal lifecycle.' using errcode = '42501'; end if;
  existing_deal := public.get_authorized_deal(target_deal_id);
  select * into existing_deal from public.brix_deals where id = target_deal_id for update;

  command := public.ensure_deal_command(existing_deal.workspace_id, existing_deal.id, null, 'update_deal_lifecycle', idempotency_key, lifecycle_input || jsonb_build_object('expected_version', expected_version));
  if command.result ? 'deal_id' then
    select d.id, d.version, d.workspace_id, d.stage, d.operating_status, d.updated_at
    into deal_id, deal_version, workspace_id, stage, status, updated_at
    from public.brix_deals d
    where d.id = (command.result ->> 'deal_id')::uuid;
    return next;
    return;
  end if;

  if existing_deal.version <> expected_version then
    raise exception 'This Deal changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  if requested_stage is null and requested_status is null then
    raise exception 'Choose a Deal stage or status to update.' using errcode = '22023';
  end if;

  if requested_stage is not null and not exists (select 1 from public.deal_stage_definitions where stage_key = requested_stage) then
    raise exception 'Deal stage is not available.' using errcode = '22023';
  end if;

  if requested_status is not null and not exists (select 1 from public.deal_operating_status_definitions where status_key = requested_status) then
    raise exception 'Deal status is not available.' using errcode = '22023';
  end if;

  update public.brix_deals
  set stage = coalesce(requested_stage, stage),
      operating_status = coalesce(requested_status, operating_status),
      updated_by = current_user_id
  where id = target_deal_id
  returning id, version, workspace_id, stage, operating_status, updated_at
  into deal_id, deal_version, workspace_id, stage, status, updated_at;

  if requested_stage is not null and requested_stage <> existing_deal.stage then
    insert into public.deal_stage_history (workspace_id, deal_id, from_stage, to_stage, reason, changed_by, idempotency_key)
    values (workspace_id, deal_id, existing_deal.stage, requested_stage, reason, current_user_id, idempotency_key);
    insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
    values (workspace_id, deal_id, current_user_id, 'deal.stage_changed', jsonb_build_object('deal_id', deal_id, 'deal_version', deal_version, 'from_stage', existing_deal.stage, 'to_stage', requested_stage));
    insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
    values (workspace_id, deal_id, current_user_id, 'deal.stage_changed', 'brix_deals', deal_id, jsonb_build_object('deal_version', deal_version, 'from_stage', existing_deal.stage, 'to_stage', requested_stage));
  end if;

  if requested_status is not null and requested_status <> existing_deal.operating_status then
    insert into public.deal_status_history (workspace_id, deal_id, from_status, to_status, reason, changed_by, idempotency_key)
    values (workspace_id, deal_id, existing_deal.operating_status, requested_status, reason, current_user_id, idempotency_key);
    insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
    values (workspace_id, deal_id, current_user_id, 'deal.status_changed', jsonb_build_object('deal_id', deal_id, 'deal_version', deal_version, 'from_status', existing_deal.operating_status, 'to_status', requested_status));
    insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
    values (workspace_id, deal_id, current_user_id, 'deal.status_changed', 'brix_deals', deal_id, jsonb_build_object('deal_version', deal_version, 'from_status', existing_deal.operating_status, 'to_status', requested_status));
  end if;

  update public.deal_command_requests
  set result = jsonb_build_object('deal_id', deal_id, 'deal_version', deal_version)
  where id = command.id;

  return next;
end;
$$;

create or replace function public.list_deal_projection(
  target_workspace_id uuid,
  page_size integer default 30,
  page_offset integer default 0,
  sort_direction text default 'desc'
)
returns table (
  deal_id uuid,
  deal_version integer,
  workspace_id uuid,
  display_name text,
  primary_property_id uuid,
  primary_property_version integer,
  primary_property_address text,
  stage text,
  status text,
  priority text,
  source text,
  strategy_intent text,
  updated_at timestamptz,
  open_work_count bigint,
  relationship_count bigint,
  next_due_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required to list Deals.' using errcode = '42501'; end if;
  if not public.is_workspace_member(target_workspace_id) then raise exception 'You do not have permission to list Deals in this BRIX account.' using errcode = '42501'; end if;

  return query
  with scoped_deals as (
    select deal.*
    from public.brix_deals deal
    where deal.workspace_id = target_workspace_id
      and deal.deleted_at is null
  ),
  counted as (
    select count(*) as total_count from scoped_deals
  )
  select
    deal.id,
    deal.version,
    deal.workspace_id,
    deal.display_name,
    property.id,
    property.version,
    property.display_address,
    deal.stage,
    deal.operating_status,
    deal.priority,
    deal.source,
    deal.strategy_intent,
    deal.updated_at,
    (
      select count(*) from public.tasks task
      where task.workspace_id = deal.workspace_id and task.deal_id = deal.id and task.archived_at is null and task.status not in ('completed', 'cancelled')
    ) + (
      select count(*) from public.deadlines deadline
      where deadline.workspace_id = deal.workspace_id and deadline.deal_id = deal.id and deadline.archived_at is null and deadline.status not in ('completed', 'cancelled')
    ) as open_work_count,
    (
      select count(*) from public.deal_relationships relationship
      where relationship.workspace_id = deal.workspace_id and relationship.deal_id = deal.id and relationship.archived_at is null and relationship.status <> 'removed'
    ) as relationship_count,
    (
      select min(due_value)
      from (
        select task.due_at as due_value from public.tasks task where task.workspace_id = deal.workspace_id and task.deal_id = deal.id and task.status not in ('completed', 'cancelled') and task.archived_at is null and task.due_at is not null
        union all
        select deadline.due_at from public.deadlines deadline where deadline.workspace_id = deal.workspace_id and deadline.deal_id = deal.id and deadline.status not in ('completed', 'cancelled') and deadline.archived_at is null and deadline.due_at is not null
      ) due_values
    ) as next_due_at,
    counted.total_count
  from scoped_deals deal
  cross join counted
  left join public.deal_properties deal_property on deal_property.workspace_id = deal.workspace_id and deal_property.deal_id = deal.id and deal_property.role = 'primary' and deal_property.inclusion_status = 'active'
  left join public.properties property on property.workspace_id = deal_property.workspace_id and property.id = deal_property.property_id
  order by
    case when lower(sort_direction) = 'asc' then deal.updated_at end asc,
    case when lower(sort_direction) <> 'asc' then deal.updated_at end desc,
    deal.id
  limit greatest(1, least(coalesce(page_size, 30), 100))
  offset greatest(0, coalesce(page_offset, 0));
end;
$$;

create or replace function public.load_deal_detail_projection(target_deal_id uuid)
returns table (
  deal_id uuid,
  deal_version integer,
  workspace_id uuid,
  display_name text,
  deal_type text,
  stage text,
  status text,
  priority text,
  source text,
  strategy_intent text,
  source_url text,
  source_text text,
  strategy_id text,
  facts jsonb,
  verification jsonb,
  deal_updated_at timestamptz,
  primary_property_id uuid,
  primary_property_version integer,
  primary_property_address text,
  primary_property_address_line1 text,
  primary_property_address_line2 text,
  primary_property_city text,
  primary_property_region text,
  primary_property_postal_code text,
  primary_property_country text,
  primary_property_parcel_identifier text,
  property_updated_at timestamptz,
  relationship_count bigint,
  open_task_count bigint,
  open_deadline_count bigint,
  pinned_note_count bigint,
  recent_event_count bigint,
  loaded_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_deal public.brix_deals%rowtype;
begin
  target_deal := public.authorized_deal_for_read(target_deal_id);
  return query
  select
    deal.id,
    deal.version,
    deal.workspace_id,
    deal.display_name,
    deal.deal_type,
    deal.stage,
    deal.operating_status,
    deal.priority,
    deal.source,
    deal.strategy_intent,
    deal.source_url,
    deal.source_text,
    deal.strategy_id,
    deal.facts,
    deal.verification,
    deal.updated_at,
    property.id,
    property.version,
    property.display_address,
    property.address_line1,
    property.address_line2,
    property.city,
    property.region,
    property.postal_code,
    property.country,
    property.parcel_identifier,
    property.updated_at,
    (select count(*) from public.deal_relationships relationship where relationship.workspace_id = deal.workspace_id and relationship.deal_id = deal.id and relationship.archived_at is null and relationship.status <> 'removed'),
    (select count(*) from public.tasks task where task.workspace_id = deal.workspace_id and task.deal_id = deal.id and task.archived_at is null and task.status not in ('completed', 'cancelled')),
    (select count(*) from public.deadlines deadline where deadline.workspace_id = deal.workspace_id and deadline.deal_id = deal.id and deadline.archived_at is null and deadline.status not in ('completed', 'cancelled')),
    (select count(*) from public.notes note where note.workspace_id = deal.workspace_id and note.deal_id = deal.id and note.archived_at is null and note.pinned is true),
    (select count(*) from public.domain_events event where event.workspace_id = deal.workspace_id and (event.deal_id = deal.id or event.payload ->> 'deal_id' = deal.id::text)),
    now()
  from public.brix_deals deal
  left join public.deal_properties deal_property on deal_property.workspace_id = deal.workspace_id and deal_property.deal_id = deal.id and deal_property.role = 'primary' and deal_property.inclusion_status = 'active'
  left join public.properties property on property.workspace_id = deal_property.workspace_id and property.id = deal_property.property_id
  where deal.id = target_deal.id;
end;
$$;

create or replace function public.load_property_summary(target_property_id uuid)
returns table (
  property_id uuid,
  property_version integer,
  workspace_id uuid,
  display_address text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text,
  parcel_identifier text,
  active_deal_count bigint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_property public.properties%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required to load a Property.' using errcode = '42501'; end if;
  select * into target_property from public.properties where id = target_property_id and deleted_at is null;
  if target_property.id is null then raise exception 'Property is not available.' using errcode = 'P0002'; end if;
  if not public.is_workspace_member(target_property.workspace_id) then raise exception 'You do not have permission to view this Property.' using errcode = '42501'; end if;
  return query
  select
    property.id,
    property.version,
    property.workspace_id,
    property.display_address,
    property.address_line1,
    property.address_line2,
    property.city,
    property.region,
    property.postal_code,
    property.country,
    property.parcel_identifier,
    (select count(*) from public.deal_properties deal_property join public.brix_deals deal on deal.workspace_id = deal_property.workspace_id and deal.id = deal_property.deal_id where deal_property.workspace_id = property.workspace_id and deal_property.property_id = property.id and deal.deleted_at is null and deal_property.inclusion_status = 'active'),
    property.updated_at
  from public.properties property
  where property.id = target_property.id;
end;
$$;

create or replace function public.load_active_deal_shell_projection(target_deal_id uuid)
returns table (
  deal_id uuid,
  deal_version integer,
  workspace_id uuid,
  display_name text,
  primary_property_address text,
  stage text,
  status text,
  priority text,
  open_work_count bigint,
  next_due_at timestamptz,
  updated_at timestamptz,
  loaded_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_deal public.brix_deals%rowtype;
begin
  target_deal := public.authorized_deal_for_read(target_deal_id);
  return query
  select
    detail.deal_id,
    detail.deal_version,
    detail.workspace_id,
    detail.display_name,
    detail.primary_property_address,
    detail.stage,
    detail.status,
    detail.priority,
    detail.open_task_count + detail.open_deadline_count,
    (
      select min(due_value)
      from (
        select task.due_at as due_value from public.tasks task where task.workspace_id = detail.workspace_id and task.deal_id = detail.deal_id and task.status not in ('completed', 'cancelled') and task.archived_at is null and task.due_at is not null
        union all
        select deadline.due_at from public.deadlines deadline where deadline.workspace_id = detail.workspace_id and deadline.deal_id = detail.deal_id and deadline.status not in ('completed', 'cancelled') and deadline.archived_at is null and deadline.due_at is not null
      ) due_values
    ),
    detail.deal_updated_at,
    now()
  from public.load_deal_detail_projection(target_deal.id) detail;
end;
$$;

revoke all on function public.authorized_deal_for_read(uuid) from public;
revoke all on function public.ensure_deal_command(uuid, uuid, uuid, text, text, jsonb) from public;
revoke all on function public.update_canonical_property(uuid, jsonb, integer, text) from public;
revoke all on function public.update_canonical_deal(uuid, jsonb, integer, text) from public;
revoke all on function public.update_deal_lifecycle(uuid, jsonb, integer, text) from public;
revoke all on function public.list_deal_projection(uuid, integer, integer, text) from public;
revoke all on function public.load_deal_detail_projection(uuid) from public;
revoke all on function public.load_property_summary(uuid) from public;
revoke all on function public.load_active_deal_shell_projection(uuid) from public;

grant execute on function public.update_canonical_property(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.update_canonical_deal(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.update_deal_lifecycle(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.list_deal_projection(uuid, integer, integer, text) to authenticated;
grant execute on function public.load_deal_detail_projection(uuid) to authenticated;
grant execute on function public.load_property_summary(uuid) to authenticated;
grant execute on function public.load_active_deal_shell_projection(uuid) to authenticated;

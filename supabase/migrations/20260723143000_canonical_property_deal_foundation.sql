-- Specification 003 slice 1: Canonical Property and Deal foundation.
-- Existing public.brix_deals is accepted as the production Deal table and expanded
-- in place so current Deal data is preserved while later slices move all writes
-- behind canonical server commands.

create extension if not exists pgcrypto;

create table if not exists public.deal_stage_definitions (
  stage_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_initial boolean not null default false,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_operating_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_initial boolean not null default false,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_property_role_definitions (
  role_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_property_inclusion_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

insert into public.deal_stage_definitions (stage_key, label, sort_order, is_initial, is_terminal)
values
  ('lead', 'Lead', 10, true, false),
  ('screening', 'Screening', 20, false, false),
  ('research', 'Research', 30, false, false),
  ('visit_planned', 'Visit Planned', 40, false, false),
  ('visited', 'Visited', 50, false, false),
  ('underwriting', 'Underwriting', 60, false, false),
  ('negotiation', 'Negotiation', 70, false, false),
  ('offer_preparation', 'Offer Preparation', 80, false, false),
  ('offer_submitted', 'Offer Submitted', 90, false, false),
  ('under_contract', 'Under Contract', 100, false, false),
  ('due_diligence', 'Due Diligence', 110, false, false),
  ('financing', 'Financing', 120, false, false),
  ('closing', 'Closing', 130, false, false),
  ('owned', 'Owned', 140, false, false),
  ('stabilizing', 'Stabilizing', 150, false, false),
  ('operating', 'Operating', 160, false, false),
  ('refinancing', 'Refinancing', 170, false, false),
  ('disposition', 'Disposition', 180, false, false),
  ('sold', 'Sold', 190, false, true),
  ('passed', 'Passed', 200, false, true),
  ('archived', 'Archived', 210, false, true)
on conflict (stage_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_initial = excluded.is_initial,
  is_terminal = excluded.is_terminal;

insert into public.deal_operating_status_definitions (status_key, label, sort_order, is_initial, is_terminal)
values
  ('active', 'Active', 10, true, false),
  ('needs_attention', 'Needs Attention', 20, false, false),
  ('waiting', 'Waiting', 30, false, false),
  ('blocked', 'Blocked', 40, false, false),
  ('on_hold', 'On Hold', 50, false, false),
  ('passed', 'Passed', 60, false, true),
  ('closed_won', 'Closed Won', 70, false, true),
  ('closed_lost', 'Closed Lost', 80, false, true),
  ('archived', 'Archived', 90, false, true),
  ('deleted_pending', 'Deleted Pending', 100, false, true)
on conflict (status_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_initial = excluded.is_initial,
  is_terminal = excluded.is_terminal;

insert into public.deal_property_role_definitions (role_key, label, sort_order)
values
  ('primary', 'Primary', 10),
  ('included', 'Included', 20),
  ('comparable', 'Comparable', 30),
  ('collateral', 'Collateral', 40),
  ('replacement', 'Replacement', 50),
  ('assemblage', 'Assemblage', 60),
  ('other', 'Other', 70)
on conflict (role_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

insert into public.deal_property_inclusion_status_definitions (status_key, label, sort_order)
values
  ('active', 'Active', 10),
  ('inactive', 'Inactive', 20),
  ('removed', 'Removed', 30)
on conflict (status_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  display_address text not null,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text not null default 'US',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  parcel_identifier text,
  source_identifiers jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_display_address_not_blank check (length(btrim(display_address)) > 0),
  constraint properties_country_not_blank check (length(btrim(country)) = 2),
  constraint properties_source_identifiers_object check (jsonb_typeof(source_identifiers) = 'object')
);

create index if not exists idx_properties_workspace_updated
  on public.properties(workspace_id, updated_at desc);

create index if not exists idx_properties_workspace_address
  on public.properties(workspace_id, lower(display_address));

create unique index if not exists idx_properties_workspace_id
  on public.properties(workspace_id, id);

alter table public.brix_deals
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists display_name text,
  add column if not exists deal_type text not null default 'acquisition',
  add column if not exists stage text not null default 'lead',
  add column if not exists operating_status text not null default 'active',
  add column if not exists priority text not null default 'normal',
  add column if not exists source text not null default 'manual',
  add column if not exists strategy_intent text,
  add column if not exists archived_at timestamptz,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists version integer not null default 1;

insert into public.workspaces (name, owner_user_id)
select
  coalesce(nullif(split_part(users.email, '@', 1), ''), 'Investor') || '''s BRIX Workspace',
  users.id
from auth.users users
where exists (
  select 1
  from public.brix_deals deal
  where deal.owner_id = users.id
)
and not exists (
  select 1
  from public.workspace_memberships membership
  join public.workspaces workspace on workspace.id = membership.workspace_id
  where membership.user_id = users.id
    and membership.status = 'active'
    and workspace.status = 'active'
);

insert into public.workspace_memberships (workspace_id, user_id, role_id, status, accepted_at)
select workspace.id, workspace.owner_user_id, 'owner', 'active', now()
from public.workspaces workspace
where exists (
  select 1
  from public.brix_deals deal
  where deal.owner_id = workspace.owner_user_id
)
and not exists (
  select 1
  from public.workspace_memberships membership
  where membership.workspace_id = workspace.id
    and membership.user_id = workspace.owner_user_id
);

update public.brix_deals deal
set
  workspace_id = membership.workspace_id,
  display_name = coalesce(nullif(deal.display_name, ''), deal.address),
  created_by = coalesce(deal.created_by, deal.owner_id),
  updated_by = coalesce(deal.updated_by, deal.owner_id),
  strategy_intent = coalesce(deal.strategy_intent, deal.strategy_id),
  stage = coalesce(nullif(deal.stage, ''), 'lead'),
  operating_status = coalesce(nullif(deal.operating_status, ''), 'active')
from (
  select distinct on (membership.user_id)
    membership.user_id,
    membership.workspace_id
  from public.workspace_memberships membership
  join public.workspaces workspace on workspace.id = membership.workspace_id
  where membership.status = 'active'
    and workspace.status = 'active'
  order by
    membership.user_id,
    case membership.role_id when 'owner' then 0 when 'admin' then 1 else 2 end,
    membership.created_at
) membership
where deal.owner_id = membership.user_id
  and deal.workspace_id is null;

alter table public.brix_deals
  alter column workspace_id set not null,
  alter column display_name set not null,
  alter column created_by set default auth.uid(),
  alter column updated_by set default auth.uid();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'brix_deals_stage_fk'
      and conrelid = 'public.brix_deals'::regclass
  ) then
    alter table public.brix_deals
      add constraint brix_deals_stage_fk
      foreign key (stage) references public.deal_stage_definitions(stage_key);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'brix_deals_operating_status_fk'
      and conrelid = 'public.brix_deals'::regclass
  ) then
    alter table public.brix_deals
      add constraint brix_deals_operating_status_fk
      foreign key (operating_status) references public.deal_operating_status_definitions(status_key);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'brix_deals_workspace_id_id_unique'
      and conrelid = 'public.brix_deals'::regclass
  ) then
    alter table public.brix_deals
      add constraint brix_deals_workspace_id_id_unique unique (workspace_id, id);
  end if;
end $$;

create index if not exists idx_brix_deals_workspace_updated
  on public.brix_deals(workspace_id, updated_at desc)
  where deleted_at is null;

create index if not exists idx_brix_deals_workspace_stage_status
  on public.brix_deals(workspace_id, stage, operating_status)
  where deleted_at is null;

create table if not exists public.deal_properties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  deal_id uuid not null,
  property_id uuid not null,
  role text not null default 'primary',
  inclusion_status text not null default 'active',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deal_properties_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint deal_properties_property_fk foreign key (workspace_id, property_id)
    references public.properties(workspace_id, id) on delete restrict,
  constraint deal_properties_role_fk foreign key (role)
    references public.deal_property_role_definitions(role_key),
  constraint deal_properties_inclusion_status_fk foreign key (inclusion_status)
    references public.deal_property_inclusion_status_definitions(status_key)
);

create unique index if not exists idx_deal_properties_one_active_primary
  on public.deal_properties(deal_id)
  where role = 'primary' and inclusion_status = 'active';

create unique index if not exists idx_deal_properties_no_duplicate_active_relationship
  on public.deal_properties(deal_id, property_id, role)
  where inclusion_status = 'active';

create index if not exists idx_deal_properties_workspace_deal
  on public.deal_properties(workspace_id, deal_id);

create index if not exists idx_deal_properties_workspace_property
  on public.deal_properties(workspace_id, property_id);

create table if not exists public.deal_stage_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  deal_id uuid not null,
  from_stage text references public.deal_stage_definitions(stage_key),
  to_stage text not null references public.deal_stage_definitions(stage_key),
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  idempotency_key text,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint deal_stage_history_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade
);

create table if not exists public.deal_status_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  deal_id uuid not null,
  from_status text references public.deal_operating_status_definitions(status_key),
  to_status text not null references public.deal_operating_status_definitions(status_key),
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  idempotency_key text,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint deal_status_history_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade
);

create unique index if not exists idx_deal_stage_history_idempotent
  on public.deal_stage_history(workspace_id, deal_id, idempotency_key)
  where idempotency_key is not null;

create unique index if not exists idx_deal_status_history_idempotent
  on public.deal_status_history(workspace_id, deal_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.deal_creation_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  property_id uuid,
  deal_id uuid,
  deal_property_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index if not exists idx_deal_creation_requests_created_by
  on public.deal_creation_requests(created_by, created_at desc);

create or replace function public.touch_versioned_record()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.version = coalesce(old.version, 1) + 1;
  return new;
end;
$$;

drop trigger if exists touch_properties_versioned on public.properties;
create trigger touch_properties_versioned
before update on public.properties
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_brix_deals_versioned on public.brix_deals;
create trigger touch_brix_deals_versioned
before update on public.brix_deals
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_deal_properties_versioned on public.deal_properties;
create trigger touch_deal_properties_versioned
before update on public.deal_properties
for each row execute function public.touch_versioned_record();

insert into public.properties (
  workspace_id,
  display_address,
  address_line1,
  city,
  region,
  postal_code,
  source_identifiers,
  created_by,
  updated_by,
  created_at,
  updated_at
)
select
  deal.workspace_id,
  deal.address,
  deal.address,
  deal.city,
  deal.state,
  deal.zip,
  jsonb_build_object('legacy_brix_deal_id', deal.id),
  deal.created_by,
  deal.updated_by,
  deal.created_at,
  deal.updated_at
from public.brix_deals deal
where deal.workspace_id is not null
  and deal.address is not null
  and length(btrim(deal.address)) > 0
  and not exists (
    select 1
    from public.deal_properties relationship
    where relationship.deal_id = deal.id
      and relationship.role = 'primary'
      and relationship.inclusion_status = 'active'
  );

insert into public.deal_properties (
  workspace_id,
  deal_id,
  property_id,
  role,
  inclusion_status,
  created_by,
  updated_by,
  created_at,
  updated_at
)
select
  deal.workspace_id,
  deal.id,
  property.id,
  'primary',
  'active',
  deal.created_by,
  deal.updated_by,
  deal.created_at,
  deal.updated_at
from public.brix_deals deal
join public.properties property
  on property.workspace_id = deal.workspace_id
 and property.source_identifiers ->> 'legacy_brix_deal_id' = deal.id::text
where not exists (
  select 1
  from public.deal_properties relationship
  where relationship.deal_id = deal.id
    and relationship.role = 'primary'
    and relationship.inclusion_status = 'active'
);

insert into public.deal_stage_history (workspace_id, deal_id, from_stage, to_stage, reason, changed_by, idempotency_key, changed_at)
select deal.workspace_id, deal.id, null, deal.stage, 'canonical_foundation_backfill', deal.created_by, 'backfill:' || deal.id::text, deal.created_at
from public.brix_deals deal
where not exists (
  select 1
  from public.deal_stage_history history
  where history.deal_id = deal.id
    and history.idempotency_key = 'backfill:' || deal.id::text
);

insert into public.deal_status_history (workspace_id, deal_id, from_status, to_status, reason, changed_by, idempotency_key, changed_at)
select deal.workspace_id, deal.id, null, deal.operating_status, 'canonical_foundation_backfill', deal.created_by, 'backfill:' || deal.id::text, deal.created_at
from public.brix_deals deal
where not exists (
  select 1
  from public.deal_status_history history
  where history.deal_id = deal.id
    and history.idempotency_key = 'backfill:' || deal.id::text
);

alter table public.properties enable row level security;
alter table public.deal_properties enable row level security;
alter table public.deal_stage_definitions enable row level security;
alter table public.deal_operating_status_definitions enable row level security;
alter table public.deal_property_role_definitions enable row level security;
alter table public.deal_property_inclusion_status_definitions enable row level security;
alter table public.deal_stage_history enable row level security;
alter table public.deal_status_history enable row level security;
alter table public.deal_creation_requests enable row level security;

drop policy if exists "property definitions readable" on public.deal_stage_definitions;
create policy "property definitions readable"
  on public.deal_stage_definitions for select to authenticated
  using (true);

drop policy if exists "operating status definitions readable" on public.deal_operating_status_definitions;
create policy "operating status definitions readable"
  on public.deal_operating_status_definitions for select to authenticated
  using (true);

drop policy if exists "relationship role definitions readable" on public.deal_property_role_definitions;
create policy "relationship role definitions readable"
  on public.deal_property_role_definitions for select to authenticated
  using (true);

drop policy if exists "relationship inclusion definitions readable" on public.deal_property_inclusion_status_definitions;
create policy "relationship inclusion definitions readable"
  on public.deal_property_inclusion_status_definitions for select to authenticated
  using (true);

drop policy if exists "properties read workspace members" on public.properties;
create policy "properties read workspace members"
  on public.properties for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "properties no direct insert" on public.properties;
create policy "properties no direct insert"
  on public.properties for insert to authenticated
  with check (false);

drop policy if exists "properties no direct update" on public.properties;
create policy "properties no direct update"
  on public.properties for update to authenticated
  using (false)
  with check (false);

drop policy if exists "properties no direct delete" on public.properties;
create policy "properties no direct delete"
  on public.properties for delete to authenticated
  using (false);

drop policy if exists "deal properties read workspace members" on public.deal_properties;
create policy "deal properties read workspace members"
  on public.deal_properties for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "deal properties no direct insert" on public.deal_properties;
create policy "deal properties no direct insert"
  on public.deal_properties for insert to authenticated
  with check (false);

drop policy if exists "deal properties no direct update" on public.deal_properties;
create policy "deal properties no direct update"
  on public.deal_properties for update to authenticated
  using (false)
  with check (false);

drop policy if exists "deal properties no direct delete" on public.deal_properties;
create policy "deal properties no direct delete"
  on public.deal_properties for delete to authenticated
  using (false);

drop policy if exists "deal stage history read workspace members" on public.deal_stage_history;
create policy "deal stage history read workspace members"
  on public.deal_stage_history for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "deal stage history no direct insert" on public.deal_stage_history;
create policy "deal stage history no direct insert"
  on public.deal_stage_history for insert to authenticated
  with check (false);

drop policy if exists "deal status history read workspace members" on public.deal_status_history;
create policy "deal status history read workspace members"
  on public.deal_status_history for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "deal status history no direct insert" on public.deal_status_history;
create policy "deal status history no direct insert"
  on public.deal_status_history for insert to authenticated
  with check (false);

drop policy if exists "deal creation requests read creator" on public.deal_creation_requests;
create policy "deal creation requests read creator"
  on public.deal_creation_requests for select to authenticated
  using (created_by = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "deal creation requests no direct insert" on public.deal_creation_requests;
create policy "deal creation requests no direct insert"
  on public.deal_creation_requests for insert to authenticated
  with check (false);

drop policy if exists "brix deals select owner" on public.brix_deals;
drop policy if exists "brix deals select workspace members" on public.brix_deals;
create policy "brix deals select workspace members"
  on public.brix_deals for select to authenticated
  using (owner_id = auth.uid() or public.is_workspace_member(workspace_id));

drop policy if exists "brix deals insert owner" on public.brix_deals;
drop policy if exists "brix deals no direct insert" on public.brix_deals;
create policy "brix deals no direct insert"
  on public.brix_deals for insert to authenticated
  with check (false);

drop policy if exists "brix deals update owner" on public.brix_deals;
drop policy if exists "brix deals update authorized workspace" on public.brix_deals;
create policy "brix deals update authorized workspace"
  on public.brix_deals for update to authenticated
  using (owner_id = auth.uid() or public.has_workspace_permission(workspace_id, 'deals:manage'))
  with check (owner_id = auth.uid() or public.has_workspace_permission(workspace_id, 'deals:manage'));

create or replace function public.create_canonical_deal(
  target_workspace_id uuid,
  idempotency_key text,
  property_input jsonb default '{}'::jsonb,
  deal_input jsonb default '{}'::jsonb,
  existing_property_id uuid default null
)
returns table (
  property_id uuid,
  property_version integer,
  deal_id uuid,
  deal_version integer,
  deal_property_id uuid,
  deal_property_version integer,
  stage text,
  status text,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  property_display text;
  property_address_line1 text;
  request_hash text;
  existing_request public.deal_creation_requests%rowtype;
  new_property_created boolean := false;
begin
  if current_user_id is null then
    raise exception 'Authentication required to create a Deal.' using errcode = '42501';
  end if;

  if cleaned_key is null then
    raise exception 'A retry key is required to safely create a Deal.' using errcode = '22023';
  end if;

  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to create Deals in this BRIX workspace.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.workspaces where id = target_workspace_id and status = 'active') then
    raise exception 'Workspace is not available.' using errcode = 'P0002';
  end if;

  request_hash := md5(
    target_workspace_id::text ||
    cleaned_key ||
    coalesce(existing_property_id::text, '') ||
    coalesce(property_input::text, '{}') ||
    coalesce(deal_input::text, '{}')
  );

  insert into public.deal_creation_requests (workspace_id, idempotency_key, request_hash, created_by)
  values (target_workspace_id, cleaned_key, request_hash, current_user_id)
  on conflict (workspace_id, idempotency_key) do nothing;

  select *
  into existing_request
  from public.deal_creation_requests
  where workspace_id = target_workspace_id
    and idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash then
    raise exception 'This Deal creation request has already been used with different data.' using errcode = '23505';
  end if;

  if existing_request.deal_id is not null then
    select
      property.id,
      property.version,
      deal.id,
      deal.version,
      relationship.id,
      relationship.version,
      deal.stage,
      deal.operating_status,
      cleaned_key
    into
      property_id,
      property_version,
      deal_id,
      deal_version,
      deal_property_id,
      deal_property_version,
      stage,
      status,
      idempotency_key_out
    from public.brix_deals deal
    join public.deal_properties relationship
      on relationship.deal_id = deal.id
     and relationship.role = 'primary'
     and relationship.inclusion_status = 'active'
    join public.properties property on property.id = relationship.property_id
    where deal.id = existing_request.deal_id
      and deal.workspace_id = target_workspace_id;
    return next;
    return;
  end if;

  if existing_property_id is not null then
    select id, version, display_address
    into property_id, property_version, property_display
    from public.properties
    where id = existing_property_id
      and workspace_id = target_workspace_id
      and deleted_at is null
    for update;

    if property_id is null then
      raise exception 'The selected Property is not available in this BRIX workspace.' using errcode = 'P0002';
    end if;
  else
    property_display := nullif(btrim(coalesce(
      property_input ->> 'display_address',
      property_input ->> 'address',
      property_input ->> 'address_line1',
      deal_input ->> 'address',
      ''
    )), '');

    if property_display is null then
      raise exception 'A Property address is required to create a Deal.' using errcode = '22023';
    end if;

    property_address_line1 := nullif(btrim(coalesce(property_input ->> 'address_line1', property_display)), '');

    insert into public.properties (
      workspace_id,
      display_address,
      address_line1,
      address_line2,
      city,
      region,
      postal_code,
      country,
      latitude,
      longitude,
      parcel_identifier,
      source_identifiers,
      created_by,
      updated_by
    )
    values (
      target_workspace_id,
      property_display,
      property_address_line1,
      nullif(btrim(coalesce(property_input ->> 'address_line2', '')), ''),
      nullif(btrim(coalesce(property_input ->> 'city', deal_input ->> 'city', '')), ''),
      upper(nullif(btrim(coalesce(property_input ->> 'region', property_input ->> 'state', deal_input ->> 'state', '')), '')),
      nullif(btrim(coalesce(property_input ->> 'postal_code', property_input ->> 'zip', deal_input ->> 'zip', '')), ''),
      upper(coalesce(nullif(btrim(property_input ->> 'country'), ''), 'US')),
      nullif(property_input ->> 'latitude', '')::numeric,
      nullif(property_input ->> 'longitude', '')::numeric,
      nullif(btrim(coalesce(property_input ->> 'parcel_identifier', '')), ''),
      case
        when jsonb_typeof(coalesce(property_input -> 'source_identifiers', '{}'::jsonb)) = 'object'
          then coalesce(property_input -> 'source_identifiers', '{}'::jsonb)
        else '{}'::jsonb
      end,
      current_user_id,
      current_user_id
    )
    returning id, version into property_id, property_version;

    new_property_created := true;
  end if;

  insert into public.brix_deals (
    id,
    owner_id,
    workspace_id,
    display_name,
    deal_type,
    stage,
    operating_status,
    priority,
    source,
    strategy_intent,
    status,
    source_url,
    source_text,
    address,
    city,
    state,
    zip,
    county,
    strategy_id,
    facts,
    verification,
    analysis,
    created_by,
    updated_by
  )
  values (
    coalesce(nullif(btrim(deal_input ->> 'id'), '')::uuid, gen_random_uuid()),
    current_user_id,
    target_workspace_id,
    coalesce(nullif(btrim(deal_input ->> 'display_name'), ''), property_display, deal_input ->> 'address'),
    coalesce(nullif(btrim(deal_input ->> 'deal_type'), ''), 'acquisition'),
    'lead',
    'active',
    coalesce(nullif(btrim(deal_input ->> 'priority'), ''), 'normal'),
    coalesce(nullif(btrim(deal_input ->> 'source'), ''), 'manual'),
    nullif(btrim(coalesce(deal_input ->> 'strategy_intent', deal_input ->> 'strategy_id', '')), ''),
    'draft'::public.brix_deal_status,
    nullif(btrim(coalesce(deal_input ->> 'source_url', '')), ''),
    nullif(btrim(coalesce(deal_input ->> 'source_text', '')), ''),
    coalesce(property_display, deal_input ->> 'address'),
    nullif(btrim(coalesce(deal_input ->> 'city', property_input ->> 'city', '')), ''),
    upper(nullif(btrim(coalesce(deal_input ->> 'state', property_input ->> 'region', property_input ->> 'state', '')), '')),
    nullif(btrim(coalesce(deal_input ->> 'zip', property_input ->> 'postal_code', property_input ->> 'zip', '')), ''),
    nullif(btrim(coalesce(deal_input ->> 'county', '')), ''),
    coalesce(nullif(btrim(deal_input ->> 'strategy_id'), ''), 'owner_occupant'),
    coalesce(deal_input -> 'facts', '{}'::jsonb),
    coalesce(deal_input -> 'verification', '{}'::jsonb),
    '{}'::jsonb,
    current_user_id,
    current_user_id
  )
  returning id, version, stage, operating_status
  into deal_id, deal_version, stage, status;

  insert into public.deal_properties (
    workspace_id,
    deal_id,
    property_id,
    role,
    inclusion_status,
    created_by,
    updated_by
  )
  values (
    target_workspace_id,
    deal_id,
    property_id,
    'primary',
    'active',
    current_user_id,
    current_user_id
  )
  returning id, version into deal_property_id, deal_property_version;

  insert into public.deal_stage_history (workspace_id, deal_id, from_stage, to_stage, reason, changed_by, idempotency_key)
  values (target_workspace_id, deal_id, null, stage, 'deal_created', current_user_id, cleaned_key);

  insert into public.deal_status_history (workspace_id, deal_id, from_status, to_status, reason, changed_by, idempotency_key)
  values (target_workspace_id, deal_id, null, status, 'deal_created', current_user_id, cleaned_key);

  if new_property_created then
    insert into public.domain_events (workspace_id, actor_id, event_type, payload)
    values (
      target_workspace_id,
      current_user_id,
      'property.created',
      jsonb_build_object('property_id', property_id, 'property_version', property_version)
    );

    insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
    values (
      target_workspace_id,
      current_user_id,
      'property.created',
      'properties',
      property_id,
      jsonb_build_object('property_version', property_version)
    );
  end if;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (
    target_workspace_id,
    current_user_id,
    'deal.created',
    jsonb_build_object(
      'deal_id', deal_id,
      'deal_version', deal_version,
      'property_id', property_id,
      'deal_property_id', deal_property_id,
      'stage', stage,
      'status', status
    )
  );

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (
    target_workspace_id,
    current_user_id,
    'deal.created',
    'brix_deals',
    deal_id,
    jsonb_build_object(
      'deal_version', deal_version,
      'property_id', property_id,
      'deal_property_id', deal_property_id,
      'stage', stage,
      'status', status
    )
  );

  update public.deal_creation_requests
  set property_id = create_canonical_deal.property_id,
      deal_id = create_canonical_deal.deal_id,
      deal_property_id = create_canonical_deal.deal_property_id
  where workspace_id = target_workspace_id
    and idempotency_key = cleaned_key;

  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

revoke all on function public.create_canonical_deal(uuid, text, jsonb, jsonb, uuid) from public;
grant execute on function public.create_canonical_deal(uuid, text, jsonb, jsonb, uuid) to authenticated;

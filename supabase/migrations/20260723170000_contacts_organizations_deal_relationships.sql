-- Specification 003 slice 2: Contacts, Organizations, and Deal Relationships.
-- This establishes one canonical workspace-scoped relationship system for Deals.

create extension if not exists pgcrypto;

create table if not exists public.deal_relationship_role_definitions (
  role_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.deal_relationship_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.deal_relationship_role_definitions (role_key, label, sort_order)
values
  ('buyer_investor', 'Buyer / Investor', 10),
  ('seller_owner', 'Seller / Owner', 20),
  ('listing_broker', 'Listing Broker', 30),
  ('buyer_broker', 'Buyer Broker', 40),
  ('property_manager', 'Property Manager', 50),
  ('lender', 'Lender', 60),
  ('mortgage_broker', 'Mortgage Broker', 70),
  ('attorney', 'Attorney', 80),
  ('title_escrow', 'Title / Escrow', 90),
  ('inspector', 'Inspector', 100),
  ('appraiser', 'Appraiser', 110),
  ('contractor', 'Contractor', 120),
  ('architect_engineer', 'Architect / Engineer', 130),
  ('insurance_professional', 'Insurance Professional', 140),
  ('association_manager', 'Association Manager', 150),
  ('tenant', 'Tenant', 160),
  ('partner_investor', 'Partner / Investor', 170),
  ('other', 'Other', 180)
on conflict (role_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

insert into public.deal_relationship_status_definitions (status_key, label, sort_order, is_active)
values
  ('active', 'Active', 10, true),
  ('prospective', 'Prospective', 20, true),
  ('inactive', 'Inactive', 30, false),
  ('removed', 'Removed', 40, false)
on conflict (status_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text not null,
  primary_email text,
  normalized_email text,
  primary_phone text,
  normalized_phone text,
  preferred_contact_method text,
  notes text,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint contacts_preferred_method_allowed check (
    preferred_contact_method is null
    or preferred_contact_method in ('email', 'phone', 'text', 'unknown')
  )
);

create unique index if not exists idx_contacts_workspace_id
  on public.contacts(workspace_id, id);

create index if not exists idx_contacts_workspace_updated
  on public.contacts(workspace_id, updated_at desc)
  where archived_at is null;

create index if not exists idx_contacts_workspace_normalized_email
  on public.contacts(workspace_id, normalized_email)
  where normalized_email is not null and archived_at is null;

create index if not exists idx_contacts_workspace_normalized_phone
  on public.contacts(workspace_id, normalized_phone)
  where normalized_phone is not null and archived_at is null;

create index if not exists idx_contacts_workspace_display_name
  on public.contacts(workspace_id, lower(display_name))
  where archived_at is null;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  display_name text not null,
  legal_name text,
  organization_type text,
  primary_email text,
  normalized_email text,
  primary_phone text,
  normalized_phone text,
  website text,
  normalized_website_domain text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text not null default 'US',
  notes text,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint organizations_country_code check (length(btrim(country)) = 2)
);

create unique index if not exists idx_organizations_workspace_id
  on public.organizations(workspace_id, id);

create index if not exists idx_organizations_workspace_updated
  on public.organizations(workspace_id, updated_at desc)
  where archived_at is null;

create index if not exists idx_organizations_workspace_display_name
  on public.organizations(workspace_id, lower(display_name))
  where archived_at is null;

create index if not exists idx_organizations_workspace_legal_name
  on public.organizations(workspace_id, lower(legal_name))
  where legal_name is not null and archived_at is null;

create index if not exists idx_organizations_workspace_domain
  on public.organizations(workspace_id, normalized_website_domain)
  where normalized_website_domain is not null and archived_at is null;

create index if not exists idx_organizations_workspace_phone
  on public.organizations(workspace_id, normalized_phone)
  where normalized_phone is not null and archived_at is null;

create table if not exists public.deal_relationships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  contact_id uuid,
  organization_id uuid,
  role text not null references public.deal_relationship_role_definitions(role_key),
  status text not null default 'active' references public.deal_relationship_status_definitions(status_key),
  is_primary boolean not null default false,
  notes text,
  communication_preference text,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deal_relationships_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint deal_relationships_contact_fk foreign key (workspace_id, contact_id)
    references public.contacts(workspace_id, id) on delete restrict,
  constraint deal_relationships_organization_fk foreign key (workspace_id, organization_id)
    references public.organizations(workspace_id, id) on delete restrict,
  constraint deal_relationships_exactly_one_target check (
    (contact_id is not null and organization_id is null)
    or (contact_id is null and organization_id is not null)
  ),
  constraint deal_relationships_communication_allowed check (
    communication_preference is null
    or communication_preference in ('email', 'phone', 'text', 'unknown')
  )
);

create unique index if not exists idx_deal_relationships_active_contact_role
  on public.deal_relationships(deal_id, contact_id, role)
  where contact_id is not null and archived_at is null and status <> 'removed';

create unique index if not exists idx_deal_relationships_active_organization_role
  on public.deal_relationships(deal_id, organization_id, role)
  where organization_id is not null and archived_at is null and status <> 'removed';

create index if not exists idx_deal_relationships_workspace_deal
  on public.deal_relationships(workspace_id, deal_id, updated_at desc);

create index if not exists idx_deal_relationships_workspace_contact
  on public.deal_relationships(workspace_id, contact_id)
  where contact_id is not null;

create index if not exists idx_deal_relationships_workspace_organization
  on public.deal_relationships(workspace_id, organization_id)
  where organization_id is not null;

create table if not exists public.relationship_command_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  command_name text not null,
  idempotency_key text not null,
  request_hash text not null,
  contact_id uuid,
  organization_id uuid,
  relationship_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, command_name, idempotency_key)
);

create index if not exists idx_relationship_command_requests_created_by
  on public.relationship_command_requests(created_by, created_at desc);

drop trigger if exists touch_contacts_versioned on public.contacts;
create trigger touch_contacts_versioned
before update on public.contacts
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_organizations_versioned on public.organizations;
create trigger touch_organizations_versioned
before update on public.organizations
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_deal_relationships_versioned on public.deal_relationships;
create trigger touch_deal_relationships_versioned
before update on public.deal_relationships
for each row execute function public.touch_versioned_record();

create or replace function public.normalize_contact_phone(raw_phone text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(raw_phone, ''), '[^0-9]+', '', 'g'), '')
$$;

create or replace function public.normalize_website_domain(raw_website text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(lower(regexp_replace(coalesce(raw_website, ''), '^https?://', '', 'i')), '^www\.', ''), '')
$$;

create or replace function public.relationship_workspace_for_deal(target_deal_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select workspace_id
  from public.brix_deals
  where id = target_deal_id
    and deleted_at is null
  limit 1
$$;

create or replace function public.find_contact_candidates(
  target_workspace_id uuid,
  contact_input jsonb default '{}'::jsonb
)
returns table (
  contact_id uuid,
  display_name text,
  primary_email text,
  primary_phone text,
  version integer,
  match_reasons text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  wanted_email text := lower(nullif(btrim(coalesce(contact_input ->> 'primary_email', contact_input ->> 'email', '')), ''));
  wanted_phone text := public.normalize_contact_phone(coalesce(contact_input ->> 'primary_phone', contact_input ->> 'phone', ''));
  wanted_name text := lower(nullif(btrim(coalesce(contact_input ->> 'display_name', contact_input ->> 'name', '')), ''));
begin
  if current_user_id is null then
    raise exception 'Authentication required to search contacts.' using errcode = '42501';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'You do not have access to this BRIX workspace.' using errcode = '42501';
  end if;

  return query
  select
    contact.id,
    contact.display_name,
    contact.primary_email,
    contact.primary_phone,
    contact.version,
    array_remove(array[
      case when wanted_email is not null and contact.normalized_email = wanted_email then 'email' end,
      case when wanted_phone is not null and contact.normalized_phone = wanted_phone then 'phone' end,
      case when wanted_name is not null and lower(contact.display_name) = wanted_name then 'name' end
    ], null)::text[]
  from public.contacts contact
  where contact.workspace_id = target_workspace_id
    and contact.archived_at is null
    and (
      (wanted_email is not null and contact.normalized_email = wanted_email)
      or (wanted_phone is not null and contact.normalized_phone = wanted_phone)
      or (wanted_name is not null and lower(contact.display_name) = wanted_name)
    )
  order by contact.updated_at desc
  limit 10;
end;
$$;

create or replace function public.find_organization_candidates(
  target_workspace_id uuid,
  organization_input jsonb default '{}'::jsonb
)
returns table (
  organization_id uuid,
  display_name text,
  legal_name text,
  primary_phone text,
  website text,
  version integer,
  match_reasons text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  wanted_name text := lower(nullif(btrim(coalesce(organization_input ->> 'display_name', organization_input ->> 'name', '')), ''));
  wanted_legal text := lower(nullif(btrim(coalesce(organization_input ->> 'legal_name', '')), ''));
  wanted_phone text := public.normalize_contact_phone(coalesce(organization_input ->> 'primary_phone', organization_input ->> 'phone', ''));
  wanted_domain text := public.normalize_website_domain(coalesce(organization_input ->> 'website', ''));
begin
  if current_user_id is null then
    raise exception 'Authentication required to search organizations.' using errcode = '42501';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'You do not have access to this BRIX workspace.' using errcode = '42501';
  end if;

  return query
  select
    organization.id,
    organization.display_name,
    organization.legal_name,
    organization.primary_phone,
    organization.website,
    organization.version,
    array_remove(array[
      case when wanted_name is not null and lower(organization.display_name) = wanted_name then 'name' end,
      case when wanted_legal is not null and lower(organization.legal_name) = wanted_legal then 'legal_name' end,
      case when wanted_phone is not null and organization.normalized_phone = wanted_phone then 'phone' end,
      case when wanted_domain is not null and organization.normalized_website_domain = wanted_domain then 'website' end
    ], null)::text[]
  from public.organizations organization
  where organization.workspace_id = target_workspace_id
    and organization.archived_at is null
    and (
      (wanted_name is not null and lower(organization.display_name) = wanted_name)
      or (wanted_legal is not null and lower(organization.legal_name) = wanted_legal)
      or (wanted_phone is not null and organization.normalized_phone = wanted_phone)
      or (wanted_domain is not null and organization.normalized_website_domain = wanted_domain)
    )
  order by organization.updated_at desc
  limit 10;
end;
$$;

create or replace function public.create_brix_contact(
  target_workspace_id uuid,
  contact_input jsonb default '{}'::jsonb,
  idempotency_key text default null
)
returns table (
  contact_id uuid,
  contact_version integer,
  duplicate_candidates jsonb,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  request_hash text;
  existing_request public.relationship_command_requests%rowtype;
  contact_name text := nullif(btrim(coalesce(contact_input ->> 'display_name', contact_input ->> 'name', '')), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required to create a contact.' using errcode = '42501';
  end if;

  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to manage Deal relationships in this BRIX workspace.' using errcode = '42501';
  end if;

  if contact_name is null then
    raise exception 'A contact name is required.' using errcode = '22023';
  end if;

  cleaned_key := coalesce(cleaned_key, 'contact:create:' || md5(target_workspace_id::text || contact_input::text || current_user_id::text));
  request_hash := md5(target_workspace_id::text || cleaned_key || contact_input::text);

  insert into public.relationship_command_requests (workspace_id, command_name, idempotency_key, request_hash, created_by)
  values (target_workspace_id, 'contact.create', cleaned_key, request_hash, current_user_id)
  on conflict (workspace_id, command_name, idempotency_key) do nothing;

  select *
  into existing_request
  from public.relationship_command_requests
  where workspace_id = target_workspace_id
    and command_name = 'contact.create'
    and idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash then
    raise exception 'This contact creation request has already been used with different data.' using errcode = '23505';
  end if;

  if existing_request.contact_id is not null then
    select contact.id, contact.version
    into contact_id, contact_version
    from public.contacts contact
    where contact.id = existing_request.contact_id
      and contact.workspace_id = target_workspace_id;
    duplicate_candidates := '[]'::jsonb;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  select coalesce(jsonb_agg(to_jsonb(candidate)), '[]'::jsonb)
  into duplicate_candidates
  from public.find_contact_candidates(target_workspace_id, contact_input) candidate;

  insert into public.contacts (
    workspace_id,
    first_name,
    last_name,
    display_name,
    primary_email,
    normalized_email,
    primary_phone,
    normalized_phone,
    preferred_contact_method,
    notes,
    created_by,
    updated_by
  )
  values (
    target_workspace_id,
    nullif(btrim(coalesce(contact_input ->> 'first_name', '')), ''),
    nullif(btrim(coalesce(contact_input ->> 'last_name', '')), ''),
    contact_name,
    nullif(btrim(coalesce(contact_input ->> 'primary_email', contact_input ->> 'email', '')), ''),
    lower(nullif(btrim(coalesce(contact_input ->> 'primary_email', contact_input ->> 'email', '')), '')),
    nullif(btrim(coalesce(contact_input ->> 'primary_phone', contact_input ->> 'phone', '')), ''),
    public.normalize_contact_phone(coalesce(contact_input ->> 'primary_phone', contact_input ->> 'phone', '')),
    coalesce(nullif(btrim(contact_input ->> 'preferred_contact_method'), ''), 'unknown'),
    nullif(btrim(coalesce(contact_input ->> 'notes', '')), ''),
    current_user_id,
    current_user_id
  )
  returning id, version into contact_id, contact_version;

  update public.relationship_command_requests
  set contact_id = create_brix_contact.contact_id
  where id = existing_request.id;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (target_workspace_id, current_user_id, 'contact.created', jsonb_build_object('contact_id', contact_id, 'contact_version', contact_version));

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (target_workspace_id, current_user_id, 'contact.created', 'contacts', contact_id, jsonb_build_object('contact_version', contact_version));

  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace function public.update_brix_contact(
  target_contact_id uuid,
  expected_version integer,
  contact_input jsonb default '{}'::jsonb
)
returns table (contact_id uuid, contact_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_contact public.contacts%rowtype;
  before_state jsonb;
  next_display_name text;
begin
  if current_user_id is null then
    raise exception 'Authentication required to update a contact.' using errcode = '42501';
  end if;

  select * into existing_contact from public.contacts where id = target_contact_id for update;
  if existing_contact.id is null or existing_contact.archived_at is not null then
    raise exception 'Contact is not available.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(existing_contact.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to update this contact.' using errcode = '42501';
  end if;

  if existing_contact.version <> expected_version then
    raise exception 'This contact changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  next_display_name := coalesce(nullif(btrim(contact_input ->> 'display_name'), ''), existing_contact.display_name);
  before_state := jsonb_build_object(
    'display_name', existing_contact.display_name,
    'preferred_contact_method', existing_contact.preferred_contact_method,
    'notes', existing_contact.notes
  );

  update public.contacts
  set
    first_name = coalesce(nullif(btrim(contact_input ->> 'first_name'), ''), first_name),
    last_name = coalesce(nullif(btrim(contact_input ->> 'last_name'), ''), last_name),
    display_name = next_display_name,
    primary_email = nullif(btrim(coalesce(contact_input ->> 'primary_email', contact_input ->> 'email', primary_email, '')), ''),
    normalized_email = lower(nullif(btrim(coalesce(contact_input ->> 'primary_email', contact_input ->> 'email', primary_email, '')), '')),
    primary_phone = nullif(btrim(coalesce(contact_input ->> 'primary_phone', contact_input ->> 'phone', primary_phone, '')), ''),
    normalized_phone = public.normalize_contact_phone(coalesce(contact_input ->> 'primary_phone', contact_input ->> 'phone', primary_phone, '')),
    preferred_contact_method = coalesce(nullif(btrim(contact_input ->> 'preferred_contact_method'), ''), preferred_contact_method),
    notes = coalesce(nullif(btrim(contact_input ->> 'notes'), ''), notes),
    updated_by = current_user_id
  where id = target_contact_id
  returning id, version into contact_id, contact_version;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (existing_contact.workspace_id, current_user_id, 'contact.updated', jsonb_build_object('contact_id', contact_id, 'contact_version', contact_version));

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (
    existing_contact.workspace_id,
    current_user_id,
    'contact.updated',
    'contacts',
    contact_id,
    jsonb_build_object('contact_version', contact_version, 'before', before_state)
  );

  return next;
end;
$$;

create or replace function public.create_brix_organization(
  target_workspace_id uuid,
  organization_input jsonb default '{}'::jsonb,
  idempotency_key text default null
)
returns table (
  organization_id uuid,
  organization_version integer,
  duplicate_candidates jsonb,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  request_hash text;
  existing_request public.relationship_command_requests%rowtype;
  org_name text := nullif(btrim(coalesce(organization_input ->> 'display_name', organization_input ->> 'name', '')), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required to create an organization.' using errcode = '42501';
  end if;

  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to manage Deal relationships in this BRIX workspace.' using errcode = '42501';
  end if;

  if org_name is null then
    raise exception 'An organization name is required.' using errcode = '22023';
  end if;

  cleaned_key := coalesce(cleaned_key, 'organization:create:' || md5(target_workspace_id::text || organization_input::text || current_user_id::text));
  request_hash := md5(target_workspace_id::text || cleaned_key || organization_input::text);

  insert into public.relationship_command_requests (workspace_id, command_name, idempotency_key, request_hash, created_by)
  values (target_workspace_id, 'organization.create', cleaned_key, request_hash, current_user_id)
  on conflict (workspace_id, command_name, idempotency_key) do nothing;

  select *
  into existing_request
  from public.relationship_command_requests
  where workspace_id = target_workspace_id
    and command_name = 'organization.create'
    and idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash then
    raise exception 'This organization creation request has already been used with different data.' using errcode = '23505';
  end if;

  if existing_request.organization_id is not null then
    select organization.id, organization.version
    into organization_id, organization_version
    from public.organizations organization
    where organization.id = existing_request.organization_id
      and organization.workspace_id = target_workspace_id;
    duplicate_candidates := '[]'::jsonb;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  select coalesce(jsonb_agg(to_jsonb(candidate)), '[]'::jsonb)
  into duplicate_candidates
  from public.find_organization_candidates(target_workspace_id, organization_input) candidate;

  insert into public.organizations (
    workspace_id,
    display_name,
    legal_name,
    organization_type,
    primary_email,
    normalized_email,
    primary_phone,
    normalized_phone,
    website,
    normalized_website_domain,
    address_line1,
    address_line2,
    city,
    region,
    postal_code,
    country,
    notes,
    created_by,
    updated_by
  )
  values (
    target_workspace_id,
    org_name,
    nullif(btrim(coalesce(organization_input ->> 'legal_name', '')), ''),
    nullif(btrim(coalesce(organization_input ->> 'organization_type', '')), ''),
    nullif(btrim(coalesce(organization_input ->> 'primary_email', organization_input ->> 'email', '')), ''),
    lower(nullif(btrim(coalesce(organization_input ->> 'primary_email', organization_input ->> 'email', '')), '')),
    nullif(btrim(coalesce(organization_input ->> 'primary_phone', organization_input ->> 'phone', '')), ''),
    public.normalize_contact_phone(coalesce(organization_input ->> 'primary_phone', organization_input ->> 'phone', '')),
    nullif(btrim(coalesce(organization_input ->> 'website', '')), ''),
    public.normalize_website_domain(coalesce(organization_input ->> 'website', '')),
    nullif(btrim(coalesce(organization_input ->> 'address_line1', '')), ''),
    nullif(btrim(coalesce(organization_input ->> 'address_line2', '')), ''),
    nullif(btrim(coalesce(organization_input ->> 'city', '')), ''),
    upper(nullif(btrim(coalesce(organization_input ->> 'region', organization_input ->> 'state', '')), '')),
    nullif(btrim(coalesce(organization_input ->> 'postal_code', organization_input ->> 'zip', '')), ''),
    upper(coalesce(nullif(btrim(organization_input ->> 'country'), ''), 'US')),
    nullif(btrim(coalesce(organization_input ->> 'notes', '')), ''),
    current_user_id,
    current_user_id
  )
  returning id, version into organization_id, organization_version;

  update public.relationship_command_requests
  set organization_id = create_brix_organization.organization_id
  where id = existing_request.id;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (target_workspace_id, current_user_id, 'organization.created', jsonb_build_object('organization_id', organization_id, 'organization_version', organization_version));

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (target_workspace_id, current_user_id, 'organization.created', 'organizations', organization_id, jsonb_build_object('organization_version', organization_version));

  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace function public.update_brix_organization(
  target_organization_id uuid,
  expected_version integer,
  organization_input jsonb default '{}'::jsonb
)
returns table (organization_id uuid, organization_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_organization public.organizations%rowtype;
  before_state jsonb;
  next_display_name text;
begin
  if current_user_id is null then
    raise exception 'Authentication required to update an organization.' using errcode = '42501';
  end if;

  select * into existing_organization from public.organizations where id = target_organization_id for update;
  if existing_organization.id is null or existing_organization.archived_at is not null then
    raise exception 'Organization is not available.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(existing_organization.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to update this organization.' using errcode = '42501';
  end if;

  if existing_organization.version <> expected_version then
    raise exception 'This organization changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  next_display_name := coalesce(nullif(btrim(organization_input ->> 'display_name'), ''), existing_organization.display_name);
  before_state := jsonb_build_object(
    'display_name', existing_organization.display_name,
    'organization_type', existing_organization.organization_type,
    'notes', existing_organization.notes
  );

  update public.organizations
  set
    display_name = next_display_name,
    legal_name = coalesce(nullif(btrim(organization_input ->> 'legal_name'), ''), legal_name),
    organization_type = coalesce(nullif(btrim(organization_input ->> 'organization_type'), ''), organization_type),
    primary_email = nullif(btrim(coalesce(organization_input ->> 'primary_email', organization_input ->> 'email', primary_email, '')), ''),
    normalized_email = lower(nullif(btrim(coalesce(organization_input ->> 'primary_email', organization_input ->> 'email', primary_email, '')), '')),
    primary_phone = nullif(btrim(coalesce(organization_input ->> 'primary_phone', organization_input ->> 'phone', primary_phone, '')), ''),
    normalized_phone = public.normalize_contact_phone(coalesce(organization_input ->> 'primary_phone', organization_input ->> 'phone', primary_phone, '')),
    website = nullif(btrim(coalesce(organization_input ->> 'website', website, '')), ''),
    normalized_website_domain = public.normalize_website_domain(coalesce(organization_input ->> 'website', website, '')),
    address_line1 = coalesce(nullif(btrim(organization_input ->> 'address_line1'), ''), address_line1),
    address_line2 = coalesce(nullif(btrim(organization_input ->> 'address_line2'), ''), address_line2),
    city = coalesce(nullif(btrim(organization_input ->> 'city'), ''), city),
    region = coalesce(upper(nullif(btrim(coalesce(organization_input ->> 'region', organization_input ->> 'state', '')), '')), region),
    postal_code = coalesce(nullif(btrim(coalesce(organization_input ->> 'postal_code', organization_input ->> 'zip', '')), ''), postal_code),
    country = coalesce(upper(nullif(btrim(organization_input ->> 'country'), '')), country),
    notes = coalesce(nullif(btrim(organization_input ->> 'notes'), ''), notes),
    updated_by = current_user_id
  where id = target_organization_id
  returning id, version into organization_id, organization_version;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (existing_organization.workspace_id, current_user_id, 'organization.updated', jsonb_build_object('organization_id', organization_id, 'organization_version', organization_version));

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (
    existing_organization.workspace_id,
    current_user_id,
    'organization.updated',
    'organizations',
    organization_id,
    jsonb_build_object('organization_version', organization_version, 'before', before_state)
  );

  return next;
end;
$$;

create or replace function public.attach_contact_to_deal(
  target_deal_id uuid,
  target_contact_id uuid,
  relationship_input jsonb default '{}'::jsonb,
  idempotency_key text default null
)
returns table (
  relationship_id uuid,
  relationship_version integer,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_workspace_id uuid;
  relationship_role text := coalesce(nullif(btrim(relationship_input ->> 'role'), ''), 'other');
  relationship_status text := coalesce(nullif(btrim(relationship_input ->> 'status'), ''), 'active');
  cleaned_key text := coalesce(nullif(btrim(idempotency_key), ''), 'relationship:contact:' || target_deal_id::text || ':' || target_contact_id::text || ':' || relationship_role);
  request_hash text;
  existing_request public.relationship_command_requests%rowtype;
  requested_is_primary boolean;
  relationship_was_created boolean := false;
begin
  if current_user_id is null then
    raise exception 'Authentication required to attach a contact to a Deal.' using errcode = '42501';
  end if;

  select workspace_id into target_workspace_id from public.brix_deals where id = target_deal_id and deleted_at is null;
  if target_workspace_id is null then
    raise exception 'Deal is not available.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to manage Deal relationships.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.contacts where id = target_contact_id and workspace_id = target_workspace_id and archived_at is null) then
    raise exception 'Contact is not available in this BRIX workspace.' using errcode = 'P0002';
  end if;

  request_hash := md5(target_deal_id::text || target_contact_id::text || relationship_input::text || cleaned_key);
  requested_is_primary := case
    when relationship_input ? 'is_primary' then (relationship_input ->> 'is_primary')::boolean
    else null
  end;

  insert into public.relationship_command_requests (workspace_id, command_name, idempotency_key, request_hash, contact_id, created_by)
  values (target_workspace_id, 'relationship.attach_contact', cleaned_key, request_hash, target_contact_id, current_user_id)
  on conflict (workspace_id, command_name, idempotency_key) do nothing;

  select *
  into existing_request
  from public.relationship_command_requests
  where workspace_id = target_workspace_id
    and command_name = 'relationship.attach_contact'
    and idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash then
    raise exception 'This relationship request has already been used with different data.' using errcode = '23505';
  end if;

  if existing_request.relationship_id is not null then
    select relationship.id, relationship.version
    into relationship_id, relationship_version
    from public.deal_relationships relationship
    where relationship.id = existing_request.relationship_id
      and relationship.workspace_id = target_workspace_id;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  select id, version
  into relationship_id, relationship_version
  from public.deal_relationships
  where workspace_id = target_workspace_id
    and deal_id = target_deal_id
    and contact_id = target_contact_id
    and role = relationship_role
    and status <> 'removed'
    and archived_at is null
  limit 1
  for update;

  if relationship_id is null then
    select id, version
    into relationship_id, relationship_version
    from public.deal_relationships
    where workspace_id = target_workspace_id
      and deal_id = target_deal_id
      and contact_id = target_contact_id
      and role = relationship_role
      and status = 'removed'
    order by updated_at desc
    limit 1
    for update;

    if relationship_id is not null then
      update public.deal_relationships
      set
        status = relationship_status,
        is_primary = coalesce(requested_is_primary, is_primary),
        notes = nullif(btrim(coalesce(relationship_input ->> 'notes', notes, '')), ''),
        communication_preference = nullif(btrim(coalesce(relationship_input ->> 'communication_preference', communication_preference, '')), ''),
        archived_at = null,
        updated_by = current_user_id
      where id = relationship_id
      returning id, version into relationship_id, relationship_version;
      relationship_was_created := true;
    else
      insert into public.deal_relationships (
        workspace_id,
        deal_id,
        contact_id,
        role,
        status,
        is_primary,
        notes,
        communication_preference,
        created_by,
        updated_by
      )
      values (
        target_workspace_id,
        target_deal_id,
        target_contact_id,
        relationship_role,
        relationship_status,
        coalesce(requested_is_primary, false),
        nullif(btrim(coalesce(relationship_input ->> 'notes', '')), ''),
        nullif(btrim(coalesce(relationship_input ->> 'communication_preference', '')), ''),
        current_user_id,
        current_user_id
      )
      returning id, version into relationship_id, relationship_version;
      relationship_was_created := true;
    end if;
  end if;

  update public.relationship_command_requests
  set relationship_id = attach_contact_to_deal.relationship_id
  where id = existing_request.id;

  if relationship_was_created then
    insert into public.domain_events (workspace_id, actor_id, event_type, payload)
    values (
      target_workspace_id,
      current_user_id,
      'relationship.created',
      jsonb_build_object('deal_id', target_deal_id, 'relationship_id', relationship_id, 'contact_id', target_contact_id, 'role', relationship_role)
    );

    insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
    values (
      target_workspace_id,
      current_user_id,
      'relationship.created',
      'deal_relationships',
      relationship_id,
      jsonb_build_object('deal_id', target_deal_id, 'contact_id', target_contact_id, 'relationship_version', relationship_version, 'role', relationship_role)
    );
  end if;

  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace function public.attach_organization_to_deal(
  target_deal_id uuid,
  target_organization_id uuid,
  relationship_input jsonb default '{}'::jsonb,
  idempotency_key text default null
)
returns table (
  relationship_id uuid,
  relationship_version integer,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_workspace_id uuid;
  relationship_role text := coalesce(nullif(btrim(relationship_input ->> 'role'), ''), 'other');
  relationship_status text := coalesce(nullif(btrim(relationship_input ->> 'status'), ''), 'active');
  cleaned_key text := coalesce(nullif(btrim(idempotency_key), ''), 'relationship:organization:' || target_deal_id::text || ':' || target_organization_id::text || ':' || relationship_role);
  request_hash text;
  existing_request public.relationship_command_requests%rowtype;
  requested_is_primary boolean;
  relationship_was_created boolean := false;
begin
  if current_user_id is null then
    raise exception 'Authentication required to attach an organization to a Deal.' using errcode = '42501';
  end if;

  select workspace_id into target_workspace_id from public.brix_deals where id = target_deal_id and deleted_at is null;
  if target_workspace_id is null then
    raise exception 'Deal is not available.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to manage Deal relationships.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.organizations where id = target_organization_id and workspace_id = target_workspace_id and archived_at is null) then
    raise exception 'Organization is not available in this BRIX workspace.' using errcode = 'P0002';
  end if;

  request_hash := md5(target_deal_id::text || target_organization_id::text || relationship_input::text || cleaned_key);
  requested_is_primary := case
    when relationship_input ? 'is_primary' then (relationship_input ->> 'is_primary')::boolean
    else null
  end;

  insert into public.relationship_command_requests (workspace_id, command_name, idempotency_key, request_hash, organization_id, created_by)
  values (target_workspace_id, 'relationship.attach_organization', cleaned_key, request_hash, target_organization_id, current_user_id)
  on conflict (workspace_id, command_name, idempotency_key) do nothing;

  select *
  into existing_request
  from public.relationship_command_requests
  where workspace_id = target_workspace_id
    and command_name = 'relationship.attach_organization'
    and idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash then
    raise exception 'This relationship request has already been used with different data.' using errcode = '23505';
  end if;

  if existing_request.relationship_id is not null then
    select relationship.id, relationship.version
    into relationship_id, relationship_version
    from public.deal_relationships relationship
    where relationship.id = existing_request.relationship_id
      and relationship.workspace_id = target_workspace_id;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  select id, version
  into relationship_id, relationship_version
  from public.deal_relationships
  where workspace_id = target_workspace_id
    and deal_id = target_deal_id
    and organization_id = target_organization_id
    and role = relationship_role
    and status <> 'removed'
    and archived_at is null
  limit 1
  for update;

  if relationship_id is null then
    select id, version
    into relationship_id, relationship_version
    from public.deal_relationships
    where workspace_id = target_workspace_id
      and deal_id = target_deal_id
      and organization_id = target_organization_id
      and role = relationship_role
      and status = 'removed'
    order by updated_at desc
    limit 1
    for update;

    if relationship_id is not null then
      update public.deal_relationships
      set
        status = relationship_status,
        is_primary = coalesce(requested_is_primary, is_primary),
        notes = nullif(btrim(coalesce(relationship_input ->> 'notes', notes, '')), ''),
        communication_preference = nullif(btrim(coalesce(relationship_input ->> 'communication_preference', communication_preference, '')), ''),
        archived_at = null,
        updated_by = current_user_id
      where id = relationship_id
      returning id, version into relationship_id, relationship_version;
      relationship_was_created := true;
    else
      insert into public.deal_relationships (
        workspace_id,
        deal_id,
        organization_id,
        role,
        status,
        is_primary,
        notes,
        communication_preference,
        created_by,
        updated_by
      )
      values (
        target_workspace_id,
        target_deal_id,
        target_organization_id,
        relationship_role,
        relationship_status,
        coalesce(requested_is_primary, false),
        nullif(btrim(coalesce(relationship_input ->> 'notes', '')), ''),
        nullif(btrim(coalesce(relationship_input ->> 'communication_preference', '')), ''),
        current_user_id,
        current_user_id
      )
      returning id, version into relationship_id, relationship_version;
      relationship_was_created := true;
    end if;
  end if;

  update public.relationship_command_requests
  set relationship_id = attach_organization_to_deal.relationship_id
  where id = existing_request.id;

  if relationship_was_created then
    insert into public.domain_events (workspace_id, actor_id, event_type, payload)
    values (
      target_workspace_id,
      current_user_id,
      'relationship.created',
      jsonb_build_object('deal_id', target_deal_id, 'relationship_id', relationship_id, 'organization_id', target_organization_id, 'role', relationship_role)
    );

    insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
    values (
      target_workspace_id,
      current_user_id,
      'relationship.created',
      'deal_relationships',
      relationship_id,
      jsonb_build_object('deal_id', target_deal_id, 'organization_id', target_organization_id, 'relationship_version', relationship_version, 'role', relationship_role)
    );
  end if;

  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace function public.update_deal_relationship(
  target_relationship_id uuid,
  expected_version integer,
  relationship_input jsonb default '{}'::jsonb
)
returns table (relationship_id uuid, relationship_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_relationship public.deal_relationships%rowtype;
  before_state jsonb;
  requested_is_primary boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required to update a Deal relationship.' using errcode = '42501';
  end if;

  select * into existing_relationship from public.deal_relationships where id = target_relationship_id for update;
  if existing_relationship.id is null or existing_relationship.archived_at is not null then
    raise exception 'Relationship is not available.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(existing_relationship.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to update this Deal relationship.' using errcode = '42501';
  end if;

  if existing_relationship.version <> expected_version then
    raise exception 'This Deal relationship changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  before_state := jsonb_build_object(
    'role', existing_relationship.role,
    'status', existing_relationship.status,
    'is_primary', existing_relationship.is_primary,
    'notes', existing_relationship.notes,
    'communication_preference', existing_relationship.communication_preference
  );
  requested_is_primary := case
    when relationship_input ? 'is_primary' then (relationship_input ->> 'is_primary')::boolean
    else null
  end;

  update public.deal_relationships
  set
    role = coalesce(nullif(btrim(relationship_input ->> 'role'), ''), role),
    status = coalesce(nullif(btrim(relationship_input ->> 'status'), ''), status),
    is_primary = coalesce(requested_is_primary, is_primary),
    notes = coalesce(nullif(btrim(relationship_input ->> 'notes'), ''), notes),
    communication_preference = coalesce(nullif(btrim(relationship_input ->> 'communication_preference'), ''), communication_preference),
    updated_by = current_user_id
  where id = target_relationship_id
  returning id, version into relationship_id, relationship_version;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (
    existing_relationship.workspace_id,
    existing_relationship.deal_id,
    current_user_id,
    'relationship.updated',
    jsonb_build_object('relationship_id', relationship_id, 'relationship_version', relationship_version)
  );

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (
    existing_relationship.workspace_id,
    existing_relationship.deal_id,
    current_user_id,
    'relationship.updated',
    'deal_relationships',
    relationship_id,
    jsonb_build_object('relationship_version', relationship_version, 'before', before_state)
  );

  return next;
end;
$$;

create or replace function public.deactivate_deal_relationship(
  target_relationship_id uuid,
  expected_version integer default null
)
returns table (relationship_id uuid, relationship_version integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_relationship public.deal_relationships%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required to remove a Deal relationship.' using errcode = '42501';
  end if;

  select * into existing_relationship from public.deal_relationships where id = target_relationship_id for update;
  if existing_relationship.id is null then
    raise exception 'Relationship is not available.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(existing_relationship.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to remove this Deal relationship.' using errcode = '42501';
  end if;

  if expected_version is not null and existing_relationship.version <> expected_version then
    raise exception 'This Deal relationship changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  update public.deal_relationships
  set status = 'removed',
      archived_at = now(),
      updated_by = current_user_id
  where id = target_relationship_id
  returning id, version into relationship_id, relationship_version;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (
    existing_relationship.workspace_id,
    existing_relationship.deal_id,
    current_user_id,
    'relationship.deactivated',
    jsonb_build_object('relationship_id', relationship_id, 'relationship_version', relationship_version)
  );

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (
    existing_relationship.workspace_id,
    existing_relationship.deal_id,
    current_user_id,
    'relationship.deactivated',
    'deal_relationships',
    relationship_id,
    jsonb_build_object('relationship_version', relationship_version)
  );

  return next;
end;
$$;

create or replace function public.list_deal_relationships(target_deal_id uuid)
returns table (
  relationship_id uuid,
  relationship_version integer,
  workspace_id uuid,
  deal_id uuid,
  target_type text,
  contact_id uuid,
  organization_id uuid,
  role text,
  role_label text,
  status text,
  status_label text,
  is_primary boolean,
  notes text,
  communication_preference text,
  target_display_name text,
  target_email text,
  target_phone text,
  target_website text,
  target_archived_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required to load Deal relationships.' using errcode = '42501';
  end if;

  select workspace_id into target_workspace_id
  from public.brix_deals
  where id = target_deal_id
    and deleted_at is null;

  if target_workspace_id is null then
    raise exception 'Deal is not available.' using errcode = 'P0002';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'You do not have access to this Deal.' using errcode = '42501';
  end if;

  return query
  select
    relationship.id,
    relationship.version,
    relationship.workspace_id,
    relationship.deal_id,
    case when relationship.contact_id is not null then 'contact' else 'organization' end,
    relationship.contact_id,
    relationship.organization_id,
    relationship.role,
    role_definition.label,
    relationship.status,
    status_definition.label,
    relationship.is_primary,
    relationship.notes,
    relationship.communication_preference,
    coalesce(contact.display_name, organization.display_name),
    coalesce(contact.primary_email, organization.primary_email),
    coalesce(contact.primary_phone, organization.primary_phone),
    organization.website,
    coalesce(contact.archived_at, organization.archived_at),
    relationship.updated_at
  from public.deal_relationships relationship
  join public.deal_relationship_role_definitions role_definition on role_definition.role_key = relationship.role
  join public.deal_relationship_status_definitions status_definition on status_definition.status_key = relationship.status
  left join public.contacts contact on contact.id = relationship.contact_id and contact.workspace_id = relationship.workspace_id
  left join public.organizations organization on organization.id = relationship.organization_id and organization.workspace_id = relationship.workspace_id
  where relationship.deal_id = target_deal_id
    and relationship.workspace_id = target_workspace_id
    and relationship.status <> 'removed'
    and relationship.archived_at is null
  order by relationship.is_primary desc, role_definition.sort_order, relationship.updated_at desc;
end;
$$;

create or replace function public.load_brix_contact(target_contact_id uuid)
returns table (
  contact_id uuid,
  workspace_id uuid,
  first_name text,
  last_name text,
  display_name text,
  primary_email text,
  primary_phone text,
  preferred_contact_method text,
  notes text,
  archived_at timestamptz,
  version integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required to load contact details.' using errcode = '42501';
  end if;

  select contact.workspace_id into target_workspace_id from public.contacts contact where contact.id = target_contact_id;
  if target_workspace_id is null or not public.is_workspace_member(target_workspace_id) then
    raise exception 'Contact is not available.' using errcode = '42501';
  end if;

  return query
  select id, workspace_id, first_name, last_name, display_name, primary_email, primary_phone, preferred_contact_method, notes, archived_at, version
  from public.contacts
  where id = target_contact_id;
end;
$$;

create or replace function public.load_brix_organization(target_organization_id uuid)
returns table (
  organization_id uuid,
  workspace_id uuid,
  display_name text,
  legal_name text,
  organization_type text,
  primary_email text,
  primary_phone text,
  website text,
  address_line1 text,
  city text,
  region text,
  postal_code text,
  country text,
  notes text,
  archived_at timestamptz,
  version integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required to load organization details.' using errcode = '42501';
  end if;

  select organization.workspace_id into target_workspace_id from public.organizations organization where organization.id = target_organization_id;
  if target_workspace_id is null or not public.is_workspace_member(target_workspace_id) then
    raise exception 'Organization is not available.' using errcode = '42501';
  end if;

  return query
  select id, workspace_id, display_name, legal_name, organization_type, primary_email, primary_phone, website, address_line1, city, region, postal_code, country, notes, archived_at, version
  from public.organizations
  where id = target_organization_id;
end;
$$;

alter table public.deal_relationship_role_definitions enable row level security;
alter table public.deal_relationship_status_definitions enable row level security;
alter table public.contacts enable row level security;
alter table public.organizations enable row level security;
alter table public.deal_relationships enable row level security;
alter table public.relationship_command_requests enable row level security;

drop policy if exists "deal relationship roles readable" on public.deal_relationship_role_definitions;
create policy "deal relationship roles readable"
  on public.deal_relationship_role_definitions for select to authenticated
  using (true);

drop policy if exists "deal relationship statuses readable" on public.deal_relationship_status_definitions;
create policy "deal relationship statuses readable"
  on public.deal_relationship_status_definitions for select to authenticated
  using (true);

drop policy if exists "contacts read workspace members" on public.contacts;
create policy "contacts read workspace members"
  on public.contacts for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "contacts no direct insert" on public.contacts;
create policy "contacts no direct insert"
  on public.contacts for insert to authenticated
  with check (false);

drop policy if exists "contacts no direct update" on public.contacts;
create policy "contacts no direct update"
  on public.contacts for update to authenticated
  using (false)
  with check (false);

drop policy if exists "contacts no direct delete" on public.contacts;
create policy "contacts no direct delete"
  on public.contacts for delete to authenticated
  using (false);

drop policy if exists "organizations read workspace members" on public.organizations;
create policy "organizations read workspace members"
  on public.organizations for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "organizations no direct insert" on public.organizations;
create policy "organizations no direct insert"
  on public.organizations for insert to authenticated
  with check (false);

drop policy if exists "organizations no direct update" on public.organizations;
create policy "organizations no direct update"
  on public.organizations for update to authenticated
  using (false)
  with check (false);

drop policy if exists "organizations no direct delete" on public.organizations;
create policy "organizations no direct delete"
  on public.organizations for delete to authenticated
  using (false);

drop policy if exists "deal relationships read workspace members" on public.deal_relationships;
create policy "deal relationships read workspace members"
  on public.deal_relationships for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "deal relationships no direct insert" on public.deal_relationships;
create policy "deal relationships no direct insert"
  on public.deal_relationships for insert to authenticated
  with check (false);

drop policy if exists "deal relationships no direct update" on public.deal_relationships;
create policy "deal relationships no direct update"
  on public.deal_relationships for update to authenticated
  using (false)
  with check (false);

drop policy if exists "deal relationships no direct delete" on public.deal_relationships;
create policy "deal relationships no direct delete"
  on public.deal_relationships for delete to authenticated
  using (false);

drop policy if exists "relationship command requests read creator" on public.relationship_command_requests;
create policy "relationship command requests read creator"
  on public.relationship_command_requests for select to authenticated
  using (created_by = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "relationship command requests no direct insert" on public.relationship_command_requests;
create policy "relationship command requests no direct insert"
  on public.relationship_command_requests for insert to authenticated
  with check (false);

drop policy if exists "relationship command requests no direct update" on public.relationship_command_requests;
create policy "relationship command requests no direct update"
  on public.relationship_command_requests for update to authenticated
  using (false)
  with check (false);

drop policy if exists "relationship command requests no direct delete" on public.relationship_command_requests;
create policy "relationship command requests no direct delete"
  on public.relationship_command_requests for delete to authenticated
  using (false);

revoke all on function public.find_contact_candidates(uuid, jsonb) from public;
revoke all on function public.find_organization_candidates(uuid, jsonb) from public;
revoke all on function public.create_brix_contact(uuid, jsonb, text) from public;
revoke all on function public.update_brix_contact(uuid, integer, jsonb) from public;
revoke all on function public.create_brix_organization(uuid, jsonb, text) from public;
revoke all on function public.update_brix_organization(uuid, integer, jsonb) from public;
revoke all on function public.attach_contact_to_deal(uuid, uuid, jsonb, text) from public;
revoke all on function public.attach_organization_to_deal(uuid, uuid, jsonb, text) from public;
revoke all on function public.update_deal_relationship(uuid, integer, jsonb) from public;
revoke all on function public.deactivate_deal_relationship(uuid, integer) from public;
revoke all on function public.list_deal_relationships(uuid) from public;
revoke all on function public.load_brix_contact(uuid) from public;
revoke all on function public.load_brix_organization(uuid) from public;

grant execute on function public.find_contact_candidates(uuid, jsonb) to authenticated;
grant execute on function public.find_organization_candidates(uuid, jsonb) to authenticated;
grant execute on function public.create_brix_contact(uuid, jsonb, text) to authenticated;
grant execute on function public.update_brix_contact(uuid, integer, jsonb) to authenticated;
grant execute on function public.create_brix_organization(uuid, jsonb, text) to authenticated;
grant execute on function public.update_brix_organization(uuid, integer, jsonb) to authenticated;
grant execute on function public.attach_contact_to_deal(uuid, uuid, jsonb, text) to authenticated;
grant execute on function public.attach_organization_to_deal(uuid, uuid, jsonb, text) to authenticated;
grant execute on function public.update_deal_relationship(uuid, integer, jsonb) to authenticated;
grant execute on function public.deactivate_deal_relationship(uuid, integer) to authenticated;
grant execute on function public.list_deal_relationships(uuid) to authenticated;
grant execute on function public.load_brix_contact(uuid) to authenticated;
grant execute on function public.load_brix_organization(uuid) to authenticated;

-- Specification 004 slice 1: Manual address and Property intake.
-- This adds the smallest intake/source foundation required for manual creation.

create extension if not exists pgcrypto;

create table if not exists public.property_intakes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  state text not null default 'draft' check (state in ('draft', 'searching_existing_property', 'awaiting_match_decision', 'creating_property', 'creating_deal', 'awaiting_verification', 'complete', 'failed', 'conflict', 'cancelled')),
  source_type text not null default 'manual' check (source_type = 'manual'),
  original_input jsonb not null default '{}'::jsonb check (jsonb_typeof(original_input) = 'object'),
  normalized_location jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_location) = 'object'),
  selected_property_id uuid references public.properties(id) on delete set null,
  duplicate_decision text check (duplicate_decision in ('use_existing_property', 'create_new_property', 'return_to_edit', 'none')),
  resulting_property_id uuid references public.properties(id) on delete set null,
  resulting_deal_id uuid references public.brix_deals(id) on delete set null,
  idempotency_key text not null,
  safe_error_category text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  unique (workspace_id, idempotency_key)
);

create table if not exists public.manual_source_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  intake_id uuid not null references public.property_intakes(id) on delete cascade,
  deal_id uuid not null references public.brix_deals(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict,
  source_type text not null default 'manual' check (source_type = 'manual'),
  source_name text,
  source_contact text,
  entered_at timestamptz not null default now(),
  effective_date date,
  original_values jsonb not null default '{}'::jsonb check (jsonb_typeof(original_values) = 'object'),
  classification jsonb not null default '{}'::jsonb check (jsonb_typeof(classification) = 'object'),
  verification_state text not null default 'unverified' check (verification_state in ('unverified', 'user_verified', 'source_verified', 'professional_review_recommended', 'rejected', 'superseded')),
  source_version integer not null default 1,
  status text not null default 'active' check (status in ('active', 'superseded', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, intake_id)
);

drop trigger if exists touch_property_intakes on public.property_intakes;
create trigger touch_property_intakes
before update on public.property_intakes
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_manual_source_records on public.manual_source_records;
create trigger touch_manual_source_records
before update on public.manual_source_records
for each row execute function public.touch_versioned_record();

create index if not exists idx_property_intakes_workspace_user_state
  on public.property_intakes(workspace_id, user_id, state, updated_at desc);

create index if not exists idx_property_intakes_resulting_deal
  on public.property_intakes(workspace_id, resulting_deal_id)
  where resulting_deal_id is not null;

create index if not exists idx_manual_source_records_workspace_deal
  on public.manual_source_records(workspace_id, deal_id, updated_at desc);

create index if not exists idx_properties_workspace_manual_match
  on public.properties(workspace_id, lower(display_address), lower(coalesce(address_line2, '')), lower(coalesce(city, '')), lower(coalesce(region, '')), coalesce(postal_code, ''))
  where deleted_at is null;

alter table public.property_intakes enable row level security;
alter table public.manual_source_records enable row level security;

drop policy if exists "property intakes read owner or managers" on public.property_intakes;
create policy "property intakes read owner or managers"
  on public.property_intakes for select to authenticated
  using (user_id = auth.uid() or public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "property intakes no direct insert" on public.property_intakes;
create policy "property intakes no direct insert"
  on public.property_intakes for insert to authenticated
  with check (false);

drop policy if exists "property intakes no direct update" on public.property_intakes;
create policy "property intakes no direct update"
  on public.property_intakes for update to authenticated
  using (false)
  with check (false);

drop policy if exists "property intakes no direct delete" on public.property_intakes;
create policy "property intakes no direct delete"
  on public.property_intakes for delete to authenticated
  using (false);

drop policy if exists "manual source records read workspace managers" on public.manual_source_records;
create policy "manual source records read workspace managers"
  on public.manual_source_records for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "manual source records no direct insert" on public.manual_source_records;
create policy "manual source records no direct insert"
  on public.manual_source_records for insert to authenticated
  with check (false);

drop policy if exists "manual source records no direct update" on public.manual_source_records;
create policy "manual source records no direct update"
  on public.manual_source_records for update to authenticated
  using (false)
  with check (false);

drop policy if exists "manual source records no direct delete" on public.manual_source_records;
create policy "manual source records no direct delete"
  on public.manual_source_records for delete to authenticated
  using (false);

create or replace function public.normalize_manual_location(manual_input jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  raw_location text := regexp_replace(btrim(coalesce(manual_input ->> 'address', manual_input ->> 'display_address', manual_input ->> 'descriptive_location', '')), '\s+', ' ', 'g');
  unit_value text := regexp_replace(btrim(coalesce(manual_input ->> 'unit_number', manual_input ->> 'address_line2', '')), '\s+', ' ', 'g');
  city_value text := regexp_replace(initcap(lower(btrim(coalesce(manual_input ->> 'city', '')))), '\s+', ' ', 'g');
  region_value text := upper(regexp_replace(btrim(coalesce(manual_input ->> 'region', manual_input ->> 'state', '')), '\s+', ' ', 'g'));
  postal_value text := upper(regexp_replace(btrim(coalesce(manual_input ->> 'postal_code', manual_input ->> 'zip', '')), '\s+', '', 'g'));
  country_value text := upper(coalesce(nullif(btrim(manual_input ->> 'country'), ''), 'US'));
  comparable text;
begin
  if raw_location = '' then
    raise exception 'Enter an address or descriptive location to start manual intake.' using errcode = '22023';
  end if;

  comparable := lower(regexp_replace(array_to_string(array[
    raw_location,
    nullif(unit_value, ''),
    nullif(city_value, ''),
    nullif(region_value, ''),
    nullif(postal_value, ''),
    nullif(country_value, '')
  ], ' '), '[^a-zA-Z0-9]+', ' ', 'g'));

  return jsonb_strip_nulls(jsonb_build_object(
    'original_location', raw_location,
    'display_address', raw_location,
    'address_line1', raw_location,
    'unit_number', nullif(unit_value, ''),
    'city', nullif(city_value, ''),
    'region', nullif(region_value, ''),
    'postal_code', nullif(postal_value, ''),
    'country', country_value,
    'comparable_key', btrim(comparable),
    'normalization_version', 1,
    'provider_used', false
  ));
end;
$$;

create or replace function public.classify_manual_intake_values(manual_input jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'address', case when nullif(btrim(coalesce(manual_input ->> 'address', manual_input ->> 'descriptive_location', '')), '') is null then 'unknown' else 'user_entered_fact' end,
    'opportunity_name', case when nullif(btrim(coalesce(manual_input ->> 'opportunity_name', '')), '') is null then 'unknown' else 'descriptive_input' end,
    'property_type', case when nullif(btrim(coalesce(manual_input ->> 'property_type', '')), '') is null then 'unknown' else 'user_entered_fact' end,
    'asking_price', case when nullif(btrim(coalesce(manual_input ->> 'asking_price', '')), '') is null then 'unknown' else 'user_entered_fact' end,
    'expected_price', case when nullif(btrim(coalesce(manual_input ->> 'expected_price', '')), '') is null then 'unknown' else 'user_assumption' end,
    'intended_strategy', case when nullif(btrim(coalesce(manual_input ->> 'intended_strategy', '')), '') is null then 'unknown' else 'user_assumption' end,
    'source', case when nullif(btrim(coalesce(manual_input ->> 'source', '')), '') is null then 'unknown' else 'descriptive_input' end,
    'source_contact', case when nullif(btrim(coalesce(manual_input ->> 'source_contact', '')), '') is null then 'unknown' else 'descriptive_input' end,
    'notes', case when nullif(btrim(coalesce(manual_input ->> 'notes', '')), '') is null then 'unknown' else 'descriptive_input' end,
    'verification_state', 'unverified'
  ));
$$;

create or replace function public.search_manual_property_candidates(
  target_workspace_id uuid,
  manual_input jsonb,
  candidate_limit integer default 5
)
returns table (
  property_id uuid,
  property_version integer,
  display_address text,
  city text,
  region text,
  postal_code text,
  country text,
  match_reasons text[],
  material_differences text[],
  active_deal_count integer,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized jsonb;
  safe_limit integer := greatest(1, least(coalesce(candidate_limit, 5), 10));
begin
  if current_user_id is null then raise exception 'Authentication required to search Properties.' using errcode = '42501'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to create Deals in this BRIX workspace.' using errcode = '42501'; end if;
  normalized := public.normalize_manual_location(manual_input);

  return query
  with candidates as (
    select
      property.*,
      array_remove(array[
        case when lower(property.display_address) = lower(normalized ->> 'display_address') then 'display address matches' end,
        case when lower(coalesce(property.address_line2, '')) = lower(coalesce(normalized ->> 'unit_number', '')) and coalesce(property.address_line2, normalized ->> 'unit_number') is not null then 'unit matches' end,
        case when lower(coalesce(property.city, '')) = lower(coalesce(normalized ->> 'city', '')) and coalesce(property.city, normalized ->> 'city') is not null then 'city matches' end,
        case when lower(coalesce(property.region, '')) = lower(coalesce(normalized ->> 'region', '')) and coalesce(property.region, normalized ->> 'region') is not null then 'state or region matches' end,
        case when coalesce(property.postal_code, '') = coalesce(normalized ->> 'postal_code', '') and coalesce(property.postal_code, normalized ->> 'postal_code') is not null then 'postal code matches' end
      ], null) as reasons,
      array_remove(array[
        case when coalesce(property.address_line2, '') <> coalesce(normalized ->> 'unit_number', '') and coalesce(property.address_line2, normalized ->> 'unit_number') is not null then 'unit differs' end,
        case when coalesce(property.city, '') <> coalesce(normalized ->> 'city', '') and coalesce(property.city, normalized ->> 'city') is not null then 'city differs' end,
        case when coalesce(property.region, '') <> coalesce(normalized ->> 'region', '') and coalesce(property.region, normalized ->> 'region') is not null then 'state or region differs' end,
        case when coalesce(property.postal_code, '') <> coalesce(normalized ->> 'postal_code', '') and coalesce(property.postal_code, normalized ->> 'postal_code') is not null then 'postal code differs' end
      ], null) as differences
    from public.properties property
    where property.workspace_id = target_workspace_id
      and property.deleted_at is null
      and (
        lower(property.display_address) = lower(normalized ->> 'display_address')
        or lower(property.display_address) like '%' || lower(normalized ->> 'display_address') || '%'
        or lower(normalized ->> 'display_address') like '%' || lower(property.display_address) || '%'
        or (
          nullif(normalized ->> 'postal_code', '') is not null
          and property.postal_code = normalized ->> 'postal_code'
          and lower(coalesce(property.city, '')) = lower(coalesce(normalized ->> 'city', ''))
        )
      )
  )
  select
    candidate.id,
    candidate.version,
    candidate.display_address,
    candidate.city,
    candidate.region,
    candidate.postal_code,
    candidate.country,
    candidate.reasons,
    candidate.differences,
    (select count(*)::integer from public.deal_properties dp join public.brix_deals d on d.workspace_id = dp.workspace_id and d.id = dp.deal_id where dp.workspace_id = target_workspace_id and dp.property_id = candidate.id and dp.inclusion_status = 'active' and d.deleted_at is null),
    candidate.updated_at
  from candidates candidate
  where array_length(candidate.reasons, 1) > 0
  order by array_length(candidate.differences, 1) nulls first, array_length(candidate.reasons, 1) desc, candidate.updated_at desc, candidate.id
  limit safe_limit;
end;
$$;

create or replace function public.complete_manual_property_intake(
  target_workspace_id uuid,
  idempotency_key text,
  manual_input jsonb,
  duplicate_decision text,
  selected_property_id uuid default null
)
returns table (
  intake_id uuid,
  intake_state text,
  property_id uuid,
  property_version integer,
  deal_id uuid,
  deal_version integer,
  deal_property_id uuid,
  source_record_id uuid,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  normalized jsonb;
  classification jsonb;
  existing_intake public.property_intakes%rowtype;
  created_deal record;
  source_record public.manual_source_records%rowtype;
  requested_decision text := coalesce(nullif(btrim(duplicate_decision), ''), 'create_new_property');
  safe_manual jsonb;
  source_name text;
  source_contact text;
  asking_price numeric;
  expected_price numeric;
  display_name text;
begin
  if current_user_id is null then raise exception 'Authentication required to complete manual intake.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to complete manual intake.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to create Deals in this BRIX workspace.' using errcode = '42501'; end if;
  if requested_decision not in ('use_existing_property', 'create_new_property') then raise exception 'Choose an existing Property or create a new Property.' using errcode = '22023'; end if;
  if requested_decision = 'use_existing_property' and selected_property_id is null then raise exception 'Select the Property to use.' using errcode = '22023'; end if;

  normalized := public.normalize_manual_location(manual_input);
  classification := public.classify_manual_intake_values(manual_input);
  safe_manual := public.safe_event_jsonb(manual_input);
  source_name := nullif(btrim(coalesce(manual_input ->> 'source', '')), '');
  source_contact := nullif(btrim(coalesce(manual_input ->> 'source_contact', '')), '');
  asking_price := nullif(btrim(coalesce(manual_input ->> 'asking_price', '')), '')::numeric;
  expected_price := nullif(btrim(coalesce(manual_input ->> 'expected_price', '')), '')::numeric;
  display_name := nullif(btrim(coalesce(manual_input ->> 'opportunity_name', '')), '');

  insert into public.property_intakes (workspace_id, user_id, state, source_type, original_input, normalized_location, selected_property_id, duplicate_decision, idempotency_key)
  values (target_workspace_id, current_user_id, 'creating_deal', 'manual', safe_manual, normalized, selected_property_id, requested_decision, cleaned_key)
  on conflict (workspace_id, idempotency_key) do nothing;

  select * into existing_intake
  from public.property_intakes
  where workspace_id = target_workspace_id and idempotency_key = cleaned_key
  for update;

  if existing_intake.user_id <> current_user_id then
    raise exception 'This intake belongs to another user.' using errcode = '42501';
  end if;

  if existing_intake.state = 'complete' and existing_intake.resulting_deal_id is not null then
    select * into source_record from public.manual_source_records where workspace_id = target_workspace_id and intake_id = existing_intake.id;
    intake_id := existing_intake.id;
    intake_state := existing_intake.state;
    property_id := existing_intake.resulting_property_id;
    select version into property_version from public.properties where id = property_id;
    deal_id := existing_intake.resulting_deal_id;
    select version into deal_version from public.brix_deals where id = deal_id;
    select id into deal_property_id from public.deal_properties where workspace_id = target_workspace_id and deal_id = complete_manual_property_intake.deal_id and property_id = complete_manual_property_intake.property_id and role = 'primary' and inclusion_status = 'active';
    source_record_id := source_record.id;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  if existing_intake.original_input <> safe_manual or existing_intake.duplicate_decision <> requested_decision or coalesce(existing_intake.selected_property_id::text, '') <> coalesce(selected_property_id::text, '') then
    update public.property_intakes set state = 'conflict', safe_error_category = 'conflict', failed_at = now() where id = existing_intake.id;
    raise exception 'This intake retry key was already used with different manual intake data.' using errcode = '23505';
  end if;

  if requested_decision = 'use_existing_property' and not exists (
    select 1 from public.properties where id = selected_property_id and workspace_id = target_workspace_id and deleted_at is null
  ) then
    raise exception 'The selected Property is not available in this BRIX workspace.' using errcode = 'P0002';
  end if;

  select * into created_deal
  from public.create_canonical_deal(
    target_workspace_id,
    'manual-intake:deal:' || cleaned_key,
    jsonb_build_object(
      'display_address', normalized ->> 'display_address',
      'address_line1', normalized ->> 'address_line1',
      'address_line2', normalized ->> 'unit_number',
      'city', normalized ->> 'city',
      'region', normalized ->> 'region',
      'postal_code', normalized ->> 'postal_code',
      'country', normalized ->> 'country',
      'source_identifiers', jsonb_build_object('manual_intake_id', existing_intake.id)
    ),
    jsonb_build_object(
      'display_name', coalesce(display_name, normalized ->> 'display_address'),
      'deal_type', 'acquisition',
      'priority', 'normal',
      'source', 'manual',
      'source_text', source_name,
      'address', normalized ->> 'display_address',
      'city', normalized ->> 'city',
      'state', normalized ->> 'region',
      'zip', normalized ->> 'postal_code',
      'strategy_id', coalesce(nullif(btrim(manual_input ->> 'intended_strategy'), ''), 'owner_occupant'),
      'strategy_intent', nullif(btrim(coalesce(manual_input ->> 'intended_strategy', '')), ''),
      'facts', jsonb_strip_nulls(jsonb_build_object(
        'address', normalized ->> 'display_address',
        'city', normalized ->> 'city',
        'state', normalized ->> 'region',
        'zip', normalized ->> 'postal_code',
        'propertyType', nullif(btrim(coalesce(manual_input ->> 'property_type', '')), ''),
        'listPrice', asking_price,
        'expectedPrice', expected_price,
        'sourceText', source_name,
        'notes', case when nullif(btrim(coalesce(manual_input ->> 'notes', '')), '') is null then '[]'::jsonb else jsonb_build_array(manual_input ->> 'notes') end,
        'verification', jsonb_build_object('address', 'entered', 'manual_source', 'entered')
      )),
      'verification', jsonb_build_object('address', 'entered', 'manual_source', 'entered')
    ),
    case when requested_decision = 'use_existing_property' then selected_property_id else null end
  );

  insert into public.manual_source_records (workspace_id, intake_id, deal_id, property_id, source_type, source_name, source_contact, original_values, classification, verification_state, created_by)
  values (target_workspace_id, existing_intake.id, created_deal.deal_id, created_deal.property_id, 'manual', source_name, source_contact, safe_manual, classification, 'unverified', current_user_id)
  on conflict (workspace_id, intake_id) do update set
    deal_id = excluded.deal_id,
    property_id = excluded.property_id
  returning * into source_record;

  update public.property_intakes
  set state = 'complete',
      resulting_property_id = created_deal.property_id,
      resulting_deal_id = created_deal.deal_id,
      completed_at = now()
  where id = existing_intake.id
  returning * into existing_intake;

  if requested_decision = 'use_existing_property' then
    insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
    values (target_workspace_id, created_deal.deal_id, created_deal.property_id, current_user_id, 'property.match_candidates_found', 'intake', existing_intake.id, 'complete_manual_property_intake', cleaned_key || ':property.match_candidates_found', jsonb_build_object('intake_id', existing_intake.id, 'selected_property_id', selected_property_id));
  end if;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values
    (target_workspace_id, null, null, current_user_id, 'intake.created', 'intake', existing_intake.id, 'complete_manual_property_intake', cleaned_key || ':intake.created', jsonb_build_object('intake_id', existing_intake.id, 'source_type', 'manual')),
    (target_workspace_id, created_deal.deal_id, created_deal.property_id, current_user_id, 'property.match_resolved', 'intake', existing_intake.id, 'complete_manual_property_intake', cleaned_key || ':property.match_resolved', jsonb_build_object('intake_id', existing_intake.id, 'property_id', created_deal.property_id, 'duplicate_decision', requested_decision)),
    (target_workspace_id, created_deal.deal_id, created_deal.property_id, current_user_id, 'intake.completed', 'intake', existing_intake.id, 'complete_manual_property_intake', cleaned_key || ':intake.completed', jsonb_build_object('intake_id', existing_intake.id, 'deal_id', created_deal.deal_id, 'property_id', created_deal.property_id));

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values
    (target_workspace_id, created_deal.deal_id, created_deal.property_id, current_user_id, 'intake.completed', 'property_intakes', 'intake', existing_intake.id, 'complete_manual_property_intake', cleaned_key || ':audit', jsonb_build_object('state', 'complete', 'deal_id', created_deal.deal_id, 'property_id', created_deal.property_id), array['state', 'resulting_deal_id', 'resulting_property_id'], jsonb_build_object('source_type', 'manual'));

  intake_id := existing_intake.id;
  intake_state := existing_intake.state;
  property_id := created_deal.property_id;
  property_version := created_deal.property_version;
  deal_id := created_deal.deal_id;
  deal_version := created_deal.deal_version;
  deal_property_id := created_deal.deal_property_id;
  source_record_id := source_record.id;
  idempotency_key_out := cleaned_key;
  return next;
exception
  when others then
    update public.property_intakes
    set state = case when sqlstate = '23505' then 'conflict' else 'failed' end,
        safe_error_category = case
          when sqlstate = '42501' then 'permission'
          when sqlstate = '22023' then 'validation'
          when sqlstate = '23505' then 'conflict'
          else 'server'
        end,
        failed_at = now()
    where workspace_id = target_workspace_id and idempotency_key = cleaned_key and state <> 'complete';
    raise;
end;
$$;

revoke all on function public.normalize_manual_location(jsonb) from public;
revoke all on function public.classify_manual_intake_values(jsonb) from public;
revoke all on function public.search_manual_property_candidates(uuid, jsonb, integer) from public;
revoke all on function public.complete_manual_property_intake(uuid, text, jsonb, text, uuid) from public;

grant execute on function public.search_manual_property_candidates(uuid, jsonb, integer) to authenticated;
grant execute on function public.complete_manual_property_intake(uuid, text, jsonb, text, uuid) to authenticated;

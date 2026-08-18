-- Pre-FinanceIQ staging repair: stabilize PL/pgSQL variable resolution in canonical Deal RPCs.
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
#variable_conflict use_variable
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

  if not exists (select 1 from public.workspaces workspace_record where workspace_record.id = target_workspace_id and workspace_record.status = 'active') then
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
  on conflict on constraint deal_creation_requests_workspace_id_idempotency_key_key do nothing;

  select *
  into existing_request
  from public.deal_creation_requests
  where public.deal_creation_requests.workspace_id = target_workspace_id
    and public.deal_creation_requests.idempotency_key = cleaned_key
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

  insert into public.brix_deals as inserted_deal (
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
  returning inserted_deal.id, inserted_deal.version, inserted_deal.stage, inserted_deal.operating_status
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
  where public.deal_creation_requests.workspace_id = target_workspace_id
    and public.deal_creation_requests.idempotency_key = cleaned_key;

  idempotency_key_out := cleaned_key;
  return next;
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
#variable_conflict use_variable
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

  update public.properties as updated_property
  set
    display_address = coalesce(nullif(btrim(property_input ->> 'display_address'), ''), updated_property.display_address),
    address_line1 = case when property_input ? 'address_line1' then nullif(btrim(property_input ->> 'address_line1'), '') else updated_property.address_line1 end,
    address_line2 = case when property_input ? 'address_line2' then nullif(btrim(property_input ->> 'address_line2'), '') else updated_property.address_line2 end,
    city = case when property_input ? 'city' then nullif(btrim(property_input ->> 'city'), '') else updated_property.city end,
    region = case when property_input ? 'region' then upper(nullif(btrim(property_input ->> 'region'), '')) else updated_property.region end,
    postal_code = case when property_input ? 'postal_code' then nullif(btrim(property_input ->> 'postal_code'), '') else updated_property.postal_code end,
    country = coalesce(upper(nullif(btrim(property_input ->> 'country'), '')), updated_property.country),
    parcel_identifier = case when property_input ? 'parcel_identifier' then nullif(btrim(property_input ->> 'parcel_identifier'), '') else updated_property.parcel_identifier end,
    updated_by = current_user_id
  where updated_property.id = target_property_id
  returning updated_property.id, updated_property.version, updated_property.workspace_id, updated_property.display_address, updated_property.address_line1, updated_property.address_line2, updated_property.city, updated_property.region, updated_property.postal_code, updated_property.country, updated_property.parcel_identifier, updated_property.updated_at
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
#variable_conflict use_variable
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

  update public.brix_deals as updated_deal
  set
    display_name = coalesce(nullif(btrim(deal_input ->> 'display_name'), ''), updated_deal.display_name),
    deal_type = coalesce(nullif(btrim(deal_input ->> 'deal_type'), ''), updated_deal.deal_type),
    priority = coalesce(nullif(btrim(deal_input ->> 'priority'), ''), updated_deal.priority),
    source = coalesce(nullif(btrim(deal_input ->> 'source'), ''), updated_deal.source),
    strategy_intent = case when deal_input ? 'strategy_intent' then nullif(btrim(deal_input ->> 'strategy_intent'), '') else updated_deal.strategy_intent end,
    source_url = case when deal_input ? 'source_url' then nullif(btrim(deal_input ->> 'source_url'), '') else updated_deal.source_url end,
    source_text = case when deal_input ? 'source_text' then nullif(btrim(deal_input ->> 'source_text'), '') else updated_deal.source_text end,
    strategy_id = coalesce(nullif(btrim(deal_input ->> 'strategy_id'), ''), updated_deal.strategy_id),
    facts = case when deal_input ? 'facts' and jsonb_typeof(deal_input -> 'facts') = 'object' then deal_input -> 'facts' else updated_deal.facts end,
    verification = case when deal_input ? 'verification' and jsonb_typeof(deal_input -> 'verification') = 'object' then deal_input -> 'verification' else updated_deal.verification end,
    updated_by = current_user_id
  where updated_deal.id = target_deal_id
  returning updated_deal.id, updated_deal.version, updated_deal.workspace_id, updated_deal.display_name, updated_deal.deal_type, updated_deal.priority, updated_deal.source, updated_deal.strategy_intent, updated_deal.stage, updated_deal.operating_status, updated_deal.updated_at
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
#variable_conflict use_variable
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

  update public.brix_deals as updated_deal
  set stage = coalesce(requested_stage, updated_deal.stage),
      operating_status = coalesce(requested_status, updated_deal.operating_status),
      updated_by = current_user_id
  where updated_deal.id = target_deal_id
  returning updated_deal.id, updated_deal.version, updated_deal.workspace_id, updated_deal.stage, updated_deal.operating_status, updated_deal.updated_at
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

create or replace function public.archive_deal(
  target_deal_id uuid,
  expected_version integer,
  idempotency_key text,
  archive_reason text default 'user_archive'
)
returns table (
  deal_id uuid,
  deal_version integer,
  workspace_id uuid,
  stage text,
  status text,
  archived_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  existing_deal public.brix_deals%rowtype;
  command public.deal_command_requests%rowtype;
  reason text := coalesce(nullif(btrim(archive_reason), ''), 'user_archive');
begin
  if current_user_id is null then raise exception 'Authentication required to archive a Deal.' using errcode = '42501'; end if;

  existing_deal := public.get_authorized_deal(target_deal_id);
  if not public.has_workspace_permission(existing_deal.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to archive this Deal.' using errcode = '42501';
  end if;

  select * into existing_deal from public.brix_deals where id = target_deal_id and deleted_at is null for update;

  command := public.ensure_deal_command(existing_deal.workspace_id, existing_deal.id, null, 'archive_deal', idempotency_key, jsonb_build_object('expected_version', expected_version, 'reason', reason));
  if command.result ? 'deal_id' then
    select d.id, d.version, d.workspace_id, d.stage, d.operating_status, d.archived_at, d.updated_at
    into deal_id, deal_version, workspace_id, stage, status, archived_at, updated_at
    from public.brix_deals d
    where d.id = (command.result ->> 'deal_id')::uuid;
    return next;
    return;
  end if;

  if existing_deal.version <> expected_version then
    raise exception 'This Deal changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  if existing_deal.archived_at is not null or existing_deal.operating_status = 'archived' then
    deal_id := existing_deal.id;
    deal_version := existing_deal.version;
    workspace_id := existing_deal.workspace_id;
    stage := existing_deal.stage;
    status := existing_deal.operating_status;
    archived_at := existing_deal.archived_at;
    updated_at := existing_deal.updated_at;

    update public.deal_command_requests
    set result = jsonb_build_object('deal_id', deal_id, 'deal_version', deal_version)
    where id = command.id;

    return next;
    return;
  end if;

  update public.brix_deals as updated_deal
  set
    archived_at = coalesce(updated_deal.archived_at, now()),
    stage = 'archived',
    operating_status = 'archived',
    updated_by = current_user_id
  where updated_deal.id = target_deal_id
  returning updated_deal.id, updated_deal.version, updated_deal.workspace_id, updated_deal.stage, updated_deal.operating_status, updated_deal.archived_at, updated_deal.updated_at
  into deal_id, deal_version, workspace_id, stage, status, archived_at, updated_at;

  if existing_deal.stage <> 'archived' then
    insert into public.deal_stage_history (workspace_id, deal_id, from_stage, to_stage, reason, changed_by, idempotency_key)
    values (workspace_id, deal_id, existing_deal.stage, 'archived', reason, current_user_id, idempotency_key);
  end if;

  if existing_deal.operating_status <> 'archived' then
    insert into public.deal_status_history (workspace_id, deal_id, from_status, to_status, reason, changed_by, idempotency_key)
    values (workspace_id, deal_id, existing_deal.operating_status, 'archived', reason, current_user_id, idempotency_key);
  end if;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (
    workspace_id,
    deal_id,
    current_user_id,
    'deal.archived',
    jsonb_build_object(
      'deal_id', deal_id,
      'deal_version', deal_version,
      'prior_stage', existing_deal.stage,
      'prior_status', existing_deal.operating_status,
      'resulting_stage', stage,
      'resulting_status', status,
      'reason', reason,
      'archived_at', archived_at
    )
  );

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (
    workspace_id,
    deal_id,
    current_user_id,
    'deal.archived',
    'brix_deals',
    deal_id,
    jsonb_build_object(
      'deal_version', deal_version,
      'prior_stage', existing_deal.stage,
      'prior_status', existing_deal.operating_status,
      'resulting_stage', stage,
      'resulting_status', status,
      'reason', reason,
      'archived_at', archived_at
    )
  );

  update public.deal_command_requests
  set result = jsonb_build_object('deal_id', deal_id, 'deal_version', deal_version)
  where id = command.id;

  return next;
end;
$$;

create or replace function public.restore_deal(
  target_deal_id uuid,
  expected_version integer,
  idempotency_key text,
  restore_reason text default 'user_restore'
)
returns table (
  deal_id uuid,
  deal_version integer,
  workspace_id uuid,
  stage text,
  status text,
  archived_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  existing_deal public.brix_deals%rowtype;
  command public.deal_command_requests%rowtype;
  reason text := coalesce(nullif(btrim(restore_reason), ''), 'user_restore');
  prior_stage text;
  prior_status text;
begin
  if current_user_id is null then raise exception 'Authentication required to restore a Deal.' using errcode = '42501'; end if;

  existing_deal := public.get_authorized_deal(target_deal_id);
  if not public.has_workspace_permission(existing_deal.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to restore this Deal.' using errcode = '42501';
  end if;

  select * into existing_deal from public.brix_deals where id = target_deal_id and deleted_at is null for update;

  command := public.ensure_deal_command(existing_deal.workspace_id, existing_deal.id, null, 'restore_deal', idempotency_key, jsonb_build_object('expected_version', expected_version, 'reason', reason));
  if command.result ? 'deal_id' then
    select d.id, d.version, d.workspace_id, d.stage, d.operating_status, d.archived_at, d.updated_at
    into deal_id, deal_version, workspace_id, stage, status, archived_at, updated_at
    from public.brix_deals d
    where d.id = (command.result ->> 'deal_id')::uuid;
    return next;
    return;
  end if;

  if existing_deal.version <> expected_version then
    raise exception 'This Deal changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  if existing_deal.archived_at is null and existing_deal.operating_status <> 'archived' then
    raise exception 'This Deal is not archived.' using errcode = '22023';
  end if;

  select history.from_stage into prior_stage
  from public.deal_stage_history history
  where history.workspace_id = existing_deal.workspace_id
    and history.deal_id = existing_deal.id
    and history.to_stage = 'archived'
  order by history.changed_at desc, history.id desc
  limit 1;

  select history.from_status into prior_status
  from public.deal_status_history history
  where history.workspace_id = existing_deal.workspace_id
    and history.deal_id = existing_deal.id
    and history.to_status = 'archived'
  order by history.changed_at desc, history.id desc
  limit 1;

  prior_stage := coalesce(nullif(prior_stage, 'archived'), 'research');
  prior_status := coalesce(nullif(prior_status, 'archived'), 'needs_attention');

  if not exists (select 1 from public.deal_stage_definitions where stage_key = prior_stage and stage_key <> 'archived') then prior_stage := 'research'; end if;
  if not exists (select 1 from public.deal_operating_status_definitions where status_key = prior_status and status_key <> 'archived') then prior_status := 'needs_attention'; end if;

  update public.brix_deals as updated_deal
  set
    archived_at = null,
    stage = prior_stage,
    operating_status = prior_status,
    updated_by = current_user_id
  where updated_deal.id = target_deal_id
  returning updated_deal.id, updated_deal.version, updated_deal.workspace_id, updated_deal.stage, updated_deal.operating_status, updated_deal.archived_at, updated_deal.updated_at
  into deal_id, deal_version, workspace_id, stage, status, archived_at, updated_at;

  insert into public.deal_stage_history (workspace_id, deal_id, from_stage, to_stage, reason, changed_by, idempotency_key)
  values (workspace_id, deal_id, existing_deal.stage, stage, reason, current_user_id, idempotency_key);

  insert into public.deal_status_history (workspace_id, deal_id, from_status, to_status, reason, changed_by, idempotency_key)
  values (workspace_id, deal_id, existing_deal.operating_status, status, reason, current_user_id, idempotency_key);

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, payload)
  values (
    workspace_id,
    deal_id,
    current_user_id,
    'deal.restored',
    jsonb_build_object(
      'deal_id', deal_id,
      'deal_version', deal_version,
      'prior_stage', existing_deal.stage,
      'prior_status', existing_deal.operating_status,
      'resulting_stage', stage,
      'resulting_status', status,
      'reason', reason,
      'requires_review', true
    )
  );

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_id, metadata)
  values (
    workspace_id,
    deal_id,
    current_user_id,
    'deal.restored',
    'brix_deals',
    deal_id,
    jsonb_build_object(
      'deal_version', deal_version,
      'prior_stage', existing_deal.stage,
      'prior_status', existing_deal.operating_status,
      'resulting_stage', stage,
      'resulting_status', status,
      'reason', reason,
      'requires_review', true
    )
  );

  update public.deal_command_requests
  set result = jsonb_build_object('deal_id', deal_id, 'deal_version', deal_version)
  where id = command.id;

  return next;
end;
$$;

revoke all on function public.create_canonical_deal(uuid, text, jsonb, jsonb, uuid) from public;
revoke all on function public.update_canonical_property(uuid, jsonb, integer, text) from public;
revoke all on function public.update_canonical_deal(uuid, jsonb, integer, text) from public;
revoke all on function public.update_deal_lifecycle(uuid, jsonb, integer, text) from public;
revoke all on function public.archive_deal(uuid, integer, text, text) from public;
revoke all on function public.restore_deal(uuid, integer, text, text) from public;
grant execute on function public.create_canonical_deal(uuid, text, jsonb, jsonb, uuid) to authenticated;
grant execute on function public.update_canonical_property(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.update_canonical_deal(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.update_deal_lifecycle(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.archive_deal(uuid, integer, text, text) to authenticated;
grant execute on function public.restore_deal(uuid, integer, text, text) to authenticated;



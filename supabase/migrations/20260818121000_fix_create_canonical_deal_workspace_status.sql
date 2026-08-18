-- Pre-FinanceIQ staging repair: keep canonical Deal creation functional with an output column named status.
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

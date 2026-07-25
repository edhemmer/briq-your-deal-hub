-- Specification 003: canonical Deal search, filters, archive, and restore.

create index if not exists idx_brix_deals_workspace_archived_updated
  on public.brix_deals(workspace_id, archived_at, updated_at desc)
  where deleted_at is null;

create index if not exists idx_brix_deals_workspace_created
  on public.brix_deals(workspace_id, created_at desc, id)
  where deleted_at is null;

create index if not exists idx_brix_deals_workspace_display_lower
  on public.brix_deals(workspace_id, lower(display_name), id)
  where deleted_at is null;

create index if not exists idx_brix_deals_workspace_priority
  on public.brix_deals(workspace_id, priority, updated_at desc, id)
  where deleted_at is null;

create or replace function public.deal_projection_attention_state(
  target_workspace_id uuid,
  target_deal_id uuid
)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when exists (
      select 1
      from public.deadlines deadline
      where deadline.workspace_id = target_workspace_id
        and deadline.deal_id = target_deal_id
        and deadline.archived_at is null
        and deadline.status not in ('completed', 'cancelled')
        and (
          deadline.due_at < now()
          or deadline.due_date < current_date
        )
    ) or exists (
      select 1
      from public.tasks task
      where task.workspace_id = target_workspace_id
        and task.deal_id = target_deal_id
        and task.archived_at is null
        and task.status not in ('completed', 'cancelled')
        and (
          task.due_at < now()
          or task.due_date < current_date
        )
    ) then 'overdue'
    when exists (
      select 1
      from public.deadlines deadline
      where deadline.workspace_id = target_workspace_id
        and deadline.deal_id = target_deal_id
        and deadline.archived_at is null
        and deadline.status not in ('completed', 'cancelled')
    ) or exists (
      select 1
      from public.tasks task
      where task.workspace_id = target_workspace_id
        and task.deal_id = target_deal_id
        and task.archived_at is null
        and task.status not in ('completed', 'cancelled')
    ) then 'open_work'
    else 'none'
  end;
$$;

drop function if exists public.list_deal_projection(uuid, integer, integer, text);

create or replace function public.list_deal_projection(
  target_workspace_id uuid,
  page_size integer default 30,
  page_offset integer default 0,
  sort_key text default 'updated_desc',
  search_query text default null,
  filter_input jsonb default '{}'::jsonb,
  include_archived boolean default false
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
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz,
  attention_state text,
  open_work_count bigint,
  relationship_count bigint,
  next_due_at timestamptz,
  total_count bigint,
  active_count bigint,
  archived_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_query text := lower(regexp_replace(btrim(coalesce(search_query, '')), '\s+', ' ', 'g'));
  escaped_query text;
  requested_sort text := coalesce(nullif(btrim(sort_key), ''), 'updated_desc');
  filters jsonb := coalesce(filter_input, '{}'::jsonb);
begin
  if auth.uid() is null then raise exception 'Authentication required to list Deals.' using errcode = '42501'; end if;
  if not public.is_workspace_member(target_workspace_id) then raise exception 'You do not have permission to list Deals in this BRIX account.' using errcode = '42501'; end if;
  if jsonb_typeof(filters) is distinct from 'object' then raise exception 'Deal filters are not available.' using errcode = '22023'; end if;
  if requested_sort not in ('updated_desc', 'updated_asc', 'created_desc', 'created_asc', 'name_asc', 'address_asc', 'priority_desc', 'stage_asc') then
    raise exception 'Deal sort is not available.' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements_text(coalesce(filters -> 'stages', '[]'::jsonb)) value
    where not exists (select 1 from public.deal_stage_definitions definition where definition.stage_key = value)
  ) then raise exception 'Deal stage filter is not available.' using errcode = '22023'; end if;

  if exists (
    select 1 from jsonb_array_elements_text(coalesce(filters -> 'statuses', '[]'::jsonb)) value
    where not exists (select 1 from public.deal_operating_status_definitions definition where definition.status_key = value)
  ) then raise exception 'Deal status filter is not available.' using errcode = '22023'; end if;

  if exists (
    select 1 from jsonb_array_elements_text(coalesce(filters -> 'priorities', '[]'::jsonb)) value
    where value not in ('low', 'normal', 'high', 'urgent')
  ) then raise exception 'Deal priority filter is not available.' using errcode = '22023'; end if;

  escaped_query := '%' || replace(replace(replace(normalized_query, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%';

  return query
  with workspace_deals as (
    select
      deal.*,
      property.id as property_id,
      property.version as property_version,
      property.display_address as property_address,
      public.deal_projection_attention_state(deal.workspace_id, deal.id) as derived_attention_state
    from public.brix_deals deal
    left join public.deal_properties deal_property
      on deal_property.workspace_id = deal.workspace_id
     and deal_property.deal_id = deal.id
     and deal_property.role = 'primary'
     and deal_property.inclusion_status = 'active'
    left join public.properties property
      on property.workspace_id = deal_property.workspace_id
     and property.id = deal_property.property_id
    where deal.workspace_id = target_workspace_id
      and deal.deleted_at is null
  ),
  scoped_deals as (
    select deal.*
    from workspace_deals deal
    where (
      include_archived is true
      or deal.archived_at is null
    )
      and (
        include_archived is true
        or deal.operating_status <> 'archived'
      )
  ),
  filtered as (
    select deal.*
    from scoped_deals deal
    where (
      normalized_query = ''
      or lower(deal.display_name) like escaped_query escape E'\\'
      or lower(coalesce(deal.property_address, '')) like escaped_query escape E'\\'
      or lower(coalesce(deal.stage, '')) like escaped_query escape E'\\'
      or lower(coalesce(deal.operating_status, '')) like escaped_query escape E'\\'
      or lower(coalesce(deal.priority, '')) like escaped_query escape E'\\'
      or lower(coalesce(deal.source, '')) like escaped_query escape E'\\'
      or lower(coalesce(deal.strategy_intent, '')) like escaped_query escape E'\\'
      or exists (
        select 1
        from public.deal_relationships relationship
        join public.contacts contact
          on contact.workspace_id = relationship.workspace_id
         and contact.id = relationship.contact_id
         and contact.archived_at is null
        where relationship.workspace_id = deal.workspace_id
          and relationship.deal_id = deal.id
          and relationship.archived_at is null
          and relationship.status <> 'removed'
          and lower(contact.display_name) like escaped_query escape E'\\'
      )
      or exists (
        select 1
        from public.deal_relationships relationship
        join public.organizations organization
          on organization.workspace_id = relationship.workspace_id
         and organization.id = relationship.organization_id
         and organization.archived_at is null
        where relationship.workspace_id = deal.workspace_id
          and relationship.deal_id = deal.id
          and relationship.archived_at is null
          and relationship.status <> 'removed'
          and (
            lower(organization.display_name) like escaped_query escape E'\\'
            or lower(coalesce(organization.legal_name, '')) like escaped_query escape E'\\'
          )
      )
    )
    and (not (filters ? 'stages') or deal.stage in (select jsonb_array_elements_text(filters -> 'stages')))
    and (not (filters ? 'statuses') or deal.operating_status in (select jsonb_array_elements_text(filters -> 'statuses')))
    and (not (filters ? 'priorities') or deal.priority in (select jsonb_array_elements_text(filters -> 'priorities')))
    and (not (filters ? 'sources') or deal.source in (select jsonb_array_elements_text(filters -> 'sources')))
    and (
      not (filters ? 'attention')
      or nullif(filters ->> 'attention', '') is null
      or filters ->> 'attention' = 'any'
      or deal.derived_attention_state = filters ->> 'attention'
    )
    and (
      not (filters ? 'property_text')
      or lower(coalesce(deal.property_address, '')) like ('%' || replace(replace(replace(lower(btrim(filters ->> 'property_text')), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%') escape E'\\'
    )
    and (not (filters ? 'created_from') or deal.created_at >= nullif(filters ->> 'created_from', '')::timestamptz)
    and (not (filters ? 'created_to') or deal.created_at < (nullif(filters ->> 'created_to', '')::date + 1)::timestamptz)
    and (not (filters ? 'updated_from') or deal.updated_at >= nullif(filters ->> 'updated_from', '')::timestamptz)
    and (not (filters ? 'updated_to') or deal.updated_at < (nullif(filters ->> 'updated_to', '')::date + 1)::timestamptz)
  ),
  counts as (
    select
      (select count(*) from filtered) as total_count,
      (select count(*) from workspace_deals deal where deal.archived_at is null and deal.operating_status <> 'archived') as active_count,
      (select count(*) from workspace_deals deal where deal.archived_at is not null or deal.operating_status = 'archived') as archived_count
  )
  select
    deal.id,
    deal.version,
    deal.workspace_id,
    deal.display_name,
    deal.property_id,
    deal.property_version,
    deal.property_address,
    deal.stage,
    deal.operating_status,
    deal.priority,
    deal.source,
    deal.strategy_intent,
    deal.created_at,
    deal.updated_at,
    deal.archived_at,
    deal.derived_attention_state,
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
    counts.total_count,
    counts.active_count,
    counts.archived_count
  from filtered deal
  cross join counts
  order by
    case when requested_sort = 'updated_asc' then deal.updated_at end asc,
    case when requested_sort = 'updated_desc' then deal.updated_at end desc,
    case when requested_sort = 'created_asc' then deal.created_at end asc,
    case when requested_sort = 'created_desc' then deal.created_at end desc,
    case when requested_sort = 'name_asc' then lower(deal.display_name) end asc,
    case when requested_sort = 'address_asc' then lower(coalesce(deal.property_address, deal.display_name)) end asc,
    case when requested_sort = 'priority_desc' then case deal.priority when 'urgent' then 1 when 'high' then 2 when 'normal' then 3 else 4 end end asc,
    case when requested_sort = 'stage_asc' then (select definition.sort_order from public.deal_stage_definitions definition where definition.stage_key = deal.stage) end asc,
    deal.updated_at desc,
    deal.id asc
  limit greatest(1, least(coalesce(page_size, 30), 100))
  offset greatest(0, coalesce(page_offset, 0));
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

  update public.brix_deals
  set
    archived_at = coalesce(archived_at, now()),
    stage = 'archived',
    operating_status = 'archived',
    updated_by = current_user_id
  where id = target_deal_id
  returning id, version, workspace_id, stage, operating_status, archived_at, updated_at
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

  update public.brix_deals
  set
    archived_at = null,
    stage = prior_stage,
    operating_status = prior_status,
    updated_by = current_user_id
  where id = target_deal_id
  returning id, version, workspace_id, stage, operating_status, archived_at, updated_at
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

revoke all on function public.deal_projection_attention_state(uuid, uuid) from public;
revoke all on function public.list_deal_projection(uuid, integer, integer, text, text, jsonb, boolean) from public;
revoke all on function public.archive_deal(uuid, integer, text, text) from public;
revoke all on function public.restore_deal(uuid, integer, text, text) from public;

grant execute on function public.list_deal_projection(uuid, integer, integer, text, text, jsonb, boolean) to authenticated;
grant execute on function public.archive_deal(uuid, integer, text, text) to authenticated;
grant execute on function public.restore_deal(uuid, integer, text, text) to authenticated;

-- Specification 011 Slice 3: deterministic ContractIQ deadline result persistence.
-- TypeScript domain code owns deadline arithmetic. This migration stores versioned
-- calculation outputs, calendar versions, canonical deadline linkage, and guarded
-- server-side synchronization into the existing Spec 003 Deal deadline system.

create extension if not exists pgcrypto;

insert into public.contract_deadline_status_definitions (status_key, label, sort_order, is_terminal, requires_review)
values
  ('uncertain', 'Uncertain', 110, false, true),
  ('missing_trigger', 'Missing Trigger', 120, false, true),
  ('missing_rule', 'Missing Rule', 130, false, true),
  ('stale', 'Stale', 140, false, true),
  ('failed_with_prior_valid', 'Failed With Prior Valid', 150, false, true)
on conflict (status_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_terminal = excluded.is_terminal,
  requires_review = excluded.requires_review;

create table if not exists public.contract_holiday_calendars (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  calendar_key text not null,
  calendar_version integer not null,
  calendar_type text not null check (calendar_type in ('us_federal', 'custom_source_defined')),
  timezone text not null,
  weekend_days integer[] not null default array[0, 6],
  holidays jsonb not null default '[]'::jsonb check (jsonb_typeof(holidays) = 'array'),
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  deterministic_hash text not null,
  effective_from date,
  effective_to date,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_holiday_calendars_workspace_source_evidence_fk
    foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_holiday_calendars_key_not_blank check (length(btrim(calendar_key)) > 0),
  constraint contract_holiday_calendars_timezone_not_blank check (length(btrim(timezone)) > 0),
  constraint contract_holiday_calendars_weekend_valid check (
    cardinality(weekend_days) > 0 and weekend_days <@ array[0, 1, 2, 3, 4, 5, 6]
  ),
  unique (workspace_id, calendar_key, calendar_version),
  unique (workspace_id, id)
);

create table if not exists public.contract_deadline_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  contract_id uuid not null,
  contract_deadline_id uuid not null,
  calculation_version integer not null,
  contract_deadline_version integer not null,
  trigger_at timestamptz,
  trigger_verification text not null check (trigger_verification in ('extracted_proposed', 'user_confirmed', 'source_verified', 'professional_verified', 'conflicted', 'unknown')),
  due_at timestamptz,
  timezone text not null,
  offset_value integer,
  offset_unit text check (offset_unit is null or offset_unit in ('hours', 'calendar_days', 'business_days', 'weeks', 'months', 'years')),
  counting_rule text check (counting_rule is null or counting_rule in ('start_after_trigger', 'include_trigger_day', 'exclude_trigger_day', 'exact_elapsed_hours', 'calendar_date_offset', 'business_day_offset')),
  business_day_rule text check (business_day_rule is null or business_day_rule in ('none', 'exclude_weekends_and_holidays', 'source_specific', 'uncertain')),
  weekend_rule text check (weekend_rule is null or weekend_rule in ('no_adjustment', 'next_business_day', 'previous_business_day', 'next_calendar_day', 'source_specific', 'uncertain')),
  holiday_calendar_id uuid,
  holiday_calendar_key text,
  holiday_calendar_version integer,
  holidays_applied jsonb not null default '[]'::jsonb check (jsonb_typeof(holidays_applied) = 'array'),
  adjustment_applied jsonb not null default '{}'::jsonb check (jsonb_typeof(adjustment_applied) = 'object'),
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  status text not null references public.contract_deadline_status_definitions(status_key),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  stale_reason text,
  calculation_contract_version text not null,
  deterministic_hash text not null,
  supersedes_calculation_id uuid,
  is_current boolean not null default false,
  correlation_id text not null,
  generated_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint contract_deadline_results_due_requires_authority check (
    due_at is null
    or trigger_verification in ('user_confirmed', 'source_verified', 'professional_verified')
    or status = 'proposed'
  ),
  constraint contract_deadline_results_current_requires_due check (
    is_current = false or (status in ('current', 'missed') and due_at is not null)
  ),
  constraint contract_deadline_results_contract_fk
    foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_deadline_results_deal_fk
    foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contract_deadline_results_contract_deadline_fk
    foreign key (workspace_id, contract_deadline_id) references public.contract_deadlines(workspace_id, id) on delete cascade,
  constraint contract_deadline_results_calendar_fk
    foreign key (workspace_id, holiday_calendar_id) references public.contract_holiday_calendars(workspace_id, id),
  constraint contract_deadline_results_source_evidence_fk
    foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_deadline_results_supersedes_fk
    foreign key (workspace_id, supersedes_calculation_id) references public.contract_deadline_results(workspace_id, id),
  unique (workspace_id, id),
  unique (workspace_id, contract_deadline_id, deterministic_hash)
);

create table if not exists public.contract_deadline_canonical_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  contract_id uuid not null,
  contract_deadline_id uuid not null,
  calculation_result_id uuid not null,
  calculation_version integer not null,
  canonical_deadline_id uuid,
  canonical_task_id uuid,
  source text not null default 'contractiq_deadline_calculation',
  status text not null default 'linked' check (status in ('linked', 'stale', 'superseded', 'sync_failed', 'skipped')),
  sync_version integer not null default 1,
  last_synced_at timestamptz,
  stale_reason text,
  idempotency_key text not null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_deadline_links_deal_fk
    foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contract_deadline_links_contract_fk
    foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_deadline_links_contract_deadline_fk
    foreign key (workspace_id, contract_deadline_id) references public.contract_deadlines(workspace_id, id) on delete cascade,
  constraint contract_deadline_links_result_fk
    foreign key (workspace_id, calculation_result_id) references public.contract_deadline_results(workspace_id, id) on delete cascade,
  constraint contract_deadline_links_canonical_deadline_fk
    foreign key (workspace_id, canonical_deadline_id) references public.deadlines(workspace_id, id),
  constraint contract_deadline_links_canonical_task_fk
    foreign key (workspace_id, canonical_task_id) references public.tasks(workspace_id, id),
  unique (workspace_id, id),
  unique (workspace_id, contract_deadline_id)
);

create unique index if not exists idx_contract_deadline_results_current
  on public.contract_deadline_results(workspace_id, contract_deadline_id)
  where is_current is true;
create index if not exists idx_contract_deadline_results_contract
  on public.contract_deadline_results(workspace_id, contract_id, generated_at desc);
create index if not exists idx_contract_deadline_results_deal_due
  on public.contract_deadline_results(workspace_id, deal_id, due_at)
  where due_at is not null and status in ('current', 'missed');
create index if not exists idx_contract_deadline_results_calendar
  on public.contract_deadline_results(workspace_id, holiday_calendar_id, holiday_calendar_version)
  where holiday_calendar_id is not null;
create index if not exists idx_contract_deadline_results_supersedes
  on public.contract_deadline_results(workspace_id, supersedes_calculation_id)
  where supersedes_calculation_id is not null;
create index if not exists idx_contract_deadline_links_canonical_deadline
  on public.contract_deadline_canonical_links(workspace_id, canonical_deadline_id)
  where canonical_deadline_id is not null;
create index if not exists idx_contract_deadline_links_result
  on public.contract_deadline_canonical_links(workspace_id, calculation_result_id);
create index if not exists idx_contract_holiday_calendars_lookup
  on public.contract_holiday_calendars(workspace_id, calendar_key, calendar_version)
  where archived_at is null;

drop trigger if exists touch_contract_holiday_calendars on public.contract_holiday_calendars;
create trigger touch_contract_holiday_calendars before update on public.contract_holiday_calendars
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_contract_deadline_canonical_links on public.contract_deadline_canonical_links;
create trigger touch_contract_deadline_canonical_links before update on public.contract_deadline_canonical_links
for each row execute function public.touch_versioned_record();

alter table public.contract_holiday_calendars enable row level security;
alter table public.contract_deadline_results enable row level security;
alter table public.contract_deadline_canonical_links enable row level security;

create policy "contract holiday calendars read workspace members" on public.contract_holiday_calendars
  for select to authenticated using (workspace_id is null or (select public.is_workspace_member(workspace_id)));
create policy "contract holiday calendars no direct insert" on public.contract_holiday_calendars
  for insert to authenticated with check (false);
create policy "contract holiday calendars no direct update" on public.contract_holiday_calendars
  for update to authenticated using (false) with check (false);
create policy "contract holiday calendars no direct delete" on public.contract_holiday_calendars
  for delete to authenticated using (false);

create policy "contract deadline results read workspace members" on public.contract_deadline_results
  for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "contract deadline results no direct insert" on public.contract_deadline_results
  for insert to authenticated with check (false);
create policy "contract deadline results no direct update" on public.contract_deadline_results
  for update to authenticated using (false) with check (false);
create policy "contract deadline results no direct delete" on public.contract_deadline_results
  for delete to authenticated using (false);

create policy "contract deadline links read workspace members" on public.contract_deadline_canonical_links
  for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "contract deadline links no direct insert" on public.contract_deadline_canonical_links
  for insert to authenticated with check (false);
create policy "contract deadline links no direct update" on public.contract_deadline_canonical_links
  for update to authenticated using (false) with check (false);
create policy "contract deadline links no direct delete" on public.contract_deadline_canonical_links
  for delete to authenticated using (false);

create or replace function public.record_contract_deadline_result(target_contract_deadline_id uuid, result_input jsonb, expected_deadline_version integer, idempotency_key text)
returns table (calculation_result_id uuid, calculation_version integer, status text, due_at timestamptz, is_current boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(result_input, '{}'::jsonb));
  target_deadline public.contract_deadlines%rowtype;
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  existing_current public.contract_deadline_results%rowtype;
  inserted_result public.contract_deadline_results%rowtype;
  normalized_status text := coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'missing_rule');
  normalized_hash text := nullif(btrim(safe_input ->> 'deterministicHash'), '');
  result_due_at timestamptz := nullif(safe_input ->> 'dueAt', '')::timestamptz;
begin
  if current_user_id is null then raise exception 'Authentication required to record ContractIQ deadline calculations.' using errcode = '42501'; end if;
  if normalized_hash is null then raise exception 'ContractIQ deadline result requires a deterministic hash.' using errcode = '22023'; end if;

  select * into target_deadline
  from public.contract_deadlines deadline
  where deadline.id = target_contract_deadline_id
  for update;
  if target_deadline.id is null then raise exception 'ContractIQ deadline is not available.' using errcode = 'P0002'; end if;
  if expected_deadline_version is not null and target_deadline.version <> expected_deadline_version then
    raise exception 'ContractIQ deadline changed before this calculation could be accepted.' using errcode = '40001';
  end if;

  target_contract := public.authorized_contract(target_deadline.contract_id);
  if target_contract.workspace_id <> target_deadline.workspace_id then raise exception 'ContractIQ deadline workspace mismatch.' using errcode = '42501'; end if;
  if not public.has_workspace_permission(target_deadline.workspace_id, 'deals:manage') then raise exception 'You do not have permission to calculate ContractIQ deadlines.' using errcode = '42501'; end if;

  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'record_contract_deadline_result', idempotency_key, safe_input);
  if command.result ? 'calculation_result_id' then
    select id, calculation_version, contract_deadline_results.status, contract_deadline_results.due_at, contract_deadline_results.is_current
      into calculation_result_id, calculation_version, status, due_at, is_current
    from public.contract_deadline_results
    where id = (command.result ->> 'calculation_result_id')::uuid;
    return next; return;
  end if;

  select * into existing_current
  from public.contract_deadline_results result
  where result.workspace_id = target_deadline.workspace_id
    and result.contract_deadline_id = target_deadline.id
    and result.is_current is true
  for update;

  if existing_current.id is not null and existing_current.contract_deadline_version > target_deadline.version then
    raise exception 'A newer ContractIQ deadline calculation is already current.' using errcode = '40001';
  end if;

  if normalized_status in ('current', 'missed') then
    update public.contract_deadline_results prior
    set is_current = false,
        status = case when prior.status in ('current', 'missed') then 'superseded' else prior.status end,
        stale_reason = coalesce(prior.stale_reason, 'Superseded by newer ContractIQ deadline calculation.')
    where prior.workspace_id = target_deadline.workspace_id
      and prior.contract_deadline_id = target_deadline.id
      and prior.is_current is true;
  end if;

  insert into public.contract_deadline_results (
    workspace_id, deal_id, contract_id, contract_deadline_id, calculation_version,
    contract_deadline_version, trigger_at, trigger_verification, due_at, timezone,
    offset_value, offset_unit, counting_rule, business_day_rule, weekend_rule,
    holiday_calendar_id, holiday_calendar_key, holiday_calendar_version, holidays_applied,
    adjustment_applied, source_evidence_id, source_anchor, status, warnings, stale_reason,
    calculation_contract_version, deterministic_hash, supersedes_calculation_id, is_current,
    correlation_id, generated_at, created_by
  )
  values (
    target_deadline.workspace_id, target_contract.deal_id, target_contract.id, target_deadline.id,
    coalesce(nullif(safe_input ->> 'calculationVersion', '')::integer, 1),
    target_deadline.version,
    nullif(safe_input ->> 'triggerAt', '')::timestamptz,
    coalesce(nullif(btrim(safe_input ->> 'triggerVerification'), ''), 'unknown'),
    result_due_at,
    coalesce(nullif(btrim(safe_input ->> 'timezone'), ''), target_deadline.timezone),
    nullif(safe_input ->> 'offsetValue', '')::integer,
    nullif(btrim(safe_input ->> 'offsetUnit'), ''),
    nullif(btrim(safe_input ->> 'countingRule'), ''),
    nullif(btrim(safe_input ->> 'businessDayRule'), ''),
    nullif(btrim(safe_input ->> 'weekendRule'), ''),
    nullif(safe_input ->> 'holidayCalendarId', '')::uuid,
    nullif(btrim(safe_input ->> 'holidayCalendarKey'), ''),
    nullif(safe_input ->> 'holidayCalendarVersion', '')::integer,
    case when jsonb_typeof(safe_input -> 'holidaysApplied') = 'array' then safe_input -> 'holidaysApplied' else '[]'::jsonb end,
    case when jsonb_typeof(safe_input -> 'adjustmentApplied') = 'object' then safe_input -> 'adjustmentApplied' else '{}'::jsonb end,
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
    normalized_status,
    case when jsonb_typeof(safe_input -> 'warnings') = 'array' then safe_input -> 'warnings' else '[]'::jsonb end,
    nullif(btrim(safe_input ->> 'staleReason'), ''),
    coalesce(nullif(btrim(safe_input ->> 'calculationContractVersion'), ''), 'contractiq-deadline-engine-v1'),
    normalized_hash,
    nullif(safe_input ->> 'supersedesCalculationId', '')::uuid,
    normalized_status in ('current', 'missed'),
    coalesce(nullif(btrim(safe_input ->> 'correlationId'), ''), idempotency_key),
    coalesce(nullif(safe_input ->> 'generatedAt', '')::timestamptz, now()),
    current_user_id
  )
  on conflict (workspace_id, contract_deadline_id, deterministic_hash) do update
    set is_current = excluded.is_current
  returning * into inserted_result;

  update public.contract_deadlines
  set status = case
        when normalized_status in ('current', 'missed', 'proposed', 'superseded', 'waived', 'completed', 'cancelled', 'expired') then normalized_status
        when normalized_status in ('uncertain', 'missing_trigger', 'missing_rule', 'failed_with_prior_valid') then 'pending_verification'
        when normalized_status = 'stale' then 'pending_verification'
        else status
      end,
      calculated_due_at = case when normalized_status in ('current', 'missed') then result_due_at else calculated_due_at end,
      updated_by = current_user_id
  where id = target_deadline.id;

  update public.contract_command_requests
  set result = jsonb_build_object('calculation_result_id', inserted_result.id, 'calculation_version', inserted_result.calculation_version)
  where id = command.id;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (
    target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id,
    case when normalized_status in ('current', 'missed') then 'contract.deadline_calculated' when normalized_status = 'stale' then 'contract.deadline_stale' else 'contract.deadline_failed' end,
    'contract_deadline_result', inserted_result.id, inserted_result.calculation_version, 'record_contract_deadline_result', idempotency_key,
    jsonb_build_object('contract_deadline_id', target_deadline.id, 'calculation_result_id', inserted_result.id, 'status', inserted_result.status, 'due_at', inserted_result.due_at)
  );
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (
    target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id,
    'contract.deadline_calculated', 'contract_deadline_results', 'contract_deadline_result', inserted_result.id, 'record_contract_deadline_result', idempotency_key,
    jsonb_build_object('status', inserted_result.status, 'due_at', inserted_result.due_at, 'deterministic_hash', inserted_result.deterministic_hash),
    jsonb_build_object('contract_deadline_id', target_deadline.id, 'correlation_id', inserted_result.correlation_id)
  );

  calculation_result_id := inserted_result.id;
  calculation_version := inserted_result.calculation_version;
  status := inserted_result.status;
  due_at := inserted_result.due_at;
  is_current := inserted_result.is_current;
  return next;
end;
$$;

create or replace function public.sync_contract_deadline_to_deal(target_calculation_result_id uuid, idempotency_key text)
returns table (contract_deadline_id uuid, calculation_result_id uuid, canonical_deadline_id uuid, sync_version integer, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  result_row public.contract_deadline_results%rowtype;
  target_contract public.contracts%rowtype;
  deadline_row public.contract_deadlines%rowtype;
  existing_link public.contract_deadline_canonical_links%rowtype;
  existing_canonical public.deadlines%rowtype;
  created_deadline record;
  update_deadline record;
  target_deadline_id uuid;
  target_sync_version integer;
begin
  if current_user_id is null then raise exception 'Authentication required to sync ContractIQ deadlines.' using errcode = '42501'; end if;
  if nullif(btrim(idempotency_key), '') is null then raise exception 'A retry key is required to sync ContractIQ deadlines.' using errcode = '22023'; end if;

  select * into result_row from public.contract_deadline_results result where result.id = target_calculation_result_id for update;
  if result_row.id is null then raise exception 'ContractIQ deadline result is not available.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(result_row.contract_id);
  if target_contract.workspace_id <> result_row.workspace_id then raise exception 'ContractIQ result workspace mismatch.' using errcode = '42501'; end if;
  if not public.has_workspace_permission(result_row.workspace_id, 'deals:manage') then raise exception 'You do not have permission to sync ContractIQ deadlines.' using errcode = '42501'; end if;
  if result_row.status <> 'current' or result_row.due_at is null or result_row.is_current is false then
    raise exception 'Only current verified ContractIQ deadlines may create operational Deal deadlines.' using errcode = '22023';
  end if;

  select * into deadline_row from public.contract_deadlines where id = result_row.contract_deadline_id for update;
  select * into existing_link from public.contract_deadline_canonical_links link where link.workspace_id = result_row.workspace_id and link.contract_deadline_id = result_row.contract_deadline_id for update;

  if existing_link.id is not null and existing_link.idempotency_key = idempotency_key then
    contract_deadline_id := existing_link.contract_deadline_id;
    calculation_result_id := existing_link.calculation_result_id;
    canonical_deadline_id := existing_link.canonical_deadline_id;
    sync_version := existing_link.sync_version;
    status := existing_link.status;
    return next; return;
  end if;

  if existing_link.canonical_deadline_id is not null then
    select * into existing_canonical from public.deadlines where id = existing_link.canonical_deadline_id for update;
  end if;

  if existing_canonical.id is not null and existing_canonical.status in ('completed', 'cancelled') then
    update public.contract_deadline_canonical_links
    set calculation_result_id = result_row.id,
        calculation_version = result_row.calculation_version,
        status = 'skipped',
        stale_reason = 'Canonical deadline was already terminal and was not resurrected.',
        sync_version = sync_version + 1,
        idempotency_key = sync_contract_deadline_to_deal.idempotency_key,
        updated_by = current_user_id
    where id = existing_link.id
    returning contract_deadline_canonical_links.canonical_deadline_id, contract_deadline_canonical_links.sync_version, contract_deadline_canonical_links.status
      into canonical_deadline_id, target_sync_version, status;
  elsif existing_canonical.id is not null then
    select * into update_deadline
    from public.update_deal_deadline(
      existing_canonical.id,
      jsonb_build_object(
        'title', coalesce(nullif(btrim(deadline_row.deadline_type), ''), 'Contract deadline'),
        'status', 'changed',
        'due_at', result_row.due_at,
        'due_date', null,
        'is_all_day', false,
        'timezone', result_row.timezone,
        'source_type', 'contractiq',
        'source_record_id', result_row.contract_deadline_id,
        'source_term', coalesce(deadline_row.deadline_type, 'Contract deadline'),
        'source_description', 'ContractIQ deterministic deadline calculation',
        'trigger_date', result_row.trigger_at::date,
        'calculation_rule', concat_ws(' / ', result_row.offset_value::text || ' ' || result_row.offset_unit, result_row.counting_rule, result_row.weekend_rule),
        'verification_state', 'source_verified'
      ),
      existing_canonical.version
    );
    update public.contract_deadline_canonical_links
    set calculation_result_id = result_row.id,
        calculation_version = result_row.calculation_version,
        status = 'linked',
        sync_version = sync_version + 1,
        last_synced_at = now(),
        idempotency_key = sync_contract_deadline_to_deal.idempotency_key,
        updated_by = current_user_id
    where id = existing_link.id
    returning contract_deadline_canonical_links.canonical_deadline_id, contract_deadline_canonical_links.sync_version, contract_deadline_canonical_links.status
      into canonical_deadline_id, target_sync_version, status;
  else
    select * into created_deadline
    from public.create_deal_deadline(
      result_row.deal_id,
      jsonb_build_object(
        'title', concat('Contract deadline: ', coalesce(nullif(btrim(deadline_row.deadline_type), ''), 'review')),
        'status', 'open',
        'due_at', result_row.due_at,
        'due_date', null,
        'is_all_day', false,
        'timezone', result_row.timezone,
        'source_type', 'contractiq',
        'source_record_id', result_row.contract_deadline_id,
        'source_term', coalesce(deadline_row.deadline_type, 'Contract deadline'),
        'source_description', 'ContractIQ deterministic deadline calculation',
        'trigger_date', result_row.trigger_at::date,
        'calculation_rule', concat_ws(' / ', result_row.offset_value::text || ' ' || result_row.offset_unit, result_row.counting_rule, result_row.weekend_rule),
        'verification_state', 'source_verified'
      ),
      concat(idempotency_key, ':deal_deadline')
    );
    target_deadline_id := created_deadline.deadline_id;
    insert into public.contract_deadline_canonical_links (
      workspace_id, deal_id, contract_id, contract_deadline_id, calculation_result_id, calculation_version,
      canonical_deadline_id, source, status, sync_version, last_synced_at, idempotency_key, created_by, updated_by
    )
    values (
      result_row.workspace_id, result_row.deal_id, result_row.contract_id, result_row.contract_deadline_id, result_row.id,
      result_row.calculation_version, target_deadline_id, 'contractiq_deadline_calculation', 'linked', 1, now(), idempotency_key,
      current_user_id, current_user_id
    )
    returning contract_deadline_canonical_links.canonical_deadline_id, contract_deadline_canonical_links.sync_version, contract_deadline_canonical_links.status
      into canonical_deadline_id, target_sync_version, status;
  end if;

  update public.contract_deadlines
  set canonical_task_id = canonical_deadline_id,
      updated_by = current_user_id
  where id = result_row.contract_deadline_id;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (
    result_row.workspace_id, result_row.deal_id, target_contract.property_id, current_user_id,
    'deal.deadline_updated', 'deadline', canonical_deadline_id, target_sync_version, 'sync_contract_deadline_to_deal', idempotency_key,
    jsonb_build_object('contract_deadline_id', result_row.contract_deadline_id, 'calculation_result_id', result_row.id, 'canonical_deadline_id', canonical_deadline_id)
  );
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, metadata)
  values (
    result_row.workspace_id, result_row.deal_id, target_contract.property_id, current_user_id,
    'deal.deadline_updated', 'deadlines', 'deadline', canonical_deadline_id, 'sync_contract_deadline_to_deal', idempotency_key,
    jsonb_build_object('contract_deadline_id', result_row.contract_deadline_id, 'calculation_result_id', result_row.id, 'sync_status', status)
  );

  contract_deadline_id := result_row.contract_deadline_id;
  calculation_result_id := result_row.id;
  sync_version := target_sync_version;
  return next;
end;
$$;

drop view if exists public.contract_projection;

create or replace view public.contract_projection
with (security_invoker = true)
as
select
  contract.id as contract_id,
  contract.version as contract_version,
  contract.workspace_id,
  contract.deal_id,
  contract.property_id,
  contract.contract_type,
  contract.title,
  contract.perspective,
  contract.status,
  contract.verification_state,
  contract.analysis_state,
  contract.classification_state,
  contract.extraction_freshness_state,
  contract.confidence,
  count(distinct evidence_link.id) filter (where evidence_link.archived_at is null) as evidence_count,
  count(distinct party.id) filter (where party.archived_at is null) as party_count,
  count(distinct party.id) filter (where party.verification_state in ('verified', 'professional_verified') and party.archived_at is null) as verified_party_count,
  count(distinct party.id) filter (where party.verification_state in ('unverified', 'unknown', 'conflicted', 'source_backed') and party.archived_at is null) as unverified_party_count,
  count(distinct term.id) filter (where term.archived_at is null) as term_count,
  count(distinct term.id) filter (where term.proposal_state = 'accepted' and term.archived_at is null) as accepted_term_count,
  count(distinct term.id) filter (where term.proposal_state = 'proposed' and term.archived_at is null) as proposed_term_count,
  count(distinct term.id) filter (where term.term_category = 'contingency' and term.archived_at is null) + count(distinct deadline.id) filter (where deadline.status = 'pending_verification' and deadline.archived_at is null) as contingency_count,
  count(distinct relationship.id) filter (where relationship.relationship_type in ('amends','amended_by','supersedes','superseded_by','supplements','restates') and relationship.archived_at is null)
    + count(distinct base_match.id) filter (where base_match.archived_at is null) as amendment_count,
  count(distinct deadline.id) filter (where deadline.archived_at is null) as deadline_count,
  count(distinct finding.id) filter (where finding.archived_at is null) as finding_count,
  count(distinct finding.id) filter (where finding.finding_category in ('missing_party','missing_signature','incomplete_legal_description','missing_contingency_detail','missing_base_contract','unreadable_clause','incomplete_source') and finding.archived_at is null) as missing_input_count,
  count(distinct conflict.id) filter (where conflict.resolution_state in ('unresolved', 'under_review', 'professional_review_required') and conflict.archived_at is null) as unresolved_conflict_count,
  count(distinct question.id) filter (where question.status in ('open', 'in_progress') and question.archived_at is null) as open_question_count,
  count(distinct finding.id) filter (where finding.professional_review_required and finding.archived_at is null)
    + count(distinct conflict.id) filter (where conflict.professional_review_required and conflict.archived_at is null)
    + count(distinct supersession.id) filter (where supersession.professional_review_required and supersession.archived_at is null)
    + count(distinct base_match.id) filter (where base_match.professional_review_required and base_match.archived_at is null) as professional_review_count,
  contract.prior_valid_analysis_run_id is not null and contract.analysis_state = 'failed_with_prior_analysis' as prior_valid_after_failure,
  bool_or(finding.professional_review_required) filter (where finding.archived_at is null)
    or bool_or(deadline.professional_review_required) filter (where deadline.archived_at is null)
    or bool_or(conflict.professional_review_required) filter (where conflict.archived_at is null)
    or bool_or(base_match.professional_review_required) filter (where base_match.archived_at is null)
    or bool_or(supersession.professional_review_required) filter (where supersession.archived_at is null)
    or bool_or(result.status in ('uncertain', 'missing_trigger', 'missing_rule', 'failed_with_prior_valid')) filter (where deadline.archived_at is null)
    or contract.analysis_state = 'professional_review_required'
    as professional_review_required,
  jsonb_build_object(
    'sourceEvidenceId', contract.source_evidence_id,
    'classificationState', contract.classification_state,
    'extractionFreshnessState', contract.extraction_freshness_state,
    'sourceAnchoredTermCount', count(distinct term.id) filter (where term.source_anchor <> '{}'::jsonb and term.archived_at is null),
    'sourceAnchoredExtractionCount', count(distinct extraction.id) filter (where extraction.source_anchor <> '{}'::jsonb and extraction.archived_at is null),
    'verificationRequiredCount',
      count(distinct term.id) filter (where term.verification_state in ('unverified', 'unknown', 'conflicted') and term.archived_at is null)
      + count(distinct deadline.id) filter (where deadline.verification_state in ('unverified', 'unknown', 'conflicted') and deadline.archived_at is null)
      + count(distinct party.id) filter (where party.verification_state in ('unverified', 'unknown', 'conflicted') and party.archived_at is null),
    'deadlineCounts',
      jsonb_build_object(
        'current', count(distinct deadline.id) filter (where result.status = 'current' and result.is_current is true and deadline.archived_at is null),
        'proposed', count(distinct deadline.id) filter (where result.status = 'proposed' and deadline.archived_at is null),
        'uncertain', count(distinct deadline.id) filter (where result.status in ('uncertain', 'missing_trigger', 'missing_rule') and deadline.archived_at is null),
        'missed', count(distinct deadline.id) filter (where result.status = 'missed' and result.is_current is true and deadline.archived_at is null),
        'stale', count(distinct deadline.id) filter (where result.status in ('stale', 'failed_with_prior_valid') and deadline.archived_at is null),
        'conflict', count(distinct deadline.id) filter (where result.warnings ? 'DEADLINE_CONFLICT' and deadline.archived_at is null)
      ),
    'nextDeadlineDueAt', min(result.due_at) filter (where result.status in ('current', 'missed') and result.is_current is true and deadline.archived_at is null)
  ) as verification_summary,
  case
    when contract.archived_at is not null then 'archived'
    when contract.status = 'superseded' or contract.analysis_state = 'superseded' then 'superseded'
    when contract.status = 'expired' or contract.analysis_state = 'expired' then 'expired'
    when contract.analysis_state in ('no_contract','uploaded','processing','partial','awaiting_verification','stale','failed_with_prior_analysis','professional_review_required','current_with_conflicts','current') then contract.analysis_state
    when count(distinct conflict.id) filter (where conflict.resolution_state in ('unresolved', 'under_review', 'professional_review_required') and conflict.archived_at is null) > 0 then 'current_with_conflicts'
    when count(distinct result.id) filter (where result.status in ('uncertain', 'missing_trigger', 'missing_rule') and result.is_current is false and deadline.archived_at is null) > 0 then 'current_with_conflicts'
    else 'partial'
  end as projection_state,
  contract.updated_at,
  now() as loaded_at,
  count(distinct deadline.id) filter (where result.status = 'current' and result.is_current is true and deadline.archived_at is null) as verified_current_deadline_count,
  count(distinct deadline.id) filter (where result.status = 'proposed' and deadline.archived_at is null) as proposed_deadline_count,
  count(distinct deadline.id) filter (where result.status in ('uncertain', 'missing_trigger', 'missing_rule') and deadline.archived_at is null) as uncertain_deadline_count,
  count(distinct deadline.id) filter (where result.status = 'missed' and result.is_current is true and deadline.archived_at is null) as missed_deadline_count,
  count(distinct deadline.id) filter (where result.status in ('stale', 'failed_with_prior_valid') and deadline.archived_at is null) as deadline_stale_count,
  count(distinct deadline.id) filter (where result.warnings ? 'DEADLINE_CONFLICT' and deadline.archived_at is null) as deadline_conflict_count,
  min(result.due_at) filter (where result.status in ('current', 'missed') and result.is_current is true and deadline.archived_at is null) as next_deadline_due_at
from public.contracts contract
left join public.contract_evidence_links evidence_link on evidence_link.workspace_id = contract.workspace_id and evidence_link.contract_id = contract.id
left join public.contract_parties party on party.workspace_id = contract.workspace_id and party.contract_id = contract.id
left join public.contract_terms term on term.workspace_id = contract.workspace_id and term.contract_id = contract.id
left join public.contract_deadlines deadline on deadline.workspace_id = contract.workspace_id and deadline.contract_id = contract.id
left join public.contract_deadline_results result on result.workspace_id = deadline.workspace_id and result.contract_deadline_id = deadline.id
left join public.contract_findings finding on finding.workspace_id = contract.workspace_id and finding.contract_id = contract.id
left join public.contract_conflicts conflict on conflict.workspace_id = contract.workspace_id and conflict.contract_id = contract.id
left join public.contract_questions question on question.workspace_id = contract.workspace_id and question.contract_id = contract.id
left join public.contract_relationships relationship on relationship.workspace_id = contract.workspace_id and relationship.contract_id = contract.id
left join public.contract_base_match_candidates base_match on base_match.workspace_id = contract.workspace_id and base_match.contract_id = contract.id
left join public.contract_supersession_candidates supersession on supersession.workspace_id = contract.workspace_id and supersession.contract_id = contract.id
left join public.contract_extraction_items extraction on extraction.workspace_id = contract.workspace_id and extraction.contract_id = contract.id
group by contract.id;

create or replace function public.load_contract_detail(target_contract_id uuid)
returns table (
  record_type text,
  record_id uuid,
  record_version integer,
  workspace_id uuid,
  contract_id uuid,
  deal_id uuid,
  property_id uuid,
  label text,
  status text,
  verification_state text,
  source_evidence_id uuid,
  source_anchor jsonb,
  payload jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_contract public.contracts%rowtype;
begin
  target_contract := public.authorized_contract(target_contract_id);
  return query
  select 'contract'::text, target_contract.id, target_contract.version, target_contract.workspace_id, target_contract.id, target_contract.deal_id, target_contract.property_id, target_contract.title, target_contract.status, target_contract.verification_state, target_contract.source_evidence_id, '{}'::jsonb, jsonb_build_object('title', target_contract.title, 'contract_type', target_contract.contract_type, 'perspective', target_contract.perspective, 'status', target_contract.status, 'verification_state', target_contract.verification_state, 'analysis_state', target_contract.analysis_state, 'confidence', target_contract.confidence, 'source_evidence_id', target_contract.source_evidence_id, 'effective_date', target_contract.effective_date, 'execution_date', target_contract.execution_date, 'expiration_date', target_contract.expiration_date, 'closing_date', target_contract.closing_date), target_contract.updated_at
  union all
  select 'deadline'::text, deadline.id, deadline.version, deadline.workspace_id, deadline.contract_id, target_contract.deal_id, target_contract.property_id, deadline.deadline_type, deadline.status, deadline.verification_state, deadline.source_evidence_id, deadline.source_anchor, to_jsonb(deadline.*) - 'workspace_id' - 'contract_id', deadline.updated_at
  from public.contract_deadlines deadline where deadline.workspace_id = target_contract.workspace_id and deadline.contract_id = target_contract.id and deadline.archived_at is null
  union all
  select 'deadline_result'::text, result.id, result.calculation_version, result.workspace_id, result.contract_id, result.deal_id, target_contract.property_id, result.counting_rule, result.status, result.trigger_verification, result.source_evidence_id, result.source_anchor, to_jsonb(result.*) - 'workspace_id' - 'contract_id' - 'deal_id', result.created_at
  from public.contract_deadline_results result where result.workspace_id = target_contract.workspace_id and result.contract_id = target_contract.id
  union all
  select 'deadline_link'::text, link.id, link.sync_version, link.workspace_id, link.contract_id, link.deal_id, target_contract.property_id, link.source, link.status, link.status, null::uuid, '{}'::jsonb, to_jsonb(link.*) - 'workspace_id' - 'contract_id' - 'deal_id', link.updated_at
  from public.contract_deadline_canonical_links link where link.workspace_id = target_contract.workspace_id and link.contract_id = target_contract.id
  union all
  select 'evidence_link'::text, link.id, link.version, link.workspace_id, link.contract_id, target_contract.deal_id, target_contract.property_id, link.link_role, link.link_role, link.verification_state, link.evidence_id, link.source_anchor, to_jsonb(link.*) - 'workspace_id' - 'contract_id', link.updated_at
  from public.contract_evidence_links link where link.workspace_id = target_contract.workspace_id and link.contract_id = target_contract.id and link.archived_at is null
  union all
  select 'party'::text, party.id, party.version, party.workspace_id, party.contract_id, target_contract.deal_id, target_contract.property_id, party.display_name, party.party_role, party.verification_state, party.source_evidence_id, party.source_anchor, to_jsonb(party.*) - 'workspace_id' - 'contract_id', party.updated_at
  from public.contract_parties party where party.workspace_id = target_contract.workspace_id and party.contract_id = target_contract.id and party.archived_at is null
  union all
  select 'term'::text, term.id, term.version, term.workspace_id, term.contract_id, target_contract.deal_id, target_contract.property_id, term.title, term.proposal_state, term.verification_state, term.source_evidence_id, term.source_anchor, to_jsonb(term.*) - 'workspace_id' - 'contract_id', term.updated_at
  from public.contract_terms term where term.workspace_id = target_contract.workspace_id and term.contract_id = target_contract.id and term.archived_at is null
  union all
  select 'finding'::text, finding.id, finding.version, finding.workspace_id, finding.contract_id, target_contract.deal_id, target_contract.property_id, finding.summary, finding.proposal_state, finding.verification_state, finding.source_evidence_id, finding.source_anchor, to_jsonb(finding.*) - 'workspace_id' - 'contract_id', finding.updated_at
  from public.contract_findings finding where finding.workspace_id = target_contract.workspace_id and finding.contract_id = target_contract.id and finding.archived_at is null
  union all
  select 'conflict'::text, conflict.id, conflict.version, conflict.workspace_id, conflict.contract_id, target_contract.deal_id, target_contract.property_id, conflict.summary, conflict.resolution_state, case when conflict.professional_review_required then 'unknown' else 'source_backed' end, conflict.source_a_evidence_id, conflict.source_a_anchor, to_jsonb(conflict.*) - 'workspace_id' - 'contract_id', conflict.updated_at
  from public.contract_conflicts conflict where conflict.workspace_id = target_contract.workspace_id and conflict.contract_id = target_contract.id and conflict.archived_at is null
  union all
  select 'relationship'::text, relationship.id, relationship.version, relationship.workspace_id, relationship.contract_id, target_contract.deal_id, target_contract.property_id, relationship.relationship_type, relationship.relationship_type, relationship.verification_state, relationship.source_evidence_id, relationship.source_anchor, to_jsonb(relationship.*) - 'workspace_id' - 'contract_id', relationship.updated_at
  from public.contract_relationships relationship where relationship.workspace_id = target_contract.workspace_id and relationship.contract_id = target_contract.id and relationship.archived_at is null
  union all
  select 'change_proposal'::text, proposal.id, proposal.version, proposal.workspace_id, proposal.contract_id, target_contract.deal_id, target_contract.property_id, proposal.proposal_type, proposal.status, case when proposal.professional_review_required then 'unknown' else 'source_backed' end, proposal.source_evidence_id, proposal.source_anchor, to_jsonb(proposal.*) - 'workspace_id' - 'contract_id', proposal.updated_at
  from public.contract_change_proposals proposal where proposal.workspace_id = target_contract.workspace_id and proposal.contract_id = target_contract.id and proposal.archived_at is null
  union all
  select 'question'::text, question.id, question.version, question.workspace_id, question.contract_id, target_contract.deal_id, target_contract.property_id, question.question, question.status, question.resolution_state, question.source_evidence_id, question.source_anchor, to_jsonb(question.*) - 'workspace_id' - 'contract_id', question.updated_at
  from public.contract_questions question where question.workspace_id = target_contract.workspace_id and question.contract_id = target_contract.id and question.archived_at is null;
end;
$$;

revoke insert, update, delete on public.contract_holiday_calendars from authenticated;
revoke insert, update, delete on public.contract_deadline_results from authenticated;
revoke insert, update, delete on public.contract_deadline_canonical_links from authenticated;
revoke execute on function public.record_contract_deadline_result(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.sync_contract_deadline_to_deal(uuid, text) from public, anon;
grant select on public.contract_holiday_calendars to authenticated;
grant select on public.contract_deadline_results to authenticated;
grant select on public.contract_deadline_canonical_links to authenticated;
grant execute on function public.record_contract_deadline_result(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.sync_contract_deadline_to_deal(uuid, text) to authenticated;

-- Specification 011 Slice 3 repair: tolerate semantic holiday calendar keys and
-- qualify sync version increments inside deadline synchronization.

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
  requested_calendar_id text := nullif(btrim(safe_input ->> 'holidayCalendarId'), '');
  requested_calendar_uuid_text text := coalesce(nullif(btrim(safe_input ->> 'holidayCalendarUuid'), ''), case when nullif(btrim(safe_input ->> 'holidayCalendarId'), '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then nullif(btrim(safe_input ->> 'holidayCalendarId'), '') end);
  requested_calendar_key text := coalesce(nullif(btrim(safe_input ->> 'holidayCalendarKey'), ''), case when requested_calendar_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then requested_calendar_id end);
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
    case when requested_calendar_uuid_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then requested_calendar_uuid_text::uuid end,
    requested_calendar_key,
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
        sync_version = public.contract_deadline_canonical_links.sync_version + 1,
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
        sync_version = public.contract_deadline_canonical_links.sync_version + 1,
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

revoke execute on function public.record_contract_deadline_result(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.sync_contract_deadline_to_deal(uuid, text) from public, anon;
grant execute on function public.record_contract_deadline_result(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.sync_contract_deadline_to_deal(uuid, text) to authenticated;

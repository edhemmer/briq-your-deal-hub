-- Specification 011 Slice 3 repair: remove unused sync RPC local state flagged by
-- Supabase plpgsql lint while preserving canonical Deal deadline delegation.

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
    perform *
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

revoke execute on function public.sync_contract_deadline_to_deal(uuid, text) from public, anon;
grant execute on function public.sync_contract_deadline_to_deal(uuid, text) to authenticated;

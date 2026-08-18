-- Specification 009 Slice 2: deterministic debt schedules.
-- FinanceIQ still owns financing structures and debt tranche terms only.
-- Specification 005 underwriting owns authoritative debt schedule results.

create table if not exists public.underwriting_debt_schedule_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  financing_structure_id uuid not null,
  financing_structure_version integer not null check (financing_structure_version > 0),
  debt_tranche_id uuid not null,
  debt_tranche_version integer not null check (debt_tranche_version > 0),
  result_version text not null,
  engine_version text not null,
  hash_version text not null,
  schedule_type text not null check (schedule_type in (
    'fully_amortizing_fixed',
    'interest_only_then_amortizing',
    'balloon_maturity',
    'full_term_interest_only',
    'variable_rate_current_effective'
  )),
  status text not null check (status in ('complete', 'complete_with_warnings', 'invalid_input')),
  input_hash text not null,
  result_hash text not null,
  input_payload jsonb not null check (jsonb_typeof(input_payload) = 'object'),
  result_payload jsonb not null check (jsonb_typeof(result_payload) = 'object'),
  annual_interest_rate_used numeric(12,9),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  period_count integer not null default 0 check (period_count >= 0),
  first_periodic_debt_service numeric(14,2),
  final_periodic_debt_service numeric(14,2),
  total_principal_paid numeric(14,2) not null default 0,
  total_interest_paid numeric(14,2) not null default 0,
  total_balloon_paid numeric(14,2) not null default 0,
  total_debt_service numeric(14,2) not null default 0,
  ending_balance numeric(14,2) not null default 0,
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  errors jsonb not null default '[]'::jsonb check (jsonb_typeof(errors) = 'array'),
  calculated_by uuid not null references auth.users(id) on delete restrict,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint underwriting_debt_schedule_results_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  constraint underwriting_debt_schedule_results_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete restrict,
  constraint underwriting_debt_schedule_results_tranche_fk foreign key (debt_tranche_id)
    references public.debt_tranches(id) on delete restrict,
  unique (workspace_id, debt_tranche_id, result_hash)
);

create table if not exists public.underwriting_debt_schedule_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  financing_structure_id uuid not null,
  debt_tranche_id uuid not null,
  result_id uuid not null references public.underwriting_debt_schedule_results(id) on delete restrict,
  idempotency_key text not null,
  request_hash text not null,
  input_hash text not null,
  result_hash text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint underwriting_debt_schedule_requests_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (workspace_id, idempotency_key)
);

create index if not exists idx_underwriting_debt_schedule_results_structure
  on public.underwriting_debt_schedule_results(workspace_id, financing_structure_id, calculated_at desc);

create index if not exists idx_underwriting_debt_schedule_results_tranche
  on public.underwriting_debt_schedule_results(workspace_id, debt_tranche_id, calculated_at desc);

create index if not exists idx_underwriting_debt_schedule_results_status
  on public.underwriting_debt_schedule_results(workspace_id, status, calculated_at desc);

create index if not exists idx_underwriting_debt_schedule_requests_creator
  on public.underwriting_debt_schedule_requests(created_by, created_at desc);

alter table public.underwriting_debt_schedule_results enable row level security;
alter table public.underwriting_debt_schedule_requests enable row level security;

drop policy if exists "underwriting debt schedule results read workspace members" on public.underwriting_debt_schedule_results;
create policy "underwriting debt schedule results read workspace members"
  on public.underwriting_debt_schedule_results for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "underwriting debt schedule results no direct insert" on public.underwriting_debt_schedule_results;
create policy "underwriting debt schedule results no direct insert"
  on public.underwriting_debt_schedule_results for insert to authenticated
  with check (false);

drop policy if exists "underwriting debt schedule results no direct update" on public.underwriting_debt_schedule_results;
create policy "underwriting debt schedule results no direct update"
  on public.underwriting_debt_schedule_results for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting debt schedule results no direct delete" on public.underwriting_debt_schedule_results;
create policy "underwriting debt schedule results no direct delete"
  on public.underwriting_debt_schedule_results for delete to authenticated
  using (false);

drop policy if exists "underwriting debt schedule requests read creator" on public.underwriting_debt_schedule_requests;
create policy "underwriting debt schedule requests read creator"
  on public.underwriting_debt_schedule_requests for select to authenticated
  using (
    created_by = (select auth.uid())
    and public.is_workspace_member(workspace_id)
  );

drop policy if exists "underwriting debt schedule requests no direct insert" on public.underwriting_debt_schedule_requests;
create policy "underwriting debt schedule requests no direct insert"
  on public.underwriting_debt_schedule_requests for insert to authenticated
  with check (false);

drop policy if exists "underwriting debt schedule requests no direct update" on public.underwriting_debt_schedule_requests;
create policy "underwriting debt schedule requests no direct update"
  on public.underwriting_debt_schedule_requests for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting debt schedule requests no direct delete" on public.underwriting_debt_schedule_requests;
create policy "underwriting debt schedule requests no direct delete"
  on public.underwriting_debt_schedule_requests for delete to authenticated
  using (false);

drop trigger if exists underwriting_debt_schedule_results_immutable on public.underwriting_debt_schedule_results;
create trigger underwriting_debt_schedule_results_immutable
before update or delete on public.underwriting_debt_schedule_results
for each row execute function public.prevent_underwriting_output_mutation();

drop trigger if exists underwriting_debt_schedule_requests_immutable on public.underwriting_debt_schedule_requests;
create trigger underwriting_debt_schedule_requests_immutable
before update or delete on public.underwriting_debt_schedule_requests
for each row execute function public.prevent_underwriting_output_mutation();

create or replace function public.create_underwriting_debt_schedule_result(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_financing_structure_id uuid,
  target_debt_tranche_id uuid,
  idempotency_key text,
  expected_debt_tranche_version integer,
  schedule_payload jsonb
)
returns table (
  result_id uuid,
  status text,
  result_hash text,
  reused boolean,
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
  safe_payload jsonb := public.safe_event_jsonb(coalesce(schedule_payload, '{}'::jsonb));
  target_structure public.financing_structures%rowtype;
  target_tranche public.debt_tranches%rowtype;
  existing_request public.underwriting_debt_schedule_requests%rowtype;
  existing_result public.underwriting_debt_schedule_results%rowtype;
  inserted_result public.underwriting_debt_schedule_results%rowtype;
  requested_input_hash text := nullif(btrim(safe_payload ->> 'inputHash'), '');
  requested_result_hash text := nullif(btrim(safe_payload ->> 'resultHash'), '');
  request_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to create debt schedules.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely create debt schedules.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_payload) <> 'object' then raise exception 'Debt schedule payload must be an object.' using errcode = '22023'; end if;
  if requested_input_hash is null or requested_result_hash is null then raise exception 'Debt schedule input and result hashes are required.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'underwriting:run') then raise exception 'You do not have permission to run underwriting in this BRIX workspace.' using errcode = '42501'; end if;

  select * into target_structure
  from public.financing_structures
  where id = target_financing_structure_id
    and workspace_id = target_workspace_id
    and deal_id = target_deal_id
    and archived_at is null;
  if target_structure.id is null then raise exception 'Financing structure is not available for debt schedule calculation.' using errcode = 'P0002'; end if;

  select * into target_tranche
  from public.debt_tranches
  where id = target_debt_tranche_id
    and workspace_id = target_workspace_id
    and financing_structure_id = target_financing_structure_id
    and archived_at is null
  for share;
  if target_tranche.id is null then raise exception 'Debt tranche is not available for schedule calculation.' using errcode = 'P0002'; end if;
  if target_tranche.version <> expected_debt_tranche_version then raise exception 'Debt tranche terms changed before schedule calculation. Reload and retry.' using errcode = '40001'; end if;

  if safe_payload ->> 'resultVersion' <> 'underwriting-debt-schedule-result-v1' then raise exception 'Unsupported debt schedule result version.' using errcode = '22023'; end if;
  if safe_payload ->> 'engineVersion' <> 'underwriting-debt-schedule-engine-v1' then raise exception 'Unsupported debt schedule engine version.' using errcode = '22023'; end if;
  if safe_payload ->> 'hashVersion' <> 'underwriting-debt-schedule-hash-v1' then raise exception 'Unsupported debt schedule hash version.' using errcode = '22023'; end if;
  if safe_payload ->> 'workspaceId' <> target_workspace_id::text then raise exception 'Debt schedule workspace mismatch.' using errcode = '22023'; end if;
  if safe_payload ->> 'dealId' <> target_deal_id::text then raise exception 'Debt schedule Deal mismatch.' using errcode = '22023'; end if;
  if safe_payload ->> 'financingStructureId' <> target_financing_structure_id::text then raise exception 'Debt schedule financing structure mismatch.' using errcode = '22023'; end if;
  if safe_payload ->> 'debtTrancheId' <> target_debt_tranche_id::text then raise exception 'Debt schedule tranche mismatch.' using errcode = '22023'; end if;
  if coalesce((safe_payload ->> 'debtTrancheVersion')::integer, 0) <> expected_debt_tranche_version then raise exception 'Debt schedule tranche version mismatch.' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(safe_payload -> 'periods', '[]'::jsonb)) <> 'array' then raise exception 'Debt schedule periods must be an array.' using errcode = '22023'; end if;

  request_hash := md5(jsonb_build_object(
    'workspaceId', target_workspace_id,
    'dealId', target_deal_id,
    'financingStructureId', target_financing_structure_id,
    'debtTrancheId', target_debt_tranche_id,
    'debtTrancheVersion', expected_debt_tranche_version,
    'inputHash', requested_input_hash,
    'resultHash', requested_result_hash
  )::text);

  select * into existing_request
  from public.underwriting_debt_schedule_requests
  where workspace_id = target_workspace_id
    and idempotency_key = cleaned_key
  for update;
  if existing_request.id is not null then
    if existing_request.request_hash <> request_hash then
      raise exception 'This debt schedule retry key was already used with different output.' using errcode = '23505';
    end if;
    select * into existing_result from public.underwriting_debt_schedule_results where id = existing_request.result_id;
    result_id := existing_result.id;
    status := existing_result.status;
    result_hash := existing_result.result_hash;
    reused := true;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  select * into existing_result
  from public.underwriting_debt_schedule_results
  where workspace_id = target_workspace_id
    and debt_tranche_id = target_debt_tranche_id
    and result_hash = requested_result_hash;
  if existing_result.id is not null then
    insert into public.underwriting_debt_schedule_requests (
      workspace_id, deal_id, financing_structure_id, debt_tranche_id, result_id, idempotency_key, request_hash, input_hash, result_hash, created_by
    )
    values (
      target_workspace_id, target_deal_id, target_financing_structure_id, target_debt_tranche_id, existing_result.id, cleaned_key, request_hash, requested_input_hash, requested_result_hash, current_user_id
    );
    result_id := existing_result.id;
    status := existing_result.status;
    result_hash := existing_result.result_hash;
    reused := true;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  insert into public.underwriting_debt_schedule_results (
    workspace_id,
    deal_id,
    financing_structure_id,
    financing_structure_version,
    debt_tranche_id,
    debt_tranche_version,
    result_version,
    engine_version,
    hash_version,
    schedule_type,
    status,
    input_hash,
    result_hash,
    input_payload,
    result_payload,
    annual_interest_rate_used,
    currency,
    period_count,
    first_periodic_debt_service,
    final_periodic_debt_service,
    total_principal_paid,
    total_interest_paid,
    total_balloon_paid,
    total_debt_service,
    ending_balance,
    warnings,
    errors,
    calculated_by,
    calculated_at
  )
  values (
    target_workspace_id,
    target_deal_id,
    target_financing_structure_id,
    coalesce((safe_payload ->> 'financingStructureVersion')::integer, target_structure.version),
    target_debt_tranche_id,
    expected_debt_tranche_version,
    safe_payload ->> 'resultVersion',
    safe_payload ->> 'engineVersion',
    safe_payload ->> 'hashVersion',
    safe_payload ->> 'scheduleType',
    safe_payload ->> 'status',
    requested_input_hash,
    requested_result_hash,
    coalesce(safe_payload -> 'input', '{}'::jsonb),
    safe_payload,
    nullif(safe_payload ->> 'annualInterestRateUsed', '')::numeric,
    coalesce(nullif(safe_payload ->> 'currency', ''), target_structure.currency),
    coalesce((safe_payload ->> 'periodCount')::integer, jsonb_array_length(coalesce(safe_payload -> 'periods', '[]'::jsonb))),
    nullif(safe_payload ->> 'firstPeriodicDebtService', '')::numeric,
    nullif(safe_payload ->> 'finalPeriodicDebtService', '')::numeric,
    coalesce((safe_payload ->> 'totalPrincipalPaid')::numeric, 0),
    coalesce((safe_payload ->> 'totalInterestPaid')::numeric, 0),
    coalesce((safe_payload ->> 'totalBalloonPaid')::numeric, 0),
    coalesce((safe_payload ->> 'totalDebtService')::numeric, 0),
    coalesce((safe_payload ->> 'endingBalance')::numeric, 0),
    coalesce(safe_payload -> 'warnings', '[]'::jsonb),
    coalesce(safe_payload -> 'errors', '[]'::jsonb),
    current_user_id,
    coalesce(nullif(safe_payload ->> 'calculatedAt', '')::timestamptz, now())
  )
  returning * into inserted_result;

  insert into public.underwriting_debt_schedule_requests (
    workspace_id, deal_id, financing_structure_id, debt_tranche_id, result_id, idempotency_key, request_hash, input_hash, result_hash, created_by
  )
  values (
    target_workspace_id, target_deal_id, target_financing_structure_id, target_debt_tranche_id, inserted_result.id, cleaned_key, request_hash, requested_input_hash, requested_result_hash, current_user_id
  );

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (
    target_workspace_id,
    target_deal_id,
    current_user_id,
    case when inserted_result.status = 'invalid_input' then 'underwriting.debt_schedule_failed' else 'underwriting.debt_schedule_calculated' end,
    'underwriting_debt_schedule_result',
    inserted_result.id,
    1,
    'create_underwriting_debt_schedule_result',
    cleaned_key || ':underwriting.debt_schedule',
    jsonb_build_object(
      'financing_structure_id', target_financing_structure_id,
      'debt_tranche_id', target_debt_tranche_id,
      'status', inserted_result.status,
      'input_hash', inserted_result.input_hash,
      'result_hash', inserted_result.result_hash
    )
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    target_deal_id,
    current_user_id,
    'underwriting.debt_schedule_result_created',
    'underwriting_debt_schedule_results',
    'underwriting_debt_schedule_result',
    inserted_result.id,
    'create_underwriting_debt_schedule_result',
    cleaned_key || ':audit',
    jsonb_build_object(
      'status', inserted_result.status,
      'schedule_type', inserted_result.schedule_type,
      'input_hash', inserted_result.input_hash,
      'result_hash', inserted_result.result_hash
    ),
    array['status', 'schedule_type', 'input_hash', 'result_hash'],
    jsonb_build_object('engine_version', inserted_result.engine_version, 'financeiq_projection_only', true)
  )
  on conflict do nothing;

  result_id := inserted_result.id;
  status := inserted_result.status;
  result_hash := inserted_result.result_hash;
  reused := false;
  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace view public.underwriting_latest_debt_schedule_results
with (security_invoker = true)
as
select distinct on (result.workspace_id, result.deal_id, result.financing_structure_id, result.debt_tranche_id)
  result.*
from public.underwriting_debt_schedule_results result
where result.status in ('complete', 'complete_with_warnings')
order by result.workspace_id, result.deal_id, result.financing_structure_id, result.debt_tranche_id, result.calculated_at desc, result.id desc;

create or replace function public.list_financeiq_debt_schedule_projection(target_financing_structure_id uuid)
returns table (
  workspace_id uuid,
  deal_id uuid,
  financing_structure_id uuid,
  financing_structure_version integer,
  debt_tranche_id uuid,
  debt_tranche_version integer,
  debt_tranche_label text,
  result_id uuid,
  schedule_type text,
  schedule_status text,
  engine_version text,
  input_hash text,
  result_hash text,
  currency text,
  period_count integer,
  first_periodic_debt_service numeric,
  final_periodic_debt_service numeric,
  total_principal_paid numeric,
  total_interest_paid numeric,
  total_balloon_paid numeric,
  total_debt_service numeric,
  warning_count integer,
  latest_calculated_at timestamptz,
  loaded_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  target_structure public.financing_structures%rowtype;
begin
  select * into target_structure
  from public.financing_structures
  where id = target_financing_structure_id
    and archived_at is null;
  if target_structure.id is null then raise exception 'Financing structure is not available.' using errcode = 'P0002'; end if;
  if not public.is_workspace_member(target_structure.workspace_id) then raise exception 'You do not have permission to view this financing structure.' using errcode = '42501'; end if;

  return query
  select
    target_structure.workspace_id,
    target_structure.deal_id,
    target_structure.id,
    target_structure.version,
    tranche.id,
    tranche.version,
    tranche.label,
    coalesce(latest_valid.id, latest_any.id),
    coalesce(latest_valid.schedule_type, latest_any.schedule_type),
    case
      when latest_valid.id is not null and latest_valid.debt_tranche_version = tranche.version then 'current'
      when latest_any.id is not null and latest_any.status = 'invalid_input' and latest_any.debt_tranche_version = tranche.version then 'failed'
      when latest_valid.id is not null then 'stale'
      else 'not_calculated'
    end,
    coalesce(latest_valid.engine_version, latest_any.engine_version),
    coalesce(latest_valid.input_hash, latest_any.input_hash),
    coalesce(latest_valid.result_hash, latest_any.result_hash),
    target_structure.currency,
    latest_valid.period_count,
    latest_valid.first_periodic_debt_service,
    latest_valid.final_periodic_debt_service,
    latest_valid.total_principal_paid,
    latest_valid.total_interest_paid,
    latest_valid.total_balloon_paid,
    latest_valid.total_debt_service,
    coalesce(jsonb_array_length(coalesce(latest_valid.warnings, latest_any.warnings, '[]'::jsonb)), 0),
    coalesce(latest_valid.calculated_at, latest_any.calculated_at),
    now()
  from public.debt_tranches tranche
  left join lateral (
    select *
    from public.underwriting_debt_schedule_results result
    where result.workspace_id = tranche.workspace_id
      and result.financing_structure_id = tranche.financing_structure_id
      and result.debt_tranche_id = tranche.id
      and result.status in ('complete', 'complete_with_warnings')
    order by result.calculated_at desc, result.id desc
    limit 1
  ) latest_valid on true
  left join lateral (
    select *
    from public.underwriting_debt_schedule_results result
    where result.workspace_id = tranche.workspace_id
      and result.financing_structure_id = tranche.financing_structure_id
      and result.debt_tranche_id = tranche.id
    order by result.calculated_at desc, result.id desc
    limit 1
  ) latest_any on true
  where tranche.workspace_id = target_structure.workspace_id
    and tranche.financing_structure_id = target_structure.id
    and tranche.archived_at is null
  order by tranche.updated_at desc, tranche.id;
end;
$$;

grant select on public.underwriting_debt_schedule_results to authenticated;
grant select on public.underwriting_debt_schedule_requests to authenticated;
grant select on public.underwriting_latest_debt_schedule_results to authenticated;

revoke all on function public.create_underwriting_debt_schedule_result(uuid, uuid, uuid, uuid, text, integer, jsonb) from public, anon;
revoke all on function public.list_financeiq_debt_schedule_projection(uuid) from public, anon;

grant execute on function public.create_underwriting_debt_schedule_result(uuid, uuid, uuid, uuid, text, integer, jsonb) to authenticated;
grant execute on function public.list_financeiq_debt_schedule_projection(uuid) to authenticated;

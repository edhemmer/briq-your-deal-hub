-- Specification 009 Slice 5: re-underwriting and strategy integration.
-- FinanceIQ orchestrates financing-driven recalculation state only. Specification
-- 005 remains the sole authoritative underwriting calculator, and Specification
-- 006 remains the sole owner of strategy scoring/ranking.

create extension if not exists pgcrypto;

create table if not exists public.financeiq_reunderwriting_cycles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  financing_structure_id uuid not null,
  financing_structure_version integer not null check (financing_structure_version > 0),
  active_context text not null check (active_context in ('current_deal', 'scenario')),
  scenario_id uuid,
  prior_underwriting_snapshot_id uuid references public.underwriting_snapshots(id) on delete restrict,
  triggering_event_id uuid references public.domain_events(id) on delete set null,
  reason text not null check (reason in (
    'active_financing_structure_changed',
    'financing_terms_changed',
    'debt_tranche_changed',
    'equity_terms_changed',
    'feasibility_changed',
    'lender_constraint_changed',
    'retry'
  )),
  status text not null default 'queued' check (status in (
    'queued',
    'recalculating',
    'current',
    'stale',
    'failed_with_prior_valid_result',
    'failed_without_prior_valid_result',
    'blocked'
  )),
  current_stage text not null default 'underwriting' check (current_stage in ('underwriting', 'strategy', 'cockpit', 'comparison')),
  material_changes jsonb not null default '[]'::jsonb check (jsonb_typeof(material_changes) = 'array'),
  stale_downstream_result_ids text[] not null default '{}'::text[],
  version_graph jsonb not null default '{}'::jsonb check (jsonb_typeof(version_graph) = 'object'),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  failures jsonb not null default '[]'::jsonb check (jsonb_typeof(failures) = 'array'),
  idempotency_key text not null,
  request_hash text not null,
  correlation_id uuid not null default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete restrict,
  retry_count integer not null default 0 check (retry_count >= 0),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint financeiq_reunderwriting_cycles_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint financeiq_reunderwriting_cycles_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete restrict,
  unique (workspace_id, idempotency_key)
);

create table if not exists public.financeiq_reunderwriting_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  reunderwriting_cycle_id uuid not null references public.financeiq_reunderwriting_cycles(id) on delete restrict,
  financing_structure_id uuid not null,
  financing_structure_version integer not null check (financing_structure_version > 0),
  active_context text not null check (active_context in ('current_deal', 'scenario')),
  scenario_id uuid,
  prior_underwriting_snapshot_id uuid references public.underwriting_snapshots(id) on delete restrict,
  new_underwriting_snapshot_id uuid references public.underwriting_snapshots(id) on delete restrict,
  new_underwriting_snapshot_version integer check (new_underwriting_snapshot_version is null or new_underwriting_snapshot_version > 0),
  underwriting_run_id uuid,
  strategy_ranking_id text,
  strategy_ranking_version text,
  cockpit_projection_id text,
  cockpit_projection_version text,
  debt_schedule_result_ids uuid[] not null default '{}'::uuid[],
  stale_downstream_result_ids text[] not null default '{}'::text[],
  calculation_status text not null,
  strategy_reevaluation_status text not null,
  decision_cockpit_refresh_status text not null,
  comparison_refresh_status text not null,
  changed_authoritative_metrics jsonb not null default '[]'::jsonb check (jsonb_typeof(changed_authoritative_metrics) = 'array'),
  version_graph jsonb not null check (jsonb_typeof(version_graph) = 'object'),
  result_payload jsonb not null check (jsonb_typeof(result_payload) = 'object'),
  result_hash text not null,
  generated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  constraint financeiq_reunderwriting_results_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint financeiq_reunderwriting_results_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete restrict,
  unique (workspace_id, reunderwriting_cycle_id),
  unique (workspace_id, result_hash)
);

create index if not exists idx_financeiq_reunderwriting_cycles_deal
  on public.financeiq_reunderwriting_cycles(workspace_id, deal_id, requested_at desc);

create index if not exists idx_financeiq_reunderwriting_cycles_structure
  on public.financeiq_reunderwriting_cycles(workspace_id, financing_structure_id, financing_structure_version, requested_at desc);

create index if not exists idx_financeiq_reunderwriting_cycles_status
  on public.financeiq_reunderwriting_cycles(workspace_id, status, updated_at desc);

create index if not exists idx_financeiq_reunderwriting_cycles_trigger
  on public.financeiq_reunderwriting_cycles(triggering_event_id)
  where triggering_event_id is not null;

create index if not exists idx_financeiq_reunderwriting_results_deal
  on public.financeiq_reunderwriting_results(workspace_id, deal_id, generated_at desc);

create index if not exists idx_financeiq_reunderwriting_results_snapshot
  on public.financeiq_reunderwriting_results(workspace_id, new_underwriting_snapshot_id)
  where new_underwriting_snapshot_id is not null;

alter table public.financeiq_reunderwriting_cycles enable row level security;
alter table public.financeiq_reunderwriting_results enable row level security;

drop policy if exists "financeiq reunderwriting cycles read workspace members" on public.financeiq_reunderwriting_cycles;
create policy "financeiq reunderwriting cycles read workspace members"
  on public.financeiq_reunderwriting_cycles for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "financeiq reunderwriting cycles no direct insert" on public.financeiq_reunderwriting_cycles;
create policy "financeiq reunderwriting cycles no direct insert"
  on public.financeiq_reunderwriting_cycles for insert to authenticated
  with check (false);

drop policy if exists "financeiq reunderwriting cycles no direct update" on public.financeiq_reunderwriting_cycles;
create policy "financeiq reunderwriting cycles no direct update"
  on public.financeiq_reunderwriting_cycles for update to authenticated
  using (false)
  with check (false);

drop policy if exists "financeiq reunderwriting cycles no direct delete" on public.financeiq_reunderwriting_cycles;
create policy "financeiq reunderwriting cycles no direct delete"
  on public.financeiq_reunderwriting_cycles for delete to authenticated
  using (false);

drop policy if exists "financeiq reunderwriting results read workspace members" on public.financeiq_reunderwriting_results;
create policy "financeiq reunderwriting results read workspace members"
  on public.financeiq_reunderwriting_results for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "financeiq reunderwriting results no direct insert" on public.financeiq_reunderwriting_results;
create policy "financeiq reunderwriting results no direct insert"
  on public.financeiq_reunderwriting_results for insert to authenticated
  with check (false);

drop policy if exists "financeiq reunderwriting results no direct update" on public.financeiq_reunderwriting_results;
create policy "financeiq reunderwriting results no direct update"
  on public.financeiq_reunderwriting_results for update to authenticated
  using (false)
  with check (false);

drop policy if exists "financeiq reunderwriting results no direct delete" on public.financeiq_reunderwriting_results;
create policy "financeiq reunderwriting results no direct delete"
  on public.financeiq_reunderwriting_results for delete to authenticated
  using (false);

drop trigger if exists financeiq_reunderwriting_results_immutable on public.financeiq_reunderwriting_results;
create trigger financeiq_reunderwriting_results_immutable
before update or delete on public.financeiq_reunderwriting_results
for each row execute function public.prevent_underwriting_output_mutation();

create or replace function public.request_financing_reunderwriting(
  target_financing_structure_id uuid,
  expected_financing_structure_version integer,
  reason text,
  triggering_event_id uuid,
  idempotency_key text,
  material_changes jsonb default '[]'::jsonb,
  correlation_id uuid default gen_random_uuid()
)
returns table (
  reunderwriting_cycle_id uuid,
  workspace_id uuid,
  deal_id uuid,
  financing_structure_id uuid,
  financing_structure_version integer,
  status text,
  prior_underwriting_snapshot_id uuid,
  stale_downstream_result_ids text[],
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
  target_structure public.financing_structures%rowtype;
  existing_cycle public.financeiq_reunderwriting_cycles%rowtype;
  inserted_cycle public.financeiq_reunderwriting_cycles%rowtype;
  safe_changes jsonb := public.safe_event_jsonb(coalesce(material_changes, '[]'::jsonb));
  request_hash text;
  prior_snapshot uuid;
  downstream_ids text[];
  cycle_status text := 'queued';
  latest_feasibility_status text;
begin
  if current_user_id is null then raise exception 'Authentication required to request financing re-underwriting.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to request financing re-underwriting.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_changes) <> 'array' then raise exception 'Material changes must be an array.' using errcode = '22023'; end if;

  select * into target_structure
  from public.financing_structures
  where id = target_financing_structure_id
    and archived_at is null;
  if target_structure.id is null then raise exception 'Financing structure is not available for re-underwriting.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_structure.workspace_id, 'underwriting:run') then raise exception 'You do not have permission to request re-underwriting in this workspace.' using errcode = '42501'; end if;
  if target_structure.version <> expected_financing_structure_version then raise exception 'Financing structure version is stale.' using errcode = '40001'; end if;
  if not target_structure.is_active then raise exception 'Only the active financing structure can drive current re-underwriting.' using errcode = '22023'; end if;
  if target_structure.status in ('expired', 'superseded', 'declined', 'withdrawn') then
    cycle_status := 'blocked';
  end if;

  select latest.status into latest_feasibility_status
  from public.financeiq_latest_feasibility_results latest
  where latest.workspace_id = target_structure.workspace_id
    and latest.financing_structure_id = target_structure.id;
  if target_structure.active_context = 'current_deal' and latest_feasibility_status in ('not_feasible', 'expired', 'superseded') then
    cycle_status := 'blocked';
  end if;

  prior_snapshot := target_structure.active_underwriting_snapshot_id;
  select coalesce(array_agg(id::text order by compared_at desc), '{}'::text[]) into downstream_ids
  from public.financing_scenario_comparison_results comparison
  where comparison.workspace_id = target_structure.workspace_id
    and comparison.deal_id = target_structure.deal_id
    and comparison.comparison_mode = 'current'
    and target_structure.id = any(comparison.financing_structure_ids);

  request_hash := public.financeiq_requirement_hash(jsonb_build_object(
    'contractVersion', 'financeiq-reunderwriting-contract-v1',
    'workspaceId', target_structure.workspace_id,
    'dealId', target_structure.deal_id,
    'financingStructureId', target_structure.id,
    'financingStructureVersion', target_structure.version,
    'activeContext', target_structure.active_context,
    'scenarioId', target_structure.scenario_id,
    'priorUnderwritingSnapshotId', prior_snapshot,
    'reason', reason,
    'triggeringEventId', triggering_event_id,
    'materialChanges', safe_changes
  ));

  select * into existing_cycle
  from public.financeiq_reunderwriting_cycles cycle
  where cycle.workspace_id = target_structure.workspace_id
    and cycle.idempotency_key = cleaned_key;
  if existing_cycle.id is not null then
    if existing_cycle.request_hash <> request_hash then raise exception 'Idempotency key was reused for a different re-underwriting request.' using errcode = '40001'; end if;
    return query
    select existing_cycle.id, existing_cycle.workspace_id, existing_cycle.deal_id, existing_cycle.financing_structure_id,
      existing_cycle.financing_structure_version, existing_cycle.status, existing_cycle.prior_underwriting_snapshot_id,
      existing_cycle.stale_downstream_result_ids, true, existing_cycle.idempotency_key;
    return;
  end if;

  insert into public.financeiq_reunderwriting_cycles (
    workspace_id, deal_id, financing_structure_id, financing_structure_version, active_context, scenario_id,
    prior_underwriting_snapshot_id, triggering_event_id, reason, status, material_changes,
    stale_downstream_result_ids, version_graph, idempotency_key, request_hash, correlation_id, requested_by
  )
  values (
    target_structure.workspace_id, target_structure.deal_id, target_structure.id, target_structure.version,
    target_structure.active_context, target_structure.scenario_id, prior_snapshot, triggering_event_id, reason,
    cycle_status, safe_changes, downstream_ids,
    jsonb_build_object(
      'graphVersion', 'financeiq-reunderwriting-version-graph-v1',
      'workspaceId', target_structure.workspace_id,
      'dealId', target_structure.deal_id,
      'financingStructureId', target_structure.id,
      'financingStructureVersion', target_structure.version,
      'activeContext', target_structure.active_context,
      'scenarioId', target_structure.scenario_id,
      'priorUnderwritingSnapshotId', prior_snapshot,
      'staleDownstreamResultIds', to_jsonb(downstream_ids)
    ),
    cleaned_key, request_hash, correlation_id, current_user_id
  )
  returning * into inserted_cycle;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload, correlation_id)
  values (
    inserted_cycle.workspace_id, inserted_cycle.deal_id, current_user_id, 'financing.reunderwriting_requested',
    'financeiq_reunderwriting_cycles', inserted_cycle.id, inserted_cycle.financing_structure_version,
    'request_financing_reunderwriting', cleaned_key || ':financing.reunderwriting_requested',
    jsonb_build_object(
      'reunderwriting_cycle_id', inserted_cycle.id,
      'financing_structure_id', inserted_cycle.financing_structure_id,
      'financing_structure_version', inserted_cycle.financing_structure_version,
      'prior_underwriting_snapshot_id', prior_snapshot,
      'status', inserted_cycle.status,
      'stale_downstream_result_ids', to_jsonb(downstream_ids),
      'calculation_authority', 'spec005_underwriting_only',
      'strategy_authority', 'spec006_strategy_only'
    ),
    correlation_id
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (
    inserted_cycle.workspace_id, inserted_cycle.deal_id, current_user_id, 'financing.reunderwriting_requested',
    'financeiq_reunderwriting_cycles', 'financeiq_reunderwriting_cycle', inserted_cycle.id,
    'request_financing_reunderwriting', cleaned_key || ':audit',
    jsonb_build_object('status', inserted_cycle.status, 'financing_structure_id', inserted_cycle.financing_structure_id, 'financing_structure_version', inserted_cycle.financing_structure_version),
    jsonb_build_object('calculation_authority', 'spec005_underwriting_only', 'strategy_authority', 'spec006_strategy_only')
  )
  on conflict do nothing;

  return query
  select inserted_cycle.id, inserted_cycle.workspace_id, inserted_cycle.deal_id, inserted_cycle.financing_structure_id,
    inserted_cycle.financing_structure_version, inserted_cycle.status, inserted_cycle.prior_underwriting_snapshot_id,
    inserted_cycle.stale_downstream_result_ids, false, inserted_cycle.idempotency_key;
end;
$$;

create or replace function public.complete_financing_reunderwriting(
  target_reunderwriting_cycle_id uuid,
  expected_financing_structure_version integer,
  new_underwriting_snapshot_id uuid,
  new_underwriting_snapshot_version integer,
  underwriting_run_id uuid,
  strategy_ranking_id text default null,
  strategy_ranking_version text default null,
  cockpit_projection_id text default null,
  cockpit_projection_version text default null,
  debt_schedule_result_ids uuid[] default '{}'::uuid[],
  result_payload jsonb default '{}'::jsonb
)
returns table (
  reunderwriting_result_id uuid,
  reunderwriting_cycle_id uuid,
  status text,
  result_hash text,
  version_graph jsonb
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_cycle public.financeiq_reunderwriting_cycles%rowtype;
  target_structure public.financing_structures%rowtype;
  target_snapshot public.underwriting_snapshots%rowtype;
  existing_result public.financeiq_reunderwriting_results%rowtype;
  inserted_result public.financeiq_reunderwriting_results%rowtype;
  safe_payload jsonb := public.safe_event_jsonb(coalesce(result_payload, '{}'::jsonb));
  graph jsonb;
  hash_value text;
begin
  if current_user_id is null then raise exception 'Authentication required to complete financing re-underwriting.' using errcode = '42501'; end if;

  select * into target_cycle
  from public.financeiq_reunderwriting_cycles
  where id = target_reunderwriting_cycle_id;
  if target_cycle.id is null then raise exception 'Re-underwriting cycle is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_cycle.workspace_id, 'underwriting:run') then raise exception 'You do not have permission to complete re-underwriting in this workspace.' using errcode = '42501'; end if;

  select * into target_structure
  from public.financing_structures
  where id = target_cycle.financing_structure_id
    and workspace_id = target_cycle.workspace_id
    and deal_id = target_cycle.deal_id
    and archived_at is null;
  if target_structure.id is null then raise exception 'Financing structure is not available.' using errcode = 'P0002'; end if;
  if target_structure.version <> expected_financing_structure_version or target_structure.version <> target_cycle.financing_structure_version then
    update public.financeiq_reunderwriting_cycles
    set status = 'stale', current_stage = 'underwriting', failures = failures || jsonb_build_array(jsonb_build_object('stage', 'underwriting', 'code', 'stale_financing_version', 'safeMessage', 'A newer financing version exists.', 'retryable', false)), updated_at = now(), failed_at = now()
    where id = target_cycle.id;
    raise exception 'Re-underwriting cycle targets a stale financing version.' using errcode = '40001';
  end if;

  select * into target_snapshot
  from public.underwriting_snapshots
  where id = new_underwriting_snapshot_id
    and workspace_id = target_cycle.workspace_id
    and deal_id = target_cycle.deal_id;
  if target_snapshot.id is null then raise exception 'Underwriting snapshot is not available for this financing re-underwriting cycle.' using errcode = 'P0002'; end if;
  if new_underwriting_snapshot_version <> target_snapshot.snapshot_sequence then raise exception 'Underwriting snapshot version does not match the authoritative snapshot sequence.' using errcode = '40001'; end if;

  select * into existing_result
  from public.financeiq_reunderwriting_results
  where workspace_id = target_cycle.workspace_id
    and reunderwriting_cycle_id = target_cycle.id;
  if existing_result.id is not null then
    return query select existing_result.id, existing_result.reunderwriting_cycle_id, existing_result.calculation_status, existing_result.result_hash, existing_result.version_graph;
    return;
  end if;

  graph := jsonb_build_object(
    'graphVersion', 'financeiq-reunderwriting-version-graph-v1',
    'workspaceId', target_cycle.workspace_id,
    'dealId', target_cycle.deal_id,
    'financingStructureId', target_cycle.financing_structure_id,
    'financingStructureVersion', target_cycle.financing_structure_version,
    'activeContext', target_cycle.active_context,
    'scenarioId', target_cycle.scenario_id,
    'debtScheduleResultIds', to_jsonb(coalesce(debt_schedule_result_ids, '{}'::uuid[])),
    'underwritingSnapshotId', new_underwriting_snapshot_id,
    'underwritingSnapshotVersion', target_snapshot.snapshot_sequence,
    'underwritingRunId', underwriting_run_id,
    'strategyRankingId', strategy_ranking_id,
    'strategyRankingVersion', strategy_ranking_version,
    'cockpitProjectionId', cockpit_projection_id,
    'cockpitProjectionVersion', cockpit_projection_version
  );
  hash_value := public.financeiq_requirement_hash(jsonb_build_object('contractVersion', 'financeiq-reunderwriting-contract-v1', 'versionGraph', graph, 'payload', safe_payload));

  insert into public.financeiq_reunderwriting_results (
    workspace_id, deal_id, reunderwriting_cycle_id, financing_structure_id, financing_structure_version,
    active_context, scenario_id, prior_underwriting_snapshot_id, new_underwriting_snapshot_id,
    new_underwriting_snapshot_version, underwriting_run_id, strategy_ranking_id, strategy_ranking_version,
    cockpit_projection_id, cockpit_projection_version, debt_schedule_result_ids, stale_downstream_result_ids,
    calculation_status, strategy_reevaluation_status, decision_cockpit_refresh_status, comparison_refresh_status,
    changed_authoritative_metrics, version_graph, result_payload, result_hash, created_by
  )
  values (
    target_cycle.workspace_id, target_cycle.deal_id, target_cycle.id, target_cycle.financing_structure_id,
    target_cycle.financing_structure_version, target_cycle.active_context, target_cycle.scenario_id,
    target_cycle.prior_underwriting_snapshot_id, target_snapshot.id, target_snapshot.snapshot_sequence,
    underwriting_run_id, strategy_ranking_id, strategy_ranking_version, cockpit_projection_id, cockpit_projection_version,
    coalesce(debt_schedule_result_ids, '{}'::uuid[]), target_cycle.stale_downstream_result_ids,
    'current', case when strategy_ranking_id is null then 'stale' else 'current' end,
    case when cockpit_projection_id is null then 'stale' else 'current' end, 'stale',
    coalesce(safe_payload -> 'changedAuthoritativeMetrics', '[]'::jsonb), graph, safe_payload, hash_value, current_user_id
  )
  returning * into inserted_result;

  update public.financeiq_reunderwriting_cycles
  set status = 'current',
      current_stage = 'comparison',
      version_graph = graph,
      completed_at = now(),
      updated_at = now()
  where id = target_cycle.id;

  update public.financing_structures
  set active_underwriting_snapshot_id = target_snapshot.id,
      updated_at = now()
  where id = target_cycle.financing_structure_id
    and workspace_id = target_cycle.workspace_id
    and version = target_cycle.financing_structure_version;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload, correlation_id)
  values (
    target_cycle.workspace_id, target_cycle.deal_id, current_user_id, 'financing.reunderwriting_completed',
    'financeiq_reunderwriting_results', inserted_result.id, inserted_result.financing_structure_version,
    'complete_financing_reunderwriting', target_cycle.idempotency_key || ':financing.reunderwriting_completed',
    jsonb_build_object('reunderwriting_cycle_id', target_cycle.id, 'reunderwriting_result_id', inserted_result.id, 'version_graph', graph, 'calculation_authority', 'spec005_underwriting_only', 'strategy_authority', 'spec006_strategy_only'),
    target_cycle.correlation_id
  )
  on conflict do nothing;

  return query select inserted_result.id, inserted_result.reunderwriting_cycle_id, inserted_result.calculation_status, inserted_result.result_hash, inserted_result.version_graph;
end;
$$;

create or replace function public.fail_financing_reunderwriting(
  target_reunderwriting_cycle_id uuid,
  failed_stage text,
  failure_code text,
  safe_message text,
  retryable boolean default true
)
returns table (
  reunderwriting_cycle_id uuid,
  status text,
  failures jsonb,
  retry_count integer
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_cycle public.financeiq_reunderwriting_cycles%rowtype;
  next_status text;
begin
  if current_user_id is null then raise exception 'Authentication required to fail financing re-underwriting.' using errcode = '42501'; end if;
  if failed_stage not in ('underwriting', 'strategy', 'cockpit', 'comparison') then raise exception 'Unknown re-underwriting failure stage.' using errcode = '22023'; end if;

  select * into target_cycle from public.financeiq_reunderwriting_cycles where id = target_reunderwriting_cycle_id;
  if target_cycle.id is null then raise exception 'Re-underwriting cycle is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_cycle.workspace_id, 'underwriting:run') then raise exception 'You do not have permission to update re-underwriting in this workspace.' using errcode = '42501'; end if;

  next_status := case
    when target_cycle.prior_underwriting_snapshot_id is not null then 'failed_with_prior_valid_result'
    when failed_stage = 'underwriting' then 'failed_without_prior_valid_result'
    else 'blocked'
  end;

  update public.financeiq_reunderwriting_cycles
  set status = next_status,
      current_stage = failed_stage,
      retry_count = retry_count + case when retryable then 1 else 0 end,
      failures = failures || jsonb_build_array(jsonb_build_object('stage', failed_stage, 'code', failure_code, 'safeMessage', safe_message, 'retryable', retryable)),
      failed_at = now(),
      updated_at = now()
  where id = target_cycle.id
  returning * into target_cycle;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload, correlation_id)
  values (
    target_cycle.workspace_id, target_cycle.deal_id, current_user_id, 'financing.reunderwriting_failed',
    'financeiq_reunderwriting_cycles', target_cycle.id, target_cycle.financing_structure_version,
    'fail_financing_reunderwriting', target_cycle.idempotency_key || ':financing.reunderwriting_failed:' || target_cycle.retry_count,
    jsonb_build_object('stage', failed_stage, 'code', failure_code, 'status', target_cycle.status, 'prior_underwriting_snapshot_id', target_cycle.prior_underwriting_snapshot_id),
    target_cycle.correlation_id
  )
  on conflict do nothing;

  return query select target_cycle.id, target_cycle.status, target_cycle.failures, target_cycle.retry_count;
end;
$$;

create or replace function public.load_financing_comparison(target_comparison_id uuid)
returns table (
  comparison_result_id uuid,
  workspace_id uuid,
  deal_id uuid,
  status text,
  clear_winner_financing_structure_id uuid,
  result_hash text,
  result_payload jsonb,
  stale boolean,
  stale_reasons text[],
  compared_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  target_result public.financing_scenario_comparison_results%rowtype;
  current_stale_reasons text[] := '{}'::text[];
begin
  select * into target_result
  from public.financing_scenario_comparison_results
  where id = target_comparison_id;
  if target_result.id is null then raise exception 'Financing comparison is not available.' using errcode = 'P0002'; end if;
  if not public.is_workspace_member(target_result.workspace_id) then raise exception 'You do not have permission to view this financing comparison.' using errcode = '42501'; end if;

  if exists (
    select 1
    from jsonb_to_recordset(target_result.source_versions -> 'structures') as source_version(financing_structure_id uuid, structure_version integer)
    join public.financing_structures structure on structure.id = source_version.financing_structure_id
    where structure.workspace_id = target_result.workspace_id
      and structure.version is distinct from source_version.structure_version
  ) then
    current_stale_reasons := array_append(current_stale_reasons, 'stale_financing_structure_version');
  end if;

  if target_result.comparison_mode = 'current' and not exists (
    select 1
    from public.financing_structures structure
    where structure.workspace_id = target_result.workspace_id
      and structure.deal_id = target_result.deal_id
      and structure.is_active is true
      and structure.active_context = 'current_deal'
      and structure.archived_at is null
      and structure.id = any(target_result.financing_structure_ids)
  ) then
    current_stale_reasons := array_append(current_stale_reasons, 'stale_active_financing_structure');
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(coalesce(target_result.source_versions -> 'feasibility', '[]'::jsonb)) as source_version(financing_structure_id uuid, feasibility_version integer, result_hash text)
    join public.financeiq_latest_feasibility_results latest
      on latest.workspace_id = target_result.workspace_id
     and latest.financing_structure_id = source_version.financing_structure_id
    where latest.feasibility_version is distinct from source_version.feasibility_version
       or latest.result_hash is distinct from source_version.result_hash
  ) then
    current_stale_reasons := array_append(current_stale_reasons, 'stale_feasibility_result');
  end if;

  return query
  select
    target_result.id,
    target_result.workspace_id,
    target_result.deal_id,
    target_result.status,
    target_result.clear_winner_financing_structure_id,
    target_result.result_hash,
    target_result.result_payload,
    target_result.stale or array_length(current_stale_reasons, 1) is not null,
    array(select distinct unnest(target_result.stale_reasons || current_stale_reasons) order by 1),
    target_result.compared_at;
end;
$$;

revoke all on table public.financeiq_reunderwriting_cycles from public, anon;
revoke all on table public.financeiq_reunderwriting_results from public, anon;
grant select on public.financeiq_reunderwriting_cycles to authenticated;
grant select on public.financeiq_reunderwriting_results to authenticated;
revoke insert, update, delete on public.financeiq_reunderwriting_cycles from authenticated;
revoke insert, update, delete on public.financeiq_reunderwriting_results from authenticated;

revoke all on function public.request_financing_reunderwriting(uuid, integer, text, uuid, text, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.request_financing_reunderwriting(uuid, integer, text, uuid, text, jsonb, uuid) to authenticated;

revoke all on function public.complete_financing_reunderwriting(uuid, integer, uuid, integer, uuid, text, text, text, text, uuid[], jsonb) from public, anon, authenticated;
grant execute on function public.complete_financing_reunderwriting(uuid, integer, uuid, integer, uuid, text, text, text, text, uuid[], jsonb) to authenticated;

revoke all on function public.fail_financing_reunderwriting(uuid, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.fail_financing_reunderwriting(uuid, text, text, text, boolean) to authenticated;

revoke all on function public.load_financing_comparison(uuid) from public, anon, authenticated;
grant execute on function public.load_financing_comparison(uuid) to authenticated;

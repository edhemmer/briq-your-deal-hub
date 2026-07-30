-- Specification 005: Scenario/sensitivity engine.
-- Stores immutable scenario and sensitivity metadata derived from existing
-- immutable underwriting snapshots and Core Output runs. This does not connect
-- providers, use AI, rank scenarios, recommend actions, or create a second
-- calculation engine.

create extension if not exists pgcrypto;

create table if not exists public.underwriting_scenarios (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  base_snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  base_run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  scenario_name text not null check (length(btrim(scenario_name)) between 1 and 160),
  description text,
  scenario_type text not null check (scenario_type in ('custom', 'financing', 'income', 'expense', 'acquisition', 'operating', 'sensitivity_point')),
  status text not null check (status in ('draft', 'validating', 'ready', 'calculating', 'complete', 'complete_with_warnings', 'preliminary', 'incomplete', 'blocked', 'failed', 'cancelled')),
  schema_id text not null,
  schema_version text not null,
  formula_registry_version text not null,
  override_count integer not null default 0 check (override_count >= 0),
  readiness_state text not null,
  confidence_state text not null check (confidence_state in ('confirmed_inputs', 'accepted_assumptions', 'preliminary', 'incomplete', 'blocked')),
  scenario_content_hash text not null,
  idempotency_key text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  version integer not null default 1 check (version > 0),
  constraint underwriting_scenarios_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (workspace_id, idempotency_key),
  unique (workspace_id, deal_id, base_snapshot_id, scenario_content_hash)
);

create table if not exists public.underwriting_scenario_overrides (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scenario_id uuid not null references public.underwriting_scenarios(id) on delete restrict,
  deal_id uuid not null,
  input_id text not null,
  base_normalized_value jsonb not null default 'null'::jsonb,
  proposed_raw_value jsonb not null default 'null'::jsonb,
  normalized_override_value jsonb not null default 'null'::jsonb,
  original_unit text,
  canonical_unit text not null,
  original_period text,
  canonical_period text not null,
  currency text,
  validation_status text not null,
  assumption_classification text not null check (assumption_classification in ('user_scenario_assumption', 'accepted_underwriting_assumption', 'preliminary_scenario_assumption')),
  rationale_category text,
  user_note text,
  source_provenance_type text not null default 'scenario_user_entry',
  conversion_applied boolean not null default false,
  normalization_version text not null,
  validation_rule_version text not null,
  deterministic_override_hash text not null,
  stable_ordinal integer not null check (stable_ordinal > 0),
  constraint underwriting_scenario_overrides_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (scenario_id, input_id),
  unique (scenario_id, stable_ordinal)
);

create table if not exists public.underwriting_scenario_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scenario_id uuid not null references public.underwriting_scenarios(id) on delete restrict,
  deal_id uuid not null,
  base_snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  base_snapshot_hash text not null,
  scenario_snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  scenario_snapshot_hash text not null,
  changed_input_ids text[] not null default '{}'::text[],
  unchanged_input_ids text[] not null default '{}'::text[],
  override_hashes text[] not null default '{}'::text[],
  validation_id text not null,
  validation_hash text not null,
  created_at timestamptz not null default now(),
  constraint underwriting_scenario_snapshots_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (scenario_id),
  unique (workspace_id, scenario_snapshot_id)
);

create table if not exists public.underwriting_scenario_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scenario_id uuid not null references public.underwriting_scenarios(id) on delete restrict,
  deal_id uuid not null,
  base_run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  scenario_run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  result_set_hash text not null,
  status text not null,
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  errors jsonb not null default '[]'::jsonb check (jsonb_typeof(errors) = 'array'),
  created_at timestamptz not null default now(),
  constraint underwriting_scenario_runs_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (scenario_id),
  unique (workspace_id, scenario_run_id)
);

create table if not exists public.underwriting_scenario_comparisons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  scenario_id uuid not null references public.underwriting_scenarios(id) on delete restrict,
  deal_id uuid not null,
  base_run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  scenario_run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  base_snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  scenario_snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  changed_input_ids text[] not null default '{}'::text[],
  added_output_ids text[] not null default '{}'::text[],
  removed_output_ids text[] not null default '{}'::text[],
  changed_output_ids text[] not null default '{}'::text[],
  unchanged_output_ids text[] not null default '{}'::text[],
  status_changed_output_ids text[] not null default '{}'::text[],
  confidence_changed_output_ids text[] not null default '{}'::text[],
  warning_changes jsonb not null default '[]'::jsonb check (jsonb_typeof(warning_changes) = 'array'),
  formula_version_confirmation text not null check (formula_version_confirmation in ('all_match', 'mismatch')),
  outputs jsonb not null default '[]'::jsonb check (jsonb_typeof(outputs) = 'array'),
  comparison_hash text not null,
  created_at timestamptz not null default now(),
  constraint underwriting_scenario_comparisons_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (scenario_id),
  unique (workspace_id, comparison_hash)
);

create table if not exists public.underwriting_sensitivity_definitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  base_snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  base_run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  input_id text not null,
  method text not null check (method in ('explicit_points', 'linear_range')),
  minimum_value numeric,
  maximum_value numeric,
  step_value numeric,
  explicit_points numeric[] not null default '{}'::numeric[],
  unit text not null,
  period text not null,
  currency text,
  point_count integer not null check (point_count between 1 and 25),
  target_formula_ids text[] not null default '{}'::text[] check (array_length(target_formula_ids, 1) between 1 and 12),
  status text not null check (status in ('draft', 'validating', 'ready', 'calculating', 'complete', 'complete_with_warnings', 'preliminary', 'incomplete', 'blocked', 'failed', 'cancelled')),
  content_hash text not null,
  idempotency_key text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  constraint underwriting_sensitivity_definitions_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (workspace_id, idempotency_key),
  unique (workspace_id, deal_id, base_snapshot_id, input_id, content_hash)
);

create table if not exists public.underwriting_sensitivity_points (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  sensitivity_id uuid not null references public.underwriting_sensitivity_definitions(id) on delete restrict,
  deal_id uuid not null,
  point_ordinal integer not null check (point_ordinal > 0),
  tested_input_value numeric not null,
  scenario_id uuid not null references public.underwriting_scenarios(id) on delete restrict,
  scenario_run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  target_outputs jsonb not null default '[]'::jsonb check (jsonb_typeof(target_outputs) = 'array'),
  status text not null,
  result_set_hash text not null,
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  errors jsonb not null default '[]'::jsonb check (jsonb_typeof(errors) = 'array'),
  created_at timestamptz not null default now(),
  constraint underwriting_sensitivity_points_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (sensitivity_id, point_ordinal),
  unique (sensitivity_id, tested_input_value)
);

create index if not exists idx_underwriting_scenarios_workspace_deal_created
  on public.underwriting_scenarios(workspace_id, deal_id, created_at desc);
create index if not exists idx_underwriting_scenarios_base_snapshot
  on public.underwriting_scenarios(workspace_id, base_snapshot_id, created_at desc);
create index if not exists idx_underwriting_scenarios_version
  on public.underwriting_scenarios(workspace_id, deal_id, scenario_name, version desc);
create index if not exists idx_underwriting_scenarios_content_hash
  on public.underwriting_scenarios(workspace_id, scenario_content_hash);
create index if not exists idx_underwriting_scenario_runs_lookup
  on public.underwriting_scenario_runs(workspace_id, deal_id, scenario_run_id);
create index if not exists idx_underwriting_sensitivity_definitions_lookup
  on public.underwriting_sensitivity_definitions(workspace_id, deal_id, created_at desc);
create index if not exists idx_underwriting_sensitivity_points_ordinal
  on public.underwriting_sensitivity_points(sensitivity_id, point_ordinal);

alter table public.underwriting_scenarios enable row level security;
alter table public.underwriting_scenario_overrides enable row level security;
alter table public.underwriting_scenario_snapshots enable row level security;
alter table public.underwriting_scenario_runs enable row level security;
alter table public.underwriting_scenario_comparisons enable row level security;
alter table public.underwriting_sensitivity_definitions enable row level security;
alter table public.underwriting_sensitivity_points enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'underwriting_scenarios',
    'underwriting_scenario_overrides',
    'underwriting_scenario_snapshots',
    'underwriting_scenario_runs',
    'underwriting_scenario_comparisons',
    'underwriting_sensitivity_definitions',
    'underwriting_sensitivity_points'
  ]
  loop
    execute format('drop policy if exists "%s read workspace members" on public.%I', table_name, table_name);
    execute format('create policy "%s read workspace members" on public.%I for select to authenticated using (public.is_workspace_member(workspace_id))', table_name, table_name);
    execute format('drop policy if exists "%s no direct insert" on public.%I', table_name, table_name);
    execute format('create policy "%s no direct insert" on public.%I for insert to authenticated with check (false)', table_name, table_name);
    execute format('drop policy if exists "%s no direct update" on public.%I', table_name, table_name);
    execute format('create policy "%s no direct update" on public.%I for update to authenticated using (false) with check (false)', table_name, table_name);
    execute format('drop policy if exists "%s no direct delete" on public.%I', table_name, table_name);
    execute format('create policy "%s no direct delete" on public.%I for delete to authenticated using (false)', table_name, table_name);
  end loop;
end $$;

create or replace function public.prevent_underwriting_scenario_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Underwriting scenarios and sensitivities are immutable.' using errcode = '42501';
end;
$$;

drop trigger if exists underwriting_scenarios_immutable on public.underwriting_scenarios;
create trigger underwriting_scenarios_immutable before update or delete on public.underwriting_scenarios
for each row execute function public.prevent_underwriting_scenario_mutation();
drop trigger if exists underwriting_scenario_overrides_immutable on public.underwriting_scenario_overrides;
create trigger underwriting_scenario_overrides_immutable before update or delete on public.underwriting_scenario_overrides
for each row execute function public.prevent_underwriting_scenario_mutation();
drop trigger if exists underwriting_scenario_snapshots_immutable on public.underwriting_scenario_snapshots;
create trigger underwriting_scenario_snapshots_immutable before update or delete on public.underwriting_scenario_snapshots
for each row execute function public.prevent_underwriting_scenario_mutation();
drop trigger if exists underwriting_scenario_runs_immutable on public.underwriting_scenario_runs;
create trigger underwriting_scenario_runs_immutable before update or delete on public.underwriting_scenario_runs
for each row execute function public.prevent_underwriting_scenario_mutation();
drop trigger if exists underwriting_scenario_comparisons_immutable on public.underwriting_scenario_comparisons;
create trigger underwriting_scenario_comparisons_immutable before update or delete on public.underwriting_scenario_comparisons
for each row execute function public.prevent_underwriting_scenario_mutation();
drop trigger if exists underwriting_sensitivity_definitions_immutable on public.underwriting_sensitivity_definitions;
create trigger underwriting_sensitivity_definitions_immutable before update or delete on public.underwriting_sensitivity_definitions
for each row execute function public.prevent_underwriting_scenario_mutation();
drop trigger if exists underwriting_sensitivity_points_immutable on public.underwriting_sensitivity_points;
create trigger underwriting_sensitivity_points_immutable before update or delete on public.underwriting_sensitivity_points
for each row execute function public.prevent_underwriting_scenario_mutation();

create or replace function public.underwriting_scenario_text_array(input_value jsonb)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(value order by value), '{}'::text[])
  from jsonb_array_elements_text(coalesce(input_value, '[]'::jsonb)) value;
$$;

create or replace function public.underwriting_scenario_numeric_array(input_value jsonb)
returns numeric[]
language sql
immutable
as $$
  select coalesce(array_agg(value::numeric order by value::numeric), '{}'::numeric[])
  from jsonb_array_elements_text(coalesce(input_value, '[]'::jsonb)) value
  where value ~ '^-?[0-9]+(\.[0-9]+)?$';
$$;

create or replace function public.create_underwriting_scenario_run(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_base_snapshot_id uuid,
  target_base_run_id uuid,
  idempotency_key text,
  expected_base_snapshot_hash text,
  expected_base_result_set_hash text,
  scenario_payload jsonb
)
returns table (
  scenario_id uuid,
  scenario_run_id uuid,
  status text,
  reused boolean,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  safe_payload jsonb := public.safe_event_jsonb(coalesce(scenario_payload, '{}'::jsonb));
  target_snapshot public.underwriting_snapshots%rowtype;
  target_run public.underwriting_output_runs%rowtype;
  target_scenario_snapshot public.underwriting_snapshots%rowtype;
  target_scenario_run public.underwriting_output_runs%rowtype;
  existing_scenario public.underwriting_scenarios%rowtype;
  inserted_scenario public.underwriting_scenarios%rowtype;
  override_item jsonb;
  request_hash text;
  requested_content_hash text := nullif(btrim(safe_payload #>> '{scenario,scenarioContentHash}'), '');
begin
  if current_user_id is null then raise exception 'Authentication required to create underwriting scenario.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely create underwriting scenario.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_payload) <> 'object' then raise exception 'Underwriting scenario payload must be an object.' using errcode = '22023'; end if;
  if requested_content_hash is null then raise exception 'Scenario content hash is required.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'underwriting:run') then raise exception 'You do not have permission to run underwriting scenarios in this BRIX workspace.' using errcode = '42501'; end if;

  select * into target_snapshot
  from public.underwriting_snapshots
  where id = target_base_snapshot_id and workspace_id = target_workspace_id and deal_id = target_deal_id;
  if target_snapshot.id is null then raise exception 'Base underwriting snapshot is not available.' using errcode = 'P0002'; end if;
  if target_snapshot.content_hash <> expected_base_snapshot_hash then raise exception 'Base underwriting snapshot hash mismatch.' using errcode = '22023'; end if;

  select * into target_run
  from public.underwriting_output_runs
  where id = target_base_run_id and workspace_id = target_workspace_id and deal_id = target_deal_id and snapshot_id = target_base_snapshot_id;
  if target_run.id is null then raise exception 'Base underwriting run is not available.' using errcode = 'P0002'; end if;
  if target_run.result_set_hash <> expected_base_result_set_hash then raise exception 'Base underwriting run hash mismatch.' using errcode = '22023'; end if;
  if target_run.status not in ('complete', 'complete_with_warnings', 'preliminary') then raise exception 'Base underwriting run must be completed before scenario execution.' using errcode = '22023'; end if;

  select * into target_scenario_snapshot
  from public.underwriting_snapshots
  where id = nullif(safe_payload #>> '{scenarioSnapshot,scenarioSnapshot,snapshotId}', '')::uuid
    and workspace_id = target_workspace_id
    and deal_id = target_deal_id;
  if target_scenario_snapshot.id is null then raise exception 'Scenario snapshot must be persisted before the scenario run is recorded.' using errcode = 'P0002'; end if;
  if target_scenario_snapshot.content_hash <> safe_payload #>> '{scenarioSnapshot,scenarioSnapshotHash}' then raise exception 'Scenario snapshot hash mismatch.' using errcode = '22023'; end if;

  select * into target_scenario_run
  from public.underwriting_output_runs
  where id = nullif(safe_payload #>> '{scenarioRun,runId}', '')::uuid
    and workspace_id = target_workspace_id
    and deal_id = target_deal_id
    and snapshot_id = target_scenario_snapshot.id;
  if target_scenario_run.id is null then raise exception 'Scenario Core Output run must be persisted before the scenario is recorded.' using errcode = 'P0002'; end if;

  request_hash := md5(jsonb_build_object(
    'workspaceId', target_workspace_id,
    'dealId', target_deal_id,
    'baseSnapshotId', target_base_snapshot_id,
    'baseRunId', target_base_run_id,
    'scenarioContentHash', requested_content_hash
  )::text);

  select * into existing_scenario
  from public.underwriting_scenarios
  where workspace_id = target_workspace_id and idempotency_key = cleaned_key
  for update;
  if existing_scenario.id is not null then
    if existing_scenario.scenario_content_hash <> requested_content_hash then
      raise exception 'This scenario retry key was already used with different inputs.' using errcode = '23505';
    end if;
    scenario_id := existing_scenario.id;
    scenario_run_id := target_scenario_run.id;
    status := existing_scenario.status;
    reused := true;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  insert into public.underwriting_scenarios (
    workspace_id, deal_id, base_snapshot_id, base_run_id, scenario_name, description, scenario_type, status,
    schema_id, schema_version, formula_registry_version, override_count, readiness_state, confidence_state,
    scenario_content_hash, idempotency_key, created_by, created_at, completed_at, cancelled_at, version
  )
  values (
    target_workspace_id,
    target_deal_id,
    target_base_snapshot_id,
    target_base_run_id,
    safe_payload #>> '{scenario,scenarioName}',
    nullif(safe_payload #>> '{scenario,description}', ''),
    safe_payload #>> '{scenario,scenarioType}',
    safe_payload #>> '{scenario,status}',
    safe_payload #>> '{scenario,schemaId}',
    safe_payload #>> '{scenario,schemaVersion}',
    safe_payload #>> '{scenario,formulaRegistryVersion}',
    coalesce((safe_payload #>> '{scenario,overrideCount}')::integer, 0),
    safe_payload #>> '{scenario,readinessState}',
    safe_payload #>> '{scenario,confidenceState}',
    requested_content_hash,
    cleaned_key,
    current_user_id,
    coalesce(nullif(safe_payload #>> '{scenario,createdAt}', '')::timestamptz, now()),
    nullif(safe_payload #>> '{scenario,completedAt}', '')::timestamptz,
    nullif(safe_payload #>> '{scenario,cancelledAt}', '')::timestamptz,
    coalesce((safe_payload #>> '{scenario,version}')::integer, 1)
  )
  returning * into inserted_scenario;

  for override_item in select value from jsonb_array_elements(coalesce(safe_payload -> 'overrides', '[]'::jsonb))
  loop
    insert into public.underwriting_scenario_overrides (
      workspace_id, scenario_id, deal_id, input_id, base_normalized_value, proposed_raw_value,
      normalized_override_value, original_unit, canonical_unit, original_period, canonical_period,
      currency, validation_status, assumption_classification, rationale_category, user_note,
      source_provenance_type, conversion_applied, normalization_version, validation_rule_version,
      deterministic_override_hash, stable_ordinal
    )
    values (
      target_workspace_id,
      inserted_scenario.id,
      target_deal_id,
      override_item ->> 'inputId',
      to_jsonb(override_item -> 'baseNormalizedValue'),
      to_jsonb(override_item -> 'proposedRawValue'),
      to_jsonb(override_item -> 'normalizedOverrideValue'),
      override_item ->> 'originalUnit',
      override_item ->> 'canonicalUnit',
      override_item ->> 'originalPeriod',
      override_item ->> 'canonicalPeriod',
      override_item ->> 'currency',
      override_item ->> 'validationStatus',
      override_item ->> 'assumptionClassification',
      override_item ->> 'rationaleCategory',
      override_item ->> 'userNote',
      coalesce(override_item ->> 'sourceProvenanceType', 'scenario_user_entry'),
      coalesce((override_item ->> 'conversionApplied')::boolean, false),
      override_item ->> 'normalizationVersion',
      override_item ->> 'validationRuleVersion',
      override_item ->> 'deterministicOverrideHash',
      coalesce((override_item ->> 'stableOrdinal')::integer, 1)
    );
  end loop;

  insert into public.underwriting_scenario_snapshots (
    workspace_id, scenario_id, deal_id, base_snapshot_id, base_snapshot_hash, scenario_snapshot_id,
    scenario_snapshot_hash, changed_input_ids, unchanged_input_ids, override_hashes, validation_id, validation_hash
  )
  values (
    target_workspace_id,
    inserted_scenario.id,
    target_deal_id,
    target_base_snapshot_id,
    expected_base_snapshot_hash,
    target_scenario_snapshot.id,
    safe_payload #>> '{scenarioSnapshot,scenarioSnapshotHash}',
    public.underwriting_scenario_text_array(safe_payload #> '{scenarioSnapshot,changedInputIds}'),
    public.underwriting_scenario_text_array(safe_payload #> '{scenarioSnapshot,unchangedInputIds}'),
    public.underwriting_scenario_text_array(safe_payload #> '{scenarioSnapshot,overrideHashes}'),
    safe_payload #>> '{scenarioSnapshot,validationId}',
    safe_payload #>> '{scenarioSnapshot,validationHash}'
  );

  insert into public.underwriting_scenario_runs (
    workspace_id, scenario_id, deal_id, base_run_id, scenario_run_id, result_set_hash, status, warnings, errors
  )
  values (
    target_workspace_id,
    inserted_scenario.id,
    target_deal_id,
    target_base_run_id,
    target_scenario_run.id,
    target_scenario_run.result_set_hash,
    safe_payload #>> '{scenarioRun,status}',
    coalesce(safe_payload -> 'warnings', '[]'::jsonb),
    coalesce(safe_payload -> 'errors', '[]'::jsonb)
  );

  insert into public.underwriting_scenario_comparisons (
    workspace_id, scenario_id, deal_id, base_run_id, scenario_run_id, base_snapshot_id, scenario_snapshot_id,
    changed_input_ids, added_output_ids, removed_output_ids, changed_output_ids, unchanged_output_ids,
    status_changed_output_ids, confidence_changed_output_ids, warning_changes, formula_version_confirmation,
    outputs, comparison_hash
  )
  values (
    target_workspace_id,
    inserted_scenario.id,
    target_deal_id,
    target_base_run_id,
    target_scenario_run.id,
    target_base_snapshot_id,
    target_scenario_snapshot.id,
    public.underwriting_scenario_text_array(safe_payload #> '{comparison,changedInputIds}'),
    public.underwriting_scenario_text_array(safe_payload #> '{comparison,addedOutputIds}'),
    public.underwriting_scenario_text_array(safe_payload #> '{comparison,removedOutputIds}'),
    public.underwriting_scenario_text_array(safe_payload #> '{comparison,changedOutputIds}'),
    public.underwriting_scenario_text_array(safe_payload #> '{comparison,unchangedOutputIds}'),
    public.underwriting_scenario_text_array(safe_payload #> '{comparison,statusChangedOutputIds}'),
    public.underwriting_scenario_text_array(safe_payload #> '{comparison,confidenceChangedOutputIds}'),
    coalesce(safe_payload #> '{comparison,warningChanges}', '[]'::jsonb),
    safe_payload #>> '{comparison,formulaVersionConfirmation}',
    coalesce(safe_payload #> '{comparison,outputs}', '[]'::jsonb),
    safe_payload #>> '{comparison,comparisonHash}'
  );

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values (
    target_workspace_id,
    target_deal_id,
    current_user_id,
    case when inserted_scenario.status = 'failed' then 'underwriting.scenario_failed' else 'underwriting.scenario_completed' end,
    'underwriting_scenario',
    inserted_scenario.id,
    'create_underwriting_scenario_run',
    cleaned_key || ':event',
    jsonb_build_object(
      'scenario_id', inserted_scenario.id,
      'status', inserted_scenario.status,
      'scenario_type', inserted_scenario.scenario_type,
      'override_count', inserted_scenario.override_count,
      'base_snapshot_id', target_base_snapshot_id,
      'base_run_id', target_base_run_id,
      'scenario_snapshot_id', target_scenario_snapshot.id,
      'scenario_run_id', target_scenario_run.id
    )
  );

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    target_deal_id,
    current_user_id,
    'underwriting.scenario_completed',
    'underwriting_scenarios',
    'underwriting_scenario',
    inserted_scenario.id,
    'create_underwriting_scenario_run',
    cleaned_key,
    jsonb_build_object('status', inserted_scenario.status, 'scenario_content_hash', inserted_scenario.scenario_content_hash),
    array['status', 'scenario_content_hash', 'override_count'],
    jsonb_build_object('request_hash', request_hash, 'base_snapshot_id', target_base_snapshot_id, 'base_run_id', target_base_run_id)
  );

  scenario_id := inserted_scenario.id;
  scenario_run_id := target_scenario_run.id;
  status := inserted_scenario.status;
  reused := false;
  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace function public.create_underwriting_sensitivity_run(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_base_snapshot_id uuid,
  target_base_run_id uuid,
  idempotency_key text,
  expected_base_snapshot_hash text,
  expected_base_result_set_hash text,
  sensitivity_payload jsonb
)
returns table (
  sensitivity_id uuid,
  status text,
  point_count integer,
  reused boolean,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  safe_payload jsonb := public.safe_event_jsonb(coalesce(sensitivity_payload, '{}'::jsonb));
  target_snapshot public.underwriting_snapshots%rowtype;
  target_run public.underwriting_output_runs%rowtype;
  existing_definition public.underwriting_sensitivity_definitions%rowtype;
  inserted_definition public.underwriting_sensitivity_definitions%rowtype;
  point_item jsonb;
  requested_content_hash text := nullif(btrim(safe_payload #>> '{definition,contentHash}'), '');
begin
  if current_user_id is null then raise exception 'Authentication required to create underwriting sensitivity.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely create underwriting sensitivity.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_payload) <> 'object' then raise exception 'Underwriting sensitivity payload must be an object.' using errcode = '22023'; end if;
  if requested_content_hash is null then raise exception 'Sensitivity content hash is required.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'underwriting:run') then raise exception 'You do not have permission to run underwriting sensitivity in this BRIX workspace.' using errcode = '42501'; end if;

  select * into target_snapshot
  from public.underwriting_snapshots
  where id = target_base_snapshot_id and workspace_id = target_workspace_id and deal_id = target_deal_id;
  if target_snapshot.id is null then raise exception 'Base underwriting snapshot is not available.' using errcode = 'P0002'; end if;
  if target_snapshot.content_hash <> expected_base_snapshot_hash then raise exception 'Base underwriting snapshot hash mismatch.' using errcode = '22023'; end if;

  select * into target_run
  from public.underwriting_output_runs
  where id = target_base_run_id and workspace_id = target_workspace_id and deal_id = target_deal_id and snapshot_id = target_base_snapshot_id;
  if target_run.id is null then raise exception 'Base underwriting run is not available.' using errcode = 'P0002'; end if;
  if target_run.result_set_hash <> expected_base_result_set_hash then raise exception 'Base underwriting run hash mismatch.' using errcode = '22023'; end if;

  select * into existing_definition
  from public.underwriting_sensitivity_definitions
  where workspace_id = target_workspace_id and idempotency_key = cleaned_key
  for update;
  if existing_definition.id is not null then
    if existing_definition.content_hash <> requested_content_hash then
      raise exception 'This sensitivity retry key was already used with different inputs.' using errcode = '23505';
    end if;
    sensitivity_id := existing_definition.id;
    status := existing_definition.status;
    point_count := existing_definition.point_count;
    reused := true;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  insert into public.underwriting_sensitivity_definitions (
    workspace_id, deal_id, base_snapshot_id, base_run_id, input_id, method, minimum_value, maximum_value,
    step_value, explicit_points, unit, period, currency, point_count, target_formula_ids, status, content_hash,
    idempotency_key, created_by, created_at, version
  )
  values (
    target_workspace_id,
    target_deal_id,
    target_base_snapshot_id,
    target_base_run_id,
    safe_payload #>> '{definition,inputId}',
    safe_payload #>> '{definition,method}',
    nullif(safe_payload #>> '{definition,minimumValue}', '')::numeric,
    nullif(safe_payload #>> '{definition,maximumValue}', '')::numeric,
    nullif(safe_payload #>> '{definition,stepValue}', '')::numeric,
    public.underwriting_scenario_numeric_array(safe_payload #> '{definition,explicitPoints}'),
    safe_payload #>> '{definition,unit}',
    safe_payload #>> '{definition,period}',
    nullif(safe_payload #>> '{definition,currency}', ''),
    coalesce((safe_payload #>> '{definition,pointCount}')::integer, jsonb_array_length(coalesce(safe_payload -> 'points', '[]'::jsonb))),
    public.underwriting_scenario_text_array(safe_payload #> '{definition,targetFormulaIds}'),
    safe_payload #>> '{definition,status}',
    requested_content_hash,
    cleaned_key,
    current_user_id,
    coalesce(nullif(safe_payload #>> '{definition,createdAt}', '')::timestamptz, now()),
    coalesce((safe_payload #>> '{definition,version}')::integer, 1)
  )
  returning * into inserted_definition;

  for point_item in select value from jsonb_array_elements(coalesce(safe_payload -> 'points', '[]'::jsonb))
  loop
    insert into public.underwriting_sensitivity_points (
      workspace_id, sensitivity_id, deal_id, point_ordinal, tested_input_value, scenario_id,
      scenario_run_id, target_outputs, status, result_set_hash, warnings, errors
    )
    values (
      target_workspace_id,
      inserted_definition.id,
      target_deal_id,
      coalesce((point_item ->> 'pointOrdinal')::integer, 1),
      coalesce((point_item ->> 'testedInputValue')::numeric, 0),
      nullif(point_item #>> '{scenarioRun,scenario,scenarioId}', '')::uuid,
      nullif(point_item #>> '{scenarioRun,scenarioRun,runId}', '')::uuid,
      coalesce(point_item -> 'targetOutputs', '[]'::jsonb),
      point_item ->> 'status',
      point_item ->> 'resultSetHash',
      coalesce(point_item -> 'warnings', '[]'::jsonb),
      coalesce(point_item -> 'errors', '[]'::jsonb)
    );
  end loop;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values (
    target_workspace_id,
    target_deal_id,
    current_user_id,
    'underwriting.sensitivity_completed',
    'underwriting_sensitivity',
    inserted_definition.id,
    'create_underwriting_sensitivity_run',
    cleaned_key || ':event',
    jsonb_build_object(
      'sensitivity_id', inserted_definition.id,
      'status', inserted_definition.status,
      'input_id', inserted_definition.input_id,
      'point_count', inserted_definition.point_count,
      'base_snapshot_id', target_base_snapshot_id,
      'base_run_id', target_base_run_id
    )
  );

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    target_deal_id,
    current_user_id,
    'underwriting.sensitivity_completed',
    'underwriting_sensitivity_definitions',
    'underwriting_sensitivity',
    inserted_definition.id,
    'create_underwriting_sensitivity_run',
    cleaned_key,
    jsonb_build_object('status', inserted_definition.status, 'content_hash', inserted_definition.content_hash, 'point_count', inserted_definition.point_count),
    array['status', 'content_hash', 'point_count'],
    jsonb_build_object('base_snapshot_id', target_base_snapshot_id, 'base_run_id', target_base_run_id)
  );

  sensitivity_id := inserted_definition.id;
  status := inserted_definition.status;
  point_count := inserted_definition.point_count;
  reused := false;
  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace view public.underwriting_scenario_summaries
as
select
  scenario.workspace_id,
  scenario.deal_id,
  scenario.id as scenario_id,
  scenario.scenario_name,
  scenario.scenario_type,
  base_snapshot.snapshot_sequence as base_snapshot_sequence,
  scenario.status,
  scenario.override_count as changed_input_count,
  scenario.readiness_state,
  scenario.confidence_state,
  run.status as run_status,
  scenario.created_at,
  right(scenario_run.result_set_hash, 8) as result_set_short_hash,
  coalesce(scenario_run.warnings, '[]'::jsonb) as warnings
from public.underwriting_scenarios scenario
join public.underwriting_snapshots base_snapshot on base_snapshot.id = scenario.base_snapshot_id
left join public.underwriting_scenario_runs run on run.scenario_id = scenario.id
left join public.underwriting_output_runs scenario_run on scenario_run.id = run.scenario_run_id;

create or replace view public.underwriting_scenario_override_details
as
select
  scenario.workspace_id,
  scenario.deal_id,
  scenario.id as scenario_id,
  override_item.input_id,
  override_item.base_normalized_value,
  override_item.normalized_override_value,
  override_item.validation_status,
  override_item.assumption_classification,
  override_item.deterministic_override_hash,
  override_item.stable_ordinal
from public.underwriting_scenarios scenario
join public.underwriting_scenario_overrides override_item on override_item.scenario_id = scenario.id;

create or replace view public.underwriting_scenario_comparison_details
as
select
  comparison.workspace_id,
  comparison.deal_id,
  comparison.scenario_id,
  comparison.base_run_id,
  comparison.scenario_run_id,
  comparison.changed_input_ids,
  comparison.added_output_ids,
  comparison.removed_output_ids,
  comparison.changed_output_ids,
  comparison.unchanged_output_ids,
  comparison.status_changed_output_ids,
  comparison.confidence_changed_output_ids,
  comparison.formula_version_confirmation,
  comparison.outputs,
  comparison.comparison_hash
from public.underwriting_scenario_comparisons comparison;

create or replace view public.underwriting_latest_scenario_versions
as
select distinct on (workspace_id, deal_id, scenario_name)
  *
from public.underwriting_scenarios
order by workspace_id, deal_id, scenario_name, version desc, created_at desc, id desc;

create or replace view public.underwriting_sensitivity_summaries
as
select
  definition.workspace_id,
  definition.deal_id,
  definition.id as sensitivity_id,
  definition.input_id,
  definition.method,
  definition.point_count,
  definition.target_formula_ids,
  definition.status,
  definition.created_at,
  definition.content_hash
from public.underwriting_sensitivity_definitions definition;

create or replace view public.underwriting_sensitivity_point_results
as
select
  point.workspace_id,
  point.deal_id,
  point.sensitivity_id,
  point.point_ordinal,
  point.tested_input_value,
  point.status,
  point.target_outputs,
  point.result_set_hash,
  point.warnings
from public.underwriting_sensitivity_points point
order by point.sensitivity_id, point.point_ordinal;

revoke all on function public.prevent_underwriting_scenario_mutation() from public;
revoke all on function public.underwriting_scenario_text_array(jsonb) from public;
revoke all on function public.underwriting_scenario_numeric_array(jsonb) from public;
revoke all on function public.create_underwriting_scenario_run(uuid, uuid, uuid, uuid, text, text, text, jsonb) from public;
revoke all on function public.create_underwriting_sensitivity_run(uuid, uuid, uuid, uuid, text, text, text, jsonb) from public;

grant execute on function public.create_underwriting_scenario_run(uuid, uuid, uuid, uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.create_underwriting_sensitivity_run(uuid, uuid, uuid, uuid, text, text, text, jsonb) to authenticated;

grant select on public.underwriting_scenario_summaries to authenticated;
grant select on public.underwriting_scenario_override_details to authenticated;
grant select on public.underwriting_scenario_comparison_details to authenticated;
grant select on public.underwriting_latest_scenario_versions to authenticated;
grant select on public.underwriting_sensitivity_summaries to authenticated;
grant select on public.underwriting_sensitivity_point_results to authenticated;

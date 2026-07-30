-- Specification 005: Core Outputs.
-- Stores immutable deterministic underwriting runs and formula results derived
-- from one immutable underwriting snapshot. This does not run scenarios,
-- sensitivities, strategy recommendations, AI, providers, reports, or intake.

create extension if not exists pgcrypto;

create table if not exists public.underwriting_output_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  snapshot_hash text not null,
  snapshot_manifest_hash text not null,
  engine_version text not null,
  formula_registry_version text not null,
  hash_version text not null,
  status text not null check (status in (
    'queued',
    'validating_snapshot',
    'calculating',
    'complete',
    'complete_with_warnings',
    'preliminary',
    'incomplete',
    'blocked',
    'failed',
    'cancelled'
  )),
  requested_by uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null,
  requested_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  calculation_order text[] not null default '{}'::text[],
  result_set_hash text not null,
  dependency_graph_hash text not null,
  formula_version_manifest_hash text not null,
  result_count integer not null default 0 check (result_count >= 0),
  calculated_result_count integer not null default 0 check (calculated_result_count >= 0),
  warning_count integer not null default 0 check (warning_count >= 0),
  blocked_result_count integer not null default 0 check (blocked_result_count >= 0),
  incomplete_result_count integer not null default 0 check (incomplete_result_count >= 0),
  preliminary_result_count integer not null default 0 check (preliminary_result_count >= 0),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  errors jsonb not null default '[]'::jsonb check (jsonb_typeof(errors) = 'array'),
  assumption_disclosures jsonb not null default '[]'::jsonb check (jsonb_typeof(assumption_disclosures) = 'array'),
  snapshot_readiness_state text not null,
  created_at timestamptz not null default now(),
  constraint underwriting_output_runs_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (workspace_id, idempotency_key),
  unique (workspace_id, snapshot_id, result_set_hash)
);

create table if not exists public.underwriting_output_run_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  idempotency_key text not null,
  request_hash text not null,
  expected_snapshot_hash text not null,
  result_set_hash text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint underwriting_output_run_requests_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (workspace_id, idempotency_key)
);

create table if not exists public.underwriting_output_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  deal_id uuid not null,
  snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  formula_id text not null,
  formula_version text not null,
  formula_registry_version text not null,
  output_group text not null check (output_group in (
    'acquisition',
    'financing',
    'income',
    'expenses',
    'operating_performance',
    'leverage',
    'returns'
  )),
  status text not null check (status in (
    'calculated',
    'calculated_with_warning',
    'preliminary',
    'incomplete',
    'blocked_conflict',
    'invalid_input',
    'unsupported_unit',
    'unsupported_currency',
    'divide_by_zero',
    'dependency_failed',
    'formula_disabled',
    'formula_not_found',
    'version_not_found',
    'schema_unsupported'
  )),
  raw_value numeric,
  display_value numeric,
  display_text text not null,
  output_unit text,
  output_period text,
  currency text,
  precision jsonb not null default '{}'::jsonb check (jsonb_typeof(precision) = 'object'),
  input_refs text[] not null default '{}'::text[],
  dependency_result_ids text[] not null default '{}'::text[],
  source_fact_ids text[] not null default '{}'::text[],
  assumption_ids text[] not null default '{}'::text[],
  preliminary_input_ids text[] not null default '{}'::text[],
  missing_input_ids text[] not null default '{}'::text[],
  blocked_input_ids text[] not null default '{}'::text[],
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  errors jsonb not null default '[]'::jsonb check (jsonb_typeof(errors) = 'array'),
  formula_explanation text not null,
  assumption_disclosure jsonb not null default '[]'::jsonb check (jsonb_typeof(assumption_disclosure) = 'array'),
  deterministic_hash text not null,
  stable_ordinal integer not null check (stable_ordinal > 0),
  constraint underwriting_output_results_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (run_id, formula_id),
  unique (run_id, stable_ordinal)
);

create table if not exists public.underwriting_output_result_provenance (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid not null references public.underwriting_output_runs(id) on delete restrict,
  result_id uuid not null references public.underwriting_output_results(id) on delete restrict,
  snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  input_id text not null,
  source_fact_id text,
  accepted_assumption_id text,
  preliminary_assumption_id text,
  source_record_id text,
  evidence_id uuid references public.evidence_items(id) on delete restrict,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  verification_state text,
  stable_ordinal integer not null check (stable_ordinal > 0)
);

create index if not exists idx_underwriting_output_runs_workspace_deal_created
  on public.underwriting_output_runs(workspace_id, deal_id, created_at desc);

create index if not exists idx_underwriting_output_runs_snapshot
  on public.underwriting_output_runs(workspace_id, snapshot_id, created_at desc);

create index if not exists idx_underwriting_output_runs_status
  on public.underwriting_output_runs(workspace_id, status, created_at desc);

create index if not exists idx_underwriting_output_results_lookup
  on public.underwriting_output_results(workspace_id, run_id, output_group, stable_ordinal);

create index if not exists idx_underwriting_output_result_formula
  on public.underwriting_output_results(workspace_id, snapshot_id, formula_id);

create index if not exists idx_underwriting_output_provenance_lookup
  on public.underwriting_output_result_provenance(workspace_id, run_id, result_id, input_id);

alter table public.underwriting_output_runs enable row level security;
alter table public.underwriting_output_run_requests enable row level security;
alter table public.underwriting_output_results enable row level security;
alter table public.underwriting_output_result_provenance enable row level security;

drop policy if exists "underwriting output runs read workspace members" on public.underwriting_output_runs;
create policy "underwriting output runs read workspace members"
  on public.underwriting_output_runs for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "underwriting output runs no direct insert" on public.underwriting_output_runs;
create policy "underwriting output runs no direct insert"
  on public.underwriting_output_runs for insert to authenticated
  with check (false);

drop policy if exists "underwriting output runs no direct update" on public.underwriting_output_runs;
create policy "underwriting output runs no direct update"
  on public.underwriting_output_runs for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting output runs no direct delete" on public.underwriting_output_runs;
create policy "underwriting output runs no direct delete"
  on public.underwriting_output_runs for delete to authenticated
  using (false);

drop policy if exists "underwriting output run requests read creator" on public.underwriting_output_run_requests;
create policy "underwriting output run requests read creator"
  on public.underwriting_output_run_requests for select to authenticated
  using (created_by = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "underwriting output run requests no direct insert" on public.underwriting_output_run_requests;
create policy "underwriting output run requests no direct insert"
  on public.underwriting_output_run_requests for insert to authenticated
  with check (false);

drop policy if exists "underwriting output run requests no direct update" on public.underwriting_output_run_requests;
create policy "underwriting output run requests no direct update"
  on public.underwriting_output_run_requests for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting output run requests no direct delete" on public.underwriting_output_run_requests;
create policy "underwriting output run requests no direct delete"
  on public.underwriting_output_run_requests for delete to authenticated
  using (false);

drop policy if exists "underwriting output results read workspace members" on public.underwriting_output_results;
create policy "underwriting output results read workspace members"
  on public.underwriting_output_results for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "underwriting output results no direct insert" on public.underwriting_output_results;
create policy "underwriting output results no direct insert"
  on public.underwriting_output_results for insert to authenticated
  with check (false);

drop policy if exists "underwriting output results no direct update" on public.underwriting_output_results;
create policy "underwriting output results no direct update"
  on public.underwriting_output_results for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting output results no direct delete" on public.underwriting_output_results;
create policy "underwriting output results no direct delete"
  on public.underwriting_output_results for delete to authenticated
  using (false);

drop policy if exists "underwriting output provenance read workspace members" on public.underwriting_output_result_provenance;
create policy "underwriting output provenance read workspace members"
  on public.underwriting_output_result_provenance for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "underwriting output provenance no direct insert" on public.underwriting_output_result_provenance;
create policy "underwriting output provenance no direct insert"
  on public.underwriting_output_result_provenance for insert to authenticated
  with check (false);

drop policy if exists "underwriting output provenance no direct update" on public.underwriting_output_result_provenance;
create policy "underwriting output provenance no direct update"
  on public.underwriting_output_result_provenance for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting output provenance no direct delete" on public.underwriting_output_result_provenance;
create policy "underwriting output provenance no direct delete"
  on public.underwriting_output_result_provenance for delete to authenticated
  using (false);

create or replace function public.prevent_underwriting_output_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Underwriting output runs and results are immutable.' using errcode = '42501';
end;
$$;

drop trigger if exists underwriting_output_runs_immutable on public.underwriting_output_runs;
create trigger underwriting_output_runs_immutable
before update or delete on public.underwriting_output_runs
for each row execute function public.prevent_underwriting_output_mutation();

drop trigger if exists underwriting_output_run_requests_immutable on public.underwriting_output_run_requests;
create trigger underwriting_output_run_requests_immutable
before update or delete on public.underwriting_output_run_requests
for each row execute function public.prevent_underwriting_output_mutation();

drop trigger if exists underwriting_output_results_immutable on public.underwriting_output_results;
create trigger underwriting_output_results_immutable
before update or delete on public.underwriting_output_results
for each row execute function public.prevent_underwriting_output_mutation();

drop trigger if exists underwriting_output_provenance_immutable on public.underwriting_output_result_provenance;
create trigger underwriting_output_provenance_immutable
before update or delete on public.underwriting_output_result_provenance
for each row execute function public.prevent_underwriting_output_mutation();

create or replace function public.create_underwriting_core_output_run(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_snapshot_id uuid,
  idempotency_key text,
  expected_snapshot_hash text,
  run_payload jsonb
)
returns table (
  run_id uuid,
  status text,
  result_set_hash text,
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
  safe_payload jsonb := public.safe_event_jsonb(coalesce(run_payload, '{}'::jsonb));
  target_snapshot public.underwriting_snapshots%rowtype;
  existing_request public.underwriting_output_run_requests%rowtype;
  existing_run public.underwriting_output_runs%rowtype;
  inserted_run public.underwriting_output_runs%rowtype;
  requested_result_hash text := nullif(btrim(safe_payload ->> 'resultSetHash'), '');
  request_hash text;
  result_item jsonb;
  inserted_result public.underwriting_output_results%rowtype;
  provenance_item jsonb;
  manifest_mismatch boolean;
begin
  if current_user_id is null then raise exception 'Authentication required to create underwriting Core Outputs.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely create underwriting Core Outputs.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_payload) <> 'object' then raise exception 'Underwriting Core Output payload must be an object.' using errcode = '22023'; end if;
  if requested_result_hash is null then raise exception 'Result-set hash is required for underwriting Core Outputs.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'underwriting:run') then raise exception 'You do not have permission to run underwriting in this BRIX workspace.' using errcode = '42501'; end if;

  select * into target_snapshot
  from public.underwriting_snapshots
  where id = target_snapshot_id
    and workspace_id = target_workspace_id
    and deal_id = target_deal_id;
  if target_snapshot.id is null then raise exception 'Underwriting snapshot is not available.' using errcode = 'P0002'; end if;
  if target_snapshot.content_hash <> expected_snapshot_hash then raise exception 'Underwriting snapshot hash mismatch. Refresh and retry.' using errcode = '22023'; end if;
  if target_snapshot.content_hash <> safe_payload ->> 'snapshotHash' then raise exception 'Run payload snapshot hash does not match the stored snapshot.' using errcode = '22023'; end if;
  if target_snapshot.manifest_hash <> safe_payload ->> 'snapshotManifestHash' then raise exception 'Run payload manifest hash does not match the stored snapshot.' using errcode = '22023'; end if;
  if safe_payload ->> 'engineVersion' <> 'underwriting-core-output-run-v1' then raise exception 'Unsupported underwriting Core Output engine version.' using errcode = '22023'; end if;
  if safe_payload ->> 'formulaRegistryVersion' <> target_snapshot.formula_registry_version then raise exception 'Run formula registry version does not match the snapshot.' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(safe_payload -> 'results', '[]'::jsonb)) <> 'array' then raise exception 'Underwriting Core Output results must be an array.' using errcode = '22023'; end if;

  select exists (
    select 1
    from jsonb_array_elements(coalesce(safe_payload -> 'results', '[]'::jsonb)) result
    where not exists (
      select 1
      from public.underwriting_snapshot_formula_manifest manifest
      where manifest.snapshot_id = target_snapshot_id
        and manifest.formula_id = result.value ->> 'formulaId'
        and manifest.formula_version = result.value ->> 'formulaVersion'
        and manifest.formula_registry_version = result.value ->> 'formulaRegistryVersion'
    )
  ) into manifest_mismatch;
  if manifest_mismatch then raise exception 'Underwriting Core Output results must match the snapshot formula manifest.' using errcode = '22023'; end if;

  request_hash := md5(jsonb_build_object(
    'workspaceId', target_workspace_id,
    'dealId', target_deal_id,
    'snapshotId', target_snapshot_id,
    'expectedSnapshotHash', expected_snapshot_hash,
    'resultSetHash', requested_result_hash
  )::text);

  select * into existing_request
  from public.underwriting_output_run_requests
  where workspace_id = target_workspace_id and idempotency_key = cleaned_key
  for update;
  if existing_request.id is not null then
    if existing_request.request_hash <> request_hash then
      raise exception 'This underwriting Core Output retry key was already used with different output.' using errcode = '23505';
    end if;
    select * into existing_run from public.underwriting_output_runs where id = existing_request.run_id;
    run_id := existing_run.id;
    status := existing_run.status;
    result_set_hash := existing_run.result_set_hash;
    reused := true;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  select * into existing_run
  from public.underwriting_output_runs
  where workspace_id = target_workspace_id
    and snapshot_id = target_snapshot_id
    and result_set_hash = requested_result_hash;
  if existing_run.id is not null then
    insert into public.underwriting_output_run_requests (
      workspace_id, deal_id, snapshot_id, run_id, idempotency_key, request_hash, expected_snapshot_hash, result_set_hash, created_by
    )
    values (
      target_workspace_id, target_deal_id, target_snapshot_id, existing_run.id, cleaned_key, request_hash, expected_snapshot_hash, requested_result_hash, current_user_id
    );
    run_id := existing_run.id;
    status := existing_run.status;
    result_set_hash := existing_run.result_set_hash;
    reused := true;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  insert into public.underwriting_output_runs (
    workspace_id,
    deal_id,
    snapshot_id,
    snapshot_hash,
    snapshot_manifest_hash,
    engine_version,
    formula_registry_version,
    hash_version,
    status,
    requested_by,
    idempotency_key,
    requested_at,
    started_at,
    completed_at,
    calculation_order,
    result_set_hash,
    dependency_graph_hash,
    formula_version_manifest_hash,
    result_count,
    calculated_result_count,
    warning_count,
    blocked_result_count,
    incomplete_result_count,
    preliminary_result_count,
    warnings,
    errors,
    assumption_disclosures,
    snapshot_readiness_state
  )
  values (
    target_workspace_id,
    target_deal_id,
    target_snapshot_id,
    safe_payload ->> 'snapshotHash',
    safe_payload ->> 'snapshotManifestHash',
    safe_payload ->> 'engineVersion',
    safe_payload ->> 'formulaRegistryVersion',
    safe_payload ->> 'hashVersion',
    safe_payload ->> 'status',
    current_user_id,
    cleaned_key,
    coalesce(nullif(safe_payload ->> 'requestedAt', '')::timestamptz, now()),
    coalesce(nullif(safe_payload ->> 'startedAt', '')::timestamptz, now()),
    nullif(safe_payload ->> 'completedAt', '')::timestamptz,
    public.underwriting_snapshot_text_array(safe_payload -> 'calculationOrder'),
    requested_result_hash,
    safe_payload ->> 'dependencyGraphHash',
    safe_payload ->> 'formulaVersionManifestHash',
    coalesce((safe_payload ->> 'resultCount')::integer, jsonb_array_length(coalesce(safe_payload -> 'results', '[]'::jsonb))),
    coalesce((safe_payload ->> 'calculatedResultCount')::integer, 0),
    coalesce((safe_payload ->> 'warningCount')::integer, 0),
    coalesce((safe_payload ->> 'blockedResultCount')::integer, 0),
    coalesce((safe_payload ->> 'incompleteResultCount')::integer, 0),
    coalesce((safe_payload ->> 'preliminaryResultCount')::integer, 0),
    coalesce(safe_payload -> 'warnings', '[]'::jsonb),
    coalesce(safe_payload -> 'errors', '[]'::jsonb),
    coalesce(safe_payload -> 'assumptionDisclosures', '[]'::jsonb),
    safe_payload ->> 'snapshotReadinessState'
  )
  returning * into inserted_run;

  insert into public.underwriting_output_run_requests (
    workspace_id, deal_id, snapshot_id, run_id, idempotency_key, request_hash, expected_snapshot_hash, result_set_hash, created_by
  )
  values (
    target_workspace_id, target_deal_id, target_snapshot_id, inserted_run.id, cleaned_key, request_hash, expected_snapshot_hash, requested_result_hash, current_user_id
  );

  for result_item in select value from jsonb_array_elements(coalesce(safe_payload -> 'results', '[]'::jsonb))
  loop
    insert into public.underwriting_output_results (
      workspace_id,
      run_id,
      deal_id,
      snapshot_id,
      formula_id,
      formula_version,
      formula_registry_version,
      output_group,
      status,
      raw_value,
      display_value,
      display_text,
      output_unit,
      output_period,
      currency,
      precision,
      input_refs,
      dependency_result_ids,
      source_fact_ids,
      assumption_ids,
      preliminary_input_ids,
      missing_input_ids,
      blocked_input_ids,
      warnings,
      errors,
      formula_explanation,
      assumption_disclosure,
      deterministic_hash,
      stable_ordinal
    )
    values (
      target_workspace_id,
      inserted_run.id,
      target_deal_id,
      target_snapshot_id,
      result_item ->> 'formulaId',
      result_item ->> 'formulaVersion',
      result_item ->> 'formulaRegistryVersion',
      result_item ->> 'outputGroup',
      result_item ->> 'status',
      nullif(result_item ->> 'rawValue', '')::numeric,
      nullif(result_item ->> 'displayValue', '')::numeric,
      coalesce(result_item ->> 'displayText', 'Not calculated'),
      result_item ->> 'outputUnit',
      result_item ->> 'outputPeriod',
      result_item ->> 'currency',
      coalesce(result_item -> 'precision', '{}'::jsonb),
      public.underwriting_snapshot_text_array(result_item -> 'inputRefs'),
      public.underwriting_snapshot_text_array(result_item -> 'dependencyResultIds'),
      public.underwriting_snapshot_text_array(result_item -> 'sourceFactIds'),
      public.underwriting_snapshot_text_array(result_item -> 'assumptionIds'),
      public.underwriting_snapshot_text_array(result_item -> 'preliminaryInputIds'),
      public.underwriting_snapshot_text_array(result_item -> 'missingInputIds'),
      public.underwriting_snapshot_text_array(result_item -> 'blockedInputIds'),
      coalesce(result_item -> 'warnings', '[]'::jsonb),
      coalesce(result_item -> 'errors', '[]'::jsonb),
      coalesce(result_item ->> 'formulaExplanation', ''),
      coalesce(result_item -> 'assumptionDisclosure', '[]'::jsonb),
      result_item ->> 'deterministicHash',
      coalesce((result_item ->> 'stableOrdinal')::integer, 1)
    )
    returning * into inserted_result;

    for provenance_item in select value from jsonb_array_elements(coalesce(result_item -> 'provenance', '[]'::jsonb))
    loop
      insert into public.underwriting_output_result_provenance (
        workspace_id,
        run_id,
        result_id,
        snapshot_id,
        input_id,
        source_fact_id,
        accepted_assumption_id,
        preliminary_assumption_id,
        source_record_id,
        evidence_id,
        source_anchor,
        verification_state,
        stable_ordinal
      )
      values (
        target_workspace_id,
        inserted_run.id,
        inserted_result.id,
        target_snapshot_id,
        provenance_item ->> 'inputId',
        nullif(provenance_item ->> 'sourceFactId', ''),
        nullif(provenance_item ->> 'acceptedAssumptionId', ''),
        nullif(provenance_item ->> 'preliminaryAssumptionId', ''),
        nullif(provenance_item ->> 'sourceRecordId', ''),
        nullif(provenance_item ->> 'evidenceId', '')::uuid,
        coalesce(provenance_item -> 'sourceAnchor', '{}'::jsonb),
        nullif(provenance_item ->> 'verificationState', ''),
        coalesce((provenance_item ->> 'stableOrdinal')::integer, 1)
      );
    end loop;
  end loop;

  insert into public.domain_events (
    workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload
  )
  values (
    target_workspace_id,
    target_deal_id,
    target_snapshot.primary_property_id,
    current_user_id,
    case
      when inserted_run.status = 'complete_with_warnings' then 'underwriting.completed_with_warnings'
      when inserted_run.status = 'complete' then 'underwriting.completed'
      when inserted_run.status in ('failed', 'blocked') then 'underwriting.failed'
      else 'underwriting.requested'
    end,
    'underwriting_core_output_run',
    inserted_run.id,
    1,
    'create_underwriting_core_output_run',
    cleaned_key || ':underwriting.core_output',
    jsonb_build_object(
      'run_id', inserted_run.id,
      'snapshot_id', target_snapshot_id,
      'status', inserted_run.status,
      'result_set_hash', inserted_run.result_set_hash
    )
  )
  on conflict do nothing;

  insert into public.audit_events (
    workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata
  )
  values (
    target_workspace_id,
    target_deal_id,
    target_snapshot.primary_property_id,
    current_user_id,
    'underwriting.core_outputs_created',
    'underwriting_output_runs',
    'underwriting_core_output_run',
    inserted_run.id,
    'create_underwriting_core_output_run',
    cleaned_key || ':underwriting.core_outputs_created',
    jsonb_build_object(
      'status', inserted_run.status,
      'snapshot_id', target_snapshot_id,
      'result_set_hash', inserted_run.result_set_hash,
      'result_count', inserted_run.result_count
    ),
    array['status', 'result_set_hash', 'result_count'],
    jsonb_build_object('engine_version', inserted_run.engine_version)
  )
  on conflict do nothing;

  run_id := inserted_run.id;
  status := inserted_run.status;
  result_set_hash := inserted_run.result_set_hash;
  reused := false;
  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace view public.underwriting_run_summaries
as
select
  run.id as run_id,
  run.workspace_id,
  run.deal_id,
  run.snapshot_id,
  run.snapshot_hash,
  run.engine_version,
  run.formula_registry_version,
  run.status,
  run.result_set_hash,
  run.result_count,
  run.calculated_result_count,
  run.warning_count,
  run.blocked_result_count,
  run.incomplete_result_count,
  run.preliminary_result_count,
  run.requested_at,
  run.completed_at,
  run.created_at
from public.underwriting_output_runs run;

create or replace view public.underwriting_core_outputs
as
select
  result.id as result_id,
  result.workspace_id,
  result.deal_id,
  result.snapshot_id,
  result.run_id,
  result.formula_id,
  result.formula_version,
  result.output_group,
  result.status,
  result.raw_value,
  result.display_value,
  result.display_text,
  result.output_unit,
  result.output_period,
  result.currency,
  result.stable_ordinal
from public.underwriting_output_results result;

create or replace view public.underwriting_output_group_results
as
select
  run.workspace_id,
  run.deal_id,
  run.snapshot_id,
  run.id as run_id,
  result.output_group,
  jsonb_agg(
    jsonb_build_object(
      'result_id', result.id,
      'formula_id', result.formula_id,
      'formula_version', result.formula_version,
      'status', result.status,
      'display_text', result.display_text,
      'raw_value', result.raw_value,
      'currency', result.currency,
      'output_unit', result.output_unit,
      'output_period', result.output_period
    )
    order by result.stable_ordinal
  ) as results
from public.underwriting_output_runs run
join public.underwriting_output_results result on result.run_id = run.id
group by run.workspace_id, run.deal_id, run.snapshot_id, run.id, result.output_group;

create or replace view public.underwriting_result_details
as
select
  result.*,
  coalesce(jsonb_agg(
    jsonb_build_object(
      'input_id', provenance.input_id,
      'source_fact_id', provenance.source_fact_id,
      'accepted_assumption_id', provenance.accepted_assumption_id,
      'preliminary_assumption_id', provenance.preliminary_assumption_id,
      'source_record_id', provenance.source_record_id,
      'evidence_id', provenance.evidence_id,
      'source_anchor', provenance.source_anchor,
      'verification_state', provenance.verification_state
    )
    order by provenance.stable_ordinal
  ) filter (where provenance.id is not null), '[]'::jsonb) as provenance
from public.underwriting_output_results result
left join public.underwriting_output_result_provenance provenance on provenance.result_id = result.id
group by result.id;

create or replace view public.underwriting_latest_confirmed_results
as
select distinct on (run.workspace_id, run.deal_id)
  run.*
from public.underwriting_output_runs run
where run.status in ('complete', 'complete_with_warnings')
order by run.workspace_id, run.deal_id, coalesce(run.completed_at, run.created_at) desc, run.id desc;

create or replace view public.underwriting_run_comparison_basis
as
select
  run.workspace_id,
  run.deal_id,
  run.id as run_id,
  run.snapshot_id,
  run.result_set_hash,
  run.status,
  run.calculation_order,
  jsonb_object_agg(result.formula_id, jsonb_build_object(
    'status', result.status,
    'raw_value', result.raw_value,
    'display_value', result.display_value,
    'deterministic_hash', result.deterministic_hash
  ) order by result.formula_id) as formula_results
from public.underwriting_output_runs run
join public.underwriting_output_results result on result.run_id = run.id
group by run.workspace_id, run.deal_id, run.id, run.snapshot_id, run.result_set_hash, run.status, run.calculation_order;

revoke all on function public.prevent_underwriting_output_mutation() from public;
revoke all on function public.create_underwriting_core_output_run(uuid, uuid, uuid, text, text, jsonb) from public;
grant execute on function public.create_underwriting_core_output_run(uuid, uuid, uuid, text, text, jsonb) to authenticated;

grant select on public.underwriting_run_summaries to authenticated;
grant select on public.underwriting_core_outputs to authenticated;
grant select on public.underwriting_output_group_results to authenticated;
grant select on public.underwriting_result_details to authenticated;
grant select on public.underwriting_latest_confirmed_results to authenticated;
grant select on public.underwriting_run_comparison_basis to authenticated;

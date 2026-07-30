-- Specification 005: Immutable underwriting snapshots.
-- This migration stores validated underwriting state for deterministic runs only.
-- It does not calculate outputs, create Deals, create Properties, run scenarios,
-- call providers, store credentials, use AI, or create alternate intake paths.

create extension if not exists pgcrypto;

create table if not exists public.underwriting_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  primary_property_id uuid,
  property_ids uuid[] not null default '{}'::uuid[],
  snapshot_sequence integer not null,
  prior_snapshot_id uuid references public.underwriting_snapshots(id) on delete restrict,
  supersedes_snapshot_id uuid references public.underwriting_snapshots(id) on delete restrict,
  schema_id text not null,
  schema_version text not null,
  schema_registry_version text not null,
  input_registry_version text not null,
  validation_registry_version text not null,
  normalization_registry_version text not null,
  formula_registry_version text not null,
  snapshot_contract_version text not null default 'underwriting-snapshot-contract-v1',
  snapshot_hash_version text not null default 'underwriting-snapshot-content-hash-v1',
  source_validation_id text not null,
  source_validation_hash text not null,
  deal_version text,
  property_versions jsonb not null default '{}'::jsonb check (jsonb_typeof(property_versions) = 'object'),
  calculation_currency text not null default 'USD',
  unit_system text not null default 'imperial' check (unit_system in ('imperial', 'metric')),
  valuation_date date,
  hold_period_months integer check (hold_period_months is null or hold_period_months > 0),
  intended_underwriting_mode text,
  reporting_period text not null default 'annual' check (reporting_period in ('monthly', 'annual', 'one_time')),
  readiness_state text not null check (readiness_state in (
    'ready_confirmed',
    'ready_with_accepted_assumptions',
    'preliminary',
    'incomplete',
    'invalid',
    'blocked_conflict',
    'unresolved_schema',
    'unsupported'
  )),
  is_executable boolean not null default false,
  input_count integer not null default 0 check (input_count >= 0),
  missing_required_input_ids text[] not null default '{}'::text[],
  invalid_required_input_ids text[] not null default '{}'::text[],
  conflicted_required_input_ids text[] not null default '{}'::text[],
  provisional_required_input_ids text[] not null default '{}'::text[],
  blocking_reasons jsonb not null default '[]'::jsonb check (jsonb_typeof(blocking_reasons) = 'array'),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  content_hash text not null,
  manifest_hash text not null,
  reason text not null check (reason in (
    'initial_underwriting',
    'accepted_input_changed',
    'accepted_assumption_changed',
    'source_conflict_resolved',
    'schema_version_changed',
    'formula_version_changed',
    'user_requested_recalculation',
    'retry'
  )),
  idempotency_key text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint underwriting_snapshots_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  constraint underwriting_snapshots_primary_property_fk foreign key (workspace_id, primary_property_id)
    references public.properties(workspace_id, id) on delete restrict,
  unique (workspace_id, deal_id, content_hash),
  unique (workspace_id, deal_id, snapshot_sequence)
);

create table if not exists public.underwriting_snapshot_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  idempotency_key text not null,
  request_hash text not null,
  content_hash text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint underwriting_snapshot_requests_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete restrict,
  unique (workspace_id, idempotency_key)
);

create table if not exists public.underwriting_snapshot_inputs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  input_id text not null,
  requirement_state text not null,
  validation_status text not null,
  canonical_data_type text not null,
  normalized_value jsonb not null default 'null'::jsonb,
  display_value text not null default '',
  canonical_unit text not null,
  canonical_period text not null,
  canonical_currency text,
  raw_accepted_value_ref jsonb not null default 'null'::jsonb,
  input_version text,
  completeness_state text not null,
  assumption_state text not null,
  conflict_state text not null,
  precision_applied jsonb not null default '{}'::jsonb check (jsonb_typeof(precision_applied) = 'object'),
  rounding_applied boolean not null default false,
  conversion_applied boolean not null default false,
  conversion_version text,
  deterministic_input_hash text not null,
  stable_ordinal integer not null check (stable_ordinal > 0),
  unique (snapshot_id, input_id),
  unique (snapshot_id, stable_ordinal)
);

create table if not exists public.underwriting_snapshot_provenance (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  snapshot_input_id uuid references public.underwriting_snapshot_inputs(id) on delete restrict,
  input_id text not null,
  source_fact_id text,
  accepted_assumption_id text,
  preliminary_assumption_id text,
  source_record_id text,
  evidence_id uuid references public.evidence_items(id) on delete restrict,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  source_classification text,
  verification_state text,
  stable_ordinal integer not null check (stable_ordinal > 0)
);

create table if not exists public.underwriting_snapshot_formula_manifest (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  snapshot_id uuid not null references public.underwriting_snapshots(id) on delete restrict,
  formula_id text not null,
  formula_version text not null,
  formula_registry_version text not null,
  supported_by_schema boolean not null default true,
  readiness_status text not null,
  required_input_ids text[] not null default '{}'::text[],
  missing_input_ids text[] not null default '{}'::text[],
  blocked_input_ids text[] not null default '{}'::text[],
  assumption_dependent_input_ids text[] not null default '{}'::text[],
  preliminary_input_ids text[] not null default '{}'::text[],
  dependency_formula_versions jsonb not null default '[]'::jsonb check (jsonb_typeof(dependency_formula_versions) = 'array'),
  executable boolean not null default false,
  stable_ordinal integer not null check (stable_ordinal > 0),
  manifest_hash text not null,
  unique (snapshot_id, formula_id),
  unique (snapshot_id, stable_ordinal)
);

create index if not exists idx_underwriting_snapshots_workspace_deal_sequence
  on public.underwriting_snapshots(workspace_id, deal_id, snapshot_sequence desc);

create index if not exists idx_underwriting_snapshots_workspace_readiness
  on public.underwriting_snapshots(workspace_id, readiness_state, created_at desc);

create index if not exists idx_underwriting_snapshots_content_lookup
  on public.underwriting_snapshots(workspace_id, deal_id, content_hash);

create index if not exists idx_underwriting_snapshot_requests_lookup
  on public.underwriting_snapshot_requests(workspace_id, idempotency_key);

create index if not exists idx_underwriting_snapshot_inputs_lookup
  on public.underwriting_snapshot_inputs(workspace_id, snapshot_id, input_id);

create index if not exists idx_underwriting_snapshot_provenance_lookup
  on public.underwriting_snapshot_provenance(workspace_id, snapshot_id, input_id);

create index if not exists idx_underwriting_snapshot_manifest_lookup
  on public.underwriting_snapshot_formula_manifest(workspace_id, snapshot_id, formula_id);

alter table public.underwriting_snapshots enable row level security;
alter table public.underwriting_snapshot_requests enable row level security;
alter table public.underwriting_snapshot_inputs enable row level security;
alter table public.underwriting_snapshot_provenance enable row level security;
alter table public.underwriting_snapshot_formula_manifest enable row level security;

drop policy if exists "underwriting snapshots read workspace members" on public.underwriting_snapshots;
create policy "underwriting snapshots read workspace members"
  on public.underwriting_snapshots for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "underwriting snapshots no direct insert" on public.underwriting_snapshots;
create policy "underwriting snapshots no direct insert"
  on public.underwriting_snapshots for insert to authenticated
  with check (false);

drop policy if exists "underwriting snapshots no direct update" on public.underwriting_snapshots;
create policy "underwriting snapshots no direct update"
  on public.underwriting_snapshots for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting snapshots no direct delete" on public.underwriting_snapshots;
create policy "underwriting snapshots no direct delete"
  on public.underwriting_snapshots for delete to authenticated
  using (false);

drop policy if exists "underwriting snapshot requests read creator" on public.underwriting_snapshot_requests;
create policy "underwriting snapshot requests read creator"
  on public.underwriting_snapshot_requests for select to authenticated
  using (created_by = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "underwriting snapshot requests no direct insert" on public.underwriting_snapshot_requests;
create policy "underwriting snapshot requests no direct insert"
  on public.underwriting_snapshot_requests for insert to authenticated
  with check (false);

drop policy if exists "underwriting snapshot requests no direct update" on public.underwriting_snapshot_requests;
create policy "underwriting snapshot requests no direct update"
  on public.underwriting_snapshot_requests for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting snapshot requests no direct delete" on public.underwriting_snapshot_requests;
create policy "underwriting snapshot requests no direct delete"
  on public.underwriting_snapshot_requests for delete to authenticated
  using (false);

drop policy if exists "underwriting snapshot inputs read workspace members" on public.underwriting_snapshot_inputs;
create policy "underwriting snapshot inputs read workspace members"
  on public.underwriting_snapshot_inputs for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "underwriting snapshot inputs no direct insert" on public.underwriting_snapshot_inputs;
create policy "underwriting snapshot inputs no direct insert"
  on public.underwriting_snapshot_inputs for insert to authenticated
  with check (false);

drop policy if exists "underwriting snapshot inputs no direct update" on public.underwriting_snapshot_inputs;
create policy "underwriting snapshot inputs no direct update"
  on public.underwriting_snapshot_inputs for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting snapshot inputs no direct delete" on public.underwriting_snapshot_inputs;
create policy "underwriting snapshot inputs no direct delete"
  on public.underwriting_snapshot_inputs for delete to authenticated
  using (false);

drop policy if exists "underwriting snapshot provenance read workspace members" on public.underwriting_snapshot_provenance;
create policy "underwriting snapshot provenance read workspace members"
  on public.underwriting_snapshot_provenance for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "underwriting snapshot provenance no direct insert" on public.underwriting_snapshot_provenance;
create policy "underwriting snapshot provenance no direct insert"
  on public.underwriting_snapshot_provenance for insert to authenticated
  with check (false);

drop policy if exists "underwriting snapshot provenance no direct update" on public.underwriting_snapshot_provenance;
create policy "underwriting snapshot provenance no direct update"
  on public.underwriting_snapshot_provenance for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting snapshot provenance no direct delete" on public.underwriting_snapshot_provenance;
create policy "underwriting snapshot provenance no direct delete"
  on public.underwriting_snapshot_provenance for delete to authenticated
  using (false);

drop policy if exists "underwriting snapshot formula manifest read workspace members" on public.underwriting_snapshot_formula_manifest;
create policy "underwriting snapshot formula manifest read workspace members"
  on public.underwriting_snapshot_formula_manifest for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "underwriting snapshot formula manifest no direct insert" on public.underwriting_snapshot_formula_manifest;
create policy "underwriting snapshot formula manifest no direct insert"
  on public.underwriting_snapshot_formula_manifest for insert to authenticated
  with check (false);

drop policy if exists "underwriting snapshot formula manifest no direct update" on public.underwriting_snapshot_formula_manifest;
create policy "underwriting snapshot formula manifest no direct update"
  on public.underwriting_snapshot_formula_manifest for update to authenticated
  using (false)
  with check (false);

drop policy if exists "underwriting snapshot formula manifest no direct delete" on public.underwriting_snapshot_formula_manifest;
create policy "underwriting snapshot formula manifest no direct delete"
  on public.underwriting_snapshot_formula_manifest for delete to authenticated
  using (false);

create or replace function public.prevent_underwriting_snapshot_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Underwriting snapshots are immutable.' using errcode = '42501';
end;
$$;

drop trigger if exists underwriting_snapshots_immutable on public.underwriting_snapshots;
create trigger underwriting_snapshots_immutable
before update or delete on public.underwriting_snapshots
for each row execute function public.prevent_underwriting_snapshot_mutation();

drop trigger if exists underwriting_snapshot_requests_immutable on public.underwriting_snapshot_requests;
create trigger underwriting_snapshot_requests_immutable
before update or delete on public.underwriting_snapshot_requests
for each row execute function public.prevent_underwriting_snapshot_mutation();

drop trigger if exists underwriting_snapshot_inputs_immutable on public.underwriting_snapshot_inputs;
create trigger underwriting_snapshot_inputs_immutable
before update or delete on public.underwriting_snapshot_inputs
for each row execute function public.prevent_underwriting_snapshot_mutation();

drop trigger if exists underwriting_snapshot_provenance_immutable on public.underwriting_snapshot_provenance;
create trigger underwriting_snapshot_provenance_immutable
before update or delete on public.underwriting_snapshot_provenance
for each row execute function public.prevent_underwriting_snapshot_mutation();

drop trigger if exists underwriting_snapshot_manifest_immutable on public.underwriting_snapshot_formula_manifest;
create trigger underwriting_snapshot_manifest_immutable
before update or delete on public.underwriting_snapshot_formula_manifest
for each row execute function public.prevent_underwriting_snapshot_mutation();

create or replace function public.underwriting_snapshot_text_array(value jsonb)
returns text[]
language sql
stable
set search_path = public
as $$
  select coalesce(array_agg(item order by item), '{}'::text[])
  from jsonb_array_elements_text(coalesce(value, '[]'::jsonb)) as proposed(item);
$$;

create or replace function public.underwriting_snapshot_uuid_array(value jsonb)
returns uuid[]
language sql
stable
set search_path = public
as $$
  select coalesce(array_agg(item::uuid order by item), '{}'::uuid[])
  from jsonb_array_elements_text(coalesce(value, '[]'::jsonb)) as proposed(item)
  where item ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

create or replace function public.create_underwriting_snapshot(
  target_workspace_id uuid,
  target_deal_id uuid,
  idempotency_key text,
  snapshot_payload jsonb
)
returns table (
  snapshot_id uuid,
  snapshot_sequence integer,
  content_hash text,
  readiness_state text,
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
  safe_payload jsonb := public.safe_event_jsonb(coalesce(snapshot_payload, '{}'::jsonb));
  requested_hash text := nullif(btrim(safe_payload ->> 'contentHash'), '');
  requested_manifest_hash text := nullif(btrim(safe_payload ->> 'manifestHash'), '');
  request_hash text;
  existing_request public.underwriting_snapshot_requests%rowtype;
  existing_snapshot public.underwriting_snapshots%rowtype;
  target_deal public.brix_deals%rowtype;
  primary_property uuid;
  property_ids uuid[];
  next_sequence integer;
  inserted_snapshot public.underwriting_snapshots%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to create an underwriting snapshot.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely create an underwriting snapshot.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_payload) <> 'object' then raise exception 'Underwriting snapshot payload must be an object.' using errcode = '22023'; end if;
  if requested_hash is null or requested_manifest_hash is null then raise exception 'Underwriting snapshot content hash and manifest hash are required.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to create underwriting snapshots in this BRIX workspace.' using errcode = '42501'; end if;

  select * into target_deal
  from public.brix_deals
  where id = target_deal_id
    and workspace_id = target_workspace_id
    and deleted_at is null
  for update;
  if target_deal.id is null then raise exception 'Deal is not available for underwriting.' using errcode = 'P0002'; end if;

  property_ids := public.underwriting_snapshot_uuid_array(safe_payload -> 'propertyIds');
  if coalesce(array_length(property_ids, 1), 0) = 0 then raise exception 'At least one Property is required for an underwriting snapshot.' using errcode = '22023'; end if;
  primary_property := case
    when nullif(btrim(safe_payload ->> 'primaryPropertyId'), '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (safe_payload ->> 'primaryPropertyId')::uuid
    else property_ids[1]
  end;

  if exists (
    select 1
    from unnest(property_ids) property_id
    where not exists (
      select 1
      from public.properties property
      where property.id = property_id
        and property.workspace_id = target_workspace_id
        and property.deleted_at is null
    )
  ) then
    raise exception 'Snapshot Property is not available in this BRIX workspace.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.deal_properties relationship
    where relationship.workspace_id = target_workspace_id
      and relationship.deal_id = target_deal_id
      and relationship.property_id = primary_property
      and relationship.inclusion_status = 'active'
  ) then
    raise exception 'Snapshot primary Property must be attached to the Deal.' using errcode = '42501';
  end if;

  if safe_payload ->> 'readinessState' in ('invalid', 'blocked_conflict', 'unresolved_schema', 'unsupported') then
    raise exception 'Resolve invalid, unsupported, unresolved, or conflicted underwriting inputs before snapshot creation.' using errcode = '22023';
  end if;

  request_hash := md5(jsonb_build_object(
    'workspaceId', target_workspace_id,
    'dealId', target_deal_id,
    'contentHash', requested_hash,
    'snapshotContractVersion', safe_payload ->> 'snapshotContractVersion',
    'sourceValidationId', safe_payload ->> 'sourceValidationId'
  )::text);

  select * into existing_request
  from public.underwriting_snapshot_requests
  where workspace_id = target_workspace_id and idempotency_key = cleaned_key
  for update;
  if existing_request.id is not null then
    if existing_request.request_hash <> request_hash then
      raise exception 'This underwriting snapshot retry key was already used with different inputs.' using errcode = '23505';
    end if;
    select * into existing_snapshot from public.underwriting_snapshots where id = existing_request.snapshot_id;
    snapshot_id := existing_snapshot.id;
    snapshot_sequence := existing_snapshot.snapshot_sequence;
    content_hash := existing_snapshot.content_hash;
    readiness_state := existing_snapshot.readiness_state;
    reused := true;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  select * into existing_snapshot
  from public.underwriting_snapshots
  where workspace_id = target_workspace_id
    and deal_id = target_deal_id
    and content_hash = requested_hash;
  if existing_snapshot.id is not null then
    insert into public.underwriting_snapshot_requests (workspace_id, deal_id, snapshot_id, idempotency_key, request_hash, content_hash, created_by)
    values (target_workspace_id, target_deal_id, existing_snapshot.id, cleaned_key, request_hash, requested_hash, current_user_id);
    snapshot_id := existing_snapshot.id;
    snapshot_sequence := existing_snapshot.snapshot_sequence;
    content_hash := existing_snapshot.content_hash;
    readiness_state := existing_snapshot.readiness_state;
    reused := true;
    idempotency_key_out := cleaned_key;
    return next;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(target_workspace_id::text || ':' || target_deal_id::text));
  select coalesce(max(snapshot_sequence), 0) + 1
  into next_sequence
  from public.underwriting_snapshots
  where workspace_id = target_workspace_id and deal_id = target_deal_id;

  insert into public.underwriting_snapshots (
    workspace_id,
    deal_id,
    primary_property_id,
    property_ids,
    snapshot_sequence,
    prior_snapshot_id,
    supersedes_snapshot_id,
    schema_id,
    schema_version,
    schema_registry_version,
    input_registry_version,
    validation_registry_version,
    normalization_registry_version,
    formula_registry_version,
    snapshot_contract_version,
    snapshot_hash_version,
    source_validation_id,
    source_validation_hash,
    deal_version,
    property_versions,
    calculation_currency,
    unit_system,
    valuation_date,
    hold_period_months,
    intended_underwriting_mode,
    reporting_period,
    readiness_state,
    is_executable,
    input_count,
    missing_required_input_ids,
    invalid_required_input_ids,
    conflicted_required_input_ids,
    provisional_required_input_ids,
    blocking_reasons,
    warnings,
    content_hash,
    manifest_hash,
    reason,
    idempotency_key,
    created_by,
    created_at
  )
  values (
    target_workspace_id,
    target_deal_id,
    primary_property,
    property_ids,
    next_sequence,
    (select id from public.underwriting_snapshots where workspace_id = target_workspace_id and deal_id = target_deal_id order by snapshot_sequence desc limit 1),
    (select id from public.underwriting_snapshots where workspace_id = target_workspace_id and deal_id = target_deal_id order by snapshot_sequence desc limit 1),
    safe_payload ->> 'schemaId',
    safe_payload ->> 'schemaVersion',
    safe_payload ->> 'schemaRegistryVersion',
    safe_payload ->> 'inputRegistryVersion',
    safe_payload ->> 'validationRegistryVersion',
    safe_payload ->> 'normalizationRegistryVersion',
    safe_payload ->> 'formulaRegistryVersion',
    coalesce(safe_payload ->> 'snapshotContractVersion', 'underwriting-snapshot-contract-v1'),
    coalesce(safe_payload ->> 'snapshotHashVersion', 'underwriting-snapshot-content-hash-v1'),
    safe_payload ->> 'sourceValidationId',
    safe_payload ->> 'sourceValidationHash',
    safe_payload ->> 'dealVersion',
    coalesce(safe_payload -> 'propertyVersions', '{}'::jsonb),
    coalesce(safe_payload ->> 'calculationCurrency', 'USD'),
    coalesce(safe_payload ->> 'unitSystem', 'imperial'),
    nullif(safe_payload ->> 'valuationDate', '')::date,
    nullif(safe_payload ->> 'holdPeriodMonths', '')::integer,
    nullif(safe_payload ->> 'intendedUnderwritingMode', ''),
    coalesce(safe_payload ->> 'reportingPeriod', 'annual'),
    safe_payload ->> 'readinessState',
    coalesce((safe_payload ->> 'isExecutable')::boolean, false),
    coalesce((safe_payload ->> 'inputCount')::integer, 0),
    public.underwriting_snapshot_text_array(safe_payload -> 'missingRequiredInputIds'),
    public.underwriting_snapshot_text_array(safe_payload -> 'invalidRequiredInputIds'),
    public.underwriting_snapshot_text_array(safe_payload -> 'conflictedRequiredInputIds'),
    public.underwriting_snapshot_text_array(safe_payload -> 'provisionalRequiredInputIds'),
    coalesce(safe_payload -> 'blockingReasons', '[]'::jsonb),
    coalesce(safe_payload -> 'warnings', '[]'::jsonb),
    requested_hash,
    requested_manifest_hash,
    coalesce(nullif(btrim(safe_payload ->> 'reason'), ''), 'initial_underwriting'),
    cleaned_key,
    current_user_id,
    coalesce(nullif(safe_payload ->> 'createdAt', '')::timestamptz, now())
  )
  returning * into inserted_snapshot;

  insert into public.underwriting_snapshot_requests (workspace_id, deal_id, snapshot_id, idempotency_key, request_hash, content_hash, created_by)
  values (target_workspace_id, target_deal_id, inserted_snapshot.id, cleaned_key, request_hash, requested_hash, current_user_id);

  insert into public.underwriting_snapshot_inputs (
    workspace_id,
    snapshot_id,
    input_id,
    requirement_state,
    validation_status,
    canonical_data_type,
    normalized_value,
    display_value,
    canonical_unit,
    canonical_period,
    canonical_currency,
    raw_accepted_value_ref,
    input_version,
    completeness_state,
    assumption_state,
    conflict_state,
    precision_applied,
    rounding_applied,
    conversion_applied,
    conversion_version,
    deterministic_input_hash,
    stable_ordinal
  )
  select
    target_workspace_id,
    inserted_snapshot.id,
    item.value ->> 'inputId',
    item.value ->> 'requirementState',
    item.value ->> 'validationStatus',
    item.value ->> 'canonicalDataType',
    coalesce(item.value -> 'normalizedValue', 'null'::jsonb),
    coalesce(item.value ->> 'displayValue', ''),
    item.value ->> 'canonicalUnit',
    item.value ->> 'canonicalPeriod',
    nullif(item.value ->> 'canonicalCurrency', ''),
    coalesce(item.value -> 'rawAcceptedValueRef', 'null'::jsonb),
    nullif(item.value ->> 'inputVersion', ''),
    item.value ->> 'completenessState',
    item.value ->> 'assumptionState',
    item.value ->> 'conflictState',
    coalesce(item.value -> 'precisionApplied', '{}'::jsonb),
    coalesce((item.value ->> 'roundingApplied')::boolean, false),
    coalesce((item.value ->> 'conversionApplied')::boolean, false),
    nullif(item.value ->> 'conversionVersion', ''),
    item.value ->> 'deterministicInputHash',
    coalesce((item.value ->> 'stableOrdinal')::integer, item.ordinality::integer)
  from jsonb_array_elements(coalesce(safe_payload -> 'inputs', '[]'::jsonb)) with ordinality as item(value, ordinality);

  insert into public.underwriting_snapshot_provenance (
    workspace_id,
    snapshot_id,
    snapshot_input_id,
    input_id,
    source_fact_id,
    accepted_assumption_id,
    preliminary_assumption_id,
    source_record_id,
    evidence_id,
    source_anchor,
    source_classification,
    verification_state,
    stable_ordinal
  )
  select
    target_workspace_id,
    inserted_snapshot.id,
    snapshot_input.id,
    item.value ->> 'inputId',
    nullif(item.value ->> 'sourceFactId', ''),
    nullif(item.value ->> 'acceptedAssumptionId', ''),
    nullif(item.value ->> 'preliminaryAssumptionId', ''),
    nullif(item.value ->> 'sourceRecordId', ''),
    case
      when nullif(item.value ->> 'evidenceId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (item.value ->> 'evidenceId')::uuid
      else null
    end,
    case when jsonb_typeof(item.value -> 'sourceAnchor') = 'object' then item.value -> 'sourceAnchor' else '{}'::jsonb end,
    nullif(item.value ->> 'sourceClassification', ''),
    nullif(item.value ->> 'verificationState', ''),
    coalesce((item.value ->> 'stableOrdinal')::integer, item.ordinality::integer)
  from jsonb_array_elements(coalesce(safe_payload -> 'provenance', '[]'::jsonb)) with ordinality as item(value, ordinality)
  left join public.underwriting_snapshot_inputs snapshot_input
    on snapshot_input.snapshot_id = inserted_snapshot.id
   and snapshot_input.input_id = item.value ->> 'inputId';

  insert into public.underwriting_snapshot_formula_manifest (
    workspace_id,
    snapshot_id,
    formula_id,
    formula_version,
    formula_registry_version,
    supported_by_schema,
    readiness_status,
    required_input_ids,
    missing_input_ids,
    blocked_input_ids,
    assumption_dependent_input_ids,
    preliminary_input_ids,
    dependency_formula_versions,
    executable,
    stable_ordinal,
    manifest_hash
  )
  select
    target_workspace_id,
    inserted_snapshot.id,
    item.value ->> 'formulaId',
    item.value ->> 'formulaVersion',
    item.value ->> 'formulaRegistryVersion',
    coalesce((item.value ->> 'supportedBySchema')::boolean, true),
    item.value ->> 'readinessStatus',
    public.underwriting_snapshot_text_array(item.value -> 'requiredInputIds'),
    public.underwriting_snapshot_text_array(item.value -> 'missingInputIds'),
    public.underwriting_snapshot_text_array(item.value -> 'blockedInputIds'),
    public.underwriting_snapshot_text_array(item.value -> 'assumptionDependentInputIds'),
    public.underwriting_snapshot_text_array(item.value -> 'preliminaryInputIds'),
    coalesce(item.value -> 'dependencyFormulaVersions', '[]'::jsonb),
    coalesce((item.value ->> 'executable')::boolean, false),
    coalesce((item.value ->> 'stableOrdinal')::integer, item.ordinality::integer),
    requested_manifest_hash
  from jsonb_array_elements(coalesce(safe_payload -> 'formulaManifest', '[]'::jsonb)) with ordinality as item(value, ordinality);

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (
    target_workspace_id,
    target_deal_id,
    primary_property,
    current_user_id,
    'underwriting.snapshot_created',
    'underwriting_snapshot',
    inserted_snapshot.id,
    inserted_snapshot.snapshot_sequence,
    'create_underwriting_snapshot',
    cleaned_key || ':underwriting.snapshot_created',
    jsonb_build_object(
      'snapshot_id', inserted_snapshot.id,
      'snapshot_sequence', inserted_snapshot.snapshot_sequence,
      'readiness_state', inserted_snapshot.readiness_state,
      'is_executable', inserted_snapshot.is_executable,
      'content_hash', inserted_snapshot.content_hash,
      'manifest_hash', inserted_snapshot.manifest_hash,
      'schema_id', inserted_snapshot.schema_id,
      'schema_version', inserted_snapshot.schema_version
    )
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    target_deal_id,
    primary_property,
    current_user_id,
    'underwriting.snapshot_created',
    'underwriting_snapshots',
    'underwriting_snapshot',
    inserted_snapshot.id,
    'create_underwriting_snapshot',
    cleaned_key || ':audit',
    jsonb_build_object('snapshot_sequence', inserted_snapshot.snapshot_sequence, 'readiness_state', inserted_snapshot.readiness_state, 'content_hash', inserted_snapshot.content_hash),
    array['snapshot_sequence', 'readiness_state', 'content_hash'],
    jsonb_build_object('schema_id', inserted_snapshot.schema_id, 'schema_version', inserted_snapshot.schema_version, 'formula_registry_version', inserted_snapshot.formula_registry_version)
  )
  on conflict do nothing;

  snapshot_id := inserted_snapshot.id;
  snapshot_sequence := inserted_snapshot.snapshot_sequence;
  content_hash := inserted_snapshot.content_hash;
  readiness_state := inserted_snapshot.readiness_state;
  reused := false;
  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace view public.underwriting_snapshot_summaries
with (security_invoker = true)
as
select
  snapshot.id as snapshot_id,
  snapshot.workspace_id,
  snapshot.deal_id,
  snapshot.primary_property_id,
  snapshot.snapshot_sequence,
  snapshot.readiness_state,
  snapshot.is_executable,
  snapshot.input_count,
  cardinality(snapshot.missing_required_input_ids) as missing_required_input_count,
  cardinality(snapshot.conflicted_required_input_ids) as conflicted_required_input_count,
  cardinality(snapshot.provisional_required_input_ids) as provisional_required_input_count,
  snapshot.content_hash,
  snapshot.manifest_hash,
  snapshot.reason,
  snapshot.created_by,
  snapshot.created_at
from public.underwriting_snapshots snapshot;

create or replace view public.underwriting_snapshot_comparison_basis
with (security_invoker = true)
as
select
  snapshot.id as snapshot_id,
  snapshot.workspace_id,
  snapshot.deal_id,
  snapshot.snapshot_sequence,
  snapshot.content_hash,
  snapshot.manifest_hash,
  snapshot.readiness_state,
  snapshot.is_executable,
  snapshot.missing_required_input_ids,
  snapshot.invalid_required_input_ids,
  snapshot.conflicted_required_input_ids,
  snapshot.provisional_required_input_ids,
  snapshot.property_versions,
  snapshot.created_at
from public.underwriting_snapshots snapshot;

revoke all on function public.prevent_underwriting_snapshot_mutation() from public;
revoke all on function public.underwriting_snapshot_text_array(jsonb) from public;
revoke all on function public.underwriting_snapshot_uuid_array(jsonb) from public;
revoke all on function public.create_underwriting_snapshot(uuid, uuid, text, jsonb) from public;

grant execute on function public.underwriting_snapshot_text_array(jsonb) to authenticated;
grant execute on function public.underwriting_snapshot_uuid_array(jsonb) to authenticated;
grant execute on function public.create_underwriting_snapshot(uuid, uuid, text, jsonb) to authenticated;
grant select on public.underwriting_snapshot_summaries to authenticated;
grant select on public.underwriting_snapshot_comparison_basis to authenticated;

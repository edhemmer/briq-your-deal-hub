-- Specification 009 Slice 3: Lender conditions, covenants, and financing constraints.
-- FinanceIQ owns requirements and threshold comparison. Specification 005 remains
-- the sole owner of authoritative underwriting metric calculation.

create extension if not exists pgcrypto;

create table if not exists public.financing_condition_type_definitions (
  type_key text primary key,
  label text not null,
  sort_order integer not null unique,
  requires_professional_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.financing_condition_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  counts_as_unresolved boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.financing_covenant_type_definitions (
  type_key text primary key,
  label text not null,
  default_metric_key text,
  default_comparison_operator text,
  sort_order integer not null unique,
  requires_professional_review boolean not null default false,
  created_at timestamptz not null default now(),
  check (default_metric_key is null or default_metric_key in ('dscr', 'ltv', 'ltc', 'debt_yield', 'occupancy')),
  check (default_comparison_operator is null or default_comparison_operator in ('gte', 'gt', 'lte', 'lt', 'eq', 'between'))
);

create table if not exists public.financing_constraint_evaluation_state_definitions (
  state_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.financing_feasibility_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.financing_metric_binding_registry (
  metric_key text primary key check (metric_key in ('dscr', 'ltv', 'ltc', 'debt_yield', 'occupancy')),
  formula_id text not null,
  formula_registry_version text not null default 'spec005-current',
  is_available boolean not null default false,
  binding_source text not null default 'spec005_underwriting_output',
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

insert into public.financing_condition_type_definitions (type_key, label, sort_order, requires_professional_review)
values
  ('appraisal', 'Appraisal', 10, false),
  ('inspection', 'Inspection', 20, false),
  ('environmental', 'Environmental', 30, true),
  ('insurance', 'Insurance', 40, false),
  ('title', 'Title', 50, true),
  ('survey', 'Survey', 60, true),
  ('entity_documentation', 'Entity Documentation', 70, false),
  ('guarantor_liquidity', 'Guarantor Liquidity', 80, false),
  ('guarantor_net_worth', 'Guarantor Net Worth', 90, false),
  ('borrower_experience', 'Borrower Experience', 100, false),
  ('occupancy', 'Occupancy', 110, false),
  ('stabilization', 'Stabilization', 120, false),
  ('permit', 'Permit', 130, true),
  ('zoning', 'Zoning', 140, true),
  ('governance', 'Governance', 150, true),
  ('reporting', 'Reporting', 160, false),
  ('closing_timeline', 'Closing Timeline', 170, false),
  ('repair_completion', 'Repair Completion', 180, false),
  ('reserve_funding', 'Reserve Funding', 190, false),
  ('document_delivery', 'Document Delivery', 200, false),
  ('other', 'Other', 210, false)
on conflict (type_key) do update set label = excluded.label, sort_order = excluded.sort_order, requires_professional_review = excluded.requires_professional_review;

insert into public.financing_condition_status_definitions (status_key, label, sort_order, is_terminal, counts_as_unresolved)
values
  ('pending', 'Pending', 10, false, true),
  ('submitted', 'Submitted', 20, false, true),
  ('under_review', 'Under Review', 30, false, true),
  ('satisfied', 'Satisfied', 40, true, false),
  ('waived', 'Waived', 50, true, false),
  ('failed', 'Failed', 60, true, true),
  ('expired', 'Expired', 70, true, true),
  ('not_applicable', 'Not Applicable', 80, true, false),
  ('disputed', 'Disputed', 90, false, true),
  ('unknown', 'Unknown', 100, false, true)
on conflict (status_key) do update set label = excluded.label, sort_order = excluded.sort_order, is_terminal = excluded.is_terminal, counts_as_unresolved = excluded.counts_as_unresolved;

insert into public.financing_covenant_type_definitions (type_key, label, default_metric_key, default_comparison_operator, sort_order, requires_professional_review)
values
  ('minimum_dscr', 'Minimum DSCR', 'dscr', 'gte', 10, false),
  ('maximum_ltv', 'Maximum LTV', 'ltv', 'lte', 20, false),
  ('maximum_ltc', 'Maximum LTC', 'ltc', 'lte', 30, false),
  ('minimum_debt_yield', 'Minimum Debt Yield', 'debt_yield', 'gte', 40, false),
  ('minimum_occupancy', 'Minimum Occupancy', 'occupancy', 'gte', 50, false),
  ('minimum_liquidity', 'Minimum Liquidity', null, null, 60, false),
  ('minimum_net_worth', 'Minimum Net Worth', null, null, 70, false),
  ('reporting_covenant', 'Reporting Covenant', null, null, 80, false),
  ('cash_management_lockbox_trigger', 'Cash Management / Lockbox Trigger', null, null, 90, true),
  ('sweep_trigger', 'Sweep Trigger', null, null, 100, true),
  ('completion_test', 'Completion Test', null, null, 110, false),
  ('stabilization_test', 'Stabilization Test', null, null, 120, false),
  ('leasing_test', 'Leasing Test', null, null, 130, false),
  ('insurance_requirement', 'Insurance Requirement', null, null, 140, false),
  ('environmental_requirement', 'Environmental Requirement', null, null, 150, true),
  ('property_management_requirement', 'Property Management Requirement', null, null, 160, false),
  ('transfer_restriction', 'Transfer Restriction', null, null, 170, true),
  ('additional_debt_restriction', 'Additional Debt Restriction', null, null, 180, true),
  ('other', 'Other', null, null, 190, false)
on conflict (type_key) do update set label = excluded.label, default_metric_key = excluded.default_metric_key, default_comparison_operator = excluded.default_comparison_operator, sort_order = excluded.sort_order, requires_professional_review = excluded.requires_professional_review;

insert into public.financing_constraint_evaluation_state_definitions (state_key, label, sort_order, is_terminal)
values
  ('passes', 'Passes', 10, true),
  ('fails', 'Fails', 20, true),
  ('uncertain', 'Uncertain', 30, false),
  ('missing_input', 'Missing Input', 40, false),
  ('unsupported_metric', 'Unsupported Metric', 50, false),
  ('expired', 'Expired', 60, true),
  ('superseded', 'Superseded', 70, true),
  ('not_applicable', 'Not Applicable', 80, true)
on conflict (state_key) do update set label = excluded.label, sort_order = excluded.sort_order, is_terminal = excluded.is_terminal;

insert into public.financing_feasibility_status_definitions (status_key, label, sort_order, is_terminal)
values
  ('feasible', 'Feasible', 10, false),
  ('feasible_with_conditions', 'Feasible With Conditions', 20, false),
  ('uncertain', 'Uncertain', 30, false),
  ('not_feasible', 'Not Feasible', 40, true),
  ('expired', 'Expired', 50, true),
  ('superseded', 'Superseded', 60, true)
on conflict (status_key) do update set label = excluded.label, sort_order = excluded.sort_order, is_terminal = excluded.is_terminal;

insert into public.financing_metric_binding_registry (metric_key, formula_id, is_available, sort_order)
values
  ('dscr', 'debt_service_coverage_ratio', true, 10),
  ('ltv', 'loan_to_value_ratio', true, 20),
  ('ltc', 'loan_to_cost_ratio', false, 30),
  ('debt_yield', 'debt_yield', false, 40),
  ('occupancy', 'economic_occupancy', false, 50)
on conflict (metric_key) do update set formula_id = excluded.formula_id, is_available = excluded.is_available, sort_order = excluded.sort_order;

create table if not exists public.financing_conditions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  financing_structure_id uuid not null,
  debt_tranche_id uuid,
  capital_source_id uuid,
  title text not null,
  description text,
  condition_type text not null default 'other' references public.financing_condition_type_definitions(type_key),
  status text not null default 'pending' references public.financing_condition_status_definitions(status_key),
  responsible_party_type text,
  responsible_user_id uuid references auth.users(id) on delete set null,
  responsible_contact_id uuid references public.contacts(id) on delete set null,
  due_date date,
  required_before_stage text,
  task_id uuid references public.tasks(id) on delete set null,
  deadline_id uuid references public.deadlines(id) on delete set null,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  verification_state text not null default 'unverified' references public.financing_verification_state_definitions(state_key),
  source_classification text not null default 'user_entered_assumption' references public.financing_source_classification_definitions(classification_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  effective_at timestamptz,
  expires_at timestamptz,
  resolved_at timestamptz,
  waiver_state text not null default 'none' check (waiver_state in ('none', 'requested', 'granted', 'denied', 'expired', 'unresolved')),
  waiver_source_evidence_id uuid references public.evidence_items(id) on delete set null,
  waiver_source_record_id uuid references public.manual_source_records(id) on delete set null,
  conflict_state text not null default 'none' check (conflict_state in ('none', 'source_conflict', 'governing_source_selected', 'superseded_source', 'unresolved')),
  governing_source_status text not null default 'not_selected' check (governing_source_status in ('not_selected', 'selected', 'disputed', 'superseded')),
  professional_review_required boolean not null default false,
  professional_review_category text,
  provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(provenance) = 'object'),
  archived_at timestamptz,
  supersedes_condition_id uuid references public.financing_conditions(id) on delete restrict,
  superseded_by_condition_id uuid references public.financing_conditions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financing_conditions_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete cascade,
  constraint financing_conditions_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint financing_conditions_debt_tranche_fk foreign key (debt_tranche_id)
    references public.debt_tranches(id),
  constraint financing_conditions_capital_source_fk foreign key (workspace_id, financing_structure_id, capital_source_id)
    references public.capital_sources(workspace_id, financing_structure_id, id),
  constraint financing_conditions_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id)
    references public.evidence_items(workspace_id, id),
  constraint financing_conditions_title_not_blank check (length(btrim(title)) > 0),
  constraint financing_conditions_expiry_after_effective check (expires_at is null or effective_at is null or expires_at > effective_at)
);

create table if not exists public.financing_condition_versions (
  id uuid primary key default gen_random_uuid(),
  financing_condition_id uuid not null references public.financing_conditions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  financing_structure_id uuid not null,
  version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  change_reason text,
  unique (financing_condition_id, version)
);

create table if not exists public.financing_covenants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  financing_structure_id uuid not null,
  debt_tranche_id uuid,
  covenant_type text not null default 'other' references public.financing_covenant_type_definitions(type_key),
  metric_key text check (metric_key is null or metric_key in ('dscr', 'ltv', 'ltc', 'debt_yield', 'occupancy')),
  comparison_operator text check (comparison_operator is null or comparison_operator in ('gte', 'gt', 'lte', 'lt', 'eq', 'between')),
  threshold_value numeric,
  secondary_threshold_value numeric,
  measurement_period text,
  test_frequency text,
  effective_at timestamptz,
  expires_at timestamptz,
  cure_period_days integer check (cure_period_days is null or cure_period_days >= 0),
  cure_description text,
  consequence text,
  is_hard_constraint boolean not null default true,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  verification_state text not null default 'unverified' references public.financing_verification_state_definitions(state_key),
  source_classification text not null default 'user_entered_assumption' references public.financing_source_classification_definitions(classification_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  status text not null default 'draft' check (status in ('draft', 'active', 'waived', 'cured', 'breached', 'expired', 'superseded', 'not_applicable', 'unknown')),
  conflict_state text not null default 'none' check (conflict_state in ('none', 'source_conflict', 'governing_source_selected', 'superseded_source', 'unresolved')),
  governing_source_status text not null default 'not_selected' check (governing_source_status in ('not_selected', 'selected', 'disputed', 'superseded')),
  professional_review_required boolean not null default false,
  professional_review_category text,
  provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(provenance) = 'object'),
  archived_at timestamptz,
  supersedes_covenant_id uuid references public.financing_covenants(id) on delete restrict,
  superseded_by_covenant_id uuid references public.financing_covenants(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financing_covenants_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete cascade,
  constraint financing_covenants_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint financing_covenants_debt_tranche_fk foreign key (debt_tranche_id)
    references public.debt_tranches(id),
  constraint financing_covenants_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id)
    references public.evidence_items(workspace_id, id),
  constraint financing_covenants_metric_threshold_shape check (
    metric_key is null
    or (comparison_operator is not null and threshold_value is not null)
  ),
  constraint financing_covenants_between_shape check (
    comparison_operator is distinct from 'between' or secondary_threshold_value is not null
  ),
  constraint financing_covenants_expiry_after_effective check (expires_at is null or effective_at is null or expires_at > effective_at)
);

create table if not exists public.financing_covenant_versions (
  id uuid primary key default gen_random_uuid(),
  financing_covenant_id uuid not null references public.financing_covenants(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  financing_structure_id uuid not null,
  version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  change_reason text,
  unique (financing_covenant_id, version)
);

create table if not exists public.financing_covenant_evaluation_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  financing_structure_id uuid not null,
  covenant_id uuid not null references public.financing_covenants(id) on delete restrict,
  covenant_version integer not null,
  underwriting_snapshot_id uuid references public.underwriting_snapshots(id) on delete restrict,
  underwriting_snapshot_version integer,
  underwriting_run_id uuid references public.underwriting_output_runs(id) on delete restrict,
  metric_key text check (metric_key is null or metric_key in ('dscr', 'ltv', 'ltc', 'debt_yield', 'occupancy')),
  formula_id text,
  authoritative_metric_value numeric,
  authoritative_metric_status text,
  threshold_value numeric,
  secondary_threshold_value numeric,
  comparison_operator text check (comparison_operator is null or comparison_operator in ('gte', 'gt', 'lte', 'lt', 'eq', 'between')),
  evaluation_state text not null references public.financing_constraint_evaluation_state_definitions(state_key),
  is_hard_constraint boolean not null,
  evaluation_version text not null default 'financeiq-constraint-evaluation-v1',
  result_hash text not null,
  stale boolean not null default false,
  reason_codes text[] not null default '{}'::text[],
  failure_code text,
  correlation_id uuid not null default gen_random_uuid(),
  execution_duration_ms integer not null default 0 check (execution_duration_ms >= 0),
  result_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(result_payload) = 'object'),
  evaluated_by uuid references auth.users(id) on delete set null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint financing_covenant_evaluations_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete cascade,
  constraint financing_covenant_evaluations_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade
);

create table if not exists public.financing_feasibility_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  financing_structure_id uuid not null,
  financing_structure_version integer not null,
  status text not null references public.financing_feasibility_status_definitions(status_key),
  feasibility_version integer not null,
  underwriting_snapshot_id uuid references public.underwriting_snapshots(id) on delete restrict,
  underwriting_snapshot_version integer,
  covenant_evaluation_ids uuid[] not null default '{}'::uuid[],
  unresolved_condition_count integer not null default 0 check (unresolved_condition_count >= 0),
  blocking_condition_count integer not null default 0 check (blocking_condition_count >= 0),
  failed_covenant_count integer not null default 0 check (failed_covenant_count >= 0),
  uncertain_covenant_count integer not null default 0 check (uncertain_covenant_count >= 0),
  unverified_condition_count integer not null default 0 check (unverified_condition_count >= 0),
  unverified_covenant_count integer not null default 0 check (unverified_covenant_count >= 0),
  conflicted_requirement_count integer not null default 0 check (conflicted_requirement_count >= 0),
  expired_requirement_count integer not null default 0 check (expired_requirement_count >= 0),
  stale boolean not null default false,
  failure_code text,
  result_hash text not null,
  correlation_id uuid not null default gen_random_uuid(),
  execution_duration_ms integer not null default 0 check (execution_duration_ms >= 0),
  result_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(result_payload) = 'object'),
  evaluated_by uuid references auth.users(id) on delete set null,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint financing_feasibility_results_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete cascade,
  constraint financing_feasibility_results_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade
);

create unique index if not exists idx_financing_conditions_workspace_id on public.financing_conditions(workspace_id, id);
create unique index if not exists idx_financing_covenants_workspace_id on public.financing_covenants(workspace_id, id);
create index if not exists idx_financing_conditions_structure_status on public.financing_conditions(workspace_id, financing_structure_id, status, updated_at desc) where archived_at is null;
create index if not exists idx_financing_conditions_task_ref on public.financing_conditions(task_id) where task_id is not null;
create index if not exists idx_financing_conditions_deadline_ref on public.financing_conditions(deadline_id) where deadline_id is not null;
create index if not exists idx_financing_covenants_structure_metric on public.financing_covenants(workspace_id, financing_structure_id, metric_key, updated_at desc) where archived_at is null;
create index if not exists idx_financing_covenant_evaluations_structure on public.financing_covenant_evaluation_results(workspace_id, financing_structure_id, evaluated_at desc);
create index if not exists idx_financing_covenant_evaluations_covenant_version on public.financing_covenant_evaluation_results(covenant_id, covenant_version, evaluated_at desc);
create index if not exists idx_financing_feasibility_results_structure on public.financing_feasibility_results(workspace_id, financing_structure_id, evaluated_at desc);

drop trigger if exists touch_financing_conditions on public.financing_conditions;
create trigger touch_financing_conditions before update on public.financing_conditions for each row execute function public.touch_versioned_record();

drop trigger if exists touch_financing_covenants on public.financing_covenants;
create trigger touch_financing_covenants before update on public.financing_covenants for each row execute function public.touch_versioned_record();

create or replace function public.record_financing_condition_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.financing_condition_versions (financing_condition_id, workspace_id, deal_id, financing_structure_id, version, snapshot, changed_by, change_reason)
  values (old.id, old.workspace_id, old.deal_id, old.financing_structure_id, old.version, to_jsonb(old), new.updated_by,
    case when new.archived_at is not null and old.archived_at is null then 'archived'
         when new.status = 'satisfied' and old.status <> 'satisfied' then 'satisfied'
         when new.waiver_state is distinct from old.waiver_state then 'waiver_changed'
         else 'updated' end)
  on conflict (financing_condition_id, version) do nothing;
  return new;
end;
$$;

drop trigger if exists record_financing_condition_version_on_update on public.financing_conditions;
create trigger record_financing_condition_version_on_update after update on public.financing_conditions for each row execute function public.record_financing_condition_version();

create or replace function public.record_financing_covenant_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.financing_covenant_versions (financing_covenant_id, workspace_id, deal_id, financing_structure_id, version, snapshot, changed_by, change_reason)
  values (old.id, old.workspace_id, old.deal_id, old.financing_structure_id, old.version, to_jsonb(old), new.updated_by,
    case when new.archived_at is not null and old.archived_at is null then 'archived'
         when new.threshold_value is distinct from old.threshold_value or new.comparison_operator is distinct from old.comparison_operator then 'threshold_changed'
         when new.status is distinct from old.status then 'status_changed'
         else 'updated' end)
  on conflict (financing_covenant_id, version) do nothing;
  return new;
end;
$$;

drop trigger if exists record_financing_covenant_version_on_update on public.financing_covenants;
create trigger record_financing_covenant_version_on_update after update on public.financing_covenants for each row execute function public.record_financing_covenant_version();

drop trigger if exists financing_covenant_evaluation_results_immutable on public.financing_covenant_evaluation_results;
create trigger financing_covenant_evaluation_results_immutable
before update or delete on public.financing_covenant_evaluation_results
for each row execute function public.prevent_underwriting_output_mutation();

drop trigger if exists financing_feasibility_results_immutable on public.financing_feasibility_results;
create trigger financing_feasibility_results_immutable
before update or delete on public.financing_feasibility_results
for each row execute function public.prevent_underwriting_output_mutation();

create or replace function public.financeiq_compare_threshold(metric_value numeric, operator text, threshold numeric, secondary_threshold numeric default null)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when operator = 'gte' then metric_value >= threshold
    when operator = 'gt' then metric_value > threshold
    when operator = 'lte' then metric_value <= threshold
    when operator = 'lt' then metric_value < threshold
    when operator = 'eq' then metric_value = threshold
    when operator = 'between' then secondary_threshold is not null and metric_value >= threshold and metric_value <= secondary_threshold
    else false
  end;
$$;

create or replace function public.financeiq_requirement_hash(payload jsonb)
returns text
language sql
stable
set search_path = public
as $$
  select 'md5:' || md5(public.safe_event_jsonb(payload)::text);
$$;

create or replace function public.create_financing_condition(target_financing_structure_id uuid, condition_input jsonb, idempotency_key text)
returns table (condition_id uuid, condition_version integer, workspace_id uuid, deal_id uuid, financing_structure_id uuid, status text, idempotency_key_out text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(condition_input, '{}'::jsonb));
  target_structure public.financing_structures%rowtype;
  command public.financing_command_requests%rowtype;
  inserted_condition public.financing_conditions%rowtype;
  requested_type text := coalesce(nullif(btrim(safe_input ->> 'conditionType'), ''), 'other');
  requested_status text := coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'pending');
begin
  if current_user_id is null then raise exception 'Authentication required to create financing condition.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Condition input must be an object.' using errcode = '22023'; end if;
  select * into target_structure from public.financing_structures where id = target_financing_structure_id and archived_at is null;
  if target_structure.id is null or not public.is_workspace_member(target_structure.workspace_id) then raise exception 'Financing structure not found.' using errcode = '42501'; end if;
  if not exists (select 1 from public.financing_condition_type_definitions where type_key = requested_type) then raise exception 'Financing condition type is not available.' using errcode = '22023'; end if;
  if not exists (select 1 from public.financing_condition_status_definitions where status_key = requested_status) then raise exception 'Financing condition status is not available.' using errcode = '22023'; end if;

  command := public.ensure_financing_command(target_structure.workspace_id, target_structure.deal_id, target_structure.id, 'create_financing_condition', idempotency_key, safe_input);
  if command.result ? 'condition_id' then
    select condition.id, condition.version, condition.workspace_id, condition.deal_id, condition.financing_structure_id, condition.status, command.idempotency_key
    into condition_id, condition_version, workspace_id, deal_id, financing_structure_id, status, idempotency_key_out
    from public.financing_conditions condition where condition.id = (command.result ->> 'condition_id')::uuid;
    return next;
    return;
  end if;

  insert into public.financing_conditions (
    workspace_id, deal_id, financing_structure_id, debt_tranche_id, capital_source_id, title, description, condition_type, status,
    responsible_party_type, responsible_user_id, responsible_contact_id, due_date, required_before_stage, task_id, deadline_id,
    source_evidence_id, source_record_id, source_anchor, verification_state, source_classification, confidence, effective_at, expires_at,
    resolved_at, waiver_state, waiver_source_evidence_id, waiver_source_record_id, conflict_state, governing_source_status,
    professional_review_required, professional_review_category, provenance, created_by, updated_by
  )
  values (
    target_structure.workspace_id, target_structure.deal_id, target_structure.id,
    nullif(safe_input ->> 'debtTrancheId', '')::uuid,
    nullif(safe_input ->> 'capitalSourceId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'title'), ''), 'Financing condition'),
    nullif(btrim(safe_input ->> 'description'), ''),
    requested_type,
    requested_status,
    nullif(btrim(safe_input ->> 'responsiblePartyType'), ''),
    nullif(safe_input ->> 'responsibleUserId', '')::uuid,
    nullif(safe_input ->> 'responsibleContactId', '')::uuid,
    nullif(safe_input ->> 'dueDate', '')::date,
    nullif(btrim(safe_input ->> 'requiredBeforeStage'), ''),
    nullif(safe_input ->> 'taskId', '')::uuid,
    nullif(safe_input ->> 'deadlineId', '')::uuid,
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    nullif(safe_input ->> 'sourceRecordId', '')::uuid,
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
    coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'user_entered_assumption'),
    coalesce((safe_input ->> 'confidence')::integer, 50),
    nullif(safe_input ->> 'effectiveAt', '')::timestamptz,
    nullif(safe_input ->> 'expiresAt', '')::timestamptz,
    nullif(safe_input ->> 'resolvedAt', '')::timestamptz,
    coalesce(nullif(btrim(safe_input ->> 'waiverState'), ''), 'none'),
    nullif(safe_input ->> 'waiverSourceEvidenceId', '')::uuid,
    nullif(safe_input ->> 'waiverSourceRecordId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'conflictState'), ''), 'none'),
    coalesce(nullif(btrim(safe_input ->> 'governingSourceStatus'), ''), 'not_selected'),
    coalesce((safe_input ->> 'professionalReviewRequired')::boolean, false),
    nullif(btrim(safe_input ->> 'professionalReviewCategory'), ''),
    coalesce(safe_input -> 'provenance', '{}'::jsonb),
    current_user_id,
    current_user_id
  )
  returning * into inserted_condition;

  update public.financing_command_requests set result = jsonb_build_object('condition_id', inserted_condition.id, 'version', inserted_condition.version) where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (inserted_condition.workspace_id, inserted_condition.deal_id, current_user_id, 'financing.condition_changed', 'financing_condition', inserted_condition.id, inserted_condition.version, 'create_financing_condition', command.idempotency_key || ':financing.condition_changed', jsonb_build_object('financing_structure_id', inserted_condition.financing_structure_id, 'status', inserted_condition.status, 'condition_type', inserted_condition.condition_type));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (inserted_condition.workspace_id, inserted_condition.deal_id, current_user_id, 'financing.condition_created', 'financing_conditions', 'financing_condition', inserted_condition.id, 'create_financing_condition', command.idempotency_key || ':audit', to_jsonb(inserted_condition), array['created'], jsonb_build_object('version', inserted_condition.version));

  condition_id := inserted_condition.id; condition_version := inserted_condition.version; workspace_id := inserted_condition.workspace_id; deal_id := inserted_condition.deal_id; financing_structure_id := inserted_condition.financing_structure_id; status := inserted_condition.status; idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.update_financing_condition(target_condition_id uuid, condition_input jsonb, expected_version integer, idempotency_key text)
returns table (condition_id uuid, condition_version integer, workspace_id uuid, deal_id uuid, financing_structure_id uuid, status text, idempotency_key_out text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(condition_input, '{}'::jsonb));
  target_condition public.financing_conditions%rowtype;
  command public.financing_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to update financing condition.' using errcode = '42501'; end if;
  select * into target_condition from public.financing_conditions where id = target_condition_id and archived_at is null for update;
  if target_condition.id is null or not public.is_workspace_member(target_condition.workspace_id) then raise exception 'Financing condition not found.' using errcode = '42501'; end if;
  if target_condition.version <> expected_version then raise exception 'Financing condition changed before save. Reload and retry.' using errcode = '40001'; end if;
  command := public.ensure_financing_command(target_condition.workspace_id, target_condition.deal_id, target_condition.financing_structure_id, 'update_financing_condition', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'condition_id' then
    select condition.id, condition.version, condition.workspace_id, condition.deal_id, condition.financing_structure_id, condition.status, command.idempotency_key
    into condition_id, condition_version, workspace_id, deal_id, financing_structure_id, status, idempotency_key_out
    from public.financing_conditions condition where condition.id = (command.result ->> 'condition_id')::uuid;
    return next;
    return;
  end if;

  update public.financing_conditions condition set
    title = coalesce(nullif(btrim(safe_input ->> 'title'), ''), condition.title),
    description = coalesce(nullif(btrim(safe_input ->> 'description'), ''), condition.description),
    status = coalesce(nullif(btrim(safe_input ->> 'status'), ''), condition.status),
    verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), condition.verification_state),
    source_classification = coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), condition.source_classification),
    confidence = coalesce((safe_input ->> 'confidence')::integer, condition.confidence),
    source_evidence_id = coalesce(nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, condition.source_evidence_id),
    source_record_id = coalesce(nullif(safe_input ->> 'sourceRecordId', '')::uuid, condition.source_record_id),
    source_anchor = coalesce(safe_input -> 'sourceAnchor', condition.source_anchor),
    resolved_at = coalesce(nullif(safe_input ->> 'resolvedAt', '')::timestamptz, condition.resolved_at),
    waiver_state = coalesce(nullif(btrim(safe_input ->> 'waiverState'), ''), condition.waiver_state),
    conflict_state = coalesce(nullif(btrim(safe_input ->> 'conflictState'), ''), condition.conflict_state),
    governing_source_status = coalesce(nullif(btrim(safe_input ->> 'governingSourceStatus'), ''), condition.governing_source_status),
    updated_by = current_user_id
  where condition.id = target_condition.id
  returning * into target_condition;

  update public.financing_command_requests set result = jsonb_build_object('condition_id', target_condition.id, 'version', target_condition.version) where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_condition.workspace_id, target_condition.deal_id, current_user_id, 'financing.condition_changed', 'financing_condition', target_condition.id, target_condition.version, 'update_financing_condition', command.idempotency_key || ':financing.condition_changed', jsonb_build_object('financing_structure_id', target_condition.financing_structure_id, 'status', target_condition.status));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_condition.workspace_id, target_condition.deal_id, current_user_id, 'financing.condition_updated', 'financing_conditions', 'financing_condition', target_condition.id, 'update_financing_condition', command.idempotency_key || ':audit', to_jsonb(target_condition), array['updated'], jsonb_build_object('version', target_condition.version));

  condition_id := target_condition.id; condition_version := target_condition.version; workspace_id := target_condition.workspace_id; deal_id := target_condition.deal_id; financing_structure_id := target_condition.financing_structure_id; status := target_condition.status; idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.archive_financing_condition(target_condition_id uuid, expected_version integer, archive_reason text, idempotency_key text)
returns table (condition_id uuid, condition_version integer, workspace_id uuid, deal_id uuid, financing_structure_id uuid, status text, idempotency_key_out text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_condition public.financing_conditions%rowtype;
  command public.financing_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to archive financing condition.' using errcode = '42501'; end if;
  select * into target_condition from public.financing_conditions where id = target_condition_id and archived_at is null for update;
  if target_condition.id is null or not public.is_workspace_member(target_condition.workspace_id) then raise exception 'Financing condition not found.' using errcode = '42501'; end if;
  if target_condition.version <> expected_version then raise exception 'Financing condition changed before archive. Reload and retry.' using errcode = '40001'; end if;
  command := public.ensure_financing_command(target_condition.workspace_id, target_condition.deal_id, target_condition.financing_structure_id, 'archive_financing_condition', idempotency_key, jsonb_build_object('conditionId', target_condition.id, 'expectedVersion', expected_version, 'archiveReason', archive_reason));
  update public.financing_conditions set archived_at = now(), updated_by = current_user_id where id = target_condition.id returning * into target_condition;
  update public.financing_command_requests set result = jsonb_build_object('condition_id', target_condition.id, 'version', target_condition.version) where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_condition.workspace_id, target_condition.deal_id, current_user_id, 'financing.condition_changed', 'financing_condition', target_condition.id, target_condition.version, 'archive_financing_condition', command.idempotency_key || ':financing.condition_changed', jsonb_build_object('financing_structure_id', target_condition.financing_structure_id, 'archived', true, 'reason', archive_reason));
  condition_id := target_condition.id; condition_version := target_condition.version; workspace_id := target_condition.workspace_id; deal_id := target_condition.deal_id; financing_structure_id := target_condition.financing_structure_id; status := target_condition.status; idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.create_financing_covenant(target_financing_structure_id uuid, covenant_input jsonb, idempotency_key text)
returns table (covenant_id uuid, covenant_version integer, workspace_id uuid, deal_id uuid, financing_structure_id uuid, status text, idempotency_key_out text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(covenant_input, '{}'::jsonb));
  target_structure public.financing_structures%rowtype;
  command public.financing_command_requests%rowtype;
  inserted_covenant public.financing_covenants%rowtype;
  requested_type text := coalesce(nullif(btrim(safe_input ->> 'covenantType'), ''), 'other');
  requested_status text := coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'draft');
begin
  if current_user_id is null then raise exception 'Authentication required to create financing covenant.' using errcode = '42501'; end if;
  select * into target_structure from public.financing_structures where id = target_financing_structure_id and archived_at is null;
  if target_structure.id is null or not public.is_workspace_member(target_structure.workspace_id) then raise exception 'Financing structure not found.' using errcode = '42501'; end if;
  if not exists (select 1 from public.financing_covenant_type_definitions where type_key = requested_type) then raise exception 'Financing covenant type is not available.' using errcode = '22023'; end if;
  command := public.ensure_financing_command(target_structure.workspace_id, target_structure.deal_id, target_structure.id, 'create_financing_covenant', idempotency_key, safe_input);
  if command.result ? 'covenant_id' then
    select covenant.id, covenant.version, covenant.workspace_id, covenant.deal_id, covenant.financing_structure_id, covenant.status, command.idempotency_key
    into covenant_id, covenant_version, workspace_id, deal_id, financing_structure_id, status, idempotency_key_out
    from public.financing_covenants covenant where covenant.id = (command.result ->> 'covenant_id')::uuid;
    return next;
    return;
  end if;

  insert into public.financing_covenants (
    workspace_id, deal_id, financing_structure_id, debt_tranche_id, covenant_type, metric_key, comparison_operator, threshold_value,
    secondary_threshold_value, measurement_period, test_frequency, effective_at, expires_at, cure_period_days, cure_description, consequence,
    is_hard_constraint, source_evidence_id, source_record_id, source_anchor, verification_state, source_classification, confidence, status,
    conflict_state, governing_source_status, professional_review_required, professional_review_category, provenance, created_by, updated_by
  )
  values (
    target_structure.workspace_id, target_structure.deal_id, target_structure.id,
    nullif(safe_input ->> 'debtTrancheId', '')::uuid,
    requested_type,
    nullif(btrim(safe_input ->> 'metricKey'), ''),
    nullif(btrim(safe_input ->> 'comparisonOperator'), ''),
    nullif(safe_input ->> 'thresholdValue', '')::numeric,
    nullif(safe_input ->> 'secondaryThresholdValue', '')::numeric,
    nullif(btrim(safe_input ->> 'measurementPeriod'), ''),
    nullif(btrim(safe_input ->> 'testFrequency'), ''),
    nullif(safe_input ->> 'effectiveAt', '')::timestamptz,
    nullif(safe_input ->> 'expiresAt', '')::timestamptz,
    nullif(safe_input ->> 'curePeriodDays', '')::integer,
    nullif(btrim(safe_input ->> 'cureDescription'), ''),
    nullif(btrim(safe_input ->> 'consequence'), ''),
    coalesce((safe_input ->> 'isHardConstraint')::boolean, true),
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    nullif(safe_input ->> 'sourceRecordId', '')::uuid,
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
    coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'user_entered_assumption'),
    coalesce((safe_input ->> 'confidence')::integer, 50),
    requested_status,
    coalesce(nullif(btrim(safe_input ->> 'conflictState'), ''), 'none'),
    coalesce(nullif(btrim(safe_input ->> 'governingSourceStatus'), ''), 'not_selected'),
    coalesce((safe_input ->> 'professionalReviewRequired')::boolean, false),
    nullif(btrim(safe_input ->> 'professionalReviewCategory'), ''),
    coalesce(safe_input -> 'provenance', '{}'::jsonb),
    current_user_id,
    current_user_id
  )
  returning * into inserted_covenant;

  update public.financing_command_requests set result = jsonb_build_object('covenant_id', inserted_covenant.id, 'version', inserted_covenant.version) where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (inserted_covenant.workspace_id, inserted_covenant.deal_id, current_user_id, 'financing.covenant_changed', 'financing_covenant', inserted_covenant.id, inserted_covenant.version, 'create_financing_covenant', command.idempotency_key || ':financing.covenant_changed', jsonb_build_object('financing_structure_id', inserted_covenant.financing_structure_id, 'metric_key', inserted_covenant.metric_key, 'calculation_authority', 'spec005_underwriting_only'));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (inserted_covenant.workspace_id, inserted_covenant.deal_id, current_user_id, 'financing.covenant_created', 'financing_covenants', 'financing_covenant', inserted_covenant.id, 'create_financing_covenant', command.idempotency_key || ':audit', to_jsonb(inserted_covenant), array['created'], jsonb_build_object('calculation_authority', 'spec005_underwriting_only'));

  covenant_id := inserted_covenant.id; covenant_version := inserted_covenant.version; workspace_id := inserted_covenant.workspace_id; deal_id := inserted_covenant.deal_id; financing_structure_id := inserted_covenant.financing_structure_id; status := inserted_covenant.status; idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.update_financing_covenant(target_covenant_id uuid, covenant_input jsonb, expected_version integer, idempotency_key text)
returns table (covenant_id uuid, covenant_version integer, workspace_id uuid, deal_id uuid, financing_structure_id uuid, status text, idempotency_key_out text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(covenant_input, '{}'::jsonb));
  target_covenant public.financing_covenants%rowtype;
  command public.financing_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to update financing covenant.' using errcode = '42501'; end if;
  select * into target_covenant from public.financing_covenants where id = target_covenant_id and archived_at is null for update;
  if target_covenant.id is null or not public.is_workspace_member(target_covenant.workspace_id) then raise exception 'Financing covenant not found.' using errcode = '42501'; end if;
  if target_covenant.version <> expected_version then raise exception 'Financing covenant changed before save. Reload and retry.' using errcode = '40001'; end if;
  command := public.ensure_financing_command(target_covenant.workspace_id, target_covenant.deal_id, target_covenant.financing_structure_id, 'update_financing_covenant', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'covenant_id' then
    select covenant.id, covenant.version, covenant.workspace_id, covenant.deal_id, covenant.financing_structure_id, covenant.status, command.idempotency_key
    into covenant_id, covenant_version, workspace_id, deal_id, financing_structure_id, status, idempotency_key_out
    from public.financing_covenants covenant where covenant.id = (command.result ->> 'covenant_id')::uuid;
    return next;
    return;
  end if;

  update public.financing_covenants covenant set
    metric_key = coalesce(nullif(btrim(safe_input ->> 'metricKey'), ''), covenant.metric_key),
    comparison_operator = coalesce(nullif(btrim(safe_input ->> 'comparisonOperator'), ''), covenant.comparison_operator),
    threshold_value = coalesce(nullif(safe_input ->> 'thresholdValue', '')::numeric, covenant.threshold_value),
    secondary_threshold_value = coalesce(nullif(safe_input ->> 'secondaryThresholdValue', '')::numeric, covenant.secondary_threshold_value),
    status = coalesce(nullif(btrim(safe_input ->> 'status'), ''), covenant.status),
    verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), covenant.verification_state),
    source_classification = coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), covenant.source_classification),
    confidence = coalesce((safe_input ->> 'confidence')::integer, covenant.confidence),
    source_evidence_id = coalesce(nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, covenant.source_evidence_id),
    source_record_id = coalesce(nullif(safe_input ->> 'sourceRecordId', '')::uuid, covenant.source_record_id),
    source_anchor = coalesce(safe_input -> 'sourceAnchor', covenant.source_anchor),
    conflict_state = coalesce(nullif(btrim(safe_input ->> 'conflictState'), ''), covenant.conflict_state),
    governing_source_status = coalesce(nullif(btrim(safe_input ->> 'governingSourceStatus'), ''), covenant.governing_source_status),
    updated_by = current_user_id
  where covenant.id = target_covenant.id
  returning * into target_covenant;

  update public.financing_command_requests set result = jsonb_build_object('covenant_id', target_covenant.id, 'version', target_covenant.version) where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_covenant.workspace_id, target_covenant.deal_id, current_user_id, 'financing.covenant_changed', 'financing_covenant', target_covenant.id, target_covenant.version, 'update_financing_covenant', command.idempotency_key || ':financing.covenant_changed', jsonb_build_object('financing_structure_id', target_covenant.financing_structure_id, 'metric_key', target_covenant.metric_key, 'prior_evaluations_stale_when_version_mismatch', true));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_covenant.workspace_id, target_covenant.deal_id, current_user_id, 'financing.covenant_updated', 'financing_covenants', 'financing_covenant', target_covenant.id, 'update_financing_covenant', command.idempotency_key || ':audit', to_jsonb(target_covenant), array['updated'], jsonb_build_object('prior_evaluations_preserved', true));
  covenant_id := target_covenant.id; covenant_version := target_covenant.version; workspace_id := target_covenant.workspace_id; deal_id := target_covenant.deal_id; financing_structure_id := target_covenant.financing_structure_id; status := target_covenant.status; idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.archive_financing_covenant(target_covenant_id uuid, expected_version integer, archive_reason text, idempotency_key text)
returns table (covenant_id uuid, covenant_version integer, workspace_id uuid, deal_id uuid, financing_structure_id uuid, status text, idempotency_key_out text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_covenant public.financing_covenants%rowtype;
  command public.financing_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to archive financing covenant.' using errcode = '42501'; end if;
  select * into target_covenant from public.financing_covenants where id = target_covenant_id and archived_at is null for update;
  if target_covenant.id is null or not public.is_workspace_member(target_covenant.workspace_id) then raise exception 'Financing covenant not found.' using errcode = '42501'; end if;
  if target_covenant.version <> expected_version then raise exception 'Financing covenant changed before archive. Reload and retry.' using errcode = '40001'; end if;
  command := public.ensure_financing_command(target_covenant.workspace_id, target_covenant.deal_id, target_covenant.financing_structure_id, 'archive_financing_covenant', idempotency_key, jsonb_build_object('covenantId', target_covenant.id, 'expectedVersion', expected_version, 'archiveReason', archive_reason));
  update public.financing_covenants set archived_at = now(), updated_by = current_user_id where id = target_covenant.id returning * into target_covenant;
  update public.financing_command_requests set result = jsonb_build_object('covenant_id', target_covenant.id, 'version', target_covenant.version) where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_covenant.workspace_id, target_covenant.deal_id, current_user_id, 'financing.covenant_changed', 'financing_covenant', target_covenant.id, target_covenant.version, 'archive_financing_covenant', command.idempotency_key || ':financing.covenant_changed', jsonb_build_object('financing_structure_id', target_covenant.financing_structure_id, 'archived', true, 'reason', archive_reason));
  covenant_id := target_covenant.id; covenant_version := target_covenant.version; workspace_id := target_covenant.workspace_id; deal_id := target_covenant.deal_id; financing_structure_id := target_covenant.financing_structure_id; status := target_covenant.status; idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.evaluate_financing_covenants(target_financing_structure_id uuid, target_underwriting_snapshot_id uuid, authoritative_metrics jsonb, idempotency_key text, correlation_id uuid default gen_random_uuid())
returns table (feasibility_result_id uuid, feasibility_status text, feasibility_version integer, failed_covenant_count integer, uncertain_covenant_count integer, unresolved_condition_count integer, blocking_condition_count integer, result_hash text, evaluated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  started_at timestamptz := clock_timestamp();
  current_user_id uuid := auth.uid();
  safe_metrics jsonb := public.safe_event_jsonb(coalesce(authoritative_metrics, '{}'::jsonb));
  target_structure public.financing_structures%rowtype;
  target_snapshot public.underwriting_snapshots%rowtype;
  command public.financing_command_requests%rowtype;
  covenant public.financing_covenants%rowtype;
  binding public.financing_metric_binding_registry%rowtype;
  metric_payload jsonb;
  metric_value numeric;
  metric_status text;
  state text;
  reasons text[];
  evaluation_ids uuid[] := '{}'::uuid[];
  inserted_eval public.financing_covenant_evaluation_results%rowtype;
  inserted_feasibility public.financing_feasibility_results%rowtype;
  now_at timestamptz := now();
  next_version integer;
  unverified_conditions integer;
  conflicted_conditions integer;
  expired_conditions integer;
  expired_covenants integer := 0;
begin
  if current_user_id is null then raise exception 'Authentication required to evaluate financing constraints.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_metrics) <> 'object' then raise exception 'Authoritative metrics must be an object.' using errcode = '22023'; end if;
  select * into target_structure from public.financing_structures where id = target_financing_structure_id and archived_at is null;
  if target_structure.id is null or not public.is_workspace_member(target_structure.workspace_id) then raise exception 'Financing structure not found.' using errcode = '42501'; end if;
  if target_underwriting_snapshot_id is not null then
    select * into target_snapshot from public.underwriting_snapshots where id = target_underwriting_snapshot_id and workspace_id = target_structure.workspace_id and deal_id = target_structure.deal_id;
    if target_snapshot.id is null then raise exception 'Underwriting snapshot not found for this financing structure.' using errcode = '42501'; end if;
  end if;
  command := public.ensure_financing_command(target_structure.workspace_id, target_structure.deal_id, target_structure.id, 'evaluate_financing_covenants', idempotency_key, safe_metrics || jsonb_build_object('underwritingSnapshotId', target_underwriting_snapshot_id));
  if command.result ? 'feasibility_result_id' then
    select result.id, result.status, result.feasibility_version, result.failed_covenant_count, result.uncertain_covenant_count, result.unresolved_condition_count, result.blocking_condition_count, result.result_hash, result.evaluated_at
    into feasibility_result_id, feasibility_status, feasibility_version, failed_covenant_count, uncertain_covenant_count, unresolved_condition_count, blocking_condition_count, result_hash, evaluated_at
    from public.financing_feasibility_results result where result.id = (command.result ->> 'feasibility_result_id')::uuid;
    return next;
    return;
  end if;

  for covenant in
    select * from public.financing_covenants
    where financing_structure_id = target_structure.id and workspace_id = target_structure.workspace_id and archived_at is null
    order by created_at, id
  loop
    select * into binding from public.financing_metric_binding_registry where metric_key = covenant.metric_key;
    metric_payload := coalesce(safe_metrics -> covenant.metric_key, safe_metrics -> binding.formula_id, '{}'::jsonb);
    metric_value := nullif(metric_payload ->> 'value', '')::numeric;
    metric_status := coalesce(nullif(metric_payload ->> 'status', ''), 'missing');
    reasons := array[]::text[];

    if covenant.status = 'superseded' then state := 'superseded'; reasons := array_append(reasons, 'covenant_superseded');
    elsif covenant.status = 'expired' or (covenant.expires_at is not null and covenant.expires_at <= now_at) then state := 'expired'; reasons := array_append(reasons, 'covenant_expired'); expired_covenants := expired_covenants + 1;
    elsif covenant.status = 'not_applicable' then state := 'not_applicable'; reasons := array_append(reasons, 'covenant_not_applicable');
    elsif covenant.metric_key is null then state := 'missing_input'; reasons := array_append(reasons, 'metric_key_missing');
    elsif binding.metric_key is null then state := 'unsupported_metric'; reasons := array_append(reasons, 'metric_not_registered');
    elsif binding.is_available is false then state := 'unsupported_metric'; reasons := array_append(reasons, 'metric_not_produced_by_canonical_underwriting');
    elsif metric_payload = '{}'::jsonb or metric_status = 'missing' then state := 'missing_input'; reasons := array_append(reasons, 'authoritative_metric_missing');
    elsif metric_status not in ('calculated', 'calculated_with_warning') then state := 'uncertain'; reasons := array_append(reasons, 'authoritative_metric_not_final');
    elsif metric_value is null then state := 'missing_input'; reasons := array_append(reasons, 'authoritative_metric_value_missing');
    elsif covenant.conflict_state in ('source_conflict', 'unresolved') or covenant.source_classification = 'conflict' then state := 'uncertain'; reasons := array_append(reasons, 'binding_covenant_conflict');
    elsif covenant.verification_state not in ('lender_provided', 'investor_provided', 'quoted', 'confirmed') then state := 'uncertain'; reasons := array_append(reasons, 'covenant_source_unverified');
    elsif covenant.comparison_operator is null or covenant.threshold_value is null then state := 'missing_input'; reasons := array_append(reasons, 'threshold_missing');
    elsif public.financeiq_compare_threshold(metric_value, covenant.comparison_operator, covenant.threshold_value, covenant.secondary_threshold_value) then state := 'passes'; reasons := array_append(reasons, 'threshold_passed');
    else state := 'fails'; reasons := array_append(reasons, 'threshold_failed');
    end if;

    insert into public.financing_covenant_evaluation_results (
      workspace_id, deal_id, financing_structure_id, covenant_id, covenant_version, underwriting_snapshot_id, underwriting_snapshot_version,
      metric_key, formula_id, authoritative_metric_value, authoritative_metric_status, threshold_value, secondary_threshold_value,
      comparison_operator, evaluation_state, is_hard_constraint, result_hash, stale, reason_codes, correlation_id, execution_duration_ms,
      result_payload, evaluated_by
    )
    values (
      target_structure.workspace_id, target_structure.deal_id, target_structure.id, covenant.id, covenant.version, target_snapshot.id, target_snapshot.snapshot_sequence,
      covenant.metric_key, binding.formula_id, metric_value, metric_status, covenant.threshold_value, covenant.secondary_threshold_value,
      covenant.comparison_operator, state, covenant.is_hard_constraint,
      public.financeiq_requirement_hash(jsonb_build_object('covenant_id', covenant.id, 'covenant_version', covenant.version, 'metric_key', covenant.metric_key, 'value', metric_value, 'threshold', covenant.threshold_value, 'operator', covenant.comparison_operator, 'state', state, 'reasons', reasons)),
      false, reasons, correlation_id, greatest(0, extract(milliseconds from clock_timestamp() - started_at)::integer),
      jsonb_build_object('calculation_authority', 'spec005_underwriting_only', 'metric_source', 'authoritative_underwriting_metric', 'metric_result_hash', metric_payload ->> 'resultHash'),
      current_user_id
    )
    returning * into inserted_eval;
    evaluation_ids := array_append(evaluation_ids, inserted_eval.id);
  end loop;

  select count(*) filter (where condition.status not in ('satisfied', 'waived', 'not_applicable')),
         count(*) filter (where condition.status in ('pending', 'submitted', 'under_review', 'failed', 'disputed', 'unknown')),
         count(*) filter (where condition.verification_state not in ('lender_provided', 'investor_provided', 'quoted', 'confirmed') and condition.status <> 'not_applicable'),
         count(*) filter (where condition.conflict_state in ('source_conflict', 'unresolved') or condition.source_classification = 'conflict'),
         count(*) filter (where condition.status = 'expired' or (condition.expires_at is not null and condition.expires_at <= now_at))
  into unresolved_condition_count, blocking_condition_count, unverified_conditions, conflicted_conditions, expired_conditions
  from public.financing_conditions condition
  where condition.workspace_id = target_structure.workspace_id and condition.financing_structure_id = target_structure.id and condition.archived_at is null;

  select count(*) filter (where eval.evaluation_state = 'fails' and eval.is_hard_constraint),
         count(*) filter (where eval.evaluation_state in ('uncertain', 'missing_input', 'unsupported_metric') and eval.is_hard_constraint)
  into failed_covenant_count, uncertain_covenant_count
  from public.financing_covenant_evaluation_results eval
  where eval.id = any(evaluation_ids);

  next_version := coalesce((select max(result.feasibility_version) from public.financing_feasibility_results result where result.workspace_id = target_structure.workspace_id and result.financing_structure_id = target_structure.id), 0) + 1;
  feasibility_status := case
    when target_structure.status = 'superseded' then 'superseded'
    when target_structure.status = 'expired' or (target_structure.expires_at is not null and target_structure.expires_at <= now_at) then 'expired'
    when failed_covenant_count > 0 then 'not_feasible'
    when uncertain_covenant_count > 0 or unverified_conditions > 0 or conflicted_conditions > 0 then 'uncertain'
    when unresolved_condition_count > 0 then 'feasible_with_conditions'
    else 'feasible'
  end;
  result_hash := public.financeiq_requirement_hash(jsonb_build_object('status', feasibility_status, 'version', next_version, 'evaluations', evaluation_ids, 'failed', failed_covenant_count, 'uncertain', uncertain_covenant_count, 'conditions', unresolved_condition_count, 'blocking', blocking_condition_count));

  insert into public.financing_feasibility_results (
    workspace_id, deal_id, financing_structure_id, financing_structure_version, status, feasibility_version, underwriting_snapshot_id,
    underwriting_snapshot_version, covenant_evaluation_ids, unresolved_condition_count, blocking_condition_count, failed_covenant_count,
    uncertain_covenant_count, unverified_condition_count, unverified_covenant_count, conflicted_requirement_count, expired_requirement_count,
    stale, result_hash, correlation_id, execution_duration_ms, result_payload, evaluated_by
  )
  values (
    target_structure.workspace_id, target_structure.deal_id, target_structure.id, target_structure.version, feasibility_status, next_version, target_snapshot.id,
    target_snapshot.snapshot_sequence, evaluation_ids, unresolved_condition_count, blocking_condition_count, failed_covenant_count,
    uncertain_covenant_count, unverified_conditions, uncertain_covenant_count, conflicted_conditions + uncertain_covenant_count, expired_conditions + expired_covenants,
    false, result_hash, correlation_id, greatest(0, extract(milliseconds from clock_timestamp() - started_at)::integer),
    jsonb_build_object('calculation_authority', 'spec005_underwriting_only', 'condition_count', coalesce((select count(*) from public.financing_conditions c where c.workspace_id = target_structure.workspace_id and c.financing_structure_id = target_structure.id and c.archived_at is null), 0), 'covenant_count', coalesce((select count(*) from public.financing_covenants c where c.workspace_id = target_structure.workspace_id and c.financing_structure_id = target_structure.id and c.archived_at is null), 0)),
    current_user_id
  )
  returning * into inserted_feasibility;

  update public.financing_command_requests set result = jsonb_build_object('feasibility_result_id', inserted_feasibility.id, 'feasibility_version', inserted_feasibility.feasibility_version) where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, correlation_id, payload)
  values (target_structure.workspace_id, target_structure.deal_id, current_user_id, 'financing.constraint_evaluated', 'financing_structure', target_structure.id, target_structure.version, 'evaluate_financing_covenants', command.idempotency_key || ':financing.constraint_evaluated', correlation_id, jsonb_build_object('feasibility_result_id', inserted_feasibility.id, 'evaluation_count', cardinality(evaluation_ids)));
  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, correlation_id, payload)
  values (target_structure.workspace_id, target_structure.deal_id, current_user_id, 'financing.feasibility_changed', 'financing_feasibility_result', inserted_feasibility.id, inserted_feasibility.feasibility_version, 'evaluate_financing_covenants', command.idempotency_key || ':financing.feasibility_changed', correlation_id, jsonb_build_object('status', inserted_feasibility.status, 'financing_structure_id', target_structure.id));
  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_structure.workspace_id, target_structure.deal_id, current_user_id, 'financing.constraint_evaluation_created', 'financing_feasibility_results', 'financing_feasibility_result', inserted_feasibility.id, 'evaluate_financing_covenants', command.idempotency_key || ':audit', to_jsonb(inserted_feasibility), array['evaluated'], jsonb_build_object('prior_valid_results_preserved', true, 'calculation_authority', 'spec005_underwriting_only'));

  feasibility_result_id := inserted_feasibility.id; feasibility_status := inserted_feasibility.status; feasibility_version := inserted_feasibility.feasibility_version; failed_covenant_count := inserted_feasibility.failed_covenant_count; uncertain_covenant_count := inserted_feasibility.uncertain_covenant_count; unresolved_condition_count := inserted_feasibility.unresolved_condition_count; blocking_condition_count := inserted_feasibility.blocking_condition_count; result_hash := inserted_feasibility.result_hash; evaluated_at := inserted_feasibility.evaluated_at;
  return next;
end;
$$;

create or replace view public.financeiq_latest_feasibility_results
with (security_invoker = true)
as
select distinct on (result.workspace_id, result.financing_structure_id)
  result.*
from public.financing_feasibility_results result
order by result.workspace_id, result.financing_structure_id, result.evaluated_at desc, result.id desc;

create or replace function public.load_financing_conditions(target_financing_structure_id uuid)
returns setof public.financing_conditions
language sql
security definer
set search_path = public
as $$
  select condition.*
  from public.financing_conditions condition
  join public.financing_structures structure on structure.id = condition.financing_structure_id
  where condition.financing_structure_id = target_financing_structure_id
    and condition.archived_at is null
    and public.is_workspace_member(condition.workspace_id)
    and public.is_workspace_member(structure.workspace_id)
  order by condition.due_date nulls last, condition.created_at, condition.id;
$$;

create or replace function public.load_financing_covenants(target_financing_structure_id uuid)
returns setof public.financing_covenants
language sql
security definer
set search_path = public
as $$
  select covenant.*
  from public.financing_covenants covenant
  join public.financing_structures structure on structure.id = covenant.financing_structure_id
  where covenant.financing_structure_id = target_financing_structure_id
    and covenant.archived_at is null
    and public.is_workspace_member(covenant.workspace_id)
    and public.is_workspace_member(structure.workspace_id)
  order by covenant.metric_key nulls last, covenant.created_at, covenant.id;
$$;

create or replace function public.load_financing_feasibility(target_financing_structure_id uuid)
returns setof public.financeiq_latest_feasibility_results
language sql
security definer
set search_path = public
as $$
  select latest.*
  from public.financeiq_latest_feasibility_results latest
  where latest.financing_structure_id = target_financing_structure_id
    and public.is_workspace_member(latest.workspace_id);
$$;

create or replace function public.load_financing_constraint_projection(target_financing_structure_id uuid)
returns table (
  financing_structure_id uuid,
  financing_structure_version integer,
  workspace_id uuid,
  deal_id uuid,
  unresolved_condition_count integer,
  blocking_condition_count integer,
  failed_covenant_count integer,
  uncertain_covenant_count integer,
  feasibility_status text,
  feasibility_version integer,
  last_evaluated_at timestamptz,
  stale boolean,
  verification_summary jsonb,
  loaded_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    structure.id,
    structure.version,
    structure.workspace_id,
    structure.deal_id,
    coalesce(latest.unresolved_condition_count, 0),
    coalesce(latest.blocking_condition_count, 0),
    coalesce(latest.failed_covenant_count, 0),
    coalesce(latest.uncertain_covenant_count, 0),
    coalesce(latest.status, 'uncertain'),
    latest.feasibility_version,
    latest.evaluated_at,
    coalesce(latest.stale, false)
      or latest.financing_structure_version is distinct from structure.version
      or exists (
        select 1 from public.financing_covenants covenant
        where covenant.workspace_id = structure.workspace_id
          and covenant.financing_structure_id = structure.id
          and covenant.archived_at is null
          and not exists (
            select 1 from public.financing_covenant_evaluation_results eval
            where eval.workspace_id = covenant.workspace_id
              and eval.covenant_id = covenant.id
              and eval.covenant_version = covenant.version
          )
      ) as stale,
    jsonb_build_object(
      'unverifiedConditionCount', coalesce(latest.unverified_condition_count, 0),
      'unverifiedCovenantCount', coalesce(latest.unverified_covenant_count, 0),
      'conflictedRequirementCount', coalesce(latest.conflicted_requirement_count, 0),
      'expiredRequirementCount', coalesce(latest.expired_requirement_count, 0)
    ),
    now()
  from public.financing_structures structure
  left join public.financeiq_latest_feasibility_results latest
    on latest.workspace_id = structure.workspace_id
   and latest.financing_structure_id = structure.id
  where structure.id = target_financing_structure_id
    and structure.archived_at is null
    and public.is_workspace_member(structure.workspace_id);
$$;

alter table public.financing_condition_type_definitions enable row level security;
alter table public.financing_condition_status_definitions enable row level security;
alter table public.financing_covenant_type_definitions enable row level security;
alter table public.financing_constraint_evaluation_state_definitions enable row level security;
alter table public.financing_feasibility_status_definitions enable row level security;
alter table public.financing_metric_binding_registry enable row level security;
alter table public.financing_conditions enable row level security;
alter table public.financing_condition_versions enable row level security;
alter table public.financing_covenants enable row level security;
alter table public.financing_covenant_versions enable row level security;
alter table public.financing_covenant_evaluation_results enable row level security;
alter table public.financing_feasibility_results enable row level security;

create policy "financing condition type definitions readable" on public.financing_condition_type_definitions for select to authenticated using (true);
create policy "financing condition status definitions readable" on public.financing_condition_status_definitions for select to authenticated using (true);
create policy "financing covenant type definitions readable" on public.financing_covenant_type_definitions for select to authenticated using (true);
create policy "financing constraint state definitions readable" on public.financing_constraint_evaluation_state_definitions for select to authenticated using (true);
create policy "financing feasibility status definitions readable" on public.financing_feasibility_status_definitions for select to authenticated using (true);
create policy "financing metric binding registry readable" on public.financing_metric_binding_registry for select to authenticated using (true);

create policy "financing conditions read workspace members" on public.financing_conditions for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "financing conditions no direct insert" on public.financing_conditions for insert to authenticated with check (false);
create policy "financing conditions no direct update" on public.financing_conditions for update to authenticated using (false) with check (false);
create policy "financing conditions no direct delete" on public.financing_conditions for delete to authenticated using (false);

create policy "financing condition versions read workspace members" on public.financing_condition_versions for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "financing condition versions no direct insert" on public.financing_condition_versions for insert to authenticated with check (false);

create policy "financing covenants read workspace members" on public.financing_covenants for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "financing covenants no direct insert" on public.financing_covenants for insert to authenticated with check (false);
create policy "financing covenants no direct update" on public.financing_covenants for update to authenticated using (false) with check (false);
create policy "financing covenants no direct delete" on public.financing_covenants for delete to authenticated using (false);

create policy "financing covenant versions read workspace members" on public.financing_covenant_versions for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "financing covenant versions no direct insert" on public.financing_covenant_versions for insert to authenticated with check (false);

create policy "financing covenant evaluations read workspace members" on public.financing_covenant_evaluation_results for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "financing covenant evaluations no direct insert" on public.financing_covenant_evaluation_results for insert to authenticated with check (false);
create policy "financing covenant evaluations no direct update" on public.financing_covenant_evaluation_results for update to authenticated using (false) with check (false);
create policy "financing covenant evaluations no direct delete" on public.financing_covenant_evaluation_results for delete to authenticated using (false);

create policy "financing feasibility read workspace members" on public.financing_feasibility_results for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "financing feasibility no direct insert" on public.financing_feasibility_results for insert to authenticated with check (false);
create policy "financing feasibility no direct update" on public.financing_feasibility_results for update to authenticated using (false) with check (false);
create policy "financing feasibility no direct delete" on public.financing_feasibility_results for delete to authenticated using (false);

grant select on public.financing_condition_type_definitions to authenticated;
grant select on public.financing_condition_status_definitions to authenticated;
grant select on public.financing_covenant_type_definitions to authenticated;
grant select on public.financing_constraint_evaluation_state_definitions to authenticated;
grant select on public.financing_feasibility_status_definitions to authenticated;
grant select on public.financing_metric_binding_registry to authenticated;
grant select on public.financing_conditions to authenticated;
grant select on public.financing_condition_versions to authenticated;
grant select on public.financing_covenants to authenticated;
grant select on public.financing_covenant_versions to authenticated;
grant select on public.financing_covenant_evaluation_results to authenticated;
grant select on public.financing_feasibility_results to authenticated;
grant select on public.financeiq_latest_feasibility_results to authenticated;

revoke insert, update, delete on public.financing_conditions from authenticated;
revoke insert, update, delete on public.financing_condition_versions from authenticated;
revoke insert, update, delete on public.financing_covenants from authenticated;
revoke insert, update, delete on public.financing_covenant_versions from authenticated;
revoke insert, update, delete on public.financing_covenant_evaluation_results from authenticated;
revoke insert, update, delete on public.financing_feasibility_results from authenticated;

revoke all on function public.create_financing_condition(uuid, jsonb, text) from public, anon;
revoke all on function public.update_financing_condition(uuid, jsonb, integer, text) from public, anon;
revoke all on function public.archive_financing_condition(uuid, integer, text, text) from public, anon;
revoke all on function public.create_financing_covenant(uuid, jsonb, text) from public, anon;
revoke all on function public.update_financing_covenant(uuid, jsonb, integer, text) from public, anon;
revoke all on function public.archive_financing_covenant(uuid, integer, text, text) from public, anon;
revoke all on function public.evaluate_financing_covenants(uuid, uuid, jsonb, text, uuid) from public, anon;
revoke all on function public.load_financing_conditions(uuid) from public, anon;
revoke all on function public.load_financing_covenants(uuid) from public, anon;
revoke all on function public.load_financing_feasibility(uuid) from public, anon;
revoke all on function public.load_financing_constraint_projection(uuid) from public, anon;

grant execute on function public.create_financing_condition(uuid, jsonb, text) to authenticated;
grant execute on function public.update_financing_condition(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.archive_financing_condition(uuid, integer, text, text) to authenticated;
grant execute on function public.create_financing_covenant(uuid, jsonb, text) to authenticated;
grant execute on function public.update_financing_covenant(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.archive_financing_covenant(uuid, integer, text, text) to authenticated;
grant execute on function public.evaluate_financing_covenants(uuid, uuid, jsonb, text, uuid) to authenticated;
grant execute on function public.load_financing_conditions(uuid) to authenticated;
grant execute on function public.load_financing_covenants(uuid) to authenticated;
grant execute on function public.load_financing_feasibility(uuid) to authenticated;
grant execute on function public.load_financing_constraint_projection(uuid) to authenticated;

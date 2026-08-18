-- Specification 009 Slice 1: Canonical financing structure foundation.
-- FinanceIQ owns financing structures and term records. Specification 005 remains
-- the only authoritative calculation engine; this migration stores no calculated
-- payment, DSCR, LTV, LTC, debt-yield, funding-gap, return, or waterfall output.

create extension if not exists pgcrypto;

create table if not exists public.financing_structure_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.financing_verification_state_definitions (
  state_key text primary key,
  label text not null,
  sort_order integer not null unique,
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.financing_source_classification_definitions (
  classification_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

insert into public.financing_structure_status_definitions (status_key, label, sort_order, is_terminal)
values
  ('draft', 'Draft', 10, false),
  ('scenario', 'Scenario', 20, false),
  ('proposed', 'Proposed', 30, false),
  ('quoted', 'Quoted', 40, false),
  ('application_started', 'Application Started', 50, false),
  ('application_submitted', 'Application Submitted', 60, false),
  ('conditional_approval', 'Conditional Approval', 70, false),
  ('approved', 'Approved', 80, false),
  ('commitment_issued', 'Commitment Issued', 90, false),
  ('clear_to_close', 'Clear to Close', 100, false),
  ('closed', 'Closed', 110, true),
  ('declined', 'Declined', 120, true),
  ('withdrawn', 'Withdrawn', 130, true),
  ('expired', 'Expired', 140, true),
  ('superseded', 'Superseded', 150, true),
  ('refinance_candidate', 'Refinance Candidate', 160, false)
on conflict (status_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_terminal = excluded.is_terminal;

insert into public.financing_verification_state_definitions (state_key, label, sort_order, requires_review)
values
  ('unknown', 'Unknown', 10, false),
  ('unverified', 'Unverified', 20, false),
  ('user_entered_assumption', 'User-entered Assumption', 30, false),
  ('estimated', 'Estimated', 40, false),
  ('proposed', 'Proposed', 50, false),
  ('document_extracted', 'Document Extracted', 60, true),
  ('lender_provided', 'Lender Provided', 70, false),
  ('investor_provided', 'Investor Provided', 80, false),
  ('quoted', 'Quoted', 90, false),
  ('confirmed', 'Confirmed', 100, false),
  ('professional_review_recommended', 'Professional Review Recommended', 110, true),
  ('expired', 'Expired', 120, false),
  ('superseded', 'Superseded', 130, false),
  ('rejected', 'Rejected', 140, true)
on conflict (state_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  requires_review = excluded.requires_review;

insert into public.financing_source_classification_definitions (classification_key, label, sort_order)
values
  ('unknown', 'Unknown', 10),
  ('user_entered_assumption', 'User-entered Assumption', 20),
  ('system_estimate', 'System Estimate', 30),
  ('external_estimate', 'External Estimate', 40),
  ('proposed', 'Proposed', 50),
  ('quoted', 'Quoted', 60),
  ('lender_provided', 'Lender Provided', 70),
  ('investor_provided', 'Investor Provided', 80),
  ('document_extracted', 'Document Extracted', 90),
  ('confirmed_fact', 'Confirmed Fact', 100),
  ('professional_opinion', 'Professional Opinion', 110),
  ('conflict', 'Conflict', 120),
  ('expired', 'Expired', 130),
  ('superseded', 'Superseded', 140)
on conflict (classification_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;

create unique index if not exists idx_evidence_items_workspace_id
  on public.evidence_items(workspace_id, id);

create table if not exists public.financing_structures (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  name text not null,
  purpose text not null default 'acquisition' check (purpose in ('acquisition', 'renovation', 'development', 'refinance', 'disposition', 'operation', 'scenario', 'other')),
  status text not null default 'draft' references public.financing_structure_status_definitions(status_key),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  effective_at timestamptz,
  expires_at timestamptz,
  verification_state text not null default 'unverified' references public.financing_verification_state_definitions(state_key),
  source_classification text not null default 'user_entered_assumption' references public.financing_source_classification_definitions(classification_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  is_active boolean not null default false,
  active_context text not null default 'current_deal' check (active_context in ('current_deal', 'scenario')),
  scenario_id uuid,
  active_underwriting_snapshot_id uuid references public.underwriting_snapshots(id) on delete set null,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  provenance jsonb not null default '{}'::jsonb check (jsonb_typeof(provenance) = 'object'),
  notes text,
  supersedes_financing_structure_id uuid references public.financing_structures(id) on delete restrict,
  superseded_by_financing_structure_id uuid references public.financing_structures(id) on delete set null,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financing_structures_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  constraint financing_structures_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id)
    references public.evidence_items(workspace_id, id),
  constraint financing_structures_name_not_blank check (length(btrim(name)) > 0),
  constraint financing_structures_expiry_after_effective check (expires_at is null or effective_at is null or expires_at > effective_at)
);

create unique index if not exists idx_financing_structures_workspace_id
  on public.financing_structures(workspace_id, id);

create table if not exists public.capital_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  financing_structure_id uuid not null,
  source_type text not null check (source_type in ('debt', 'equity', 'seller_credit', 'seller_note', 'lender_credit', 'grant_incentive', 'insurance_proceeds', 'other')),
  source_classification text not null default 'user_entered_assumption' references public.financing_source_classification_definitions(classification_key),
  provider_label text,
  provider_contact_id uuid references public.contacts(id) on delete set null,
  provider_organization_id uuid references public.organizations(id) on delete set null,
  proposed_amount numeric(14,2) check (proposed_amount is null or proposed_amount >= 0),
  committed_amount numeric(14,2) check (committed_amount is null or committed_amount >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'proposed' check (status in ('draft', 'proposed', 'quoted', 'committed', 'funded', 'declined', 'withdrawn', 'expired', 'superseded')),
  verification_state text not null default 'unverified' references public.financing_verification_state_definitions(state_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  position integer not null default 1 check (position > 0),
  notes text,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint capital_sources_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete cascade,
  constraint capital_sources_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id)
    references public.evidence_items(workspace_id, id),
  constraint capital_sources_provider_present check (
    provider_label is not null or provider_contact_id is not null or provider_organization_id is not null or source_type in ('equity', 'other')
  )
);

create unique index if not exists idx_capital_sources_workspace_id
  on public.capital_sources(workspace_id, id);

create unique index if not exists idx_capital_sources_workspace_structure_id
  on public.capital_sources(workspace_id, financing_structure_id, id);

create table if not exists public.debt_tranches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  financing_structure_id uuid not null,
  capital_source_id uuid,
  label text not null,
  lender_label text,
  lender_contact_id uuid references public.contacts(id) on delete set null,
  lender_organization_id uuid references public.organizations(id) on delete set null,
  principal_amount numeric(14,2) check (principal_amount is null or principal_amount >= 0),
  commitment_amount numeric(14,2) check (commitment_amount is null or commitment_amount >= 0),
  funded_amount numeric(14,2) check (funded_amount is null or funded_amount >= 0),
  rate_type text not null default 'fixed' check (rate_type in ('fixed', 'variable', 'hybrid', 'unknown')),
  stated_rate numeric(9,6) check (stated_rate is null or stated_rate >= 0),
  index_name text,
  margin_rate numeric(9,6) check (margin_rate is null or margin_rate >= 0),
  rate_floor numeric(9,6) check (rate_floor is null or rate_floor >= 0),
  rate_cap numeric(9,6) check (rate_cap is null or rate_cap >= 0),
  amortization_months integer check (amortization_months is null or amortization_months > 0),
  maturity_months integer check (maturity_months is null or maturity_months > 0),
  interest_only_months integer check (interest_only_months is null or interest_only_months >= 0),
  payment_frequency text not null default 'monthly' check (payment_frequency in ('monthly', 'quarterly', 'semiannual', 'annual', 'interest_only_periodic', 'maturity', 'other')),
  has_balloon boolean not null default false,
  points numeric(9,6) check (points is null or points >= 0),
  fees jsonb not null default '[]'::jsonb check (jsonb_typeof(fees) = 'array'),
  prepayment_type text not null default 'unknown' check (prepayment_type in ('none', 'step_down', 'yield_maintenance', 'defeasance', 'open', 'unknown', 'other')),
  prepayment_terms text,
  recourse_type text not null default 'unknown' check (recourse_type in ('full', 'partial', 'non_recourse', 'bad_boy_carveout', 'unknown', 'other')),
  guarantee_terms text,
  collateral_description text,
  draw_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(draw_metadata) = 'object'),
  extension_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(extension_metadata) = 'object'),
  reserve_escrow_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(reserve_escrow_metadata) = 'object'),
  status text not null default 'proposed' check (status in ('draft', 'proposed', 'quoted', 'application_started', 'application_submitted', 'conditional_approval', 'approved', 'commitment_issued', 'clear_to_close', 'closed', 'declined', 'withdrawn', 'expired', 'superseded')),
  verification_state text not null default 'unverified' references public.financing_verification_state_definitions(state_key),
  source_classification text not null default 'user_entered_assumption' references public.financing_source_classification_definitions(classification_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  effective_at timestamptz,
  expires_at timestamptz,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debt_tranches_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete cascade,
  constraint debt_tranches_capital_source_fk foreign key (workspace_id, financing_structure_id, capital_source_id)
    references public.capital_sources(workspace_id, financing_structure_id, id),
  constraint debt_tranches_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id)
    references public.evidence_items(workspace_id, id),
  constraint debt_tranches_label_not_blank check (length(btrim(label)) > 0),
  constraint debt_tranches_expiry_after_effective check (expires_at is null or effective_at is null or expires_at > effective_at),
  constraint debt_tranches_rate_bounds check (rate_cap is null or rate_floor is null or rate_cap >= rate_floor)
);

create table if not exists public.equity_tranches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  financing_structure_id uuid not null,
  capital_source_id uuid,
  label text not null,
  contributor_label text,
  contributor_contact_id uuid references public.contacts(id) on delete set null,
  contributor_organization_id uuid references public.organizations(id) on delete set null,
  contribution_amount numeric(14,2) check (contribution_amount is null or contribution_amount >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  contribution_timing jsonb not null default '{}'::jsonb check (jsonb_typeof(contribution_timing) = 'object'),
  ownership_percentage numeric(9,6) check (ownership_percentage is null or (ownership_percentage >= 0 and ownership_percentage <= 100)),
  control_terms text,
  voting_terms text,
  preferred_return_terms jsonb not null default '{}'::jsonb check (jsonb_typeof(preferred_return_terms) = 'object'),
  waterfall_terms jsonb not null default '{}'::jsonb check (jsonb_typeof(waterfall_terms) = 'object'),
  promote_terms jsonb not null default '{}'::jsonb check (jsonb_typeof(promote_terms) = 'object'),
  distribution_priority integer not null default 1 check (distribution_priority > 0),
  capital_call_terms text,
  dilution_terms text,
  fees jsonb not null default '[]'::jsonb check (jsonb_typeof(fees) = 'array'),
  transfer_terms text,
  removal_terms text,
  buy_sell_terms text,
  status text not null default 'proposed' check (status in ('draft', 'proposed', 'committed', 'funded', 'withdrawn', 'expired', 'superseded')),
  verification_state text not null default 'unverified' references public.financing_verification_state_definitions(state_key),
  source_classification text not null default 'user_entered_assumption' references public.financing_source_classification_definitions(classification_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  effective_at timestamptz,
  expires_at timestamptz,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equity_tranches_structure_fk foreign key (workspace_id, financing_structure_id)
    references public.financing_structures(workspace_id, id) on delete cascade,
  constraint equity_tranches_capital_source_fk foreign key (workspace_id, financing_structure_id, capital_source_id)
    references public.capital_sources(workspace_id, financing_structure_id, id),
  constraint equity_tranches_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id)
    references public.evidence_items(workspace_id, id),
  constraint equity_tranches_label_not_blank check (length(btrim(label)) > 0),
  constraint equity_tranches_expiry_after_effective check (expires_at is null or effective_at is null or expires_at > effective_at)
);

create table if not exists public.financing_structure_versions (
  id uuid primary key default gen_random_uuid(),
  financing_structure_id uuid not null references public.financing_structures(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  change_reason text,
  constraint financing_structure_versions_deal_fk foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id) on delete cascade,
  unique (financing_structure_id, version)
);

create table if not exists public.financing_command_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid,
  financing_structure_id uuid,
  command_name text not null,
  idempotency_key text not null,
  request_hash text not null,
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create unique index if not exists idx_financing_structures_one_active_current
  on public.financing_structures(workspace_id, deal_id, active_context)
  where is_active is true
    and active_context = 'current_deal'
    and archived_at is null
    and status <> 'superseded';

create unique index if not exists idx_financing_structures_one_active_scenario
  on public.financing_structures(workspace_id, deal_id, active_context, scenario_id)
  where is_active is true
    and active_context = 'scenario'
    and scenario_id is not null
    and archived_at is null
    and status <> 'superseded';

create index if not exists idx_financing_structures_workspace_deal_updated
  on public.financing_structures(workspace_id, deal_id, updated_at desc)
  where archived_at is null;

create index if not exists idx_financing_structures_workspace_status
  on public.financing_structures(workspace_id, status, updated_at desc)
  where archived_at is null;

create index if not exists idx_capital_sources_structure
  on public.capital_sources(workspace_id, financing_structure_id, position, updated_at desc)
  where archived_at is null;

create index if not exists idx_debt_tranches_structure
  on public.debt_tranches(workspace_id, financing_structure_id, updated_at desc)
  where archived_at is null;

create index if not exists idx_equity_tranches_structure
  on public.equity_tranches(workspace_id, financing_structure_id, updated_at desc)
  where archived_at is null;

create index if not exists idx_financing_command_requests_created_by
  on public.financing_command_requests(created_by, created_at desc);

drop trigger if exists touch_financing_structures on public.financing_structures;
create trigger touch_financing_structures
before update on public.financing_structures
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_capital_sources on public.capital_sources;
create trigger touch_capital_sources
before update on public.capital_sources
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_debt_tranches on public.debt_tranches;
create trigger touch_debt_tranches
before update on public.debt_tranches
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_equity_tranches on public.equity_tranches;
create trigger touch_equity_tranches
before update on public.equity_tranches
for each row execute function public.touch_versioned_record();

create or replace function public.record_financing_structure_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.name is distinct from new.name
    or old.purpose is distinct from new.purpose
    or old.status is distinct from new.status
    or old.currency is distinct from new.currency
    or old.effective_at is distinct from new.effective_at
    or old.expires_at is distinct from new.expires_at
    or old.verification_state is distinct from new.verification_state
    or old.source_classification is distinct from new.source_classification
    or old.confidence is distinct from new.confidence
    or old.is_active is distinct from new.is_active
    or old.source_evidence_id is distinct from new.source_evidence_id
    or old.source_record_id is distinct from new.source_record_id
    or old.source_anchor is distinct from new.source_anchor
    or old.provenance is distinct from new.provenance
    or old.notes is distinct from new.notes
    or old.archived_at is distinct from new.archived_at
  then
    insert into public.financing_structure_versions (financing_structure_id, workspace_id, deal_id, version, snapshot, changed_by, change_reason)
    values (
      old.id,
      old.workspace_id,
      old.deal_id,
      old.version,
      to_jsonb(old),
      new.updated_by,
      case
        when new.status = 'superseded' and old.status <> 'superseded' then 'superseded'
        when new.archived_at is not null and old.archived_at is null then 'archived'
        when new.is_active is distinct from old.is_active then 'activation_changed'
        else 'updated'
      end
    )
    on conflict (financing_structure_id, version) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists record_financing_structure_version_on_update on public.financing_structures;
create trigger record_financing_structure_version_on_update
after update on public.financing_structures
for each row execute function public.record_financing_structure_version();

alter table public.financing_structure_status_definitions enable row level security;
alter table public.financing_verification_state_definitions enable row level security;
alter table public.financing_source_classification_definitions enable row level security;
alter table public.financing_structures enable row level security;
alter table public.capital_sources enable row level security;
alter table public.debt_tranches enable row level security;
alter table public.equity_tranches enable row level security;
alter table public.financing_structure_versions enable row level security;
alter table public.financing_command_requests enable row level security;

drop policy if exists "financing status definitions readable" on public.financing_structure_status_definitions;
create policy "financing status definitions readable" on public.financing_structure_status_definitions for select to authenticated using (true);

drop policy if exists "financing verification definitions readable" on public.financing_verification_state_definitions;
create policy "financing verification definitions readable" on public.financing_verification_state_definitions for select to authenticated using (true);

drop policy if exists "financing classification definitions readable" on public.financing_source_classification_definitions;
create policy "financing classification definitions readable" on public.financing_source_classification_definitions for select to authenticated using (true);

drop policy if exists "financing structures read workspace members" on public.financing_structures;
create policy "financing structures read workspace members" on public.financing_structures for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "financing structures no direct insert" on public.financing_structures;
create policy "financing structures no direct insert" on public.financing_structures for insert to authenticated with check (false);

drop policy if exists "financing structures no direct update" on public.financing_structures;
create policy "financing structures no direct update" on public.financing_structures for update to authenticated using (false) with check (false);

drop policy if exists "financing structures no direct delete" on public.financing_structures;
create policy "financing structures no direct delete" on public.financing_structures for delete to authenticated using (false);

drop policy if exists "capital sources read workspace members" on public.capital_sources;
create policy "capital sources read workspace members" on public.capital_sources for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "capital sources no direct insert" on public.capital_sources;
create policy "capital sources no direct insert" on public.capital_sources for insert to authenticated with check (false);

drop policy if exists "capital sources no direct update" on public.capital_sources;
create policy "capital sources no direct update" on public.capital_sources for update to authenticated using (false) with check (false);

drop policy if exists "capital sources no direct delete" on public.capital_sources;
create policy "capital sources no direct delete" on public.capital_sources for delete to authenticated using (false);

drop policy if exists "debt tranches read workspace members" on public.debt_tranches;
create policy "debt tranches read workspace members" on public.debt_tranches for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "debt tranches no direct insert" on public.debt_tranches;
create policy "debt tranches no direct insert" on public.debt_tranches for insert to authenticated with check (false);

drop policy if exists "debt tranches no direct update" on public.debt_tranches;
create policy "debt tranches no direct update" on public.debt_tranches for update to authenticated using (false) with check (false);

drop policy if exists "debt tranches no direct delete" on public.debt_tranches;
create policy "debt tranches no direct delete" on public.debt_tranches for delete to authenticated using (false);

drop policy if exists "equity tranches read workspace members" on public.equity_tranches;
create policy "equity tranches read workspace members" on public.equity_tranches for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "equity tranches no direct insert" on public.equity_tranches;
create policy "equity tranches no direct insert" on public.equity_tranches for insert to authenticated with check (false);

drop policy if exists "equity tranches no direct update" on public.equity_tranches;
create policy "equity tranches no direct update" on public.equity_tranches for update to authenticated using (false) with check (false);

drop policy if exists "equity tranches no direct delete" on public.equity_tranches;
create policy "equity tranches no direct delete" on public.equity_tranches for delete to authenticated using (false);

drop policy if exists "financing structure versions read workspace members" on public.financing_structure_versions;
create policy "financing structure versions read workspace members" on public.financing_structure_versions for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "financing structure versions no direct insert" on public.financing_structure_versions;
create policy "financing structure versions no direct insert" on public.financing_structure_versions for insert to authenticated with check (false);

drop policy if exists "financing command requests read creator" on public.financing_command_requests;
create policy "financing command requests read creator" on public.financing_command_requests for select to authenticated
  using (created_by = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "financing command requests no direct insert" on public.financing_command_requests;
create policy "financing command requests no direct insert" on public.financing_command_requests for insert to authenticated with check (false);

create or replace function public.ensure_financing_command(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_financing_structure_id uuid,
  command_name text,
  idempotency_key text,
  request_body jsonb
)
returns public.financing_command_requests
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  request_hash text;
  existing_request public.financing_command_requests%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if cleaned_key is null then
    raise exception 'A retry key is required to safely save financing changes.' using errcode = '22023';
  end if;

  request_hash := md5(
    target_workspace_id::text ||
    coalesce(target_deal_id::text, '') ||
    coalesce(target_financing_structure_id::text, '') ||
    command_name ||
    coalesce(request_body::text, '{}')
  );

  insert into public.financing_command_requests (workspace_id, deal_id, financing_structure_id, command_name, idempotency_key, request_hash, created_by)
  values (target_workspace_id, target_deal_id, target_financing_structure_id, command_name, cleaned_key, request_hash, current_user_id)
  on conflict on constraint financing_command_requests_workspace_id_idempotency_key_key do nothing;

  select *
  into existing_request
  from public.financing_command_requests
  where public.financing_command_requests.workspace_id = target_workspace_id
    and public.financing_command_requests.idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash or existing_request.command_name <> command_name then
    raise exception 'This retry key was already used for a different financing command.' using errcode = '23505';
  end if;

  return existing_request;
end;
$$;

create or replace function public.create_financing_structure(
  target_deal_id uuid,
  structure_input jsonb,
  idempotency_key text
)
returns table (
  financing_structure_id uuid,
  financing_structure_version integer,
  workspace_id uuid,
  deal_id uuid,
  status text,
  is_active boolean,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(structure_input, '{}'::jsonb));
  target_deal public.brix_deals%rowtype;
  command public.financing_command_requests%rowtype;
  inserted_structure public.financing_structures%rowtype;
  requested_status text;
  requested_verification text;
  requested_classification text;
begin
  if current_user_id is null then raise exception 'Authentication required to create financing.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Financing structure input must be an object.' using errcode = '22023'; end if;

  target_deal := public.get_authorized_deal(target_deal_id);
  requested_status := coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'draft');
  requested_verification := coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified');
  requested_classification := coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'user_entered_assumption');

  if not exists (select 1 from public.financing_structure_status_definitions where status_key = requested_status) then raise exception 'Financing status is not available.' using errcode = '22023'; end if;
  if not exists (select 1 from public.financing_verification_state_definitions where state_key = requested_verification) then raise exception 'Financing verification state is not available.' using errcode = '22023'; end if;
  if not exists (select 1 from public.financing_source_classification_definitions where classification_key = requested_classification) then raise exception 'Financing source classification is not available.' using errcode = '22023'; end if;

  command := public.ensure_financing_command(target_deal.workspace_id, target_deal.id, null, 'create_financing_structure', idempotency_key, safe_input);
  if command.result ? 'financing_structure_id' then
    select structure.id, structure.version, structure.workspace_id, structure.deal_id, structure.status, structure.is_active, command.idempotency_key
    into financing_structure_id, financing_structure_version, workspace_id, deal_id, status, is_active, idempotency_key_out
    from public.financing_structures structure
    where structure.id = (command.result ->> 'financing_structure_id')::uuid;
    return next;
    return;
  end if;

  insert into public.financing_structures (
    workspace_id,
    deal_id,
    name,
    purpose,
    status,
    currency,
    effective_at,
    expires_at,
    verification_state,
    source_classification,
    confidence,
    active_context,
    scenario_id,
    source_evidence_id,
    source_record_id,
    source_anchor,
    provenance,
    notes,
    created_by,
    updated_by
  )
  values (
    target_deal.workspace_id,
    target_deal.id,
    coalesce(nullif(btrim(safe_input ->> 'name'), ''), 'Financing option'),
    coalesce(nullif(btrim(safe_input ->> 'purpose'), ''), 'acquisition'),
    requested_status,
    upper(coalesce(nullif(btrim(safe_input ->> 'currency'), ''), 'USD')),
    nullif(safe_input ->> 'effectiveAt', '')::timestamptz,
    nullif(safe_input ->> 'expiresAt', '')::timestamptz,
    requested_verification,
    requested_classification,
    greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
    coalesce(nullif(btrim(safe_input ->> 'activeContext'), ''), 'current_deal'),
    nullif(safe_input ->> 'scenarioId', '')::uuid,
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    nullif(safe_input ->> 'sourceRecordId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
    case when jsonb_typeof(safe_input -> 'provenance') = 'object' then safe_input -> 'provenance' else '{}'::jsonb end,
    nullif(btrim(safe_input ->> 'notes'), ''),
    current_user_id,
    current_user_id
  )
  returning * into inserted_structure;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (
    inserted_structure.workspace_id,
    inserted_structure.deal_id,
    current_user_id,
    'financing.structure_created',
    'financing_structure',
    inserted_structure.id,
    inserted_structure.version,
    'create_financing_structure',
    command.idempotency_key || ':financing.structure_created',
    jsonb_build_object('financing_structure_id', inserted_structure.id, 'financing_structure_version', inserted_structure.version, 'status', inserted_structure.status)
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    inserted_structure.workspace_id,
    inserted_structure.deal_id,
    current_user_id,
    'financing.structure_created',
    'financing_structures',
    'financing_structure',
    inserted_structure.id,
    'create_financing_structure',
    command.idempotency_key || ':audit',
    jsonb_build_object('financing_structure_id', inserted_structure.id, 'version', inserted_structure.version, 'status', inserted_structure.status),
    array['financing_structures'],
    jsonb_build_object('calculation_authority', 'underwriting_engine_only')
  )
  on conflict do nothing;

  update public.financing_command_requests
  set result = jsonb_build_object('financing_structure_id', inserted_structure.id, 'financing_structure_version', inserted_structure.version)
  where id = command.id;

  financing_structure_id := inserted_structure.id;
  financing_structure_version := inserted_structure.version;
  workspace_id := inserted_structure.workspace_id;
  deal_id := inserted_structure.deal_id;
  status := inserted_structure.status;
  is_active := inserted_structure.is_active;
  idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.update_financing_structure(
  target_financing_structure_id uuid,
  structure_input jsonb,
  expected_version integer,
  idempotency_key text
)
returns table (
  financing_structure_id uuid,
  financing_structure_version integer,
  workspace_id uuid,
  deal_id uuid,
  status text,
  is_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(structure_input, '{}'::jsonb));
  existing_structure public.financing_structures%rowtype;
  command public.financing_command_requests%rowtype;
  before_state jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required to update financing.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Financing structure input must be an object.' using errcode = '22023'; end if;

  select * into existing_structure
  from public.financing_structures
  where id = target_financing_structure_id
    and archived_at is null
  for update;
  if existing_structure.id is null then raise exception 'Financing structure is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_structure.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update financing on this Deal.' using errcode = '42501'; end if;

  command := public.ensure_financing_command(existing_structure.workspace_id, existing_structure.deal_id, existing_structure.id, 'update_financing_structure', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'financing_structure_id' then
    select structure.id, structure.version, structure.workspace_id, structure.deal_id, structure.status, structure.is_active
    into financing_structure_id, financing_structure_version, workspace_id, deal_id, status, is_active
    from public.financing_structures structure
    where structure.id = (command.result ->> 'financing_structure_id')::uuid;
    return next;
    return;
  end if;

  if existing_structure.version <> expected_version then
    raise exception 'This financing structure changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  before_state := to_jsonb(existing_structure);

  update public.financing_structures as structure
  set
    name = coalesce(nullif(btrim(safe_input ->> 'name'), ''), structure.name),
    purpose = coalesce(nullif(btrim(safe_input ->> 'purpose'), ''), structure.purpose),
    status = coalesce(nullif(btrim(safe_input ->> 'status'), ''), structure.status),
    currency = coalesce(upper(nullif(btrim(safe_input ->> 'currency'), '')), structure.currency),
    effective_at = case when safe_input ? 'effectiveAt' then nullif(safe_input ->> 'effectiveAt', '')::timestamptz else structure.effective_at end,
    expires_at = case when safe_input ? 'expiresAt' then nullif(safe_input ->> 'expiresAt', '')::timestamptz else structure.expires_at end,
    verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), structure.verification_state),
    source_classification = coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), structure.source_classification),
    confidence = case when safe_input ? 'confidence' then greatest(0, least((safe_input ->> 'confidence')::integer, 100)) else structure.confidence end,
    source_evidence_id = case when safe_input ? 'sourceEvidenceId' then nullif(safe_input ->> 'sourceEvidenceId', '')::uuid else structure.source_evidence_id end,
    source_record_id = case when safe_input ? 'sourceRecordId' then nullif(safe_input ->> 'sourceRecordId', '')::uuid else structure.source_record_id end,
    source_anchor = case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else structure.source_anchor end,
    provenance = case when jsonb_typeof(safe_input -> 'provenance') = 'object' then safe_input -> 'provenance' else structure.provenance end,
    notes = case when safe_input ? 'notes' then nullif(btrim(safe_input ->> 'notes'), '') else structure.notes end,
    updated_by = current_user_id
  where structure.id = target_financing_structure_id
  returning structure.id, structure.version, structure.workspace_id, structure.deal_id, structure.status, structure.is_active
  into financing_structure_id, financing_structure_version, workspace_id, deal_id, status, is_active;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (workspace_id, deal_id, current_user_id, 'financing.terms_changed', 'financing_structure', financing_structure_id, financing_structure_version, 'update_financing_structure', command.idempotency_key || ':financing.terms_changed', jsonb_build_object('financing_structure_id', financing_structure_id, 'financing_structure_version', financing_structure_version))
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (workspace_id, deal_id, current_user_id, 'financing.terms_changed', 'financing_structures', 'financing_structure', financing_structure_id, 'update_financing_structure', command.idempotency_key || ':audit', before_state, jsonb_build_object('financing_structure_id', financing_structure_id, 'version', financing_structure_version, 'status', status), jsonb_build_object('calculation_authority', 'underwriting_engine_only'))
  on conflict do nothing;

  update public.financing_command_requests
  set result = jsonb_build_object('financing_structure_id', financing_structure_id, 'financing_structure_version', financing_structure_version)
  where id = command.id;

  return next;
end;
$$;

create or replace function public.select_active_financing_structure(
  target_financing_structure_id uuid,
  expected_version integer,
  idempotency_key text
)
returns table (
  financing_structure_id uuid,
  financing_structure_version integer,
  workspace_id uuid,
  deal_id uuid,
  previously_active_financing_structure_id uuid,
  active_context text,
  scenario_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_structure public.financing_structures%rowtype;
  prior_active_id uuid;
  command public.financing_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to activate financing.' using errcode = '42501'; end if;

  select * into target_structure
  from public.financing_structures
  where id = target_financing_structure_id
    and archived_at is null
    and status <> 'superseded'
  for update;
  if target_structure.id is null then raise exception 'Financing structure is not available for activation.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_structure.workspace_id, 'deals:manage') then raise exception 'You do not have permission to activate financing on this Deal.' using errcode = '42501'; end if;
  if target_structure.status in ('declined', 'withdrawn', 'expired') then raise exception 'Expired, withdrawn, or declined financing cannot be active.' using errcode = '22023'; end if;

  command := public.ensure_financing_command(target_structure.workspace_id, target_structure.deal_id, target_structure.id, 'select_active_financing_structure', idempotency_key, jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'financing_structure_id' then
    financing_structure_id := (command.result ->> 'financing_structure_id')::uuid;
    financing_structure_version := (command.result ->> 'financing_structure_version')::integer;
    workspace_id := target_structure.workspace_id;
    deal_id := target_structure.deal_id;
    previously_active_financing_structure_id := nullif(command.result ->> 'previously_active_financing_structure_id', '')::uuid;
    active_context := target_structure.active_context;
    scenario_id := target_structure.scenario_id;
    return next;
    return;
  end if;

  if target_structure.version <> expected_version then
    raise exception 'This financing structure changed after you opened it. Reload and try again.' using errcode = '40001';
  end if;

  select active_structure.id into prior_active_id
  from public.financing_structures active_structure
  where active_structure.workspace_id = target_structure.workspace_id
    and active_structure.deal_id = target_structure.deal_id
    and active_structure.active_context = target_structure.active_context
    and coalesce(active_structure.scenario_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(target_structure.scenario_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and active_structure.is_active is true
    and active_structure.archived_at is null
    and active_structure.id <> target_structure.id
  for update;

  update public.financing_structures as structure
  set is_active = false,
      updated_by = current_user_id
  where structure.workspace_id = target_structure.workspace_id
    and structure.deal_id = target_structure.deal_id
    and structure.active_context = target_structure.active_context
    and coalesce(structure.scenario_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(target_structure.scenario_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and structure.is_active is true
    and structure.id <> target_structure.id;

  update public.financing_structures as structure
  set is_active = true,
      updated_by = current_user_id
  where structure.id = target_structure.id
  returning structure.id, structure.version, structure.workspace_id, structure.deal_id, structure.active_context, structure.scenario_id
  into financing_structure_id, financing_structure_version, workspace_id, deal_id, active_context, scenario_id;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (workspace_id, deal_id, current_user_id, 'financing.active_structure_changed', 'financing_structure', financing_structure_id, financing_structure_version, 'select_active_financing_structure', command.idempotency_key || ':financing.active_structure_changed', jsonb_build_object('financing_structure_id', financing_structure_id, 'financing_structure_version', financing_structure_version, 'previously_active_financing_structure_id', prior_active_id, 'active_context', active_context, 'scenario_id', scenario_id))
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (workspace_id, deal_id, current_user_id, 'financing.active_structure_changed', 'financing_structures', 'financing_structure', financing_structure_id, 'select_active_financing_structure', command.idempotency_key || ':audit', jsonb_build_object('financing_structure_id', financing_structure_id, 'previously_active_financing_structure_id', prior_active_id), array['is_active'], jsonb_build_object('calculation_trigger_prepared', true, 'calculation_authority', 'underwriting_engine_only'))
  on conflict do nothing;

  update public.financing_command_requests
  set result = jsonb_build_object('financing_structure_id', financing_structure_id, 'financing_structure_version', financing_structure_version, 'previously_active_financing_structure_id', prior_active_id)
  where id = command.id;

  previously_active_financing_structure_id := prior_active_id;
  return next;
end;
$$;

create or replace function public.archive_financing_structure(
  target_financing_structure_id uuid,
  expected_version integer,
  idempotency_key text,
  archive_reason text default 'user_archive'
)
returns table (
  financing_structure_id uuid,
  financing_structure_version integer,
  workspace_id uuid,
  deal_id uuid,
  status text,
  archived_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  existing_structure public.financing_structures%rowtype;
  command public.financing_command_requests%rowtype;
  reason text := coalesce(nullif(btrim(archive_reason), ''), 'user_archive');
begin
  if current_user_id is null then raise exception 'Authentication required to archive financing.' using errcode = '42501'; end if;
  select * into existing_structure from public.financing_structures where id = target_financing_structure_id for update;
  if existing_structure.id is null then raise exception 'Financing structure is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_structure.workspace_id, 'deals:manage') then raise exception 'You do not have permission to archive financing on this Deal.' using errcode = '42501'; end if;

  command := public.ensure_financing_command(existing_structure.workspace_id, existing_structure.deal_id, existing_structure.id, 'archive_financing_structure', idempotency_key, jsonb_build_object('expectedVersion', expected_version, 'reason', reason));
  if command.result ? 'financing_structure_id' then
    select structure.id, structure.version, structure.workspace_id, structure.deal_id, structure.status, structure.archived_at
    into financing_structure_id, financing_structure_version, workspace_id, deal_id, status, archived_at
    from public.financing_structures structure
    where structure.id = (command.result ->> 'financing_structure_id')::uuid;
    return next;
    return;
  end if;

  if existing_structure.version <> expected_version then raise exception 'This financing structure changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.financing_structures as structure
  set archived_at = coalesce(structure.archived_at, now()),
      is_active = false,
      updated_by = current_user_id
  where structure.id = target_financing_structure_id
  returning structure.id, structure.version, structure.workspace_id, structure.deal_id, structure.status, structure.archived_at
  into financing_structure_id, financing_structure_version, workspace_id, deal_id, status, archived_at;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (workspace_id, deal_id, current_user_id, 'financing.superseded', 'financing_structure', financing_structure_id, financing_structure_version, 'archive_financing_structure', command.idempotency_key || ':financing.superseded', jsonb_build_object('financing_structure_id', financing_structure_id, 'reason', reason, 'archived_at', archived_at))
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (workspace_id, deal_id, current_user_id, 'financing.structure_archived', 'financing_structures', 'financing_structure', financing_structure_id, 'archive_financing_structure', command.idempotency_key || ':audit', jsonb_build_object('financing_structure_id', financing_structure_id, 'archived_at', archived_at), jsonb_build_object('reason', reason))
  on conflict do nothing;

  update public.financing_command_requests
  set result = jsonb_build_object('financing_structure_id', financing_structure_id, 'financing_structure_version', financing_structure_version)
  where id = command.id;

  return next;
end;
$$;

create or replace function public.upsert_capital_source(
  target_financing_structure_id uuid,
  capital_source_input jsonb,
  expected_version integer default null,
  idempotency_key text default null
)
returns table (capital_source_id uuid, capital_source_version integer, financing_structure_id uuid, workspace_id uuid)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(capital_source_input, '{}'::jsonb));
  target_structure public.financing_structures%rowtype;
  existing_source public.capital_sources%rowtype;
  command public.financing_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save financing source.' using errcode = '42501'; end if;
  select * into target_structure from public.financing_structures where id = target_financing_structure_id and archived_at is null for update;
  if target_structure.id is null then raise exception 'Financing structure is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_structure.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update financing on this Deal.' using errcode = '42501'; end if;

  command := public.ensure_financing_command(target_structure.workspace_id, target_structure.deal_id, target_structure.id, 'upsert_capital_source', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result is not null then
    capital_source_id := (command.result ->> 'capital_source_id')::uuid;
    capital_source_version := (command.result ->> 'capital_source_version')::integer;
    financing_structure_id := (command.result ->> 'financing_structure_id')::uuid;
    workspace_id := (command.result ->> 'workspace_id')::uuid;
    return next;
    return;
  end if;

  if nullif(safe_input ->> 'id', '') is not null then
    select * into existing_source
    from public.capital_sources
    where id = (safe_input ->> 'id')::uuid
      and workspace_id = target_structure.workspace_id
      and financing_structure_id = target_structure.id
    for update;
    if existing_source.id is null then raise exception 'Capital source is not available.' using errcode = 'P0002'; end if;
    if expected_version is not null and existing_source.version <> expected_version then raise exception 'This capital source changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

    update public.capital_sources as source
    set source_type = coalesce(nullif(btrim(safe_input ->> 'sourceType'), ''), source.source_type),
        source_classification = coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), source.source_classification),
        provider_label = case when safe_input ? 'providerLabel' then nullif(btrim(safe_input ->> 'providerLabel'), '') else source.provider_label end,
        proposed_amount = case when safe_input ? 'proposedAmount' then nullif(safe_input ->> 'proposedAmount', '')::numeric else source.proposed_amount end,
        committed_amount = case when safe_input ? 'committedAmount' then nullif(safe_input ->> 'committedAmount', '')::numeric else source.committed_amount end,
        currency = coalesce(upper(nullif(btrim(safe_input ->> 'currency'), '')), source.currency),
        status = coalesce(nullif(btrim(safe_input ->> 'status'), ''), source.status),
        verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), source.verification_state),
        confidence = case when safe_input ? 'confidence' then greatest(0, least((safe_input ->> 'confidence')::integer, 100)) else source.confidence end,
        source_evidence_id = case when safe_input ? 'sourceEvidenceId' then nullif(safe_input ->> 'sourceEvidenceId', '')::uuid else source.source_evidence_id end,
        source_record_id = case when safe_input ? 'sourceRecordId' then nullif(safe_input ->> 'sourceRecordId', '')::uuid else source.source_record_id end,
        source_anchor = case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else source.source_anchor end,
        position = coalesce(nullif(safe_input ->> 'position', '')::integer, source.position),
        notes = case when safe_input ? 'notes' then nullif(btrim(safe_input ->> 'notes'), '') else source.notes end,
        updated_by = current_user_id
    where source.id = existing_source.id
    returning source.id, source.version, source.financing_structure_id, source.workspace_id
    into capital_source_id, capital_source_version, financing_structure_id, workspace_id;
  else
    insert into public.capital_sources (
      workspace_id, financing_structure_id, source_type, source_classification, provider_label, proposed_amount, committed_amount,
      currency, status, verification_state, confidence, source_evidence_id, source_record_id, source_anchor, position, notes, created_by, updated_by
    )
    values (
      target_structure.workspace_id, target_structure.id, coalesce(nullif(btrim(safe_input ->> 'sourceType'), ''), 'debt'),
      coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'user_entered_assumption'),
      nullif(btrim(safe_input ->> 'providerLabel'), ''), nullif(safe_input ->> 'proposedAmount', '')::numeric, nullif(safe_input ->> 'committedAmount', '')::numeric,
      upper(coalesce(nullif(btrim(safe_input ->> 'currency'), ''), target_structure.currency)),
      coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'proposed'),
      coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
      greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
      nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
      nullif(safe_input ->> 'sourceRecordId', '')::uuid,
      case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
      coalesce(nullif(safe_input ->> 'position', '')::integer, 1),
      nullif(btrim(safe_input ->> 'notes'), ''),
      current_user_id,
      current_user_id
    )
    returning id, version, financing_structure_id, workspace_id
    into capital_source_id, capital_source_version, financing_structure_id, workspace_id;
  end if;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_structure.workspace_id, target_structure.deal_id, current_user_id, 'financing.terms_changed', 'capital_source', capital_source_id, capital_source_version, 'upsert_capital_source', command.idempotency_key || ':financing.terms_changed', jsonb_build_object('financing_structure_id', target_structure.id, 'capital_source_id', capital_source_id))
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_structure.workspace_id, target_structure.deal_id, current_user_id, 'financing.capital_source_upserted', 'capital_sources', 'capital_source', capital_source_id, 'upsert_capital_source', command.idempotency_key || ':audit', jsonb_build_object('capital_source_id', capital_source_id, 'version', capital_source_version, 'financing_structure_id', target_structure.id), jsonb_build_object('calculation_authority', 'underwriting_engine_only'))
  on conflict do nothing;

  update public.financing_command_requests
  set result = jsonb_build_object('capital_source_id', capital_source_id, 'capital_source_version', capital_source_version, 'financing_structure_id', financing_structure_id, 'workspace_id', workspace_id)
  where id = command.id;

  return next;
end;
$$;

create or replace function public.upsert_debt_tranche(
  target_financing_structure_id uuid,
  debt_tranche_input jsonb,
  expected_version integer default null,
  idempotency_key text default null
)
returns table (debt_tranche_id uuid, debt_tranche_version integer, financing_structure_id uuid, workspace_id uuid)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(debt_tranche_input, '{}'::jsonb));
  target_structure public.financing_structures%rowtype;
  existing_tranche public.debt_tranches%rowtype;
  command public.financing_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save debt terms.' using errcode = '42501'; end if;
  select * into target_structure from public.financing_structures where id = target_financing_structure_id and archived_at is null for update;
  if target_structure.id is null then raise exception 'Financing structure is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_structure.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update financing on this Deal.' using errcode = '42501'; end if;

  command := public.ensure_financing_command(target_structure.workspace_id, target_structure.deal_id, target_structure.id, 'upsert_debt_tranche', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result is not null then
    debt_tranche_id := (command.result ->> 'debt_tranche_id')::uuid;
    debt_tranche_version := (command.result ->> 'debt_tranche_version')::integer;
    financing_structure_id := (command.result ->> 'financing_structure_id')::uuid;
    workspace_id := (command.result ->> 'workspace_id')::uuid;
    return next;
    return;
  end if;

  if nullif(safe_input ->> 'id', '') is not null then
    select * into existing_tranche
    from public.debt_tranches
    where id = (safe_input ->> 'id')::uuid
      and workspace_id = target_structure.workspace_id
      and financing_structure_id = target_structure.id
    for update;
    if existing_tranche.id is null then raise exception 'Debt tranche is not available.' using errcode = 'P0002'; end if;
    if expected_version is not null and existing_tranche.version <> expected_version then raise exception 'This debt tranche changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

    update public.debt_tranches as tranche
    set label = coalesce(nullif(btrim(safe_input ->> 'label'), ''), tranche.label),
        capital_source_id = case when safe_input ? 'capitalSourceId' then nullif(safe_input ->> 'capitalSourceId', '')::uuid else tranche.capital_source_id end,
        lender_label = case when safe_input ? 'lenderLabel' then nullif(btrim(safe_input ->> 'lenderLabel'), '') else tranche.lender_label end,
        principal_amount = case when safe_input ? 'principalAmount' then nullif(safe_input ->> 'principalAmount', '')::numeric else tranche.principal_amount end,
        commitment_amount = case when safe_input ? 'commitmentAmount' then nullif(safe_input ->> 'commitmentAmount', '')::numeric else tranche.commitment_amount end,
        funded_amount = case when safe_input ? 'fundedAmount' then nullif(safe_input ->> 'fundedAmount', '')::numeric else tranche.funded_amount end,
        rate_type = coalesce(nullif(btrim(safe_input ->> 'rateType'), ''), tranche.rate_type),
        stated_rate = case when safe_input ? 'statedRate' then nullif(safe_input ->> 'statedRate', '')::numeric else tranche.stated_rate end,
        margin_rate = case when safe_input ? 'marginRate' then nullif(safe_input ->> 'marginRate', '')::numeric else tranche.margin_rate end,
        amortization_months = case when safe_input ? 'amortizationMonths' then nullif(safe_input ->> 'amortizationMonths', '')::integer else tranche.amortization_months end,
        maturity_months = case when safe_input ? 'maturityMonths' then nullif(safe_input ->> 'maturityMonths', '')::integer else tranche.maturity_months end,
        interest_only_months = case when safe_input ? 'interestOnlyMonths' then nullif(safe_input ->> 'interestOnlyMonths', '')::integer else tranche.interest_only_months end,
        payment_frequency = coalesce(nullif(btrim(safe_input ->> 'paymentFrequency'), ''), tranche.payment_frequency),
        has_balloon = case when safe_input ? 'hasBalloon' then (safe_input ->> 'hasBalloon')::boolean else tranche.has_balloon end,
        points = case when safe_input ? 'points' then nullif(safe_input ->> 'points', '')::numeric else tranche.points end,
        status = coalesce(nullif(btrim(safe_input ->> 'status'), ''), tranche.status),
        verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), tranche.verification_state),
        source_classification = coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), tranche.source_classification),
        confidence = case when safe_input ? 'confidence' then greatest(0, least((safe_input ->> 'confidence')::integer, 100)) else tranche.confidence end,
        source_evidence_id = case when safe_input ? 'sourceEvidenceId' then nullif(safe_input ->> 'sourceEvidenceId', '')::uuid else tranche.source_evidence_id end,
        source_record_id = case when safe_input ? 'sourceRecordId' then nullif(safe_input ->> 'sourceRecordId', '')::uuid else tranche.source_record_id end,
        source_anchor = case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else tranche.source_anchor end,
        updated_by = current_user_id
    where tranche.id = existing_tranche.id
    returning tranche.id, tranche.version, tranche.financing_structure_id, tranche.workspace_id
    into debt_tranche_id, debt_tranche_version, financing_structure_id, workspace_id;
  else
    insert into public.debt_tranches (
      workspace_id, financing_structure_id, capital_source_id, label, lender_label, principal_amount, commitment_amount, funded_amount,
      rate_type, stated_rate, index_name, margin_rate, rate_floor, rate_cap, amortization_months, maturity_months, interest_only_months,
      payment_frequency, has_balloon, points, fees, prepayment_type, prepayment_terms, recourse_type, guarantee_terms, collateral_description,
      draw_metadata, extension_metadata, reserve_escrow_metadata, status, verification_state, source_classification, confidence,
      effective_at, expires_at, source_evidence_id, source_record_id, source_anchor, created_by, updated_by
    )
    values (
      target_structure.workspace_id, target_structure.id, nullif(safe_input ->> 'capitalSourceId', '')::uuid, coalesce(nullif(btrim(safe_input ->> 'label'), ''), 'Debt tranche'),
      nullif(btrim(safe_input ->> 'lenderLabel'), ''), nullif(safe_input ->> 'principalAmount', '')::numeric, nullif(safe_input ->> 'commitmentAmount', '')::numeric, nullif(safe_input ->> 'fundedAmount', '')::numeric,
      coalesce(nullif(btrim(safe_input ->> 'rateType'), ''), 'fixed'), nullif(safe_input ->> 'statedRate', '')::numeric, nullif(btrim(safe_input ->> 'indexName'), ''), nullif(safe_input ->> 'marginRate', '')::numeric, nullif(safe_input ->> 'rateFloor', '')::numeric, nullif(safe_input ->> 'rateCap', '')::numeric,
      nullif(safe_input ->> 'amortizationMonths', '')::integer, nullif(safe_input ->> 'maturityMonths', '')::integer, nullif(safe_input ->> 'interestOnlyMonths', '')::integer,
      coalesce(nullif(btrim(safe_input ->> 'paymentFrequency'), ''), 'monthly'), coalesce((safe_input ->> 'hasBalloon')::boolean, false), nullif(safe_input ->> 'points', '')::numeric,
      case when jsonb_typeof(safe_input -> 'fees') = 'array' then safe_input -> 'fees' else '[]'::jsonb end,
      coalesce(nullif(btrim(safe_input ->> 'prepaymentType'), ''), 'unknown'), nullif(btrim(safe_input ->> 'prepaymentTerms'), ''),
      coalesce(nullif(btrim(safe_input ->> 'recourseType'), ''), 'unknown'), nullif(btrim(safe_input ->> 'guaranteeTerms'), ''), nullif(btrim(safe_input ->> 'collateralDescription'), ''),
      case when jsonb_typeof(safe_input -> 'drawMetadata') = 'object' then safe_input -> 'drawMetadata' else '{}'::jsonb end,
      case when jsonb_typeof(safe_input -> 'extensionMetadata') = 'object' then safe_input -> 'extensionMetadata' else '{}'::jsonb end,
      case when jsonb_typeof(safe_input -> 'reserveEscrowMetadata') = 'object' then safe_input -> 'reserveEscrowMetadata' else '{}'::jsonb end,
      coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'proposed'), coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
      coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'user_entered_assumption'), greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
      nullif(safe_input ->> 'effectiveAt', '')::timestamptz, nullif(safe_input ->> 'expiresAt', '')::timestamptz,
      nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, nullif(safe_input ->> 'sourceRecordId', '')::uuid,
      case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
      current_user_id, current_user_id
    )
    returning id, version, financing_structure_id, workspace_id
    into debt_tranche_id, debt_tranche_version, financing_structure_id, workspace_id;
  end if;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_structure.workspace_id, target_structure.deal_id, current_user_id, 'financing.terms_changed', 'debt_tranche', debt_tranche_id, debt_tranche_version, 'upsert_debt_tranche', command.idempotency_key || ':financing.terms_changed', jsonb_build_object('financing_structure_id', target_structure.id, 'debt_tranche_id', debt_tranche_id, 'calculation_authority', 'underwriting_engine_only'))
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_structure.workspace_id, target_structure.deal_id, current_user_id, 'financing.debt_tranche_upserted', 'debt_tranches', 'debt_tranche', debt_tranche_id, 'upsert_debt_tranche', command.idempotency_key || ':audit', jsonb_build_object('debt_tranche_id', debt_tranche_id, 'version', debt_tranche_version, 'financing_structure_id', target_structure.id), jsonb_build_object('calculation_authority', 'underwriting_engine_only'))
  on conflict do nothing;

  update public.financing_command_requests
  set result = jsonb_build_object('debt_tranche_id', debt_tranche_id, 'debt_tranche_version', debt_tranche_version, 'financing_structure_id', financing_structure_id, 'workspace_id', workspace_id)
  where id = command.id;

  return next;
end;
$$;

create or replace function public.upsert_equity_tranche(
  target_financing_structure_id uuid,
  equity_tranche_input jsonb,
  expected_version integer default null,
  idempotency_key text default null
)
returns table (equity_tranche_id uuid, equity_tranche_version integer, financing_structure_id uuid, workspace_id uuid)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(equity_tranche_input, '{}'::jsonb));
  target_structure public.financing_structures%rowtype;
  existing_tranche public.equity_tranches%rowtype;
  command public.financing_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save equity terms.' using errcode = '42501'; end if;
  select * into target_structure from public.financing_structures where id = target_financing_structure_id and archived_at is null for update;
  if target_structure.id is null then raise exception 'Financing structure is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_structure.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update financing on this Deal.' using errcode = '42501'; end if;

  command := public.ensure_financing_command(target_structure.workspace_id, target_structure.deal_id, target_structure.id, 'upsert_equity_tranche', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result is not null then
    equity_tranche_id := (command.result ->> 'equity_tranche_id')::uuid;
    equity_tranche_version := (command.result ->> 'equity_tranche_version')::integer;
    financing_structure_id := (command.result ->> 'financing_structure_id')::uuid;
    workspace_id := (command.result ->> 'workspace_id')::uuid;
    return next;
    return;
  end if;

  if nullif(safe_input ->> 'id', '') is not null then
    select * into existing_tranche
    from public.equity_tranches
    where id = (safe_input ->> 'id')::uuid
      and workspace_id = target_structure.workspace_id
      and financing_structure_id = target_structure.id
    for update;
    if existing_tranche.id is null then raise exception 'Equity tranche is not available.' using errcode = 'P0002'; end if;
    if expected_version is not null and existing_tranche.version <> expected_version then raise exception 'This equity tranche changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

    update public.equity_tranches as tranche
    set label = coalesce(nullif(btrim(safe_input ->> 'label'), ''), tranche.label),
        capital_source_id = case when safe_input ? 'capitalSourceId' then nullif(safe_input ->> 'capitalSourceId', '')::uuid else tranche.capital_source_id end,
        contributor_label = case when safe_input ? 'contributorLabel' then nullif(btrim(safe_input ->> 'contributorLabel'), '') else tranche.contributor_label end,
        contribution_amount = case when safe_input ? 'contributionAmount' then nullif(safe_input ->> 'contributionAmount', '')::numeric else tranche.contribution_amount end,
        currency = coalesce(upper(nullif(btrim(safe_input ->> 'currency'), '')), tranche.currency),
        contribution_timing = case when jsonb_typeof(safe_input -> 'contributionTiming') = 'object' then safe_input -> 'contributionTiming' else tranche.contribution_timing end,
        ownership_percentage = case when safe_input ? 'ownershipPercentage' then nullif(safe_input ->> 'ownershipPercentage', '')::numeric else tranche.ownership_percentage end,
        control_terms = case when safe_input ? 'controlTerms' then nullif(btrim(safe_input ->> 'controlTerms'), '') else tranche.control_terms end,
        voting_terms = case when safe_input ? 'votingTerms' then nullif(btrim(safe_input ->> 'votingTerms'), '') else tranche.voting_terms end,
        preferred_return_terms = case when jsonb_typeof(safe_input -> 'preferredReturnTerms') = 'object' then safe_input -> 'preferredReturnTerms' else tranche.preferred_return_terms end,
        waterfall_terms = case when jsonb_typeof(safe_input -> 'waterfallTerms') = 'object' then safe_input -> 'waterfallTerms' else tranche.waterfall_terms end,
        promote_terms = case when jsonb_typeof(safe_input -> 'promoteTerms') = 'object' then safe_input -> 'promoteTerms' else tranche.promote_terms end,
        distribution_priority = coalesce(nullif(safe_input ->> 'distributionPriority', '')::integer, tranche.distribution_priority),
        status = coalesce(nullif(btrim(safe_input ->> 'status'), ''), tranche.status),
        verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), tranche.verification_state),
        source_classification = coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), tranche.source_classification),
        confidence = case when safe_input ? 'confidence' then greatest(0, least((safe_input ->> 'confidence')::integer, 100)) else tranche.confidence end,
        source_evidence_id = case when safe_input ? 'sourceEvidenceId' then nullif(safe_input ->> 'sourceEvidenceId', '')::uuid else tranche.source_evidence_id end,
        source_record_id = case when safe_input ? 'sourceRecordId' then nullif(safe_input ->> 'sourceRecordId', '')::uuid else tranche.source_record_id end,
        source_anchor = case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else tranche.source_anchor end,
        updated_by = current_user_id
    where tranche.id = existing_tranche.id
    returning tranche.id, tranche.version, tranche.financing_structure_id, tranche.workspace_id
    into equity_tranche_id, equity_tranche_version, financing_structure_id, workspace_id;
  else
    insert into public.equity_tranches (
      workspace_id, financing_structure_id, capital_source_id, label, contributor_label, contribution_amount, currency,
      contribution_timing, ownership_percentage, control_terms, voting_terms, preferred_return_terms, waterfall_terms, promote_terms,
      distribution_priority, capital_call_terms, dilution_terms, fees, transfer_terms, removal_terms, buy_sell_terms, status,
      verification_state, source_classification, confidence, effective_at, expires_at, source_evidence_id, source_record_id,
      source_anchor, created_by, updated_by
    )
    values (
      target_structure.workspace_id, target_structure.id, nullif(safe_input ->> 'capitalSourceId', '')::uuid, coalesce(nullif(btrim(safe_input ->> 'label'), ''), 'Equity tranche'),
      nullif(btrim(safe_input ->> 'contributorLabel'), ''), nullif(safe_input ->> 'contributionAmount', '')::numeric, upper(coalesce(nullif(btrim(safe_input ->> 'currency'), ''), target_structure.currency)),
      case when jsonb_typeof(safe_input -> 'contributionTiming') = 'object' then safe_input -> 'contributionTiming' else '{}'::jsonb end,
      nullif(safe_input ->> 'ownershipPercentage', '')::numeric, nullif(btrim(safe_input ->> 'controlTerms'), ''), nullif(btrim(safe_input ->> 'votingTerms'), ''),
      case when jsonb_typeof(safe_input -> 'preferredReturnTerms') = 'object' then safe_input -> 'preferredReturnTerms' else '{}'::jsonb end,
      case when jsonb_typeof(safe_input -> 'waterfallTerms') = 'object' then safe_input -> 'waterfallTerms' else '{}'::jsonb end,
      case when jsonb_typeof(safe_input -> 'promoteTerms') = 'object' then safe_input -> 'promoteTerms' else '{}'::jsonb end,
      coalesce(nullif(safe_input ->> 'distributionPriority', '')::integer, 1), nullif(btrim(safe_input ->> 'capitalCallTerms'), ''), nullif(btrim(safe_input ->> 'dilutionTerms'), ''),
      case when jsonb_typeof(safe_input -> 'fees') = 'array' then safe_input -> 'fees' else '[]'::jsonb end,
      nullif(btrim(safe_input ->> 'transferTerms'), ''), nullif(btrim(safe_input ->> 'removalTerms'), ''), nullif(btrim(safe_input ->> 'buySellTerms'), ''),
      coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'proposed'), coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
      coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'user_entered_assumption'), greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
      nullif(safe_input ->> 'effectiveAt', '')::timestamptz, nullif(safe_input ->> 'expiresAt', '')::timestamptz,
      nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, nullif(safe_input ->> 'sourceRecordId', '')::uuid,
      case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
      current_user_id, current_user_id
    )
    returning id, version, financing_structure_id, workspace_id
    into equity_tranche_id, equity_tranche_version, financing_structure_id, workspace_id;
  end if;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_structure.workspace_id, target_structure.deal_id, current_user_id, 'financing.terms_changed', 'equity_tranche', equity_tranche_id, equity_tranche_version, 'upsert_equity_tranche', command.idempotency_key || ':financing.terms_changed', jsonb_build_object('financing_structure_id', target_structure.id, 'equity_tranche_id', equity_tranche_id, 'calculation_authority', 'underwriting_engine_only'))
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_structure.workspace_id, target_structure.deal_id, current_user_id, 'financing.equity_tranche_upserted', 'equity_tranches', 'equity_tranche', equity_tranche_id, 'upsert_equity_tranche', command.idempotency_key || ':audit', jsonb_build_object('equity_tranche_id', equity_tranche_id, 'version', equity_tranche_version, 'financing_structure_id', target_structure.id), jsonb_build_object('calculation_authority', 'underwriting_engine_only'))
  on conflict do nothing;

  update public.financing_command_requests
  set result = jsonb_build_object('equity_tranche_id', equity_tranche_id, 'equity_tranche_version', equity_tranche_version, 'financing_structure_id', financing_structure_id, 'workspace_id', workspace_id)
  where id = command.id;

  return next;
end;
$$;

create or replace function public.list_financing_structure_projection(target_deal_id uuid)
returns table (
  financing_structure_id uuid,
  financing_structure_version integer,
  workspace_id uuid,
  deal_id uuid,
  name text,
  purpose text,
  status text,
  currency text,
  verification_state text,
  source_classification text,
  confidence integer,
  is_active boolean,
  active_context text,
  scenario_id uuid,
  effective_at timestamptz,
  expires_at timestamptz,
  is_expired boolean,
  capital_source_count bigint,
  debt_tranche_count bigint,
  equity_tranche_count bigint,
  updated_at timestamptz,
  loaded_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_deal public.brix_deals%rowtype;
begin
  target_deal := public.authorized_deal_for_read(target_deal_id);

  return query
  select
    structure.id,
    structure.version,
    structure.workspace_id,
    structure.deal_id,
    structure.name,
    structure.purpose,
    structure.status,
    structure.currency,
    structure.verification_state,
    structure.source_classification,
    structure.confidence,
    structure.is_active,
    structure.active_context,
    structure.scenario_id,
    structure.effective_at,
    structure.expires_at,
    structure.expires_at is not null and structure.expires_at <= now(),
    (select count(*) from public.capital_sources source where source.workspace_id = structure.workspace_id and source.financing_structure_id = structure.id and source.archived_at is null),
    (select count(*) from public.debt_tranches tranche where tranche.workspace_id = structure.workspace_id and tranche.financing_structure_id = structure.id and tranche.archived_at is null),
    (select count(*) from public.equity_tranches tranche where tranche.workspace_id = structure.workspace_id and tranche.financing_structure_id = structure.id and tranche.archived_at is null),
    structure.updated_at,
    now()
  from public.financing_structures structure
  where structure.workspace_id = target_deal.workspace_id
    and structure.deal_id = target_deal.id
    and structure.archived_at is null
  order by structure.is_active desc, structure.updated_at desc, structure.id;
end;
$$;

create or replace function public.load_financing_structure_detail(target_financing_structure_id uuid)
returns table (
  record_type text,
  record_id uuid,
  record_version integer,
  workspace_id uuid,
  financing_structure_id uuid,
  deal_id uuid,
  label text,
  status text,
  source_classification text,
  verification_state text,
  payload jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
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
  select 'structure'::text, target_structure.id, target_structure.version, target_structure.workspace_id, target_structure.id, target_structure.deal_id, target_structure.name, target_structure.status, target_structure.source_classification, target_structure.verification_state, to_jsonb(target_structure) - 'workspace_id' - 'deal_id', target_structure.updated_at
  union all
  select 'capital_source'::text, source.id, source.version, source.workspace_id, source.financing_structure_id, target_structure.deal_id, coalesce(source.provider_label, source.source_type), source.status, source.source_classification, source.verification_state, to_jsonb(source) - 'workspace_id' - 'financing_structure_id', source.updated_at
  from public.capital_sources source
  where source.workspace_id = target_structure.workspace_id and source.financing_structure_id = target_structure.id and source.archived_at is null
  union all
  select 'debt_tranche'::text, tranche.id, tranche.version, tranche.workspace_id, tranche.financing_structure_id, target_structure.deal_id, tranche.label, tranche.status, tranche.source_classification, tranche.verification_state, to_jsonb(tranche) - 'workspace_id' - 'financing_structure_id', tranche.updated_at
  from public.debt_tranches tranche
  where tranche.workspace_id = target_structure.workspace_id and tranche.financing_structure_id = target_structure.id and tranche.archived_at is null
  union all
  select 'equity_tranche'::text, tranche.id, tranche.version, tranche.workspace_id, tranche.financing_structure_id, target_structure.deal_id, tranche.label, tranche.status, tranche.source_classification, tranche.verification_state, to_jsonb(tranche) - 'workspace_id' - 'financing_structure_id', tranche.updated_at
  from public.equity_tranches tranche
  where tranche.workspace_id = target_structure.workspace_id and tranche.financing_structure_id = target_structure.id and tranche.archived_at is null;
end;
$$;

grant select on public.financing_structure_status_definitions to authenticated;
grant select on public.financing_verification_state_definitions to authenticated;
grant select on public.financing_source_classification_definitions to authenticated;
grant select on public.financing_structures to authenticated;
grant select on public.capital_sources to authenticated;
grant select on public.debt_tranches to authenticated;
grant select on public.equity_tranches to authenticated;
grant select on public.financing_structure_versions to authenticated;
grant select on public.financing_command_requests to authenticated;

revoke all on function public.record_financing_structure_version() from public;
revoke all on function public.ensure_financing_command(uuid, uuid, uuid, text, text, jsonb) from public;
revoke all on function public.create_financing_structure(uuid, jsonb, text) from public;
revoke all on function public.update_financing_structure(uuid, jsonb, integer, text) from public;
revoke all on function public.select_active_financing_structure(uuid, integer, text) from public;
revoke all on function public.archive_financing_structure(uuid, integer, text, text) from public;
revoke all on function public.upsert_capital_source(uuid, jsonb, integer, text) from public;
revoke all on function public.upsert_debt_tranche(uuid, jsonb, integer, text) from public;
revoke all on function public.upsert_equity_tranche(uuid, jsonb, integer, text) from public;
revoke all on function public.list_financing_structure_projection(uuid) from public;
revoke all on function public.load_financing_structure_detail(uuid) from public;

grant execute on function public.create_financing_structure(uuid, jsonb, text) to authenticated;
grant execute on function public.update_financing_structure(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.select_active_financing_structure(uuid, integer, text) to authenticated;
grant execute on function public.archive_financing_structure(uuid, integer, text, text) to authenticated;
grant execute on function public.upsert_capital_source(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.upsert_debt_tranche(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.upsert_equity_tranche(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.list_financing_structure_projection(uuid) to authenticated;
grant execute on function public.load_financing_structure_detail(uuid) to authenticated;

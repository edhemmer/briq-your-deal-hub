-- Specification 010 Slice 1: Canonical GovernanceIQ foundation.
-- GovernanceIQ stores private-governance identity, documents, findings,
-- conflicts, and source-backed financial inputs. It does not create legal
-- conclusions, AI analysis authority, duplicate Evidence storage, or downstream
-- underwriting/strategy/FinanceIQ mutations in this slice.

create extension if not exists pgcrypto;

create unique index if not exists idx_manual_source_records_workspace_id
  on public.manual_source_records(workspace_id, id);

create table if not exists public.governance_type_definitions (
  type_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.governance_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.governance_document_type_definitions (
  type_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.governance_verification_state_definitions (
  state_key text primary key,
  label text not null,
  sort_order integer not null unique,
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.governance_source_classification_definitions (
  classification_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.governance_finding_category_definitions (
  category_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

insert into public.governance_type_definitions (type_key, label, sort_order)
values
  ('homeowners_association', 'Homeowners Association', 10),
  ('condominium_association', 'Condominium Association', 20),
  ('property_owners_association', 'Property Owners Association', 30),
  ('master_association', 'Master Association', 40),
  ('sub_association', 'Sub-Association', 50),
  ('cooperative', 'Cooperative', 60),
  ('architectural_review', 'Architectural Review', 70),
  ('private_road_maintenance', 'Private Road Maintenance', 80),
  ('shared_utility', 'Shared Utility', 90),
  ('shared_well', 'Shared Well', 100),
  ('shared_septic', 'Shared Septic', 110),
  ('business_park', 'Business Park', 120),
  ('industrial_park', 'Industrial Park', 130),
  ('mixed_use_association', 'Mixed-Use Association', 140),
  ('other_private_governance', 'Other Private Governance', 150)
on conflict (type_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.governance_status_definitions (status_key, label, sort_order, is_terminal, requires_review)
values
  ('suspected', 'Suspected', 10, false, false),
  ('identified', 'Identified', 20, false, false),
  ('documents_requested', 'Documents Requested', 30, false, false),
  ('documents_received', 'Documents Received', 40, false, false),
  ('partial', 'Partial', 50, false, false),
  ('awaiting_verification', 'Awaiting Verification', 60, false, false),
  ('current', 'Current', 70, false, false),
  ('current_with_conflicts', 'Current With Conflicts', 80, false, true),
  ('stale', 'Stale', 90, false, true),
  ('professional_review_required', 'Professional Review Required', 100, false, true),
  ('failed_with_prior_analysis', 'Failed With Prior Analysis', 110, false, true),
  ('superseded', 'Superseded', 120, true, false),
  ('archived', 'Archived', 130, true, false)
on conflict (status_key) do update set label = excluded.label, sort_order = excluded.sort_order, is_terminal = excluded.is_terminal, requires_review = excluded.requires_review;

insert into public.governance_document_type_definitions (type_key, label, sort_order)
values
  ('declaration_ccrs', 'Declaration / CC&Rs', 10),
  ('bylaws', 'Bylaws', 20),
  ('rules_regulations', 'Rules and Regulations', 30),
  ('amendment', 'Amendment', 40),
  ('articles', 'Articles', 50),
  ('budget', 'Budget', 60),
  ('financial_statement', 'Financial Statement', 70),
  ('reserve_study', 'Reserve Study', 80),
  ('insurance_summary', 'Insurance Summary', 90),
  ('insurance_policy', 'Insurance Policy', 100),
  ('meeting_minutes', 'Meeting Minutes', 110),
  ('assessment_notice', 'Assessment Notice', 120),
  ('violation_notice', 'Violation Notice', 130),
  ('resale_certificate', 'Resale Certificate', 140),
  ('disclosure', 'Disclosure', 150),
  ('estoppel', 'Estoppel', 160),
  ('architectural_standard', 'Architectural Standard', 170),
  ('architectural_application', 'Architectural Application', 180),
  ('parking_vehicle_rules', 'Parking / Vehicle Rules', 190),
  ('pet_rules', 'Pet Rules', 200),
  ('leasing_rental_rules', 'Leasing / Rental Rules', 210),
  ('short_term_rental_rules', 'Short-Term Rental Rules', 220),
  ('maintenance_matrix', 'Maintenance Matrix', 230),
  ('litigation_notice', 'Litigation Notice', 240),
  ('management_agreement', 'Management Agreement', 250),
  ('fee_schedule', 'Fee Schedule', 260),
  ('right_of_first_refusal', 'Right of First Refusal', 270),
  ('other', 'Other', 280)
on conflict (type_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.governance_verification_state_definitions (state_key, label, sort_order, requires_review)
values
  ('unknown', 'Unknown', 10, false),
  ('unverified', 'Unverified', 20, false),
  ('user_entered_assumption', 'User-entered Assumption', 30, false),
  ('document_extracted', 'Document Extracted', 40, true),
  ('association_provided', 'Association Provided', 50, false),
  ('manager_provided', 'Manager Provided', 60, false),
  ('professional_review_recommended', 'Professional Review Recommended', 70, true),
  ('confirmed', 'Confirmed', 80, false),
  ('conflicting', 'Conflicting', 90, true),
  ('expired', 'Expired', 100, false),
  ('superseded', 'Superseded', 110, false),
  ('rejected', 'Rejected', 120, true)
on conflict (state_key) do update set label = excluded.label, sort_order = excluded.sort_order, requires_review = excluded.requires_review;

insert into public.governance_source_classification_definitions (classification_key, label, sort_order)
values
  ('unknown', 'Unknown', 10),
  ('user_entered_assumption', 'User-entered Assumption', 20),
  ('system_observation', 'System Observation', 30),
  ('document_extracted', 'Document Extracted', 40),
  ('association_provided', 'Association Provided', 50),
  ('manager_provided', 'Manager Provided', 60),
  ('seller_disclosure', 'Seller Disclosure', 70),
  ('professional_opinion', 'Professional Opinion', 80),
  ('confirmed_fact', 'Confirmed Fact', 90),
  ('conflict', 'Conflict', 100),
  ('expired', 'Expired', 110),
  ('superseded', 'Superseded', 120)
on conflict (classification_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.governance_finding_category_definitions (category_key, label, sort_order)
values
  ('dues', 'Dues', 10), ('assessment', 'Assessment', 20), ('reserve', 'Reserve', 30),
  ('delinquency', 'Delinquency', 40), ('debt', 'Debt', 50), ('budget', 'Budget', 60),
  ('litigation', 'Litigation', 70), ('insurance', 'Insurance', 80), ('rental', 'Rental', 90),
  ('occupancy', 'Occupancy', 100), ('short_term_rental', 'Short-Term Rental', 110),
  ('room_rental', 'Room Rental', 120), ('entity_ownership', 'Entity Ownership', 130),
  ('parking', 'Parking', 140), ('commercial_vehicle', 'Commercial Vehicle', 150),
  ('pickup_truck', 'Pickup Truck', 160), ('trailer', 'Trailer', 170), ('rv', 'RV', 180),
  ('boat', 'Boat', 190), ('towing', 'Towing', 200), ('pet', 'Pet', 210),
  ('residential_use', 'Residential Use', 220), ('commercial_use', 'Commercial Use', 230),
  ('home_business', 'Home Business', 240), ('signage', 'Signage', 250), ('noise', 'Noise', 260),
  ('storage', 'Storage', 270), ('maintenance', 'Maintenance', 280),
  ('architectural_approval', 'Architectural Approval', 290), ('renovation', 'Renovation', 300),
  ('contractor_requirement', 'Contractor Requirement', 310), ('work_hours', 'Work Hours', 320),
  ('materials_colors', 'Materials / Colors', 330), ('landscaping', 'Landscaping', 340),
  ('fencing', 'Fencing', 350), ('solar', 'Solar', 360), ('ev', 'EV', 370), ('antenna', 'Antenna', 380),
  ('structural_work', 'Structural Work', 390), ('transfer', 'Transfer', 400),
  ('right_of_first_refusal', 'Right of First Refusal', 410), ('board_approval', 'Board Approval', 420),
  ('transfer_fee', 'Transfer Fee', 430), ('lender_requirement', 'Lender Requirement', 440),
  ('governance_financing_risk', 'Governance Financing Risk', 450), ('other', 'Other', 460)
on conflict (category_key) do update set label = excluded.label, sort_order = excluded.sort_order;

create table if not exists public.governance_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  property_id uuid,
  deal_id uuid,
  governance_type text not null references public.governance_type_definitions(type_key),
  name text not null,
  legal_name text,
  parent_governance_record_id uuid,
  management_organization_id uuid references public.organizations(id) on delete set null,
  management_contact_id uuid references public.contacts(id) on delete set null,
  status text not null default 'identified' references public.governance_status_definitions(status_key),
  effective_at timestamptz,
  expires_at timestamptz,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  source_classification text not null default 'user_entered_assumption' references public.governance_source_classification_definitions(classification_key),
  verification_state text not null default 'unverified' references public.governance_verification_state_definitions(state_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  supersedes_governance_record_id uuid references public.governance_records(id) on delete restrict,
  superseded_by_governance_record_id uuid references public.governance_records(id) on delete set null,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_records_scope_present check (property_id is not null or deal_id is not null),
  constraint governance_records_name_not_blank check (length(btrim(name)) > 0),
  constraint governance_records_expiry_after_effective check (expires_at is null or effective_at is null or expires_at > effective_at),
  constraint governance_records_deal_fk foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint governance_records_property_fk foreign key (workspace_id, property_id) references public.properties(workspace_id, id) on delete restrict,
  constraint governance_records_management_org_fk foreign key (workspace_id, management_organization_id) references public.organizations(workspace_id, id),
  constraint governance_records_management_contact_fk foreign key (workspace_id, management_contact_id) references public.contacts(workspace_id, id),
  constraint governance_records_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint governance_records_source_record_workspace_fk foreign key (workspace_id, source_record_id) references public.manual_source_records(workspace_id, id)
);

create unique index if not exists idx_governance_records_workspace_id on public.governance_records(workspace_id, id);
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'governance_records_parent_fk'
      and conrelid = 'public.governance_records'::regclass
  ) then
    alter table public.governance_records
      add constraint governance_records_parent_fk
      foreign key (workspace_id, parent_governance_record_id)
      references public.governance_records(workspace_id, id)
      on delete restrict;
  end if;
end $$;
create index if not exists idx_governance_records_workspace_property on public.governance_records(workspace_id, property_id, updated_at desc) where archived_at is null;
create index if not exists idx_governance_records_workspace_deal on public.governance_records(workspace_id, deal_id, updated_at desc) where archived_at is null;
create index if not exists idx_governance_records_parent on public.governance_records(workspace_id, parent_governance_record_id) where parent_governance_record_id is not null;

create table if not exists public.governance_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  evidence_id uuid not null references public.evidence_items(id) on delete restrict,
  document_type text not null references public.governance_document_type_definitions(type_key),
  title text not null,
  adopted_at timestamptz,
  effective_at timestamptz,
  expires_at timestamptz,
  supersedes_governance_document_id uuid references public.governance_documents(id) on delete restrict,
  superseded_by_governance_document_id uuid references public.governance_documents(id) on delete set null,
  hierarchy_rank integer,
  hierarchy_classification text not null default 'hierarchy_uncertain' check (hierarchy_classification in ('candidate_current', 'superseded', 'conflicting', 'hierarchy_uncertain', 'professional_review_required')),
  analysis_state text not null default 'not_started' check (analysis_state in ('not_started', 'processing', 'partial', 'awaiting_verification', 'current', 'failed_with_prior_analysis', 'professional_review_required')),
  source_classification text not null default 'document_extracted' references public.governance_source_classification_definitions(classification_key),
  verification_state text not null default 'unverified' references public.governance_verification_state_definitions(state_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_documents_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_documents_evidence_workspace_fk foreign key (workspace_id, evidence_id) references public.evidence_items(workspace_id, id),
  constraint governance_documents_title_not_blank check (length(btrim(title)) > 0),
  constraint governance_documents_expiry_after_effective check (expires_at is null or effective_at is null or expires_at > effective_at)
);

create unique index if not exists idx_governance_documents_workspace_id on public.governance_documents(workspace_id, id);
create unique index if not exists idx_governance_documents_record_evidence_type on public.governance_documents(workspace_id, governance_record_id, evidence_id, document_type) where archived_at is null;
create index if not exists idx_governance_documents_record on public.governance_documents(workspace_id, governance_record_id, updated_at desc) where archived_at is null;

create table if not exists public.governance_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  governance_document_id uuid,
  deal_id uuid,
  property_id uuid,
  finding_type text not null default 'requirement',
  finding_category text not null references public.governance_finding_category_definitions(category_key),
  summary text not null,
  normalized_value jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_value) = 'object'),
  normalized_requirement text,
  severity text not null default 'unknown' check (severity in ('informational', 'low', 'moderate', 'high', 'critical', 'unknown')),
  impact_type text not null default 'other' check (impact_type in ('cost', 'strategy', 'financing', 'insurance', 'renovation', 'leasing', 'operations', 'parking', 'transfer', 'legal_review', 'deadline', 'documentation', 'other')),
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  source_classification text not null default 'document_extracted' references public.governance_source_classification_definitions(classification_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  verification_state text not null default 'unverified' references public.governance_verification_state_definitions(state_key),
  conflict_state text not null default 'none' check (conflict_state in ('none', 'potential_conflict', 'unresolved_conflict', 'resolved_conflict', 'superseded_conflict')),
  professional_review_recommended boolean not null default false,
  effective_at timestamptz,
  expires_at timestamptz,
  acceptance_state text not null default 'proposed' check (acceptance_state in ('proposed', 'accepted', 'rejected', 'disputed', 'superseded', 'expired')),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  rejected_by uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  supersedes_governance_finding_id uuid references public.governance_findings(id) on delete restrict,
  superseded_by_governance_finding_id uuid references public.governance_findings(id) on delete set null,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_findings_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_findings_document_fk foreign key (workspace_id, governance_document_id) references public.governance_documents(workspace_id, id) on delete restrict,
  constraint governance_findings_deal_fk foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint governance_findings_property_fk foreign key (workspace_id, property_id) references public.properties(workspace_id, id) on delete restrict,
  constraint governance_findings_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint governance_findings_source_record_workspace_fk foreign key (workspace_id, source_record_id) references public.manual_source_records(workspace_id, id),
  constraint governance_findings_summary_not_blank check (length(btrim(summary)) > 0),
  constraint governance_findings_expiry_after_effective check (expires_at is null or effective_at is null or expires_at > effective_at)
);

create unique index if not exists idx_governance_findings_workspace_id on public.governance_findings(workspace_id, id);
create index if not exists idx_governance_findings_record on public.governance_findings(workspace_id, governance_record_id, updated_at desc) where archived_at is null;
create index if not exists idx_governance_findings_category_acceptance on public.governance_findings(workspace_id, finding_category, acceptance_state) where archived_at is null;
create index if not exists idx_governance_findings_deal_property on public.governance_findings(workspace_id, deal_id, property_id) where archived_at is null;

create table if not exists public.governance_conflicts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  category text not null references public.governance_finding_category_definitions(category_key),
  conflict_type text not null check (conflict_type in ('document_hierarchy', 'supersession', 'effective_date', 'amount', 'restriction_language', 'source_disagreement', 'missing_document', 'other')),
  status text not null default 'unresolved' check (status in ('unresolved', 'under_review', 'resolved', 'superseded', 'dismissed')),
  summary text not null,
  source_a_document_id uuid,
  source_a_finding_id uuid,
  source_b_document_id uuid,
  source_b_finding_id uuid,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution text,
  governing_source_candidate jsonb not null default '{}'::jsonb check (jsonb_typeof(governing_source_candidate) = 'object'),
  professional_review_required boolean not null default true,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_conflicts_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_conflicts_source_a_document_fk foreign key (workspace_id, source_a_document_id) references public.governance_documents(workspace_id, id) on delete restrict,
  constraint governance_conflicts_source_b_document_fk foreign key (workspace_id, source_b_document_id) references public.governance_documents(workspace_id, id) on delete restrict,
  constraint governance_conflicts_source_a_finding_fk foreign key (workspace_id, source_a_finding_id) references public.governance_findings(workspace_id, id) on delete restrict,
  constraint governance_conflicts_source_b_finding_fk foreign key (workspace_id, source_b_finding_id) references public.governance_findings(workspace_id, id) on delete restrict,
  constraint governance_conflicts_summary_not_blank check (length(btrim(summary)) > 0)
);

create unique index if not exists idx_governance_conflicts_workspace_id on public.governance_conflicts(workspace_id, id);
create index if not exists idx_governance_conflicts_record_status on public.governance_conflicts(workspace_id, governance_record_id, status, detected_at desc);

create table if not exists public.governance_financials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  governance_document_id uuid,
  period_start date,
  period_end date,
  dues_amount numeric(14,2) check (dues_amount is null or dues_amount >= 0),
  dues_frequency text check (dues_frequency is null or dues_frequency in ('monthly', 'quarterly', 'semiannual', 'annual', 'one_time', 'other')),
  revenue_amount numeric(14,2) check (revenue_amount is null or revenue_amount >= 0),
  expense_amount numeric(14,2) check (expense_amount is null or expense_amount >= 0),
  reserve_balance numeric(14,2) check (reserve_balance is null or reserve_balance >= 0),
  delinquency_amount numeric(14,2) check (delinquency_amount is null or delinquency_amount >= 0),
  delinquency_rate numeric(9,6) check (delinquency_rate is null or (delinquency_rate >= 0 and delinquency_rate <= 1)),
  assessment_amount numeric(14,2) check (assessment_amount is null or assessment_amount >= 0),
  association_debt_amount numeric(14,2) check (association_debt_amount is null or association_debt_amount >= 0),
  insurance_expense_amount numeric(14,2) check (insurance_expense_amount is null or insurance_expense_amount >= 0),
  insurance_deductible_amount numeric(14,2) check (insurance_deductible_amount is null or insurance_deductible_amount >= 0),
  planned_project_amount numeric(14,2) check (planned_project_amount is null or planned_project_amount >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  source_classification text not null default 'document_extracted' references public.governance_source_classification_definitions(classification_key),
  verification_state text not null default 'unverified' references public.governance_verification_state_definitions(state_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_financials_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_financials_document_fk foreign key (workspace_id, governance_document_id) references public.governance_documents(workspace_id, id) on delete restrict,
  constraint governance_financials_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint governance_financials_source_record_workspace_fk foreign key (workspace_id, source_record_id) references public.manual_source_records(workspace_id, id),
  constraint governance_financials_period_order check (period_end is null or period_start is null or period_end >= period_start)
);

create unique index if not exists idx_governance_financials_workspace_id on public.governance_financials(workspace_id, id);
create index if not exists idx_governance_financials_record_period on public.governance_financials(workspace_id, governance_record_id, period_start desc nulls last) where archived_at is null;

create table if not exists public.governance_record_versions (
  id uuid primary key default gen_random_uuid(),
  governance_record_id uuid not null references public.governance_records(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid,
  property_id uuid,
  version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  change_reason text,
  unique (governance_record_id, version)
);

create table if not exists public.governance_document_versions (
  id uuid primary key default gen_random_uuid(),
  governance_document_id uuid not null references public.governance_documents(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  change_reason text,
  unique (governance_document_id, version)
);

create table if not exists public.governance_finding_versions (
  id uuid primary key default gen_random_uuid(),
  governance_finding_id uuid not null references public.governance_findings(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  change_reason text,
  unique (governance_finding_id, version)
);

create table if not exists public.governance_conflict_versions (
  id uuid primary key default gen_random_uuid(),
  governance_conflict_id uuid not null references public.governance_conflicts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  change_reason text,
  unique (governance_conflict_id, version)
);

create table if not exists public.governance_financial_versions (
  id uuid primary key default gen_random_uuid(),
  governance_financial_id uuid not null references public.governance_financials(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  change_reason text,
  unique (governance_financial_id, version)
);

create table if not exists public.governance_command_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid,
  property_id uuid,
  governance_record_id uuid,
  command_name text not null,
  idempotency_key text not null,
  request_hash text not null,
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index if not exists idx_governance_command_requests_created_by on public.governance_command_requests(created_by, created_at desc);

create or replace function public.validate_governance_scope()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.property_id is null and new.deal_id is null then
    raise exception 'Governance must be linked to a Property, Deal, or both.' using errcode = '22023';
  end if;

  if new.deal_id is not null and new.property_id is not null and not exists (
    select 1 from public.deal_properties relationship
    where relationship.workspace_id = new.workspace_id
      and relationship.deal_id = new.deal_id
      and relationship.property_id = new.property_id
      and relationship.inclusion_status = 'active'
  ) then
    raise exception 'Governance Deal and Property must belong to the same canonical Deal scope.' using errcode = '23503';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_governance_records_scope on public.governance_records;
create trigger validate_governance_records_scope
before insert or update on public.governance_records
for each row execute function public.validate_governance_scope();

drop trigger if exists touch_governance_records on public.governance_records;
create trigger touch_governance_records before update on public.governance_records for each row execute function public.touch_versioned_record();
drop trigger if exists touch_governance_documents on public.governance_documents;
create trigger touch_governance_documents before update on public.governance_documents for each row execute function public.touch_versioned_record();
drop trigger if exists touch_governance_findings on public.governance_findings;
create trigger touch_governance_findings before update on public.governance_findings for each row execute function public.touch_versioned_record();
drop trigger if exists touch_governance_conflicts on public.governance_conflicts;
create trigger touch_governance_conflicts before update on public.governance_conflicts for each row execute function public.touch_versioned_record();
drop trigger if exists touch_governance_financials on public.governance_financials;
create trigger touch_governance_financials before update on public.governance_financials for each row execute function public.touch_versioned_record();

create or replace function public.record_governance_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_TABLE_NAME = 'governance_records' then
    insert into public.governance_record_versions (governance_record_id, workspace_id, deal_id, property_id, version, snapshot, changed_by, change_reason)
    values (old.id, old.workspace_id, old.deal_id, old.property_id, old.version, to_jsonb(old), new.updated_by, case when new.archived_at is not null and old.archived_at is null then 'archived' else 'updated' end)
    on conflict (governance_record_id, version) do nothing;
  elsif TG_TABLE_NAME = 'governance_documents' then
    insert into public.governance_document_versions (governance_document_id, workspace_id, governance_record_id, version, snapshot, changed_by, change_reason)
    values (old.id, old.workspace_id, old.governance_record_id, old.version, to_jsonb(old), new.updated_by, case when new.archived_at is not null and old.archived_at is null then 'archived' else 'updated' end)
    on conflict (governance_document_id, version) do nothing;
  elsif TG_TABLE_NAME = 'governance_findings' then
    insert into public.governance_finding_versions (governance_finding_id, workspace_id, governance_record_id, version, snapshot, changed_by, change_reason)
    values (old.id, old.workspace_id, old.governance_record_id, old.version, to_jsonb(old), new.updated_by, coalesce(new.acceptance_state, 'updated'))
    on conflict (governance_finding_id, version) do nothing;
  elsif TG_TABLE_NAME = 'governance_conflicts' then
    insert into public.governance_conflict_versions (governance_conflict_id, workspace_id, governance_record_id, version, snapshot, changed_by, change_reason)
    values (old.id, old.workspace_id, old.governance_record_id, old.version, to_jsonb(old), new.updated_by, coalesce(new.status, 'updated'))
    on conflict (governance_conflict_id, version) do nothing;
  elsif TG_TABLE_NAME = 'governance_financials' then
    insert into public.governance_financial_versions (governance_financial_id, workspace_id, governance_record_id, version, snapshot, changed_by, change_reason)
    values (old.id, old.workspace_id, old.governance_record_id, old.version, to_jsonb(old), new.updated_by, case when new.archived_at is not null and old.archived_at is null then 'archived' else 'updated' end)
    on conflict (governance_financial_id, version) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists record_governance_records_version_on_update on public.governance_records;
create trigger record_governance_records_version_on_update after update on public.governance_records for each row execute function public.record_governance_version();
drop trigger if exists record_governance_documents_version_on_update on public.governance_documents;
create trigger record_governance_documents_version_on_update after update on public.governance_documents for each row execute function public.record_governance_version();
drop trigger if exists record_governance_findings_version_on_update on public.governance_findings;
create trigger record_governance_findings_version_on_update after update on public.governance_findings for each row execute function public.record_governance_version();
drop trigger if exists record_governance_conflicts_version_on_update on public.governance_conflicts;
create trigger record_governance_conflicts_version_on_update after update on public.governance_conflicts for each row execute function public.record_governance_version();
drop trigger if exists record_governance_financials_version_on_update on public.governance_financials;
create trigger record_governance_financials_version_on_update after update on public.governance_financials for each row execute function public.record_governance_version();

create or replace view public.governance_record_projection
with (security_invoker = true)
as
select
  record.id as governance_record_id,
  record.version as governance_record_version,
  record.workspace_id,
  record.deal_id,
  record.property_id,
  record.name,
  record.legal_name,
  record.governance_type,
  record.status,
  count(distinct document.id) filter (where document.archived_at is null) as document_count,
  count(distinct finding.id) filter (where finding.archived_at is null) as finding_count,
  count(distinct conflict.id) filter (where conflict.status in ('unresolved', 'under_review') and conflict.archived_at is null) as unresolved_conflict_count,
  count(distinct finding.id) filter (where finding.acceptance_state = 'accepted' and finding.archived_at is null) as accepted_finding_count,
  count(distinct finding.id) filter (where finding.severity in ('high', 'critical') and finding.archived_at is null) as high_severity_finding_count,
  bool_or(finding.professional_review_recommended) filter (where finding.archived_at is null)
    or record.status = 'professional_review_required'
    or count(distinct conflict.id) filter (where conflict.professional_review_required and conflict.status in ('unresolved', 'under_review') and conflict.archived_at is null) > 0
    as professional_review_required,
  jsonb_build_object(
    'recordVerificationState', record.verification_state,
    'recordSourceClassification', record.source_classification,
    'unverifiedFindingCount', count(distinct finding.id) filter (where finding.verification_state in ('unknown', 'unverified', 'document_extracted') and finding.archived_at is null),
    'conflictedFindingCount', count(distinct finding.id) filter (where finding.conflict_state in ('potential_conflict', 'unresolved_conflict') and finding.archived_at is null)
  ) as verification_summary,
  case
    when count(distinct document.id) filter (where document.archived_at is null) = 0 then 'missing_documents'
    when count(distinct finding.id) filter (where finding.source_evidence_id is not null and finding.archived_at is null) = count(distinct finding.id) filter (where finding.archived_at is null) then 'source_linked'
    else 'partial_sources'
  end as source_completeness,
  case
    when record.archived_at is not null then 'archived'
    when record.status = 'suspected' then 'no_governance_identified'
    when record.status in ('documents_requested') then 'documents_requested'
    when exists (select 1 from public.governance_documents d where d.workspace_id = record.workspace_id and d.governance_record_id = record.id and d.analysis_state = 'processing' and d.archived_at is null) then 'processing'
    when record.status in ('partial') then 'partial'
    when record.status = 'awaiting_verification' then 'awaiting_verification'
    when record.status = 'current_with_conflicts' or count(distinct conflict.id) filter (where conflict.status in ('unresolved', 'under_review') and conflict.archived_at is null) > 0 then 'current_with_conflicts'
    when record.status = 'stale' then 'stale'
    when record.status = 'failed_with_prior_analysis' then 'failed_with_prior_analysis'
    when record.status = 'professional_review_required' then 'professional_review_required'
    when record.status = 'current' then 'current'
    else 'partial'
  end as projection_state,
  record.updated_at,
  now() as loaded_at
from public.governance_records record
left join public.governance_documents document on document.workspace_id = record.workspace_id and document.governance_record_id = record.id
left join public.governance_findings finding on finding.workspace_id = record.workspace_id and finding.governance_record_id = record.id
left join public.governance_conflicts conflict on conflict.workspace_id = record.workspace_id and conflict.governance_record_id = record.id
group by record.id;

create or replace function public.ensure_governance_command(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_property_id uuid,
  target_governance_record_id uuid,
  command_name text,
  idempotency_key text,
  request_body jsonb
)
returns public.governance_command_requests
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  request_hash text;
  existing_request public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely save GovernanceIQ changes.' using errcode = '22023'; end if;

  request_hash := md5(target_workspace_id::text || coalesce(target_deal_id::text, '') || coalesce(target_property_id::text, '') || coalesce(target_governance_record_id::text, '') || command_name || coalesce(request_body::text, '{}'));

  insert into public.governance_command_requests (workspace_id, deal_id, property_id, governance_record_id, command_name, idempotency_key, request_hash, created_by)
  values (target_workspace_id, target_deal_id, target_property_id, target_governance_record_id, command_name, cleaned_key, request_hash, current_user_id)
  on conflict on constraint governance_command_requests_workspace_id_idempotency_key_key do nothing;

  select * into existing_request
  from public.governance_command_requests
  where public.governance_command_requests.workspace_id = target_workspace_id
    and public.governance_command_requests.idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash or existing_request.command_name <> command_name then
    raise exception 'This retry key was already used for a different GovernanceIQ command.' using errcode = '23505';
  end if;

  return existing_request;
end;
$$;

create or replace function public.authorized_governance_record(target_governance_record_id uuid)
returns public.governance_records
language plpgsql
security definer
set search_path = public
as $$
declare
  target_record public.governance_records%rowtype;
begin
  select * into target_record from public.governance_records where id = target_governance_record_id and archived_at is null;
  if target_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.is_workspace_member(target_record.workspace_id) then raise exception 'You do not have access to this GovernanceIQ record.' using errcode = '42501'; end if;
  return target_record;
end;
$$;

create or replace function public.create_governance_record(target_workspace_id uuid, record_input jsonb, idempotency_key text)
returns table (governance_record_id uuid, governance_record_version integer, workspace_id uuid, deal_id uuid, property_id uuid, status text, idempotency_key_out text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(record_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
  inserted_record public.governance_records%rowtype;
  requested_deal_id uuid := nullif(safe_input ->> 'dealId', '')::uuid;
  requested_property_id uuid := nullif(safe_input ->> 'propertyId', '')::uuid;
begin
  if current_user_id is null then raise exception 'Authentication required to create governance.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Governance record input must be an object.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to manage GovernanceIQ in this BRIX workspace.' using errcode = '42501'; end if;

  command := public.ensure_governance_command(target_workspace_id, requested_deal_id, requested_property_id, null, 'create_governance_record', idempotency_key, safe_input);
  if command.result ? 'governance_record_id' then
    select id, version, workspace_id, deal_id, property_id, status, command.idempotency_key into governance_record_id, governance_record_version, workspace_id, deal_id, property_id, status, idempotency_key_out
    from public.governance_records where id = (command.result ->> 'governance_record_id')::uuid;
    return next;
    return;
  end if;

  insert into public.governance_records (
    workspace_id, deal_id, property_id, governance_type, name, legal_name, parent_governance_record_id,
    management_organization_id, management_contact_id, status, effective_at, expires_at, source_evidence_id,
    source_record_id, source_anchor, source_classification, verification_state, confidence, created_by, updated_by
  )
  values (
    target_workspace_id,
    requested_deal_id,
    requested_property_id,
    coalesce(nullif(btrim(safe_input ->> 'governanceType'), ''), 'other_private_governance'),
    coalesce(nullif(btrim(safe_input ->> 'name'), ''), 'Private governance record'),
    nullif(btrim(safe_input ->> 'legalName'), ''),
    nullif(safe_input ->> 'parentGovernanceRecordId', '')::uuid,
    nullif(safe_input ->> 'managementOrganizationId', '')::uuid,
    nullif(safe_input ->> 'managementContactId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'identified'),
    nullif(safe_input ->> 'effectiveAt', '')::timestamptz,
    nullif(safe_input ->> 'expiresAt', '')::timestamptz,
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    nullif(safe_input ->> 'sourceRecordId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
    coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'user_entered_assumption'),
    coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
    greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
    current_user_id,
    current_user_id
  )
  returning * into inserted_record;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (inserted_record.workspace_id, inserted_record.deal_id, inserted_record.property_id, current_user_id, 'governance.record_created', 'governance_record', inserted_record.id, inserted_record.version, 'create_governance_record', command.idempotency_key || ':governance.record_created', jsonb_build_object('governance_record_id', inserted_record.id, 'governance_record_version', inserted_record.version, 'status', inserted_record.status))
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (inserted_record.workspace_id, inserted_record.deal_id, inserted_record.property_id, current_user_id, 'governance.record_created', 'governance_records', 'governance_record', inserted_record.id, 'create_governance_record', command.idempotency_key || ':audit', jsonb_build_object('governance_record_id', inserted_record.id, 'version', inserted_record.version, 'status', inserted_record.status), array['governance_records'], jsonb_build_object('legal_conclusion_authority', false, 'downstream_mutation', false))
  on conflict do nothing;

  update public.governance_command_requests set result = jsonb_build_object('governance_record_id', inserted_record.id, 'governance_record_version', inserted_record.version) where id = command.id;

  governance_record_id := inserted_record.id;
  governance_record_version := inserted_record.version;
  workspace_id := inserted_record.workspace_id;
  deal_id := inserted_record.deal_id;
  property_id := inserted_record.property_id;
  status := inserted_record.status;
  idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.update_governance_record(target_governance_record_id uuid, record_input jsonb, expected_version integer, idempotency_key text)
returns table (governance_record_id uuid, governance_record_version integer, workspace_id uuid, deal_id uuid, property_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(record_input, '{}'::jsonb));
  existing_record public.governance_records%rowtype;
  command public.governance_command_requests%rowtype;
  before_state jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required to update governance.' using errcode = '42501'; end if;
  select * into existing_record from public.governance_records where id = target_governance_record_id and archived_at is null for update;
  if existing_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update GovernanceIQ.' using errcode = '42501'; end if;

  command := public.ensure_governance_command(existing_record.workspace_id, existing_record.deal_id, existing_record.property_id, existing_record.id, 'update_governance_record', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'governance_record_id' then
    select id, version, workspace_id, deal_id, property_id, status into governance_record_id, governance_record_version, workspace_id, deal_id, property_id, status from public.governance_records where id = (command.result ->> 'governance_record_id')::uuid;
    return next;
    return;
  end if;
  if existing_record.version <> expected_version then raise exception 'This governance record changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  before_state := to_jsonb(existing_record);

  update public.governance_records as record
  set governance_type = coalesce(nullif(btrim(safe_input ->> 'governanceType'), ''), record.governance_type),
      name = coalesce(nullif(btrim(safe_input ->> 'name'), ''), record.name),
      legal_name = case when safe_input ? 'legalName' then nullif(btrim(safe_input ->> 'legalName'), '') else record.legal_name end,
      status = coalesce(nullif(btrim(safe_input ->> 'status'), ''), record.status),
      management_organization_id = case when safe_input ? 'managementOrganizationId' then nullif(safe_input ->> 'managementOrganizationId', '')::uuid else record.management_organization_id end,
      management_contact_id = case when safe_input ? 'managementContactId' then nullif(safe_input ->> 'managementContactId', '')::uuid else record.management_contact_id end,
      effective_at = case when safe_input ? 'effectiveAt' then nullif(safe_input ->> 'effectiveAt', '')::timestamptz else record.effective_at end,
      expires_at = case when safe_input ? 'expiresAt' then nullif(safe_input ->> 'expiresAt', '')::timestamptz else record.expires_at end,
      source_evidence_id = case when safe_input ? 'sourceEvidenceId' then nullif(safe_input ->> 'sourceEvidenceId', '')::uuid else record.source_evidence_id end,
      source_record_id = case when safe_input ? 'sourceRecordId' then nullif(safe_input ->> 'sourceRecordId', '')::uuid else record.source_record_id end,
      source_anchor = case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else record.source_anchor end,
      source_classification = coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), record.source_classification),
      verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), record.verification_state),
      confidence = case when safe_input ? 'confidence' then greatest(0, least((safe_input ->> 'confidence')::integer, 100)) else record.confidence end,
      updated_by = current_user_id
  where record.id = existing_record.id
  returning id, version, workspace_id, deal_id, property_id, status into governance_record_id, governance_record_version, workspace_id, deal_id, property_id, status;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (workspace_id, deal_id, property_id, current_user_id, 'governance.record_updated', 'governance_record', governance_record_id, governance_record_version, 'update_governance_record', command.idempotency_key || ':governance.record_updated', jsonb_build_object('governance_record_id', governance_record_id, 'governance_record_version', governance_record_version))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (workspace_id, deal_id, property_id, current_user_id, 'governance.record_updated', 'governance_records', 'governance_record', governance_record_id, 'update_governance_record', command.idempotency_key || ':audit', before_state, jsonb_build_object('governance_record_id', governance_record_id, 'version', governance_record_version), jsonb_build_object('downstream_mutation', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_record_id', governance_record_id, 'governance_record_version', governance_record_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.archive_governance_record(target_governance_record_id uuid, expected_version integer, idempotency_key text, archive_reason text default 'user_archive')
returns table (governance_record_id uuid, governance_record_version integer, workspace_id uuid, deal_id uuid, property_id uuid, status text, archived_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  existing_record public.governance_records%rowtype;
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to archive governance.' using errcode = '42501'; end if;
  select * into existing_record from public.governance_records where id = target_governance_record_id for update;
  if existing_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to archive GovernanceIQ.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(existing_record.workspace_id, existing_record.deal_id, existing_record.property_id, existing_record.id, 'archive_governance_record', idempotency_key, jsonb_build_object('expectedVersion', expected_version, 'reason', archive_reason));
  if command.result ? 'governance_record_id' then
    select id, version, workspace_id, deal_id, property_id, status, archived_at into governance_record_id, governance_record_version, workspace_id, deal_id, property_id, status, archived_at from public.governance_records where id = (command.result ->> 'governance_record_id')::uuid;
    return next;
    return;
  end if;
  if existing_record.version <> expected_version then raise exception 'This governance record changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.governance_records as record
  set archived_at = coalesce(record.archived_at, now()), status = 'archived', updated_by = current_user_id
  where record.id = existing_record.id
  returning id, version, workspace_id, deal_id, property_id, status, archived_at into governance_record_id, governance_record_version, workspace_id, deal_id, property_id, status, archived_at;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (workspace_id, deal_id, property_id, current_user_id, 'governance.record_archived', 'governance_record', governance_record_id, governance_record_version, 'archive_governance_record', command.idempotency_key || ':governance.record_archived', jsonb_build_object('governance_record_id', governance_record_id, 'governance_record_version', governance_record_version, 'reason', archive_reason))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (workspace_id, deal_id, property_id, current_user_id, 'governance.record_archived', 'governance_records', 'governance_record', governance_record_id, 'archive_governance_record', command.idempotency_key || ':audit', to_jsonb(existing_record), jsonb_build_object('status', status, 'archived_at', archived_at), jsonb_build_object('reason', archive_reason, 'downstream_mutation', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_record_id', governance_record_id, 'governance_record_version', governance_record_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.link_governance_document(target_governance_record_id uuid, document_input jsonb, idempotency_key text)
returns table (governance_document_id uuid, governance_document_version integer, governance_record_id uuid, workspace_id uuid, evidence_id uuid, document_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(document_input, '{}'::jsonb));
  target_record public.governance_records%rowtype;
  command public.governance_command_requests%rowtype;
  inserted_document public.governance_documents%rowtype;
  requested_evidence_id uuid := nullif(safe_input ->> 'evidenceId', '')::uuid;
  requested_document_type text := coalesce(nullif(btrim(safe_input ->> 'documentType'), ''), 'other');
begin
  if current_user_id is null then raise exception 'Authentication required to link governance documents.' using errcode = '42501'; end if;
  select * into target_record from public.governance_records where id = target_governance_record_id and archived_at is null for update;
  if target_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to link GovernanceIQ documents.' using errcode = '42501'; end if;

  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'link_governance_document', idempotency_key, safe_input);
  if command.result ? 'governance_document_id' then
    select id, version, governance_record_id, workspace_id, evidence_id, document_type into governance_document_id, governance_document_version, governance_record_id, workspace_id, evidence_id, document_type from public.governance_documents where id = (command.result ->> 'governance_document_id')::uuid;
    return next;
    return;
  end if;

  select * into inserted_document
  from public.governance_documents
  where workspace_id = target_record.workspace_id
    and governance_record_id = target_record.id
    and evidence_id = requested_evidence_id
    and document_type = requested_document_type
    and archived_at is null
  for update;

  if inserted_document.id is null then
    insert into public.governance_documents (
      workspace_id, governance_record_id, evidence_id, document_type, title, adopted_at, effective_at, expires_at,
      supersedes_governance_document_id, hierarchy_rank, hierarchy_classification, analysis_state,
      source_classification, verification_state, confidence, created_by, updated_by
    )
    values (
      target_record.workspace_id,
      target_record.id,
      requested_evidence_id,
      requested_document_type,
      coalesce(nullif(btrim(safe_input ->> 'title'), ''), 'Governance document'),
      nullif(safe_input ->> 'adoptedAt', '')::timestamptz,
      nullif(safe_input ->> 'effectiveAt', '')::timestamptz,
      nullif(safe_input ->> 'expiresAt', '')::timestamptz,
      nullif(safe_input ->> 'supersedesGovernanceDocumentId', '')::uuid,
      nullif(safe_input ->> 'hierarchyRank', '')::integer,
      coalesce(nullif(btrim(safe_input ->> 'hierarchyClassification'), ''), 'hierarchy_uncertain'),
      coalesce(nullif(btrim(safe_input ->> 'analysisState'), ''), 'not_started'),
      coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'document_extracted'),
      coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
      greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
      current_user_id,
      current_user_id
    )
    returning * into inserted_document;
  end if;

  update public.governance_records set status = case when status in ('suspected', 'identified', 'documents_requested') then 'documents_received' else status end, updated_by = current_user_id where id = target_record.id;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_received', 'governance_document', inserted_document.id, inserted_document.version, 'link_governance_document', command.idempotency_key || ':governance.document_received', jsonb_build_object('governance_record_id', target_record.id, 'governance_document_id', inserted_document.id, 'evidence_id', inserted_document.evidence_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_received', 'governance_documents', 'governance_document', inserted_document.id, 'link_governance_document', command.idempotency_key || ':audit', jsonb_build_object('governance_document_id', inserted_document.id, 'evidence_id', inserted_document.evidence_id), array['governance_documents'], jsonb_build_object('evidence_storage_reused', true))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_document_id', inserted_document.id, 'governance_document_version', inserted_document.version) where id = command.id;

  governance_document_id := inserted_document.id;
  governance_document_version := inserted_document.version;
  governance_record_id := inserted_document.governance_record_id;
  workspace_id := inserted_document.workspace_id;
  evidence_id := inserted_document.evidence_id;
  document_type := inserted_document.document_type;
  return next;
end;
$$;

create or replace function public.update_governance_document(target_governance_document_id uuid, document_input jsonb, expected_version integer, idempotency_key text)
returns table (governance_document_id uuid, governance_document_version integer, governance_record_id uuid, workspace_id uuid, evidence_id uuid, document_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(document_input, '{}'::jsonb));
  existing_document public.governance_documents%rowtype;
  target_record public.governance_records%rowtype;
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to update governance documents.' using errcode = '42501'; end if;
  select * into existing_document from public.governance_documents where id = target_governance_document_id and archived_at is null for update;
  if existing_document.id is null then raise exception 'Governance document is not available.' using errcode = 'P0002'; end if;
  select * into target_record from public.governance_records where id = existing_document.governance_record_id and archived_at is null;
  if target_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_document.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update GovernanceIQ documents.' using errcode = '42501'; end if;

  command := public.ensure_governance_command(existing_document.workspace_id, target_record.deal_id, target_record.property_id, existing_document.governance_record_id, 'update_governance_document', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'governance_document_id' then
    select id, version, governance_record_id, workspace_id, evidence_id, document_type into governance_document_id, governance_document_version, governance_record_id, workspace_id, evidence_id, document_type
    from public.governance_documents where id = (command.result ->> 'governance_document_id')::uuid;
    return next;
    return;
  end if;
  if existing_document.version <> expected_version then raise exception 'This governance document changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.governance_documents as document
  set document_type = coalesce(nullif(btrim(safe_input ->> 'documentType'), ''), document.document_type),
      title = coalesce(nullif(btrim(safe_input ->> 'title'), ''), document.title),
      adopted_at = case when safe_input ? 'adoptedAt' then nullif(safe_input ->> 'adoptedAt', '')::timestamptz else document.adopted_at end,
      effective_at = case when safe_input ? 'effectiveAt' then nullif(safe_input ->> 'effectiveAt', '')::timestamptz else document.effective_at end,
      expires_at = case when safe_input ? 'expiresAt' then nullif(safe_input ->> 'expiresAt', '')::timestamptz else document.expires_at end,
      supersedes_governance_document_id = case when safe_input ? 'supersedesGovernanceDocumentId' then nullif(safe_input ->> 'supersedesGovernanceDocumentId', '')::uuid else document.supersedes_governance_document_id end,
      hierarchy_rank = case when safe_input ? 'hierarchyRank' then nullif(safe_input ->> 'hierarchyRank', '')::integer else document.hierarchy_rank end,
      hierarchy_classification = coalesce(nullif(btrim(safe_input ->> 'hierarchyClassification'), ''), document.hierarchy_classification),
      analysis_state = coalesce(nullif(btrim(safe_input ->> 'analysisState'), ''), document.analysis_state),
      source_classification = coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), document.source_classification),
      verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), document.verification_state),
      confidence = case when safe_input ? 'confidence' then greatest(0, least((safe_input ->> 'confidence')::integer, 100)) else document.confidence end,
      updated_by = current_user_id
  where document.id = existing_document.id
  returning id, version, governance_record_id, workspace_id, evidence_id, document_type into governance_document_id, governance_document_version, governance_record_id, workspace_id, evidence_id, document_type;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_document.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_updated', 'governance_document', governance_document_id, governance_document_version, 'update_governance_document', command.idempotency_key || ':governance.document_updated', jsonb_build_object('governance_record_id', governance_record_id, 'governance_document_id', governance_document_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_document.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_updated', 'governance_documents', 'governance_document', governance_document_id, 'update_governance_document', command.idempotency_key || ':audit', to_jsonb(existing_document), jsonb_build_object('governance_document_id', governance_document_id, 'version', governance_document_version), jsonb_build_object('evidence_storage_reused', true))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_document_id', governance_document_id, 'governance_document_version', governance_document_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.upsert_governance_finding(target_governance_record_id uuid, finding_input jsonb, expected_version integer default null, idempotency_key text default null)
returns table (governance_finding_id uuid, governance_finding_version integer, governance_record_id uuid, workspace_id uuid, acceptance_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(finding_input, '{}'::jsonb));
  target_record public.governance_records%rowtype;
  existing_finding public.governance_findings%rowtype;
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save governance findings.' using errcode = '42501'; end if;
  select * into target_record from public.governance_records where id = target_governance_record_id and archived_at is null for update;
  if target_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save GovernanceIQ findings.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'upsert_governance_finding', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'governance_finding_id' then
    select id, version, governance_record_id, workspace_id, acceptance_state into governance_finding_id, governance_finding_version, governance_record_id, workspace_id, acceptance_state from public.governance_findings where id = (command.result ->> 'governance_finding_id')::uuid;
    return next;
    return;
  end if;

  if nullif(safe_input ->> 'id', '') is not null then
    select * into existing_finding from public.governance_findings where id = (safe_input ->> 'id')::uuid and workspace_id = target_record.workspace_id and governance_record_id = target_record.id for update;
    if existing_finding.id is null then raise exception 'Governance finding is not available.' using errcode = 'P0002'; end if;
    if expected_version is not null and existing_finding.version <> expected_version then raise exception 'This governance finding changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
    update public.governance_findings as finding
    set governance_document_id = case when safe_input ? 'governanceDocumentId' then nullif(safe_input ->> 'governanceDocumentId', '')::uuid else finding.governance_document_id end,
        finding_type = coalesce(nullif(btrim(safe_input ->> 'findingType'), ''), finding.finding_type),
        finding_category = coalesce(nullif(btrim(safe_input ->> 'findingCategory'), ''), finding.finding_category),
        summary = coalesce(nullif(btrim(safe_input ->> 'summary'), ''), finding.summary),
        normalized_value = case when jsonb_typeof(safe_input -> 'normalizedValue') = 'object' then safe_input -> 'normalizedValue' else finding.normalized_value end,
        normalized_requirement = case when safe_input ? 'normalizedRequirement' then nullif(btrim(safe_input ->> 'normalizedRequirement'), '') else finding.normalized_requirement end,
        severity = coalesce(nullif(btrim(safe_input ->> 'severity'), ''), finding.severity),
        impact_type = coalesce(nullif(btrim(safe_input ->> 'impactType'), ''), finding.impact_type),
        source_evidence_id = case when safe_input ? 'sourceEvidenceId' then nullif(safe_input ->> 'sourceEvidenceId', '')::uuid else finding.source_evidence_id end,
        source_record_id = case when safe_input ? 'sourceRecordId' then nullif(safe_input ->> 'sourceRecordId', '')::uuid else finding.source_record_id end,
        source_anchor = case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else finding.source_anchor end,
        source_classification = coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), finding.source_classification),
        verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), finding.verification_state),
        confidence = case when safe_input ? 'confidence' then greatest(0, least((safe_input ->> 'confidence')::integer, 100)) else finding.confidence end,
        conflict_state = coalesce(nullif(btrim(safe_input ->> 'conflictState'), ''), finding.conflict_state),
        professional_review_recommended = case when safe_input ? 'professionalReviewRecommended' then coalesce(nullif(safe_input ->> 'professionalReviewRecommended', '')::boolean, false) else finding.professional_review_recommended end,
        updated_by = current_user_id
    where finding.id = existing_finding.id
    returning id, version, governance_record_id, workspace_id, acceptance_state into governance_finding_id, governance_finding_version, governance_record_id, workspace_id, acceptance_state;
  else
    insert into public.governance_findings (
      workspace_id, governance_record_id, governance_document_id, deal_id, property_id, finding_type, finding_category,
      summary, normalized_value, normalized_requirement, severity, impact_type, source_evidence_id, source_anchor,
      source_record_id, source_classification, confidence, verification_state, conflict_state, professional_review_recommended,
      effective_at, expires_at, acceptance_state, created_by, updated_by
    )
    values (
      target_record.workspace_id, target_record.id, nullif(safe_input ->> 'governanceDocumentId', '')::uuid,
      target_record.deal_id, target_record.property_id, coalesce(nullif(btrim(safe_input ->> 'findingType'), ''), 'requirement'),
      coalesce(nullif(btrim(safe_input ->> 'findingCategory'), ''), 'other'), coalesce(nullif(btrim(safe_input ->> 'summary'), ''), 'Governance finding'),
      case when jsonb_typeof(safe_input -> 'normalizedValue') = 'object' then safe_input -> 'normalizedValue' else '{}'::jsonb end,
      nullif(btrim(safe_input ->> 'normalizedRequirement'), ''), coalesce(nullif(btrim(safe_input ->> 'severity'), ''), 'unknown'),
      coalesce(nullif(btrim(safe_input ->> 'impactType'), ''), 'other'), nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
      case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
      nullif(safe_input ->> 'sourceRecordId', '')::uuid, coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'document_extracted'),
      greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
      coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
      coalesce(nullif(btrim(safe_input ->> 'conflictState'), ''), 'none'),
      coalesce(nullif(safe_input ->> 'professionalReviewRecommended', '')::boolean, false),
      nullif(safe_input ->> 'effectiveAt', '')::timestamptz, nullif(safe_input ->> 'expiresAt', '')::timestamptz,
      coalesce(nullif(btrim(safe_input ->> 'acceptanceState'), ''), 'proposed'), current_user_id, current_user_id
    )
    returning id, version, governance_record_id, workspace_id, acceptance_state into governance_finding_id, governance_finding_version, governance_record_id, workspace_id, acceptance_state;

    insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
    values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.finding_created', 'governance_finding', governance_finding_id, governance_finding_version, 'upsert_governance_finding', command.idempotency_key || ':governance.finding_created', jsonb_build_object('governance_record_id', target_record.id, 'governance_finding_id', governance_finding_id, 'acceptance_state', acceptance_state))
    on conflict do nothing;
  end if;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.finding_saved', 'governance_findings', 'governance_finding', governance_finding_id, 'upsert_governance_finding', command.idempotency_key || ':audit', jsonb_build_object('governance_finding_id', governance_finding_id, 'version', governance_finding_version, 'acceptance_state', acceptance_state), jsonb_build_object('downstream_mutation', false, 'legal_conclusion_authority', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_finding_id', governance_finding_id, 'governance_finding_version', governance_finding_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.set_governance_finding_acceptance(target_governance_finding_id uuid, target_acceptance_state text, expected_version integer, idempotency_key text, decision_reason text default null)
returns table (governance_finding_id uuid, governance_finding_version integer, workspace_id uuid, governance_record_id uuid, acceptance_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  existing_finding public.governance_findings%rowtype;
  command public.governance_command_requests%rowtype;
  event_name text;
begin
  if current_user_id is null then raise exception 'Authentication required to decide governance findings.' using errcode = '42501'; end if;
  if target_acceptance_state not in ('accepted', 'rejected', 'disputed') then raise exception 'Governance finding acceptance must be accepted, rejected, or disputed.' using errcode = '22023'; end if;
  select * into existing_finding from public.governance_findings where id = target_governance_finding_id and archived_at is null for update;
  if existing_finding.id is null then raise exception 'Governance finding is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_finding.workspace_id, 'deals:manage') then raise exception 'You do not have permission to decide GovernanceIQ findings.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(existing_finding.workspace_id, existing_finding.deal_id, existing_finding.property_id, existing_finding.governance_record_id, 'set_governance_finding_acceptance', idempotency_key, jsonb_build_object('expectedVersion', expected_version, 'acceptanceState', target_acceptance_state, 'reason', decision_reason));
  if command.result ? 'governance_finding_id' then
    select id, version, workspace_id, governance_record_id, acceptance_state into governance_finding_id, governance_finding_version, workspace_id, governance_record_id, acceptance_state from public.governance_findings where id = (command.result ->> 'governance_finding_id')::uuid;
    return next;
    return;
  end if;
  if existing_finding.version <> expected_version then raise exception 'This governance finding changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.governance_findings as finding
  set acceptance_state = target_acceptance_state,
      accepted_by = case when target_acceptance_state = 'accepted' then current_user_id else finding.accepted_by end,
      accepted_at = case when target_acceptance_state = 'accepted' then now() else finding.accepted_at end,
      rejected_by = case when target_acceptance_state in ('rejected', 'disputed') then current_user_id else finding.rejected_by end,
      rejected_at = case when target_acceptance_state in ('rejected', 'disputed') then now() else finding.rejected_at end,
      updated_by = current_user_id
  where finding.id = existing_finding.id
  returning id, version, workspace_id, governance_record_id, acceptance_state into governance_finding_id, governance_finding_version, workspace_id, governance_record_id, acceptance_state;

  event_name := case when target_acceptance_state = 'accepted' then 'governance.finding_accepted' when target_acceptance_state = 'rejected' then 'governance.finding_rejected' else 'governance.finding_disputed' end;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_finding.workspace_id, existing_finding.deal_id, existing_finding.property_id, current_user_id, event_name, 'governance_finding', governance_finding_id, governance_finding_version, 'set_governance_finding_acceptance', command.idempotency_key || ':' || event_name, jsonb_build_object('governance_record_id', governance_record_id, 'governance_finding_id', governance_finding_id, 'acceptance_state', acceptance_state, 'downstream_mutation', false))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_finding.workspace_id, existing_finding.deal_id, existing_finding.property_id, current_user_id, event_name, 'governance_findings', 'governance_finding', governance_finding_id, 'set_governance_finding_acceptance', command.idempotency_key || ':audit', to_jsonb(existing_finding), jsonb_build_object('acceptance_state', acceptance_state, 'version', governance_finding_version), jsonb_build_object('reason', decision_reason, 'downstream_mutation', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_finding_id', governance_finding_id, 'governance_finding_version', governance_finding_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.create_governance_conflict(target_governance_record_id uuid, conflict_input jsonb, idempotency_key text)
returns table (governance_conflict_id uuid, governance_conflict_version integer, governance_record_id uuid, workspace_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(conflict_input, '{}'::jsonb));
  target_record public.governance_records%rowtype;
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to create governance conflicts.' using errcode = '42501'; end if;
  select * into target_record from public.governance_records where id = target_governance_record_id and archived_at is null for update;
  if target_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to create GovernanceIQ conflicts.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'create_governance_conflict', idempotency_key, safe_input);
  if command.result ? 'governance_conflict_id' then
    select id, version, governance_record_id, workspace_id, status into governance_conflict_id, governance_conflict_version, governance_record_id, workspace_id, status from public.governance_conflicts where id = (command.result ->> 'governance_conflict_id')::uuid;
    return next;
    return;
  end if;

  insert into public.governance_conflicts (
    workspace_id, governance_record_id, category, conflict_type, status, summary, source_a_document_id, source_a_finding_id,
    source_b_document_id, source_b_finding_id, governing_source_candidate, professional_review_required, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, coalesce(nullif(btrim(safe_input ->> 'category'), ''), 'other'),
    coalesce(nullif(btrim(safe_input ->> 'conflictType'), ''), 'other'), coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'unresolved'),
    coalesce(nullif(btrim(safe_input ->> 'summary'), ''), 'Governance source conflict'),
    nullif(safe_input ->> 'sourceADocumentId', '')::uuid, nullif(safe_input ->> 'sourceAFindingId', '')::uuid,
    nullif(safe_input ->> 'sourceBDocumentId', '')::uuid, nullif(safe_input ->> 'sourceBFindingId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'governingSourceCandidate') = 'object' then safe_input -> 'governingSourceCandidate' else '{}'::jsonb end,
    coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, true), current_user_id, current_user_id
  )
  returning id, version, governance_record_id, workspace_id, status into governance_conflict_id, governance_conflict_version, governance_record_id, workspace_id, status;

  update public.governance_records as record
  set status = case when record.status = 'current' then 'current_with_conflicts' else record.status end,
      updated_by = current_user_id
  where record.id = target_record.id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.conflict_detected', 'governance_conflict', governance_conflict_id, governance_conflict_version, 'create_governance_conflict', command.idempotency_key || ':governance.conflict_detected', jsonb_build_object('governance_record_id', target_record.id, 'governance_conflict_id', governance_conflict_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.conflict_detected', 'governance_conflicts', 'governance_conflict', governance_conflict_id, 'create_governance_conflict', command.idempotency_key || ':audit', jsonb_build_object('governance_conflict_id', governance_conflict_id, 'version', governance_conflict_version), jsonb_build_object('professional_review_required', true))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_conflict_id', governance_conflict_id, 'governance_conflict_version', governance_conflict_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.resolve_governance_conflict(target_governance_conflict_id uuid, resolution_input jsonb, expected_version integer, idempotency_key text)
returns table (governance_conflict_id uuid, governance_conflict_version integer, workspace_id uuid, governance_record_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(resolution_input, '{}'::jsonb));
  existing_conflict public.governance_conflicts%rowtype;
  target_record public.governance_records%rowtype;
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to resolve governance conflicts.' using errcode = '42501'; end if;
  select * into existing_conflict from public.governance_conflicts where id = target_governance_conflict_id and archived_at is null for update;
  if existing_conflict.id is null then raise exception 'Governance conflict is not available.' using errcode = 'P0002'; end if;
  select * into target_record from public.governance_records where id = existing_conflict.governance_record_id;
  if not public.has_workspace_permission(existing_conflict.workspace_id, 'deals:manage') then raise exception 'You do not have permission to resolve GovernanceIQ conflicts.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(existing_conflict.workspace_id, target_record.deal_id, target_record.property_id, existing_conflict.governance_record_id, 'resolve_governance_conflict', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'governance_conflict_id' then
    select id, version, workspace_id, governance_record_id, status into governance_conflict_id, governance_conflict_version, workspace_id, governance_record_id, status from public.governance_conflicts where id = (command.result ->> 'governance_conflict_id')::uuid;
    return next;
    return;
  end if;
  if existing_conflict.version <> expected_version then raise exception 'This governance conflict changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.governance_conflicts as conflict
  set status = coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'resolved'),
      resolved_at = coalesce(conflict.resolved_at, now()),
      resolved_by = coalesce(conflict.resolved_by, current_user_id),
      resolution = coalesce(nullif(btrim(safe_input ->> 'resolution'), ''), conflict.resolution),
      governing_source_candidate = case when jsonb_typeof(safe_input -> 'governingSourceCandidate') = 'object' then safe_input -> 'governingSourceCandidate' else conflict.governing_source_candidate end,
      professional_review_required = case when safe_input ? 'professionalReviewRequired' then coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, conflict.professional_review_required) else conflict.professional_review_required end,
      updated_by = current_user_id
  where conflict.id = existing_conflict.id
  returning id, version, workspace_id, governance_record_id, status into governance_conflict_id, governance_conflict_version, workspace_id, governance_record_id, status;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_conflict.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.conflict_resolved', 'governance_conflict', governance_conflict_id, governance_conflict_version, 'resolve_governance_conflict', command.idempotency_key || ':governance.conflict_resolved', jsonb_build_object('governance_record_id', governance_record_id, 'governance_conflict_id', governance_conflict_id, 'status', status))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_conflict.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.conflict_resolved', 'governance_conflicts', 'governance_conflict', governance_conflict_id, 'resolve_governance_conflict', command.idempotency_key || ':audit', to_jsonb(existing_conflict), jsonb_build_object('status', status, 'version', governance_conflict_version), jsonb_build_object('downstream_mutation', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_conflict_id', governance_conflict_id, 'governance_conflict_version', governance_conflict_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.upsert_governance_financial(target_governance_record_id uuid, financial_input jsonb, expected_version integer default null, idempotency_key text default null)
returns table (governance_financial_id uuid, governance_financial_version integer, governance_record_id uuid, workspace_id uuid)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(financial_input, '{}'::jsonb));
  target_record public.governance_records%rowtype;
  existing_financial public.governance_financials%rowtype;
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save governance financials.' using errcode = '42501'; end if;
  select * into target_record from public.governance_records where id = target_governance_record_id and archived_at is null for update;
  if target_record.id is null then raise exception 'Governance record is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save GovernanceIQ financials.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'upsert_governance_financial', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'governance_financial_id' then
    select id, version, governance_record_id, workspace_id into governance_financial_id, governance_financial_version, governance_record_id, workspace_id from public.governance_financials where id = (command.result ->> 'governance_financial_id')::uuid;
    return next;
    return;
  end if;
  if nullif(safe_input ->> 'id', '') is not null then
    select * into existing_financial from public.governance_financials where id = (safe_input ->> 'id')::uuid and workspace_id = target_record.workspace_id for update;
    if existing_financial.id is null then raise exception 'Governance financial input is not available.' using errcode = 'P0002'; end if;
    if expected_version is not null and existing_financial.version <> expected_version then raise exception 'This governance financial input changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
    update public.governance_financials as financial
    set period_start = case when safe_input ? 'periodStart' then nullif(safe_input ->> 'periodStart', '')::date else financial.period_start end,
        period_end = case when safe_input ? 'periodEnd' then nullif(safe_input ->> 'periodEnd', '')::date else financial.period_end end,
        dues_amount = case when safe_input ? 'duesAmount' then nullif(safe_input ->> 'duesAmount', '')::numeric else financial.dues_amount end,
        dues_frequency = case when safe_input ? 'duesFrequency' then nullif(safe_input ->> 'duesFrequency', '') else financial.dues_frequency end,
        revenue_amount = case when safe_input ? 'revenueAmount' then nullif(safe_input ->> 'revenueAmount', '')::numeric else financial.revenue_amount end,
        expense_amount = case when safe_input ? 'expenseAmount' then nullif(safe_input ->> 'expenseAmount', '')::numeric else financial.expense_amount end,
        reserve_balance = case when safe_input ? 'reserveBalance' then nullif(safe_input ->> 'reserveBalance', '')::numeric else financial.reserve_balance end,
        delinquency_amount = case when safe_input ? 'delinquencyAmount' then nullif(safe_input ->> 'delinquencyAmount', '')::numeric else financial.delinquency_amount end,
        delinquency_rate = case when safe_input ? 'delinquencyRate' then nullif(safe_input ->> 'delinquencyRate', '')::numeric else financial.delinquency_rate end,
        assessment_amount = case when safe_input ? 'assessmentAmount' then nullif(safe_input ->> 'assessmentAmount', '')::numeric else financial.assessment_amount end,
        association_debt_amount = case when safe_input ? 'associationDebtAmount' then nullif(safe_input ->> 'associationDebtAmount', '')::numeric else financial.association_debt_amount end,
        insurance_expense_amount = case when safe_input ? 'insuranceExpenseAmount' then nullif(safe_input ->> 'insuranceExpenseAmount', '')::numeric else financial.insurance_expense_amount end,
        insurance_deductible_amount = case when safe_input ? 'insuranceDeductibleAmount' then nullif(safe_input ->> 'insuranceDeductibleAmount', '')::numeric else financial.insurance_deductible_amount end,
        planned_project_amount = case when safe_input ? 'plannedProjectAmount' then nullif(safe_input ->> 'plannedProjectAmount', '')::numeric else financial.planned_project_amount end,
        updated_by = current_user_id
    where financial.id = existing_financial.id
    returning id, version, governance_record_id, workspace_id into governance_financial_id, governance_financial_version, governance_record_id, workspace_id;
  else
    insert into public.governance_financials (
      workspace_id, governance_record_id, governance_document_id, period_start, period_end, dues_amount, dues_frequency,
      revenue_amount, expense_amount, reserve_balance, delinquency_amount, delinquency_rate, assessment_amount,
      association_debt_amount, insurance_expense_amount, insurance_deductible_amount, planned_project_amount, currency,
      source_evidence_id, source_record_id, source_anchor, source_classification, verification_state, confidence, created_by, updated_by
    )
    values (
      target_record.workspace_id, target_record.id, nullif(safe_input ->> 'governanceDocumentId', '')::uuid,
      nullif(safe_input ->> 'periodStart', '')::date, nullif(safe_input ->> 'periodEnd', '')::date,
      nullif(safe_input ->> 'duesAmount', '')::numeric, nullif(safe_input ->> 'duesFrequency', ''),
      nullif(safe_input ->> 'revenueAmount', '')::numeric, nullif(safe_input ->> 'expenseAmount', '')::numeric,
      nullif(safe_input ->> 'reserveBalance', '')::numeric, nullif(safe_input ->> 'delinquencyAmount', '')::numeric,
      nullif(safe_input ->> 'delinquencyRate', '')::numeric, nullif(safe_input ->> 'assessmentAmount', '')::numeric,
      nullif(safe_input ->> 'associationDebtAmount', '')::numeric, nullif(safe_input ->> 'insuranceExpenseAmount', '')::numeric,
      nullif(safe_input ->> 'insuranceDeductibleAmount', '')::numeric, nullif(safe_input ->> 'plannedProjectAmount', '')::numeric,
      upper(coalesce(nullif(btrim(safe_input ->> 'currency'), ''), 'USD')), nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
      nullif(safe_input ->> 'sourceRecordId', '')::uuid, case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
      coalesce(nullif(btrim(safe_input ->> 'sourceClassification'), ''), 'document_extracted'), coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
      greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)), current_user_id, current_user_id
    )
    returning id, version, governance_record_id, workspace_id into governance_financial_id, governance_financial_version, governance_record_id, workspace_id;
  end if;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.financial_input_saved', 'governance_financials', 'governance_financial', governance_financial_id, 'upsert_governance_financial', command.idempotency_key || ':audit', jsonb_build_object('governance_financial_id', governance_financial_id, 'version', governance_financial_version), jsonb_build_object('calculation_authority', 'none_source_backed_input_only'))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_financial_id', governance_financial_id, 'governance_financial_version', governance_financial_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.list_governance_record_projection(target_deal_id uuid default null, target_property_id uuid default null)
returns table (
  governance_record_id uuid,
  governance_record_version integer,
  workspace_id uuid,
  deal_id uuid,
  property_id uuid,
  name text,
  governance_type text,
  status text,
  projection_state text,
  document_count bigint,
  finding_count bigint,
  unresolved_conflict_count bigint,
  accepted_finding_count bigint,
  high_severity_finding_count bigint,
  professional_review_required boolean,
  verification_summary jsonb,
  source_completeness text,
  updated_at timestamptz,
  loaded_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required to load GovernanceIQ.' using errcode = '42501'; end if;
  if target_deal_id is not null then
    select deal.workspace_id into target_workspace_id from public.brix_deals deal where deal.id = target_deal_id and deal.deleted_at is null;
  elsif target_property_id is not null then
    select property.workspace_id into target_workspace_id from public.properties property where property.id = target_property_id and property.deleted_at is null;
  else
    raise exception 'A Deal or Property target is required to load GovernanceIQ.' using errcode = '22023';
  end if;
  if target_workspace_id is null or not public.is_workspace_member(target_workspace_id) then raise exception 'GovernanceIQ target is not available.' using errcode = '42501'; end if;

  return query
  select
    projection.governance_record_id, projection.governance_record_version, projection.workspace_id, projection.deal_id,
    projection.property_id, projection.name, projection.governance_type, projection.status, projection.projection_state,
    projection.document_count, projection.finding_count, projection.unresolved_conflict_count, projection.accepted_finding_count,
    projection.high_severity_finding_count, projection.professional_review_required, projection.verification_summary,
    projection.source_completeness, projection.updated_at, now()
  from public.governance_record_projection projection
  where projection.workspace_id = target_workspace_id
    and (target_deal_id is null or projection.deal_id = target_deal_id)
    and (target_property_id is null or projection.property_id = target_property_id)
    and projection.status <> 'archived'
  order by projection.professional_review_required desc, projection.unresolved_conflict_count desc, projection.updated_at desc;
end;
$$;

create or replace function public.load_governance_record_detail(target_governance_record_id uuid)
returns table (
  record_type text,
  record_id uuid,
  record_version integer,
  workspace_id uuid,
  governance_record_id uuid,
  deal_id uuid,
  property_id uuid,
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
  target_record public.governance_records%rowtype;
begin
  target_record := public.authorized_governance_record(target_governance_record_id);
  return query
  select 'record'::text, target_record.id, target_record.version, target_record.workspace_id, target_record.id, target_record.deal_id, target_record.property_id, target_record.name, target_record.status, target_record.source_classification, target_record.verification_state, to_jsonb(target_record) - 'workspace_id', target_record.updated_at
  union all
  select 'document'::text, document.id, document.version, document.workspace_id, document.governance_record_id, target_record.deal_id, target_record.property_id, document.title, document.analysis_state, document.source_classification, document.verification_state, to_jsonb(document) - 'workspace_id' - 'governance_record_id', document.updated_at
  from public.governance_documents document where document.workspace_id = target_record.workspace_id and document.governance_record_id = target_record.id and document.archived_at is null
  union all
  select 'finding'::text, finding.id, finding.version, finding.workspace_id, finding.governance_record_id, finding.deal_id, finding.property_id, finding.summary, finding.acceptance_state, finding.source_classification, finding.verification_state, to_jsonb(finding) - 'workspace_id' - 'governance_record_id', finding.updated_at
  from public.governance_findings finding where finding.workspace_id = target_record.workspace_id and finding.governance_record_id = target_record.id and finding.archived_at is null
  union all
  select 'conflict'::text, conflict.id, conflict.version, conflict.workspace_id, conflict.governance_record_id, target_record.deal_id, target_record.property_id, conflict.summary, conflict.status, 'conflict'::text, case when conflict.professional_review_required then 'professional_review_recommended' else 'unverified' end, to_jsonb(conflict) - 'workspace_id' - 'governance_record_id', conflict.updated_at
  from public.governance_conflicts conflict where conflict.workspace_id = target_record.workspace_id and conflict.governance_record_id = target_record.id and conflict.archived_at is null
  union all
  select 'financial'::text, financial.id, financial.version, financial.workspace_id, financial.governance_record_id, target_record.deal_id, target_record.property_id, coalesce(financial.period_start::text, 'Governance financial input'), 'source_backed_input'::text, financial.source_classification, financial.verification_state, to_jsonb(financial) - 'workspace_id' - 'governance_record_id', financial.updated_at
  from public.governance_financials financial where financial.workspace_id = target_record.workspace_id and financial.governance_record_id = target_record.id and financial.archived_at is null;
end;
$$;

alter table public.governance_type_definitions enable row level security;
alter table public.governance_status_definitions enable row level security;
alter table public.governance_document_type_definitions enable row level security;
alter table public.governance_verification_state_definitions enable row level security;
alter table public.governance_source_classification_definitions enable row level security;
alter table public.governance_finding_category_definitions enable row level security;
alter table public.governance_records enable row level security;
alter table public.governance_documents enable row level security;
alter table public.governance_findings enable row level security;
alter table public.governance_conflicts enable row level security;
alter table public.governance_financials enable row level security;
alter table public.governance_record_versions enable row level security;
alter table public.governance_document_versions enable row level security;
alter table public.governance_finding_versions enable row level security;
alter table public.governance_conflict_versions enable row level security;
alter table public.governance_financial_versions enable row level security;
alter table public.governance_command_requests enable row level security;

create policy "governance type definitions readable" on public.governance_type_definitions for select to authenticated using (true);
create policy "governance status definitions readable" on public.governance_status_definitions for select to authenticated using (true);
create policy "governance document type definitions readable" on public.governance_document_type_definitions for select to authenticated using (true);
create policy "governance verification definitions readable" on public.governance_verification_state_definitions for select to authenticated using (true);
create policy "governance classification definitions readable" on public.governance_source_classification_definitions for select to authenticated using (true);
create policy "governance finding category definitions readable" on public.governance_finding_category_definitions for select to authenticated using (true);

create policy "governance records read workspace members" on public.governance_records for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance records no direct insert" on public.governance_records for insert to authenticated with check (false);
create policy "governance records no direct update" on public.governance_records for update to authenticated using (false) with check (false);
create policy "governance records no direct delete" on public.governance_records for delete to authenticated using (false);

create policy "governance documents read workspace members" on public.governance_documents for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance documents no direct insert" on public.governance_documents for insert to authenticated with check (false);
create policy "governance documents no direct update" on public.governance_documents for update to authenticated using (false) with check (false);
create policy "governance documents no direct delete" on public.governance_documents for delete to authenticated using (false);

create policy "governance findings read workspace members" on public.governance_findings for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance findings no direct insert" on public.governance_findings for insert to authenticated with check (false);
create policy "governance findings no direct update" on public.governance_findings for update to authenticated using (false) with check (false);
create policy "governance findings no direct delete" on public.governance_findings for delete to authenticated using (false);

create policy "governance conflicts read workspace members" on public.governance_conflicts for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance conflicts no direct insert" on public.governance_conflicts for insert to authenticated with check (false);
create policy "governance conflicts no direct update" on public.governance_conflicts for update to authenticated using (false) with check (false);
create policy "governance conflicts no direct delete" on public.governance_conflicts for delete to authenticated using (false);

create policy "governance financials read workspace members" on public.governance_financials for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance financials no direct insert" on public.governance_financials for insert to authenticated with check (false);
create policy "governance financials no direct update" on public.governance_financials for update to authenticated using (false) with check (false);
create policy "governance financials no direct delete" on public.governance_financials for delete to authenticated using (false);

create policy "governance record versions read workspace members" on public.governance_record_versions for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance document versions read workspace members" on public.governance_document_versions for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance finding versions read workspace members" on public.governance_finding_versions for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance conflict versions read workspace members" on public.governance_conflict_versions for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance financial versions read workspace members" on public.governance_financial_versions for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance command requests read creator" on public.governance_command_requests for select to authenticated using (created_by = (select auth.uid()) and (select public.is_workspace_member(workspace_id)));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'governance_record_versions', 'governance_document_versions', 'governance_finding_versions',
    'governance_conflict_versions', 'governance_financial_versions', 'governance_command_requests'
  ]
  loop
    execute format('create policy "%s no direct insert" on public.%I for insert to authenticated with check (false)', replace(table_name, '_', ' '), table_name);
    execute format('create policy "%s no direct update" on public.%I for update to authenticated using (false) with check (false)', replace(table_name, '_', ' '), table_name);
    execute format('create policy "%s no direct delete" on public.%I for delete to authenticated using (false)', replace(table_name, '_', ' '), table_name);
  end loop;
end $$;

grant select on public.governance_type_definitions to authenticated;
grant select on public.governance_status_definitions to authenticated;
grant select on public.governance_document_type_definitions to authenticated;
grant select on public.governance_verification_state_definitions to authenticated;
grant select on public.governance_source_classification_definitions to authenticated;
grant select on public.governance_finding_category_definitions to authenticated;
grant select on public.governance_records to authenticated;
grant select on public.governance_documents to authenticated;
grant select on public.governance_findings to authenticated;
grant select on public.governance_conflicts to authenticated;
grant select on public.governance_financials to authenticated;
grant select on public.governance_record_versions to authenticated;
grant select on public.governance_document_versions to authenticated;
grant select on public.governance_finding_versions to authenticated;
grant select on public.governance_conflict_versions to authenticated;
grant select on public.governance_financial_versions to authenticated;
grant select on public.governance_command_requests to authenticated;
grant select on public.governance_record_projection to authenticated;

revoke insert, update, delete on public.governance_records from authenticated;
revoke insert, update, delete on public.governance_documents from authenticated;
revoke insert, update, delete on public.governance_findings from authenticated;
revoke insert, update, delete on public.governance_conflicts from authenticated;
revoke insert, update, delete on public.governance_financials from authenticated;
revoke insert, update, delete on public.governance_record_versions from authenticated;
revoke insert, update, delete on public.governance_document_versions from authenticated;
revoke insert, update, delete on public.governance_finding_versions from authenticated;
revoke insert, update, delete on public.governance_conflict_versions from authenticated;
revoke insert, update, delete on public.governance_financial_versions from authenticated;
revoke insert, update, delete on public.governance_command_requests from authenticated;

revoke all on function public.validate_governance_scope() from public;
revoke all on function public.record_governance_version() from public;
revoke all on function public.ensure_governance_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public;
revoke all on function public.authorized_governance_record(uuid) from public;
revoke all on function public.create_governance_record(uuid, jsonb, text) from public;
revoke all on function public.update_governance_record(uuid, jsonb, integer, text) from public;
revoke all on function public.archive_governance_record(uuid, integer, text, text) from public;
revoke all on function public.link_governance_document(uuid, jsonb, text) from public;
revoke all on function public.update_governance_document(uuid, jsonb, integer, text) from public;
revoke all on function public.upsert_governance_finding(uuid, jsonb, integer, text) from public;
revoke all on function public.set_governance_finding_acceptance(uuid, text, integer, text, text) from public;
revoke all on function public.create_governance_conflict(uuid, jsonb, text) from public;
revoke all on function public.resolve_governance_conflict(uuid, jsonb, integer, text) from public;
revoke all on function public.upsert_governance_financial(uuid, jsonb, integer, text) from public;
revoke all on function public.list_governance_record_projection(uuid, uuid) from public;
revoke all on function public.load_governance_record_detail(uuid) from public;

revoke execute on function public.validate_governance_scope() from public, anon, authenticated;
revoke execute on function public.record_governance_version() from public, anon, authenticated;
revoke execute on function public.ensure_governance_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.authorized_governance_record(uuid) from public, anon, authenticated;
revoke execute on function public.create_governance_record(uuid, jsonb, text) from public, anon;
revoke execute on function public.update_governance_record(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.archive_governance_record(uuid, integer, text, text) from public, anon;
revoke execute on function public.link_governance_document(uuid, jsonb, text) from public, anon;
revoke execute on function public.update_governance_document(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.upsert_governance_finding(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.set_governance_finding_acceptance(uuid, text, integer, text, text) from public, anon;
revoke execute on function public.create_governance_conflict(uuid, jsonb, text) from public, anon;
revoke execute on function public.resolve_governance_conflict(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.upsert_governance_financial(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.list_governance_record_projection(uuid, uuid) from public, anon;
revoke execute on function public.load_governance_record_detail(uuid) from public, anon;

grant execute on function public.create_governance_record(uuid, jsonb, text) to authenticated;
grant execute on function public.update_governance_record(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.archive_governance_record(uuid, integer, text, text) to authenticated;
grant execute on function public.link_governance_document(uuid, jsonb, text) to authenticated;
grant execute on function public.update_governance_document(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.upsert_governance_finding(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.set_governance_finding_acceptance(uuid, text, integer, text, text) to authenticated;
grant execute on function public.create_governance_conflict(uuid, jsonb, text) to authenticated;
grant execute on function public.resolve_governance_conflict(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.upsert_governance_financial(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.list_governance_record_projection(uuid, uuid) to authenticated;
grant execute on function public.load_governance_record_detail(uuid) to authenticated;

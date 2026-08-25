-- Specification 011 Slice 1: canonical ContractIQ foundation.
-- This slice retrofits the historical contracts table into a workspace-scoped
-- ContractIQ foundation and adds source-linked parties, terms, deadlines,
-- findings, conflicts, relationships, questions, and discussion-draft proposals.
-- It does not perform legal analysis, deadline calculation, OfferIQ work,
-- report generation, or downstream canonical mutations.

create extension if not exists pgcrypto;

create unique index if not exists idx_evidence_items_workspace_id
  on public.evidence_items(workspace_id, id);

create unique index if not exists idx_contacts_workspace_id
  on public.contacts(workspace_id, id);

create unique index if not exists idx_organizations_workspace_id
  on public.organizations(workspace_id, id);

create unique index if not exists idx_tasks_workspace_id
  on public.tasks(workspace_id, id);

create unique index if not exists idx_deadlines_workspace_id
  on public.deadlines(workspace_id, id);

create table if not exists public.contract_type_definitions (
  type_key text primary key,
  class_key text not null,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_perspective_definitions (
  perspective_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_verification_state_definitions (
  state_key text primary key,
  label text not null,
  sort_order integer not null unique,
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_analysis_state_definitions (
  state_key text primary key,
  label text not null,
  sort_order integer not null unique,
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_party_role_definitions (
  role_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_term_category_definitions (
  category_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_proposal_state_definitions (
  state_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_deadline_status_definitions (
  status_key text primary key,
  label text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  requires_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_finding_category_definitions (
  category_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_conflict_type_definitions (
  type_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_relationship_type_definitions (
  type_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.contract_question_recipient_role_definitions (
  role_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

insert into public.contract_type_definitions (type_key, class_key, label, sort_order)
values
  ('purchase_agreement', 'purchase_sale', 'Purchase Agreement', 10),
  ('offer', 'purchase_sale', 'Offer', 20),
  ('counteroffer', 'purchase_sale', 'Counteroffer', 30),
  ('amendment', 'purchase_sale', 'Amendment', 40),
  ('addendum', 'purchase_sale', 'Addendum', 50),
  ('seller_disclosure', 'purchase_sale', 'Seller Disclosure', 60),
  ('land_purchase_agreement', 'land_development', 'Land Purchase Agreement', 70),
  ('option_agreement', 'land_development', 'Option Agreement', 80),
  ('development_agreement', 'land_development', 'Development Agreement', 90),
  ('easement', 'land_development', 'Easement', 100),
  ('residential_lease', 'leasing', 'Residential Lease', 110),
  ('commercial_lease', 'leasing', 'Commercial Lease', 120),
  ('ground_lease', 'leasing', 'Ground Lease', 130),
  ('lease_amendment', 'leasing', 'Lease Amendment', 140),
  ('guaranty', 'financing_investment', 'Guaranty', 150),
  ('loan_agreement', 'financing_investment', 'Loan Agreement', 160),
  ('promissory_note', 'financing_investment', 'Promissory Note', 170),
  ('mortgage_deed_of_trust', 'financing_investment', 'Mortgage / Deed of Trust', 180),
  ('operating_agreement', 'financing_investment', 'Operating / JV Agreement', 190),
  ('title_commitment', 'title_closing_services', 'Title Commitment', 200),
  ('survey', 'title_closing_services', 'Survey', 210),
  ('settlement_statement', 'title_closing_services', 'Settlement Statement', 220),
  ('deed', 'title_closing_services', 'Deed', 230),
  ('escrow_agreement', 'title_closing_services', 'Escrow Agreement', 240),
  ('service_agreement', 'title_closing_services', 'Service Agreement', 250),
  ('other', 'other', 'Other Contract Document', 260)
on conflict (type_key) do update set class_key = excluded.class_key, label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_status_definitions (status_key, label, sort_order, is_terminal, requires_review)
values
  ('draft', 'Draft', 10, false, false),
  ('proposed', 'Proposed', 20, false, false),
  ('submitted', 'Submitted', 30, false, false),
  ('countered', 'Countered', 40, false, false),
  ('partially_executed', 'Partially Executed', 50, false, true),
  ('executed', 'Executed', 60, false, false),
  ('under_review', 'Under Review', 70, false, true),
  ('contingent', 'Contingent', 80, false, true),
  ('amended', 'Amended', 90, false, false),
  ('superseded', 'Superseded', 100, true, false),
  ('terminated', 'Terminated', 110, true, false),
  ('cancelled', 'Cancelled', 120, true, false),
  ('expired', 'Expired', 130, true, false),
  ('closed', 'Closed', 140, true, false),
  ('unknown', 'Unknown', 150, false, true)
on conflict (status_key) do update set label = excluded.label, sort_order = excluded.sort_order, is_terminal = excluded.is_terminal, requires_review = excluded.requires_review;

insert into public.contract_perspective_definitions (perspective_key, label, sort_order)
values
  ('buyer', 'Buyer', 10), ('seller', 'Seller', 20), ('landlord', 'Landlord', 30),
  ('tenant', 'Tenant', 40), ('borrower', 'Borrower', 50), ('lender', 'Lender', 60),
  ('developer', 'Developer', 70), ('investor', 'Investor', 80), ('guarantor', 'Guarantor', 90)
on conflict (perspective_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_verification_state_definitions (state_key, label, sort_order, requires_review)
values
  ('unverified', 'Unverified', 10, false),
  ('source_backed', 'Source Backed', 20, false),
  ('verified', 'Verified', 30, false),
  ('professional_verified', 'Professional Verified', 40, false),
  ('conflicted', 'Conflicted', 50, true),
  ('unknown', 'Unknown', 60, true)
on conflict (state_key) do update set label = excluded.label, sort_order = excluded.sort_order, requires_review = excluded.requires_review;

insert into public.contract_analysis_state_definitions (state_key, label, sort_order, requires_review)
values
  ('no_contract', 'No Contract', 10, false),
  ('uploaded', 'Uploaded', 20, false),
  ('processing', 'Processing', 30, false),
  ('partial', 'Partial', 40, true),
  ('awaiting_verification', 'Awaiting Verification', 50, true),
  ('current', 'Current', 60, false),
  ('current_with_conflicts', 'Current With Conflicts', 70, true),
  ('stale', 'Stale', 80, true),
  ('failed_with_prior_analysis', 'Failed With Prior Analysis', 90, true),
  ('professional_review_required', 'Professional Review Required', 100, true),
  ('superseded', 'Superseded', 110, false),
  ('expired', 'Expired', 120, false)
on conflict (state_key) do update set label = excluded.label, sort_order = excluded.sort_order, requires_review = excluded.requires_review;

insert into public.contract_party_role_definitions (role_key, label, sort_order)
values
  ('buyer', 'Buyer', 10), ('seller', 'Seller', 20), ('landlord', 'Landlord', 30),
  ('tenant', 'Tenant', 40), ('borrower', 'Borrower', 50), ('lender', 'Lender', 60),
  ('developer', 'Developer', 70), ('investor', 'Investor', 80), ('guarantor', 'Guarantor', 90),
  ('broker', 'Broker', 100), ('attorney', 'Attorney', 110), ('title_escrow', 'Title / Escrow', 120),
  ('agent', 'Agent', 130), ('assignor', 'Assignor', 140), ('assignee', 'Assignee', 150),
  ('optionor', 'Optionor', 160), ('optionee', 'Optionee', 170), ('other', 'Other', 180)
on conflict (role_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_term_category_definitions (category_key, label, sort_order)
values
  ('identity_property', 'Identity and Property', 10), ('economic', 'Economic Terms', 20),
  ('financing', 'Financing', 30), ('due_diligence', 'Due Diligence', 40),
  ('closing_possession', 'Closing and Possession', 50), ('representation_warranty', 'Representations and Warranties', 60),
  ('default_remedy', 'Default and Remedies', 70), ('assignment_transfer', 'Assignment and Transfer', 80),
  ('lease_specific', 'Lease Specific', 90), ('obligation_deliverable', 'Obligation / Deliverable', 100),
  ('notice', 'Notice', 110), ('other', 'Other', 120)
on conflict (category_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_proposal_state_definitions (state_key, label, sort_order, is_terminal)
values
  ('proposed', 'Proposed', 10, false), ('accepted', 'Accepted', 20, true),
  ('rejected', 'Rejected', 30, true), ('disputed', 'Disputed', 40, false),
  ('superseded', 'Superseded', 50, true), ('expired', 'Expired', 60, true)
on conflict (state_key) do update set label = excluded.label, sort_order = excluded.sort_order, is_terminal = excluded.is_terminal;

insert into public.contract_deadline_status_definitions (status_key, label, sort_order, is_terminal, requires_review)
values
  ('proposed', 'Proposed', 10, false, false), ('pending_verification', 'Pending Verification', 20, false, true),
  ('current', 'Current', 30, false, false), ('completed', 'Completed', 40, true, false),
  ('waived', 'Waived', 50, true, false), ('missed', 'Missed', 60, true, true),
  ('expired', 'Expired', 70, true, false), ('superseded', 'Superseded', 80, true, false),
  ('cancelled', 'Cancelled', 90, true, false), ('unknown', 'Unknown', 100, false, true)
on conflict (status_key) do update set label = excluded.label, sort_order = excluded.sort_order, is_terminal = excluded.is_terminal, requires_review = excluded.requires_review;

insert into public.contract_finding_category_definitions (category_key, label, sort_order)
values
  ('identity_property', 'Identity / Property', 10), ('money', 'Money', 20),
  ('deadline', 'Deadline', 30), ('contingency', 'Contingency', 40),
  ('obligation', 'Obligation', 50), ('missing_exhibit', 'Missing Exhibit', 60),
  ('signature_authority', 'Signature / Authority', 70), ('financing', 'Financing', 80),
  ('governance', 'Governance', 90), ('title_survey', 'Title / Survey', 100),
  ('insurance', 'Insurance', 110), ('default_remedy', 'Default / Remedy', 120),
  ('assignment_transfer', 'Assignment / Transfer', 130), ('lease_specific', 'Lease Specific', 140),
  ('professional_review', 'Professional Review', 150), ('other', 'Other', 160)
on conflict (category_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_conflict_type_definitions (type_key, label, sort_order)
values
  ('value_conflict', 'Value Conflict', 10), ('date_conflict', 'Date Conflict', 20),
  ('party_conflict', 'Party Conflict', 30), ('property_conflict', 'Property Conflict', 40),
  ('deadline_conflict', 'Deadline Conflict', 50), ('hierarchy_conflict', 'Hierarchy Conflict', 60),
  ('amendment_conflict', 'Amendment Conflict', 70), ('verification_conflict', 'Verification Conflict', 80),
  ('missing_record_conflict', 'Missing Record Conflict', 90), ('source_conflict', 'Source Conflict', 100),
  ('ambiguity_conflict', 'Ambiguity Conflict', 110), ('other', 'Other', 120)
on conflict (type_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_relationship_type_definitions (type_key, label, sort_order)
values
  ('amends', 'Amends', 10), ('amended_by', 'Amended By', 20),
  ('supersedes', 'Supersedes', 30), ('superseded_by', 'Superseded By', 40),
  ('supplements', 'Supplements', 50), ('restates', 'Restates', 60),
  ('related_to', 'Related To', 70)
on conflict (type_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_question_recipient_role_definitions (role_key, label, sort_order)
values
  ('buyer', 'Buyer', 10), ('seller', 'Seller', 20), ('buyer_attorney', 'Buyer Attorney', 30),
  ('seller_attorney', 'Seller Attorney', 40), ('title_company', 'Title Company', 50),
  ('realtor_broker', 'Realtor / Broker', 60), ('lender', 'Lender', 70), ('insurer', 'Insurer', 80),
  ('hoa_association', 'HOA / Association', 90), ('utility', 'Utility', 100),
  ('service_provider', 'Service Provider', 110), ('inspector', 'Inspector', 120),
  ('appraiser', 'Appraiser', 130), ('contractor_specialist', 'Contractor / Specialist', 140),
  ('municipality_county', 'Municipality / County', 150), ('other', 'Other', 160)
on conflict (role_key) do update set label = excluded.label, sort_order = excluded.sort_order;

alter table public.contracts drop constraint if exists contracts_deal_id_fkey;
alter table public.contracts drop constraint if exists contracts_perspective_check;

alter table public.contracts
  add column if not exists workspace_id uuid,
  add column if not exists property_id uuid,
  add column if not exists title text,
  add column if not exists effective_date date,
  add column if not exists execution_date date,
  add column if not exists expiration_date date,
  add column if not exists base_contract_id uuid,
  add column if not exists supersedes_contract_id uuid,
  add column if not exists superseded_by_contract_id uuid,
  add column if not exists source_evidence_id uuid,
  add column if not exists verification_state text,
  add column if not exists analysis_state text,
  add column if not exists confidence integer,
  add column if not exists version integer not null default 1,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists legacy_deal_id uuid,
  add column if not exists legacy_payload jsonb not null default '{}'::jsonb;

update public.contracts contract
set legacy_deal_id = coalesce(contract.legacy_deal_id, contract.deal_id),
    title = coalesce(nullif(btrim(contract.title), ''), nullif(btrim(contract.contract_name), ''), 'Contract document'),
    contract_type = coalesce(nullif(btrim(contract.contract_type), ''), 'other'),
    perspective = case when contract.perspective in ('buyer', 'seller', 'landlord', 'tenant', 'borrower', 'lender', 'developer', 'investor', 'guarantor') then contract.perspective else 'buyer' end,
    status = case when contract.status in ('draft', 'proposed', 'submitted', 'countered', 'partially_executed', 'executed', 'under_review', 'contingent', 'amended', 'superseded', 'terminated', 'cancelled', 'expired', 'closed', 'unknown') then contract.status else 'draft' end,
    verification_state = coalesce(contract.verification_state, 'unverified'),
    analysis_state = coalesce(contract.analysis_state, case when contract.contractiq_analysis is null then 'uploaded' else 'failed_with_prior_analysis' end),
    confidence = greatest(0, least(coalesce(contract.confidence, 50), 100)),
    created_by = coalesce(contract.created_by, contract.user_id),
    updated_by = coalesce(contract.updated_by, contract.user_id),
    legacy_payload = case
      when contract.legacy_payload = '{}'::jsonb then jsonb_strip_nulls(jsonb_build_object(
        'legacyUserId', contract.user_id,
        'legacyDealId', contract.deal_id,
        'buyerName', contract.buyer_name,
        'sellerName', contract.seller_name,
        'propertyAddress', contract.property_address,
        'purchasePrice', contract.purchase_price,
        'earnestMoney', contract.earnest_money,
        'inspectionPeriodDays', contract.inspection_period_days,
        'financingContingency', contract.financing_contingency,
        'appraisalContingency', contract.appraisal_contingency,
        'inspectionContingency', contract.inspection_contingency,
        'contractFileUrl', contract.contract_file_url,
        'legacyAnalysisPreserved', contract.contractiq_analysis is not null,
        'rawTextPreservedOnlyAsLegacyNonCanonical', contract.contract_text is not null
      ))
      else contract.legacy_payload
    end;

update public.contracts contract
set workspace_id = deal.workspace_id,
    property_id = coalesce(contract.property_id, primary_property.property_id)
from public.brix_deals deal
left join public.deal_properties primary_property
  on primary_property.workspace_id = deal.workspace_id
 and primary_property.deal_id = deal.id
 and primary_property.role = 'primary'
 and primary_property.inclusion_status = 'active'
where contract.workspace_id is null
  and contract.deal_id = deal.id;

update public.contracts contract
set workspace_id = membership.workspace_id
from public.workspace_memberships membership
where contract.workspace_id is null
  and membership.user_id = contract.user_id
  and membership.status = 'active';

update public.contracts contract
set deal_id = null
where deal_id is not null
  and not exists (
    select 1 from public.brix_deals deal
    where deal.id = contract.deal_id
      and deal.workspace_id = contract.workspace_id
  );

do $$
begin
  if exists (select 1 from public.contracts where workspace_id is null) then
    raise exception 'Cannot canonicalize legacy ContractIQ rows without workspace scope.' using errcode = '23502';
  end if;
end $$;

alter table public.contracts
  alter column workspace_id set not null,
  alter column title set not null,
  alter column contract_name drop not null,
  alter column contract_type set default 'other',
  alter column contract_type set not null,
  alter column perspective set default 'buyer',
  alter column perspective set not null,
  alter column status set default 'draft',
  alter column status set not null,
  alter column verification_state set default 'unverified',
  alter column verification_state set not null,
  alter column analysis_state set default 'uploaded',
  alter column analysis_state set not null,
  alter column confidence set default 50,
  alter column confidence set not null;

alter table public.contracts drop constraint if exists contracts_title_not_blank;
alter table public.contracts add constraint contracts_title_not_blank check (length(btrim(title)) > 0);
alter table public.contracts drop constraint if exists contracts_confidence_range;
alter table public.contracts add constraint contracts_confidence_range check (confidence between 0 and 100);
alter table public.contracts drop constraint if exists contracts_date_order;
alter table public.contracts add constraint contracts_date_order check (expiration_date is null or effective_date is null or expiration_date >= effective_date);
alter table public.contracts drop constraint if exists contracts_deal_or_property_scope;
alter table public.contracts add constraint contracts_deal_or_property_scope check (deal_id is not null or property_id is not null);
alter table public.contracts drop constraint if exists contracts_source_boundary;
alter table public.contracts add constraint contracts_source_boundary check (jsonb_typeof(legacy_payload) = 'object');

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contracts_workspace_id_id_unique' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_workspace_id_id_unique unique (workspace_id, id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_workspace_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_workspace_fk foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_deal_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_deal_fk foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_property_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_property_fk foreign key (workspace_id, property_id) references public.properties(workspace_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_type_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_type_fk foreign key (contract_type) references public.contract_type_definitions(type_key);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_status_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_status_fk foreign key (status) references public.contract_status_definitions(status_key);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_perspective_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_perspective_fk foreign key (perspective) references public.contract_perspective_definitions(perspective_key);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_verification_state_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_verification_state_fk foreign key (verification_state) references public.contract_verification_state_definitions(state_key);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_analysis_state_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_analysis_state_fk foreign key (analysis_state) references public.contract_analysis_state_definitions(state_key);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_source_evidence_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_base_contract_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_base_contract_fk foreign key (workspace_id, base_contract_id) references public.contracts(workspace_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_supersedes_contract_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_supersedes_contract_fk foreign key (workspace_id, supersedes_contract_id) references public.contracts(workspace_id, id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contracts_superseded_by_contract_fk' and conrelid = 'public.contracts'::regclass) then
    alter table public.contracts add constraint contracts_superseded_by_contract_fk foreign key (workspace_id, superseded_by_contract_id) references public.contracts(workspace_id, id) on delete set null;
  end if;
end $$;

create index if not exists idx_contracts_workspace_deal_updated on public.contracts(workspace_id, deal_id, updated_at desc) where archived_at is null;
create index if not exists idx_contracts_workspace_property_updated on public.contracts(workspace_id, property_id, updated_at desc) where archived_at is null;
create index if not exists idx_contracts_source_evidence_id on public.contracts(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_contracts_base_contract_id on public.contracts(workspace_id, base_contract_id) where base_contract_id is not null;
create index if not exists idx_contracts_supersedes_contract_id on public.contracts(workspace_id, supersedes_contract_id) where supersedes_contract_id is not null;
create index if not exists idx_contracts_superseded_by_contract_id on public.contracts(workspace_id, superseded_by_contract_id) where superseded_by_contract_id is not null;

drop trigger if exists touch_contracts on public.contracts;
create trigger touch_contracts before update on public.contracts for each row execute function public.touch_versioned_record();

create table if not exists public.contract_evidence_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  evidence_id uuid not null references public.evidence_items(id) on delete restrict,
  link_role text not null default 'source_document' check (link_role in ('source_document', 'email_body', 'attachment', 'exhibit', 'schedule', 'addendum', 'signature_page', 'supporting_record', 'other')),
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  verification_state text not null default 'source_backed' references public.contract_verification_state_definitions(state_key),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_evidence_links_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_evidence_links_evidence_workspace_fk foreign key (workspace_id, evidence_id) references public.evidence_items(workspace_id, id),
  unique (workspace_id, id),
  unique (workspace_id, contract_id, evidence_id, link_role)
);

create table if not exists public.contract_parties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  contact_id uuid references public.contacts(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  party_role text not null references public.contract_party_role_definitions(role_key),
  legal_name text,
  display_name text not null,
  authority_capacity text,
  signature_status text not null default 'unknown' check (signature_status in ('not_required', 'unsigned', 'partially_signed', 'signed', 'unknown')),
  signature_date date,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  verification_state text not null default 'unverified' references public.contract_verification_state_definitions(state_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_parties_subject_present check (contact_id is not null or organization_id is not null or length(btrim(display_name)) > 0),
  constraint contract_parties_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_parties_contact_fk foreign key (workspace_id, contact_id) references public.contacts(workspace_id, id),
  constraint contract_parties_organization_fk foreign key (workspace_id, organization_id) references public.organizations(workspace_id, id),
  constraint contract_parties_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  unique (workspace_id, id)
);

create table if not exists public.contract_terms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  term_category text not null references public.contract_term_category_definitions(category_key),
  term_type text not null,
  title text not null,
  normalized_value jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_value) = 'object'),
  display_value text,
  unit text,
  currency text,
  effective_date date,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  source_quote_ref text,
  confidence integer not null default 50 check (confidence between 0 and 100),
  verification_state text not null default 'unverified' references public.contract_verification_state_definitions(state_key),
  materiality text not null default 'unknown' check (materiality in ('immaterial', 'informational', 'material', 'critical', 'unknown')),
  proposal_state text not null default 'proposed' references public.contract_proposal_state_definitions(state_key),
  applicable_party_id uuid,
  applicable_perspective text references public.contract_perspective_definitions(perspective_key),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  rejected_by uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  decision_reason text,
  superseded_by_term_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_terms_title_not_blank check (length(btrim(title)) > 0),
  constraint contract_terms_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_terms_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_terms_applicable_party_fk foreign key (workspace_id, applicable_party_id) references public.contract_parties(workspace_id, id),
  constraint contract_terms_superseded_by_fk foreign key (workspace_id, superseded_by_term_id) references public.contract_terms(workspace_id, id),
  unique (workspace_id, id)
);

create index if not exists idx_contract_evidence_links_contract on public.contract_evidence_links(workspace_id, contract_id) where archived_at is null;
create index if not exists idx_contract_evidence_links_evidence on public.contract_evidence_links(workspace_id, evidence_id) where archived_at is null;
create index if not exists idx_contract_parties_contract on public.contract_parties(workspace_id, contract_id) where archived_at is null;
create index if not exists idx_contract_parties_contact on public.contract_parties(workspace_id, contact_id) where contact_id is not null;
create index if not exists idx_contract_parties_organization on public.contract_parties(workspace_id, organization_id) where organization_id is not null;
create index if not exists idx_contract_parties_source_evidence on public.contract_parties(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_contract_terms_contract on public.contract_terms(workspace_id, contract_id, updated_at desc) where archived_at is null;
create index if not exists idx_contract_terms_source_evidence on public.contract_terms(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_contract_terms_applicable_party on public.contract_terms(workspace_id, applicable_party_id) where applicable_party_id is not null;
create index if not exists idx_contract_terms_superseded_by on public.contract_terms(workspace_id, superseded_by_term_id) where superseded_by_term_id is not null;

create table if not exists public.contract_deadlines (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  contract_term_id uuid,
  deadline_type text not null,
  trigger_type text,
  trigger_date date,
  offset_value integer,
  offset_unit text check (offset_unit is null or offset_unit in ('calendar_days', 'business_days', 'hours', 'weeks', 'months')),
  business_day_rule text check (business_day_rule is null or business_day_rule in ('none', 'next_business_day', 'previous_business_day', 'nearest_business_day', 'professional_review_required')),
  holiday_calendar text,
  timezone text not null default 'UTC',
  calculated_due_at timestamptz,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  verification_state text not null default 'unverified' references public.contract_verification_state_definitions(state_key),
  canonical_task_id uuid references public.deadlines(id) on delete set null,
  status text not null default 'proposed' references public.contract_deadline_status_definitions(status_key),
  professional_review_required boolean not null default false,
  confidence integer not null default 50 check (confidence between 0 and 100),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_deadlines_no_engine_claim check (calculated_due_at is null or verification_state in ('verified', 'professional_verified')),
  constraint contract_deadlines_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_deadlines_term_fk foreign key (workspace_id, contract_term_id) references public.contract_terms(workspace_id, id),
  constraint contract_deadlines_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_deadlines_canonical_deadline_fk foreign key (workspace_id, canonical_task_id) references public.deadlines(workspace_id, id),
  unique (workspace_id, id)
);

create table if not exists public.contract_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  contract_term_id uuid,
  finding_category text not null references public.contract_finding_category_definitions(category_key),
  finding_type text not null,
  summary text not null,
  severity text not null default 'unknown' check (severity in ('informational', 'low', 'moderate', 'high', 'critical', 'unknown')),
  perspective text references public.contract_perspective_definitions(perspective_key),
  perspective_impact text,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  source_quote_ref text,
  confidence integer not null default 50 check (confidence between 0 and 100),
  verification_state text not null default 'unverified' references public.contract_verification_state_definitions(state_key),
  professional_review_required boolean not null default false,
  connected_proposal_id uuid,
  canonical_task_id uuid references public.tasks(id) on delete set null,
  proposal_state text not null default 'proposed' references public.contract_proposal_state_definitions(state_key),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_findings_summary_not_blank check (length(btrim(summary)) > 0),
  constraint contract_findings_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_findings_term_fk foreign key (workspace_id, contract_term_id) references public.contract_terms(workspace_id, id),
  constraint contract_findings_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_findings_task_fk foreign key (workspace_id, canonical_task_id) references public.tasks(workspace_id, id),
  unique (workspace_id, id)
);

create table if not exists public.contract_conflicts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  conflict_type text not null references public.contract_conflict_type_definitions(type_key),
  summary text not null,
  severity text not null default 'unknown' check (severity in ('informational', 'low', 'moderate', 'high', 'critical', 'unknown')),
  source_a_contract_id uuid,
  source_a_term_id uuid,
  source_a_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_a_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_a_anchor) = 'object'),
  source_b_contract_id uuid,
  source_b_term_id uuid,
  source_b_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_b_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_b_anchor) = 'object'),
  resolution_state text not null default 'unresolved' check (resolution_state in ('unresolved', 'under_review', 'resolved', 'accepted_as_is', 'professional_review_required', 'superseded')),
  resolution_notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  professional_review_required boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_conflicts_summary_not_blank check (length(btrim(summary)) > 0),
  constraint contract_conflicts_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_conflicts_source_a_contract_fk foreign key (workspace_id, source_a_contract_id) references public.contracts(workspace_id, id),
  constraint contract_conflicts_source_b_contract_fk foreign key (workspace_id, source_b_contract_id) references public.contracts(workspace_id, id),
  constraint contract_conflicts_source_a_term_fk foreign key (workspace_id, source_a_term_id) references public.contract_terms(workspace_id, id),
  constraint contract_conflicts_source_b_term_fk foreign key (workspace_id, source_b_term_id) references public.contract_terms(workspace_id, id),
  constraint contract_conflicts_source_a_evidence_fk foreign key (workspace_id, source_a_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_conflicts_source_b_evidence_fk foreign key (workspace_id, source_b_evidence_id) references public.evidence_items(workspace_id, id),
  unique (workspace_id, id)
);

create index if not exists idx_contract_deadlines_contract on public.contract_deadlines(workspace_id, contract_id, updated_at desc) where archived_at is null;
create index if not exists idx_contract_deadlines_term on public.contract_deadlines(workspace_id, contract_term_id) where contract_term_id is not null;
create index if not exists idx_contract_deadlines_source_evidence on public.contract_deadlines(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_contract_deadlines_canonical_task on public.contract_deadlines(workspace_id, canonical_task_id) where canonical_task_id is not null;
create index if not exists idx_contract_findings_contract on public.contract_findings(workspace_id, contract_id, updated_at desc) where archived_at is null;
create index if not exists idx_contract_findings_term on public.contract_findings(workspace_id, contract_term_id) where contract_term_id is not null;
create index if not exists idx_contract_findings_source_evidence on public.contract_findings(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_contract_findings_task on public.contract_findings(workspace_id, canonical_task_id) where canonical_task_id is not null;
create index if not exists idx_contract_conflicts_contract on public.contract_conflicts(workspace_id, contract_id, updated_at desc) where archived_at is null;
create index if not exists idx_contract_conflicts_source_a_contract on public.contract_conflicts(workspace_id, source_a_contract_id) where source_a_contract_id is not null;
create index if not exists idx_contract_conflicts_source_b_contract on public.contract_conflicts(workspace_id, source_b_contract_id) where source_b_contract_id is not null;
create index if not exists idx_contract_conflicts_source_a_term on public.contract_conflicts(workspace_id, source_a_term_id) where source_a_term_id is not null;
create index if not exists idx_contract_conflicts_source_b_term on public.contract_conflicts(workspace_id, source_b_term_id) where source_b_term_id is not null;
create index if not exists idx_contract_conflicts_source_a_evidence on public.contract_conflicts(workspace_id, source_a_evidence_id) where source_a_evidence_id is not null;
create index if not exists idx_contract_conflicts_source_b_evidence on public.contract_conflicts(workspace_id, source_b_evidence_id) where source_b_evidence_id is not null;

create table if not exists public.contract_relationships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  related_contract_id uuid not null,
  relationship_type text not null references public.contract_relationship_type_definitions(type_key),
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  verification_state text not null default 'unverified' references public.contract_verification_state_definitions(state_key),
  confidence integer not null default 50 check (confidence between 0 and 100),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_relationships_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_relationships_related_contract_fk foreign key (workspace_id, related_contract_id) references public.contracts(workspace_id, id) on delete restrict,
  constraint contract_relationships_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_relationships_no_self check (contract_id <> related_contract_id),
  unique (workspace_id, id),
  unique (workspace_id, contract_id, related_contract_id, relationship_type)
);

create table if not exists public.contract_change_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  contract_term_id uuid,
  contract_finding_id uuid,
  proposal_type text not null default 'discussion_draft' check (proposal_type in ('discussion_draft', 'business_term_change', 'clarification_request', 'remedy_option', 'other')),
  suggested_language text,
  rationale text not null,
  recipient_role text references public.contract_question_recipient_role_definitions(role_key),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  status text not null default 'proposed' references public.contract_proposal_state_definitions(state_key),
  professional_review_required boolean not null default true,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_change_proposals_rationale_not_blank check (length(btrim(rationale)) > 0),
  constraint contract_change_proposals_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_change_proposals_term_fk foreign key (workspace_id, contract_term_id) references public.contract_terms(workspace_id, id),
  constraint contract_change_proposals_finding_fk foreign key (workspace_id, contract_finding_id) references public.contract_findings(workspace_id, id),
  constraint contract_change_proposals_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  unique (workspace_id, id)
);

create table if not exists public.contract_questions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  contract_term_id uuid,
  contract_finding_id uuid,
  contract_conflict_id uuid,
  question text not null,
  recipient_role text not null references public.contract_question_recipient_role_definitions(role_key),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  rationale text not null,
  source_reason text,
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  perspective text references public.contract_perspective_definitions(perspective_key),
  status text not null default 'open' check (status in ('open', 'in_progress', 'answered', 'resolved', 'accepted', 'dismissed', 'superseded')),
  response text,
  response_source_evidence_id uuid references public.evidence_items(id) on delete set null,
  resolution_state text not null default 'unresolved' check (resolution_state in ('unresolved', 'resolved', 'accepted', 'professional_review_required', 'superseded')),
  report_inclusion jsonb not null default '{}'::jsonb check (jsonb_typeof(report_inclusion) = 'object'),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_questions_question_not_blank check (length(btrim(question)) > 0),
  constraint contract_questions_rationale_not_blank check (length(btrim(rationale)) > 0),
  constraint contract_questions_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_questions_term_fk foreign key (workspace_id, contract_term_id) references public.contract_terms(workspace_id, id),
  constraint contract_questions_finding_fk foreign key (workspace_id, contract_finding_id) references public.contract_findings(workspace_id, id),
  constraint contract_questions_conflict_fk foreign key (workspace_id, contract_conflict_id) references public.contract_conflicts(workspace_id, id),
  constraint contract_questions_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_questions_response_evidence_fk foreign key (workspace_id, response_source_evidence_id) references public.evidence_items(workspace_id, id),
  unique (workspace_id, id)
);

create index if not exists idx_contract_relationships_contract on public.contract_relationships(workspace_id, contract_id) where archived_at is null;
create index if not exists idx_contract_relationships_related on public.contract_relationships(workspace_id, related_contract_id) where archived_at is null;
create index if not exists idx_contract_relationships_source_evidence on public.contract_relationships(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_contract_change_proposals_contract on public.contract_change_proposals(workspace_id, contract_id, updated_at desc) where archived_at is null;
create index if not exists idx_contract_change_proposals_term on public.contract_change_proposals(workspace_id, contract_term_id) where contract_term_id is not null;
create index if not exists idx_contract_change_proposals_finding on public.contract_change_proposals(workspace_id, contract_finding_id) where contract_finding_id is not null;
create index if not exists idx_contract_change_proposals_source_evidence on public.contract_change_proposals(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_contract_questions_contract on public.contract_questions(workspace_id, contract_id, updated_at desc) where archived_at is null;
create index if not exists idx_contract_questions_term on public.contract_questions(workspace_id, contract_term_id) where contract_term_id is not null;
create index if not exists idx_contract_questions_finding on public.contract_questions(workspace_id, contract_finding_id) where contract_finding_id is not null;
create index if not exists idx_contract_questions_conflict on public.contract_questions(workspace_id, contract_conflict_id) where contract_conflict_id is not null;
create index if not exists idx_contract_questions_source_evidence on public.contract_questions(workspace_id, source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_contract_questions_response_evidence on public.contract_questions(workspace_id, response_source_evidence_id) where response_source_evidence_id is not null;

create table if not exists public.contract_record_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid,
  record_table text not null,
  record_id uuid not null,
  record_version integer not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  changed_by uuid references auth.users(id) on delete set null,
  change_reason text not null default 'updated',
  created_at timestamptz not null default now(),
  unique (record_table, record_id, record_version),
  constraint contract_record_versions_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade
);

create table if not exists public.contract_command_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid,
  property_id uuid,
  contract_id uuid,
  command_name text not null,
  idempotency_key text not null,
  request_hash text not null,
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint contract_command_requests_deal_fk foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contract_command_requests_property_fk foreign key (workspace_id, property_id) references public.properties(workspace_id, id) on delete restrict,
  constraint contract_command_requests_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  unique (workspace_id, idempotency_key)
);

create index if not exists idx_contract_record_versions_contract on public.contract_record_versions(workspace_id, contract_id, created_at desc) where contract_id is not null;
create index if not exists idx_contract_command_requests_creator on public.contract_command_requests(workspace_id, created_by, created_at desc);
create index if not exists idx_contract_command_requests_contract on public.contract_command_requests(workspace_id, contract_id, created_at desc) where contract_id is not null;

drop trigger if exists touch_contract_evidence_links on public.contract_evidence_links;
create trigger touch_contract_evidence_links before update on public.contract_evidence_links for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_parties on public.contract_parties;
create trigger touch_contract_parties before update on public.contract_parties for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_terms on public.contract_terms;
create trigger touch_contract_terms before update on public.contract_terms for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_deadlines on public.contract_deadlines;
create trigger touch_contract_deadlines before update on public.contract_deadlines for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_findings on public.contract_findings;
create trigger touch_contract_findings before update on public.contract_findings for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_conflicts on public.contract_conflicts;
create trigger touch_contract_conflicts before update on public.contract_conflicts for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_relationships on public.contract_relationships;
create trigger touch_contract_relationships before update on public.contract_relationships for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_change_proposals on public.contract_change_proposals;
create trigger touch_contract_change_proposals before update on public.contract_change_proposals for each row execute function public.touch_versioned_record();
drop trigger if exists touch_contract_questions on public.contract_questions;
create trigger touch_contract_questions before update on public.contract_questions for each row execute function public.touch_versioned_record();

create or replace function public.record_contract_version()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_contract_id uuid;
  reason text := 'updated';
begin
  if TG_TABLE_NAME = 'contracts' then
    parent_contract_id := old.id;
    if new.archived_at is not null and old.archived_at is null then
      reason := 'archived';
    end if;
  else
    parent_contract_id := old.contract_id;
    if TG_TABLE_NAME = 'contract_terms' then
      reason := coalesce(new.proposal_state, 'updated');
    elsif TG_TABLE_NAME = 'contract_conflicts' then
      reason := coalesce(new.resolution_state, 'updated');
    end if;
  end if;

  insert into public.contract_record_versions (workspace_id, contract_id, record_table, record_id, record_version, snapshot, changed_by, change_reason)
  values (
    old.workspace_id,
    parent_contract_id,
    TG_TABLE_NAME,
    old.id,
    old.version,
    to_jsonb(old),
    new.updated_by,
    reason
  )
  on conflict (record_table, record_id, record_version) do nothing;
  return new;
end;
$$;

drop trigger if exists record_contracts_version_on_update on public.contracts;
create trigger record_contracts_version_on_update after update on public.contracts for each row execute function public.record_contract_version();
drop trigger if exists record_contract_evidence_links_version_on_update on public.contract_evidence_links;
create trigger record_contract_evidence_links_version_on_update after update on public.contract_evidence_links for each row execute function public.record_contract_version();
drop trigger if exists record_contract_parties_version_on_update on public.contract_parties;
create trigger record_contract_parties_version_on_update after update on public.contract_parties for each row execute function public.record_contract_version();
drop trigger if exists record_contract_terms_version_on_update on public.contract_terms;
create trigger record_contract_terms_version_on_update after update on public.contract_terms for each row execute function public.record_contract_version();
drop trigger if exists record_contract_deadlines_version_on_update on public.contract_deadlines;
create trigger record_contract_deadlines_version_on_update after update on public.contract_deadlines for each row execute function public.record_contract_version();
drop trigger if exists record_contract_findings_version_on_update on public.contract_findings;
create trigger record_contract_findings_version_on_update after update on public.contract_findings for each row execute function public.record_contract_version();
drop trigger if exists record_contract_conflicts_version_on_update on public.contract_conflicts;
create trigger record_contract_conflicts_version_on_update after update on public.contract_conflicts for each row execute function public.record_contract_version();
drop trigger if exists record_contract_relationships_version_on_update on public.contract_relationships;
create trigger record_contract_relationships_version_on_update after update on public.contract_relationships for each row execute function public.record_contract_version();
drop trigger if exists record_contract_change_proposals_version_on_update on public.contract_change_proposals;
create trigger record_contract_change_proposals_version_on_update after update on public.contract_change_proposals for each row execute function public.record_contract_version();
drop trigger if exists record_contract_questions_version_on_update on public.contract_questions;
create trigger record_contract_questions_version_on_update after update on public.contract_questions for each row execute function public.record_contract_version();

create or replace view public.contract_projection
with (security_invoker = true)
as
select
  contract.id as contract_id,
  contract.version as contract_version,
  contract.workspace_id,
  contract.deal_id,
  contract.property_id,
  contract.contract_type,
  contract.title,
  contract.perspective,
  contract.status,
  contract.verification_state,
  contract.analysis_state,
  contract.confidence,
  count(distinct evidence_link.id) filter (where evidence_link.archived_at is null) as evidence_count,
  count(distinct party.id) filter (where party.archived_at is null) as party_count,
  count(distinct term.id) filter (where term.archived_at is null) as term_count,
  count(distinct term.id) filter (where term.proposal_state = 'accepted' and term.archived_at is null) as accepted_term_count,
  count(distinct deadline.id) filter (where deadline.archived_at is null) as deadline_count,
  count(distinct finding.id) filter (where finding.archived_at is null) as finding_count,
  count(distinct conflict.id) filter (where conflict.resolution_state in ('unresolved', 'under_review', 'professional_review_required') and conflict.archived_at is null) as unresolved_conflict_count,
  count(distinct question.id) filter (where question.status in ('open', 'in_progress') and question.archived_at is null) as open_question_count,
  bool_or(finding.professional_review_required) filter (where finding.archived_at is null)
    or bool_or(deadline.professional_review_required) filter (where deadline.archived_at is null)
    or bool_or(conflict.professional_review_required) filter (where conflict.archived_at is null)
    or contract.analysis_state = 'professional_review_required'
    as professional_review_required,
  jsonb_build_object(
    'sourceEvidenceId', contract.source_evidence_id,
    'sourceAnchoredTermCount', count(distinct term.id) filter (where term.source_anchor <> '{}'::jsonb and term.archived_at is null),
    'verificationRequiredCount',
      count(distinct term.id) filter (where term.verification_state in ('unverified', 'unknown', 'conflicted') and term.archived_at is null)
      + count(distinct deadline.id) filter (where deadline.verification_state in ('unverified', 'unknown', 'conflicted') and deadline.archived_at is null)
  ) as verification_summary,
  case
    when contract.archived_at is not null then 'archived'
    when contract.status = 'superseded' or contract.analysis_state = 'superseded' then 'superseded'
    when contract.status = 'expired' or contract.analysis_state = 'expired' then 'expired'
    when contract.analysis_state = 'no_contract' then 'no_contract'
    when contract.analysis_state = 'uploaded' then 'uploaded'
    when contract.analysis_state = 'processing' then 'processing'
    when contract.analysis_state = 'partial' then 'partial'
    when contract.analysis_state = 'awaiting_verification' then 'awaiting_verification'
    when contract.analysis_state = 'stale' then 'stale'
    when contract.analysis_state = 'failed_with_prior_analysis' then 'failed_with_prior_analysis'
    when contract.analysis_state = 'professional_review_required' then 'professional_review_required'
    when count(distinct conflict.id) filter (where conflict.resolution_state in ('unresolved', 'under_review', 'professional_review_required') and conflict.archived_at is null) > 0 then 'current_with_conflicts'
    when contract.analysis_state = 'current_with_conflicts' then 'current_with_conflicts'
    when contract.analysis_state = 'current' then 'current'
    else 'partial'
  end as projection_state,
  contract.updated_at,
  now() as loaded_at
from public.contracts contract
left join public.contract_evidence_links evidence_link on evidence_link.workspace_id = contract.workspace_id and evidence_link.contract_id = contract.id
left join public.contract_parties party on party.workspace_id = contract.workspace_id and party.contract_id = contract.id
left join public.contract_terms term on term.workspace_id = contract.workspace_id and term.contract_id = contract.id
left join public.contract_deadlines deadline on deadline.workspace_id = contract.workspace_id and deadline.contract_id = contract.id
left join public.contract_findings finding on finding.workspace_id = contract.workspace_id and finding.contract_id = contract.id
left join public.contract_conflicts conflict on conflict.workspace_id = contract.workspace_id and conflict.contract_id = contract.id
left join public.contract_questions question on question.workspace_id = contract.workspace_id and question.contract_id = contract.id
group by contract.id;

create or replace function public.ensure_contract_command(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_property_id uuid,
  target_contract_id uuid,
  command_name text,
  idempotency_key text,
  request_body jsonb
)
returns public.contract_command_requests
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  request_hash text;
  expected_command_name text := command_name;
  existing_request public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely save ContractIQ changes.' using errcode = '22023'; end if;
  request_hash := md5(target_workspace_id::text || coalesce(target_deal_id::text, '') || coalesce(target_property_id::text, '') || coalesce(target_contract_id::text, '') || expected_command_name || coalesce(request_body::text, '{}'));

  insert into public.contract_command_requests (workspace_id, deal_id, property_id, contract_id, command_name, idempotency_key, request_hash, created_by)
  values (target_workspace_id, target_deal_id, target_property_id, target_contract_id, expected_command_name, cleaned_key, request_hash, current_user_id)
  on conflict on constraint contract_command_requests_workspace_id_idempotency_key_key do nothing;

  select * into existing_request
  from public.contract_command_requests
  where contract_command_requests.workspace_id = target_workspace_id
    and contract_command_requests.idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash or existing_request.command_name <> expected_command_name then
    raise exception 'This retry key was already used for a different ContractIQ command.' using errcode = '23505';
  end if;

  return existing_request;
end;
$$;

create or replace function public.authorized_contract(target_contract_id uuid)
returns public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  target_contract public.contracts%rowtype;
begin
  select * into target_contract from public.contracts where id = target_contract_id and archived_at is null;
  if target_contract.id is null then raise exception 'Contract is not available.' using errcode = 'P0002'; end if;
  if not public.is_workspace_member(target_contract.workspace_id) then raise exception 'You do not have access to this ContractIQ record.' using errcode = '42501'; end if;
  return target_contract;
end;
$$;

create or replace function public.create_contract(target_workspace_id uuid, contract_input jsonb, idempotency_key text)
returns table (contract_id uuid, contract_version integer, workspace_id uuid, deal_id uuid, property_id uuid, status text, analysis_state text, idempotency_key_out text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(contract_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  inserted_contract public.contracts%rowtype;
  requested_deal_id uuid := nullif(safe_input ->> 'dealId', '')::uuid;
  requested_property_id uuid := nullif(safe_input ->> 'propertyId', '')::uuid;
begin
  if current_user_id is null then raise exception 'Authentication required to create ContractIQ records.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Contract input must be an object.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to manage ContractIQ in this BRIX workspace.' using errcode = '42501'; end if;
  if requested_deal_id is null then raise exception 'ContractIQ foundation requires a canonical Deal.' using errcode = '22023'; end if;

  select coalesce(requested_property_id, primary_property.property_id) into requested_property_id
  from public.brix_deals deal
  left join public.deal_properties primary_property on primary_property.workspace_id = deal.workspace_id and primary_property.deal_id = deal.id and primary_property.role = 'primary' and primary_property.inclusion_status = 'active'
  where deal.id = requested_deal_id and deal.workspace_id = target_workspace_id and deal.deleted_at is null;
  if requested_property_id is null then raise exception 'ContractIQ requires a canonical Property for this Deal.' using errcode = '22023'; end if;

  command := public.ensure_contract_command(target_workspace_id, requested_deal_id, requested_property_id, null, 'create_contract', idempotency_key, safe_input);
  if command.result ? 'contract_id' then
    select id, version, workspace_id, deal_id, property_id, status, analysis_state, command.idempotency_key
    into contract_id, contract_version, workspace_id, deal_id, property_id, status, analysis_state, idempotency_key_out
    from public.contracts where id = (command.result ->> 'contract_id')::uuid;
    return next;
    return;
  end if;

  insert into public.contracts (
    user_id, workspace_id, deal_id, property_id, contract_name, title, contract_type, perspective, status,
    effective_date, execution_date, expiration_date, closing_date, base_contract_id, supersedes_contract_id,
    source_evidence_id, verification_state, analysis_state, confidence, created_by, updated_by
  )
  values (
    current_user_id, target_workspace_id, requested_deal_id, requested_property_id,
    coalesce(nullif(btrim(safe_input ->> 'title'), ''), 'Contract document'),
    coalesce(nullif(btrim(safe_input ->> 'title'), ''), 'Contract document'),
    coalesce(nullif(btrim(safe_input ->> 'contractType'), ''), 'other'),
    coalesce(nullif(btrim(safe_input ->> 'perspective'), ''), 'buyer'),
    coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'draft'),
    nullif(safe_input ->> 'effectiveDate', '')::date,
    nullif(safe_input ->> 'executionDate', '')::date,
    nullif(safe_input ->> 'expirationDate', '')::date,
    nullif(safe_input ->> 'closingDate', '')::date,
    nullif(safe_input ->> 'baseContractId', '')::uuid,
    nullif(safe_input ->> 'supersedesContractId', '')::uuid,
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
    coalesce(nullif(btrim(safe_input ->> 'analysisState'), ''), 'uploaded'),
    greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
    current_user_id, current_user_id
  )
  returning * into inserted_contract;

  if inserted_contract.source_evidence_id is not null then
    insert into public.contract_evidence_links (workspace_id, contract_id, evidence_id, link_role, source_anchor, verification_state, created_by, updated_by)
    values (inserted_contract.workspace_id, inserted_contract.id, inserted_contract.source_evidence_id, 'source_document', '{}'::jsonb, inserted_contract.verification_state, current_user_id, current_user_id)
    on conflict on constraint contract_evidence_links_workspace_id_contract_id_evidence_i_key do nothing;
  end if;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (inserted_contract.workspace_id, inserted_contract.deal_id, inserted_contract.property_id, current_user_id, 'contract.document_received', 'contract', inserted_contract.id, inserted_contract.version, 'create_contract', command.idempotency_key || ':contract.document_received', jsonb_build_object('contract_id', inserted_contract.id, 'contract_version', inserted_contract.version, 'status', inserted_contract.status, 'source_evidence_id', inserted_contract.source_evidence_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (inserted_contract.workspace_id, inserted_contract.deal_id, inserted_contract.property_id, current_user_id, 'contract.document_received', 'contracts', 'contract', inserted_contract.id, 'create_contract', command.idempotency_key || ':audit', jsonb_build_object('contract_id', inserted_contract.id, 'version', inserted_contract.version), array['contracts'], jsonb_build_object('legal_conclusion_authority', false, 'downstream_mutation', false, 'evidence_storage_reused', inserted_contract.source_evidence_id is not null))
  on conflict do nothing;

  update public.contract_command_requests set result = jsonb_build_object('contract_id', inserted_contract.id, 'contract_version', inserted_contract.version) where id = command.id;
  contract_id := inserted_contract.id;
  contract_version := inserted_contract.version;
  workspace_id := inserted_contract.workspace_id;
  deal_id := inserted_contract.deal_id;
  property_id := inserted_contract.property_id;
  status := inserted_contract.status;
  analysis_state := inserted_contract.analysis_state;
  idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.update_contract(target_contract_id uuid, contract_input jsonb, expected_version integer, idempotency_key text)
returns table (contract_id uuid, contract_version integer, workspace_id uuid, deal_id uuid, property_id uuid, status text, analysis_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(contract_input, '{}'::jsonb));
  existing_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to update ContractIQ records.' using errcode = '42501'; end if;
  select * into existing_contract from public.contracts where id = target_contract_id and archived_at is null for update;
  if existing_contract.id is null then raise exception 'Contract is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update ContractIQ.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(existing_contract.workspace_id, existing_contract.deal_id, existing_contract.property_id, existing_contract.id, 'update_contract', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'contract_id' then
    select id, version, workspace_id, deal_id, property_id, status, analysis_state into contract_id, contract_version, workspace_id, deal_id, property_id, status, analysis_state
    from public.contracts where id = (command.result ->> 'contract_id')::uuid;
    return next;
    return;
  end if;
  if existing_contract.version <> expected_version then raise exception 'This ContractIQ record changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.contracts as contract
  set title = coalesce(nullif(btrim(safe_input ->> 'title'), ''), contract.title),
      contract_name = coalesce(nullif(btrim(safe_input ->> 'title'), ''), contract.contract_name),
      contract_type = coalesce(nullif(btrim(safe_input ->> 'contractType'), ''), contract.contract_type),
      perspective = coalesce(nullif(btrim(safe_input ->> 'perspective'), ''), contract.perspective),
      status = coalesce(nullif(btrim(safe_input ->> 'status'), ''), contract.status),
      effective_date = case when safe_input ? 'effectiveDate' then nullif(safe_input ->> 'effectiveDate', '')::date else contract.effective_date end,
      execution_date = case when safe_input ? 'executionDate' then nullif(safe_input ->> 'executionDate', '')::date else contract.execution_date end,
      expiration_date = case when safe_input ? 'expirationDate' then nullif(safe_input ->> 'expirationDate', '')::date else contract.expiration_date end,
      closing_date = case when safe_input ? 'closingDate' then nullif(safe_input ->> 'closingDate', '')::date else contract.closing_date end,
      base_contract_id = case when safe_input ? 'baseContractId' then nullif(safe_input ->> 'baseContractId', '')::uuid else contract.base_contract_id end,
      supersedes_contract_id = case when safe_input ? 'supersedesContractId' then nullif(safe_input ->> 'supersedesContractId', '')::uuid else contract.supersedes_contract_id end,
      superseded_by_contract_id = case when safe_input ? 'supersededByContractId' then nullif(safe_input ->> 'supersededByContractId', '')::uuid else contract.superseded_by_contract_id end,
      source_evidence_id = case when safe_input ? 'sourceEvidenceId' then nullif(safe_input ->> 'sourceEvidenceId', '')::uuid else contract.source_evidence_id end,
      verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), contract.verification_state),
      analysis_state = coalesce(nullif(btrim(safe_input ->> 'analysisState'), ''), contract.analysis_state),
      confidence = case when safe_input ? 'confidence' then greatest(0, least((safe_input ->> 'confidence')::integer, 100)) else contract.confidence end,
      updated_by = current_user_id
  where contract.id = existing_contract.id
  returning contract.id, contract.version, contract.workspace_id, contract.deal_id, contract.property_id, contract.status, contract.analysis_state
  into contract_id, contract_version, workspace_id, deal_id, property_id, status, analysis_state;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (workspace_id, deal_id, property_id, current_user_id, 'contract.status_changed', 'contract', contract_id, contract_version, 'update_contract', command.idempotency_key || ':contract.status_changed', jsonb_build_object('contract_id', contract_id, 'contract_version', contract_version, 'status', status, 'analysis_state', analysis_state))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (workspace_id, deal_id, property_id, current_user_id, 'contract.status_changed', 'contracts', 'contract', contract_id, 'update_contract', command.idempotency_key || ':audit', to_jsonb(existing_contract), jsonb_build_object('status', status, 'analysis_state', analysis_state, 'version', contract_version), jsonb_build_object('downstream_mutation', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_id', contract_id, 'contract_version', contract_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.archive_contract(target_contract_id uuid, expected_version integer, idempotency_key text, archive_reason text default 'user_archive')
returns table (contract_id uuid, contract_version integer, workspace_id uuid, deal_id uuid, property_id uuid, status text, archived_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  existing_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to archive ContractIQ records.' using errcode = '42501'; end if;
  select * into existing_contract from public.contracts where id = target_contract_id for update;
  if existing_contract.id is null then raise exception 'Contract is not available.' using errcode = 'P0002'; end if;
  if not public.has_workspace_permission(existing_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to archive ContractIQ.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(existing_contract.workspace_id, existing_contract.deal_id, existing_contract.property_id, existing_contract.id, 'archive_contract', idempotency_key, jsonb_build_object('expectedVersion', expected_version, 'reason', archive_reason));
  if command.result ? 'contract_id' then
    select id, version, workspace_id, deal_id, property_id, status, archived_at into contract_id, contract_version, workspace_id, deal_id, property_id, status, archived_at
    from public.contracts where id = (command.result ->> 'contract_id')::uuid;
    return next;
    return;
  end if;
  if existing_contract.version <> expected_version then raise exception 'This ContractIQ record changed after you opened it. Reload and try again.' using errcode = '40001'; end if;

  update public.contracts as contract
  set archived_at = coalesce(contract.archived_at, now()), updated_by = current_user_id
  where contract.id = existing_contract.id
  returning contract.id, contract.version, contract.workspace_id, contract.deal_id, contract.property_id, contract.status, contract.archived_at
  into contract_id, contract_version, workspace_id, deal_id, property_id, status, archived_at;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (workspace_id, deal_id, property_id, current_user_id, 'contract.archived', 'contracts', 'contract', contract_id, 'archive_contract', command.idempotency_key || ':audit', to_jsonb(existing_contract), jsonb_build_object('archived_at', archived_at, 'version', contract_version), jsonb_build_object('reason', archive_reason, 'downstream_mutation', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_id', contract_id, 'contract_version', contract_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.link_contract_evidence(target_contract_id uuid, evidence_input jsonb, idempotency_key text)
returns table (contract_evidence_link_id uuid, contract_id uuid, workspace_id uuid, evidence_id uuid, link_role text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(evidence_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_link public.contract_evidence_links%rowtype;
  requested_evidence_id uuid := nullif(safe_input ->> 'evidenceId', '')::uuid;
  requested_role text := coalesce(nullif(btrim(safe_input ->> 'linkRole'), ''), 'source_document');
begin
  if current_user_id is null then raise exception 'Authentication required to link ContractIQ Evidence.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to link ContractIQ Evidence.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'link_contract_evidence', idempotency_key, safe_input);
  if command.result ? 'contract_evidence_link_id' then
    select id, contract_id, workspace_id, evidence_id, link_role into contract_evidence_link_id, contract_id, workspace_id, evidence_id, link_role from public.contract_evidence_links where id = (command.result ->> 'contract_evidence_link_id')::uuid;
    return next;
    return;
  end if;

  insert into public.contract_evidence_links (workspace_id, contract_id, evidence_id, link_role, source_anchor, verification_state, created_by, updated_by)
  values (target_contract.workspace_id, target_contract.id, requested_evidence_id, requested_role, case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end, coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'source_backed'), current_user_id, current_user_id)
  on conflict on constraint contract_evidence_links_workspace_id_contract_id_evidence_i_key do update set updated_by = excluded.updated_by
  returning * into inserted_link;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.document_received', 'contract_evidence_link', inserted_link.id, inserted_link.version, 'link_contract_evidence', command.idempotency_key || ':contract.document_received', jsonb_build_object('contract_id', target_contract.id, 'evidence_id', inserted_link.evidence_id, 'evidence_storage_reused', true))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_evidence_link_id', inserted_link.id) where id = command.id;
  contract_evidence_link_id := inserted_link.id; contract_id := inserted_link.contract_id; workspace_id := inserted_link.workspace_id; evidence_id := inserted_link.evidence_id; link_role := inserted_link.link_role;
  return next;
end;
$$;

create or replace function public.add_contract_party(target_contract_id uuid, party_input jsonb, idempotency_key text)
returns table (contract_party_id uuid, contract_party_version integer, contract_id uuid, workspace_id uuid, party_role text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(party_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_party public.contract_parties%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save ContractIQ parties.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save ContractIQ parties.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'add_contract_party', idempotency_key, safe_input);
  if command.result ? 'contract_party_id' then
    select id, version, contract_id, workspace_id, party_role into contract_party_id, contract_party_version, contract_id, workspace_id, party_role from public.contract_parties where id = (command.result ->> 'contract_party_id')::uuid;
    return next;
    return;
  end if;

  insert into public.contract_parties (
    workspace_id, contract_id, contact_id, organization_id, party_role, legal_name, display_name, authority_capacity,
    signature_status, signature_date, source_evidence_id, source_anchor, verification_state, confidence, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, nullif(safe_input ->> 'contactId', '')::uuid, nullif(safe_input ->> 'organizationId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'partyRole'), ''), 'other'), nullif(btrim(safe_input ->> 'legalName'), ''),
    coalesce(nullif(btrim(safe_input ->> 'displayName'), ''), nullif(btrim(safe_input ->> 'legalName'), ''), 'Contract party'),
    nullif(btrim(safe_input ->> 'authorityCapacity'), ''), coalesce(nullif(btrim(safe_input ->> 'signatureStatus'), ''), 'unknown'),
    nullif(safe_input ->> 'signatureDate', '')::date, nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
    coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
    greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)), current_user_id, current_user_id
  )
  returning * into inserted_party;
  update public.contract_command_requests set result = jsonb_build_object('contract_party_id', inserted_party.id, 'contract_party_version', inserted_party.version) where id = command.id;
  contract_party_id := inserted_party.id; contract_party_version := inserted_party.version; contract_id := inserted_party.contract_id; workspace_id := inserted_party.workspace_id; party_role := inserted_party.party_role;
  return next;
end;
$$;

create or replace function public.update_contract_party(target_contract_party_id uuid, party_input jsonb, expected_version integer, idempotency_key text)
returns table (contract_party_id uuid, contract_party_version integer, contract_id uuid, workspace_id uuid, party_role text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(party_input, '{}'::jsonb));
  existing_party public.contract_parties%rowtype;
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to update ContractIQ parties.' using errcode = '42501'; end if;
  select * into existing_party from public.contract_parties where id = target_contract_party_id and archived_at is null for update;
  if existing_party.id is null then raise exception 'Contract party is not available.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(existing_party.contract_id);
  if not public.has_workspace_permission(existing_party.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update ContractIQ parties.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(existing_party.workspace_id, target_contract.deal_id, target_contract.property_id, existing_party.contract_id, 'update_contract_party', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'contract_party_id' then
    select id, version, contract_id, workspace_id, party_role into contract_party_id, contract_party_version, contract_id, workspace_id, party_role from public.contract_parties where id = (command.result ->> 'contract_party_id')::uuid;
    return next; return;
  end if;
  if existing_party.version <> expected_version then raise exception 'This contract party changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  update public.contract_parties as party
  set party_role = coalesce(nullif(btrim(safe_input ->> 'partyRole'), ''), party.party_role),
      legal_name = case when safe_input ? 'legalName' then nullif(btrim(safe_input ->> 'legalName'), '') else party.legal_name end,
      display_name = coalesce(nullif(btrim(safe_input ->> 'displayName'), ''), party.display_name),
      authority_capacity = case when safe_input ? 'authorityCapacity' then nullif(btrim(safe_input ->> 'authorityCapacity'), '') else party.authority_capacity end,
      signature_status = coalesce(nullif(btrim(safe_input ->> 'signatureStatus'), ''), party.signature_status),
      signature_date = case when safe_input ? 'signatureDate' then nullif(safe_input ->> 'signatureDate', '')::date else party.signature_date end,
      source_anchor = case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else party.source_anchor end,
      verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), party.verification_state),
      confidence = case when safe_input ? 'confidence' then greatest(0, least((safe_input ->> 'confidence')::integer, 100)) else party.confidence end,
      updated_by = current_user_id
  where party.id = existing_party.id
  returning party.id, party.version, party.contract_id, party.workspace_id, party.party_role into contract_party_id, contract_party_version, contract_id, workspace_id, party_role;
  update public.contract_command_requests set result = jsonb_build_object('contract_party_id', contract_party_id, 'contract_party_version', contract_party_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.add_contract_term(target_contract_id uuid, term_input jsonb, idempotency_key text)
returns table (contract_term_id uuid, contract_term_version integer, contract_id uuid, workspace_id uuid, proposal_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(term_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_term public.contract_terms%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save ContractIQ terms.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save ContractIQ terms.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'add_contract_term', idempotency_key, safe_input);
  if command.result ? 'contract_term_id' then
    select id, version, contract_id, workspace_id, proposal_state into contract_term_id, contract_term_version, contract_id, workspace_id, proposal_state from public.contract_terms where id = (command.result ->> 'contract_term_id')::uuid;
    return next; return;
  end if;

  insert into public.contract_terms (
    workspace_id, contract_id, term_category, term_type, title, normalized_value, display_value, unit, currency,
    effective_date, source_evidence_id, source_anchor, source_quote_ref, confidence, verification_state,
    materiality, proposal_state, applicable_party_id, applicable_perspective, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, coalesce(nullif(btrim(safe_input ->> 'termCategory'), ''), 'other'),
    coalesce(nullif(btrim(safe_input ->> 'termType'), ''), 'other'), coalesce(nullif(btrim(safe_input ->> 'title'), ''), 'Contract term'),
    case when jsonb_typeof(safe_input -> 'normalizedValue') = 'object' then safe_input -> 'normalizedValue' else '{}'::jsonb end,
    nullif(btrim(safe_input ->> 'displayValue'), ''), nullif(btrim(safe_input ->> 'unit'), ''), upper(nullif(btrim(safe_input ->> 'currency'), '')),
    nullif(safe_input ->> 'effectiveDate', '')::date, nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
    nullif(btrim(safe_input ->> 'sourceQuoteRef'), ''), greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
    coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'), coalesce(nullif(btrim(safe_input ->> 'materiality'), ''), 'unknown'),
    coalesce(nullif(btrim(safe_input ->> 'proposalState'), ''), 'proposed'), nullif(safe_input ->> 'applicablePartyId', '')::uuid,
    nullif(btrim(safe_input ->> 'applicablePerspective'), ''), current_user_id, current_user_id
  )
  returning * into inserted_term;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.term_proposed', 'contract_term', inserted_term.id, inserted_term.version, 'add_contract_term', command.idempotency_key || ':contract.term_proposed', jsonb_build_object('contract_id', target_contract.id, 'contract_term_id', inserted_term.id, 'downstream_mutation', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_term_id', inserted_term.id, 'contract_term_version', inserted_term.version) where id = command.id;
  contract_term_id := inserted_term.id; contract_term_version := inserted_term.version; contract_id := inserted_term.contract_id; workspace_id := inserted_term.workspace_id; proposal_state := inserted_term.proposal_state;
  return next;
end;
$$;

create or replace function public.update_contract_term(target_contract_term_id uuid, term_input jsonb, expected_version integer, idempotency_key text)
returns table (contract_term_id uuid, contract_term_version integer, contract_id uuid, workspace_id uuid, proposal_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(term_input, '{}'::jsonb));
  existing_term public.contract_terms%rowtype;
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to update ContractIQ terms.' using errcode = '42501'; end if;
  select * into existing_term from public.contract_terms where id = target_contract_term_id and archived_at is null for update;
  if existing_term.id is null then raise exception 'Contract term is not available.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(existing_term.contract_id);
  if not public.has_workspace_permission(existing_term.workspace_id, 'deals:manage') then raise exception 'You do not have permission to update ContractIQ terms.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(existing_term.workspace_id, target_contract.deal_id, target_contract.property_id, existing_term.contract_id, 'update_contract_term', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'contract_term_id' then
    select id, version, contract_id, workspace_id, proposal_state into contract_term_id, contract_term_version, contract_id, workspace_id, proposal_state from public.contract_terms where id = (command.result ->> 'contract_term_id')::uuid;
    return next; return;
  end if;
  if existing_term.version <> expected_version then raise exception 'This contract term changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  update public.contract_terms as term
  set term_category = coalesce(nullif(btrim(safe_input ->> 'termCategory'), ''), term.term_category),
      term_type = coalesce(nullif(btrim(safe_input ->> 'termType'), ''), term.term_type),
      title = coalesce(nullif(btrim(safe_input ->> 'title'), ''), term.title),
      normalized_value = case when jsonb_typeof(safe_input -> 'normalizedValue') = 'object' then safe_input -> 'normalizedValue' else term.normalized_value end,
      display_value = case when safe_input ? 'displayValue' then nullif(btrim(safe_input ->> 'displayValue'), '') else term.display_value end,
      source_anchor = case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else term.source_anchor end,
      verification_state = coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), term.verification_state),
      materiality = coalesce(nullif(btrim(safe_input ->> 'materiality'), ''), term.materiality),
      updated_by = current_user_id
  where term.id = existing_term.id
  returning term.id, term.version, term.contract_id, term.workspace_id, term.proposal_state into contract_term_id, contract_term_version, contract_id, workspace_id, proposal_state;
  update public.contract_command_requests set result = jsonb_build_object('contract_term_id', contract_term_id, 'contract_term_version', contract_term_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.set_contract_term_acceptance(target_contract_term_id uuid, acceptance_state text, expected_version integer, idempotency_key text, decision_reason text default null)
returns table (contract_term_id uuid, contract_term_version integer, contract_id uuid, workspace_id uuid, proposal_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  existing_term public.contract_terms%rowtype;
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  normalized_state text := nullif(btrim(acceptance_state), '');
  event_name text;
begin
  if current_user_id is null then raise exception 'Authentication required to decide ContractIQ terms.' using errcode = '42501'; end if;
  if normalized_state not in ('accepted', 'rejected', 'disputed', 'superseded', 'expired') then raise exception 'Unsupported ContractIQ term decision.' using errcode = '22023'; end if;
  select * into existing_term from public.contract_terms where id = target_contract_term_id and archived_at is null for update;
  if existing_term.id is null then raise exception 'Contract term is not available.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(existing_term.contract_id);
  if not public.has_workspace_permission(existing_term.workspace_id, 'deals:manage') then raise exception 'You do not have permission to decide ContractIQ terms.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(existing_term.workspace_id, target_contract.deal_id, target_contract.property_id, existing_term.contract_id, 'set_contract_term_acceptance', idempotency_key, jsonb_build_object('termId', target_contract_term_id, 'acceptanceState', normalized_state, 'expectedVersion', expected_version, 'reason', decision_reason));
  if command.result ? 'contract_term_id' then
    select term.id, term.version, term.contract_id, term.workspace_id, term.proposal_state into contract_term_id, contract_term_version, contract_id, workspace_id, proposal_state from public.contract_terms term where term.id = (command.result ->> 'contract_term_id')::uuid;
    return next; return;
  end if;
  if existing_term.version <> expected_version then raise exception 'This contract term changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  update public.contract_terms as term
  set proposal_state = normalized_state,
      accepted_by = case when normalized_state = 'accepted' then current_user_id else term.accepted_by end,
      accepted_at = case when normalized_state = 'accepted' then now() else term.accepted_at end,
      rejected_by = case when normalized_state = 'rejected' then current_user_id else term.rejected_by end,
      rejected_at = case when normalized_state = 'rejected' then now() else term.rejected_at end,
      decision_reason = set_contract_term_acceptance.decision_reason,
      updated_by = current_user_id
  where term.id = existing_term.id
  returning term.id, term.version, term.contract_id, term.workspace_id, term.proposal_state into contract_term_id, contract_term_version, contract_id, workspace_id, proposal_state;
  event_name := case when normalized_state = 'accepted' then 'contract.term_accepted' else 'contract.term_rejected' end;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_term.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, event_name, 'contract_term', contract_term_id, contract_term_version, 'set_contract_term_acceptance', command.idempotency_key || ':' || event_name, jsonb_build_object('contract_id', contract_id, 'contract_term_id', contract_term_id, 'proposal_state', proposal_state, 'downstream_mutation', false))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_term.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, event_name, 'contract_terms', 'contract_term', contract_term_id, 'set_contract_term_acceptance', command.idempotency_key || ':audit', to_jsonb(existing_term), jsonb_build_object('contract_term_id', contract_term_id, 'version', contract_term_version, 'proposal_state', proposal_state), jsonb_build_object('downstream_mutation', false, 'professional_legal_conclusion', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_term_id', contract_term_id, 'contract_term_version', contract_term_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.accept_contract_term(target_contract_term_id uuid, expected_version integer, idempotency_key text, decision_reason text default null)
returns table (contract_term_id uuid, contract_term_version integer, contract_id uuid, workspace_id uuid, proposal_state text)
language sql
security definer
set search_path = public
as $$
  select * from public.set_contract_term_acceptance(target_contract_term_id, 'accepted', expected_version, idempotency_key, decision_reason);
$$;

create or replace function public.reject_contract_term(target_contract_term_id uuid, expected_version integer, idempotency_key text, decision_reason text default null)
returns table (contract_term_id uuid, contract_term_version integer, contract_id uuid, workspace_id uuid, proposal_state text)
language sql
security definer
set search_path = public
as $$
  select * from public.set_contract_term_acceptance(target_contract_term_id, 'rejected', expected_version, idempotency_key, decision_reason);
$$;

create or replace function public.add_contract_deadline(target_contract_id uuid, deadline_input jsonb, idempotency_key text)
returns table (contract_deadline_id uuid, contract_deadline_version integer, contract_id uuid, workspace_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(deadline_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_deadline public.contract_deadlines%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save ContractIQ deadlines.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save ContractIQ deadlines.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'add_contract_deadline', idempotency_key, safe_input);
  if command.result ? 'contract_deadline_id' then
    select id, version, contract_id, workspace_id, status into contract_deadline_id, contract_deadline_version, contract_id, workspace_id, status from public.contract_deadlines where id = (command.result ->> 'contract_deadline_id')::uuid;
    return next; return;
  end if;
  insert into public.contract_deadlines (
    workspace_id, contract_id, contract_term_id, deadline_type, trigger_type, trigger_date, offset_value,
    offset_unit, business_day_rule, holiday_calendar, timezone, calculated_due_at, source_evidence_id,
    source_anchor, verification_state, canonical_task_id, status, professional_review_required,
    confidence, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, nullif(safe_input ->> 'contractTermId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'deadlineType'), ''), 'other'), nullif(btrim(safe_input ->> 'triggerType'), ''),
    nullif(safe_input ->> 'triggerDate', '')::date, nullif(safe_input ->> 'offsetValue', '')::integer,
    nullif(btrim(safe_input ->> 'offsetUnit'), ''), nullif(btrim(safe_input ->> 'businessDayRule'), ''),
    nullif(btrim(safe_input ->> 'holidayCalendar'), ''), coalesce(nullif(btrim(safe_input ->> 'timezone'), ''), 'UTC'),
    nullif(safe_input ->> 'calculatedDueAt', '')::timestamptz, nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
    coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'), nullif(safe_input ->> 'canonicalTaskId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'proposed'),
    coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, false),
    greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
    current_user_id, current_user_id
  )
  returning * into inserted_deadline;
  update public.contract_command_requests set result = jsonb_build_object('contract_deadline_id', inserted_deadline.id, 'contract_deadline_version', inserted_deadline.version) where id = command.id;
  contract_deadline_id := inserted_deadline.id; contract_deadline_version := inserted_deadline.version; contract_id := inserted_deadline.contract_id; workspace_id := inserted_deadline.workspace_id; status := inserted_deadline.status;
  return next;
end;
$$;

create or replace function public.add_contract_finding(target_contract_id uuid, finding_input jsonb, idempotency_key text)
returns table (contract_finding_id uuid, contract_finding_version integer, contract_id uuid, workspace_id uuid, proposal_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(finding_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_finding public.contract_findings%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save ContractIQ findings.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save ContractIQ findings.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'add_contract_finding', idempotency_key, safe_input);
  if command.result ? 'contract_finding_id' then
    select id, version, contract_id, workspace_id, proposal_state into contract_finding_id, contract_finding_version, contract_id, workspace_id, proposal_state from public.contract_findings where id = (command.result ->> 'contract_finding_id')::uuid;
    return next; return;
  end if;
  insert into public.contract_findings (
    workspace_id, contract_id, contract_term_id, finding_category, finding_type, summary, severity,
    perspective, perspective_impact, source_evidence_id, source_anchor, source_quote_ref, confidence,
    verification_state, professional_review_required, canonical_task_id, proposal_state, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, nullif(safe_input ->> 'contractTermId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'findingCategory'), ''), 'other'), coalesce(nullif(btrim(safe_input ->> 'findingType'), ''), 'other'),
    coalesce(nullif(btrim(safe_input ->> 'summary'), ''), 'Contract finding requires review.'),
    coalesce(nullif(btrim(safe_input ->> 'severity'), ''), 'unknown'), nullif(btrim(safe_input ->> 'perspective'), ''),
    nullif(btrim(safe_input ->> 'perspectiveImpact'), ''), nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
    nullif(btrim(safe_input ->> 'sourceQuoteRef'), ''), greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
    coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
    coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, false), nullif(safe_input ->> 'canonicalTaskId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'proposalState'), ''), 'proposed'), current_user_id, current_user_id
  )
  returning * into inserted_finding;
  update public.contract_command_requests set result = jsonb_build_object('contract_finding_id', inserted_finding.id, 'contract_finding_version', inserted_finding.version) where id = command.id;
  contract_finding_id := inserted_finding.id; contract_finding_version := inserted_finding.version; contract_id := inserted_finding.contract_id; workspace_id := inserted_finding.workspace_id; proposal_state := inserted_finding.proposal_state;
  return next;
end;
$$;

create or replace function public.create_contract_conflict(target_contract_id uuid, conflict_input jsonb, idempotency_key text)
returns table (contract_conflict_id uuid, contract_conflict_version integer, contract_id uuid, workspace_id uuid, resolution_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(conflict_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_conflict public.contract_conflicts%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save ContractIQ conflicts.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save ContractIQ conflicts.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'create_contract_conflict', idempotency_key, safe_input);
  if command.result ? 'contract_conflict_id' then
    select id, version, contract_id, workspace_id, resolution_state into contract_conflict_id, contract_conflict_version, contract_id, workspace_id, resolution_state from public.contract_conflicts where id = (command.result ->> 'contract_conflict_id')::uuid;
    return next; return;
  end if;
  insert into public.contract_conflicts (
    workspace_id, contract_id, conflict_type, summary, severity, source_a_contract_id, source_a_term_id,
    source_a_evidence_id, source_a_anchor, source_b_contract_id, source_b_term_id, source_b_evidence_id,
    source_b_anchor, resolution_state, professional_review_required, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, coalesce(nullif(btrim(safe_input ->> 'conflictType'), ''), 'other'),
    coalesce(nullif(btrim(safe_input ->> 'summary'), ''), 'Contract source conflict requires review.'),
    coalesce(nullif(btrim(safe_input ->> 'severity'), ''), 'unknown'), nullif(safe_input ->> 'sourceAContractId', '')::uuid,
    nullif(safe_input ->> 'sourceATermId', '')::uuid, nullif(safe_input ->> 'sourceAEvidenceId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAAnchor') = 'object' then safe_input -> 'sourceAAnchor' else '{}'::jsonb end,
    nullif(safe_input ->> 'sourceBContractId', '')::uuid, nullif(safe_input ->> 'sourceBTermId', '')::uuid,
    nullif(safe_input ->> 'sourceBEvidenceId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceBAnchor') = 'object' then safe_input -> 'sourceBAnchor' else '{}'::jsonb end,
    coalesce(nullif(btrim(safe_input ->> 'resolutionState'), ''), 'unresolved'),
    coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, true), current_user_id, current_user_id
  )
  returning * into inserted_conflict;
  update public.contracts set analysis_state = case when analysis_state = 'current' then 'current_with_conflicts' else analysis_state end, updated_by = current_user_id where id = target_contract.id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.conflict_detected', 'contract_conflict', inserted_conflict.id, inserted_conflict.version, 'create_contract_conflict', command.idempotency_key || ':contract.conflict_detected', jsonb_build_object('contract_id', target_contract.id, 'contract_conflict_id', inserted_conflict.id, 'source_a_preserved', true, 'source_b_preserved', true))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_conflict_id', inserted_conflict.id, 'contract_conflict_version', inserted_conflict.version) where id = command.id;
  contract_conflict_id := inserted_conflict.id; contract_conflict_version := inserted_conflict.version; contract_id := inserted_conflict.contract_id; workspace_id := inserted_conflict.workspace_id; resolution_state := inserted_conflict.resolution_state;
  return next;
end;
$$;

create or replace function public.resolve_contract_conflict(target_contract_conflict_id uuid, resolution_input jsonb, expected_version integer, idempotency_key text)
returns table (contract_conflict_id uuid, contract_conflict_version integer, contract_id uuid, workspace_id uuid, resolution_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(resolution_input, '{}'::jsonb));
  existing_conflict public.contract_conflicts%rowtype;
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to resolve ContractIQ conflicts.' using errcode = '42501'; end if;
  select * into existing_conflict from public.contract_conflicts where id = target_contract_conflict_id and archived_at is null for update;
  if existing_conflict.id is null then raise exception 'Contract conflict is not available.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(existing_conflict.contract_id);
  if not public.has_workspace_permission(existing_conflict.workspace_id, 'deals:manage') then raise exception 'You do not have permission to resolve ContractIQ conflicts.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(existing_conflict.workspace_id, target_contract.deal_id, target_contract.property_id, existing_conflict.contract_id, 'resolve_contract_conflict', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'contract_conflict_id' then
    select conflict.id, conflict.version, conflict.contract_id, conflict.workspace_id, conflict.resolution_state into contract_conflict_id, contract_conflict_version, contract_id, workspace_id, resolution_state from public.contract_conflicts conflict where conflict.id = (command.result ->> 'contract_conflict_id')::uuid;
    return next; return;
  end if;
  if existing_conflict.version <> expected_version then raise exception 'This contract conflict changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  update public.contract_conflicts as conflict
  set resolution_state = coalesce(nullif(btrim(safe_input ->> 'resolutionState'), ''), 'resolved'),
      resolution_notes = coalesce(nullif(btrim(safe_input ->> 'resolutionNotes'), ''), conflict.resolution_notes),
      resolved_by = coalesce(conflict.resolved_by, current_user_id),
      resolved_at = coalesce(conflict.resolved_at, now()),
      professional_review_required = case when safe_input ? 'professionalReviewRequired' then coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, conflict.professional_review_required) else conflict.professional_review_required end,
      updated_by = current_user_id
  where conflict.id = existing_conflict.id
  returning conflict.id, conflict.version, conflict.contract_id, conflict.workspace_id, conflict.resolution_state into contract_conflict_id, contract_conflict_version, contract_id, workspace_id, resolution_state;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_conflict.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.conflict_resolution_recorded', 'contract_conflict', contract_conflict_id, contract_conflict_version, 'resolve_contract_conflict', command.idempotency_key || ':contract.conflict_resolution_recorded', jsonb_build_object('contract_id', contract_id, 'contract_conflict_id', contract_conflict_id, 'resolution_state', resolution_state, 'downstream_mutation', false))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_conflict.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.conflict_resolution_recorded', 'contract_conflicts', 'contract_conflict', contract_conflict_id, 'resolve_contract_conflict', command.idempotency_key || ':audit', to_jsonb(existing_conflict), jsonb_build_object('contract_conflict_id', contract_conflict_id, 'version', contract_conflict_version, 'resolution_state', resolution_state), jsonb_build_object('downstream_mutation', false, 'professional_review_required', true))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_conflict_id', contract_conflict_id, 'contract_conflict_version', contract_conflict_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.add_contract_relationship(target_contract_id uuid, relationship_input jsonb, idempotency_key text)
returns table (contract_relationship_id uuid, contract_relationship_version integer, contract_id uuid, workspace_id uuid, relationship_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(relationship_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_relationship public.contract_relationships%rowtype;
  related_id uuid := nullif(safe_input ->> 'relatedContractId', '')::uuid;
begin
  if current_user_id is null then raise exception 'Authentication required to save ContractIQ relationships.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save ContractIQ relationships.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'add_contract_relationship', idempotency_key, safe_input);
  if command.result ? 'contract_relationship_id' then
    select id, version, contract_id, workspace_id, relationship_type into contract_relationship_id, contract_relationship_version, contract_id, workspace_id, relationship_type from public.contract_relationships where id = (command.result ->> 'contract_relationship_id')::uuid;
    return next; return;
  end if;
  insert into public.contract_relationships (workspace_id, contract_id, related_contract_id, relationship_type, source_evidence_id, source_anchor, verification_state, confidence, created_by, updated_by)
  values (target_contract.workspace_id, target_contract.id, related_id, coalesce(nullif(btrim(safe_input ->> 'relationshipType'), ''), 'related_to'), nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end, coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'), greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)), current_user_id, current_user_id)
  on conflict on constraint contract_relationships_workspace_id_contract_id_related_con_key do update set updated_by = excluded.updated_by
  returning * into inserted_relationship;
  update public.contract_command_requests set result = jsonb_build_object('contract_relationship_id', inserted_relationship.id, 'contract_relationship_version', inserted_relationship.version) where id = command.id;
  contract_relationship_id := inserted_relationship.id; contract_relationship_version := inserted_relationship.version; contract_id := inserted_relationship.contract_id; workspace_id := inserted_relationship.workspace_id; relationship_type := inserted_relationship.relationship_type;
  return next;
end;
$$;

create or replace function public.add_contract_question(target_contract_id uuid, question_input jsonb, idempotency_key text)
returns table (contract_question_id uuid, contract_question_version integer, contract_id uuid, workspace_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(question_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_question public.contract_questions%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save ContractIQ questions.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save ContractIQ questions.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'add_contract_question', idempotency_key, safe_input);
  if command.result ? 'contract_question_id' then
    select id, version, contract_id, workspace_id, status into contract_question_id, contract_question_version, contract_id, workspace_id, status from public.contract_questions where id = (command.result ->> 'contract_question_id')::uuid;
    return next; return;
  end if;
  insert into public.contract_questions (
    workspace_id, contract_id, contract_term_id, contract_finding_id, contract_conflict_id, question,
    recipient_role, priority, rationale, source_reason, source_evidence_id, source_anchor, perspective,
    status, report_inclusion, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, nullif(safe_input ->> 'contractTermId', '')::uuid,
    nullif(safe_input ->> 'contractFindingId', '')::uuid, nullif(safe_input ->> 'contractConflictId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'question'), ''), 'Confirm this contract item.'),
    coalesce(nullif(btrim(safe_input ->> 'recipientRole'), ''), 'other'), coalesce(nullif(btrim(safe_input ->> 'priority'), ''), 'normal'),
    coalesce(nullif(btrim(safe_input ->> 'rationale'), ''), 'The source record needs confirmation before reliance.'),
    nullif(btrim(safe_input ->> 'sourceReason'), ''), nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
    nullif(btrim(safe_input ->> 'perspective'), ''), coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'open'),
    case when jsonb_typeof(safe_input -> 'reportInclusion') = 'object' then safe_input -> 'reportInclusion' else '{}'::jsonb end,
    current_user_id, current_user_id
  )
  returning * into inserted_question;
  update public.contract_command_requests set result = jsonb_build_object('contract_question_id', inserted_question.id, 'contract_question_version', inserted_question.version) where id = command.id;
  contract_question_id := inserted_question.id; contract_question_version := inserted_question.version; contract_id := inserted_question.contract_id; workspace_id := inserted_question.workspace_id; status := inserted_question.status;
  return next;
end;
$$;

create or replace function public.add_contract_change_proposal(target_contract_id uuid, proposal_input jsonb, idempotency_key text)
returns table (contract_change_proposal_id uuid, contract_change_proposal_version integer, contract_id uuid, workspace_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(proposal_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_proposal public.contract_change_proposals%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to save ContractIQ change proposals.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save ContractIQ change proposals.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'add_contract_change_proposal', idempotency_key, safe_input);
  if command.result ? 'contract_change_proposal_id' then
    select id, version, contract_id, workspace_id, status into contract_change_proposal_id, contract_change_proposal_version, contract_id, workspace_id, status from public.contract_change_proposals where id = (command.result ->> 'contract_change_proposal_id')::uuid;
    return next; return;
  end if;
  insert into public.contract_change_proposals (
    workspace_id, contract_id, contract_term_id, contract_finding_id, proposal_type, suggested_language,
    rationale, recipient_role, priority, status, professional_review_required, source_evidence_id,
    source_anchor, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, nullif(safe_input ->> 'contractTermId', '')::uuid,
    nullif(safe_input ->> 'contractFindingId', '')::uuid, coalesce(nullif(btrim(safe_input ->> 'proposalType'), ''), 'discussion_draft'),
    nullif(btrim(safe_input ->> 'suggestedLanguage'), ''), coalesce(nullif(btrim(safe_input ->> 'rationale'), ''), 'Discussion draft requires professional review.'),
    nullif(btrim(safe_input ->> 'recipientRole'), ''), coalesce(nullif(btrim(safe_input ->> 'priority'), ''), 'normal'),
    coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'proposed'), coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, true),
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end,
    current_user_id, current_user_id
  )
  returning * into inserted_proposal;
  update public.contract_command_requests set result = jsonb_build_object('contract_change_proposal_id', inserted_proposal.id, 'contract_change_proposal_version', inserted_proposal.version) where id = command.id;
  contract_change_proposal_id := inserted_proposal.id; contract_change_proposal_version := inserted_proposal.version; contract_id := inserted_proposal.contract_id; workspace_id := inserted_proposal.workspace_id; status := inserted_proposal.status;
  return next;
end;
$$;

create or replace function public.list_contract_projection(target_deal_id uuid default null, target_property_id uuid default null)
returns table (
  contract_id uuid,
  contract_version integer,
  workspace_id uuid,
  deal_id uuid,
  property_id uuid,
  contract_type text,
  title text,
  perspective text,
  status text,
  verification_state text,
  analysis_state text,
  projection_state text,
  evidence_count bigint,
  party_count bigint,
  term_count bigint,
  accepted_term_count bigint,
  deadline_count bigint,
  finding_count bigint,
  unresolved_conflict_count bigint,
  open_question_count bigint,
  professional_review_required boolean,
  verification_summary jsonb,
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
  if auth.uid() is null then raise exception 'Authentication required to load ContractIQ.' using errcode = '42501'; end if;
  if target_deal_id is not null then
    select deal.workspace_id into target_workspace_id from public.brix_deals deal where deal.id = target_deal_id and deal.deleted_at is null;
  elsif target_property_id is not null then
    select property.workspace_id into target_workspace_id from public.properties property where property.id = target_property_id and property.deleted_at is null;
  else
    raise exception 'A Deal or Property target is required to load ContractIQ.' using errcode = '22023';
  end if;
  if target_workspace_id is null or not public.is_workspace_member(target_workspace_id) then raise exception 'ContractIQ target is not available.' using errcode = '42501'; end if;

  return query
  select projection.contract_id, projection.contract_version, projection.workspace_id, projection.deal_id, projection.property_id,
    projection.contract_type, projection.title, projection.perspective, projection.status, projection.verification_state,
    projection.analysis_state, projection.projection_state, projection.evidence_count, projection.party_count,
    projection.term_count, projection.accepted_term_count, projection.deadline_count, projection.finding_count,
    projection.unresolved_conflict_count, projection.open_question_count, projection.professional_review_required,
    projection.verification_summary, projection.updated_at, now()
  from public.contract_projection projection
  where projection.workspace_id = target_workspace_id
    and (target_deal_id is null or projection.deal_id = target_deal_id)
    and (target_property_id is null or projection.property_id = target_property_id)
    and projection.projection_state <> 'archived'
  order by projection.professional_review_required desc, projection.unresolved_conflict_count desc, projection.updated_at desc;
end;
$$;

create or replace function public.load_contract_detail(target_contract_id uuid)
returns table (
  record_type text,
  record_id uuid,
  record_version integer,
  workspace_id uuid,
  contract_id uuid,
  deal_id uuid,
  property_id uuid,
  label text,
  status text,
  verification_state text,
  source_evidence_id uuid,
  source_anchor jsonb,
  payload jsonb,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_contract public.contracts%rowtype;
begin
  target_contract := public.authorized_contract(target_contract_id);
  return query
  select 'contract'::text, target_contract.id, target_contract.version, target_contract.workspace_id, target_contract.id, target_contract.deal_id, target_contract.property_id, target_contract.title, target_contract.status, target_contract.verification_state, target_contract.source_evidence_id, '{}'::jsonb, jsonb_build_object('title', target_contract.title, 'contract_type', target_contract.contract_type, 'perspective', target_contract.perspective, 'status', target_contract.status, 'verification_state', target_contract.verification_state, 'analysis_state', target_contract.analysis_state, 'confidence', target_contract.confidence, 'source_evidence_id', target_contract.source_evidence_id, 'effective_date', target_contract.effective_date, 'execution_date', target_contract.execution_date, 'expiration_date', target_contract.expiration_date, 'closing_date', target_contract.closing_date), target_contract.updated_at
  union all
  select 'evidence_link'::text, link.id, link.version, link.workspace_id, link.contract_id, target_contract.deal_id, target_contract.property_id, link.link_role, link.link_role, link.verification_state, link.evidence_id, link.source_anchor, to_jsonb(link.*) - 'workspace_id' - 'contract_id', link.updated_at
  from public.contract_evidence_links link where link.workspace_id = target_contract.workspace_id and link.contract_id = target_contract.id and link.archived_at is null
  union all
  select 'party'::text, party.id, party.version, party.workspace_id, party.contract_id, target_contract.deal_id, target_contract.property_id, party.display_name, party.party_role, party.verification_state, party.source_evidence_id, party.source_anchor, to_jsonb(party.*) - 'workspace_id' - 'contract_id', party.updated_at
  from public.contract_parties party where party.workspace_id = target_contract.workspace_id and party.contract_id = target_contract.id and party.archived_at is null
  union all
  select 'term'::text, term.id, term.version, term.workspace_id, term.contract_id, target_contract.deal_id, target_contract.property_id, term.title, term.proposal_state, term.verification_state, term.source_evidence_id, term.source_anchor, to_jsonb(term.*) - 'workspace_id' - 'contract_id', term.updated_at
  from public.contract_terms term where term.workspace_id = target_contract.workspace_id and term.contract_id = target_contract.id and term.archived_at is null
  union all
  select 'deadline'::text, deadline.id, deadline.version, deadline.workspace_id, deadline.contract_id, target_contract.deal_id, target_contract.property_id, deadline.deadline_type, deadline.status, deadline.verification_state, deadline.source_evidence_id, deadline.source_anchor, to_jsonb(deadline.*) - 'workspace_id' - 'contract_id', deadline.updated_at
  from public.contract_deadlines deadline where deadline.workspace_id = target_contract.workspace_id and deadline.contract_id = target_contract.id and deadline.archived_at is null
  union all
  select 'finding'::text, finding.id, finding.version, finding.workspace_id, finding.contract_id, target_contract.deal_id, target_contract.property_id, finding.summary, finding.proposal_state, finding.verification_state, finding.source_evidence_id, finding.source_anchor, to_jsonb(finding.*) - 'workspace_id' - 'contract_id', finding.updated_at
  from public.contract_findings finding where finding.workspace_id = target_contract.workspace_id and finding.contract_id = target_contract.id and finding.archived_at is null
  union all
  select 'conflict'::text, conflict.id, conflict.version, conflict.workspace_id, conflict.contract_id, target_contract.deal_id, target_contract.property_id, conflict.summary, conflict.resolution_state, case when conflict.professional_review_required then 'unknown' else 'source_backed' end, conflict.source_a_evidence_id, conflict.source_a_anchor, to_jsonb(conflict.*) - 'workspace_id' - 'contract_id', conflict.updated_at
  from public.contract_conflicts conflict where conflict.workspace_id = target_contract.workspace_id and conflict.contract_id = target_contract.id and conflict.archived_at is null
  union all
  select 'relationship'::text, relationship.id, relationship.version, relationship.workspace_id, relationship.contract_id, target_contract.deal_id, target_contract.property_id, relationship.relationship_type, relationship.relationship_type, relationship.verification_state, relationship.source_evidence_id, relationship.source_anchor, to_jsonb(relationship.*) - 'workspace_id' - 'contract_id', relationship.updated_at
  from public.contract_relationships relationship where relationship.workspace_id = target_contract.workspace_id and relationship.contract_id = target_contract.id and relationship.archived_at is null
  union all
  select 'change_proposal'::text, proposal.id, proposal.version, proposal.workspace_id, proposal.contract_id, target_contract.deal_id, target_contract.property_id, proposal.proposal_type, proposal.status, case when proposal.professional_review_required then 'unknown' else 'source_backed' end, proposal.source_evidence_id, proposal.source_anchor, to_jsonb(proposal.*) - 'workspace_id' - 'contract_id', proposal.updated_at
  from public.contract_change_proposals proposal where proposal.workspace_id = target_contract.workspace_id and proposal.contract_id = target_contract.id and proposal.archived_at is null
  union all
  select 'question'::text, question.id, question.version, question.workspace_id, question.contract_id, target_contract.deal_id, target_contract.property_id, question.question, question.status, question.resolution_state, question.source_evidence_id, question.source_anchor, to_jsonb(question.*) - 'workspace_id' - 'contract_id', question.updated_at
  from public.contract_questions question where question.workspace_id = target_contract.workspace_id and question.contract_id = target_contract.id and question.archived_at is null;
end;
$$;

alter table public.contract_type_definitions enable row level security;
alter table public.contract_status_definitions enable row level security;
alter table public.contract_perspective_definitions enable row level security;
alter table public.contract_verification_state_definitions enable row level security;
alter table public.contract_analysis_state_definitions enable row level security;
alter table public.contract_party_role_definitions enable row level security;
alter table public.contract_term_category_definitions enable row level security;
alter table public.contract_proposal_state_definitions enable row level security;
alter table public.contract_deadline_status_definitions enable row level security;
alter table public.contract_finding_category_definitions enable row level security;
alter table public.contract_conflict_type_definitions enable row level security;
alter table public.contract_relationship_type_definitions enable row level security;
alter table public.contract_question_recipient_role_definitions enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_evidence_links enable row level security;
alter table public.contract_parties enable row level security;
alter table public.contract_terms enable row level security;
alter table public.contract_deadlines enable row level security;
alter table public.contract_findings enable row level security;
alter table public.contract_conflicts enable row level security;
alter table public.contract_relationships enable row level security;
alter table public.contract_change_proposals enable row level security;
alter table public.contract_questions enable row level security;
alter table public.contract_record_versions enable row level security;
alter table public.contract_command_requests enable row level security;

drop policy if exists "Users can view own contracts" on public.contracts;
drop policy if exists "Users can create own contracts" on public.contracts;
drop policy if exists "Users can update own contracts" on public.contracts;
drop policy if exists "Users can delete own contracts" on public.contracts;
drop policy if exists "Admins can view all contracts" on public.contracts;

create policy "contract type definitions readable" on public.contract_type_definitions for select to authenticated using (true);
create policy "contract status definitions readable" on public.contract_status_definitions for select to authenticated using (true);
create policy "contract perspective definitions readable" on public.contract_perspective_definitions for select to authenticated using (true);
create policy "contract verification definitions readable" on public.contract_verification_state_definitions for select to authenticated using (true);
create policy "contract analysis definitions readable" on public.contract_analysis_state_definitions for select to authenticated using (true);
create policy "contract party role definitions readable" on public.contract_party_role_definitions for select to authenticated using (true);
create policy "contract term category definitions readable" on public.contract_term_category_definitions for select to authenticated using (true);
create policy "contract proposal state definitions readable" on public.contract_proposal_state_definitions for select to authenticated using (true);
create policy "contract deadline status definitions readable" on public.contract_deadline_status_definitions for select to authenticated using (true);
create policy "contract finding category definitions readable" on public.contract_finding_category_definitions for select to authenticated using (true);
create policy "contract conflict type definitions readable" on public.contract_conflict_type_definitions for select to authenticated using (true);
create policy "contract relationship type definitions readable" on public.contract_relationship_type_definitions for select to authenticated using (true);
create policy "contract question recipient definitions readable" on public.contract_question_recipient_role_definitions for select to authenticated using (true);

create policy "contracts read workspace members" on public.contracts for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "contracts no direct insert" on public.contracts for insert to authenticated with check (false);
create policy "contracts no direct update" on public.contracts for update to authenticated using (false) with check (false);
create policy "contracts no direct delete" on public.contracts for delete to authenticated using (false);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'contract_evidence_links', 'contract_parties', 'contract_terms', 'contract_deadlines',
    'contract_findings', 'contract_conflicts', 'contract_relationships', 'contract_change_proposals',
    'contract_questions', 'contract_record_versions'
  ]
  loop
    execute format('create policy "%s read workspace members" on public.%I for select to authenticated using ((select public.is_workspace_member(workspace_id)))', replace(target_table, '_', ' '), target_table);
    execute format('create policy "%s no direct insert" on public.%I for insert to authenticated with check (false)', replace(target_table, '_', ' '), target_table);
    execute format('create policy "%s no direct update" on public.%I for update to authenticated using (false) with check (false)', replace(target_table, '_', ' '), target_table);
    execute format('create policy "%s no direct delete" on public.%I for delete to authenticated using (false)', replace(target_table, '_', ' '), target_table);
  end loop;
end $$;

create policy "contract command requests read creator" on public.contract_command_requests for select to authenticated using (created_by = (select auth.uid()) and (select public.is_workspace_member(workspace_id)));
create policy "contract command requests no direct insert" on public.contract_command_requests for insert to authenticated with check (false);
create policy "contract command requests no direct update" on public.contract_command_requests for update to authenticated using (false) with check (false);
create policy "contract command requests no direct delete" on public.contract_command_requests for delete to authenticated using (false);

grant select on public.contract_type_definitions to authenticated;
grant select on public.contract_status_definitions to authenticated;
grant select on public.contract_perspective_definitions to authenticated;
grant select on public.contract_verification_state_definitions to authenticated;
grant select on public.contract_analysis_state_definitions to authenticated;
grant select on public.contract_party_role_definitions to authenticated;
grant select on public.contract_term_category_definitions to authenticated;
grant select on public.contract_proposal_state_definitions to authenticated;
grant select on public.contract_deadline_status_definitions to authenticated;
grant select on public.contract_finding_category_definitions to authenticated;
grant select on public.contract_conflict_type_definitions to authenticated;
grant select on public.contract_relationship_type_definitions to authenticated;
grant select on public.contract_question_recipient_role_definitions to authenticated;
grant select on public.contracts to authenticated;
grant select on public.contract_evidence_links to authenticated;
grant select on public.contract_parties to authenticated;
grant select on public.contract_terms to authenticated;
grant select on public.contract_deadlines to authenticated;
grant select on public.contract_findings to authenticated;
grant select on public.contract_conflicts to authenticated;
grant select on public.contract_relationships to authenticated;
grant select on public.contract_change_proposals to authenticated;
grant select on public.contract_questions to authenticated;
grant select on public.contract_record_versions to authenticated;
grant select on public.contract_command_requests to authenticated;
grant select on public.contract_projection to authenticated;

revoke insert, update, delete on public.contracts from authenticated;
revoke insert, update, delete on public.contract_evidence_links from authenticated;
revoke insert, update, delete on public.contract_parties from authenticated;
revoke insert, update, delete on public.contract_terms from authenticated;
revoke insert, update, delete on public.contract_deadlines from authenticated;
revoke insert, update, delete on public.contract_findings from authenticated;
revoke insert, update, delete on public.contract_conflicts from authenticated;
revoke insert, update, delete on public.contract_relationships from authenticated;
revoke insert, update, delete on public.contract_change_proposals from authenticated;
revoke insert, update, delete on public.contract_questions from authenticated;
revoke insert, update, delete on public.contract_record_versions from authenticated;
revoke insert, update, delete on public.contract_command_requests from authenticated;

revoke all on function public.record_contract_version() from public;
revoke all on function public.ensure_contract_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public;
revoke all on function public.authorized_contract(uuid) from public;
revoke all on function public.create_contract(uuid, jsonb, text) from public;
revoke all on function public.update_contract(uuid, jsonb, integer, text) from public;
revoke all on function public.archive_contract(uuid, integer, text, text) from public;
revoke all on function public.link_contract_evidence(uuid, jsonb, text) from public;
revoke all on function public.add_contract_party(uuid, jsonb, text) from public;
revoke all on function public.update_contract_party(uuid, jsonb, integer, text) from public;
revoke all on function public.add_contract_term(uuid, jsonb, text) from public;
revoke all on function public.update_contract_term(uuid, jsonb, integer, text) from public;
revoke all on function public.set_contract_term_acceptance(uuid, text, integer, text, text) from public;
revoke all on function public.accept_contract_term(uuid, integer, text, text) from public;
revoke all on function public.reject_contract_term(uuid, integer, text, text) from public;
revoke all on function public.add_contract_deadline(uuid, jsonb, text) from public;
revoke all on function public.add_contract_finding(uuid, jsonb, text) from public;
revoke all on function public.create_contract_conflict(uuid, jsonb, text) from public;
revoke all on function public.resolve_contract_conflict(uuid, jsonb, integer, text) from public;
revoke all on function public.add_contract_relationship(uuid, jsonb, text) from public;
revoke all on function public.add_contract_question(uuid, jsonb, text) from public;
revoke all on function public.add_contract_change_proposal(uuid, jsonb, text) from public;
revoke all on function public.list_contract_projection(uuid, uuid) from public;
revoke all on function public.load_contract_detail(uuid) from public;

revoke execute on function public.record_contract_version() from public, anon, authenticated;
revoke execute on function public.ensure_contract_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.authorized_contract(uuid) from public, anon, authenticated;
revoke execute on function public.create_contract(uuid, jsonb, text) from public, anon;
revoke execute on function public.update_contract(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.archive_contract(uuid, integer, text, text) from public, anon;
revoke execute on function public.link_contract_evidence(uuid, jsonb, text) from public, anon;
revoke execute on function public.add_contract_party(uuid, jsonb, text) from public, anon;
revoke execute on function public.update_contract_party(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.add_contract_term(uuid, jsonb, text) from public, anon;
revoke execute on function public.update_contract_term(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.set_contract_term_acceptance(uuid, text, integer, text, text) from public, anon;
revoke execute on function public.accept_contract_term(uuid, integer, text, text) from public, anon;
revoke execute on function public.reject_contract_term(uuid, integer, text, text) from public, anon;
revoke execute on function public.add_contract_deadline(uuid, jsonb, text) from public, anon;
revoke execute on function public.add_contract_finding(uuid, jsonb, text) from public, anon;
revoke execute on function public.create_contract_conflict(uuid, jsonb, text) from public, anon;
revoke execute on function public.resolve_contract_conflict(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.add_contract_relationship(uuid, jsonb, text) from public, anon;
revoke execute on function public.add_contract_question(uuid, jsonb, text) from public, anon;
revoke execute on function public.add_contract_change_proposal(uuid, jsonb, text) from public, anon;
revoke execute on function public.list_contract_projection(uuid, uuid) from public, anon;
revoke execute on function public.load_contract_detail(uuid) from public, anon;

grant execute on function public.create_contract(uuid, jsonb, text) to authenticated;
grant execute on function public.update_contract(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.archive_contract(uuid, integer, text, text) to authenticated;
grant execute on function public.link_contract_evidence(uuid, jsonb, text) to authenticated;
grant execute on function public.add_contract_party(uuid, jsonb, text) to authenticated;
grant execute on function public.update_contract_party(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.add_contract_term(uuid, jsonb, text) to authenticated;
grant execute on function public.update_contract_term(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.set_contract_term_acceptance(uuid, text, integer, text, text) to authenticated;
grant execute on function public.accept_contract_term(uuid, integer, text, text) to authenticated;
grant execute on function public.reject_contract_term(uuid, integer, text, text) to authenticated;
grant execute on function public.add_contract_deadline(uuid, jsonb, text) to authenticated;
grant execute on function public.add_contract_finding(uuid, jsonb, text) to authenticated;
grant execute on function public.create_contract_conflict(uuid, jsonb, text) to authenticated;
grant execute on function public.resolve_contract_conflict(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.add_contract_relationship(uuid, jsonb, text) to authenticated;
grant execute on function public.add_contract_question(uuid, jsonb, text) to authenticated;
grant execute on function public.add_contract_change_proposal(uuid, jsonb, text) to authenticated;
grant execute on function public.list_contract_projection(uuid, uuid) to authenticated;
grant execute on function public.load_contract_detail(uuid) to authenticated;

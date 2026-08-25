-- Specification 011 Slice 2: ContractIQ document classification, source-linked
-- extraction, party/term/contingency proposals, amendment/base matching, and
-- conflict candidates. This slice stores proposals only; it does not calculate
-- authoritative deadlines or mutate Deal, Property, FinanceIQ, GovernanceIQ,
-- StrategyIQ, underwriting, tasks, or reports.

create extension if not exists pgcrypto;

insert into public.contract_term_category_definitions (category_key, label, sort_order)
values
  ('property_identity', 'Property Identity', 1000),
  ('financing', 'Financing', 1010),
  ('contingency', 'Contingency', 1020),
  ('due_diligence', 'Due Diligence', 1030),
  ('closing_possession', 'Closing / Possession', 1040),
  ('representation_warranty', 'Representation / Warranty', 1050),
  ('default_remedy', 'Default / Remedy', 1060),
  ('assignment_transfer', 'Assignment / Transfer', 1070),
  ('notice', 'Notice', 1080),
  ('amendment_effect', 'Amendment Effect', 1090)
on conflict (category_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_finding_category_definitions (category_key, label, sort_order)
values
  ('missing_party', 'Missing Party', 1000),
  ('missing_signature', 'Missing Signature', 1010),
  ('incomplete_legal_description', 'Incomplete Legal Description', 1020),
  ('ambiguous_money_term', 'Ambiguous Money Term', 1030),
  ('conflicting_date', 'Conflicting Date', 1040),
  ('missing_contingency_detail', 'Missing Contingency Detail', 1050),
  ('missing_base_contract', 'Missing Base Contract', 1060),
  ('unclear_assignment', 'Unclear Assignment', 1070),
  ('professional_review', 'Professional Review', 1080),
  ('unreadable_clause', 'Unreadable Clause', 1090),
  ('incomplete_source', 'Incomplete Source', 1100),
  ('property_identity', 'Property Identity', 1110),
  ('financing', 'Financing', 1120),
  ('contingency', 'Contingency', 1130),
  ('notice', 'Notice', 1140),
  ('default_remedy', 'Default / Remedy', 1150)
on conflict (category_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_conflict_type_definitions (type_key, label, sort_order)
values
  ('purchase_price_conflict', 'Purchase Price Conflict', 1000),
  ('closing_date_conflict', 'Closing Date Conflict', 1010),
  ('earnest_money_conflict', 'Earnest Money Conflict', 1020),
  ('party_name_conflict', 'Party Name Conflict', 1030),
  ('property_identity_conflict', 'Property Identity Conflict', 1040),
  ('financing_contingency_conflict', 'Financing Contingency Conflict', 1050),
  ('assignment_rights_conflict', 'Assignment Rights Conflict', 1060),
  ('inspection_period_conflict', 'Inspection Period Conflict', 1070),
  ('amendment_base_conflict', 'Amendment Base Conflict', 1080),
  ('term_conflict', 'Term Conflict', 1090)
on conflict (type_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_party_role_definitions (role_key, label, sort_order)
values
  ('borrower', 'Borrower', 1000),
  ('lender', 'Lender', 1010),
  ('guarantor', 'Guarantor', 1020),
  ('escrow_agent', 'Escrow Agent', 1030),
  ('title_company', 'Title Company', 1040),
  ('broker', 'Broker', 1050),
  ('attorney', 'Attorney', 1060),
  ('assignor', 'Assignor', 1070),
  ('assignee', 'Assignee', 1080),
  ('optionor', 'Optionor', 1090),
  ('optionee', 'Optionee', 1100),
  ('contractor', 'Contractor', 1110),
  ('investor', 'Investor', 1120)
on conflict (role_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_question_recipient_role_definitions (role_key, label, sort_order)
values
  ('buyer_attorney', 'Buyer Attorney', 1000),
  ('seller_attorney', 'Seller Attorney', 1010),
  ('broker', 'Broker', 1020),
  ('escrow_agent', 'Escrow Agent', 1030),
  ('title_company', 'Title Company', 1040),
  ('lender', 'Lender', 1050),
  ('inspector', 'Inspector', 1060),
  ('surveyor', 'Surveyor', 1070),
  ('contractor', 'Contractor', 1080)
on conflict (role_key) do update set label = excluded.label, sort_order = excluded.sort_order;

alter table public.contracts
  add column if not exists classification_state text not null default 'unclassified'
    check (classification_state in ('unclassified', 'classified_proposed', 'classified_verified', 'classification_conflict', 'insufficient_content', 'illegible', 'unsupported_format', 'provider_failed', 'manual_review_required')),
  add column if not exists classification_method text
    check (classification_method is null or classification_method in ('content_pattern', 'provider_structured', 'manual', 'filename_hint', 'fallback')),
  add column if not exists classification_evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(classification_evidence) = 'array'),
  add column if not exists classification_warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(classification_warnings) = 'array'),
  add column if not exists classification_ambiguity jsonb not null default '[]'::jsonb check (jsonb_typeof(classification_ambiguity) = 'array'),
  add column if not exists classification_source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(classification_source_anchor) = 'object'),
  add column if not exists classification_run_id uuid,
  add column if not exists prior_valid_classification_run_id uuid,
  add column if not exists prior_valid_analysis_run_id uuid,
  add column if not exists extraction_freshness_state text not null default 'current_candidate'
    check (extraction_freshness_state in ('current_candidate', 'historical', 'superseded_candidate', 'conflicting', 'uncertain', 'stale', 'failed_with_prior_valid')),
  add column if not exists stale_reason text;

alter table public.contract_parties
  add column if not exists entity_type text
    check (entity_type is null or entity_type in ('person', 'organization', 'trust', 'estate', 'government', 'unknown')),
  add column if not exists signatory_name text,
  add column if not exists initials_present boolean not null default false,
  add column if not exists counterpart_execution boolean not null default false,
  add column if not exists extraction_run_id uuid,
  add column if not exists match_state text not null default 'manual_review_required'
    check (match_state in ('exact_match', 'likely_match', 'ambiguous_match', 'no_match', 'manual_review_required'));

alter table public.contract_terms
  add column if not exists extraction_run_id uuid,
  add column if not exists ambiguity_state text not null default 'none'
    check (ambiguity_state in ('none', 'ambiguous', 'conflicting', 'incomplete', 'manual_review_required')),
  add column if not exists currentness_state text not null default 'current_candidate'
    check (currentness_state in ('current_candidate', 'historical', 'superseded_candidate', 'conflicting', 'uncertain')),
  add column if not exists expiration_date date;

create table if not exists public.contract_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  evidence_id uuid,
  contract_version integer not null,
  analysis_contract_version text not null default 'contractiq-document-analysis-v1',
  extraction_contract_version text not null default 'contractiq-extraction-v1',
  provider_id text not null default 'deterministic_contractiq',
  provider_method text not null default 'manual_or_provider_structured',
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'queued' check (status in ('queued', 'processing', 'partial', 'completed', 'failed', 'provider_failed', 'malformed_response', 'unsupported_file', 'insufficient_content', 'illegible', 'stale', 'superseded')),
  error_code text check (error_code is null or error_code in ('provider_unavailable', 'provider_timeout', 'malformed_response', 'incomplete_extraction', 'insufficient_context', 'unsupported_file', 'illegible_source', 'source_anchor_incomplete', 'validation_failed', 'unknown_error')),
  safe_error_message text,
  input_hash text not null,
  result_hash text,
  prior_valid_run_id uuid references public.contract_analysis_runs(id) on delete set null,
  correlation_id uuid not null default gen_random_uuid(),
  retry_count integer not null default 0 check (retry_count >= 0),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  provider_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_metadata) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_analysis_runs_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_analysis_runs_evidence_fk foreign key (workspace_id, evidence_id) references public.evidence_items(workspace_id, id) on delete set null,
  unique (workspace_id, id)
);

create unique index if not exists idx_contract_analysis_runs_idempotent_current
  on public.contract_analysis_runs(workspace_id, contract_id, coalesce(evidence_id, '00000000-0000-0000-0000-000000000000'::uuid), analysis_contract_version, extraction_contract_version, provider_id, provider_method, input_hash)
  where status <> 'superseded';
create index if not exists idx_contract_analysis_runs_contract_status on public.contract_analysis_runs(workspace_id, contract_id, status, requested_at desc);
create index if not exists idx_contract_analysis_runs_workspace_fk on public.contract_analysis_runs(workspace_id);
create index if not exists idx_contract_analysis_runs_evidence_fk on public.contract_analysis_runs(workspace_id, evidence_id);
create index if not exists idx_contract_analysis_runs_prior_fk on public.contract_analysis_runs(prior_valid_run_id);
create index if not exists idx_contract_analysis_runs_requested_by_fk on public.contract_analysis_runs(requested_by);
create index if not exists idx_contract_analysis_runs_created_by_fk on public.contract_analysis_runs(created_by);
create index if not exists idx_contract_analysis_runs_updated_by_fk on public.contract_analysis_runs(updated_by);

create table if not exists public.contract_extraction_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  evidence_id uuid not null,
  analysis_run_id uuid,
  extraction_contract_version text not null default 'contractiq-extraction-v1',
  extraction_type text not null check (extraction_type in ('party', 'signature', 'property_identity', 'economic_term', 'financing_term', 'contingency', 'due_diligence', 'closing_possession', 'representation_warranty', 'default_remedy', 'assignment_transfer', 'notice', 'amendment_relationship', 'base_contract_match', 'supersession_candidate', 'conflict_candidate', 'finding', 'question')),
  normalized_type text not null,
  raw_source_ref text,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  proposed_normalized_value jsonb not null default '{}'::jsonb check (jsonb_typeof(proposed_normalized_value) = 'object'),
  display_value text,
  unit text,
  currency text,
  confidence integer not null default 50 check (confidence between 0 and 100),
  verification_state text not null default 'unverified' references public.contract_verification_state_definitions(state_key),
  ambiguity_state text not null default 'none' check (ambiguity_state in ('none', 'ambiguous', 'conflicting', 'incomplete', 'manual_review_required')),
  applicable_party_id uuid,
  applicable_perspective text references public.contract_perspective_definitions(perspective_key),
  effective_date date,
  expiration_date date,
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  provider_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_metadata) = 'object'),
  input_hash text not null,
  proposed_contract_party_id uuid,
  proposed_contract_term_id uuid,
  proposed_contract_deadline_id uuid,
  proposed_contract_finding_id uuid,
  proposed_contract_conflict_id uuid,
  currentness_state text not null default 'current_candidate' check (currentness_state in ('current_candidate', 'historical', 'superseded_candidate', 'conflicting', 'uncertain')),
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_extraction_items_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_extraction_items_evidence_fk foreign key (workspace_id, evidence_id) references public.evidence_items(workspace_id, id) on delete restrict,
  constraint contract_extraction_items_run_fk foreign key (workspace_id, analysis_run_id) references public.contract_analysis_runs(workspace_id, id) on delete set null,
  constraint contract_extraction_items_applicable_party_fk foreign key (workspace_id, applicable_party_id) references public.contract_parties(workspace_id, id),
  constraint contract_extraction_items_party_fk foreign key (workspace_id, proposed_contract_party_id) references public.contract_parties(workspace_id, id) on delete set null,
  constraint contract_extraction_items_term_fk foreign key (workspace_id, proposed_contract_term_id) references public.contract_terms(workspace_id, id) on delete set null,
  constraint contract_extraction_items_deadline_fk foreign key (workspace_id, proposed_contract_deadline_id) references public.contract_deadlines(workspace_id, id) on delete set null,
  constraint contract_extraction_items_finding_fk foreign key (workspace_id, proposed_contract_finding_id) references public.contract_findings(workspace_id, id) on delete set null,
  constraint contract_extraction_items_conflict_fk foreign key (workspace_id, proposed_contract_conflict_id) references public.contract_conflicts(workspace_id, id) on delete set null,
  constraint contract_extraction_items_anchor_present check (source_anchor <> '{}'::jsonb),
  unique (workspace_id, id)
);

create unique index if not exists idx_contract_extraction_items_dedupe
  on public.contract_extraction_items(workspace_id, contract_id, evidence_id, extraction_contract_version, input_hash)
  where archived_at is null;
create index if not exists idx_contract_extraction_items_contract_type on public.contract_extraction_items(workspace_id, contract_id, extraction_type, normalized_type);
create index if not exists idx_contract_extraction_items_workspace_fk on public.contract_extraction_items(workspace_id);
create index if not exists idx_contract_extraction_items_evidence_fk on public.contract_extraction_items(workspace_id, evidence_id);
create index if not exists idx_contract_extraction_items_run_fk on public.contract_extraction_items(workspace_id, analysis_run_id);
create index if not exists idx_contract_extraction_items_applicable_party_fk on public.contract_extraction_items(workspace_id, applicable_party_id);
create index if not exists idx_contract_extraction_items_party_fk on public.contract_extraction_items(workspace_id, proposed_contract_party_id);
create index if not exists idx_contract_extraction_items_term_fk on public.contract_extraction_items(workspace_id, proposed_contract_term_id);
create index if not exists idx_contract_extraction_items_deadline_fk on public.contract_extraction_items(workspace_id, proposed_contract_deadline_id);
create index if not exists idx_contract_extraction_items_finding_fk on public.contract_extraction_items(workspace_id, proposed_contract_finding_id);
create index if not exists idx_contract_extraction_items_conflict_fk on public.contract_extraction_items(workspace_id, proposed_contract_conflict_id);
create index if not exists idx_contract_extraction_items_verification_state_fk on public.contract_extraction_items(verification_state);
create index if not exists idx_contract_extraction_items_applicable_perspective_fk on public.contract_extraction_items(applicable_perspective);
create index if not exists idx_contract_extraction_items_created_by_fk on public.contract_extraction_items(created_by);
create index if not exists idx_contract_extraction_items_updated_by_fk on public.contract_extraction_items(updated_by);

create table if not exists public.contract_party_match_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  contract_party_id uuid not null,
  target_type text check (target_type is null or target_type in ('contact', 'organization')),
  target_contact_id uuid,
  target_organization_id uuid,
  match_state text not null check (match_state in ('exact_match', 'likely_match', 'ambiguous_match', 'no_match', 'manual_review_required')),
  deterministic_signals jsonb not null default '[]'::jsonb check (jsonb_typeof(deterministic_signals) = 'array'),
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  confidence integer not null default 50 check (confidence between 0 and 100),
  status text not null default 'proposed' references public.contract_proposal_state_definitions(state_key),
  analysis_run_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_party_match_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_party_match_party_fk foreign key (workspace_id, contract_party_id) references public.contract_parties(workspace_id, id) on delete cascade,
  constraint contract_party_match_contact_fk foreign key (workspace_id, target_contact_id) references public.contacts(workspace_id, id) on delete restrict,
  constraint contract_party_match_org_fk foreign key (workspace_id, target_organization_id) references public.organizations(workspace_id, id) on delete restrict,
  constraint contract_party_match_run_fk foreign key (workspace_id, analysis_run_id) references public.contract_analysis_runs(workspace_id, id) on delete set null,
  unique (workspace_id, id)
);

create unique index if not exists idx_contract_party_match_dedupe
  on public.contract_party_match_proposals(workspace_id, contract_party_id, coalesce(target_contact_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(target_organization_id, '00000000-0000-0000-0000-000000000000'::uuid), match_state)
  where archived_at is null;
create index if not exists idx_contract_party_match_contract_fk on public.contract_party_match_proposals(workspace_id, contract_id);
create index if not exists idx_contract_party_match_workspace_fk on public.contract_party_match_proposals(workspace_id);
create index if not exists idx_contract_party_match_party_fk on public.contract_party_match_proposals(workspace_id, contract_party_id);
create index if not exists idx_contract_party_match_contact_fk on public.contract_party_match_proposals(workspace_id, target_contact_id);
create index if not exists idx_contract_party_match_org_fk on public.contract_party_match_proposals(workspace_id, target_organization_id);
create index if not exists idx_contract_party_match_run_fk on public.contract_party_match_proposals(workspace_id, analysis_run_id);
create index if not exists idx_contract_party_match_status_fk on public.contract_party_match_proposals(status);
create index if not exists idx_contract_party_match_created_by_fk on public.contract_party_match_proposals(created_by);
create index if not exists idx_contract_party_match_updated_by_fk on public.contract_party_match_proposals(updated_by);

create table if not exists public.contract_base_match_candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  candidate_base_contract_id uuid,
  match_state text not null check (match_state in ('exact_base_match', 'likely_base_match', 'ambiguous_base_match', 'missing_base_contract', 'manual_review_required')),
  evidence_signals jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_signals) = 'array'),
  source_evidence_id uuid,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  confidence integer not null default 50 check (confidence between 0 and 100),
  professional_review_required boolean not null default true,
  status text not null default 'proposed' references public.contract_proposal_state_definitions(state_key),
  analysis_run_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_base_match_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_base_match_base_fk foreign key (workspace_id, candidate_base_contract_id) references public.contracts(workspace_id, id) on delete restrict,
  constraint contract_base_match_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_base_match_run_fk foreign key (workspace_id, analysis_run_id) references public.contract_analysis_runs(workspace_id, id) on delete set null,
  constraint contract_base_match_not_self check (candidate_base_contract_id is null or candidate_base_contract_id <> contract_id),
  constraint contract_base_match_not_upload_order check (match_state = 'missing_base_contract' or evidence_signals <> '[]'::jsonb),
  unique (workspace_id, id)
);

create unique index if not exists idx_contract_base_match_dedupe
  on public.contract_base_match_candidates(workspace_id, contract_id, coalesce(candidate_base_contract_id, '00000000-0000-0000-0000-000000000000'::uuid), match_state)
  where archived_at is null;
create index if not exists idx_contract_base_match_contract_fk on public.contract_base_match_candidates(workspace_id, contract_id);
create index if not exists idx_contract_base_match_workspace_fk on public.contract_base_match_candidates(workspace_id);
create index if not exists idx_contract_base_match_base_fk on public.contract_base_match_candidates(workspace_id, candidate_base_contract_id);
create index if not exists idx_contract_base_match_evidence_fk on public.contract_base_match_candidates(workspace_id, source_evidence_id);
create index if not exists idx_contract_base_match_run_fk on public.contract_base_match_candidates(workspace_id, analysis_run_id);
create index if not exists idx_contract_base_match_status_fk on public.contract_base_match_candidates(status);
create index if not exists idx_contract_base_match_created_by_fk on public.contract_base_match_candidates(created_by);
create index if not exists idx_contract_base_match_updated_by_fk on public.contract_base_match_candidates(updated_by);

create table if not exists public.contract_supersession_candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  old_contract_term_id uuid,
  replacement_contract_term_id uuid,
  relationship_id uuid,
  source_evidence_id uuid,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  supersession_state text not null default 'superseded_candidate' check (supersession_state in ('superseded_candidate', 'conflicting', 'uncertain')),
  evidence_signals jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_signals) = 'array'),
  confidence integer not null default 50 check (confidence between 0 and 100),
  professional_review_required boolean not null default true,
  status text not null default 'proposed' references public.contract_proposal_state_definitions(state_key),
  analysis_run_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_supersession_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_supersession_old_term_fk foreign key (workspace_id, old_contract_term_id) references public.contract_terms(workspace_id, id) on delete set null,
  constraint contract_supersession_replacement_term_fk foreign key (workspace_id, replacement_contract_term_id) references public.contract_terms(workspace_id, id) on delete set null,
  constraint contract_supersession_relationship_fk foreign key (workspace_id, relationship_id) references public.contract_relationships(workspace_id, id) on delete set null,
  constraint contract_supersession_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_supersession_run_fk foreign key (workspace_id, analysis_run_id) references public.contract_analysis_runs(workspace_id, id) on delete set null,
  constraint contract_supersession_anchor_present check (source_anchor <> '{}'::jsonb),
  unique (workspace_id, id)
);

create unique index if not exists idx_contract_supersession_dedupe
  on public.contract_supersession_candidates(workspace_id, contract_id, coalesce(old_contract_term_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(replacement_contract_term_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where archived_at is null;
create index if not exists idx_contract_supersession_contract_fk on public.contract_supersession_candidates(workspace_id, contract_id);
create index if not exists idx_contract_supersession_workspace_fk on public.contract_supersession_candidates(workspace_id);
create index if not exists idx_contract_supersession_old_term_fk on public.contract_supersession_candidates(workspace_id, old_contract_term_id);
create index if not exists idx_contract_supersession_replacement_term_fk on public.contract_supersession_candidates(workspace_id, replacement_contract_term_id);
create index if not exists idx_contract_supersession_relationship_fk on public.contract_supersession_candidates(workspace_id, relationship_id);
create index if not exists idx_contract_supersession_evidence_fk on public.contract_supersession_candidates(workspace_id, source_evidence_id);
create index if not exists idx_contract_supersession_run_fk on public.contract_supersession_candidates(workspace_id, analysis_run_id);
create index if not exists idx_contract_supersession_status_fk on public.contract_supersession_candidates(status);
create index if not exists idx_contract_supersession_created_by_fk on public.contract_supersession_candidates(created_by);
create index if not exists idx_contract_supersession_updated_by_fk on public.contract_supersession_candidates(updated_by);

alter table public.contracts
  add constraint contracts_classification_run_fk foreign key (workspace_id, classification_run_id) references public.contract_analysis_runs(workspace_id, id) on delete set null,
  add constraint contracts_prior_valid_classification_run_fk foreign key (workspace_id, prior_valid_classification_run_id) references public.contract_analysis_runs(workspace_id, id) on delete set null,
  add constraint contracts_prior_valid_analysis_run_fk foreign key (workspace_id, prior_valid_analysis_run_id) references public.contract_analysis_runs(workspace_id, id) on delete set null;

alter table public.contract_parties
  add constraint contract_parties_extraction_run_fk foreign key (workspace_id, extraction_run_id) references public.contract_analysis_runs(workspace_id, id) on delete set null;

alter table public.contract_terms
  add constraint contract_terms_extraction_run_fk foreign key (workspace_id, extraction_run_id) references public.contract_analysis_runs(workspace_id, id) on delete set null;

create index if not exists idx_contracts_classification_run_fk on public.contracts(workspace_id, classification_run_id);
create index if not exists idx_contracts_prior_valid_classification_run_fk on public.contracts(workspace_id, prior_valid_classification_run_id);
create index if not exists idx_contracts_prior_valid_analysis_run_fk on public.contracts(workspace_id, prior_valid_analysis_run_id);
create index if not exists idx_contract_parties_extraction_run_fk on public.contract_parties(workspace_id, extraction_run_id);
create index if not exists idx_contract_terms_extraction_run_fk on public.contract_terms(workspace_id, extraction_run_id);

create or replace function public.start_contract_analysis_run(target_contract_id uuid, run_input jsonb, idempotency_key text)
returns table (contract_analysis_run_id uuid, contract_analysis_run_version integer, workspace_id uuid, status text, prior_valid_run_id uuid)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(run_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  evidence_id_value uuid := nullif(safe_input ->> 'evidenceId', '')::uuid;
  computed_input_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to start ContractIQ analysis.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if evidence_id_value is not null and not exists (select 1 from public.evidence_items evidence where evidence.workspace_id = target_contract.workspace_id and evidence.id = evidence_id_value) then
    raise exception 'Evidence is not available in this workspace.' using errcode = '42501';
  end if;
  computed_input_hash := md5(coalesce(safe_input ->> 'inputHash', safe_input::text));
  select run.id into prior_valid_run_id
  from public.contract_analysis_runs run
  where run.workspace_id = target_contract.workspace_id and run.contract_id = target_contract.id and run.status in ('completed', 'partial')
  order by run.completed_at desc nulls last, run.requested_at desc limit 1;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'start_contract_analysis_run', idempotency_key, safe_input || jsonb_build_object('inputHash', computed_input_hash));
  if command.result ? 'contract_analysis_run_id' then
    select id, version, workspace_id, status, prior_valid_run_id into contract_analysis_run_id, contract_analysis_run_version, workspace_id, status, prior_valid_run_id
    from public.contract_analysis_runs where id = (command.result ->> 'contract_analysis_run_id')::uuid;
    return next;
    return;
  end if;
  insert into public.contract_analysis_runs (
    workspace_id, contract_id, evidence_id, contract_version, analysis_contract_version, extraction_contract_version,
    provider_id, provider_method, requested_by, started_at, status, input_hash, prior_valid_run_id,
    retry_count, warnings, provider_metadata, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, evidence_id_value, target_contract.version,
    coalesce(nullif(safe_input ->> 'analysisContractVersion', ''), 'contractiq-document-analysis-v1'),
    coalesce(nullif(safe_input ->> 'extractionContractVersion', ''), 'contractiq-extraction-v1'),
    coalesce(nullif(safe_input ->> 'providerId', ''), 'deterministic_contractiq'),
    coalesce(nullif(safe_input ->> 'providerMethod', ''), 'manual_or_provider_structured'),
    current_user_id, now(), coalesce(nullif(safe_input ->> 'status', ''), 'processing'), computed_input_hash,
    prior_valid_run_id, coalesce(nullif(safe_input ->> 'retryCount', '')::integer, 0),
    coalesce(safe_input -> 'warnings', '[]'::jsonb), coalesce(safe_input -> 'providerMetadata', '{}'::jsonb),
    current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_id, coalesce(evidence_id, '00000000-0000-0000-0000-000000000000'::uuid), analysis_contract_version, extraction_contract_version, provider_id, provider_method, input_hash) where status <> 'superseded'
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, status, prior_valid_run_id into contract_analysis_run_id, contract_analysis_run_version, workspace_id, status, prior_valid_run_id;
  update public.contracts set analysis_state = 'processing', updated_by = current_user_id where id = target_contract.id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.analysis_started', 'contract_analysis_run', contract_analysis_run_id, contract_analysis_run_version, 'start_contract_analysis_run', command.idempotency_key || ':contract.analysis_started', jsonb_build_object('contract_id', target_contract.id, 'evidence_id', evidence_id_value))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_analysis_run_id', contract_analysis_run_id, 'contract_analysis_run_version', contract_analysis_run_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.complete_contract_analysis_run(target_analysis_run_id uuid, result_input jsonb, expected_version integer, idempotency_key text)
returns table (contract_analysis_run_id uuid, contract_analysis_run_version integer, contract_id uuid, workspace_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  existing_run public.contract_analysis_runs%rowtype;
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(result_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  next_status text := coalesce(nullif(safe_input ->> 'status', ''), 'completed');
begin
  if current_user_id is null then raise exception 'Authentication required to complete ContractIQ analysis.' using errcode = '42501'; end if;
  select * into existing_run from public.contract_analysis_runs where id = target_analysis_run_id for update;
  if existing_run.id is null then raise exception 'ContractIQ analysis run was not found.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(existing_run.contract_id);
  if existing_run.version <> expected_version then raise exception 'ContractIQ analysis run version conflict.' using errcode = '40001'; end if;
  command := public.ensure_contract_command(existing_run.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'complete_contract_analysis_run', idempotency_key, safe_input);
  if command.result ? 'contract_analysis_run_id' then
    select id, version, contract_id, workspace_id, status into contract_analysis_run_id, contract_analysis_run_version, contract_id, workspace_id, status
    from public.contract_analysis_runs where id = (command.result ->> 'contract_analysis_run_id')::uuid;
    return next;
    return;
  end if;
  update public.contract_analysis_runs
  set status = next_status,
      error_code = nullif(safe_input ->> 'errorCode', ''),
      safe_error_message = nullif(safe_input ->> 'safeErrorMessage', ''),
      result_hash = md5(coalesce(safe_input ->> 'resultHash', (safe_input - 'safeErrorMessage')::text)),
      completed_at = now(),
      warnings = coalesce(safe_input -> 'warnings', warnings),
      version = version + 1,
      updated_by = current_user_id,
      updated_at = now()
  where id = existing_run.id
  returning id, version, contract_id, workspace_id, status into contract_analysis_run_id, contract_analysis_run_version, contract_id, workspace_id, status;
  update public.contracts
  set analysis_state = case
        when next_status in ('completed') then 'awaiting_verification'
        when next_status in ('partial') then 'partial'
        when next_status in ('provider_failed', 'failed', 'malformed_response') and existing_run.prior_valid_run_id is not null then 'failed_with_prior_analysis'
        when next_status in ('provider_failed', 'failed', 'malformed_response') then 'partial'
        when next_status = 'stale' then 'stale'
        else analysis_state
      end,
      prior_valid_analysis_run_id = case when next_status in ('provider_failed', 'failed', 'malformed_response') then existing_run.prior_valid_run_id else prior_valid_analysis_run_id end,
      extraction_freshness_state = case when next_status in ('provider_failed', 'failed', 'malformed_response') and existing_run.prior_valid_run_id is not null then 'failed_with_prior_valid' else extraction_freshness_state end,
      updated_by = current_user_id
  where id = existing_run.contract_id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, case when next_status in ('provider_failed','failed','malformed_response') then 'contract.analysis_failed' else 'contract.analysis_completed' end, 'contract_analysis_run', contract_analysis_run_id, contract_analysis_run_version, 'complete_contract_analysis_run', command.idempotency_key || ':contract.analysis_completed', jsonb_build_object('contract_id', existing_run.contract_id, 'status', next_status, 'prior_valid_preserved', existing_run.prior_valid_run_id is not null))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_analysis_run_id', contract_analysis_run_id, 'contract_analysis_run_version', contract_analysis_run_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_contract_document_classification(target_contract_id uuid, classification_input jsonb, expected_version integer, idempotency_key text)
returns table (contract_id uuid, contract_version integer, workspace_id uuid, classification_state text, contract_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(classification_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  proposed_type text := nullif(safe_input ->> 'proposedContractType', '');
begin
  if current_user_id is null then raise exception 'Authentication required to classify ContractIQ document.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if target_contract.version <> expected_version then raise exception 'Contract version conflict.' using errcode = '40001'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' or safe_input ? 'documentText' then
    raise exception 'ContractIQ classification cannot persist raw private document text.' using errcode = '22023';
  end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'record_contract_document_classification', idempotency_key, safe_input);
  if command.result ? 'contract_id' then
    select id, version, workspace_id, classification_state, contract_type into contract_id, contract_version, workspace_id, classification_state, contract_type from public.contracts where id = (command.result ->> 'contract_id')::uuid;
    return next;
    return;
  end if;
  update public.contracts
  set contract_type = coalesce(proposed_type, contract_type),
      classification_state = coalesce(nullif(safe_input ->> 'classificationState', ''), 'classified_proposed'),
      classification_method = coalesce(nullif(safe_input ->> 'classificationMethod', ''), 'provider_structured'),
      classification_evidence = coalesce(safe_input -> 'classificationEvidence', '[]'::jsonb),
      classification_warnings = coalesce(safe_input -> 'warnings', '[]'::jsonb),
      classification_ambiguity = coalesce(safe_input -> 'ambiguity', '[]'::jsonb),
      classification_source_anchor = coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
      classification_run_id = nullif(safe_input ->> 'analysisRunId', '')::uuid,
      prior_valid_classification_run_id = nullif(safe_input ->> 'priorValidRunId', '')::uuid,
      verification_state = coalesce(nullif(safe_input ->> 'verificationState', ''), verification_state),
      analysis_state = case
        when coalesce(nullif(safe_input ->> 'classificationState', ''), '') = 'classification_conflict' then 'current_with_conflicts'
        when coalesce(nullif(safe_input ->> 'classificationState', ''), '') in ('illegible', 'manual_review_required') then 'professional_review_required'
        when coalesce(nullif(safe_input ->> 'classificationState', ''), '') = 'provider_failed' and nullif(safe_input ->> 'priorValidRunId', '') is not null then 'failed_with_prior_analysis'
        else analysis_state
      end,
      version = version + 1,
      updated_by = current_user_id,
      updated_at = now()
  where id = target_contract.id
  returning id, version, workspace_id, classification_state, contract_type into contract_id, contract_version, workspace_id, classification_state, contract_type;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.document_classified', 'contract', contract_id, contract_version, 'record_contract_document_classification', command.idempotency_key || ':contract.document_classified', jsonb_build_object('classification_state', classification_state, 'contract_type', contract_type, 'source_anchor_incomplete', coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb) = '{}'::jsonb))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.document_classified', 'contracts', 'contract', contract_id, 'record_contract_document_classification', command.idempotency_key || ':audit', jsonb_build_object('classification_state', classification_state, 'contract_type', contract_type), array['classification_state','contract_type'], jsonb_build_object('legal_conclusion_authority', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_id', contract_id, 'contract_version', contract_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_contract_extraction_item(target_contract_id uuid, extraction_input jsonb, idempotency_key text)
returns table (contract_extraction_item_id uuid, contract_extraction_item_version integer, workspace_id uuid, extraction_type text, normalized_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(extraction_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  evidence_id_value uuid := (safe_input ->> 'evidenceId')::uuid;
  computed_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to record ContractIQ extraction.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb) = '{}'::jsonb then raise exception 'SOURCE_ANCHOR_INCOMPLETE' using errcode = '22023'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' or safe_input ? 'documentText' or safe_input ? 'fileContents' then raise exception 'ContractIQ extraction cannot persist raw private document text.' using errcode = '22023'; end if;
  if safe_input ? 'legalConclusion' or safe_input ? 'isLegallyEnforceable' or safe_input ? 'canonicalDealMutation' or safe_input ? 'financeIqMutation' or safe_input ? 'calculatedDueAt' then raise exception 'ContractIQ extraction cannot persist legal authority, downstream mutations, or calculated deadlines.' using errcode = '22023'; end if;
  if not exists (select 1 from public.evidence_items evidence where evidence.workspace_id = target_contract.workspace_id and evidence.id = evidence_id_value) then raise exception 'Evidence is not available in this workspace.' using errcode = '42501'; end if;
  computed_hash := md5(coalesce(safe_input ->> 'inputHash', (safe_input - 'warnings')::text));
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'record_contract_extraction_item', idempotency_key, safe_input || jsonb_build_object('inputHash', computed_hash));
  if command.result ? 'contract_extraction_item_id' then
    select id, version, workspace_id, extraction_type, normalized_type into contract_extraction_item_id, contract_extraction_item_version, workspace_id, extraction_type, normalized_type from public.contract_extraction_items where id = (command.result ->> 'contract_extraction_item_id')::uuid;
    return next;
    return;
  end if;
  insert into public.contract_extraction_items (
    workspace_id, contract_id, evidence_id, analysis_run_id, extraction_contract_version, extraction_type, normalized_type,
    raw_source_ref, source_anchor, proposed_normalized_value, display_value, unit, currency, confidence, verification_state,
    ambiguity_state, applicable_party_id, applicable_perspective, effective_date, expiration_date, warnings, provider_metadata,
    input_hash, proposed_contract_party_id, proposed_contract_term_id, proposed_contract_deadline_id, proposed_contract_finding_id,
    proposed_contract_conflict_id, currentness_state, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, evidence_id_value, nullif(safe_input ->> 'analysisRunId', '')::uuid,
    coalesce(nullif(safe_input ->> 'extractionContractVersion', ''), 'contractiq-extraction-v1'),
    coalesce(nullif(safe_input ->> 'extractionType', ''), 'finding'),
    coalesce(nullif(safe_input ->> 'normalizedType', ''), 'other'),
    nullif(safe_input ->> 'rawSourceRef', ''), coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(safe_input -> 'proposedNormalizedValue', '{}'::jsonb), nullif(safe_input ->> 'displayValue', ''),
    nullif(safe_input ->> 'unit', ''), nullif(safe_input ->> 'currency', ''),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'verificationState', ''), 'unverified'),
    coalesce(nullif(safe_input ->> 'ambiguityState', ''), 'none'),
    nullif(safe_input ->> 'applicablePartyId', '')::uuid,
    nullif(safe_input ->> 'applicablePerspective', ''),
    nullif(safe_input ->> 'effectiveDate', '')::date,
    nullif(safe_input ->> 'expirationDate', '')::date,
    coalesce(safe_input -> 'warnings', '[]'::jsonb),
    coalesce(safe_input -> 'providerMetadata', '{}'::jsonb),
    computed_hash,
    nullif(safe_input ->> 'proposedContractPartyId', '')::uuid,
    nullif(safe_input ->> 'proposedContractTermId', '')::uuid,
    nullif(safe_input ->> 'proposedContractDeadlineId', '')::uuid,
    nullif(safe_input ->> 'proposedContractFindingId', '')::uuid,
    nullif(safe_input ->> 'proposedContractConflictId', '')::uuid,
    coalesce(nullif(safe_input ->> 'currentnessState', ''), 'current_candidate'),
    current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_id, evidence_id, extraction_contract_version, input_hash) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, extraction_type, normalized_type into contract_extraction_item_id, contract_extraction_item_version, workspace_id, extraction_type, normalized_type;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.extraction_recorded', 'contract_extraction_item', contract_extraction_item_id, contract_extraction_item_version, 'record_contract_extraction_item', command.idempotency_key || ':contract.extraction_recorded', jsonb_build_object('contract_id', target_contract.id, 'extraction_type', extraction_type, 'normalized_type', normalized_type))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.extraction_recorded', 'contract_extraction_items', 'contract_extraction_item', contract_extraction_item_id, 'record_contract_extraction_item', command.idempotency_key || ':audit', jsonb_build_object('extraction_type', extraction_type, 'normalized_type', normalized_type), array['extraction_type','normalized_type','source_anchor'], jsonb_build_object('source_linked', true, 'legal_conclusion_authority', false, 'downstream_mutation', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_extraction_item_id', contract_extraction_item_id, 'contract_extraction_item_version', contract_extraction_item_version) where id = command.id;
  return next;
end;
$$;

create or replace function public.propose_contract_party_match(target_contract_party_id uuid, match_input jsonb, idempotency_key text)
returns table (contract_party_match_proposal_id uuid, contract_party_match_proposal_version integer, workspace_id uuid, match_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_party public.contract_parties%rowtype;
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(match_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to propose ContractIQ party match.' using errcode = '42501'; end if;
  select * into target_party from public.contract_parties where id = target_contract_party_id and archived_at is null;
  if target_party.id is null then raise exception 'Contract party was not found.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(target_party.contract_id);
  if target_party.workspace_id <> target_contract.workspace_id then raise exception 'Contract party is not available in this workspace.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'propose_contract_party_match', idempotency_key, safe_input);
  insert into public.contract_party_match_proposals (
    workspace_id, contract_id, contract_party_id, target_type, target_contact_id, target_organization_id, match_state,
    deterministic_signals, source_anchor, confidence, analysis_run_id, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, target_party.id, nullif(safe_input ->> 'targetType', ''),
    nullif(safe_input ->> 'targetContactId', '')::uuid, nullif(safe_input ->> 'targetOrganizationId', '')::uuid,
    coalesce(nullif(safe_input ->> 'matchState', ''), 'manual_review_required'),
    coalesce(safe_input -> 'deterministicSignals', '[]'::jsonb), coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50), nullif(safe_input ->> 'analysisRunId', '')::uuid,
    current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_party_id, coalesce(target_contact_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(target_organization_id, '00000000-0000-0000-0000-000000000000'::uuid), match_state) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, match_state into contract_party_match_proposal_id, contract_party_match_proposal_version, workspace_id, match_state;
  update public.contract_parties set match_state = propose_contract_party_match.match_state, updated_by = current_user_id where id = target_party.id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.party_match_proposed', 'contract_party_match_proposal', contract_party_match_proposal_id, contract_party_match_proposal_version, 'propose_contract_party_match', command.idempotency_key || ':contract.party_match_proposed', jsonb_build_object('contract_id', target_contract.id, 'contract_party_id', target_party.id, 'match_state', match_state))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.party_match_proposed', 'contract_party_match_proposals', 'contract_party_match_proposal', contract_party_match_proposal_id, 'propose_contract_party_match', command.idempotency_key || ':audit', jsonb_build_object('contract_party_id', target_party.id, 'match_state', match_state), array['match_state','source_anchor'], jsonb_build_object('proposal_only', true))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_party_match_proposal_id', contract_party_match_proposal_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.propose_contract_base_match(target_contract_id uuid, match_input jsonb, idempotency_key text)
returns table (contract_base_match_candidate_id uuid, contract_base_match_candidate_version integer, workspace_id uuid, match_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(match_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to propose base contract match.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'propose_contract_base_match', idempotency_key, safe_input);
  insert into public.contract_base_match_candidates (
    workspace_id, contract_id, candidate_base_contract_id, match_state, evidence_signals, source_evidence_id, source_anchor,
    confidence, professional_review_required, analysis_run_id, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, nullif(safe_input ->> 'candidateBaseContractId', '')::uuid,
    coalesce(nullif(safe_input ->> 'matchState', ''), 'manual_review_required'), coalesce(safe_input -> 'evidenceSignals', '[]'::jsonb),
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, true),
    nullif(safe_input ->> 'analysisRunId', '')::uuid, current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_id, coalesce(candidate_base_contract_id, '00000000-0000-0000-0000-000000000000'::uuid), match_state) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, match_state into contract_base_match_candidate_id, contract_base_match_candidate_version, workspace_id, match_state;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.base_match_proposed', 'contract_base_match_candidate', contract_base_match_candidate_id, contract_base_match_candidate_version, 'propose_contract_base_match', command.idempotency_key || ':contract.base_match_proposed', jsonb_build_object('contract_id', target_contract.id, 'match_state', match_state, 'uses_upload_order', false))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.base_match_proposed', 'contract_base_match_candidates', 'contract_base_match_candidate', contract_base_match_candidate_id, 'propose_contract_base_match', command.idempotency_key || ':audit', jsonb_build_object('match_state', match_state), array['match_state','evidence_signals','source_anchor'], jsonb_build_object('proposal_only', true, 'upload_order_authority', false))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_base_match_candidate_id', contract_base_match_candidate_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_contract_supersession_candidate(target_contract_id uuid, supersession_input jsonb, idempotency_key text)
returns table (contract_supersession_candidate_id uuid, contract_supersession_candidate_version integer, workspace_id uuid, supersession_state text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(supersession_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to record ContractIQ supersession candidate.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb) = '{}'::jsonb then raise exception 'SOURCE_ANCHOR_INCOMPLETE' using errcode = '22023'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'record_contract_supersession_candidate', idempotency_key, safe_input);
  insert into public.contract_supersession_candidates (
    workspace_id, contract_id, old_contract_term_id, replacement_contract_term_id, relationship_id, source_evidence_id,
    source_anchor, supersession_state, evidence_signals, confidence, professional_review_required, analysis_run_id, created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.id, nullif(safe_input ->> 'oldContractTermId', '')::uuid,
    nullif(safe_input ->> 'replacementContractTermId', '')::uuid, nullif(safe_input ->> 'relationshipId', '')::uuid,
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'supersessionState', ''), 'superseded_candidate'),
    coalesce(safe_input -> 'evidenceSignals', '[]'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'professionalReviewRequired', '')::boolean, true),
    nullif(safe_input ->> 'analysisRunId', '')::uuid, current_user_id, current_user_id
  )
  on conflict (workspace_id, contract_id, coalesce(old_contract_term_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(replacement_contract_term_id, '00000000-0000-0000-0000-000000000000'::uuid)) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, supersession_state into contract_supersession_candidate_id, contract_supersession_candidate_version, workspace_id, supersession_state;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.supersession_candidate_recorded', 'contract_supersession_candidate', contract_supersession_candidate_id, contract_supersession_candidate_version, 'record_contract_supersession_candidate', command.idempotency_key || ':contract.supersession_candidate_recorded', jsonb_build_object('contract_id', target_contract.id, 'supersession_state', supersession_state))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.supersession_candidate_recorded', 'contract_supersession_candidates', 'contract_supersession_candidate', contract_supersession_candidate_id, 'record_contract_supersession_candidate', command.idempotency_key || ':audit', jsonb_build_object('supersession_state', supersession_state), array['supersession_state','source_anchor'], jsonb_build_object('proposal_only', true))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_supersession_candidate_id', contract_supersession_candidate_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.mark_contract_analysis_stale(target_contract_id uuid, stale_input jsonb, idempotency_key text)
returns table (contract_id uuid, workspace_id uuid, stale_analysis_count integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(stale_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to mark ContractIQ analysis stale.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'mark_contract_analysis_stale', idempotency_key, safe_input);
  update public.contract_analysis_runs set status = 'stale', updated_by = current_user_id, updated_at = now()
  where workspace_id = target_contract.workspace_id and contract_id = target_contract.id and status in ('completed', 'partial');
  get diagnostics stale_analysis_count = row_count;
  update public.contracts set analysis_state = 'stale', extraction_freshness_state = 'stale', stale_reason = nullif(safe_input ->> 'reason', ''), updated_by = current_user_id where id = target_contract.id;
  contract_id := target_contract.id;
  workspace_id := target_contract.workspace_id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.analysis_stale', 'contract', target_contract.id, target_contract.version, 'mark_contract_analysis_stale', command.idempotency_key || ':contract.analysis_stale', jsonb_build_object('reason', safe_input ->> 'reason'))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_id', contract_id, 'stale_analysis_count', stale_analysis_count) where id = command.id;
  return next;
end;
$$;

drop view if exists public.contract_projection;

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
  contract.classification_state,
  contract.extraction_freshness_state,
  contract.confidence,
  count(distinct evidence_link.id) filter (where evidence_link.archived_at is null) as evidence_count,
  count(distinct party.id) filter (where party.archived_at is null) as party_count,
  count(distinct party.id) filter (where party.verification_state in ('verified', 'professional_verified') and party.archived_at is null) as verified_party_count,
  count(distinct party.id) filter (where party.verification_state in ('unverified', 'unknown', 'conflicted', 'source_backed') and party.archived_at is null) as unverified_party_count,
  count(distinct term.id) filter (where term.archived_at is null) as term_count,
  count(distinct term.id) filter (where term.proposal_state = 'accepted' and term.archived_at is null) as accepted_term_count,
  count(distinct term.id) filter (where term.proposal_state = 'proposed' and term.archived_at is null) as proposed_term_count,
  count(distinct term.id) filter (where term.term_category = 'contingency' and term.archived_at is null) + count(distinct deadline.id) filter (where deadline.status = 'pending_verification' and deadline.archived_at is null) as contingency_count,
  count(distinct relationship.id) filter (where relationship.relationship_type in ('amends','amended_by','supersedes','superseded_by','supplements','restates') and relationship.archived_at is null)
    + count(distinct base_match.id) filter (where base_match.archived_at is null) as amendment_count,
  count(distinct deadline.id) filter (where deadline.archived_at is null) as deadline_count,
  count(distinct finding.id) filter (where finding.archived_at is null) as finding_count,
  count(distinct finding.id) filter (where finding.finding_category in ('missing_party','missing_signature','incomplete_legal_description','missing_contingency_detail','missing_base_contract','unreadable_clause','incomplete_source') and finding.archived_at is null) as missing_input_count,
  count(distinct conflict.id) filter (where conflict.resolution_state in ('unresolved', 'under_review', 'professional_review_required') and conflict.archived_at is null) as unresolved_conflict_count,
  count(distinct question.id) filter (where question.status in ('open', 'in_progress') and question.archived_at is null) as open_question_count,
  count(distinct finding.id) filter (where finding.professional_review_required and finding.archived_at is null)
    + count(distinct conflict.id) filter (where conflict.professional_review_required and conflict.archived_at is null)
    + count(distinct supersession.id) filter (where supersession.professional_review_required and supersession.archived_at is null)
    + count(distinct base_match.id) filter (where base_match.professional_review_required and base_match.archived_at is null) as professional_review_count,
  contract.prior_valid_analysis_run_id is not null and contract.analysis_state = 'failed_with_prior_analysis' as prior_valid_after_failure,
  bool_or(finding.professional_review_required) filter (where finding.archived_at is null)
    or bool_or(deadline.professional_review_required) filter (where deadline.archived_at is null)
    or bool_or(conflict.professional_review_required) filter (where conflict.archived_at is null)
    or bool_or(base_match.professional_review_required) filter (where base_match.archived_at is null)
    or bool_or(supersession.professional_review_required) filter (where supersession.archived_at is null)
    or contract.analysis_state = 'professional_review_required'
    as professional_review_required,
  jsonb_build_object(
    'sourceEvidenceId', contract.source_evidence_id,
    'classificationState', contract.classification_state,
    'extractionFreshnessState', contract.extraction_freshness_state,
    'sourceAnchoredTermCount', count(distinct term.id) filter (where term.source_anchor <> '{}'::jsonb and term.archived_at is null),
    'sourceAnchoredExtractionCount', count(distinct extraction.id) filter (where extraction.source_anchor <> '{}'::jsonb and extraction.archived_at is null),
    'verificationRequiredCount',
      count(distinct term.id) filter (where term.verification_state in ('unverified', 'unknown', 'conflicted') and term.archived_at is null)
      + count(distinct deadline.id) filter (where deadline.verification_state in ('unverified', 'unknown', 'conflicted') and deadline.archived_at is null)
      + count(distinct party.id) filter (where party.verification_state in ('unverified', 'unknown', 'conflicted') and party.archived_at is null)
  ) as verification_summary,
  case
    when contract.archived_at is not null then 'archived'
    when contract.status = 'superseded' or contract.analysis_state = 'superseded' then 'superseded'
    when contract.status = 'expired' or contract.analysis_state = 'expired' then 'expired'
    when contract.analysis_state in ('no_contract','uploaded','processing','partial','awaiting_verification','stale','failed_with_prior_analysis','professional_review_required','current_with_conflicts','current') then contract.analysis_state
    when count(distinct conflict.id) filter (where conflict.resolution_state in ('unresolved', 'under_review', 'professional_review_required') and conflict.archived_at is null) > 0 then 'current_with_conflicts'
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
left join public.contract_relationships relationship on relationship.workspace_id = contract.workspace_id and relationship.contract_id = contract.id
left join public.contract_base_match_candidates base_match on base_match.workspace_id = contract.workspace_id and base_match.contract_id = contract.id
left join public.contract_supersession_candidates supersession on supersession.workspace_id = contract.workspace_id and supersession.contract_id = contract.id
left join public.contract_extraction_items extraction on extraction.workspace_id = contract.workspace_id and extraction.contract_id = contract.id
group by contract.id;

alter table public.contract_analysis_runs enable row level security;
alter table public.contract_extraction_items enable row level security;
alter table public.contract_party_match_proposals enable row level security;
alter table public.contract_base_match_candidates enable row level security;
alter table public.contract_supersession_candidates enable row level security;

create policy "contract analysis runs read workspace members" on public.contract_analysis_runs for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "contract analysis runs no direct insert" on public.contract_analysis_runs for insert to authenticated with check (false);
create policy "contract analysis runs no direct update" on public.contract_analysis_runs for update to authenticated using (false) with check (false);
create policy "contract analysis runs no direct delete" on public.contract_analysis_runs for delete to authenticated using (false);

create policy "contract extraction items read workspace members" on public.contract_extraction_items for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "contract extraction items no direct insert" on public.contract_extraction_items for insert to authenticated with check (false);
create policy "contract extraction items no direct update" on public.contract_extraction_items for update to authenticated using (false) with check (false);
create policy "contract extraction items no direct delete" on public.contract_extraction_items for delete to authenticated using (false);

create policy "contract party match proposals read workspace members" on public.contract_party_match_proposals for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "contract party match proposals no direct insert" on public.contract_party_match_proposals for insert to authenticated with check (false);
create policy "contract party match proposals no direct update" on public.contract_party_match_proposals for update to authenticated using (false) with check (false);
create policy "contract party match proposals no direct delete" on public.contract_party_match_proposals for delete to authenticated using (false);

create policy "contract base match candidates read workspace members" on public.contract_base_match_candidates for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "contract base match candidates no direct insert" on public.contract_base_match_candidates for insert to authenticated with check (false);
create policy "contract base match candidates no direct update" on public.contract_base_match_candidates for update to authenticated using (false) with check (false);
create policy "contract base match candidates no direct delete" on public.contract_base_match_candidates for delete to authenticated using (false);

create policy "contract supersession candidates read workspace members" on public.contract_supersession_candidates for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "contract supersession candidates no direct insert" on public.contract_supersession_candidates for insert to authenticated with check (false);
create policy "contract supersession candidates no direct update" on public.contract_supersession_candidates for update to authenticated using (false) with check (false);
create policy "contract supersession candidates no direct delete" on public.contract_supersession_candidates for delete to authenticated using (false);

grant select on public.contract_analysis_runs to authenticated;
grant select on public.contract_extraction_items to authenticated;
grant select on public.contract_party_match_proposals to authenticated;
grant select on public.contract_base_match_candidates to authenticated;
grant select on public.contract_supersession_candidates to authenticated;
grant select on public.contract_projection to authenticated;
revoke insert, update, delete on public.contract_analysis_runs from authenticated;
revoke insert, update, delete on public.contract_extraction_items from authenticated;
revoke insert, update, delete on public.contract_party_match_proposals from authenticated;
revoke insert, update, delete on public.contract_base_match_candidates from authenticated;
revoke insert, update, delete on public.contract_supersession_candidates from authenticated;

revoke all on function public.start_contract_analysis_run(uuid, jsonb, text) from public;
revoke all on function public.complete_contract_analysis_run(uuid, jsonb, integer, text) from public;
revoke all on function public.record_contract_document_classification(uuid, jsonb, integer, text) from public;
revoke all on function public.record_contract_extraction_item(uuid, jsonb, text) from public;
revoke all on function public.propose_contract_party_match(uuid, jsonb, text) from public;
revoke all on function public.propose_contract_base_match(uuid, jsonb, text) from public;
revoke all on function public.record_contract_supersession_candidate(uuid, jsonb, text) from public;
revoke all on function public.mark_contract_analysis_stale(uuid, jsonb, text) from public;
revoke execute on function public.start_contract_analysis_run(uuid, jsonb, text) from public, anon;
revoke execute on function public.complete_contract_analysis_run(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.record_contract_document_classification(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.record_contract_extraction_item(uuid, jsonb, text) from public, anon;
revoke execute on function public.propose_contract_party_match(uuid, jsonb, text) from public, anon;
revoke execute on function public.propose_contract_base_match(uuid, jsonb, text) from public, anon;
revoke execute on function public.record_contract_supersession_candidate(uuid, jsonb, text) from public, anon;
revoke execute on function public.mark_contract_analysis_stale(uuid, jsonb, text) from public, anon;
grant execute on function public.start_contract_analysis_run(uuid, jsonb, text) to authenticated;
grant execute on function public.complete_contract_analysis_run(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.record_contract_document_classification(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.record_contract_extraction_item(uuid, jsonb, text) to authenticated;
grant execute on function public.propose_contract_party_match(uuid, jsonb, text) to authenticated;
grant execute on function public.propose_contract_base_match(uuid, jsonb, text) to authenticated;
grant execute on function public.record_contract_supersession_candidate(uuid, jsonb, text) to authenticated;
grant execute on function public.mark_contract_analysis_stale(uuid, jsonb, text) to authenticated;

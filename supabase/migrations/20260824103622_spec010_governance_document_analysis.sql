-- Specification 010 Slice 2: GovernanceIQ document hierarchy, source-linked
-- extraction, and conflict detection. Original Evidence remains immutable; this
-- migration stores only derived proposals, anchors, run state, and questions.
-- Anti-pattern guard: date_without_explicit_supersession_not_controlling.

create extension if not exists pgcrypto;

insert into public.governance_finding_category_definitions (category_key, label, sort_order)
values
  ('fees', 'Fees', 461),
  ('transfer_fees', 'Transfer Fees', 462),
  ('application_fees', 'Application Fees', 463),
  ('move_fees', 'Move Fees', 464),
  ('lease_fees', 'Lease Fees', 465),
  ('pending_assessment', 'Pending Assessment', 466),
  ('revenue', 'Revenue', 467),
  ('expenses', 'Expenses', 468),
  ('association_debt', 'Association Debt', 469),
  ('insurance_expense', 'Insurance Expense', 470),
  ('deductible', 'Deductible', 471),
  ('planned_project', 'Planned Project', 472),
  ('rental_cap', 'Rental Cap', 473),
  ('minimum_lease_term', 'Minimum Lease Term', 474),
  ('waiting_period', 'Waiting Period', 475),
  ('tenant_approval', 'Tenant Approval', 476),
  ('lease_registration', 'Lease Registration', 477),
  ('corporate_entity_ownership', 'Corporate / Entity Ownership', 478),
  ('driveway_parking', 'Driveway Parking', 479),
  ('overnight_parking', 'Overnight Parking', 480),
  ('street_parking', 'Street Parking', 481),
  ('garage_requirement', 'Garage Requirement', 482),
  ('guest_parking', 'Guest Parking', 483),
  ('dimension_time_limit', 'Dimension / Time Limit', 484),
  ('amenities', 'Amenities', 485),
  ('maintenance_responsibility', 'Maintenance Responsibility', 486),
  ('right_of_first_refusal_uncertainty', 'Right of First Refusal Uncertainty', 487),
  ('missing_document', 'Missing Document', 488)
on conflict (category_key) do update set label = excluded.label, sort_order = excluded.sort_order;

alter table public.governance_documents
  add column if not exists classification_state text not null default 'unclassified'
    check (classification_state in ('unclassified', 'classified_proposed', 'classified_verified', 'classification_conflict', 'insufficient_content', 'illegible', 'unsupported_format', 'provider_failed', 'manual_review_required')),
  add column if not exists classification_method text
    check (classification_method is null or classification_method in ('content_pattern', 'provider_structured', 'manual', 'filename_hint', 'fallback')),
  add column if not exists classification_evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(classification_evidence) = 'array'),
  add column if not exists classification_warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(classification_warnings) = 'array'),
  add column if not exists classification_ambiguity_candidates jsonb not null default '[]'::jsonb check (jsonb_typeof(classification_ambiguity_candidates) = 'array'),
  add column if not exists classification_source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(classification_source_anchor) = 'object'),
  add column if not exists classification_run_id uuid,
  add column if not exists prior_valid_classification_run_id uuid,
  add column if not exists stale_analysis boolean not null default false;

alter table public.governance_conflicts
  add column if not exists source_a_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_a_anchor) = 'object'),
  add column if not exists source_b_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_b_anchor) = 'object'),
  add column if not exists normalized_a jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_a) = 'object'),
  add column if not exists normalized_b jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_b) = 'object'),
  add column if not exists conflict_severity text not null default 'unknown' check (conflict_severity in ('informational', 'low', 'moderate', 'high', 'critical', 'unknown')),
  add column if not exists detection_method text,
  add column if not exists confidence integer not null default 50 check (confidence between 0 and 100);

do $$
begin
  alter table public.governance_conflicts drop constraint if exists governance_conflicts_conflict_type_check;
  alter table public.governance_conflicts
    add constraint governance_conflicts_conflict_type_check
    check (conflict_type in (
      'document_hierarchy', 'supersession', 'effective_date', 'amount', 'restriction_language', 'source_disagreement',
      'missing_document', 'value_conflict', 'restriction_conflict', 'date_conflict', 'effective_period_conflict',
      'hierarchy_conflict', 'financial_conflict', 'source_conflict', 'verification_conflict',
      'supersession_conflict', 'ambiguity_conflict', 'other'
    ));
end $$;

create table if not exists public.governance_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  governance_document_id uuid,
  evidence_id uuid,
  analysis_version text not null default 'governanceiq-document-analysis-v1',
  extraction_contract_version text not null default 'governanceiq-extraction-v1',
  provider_id text not null default 'deterministic_orchestration',
  provider_method text not null default 'manual_or_provider_structured',
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  status text not null default 'queued' check (status in ('queued', 'processing', 'partial', 'completed', 'failed', 'provider_failed', 'malformed_response', 'unsupported_file', 'stale', 'superseded')),
  error_code text check (error_code is null or error_code in ('provider_unavailable', 'provider_timeout', 'malformed_response', 'insufficient_context', 'unsupported_file', 'source_anchor_incomplete', 'validation_failed', 'unknown_error')),
  safe_error_message text,
  input_hash text not null,
  result_hash text,
  prior_valid_run_id uuid references public.governance_analysis_runs(id) on delete set null,
  correlation_id uuid not null default gen_random_uuid(),
  retry_count integer not null default 0 check (retry_count >= 0),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_analysis_runs_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_analysis_runs_document_fk foreign key (workspace_id, governance_document_id) references public.governance_documents(workspace_id, id) on delete set null,
  constraint governance_analysis_runs_evidence_fk foreign key (workspace_id, evidence_id) references public.evidence_items(workspace_id, id) on delete set null
);

create unique index if not exists idx_governance_analysis_runs_workspace_id on public.governance_analysis_runs(workspace_id, id);
create unique index if not exists idx_governance_analysis_runs_idempotent_current
  on public.governance_analysis_runs(workspace_id, governance_record_id, coalesce(governance_document_id, '00000000-0000-0000-0000-000000000000'::uuid), input_hash)
  where status <> 'superseded';
create index if not exists idx_governance_analysis_runs_record_status on public.governance_analysis_runs(workspace_id, governance_record_id, status, requested_at desc);
create index if not exists idx_governance_analysis_runs_document_status on public.governance_analysis_runs(workspace_id, governance_document_id, status, requested_at desc);
create index if not exists idx_governance_analysis_runs_prior_fk on public.governance_analysis_runs(prior_valid_run_id);
create index if not exists idx_governance_analysis_runs_workspace_fk on public.governance_analysis_runs(workspace_id);
create index if not exists idx_governance_analysis_runs_record_fk on public.governance_analysis_runs(workspace_id, governance_record_id);
create index if not exists idx_governance_analysis_runs_document_fk on public.governance_analysis_runs(workspace_id, governance_document_id);
create index if not exists idx_governance_analysis_runs_evidence_fk on public.governance_analysis_runs(workspace_id, evidence_id);
create index if not exists idx_governance_analysis_runs_requested_by_fk on public.governance_analysis_runs(requested_by);
create index if not exists idx_governance_analysis_runs_created_by_fk on public.governance_analysis_runs(created_by);
create index if not exists idx_governance_analysis_runs_updated_by_fk on public.governance_analysis_runs(updated_by);

create table if not exists public.governance_document_relationships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  source_governance_document_id uuid not null,
  target_governance_document_id uuid not null,
  relationship_type text not null check (relationship_type in ('amends', 'amended_by', 'supersedes', 'superseded_by', 'supplements', 'incorporated_by_reference', 'restates', 'related_to', 'conflicts_with', 'unknown_relationship')),
  relationship_state text not null default 'proposed' check (relationship_state in ('proposed', 'verified', 'rejected', 'superseded')),
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  confidence integer not null default 50 check (confidence between 0 and 100),
  effective_at timestamptz,
  adopted_at timestamptz,
  reasoning_code text not null default 'source_relationship_proposed',
  professional_review_recommended boolean not null default true,
  analysis_run_id uuid references public.governance_analysis_runs(id) on delete set null,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_document_relationships_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_document_relationships_source_fk foreign key (workspace_id, source_governance_document_id) references public.governance_documents(workspace_id, id) on delete restrict,
  constraint governance_document_relationships_target_fk foreign key (workspace_id, target_governance_document_id) references public.governance_documents(workspace_id, id) on delete restrict,
  constraint governance_document_relationships_not_self check (source_governance_document_id <> target_governance_document_id)
);

create unique index if not exists idx_governance_document_relationships_workspace_id on public.governance_document_relationships(workspace_id, id);
create unique index if not exists idx_governance_document_relationships_dedupe on public.governance_document_relationships(workspace_id, source_governance_document_id, target_governance_document_id, relationship_type) where archived_at is null;
create index if not exists idx_governance_document_relationships_record on public.governance_document_relationships(workspace_id, governance_record_id, relationship_state);
create index if not exists idx_governance_document_relationships_source_fk on public.governance_document_relationships(workspace_id, source_governance_document_id);
create index if not exists idx_governance_document_relationships_target_fk on public.governance_document_relationships(workspace_id, target_governance_document_id);
create index if not exists idx_governance_document_relationships_run_fk on public.governance_document_relationships(analysis_run_id);
create index if not exists idx_governance_document_relationships_created_by_fk on public.governance_document_relationships(created_by);
create index if not exists idx_governance_document_relationships_updated_by_fk on public.governance_document_relationships(updated_by);

create table if not exists public.governance_hierarchy_candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  governance_document_id uuid not null,
  hierarchy_state text not null check (hierarchy_state in ('candidate_current', 'candidate_superseded', 'conflicting', 'hierarchy_uncertain', 'professional_review_required')),
  relationship_ids uuid[] not null default '{}'::uuid[],
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  reasoning_code text not null,
  confidence integer not null default 50 check (confidence between 0 and 100),
  professional_review_recommended boolean not null default true,
  analysis_run_id uuid references public.governance_analysis_runs(id) on delete set null,
  stale_at timestamptz,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_hierarchy_candidates_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_hierarchy_candidates_document_fk foreign key (workspace_id, governance_document_id) references public.governance_documents(workspace_id, id) on delete restrict
);

create unique index if not exists idx_governance_hierarchy_candidates_workspace_id on public.governance_hierarchy_candidates(workspace_id, id);
create unique index if not exists idx_governance_hierarchy_candidates_current on public.governance_hierarchy_candidates(workspace_id, governance_document_id) where archived_at is null and stale_at is null;
create index if not exists idx_governance_hierarchy_candidates_record_state on public.governance_hierarchy_candidates(workspace_id, governance_record_id, hierarchy_state);
create index if not exists idx_governance_hierarchy_candidates_document_fk on public.governance_hierarchy_candidates(workspace_id, governance_document_id);
create index if not exists idx_governance_hierarchy_candidates_run_fk on public.governance_hierarchy_candidates(analysis_run_id);
create index if not exists idx_governance_hierarchy_candidates_created_by_fk on public.governance_hierarchy_candidates(created_by);
create index if not exists idx_governance_hierarchy_candidates_updated_by_fk on public.governance_hierarchy_candidates(updated_by);

create table if not exists public.governance_extraction_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  governance_document_id uuid not null,
  evidence_id uuid not null,
  analysis_run_id uuid,
  extraction_contract_version text not null default 'governanceiq-extraction-v1',
  extraction_type text not null check (extraction_type in ('restriction', 'financial_input', 'missing_document', 'question')),
  finding_category text not null references public.governance_finding_category_definitions(category_key),
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  normalized_value jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_value) = 'object'),
  normalized_requirement text,
  ambiguity text,
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  confidence integer not null default 50 check (confidence between 0 and 100),
  verification_state text not null default 'document_extracted' references public.governance_verification_state_definitions(state_key),
  provider_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(provider_metadata) = 'object'),
  proposed_governance_finding_id uuid,
  proposed_governance_financial_id uuid,
  input_hash text not null,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_extraction_items_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_extraction_items_document_fk foreign key (workspace_id, governance_document_id) references public.governance_documents(workspace_id, id) on delete restrict,
  constraint governance_extraction_items_evidence_fk foreign key (workspace_id, evidence_id) references public.evidence_items(workspace_id, id) on delete restrict,
  constraint governance_extraction_items_run_fk foreign key (workspace_id, analysis_run_id) references public.governance_analysis_runs(workspace_id, id) on delete set null,
  constraint governance_extraction_items_finding_fk foreign key (workspace_id, proposed_governance_finding_id) references public.governance_findings(workspace_id, id) on delete set null,
  constraint governance_extraction_items_financial_fk foreign key (workspace_id, proposed_governance_financial_id) references public.governance_financials(workspace_id, id) on delete set null,
  constraint governance_extraction_items_anchor_present check (source_anchor <> '{}'::jsonb)
);

create unique index if not exists idx_governance_extraction_items_workspace_id on public.governance_extraction_items(workspace_id, id);
create unique index if not exists idx_governance_extraction_items_dedupe on public.governance_extraction_items(workspace_id, governance_record_id, governance_document_id, evidence_id, extraction_contract_version, input_hash) where archived_at is null;
create index if not exists idx_governance_extraction_items_record_type on public.governance_extraction_items(workspace_id, governance_record_id, extraction_type);
create index if not exists idx_governance_extraction_items_document_fk on public.governance_extraction_items(workspace_id, governance_document_id);
create index if not exists idx_governance_extraction_items_evidence_fk on public.governance_extraction_items(workspace_id, evidence_id);
create index if not exists idx_governance_extraction_items_run_fk on public.governance_extraction_items(workspace_id, analysis_run_id);
create index if not exists idx_governance_extraction_items_category_fk on public.governance_extraction_items(finding_category);
create index if not exists idx_governance_extraction_items_finding_fk on public.governance_extraction_items(workspace_id, proposed_governance_finding_id);
create index if not exists idx_governance_extraction_items_financial_fk on public.governance_extraction_items(workspace_id, proposed_governance_financial_id);
create index if not exists idx_governance_extraction_items_created_by_fk on public.governance_extraction_items(created_by);
create index if not exists idx_governance_extraction_items_updated_by_fk on public.governance_extraction_items(updated_by);

create table if not exists public.governance_questions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  governance_document_id uuid,
  governance_conflict_id uuid,
  governance_finding_id uuid,
  question text not null,
  target_role text not null default 'unknown' check (target_role in ('association_manager', 'seller', 'realtor', 'attorney', 'lender', 'insurer', 'contractor_architect', 'title_closing_professional', 'unknown')),
  why_it_matters text not null,
  source_reason text not null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  status text not null default 'open' check (status in ('open', 'answered', 'dismissed', 'superseded')),
  professional_review_recommended boolean not null default false,
  analysis_run_id uuid references public.governance_analysis_runs(id) on delete set null,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_questions_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_questions_document_fk foreign key (workspace_id, governance_document_id) references public.governance_documents(workspace_id, id) on delete set null,
  constraint governance_questions_conflict_fk foreign key (workspace_id, governance_conflict_id) references public.governance_conflicts(workspace_id, id) on delete set null,
  constraint governance_questions_finding_fk foreign key (workspace_id, governance_finding_id) references public.governance_findings(workspace_id, id) on delete set null,
  constraint governance_questions_question_not_blank check (length(btrim(question)) > 0),
  constraint governance_questions_why_not_blank check (length(btrim(why_it_matters)) > 0),
  constraint governance_questions_reason_not_blank check (length(btrim(source_reason)) > 0)
);

create unique index if not exists idx_governance_questions_workspace_id on public.governance_questions(workspace_id, id);
create index if not exists idx_governance_questions_record_status on public.governance_questions(workspace_id, governance_record_id, status, created_at desc);
create index if not exists idx_governance_questions_document_fk on public.governance_questions(workspace_id, governance_document_id);
create index if not exists idx_governance_questions_conflict_fk on public.governance_questions(workspace_id, governance_conflict_id);
create index if not exists idx_governance_questions_finding_fk on public.governance_questions(workspace_id, governance_finding_id);
create index if not exists idx_governance_questions_run_fk on public.governance_questions(analysis_run_id);
create index if not exists idx_governance_questions_created_by_fk on public.governance_questions(created_by);
create index if not exists idx_governance_questions_updated_by_fk on public.governance_questions(updated_by);

create or replace view public.governance_record_projection as
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
  count(distinct conflict.id) filter (where conflict.archived_at is null and conflict.status in ('unresolved', 'under_review')) as unresolved_conflict_count,
  count(distinct finding.id) filter (where finding.acceptance_state = 'accepted' and finding.archived_at is null) as accepted_finding_count,
  count(distinct finding.id) filter (where finding.severity in ('high', 'critical') and finding.archived_at is null) as high_severity_finding_count,
  (
    bool_or(coalesce(finding.professional_review_recommended, false))
    or bool_or(coalesce(conflict.professional_review_required, false))
    or bool_or(coalesce(hierarchy.professional_review_recommended, false))
    or bool_or(coalesce(question.professional_review_recommended, false))
  ) as professional_review_required,
  jsonb_build_object(
    'proposedFindingCount', count(distinct finding.id) filter (where finding.acceptance_state = 'proposed' and finding.archived_at is null),
    'acceptedFindingCount', count(distinct finding.id) filter (where finding.acceptance_state = 'accepted' and finding.archived_at is null),
    'classificationStateCounts', coalesce(jsonb_object_agg(distinct coalesce(document.classification_state, 'unclassified'), coalesce(document.classification_state, 'unclassified')) filter (where document.id is not null), '{}'::jsonb),
    'analysisFailureWithPriorValid', exists (select 1 from public.governance_analysis_runs failed_run where failed_run.workspace_id = record.workspace_id and failed_run.governance_record_id = record.id and failed_run.status in ('failed', 'provider_failed', 'malformed_response') and failed_run.prior_valid_run_id is not null),
    'staleAnalysis', bool_or(coalesce(document.stale_analysis, false)) or exists (select 1 from public.governance_analysis_runs stale_run where stale_run.workspace_id = record.workspace_id and stale_run.governance_record_id = record.id and stale_run.status = 'stale')
  ) as verification_summary,
  case
    when count(document.id) = 0 then 'missing_documents'
    when count(finding.id) = 0 then 'partial_sources'
    else 'source_linked'
  end as source_completeness,
  case
    when exists (select 1 from public.governance_analysis_runs run where run.workspace_id = record.workspace_id and run.governance_record_id = record.id and run.status in ('failed', 'provider_failed', 'malformed_response')) then 'failed_with_prior_analysis'
    when bool_or(coalesce(document.stale_analysis, false)) or exists (select 1 from public.governance_analysis_runs run where run.workspace_id = record.workspace_id and run.governance_record_id = record.id and run.status = 'stale') then 'stale'
    when count(conflict.id) filter (where conflict.status in ('unresolved', 'under_review')) > 0 then 'current_with_conflicts'
    when bool_or(coalesce(document.analysis_state, 'not_started') in ('processing')) then 'processing'
    when count(document.id) = 0 then 'documents_requested'
    when count(finding.id) filter (where finding.acceptance_state = 'proposed') > 0 then 'awaiting_verification'
    when record.status = 'professional_review_required' or bool_or(coalesce(finding.professional_review_recommended, false)) or bool_or(coalesce(document.hierarchy_classification, '') = 'professional_review_required') then 'professional_review_required'
    else record.status
  end as projection_state,
  greatest(
    record.updated_at,
    coalesce(max(document.updated_at), record.updated_at),
    coalesce(max(finding.updated_at), record.updated_at),
    coalesce(max(conflict.updated_at), record.updated_at),
    coalesce(max(run.updated_at), record.updated_at),
    coalesce(max(question.updated_at), record.updated_at)
  ) as updated_at,
  now() as loaded_at,
  count(distinct document.id) filter (where document.classification_state in ('classified_proposed', 'classification_conflict', 'manual_review_required')) as proposed_document_count,
  count(distinct document.id) filter (where document.classification_state = 'classified_verified') as verified_document_count,
  count(distinct hierarchy.id) filter (where hierarchy.hierarchy_state in ('hierarchy_uncertain', 'professional_review_required', 'conflicting') and hierarchy.archived_at is null and hierarchy.stale_at is null) as hierarchy_uncertain_count,
  count(distinct run.id) filter (where run.status in ('queued', 'processing', 'partial')) as active_analysis_run_count,
  count(distinct extraction.id) filter (where extraction.archived_at is null) as extraction_item_count,
  count(distinct extraction.id) filter (where extraction.archived_at is null and extraction.extraction_type = 'missing_document') as missing_document_count,
  count(distinct question.id) filter (where question.archived_at is null and question.status = 'open') as open_question_count
from public.governance_records record
left join public.governance_documents document on document.workspace_id = record.workspace_id and document.governance_record_id = record.id and document.archived_at is null
left join public.governance_findings finding on finding.workspace_id = record.workspace_id and finding.governance_record_id = record.id and finding.archived_at is null
left join public.governance_conflicts conflict on conflict.workspace_id = record.workspace_id and conflict.governance_record_id = record.id and conflict.archived_at is null
left join public.governance_analysis_runs run on run.workspace_id = record.workspace_id and run.governance_record_id = record.id
left join public.governance_hierarchy_candidates hierarchy on hierarchy.workspace_id = record.workspace_id and hierarchy.governance_record_id = record.id and hierarchy.archived_at is null and hierarchy.stale_at is null
left join public.governance_extraction_items extraction on extraction.workspace_id = record.workspace_id and extraction.governance_record_id = record.id and extraction.archived_at is null
left join public.governance_questions question on question.workspace_id = record.workspace_id and question.governance_record_id = record.id and question.archived_at is null
group by record.id;

create or replace function public.start_governance_analysis_run(target_governance_record_id uuid, analysis_input jsonb, idempotency_key text)
returns table (governance_analysis_run_id uuid, governance_analysis_run_version integer, workspace_id uuid, status text, prior_valid_run_id uuid, input_hash text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  target_document public.governance_documents%rowtype;
  target_evidence_id uuid;
  safe_input jsonb := public.safe_event_jsonb(coalesce(analysis_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to start GovernanceIQ analysis.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to analyze GovernanceIQ documents.' using errcode = '42501'; end if;
  if safe_input ? 'governanceDocumentId' then
    select * into target_document from public.governance_documents where id = (safe_input ->> 'governanceDocumentId')::uuid and workspace_id = target_record.workspace_id and governance_record_id = target_record.id and archived_at is null;
    if target_document.id is null then raise exception 'Governance document is not available for analysis.' using errcode = 'P0002'; end if;
    target_evidence_id := target_document.evidence_id;
  end if;
  input_hash := encode(digest(coalesce(safe_input ->> 'inputHash', safe_input::text), 'sha256'), 'hex');
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'start_governance_analysis_run', idempotency_key, safe_input || jsonb_build_object('inputHash', input_hash));
  if command.result ? 'governance_analysis_run_id' then
    select id, version, workspace_id, status, prior_valid_run_id, input_hash into governance_analysis_run_id, governance_analysis_run_version, workspace_id, status, prior_valid_run_id, input_hash
    from public.governance_analysis_runs where id = (command.result ->> 'governance_analysis_run_id')::uuid;
    return next;
    return;
  end if;
  select id into prior_valid_run_id
  from public.governance_analysis_runs
  where workspace_id = target_record.workspace_id
    and governance_record_id = target_record.id
    and (target_document.id is null or governance_document_id = target_document.id)
    and status = 'completed'
  order by completed_at desc nulls last
  limit 1;
  insert into public.governance_analysis_runs (
    workspace_id, governance_record_id, governance_document_id, evidence_id, analysis_version, extraction_contract_version,
    provider_id, provider_method, requested_by, started_at, status, input_hash, prior_valid_run_id, metadata, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, target_document.id, target_evidence_id,
    coalesce(nullif(safe_input ->> 'analysisVersion', ''), 'governanceiq-document-analysis-v1'),
    coalesce(nullif(safe_input ->> 'extractionContractVersion', ''), 'governanceiq-extraction-v1'),
    coalesce(nullif(safe_input ->> 'providerId', ''), 'deterministic_orchestration'),
    coalesce(nullif(safe_input ->> 'providerMethod', ''), 'manual_or_provider_structured'),
    current_user_id, now(), 'processing', input_hash, prior_valid_run_id, safe_input - 'rawText' - 'rawDocumentText' - 'fullText', current_user_id, current_user_id
  )
  on conflict (workspace_id, governance_record_id, coalesce(governance_document_id, '00000000-0000-0000-0000-000000000000'::uuid), input_hash) where status <> 'superseded'
  do update set retry_count = public.governance_analysis_runs.retry_count + 1, updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, status, prior_valid_run_id, input_hash into governance_analysis_run_id, governance_analysis_run_version, workspace_id, status, prior_valid_run_id, input_hash;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.analysis_requested', 'governance_analysis_run', governance_analysis_run_id, governance_analysis_run_version, 'start_governance_analysis_run', command.idempotency_key || ':governance.analysis_requested', jsonb_build_object('governance_record_id', target_record.id, 'governance_document_id', target_document.id, 'prior_valid_run_id', prior_valid_run_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.analysis_requested', 'governance_analysis_runs', 'governance_analysis_run', governance_analysis_run_id, 'start_governance_analysis_run', command.idempotency_key || ':audit', jsonb_build_object('status', status, 'input_hash', input_hash), jsonb_build_object('raw_private_content_logged', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_analysis_run_id', governance_analysis_run_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.complete_governance_analysis_run(target_analysis_run_id uuid, result_input jsonb, expected_version integer, idempotency_key text)
returns table (governance_analysis_run_id uuid, governance_analysis_run_version integer, workspace_id uuid, status text, prior_valid_run_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_run public.governance_analysis_runs%rowtype;
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(result_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
  event_name text;
begin
  if current_user_id is null then raise exception 'Authentication required to complete GovernanceIQ analysis.' using errcode = '42501'; end if;
  select * into existing_run from public.governance_analysis_runs where id = target_analysis_run_id for update;
  if existing_run.id is null then raise exception 'GovernanceIQ analysis run is not available.' using errcode = 'P0002'; end if;
  target_record := public.authorized_governance_record(existing_run.governance_record_id);
  if existing_run.version <> expected_version then raise exception 'This GovernanceIQ analysis run changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' then
    raise exception 'GovernanceIQ analysis results cannot persist raw private document text.' using errcode = '22023';
  end if;
  command := public.ensure_governance_command(existing_run.workspace_id, target_record.deal_id, target_record.property_id, existing_run.governance_record_id, 'complete_governance_analysis_run', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'governance_analysis_run_id' then
    select id, version, workspace_id, status, prior_valid_run_id into governance_analysis_run_id, governance_analysis_run_version, workspace_id, status, prior_valid_run_id from public.governance_analysis_runs where id = (command.result ->> 'governance_analysis_run_id')::uuid;
    return next;
    return;
  end if;
  update public.governance_analysis_runs
  set status = coalesce(nullif(safe_input ->> 'status', ''), 'completed'),
      completed_at = case when coalesce(nullif(safe_input ->> 'status', ''), 'completed') in ('completed', 'partial', 'failed', 'provider_failed', 'malformed_response', 'unsupported_file') then now() else completed_at end,
      error_code = nullif(safe_input ->> 'errorCode', ''),
      safe_error_message = nullif(safe_input ->> 'safeErrorMessage', ''),
      result_hash = encode(digest(coalesce(safe_input ->> 'resultHash', safe_input::text), 'sha256'), 'hex'),
      warnings = coalesce(safe_input -> 'warnings', warnings),
      updated_by = current_user_id
  where id = existing_run.id
  returning id, version, workspace_id, status, prior_valid_run_id into governance_analysis_run_id, governance_analysis_run_version, workspace_id, status, prior_valid_run_id;
  if status in ('failed', 'provider_failed', 'malformed_response', 'unsupported_file') then
    update public.governance_records set status = case when prior_valid_run_id is null then 'partial' else 'failed_with_prior_analysis' end, updated_by = current_user_id where id = existing_run.governance_record_id;
    event_name := 'governance.analysis_failed';
  else
    event_name := 'governance.analysis_completed';
  end if;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_run.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, event_name, 'governance_analysis_run', governance_analysis_run_id, governance_analysis_run_version, 'complete_governance_analysis_run', command.idempotency_key || ':' || event_name, jsonb_build_object('governance_record_id', existing_run.governance_record_id, 'status', status, 'prior_valid_run_id', prior_valid_run_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_run.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, event_name, 'governance_analysis_runs', 'governance_analysis_run', governance_analysis_run_id, 'complete_governance_analysis_run', command.idempotency_key || ':audit', to_jsonb(existing_run), jsonb_build_object('status', status, 'version', governance_analysis_run_version), jsonb_build_object('prior_valid_preserved', prior_valid_run_id is not null, 'raw_private_content_logged', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_analysis_run_id', governance_analysis_run_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_governance_document_classification(target_governance_document_id uuid, classification_input jsonb, expected_version integer, idempotency_key text)
returns table (governance_document_id uuid, governance_document_version integer, workspace_id uuid, classification_state text, document_type text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_document public.governance_documents%rowtype;
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(classification_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to classify GovernanceIQ documents.' using errcode = '42501'; end if;
  select * into existing_document from public.governance_documents where id = target_governance_document_id and archived_at is null for update;
  if existing_document.id is null then raise exception 'Governance document is not available.' using errcode = 'P0002'; end if;
  target_record := public.authorized_governance_record(existing_document.governance_record_id);
  if existing_document.version <> expected_version then raise exception 'This governance document changed after you opened it. Reload and try again.' using errcode = '40001'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' then raise exception 'GovernanceIQ classification cannot persist raw private document text.' using errcode = '22023'; end if;
  command := public.ensure_governance_command(existing_document.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'record_governance_document_classification', idempotency_key, safe_input || jsonb_build_object('expectedVersion', expected_version));
  if command.result ? 'governance_document_id' then
    select id, version, workspace_id, classification_state, document_type into governance_document_id, governance_document_version, workspace_id, classification_state, document_type from public.governance_documents where id = (command.result ->> 'governance_document_id')::uuid;
    return next;
    return;
  end if;
  update public.governance_documents
  set document_type = coalesce(nullif(safe_input ->> 'proposedDocumentType', ''), document_type),
      classification_state = coalesce(nullif(safe_input ->> 'classificationState', ''), 'classified_proposed'),
      classification_method = nullif(safe_input ->> 'classificationMethod', ''),
      classification_evidence = coalesce(safe_input -> 'evidenceBasis', classification_evidence),
      classification_warnings = coalesce(safe_input -> 'warnings', classification_warnings),
      classification_ambiguity_candidates = coalesce(safe_input -> 'ambiguityCandidates', classification_ambiguity_candidates),
      classification_source_anchor = coalesce(safe_input -> 'sourceAnchor', classification_source_anchor),
      classification_run_id = nullif(safe_input ->> 'analysisRunId', '')::uuid,
      prior_valid_classification_run_id = nullif(safe_input ->> 'priorValidRunId', '')::uuid,
      analysis_state = case when coalesce(nullif(safe_input ->> 'classificationState', ''), '') in ('provider_failed', 'unsupported_format', 'illegible') then 'failed_with_prior_analysis' else 'awaiting_verification' end,
      source_classification = 'document_extracted',
      verification_state = case when coalesce(nullif(safe_input ->> 'classificationState', ''), '') = 'classified_verified' then 'confirmed' else 'document_extracted' end,
      confidence = coalesce(nullif(safe_input ->> 'confidence', '')::integer, confidence),
      stale_analysis = false,
      updated_by = current_user_id
  where id = existing_document.id
  returning id, version, workspace_id, classification_state, document_type into governance_document_id, governance_document_version, workspace_id, classification_state, document_type;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (existing_document.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_classified', 'governance_document', governance_document_id, governance_document_version, 'record_governance_document_classification', command.idempotency_key || ':governance.document_classified', jsonb_build_object('classification_state', classification_state, 'document_type', document_type))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, before_values, after_values, metadata)
  values (existing_document.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.document_classified', 'governance_documents', 'governance_document', governance_document_id, 'record_governance_document_classification', command.idempotency_key || ':audit', to_jsonb(existing_document), jsonb_build_object('classification_state', classification_state, 'document_type', document_type), jsonb_build_object('filename_alone_authoritative', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_document_id', governance_document_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.propose_governance_document_relationship(target_governance_record_id uuid, relationship_input jsonb, idempotency_key text)
returns table (governance_document_relationship_id uuid, governance_document_relationship_version integer, workspace_id uuid, relationship_state text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(relationship_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to propose GovernanceIQ relationships.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'propose_governance_document_relationship', idempotency_key, safe_input);
  if command.result ? 'governance_document_relationship_id' then
    select id, version, workspace_id, relationship_state into governance_document_relationship_id, governance_document_relationship_version, workspace_id, relationship_state from public.governance_document_relationships where id = (command.result ->> 'governance_document_relationship_id')::uuid;
    return next;
    return;
  end if;
  insert into public.governance_document_relationships (
    workspace_id, governance_record_id, source_governance_document_id, target_governance_document_id, relationship_type,
    relationship_state, source_anchor, confidence, effective_at, adopted_at, reasoning_code, professional_review_recommended,
    analysis_run_id, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, (safe_input ->> 'sourceGovernanceDocumentId')::uuid, (safe_input ->> 'targetGovernanceDocumentId')::uuid,
    coalesce(nullif(safe_input ->> 'relationshipType', ''), 'unknown_relationship'),
    coalesce(nullif(safe_input ->> 'relationshipState', ''), 'proposed'),
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    nullif(safe_input ->> 'effectiveAt', '')::timestamptz,
    nullif(safe_input ->> 'adoptedAt', '')::timestamptz,
    coalesce(nullif(safe_input ->> 'reasoningCode', ''), 'source_relationship_proposed'),
    coalesce(nullif(safe_input ->> 'professionalReviewRecommended', '')::boolean, true),
    nullif(safe_input ->> 'analysisRunId', '')::uuid,
    current_user_id, current_user_id
  )
  on conflict (workspace_id, source_governance_document_id, target_governance_document_id, relationship_type) where archived_at is null
  do update set relationship_state = excluded.relationship_state, source_anchor = excluded.source_anchor, confidence = excluded.confidence, updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, relationship_state into governance_document_relationship_id, governance_document_relationship_version, workspace_id, relationship_state;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.hierarchy_changed', 'governance_document_relationship', governance_document_relationship_id, governance_document_relationship_version, 'propose_governance_document_relationship', command.idempotency_key || ':governance.hierarchy_changed', jsonb_build_object('relationship_state', relationship_state))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_document_relationship_id', governance_document_relationship_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_governance_hierarchy_candidate(target_governance_document_id uuid, hierarchy_input jsonb, idempotency_key text)
returns table (governance_hierarchy_candidate_id uuid, governance_hierarchy_candidate_version integer, workspace_id uuid, hierarchy_state text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_document public.governance_documents%rowtype;
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(hierarchy_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to record GovernanceIQ hierarchy.' using errcode = '42501'; end if;
  select * into target_document from public.governance_documents where id = target_governance_document_id and archived_at is null;
  if target_document.id is null then raise exception 'Governance document is not available.' using errcode = 'P0002'; end if;
  target_record := public.authorized_governance_record(target_document.governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'record_governance_hierarchy_candidate', idempotency_key, safe_input);
  if command.result ? 'governance_hierarchy_candidate_id' then
    select id, version, workspace_id, hierarchy_state into governance_hierarchy_candidate_id, governance_hierarchy_candidate_version, workspace_id, hierarchy_state from public.governance_hierarchy_candidates where id = (command.result ->> 'governance_hierarchy_candidate_id')::uuid;
    return next;
    return;
  end if;
  update public.governance_hierarchy_candidates set stale_at = now(), updated_by = current_user_id where workspace_id = target_record.workspace_id and governance_document_id = target_document.id and archived_at is null and stale_at is null;
  insert into public.governance_hierarchy_candidates (
    workspace_id, governance_record_id, governance_document_id, hierarchy_state, relationship_ids, source_anchor,
    reasoning_code, confidence, professional_review_recommended, analysis_run_id, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, target_document.id,
    coalesce(nullif(safe_input ->> 'hierarchyState', ''), 'hierarchy_uncertain'),
    coalesce(array(select jsonb_array_elements_text(safe_input -> 'relationshipIds')::uuid), '{}'::uuid[]),
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'reasoningCode', ''), 'hierarchy_uncertain'),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'professionalReviewRecommended', '')::boolean, true),
    nullif(safe_input ->> 'analysisRunId', '')::uuid,
    current_user_id, current_user_id
  )
  returning id, version, workspace_id, hierarchy_state into governance_hierarchy_candidate_id, governance_hierarchy_candidate_version, workspace_id, hierarchy_state;
  update public.governance_documents set hierarchy_classification = case when hierarchy_state = 'candidate_superseded' then 'superseded' else hierarchy_state end, updated_by = current_user_id where id = target_document.id;
  update public.governance_command_requests set result = jsonb_build_object('governance_hierarchy_candidate_id', governance_hierarchy_candidate_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.record_governance_extraction_item(target_governance_record_id uuid, extraction_input jsonb, idempotency_key text)
returns table (governance_extraction_item_id uuid, governance_extraction_item_version integer, workspace_id uuid, extraction_type text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(extraction_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
  computed_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to record GovernanceIQ extraction.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  if coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb) = '{}'::jsonb then raise exception 'SOURCE_ANCHOR_INCOMPLETE' using errcode = '22023'; end if;
  if safe_input ? 'rawText' or safe_input ? 'rawDocumentText' or safe_input ? 'fullText' then raise exception 'GovernanceIQ extraction cannot persist raw private document text.' using errcode = '22023'; end if;
  computed_hash := encode(digest(coalesce(safe_input ->> 'inputHash', (safe_input - 'warnings')::text), 'sha256'), 'hex');
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'record_governance_extraction_item', idempotency_key, safe_input || jsonb_build_object('inputHash', computed_hash));
  if command.result ? 'governance_extraction_item_id' then
    select id, version, workspace_id, extraction_type into governance_extraction_item_id, governance_extraction_item_version, workspace_id, extraction_type from public.governance_extraction_items where id = (command.result ->> 'governance_extraction_item_id')::uuid;
    return next;
    return;
  end if;
  insert into public.governance_extraction_items (
    workspace_id, governance_record_id, governance_document_id, evidence_id, analysis_run_id, extraction_contract_version,
    extraction_type, finding_category, source_anchor, normalized_value, normalized_requirement, ambiguity, warnings,
    confidence, verification_state, provider_metadata, proposed_governance_finding_id, proposed_governance_financial_id,
    input_hash, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, (safe_input ->> 'governanceDocumentId')::uuid, (safe_input ->> 'evidenceId')::uuid,
    nullif(safe_input ->> 'analysisRunId', '')::uuid,
    coalesce(nullif(safe_input ->> 'extractionContractVersion', ''), 'governanceiq-extraction-v1'),
    coalesce(nullif(safe_input ->> 'extractionType', ''), 'restriction'),
    coalesce(nullif(safe_input ->> 'findingCategory', ''), 'other'),
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(safe_input -> 'normalizedValue', '{}'::jsonb),
    nullif(safe_input ->> 'normalizedRequirement', ''),
    nullif(safe_input ->> 'ambiguity', ''),
    coalesce(safe_input -> 'warnings', '[]'::jsonb),
    coalesce(nullif(safe_input ->> 'confidence', '')::integer, 50),
    coalesce(nullif(safe_input ->> 'verificationState', ''), 'document_extracted'),
    coalesce(safe_input -> 'providerMetadata', '{}'::jsonb),
    nullif(safe_input ->> 'proposedGovernanceFindingId', '')::uuid,
    nullif(safe_input ->> 'proposedGovernanceFinancialId', '')::uuid,
    computed_hash, current_user_id, current_user_id
  )
  on conflict (workspace_id, governance_record_id, governance_document_id, evidence_id, extraction_contract_version, input_hash) where archived_at is null
  do update set updated_by = current_user_id, updated_at = now()
  returning id, version, workspace_id, extraction_type into governance_extraction_item_id, governance_extraction_item_version, workspace_id, extraction_type;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.finding_created', 'governance_extraction_item', governance_extraction_item_id, governance_extraction_item_version, 'record_governance_extraction_item', command.idempotency_key || ':governance.extraction_recorded', jsonb_build_object('extraction_type', extraction_type))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_extraction_item_id', governance_extraction_item_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.create_governance_question(target_governance_record_id uuid, question_input jsonb, idempotency_key text)
returns table (governance_question_id uuid, governance_question_version integer, workspace_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(question_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to create GovernanceIQ questions.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'create_governance_question', idempotency_key, safe_input);
  if command.result ? 'governance_question_id' then
    select id, version, workspace_id, status into governance_question_id, governance_question_version, workspace_id, status from public.governance_questions where id = (command.result ->> 'governance_question_id')::uuid;
    return next;
    return;
  end if;
  insert into public.governance_questions (
    workspace_id, governance_record_id, governance_document_id, governance_conflict_id, governance_finding_id,
    question, target_role, why_it_matters, source_reason, source_anchor, professional_review_recommended,
    analysis_run_id, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, nullif(safe_input ->> 'governanceDocumentId', '')::uuid,
    nullif(safe_input ->> 'governanceConflictId', '')::uuid, nullif(safe_input ->> 'governanceFindingId', '')::uuid,
    coalesce(nullif(safe_input ->> 'question', ''), 'What source fact needs verification?'),
    coalesce(nullif(safe_input ->> 'targetRole', ''), 'unknown'),
    coalesce(nullif(safe_input ->> 'whyItMatters', ''), 'This may affect the Deal review.'),
    coalesce(nullif(safe_input ->> 'sourceReason', ''), 'Source-linked GovernanceIQ ambiguity.'),
    coalesce(safe_input -> 'sourceAnchor', '{}'::jsonb),
    coalesce(nullif(safe_input ->> 'professionalReviewRecommended', '')::boolean, false),
    nullif(safe_input ->> 'analysisRunId', '')::uuid, current_user_id, current_user_id
  )
  returning id, version, workspace_id, status into governance_question_id, governance_question_version, workspace_id, status;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.question_created', 'governance_questions', 'governance_question', governance_question_id, 'create_governance_question', command.idempotency_key || ':audit', jsonb_build_object('status', status), jsonb_build_object('source_linked', safe_input ? 'sourceAnchor'))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_question_id', governance_question_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.mark_governance_analysis_stale(target_governance_record_id uuid, stale_input jsonb, idempotency_key text)
returns table (governance_record_id uuid, workspace_id uuid, stale_analysis_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(stale_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to mark GovernanceIQ stale.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'mark_governance_analysis_stale', idempotency_key, safe_input);
  update public.governance_documents set stale_analysis = true, updated_by = current_user_id where workspace_id = target_record.workspace_id and governance_record_id = target_record.id and archived_at is null;
  update public.governance_analysis_runs set status = 'stale', updated_by = current_user_id where workspace_id = target_record.workspace_id and governance_record_id = target_record.id and status in ('completed', 'partial');
  get diagnostics stale_analysis_count = row_count;
  governance_record_id := target_record.id;
  workspace_id := target_record.workspace_id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.analysis_stale', 'governance_record', target_record.id, target_record.version, 'mark_governance_analysis_stale', command.idempotency_key || ':governance.analysis_stale', jsonb_build_object('reason', safe_input ->> 'reason'))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_record_id', governance_record_id, 'stale_analysis_count', stale_analysis_count) where id = command.id;
  return next;
end;
$$;

alter table public.governance_analysis_runs enable row level security;
alter table public.governance_document_relationships enable row level security;
alter table public.governance_hierarchy_candidates enable row level security;
alter table public.governance_extraction_items enable row level security;
alter table public.governance_questions enable row level security;

create policy "governance analysis runs read workspace members" on public.governance_analysis_runs for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance analysis runs no direct insert" on public.governance_analysis_runs for insert to authenticated with check (false);
create policy "governance analysis runs no direct update" on public.governance_analysis_runs for update to authenticated using (false) with check (false);
create policy "governance analysis runs no direct delete" on public.governance_analysis_runs for delete to authenticated using (false);

create policy "governance document relationships read workspace members" on public.governance_document_relationships for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance document relationships no direct insert" on public.governance_document_relationships for insert to authenticated with check (false);
create policy "governance document relationships no direct update" on public.governance_document_relationships for update to authenticated using (false) with check (false);
create policy "governance document relationships no direct delete" on public.governance_document_relationships for delete to authenticated using (false);

create policy "governance hierarchy candidates read workspace members" on public.governance_hierarchy_candidates for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance hierarchy candidates no direct insert" on public.governance_hierarchy_candidates for insert to authenticated with check (false);
create policy "governance hierarchy candidates no direct update" on public.governance_hierarchy_candidates for update to authenticated using (false) with check (false);
create policy "governance hierarchy candidates no direct delete" on public.governance_hierarchy_candidates for delete to authenticated using (false);

create policy "governance extraction items read workspace members" on public.governance_extraction_items for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance extraction items no direct insert" on public.governance_extraction_items for insert to authenticated with check (false);
create policy "governance extraction items no direct update" on public.governance_extraction_items for update to authenticated using (false) with check (false);
create policy "governance extraction items no direct delete" on public.governance_extraction_items for delete to authenticated using (false);

create policy "governance questions read workspace members" on public.governance_questions for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance questions no direct insert" on public.governance_questions for insert to authenticated with check (false);
create policy "governance questions no direct update" on public.governance_questions for update to authenticated using (false) with check (false);
create policy "governance questions no direct delete" on public.governance_questions for delete to authenticated using (false);

grant select on public.governance_analysis_runs to authenticated;
grant select on public.governance_document_relationships to authenticated;
grant select on public.governance_hierarchy_candidates to authenticated;
grant select on public.governance_extraction_items to authenticated;
grant select on public.governance_questions to authenticated;
revoke insert, update, delete on public.governance_analysis_runs from authenticated;
revoke insert, update, delete on public.governance_document_relationships from authenticated;
revoke insert, update, delete on public.governance_hierarchy_candidates from authenticated;
revoke insert, update, delete on public.governance_extraction_items from authenticated;
revoke insert, update, delete on public.governance_questions from authenticated;

revoke all on function public.start_governance_analysis_run(uuid, jsonb, text) from public;
revoke all on function public.complete_governance_analysis_run(uuid, jsonb, integer, text) from public;
revoke all on function public.record_governance_document_classification(uuid, jsonb, integer, text) from public;
revoke all on function public.propose_governance_document_relationship(uuid, jsonb, text) from public;
revoke all on function public.record_governance_hierarchy_candidate(uuid, jsonb, text) from public;
revoke all on function public.record_governance_extraction_item(uuid, jsonb, text) from public;
revoke all on function public.create_governance_question(uuid, jsonb, text) from public;
revoke all on function public.mark_governance_analysis_stale(uuid, jsonb, text) from public;
revoke execute on function public.start_governance_analysis_run(uuid, jsonb, text) from public, anon;
revoke execute on function public.complete_governance_analysis_run(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.record_governance_document_classification(uuid, jsonb, integer, text) from public, anon;
revoke execute on function public.propose_governance_document_relationship(uuid, jsonb, text) from public, anon;
revoke execute on function public.record_governance_hierarchy_candidate(uuid, jsonb, text) from public, anon;
revoke execute on function public.record_governance_extraction_item(uuid, jsonb, text) from public, anon;
revoke execute on function public.create_governance_question(uuid, jsonb, text) from public, anon;
revoke execute on function public.mark_governance_analysis_stale(uuid, jsonb, text) from public, anon;
grant execute on function public.start_governance_analysis_run(uuid, jsonb, text) to authenticated;
grant execute on function public.complete_governance_analysis_run(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.record_governance_document_classification(uuid, jsonb, integer, text) to authenticated;
grant execute on function public.propose_governance_document_relationship(uuid, jsonb, text) to authenticated;
grant execute on function public.record_governance_hierarchy_candidate(uuid, jsonb, text) to authenticated;
grant execute on function public.record_governance_extraction_item(uuid, jsonb, text) to authenticated;
grant execute on function public.create_governance_question(uuid, jsonb, text) to authenticated;
grant execute on function public.mark_governance_analysis_stale(uuid, jsonb, text) to authenticated;

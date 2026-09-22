-- Specification 011A R1: one immutable, versioned ContractIQ report snapshot
-- shared by future Full, Summary, Questions, and role-specific outputs.
-- ContractIQ owns snapshot truth and reconciliation. ReportIQ continues to own
-- rendering, artifacts, storage, exports, and sharing.

create extension if not exists pgcrypto;

create table if not exists public.contractiq_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  contract_id uuid not null,
  contract_version integer not null check (contract_version > 0),
  perspective text not null references public.contract_perspective_definitions(perspective_key),
  analysis_run_id uuid not null,
  analysis_run_version integer not null check (analysis_run_version > 0),
  analysis_contract_version text not null,
  analysis_state text not null,
  analysis_generated_at timestamptz not null,
  analysis_effective_at timestamptz not null,
  snapshot_version integer not null check (snapshot_version > 0),
  snapshot_contract_version text not null default 'contractiq-report-snapshot-v1',
  template_contract_version text not null default 'contractiq-report-template-contract-v1',
  source_document_cutoff_at timestamptz not null,
  source_version_graph jsonb not null check (jsonb_typeof(source_version_graph) = 'object'),
  source_version_graph_hash text not null,
  evidence_set_hash text not null,
  question_registry_version text not null,
  deadline_set_version text not null,
  conflict_set_version text not null,
  content_hash text not null,
  snapshot_payload jsonb not null check (jsonb_typeof(snapshot_payload) = 'object'),
  input_counts jsonb not null default '{}'::jsonb check (jsonb_typeof(input_counts) = 'object'),
  snapshot_state text not null check (snapshot_state in (
    'draft','generating','current','current_with_open_questions','current_with_conflicts',
    'stale','failed_with_prior_valid','superseded','professional_review_recommended'
  )),
  reconciliation_status text not null check (reconciliation_status in (
    'reconciled','stale','source_version_mismatch','question_version_mismatch',
    'deadline_version_mismatch','conflict_version_mismatch','unauthorized_source',
    'incomplete_material_context'
  )),
  reconciliation_details jsonb not null default '{}'::jsonb check (jsonb_typeof(reconciliation_details) = 'object'),
  report_eligibility jsonb not null check (jsonb_typeof(report_eligibility) = 'object'),
  recommendation_state text check (recommendation_state is null or recommendation_state in (
    'Proceed','Proceed with Conditions','Pause Pending Information',
    'Renegotiate Material Terms','Do Not Proceed'
  )),
  professional_review_state text not null default 'not_required' check (professional_review_state in (
    'not_required','recommended','required','completed'
  )),
  is_current boolean not null default true,
  stale_reason text,
  superseded_by_snapshot_id uuid,
  correlation_id uuid not null default gen_random_uuid(),
  generation_duration_ms integer not null default 0 check (generation_duration_ms >= 0),
  generated_at timestamptz not null default now(),
  last_reconciled_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint contractiq_report_snapshots_deal_fk
    foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contractiq_report_snapshots_property_fk
    foreign key (workspace_id, property_id) references public.properties(workspace_id, id) on delete restrict,
  constraint contractiq_report_snapshots_contract_fk
    foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contractiq_report_snapshots_analysis_fk
    foreign key (workspace_id, analysis_run_id) references public.contract_perspective_analysis_runs(workspace_id, id) on delete restrict,
  constraint contractiq_report_snapshots_superseded_by_fk
    foreign key (workspace_id, superseded_by_snapshot_id) references public.contractiq_report_snapshots(workspace_id, id),
  constraint contractiq_report_snapshots_hash_format check (
    source_version_graph_hash ~ '^[0-9a-f]{64}$'
    and evidence_set_hash ~ '^[0-9a-f]{64}$'
    and question_registry_version ~ '^[0-9a-f]{64}$'
    and deadline_set_version ~ '^[0-9a-f]{64}$'
    and conflict_set_version ~ '^[0-9a-f]{64}$'
    and content_hash ~ '^[0-9a-f]{64}$'
  ),
  unique (workspace_id, id),
  unique (workspace_id, contract_id, perspective, snapshot_version),
  unique (workspace_id, contract_id, perspective, analysis_run_id, source_version_graph_hash, content_hash)
);

create unique index if not exists idx_contractiq_report_snapshots_current
  on public.contractiq_report_snapshots(workspace_id, deal_id, contract_id, perspective)
  where is_current is true;
create index if not exists idx_contractiq_report_snapshots_deal_history
  on public.contractiq_report_snapshots(workspace_id, deal_id, generated_at desc);
create index if not exists idx_contractiq_report_snapshots_contract_history
  on public.contractiq_report_snapshots(workspace_id, contract_id, perspective, generated_at desc);
create index if not exists idx_contractiq_report_snapshots_analysis
  on public.contractiq_report_snapshots(workspace_id, analysis_run_id);
create index if not exists idx_contractiq_report_snapshots_property
  on public.contractiq_report_snapshots(workspace_id, property_id, generated_at desc);
create index if not exists idx_contractiq_report_snapshots_content_hash
  on public.contractiq_report_snapshots(workspace_id, content_hash);
create index if not exists idx_contractiq_report_snapshots_superseded_by
  on public.contractiq_report_snapshots(workspace_id, superseded_by_snapshot_id)
  where superseded_by_snapshot_id is not null;
create index if not exists idx_contractiq_report_snapshots_created_by
  on public.contractiq_report_snapshots(created_by)
  where created_by is not null;

create or replace function public.contractiq_report_hash(payload jsonb)
returns text
language sql
immutable
parallel safe
set search_path = public, extensions, pg_temp
as $$
  select encode(extensions.digest(convert_to(coalesce(payload, '{}'::jsonb)::text, 'UTF8'), 'sha256'), 'hex');
$$;

create or replace function public.protect_contractiq_report_snapshot_content()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.workspace_id is distinct from old.workspace_id
    or new.deal_id is distinct from old.deal_id
    or new.property_id is distinct from old.property_id
    or new.contract_id is distinct from old.contract_id
    or new.contract_version is distinct from old.contract_version
    or new.perspective is distinct from old.perspective
    or new.analysis_run_id is distinct from old.analysis_run_id
    or new.analysis_run_version is distinct from old.analysis_run_version
    or new.analysis_contract_version is distinct from old.analysis_contract_version
    or new.analysis_state is distinct from old.analysis_state
    or new.analysis_generated_at is distinct from old.analysis_generated_at
    or new.analysis_effective_at is distinct from old.analysis_effective_at
    or new.snapshot_version is distinct from old.snapshot_version
    or new.snapshot_contract_version is distinct from old.snapshot_contract_version
    or new.template_contract_version is distinct from old.template_contract_version
    or new.source_document_cutoff_at is distinct from old.source_document_cutoff_at
    or new.source_version_graph is distinct from old.source_version_graph
    or new.source_version_graph_hash is distinct from old.source_version_graph_hash
    or new.evidence_set_hash is distinct from old.evidence_set_hash
    or new.question_registry_version is distinct from old.question_registry_version
    or new.deadline_set_version is distinct from old.deadline_set_version
    or new.conflict_set_version is distinct from old.conflict_set_version
    or new.content_hash is distinct from old.content_hash
    or new.snapshot_payload is distinct from old.snapshot_payload
    or new.input_counts is distinct from old.input_counts
    or new.report_eligibility is distinct from old.report_eligibility
    or new.recommendation_state is distinct from old.recommendation_state
    or new.professional_review_state is distinct from old.professional_review_state
    or new.correlation_id is distinct from old.correlation_id
    or new.generation_duration_ms is distinct from old.generation_duration_ms
    or new.generated_at is distinct from old.generated_at
    or new.created_by is distinct from old.created_by then
    raise exception 'ContractIQ report snapshot content is immutable. Create a new snapshot version.' using errcode = '55000';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_contractiq_report_snapshot_content on public.contractiq_report_snapshots;
create trigger protect_contractiq_report_snapshot_content
before update on public.contractiq_report_snapshots
for each row execute function public.protect_contractiq_report_snapshot_content();

alter table public.contractiq_report_snapshots enable row level security;

create policy "contractiq report snapshots read authorized workspace"
  on public.contractiq_report_snapshots for select to authenticated
  using (
    (select public.is_workspace_member(workspace_id))
    and exists (
      select 1 from public.contracts contract
      where contract.workspace_id = contractiq_report_snapshots.workspace_id
        and contract.id = contractiq_report_snapshots.contract_id
        and contract.archived_at is null
    )
  );
create policy "contractiq report snapshots no direct insert"
  on public.contractiq_report_snapshots for insert to authenticated with check (false);
create policy "contractiq report snapshots no direct update"
  on public.contractiq_report_snapshots for update to authenticated using (false) with check (false);
create policy "contractiq report snapshots no direct delete"
  on public.contractiq_report_snapshots for delete to authenticated using (false);

create or replace view public.contractiq_report_snapshot_projection
with (security_invoker = true)
as
select
  snapshot.id as snapshot_id,
  snapshot.snapshot_version,
  snapshot.snapshot_contract_version,
  snapshot.workspace_id,
  snapshot.deal_id,
  snapshot.property_id,
  snapshot.contract_id,
  snapshot.contract_version,
  snapshot.perspective,
  snapshot.analysis_run_id,
  snapshot.analysis_run_version,
  snapshot.analysis_contract_version,
  snapshot.analysis_state,
  snapshot.analysis_generated_at,
  snapshot.source_document_cutoff_at,
  snapshot.source_version_graph_hash,
  snapshot.evidence_set_hash,
  snapshot.question_registry_version,
  snapshot.deadline_set_version,
  snapshot.conflict_set_version,
  snapshot.content_hash,
  snapshot.snapshot_state,
  snapshot.reconciliation_status,
  snapshot.reconciliation_details,
  snapshot.report_eligibility,
  snapshot.recommendation_state,
  snapshot.professional_review_state,
  snapshot.input_counts,
  snapshot.is_current,
  snapshot.stale_reason,
  snapshot.superseded_by_snapshot_id,
  snapshot.generated_at,
  snapshot.last_reconciled_at,
  snapshot.snapshot_payload
from public.contractiq_report_snapshots snapshot;

create or replace function public.create_contractiq_report_snapshot(
  target_contract_id uuid,
  target_perspective text,
  expected_analysis_run_id uuid,
  idempotency_key text,
  correlation_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
#variable_conflict use_variable
declare
  started_at timestamptz := clock_timestamp();
  current_user_id uuid := auth.uid();
  target_contract public.contracts%rowtype;
  target_analysis public.contract_perspective_analysis_runs%rowtype;
  command public.contract_command_requests%rowtype;
  prior_snapshot public.contractiq_report_snapshots%rowtype;
  existing_snapshot public.contractiq_report_snapshots%rowtype;
  inserted_snapshot public.contractiq_report_snapshots%rowtype;
  document_inventory jsonb := '[]'::jsonb;
  evidence_inventory jsonb := '[]'::jsonb;
  party_inventory jsonb := '[]'::jsonb;
  term_inventory jsonb := '[]'::jsonb;
  deadline_inventory jsonb := '[]'::jsonb;
  finding_inventory jsonb := '[]'::jsonb;
  conflict_inventory jsonb := '[]'::jsonb;
  question_inventory jsonb := '[]'::jsonb;
  open_item_inventory jsonb := '[]'::jsonb;
  cross_module_context jsonb := '[]'::jsonb;
  amendment_inventory jsonb := '[]'::jsonb;
  source_version_graph jsonb;
  snapshot_payload jsonb;
  content_basis jsonb;
  evidence_hash text;
  question_hash text;
  deadline_hash text;
  conflict_hash text;
  graph_hash text;
  content_hash text;
  snapshot_state text;
  professional_state text := 'not_required';
  reconciliation_status text := 'reconciled';
  report_eligibility jsonb;
  blocked_reasons jsonb := '[]'::jsonb;
  recommendation_state text;
  source_cutoff timestamptz;
  snapshot_version integer;
  unresolved_question_count integer := 0;
  unresolved_conflict_count integer := 0;
  critical_conflict_count integer := 0;
  professional_review_count integer := 0;
  evidence_count integer := 0;
  failure_message text;
  failure_code text;
begin
  if current_user_id is null then
    raise exception 'Authentication required to create a ContractIQ report snapshot.' using errcode = '42501';
  end if;
  if target_perspective not in ('buyer','seller','landlord','tenant','borrower','lender','developer','investor','guarantor') then
    raise exception 'Unsupported ContractIQ report perspective.' using errcode = '22023';
  end if;

  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to create ContractIQ report snapshots.' using errcode = '42501';
  end if;

  command := public.ensure_contract_command(
    target_contract.workspace_id,
    target_contract.deal_id,
    target_contract.property_id,
    target_contract.id,
    'create_contractiq_report_snapshot',
    idempotency_key,
    jsonb_build_object(
      'contractId', target_contract.id,
      'perspective', target_perspective,
      'expectedAnalysisRunId', expected_analysis_run_id,
      'snapshotContractVersion', 'contractiq-report-snapshot-v1'
    )
  );

  if command.result ? 'snapshotId' then
    select * into existing_snapshot
    from public.contractiq_report_snapshots snapshot
    where snapshot.workspace_id = target_contract.workspace_id
      and snapshot.id = (command.result ->> 'snapshotId')::uuid;
    if existing_snapshot.id is not null then
      return command.result || jsonb_build_object('reused', true);
    end if;
  end if;

  begin
    select * into target_analysis
    from public.contract_perspective_analysis_runs analysis
    where analysis.workspace_id = target_contract.workspace_id
      and analysis.contract_id = target_contract.id
      and analysis.perspective = target_perspective
      and analysis.is_current is true
    for share;

    if target_analysis.id is null then
      raise exception 'Current ContractIQ perspective analysis is required.' using errcode = '23514';
    end if;
    if expected_analysis_run_id is not null and target_analysis.id <> expected_analysis_run_id then
      raise exception 'ContractIQ analysis changed before the report snapshot could be created.' using errcode = '40001';
    end if;
    if target_analysis.contract_version <> target_contract.version then
      raise exception 'Current ContractIQ analysis is stale for this contract version.' using errcode = '40001';
    end if;
    if target_analysis.analysis_state in ('stale','failed_with_prior_analysis') then
      raise exception 'Current ContractIQ analysis is not eligible for a report snapshot.' using errcode = '23514';
    end if;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'contractId', document.id,
      'version', document.version,
      'contractType', document.contract_type,
      'title', document.title,
      'status', document.status,
      'verificationState', document.verification_state,
      'analysisState', document.analysis_state,
      'effectiveDate', document.effective_date,
      'executionDate', document.execution_date,
      'expirationDate', document.expiration_date,
      'baseContractId', document.base_contract_id,
      'supersedesContractId', document.supersedes_contract_id,
      'supersededByContractId', document.superseded_by_contract_id,
      'sourceEvidenceId', document.source_evidence_id,
      'signatureCompletenessState', case when document.status in ('executed','closed') then 'executed' when document.status = 'partially_executed' then 'partial' else 'unknown' end
    )) order by document.created_at, document.id), '[]'::jsonb)
    into document_inventory
    from public.contracts document
    where document.workspace_id = target_contract.workspace_id
      and document.archived_at is null
      and (
        document.id = target_contract.id
        or document.base_contract_id = coalesce(target_contract.base_contract_id, target_contract.id)
        or document.id = target_contract.base_contract_id
      );

    select coalesce(jsonb_agg(jsonb_build_object(
      'contractEvidenceLinkId', link.id,
      'version', link.version,
      'evidenceId', link.evidence_id,
      'documentId', link.contract_id,
      'linkRole', link.link_role,
      'sourceAnchor', link.source_anchor,
      'verificationState', link.verification_state
    ) order by link.evidence_id, link.link_role, link.id), '[]'::jsonb)
    into evidence_inventory
    from public.contract_evidence_links link
    where link.workspace_id = target_contract.workspace_id
      and link.contract_id = target_contract.id
      and link.archived_at is null;
    evidence_count := jsonb_array_length(evidence_inventory);

    if exists (
      select 1 from jsonb_array_elements(evidence_inventory) item
      where not exists (
        select 1 from public.evidence_items evidence
        where evidence.workspace_id = target_contract.workspace_id
          and evidence.id = (item ->> 'evidenceId')::uuid
      )
    ) then
      raise exception 'Unauthorized Evidence cannot enter a ContractIQ report snapshot.' using errcode = '42501';
    end if;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'partyId', party.id,
      'version', party.version,
      'partyRole', party.party_role,
      'legalName', party.legal_name,
      'displayName', party.display_name,
      'authorityCapacity', party.authority_capacity,
      'signatureStatus', party.signature_status,
      'signatureDate', party.signature_date,
      'evidenceClassification', case when party.verification_state in ('source_backed','verified','professional_verified') then 'verified_fact' else 'open_question' end,
      'verificationState', party.verification_state,
      'evidenceId', party.source_evidence_id,
      'sourceAnchor', party.source_anchor
    )) order by party.party_role, party.display_name, party.id), '[]'::jsonb)
    into party_inventory
    from public.contract_parties party
    where party.workspace_id = target_contract.workspace_id
      and party.contract_id = target_contract.id
      and party.archived_at is null;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'termId', term.id,
      'version', term.version,
      'category', term.term_category,
      'termType', term.term_type,
      'title', term.title,
      'normalizedValue', term.normalized_value,
      'displayValue', term.display_value,
      'unit', term.unit,
      'currency', term.currency,
      'effectiveDate', term.effective_date,
      'materiality', term.materiality,
      'perspective', term.applicable_perspective,
      'evidenceClassification', case when term.verification_state in ('source_backed','verified','professional_verified') then 'verified_fact' when term.verification_state = 'conflicted' then 'supported_concern' else 'open_question' end,
      'verificationState', term.verification_state,
      'evidenceId', term.source_evidence_id,
      'sourceAnchor', term.source_anchor,
      'sourceQuoteRef', term.source_quote_ref,
      'supersededByTermId', term.superseded_by_term_id,
      'inclusion', jsonb_build_object(
        'fullReport', term.materiality <> 'immaterial',
        'summaryReport', term.materiality in ('material','critical'),
        'questionsReport', false,
        'professionalOnly', false,
        'optionalAppendix', term.materiality in ('informational','unknown'),
        'excludedNonMaterial', term.materiality = 'immaterial'
      )
    )) order by term.term_category, term.term_type, term.id), '[]'::jsonb)
    into term_inventory
    from public.contract_terms term
    where term.workspace_id = target_contract.workspace_id
      and term.contract_id = target_contract.id
      and term.archived_at is null
      and term.proposal_state = 'accepted'
      and term.superseded_by_term_id is null;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'deadlineId', deadline.id,
      'deadlineVersion', deadline.version,
      'calculationId', result.id,
      'calculationVersion', result.calculation_version,
      'calculationContractVersion', result.calculation_contract_version,
      'deadlineType', deadline.deadline_type,
      'triggerType', deadline.trigger_type,
      'triggerAt', result.trigger_at,
      'triggerState', result.trigger_verification,
      'dueAt', result.due_at,
      'timezone', result.timezone,
      'status', result.status,
      'staleReason', result.stale_reason,
      'verificationState', deadline.verification_state,
      'evidenceClassification', case when result.trigger_verification in ('user_confirmed','source_verified','professional_verified') then 'verified_fact' else 'open_question' end,
      'evidenceId', result.source_evidence_id,
      'sourceAnchor', result.source_anchor,
      'deterministicHash', result.deterministic_hash,
      'inclusion', jsonb_build_object('fullReport', true, 'summaryReport', true, 'questionsReport', false, 'professionalOnly', false, 'optionalAppendix', false, 'excludedNonMaterial', false)
    )) order by result.due_at nulls last, deadline.deadline_type, deadline.id), '[]'::jsonb)
    into deadline_inventory
    from public.contract_deadlines deadline
    join public.contract_deadline_results result
      on result.workspace_id = deadline.workspace_id
     and result.contract_deadline_id = deadline.id
     and result.is_current is true
    where deadline.workspace_id = target_contract.workspace_id
      and deadline.contract_id = target_contract.id
      and deadline.archived_at is null;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'findingId', item.id,
      'version', item.version,
      'analysisRunId', item.analysis_run_id,
      'findingGroup', item.finding_group,
      'findingType', item.finding_type,
      'category', item.category,
      'severity', item.severity,
      'title', item.title,
      'summary', item.summary,
      'perspective', item.perspective,
      'evidenceClassification', case when item.item_kind = 'professional_review_item' then 'professional_recommendation' when item.finding_group = 'missing_information' then 'open_question' else 'supported_concern' end,
      'sourceRefs', item.source_refs,
      'professionalReviewRequired', item.professional_review_required,
      'status', item.status,
      'inclusion', jsonb_build_object(
        'fullReport', item.status in ('current','open','needs_review'),
        'summaryReport', coalesce(item.severity, 'unknown') in ('high','critical') or item.professional_review_required or item.finding_group in ('conflict','missing_protection','missing_information'),
        'questionsReport', item.item_kind = 'question',
        'professionalOnly', item.item_kind = 'professional_review_item',
        'optionalAppendix', coalesce(item.severity, 'unknown') in ('informational','low','unknown'),
        'excludedNonMaterial', item.status in ('stale','superseded','candidate_only')
      )
    )) order by item.finding_group, item.severity desc nulls last, item.id), '[]'::jsonb)
    into finding_inventory
    from public.contract_perspective_analysis_items item
    where item.workspace_id = target_contract.workspace_id
      and item.analysis_run_id = target_analysis.id
      and item.item_kind in ('finding','professional_review_item');

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'conflictId', conflict.id,
      'version', conflict.version,
      'conflictType', conflict.conflict_type,
      'summary', conflict.summary,
      'severity', conflict.severity,
      'resolutionState', conflict.resolution_state,
      'resolutionNotes', conflict.resolution_notes,
      'resolvedAt', conflict.resolved_at,
      'professionalReviewRequired', conflict.professional_review_required,
      'sourceA', jsonb_build_object('contractId', conflict.source_a_contract_id, 'termId', conflict.source_a_term_id, 'evidenceId', conflict.source_a_evidence_id, 'sourceAnchor', conflict.source_a_anchor),
      'sourceB', jsonb_build_object('contractId', conflict.source_b_contract_id, 'termId', conflict.source_b_term_id, 'evidenceId', conflict.source_b_evidence_id, 'sourceAnchor', conflict.source_b_anchor),
      'evidenceClassification', 'supported_concern',
      'inclusion', jsonb_build_object('fullReport', true, 'summaryReport', conflict.severity in ('high','critical') or conflict.resolution_state <> 'resolved', 'questionsReport', false, 'professionalOnly', false, 'optionalAppendix', conflict.resolution_state in ('resolved','superseded'), 'excludedNonMaterial', false)
    )) order by conflict.severity desc, conflict.id), '[]'::jsonb)
    into conflict_inventory
    from public.contract_conflicts conflict
    where conflict.workspace_id = target_contract.workspace_id
      and conflict.contract_id = target_contract.id
      and conflict.archived_at is null;

    select count(*) filter (where conflict.resolution_state in ('unresolved','under_review','professional_review_required')),
           count(*) filter (where conflict.severity = 'critical' and conflict.resolution_state in ('unresolved','under_review','professional_review_required'))
    into unresolved_conflict_count, critical_conflict_count
    from public.contract_conflicts conflict
    where conflict.workspace_id = target_contract.workspace_id
      and conflict.contract_id = target_contract.id
      and conflict.archived_at is null;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'questionId', question.id,
      'version', question.version,
      'wording', question.question,
      'recipientRole', question.recipient_role,
      'priority', question.priority,
      'rationale', question.rationale,
      'linkedTermId', question.contract_term_id,
      'linkedFindingId', question.contract_finding_id,
      'linkedConflictId', question.contract_conflict_id,
      'perspective', question.perspective,
      'status', question.status,
      'response', question.response,
      'responseEvidenceId', question.response_source_evidence_id,
      'resolutionState', question.resolution_state,
      'reportInclusion', question.report_inclusion,
      'evidenceClassification', 'open_question',
      'evidenceId', question.source_evidence_id,
      'sourceAnchor', question.source_anchor
    )) order by question.recipient_role, question.priority desc, question.id), '[]'::jsonb)
    into question_inventory
    from public.contract_questions question
    where question.workspace_id = target_contract.workspace_id
      and question.contract_id = target_contract.id
      and question.archived_at is null
      and (question.perspective is null or question.perspective = target_perspective);
    select count(*) into unresolved_question_count
    from public.contract_questions question
    where question.workspace_id = target_contract.workspace_id
      and question.contract_id = target_contract.id
      and question.archived_at is null
      and (question.perspective is null or question.perspective = target_perspective)
      and question.status in ('open','in_progress')
      and question.resolution_state in ('unresolved','professional_review_required');

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'itemType', 'question',
      'itemId', question.id,
      'version', question.version,
      'item', question.question,
      'responsibleRole', question.recipient_role,
      'evidenceNeeded', question.source_reason,
      'preferredResolution', question.rationale,
      'status', case when question.status = 'in_progress' then 'In Progress' when question.status in ('resolved','answered') then 'Resolved' when question.status = 'accepted' then 'Accepted' else 'Open' end
    )) order by question.priority desc, question.id), '[]'::jsonb)
    into open_item_inventory
    from public.contract_questions question
    where question.workspace_id = target_contract.workspace_id
      and question.contract_id = target_contract.id
      and question.archived_at is null
      and (question.perspective is null or question.perspective = target_perspective)
      and question.status not in ('dismissed','superseded');

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'amendmentImpactId', impact.id,
      'version', impact.version,
      'relationshipId', impact.relationship_id,
      'baseContractId', impact.base_contract_id,
      'amendmentContractId', impact.amendment_contract_id,
      'impactType', impact.impact_type,
      'impactSummary', impact.impact_summary,
      'changedTermIds', impact.changed_term_ids,
      'supersededTermIds', impact.superseded_term_ids,
      'addedTermIds', impact.added_term_ids,
      'changedDeadlineIds', impact.changed_deadline_ids,
      'conflictIds', impact.conflict_ids,
      'sourceRefs', impact.source_refs,
      'status', impact.status
    )) order by impact.id), '[]'::jsonb)
    into amendment_inventory
    from public.contract_amendment_impact_results impact
    where impact.workspace_id = target_contract.workspace_id
      and impact.analysis_run_id = target_analysis.id;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'proposalId', proposal.id,
      'version', proposal.version,
      'targetDomain', proposal.target_domain,
      'targetCanonicalType', proposal.target_canonical_type,
      'targetCanonicalId', proposal.target_canonical_id,
      'targetVersion', proposal.new_target_version,
      'state', proposal.state,
      'sourceEvidenceId', proposal.source_evidence_id,
      'sourceAnchor', proposal.source_anchor,
      'normalizedValue', case when proposal.state = 'completed' then proposal.normalized_value else '{}'::jsonb end,
      'priorValidReference', proposal.prior_valid_reference
    )) order by proposal.target_domain, proposal.id), '[]'::jsonb)
    into cross_module_context
    from public.contract_downstream_change_proposals proposal
    where proposal.workspace_id = target_contract.workspace_id
      and proposal.contract_id = target_contract.id
      and proposal.state in ('completed','failed_with_prior_valid','stale');

    select count(*) into professional_review_count
    from public.contract_perspective_analysis_items item
    where item.workspace_id = target_contract.workspace_id
      and item.analysis_run_id = target_analysis.id
      and item.professional_review_required is true
      and item.status not in ('stale','superseded');

    evidence_hash := public.contractiq_report_hash(evidence_inventory);
    question_hash := public.contractiq_report_hash(question_inventory);
    deadline_hash := public.contractiq_report_hash(deadline_inventory);
    conflict_hash := public.contractiq_report_hash(conflict_inventory);
    source_cutoff := greatest(
      target_contract.updated_at,
      target_analysis.generated_at,
      coalesce((select max(link.updated_at) from public.contract_evidence_links link where link.workspace_id = target_contract.workspace_id and link.contract_id = target_contract.id and link.archived_at is null), '-infinity'::timestamptz),
      coalesce((select max(question.updated_at) from public.contract_questions question where question.workspace_id = target_contract.workspace_id and question.contract_id = target_contract.id and question.archived_at is null), '-infinity'::timestamptz),
      coalesce((select max(result.generated_at) from public.contract_deadline_results result where result.workspace_id = target_contract.workspace_id and result.contract_id = target_contract.id and result.is_current is true), '-infinity'::timestamptz),
      coalesce((select max(conflict.updated_at) from public.contract_conflicts conflict where conflict.workspace_id = target_contract.workspace_id and conflict.contract_id = target_contract.id and conflict.archived_at is null), '-infinity'::timestamptz)
    );

    source_version_graph := jsonb_build_object(
      'graphContractVersion', 'contractiq-report-source-graph-v1',
      'contract', jsonb_build_object('id', target_contract.id, 'version', target_contract.version),
      'analysis', jsonb_build_object('id', target_analysis.id, 'version', target_analysis.version, 'deterministicHash', target_analysis.deterministic_hash),
      'evidenceSetHash', evidence_hash,
      'questionRegistryVersion', question_hash,
      'deadlineSetVersion', deadline_hash,
      'conflictSetVersion', conflict_hash,
      'sourceDocumentCutoffAt', source_cutoff
    );
    graph_hash := public.contractiq_report_hash(source_version_graph);

    if evidence_count = 0 then
      reconciliation_status := 'incomplete_material_context';
      blocked_reasons := blocked_reasons || jsonb_build_array('missing_required_contract_evidence');
    end if;
    if target_analysis.completeness_state in ('partial','missing_source','stale','failed_with_prior_valid') then
      blocked_reasons := blocked_reasons || jsonb_build_array('analysis_incomplete_or_stale');
    end if;
    if critical_conflict_count > 0 then
      blocked_reasons := blocked_reasons || jsonb_build_array('critical_source_conflict');
    end if;

    if unresolved_conflict_count > 0 then
      snapshot_state := 'current_with_conflicts';
    elsif unresolved_question_count > 0 then
      snapshot_state := 'current_with_open_questions';
    elsif professional_review_count > 0 then
      snapshot_state := 'professional_review_recommended';
    else
      snapshot_state := 'current';
    end if;
    if professional_review_count > 0 or unresolved_conflict_count > 0 then professional_state := 'recommended'; end if;

    recommendation_state := case
      when target_analysis.result_payload ->> 'currentPosition' in ('Proceed','Proceed with Conditions','Pause Pending Information','Renegotiate Material Terms','Do Not Proceed')
        then target_analysis.result_payload ->> 'currentPosition'
      else null
    end;

    report_eligibility := jsonb_build_object(
      'fullReport', jsonb_build_object('eligible', jsonb_array_length(blocked_reasons) = 0, 'blockingReasons', blocked_reasons),
      'summaryReport', jsonb_build_object('eligible', jsonb_array_length(blocked_reasons) = 0, 'blockingReasons', blocked_reasons),
      'questionsReport', jsonb_build_object('eligible', reconciliation_status = 'reconciled', 'blockingReasons', case when reconciliation_status = 'reconciled' then '[]'::jsonb else blocked_reasons end),
      'openQuestionsAreDisclosureNotBlocker', true
    );

    snapshot_payload := jsonb_build_object(
      'identity', jsonb_build_object('workspaceId', target_contract.workspace_id, 'dealId', target_contract.deal_id, 'propertyId', target_contract.property_id, 'contractId', target_contract.id, 'contractVersion', target_contract.version, 'perspective', target_perspective),
      'analysis', jsonb_build_object('analysisId', target_analysis.id, 'analysisVersion', target_analysis.version, 'analysisContractVersion', target_analysis.analysis_contract_version, 'analysisStatus', target_analysis.analysis_state, 'generatedAt', target_analysis.generated_at, 'effectiveAt', target_analysis.generated_at),
      'sourceCutoff', source_version_graph,
      'documentInventory', document_inventory,
      'evidenceInventory', evidence_inventory,
      'partiesProperty', jsonb_build_object('parties', party_inventory, 'propertyId', target_contract.property_id, 'identityConflicts', (select coalesce(jsonb_agg(item), '[]'::jsonb) from jsonb_array_elements(conflict_inventory) item where item ->> 'conflictType' in ('party_conflict','property_conflict'))),
      'economicTerms', (select coalesce(jsonb_agg(item), '[]'::jsonb) from jsonb_array_elements(term_inventory) item where item ->> 'category' in ('economic','financing','lease_specific')),
      'contingenciesRightsObligations', (select coalesce(jsonb_agg(item), '[]'::jsonb) from jsonb_array_elements(term_inventory) item where item ->> 'category' not in ('economic','financing','lease_specific')),
      'deadlines', deadline_inventory,
      'findings', finding_inventory,
      'conflicts', conflict_inventory,
      'questions', question_inventory,
      'openItems', open_item_inventory,
      'amendmentImpacts', amendment_inventory,
      'crossModuleContext', cross_module_context,
      'ownershipExposure', jsonb_build_object('status', 'canonical_inputs_only', 'numericCalculationsOwnedExternally', true, 'unknownFutureCostRemainsUnknown', true),
      'externalResearch', '[]'::jsonb,
      'recommendation', jsonb_build_object('currentPosition', recommendation_state, 'rationaleReferences', coalesce(target_analysis.result_payload -> 'recommendationRationaleRefs', '[]'::jsonb), 'conditions', coalesce(target_analysis.result_payload -> 'recommendationConditions', '[]'::jsonb), 'unresolvedBlockers', blocked_reasons, 'materialityState', case when jsonb_array_length(blocked_reasons) > 0 then 'material_context_incomplete' else 'reconciled' end),
      'reportMetadata', jsonb_build_object('templateContractVersion', 'contractiq-report-template-contract-v1', 'snapshotContractVersion', 'contractiq-report-snapshot-v1', 'professionalReviewState', professional_state)
    );

    content_basis := snapshot_payload || jsonb_build_object(
      'sourceVersionGraphHash', graph_hash,
      'reportEligibility', report_eligibility,
      'snapshotState', snapshot_state,
      'reconciliationStatus', reconciliation_status
    );
    content_hash := public.contractiq_report_hash(content_basis);

    select * into existing_snapshot
    from public.contractiq_report_snapshots snapshot
    where snapshot.workspace_id = target_contract.workspace_id
      and snapshot.contract_id = target_contract.id
      and snapshot.perspective = target_perspective
      and snapshot.analysis_run_id = target_analysis.id
      and snapshot.source_version_graph_hash = graph_hash
      and snapshot.content_hash = content_hash;
    if existing_snapshot.id is not null then
      update public.contract_command_requests request
      set result = jsonb_build_object('snapshotId', existing_snapshot.id, 'snapshotVersion', existing_snapshot.snapshot_version, 'snapshotState', existing_snapshot.snapshot_state, 'contentHash', existing_snapshot.content_hash, 'reconciliationStatus', existing_snapshot.reconciliation_status, 'failureCode', null)
      where request.id = command.id;
      return jsonb_build_object('snapshotId', existing_snapshot.id, 'snapshotVersion', existing_snapshot.snapshot_version, 'snapshotState', existing_snapshot.snapshot_state, 'contentHash', existing_snapshot.content_hash, 'reconciliationStatus', existing_snapshot.reconciliation_status, 'failureCode', null, 'reused', true);
    end if;

    select * into prior_snapshot
    from public.contractiq_report_snapshots snapshot
    where snapshot.workspace_id = target_contract.workspace_id
      and snapshot.deal_id = target_contract.deal_id
      and snapshot.contract_id = target_contract.id
      and snapshot.perspective = target_perspective
      and snapshot.is_current is true
    for update;

    select coalesce(max(snapshot.snapshot_version), 0) + 1 into snapshot_version
    from public.contractiq_report_snapshots snapshot
    where snapshot.workspace_id = target_contract.workspace_id
      and snapshot.contract_id = target_contract.id
      and snapshot.perspective = target_perspective;

    insert into public.contractiq_report_snapshots (
      workspace_id, deal_id, property_id, contract_id, contract_version, perspective,
      analysis_run_id, analysis_run_version, analysis_contract_version, analysis_state,
      analysis_generated_at, analysis_effective_at, snapshot_version, source_document_cutoff_at,
      source_version_graph, source_version_graph_hash, evidence_set_hash, question_registry_version,
      deadline_set_version, conflict_set_version, content_hash, snapshot_payload, input_counts,
      snapshot_state, reconciliation_status, reconciliation_details, report_eligibility,
      recommendation_state, professional_review_state, correlation_id, generation_duration_ms, created_by
    ) values (
      target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, target_contract.version, target_perspective,
      target_analysis.id, target_analysis.version, target_analysis.analysis_contract_version, target_analysis.analysis_state,
      target_analysis.generated_at, target_analysis.generated_at, snapshot_version, source_cutoff,
      source_version_graph, graph_hash, evidence_hash, question_hash,
      deadline_hash, conflict_hash, content_hash, snapshot_payload,
      jsonb_build_object('documents', jsonb_array_length(document_inventory), 'evidence', evidence_count, 'parties', jsonb_array_length(party_inventory), 'terms', jsonb_array_length(term_inventory), 'deadlines', jsonb_array_length(deadline_inventory), 'findings', jsonb_array_length(finding_inventory), 'conflicts', jsonb_array_length(conflict_inventory), 'questions', jsonb_array_length(question_inventory), 'openItems', jsonb_array_length(open_item_inventory), 'crossModuleContext', jsonb_array_length(cross_module_context)),
      snapshot_state, reconciliation_status,
      jsonb_build_object('checkedAt', now(), 'sourceVersionGraphHash', graph_hash, 'unauthorizedSourceCount', 0),
      report_eligibility, recommendation_state, professional_state, correlation_id,
      greatest(0, floor(extract(epoch from (clock_timestamp() - started_at)) * 1000)::integer), current_user_id
    ) returning * into inserted_snapshot;

    if prior_snapshot.id is not null then
      update public.contractiq_report_snapshots snapshot
      set snapshot_state = 'superseded', is_current = false,
          stale_reason = 'Material canonical state changed and a reconciled successor snapshot became current.',
          superseded_by_snapshot_id = inserted_snapshot.id,
          reconciliation_status = 'stale',
          reconciliation_details = snapshot.reconciliation_details || jsonb_build_object('supersededAt', now(), 'supersededBySnapshotId', inserted_snapshot.id),
          last_reconciled_at = now()
      where snapshot.id = prior_snapshot.id;

      insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, correlation_id, payload)
      values
        (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contractiq.report_snapshot_stale', 'contractiq_report_snapshot', prior_snapshot.id, prior_snapshot.snapshot_version, 'create_contractiq_report_snapshot', command.idempotency_key || ':prior_stale', correlation_id, jsonb_build_object('snapshotId', prior_snapshot.id, 'successorSnapshotId', inserted_snapshot.id, 'reason', 'material_canonical_state_changed')),
        (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contractiq.report_snapshot_superseded', 'contractiq_report_snapshot', prior_snapshot.id, prior_snapshot.snapshot_version, 'create_contractiq_report_snapshot', command.idempotency_key || ':prior_superseded', correlation_id, jsonb_build_object('snapshotId', prior_snapshot.id, 'successorSnapshotId', inserted_snapshot.id));
    end if;

    insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, correlation_id, payload)
    values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contractiq.report_snapshot_created', 'contractiq_report_snapshot', inserted_snapshot.id, inserted_snapshot.snapshot_version, 'create_contractiq_report_snapshot', command.idempotency_key || ':created', correlation_id,
      jsonb_build_object('snapshotId', inserted_snapshot.id, 'snapshotVersion', inserted_snapshot.snapshot_version, 'contractId', target_contract.id, 'perspective', target_perspective, 'analysisRunId', target_analysis.id, 'sourceDocumentCutoffAt', source_cutoff, 'contentHash', content_hash, 'inputCounts', inserted_snapshot.input_counts, 'reconciliationStatus', reconciliation_status, 'generationDurationMs', inserted_snapshot.generation_duration_ms));

    insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
    values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contractiq.report_snapshot_created', 'contractiq_report_snapshots', 'contractiq_report_snapshot', inserted_snapshot.id, 'create_contractiq_report_snapshot', command.idempotency_key || ':audit',
      jsonb_build_object('snapshot_version', inserted_snapshot.snapshot_version, 'snapshot_state', inserted_snapshot.snapshot_state, 'content_hash', inserted_snapshot.content_hash, 'reconciliation_status', inserted_snapshot.reconciliation_status),
      array['snapshot_version','snapshot_state','content_hash','reconciliation_status'],
      jsonb_build_object('contract_id', target_contract.id, 'analysis_run_id', target_analysis.id, 'perspective', target_perspective, 'private_content_logged', false));

    update public.contract_command_requests request
    set result = jsonb_build_object('snapshotId', inserted_snapshot.id, 'snapshotVersion', inserted_snapshot.snapshot_version, 'snapshotState', inserted_snapshot.snapshot_state, 'contentHash', inserted_snapshot.content_hash, 'reconciliationStatus', inserted_snapshot.reconciliation_status, 'failureCode', null)
    where request.id = command.id;

    return command.result || jsonb_build_object('snapshotId', inserted_snapshot.id, 'snapshotVersion', inserted_snapshot.snapshot_version, 'snapshotState', inserted_snapshot.snapshot_state, 'contentHash', inserted_snapshot.content_hash, 'reconciliationStatus', inserted_snapshot.reconciliation_status, 'failureCode', null, 'reused', false);
  exception when others then
    get stacked diagnostics failure_message = message_text;
    failure_code := case sqlstate
      when '40001' then 'source_version_mismatch'
      when '42501' then 'unauthorized_source'
      when '23514' then 'incomplete_material_context'
      else 'snapshot_generation_failed'
    end;

    select * into prior_snapshot
    from public.contractiq_report_snapshots snapshot
    where snapshot.workspace_id = target_contract.workspace_id
      and snapshot.contract_id = target_contract.id
      and snapshot.perspective = target_perspective
      and snapshot.is_current is true;

    insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, correlation_id, payload)
    values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contractiq.report_snapshot_failed', 'contract', target_contract.id, target_contract.version, 'create_contractiq_report_snapshot', command.idempotency_key || ':failed', correlation_id,
      jsonb_build_object('contractId', target_contract.id, 'perspective', target_perspective, 'analysisRunId', expected_analysis_run_id, 'failureCode', failure_code, 'priorValidSnapshotId', prior_snapshot.id, 'priorValidPreserved', prior_snapshot.id is not null));

    insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, metadata)
    values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contractiq.report_snapshot_failed', 'contracts', 'contract', target_contract.id, 'create_contractiq_report_snapshot', command.idempotency_key || ':failed:audit',
      jsonb_build_object('failure_code', failure_code, 'safe_message', left(failure_message, 240), 'prior_valid_snapshot_id', prior_snapshot.id, 'private_content_logged', false));

    update public.contract_command_requests request
    set result = jsonb_build_object('snapshotId', prior_snapshot.id, 'snapshotVersion', prior_snapshot.snapshot_version, 'snapshotState', case when prior_snapshot.id is null then 'failed_with_prior_valid' else 'failed_with_prior_valid' end, 'contentHash', prior_snapshot.content_hash, 'reconciliationStatus', coalesce(prior_snapshot.reconciliation_status, 'incomplete_material_context'), 'failureCode', failure_code, 'priorValidPreserved', prior_snapshot.id is not null)
    where request.id = command.id;

    return jsonb_build_object('snapshotId', prior_snapshot.id, 'snapshotVersion', prior_snapshot.snapshot_version, 'snapshotState', 'failed_with_prior_valid', 'contentHash', prior_snapshot.content_hash, 'reconciliationStatus', coalesce(prior_snapshot.reconciliation_status, 'incomplete_material_context'), 'failureCode', failure_code, 'priorValidPreserved', prior_snapshot.id is not null, 'reused', false);
  end;
end;
$$;

create or replace function public.reconcile_contractiq_report_snapshot(
  target_snapshot_id uuid,
  idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_snapshot public.contractiq_report_snapshots%rowtype;
  target_contract public.contracts%rowtype;
  target_analysis public.contract_perspective_analysis_runs%rowtype;
  current_evidence_hash text;
  current_question_hash text;
  current_deadline_hash text;
  current_conflict_hash text;
  result_status text := 'reconciled';
  prior_state text;
begin
  if current_user_id is null then raise exception 'Authentication required to reconcile a ContractIQ report snapshot.' using errcode = '42501'; end if;
  select * into target_snapshot from public.contractiq_report_snapshots snapshot where snapshot.id = target_snapshot_id for update;
  if target_snapshot.id is null then raise exception 'ContractIQ report snapshot not found.' using errcode = 'P0002'; end if;
  target_contract := public.authorized_contract(target_snapshot.contract_id);
  if target_contract.workspace_id <> target_snapshot.workspace_id then raise exception 'ContractIQ report snapshot scope mismatch.' using errcode = '42501'; end if;

  perform public.ensure_contract_command(target_snapshot.workspace_id, target_snapshot.deal_id, target_snapshot.property_id, target_snapshot.contract_id, 'reconcile_contractiq_report_snapshot', idempotency_key, jsonb_build_object('snapshotId', target_snapshot.id, 'contentHash', target_snapshot.content_hash));

  select * into target_analysis from public.contract_perspective_analysis_runs analysis
  where analysis.workspace_id = target_snapshot.workspace_id and analysis.id = target_snapshot.analysis_run_id;

  select public.contractiq_report_hash(coalesce(jsonb_agg(jsonb_build_object(
    'contractEvidenceLinkId', link.id, 'version', link.version, 'evidenceId', link.evidence_id,
    'documentId', link.contract_id, 'linkRole', link.link_role, 'sourceAnchor', link.source_anchor,
    'verificationState', link.verification_state
  ) order by link.evidence_id, link.link_role, link.id), '[]'::jsonb)) into current_evidence_hash
  from public.contract_evidence_links link
  where link.workspace_id = target_snapshot.workspace_id and link.contract_id = target_snapshot.contract_id and link.archived_at is null;

  select public.contractiq_report_hash(coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
    'questionId', question.id, 'version', question.version, 'wording', question.question,
    'recipientRole', question.recipient_role, 'priority', question.priority, 'rationale', question.rationale,
    'linkedTermId', question.contract_term_id, 'linkedFindingId', question.contract_finding_id,
    'linkedConflictId', question.contract_conflict_id, 'perspective', question.perspective,
    'status', question.status, 'response', question.response, 'responseEvidenceId', question.response_source_evidence_id,
    'resolutionState', question.resolution_state, 'reportInclusion', question.report_inclusion,
    'evidenceClassification', 'open_question', 'evidenceId', question.source_evidence_id, 'sourceAnchor', question.source_anchor
  )) order by question.recipient_role, question.priority desc, question.id), '[]'::jsonb)) into current_question_hash
  from public.contract_questions question
  where question.workspace_id = target_snapshot.workspace_id and question.contract_id = target_snapshot.contract_id
    and question.archived_at is null and (question.perspective is null or question.perspective = target_snapshot.perspective);

  select public.contractiq_report_hash(coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
    'deadlineId', deadline.id, 'deadlineVersion', deadline.version, 'calculationId', result.id,
    'calculationVersion', result.calculation_version, 'calculationContractVersion', result.calculation_contract_version,
    'deadlineType', deadline.deadline_type, 'triggerType', deadline.trigger_type, 'triggerAt', result.trigger_at,
    'triggerState', result.trigger_verification, 'dueAt', result.due_at, 'timezone', result.timezone,
    'status', result.status, 'staleReason', result.stale_reason, 'verificationState', deadline.verification_state,
    'evidenceClassification', case when result.trigger_verification in ('user_confirmed','source_verified','professional_verified') then 'verified_fact' else 'open_question' end,
    'evidenceId', result.source_evidence_id, 'sourceAnchor', result.source_anchor, 'deterministicHash', result.deterministic_hash,
    'inclusion', jsonb_build_object('fullReport', true, 'summaryReport', true, 'questionsReport', false, 'professionalOnly', false, 'optionalAppendix', false, 'excludedNonMaterial', false)
  )) order by result.due_at nulls last, deadline.deadline_type, deadline.id), '[]'::jsonb)) into current_deadline_hash
  from public.contract_deadlines deadline join public.contract_deadline_results result
    on result.workspace_id = deadline.workspace_id and result.contract_deadline_id = deadline.id and result.is_current is true
  where deadline.workspace_id = target_snapshot.workspace_id and deadline.contract_id = target_snapshot.contract_id and deadline.archived_at is null;

  select public.contractiq_report_hash(coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
    'conflictId', conflict.id, 'version', conflict.version, 'conflictType', conflict.conflict_type,
    'summary', conflict.summary, 'severity', conflict.severity, 'resolutionState', conflict.resolution_state,
    'resolutionNotes', conflict.resolution_notes, 'resolvedAt', conflict.resolved_at,
    'professionalReviewRequired', conflict.professional_review_required,
    'sourceA', jsonb_build_object('contractId', conflict.source_a_contract_id, 'termId', conflict.source_a_term_id, 'evidenceId', conflict.source_a_evidence_id, 'sourceAnchor', conflict.source_a_anchor),
    'sourceB', jsonb_build_object('contractId', conflict.source_b_contract_id, 'termId', conflict.source_b_term_id, 'evidenceId', conflict.source_b_evidence_id, 'sourceAnchor', conflict.source_b_anchor),
    'evidenceClassification', 'supported_concern',
    'inclusion', jsonb_build_object('fullReport', true, 'summaryReport', conflict.severity in ('high','critical') or conflict.resolution_state <> 'resolved', 'questionsReport', false, 'professionalOnly', false, 'optionalAppendix', conflict.resolution_state in ('resolved','superseded'), 'excludedNonMaterial', false)
  )) order by conflict.severity desc, conflict.id), '[]'::jsonb)) into current_conflict_hash
  from public.contract_conflicts conflict
  where conflict.workspace_id = target_snapshot.workspace_id and conflict.contract_id = target_snapshot.contract_id and conflict.archived_at is null;

  if target_contract.version <> target_snapshot.contract_version or target_analysis.id is null or target_analysis.is_current is false or target_analysis.version <> target_snapshot.analysis_run_version then
    result_status := 'source_version_mismatch';
  elsif current_evidence_hash <> target_snapshot.evidence_set_hash then result_status := 'source_version_mismatch';
  elsif current_question_hash <> target_snapshot.question_registry_version then result_status := 'question_version_mismatch';
  elsif current_deadline_hash <> target_snapshot.deadline_set_version then result_status := 'deadline_version_mismatch';
  elsif current_conflict_hash <> target_snapshot.conflict_set_version then result_status := 'conflict_version_mismatch';
  end if;

  prior_state := target_snapshot.snapshot_state;
  if result_status <> 'reconciled' and target_snapshot.snapshot_state not in ('superseded','stale') then
    update public.contractiq_report_snapshots snapshot
    set snapshot_state = 'stale', is_current = false, stale_reason = result_status,
        reconciliation_status = result_status,
        reconciliation_details = snapshot.reconciliation_details || jsonb_build_object('checkedAt', now(), 'mismatch', result_status),
        last_reconciled_at = now()
    where snapshot.id = target_snapshot.id;

    insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, correlation_id, payload)
    values (target_snapshot.workspace_id, target_snapshot.deal_id, target_snapshot.property_id, current_user_id, 'contractiq.report_snapshot_stale', 'contractiq_report_snapshot', target_snapshot.id, target_snapshot.snapshot_version, 'reconcile_contractiq_report_snapshot', idempotency_key || ':stale', target_snapshot.correlation_id,
      jsonb_build_object('snapshotId', target_snapshot.id, 'reason', result_status, 'contentHash', target_snapshot.content_hash));
  else
    update public.contractiq_report_snapshots snapshot
    set reconciliation_status = result_status,
        reconciliation_details = snapshot.reconciliation_details || jsonb_build_object('checkedAt', now(), 'mismatch', case when result_status = 'reconciled' then null else result_status end),
        last_reconciled_at = now()
    where snapshot.id = target_snapshot.id;
  end if;

  return jsonb_build_object('snapshotId', target_snapshot.id, 'priorState', prior_state, 'snapshotState', case when result_status = 'reconciled' then target_snapshot.snapshot_state else 'stale' end, 'reconciliationStatus', result_status, 'eligible', result_status = 'reconciled', 'contentHash', target_snapshot.content_hash);
end;
$$;

revoke all on public.contractiq_report_snapshots from anon;
revoke insert, update, delete on public.contractiq_report_snapshots from authenticated;
grant select on public.contractiq_report_snapshots to authenticated;
grant select on public.contractiq_report_snapshot_projection to authenticated;

revoke execute on function public.contractiq_report_hash(jsonb) from public, anon, authenticated;
revoke execute on function public.protect_contractiq_report_snapshot_content() from public, anon, authenticated;
revoke execute on function public.create_contractiq_report_snapshot(uuid, text, uuid, text, uuid) from public, anon;
grant execute on function public.create_contractiq_report_snapshot(uuid, text, uuid, text, uuid) to authenticated;
revoke execute on function public.reconcile_contractiq_report_snapshot(uuid, text) from public, anon;
grant execute on function public.reconcile_contractiq_report_snapshot(uuid, text) to authenticated;

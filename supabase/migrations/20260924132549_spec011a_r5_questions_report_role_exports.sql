-- Specification 011A R5. Frozen question references, never a second question registry.
create table public.contractiq_questions_report_definitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  contract_id uuid not null,
  perspective text not null references public.contract_perspective_definitions(perspective_key),
  snapshot_id uuid not null,
  snapshot_version integer not null check (snapshot_version > 0),
  snapshot_hash text not null check (snapshot_hash ~ '^[0-9a-f]{64}$'),
  question_set_version text not null check (question_set_version ~ '^[0-9a-f]{64}$'),
  analysis_version integer not null check (analysis_version > 0),
  report_definition_version integer not null check (report_definition_version > 0),
  definition_contract_version text not null default 'contractiq-questions-report-definition-v1',
  template_version text not null,
  report_mode text not null check (report_mode in ('all_questions','grouped_by_role','selected_role')),
  selected_role text references public.contract_question_recipient_role_definitions(role_key),
  filter_rules jsonb not null check (jsonb_typeof(filter_rules)='object'),
  grouped_questions jsonb not null check (jsonb_typeof(grouped_questions)='array'),
  canonical_question_refs jsonb not null check (jsonb_typeof(canonical_question_refs)='array'),
  content_scope jsonb not null check (jsonb_typeof(content_scope)='object'),
  counts jsonb not null check (jsonb_typeof(counts)='object'),
  source_cutoff_at timestamptz not null,
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  deterministic_definition_hash text not null check (deterministic_definition_hash ~ '^[0-9a-f]{64}$'),
  report_state text not null check (report_state in ('draft','generating','current','current_with_open_questions','stale','failed_with_prior_valid','superseded','professional_review_recommended')),
  reconciliation_state text not null,
  is_current boolean not null default true,
  stale_reason text,
  failure_code text,
  correlation_id uuid not null default gen_random_uuid(),
  generation_duration_ms integer not null default 0 check (generation_duration_ms >= 0),
  generated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint questions_report_role_shape check ((report_mode='selected_role') = (selected_role is not null)),
  constraint questions_report_deal_fk foreign key (workspace_id,deal_id) references public.brix_deals(workspace_id,id) on delete cascade,
  constraint questions_report_property_fk foreign key (workspace_id,property_id) references public.properties(workspace_id,id) on delete restrict,
  constraint questions_report_contract_fk foreign key (workspace_id,contract_id) references public.contracts(workspace_id,id) on delete cascade,
  constraint questions_report_snapshot_fk foreign key (workspace_id,snapshot_id) references public.contractiq_report_snapshots(workspace_id,id) on delete restrict,
  unique (workspace_id,id),
  unique (workspace_id,contract_id,perspective,report_mode,selected_role,report_definition_version),
  unique (workspace_id,snapshot_id,report_mode,selected_role,deterministic_definition_hash)
);
create unique index questions_report_current_mode on public.contractiq_questions_report_definitions
  (workspace_id,contract_id,perspective,report_mode,coalesce(selected_role,'')) where is_current;
create index questions_report_history on public.contractiq_questions_report_definitions
  (workspace_id,contract_id,report_mode,selected_role,generated_at desc);
create index questions_report_snapshot_fk_idx on public.contractiq_questions_report_definitions(workspace_id,snapshot_id);
create index questions_report_deal_fk_idx on public.contractiq_questions_report_definitions(workspace_id,deal_id);
create index questions_report_property_fk_idx on public.contractiq_questions_report_definitions(workspace_id,property_id);
create index questions_report_created_by_fk_idx on public.contractiq_questions_report_definitions(created_by) where created_by is not null;

create function public.protect_contractiq_questions_report_content()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if new.id is distinct from old.id or new.workspace_id is distinct from old.workspace_id
    or new.deal_id is distinct from old.deal_id or new.property_id is distinct from old.property_id
    or new.contract_id is distinct from old.contract_id or new.perspective is distinct from old.perspective
    or new.snapshot_id is distinct from old.snapshot_id or new.snapshot_version is distinct from old.snapshot_version
    or new.snapshot_hash is distinct from old.snapshot_hash or new.question_set_version is distinct from old.question_set_version
    or new.analysis_version is distinct from old.analysis_version or new.report_definition_version is distinct from old.report_definition_version
    or new.definition_contract_version is distinct from old.definition_contract_version or new.template_version is distinct from old.template_version
    or new.report_mode is distinct from old.report_mode or new.selected_role is distinct from old.selected_role
    or new.filter_rules is distinct from old.filter_rules or new.grouped_questions is distinct from old.grouped_questions
    or new.canonical_question_refs is distinct from old.canonical_question_refs or new.content_scope is distinct from old.content_scope
    or new.counts is distinct from old.counts or new.source_cutoff_at is distinct from old.source_cutoff_at
    or new.content_hash is distinct from old.content_hash or new.deterministic_definition_hash is distinct from old.deterministic_definition_hash
    or new.generated_at is distinct from old.generated_at or new.created_by is distinct from old.created_by then
    raise exception 'Completed ContractIQ Questions Report content is immutable.' using errcode='42501';
  end if;
  return new;
end $$;
create trigger protect_contractiq_questions_report_content before update on public.contractiq_questions_report_definitions
for each row execute function public.protect_contractiq_questions_report_content();

alter table public.contractiq_questions_report_definitions enable row level security;
create policy "questions report definitions read workspace" on public.contractiq_questions_report_definitions
  for select to authenticated using (public.is_workspace_member(workspace_id));
revoke all on public.contractiq_questions_report_definitions from anon,authenticated;
grant select on public.contractiq_questions_report_definitions to authenticated;

create view public.contractiq_questions_report_definition_projection with (security_invoker=true) as
select d.id as report_definition_id,d.report_definition_version,d.workspace_id,d.deal_id,d.property_id,d.contract_id,
  d.perspective,d.snapshot_id,d.snapshot_version,d.question_set_version,d.analysis_version,d.report_mode,d.selected_role,
  d.filter_rules,d.grouped_questions,d.canonical_question_refs,d.counts,d.content_scope,d.template_version,d.content_hash,
  d.deterministic_definition_hash,d.report_state,d.reconciliation_state,d.stale_reason,d.is_current,d.generated_at,
  coalesce((select jsonb_agg(jsonb_build_object('reportDefinitionId',h.id,'version',h.report_definition_version,
    'snapshotId',h.snapshot_id,'mode',h.report_mode,'selectedRole',h.selected_role,'state',h.report_state,
    'contentHash',h.content_hash,'generatedAt',h.generated_at) order by h.report_definition_version desc)
    from public.contractiq_questions_report_definitions h where h.workspace_id=d.workspace_id and h.contract_id=d.contract_id
      and h.perspective=d.perspective and h.report_mode=d.report_mode and h.selected_role is not distinct from d.selected_role),
    '[]'::jsonb) as history
from public.contractiq_questions_report_definitions d;

create view public.contractiq_role_question_export_projection with (security_invoker=true) as
select d.id as export_definition_id,d.report_definition_version as export_definition_version,d.workspace_id,d.deal_id,
  d.contract_id,d.perspective,d.snapshot_id,d.snapshot_version,d.question_set_version,d.selected_role,
  d.canonical_question_refs,d.counts,d.content_scope,d.content_hash,d.report_state,d.reconciliation_state,
  d.stale_reason,d.is_current,d.generated_at
from public.contractiq_questions_report_definitions d where d.report_mode='selected_role';
grant select on public.contractiq_questions_report_definition_projection,public.contractiq_role_question_export_projection to authenticated;

create function public.create_contractiq_questions_report_definition(
  target_snapshot_id uuid, target_mode text, target_role text, requested_filters jsonb,
  target_template_version text, idempotency_key text, correlation_id uuid default gen_random_uuid()
) returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
#variable_conflict use_variable
declare
  actor uuid:=auth.uid(); snap public.contractiq_report_snapshots%rowtype; contract_row public.contracts%rowtype;
  full_row public.contractiq_full_report_definitions%rowtype; summary_row public.contractiq_buyer_summary_definitions%rowtype;
  command public.contract_command_requests%rowtype; existing public.contractiq_questions_report_definitions%rowtype;
  inserted public.contractiq_questions_report_definitions%rowtype; filters jsonb; refs jsonb; grouped jsonb;
  scope jsonb; counts jsonb; payload jsonb; content_digest text; deterministic_digest text;
  question_item jsonb; full_question jsonb; summary_question jsonb; live_question public.contract_questions%rowtype;
  role_list jsonb; role_key text; recipient text; group_role text; item jsonb; requested_historical boolean;
  selected_count integer:=0; total_count integer:=0; unresolved_count integer:=0; answered_count integer:=0;
  resolved_count integer:=0; review_count integer:=0; high_count integer:=0; pending_count integer:=0;
  source_count integer:=0; requested_evidence_count integer:=0; deadline_count integer:=0;
  next_version integer; started_at timestamptz:=clock_timestamp(); previous_id uuid;
begin
  if actor is null then raise exception 'Authentication required.' using errcode='42501'; end if;
  select * into snap from public.contractiq_report_snapshots s where s.id=target_snapshot_id for update;
  if snap.id is null then raise exception 'ContractIQ snapshot not found.' using errcode='P0002'; end if;
  contract_row:=public.authorized_contract(snap.contract_id);
  if contract_row.workspace_id<>snap.workspace_id or contract_row.deal_id<>snap.deal_id then
    raise exception 'ContractIQ snapshot scope mismatch.' using errcode='42501'; end if;
  if not public.has_workspace_permission(snap.workspace_id,'deals:manage') then
    raise exception 'Insufficient permission for ContractIQ definition.' using errcode='42501'; end if;
  if target_mode not in ('all_questions','grouped_by_role','selected_role') or target_mode is null then
    raise exception 'Unsupported Questions Report mode.' using errcode='22023'; end if;
  if (target_mode='selected_role') <> (target_role is not null) then
    raise exception 'Selected role is required only for selected-role mode.' using errcode='22023'; end if;
  if target_role is not null and not exists(select 1 from public.contract_question_recipient_role_definitions r where r.role_key=target_role) then
    raise exception 'Unknown canonical recipient role.' using errcode='22023'; end if;
  if nullif(btrim(target_template_version),'') is null or nullif(btrim(idempotency_key),'') is null then
    raise exception 'Template version and idempotency key are required.' using errcode='22023'; end if;
  if snap.snapshot_state not in ('current','current_with_open_questions','professional_review_recommended','current_with_conflicts')
     or not snap.is_current or snap.reconciliation_status<>'reconciled' then
    raise exception 'Only a reconciled current R1 snapshot is eligible.' using errcode='40001'; end if;
  select * into full_row from public.contractiq_full_report_definitions f
    where f.workspace_id=snap.workspace_id and f.snapshot_id=snap.id and f.is_current and f.report_state='current';
  if full_row.id is null or full_row.snapshot_hash<>snap.content_hash or full_row.analysis_version<>snap.analysis_run_version then
    raise exception 'Matching current R3 Full Report definition is required.' using errcode='40001'; end if;
  if snap.perspective='buyer' then
    select * into summary_row from public.contractiq_buyer_summary_definitions s
      where s.workspace_id=snap.workspace_id and s.snapshot_id=snap.id and s.full_report_definition_id=full_row.id
        and s.is_current and s.summary_state in ('current','current_with_open_questions','current_with_conflicts','professional_review_recommended');
    if summary_row.id is null then raise exception 'Matching current R4 Summary is required.' using errcode='40001'; end if;
  end if;
  filters:=coalesce(requested_filters,'{}'::jsonb);
  if jsonb_typeof(filters)<>'object' or filters - array['includedStatuses','includedPriorities','unresolvedOnly','professionalReviewOnly','includeHistorical']<>'{}'::jsonb then
    raise exception 'Unsupported Questions Report filter.' using errcode='22023'; end if;
  if filters ? 'includedStatuses' and (jsonb_typeof(filters->'includedStatuses')<>'array' or exists (
    select 1 from jsonb_array_elements_text(filters->'includedStatuses') v where v not in
    ('open','in_progress','answered','resolved','accepted','deferred','blocked','dismissed','superseded','cancelled'))) then
    raise exception 'Invalid status filter.' using errcode='22023'; end if;
  if filters ? 'includedPriorities' and (jsonb_typeof(filters->'includedPriorities')<>'array' or exists (
    select 1 from jsonb_array_elements_text(filters->'includedPriorities') v where v not in
    ('critical','high','normal','low','informational'))) then
    raise exception 'Invalid priority filter.' using errcode='22023'; end if;
  if (filters ? 'unresolvedOnly' and jsonb_typeof(filters->'unresolvedOnly')<>'boolean')
    or (filters ? 'professionalReviewOnly' and jsonb_typeof(filters->'professionalReviewOnly')<>'boolean')
    or (filters ? 'includeHistorical' and jsonb_typeof(filters->'includeHistorical')<>'boolean') then
    raise exception 'Invalid boolean filter.' using errcode='22023'; end if;
  filters:=jsonb_build_object('includedStatuses',coalesce(filters->'includedStatuses','[]'::jsonb),
    'includedPriorities',coalesce(filters->'includedPriorities','[]'::jsonb),
    'unresolvedOnly',coalesce((filters->>'unresolvedOnly')::boolean,false),
    'professionalReviewOnly',coalesce((filters->>'professionalReviewOnly')::boolean,false),
    'includeHistorical',coalesce((filters->>'includeHistorical')::boolean,false));
  requested_historical:=(filters->>'includeHistorical')::boolean;
  command:=public.ensure_contract_command(snap.workspace_id,snap.deal_id,snap.property_id,snap.contract_id,
    'create_contractiq_questions_report_definition',idempotency_key,
    jsonb_build_object('snapshotId',snap.id,'mode',target_mode,'role',target_role,'filters',filters,'templateVersion',target_template_version));
  if command.result ? 'reportDefinitionId' then return command.result || jsonb_build_object('reused',true); end if;
  if snap.question_registry_version<>public.contractiq_report_hash(coalesce(snap.snapshot_payload->'questions','[]'::jsonb)) then
    raise exception 'R1 question-set version mismatch.' using errcode='40001'; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(snap.snapshot_payload->'questions','[]'::jsonb)) q
    group by q->>'questionId' having count(*)>1) then
    raise exception 'Duplicate canonical question in snapshot.' using errcode='22023'; end if;
  -- The snapshot is frozen truth; live rows are used only as a currentness guard.
  for question_item in select value from jsonb_array_elements(coalesce(snap.snapshot_payload->'questions','[]'::jsonb)) loop
    select * into live_question from public.contract_questions q where q.workspace_id=snap.workspace_id
      and q.contract_id=snap.contract_id and q.id=(question_item->>'questionId')::uuid and q.archived_at is null;
    if live_question.id is null or live_question.version<>(question_item->>'version')::integer
      or live_question.question<>question_item->>'wording' or live_question.recipient_role<>question_item->>'recipientRole'
      or live_question.priority<>question_item->>'priority' or live_question.status<>question_item->>'status'
      or live_question.resolution_state<>question_item->>'resolutionState'
      or live_question.response is distinct from question_item->>'response'
      or live_question.report_inclusion is distinct from question_item->'reportInclusion' then
      raise exception 'Current R2 question differs from frozen R1 snapshot.' using errcode='40001'; end if;
    if live_question.contract_term_id is null and live_question.contract_finding_id is null
      and live_question.contract_conflict_id is null and live_question.contract_deadline_id is null
      and live_question.amendment_contract_id is null and live_question.missing_record_key is null
      and cardinality(live_question.source_evidence_ids)=0 then
      raise exception 'Canonical question has no source issue.' using errcode='22023'; end if;
    if exists(select 1 from unnest(live_question.source_evidence_ids) e_id where not exists (
      select 1 from public.evidence_items e where e.workspace_id=snap.workspace_id and e.id=e_id
        and (e.deal_id is null or e.deal_id=snap.deal_id))) then
      raise exception 'Question source Evidence is unauthorized.' using errcode='42501'; end if;
    select value into full_question from jsonb_array_elements(full_row.question_references) value
      where value->>'questionId'=question_item->>'questionId' limit 1;
    if full_question is not null and (full_question->>'questionVersion'<>(question_item->>'version')
      or full_question->>'wording'<>question_item->>'wording' or full_question->>'targetRole'<>question_item->>'recipientRole'
      or full_question->>'priority'<>question_item->>'priority' or full_question->>'status'<>question_item->>'status'
      or full_question->>'resolutionState'<>question_item->>'resolutionState'
      or full_question->>'response' is distinct from question_item->>'response') then
      raise exception 'R3 question reference mismatch.' using errcode='40001'; end if;
    if summary_row.id is not null then
      select value into summary_question from jsonb_array_elements(coalesce(summary_row.definition_payload->'materialQuestions','[]'::jsonb)) value
        where value->>'questionId'=question_item->>'questionId' limit 1;
      if summary_question is not null and (summary_question->>'questionVersion'<>question_item->>'version'
        or summary_question->>'wording'<>question_item->>'wording' or summary_question->>'targetRole'<>question_item->>'recipientRole'
        or summary_question->>'priority'<>question_item->>'priority' or summary_question->>'status'<>question_item->>'status'
        or summary_question->>'resolutionState'<>question_item->>'resolutionState') then
        raise exception 'R4 material question mismatch.' using errcode='40001'; end if;
    end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(full_row.question_references) f where not exists (
    select 1 from jsonb_array_elements(coalesce(snap.snapshot_payload->'questions','[]'::jsonb)) q
    where q->>'questionId'=f->>'questionId' and q->>'version'=f->>'questionVersion')) then
    raise exception 'R3 contains a question absent from R1.' using errcode='40001'; end if;
  if summary_row.id is not null and exists(select 1 from jsonb_array_elements(coalesce(summary_row.definition_payload->'materialQuestions','[]'::jsonb)) s where not exists (
    select 1 from jsonb_array_elements(coalesce(snap.snapshot_payload->'questions','[]'::jsonb)) q
      where q->>'questionId'=s->>'questionId' and q->>'version'=s->>'questionVersion')) then
    raise exception 'R4 contains a question absent from R1.' using errcode='40001'; end if;
  refs:='[]'::jsonb;
  for question_item in select value from jsonb_array_elements(coalesce(snap.snapshot_payload->'questions','[]'::jsonb)) loop
    select * into live_question from public.contract_questions q where q.workspace_id=snap.workspace_id and q.id=(question_item->>'questionId')::uuid;
    if not coalesce((question_item#>>'{reportInclusion,standaloneQuestionsReport}')::boolean,true)
      or (target_mode='selected_role' and not coalesce((question_item#>>'{reportInclusion,roleExport}')::boolean,true))
      or (not requested_historical and question_item->>'status' in ('superseded','cancelled','dismissed'))
      or ((filters->>'unresolvedOnly')::boolean and question_item->>'status' in ('resolved','accepted','superseded','cancelled','dismissed'))
      or ((filters->>'professionalReviewOnly')::boolean and not live_question.professional_review_required)
      or (jsonb_array_length(filters->'includedStatuses')>0 and not (filters->'includedStatuses' ? (question_item->>'status')))
      or (jsonb_array_length(filters->'includedPriorities')>0 and not (filters->'includedPriorities' ? (question_item->>'priority'))) then
      continue; end if;
    role_list:=coalesce(question_item#>'{reportInclusion,roleExportRoles}','[]'::jsonb);
    if jsonb_typeof(role_list)<>'array' or exists(select 1 from jsonb_array_elements_text(role_list) r where not exists(
      select 1 from public.contract_question_recipient_role_definitions d where d.role_key=r)) then
      raise exception 'Invalid explicit multi-role metadata.' using errcode='22023'; end if;
    if target_mode='selected_role' and question_item->>'recipientRole'<>target_role and not role_list ? target_role then
      continue; end if;
    recipient:=question_item->>'recipientRole';
    item:=jsonb_build_object('questionId',question_item->>'questionId','questionVersion',(question_item->>'version')::integer,
      'wording',question_item->>'wording','targetRole',recipient,
      'displayRole',case when target_mode='selected_role' then target_role else recipient end,
      'priority',question_item->>'priority',
      'status',question_item->>'status','resolutionState',question_item->>'resolutionState',
      'responseState',case when question_item->>'response' is null then 'none' else 'received' end,
      'response',case when target_mode='selected_role' then null else question_item->>'response' end,
      'responseVerificationState',live_question.response_verification_state,
      'responderRole',case when target_mode='selected_role' then null else (select r.responder_role from public.contract_question_responses r where r.question_id=live_question.id order by r.response_version desc limit 1) end,
      'responseReceivedAt',case when target_mode='selected_role' then null else (select r.received_at from public.contract_question_responses r where r.question_id=live_question.id order by r.response_version desc limit 1) end,
      'rationale',question_item->>'rationale','whyThisMatters',live_question.why_it_matters,
      'professionalReviewRequired',live_question.professional_review_required,
      'historical',question_item->>'status' in ('superseded','cancelled','dismissed'),
      'category',live_question.category,'semanticKey',live_question.semantic_key,
      'reportInclusion',question_item->'reportInclusion',
      'sourceRefs',public.contractiq_full_report_source_refs('question',question_item),
      'linkedTaskId',live_question.linked_task_id,
      'requestedEvidenceIds',to_jsonb(live_question.source_evidence_ids),
      'relevantDeadlineIds',case when live_question.contract_deadline_id is null then '[]'::jsonb
        else jsonb_build_array(live_question.contract_deadline_id) end,
      'fullReportAnchor','professional-questions');
    refs:=refs || jsonb_build_array(item);
  end loop;
  select coalesce(jsonb_agg(value order by
    case when value->>'status' in ('resolved','accepted') then 1 else 0 end,
    case value->>'priority' when 'critical' then 0 when 'high' then 1 when 'normal' then 2 when 'low' then 3 else 4 end,
    case when (value->>'professionalReviewRequired')::boolean then 0 else 1 end,
    coalesce((select sort_order from public.contract_question_recipient_role_definitions r where r.role_key=value->>'targetRole'),999),
    value->>'category',value->>'semanticKey',value->>'questionId'),'[]'::jsonb) into refs
  from jsonb_array_elements(refs);
  select count(*),count(*) filter(where value->>'status' not in ('resolved','accepted','superseded','cancelled','dismissed')),
    count(*) filter(where value->>'status'='answered'),count(*) filter(where value->>'status' in ('resolved','accepted')),
    count(*) filter(where (value->>'professionalReviewRequired')::boolean),
    count(*) filter(where value->>'priority' in ('critical','high')),
    count(*) filter(where value->>'status'='answered' and coalesce(value->>'responseVerificationState','unverified') not in ('verified','professional_verified')),
    coalesce(sum(jsonb_array_length(coalesce(value->'sourceRefs','[]'::jsonb))),0),
    coalesce(sum(jsonb_array_length(coalesce(value->'requestedEvidenceIds','[]'::jsonb))),0),
    coalesce(sum(jsonb_array_length(coalesce(value->'relevantDeadlineIds','[]'::jsonb))),0)
  into total_count,unresolved_count,answered_count,resolved_count,review_count,high_count,pending_count,source_count,requested_evidence_count,deadline_count
  from jsonb_array_elements(refs);
  select coalesce(jsonb_agg(jsonb_build_object('role',role_key,'questions',role_questions) order by sort_order,role_key),'[]'::jsonb)
  into grouped from (
    select r.role_key,r.sort_order,jsonb_agg(q.value order by q.ordinality) as role_questions
    from jsonb_array_elements(refs) with ordinality q(value,ordinality)
    join public.contract_question_recipient_role_definitions r on r.role_key=q.value->>'displayRole'
    group by r.role_key,r.sort_order
  ) roles;
  scope:=jsonb_build_object('intendedRecipientRole',target_role,
    'contentScope',case when target_mode='selected_role' then 'canonical_target_role_questions_only' else 'authorized_workspace_questions' end,
    'sourceVisibilityLevel',case when target_mode='selected_role' then 'references_only' else 'authorized_source_references' end,
    'responseVisibilityLevel',case when target_mode='selected_role' then 'state_only' else 'authorized_response' end,
    'professionalOnlyContentIncluded',exists(select 1 from jsonb_array_elements(refs) v where coalesce((v#>>'{reportInclusion,professionalOnly}')::boolean,false)),
    'privateBuyerNotesExcluded',true);
  counts:=jsonb_build_object('totalCurrentQuestions',total_count,'unresolved',unresolved_count,'openQuestionCount',
    (select count(*) from jsonb_array_elements(refs) v where v->>'status' in ('open','in_progress','blocked','deferred')),
    'answeredQuestionCount',answered_count,'resolvedQuestionCount',resolved_count,'professionalReviewCount',review_count,
    'criticalHighCount',high_count,'answeredPendingVerificationCount',pending_count,'sourceReferenceCount',source_count,
    'requestedEvidenceCount',requested_evidence_count,'relevantDeadlineCount',deadline_count,
    'roleCounts',coalesce((select jsonb_object_agg(role_key,jsonb_array_length(role_questions)) from (
      select g->>'role' role_key,g->'questions' role_questions from jsonb_array_elements(grouped) g) x),'{}'::jsonb));
  payload:=jsonb_build_object('snapshotId',snap.id,'snapshotVersion',snap.snapshot_version,
    'questionSetVersion',snap.question_registry_version,'analysisVersion',snap.analysis_run_version,
    'reportMode',target_mode,'selectedRole',target_role,'filters',filters,'groupedQuestions',grouped,
    'canonicalQuestionRefs',refs,'counts',counts,'contentScope',scope,'sourceCutoffAt',snap.source_document_cutoff_at,
    'templateVersion',target_template_version);
  content_digest:=public.contractiq_report_hash(payload);
  deterministic_digest:=public.contractiq_report_hash(jsonb_build_object('snapshotId',snap.id,
    'questionSetVersion',snap.question_registry_version,'mode',target_mode,'role',target_role,
    'templateVersion',target_template_version,'filters',filters));
  select * into existing from public.contractiq_questions_report_definitions d where d.workspace_id=snap.workspace_id
    and d.snapshot_id=snap.id and d.report_mode=target_mode and d.selected_role is not distinct from target_role
    and d.deterministic_definition_hash=deterministic_digest;
  if existing.id is not null then
    if existing.content_hash<>content_digest then raise exception 'Definition hash collision or source drift.' using errcode='40001'; end if;
    update public.contract_command_requests set result=jsonb_build_object('reportDefinitionId',existing.id,
      'reportDefinitionVersion',existing.report_definition_version,'reportState',existing.report_state,'reused',true) where id=command.id;
    return jsonb_build_object('reportDefinitionId',existing.id,'reportDefinitionVersion',existing.report_definition_version,
      'reportState',existing.report_state,'reused',true);
  end if;
  perform pg_advisory_xact_lock(hashtextextended(snap.workspace_id::text||snap.contract_id::text||target_mode||coalesce(target_role,''),0));
  select coalesce(max(d.report_definition_version),0)+1 into next_version
    from public.contractiq_questions_report_definitions d where d.workspace_id=snap.workspace_id and d.contract_id=snap.contract_id
      and d.perspective=snap.perspective and d.report_mode=target_mode and d.selected_role is not distinct from target_role;
  select d.id into previous_id from public.contractiq_questions_report_definitions d where d.workspace_id=snap.workspace_id
    and d.contract_id=snap.contract_id and d.perspective=snap.perspective and d.report_mode=target_mode
    and d.selected_role is not distinct from target_role and d.is_current for update;
  if previous_id is not null then
    update public.contractiq_questions_report_definitions set is_current=false,report_state='superseded',
      stale_reason='new_definition_created',reconciliation_state='superseded' where id=previous_id;
  end if;
  insert into public.contractiq_questions_report_definitions(workspace_id,deal_id,property_id,contract_id,perspective,
    snapshot_id,snapshot_version,snapshot_hash,question_set_version,analysis_version,report_definition_version,
    template_version,report_mode,selected_role,filter_rules,grouped_questions,canonical_question_refs,content_scope,
    counts,source_cutoff_at,content_hash,deterministic_definition_hash,report_state,reconciliation_state,
    correlation_id,generation_duration_ms,created_by)
  values(snap.workspace_id,snap.deal_id,snap.property_id,snap.contract_id,snap.perspective,snap.id,snap.snapshot_version,
    snap.content_hash,snap.question_registry_version,snap.analysis_run_version,next_version,target_template_version,target_mode,
    target_role,filters,grouped,refs,scope,counts,snap.source_document_cutoff_at,content_digest,deterministic_digest,
    case when unresolved_count>0 then 'current_with_open_questions' else 'current' end,'reconciled',correlation_id,
    greatest(0,(extract(epoch from clock_timestamp()-started_at)*1000)::integer),actor) returning * into inserted;
  update public.contract_command_requests set result=jsonb_build_object('reportDefinitionId',inserted.id,
    'reportDefinitionVersion',inserted.report_definition_version,'reportState',inserted.report_state,'reused',false) where id=command.id;
  insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,
    source_command,idempotency_key,correlation_id,payload)
  values(snap.workspace_id,snap.deal_id,snap.property_id,actor,
    case when target_mode='selected_role' then 'contractiq.role_question_export_definition_created'
      else 'contractiq.questions_report_definition_created' end,
    'contractiq_questions_report_definition',inserted.id,next_version,'create_contractiq_questions_report_definition',
    idempotency_key,correlation_id,jsonb_build_object('definitionId',inserted.id,'mode',target_mode,'selectedRole',target_role,
      'snapshotId',snap.id,'questionSetVersion',snap.question_registry_version,'questionCount',total_count,'unresolvedCount',unresolved_count));
  insert into public.audit_events(workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,
    source_command,idempotency_key,correlation_id,after_values,changed_fields,metadata)
  values(snap.workspace_id,snap.deal_id,snap.property_id,actor,'contractiq.questions_report_definition_created',
    'contractiq_questions_report_definitions','contractiq_questions_report_definition',inserted.id,
    'create_contractiq_questions_report_definition',idempotency_key,correlation_id,
    jsonb_build_object('version',next_version,'state',inserted.report_state,'mode',target_mode,'selectedRole',target_role),
    array['report_state','canonical_question_refs'],jsonb_build_object('contentHash',content_digest,'count',total_count));
  return jsonb_build_object('reportDefinitionId',inserted.id,'reportDefinitionVersion',next_version,
    'reportState',inserted.report_state,'reused',false);
end $$;

create function public.stale_contractiq_questions_report_definitions()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare changed record; reason text;
begin
  if tg_table_name='contract_questions' then
    if tg_op='UPDATE' and new.version=old.version then return new; end if;
    reason:='canonical_question_changed';
  else
    if new.snapshot_state is not distinct from old.snapshot_state and new.reconciliation_status is not distinct from old.reconciliation_status
      and new.is_current is not distinct from old.is_current then return new; end if;
    if new.is_current and new.reconciliation_status='reconciled' and new.snapshot_state not in ('stale','superseded') then return new; end if;
    reason:='source_snapshot_stale';
  end if;
  for changed in
    update public.contractiq_questions_report_definitions d set report_state='stale',is_current=false,
      reconciliation_state='stale',stale_reason=reason
    where d.workspace_id=new.workspace_id and d.contract_id=new.contract_id and d.is_current
      and (tg_table_name='contract_questions' or d.snapshot_id=new.id)
    returning d.*
  loop
    insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,
      source_command,idempotency_key,correlation_id,payload)
    values(changed.workspace_id,changed.deal_id,changed.property_id,auth.uid(),
      'contractiq.questions_report_definition_stale','contractiq_questions_report_definition',changed.id,
      changed.report_definition_version,'contractiq_source_changed','questions-report-stale:'||changed.id::text,
      changed.correlation_id,jsonb_build_object('definitionId',changed.id,'reason',reason));
  end loop;
  return new;
end $$;
create trigger stale_questions_report_on_question_change after insert or update on public.contract_questions
  for each row execute function public.stale_contractiq_questions_report_definitions();
create trigger stale_questions_report_on_snapshot_change after update of snapshot_state,reconciliation_status,is_current
  on public.contractiq_report_snapshots for each row execute function public.stale_contractiq_questions_report_definitions();

revoke all on function public.protect_contractiq_questions_report_content() from public,anon,authenticated;
revoke all on function public.stale_contractiq_questions_report_definitions() from public,anon,authenticated;
revoke all on function public.create_contractiq_questions_report_definition(uuid,text,text,jsonb,text,text,uuid) from public,anon;
grant execute on function public.create_contractiq_questions_report_definition(uuid,text,text,jsonb,text,text,uuid) to authenticated;

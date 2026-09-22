-- Specification 011A R2: canonical professional and transaction questions.

create extension if not exists pgcrypto;

create table if not exists public.contract_question_category_definitions (
  category_key text primary key,
  label text not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

insert into public.contract_question_category_definitions (category_key, label, sort_order)
values
  ('contract_term', 'Contract Term', 10), ('deadline', 'Deadline', 20),
  ('contingency', 'Contingency', 30), ('money', 'Money', 40),
  ('financing', 'Financing', 50), ('title', 'Title', 60),
  ('survey', 'Survey', 70), ('inspection', 'Inspection', 80),
  ('appraisal', 'Appraisal', 90), ('insurance', 'Insurance', 100),
  ('governance', 'Governance', 110), ('tax', 'Tax', 120),
  ('utility', 'Utility', 130), ('solar', 'Solar', 140),
  ('property_condition', 'Property Condition', 150), ('disclosure', 'Disclosure', 160),
  ('ownership_cost', 'Ownership Cost', 170), ('legal_review', 'Legal Review', 180),
  ('missing_document', 'Missing Document', 190), ('conflict', 'Conflict', 200),
  ('amendment', 'Amendment', 210), ('authority', 'Authority', 220),
  ('signature', 'Signature', 230), ('closing', 'Closing', 240),
  ('possession', 'Possession', 250), ('other', 'Other', 260)
on conflict (category_key) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.contract_question_recipient_role_definitions (role_key, label, sort_order)
values
  ('realtor', 'Realtor', 170), ('broker', 'Broker', 180), ('hoa', 'HOA', 190),
  ('solar_provider', 'Solar Provider', 200), ('battery_provider', 'Battery Provider', 210),
  ('contractor', 'Contractor', 220), ('specialist', 'Specialist', 230),
  ('municipality', 'Municipality', 240), ('county', 'County', 250),
  ('escrow_agent', 'Escrow Agent', 260), ('property_manager', 'Property Manager', 270)
on conflict (role_key) do update set label = excluded.label, sort_order = excluded.sort_order;

update public.contract_questions set recipient_role=case recipient_role
  when 'realtor_broker' then 'broker' when 'hoa_association' then 'hoa'
  when 'contractor_specialist' then 'specialist' when 'municipality_county' then 'municipality'
  else recipient_role end
where recipient_role in ('realtor_broker','hoa_association','contractor_specialist','municipality_county');

alter table public.contract_questions
  add column if not exists property_id uuid,
  add column if not exists contract_version integer,
  add column if not exists category text,
  add column if not exists why_it_matters text,
  add column if not exists semantic_key text,
  add column if not exists deterministic_key text,
  add column if not exists contract_term_version integer,
  add column if not exists contract_finding_version integer,
  add column if not exists contract_conflict_version integer,
  add column if not exists contract_deadline_id uuid,
  add column if not exists contract_deadline_version integer,
  add column if not exists missing_record_key text,
  add column if not exists amendment_contract_id uuid,
  add column if not exists amendment_contract_version integer,
  add column if not exists source_evidence_ids uuid[] not null default '{}'::uuid[],
  add column if not exists source_anchors jsonb not null default '[]'::jsonb,
  add column if not exists response_source_classification text,
  add column if not exists response_anchor jsonb not null default '{}'::jsonb,
  add column if not exists response_verification_state text,
  add column if not exists professional_review_required boolean not null default false,
  add column if not exists linked_task_id uuid,
  add column if not exists responsible_contact_id uuid,
  add column if not exists responsible_organization_id uuid,
  add column if not exists superseded_by_question_id uuid,
  add column if not exists superseded_at timestamptz,
  add column if not exists content_hash text;

update public.contract_questions question
set property_id = contract.property_id,
    contract_version = contract.version,
    category = coalesce(question.category, case
      when question.contract_conflict_id is not null then 'conflict'
      when question.contract_term_id is not null then 'contract_term'
      when question.contract_finding_id is not null then 'other'
      else 'other'
    end),
    why_it_matters = coalesce(nullif(btrim(question.why_it_matters), ''), question.rationale),
    semantic_key = coalesce(nullif(btrim(question.semantic_key), ''), 'legacy:' || question.id::text),
    deterministic_key = coalesce(question.deterministic_key, encode(extensions.digest(convert_to('legacy:' || question.id::text, 'UTF8'), 'sha256'), 'hex')),
    contract_term_version = coalesce(question.contract_term_version, (select term.version from public.contract_terms term where term.workspace_id=question.workspace_id and term.id=question.contract_term_id)),
    contract_finding_version = coalesce(question.contract_finding_version, (select finding.version from public.contract_findings finding where finding.workspace_id=question.workspace_id and finding.id=question.contract_finding_id)),
    contract_conflict_version = coalesce(question.contract_conflict_version, (select conflict.version from public.contract_conflicts conflict where conflict.workspace_id=question.workspace_id and conflict.id=question.contract_conflict_id)),
    source_evidence_ids = case when question.source_evidence_id is null then question.source_evidence_ids else array[question.source_evidence_id] end,
    source_anchors = case when question.source_anchor = '{}'::jsonb then question.source_anchors else jsonb_build_array(question.source_anchor) end,
    professional_review_required = question.professional_review_required or question.resolution_state = 'professional_review_required',
    content_hash = coalesce(question.content_hash, encode(extensions.digest(convert_to(jsonb_build_object(
      'question', question.question, 'role', question.recipient_role, 'priority', question.priority,
      'rationale', question.rationale, 'status', question.status, 'resolution', question.resolution_state
    )::text, 'UTF8'), 'sha256'), 'hex'))
from public.contracts contract
where contract.workspace_id = question.workspace_id and contract.id = question.contract_id;

alter table public.contract_questions alter column property_id set not null;
alter table public.contract_questions alter column contract_version set not null;
alter table public.contract_questions alter column category set not null;
alter table public.contract_questions alter column why_it_matters set not null;
alter table public.contract_questions alter column semantic_key set not null;
alter table public.contract_questions alter column deterministic_key set not null;
alter table public.contract_questions alter column content_hash set not null;

alter table public.contract_questions drop constraint if exists contract_questions_priority_check;
alter table public.contract_questions add constraint contract_questions_priority_check
  check (priority in ('informational','low','normal','high','critical'));
alter table public.contract_questions drop constraint if exists contract_questions_status_check;
alter table public.contract_questions add constraint contract_questions_status_check
  check (status in ('open','in_progress','answered','resolved','accepted','deferred','blocked','dismissed','superseded','cancelled'));
alter table public.contract_questions drop constraint if exists contract_questions_resolution_state_check;
alter table public.contract_questions add constraint contract_questions_resolution_state_check
  check (resolution_state in ('unresolved','response_received_unverified','partially_resolved','verified_resolved','resolved','accepted','accepted_risk','contradicted','professional_review_pending','professional_review_required','superseded'));
alter table public.contract_questions add constraint contract_questions_category_fk
  foreign key (category) references public.contract_question_category_definitions(category_key);
alter table public.contract_questions add constraint contract_questions_property_fk
  foreign key (workspace_id, property_id) references public.properties(workspace_id, id);
alter table public.contract_questions add constraint contract_questions_deadline_fk
  foreign key (workspace_id, contract_deadline_id) references public.contract_deadlines(workspace_id, id);
alter table public.contract_questions add constraint contract_questions_amendment_fk
  foreign key (workspace_id, amendment_contract_id) references public.contracts(workspace_id, id);
alter table public.contract_questions add constraint contract_questions_task_fk
  foreign key (linked_task_id) references public.tasks(id) on delete set null;
alter table public.contract_questions add constraint contract_questions_responsible_contact_fk
  foreign key (workspace_id, responsible_contact_id) references public.contacts(workspace_id, id);
alter table public.contract_questions add constraint contract_questions_responsible_organization_fk
  foreign key (workspace_id, responsible_organization_id) references public.organizations(workspace_id, id);
alter table public.contract_questions add constraint contract_questions_superseded_by_fk
  foreign key (workspace_id, superseded_by_question_id) references public.contract_questions(workspace_id, id);
alter table public.contract_questions add constraint contract_questions_source_anchors_array
  check (jsonb_typeof(source_anchors) = 'array');
alter table public.contract_questions add constraint contract_questions_response_anchor_object
  check (jsonb_typeof(response_anchor) = 'object');
alter table public.contract_questions add constraint contract_questions_hash_shape
  check (content_hash ~ '^[0-9a-f]{64}$' and deterministic_key ~ '^[0-9a-f]{64}$');
alter table public.contract_questions add constraint contract_questions_resolution_shape
  check ((resolved_at is null and resolved_by is null) or status in ('resolved','accepted','superseded'));

create unique index if not exists idx_contract_questions_active_semantic_identity
  on public.contract_questions(workspace_id, contract_id, deterministic_key)
  where archived_at is null and status not in ('superseded','cancelled','dismissed');
create index if not exists idx_contract_questions_registry_order
  on public.contract_questions(workspace_id, contract_id, perspective, status, priority, recipient_role, category, deterministic_key)
  where archived_at is null;
create index if not exists idx_contract_questions_property on public.contract_questions(workspace_id, property_id);
create index if not exists idx_contract_questions_deadline on public.contract_questions(workspace_id, contract_deadline_id) where contract_deadline_id is not null;
create index if not exists idx_contract_questions_amendment on public.contract_questions(workspace_id, amendment_contract_id) where amendment_contract_id is not null;
create index if not exists idx_contract_questions_task on public.contract_questions(linked_task_id) where linked_task_id is not null;
create index if not exists idx_contract_questions_responsible_contact on public.contract_questions(workspace_id, responsible_contact_id) where responsible_contact_id is not null;
create index if not exists idx_contract_questions_responsible_org on public.contract_questions(workspace_id, responsible_organization_id) where responsible_organization_id is not null;
create index if not exists idx_contract_questions_superseded_by on public.contract_questions(workspace_id, superseded_by_question_id) where superseded_by_question_id is not null;

create table if not exists public.contract_question_responses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contract_id uuid not null,
  question_id uuid not null,
  question_version integer not null,
  response_version integer not null,
  response_text text not null,
  responder_user_id uuid references auth.users(id) on delete set null,
  responder_contact_id uuid,
  responder_organization_id uuid,
  responder_role text not null,
  source_classification text not null,
  response_evidence_id uuid,
  response_anchor jsonb not null default '{}'::jsonb,
  verification_state text not null default 'unverified',
  received_at timestamptz not null default now(),
  idempotency_key text not null,
  content_hash text not null,
  created_at timestamptz not null default now(),
  constraint contract_question_responses_question_fk foreign key (workspace_id, question_id) references public.contract_questions(workspace_id, id) on delete cascade,
  constraint contract_question_responses_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_question_responses_contact_fk foreign key (workspace_id, responder_contact_id) references public.contacts(workspace_id, id),
  constraint contract_question_responses_organization_fk foreign key (workspace_id, responder_organization_id) references public.organizations(workspace_id, id),
  constraint contract_question_responses_evidence_fk foreign key (workspace_id, response_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_question_responses_text_not_blank check (length(btrim(response_text)) > 0),
  constraint contract_question_responses_role_not_blank check (length(btrim(responder_role)) > 0),
  constraint contract_question_responses_source_check check (source_classification in ('user','seller','attorney','lender','title','insurer','hoa','utility','provider','professional','document','external_official_source','other')),
  constraint contract_question_responses_verification_check check (verification_state in ('unverified','source_backed','verified','professional_verified','contradicted')),
  constraint contract_question_responses_anchor_object check (jsonb_typeof(response_anchor) = 'object'),
  constraint contract_question_responses_hash_shape check (content_hash ~ '^[0-9a-f]{64}$'),
  unique (question_id, response_version),
  unique (question_id, idempotency_key),
  unique (workspace_id, id)
);

create index if not exists idx_contract_question_responses_question_history
  on public.contract_question_responses(workspace_id, question_id, response_version desc);
create index if not exists idx_contract_question_responses_contract
  on public.contract_question_responses(workspace_id, contract_id, received_at desc);
create index if not exists idx_contract_question_responses_contact
  on public.contract_question_responses(workspace_id, responder_contact_id) where responder_contact_id is not null;
create index if not exists idx_contract_question_responses_organization
  on public.contract_question_responses(workspace_id, responder_organization_id) where responder_organization_id is not null;
create index if not exists idx_contract_question_responses_evidence
  on public.contract_question_responses(workspace_id, response_evidence_id) where response_evidence_id is not null;

create or replace function public.contractiq_question_hash(input_value jsonb)
returns text language sql immutable set search_path = public
as $$ select encode(extensions.digest(convert_to(coalesce(input_value, '{}'::jsonb)::text, 'UTF8'), 'sha256'), 'hex') $$;

create or replace function public.protect_contract_question_response()
returns trigger language plpgsql set search_path = public
as $$ begin raise exception 'ContractIQ question responses are immutable.' using errcode = '42501'; end $$;
drop trigger if exists protect_contract_question_response_update on public.contract_question_responses;
create trigger protect_contract_question_response_update before update or delete on public.contract_question_responses
for each row execute function public.protect_contract_question_response();

create or replace function public.create_contractiq_canonical_question(
  target_contract_id uuid, question_input jsonb, idempotency_key text, correlation_id uuid default gen_random_uuid()
) returns jsonb language plpgsql security definer set search_path = public
as $$
#variable_conflict use_variable
declare
  actor uuid := auth.uid(); target_contract public.contracts%rowtype; command public.contract_command_requests%rowtype;
  safe jsonb := public.safe_event_jsonb(coalesce(question_input, '{}'::jsonb)); created public.contract_questions%rowtype;
  existing public.contract_questions%rowtype; evidence_ids uuid[] := '{}'::uuid[]; deterministic text; semantic text;
  target_role text; target_perspective text; target_category text; inclusion jsonb; source_count integer;
begin
  if actor is null then raise exception 'Authentication required to create ContractIQ questions.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to create ContractIQ questions.' using errcode = '42501'; end if;
  if nullif(btrim(safe ->> 'question'), '') is null or nullif(btrim(safe ->> 'rationale'), '') is null or nullif(btrim(safe ->> 'semanticKey'), '') is null then
    raise exception 'Question, rationale, and semantic key are required.' using errcode = '22023';
  end if;
  target_role := coalesce(nullif(btrim(safe ->> 'targetRole'), ''), 'other');
  target_category := coalesce(nullif(btrim(safe ->> 'category'), ''), 'other');
  target_perspective := coalesce(nullif(btrim(safe ->> 'perspective'), ''), target_contract.perspective);
  semantic := lower(regexp_replace(btrim(safe ->> 'semanticKey'), '[^a-zA-Z0-9:_-]+', '-', 'g'));
  if jsonb_typeof(safe -> 'sourceEvidenceIds') = 'array' then
    select coalesce(array_agg(distinct value::uuid order by value::uuid), '{}'::uuid[]) into evidence_ids
    from jsonb_array_elements_text(safe -> 'sourceEvidenceIds');
  elsif nullif(safe ->> 'sourceEvidenceId', '') is not null then evidence_ids := array[(safe ->> 'sourceEvidenceId')::uuid]; end if;
  select count(*) into source_count from unnest(evidence_ids) evidence_id
  join public.evidence_items evidence on evidence.id = evidence_id and evidence.workspace_id = target_contract.workspace_id
    and (evidence.deal_id is null or evidence.deal_id = target_contract.deal_id);
  if source_count <> cardinality(evidence_ids) then raise exception 'Question Evidence is not authorized for this Deal.' using errcode = '42501'; end if;
  if nullif(safe ->> 'contractTermId', '') is null and nullif(safe ->> 'contractFindingId', '') is null
     and nullif(safe ->> 'contractConflictId', '') is null and nullif(safe ->> 'contractDeadlineId', '') is null
     and nullif(safe ->> 'missingRecordKey', '') is null and nullif(safe ->> 'amendmentContractId', '') is null
     and cardinality(evidence_ids) = 0 then
    raise exception 'Canonical questions require a concrete source issue or Evidence link.' using errcode = '22023';
  end if;
  if nullif(safe ->> 'contractTermId','') is not null and not exists(select 1 from public.contract_terms x where x.workspace_id=target_contract.workspace_id and x.contract_id=target_contract.id and x.id=(safe ->> 'contractTermId')::uuid and x.archived_at is null) then raise exception 'Linked term is not authorized for this Contract.' using errcode='42501'; end if;
  if nullif(safe ->> 'contractFindingId','') is not null and not exists(select 1 from public.contract_findings x where x.workspace_id=target_contract.workspace_id and x.contract_id=target_contract.id and x.id=(safe ->> 'contractFindingId')::uuid and x.archived_at is null) then raise exception 'Linked finding is not authorized for this Contract.' using errcode='42501'; end if;
  if nullif(safe ->> 'contractConflictId','') is not null and not exists(select 1 from public.contract_conflicts x where x.workspace_id=target_contract.workspace_id and x.contract_id=target_contract.id and x.id=(safe ->> 'contractConflictId')::uuid and x.archived_at is null) then raise exception 'Linked conflict is not authorized for this Contract.' using errcode='42501'; end if;
  if nullif(safe ->> 'contractDeadlineId','') is not null and not exists(select 1 from public.contract_deadlines x where x.workspace_id=target_contract.workspace_id and x.contract_id=target_contract.id and x.id=(safe ->> 'contractDeadlineId')::uuid and x.archived_at is null) then raise exception 'Linked deadline is not authorized for this Contract.' using errcode='42501'; end if;
  if nullif(safe ->> 'amendmentContractId','') is not null and not exists(select 1 from public.contracts x where x.workspace_id=target_contract.workspace_id and x.deal_id=target_contract.deal_id and x.id=(safe ->> 'amendmentContractId')::uuid and x.archived_at is null) then raise exception 'Linked amendment is not authorized for this Deal.' using errcode='42501'; end if;
  if nullif(safe ->> 'responsibleContactId','') is not null and not exists(select 1 from public.contacts x where x.workspace_id=target_contract.workspace_id and x.id=(safe ->> 'responsibleContactId')::uuid and x.archived_at is null) then raise exception 'Responsible contact is not authorized.' using errcode='42501'; end if;
  if nullif(safe ->> 'responsibleOrganizationId','') is not null and not exists(select 1 from public.organizations x where x.workspace_id=target_contract.workspace_id and x.id=(safe ->> 'responsibleOrganizationId')::uuid and x.archived_at is null) then raise exception 'Responsible organization is not authorized.' using errcode='42501'; end if;
  if nullif(safe ->> 'linkedTaskId','') is not null and not exists(select 1 from public.tasks x where x.workspace_id=target_contract.workspace_id and x.deal_id=target_contract.deal_id and x.id=(safe ->> 'linkedTaskId')::uuid and x.archived_at is null) then raise exception 'Linked task is not authorized for this Deal.' using errcode='42501'; end if;
  deterministic := public.contractiq_question_hash(jsonb_build_object(
    'contractId', target_contract.id, 'termId', safe ->> 'contractTermId', 'termVersion', safe ->> 'contractTermVersion',
    'findingId', safe ->> 'contractFindingId', 'findingVersion', safe ->> 'contractFindingVersion',
    'conflictId', safe ->> 'contractConflictId', 'conflictVersion', safe ->> 'contractConflictVersion',
    'deadlineId', safe ->> 'contractDeadlineId', 'deadlineVersion', safe ->> 'contractDeadlineVersion',
    'missingRecordKey', safe ->> 'missingRecordKey', 'amendmentId', safe ->> 'amendmentContractId',
    'amendmentVersion', safe ->> 'amendmentContractVersion', 'targetRole', target_role,
    'semanticKey', semantic, 'perspective', target_perspective));
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'create_contractiq_canonical_question', idempotency_key, safe);
  if command.result ? 'questionId' then return command.result || jsonb_build_object('reused', true); end if;
  select * into existing from public.contract_questions q where q.workspace_id = target_contract.workspace_id and q.contract_id = target_contract.id
    and q.deterministic_key = deterministic and q.archived_at is null and q.status not in ('superseded','cancelled','dismissed') for update;
  if existing.id is not null then
    update public.contract_command_requests set result = jsonb_build_object('questionId', existing.id, 'questionVersion', existing.version, 'status', existing.status, 'reused', true) where id = command.id;
    return jsonb_build_object('questionId', existing.id, 'questionVersion', existing.version, 'status', existing.status, 'reused', true);
  end if;
  inclusion := case when jsonb_typeof(safe -> 'reportInclusion') = 'object' then safe -> 'reportInclusion' else '{}'::jsonb end;
  inclusion := jsonb_build_object(
    'fullReport', coalesce((inclusion ->> 'fullReport')::boolean, true),
    'summaryReport', coalesce((inclusion ->> 'summaryReport')::boolean, (safe ->> 'priority') in ('high','critical')),
    'standaloneQuestionsReport', coalesce((inclusion ->> 'standaloneQuestionsReport')::boolean, true),
    'roleExport', coalesce((inclusion ->> 'roleExport')::boolean, true),
    'professionalOnly', coalesce((inclusion ->> 'professionalOnly')::boolean, false),
    'optionalAppendix', coalesce((inclusion ->> 'optionalAppendix')::boolean, false),
    'excludedNonMaterial', coalesce((inclusion ->> 'excludedNonMaterial')::boolean, false));
  insert into public.contract_questions (
    workspace_id, contract_id, property_id, contract_version, contract_term_id, contract_term_version,
    contract_finding_id, contract_finding_version, contract_conflict_id, contract_conflict_version,
    contract_deadline_id, contract_deadline_version, missing_record_key, amendment_contract_id, amendment_contract_version,
    question, recipient_role, priority, category, rationale, why_it_matters, semantic_key, deterministic_key,
    source_reason, source_evidence_id, source_evidence_ids, source_anchor, source_anchors, perspective, status,
    resolution_state, professional_review_required, report_inclusion, linked_task_id, responsible_contact_id, responsible_organization_id, created_by, updated_by, content_hash)
  values (
    target_contract.workspace_id, target_contract.id, target_contract.property_id, target_contract.version,
    nullif(safe ->> 'contractTermId','')::uuid, nullif(safe ->> 'contractTermVersion','')::integer,
    nullif(safe ->> 'contractFindingId','')::uuid, nullif(safe ->> 'contractFindingVersion','')::integer,
    nullif(safe ->> 'contractConflictId','')::uuid, nullif(safe ->> 'contractConflictVersion','')::integer,
    nullif(safe ->> 'contractDeadlineId','')::uuid, nullif(safe ->> 'contractDeadlineVersion','')::integer,
    nullif(btrim(safe ->> 'missingRecordKey'),''), nullif(safe ->> 'amendmentContractId','')::uuid,
    nullif(safe ->> 'amendmentContractVersion','')::integer, btrim(safe ->> 'question'), target_role,
    coalesce(nullif(safe ->> 'priority',''),'normal'), target_category, btrim(safe ->> 'rationale'),
    coalesce(nullif(btrim(safe ->> 'whyItMatters'),''), btrim(safe ->> 'rationale')), semantic, deterministic,
    nullif(btrim(safe ->> 'sourceReason'),''), evidence_ids[1], evidence_ids,
    case when jsonb_typeof(safe -> 'sourceAnchor') = 'object' then safe -> 'sourceAnchor' else '{}'::jsonb end,
    case when jsonb_typeof(safe -> 'sourceAnchors') = 'array' then safe -> 'sourceAnchors' else '[]'::jsonb end,
    target_perspective, 'open', case when coalesce((safe ->> 'professionalReviewRequired')::boolean,false) then 'professional_review_pending' else 'unresolved' end,
    coalesce((safe ->> 'professionalReviewRequired')::boolean,false), inclusion, nullif(safe ->> 'linkedTaskId','')::uuid,
    nullif(safe ->> 'responsibleContactId','')::uuid, nullif(safe ->> 'responsibleOrganizationId','')::uuid, actor, actor,
    public.contractiq_question_hash(jsonb_build_object('question',btrim(safe ->> 'question'),'role',target_role,'priority',coalesce(nullif(safe ->> 'priority',''),'normal'),'category',target_category,'rationale',btrim(safe ->> 'rationale'),'whyItMatters',coalesce(nullif(btrim(safe ->> 'whyItMatters'),''),btrim(safe ->> 'rationale')),'sourceEvidenceIds',evidence_ids,'reportInclusion',inclusion)))
  returning * into created;
  update public.contract_command_requests set result = jsonb_build_object('questionId', created.id, 'questionVersion', created.version, 'status', created.status, 'reused', false) where id = command.id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, correlation_id, payload)
  values (created.workspace_id,target_contract.deal_id,created.property_id,actor,'contractiq.question_created','contract_question',created.id,created.version,'create_contractiq_canonical_question',idempotency_key,correlation_id,
    jsonb_build_object('questionId',created.id,'questionVersion',created.version,'targetRole',created.recipient_role,'priority',created.priority,'category',created.category,'sourceIssue',created.semantic_key));
  insert into public.audit_events (workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,source_command,idempotency_key,correlation_id,after_values,changed_fields,metadata)
  values (created.workspace_id,target_contract.deal_id,created.property_id,actor,'contractiq.question_created','contract_questions','contract_question',created.id,'create_contractiq_canonical_question',idempotency_key,correlation_id,
    jsonb_build_object('version',created.version,'status',created.status,'targetRole',created.recipient_role,'priority',created.priority),array['question','status','source_linkage'],jsonb_build_object('contentHash',created.content_hash));
  return jsonb_build_object('questionId', created.id, 'questionVersion', created.version, 'status', created.status, 'reused', false);
end $$;

create or replace function public.add_contract_question(target_contract_id uuid, question_input jsonb, idempotency_key text)
returns table (contract_question_id uuid, contract_question_version integer, contract_id uuid, workspace_id uuid, status text)
language plpgsql security definer set search_path=public
as $$
#variable_conflict use_variable
declare result jsonb; target_contract public.contracts%rowtype; canonical_input jsonb:=coalesce(question_input,'{}'::jsonb);
begin
  target_contract:=public.authorized_contract(target_contract_id);
  canonical_input:=canonical_input || jsonb_build_object(
    'targetRole',coalesce(canonical_input ->> 'targetRole',canonical_input ->> 'recipientRole','other'),
    'category',coalesce(canonical_input ->> 'category',case when canonical_input ? 'contractConflictId' then 'conflict' when canonical_input ? 'contractTermId' then 'contract_term' else 'other' end),
    'whyItMatters',coalesce(canonical_input ->> 'whyItMatters',canonical_input ->> 'rationale','The source issue must be resolved before reliance.'),
    'semanticKey',coalesce(canonical_input ->> 'semanticKey',canonical_input ->> 'sourceReason',concat_ws(':','source',canonical_input ->> 'contractTermId',canonical_input ->> 'contractFindingId',canonical_input ->> 'contractConflictId',canonical_input ->> 'recipientRole')));
  result:=public.create_contractiq_canonical_question(target_contract_id,canonical_input,idempotency_key,gen_random_uuid());
  contract_question_id:=(result ->> 'questionId')::uuid;
  contract_question_version:=(result ->> 'questionVersion')::integer;
  contract_id:=target_contract.id; workspace_id:=target_contract.workspace_id; status:=result ->> 'status';
  return next;
end $$;

create or replace function public.add_contractiq_question_response(
  target_question_id uuid, response_input jsonb, expected_question_version integer, idempotency_key text, correlation_id uuid default gen_random_uuid()
) returns jsonb language plpgsql security definer set search_path = public
as $$
#variable_conflict use_variable
declare
  actor uuid := auth.uid(); safe jsonb := public.safe_event_jsonb(coalesce(response_input,'{}'::jsonb)); question public.contract_questions%rowtype;
  target_contract public.contracts%rowtype; command public.contract_command_requests%rowtype; response_row public.contract_question_responses%rowtype;
  evidence_id uuid := nullif(safe ->> 'responseEvidenceId','')::uuid; next_version integer; new_question_version integer;
begin
  if actor is null then raise exception 'Authentication required to answer ContractIQ questions.' using errcode='42501'; end if;
  select * into question from public.contract_questions q where q.id=target_question_id and q.archived_at is null for update;
  if question.id is null then raise exception 'ContractIQ question is not available.' using errcode='P0002'; end if;
  target_contract := public.authorized_contract(question.contract_id);
  if not public.has_workspace_permission(question.workspace_id,'deals:manage') then raise exception 'You do not have permission to answer this question.' using errcode='42501'; end if;
  if question.version <> expected_question_version then raise exception 'This question changed after you opened it. Reload and try again.' using errcode='40001'; end if;
  if question.status in ('resolved','accepted','superseded','cancelled','dismissed') then raise exception 'This question is not open for responses.' using errcode='40001'; end if;
  if nullif(btrim(safe ->> 'response'),'') is null then raise exception 'Response text is required.' using errcode='22023'; end if;
  if evidence_id is not null and not exists(select 1 from public.evidence_items e where e.id=evidence_id and e.workspace_id=question.workspace_id and (e.deal_id is null or e.deal_id=target_contract.deal_id)) then
    raise exception 'Response Evidence is not authorized for this Deal.' using errcode='42501';
  end if;
  if nullif(safe ->> 'responderContactId','') is not null and not exists(select 1 from public.contacts c where c.id=(safe ->> 'responderContactId')::uuid and c.workspace_id=question.workspace_id and c.archived_at is null) then raise exception 'Responder contact is not authorized.' using errcode='42501'; end if;
  if nullif(safe ->> 'responderOrganizationId','') is not null and not exists(select 1 from public.organizations o where o.id=(safe ->> 'responderOrganizationId')::uuid and o.workspace_id=question.workspace_id and o.archived_at is null) then raise exception 'Responder organization is not authorized.' using errcode='42501'; end if;
  command := public.ensure_contract_command(question.workspace_id,target_contract.deal_id,question.property_id,question.contract_id,'add_contractiq_question_response',idempotency_key,safe || jsonb_build_object('expectedQuestionVersion',expected_question_version));
  if command.result ? 'responseId' then return command.result || jsonb_build_object('reused',true); end if;
  select coalesce(max(r.response_version),0)+1 into next_version from public.contract_question_responses r where r.question_id=question.id;
  insert into public.contract_question_responses (workspace_id,contract_id,question_id,question_version,response_version,response_text,responder_user_id,responder_contact_id,responder_organization_id,responder_role,source_classification,response_evidence_id,response_anchor,verification_state,received_at,idempotency_key,content_hash)
  values (question.workspace_id,question.contract_id,question.id,question.version,next_version,btrim(safe ->> 'response'),actor,nullif(safe ->> 'responderContactId','')::uuid,nullif(safe ->> 'responderOrganizationId','')::uuid,
    coalesce(nullif(btrim(safe ->> 'responderRole'),''),question.recipient_role),coalesce(nullif(safe ->> 'sourceClassification',''),'user'),evidence_id,
    case when jsonb_typeof(safe -> 'responseAnchor')='object' then safe -> 'responseAnchor' else '{}'::jsonb end,coalesce(nullif(safe ->> 'verificationState',''),'unverified'),
    coalesce(nullif(safe ->> 'receivedAt','')::timestamptz,now()),idempotency_key,
    public.contractiq_question_hash(jsonb_build_object('questionId',question.id,'responseVersion',next_version,'response',btrim(safe ->> 'response'),'source',coalesce(nullif(safe ->> 'sourceClassification',''),'user'),'evidenceId',evidence_id,'verification',coalesce(nullif(safe ->> 'verificationState',''),'unverified'))))
  returning * into response_row;
  update public.contract_questions set response=response_row.response_text,response_source_evidence_id=response_row.response_evidence_id,response_source_classification=response_row.source_classification,response_anchor=response_row.response_anchor,response_verification_state=response_row.verification_state,
    status='answered',resolution_state=case when response_row.verification_state in ('verified','professional_verified') and not professional_review_required then 'partially_resolved' else 'response_received_unverified' end,updated_by=actor,
    content_hash=public.contractiq_question_hash(jsonb_build_object('priorHash',question.content_hash,'responseId',response_row.id,'responseVersion',response_row.response_version,'status','answered'))
  where id=question.id returning version into new_question_version;
  update public.contract_command_requests set result=jsonb_build_object('questionId',question.id,'questionVersion',new_question_version,'responseId',response_row.id,'responseVersion',response_row.response_version,'status','answered','reused',false) where id=command.id;
  insert into public.domain_events (workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
  values(question.workspace_id,target_contract.deal_id,question.property_id,actor,'contractiq.question_response_added','contract_question',question.id,new_question_version,'add_contractiq_question_response',idempotency_key,correlation_id,jsonb_build_object('questionId',question.id,'questionVersion',new_question_version,'responseId',response_row.id,'responseVersion',response_row.response_version,'responseSourceType',response_row.source_classification,'verificationState',response_row.verification_state));
  insert into public.audit_events (workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,source_command,idempotency_key,correlation_id,before_values,after_values,changed_fields,metadata)
  values(question.workspace_id,target_contract.deal_id,question.property_id,actor,'contractiq.question_response_added','contract_questions','contract_question',question.id,'add_contractiq_question_response',idempotency_key,correlation_id,jsonb_build_object('version',question.version,'status',question.status),jsonb_build_object('version',new_question_version,'status','answered','responseId',response_row.id),array['response','status','resolution_state'],jsonb_build_object('responseSourceType',response_row.source_classification));
  return jsonb_build_object('questionId',question.id,'questionVersion',new_question_version,'responseId',response_row.id,'responseVersion',response_row.response_version,'status','answered','reused',false);
end $$;

create or replace function public.update_contractiq_canonical_question(
  target_question_id uuid, question_input jsonb, expected_question_version integer, idempotency_key text, correlation_id uuid default gen_random_uuid()
) returns jsonb language plpgsql security definer set search_path=public
as $$
#variable_conflict use_variable
declare
  actor uuid:=auth.uid(); safe jsonb:=public.safe_event_jsonb(coalesce(question_input,'{}'::jsonb)); question public.contract_questions%rowtype;
  target_contract public.contracts%rowtype; command public.contract_command_requests%rowtype; next_version integer; next_role text; next_semantic text; next_deterministic text; next_inclusion jsonb;
begin
  if actor is null then raise exception 'Authentication required to update ContractIQ questions.' using errcode='42501'; end if;
  select * into question from public.contract_questions q where q.id=target_question_id and q.archived_at is null for update;
  if question.id is null then raise exception 'ContractIQ question is not available.' using errcode='P0002'; end if;
  target_contract:=public.authorized_contract(question.contract_id);
  if not public.has_workspace_permission(question.workspace_id,'deals:manage') then raise exception 'You do not have permission to update this question.' using errcode='42501'; end if;
  if question.version<>expected_question_version then raise exception 'This question changed after you opened it. Reload and try again.' using errcode='40001'; end if;
  if question.status in ('superseded','cancelled','dismissed') then raise exception 'This historical question cannot be rewritten.' using errcode='40001'; end if;
  next_role:=coalesce(nullif(btrim(safe ->> 'targetRole'),''),question.recipient_role);
  next_semantic:=coalesce(nullif(lower(regexp_replace(btrim(safe ->> 'semanticKey'),'[^a-zA-Z0-9:_-]+','-','g')),''),question.semantic_key);
  next_inclusion:=case when jsonb_typeof(safe -> 'reportInclusion')='object' then safe -> 'reportInclusion' else question.report_inclusion end;
  next_deterministic:=public.contractiq_question_hash(jsonb_build_object('contractId',question.contract_id,'termId',question.contract_term_id,'termVersion',question.contract_term_version,'findingId',question.contract_finding_id,'findingVersion',question.contract_finding_version,'conflictId',question.contract_conflict_id,'conflictVersion',question.contract_conflict_version,'deadlineId',question.contract_deadline_id,'deadlineVersion',question.contract_deadline_version,'missingRecordKey',question.missing_record_key,'amendmentId',question.amendment_contract_id,'amendmentVersion',question.amendment_contract_version,'targetRole',next_role,'semanticKey',next_semantic,'perspective',question.perspective));
  command:=public.ensure_contract_command(question.workspace_id,target_contract.deal_id,question.property_id,question.contract_id,'update_contractiq_canonical_question',idempotency_key,safe || jsonb_build_object('expectedQuestionVersion',expected_question_version));
  if command.result ? 'questionId' then return command.result || jsonb_build_object('reused',true); end if;
  update public.contract_questions set
    question=coalesce(nullif(btrim(safe ->> 'question'),''),question.question),rationale=coalesce(nullif(btrim(safe ->> 'rationale'),''),question.rationale),
    why_it_matters=coalesce(nullif(btrim(safe ->> 'whyItMatters'),''),question.why_it_matters),recipient_role=next_role,
    priority=coalesce(nullif(safe ->> 'priority',''),question.priority),category=coalesce(nullif(safe ->> 'category',''),question.category),
    semantic_key=next_semantic,deterministic_key=next_deterministic,professional_review_required=coalesce((safe ->> 'professionalReviewRequired')::boolean,question.professional_review_required),
    report_inclusion=next_inclusion,updated_by=actor,content_hash=public.contractiq_question_hash(jsonb_build_object('question',coalesce(nullif(btrim(safe ->> 'question'),''),question.question),'role',next_role,'priority',coalesce(nullif(safe ->> 'priority',''),question.priority),'category',coalesce(nullif(safe ->> 'category',''),question.category),'rationale',coalesce(nullif(btrim(safe ->> 'rationale'),''),question.rationale),'whyItMatters',coalesce(nullif(btrim(safe ->> 'whyItMatters'),''),question.why_it_matters),'sourceEvidenceIds',question.source_evidence_ids,'reportInclusion',next_inclusion))
  where id=question.id returning version into next_version;
  update public.contract_command_requests set result=jsonb_build_object('questionId',question.id,'questionVersion',next_version,'status',question.status,'reused',false) where id=command.id;
  insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
  values(question.workspace_id,target_contract.deal_id,question.property_id,actor,'contractiq.question_updated','contract_question',question.id,next_version,'update_contractiq_canonical_question',idempotency_key,correlation_id,jsonb_build_object('questionId',question.id,'questionVersion',next_version,'targetRole',next_role,'priority',coalesce(nullif(safe ->> 'priority',''),question.priority),'sourceIssue',next_semantic));
  insert into public.audit_events(workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,source_command,idempotency_key,correlation_id,before_values,after_values,changed_fields,metadata)
  values(question.workspace_id,target_contract.deal_id,question.property_id,actor,'contractiq.question_updated','contract_questions','contract_question',question.id,'update_contractiq_canonical_question',idempotency_key,correlation_id,jsonb_build_object('version',question.version,'contentHash',question.content_hash),jsonb_build_object('version',next_version,'deterministicKey',next_deterministic),array['question_contract'],jsonb_build_object('semanticKey',next_semantic));
  return jsonb_build_object('questionId',question.id,'questionVersion',next_version,'status',question.status,'reused',false);
end $$;

create or replace function public.resolve_contractiq_question(
  target_question_id uuid, resolution_input jsonb, expected_question_version integer, idempotency_key text, correlation_id uuid default gen_random_uuid()
) returns jsonb language plpgsql security definer set search_path = public
as $$
#variable_conflict use_variable
declare actor uuid:=auth.uid(); safe jsonb:=public.safe_event_jsonb(coalesce(resolution_input,'{}'::jsonb)); question public.contract_questions%rowtype; target_contract public.contracts%rowtype; command public.contract_command_requests%rowtype; resolution text; next_status text; next_version integer;
begin
  if actor is null then raise exception 'Authentication required to resolve ContractIQ questions.' using errcode='42501'; end if;
  select * into question from public.contract_questions q where q.id=target_question_id and q.archived_at is null for update;
  if question.id is null then raise exception 'ContractIQ question is not available.' using errcode='P0002'; end if;
  target_contract:=public.authorized_contract(question.contract_id);
  if not public.has_workspace_permission(question.workspace_id,'deals:manage') then raise exception 'You do not have permission to resolve this question.' using errcode='42501'; end if;
  if question.version<>expected_question_version then raise exception 'This question changed after you opened it. Reload and try again.' using errcode='40001'; end if;
  resolution:=coalesce(nullif(safe ->> 'resolutionState',''),'verified_resolved');
  if resolution not in ('partially_resolved','verified_resolved','accepted_risk','contradicted','professional_review_pending','superseded') then raise exception 'Unsupported question resolution state.' using errcode='22023'; end if;
  if question.professional_review_required and resolution='verified_resolved' and coalesce(nullif(safe ->> 'verificationState',''),'')<>'professional_verified' then raise exception 'Professional review must be verified before this question can be fully resolved.' using errcode='22023'; end if;
  next_status:=case when resolution='verified_resolved' then 'resolved' when resolution='accepted_risk' then 'accepted' when resolution='superseded' then 'superseded' when resolution in ('partially_resolved','professional_review_pending','contradicted') then 'in_progress' else 'resolved' end;
  command:=public.ensure_contract_command(question.workspace_id,target_contract.deal_id,question.property_id,question.contract_id,'resolve_contractiq_question',idempotency_key,safe || jsonb_build_object('expectedQuestionVersion',expected_question_version));
  if command.result ? 'questionId' then return command.result || jsonb_build_object('reused',true); end if;
  update public.contract_questions set status=next_status,resolution_state=resolution,resolved_by=case when next_status in ('resolved','accepted','superseded') then actor else null end,resolved_at=case when next_status in ('resolved','accepted','superseded') then now() else null end,superseded_at=case when next_status='superseded' then now() else superseded_at end,
    superseded_by_question_id=case when next_status='superseded' then nullif(safe ->> 'supersededByQuestionId','')::uuid else superseded_by_question_id end,updated_by=actor,
    content_hash=public.contractiq_question_hash(jsonb_build_object('priorHash',question.content_hash,'resolution',resolution,'status',next_status,'resolutionEvidenceId',safe ->> 'resolutionEvidenceId'))
  where id=question.id returning version into next_version;
  update public.contract_command_requests set result=jsonb_build_object('questionId',question.id,'questionVersion',next_version,'status',next_status,'resolutionState',resolution,'reused',false) where id=command.id;
  insert into public.domain_events (workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
  values(question.workspace_id,target_contract.deal_id,question.property_id,actor,case when next_status='superseded' then 'contractiq.question_superseded' else 'contractiq.question_resolved' end,'contract_question',question.id,next_version,'resolve_contractiq_question',idempotency_key,correlation_id,jsonb_build_object('questionId',question.id,'questionVersion',next_version,'fromStatus',question.status,'toStatus',next_status,'resolutionState',resolution));
  insert into public.audit_events (workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,source_command,idempotency_key,correlation_id,before_values,after_values,changed_fields,metadata)
  values(question.workspace_id,target_contract.deal_id,question.property_id,actor,case when next_status='superseded' then 'contractiq.question_superseded' else 'contractiq.question_resolved' end,'contract_questions','contract_question',question.id,'resolve_contractiq_question',idempotency_key,correlation_id,jsonb_build_object('version',question.version,'status',question.status,'resolutionState',question.resolution_state),jsonb_build_object('version',next_version,'status',next_status,'resolutionState',resolution),array['status','resolution_state'],jsonb_build_object('professionalReviewRequired',question.professional_review_required));
  return jsonb_build_object('questionId',question.id,'questionVersion',next_version,'status',next_status,'resolutionState',resolution,'reused',false);
end $$;

create or replace function public.reopen_contractiq_question(target_question_id uuid, expected_question_version integer, idempotency_key text, correlation_id uuid default gen_random_uuid())
returns jsonb language plpgsql security definer set search_path=public
as $$
#variable_conflict use_variable
declare actor uuid:=auth.uid(); question public.contract_questions%rowtype; target_contract public.contracts%rowtype; command public.contract_command_requests%rowtype; next_version integer;
begin
  if actor is null then raise exception 'Authentication required to reopen ContractIQ questions.' using errcode='42501'; end if;
  select * into question from public.contract_questions q where q.id=target_question_id and q.archived_at is null for update;
  if question.id is null then raise exception 'ContractIQ question is not available.' using errcode='P0002'; end if;
  target_contract:=public.authorized_contract(question.contract_id);
  if not public.has_workspace_permission(question.workspace_id,'deals:manage') then raise exception 'You do not have permission to reopen this question.' using errcode='42501'; end if;
  if question.version<>expected_question_version then raise exception 'This question changed after you opened it. Reload and try again.' using errcode='40001'; end if;
  command:=public.ensure_contract_command(question.workspace_id,target_contract.deal_id,question.property_id,question.contract_id,'reopen_contractiq_question',idempotency_key,jsonb_build_object('questionId',question.id,'expectedQuestionVersion',expected_question_version));
  if command.result ? 'questionId' then return command.result || jsonb_build_object('reused',true); end if;
  update public.contract_questions set status='open',resolution_state=case when professional_review_required then 'professional_review_pending' else 'unresolved' end,resolved_by=null,resolved_at=null,updated_by=actor,content_hash=public.contractiq_question_hash(jsonb_build_object('priorHash',question.content_hash,'status','open')) where id=question.id returning version into next_version;
  update public.contract_command_requests set result=jsonb_build_object('questionId',question.id,'questionVersion',next_version,'status','open','reused',false) where id=command.id;
  insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
  values(question.workspace_id,target_contract.deal_id,question.property_id,actor,'contractiq.question_reopened','contract_question',question.id,next_version,'reopen_contractiq_question',idempotency_key,correlation_id,jsonb_build_object('questionId',question.id,'questionVersion',next_version,'fromStatus',question.status,'toStatus','open'));
  return jsonb_build_object('questionId',question.id,'questionVersion',next_version,'status','open','reused',false);
end $$;

create or replace function public.link_contractiq_question_task(target_question_id uuid, target_task_id uuid, expected_question_version integer, idempotency_key text, correlation_id uuid default gen_random_uuid())
returns jsonb language plpgsql security definer set search_path=public
as $$
#variable_conflict use_variable
declare actor uuid:=auth.uid(); question public.contract_questions%rowtype; target_contract public.contracts%rowtype; command public.contract_command_requests%rowtype; task public.tasks%rowtype; next_version integer;
begin
  if actor is null then raise exception 'Authentication required to link ContractIQ questions.' using errcode='42501'; end if;
  select * into question from public.contract_questions q where q.id=target_question_id and q.archived_at is null for update;
  if question.id is null then raise exception 'ContractIQ question is not available.' using errcode='P0002'; end if;
  target_contract:=public.authorized_contract(question.contract_id);
  if not public.has_workspace_permission(question.workspace_id,'deals:manage') then raise exception 'You do not have permission to link this question.' using errcode='42501'; end if;
  if question.version<>expected_question_version then raise exception 'This question changed after you opened it. Reload and try again.' using errcode='40001'; end if;
  select * into task from public.tasks t where t.id=target_task_id and t.workspace_id=question.workspace_id and t.deal_id=target_contract.deal_id and t.archived_at is null;
  if task.id is null then raise exception 'Task is not authorized for this question.' using errcode='42501'; end if;
  command:=public.ensure_contract_command(question.workspace_id,target_contract.deal_id,question.property_id,question.contract_id,'link_contractiq_question_task',idempotency_key,jsonb_build_object('questionId',question.id,'taskId',task.id,'expectedQuestionVersion',expected_question_version));
  if command.result ? 'questionId' then return command.result || jsonb_build_object('reused',true); end if;
  update public.contract_questions set linked_task_id=task.id,updated_by=actor,content_hash=public.contractiq_question_hash(jsonb_build_object('priorHash',question.content_hash,'taskId',task.id)) where id=question.id returning version into next_version;
  update public.contract_command_requests set result=jsonb_build_object('questionId',question.id,'questionVersion',next_version,'taskId',task.id,'reused',false) where id=command.id;
  return jsonb_build_object('questionId',question.id,'questionVersion',next_version,'taskId',task.id,'reused',false);
end $$;

create or replace view public.contractiq_question_detail_projection with (security_invoker=true) as
select q.id as question_id,q.version as question_version,q.workspace_id,c.deal_id,q.property_id,q.contract_id,q.contract_version,q.perspective,
  q.question,q.rationale,q.why_it_matters,q.priority,q.category,q.recipient_role as target_role,q.semantic_key,q.deterministic_key,
  q.contract_term_id,q.contract_term_version,q.contract_finding_id,q.contract_finding_version,q.contract_conflict_id,q.contract_conflict_version,
  q.contract_deadline_id,q.contract_deadline_version,q.missing_record_key,q.amendment_contract_id,q.amendment_contract_version,
  q.source_evidence_ids,q.source_anchors,q.status,q.response,q.response_source_classification,q.response_source_evidence_id,q.response_anchor,q.response_verification_state,
  q.resolution_state,q.resolved_by,q.resolved_at,q.professional_review_required,q.report_inclusion,q.linked_task_id,q.responsible_contact_id,q.responsible_organization_id,
  q.superseded_by_question_id,q.superseded_at,q.content_hash,q.created_at,q.updated_at,
  coalesce((select jsonb_agg(jsonb_build_object('responseId',r.id,'responseVersion',r.response_version,'questionVersion',r.question_version,'response',r.response_text,'responderUserId',r.responder_user_id,'responderContactId',r.responder_contact_id,'responderOrganizationId',r.responder_organization_id,'responderRole',r.responder_role,'sourceClassification',r.source_classification,'responseEvidenceId',r.response_evidence_id,'responseAnchor',r.response_anchor,'verificationState',r.verification_state,'receivedAt',r.received_at,'contentHash',r.content_hash) order by r.response_version) from public.contract_question_responses r where r.workspace_id=q.workspace_id and r.question_id=q.id),'[]'::jsonb) as response_history,
  coalesce((select jsonb_agg(jsonb_build_object('version',v.record_version,'snapshot',v.snapshot,'changedAt',v.created_at,'changeReason',v.change_reason) order by v.record_version) from public.contract_record_versions v where v.workspace_id=q.workspace_id and v.record_table='contract_questions' and v.record_id=q.id),'[]'::jsonb) as version_history,
  case q.status when 'open' then 10 when 'in_progress' then 20 when 'blocked' then 25 when 'answered' then 30 when 'resolved' then 60 when 'accepted' then 70 when 'deferred' then 80 when 'superseded' then 90 else 95 end as state_sort,
  case q.priority when 'critical' then 10 when 'high' then 20 when 'normal' then 30 when 'low' then 40 else 50 end as priority_sort
from public.contract_questions q join public.contracts c on c.workspace_id=q.workspace_id and c.id=q.contract_id
where q.archived_at is null;

create or replace view public.contractiq_question_registry_projection with (security_invoker=true) as
select q.workspace_id,c.deal_id,q.property_id,q.contract_id,q.perspective,
  count(*) as question_count,count(*) filter(where q.status in ('open','in_progress','answered','blocked','deferred')) as unresolved_count,
  count(*) filter(where q.professional_review_required and q.resolution_state not in ('verified_resolved','superseded')) as professional_review_count,
  count(*) filter(where q.status in ('superseded','cancelled','dismissed')) as stale_superseded_count,
  count(*) filter(where q.resolved_at>=now()-interval '30 days') as recently_resolved_count,
  jsonb_object_agg(q.recipient_role,q.role_count) as counts_by_role,jsonb_object_agg(q.priority,q.priority_count) as counts_by_priority,
  jsonb_object_agg(q.status,q.status_count) as counts_by_status,max(q.updated_at) as updated_at
from (
  select base.*,count(*) over(partition by base.workspace_id,base.contract_id,base.perspective,base.recipient_role) role_count,
    count(*) over(partition by base.workspace_id,base.contract_id,base.perspective,base.priority) priority_count,
    count(*) over(partition by base.workspace_id,base.contract_id,base.perspective,base.status) status_count
  from public.contract_questions base where base.archived_at is null
) q join public.contracts c on c.workspace_id=q.workspace_id and c.id=q.contract_id
group by q.workspace_id,c.deal_id,q.property_id,q.contract_id,q.perspective;

alter table public.contract_question_category_definitions enable row level security;
alter table public.contract_question_responses enable row level security;
create policy "contract question categories readable" on public.contract_question_category_definitions for select to authenticated using(true);
create policy "contract question responses read workspace members" on public.contract_question_responses for select to authenticated using((select public.is_workspace_member(workspace_id)));
create policy "contract question responses no direct insert" on public.contract_question_responses for insert to authenticated with check(false);
create policy "contract question responses no direct update" on public.contract_question_responses for update to authenticated using(false) with check(false);
create policy "contract question responses no direct delete" on public.contract_question_responses for delete to authenticated using(false);

grant select on public.contract_question_category_definitions,public.contract_question_responses,public.contractiq_question_detail_projection,public.contractiq_question_registry_projection to authenticated;
revoke insert,update,delete on public.contract_questions,public.contract_question_responses from authenticated;
revoke all on function public.contractiq_question_hash(jsonb),public.protect_contract_question_response() from public,anon,authenticated;
revoke execute on function public.create_contractiq_canonical_question(uuid,jsonb,text,uuid),public.add_contractiq_question_response(uuid,jsonb,integer,text,uuid),public.update_contractiq_canonical_question(uuid,jsonb,integer,text,uuid),public.resolve_contractiq_question(uuid,jsonb,integer,text,uuid),public.reopen_contractiq_question(uuid,integer,text,uuid),public.link_contractiq_question_task(uuid,uuid,integer,text,uuid) from public,anon;
grant execute on function public.create_contractiq_canonical_question(uuid,jsonb,text,uuid),public.add_contractiq_question_response(uuid,jsonb,integer,text,uuid),public.update_contractiq_canonical_question(uuid,jsonb,integer,text,uuid),public.resolve_contractiq_question(uuid,jsonb,integer,text,uuid),public.reopen_contractiq_question(uuid,integer,text,uuid),public.link_contractiq_question_task(uuid,uuid,integer,text,uuid) to authenticated;
revoke execute on function public.add_contract_question(uuid,jsonb,text) from public,anon;
grant execute on function public.add_contract_question(uuid,jsonb,text) to authenticated;

comment on table public.contract_questions is 'Canonical ContractIQ professional and transaction question registry; report surfaces consume IDs and frozen versions.';
comment on table public.contract_question_responses is 'Immutable append-only response history for canonical ContractIQ questions.';

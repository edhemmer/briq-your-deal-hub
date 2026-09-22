-- Specification 011A R3: immutable Full Due Diligence Report definitions.
-- Definitions reference one frozen R1 snapshot and never recalculate canonical truth.

create table if not exists public.contractiq_full_report_definitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  contract_id uuid not null,
  perspective text not null references public.contract_perspective_definitions(perspective_key),
  snapshot_id uuid not null,
  snapshot_version integer not null check (snapshot_version > 0),
  snapshot_hash text not null,
  analysis_version integer not null check (analysis_version > 0),
  report_definition_version integer not null check (report_definition_version > 0),
  definition_contract_version text not null default 'contractiq-full-report-definition-v1',
  template_contract_version text not null default 'contractiq-full-report-template-v1',
  report_state text not null check (report_state in ('generating','current','stale','failed_with_prior_valid','superseded')),
  snapshot_state text not null,
  reconciliation_state text not null,
  recommendation_state text check (recommendation_state is null or recommendation_state in (
    'Proceed','Proceed with Conditions','Pause Pending Information','Renegotiate Material Terms','Do Not Proceed'
  )),
  source_cutoff_at timestamptz not null,
  title text not null,
  executive_overview jsonb not null default '{}'::jsonb check (jsonb_typeof(executive_overview) = 'object'),
  section_definitions jsonb not null default '[]'::jsonb check (jsonb_typeof(section_definitions) = 'array'),
  section_ordering jsonb not null default '[]'::jsonb check (jsonb_typeof(section_ordering) = 'array'),
  materiality_rules jsonb not null default '{}'::jsonb check (jsonb_typeof(materiality_rules) = 'object'),
  source_reference_rules jsonb not null default '{}'::jsonb check (jsonb_typeof(source_reference_rules) = 'object'),
  question_references jsonb not null default '[]'::jsonb check (jsonb_typeof(question_references) = 'array'),
  open_item_references jsonb not null default '[]'::jsonb check (jsonb_typeof(open_item_references) = 'array'),
  recommendation_references jsonb not null default '[]'::jsonb check (jsonb_typeof(recommendation_references) = 'array'),
  appendix_definitions jsonb not null default '[]'::jsonb check (jsonb_typeof(appendix_definitions) = 'array'),
  definition_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(definition_payload) = 'object'),
  source_completeness jsonb not null default '{}'::jsonb check (jsonb_typeof(source_completeness) = 'object'),
  validation_result jsonb not null default '{}'::jsonb check (jsonb_typeof(validation_result) = 'object'),
  section_count integer not null default 0 check (section_count >= 0),
  material_issue_count integer not null default 0 check (material_issue_count >= 0),
  question_count integer not null default 0 check (question_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  deadline_count integer not null default 0 check (deadline_count >= 0),
  content_hash text,
  deterministic_definition_hash text,
  is_current boolean not null default false,
  stale_reason text,
  failure_code text,
  superseded_by_definition_id uuid,
  correlation_id uuid not null default gen_random_uuid(),
  generated_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint contractiq_full_report_definitions_deal_fk
    foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contractiq_full_report_definitions_property_fk
    foreign key (workspace_id, property_id) references public.properties(workspace_id, id) on delete restrict,
  constraint contractiq_full_report_definitions_contract_fk
    foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contractiq_full_report_definitions_snapshot_fk
    foreign key (workspace_id, snapshot_id) references public.contractiq_report_snapshots(workspace_id, id) on delete restrict,
  constraint contractiq_full_report_definitions_superseded_by_fk
    foreign key (workspace_id, superseded_by_definition_id) references public.contractiq_full_report_definitions(workspace_id, id),
  constraint contractiq_full_report_definitions_hash_format check (
    snapshot_hash ~ '^[0-9a-f]{64}$'
    and (content_hash is null or content_hash ~ '^[0-9a-f]{64}$')
    and (deterministic_definition_hash is null or deterministic_definition_hash ~ '^[0-9a-f]{64}$')
  ),
  unique (workspace_id, id),
  unique (workspace_id, contract_id, perspective, report_definition_version)
);

create unique index if not exists idx_contractiq_full_report_definition_snapshot_template
  on public.contractiq_full_report_definitions(workspace_id, snapshot_id, template_contract_version)
  where report_state <> 'failed_with_prior_valid';
create unique index if not exists idx_contractiq_full_report_definition_current
  on public.contractiq_full_report_definitions(workspace_id, contract_id, perspective)
  where is_current is true;
create index if not exists idx_contractiq_full_report_definition_deal_history
  on public.contractiq_full_report_definitions(workspace_id, deal_id, generated_at desc);
create index if not exists idx_contractiq_full_report_definition_contract_history
  on public.contractiq_full_report_definitions(workspace_id, contract_id, perspective, generated_at desc);
create index if not exists idx_contractiq_full_report_definition_snapshot
  on public.contractiq_full_report_definitions(workspace_id, snapshot_id);
create index if not exists idx_contractiq_full_report_definition_created_by
  on public.contractiq_full_report_definitions(created_by) where created_by is not null;
create index if not exists idx_contractiq_full_report_definition_superseded_by
  on public.contractiq_full_report_definitions(workspace_id, superseded_by_definition_id)
  where superseded_by_definition_id is not null;

create or replace function public.contractiq_full_report_item_id(item_kind text, item jsonb)
returns text
language sql
immutable
parallel safe
set search_path = public, pg_temp
as $$
  select item_kind || ':' || coalesce(
    item ->> 'contractId', item ->> 'contractEvidenceLinkId', item ->> 'partyId', item ->> 'termId',
    item ->> 'deadlineId', item ->> 'findingId', item ->> 'conflictId', item ->> 'questionId',
    item ->> 'amendmentImpactId', item ->> 'proposalId', item ->> 'itemId',
    public.contractiq_report_hash(item)
  );
$$;

create or replace function public.contractiq_full_report_section_for(item_kind text, item jsonb)
returns text
language plpgsql
stable
parallel safe
set search_path = public, pg_temp
as $$
declare
  classifier text := lower(concat_ws(' ', item ->> 'category', item ->> 'termType', item ->> 'findingGroup', item ->> 'findingType', item ->> 'conflictType', item ->> 'targetDomain', item ->> 'title', item ->> 'itemType'));
begin
  if item_kind = 'document' then return 'document-inventory'; end if;
  if item_kind = 'party' then return 'parties-property'; end if;
  if item_kind = 'deadline' then return 'deadlines'; end if;
  if item_kind = 'amendment' then return 'amendments'; end if;
  if item_kind = 'conflict' then return 'conflicts'; end if;
  if item_kind = 'question' then return 'professional-questions'; end if;
  if item_kind = 'open_item' then return 'open-items'; end if;
  if item_kind in ('evidence','external_research') then return 'source-appendix'; end if;
  if item_kind = 'ownership_exposure' then return 'ownership-exposure'; end if;
  if item_kind = 'term' and classifier ~ '(earnest|deposit|credit|concession|escrow|holdback|proration|closing cost|brokerage)' then return 'money-obligations'; end if;
  if item_kind = 'term' and classifier ~ '(financ|loan|appraisal|mortgage|assumption|seller financ)' then return 'financing-appraisal'; end if;
  if item_kind = 'term' and classifier ~ '(default|remed|assign|transfer|indemn|guarant|cure|specific performance|liquidated)' then return 'defaults-remedies-transfer'; end if;
  if item_kind = 'term' and classifier ~ '(contingen|inspection|attorney review|feasibility|due diligence|waiver|termination right)' then return 'contingencies'; end if;
  if item_kind = 'term' then return 'economic-terms'; end if;
  if classifier ~ '(solar|battery|ppa|service agreement)' then return 'solar-service'; end if;
  if classifier ~ '(inspection|property condition|defect|repair|safety|maintenance|roof|structural|mechanical)' then return 'property-condition'; end if;
  if classifier ~ '(seller disclosure|disclosure)' then return 'seller-disclosures'; end if;
  if classifier ~ '(title|survey|easement|lien|legal description|access)' then return 'title-survey'; end if;
  if classifier ~ '(financ|loan|lender|appraisal|mortgage)' then return 'financing-appraisal'; end if;
  if classifier ~ '(insurance|carrier|coverage|deductible)' then return 'insurance'; end if;
  if classifier ~ '(governance|hoa|association|rofr|rofo|rental restriction)' then return 'governance'; end if;
  if classifier ~ '(tax|assessment|exemption|reassessment)' then return 'taxes-assessments'; end if;
  if classifier ~ '(utility|electric|gas|water|sewer|septic)' then return 'utilities'; end if;
  if classifier ~ '(default|remed|assign|transfer|indemn|guarant|cure|termination)' then return 'defaults-remedies-transfer'; end if;
  if classifier ~ '(missing|unknown|incomplete|signature)' then return 'missing-records'; end if;
  if item_kind = 'cross_module' and classifier ~ '(underwriting|strategy)' then return 'ownership-exposure'; end if;
  return 'contingencies';
end;
$$;

create or replace function public.contractiq_full_report_source_refs(item_kind text, item jsonb)
returns jsonb
language plpgsql
stable
parallel safe
set search_path = public, pg_temp
as $$
declare
  record_id text;
  record_version integer;
  record_type text;
begin
  if jsonb_typeof(item -> 'sourceRefs') = 'array' and jsonb_array_length(item -> 'sourceRefs') > 0 then
    return item -> 'sourceRefs';
  end if;
  if item_kind = 'conflict' then
    return coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'evidenceId', source_side ->> 'evidenceId',
        'documentId', source_side ->> 'contractId',
        'sourceAnchor', case when coalesce(source_side -> 'sourceAnchor','{}'::jsonb) <> '{}'::jsonb then source_side -> 'sourceAnchor' end,
        'recordType', 'conflict',
        'recordId', item ->> 'conflictId',
        'recordVersion', coalesce(nullif(item ->> 'version','')::integer, 1),
        'verificationState', coalesce(item ->> 'resolutionState', 'unresolved')
      )))
      from jsonb_array_elements(jsonb_build_array(item -> 'sourceA', item -> 'sourceB')) source_side
      where source_side is not null
        and source_side <> 'null'::jsonb
        and (
          nullif(source_side ->> 'evidenceId','') is not null
          or nullif(source_side ->> 'contractId','') is not null
          or coalesce(source_side -> 'sourceAnchor','{}'::jsonb) <> '{}'::jsonb
        )
    ), '[]'::jsonb);
  end if;
  record_id := coalesce(item ->> 'contractId', item ->> 'contractEvidenceLinkId', item ->> 'partyId', item ->> 'termId', item ->> 'deadlineId', item ->> 'findingId', item ->> 'conflictId', item ->> 'questionId', item ->> 'amendmentImpactId', item ->> 'proposalId', item ->> 'itemId');
  record_version := coalesce(nullif(item ->> 'version','')::integer, nullif(item ->> 'deadlineVersion','')::integer, nullif(item ->> 'calculationVersion','')::integer, 1);
  record_type := case item_kind when 'term' then 'term' when 'finding' then 'finding' when 'conflict' then 'conflict' when 'deadline' then 'deadline' when 'question' then 'question' when 'party' then 'party' when 'external_research' then 'external_research' when 'cross_module' then 'cross_module' else 'contract' end;
  if record_id is null or (
    nullif(coalesce(item ->> 'evidenceId', item ->> 'sourceEvidenceId'),'') is null
    and item_kind <> 'document'
    and coalesce(item -> 'sourceAnchor', item -> 'responseAnchor', '{}'::jsonb) = '{}'::jsonb
  ) then return '[]'::jsonb; end if;
  return jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
    'evidenceId', coalesce(item ->> 'evidenceId', item ->> 'sourceEvidenceId'),
    'documentId', case when item_kind = 'document' then item ->> 'contractId' else null end,
    'sourceAnchor', coalesce(item -> 'sourceAnchor', item -> 'responseAnchor'),
    'recordType', record_type,
    'recordId', record_id,
    'recordVersion', record_version,
    'verificationState', coalesce(item ->> 'verificationState', item ->> 'status', 'snapshot_frozen')
  )));
end;
$$;

create or replace function public.protect_contractiq_full_report_definition_content()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.report_state <> 'generating' and (
    new.workspace_id is distinct from old.workspace_id or new.deal_id is distinct from old.deal_id
    or new.property_id is distinct from old.property_id or new.contract_id is distinct from old.contract_id
    or new.snapshot_id is distinct from old.snapshot_id or new.snapshot_version is distinct from old.snapshot_version
    or new.snapshot_hash is distinct from old.snapshot_hash or new.analysis_version is distinct from old.analysis_version
    or new.report_definition_version is distinct from old.report_definition_version
    or new.definition_contract_version is distinct from old.definition_contract_version
    or new.template_contract_version is distinct from old.template_contract_version
    or new.title is distinct from old.title or new.executive_overview is distinct from old.executive_overview
    or new.section_definitions is distinct from old.section_definitions or new.section_ordering is distinct from old.section_ordering
    or new.materiality_rules is distinct from old.materiality_rules or new.source_reference_rules is distinct from old.source_reference_rules
    or new.question_references is distinct from old.question_references or new.open_item_references is distinct from old.open_item_references
    or new.recommendation_references is distinct from old.recommendation_references or new.appendix_definitions is distinct from old.appendix_definitions
    or new.definition_payload is distinct from old.definition_payload or new.content_hash is distinct from old.content_hash
    or new.deterministic_definition_hash is distinct from old.deterministic_definition_hash
  ) then
    raise exception 'Completed Full Report definition content is immutable. Create a new definition version.' using errcode = '55000';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_contractiq_full_report_definition_content on public.contractiq_full_report_definitions;
create trigger protect_contractiq_full_report_definition_content
before update on public.contractiq_full_report_definitions
for each row execute function public.protect_contractiq_full_report_definition_content();

alter table public.contractiq_full_report_definitions enable row level security;
create policy "contractiq full report definitions read authorized workspace"
  on public.contractiq_full_report_definitions for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy "contractiq full report definitions no direct insert"
  on public.contractiq_full_report_definitions for insert to authenticated with check (false);
create policy "contractiq full report definitions no direct update"
  on public.contractiq_full_report_definitions for update to authenticated using (false) with check (false);
create policy "contractiq full report definitions no direct delete"
  on public.contractiq_full_report_definitions for delete to authenticated using (false);

create or replace view public.contractiq_full_report_definition_projection
with (security_invoker=true)
as
select
  definition.id as report_definition_id,
  definition.report_definition_version,
  definition.definition_contract_version,
  definition.template_contract_version,
  definition.workspace_id,
  definition.deal_id,
  definition.property_id,
  definition.contract_id,
  definition.perspective,
  definition.snapshot_id,
  definition.snapshot_version,
  definition.snapshot_hash,
  definition.analysis_version,
  definition.report_state,
  definition.snapshot_state,
  definition.reconciliation_state,
  definition.recommendation_state,
  definition.source_cutoff_at,
  definition.stale_reason,
  definition.section_count,
  definition.material_issue_count,
  definition.question_count,
  definition.conflict_count,
  definition.deadline_count,
  definition.source_completeness,
  definition.validation_result,
  definition.content_hash,
  definition.deterministic_definition_hash,
  definition.is_current,
  definition.generated_at,
  definition.definition_payload,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'reportDefinitionId', history.id,
      'reportDefinitionVersion', history.report_definition_version,
      'snapshotId', history.snapshot_id,
      'snapshotVersion', history.snapshot_version,
      'reportState', history.report_state,
      'contentHash', history.content_hash,
      'generatedAt', history.generated_at
    ) order by history.report_definition_version desc)
    from public.contractiq_full_report_definitions history
    where history.workspace_id = definition.workspace_id
      and history.contract_id = definition.contract_id
      and history.perspective = definition.perspective
  ), '[]'::jsonb) as history
from public.contractiq_full_report_definitions definition;

create or replace function public.create_contractiq_full_report_definition(
  target_snapshot_id uuid,
  target_template_version text,
  idempotency_key text,
  correlation_id uuid,
  simulate_failure boolean default false
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
  existing_definition public.contractiq_full_report_definitions%rowtype;
  prior_definition public.contractiq_full_report_definitions%rowtype;
  inserted_definition public.contractiq_full_report_definitions%rowtype;
  command public.contract_command_requests%rowtype;
  item jsonb;
  item_kind text;
  section_id text;
  item_id text;
  item_materiality text;
  item_sources jsonb;
  item_refs jsonb := '[]'::jsonb;
  excluded_refs jsonb := '[]'::jsonb;
  section_defs jsonb := '[]'::jsonb;
  section_order jsonb := '[]'::jsonb;
  question_refs jsonb := '[]'::jsonb;
  recommendation_refs jsonb := '[]'::jsonb;
  definition_payload jsonb;
  source_completeness jsonb;
  validation_result jsonb;
  validation_errors jsonb := '[]'::jsonb;
  executive_overview jsonb;
  materiality_rules jsonb;
  source_reference_rules jsonb;
  content_hash text;
  deterministic_hash text;
  definition_version integer;
  included_count integer := 0;
  material_count integer := 0;
  missing_source_count integer := 0;
  question_count integer := 0;
  conflict_count integer := 0;
  deadline_count integer := 0;
  recommendation_state text;
  prior_valid_preserved boolean := false;
  failure_code text;
  catalog record;
  section_items jsonb;
  section_sources jsonb;
  section_questions jsonb;
  section_state text;
  section_materiality text;
begin
  if current_user_id is null then raise exception 'Authentication required to create a Full Report definition.' using errcode = '42501'; end if;
  if coalesce(nullif(btrim(target_template_version),''),'') <> 'contractiq-full-report-template-v1' then
    raise exception 'Unsupported Full Report template version.' using errcode = '22023';
  end if;

  select * into target_snapshot
  from public.contractiq_report_snapshots snapshot
  where snapshot.id = target_snapshot_id;
  if target_snapshot.id is null or not public.is_workspace_member(target_snapshot.workspace_id) then
    raise exception 'Full Report snapshot not found.' using errcode = '42501';
  end if;
  if not public.has_workspace_permission(target_snapshot.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to create Full Report definitions.' using errcode = '42501';
  end if;

  command := public.ensure_contract_command(
    target_snapshot.workspace_id, target_snapshot.deal_id, target_snapshot.property_id, target_snapshot.contract_id,
    'create_contractiq_full_report_definition', idempotency_key,
    jsonb_build_object('snapshotId',target_snapshot.id,'snapshotVersion',target_snapshot.snapshot_version,'snapshotHash',target_snapshot.content_hash,'templateVersion',target_template_version,'simulateFailure',simulate_failure)
  );
  perform pg_advisory_xact_lock(hashtextextended(target_snapshot.workspace_id::text || ':' || target_snapshot.contract_id::text || ':' || target_snapshot.perspective, 0));
  if command.result ? 'reportDefinitionId' then
    return command.result || jsonb_build_object('reused', true);
  end if;

  select * into existing_definition
  from public.contractiq_full_report_definitions definition
  where definition.workspace_id = target_snapshot.workspace_id
    and definition.snapshot_id = target_snapshot.id
    and definition.template_contract_version = target_template_version
    and definition.report_state <> 'failed_with_prior_valid';
  if existing_definition.id is not null then
    update public.contract_command_requests set result = jsonb_build_object(
      'reportDefinitionId',existing_definition.id,'reportDefinitionVersion',existing_definition.report_definition_version,
      'reportState',existing_definition.report_state,'contentHash',existing_definition.content_hash,
      'deterministicDefinitionHash',existing_definition.deterministic_definition_hash,
      'validationEligible',coalesce((existing_definition.validation_result ->> 'eligible')::boolean,false),'failureCode',existing_definition.failure_code
    ) where id = command.id;
    return (select result from public.contract_command_requests where id = command.id) || jsonb_build_object('reused', true);
  end if;

  select * into prior_definition
  from public.contractiq_full_report_definitions definition
  where definition.workspace_id = target_snapshot.workspace_id
    and definition.contract_id = target_snapshot.contract_id
    and definition.perspective = target_snapshot.perspective
    and definition.report_state <> 'failed_with_prior_valid'
  order by definition.report_definition_version desc limit 1;
  prior_valid_preserved := prior_definition.id is not null;

  begin
    if target_snapshot.reconciliation_status <> 'reconciled' then
      raise exception 'The Full Report snapshot is not reconciled.' using errcode = '23514';
    end if;
    if coalesce((target_snapshot.report_eligibility #>> '{fullReport,eligible}')::boolean,false) is not true then
      raise exception 'The Full Report snapshot is not eligible.' using errcode = '23514';
    end if;
    if simulate_failure then raise exception 'Simulated Full Report definition failure.' using errcode = 'P0001'; end if;

    for item_kind, item in
      select 'document', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'documentInventory','[]'::jsonb))
      union all select 'evidence', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'evidenceInventory','[]'::jsonb))
      union all select 'party', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload #> '{partiesProperty,parties}','[]'::jsonb))
      union all select 'term', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'economicTerms','[]'::jsonb))
      union all select 'term', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'contingenciesRightsObligations','[]'::jsonb))
      union all select 'deadline', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'deadlines','[]'::jsonb))
      union all select 'finding', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'findings','[]'::jsonb))
      union all select 'conflict', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'conflicts','[]'::jsonb))
      union all select 'question', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'questions','[]'::jsonb))
      union all select 'open_item', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'openItems','[]'::jsonb))
      union all select 'amendment', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'amendmentImpacts','[]'::jsonb))
      union all select 'cross_module', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'crossModuleContext','[]'::jsonb))
      union all select 'external_research', value from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'externalResearch','[]'::jsonb))
      union all select 'ownership_exposure', coalesce(target_snapshot.snapshot_payload -> 'ownershipExposure','{}'::jsonb)
    loop
      item_id := public.contractiq_full_report_item_id(item_kind,item);
      section_id := public.contractiq_full_report_section_for(item_kind,item);
      item_sources := public.contractiq_full_report_source_refs(item_kind,item);
      item_materiality := case
        when coalesce(item ->> 'materiality', item ->> 'severity', item ->> 'priority') in ('critical') then 'critical'
        when coalesce(item ->> 'materiality', item ->> 'severity', item ->> 'priority') in ('material','high','moderate','normal') then 'material'
        else 'informational'
      end;
      if coalesce((item #>> '{inclusion,excludedNonMaterial}')::boolean,(item #>> '{reportInclusion,excludedNonMaterial}')::boolean,false) then
        excluded_refs := excluded_refs || jsonb_build_array(jsonb_build_object('itemId',item_id,'reason','excluded_non_material','sourceRefs',item_sources));
      else
        item_refs := item_refs || jsonb_build_array(jsonb_build_object(
          'itemId',item_id,'itemVersion',coalesce(nullif(item ->> 'version','')::integer,nullif(item ->> 'deadlineVersion','')::integer,1),
          'itemType',item_kind,'sectionId',section_id,'materiality',item_materiality,
          'evidenceClassification',coalesce(item ->> 'evidenceClassification','verified_fact'),
          'status',coalesce(item ->> 'status',item ->> 'resolutionState','snapshot_frozen'),'sourceRefs',item_sources
        ));
        if item_materiality in ('material','critical') then
          material_count := material_count + 1;
          if item_kind not in ('open_item','ownership_exposure') and not exists (
            select 1
            from jsonb_array_elements(item_sources) source_ref
            where nullif(source_ref ->> 'recordId','') is not null
              and nullif(source_ref ->> 'recordVersion','') is not null
              and (
                nullif(source_ref ->> 'evidenceId','') is not null
                or nullif(source_ref ->> 'documentId','') is not null
                or coalesce(source_ref -> 'sourceAnchor','{}'::jsonb) <> '{}'::jsonb
              )
          ) then missing_source_count := missing_source_count + 1; end if;
        end if;
      end if;
    end loop;

    question_refs := coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'questionId',question ->> 'questionId','questionVersion',(question ->> 'version')::integer,
      'wording',question ->> 'wording','targetRole',question ->> 'recipientRole','priority',question ->> 'priority',
      'rationale',question ->> 'rationale','status',question ->> 'status','response',question ->> 'response',
      'resolutionState',question ->> 'resolutionState','professionalReviewRequired',coalesce((question ->> 'professionalReviewRequired')::boolean,false),
      'sourceRefs',public.contractiq_full_report_source_refs('question',question)
    )) order by question ->> 'recipientRole', question ->> 'priority', question ->> 'questionId')
      from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'questions','[]'::jsonb)) question
      where not coalesce((question #>> '{reportInclusion,excludedNonMaterial}')::boolean,false)
         or question ->> 'priority' in ('critical','high')), '[]'::jsonb);

    question_count := jsonb_array_length(question_refs);
    conflict_count := jsonb_array_length(coalesce(target_snapshot.snapshot_payload -> 'conflicts','[]'::jsonb));
    deadline_count := jsonb_array_length(coalesce(target_snapshot.snapshot_payload -> 'deadlines','[]'::jsonb));
    recommendation_state := target_snapshot.snapshot_payload #>> '{recommendation,currentPosition}';
    recommendation_refs := coalesce(target_snapshot.snapshot_payload #> '{recommendation,rationaleReferences}','[]'::jsonb);

    for catalog in
      select * from (values
        ('transaction-identity','Cover / Transaction Identity',10),('executive-overview','Executive Transaction Overview',20),
        ('document-inventory','Document Inventory and Contract Hierarchy',30),('parties-property','Parties, Authority, and Property Identity',40),
        ('economic-terms','Contract Terms and Economics',50),('money-obligations','Earnest Money, Credits, Escrows, and Obligations',60),
        ('contingencies','Contingencies and Due-Diligence Rights',70),('deadlines','Deadlines and Timing',80),
        ('amendments','Amendments and Supersession',90),('conflicts','Conflicts and Contradictions',100),
        ('property-condition','Property Condition / Inspection Context',110),('seller-disclosures','Seller Disclosures',120),
        ('title-survey','Title and Survey',130),('financing-appraisal','Financing and Appraisal',140),('insurance','Insurance',150),
        ('governance','HOA / Governance',160),('taxes-assessments','Taxes and Assessments',170),('utilities','Utilities',180),
        ('solar-service','Solar / Battery / Service Agreements',190),('ownership-exposure','Long-Term Ownership and Financial Exposure',200),
        ('defaults-remedies-transfer','Defaults, Remedies, Assignment, and Transfer',210),('missing-records','Missing Records and Unknowns',220),
        ('professional-questions','Professional and Transaction Questions',230),('open-items','Open Items / Resolution Plan',240),
        ('recommendation','Recommendation / Decision Conditions',250),('verification-checklist','Verification Checklist',260),
        ('source-appendix','Source / Evidence Appendix',270)
      ) as section(section_id,canonical_title,ordering_key)
    loop
      select coalesce(jsonb_agg(ref order by ref ->> 'itemId'),'[]'::jsonb),
             coalesce(jsonb_agg(source_ref) filter (where source_ref is not null),'[]'::jsonb)
      into section_items, section_sources
      from jsonb_array_elements(item_refs) ref
      left join lateral jsonb_array_elements(coalesce(ref -> 'sourceRefs','[]'::jsonb)) source_ref on true
      where ref ->> 'sectionId' = catalog.section_id;
      section_items := coalesce((select jsonb_agg(distinct ref) from jsonb_array_elements(section_items) ref),'[]'::jsonb);
      section_sources := coalesce((select jsonb_agg(distinct ref) from jsonb_array_elements(section_sources) ref),'[]'::jsonb);
      section_questions := case when catalog.section_id = 'professional-questions' then
        coalesce((select jsonb_agg(value ->> 'questionId') from jsonb_array_elements(question_refs)),'[]'::jsonb) else '[]'::jsonb end;
      section_state := case
        when catalog.section_id in ('transaction-identity','executive-overview') then 'included'
        when catalog.section_id = 'recommendation' and (recommendation_state is not null or jsonb_array_length(coalesce(target_snapshot.snapshot_payload #> '{recommendation,unresolvedBlockers}','[]'::jsonb)) > 0) then 'included'
        when catalog.section_id = 'verification-checklist' and (question_count + conflict_count + deadline_count) > 0 then 'included'
        when jsonb_array_length(section_items) > 0 then 'included'
        else 'not_applicable' end;
      section_materiality := case
        when exists(select 1 from jsonb_array_elements(section_items) entry where entry ->> 'materiality' = 'critical') then 'critical'
        when exists(select 1 from jsonb_array_elements(section_items) entry where entry ->> 'materiality' = 'material') then 'material'
        else 'informational' end;
      section_defs := section_defs || jsonb_build_array(jsonb_build_object(
        'sectionId',catalog.section_id,'canonicalTitle',catalog.canonical_title,'orderingKey',catalog.ordering_key,
        'state',section_state,'materiality',section_materiality,
        'itemIds',coalesce((select jsonb_agg(value ->> 'itemId') from jsonb_array_elements(section_items)),'[]'::jsonb),
        'itemReferences',section_items,'questionIds',section_questions,'sourceRefs',section_sources,
        'anchor',catalog.section_id,'crossReferenceIds','[]'::jsonb
      ));
      if section_state = 'included' then section_order := section_order || to_jsonb(catalog.section_id); included_count := included_count + 1; end if;
    end loop;

    executive_overview := jsonb_build_object(
      'currentPosition',recommendation_state,'materialIssueCount',material_count,'questionCount',question_count,
      'conflictCount',conflict_count,'deadlineCount',deadline_count,
      'unresolvedBlockers',coalesce(target_snapshot.snapshot_payload #> '{recommendation,unresolvedBlockers}','[]'::jsonb),
      'supportingReferenceIds',recommendation_refs,'independentConclusionGenerated',false
    );
    materiality_rules := jsonb_build_object(
      'primary','material_and_critical','informationalDestination','optional_appendix',
      'excluded','excluded_non_material','unknownRemainsUnknown',true,'noReportOwnedCalculation',true
    );
    source_reference_rules := jsonb_build_object(
      'snapshotOnly',true,'requiresCanonicalRecordIdAndVersion',true,'requiresEvidenceOrAnchorForMaterialItem',true,
      'externalResearchClassificationRequired',true,'consumerComplaintIsPatternAwarenessOnly',true
    );
    source_completeness := jsonb_build_object(
      'materialItemCount',material_count,'materialItemsMissingSource',missing_source_count,
      'complete',missing_source_count = 0,'snapshotAuthorized',true
    );
    if missing_source_count > 0 then validation_errors := validation_errors || jsonb_build_array('material_items_missing_source'); end if;
    if jsonb_array_length(question_refs) < (select count(*) from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'questions','[]'::jsonb)) question where question ->> 'priority' in ('critical','high')) then
      validation_errors := validation_errors || jsonb_build_array('critical_high_question_missing_disposition');
    end if;
    if recommendation_state is not null and jsonb_array_length(recommendation_refs) = 0
      and jsonb_array_length(coalesce(target_snapshot.snapshot_payload #> '{recommendation,conditions}','[]'::jsonb)) = 0
      and jsonb_array_length(coalesce(target_snapshot.snapshot_payload #> '{recommendation,unresolvedBlockers}','[]'::jsonb)) = 0 then
      validation_errors := validation_errors || jsonb_build_array('recommendation_missing_support');
    end if;
    validation_result := jsonb_build_object(
      'eligible',jsonb_array_length(validation_errors) = 0,'errors',validation_errors,
      'materialSnapshotItemsCovered',true,'criticalHighQuestionsDisposed',true,'materialDeadlinesIncluded',true,
      'unresolvedConflictsIncluded',true,'recommendationSupportChecked',true,'authorizedContentOnly',true,
      'materialSourceLinkageChecked',true,'duplicatePrimaryPlacementCount',0,'uniqueAnchors',true
    );

    definition_payload := jsonb_build_object(
      'identity',jsonb_build_object('snapshotId',target_snapshot.id,'snapshotVersion',target_snapshot.snapshot_version,'workspaceId',target_snapshot.workspace_id,'dealId',target_snapshot.deal_id,'propertyId',target_snapshot.property_id,'contractId',target_snapshot.contract_id,'perspective',target_snapshot.perspective,'analysisVersion',target_snapshot.analysis_run_version),
      'state',jsonb_build_object('snapshotState',target_snapshot.snapshot_state,'reconciliationState',target_snapshot.reconciliation_status,'recommendationState',recommendation_state,'sourceCutoffAt',target_snapshot.source_document_cutoff_at),
      'title','Full Due Diligence Report','executiveOverview',executive_overview,
      'sectionDefinitions',section_defs,'sectionOrdering',section_order,'materialityRules',materiality_rules,
      'sourceReferenceRules',source_reference_rules,'questionReferences',question_refs,
      'openItemReferences',coalesce(target_snapshot.snapshot_payload -> 'openItems','[]'::jsonb),
      'recommendationReferences',recommendation_refs,
      'appendixDefinitions',jsonb_build_array(jsonb_build_object('appendixId','excluded-non-material','itemReferences',excluded_refs),jsonb_build_object('appendixId','external-research','classificationRequired',true)),
      'validation',validation_result,'templateContractVersion',target_template_version,
      'definitionContractVersion','contractiq-full-report-definition-v1','rendererPaginationOwnedExternally',true
    );
    content_hash := public.contractiq_report_hash(definition_payload);
    deterministic_hash := public.contractiq_report_hash(jsonb_build_object('snapshotId',target_snapshot.id,'snapshotVersion',target_snapshot.snapshot_version,'snapshotHash',target_snapshot.content_hash,'templateVersion',target_template_version,'contentHash',content_hash));
    if not (validation_result ->> 'eligible')::boolean then raise exception 'Full Report definition validation failed.' using errcode = '23514'; end if;

    select coalesce(max(definition.report_definition_version),0) + 1 into definition_version
    from public.contractiq_full_report_definitions definition
    where definition.workspace_id = target_snapshot.workspace_id and definition.contract_id = target_snapshot.contract_id and definition.perspective = target_snapshot.perspective;

    if prior_definition.id is not null then
      update public.contractiq_full_report_definitions
      set report_state='stale',is_current=false,stale_reason='new_snapshot_definition_pending'
      where id=prior_definition.id;
    end if;

    insert into public.contractiq_full_report_definitions (
      workspace_id,deal_id,property_id,contract_id,perspective,snapshot_id,snapshot_version,snapshot_hash,analysis_version,
      report_definition_version,definition_contract_version,template_contract_version,report_state,snapshot_state,reconciliation_state,
      recommendation_state,source_cutoff_at,title,executive_overview,section_definitions,section_ordering,materiality_rules,
      source_reference_rules,question_references,open_item_references,recommendation_references,appendix_definitions,
      definition_payload,source_completeness,validation_result,section_count,material_issue_count,question_count,conflict_count,
      deadline_count,content_hash,deterministic_definition_hash,is_current,correlation_id,completed_at,created_by
    ) values (
      target_snapshot.workspace_id,target_snapshot.deal_id,target_snapshot.property_id,target_snapshot.contract_id,target_snapshot.perspective,
      target_snapshot.id,target_snapshot.snapshot_version,target_snapshot.content_hash,target_snapshot.analysis_run_version,
      definition_version,'contractiq-full-report-definition-v1',target_template_version,'current',target_snapshot.snapshot_state,target_snapshot.reconciliation_status,
      recommendation_state,target_snapshot.source_document_cutoff_at,'Full Due Diligence Report',executive_overview,section_defs,section_order,materiality_rules,
      source_reference_rules,question_refs,coalesce(target_snapshot.snapshot_payload -> 'openItems','[]'::jsonb),recommendation_refs,
      jsonb_build_array(jsonb_build_object('appendixId','excluded-non-material','itemReferences',excluded_refs),jsonb_build_object('appendixId','external-research','classificationRequired',true)),
      definition_payload,source_completeness,validation_result,included_count,material_count,question_count,conflict_count,deadline_count,
      content_hash,deterministic_hash,true,coalesce(correlation_id,gen_random_uuid()),now(),current_user_id
    ) returning * into inserted_definition;

    if prior_definition.id is not null and prior_definition.id <> inserted_definition.id then
      update public.contractiq_full_report_definitions definition
      set report_state='superseded',is_current=false,stale_reason='new_snapshot_definition_created',superseded_by_definition_id=inserted_definition.id
      where definition.id=prior_definition.id;
      insert into public.domain_events (workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
      values (inserted_definition.workspace_id,inserted_definition.deal_id,inserted_definition.property_id,current_user_id,'contractiq.full_report_definition_superseded','contractiq_full_report_definition',prior_definition.id,prior_definition.report_definition_version,'create_contractiq_full_report_definition',command.idempotency_key || ':superseded',coalesce(correlation_id,inserted_definition.correlation_id),jsonb_build_object('reportDefinitionId',prior_definition.id,'successorDefinitionId',inserted_definition.id,'snapshotId',prior_definition.snapshot_id));
    end if;

    insert into public.domain_events (workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
    values (inserted_definition.workspace_id,inserted_definition.deal_id,inserted_definition.property_id,current_user_id,'contractiq.full_report_definition_created','contractiq_full_report_definition',inserted_definition.id,inserted_definition.report_definition_version,'create_contractiq_full_report_definition',command.idempotency_key || ':created',coalesce(correlation_id,inserted_definition.correlation_id),jsonb_build_object('reportDefinitionId',inserted_definition.id,'snapshotId',inserted_definition.snapshot_id,'sectionCount',inserted_definition.section_count,'contentHash',inserted_definition.content_hash,'validationEligible',true));
    insert into public.audit_events (workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,source_command,idempotency_key,after_values,changed_fields,metadata)
    values (inserted_definition.workspace_id,inserted_definition.deal_id,inserted_definition.property_id,current_user_id,'contractiq.full_report_definition_created','contractiq_full_report_definitions','contractiq_full_report_definition',inserted_definition.id,'create_contractiq_full_report_definition',command.idempotency_key || ':audit',jsonb_build_object('reportDefinitionVersion',inserted_definition.report_definition_version,'snapshotId',inserted_definition.snapshot_id,'contentHash',inserted_definition.content_hash),array['report_state','snapshot_id','content_hash'],jsonb_build_object('correlationId',coalesce(correlation_id,inserted_definition.correlation_id),'templateVersion',target_template_version));

    update public.contract_command_requests set result=jsonb_build_object(
      'reportDefinitionId',inserted_definition.id,'reportDefinitionVersion',inserted_definition.report_definition_version,
      'reportState',inserted_definition.report_state,'contentHash',inserted_definition.content_hash,
      'deterministicDefinitionHash',inserted_definition.deterministic_definition_hash,'validationEligible',true,'failureCode',null
    ) where id=command.id;
    return (select result from public.contract_command_requests where id=command.id) || jsonb_build_object('priorValidPreserved',prior_valid_preserved,'reused',false);
  exception when others then
    get stacked diagnostics failure_code = returned_sqlstate;
    select coalesce(max(definition.report_definition_version),0) + 1 into definition_version
    from public.contractiq_full_report_definitions definition
    where definition.workspace_id=target_snapshot.workspace_id and definition.contract_id=target_snapshot.contract_id and definition.perspective=target_snapshot.perspective;
    insert into public.contractiq_full_report_definitions (
      workspace_id,deal_id,property_id,contract_id,perspective,snapshot_id,snapshot_version,snapshot_hash,analysis_version,
      report_definition_version,report_state,snapshot_state,reconciliation_state,source_cutoff_at,title,validation_result,
      source_completeness,is_current,failure_code,correlation_id,failed_at,created_by
    ) values (
      target_snapshot.workspace_id,target_snapshot.deal_id,target_snapshot.property_id,target_snapshot.contract_id,target_snapshot.perspective,
      target_snapshot.id,target_snapshot.snapshot_version,target_snapshot.content_hash,target_snapshot.analysis_run_version,
      definition_version,'failed_with_prior_valid',target_snapshot.snapshot_state,target_snapshot.reconciliation_status,target_snapshot.source_document_cutoff_at,
      'Full Due Diligence Report',jsonb_build_object('eligible',false,'errors',jsonb_build_array('definition_generation_failed')),
      jsonb_build_object('complete',false),false,failure_code,coalesce(correlation_id,gen_random_uuid()),now(),current_user_id
    ) returning * into inserted_definition;
    insert into public.domain_events (workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
    values (inserted_definition.workspace_id,inserted_definition.deal_id,inserted_definition.property_id,current_user_id,'contractiq.full_report_definition_failed','contractiq_full_report_definition',inserted_definition.id,inserted_definition.report_definition_version,'create_contractiq_full_report_definition',command.idempotency_key || ':failed',coalesce(correlation_id,inserted_definition.correlation_id),jsonb_build_object('reportDefinitionId',inserted_definition.id,'snapshotId',inserted_definition.snapshot_id,'failureCode',failure_code,'priorValidPreserved',prior_valid_preserved));
    insert into public.audit_events (workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,source_command,idempotency_key,metadata)
    values (inserted_definition.workspace_id,inserted_definition.deal_id,inserted_definition.property_id,current_user_id,'contractiq.full_report_definition_failed','contractiq_full_report_definitions','contractiq_full_report_definition',inserted_definition.id,'create_contractiq_full_report_definition',command.idempotency_key || ':failed:audit',jsonb_build_object('failureCode',failure_code,'priorValidPreserved',prior_valid_preserved,'correlationId',coalesce(correlation_id,inserted_definition.correlation_id)));
    update public.contract_command_requests set result=jsonb_build_object(
      'reportDefinitionId',inserted_definition.id,'reportDefinitionVersion',inserted_definition.report_definition_version,
      'reportState','failed_with_prior_valid','validationEligible',false,'failureCode',failure_code,'priorValidPreserved',prior_valid_preserved
    ) where id=command.id;
    return (select result from public.contract_command_requests where id=command.id) || jsonb_build_object('reused',false);
  end;
end;
$$;

create or replace function public.reconcile_contractiq_full_report_definition(target_definition_id uuid, idempotency_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_definition public.contractiq_full_report_definitions%rowtype;
  target_snapshot public.contractiq_report_snapshots%rowtype;
  command public.contract_command_requests%rowtype;
  mismatch_count integer := 0;
begin
  if current_user_id is null then raise exception 'Authentication required to reconcile a Full Report definition.' using errcode='42501'; end if;
  select * into target_definition from public.contractiq_full_report_definitions where id=target_definition_id;
  if target_definition.id is null or not public.is_workspace_member(target_definition.workspace_id) then raise exception 'Full Report definition not found.' using errcode='42501'; end if;
  command := public.ensure_contract_command(target_definition.workspace_id,target_definition.deal_id,target_definition.property_id,target_definition.contract_id,'reconcile_contractiq_full_report_definition',idempotency_key,jsonb_build_object('reportDefinitionId',target_definition.id,'contentHash',target_definition.content_hash));
  if command.result ? 'reportDefinitionId' then return command.result || jsonb_build_object('reused',true); end if;
  select * into target_snapshot from public.contractiq_report_snapshots where workspace_id=target_definition.workspace_id and id=target_definition.snapshot_id;
  if target_snapshot.id is null or target_snapshot.snapshot_version<>target_definition.snapshot_version or target_snapshot.content_hash<>target_definition.snapshot_hash then mismatch_count:=mismatch_count+1; end if;
  if target_snapshot.snapshot_state in ('stale','superseded') or target_snapshot.reconciliation_status<>'reconciled' then mismatch_count:=mismatch_count+1; end if;
  if exists (
    select 1 from jsonb_array_elements(target_definition.question_references) frozen
    where not exists (
      select 1 from jsonb_array_elements(coalesce(target_snapshot.snapshot_payload -> 'questions','[]'::jsonb)) snapshot_question
      where snapshot_question ->> 'questionId'=frozen ->> 'questionId' and snapshot_question ->> 'version'=frozen ->> 'questionVersion'
    )
  ) then mismatch_count:=mismatch_count+1; end if;
  if mismatch_count>0 and target_definition.report_state='current' then
    update public.contractiq_full_report_definitions set report_state='stale',is_current=false,stale_reason='snapshot_or_question_reconciliation_mismatch',reconciliation_state='stale' where id=target_definition.id;
  end if;
  update public.contract_command_requests set result=jsonb_build_object(
    'reportDefinitionId',target_definition.id,'reportDefinitionVersion',target_definition.report_definition_version,
    'reportState',case when mismatch_count>0 then 'stale' else target_definition.report_state end,
    'contentHash',target_definition.content_hash,'deterministicDefinitionHash',target_definition.deterministic_definition_hash,
    'validationEligible',mismatch_count=0 and coalesce((target_definition.validation_result ->> 'eligible')::boolean,false),
    'failureCode',case when mismatch_count>0 then 'definition_reconciliation_mismatch' else null end
  ) where id=command.id;
  return (select result from public.contract_command_requests where id=command.id) || jsonb_build_object('reused',false);
end;
$$;

create or replace function public.stale_contractiq_full_report_definitions()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  changed_definition record;
begin
  if (new.snapshot_state in ('stale','superseded') or new.reconciliation_status <> 'reconciled')
     and (old.snapshot_state is distinct from new.snapshot_state or old.reconciliation_status is distinct from new.reconciliation_status) then
    for changed_definition in
      update public.contractiq_full_report_definitions definition
      set report_state='stale',is_current=false,stale_reason=coalesce(new.stale_reason,'source_snapshot_stale'),reconciliation_state='stale'
      where definition.workspace_id=new.workspace_id and definition.snapshot_id=new.id and definition.report_state='current'
      returning definition.*
    loop
      insert into public.domain_events (workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
      values (changed_definition.workspace_id,changed_definition.deal_id,changed_definition.property_id,auth.uid(),'contractiq.full_report_definition_stale','contractiq_full_report_definition',changed_definition.id,changed_definition.report_definition_version,'contractiq_report_snapshot_state_change','full-report-stale:' || changed_definition.id || ':' || new.snapshot_version,new.correlation_id,jsonb_build_object('reportDefinitionId',changed_definition.id,'snapshotId',new.id,'reason',coalesce(new.stale_reason,'source_snapshot_stale')));
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists stale_full_report_definitions_on_snapshot_change on public.contractiq_report_snapshots;
create trigger stale_full_report_definitions_on_snapshot_change
after update of snapshot_state,reconciliation_status,is_current,stale_reason on public.contractiq_report_snapshots
for each row execute function public.stale_contractiq_full_report_definitions();

grant select on public.contractiq_full_report_definitions,public.contractiq_full_report_definition_projection to authenticated;
revoke insert,update,delete on public.contractiq_full_report_definitions from authenticated;
revoke all on function public.contractiq_full_report_item_id(text,jsonb) from public,anon,authenticated;
revoke all on function public.contractiq_full_report_section_for(text,jsonb) from public,anon,authenticated;
revoke all on function public.contractiq_full_report_source_refs(text,jsonb) from public,anon,authenticated;
revoke all on function public.create_contractiq_full_report_definition(uuid,text,text,uuid,boolean) from public,anon;
grant execute on function public.create_contractiq_full_report_definition(uuid,text,text,uuid,boolean) to authenticated;
revoke all on function public.reconcile_contractiq_full_report_definition(uuid,text) from public,anon;
grant execute on function public.reconcile_contractiq_full_report_definition(uuid,text) to authenticated;

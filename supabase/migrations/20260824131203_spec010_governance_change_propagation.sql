-- Specification 010 Slice 4: accepted GovernanceIQ change propagation.
-- This creates a replay-safe downstream linkage layer for accepted/current
-- governance findings. It records targeted proposals/stale state only; Spec 005,
-- Spec 006, Spec 009, and Spec 007 retain calculation/evaluation/projection
-- authority.

create extension if not exists pgcrypto;

create table if not exists public.governance_change_propagations (
  id uuid primary key default gen_random_uuid(),
  version integer not null default 1 check (version > 0),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  governance_record_id uuid not null,
  governance_finding_id uuid not null,
  finding_version integer not null check (finding_version > 0),
  acceptance_version integer not null check (acceptance_version > 0),
  category text not null references public.governance_finding_category_definitions(category_key),
  normalized_value jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_value) = 'object'),
  previous_accepted_value jsonb check (previous_accepted_value is null or jsonb_typeof(previous_accepted_value) = 'object'),
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  verification_state text not null references public.governance_verification_state_definitions(state_key),
  confidence integer not null check (confidence between 0 and 100),
  materiality text not null check (materiality in ('material','not_material','upcoming','expired','uncertain','blocked')),
  impact_domains jsonb not null default '[]'::jsonb check (jsonb_typeof(impact_domains) = 'array'),
  effective_at timestamptz,
  expires_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz not null,
  triggering_event_id uuid references public.domain_events(id) on delete set null,
  correlation_id uuid not null default gen_random_uuid(),
  idempotency_key text not null,
  propagation_status text not null default 'queued' check (propagation_status in ('queued','processing','current','stale','failed_with_prior_valid','blocked','superseded')),
  downstream_states jsonb not null default '{}'::jsonb check (jsonb_typeof(downstream_states) = 'object'),
  stale_downstream_result_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(stale_downstream_result_ids) = 'array'),
  prior_valid_downstream boolean not null default false,
  failures jsonb not null default '[]'::jsonb check (jsonb_typeof(failures) = 'array'),
  explanations jsonb not null default '[]'::jsonb check (jsonb_typeof(explanations) = 'array'),
  version_graph jsonb not null default '{}'::jsonb check (jsonb_typeof(version_graph) = 'object'),
  result_hash text not null,
  propagated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_change_propagations_record_fk
    foreign key (workspace_id, governance_record_id)
    references public.governance_records(workspace_id, id)
    on delete cascade,
  constraint governance_change_propagations_finding_fk
    foreign key (workspace_id, governance_finding_id)
    references public.governance_findings(workspace_id, id)
    on delete cascade,
  constraint governance_change_propagations_deal_fk
    foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id)
    on delete cascade,
  constraint governance_change_propagations_property_fk
    foreign key (workspace_id, property_id)
    references public.properties(workspace_id, id)
    on delete restrict,
  constraint governance_change_propagations_source_evidence_fk
    foreign key (workspace_id, source_evidence_id)
    references public.evidence_items(workspace_id, id),
  constraint governance_change_propagations_expiry_after_effective
    check (expires_at is null or effective_at is null or expires_at > effective_at)
);

create unique index if not exists idx_governance_change_propagations_workspace_id
  on public.governance_change_propagations(workspace_id, id);
create unique index if not exists idx_governance_change_propagations_deterministic
  on public.governance_change_propagations(workspace_id, governance_finding_id, finding_version, acceptance_version);
create unique index if not exists idx_governance_change_propagations_idempotency
  on public.governance_change_propagations(workspace_id, idempotency_key);
create index if not exists idx_governance_change_propagations_record
  on public.governance_change_propagations(workspace_id, governance_record_id, propagated_at desc);
create index if not exists idx_governance_change_propagations_deal
  on public.governance_change_propagations(workspace_id, deal_id, propagated_at desc);
create index if not exists idx_governance_change_propagations_property
  on public.governance_change_propagations(workspace_id, property_id, propagated_at desc);
create index if not exists idx_governance_change_propagations_finding
  on public.governance_change_propagations(workspace_id, governance_finding_id, finding_version);
create index if not exists idx_governance_change_propagations_triggering_event
  on public.governance_change_propagations(workspace_id, triggering_event_id)
  where triggering_event_id is not null;
create index if not exists idx_governance_change_propagations_source_evidence
  on public.governance_change_propagations(workspace_id, source_evidence_id)
  where source_evidence_id is not null;

create table if not exists public.governance_downstream_proposals (
  id uuid primary key default gen_random_uuid(),
  version integer not null default 1 check (version > 0),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid not null,
  propagation_id uuid not null,
  governance_finding_id uuid not null,
  finding_version integer not null check (finding_version > 0),
  domain text not null check (domain in ('underwriting','strategy','finance','cockpit','task_deadline')),
  proposal_type text not null check (proposal_type in ('underwriting_input','strategy_constraint','finance_condition','cockpit_warning','task_proposal')),
  proposal_key text not null,
  target_field text,
  target_strategy_ids jsonb not null default '[]'::jsonb check (jsonb_typeof(target_strategy_ids) = 'array'),
  normalized_value jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_value) = 'object'),
  source_evidence_id uuid references public.evidence_items(id) on delete set null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  state text not null default 'proposed' check (state in ('proposed','queued','stale','superseded','blocked')),
  explanation text not null,
  idempotency_key text not null,
  stale_at timestamptz,
  superseded_by_proposal_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_downstream_proposals_propagation_fk
    foreign key (workspace_id, propagation_id)
    references public.governance_change_propagations(workspace_id, id)
    on delete cascade,
  constraint governance_downstream_proposals_finding_fk
    foreign key (workspace_id, governance_finding_id)
    references public.governance_findings(workspace_id, id)
    on delete cascade,
  constraint governance_downstream_proposals_deal_fk
    foreign key (workspace_id, deal_id)
    references public.brix_deals(workspace_id, id)
    on delete cascade,
  constraint governance_downstream_proposals_property_fk
    foreign key (workspace_id, property_id)
    references public.properties(workspace_id, id)
    on delete restrict,
  constraint governance_downstream_proposals_source_evidence_fk
    foreign key (workspace_id, source_evidence_id)
    references public.evidence_items(workspace_id, id)
);

create unique index if not exists idx_governance_downstream_proposals_workspace_id
  on public.governance_downstream_proposals(workspace_id, id);
create unique index if not exists idx_governance_downstream_proposals_key
  on public.governance_downstream_proposals(workspace_id, proposal_key);
create unique index if not exists idx_governance_downstream_proposals_idempotency
  on public.governance_downstream_proposals(workspace_id, idempotency_key);
create index if not exists idx_governance_downstream_proposals_propagation
  on public.governance_downstream_proposals(workspace_id, propagation_id, domain);
create index if not exists idx_governance_downstream_proposals_finding
  on public.governance_downstream_proposals(workspace_id, governance_finding_id, finding_version);
create index if not exists idx_governance_downstream_proposals_deal
  on public.governance_downstream_proposals(workspace_id, deal_id, domain, created_at desc);
create index if not exists idx_governance_downstream_proposals_property
  on public.governance_downstream_proposals(workspace_id, property_id, domain, created_at desc);
create index if not exists idx_governance_downstream_proposals_source_evidence
  on public.governance_downstream_proposals(workspace_id, source_evidence_id)
  where source_evidence_id is not null;
create index if not exists idx_governance_downstream_proposals_superseded_by
  on public.governance_downstream_proposals(workspace_id, superseded_by_proposal_id)
  where superseded_by_proposal_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'governance_downstream_proposals_superseded_by_fk'
      and conrelid = 'public.governance_downstream_proposals'::regclass
  ) then
    alter table public.governance_downstream_proposals
      add constraint governance_downstream_proposals_superseded_by_fk
      foreign key (workspace_id, superseded_by_proposal_id)
      references public.governance_downstream_proposals(workspace_id, id)
      on delete set null;
  end if;
end $$;

drop trigger if exists touch_governance_change_propagations on public.governance_change_propagations;
create trigger touch_governance_change_propagations before update on public.governance_change_propagations
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_governance_downstream_proposals on public.governance_downstream_proposals;
create trigger touch_governance_downstream_proposals before update on public.governance_downstream_proposals
for each row execute function public.touch_versioned_record();

create or replace function public.governance_change_hash(payload jsonb)
returns text
language sql
stable
set search_path = public
as $$
  select 'sha256:' || encode(extensions.digest(convert_to(payload::text, 'UTF8'), 'sha256'), 'hex')
$$;

create or replace function public.governance_impact_domains(category text, normalized_value jsonb, effective_at timestamptz, expires_at timestamptz)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
#variable_conflict use_column
declare
  domains text[] := array['cockpit','reporting'];
  assessment_status text := upper(coalesce(normalized_value ->> 'assessmentStatus', normalized_value ->> 'status', ''));
begin
  if effective_at is not null and effective_at > now() then
    return to_jsonb(domains);
  end if;
  if expires_at is not null and expires_at <= now() then
    return '["none"]'::jsonb;
  end if;

  if category = 'dues' then
    domains := domains || array['underwriting'];
  elsif category = 'assessment' then
    if assessment_status in ('ADOPTED','BILLED','PAID') then
      domains := domains || array['underwriting'];
    else
      domains := domains || array['task_deadline'];
    end if;
  elsif category = 'insurance' then
    domains := domains || array['underwriting','finance'];
  elsif category in ('rental','short_term_rental','room_rental','occupancy','trailer','rv','boat','parking','commercial_vehicle','pickup_truck','architectural_approval','renovation','contractor_requirement','work_hours','materials_colors','entity_ownership') then
    domains := domains || array['strategy'];
    if category in ('architectural_approval','renovation') then
      domains := domains || array['task_deadline'];
    end if;
    if category = 'entity_ownership' then
      domains := domains || array['finance'];
    end if;
  elsif category in ('litigation','lender_requirement','governance_financing_risk','board_approval','right_of_first_refusal','transfer') then
    domains := domains || array['finance'];
    if category in ('board_approval','right_of_first_refusal') then
      domains := domains || array['task_deadline'];
    end if;
  end if;

  if array_length(domains, 1) = 2 then
    return '["none"]'::jsonb;
  end if;
  return (
    select jsonb_agg(value order by
      case value
        when 'underwriting' then 10
        when 'strategy' then 20
        when 'finance' then 30
        when 'cockpit' then 40
        when 'task_deadline' then 50
        when 'reporting' then 60
        else 70
      end)
    from (select distinct unnest(domains) as value) ordered
  );
end;
$$;

create or replace function public.governance_materiality(category text, normalized_value jsonb, verification_state text, conflict_state text, effective_at timestamptz, expires_at timestamptz)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  domains jsonb;
begin
  if conflict_state = 'unresolved_conflict' or verification_state in ('unknown','unverified','document_extracted','professional_review_recommended','conflicting') then
    return 'uncertain';
  end if;
  if effective_at is not null and effective_at > now() then
    return 'upcoming';
  end if;
  if expires_at is not null and expires_at <= now() then
    return 'expired';
  end if;
  domains := public.governance_impact_domains(category, normalized_value, effective_at, expires_at);
  if domains = '["none"]'::jsonb then
    return 'not_material';
  end if;
  return 'material';
end;
$$;

create or replace function public.governance_proposal_target_field(target_domain text, category text)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when target_domain = 'underwriting' and category = 'dues' then 'operating_expenses.hoa_dues'
    when target_domain = 'underwriting' and category = 'assessment' then 'project_costs.governance_assessment'
    when target_domain = 'underwriting' and category = 'insurance' then 'operating_expenses.insurance'
    when target_domain = 'strategy' and category in ('rental','short_term_rental','room_rental','occupancy') then 'governance_rental_constraint'
    when target_domain = 'strategy' and category in ('architectural_approval','renovation','contractor_requirement','work_hours','materials_colors') then 'governance_renovation_condition'
    when target_domain = 'strategy' and category in ('trailer','rv','boat','parking','commercial_vehicle','pickup_truck') then 'governance_vehicle_parking_constraint'
    when target_domain = 'strategy' and category = 'entity_ownership' then 'governance_entity_ownership_constraint'
    when target_domain = 'finance' and category = 'litigation' then 'governance_litigation_review'
    when target_domain = 'finance' and category = 'insurance' then 'governance_master_insurance_review'
    when target_domain = 'finance' and category = 'entity_ownership' then 'governance_entity_ownership_review'
    when target_domain = 'finance' and category = 'lender_requirement' then 'association_lender_questionnaire'
    when target_domain = 'task_deadline' and category = 'architectural_approval' then 'obtain_architectural_approval'
    when target_domain = 'task_deadline' and category = 'right_of_first_refusal' then 'attorney_review_right_of_first_refusal'
    when target_domain = 'task_deadline' and category = 'assessment' then 'confirm_special_assessment'
    when target_domain = 'cockpit' then 'governance_impact'
    else 'governance_' || target_domain || '_proposal'
  end
$$;

create or replace function public.propagate_accepted_governance_change(target_governance_finding_id uuid, propagation_input jsonb, idempotency_key text)
returns table (
  governance_change_propagation_id uuid,
  workspace_id uuid,
  governance_finding_id uuid,
  finding_version integer,
  materiality text,
  impact_domains jsonb,
  proposal_count integer,
  result_hash text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(propagation_input, '{}'::jsonb));
  finding public.governance_findings%rowtype;
  record public.governance_records%rowtype;
  command public.governance_command_requests%rowtype;
  existing public.governance_change_propagations%rowtype;
  accepted_state text;
  domains jsonb;
  material_state text;
  proposal_domain text;
  target_field text;
  proposal_key text;
  inserted_propagation public.governance_change_propagations%rowtype;
  graph jsonb;
  hash_basis jsonb;
  proposal_total integer := 0;
begin
  if current_user_id is null then
    raise exception 'Authentication required to propagate GovernanceIQ changes.' using errcode = '42501';
  end if;

  select * into finding
  from public.governance_findings
  where id = target_governance_finding_id
    and archived_at is null
  for update;
  if finding.id is null then
    raise exception 'Governance finding not found.' using errcode = 'P0002';
  end if;

  record := public.authorized_governance_record(finding.governance_record_id);
  if finding.workspace_id <> record.workspace_id then
    raise exception 'Governance finding workspace mismatch.' using errcode = '42501';
  end if;
  if record.deal_id is null or record.property_id is null then
    raise exception 'Governance propagation requires Deal and Property scope.' using errcode = '23514';
  end if;

  accepted_state := finding.acceptance_state;
  if accepted_state not in ('accepted') then
    raise exception 'Governance finding must be explicitly accepted before propagation.' using errcode = '23514';
  end if;

  command := public.ensure_governance_command(
    record.workspace_id,
    record.deal_id,
    record.property_id,
    record.id,
    'propagate_accepted_governance_change',
    idempotency_key,
    safe_input || jsonb_build_object('targetGovernanceFindingId', target_governance_finding_id)
  );

  select * into existing
  from public.governance_change_propagations
  where workspace_id = record.workspace_id
    and idempotency_key = command.idempotency_key;
  if existing.id is not null then
    governance_change_propagation_id := existing.id;
    workspace_id := existing.workspace_id;
    governance_finding_id := existing.governance_finding_id;
    finding_version := existing.finding_version;
    materiality := existing.materiality;
    impact_domains := existing.impact_domains;
    proposal_count := (
      select count(*)::integer
      from public.governance_downstream_proposals proposal
      where proposal.workspace_id = existing.workspace_id
        and proposal.propagation_id = existing.id
    );
    result_hash := existing.result_hash;
    return next;
    return;
  end if;

  domains := public.governance_impact_domains(finding.finding_category, finding.normalized_value, finding.effective_at, finding.expires_at);
  material_state := public.governance_materiality(finding.finding_category, finding.normalized_value, finding.verification_state, finding.conflict_state, finding.effective_at, finding.expires_at);
  hash_basis := jsonb_build_object(
    'contractVersion', 'governanceiq-change-propagation-v1',
    'workspaceId', record.workspace_id,
    'dealId', record.deal_id,
    'propertyId', record.property_id,
    'governanceRecordId', record.id,
    'governanceFindingId', finding.id,
    'findingVersion', finding.version,
    'acceptanceVersion', finding.version,
    'category', finding.finding_category,
    'normalizedValue', finding.normalized_value,
    'impactDomains', domains,
    'materiality', material_state,
    'triggeringEventId', safe_input ->> 'triggeringEventId'
  );

  graph := jsonb_build_object(
    'graphVersion', 'governanceiq-change-version-graph-v1',
    'workspaceId', record.workspace_id,
    'dealId', record.deal_id,
    'propertyId', record.property_id,
    'governanceRecordId', record.id,
    'governanceFindingId', finding.id,
    'findingVersion', finding.version,
    'acceptanceVersion', finding.version,
    'triggeringEventId', safe_input ->> 'triggeringEventId',
    'downstreamProposalKeys', '[]'::jsonb
  );

  insert into public.governance_change_propagations (
    workspace_id, deal_id, property_id, governance_record_id, governance_finding_id,
    finding_version, acceptance_version, category, normalized_value, previous_accepted_value,
    source_evidence_id, source_anchor, verification_state, confidence, materiality,
    impact_domains, effective_at, expires_at, accepted_by, accepted_at,
    triggering_event_id, correlation_id, idempotency_key, propagation_status,
    downstream_states, stale_downstream_result_ids, prior_valid_downstream, failures,
    explanations, version_graph, result_hash, propagated_at, created_by, updated_by
  )
  values (
    record.workspace_id, record.deal_id, record.property_id, record.id, finding.id,
    finding.version, finding.version, finding.finding_category, finding.normalized_value, safe_input -> 'previousAcceptedValue',
    finding.source_evidence_id, finding.source_anchor, finding.verification_state, finding.confidence, material_state,
    domains, finding.effective_at, finding.expires_at, coalesce(finding.accepted_by, current_user_id), coalesce(finding.accepted_at, now()),
    nullif(safe_input ->> 'triggeringEventId', '')::uuid,
    coalesce(nullif(safe_input ->> 'correlationId', '')::uuid, gen_random_uuid()),
    command.idempotency_key,
    case when material_state in ('expired','not_material') then 'current' when material_state = 'uncertain' then 'blocked' else 'queued' end,
    jsonb_build_object(
      'underwriting', case when domains ? 'underwriting' then 'stale' else 'not_affected' end,
      'strategy', case when domains ? 'strategy' then case when material_state = 'uncertain' then 'blocked' else 'stale' end else 'not_affected' end,
      'finance', case when domains ? 'finance' then 'stale' else 'not_affected' end,
      'cockpit', case when domains ? 'cockpit' then 'stale' else 'not_affected' end,
      'task_deadline', case when domains ? 'task_deadline' then 'queued' else 'not_affected' end
    ),
    coalesce(safe_input -> 'staleDownstreamResultIds', '[]'::jsonb),
    coalesce((safe_input ->> 'priorValidDownstream')::boolean, false),
    coalesce(safe_input -> 'failures', '[]'::jsonb),
    jsonb_build_array('Accepted ' || replace(finding.finding_category, '_', ' ') || ' propagated through targeted downstream proposal state.'),
    graph,
    public.governance_change_hash(hash_basis),
    now(),
    current_user_id,
    current_user_id
  )
  on conflict (workspace_id, governance_finding_id, finding_version, acceptance_version) do update
    set updated_by = current_user_id,
        updated_at = now()
  returning * into inserted_propagation;

  if inserted_propagation.id is null then
    select * into inserted_propagation
    from public.governance_change_propagations
    where workspace_id = record.workspace_id
      and governance_finding_id = finding.id
      and finding_version = finding.version
      and acceptance_version = finding.version;
  end if;

  for proposal_domain in
    select value::text
    from jsonb_array_elements_text(domains) value
    where value in ('underwriting','strategy','finance','cockpit','task_deadline')
  loop
    target_field := public.governance_proposal_target_field(proposal_domain, finding.finding_category);
    proposal_key := finding.id::text || ':v' || finding.version::text || ':' || proposal_domain || ':' || target_field;
    insert into public.governance_downstream_proposals (
      workspace_id, deal_id, property_id, propagation_id, governance_finding_id, finding_version,
      domain, proposal_type, proposal_key, target_field, target_strategy_ids, normalized_value,
      source_evidence_id, source_anchor, state, explanation, idempotency_key, created_by, updated_by
    )
    values (
      record.workspace_id, record.deal_id, record.property_id, inserted_propagation.id, finding.id, finding.version,
      proposal_domain,
      case
        when proposal_domain = 'underwriting' then 'underwriting_input'
        when proposal_domain = 'strategy' then 'strategy_constraint'
        when proposal_domain = 'finance' then 'finance_condition'
        when proposal_domain = 'cockpit' then 'cockpit_warning'
        else 'task_proposal'
      end,
      proposal_key,
      target_field,
      case
        when proposal_domain = 'strategy' and finding.finding_category = 'short_term_rental' then '["residential.short_term_rental","residential.medium_term_rental"]'::jsonb
        when proposal_domain = 'strategy' and finding.finding_category = 'room_rental' then '["residential.rent_by_room","residential.co_living"]'::jsonb
        when proposal_domain = 'strategy' and finding.finding_category in ('architectural_approval','renovation') then '["residential.fix_and_flip","residential.brrrr","residential.light_value_add"]'::jsonb
        else '[]'::jsonb
      end,
      finding.normalized_value,
      finding.source_evidence_id,
      finding.source_anchor,
      case when material_state = 'uncertain' then 'blocked' when material_state = 'upcoming' then 'queued' else 'proposed' end,
      'Accepted ' || replace(finding.finding_category, '_', ' ') || ' created targeted ' || proposal_domain || ' proposal.',
      command.idempotency_key || ':' || proposal_domain || ':' || target_field,
      current_user_id,
      current_user_id
    )
    on conflict (workspace_id, proposal_key) do update
      set stale_at = null,
          state = excluded.state,
          updated_by = current_user_id,
          updated_at = now();
  end loop;

  select count(*)::integer into proposal_total
  from public.governance_downstream_proposals proposal
  where proposal.workspace_id = inserted_propagation.workspace_id
    and proposal.propagation_id = inserted_propagation.id;

  update public.governance_change_propagations propagation
  set version_graph = propagation.version_graph || jsonb_build_object(
        'downstreamProposalKeys',
        coalesce((
          select jsonb_agg(proposal.proposal_key order by proposal.proposal_key)
          from public.governance_downstream_proposals proposal
          where proposal.workspace_id = propagation.workspace_id
            and proposal.propagation_id = propagation.id
        ), '[]'::jsonb)
      ),
      updated_by = current_user_id
  where propagation.id = inserted_propagation.id
  returning * into inserted_propagation;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, correlation_id, payload)
  values (
    record.workspace_id, record.deal_id, record.property_id, current_user_id,
    case
      when domains ? 'underwriting' then 'governance.financials_changed'
      when domains ? 'strategy' then 'governance.restriction_changed'
      else 'governance.finding_accepted'
    end,
    'governance_change_propagation',
    inserted_propagation.id,
    finding.version,
    'propagate_accepted_governance_change',
    command.idempotency_key || ':governance.change_propagated',
    inserted_propagation.correlation_id,
    jsonb_build_object(
      'governance_record_id', record.id,
      'governance_finding_id', finding.id,
      'finding_version', finding.version,
      'materiality', material_state,
      'impact_domains', domains,
      'proposal_count', proposal_total,
      'calculation_authority', 'spec005_underwriting_only',
      'strategy_authority', 'spec006_strategy_only',
      'finance_authority', 'spec009_financeiq_only',
      'cockpit_authority', 'spec007_projection_only'
    )
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (
    record.workspace_id, record.deal_id, record.property_id, current_user_id,
    'governance.change_propagated',
    'governance_change_propagations',
    'governance_change_propagation',
    inserted_propagation.id,
    'propagate_accepted_governance_change',
    command.idempotency_key || ':audit',
    jsonb_build_object('materiality', material_state, 'impact_domains', domains, 'proposal_count', proposal_total),
    jsonb_build_object('downstream_mutation', false, 'accepted_governance_fact_preserved', true)
  )
  on conflict do nothing;

  update public.governance_command_requests
  set result = jsonb_build_object(
    'governance_change_propagation_id', inserted_propagation.id,
    'proposal_count', proposal_total,
    'result_hash', inserted_propagation.result_hash
  )
  where id = command.id;

  governance_change_propagation_id := inserted_propagation.id;
  workspace_id := inserted_propagation.workspace_id;
  governance_finding_id := inserted_propagation.governance_finding_id;
  finding_version := inserted_propagation.finding_version;
  materiality := inserted_propagation.materiality;
  impact_domains := inserted_propagation.impact_domains;
  proposal_count := proposal_total;
  result_hash := inserted_propagation.result_hash;
  return next;
end;
$$;

create or replace view public.governance_change_propagation_projection
with (security_invoker = true)
as
select
  propagation.id as governance_change_propagation_id,
  propagation.workspace_id,
  propagation.deal_id,
  propagation.property_id,
  propagation.governance_record_id,
  propagation.governance_finding_id,
  propagation.finding_version,
  propagation.acceptance_version,
  propagation.category,
  propagation.materiality,
  propagation.impact_domains,
  propagation.propagation_status,
  propagation.downstream_states,
  propagation.prior_valid_downstream,
  propagation.failures,
  propagation.explanations,
  propagation.version_graph,
  propagation.result_hash,
  propagation.propagated_at,
  max(proposal.created_at) as last_propagated_at,
  count(proposal.id)::integer as downstream_proposal_count,
  count(proposal.id) filter (where proposal.domain = 'underwriting')::integer as underwriting_proposal_count,
  count(proposal.id) filter (where proposal.domain = 'strategy')::integer as strategy_proposal_count,
  count(proposal.id) filter (where proposal.domain = 'finance')::integer as finance_proposal_count,
  count(proposal.id) filter (where proposal.domain = 'cockpit')::integer as cockpit_proposal_count,
  count(proposal.id) filter (where proposal.domain = 'task_deadline')::integer as task_proposal_count,
  count(proposal.id) filter (where proposal.state = 'blocked')::integer as blocked_proposal_count,
  bool_or(proposal.state in ('stale','blocked','queued')) as has_pending_downstream_review
from public.governance_change_propagations propagation
left join public.governance_downstream_proposals proposal
  on proposal.workspace_id = propagation.workspace_id
 and proposal.propagation_id = propagation.id
group by propagation.id;

alter table public.governance_change_propagations enable row level security;
alter table public.governance_downstream_proposals enable row level security;

drop policy if exists "governance change propagations read workspace members" on public.governance_change_propagations;
create policy "governance change propagations read workspace members"
  on public.governance_change_propagations for select to authenticated
  using ((select public.is_workspace_member(workspace_id)));
drop policy if exists "governance change propagations no direct insert" on public.governance_change_propagations;
create policy "governance change propagations no direct insert"
  on public.governance_change_propagations for insert to authenticated
  with check (false);
drop policy if exists "governance change propagations no direct update" on public.governance_change_propagations;
create policy "governance change propagations no direct update"
  on public.governance_change_propagations for update to authenticated
  using (false) with check (false);
drop policy if exists "governance change propagations no direct delete" on public.governance_change_propagations;
create policy "governance change propagations no direct delete"
  on public.governance_change_propagations for delete to authenticated
  using (false);

drop policy if exists "governance downstream proposals read workspace members" on public.governance_downstream_proposals;
create policy "governance downstream proposals read workspace members"
  on public.governance_downstream_proposals for select to authenticated
  using ((select public.is_workspace_member(workspace_id)));
drop policy if exists "governance downstream proposals no direct insert" on public.governance_downstream_proposals;
create policy "governance downstream proposals no direct insert"
  on public.governance_downstream_proposals for insert to authenticated
  with check (false);
drop policy if exists "governance downstream proposals no direct update" on public.governance_downstream_proposals;
create policy "governance downstream proposals no direct update"
  on public.governance_downstream_proposals for update to authenticated
  using (false) with check (false);
drop policy if exists "governance downstream proposals no direct delete" on public.governance_downstream_proposals;
create policy "governance downstream proposals no direct delete"
  on public.governance_downstream_proposals for delete to authenticated
  using (false);

grant select on public.governance_change_propagations to authenticated;
grant select on public.governance_downstream_proposals to authenticated;
grant select on public.governance_change_propagation_projection to authenticated;
revoke insert, update, delete on public.governance_change_propagations from authenticated;
revoke insert, update, delete on public.governance_downstream_proposals from authenticated;

revoke all on function public.governance_change_hash(jsonb) from public, anon, authenticated;
revoke all on function public.governance_impact_domains(text, jsonb, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.governance_materiality(text, jsonb, text, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.governance_proposal_target_field(text, text) from public, anon, authenticated;
revoke all on function public.propagate_accepted_governance_change(uuid, jsonb, text) from public, anon;
grant execute on function public.propagate_accepted_governance_change(uuid, jsonb, text) to authenticated;

-- Specification 011 Slice 5: controlled ContractIQ downstream propagation.
-- ContractIQ records accepted source-linked proposals and creates owner-scoped
-- downstream proposal/status records. It does not own underwriting math,
-- strategy scoring, deadline arithmetic, Deal/Property fact authority, reports,
-- OfferIQ sending, or legal conclusions.

create extension if not exists pgcrypto;

create table if not exists public.contract_change_propagations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid,
  contract_id uuid not null,
  contract_version integer not null,
  contract_term_id uuid not null,
  contract_term_version integer not null,
  contract_finding_id uuid,
  contract_finding_version integer,
  accepted_proposal_id uuid not null,
  accepted_proposal_version integer not null,
  source_evidence_id uuid not null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  verification_state text not null,
  perspective text not null,
  proposal_type text not null,
  target_domain text not null check (target_domain in ('deal_fact','property_fact','finance','underwriting_input','strategy_requirement','governance_reference','task_deadline','cockpit_attention','reporting_candidate','offer_candidate','none')),
  normalized_value jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_value) = 'object'),
  previous_canonical_value jsonb not null default '{}'::jsonb check (jsonb_typeof(previous_canonical_value) = 'object'),
  previous_canonical_version integer,
  materiality text not null check (materiality in ('immaterial','informational','material','critical','uncertain','expired')),
  effective_at timestamptz,
  expires_at timestamptz,
  triggering_event_id uuid,
  correlation_id uuid not null default gen_random_uuid(),
  idempotency_key text not null,
  propagation_contract_version text not null default 'contractiq-change-propagation-v1',
  propagation_status text not null default 'queued' check (propagation_status in ('queued','partial','completed','failed','blocked','retrying','stale','superseded')),
  affected_domains jsonb not null default '[]'::jsonb check (jsonb_typeof(affected_domains) = 'array'),
  underwriting_status text not null default 'not_affected',
  strategy_status text not null default 'not_affected',
  finance_status text not null default 'not_affected',
  deadline_task_status text not null default 'not_affected',
  cockpit_status text not null default 'not_affected',
  timeline_status text not null default 'queued',
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  failures jsonb not null default '[]'::jsonb check (jsonb_typeof(failures) = 'array'),
  retry_count integer not null default 0 check (retry_count >= 0),
  prior_valid_references jsonb not null default '[]'::jsonb check (jsonb_typeof(prior_valid_references) = 'array'),
  request_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(request_payload) = 'object'),
  result_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(result_payload) = 'object'),
  version_graph jsonb not null default '{}'::jsonb check (jsonb_typeof(version_graph) = 'object'),
  deterministic_request_hash text not null,
  generated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_change_propagations_deal_fk foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contract_change_propagations_property_fk foreign key (workspace_id, property_id) references public.properties(workspace_id, id),
  constraint contract_change_propagations_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_change_propagations_term_fk foreign key (workspace_id, contract_term_id) references public.contract_terms(workspace_id, id),
  constraint contract_change_propagations_finding_fk foreign key (workspace_id, contract_finding_id) references public.contract_findings(workspace_id, id),
  constraint contract_change_propagations_proposal_fk foreign key (workspace_id, accepted_proposal_id) references public.contract_change_proposals(workspace_id, id),
  constraint contract_change_propagations_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  constraint contract_change_propagations_finding_version_pair check ((contract_finding_id is null and contract_finding_version is null) or (contract_finding_id is not null and contract_finding_version is not null)),
  constraint contract_change_propagations_no_raw_document_text check (request_payload::text !~* '(rawDocumentText|fullText|documentText|ocrText|fileContents|suggestedLanguage|sourceQuote)'),
  constraint contract_change_propagations_expiry_after_effective check (expires_at is null or effective_at is null or expires_at >= effective_at),
  unique (workspace_id, id),
  unique (workspace_id, idempotency_key),
  unique (workspace_id, accepted_proposal_id, accepted_proposal_version, contract_term_version)
);

create table if not exists public.contract_downstream_change_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null,
  property_id uuid,
  propagation_id uuid not null,
  contract_id uuid not null,
  contract_term_id uuid not null,
  contract_finding_id uuid,
  accepted_proposal_id uuid not null,
  target_domain text not null check (target_domain in ('deal_fact','property_fact','finance','underwriting_input','strategy_requirement','governance_reference','task_deadline','cockpit_attention','reporting_candidate','offer_candidate','none')),
  target_canonical_type text not null,
  target_field text not null,
  target_canonical_id uuid,
  previous_target_version integer,
  new_target_version integer,
  proposal_key text not null,
  propagation_action text not null check (propagation_action in ('propose_update','mark_stale','reconcile_deadline','refresh_projection','link_reference','no_action')),
  requires_owner_command boolean not null default true,
  state text not null default 'queued' check (state in ('queued','proposed','stale','completed','failed','failed_with_prior_valid','blocked','superseded')),
  normalized_value jsonb not null default '{}'::jsonb check (jsonb_typeof(normalized_value) = 'object'),
  source_evidence_id uuid not null,
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  explanation text not null,
  failure jsonb not null default '{}'::jsonb check (jsonb_typeof(failure) = 'object'),
  prior_valid_reference text,
  idempotency_key text not null,
  completed_at timestamptz,
  stale_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_downstream_proposals_deal_fk foreign key (workspace_id, deal_id) references public.brix_deals(workspace_id, id) on delete cascade,
  constraint contract_downstream_proposals_property_fk foreign key (workspace_id, property_id) references public.properties(workspace_id, id),
  constraint contract_downstream_proposals_propagation_fk foreign key (workspace_id, propagation_id) references public.contract_change_propagations(workspace_id, id) on delete cascade,
  constraint contract_downstream_proposals_contract_fk foreign key (workspace_id, contract_id) references public.contracts(workspace_id, id) on delete cascade,
  constraint contract_downstream_proposals_term_fk foreign key (workspace_id, contract_term_id) references public.contract_terms(workspace_id, id),
  constraint contract_downstream_proposals_finding_fk foreign key (workspace_id, contract_finding_id) references public.contract_findings(workspace_id, id),
  constraint contract_downstream_proposals_accepted_proposal_fk foreign key (workspace_id, accepted_proposal_id) references public.contract_change_proposals(workspace_id, id),
  constraint contract_downstream_proposals_source_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id),
  unique (workspace_id, id),
  unique (workspace_id, proposal_key)
);

create index if not exists idx_contract_change_propagations_deal on public.contract_change_propagations(workspace_id, deal_id, generated_at desc);
create index if not exists idx_contract_change_propagations_property on public.contract_change_propagations(workspace_id, property_id, generated_at desc) where property_id is not null;
create index if not exists idx_contract_change_propagations_contract on public.contract_change_propagations(workspace_id, contract_id, generated_at desc);
create index if not exists idx_contract_change_propagations_term on public.contract_change_propagations(workspace_id, contract_term_id, contract_term_version);
create index if not exists idx_contract_change_propagations_finding on public.contract_change_propagations(workspace_id, contract_finding_id, contract_finding_version) where contract_finding_id is not null;
create index if not exists idx_contract_change_propagations_proposal on public.contract_change_propagations(workspace_id, accepted_proposal_id, accepted_proposal_version);
create index if not exists idx_contract_change_propagations_source_evidence on public.contract_change_propagations(workspace_id, source_evidence_id);
create index if not exists idx_contract_change_propagations_triggering_event on public.contract_change_propagations(workspace_id, triggering_event_id) where triggering_event_id is not null;
create index if not exists idx_contract_change_propagations_created_by on public.contract_change_propagations(created_by) where created_by is not null;
create index if not exists idx_contract_change_propagations_updated_by on public.contract_change_propagations(updated_by) where updated_by is not null;
create index if not exists idx_contract_change_propagations_status on public.contract_change_propagations(workspace_id, propagation_status, generated_at desc);
create index if not exists idx_contract_change_propagations_target_domain on public.contract_change_propagations(target_domain);

create index if not exists idx_contract_downstream_change_proposals_propagation on public.contract_downstream_change_proposals(workspace_id, propagation_id);
create index if not exists idx_contract_downstream_change_proposals_deal on public.contract_downstream_change_proposals(workspace_id, deal_id, target_domain);
create index if not exists idx_contract_downstream_change_proposals_contract on public.contract_downstream_change_proposals(workspace_id, contract_id);
create index if not exists idx_contract_downstream_change_proposals_term on public.contract_downstream_change_proposals(workspace_id, contract_term_id);
create index if not exists idx_contract_downstream_change_proposals_finding on public.contract_downstream_change_proposals(workspace_id, contract_finding_id) where contract_finding_id is not null;
create index if not exists idx_contract_downstream_change_proposals_accepted_proposal on public.contract_downstream_change_proposals(workspace_id, accepted_proposal_id);
create index if not exists idx_contract_downstream_change_proposals_source_evidence on public.contract_downstream_change_proposals(workspace_id, source_evidence_id);
create index if not exists idx_contract_downstream_change_proposals_target on public.contract_downstream_change_proposals(workspace_id, target_domain, state);
create index if not exists idx_contract_downstream_change_proposals_created_by on public.contract_downstream_change_proposals(created_by) where created_by is not null;
create index if not exists idx_contract_downstream_change_proposals_updated_by on public.contract_downstream_change_proposals(updated_by) where updated_by is not null;

drop trigger if exists touch_contract_change_propagations on public.contract_change_propagations;
create trigger touch_contract_change_propagations before update on public.contract_change_propagations
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_contract_downstream_change_proposals on public.contract_downstream_change_proposals;
create trigger touch_contract_downstream_change_proposals before update on public.contract_downstream_change_proposals
for each row execute function public.touch_versioned_record();

create or replace view public.contract_change_propagation_projection
with (security_invoker = true)
as
select
  propagation.id as contract_change_propagation_id,
  propagation.version as propagation_version,
  propagation.workspace_id,
  propagation.deal_id,
  propagation.property_id,
  propagation.contract_id,
  propagation.contract_version,
  propagation.contract_term_id,
  propagation.contract_term_version,
  propagation.contract_finding_id,
  propagation.contract_finding_version,
  propagation.accepted_proposal_id,
  propagation.accepted_proposal_version,
  propagation.source_evidence_id,
  propagation.source_anchor,
  propagation.verification_state,
  propagation.perspective,
  propagation.proposal_type,
  propagation.target_domain,
  propagation.materiality,
  propagation.propagation_status,
  propagation.affected_domains,
  propagation.underwriting_status,
  propagation.strategy_status,
  propagation.finance_status,
  propagation.deadline_task_status,
  propagation.cockpit_status,
  propagation.timeline_status,
  propagation.retry_count,
  propagation.prior_valid_references,
  propagation.version_graph,
  propagation.deterministic_request_hash,
  count(downstream.id)::integer as downstream_proposal_count,
  count(downstream.id) filter (where downstream.state in ('failed','failed_with_prior_valid','blocked'))::integer as failed_downstream_count,
  propagation.generated_at,
  propagation.updated_at,
  now() as loaded_at
from public.contract_change_propagations propagation
left join public.contract_downstream_change_proposals downstream
  on downstream.workspace_id = propagation.workspace_id
 and downstream.propagation_id = propagation.id
group by propagation.id;

alter table public.contract_change_propagations enable row level security;
alter table public.contract_downstream_change_proposals enable row level security;

drop policy if exists "contract change propagations read workspace members" on public.contract_change_propagations;
create policy "contract change propagations read workspace members"
  on public.contract_change_propagations for select to authenticated
  using ((select public.is_workspace_member(workspace_id)));
drop policy if exists "contract change propagations no direct insert" on public.contract_change_propagations;
create policy "contract change propagations no direct insert" on public.contract_change_propagations for insert to authenticated with check (false);
drop policy if exists "contract change propagations no direct update" on public.contract_change_propagations;
create policy "contract change propagations no direct update" on public.contract_change_propagations for update to authenticated using (false) with check (false);
drop policy if exists "contract change propagations no direct delete" on public.contract_change_propagations;
create policy "contract change propagations no direct delete" on public.contract_change_propagations for delete to authenticated using (false);

drop policy if exists "contract downstream change proposals read workspace members" on public.contract_downstream_change_proposals;
create policy "contract downstream change proposals read workspace members"
  on public.contract_downstream_change_proposals for select to authenticated
  using ((select public.is_workspace_member(workspace_id)));
drop policy if exists "contract downstream change proposals no direct insert" on public.contract_downstream_change_proposals;
create policy "contract downstream change proposals no direct insert" on public.contract_downstream_change_proposals for insert to authenticated with check (false);
drop policy if exists "contract downstream change proposals no direct update" on public.contract_downstream_change_proposals;
create policy "contract downstream change proposals no direct update" on public.contract_downstream_change_proposals for update to authenticated using (false) with check (false);
drop policy if exists "contract downstream change proposals no direct delete" on public.contract_downstream_change_proposals;
create policy "contract downstream change proposals no direct delete" on public.contract_downstream_change_proposals for delete to authenticated using (false);

create or replace function public.propagate_accepted_contract_change(target_contract_change_proposal_id uuid, propagation_input jsonb, expected_contract_version integer, idempotency_key text)
returns table (
  contract_change_propagation_id uuid,
  workspace_id uuid,
  contract_id uuid,
  accepted_proposal_id uuid,
  target_domain text,
  propagation_status text,
  downstream_proposal_count integer,
  deterministic_request_hash text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(propagation_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  target_term public.contract_terms%rowtype;
  target_finding public.contract_findings%rowtype;
  accepted_proposal public.contract_change_proposals%rowtype;
  command public.contract_command_requests%rowtype;
  existing public.contract_change_propagations%rowtype;
  inserted_propagation public.contract_change_propagations%rowtype;
  target_domain_value text;
  target_field text;
  canonical_type text;
  affected jsonb := '[]'::jsonb;
  material_state text;
  request_hash text;
  proposal_total integer := 0;
  proposal_domain text;
begin
  if current_user_id is null then
    raise exception 'Authentication required to propagate ContractIQ changes.' using errcode = '42501';
  end if;
  if jsonb_typeof(safe_input) <> 'object' then
    raise exception 'ContractIQ propagation input must be an object.' using errcode = '22023';
  end if;
  if safe_input::text ~* '(rawDocumentText|fullText|documentText|ocrText|fileContents|suggestedLanguage|sourceQuote)' then
    raise exception 'ContractIQ propagation input may not copy raw document text.' using errcode = '22023';
  end if;

  select * into accepted_proposal
  from public.contract_change_proposals proposal
  where proposal.id = target_contract_change_proposal_id
    and proposal.archived_at is null
  for update;
  if accepted_proposal.id is null then raise exception 'ContractIQ accepted proposal not found.' using errcode = 'P0002'; end if;

  target_contract := public.authorized_contract(accepted_proposal.contract_id);
  if expected_contract_version is not null and target_contract.version <> expected_contract_version then
    raise exception 'ContractIQ contract changed before propagation could be accepted.' using errcode = '40001';
  end if;
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then
    raise exception 'You do not have permission to propagate ContractIQ changes.' using errcode = '42501';
  end if;
  if accepted_proposal.status <> 'accepted' then
    raise exception 'ContractIQ proposal must be explicitly accepted before propagation.' using errcode = '23514';
  end if;

  select * into target_term
  from public.contract_terms term
  where term.workspace_id = target_contract.workspace_id
    and term.id = accepted_proposal.contract_term_id
    and term.archived_at is null
  for update;
  if target_term.id is null then raise exception 'ContractIQ propagation requires an accepted source term.' using errcode = '23514'; end if;
  if target_term.proposal_state <> 'accepted' then raise exception 'ContractIQ source term must be accepted before downstream propagation.' using errcode = '23514'; end if;
  if target_term.verification_state not in ('source_backed','verified','professional_verified') then raise exception 'ContractIQ source term must be source-backed or verified before propagation.' using errcode = '23514'; end if;
  if target_term.materiality in ('immaterial','informational','unknown') then raise exception 'ContractIQ source term is not material enough for downstream propagation.' using errcode = '23514'; end if;
  if target_term.superseded_by_term_id is not null then raise exception 'Superseded ContractIQ terms cannot propagate downstream.' using errcode = '23514'; end if;
  if coalesce(target_term.source_evidence_id, accepted_proposal.source_evidence_id) is null then
    raise exception 'ContractIQ propagation requires source Evidence.' using errcode = '23514';
  end if;

  if accepted_proposal.contract_finding_id is not null then
    select * into target_finding
    from public.contract_findings finding
    where finding.workspace_id = target_contract.workspace_id
      and finding.id = accepted_proposal.contract_finding_id
      and finding.archived_at is null
    for update;
    if target_finding.id is null then raise exception 'ContractIQ linked finding is not available.' using errcode = 'P0002'; end if;
    if target_finding.proposal_state in ('rejected','disputed','superseded','expired') then
      raise exception 'Rejected, disputed, superseded, or expired ContractIQ findings cannot propagate downstream.' using errcode = '23514';
    end if;
    if target_finding.verification_state = 'conflicted' then raise exception 'Conflicted ContractIQ findings cannot propagate downstream.' using errcode = '23514'; end if;
  end if;

  command := public.ensure_contract_command(
    target_contract.workspace_id,
    target_contract.deal_id,
    target_contract.property_id,
    target_contract.id,
    'propagate_accepted_contract_change',
    idempotency_key,
    safe_input || jsonb_build_object('targetContractChangeProposalId', target_contract_change_proposal_id)
  );

  select * into existing
  from public.contract_change_propagations propagation
  where propagation.workspace_id = target_contract.workspace_id
    and propagation.idempotency_key = command.idempotency_key;
  if existing.id is not null then
    contract_change_propagation_id := existing.id;
    workspace_id := existing.workspace_id;
    contract_id := existing.contract_id;
    accepted_proposal_id := existing.accepted_proposal_id;
    target_domain := existing.target_domain;
    propagation_status := existing.propagation_status;
    downstream_proposal_count := (
      select count(*)::integer from public.contract_downstream_change_proposals proposal
      where proposal.workspace_id = existing.workspace_id and proposal.propagation_id = existing.id
    );
    deterministic_request_hash := existing.deterministic_request_hash;
    return next;
    return;
  end if;

  target_domain_value := coalesce(nullif(safe_input ->> 'targetDomain', ''), case
    when target_term.term_category = 'financing' or target_term.term_type ~* '(financing|loan|rate|lender|mortgage|commitment)' then 'finance'
    when target_term.term_type ~* '(closing|possession|inspection|appraisal|attorney|title|survey|deadline|contingency)' then 'task_deadline'
    when target_term.term_type ~* '(price|purchase|credit|concession|repair|holdback|escrow|earnest|deposit)' then 'underwriting_input'
    when target_term.term_category = 'assignment_transfer' or target_term.term_type ~* '(assignment|affiliate|nominee|entity|consent|default|remedy|specific_performance)' then 'strategy_requirement'
    when target_term.term_category = 'identity_property' or target_term.term_type ~* '(address|parcel|legal_description|property)' then 'property_fact'
    when target_term.term_type ~* '(governance|hoa|association|condo|rofr)' or coalesce(target_finding.finding_category, '') = 'governance' then 'governance_reference'
    else 'cockpit_attention'
  end);

  if target_domain_value not in ('deal_fact','property_fact','finance','underwriting_input','strategy_requirement','governance_reference','task_deadline','cockpit_attention','reporting_candidate','offer_candidate','none') then
    raise exception 'Unsupported ContractIQ propagation target domain.' using errcode = '22023';
  end if;

  material_state := case when target_term.materiality = 'critical' then 'critical' else 'material' end;
  target_field := case
    when target_term.term_type ~* 'price' then 'purchase_price'
    when target_term.term_type ~* '(seller_credit|credit|concession)' then 'seller_credit'
    when target_term.term_type ~* '(repair|holdback|escrow)' then 'repair_credit_holdback'
    when target_term.term_type ~* 'closing' then 'closing_date'
    when target_term.term_type ~* 'possession' then 'possession_date'
    when target_term.term_type ~* '(earnest|deposit)' then 'earnest_money'
    when target_term.term_type ~* 'contingenc' then 'contingency'
    when target_term.term_type ~* '(rate|loan|financing|mortgage|lender)' then 'financing_terms'
    when target_term.term_type ~* '(assignment|affiliate|nominee|entity|consent)' then 'assignment_entity_restriction'
    when target_term.term_type ~* '(governance|hoa|association|condo)' then 'governance_cross_reference'
    when target_term.term_type ~* '(address|parcel|legal_description|property)' then 'property_identity'
    when target_term.term_type ~* '(specific_performance|remedy|default)' then 'professional_review'
    else 'contract_change'
  end;
  canonical_type := case target_domain_value
    when 'deal_fact' then 'deal_fact'
    when 'property_fact' then 'property_fact'
    when 'finance' then 'financing_structure'
    when 'underwriting_input' then 'underwriting_input'
    when 'strategy_requirement' then 'strategy_requirement'
    when 'governance_reference' then 'governance_record'
    when 'task_deadline' then 'deadline'
    when 'cockpit_attention' then 'decision_cockpit_projection'
    when 'reporting_candidate' then 'report_candidate'
    when 'offer_candidate' then 'offer_candidate'
    else 'contract_change'
  end;

  affected := (select coalesce(jsonb_agg(domain order by domain_order), '[]'::jsonb)
    from (
      select domain, min(domain_order) as domain_order
      from (
        select target_domain_value as domain, array_position(array['deal_fact','property_fact','finance','underwriting_input','strategy_requirement','governance_reference','task_deadline','cockpit_attention','reporting_candidate','offer_candidate','none'], target_domain_value) as domain_order
        union all select 'underwriting_input', 4 where target_domain_value in ('finance','underwriting_input')
        union all select 'strategy_requirement', 5 where target_domain_value in ('finance','underwriting_input','strategy_requirement','governance_reference')
        union all select 'cockpit_attention', 8 where target_domain_value <> 'none'
      ) ordered_domains
      group by domain
    ) domains);

  request_hash := md5(jsonb_build_object(
    'propagationContractVersion', 'contractiq-change-propagation-v1',
    'workspaceId', target_contract.workspace_id,
    'dealId', target_contract.deal_id,
    'propertyId', target_contract.property_id,
    'contractId', target_contract.id,
    'contractVersion', target_contract.version,
    'contractTermId', target_term.id,
    'contractTermVersion', target_term.version,
    'contractFindingId', target_finding.id,
    'contractFindingVersion', target_finding.version,
    'acceptedProposalId', accepted_proposal.id,
    'acceptedProposalVersion', accepted_proposal.version,
    'sourceEvidenceId', coalesce(target_term.source_evidence_id, accepted_proposal.source_evidence_id),
    'sourceAnchor', target_term.source_anchor,
    'verificationState', target_term.verification_state,
    'perspective', target_contract.perspective,
    'proposalType', accepted_proposal.proposal_type,
    'targetDomain', target_domain_value,
    'normalizedValue', target_term.normalized_value,
    'previousCanonicalValue', coalesce(safe_input -> 'previousCanonicalValue', '{}'::jsonb),
    'previousCanonicalVersion', nullif(safe_input ->> 'previousCanonicalVersion', ''),
    'materiality', material_state,
    'triggeringEventId', safe_input ->> 'triggeringEventId',
    'correlationId', coalesce(nullif(safe_input ->> 'correlationId', ''), command.id::text),
    'requestedBy', current_user_id,
    'idempotencyKey', command.idempotency_key
  )::text);

  insert into public.contract_change_propagations (
    workspace_id, deal_id, property_id, contract_id, contract_version, contract_term_id,
    contract_term_version, contract_finding_id, contract_finding_version, accepted_proposal_id,
    accepted_proposal_version, source_evidence_id, source_anchor, verification_state, perspective,
    proposal_type, target_domain, normalized_value, previous_canonical_value, previous_canonical_version,
    materiality, effective_at, expires_at, triggering_event_id, correlation_id, idempotency_key,
    propagation_status, affected_domains, underwriting_status, strategy_status, finance_status,
    deadline_task_status, cockpit_status, timeline_status, warnings, failures, retry_count,
    prior_valid_references, request_payload, result_payload, version_graph, deterministic_request_hash,
    created_by, updated_by
  )
  values (
    target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, target_contract.version, target_term.id,
    target_term.version, target_finding.id, target_finding.version, accepted_proposal.id,
    accepted_proposal.version, coalesce(target_term.source_evidence_id, accepted_proposal.source_evidence_id), target_term.source_anchor, target_term.verification_state, target_contract.perspective,
    accepted_proposal.proposal_type, target_domain_value, target_term.normalized_value, coalesce(safe_input -> 'previousCanonicalValue', '{}'::jsonb), nullif(safe_input ->> 'previousCanonicalVersion', '')::integer,
    material_state, target_term.effective_date::timestamptz, nullif(safe_input ->> 'expiresAt', '')::timestamptz, nullif(safe_input ->> 'triggeringEventId', '')::uuid, coalesce(nullif(safe_input ->> 'correlationId', '')::uuid, gen_random_uuid()), command.idempotency_key,
    case when coalesce(jsonb_array_length(coalesce(safe_input -> 'failures', '[]'::jsonb)), 0) > 0 then 'partial' else 'queued' end,
    affected,
    case when affected ? 'underwriting_input' then 'stale' else 'not_affected' end,
    case when affected ? 'strategy_requirement' then 'stale' else 'not_affected' end,
    case when affected ? 'finance' then 'stale' else 'not_affected' end,
    case when affected ? 'task_deadline' then 'queued' else 'not_affected' end,
    case when affected ? 'cockpit_attention' then 'stale' else 'not_affected' end,
    'queued',
    case when safe_input ? 'previousCanonicalValue' then '[]'::jsonb else '["PREVIOUS_CANONICAL_VALUE_NOT_AVAILABLE"]'::jsonb end,
    coalesce(safe_input -> 'failures', '[]'::jsonb),
    coalesce(nullif(safe_input ->> 'retryCount', '')::integer, 0),
    coalesce(safe_input -> 'priorValidReferences', '[]'::jsonb),
    safe_input,
    jsonb_build_object('status', case when coalesce(jsonb_array_length(coalesce(safe_input -> 'failures', '[]'::jsonb)), 0) > 0 then 'partial' else 'queued' end, 'affectedDomains', affected),
    jsonb_build_object(
      'graphVersion', 'contractiq-change-version-graph-v1',
      'workspaceId', target_contract.workspace_id,
      'dealId', target_contract.deal_id,
      'propertyId', target_contract.property_id,
      'contractId', target_contract.id,
      'contractVersion', target_contract.version,
      'contractTermId', target_term.id,
      'contractTermVersion', target_term.version,
      'contractFindingId', target_finding.id,
      'contractFindingVersion', target_finding.version,
      'acceptedProposalId', accepted_proposal.id,
      'acceptedProposalVersion', accepted_proposal.version,
      'sourceEvidenceId', coalesce(target_term.source_evidence_id, accepted_proposal.source_evidence_id),
      'triggeringEventId', safe_input ->> 'triggeringEventId',
      'targetProposalKeys', '[]'::jsonb,
      'priorValidReferences', coalesce(safe_input -> 'priorValidReferences', '[]'::jsonb)
    ),
    request_hash,
    current_user_id, current_user_id
  )
  on conflict (workspace_id, accepted_proposal_id, accepted_proposal_version, contract_term_version) do update
    set updated_by = current_user_id,
        updated_at = now()
  returning * into inserted_propagation;

  for proposal_domain in
    select value::text from jsonb_array_elements_text(affected) value
  loop
    insert into public.contract_downstream_change_proposals (
      workspace_id, deal_id, property_id, propagation_id, contract_id, contract_term_id,
      contract_finding_id, accepted_proposal_id, target_domain, target_canonical_type,
      target_field, proposal_key, propagation_action, requires_owner_command, state,
      normalized_value, source_evidence_id, source_anchor, explanation, prior_valid_reference,
      idempotency_key, created_by, updated_by
    )
    values (
      inserted_propagation.workspace_id, inserted_propagation.deal_id, inserted_propagation.property_id, inserted_propagation.id, target_contract.id, target_term.id,
      target_finding.id, accepted_proposal.id, proposal_domain,
      case when proposal_domain = target_domain_value then canonical_type else
        case proposal_domain when 'underwriting_input' then 'underwriting_input' when 'strategy_requirement' then 'strategy_requirement' when 'cockpit_attention' then 'decision_cockpit_projection' else proposal_domain end
      end,
      case when proposal_domain = 'cockpit_attention' then 'contract_change_attention' else target_field end,
      accepted_proposal.id::text || ':v' || accepted_proposal.version::text || ':' || proposal_domain || ':' || case when proposal_domain = 'cockpit_attention' then 'contract_change_attention' else target_field end,
      case when proposal_domain = 'task_deadline' then 'reconcile_deadline' when proposal_domain = 'cockpit_attention' then 'refresh_projection' when proposal_domain = 'governance_reference' then 'link_reference' else 'propose_update' end,
      proposal_domain <> 'cockpit_attention',
      case when proposal_domain in ('underwriting_input','strategy_requirement','finance','cockpit_attention') then 'stale' when proposal_domain = 'task_deadline' then 'queued' else 'proposed' end,
      target_term.normalized_value,
      inserted_propagation.source_evidence_id,
      target_term.source_anchor,
      'Accepted ContractIQ proposal created targeted ' || proposal_domain || ' downstream proposal; owner subsystem remains authoritative.',
      nullif(safe_input ->> 'priorValidReference', ''),
      command.idempotency_key || ':' || proposal_domain || ':' || target_field,
      current_user_id,
      current_user_id
    )
    on conflict (workspace_id, proposal_key) do update
      set state = excluded.state,
          stale_at = case when excluded.state = 'stale' then now() else contract_downstream_change_proposals.stale_at end,
          updated_by = current_user_id,
          updated_at = now();
  end loop;

  select count(*)::integer into proposal_total
  from public.contract_downstream_change_proposals proposal
  where proposal.workspace_id = inserted_propagation.workspace_id
    and proposal.propagation_id = inserted_propagation.id;

  update public.contract_change_propagations propagation
  set version_graph = propagation.version_graph || jsonb_build_object(
        'targetProposalKeys',
        coalesce((
          select jsonb_agg(proposal.proposal_key order by proposal.proposal_key)
          from public.contract_downstream_change_proposals proposal
          where proposal.workspace_id = propagation.workspace_id
            and proposal.propagation_id = propagation.id
        ), '[]'::jsonb)
      ),
      result_payload = propagation.result_payload || jsonb_build_object('downstreamProposalCount', proposal_total),
      updated_by = current_user_id
  where propagation.id = inserted_propagation.id
  returning * into inserted_propagation;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, correlation_id, payload)
  values (
    inserted_propagation.workspace_id,
    inserted_propagation.deal_id,
    inserted_propagation.property_id,
    current_user_id,
    'contract.change_propagation_requested',
    'contract_change_propagation',
    inserted_propagation.id,
    inserted_propagation.version,
    'propagate_accepted_contract_change',
    command.idempotency_key || ':contract.change_propagation_requested',
    inserted_propagation.correlation_id,
    jsonb_build_object(
      'contract_id', inserted_propagation.contract_id,
      'contract_term_id', inserted_propagation.contract_term_id,
      'accepted_proposal_id', inserted_propagation.accepted_proposal_id,
      'target_domain', inserted_propagation.target_domain,
      'affected_domains', inserted_propagation.affected_domains,
      'calculation_authority', 'spec005_underwriting_only',
      'strategy_authority', 'spec006_strategy_only',
      'deadline_authority', 'spec003_deadline_model_and_spec011_slice3_calculation',
      'cockpit_authority', 'spec007_projection_only'
    )
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (
    inserted_propagation.workspace_id,
    inserted_propagation.deal_id,
    inserted_propagation.property_id,
    current_user_id,
    'contract.change_propagation_requested',
    'contract_change_propagations',
    'contract_change_propagation',
    inserted_propagation.id,
    'propagate_accepted_contract_change',
    command.idempotency_key || ':audit',
    jsonb_build_object('target_domain', inserted_propagation.target_domain, 'affected_domains', inserted_propagation.affected_domains, 'downstream_proposal_count', proposal_total),
    jsonb_build_object('downstream_direct_mutation', false, 'accepted_contract_source_preserved', true, 'raw_document_text_copied', false)
  )
  on conflict do nothing;

  update public.contract_command_requests
  set result = jsonb_build_object(
    'contract_change_propagation_id', inserted_propagation.id,
    'downstream_proposal_count', proposal_total,
    'deterministic_request_hash', inserted_propagation.deterministic_request_hash
  )
  where id = command.id;

  contract_change_propagation_id := inserted_propagation.id;
  workspace_id := inserted_propagation.workspace_id;
  contract_id := inserted_propagation.contract_id;
  accepted_proposal_id := inserted_propagation.accepted_proposal_id;
  target_domain := inserted_propagation.target_domain;
  propagation_status := inserted_propagation.propagation_status;
  downstream_proposal_count := proposal_total;
  deterministic_request_hash := inserted_propagation.deterministic_request_hash;
  return next;
end;
$$;

grant select on public.contract_change_propagations to authenticated;
grant select on public.contract_downstream_change_proposals to authenticated;
grant select on public.contract_change_propagation_projection to authenticated;
revoke insert, update, delete on public.contract_change_propagations from authenticated;
revoke insert, update, delete on public.contract_downstream_change_proposals from authenticated;
revoke all on function public.propagate_accepted_contract_change(uuid, jsonb, integer, text) from public, anon, authenticated;
grant execute on function public.propagate_accepted_contract_change(uuid, jsonb, integer, text) to authenticated;

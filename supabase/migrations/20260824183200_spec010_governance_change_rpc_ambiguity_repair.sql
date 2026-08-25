-- Specification 010 Slice 4 repair: recompile propagation RPC with table-column precedence.
-- The original function has OUT parameter names that overlap table columns.

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


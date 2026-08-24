-- Specification 010 Slice 3: GovernanceIQ financial health and restriction intelligence.
-- Deterministic, source-versioned descriptive analysis only. No legal conclusions,
-- no opaque HOA score, and no downstream underwriting/strategy/financing mutation.

create extension if not exists pgcrypto;

insert into public.governance_finding_category_definitions (category_key, label, sort_order)
values
  ('room_rental', 'Room Rental / Co-Living', 489),
  ('owner_occupancy', 'Owner Occupancy', 490),
  ('llc_entity_ownership', 'LLC / Entity Ownership', 491),
  ('commercial_vehicles', 'Commercial Vehicles', 492),
  ('contractors', 'Contractors', 493),
  ('transfer_approval', 'Transfer Approval', 494),
  ('lender_questionnaire', 'Lender Questionnaire', 495),
  ('financing_related_governance_risk', 'Financing-Related Governance Risk', 496)
on conflict (category_key) do update set label = excluded.label, sort_order = excluded.sort_order;

create table if not exists public.governance_financial_analysis_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  governance_record_version integer not null,
  analysis_contract_version text not null default 'governanceiq-financial-analysis-v1',
  input_hash text not null,
  result_hash text not null,
  analysis_state text not null default 'current' check (analysis_state in ('current', 'partial', 'stale', 'failed_with_prior_analysis')),
  completeness_states jsonb not null default '[]'::jsonb check (jsonb_typeof(completeness_states) = 'array'),
  dues_indicator jsonb not null default '{}'::jsonb check (jsonb_typeof(dues_indicator) = 'object'),
  reserve_indicator jsonb not null default '{}'::jsonb check (jsonb_typeof(reserve_indicator) = 'object'),
  delinquency_indicator jsonb not null default '{}'::jsonb check (jsonb_typeof(delinquency_indicator) = 'object'),
  budget_indicator jsonb not null default '{}'::jsonb check (jsonb_typeof(budget_indicator) = 'object'),
  assessment_indicator jsonb not null default '{}'::jsonb check (jsonb_typeof(assessment_indicator) = 'object'),
  association_debt_indicator jsonb not null default '{}'::jsonb check (jsonb_typeof(association_debt_indicator) = 'object'),
  insurance_indicator jsonb not null default '{}'::jsonb check (jsonb_typeof(insurance_indicator) = 'object'),
  source_financial_versions jsonb not null default '[]'::jsonb check (jsonb_typeof(source_financial_versions) = 'array'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  generated_at timestamptz not null default now(),
  stale_at timestamptz,
  prior_valid_result_id uuid references public.governance_financial_analysis_results(id) on delete set null,
  failure_code text,
  failure_message text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_financial_analysis_results_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade
);

create table if not exists public.governance_restriction_intelligence_results (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  governance_record_id uuid not null,
  governance_record_version integer not null,
  source_governance_finding_id uuid not null,
  source_governance_finding_version integer not null,
  source_governance_document_id uuid,
  source_governance_document_version integer,
  source_evidence_id uuid,
  intelligence_contract_version text not null default 'governanceiq-restriction-intelligence-v1',
  input_hash text not null,
  result_hash text not null,
  category text not null,
  subcategory text,
  normalized_restriction text not null,
  applicability text not null default 'unknown' check (applicability in ('deal', 'property', 'unit', 'occupant', 'vehicle', 'project', 'unknown')),
  restriction_state text not null check (restriction_state in ('allowed', 'allowed_with_conditions', 'restricted', 'prohibited', 'approval_required', 'uncertain', 'conflicted', 'unknown', 'not_applicable', 'expired', 'superseded')),
  force_level text not null check (force_level in ('hard', 'advisory', 'ambiguous', 'professional_review_required')),
  conditions jsonb not null default '[]'::jsonb check (jsonb_typeof(conditions) = 'array'),
  exceptions jsonb not null default '[]'::jsonb check (jsonb_typeof(exceptions) = 'array'),
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  confidence integer not null default 50 check (confidence between 0 and 100),
  verification_state text not null references public.governance_verification_state_definitions(state_key),
  conflict_state text not null default 'none' check (conflict_state in ('none', 'potential_conflict', 'unresolved_conflict', 'resolved_conflict', 'superseded_conflict')),
  professional_review_recommended boolean not null default false,
  strategy_compatibility_candidates jsonb not null default '[]'::jsonb check (jsonb_typeof(strategy_compatibility_candidates) = 'array'),
  financing_impact_candidates jsonb not null default '[]'::jsonb check (jsonb_typeof(financing_impact_candidates) = 'array'),
  operational_impact jsonb not null default '[]'::jsonb check (jsonb_typeof(operational_impact) = 'array'),
  explanation_code text not null,
  effective_at timestamptz,
  expires_at timestamptz,
  generated_at timestamptz not null default now(),
  stale_at timestamptz,
  prior_valid_result_id uuid references public.governance_restriction_intelligence_results(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint governance_restriction_intelligence_results_record_fk foreign key (workspace_id, governance_record_id) references public.governance_records(workspace_id, id) on delete cascade,
  constraint governance_restriction_intelligence_results_finding_fk foreign key (workspace_id, source_governance_finding_id) references public.governance_findings(workspace_id, id) on delete restrict,
  constraint governance_restriction_intelligence_results_document_fk foreign key (workspace_id, source_governance_document_id) references public.governance_documents(workspace_id, id) on delete set null,
  constraint governance_restriction_intelligence_results_evidence_fk foreign key (workspace_id, source_evidence_id) references public.evidence_items(workspace_id, id) on delete set null
);

create unique index if not exists idx_governance_financial_analysis_results_workspace_id on public.governance_financial_analysis_results(workspace_id, id);
create unique index if not exists idx_governance_financial_analysis_results_deterministic on public.governance_financial_analysis_results(workspace_id, governance_record_id, input_hash, result_hash) where stale_at is null;
create unique index if not exists idx_governance_financial_analysis_results_deterministic_all on public.governance_financial_analysis_results(workspace_id, governance_record_id, input_hash, result_hash);
create index if not exists idx_governance_financial_analysis_results_record_fk on public.governance_financial_analysis_results(workspace_id, governance_record_id);
create index if not exists idx_governance_financial_analysis_results_prior_fk on public.governance_financial_analysis_results(prior_valid_result_id);
create index if not exists idx_governance_financial_analysis_results_created_by_fk on public.governance_financial_analysis_results(created_by);
create index if not exists idx_governance_financial_analysis_results_updated_by_fk on public.governance_financial_analysis_results(updated_by);

create unique index if not exists idx_governance_restriction_intelligence_results_workspace_id on public.governance_restriction_intelligence_results(workspace_id, id);
create unique index if not exists idx_governance_restriction_intelligence_results_deterministic on public.governance_restriction_intelligence_results(workspace_id, governance_record_id, source_governance_finding_id, source_governance_finding_version, result_hash) where stale_at is null;
create unique index if not exists idx_governance_restriction_intelligence_results_deterministic_all on public.governance_restriction_intelligence_results(workspace_id, governance_record_id, source_governance_finding_id, source_governance_finding_version, result_hash);
create index if not exists idx_governance_restriction_intelligence_results_record_fk on public.governance_restriction_intelligence_results(workspace_id, governance_record_id);
create index if not exists idx_governance_restriction_intelligence_results_finding_fk on public.governance_restriction_intelligence_results(workspace_id, source_governance_finding_id);
create index if not exists idx_governance_restriction_intelligence_results_document_fk on public.governance_restriction_intelligence_results(workspace_id, source_governance_document_id);
create index if not exists idx_governance_restriction_intelligence_results_evidence_fk on public.governance_restriction_intelligence_results(workspace_id, source_evidence_id);
create index if not exists idx_governance_restriction_intelligence_results_verification_state_fk on public.governance_restriction_intelligence_results(verification_state);
create index if not exists idx_governance_restriction_intelligence_results_prior_fk on public.governance_restriction_intelligence_results(prior_valid_result_id);
create index if not exists idx_governance_restriction_intelligence_results_created_by_fk on public.governance_restriction_intelligence_results(created_by);
create index if not exists idx_governance_restriction_intelligence_results_updated_by_fk on public.governance_restriction_intelligence_results(updated_by);

create or replace function public.governance_restriction_state_from_finding(finding public.governance_findings)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized jsonb := coalesce(finding.normalized_value, '{}'::jsonb);
  category text := finding.finding_category;
  has_exception boolean := jsonb_typeof(normalized -> 'exceptions') = 'array' and jsonb_array_length(normalized -> 'exceptions') > 0 or nullif(normalized ->> 'exception', '') is not null;
  has_conditions boolean := jsonb_typeof(normalized -> 'conditions') = 'array' and jsonb_array_length(normalized -> 'conditions') > 0 or normalized ? 'minimumLeaseMonths' or normalized ? 'maximumLeaseDays';
begin
  if finding.acceptance_state = 'expired' then
    return jsonb_build_object('state', 'expired', 'forceLevel', 'advisory', 'explanationCode', 'restriction_expired');
  end if;
  if finding.acceptance_state = 'superseded' then
    return jsonb_build_object('state', 'superseded', 'forceLevel', 'advisory', 'explanationCode', 'restriction_superseded');
  end if;
  if finding.conflict_state = 'unresolved_conflict' or finding.verification_state = 'conflicting' then
    return jsonb_build_object('state', 'conflicted', 'forceLevel', 'professional_review_required', 'explanationCode', 'source_conflict_requires_review');
  end if;
  if category = 'commercial_vehicle' and coalesce((normalized ->> 'pickupIncluded')::boolean, false) is false and coalesce(normalized ->> 'vehicleType', normalized ->> 'requirement', '') ~* 'pickup' then
    return jsonb_build_object('state', 'uncertain', 'forceLevel', 'professional_review_required', 'explanationCode', 'commercial_vehicle_pickup_scope_uncertain');
  end if;
  if category = 'room_rental' and not (normalized ? 'allowed') and not (normalized ? 'prohibited') and not (normalized ? 'approvalRequired') then
    return jsonb_build_object('state', 'uncertain', 'forceLevel', 'professional_review_required', 'explanationCode', 'room_rental_scope_uncertain');
  end if;
  if coalesce((normalized ->> 'allowed')::boolean, true) is false or coalesce((normalized ->> 'prohibited')::boolean, false) is true then
    return jsonb_build_object('state', 'prohibited', 'forceLevel', 'hard', 'explanationCode', case when has_exception then 'prohibited_with_source_exception' else 'source_states_prohibited' end);
  end if;
  if coalesce((normalized ->> 'approvalRequired')::boolean, false) is true or coalesce((normalized ->> 'boardApprovalRequired')::boolean, false) is true then
    return jsonb_build_object('state', 'approval_required', 'forceLevel', 'hard', 'explanationCode', 'source_requires_approval');
  end if;
  if coalesce((normalized ->> 'allowed')::boolean, false) is true and has_conditions then
    return jsonb_build_object('state', 'allowed_with_conditions', 'forceLevel', 'advisory', 'explanationCode', 'allowed_with_source_conditions');
  end if;
  if coalesce((normalized ->> 'allowed')::boolean, false) is true then
    return jsonb_build_object('state', 'allowed', 'forceLevel', 'advisory', 'explanationCode', 'source_states_allowed');
  end if;
  if has_conditions then
    return jsonb_build_object('state', 'restricted', 'forceLevel', 'ambiguous', 'explanationCode', 'source_conditions_without_clear_permission_state');
  end if;
  return jsonb_build_object('state', 'unknown', 'forceLevel', case when finding.professional_review_recommended then 'professional_review_required' else 'ambiguous' end, 'explanationCode', 'restriction_state_not_normalized');
end;
$$;

create or replace function public.run_governance_financial_analysis(target_governance_record_id uuid, analysis_input jsonb, idempotency_key text)
returns table (governance_financial_analysis_result_id uuid, governance_record_id uuid, workspace_id uuid, analysis_state text, result_hash text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(analysis_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
  source_versions jsonb;
  source_refs jsonb;
  completeness jsonb := '[]'::jsonb;
  warnings jsonb := '[]'::jsonb;
  latest_financial public.governance_financials%rowtype;
  previous_financial public.governance_financials%rowtype;
  dues_indicator jsonb;
  reserve_indicator jsonb;
  delinquency_indicator jsonb;
  budget_indicator jsonb;
  assessment_indicator jsonb;
  debt_indicator jsonb;
  insurance_indicator jsonb;
  computed_input_hash text;
  computed_result_hash text;
  prior_valid uuid;
begin
  if current_user_id is null then raise exception 'Authentication required to run GovernanceIQ financial analysis.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to analyze GovernanceIQ financials.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'run_governance_financial_analysis', idempotency_key, safe_input);
  if command.result ? 'governance_financial_analysis_result_id' then
    select id, public.governance_financial_analysis_results.governance_record_id, public.governance_financial_analysis_results.workspace_id, public.governance_financial_analysis_results.analysis_state, public.governance_financial_analysis_results.result_hash
    into governance_financial_analysis_result_id, governance_record_id, workspace_id, analysis_state, result_hash
    from public.governance_financial_analysis_results
    where id = (command.result ->> 'governance_financial_analysis_result_id')::uuid;
    return next;
    return;
  end if;

  select * into latest_financial
  from public.governance_financials financial
  where financial.workspace_id = target_record.workspace_id and financial.governance_record_id = target_record.id and financial.archived_at is null
  order by financial.period_end desc nulls last, financial.period_start desc nulls last, financial.updated_at desc
  limit 1;

  select * into previous_financial
  from public.governance_financials financial
  where financial.workspace_id = target_record.workspace_id and financial.governance_record_id = target_record.id and financial.archived_at is null and financial.id <> latest_financial.id
  order by financial.period_end desc nulls last, financial.period_start desc nulls last, financial.updated_at desc
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object('governanceFinancialId', financial.id, 'governanceFinancialVersion', financial.version) order by financial.period_end, financial.id), '[]'::jsonb),
         coalesce(jsonb_agg(jsonb_build_object('governanceFinancialId', financial.id, 'governanceFinancialVersion', financial.version, 'governanceDocumentId', financial.governance_document_id, 'evidenceId', financial.source_evidence_id, 'sourceRecordId', financial.source_record_id, 'sourceAnchor', financial.source_anchor, 'verificationState', financial.verification_state, 'sourceClassification', financial.source_classification, 'confidence', financial.confidence) order by financial.period_end, financial.id), '[]'::jsonb)
  into source_versions, source_refs
  from public.governance_financials financial
  where financial.workspace_id = target_record.workspace_id and financial.governance_record_id = target_record.id and financial.archived_at is null;

  if latest_financial.id is null then completeness := completeness || '["partial"]'::jsonb; end if;
  if latest_financial.revenue_amount is null or latest_financial.expense_amount is null then completeness := completeness || '["missing_budget"]'::jsonb; end if;
  if latest_financial.reserve_balance is null then completeness := completeness || '["missing_reserve_data"]'::jsonb; end if;
  if latest_financial.delinquency_rate is null and latest_financial.delinquency_amount is null then completeness := completeness || '["missing_delinquency_data"]'::jsonb; end if;
  if exists (select 1 from public.governance_financials f where f.workspace_id = target_record.workspace_id and f.governance_record_id = target_record.id and f.assessment_amount is not null and f.archived_at is null and not (safe_input ? 'assessmentStatus')) then
    completeness := completeness || '["missing_assessment_status"]'::jsonb;
  end if;
  if exists (select 1 from public.governance_financials f where f.workspace_id = target_record.workspace_id and f.governance_record_id = target_record.id and f.archived_at is null and (f.verification_state = 'conflicting' or f.source_classification = 'conflict')) then
    completeness := completeness || '["conflicting_financial_sources"]'::jsonb;
  end if;
  if jsonb_array_length(completeness) = 0 then completeness := '["complete_for_available_analysis"]'::jsonb; end if;

  if latest_financial.reserve_balance is not null and latest_financial.expense_amount is null then
    warnings := warnings || '["Reserve coverage ratio was not calculated because annual expenses are missing."]'::jsonb;
  end if;
  if latest_financial.delinquency_amount is not null and latest_financial.delinquency_rate is null and latest_financial.revenue_amount is null then
    warnings := warnings || '["Delinquency percentage was not calculated because the denominator is missing."]'::jsonb;
  end if;
  if latest_financial.dues_amount is not null and previous_financial.dues_amount is not null and latest_financial.dues_frequency is distinct from previous_financial.dues_frequency then
    warnings := warnings || '["Dues trend was not calculated because periods use incompatible units."]'::jsonb;
  end if;

  dues_indicator := jsonb_build_object(
    'currentAmount', latest_financial.dues_amount,
    'frequency', latest_financial.dues_frequency,
    'annualizedCurrentAmount', case latest_financial.dues_frequency when 'monthly' then latest_financial.dues_amount * 12 when 'quarterly' then latest_financial.dues_amount * 4 when 'semiannual' then latest_financial.dues_amount * 2 when 'annual' then latest_financial.dues_amount else null end,
    'growthPct', case when latest_financial.dues_frequency = previous_financial.dues_frequency and previous_financial.dues_amount > 0 then round((latest_financial.dues_amount - previous_financial.dues_amount) / previous_financial.dues_amount, 6) else null end,
    'trendState', case when latest_financial.dues_frequency = previous_financial.dues_frequency and previous_financial.dues_amount > 0 then 'calculated' when previous_financial.dues_amount is not null and latest_financial.dues_frequency is distinct from previous_financial.dues_frequency then 'incompatible_periods' else 'incomplete' end
  );
  reserve_indicator := jsonb_build_object(
    'reserveBalance', latest_financial.reserve_balance,
    'reserveToAnnualExpenseRatio', case when latest_financial.reserve_balance is not null and latest_financial.expense_amount > 0 then round(latest_financial.reserve_balance / latest_financial.expense_amount, 2) else null end,
    'reserveToKnownProjectCostRatio', case when latest_financial.reserve_balance is not null and latest_financial.planned_project_amount > 0 then round(latest_financial.reserve_balance / latest_financial.planned_project_amount, 2) else null end,
    'reserveChangePct', case when previous_financial.reserve_balance > 0 then round((latest_financial.reserve_balance - previous_financial.reserve_balance) / previous_financial.reserve_balance, 6) else null end,
    'state', case when latest_financial.reserve_balance is null then 'missing_reserve_data' when latest_financial.expense_amount is null then 'missing_denominator' else 'calculated' end
  );
  delinquency_indicator := jsonb_build_object(
    'delinquencyAmount', latest_financial.delinquency_amount,
    'delinquencyRate', coalesce(latest_financial.delinquency_rate, case when latest_financial.delinquency_amount is not null and latest_financial.revenue_amount > 0 then round(latest_financial.delinquency_amount / latest_financial.revenue_amount, 6) else null end),
    'state', case when latest_financial.delinquency_rate is not null or (latest_financial.delinquency_amount is not null and latest_financial.revenue_amount > 0) then 'calculated' when latest_financial.delinquency_amount is null then 'missing_delinquency_data' else 'missing_denominator' end
  );
  budget_indicator := jsonb_build_object(
    'revenueAmount', latest_financial.revenue_amount,
    'expenseAmount', latest_financial.expense_amount,
    'surplusDeficitAmount', case when latest_financial.revenue_amount is not null and latest_financial.expense_amount is not null then latest_financial.revenue_amount - latest_financial.expense_amount else null end,
    'expenseGrowthPct', case when previous_financial.expense_amount > 0 then round((latest_financial.expense_amount - previous_financial.expense_amount) / previous_financial.expense_amount, 6) else null end,
    'state', case when latest_financial.revenue_amount is not null and latest_financial.expense_amount is not null then 'calculated' else 'missing_budget' end
  );
  assessment_indicator := jsonb_build_object(
    'currentAssessmentAmount', latest_financial.assessment_amount,
    'currentAssessmentStatus', coalesce(safe_input ->> 'assessmentStatus', case when latest_financial.assessment_amount is null then null else 'UNKNOWN' end),
    'state', case when latest_financial.assessment_amount is null then 'none_found' when coalesce(safe_input ->> 'assessmentStatus', 'UNKNOWN') = 'PROPOSED' then 'proposed_only' when coalesce(safe_input ->> 'assessmentStatus', 'UNKNOWN') in ('ADOPTED', 'BILLED', 'PAID') then 'adopted_or_billed' else 'missing_assessment_status' end
  );
  debt_indicator := jsonb_build_object('principalAmount', latest_financial.association_debt_amount, 'state', case when latest_financial.association_debt_amount is null then 'not_found' else 'present' end);
  insurance_indicator := jsonb_build_object('insuranceExpenseAmount', latest_financial.insurance_expense_amount, 'deductibleAmount', latest_financial.insurance_deductible_amount, 'state', case when latest_financial.insurance_expense_amount is null and latest_financial.insurance_deductible_amount is null then 'not_found' else 'descriptive_only' end);

  computed_input_hash := encode(extensions.digest((target_record.id::text || target_record.version::text || source_versions::text || safe_input::text), 'sha256'), 'hex');
  computed_result_hash := encode(extensions.digest((computed_input_hash || dues_indicator::text || reserve_indicator::text || delinquency_indicator::text || budget_indicator::text || assessment_indicator::text || debt_indicator::text || insurance_indicator::text || completeness::text), 'sha256'), 'hex');
  select id into prior_valid from public.governance_financial_analysis_results existing where existing.workspace_id = target_record.workspace_id and existing.governance_record_id = target_record.id and existing.analysis_state in ('current', 'partial') and existing.stale_at is null order by existing.generated_at desc limit 1;

  insert into public.governance_financial_analysis_results (
    workspace_id, governance_record_id, governance_record_version, input_hash, result_hash, analysis_state, completeness_states,
    dues_indicator, reserve_indicator, delinquency_indicator, budget_indicator, assessment_indicator, association_debt_indicator,
    insurance_indicator, source_financial_versions, source_refs, warnings, prior_valid_result_id, created_by, updated_by
  )
  values (
    target_record.workspace_id, target_record.id, target_record.version, computed_input_hash, computed_result_hash,
    case when completeness ? 'complete_for_available_analysis' then 'current' else 'partial' end,
    completeness, dues_indicator, reserve_indicator, delinquency_indicator, budget_indicator, assessment_indicator, debt_indicator,
    insurance_indicator, source_versions, source_refs, warnings, prior_valid, current_user_id, current_user_id
  )
  on conflict on constraint governance_financial_analysis_results_deterministic_unique
  do update set updated_at = now(), updated_by = current_user_id
  returning id, public.governance_financial_analysis_results.governance_record_id, public.governance_financial_analysis_results.workspace_id, public.governance_financial_analysis_results.analysis_state, public.governance_financial_analysis_results.result_hash
  into governance_financial_analysis_result_id, governance_record_id, workspace_id, analysis_state, result_hash;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.financial_analysis_completed', 'governance_financial_analysis_result', governance_financial_analysis_result_id, 1, 'run_governance_financial_analysis', command.idempotency_key || ':governance.financial_analysis_completed', jsonb_build_object('governance_record_id', target_record.id, 'result_hash', result_hash))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.financial_analysis_completed', 'governance_financial_analysis_results', 'governance_financial_analysis_result', governance_financial_analysis_result_id, 'run_governance_financial_analysis', command.idempotency_key || ':audit', jsonb_build_object('analysis_state', analysis_state, 'result_hash', result_hash), jsonb_build_object('calculation_boundary', 'governance_descriptive_only'))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('governance_financial_analysis_result_id', governance_financial_analysis_result_id) where id = command.id;
  return next;
end;
$$;

create or replace function public.run_governance_restriction_intelligence(target_governance_record_id uuid, intelligence_input jsonb, idempotency_key text)
returns table (governance_record_id uuid, workspace_id uuid, restriction_result_count integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(intelligence_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
  finding public.governance_findings%rowtype;
  state_payload jsonb;
  computed_input_hash text;
  computed_result_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to run GovernanceIQ restriction intelligence.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  if not public.has_workspace_permission(target_record.workspace_id, 'deals:manage') then raise exception 'You do not have permission to analyze GovernanceIQ restrictions.' using errcode = '42501'; end if;
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'run_governance_restriction_intelligence', idempotency_key, safe_input);
  if command.result ? 'restriction_result_count' then
    governance_record_id := target_record.id;
    workspace_id := target_record.workspace_id;
    restriction_result_count := (command.result ->> 'restriction_result_count')::integer;
    return next;
    return;
  end if;

  restriction_result_count := 0;
  for finding in
    select * from public.governance_findings gf
    where gf.workspace_id = target_record.workspace_id
      and gf.governance_record_id = target_record.id
      and gf.archived_at is null
      and gf.acceptance_state = 'accepted'
      and gf.finding_category in (
        'rental', 'short_term_rental', 'room_rental', 'occupancy', 'owner_occupancy', 'entity_ownership', 'llc_entity_ownership',
        'parking', 'commercial_vehicle', 'pickup_truck', 'trailer', 'rv', 'boat', 'towing', 'pet', 'home_business', 'signage',
        'noise', 'storage', 'architectural_approval', 'renovation', 'contractor_requirement', 'contractors', 'work_hours',
        'materials_colors', 'landscaping', 'fencing', 'solar', 'ev', 'antenna', 'structural_work', 'maintenance', 'transfer',
        'right_of_first_refusal', 'board_approval', 'transfer_approval', 'lender_requirement', 'lender_questionnaire',
        'governance_financing_risk', 'financing_related_governance_risk'
      )
  loop
    state_payload := public.governance_restriction_state_from_finding(finding);
    computed_input_hash := encode(extensions.digest((target_record.id::text || target_record.version::text || finding.id::text || finding.version::text || finding.normalized_value::text), 'sha256'), 'hex');
    computed_result_hash := encode(extensions.digest((computed_input_hash || state_payload::text || finding.source_anchor::text), 'sha256'), 'hex');
    insert into public.governance_restriction_intelligence_results (
      workspace_id, governance_record_id, governance_record_version, source_governance_finding_id, source_governance_finding_version,
      source_governance_document_id, source_evidence_id, input_hash, result_hash, category, subcategory, normalized_restriction,
      applicability, restriction_state, force_level, conditions, exceptions, source_anchor, source_refs, confidence, verification_state,
      conflict_state, professional_review_recommended, strategy_compatibility_candidates, financing_impact_candidates, operational_impact,
      explanation_code, effective_at, expires_at, created_by, updated_by
    )
    values (
      target_record.workspace_id, target_record.id, target_record.version, finding.id, finding.version,
      finding.governance_document_id, finding.source_evidence_id, computed_input_hash, computed_result_hash, finding.finding_category,
      finding.normalized_value ->> 'subcategory', coalesce(finding.normalized_requirement, finding.normalized_value ->> 'requirement', 'source_backed_restriction'),
      case when finding.finding_category in ('parking','commercial_vehicle','pickup_truck','trailer','rv','boat','towing') then 'vehicle'
           when finding.finding_category in ('renovation','architectural_approval','contractor_requirement','contractors','work_hours','materials_colors','landscaping','fencing','solar','ev','antenna','structural_work') then 'project'
           when finding.finding_category in ('rental','short_term_rental','room_rental','occupancy','owner_occupancy') then 'occupant'
           when finding.finding_category in ('transfer','right_of_first_refusal','board_approval','transfer_approval','lender_requirement','lender_questionnaire','governance_financing_risk','financing_related_governance_risk') then 'deal'
           else 'property' end,
      state_payload ->> 'state', state_payload ->> 'forceLevel',
      case when jsonb_typeof(finding.normalized_value -> 'conditions') = 'array' then finding.normalized_value -> 'conditions' else '[]'::jsonb end,
      case when jsonb_typeof(finding.normalized_value -> 'exceptions') = 'array' then finding.normalized_value -> 'exceptions' when finding.normalized_value ? 'exception' then jsonb_build_array(finding.normalized_value ->> 'exception') else '[]'::jsonb end,
      finding.source_anchor,
      jsonb_build_array(jsonb_build_object('governanceFindingId', finding.id, 'governanceFindingVersion', finding.version, 'governanceDocumentId', finding.governance_document_id, 'evidenceId', finding.source_evidence_id, 'sourceAnchor', finding.source_anchor, 'verificationState', finding.verification_state, 'sourceClassification', finding.source_classification, 'confidence', finding.confidence)),
      finding.confidence, finding.verification_state, finding.conflict_state,
      coalesce(finding.professional_review_recommended, false) or (state_payload ->> 'forceLevel') = 'professional_review_required',
      case when finding.finding_category in ('rental','short_term_rental','room_rental','occupancy','owner_occupancy','entity_ownership','llc_entity_ownership') then '["rental_strategy_compatibility"]'::jsonb
           when finding.finding_category in ('renovation','architectural_approval','contractor_requirement','contractors','work_hours','materials_colors','landscaping','fencing','solar','ev','antenna','structural_work') then '["renovation_strategy_compatibility"]'::jsonb
           when finding.finding_category in ('parking','commercial_vehicle','pickup_truck','trailer','rv','boat','towing') then '["vehicle_parking_operational_fit"]'::jsonb
           else '[]'::jsonb end,
      case when finding.finding_category in ('transfer','right_of_first_refusal','board_approval','transfer_approval','lender_requirement','lender_questionnaire','governance_financing_risk','financing_related_governance_risk') then '["financing_or_transfer_review_candidate"]'::jsonb else '[]'::jsonb end,
      case when finding.finding_category in ('parking','commercial_vehicle','pickup_truck','trailer','rv','boat','towing') then '["parking_vehicle_operations"]'::jsonb
           when finding.finding_category in ('renovation','architectural_approval','contractor_requirement','contractors','work_hours') then '["project_execution"]'::jsonb
           else '[]'::jsonb end,
      state_payload ->> 'explanationCode', finding.effective_at, finding.expires_at, current_user_id, current_user_id
    )
    on conflict on constraint governance_restriction_intelligence_results_deterministic_unique
    do update set updated_at = now(), updated_by = current_user_id;
    restriction_result_count := restriction_result_count + 1;
  end loop;

  governance_record_id := target_record.id;
  workspace_id := target_record.workspace_id;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.restriction_analysis_completed', 'governance_record', target_record.id, target_record.version, 'run_governance_restriction_intelligence', command.idempotency_key || ':governance.restriction_analysis_completed', jsonb_build_object('restriction_result_count', restriction_result_count))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.restriction_analysis_completed', 'governance_restriction_intelligence_results', 'governance_record', target_record.id, 'run_governance_restriction_intelligence', command.idempotency_key || ':audit', jsonb_build_object('restriction_result_count', restriction_result_count), jsonb_build_object('downstream_mutation', false))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('restriction_result_count', restriction_result_count) where id = command.id;
  return next;
end;
$$;

create or replace function public.mark_governance_intelligence_stale(target_governance_record_id uuid, stale_input jsonb, idempotency_key text)
returns table (governance_record_id uuid, workspace_id uuid, stale_result_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.governance_records%rowtype;
  safe_input jsonb := public.safe_event_jsonb(coalesce(stale_input, '{}'::jsonb));
  command public.governance_command_requests%rowtype;
  financial_count integer := 0;
  restriction_count integer := 0;
begin
  if current_user_id is null then raise exception 'Authentication required to mark GovernanceIQ intelligence stale.' using errcode = '42501'; end if;
  target_record := public.authorized_governance_record(target_governance_record_id);
  command := public.ensure_governance_command(target_record.workspace_id, target_record.deal_id, target_record.property_id, target_record.id, 'mark_governance_intelligence_stale', idempotency_key, safe_input);
  update public.governance_financial_analysis_results
  set stale_at = now(), analysis_state = 'stale', updated_by = current_user_id
  where public.governance_financial_analysis_results.workspace_id = target_record.workspace_id
    and public.governance_financial_analysis_results.governance_record_id = target_record.id
    and public.governance_financial_analysis_results.stale_at is null;
  get diagnostics financial_count = row_count;
  update public.governance_restriction_intelligence_results
  set stale_at = now(), updated_by = current_user_id
  where public.governance_restriction_intelligence_results.workspace_id = target_record.workspace_id
    and public.governance_restriction_intelligence_results.governance_record_id = target_record.id
    and public.governance_restriction_intelligence_results.stale_at is null;
  get diagnostics restriction_count = row_count;
  governance_record_id := target_record.id;
  workspace_id := target_record.workspace_id;
  stale_result_count := financial_count + restriction_count;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_record.workspace_id, target_record.deal_id, target_record.property_id, current_user_id, 'governance.analysis_stale', 'governance_record', target_record.id, target_record.version, 'mark_governance_intelligence_stale', command.idempotency_key || ':governance.analysis_stale', jsonb_build_object('reason', safe_input ->> 'reason', 'stale_result_count', stale_result_count))
  on conflict do nothing;
  update public.governance_command_requests set result = jsonb_build_object('stale_result_count', stale_result_count) where id = command.id;
  return next;
end;
$$;

create or replace view public.governance_record_projection
with (security_invoker = true)
as
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
    when count(distinct finding.id) filter (where finding.source_evidence_id is not null and finding.archived_at is null) = count(distinct finding.id) filter (where finding.archived_at is null) then 'source_linked'
    else 'partial_sources'
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
    coalesce(max(question.updated_at), record.updated_at),
    coalesce(latest_financial.updated_at, record.updated_at),
    coalesce(restriction_summary.latest_updated_at, record.updated_at)
  ) as updated_at,
  now() as loaded_at,
  count(distinct document.id) filter (where document.classification_state in ('classified_proposed', 'classification_conflict', 'manual_review_required')) as proposed_document_count,
  count(distinct document.id) filter (where document.classification_state = 'classified_verified') as verified_document_count,
  count(distinct hierarchy.id) filter (where hierarchy.hierarchy_state in ('hierarchy_uncertain', 'professional_review_required', 'conflicting') and hierarchy.archived_at is null and hierarchy.stale_at is null) as hierarchy_uncertain_count,
  count(distinct run.id) filter (where run.status in ('queued', 'processing', 'partial')) as active_analysis_run_count,
  count(distinct extraction.id) filter (where extraction.archived_at is null) as extraction_item_count,
  count(distinct extraction.id) filter (where extraction.archived_at is null and extraction.extraction_type = 'missing_document') as missing_document_count,
  count(distinct question.id) filter (where question.archived_at is null and question.status = 'open') as open_question_count,
  latest_financial.analysis_state as financial_analysis_state,
  latest_financial.dues_indicator ->> 'currentAmount' as dues_current_amount,
  latest_financial.dues_indicator ->> 'growthPct' as dues_growth_pct,
  latest_financial.reserve_indicator as reserve_indicator,
  latest_financial.delinquency_indicator as delinquency_indicator,
  latest_financial.budget_indicator as budget_indicator,
  latest_financial.assessment_indicator as assessment_indicator,
  latest_financial.insurance_indicator as insurance_indicator,
  coalesce(restriction_summary.restriction_result_count, 0) as restriction_result_count,
  coalesce(restriction_summary.hard_restriction_count, 0) as hard_restriction_count,
  coalesce(restriction_summary.professional_review_count, 0) as restriction_professional_review_count,
  coalesce(restriction_summary.risk_groups, '[]'::jsonb) as governance_risk_groups,
  latest_financial.completeness_states as financial_completeness_states,
  latest_financial.stale_at as financial_analysis_stale_at
from public.governance_records record
left join public.governance_documents document on document.workspace_id = record.workspace_id and document.governance_record_id = record.id and document.archived_at is null
left join public.governance_findings finding on finding.workspace_id = record.workspace_id and finding.governance_record_id = record.id and finding.archived_at is null
left join public.governance_conflicts conflict on conflict.workspace_id = record.workspace_id and conflict.governance_record_id = record.id and conflict.archived_at is null
left join public.governance_analysis_runs run on run.workspace_id = record.workspace_id and run.governance_record_id = record.id
left join public.governance_hierarchy_candidates hierarchy on hierarchy.workspace_id = record.workspace_id and hierarchy.governance_record_id = record.id and hierarchy.archived_at is null and hierarchy.stale_at is null
left join public.governance_extraction_items extraction on extraction.workspace_id = record.workspace_id and extraction.governance_record_id = record.id and extraction.archived_at is null
left join public.governance_questions question on question.workspace_id = record.workspace_id and question.governance_record_id = record.id and question.archived_at is null
left join lateral (
  select result.*
  from public.governance_financial_analysis_results result
  where result.workspace_id = record.workspace_id and result.governance_record_id = record.id
  order by result.generated_at desc
  limit 1
) latest_financial on true
left join lateral (
  select
    count(*)::integer as restriction_result_count,
    count(*) filter (where result.force_level = 'hard')::integer as hard_restriction_count,
    count(*) filter (where result.professional_review_recommended)::integer as professional_review_count,
    max(result.updated_at) as latest_updated_at,
    coalesce(jsonb_agg(distinct jsonb_build_object(
      'group',
      case when result.category in ('rental','short_term_rental','room_rental','occupancy','owner_occupancy','entity_ownership','llc_entity_ownership') then 'rental'
           when result.category in ('parking','commercial_vehicle','pickup_truck','trailer','rv','boat','towing') then 'parking_vehicle'
           when result.category in ('renovation','architectural_approval','contractor_requirement','contractors','work_hours','materials_colors','landscaping','fencing','solar','ev','antenna','structural_work') then 'renovation'
           when result.category in ('insurance','insurance_expense','deductible') then 'insurance'
           when result.category in ('transfer','right_of_first_refusal','board_approval','transfer_approval','lender_requirement','lender_questionnaire','governance_financing_risk','financing_related_governance_risk') then 'transfer_financing'
           else 'legal_review' end,
      'state',
      case when result.restriction_state = 'prohibited' then 'blocked'
           when result.restriction_state in ('restricted','approval_required') then 'high_attention'
           when result.restriction_state in ('uncertain','conflicted','unknown') then 'uncertain'
           when result.restriction_state = 'allowed_with_conditions' then 'low_attention'
           else 'clear' end
    )), '[]'::jsonb) as risk_groups
  from public.governance_restriction_intelligence_results result
  where result.workspace_id = record.workspace_id and result.governance_record_id = record.id and result.stale_at is null
) restriction_summary on true
group by
  record.id,
  latest_financial.id,
  latest_financial.updated_at,
  latest_financial.analysis_state,
  latest_financial.dues_indicator,
  latest_financial.reserve_indicator,
  latest_financial.delinquency_indicator,
  latest_financial.budget_indicator,
  latest_financial.assessment_indicator,
  latest_financial.insurance_indicator,
  latest_financial.completeness_states,
  latest_financial.stale_at,
  restriction_summary.restriction_result_count,
  restriction_summary.hard_restriction_count,
  restriction_summary.professional_review_count,
  restriction_summary.risk_groups,
  restriction_summary.latest_updated_at;

alter table public.governance_financial_analysis_results enable row level security;
alter table public.governance_restriction_intelligence_results enable row level security;

create policy "governance financial analysis results read workspace members" on public.governance_financial_analysis_results for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance financial analysis results no direct insert" on public.governance_financial_analysis_results for insert to authenticated with check (false);
create policy "governance financial analysis results no direct update" on public.governance_financial_analysis_results for update to authenticated using (false) with check (false);
create policy "governance financial analysis results no direct delete" on public.governance_financial_analysis_results for delete to authenticated using (false);

create policy "governance restriction intelligence results read workspace members" on public.governance_restriction_intelligence_results for select to authenticated using ((select public.is_workspace_member(workspace_id)));
create policy "governance restriction intelligence results no direct insert" on public.governance_restriction_intelligence_results for insert to authenticated with check (false);
create policy "governance restriction intelligence results no direct update" on public.governance_restriction_intelligence_results for update to authenticated using (false) with check (false);
create policy "governance restriction intelligence results no direct delete" on public.governance_restriction_intelligence_results for delete to authenticated using (false);

grant select on public.governance_financial_analysis_results to authenticated;
grant select on public.governance_restriction_intelligence_results to authenticated;
revoke insert, update, delete on public.governance_financial_analysis_results from authenticated;
revoke insert, update, delete on public.governance_restriction_intelligence_results from authenticated;

revoke all on function public.governance_restriction_state_from_finding(public.governance_findings) from public;
revoke all on function public.run_governance_financial_analysis(uuid, jsonb, text) from public;
revoke all on function public.run_governance_restriction_intelligence(uuid, jsonb, text) from public;
revoke all on function public.mark_governance_intelligence_stale(uuid, jsonb, text) from public;
revoke execute on function public.governance_restriction_state_from_finding(public.governance_findings) from public, anon, authenticated;
revoke execute on function public.run_governance_financial_analysis(uuid, jsonb, text) from public, anon;
revoke execute on function public.run_governance_restriction_intelligence(uuid, jsonb, text) from public, anon;
revoke execute on function public.mark_governance_intelligence_stale(uuid, jsonb, text) from public, anon;
grant execute on function public.run_governance_financial_analysis(uuid, jsonb, text) to authenticated;
grant execute on function public.run_governance_restriction_intelligence(uuid, jsonb, text) to authenticated;
grant execute on function public.mark_governance_intelligence_stale(uuid, jsonb, text) to authenticated;

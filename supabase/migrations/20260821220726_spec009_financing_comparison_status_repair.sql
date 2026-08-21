-- Specification 009 Slice 4 repair: keep deterministic winner status consistent across RPC return, payload, events, and audit.
create or replace function public.compare_financing_structures(
  target_deal_id uuid,
  target_financing_structure_ids uuid[],
  requested_dimensions text[] default array['feasibility', 'debt_service', 'balloon_exposure', 'conditions', 'covenants', 'complexity']::text[],
  comparison_effective_at timestamptz default now(),
  comparison_mode text default 'current',
  idempotency_key text default null,
  correlation_id uuid default gen_random_uuid()
)
returns table (
  comparison_result_id uuid,
  workspace_id uuid,
  deal_id uuid,
  status text,
  clear_winner_financing_structure_id uuid,
  result_hash text,
  result_payload jsonb,
  stale boolean,
  stale_reasons text[],
  compared_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  target_deal public.brix_deals%rowtype;
  clean_structure_ids uuid[] := array(select distinct unnest(coalesce(target_financing_structure_ids, '{}'::uuid[])) order by 1);
  clean_dimensions text[] := array(select distinct unnest(coalesce(requested_dimensions, '{}'::text[])) order by 1);
  existing_request public.financing_scenario_comparison_requests%rowtype;
  request_hash text;
  winner_id uuid;
  computed_status text;
  payload jsonb;
  source_versions jsonb;
  excluded jsonb;
  missing_inputs text[];
  blocking text[];
  result_hash_value text;
  inserted_result public.financing_scenario_comparison_results%rowtype;
  started_at timestamptz := clock_timestamp();
begin
  if current_user_id is null then raise exception 'Authentication required to compare financing scenarios.' using errcode = '42501'; end if;
  if comparison_mode not in ('current', 'historical') then raise exception 'Unsupported financing comparison mode.' using errcode = '22023'; end if;
  if array_length(clean_structure_ids, 1) < 2 then raise exception 'FinanceIQ comparison requires at least two financing structures.' using errcode = '22023'; end if;
  if not clean_dimensions <@ array['feasibility', 'debt_service', 'cumulative_interest', 'balloon_exposure', 'ltv', 'dscr', 'fees', 'rate_type', 'prepayment', 'recourse', 'interest_only', 'conditions', 'covenants', 'complexity', 'equity_terms']::text[] then
    raise exception 'Unsupported FinanceIQ comparison dimension.' using errcode = '22023';
  end if;

  target_deal := public.authorized_deal_for_read(target_deal_id);

  if exists (
    select 1
    from public.financing_structures structure
    where structure.id = any(clean_structure_ids)
      and (structure.workspace_id <> target_deal.workspace_id or structure.deal_id <> target_deal.id)
  ) then
    raise exception 'FinanceIQ comparison cannot cross workspace or Deal boundaries.' using errcode = '42501';
  end if;
  if (select count(*) from public.financing_structures structure where structure.id = any(clean_structure_ids)) <> array_length(clean_structure_ids, 1) then
    raise exception 'One or more financing structures are not available.' using errcode = 'P0002';
  end if;

  request_hash := public.financeiq_requirement_hash(jsonb_build_object(
    'contractVersion', 'financeiq-scenario-comparison-v1',
    'dealId', target_deal.id,
    'structureIds', clean_structure_ids,
    'dimensions', clean_dimensions,
    'comparisonEffectiveAt', comparison_effective_at,
    'mode', comparison_mode
  ));

  if idempotency_key is not null then
    select * into existing_request
    from public.financing_scenario_comparison_requests request
    where request.workspace_id = target_deal.workspace_id
      and request.idempotency_key = idempotency_key;
    if existing_request.id is not null then
      if existing_request.request_hash <> request_hash then raise exception 'Idempotency key was reused for a different financing comparison request.' using errcode = '40001'; end if;
      return query
      select *
      from public.load_financing_comparison(existing_request.comparison_result_id);
      return;
    end if;
  end if;

  with selected as (
    select
      structure.*,
      coalesce(latest.status, case when structure.status = 'expired' then 'expired' when structure.status = 'superseded' then 'superseded' else 'uncertain' end) as feasibility_status,
      coalesce(latest.feasibility_version, 0) as feasibility_version,
      latest.result_hash as feasibility_result_hash,
      coalesce(latest.unresolved_condition_count, 0) as unresolved_condition_count,
      coalesce(latest.failed_covenant_count, 0) as failed_covenant_count,
      coalesce(latest.uncertain_covenant_count, 0) as uncertain_covenant_count,
      coalesce(latest.stale, false) as feasibility_stale,
      coalesce(schedules.periodic_debt_service, null) as periodic_debt_service,
      coalesce(schedules.total_debt_service, null) as total_debt_service,
      coalesce(schedules.cumulative_interest, null) as cumulative_interest,
      coalesce(schedules.balloon_exposure, 0) as balloon_exposure,
      coalesce(schedules.schedule_count, 0) as schedule_count,
      coalesce(debt.debt_tranche_count, 0) as debt_tranche_count,
      coalesce(equity.equity_tranche_count, 0) as equity_tranche_count,
      coalesce(sources.capital_source_count, 0) as capital_source_count,
      coalesce(debt.unknown_term_count, 0) as unknown_term_count,
      case
        when comparison_mode = 'current' and (structure.status = 'expired' or structure.expires_at <= comparison_effective_at) then 'excluded_expired_structure'
        when comparison_mode = 'current' and structure.status = 'superseded' then 'excluded_superseded_structure'
        when comparison_mode = 'current' and structure.status in ('declined', 'withdrawn') then 'excluded_inactive_structure'
        else null
      end as exclusion_reason
    from public.financing_structures structure
    left join public.financeiq_latest_feasibility_results latest
      on latest.workspace_id = structure.workspace_id
     and latest.financing_structure_id = structure.id
    left join lateral (
      select
        count(*) as schedule_count,
        sum(result.first_periodic_debt_service) filter (where result.status in ('complete', 'complete_with_warnings') and result.debt_tranche_version = tranche.version) as periodic_debt_service,
        sum(result.total_debt_service) filter (where result.status in ('complete', 'complete_with_warnings') and result.debt_tranche_version = tranche.version) as total_debt_service,
        sum(result.total_interest_paid) filter (where result.status in ('complete', 'complete_with_warnings') and result.debt_tranche_version = tranche.version) as cumulative_interest,
        sum(result.total_balloon_paid) filter (where result.status in ('complete', 'complete_with_warnings') and result.debt_tranche_version = tranche.version) as balloon_exposure
      from public.debt_tranches tranche
      left join public.underwriting_latest_debt_schedule_results result
        on result.workspace_id = tranche.workspace_id
       and result.financing_structure_id = tranche.financing_structure_id
       and result.debt_tranche_id = tranche.id
      where tranche.workspace_id = structure.workspace_id
        and tranche.financing_structure_id = structure.id
        and tranche.archived_at is null
    ) schedules on true
    left join lateral (
      select
        count(*) as debt_tranche_count,
        count(*) filter (
          where tranche.rate_type = 'unknown'
             or tranche.prepayment_type = 'unknown'
             or tranche.recourse_type = 'unknown'
             or tranche.principal_amount is null
             or (tranche.rate_type <> 'unknown' and tranche.stated_rate is null)
        ) as unknown_term_count
      from public.debt_tranches tranche
      where tranche.workspace_id = structure.workspace_id
        and tranche.financing_structure_id = structure.id
        and tranche.archived_at is null
    ) debt on true
    left join lateral (
      select count(*) as equity_tranche_count
      from public.equity_tranches tranche
      where tranche.workspace_id = structure.workspace_id
        and tranche.financing_structure_id = structure.id
        and tranche.archived_at is null
    ) equity on true
    left join lateral (
      select count(*) as capital_source_count
      from public.capital_sources source
      where source.workspace_id = structure.workspace_id
        and source.financing_structure_id = structure.id
        and source.archived_at is null
    ) sources on true
    where structure.workspace_id = target_deal.workspace_id
      and structure.deal_id = target_deal.id
      and structure.id = any(clean_structure_ids)
      and structure.archived_at is null
  ),
  ordered as (
    select
      selected.*,
      row_number() over (
        order by
          case when exclusion_reason is null then 0 else 1 end,
          public.financeiq_comparison_feasibility_rank(feasibility_status),
          failed_covenant_count,
          uncertain_covenant_count,
          unresolved_condition_count,
          periodic_debt_service nulls last,
          balloon_exposure,
          name,
          id
      ) as deterministic_order
    from selected
  ),
  eligible as (
    select *
    from ordered
    where exclusion_reason is null
  )
  select
    case
      when (select count(*) from eligible) = 1 and (select count(*) from ordered where exclusion_reason is not null) > 0 then (select id from eligible order by deterministic_order limit 1)
      when (select count(*) from eligible) >= 2 and (
        select public.financeiq_comparison_feasibility_rank(first.feasibility_status) < public.financeiq_comparison_feasibility_rank(second.feasibility_status)
            or first.failed_covenant_count < second.failed_covenant_count
            or (first.unresolved_condition_count < second.unresolved_condition_count and first.periodic_debt_service is not null and second.periodic_debt_service is not null)
        from (select * from eligible order by deterministic_order limit 1) first
        cross join (select * from eligible order by deterministic_order offset 1 limit 1) second
      ) then (select id from eligible order by deterministic_order limit 1)
      else null
    end,
    case
      when (select count(*) from ordered) < 2 then 'insufficient_options'
      when (select count(*) from eligible) = 1 and (select count(*) from ordered where exclusion_reason is not null) > 0 then 'clear_winner'
      when (select count(*) from eligible) < 2 then 'insufficient_options'
      when exists (select 1 from eligible where periodic_debt_service is null and 'debt_service' = any(clean_dimensions)) then 'not_comparable'
      when exists (select 1 from eligible where feasibility_status = 'uncertain') then 'no_clear_winner'
      else 'no_clear_winner'
    end,
    jsonb_build_object(
      'contractVersion', 'financeiq-scenario-comparison-v1',
      'resultVersion', 'financeiq-scenario-comparison-result-v1',
      'comparisonVersion', 'financeiq-scenario-comparison-v1',
      'workspaceId', target_deal.workspace_id,
      'dealId', target_deal.id,
      'comparedAt', now(),
      'comparisonEffectiveAt', comparison_effective_at,
      'dimensionsEvaluated', to_jsonb(clean_dimensions),
      'orderedStructures', coalesce((select jsonb_agg(jsonb_build_object(
        'financingStructureId', id,
        'structureVersion', version,
        'name', name,
        'status', status,
        'isActive', is_active,
        'isWinnerEligible', exclusion_reason is null,
        'exclusionReason', exclusion_reason,
        'feasibilityStatus', feasibility_status,
        'unresolvedConditionCount', unresolved_condition_count,
        'failedCovenantCount', failed_covenant_count,
        'uncertainCovenantCount', uncertain_covenant_count,
        'debtServiceSummary', case when periodic_debt_service is null then null else jsonb_build_object('currency', currency, 'periodicDebtService', periodic_debt_service, 'totalDebtService', total_debt_service, 'cumulativeInterest', cumulative_interest) end,
        'balloonExposure', case when balloon_exposure > 0 then jsonb_build_object('currency', currency, 'maturityBalance', balloon_exposure) else null end,
        'complexity', jsonb_build_object('debtTrancheCount', debt_tranche_count, 'equityTrancheCount', equity_tranche_count, 'capitalSourceCount', capital_source_count, 'unknownTermCount', unknown_term_count),
        'deterministicOrder', deterministic_order,
        'reasonCodes', case when feasibility_stale then jsonb_build_array('stale_feasibility_result') else '[]'::jsonb end
      ) order by deterministic_order) from ordered), '[]'::jsonb),
      'tradeoffs', jsonb_build_array(jsonb_build_object('dimension', 'feasibility', 'state', 'comparable', 'reasonCode', 'feasibility_precedence_applied', 'explanation', 'Hard feasibility states are applied before financing term preferences.')),
      'unsupportedMetrics', jsonb_build_array('ltc', 'debt_yield', 'occupancy'),
      'calculationAuthority', 'spec005_underwriting_only'
    ),
    jsonb_build_object(
      'structures', coalesce((select jsonb_agg(jsonb_build_object('financing_structure_id', id, 'structure_version', version) order by id) from ordered), '[]'::jsonb),
      'feasibility', coalesce((select jsonb_agg(jsonb_build_object('financing_structure_id', id, 'feasibility_version', feasibility_version, 'result_hash', feasibility_result_hash) order by id) from ordered), '[]'::jsonb)
    ),
    coalesce((select jsonb_agg(jsonb_build_object('financingStructureId', id, 'reasonCode', exclusion_reason) order by id) from ordered where exclusion_reason is not null), '[]'::jsonb),
    array(select distinct missing from (
      select 'current_authoritative_debt_schedule'::text as missing
      from selected
      where debt_tranche_count > 0
        and (periodic_debt_service is null or schedule_count < debt_tranche_count)
    ) missing_rows order by missing),
    case when (select count(*) from eligible) = 0 then array['comparison_requires_at_least_one_current_eligible_structure']::text[] else '{}'::text[] end
  into winner_id, computed_status, payload, source_versions, excluded, missing_inputs, blocking;

  if winner_id is not null then
    computed_status := 'clear_winner';
  end if;

  payload := payload
    || jsonb_build_object(
      'status', computed_status,
      'clearWinnerFinancingStructureId', winner_id,
      'excludedStructures', excluded,
      'missingComparisonInputs', to_jsonb(missing_inputs),
      'blockingIssues', to_jsonb(blocking),
      'stale', false,
      'staleReasons', '[]'::jsonb
    );
  result_hash_value := public.financeiq_requirement_hash(payload);

  insert into public.financing_scenario_comparison_results (
    workspace_id, deal_id, comparison_effective_at, comparison_mode, requested_dimensions, financing_structure_ids,
    source_versions, status, clear_winner_financing_structure_id, excluded_structures, missing_comparison_inputs,
    blocking_issues, result_hash, result_payload, correlation_id, execution_duration_ms, created_by
  )
  values (
    target_deal.workspace_id, target_deal.id, comparison_effective_at, comparison_mode, clean_dimensions, clean_structure_ids,
    source_versions, computed_status, winner_id, excluded, missing_inputs,
    blocking, result_hash_value, payload, correlation_id, (extract(epoch from clock_timestamp() - started_at) * 1000)::integer, current_user_id
  )
  returning * into inserted_result;

  if idempotency_key is not null then
    insert into public.financing_scenario_comparison_requests (workspace_id, deal_id, comparison_result_id, idempotency_key, request_hash, result_hash, created_by)
    values (target_deal.workspace_id, target_deal.id, inserted_result.id, idempotency_key, request_hash, result_hash_value, current_user_id);
  end if;

  insert into public.domain_events (workspace_id, deal_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload, correlation_id)
  values (
    target_deal.workspace_id, target_deal.id, current_user_id, 'financing.comparison_created',
    'financing_scenario_comparison_results', inserted_result.id, 1, 'compare_financing_structures',
    coalesce(idempotency_key, inserted_result.id::text) || ':financing.comparison_created',
    jsonb_build_object('comparison_result_id', inserted_result.id, 'result_hash', result_hash_value, 'status', computed_status, 'calculation_authority', 'spec005_underwriting_only'),
    correlation_id
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, metadata)
  values (
    target_deal.workspace_id, target_deal.id, current_user_id, 'financing.comparison_created',
    'financing_scenario_comparison_results', 'financing_scenario_comparison_result', inserted_result.id,
    'compare_financing_structures', coalesce(idempotency_key, inserted_result.id::text) || ':audit',
    jsonb_build_object('comparison_result_id', inserted_result.id, 'status', computed_status, 'result_hash', result_hash_value),
    jsonb_build_object('calculation_authority', 'spec005_underwriting_only', 'source_versions', source_versions)
  )
  on conflict do nothing;

  return query
  select *
  from public.load_financing_comparison(inserted_result.id);
end;
$$;

revoke all on function public.compare_financing_structures(uuid, uuid[], text[], timestamptz, text, text, uuid) from public, anon, authenticated;
grant execute on function public.compare_financing_structures(uuid, uuid[], text[], timestamptz, text, text, uuid) to authenticated;

begin;

do $$
declare
  test_user_id uuid := gen_random_uuid();
  other_user_id uuid := gen_random_uuid();
  test_workspace_id uuid := gen_random_uuid();
  other_workspace_id uuid := gen_random_uuid();
  test_deal_id uuid := gen_random_uuid();
  other_deal_id uuid := gen_random_uuid();
  feasible_structure_id uuid;
  cheaper_failed_structure_id uuid;
  expired_structure_id uuid;
  feasible_debt_tranche_id uuid := gen_random_uuid();
  failed_debt_tranche_id uuid := gen_random_uuid();
  expired_debt_tranche_id uuid := gen_random_uuid();
  comparison_effective_at timestamptz := now();
  comparison_result record;
  comparison_retry record;
  loaded_comparison record;
  stale_comparison record;
  event_count integer;
  audit_count integer;
  direct_write_denied boolean := false;
  cross_workspace_load_denied boolean := false;
  cross_workspace_compare_denied boolean := false;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (test_user_id, 'authenticated', 'authenticated', 'spec009-slice4-smoke@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (other_user_id, 'authenticated', 'authenticated', 'spec009-slice4-smoke-other@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.workspaces (id, name, owner_user_id, status)
  values
    (test_workspace_id, 'Spec 009 Slice 4 Smoke Workspace', test_user_id, 'active'),
    (other_workspace_id, 'Spec 009 Slice 4 Smoke Other Workspace', other_user_id, 'active');

  insert into public.workspace_memberships (workspace_id, user_id, role_id, status, accepted_at)
  values
    (test_workspace_id, test_user_id, 'owner', 'active', now()),
    (other_workspace_id, other_user_id, 'owner', 'active', now());

  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.brix_deals (id, owner_id, workspace_id, address, display_name, strategy_id, strategy_intent, created_by, updated_by)
  values
    (test_deal_id, test_user_id, test_workspace_id, 'Spec 009 Slice 4 Smoke Property', 'Spec 009 Slice 4 Smoke Deal', 'buy_hold_rental', 'buy_hold_rental', test_user_id, test_user_id),
    (other_deal_id, other_user_id, other_workspace_id, 'Spec 009 Slice 4 Other Property', 'Spec 009 Slice 4 Other Deal', 'buy_hold_rental', 'buy_hold_rental', other_user_id, other_user_id);

  select financing_structure_id into feasible_structure_id
  from public.create_financing_structure(
    test_deal_id,
    jsonb_build_object('name', 'Slice 4 feasible senior debt', 'purpose', 'acquisition', 'status', 'quoted', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 95),
    'spec009-slice4-smoke-structure-feasible'
  );

  select financing_structure_id into cheaper_failed_structure_id
  from public.create_financing_structure(
    test_deal_id,
    jsonb_build_object('name', 'Slice 4 cheaper failed debt', 'purpose', 'acquisition', 'status', 'quoted', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 95),
    'spec009-slice4-smoke-structure-failed'
  );

  select financing_structure_id into expired_structure_id
  from public.create_financing_structure(
    test_deal_id,
    jsonb_build_object('name', 'Slice 4 expired attractive debt', 'purpose', 'acquisition', 'status', 'expired', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 95),
    'spec009-slice4-smoke-structure-expired'
  );

  insert into public.debt_tranches (
    id, workspace_id, financing_structure_id, label, principal_amount, rate_type, stated_rate, amortization_months,
    maturity_months, payment_frequency, has_balloon, prepayment_type, recourse_type, status, verification_state,
    source_classification, confidence, created_by, updated_by
  )
  values
    (feasible_debt_tranche_id, test_workspace_id, feasible_structure_id, 'Senior fixed feasible', 750000, 'fixed', 0.0675, 360, 360, 'monthly', false, 'none', 'bad_boy_carveout', 'quoted', 'quoted', 'lender_provided', 95, test_user_id, test_user_id),
    (failed_debt_tranche_id, test_workspace_id, cheaper_failed_structure_id, 'Senior fixed failed', 760000, 'fixed', 0.0525, 360, 360, 'monthly', false, 'none', 'bad_boy_carveout', 'quoted', 'quoted', 'lender_provided', 95, test_user_id, test_user_id),
    (expired_debt_tranche_id, test_workspace_id, expired_structure_id, 'Expired attractive quote', 780000, 'fixed', 0.0450, 360, 360, 'monthly', false, 'none', 'bad_boy_carveout', 'expired', 'quoted', 'lender_provided', 95, test_user_id, test_user_id);

  insert into public.underwriting_debt_schedule_results (
    workspace_id, deal_id, financing_structure_id, financing_structure_version, debt_tranche_id, debt_tranche_version,
    result_version, engine_version, hash_version, schedule_type, status, input_hash, result_hash, input_payload, result_payload,
    annual_interest_rate_used, currency, period_count, first_periodic_debt_service, final_periodic_debt_service,
    total_principal_paid, total_interest_paid, total_balloon_paid, total_debt_service, ending_balance, calculated_by
  )
  values
    (test_workspace_id, test_deal_id, feasible_structure_id, 1, feasible_debt_tranche_id, 1, 'debt-schedule-v1', 'spec005', 'hash-v1', 'fully_amortizing_fixed', 'complete', 'slice4-input-feasible', 'slice4-result-feasible', '{}'::jsonb, '{}'::jsonb, 0.0675, 'USD', 360, 4864.21, 4864.21, 750000, 1001115.60, 0, 1751115.60, 0, test_user_id),
    (test_workspace_id, test_deal_id, cheaper_failed_structure_id, 1, failed_debt_tranche_id, 1, 'debt-schedule-v1', 'spec005', 'hash-v1', 'fully_amortizing_fixed', 'complete', 'slice4-input-failed', 'slice4-result-failed', '{}'::jsonb, '{}'::jsonb, 0.0525, 'USD', 360, 4198.57, 4198.57, 760000, 751485.20, 0, 1511485.20, 0, test_user_id),
    (test_workspace_id, test_deal_id, expired_structure_id, 1, expired_debt_tranche_id, 1, 'debt-schedule-v1', 'spec005', 'hash-v1', 'fully_amortizing_fixed', 'complete', 'slice4-input-expired', 'slice4-result-expired', '{}'::jsonb, '{}'::jsonb, 0.0450, 'USD', 360, 3951.32, 3951.32, 780000, 642475.20, 0, 1422475.20, 0, test_user_id);

  insert into public.financing_feasibility_results (
    workspace_id, deal_id, financing_structure_id, financing_structure_version, status, feasibility_version,
    unresolved_condition_count, failed_covenant_count, uncertain_covenant_count, result_hash, result_payload, evaluated_by
  )
  values
    (test_workspace_id, test_deal_id, feasible_structure_id, 1, 'feasible', 1, 0, 0, 0, 'slice4-feasible-hash', jsonb_build_object('dscr', 1.35, 'ltv', 0.72), test_user_id),
    (test_workspace_id, test_deal_id, cheaper_failed_structure_id, 1, 'not_feasible', 1, 0, 1, 0, 'slice4-failed-hash', jsonb_build_object('dscr', 1.05, 'ltv', 0.81), test_user_id),
    (test_workspace_id, test_deal_id, expired_structure_id, 1, 'feasible', 1, 0, 0, 0, 'slice4-expired-hash', jsonb_build_object('dscr', 1.50, 'ltv', 0.70), test_user_id);

  select * into comparison_result
  from public.compare_financing_structures(
    test_deal_id,
    array[feasible_structure_id, cheaper_failed_structure_id, expired_structure_id],
    array['feasibility', 'debt_service', 'balloon_exposure', 'conditions', 'covenants', 'complexity'],
    comparison_effective_at,
    'current',
    'spec009-slice4-smoke-comparison',
    gen_random_uuid()
  );

  if comparison_result.status <> 'clear_winner' or comparison_result.clear_winner_financing_structure_id <> feasible_structure_id then
    raise exception 'Expected feasible structure to beat lower-payment hard covenant failure and expired quote; got status %, winner %.',
      comparison_result.status, comparison_result.clear_winner_financing_structure_id;
  end if;

  if comparison_result.result_payload ->> 'calculationAuthority' <> 'spec005_underwriting_only' then
    raise exception 'Expected Spec 005 underwriting authority marker.';
  end if;

  if not (comparison_result.result_payload -> 'unsupportedMetrics' ?& array['ltc', 'debt_yield', 'occupancy']) then
    raise exception 'Expected unsupported metrics to remain explicit in comparison payload.';
  end if;

  if jsonb_path_exists(comparison_result.result_payload, '$.orderedStructures[*] ? (@.financingStructureId == $structureId && @.exclusionReason == "excluded_expired_structure")', jsonb_build_object('structureId', expired_structure_id::text)) is not true then
    raise exception 'Expected expired structure to be excluded in current comparison mode.';
  end if;

  select * into comparison_retry
  from public.compare_financing_structures(
    test_deal_id,
    array[feasible_structure_id, cheaper_failed_structure_id, expired_structure_id],
    array['feasibility', 'debt_service', 'balloon_exposure', 'conditions', 'covenants', 'complexity'],
    comparison_effective_at,
    'current',
    'spec009-slice4-smoke-comparison',
    gen_random_uuid()
  );

  if comparison_retry.comparison_result_id <> comparison_result.comparison_result_id
     or comparison_retry.result_hash <> comparison_result.result_hash then
    raise exception 'Expected idempotent comparison retry to reload original result.';
  end if;

  select * into loaded_comparison
  from public.load_financing_comparison(comparison_result.comparison_result_id);

  if loaded_comparison.result_hash <> comparison_result.result_hash or loaded_comparison.stale is true then
    raise exception 'Expected saved comparison to reopen cleanly before source changes.';
  end if;

  select count(*) into event_count
  from public.domain_events
  where workspace_id = test_workspace_id
    and source_command = 'compare_financing_structures'
    and idempotency_key = 'spec009-slice4-smoke-comparison:financing.comparison_created';

  select count(*) into audit_count
  from public.audit_events
  where workspace_id = test_workspace_id
    and source_command = 'compare_financing_structures'
    and idempotency_key = 'spec009-slice4-smoke-comparison:audit';

  if event_count <> 1 or audit_count <> 1 then
    raise exception 'Expected idempotent comparison to write event/audit once; got event %, audit %.', event_count, audit_count;
  end if;

  update public.financing_structures
  set notes = 'Slice 4 smoke stale source version'
  where id = feasible_structure_id;

  select * into stale_comparison
  from public.load_financing_comparison(comparison_result.comparison_result_id);

  if stale_comparison.stale is not true or not ('stale_financing_structure_version' = any(stale_comparison.stale_reasons)) then
    raise exception 'Expected saved comparison reload to report stale structure version.';
  end if;

  begin
    execute 'set local role authenticated';
    insert into public.financing_scenario_comparison_results (
      workspace_id, deal_id, comparison_effective_at, requested_dimensions, financing_structure_ids,
      status, result_hash, result_payload, created_by
    )
    values (
      test_workspace_id, test_deal_id, now(), array['feasibility']::text[], array[feasible_structure_id, cheaper_failed_structure_id],
      'no_clear_winner', 'direct-write-should-fail', '{}'::jsonb, test_user_id
    );
  exception when insufficient_privilege or check_violation then
    direct_write_denied := true;
  end;
  execute 'reset role';

  if not direct_write_denied then
    raise exception 'Expected direct comparison result insert to be denied.';
  end if;

  perform set_config('request.jwt.claim.sub', other_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  begin
    perform *
    from public.load_financing_comparison(comparison_result.comparison_result_id);
  exception when insufficient_privilege then
    cross_workspace_load_denied := true;
  end;

  begin
    perform *
    from public.compare_financing_structures(
      test_deal_id,
      array[feasible_structure_id, cheaper_failed_structure_id],
      array['feasibility'],
      now(),
      'current',
      'spec009-slice4-smoke-cross-workspace',
      gen_random_uuid()
    );
  exception when insufficient_privilege then
    cross_workspace_compare_denied := true;
  end;

  if not cross_workspace_load_denied or not cross_workspace_compare_denied then
    raise exception 'Expected cross-workspace load and compare to be denied.';
  end if;

  raise notice 'SPEC009_SLICE4_STAGING_SMOKE_OK comparison=% winner=% failed=% expired=% hash=%',
    comparison_result.comparison_result_id, feasible_structure_id, cheaper_failed_structure_id, expired_structure_id, comparison_result.result_hash;
end $$;

rollback;

do $$
begin
  if exists (select 1 from auth.users where email in ('spec009-slice4-smoke@example.invalid', 'spec009-slice4-smoke-other@example.invalid')) then
    raise exception 'Rollback residue found in auth.users.';
  end if;

  if exists (select 1 from public.workspaces where name like 'Spec 009 Slice 4 Smoke%') then
    raise exception 'Rollback residue found in workspaces.';
  end if;

  raise notice 'SPEC009_SLICE4_ROLLBACK_RESIDUE_OK';
end $$;

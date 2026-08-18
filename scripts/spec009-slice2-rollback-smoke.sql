begin;

do $$
declare
  smoke_user_id uuid := '00000000-0000-4000-8000-000000000992';
  smoke_workspace_id uuid := gen_random_uuid();
  smoke_deal_id uuid;
  smoke_structure_id uuid;
  smoke_structure_version integer;
  amortizing_tranche_id uuid;
  amortizing_tranche_version integer;
  io_tranche_id uuid;
  io_tranche_version integer;
  balloon_tranche_id uuid;
  balloon_tranche_version integer;
  result_one uuid;
  result_two uuid;
  projection_count integer;
  current_count integer;
  stale_count integer;
  failed_count integer;
  invalid_mutation_blocked boolean := false;
  unauthorized_blocked boolean := false;
begin
  insert into auth.users (
    id,
    aud,
    role,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous,
    email_confirmed_at,
    created_at,
    updated_at
  )
  values (
    smoke_user_id,
    'authenticated',
    'authenticated',
    'spec009-slice2-smoke@example.invalid',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    false,
    now(),
    now(),
    now()
  );

  insert into public.role_permissions (role_id, permission)
  values ('owner', 'underwriting:run')
  on conflict (role_id, permission) do nothing;

  insert into public.workspaces (id, name, owner_user_id)
  values (smoke_workspace_id, 'Spec 009 Slice 2 rollback smoke', smoke_user_id);

  insert into public.workspace_memberships (workspace_id, user_id, role_id, status, accepted_at)
  values (smoke_workspace_id, smoke_user_id, 'owner', 'active', now());

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', smoke_user_id::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', smoke_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  select created.deal_id
  into smoke_deal_id
  from public.create_canonical_deal(
    smoke_workspace_id,
    'spec009-slice2-smoke-deal',
    '{"display_address":"992 Smoke Test Ave","address_line1":"992 Smoke Test Ave","city":"Providence","region":"RI","postal_code":"02903","country":"US"}'::jsonb,
    '{"display_name":"Spec 009 Slice 2 Smoke Deal","deal_type":"acquisition","stage":"underwriting","source":"manual"}'::jsonb
  ) as created;

  select created.financing_structure_id, created.financing_structure_version
  into smoke_structure_id, smoke_structure_version
  from public.create_financing_structure(
    smoke_deal_id,
    '{"name":"Smoke debt stack","purpose":"acquisition","status":"draft","currency":"USD","verificationState":"unverified","sourceClassification":"user_entered_assumption"}'::jsonb,
    'spec009-slice2-smoke-structure'
  ) as created;

  select tranche.debt_tranche_id, tranche.debt_tranche_version
  into amortizing_tranche_id, amortizing_tranche_version
  from public.upsert_debt_tranche(
    smoke_structure_id,
    '{"label":"Senior fixed","principalAmount":300000,"rateType":"fixed","statedRate":0.06,"amortizationMonths":360,"maturityMonths":360,"interestOnlyMonths":0,"paymentFrequency":"monthly","hasBalloon":false,"status":"proposed","verificationState":"unverified","sourceClassification":"user_entered_assumption"}'::jsonb,
    null,
    'spec009-slice2-smoke-tranche-fixed'
  ) as tranche;

  select tranche.debt_tranche_id, tranche.debt_tranche_version
  into io_tranche_id, io_tranche_version
  from public.upsert_debt_tranche(
    smoke_structure_id,
    '{"label":"IO bridge","principalAmount":150000,"rateType":"fixed","statedRate":0.08,"amortizationMonths":240,"maturityMonths":12,"interestOnlyMonths":12,"paymentFrequency":"monthly","hasBalloon":true,"status":"proposed","verificationState":"unverified","sourceClassification":"user_entered_assumption"}'::jsonb,
    null,
    'spec009-slice2-smoke-tranche-io'
  ) as tranche;

  select tranche.debt_tranche_id, tranche.debt_tranche_version
  into balloon_tranche_id, balloon_tranche_version
  from public.upsert_debt_tranche(
    smoke_structure_id,
    '{"label":"Balloon note","principalAmount":250000,"rateType":"fixed","statedRate":0.065,"amortizationMonths":360,"maturityMonths":60,"interestOnlyMonths":0,"paymentFrequency":"monthly","hasBalloon":true,"status":"proposed","verificationState":"unverified","sourceClassification":"user_entered_assumption"}'::jsonb,
    null,
    'spec009-slice2-smoke-tranche-balloon'
  ) as tranche;

  select result.result_id
  into result_one
  from public.create_underwriting_debt_schedule_result(
    smoke_workspace_id,
    smoke_deal_id,
    smoke_structure_id,
    amortizing_tranche_id,
    'spec009-slice2-smoke-schedule-fixed-v1',
    amortizing_tranche_version,
    jsonb_build_object(
      'resultVersion', 'underwriting-debt-schedule-result-v1',
      'engineVersion', 'underwriting-debt-schedule-engine-v1',
      'hashVersion', 'underwriting-debt-schedule-hash-v1',
      'workspaceId', smoke_workspace_id,
      'dealId', smoke_deal_id,
      'financingStructureId', smoke_structure_id,
      'financingStructureVersion', smoke_structure_version,
      'debtTrancheId', amortizing_tranche_id,
      'debtTrancheVersion', amortizing_tranche_version,
      'scheduleType', 'fully_amortizing_fixed',
      'status', 'complete',
      'inputHash', 'smoke-input-fixed-v1',
      'resultHash', 'smoke-result-fixed-v1',
      'input', jsonb_build_object('principalAmount', 300000),
      'annualInterestRateUsed', 0.06,
      'currency', 'USD',
      'periodCount', 360,
      'firstPeriodicDebtService', 1798.65,
      'finalPeriodicDebtService', 1798.24,
      'totalPrincipalPaid', 300000,
      'totalInterestPaid', 347514.87,
      'totalBalloonPaid', 0,
      'totalDebtService', 647514.87,
      'endingBalance', 0,
      'periods', '[]'::jsonb,
      'warnings', '[]'::jsonb,
      'errors', '[]'::jsonb,
      'calculatedAt', now()
    )
  ) as result;

  select result.result_id
  into result_two
  from public.create_underwriting_debt_schedule_result(
    smoke_workspace_id,
    smoke_deal_id,
    smoke_structure_id,
    amortizing_tranche_id,
    'spec009-slice2-smoke-schedule-fixed-v1-retry',
    amortizing_tranche_version,
    jsonb_build_object(
      'resultVersion', 'underwriting-debt-schedule-result-v1',
      'engineVersion', 'underwriting-debt-schedule-engine-v1',
      'hashVersion', 'underwriting-debt-schedule-hash-v1',
      'workspaceId', smoke_workspace_id,
      'dealId', smoke_deal_id,
      'financingStructureId', smoke_structure_id,
      'financingStructureVersion', smoke_structure_version,
      'debtTrancheId', amortizing_tranche_id,
      'debtTrancheVersion', amortizing_tranche_version,
      'scheduleType', 'fully_amortizing_fixed',
      'status', 'complete',
      'inputHash', 'smoke-input-fixed-v1',
      'resultHash', 'smoke-result-fixed-v1',
      'input', jsonb_build_object('principalAmount', 300000),
      'annualInterestRateUsed', 0.06,
      'currency', 'USD',
      'periodCount', 360,
      'firstPeriodicDebtService', 1798.65,
      'finalPeriodicDebtService', 1798.24,
      'totalPrincipalPaid', 300000,
      'totalInterestPaid', 347514.87,
      'totalBalloonPaid', 0,
      'totalDebtService', 647514.87,
      'endingBalance', 0,
      'periods', '[]'::jsonb,
      'warnings', '[]'::jsonb,
      'errors', '[]'::jsonb,
      'calculatedAt', now()
    )
  ) as result;

  if result_one <> result_two then
    raise exception 'Debt schedule idempotency did not reuse the canonical result.';
  end if;

  if exists (
    select 1
    from public.underwriting_debt_schedule_requests
    where workspace_id = smoke_workspace_id
      and idempotency_key = 'spec009-slice2-smoke-schedule-io'
  ) then
    raise exception 'IO schedule retry key already existed before IO schedule call.';
  end if;

  perform public.create_underwriting_debt_schedule_result(
    smoke_workspace_id,
    smoke_deal_id,
    smoke_structure_id,
    io_tranche_id,
    'spec009-slice2-smoke-schedule-io',
    io_tranche_version,
    jsonb_build_object(
      'resultVersion', 'underwriting-debt-schedule-result-v1',
      'engineVersion', 'underwriting-debt-schedule-engine-v1',
      'hashVersion', 'underwriting-debt-schedule-hash-v1',
      'workspaceId', smoke_workspace_id,
      'dealId', smoke_deal_id,
      'financingStructureId', smoke_structure_id,
      'financingStructureVersion', smoke_structure_version,
      'debtTrancheId', io_tranche_id,
      'debtTrancheVersion', io_tranche_version,
      'scheduleType', 'full_term_interest_only',
      'status', 'complete_with_warnings',
      'inputHash', 'smoke-input-io-v1',
      'resultHash', 'smoke-result-io-v1',
      'input', jsonb_build_object('principalAmount', 150000),
      'annualInterestRateUsed', 0.08,
      'currency', 'USD',
      'periodCount', 12,
      'firstPeriodicDebtService', 1000,
      'finalPeriodicDebtService', 151000,
      'totalPrincipalPaid', 150000,
      'totalInterestPaid', 12000,
      'totalBalloonPaid', 150000,
      'totalDebtService', 162000,
      'endingBalance', 0,
      'periods', '[]'::jsonb,
      'warnings', '[{"code":"full_term_interest_only_balloon","severity":"warning","message":"Interest-only loan has principal due at maturity."}]'::jsonb,
      'errors', '[]'::jsonb,
      'calculatedAt', now()
    )
  );

  perform public.create_underwriting_debt_schedule_result(
    smoke_workspace_id,
    smoke_deal_id,
    smoke_structure_id,
    balloon_tranche_id,
    'spec009-slice2-smoke-schedule-balloon',
    balloon_tranche_version,
    jsonb_build_object(
      'resultVersion', 'underwriting-debt-schedule-result-v1',
      'engineVersion', 'underwriting-debt-schedule-engine-v1',
      'hashVersion', 'underwriting-debt-schedule-hash-v1',
      'workspaceId', smoke_workspace_id,
      'dealId', smoke_deal_id,
      'financingStructureId', smoke_structure_id,
      'financingStructureVersion', smoke_structure_version,
      'debtTrancheId', balloon_tranche_id,
      'debtTrancheVersion', balloon_tranche_version,
      'scheduleType', 'balloon_maturity',
      'status', 'complete_with_warnings',
      'inputHash', 'smoke-input-balloon-v1',
      'resultHash', 'smoke-result-balloon-v1',
      'input', jsonb_build_object('principalAmount', 250000),
      'annualInterestRateUsed', 0.065,
      'currency', 'USD',
      'periodCount', 60,
      'firstPeriodicDebtService', 1580.17,
      'finalPeriodicDebtService', 233118.54,
      'totalPrincipalPaid', 250000,
      'totalInterestPaid', 94035.49,
      'totalBalloonPaid', 231538.37,
      'totalDebtService', 344035.49,
      'endingBalance', 0,
      'periods', '[]'::jsonb,
      'warnings', '[{"code":"balloon_payment_due","severity":"warning","message":"Balloon principal is due at maturity."}]'::jsonb,
      'errors', '[]'::jsonb,
      'calculatedAt', now()
    )
  );

  update public.debt_tranches
  set stated_rate = 0.061
  where id = amortizing_tranche_id;

  select count(*), count(*) filter (where schedule_status = 'stale')
  into projection_count, stale_count
  from public.list_financeiq_debt_schedule_projection(smoke_structure_id);

  if projection_count <> 3 or stale_count <> 1 then
    raise exception 'FinanceIQ projection did not expose expected stale schedule after tranche update.';
  end if;

  select result.result_id
  into result_one
  from public.create_underwriting_debt_schedule_result(
    smoke_workspace_id,
    smoke_deal_id,
    smoke_structure_id,
    amortizing_tranche_id,
    'spec009-slice2-smoke-schedule-fixed-invalid',
    amortizing_tranche_version + 1,
    jsonb_build_object(
      'resultVersion', 'underwriting-debt-schedule-result-v1',
      'engineVersion', 'underwriting-debt-schedule-engine-v1',
      'hashVersion', 'underwriting-debt-schedule-hash-v1',
      'workspaceId', smoke_workspace_id,
      'dealId', smoke_deal_id,
      'financingStructureId', smoke_structure_id,
      'financingStructureVersion', smoke_structure_version,
      'debtTrancheId', amortizing_tranche_id,
      'debtTrancheVersion', amortizing_tranche_version + 1,
      'scheduleType', 'fully_amortizing_fixed',
      'status', 'invalid_input',
      'inputHash', 'smoke-input-fixed-invalid-v1',
      'resultHash', 'smoke-result-fixed-invalid-v1',
      'input', jsonb_build_object('principalAmount', 300000),
      'annualInterestRateUsed', 0.061,
      'currency', 'USD',
      'periodCount', 0,
      'firstPeriodicDebtService', null,
      'finalPeriodicDebtService', null,
      'totalPrincipalPaid', 0,
      'totalInterestPaid', 0,
      'totalBalloonPaid', 0,
      'totalDebtService', 0,
      'endingBalance', 300000,
      'periods', '[]'::jsonb,
      'warnings', '[]'::jsonb,
      'errors', '[{"code":"invalid_schedule_input","severity":"error","message":"Smoke invalid result."}]'::jsonb,
      'calculatedAt', now()
    )
  ) as result;

  select count(*) filter (where schedule_status = 'failed'),
         count(*) filter (where schedule_status = 'failed' and result_id is not null)
  into failed_count, current_count
  from public.list_financeiq_debt_schedule_projection(smoke_structure_id);

  if failed_count <> 1 or current_count <> 1 then
    raise exception 'FinanceIQ projection did not preserve previous valid result during failed recalculation.';
  end if;

  begin
    update public.underwriting_debt_schedule_results
    set total_debt_service = 1
    where id = result_one;
  exception when others then
    invalid_mutation_blocked := true;
  end;

  if not invalid_mutation_blocked then
    raise exception 'Direct debt schedule result mutation was not blocked.';
  end if;

  begin
    perform set_config('request.jwt.claims', '{}'::text, true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform public.create_underwriting_debt_schedule_result(
      smoke_workspace_id,
      smoke_deal_id,
      smoke_structure_id,
      amortizing_tranche_id,
      'spec009-slice2-smoke-unauthorized',
      amortizing_tranche_version + 1,
      '{}'::jsonb
    );
  exception when others then
    unauthorized_blocked := true;
  end;

  if not unauthorized_blocked then
    raise exception 'Unauthenticated debt schedule creation was not blocked.';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', smoke_user_id::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', smoke_user_id::text, true);

  if has_table_privilege('authenticated', 'public.underwriting_debt_schedule_results', 'insert') then
    raise exception 'Authenticated role has direct insert privilege on debt schedule results.';
  end if;

  if not exists (
    select 1 from public.domain_events
    where workspace_id = smoke_workspace_id
      and event_type in ('underwriting.debt_schedule_calculated', 'underwriting.debt_schedule_failed')
  ) then
    raise exception 'Debt schedule domain events were not emitted.';
  end if;

  if not exists (
    select 1 from public.audit_events
    where workspace_id = smoke_workspace_id
      and action = 'underwriting.debt_schedule_result_created'
  ) then
    raise exception 'Debt schedule audit event was not emitted.';
  end if;
end $$;

select
  'SPEC009_SLICE2_ROLLBACK_SMOKE_PASS' as result,
  (select count(*) from auth.users where email = 'spec009-slice2-smoke@example.invalid') as synthetic_user_visible_inside_transaction,
  (select count(*) from public.underwriting_debt_schedule_results where input_hash like 'smoke-input-%') as synthetic_schedule_results_inside_transaction;

rollback;

select
  'SPEC009_SLICE2_ROLLBACK_VERIFIED' as result,
  (select count(*) from auth.users where email = 'spec009-slice2-smoke@example.invalid') as synthetic_user_count_after_rollback,
  (select count(*) from public.underwriting_debt_schedule_results where input_hash like 'smoke-input-%') as synthetic_schedule_count_after_rollback;

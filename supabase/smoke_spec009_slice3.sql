begin;

do $$
declare
  test_user_id uuid := gen_random_uuid();
  other_user_id uuid := gen_random_uuid();
  test_workspace_id uuid := gen_random_uuid();
  other_workspace_id uuid := gen_random_uuid();
  test_deal_id uuid := gen_random_uuid();
  other_deal_id uuid := gen_random_uuid();
  evidence_id uuid := gen_random_uuid();
  primary_structure_id uuid;
  condition_structure_id uuid;
  missing_input_structure_id uuid;
  failed_structure_id uuid;
  conflict_structure_id uuid;
  test_condition_id uuid;
  duplicate_condition_id uuid;
  dscr_covenant_id uuid;
  ltv_covenant_id uuid;
  ltc_covenant_id uuid;
  debt_yield_covenant_id uuid;
  occupancy_covenant_id uuid;
  missing_input_covenant_id uuid;
  failing_covenant_id uuid;
  conflict_covenant_id uuid;
  first_condition_version integer;
  first_dscr_evaluation_id uuid;
  updated_covenant_version integer;
  eval_result record;
  update_result record;
  loaded_condition record;
  projection_result record;
  metric_key text;
  direct_write_denied boolean := false;
  cross_workspace_write_denied boolean := false;
  cross_workspace_visible_count integer;
  event_count integer;
  audit_count integer;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (test_user_id, 'authenticated', 'authenticated', 'spec009-slice3-smoke@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (other_user_id, 'authenticated', 'authenticated', 'spec009-slice3-smoke-other@example.invalid', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now());

  insert into public.workspaces (id, name, owner_user_id, status)
  values
    (test_workspace_id, 'Spec 009 Slice 3 Smoke Workspace', test_user_id, 'active'),
    (other_workspace_id, 'Spec 009 Slice 3 Smoke Other Workspace', other_user_id, 'active');

  insert into public.workspace_memberships (workspace_id, user_id, role_id, status, accepted_at)
  values
    (test_workspace_id, test_user_id, 'owner', 'active', now()),
    (other_workspace_id, other_user_id, 'owner', 'active', now());

  perform set_config('request.jwt.claim.sub', test_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.brix_deals (id, owner_id, workspace_id, address, display_name, strategy_id, strategy_intent, created_by, updated_by)
  values
    (test_deal_id, test_user_id, test_workspace_id, 'Spec 009 Slice 3 Smoke Property', 'Spec 009 Slice 3 Smoke Deal', 'buy_hold_rental', 'buy_hold_rental', test_user_id, test_user_id),
    (other_deal_id, other_user_id, other_workspace_id, 'Spec 009 Slice 3 Other Property', 'Spec 009 Slice 3 Other Deal', 'buy_hold_rental', 'buy_hold_rental', other_user_id, other_user_id);

  insert into public.evidence_items (
    id, workspace_id, deal_id, evidence_type, original_filename, sanitized_filename, detected_mime_type,
    byte_size, content_hash, storage_object_key, uploaded_by, processing_status, extraction_status
  )
  values (
    evidence_id, test_workspace_id, test_deal_id, 'document', 'spec009-lender-quote.pdf', 'spec009-lender-quote.pdf',
    'application/pdf', 128, repeat('a', 64), 'spec009/slice3/lender-quote.pdf', test_user_id, 'complete', 'complete'
  );

  select financing_structure_id into primary_structure_id
  from public.create_financing_structure(test_deal_id, jsonb_build_object('name', 'Slice 3 DSCR LTV smoke', 'purpose', 'acquisition', 'status', 'quoted', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-structure-primary');

  select financing_structure_id into condition_structure_id
  from public.create_financing_structure(test_deal_id, jsonb_build_object('name', 'Slice 3 condition smoke', 'purpose', 'acquisition', 'status', 'quoted', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-structure-condition');

  select financing_structure_id into missing_input_structure_id
  from public.create_financing_structure(test_deal_id, jsonb_build_object('name', 'Slice 3 missing input smoke', 'purpose', 'acquisition', 'status', 'quoted', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-structure-missing');

  select financing_structure_id into failed_structure_id
  from public.create_financing_structure(test_deal_id, jsonb_build_object('name', 'Slice 3 hard failure smoke', 'purpose', 'acquisition', 'status', 'quoted', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-structure-fail');

  select financing_structure_id into conflict_structure_id
  from public.create_financing_structure(test_deal_id, jsonb_build_object('name', 'Slice 3 conflict smoke', 'purpose', 'acquisition', 'status', 'quoted', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-structure-conflict');

  select condition_id, condition_version into test_condition_id, first_condition_version
  from public.create_financing_condition(
    condition_structure_id,
    jsonb_build_object(
      'title', 'Appraisal received and accepted',
      'conditionType', 'appraisal',
      'status', 'pending',
      'verificationState', 'confirmed',
      'sourceClassification', 'lender_provided',
      'sourceEvidenceId', evidence_id,
      'sourceAnchor', jsonb_build_object('page', 4, 'quote', 'appraisal condition'),
      'waiverState', 'requested',
      'confidence', 90
    ),
    'spec009-slice3-smoke-condition'
  );

  select condition_id into duplicate_condition_id
  from public.create_financing_condition(
    condition_structure_id,
    jsonb_build_object('title', 'Appraisal received and accepted', 'conditionType', 'appraisal', 'status', 'pending', 'verificationState', 'confirmed', 'sourceClassification', 'lender_provided', 'sourceEvidenceId', evidence_id, 'sourceAnchor', jsonb_build_object('page', 4, 'quote', 'appraisal condition'), 'confidence', 90),
    'spec009-slice3-smoke-condition'
  );

  if duplicate_condition_id is distinct from test_condition_id then
    raise exception 'Expected idempotent condition retry to return the original condition.';
  end if;

  select *
  into update_result
  from public.update_financing_condition(
    test_condition_id,
    jsonb_build_object('status', 'submitted', 'sourceAnchor', jsonb_build_object('page', 5, 'quote', 'submitted appraisal')),
    first_condition_version,
    'spec009-slice3-smoke-condition-update'
  );

  if update_result.condition_version <> first_condition_version + 1 then
    raise exception 'Expected condition update to increment version from %.', first_condition_version;
  end if;

  select * into loaded_condition
  from public.load_financing_conditions(condition_structure_id)
  where id = test_condition_id;

  if loaded_condition.id is null or loaded_condition.status <> 'submitted' then
    raise exception 'Expected updated condition to reload through canonical load RPC.';
  end if;

  begin
    perform *
    from public.update_financing_condition(test_condition_id, jsonb_build_object('status', 'satisfied'), first_condition_version, 'spec009-slice3-smoke-condition-stale');
    raise exception 'Expected stale condition version rejection.';
  exception when sqlstate '40901' then
    null;
  end;

  if not exists (
    select 1 from public.financing_conditions
    where id = test_condition_id
      and source_evidence_id = evidence_id
      and source_anchor = jsonb_build_object('page', 5, 'quote', 'submitted appraisal')
      and waiver_state = 'requested'
  ) then
    raise exception 'Expected condition source evidence, source anchor, and waiver state to be retained.';
  end if;

  select covenant_id into dscr_covenant_id
  from public.create_financing_covenant(primary_structure_id, jsonb_build_object('covenantType', 'minimum_dscr', 'metricKey', 'dscr', 'comparisonOperator', 'gte', 'thresholdValue', 1.25, 'measurementPeriod', 'annual', 'testFrequency', 'at_underwriting', 'isHardConstraint', true, 'status', 'active', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90, 'governingSourceStatus', 'selected'), 'spec009-slice3-smoke-covenant-dscr');

  select covenant_id into ltv_covenant_id
  from public.create_financing_covenant(primary_structure_id, jsonb_build_object('covenantType', 'maximum_ltv', 'metricKey', 'ltv', 'comparisonOperator', 'lte', 'thresholdValue', 0.75, 'measurementPeriod', 'current', 'testFrequency', 'at_underwriting', 'isHardConstraint', true, 'status', 'active', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90, 'governingSourceStatus', 'selected'), 'spec009-slice3-smoke-covenant-ltv');

  select covenant_id into ltc_covenant_id
  from public.create_financing_covenant(primary_structure_id, jsonb_build_object('covenantType', 'maximum_ltc', 'metricKey', 'ltc', 'comparisonOperator', 'lte', 'thresholdValue', 0.8, 'isHardConstraint', false, 'status', 'active', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-covenant-ltc');

  select covenant_id into debt_yield_covenant_id
  from public.create_financing_covenant(primary_structure_id, jsonb_build_object('covenantType', 'minimum_debt_yield', 'metricKey', 'debt_yield', 'comparisonOperator', 'gte', 'thresholdValue', 0.09, 'isHardConstraint', false, 'status', 'active', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-covenant-debt-yield');

  select covenant_id into occupancy_covenant_id
  from public.create_financing_covenant(primary_structure_id, jsonb_build_object('covenantType', 'minimum_occupancy', 'metricKey', 'occupancy', 'comparisonOperator', 'gte', 'thresholdValue', 0.9, 'isHardConstraint', false, 'status', 'active', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-covenant-occupancy');

  select * into eval_result
  from public.evaluate_financing_covenants(primary_structure_id, null, jsonb_build_object('dscr', jsonb_build_object('value', 1.31, 'status', 'calculated', 'resultHash', 'smoke-dscr-pass'), 'ltv', jsonb_build_object('value', 0.7, 'status', 'calculated', 'resultHash', 'smoke-ltv-pass')), 'spec009-slice3-smoke-eval-supported-pass', gen_random_uuid());

  if eval_result.feasibility_status <> 'feasible' then
    raise exception 'Expected passing DSCR/LTV hard covenants to be feasible, got %.', eval_result.feasibility_status;
  end if;

  select eval.id into first_dscr_evaluation_id
  from public.financing_covenant_evaluation_results eval
  where eval.id = any((select covenant_evaluation_ids from public.financing_feasibility_results where id = eval_result.feasibility_result_id))
    and eval.covenant_id = dscr_covenant_id
    and eval.covenant_version = 1;

  foreach metric_key in array array['dscr', 'ltv', 'ltc', 'debt_yield', 'occupancy'] loop
    if not exists (
      select 1
      from public.financing_covenant_evaluation_results eval
      where eval.id = any((select covenant_evaluation_ids from public.financing_feasibility_results where id = eval_result.feasibility_result_id))
        and eval.metric_key = metric_key
        and eval.evaluation_state = case when metric_key in ('ltc', 'debt_yield', 'occupancy') then 'unsupported_metric' else 'passes' end
    ) then
      raise exception 'Expected % evaluation state to match supported/unsupported contract.', metric_key;
    end if;
  end loop;

  select covenant_version into updated_covenant_version
  from public.update_financing_covenant(
    dscr_covenant_id,
    jsonb_build_object('thresholdValue', 1.3),
    1,
    'spec009-slice3-smoke-covenant-dscr-update'
  );

  if updated_covenant_version <> 2 then
    raise exception 'Expected covenant update to increment version to 2.';
  end if;

  if not exists (select 1 from public.financing_covenant_evaluation_results where id = first_dscr_evaluation_id and covenant_version = 1) then
    raise exception 'Expected historical DSCR evaluation to remain available after covenant update.';
  end if;

  select * into projection_result
  from public.load_financing_constraint_projection(primary_structure_id);

  if projection_result.stale is not true then
    raise exception 'Expected new covenant version to make prior projection stale.';
  end if;

  select * into eval_result
  from public.evaluate_financing_covenants(primary_structure_id, null, jsonb_build_object('dscr', jsonb_build_object('value', 1.1, 'status', 'calculated', 'resultHash', 'smoke-dscr-fail'), 'ltv', jsonb_build_object('value', 0.82, 'status', 'calculated', 'resultHash', 'smoke-ltv-fail')), 'spec009-slice3-smoke-eval-supported-fail', gen_random_uuid());

  if eval_result.feasibility_status <> 'not_feasible' or eval_result.failed_covenant_count <> 2 then
    raise exception 'Expected hard DSCR/LTV failures to be not_feasible with two failures.';
  end if;

  select covenant_id into missing_input_covenant_id
  from public.create_financing_covenant(missing_input_structure_id, jsonb_build_object('covenantType', 'minimum_dscr', 'metricKey', 'dscr', 'comparisonOperator', 'gte', 'thresholdValue', 1.25, 'isHardConstraint', true, 'status', 'active', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-covenant-missing');

  select * into eval_result
  from public.evaluate_financing_covenants(missing_input_structure_id, null, jsonb_build_object('dscr', jsonb_build_object('status', 'missing')), 'spec009-slice3-smoke-eval-missing', gen_random_uuid());

  if eval_result.feasibility_status <> 'uncertain' or eval_result.uncertain_covenant_count <> 1 then
    raise exception 'Expected unresolved hard input to produce uncertain feasibility.';
  end if;

  select covenant_id into failing_covenant_id
  from public.create_financing_covenant(failed_structure_id, jsonb_build_object('covenantType', 'minimum_dscr', 'metricKey', 'dscr', 'comparisonOperator', 'gte', 'thresholdValue', 1.3, 'isHardConstraint', true, 'status', 'active', 'verificationState', 'quoted', 'sourceClassification', 'lender_provided', 'confidence', 90), 'spec009-slice3-smoke-covenant-failing');

  select * into eval_result
  from public.evaluate_financing_covenants(failed_structure_id, null, jsonb_build_object('dscr', jsonb_build_object('value', 1.1, 'status', 'calculated', 'resultHash', 'smoke-hard-fail')), 'spec009-slice3-smoke-eval-hard-fail', gen_random_uuid());

  if eval_result.feasibility_status <> 'not_feasible' or eval_result.failed_covenant_count <> 1 then
    raise exception 'Expected hard verified failure to produce not_feasible.';
  end if;

  select * into eval_result
  from public.evaluate_financing_covenants(condition_structure_id, null, '{}'::jsonb, 'spec009-slice3-smoke-eval-condition', gen_random_uuid());

  if eval_result.feasibility_status <> 'feasible_with_conditions' or eval_result.unresolved_condition_count <> 1 then
    raise exception 'Expected unresolved condition to produce feasible_with_conditions.';
  end if;

  select covenant_id into conflict_covenant_id
  from public.create_financing_covenant(conflict_structure_id, jsonb_build_object('covenantType', 'minimum_dscr', 'metricKey', 'dscr', 'comparisonOperator', 'gte', 'thresholdValue', 1.25, 'isHardConstraint', true, 'status', 'active', 'verificationState', 'quoted', 'sourceClassification', 'conflict', 'conflictState', 'source_conflict', 'confidence', 40), 'spec009-slice3-smoke-covenant-conflict');

  select * into eval_result
  from public.evaluate_financing_covenants(conflict_structure_id, null, jsonb_build_object('dscr', jsonb_build_object('value', 1.4, 'status', 'calculated', 'resultHash', 'smoke-conflict')), 'spec009-slice3-smoke-eval-conflict', gen_random_uuid());

  if eval_result.feasibility_status <> 'uncertain' or eval_result.uncertain_covenant_count <> 1 then
    raise exception 'Expected conflict to produce uncertain feasibility.';
  end if;

  select count(*) into event_count
  from public.domain_events
  where workspace_id = test_workspace_id
    and source_command = 'create_financing_condition'
    and idempotency_key = 'spec009-slice3-smoke-condition:financing.condition_changed';

  select count(*) into audit_count
  from public.audit_events
  where workspace_id = test_workspace_id
    and source_command = 'create_financing_condition'
    and idempotency_key = 'spec009-slice3-smoke-condition:audit';

  if event_count <> 1 or audit_count <> 1 then
    raise exception 'Expected idempotent retry to write event/audit once; got event %, audit %.', event_count, audit_count;
  end if;

  begin
    execute 'set local role authenticated';
    insert into public.financing_conditions (workspace_id, deal_id, financing_structure_id, title, created_by, updated_by)
    values (test_workspace_id, test_deal_id, condition_structure_id, 'Direct write should fail', test_user_id, test_user_id);
  exception when insufficient_privilege or check_violation then
    direct_write_denied := true;
  end;
  execute 'reset role';

  if not direct_write_denied then
    raise exception 'Expected direct financing_conditions insert to be denied.';
  end if;

  perform set_config('request.jwt.claim.sub', other_user_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  select count(*) into cross_workspace_visible_count
  from public.load_financing_conditions(condition_structure_id);

  if cross_workspace_visible_count <> 0 then
    raise exception 'Expected cross-workspace load to return zero rows, got %.', cross_workspace_visible_count;
  end if;

  begin
    perform *
    from public.create_financing_condition(condition_structure_id, jsonb_build_object('title', 'Cross workspace write should fail'), 'spec009-slice3-smoke-cross-workspace-write');
  exception when insufficient_privilege then
    cross_workspace_write_denied := true;
  end;

  if not cross_workspace_write_denied then
    raise exception 'Expected cross-workspace condition create to be denied.';
  end if;

  raise notice 'SPEC009_SLICE3_STAGING_SMOKE_OK structures=%/%/%/%/% condition=% dscr=% ltv=% unsupported=%/%/% missing=% failing=% conflict=%',
    primary_structure_id, condition_structure_id, missing_input_structure_id, failed_structure_id, conflict_structure_id,
    test_condition_id, dscr_covenant_id, ltv_covenant_id, ltc_covenant_id, debt_yield_covenant_id, occupancy_covenant_id,
    missing_input_covenant_id, failing_covenant_id, conflict_covenant_id;
end $$;

rollback;

do $$
begin
  if exists (select 1 from auth.users where email in ('spec009-slice3-smoke@example.invalid', 'spec009-slice3-smoke-other@example.invalid')) then
    raise exception 'Rollback residue found in auth.users.';
  end if;

  if exists (select 1 from public.workspaces where name like 'Spec 009 Slice 3 Smoke%') then
    raise exception 'Rollback residue found in workspaces.';
  end if;

  raise notice 'SPEC009_SLICE3_ROLLBACK_RESIDUE_OK';
end $$;

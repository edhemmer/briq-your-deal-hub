create temporary table spec011a_r1_smoke_result (
  test_name text primary key,
  passed boolean not null,
  detail jsonb not null default '{}'::jsonb
) on commit drop;

do $smoke$
declare
  smoke_user_id constant uuid := '11111111-1111-4111-8111-111111111111';
  smoke_workspace_id constant uuid := '22222222-2222-4222-8222-222222222222';
  smoke_property_id constant uuid := '33333333-3333-4333-8333-333333333333';
  smoke_deal_id constant uuid := '44444444-4444-4444-8444-444444444444';
  smoke_contract_id constant uuid := '55555555-5555-4555-8555-555555555555';
  smoke_analysis_id constant uuid := '66666666-6666-4666-8666-666666666666';
  smoke_question_id constant uuid := '77777777-7777-4777-8777-777777777777';
  first_result jsonb;
  retry_result jsonb;
  second_result jsonb;
  third_result jsonb;
  failure_result jsonb;
  reconciliation_result jsonb;
  first_snapshot_id uuid;
  second_snapshot_id uuid;
  third_snapshot_id uuid;
  projection_count integer;
  event_count integer;
  audit_count integer;
  current_count integer;
  safe_failure_message text;
  mutation_denied boolean := false;
begin
  begin
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', smoke_user_id,
      'authenticated', 'authenticated', 'spec011a-r1-smoke@example.invalid', '', now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    );

    insert into public.workspaces (id, name, owner_user_id)
    values (smoke_workspace_id, 'Spec 011A R1 rollback smoke', smoke_user_id);

    insert into public.workspace_memberships (workspace_id, user_id, role_id, status)
    values (smoke_workspace_id, smoke_user_id, 'owner', 'active');

    insert into public.properties (id, workspace_id, display_address, created_by)
    values (smoke_property_id, smoke_workspace_id, '100 Snapshot Way', smoke_user_id);

    insert into public.brix_deals (
      id, owner_id, address, strategy_id, workspace_id, display_name, created_by
    ) values (
      smoke_deal_id, smoke_user_id, '100 Snapshot Way', 'buy_and_hold',
      smoke_workspace_id, 'Spec 011A R1 rollback deal', smoke_user_id
    );

    insert into public.deal_properties (
      workspace_id, deal_id, property_id, role, inclusion_status, created_by
    ) values (
      smoke_workspace_id, smoke_deal_id, smoke_property_id, 'primary', 'active', smoke_user_id
    );

    insert into public.contracts (
      id, user_id, workspace_id, deal_id, property_id, title, contract_name,
      contract_type, perspective, status, verification_state, analysis_state,
      confidence, version, created_by, updated_by
    ) values (
      smoke_contract_id, smoke_user_id, smoke_workspace_id, smoke_deal_id,
      smoke_property_id, 'Spec 011A R1 Purchase Contract', 'Spec 011A R1 Purchase Contract',
      'purchase_agreement', 'buyer', 'executed', 'verified', 'current',
      100, 1, smoke_user_id, smoke_user_id
    );

    insert into public.contract_perspective_analysis_runs (
      id, workspace_id, deal_id, property_id, contract_id, contract_version,
      perspective, analysis_state, completeness_state, source_version_graph,
      result_payload, deterministic_hash, input_hash, is_current, created_by, updated_by
    ) values (
      smoke_analysis_id, smoke_workspace_id, smoke_deal_id, smoke_property_id,
      smoke_contract_id, 1, 'buyer', 'current', 'complete',
      jsonb_build_object('contractId', smoke_contract_id, 'contractVersion', 1),
      '{"approvedCurrentPosition":"proceed_with_caution"}'::jsonb,
      repeat('a', 64), repeat('b', 64), true, smoke_user_id, smoke_user_id
    );

    insert into public.contract_questions (
      id, workspace_id, contract_id, question, recipient_role, priority,
      rationale, source_reason, perspective, status, resolution_state,
      report_inclusion, created_by, updated_by
    ) values (
      smoke_question_id, smoke_workspace_id, smoke_contract_id,
      'Confirm the assignment clause before closing.', 'buyer_attorney', 'high',
      'The canonical analysis identified missing confirmation.',
      'Canonical ContractIQ open item', 'buyer', 'open', 'unresolved',
      '{"fullReport":true,"summaryReport":true,"questionsReport":true}'::jsonb,
      smoke_user_id, smoke_user_id
    );

    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', smoke_user_id, 'role', 'authenticated')::text,
      true
    );
    execute 'set local role authenticated';

    first_result := public.create_contractiq_report_snapshot(
      smoke_contract_id, 'buyer', smoke_analysis_id, 'spec011a-r1-smoke-create-1',
      '88888888-8888-4888-8888-888888888881'
    );
    first_snapshot_id := (first_result ->> 'snapshotId')::uuid;
    if first_snapshot_id is null or first_result ->> 'failureCode' is not null then
      raise exception 'snapshot creation failed: %', first_result;
    end if;

    retry_result := public.create_contractiq_report_snapshot(
      smoke_contract_id, 'buyer', smoke_analysis_id, 'spec011a-r1-smoke-create-1',
      '88888888-8888-4888-8888-888888888881'
    );
    if (retry_result ->> 'snapshotId')::uuid <> first_snapshot_id
       or coalesce((retry_result ->> 'reused')::boolean, false) is false then
      raise exception 'idempotent retry did not reuse the first snapshot: %', retry_result;
    end if;

    select count(*) into projection_count
    from public.contractiq_report_snapshot_projection projection
    where projection.snapshot_id = first_snapshot_id
      and projection.snapshot_payload #>> '{questions,0,questionId}' = smoke_question_id::text;
    if projection_count <> 1 then
      raise exception 'read projection did not preserve canonical question identity';
    end if;

    begin
      update public.contractiq_report_snapshots
      set snapshot_payload = '{}'::jsonb
      where id = first_snapshot_id;
    exception when insufficient_privilege then
      mutation_denied := true;
    end;
    if mutation_denied is false then
      raise exception 'direct authenticated snapshot mutation was not denied';
    end if;

    execute 'reset role';
    update public.contract_questions
    set question = 'Confirm the assignment clause and written consent before closing.'
    where id = smoke_question_id;
    execute 'set local role authenticated';

    reconciliation_result := public.reconcile_contractiq_report_snapshot(
      first_snapshot_id, 'spec011a-r1-smoke-reconcile-1'
    );
    if reconciliation_result ->> 'reconciliationStatus' <> 'question_version_mismatch'
       or reconciliation_result ->> 'snapshotState' <> 'stale' then
      raise exception 'question mismatch reconciliation failed: %', reconciliation_result;
    end if;

    second_result := public.create_contractiq_report_snapshot(
      smoke_contract_id, 'buyer', smoke_analysis_id, 'spec011a-r1-smoke-create-2',
      '88888888-8888-4888-8888-888888888883'
    );
    second_snapshot_id := (second_result ->> 'snapshotId')::uuid;
    if second_snapshot_id is null or second_snapshot_id = first_snapshot_id
       or (second_result ->> 'snapshotVersion')::integer <> 2 then
      raise exception 'changed canonical content did not create snapshot version 2: %', second_result;
    end if;

    execute 'reset role';
    update public.contract_questions
    set rationale = 'Written consent is a material closing condition.'
    where id = smoke_question_id;
    execute 'set local role authenticated';

    third_result := public.create_contractiq_report_snapshot(
      smoke_contract_id, 'buyer', smoke_analysis_id, 'spec011a-r1-smoke-create-3',
      '88888888-8888-4888-8888-888888888885'
    );
    third_snapshot_id := (third_result ->> 'snapshotId')::uuid;
    if third_result ->> 'failureCode' is not null then
      select audit.metadata ->> 'safe_message'
      into safe_failure_message
      from public.audit_events audit
      where audit.workspace_id = smoke_workspace_id
        and audit.idempotency_key = 'spec011a-r1-smoke-create-3:failed:audit'
      order by audit.occurred_at desc
      limit 1;
    end if;
    if third_snapshot_id is null or third_snapshot_id in (first_snapshot_id, second_snapshot_id)
       or (third_result ->> 'snapshotVersion')::integer <> 3
       or not exists (
         select 1
         from public.contractiq_report_snapshots snapshot
         where snapshot.id = second_snapshot_id
           and snapshot.snapshot_state = 'superseded'
           and snapshot.is_current is false
           and snapshot.superseded_by_snapshot_id = third_snapshot_id
       ) then
      raise exception 'current snapshot was not superseded by version 3: %, safe failure: %', third_result, safe_failure_message;
    end if;

    failure_result := public.create_contractiq_report_snapshot(
      smoke_contract_id, 'buyer', '66666666-6666-4666-8666-666666666667',
      'spec011a-r1-smoke-failure', '88888888-8888-4888-8888-888888888884'
    );
    if failure_result ->> 'failureCode' <> 'source_version_mismatch'
       or coalesce((failure_result ->> 'priorValidPreserved')::boolean, false) is false
       or (failure_result ->> 'snapshotId')::uuid <> third_snapshot_id then
      raise exception 'failed regeneration did not preserve prior valid snapshot: %', failure_result;
    end if;

    select count(*) into current_count
    from public.contractiq_report_snapshots snapshot
    where snapshot.workspace_id = smoke_workspace_id
      and snapshot.contract_id = smoke_contract_id
      and snapshot.perspective = 'buyer'
      and snapshot.is_current;
    if current_count <> 1 then
      raise exception 'expected exactly one current snapshot, found %', current_count;
    end if;

    select count(*) into event_count
    from public.domain_events event
    where event.workspace_id = smoke_workspace_id
      and event.event_type in (
        'contractiq.report_snapshot_created',
        'contractiq.report_snapshot_stale',
        'contractiq.report_snapshot_superseded',
        'contractiq.report_snapshot_failed'
      );
    select count(*) into audit_count
    from public.audit_events audit
    where audit.workspace_id = smoke_workspace_id
      and audit.action in (
        'contractiq.report_snapshot_created',
        'contractiq.report_snapshot_failed'
      );
    if event_count < 7 or audit_count < 4 then
      raise exception 'expected lifecycle events/audits, got events %, audits %', event_count, audit_count;
    end if;

    execute 'reset role';
    raise exception using errcode = 'BR001', message = 'SPEC011A_R1_ROLLBACK';
  exception when sqlstate 'BR001' then
    null;
  end;

  if exists (
    select 1 from public.contractiq_report_snapshots snapshot
    where snapshot.contract_id = smoke_contract_id
  ) or exists (
    select 1 from public.contracts contract
    where contract.id = smoke_contract_id
  ) or exists (
    select 1 from auth.users auth_user
    where auth_user.id = smoke_user_id
  ) then
    raise exception 'rollback smoke left persistent fixture data';
  end if;

  insert into spec011a_r1_smoke_result(test_name, passed, detail)
  values (
    'shared_report_snapshot_rpc',
    true,
    jsonb_build_object(
      'firstSnapshotId', first_snapshot_id,
      'secondSnapshotId', second_snapshot_id,
      'thirdSnapshotId', third_snapshot_id,
      'firstStateAfterReconcile', reconciliation_result ->> 'snapshotState',
      'mismatch', reconciliation_result ->> 'reconciliationStatus',
      'idempotentRetry', retry_result ->> 'reused',
      'priorValidPreserved', failure_result ->> 'priorValidPreserved',
      'projectionRows', projection_count,
      'currentRows', current_count,
      'events', event_count,
      'audits', audit_count,
      'directMutationDenied', mutation_denied,
      'fixtureRollbackVerified', true
    )
  );
end
$smoke$;

select * from spec011a_r1_smoke_result;

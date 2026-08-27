do $$
declare
  missing_tables text[];
  rls_disabled text[];
  missing_projection_columns text[];
  missing_policies text[];
  missing_indexes text[];
  exposed_rpc regprocedure;
begin
  select array_agg(table_name order by table_name)
  into missing_tables
  from (
    values
      ('contract_change_propagations'),
      ('contract_downstream_change_proposals')
  ) expected(table_name)
  where to_regclass('public.' || expected.table_name) is null;
  if missing_tables is not null then
    raise exception 'Spec 011 Slice 5 missing tables: %', missing_tables;
  end if;

  select array_agg(relname order by relname)
  into rls_disabled
  from pg_class
  where oid in (
    'public.contract_change_propagations'::regclass,
    'public.contract_downstream_change_proposals'::regclass
  )
    and relrowsecurity is false;
  if rls_disabled is not null then
    raise exception 'Spec 011 Slice 5 RLS disabled: %', rls_disabled;
  end if;

  select array_agg(column_name order by column_name)
  into missing_projection_columns
  from (
    values
      ('contract_change_propagation_id'),
      ('accepted_proposal_id'),
      ('contract_term_version'),
      ('contract_finding_version'),
      ('target_domain'),
      ('propagation_status'),
      ('affected_domains'),
      ('underwriting_status'),
      ('strategy_status'),
      ('finance_status'),
      ('deadline_task_status'),
      ('cockpit_status'),
      ('timeline_status'),
      ('prior_valid_references'),
      ('version_graph'),
      ('deterministic_request_hash'),
      ('downstream_proposal_count'),
      ('failed_downstream_count')
  ) expected(column_name)
  where not exists (
    select 1
    from information_schema.columns column_info
    where column_info.table_schema = 'public'
      and column_info.table_name = 'contract_change_propagation_projection'
      and column_info.column_name = expected.column_name
  );
  if missing_projection_columns is not null then
    raise exception 'Spec 011 Slice 5 missing projection columns: %', missing_projection_columns;
  end if;

  exposed_rpc := to_regprocedure('public.propagate_accepted_contract_change(uuid,jsonb,integer,text)');
  if exposed_rpc is null then
    raise exception 'Spec 011 Slice 5 missing propagation RPC.';
  end if;

  select array_agg(policyname order by policyname)
  into missing_policies
  from (
    values
      ('contract change propagations no direct insert'),
      ('contract change propagations no direct update'),
      ('contract change propagations no direct delete'),
      ('contract downstream change proposals no direct insert'),
      ('contract downstream change proposals no direct update'),
      ('contract downstream change proposals no direct delete')
  ) expected(policyname)
  where not exists (
    select 1
    from pg_policies policy_info
    where policy_info.schemaname = 'public'
      and policy_info.policyname = expected.policyname
      and (policy_info.with_check = 'false' or policy_info.qual = 'false')
  );
  if missing_policies is not null then
    raise exception 'Spec 011 Slice 5 missing direct-denial policies: %', missing_policies;
  end if;

  select array_agg(index_name order by index_name)
  into missing_indexes
  from (
    values
      ('idx_contract_change_propagations_deal'),
      ('idx_contract_change_propagations_contract'),
      ('idx_contract_change_propagations_term'),
      ('idx_contract_change_propagations_proposal'),
      ('idx_contract_change_propagations_source_evidence'),
      ('idx_contract_downstream_change_proposals_propagation'),
      ('idx_contract_downstream_change_proposals_deal'),
      ('idx_contract_downstream_change_proposals_target'),
      ('idx_contract_downstream_change_proposals_source_evidence')
  ) expected(index_name)
  where not exists (
    select 1
    from pg_indexes index_info
    where index_info.schemaname = 'public'
      and index_info.indexname = expected.index_name
  );
  if missing_indexes is not null then
    raise exception 'Spec 011 Slice 5 missing indexes: %', missing_indexes;
  end if;
end $$;

select
  'spec011_slice5_smoke_pass' as result,
  count(*) filter (where table_name in ('contract_change_propagations', 'contract_downstream_change_proposals')) as slice5_table_count
from information_schema.tables
where table_schema = 'public';

do $$
declare
  missing_tables text[];
  rls_disabled text[];
  missing_projection_columns text[];
  missing_functions text[];
  missing_policies text[];
  missing_fk_indexes text[];
  mutation_constraints_missing text[];
begin
  select array_agg(table_name order by table_name)
  into missing_tables
  from (
    values
      ('contract_perspective_analysis_runs'),
      ('contract_perspective_analysis_items'),
      ('contract_amendment_impact_results')
  ) expected(table_name)
  where to_regclass('public.' || expected.table_name) is null;
  if missing_tables is not null then
    raise exception 'Spec 011 Slice 4 missing tables: %', missing_tables;
  end if;

  select array_agg(relname order by relname)
  into rls_disabled
  from pg_class
  where oid in (
    'public.contract_perspective_analysis_runs'::regclass,
    'public.contract_perspective_analysis_items'::regclass,
    'public.contract_amendment_impact_results'::regclass
  )
    and relrowsecurity is false;
  if rls_disabled is not null then
    raise exception 'Spec 011 Slice 4 RLS disabled: %', rls_disabled;
  end if;

  select array_agg(column_name order by column_name)
  into missing_projection_columns
  from (
    values
      ('current_perspective_analysis_state'),
      ('current_perspective'),
      ('perspective_benefit_count'),
      ('perspective_risk_count'),
      ('perspective_unusual_term_count'),
      ('perspective_missing_protection_count'),
      ('perspective_missing_information_count'),
      ('perspective_conflict_count'),
      ('perspective_amendment_impact_count'),
      ('perspective_obligation_count'),
      ('perspective_question_count'),
      ('perspective_negotiation_concept_count'),
      ('perspective_downstream_candidate_count'),
      ('perspective_prior_valid_available')
  ) expected(column_name)
  where not exists (
    select 1
    from information_schema.columns column_info
    where column_info.table_schema = 'public'
      and column_info.table_name = 'contract_projection'
      and column_info.column_name = expected.column_name
  );
  if missing_projection_columns is not null then
    raise exception 'Spec 011 Slice 4 missing projection columns: %', missing_projection_columns;
  end if;

  select array_agg(function_name order by function_name)
  into missing_functions
  from (
    values
      ('record_contract_perspective_analysis_result'),
      ('load_contract_perspective_analysis_detail')
  ) expected(function_name)
  where to_regprocedure('public.' || expected.function_name || '(uuid,jsonb,integer,text)') is null
    and to_regprocedure('public.' || expected.function_name || '(uuid)') is null;
  if missing_functions is not null then
    raise exception 'Spec 011 Slice 4 missing RPCs: %', missing_functions;
  end if;

  select array_agg(policyname order by policyname)
  into missing_policies
  from (
    values
      ('contract perspective analysis runs no direct insert'),
      ('contract perspective analysis runs no direct update'),
      ('contract perspective analysis runs no direct delete'),
      ('contract perspective analysis items no direct insert'),
      ('contract perspective analysis items no direct update'),
      ('contract perspective analysis items no direct delete'),
      ('contract amendment impacts no direct insert'),
      ('contract amendment impacts no direct update'),
      ('contract amendment impacts no direct delete')
  ) expected(policyname)
  where not exists (
    select 1
    from pg_policies policy_info
    where policy_info.schemaname = 'public'
      and policy_info.policyname = expected.policyname
      and (
        policy_info.with_check = 'false'
        or policy_info.qual = 'false'
      )
  );
  if missing_policies is not null then
    raise exception 'Spec 011 Slice 4 missing direct-denial policies: %', missing_policies;
  end if;

  select array_agg(conrelid::regclass::text || '.' || conname order by conrelid::regclass::text, conname)
  into missing_fk_indexes
  from pg_constraint constraint_info
  where constraint_info.contype = 'f'
    and constraint_info.conrelid in (
      'public.contract_perspective_analysis_runs'::regclass,
      'public.contract_perspective_analysis_items'::regclass,
      'public.contract_amendment_impact_results'::regclass
    )
    and not exists (
      select 1
      from pg_index index_info
      where index_info.indrelid = constraint_info.conrelid
        and index_info.indkey::int2[] @> constraint_info.conkey
    );
  if missing_fk_indexes is not null then
    raise exception 'Spec 011 Slice 4 missing FK indexes: %', missing_fk_indexes;
  end if;

  select array_agg(conname order by conname)
  into mutation_constraints_missing
  from (
    values
      ('contract_perspective_items_no_mutation'),
      ('contract_amendment_impacts_no_mutation')
  ) expected(conname)
  where not exists (
    select 1
    from pg_constraint constraint_info
    where constraint_info.conname = expected.conname
      and constraint_info.contype = 'c'
  );
  if mutation_constraints_missing is not null then
    raise exception 'Spec 011 Slice 4 missing no-mutation constraints: %', mutation_constraints_missing;
  end if;
end $$;

select
  'spec011_slice4_smoke_pass' as result,
  count(*) filter (where table_name in ('contract_perspective_analysis_runs', 'contract_perspective_analysis_items', 'contract_amendment_impact_results')) as slice4_table_count
from information_schema.tables
where table_schema = 'public';

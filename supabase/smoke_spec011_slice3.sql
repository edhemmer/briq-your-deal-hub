do $$
declare
  missing_tables text[];
  rls_disabled text[];
  missing_projection_columns text[];
  missing_functions text[];
  missing_statuses text[];
  missing_fk_indexes text[];
begin
  select array_agg(table_name order by table_name)
  into missing_tables
  from (
    values
      ('contract_holiday_calendars'),
      ('contract_deadline_results'),
      ('contract_deadline_canonical_links')
  ) expected(table_name)
  where to_regclass('public.' || expected.table_name) is null;
  if missing_tables is not null then
    raise exception 'Spec 011 Slice 3 missing tables: %', missing_tables;
  end if;

  select array_agg(relname order by relname)
  into rls_disabled
  from pg_class
  where oid in (
    'public.contract_holiday_calendars'::regclass,
    'public.contract_deadline_results'::regclass,
    'public.contract_deadline_canonical_links'::regclass
  )
    and relrowsecurity is false;
  if rls_disabled is not null then
    raise exception 'Spec 011 Slice 3 RLS disabled: %', rls_disabled;
  end if;

  select array_agg(column_name order by column_name)
  into missing_projection_columns
  from (
    values
      ('verified_current_deadline_count'),
      ('proposed_deadline_count'),
      ('uncertain_deadline_count'),
      ('missed_deadline_count'),
      ('deadline_stale_count'),
      ('deadline_conflict_count'),
      ('next_deadline_due_at')
  ) expected(column_name)
  where not exists (
    select 1
    from information_schema.columns column_info
    where column_info.table_schema = 'public'
      and column_info.table_name = 'contract_projection'
      and column_info.column_name = expected.column_name
  );
  if missing_projection_columns is not null then
    raise exception 'Spec 011 Slice 3 missing projection columns: %', missing_projection_columns;
  end if;

  select array_agg(function_name order by function_name)
  into missing_functions
  from (
    values
      ('record_contract_deadline_result'),
      ('sync_contract_deadline_to_deal')
  ) expected(function_name)
  where to_regprocedure('public.' || expected.function_name || '(uuid,jsonb,integer,text)') is null
    and to_regprocedure('public.' || expected.function_name || '(uuid,text)') is null;
  if missing_functions is not null then
    raise exception 'Spec 011 Slice 3 missing RPCs: %', missing_functions;
  end if;

  select array_agg(status_key order by status_key)
  into missing_statuses
  from (
    values
      ('uncertain'),
      ('missing_trigger'),
      ('missing_rule'),
      ('stale'),
      ('failed_with_prior_valid')
  ) expected(status_key)
  where not exists (
    select 1
    from public.contract_deadline_status_definitions status_definition
    where status_definition.status_key = expected.status_key
  );
  if missing_statuses is not null then
    raise exception 'Spec 011 Slice 3 missing statuses: %', missing_statuses;
  end if;

  select array_agg(conrelid::regclass::text || '.' || conname order by conrelid::regclass::text, conname)
  into missing_fk_indexes
  from pg_constraint constraint_info
  where constraint_info.contype = 'f'
    and constraint_info.conrelid in (
      'public.contract_holiday_calendars'::regclass,
      'public.contract_deadline_results'::regclass,
      'public.contract_deadline_canonical_links'::regclass
    )
    and not exists (
      select 1
      from pg_index index_info
      where index_info.indrelid = constraint_info.conrelid
        and index_info.indkey::int2[] @> constraint_info.conkey
    );
  if missing_fk_indexes is not null then
    raise exception 'Spec 011 Slice 3 missing FK indexes: %', missing_fk_indexes;
  end if;
end $$;

select
  'spec011_slice3_smoke_pass' as result,
  count(*) filter (where status_key in ('uncertain', 'missing_trigger', 'missing_rule', 'stale', 'failed_with_prior_valid')) as added_status_count
from public.contract_deadline_status_definitions;

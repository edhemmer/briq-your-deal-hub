-- Repair Spec 009 Slice 2 projection precedence.
-- A current failed recalculation must project as failed while preserving prior valid totals.

do $$
declare
  function_sql text;
begin
  select pg_get_functiondef('public.list_financeiq_debt_schedule_projection(uuid)'::regprocedure)
  into function_sql;

  function_sql := replace(
    function_sql,
    'case
      when latest_valid.id is not null and latest_valid.debt_tranche_version = tranche.version then ''current''
      when latest_any.id is not null and latest_any.status = ''invalid_input'' and latest_any.debt_tranche_version = tranche.version then ''failed''',
    'case
      when latest_any.id is not null and latest_any.status = ''invalid_input'' and latest_any.debt_tranche_version = tranche.version then ''failed''
      when latest_valid.id is not null and latest_valid.debt_tranche_version = tranche.version then ''current'''
  );

  execute function_sql;
end $$;

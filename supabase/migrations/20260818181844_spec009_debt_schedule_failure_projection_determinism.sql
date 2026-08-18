-- Repair Spec 009 Slice 2 projection determinism.
-- Failed current recalculations must not depend on timestamp/UUID ordering against prior valid rows.

do $$
declare
  function_sql text;
begin
  select pg_get_functiondef('public.list_financeiq_debt_schedule_projection(uuid)'::regprocedure)
  into function_sql;

  function_sql := replace(function_sql, 'coalesce(latest_valid.id, latest_any.id)', 'coalesce(latest_valid.id, latest_current_failure.id, latest_any.id)');
  function_sql := replace(function_sql, 'coalesce(latest_valid.schedule_type, latest_any.schedule_type)', 'coalesce(latest_valid.schedule_type, latest_current_failure.schedule_type, latest_any.schedule_type)');
  function_sql := replace(function_sql, 'when latest_any.id is not null and latest_any.status = ''invalid_input'' and latest_any.debt_tranche_version = tranche.version then ''failed''', 'when latest_current_failure.id is not null then ''failed''');
  function_sql := replace(function_sql, 'coalesce(latest_valid.engine_version, latest_any.engine_version)', 'coalesce(latest_valid.engine_version, latest_current_failure.engine_version, latest_any.engine_version)');
  function_sql := replace(function_sql, 'coalesce(latest_valid.input_hash, latest_any.input_hash)', 'coalesce(latest_valid.input_hash, latest_current_failure.input_hash, latest_any.input_hash)');
  function_sql := replace(function_sql, 'coalesce(latest_valid.result_hash, latest_any.result_hash)', 'coalesce(latest_valid.result_hash, latest_current_failure.result_hash, latest_any.result_hash)');
  function_sql := replace(function_sql, 'coalesce(jsonb_array_length(coalesce(latest_valid.warnings, latest_any.warnings, ''[]''::jsonb)), 0)', 'coalesce(jsonb_array_length(coalesce(latest_valid.warnings, latest_current_failure.warnings, latest_any.warnings, ''[]''::jsonb)), 0)');
  function_sql := replace(function_sql, 'coalesce(latest_valid.calculated_at, latest_any.calculated_at)', 'coalesce(latest_valid.calculated_at, latest_current_failure.calculated_at, latest_any.calculated_at)');
  function_sql := replace(
    function_sql,
    '  left join lateral (
    select *
    from public.underwriting_debt_schedule_results result
    where result.workspace_id = tranche.workspace_id
      and result.financing_structure_id = tranche.financing_structure_id
      and result.debt_tranche_id = tranche.id
      and result.status in (''complete'', ''complete_with_warnings'')
    order by result.calculated_at desc, result.id desc
    limit 1
  ) latest_valid on true
  left join lateral (
    select *',
    '  left join lateral (
    select *
    from public.underwriting_debt_schedule_results result
    where result.workspace_id = tranche.workspace_id
      and result.financing_structure_id = tranche.financing_structure_id
      and result.debt_tranche_id = tranche.id
      and result.status in (''complete'', ''complete_with_warnings'')
    order by result.calculated_at desc, result.id desc
    limit 1
  ) latest_valid on true
  left join lateral (
    select *
    from public.underwriting_debt_schedule_results result
    where result.workspace_id = tranche.workspace_id
      and result.financing_structure_id = tranche.financing_structure_id
      and result.debt_tranche_id = tranche.id
      and result.debt_tranche_version = tranche.version
      and result.status = ''invalid_input''
    order by result.calculated_at desc, result.id desc
    limit 1
  ) latest_current_failure on true
  left join lateral (
    select *'
  );

  execute function_sql;
end $$;

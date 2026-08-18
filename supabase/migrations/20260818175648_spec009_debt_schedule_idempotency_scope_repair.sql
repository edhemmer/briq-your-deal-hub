-- Repair Spec 009 Slice 2 debt schedule idempotency lookups after deployment.
-- The function uses #variable_conflict use_variable, so request/result columns must be qualified.

do $$
declare
  function_sql text;
begin
  select pg_get_functiondef('public.create_underwriting_debt_schedule_result(uuid,uuid,uuid,uuid,text,integer,jsonb)'::regprocedure)
  into function_sql;

  function_sql := replace(
    function_sql,
    'from public.underwriting_debt_schedule_requests
  where workspace_id = target_workspace_id
    and idempotency_key = cleaned_key',
    'from public.underwriting_debt_schedule_requests request
  where request.workspace_id = target_workspace_id
    and request.idempotency_key = cleaned_key'
  );

  function_sql := replace(
    function_sql,
    'select * into existing_result from public.underwriting_debt_schedule_results where id = existing_request.result_id;',
    'select * into existing_result from public.underwriting_debt_schedule_results result where result.id = existing_request.result_id;'
  );

  function_sql := replace(
    function_sql,
    'from public.underwriting_debt_schedule_results
  where workspace_id = target_workspace_id
    and debt_tranche_id = target_debt_tranche_id
    and result_hash = requested_result_hash;',
    'from public.underwriting_debt_schedule_results result
  where result.workspace_id = target_workspace_id
    and result.debt_tranche_id = target_debt_tranche_id
    and result.result_hash = requested_result_hash;'
  );

  execute function_sql;
end $$;

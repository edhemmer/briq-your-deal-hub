-- Spec 010 Slice 3 repair: use named constraints for deterministic idempotency
-- conflict handling so inference is explicit.

alter table public.governance_financial_analysis_results
  add constraint governance_financial_analysis_results_deterministic_unique
  unique using index idx_governance_financial_analysis_results_deterministic_all;

alter table public.governance_restriction_intelligence_results
  add constraint governance_restriction_intelligence_results_deterministic_unique
  unique using index idx_governance_restriction_intelligence_results_deterministic_a;

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('public.run_governance_financial_analysis(uuid,jsonb,text)'::regprocedure)
  into function_definition;
  function_definition := replace(function_definition, 'on conflict (workspace_id, governance_record_id, input_hash, result_hash)', 'on conflict on constraint governance_financial_analysis_results_deterministic_unique');
  execute function_definition;

  select pg_get_functiondef('public.run_governance_restriction_intelligence(uuid,jsonb,text)'::regprocedure)
  into function_definition;
  function_definition := replace(function_definition, 'on conflict (workspace_id, governance_record_id, source_governance_finding_id, source_governance_finding_version, result_hash)', 'on conflict on constraint governance_restriction_intelligence_results_deterministic_unique');
  execute function_definition;
end $$;

revoke all on function public.run_governance_financial_analysis(uuid, jsonb, text) from public;
revoke all on function public.run_governance_restriction_intelligence(uuid, jsonb, text) from public;
revoke execute on function public.run_governance_financial_analysis(uuid, jsonb, text) from public, anon;
revoke execute on function public.run_governance_restriction_intelligence(uuid, jsonb, text) from public, anon;
grant execute on function public.run_governance_financial_analysis(uuid, jsonb, text) to authenticated;
grant execute on function public.run_governance_restriction_intelligence(uuid, jsonb, text) to authenticated;

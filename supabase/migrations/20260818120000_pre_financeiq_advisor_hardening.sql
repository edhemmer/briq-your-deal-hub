-- Pre-FinanceIQ staging advisor hardening.
-- Keep underwriting read models subject to caller RLS instead of view-owner privileges.

alter view public.underwriting_run_summaries set (security_invoker = true);
alter view public.underwriting_core_outputs set (security_invoker = true);
alter view public.underwriting_output_group_results set (security_invoker = true);
alter view public.underwriting_result_details set (security_invoker = true);
alter view public.underwriting_latest_confirmed_results set (security_invoker = true);
alter view public.underwriting_run_comparison_basis set (security_invoker = true);
alter view public.underwriting_scenario_summaries set (security_invoker = true);
alter view public.underwriting_scenario_override_details set (security_invoker = true);
alter view public.underwriting_scenario_comparison_details set (security_invoker = true);
alter view public.underwriting_latest_scenario_versions set (security_invoker = true);
alter view public.underwriting_sensitivity_summaries set (security_invoker = true);
alter view public.underwriting_sensitivity_point_results set (security_invoker = true);

alter function public.underwriting_scenario_text_array(jsonb) set search_path = public, pg_temp;
alter function public.underwriting_scenario_numeric_array(jsonb) set search_path = public, pg_temp;
alter function public.normalize_contact_phone(text) set search_path = public, pg_temp;
alter function public.normalize_website_domain(text) set search_path = public, pg_temp;

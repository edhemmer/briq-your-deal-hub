-- Specification 009 Slice 4 advisor repair: cover comparison foreign keys.

create index if not exists idx_financing_scenario_comparison_results_created_by_fk
  on public.financing_scenario_comparison_results(created_by)
  where created_by is not null;

create index if not exists idx_financing_scenario_comparison_requests_workspace_deal_fk
  on public.financing_scenario_comparison_requests(workspace_id, deal_id);

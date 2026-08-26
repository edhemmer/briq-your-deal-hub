-- Specification 011 Slice 4 repair: add FK indexes found by staging smoke.

create index if not exists idx_contract_perspective_items_perspective_fk
  on public.contract_perspective_analysis_items(perspective);

create index if not exists idx_contract_amendment_impacts_deal_fk
  on public.contract_amendment_impact_results(workspace_id, deal_id);

create index if not exists idx_contract_amendment_impacts_property_fk
  on public.contract_amendment_impact_results(workspace_id, property_id);

-- Cover R4 Deal and Property foreign keys reported by the staging advisor.
create index idx_contractiq_summary_deal_fk
  on public.contractiq_buyer_summary_definitions(workspace_id,deal_id);
create index idx_contractiq_summary_property_fk
  on public.contractiq_buyer_summary_definitions(workspace_id,property_id);

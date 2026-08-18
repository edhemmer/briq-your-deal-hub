-- Spec 009 Slice 2 advisor repair: add covering indexes for new debt schedule
-- result/request foreign keys surfaced by staging advisor inspection.

create index if not exists idx_underwriting_debt_schedule_results_workspace_deal_fk
  on public.underwriting_debt_schedule_results(workspace_id, deal_id);

create index if not exists idx_underwriting_debt_schedule_results_calculated_by_fk
  on public.underwriting_debt_schedule_results(calculated_by);

create index if not exists idx_underwriting_debt_schedule_results_debt_tranche_fk
  on public.underwriting_debt_schedule_results(debt_tranche_id);

create index if not exists idx_underwriting_debt_schedule_requests_workspace_deal_fk
  on public.underwriting_debt_schedule_requests(workspace_id, deal_id);

create index if not exists idx_underwriting_debt_schedule_requests_result_fk
  on public.underwriting_debt_schedule_requests(result_id);

revoke execute on function public.create_underwriting_debt_schedule_result(uuid, uuid, uuid, uuid, text, integer, jsonb) from public, anon;
revoke execute on function public.list_financeiq_debt_schedule_projection(uuid) from public, anon;

grant execute on function public.create_underwriting_debt_schedule_result(uuid, uuid, uuid, uuid, text, integer, jsonb) to authenticated;
grant execute on function public.list_financeiq_debt_schedule_projection(uuid) to authenticated;

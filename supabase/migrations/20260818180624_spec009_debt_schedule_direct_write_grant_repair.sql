-- Repair Spec 009 Slice 2 direct table write privileges.
-- RLS already denies writes; table grants should deny direct writes too.

revoke insert, update, delete on public.underwriting_debt_schedule_results from authenticated;
revoke insert, update, delete on public.underwriting_debt_schedule_requests from authenticated;
grant select on public.underwriting_debt_schedule_results to authenticated;
grant select on public.underwriting_debt_schedule_requests to authenticated;

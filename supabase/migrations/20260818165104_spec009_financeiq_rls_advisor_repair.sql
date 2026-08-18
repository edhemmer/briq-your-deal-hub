-- Spec 009 advisor hardening: avoid per-row auth.uid() evaluation in the
-- FinanceIQ command-request read policy.

drop policy if exists "financing command requests read creator" on public.financing_command_requests;
create policy "financing command requests read creator" on public.financing_command_requests
  for select to authenticated
  using (
    created_by = (select auth.uid())
    and public.is_workspace_member(workspace_id)
  );

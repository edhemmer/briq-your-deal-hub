-- Specification 011 Slice 3 repair: add covering indexes for every new FK.

create index if not exists idx_contract_holiday_calendars_workspace
  on public.contract_holiday_calendars(workspace_id);
create index if not exists idx_contract_holiday_calendars_source_evidence_id
  on public.contract_holiday_calendars(source_evidence_id)
  where source_evidence_id is not null;
create index if not exists idx_contract_holiday_calendars_workspace_source_evidence
  on public.contract_holiday_calendars(workspace_id, source_evidence_id)
  where source_evidence_id is not null;
create index if not exists idx_contract_holiday_calendars_created_by
  on public.contract_holiday_calendars(created_by)
  where created_by is not null;
create index if not exists idx_contract_holiday_calendars_updated_by
  on public.contract_holiday_calendars(updated_by)
  where updated_by is not null;

create index if not exists idx_contract_deadline_results_workspace
  on public.contract_deadline_results(workspace_id);
create index if not exists idx_contract_deadline_results_deal_fk
  on public.contract_deadline_results(workspace_id, deal_id);
create index if not exists idx_contract_deadline_results_contract_fk
  on public.contract_deadline_results(workspace_id, contract_id);
create index if not exists idx_contract_deadline_results_contract_deadline_fk
  on public.contract_deadline_results(workspace_id, contract_deadline_id);
create index if not exists idx_contract_deadline_results_holiday_calendar_fk
  on public.contract_deadline_results(workspace_id, holiday_calendar_id)
  where holiday_calendar_id is not null;
create index if not exists idx_contract_deadline_results_source_evidence_id
  on public.contract_deadline_results(source_evidence_id)
  where source_evidence_id is not null;
create index if not exists idx_contract_deadline_results_workspace_source_evidence
  on public.contract_deadline_results(workspace_id, source_evidence_id)
  where source_evidence_id is not null;
create index if not exists idx_contract_deadline_results_status
  on public.contract_deadline_results(status);
create index if not exists idx_contract_deadline_results_created_by
  on public.contract_deadline_results(created_by)
  where created_by is not null;

create index if not exists idx_contract_deadline_links_workspace
  on public.contract_deadline_canonical_links(workspace_id);
create index if not exists idx_contract_deadline_links_deal_fk
  on public.contract_deadline_canonical_links(workspace_id, deal_id);
create index if not exists idx_contract_deadline_links_contract_fk
  on public.contract_deadline_canonical_links(workspace_id, contract_id);
create index if not exists idx_contract_deadline_links_contract_deadline_fk
  on public.contract_deadline_canonical_links(workspace_id, contract_deadline_id);
create index if not exists idx_contract_deadline_links_canonical_task_fk
  on public.contract_deadline_canonical_links(workspace_id, canonical_task_id)
  where canonical_task_id is not null;
create index if not exists idx_contract_deadline_links_created_by
  on public.contract_deadline_canonical_links(created_by)
  where created_by is not null;
create index if not exists idx_contract_deadline_links_updated_by
  on public.contract_deadline_canonical_links(updated_by)
  where updated_by is not null;

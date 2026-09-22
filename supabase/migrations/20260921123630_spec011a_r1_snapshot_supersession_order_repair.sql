create or replace function public.prepare_contractiq_report_snapshot_successor()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.is_current is not true then
    return new;
  end if;

  update public.contractiq_report_snapshots snapshot
  set snapshot_state = 'superseded',
      is_current = false,
      stale_reason = 'Material canonical state changed and a reconciled successor snapshot became current.',
      superseded_by_snapshot_id = new.id,
      reconciliation_status = 'stale',
      reconciliation_details = snapshot.reconciliation_details || jsonb_build_object(
        'supersededAt', now(),
        'supersededBySnapshotId', new.id
      ),
      last_reconciled_at = now()
  where snapshot.workspace_id = new.workspace_id
    and snapshot.deal_id = new.deal_id
    and snapshot.contract_id = new.contract_id
    and snapshot.perspective = new.perspective
    and snapshot.is_current is true
    and snapshot.id <> new.id;

  return new;
end;
$$;

revoke all on function public.prepare_contractiq_report_snapshot_successor() from public, anon, authenticated;

drop trigger if exists prepare_contractiq_report_snapshot_successor on public.contractiq_report_snapshots;
create trigger prepare_contractiq_report_snapshot_successor
before insert on public.contractiq_report_snapshots
for each row
when (new.is_current is true)
execute function public.prepare_contractiq_report_snapshot_successor();

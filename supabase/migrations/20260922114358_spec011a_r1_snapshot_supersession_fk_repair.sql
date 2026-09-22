create or replace function public.prepare_contractiq_report_snapshot_successor()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.is_current is true then
    update public.contractiq_report_snapshots snapshot
    set is_current = false
    where snapshot.workspace_id = new.workspace_id
      and snapshot.deal_id = new.deal_id
      and snapshot.contract_id = new.contract_id
      and snapshot.perspective = new.perspective
      and snapshot.is_current is true
      and snapshot.id <> new.id;
  end if;

  return new;
end;
$$;

revoke all on function public.prepare_contractiq_report_snapshot_successor() from public, anon, authenticated;

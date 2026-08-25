create or replace function public.record_contract_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_contract_id uuid;
  reason text := 'updated';
begin
  if TG_TABLE_NAME = 'contracts' then
    parent_contract_id := old.id;
    if new.archived_at is not null and old.archived_at is null then
      reason := 'archived';
    end if;
  else
    parent_contract_id := old.contract_id;
    if TG_TABLE_NAME = 'contract_terms' then
      reason := coalesce(new.proposal_state, 'updated');
    elsif TG_TABLE_NAME = 'contract_conflicts' then
      reason := coalesce(new.resolution_state, 'updated');
    end if;
  end if;

  insert into public.contract_record_versions (workspace_id, contract_id, record_table, record_id, record_version, snapshot, changed_by, change_reason)
  values (
    old.workspace_id,
    parent_contract_id,
    TG_TABLE_NAME,
    old.id,
    old.version,
    to_jsonb(old),
    new.updated_by,
    reason
  )
  on conflict (record_table, record_id, record_version) do nothing;
  return new;
end;
$$;

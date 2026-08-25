-- Specification 010 Slice 4 repair: reject stale accepted-finding propagation
-- payloads before they can create downstream proposal state.

alter table public.governance_command_requests
  add column if not exists request_body jsonb not null default '{}'::jsonb
  check (jsonb_typeof(request_body) = 'object');

create or replace function public.ensure_governance_command(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_property_id uuid,
  target_governance_record_id uuid,
  command_name text,
  idempotency_key text,
  request_body jsonb
)
returns public.governance_command_requests
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  safe_request_body jsonb := public.safe_event_jsonb(coalesce(request_body, '{}'::jsonb));
  request_hash text;
  existing_request public.governance_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely save GovernanceIQ changes.' using errcode = '22023'; end if;

  request_hash := md5(
    target_workspace_id::text ||
    coalesce(target_deal_id::text, '') ||
    coalesce(target_property_id::text, '') ||
    coalesce(target_governance_record_id::text, '') ||
    command_name ||
    coalesce(safe_request_body::text, '{}')
  );

  insert into public.governance_command_requests (
    workspace_id,
    deal_id,
    property_id,
    governance_record_id,
    command_name,
    idempotency_key,
    request_hash,
    request_body,
    created_by
  )
  values (
    target_workspace_id,
    target_deal_id,
    target_property_id,
    target_governance_record_id,
    command_name,
    cleaned_key,
    request_hash,
    safe_request_body,
    current_user_id
  )
  on conflict on constraint governance_command_requests_workspace_id_idempotency_key_key do nothing;

  select *
  into existing_request
  from public.governance_command_requests
  where public.governance_command_requests.workspace_id = target_workspace_id
    and public.governance_command_requests.idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash or existing_request.command_name <> command_name then
    raise exception 'This retry key was already used for a different GovernanceIQ command.' using errcode = '23505';
  end if;

  return existing_request;
end;
$$;

create or replace function public.enforce_governance_change_expected_version()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  expected_finding_version integer;
begin
  select nullif(command.request_body ->> 'expectedFindingVersion', '')::integer
  into expected_finding_version
  from public.governance_command_requests command
  where command.workspace_id = new.workspace_id
    and command.idempotency_key = new.idempotency_key
    and command.command_name = 'propagate_accepted_governance_change'
  order by command.created_at desc
  limit 1;

  if expected_finding_version is not null and expected_finding_version <> new.finding_version then
    raise exception 'Stale governance finding version cannot overwrite newer accepted finding.'
      using errcode = '40001';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_governance_change_expected_version
  on public.governance_change_propagations;
create trigger enforce_governance_change_expected_version
before insert or update of finding_version, idempotency_key
on public.governance_change_propagations
for each row execute function public.enforce_governance_change_expected_version();

revoke all on function public.enforce_governance_change_expected_version() from public, anon, authenticated;
revoke all on function public.ensure_governance_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public;
revoke execute on function public.ensure_governance_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public, anon;

create or replace function public.ensure_contract_command(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_property_id uuid,
  target_contract_id uuid,
  command_name text,
  idempotency_key text,
  request_body jsonb
)
returns public.contract_command_requests
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  request_hash text;
  expected_command_name text := command_name;
  existing_request public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely save ContractIQ changes.' using errcode = '22023'; end if;
  request_hash := md5(target_workspace_id::text || coalesce(target_deal_id::text, '') || coalesce(target_property_id::text, '') || coalesce(target_contract_id::text, '') || expected_command_name || coalesce(request_body::text, '{}'));

  insert into public.contract_command_requests (workspace_id, deal_id, property_id, contract_id, command_name, idempotency_key, request_hash, created_by)
  values (target_workspace_id, target_deal_id, target_property_id, target_contract_id, expected_command_name, cleaned_key, request_hash, current_user_id)
  on conflict on constraint contract_command_requests_workspace_id_idempotency_key_key do nothing;

  select * into existing_request
  from public.contract_command_requests
  where contract_command_requests.workspace_id = target_workspace_id
    and contract_command_requests.idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash or existing_request.command_name <> expected_command_name then
    raise exception 'This retry key was already used for a different ContractIQ command.' using errcode = '23505';
  end if;

  return existing_request;
end;
$$;

revoke execute on function public.ensure_contract_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public, anon;
revoke execute on function public.ensure_contract_command(uuid, uuid, uuid, uuid, text, text, jsonb) from authenticated;

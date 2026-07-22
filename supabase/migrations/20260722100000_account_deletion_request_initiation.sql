create or replace function public.request_brix_account_deletion(request_source text default 'web')
returns table (
  request_id uuid,
  status text,
  requested_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  safe_source text := lower(coalesce(nullif(trim(request_source), ''), 'web'));
  existing_request record;
  created_request_id uuid;
  created_requested_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if safe_source not in ('web', 'ios', 'ipad') then
    safe_source := 'web';
  end if;

  perform pg_advisory_xact_lock(hashtext(current_user_id::text));

  update public.brix_profiles
     set account_delete_requested_at = coalesce(account_delete_requested_at, now()),
         updated_at = now()
   where id = current_user_id;

  select id, public.account_deletion_requests.status, public.account_deletion_requests.requested_at
    into existing_request
    from public.account_deletion_requests
   where user_id = current_user_id
     and public.account_deletion_requests.status in ('requested', 'processing')
   order by requested_at desc
   limit 1
   for update;

  if found then
    request_id := existing_request.id;
    status := existing_request.status;
    requested_at := existing_request.requested_at;
    return next;
    return;
  end if;

  insert into public.account_deletion_requests (user_id, status, request_source)
  values (current_user_id, 'requested', safe_source)
  returning id, public.account_deletion_requests.requested_at
    into created_request_id, created_requested_at;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (
    null,
    current_user_id,
    'account.deletion_requested',
    jsonb_build_object('request_id', created_request_id, 'request_source', safe_source)
  );

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (
    null,
    current_user_id,
    'account.deletion_requested',
    'account_deletion_requests',
    created_request_id,
    jsonb_build_object('request_source', safe_source)
  );

  request_id := created_request_id;
  status := 'requested';
  requested_at := created_requested_at;
  return next;
end;
$$;

grant execute on function public.request_brix_account_deletion(text) to authenticated;

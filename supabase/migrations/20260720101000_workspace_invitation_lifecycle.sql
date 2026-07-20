create extension if not exists pgcrypto;

alter table public.workspace_invitations
  add column if not exists normalized_email text,
  add column if not exists token_hash text,
  add column if not exists accepted_by uuid references auth.users(id) on delete set null,
  add column if not exists revoked_at timestamptz,
  add column if not exists resent_at timestamptz;

update public.workspace_invitations
set normalized_email = lower(trim(email))
where normalized_email is null;

create unique index if not exists workspace_invitations_one_pending_email
  on public.workspace_invitations (workspace_id, normalized_email)
  where status = 'pending';

create index if not exists workspace_invitations_token_hash_idx
  on public.workspace_invitations (token_hash)
  where token_hash is not null;

create index if not exists workspace_invitations_workspace_status_idx
  on public.workspace_invitations (workspace_id, status, created_at desc);

create or replace function public.normalize_invitation_email(invite_email text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(trim(coalesce(invite_email, '')));
$$;

create or replace function public.hash_invitation_token(invitation_token text)
returns text
language sql
immutable
set search_path = public
as $$
  select encode(extensions.digest(convert_to(coalesce(invitation_token, ''), 'UTF8'), 'sha256'), 'hex');
$$;

create or replace function public.create_workspace_invitation(
  target_workspace_id uuid,
  invite_email text,
  invite_role_id text default 'viewer'
)
returns table (
  invitation_id uuid,
  invited_email text,
  role_id text,
  status text,
  expires_at timestamptz,
  invitation_link text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_email text := public.normalize_invitation_email(invite_email);
  raw_token text;
  hashed_token text;
  existing_invitation_id uuid;
  existing_member_id uuid;
  event_name text := 'invitation.created';
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if cleaned_email = '' or cleaned_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid invitation email.' using errcode = '22023';
  end if;

  if not public.has_workspace_permission(target_workspace_id, 'members:manage') then
    raise exception 'You do not have permission to invite workspace members.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.workspaces where id = target_workspace_id and status = 'active') then
    raise exception 'Workspace is not available.' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.roles where id = invite_role_id and id <> 'owner') then
    raise exception 'Invitation role is not available.' using errcode = '22023';
  end if;

  select membership.id
  into existing_member_id
  from public.workspace_memberships membership
  join auth.users users on users.id = membership.user_id
  where membership.workspace_id = target_workspace_id
    and lower(users.email) = cleaned_email
    and membership.status = 'active'
  limit 1;

  if existing_member_id is not null then
    invitation_id := null;
    invited_email := cleaned_email;
    role_id := invite_role_id;
    status := 'already_member';
    expires_at := null;
    invitation_link := null;
    return next;
    return;
  end if;

  update public.workspace_invitations
  set status = 'expired',
      updated_at = now()
  where public.workspace_invitations.workspace_id = target_workspace_id
    and public.workspace_invitations.normalized_email = cleaned_email
    and public.workspace_invitations.status = 'pending'
    and public.workspace_invitations.expires_at is not null
    and public.workspace_invitations.expires_at <= now();

  raw_token := encode(gen_random_bytes(32), 'hex');
  hashed_token := public.hash_invitation_token(raw_token);

  select id
  into existing_invitation_id
  from public.workspace_invitations
  where public.workspace_invitations.workspace_id = target_workspace_id
    and public.workspace_invitations.normalized_email = cleaned_email
    and public.workspace_invitations.status = 'pending'
  for update;

  if existing_invitation_id is not null then
    event_name := 'invitation.resent';
    update public.workspace_invitations
    set email = cleaned_email,
        role_id = invite_role_id,
        token_hash = hashed_token,
        invited_by = current_user_id,
        expires_at = now() + interval '7 days',
        resent_at = now(),
        updated_at = now()
    where id = existing_invitation_id
    returning id, email, public.workspace_invitations.role_id, public.workspace_invitations.status, public.workspace_invitations.expires_at
    into invitation_id, invited_email, role_id, status, expires_at;
  else
    insert into public.workspace_invitations (
      workspace_id,
      email,
      normalized_email,
      role_id,
      status,
      token_hash,
      invited_by,
      expires_at
    )
    values (
      target_workspace_id,
      cleaned_email,
      cleaned_email,
      invite_role_id,
      'pending',
      hashed_token,
      current_user_id,
      now() + interval '7 days'
    )
    returning id, email, public.workspace_invitations.role_id, public.workspace_invitations.status, public.workspace_invitations.expires_at
    into invitation_id, invited_email, role_id, status, expires_at;
  end if;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (
    target_workspace_id,
    current_user_id,
    event_name,
    jsonb_build_object('invitation_id', invitation_id, 'email', cleaned_email, 'role_id', role_id)
  );

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (
    target_workspace_id,
    current_user_id,
    event_name,
    'workspace_invitations',
    invitation_id,
    jsonb_build_object('email', cleaned_email, 'role_id', role_id)
  );

  invitation_link := 'https://www.brixrealestate.app/account?invite=' || raw_token;
  return next;
end;
$$;

create or replace function public.accept_workspace_invitation(invitation_token text)
returns table (
  invitation_id uuid,
  workspace_id uuid,
  workspace_name text,
  membership_id uuid,
  role_id text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  hashed_token text := public.hash_invitation_token(invitation_token);
  invitation_record record;
  inserted_membership_id uuid;
  inserted_role_id text;
begin
  if current_user_id is null then
    raise exception 'Authentication required to accept this invitation.' using errcode = '42501';
  end if;

  if coalesce(invitation_token, '') = '' then
    raise exception 'Invitation link is invalid.' using errcode = '22023';
  end if;

  select lower(email)
  into current_email
  from auth.users
  where id = current_user_id;

  select invitation.*, workspace.name as target_workspace_name, workspace.status as workspace_status
  into invitation_record
  from public.workspace_invitations invitation
  join public.workspaces workspace on workspace.id = invitation.workspace_id
  where invitation.token_hash = hashed_token
  for update;

  if invitation_record.id is null then
    raise exception 'Invitation link is invalid or already used.' using errcode = 'P0002';
  end if;

  if invitation_record.workspace_status <> 'active' then
    raise exception 'Workspace is not available.' using errcode = 'P0002';
  end if;

  if invitation_record.status = 'revoked' then
    raise exception 'Invitation has been revoked.' using errcode = 'P0002';
  end if;

  if invitation_record.status = 'accepted' then
    raise exception 'Invitation has already been accepted.' using errcode = '23505';
  end if;

  if invitation_record.expires_at is not null and invitation_record.expires_at <= now() then
    update public.workspace_invitations
    set status = 'expired', updated_at = now()
    where id = invitation_record.id;
    raise exception 'Invitation has expired.' using errcode = 'P0002';
  end if;

  if current_email is distinct from invitation_record.normalized_email then
    raise exception 'Sign in with the invited email address to accept this invitation.' using errcode = '42501';
  end if;

  insert into public.profiles (id, email)
  values (current_user_id, current_email)
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  insert into public.workspace_memberships (workspace_id, user_id, role_id, status)
  values (invitation_record.workspace_id, current_user_id, invitation_record.role_id, 'active')
  on conflict (workspace_id, user_id) do update set
    role_id = excluded.role_id,
    status = 'active',
    updated_at = now()
  returning id, public.workspace_memberships.role_id
  into inserted_membership_id, inserted_role_id;

  update public.workspace_invitations
  set status = 'accepted',
      accepted_at = now(),
      accepted_by = current_user_id,
      token_hash = null,
      updated_at = now()
  where id = invitation_record.id;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values
    (invitation_record.workspace_id, current_user_id, 'invitation.accepted', jsonb_build_object('invitation_id', invitation_record.id, 'role_id', inserted_role_id)),
    (invitation_record.workspace_id, current_user_id, 'membership.created', jsonb_build_object('membership_id', inserted_membership_id, 'role_id', inserted_role_id));

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values
    (invitation_record.workspace_id, current_user_id, 'invitation.accepted', 'workspace_invitations', invitation_record.id, jsonb_build_object('role_id', inserted_role_id)),
    (invitation_record.workspace_id, current_user_id, 'membership.created', 'workspace_memberships', inserted_membership_id, jsonb_build_object('role_id', inserted_role_id));

  invitation_id := invitation_record.id;
  workspace_id := invitation_record.workspace_id;
  workspace_name := invitation_record.target_workspace_name;
  membership_id := inserted_membership_id;
  role_id := inserted_role_id;
  status := 'accepted';
  return next;
end;
$$;

create or replace function public.revoke_workspace_invitation(target_invitation_id uuid)
returns table (
  invitation_id uuid,
  invited_email text,
  role_id text,
  status text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select workspace_id
  into target_workspace_id
  from public.workspace_invitations
  where id = target_invitation_id;

  if target_workspace_id is null then
    raise exception 'Invitation was not found.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(target_workspace_id, 'members:manage') then
    raise exception 'You do not have permission to revoke invitations.' using errcode = '42501';
  end if;

  update public.workspace_invitations
  set status = 'revoked',
      revoked_at = now(),
      token_hash = null,
      updated_at = now()
  where id = target_invitation_id
    and public.workspace_invitations.status = 'pending'
  returning
    id,
    email,
    public.workspace_invitations.role_id,
    public.workspace_invitations.status,
    public.workspace_invitations.expires_at
  into invitation_id, invited_email, role_id, status, expires_at;

  if invitation_id is null then
    raise exception 'Only pending invitations can be revoked.' using errcode = '22023';
  end if;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (target_workspace_id, current_user_id, 'invitation.revoked', jsonb_build_object('invitation_id', invitation_id));

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (target_workspace_id, current_user_id, 'invitation.revoked', 'workspace_invitations', invitation_id, '{}'::jsonb);

  return next;
end;
$$;

create or replace function public.resend_workspace_invitation(target_invitation_id uuid)
returns table (
  invitation_id uuid,
  invited_email text,
  role_id text,
  status text,
  expires_at timestamptz,
  invitation_link text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_record record;
begin
  select *
  into invitation_record
  from public.workspace_invitations
  where id = target_invitation_id;

  if invitation_record.id is null then
    raise exception 'Invitation was not found.' using errcode = 'P0002';
  end if;

  if invitation_record.status <> 'pending' then
    raise exception 'Only pending invitations can be resent.' using errcode = '22023';
  end if;

  return query
  select *
  from public.create_workspace_invitation(invitation_record.workspace_id, invitation_record.normalized_email, invitation_record.role_id);
end;
$$;

grant execute on function public.create_workspace_invitation(uuid, text, text) to authenticated;
grant execute on function public.accept_workspace_invitation(text) to authenticated;
grant execute on function public.revoke_workspace_invitation(uuid) to authenticated;
grant execute on function public.resend_workspace_invitation(uuid) to authenticated;

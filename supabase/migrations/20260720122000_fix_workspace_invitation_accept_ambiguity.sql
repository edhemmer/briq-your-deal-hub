-- Repair production accept function to avoid output-variable ambiguity in membership upsert.

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
  on conflict on constraint workspace_memberships_workspace_id_user_id_key do update set
    role_id = excluded.role_id,
    status = 'active',
    updated_at = now()
  returning public.workspace_memberships.id, public.workspace_memberships.role_id
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
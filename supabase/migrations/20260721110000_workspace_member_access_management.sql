-- Add canonical collaborator role enforcement and audited workspace-access revocation.

alter table public.workspace_memberships
  add column if not exists accepted_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references auth.users(id) on delete set null,
  add column if not exists revocation_reason text,
  add column if not exists role_changed_at timestamptz,
  add column if not exists role_changed_by uuid references auth.users(id) on delete set null;

update public.workspace_memberships
set accepted_at = created_at
where status = 'active'
  and accepted_at is null;

insert into public.roles (id, name, description)
values
  ('admin', 'Administrator', 'Can manage workspace settings, invitations, members, and deal work.'),
  ('analyst', 'Analyst', 'Can review deal information and run analysis without managing workspace access.'),
  ('contributor', 'Contributor', 'Can add and update deal work without managing workspace access.'),
  ('viewer', 'Viewer', 'Can view workspace information without changing deal work or access.'),
  ('billing_admin', 'Billing Administrator', 'Can manage billing-related settings without managing deal work or access.'),
  ('platform_admin', 'Platform Administrator', 'Reserved for BRIX platform support outside normal workspace access.')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.role_permissions (role_id, permission)
values
  ('analyst', 'workspace:read'),
  ('analyst', 'deals:read'),
  ('analyst', 'underwriting:run'),
  ('analyst', 'strategy:read'),
  ('contributor', 'workspace:read'),
  ('contributor', 'deals:manage'),
  ('contributor', 'evidence:upload'),
  ('viewer', 'workspace:read'),
  ('billing_admin', 'workspace:read'),
  ('billing_admin', 'billing:manage'),
  ('platform_admin', 'platform:admin')
on conflict (role_id, permission) do nothing;

create index if not exists idx_workspace_memberships_workspace_status
  on public.workspace_memberships(workspace_id, status);

create index if not exists idx_workspace_memberships_user_status
  on public.workspace_memberships(user_id, status);

drop policy if exists "memberships manage permission" on public.workspace_memberships;
drop policy if exists "memberships no direct insert" on public.workspace_memberships;
create policy "memberships no direct insert"
  on public.workspace_memberships for insert to authenticated
  with check (false);

drop policy if exists "memberships no direct update" on public.workspace_memberships;
create policy "memberships no direct update"
  on public.workspace_memberships for update to authenticated
  using (false)
  with check (false);

drop policy if exists "memberships no direct delete" on public.workspace_memberships;
create policy "memberships no direct delete"
  on public.workspace_memberships for delete to authenticated
  using (false);

create or replace function public.list_workspace_access_roles()
returns table (
  role_id text,
  role_name text,
  role_description text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    roles.id as role_id,
    roles.name as role_name,
    roles.description as role_description
  from public.roles roles
  where roles.id in ('admin', 'analyst', 'contributor', 'viewer', 'billing_admin')
  order by case roles.id
    when 'admin' then 1
    when 'analyst' then 2
    when 'contributor' then 3
    when 'viewer' then 4
    when 'billing_admin' then 5
    else 99
  end;
$$;

grant execute on function public.list_workspace_access_roles() to authenticated;

create or replace function public.list_workspace_memberships(target_workspace_id uuid)
returns table (
  membership_id uuid,
  workspace_id uuid,
  user_id uuid,
  email text,
  full_name text,
  role_id text,
  role_name text,
  role_description text,
  status text,
  joined_at timestamptz,
  invited_at timestamptz,
  updated_at timestamptz,
  revoked_at timestamptz,
  can_change_role boolean,
  can_revoke boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  actor_can_manage boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'Workspace access is not available.' using errcode = '42501';
  end if;

  actor_can_manage := public.has_workspace_permission(target_workspace_id, 'members:manage');

  return query
  select
    membership.id as membership_id,
    membership.workspace_id,
    membership.user_id,
    coalesce(users.email, profile.email, '') as email,
    nullif(coalesce(profile.full_name, users.raw_user_meta_data ->> 'full_name', ''), '') as full_name,
    membership.role_id,
    roles.name as role_name,
    roles.description as role_description,
    membership.status,
    coalesce(membership.accepted_at, membership.created_at) as joined_at,
    invitation.invited_at,
    membership.updated_at,
    membership.revoked_at,
    (
      actor_can_manage
      and membership.status = 'active'
      and membership.user_id <> current_user_id
      and membership.role_id <> 'owner'
    ) as can_change_role,
    (
      actor_can_manage
      and membership.status = 'active'
      and membership.user_id <> current_user_id
      and membership.role_id <> 'owner'
    ) as can_revoke
  from public.workspace_memberships membership
  join public.roles roles on roles.id = membership.role_id
  left join public.profiles profile on profile.id = membership.user_id
  left join auth.users users on users.id = membership.user_id
  left join lateral (
    select max(workspace_invitations.created_at) as invited_at
    from public.workspace_invitations workspace_invitations
    where workspace_invitations.workspace_id = membership.workspace_id
      and workspace_invitations.accepted_by = membership.user_id
  ) invitation on true
  where membership.workspace_id = target_workspace_id
    and membership.status in ('active', 'revoked')
  order by
    case membership.role_id when 'owner' then 0 when 'admin' then 1 else 2 end,
    membership.status,
    coalesce(profile.full_name, users.email, profile.email, membership.user_id::text);
end;
$$;

grant execute on function public.list_workspace_memberships(uuid) to authenticated;

create or replace function public.change_workspace_member_role(
  target_membership_id uuid,
  new_role_id text,
  expected_updated_at timestamptz default null
)
returns table (
  membership_id uuid,
  workspace_id uuid,
  user_id uuid,
  role_id text,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.workspace_memberships%rowtype;
  before_role_id text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select *
  into target_record
  from public.workspace_memberships
  where id = target_membership_id
  for update;

  if target_record.id is null then
    raise exception 'Workspace access record was not found.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(target_record.workspace_id, 'members:manage') then
    raise exception 'You do not have permission to change workspace access.' using errcode = '42501';
  end if;

  if target_record.user_id = current_user_id then
    raise exception 'You cannot change your own access level.' using errcode = '42501';
  end if;

  if target_record.role_id = 'owner' then
    raise exception 'The workspace owner cannot be changed here.' using errcode = '42501';
  end if;

  if target_record.status <> 'active' then
    raise exception 'Only active workspace access can be changed.' using errcode = '22023';
  end if;

  if new_role_id in ('owner', 'platform_admin') then
    raise exception 'That access level is not available for workspace collaborators.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.list_workspace_access_roles() roles where roles.role_id = new_role_id) then
    raise exception 'That access level is not available.' using errcode = '22023';
  end if;

  if target_record.role_id = new_role_id then
    membership_id := target_record.id;
    workspace_id := target_record.workspace_id;
    user_id := target_record.user_id;
    role_id := target_record.role_id;
    status := target_record.status;
    updated_at := target_record.updated_at;
    return next;
    return;
  end if;

  if expected_updated_at is not null and target_record.updated_at is distinct from expected_updated_at then
    raise exception 'Workspace access changed. Refresh and try again.' using errcode = '40001';
  end if;

  before_role_id := target_record.role_id;

  update public.workspace_memberships
  set role_id = new_role_id,
      role_changed_at = now(),
      role_changed_by = current_user_id,
      updated_at = now()
  where id = target_record.id
  returning
    public.workspace_memberships.id,
    public.workspace_memberships.workspace_id,
    public.workspace_memberships.user_id,
    public.workspace_memberships.role_id,
    public.workspace_memberships.status,
    public.workspace_memberships.updated_at
  into membership_id, workspace_id, user_id, role_id, status, updated_at;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (
    workspace_id,
    current_user_id,
    'membership.role_changed',
    jsonb_build_object('membership_id', membership_id, 'target_user_id', user_id, 'previous_role_id', before_role_id, 'new_role_id', role_id)
  );

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (
    workspace_id,
    current_user_id,
    'membership.role_changed',
    'workspace_memberships',
    membership_id,
    jsonb_build_object('target_user_id', user_id, 'previous_role_id', before_role_id, 'new_role_id', role_id)
  );

  return next;
end;
$$;

grant execute on function public.change_workspace_member_role(uuid, text, timestamptz) to authenticated;

create or replace function public.revoke_workspace_member(
  target_membership_id uuid,
  expected_updated_at timestamptz default null,
  revoke_reason text default null
)
returns table (
  membership_id uuid,
  workspace_id uuid,
  user_id uuid,
  role_id text,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_record public.workspace_memberships%rowtype;
  before_status text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select *
  into target_record
  from public.workspace_memberships
  where id = target_membership_id
  for update;

  if target_record.id is null then
    raise exception 'Workspace access record was not found.' using errcode = 'P0002';
  end if;

  if not public.has_workspace_permission(target_record.workspace_id, 'members:manage') then
    raise exception 'You do not have permission to remove workspace access.' using errcode = '42501';
  end if;

  if target_record.user_id = current_user_id then
    raise exception 'The workspace owner must remain active. Owner self-leave is not available here.' using errcode = '42501';
  end if;

  if target_record.role_id = 'owner' then
    raise exception 'The workspace owner cannot be removed here.' using errcode = '42501';
  end if;

  if target_record.status = 'revoked' then
    membership_id := target_record.id;
    workspace_id := target_record.workspace_id;
    user_id := target_record.user_id;
    role_id := target_record.role_id;
    status := target_record.status;
    updated_at := target_record.updated_at;
    return next;
    return;
  end if;

  if target_record.status <> 'active' then
    raise exception 'Only active workspace access can be removed.' using errcode = '22023';
  end if;

  if expected_updated_at is not null and target_record.updated_at is distinct from expected_updated_at then
    raise exception 'Workspace access changed. Refresh and try again.' using errcode = '40001';
  end if;

  before_status := target_record.status;

  update public.workspace_memberships
  set status = 'revoked',
      revoked_at = now(),
      revoked_by = current_user_id,
      revocation_reason = nullif(revoke_reason, ''),
      updated_at = now()
  where id = target_record.id
  returning
    public.workspace_memberships.id,
    public.workspace_memberships.workspace_id,
    public.workspace_memberships.user_id,
    public.workspace_memberships.role_id,
    public.workspace_memberships.status,
    public.workspace_memberships.updated_at
  into membership_id, workspace_id, user_id, role_id, status, updated_at;

  insert into public.domain_events (workspace_id, actor_id, event_type, payload)
  values (
    workspace_id,
    current_user_id,
    'membership.revoked',
    jsonb_build_object('membership_id', membership_id, 'target_user_id', user_id, 'previous_status', before_status, 'new_status', status)
  );

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
  values (
    workspace_id,
    current_user_id,
    'membership.revoked',
    'workspace_memberships',
    membership_id,
    jsonb_build_object('target_user_id', user_id, 'previous_status', before_status, 'new_status', status, 'reason_present', revoke_reason is not null and revoke_reason <> '')
  );

  return next;
end;
$$;

grant execute on function public.revoke_workspace_member(uuid, timestamptz, text) to authenticated;

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

  if not exists (select 1 from public.workspaces where public.workspaces.id = target_workspace_id and public.workspaces.status = 'active') then
    raise exception 'Workspace is not available.' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.list_workspace_access_roles() roles where roles.role_id = invite_role_id) then
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

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
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

grant execute on function public.create_workspace_invitation(uuid, text, text) to authenticated;

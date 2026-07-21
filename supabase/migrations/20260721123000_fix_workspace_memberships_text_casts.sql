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
  actor_can_manage boolean := false;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'Workspace access required.' using errcode = '42501';
  end if;

  actor_can_manage := public.has_workspace_permission(target_workspace_id, 'members:manage');

  return query
  select
    membership.id as membership_id,
    membership.workspace_id,
    membership.user_id,
    coalesce(users.email::text, profile.email::text, '') as email,
    nullif(coalesce(profile.full_name::text, users.raw_user_meta_data ->> 'full_name', ''), '') as full_name,
    membership.role_id::text as role_id,
    roles.name::text as role_name,
    roles.description::text as role_description,
    membership.status::text as status,
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
    coalesce(profile.full_name::text, users.email::text, profile.email::text, membership.user_id::text);
end;
$$;

grant execute on function public.list_workspace_memberships(uuid) to authenticated;

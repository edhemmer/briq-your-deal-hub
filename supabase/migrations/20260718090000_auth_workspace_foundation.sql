create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id text primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id text not null references public.roles(id) on delete cascade,
  permission text not null,
  created_at timestamptz not null default now(),
  primary key (role_id, permission)
);

create table if not exists public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id text not null references public.roles(id),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role_id text not null references public.roles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.domain_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.roles (id, name, description)
values
  ('owner', 'Owner', 'Full workspace ownership and billing authority.'),
  ('admin', 'Admin', 'Workspace administration without ownership transfer.'),
  ('member', 'Member', 'Standard workspace contributor.'),
  ('viewer', 'Viewer', 'Read-only workspace access.')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.role_permissions (role_id, permission)
values
  ('owner', 'workspace:read'),
  ('owner', 'workspace:update'),
  ('owner', 'workspace:delete'),
  ('owner', 'members:manage'),
  ('owner', 'deals:manage'),
  ('owner', 'billing:manage'),
  ('admin', 'workspace:read'),
  ('admin', 'workspace:update'),
  ('admin', 'members:manage'),
  ('admin', 'deals:manage'),
  ('member', 'workspace:read'),
  ('member', 'deals:manage'),
  ('viewer', 'workspace:read')
on conflict (role_id, permission) do nothing;

alter table public.workspaces enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.domain_events enable row level security;
alter table public.audit_events enable row level security;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_workspaces_updated_at on public.workspaces;
create trigger touch_workspaces_updated_at
before update on public.workspaces
for each row execute function public.touch_updated_at();

drop trigger if exists touch_workspace_memberships_updated_at on public.workspace_memberships;
create trigger touch_workspace_memberships_updated_at
before update on public.workspace_memberships
for each row execute function public.touch_updated_at();

drop trigger if exists touch_workspace_invitations_updated_at on public.workspace_invitations;
create trigger touch_workspace_invitations_updated_at
before update on public.workspace_invitations
for each row execute function public.touch_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.workspace_memberships membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.has_workspace_permission(target_workspace_id uuid, required_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.workspace_memberships membership
    join public.role_permissions permission on permission.role_id = membership.role_id
    where membership.workspace_id = target_workspace_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and permission.permission = required_permission
  );
$$;

drop policy if exists "workspaces read active members" on public.workspaces;
create policy "workspaces read active members"
  on public.workspaces for select to authenticated
  using (public.is_workspace_member(id));

drop policy if exists "workspaces owner insert" on public.workspaces;
create policy "workspaces owner insert"
  on public.workspaces for insert to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "workspaces owners update" on public.workspaces;
create policy "workspaces owners update"
  on public.workspaces for update to authenticated
  using (public.has_workspace_permission(id, 'workspace:update'))
  with check (public.has_workspace_permission(id, 'workspace:update'));

drop policy if exists "roles readable authenticated" on public.roles;
create policy "roles readable authenticated"
  on public.roles for select to authenticated
  using (true);

drop policy if exists "role permissions readable authenticated" on public.role_permissions;
create policy "role permissions readable authenticated"
  on public.role_permissions for select to authenticated
  using (true);

drop policy if exists "memberships read workspace members" on public.workspace_memberships;
create policy "memberships read workspace members"
  on public.workspace_memberships for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "memberships manage permission" on public.workspace_memberships;
create policy "memberships manage permission"
  on public.workspace_memberships for all to authenticated
  using (public.has_workspace_permission(workspace_id, 'members:manage'))
  with check (public.has_workspace_permission(workspace_id, 'members:manage'));

drop policy if exists "invitations read workspace members" on public.workspace_invitations;
create policy "invitations read workspace members"
  on public.workspace_invitations for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "invitations manage members" on public.workspace_invitations;
create policy "invitations manage members"
  on public.workspace_invitations for all to authenticated
  using (public.has_workspace_permission(workspace_id, 'members:manage'))
  with check (public.has_workspace_permission(workspace_id, 'members:manage'));

drop policy if exists "domain events read workspace members" on public.domain_events;
create policy "domain events read workspace members"
  on public.domain_events for select to authenticated
  using (workspace_id is null or public.is_workspace_member(workspace_id));

drop policy if exists "domain events insert actor" on public.domain_events;
create policy "domain events insert actor"
  on public.domain_events for insert to authenticated
  with check (actor_id = auth.uid() and (workspace_id is null or public.is_workspace_member(workspace_id)));

drop policy if exists "audit events read workspace members" on public.audit_events;
create policy "audit events read workspace members"
  on public.audit_events for select to authenticated
  using (workspace_id is null or public.is_workspace_member(workspace_id));

drop policy if exists "audit events insert actor" on public.audit_events;
create policy "audit events insert actor"
  on public.audit_events for insert to authenticated
  with check (actor_id = auth.uid() and (workspace_id is null or public.is_workspace_member(workspace_id)));

create or replace function public.ensure_workspace_context()
returns table (
  profile_id uuid,
  workspace_id uuid,
  workspace_name text,
  role_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  current_full_name text;
begin
  if current_user_id is null then
    raise exception 'Authentication required to create a BRIX workspace.' using errcode = '42501';
  end if;

  select
    coalesce(users.email, ''),
    nullif(coalesce(users.raw_user_meta_data ->> 'full_name', ''), '')
  into current_email, current_full_name
  from auth.users users
  where users.id = current_user_id;

  insert into public.profiles (id, email, full_name)
  values (current_user_id, current_email, current_full_name)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

  select membership.workspace_id, workspace.name, membership.role_id
  into workspace_id, workspace_name, role_id
  from public.workspace_memberships membership
  join public.workspaces workspace on workspace.id = membership.workspace_id
  where membership.user_id = current_user_id
    and membership.status = 'active'
    and workspace.status = 'active'
  order by
    case membership.role_id when 'owner' then 0 when 'admin' then 1 else 2 end,
    membership.created_at
  limit 1;

  if workspace_id is null then
    insert into public.workspaces (name, owner_user_id)
    values (
      case
        when current_email <> '' then split_part(current_email, '@', 1) || '''s BRIX Workspace'
        else 'My BRIX Workspace'
      end,
      current_user_id
    )
    returning id, name into workspace_id, workspace_name;

    insert into public.workspace_memberships (workspace_id, user_id, role_id, status)
    values (workspace_id, current_user_id, 'owner', 'active')
    returning public.workspace_memberships.role_id into role_id;

    insert into public.domain_events (workspace_id, actor_id, event_type, payload)
    values (workspace_id, current_user_id, 'workspace.created', jsonb_build_object('source', 'auth_bootstrap'));

    insert into public.audit_events (workspace_id, actor_id, action, target_table, target_id, metadata)
    values (workspace_id, current_user_id, 'workspace.bootstrap', 'workspaces', workspace_id, jsonb_build_object('role_id', role_id));
  end if;

  profile_id := current_user_id;
  return next;
end;
$$;

grant execute on function public.ensure_workspace_context() to authenticated;

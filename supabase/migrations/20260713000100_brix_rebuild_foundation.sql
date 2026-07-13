create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'brix_plan') then
    create type public.brix_plan as enum ('free', 'paid', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'brix_deal_status') then
    create type public.brix_deal_status as enum ('draft', 'reviewing', 'underwriting', 'pursuing', 'under_contract', 'closed', 'passed');
  end if;
end $$;

create table if not exists public.brix_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user',
  plan public.brix_plan not null default 'free',
  billing_override boolean not null default false,
  free_deal_limit integer not null default 15,
  created_deal_count integer not null default 0,
  account_delete_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brix_deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status public.brix_deal_status not null default 'draft',
  source_url text,
  source_text text,
  address text not null,
  city text,
  state text,
  zip text,
  county text,
  strategy_id text not null,
  facts jsonb not null default '{}'::jsonb,
  verification jsonb not null default '{}'::jsonb,
  analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.brix_deal_evidence (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.brix_deals(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  evidence_type text not null,
  source text,
  storage_path text,
  notes text,
  ai_findings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.brix_tasks (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.brix_deals(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'open',
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.brix_offers (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.brix_deals(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  terms jsonb not null default '{}'::jsonb,
  memo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.brix_offers add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.brix_offers add column if not exists terms jsonb not null default '{}'::jsonb;
alter table public.brix_offers add column if not exists memo jsonb not null default '{}'::jsonb;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brix_offers' and column_name = 'user_id'
  ) then
    execute 'update public.brix_offers set owner_id = user_id where owner_id is null';
  end if;
end $$;

create table if not exists public.brix_assets (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.brix_deals(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  address text not null,
  asset_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.brix_admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  target_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.brix_profiles enable row level security;
alter table public.brix_deals enable row level security;
alter table public.brix_deal_evidence enable row level security;
alter table public.brix_tasks enable row level security;
alter table public.brix_offers enable row level security;
alter table public.brix_assets enable row level security;
alter table public.brix_admin_audit enable row level security;

create or replace function public.is_brix_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.brix_profiles
    where id = auth.uid() and role in ('admin', 'superadmin', 'developer')
  );
$$;

create policy "brix profiles read own or admin" on public.brix_profiles for select using (id = auth.uid() or public.is_brix_admin());
create policy "brix profiles update own or admin" on public.brix_profiles for update using (id = auth.uid() or public.is_brix_admin());
create policy "brix profiles insert self" on public.brix_profiles for insert with check (id = auth.uid());

create policy "brix deals owner or admin" on public.brix_deals for all using (owner_id = auth.uid() or public.is_brix_admin()) with check (owner_id = auth.uid() or public.is_brix_admin());
create policy "brix evidence owner or admin" on public.brix_deal_evidence for all using (owner_id = auth.uid() or public.is_brix_admin()) with check (owner_id = auth.uid() or public.is_brix_admin());
create policy "brix tasks owner or admin" on public.brix_tasks for all using (owner_id = auth.uid() or public.is_brix_admin()) with check (owner_id = auth.uid() or public.is_brix_admin());
create policy "brix offers owner or admin" on public.brix_offers for all using (owner_id = auth.uid() or public.is_brix_admin()) with check (owner_id = auth.uid() or public.is_brix_admin());
create policy "brix assets owner or admin" on public.brix_assets for all using (owner_id = auth.uid() or public.is_brix_admin()) with check (owner_id = auth.uid() or public.is_brix_admin());
create policy "brix admin audit read admin" on public.brix_admin_audit for select using (public.is_brix_admin());
create policy "brix admin audit insert admin" on public.brix_admin_audit for insert with check (public.is_brix_admin());

create or replace function public.handle_brix_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.brix_profiles (id, email, full_name, role, plan)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when lower(coalesce(new.email, '')) = 'edhemmer@gmail.com' then 'superadmin' else 'user' end,
    case when lower(coalesce(new.email, '')) = 'edhemmer@gmail.com' then 'admin'::public.brix_plan else 'free'::public.brix_plan end
  )
  on conflict (id) do update set
    email = excluded.email,
    role = case when lower(excluded.email) = 'edhemmer@gmail.com' then 'superadmin' else public.brix_profiles.role end,
    plan = case when lower(excluded.email) = 'edhemmer@gmail.com' then 'admin'::public.brix_plan else public.brix_profiles.plan end,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_brix_auth_user_created on auth.users;
create trigger on_brix_auth_user_created
after insert or update on auth.users
for each row execute function public.handle_brix_new_user();

insert into public.brix_profiles (id, email, full_name, role, plan)
select
  id,
  coalesce(email, ''),
  coalesce(raw_user_meta_data ->> 'full_name', ''),
  case when lower(coalesce(email, '')) = 'edhemmer@gmail.com' then 'superadmin' else 'user' end,
  case when lower(coalesce(email, '')) = 'edhemmer@gmail.com' then 'admin'::public.brix_plan else 'free'::public.brix_plan end
from auth.users
on conflict (id) do update set
  email = excluded.email,
  role = case when lower(excluded.email) = 'edhemmer@gmail.com' then 'superadmin' else public.brix_profiles.role end,
  plan = case when lower(excluded.email) = 'edhemmer@gmail.com' then 'admin'::public.brix_plan else public.brix_profiles.plan end,
  updated_at = now();

create or replace function public.can_create_brix_deal()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select plan <> 'free'::public.brix_plan or created_deal_count < free_deal_limit
     from public.brix_profiles where id = auth.uid()),
    false
  );
$$;

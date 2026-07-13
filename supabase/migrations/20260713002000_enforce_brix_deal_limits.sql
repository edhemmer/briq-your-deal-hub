-- Enforce BRIX deal-file limits on the rebuilt brix_deals table.
-- Free accounts have 15 lifetime created deal files. Soft-deleting a deal does not reset usage.

create or replace function public.enforce_brix_deal_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.brix_profiles%rowtype;
begin
  select * into profile_row
  from public.brix_profiles
  where id = new.owner_id
  for update;

  if not found then
    raise exception 'BRIX profile is required before creating deal files.';
  end if;

  if profile_row.plan = 'free'::public.brix_plan
     and not profile_row.billing_override
     and profile_row.created_deal_count >= profile_row.free_deal_limit then
    raise exception 'Free plan includes 15 lifetime deal files. Upgrade to create more deal files.';
  end if;

  update public.brix_profiles
  set created_deal_count = created_deal_count + 1,
      updated_at = now()
  where id = new.owner_id;

  return new;
end;
$$;

drop trigger if exists enforce_brix_deal_limit_before_insert on public.brix_deals;
create trigger enforce_brix_deal_limit_before_insert
before insert on public.brix_deals
for each row
execute function public.enforce_brix_deal_limit();

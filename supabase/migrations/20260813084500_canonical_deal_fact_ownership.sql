-- Production hardening: canonical Deal/Property columns own identity, lifecycle,
-- source, strategy, and verification fields. The flexible facts payload carries
-- analytical/intake facts only. This prevents future silent divergence.

create or replace function public.normalize_brix_deal_fact_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.facts := coalesce(new.facts, '{}'::jsonb) - array[
    'id',
    'dealVersion',
    'propertyId',
    'propertyVersion',
    'createdAt',
    'updatedAt',
    'status',
    'sourceUrl',
    'sourceText',
    'address',
    'city',
    'state',
    'zip',
    'county',
    'strategyId',
    'verification'
  ]::text[];
  return new;
end;
$$;

drop trigger if exists brix_deals_normalize_fact_ownership on public.brix_deals;
create trigger brix_deals_normalize_fact_ownership
before insert or update of facts on public.brix_deals
for each row execute function public.normalize_brix_deal_fact_ownership();

-- Lock brix_deals to authenticated record owners for client deal persistence.
-- Admin workflows should use service-role server paths, not client RLS expansion.

drop policy if exists "brix deals owner or admin" on public.brix_deals;
drop policy if exists "brix deals select owner" on public.brix_deals;
drop policy if exists "brix deals insert owner" on public.brix_deals;
drop policy if exists "brix deals update owner" on public.brix_deals;
drop policy if exists "brix deals delete owner" on public.brix_deals;

create policy "brix deals select owner"
on public.brix_deals
for select
to authenticated
using (owner_id = auth.uid());

create policy "brix deals insert owner"
on public.brix_deals
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "brix deals update owner"
on public.brix_deals
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "brix deals delete owner"
on public.brix_deals
for delete
to authenticated
using (owner_id = auth.uid());

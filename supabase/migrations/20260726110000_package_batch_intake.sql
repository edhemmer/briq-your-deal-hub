-- Specification 004: Package / Batch Intake.
-- Establishes server-owned package envelopes and item state only.
-- Ready items still use the existing manual intake and create_canonical_deal path.

create extension if not exists pgcrypto;

create table if not exists public.intake_batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  batch_type text not null check (batch_type in ('spreadsheet', 'multi_file', 'mixed_package', 'multi_property_deal', 'multi_deal_batch')),
  status text not null default 'draft' check (status in ('draft', 'validating', 'awaiting_mapping', 'queued', 'processing', 'awaiting_review', 'partially_complete', 'complete', 'failed', 'conflicted', 'cancelled')),
  source_summary jsonb not null default '{}'::jsonb check (jsonb_typeof(source_summary) = 'object'),
  limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  item_count integer not null default 0 check (item_count >= 0),
  ready_item_count integer not null default 0 check (ready_item_count >= 0),
  failed_item_count integer not null default 0 check (failed_item_count >= 0),
  skipped_item_count integer not null default 0 check (skipped_item_count >= 0),
  duplicate_candidate_count integer not null default 0 check (duplicate_candidate_count >= 0),
  idempotency_key text not null,
  safe_error text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create table if not exists public.intake_batch_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  batch_id uuid not null references public.intake_batches(id) on delete cascade,
  item_index integer not null check (item_index >= 0),
  item_type text not null check (item_type in ('csv', 'xlsx', 'file', 'image', 'document', 'listing_url', 'email', 'manual_row', 'unknown')),
  status text not null default 'pending' check (status in ('pending', 'validating', 'invalid', 'duplicate_candidate', 'awaiting_mapping', 'awaiting_match_decision', 'queued', 'processing', 'awaiting_review', 'conflicted', 'creating_property', 'creating_deal', 'attaching_evidence', 'complete', 'failed', 'retry_scheduled', 'skipped', 'cancelled')),
  original_filename text,
  source_url text,
  content_hash text,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  evidence_id uuid references public.evidence_items(id) on delete set null,
  intake_id uuid references public.property_intakes(id) on delete set null,
  deal_id uuid references public.brix_deals(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  target_deal_group_key text,
  assignment jsonb not null default '{}'::jsonb check (jsonb_typeof(assignment) = 'object'),
  mapped_values jsonb not null default '{}'::jsonb check (jsonb_typeof(mapped_values) = 'object'),
  proposals jsonb not null default '[]'::jsonb check (jsonb_typeof(proposals) = 'array'),
  duplicate_candidates jsonb not null default '[]'::jsonb check (jsonb_typeof(duplicate_candidates) = 'array'),
  source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object'),
  safe_error text,
  retry_count integer not null default 0 check (retry_count >= 0),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, batch_id, item_index)
);

drop trigger if exists touch_intake_batches on public.intake_batches;
create trigger touch_intake_batches
before update on public.intake_batches
for each row execute function public.touch_versioned_record();

drop trigger if exists touch_intake_batch_items on public.intake_batch_items;
create trigger touch_intake_batch_items
before update on public.intake_batch_items
for each row execute function public.touch_versioned_record();

create index if not exists idx_intake_batches_workspace_status
  on public.intake_batches(workspace_id, status, updated_at desc);

create index if not exists idx_intake_batch_items_batch_status
  on public.intake_batch_items(batch_id, status, item_index);

create index if not exists idx_intake_batch_items_workspace_property
  on public.intake_batch_items(workspace_id, property_id, updated_at desc)
  where property_id is not null;

alter table public.intake_batches enable row level security;
alter table public.intake_batch_items enable row level security;

drop policy if exists "intake batches read workspace managers" on public.intake_batches;
create policy "intake batches read workspace managers"
  on public.intake_batches for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "intake batches no direct insert" on public.intake_batches;
create policy "intake batches no direct insert"
  on public.intake_batches for insert to authenticated
  with check (false);

drop policy if exists "intake batches no direct update" on public.intake_batches;
create policy "intake batches no direct update"
  on public.intake_batches for update to authenticated
  using (false)
  with check (false);

drop policy if exists "intake batches no direct delete" on public.intake_batches;
create policy "intake batches no direct delete"
  on public.intake_batches for delete to authenticated
  using (false);

drop policy if exists "intake batch items read workspace managers" on public.intake_batch_items;
create policy "intake batch items read workspace managers"
  on public.intake_batch_items for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "intake batch items no direct insert" on public.intake_batch_items;
create policy "intake batch items no direct insert"
  on public.intake_batch_items for insert to authenticated
  with check (false);

drop policy if exists "intake batch items no direct update" on public.intake_batch_items;
create policy "intake batch items no direct update"
  on public.intake_batch_items for update to authenticated
  using (false)
  with check (false);

drop policy if exists "intake batch items no direct delete" on public.intake_batch_items;
create policy "intake batch items no direct delete"
  on public.intake_batch_items for delete to authenticated
  using (false);

create or replace function public.record_intake_batch_review(
  target_workspace_id uuid,
  idempotency_key text,
  batch_input jsonb,
  item_inputs jsonb default '[]'::jsonb
)
returns table (
  batch_id uuid,
  batch_status text,
  item_count integer,
  ready_item_count integer,
  failed_item_count integer,
  skipped_item_count integer,
  duplicate_candidate_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  safe_batch jsonb := public.safe_event_jsonb(coalesce(batch_input, '{}'::jsonb));
  item jsonb;
  batch_record public.intake_batches%rowtype;
  item_total integer := coalesce(jsonb_array_length(item_inputs), 0);
  ready_total integer := 0;
  failed_total integer := 0;
  skipped_total integer := 0;
  duplicate_total integer := 0;
  item_status text;
begin
  if current_user_id is null then raise exception 'Authentication required to record package intake.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required for package intake.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to record package intake in this BRIX workspace.' using errcode = '42501'; end if;
  if jsonb_typeof(item_inputs) <> 'array' then raise exception 'Package intake items must be an array.' using errcode = '22023'; end if;
  if item_total > 50 then raise exception 'Package intake supports 50 items or fewer.' using errcode = '22023'; end if;

  for item in select value from jsonb_array_elements(item_inputs) loop
    item_status := coalesce(nullif(btrim(item ->> 'status'), ''), 'pending');
    if item_status in ('awaiting_review', 'creating_property', 'creating_deal', 'attaching_evidence', 'complete') then ready_total := ready_total + 1; end if;
    if item_status in ('invalid', 'failed', 'conflicted') then failed_total := failed_total + 1; end if;
    if item_status in ('skipped', 'cancelled') then skipped_total := skipped_total + 1; end if;
    if item_status = 'duplicate_candidate' then duplicate_total := duplicate_total + 1; ready_total := ready_total + 1; end if;
  end loop;

  insert into public.intake_batches (
    workspace_id,
    created_by,
    batch_type,
    status,
    source_summary,
    limits,
    item_count,
    ready_item_count,
    failed_item_count,
    skipped_item_count,
    duplicate_candidate_count,
    idempotency_key,
    safe_error
  )
  values (
    target_workspace_id,
    current_user_id,
    coalesce(nullif(btrim(safe_batch ->> 'batchType'), ''), 'mixed_package'),
    coalesce(nullif(btrim(safe_batch ->> 'status'), ''), case when item_total = 0 then 'draft' when failed_total = item_total then 'failed' when ready_total > 0 then 'awaiting_review' else 'awaiting_mapping' end),
    case when jsonb_typeof(safe_batch -> 'sourceSummary') = 'object' then safe_batch -> 'sourceSummary' else '{}'::jsonb end,
    case when jsonb_typeof(safe_batch -> 'limits') = 'object' then safe_batch -> 'limits' else '{}'::jsonb end,
    item_total,
    ready_total,
    failed_total,
    skipped_total,
    duplicate_total,
    cleaned_key,
    nullif(btrim(safe_batch ->> 'safeError'), '')
  )
  on conflict (workspace_id, idempotency_key) do update set
    status = excluded.status,
    source_summary = excluded.source_summary,
    limits = excluded.limits,
    item_count = excluded.item_count,
    ready_item_count = excluded.ready_item_count,
    failed_item_count = excluded.failed_item_count,
    skipped_item_count = excluded.skipped_item_count,
    duplicate_candidate_count = excluded.duplicate_candidate_count,
    safe_error = excluded.safe_error
  returning * into batch_record;

  delete from public.intake_batch_items
  where workspace_id = target_workspace_id
    and batch_id = batch_record.id;

  for item in select value from jsonb_array_elements(item_inputs) loop
    item_status := coalesce(nullif(btrim(item ->> 'status'), ''), 'pending');
    insert into public.intake_batch_items (
      workspace_id,
      batch_id,
      item_index,
      item_type,
      status,
      original_filename,
      source_url,
      content_hash,
      target_deal_group_key,
      assignment,
      mapped_values,
      proposals,
      duplicate_candidates,
      source_anchor,
      safe_error,
      retry_count
    )
    values (
      target_workspace_id,
      batch_record.id,
      coalesce(nullif(btrim(item ->> 'itemIndex'), '')::integer, 0),
      coalesce(nullif(btrim(item ->> 'sourceType'), ''), 'unknown'),
      item_status,
      nullif(btrim(item ->> 'originalFilename'), ''),
      nullif(btrim(item ->> 'sourceUrl'), ''),
      nullif(btrim(item ->> 'contentHash'), ''),
      nullif(btrim(item ->> 'targetDealGroupKey'), ''),
      case when jsonb_typeof(item -> 'assignment') = 'object' then public.safe_event_jsonb(item -> 'assignment') else '{}'::jsonb end,
      case when jsonb_typeof(item -> 'mappedValues') = 'object' then public.safe_event_jsonb(item -> 'mappedValues') else '{}'::jsonb end,
      case when jsonb_typeof(item -> 'proposals') = 'array' then public.safe_event_jsonb(item -> 'proposals') else '[]'::jsonb end,
      case when jsonb_typeof(item -> 'duplicateCandidates') = 'array' then public.safe_event_jsonb(item -> 'duplicateCandidates') else '[]'::jsonb end,
      case when jsonb_typeof(item -> 'sourceAnchor') = 'object' then public.safe_event_jsonb(item -> 'sourceAnchor') else '{}'::jsonb end,
      nullif(btrim(item ->> 'safeError'), ''),
      coalesce(nullif(btrim(item ->> 'retryCount'), '')::integer, 0)
    );
  end loop;

  insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values (
    target_workspace_id,
    current_user_id,
    'intake.batch_reviewed',
    'intake_batch',
    batch_record.id,
    'record_intake_batch_review',
    cleaned_key || ':intake.batch_reviewed',
    jsonb_build_object('batch_id', batch_record.id, 'batch_type', batch_record.batch_type, 'item_count', item_total, 'ready_item_count', ready_total, 'failed_item_count', failed_total)
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    current_user_id,
    'intake.batch_reviewed',
    'intake_batches',
    'intake_batch',
    batch_record.id,
    'record_intake_batch_review',
    cleaned_key || ':audit',
    jsonb_build_object('status', batch_record.status, 'item_count', item_total, 'ready_item_count', ready_total, 'failed_item_count', failed_total),
    array['status', 'item_count', 'ready_item_count', 'failed_item_count', 'skipped_item_count', 'duplicate_candidate_count'],
    jsonb_build_object('batch_type', batch_record.batch_type)
  )
  on conflict do nothing;

  batch_id := batch_record.id;
  batch_status := batch_record.status;
  item_count := batch_record.item_count;
  ready_item_count := batch_record.ready_item_count;
  failed_item_count := batch_record.failed_item_count;
  skipped_item_count := batch_record.skipped_item_count;
  duplicate_candidate_count := batch_record.duplicate_candidate_count;
  return next;
end;
$$;

revoke all on function public.record_intake_batch_review(uuid, text, jsonb, jsonb) from public;
grant execute on function public.record_intake_batch_review(uuid, text, jsonb, jsonb) to authenticated;

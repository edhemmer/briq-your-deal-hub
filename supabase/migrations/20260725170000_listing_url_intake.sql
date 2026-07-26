-- Specification 004 slice 2: Listing URL intake proposals and source recording.

alter table public.property_intakes drop constraint if exists property_intakes_state_check;
alter table public.property_intakes
  add constraint property_intakes_state_check
  check (state in (
    'draft',
    'resolving_location',
    'searching_existing_property',
    'awaiting_match_decision',
    'creating_property',
    'creating_deal',
    'importing_source',
    'enriching',
    'awaiting_verification',
    'partially_complete',
    'complete',
    'failed',
    'retry_scheduled',
    'conflict',
    'cancelled'
  ));

alter table public.property_intakes drop constraint if exists property_intakes_source_type_check;
alter table public.property_intakes
  add constraint property_intakes_source_type_check
  check (source_type in ('manual', 'listing_url'));

alter table public.manual_source_records drop constraint if exists manual_source_records_source_type_check;
alter table public.manual_source_records
  add constraint manual_source_records_source_type_check
  check (source_type in ('manual', 'listing_url'));

alter table public.manual_source_records add column if not exists source_url text;
alter table public.manual_source_records add column if not exists source_key text;
alter table public.manual_source_records add column if not exists support_level text check (support_level in ('supported', 'limited', 'unsupported'));
alter table public.manual_source_records add column if not exists retrieved_at timestamptz;
alter table public.manual_source_records add column if not exists adapter_version text;
alter table public.manual_source_records add column if not exists license_use_restrictions text;

create table if not exists public.intake_value_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  intake_id uuid not null references public.property_intakes(id) on delete cascade,
  source_record_id uuid not null references public.manual_source_records(id) on delete cascade,
  deal_id uuid references public.brix_deals(id) on delete cascade,
  property_id uuid references public.properties(id) on delete restrict,
  canonical_subject text not null default 'property' check (canonical_subject in ('property', 'deal', 'assumption')),
  canonical_field text not null,
  raw_value text,
  normalized_value text,
  display_value text,
  classification text not null check (classification in ('source_backed_candidate', 'external_estimate', 'unknown')),
  confidence integer not null check (confidence between 0 and 100),
  verification_state text not null default 'unverified' check (verification_state in ('unverified', 'user_verified', 'source_verified', 'professional_review_recommended', 'rejected', 'superseded')),
  proposal_status text not null default 'pending' check (proposal_status in ('pending', 'accepted', 'rejected', 'edited', 'deferred', 'conflicted', 'superseded')),
  evidence_rule text,
  proposed_action text not null default 'verify' check (proposed_action in ('add', 'update', 'ignore', 'verify')),
  source_key text,
  effective_date date,
  freshness_state text not null default 'current' check (freshness_state in ('current', 'stale', 'unknown')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, source_record_id, canonical_subject, canonical_field, normalized_value)
);

drop trigger if exists touch_intake_value_proposals on public.intake_value_proposals;
create trigger touch_intake_value_proposals
before update on public.intake_value_proposals
for each row execute function public.touch_versioned_record();

create index if not exists idx_intake_value_proposals_workspace_intake
  on public.intake_value_proposals(workspace_id, intake_id, proposal_status, updated_at desc);

alter table public.intake_value_proposals enable row level security;

drop policy if exists "intake value proposals read workspace managers" on public.intake_value_proposals;
create policy "intake value proposals read workspace managers"
  on public.intake_value_proposals for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "intake value proposals no direct insert" on public.intake_value_proposals;
create policy "intake value proposals no direct insert"
  on public.intake_value_proposals for insert to authenticated
  with check (false);

drop policy if exists "intake value proposals no direct update" on public.intake_value_proposals;
create policy "intake value proposals no direct update"
  on public.intake_value_proposals for update to authenticated
  using (false)
  with check (false);

drop policy if exists "intake value proposals no direct delete" on public.intake_value_proposals;
create policy "intake value proposals no direct delete"
  on public.intake_value_proposals for delete to authenticated
  using (false);

create or replace function public.record_listing_url_import_result(
  target_workspace_id uuid,
  target_intake_id uuid,
  target_source_record_id uuid,
  listing_import jsonb,
  listing_proposals jsonb default '[]'::jsonb
)
returns table (
  source_record_id uuid,
  proposal_count integer,
  accepted_count integer,
  deferred_count integer,
  rejected_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  source_record public.manual_source_records%rowtype;
  intake_record public.property_intakes%rowtype;
  safe_import jsonb := public.safe_event_jsonb(coalesce(listing_import, '{}'::jsonb));
  proposal jsonb;
  proposal_status text;
  import_source_key text := nullif(btrim(coalesce(safe_import ->> 'sourceKey', 'unsupported_listing_url')), '');
  import_status text := coalesce(nullif(btrim(safe_import ->> 'status'), ''), 'failed');
  completed_event_type text;
begin
  if current_user_id is null then raise exception 'Authentication required to record listing URL intake.' using errcode = '42501'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to create Deals in this BRIX workspace.' using errcode = '42501'; end if;
  if jsonb_typeof(coalesce(listing_proposals, '[]'::jsonb)) <> 'array' then raise exception 'Listing proposals must be an array.' using errcode = '22023'; end if;

  select * into intake_record
  from public.property_intakes
  where id = target_intake_id and workspace_id = target_workspace_id
  for update;
  if intake_record.id is null then raise exception 'Listing intake is not available.' using errcode = 'P0002'; end if;
  if intake_record.user_id <> current_user_id and not public.has_workspace_permission(target_workspace_id, 'deals:manage') then
    raise exception 'This listing intake belongs to another user.' using errcode = '42501';
  end if;

  select * into source_record
  from public.manual_source_records
  where id = target_source_record_id and workspace_id = target_workspace_id and intake_id = target_intake_id
  for update;
  if source_record.id is null then raise exception 'Listing source record is not available.' using errcode = 'P0002'; end if;

  update public.property_intakes
  set source_type = 'listing_url',
      original_input = jsonb_set(coalesce(original_input, '{}'::jsonb), '{source_url}', to_jsonb(safe_import ->> 'normalizedUrl'), true)
  where id = target_intake_id;

  update public.manual_source_records
  set source_type = 'listing_url',
      source_url = nullif(btrim(safe_import ->> 'normalizedUrl'), ''),
      source_key = import_source_key,
      support_level = case when safe_import ->> 'supportLevel' in ('supported', 'limited', 'unsupported') then safe_import ->> 'supportLevel' else 'unsupported' end,
      retrieved_at = coalesce(nullif(btrim(safe_import ->> 'retrievedAt'), '')::timestamptz, now()),
      adapter_version = nullif(btrim(safe_import ->> 'adapterVersion'), ''),
      license_use_restrictions = nullif(btrim(safe_import ->> 'licensingNotes'), ''),
      original_values = coalesce(original_values, '{}'::jsonb) || jsonb_build_object('listing_import', safe_import)
  where id = target_source_record_id
  returning * into source_record;

  for proposal in select * from jsonb_array_elements(listing_proposals)
  loop
    proposal_status := coalesce(nullif(btrim(proposal ->> 'status'), ''), 'pending');
    if proposal_status not in ('pending', 'accepted', 'rejected', 'edited', 'deferred', 'conflicted', 'superseded') then
      proposal_status := 'pending';
    end if;
    insert into public.intake_value_proposals (
      workspace_id,
      intake_id,
      source_record_id,
      deal_id,
      property_id,
      canonical_subject,
      canonical_field,
      raw_value,
      normalized_value,
      display_value,
      classification,
      confidence,
      verification_state,
      proposal_status,
      evidence_rule,
      proposed_action,
      source_key,
      created_by
    )
    values (
      target_workspace_id,
      target_intake_id,
      target_source_record_id,
      source_record.deal_id,
      source_record.property_id,
      'property',
      coalesce(nullif(btrim(proposal ->> 'field'), ''), 'unknown'),
      nullif(btrim(proposal ->> 'rawValue'), ''),
      nullif(btrim(proposal ->> 'normalizedValue'), ''),
      nullif(btrim(proposal ->> 'displayValue'), ''),
      case when proposal ->> 'classification' in ('source_backed_candidate', 'external_estimate', 'unknown') then proposal ->> 'classification' else 'unknown' end,
      greatest(0, least(coalesce(nullif(btrim(proposal ->> 'confidence'), '')::integer, 50), 100)),
      'unverified',
      proposal_status,
      nullif(btrim(proposal ->> 'evidenceRule'), ''),
      case when proposal_status in ('accepted', 'edited') then 'add' when proposal_status = 'rejected' then 'ignore' else 'verify' end,
      coalesce(nullif(btrim(proposal ->> 'sourceKey'), ''), import_source_key),
      current_user_id
    )
    on conflict (workspace_id, source_record_id, canonical_subject, canonical_field, normalized_value) do update set
      proposal_status = excluded.proposal_status,
      confidence = excluded.confidence,
      display_value = excluded.display_value,
      evidence_rule = excluded.evidence_rule,
      proposed_action = excluded.proposed_action;
  end loop;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values
    (target_workspace_id, source_record.deal_id, source_record.property_id, current_user_id, 'intake.source_received', 'source_record', target_source_record_id, 'record_listing_url_import_result', target_source_record_id::text || ':intake.source_received', jsonb_build_object('source_type', 'listing_url', 'source_key', import_source_key)),
    (target_workspace_id, source_record.deal_id, source_record.property_id, current_user_id, 'source.import_started', 'source_record', target_source_record_id, 'record_listing_url_import_result', target_source_record_id::text || ':source.import_started', jsonb_build_object('source_type', 'listing_url', 'source_key', import_source_key))
  on conflict do nothing;

  completed_event_type := case when import_status in ('failed', 'unsupported') then 'source.import_failed' else 'source.import_completed' end;
  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values (target_workspace_id, source_record.deal_id, source_record.property_id, current_user_id, completed_event_type, 'source_record', target_source_record_id, 'record_listing_url_import_result', target_source_record_id::text || ':' || completed_event_type, jsonb_build_object('status', import_status, 'source_key', import_source_key))
  on conflict do nothing;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  select target_workspace_id, source_record.deal_id, source_record.property_id, current_user_id, 'value.proposed', 'intake_value_proposal', id, 'record_listing_url_import_result', id::text || ':value.proposed', jsonb_build_object('field', canonical_field, 'status', proposal_status)
  from public.intake_value_proposals
  where workspace_id = target_workspace_id and source_record_id = target_source_record_id
  on conflict do nothing;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  select target_workspace_id, source_record.deal_id, source_record.property_id, current_user_id,
    case when proposal_status in ('accepted', 'edited') then 'value.accepted' when proposal_status = 'rejected' then 'value.rejected' else 'value.proposed' end,
    'intake_value_proposal',
    id,
    'record_listing_url_import_result',
    id::text || ':' || case when proposal_status in ('accepted', 'edited') then 'value.accepted' when proposal_status = 'rejected' then 'value.rejected' else 'value.deferred' end,
    jsonb_build_object('field', canonical_field, 'status', proposal_status)
  from public.intake_value_proposals
  where workspace_id = target_workspace_id and source_record_id = target_source_record_id and proposal_status in ('accepted', 'edited', 'rejected', 'deferred')
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    source_record.deal_id,
    source_record.property_id,
    current_user_id,
    'source.import_recorded',
    'manual_source_records',
    'source_record',
    target_source_record_id,
    'record_listing_url_import_result',
    target_source_record_id::text || ':audit',
    jsonb_build_object('source_type', 'listing_url', 'source_key', import_source_key, 'status', import_status),
    array['source_type', 'source_url', 'source_key', 'support_level', 'retrieved_at', 'adapter_version'],
    jsonb_build_object('proposal_count', jsonb_array_length(listing_proposals))
  )
  on conflict do nothing;

  source_record_id := target_source_record_id;
  select count(*)::integer into proposal_count from public.intake_value_proposals where workspace_id = target_workspace_id and source_record_id = target_source_record_id;
  select count(*)::integer into accepted_count from public.intake_value_proposals where workspace_id = target_workspace_id and source_record_id = target_source_record_id and proposal_status in ('accepted', 'edited');
  select count(*)::integer into deferred_count from public.intake_value_proposals where workspace_id = target_workspace_id and source_record_id = target_source_record_id and proposal_status = 'deferred';
  select count(*)::integer into rejected_count from public.intake_value_proposals where workspace_id = target_workspace_id and source_record_id = target_source_record_id and proposal_status = 'rejected';
  return next;
end;
$$;

revoke all on function public.record_listing_url_import_result(uuid, uuid, uuid, jsonb, jsonb) from public;
grant execute on function public.record_listing_url_import_result(uuid, uuid, uuid, jsonb, jsonb) to authenticated;

-- Specification 004 slice 4: email intake foundation.
-- Email is preserved as source material only. Deterministic proposals remain
-- unverified until accepted by the user through the existing proposal workflow.

create extension if not exists pgcrypto;

alter table public.property_intakes drop constraint if exists property_intakes_source_type_check;
alter table public.property_intakes
  add constraint property_intakes_source_type_check
  check (source_type in ('manual', 'listing_url', 'file', 'image', 'document', 'email'));

alter table public.manual_source_records drop constraint if exists manual_source_records_source_type_check;
alter table public.manual_source_records
  add constraint manual_source_records_source_type_check
  check (source_type in ('manual', 'listing_url', 'file', 'image', 'document', 'email'));

alter table public.intake_processing_jobs drop constraint if exists intake_processing_jobs_job_type_check;
alter table public.intake_processing_jobs
  add constraint intake_processing_jobs_job_type_check
  check (job_type in ('file_evidence_intake', 'email_intake'));

create table if not exists public.email_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  intake_id uuid references public.property_intakes(id) on delete set null,
  deal_id uuid references public.brix_deals(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  subject text,
  from_address text,
  to_addresses text[] not null default '{}',
  cc_addresses text[] not null default '{}',
  bcc_addresses text[] not null default '{}',
  reply_to_address text,
  sent_at timestamptz,
  received_headers jsonb not null default '[]'::jsonb check (jsonb_typeof(received_headers) = 'array'),
  message_id text,
  thread_id text,
  body_hash text not null check (body_hash ~ '^[a-f0-9]{64}$'),
  plain_text_body text,
  html_body text,
  attachment_count integer not null default 0 check (attachment_count >= 0),
  duplicate_of_email_source_id uuid references public.email_sources(id) on delete set null,
  imported_by uuid references auth.users(id) on delete set null,
  imported_at timestamptz not null default now(),
  parser_version text not null default 'email-intake-v1',
  processing_status text not null default 'complete' check (processing_status in ('queued', 'processing', 'complete', 'partially_complete', 'failed')),
  verification_state text not null default 'unverified',
  retention_state text not null default 'active' check (retention_state in ('active', 'retained', 'deletion_pending', 'deleted')),
  safe_error text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists touch_email_sources on public.email_sources;
create trigger touch_email_sources
before update on public.email_sources
for each row execute function public.touch_versioned_record();

create unique index if not exists idx_email_sources_workspace_message_id
  on public.email_sources(workspace_id, message_id)
  where message_id is not null;

create unique index if not exists idx_email_sources_workspace_body_hash
  on public.email_sources(workspace_id, body_hash);

create index if not exists idx_email_sources_workspace_imported
  on public.email_sources(workspace_id, imported_at desc);

create table if not exists public.email_source_attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email_source_id uuid not null references public.email_sources(id) on delete cascade,
  evidence_id uuid references public.evidence_items(id) on delete set null,
  filename text not null,
  content_type text,
  byte_size integer,
  content_hash text check (content_hash is null or content_hash ~ '^[a-f0-9]{64}$'),
  content_id text,
  disposition text,
  import_status text not null default 'metadata_only' check (import_status in ('imported', 'duplicate', 'rejected', 'metadata_only')),
  safe_message text,
  parser_version text not null default 'email-intake-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists touch_email_source_attachments on public.email_source_attachments;
create trigger touch_email_source_attachments
before update on public.email_source_attachments
for each row execute function public.touch_versioned_record();

create index if not exists idx_email_source_attachments_workspace_email
  on public.email_source_attachments(workspace_id, email_source_id);

create unique index if not exists idx_email_source_attachments_unique_item
  on public.email_source_attachments(workspace_id, email_source_id, filename, coalesce(content_hash, 'metadata:' || filename));

alter table public.email_sources enable row level security;
alter table public.email_source_attachments enable row level security;

drop policy if exists "email sources read workspace managers" on public.email_sources;
create policy "email sources read workspace managers"
  on public.email_sources for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "email sources no direct insert" on public.email_sources;
create policy "email sources no direct insert"
  on public.email_sources for insert to authenticated
  with check (false);

drop policy if exists "email sources no direct update" on public.email_sources;
create policy "email sources no direct update"
  on public.email_sources for update to authenticated
  using (false)
  with check (false);

drop policy if exists "email sources no direct delete" on public.email_sources;
create policy "email sources no direct delete"
  on public.email_sources for delete to authenticated
  using (false);

drop policy if exists "email source attachments read workspace managers" on public.email_source_attachments;
create policy "email source attachments read workspace managers"
  on public.email_source_attachments for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "email source attachments no direct insert" on public.email_source_attachments;
create policy "email source attachments no direct insert"
  on public.email_source_attachments for insert to authenticated
  with check (false);

drop policy if exists "email source attachments no direct update" on public.email_source_attachments;
create policy "email source attachments no direct update"
  on public.email_source_attachments for update to authenticated
  using (false)
  with check (false);

drop policy if exists "email source attachments no direct delete" on public.email_source_attachments;
create policy "email source attachments no direct delete"
  on public.email_source_attachments for delete to authenticated
  using (false);

create or replace function public.can_record_email_intake(target_workspace_id uuid)
returns boolean
language sql
security invoker
set search_path = public
as $$
  select auth.uid() is not null and public.has_workspace_permission(target_workspace_id, 'deals:manage');
$$;

create or replace function public.record_email_intake_result(
  target_workspace_id uuid,
  idempotency_key text,
  email_metadata jsonb,
  extracted_proposals jsonb default '[]'::jsonb,
  attachment_metadata jsonb default '[]'::jsonb
)
returns table (
  intake_id uuid,
  source_record_id uuid,
  email_source_id uuid,
  duplicate_of_email_source_id uuid,
  job_id uuid,
  proposal_count integer,
  attachment_count integer,
  import_status text,
  safe_message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  safe_meta jsonb := public.safe_event_jsonb(coalesce(email_metadata, '{}'::jsonb));
  proposal jsonb;
  attachment jsonb;
  intake_record public.property_intakes%rowtype;
  source_record public.manual_source_records%rowtype;
  email_record public.email_sources%rowtype;
  job_record public.intake_processing_jobs%rowtype;
  email_body_hash text := lower(nullif(btrim(safe_meta ->> 'bodyHash'), ''));
  message_identifier text := nullif(btrim(safe_meta ->> 'messageId'), '');
  duplicate_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required to import email.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to import email.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to import email in this BRIX workspace.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_meta) <> 'object' then raise exception 'Email metadata must be an object.' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(extracted_proposals, '[]'::jsonb)) <> 'array' then raise exception 'Email proposals must be an array.' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(attachment_metadata, '[]'::jsonb)) <> 'array' then raise exception 'Email attachments must be an array.' using errcode = '22023'; end if;
  if email_body_hash is null or email_body_hash !~ '^[a-f0-9]{64}$' then raise exception 'Email body hash is invalid.' using errcode = '22023'; end if;

  select * into email_record
  from public.email_sources
  where workspace_id = target_workspace_id
    and ((message_identifier is not null and message_id = message_identifier) or body_hash = email_body_hash)
  order by case when message_identifier is not null and message_id = message_identifier then 0 else 1 end
  limit 1
  for update;
  duplicate_id := email_record.id;

  insert into public.property_intakes (workspace_id, user_id, state, source_type, original_input, normalized_location, duplicate_decision, idempotency_key)
  values (
    target_workspace_id,
    current_user_id,
    case when email_record.id is null then 'processing_source' else 'awaiting_evidence_decision' end,
    'email',
    jsonb_build_object('subject', safe_meta ->> 'subject', 'from', safe_meta ->> 'fromAddress', 'message_id', message_identifier, 'body_hash', email_body_hash),
    '{}'::jsonb,
    'none',
    cleaned_key
  )
  on conflict (workspace_id, idempotency_key) do update set
    state = excluded.state,
    original_input = excluded.original_input
  returning * into intake_record;

  if email_record.id is null then
    insert into public.email_sources (
      workspace_id,
      intake_id,
      subject,
      from_address,
      to_addresses,
      cc_addresses,
      bcc_addresses,
      reply_to_address,
      sent_at,
      received_headers,
      message_id,
      thread_id,
      email_body_hash,
      plain_text_body,
      html_body,
      attachment_count,
      imported_by,
      parser_version,
      processing_status,
      safe_error
    )
    values (
      target_workspace_id,
      intake_record.id,
      nullif(btrim(safe_meta ->> 'subject'), ''),
      nullif(btrim(safe_meta ->> 'fromAddress'), ''),
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(safe_meta -> 'toAddresses') = 'array' then safe_meta -> 'toAddresses' else '[]'::jsonb end)), '{}'),
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(safe_meta -> 'ccAddresses') = 'array' then safe_meta -> 'ccAddresses' else '[]'::jsonb end)), '{}'),
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(safe_meta -> 'bccAddresses') = 'array' then safe_meta -> 'bccAddresses' else '[]'::jsonb end)), '{}'),
      nullif(btrim(safe_meta ->> 'replyToAddress'), ''),
      nullif(btrim(safe_meta ->> 'sentAt'), '')::timestamptz,
      case when jsonb_typeof(safe_meta -> 'receivedHeaders') = 'array' then safe_meta -> 'receivedHeaders' else '[]'::jsonb end,
      message_identifier,
      nullif(btrim(safe_meta ->> 'threadId'), ''),
      body_hash,
      nullif(safe_meta ->> 'plainTextBody', ''),
      nullif(safe_meta ->> 'htmlBody', ''),
      jsonb_array_length(attachment_metadata),
      current_user_id,
      coalesce(nullif(btrim(safe_meta ->> 'parserVersion'), ''), 'email-intake-v1'),
      'complete',
      nullif(btrim(safe_meta ->> 'safeError'), '')
    )
    returning * into email_record;
  else
    update public.email_sources
    set intake_id = coalesce(email_sources.intake_id, intake_record.id)
    where id = email_record.id
    returning * into email_record;
  end if;

  insert into public.manual_source_records (
    workspace_id,
    intake_id,
    deal_id,
    property_id,
    source_type,
    source_name,
    source_contact,
    original_values,
    classification,
    verification_state,
    content_hash,
    processing_version,
    safe_error,
    retrieved_at,
    created_by
  )
  values (
    target_workspace_id,
    intake_record.id,
    null,
    null,
    'email',
    coalesce(nullif(btrim(safe_meta ->> 'subject'), ''), 'Email source'),
    nullif(btrim(safe_meta ->> 'fromAddress'), ''),
    safe_meta,
    jsonb_build_object('email', 'user_provided_source', 'verification_state', 'unverified'),
    'unverified',
    email_body_hash,
    coalesce(nullif(btrim(safe_meta ->> 'parserVersion'), ''), 'email-intake-v1'),
    nullif(btrim(safe_meta ->> 'safeError'), ''),
    now(),
    current_user_id
  )
  on conflict (workspace_id, intake_id) do update set
    original_values = excluded.original_values,
    source_contact = excluded.source_contact,
    content_hash = excluded.content_hash
  returning * into source_record;

  update public.email_sources
  set source_record_id = source_record.id
  where id = email_record.id
  returning * into email_record;

  for attachment in select * from jsonb_array_elements(attachment_metadata)
  loop
    insert into public.email_source_attachments (
      workspace_id,
      email_source_id,
      evidence_id,
      filename,
      content_type,
      byte_size,
      content_hash,
      content_id,
      disposition,
      import_status,
      safe_message,
      parser_version
    )
    values (
      target_workspace_id,
      email_record.id,
      nullif(btrim(attachment ->> 'evidenceId'), '')::uuid,
      coalesce(nullif(btrim(attachment ->> 'filename'), ''), 'email attachment'),
      nullif(btrim(attachment ->> 'contentType'), ''),
      nullif(btrim(attachment ->> 'byteSize'), '')::integer,
      lower(nullif(btrim(attachment ->> 'contentHash'), '')),
      nullif(btrim(attachment ->> 'contentId'), ''),
      nullif(btrim(attachment ->> 'disposition'), ''),
      case when attachment ->> 'status' in ('imported', 'duplicate', 'rejected', 'metadata_only') then attachment ->> 'status' else 'metadata_only' end,
      nullif(btrim(attachment ->> 'safeMessage'), ''),
      coalesce(nullif(btrim(safe_meta ->> 'parserVersion'), ''), 'email-intake-v1')
    )
    on conflict do nothing;
  end loop;

  insert into public.intake_processing_jobs (
    workspace_id,
    intake_id,
    evidence_id,
    job_type,
    status,
    idempotency_key,
    requested_by,
    started_at,
    completed_at,
    progress,
    workflow_version,
    output_refs
  )
  values (
    target_workspace_id,
    intake_record.id,
    null,
    'email_intake',
    'completed',
    cleaned_key || ':job',
    current_user_id,
    now(),
    now(),
    100,
    'email-intake-v1',
    jsonb_build_object('email_source_id', email_record.id, 'source_record_id', source_record.id, 'proposal_count', jsonb_array_length(extracted_proposals), 'attachment_count', jsonb_array_length(attachment_metadata))
  )
  on conflict (workspace_id, idempotency_key) do update set
    status = excluded.status,
    completed_at = excluded.completed_at,
    progress = excluded.progress,
    output_refs = excluded.output_refs
  returning * into job_record;

  for proposal in select * from jsonb_array_elements(extracted_proposals)
  loop
    insert into public.intake_value_proposals (
      workspace_id,
      intake_id,
      source_record_id,
      evidence_id,
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
      source_anchor,
      unit,
      currency,
      extractor_version,
      created_by
    )
    values (
      target_workspace_id,
      intake_record.id,
      source_record.id,
      null,
      'property',
      coalesce(nullif(btrim(proposal ->> 'field'), ''), 'unknown'),
      nullif(btrim(proposal ->> 'rawValue'), ''),
      nullif(btrim(proposal ->> 'normalizedValue'), ''),
      nullif(btrim(proposal ->> 'displayValue'), ''),
      case when proposal ->> 'classification' in ('source_backed_candidate', 'external_estimate', 'unknown') then proposal ->> 'classification' else 'unknown' end,
      greatest(0, least(coalesce(nullif(btrim(proposal ->> 'confidence'), '')::integer, 50), 100)),
      'unverified',
      case when proposal ->> 'status' in ('pending', 'accepted', 'rejected', 'edited', 'deferred', 'conflicted', 'superseded') then proposal ->> 'status' else 'pending' end,
      nullif(btrim(proposal ->> 'evidenceRule'), ''),
      'verify',
      coalesce(nullif(btrim(proposal ->> 'sourceKey'), ''), 'email_source'),
      case when jsonb_typeof(proposal -> 'sourceAnchor') = 'object' then proposal -> 'sourceAnchor' else '{}'::jsonb end,
      nullif(btrim(proposal ->> 'unit'), ''),
      nullif(btrim(proposal ->> 'currency'), ''),
      coalesce(nullif(btrim(proposal ->> 'extractorVersion'), ''), 'email-intake-v1'),
      current_user_id
    )
    on conflict (workspace_id, source_record_id, canonical_subject, canonical_field, normalized_value) do update set
      display_value = excluded.display_value,
      confidence = excluded.confidence,
      source_anchor = excluded.source_anchor,
      extractor_version = excluded.extractor_version;
  end loop;

  update public.property_intakes
  set state = 'awaiting_evidence_decision'
  where id = intake_record.id
  returning * into intake_record;

  insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values
    (target_workspace_id, current_user_id, 'intake.created', 'intake', intake_record.id, 'record_email_intake_result', cleaned_key || ':intake.created', jsonb_build_object('source_type', 'email')),
    (target_workspace_id, current_user_id, 'email.received', 'email_source', email_record.id, 'record_email_intake_result', cleaned_key || ':email.received', jsonb_build_object('duplicate', duplicate_id is not null)),
    (target_workspace_id, current_user_id, 'email.parsed', 'email_source', email_record.id, 'record_email_intake_result', cleaned_key || ':email.parsed', jsonb_build_object('proposal_count', jsonb_array_length(extracted_proposals))),
    (target_workspace_id, current_user_id, 'source.import_completed', 'source_record', source_record.id, 'record_email_intake_result', cleaned_key || ':source.import_completed', jsonb_build_object('source_type', 'email'))
  on conflict do nothing;

  insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  select target_workspace_id, current_user_id, 'email.attachment_imported', 'email_source_attachment', id, 'record_email_intake_result', id::text || ':email.attachment_imported', jsonb_build_object('email_source_id', email_record.id, 'status', import_status)
  from public.email_source_attachments
  where workspace_id = target_workspace_id and email_source_id = email_record.id
  on conflict do nothing;

  insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  select target_workspace_id, current_user_id, 'email.value_proposed', 'intake_value_proposal', id, 'record_email_intake_result', id::text || ':email.value_proposed', jsonb_build_object('field', canonical_field, 'source_type', 'email')
  from public.intake_value_proposals
  where workspace_id = target_workspace_id and source_record_id = source_record.id
  on conflict do nothing;

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    current_user_id,
    'email.received',
    'email_sources',
    'email_source',
    email_record.id,
    'record_email_intake_result',
    cleaned_key || ':audit',
    jsonb_build_object('email_source_id', email_record.id, 'source_record_id', source_record.id, 'duplicate_of_email_source_id', duplicate_id),
    array['email_sources', 'manual_source_records', 'intake_value_proposals', 'email_source_attachments'],
    jsonb_build_object('proposal_count', jsonb_array_length(extracted_proposals), 'attachment_count', jsonb_array_length(attachment_metadata))
  )
  on conflict do nothing;

  intake_id := intake_record.id;
  source_record_id := source_record.id;
  email_source_id := email_record.id;
  duplicate_of_email_source_id := duplicate_id;
  job_id := job_record.id;
  select count(*)::integer into proposal_count from public.intake_value_proposals where workspace_id = target_workspace_id and source_record_id = source_record.id;
  select count(*)::integer into attachment_count from public.email_source_attachments where workspace_id = target_workspace_id and email_source_id = email_record.id;
  import_status := case when duplicate_id is not null then 'duplicate' else 'complete' end;
  safe_message := case when duplicate_id is not null then 'This email was already saved in your BRIX account. BRIX linked the existing email source.' else 'Email source saved. Review extracted candidate values before creating the Deal.' end;
  return next;
end;
$$;

create or replace function public.attach_email_source_to_deal(
  target_workspace_id uuid,
  target_email_source_id uuid,
  target_intake_id uuid,
  target_deal_id uuid,
  target_property_id uuid
)
returns table (
  email_source_id uuid,
  intake_id uuid,
  source_record_id uuid,
  deal_id uuid,
  property_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  email_record public.email_sources%rowtype;
  source_record public.manual_source_records%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to attach email source.' using errcode = '42501'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to attach email source in this BRIX workspace.' using errcode = '42501'; end if;
  if not exists (select 1 from public.brix_deals where id = target_deal_id and workspace_id = target_workspace_id and deleted_at is null) then
    raise exception 'The target Deal is not available.' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.properties where id = target_property_id and workspace_id = target_workspace_id and deleted_at is null) then
    raise exception 'The target Property is not available.' using errcode = 'P0002';
  end if;

  select * into email_record
  from public.email_sources
  where id = target_email_source_id and workspace_id = target_workspace_id
  for update;
  if email_record.id is null then raise exception 'Email source is not available.' using errcode = 'P0002'; end if;

  update public.email_sources
  set deal_id = target_deal_id,
      property_id = target_property_id,
      intake_id = coalesce(email_sources.intake_id, target_intake_id)
  where id = target_email_source_id
  returning * into email_record;

  update public.manual_source_records
  set deal_id = target_deal_id,
      property_id = target_property_id
  where workspace_id = target_workspace_id
    and id = email_record.source_record_id
  returning * into source_record;

  update public.intake_value_proposals
  set deal_id = target_deal_id,
      property_id = target_property_id
  where workspace_id = target_workspace_id
    and source_record_id = source_record.id;

  update public.email_source_attachments esa
  set updated_at = now()
  where esa.workspace_id = target_workspace_id
    and esa.email_source_id = target_email_source_id;

  update public.evidence_items
  set deal_id = target_deal_id,
      property_id = target_property_id
  where workspace_id = target_workspace_id
    and id in (select evidence_id from public.email_source_attachments where workspace_id = target_workspace_id and email_source_id = target_email_source_id and evidence_id is not null);

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    target_deal_id,
    target_property_id,
    current_user_id,
    'email.attached_to_deal',
    'email_sources',
    'email_source',
    target_email_source_id,
    'attach_email_source_to_deal',
    target_email_source_id::text || ':attach_email_source_to_deal:audit',
    jsonb_build_object('deal_id', target_deal_id, 'property_id', target_property_id),
    array['deal_id', 'property_id'],
    jsonb_build_object('intake_id', coalesce(target_intake_id, email_record.intake_id), 'source_record_id', source_record.id)
  )
  on conflict do nothing;

  email_source_id := target_email_source_id;
  intake_id := coalesce(target_intake_id, email_record.intake_id);
  source_record_id := source_record.id;
  deal_id := target_deal_id;
  property_id := target_property_id;
  return next;
end;
$$;

revoke all on function public.can_record_email_intake(uuid) from public;
revoke all on function public.record_email_intake_result(uuid, text, jsonb, jsonb, jsonb) from public;
revoke all on function public.attach_email_source_to_deal(uuid, uuid, uuid, uuid, uuid) from public;

grant execute on function public.can_record_email_intake(uuid) to authenticated;
grant execute on function public.record_email_intake_result(uuid, text, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.attach_email_source_to_deal(uuid, uuid, uuid, uuid, uuid) to authenticated;

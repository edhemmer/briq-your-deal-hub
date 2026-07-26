-- Specification 004 slice 3: file, image, and document intake.
-- Preserves one uploaded item as private workspace-scoped Evidence and records
-- extracted values as proposals only. No authoritative Deal facts are accepted here.

create extension if not exists pgcrypto;

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
    'uploading',
    'validating',
    'searching_existing_evidence',
    'processing_source',
    'enriching',
    'awaiting_verification',
    'awaiting_evidence_decision',
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
  check (source_type in ('manual', 'listing_url', 'file', 'image', 'document'));

alter table public.manual_source_records alter column deal_id drop not null;
alter table public.manual_source_records alter column property_id drop not null;

alter table public.manual_source_records drop constraint if exists manual_source_records_source_type_check;
alter table public.manual_source_records
  add constraint manual_source_records_source_type_check
  check (source_type in ('manual', 'listing_url', 'file', 'image', 'document'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brix-evidence',
  'brix-evidence',
  false,
  5242880,
  array[
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  intake_id uuid references public.property_intakes(id) on delete set null,
  deal_id uuid references public.brix_deals(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  source_record_id uuid references public.manual_source_records(id) on delete set null,
  evidence_type text not null check (evidence_type in ('file', 'image', 'document')),
  original_filename text not null,
  sanitized_filename text not null,
  declared_mime_type text,
  detected_mime_type text not null,
  byte_size integer not null check (byte_size > 0 and byte_size <= 5242880),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  storage_bucket text not null default 'brix-evidence',
  storage_object_key text not null,
  storage_version integer not null default 1,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  processing_status text not null default 'queued' check (processing_status in ('queued', 'processing', 'complete', 'partially_complete', 'failed')),
  extraction_status text not null default 'not_started' check (extraction_status in ('not_started', 'complete', 'partially_complete', 'unsupported', 'failed')),
  extraction_version text,
  page_count integer,
  image_width integer,
  image_height integer,
  license_use_restrictions text,
  retention_state text not null default 'active' check (retention_state in ('active', 'retained', 'deletion_pending', 'deleted')),
  safe_error text,
  supersedes_evidence_id uuid references public.evidence_items(id) on delete set null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, content_hash)
);

drop trigger if exists touch_evidence_items on public.evidence_items;
create trigger touch_evidence_items
before update on public.evidence_items
for each row execute function public.touch_versioned_record();

create index if not exists idx_evidence_items_workspace_uploaded
  on public.evidence_items(workspace_id, uploaded_at desc);

create index if not exists idx_evidence_items_workspace_deal
  on public.evidence_items(workspace_id, deal_id, uploaded_at desc)
  where deal_id is not null;

create table if not exists public.intake_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  intake_id uuid references public.property_intakes(id) on delete set null,
  evidence_id uuid references public.evidence_items(id) on delete cascade,
  job_type text not null check (job_type in ('file_evidence_intake')),
  status text not null check (status in ('queued', 'processing', 'completed', 'completed_with_warning', 'failed', 'cancelled')),
  idempotency_key text not null,
  requested_by uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  attempt_count integer not null default 1 check (attempt_count > 0),
  progress integer not null default 0 check (progress between 0 and 100),
  workflow_version text not null default 'file-evidence-intake-v1',
  safe_error_category text,
  safe_error_message text,
  output_refs jsonb not null default '{}'::jsonb check (jsonb_typeof(output_refs) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

drop trigger if exists touch_intake_processing_jobs on public.intake_processing_jobs;
create trigger touch_intake_processing_jobs
before update on public.intake_processing_jobs
for each row execute function public.touch_versioned_record();

create index if not exists idx_intake_processing_jobs_workspace_status
  on public.intake_processing_jobs(workspace_id, status, updated_at desc);

alter table public.manual_source_records add column if not exists evidence_id uuid references public.evidence_items(id) on delete set null;
alter table public.manual_source_records add column if not exists content_hash text;
alter table public.manual_source_records add column if not exists processing_version text;
alter table public.manual_source_records add column if not exists safe_error text;

alter table public.intake_value_proposals add column if not exists evidence_id uuid references public.evidence_items(id) on delete set null;
alter table public.intake_value_proposals add column if not exists source_anchor jsonb not null default '{}'::jsonb check (jsonb_typeof(source_anchor) = 'object');
alter table public.intake_value_proposals add column if not exists unit text;
alter table public.intake_value_proposals add column if not exists currency text;
alter table public.intake_value_proposals add column if not exists extractor_version text;

alter table public.evidence_items enable row level security;
alter table public.intake_processing_jobs enable row level security;

drop policy if exists "evidence items read workspace managers" on public.evidence_items;
create policy "evidence items read workspace managers"
  on public.evidence_items for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "evidence items no direct insert" on public.evidence_items;
create policy "evidence items no direct insert"
  on public.evidence_items for insert to authenticated
  with check (false);

drop policy if exists "evidence items no direct update" on public.evidence_items;
create policy "evidence items no direct update"
  on public.evidence_items for update to authenticated
  using (false)
  with check (false);

drop policy if exists "evidence items no direct delete" on public.evidence_items;
create policy "evidence items no direct delete"
  on public.evidence_items for delete to authenticated
  using (false);

drop policy if exists "intake processing jobs read workspace managers" on public.intake_processing_jobs;
create policy "intake processing jobs read workspace managers"
  on public.intake_processing_jobs for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "intake processing jobs no direct insert" on public.intake_processing_jobs;
create policy "intake processing jobs no direct insert"
  on public.intake_processing_jobs for insert to authenticated
  with check (false);

drop policy if exists "intake processing jobs no direct update" on public.intake_processing_jobs;
create policy "intake processing jobs no direct update"
  on public.intake_processing_jobs for update to authenticated
  using (false)
  with check (false);

drop policy if exists "intake processing jobs no direct delete" on public.intake_processing_jobs;
create policy "intake processing jobs no direct delete"
  on public.intake_processing_jobs for delete to authenticated
  using (false);

create or replace function public.can_record_file_evidence_intake(target_workspace_id uuid)
returns boolean
language sql
security invoker
set search_path = public
as $$
  select auth.uid() is not null and public.has_workspace_permission(target_workspace_id, 'deals:manage');
$$;

create or replace function public.record_file_evidence_intake_result(
  target_workspace_id uuid,
  idempotency_key text,
  file_metadata jsonb,
  extracted_proposals jsonb default '[]'::jsonb
)
returns table (
  intake_id uuid,
  source_record_id uuid,
  evidence_id uuid,
  duplicate_of_evidence_id uuid,
  job_id uuid,
  proposal_count integer,
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
  safe_meta jsonb := public.safe_event_jsonb(coalesce(file_metadata, '{}'::jsonb));
  proposal jsonb;
  evidence_record public.evidence_items%rowtype;
  source_record public.manual_source_records%rowtype;
  intake_record public.property_intakes%rowtype;
  job_record public.intake_processing_jobs%rowtype;
  file_hash text := lower(nullif(btrim(safe_meta ->> 'contentHash'), ''));
  evidence_kind text := coalesce(nullif(btrim(safe_meta ->> 'evidenceType'), ''), 'file');
  detected_mime text := nullif(btrim(safe_meta ->> 'detectedMimeType'), '');
  byte_count integer := coalesce(nullif(btrim(safe_meta ->> 'byteSize'), '')::integer, 0);
  duplicate_id uuid;
  extraction_state text := coalesce(nullif(btrim(safe_meta ->> 'extractionStatus'), ''), 'unsupported');
  processing_state text := coalesce(nullif(btrim(safe_meta ->> 'processingStatus'), ''), 'complete');
  source_kind text;
begin
  if current_user_id is null then raise exception 'Authentication required to import Evidence.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to import Evidence.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to import Evidence in this BRIX workspace.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_meta) <> 'object' then raise exception 'File metadata must be an object.' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(extracted_proposals, '[]'::jsonb)) <> 'array' then raise exception 'Evidence proposals must be an array.' using errcode = '22023'; end if;
  if file_hash is null or file_hash !~ '^[a-f0-9]{64}$' then raise exception 'Evidence hash is invalid.' using errcode = '22023'; end if;
  if byte_count <= 0 or byte_count > 5242880 then raise exception 'Evidence size is outside the supported limit.' using errcode = '22023'; end if;
  if evidence_kind not in ('file', 'image', 'document') then evidence_kind := 'file'; end if;
  if detected_mime not in (
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ) then raise exception 'Evidence MIME type is not supported.' using errcode = '22023'; end if;
  if extraction_state not in ('not_started', 'complete', 'partially_complete', 'unsupported', 'failed') then extraction_state := 'unsupported'; end if;
  if processing_state not in ('queued', 'processing', 'complete', 'partially_complete', 'failed') then processing_state := 'complete'; end if;
  source_kind := case when evidence_kind = 'image' then 'image' when evidence_kind = 'document' then 'document' else 'file' end;

  select * into evidence_record
  from public.evidence_items
  where workspace_id = target_workspace_id and content_hash = file_hash
  for update;

  duplicate_id := evidence_record.id;

  insert into public.property_intakes (workspace_id, user_id, state, source_type, original_input, normalized_location, duplicate_decision, idempotency_key)
  values (
    target_workspace_id,
    current_user_id,
    case when evidence_record.id is null then 'processing_source' else 'awaiting_evidence_decision' end,
    source_kind,
    jsonb_build_object(
      'original_filename', safe_meta ->> 'originalFilename',
      'sanitized_filename', safe_meta ->> 'sanitizedFilename',
      'detected_mime_type', detected_mime,
      'byte_size', byte_count,
      'content_hash', file_hash
    ),
    '{}'::jsonb,
    'none',
    cleaned_key
  )
  on conflict (workspace_id, idempotency_key) do update set
    state = case when property_intakes.state = 'complete' then property_intakes.state else excluded.state end,
    original_input = excluded.original_input
  returning * into intake_record;

  if intake_record.user_id <> current_user_id then
    raise exception 'This Evidence intake belongs to another user.' using errcode = '42501';
  end if;

  if evidence_record.id is null then
    insert into public.evidence_items (
      workspace_id,
      intake_id,
      evidence_type,
      original_filename,
      sanitized_filename,
      declared_mime_type,
      detected_mime_type,
      byte_size,
      content_hash,
      storage_bucket,
      storage_object_key,
      uploaded_by,
      processing_status,
      extraction_status,
      extraction_version,
      page_count,
      image_width,
      image_height,
      license_use_restrictions,
      safe_error
    )
    values (
      target_workspace_id,
      intake_record.id,
      evidence_kind,
      coalesce(nullif(btrim(safe_meta ->> 'originalFilename'), ''), 'uploaded evidence'),
      coalesce(nullif(btrim(safe_meta ->> 'sanitizedFilename'), ''), 'uploaded-evidence'),
      nullif(btrim(safe_meta ->> 'declaredMimeType'), ''),
      detected_mime,
      byte_count,
      file_hash,
      'brix-evidence',
      coalesce(nullif(btrim(safe_meta ->> 'storageObjectKey'), ''), gen_random_uuid()::text),
      current_user_id,
      processing_state,
      extraction_state,
      coalesce(nullif(btrim(safe_meta ->> 'extractionVersion'), ''), 'file-evidence-intake-v1'),
      nullif(btrim(safe_meta ->> 'pageCount'), '')::integer,
      nullif(btrim(safe_meta ->> 'imageWidth'), '')::integer,
      nullif(btrim(safe_meta ->> 'imageHeight'), '')::integer,
      nullif(btrim(safe_meta ->> 'licenseUseRestrictions'), ''),
      nullif(btrim(safe_meta ->> 'safeError'), '')
    )
    on conflict (workspace_id, content_hash) do update set
      updated_at = public.evidence_items.updated_at
    returning * into evidence_record;
  else
    update public.evidence_items
    set intake_id = coalesce(evidence_items.intake_id, intake_record.id)
    where id = evidence_record.id
    returning * into evidence_record;
  end if;

  insert into public.manual_source_records (
    workspace_id,
    intake_id,
    deal_id,
    property_id,
    source_type,
    source_name,
    original_values,
    classification,
    verification_state,
    evidence_id,
    content_hash,
    processing_version,
    safe_error,
    license_use_restrictions,
    retrieved_at,
    created_by
  )
  values (
    target_workspace_id,
    intake_record.id,
    null,
    null,
    source_kind,
    coalesce(nullif(btrim(safe_meta ->> 'originalFilename'), ''), 'Uploaded Evidence'),
    safe_meta,
    jsonb_build_object('evidence', 'user_provided_source', 'verification_state', 'unverified'),
    'unverified',
    evidence_record.id,
    file_hash,
    coalesce(nullif(btrim(safe_meta ->> 'extractionVersion'), ''), 'file-evidence-intake-v1'),
    nullif(btrim(safe_meta ->> 'safeError'), ''),
    nullif(btrim(safe_meta ->> 'licenseUseRestrictions'), ''),
    now(),
    current_user_id
  )
  on conflict (workspace_id, intake_id) do update set
    evidence_id = excluded.evidence_id,
    content_hash = excluded.content_hash,
    original_values = excluded.original_values,
    safe_error = excluded.safe_error
  returning * into source_record;

  update public.evidence_items
  set source_record_id = source_record.id
  where id = evidence_record.id
  returning * into evidence_record;

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
    failed_at,
    progress,
    workflow_version,
    safe_error_category,
    safe_error_message,
    output_refs
  )
  values (
    target_workspace_id,
    intake_record.id,
    evidence_record.id,
    'file_evidence_intake',
    case when extraction_state = 'failed' then 'completed_with_warning' else 'completed' end,
    cleaned_key || ':job',
    current_user_id,
    now(),
    now(),
    null,
    100,
    'file-evidence-intake-v1',
    case when extraction_state in ('failed', 'unsupported') then extraction_state else null end,
    nullif(btrim(safe_meta ->> 'safeError'), ''),
    jsonb_build_object('evidence_id', evidence_record.id, 'source_record_id', source_record.id, 'proposal_count', jsonb_array_length(extracted_proposals))
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
      evidence_record.id,
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
      coalesce(nullif(btrim(proposal ->> 'sourceKey'), ''), 'file_evidence'),
      case when jsonb_typeof(proposal -> 'sourceAnchor') = 'object' then proposal -> 'sourceAnchor' else '{}'::jsonb end,
      nullif(btrim(proposal ->> 'unit'), ''),
      nullif(btrim(proposal ->> 'currency'), ''),
      coalesce(nullif(btrim(proposal ->> 'extractorVersion'), ''), 'file-evidence-intake-v1'),
      current_user_id
    )
    on conflict (workspace_id, source_record_id, canonical_subject, canonical_field, normalized_value) do update set
      evidence_id = excluded.evidence_id,
      display_value = excluded.display_value,
      confidence = excluded.confidence,
      source_anchor = excluded.source_anchor,
      extractor_version = excluded.extractor_version;
  end loop;

  update public.property_intakes
  set state = 'awaiting_evidence_decision',
      safe_error_category = case when extraction_state in ('failed', 'unsupported') then extraction_state else null end
  where id = intake_record.id
  returning * into intake_record;

  insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values
    (target_workspace_id, current_user_id, 'intake.created', 'intake', intake_record.id, 'record_file_evidence_intake_result', cleaned_key || ':intake.created', jsonb_build_object('source_type', source_kind)),
    (target_workspace_id, current_user_id, 'intake.source_received', 'evidence', evidence_record.id, 'record_file_evidence_intake_result', cleaned_key || ':intake.source_received', jsonb_build_object('source_type', source_kind, 'duplicate', duplicate_id is not null)),
    (target_workspace_id, current_user_id, 'source.import_completed', 'source_record', source_record.id, 'record_file_evidence_intake_result', cleaned_key || ':source.import_completed', jsonb_build_object('source_type', source_kind, 'extraction_status', extraction_state))
  on conflict do nothing;

  insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  select target_workspace_id, current_user_id, 'value.proposed', 'intake_value_proposal', id, 'record_file_evidence_intake_result', id::text || ':value.proposed', jsonb_build_object('field', canonical_field, 'source_type', source_kind)
  from public.intake_value_proposals
  where workspace_id = target_workspace_id and source_record_id = source_record.id
  on conflict do nothing;

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    current_user_id,
    'evidence.imported',
    'evidence_items',
    'evidence',
    evidence_record.id,
    'record_file_evidence_intake_result',
    cleaned_key || ':audit',
    jsonb_build_object('evidence_id', evidence_record.id, 'source_record_id', source_record.id, 'duplicate_of_evidence_id', duplicate_id),
    array['evidence_items', 'manual_source_records', 'intake_value_proposals'],
    jsonb_build_object('source_type', source_kind, 'content_hash', file_hash, 'proposal_count', jsonb_array_length(extracted_proposals))
  )
  on conflict do nothing;

  intake_id := intake_record.id;
  source_record_id := source_record.id;
  evidence_id := evidence_record.id;
  duplicate_of_evidence_id := duplicate_id;
  job_id := job_record.id;
  select count(*)::integer into proposal_count from public.intake_value_proposals where workspace_id = target_workspace_id and source_record_id = source_record.id;
  import_status := case when duplicate_id is not null then 'duplicate' when extraction_state in ('complete', 'partially_complete') then extraction_state else 'preserved' end;
  safe_message := case
    when duplicate_id is not null then 'This file was already saved in your BRIX account. BRIX linked the existing Evidence record.'
    when extraction_state in ('complete', 'partially_complete') then 'Evidence saved. Review extracted candidate values before creating the Deal.'
    when extraction_state = 'unsupported' then 'Evidence saved. This file type is preserved, but BRIX could not extract values in this slice.'
    else 'Evidence saved. Extraction did not complete, and manual intake remains available.'
  end;
  return next;
end;
$$;

create or replace function public.attach_file_evidence_to_deal(
  target_workspace_id uuid,
  target_evidence_id uuid,
  target_intake_id uuid,
  target_deal_id uuid,
  target_property_id uuid
)
returns table (
  evidence_id uuid,
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
  evidence_record public.evidence_items%rowtype;
  source_record public.manual_source_records%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required to attach Evidence.' using errcode = '42501'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to attach Evidence in this BRIX workspace.' using errcode = '42501'; end if;
  if not exists (select 1 from public.brix_deals where id = target_deal_id and workspace_id = target_workspace_id and deleted_at is null) then
    raise exception 'The target Deal is not available.' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.properties where id = target_property_id and workspace_id = target_workspace_id and deleted_at is null) then
    raise exception 'The target Property is not available.' using errcode = 'P0002';
  end if;

  select * into evidence_record
  from public.evidence_items
  where id = target_evidence_id and workspace_id = target_workspace_id
  for update;
  if evidence_record.id is null then raise exception 'Evidence is not available.' using errcode = 'P0002'; end if;

  update public.evidence_items
  set deal_id = target_deal_id,
      property_id = target_property_id,
      intake_id = coalesce(evidence_items.intake_id, target_intake_id)
  where id = target_evidence_id
  returning * into evidence_record;

  update public.manual_source_records
  set deal_id = target_deal_id,
      property_id = target_property_id
  where workspace_id = target_workspace_id
    and evidence_id = target_evidence_id
    and (target_intake_id is null or intake_id = target_intake_id)
  returning * into source_record;

  update public.intake_value_proposals
  set deal_id = target_deal_id,
      property_id = target_property_id
  where workspace_id = target_workspace_id
    and evidence_id = target_evidence_id;

  update public.property_intakes
  set resulting_deal_id = target_deal_id,
      resulting_property_id = target_property_id,
      completed_at = coalesce(completed_at, now())
  where id = coalesce(target_intake_id, evidence_record.intake_id)
    and workspace_id = target_workspace_id;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values (
    target_workspace_id,
    target_deal_id,
    target_property_id,
    current_user_id,
    'source.import_completed',
    'evidence',
    target_evidence_id,
    'attach_file_evidence_to_deal',
    target_evidence_id::text || ':attach_file_evidence_to_deal',
    jsonb_build_object('intake_id', coalesce(target_intake_id, evidence_record.intake_id), 'source_record_id', source_record.id)
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    target_deal_id,
    target_property_id,
    current_user_id,
    'evidence.attached_to_deal',
    'evidence_items',
    'evidence',
    target_evidence_id,
    'attach_file_evidence_to_deal',
    target_evidence_id::text || ':attach_file_evidence_to_deal:audit',
    jsonb_build_object('deal_id', target_deal_id, 'property_id', target_property_id),
    array['deal_id', 'property_id'],
    jsonb_build_object('intake_id', coalesce(target_intake_id, evidence_record.intake_id), 'source_record_id', source_record.id)
  )
  on conflict do nothing;

  evidence_id := target_evidence_id;
  intake_id := coalesce(target_intake_id, evidence_record.intake_id);
  source_record_id := source_record.id;
  deal_id := target_deal_id;
  property_id := target_property_id;
  return next;
end;
$$;

revoke all on function public.can_record_file_evidence_intake(uuid) from public;
revoke all on function public.record_file_evidence_intake_result(uuid, text, jsonb, jsonb) from public;
revoke all on function public.attach_file_evidence_to_deal(uuid, uuid, uuid, uuid, uuid) from public;

grant execute on function public.can_record_file_evidence_intake(uuid) to authenticated;
grant execute on function public.record_file_evidence_intake_result(uuid, text, jsonb, jsonb) to authenticated;
grant execute on function public.attach_file_evidence_to_deal(uuid, uuid, uuid, uuid, uuid) to authenticated;

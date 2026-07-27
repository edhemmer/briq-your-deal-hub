-- Specification 004: Canonical Source Classification.
-- Deterministic source identity and routing metadata only.
-- This does not enable extraction, MLS access, OCR, AI, underwriting, or reports.

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'manual_source_records',
    'evidence_items',
    'email_sources',
    'email_source_attachments',
    'intake_batch_items'
  ] loop
    execute format('alter table public.%I add column if not exists canonical_source_class text', target_table);
    execute format('alter table public.%I add column if not exists canonical_source_subtype text', target_table);
    execute format('alter table public.%I add column if not exists classification_confidence_tier text', target_table);
    execute format('alter table public.%I add column if not exists classification_version text', target_table);
    execute format('alter table public.%I add column if not exists classification_method text', target_table);
    execute format('alter table public.%I add column if not exists classification_evidence jsonb not null default ''[]''::jsonb', target_table);
    execute format('alter table public.%I add column if not exists classification_review_status text not null default ''needs_review''', target_table);
    execute format('alter table public.%I add column if not exists processing_eligibility jsonb not null default ''{}''::jsonb', target_table);
    execute format('alter table public.%I add column if not exists allowed_extraction_engines text[] not null default ''{}''::text[]', target_table);
    execute format('alter table public.%I add column if not exists supported_downstream_modules text[] not null default ''{}''::text[]', target_table);
    execute format('alter table public.%I add column if not exists classified_at timestamptz', target_table);
    execute format('alter table public.%I add column if not exists classified_by uuid references auth.users(id) on delete set null', target_table);

    execute format('alter table public.%I drop constraint if exists %I', target_table, target_table || '_canonical_source_class_supported');
    execute format(
      'alter table public.%I add constraint %I check (canonical_source_class is null or canonical_source_class in (''manual'', ''listing_url'', ''mls_listing'', ''county_record'', ''tax_record'', ''assessment'', ''survey'', ''plat'', ''legal_description'', ''purchase_contract'', ''counter_offer'', ''addendum'', ''inspection_report'', ''roof_report'', ''foundation_report'', ''environmental_report'', ''hoa_documents'', ''ccr'', ''budget'', ''reserve_study'', ''disclosure'', ''seller_disclosure'', ''lead_paint'', ''well'', ''septic'', ''insurance_quote'', ''policy'', ''loss_run'', ''appraisal'', ''rent_roll'', ''lease'', ''financial_statement'', ''operating_statement'', ''utility_bill'', ''permit'', ''photo'', ''satellite'', ''street_view'', ''map'', ''title_commitment'', ''closing_statement'', ''settlement_statement'', ''mortgage_estimate'', ''loan_documents'', ''email'', ''attachment'', ''spreadsheet'', ''unknown'', ''future_reserved''))',
      target_table,
      target_table || '_canonical_source_class_supported'
    );

    execute format('alter table public.%I drop constraint if exists %I', target_table, target_table || '_classification_confidence_supported');
    execute format('alter table public.%I add constraint %I check (classification_confidence_tier is null or classification_confidence_tier in (''exact'', ''strong'', ''possible'', ''unknown''))', target_table, target_table || '_classification_confidence_supported');

    execute format('alter table public.%I drop constraint if exists %I', target_table, target_table || '_classification_review_status_supported');
    execute format('alter table public.%I add constraint %I check (classification_review_status in (''system_classified'', ''needs_review'', ''confirmed'', ''changed''))', target_table, target_table || '_classification_review_status_supported');

    execute format('alter table public.%I drop constraint if exists %I', target_table, target_table || '_classification_evidence_array');
    execute format('alter table public.%I add constraint %I check (jsonb_typeof(classification_evidence) = ''array'')', target_table, target_table || '_classification_evidence_array');

    execute format('alter table public.%I drop constraint if exists %I', target_table, target_table || '_processing_eligibility_object');
    execute format('alter table public.%I add constraint %I check (jsonb_typeof(processing_eligibility) = ''object'')', target_table, target_table || '_processing_eligibility_object');
  end loop;
end $$;

create index if not exists idx_manual_source_records_classification
  on public.manual_source_records(workspace_id, canonical_source_class, classification_review_status, updated_at desc);

create index if not exists idx_evidence_items_classification
  on public.evidence_items(workspace_id, canonical_source_class, classification_review_status, updated_at desc);

create index if not exists idx_email_sources_classification
  on public.email_sources(workspace_id, canonical_source_class, classification_review_status, updated_at desc);

create index if not exists idx_email_source_attachments_classification
  on public.email_source_attachments(workspace_id, canonical_source_class, classification_review_status, updated_at desc);

create index if not exists idx_intake_batch_items_classification
  on public.intake_batch_items(workspace_id, canonical_source_class, classification_review_status, updated_at desc);

create or replace function public.record_source_classification(
  target_workspace_id uuid,
  idempotency_key text,
  target_table text,
  target_id uuid,
  classification_input jsonb
)
returns table (
  classified_target_table text,
  classified_target_id uuid,
  canonical_source_class text,
  canonical_source_subtype text,
  classification_confidence_tier text,
  classification_version text,
  classification_review_status text,
  event_type text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  safe_input jsonb := public.safe_event_jsonb(coalesce(classification_input, '{}'::jsonb));
  safe_target_table text := nullif(btrim(target_table), '');
  safe_class text := nullif(btrim(safe_input ->> 'canonicalClass'), '');
  safe_subtype text := left(coalesce(nullif(btrim(safe_input ->> 'canonicalSubtype'), ''), 'unclassified'), 120);
  safe_confidence text := coalesce(nullif(btrim(safe_input ->> 'confidenceTier'), ''), 'unknown');
  safe_version text := coalesce(nullif(btrim(safe_input ->> 'classificationVersion'), ''), 'source-classification-v1');
  safe_method text := coalesce(nullif(btrim(safe_input ->> 'classificationMethod'), ''), 'fallback');
  safe_evidence jsonb := case when jsonb_typeof(safe_input -> 'classificationEvidence') = 'array' then safe_input -> 'classificationEvidence' else '[]'::jsonb end;
  safe_review_status text := coalesce(nullif(btrim(safe_input ->> 'reviewStatus'), ''), 'needs_review');
  safe_processing_eligibility jsonb := case when jsonb_typeof(safe_input -> 'processingEligibility') = 'object' then safe_input -> 'processingEligibility' else '{}'::jsonb end;
  safe_allowed_engines text[] := '{}'::text[];
  safe_supported_modules text[] := '{}'::text[];
  prior_class text;
  prior_subtype text;
  prior_status text;
  row_found boolean := false;
  selected_event_type text;
begin
  if current_user_id is null then raise exception 'Authentication required to classify source.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to classify source.' using errcode = '22023'; end if;
  if target_id is null then raise exception 'A source target is required.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Source classification input must be an object.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to classify sources in this BRIX workspace.' using errcode = '42501'; end if;
  if safe_target_table not in ('manual_source_records', 'evidence_items', 'email_sources', 'email_source_attachments', 'intake_batch_items') then raise exception 'Source classification target is not supported.' using errcode = '22023'; end if;
  if safe_class not in ('manual', 'listing_url', 'mls_listing', 'county_record', 'tax_record', 'assessment', 'survey', 'plat', 'legal_description', 'purchase_contract', 'counter_offer', 'addendum', 'inspection_report', 'roof_report', 'foundation_report', 'environmental_report', 'hoa_documents', 'ccr', 'budget', 'reserve_study', 'disclosure', 'seller_disclosure', 'lead_paint', 'well', 'septic', 'insurance_quote', 'policy', 'loss_run', 'appraisal', 'rent_roll', 'lease', 'financial_statement', 'operating_statement', 'utility_bill', 'permit', 'photo', 'satellite', 'street_view', 'map', 'title_commitment', 'closing_statement', 'settlement_statement', 'mortgage_estimate', 'loan_documents', 'email', 'attachment', 'spreadsheet', 'unknown', 'future_reserved') then raise exception 'Canonical source class is not supported.' using errcode = '22023'; end if;
  if safe_confidence not in ('exact', 'strong', 'possible', 'unknown') then raise exception 'Source classification confidence is not supported.' using errcode = '22023'; end if;
  if safe_method not in ('source_type', 'mime_type', 'extension', 'filename_keyword', 'metadata', 'future_placeholder', 'fallback') then raise exception 'Source classification method is not supported.' using errcode = '22023'; end if;
  if safe_review_status not in ('system_classified', 'needs_review', 'confirmed', 'changed') then raise exception 'Source classification review status is not supported.' using errcode = '22023'; end if;
  if safe_version <> 'source-classification-v1' then raise exception 'Source classification version is not supported.' using errcode = '22023'; end if;

  if jsonb_typeof(safe_input -> 'allowedExtractionEngines') = 'array' then
    if exists (
      select 1
      from jsonb_array_elements_text(safe_input -> 'allowedExtractionEngines') engine(value)
      where engine.value not in ('listing_parser', 'ocr', 'vision', 'condition_engine', 'repair_engine', 'damage_observation', 'contractiq', 'timeline_extraction', 'clause_engine', 'question_generator', 'email_parser', 'attachment_routing', 'spreadsheet_parser', 'map_context', 'evidence_preservation', 'manual_review')
    ) then raise exception 'Source classification extraction engine is not supported.' using errcode = '22023'; end if;
    select coalesce(array_agg(distinct engine.value order by engine.value), '{}'::text[])
    into safe_allowed_engines
    from jsonb_array_elements_text(safe_input -> 'allowedExtractionEngines') engine(value);
  end if;

  if jsonb_typeof(safe_input -> 'supportedDownstreamModules') = 'array' then
    if exists (
      select 1
      from jsonb_array_elements_text(safe_input -> 'supportedDownstreamModules') module(value)
      where module.value not in ('intake', 'evidence', 'dealiq', 'contractiq', 'inspectioniq', 'photoiq', 'financeiq', 'insuranceiq', 'taxiq', 'marketiq', 'reportiq', 'pipelineiq')
    ) then raise exception 'Source classification downstream module is not supported.' using errcode = '22023'; end if;
    select coalesce(array_agg(distinct module.value order by module.value), '{}'::text[])
    into safe_supported_modules
    from jsonb_array_elements_text(safe_input -> 'supportedDownstreamModules') module(value);
  end if;

  if safe_target_table = 'manual_source_records' then
    select canonical_source_class, canonical_source_subtype, classification_review_status into prior_class, prior_subtype, prior_status
    from public.manual_source_records where workspace_id = target_workspace_id and id = target_id for update;
    row_found := found;
    update public.manual_source_records set canonical_source_class = safe_class, canonical_source_subtype = safe_subtype, classification_confidence_tier = safe_confidence, classification_version = safe_version, classification_method = safe_method, classification_evidence = safe_evidence, classification_review_status = safe_review_status, processing_eligibility = safe_processing_eligibility, allowed_extraction_engines = safe_allowed_engines, supported_downstream_modules = safe_supported_modules, classified_at = now(), classified_by = current_user_id where workspace_id = target_workspace_id and id = target_id;
  elsif safe_target_table = 'evidence_items' then
    select canonical_source_class, canonical_source_subtype, classification_review_status into prior_class, prior_subtype, prior_status
    from public.evidence_items where workspace_id = target_workspace_id and id = target_id for update;
    row_found := found;
    update public.evidence_items set canonical_source_class = safe_class, canonical_source_subtype = safe_subtype, classification_confidence_tier = safe_confidence, classification_version = safe_version, classification_method = safe_method, classification_evidence = safe_evidence, classification_review_status = safe_review_status, processing_eligibility = safe_processing_eligibility, allowed_extraction_engines = safe_allowed_engines, supported_downstream_modules = safe_supported_modules, classified_at = now(), classified_by = current_user_id where workspace_id = target_workspace_id and id = target_id;
  elsif safe_target_table = 'email_sources' then
    select canonical_source_class, canonical_source_subtype, classification_review_status into prior_class, prior_subtype, prior_status
    from public.email_sources where workspace_id = target_workspace_id and id = target_id for update;
    row_found := found;
    update public.email_sources set canonical_source_class = safe_class, canonical_source_subtype = safe_subtype, classification_confidence_tier = safe_confidence, classification_version = safe_version, classification_method = safe_method, classification_evidence = safe_evidence, classification_review_status = safe_review_status, processing_eligibility = safe_processing_eligibility, allowed_extraction_engines = safe_allowed_engines, supported_downstream_modules = safe_supported_modules, classified_at = now(), classified_by = current_user_id where workspace_id = target_workspace_id and id = target_id;
  elsif safe_target_table = 'email_source_attachments' then
    select canonical_source_class, canonical_source_subtype, classification_review_status into prior_class, prior_subtype, prior_status
    from public.email_source_attachments where workspace_id = target_workspace_id and id = target_id for update;
    row_found := found;
    update public.email_source_attachments set canonical_source_class = safe_class, canonical_source_subtype = safe_subtype, classification_confidence_tier = safe_confidence, classification_version = safe_version, classification_method = safe_method, classification_evidence = safe_evidence, classification_review_status = safe_review_status, processing_eligibility = safe_processing_eligibility, allowed_extraction_engines = safe_allowed_engines, supported_downstream_modules = safe_supported_modules, classified_at = now(), classified_by = current_user_id where workspace_id = target_workspace_id and id = target_id;
  elsif safe_target_table = 'intake_batch_items' then
    select canonical_source_class, canonical_source_subtype, classification_review_status into prior_class, prior_subtype, prior_status
    from public.intake_batch_items where workspace_id = target_workspace_id and id = target_id for update;
    row_found := found;
    update public.intake_batch_items set canonical_source_class = safe_class, canonical_source_subtype = safe_subtype, classification_confidence_tier = safe_confidence, classification_version = safe_version, classification_method = safe_method, classification_evidence = safe_evidence, classification_review_status = safe_review_status, processing_eligibility = safe_processing_eligibility, allowed_extraction_engines = safe_allowed_engines, supported_downstream_modules = safe_supported_modules, classified_at = now(), classified_by = current_user_id where workspace_id = target_workspace_id and id = target_id;
  end if;

  if not row_found then raise exception 'Source classification target was not found in this workspace.' using errcode = '42501'; end if;

  if safe_review_status = 'confirmed' then
    selected_event_type := 'classification.confirmed';
  elsif prior_class is null then
    selected_event_type := 'source.classified';
  elsif prior_class is distinct from safe_class or prior_subtype is distinct from safe_subtype or prior_status is distinct from safe_review_status then
    selected_event_type := 'classification.changed';
  end if;

  if selected_event_type is not null then
    insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
    values (
      target_workspace_id,
      current_user_id,
      selected_event_type,
      safe_target_table,
      target_id,
      'record_source_classification',
      cleaned_key || ':' || selected_event_type,
      jsonb_build_object('target_table', safe_target_table, 'target_id', target_id, 'canonical_source_class', safe_class, 'canonical_source_subtype', safe_subtype, 'classification_version', safe_version, 'classification_method', safe_method)
    )
    on conflict do nothing;

    insert into public.audit_events (workspace_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
    values (
      target_workspace_id,
      current_user_id,
      selected_event_type,
      safe_target_table,
      'source_classification',
      target_id,
      'record_source_classification',
      cleaned_key || ':audit',
      jsonb_build_object('canonical_source_class', safe_class, 'canonical_source_subtype', safe_subtype, 'classification_confidence_tier', safe_confidence, 'classification_review_status', safe_review_status),
      array['canonical_source_class', 'canonical_source_subtype', 'classification_confidence_tier', 'classification_review_status'],
      jsonb_build_object('classification_version', safe_version, 'classification_method', safe_method)
    )
    on conflict do nothing;
  end if;

  classified_target_table := safe_target_table;
  classified_target_id := target_id;
  canonical_source_class := safe_class;
  canonical_source_subtype := safe_subtype;
  classification_confidence_tier := safe_confidence;
  classification_version := safe_version;
  classification_review_status := safe_review_status;
  event_type := selected_event_type;
  return next;
end;
$$;

revoke all on function public.record_source_classification(uuid, text, text, uuid, jsonb) from public;
grant execute on function public.record_source_classification(uuid, text, text, uuid, jsonb) to authenticated;

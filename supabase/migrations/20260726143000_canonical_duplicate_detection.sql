-- Canonical duplicate detection consolidation.
-- This migration records explicit duplicate decisions only. It does not merge,
-- discard, overwrite, or import candidate records.

create table if not exists public.duplicate_decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  subject_type text not null check (subject_type in ('property', 'deal', 'evidence', 'listing_source', 'email_source', 'source_record', 'intake', 'shared_handoff', 'batch_item')),
  subject_identity jsonb not null default '{}'::jsonb check (jsonb_typeof(subject_identity) = 'object'),
  candidate_subject_type text check (candidate_subject_type in ('property', 'deal', 'evidence', 'listing_source', 'email_source', 'source_record', 'intake', 'shared_handoff', 'batch_item')),
  candidate_canonical_id uuid,
  candidate_identity jsonb not null default '{}'::jsonb check (jsonb_typeof(candidate_identity) = 'object'),
  duplicate_rule_registry_version text not null,
  duplicate_rule_id text,
  duplicate_rule_version integer,
  duplicate_score integer check (duplicate_score between 0 and 100),
  duplicate_confidence text check (duplicate_confidence in ('exact', 'strong', 'possible')),
  decision text not null check (decision in ('reuse_existing', 'attach_existing', 'create_separate', 'not_duplicate', 'defer', 'cancel')),
  rationale_category text not null check (rationale_category in ('exact_identity', 'same_property', 'same_source', 'same_evidence', 'not_same', 'needs_review', 'user_cancelled')),
  safe_user_note text,
  request_hash text not null,
  idempotency_key text not null,
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

alter table public.duplicate_decisions enable row level security;

drop policy if exists "duplicate decisions read workspace managers" on public.duplicate_decisions;
create policy "duplicate decisions read workspace managers"
  on public.duplicate_decisions for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "duplicate decisions no direct insert" on public.duplicate_decisions;
create policy "duplicate decisions no direct insert"
  on public.duplicate_decisions for insert to authenticated
  with check (false);

drop policy if exists "duplicate decisions no direct update" on public.duplicate_decisions;
create policy "duplicate decisions no direct update"
  on public.duplicate_decisions for update to authenticated
  using (false)
  with check (false);

drop policy if exists "duplicate decisions no direct delete" on public.duplicate_decisions;
create policy "duplicate decisions no direct delete"
  on public.duplicate_decisions for delete to authenticated
  using (false);

drop trigger if exists touch_duplicate_decisions_updated_at on public.duplicate_decisions;
create trigger touch_duplicate_decisions_updated_at
before update on public.duplicate_decisions
for each row execute function public.touch_updated_at();

create index if not exists idx_duplicate_decisions_workspace_subject
  on public.duplicate_decisions(workspace_id, subject_type, decided_at desc);

create index if not exists idx_duplicate_decisions_candidate
  on public.duplicate_decisions(workspace_id, candidate_subject_type, candidate_canonical_id)
  where candidate_canonical_id is not null;

create index if not exists idx_duplicate_decisions_request_hash
  on public.duplicate_decisions(workspace_id, request_hash);

create index if not exists idx_properties_workspace_address_unit_lookup
  on public.properties(workspace_id, lower(display_address), lower(coalesce(address_line2, '')))
  where deleted_at is null;

create index if not exists idx_properties_workspace_parcel_lookup
  on public.properties(workspace_id, parcel_identifier)
  where deleted_at is null and parcel_identifier is not null;

create index if not exists idx_deal_properties_workspace_property_duplicate_lookup
  on public.deal_properties(workspace_id, property_id, deal_id)
  where inclusion_status = 'active';

create index if not exists idx_manual_source_records_workspace_url_lookup
  on public.manual_source_records(workspace_id, source_url)
  where source_url is not null;

create index if not exists idx_manual_source_records_workspace_hash_lookup
  on public.manual_source_records(workspace_id, content_hash)
  where content_hash is not null;

create index if not exists idx_intakes_workspace_idempotency_lookup
  on public.property_intakes(workspace_id, idempotency_key);

create index if not exists idx_batch_items_workspace_hash_lookup
  on public.intake_batch_items(workspace_id, content_hash)
  where content_hash is not null;

create or replace function public.record_duplicate_decision(
  target_workspace_id uuid,
  idempotency_key text,
  decision_input jsonb
)
returns table (
  duplicate_decision_id uuid,
  decision text,
  subject_type text,
  candidate_subject_type text,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  safe_input jsonb := public.safe_event_jsonb(coalesce(decision_input, '{}'::jsonb));
  safe_subject text := nullif(btrim(safe_input ->> 'subjectType'), '');
  safe_candidate_subject text := nullif(btrim(safe_input -> 'candidate' ->> 'subjectType'), '');
  safe_decision text := nullif(btrim(safe_input ->> 'decision'), '');
  safe_rationale text := nullif(btrim(safe_input ->> 'rationaleCategory'), '');
  safe_rule_registry_version text := coalesce(nullif(btrim(safe_input ->> 'ruleRegistryVersion'), ''), 'duplicate-detection-v1');
  safe_rule_id text := nullif(btrim(safe_input -> 'candidate' ->> 'ruleId'), '');
  safe_rule_version integer := nullif(btrim(safe_input -> 'candidate' ->> 'ruleVersion'), '')::integer;
  safe_score integer := nullif(btrim(safe_input -> 'candidate' ->> 'score'), '')::integer;
  safe_confidence text := nullif(btrim(safe_input -> 'candidate' ->> 'confidence'), '');
  candidate_id uuid := nullif(btrim(safe_input -> 'candidate' ->> 'candidateCanonicalId'), '')::uuid;
  inserted public.duplicate_decisions%rowtype;
  computed_hash text;
begin
  if current_user_id is null then raise exception 'Authentication required to record duplicate decision.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to record duplicate decision.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Duplicate decision input must be an object.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to record duplicate decisions in this BRIX workspace.' using errcode = '42501'; end if;
  if safe_subject not in ('property', 'deal', 'evidence', 'listing_source', 'email_source', 'source_record', 'intake', 'shared_handoff', 'batch_item') then raise exception 'Duplicate subject type is not supported.' using errcode = '22023'; end if;
  if safe_candidate_subject is not null and safe_candidate_subject not in ('property', 'deal', 'evidence', 'listing_source', 'email_source', 'source_record', 'intake', 'shared_handoff', 'batch_item') then raise exception 'Duplicate candidate subject type is not supported.' using errcode = '22023'; end if;
  if safe_decision not in ('reuse_existing', 'attach_existing', 'create_separate', 'not_duplicate', 'defer', 'cancel') then raise exception 'Duplicate decision is not supported.' using errcode = '22023'; end if;
  if safe_rationale not in ('exact_identity', 'same_property', 'same_source', 'same_evidence', 'not_same', 'needs_review', 'user_cancelled') then raise exception 'Duplicate decision rationale is not supported.' using errcode = '22023'; end if;
  if safe_confidence is not null and safe_confidence not in ('exact', 'strong', 'possible') then raise exception 'Duplicate confidence is not supported.' using errcode = '22023'; end if;
  if safe_score is not null and (safe_score < 0 or safe_score > 100) then raise exception 'Duplicate score is outside the supported range.' using errcode = '22023'; end if;

  computed_hash := md5(jsonb_build_object(
    'subjectType', safe_subject,
    'subjectIdentity', coalesce(safe_input -> 'subjectIdentity', '{}'::jsonb),
    'candidateSubjectType', safe_candidate_subject,
    'candidateCanonicalId', candidate_id,
    'candidateIdentity', coalesce(safe_input -> 'candidate' -> 'identity', '{}'::jsonb),
    'decision', safe_decision,
    'rationaleCategory', safe_rationale,
    'ruleRegistryVersion', safe_rule_registry_version,
    'ruleId', safe_rule_id,
    'ruleVersion', safe_rule_version
  )::text);

  insert into public.duplicate_decisions (
    workspace_id,
    subject_type,
    subject_identity,
    candidate_subject_type,
    candidate_canonical_id,
    candidate_identity,
    duplicate_rule_registry_version,
    duplicate_rule_id,
    duplicate_rule_version,
    duplicate_score,
    duplicate_confidence,
    decision,
    rationale_category,
    safe_user_note,
    request_hash,
    idempotency_key,
    decided_by
  )
  values (
    target_workspace_id,
    safe_subject,
    coalesce(safe_input -> 'subjectIdentity', '{}'::jsonb),
    safe_candidate_subject,
    candidate_id,
    coalesce(safe_input -> 'candidate' -> 'identity', '{}'::jsonb),
    safe_rule_registry_version,
    safe_rule_id,
    safe_rule_version,
    safe_score,
    safe_confidence,
    safe_decision,
    safe_rationale,
    left(nullif(btrim(safe_input ->> 'userNote'), ''), 500),
    computed_hash,
    cleaned_key,
    current_user_id
  )
  on conflict (workspace_id, idempotency_key) do nothing;

  select * into inserted
  from public.duplicate_decisions
  where workspace_id = target_workspace_id and idempotency_key = cleaned_key;

  if inserted.decided_by <> current_user_id then
    raise exception 'This duplicate decision belongs to another user.' using errcode = '42501';
  end if;

  if inserted.request_hash <> computed_hash then
    raise exception 'This duplicate decision retry key was already used with different data.' using errcode = '23505';
  end if;

  insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values (
    target_workspace_id,
    current_user_id,
    'duplicate.decision_recorded',
    'duplicate_decision',
    inserted.id,
    'record_duplicate_decision',
    cleaned_key || ':duplicate.decision_recorded',
    jsonb_build_object(
      'duplicate_decision_id', inserted.id,
      'subject_type', inserted.subject_type,
      'candidate_subject_type', inserted.candidate_subject_type,
      'decision', inserted.decision,
      'rule_registry_version', inserted.duplicate_rule_registry_version,
      'rule_id', inserted.duplicate_rule_id
    )
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    current_user_id,
    'duplicate.decision_recorded',
    'duplicate_decisions',
    'duplicate_decision',
    inserted.id,
    'record_duplicate_decision',
    cleaned_key || ':audit',
    jsonb_build_object('decision', inserted.decision, 'subject_type', inserted.subject_type, 'candidate_subject_type', inserted.candidate_subject_type),
    array['decision', 'rationale_category'],
    jsonb_build_object('rule_registry_version', inserted.duplicate_rule_registry_version, 'rule_id', inserted.duplicate_rule_id)
  )
  on conflict do nothing;

  duplicate_decision_id := inserted.id;
  decision := inserted.decision;
  subject_type := inserted.subject_type;
  candidate_subject_type := inserted.candidate_subject_type;
  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

revoke all on function public.record_duplicate_decision(uuid, text, jsonb) from public;
grant execute on function public.record_duplicate_decision(uuid, text, jsonb) to authenticated;

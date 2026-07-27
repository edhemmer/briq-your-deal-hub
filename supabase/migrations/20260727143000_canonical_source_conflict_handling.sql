-- Specification 004: Canonical source conflict handling.
-- Records deterministic conflicts and explicit resolutions only. This migration
-- does not accept proposals, mutate canonical Property/Deal facts, merge records,
-- activate providers, or perform underwriting.

create table if not exists public.source_conflicts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conflict_key text not null,
  request_hash text not null,
  subject_type text not null check (subject_type in (
    'property',
    'deal',
    'lifecycle',
    'property_identity',
    'deal_identity',
    'source_identity',
    'manual_value',
    'listing_value',
    'file_value',
    'email_value',
    'batch_row_value',
    'source_classification',
    'evidence_attachment',
    'preliminary_fact',
    'assumption',
    'duplicate_identity'
  )),
  subject_id uuid,
  canonical_target_field text not null,
  conflict_classification text not null check (conflict_classification in (
    'no_conflict',
    'informational_difference',
    'material_conflict',
    'identity_conflict',
    'temporal_change',
    'unit_scope_conflict',
    'unresolved_ambiguity'
  )),
  materiality_tier text not null check (materiality_tier in (
    'informational',
    'review',
    'material',
    'blocking_identity'
  )),
  conflict_rule_registry_version text not null,
  conflict_rule_id text not null,
  conflict_rule_version integer not null,
  involved_proposal_ids uuid[] not null default '{}'::uuid[],
  involved_accepted_value_version integer,
  compared_normalized_values jsonb not null default '[]'::jsonb check (jsonb_typeof(compared_normalized_values) = 'array'),
  conflict_context jsonb not null default '{}'::jsonb check (jsonb_typeof(conflict_context) = 'object'),
  source_summaries jsonb not null default '[]'::jsonb check (jsonb_typeof(source_summaries) = 'array'),
  deterministic_explanation text not null,
  safe_summary text not null,
  downstream_safety jsonb not null default '{}'::jsonb check (jsonb_typeof(downstream_safety) = 'object'),
  lifecycle_state text not null default 'detected' check (lifecycle_state in (
    'detected',
    'awaiting_review',
    'resolved',
    'deferred',
    'superseded',
    'stale',
    'cancelled'
  )),
  stable_ordering_key text not null,
  last_resolution_id uuid,
  idempotency_key text not null,
  detected_by uuid not null references auth.users(id) on delete restrict,
  detected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, conflict_key)
);

create table if not exists public.source_conflict_resolutions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_conflict_id uuid not null references public.source_conflicts(id) on delete cascade,
  conflict_key text not null,
  subject_type text not null,
  subject_id uuid,
  canonical_target_field text not null,
  resolution_action text not null check (resolution_action in (
    'keep_current',
    'accept_proposal',
    'accept_edited_value',
    'preserve_as_temporal_change',
    'preserve_as_different_scope',
    'mark_not_conflict',
    'defer',
    'return_to_identity_review',
    'cancel_intake_action'
  )),
  selected_proposal_id uuid references public.intake_value_proposals(id) on delete restrict,
  edited_value jsonb not null default '{}'::jsonb check (jsonb_typeof(edited_value) = 'object'),
  rationale_category text not null check (rationale_category in (
    'source_preferred',
    'user_verified',
    'professional_review',
    'temporal_history',
    'different_scope',
    'not_same_subject',
    'not_material',
    'needs_more_evidence',
    'cancelled'
  )),
  safe_note text,
  prior_accepted_value_version integer,
  resulting_accepted_value_version integer,
  conflict_rule_registry_version text not null,
  decision_input_hash text not null,
  idempotency_key text not null,
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

alter table public.source_conflicts enable row level security;
alter table public.source_conflict_resolutions enable row level security;

drop policy if exists "source conflicts read workspace managers" on public.source_conflicts;
create policy "source conflicts read workspace managers"
  on public.source_conflicts for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "source conflicts no direct insert" on public.source_conflicts;
create policy "source conflicts no direct insert"
  on public.source_conflicts for insert to authenticated
  with check (false);

drop policy if exists "source conflicts no direct update" on public.source_conflicts;
create policy "source conflicts no direct update"
  on public.source_conflicts for update to authenticated
  using (false)
  with check (false);

drop policy if exists "source conflicts no direct delete" on public.source_conflicts;
create policy "source conflicts no direct delete"
  on public.source_conflicts for delete to authenticated
  using (false);

drop policy if exists "source conflict resolutions read workspace managers" on public.source_conflict_resolutions;
create policy "source conflict resolutions read workspace managers"
  on public.source_conflict_resolutions for select to authenticated
  using (public.has_workspace_permission(workspace_id, 'deals:manage'));

drop policy if exists "source conflict resolutions no direct insert" on public.source_conflict_resolutions;
create policy "source conflict resolutions no direct insert"
  on public.source_conflict_resolutions for insert to authenticated
  with check (false);

drop policy if exists "source conflict resolutions no direct update" on public.source_conflict_resolutions;
create policy "source conflict resolutions no direct update"
  on public.source_conflict_resolutions for update to authenticated
  using (false)
  with check (false);

drop policy if exists "source conflict resolutions no direct delete" on public.source_conflict_resolutions;
create policy "source conflict resolutions no direct delete"
  on public.source_conflict_resolutions for delete to authenticated
  using (false);

drop trigger if exists touch_source_conflicts_updated_at on public.source_conflicts;
create trigger touch_source_conflicts_updated_at
before update on public.source_conflicts
for each row execute function public.touch_updated_at();

create index if not exists idx_source_conflicts_workspace_state
  on public.source_conflicts(workspace_id, lifecycle_state, materiality_tier, updated_at desc);

create index if not exists idx_source_conflicts_workspace_subject_field
  on public.source_conflicts(workspace_id, subject_type, subject_id, canonical_target_field)
  where lifecycle_state in ('detected', 'awaiting_review', 'deferred', 'stale');

create index if not exists idx_source_conflicts_workspace_order
  on public.source_conflicts(workspace_id, stable_ordering_key, updated_at desc);

create index if not exists idx_source_conflict_resolutions_conflict
  on public.source_conflict_resolutions(workspace_id, source_conflict_id, decided_at desc);

create or replace function public.source_conflict_uuid_array(value jsonb)
returns uuid[]
language sql
stable
set search_path = public
as $$
  select coalesce(array_agg(item::uuid order by item), '{}'::uuid[])
  from jsonb_array_elements_text(coalesce(value, '[]'::jsonb)) as proposed(item)
  where item ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

create or replace function public.record_source_conflict(
  target_workspace_id uuid,
  idempotency_key text,
  conflict_input jsonb
)
returns table (
  source_conflict_id uuid,
  conflict_key text,
  lifecycle_state text,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  safe_input jsonb := public.safe_event_jsonb(coalesce(conflict_input, '{}'::jsonb));
  safe_conflict_key text := nullif(btrim(safe_input ->> 'conflictId'), '');
  safe_subject text := nullif(btrim(safe_input ->> 'subjectType'), '');
  safe_subject_id_text text := nullif(btrim(safe_input ->> 'subjectId'), '');
  safe_subject_id uuid := case
    when safe_subject_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then safe_subject_id_text::uuid
    else null
  end;
  safe_field text := nullif(btrim(safe_input ->> 'targetField'), '');
  safe_classification text := nullif(btrim(safe_input ->> 'classification'), '');
  safe_tier text := nullif(btrim(safe_input ->> 'materialityTier'), '');
  safe_lifecycle text := coalesce(nullif(btrim(safe_input ->> 'lifecycleState'), ''), 'detected');
  existing public.source_conflicts%rowtype;
  inserted public.source_conflicts%rowtype;
  proposal_ids uuid[] := public.source_conflict_uuid_array(safe_input -> 'involvedProposalIds');
  computed_hash text;
  event_type text;
begin
  if current_user_id is null then raise exception 'Authentication required to record source conflicts.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to record source conflict.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Source conflict input must be an object.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to record source conflicts in this BRIX workspace.' using errcode = '42501'; end if;
  if safe_conflict_key is null or safe_field is null then raise exception 'Source conflict requires a conflict key and field.' using errcode = '22023'; end if;
  if safe_subject not in ('property', 'deal', 'lifecycle', 'property_identity', 'deal_identity', 'source_identity', 'manual_value', 'listing_value', 'file_value', 'email_value', 'batch_row_value', 'source_classification', 'evidence_attachment', 'preliminary_fact', 'assumption', 'duplicate_identity') then raise exception 'Source conflict subject type is not supported.' using errcode = '22023'; end if;
  if safe_classification not in ('no_conflict', 'informational_difference', 'material_conflict', 'identity_conflict', 'temporal_change', 'unit_scope_conflict', 'unresolved_ambiguity') then raise exception 'Source conflict classification is not supported.' using errcode = '22023'; end if;
  if safe_tier not in ('informational', 'review', 'material', 'blocking_identity') then raise exception 'Source conflict materiality tier is not supported.' using errcode = '22023'; end if;
  if safe_lifecycle not in ('detected', 'awaiting_review', 'resolved', 'deferred', 'superseded', 'stale', 'cancelled') then raise exception 'Source conflict state is not supported.' using errcode = '22023'; end if;

  if array_length(proposal_ids, 1) is not null and exists (
    select 1
    from unnest(proposal_ids) proposal_id
    where not exists (
      select 1 from public.intake_value_proposals proposal
      where proposal.id = proposal_id and proposal.workspace_id = target_workspace_id
    )
  ) then
    raise exception 'Source conflict proposal is not in this workspace.' using errcode = '42501';
  end if;

  computed_hash := md5(jsonb_build_object(
    'conflictKey', safe_conflict_key,
    'requestHash', safe_input ->> 'requestHash',
    'subjectType', safe_subject,
    'subjectId', safe_subject_id,
    'targetField', safe_field,
    'classification', safe_classification,
    'materialityTier', safe_tier,
    'ruleRegistryVersion', safe_input ->> 'ruleRegistryVersion',
    'ruleId', safe_input ->> 'ruleId',
    'ruleVersion', safe_input ->> 'ruleVersion',
    'comparedNormalizedValues', coalesce(safe_input -> 'comparedNormalizedValues', '[]'::jsonb),
    'context', coalesce(safe_input -> 'context', '{}'::jsonb)
  )::text);

  select * into existing
  from public.source_conflicts
  where workspace_id = target_workspace_id and conflict_key = safe_conflict_key
  for update;

  if existing.id is not null and existing.request_hash <> computed_hash and existing.lifecycle_state in ('resolved', 'deferred') then
    update public.source_conflicts
    set lifecycle_state = 'superseded'
    where id = existing.id;
    event_type := 'conflict.superseded';
  else
    event_type := 'conflict.detected';
  end if;

  insert into public.source_conflicts (
    workspace_id,
    conflict_key,
    request_hash,
    subject_type,
    subject_id,
    canonical_target_field,
    conflict_classification,
    materiality_tier,
    conflict_rule_registry_version,
    conflict_rule_id,
    conflict_rule_version,
    involved_proposal_ids,
    involved_accepted_value_version,
    compared_normalized_values,
    conflict_context,
    source_summaries,
    deterministic_explanation,
    safe_summary,
    downstream_safety,
    lifecycle_state,
    stable_ordering_key,
    idempotency_key,
    detected_by
  )
  values (
    target_workspace_id,
    safe_conflict_key,
    computed_hash,
    safe_subject,
    safe_subject_id,
    safe_field,
    safe_classification,
    safe_tier,
    coalesce(nullif(btrim(safe_input ->> 'ruleRegistryVersion'), ''), 'source-conflict-rules-v1'),
    coalesce(nullif(btrim(safe_input ->> 'ruleId'), ''), 'unknown'),
    coalesce(nullif(btrim(safe_input ->> 'ruleVersion'), '')::integer, 1),
    proposal_ids,
    nullif(btrim(safe_input ->> 'involvedAcceptedValueVersion'), '')::integer,
    coalesce(safe_input -> 'comparedNormalizedValues', '[]'::jsonb),
    coalesce(safe_input -> 'context', '{}'::jsonb),
    coalesce(safe_input -> 'sourceSummaries', '[]'::jsonb),
    left(coalesce(nullif(btrim(safe_input ->> 'deterministicExplanation'), ''), 'Source conflict recorded.'), 1200),
    left(coalesce(nullif(btrim(safe_input ->> 'safeSummary'), ''), 'Source conflict needs review.'), 500),
    coalesce(safe_input -> 'downstreamSafety', '{}'::jsonb),
    safe_lifecycle,
    coalesce(nullif(btrim(safe_input ->> 'stableOrderingKey'), ''), safe_field || ':' || safe_conflict_key),
    cleaned_key,
    current_user_id
  )
  on conflict (workspace_id, conflict_key) do update set
    request_hash = excluded.request_hash,
    conflict_classification = excluded.conflict_classification,
    materiality_tier = excluded.materiality_tier,
    conflict_rule_registry_version = excluded.conflict_rule_registry_version,
    conflict_rule_id = excluded.conflict_rule_id,
    conflict_rule_version = excluded.conflict_rule_version,
    involved_proposal_ids = excluded.involved_proposal_ids,
    involved_accepted_value_version = excluded.involved_accepted_value_version,
    compared_normalized_values = excluded.compared_normalized_values,
    conflict_context = excluded.conflict_context,
    source_summaries = excluded.source_summaries,
    deterministic_explanation = excluded.deterministic_explanation,
    safe_summary = excluded.safe_summary,
    downstream_safety = excluded.downstream_safety,
    lifecycle_state = case
      when public.source_conflicts.request_hash <> excluded.request_hash and public.source_conflicts.lifecycle_state in ('resolved', 'deferred') then 'superseded'
      when public.source_conflicts.request_hash <> excluded.request_hash then 'stale'
      else public.source_conflicts.lifecycle_state
    end,
    stable_ordering_key = excluded.stable_ordering_key
  returning * into inserted;

  insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values (
    target_workspace_id,
    current_user_id,
    event_type,
    'source_conflict',
    inserted.id,
    'record_source_conflict',
    cleaned_key || ':' || event_type,
    jsonb_build_object(
      'source_conflict_id', inserted.id,
      'conflict_key', inserted.conflict_key,
      'subject_type', inserted.subject_type,
      'field', inserted.canonical_target_field,
      'classification', inserted.conflict_classification,
      'materiality_tier', inserted.materiality_tier,
      'rule_registry_version', inserted.conflict_rule_registry_version,
      'rule_id', inserted.conflict_rule_id
    )
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    current_user_id,
    event_type,
    'source_conflicts',
    'source_conflict',
    inserted.id,
    'record_source_conflict',
    cleaned_key || ':audit',
    jsonb_build_object('conflict_key', inserted.conflict_key, 'classification', inserted.conflict_classification, 'materiality_tier', inserted.materiality_tier, 'lifecycle_state', inserted.lifecycle_state),
    array['conflict_classification', 'materiality_tier', 'lifecycle_state'],
    jsonb_build_object('rule_registry_version', inserted.conflict_rule_registry_version, 'rule_id', inserted.conflict_rule_id)
  )
  on conflict do nothing;

  source_conflict_id := inserted.id;
  conflict_key := inserted.conflict_key;
  lifecycle_state := inserted.lifecycle_state;
  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

create or replace function public.record_source_conflict_resolution(
  target_workspace_id uuid,
  idempotency_key text,
  target_conflict_key text,
  resolution_input jsonb
)
returns table (
  source_conflict_resolution_id uuid,
  source_conflict_id uuid,
  conflict_key text,
  resolution_action text,
  lifecycle_state text,
  idempotency_key_out text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  safe_input jsonb := public.safe_event_jsonb(coalesce(resolution_input, '{}'::jsonb));
  target_conflict public.source_conflicts%rowtype;
  inserted public.source_conflict_resolutions%rowtype;
  safe_action text := nullif(btrim(safe_input ->> 'action'), '');
  safe_rationale text := nullif(btrim(safe_input ->> 'rationaleCategory'), '');
  selected_id_text text := nullif(btrim(safe_input ->> 'selectedProposalId'), '');
  selected_id uuid := case
    when selected_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then selected_id_text::uuid
    else null
  end;
  resulting_state text;
  computed_hash text;
  expected_version integer := nullif(btrim(safe_input ->> 'acceptedValueVersion'), '')::integer;
begin
  if current_user_id is null then raise exception 'Authentication required to resolve source conflicts.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to resolve source conflict.' using errcode = '22023'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Source conflict resolution input must be an object.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to resolve source conflicts in this BRIX workspace.' using errcode = '42501'; end if;
  if safe_action not in ('keep_current', 'accept_proposal', 'accept_edited_value', 'preserve_as_temporal_change', 'preserve_as_different_scope', 'mark_not_conflict', 'defer', 'return_to_identity_review', 'cancel_intake_action') then raise exception 'Source conflict resolution action is not supported.' using errcode = '22023'; end if;
  if safe_rationale not in ('source_preferred', 'user_verified', 'professional_review', 'temporal_history', 'different_scope', 'not_same_subject', 'not_material', 'needs_more_evidence', 'cancelled') then raise exception 'Source conflict resolution rationale is not supported.' using errcode = '22023'; end if;

  select * into target_conflict
  from public.source_conflicts
  where workspace_id = target_workspace_id and conflict_key = nullif(btrim(target_conflict_key), '')
  for update;
  if target_conflict.id is null then raise exception 'Source conflict is not available.' using errcode = 'P0002'; end if;
  if target_conflict.lifecycle_state in ('superseded', 'stale', 'cancelled') then raise exception 'STALE_CONFLICT_RESOLUTION' using errcode = '40001'; end if;
  if expected_version is not null and target_conflict.involved_accepted_value_version is not null and expected_version <> target_conflict.involved_accepted_value_version then
    raise exception 'STALE_CONFLICT_RESOLUTION' using errcode = '40001';
  end if;
  if selected_id is not null and not (selected_id = any(target_conflict.involved_proposal_ids)) then
    raise exception 'Selected proposal does not belong to this conflict.' using errcode = '42501';
  end if;

  resulting_state := case
    when safe_action = 'defer' then 'deferred'
    when safe_action = 'return_to_identity_review' then 'awaiting_review'
    when safe_action = 'cancel_intake_action' then 'cancelled'
    else 'resolved'
  end;

  computed_hash := md5(jsonb_build_object(
    'conflictKey', target_conflict.conflict_key,
    'action', safe_action,
    'selectedProposalId', selected_id,
    'editedValue', coalesce(safe_input -> 'editedValue', '{}'::jsonb),
    'acceptedValueVersion', expected_version,
    'rationaleCategory', safe_rationale,
    'ruleRegistryVersion', target_conflict.conflict_rule_registry_version
  )::text);

  insert into public.source_conflict_resolutions (
    workspace_id,
    source_conflict_id,
    conflict_key,
    subject_type,
    subject_id,
    canonical_target_field,
    resolution_action,
    selected_proposal_id,
    edited_value,
    rationale_category,
    safe_note,
    prior_accepted_value_version,
    resulting_accepted_value_version,
    conflict_rule_registry_version,
    decision_input_hash,
    idempotency_key,
    decided_by
  )
  values (
    target_workspace_id,
    target_conflict.id,
    target_conflict.conflict_key,
    target_conflict.subject_type,
    target_conflict.subject_id,
    target_conflict.canonical_target_field,
    safe_action,
    selected_id,
    coalesce(safe_input -> 'editedValue', '{}'::jsonb),
    safe_rationale,
    left(nullif(btrim(safe_input ->> 'safeNote'), ''), 500),
    target_conflict.involved_accepted_value_version,
    case when safe_action in ('accept_proposal', 'accept_edited_value', 'keep_current') then coalesce(target_conflict.involved_accepted_value_version, 0) + 1 else null end,
    target_conflict.conflict_rule_registry_version,
    computed_hash,
    cleaned_key,
    current_user_id
  )
  on conflict (workspace_id, idempotency_key) do nothing;

  select * into inserted
  from public.source_conflict_resolutions
  where workspace_id = target_workspace_id and idempotency_key = cleaned_key;

  if inserted.decided_by <> current_user_id then
    raise exception 'This source conflict resolution belongs to another user.' using errcode = '42501';
  end if;
  if inserted.decision_input_hash <> computed_hash then
    raise exception 'This conflict resolution retry key was already used with different data.' using errcode = '23505';
  end if;

  update public.source_conflicts
  set lifecycle_state = resulting_state,
      last_resolution_id = inserted.id
  where id = target_conflict.id;

  insert into public.domain_events (workspace_id, actor_id, event_type, entity_type, entity_id, source_command, idempotency_key, payload)
  values (
    target_workspace_id,
    current_user_id,
    case when resulting_state = 'deferred' then 'conflict.deferred' else 'conflict.resolved' end,
    'source_conflict',
    target_conflict.id,
    'record_source_conflict_resolution',
    cleaned_key || ':' || case when resulting_state = 'deferred' then 'conflict.deferred' else 'conflict.resolved' end,
    jsonb_build_object(
      'source_conflict_id', target_conflict.id,
      'conflict_key', target_conflict.conflict_key,
      'field', target_conflict.canonical_target_field,
      'resolution_action', inserted.resolution_action,
      'lifecycle_state', resulting_state
    )
  )
  on conflict do nothing;

  insert into public.audit_events (workspace_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (
    target_workspace_id,
    current_user_id,
    case when resulting_state = 'deferred' then 'conflict.deferred' else 'conflict.resolved' end,
    'source_conflict_resolutions',
    'source_conflict_resolution',
    inserted.id,
    'record_source_conflict_resolution',
    cleaned_key || ':audit',
    jsonb_build_object('conflict_key', target_conflict.conflict_key, 'resolution_action', inserted.resolution_action, 'lifecycle_state', resulting_state),
    array['resolution_action', 'lifecycle_state'],
    jsonb_build_object('source_conflict_id', target_conflict.id, 'rule_registry_version', target_conflict.conflict_rule_registry_version)
  )
  on conflict do nothing;

  source_conflict_resolution_id := inserted.id;
  source_conflict_id := target_conflict.id;
  conflict_key := target_conflict.conflict_key;
  resolution_action := inserted.resolution_action;
  lifecycle_state := resulting_state;
  idempotency_key_out := cleaned_key;
  return next;
end;
$$;

revoke all on function public.source_conflict_uuid_array(jsonb) from public;
grant execute on function public.source_conflict_uuid_array(jsonb) to authenticated;

revoke all on function public.record_source_conflict(uuid, text, jsonb) from public;
grant execute on function public.record_source_conflict(uuid, text, jsonb) to authenticated;

revoke all on function public.record_source_conflict_resolution(uuid, text, text, jsonb) from public;
grant execute on function public.record_source_conflict_resolution(uuid, text, text, jsonb) to authenticated;

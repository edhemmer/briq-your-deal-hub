create or replace function public.ensure_contract_command(
  target_workspace_id uuid,
  target_deal_id uuid,
  target_property_id uuid,
  target_contract_id uuid,
  command_name text,
  idempotency_key text,
  request_body jsonb
)
returns public.contract_command_requests
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  cleaned_key text := nullif(btrim(idempotency_key), '');
  request_hash text;
  expected_command_name text := command_name;
  existing_request public.contract_command_requests%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if cleaned_key is null then raise exception 'A retry key is required to safely save ContractIQ changes.' using errcode = '22023'; end if;
  request_hash := md5(target_workspace_id::text || coalesce(target_deal_id::text, '') || coalesce(target_property_id::text, '') || coalesce(target_contract_id::text, '') || expected_command_name || coalesce(request_body::text, '{}'));

  insert into public.contract_command_requests (workspace_id, deal_id, property_id, contract_id, command_name, idempotency_key, request_hash, created_by)
  values (target_workspace_id, target_deal_id, target_property_id, target_contract_id, expected_command_name, cleaned_key, request_hash, current_user_id)
  on conflict on constraint contract_command_requests_workspace_id_idempotency_key_key do nothing;

  select * into existing_request
  from public.contract_command_requests
  where contract_command_requests.workspace_id = target_workspace_id
    and contract_command_requests.idempotency_key = cleaned_key
  for update;

  if existing_request.request_hash <> request_hash or existing_request.command_name <> expected_command_name then
    raise exception 'This retry key was already used for a different ContractIQ command.' using errcode = '23505';
  end if;

  return existing_request;
end;
$$;

revoke execute on function public.ensure_contract_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public, anon;
revoke execute on function public.ensure_contract_command(uuid, uuid, uuid, uuid, text, text, jsonb) from authenticated;

create or replace function public.create_contract(target_workspace_id uuid, contract_input jsonb, idempotency_key text)
returns table (contract_id uuid, contract_version integer, workspace_id uuid, deal_id uuid, property_id uuid, status text, analysis_state text, idempotency_key_out text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(contract_input, '{}'::jsonb));
  command public.contract_command_requests%rowtype;
  inserted_contract public.contracts%rowtype;
  requested_deal_id uuid := nullif(safe_input ->> 'dealId', '')::uuid;
  requested_property_id uuid := nullif(safe_input ->> 'propertyId', '')::uuid;
begin
  if current_user_id is null then raise exception 'Authentication required to create ContractIQ records.' using errcode = '42501'; end if;
  if jsonb_typeof(safe_input) <> 'object' then raise exception 'Contract input must be an object.' using errcode = '22023'; end if;
  if not public.has_workspace_permission(target_workspace_id, 'deals:manage') then raise exception 'You do not have permission to manage ContractIQ in this BRIX workspace.' using errcode = '42501'; end if;
  if requested_deal_id is null then raise exception 'ContractIQ foundation requires a canonical Deal.' using errcode = '22023'; end if;

  select coalesce(requested_property_id, primary_property.property_id) into requested_property_id
  from public.brix_deals deal
  left join public.deal_properties primary_property on primary_property.workspace_id = deal.workspace_id and primary_property.deal_id = deal.id and primary_property.role = 'primary' and primary_property.inclusion_status = 'active'
  where deal.id = requested_deal_id and deal.workspace_id = target_workspace_id and deal.deleted_at is null;
  if requested_property_id is null then raise exception 'ContractIQ requires a canonical Property for this Deal.' using errcode = '22023'; end if;

  command := public.ensure_contract_command(target_workspace_id, requested_deal_id, requested_property_id, null, 'create_contract', idempotency_key, safe_input);
  if command.result ? 'contract_id' then
    select id, version, workspace_id, deal_id, property_id, status, analysis_state, command.idempotency_key
    into contract_id, contract_version, workspace_id, deal_id, property_id, status, analysis_state, idempotency_key_out
    from public.contracts where id = (command.result ->> 'contract_id')::uuid;
    return next;
    return;
  end if;

  insert into public.contracts (
    user_id, workspace_id, deal_id, property_id, contract_name, title, contract_type, perspective, status,
    effective_date, execution_date, expiration_date, closing_date, base_contract_id, supersedes_contract_id,
    source_evidence_id, verification_state, analysis_state, confidence, created_by, updated_by
  )
  values (
    current_user_id, target_workspace_id, requested_deal_id, requested_property_id,
    coalesce(nullif(btrim(safe_input ->> 'title'), ''), 'Contract document'),
    coalesce(nullif(btrim(safe_input ->> 'title'), ''), 'Contract document'),
    coalesce(nullif(btrim(safe_input ->> 'contractType'), ''), 'other'),
    coalesce(nullif(btrim(safe_input ->> 'perspective'), ''), 'buyer'),
    coalesce(nullif(btrim(safe_input ->> 'status'), ''), 'draft'),
    nullif(safe_input ->> 'effectiveDate', '')::date,
    nullif(safe_input ->> 'executionDate', '')::date,
    nullif(safe_input ->> 'expirationDate', '')::date,
    nullif(safe_input ->> 'closingDate', '')::date,
    nullif(safe_input ->> 'baseContractId', '')::uuid,
    nullif(safe_input ->> 'supersedesContractId', '')::uuid,
    nullif(safe_input ->> 'sourceEvidenceId', '')::uuid,
    coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'),
    coalesce(nullif(btrim(safe_input ->> 'analysisState'), ''), 'uploaded'),
    greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)),
    current_user_id, current_user_id
  )
  returning * into inserted_contract;

  if inserted_contract.source_evidence_id is not null then
    insert into public.contract_evidence_links (workspace_id, contract_id, evidence_id, link_role, source_anchor, verification_state, created_by, updated_by)
    values (inserted_contract.workspace_id, inserted_contract.id, inserted_contract.source_evidence_id, 'source_document', '{}'::jsonb, inserted_contract.verification_state, current_user_id, current_user_id)
    on conflict on constraint contract_evidence_links_workspace_id_contract_id_evidence_i_key do nothing;
  end if;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (inserted_contract.workspace_id, inserted_contract.deal_id, inserted_contract.property_id, current_user_id, 'contract.document_received', 'contract', inserted_contract.id, inserted_contract.version, 'create_contract', command.idempotency_key || ':contract.document_received', jsonb_build_object('contract_id', inserted_contract.id, 'contract_version', inserted_contract.version, 'status', inserted_contract.status, 'source_evidence_id', inserted_contract.source_evidence_id))
  on conflict do nothing;
  insert into public.audit_events (workspace_id, deal_id, property_id, actor_id, action, target_table, target_type, target_id, source_command, idempotency_key, after_values, changed_fields, metadata)
  values (inserted_contract.workspace_id, inserted_contract.deal_id, inserted_contract.property_id, current_user_id, 'contract.document_received', 'contracts', 'contract', inserted_contract.id, 'create_contract', command.idempotency_key || ':audit', jsonb_build_object('contract_id', inserted_contract.id, 'version', inserted_contract.version), array['contracts'], jsonb_build_object('legal_conclusion_authority', false, 'downstream_mutation', false, 'evidence_storage_reused', inserted_contract.source_evidence_id is not null))
  on conflict do nothing;

  update public.contract_command_requests set result = jsonb_build_object('contract_id', inserted_contract.id, 'contract_version', inserted_contract.version) where id = command.id;
  contract_id := inserted_contract.id;
  contract_version := inserted_contract.version;
  workspace_id := inserted_contract.workspace_id;
  deal_id := inserted_contract.deal_id;
  property_id := inserted_contract.property_id;
  status := inserted_contract.status;
  analysis_state := inserted_contract.analysis_state;
  idempotency_key_out := command.idempotency_key;
  return next;
end;
$$;

create or replace function public.link_contract_evidence(target_contract_id uuid, evidence_input jsonb, idempotency_key text)
returns table (contract_evidence_link_id uuid, contract_id uuid, workspace_id uuid, evidence_id uuid, link_role text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(evidence_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_link public.contract_evidence_links%rowtype;
  requested_evidence_id uuid := nullif(safe_input ->> 'evidenceId', '')::uuid;
  requested_role text := coalesce(nullif(btrim(safe_input ->> 'linkRole'), ''), 'source_document');
begin
  if current_user_id is null then raise exception 'Authentication required to link ContractIQ Evidence.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to link ContractIQ Evidence.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'link_contract_evidence', idempotency_key, safe_input);
  if command.result ? 'contract_evidence_link_id' then
    select id, contract_id, workspace_id, evidence_id, link_role into contract_evidence_link_id, contract_id, workspace_id, evidence_id, link_role from public.contract_evidence_links where id = (command.result ->> 'contract_evidence_link_id')::uuid;
    return next;
    return;
  end if;

  insert into public.contract_evidence_links (workspace_id, contract_id, evidence_id, link_role, source_anchor, verification_state, created_by, updated_by)
  values (target_contract.workspace_id, target_contract.id, requested_evidence_id, requested_role, case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end, coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'source_backed'), current_user_id, current_user_id)
  on conflict on constraint contract_evidence_links_workspace_id_contract_id_evidence_i_key do update set updated_by = excluded.updated_by
  returning * into inserted_link;

  insert into public.domain_events (workspace_id, deal_id, property_id, actor_id, event_type, entity_type, entity_id, entity_version, source_command, idempotency_key, payload)
  values (target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, current_user_id, 'contract.document_received', 'contract_evidence_link', inserted_link.id, inserted_link.version, 'link_contract_evidence', command.idempotency_key || ':contract.document_received', jsonb_build_object('contract_id', target_contract.id, 'evidence_id', inserted_link.evidence_id, 'evidence_storage_reused', true))
  on conflict do nothing;
  update public.contract_command_requests set result = jsonb_build_object('contract_evidence_link_id', inserted_link.id) where id = command.id;
  contract_evidence_link_id := inserted_link.id; contract_id := inserted_link.contract_id; workspace_id := inserted_link.workspace_id; evidence_id := inserted_link.evidence_id; link_role := inserted_link.link_role;
  return next;
end;
$$;

create or replace function public.add_contract_relationship(target_contract_id uuid, relationship_input jsonb, idempotency_key text)
returns table (contract_relationship_id uuid, contract_relationship_version integer, contract_id uuid, workspace_id uuid, relationship_type text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare
  current_user_id uuid := auth.uid();
  safe_input jsonb := public.safe_event_jsonb(coalesce(relationship_input, '{}'::jsonb));
  target_contract public.contracts%rowtype;
  command public.contract_command_requests%rowtype;
  inserted_relationship public.contract_relationships%rowtype;
  related_id uuid := nullif(safe_input ->> 'relatedContractId', '')::uuid;
begin
  if current_user_id is null then raise exception 'Authentication required to save ContractIQ relationships.' using errcode = '42501'; end if;
  target_contract := public.authorized_contract(target_contract_id);
  if not public.has_workspace_permission(target_contract.workspace_id, 'deals:manage') then raise exception 'You do not have permission to save ContractIQ relationships.' using errcode = '42501'; end if;
  command := public.ensure_contract_command(target_contract.workspace_id, target_contract.deal_id, target_contract.property_id, target_contract.id, 'add_contract_relationship', idempotency_key, safe_input);
  if command.result ? 'contract_relationship_id' then
    select id, version, contract_id, workspace_id, relationship_type into contract_relationship_id, contract_relationship_version, contract_id, workspace_id, relationship_type from public.contract_relationships where id = (command.result ->> 'contract_relationship_id')::uuid;
    return next; return;
  end if;
  insert into public.contract_relationships (workspace_id, contract_id, related_contract_id, relationship_type, source_evidence_id, source_anchor, verification_state, confidence, created_by, updated_by)
  values (target_contract.workspace_id, target_contract.id, related_id, coalesce(nullif(btrim(safe_input ->> 'relationshipType'), ''), 'related_to'), nullif(safe_input ->> 'sourceEvidenceId', '')::uuid, case when jsonb_typeof(safe_input -> 'sourceAnchor') = 'object' then safe_input -> 'sourceAnchor' else '{}'::jsonb end, coalesce(nullif(btrim(safe_input ->> 'verificationState'), ''), 'unverified'), greatest(0, least(coalesce(nullif(btrim(safe_input ->> 'confidence'), '')::integer, 50), 100)), current_user_id, current_user_id)
  on conflict on constraint contract_relationships_workspace_id_contract_id_related_con_key do update set updated_by = excluded.updated_by
  returning * into inserted_relationship;
  update public.contract_command_requests set result = jsonb_build_object('contract_relationship_id', inserted_relationship.id, 'contract_relationship_version', inserted_relationship.version) where id = command.id;
  contract_relationship_id := inserted_relationship.id; contract_relationship_version := inserted_relationship.version; contract_id := inserted_relationship.contract_id; workspace_id := inserted_relationship.workspace_id; relationship_type := inserted_relationship.relationship_type;
  return next;
end;
$$;

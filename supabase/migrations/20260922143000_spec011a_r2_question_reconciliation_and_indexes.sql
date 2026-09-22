-- R2 staging hardening: explicit registry reconciliation and complete FK coverage.

create index if not exists idx_contract_questions_category_fk
  on public.contract_questions(category);
create index if not exists idx_contract_question_responses_responder_user_fk
  on public.contract_question_responses(responder_user_id) where responder_user_id is not null;

create or replace function public.reconcile_contractiq_question_registry(target_contract_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare
  actor uuid:=auth.uid(); target_contract public.contracts%rowtype; mismatches jsonb:='[]'::jsonb;
  duplicate_count integer; invalid_resolution_count integer; missing_snapshot_version_count integer; invalid_source_count integer;
begin
  if actor is null then raise exception 'Authentication required to reconcile ContractIQ questions.' using errcode='42501'; end if;
  target_contract:=public.authorized_contract(target_contract_id);

  select count(*) into duplicate_count from (
    select q.deterministic_key from public.contract_questions q
    where q.workspace_id=target_contract.workspace_id and q.contract_id=target_contract.id
      and q.archived_at is null and q.status not in ('superseded','cancelled','dismissed')
    group by q.deterministic_key having count(*)>1
  ) duplicate_questions;

  select count(*) into invalid_resolution_count from public.contract_questions q
  where q.workspace_id=target_contract.workspace_id and q.contract_id=target_contract.id and q.archived_at is null
    and ((q.status='resolved' and q.resolution_state not in ('verified_resolved','resolved'))
      or (q.status='accepted' and q.resolution_state not in ('accepted_risk','accepted'))
      or (q.status='superseded' and q.resolution_state<>'superseded'));

  select count(*) into invalid_source_count from public.contract_questions q
  where q.workspace_id=target_contract.workspace_id and q.contract_id=target_contract.id and q.archived_at is null
    and q.contract_term_id is null and q.contract_finding_id is null and q.contract_conflict_id is null
    and q.contract_deadline_id is null and q.missing_record_key is null and q.amendment_contract_id is null
    and cardinality(q.source_evidence_ids)=0;

  select count(*) into missing_snapshot_version_count
  from public.contractiq_report_snapshots s
  cross join lateral jsonb_array_elements(s.snapshot_payload -> 'questions') frozen
  where s.workspace_id=target_contract.workspace_id and s.contract_id=target_contract.id
    and not exists (
      select 1 from public.contract_questions q where q.workspace_id=s.workspace_id
        and q.id=(frozen ->> 'questionId')::uuid and q.version=(frozen ->> 'version')::integer
    )
    and not exists (
      select 1 from public.contract_record_versions v where v.workspace_id=s.workspace_id
        and v.record_table='contract_questions' and v.record_id=(frozen ->> 'questionId')::uuid
        and v.record_version=(frozen ->> 'version')::integer
    );

  if duplicate_count>0 then mismatches:=mismatches || jsonb_build_array(jsonb_build_object('code','duplicate_active_question','count',duplicate_count)); end if;
  if invalid_resolution_count>0 then mismatches:=mismatches || jsonb_build_array(jsonb_build_object('code','resolution_state_mismatch','count',invalid_resolution_count)); end if;
  if invalid_source_count>0 then mismatches:=mismatches || jsonb_build_array(jsonb_build_object('code','missing_source_issue','count',invalid_source_count)); end if;
  if missing_snapshot_version_count>0 then mismatches:=mismatches || jsonb_build_array(jsonb_build_object('code','snapshot_question_version_missing','count',missing_snapshot_version_count)); end if;

  return jsonb_build_object('contractId',target_contract.id,'workspaceId',target_contract.workspace_id,'reconciled',jsonb_array_length(mismatches)=0,'mismatches',mismatches,'checkedAt',now());
end $$;

revoke execute on function public.reconcile_contractiq_question_registry(uuid) from public,anon;
grant execute on function public.reconcile_contractiq_question_registry(uuid) to authenticated;

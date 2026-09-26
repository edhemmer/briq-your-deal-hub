create or replace function public.stale_contractiq_reports_on_material_source()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare
  current_row jsonb:=to_jsonb(new);
  prior_row jsonb;
  source_id text;
  linked_id text;
  reason text;
  changed_snapshot record;
begin
  if tg_op='UPDATE' then
    prior_row:=to_jsonb(old);
    if (current_row-'version'-'updated_at'-'updated_by'-'last_reconciled_at') is not distinct from
      (prior_row-'version'-'updated_at'-'updated_by'-'last_reconciled_at') then return new; end if;
  end if;
  if tg_table_name='contract_terms' and
    (current_row->>'proposal_state'<>'accepted' or current_row->>'materiality' in ('immaterial','informational')
      or current_row->>'currentness_state'='historical' or current_row->>'superseded_by_term_id' is not null) then
    return new;
  end if;
  if tg_table_name='contract_analysis_runs' and current_row->>'analysis_state' not in ('current','stale') then return new; end if;
  source_id:=current_row->>'id';
  linked_id:=case when tg_table_name='contract_deadline_results' then current_row->>'contract_deadline_id' else source_id end;
  reason:=case tg_table_name
    when 'contract_terms' then 'source_changed'
    when 'contract_deadlines' then 'deadline_changed'
    when 'contract_deadline_results' then 'deadline_changed'
    when 'contract_conflicts' then 'conflict_changed'
    when 'contract_evidence_links' then 'source_changed'
    when 'contract_analysis_runs' then 'recommendation_changed'
    else 'source_changed' end;
  for changed_snapshot in
    update public.contractiq_report_snapshots s set snapshot_state='stale',is_current=false,
      stale_reason=reason,updated_at=now()
    where s.workspace_id=(current_row->>'workspace_id')::uuid and s.contract_id=(current_row->>'contract_id')::uuid
      and s.is_current
    returning s.id,s.workspace_id,s.deal_id,s.property_id,s.snapshot_version,s.correlation_id
  loop
    insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,actor_type,event_type,entity_type,
      entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
    values(changed_snapshot.workspace_id,changed_snapshot.deal_id,changed_snapshot.property_id,null,'system',
      'contractiq.report_snapshot_stale','contractiq_report_snapshot',changed_snapshot.id,changed_snapshot.snapshot_version,
      'material_source_change','material-source:' || changed_snapshot.id || ':' || tg_table_name || ':' || source_id,
      changed_snapshot.correlation_id,jsonb_build_object('snapshotId',changed_snapshot.id,'sourceId',source_id,'reason',reason));
  end loop;
  if tg_table_name in ('contract_terms','contract_deadlines','contract_deadline_results','contract_findings',
    'contract_conflicts','contract_evidence_links') then
    update public.contractiq_questions_report_definitions d set report_state='stale',is_current=false,
      reconciliation_state='stale',stale_reason=reason
    where d.workspace_id=(current_row->>'workspace_id')::uuid and d.contract_id=(current_row->>'contract_id')::uuid
      and d.is_current and exists(
        select 1 from jsonb_array_elements(d.canonical_question_refs) ref
        where (tg_table_name in ('contract_deadlines','contract_deadline_results') and
          coalesce(ref->'relevantDeadlineIds','[]'::jsonb) ? linked_id)
          or exists(select 1 from public.contract_questions q
            where q.workspace_id=d.workspace_id and q.contract_id=d.contract_id and q.id::text=ref->>'questionId'
              and ((tg_table_name='contract_terms' and q.contract_term_id::text=linked_id)
                or (tg_table_name='contract_findings' and q.contract_finding_id::text=linked_id)
                or (tg_table_name='contract_conflicts' and q.contract_conflict_id::text=linked_id)
                or (tg_table_name='contract_evidence_links' and q.source_evidence_id::text=current_row->>'evidence_id')))
      );
  end if;
  return new;
end $$;

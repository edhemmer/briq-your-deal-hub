drop trigger stale_contractiq_definitions_on_snapshot_change on public.contractiq_report_snapshots;
drop function public.stale_contractiq_definitions_on_snapshot_change();

create or replace function public.stale_contractiq_definitions_on_question_change()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare q public.contract_questions%rowtype; reason text; changed record;
begin
  if tg_op='UPDATE' then
    if (to_jsonb(new)-'version'-'updated_at'-'updated_by') is not distinct from
      (to_jsonb(old)-'version'-'updated_at'-'updated_by') then return new; end if;
    q:=new;
    reason:=case when new.status in ('resolved','accepted') and old.status not in ('resolved','accepted')
      then 'question_resolved' else 'question_changed' end;
  else
    q:=new; reason:='question_changed';
  end if;
  for changed in
    update public.contractiq_full_report_definitions d set report_state='stale',is_current=false,
      reconciliation_state='stale',stale_reason=reason
    where d.workspace_id=q.workspace_id and d.contract_id=q.contract_id and d.is_current
      and exists(select 1 from jsonb_array_elements(d.question_references) ref where ref->>'questionId'=q.id::text)
    returning d.id,d.workspace_id,d.deal_id,d.property_id,d.report_definition_version,d.correlation_id
  loop
    insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,
      entity_version,source_command,idempotency_key,correlation_id,payload)
    values(changed.workspace_id,changed.deal_id,changed.property_id,auth.uid(),
      'contractiq.full_report_definition_stale','contractiq_full_report_definition',changed.id,
      changed.report_definition_version,'canonical_question_changed','full-question-stale:' || changed.id,
      changed.correlation_id,jsonb_build_object('definitionId',changed.id,'questionId',q.id,'reason',reason));
  end loop;
  return new;
end $$;

create or replace function public.stale_contractiq_questions_report_definitions()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare changed record; reason text; prior_role text; question_role text; question_id text; snapshot_id uuid;
begin
  if tg_table_name='contract_questions' then
    if tg_op='UPDATE' then
      if (to_jsonb(new)-'version'-'updated_at'-'updated_by') is not distinct from
        (to_jsonb(old)-'version'-'updated_at'-'updated_by') then return new; end if;
      prior_role:=old.recipient_role;
    end if;
    question_id:=new.id::text;
    question_role:=new.recipient_role;
    reason:=case when tg_op='UPDATE' and new.status in ('resolved','accepted')
      and old.status not in ('resolved','accepted') then 'question_resolved' else 'question_changed' end;
  else
    if new.snapshot_state is distinct from 'superseded' and new.reconciliation_status='reconciled' then return new; end if;
    if new.snapshot_state is not distinct from old.snapshot_state and new.reconciliation_status is not distinct from old.reconciliation_status
      and new.is_current is not distinct from old.is_current then return new; end if;
    reason:='snapshot_superseded';
    snapshot_id:=new.id;
  end if;
  for changed in
    update public.contractiq_questions_report_definitions d set report_state='stale',is_current=false,
      reconciliation_state='stale',stale_reason=reason
    where d.workspace_id=new.workspace_id and d.contract_id=new.contract_id and d.is_current
      and ((tg_table_name='contract_questions' and
        (d.report_mode<>'selected_role' or d.selected_role in (question_role,prior_role)
          or exists(select 1 from jsonb_array_elements(d.canonical_question_refs) ref
            where ref->>'questionId'=question_id)))
        or (tg_table_name<>'contract_questions' and d.snapshot_id=snapshot_id))
    returning d.id,d.workspace_id,d.deal_id,d.property_id,d.report_definition_version,d.correlation_id
  loop
    insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,
      entity_version,source_command,idempotency_key,correlation_id,payload)
    values(changed.workspace_id,changed.deal_id,changed.property_id,auth.uid(),
      'contractiq.questions_report_definition_stale','contractiq_questions_report_definition',changed.id,
      changed.report_definition_version,'contractiq_source_changed','questions-report-stale:' || changed.id,
      changed.correlation_id,jsonb_build_object('definitionId',changed.id,'questionId',question_id,'reason',reason));
  end loop;
  return new;
end $$;

create or replace function public.stale_contractiq_definitions_on_question_change()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare q public.contract_questions%rowtype; prior_role text; reason text;
begin
  if tg_op='UPDATE' then
    if (to_jsonb(new)-'version'-'updated_at'-'updated_by') is not distinct from
      (to_jsonb(old)-'version'-'updated_at'-'updated_by') then return new; end if;
    q:=new; prior_role:=old.recipient_role;
    reason:=case when new.status in ('resolved','accepted') and old.status not in ('resolved','accepted')
      then 'question_resolved' else 'question_changed' end;
  else
    q:=new; reason:='question_changed';
  end if;
  update public.contractiq_questions_report_definitions d set report_state='stale',is_current=false,
    reconciliation_state='stale',stale_reason=reason
  where d.workspace_id=q.workspace_id and d.contract_id=q.contract_id and d.is_current
    and (d.report_mode<>'selected_role' or d.selected_role in (q.recipient_role,prior_role)
      or exists(select 1 from jsonb_array_elements(d.canonical_question_refs) ref where ref->>'questionId'=q.id::text));
  update public.contractiq_full_report_definitions d set report_state='stale',is_current=false,
    reconciliation_state='stale',stale_reason=reason
  where d.workspace_id=q.workspace_id and d.contract_id=q.contract_id and d.is_current
    and exists(select 1 from jsonb_array_elements(d.question_references) ref where ref->>'questionId'=q.id::text);
  return new;
end $$;

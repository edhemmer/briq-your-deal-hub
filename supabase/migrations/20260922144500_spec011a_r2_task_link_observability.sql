-- R2 lint repair: task linkage is a material mutation and must use its correlation ID.

create or replace function public.link_contractiq_question_task(target_question_id uuid, target_task_id uuid, expected_question_version integer, idempotency_key text, correlation_id uuid default gen_random_uuid())
returns jsonb language plpgsql security definer set search_path=public
as $$
#variable_conflict use_variable
declare actor uuid:=auth.uid(); question public.contract_questions%rowtype; target_contract public.contracts%rowtype; command public.contract_command_requests%rowtype; task public.tasks%rowtype; next_version integer;
begin
  if actor is null then raise exception 'Authentication required to link ContractIQ questions.' using errcode='42501'; end if;
  select * into question from public.contract_questions q where q.id=target_question_id and q.archived_at is null for update;
  if question.id is null then raise exception 'ContractIQ question is not available.' using errcode='P0002'; end if;
  target_contract:=public.authorized_contract(question.contract_id);
  if not public.has_workspace_permission(question.workspace_id,'deals:manage') then raise exception 'You do not have permission to link this question.' using errcode='42501'; end if;
  if question.version<>expected_question_version then raise exception 'This question changed after you opened it. Reload and try again.' using errcode='40001'; end if;
  select * into task from public.tasks t where t.id=target_task_id and t.workspace_id=question.workspace_id and t.deal_id=target_contract.deal_id and t.archived_at is null;
  if task.id is null then raise exception 'Task is not authorized for this question.' using errcode='42501'; end if;
  command:=public.ensure_contract_command(question.workspace_id,target_contract.deal_id,question.property_id,question.contract_id,'link_contractiq_question_task',idempotency_key,jsonb_build_object('questionId',question.id,'taskId',task.id,'expectedQuestionVersion',expected_question_version));
  if command.result ? 'questionId' then return command.result || jsonb_build_object('reused',true); end if;
  update public.contract_questions set linked_task_id=task.id,updated_by=actor,content_hash=public.contractiq_question_hash(jsonb_build_object('priorHash',question.content_hash,'taskId',task.id)) where id=question.id returning version into next_version;
  update public.contract_command_requests set result=jsonb_build_object('questionId',question.id,'questionVersion',next_version,'taskId',task.id,'reused',false) where id=command.id;
  insert into public.domain_events(workspace_id,deal_id,property_id,actor_id,event_type,entity_type,entity_id,entity_version,source_command,idempotency_key,correlation_id,payload)
  values(question.workspace_id,target_contract.deal_id,question.property_id,actor,'contractiq.question_updated','contract_question',question.id,next_version,'link_contractiq_question_task',idempotency_key,correlation_id,jsonb_build_object('questionId',question.id,'questionVersion',next_version,'taskId',task.id,'change','task_linked'));
  insert into public.audit_events(workspace_id,deal_id,property_id,actor_id,action,target_table,target_type,target_id,source_command,idempotency_key,correlation_id,before_values,after_values,changed_fields,metadata)
  values(question.workspace_id,target_contract.deal_id,question.property_id,actor,'contractiq.question_updated','contract_questions','contract_question',question.id,'link_contractiq_question_task',idempotency_key,correlation_id,jsonb_build_object('version',question.version,'taskId',question.linked_task_id),jsonb_build_object('version',next_version,'taskId',task.id),array['linked_task_id'],jsonb_build_object('taskVersion',task.version));
  return jsonb_build_object('questionId',question.id,'questionVersion',next_version,'taskId',task.id,'reused',false);
end $$;

revoke execute on function public.link_contractiq_question_task(uuid,uuid,integer,text,uuid) from public,anon;
grant execute on function public.link_contractiq_question_task(uuid,uuid,integer,text,uuid) to authenticated;

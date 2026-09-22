-- R2 release-gate closure: cover inherited single-column question foreign keys.

create index if not exists idx_contract_questions_recipient_role_fk on public.contract_questions(recipient_role);
create index if not exists idx_contract_questions_perspective_fk on public.contract_questions(perspective) where perspective is not null;
create index if not exists idx_contract_questions_source_evidence_id_fk on public.contract_questions(source_evidence_id) where source_evidence_id is not null;
create index if not exists idx_contract_questions_response_evidence_id_fk on public.contract_questions(response_source_evidence_id) where response_source_evidence_id is not null;
create index if not exists idx_contract_questions_resolved_by_fk on public.contract_questions(resolved_by) where resolved_by is not null;
create index if not exists idx_contract_questions_created_by_fk on public.contract_questions(created_by) where created_by is not null;
create index if not exists idx_contract_questions_updated_by_fk on public.contract_questions(updated_by) where updated_by is not null;

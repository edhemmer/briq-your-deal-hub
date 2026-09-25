create index questions_report_perspective_fk_idx
  on public.contractiq_questions_report_definitions(perspective);
create index questions_report_selected_role_fk_idx
  on public.contractiq_questions_report_definitions(selected_role)
  where selected_role is not null;

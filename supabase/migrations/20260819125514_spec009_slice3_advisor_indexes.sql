-- Specification 009 Slice 3 advisor repair: cover foreign-key lookups added by
-- lender conditions, covenants, evaluations, and feasibility tables.

create index if not exists idx_financing_conditions_workspace_deal_fk
  on public.financing_conditions (workspace_id, deal_id);

create index if not exists idx_financing_conditions_debt_tranche_fk
  on public.financing_conditions (debt_tranche_id)
  where debt_tranche_id is not null;

create index if not exists idx_financing_conditions_capital_source_fk
  on public.financing_conditions (workspace_id, financing_structure_id, capital_source_id)
  where capital_source_id is not null;

create index if not exists idx_financing_conditions_condition_type_fk
  on public.financing_conditions (condition_type);

create index if not exists idx_financing_conditions_status_fk
  on public.financing_conditions (status);

create index if not exists idx_financing_conditions_verification_state_fk
  on public.financing_conditions (verification_state);

create index if not exists idx_financing_conditions_source_classification_fk
  on public.financing_conditions (source_classification);

create index if not exists idx_financing_conditions_responsible_user_fk
  on public.financing_conditions (responsible_user_id)
  where responsible_user_id is not null;

create index if not exists idx_financing_conditions_responsible_contact_fk
  on public.financing_conditions (responsible_contact_id)
  where responsible_contact_id is not null;

create index if not exists idx_financing_conditions_source_evidence_fk
  on public.financing_conditions (source_evidence_id)
  where source_evidence_id is not null;

create index if not exists idx_financing_conditions_workspace_source_evidence_fk
  on public.financing_conditions (workspace_id, source_evidence_id)
  where source_evidence_id is not null;

create index if not exists idx_financing_conditions_source_record_fk
  on public.financing_conditions (source_record_id)
  where source_record_id is not null;

create index if not exists idx_financing_conditions_waiver_source_evidence_fk
  on public.financing_conditions (waiver_source_evidence_id)
  where waiver_source_evidence_id is not null;

create index if not exists idx_financing_conditions_waiver_source_record_fk
  on public.financing_conditions (waiver_source_record_id)
  where waiver_source_record_id is not null;

create index if not exists idx_financing_conditions_supersedes_fk
  on public.financing_conditions (supersedes_condition_id)
  where supersedes_condition_id is not null;

create index if not exists idx_financing_conditions_superseded_by_fk
  on public.financing_conditions (superseded_by_condition_id)
  where superseded_by_condition_id is not null;

create index if not exists idx_financing_conditions_created_by_fk
  on public.financing_conditions (created_by)
  where created_by is not null;

create index if not exists idx_financing_conditions_updated_by_fk
  on public.financing_conditions (updated_by)
  where updated_by is not null;

create index if not exists idx_financing_condition_versions_workspace_fk
  on public.financing_condition_versions (workspace_id);

create index if not exists idx_financing_condition_versions_changed_by_fk
  on public.financing_condition_versions (changed_by)
  where changed_by is not null;

create index if not exists idx_financing_covenants_workspace_deal_fk
  on public.financing_covenants (workspace_id, deal_id);

create index if not exists idx_financing_covenants_debt_tranche_fk
  on public.financing_covenants (debt_tranche_id)
  where debt_tranche_id is not null;

create index if not exists idx_financing_covenants_covenant_type_fk
  on public.financing_covenants (covenant_type);

create index if not exists idx_financing_covenants_verification_state_fk
  on public.financing_covenants (verification_state);

create index if not exists idx_financing_covenants_source_classification_fk
  on public.financing_covenants (source_classification);

create index if not exists idx_financing_covenants_source_evidence_fk
  on public.financing_covenants (source_evidence_id)
  where source_evidence_id is not null;

create index if not exists idx_financing_covenants_workspace_source_evidence_fk
  on public.financing_covenants (workspace_id, source_evidence_id)
  where source_evidence_id is not null;

create index if not exists idx_financing_covenants_source_record_fk
  on public.financing_covenants (source_record_id)
  where source_record_id is not null;

create index if not exists idx_financing_covenants_supersedes_fk
  on public.financing_covenants (supersedes_covenant_id)
  where supersedes_covenant_id is not null;

create index if not exists idx_financing_covenants_superseded_by_fk
  on public.financing_covenants (superseded_by_covenant_id)
  where superseded_by_covenant_id is not null;

create index if not exists idx_financing_covenants_created_by_fk
  on public.financing_covenants (created_by)
  where created_by is not null;

create index if not exists idx_financing_covenants_updated_by_fk
  on public.financing_covenants (updated_by)
  where updated_by is not null;

create index if not exists idx_financing_covenant_versions_workspace_fk
  on public.financing_covenant_versions (workspace_id);

create index if not exists idx_financing_covenant_versions_changed_by_fk
  on public.financing_covenant_versions (changed_by)
  where changed_by is not null;

create index if not exists idx_financing_covenant_evaluations_workspace_deal_fk
  on public.financing_covenant_evaluation_results (workspace_id, deal_id);

create index if not exists idx_financing_covenant_evaluations_underwriting_snapshot_fk
  on public.financing_covenant_evaluation_results (underwriting_snapshot_id)
  where underwriting_snapshot_id is not null;

create index if not exists idx_financing_covenant_evaluations_underwriting_run_fk
  on public.financing_covenant_evaluation_results (underwriting_run_id)
  where underwriting_run_id is not null;

create index if not exists idx_financing_covenant_evaluations_evaluation_state_fk
  on public.financing_covenant_evaluation_results (evaluation_state);

create index if not exists idx_financing_covenant_evaluations_evaluated_by_fk
  on public.financing_covenant_evaluation_results (evaluated_by)
  where evaluated_by is not null;

create index if not exists idx_financing_feasibility_results_workspace_deal_fk
  on public.financing_feasibility_results (workspace_id, deal_id);

create index if not exists idx_financing_feasibility_results_status_fk
  on public.financing_feasibility_results (status);

create index if not exists idx_financing_feasibility_results_underwriting_snapshot_fk
  on public.financing_feasibility_results (underwriting_snapshot_id)
  where underwriting_snapshot_id is not null;

create index if not exists idx_financing_feasibility_results_evaluated_by_fk
  on public.financing_feasibility_results (evaluated_by)
  where evaluated_by is not null;

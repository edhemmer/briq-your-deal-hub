-- Specification 010 Slice 1 closure: add left-most indexes for GovernanceIQ
-- foreign keys reported by Supabase performance advisors. Existing partial
-- workflow indexes remain in place for read paths, but FK enforcement needs
-- non-partial indexes with the constrained columns as the left-most keys.

create index if not exists idx_governance_record_versions_workspace_fk
  on public.governance_record_versions(workspace_id);
create index if not exists idx_governance_record_versions_changed_by_fk
  on public.governance_record_versions(changed_by);

create index if not exists idx_governance_document_versions_workspace_fk
  on public.governance_document_versions(workspace_id);
create index if not exists idx_governance_document_versions_changed_by_fk
  on public.governance_document_versions(changed_by);

create index if not exists idx_governance_finding_versions_workspace_fk
  on public.governance_finding_versions(workspace_id);
create index if not exists idx_governance_finding_versions_changed_by_fk
  on public.governance_finding_versions(changed_by);

create index if not exists idx_governance_conflict_versions_workspace_fk
  on public.governance_conflict_versions(workspace_id);
create index if not exists idx_governance_conflict_versions_changed_by_fk
  on public.governance_conflict_versions(changed_by);

create index if not exists idx_governance_financial_versions_workspace_fk
  on public.governance_financial_versions(workspace_id);
create index if not exists idx_governance_financial_versions_changed_by_fk
  on public.governance_financial_versions(changed_by);

create index if not exists idx_governance_records_created_by_fk
  on public.governance_records(created_by);
create index if not exists idx_governance_records_updated_by_fk
  on public.governance_records(updated_by);
create index if not exists idx_governance_records_workspace_deal_fk
  on public.governance_records(workspace_id, deal_id);
create index if not exists idx_governance_records_workspace_property_fk
  on public.governance_records(workspace_id, property_id);
create index if not exists idx_governance_records_type_fk
  on public.governance_records(governance_type);
create index if not exists idx_governance_records_status_fk
  on public.governance_records(status);
create index if not exists idx_governance_records_source_classification_fk
  on public.governance_records(source_classification);
create index if not exists idx_governance_records_verification_state_fk
  on public.governance_records(verification_state);
create index if not exists idx_governance_records_management_org_fk
  on public.governance_records(management_organization_id);
create index if not exists idx_governance_records_workspace_management_org_fk
  on public.governance_records(workspace_id, management_organization_id);
create index if not exists idx_governance_records_management_contact_fk
  on public.governance_records(management_contact_id);
create index if not exists idx_governance_records_workspace_management_contact_fk
  on public.governance_records(workspace_id, management_contact_id);
create index if not exists idx_governance_records_workspace_parent_fk
  on public.governance_records(workspace_id, parent_governance_record_id);
create index if not exists idx_governance_records_source_evidence_fk
  on public.governance_records(source_evidence_id);
create index if not exists idx_governance_records_workspace_source_evidence_fk
  on public.governance_records(workspace_id, source_evidence_id);
create index if not exists idx_governance_records_source_record_fk
  on public.governance_records(source_record_id);
create index if not exists idx_governance_records_workspace_source_record_fk
  on public.governance_records(workspace_id, source_record_id);
create index if not exists idx_governance_records_supersedes_fk
  on public.governance_records(supersedes_governance_record_id);
create index if not exists idx_governance_records_superseded_by_fk
  on public.governance_records(superseded_by_governance_record_id);

create index if not exists idx_governance_documents_created_by_fk
  on public.governance_documents(created_by);
create index if not exists idx_governance_documents_updated_by_fk
  on public.governance_documents(updated_by);
create index if not exists idx_governance_documents_record_fk
  on public.governance_documents(workspace_id, governance_record_id);
create index if not exists idx_governance_documents_type_fk
  on public.governance_documents(document_type);
create index if not exists idx_governance_documents_evidence_fk
  on public.governance_documents(evidence_id);
create index if not exists idx_governance_documents_workspace_evidence_fk
  on public.governance_documents(workspace_id, evidence_id);
create index if not exists idx_governance_documents_source_classification_fk
  on public.governance_documents(source_classification);
create index if not exists idx_governance_documents_verification_state_fk
  on public.governance_documents(verification_state);
create index if not exists idx_governance_documents_supersedes_fk
  on public.governance_documents(supersedes_governance_document_id);
create index if not exists idx_governance_documents_superseded_by_fk
  on public.governance_documents(superseded_by_governance_document_id);

create index if not exists idx_governance_findings_created_by_fk
  on public.governance_findings(created_by);
create index if not exists idx_governance_findings_updated_by_fk
  on public.governance_findings(updated_by);
create index if not exists idx_governance_findings_accepted_by_fk
  on public.governance_findings(accepted_by);
create index if not exists idx_governance_findings_rejected_by_fk
  on public.governance_findings(rejected_by);
create index if not exists idx_governance_findings_workspace_record_fk
  on public.governance_findings(workspace_id, governance_record_id);
create index if not exists idx_governance_findings_workspace_document_fk
  on public.governance_findings(workspace_id, governance_document_id);
create index if not exists idx_governance_findings_workspace_deal_fk
  on public.governance_findings(workspace_id, deal_id);
create index if not exists idx_governance_findings_workspace_property_fk
  on public.governance_findings(workspace_id, property_id);
create index if not exists idx_governance_findings_category_fk
  on public.governance_findings(finding_category);
create index if not exists idx_governance_findings_source_classification_fk
  on public.governance_findings(source_classification);
create index if not exists idx_governance_findings_verification_state_fk
  on public.governance_findings(verification_state);
create index if not exists idx_governance_findings_source_evidence_fk
  on public.governance_findings(source_evidence_id);
create index if not exists idx_governance_findings_workspace_source_evidence_fk
  on public.governance_findings(workspace_id, source_evidence_id);
create index if not exists idx_governance_findings_source_record_fk
  on public.governance_findings(source_record_id);
create index if not exists idx_governance_findings_workspace_source_record_fk
  on public.governance_findings(workspace_id, source_record_id);
create index if not exists idx_governance_findings_supersedes_fk
  on public.governance_findings(supersedes_governance_finding_id);
create index if not exists idx_governance_findings_superseded_by_fk
  on public.governance_findings(superseded_by_governance_finding_id);

create index if not exists idx_governance_conflicts_created_by_fk
  on public.governance_conflicts(created_by);
create index if not exists idx_governance_conflicts_updated_by_fk
  on public.governance_conflicts(updated_by);
create index if not exists idx_governance_conflicts_resolved_by_fk
  on public.governance_conflicts(resolved_by);
create index if not exists idx_governance_conflicts_category_fk
  on public.governance_conflicts(category);
create index if not exists idx_governance_conflicts_source_a_document_fk
  on public.governance_conflicts(workspace_id, source_a_document_id);
create index if not exists idx_governance_conflicts_source_a_finding_fk
  on public.governance_conflicts(workspace_id, source_a_finding_id);
create index if not exists idx_governance_conflicts_source_b_document_fk
  on public.governance_conflicts(workspace_id, source_b_document_id);
create index if not exists idx_governance_conflicts_source_b_finding_fk
  on public.governance_conflicts(workspace_id, source_b_finding_id);

create index if not exists idx_governance_financials_created_by_fk
  on public.governance_financials(created_by);
create index if not exists idx_governance_financials_updated_by_fk
  on public.governance_financials(updated_by);
create index if not exists idx_governance_financials_record_fk
  on public.governance_financials(workspace_id, governance_record_id);
create index if not exists idx_governance_financials_document_fk
  on public.governance_financials(workspace_id, governance_document_id);
create index if not exists idx_governance_financials_source_classification_fk
  on public.governance_financials(source_classification);
create index if not exists idx_governance_financials_verification_state_fk
  on public.governance_financials(verification_state);
create index if not exists idx_governance_financials_source_evidence_fk
  on public.governance_financials(source_evidence_id);
create index if not exists idx_governance_financials_workspace_source_evidence_fk
  on public.governance_financials(workspace_id, source_evidence_id);
create index if not exists idx_governance_financials_source_record_fk
  on public.governance_financials(source_record_id);
create index if not exists idx_governance_financials_workspace_source_record_fk
  on public.governance_financials(workspace_id, source_record_id);

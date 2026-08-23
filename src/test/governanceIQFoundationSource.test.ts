import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260823210646_spec010_governanceiq_foundation.sql",
  "utf8",
);
const indexHardeningMigration = readFileSync(
  "supabase/migrations/20260823230026_spec010_governance_fk_index_hardening.sql",
  "utf8",
);

describe("Spec 010 Slice 1 GovernanceIQ migration source", () => {
  it("creates canonical governance records, documents, findings, conflicts, financial inputs, and history", () => {
    for (const table of [
      "governance_records",
      "governance_documents",
      "governance_findings",
      "governance_conflicts",
      "governance_financials",
      "governance_record_versions",
      "governance_document_versions",
      "governance_finding_versions",
      "governance_conflict_versions",
      "governance_financial_versions",
      "governance_command_requests",
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }

    expect(migration).toContain("constraint governance_records_scope_present check (property_id is not null or deal_id is not null)");
    expect(migration).toContain("constraint governance_documents_evidence_workspace_fk foreign key (workspace_id, evidence_id)");
    expect(migration).toContain("constraint governance_findings_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id)");
    expect(migration).toContain("create or replace function public.record_governance_version()");
  });

  it("defines stable private-governance vocabulary and avoids public district ownership", () => {
    for (const value of [
      "homeowners_association",
      "condominium_association",
      "private_road_maintenance",
      "shared_well",
      "mixed_use_association",
      "documents_received",
      "current_with_conflicts",
      "failed_with_prior_analysis",
      "declaration_ccrs",
      "reserve_study",
      "right_of_first_refusal",
      "short_term_rental",
      "pickup_truck",
      "architectural_approval",
      "governance_financing_risk",
    ]) {
      expect(migration).toContain(value);
    }

    expect(migration).not.toContain("public_zoning_district");
    expect(migration).not.toContain("tax_district");
  });

  it("exposes narrow server-owned RPCs with idempotency and audit/events", () => {
    for (const functionName of [
      "create_governance_record",
      "update_governance_record",
      "archive_governance_record",
      "link_governance_document",
      "update_governance_document",
      "upsert_governance_finding",
      "set_governance_finding_acceptance",
      "create_governance_conflict",
      "resolve_governance_conflict",
      "upsert_governance_financial",
      "list_governance_record_projection",
      "load_governance_record_detail",
    ]) {
      expect(migration).toContain(`create or replace function public.${functionName}`);
      expect(migration).toContain(`grant execute on function public.${functionName}`);
      expect(migration).toContain(`revoke execute on function public.${functionName}`);
    }

    expect(migration).toContain("public.ensure_governance_command");
    expect(migration).toContain(
      "revoke execute on function public.ensure_governance_command(uuid, uuid, uuid, uuid, text, text, jsonb) from public, anon, authenticated",
    );
    expect(migration).toContain(
      "revoke execute on function public.authorized_governance_record(uuid) from public, anon, authenticated",
    );
    expect(migration).toContain("revoke execute on function public.validate_governance_scope() from public, anon, authenticated");
    expect(migration).toContain("revoke execute on function public.record_governance_version() from public, anon, authenticated");
    expect(migration).toContain("unique (workspace_id, idempotency_key)");
    expect(migration).toContain("request_hash");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
  });

  it("emits required GovernanceIQ foundation events without analysis-completed success", () => {
    for (const eventName of [
      "governance.record_created",
      "governance.document_received",
      "governance.finding_created",
      "governance.conflict_detected",
      "governance.finding_accepted",
      "governance.finding_rejected",
    ]) {
      expect(migration).toContain(eventName);
    }

    expect(migration).not.toContain("governance.analysis_completed");
  });

  it("denies direct writes and uses workspace-scoped RLS", () => {
    for (const policy of [
      "governance records no direct insert",
      "governance documents no direct update",
      "governance findings no direct delete",
      "governance conflicts no direct insert",
      "governance financials no direct update",
    ]) {
      expect(migration).toContain(policy);
    }

    expect(migration).toContain("revoke insert, update, delete on public.governance_records from authenticated");
    expect(migration).toContain("created_by = (select auth.uid())");
    expect(migration).toContain("(select public.is_workspace_member(workspace_id))");
  });

  it("keeps financials source-backed and does not create downstream calculation authority", () => {
    for (const column of [
      "dues_amount",
      "reserve_balance",
      "delinquency_rate",
      "association_debt_amount",
      "insurance_deductible_amount",
      "planned_project_amount",
    ]) {
      expect(migration).toContain(column);
    }

    expect(migration).toContain("'calculation_authority', 'none_source_backed_input_only'");
    expect(migration).toContain("'downstream_mutation', false");
    expect(migration).toContain("'legal_conclusion_authority', false");
    expect(migration).not.toMatch(/\breserve_adequacy_score\b/i);
    expect(migration).not.toMatch(/\bbudget_health_score\b/i);
    expect(migration).not.toMatch(/\bunderwriting_input_override\b/i);
  });

  it("hardens GovernanceIQ foreign-key indexes without changing Slice 1 behavior", () => {
    for (const indexName of [
      "idx_governance_records_workspace_deal_fk",
      "idx_governance_records_workspace_property_fk",
      "idx_governance_records_source_evidence_fk",
      "idx_governance_documents_workspace_evidence_fk",
      "idx_governance_findings_workspace_record_fk",
      "idx_governance_findings_workspace_source_record_fk",
      "idx_governance_conflicts_source_a_finding_fk",
      "idx_governance_financials_workspace_source_evidence_fk",
      "idx_governance_record_versions_changed_by_fk",
      "idx_governance_financial_versions_workspace_fk",
    ]) {
      expect(indexHardeningMigration).toContain(`create index if not exists ${indexName}`);
    }

    expect(indexHardeningMigration).not.toContain("create table");
    expect(indexHardeningMigration).not.toContain("create or replace function");
    expect(indexHardeningMigration).not.toContain("alter table public.governance_records");
  });
});

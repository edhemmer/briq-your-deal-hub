import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260824103622_spec010_governance_document_analysis.sql",
  "utf8",
);
const conflictAnchorRepairMigration = readFileSync(
  "supabase/migrations/20260824104817_spec010_governance_conflict_anchor_repair.sql",
  "utf8",
);
const analysisRpcAmbiguityRepairMigration = readFileSync(
  "supabase/migrations/20260824105143_spec010_governance_analysis_rpc_ambiguity_repair.sql",
  "utf8",
);
const digestSchemaRepairMigration = readFileSync(
  "supabase/migrations/20260824110200_spec010_governance_digest_schema_repair.sql",
  "utf8",
);
const analysisConflictTargetRepairMigration = readFileSync(
  "supabase/migrations/20260824111200_spec010_governance_analysis_conflict_target_repair.sql",
  "utf8",
);
const remainingRpcAmbiguityRepairMigration = readFileSync(
  "supabase/migrations/20260824111600_spec010_governance_remaining_rpc_ambiguity_repair.sql",
  "utf8",
);
const projectionSecurityInvokerRepairMigration = readFileSync(
  "supabase/migrations/20260824112000_spec010_governance_projection_security_invoker_repair.sql",
  "utf8",
);

describe("Spec 010 Slice 2 GovernanceIQ document analysis migration source", () => {
  it("adds canonical derived-analysis tables with RLS and direct-write denial", () => {
    for (const table of [
      "governance_analysis_runs",
      "governance_document_relationships",
      "governance_hierarchy_candidates",
      "governance_extraction_items",
      "governance_questions",
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
      expect(migration).toContain(`revoke insert, update, delete on public.${table} from authenticated`);
    }
  });

  it("extends Slice 1 documents and conflicts without editing old migrations", () => {
    for (const column of [
      "classification_state",
      "classification_method",
      "classification_evidence",
      "classification_warnings",
      "classification_ambiguity_candidates",
      "prior_valid_classification_run_id",
      "stale_analysis",
      "source_a_anchor",
      "source_b_anchor",
      "normalized_a",
      "normalized_b",
      "conflict_severity",
    ]) {
      expect(migration).toContain(column);
    }

    expect(migration).toContain("classified_proposed");
    expect(migration).toContain("provider_failed");
    expect(migration).toContain("restriction_conflict");
    expect(migration).toContain("financial_conflict");
    expect(conflictAnchorRepairMigration).toContain("sourceAAnchor");
    expect(conflictAnchorRepairMigration).toContain("sourceBAnchor");
    expect(conflictAnchorRepairMigration).toContain("normalizedA");
    expect(conflictAnchorRepairMigration).toContain("normalizedB");
    expect(conflictAnchorRepairMigration).toContain("source_anchors_preserved");
  });

  it("stores relationships, hierarchy candidates, extraction anchors, questions, and prior-valid analysis state", () => {
    for (const value of [
      "unknown_relationship",
      "candidate_current",
      "candidate_superseded",
      "hierarchy_uncertain",
      "governanceiq-extraction-v1",
      "SOURCE_ANCHOR_INCOMPLETE",
      "prior_valid_run_id",
      "professional_review_recommended",
      "target_role",
      "why_it_matters",
      "source_reason",
    ]) {
      expect(migration).toContain(value);
    }
  });

  it("exposes only signed-in server-authoritative RPCs with audit/events and idempotency", () => {
    for (const functionName of [
      "start_governance_analysis_run",
      "complete_governance_analysis_run",
      "record_governance_document_classification",
      "propose_governance_document_relationship",
      "record_governance_hierarchy_candidate",
      "record_governance_extraction_item",
      "create_governance_question",
      "mark_governance_analysis_stale",
    ]) {
      expect(migration).toContain(`create or replace function public.${functionName}`);
      expect(migration).toContain(`revoke execute on function public.${functionName}`);
      expect(migration).toContain(`grant execute on function public.${functionName}`);
    }

    expect(migration).toContain("public.ensure_governance_command");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(analysisRpcAmbiguityRepairMigration).toContain("where doc.id =");
    expect(analysisRpcAmbiguityRepairMigration).toContain("returning public.governance_analysis_runs.id");
    expect(digestSchemaRepairMigration).toContain("extensions.digest");
    expect(analysisConflictTargetRepairMigration).toContain("#variable_conflict use_column");
    expect(remainingRpcAmbiguityRepairMigration).toContain("record_governance_document_classification");
    expect(remainingRpcAmbiguityRepairMigration).toContain("#variable_conflict use_column");
    expect(projectionSecurityInvokerRepairMigration).toContain("security_invoker = true");
  });

  it("prevents raw private document content and downstream authority in Slice 2 persistence", () => {
    expect(migration).toContain("raw_private_content_logged");
    expect(migration).toContain("rawText");
    expect(migration).toContain("rawDocumentText");
    expect(migration).toContain("fullText");
    expect(migration).not.toMatch(/\bunderwriting_input_override\b/i);
    expect(migration).not.toMatch(/\bstrategyCompatibilityOverride\b/);
    expect(migration).not.toMatch(/\breserve_adequacy_score\b/i);
    expect(migration).not.toMatch(/\bbudget_health_score\b/i);
    expect(migration).not.toMatch(/\bis_legally_valid\b/i);
  });

  it("adds FK/index coverage for new GovernanceIQ Slice 2 relations", () => {
    for (const indexName of [
      "idx_governance_analysis_runs_record_fk",
      "idx_governance_analysis_runs_document_fk",
      "idx_governance_document_relationships_source_fk",
      "idx_governance_document_relationships_target_fk",
      "idx_governance_hierarchy_candidates_document_fk",
      "idx_governance_extraction_items_evidence_fk",
      "idx_governance_extraction_items_finding_fk",
      "idx_governance_questions_conflict_fk",
      "idx_governance_questions_finding_fk",
    ]) {
      expect(migration).toContain(`create index if not exists ${indexName}`);
    }
  });

  it("keeps hierarchy candidate logic source-bound and rejects newest-file authority", () => {
    expect(migration).toContain("date_without_explicit_supersession_not_controlling");
    expect(migration).toContain("filename_alone_authoritative");
    expect(migration).not.toMatch(/newest_upload_wins|latest_file_wins|upload.*controlling/i);
  });
});

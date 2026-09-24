import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260922170000_spec011a_r3_full_report_definition.sql"), "utf8");
const client = fs.readFileSync(path.join(root, "src/core/contractIQClient.ts"), "utf8");
const authority = fs.readFileSync(path.join(root, "scripts/production-authority-check.mjs"), "utf8");

describe("ContractIQ Full Report definition source contract", () => {
  it("persists one immutable definition authority linked to R1", () => {
    expect(migration).toContain("create table if not exists public.contractiq_full_report_definitions");
    expect(migration).toContain("contractiq_full_report_definitions_snapshot_fk");
    expect(migration).toContain("Completed Full Report definition content is immutable");
    expect(migration).not.toContain("full_report_findings");
    expect(migration).not.toContain("full_report_questions");
  });

  it("uses deterministic ordered section anchors without pagination", () => {
    expect(migration).toContain("'transaction-identity','Cover / Transaction Identity',10");
    expect(migration).toContain("'source-appendix','Source / Evidence Appendix',270");
    expect(migration).toContain("'rendererPaginationOwnedExternally',true");
    expect(migration).not.toMatch(/page_break|page_number|pdf_renderer|docx_renderer/i);
  });

  it("reconciles exact frozen R2 question IDs and versions", () => {
    expect(migration).toContain("'questionId',question ->> 'questionId'");
    expect(migration).toContain("'questionVersion',(question ->> 'version')::integer");
    expect(migration).toContain("snapshot_question ->> 'version'=frozen ->> 'questionVersion'");
  });

  it("keeps calculations and conclusions in their canonical owners", () => {
    expect(migration).toContain("'noReportOwnedCalculation',true");
    expect(migration).toContain("'independentConclusionGenerated',false");
    expect(migration).not.toMatch(/monthly_payment\s*:=|irr\s*:=|cap_rate\s*:=|due_at\s*:=/i);
  });

  it("validates coverage, sources, recommendations, duplicates, and anchors", () => {
    for (const marker of ["materialSnapshotItemsCovered", "criticalHighQuestionsDisposed", "materialDeadlinesIncluded", "unresolvedConflictsIncluded", "recommendationSupportChecked", "materialSourceLinkageChecked", "duplicatePrimaryPlacementCount", "uniqueAnchors"]) {
      expect(migration).toContain(marker);
    }
    expect(migration).toContain("item_kind = 'conflict'");
    expect(migration).toContain("item -> 'sourceA', item -> 'sourceB'");
    expect(migration).toContain("nullif(source_ref ->> 'evidenceId','') is not null");
    expect(migration).toContain("coalesce(source_ref -> 'sourceAnchor','{}'::jsonb) <> '{}'::jsonb");
  });

  it("preserves prior valid definitions on failure and stales from R1", () => {
    expect(migration).toContain("contractiq.full_report_definition_failed");
    expect(migration).toContain("priorValidPreserved");
    expect(migration).toContain("stale_contractiq_full_report_definitions");
    expect(migration).toContain("contractiq.full_report_definition_stale");
  });

  it("provides authorized RPCs, RLS, and a security-invoker projection", () => {
    expect(migration).toMatch(/contractiq_full_report_definition_projection\s+with \(security_invoker=true\)/);
    expect(migration).toContain("contractiq full report definitions no direct insert");
    expect(migration).toContain("from public,anon");
    expect(client).toContain("createContractIQFullReportDefinition");
    expect(client).toContain("loadContractIQFullReportDefinitions");
  });

  it("is enforced by the production authority guard", () => {
    expect(authority).toContain("ContractIQFullDueDiligenceReportDefinition");
    expect(authority).toContain("create_contractiq_full_report_definition");
    expect(authority).toContain("contractiq_full_report_definition_projection");
  });
});

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/20260921121609_spec011a_r1_contractiq_report_snapshot.sql";
const migration = readFileSync(migrationPath, "utf8");
const supersessionRepair = readFileSync("supabase/migrations/20260921123630_spec011a_r1_snapshot_supersession_order_repair.sql", "utf8");
const supersessionFkRepair = readFileSync("supabase/migrations/20260922114358_spec011a_r1_snapshot_supersession_fk_repair.sql", "utf8");
const perspectiveIndexRepair = readFileSync("supabase/migrations/20260922120556_spec011a_r1_snapshot_perspective_index.sql", "utf8");
const core = readFileSync("src/core/contractIQ.ts", "utf8");
const client = readFileSync("src/core/contractIQClient.ts", "utf8");

describe("ContractIQ 011A R1 snapshot source boundaries", () => {
  it("creates one shared immutable snapshot store and no report-specific truth stores", () => {
    expect(migration).toContain("create table if not exists public.contractiq_report_snapshots");
    expect(migration).toContain("protect_contractiq_report_snapshot_content");
    expect(migration).toContain("ContractIQ report snapshot content is immutable");
    expect(migration).toContain("idx_contractiq_report_snapshots_current");
    expect(perspectiveIndexRepair).toContain("idx_contractiq_report_snapshots_perspective");
    expect(migration).not.toMatch(/create table if not exists public\.(full_report_snapshot|summary_report_snapshot|questions_report_snapshot)/i);
    expect(migration).not.toMatch(/create table if not exists public\.(report_artifacts|report_requests|report_shares)/i);
  });

  it("assembles authoritative content on the server from canonical ContractIQ state", () => {
    for (const source of [
      "public.contracts",
      "public.contract_evidence_links",
      "public.contract_parties",
      "public.contract_terms",
      "public.contract_deadline_results",
      "public.contract_perspective_analysis_items",
      "public.contract_conflicts",
      "public.contract_questions",
      "public.contract_amendment_impact_results",
      "public.contract_downstream_change_proposals",
    ]) expect(migration).toContain(source);
    expect(migration).toContain("create or replace function public.create_contractiq_report_snapshot");
    expect(migration).toContain("public.authorized_contract(target_contract_id)");
    expect(migration).toContain("public.has_workspace_permission");
    expect(migration).toContain("public.ensure_contract_command");
    expect(migration).toContain("extensions.digest");
    expect(migration).not.toMatch(/rawDocumentText|ocrText|fileContents/);
  });

  it("preserves canonical source, question, deadline, conflict, amendment, and cross-module versions", () => {
    for (const field of [
      "source_version_graph_hash",
      "evidence_set_hash",
      "question_registry_version",
      "deadline_set_version",
      "conflict_set_version",
      "source_document_cutoff_at",
      "content_hash",
      "deadlineId",
      "calculationVersion",
      "questionId",
      "resolutionState",
      "sourceA",
      "sourceB",
      "amendmentImpacts",
      "crossModuleContext",
    ]) expect(migration).toContain(field);
  });

  it("supports idempotency, supersession, stale detection, and prior-valid failure recovery", () => {
    expect(migration).toContain("and snapshot.content_hash = content_hash");
    expect(migration).toContain("'reused', true");
    expect(migration).toContain("superseded_by_snapshot_id = inserted_snapshot.id");
    expect(migration).toContain("create or replace function public.reconcile_contractiq_report_snapshot");
    expect(migration).toContain("question_version_mismatch");
    expect(migration).toContain("deadline_version_mismatch");
    expect(migration).toContain("conflict_version_mismatch");
    expect(migration).toContain("priorValidPreserved");
    expect(migration).toContain("contractiq.report_snapshot_failed");
    expect(supersessionRepair).toContain("prepare_contractiq_report_snapshot_successor");
    expect(supersessionFkRepair).toMatch(/set is_current = false[\s\S]*snapshot\.is_current is true/);
    expect(supersessionFkRepair).not.toContain("superseded_by_snapshot_id = new.id");
  });

  it("enforces RLS, denies direct mutation and anon access, and uses safe views and RPC grants", () => {
    expect(migration).toContain("alter table public.contractiq_report_snapshots enable row level security");
    expect(migration).toContain("contractiq report snapshots no direct insert");
    expect(migration).toContain("contractiq report snapshots no direct update");
    expect(migration).toContain("contractiq report snapshots no direct delete");
    expect(migration).toContain("with (security_invoker = true)");
    expect(migration).toContain("set search_path = public, extensions, pg_temp");
    expect(migration).toContain("revoke all on public.contractiq_report_snapshots from anon");
    expect(migration).toContain("revoke execute on function public.create_contractiq_report_snapshot(uuid, text, uuid, text, uuid) from public, anon");
    expect(migration).toContain("grant execute on function public.create_contractiq_report_snapshot(uuid, text, uuid, text, uuid) to authenticated");
  });

  it("emits privacy-safe canonical events and audit records", () => {
    for (const event of [
      "contractiq.report_snapshot_created",
      "contractiq.report_snapshot_stale",
      "contractiq.report_snapshot_superseded",
      "contractiq.report_snapshot_failed",
    ]) expect(migration).toContain(event);
    expect(migration).toContain("'private_content_logged', false");
    expect(migration).not.toMatch(/jsonb_build_object\([^)]*snapshot_payload/i);
  });

  it("publishes strict TypeScript and client contracts without adding report rendering", () => {
    for (const symbol of [
      "ContractIQReportSnapshot",
      "CONTRACTIQ_REPORT_SNAPSHOT_VERSION",
      "contractIQReportSnapshotState",
      "contractIQReportInclusion",
      "reconcileContractIQReportSnapshot",
      "contractIQReportEligibility",
      "assertContractIQReportSnapshot",
    ]) expect(core).toContain(symbol);
    expect(client).toContain("create_contractiq_report_snapshot");
    expect(client).toContain("reconcile_contractiq_report_snapshot");
    expect(client).toContain("contractiq_report_snapshot_projection");
    expect(`${core}\n${client}\n${migration}`).not.toMatch(/pdf renderer|word renderer|buyer due diligence summary definition/i);
  });
});

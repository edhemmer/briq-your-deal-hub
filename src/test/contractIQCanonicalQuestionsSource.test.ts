import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260922133000_spec011a_r2_canonical_contract_questions.sql"), "utf8");
const reconciliationMigration = fs.readFileSync(path.join(root, "supabase/migrations/20260922143000_spec011a_r2_question_reconciliation_and_indexes.sql"), "utf8");
const client = fs.readFileSync(path.join(root, "src/core/contractIQClient.ts"), "utf8");

describe("ContractIQ canonical question source contract", () => {
  it("keeps one canonical registry and immutable response history", () => {
    expect(migration).toContain("alter table public.contract_questions");
    expect(migration).toContain("create table if not exists public.contract_question_responses");
    expect(migration).toContain("ContractIQ question responses are immutable");
    expect(migration).not.toContain("full_report_questions");
    expect(migration).not.toContain("summary_report_questions");
  });

  it("uses source-linked semantic identity and an active uniqueness boundary", () => {
    expect(migration).toContain("semantic_key text");
    expect(migration).toContain("deterministic_key text");
    expect(migration).toContain("idx_contract_questions_active_semantic_identity");
    expect(migration).toContain("concrete source issue or Evidence link");
  });

  it("provides guarded lifecycle commands", () => {
    for (const command of ["create_contractiq_canonical_question", "add_contractiq_question_response", "update_contractiq_canonical_question", "resolve_contractiq_question", "reopen_contractiq_question", "link_contractiq_question_task"]) {
      expect(migration).toContain(`function public.${command}`);
      expect(migration).toContain(`function public.${command}`);
    }
    expect(migration).toContain("question.version <> expected_question_version");
  });

  it("provides security-invoker registry and detail projections", () => {
    expect(migration).toContain("contractiq_question_detail_projection with (security_invoker=true)");
    expect(migration).toContain("contractiq_question_registry_projection with (security_invoker=true)");
    expect(migration).toContain("response_history");
    expect(migration).toContain("version_history");
    expect(client).toContain("loadContractIQCanonicalQuestions");
    expect(client).toContain("loadContractIQQuestionRegistry");
  });

  it("keeps direct writes and anonymous commands denied", () => {
    expect(migration).toContain("contract question responses no direct insert");
    expect(migration).toContain("revoke insert,update,delete on public.contract_questions,public.contract_question_responses from authenticated");
    expect(migration).toContain("from public,anon");
  });

  it("emits lifecycle events without broad response text", () => {
    expect(migration).toContain("contractiq.question_created");
    expect(migration).toContain("contractiq.question_response_added");
    expect(migration).toContain("contractiq.question_resolved");
    expect(migration).toContain("contractiq.question_reopened");
    expect(migration).toContain("contractiq.question_superseded");
    const eventFragments = migration.match(/insert into public\.domain_events[\s\S]*?;\n/g) ?? [];
    expect(eventFragments.every((fragment) => !fragment.includes("response_row.response_text"))).toBe(true);
  });

  it("preserves the R1 frozen question version contract", () => {
    const r1 = fs.readFileSync(path.join(root, "supabase/migrations/20260921121609_spec011a_r1_contractiq_report_snapshot.sql"), "utf8");
    expect(r1).toContain("'questionId', question.id");
    expect(r1).toContain("'version', question.version");
    expect(r1).toContain("'response', question.response");
    expect(r1).toContain("'resolutionState', question.resolution_state");
  });

  it("surfaces deterministic registry reconciliation mismatches", () => {
    expect(reconciliationMigration).toContain("reconcile_contractiq_question_registry");
    expect(reconciliationMigration).toContain("duplicate_active_question");
    expect(reconciliationMigration).toContain("resolution_state_mismatch");
    expect(reconciliationMigration).toContain("snapshot_question_version_missing");
  });

  it("keeps every lifecycle mutation behind an RPC client wrapper", () => {
    expect(client).toContain("createContractIQCanonicalQuestion");
    expect(client).toContain("addContractIQQuestionResponse");
    expect(client).toContain("updateContractIQCanonicalQuestion");
    expect(client).toContain("resolveContractIQQuestion");
    expect(client).toContain("reopenContractIQQuestion");
    expect(client).toContain("linkContractIQQuestionTask");
  });
});

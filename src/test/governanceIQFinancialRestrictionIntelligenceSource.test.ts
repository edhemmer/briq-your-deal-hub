import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const core = readFileSync("src/core/governanceIQ.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260824114452_spec010_governance_financial_restriction_intelligence.sql", "utf8");

describe("GovernanceIQ Slice 3 source guardrails", () => {
  it("does not add underwriting or opaque score authority to GovernanceIQ", () => {
    expect(core).toContain("GOVERNANCEIQ_FINANCIAL_ANALYSIS_CONTRACT_VERSION");
    expect(core).toContain("GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION");
    expect(core).not.toMatch(/\bnoi\b/i);
    expect(core).not.toMatch(/\bcapRate\b/);
    expect(core).not.toMatch(/\bdscr\b/i);
    expect(core).not.toMatch(/\birr\b/i);
    expect(core).not.toMatch(/\bhoaScore\b/i);
    const slice3Surface = core.slice(core.indexOf("export type GovernanceFinancialAnalysisResult"), core.indexOf("const documentClassificationRules"));
    expect(slice3Surface).not.toMatch(/\bbudgetHealthScore\b/);
  });

  it("keeps Slice 3 output persistence server-authored, RLS-protected, and indexed", () => {
    expect(migration).toContain("create table if not exists public.governance_financial_analysis_results");
    expect(migration).toContain("create table if not exists public.governance_restriction_intelligence_results");
    expect(migration).toContain("alter table public.governance_financial_analysis_results enable row level security");
    expect(migration).toContain("alter table public.governance_restriction_intelligence_results enable row level security");
    expect(migration).toContain("for insert to authenticated with check (false)");
    expect(migration).toContain("revoke insert, update, delete on public.governance_financial_analysis_results from authenticated");
    expect(migration).toContain("revoke execute on function public.run_governance_financial_analysis(uuid, jsonb, text) from public, anon");
    expect(migration).toContain("set search_path = public");
    expect(migration).toContain("with (security_invoker = true)");
    expect(migration).toContain("idx_governance_financial_analysis_results_record_fk");
    expect(migration).toContain("idx_governance_restriction_intelligence_results_finding_fk");
  });

  it("records GovernanceIQ events without emitting downstream re-underwriting commands", () => {
    expect(migration).toContain("governance.financial_analysis_completed");
    expect(migration).toContain("governance.restriction_analysis_completed");
    expect(migration).not.toContain("underwriting.requested");
    expect(migration).not.toContain("strategy.ranking_stale");
    expect(migration).not.toContain("financeiq.");
  });
});

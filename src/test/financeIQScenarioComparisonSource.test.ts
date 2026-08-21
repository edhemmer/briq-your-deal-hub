import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260821220041_spec009_financing_scenario_comparison.sql",
  "utf8",
);

describe("Spec 009 Slice 4 migration source", () => {
  it("creates immutable canonical financing comparison persistence", () => {
    for (const table of ["financing_scenario_comparison_results", "financing_scenario_comparison_requests"]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }

    expect(migration).toContain("contract_version text not null default 'financeiq-scenario-comparison-v1'");
    expect(migration).toContain("result_version text not null default 'financeiq-scenario-comparison-result-v1'");
    expect(migration).toContain("source_versions jsonb not null");
    expect(migration).toContain("result_hash text not null");
    expect(migration).toContain("idx_financing_scenario_comparison_results_created_by_fk");
    expect(migration).toContain("idx_financing_scenario_comparison_requests_workspace_deal_fk");
    expect(migration).toContain("create trigger financing_scenario_comparison_results_immutable");
    expect(migration).toContain("for each row execute function public.prevent_underwriting_output_mutation()");
  });

  it("exposes server-owned comparison RPCs with RLS and direct-write denial", () => {
    for (const functionName of ["compare_financing_structures", "load_financing_comparison"]) {
      expect(migration).toContain(`create or replace function public.${functionName}`);
      expect(migration).toContain(`grant execute on function public.${functionName}`);
      expect(migration).toContain(`revoke all on function public.${functionName}`);
    }

    expect(migration).toContain("revoke all on function public.compare_financing_structures(uuid, uuid[], text[], timestamptz, text, text, uuid) from public, anon, authenticated");
    expect(migration).toContain("revoke all on function public.load_financing_comparison(uuid) from public, anon, authenticated");

    expect(migration).toContain("public.authorized_deal_for_read");
    expect(migration).toContain("FinanceIQ comparison cannot cross workspace or Deal boundaries.");
    expect(migration).toContain("Idempotency key was reused for a different financing comparison request.");

    for (const policy of [
      "financing scenario comparison no direct insert",
      "financing scenario comparison no direct update",
      "financing scenario comparison no direct delete",
      "financing scenario comparison requests no direct insert",
      "financing scenario comparison requests no direct update",
      "financing scenario comparison requests no direct delete",
    ]) {
      expect(migration).toContain(policy);
    }

    expect(migration).toContain("revoke insert, update, delete on public.financing_scenario_comparison_results from authenticated");
    expect(migration).toContain("revoke insert, update, delete on public.financing_scenario_comparison_requests from authenticated");
  });

  it("implements conservative Slice 4 ordering and exclusion boundaries", () => {
    expect(migration).toContain("financeiq_comparison_feasibility_rank");
    expect(migration).toContain("excluded_expired_structure");
    expect(migration).toContain("excluded_superseded_structure");
    expect(migration).toContain("excluded_inactive_structure");
    expect(migration).toContain("comparison_requires_at_least_one_current_eligible_structure");
    expect(migration).toContain("if winner_id is not null then");
    expect(migration).toContain("computed_status := 'clear_winner';");
    expect(migration).toContain("'clear_winner'");
    expect(migration).toContain("'no_clear_winner'");
    expect(migration).toContain("'not_comparable'");
    expect(migration).toContain("'insufficient_options'");
  });

  it("tracks source versions and stale comparison state", () => {
    expect(migration).toContain("stale_financing_structure_version");
    expect(migration).toContain("stale_feasibility_result");
    expect(migration).toContain("jsonb_to_recordset(target_result.source_versions -> 'structures')");
    expect(migration).toContain("public.financeiq_latest_feasibility_results");
    expect(migration).toContain("public.underwriting_latest_debt_schedule_results");
  });

  it("keeps Spec 005 as calculation authority and does not add unsupported metrics", () => {
    expect(migration).toContain("'calculationAuthority', 'spec005_underwriting_only'");
    expect(migration).toContain("'calculation_authority', 'spec005_underwriting_only'");
    expect(migration).toContain("unsupportedMetrics");
    expect(migration).toContain("ltc");
    expect(migration).toContain("debt_yield");
    expect(migration).toContain("occupancy");

    for (const forbidden of [
      /\bcalculated_dscr\b/i,
      /\bcalculated_ltv\b/i,
      /\bcalculated_ltc\b/i,
      /\bnet_operating_income\s*\/\s*annual_debt_service/i,
      /\bloan_amount\s*\/\s*total_cost/i,
      /\beffective_apr\b/i,
      /\birr\b/i,
      /\bxirr\b/i,
      /\bwaterfall_distribution\b/i,
      /\bcomparison_score\b/i,
    ]) {
      expect(migration).not.toMatch(forbidden);
    }
  });
});

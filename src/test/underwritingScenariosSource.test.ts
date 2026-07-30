import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = readFileSync(join(process.cwd(), "src/core/underwritingScenarios.ts"), "utf8");
const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260730143000_underwriting_scenarios.sql"), "utf8");

describe("underwriting scenario source boundaries", () => {
  it("reuses snapshots, validation, formula registry, and Core Outputs without adding another formula engine", () => {
    expect(source).toContain("validateAndNormalizeUnderwritingInputs");
    expect(source).toContain("buildUnderwritingSnapshotDraft");
    expect(source).toContain("buildUnderwritingCoreOutputRun");
    expect(source).not.toMatch(/executeFormula\s*\(|fetch\s*\(|openai|anthropic|market[_ -]?data|recommendation|winner|best case|worst case/i);
  });

  it("defines bounded sensitivity limits centrally", () => {
    expect(source).toContain("UNDERWRITING_SENSITIVITY_LIMITS");
    expect(source).toContain("maxSensitivityPoints");
    expect(source).toContain("maxConcurrentPointExecution");
    expect(source).toContain("maxTargetFormulaIds");
  });

  it("adds immutable workspace-scoped persistence and projection contracts", () => {
    expect(migration).toContain("create table if not exists public.underwriting_scenarios");
    expect(migration).toContain("create table if not exists public.underwriting_scenario_overrides");
    expect(migration).toContain("create table if not exists public.underwriting_scenario_snapshots");
    expect(migration).toContain("create table if not exists public.underwriting_scenario_comparisons");
    expect(migration).toContain("create table if not exists public.underwriting_sensitivity_definitions");
    expect(migration).toContain("create table if not exists public.underwriting_sensitivity_points");
    expect(migration).toContain("raise exception 'Underwriting scenarios and sensitivities are immutable.'");
    expect(migration).toContain("create or replace view public.underwriting_scenario_summaries");
    expect(migration).toContain("create or replace view public.underwriting_sensitivity_point_results");
  });

  it("keeps server-owned writes behind RPC authorization and safe events", () => {
    expect(migration).toContain("create_underwriting_scenario_run");
    expect(migration).toContain("create_underwriting_sensitivity_run");
    expect(migration).toContain("has_workspace_permission(target_workspace_id, 'underwriting:run')");
    expect(migration).toContain("underwriting.scenario_completed");
    expect(migration).toContain("underwriting.sensitivity_completed");
    expect(migration).toContain("safe_event_jsonb");
    expect(migration).toContain("with check (false)");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const coreOutputs = readFileSync("src/core/underwritingCoreOutputs.ts", "utf8");
const migration = readFileSync("supabase/migrations/20260730133000_underwriting_core_outputs.sql", "utf8");

describe("underwriting core outputs source boundaries", () => {
  it("keeps core output execution deterministic and local to the formula registry", () => {
    expect(coreOutputs).toContain("executeFormula");
    expect(coreOutputs).toContain("resolveFormulaDefinition");
    expect(coreOutputs).toContain("expectedSnapshotHash");
    expect(coreOutputs).toContain("snapshot.formulaManifest");
    expect(coreOutputs).not.toMatch(/\bfetch\s*\(/);
    expect(coreOutputs).not.toMatch(/\bXMLHttpRequest\b/);
    expect(coreOutputs).not.toMatch(/\bopenai\b/i);
    expect(coreOutputs).not.toMatch(/\bprovider\b/i);
  });

  it("stores core outputs through one server-authorized snapshot-backed run contract", () => {
    expect(migration).toContain("create table if not exists public.underwriting_output_runs");
    expect(migration).toContain("create table if not exists public.underwriting_output_results");
    expect(migration).toContain("create table if not exists public.underwriting_output_result_provenance");
    expect(migration).toContain("create or replace function public.create_underwriting_core_output_run");
    expect(migration).toContain("from public.underwriting_snapshots");
    expect(migration).toContain("Underwriting snapshot hash mismatch");
    expect(migration).toContain("has_workspace_permission(target_workspace_id, 'underwriting:run')");
    expect(migration).toContain("formula_manifest");
    expect(migration).toContain("underwriting.completed_with_warnings");
    expect(migration).toContain("underwriting.core_outputs_created");
    expect(migration).toContain("create trigger underwriting_output_runs_immutable");
    expect(migration).toContain("create or replace view public.underwriting_latest_confirmed_results");
  });

  it("does not introduce provider credentials, browser secrets, alternate deal creation, or AI execution", () => {
    expect(migration).not.toMatch(/\boauth\b/i);
    expect(migration).not.toMatch(/\bapi[_ -]?key\b/i);
    expect(migration).not.toMatch(/\btoken\b/i);
    expect(migration).not.toMatch(/\bcredential\b/i);
    expect(migration).not.toMatch(/\bopenai\b/i);
    expect(migration).not.toMatch(/\bprovider\b/i);
    expect(migration).not.toContain("insert into public.brix_deals");
    expect(migration).not.toContain("insert into public.properties");
  });
});

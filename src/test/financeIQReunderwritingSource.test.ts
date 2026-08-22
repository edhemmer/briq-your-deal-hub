import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260822103000_spec009_reunderwriting_strategy_integration.sql", "utf8");
const domain = readFileSync("src/core/financeIQReunderwriting.ts", "utf8");

describe("Spec 009 Slice 5 re-underwriting migration contract", () => {
  it("creates a durable financing-to-underwriting integration ledger without direct user mutation", () => {
    expect(migration).toContain("create table if not exists public.financeiq_reunderwriting_cycles");
    expect(migration).toContain("create table if not exists public.financeiq_reunderwriting_results");
    expect(migration).toContain("alter table public.financeiq_reunderwriting_cycles enable row level security");
    expect(migration).toContain("alter table public.financeiq_reunderwriting_results enable row level security");
    expect(migration).toContain("financeiq reunderwriting cycles no direct insert");
    expect(migration).toContain("financeiq reunderwriting results no direct update");
    expect(migration).toContain("financeiq_reunderwriting_results_immutable");
    expect(migration).toContain("unique (workspace_id, idempotency_key)");
    expect(migration).toContain("unique (workspace_id, reunderwriting_cycle_id)");
  });

  it("exposes only server-authoritative RPC boundaries with fixed search paths and explicit grants", () => {
    for (const functionName of [
      "request_financing_reunderwriting",
      "complete_financing_reunderwriting",
      "fail_financing_reunderwriting",
      "load_financing_comparison",
    ]) {
      expect(migration).toContain(`create or replace function public.${functionName}`);
    }
    expect(migration.match(/security definer/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migration.match(/set search_path = public/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migration).toContain("revoke all on function public.request_financing_reunderwriting(uuid, integer, text, uuid, text, jsonb, uuid) from public, anon, authenticated");
    expect(migration).toContain("grant execute on function public.complete_financing_reunderwriting(uuid, integer, uuid, integer, uuid, text, text, text, text, uuid[], jsonb) to authenticated");
  });

  it("preserves calculation and strategy ownership while emitting traceable events", () => {
    expect(migration).toContain("'calculation_authority', 'spec005_underwriting_only'");
    expect(migration).toContain("'strategy_authority', 'spec006_strategy_only'");
    expect(migration).toContain("financing.reunderwriting_requested");
    expect(migration).toContain("financing.reunderwriting_completed");
    expect(migration).toContain("financing.reunderwriting_failed");
    expect(migration).toContain("active_underwriting_snapshot_id = target_snapshot.id");
    expect(migration).not.toMatch(/net_operating_income\s*\/\s*annual_debt_service/i);
    expect(migration).not.toMatch(/loan_amount\s*\/\s*(value_basis|purchase_price|appraised_value)/i);
  });

  it("guards stale/out-of-order events and FinanceIQ comparison staleness", () => {
    expect(migration).toContain("target_structure.version <> expected_financing_structure_version");
    expect(migration).toContain("Re-underwriting cycle targets a stale financing version");
    expect(migration).toContain("Only the active financing structure can drive current re-underwriting");
    expect(migration).toContain("stale_active_financing_structure");
    expect(migration).toContain("stale_financing_structure_version");
    expect(migration).toContain("stale_feasibility_result");
  });

  it("keeps FinanceIQ re-underwriting orchestration free of authoritative underwriting math", () => {
    expect(domain).toContain("FINANCEIQ_REUNDERWRITING_CONTRACT_VERSION");
    expect(domain).toContain("detectMaterialFinancingChanges");
    expect(domain).not.toMatch(/net_operating_income\s*\/\s*annual_debt_service/i);
    expect(domain).not.toMatch(/loan_amount\s*\/\s*(value_basis|purchase_price|appraised_value)/i);
    expect(domain).not.toMatch(/Math\.pow\([^)]*annualInterestRate/i);
  });
});

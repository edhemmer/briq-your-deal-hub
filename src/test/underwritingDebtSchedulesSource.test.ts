import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertFinanceIQDoesNotCalculateDebtSchedule } from "../core/underwritingDebtSchedules";

const migration = readFileSync(
  "supabase/migrations/20260818172612_spec009_deterministic_debt_schedules.sql",
  "utf8",
);
const advisorRepairMigration = readFileSync(
  "supabase/migrations/20260818174237_spec009_debt_schedule_advisor_repair.sql",
  "utf8",
);
const idempotencyRepairMigration = readFileSync(
  "supabase/migrations/20260818175648_spec009_debt_schedule_idempotency_scope_repair.sql",
  "utf8",
);
const failedProjectionRepairMigration = readFileSync(
  "supabase/migrations/20260818180312_spec009_debt_schedule_failed_projection_repair.sql",
  "utf8",
);
const directWriteGrantRepairMigration = readFileSync(
  "supabase/migrations/20260818180624_spec009_debt_schedule_direct_write_grant_repair.sql",
  "utf8",
);
const slice2Migrations = `${migration}\n${advisorRepairMigration}\n${idempotencyRepairMigration}\n${failedProjectionRepairMigration}\n${directWriteGrantRepairMigration}`;
const financeIQ = readFileSync("src/core/financeIQ.ts", "utf8");
const engine = readFileSync("src/core/underwritingDebtSchedules.ts", "utf8");

describe("Spec 009 Slice 2 source authority", () => {
  it("stores debt schedule outputs under underwriting-owned immutable persistence", () => {
    expect(migration).toContain("create table if not exists public.underwriting_debt_schedule_results");
    expect(migration).toContain("create table if not exists public.underwriting_debt_schedule_requests");
    expect(migration).toContain("input_payload jsonb not null");
    expect(migration).toContain("result_payload jsonb not null");
    expect(migration).toContain("input_hash text not null");
    expect(migration).toContain("result_hash text not null");
    expect(migration).toContain("create trigger underwriting_debt_schedule_results_immutable");
    expect(migration).toContain("for each row execute function public.prevent_underwriting_output_mutation()");
  });

  it("denies direct writes and exposes only server-owned RPC/projection access", () => {
    for (const table of ["underwriting_debt_schedule_results", "underwriting_debt_schedule_requests"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
      expect(migration).toContain(`${table.replace(/_/g, " ")} no direct insert`);
      expect(migration).toContain(`${table.replace(/_/g, " ")} no direct update`);
      expect(migration).toContain(`${table.replace(/_/g, " ")} no direct delete`);
    }

    expect(migration).toContain("create or replace function public.create_underwriting_debt_schedule_result");
    expect(slice2Migrations).toContain("grant execute on function public.create_underwriting_debt_schedule_result");
    expect(migration).toContain("create or replace function public.list_financeiq_debt_schedule_projection");
    expect(slice2Migrations).toContain("grant execute on function public.list_financeiq_debt_schedule_projection");
    expect(migration).toContain("created_by = (select auth.uid())");
    expect(slice2Migrations).toContain(
      "revoke insert, update, delete on public.underwriting_debt_schedule_results from authenticated",
    );
    expect(slice2Migrations).toContain(
      "revoke insert, update, delete on public.underwriting_debt_schedule_requests from authenticated",
    );
    expect(slice2Migrations).toContain("request.idempotency_key = cleaned_key");
    expect(slice2Migrations).toContain("result.result_hash = requested_result_hash");
  });

  it("covers new debt schedule foreign-key and projection paths with indexes", () => {
    for (const indexName of [
      "idx_underwriting_debt_schedule_results_structure",
      "idx_underwriting_debt_schedule_results_tranche",
      "idx_underwriting_debt_schedule_results_status",
      "idx_underwriting_debt_schedule_results_workspace_deal_fk",
      "idx_underwriting_debt_schedule_results_calculated_by_fk",
      "idx_underwriting_debt_schedule_results_debt_tranche_fk",
      "idx_underwriting_debt_schedule_requests_creator",
      "idx_underwriting_debt_schedule_requests_workspace_deal_fk",
      "idx_underwriting_debt_schedule_requests_result_fk",
    ]) {
      expect(slice2Migrations).toContain(`create index if not exists ${indexName}`);
    }
  });

  it("projects current, stale, failed, and not-calculated schedule state to FinanceIQ", () => {
    expect(migration).toContain("underwriting_latest_debt_schedule_results");
    expect(slice2Migrations).toContain("then 'failed'");
    expect(slice2Migrations).toContain("then 'current'");
    expect(migration).toContain("then 'stale'");
    expect(migration).toContain("else 'not_calculated'");
    expect(migration).toContain("from public.debt_tranches tranche");
    expect(failedProjectionRepairMigration).toContain("status = ''invalid_input''");
  });

  it("records audit and domain events without inventing FinanceIQ calculation ownership", () => {
    expect(migration).toContain("underwriting.debt_schedule_calculated");
    expect(migration).toContain("underwriting.debt_schedule_failed");
    expect(migration).toContain("'underwriting.debt_schedule_result_created'");
    expect(migration).toContain("'financeiq_projection_only', true");
    expect(migration).not.toContain("public.financeiq_debt_schedule_results");
  });

  it("keeps deterministic math out of FinanceIQ", () => {
    expect(financeIQ).toContain("FINANCEIQ_DEBT_SCHEDULE_PROJECTION_VERSION");
    expect(financeIQ).toContain("DebtScheduleProjection");
    expect(() => assertFinanceIQDoesNotCalculateDebtSchedule(financeIQ)).not.toThrow();
    expect(engine).toContain("calculateDebtSchedule");
    expect(engine).toContain("paymentFor");
  });
});

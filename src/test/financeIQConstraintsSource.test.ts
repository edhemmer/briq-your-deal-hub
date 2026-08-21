import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260819113606_spec009_lender_conditions_covenants.sql",
  "utf8",
);

describe("Spec 009 Slice 3 migration source", () => {
  it("creates canonical condition, covenant, evaluation, and feasibility persistence", () => {
    for (const table of [
      "financing_condition_type_definitions",
      "financing_condition_status_definitions",
      "financing_covenant_type_definitions",
      "financing_constraint_evaluation_state_definitions",
      "financing_feasibility_status_definitions",
      "financing_metric_binding_registry",
      "financing_conditions",
      "financing_condition_versions",
      "financing_covenants",
      "financing_covenant_versions",
      "financing_covenant_evaluation_results",
      "financing_feasibility_results",
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }

    expect(migration).toContain("task_id uuid references public.tasks(id) on delete set null");
    expect(migration).toContain("deadline_id uuid references public.deadlines(id) on delete set null");
    expect(migration).toContain("constraint financing_conditions_source_evidence_workspace_fk foreign key (workspace_id, source_evidence_id)");
    expect(migration).toContain("constraint financing_covenants_metric_threshold_shape");
  });

  it("defines required classifications, statuses, and metric bindings", () => {
    for (const value of [
      "guarantor_liquidity",
      "guarantor_net_worth",
      "borrower_experience",
      "reserve_funding",
      "document_delivery",
      "minimum_dscr",
      "maximum_ltv",
      "maximum_ltc",
      "minimum_debt_yield",
      "minimum_occupancy",
      "cash_management_lockbox_trigger",
      "additional_debt_restriction",
      "unsupported_metric",
      "feasible_with_conditions",
      "not_feasible",
    ]) {
      expect(migration).toContain(value);
    }

    expect(migration).toContain("('dscr', 'debt_service_coverage_ratio', true");
    expect(migration).toContain("('ltv', 'loan_to_value_ratio', true");
    expect(migration).toContain("('ltc', 'loan_to_cost_ratio', false");
    expect(migration).toContain("('debt_yield', 'debt_yield', false");
    expect(migration).toContain("('occupancy', 'economic_occupancy', false");
  });

  it("exposes server-owned RPCs with idempotency, version checks, and audit/events", () => {
    for (const functionName of [
      "create_financing_condition",
      "update_financing_condition",
      "archive_financing_condition",
      "create_financing_covenant",
      "update_financing_covenant",
      "archive_financing_covenant",
      "evaluate_financing_covenants",
      "load_financing_conditions",
      "load_financing_covenants",
      "load_financing_feasibility",
      "load_financing_constraint_projection",
    ]) {
      expect(migration).toContain(`create or replace function public.${functionName}`);
      expect(migration).toContain(`grant execute on function public.${functionName}`);
      expect(migration).toContain(`revoke all on function public.${functionName}`);
    }

    expect(migration).toContain("public.ensure_financing_command");
    expect(migration).toContain("expected_version");
    expect(migration).toContain("Financing covenant changed before save. Reload and retry.");
    expect(migration).toContain("insert into public.domain_events");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("financing.condition_changed");
    expect(migration).toContain("financing.covenant_changed");
    expect(migration).toContain("financing.constraint_evaluated");
    expect(migration).toContain("financing.feasibility_changed");
  });

  it("denies direct writes and preserves immutable evaluation truth", () => {
    for (const policy of [
      "financing conditions no direct",
      "financing covenants no direct",
      "financing covenant evaluations no direct",
      "financing feasibility no direct",
    ]) {
      expect(migration).toContain(`${policy} insert`);
      expect(migration).toContain(`${policy} update`);
      expect(migration).toContain(`${policy} delete`);
    }

    for (const table of [
      "financing_conditions",
      "financing_covenants",
      "financing_covenant_evaluation_results",
      "financing_feasibility_results",
    ]) {
      expect(migration).toContain(`revoke insert, update, delete on public.${table} from authenticated`);
    }

    expect(migration).toContain("create trigger financing_covenant_evaluation_results_immutable");
    expect(migration).toContain("create trigger financing_feasibility_results_immutable");
    expect(migration).toContain("for each row execute function public.prevent_underwriting_output_mutation()");
  });

  it("keeps Spec 005 as calculation authority and stores deterministic comparison results only", () => {
    expect(migration).toContain("Specification 005 remains");
    expect(migration).toContain("'calculation_authority', 'spec005_underwriting_only'");
    expect(migration).toContain("public.financeiq_compare_threshold");
    expect(migration).toContain("authoritative_metric_value");
    expect(migration).toContain("underwriting_snapshot_id");
    expect(migration).toContain("underwriting_run_id");
    expect(migration).toContain("prior_evaluations_preserved");
    expect(migration).not.toMatch(/\bmonthly_payment\b/i);
    expect(migration).not.toMatch(/\bamortization_schedule\b/i);
    expect(migration).not.toMatch(/\bcalculated_dscr\b/i);
  });
});

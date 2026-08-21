import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FinancingCovenant } from "../core/financeIQ";
import {
  FINANCEIQ_METRIC_BINDING_REGISTRY,
  assertFinanceIQDoesNotCalculateUnderwritingMetrics,
  evaluateFinancingCovenant,
  summarizeFinancingFeasibility,
} from "../core/financeIQConstraints";

const financeIQConstraints = readFileSync("src/core/financeIQConstraints.ts", "utf8");

function covenant(overrides: Partial<FinancingCovenant> = {}): FinancingCovenant {
  return {
    contractVersion: "financeiq-constraint-foundation-v1",
    covenantId: "covenant-1",
    covenantVersion: 1,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    financingStructureId: "structure-1",
    covenantType: "minimum_dscr",
    metricKey: "dscr",
    comparisonOperator: "gte",
    thresholdValue: 1.25,
    measurementPeriod: "annual",
    testFrequency: "at_underwriting",
    isHardConstraint: true,
    status: "active",
    verificationState: "quoted",
    sourceClassification: "lender_provided",
    confidence: 90,
    conflictState: "none",
    governingSourceStatus: "selected",
    ...overrides,
  };
}

describe("Spec 009 Slice 3 FinanceIQ constraints", () => {
  it("binds only current canonical underwriting metrics and keeps unavailable metrics explicit", () => {
    expect(FINANCEIQ_METRIC_BINDING_REGISTRY).toEqual([
      { metricKey: "dscr", formulaId: "debt_service_coverage_ratio", available: true, source: "spec005_underwriting_output" },
      { metricKey: "ltv", formulaId: "loan_to_value_ratio", available: true, source: "spec005_underwriting_output" },
      { metricKey: "ltc", formulaId: "loan_to_cost_ratio", available: false, source: "spec005_underwriting_output" },
      { metricKey: "debt_yield", formulaId: "debt_yield", available: false, source: "spec005_underwriting_output" },
      { metricKey: "occupancy", formulaId: "economic_occupancy", available: false, source: "spec005_underwriting_output" },
    ]);
  });

  it("evaluates DSCR and LTV thresholds using supplied authoritative values only", () => {
    const passingDscr = evaluateFinancingCovenant({
      covenant: covenant(),
      authoritativeMetric: { metricKey: "dscr", formulaId: "debt_service_coverage_ratio", status: "calculated", value: 1.31 },
      evaluatedAt: "2026-08-19T11:30:00.000Z",
    });
    const failingLtv = evaluateFinancingCovenant({
      covenant: covenant({ covenantId: "covenant-2", covenantType: "maximum_ltv", metricKey: "ltv", comparisonOperator: "lte", thresholdValue: 0.75 }),
      authoritativeMetric: { metricKey: "ltv", formulaId: "loan_to_value_ratio", status: "calculated", value: 0.81 },
      evaluatedAt: "2026-08-19T11:30:00.000Z",
    });

    expect(passingDscr.evaluationState).toBe("passes");
    expect(failingLtv.evaluationState).toBe("fails");
    expect(passingDscr.resultHash).toMatch(/^fnv1a32:/);
    expect(Object.isFrozen(passingDscr)).toBe(true);
  });

  it("returns missing or unsupported states without inventing Spec 005 values", () => {
    expect(evaluateFinancingCovenant({
      covenant: covenant(),
      authoritativeMetric: undefined,
      evaluatedAt: "2026-08-19T11:31:00.000Z",
    }).evaluationState).toBe("missing_input");

    expect(evaluateFinancingCovenant({
      covenant: covenant({ covenantType: "maximum_ltc", metricKey: "ltc", comparisonOperator: "lte", thresholdValue: 0.85 }),
      authoritativeMetric: { metricKey: "ltc", formulaId: "loan_to_cost_ratio", status: "missing" },
      evaluatedAt: "2026-08-19T11:31:00.000Z",
    }).evaluationState).toBe("unsupported_metric");

    for (const metricKey of ["debt_yield", "occupancy"] as const) {
      expect(evaluateFinancingCovenant({
        covenant: covenant({ covenantType: metricKey === "debt_yield" ? "minimum_debt_yield" : "minimum_occupancy", metricKey, thresholdValue: 0.1 }),
        authoritativeMetric: { metricKey, formulaId: metricKey, status: "missing" },
        evaluatedAt: "2026-08-19T11:31:00.000Z",
      }).evaluationState).toBe("unsupported_metric");
    }
  });

  it("treats unresolved source conflict and unverified requirements as uncertain", () => {
    expect(evaluateFinancingCovenant({
      covenant: covenant({ conflictState: "unresolved" }),
      authoritativeMetric: { metricKey: "dscr", formulaId: "debt_service_coverage_ratio", status: "calculated", value: 1.4 },
      evaluatedAt: "2026-08-19T11:32:00.000Z",
    }).reasonCodes).toContain("binding_covenant_conflict");

    expect(evaluateFinancingCovenant({
      covenant: covenant({ verificationState: "document_extracted" }),
      authoritativeMetric: { metricKey: "dscr", formulaId: "debt_service_coverage_ratio", status: "calculated", value: 1.4 },
      evaluatedAt: "2026-08-19T11:32:00.000Z",
    }).evaluationState).toBe("uncertain");
  });

  it("aggregates hard constraints and workflow conditions conservatively", () => {
    const failedHard = summarizeFinancingFeasibility({
      evaluatedAt: "2026-08-19T11:33:00.000Z",
      conditions: [],
      covenantEvaluations: [{ evaluationState: "fails", isHardConstraint: true }],
    });
    const unresolvedCondition = summarizeFinancingFeasibility({
      evaluatedAt: "2026-08-19T11:33:00.000Z",
      conditions: [{ status: "pending", verificationState: "confirmed", waiverState: "none", confidence: 90 }],
      covenantEvaluations: [{ evaluationState: "passes", isHardConstraint: true }],
    });
    const unverified = summarizeFinancingFeasibility({
      evaluatedAt: "2026-08-19T11:33:00.000Z",
      conditions: [{ status: "pending", verificationState: "unverified", waiverState: "none", confidence: 40 }],
      covenantEvaluations: [{ evaluationState: "passes", isHardConstraint: true }],
    });

    expect(failedHard.status).toBe("not_feasible");
    expect(unresolvedCondition.status).toBe("feasible_with_conditions");
    expect(unverified.status).toBe("uncertain");
    expect(summarizeFinancingFeasibility({
      structureStatus: "expired",
      evaluatedAt: "2026-08-19T11:33:00.000Z",
      conditions: [],
      covenantEvaluations: [{ evaluationState: "passes", isHardConstraint: true }],
    }).status).toBe("expired");
  });

  it("keeps FinanceIQ from calculating underwriting metrics", () => {
    expect(() => assertFinanceIQDoesNotCalculateUnderwritingMetrics(financeIQConstraints)).not.toThrow();
    expect(() => assertFinanceIQDoesNotCalculateUnderwritingMetrics("const dscr = net_operating_income / annual_debt_service;")).toThrow(
      "FinanceIQ may compare covenant thresholds but cannot calculate authoritative underwriting metrics.",
    );
  });
});

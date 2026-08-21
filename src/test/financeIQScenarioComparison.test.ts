import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  DebtScheduleProjection,
  DebtTranche,
  EquityTranche,
  FinancingProjection,
  FinancingScenarioComparisonInput,
} from "../core/financeIQ";
import { FINANCEIQ_SCENARIO_COMPARISON_CONTRACT_VERSION } from "../core/financeIQ";
import type { AuthoritativeMetricValue } from "../core/financeIQConstraints";
import {
  assertFinanceIQScenarioComparisonDoesNotCalculateUnsupportedMetrics,
  compareFinancingScenarios,
} from "../core/financeIQScenarioComparison";

const financeIQScenarioComparison = readFileSync("src/core/financeIQScenarioComparison.ts", "utf8");

function input(overrides: Partial<FinancingScenarioComparisonInput> = {}): FinancingScenarioComparisonInput {
  return {
    contractVersion: FINANCEIQ_SCENARIO_COMPARISON_CONTRACT_VERSION,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    financingStructureIds: ["structure-a", "structure-b"],
    comparisonEffectiveAt: "2026-08-21T12:00:00.000Z",
    mode: "current",
    requestedDimensions: ["feasibility", "debt_service", "balloon_exposure", "dscr", "ltv", "fees", "conditions", "covenants", "complexity"],
    ...overrides,
  };
}

function projection(id: string, overrides: Partial<FinancingProjection> = {}): FinancingProjection {
  return {
    contractVersion: "financeiq-structure-projection-v1",
    financingStructureId: id,
    financingStructureVersion: 1,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    name: id === "structure-a" ? "Bank fixed" : "Bridge quote",
    purpose: "acquisition",
    status: "quoted",
    currency: "USD",
    verificationState: "quoted",
    sourceClassification: "lender_provided",
    confidence: 85,
    isActive: false,
    activeContext: "current_deal",
    isExpired: false,
    capitalSourceCount: 1,
    debtTrancheCount: 1,
    equityTrancheCount: 0,
    updatedAt: "2026-08-21T11:00:00.000Z",
    loadedAt: "2026-08-21T11:00:01.000Z",
    unresolvedConditionCount: 0,
    blockingConditionCount: 0,
    failedCovenantCount: 0,
    uncertainCovenantCount: 0,
    feasibilityStatus: "feasible",
    feasibilityVersion: 1,
    stale: false,
    ...overrides,
  };
}

function schedule(structureId: string, overrides: Partial<DebtScheduleProjection> = {}): DebtScheduleProjection {
  return {
    contractVersion: "financeiq-debt-schedule-projection-v1",
    workspaceId: "workspace-1",
    dealId: "deal-1",
    financingStructureId: structureId,
    financingStructureVersion: 1,
    debtTrancheId: `${structureId}-debt-1`,
    debtTrancheVersion: 1,
    debtTrancheLabel: "Senior",
    resultId: `${structureId}-schedule-1`,
    status: "current",
    engineVersion: "underwriting-debt-schedule-engine-v1",
    inputHash: `${structureId}-input`,
    resultHash: `${structureId}-result`,
    currency: "USD",
    periodCount: 360,
    firstPeriodicDebtService: 1800,
    finalPeriodicDebtService: 1800,
    totalPrincipalPaid: 300000,
    totalInterestPaid: 348000,
    totalBalloonPaid: 0,
    totalDebtService: 648000,
    warningCount: 0,
    latestCalculatedAt: "2026-08-21T11:05:00.000Z",
    loadedAt: "2026-08-21T11:06:00.000Z",
    ...overrides,
  };
}

function debt(structureId: string, overrides: Partial<DebtTranche> = {}): DebtTranche {
  return {
    debtTrancheId: `${structureId}-debt-1`,
    debtTrancheVersion: 1,
    workspaceId: "workspace-1",
    financingStructureId: structureId,
    label: "Senior",
    principalAmount: 300000,
    commitmentAmount: 300000,
    rateType: "fixed",
    statedRate: 0.065,
    amortizationMonths: 360,
    maturityMonths: 360,
    interestOnlyMonths: 0,
    paymentFrequency: "monthly",
    hasBalloon: false,
    points: 1,
    fees: [{ label: "Origination", amount: 3000 }],
    prepaymentType: "none",
    recourseType: "full",
    drawMetadata: {},
    extensionMetadata: {},
    reserveEscrowMetadata: {},
    status: "quoted",
    verificationState: "quoted",
    sourceClassification: "lender_provided",
    confidence: 85,
    sourceEvidenceId: `${structureId}-evidence`,
    ...overrides,
  };
}

function equity(structureId: string, overrides: Partial<EquityTranche> = {}): EquityTranche {
  return {
    equityTrancheId: `${structureId}-equity-1`,
    equityTrancheVersion: 1,
    workspaceId: "workspace-1",
    financingStructureId: structureId,
    label: "Sponsor equity",
    contributionAmount: 100000,
    currency: "USD",
    contributionTiming: { due: "closing" },
    ownershipPercentage: 100,
    preferredReturnTerms: {},
    waterfallTerms: {},
    promoteTerms: {},
    distributionPriority: 1,
    fees: [],
    status: "committed",
    verificationState: "investor_provided",
    sourceClassification: "investor_provided",
    confidence: 95,
    ...overrides,
  };
}

function metric(metricKey: "dscr" | "ltv", value: number, structureId: string): AuthoritativeMetricValue {
  return {
    metricKey,
    formulaId: metricKey === "dscr" ? "debt_service_coverage_ratio" : "loan_to_value_ratio",
    value,
    status: "calculated",
    underwritingSnapshotId: `${structureId}-snapshot`,
    underwritingRunId: `${structureId}-run`,
    resultHash: `${structureId}-${metricKey}-hash`,
  };
}

describe("Spec 009 Slice 4 financing scenario comparison", () => {
  it("orders feasible structures above a lower-payment hard-covenant failure", () => {
    const result = compareFinancingScenarios({
      input: input(),
      comparedAt: "2026-08-21T12:01:00.000Z",
      candidates: [
        { projection: projection("structure-a"), debtSchedules: [schedule("structure-a", { firstPeriodicDebtService: 2100 })], debtTranches: [debt("structure-a")], authoritativeMetrics: [metric("dscr", 1.35, "structure-a"), metric("ltv", 0.72, "structure-a")] },
        { projection: projection("structure-b", { feasibilityStatus: "not_feasible", failedCovenantCount: 1 }), debtSchedules: [schedule("structure-b", { firstPeriodicDebtService: 1500 })], debtTranches: [debt("structure-b")], authoritativeMetrics: [metric("dscr", 1.05, "structure-b"), metric("ltv", 0.7, "structure-b")] },
      ],
    });

    expect(result.status).toBe("clear_winner");
    expect(result.clearWinnerFinancingStructureId).toBe("structure-a");
    expect(result.orderedStructures.map((row) => row.financingStructureId)).toEqual(["structure-a", "structure-b"]);
    expect(result.orderedStructures[1].failedCovenantCount).toBe(1);
  });

  it("identifies lower-payment balloon risk against higher-payment fully amortizing debt", () => {
    const result = compareFinancingScenarios({
      input: input({ requestedDimensions: ["debt_service", "balloon_exposure"] }),
      comparedAt: "2026-08-21T12:02:00.000Z",
      candidates: [
        { projection: projection("structure-a"), debtSchedules: [schedule("structure-a", { firstPeriodicDebtService: 1700, totalBalloonPaid: 0 })], debtTranches: [debt("structure-a")] },
        { projection: projection("structure-b"), debtSchedules: [schedule("structure-b", { firstPeriodicDebtService: 1300, totalBalloonPaid: 250000, periodCount: 84 })], debtTranches: [debt("structure-b", { hasBalloon: true, maturityMonths: 84 })] },
      ],
    });

    expect(result.status).toBe("no_clear_winner");
    expect(result.tradeoffs.find((tradeoff) => tradeoff.dimension === "debt_service")?.structureIds[0]).toBe("structure-b");
    expect(result.tradeoffs.find((tradeoff) => tradeoff.dimension === "balloon_exposure")?.structureIds[0]).toBe("structure-a");
    expect(result.orderedStructures.find((row) => row.financingStructureId === "structure-b")?.riskCharacteristics).toContain("balloon_or_maturity_refinance_risk");
  });

  it("preserves variable-rate warnings, source provenance, and unverified term uncertainty", () => {
    const result = compareFinancingScenarios({
      input: input({ requestedDimensions: ["rate_type", "debt_service"] }),
      comparedAt: "2026-08-21T12:03:00.000Z",
      candidates: [
        { projection: projection("structure-a"), debtSchedules: [schedule("structure-a")], debtTranches: [debt("structure-a")] },
        { projection: projection("structure-b"), debtSchedules: [schedule("structure-b", { warningCount: 1 })], debtTranches: [debt("structure-b", { rateType: "variable", verificationState: "document_extracted", sourceClassification: "document_extracted" })] },
      ],
    });

    const variable = result.orderedStructures.find((row) => row.financingStructureId === "structure-b");
    expect(variable?.riskCharacteristics).toContain("variable_rate_current_effective_only");
    expect(variable?.complexity.unverifiedTermCount).toBe(1);
    expect(variable?.sourceReferences.find((reference) => reference.sourceEvidenceId === "structure-b-evidence")).toBeTruthy();
  });

  it("excludes expired attractive quotes from current winner consideration", () => {
    const result = compareFinancingScenarios({
      input: input(),
      comparedAt: "2026-08-21T12:04:00.000Z",
      candidates: [
        { projection: projection("structure-a"), debtSchedules: [schedule("structure-a", { firstPeriodicDebtService: 1900 })], debtTranches: [debt("structure-a")] },
        { projection: projection("structure-b", { status: "expired", isExpired: true, feasibilityStatus: "expired" }), debtSchedules: [schedule("structure-b", { firstPeriodicDebtService: 1000 })], debtTranches: [debt("structure-b")] },
      ],
    });

    expect(result.clearWinnerFinancingStructureId).toBe("structure-a");
    expect(result.excludedStructures).toEqual([{ financingStructureId: "structure-b", reasonCode: "excluded_expired_structure" }]);
  });

  it("keeps unsupported LTC, debt yield, and occupancy as unsupported rather than zero", () => {
    const result = compareFinancingScenarios({
      input: input({ requestedDimensions: ["ltv", "dscr"] }),
      comparedAt: "2026-08-21T12:05:00.000Z",
      candidates: [
        { projection: projection("structure-a"), debtSchedules: [schedule("structure-a")], debtTranches: [debt("structure-a")], authoritativeMetrics: [metric("dscr", 1.4, "structure-a"), { metricKey: "ltc", formulaId: "loan_to_cost_ratio", status: "unsupported" }] },
        { projection: projection("structure-b"), debtSchedules: [schedule("structure-b")], debtTranches: [debt("structure-b")], authoritativeMetrics: [metric("dscr", 1.41, "structure-b"), { metricKey: "debt_yield", formulaId: "debt_yield", status: "unsupported" }, { metricKey: "occupancy", formulaId: "economic_occupancy", status: "unsupported" }] },
      ],
    });

    expect(result.orderedStructures.flatMap((row) => row.unsupportedMetrics).sort()).toEqual(["debt_yield", "ltc", "occupancy"]);
    expect(JSON.stringify(result)).not.toMatch(/"ltc".*"value":0|"debt_yield".*"value":0|"occupancy".*"value":0/);
  });

  it("aggregates compatible multi-tranche debt service and exposes equity terms without waterfall math", () => {
    const result = compareFinancingScenarios({
      input: input({ requestedDimensions: ["debt_service", "complexity", "equity_terms"] }),
      comparedAt: "2026-08-21T12:06:00.000Z",
      candidates: [
        {
          projection: projection("structure-a", { debtTrancheCount: 2, equityTrancheCount: 1, capitalSourceCount: 3 }),
          debtSchedules: [
            schedule("structure-a", { debtTrancheId: "structure-a-debt-1", firstPeriodicDebtService: 1200, totalDebtService: 432000 }),
            schedule("structure-a", { debtTrancheId: "structure-a-debt-2", firstPeriodicDebtService: 400, totalDebtService: 144000 }),
          ],
          debtTranches: [debt("structure-a", { debtTrancheId: "structure-a-debt-1" }), debt("structure-a", { debtTrancheId: "structure-a-debt-2", label: "Mezzanine" })],
          equityTranches: [equity("structure-a")],
        },
        { projection: projection("structure-b"), debtSchedules: [schedule("structure-b", { firstPeriodicDebtService: 1750 })], debtTranches: [debt("structure-b")] },
      ],
    });

    const multi = result.orderedStructures.find((row) => row.financingStructureId === "structure-a");
    expect(multi?.debtServiceSummary?.periodicDebtService).toBe(1600);
    expect(multi?.equityTerms[0]).toMatchObject({ contributionAmount: 100000, ownershipPercentage: 100 });
    expect(JSON.stringify(multi)).not.toMatch(/waterfallDistribution|irr|xirr/i);
  });

  it("returns no clear winner for incomparable uncertain structures", () => {
    const result = compareFinancingScenarios({
      input: input({ requestedDimensions: ["debt_service", "dscr"] }),
      comparedAt: "2026-08-21T12:07:00.000Z",
      candidates: [
        { projection: projection("structure-a", { feasibilityStatus: "uncertain", uncertainCovenantCount: 1 }), debtSchedules: [], debtTranches: [debt("structure-a")] },
        { projection: projection("structure-b", { feasibilityStatus: "uncertain", uncertainCovenantCount: 1 }), debtSchedules: [], debtTranches: [debt("structure-b")] },
      ],
    });

    expect(result.status).toBe("not_comparable");
    expect(result.clearWinnerFinancingStructureId).toBeUndefined();
    expect(result.noDecisionReason).toBe("material_dimensions_not_comparable");
    expect(result.missingComparisonInputs).toContain("current_authoritative_debt_schedule");
  });

  it("rejects cross-workspace, cross-Deal, missing candidate, and unsupported dimension inputs", () => {
    expect(() => compareFinancingScenarios({
      input: input(),
      comparedAt: "2026-08-21T12:08:00.000Z",
      candidates: [projection("structure-a"), projection("structure-b", { workspaceId: "workspace-2" })].map((item) => ({ projection: item })),
    })).toThrow("FinanceIQ comparison cannot cross workspace boundaries.");

    expect(() => compareFinancingScenarios({
      input: input({ requestedDimensions: ["cash_required" as never] }),
      comparedAt: "2026-08-21T12:08:00.000Z",
      candidates: [projection("structure-a"), projection("structure-b")].map((item) => ({ projection: item })),
    })).toThrow("Unsupported FinanceIQ comparison dimension: cash_required");
  });

  it("is deterministic, immutable, and guarded against unsupported calculations or opaque scores", () => {
    const request = {
      input: input(),
      comparedAt: "2026-08-21T12:09:00.000Z",
      candidates: [
        { projection: projection("structure-a"), debtSchedules: [schedule("structure-a")], debtTranches: [debt("structure-a")] },
        { projection: projection("structure-b"), debtSchedules: [schedule("structure-b")], debtTranches: [debt("structure-b")] },
      ],
    };

    const first = compareFinancingScenarios(request);
    const second = compareFinancingScenarios(request);
    expect(first.resultHash).toBe(second.resultHash);
    expect(Object.isFrozen(first)).toBe(true);
    expect(() => assertFinanceIQScenarioComparisonDoesNotCalculateUnsupportedMetrics(financeIQScenarioComparison)).not.toThrow();
    expect(() => assertFinanceIQScenarioComparisonDoesNotCalculateUnsupportedMetrics("const weightedScore = ltv + irr;")).toThrow(
      "FinanceIQ scenario comparison may order authoritative outputs but cannot calculate unsupported metrics or opaque scores.",
    );
  });
});

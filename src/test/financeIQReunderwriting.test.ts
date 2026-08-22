import { describe, expect, it } from "vitest";
import {
  buildFinancingReunderwritingRequest,
  buildFinancingReunderwritingResult,
  buildFinancingVersionGraph,
  detectMaterialFinancingChanges,
  FINANCEIQ_REUNDERWRITING_CONTRACT_VERSION,
  isMaterialFinancingChange,
  statusAfterFailure,
} from "../core/financeIQReunderwriting";
import type { DebtTranche, EquityTranche, FinancingProjection } from "../core/financeIQ";

const baseProjection: FinancingProjection = {
  contractVersion: "financeiq-structure-projection-v1",
  financingStructureId: "structure-a",
  financingStructureVersion: 2,
  workspaceId: "workspace-1",
  dealId: "deal-1",
  name: "Senior loan",
  purpose: "acquisition",
  status: "quoted",
  currency: "USD",
  verificationState: "quoted",
  sourceClassification: "quoted",
  confidence: 82,
  isActive: true,
  activeContext: "current_deal",
  isExpired: false,
  capitalSourceCount: 1,
  debtTrancheCount: 1,
  equityTrancheCount: 1,
  updatedAt: "2026-08-22T10:00:00.000Z",
  loadedAt: "2026-08-22T10:00:00.000Z",
  feasibilityStatus: "feasible_with_conditions",
  feasibilityVersion: 1,
  stale: false,
};

const baseDebt: DebtTranche = {
  debtTrancheId: "debt-a",
  debtTrancheVersion: 1,
  workspaceId: "workspace-1",
  financingStructureId: "structure-a",
  label: "Senior debt",
  principalAmount: 800000,
  fundedAmount: 800000,
  rateType: "fixed",
  statedRate: 0.0675,
  amortizationMonths: 360,
  maturityMonths: 120,
  interestOnlyMonths: 12,
  paymentFrequency: "monthly",
  hasBalloon: true,
  fees: [{ kind: "origination", amount: 8000 }],
  prepaymentType: "step_down",
  prepaymentTerms: "3-2-1",
  recourseType: "partial",
  drawMetadata: {},
  extensionMetadata: {},
  reserveEscrowMetadata: {},
  status: "quoted",
  sourceClassification: "quoted",
  verificationState: "quoted",
  confidence: 80,
};

const baseEquity: EquityTranche = {
  equityTrancheId: "equity-a",
  equityTrancheVersion: 1,
  workspaceId: "workspace-1",
  financingStructureId: "structure-a",
  label: "Investor cash",
  contributionAmount: 250000,
  currency: "USD",
  contributionTiming: { due: "closing" },
  ownershipPercentage: 100,
  controlTerms: "sole control",
  votingTerms: "sole vote",
  preferredReturnTerms: {},
  waterfallTerms: {},
  promoteTerms: {},
  distributionPriority: 1,
  fees: [],
  status: "committed",
  sourceClassification: "investor_provided",
  verificationState: "investor_provided",
  confidence: 90,
};

describe("FinanceIQ re-underwriting integration contract", () => {
  it("detects deterministic material financing changes without treating labels as calculation inputs", () => {
    const cosmetic = { ...baseProjection, name: "Senior Loan - updated label", loadedAt: "2026-08-22T10:01:00.000Z" };
    expect(isMaterialFinancingChange({
      before: baseProjection,
      after: cosmetic,
      beforeDebtTranches: [baseDebt],
      afterDebtTranches: [baseDebt],
      beforeEquityTranches: [baseEquity],
      afterEquityTranches: [baseEquity],
      beforeFeasibilityStatus: "feasible_with_conditions",
      afterFeasibilityStatus: "feasible_with_conditions",
      beforeBindingConstraintHash: "constraints-a",
      afterBindingConstraintHash: "constraints-a",
    })).toBe(false);

    const cheaperDebt = { ...baseDebt, statedRate: 0.06125, amortizationMonths: 300, prepaymentTerms: "open after year 3" };
    const changes = detectMaterialFinancingChanges({
      before: baseProjection,
      after: { ...baseProjection, financingStructureVersion: 3 },
      beforeDebtTranches: [baseDebt],
      afterDebtTranches: [cheaperDebt],
      beforeEquityTranches: [baseEquity],
      afterEquityTranches: [baseEquity],
      beforeFeasibilityStatus: "feasible_with_conditions",
      afterFeasibilityStatus: "feasible",
      beforeBindingConstraintHash: "constraints-a",
      afterBindingConstraintHash: "constraints-b",
    });

    expect([...changes.map((change) => change.code)].sort()).toEqual([
      "amortization_changed",
      "binding_constraint_state_changed",
      "feasibility_changed",
      "financing_structure_version_changed",
      "prepayment_changed",
      "rate_changed",
    ].sort());
  });

  it("builds a version-locked request from canonical event and active financing identity", () => {
    const request = buildFinancingReunderwritingRequest({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      financingStructureId: "structure-a",
      financingStructureVersion: 3,
      activeContext: "current_deal",
      priorUnderwritingSnapshotId: "snapshot-1",
      reason: "financing_terms_changed",
      triggeringEventId: "event-1",
      requestedBy: "user-1",
      correlationId: "correlation-1",
      idempotencyKey: "event-1:financeiq-reunderwriting",
      requestedAt: "2026-08-22T10:05:00.000Z",
      materialChangeInput: {
        before: baseProjection,
        after: { ...baseProjection, financingStructureVersion: 3 },
        beforeDebtTranches: [baseDebt],
        afterDebtTranches: [{ ...baseDebt, principalAmount: 825000 }],
      },
    });

    expect(request).toMatchObject({
      contractVersion: FINANCEIQ_REUNDERWRITING_CONTRACT_VERSION,
      financingStructureId: "structure-a",
      financingStructureVersion: 3,
      priorUnderwritingSnapshotId: "snapshot-1",
      triggeringEventId: "event-1",
      idempotencyKey: "event-1:financeiq-reunderwriting",
    });
    expect([...request.materialChanges.map((change) => change.code)].sort()).toEqual([
      "financing_structure_version_changed",
      "principal_changed",
    ].sort());
    expect(Object.isFrozen(request)).toBe(true);
  });

  it("preserves prior valid results when downstream stages fail", () => {
    expect(statusAfterFailure({ stage: "underwriting", hasPriorValidResult: true })).toBe("failed_with_prior_valid_result");
    expect(statusAfterFailure({ stage: "strategy", hasPriorValidResult: true })).toBe("failed_with_prior_valid_result");
    expect(statusAfterFailure({ stage: "cockpit", hasPriorValidResult: false })).toBe("blocked");
  });

  it("links exact financing, debt schedule, underwriting, strategy, and cockpit versions", () => {
    const graph = buildFinancingVersionGraph({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      financingStructureId: "structure-b",
      financingStructureVersion: 7,
      activeContext: "current_deal",
      debtSchedules: [
        { id: "schedule-b", resultHash: "hash-b" },
        { id: "schedule-a", resultHash: "hash-a" },
      ],
      underwritingSnapshotId: "snapshot-7",
      underwritingSnapshotVersion: 7,
      underwritingRunId: "run-7",
      strategyRankingId: "ranking-7",
      strategyRankingVersion: "strategy-ranking-result-v1",
      cockpitProjectionId: "cockpit-7",
      cockpitProjectionVersion: "decision-cockpit-read-projection-contract-v1",
    });

    expect(graph.debtScheduleResultIds).toEqual(["schedule-a", "schedule-b"]);
    expect(graph.debtScheduleResultHashes).toEqual(["hash-a", "hash-b"]);

    const result = buildFinancingReunderwritingResult({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      financingStructureId: "structure-b",
      financingStructureVersion: 7,
      activeContext: "current_deal",
      priorUnderwritingSnapshotId: "snapshot-6",
      newUnderwritingSnapshotId: "snapshot-7",
      newUnderwritingSnapshotVersion: 7,
      calculationStatus: "current",
      changedAuthoritativeMetrics: [],
      staleDownstreamResultIds: ["comparison-2", "strategy-6"],
      strategyReevaluationStatus: "current",
      decisionCockpitRefreshStatus: "current",
      comparisonRefreshStatus: "stale",
      versionGraph: graph,
      warnings: [],
      failures: [],
      generatedAt: "2026-08-22T10:10:00.000Z",
    });

    expect(result.resultHash).toMatch(/^fnv1a32:/);
    expect(result.staleDownstreamResultIds).toEqual(["comparison-2", "strategy-6"]);
    expect(result.versionGraph.underwritingSnapshotId).toBe("snapshot-7");
  });
});

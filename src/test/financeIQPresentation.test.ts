import { describe, expect, it } from "vitest";
import {
  FINANCEIQ_PROJECTION_CONTRACT_VERSION,
  type CapitalSource,
  type DebtScheduleProjection,
  type DebtTranche,
  type EquityTranche,
  type FinancingProjection,
} from "../core/financeIQ";
import { buildFinanceIQPresentation } from "../core/financeIQPresentation";

const projection: FinancingProjection = {
  contractVersion: FINANCEIQ_PROJECTION_CONTRACT_VERSION,
  financingStructureId: "structure-1",
  financingStructureVersion: 3,
  workspaceId: "workspace-1",
  dealId: "deal-1",
  name: "Senior loan plus investor equity",
  purpose: "acquisition",
  status: "quoted",
  currency: "USD",
  verificationState: "quoted",
  sourceClassification: "lender_provided",
  confidence: 85,
  isActive: true,
  activeContext: "current_deal",
  isExpired: false,
  capitalSourceCount: 3,
  debtTrancheCount: 1,
  equityTrancheCount: 1,
  updatedAt: "2026-08-22T12:00:00Z",
  loadedAt: "2026-08-22T12:01:00Z",
  unresolvedConditionCount: 2,
  blockingConditionCount: 1,
  failedCovenantCount: 0,
  uncertainCovenantCount: 1,
  feasibilityStatus: "feasible_with_conditions",
  stale: false,
};

const source: CapitalSource = {
  capitalSourceId: "source-1",
  capitalSourceVersion: 1,
  workspaceId: "workspace-1",
  financingStructureId: "structure-1",
  sourceType: "debt",
  providerLabel: "Regional Bank",
  proposedAmount: 700_000,
  currency: "USD",
  status: "quoted",
  position: 1,
  sourceClassification: "lender_provided",
  verificationState: "quoted",
  confidence: 80,
};

const debt: DebtTranche = {
  debtTrancheId: "debt-1",
  debtTrancheVersion: 2,
  workspaceId: "workspace-1",
  financingStructureId: "structure-1",
  capitalSourceId: "source-1",
  label: "Senior debt",
  principalAmount: 700_000,
  rateType: "fixed",
  paymentFrequency: "monthly",
  hasBalloon: true,
  fees: [],
  prepaymentType: "unknown",
  recourseType: "partial",
  drawMetadata: {},
  extensionMetadata: {},
  reserveEscrowMetadata: {},
  status: "quoted",
  sourceClassification: "lender_provided",
  verificationState: "quoted",
  confidence: 80,
};

const equity: EquityTranche = {
  equityTrancheId: "equity-1",
  equityTrancheVersion: 1,
  workspaceId: "workspace-1",
  financingStructureId: "structure-1",
  label: "Investor cash",
  contributorLabel: "Owner",
  contributionAmount: 300_000,
  currency: "USD",
  contributionTiming: {},
  preferredReturnTerms: {},
  waterfallTerms: {},
  promoteTerms: {},
  distributionPriority: 1,
  fees: [],
  status: "committed",
  sourceClassification: "investor_provided",
  verificationState: "confirmed",
  confidence: 95,
};

const schedule: DebtScheduleProjection = {
  contractVersion: "financeiq-debt-schedule-projection-v1",
  workspaceId: "workspace-1",
  dealId: "deal-1",
  financingStructureId: "structure-1",
  financingStructureVersion: 3,
  debtTrancheId: "debt-1",
  debtTrancheVersion: 2,
  debtTrancheLabel: "Senior debt",
  status: "current",
  currency: "USD",
  firstPeriodicDebtService: 4_200,
  finalPeriodicDebtService: 4_200,
  totalBalloonPaid: 650_000,
  totalDebtService: 902_000,
  warningCount: 0,
  loadedAt: "2026-08-22T12:01:00Z",
};

describe("FinanceIQ presentation", () => {
  it("shows partial capital stack percentages only against known source-backed amounts", () => {
    const model = buildFinanceIQPresentation({
      dealId: "deal-1",
      dealName: "123 Main",
      mode: "guided",
      projections: [projection],
      capitalSources: [source, { ...source, capitalSourceId: "seller-credit", sourceType: "seller_credit", providerLabel: "Seller credit", proposedAmount: undefined }],
      debtTranches: [debt],
      equityTranches: [equity],
      debtSchedules: [schedule],
    });

    expect(model.capitalStack.label).toBe("Partial capital stack");
    expect(model.capitalStack.knownAmount).toBe(1_000_000);
    expect(model.capitalStack.segments.find((segment) => segment.id === "debt-1")?.percentOfKnownStack).toBeCloseTo(0.7);
    expect(model.capitalStack.segments.find((segment) => segment.id === "seller-credit")?.percentOfKnownStack).toBeUndefined();
  });

  it("does not synthesize Sources & Uses when authoritative Spec 005 output is absent", () => {
    const model = buildFinanceIQPresentation({
      dealId: "deal-1",
      dealName: "123 Main",
      mode: "professional",
      projections: [projection],
      capitalSources: [source],
      debtTranches: [debt],
      equityTranches: [equity],
    });

    expect(model.sourcesUses.status).toBe("authoritative_unavailable");
    expect(model.sourcesUses.detail).toMatch(/will not display funding gap, required cash, reserves, or surplus/i);
  });

  it("renders debt service and balloon exposure from supplied underwriting projection only", () => {
    const model = buildFinanceIQPresentation({
      dealId: "deal-1",
      dealName: "123 Main",
      mode: "guided",
      projections: [projection],
      debtSchedules: [schedule],
    });

    expect(model.overview.find((item) => item.label === "Debt service")?.value).toBe("$4,200");
    expect(model.overview.find((item) => item.label === "Maturity exposure")?.value).toBe("$650,000");
  });
});

import { describe, expect, it } from "vitest";
import {
  GOVERNANCEIQ_FINANCIAL_ANALYSIS_CONTRACT_VERSION,
  GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION,
  analyzeGovernanceFinancialHealth,
  analyzeGovernanceRestrictionIntelligence,
  buildGovernanceRiskGroups,
  type GovernanceFinancialAnalysisInput,
  type GovernanceRestrictionSourceFinding,
} from "../core/governanceIQ";

const generatedAt = "2026-08-24T11:45:00.000Z";

const sourceRef = {
  governanceDocumentId: "document-1",
  governanceDocumentVersion: 2,
  evidenceId: "evidence-1",
  sourceAnchor: { page: 8, table: "Budget" },
  sourceClassification: "document_extracted" as const,
  verificationState: "confirmed" as const,
  confidence: 86,
};

function financialInput(overrides: Partial<GovernanceFinancialAnalysisInput> = {}): GovernanceFinancialAnalysisInput {
  return {
    contractVersion: GOVERNANCEIQ_FINANCIAL_ANALYSIS_CONTRACT_VERSION,
    governanceRecordId: "governance-1",
    governanceRecordVersion: 3,
    generatedAt,
    periods: [
      {
        periodId: "2025",
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        amountBasis: "actual",
        duesAmount: 400,
        duesFrequency: "monthly",
        revenueAmount: 120_000,
        expenseAmount: 90_000,
        reserveBalance: 45_000,
        delinquencyAmount: 12_000,
        currency: "USD",
        sourceRefs: [{ ...sourceRef, governanceFinancialId: "financial-2025", governanceFinancialVersion: 1 }],
      },
      {
        periodId: "2026",
        periodStart: "2026-01-01",
        periodEnd: "2026-12-31",
        amountBasis: "actual",
        duesAmount: 430,
        duesFrequency: "monthly",
        revenueAmount: 129_000,
        expenseAmount: 100_000,
        reserveBalance: 50_000,
        delinquencyAmount: 12_900,
        assessmentAmount: 8_000,
        assessmentStatus: "PROPOSED",
        associationDebtAmount: 75_000,
        associationDebtServiceAmount: 9_000,
        associationDebtMaturityDate: "2031-12-31",
        associationDebtPurpose: "roof replacement",
        insuranceExpenseAmount: 18_000,
        insuranceDeductibleAmount: 25_000,
        plannedProjectAmount: 100_000,
        unitCount: 50,
        currency: "USD",
        sourceRefs: [{ ...sourceRef, governanceFinancialId: "financial-2026", governanceFinancialVersion: 2 }],
      },
    ],
    ...overrides,
  };
}

function acceptedFinding(overrides: Partial<GovernanceRestrictionSourceFinding>): GovernanceRestrictionSourceFinding {
  return {
    governanceFindingId: "finding-1",
    governanceFindingVersion: 1,
    governanceRecordId: "governance-1",
    governanceDocumentId: "document-1",
    governanceDocumentVersion: 2,
    evidenceId: "evidence-1",
    findingCategory: "short_term_rental",
    normalizedValue: { allowed: false, maximumLeaseDays: 30 },
    normalizedRequirement: "short_term_rentals_under_30_days_prohibited",
    acceptanceState: "accepted",
    conflictState: "none",
    sourceAnchor: { page: 12, clause: "7.4" },
    sourceClassification: "document_extracted",
    verificationState: "confirmed",
    confidence: 84,
    professionalReviewRecommended: false,
    ...overrides,
  };
}

describe("GovernanceIQ Slice 3 financial health analysis", () => {
  it("calculates descriptive financial golden fixtures without underwriting metrics", () => {
    const result = analyzeGovernanceFinancialHealth(financialInput());

    expect(result.contractVersion).toBe(GOVERNANCEIQ_FINANCIAL_ANALYSIS_CONTRACT_VERSION);
    expect(result.duesIndicator.growthPct).toBe(0.075);
    expect(result.reserveIndicator.reserveToAnnualExpenseRatio).toBe(0.5);
    expect(result.delinquencyIndicator.delinquencyRate).toBe(0.1);
    expect(result.budgetIndicator.surplusDeficitAmount).toBe(29_000);
    expect(result.assessmentIndicator.state).toBe("proposed_only");
    expect(result.associationDebtIndicator).toMatchObject({
      state: "present",
      principalAmount: 75_000,
      debtServiceAmount: 9_000,
      maturityDate: "2031-12-31",
    });
    expect(result.insuranceIndicator).toMatchObject({
      state: "descriptive_only",
      deductibleAmount: 25_000,
    });
    expect(result).not.toHaveProperty("noi");
    expect(result).not.toHaveProperty("capRate");
    expect(result).not.toHaveProperty("dscr");
    expect(result).not.toHaveProperty("hoaScore");
  });

  it("does not compare incompatible dues units or missing delinquency denominators", () => {
    const result = analyzeGovernanceFinancialHealth(
      financialInput({
        periods: [
          { ...financialInput().periods[0], duesFrequency: "annual", delinquencyAmount: undefined, delinquencyRate: undefined },
          { ...financialInput().periods[1], revenueAmount: undefined, delinquencyRate: undefined },
        ],
      }),
    );

    expect(result.duesIndicator.trendState).toBe("incompatible_periods");
    expect(result.duesIndicator.growthPct).toBeUndefined();
    expect(result.delinquencyIndicator.state).toBe("missing_denominator");
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        "Dues trend was not calculated because periods use incompatible units.",
        "Delinquency percentage was not calculated because the denominator is missing.",
      ]),
    );
  });

  it("preserves adopted assessment state separately from proposed assessment state", () => {
    const proposed = analyzeGovernanceFinancialHealth(financialInput());
    const adopted = analyzeGovernanceFinancialHealth(
      financialInput({
        periods: financialInput().periods.map((period) => (period.periodId === "2026" ? { ...period, assessmentStatus: "ADOPTED" } : period)),
      }),
    );

    expect(proposed.assessmentIndicator.state).toBe("proposed_only");
    expect(proposed.assessmentIndicator.adoptedAssessmentAmount).toBeUndefined();
    expect(adopted.assessmentIndicator.state).toBe("adopted_or_billed");
    expect(adopted.assessmentIndicator.adoptedAssessmentAmount).toBe(8_000);
  });

  it("is deterministic for identical source versions and inputs", () => {
    const first = analyzeGovernanceFinancialHealth(financialInput());
    const second = analyzeGovernanceFinancialHealth(financialInput());

    expect(first.resultHash).toBe(second.resultHash);
  });
});

describe("GovernanceIQ Slice 3 restriction intelligence", () => {
  it("normalizes STR prohibition and emits strategy candidates without downstream mutation", () => {
    const [result] = analyzeGovernanceRestrictionIntelligence({
      contractVersion: GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION,
      governanceRecordId: "governance-1",
      governanceRecordVersion: 3,
      generatedAt,
      findings: [acceptedFinding({})],
    });

    expect(result.state).toBe("prohibited");
    expect(result.forceLevel).toBe("hard");
    expect(result.strategyCompatibilityCandidates).toEqual(["rental_strategy_compatibility"]);
    expect(result.financingImpactCandidates).toEqual([]);
    expect(result).not.toHaveProperty("strategyCompatibilityOverride");
  });

  it("keeps commercial vehicle pickup scope uncertain unless pickup inclusion is explicit", () => {
    const [result] = analyzeGovernanceRestrictionIntelligence({
      contractVersion: GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION,
      governanceRecordId: "governance-1",
      governanceRecordVersion: 3,
      generatedAt,
      findings: [
        acceptedFinding({
          findingCategory: "commercial_vehicle",
          normalizedValue: { requirement: "No commercial vehicles, including pickup-mounted contractor signs." },
          normalizedRequirement: "commercial_vehicle_scope_uncertain_for_pickups",
        }),
      ],
    });

    expect(result.state).toBe("uncertain");
    expect(result.forceLevel).toBe("professional_review_required");
    expect(result.professionalReviewRecommended).toBe(true);
    expect(result.explanationCode).toBe("commercial_vehicle_pickup_scope_uncertain");
  });

  it("preserves trailer exceptions instead of flattening the restriction", () => {
    const [result] = analyzeGovernanceRestrictionIntelligence({
      contractVersion: GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION,
      governanceRecordId: "governance-1",
      governanceRecordVersion: 3,
      generatedAt,
      findings: [
        acceptedFinding({
          findingCategory: "trailer",
          normalizedValue: {
            allowed: false,
            exception: "Temporary loading and unloading is allowed.",
          },
          normalizedRequirement: "trailers_prohibited_except_loading",
        }),
      ],
    });

    expect(result.state).toBe("prohibited");
    expect(result.exceptions).toEqual(["Temporary loading and unloading is allowed."]);
    expect(result.explanationCode).toBe("prohibited_with_source_exception");
  });

  it("marks unresolved source conflicts for professional review", () => {
    const [result] = analyzeGovernanceRestrictionIntelligence({
      contractVersion: GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION,
      governanceRecordId: "governance-1",
      governanceRecordVersion: 3,
      generatedAt,
      findings: [
        acceptedFinding({
          findingCategory: "rental",
          conflictState: "unresolved_conflict",
          verificationState: "conflicting",
          normalizedValue: { allowed: true, minimumLeaseMonths: 12 },
        }),
      ],
    });

    expect(result.state).toBe("conflicted");
    expect(result.forceLevel).toBe("professional_review_required");
    expect(result.professionalReviewRecommended).toBe(true);
  });

  it("summarizes deterministic risk groups without a magic score", () => {
    const financial = analyzeGovernanceFinancialHealth(financialInput());
    const restrictions = analyzeGovernanceRestrictionIntelligence({
      contractVersion: GOVERNANCEIQ_RESTRICTION_INTELLIGENCE_CONTRACT_VERSION,
      governanceRecordId: "governance-1",
      governanceRecordVersion: 3,
      generatedAt,
      findings: [
        acceptedFinding({}),
        acceptedFinding({
          governanceFindingId: "finding-2",
          findingCategory: "architectural_approval",
          normalizedValue: { approvalRequired: true, conditions: ["Board approval before exterior work."] },
        }),
      ],
    });

    const groups = buildGovernanceRiskGroups({ financial, restrictions });

    expect(groups.find((group) => group.group === "rental")?.state).toBe("blocked");
    expect(groups.find((group) => group.group === "renovation")?.state).toBe("high_attention");
    expect(groups.find((group) => group.group === "financial")?.state).toBe("attention");
    expect(groups).not.toHaveProperty("score");
  });
});

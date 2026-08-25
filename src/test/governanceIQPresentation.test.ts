import { describe, expect, it } from "vitest";
import {
  GOVERNANCEIQ_WEB_EXPERIENCE_CONTRACT_VERSION,
  buildGovernanceIQPresentation,
  findingCategoryLabel,
  hierarchyLabel,
  possibleImpactLabels,
  restrictionStateLabel,
  sourceAnchorLabel,
} from "../core/governanceIQPresentation";
import { GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION, GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION, type GovernanceFinding } from "../core/governanceIQ";
import type { GovernanceWorkspaceData } from "../core/governanceIQClient";

describe("GovernanceIQ web presentation", () => {
  it("builds source-linked sections without inventing legal authority or an HOA score", () => {
    const model = buildGovernanceIQPresentation({
      dealId: "deal-1",
      dealName: "1615 Augusta",
      mode: "guided",
      data: governanceWorkspaceFixture(),
    });

    expect(model.contractVersion).toBe(GOVERNANCEIQ_WEB_EXPERIENCE_CONTRACT_VERSION);
    expect(model.stateLabel).toBe("Current with Conflicts");
    expect(model.documents[0].documents[0].title).toBe("Declaration");
    expect(hierarchyLabel(model.documents[0].documents[0].hierarchyClassification)).toBe("Candidate Current");
    expect(sourceAnchorLabel(model.documents[0].documents[0].sourceAnchor)).toContain("Article VI");
    expect(model.findings.map((group) => group.label)).toEqual(expect.arrayContaining(["Leasing", "Parking / Vehicles / Trailers", "Costs"]));
    expect(model.metrics.map((metric) => metric.label)).not.toContain("HOA score");
    expect(model.metrics.map((metric) => metric.label)).not.toContain("Budget health score");
  });

  it("distinguishes accepted restrictions, proposed assessments, conflicts, and propagation state", () => {
    const model = buildGovernanceIQPresentation({
      dealId: "deal-1",
      dealName: "1615 Augusta",
      mode: "professional",
      data: governanceWorkspaceFixture(),
    });

    expect(model.restrictions.map((item) => item.category)).toEqual(expect.arrayContaining(["short_term_rental", "commercial_vehicle"]));
    expect(model.restrictions.map((item) => restrictionStateLabel(item.state))).toEqual(expect.arrayContaining(["Prohibited", "Uncertain"]));
    expect(model.financial?.assessmentIndicator.state).toBe("proposed_only");
    expect(model.conflicts[0].professionalReviewRecommended).toBe(true);
    expect(model.questions[0].label).toBe("Association / Manager");
    expect(model.propagations[0]).toMatchObject({
      propagationStatus: "pending_downstream_review",
      hasPendingDownstreamReview: true,
    });
    expect(model.latestMaterialChange?.category).toBe("short_term_rental");
    expect(model.professionalDetails.join(" ")).toContain("Restriction hashes");
  });

  it("maps accepted governance changes only to possible downstream impact labels", () => {
    const dueFinding = findingFixture({ governanceFindingId: "finding-dues", findingCategory: "dues", summary: "Monthly dues increased" });
    const strFinding = findingFixture({ governanceFindingId: "finding-str", findingCategory: "short_term_rental", summary: "STR prohibited" });
    const litigationFinding = findingFixture({ governanceFindingId: "finding-lit", findingCategory: "litigation", summary: "Pending litigation disclosed" });

    expect(possibleImpactLabels(dueFinding)).toEqual(expect.arrayContaining(["Decision Cockpit", "underwriting"]));
    expect(possibleImpactLabels(strFinding)).toEqual(expect.arrayContaining(["Decision Cockpit", "strategy"]));
    expect(possibleImpactLabels(litigationFinding)).toEqual(expect.arrayContaining(["Decision Cockpit", "FinanceIQ"]));
    expect(findingCategoryLabel("pickup_truck")).toBe("Parking / Vehicles / Trailers");
  });
});

function governanceWorkspaceFixture(): GovernanceWorkspaceData {
  const selectedProjection = {
    contractVersion: GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION,
    governanceRecordId: "gov-record-1",
    governanceRecordVersion: 3,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    name: "Augusta HOA",
    governanceType: "homeowners_association" as const,
    status: "current_with_conflicts" as const,
    projectionState: "current_with_conflicts" as const,
    documentCount: 2,
    findingCount: 4,
    unresolvedConflictCount: 1,
    acceptedFindingCount: 3,
    highSeverityFindingCount: 1,
    professionalReviewRequired: true,
    sourceCompleteness: "source_linked" as const,
    verificationSummary: {},
    updatedAt: "2026-08-25T12:00:00.000Z",
    loadedAt: "2026-08-25T12:05:00.000Z",
  };
  return {
    projections: [selectedProjection],
    selectedProjection,
    record: {
      governanceRecordId: "gov-record-1",
      governanceRecordVersion: 3,
      workspaceId: "workspace-1",
      dealId: "deal-1",
      propertyId: "property-1",
      name: "Augusta HOA",
      governanceType: "homeowners_association",
      status: "current",
      sourceClassification: "association_provided",
      verificationState: "confirmed",
      confidence: 0.91,
      updatedAt: "2026-08-25T12:00:00.000Z",
    },
    documents: [{
      contractVersion: GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION,
      governanceDocumentId: "doc-1",
      governanceDocumentVersion: 2,
      workspaceId: "workspace-1",
      governanceRecordId: "gov-record-1",
      evidenceId: "evidence-1",
      documentType: "declaration_ccrs",
      title: "Declaration",
      hierarchyClassification: "candidate_current",
      analysisState: "current",
      sourceClassification: "document_extracted",
      verificationState: "confirmed",
      confidence: 0.9,
      sourceAnchor: { page: 4, article: "VI" },
    }],
    findings: [
      findingFixture({
        governanceFindingId: "finding-str",
        findingCategory: "short_term_rental",
        summary: "Short-term rentals are prohibited",
        normalizedRequirement: "No rental period shorter than 30 days.",
        normalizedValue: { prohibited: true, rentalMinimumDays: 30 },
      }),
      findingFixture({
        governanceFindingId: "finding-vehicle",
        findingCategory: "commercial_vehicle",
        summary: "Commercial vehicles require board approval",
        normalizedRequirement: "Commercial vehicles may require prior written board approval.",
        normalizedValue: { approvalRequired: true, vehicleType: "pickup", conditions: ["No signage"], exceptions: ["Garaged vehicle"] },
      }),
      findingFixture({
        governanceFindingId: "finding-dues",
        findingCategory: "dues",
        summary: "Monthly dues are $300",
        normalizedRequirement: "Monthly dues of $300.",
        normalizedValue: { duesAmount: 300, frequency: "monthly" },
      }),
      findingFixture({
        governanceFindingId: "finding-assessment",
        findingCategory: "assessment",
        summary: "Special assessment proposed",
        acceptanceState: "proposed",
        normalizedValue: { assessmentAmount: 1200, assessmentStatus: "PROPOSED" },
      }),
    ],
    conflicts: [{
      conflictType: "source_conflict",
      severity: "high",
      category: "rental",
      summary: "Rules and resale certificate disagree on minimum lease term",
      sourceAAnchor: { page: 5, section: "Rules" },
      sourceBAnchor: { page: 2, section: "Resale certificate" },
      normalizedA: { rentalMinimumDays: 30 },
      normalizedB: { rentalMinimumDays: 365 },
      confidence: 0.82,
      detectionMethod: "deterministic_normalized_value",
      professionalReviewRecommended: true,
    }],
    financialPeriods: [{
      periodId: "financial-current",
      amountBasis: "actual",
      duesAmount: 300,
      duesFrequency: "monthly",
      revenueAmount: 300000,
      expenseAmount: 290000,
      reserveBalance: 80000,
      delinquencyRate: 0.04,
      assessmentAmount: 1200,
      assessmentStatus: "PROPOSED",
      insuranceExpenseAmount: 22000,
      insuranceDeductibleAmount: 10000,
      currency: "USD",
      sourceRefs: [{
        governanceFinancialId: "financial-current",
        governanceFinancialVersion: 1,
        evidenceId: "evidence-budget",
        sourceAnchor: { page: 7, table: "Budget" },
        verificationState: "confirmed",
        sourceClassification: "document_extracted",
        confidence: 0.88,
      }],
    }],
    questions: [{
      questionId: "question-1",
      questionVersion: 1,
      workspaceId: "workspace-1",
      governanceRecordId: "gov-record-1",
      question: "Has the proposed assessment been adopted or billed?",
      targetRole: "association_manager",
      whyItMatters: "BRIX must not treat a proposed amount as current cost.",
      sourceReason: "Budget marks the amount as proposed.",
      sourceAnchor: { page: 7, table: "Budget" },
      status: "open",
      professionalReviewRecommended: false,
    }],
    propagations: [{
      governanceChangePropagationId: "propagation-1",
      workspaceId: "workspace-1",
      dealId: "deal-1",
      propertyId: "property-1",
      governanceRecordId: "gov-record-1",
      governanceFindingId: "finding-str",
      findingVersion: 1,
      acceptanceVersion: 2,
      category: "short_term_rental",
      materiality: "material",
      impactDomains: ["strategy", "decision_cockpit"],
      propagationStatus: "pending_downstream_review",
      downstreamStates: {},
      priorValidDownstream: {},
      failures: [],
      explanations: ["Accepted STR restriction may affect rental strategy compatibility."],
      versionGraph: {},
      resultHash: "propagation-hash",
      downstreamProposalCount: 2,
      underwritingProposalCount: 0,
      strategyProposalCount: 1,
      financeProposalCount: 0,
      cockpitProposalCount: 1,
      taskProposalCount: 0,
      blockedProposalCount: 0,
      hasPendingDownstreamReview: true,
    }],
  };
}

function findingFixture(overrides: Partial<GovernanceFinding> = {}): GovernanceFinding {
  return {
    contractVersion: GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION,
    governanceFindingId: "finding-1",
    governanceFindingVersion: 1,
    workspaceId: "workspace-1",
    governanceRecordId: "gov-record-1",
    governanceDocumentId: "doc-1",
    dealId: "deal-1",
    propertyId: "property-1",
    findingType: "restriction",
    findingCategory: "rental",
    summary: "Rental rule",
    normalizedValue: { restrictionState: "allowed_with_conditions" },
    normalizedRequirement: "Rental requires association approval.",
    severity: "moderate",
    impactType: "strategy",
    acceptanceState: "accepted",
    professionalReviewRecommended: false,
    sourceClassification: "document_extracted",
    verificationState: "confirmed",
    confidence: 0.84,
    sourceEvidenceId: "evidence-1",
    sourceAnchor: { page: 4, article: "VI" },
    ...overrides,
  };
}

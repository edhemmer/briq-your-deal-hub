import { describe, expect, it } from "vitest";
import { buildContractIQPresentation, contractSectionFromFocus, sourceAnchorLabel } from "../core/contractIQPresentation";
import type { ContractIQWorkspaceData } from "../core/contractIQClient";

describe("ContractIQ web experience presentation", () => {
  it("builds Deal-scoped sections from canonical ContractIQ projections without changing facts by perspective", () => {
    const buyer = buildContractIQPresentation({
      dealId: "deal-1",
      dealName: "123 Main",
      mode: "guided",
      perspective: "buyer",
      data: fixtureData(),
    });
    const seller = buildContractIQPresentation({
      dealId: "deal-1",
      dealName: "123 Main",
      mode: "professional",
      perspective: "seller",
      data: fixtureData(),
    });

    expect(buyer.contractVersion).toBe("contractiq-web-experience-v1");
    expect(buyer.metrics.map((metric) => metric.label)).toContain("Deadlines");
    expect(buyer.sourceRows).toHaveLength(2);
    expect(buyer.parties).toHaveLength(1);
    expect(buyer.moneyTerms[0].label).toBe("Purchase price");
    expect(buyer.contingencies[0].label).toContain("Inspection");
    expect(buyer.deadlineResults[0].dueAt).toBe("2026-09-02T21:00:00.000Z");
    expect(buyer.questions[0].label).toBe("Canonical Questions");
    expect(buyer.negotiationConcepts[0].title).toBe("Repair credit concept");
    expect(buyer.acceptedChangeProposals[0].recordId).toBe("proposal-1");
    expect(buyer.propagations[0].targetDomain).toBe("underwriting_input");
    expect(seller.moneyTerms[0].payload.normalized_value).toEqual(buyer.moneyTerms[0].payload.normalized_value);
    expect(seller.deadlineResults[0].dueAt).toBe(buyer.deadlineResults[0].dueAt);
    expect(seller.perspective).toBe("seller");
  });

  it("routes focus values to ContractIQ sections and labels source anchors", () => {
    expect(contractSectionFromFocus("contract_deadline")).toBe("deadlines");
    expect(contractSectionFromFocus("contract_negotiation")).toBe("questions");
    expect(contractSectionFromFocus("contract_propagation")).toBe("changes");
    expect(sourceAnchorLabel({ kind: "clause", page: 4, section: "8", clause: "8.2" })).toBe("Page 4 / Section 8 / Clause 8.2");
  });
});

function fixtureData(): ContractIQWorkspaceData {
  const projection = {
    contractId: "contract-1",
    contractVersion: 4,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    contractType: "purchase_agreement" as const,
    title: "Purchase Agreement",
    perspective: "buyer" as const,
    status: "under_review",
    verificationState: "source_backed" as const,
    analysisState: "current_with_conflicts" as const,
    classificationState: "classified_verified" as const,
    extractionFreshnessState: "current_candidate" as const,
    confidence: 88,
    evidenceCount: 1,
    partyCount: 1,
    verifiedPartyCount: 1,
    unverifiedPartyCount: 0,
    termCount: 2,
    acceptedTermCount: 1,
    proposedTermCount: 1,
    contingencyCount: 1,
    amendmentCount: 1,
    deadlineCount: 1,
    findingCount: 1,
    missingInputCount: 1,
    unresolvedConflictCount: 1,
    openQuestionCount: 1,
    professionalReviewCount: 1,
    priorValidAfterFailure: false,
    professionalReviewRequired: true,
    verificationSummary: {},
    projectionState: "current_with_conflicts" as const,
    verifiedCurrentDeadlineCount: 1,
    proposedDeadlineCount: 0,
    uncertainDeadlineCount: 0,
    missedDeadlineCount: 0,
    deadlineStaleCount: 0,
    deadlineConflictCount: 0,
    nextDeadlineDueAt: "2026-09-02T21:00:00.000Z",
    currentPerspectiveAnalysisState: "current_with_conflicts",
    currentPerspective: "buyer" as const,
    perspectiveBenefitCount: 0,
    perspectiveRiskCount: 1,
    perspectiveUnusualTermCount: 0,
    perspectiveMissingProtectionCount: 0,
    perspectiveMissingInformationCount: 1,
    perspectiveConflictCount: 1,
    perspectiveAmendmentImpactCount: 1,
    perspectiveObligationCount: 0,
    perspectiveQuestionCount: 1,
    perspectiveNegotiationConceptCount: 1,
    perspectiveDownstreamCandidateCount: 1,
    perspectivePriorValidAvailable: false,
  };
  return {
    projections: [projection],
    selectedProjection: projection,
    detail: {
      record: {
        contractId: "contract-1",
        contractVersion: 4,
        workspaceId: "workspace-1",
        dealId: "deal-1",
        propertyId: "property-1",
        title: "Purchase Agreement",
        contractType: "purchase_agreement",
        perspective: "buyer",
        status: "under_review",
        verificationState: "source_backed",
        analysisState: "current_with_conflicts",
        confidence: 88,
        sourceEvidenceId: "evidence-1",
        sourceAnchor: { kind: "clause", page: 1 },
      },
      evidenceLinks: [detail("evidence_link", "evidence-link-1", "Executed agreement", "linked", { evidence_id: "evidence-1" })],
      parties: [detail("party", "party-1", "Buyer LLC", "buyer", { party_role: "buyer" })],
      terms: [
        detail("term", "term-1", "Purchase price", "accepted", { term_category: "economic_term", normalized_value: { amount: 400000, currency: "USD" } }),
        detail("term", "term-2", "Inspection contingency", "proposed", { term_category: "contingency", normalized_value: { days: 7 } }),
      ],
      deadlines: [detail("deadline", "deadline-1", "Inspection deadline", "current", { deadline_type: "inspection" })],
      findings: [detail("finding", "finding-1", "Missing seller disclosure", "proposed", { severity: "high" })],
      conflicts: [detail("conflict", "conflict-1", "Closing date conflict", "unresolved", { normalized_a: { date: "2026-09-20" }, normalized_b: { date: "2026-09-22" } })],
      relationships: [detail("relationship", "rel-1", "Amendment one", "amends", { relationship_type: "amends" })],
      changeProposals: [detail("change_proposal", "proposal-1", "Update purchase price", "accepted", { target_domain: "underwriting_input", normalized_value: { purchasePrice: 400000 } })],
      questions: [detail("question", "question-1", "Confirm seller disclosure?", "open", { question: "Confirm seller disclosure?", rationale: "Disclosure is referenced but not linked." })],
    },
    perspectiveItems: [
      perspectiveItem("risk-1", "finding", "risk", "Inspection risk", "Repair scope is not capped.", "buyer"),
      perspectiveItem("question-2", "question", undefined, "Ask title company", "Confirm recorded easements.", "buyer"),
      perspectiveItem("negotiation-1", "negotiation_concept", undefined, "Repair credit concept", "Consider a credit concept for inspection findings.", "buyer"),
      perspectiveItem("risk-2", "finding", "risk", "Seller closing pressure", "Seller should confirm deadline certainty.", "seller"),
    ],
    deadlineResults: [{
      calculationId: "calc-1",
      workspaceId: "workspace-1",
      dealId: "deal-1",
      contractId: "contract-1",
      contractDeadlineId: "deadline-1",
      calculationVersion: 1,
      contractDeadlineVersion: 1,
      triggerAt: "2026-08-26T21:00:00.000Z",
      triggerVerification: "source_verified",
      dueAt: "2026-09-02T21:00:00.000Z",
      timezone: "America/New_York",
      offsetValue: 7,
      offsetUnit: "calendar_days",
      countingRule: "calendar_date_offset",
      holidaysApplied: [],
      adjustmentApplied: {},
      sourceEvidenceId: "evidence-1",
      sourceAnchor: { kind: "clause", page: 4, section: "8", clause: "8.2" },
      status: "current",
      warnings: [],
      calculationContractVersion: "contractiq-deadline-engine-v1",
      deterministicHash: "hash-deadline",
    }],
    amendmentImpacts: [{
      impactId: "impact-1",
      impactVersion: 1,
      workspaceId: "workspace-1",
      dealId: "deal-1",
      propertyId: "property-1",
      contractId: "contract-1",
      analysisRunId: "run-1",
      impactType: "amends_term",
      impactSummary: "Amendment changes inspection period.",
      changedTermIds: ["term-2"],
      supersededTermIds: [],
      addedTermIds: [],
      changedDeadlineIds: ["deadline-1"],
      conflictIds: ["conflict-1"],
      sourceRefs: [],
      professionalReviewRequired: true,
      downstreamMutationAllowed: false,
      deterministicHash: "hash-impact",
      status: "candidate_only",
    }],
    propagations: [{
      contractChangePropagationId: "propagation-1",
      propagationVersion: 1,
      workspaceId: "workspace-1",
      dealId: "deal-1",
      propertyId: "property-1",
      contractId: "contract-1",
      contractVersion: 4,
      contractTermId: "term-1",
      contractTermVersion: 1,
      acceptedProposalId: "proposal-1",
      acceptedProposalVersion: 1,
      sourceEvidenceId: "evidence-1",
      sourceAnchor: { kind: "clause", page: 2 },
      verificationState: "source_backed",
      perspective: "buyer",
      proposalType: "economic_term",
      targetDomain: "underwriting_input",
      materiality: "material",
      propagationStatus: "completed",
      affectedDomains: ["underwriting_input", "decision_cockpit"],
      underwritingStatus: "completed",
      strategyStatus: "stale",
      financeStatus: "not_affected",
      deadlineTaskStatus: "not_affected",
      cockpitStatus: "queued",
      timelineStatus: "queued",
      retryCount: 0,
      priorValidReferences: [],
      versionGraph: {},
      deterministicRequestHash: "hash-propagation",
      downstreamProposalCount: 2,
      failedDownstreamCount: 0,
      generatedAt: "2026-08-27T12:00:00.000Z",
      updatedAt: "2026-08-27T12:00:00.000Z",
      loadedAt: "2026-08-27T12:00:00.000Z",
    }],
  };
}

function detail(recordType: string, recordId: string, label: string, status: string, payload: Record<string, unknown>) {
  return {
    recordType,
    recordId,
    recordVersion: 1,
    workspaceId: "workspace-1",
    contractId: "contract-1",
    dealId: "deal-1",
    propertyId: "property-1",
    label,
    status,
    verificationState: "source_backed",
    sourceEvidenceId: "evidence-1",
    sourceAnchor: { kind: "clause", page: 4, section: "8", clause: "8.2" },
    payload,
  };
}

function perspectiveItem(itemId: string, itemKind: string, findingGroup: string | undefined, title: string, summary: string, perspective: "buyer" | "seller") {
  return {
    itemId,
    itemVersion: 1,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    contractId: "contract-1",
    analysisRunId: "run-1",
    itemKind,
    findingGroup,
    severity: "high",
    title,
    summary,
    perspective,
    sourceRefs: [{ sourceType: "term", recordId: "term-1", sourceAnchor: { kind: "clause", page: 4 } }],
    payload: {},
    professionalReviewRequired: true,
    downstreamMutationAllowed: false,
    status: itemKind === "negotiation_concept" ? "candidate_only" : "current",
  };
}

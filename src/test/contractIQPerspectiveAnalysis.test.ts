import { describe, expect, it } from "vitest";

import {
  CONTRACTIQ_PERSPECTIVE_ANALYSIS_VERSION,
  type ContractPerspectiveAnalysisInput,
  analyzeContractPerspective,
} from "../core/contractIQ";

const sourceAnchor = { kind: "clause" as const, clause: "8(b)", evidenceId: "evidence-1" };

function input(overrides: Partial<ContractPerspectiveAnalysisInput> = {}): ContractPerspectiveAnalysisInput {
  return {
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    contractId: "contract-1",
    contractVersion: 4,
    contractType: "purchase_agreement",
    perspective: "buyer",
    status: "executed",
    analysisContractVersion: CONTRACTIQ_PERSPECTIVE_ANALYSIS_VERSION,
    asOf: "2026-08-26T12:00:00.000Z",
    correlationId: "correlation-1",
    terms: [
      {
        contractTermId: "term-deposit",
        version: 2,
        termCategory: "economic",
        termType: "earnest_money",
        title: "Earnest money deposit",
        displayValue: "$50,000 non-refundable earnest money after inspection period",
        normalizedValue: { amount: 50000, currency: "USD", refundable: false },
        sourceEvidenceId: "evidence-1",
        sourceAnchor,
        verificationState: "verified",
        proposalState: "accepted",
        materiality: "material",
      },
      {
        contractTermId: "term-financing",
        version: 1,
        termCategory: "financing",
        termType: "financing_contingency",
        title: "Financing contingency",
        displayValue: "Closing is subject to lender approval by the commitment date.",
        normalizedValue: { contingency: true },
        sourceEvidenceId: "evidence-2",
        sourceAnchor: { kind: "clause", clause: "12", evidenceId: "evidence-2" },
        verificationState: "source_backed",
        proposalState: "accepted",
        materiality: "material",
      },
      {
        contractTermId: "term-assignment",
        version: 1,
        termCategory: "assignment_transfer",
        termType: "assignment",
        title: "Assignment",
        displayValue: "Assignment requires seller consent except transfers to buyer affiliates.",
        normalizedValue: { consentRequired: true, affiliateException: true },
        sourceEvidenceId: "evidence-3",
        sourceAnchor: { kind: "clause", clause: "18", evidenceId: "evidence-3" },
        verificationState: "verified",
        proposalState: "accepted",
        materiality: "material",
      },
    ],
    parties: [
      {
        contractPartyId: "party-buyer",
        version: 1,
        displayName: "BRIX Buyer LLC",
        partyRole: "buyer",
        signatureStatus: "signed",
        verificationState: "verified",
        sourceEvidenceId: "evidence-4",
        sourceAnchor: { kind: "signature_block", label: "Buyer signature", evidenceId: "evidence-4" },
      },
      {
        contractPartyId: "party-seller",
        version: 1,
        displayName: "Seller LLC",
        partyRole: "seller",
        signatureStatus: "unknown",
        verificationState: "source_backed",
        sourceEvidenceId: "evidence-4",
        sourceAnchor: { kind: "signature_block", label: "Seller signature", evidenceId: "evidence-4" },
      },
    ],
    deadlineResults: [
      {
        contractDeadlineId: "deadline-financing",
        calculationId: "contract-deadline:financing",
        calculationVersion: 1,
        contractDeadlineVersion: 1,
        deadlineType: "financing commitment",
        dueAt: "2026-08-28T17:00:00.000Z",
        status: "current",
        triggerVerification: "source_verified",
        sourceEvidenceId: "evidence-2",
        sourceAnchor: { kind: "clause", clause: "12", evidenceId: "evidence-2" },
        warnings: [],
      },
    ],
    conflicts: [],
    relationships: [],
    ...overrides,
  };
}

describe("ContractIQ Slice 4 perspective analysis", () => {
  it("interprets the same accepted source facts differently by perspective without changing the source graph", () => {
    const buyer = analyzeContractPerspective(input(), { generatedAt: "2026-08-26T13:00:00.000Z" });
    const seller = analyzeContractPerspective(input({ perspective: "seller" }), { generatedAt: "2026-08-26T13:00:00.000Z" });

    expect(buyer.analysisContractVersion).toBe(CONTRACTIQ_PERSPECTIVE_ANALYSIS_VERSION);
    expect(buyer.riskFindings.some((finding) => finding.findingType === "deposit_exposure")).toBe(true);
    expect(seller.benefitFindings.some((finding) => finding.findingType === "deposit_deal_certainty")).toBe(true);
    expect(buyer.sourceVersionGraph).toMatchObject({
      contract: seller.sourceVersionGraph.contract,
      terms: seller.sourceVersionGraph.terms,
      parties: seller.sourceVersionGraph.parties,
      deadlineResults: seller.sourceVersionGraph.deadlineResults,
      conflicts: seller.sourceVersionGraph.conflicts,
      relationships: seller.sourceVersionGraph.relationships,
    });
    expect(buyer.deterministicHash).not.toBe(seller.deterministicHash);
  });

  it("generates source-linked questions, review items, and discussion-draft concepts without legal conclusions", () => {
    const result = analyzeContractPerspective(input(), { generatedAt: "2026-08-26T13:00:00.000Z" });

    expect(result.professionalReviewItems.length).toBeGreaterThan(0);
    expect(result.questions.every((question) => question.sourceRefs.length > 0)).toBe(true);
    expect(result.negotiationConcepts[0]).toMatchObject({
      discussionDraftLabel: "DISCUSSION DRAFT",
      professionalReviewLabel: "FOR LICENSED PROFESSIONAL REVIEW",
      status: "candidate_only",
    });
    expect(JSON.stringify(result)).not.toMatch(/legalConclusion|riskScore|mutationAllowed":true/);
  });

  it("flags missing protections only from analyzed accepted inputs", () => {
    const result = analyzeContractPerspective(input({ terms: [input().terms[0]] }), { generatedAt: "2026-08-26T13:00:00.000Z" });

    expect(result.missingProtectionFindings.map((finding) => finding.findingType)).toContain("missing_inspection_or_due_diligence_protection");
    expect(result.missingProtectionFindings.map((finding) => finding.findingType)).toContain("missing_financing_protection");
    expect(result.completenessState).toBe("missing_signature");
  });

  it("preserves conflicts and amendment impacts as candidate records with no winner", () => {
    const result = analyzeContractPerspective(input({
      conflicts: [
        {
          contractConflictId: "conflict-price",
          version: 1,
          conflictType: "purchase_price_conflict",
          severity: "high",
          summary: "Purchase price differs between base agreement and amendment.",
          resolutionState: "unresolved",
          sourceAAnchor: { kind: "clause", clause: "3", evidenceId: "evidence-1" },
          sourceBAnchor: { kind: "addendum", label: "Amendment 1", evidenceId: "evidence-5" },
          professionalReviewRequired: true,
        },
      ],
      relationships: [
        {
          contractRelationshipId: "relationship-1",
          version: 1,
          relationshipType: "amends",
          relatedContractId: "contract-base",
          relatedContractVersion: 3,
          sourceEvidenceId: "evidence-5",
          sourceAnchor: { kind: "addendum", label: "Amendment 1", evidenceId: "evidence-5" },
          verificationState: "source_backed",
        },
      ],
    }), { generatedAt: "2026-08-26T13:00:00.000Z" });

    expect(result.conflictFindings[0].summary).toMatch(/differs/);
    expect(result.conflictFindings[0]).not.toHaveProperty("winner");
    expect(result.amendmentImpactFindings).toHaveLength(1);
    expect(result.downstreamImpactCandidates.every((candidate) => candidate.mutationAllowed === false)).toBe(true);
  });

  it("keeps prior valid results available after failure", () => {
    const prior = analyzeContractPerspective(input(), { generatedAt: "2026-08-26T13:00:00.000Z" });
    const failure = analyzeContractPerspective(input({
      failure: { errorCode: "provider_timeout" },
      priorValidAnalysis: prior,
      correlationId: "correlation-failure",
    }), { generatedAt: "2026-08-26T13:10:00.000Z" });

    expect(failure.analysisState).toBe("failed_with_prior_analysis");
    expect(failure.completenessState).toBe("failed_with_prior_valid");
    expect(failure.priorValidPreserved).toBe(true);
    expect(failure.riskFindings).toEqual(prior.riskFindings);
  });

  it("is deterministic for identical normalized source/version inputs regardless of generated timestamp", () => {
    const first = analyzeContractPerspective(input(), { generatedAt: "2026-08-26T13:00:00.000Z" });
    const second = analyzeContractPerspective(input(), { generatedAt: "2026-08-26T13:05:00.000Z" });

    expect(first.deterministicHash).toBe(second.deterministicHash);
    expect(first.analysisId).toBe(second.analysisId);
    expect(first.generatedAt).not.toBe(second.generatedAt);
  });
});

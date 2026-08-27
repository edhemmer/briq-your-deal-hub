import { describe, expect, it } from "vitest";

import {
  CONTRACTIQ_CHANGE_PROPAGATION_VERSION,
  buildContractChangePropagationRequest,
  buildContractChangePropagationResult,
  classifyContractChangeTargetDomain,
  contractChangePropagationStateAfterFailure,
  type ContractChangePropagationRequest,
} from "../core/contractIQ";

const sourceAnchor = { kind: "clause" as const, clause: "3(a)", evidenceId: "evidence-contract-1" };

function request(overrides: Partial<ContractChangePropagationRequest> & { termType?: string; termCategory?: string; findingType?: string; findingCategory?: string } = {}) {
  return buildContractChangePropagationRequest({
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    contractId: "contract-1",
    contractVersion: 4,
    contractTermId: "term-price",
    contractTermVersion: 3,
    contractFindingId: "finding-price",
    contractFindingVersion: 2,
    acceptedProposalId: "proposal-price",
    acceptedProposalVersion: 1,
    sourceEvidenceId: "evidence-contract-1",
    sourceAnchor,
    verificationState: "verified",
    perspective: "buyer",
    proposalType: "purchase_price_amendment",
    normalizedValue: { amount: 385000, previousAmount: 400000, currency: "USD" },
    previousCanonicalValue: { amount: 400000, currency: "USD" },
    previousCanonicalVersion: 7,
    materiality: "material",
    effectiveAt: "2026-09-01T00:00:00.000Z",
    triggeringEventId: "event-1",
    correlationId: "correlation-1",
    requestedBy: "user-1",
    idempotencyKey: "idempotency-1",
    ...overrides,
  });
}

describe("ContractIQ Slice 5 controlled change propagation", () => {
  it("routes purchase price amendment 400k to 385k through underwriting and strategy without direct calculation ownership", () => {
    const result = buildContractChangePropagationResult({ request: request(), generatedAt: "2026-08-26T12:00:00.000Z" });

    expect(result.propagationContractVersion).toBe(CONTRACTIQ_CHANGE_PROPAGATION_VERSION);
    expect(result.targetDomain).toBe("underwriting_input");
    expect(result.affectedDomains).toEqual(["underwriting_input", "strategy_requirement", "cockpit_attention"]);
    expect(result.underwritingStatus).toBe("stale");
    expect(result.strategyStatus).toBe("stale");
    expect(result.cockpitStatus).toBe("stale");
    expect(result.targetProposals.every((proposal) => proposal.explanation.includes("does not overwrite owner results directly"))).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/underwritingResult|strategyScore|legalConclusion/);
  });

  it("routes a closing date change to canonical deadline reconciliation without recalculating Slice 3 math", () => {
    const result = buildContractChangePropagationResult({
      request: request({
        acceptedProposalId: "proposal-closing",
        contractTermId: "term-closing",
        proposalType: "closing_date_change",
        normalizedValue: { closingDate: "2026-10-15", previousClosingDate: "2026-09-30" },
        previousCanonicalValue: { closingDate: "2026-09-30" },
      }),
      generatedAt: "2026-08-26T12:00:00.000Z",
    });

    expect(result.targetDomain).toBe("task_deadline");
    expect(result.deadlineTaskStatus).toBe("queued");
    expect(result.targetProposals[0]).toMatchObject({ propagationAction: "reconcile_deadline", targetCanonicalType: "deadline" });
  });

  it("routes financing rate ceiling to FinanceIQ and stale downstream projections", () => {
    const result = buildContractChangePropagationResult({
      request: request({
        acceptedProposalId: "proposal-rate-ceiling",
        contractTermId: "term-rate-ceiling",
        proposalType: "financing_rate_ceiling",
        normalizedValue: { maxRatePct: 7 },
        previousCanonicalValue: { maxRatePct: 7.5 },
      }),
      generatedAt: "2026-08-26T12:00:00.000Z",
    });

    expect(result.targetDomain).toBe("finance");
    expect(result.financeStatus).toBe("stale");
    expect(result.underwritingStatus).toBe("stale");
  });

  it("routes seller credits and repair holdbacks as underwriting input proposals", () => {
    expect(classifyContractChangeTargetDomain({ proposalType: "seller_credit", normalizedValue: { sellerCredit: 7500 } })).toBe("underwriting_input");
    expect(classifyContractChangeTargetDomain({ proposalType: "repair_holdback", normalizedValue: { repairHoldbackAmount: 12000 } })).toBe("underwriting_input");
  });

  it("routes assignment consent except affiliates as a strategy requirement", () => {
    const result = buildContractChangePropagationResult({
      request: request({
        acceptedProposalId: "proposal-assignment",
        contractTermId: "term-assignment",
        proposalType: "assignment_consent_except_affiliates",
        normalizedValue: { consentRequired: true, affiliateException: true },
      }),
      generatedAt: "2026-08-26T12:00:00.000Z",
    });

    expect(result.targetDomain).toBe("strategy_requirement");
    expect(result.strategyStatus).toBe("stale");
  });

  it("keeps specific performance review as strategy/cockpit attention without legal conclusions", () => {
    const result = buildContractChangePropagationResult({
      request: request({
        acceptedProposalId: "proposal-specific-performance",
        contractTermId: "term-remedies",
        proposalType: "specific_performance_professional_review",
        normalizedValue: { professionalReviewRequired: true, remedyType: "specific_performance" },
      }),
      generatedAt: "2026-08-26T12:00:00.000Z",
    });

    expect(result.targetDomain).toBe("strategy_requirement");
    expect(JSON.stringify(result)).not.toMatch(/isEnforceable|legalConclusion|validityConclusion/);
  });

  it("preserves partial failure and retry state with prior valid references", () => {
    const result = buildContractChangePropagationResult({
      request: request({ acceptedProposalId: "proposal-failure" }),
      failures: [{ targetDomain: "underwriting_input", code: "UNDERWRITING_PROVIDER_FAILED", message: "Prior valid result preserved.", retryable: true, priorValidReference: "underwriting-result-7" }],
      priorValidReferences: ["strategy-ranking-5"],
      retryCount: 1,
      generatedAt: "2026-08-26T12:00:00.000Z",
    });

    expect(result.status).toBe("retrying");
    expect(result.underwritingStatus).toBe("failed_with_prior_valid");
    expect(result.priorValidReferences).toEqual(["strategy-ranking-5", "underwriting-result-7"]);
    expect(contractChangePropagationStateAfterFailure({ targetDomain: "underwriting_input", hasPriorValidResult: true })).toBe("failed_with_prior_valid");
  });

  it("requires current accepted, source-backed versions and rejects stale or raw-text propagation", () => {
    expect(() => request({ verificationState: "unverified" })).toThrow(/source-backed/);
    expect(() => request({ materiality: "expired" })).toThrow(/Expired/);
    expect(() => request({ normalizedValue: { rawDocumentText: "copy of private contract" } })).toThrow(/raw document text/);
    expect(() => request({ contractFindingId: "finding-v3", contractFindingVersion: undefined })).toThrow(/finding version/);
  });

  it("is deterministic for identical accepted source versions and changes when newer v3 source beats v2", () => {
    const v2 = buildContractChangePropagationResult({ request: request({ contractTermVersion: 2 }), generatedAt: "2026-08-26T12:00:00.000Z" });
    const v2Again = buildContractChangePropagationResult({ request: request({ contractTermVersion: 2 }), generatedAt: "2026-08-26T12:05:00.000Z" });
    const v3 = buildContractChangePropagationResult({ request: request({ contractTermVersion: 3 }), generatedAt: "2026-08-26T12:10:00.000Z" });

    expect(v2.deterministicRequestHash).toBe(v2Again.deterministicRequestHash);
    expect(v2.propagationId).toBe(v2Again.propagationId);
    expect(v3.deterministicRequestHash).not.toBe(v2.deterministicRequestHash);
    expect(v3.versionGraph.contractTermVersion).toBe(3);
  });
});

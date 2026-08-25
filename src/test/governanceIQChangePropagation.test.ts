import { describe, expect, it } from "vitest";
import {
  buildGovernanceChange,
  buildGovernancePropagationResult,
  governancePropagationStateAfterFailure,
  GOVERNANCEIQ_CHANGE_PROPAGATION_CONTRACT_VERSION,
  type GovernanceChangeBuildInput,
} from "../core/governanceIQ";

const acceptedAt = "2026-08-24T13:00:00.000Z";

function changeInput(overrides: Partial<GovernanceChangeBuildInput> = {}): GovernanceChangeBuildInput {
  return {
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    governanceRecordId: "governance-1",
    governanceFindingId: "finding-1",
    findingVersion: 1,
    acceptanceVersion: 2,
    acceptanceState: "accepted",
    category: "dues",
    normalizedValue: { amount: 450, frequency: "monthly", currency: "USD" },
    previousAcceptedValue: { amount: 400, frequency: "monthly", currency: "USD" },
    sourceEvidenceId: "evidence-1",
    sourceAnchor: { page: 8, table: "Budget" },
    verificationState: "confirmed",
    confidence: 91,
    effectiveAt: "2026-08-01T00:00:00.000Z",
    acceptedBy: "user-1",
    acceptedAt,
    triggeringEventId: "event-1",
    correlationId: "correlation-1",
    idempotencyKey: "event-1:governance-propagation",
    activeStrategyIds: ["residential.long_term_rental"],
    affectedStrategyUses: ["long_term_rental"],
    asOf: acceptedAt,
    ...overrides,
  };
}

describe("GovernanceIQ Slice 4 accepted change propagation", () => {
  it("routes accepted dues changes to underwriting and cockpit without mutating calculated results", () => {
    const change = buildGovernanceChange(changeInput());
    const result = buildGovernancePropagationResult({
      change,
      propagatedAt: acceptedAt,
      staleDownstreamResultIds: ["underwriting:snapshot-1"],
      priorValidDownstream: true,
    });

    expect(change).toMatchObject({
      contractVersion: GOVERNANCEIQ_CHANGE_PROPAGATION_CONTRACT_VERSION,
      materiality: "material",
      impactDomains: ["underwriting", "cockpit", "reporting"],
    });
    expect(result.downstreamStates.underwriting).toBe("stale");
    expect(result.downstreamStates.strategy).toBe("not_affected");
    expect(result.proposals).toContainEqual(expect.objectContaining({
      proposalType: "underwriting_input",
      targetField: "operating_expenses.hoa_dues",
      sourceFindingId: "finding-1",
    }));
    expect(result.versionGraph.downstreamProposalKeys).toContain("finding-1:v1:underwriting:operating_expenses.hoa_dues");
    expect(result.explanations).toContain("Accepted dues changed from 400 monthly to 450 monthly.");
    expect(result).not.toHaveProperty("noi");
    expect(result).not.toHaveProperty("capRate");
    expect(result).not.toHaveProperty("loanPayment");
  });

  it("disqualifies STR through strategy proposal while leaving underwriting untouched", () => {
    const change = buildGovernanceChange(changeInput({
      category: "short_term_rental",
      normalizedValue: { allowed: false, maximumLeaseDays: 30 },
      previousAcceptedValue: undefined,
      governanceFindingId: "finding-str",
      affectedStrategyUses: ["short_term_rental"],
    }));
    const result = buildGovernancePropagationResult({ change, propagatedAt: acceptedAt });

    expect(change.impactDomains).toEqual(["strategy", "cockpit", "reporting"]);
    expect(result.downstreamStates.strategy).toBe("stale");
    expect(result.downstreamStates.underwriting).toBe("not_affected");
    expect(result.proposals).toContainEqual(expect.objectContaining({
      proposalType: "strategy_constraint",
      targetField: "governance_rental_constraint",
      targetStrategyIds: ["residential.medium_term_rental", "residential.short_term_rental"],
    }));
  });

  it("keeps trailer restrictions targeted to dependent strategy/use only", () => {
    const unrelated = buildGovernanceChange(changeInput({
      category: "trailer",
      normalizedValue: { allowed: false },
      governanceFindingId: "finding-trailer",
      affectedStrategyUses: ["long_term_rental"],
    }));
    const dependent = buildGovernanceChange(changeInput({
      category: "trailer",
      normalizedValue: { allowed: false },
      governanceFindingId: "finding-trailer-2",
      affectedStrategyUses: ["rv_parking_dependent_use"],
    }));

    expect(unrelated.impactDomains).toEqual(["none"]);
    expect(dependent.impactDomains).toEqual(["strategy", "cockpit", "reporting"]);
  });

  it("turns architectural approval into a strategy condition and task proposal, not a hard disqualification", () => {
    const change = buildGovernanceChange(changeInput({
      category: "architectural_approval",
      normalizedValue: { approvalRequired: true, conditions: ["Board approval before exterior work."] },
      governanceFindingId: "finding-approval",
      affectedStrategyUses: ["renovation"],
    }));
    const result = buildGovernancePropagationResult({ change, propagatedAt: acceptedAt });

    expect(change.impactDomains).toEqual(["strategy", "cockpit", "task_deadline", "reporting"]);
    expect(result.proposals).toEqual(expect.arrayContaining([
      expect.objectContaining({ proposalType: "strategy_constraint", targetField: "governance_renovation_condition" }),
      expect.objectContaining({ proposalType: "task_proposal", targetField: "obtain_architectural_approval" }),
    ]));
    expect(result.proposals.map((proposal) => proposal.targetField)).not.toContain("hard_disqualifier");
  });

  it("routes adopted assessments to underwriting but proposed assessments to review only", () => {
    const adopted = buildGovernanceChange(changeInput({
      category: "assessment",
      normalizedValue: { amount: 8000, assessmentStatus: "ADOPTED", currency: "USD" },
      governanceFindingId: "finding-assessment-adopted",
    }));
    const proposed = buildGovernanceChange(changeInput({
      category: "assessment",
      normalizedValue: { amount: 8000, assessmentStatus: "PROPOSED", currency: "USD" },
      governanceFindingId: "finding-assessment-proposed",
    }));

    expect(adopted.impactDomains).toEqual(["underwriting", "cockpit", "reporting"]);
    expect(proposed.impactDomains).toEqual(["cockpit", "task_deadline", "reporting"]);
  });

  it("routes litigation to FinanceIQ condition proposal without inventing loan disqualification", () => {
    const change = buildGovernanceChange(changeInput({
      category: "litigation",
      normalizedValue: { present: true, descriptionCode: "pending_roof_litigation" },
      governanceFindingId: "finding-litigation",
    }));
    const result = buildGovernancePropagationResult({ change, propagatedAt: acceptedAt });

    expect(change.impactDomains).toEqual(["finance", "cockpit", "reporting"]);
    expect(result.proposals).toContainEqual(expect.objectContaining({
      proposalType: "finance_condition",
      targetField: "governance_litigation_review",
    }));
    expect(result).not.toHaveProperty("financingFeasibilityStatus");
  });

  it("blocks conflicted accepted rental findings from hard strategy mutation", () => {
    const change = buildGovernanceChange(changeInput({
      category: "rental",
      normalizedValue: { minimumLeaseMonths: 12 },
      governanceFindingId: "finding-conflict",
      verificationState: "conflicting",
      conflictState: "unresolved_conflict",
    }));
    const result = buildGovernancePropagationResult({ change, propagatedAt: acceptedAt });

    expect(change.materiality).toBe("uncertain");
    expect(result.downstreamStates.strategy).toBe("blocked");
    expect(result.proposals.find((proposal) => proposal.domain === "strategy")?.state).toBe("blocked");
    expect(result.explanations.join(" ")).toContain("routed for review");
  });

  it("keeps future-effective rules upcoming instead of current mutations", () => {
    const change = buildGovernanceChange(changeInput({
      category: "short_term_rental",
      normalizedValue: { allowed: false },
      governanceFindingId: "finding-future",
      effectiveAt: "2027-01-01T00:00:00.000Z",
      asOf: "2026-08-24T13:00:00.000Z",
    }));
    const result = buildGovernancePropagationResult({ change, propagatedAt: acceptedAt });

    expect(change.materiality).toBe("upcoming");
    expect(result.downstreamStates.strategy).toBe("queued");
    expect(result.explanations.join(" ")).toContain("future-effective");
  });

  it("dedupes repeated downstream proposal creation and links superseding dues versions", () => {
    const first = buildGovernanceChange(changeInput());
    const firstResult = buildGovernancePropagationResult({ change: first, propagatedAt: acceptedAt });
    const newer = buildGovernanceChange(changeInput({
      governanceFindingId: "finding-1",
      findingVersion: 2,
      acceptanceVersion: 3,
      normalizedValue: { amount: 475, frequency: "monthly", currency: "USD" },
      previousAcceptedValue: { amount: 450, frequency: "monthly", currency: "USD" },
      triggeringEventId: "event-2",
      idempotencyKey: "event-2:governance-propagation",
    }));
    const retry = buildGovernancePropagationResult({
      change: first,
      existingProposalKeys: firstResult.proposals.map((proposal) => proposal.proposalKey),
      propagatedAt: acceptedAt,
    });
    const newerResult = buildGovernancePropagationResult({ change: newer, propagatedAt: acceptedAt });

    expect(retry.proposals).toHaveLength(0);
    expect(firstResult.versionGraph.governanceFindingId).toBe(newerResult.versionGraph.governanceFindingId);
    expect(firstResult.versionGraph.findingVersion).toBe(1);
    expect(newerResult.versionGraph.findingVersion).toBe(2);
  });

  it("preserves prior valid downstream state on failure and supports retry state", () => {
    expect(governancePropagationStateAfterFailure({ domain: "underwriting", hasPriorValidResult: true })).toBe("failed_with_prior_valid");
    const change = buildGovernanceChange(changeInput());
    const failed = buildGovernancePropagationResult({
      change,
      propagatedAt: acceptedAt,
      priorValidDownstream: true,
      failures: [{ domain: "underwriting", code: "snapshot_failed", safeMessage: "Underwriting recalculation failed.", retryable: true }],
    });

    expect(failed.downstreamStates.underwriting).toBe("failed_with_prior_valid");
    expect(failed.priorValidDownstream).toBe(true);
    expect(failed.failures[0].retryable).toBe(true);
  });

  it("refuses proposed findings even when confidence is high", () => {
    expect(() => buildGovernanceChange(changeInput({
      acceptanceState: "proposed",
      confidence: 99,
    }))).toThrow(/explicitly accepted/);
  });
});

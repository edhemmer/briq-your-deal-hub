import { describe, expect, it } from "vitest";
import {
  applyPreliminaryAssumptionDecision,
  assertSpecification004Completion,
  createPreliminaryAssumptionProposals,
  finalIntakeStatuses,
  neverAssumeSubjects,
  preliminaryAssumptionClassifications,
  preliminaryAssumptionSubjects,
  reconcileSpecification004Intake,
  specification004CompletionEvent,
  type PreliminaryAssumptionEvidence,
  type PreliminaryAssumptionProposal,
} from "../core/intakeReconciliation";
import { completeManualFallback, createManualFallbackPlan } from "../core/manualFallback";
import { createManualIntakeDraft } from "../core/propertyIntake";
import type { SourceConflictResult } from "../core/sourceConflicts";
import type { ManualIntakeDraft } from "../core/types";

function completeDraft(): ManualIntakeDraft {
  return {
    ...createManualIntakeDraft(),
    id: "draft-intake",
    opportunityName: "101 Main St",
    address: "101 Main St",
    intendedStrategy: "owner_occupant",
    propertyType: "Single family",
    askingPrice: "300000",
  };
}

function evidence(subject: PreliminaryAssumptionEvidence["subject"], confidence = 84): PreliminaryAssumptionEvidence {
  return {
    evidenceId: `evidence-${subject}`,
    sourceRecordId: `source-${subject}`,
    sourceName: "Uploaded listing",
    subject,
    rawValue: subject === "estimated_units" ? 1 : "Single family",
    confidence,
    classification: "preliminary_assumption",
    verificationState: "unverified",
  };
}

function pendingProposal(): PreliminaryAssumptionProposal {
  return createPreliminaryAssumptionProposals({
    draft: { ...completeDraft(), propertyType: undefined },
    duplicateDetectionComplete: true,
    evidence: [evidence("property_type")],
  })[0];
}

describe("Specification 004 preliminary assumptions and final reconciliation", () => {
  it("exposes only approved subjects, classifications, final statuses, and completion event", () => {
    expect(preliminaryAssumptionSubjects).toEqual([
      "property_type",
      "occupancy",
      "construction_type",
      "building_use",
      "estimated_units",
      "approximate_square_footage",
      "estimated_year_built",
      "expected_strategy",
      "basic_land_use",
      "general_property_classification",
    ]);
    expect(preliminaryAssumptionClassifications).toEqual([
      "user_entered_fact",
      "verified_source",
      "preliminary_assumption",
      "descriptive_input",
      "unknown",
    ]);
    expect(finalIntakeStatuses).toEqual(["Ready for Analysis", "Needs Review", "Incomplete", "Blocked", "Cancelled"]);
    expect(specification004CompletionEvent).toBe("specification004.completed");
  });

  it("creates deterministic pending proposals only for unresolved supported subjects with evidence and enough confidence", () => {
    const proposals = createPreliminaryAssumptionProposals({
      draft: { ...completeDraft(), propertyType: undefined },
      duplicateDetectionComplete: true,
      evidence: [
        evidence("property_type", 80),
        evidence("estimated_units", 72),
        evidence("construction_type", 69),
        evidence("arv", 99),
      ],
    });

    expect(proposals.map((proposal) => proposal.subject)).toEqual(["estimated_units", "property_type"]);
    expect(proposals.every((proposal) => proposal.status === "pending")).toBe(true);
    expect(proposals.every((proposal) => proposal.classification === "preliminary_assumption")).toBe(true);
    expect(proposals.every((proposal) => proposal.evidenceId && proposal.sourceName)).toBe(true);
  });

  it("does not propose when accepted values, duplicate review, or blocking conflicts prevent safe use", () => {
    const conflict = {
      targetField: "property_type",
      materialityTier: "material",
      lifecycleState: "detected",
      downstreamSafety: { blocksAffectedFieldAcceptance: true, allowsDealCreation: true },
    } as SourceConflictResult;

    expect(createPreliminaryAssumptionProposals({
      draft: completeDraft(),
      duplicateDetectionComplete: true,
      evidence: [evidence("property_type", 90)],
    })).toEqual([]);
    expect(createPreliminaryAssumptionProposals({
      draft: { ...completeDraft(), propertyType: undefined },
      duplicateDetectionComplete: false,
      evidence: [evidence("property_type", 90)],
    })).toEqual([]);
    expect(createPreliminaryAssumptionProposals({
      draft: { ...completeDraft(), propertyType: undefined },
      duplicateDetectionComplete: true,
      conflicts: [conflict],
      evidence: [evidence("property_type", 90)],
    })).toEqual([]);
  });

  it("never assumes prohibited analytical, financial, legal, insurance, risk, or condition subjects", () => {
    const proposals = createPreliminaryAssumptionProposals({
      draft: completeDraft(),
      duplicateDetectionComplete: true,
      evidence: neverAssumeSubjects.map((subject) => evidence(subject, 100)),
    });

    expect(proposals).toEqual([]);
  });

  it("routes proposal decisions through review states without changing the draft", () => {
    const draft = { ...completeDraft(), propertyType: undefined };
    const proposal = createPreliminaryAssumptionProposals({ draft, duplicateDetectionComplete: true, evidence: [evidence("property_type")] })[0];

    expect(applyPreliminaryAssumptionDecision(proposal, "accept")).toMatchObject({ status: "accepted", normalizedValue: "Single family" });
    expect(applyPreliminaryAssumptionDecision(proposal, "accept_edit", "Townhouse")).toMatchObject({ status: "edited", normalizedValue: "Townhouse" });
    expect(applyPreliminaryAssumptionDecision(proposal, "reject")).toMatchObject({ status: "rejected" });
    expect(applyPreliminaryAssumptionDecision(proposal, "defer")).toMatchObject({ status: "deferred" });
    expect(draft.propertyType).toBeUndefined();
  });

  it("marks final reconciliation ready only when every Specification 004 gate passes", () => {
    const fallback = completeManualFallback(createManualFallbackPlan({ source: "manual_intake", draft: completeDraft() }));
    const result = reconcileSpecification004Intake({
      draft: completeDraft(),
      manualFallback: fallback,
      proposals: [applyPreliminaryAssumptionDecision(pendingProposal(), "accept")],
      conflicts: [],
      duplicateDetection: { complete: true, blocking: false },
      evidenceAttached: true,
      sourceRecordsPreserved: true,
      canonicalPropertyId: "property-1",
      canonicalDealId: "deal-1",
      intakeMethodsConverge: true,
      canonicalWorkflowsConverge: true,
      singleDealCreationPath: true,
      singlePropertyCreationPath: true,
      specification004RoadmapResolved: true,
    });

    expect(result.status).toBe("Ready for Analysis");
    expect(result.completionEvent).toBe(specification004CompletionEvent);
    expect(assertSpecification004Completion(result)).toBe(specification004CompletionEvent);
  });

  it("returns Needs Review, Incomplete, Blocked, and Cancelled without inventing statuses", () => {
    const base = {
      draft: completeDraft(),
      conflicts: [],
      duplicateDetection: { complete: true, blocking: false },
      evidenceAttached: true,
      sourceRecordsPreserved: true,
      canonicalPropertyId: "property-1",
      canonicalDealId: "deal-1",
      intakeMethodsConverge: true,
      canonicalWorkflowsConverge: true,
      singleDealCreationPath: true,
      singlePropertyCreationPath: true,
      specification004RoadmapResolved: true,
    };
    const blockedConflict = {
      targetField: "address",
      materialityTier: "blocking_identity",
      lifecycleState: "detected",
      downstreamSafety: { blocksAffectedFieldAcceptance: true, allowsDealCreation: false },
    } as SourceConflictResult;

    expect(reconcileSpecification004Intake({ ...base, proposals: [pendingProposal()] }).status).toBe("Needs Review");
    expect(reconcileSpecification004Intake({ ...base, draft: { ...completeDraft(), address: "" }, proposals: [] }).status).toBe("Incomplete");
    expect(reconcileSpecification004Intake({ ...base, proposals: [], conflicts: [blockedConflict] }).status).toBe("Blocked");
    expect(reconcileSpecification004Intake({ ...base, proposals: [], cancelled: true }).status).toBe("Cancelled");
  });
});

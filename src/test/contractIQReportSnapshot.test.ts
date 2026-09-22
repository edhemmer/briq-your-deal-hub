import { describe, expect, it } from "vitest";

import {
  CONTRACTIQ_REPORT_SNAPSHOT_VERSION,
  CONTRACTIQ_REPORT_SOURCE_GRAPH_VERSION,
  CONTRACTIQ_REPORT_TEMPLATE_CONTRACT_VERSION,
  assertContractIQReportSnapshot,
  contractIQReportEligibility,
  contractIQReportInclusion,
  contractIQReportSnapshotState,
  reconcileContractIQReportSnapshot,
  type ContractIQReportSnapshot,
  type ContractIQReportVersionVector,
} from "../core/contractIQ";

describe("ContractIQ 011A R1 shared report snapshot contract", () => {
  it("golden A reconciles one simple-purchase snapshot for every future output", () => {
    const vector = versionVector();
    expect(reconcileContractIQReportSnapshot(vector, { ...vector })).toBe("reconciled");
    expect(contractIQReportSnapshotState({ unresolvedQuestionCount: 0, unresolvedMaterialConflictCount: 0, professionalReviewCount: 0 })).toBe("current");

    const material = contractIQReportInclusion({ materiality: "material", evidenceClassification: "verified_fact" });
    expect(material).toMatchObject({ fullReport: true, summaryReport: true, questionsReport: false, excludedNonMaterial: false });

    const questions = contractIQReportInclusion({ materiality: "material", evidenceClassification: "open_question", question: true });
    expect(questions).toMatchObject({ fullReport: true, summaryReport: true, questionsReport: true });
  });

  it("golden B treats an amended contract version as a source-version change", () => {
    const frozen = versionVector();
    expect(reconcileContractIQReportSnapshot(frozen, { ...frozen, contractVersion: 8, evidenceSetHash: "evidence-v8" })).toBe("source_version_mismatch");
  });

  it("golden C preserves an unresolved material conflict in current state and summary inclusion", () => {
    expect(contractIQReportSnapshotState({ unresolvedQuestionCount: 0, unresolvedMaterialConflictCount: 1, professionalReviewCount: 1 })).toBe("current_with_conflicts");
    expect(contractIQReportInclusion({ materiality: "unknown", evidenceClassification: "supported_concern", unresolvedConflict: true }).summaryReport).toBe(true);
  });

  it("golden D preserves open questions without making them a report blocker", () => {
    expect(contractIQReportSnapshotState({ unresolvedQuestionCount: 3, unresolvedMaterialConflictCount: 0, professionalReviewCount: 0 })).toBe("current_with_open_questions");
    const eligibility = contractIQReportEligibility({
      reconciliationStatus: "reconciled",
      analysisState: "current",
      criticalSourceConflict: false,
      missingRequiredContract: false,
      incompleteMaterialSourceSet: false,
      openQuestionCount: 3,
    });
    expect(eligibility.fullReport.eligible).toBe(true);
    expect(eligibility.summaryReport.eligible).toBe(true);
    expect(eligibility.questionsReport.eligible).toBe(true);
    expect(eligibility.openQuestionsAreDisclosureNotBlocker).toBe(true);
  });

  it("golden E reports each material version mismatch deterministically", () => {
    const frozen = versionVector();
    expect(reconcileContractIQReportSnapshot(frozen, { ...frozen, questionRegistryVersion: "questions-v2" })).toBe("question_version_mismatch");
    expect(reconcileContractIQReportSnapshot(frozen, { ...frozen, deadlineSetVersion: "deadlines-v2" })).toBe("deadline_version_mismatch");
    expect(reconcileContractIQReportSnapshot(frozen, { ...frozen, conflictSetVersion: "conflicts-v2" })).toBe("conflict_version_mismatch");
    expect(reconcileContractIQReportSnapshot(frozen, { ...frozen, authorizedSourceCount: 2, totalSourceCount: 3 })).toBe("unauthorized_source");
    expect(reconcileContractIQReportSnapshot(frozen, { ...frozen, materialContextComplete: false })).toBe("incomplete_material_context");
  });

  it("blocks every future output when the frozen snapshot is unreconciled", () => {
    const eligibility = contractIQReportEligibility({
      reconciliationStatus: "source_version_mismatch",
      analysisState: "current",
      criticalSourceConflict: false,
      missingRequiredContract: false,
      incompleteMaterialSourceSet: false,
      openQuestionCount: 0,
    });
    expect(eligibility.fullReport).toEqual({ eligible: false, blockingReasons: ["snapshot_source_version_mismatch"] });
    expect(eligibility.summaryReport.eligible).toBe(false);
    expect(eligibility.questionsReport.eligible).toBe(false);
  });

  it("validates identity and version-graph alignment on the strict snapshot", () => {
    const snapshot = snapshotFixture();
    expect(assertContractIQReportSnapshot(snapshot)).toBe(snapshot);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(() => assertContractIQReportSnapshot({ ...snapshot, contractVersion: 9 })).toThrow(/version graph/i);
  });

  it("rejects invalid counters and keeps non-material records out of decision sections", () => {
    expect(() => contractIQReportSnapshotState({ unresolvedQuestionCount: -1, unresolvedMaterialConflictCount: 0, professionalReviewCount: 0 })).toThrow(/non-negative integer/i);
    expect(contractIQReportInclusion({ materiality: "immaterial", evidenceClassification: "verified_fact" })).toEqual({
      fullReport: false,
      summaryReport: false,
      questionsReport: false,
      professionalOnly: false,
      optionalAppendix: false,
      excludedNonMaterial: true,
    });
  });
});

function versionVector(): ContractIQReportVersionVector {
  return {
    contractVersion: 7,
    analysisId: "analysis-7",
    analysisVersion: 2,
    analysisIsCurrent: true,
    evidenceSetHash: "evidence-v7",
    questionRegistryVersion: "questions-v1",
    deadlineSetVersion: "deadlines-v1",
    conflictSetVersion: "conflicts-v1",
    authorizedSourceCount: 3,
    totalSourceCount: 3,
    materialContextComplete: true,
  };
}

function snapshotFixture(): ContractIQReportSnapshot {
  const graph = {
    graphContractVersion: CONTRACTIQ_REPORT_SOURCE_GRAPH_VERSION,
    contract: { id: "contract-1", version: 7 },
    analysis: { id: "analysis-7", version: 2, deterministicHash: "analysis-hash" },
    evidenceSetHash: "evidence-hash",
    questionRegistryVersion: "question-hash",
    deadlineSetVersion: "deadline-hash",
    conflictSetVersion: "conflict-hash",
    sourceDocumentCutoffAt: "2026-09-21T12:00:00.000Z",
  } as const;
  const eligibility = contractIQReportEligibility({ reconciliationStatus: "reconciled", analysisState: "current", criticalSourceConflict: false, missingRequiredContract: false, incompleteMaterialSourceSet: false, openQuestionCount: 0 });
  return {
    snapshotId: "snapshot-1",
    snapshotVersion: 1,
    snapshotContractVersion: CONTRACTIQ_REPORT_SNAPSHOT_VERSION,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    contractId: "contract-1",
    contractVersion: 7,
    perspective: "buyer",
    analysisId: "analysis-7",
    analysisVersion: 2,
    analysisContractVersion: "contractiq-perspective-analysis-v1",
    analysisStatus: "current",
    analysisGeneratedAt: "2026-09-21T12:00:00.000Z",
    analysisEffectiveAt: "2026-09-21T12:00:00.000Z",
    sourceDocumentCutoffAt: "2026-09-21T12:00:00.000Z",
    sourceVersionGraph: graph,
    sourceVersionGraphHash: "graph-hash",
    contentHash: "content-hash",
    state: "current",
    reconciliationStatus: "reconciled",
    reportEligibility: eligibility,
    payload: {
      identity: { workspaceId: "workspace-1", dealId: "deal-1", propertyId: "property-1", contractId: "contract-1", contractVersion: 7, perspective: "buyer" },
      analysis: { analysisId: "analysis-7", analysisVersion: 2, analysisContractVersion: "contractiq-perspective-analysis-v1", analysisStatus: "current", generatedAt: "2026-09-21T12:00:00.000Z", effectiveAt: "2026-09-21T12:00:00.000Z" },
      sourceCutoff: graph,
      documentInventory: [], evidenceInventory: [], partiesProperty: {}, economicTerms: [], contingenciesRightsObligations: [], deadlines: [], findings: [], conflicts: [], questions: [], openItems: [], amendmentImpacts: [], crossModuleContext: [],
      ownershipExposure: { status: "canonical_inputs_only" }, externalResearch: [],
      recommendation: { rationaleReferences: [], conditions: [], unresolvedBlockers: [], materialityState: "reconciled" },
      reportMetadata: { templateContractVersion: CONTRACTIQ_REPORT_TEMPLATE_CONTRACT_VERSION, snapshotContractVersion: CONTRACTIQ_REPORT_SNAPSHOT_VERSION, professionalReviewState: "not_required" },
    },
    generatedAt: "2026-09-21T12:00:00.000Z",
    createdBy: "user-1",
  };
}

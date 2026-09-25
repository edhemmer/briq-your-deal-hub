import { describe, expect, it } from "vitest";
import {
  CONTRACTIQ_QUESTIONS_REPORT_DEFINITION_VERSION,
  CONTRACTIQ_QUESTIONS_REPORT_TEMPLATE_VERSION,
  validateContractIQQuestionsReportDefinition,
  type ContractIQBuyerSummaryReportDefinition,
  type ContractIQFullDueDiligenceReportDefinition,
  type ContractIQQuestionsReportDefinition,
  type ContractIQReportSnapshot,
} from "../core/contractIQ";

const question = {
  questionId: "q-1", questionVersion: 2, wording: "Will the lender confirm financing?",
  targetRole: "lender" as const, displayRole: "lender" as const,
  priority: "high" as const, status: "answered" as const,
  resolutionState: "response_received_unverified" as const,
  responseState: "received" as const, response: null, responseVerificationState: "unverified",
  rationale: "Commitment remains open.", whyThisMatters: "Closing requires financing.",
  professionalReviewRequired: true, category: "financing" as const, semanticKey: "financing:commitment",
  reportInclusion: { standaloneQuestionsReport: true, roleExport: true },
  sourceRefs: [{ recordType: "question" as const, recordId: "q-1", recordVersion: 2,
    verificationState: "answered", evidenceId: "e-1" }],
  requestedEvidenceIds: ["e-1"], relevantDeadlineIds: ["deadline-1"], historical: false,
};
const snapshot = {
  snapshotId: "s-1", snapshotVersion: 1, workspaceId: "w-1", dealId: "d-1", propertyId: "p-1",
  contractId: "c-1", perspective: "buyer", contentHash: "a".repeat(64), analysisVersion: 1,
  sourceDocumentCutoffAt: "2026-09-25T00:00:00Z", state: "current_with_open_questions",
  sourceVersionGraph: { questionRegistryVersion: "b".repeat(64) },
  payload: { questions: [{ questionId: "q-1", version: 2, wording: question.wording,
    recipientRole: "lender", priority: "high", status: "answered",
    resolutionState: "response_received_unverified", response: "Financing terms received." }] },
} as unknown as ContractIQReportSnapshot;
const full = {
  reportDefinitionId: "f-1", snapshotId: "s-1", snapshotHash: "a".repeat(64), reportState: "current",
  questionReferences: [{ questionId: "q-1", questionVersion: 2, wording: question.wording,
    targetRole: "lender", priority: "high", status: "answered", resolutionState: "response_received_unverified" }],
} as unknown as ContractIQFullDueDiligenceReportDefinition;
const summary = {
  snapshotId: "s-1", fullReportDefinitionId: "f-1",
  definitionPayload: { materialQuestions: [{ questionId: "q-1", questionVersion: 2, wording: question.wording,
    targetRole: "lender", priority: "high", status: "answered", resolutionState: "response_received_unverified" }] },
} as unknown as ContractIQBuyerSummaryReportDefinition;
const definition: ContractIQQuestionsReportDefinition = {
  reportDefinitionId: "r-1", reportDefinitionVersion: 1,
  definitionContractVersion: CONTRACTIQ_QUESTIONS_REPORT_DEFINITION_VERSION,
  templateVersion: CONTRACTIQ_QUESTIONS_REPORT_TEMPLATE_VERSION,
  workspaceId: "w-1", dealId: "d-1", propertyId: "p-1", contractId: "c-1", perspective: "buyer",
  snapshotId: "s-1", snapshotVersion: 1, snapshotHash: "a".repeat(64),
  questionSetVersion: "b".repeat(64), analysisVersion: 1,
  reportMode: "selected_role", selectedRole: "lender",
  filterRules: { includedStatuses: [], includedPriorities: [], unresolvedOnly: false,
    professionalReviewOnly: false, includeHistorical: false },
  canonicalQuestionRefs: [question], groupedQuestions: [{ role: "lender", questions: [question] }],
  counts: { totalCurrentQuestions: 1, historicalQuestionCount: 0, unresolved: 1, answeredQuestionCount: 1,
    resolvedQuestionCount: 0, professionalReviewCount: 1, roleCounts: { lender: 1 } },
  contentScope: { intendedRecipientRole: "lender", contentScope: "canonical_target_role_questions_only",
    sourceVisibilityLevel: "references_only", responseVisibilityLevel: "state_only",
    professionalOnlyContentIncluded: false, privateBuyerNotesExcluded: true },
  sourceCutoffAt: "2026-09-25T00:00:00Z", contentHash: "c".repeat(64),
  deterministicDefinitionHash: "d".repeat(64), reportState: "current_with_open_questions",
  reconciliationState: "reconciled", isCurrent: true, generatedAt: "2026-09-25T00:01:00Z",
};

describe("ContractIQ Questions Report definition", () => {
  it("reconciles an exact selected-role reference without exposing response text", () => {
    expect(validateContractIQQuestionsReportDefinition(definition, snapshot, full, summary))
      .toEqual({ eligible: true, errors: [] });
  });

  it("rejects foreign role and duplicate canonical identity", () => {
    expect(validateContractIQQuestionsReportDefinition({ ...definition, selectedRole: "buyer_attorney" }, snapshot, full, summary).errors)
      .toContain("role_filter_violation:q-1");
    const duplicate = { ...definition, canonicalQuestionRefs: [question, question] };
    expect(validateContractIQQuestionsReportDefinition(duplicate, snapshot, full, summary).errors)
      .toContain("duplicate_questions_report_question:q-1");
  });

  it("accepts only an explicit canonical shared role", () => {
    const shared = { ...question, reportInclusion: { ...question.reportInclusion, roleExportRoles: ["buyer_attorney" as const] } };
    const exportDefinition = { ...definition, selectedRole: "buyer_attorney" as const,
      canonicalQuestionRefs: [shared], groupedQuestions: [{ role: "buyer_attorney" as const, questions: [shared] }] };
    expect(validateContractIQQuestionsReportDefinition(exportDefinition, snapshot, full, summary).eligible).toBe(true);
  });

  it("keeps current and historical counts distinct", () => {
    expect(validateContractIQQuestionsReportDefinition({ ...definition,
      counts: { ...definition.counts, totalCurrentQuestions: 0, historicalQuestionCount: 1 } },
    snapshot, full, summary).errors).toContain("questions_report_count_mismatch");
  });

  it("rejects R1, R3, R4, and response drift", () => {
    expect(validateContractIQQuestionsReportDefinition({ ...definition, questionSetVersion: "e".repeat(64) }, snapshot, full, summary).errors)
      .toContain("questions_report_snapshot_mismatch");
    expect(validateContractIQQuestionsReportDefinition(definition, snapshot,
      { ...full, questionReferences: [{ ...full.questionReferences[0], wording: "Changed" }] }, summary).errors)
      .toContain("full_question_mismatch:q-1");
    expect(validateContractIQQuestionsReportDefinition(definition, snapshot, full,
      { ...summary, definitionPayload: { materialQuestions: [{ questionId: "q-1", questionVersion: 2,
        wording: "Changed", targetRole: "lender", priority: "high", status: "answered",
        resolutionState: "response_received_unverified" }] } }).errors)
      .toContain("summary_question_mismatch:q-1");
    expect(validateContractIQQuestionsReportDefinition({ ...definition,
      canonicalQuestionRefs: [{ ...question, response: "Private response" }] }, snapshot, full, summary).errors)
      .toContain("role_export_private_content_violation");
  });
});

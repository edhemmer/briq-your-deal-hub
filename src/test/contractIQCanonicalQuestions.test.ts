import { describe, expect, it } from "vitest";
import {
  assertCanonicalQuestion,
  CONTRACTIQ_QUESTION_CATEGORIES,
  CONTRACTIQ_QUESTION_RESPONSE_SOURCES,
  CONTRACTIQ_QUESTION_TARGET_ROLES,
  contractIQQuestionOrder,
  type ContractIQCanonicalQuestion,
} from "../core/contractIQ";

const baseQuestion: ContractIQCanonicalQuestion = {
  questionId: "question-1", version: 1, workspaceId: "workspace-1", dealId: "deal-1", propertyId: "property-1",
  contractId: "contract-1", contractVersion: 2, perspective: "buyer",
  question: "Has the lender issued the required loan commitment?", rationale: "The financing contingency requires commitment evidence.",
  whyItMatters: "An unverified commitment can leave financing unresolved.", priority: "high", category: "financing", targetRole: "lender",
  semanticKey: "financing:loan-commitment", deterministicKey: "a".repeat(64), status: "open", resolutionState: "unresolved",
  professionalReviewRequired: false, reportInclusion: { fullReport: true, summaryReport: true, standaloneQuestionsReport: true, roleExport: true },
  sourceEvidenceIds: ["evidence-1"], sourceAnchors: [{ kind: "clause", label: "Financing contingency" }], responses: [],
  contentHash: "b".repeat(64), createdAt: "2026-09-22T00:00:00.000Z", updatedAt: "2026-09-22T00:00:00.000Z",
};

describe("ContractIQ canonical questions", () => {
  it("supports the governed categories, roles, and response sources", () => {
    expect(CONTRACTIQ_QUESTION_CATEGORIES).toContain("legal_review");
    expect(CONTRACTIQ_QUESTION_TARGET_ROLES).toEqual(expect.arrayContaining(["buyer_attorney", "title_company", "lender", "hoa", "solar_provider"]));
    expect(CONTRACTIQ_QUESTION_RESPONSE_SOURCES).toEqual(expect.arrayContaining(["professional", "document", "external_official_source"]));
  });

  it("accepts a fully source-linked canonical question", () => {
    expect(assertCanonicalQuestion(baseQuestion)).toBe(baseQuestion);
  });

  it("rejects malformed deterministic identity", () => {
    expect(() => assertCanonicalQuestion({ ...baseQuestion, deterministicKey: "wording-only" })).toThrow(/hashes/i);
  });

  it("orders critical unresolved work before resolved informational work", () => {
    const critical = contractIQQuestionOrder({ ...baseQuestion, priority: "critical" });
    const resolved = contractIQQuestionOrder({ ...baseQuestion, status: "resolved", priority: "informational" });
    expect(critical.localeCompare(resolved)).toBeLessThan(0);
  });

  it("does not use question wording in the stable ordering key", () => {
    const differentlyWorded = { ...baseQuestion, question: "Different wording" };
    expect(contractIQQuestionOrder(baseQuestion)).toBe(contractIQQuestionOrder(differentlyWorded));
  });
});

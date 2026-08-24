import { describe, expect, it } from "vitest";
import {
  GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION,
  GOVERNANCEIQ_EXTRACTION_CONTRACT_VERSION,
  classifyGovernanceDocument,
  detectGovernanceFindingConflicts,
  proposeGovernanceHierarchyCandidate,
  validateGovernanceExtractionCandidate,
  type GovernanceExtractionCandidate,
} from "../core/governanceIQ";
import { classificationForEvidenceFile } from "../core/sourceClassification";

const baseCandidate: GovernanceExtractionCandidate = {
  contractVersion: GOVERNANCEIQ_EXTRACTION_CONTRACT_VERSION,
  governanceRecordId: "record-1",
  governanceDocumentId: "document-1",
  evidenceId: "evidence-1",
  extractionType: "restriction",
  findingCategory: "trailer",
  normalizedValue: {
    allowed: false,
    exception: "Temporary loading and unloading is allowed.",
  },
  normalizedRequirement: "prohibited_except_loading",
  sourceClassification: "document_extracted",
  verificationState: "document_extracted",
  confidence: 78,
  sourceEvidenceId: "evidence-1",
  sourceAnchor: { page: 12, section: "Vehicles", clause: "7.4" },
  warnings: [],
  providerMetadata: {
    providerId: "deterministic_fixture",
    method: "deterministic_fixture",
  },
};

describe("GovernanceIQ Slice 2 document analysis contract", () => {
  it("does not classify a misleading filename without content evidence", () => {
    const result = classifyGovernanceDocument({
      filename: "HOA Rules Final.pdf",
      sourceAnchor: { page: 1 },
    });

    expect(result.contractVersion).toBe(GOVERNANCEIQ_DOCUMENT_ANALYSIS_CONTRACT_VERSION);
    expect(result.classificationState).toBe("insufficient_content");
    expect(result.proposedDocumentType).toBeUndefined();
    expect(result.warnings).toContain("Filename alone is not authoritative for GovernanceIQ classification.");
  });

  it("classifies source-backed declaration, amendment, budget, reserve study, minutes, and assessment text", () => {
    expect(classifyGovernanceDocument({ extractedText: "Declaration of Covenants Conditions and Restrictions", sourceAnchor: { page: 1 } }).proposedDocumentType).toBe("declaration_ccrs");
    expect(classifyGovernanceDocument({ extractedText: "This First Amendment is hereby amended and deleted and replaced", sourceAnchor: { page: 2 } }).proposedDocumentType).toBe("amendment");
    expect(classifyGovernanceDocument({ extractedText: "Annual budgeted revenue and budgeted expenses", sourceAnchor: { page: 3, table: "Budget" } }).proposedDocumentType).toBe("budget");
    expect(classifyGovernanceDocument({ extractedText: "Reserve study with component reserve balance", sourceAnchor: { page: 4 } }).proposedDocumentType).toBe("reserve_study");
    expect(classifyGovernanceDocument({ extractedText: "Minutes of the board meeting", sourceAnchor: { meetingDate: "2026-01-15" } }).proposedDocumentType).toBe("meeting_minutes");
    expect(classifyGovernanceDocument({ extractedText: "Special assessment notice adopted by the board", sourceAnchor: { page: 5 } }).proposedDocumentType).toBe("assessment_notice");
  });

  it("marks ambiguous and failed classifications without erasing prior valid output", () => {
    const ambiguous = classifyGovernanceDocument({
      extractedText: "Annual budget and reserve study",
      sourceAnchor: { page: 1 },
    });
    const failed = classifyGovernanceDocument({ providerFailed: true, sourceAnchor: { page: 1 } });

    expect(ambiguous.classificationState).toBe("classification_conflict");
    expect(ambiguous.ambiguityCandidates).toContain("reserve_study");
    expect(failed.classificationState).toBe("provider_failed");
    expect(failed.warnings[0]).toMatch(/prior valid classification must be preserved/i);
  });

  it("keeps newest-upload and date-only hierarchy evidence uncertain", () => {
    const newestUpload = proposeGovernanceHierarchyCandidate({
      documentType: "rules_regulations",
      documentUploadedAt: "2026-08-24T10:00:00.000Z",
      documentEffectiveAt: "2026-01-01T00:00:00.000Z",
    });
    const explicitAmendment = proposeGovernanceHierarchyCandidate({
      documentType: "amendment",
      explicitRelationshipType: "supersedes",
      sourceAnchor: { page: 2, amendmentSection: "Section 7.2" },
      relationshipIds: ["relationship-1"],
    });

    expect(newestUpload.hierarchyState).toBe("hierarchy_uncertain");
    expect(newestUpload.reasoningCode).toBe("date_without_explicit_supersession_not_controlling");
    expect(explicitAmendment.hierarchyState).toBe("candidate_current");
    expect(explicitAmendment.reasoningCode).toBe("explicit_source_relationship");
  });

  it("validates source-linked extraction and preserves negation exceptions", () => {
    const validated = validateGovernanceExtractionCandidate(baseCandidate);

    expect(validated.normalizedValue).toMatchObject({
      allowed: false,
      exception: "Temporary loading and unloading is allowed.",
    });
    expect(() => validateGovernanceExtractionCandidate({ ...baseCandidate, sourceAnchor: {} })).toThrow("SOURCE_ANCHOR_INCOMPLETE");
    expect(() => validateGovernanceExtractionCandidate({ ...baseCandidate, normalizedValue: { legalConclusion: true } })).toThrow(
      "GovernanceIQ Slice 1 cannot accept downstream or legal-conclusion field: legalConclusion",
    );
  });

  it("preserves financial period and unit safety without silent conversion", () => {
    const monthlyDues = validateGovernanceExtractionCandidate({
      ...baseCandidate,
      extractionType: "financial_input",
      findingCategory: "dues",
      normalizedValue: {
        amount: 450,
        currency: "USD",
        period: "monthly",
        unitScope: "per_unit",
        amountType: "actual",
      },
      normalizedRequirement: undefined,
      sourceAnchor: { page: 8, table: "Resale certificate", row: "Current dues" },
    });

    expect(monthlyDues.normalizedValue.period).toBe("monthly");
    expect(monthlyDues.normalizedValue).not.toHaveProperty("annualizedAmount");
  });

  it("detects deterministic restriction and financial conflicts without selecting a legal winner", () => {
    const allowed: GovernanceExtractionCandidate = {
      ...baseCandidate,
      findingCategory: "rental",
      normalizedValue: { allowed: true, minimumLeaseMonths: 12 },
      sourceAnchor: { page: 10, section: "Leasing" },
      confidence: 81,
    };
    const prohibited: GovernanceExtractionCandidate = {
      ...baseCandidate,
      governanceDocumentId: "document-2",
      findingCategory: "rental",
      normalizedValue: { allowed: false },
      sourceAnchor: { page: 4, section: "Rules" },
      confidence: 79,
    };
    const budget: GovernanceExtractionCandidate = {
      ...baseCandidate,
      extractionType: "financial_input",
      findingCategory: "dues",
      normalizedValue: { amount: 4800, currency: "USD", period: "annual" },
      sourceAnchor: { page: 3, table: "Budget", row: "Annual dues" },
    };
    const resale: GovernanceExtractionCandidate = {
      ...baseCandidate,
      extractionType: "financial_input",
      governanceDocumentId: "document-3",
      findingCategory: "dues",
      normalizedValue: { amount: 450, currency: "USD", period: "monthly" },
      sourceAnchor: { page: 1, table: "Resale certificate", row: "Current dues" },
    };

    const conflicts = detectGovernanceFindingConflicts([allowed, prohibited, budget, resale]);

    expect(conflicts).toHaveLength(2);
    expect(conflicts.map((conflict) => conflict.conflictType)).toEqual(["restriction_conflict", "financial_conflict"]);
    expect(conflicts.every((conflict) => conflict.professionalReviewRecommended)).toBe(true);
    expect(conflicts[0]).not.toHaveProperty("winner");
  });

  it("routes governance evidence into GovernanceIQ extraction eligibility", () => {
    const ccr = classificationForEvidenceFile({ originalFilename: "community-ccrs.pdf", detectedMimeType: "application/pdf" });
    const reserve = classificationForEvidenceFile({ originalFilename: "2026 reserve study.pdf", detectedMimeType: "application/pdf" });

    expect(ccr.supportedDownstreamModules).toContain("governanceiq");
    expect(reserve.supportedDownstreamModules).toContain("governanceiq");
  });
});

import { describe, expect, it } from "vitest";
import {
  GOVERNANCEIQ_ALLOWED_SOURCE_ANCHOR_KEYS,
  GOVERNANCEIQ_FORBIDDEN_DOWNSTREAM_MUTATION_FIELDS,
  GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION,
  GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION,
  GOVERNANCE_DOCUMENT_TYPES,
  GOVERNANCE_FINDING_CATEGORIES,
  GOVERNANCE_RECORD_STATUSES,
  GOVERNANCE_TYPES,
  assertGovernanceIQFoundationIsProposalOnly,
  normalizeGovernanceSourceAnchor,
  type GovernanceDocument,
  type GovernanceFinding,
  type GovernanceProjection,
  type GovernanceRecord,
} from "../core/governanceIQ";

describe("GovernanceIQ Slice 1 canonical contract", () => {
  it("defines stable private-governance vocabulary for the foundation", () => {
    expect(GOVERNANCE_TYPES).toContain("homeowners_association");
    expect(GOVERNANCE_TYPES).toContain("private_road_maintenance");
    expect(GOVERNANCE_TYPES).toContain("shared_well");
    expect(GOVERNANCE_TYPES).not.toContain("public_zoning_district");

    expect(GOVERNANCE_RECORD_STATUSES).toEqual(
      expect.arrayContaining(["documents_received", "current_with_conflicts", "failed_with_prior_analysis"]),
    );
    expect(GOVERNANCE_DOCUMENT_TYPES).toEqual(
      expect.arrayContaining(["declaration_ccrs", "reserve_study", "right_of_first_refusal"]),
    );
    expect(GOVERNANCE_FINDING_CATEGORIES).toEqual(
      expect.arrayContaining(["short_term_rental", "pickup_truck", "architectural_approval", "governance_financing_risk"]),
    );
  });

  it("keeps records, documents, findings, and projections source-linked and non-legal", () => {
    const record: GovernanceRecord = {
      contractVersion: GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION,
      governanceRecordId: "governance-1",
      governanceRecordVersion: 1,
      workspaceId: "workspace-1",
      dealId: "deal-1",
      propertyId: "property-1",
      governanceType: "condominium_association",
      name: "Sample Condo Association",
      status: "documents_received",
      sourceClassification: "association_provided",
      verificationState: "unverified",
      confidence: 70,
      sourceEvidenceId: "evidence-1",
      sourceAnchor: { page: 2, section: "Assessments" },
      updatedAt: "2026-08-23T21:00:00.000Z",
    };

    const document: GovernanceDocument = {
      contractVersion: GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION,
      governanceDocumentId: "document-1",
      governanceDocumentVersion: 1,
      workspaceId: record.workspaceId,
      governanceRecordId: record.governanceRecordId,
      evidenceId: "evidence-1",
      documentType: "declaration_ccrs",
      title: "Declaration",
      hierarchyClassification: "hierarchy_uncertain",
      analysisState: "awaiting_verification",
      sourceClassification: "document_extracted",
      verificationState: "document_extracted",
      confidence: 64,
    };

    const finding: GovernanceFinding = {
      contractVersion: GOVERNANCEIQ_FOUNDATION_CONTRACT_VERSION,
      governanceFindingId: "finding-1",
      governanceFindingVersion: 1,
      workspaceId: record.workspaceId,
      governanceRecordId: record.governanceRecordId,
      governanceDocumentId: document.governanceDocumentId,
      findingType: "restriction",
      findingCategory: "parking",
      summary: "Overnight street parking may require approval.",
      normalizedValue: { approvalRequired: true },
      severity: "moderate",
      impactType: "parking",
      acceptanceState: "proposed",
      professionalReviewRecommended: true,
      sourceClassification: "document_extracted",
      verificationState: "document_extracted",
      confidence: 62,
      sourceAnchor: { pageNumber: 14, clause: "7.4" },
    };

    const projection: GovernanceProjection = {
      contractVersion: GOVERNANCEIQ_PROJECTION_CONTRACT_VERSION,
      governanceRecordId: record.governanceRecordId,
      governanceRecordVersion: record.governanceRecordVersion,
      workspaceId: record.workspaceId,
      dealId: record.dealId,
      propertyId: record.propertyId,
      name: record.name,
      governanceType: record.governanceType,
      status: "current_with_conflicts",
      projectionState: "current_with_conflicts",
      documentCount: 1,
      findingCount: 1,
      unresolvedConflictCount: 1,
      acceptedFindingCount: 0,
      highSeverityFindingCount: 0,
      professionalReviewRequired: true,
      sourceCompleteness: "source_linked",
      verificationSummary: { unverifiedFindingCount: 1 },
      updatedAt: record.updatedAt,
      loadedAt: "2026-08-23T21:00:01.000Z",
    };

    expect(record.contractVersion).toBe("governanceiq-foundation-v1");
    expect(document.evidenceId).toBe("evidence-1");
    expect(finding.acceptanceState).toBe("proposed");
    expect(projection.contractVersion).toBe("governanceiq-projection-v1");
    expect(projection).not.toHaveProperty("dealRecommendation");
    expect(projection).not.toHaveProperty("reserveAdequacyConclusion");
  });

  it("normalizes source anchors without raw document content", () => {
    const anchor = normalizeGovernanceSourceAnchor({
      page: 4,
      clause: "11.2",
      budgetLine: "Insurance",
      ignored: "nope",
    });

    expect(anchor).toEqual({ page: 4, clause: "11.2", budgetLine: "Insurance" });
    expect(GOVERNANCEIQ_ALLOWED_SOURCE_ANCHOR_KEYS).toContain("amendmentSection");
    expect(() => normalizeGovernanceSourceAnchor({ rawDocumentText: "private text" })).toThrow(
      "GovernanceIQ source anchors cannot store raw document content: rawDocumentText",
    );
  });

  it("rejects downstream mutations and legal conclusions at the Slice 1 boundary", () => {
    expect(() => assertGovernanceIQFoundationIsProposalOnly({ summary: "Review needed" })).not.toThrow();
    for (const field of GOVERNANCEIQ_FORBIDDEN_DOWNSTREAM_MUTATION_FIELDS) {
      expect(() => assertGovernanceIQFoundationIsProposalOnly({ [field]: true })).toThrow(
        `GovernanceIQ Slice 1 cannot accept downstream or legal-conclusion field: ${field}`,
      );
    }
  });
});

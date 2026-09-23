import { describe, expect, it } from "vitest";
import {
  CONTRACTIQ_BUYER_SUMMARY_DEFINITION_VERSION,
  CONTRACTIQ_BUYER_SUMMARY_SECTION_CATALOG,
  CONTRACTIQ_BUYER_SUMMARY_TEMPLATE_VERSION,
  CONTRACTIQ_FULL_REPORT_DEFINITION_VERSION,
  CONTRACTIQ_FULL_REPORT_TEMPLATE_VERSION,
  validateContractIQBuyerSummaryDefinition,
  type ContractIQBuyerSummaryReportDefinition,
  type ContractIQFullDueDiligenceReportDefinition,
} from "../core/contractIQ";

const section = {
  sectionId: "economic-terms", canonicalTitle: "Contract Terms and Economics", orderingKey: 50,
  state: "included" as const, materiality: "material" as const, itemIds: ["term:price"],
  itemReferences: [{ itemId: "term:price", materiality: "material" }], questionIds: [],
  sourceRefs: [{ recordType: "term" as const, recordId: "price", recordVersion: 1,
    verificationState: "verified", evidenceId: "evidence-1" }],
  anchor: "economic-terms", crossReferenceIds: [],
};
const full: ContractIQFullDueDiligenceReportDefinition = {
  reportDefinitionId: "full-1", reportDefinitionVersion: 2,
  definitionContractVersion: CONTRACTIQ_FULL_REPORT_DEFINITION_VERSION,
  templateContractVersion: CONTRACTIQ_FULL_REPORT_TEMPLATE_VERSION,
  snapshotId: "snapshot-1", snapshotVersion: 2, snapshotHash: "a".repeat(64),
  workspaceId: "workspace-1", dealId: "deal-1", propertyId: "property-1", contractId: "contract-1",
  perspective: "buyer", analysisVersion: 3, reportState: "current", snapshotState: "current",
  reconciliationState: "reconciled", recommendationState: "Proceed with Conditions",
  sourceCutoffAt: "2026-09-23T00:00:00Z", generatedAt: "2026-09-23T00:01:00Z",
  title: "Full Due Diligence Report", executiveOverview: {}, sectionDefinitions: [section],
  sectionOrdering: ["economic-terms"], materialityRules: {}, sourceReferenceRules: {},
  questionReferences: [], openItemReferences: [], recommendationReferences: ["term:price"], appendixDefinitions: [],
  contentHash: "b".repeat(64), deterministicDefinitionHash: "c".repeat(64),
  validation: { eligible: true, errors: [] },
};
const summary: ContractIQBuyerSummaryReportDefinition = {
  summaryDefinitionId: "summary-1", summaryDefinitionVersion: 1,
  definitionContractVersion: CONTRACTIQ_BUYER_SUMMARY_DEFINITION_VERSION,
  templateVersion: CONTRACTIQ_BUYER_SUMMARY_TEMPLATE_VERSION,
  workspaceId: full.workspaceId, dealId: full.dealId, propertyId: full.propertyId, contractId: full.contractId,
  perspective: "buyer", snapshotId: full.snapshotId, snapshotVersion: full.snapshotVersion,
  snapshotHash: full.snapshotHash, fullReportDefinitionId: full.reportDefinitionId,
  fullReportDefinitionVersion: full.reportDefinitionVersion, fullReportContentHash: full.contentHash,
  analysisVersion: full.analysisVersion, summaryState: "current", recommendationState: "Proceed with Conditions",
  reconciliationState: "reconciled", sourceCutoffAt: full.sourceCutoffAt, generatedAt: "2026-09-23T00:02:00Z",
  definitionPayload: {
    sectionDefinitions: CONTRACTIQ_BUYER_SUMMARY_SECTION_CATALOG.map(({ sectionId, title }) => ({ sectionId, title, anchor: sectionId })),
    includedItemReferences: [{ itemId: "term:price", fullSectionId: "economic-terms", fullAnchor: "economic-terms" }],
    materialDispositions: [{ itemId: "term:price", disposition: "included" }],
    quickReviewRows: [{ itemId: "term:price", fullAnchor: "economic-terms" }],
  },
  validation: { eligible: true, errors: [] }, contentHash: "d".repeat(64), deterministicDefinitionHash: "e".repeat(64),
};

describe("ContractIQ Buyer Summary definition", () => {
  it("uses seven stable sections and exact R1/R3 identities", () => {
    expect(CONTRACTIQ_BUYER_SUMMARY_SECTION_CATALOG).toHaveLength(7);
    expect(validateContractIQBuyerSummaryDefinition(summary, full)).toEqual({ eligible: true, errors: [] });
  });

  it("rejects recommendation and source version drift", () => {
    expect(validateContractIQBuyerSummaryDefinition({ ...summary, recommendationState: "Proceed" }, full).errors)
      .toContain("recommendation_mismatch");
    expect(validateContractIQBuyerSummaryDefinition({ ...summary, snapshotVersion: 3 }, full).errors)
      .toContain("full_summary_identity_mismatch");
  });

  it("rejects an omitted material issue and duplicate primary placement", () => {
    const omitted = { ...summary, definitionPayload: { ...summary.definitionPayload, materialDispositions: [] } };
    expect(validateContractIQBuyerSummaryDefinition(omitted, full).errors).toContain("material_item_omitted:term:price");
    const duplicated = { ...summary, definitionPayload: { ...summary.definitionPayload,
      includedItemReferences: [{ itemId: "term:price" }, { itemId: "term:price" }] } };
    expect(validateContractIQBuyerSummaryDefinition(duplicated, full).errors).toContain("duplicate_summary_item");
  });

  it("rejects current state against a stale Full definition", () => {
    expect(validateContractIQBuyerSummaryDefinition(summary, { ...full, reportState: "stale" }).errors)
      .toContain("current_summary_not_reconciled");
  });
});

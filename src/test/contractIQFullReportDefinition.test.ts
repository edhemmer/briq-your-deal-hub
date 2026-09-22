import { describe, expect, it } from "vitest";
import {
  assertContractIQFullReportDefinition,
  CONTRACTIQ_FULL_REPORT_DEFINITION_VERSION,
  CONTRACTIQ_FULL_REPORT_SECTION_CATALOG,
  CONTRACTIQ_FULL_REPORT_TEMPLATE_VERSION,
  validateContractIQFullReportDefinition,
  type ContractIQFullDueDiligenceReportDefinition,
} from "../core/contractIQ";

const sections = CONTRACTIQ_FULL_REPORT_SECTION_CATALOG.map((entry) => ({
  ...entry,
  state: entry.sectionId === "transaction-identity" || entry.sectionId === "executive-overview" || entry.sectionId === "economic-terms" || entry.sectionId === "recommendation" ? "included" as const : "not_applicable" as const,
  materiality: entry.sectionId === "economic-terms" ? "material" as const : "informational" as const,
  itemIds: entry.sectionId === "economic-terms" ? ["term:term-1"] : [],
  questionIds: [] as string[],
  sourceRefs: entry.sectionId === "economic-terms" ? [{ recordType: "term" as const, recordId: "term-1", recordVersion: 2, verificationState: "verified", evidenceId: "evidence-1" }] : [],
  crossReferenceIds: [] as string[],
}));

const definition: ContractIQFullDueDiligenceReportDefinition = {
  reportDefinitionId: "definition-1", reportDefinitionVersion: 1,
  definitionContractVersion: CONTRACTIQ_FULL_REPORT_DEFINITION_VERSION,
  snapshotId: "snapshot-1", snapshotVersion: 2, snapshotHash: "a".repeat(64),
  workspaceId: "workspace-1", dealId: "deal-1", propertyId: "property-1", contractId: "contract-1",
  perspective: "buyer", analysisVersion: 3, reportState: "current", snapshotState: "current",
  reconciliationState: "reconciled", recommendationState: "Proceed with Conditions",
  sourceCutoffAt: "2026-09-22T00:00:00.000Z", generatedAt: "2026-09-22T00:00:01.000Z",
  title: "Full Due Diligence Report", executiveOverview: { independentConclusionGenerated: false },
  sectionDefinitions: sections,
  sectionOrdering: sections.filter((section) => section.state === "included").map((section) => section.sectionId),
  materialityRules: { unknownRemainsUnknown: true, noReportOwnedCalculation: true },
  sourceReferenceRules: { snapshotOnly: true }, questionReferences: [], openItemReferences: [],
  recommendationReferences: ["term:term-1"], appendixDefinitions: [],
  templateContractVersion: CONTRACTIQ_FULL_REPORT_TEMPLATE_VERSION,
  contentHash: "b".repeat(64), deterministicDefinitionHash: "c".repeat(64), validation: { eligible: true, errors: [] },
};

describe("ContractIQ Full Due Diligence Report definition", () => {
  it("defines the complete stable section order and anchors", () => {
    expect(CONTRACTIQ_FULL_REPORT_SECTION_CATALOG).toHaveLength(27);
    expect(CONTRACTIQ_FULL_REPORT_SECTION_CATALOG[0]?.sectionId).toBe("transaction-identity");
    expect(CONTRACTIQ_FULL_REPORT_SECTION_CATALOG.at(-1)?.sectionId).toBe("source-appendix");
    expect(new Set(CONTRACTIQ_FULL_REPORT_SECTION_CATALOG.map((section) => section.anchor)).size).toBe(27);
  });

  it("accepts a reconciled source-linked immutable definition contract", () => {
    expect(validateContractIQFullReportDefinition(definition)).toEqual({ eligible: true, errors: [] });
    expect(assertContractIQFullReportDefinition(definition)).toBe(definition);
  });

  it("rejects report ordering drift", () => {
    const result = validateContractIQFullReportDefinition({ ...definition, sectionOrdering: [...definition.sectionOrdering].reverse() });
    expect(result.errors).toContain("section_order_mismatch");
  });

  it("rejects duplicate primary issue placement", () => {
    const duplicated = definition.sectionDefinitions.map((section) => section.sectionId === "contingencies" ? { ...section, state: "included" as const, itemIds: ["term:term-1"] } : section);
    expect(validateContractIQFullReportDefinition({ ...definition, sectionDefinitions: duplicated }).errors).toContain("duplicate_primary_item:term:term-1");
  });

  it("rejects material sections without canonical source references", () => {
    const unsourced = definition.sectionDefinitions.map((section) => section.sectionId === "economic-terms" ? { ...section, sourceRefs: [] } : section);
    expect(validateContractIQFullReportDefinition({ ...definition, sectionDefinitions: unsourced }).errors).toContain("material_section_missing_source:economic-terms");
  });

  it("rejects a current definition derived from an unreconciled snapshot", () => {
    expect(validateContractIQFullReportDefinition({ ...definition, reconciliationState: "stale" }).errors).toContain("current_definition_not_reconciled");
  });
});


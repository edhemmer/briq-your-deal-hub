import { describe, expect, it } from "vitest";
import {
  canPresentAlignedReportIQFamily,
  validateCurrentReportIQArtifact,
  type ReportIQArtifactHistory,
  type ReportIQDefinitionLineage,
  type ReportIQFamilyReconciliation,
} from "../core/reportIQ";

const hash = "a".repeat(64);
const artifact: ReportIQArtifactHistory = {
  artifactId: "artifact-1", workspaceId: "workspace-1", dealId: "deal-1", propertyId: "property-1",
  contractId: "contract-1", reportType: "full_due_diligence", perspective: "buyer", selectedRole: null,
  snapshotId: "snapshot-1", snapshotVersion: 2, analysisVersion: 3,
  definitionId: "definition-1", definitionVersion: 4, definitionHash: hash,
  templateVersion: "template-v1", rendererVersion: "renderer-v1", fileHash: hash,
  sourceCutoffAt: "2026-09-25T00:00:00Z", storageBucket: "report-artifacts",
  storagePath: "workspace-1/deal-1/artifact-1.pdf", mimeType: "application/pdf", sizeBytes: 100,
  state: "current", staleReasons: [], generatedAt: "2026-09-25T01:00:00Z", jobId: "job-1",
  jobStatus: "completed", generationFailureCode: null,
};
const definition: ReportIQDefinitionLineage = {
  definitionId: "definition-1", workspaceId: "workspace-1", dealId: "deal-1", contractId: "contract-1",
  reportType: "full_due_diligence", perspective: "buyer", selectedRole: null,
  snapshotId: "snapshot-1", snapshotVersion: 2, analysisVersion: 3, definitionVersion: 4,
  definitionHash: hash, definitionState: "current", isCurrent: true,
};
const family: ReportIQFamilyReconciliation = {
  workspaceId: "workspace-1", dealId: "deal-1", contractId: "contract-1", perspective: "buyer",
  fullDefinitionId: "definition-1", summaryDefinitionId: "definition-2",
  fullArtifactId: "artifact-1", summaryArtifactId: "artifact-2", alignmentState: "aligned",
};

describe("ReportIQ artifact read contract", () => {
  it("accepts only an exact current definition lineage", () => {
    expect(validateCurrentReportIQArtifact(artifact, definition)).toEqual([]);
  });

  it("fails closed on stale state, version drift, and context mismatch", () => {
    expect(validateCurrentReportIQArtifact({ ...artifact, state: "stale" }, definition)).toContain("artifact_not_current");
    expect(validateCurrentReportIQArtifact(artifact, { ...definition, isCurrent: false })).toContain("definition_not_current");
    expect(validateCurrentReportIQArtifact(artifact, { ...definition, snapshotVersion: 3 })).toContain("report_lineage_mismatch");
    expect(validateCurrentReportIQArtifact(artifact, { ...definition, selectedRole: "lender" })).toContain("report_context_mismatch");
  });

  it("rejects malformed hashes rather than displaying a current artifact", () => {
    expect(validateCurrentReportIQArtifact({ ...artifact, fileHash: "missing" }, definition)).toContain("invalid_content_hash");
  });

  it("requires two artifacts and backend alignment for a current report family", () => {
    expect(canPresentAlignedReportIQFamily(family)).toBe(true);
    expect(canPresentAlignedReportIQFamily({ ...family, alignmentState: "partially_stale" })).toBe(false);
    expect(canPresentAlignedReportIQFamily({ ...family, summaryArtifactId: null })).toBe(false);
  });
});

export const REPORTIQ_REPORT_TYPES = [
  "full_due_diligence", "buyer_summary", "questions_all", "questions_grouped", "role_export",
] as const;
export type ReportIQReportType = (typeof REPORTIQ_REPORT_TYPES)[number];

export const REPORTIQ_ARTIFACT_STATES = [
  "current", "stale", "failed_with_prior_valid_artifact", "superseded", "blocked", "revoked",
] as const;
export type ReportIQArtifactState = (typeof REPORTIQ_ARTIFACT_STATES)[number];

export const REPORTIQ_JOB_STATES = [
  "queued", "running", "completed", "failed", "retrying", "cancelled", "blocked",
] as const;
export type ReportIQJobState = (typeof REPORTIQ_JOB_STATES)[number];

export const REPORTIQ_FAMILY_STATES = [
  "aligned", "partially_stale", "regeneration_in_progress", "failed_with_prior_valid", "inconsistent_blocked",
] as const;
export type ReportIQFamilyState = (typeof REPORTIQ_FAMILY_STATES)[number];

export interface ReportIQArtifactHistory {
  artifactId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  contractId: string;
  reportType: ReportIQReportType;
  perspective: string;
  selectedRole: string | null;
  snapshotId: string;
  snapshotVersion: number;
  analysisVersion: number;
  definitionId: string;
  definitionVersion: number;
  definitionHash: string;
  templateVersion: string;
  rendererVersion: string;
  fileHash: string;
  sourceCutoffAt: string;
  storageBucket: "report-artifacts";
  storagePath: string;
  mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  sizeBytes: number;
  state: ReportIQArtifactState;
  staleReasons: string[];
  generatedAt: string;
  jobId: string;
  jobStatus: ReportIQJobState;
  generationFailureCode: string | null;
}

export interface ReportIQDefinitionLineage {
  definitionId: string;
  workspaceId: string;
  dealId: string;
  contractId: string;
  reportType: ReportIQReportType;
  perspective: string;
  selectedRole: string | null;
  snapshotId: string;
  snapshotVersion: number;
  analysisVersion: number;
  definitionVersion: number;
  definitionHash: string;
  definitionState: string;
  isCurrent: boolean;
}

export interface ReportIQCurrentArtifact {
  definitionId: string;
  definitionVersion: number;
  definitionState: string;
  definitionIsCurrent: boolean;
  currentArtifactId: string | null;
  priorValidArtifactId: string | null;
  priorValidState: ReportIQArtifactState | null;
  staleReasons: string[] | null;
  latestJobId: string | null;
  latestJobStatus: ReportIQJobState | null;
  latestFailureCode: string | null;
  regenerationAvailable: boolean;
}

export interface ReportIQFamilyReconciliation {
  workspaceId: string;
  dealId: string;
  contractId: string;
  perspective: string;
  fullDefinitionId: string;
  summaryDefinitionId: string | null;
  fullArtifactId: string | null;
  summaryArtifactId: string | null;
  alignmentState: ReportIQFamilyState;
}

const currentDefinitionStates = new Set([
  "current", "current_with_open_questions", "current_with_conflicts", "professional_review_recommended",
]);

export function validateCurrentReportIQArtifact(
  artifact: ReportIQArtifactHistory,
  definition: ReportIQDefinitionLineage,
): string[] {
  const errors: string[] = [];
  if (artifact.state !== "current") errors.push("artifact_not_current");
  if (!definition.isCurrent || !currentDefinitionStates.has(definition.definitionState)) errors.push("definition_not_current");
  if (artifact.workspaceId !== definition.workspaceId || artifact.dealId !== definition.dealId ||
    artifact.contractId !== definition.contractId || artifact.reportType !== definition.reportType ||
    artifact.perspective !== definition.perspective || artifact.selectedRole !== definition.selectedRole) {
    errors.push("report_context_mismatch");
  }
  if (artifact.snapshotId !== definition.snapshotId || artifact.snapshotVersion !== definition.snapshotVersion ||
    artifact.analysisVersion !== definition.analysisVersion || artifact.definitionId !== definition.definitionId ||
    artifact.definitionVersion !== definition.definitionVersion || artifact.definitionHash !== definition.definitionHash) {
    errors.push("report_lineage_mismatch");
  }
  if (!/^[0-9a-f]{64}$/.test(artifact.definitionHash) || !/^[0-9a-f]{64}$/.test(artifact.fileHash)) {
    errors.push("invalid_content_hash");
  }
  return errors;
}

export function canPresentAlignedReportIQFamily(family: ReportIQFamilyReconciliation): boolean {
  return family.alignmentState === "aligned" && !!family.fullArtifactId && !!family.summaryArtifactId;
}

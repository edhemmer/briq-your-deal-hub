import { manualFallbackStates, type ManualFallbackPlan } from "./manualFallback";
import { validateManualIntakeDraft } from "./propertyIntake";
import type { SourceConflictResult } from "./sourceConflicts";
import type { ListingProposalStatus, ManualIntakeDraft } from "./types";

export const preliminaryAssumptionSubjects = [
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
] as const;

export const preliminaryAssumptionClassifications = [
  "user_entered_fact",
  "verified_source",
  "preliminary_assumption",
  "descriptive_input",
  "unknown",
] as const;

export const neverAssumeSubjects = [
  "purchase_price",
  "market_value",
  "repair_cost",
  "arv",
  "insurance_values",
  "environmental_conditions",
  "structural_condition",
  "legal_conclusions",
  "contract_interpretation",
  "financial_analysis",
  "investment_recommendation",
  "risk_score",
  "brix_analytical_output",
] as const;

export const finalIntakeStatuses = [
  "Ready for Analysis",
  "Needs Review",
  "Incomplete",
  "Blocked",
  "Cancelled",
] as const;

export const specification004CompletionEvent = "specification004.completed" as const;
export const PRELIMINARY_ASSUMPTION_ENGINE_VERSION = "preliminary-assumption-proposals-v1";
export const DEFAULT_PRELIMINARY_ASSUMPTION_CONFIDENCE = 70;

export type PreliminaryAssumptionSubject = typeof preliminaryAssumptionSubjects[number];
export type PreliminaryAssumptionClassification = typeof preliminaryAssumptionClassifications[number];
export type NeverAssumeSubject = typeof neverAssumeSubjects[number];
export type FinalIntakeStatus = typeof finalIntakeStatuses[number];
export type Specification004CompletionEvent = typeof specification004CompletionEvent;

export type PreliminaryAssumptionEvidence = {
  evidenceId: string;
  sourceRecordId?: string;
  sourceName: string;
  subject: PreliminaryAssumptionSubject | NeverAssumeSubject | string;
  rawValue: string | number | boolean;
  normalizedValue?: string | number | boolean;
  displayValue?: string;
  confidence: number;
  classification?: PreliminaryAssumptionClassification;
  verificationState?: string;
  effectiveDate?: string;
  freshness?: string;
  unit?: string;
  currency?: string;
};

export type PreliminaryAssumptionProposal = {
  id: string;
  subject: PreliminaryAssumptionSubject;
  canonicalField: string;
  label: string;
  rawValue: string | number | boolean;
  normalizedValue: string | number | boolean;
  displayValue: string;
  classification: PreliminaryAssumptionClassification;
  verificationState: string;
  confidence: number;
  status: ListingProposalStatus;
  sourceRecordId?: string;
  evidenceId: string;
  sourceName: string;
  evidenceRule: string;
  effectiveDate?: string;
  freshness?: string;
  unit?: string;
  currency?: string;
  engineVersion: typeof PRELIMINARY_ASSUMPTION_ENGINE_VERSION;
};

export type PreliminaryAssumptionProposalDecision = "accept" | "accept_edit" | "reject" | "defer";

export type PreliminaryAssumptionInput = {
  draft: ManualIntakeDraft;
  evidence: PreliminaryAssumptionEvidence[];
  duplicateDetectionComplete: boolean;
  acceptedValues?: Partial<Record<PreliminaryAssumptionSubject, string | number | boolean>>;
  conflicts?: SourceConflictResult[];
  confidenceThreshold?: number;
};

export type FinalReconciliationCheckStatus = "passed" | "failed";

export type FinalReconciliationCheck = {
  key:
    | "required_fields_complete"
    | "no_blocking_conflicts"
    | "no_blocking_duplicates"
    | "required_evidence_attached"
    | "required_source_records_preserved"
    | "canonical_property_linked"
    | "canonical_deal_linked"
    | "proposal_workflow_completed"
    | "manual_fallback_resolved"
    | "canonical_workflows_converge"
    | "single_deal_creation_path"
    | "single_property_creation_path"
    | "specification004_roadmap_resolved";
  status: FinalReconciliationCheckStatus;
  message: string;
};

export type FinalReconciliationInput = {
  draft: ManualIntakeDraft;
  manualFallback?: ManualFallbackPlan;
  proposals?: PreliminaryAssumptionProposal[];
  conflicts?: SourceConflictResult[];
  duplicateDetection?: {
    complete: boolean;
    blocking: boolean;
  };
  evidenceAttached: boolean;
  sourceRecordsPreserved: boolean;
  canonicalPropertyId?: string;
  canonicalDealId?: string;
  intakeMethodsConverge: boolean;
  canonicalWorkflowsConverge: boolean;
  singleDealCreationPath: boolean;
  singlePropertyCreationPath: boolean;
  specification004RoadmapResolved: boolean;
  cancelled?: boolean;
};

export type FinalReconciliationResult = {
  status: FinalIntakeStatus;
  checks: FinalReconciliationCheck[];
  blockingReasons: string[];
  reviewReasons: string[];
  completionEvent?: Specification004CompletionEvent;
};

const subjectMetadata: Record<PreliminaryAssumptionSubject, { canonicalField: string; label: string; draftField?: keyof ManualIntakeDraft }> = {
  property_type: { canonicalField: "property_type", label: "Property type", draftField: "propertyType" },
  occupancy: { canonicalField: "occupancy", label: "Occupancy" },
  construction_type: { canonicalField: "construction_type", label: "Construction type" },
  building_use: { canonicalField: "building_use", label: "Building use" },
  estimated_units: { canonicalField: "estimated_units", label: "Estimated units" },
  approximate_square_footage: { canonicalField: "approximate_square_footage", label: "Approximate square footage" },
  estimated_year_built: { canonicalField: "estimated_year_built", label: "Estimated year built" },
  expected_strategy: { canonicalField: "expected_strategy", label: "Expected strategy", draftField: "intendedStrategy" },
  basic_land_use: { canonicalField: "basic_land_use", label: "Basic land use" },
  general_property_classification: { canonicalField: "general_property_classification", label: "General property classification" },
};

export function createPreliminaryAssumptionProposals(input: PreliminaryAssumptionInput): PreliminaryAssumptionProposal[] {
  if (!input.duplicateDetectionComplete) return [];
  const threshold = input.confidenceThreshold ?? DEFAULT_PRELIMINARY_ASSUMPTION_CONFIDENCE;
  return input.evidence
    .filter(isSupportedAssumptionEvidence)
    .filter((evidence) => evidence.confidence >= threshold)
    .filter((evidence) => hasValue(evidence.rawValue))
    .filter((evidence) => !hasAcceptedValue(input.draft, input.acceptedValues, evidence.subject))
    .filter((evidence) => !hasBlockingConflict(input.conflicts ?? [], evidence.subject))
    .map((evidence) => proposalFromEvidence(input.draft.id, evidence))
    .sort((left, right) => left.subject.localeCompare(right.subject) || left.id.localeCompare(right.id));
}

export function applyPreliminaryAssumptionDecision(
  proposal: PreliminaryAssumptionProposal,
  decision: PreliminaryAssumptionProposalDecision,
  editedValue?: string | number | boolean,
): PreliminaryAssumptionProposal {
  if (decision === "accept_edit") {
    if (!hasValue(editedValue)) throw new Error("Enter the edited value before accepting the proposal.");
    return {
      ...proposal,
      rawValue: editedValue,
      normalizedValue: normalizeValue(editedValue),
      displayValue: displayValue(editedValue),
      status: "edited",
    };
  }
  if (decision === "accept") return { ...proposal, status: "accepted" };
  if (decision === "reject") return { ...proposal, status: "rejected" };
  return { ...proposal, status: "deferred" };
}

export function reconcileSpecification004Intake(input: FinalReconciliationInput): FinalReconciliationResult {
  if (input.cancelled || input.manualFallback?.state === "manual_cancelled") {
    return {
      status: "Cancelled",
      checks: [],
      blockingReasons: ["Intake was cancelled."],
      reviewReasons: [],
    };
  }

  const checks = buildFinalChecks(input);
  const failed = checks.filter((check) => check.status === "failed");
  const blockingReasons = failed
    .filter((check) => isBlockingCheck(check.key))
    .map((check) => check.message);
  const reviewReasons = failed
    .filter((check) => !isBlockingCheck(check.key))
    .map((check) => check.message);

  if (blockingReasons.length) return { status: "Blocked", checks, blockingReasons, reviewReasons };
  if (reviewReasons.some((reason) => reason.includes("proposal"))) return { status: "Needs Review", checks, blockingReasons, reviewReasons };
  if (reviewReasons.length) return { status: "Incomplete", checks, blockingReasons, reviewReasons };

  return {
    status: "Ready for Analysis",
    checks,
    blockingReasons,
    reviewReasons,
    completionEvent: specification004CompletionEvent,
  };
}

export function isSpecification004Complete(result: FinalReconciliationResult): boolean {
  return result.status === "Ready for Analysis" && result.completionEvent === specification004CompletionEvent;
}

export function assertSpecification004Completion(result: FinalReconciliationResult): Specification004CompletionEvent {
  if (!isSpecification004Complete(result)) throw new Error("Specification 004 intake is not complete.");
  return specification004CompletionEvent;
}

function buildFinalChecks(input: FinalReconciliationInput): FinalReconciliationCheck[] {
  const validationErrors = validateManualIntakeDraft(input.draft);
  const proposals = input.proposals ?? [];
  const blockingConflicts = (input.conflicts ?? []).filter(isUnresolvedBlockingConflict);
  const manualFallbackResolved = !input.manualFallback || input.manualFallback.state === "manual_completed" || input.manualFallback.state === "automatic";
  const unresolvedProposals = proposals.filter((proposal) => proposal.status === "pending" || proposal.status === "conflicted");

  return [
    check("required_fields_complete", validationErrors.length === 0, validationErrors.join(" ") || "Required intake fields are complete."),
    check("no_blocking_conflicts", blockingConflicts.length === 0, "Resolve blocking source conflicts before finishing intake."),
    check("no_blocking_duplicates", Boolean(input.duplicateDetection?.complete) && !input.duplicateDetection.blocking, "Resolve duplicate review before finishing intake."),
    check("required_evidence_attached", input.evidenceAttached, "Required evidence must be attached or intentionally preserved."),
    check("required_source_records_preserved", input.sourceRecordsPreserved, "Required source records must be preserved."),
    check("canonical_property_linked", Boolean(input.canonicalPropertyId?.trim()), "Canonical Property must be linked."),
    check("canonical_deal_linked", Boolean(input.canonicalDealId?.trim()), "Canonical Deal must be linked."),
    check("proposal_workflow_completed", unresolvedProposals.length === 0, "Complete all preliminary assumption proposal review before final intake."),
    check("manual_fallback_resolved", manualFallbackResolved && !hasUnresolvedManualFallback(input.manualFallback), "Resolve manual fallback fields before final intake."),
    check("canonical_workflows_converge", input.canonicalWorkflowsConverge && input.intakeMethodsConverge, "All intake methods must converge on the canonical workflow."),
    check("single_deal_creation_path", input.singleDealCreationPath, "Only the canonical Deal creation path may be used."),
    check("single_property_creation_path", input.singlePropertyCreationPath, "Only the canonical Property creation path may be used."),
    check("specification004_roadmap_resolved", input.specification004RoadmapResolved, "Specification 004 roadmap items must be resolved before completion."),
  ];
}

function check(key: FinalReconciliationCheck["key"], passed: boolean, message: string): FinalReconciliationCheck {
  return { key, status: passed ? "passed" : "failed", message };
}

function isBlockingCheck(key: FinalReconciliationCheck["key"]) {
  return key === "no_blocking_conflicts" || key === "no_blocking_duplicates" || key === "single_deal_creation_path" || key === "single_property_creation_path" || key === "canonical_workflows_converge";
}

function hasUnresolvedManualFallback(plan?: ManualFallbackPlan) {
  if (!plan) return false;
  if (!manualFallbackStates.includes(plan.state)) return true;
  return plan.unresolvedFields.some((field) => field.status === "missing" || field.status === "needs_review" || field.status === "conflicted");
}

function isUnresolvedBlockingConflict(conflict: SourceConflictResult) {
  return conflict.lifecycleState !== "resolved" && (
    conflict.materialityTier === "blocking_identity" ||
    conflict.downstreamSafety.blocksAffectedFieldAcceptance ||
    !conflict.downstreamSafety.allowsDealCreation
  );
}

function hasAcceptedValue(
  draft: ManualIntakeDraft,
  acceptedValues: PreliminaryAssumptionInput["acceptedValues"] = {},
  subject: PreliminaryAssumptionSubject,
) {
  const accepted = acceptedValues[subject];
  if (hasValue(accepted)) return true;
  const draftField = subjectMetadata[subject].draftField;
  if (!draftField) return false;
  return hasValue(draft[draftField]);
}

function hasBlockingConflict(conflicts: SourceConflictResult[], subject: PreliminaryAssumptionSubject) {
  const target = subjectMetadata[subject].canonicalField;
  return conflicts.some((conflict) => conflict.targetField === target && isUnresolvedBlockingConflict(conflict));
}

function proposalFromEvidence(draftId: string, evidence: PreliminaryAssumptionEvidence): PreliminaryAssumptionProposal {
  const subject = evidence.subject as PreliminaryAssumptionSubject;
  const metadata = subjectMetadata[subject];
  const normalizedValue = normalizeValue(evidence.normalizedValue ?? evidence.rawValue);
  return {
    id: stableHash(`${draftId}:${evidence.evidenceId}:${evidence.sourceRecordId ?? ""}:${subject}:${String(normalizedValue)}`),
    subject,
    canonicalField: metadata.canonicalField,
    label: metadata.label,
    rawValue: evidence.rawValue,
    normalizedValue,
    displayValue: evidence.displayValue?.trim() || displayValue(normalizedValue),
    classification: isPreliminaryAssumptionClassification(evidence.classification) ? evidence.classification : "preliminary_assumption",
    verificationState: evidence.verificationState?.trim() || "unverified",
    confidence: clampConfidence(evidence.confidence),
    status: "pending",
    sourceRecordId: evidence.sourceRecordId?.trim() || undefined,
    evidenceId: evidence.evidenceId,
    sourceName: evidence.sourceName,
    evidenceRule: "Deterministic source evidence supports this unresolved intake assumption.",
    effectiveDate: evidence.effectiveDate?.trim() || undefined,
    freshness: evidence.freshness?.trim() || undefined,
    unit: evidence.unit?.trim() || undefined,
    currency: evidence.currency?.trim() || undefined,
    engineVersion: PRELIMINARY_ASSUMPTION_ENGINE_VERSION,
  };
}

function isPreliminaryAssumptionSubject(value: unknown): value is PreliminaryAssumptionSubject {
  return preliminaryAssumptionSubjects.includes(value as PreliminaryAssumptionSubject);
}

function isSupportedAssumptionEvidence(evidence: PreliminaryAssumptionEvidence): evidence is PreliminaryAssumptionEvidence & { subject: PreliminaryAssumptionSubject } {
  return isPreliminaryAssumptionSubject(evidence.subject);
}

function isPreliminaryAssumptionClassification(value: unknown): value is PreliminaryAssumptionClassification {
  return preliminaryAssumptionClassifications.includes(value as PreliminaryAssumptionClassification);
}

function hasValue(value: unknown) {
  if (typeof value === "string") return Boolean(value.trim());
  return value !== undefined && value !== null;
}

function normalizeValue(value: string | number | boolean) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value;
}

function displayValue(value: string | number | boolean) {
  return typeof value === "boolean" ? (value ? "Yes" : "No") : String(value).trim();
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

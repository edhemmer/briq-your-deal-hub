import { supabase } from "./supabase";
import type { SourceClassificationResult } from "./sourceClassification";

export const SOURCE_CONFLICT_REQUEST_VERSION = 1;
export const SOURCE_CONFLICT_RULE_REGISTRY_VERSION = "source-conflict-rules-v1";

export const sourceConflictSubjectTypes = [
  "property",
  "deal",
  "lifecycle",
  "property_identity",
  "deal_identity",
  "source_identity",
  "manual_value",
  "listing_value",
  "file_value",
  "email_value",
  "batch_row_value",
  "source_classification",
  "evidence_attachment",
  "preliminary_fact",
  "assumption",
  "duplicate_identity",
] as const;

export const sourceConflictClassifications = [
  "no_conflict",
  "informational_difference",
  "material_conflict",
  "identity_conflict",
  "temporal_change",
  "unit_scope_conflict",
  "unresolved_ambiguity",
] as const;

export const sourceConflictMaterialityTiers = [
  "informational",
  "review",
  "material",
  "blocking_identity",
] as const;

export const sourceConflictResolutionActions = [
  "keep_current",
  "accept_proposal",
  "accept_edited_value",
  "preserve_as_temporal_change",
  "preserve_as_different_scope",
  "mark_not_conflict",
  "defer",
  "return_to_identity_review",
  "cancel_intake_action",
] as const;

export type SourceConflictSubjectType = typeof sourceConflictSubjectTypes[number];
export type SourceConflictClassification = typeof sourceConflictClassifications[number];
export type SourceConflictMaterialityTier = typeof sourceConflictMaterialityTiers[number];
export type SourceConflictResolutionAction = typeof sourceConflictResolutionActions[number];
export type SourceConflictLifecycleState = "detected" | "awaiting_review" | "resolved" | "deferred" | "superseded" | "stale" | "cancelled";

export type SourceConflictValue = {
  role: "accepted" | "proposal";
  proposalId?: string;
  acceptedValueVersion?: number;
  rawValue?: string | number | boolean | null;
  normalizedValue?: string | number | boolean | null;
  displayValue?: string;
  unit?: string;
  currency?: string;
  period?: string;
  scope?: string;
  effectiveDate?: string;
  retrievedAt?: string;
  sourceRecordId?: string;
  evidenceId?: string;
  sourceName?: string;
  sourceAnchor?: Record<string, unknown>;
  verificationState?: string;
  sourceClassification?: SourceClassificationResult;
};

export type SourceConflictRequest = {
  requestVersion: typeof SOURCE_CONFLICT_REQUEST_VERSION;
  ruleRegistryVersion: typeof SOURCE_CONFLICT_RULE_REGISTRY_VERSION;
  requestHash: string;
  workspaceId: string;
  subjectType: SourceConflictSubjectType;
  subjectId?: string;
  targetField: string;
  currentAccepted?: SourceConflictValue;
  proposedValues: SourceConflictValue[];
  duplicateContext?: {
    hasIdentityConflict?: boolean;
    conflictingSignals?: string[];
    duplicateDecisionId?: string;
  };
  requestedAt: string;
};

export type SourceConflictResult = {
  conflictId: string;
  requestHash: string;
  subjectType: SourceConflictSubjectType;
  subjectId?: string;
  targetField: string;
  classification: SourceConflictClassification;
  materialityTier: SourceConflictMaterialityTier;
  ruleId: string;
  ruleVersion: number;
  involvedProposalIds: string[];
  involvedAcceptedValueVersion?: number;
  comparedNormalizedValues: string[];
  context: {
    units: string[];
    currencies: string[];
    periods: string[];
    scopes: string[];
    effectiveDates: string[];
    verificationStates: string[];
  };
  sourceSummaries: SourceConflictSourceSummary[];
  deterministicExplanation: string;
  safeSummary: string;
  downstreamSafety: SourceConflictDownstreamSafety;
  lifecycleState: SourceConflictLifecycleState;
  ruleRegistryVersion: typeof SOURCE_CONFLICT_RULE_REGISTRY_VERSION;
  stableOrderingKey: string;
};

export type SourceConflictSourceSummary = {
  role: "accepted" | "proposal";
  proposalId?: string;
  sourceRecordId?: string;
  evidenceId?: string;
  sourceName?: string;
  sourceClass?: string;
  sourceSubtype?: string;
  effectiveDate?: string;
  retrievedAt?: string;
  verificationState?: string;
  anchorAvailable: boolean;
};

export type SourceConflictDownstreamSafety = {
  allowsIntakeCompletion: boolean;
  allowsDealCreation: boolean;
  allowsEvidenceAttachment: boolean;
  allowsPreliminaryAnalysis: boolean;
  blocksIdentityDependentProcessing: boolean;
  blocksAffectedFieldAcceptance: boolean;
  requiresManualReview: boolean;
};

export type SourceConflictResolutionInput = {
  conflictId: string;
  workspaceId: string;
  idempotencyKey: string;
  action: SourceConflictResolutionAction;
  decidedBy?: string;
  selectedProposalId?: string;
  editedValue?: {
    rawValue: string;
    normalizedValue: string;
    displayValue?: string;
    unit?: string;
    currency?: string;
    period?: string;
    scope?: string;
  };
  acceptedValueVersion?: number;
  rationaleCategory: "source_preferred" | "user_verified" | "professional_review" | "temporal_history" | "different_scope" | "not_same_subject" | "not_material" | "needs_more_evidence" | "cancelled";
  safeNote?: string;
  decidedAt?: string;
};

export type SourceConflictResolutionRecord = {
  resolutionId: string;
  conflictId: string;
  action: SourceConflictResolutionAction;
  lifecycleState: SourceConflictLifecycleState;
  selectedProposalId?: string;
  priorAcceptedVersion?: number;
  resultingAcceptedVersion?: number;
  conflictRuleVersion: typeof SOURCE_CONFLICT_RULE_REGISTRY_VERSION;
  decisionInputHash: string;
  idempotencyKeyOut: string;
  requiresCanonicalMutation: boolean;
};

type ComparableValue = SourceConflictValue & {
  normalizedComparable: string;
  numberValue?: number;
  unitKey?: string;
  currencyKey?: string;
  periodKey?: string;
  scopeKey?: string;
  effectiveDateKey?: string;
};

type ConflictRule = {
  id: string;
  version: number;
  priority: number;
  enabled: boolean;
  subjectTypes: readonly SourceConflictSubjectType[];
  evaluate: (request: SourceConflictRequest, values: ComparableValue[]) => Omit<SourceConflictResult, "conflictId" | "requestHash" | "subjectType" | "subjectId" | "targetField" | "ruleId" | "ruleVersion" | "involvedProposalIds" | "involvedAcceptedValueVersion" | "comparedNormalizedValues" | "context" | "sourceSummaries" | "ruleRegistryVersion" | "stableOrderingKey" | "lifecycleState"> | null;
};

export function createSourceConflictRequest(input: {
  workspaceId: string;
  subjectType: SourceConflictSubjectType;
  targetField: string;
  subjectId?: string;
  currentAccepted?: SourceConflictValue;
  proposedValues: SourceConflictValue[];
  duplicateContext?: SourceConflictRequest["duplicateContext"];
  requestedAt?: string;
}): SourceConflictRequest {
  const workspaceId = clean(input.workspaceId);
  const targetField = normalizeField(input.targetField);
  if (!workspaceId) throw new Error("Source conflict detection requires a workspace.");
  if (!sourceConflictSubjectTypes.includes(input.subjectType)) throw new Error("Unsupported source conflict subject type.");
  if (!targetField) throw new Error("Source conflict detection requires a canonical field.");
  const requestBase = {
    requestVersion: SOURCE_CONFLICT_REQUEST_VERSION,
    ruleRegistryVersion: SOURCE_CONFLICT_RULE_REGISTRY_VERSION,
    workspaceId,
    subjectType: input.subjectType,
    subjectId: clean(input.subjectId),
    targetField,
    currentAccepted: input.currentAccepted ? normalizeValueInput(input.currentAccepted, "accepted") : undefined,
    proposedValues: input.proposedValues.map((value) => normalizeValueInput(value, "proposal")),
    duplicateContext: input.duplicateContext,
    requestedAt: input.requestedAt ?? new Date().toISOString(),
  } satisfies Omit<SourceConflictRequest, "requestHash">;

  return {
    ...requestBase,
    requestHash: stableHash(stableSerialize({
      ...requestBase,
      requestedAt: undefined,
    })),
  };
}

export function createProposalConflictRequest(input: {
  workspaceId: string;
  subjectType: SourceConflictSubjectType;
  subjectId?: string;
  targetField: string;
  currentAccepted?: SourceConflictValue;
  proposals: Array<{
    id?: string;
    canonicalField?: string;
    normalizedValue?: string;
    rawValue?: string;
    displayValue?: string;
    unit?: string;
    currency?: string;
    effectiveDate?: string;
    sourceRecordId?: string;
    evidenceId?: string;
    sourceKey?: string;
    verificationState?: string;
    sourceClassification?: SourceClassificationResult;
  }>;
}) {
  return createSourceConflictRequest({
    workspaceId: input.workspaceId,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    targetField: input.targetField,
    currentAccepted: input.currentAccepted,
    proposedValues: input.proposals
      .filter((proposal) => normalizeField(proposal.canonicalField ?? input.targetField) === normalizeField(input.targetField))
      .map((proposal) => ({
        role: "proposal",
        proposalId: proposal.id,
        rawValue: proposal.rawValue,
        normalizedValue: proposal.normalizedValue,
        displayValue: proposal.displayValue,
        unit: proposal.unit,
        currency: proposal.currency,
        effectiveDate: proposal.effectiveDate,
        sourceRecordId: proposal.sourceRecordId,
        evidenceId: proposal.evidenceId,
        sourceName: proposal.sourceKey,
        verificationState: proposal.verificationState,
        sourceClassification: proposal.sourceClassification,
      })),
  });
}

export function evaluateSourceConflict(request: SourceConflictRequest): SourceConflictResult {
  const values = [request.currentAccepted, ...request.proposedValues]
    .filter((value): value is SourceConflictValue => Boolean(value))
    .map((value) => comparableValue(request.targetField, value));

  const activeRules = sourceConflictRules
    .filter((rule) => rule.enabled)
    .filter((rule) => rule.subjectTypes.includes(request.subjectType))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));

  const evaluated = activeRules.map((rule) => {
    const partial = rule.evaluate(request, values);
    return partial ? { rule, partial } : null;
  }).find((entry): entry is NonNullable<typeof entry> => entry !== null);

  const rule = evaluated?.rule ?? fallbackRule;
  const partial = evaluated?.partial ?? fallbackConflict(values);
  const comparedNormalizedValues = sortedUnique(values.map((value) => value.normalizedComparable).filter(Boolean));
  const involvedProposalIds = sortedUnique(values.map((value) => value.proposalId).filter((value): value is string => Boolean(value)));
  const involvedAcceptedValueVersion = request.currentAccepted?.acceptedValueVersion;
  const context = {
    units: sortedUnique(values.map((value) => value.unitKey).filter((value): value is string => Boolean(value))),
    currencies: sortedUnique(values.map((value) => value.currencyKey).filter((value): value is string => Boolean(value))),
    periods: sortedUnique(values.map((value) => value.periodKey).filter((value): value is string => Boolean(value))),
    scopes: sortedUnique(values.map((value) => value.scopeKey).filter((value): value is string => Boolean(value))),
    effectiveDates: sortedUnique(values.map((value) => value.effectiveDateKey).filter((value): value is string => Boolean(value))),
    verificationStates: sortedUnique(values.map((value) => clean(value.verificationState)).filter((value): value is string => Boolean(value))),
  };
  const basis = {
    workspaceId: request.workspaceId,
    subjectType: request.subjectType,
    subjectId: request.subjectId,
    targetField: request.targetField,
    ruleId: rule.id,
    requestHash: request.requestHash,
  };
  const conflictId = stableHash(stableSerialize(basis));
  return {
    ...partial,
    conflictId,
    requestHash: request.requestHash,
    subjectType: request.subjectType,
    subjectId: request.subjectId,
    targetField: request.targetField,
    ruleId: rule.id,
    ruleVersion: rule.version,
    involvedProposalIds,
    involvedAcceptedValueVersion,
    comparedNormalizedValues,
    context,
    sourceSummaries: values.map(sourceSummary),
    lifecycleState: partial.classification === "no_conflict" ? "resolved" : "detected",
    ruleRegistryVersion: SOURCE_CONFLICT_RULE_REGISTRY_VERSION,
    stableOrderingKey: [
      materialityRank(partial.materialityTier),
      classificationRank(partial.classification),
      request.targetField,
      conflictId,
    ].join(":"),
  };
}

export function evaluateSourceConflicts(requests: SourceConflictRequest[]) {
  return requests.map(evaluateSourceConflict).sort((a, b) => a.stableOrderingKey.localeCompare(b.stableOrderingKey));
}

export function resolveSourceConflict(conflict: SourceConflictResult, input: SourceConflictResolutionInput): SourceConflictResolutionRecord {
  if (input.conflictId !== conflict.conflictId) throw new Error("Conflict resolution does not match the detected conflict.");
  if (!clean(input.workspaceId)) throw new Error("Conflict resolution requires a workspace.");
  if (!clean(input.idempotencyKey)) throw new Error("Conflict resolution requires a retry key.");
  if (!sourceConflictResolutionActions.includes(input.action)) throw new Error("Unsupported conflict resolution action.");
  if (input.acceptedValueVersion !== undefined && conflict.involvedAcceptedValueVersion !== undefined && input.acceptedValueVersion !== conflict.involvedAcceptedValueVersion) {
    throw new Error("STALE_CONFLICT_RESOLUTION");
  }
  if (input.action === "accept_proposal" && (!input.selectedProposalId || !conflict.involvedProposalIds.includes(input.selectedProposalId))) {
    throw new Error("Choose a proposed value before accepting it.");
  }
  if (input.action === "accept_edited_value" && !input.editedValue?.normalizedValue?.trim()) {
    throw new Error("Enter the edited value before accepting it.");
  }
  const lifecycleState: SourceConflictLifecycleState = input.action === "defer"
    ? "deferred"
    : input.action === "cancel_intake_action"
      ? "cancelled"
      : input.action === "return_to_identity_review"
        ? "awaiting_review"
        : "resolved";
  const requiresCanonicalMutation = ["accept_proposal", "accept_edited_value", "keep_current"].includes(input.action);
  const decisionInputHash = stableHash(stableSerialize({
    conflictId: conflict.conflictId,
    action: input.action,
    selectedProposalId: input.selectedProposalId,
    editedValue: input.editedValue,
    acceptedValueVersion: input.acceptedValueVersion,
    rationaleCategory: input.rationaleCategory,
  }));
  return {
    resolutionId: stableHash(stableSerialize({ workspaceId: input.workspaceId, idempotencyKey: input.idempotencyKey, decisionInputHash })),
    conflictId: conflict.conflictId,
    action: input.action,
    lifecycleState,
    selectedProposalId: clean(input.selectedProposalId),
    priorAcceptedVersion: conflict.involvedAcceptedValueVersion,
    resultingAcceptedVersion: requiresCanonicalMutation ? (conflict.involvedAcceptedValueVersion ?? 0) + 1 : undefined,
    conflictRuleVersion: SOURCE_CONFLICT_RULE_REGISTRY_VERSION,
    decisionInputHash,
    idempotencyKeyOut: input.idempotencyKey.trim(),
    requiresCanonicalMutation,
  };
}

export async function recordSourceConflict(workspaceId: string, idempotencyKey: string, conflict: SourceConflictResult) {
  const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  const { data, error } = await rpc("record_source_conflict", {
    target_workspace_id: workspaceId,
    idempotency_key: idempotencyKey,
    conflict_input: serializeConflictForRpc(conflict),
  });
  if (error) throw error;
  return data;
}

export async function recordSourceConflictResolution(workspaceId: string, input: SourceConflictResolutionInput) {
  const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  const { data, error } = await rpc("record_source_conflict_resolution", {
    target_workspace_id: workspaceId,
    idempotency_key: input.idempotencyKey,
    target_conflict_key: input.conflictId,
    resolution_input: {
      action: input.action,
      selectedProposalId: input.selectedProposalId,
      editedValue: input.editedValue,
      acceptedValueVersion: input.acceptedValueVersion,
      rationaleCategory: input.rationaleCategory,
      safeNote: input.safeNote,
    },
  });
  if (error) throw error;
  return data;
}

export function sourceConflictRuleRegistrySnapshot() {
  return sourceConflictRules
    .map(({ id, version, priority, enabled, subjectTypes }) => ({ id, version, priority, enabled, subjectTypes: [...subjectTypes] }))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}

export function buildSourceConflictReviewModel(conflict: SourceConflictResult) {
  return {
    title: titleFor(conflict.classification),
    summary: conflict.safeSummary,
    severity: conflict.materialityTier,
    currentValueLabel: "Current accepted value",
    proposedValueLabel: "Proposed value",
    sourceSummaries: conflict.sourceSummaries,
    availableActions: actionsFor(conflict),
    showInDecisionCockpit: conflict.materialityTier === "material" || conflict.materialityTier === "blocking_identity" || conflict.lifecycleState === "deferred",
  };
}

function normalizeValueInput(value: SourceConflictValue, role: SourceConflictValue["role"]): SourceConflictValue {
  return {
    ...value,
    role,
    proposalId: clean(value.proposalId),
    displayValue: clean(value.displayValue),
    unit: clean(value.unit),
    currency: clean(value.currency)?.toUpperCase(),
    period: clean(value.period),
    scope: clean(value.scope),
    effectiveDate: normalizeDate(value.effectiveDate),
    retrievedAt: clean(value.retrievedAt),
    sourceRecordId: clean(value.sourceRecordId),
    evidenceId: clean(value.evidenceId),
    sourceName: clean(value.sourceName),
    verificationState: clean(value.verificationState),
  };
}

function comparableValue(field: string, value: SourceConflictValue): ComparableValue {
  const raw = value.normalizedValue ?? value.rawValue ?? value.displayValue ?? "";
  const numeric = numericValue(raw);
  return {
    ...value,
    normalizedComparable: normalizeComparable(field, raw),
    numberValue: numeric,
    unitKey: normalizeUnit(value.unit),
    currencyKey: clean(value.currency)?.toUpperCase(),
    periodKey: normalizeToken(value.period),
    scopeKey: normalizeToken(value.scope),
    effectiveDateKey: normalizeDate(value.effectiveDate),
  };
}

function normalizeComparable(field: string, value: unknown) {
  const normalizedField = normalizeField(field);
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  const numeric = numericValue(value);
  if (numeric !== undefined && isNumericField(normalizedField)) return formatNumber(numeric);
  const text = String(value).trim().toLowerCase().replace(/\s+/g, " ");
  if (normalizedField.includes("address")) {
    return text.replace(/\b(street)\b/g, "st").replace(/\b(avenue)\b/g, "ave").replace(/\b(road)\b/g, "rd").replace(/\b(lane)\b/g, "ln").replace(/\b(court)\b/g, "ct").replace(/[^a-z0-9# ]+/g, " ").replace(/\s+/g, " ").trim();
  }
  if (normalizedField === "region" || normalizedField === "state") return normalizeState(text);
  if (normalizedField.includes("postal")) return text.replace(/[^0-9]/g, "").slice(0, 5);
  return text.replace(/[^\p{L}\p{N}.# -]+/gu, "").replace(/\s+/g, " ").trim();
}

function fallbackConflict(values: ComparableValue[]) {
  return {
    classification: values.length <= 1 ? "no_conflict" as const : "unresolved_ambiguity" as const,
    materialityTier: values.length <= 1 ? "informational" as const : "review" as const,
    deterministicExplanation: values.length <= 1 ? "Only one usable value exists for this field." : "Values require manual review because no deterministic rule could classify the difference.",
    safeSummary: values.length <= 1 ? "No competing value was found." : "BRIX found competing values that need review before this field is accepted.",
    downstreamSafety: safetyFor(values.length <= 1 ? "no_conflict" : "unresolved_ambiguity"),
  };
}

const sourceConflictRules: ConflictRule[] = [
  {
    id: "identity.duplicate_signal.conflict",
    version: 1,
    priority: 10,
    enabled: true,
    subjectTypes: ["property_identity", "deal_identity", "source_identity", "duplicate_identity", "property", "deal"],
    evaluate: (request) => {
      if (!request.duplicateContext?.hasIdentityConflict && !request.subjectType.includes("identity")) return null;
      return result("identity_conflict", "blocking_identity", "Identity signals point to more than one possible Property, Deal, or source. Return to identity review before accepting values.");
    },
  },
  {
    id: "classification.review_status.changed",
    version: 1,
    priority: 20,
    enabled: true,
    subjectTypes: ["source_classification", "source_identity", "manual_value", "listing_value", "file_value", "email_value", "batch_row_value"],
    evaluate: (request, values) => {
      if (request.subjectType !== "source_classification" && request.targetField !== "source_classification") return null;
      const classes = sortedUnique(values.map((value) => value.sourceClassification?.canonicalClass ?? value.normalizedComparable).filter(Boolean));
      if (classes.length <= 1) return result("no_conflict", "informational", "Source classification is consistent.");
      return result("material_conflict", "review", "The same source or value has competing source classifications. Review before routing extraction or downstream use.");
    },
  },
  {
    id: "value.normalized.equivalent",
    version: 1,
    priority: 30,
    enabled: true,
    subjectTypes: sourceConflictSubjectTypes,
    evaluate: (_request, values) => {
      const normalizedValues = sortedUnique(values.map((value) => value.normalizedComparable).filter(Boolean));
      if (normalizedValues.length <= 1) return result("no_conflict", "informational", "Values are equivalent after deterministic normalization.");
      return null;
    },
  },
  {
    id: "value.scope_or_period.informational",
    version: 1,
    priority: 40,
    enabled: true,
    subjectTypes: sourceConflictSubjectTypes,
    evaluate: (_request, values) => {
      const normalizedValues = sortedUnique(values.map((value) => value.normalizedComparable).filter(Boolean));
      if (normalizedValues.length <= 1) return null;
      const periods = sortedUnique(values.map((value) => value.periodKey).filter((value): value is string => Boolean(value)));
      const scopes = sortedUnique(values.map((value) => value.scopeKey).filter((value): value is string => Boolean(value)));
      if (periods.length > 1 || scopes.length > 1) return result("informational_difference", "informational", "Values differ but describe different periods or scopes, so BRIX preserves both instead of treating either as wrong.");
      return null;
    },
  },
  {
    id: "value.unit.conflict",
    version: 1,
    priority: 50,
    enabled: true,
    subjectTypes: sourceConflictSubjectTypes,
    evaluate: (_request, values) => {
      const units = sortedUnique(values.map((value) => value.unitKey).filter((value): value is string => Boolean(value)));
      const normalizedValues = sortedUnique(values.map((value) => value.normalizedComparable).filter(Boolean));
      if (units.length > 1 && normalizedValues.length > 1) return result("unit_scope_conflict", "review", "Values use different units. Review the unit or scope before accepting this field.");
      return null;
    },
  },
  {
    id: "value.effective_date.temporal",
    version: 1,
    priority: 60,
    enabled: true,
    subjectTypes: sourceConflictSubjectTypes,
    evaluate: (_request, values) => {
      const normalizedValues = sortedUnique(values.map((value) => value.normalizedComparable).filter(Boolean));
      const dates = sortedUnique(values.map((value) => value.effectiveDateKey).filter((value): value is string => Boolean(value)));
      if (normalizedValues.length > 1 && dates.length > 1) return result("temporal_change", "informational", "Values differ across effective dates. BRIX preserves the newer value as a possible temporal change until accepted.");
      return null;
    },
  },
  {
    id: "value.same_context.material",
    version: 1,
    priority: 70,
    enabled: true,
    subjectTypes: sourceConflictSubjectTypes,
    evaluate: (_request, values) => {
      const normalizedValues = sortedUnique(values.map((value) => value.normalizedComparable).filter(Boolean));
      if (normalizedValues.length > 1) return result("material_conflict", "material", "The same canonical field has competing values in the same context. BRIX will not overwrite the accepted value without explicit resolution.");
      return null;
    },
  },
  {
    id: "disabled.ai.semantic_judge",
    version: 1,
    priority: 999,
    enabled: false,
    subjectTypes: sourceConflictSubjectTypes,
    evaluate: () => result("unresolved_ambiguity", "review", "Disabled placeholder for future semantic review. It is never used by the deterministic registry."),
  },
];

const fallbackRule: ConflictRule = {
  id: "fallback.unresolved_ambiguity",
  version: 1,
  priority: 1000,
  enabled: true,
  subjectTypes: sourceConflictSubjectTypes,
  evaluate: () => null,
};

function result(classification: SourceConflictClassification, materialityTier: SourceConflictMaterialityTier, explanation: string) {
  return {
    classification,
    materialityTier,
    deterministicExplanation: explanation,
    safeSummary: summaryFor(classification),
    downstreamSafety: safetyFor(classification),
  };
}

function safetyFor(classification: SourceConflictClassification): SourceConflictDownstreamSafety {
  if (classification === "identity_conflict") {
    return {
      allowsIntakeCompletion: false,
      allowsDealCreation: false,
      allowsEvidenceAttachment: true,
      allowsPreliminaryAnalysis: false,
      blocksIdentityDependentProcessing: true,
      blocksAffectedFieldAcceptance: true,
      requiresManualReview: true,
    };
  }
  if (classification === "material_conflict" || classification === "unit_scope_conflict" || classification === "unresolved_ambiguity") {
    return {
      allowsIntakeCompletion: true,
      allowsDealCreation: true,
      allowsEvidenceAttachment: true,
      allowsPreliminaryAnalysis: classification !== "material_conflict",
      blocksIdentityDependentProcessing: false,
      blocksAffectedFieldAcceptance: true,
      requiresManualReview: true,
    };
  }
  return {
    allowsIntakeCompletion: true,
    allowsDealCreation: true,
    allowsEvidenceAttachment: true,
    allowsPreliminaryAnalysis: true,
    blocksIdentityDependentProcessing: false,
    blocksAffectedFieldAcceptance: false,
    requiresManualReview: false,
  };
}

function sourceSummary(value: ComparableValue): SourceConflictSourceSummary {
  return {
    role: value.role,
    proposalId: value.proposalId,
    sourceRecordId: value.sourceRecordId,
    evidenceId: value.evidenceId,
    sourceName: value.sourceName,
    sourceClass: value.sourceClassification?.canonicalClass,
    sourceSubtype: value.sourceClassification?.canonicalSubtype,
    effectiveDate: value.effectiveDateKey,
    retrievedAt: value.retrievedAt,
    verificationState: value.verificationState,
    anchorAvailable: Boolean(value.sourceAnchor),
  };
}

function actionsFor(conflict: SourceConflictResult): SourceConflictResolutionAction[] {
  if (conflict.classification === "identity_conflict") return ["return_to_identity_review", "cancel_intake_action", "defer"];
  if (conflict.classification === "no_conflict") return ["mark_not_conflict"];
  if (conflict.classification === "temporal_change") return ["preserve_as_temporal_change", "accept_proposal", "keep_current", "defer"];
  if (conflict.classification === "informational_difference" || conflict.classification === "unit_scope_conflict") return ["preserve_as_different_scope", "accept_edited_value", "defer"];
  return ["keep_current", "accept_proposal", "accept_edited_value", "mark_not_conflict", "defer"];
}

function serializeConflictForRpc(conflict: SourceConflictResult) {
  return {
    conflictId: conflict.conflictId,
    requestHash: conflict.requestHash,
    subjectType: conflict.subjectType,
    subjectId: conflict.subjectId,
    targetField: conflict.targetField,
    classification: conflict.classification,
    materialityTier: conflict.materialityTier,
    ruleId: conflict.ruleId,
    ruleVersion: conflict.ruleVersion,
    involvedProposalIds: conflict.involvedProposalIds,
    involvedAcceptedValueVersion: conflict.involvedAcceptedValueVersion,
    comparedNormalizedValues: conflict.comparedNormalizedValues,
    context: conflict.context,
    sourceSummaries: conflict.sourceSummaries,
    deterministicExplanation: conflict.deterministicExplanation,
    safeSummary: conflict.safeSummary,
    downstreamSafety: conflict.downstreamSafety,
    lifecycleState: conflict.lifecycleState,
    ruleRegistryVersion: conflict.ruleRegistryVersion,
    stableOrderingKey: conflict.stableOrderingKey,
  };
}

function summaryFor(classification: SourceConflictClassification) {
  switch (classification) {
    case "no_conflict": return "No competing source value needs review.";
    case "informational_difference": return "BRIX found a difference that may be valid because the source period or scope differs.";
    case "material_conflict": return "BRIX found competing values that must be resolved before this field can be trusted.";
    case "identity_conflict": return "BRIX found an identity conflict and will not continue identity-dependent processing until it is reviewed.";
    case "temporal_change": return "BRIX found a possible time-based change and preserved the history.";
    case "unit_scope_conflict": return "BRIX found a unit or scope mismatch that needs review.";
    case "unresolved_ambiguity": return "BRIX could not safely classify the competing values.";
  }
}

function titleFor(classification: SourceConflictClassification) {
  return classification.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function materialityRank(tier: SourceConflictMaterialityTier) {
  return { blocking_identity: "0", material: "1", review: "2", informational: "3" }[tier];
}

function classificationRank(classification: SourceConflictClassification) {
  return {
    identity_conflict: "0",
    material_conflict: "1",
    unit_scope_conflict: "2",
    unresolved_ambiguity: "3",
    temporal_change: "4",
    informational_difference: "5",
    no_conflict: "6",
  }[classification];
}

function isNumericField(field: string) {
  return /(price|value|tax|assessment|rent|insurance|hoa|area|size|sqft|square_feet|year|beds|baths|units|count|amount|balance|rate)/i.test(field);
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function normalizeField(value: unknown) {
  return clean(value)?.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") ?? "";
}

function normalizeToken(value: unknown) {
  return clean(value)?.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeUnit(value?: string) {
  const token = normalizeToken(value);
  if (!token) return undefined;
  if (["sf", "sq_ft", "sqft", "square_feet", "ft2"].includes(token)) return "sqft";
  if (["acre", "acres", "ac"].includes(token)) return "acre";
  if (["month", "monthly", "mo"].includes(token)) return "monthly";
  if (["year", "annual", "annually", "yr"].includes(token)) return "annual";
  return token;
}

function normalizeDate(value?: string) {
  const cleaned = clean(value);
  if (!cleaned) return undefined;
  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) return cleaned;
  return parsed.toISOString().slice(0, 10);
}

function normalizeState(value: string) {
  const states: Record<string, string> = { illinois: "il", california: "ca", florida: "fl", texas: "tx", indiana: "in", wisconsin: "wi" };
  return states[value] ?? value;
}

function sortedUnique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort();
}

function clean(value?: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).filter(([, entry]) => entry !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(",")}}`;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

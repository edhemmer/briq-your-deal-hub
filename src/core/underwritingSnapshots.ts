import {
  FORMULA_REGISTRY_VERSION,
  resolveFormulaDefinition,
  type FormulaId,
} from "./formulaRegistry";
import type { UnderwritingInputId } from "./underwritingInputSchemas";
import {
  UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
  UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
  type FormulaReadinessStatus,
  type NormalizedUnderwritingInput,
  type UnderwritingOverallValidationStatus,
  type UnderwritingValidationResult,
} from "./underwritingValidation";

export const UNDERWRITING_SNAPSHOT_CONTRACT_VERSION = "underwriting-snapshot-contract-v1";
export const UNDERWRITING_SNAPSHOT_HASH_VERSION = "underwriting-snapshot-content-hash-v1";

export type UnderwritingSnapshotReadinessState =
  | "ready_confirmed"
  | "ready_with_accepted_assumptions"
  | "preliminary"
  | "incomplete"
  | "invalid"
  | "blocked_conflict"
  | "unresolved_schema"
  | "unsupported";

export type UnderwritingSnapshotReason =
  | "initial_underwriting"
  | "accepted_input_changed"
  | "accepted_assumption_changed"
  | "source_conflict_resolved"
  | "schema_version_changed"
  | "formula_version_changed"
  | "user_requested_recalculation"
  | "retry";

export type UnderwritingSnapshotCreationErrorCode =
  | "authentication_required"
  | "workspace_required"
  | "deal_required"
  | "property_required"
  | "idempotency_required"
  | "validation_result_required"
  | "schema_unresolved"
  | "schema_unsupported"
  | "validation_invalid"
  | "blocked_conflict"
  | "idempotency_conflict";

export type UnderwritingSnapshotCreationError = {
  code: UnderwritingSnapshotCreationErrorCode;
  safeMessage: string;
};

export type UnderwritingSnapshotInputRecord = {
  inputId: UnderwritingInputId;
  requirementState: string;
  validationStatus: string;
  canonicalDataType: string;
  normalizedValue: string | number | boolean | null;
  displayValue: string;
  canonicalUnit: string;
  canonicalPeriod: string;
  canonicalCurrency?: string;
  rawAcceptedValueRef?: string | number | boolean | null;
  inputVersion?: string | number;
  completenessState: string;
  assumptionState: string;
  conflictState: string;
  precisionApplied?: unknown;
  roundingApplied: boolean;
  conversionApplied: boolean;
  conversionVersion?: string;
  deterministicInputHash: string;
  stableOrdinal: number;
};

export type UnderwritingSnapshotProvenanceReference = {
  inputId: UnderwritingInputId;
  sourceFactId?: string;
  acceptedAssumptionId?: string;
  preliminaryAssumptionId?: string;
  sourceRecordId?: string;
  evidenceId?: string;
  sourceAnchor?: string | Record<string, unknown>;
  sourceClassification?: string;
  verificationState?: string;
  stableOrdinal: number;
};

export type UnderwritingSnapshotFormulaManifestEntry = {
  formulaId: FormulaId;
  formulaVersion: string;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  supportedBySchema: boolean;
  readinessStatus: FormulaReadinessStatus;
  requiredInputIds: string[];
  missingInputIds: string[];
  blockedInputIds: string[];
  assumptionDependentInputIds: string[];
  preliminaryInputIds: string[];
  dependencyFormulaVersions: Array<{ formulaId: FormulaId; formulaVersion: string }>;
  executable: boolean;
  stableOrdinal: number;
};

export type UnderwritingSnapshotRecord = {
  snapshotId: string;
  workspaceId: string;
  dealId: string;
  primaryPropertyId?: string;
  propertyIds: string[];
  snapshotSequence: number;
  priorSnapshotId?: string;
  supersedesSnapshotId?: string;
  schemaId: string;
  schemaVersion: string;
  schemaRegistryVersion: string;
  inputRegistryVersion: string;
  validationRegistryVersion: typeof UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION;
  normalizationRegistryVersion: typeof UNDERWRITING_NORMALIZATION_REGISTRY_VERSION;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  snapshotContractVersion: typeof UNDERWRITING_SNAPSHOT_CONTRACT_VERSION;
  snapshotHashVersion: typeof UNDERWRITING_SNAPSHOT_HASH_VERSION;
  sourceValidationId: string;
  sourceValidationHash: string;
  dealVersion?: string | number;
  propertyVersions: Record<string, string | number>;
  calculationCurrency: string;
  unitSystem: "imperial" | "metric";
  valuationDate?: string;
  holdPeriodMonths?: number;
  intendedUnderwritingMode?: string;
  reportingPeriod: "monthly" | "annual" | "one_time";
  readinessState: UnderwritingSnapshotReadinessState;
  isExecutable: boolean;
  inputCount: number;
  missingRequiredInputIds: UnderwritingInputId[];
  invalidRequiredInputIds: UnderwritingInputId[];
  conflictedRequiredInputIds: UnderwritingInputId[];
  provisionalRequiredInputIds: UnderwritingInputId[];
  blockingReasons: string[];
  warnings: string[];
  contentHash: string;
  manifestHash: string;
  reason: UnderwritingSnapshotReason;
  actorId: string;
  idempotencyKey: string;
  createdAt: string;
  inputs: UnderwritingSnapshotInputRecord[];
  provenance: UnderwritingSnapshotProvenanceReference[];
  formulaManifest: UnderwritingSnapshotFormulaManifestEntry[];
};

export type UnderwritingSnapshotCreationRequest = {
  workspaceId: string;
  dealId: string;
  primaryPropertyId?: string;
  propertyIds: string[];
  validationResult: UnderwritingValidationResult;
  actorId: string;
  idempotencyKey: string;
  reason: UnderwritingSnapshotReason;
  createdAt: string;
  dealVersion?: string | number;
  propertyVersions?: Record<string, string | number>;
  calculationCurrency?: string;
  unitSystem?: "imperial" | "metric";
  valuationDate?: string;
  holdPeriodMonths?: number;
  intendedUnderwritingMode?: string;
  reportingPeriod?: "monthly" | "annual" | "one_time";
};

export type UnderwritingSnapshotCreationResult = {
  snapshot: UnderwritingSnapshotRecord;
  reusedByIdempotency: boolean;
  reusedByContentHash: boolean;
  supersededPriorSnapshotId?: string;
};

export type UnderwritingSnapshotStore = {
  findByIdempotencyKey(workspaceId: string, idempotencyKey: string): Promise<UnderwritingSnapshotRecord | undefined>;
  findByContentHash(workspaceId: string, dealId: string, contentHash: string): Promise<UnderwritingSnapshotRecord | undefined>;
  getLatestForDeal(workspaceId: string, dealId: string): Promise<UnderwritingSnapshotRecord | undefined>;
  saveSnapshot(snapshot: UnderwritingSnapshotRecord): Promise<UnderwritingSnapshotRecord>;
};

export type UnderwritingSnapshotSummaryProjection = {
  snapshotId: string;
  workspaceId: string;
  dealId: string;
  snapshotSequence: number;
  readinessState: UnderwritingSnapshotReadinessState;
  isExecutable: boolean;
  inputCount: number;
  missingRequiredInputCount: number;
  conflictedRequiredInputCount: number;
  provisionalRequiredInputCount: number;
  contentHash: string;
  createdAt: string;
  reason: UnderwritingSnapshotReason;
};

export type UnderwritingSnapshotComparisonBasis = {
  leftSnapshotId: string;
  rightSnapshotId: string;
  sameContentHash: boolean;
  changedInputIds: string[];
  changedFormulaIds: string[];
  readinessChanged: boolean;
};

export async function createUnderwritingSnapshot(
  request: UnderwritingSnapshotCreationRequest,
  store: UnderwritingSnapshotStore,
): Promise<UnderwritingSnapshotCreationResult> {
  const draft = buildUnderwritingSnapshotDraft(request);
  if (draft.errors.length) throw snapshotError(draft.errors[0].code, draft.errors[0].safeMessage);

  const byIdempotency = await store.findByIdempotencyKey(draft.snapshot.workspaceId, draft.snapshot.idempotencyKey);
  if (byIdempotency) {
    if (byIdempotency.contentHash !== draft.snapshot.contentHash) {
      throw snapshotError("idempotency_conflict", "This underwriting snapshot retry key was already used with different inputs.");
    }
    return { snapshot: deepFreeze(byIdempotency), reusedByIdempotency: true, reusedByContentHash: false };
  }

  const byContent = await store.findByContentHash(draft.snapshot.workspaceId, draft.snapshot.dealId, draft.snapshot.contentHash);
  if (byContent) {
    return { snapshot: deepFreeze(byContent), reusedByIdempotency: false, reusedByContentHash: true };
  }

  const latest = await store.getLatestForDeal(draft.snapshot.workspaceId, draft.snapshot.dealId);
  const snapshot = deepFreeze({
    ...draft.snapshot,
    snapshotSequence: (latest?.snapshotSequence ?? 0) + 1,
    priorSnapshotId: latest?.snapshotId,
    supersedesSnapshotId: latest?.snapshotId,
  });
  const saved = await store.saveSnapshot(snapshot);
  return {
    snapshot: deepFreeze(saved),
    reusedByIdempotency: false,
    reusedByContentHash: false,
    supersededPriorSnapshotId: latest?.snapshotId,
  };
}

export function buildUnderwritingSnapshotDraft(request: UnderwritingSnapshotCreationRequest): {
  snapshot: UnderwritingSnapshotRecord;
  errors: UnderwritingSnapshotCreationError[];
} {
  const errors = validateSnapshotRequest(request);
  const validation = request.validationResult;
  const readinessState = readinessFromValidationStatus(validation?.overallStatus);
  const inputs = buildSnapshotInputs(validation?.normalizedInputs ?? []);
  const provenance = buildProvenance(inputs, validation?.normalizedInputs ?? []);
  const formulaManifest = buildFormulaManifest(validation);
  const manifestHash = stableHash({
    version: FORMULA_REGISTRY_VERSION,
    formulas: formulaManifest.map((entry) => ({
      formulaId: entry.formulaId,
      formulaVersion: entry.formulaVersion,
      readinessStatus: entry.readinessStatus,
      requiredInputIds: entry.requiredInputIds,
      missingInputIds: entry.missingInputIds,
      blockedInputIds: entry.blockedInputIds,
      assumptionDependentInputIds: entry.assumptionDependentInputIds,
      preliminaryInputIds: entry.preliminaryInputIds,
      dependencyFormulaVersions: entry.dependencyFormulaVersions,
    })),
  });
  const propertyIds = sortedUniqueStrings(request.propertyIds);
  const contentBasis = {
    snapshotHashVersion: UNDERWRITING_SNAPSHOT_HASH_VERSION,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    primaryPropertyId: request.primaryPropertyId,
    propertyIds,
    schemaId: validation?.schemaId,
    schemaVersion: validation?.schemaVersion,
    schemaRegistryVersion: validation?.schemaRegistryVersion,
    inputRegistryVersion: validation?.inputRegistryVersion,
    validationRegistryVersion: validation?.validationRegistryVersion,
    normalizationRegistryVersion: validation?.normalizationRegistryVersion,
    formulaRegistryVersion: validation?.formulaRegistryVersion,
    sourceValidationId: validation?.validationId,
    sourceValidationHash: validation?.deterministicResultHash,
    dealVersion: request.dealVersion,
    propertyVersions: stableObject(request.propertyVersions ?? {}),
    calculationCurrency: request.calculationCurrency ?? "USD",
    unitSystem: request.unitSystem ?? "imperial",
    valuationDate: request.valuationDate,
    holdPeriodMonths: request.holdPeriodMonths,
    intendedUnderwritingMode: request.intendedUnderwritingMode,
    reportingPeriod: request.reportingPeriod ?? "annual",
    readinessState,
    inputs,
    provenance,
    manifestHash,
  };

  const snapshot: UnderwritingSnapshotRecord = {
    snapshotId: snapshotIdFromHash(stableHash(contentBasis)),
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    primaryPropertyId: request.primaryPropertyId,
    propertyIds,
    snapshotSequence: 0,
    schemaId: validation?.schemaId ?? "",
    schemaVersion: validation?.schemaVersion ?? "",
    schemaRegistryVersion: validation?.schemaRegistryVersion ?? "",
    inputRegistryVersion: validation?.inputRegistryVersion ?? "",
    validationRegistryVersion: validation?.validationRegistryVersion ?? UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
    normalizationRegistryVersion: validation?.normalizationRegistryVersion ?? UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
    formulaRegistryVersion: validation?.formulaRegistryVersion ?? FORMULA_REGISTRY_VERSION,
    snapshotContractVersion: UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
    snapshotHashVersion: UNDERWRITING_SNAPSHOT_HASH_VERSION,
    sourceValidationId: validation?.validationId ?? "",
    sourceValidationHash: validation?.deterministicResultHash ?? "",
    dealVersion: request.dealVersion,
    propertyVersions: stableObject(request.propertyVersions ?? {}) as Record<string, string | number>,
    calculationCurrency: request.calculationCurrency ?? "USD",
    unitSystem: request.unitSystem ?? "imperial",
    valuationDate: request.valuationDate,
    holdPeriodMonths: request.holdPeriodMonths,
    intendedUnderwritingMode: request.intendedUnderwritingMode,
    reportingPeriod: request.reportingPeriod ?? "annual",
    readinessState,
    isExecutable: readinessState === "ready_confirmed" || readinessState === "ready_with_accepted_assumptions",
    inputCount: inputs.length,
    missingRequiredInputIds: [...(validation?.missingRequiredInputs ?? [])].sort(),
    invalidRequiredInputIds: [...(validation?.invalidRequiredInputs ?? [])].sort(),
    conflictedRequiredInputIds: [...(validation?.conflictedRequiredInputs ?? [])].sort(),
    provisionalRequiredInputIds: [...(validation?.provisionalRequiredInputs ?? [])].sort(),
    blockingReasons: [...(validation?.blockingReasons ?? [])].sort(),
    warnings: [...(validation?.warnings ?? [])].sort(),
    contentHash: stableHash(contentBasis),
    manifestHash,
    reason: request.reason,
    actorId: request.actorId,
    idempotencyKey: request.idempotencyKey.trim(),
    createdAt: request.createdAt,
    inputs,
    provenance,
    formulaManifest,
  };

  return { snapshot: deepFreeze(snapshot), errors };
}

export function summarizeUnderwritingSnapshot(snapshot: UnderwritingSnapshotRecord): UnderwritingSnapshotSummaryProjection {
  return {
    snapshotId: snapshot.snapshotId,
    workspaceId: snapshot.workspaceId,
    dealId: snapshot.dealId,
    snapshotSequence: snapshot.snapshotSequence,
    readinessState: snapshot.readinessState,
    isExecutable: snapshot.isExecutable,
    inputCount: snapshot.inputCount,
    missingRequiredInputCount: snapshot.missingRequiredInputIds.length,
    conflictedRequiredInputCount: snapshot.conflictedRequiredInputIds.length,
    provisionalRequiredInputCount: snapshot.provisionalRequiredInputIds.length,
    contentHash: snapshot.contentHash,
    createdAt: snapshot.createdAt,
    reason: snapshot.reason,
  };
}

export function compareUnderwritingSnapshots(left: UnderwritingSnapshotRecord, right: UnderwritingSnapshotRecord): UnderwritingSnapshotComparisonBasis {
  const leftInputs = new Map(left.inputs.map((input) => [input.inputId, input.deterministicInputHash]));
  const rightInputs = new Map(right.inputs.map((input) => [input.inputId, input.deterministicInputHash]));
  const inputIds = sortedUniqueStrings([...leftInputs.keys(), ...rightInputs.keys()]);
  const leftFormulaMap = new Map(left.formulaManifest.map((entry) => [entry.formulaId, stableHash(entry)]));
  const rightFormulaMap = new Map(right.formulaManifest.map((entry) => [entry.formulaId, stableHash(entry)]));
  const formulaIds = sortedUniqueStrings([...leftFormulaMap.keys(), ...rightFormulaMap.keys()]);
  return {
    leftSnapshotId: left.snapshotId,
    rightSnapshotId: right.snapshotId,
    sameContentHash: left.contentHash === right.contentHash,
    changedInputIds: inputIds.filter((id) => leftInputs.get(id as UnderwritingInputId) !== rightInputs.get(id as UnderwritingInputId)),
    changedFormulaIds: formulaIds.filter((id) => leftFormulaMap.get(id as FormulaId) !== rightFormulaMap.get(id as FormulaId)),
    readinessChanged: left.readinessState !== right.readinessState,
  };
}

function validateSnapshotRequest(request: UnderwritingSnapshotCreationRequest): UnderwritingSnapshotCreationError[] {
  const errors: UnderwritingSnapshotCreationError[] = [];
  if (!request.actorId?.trim()) errors.push({ code: "authentication_required", safeMessage: "Authentication is required to create an underwriting snapshot." });
  if (!request.workspaceId?.trim()) errors.push({ code: "workspace_required", safeMessage: "Workspace is required to create an underwriting snapshot." });
  if (!request.dealId?.trim()) errors.push({ code: "deal_required", safeMessage: "Deal is required to create an underwriting snapshot." });
  if (!request.propertyIds?.length) errors.push({ code: "property_required", safeMessage: "At least one Property is required to create an underwriting snapshot." });
  if (!request.idempotencyKey?.trim()) errors.push({ code: "idempotency_required", safeMessage: "A retry key is required to safely create an underwriting snapshot." });
  if (!request.validationResult) errors.push({ code: "validation_result_required", safeMessage: "A validation result is required to create an underwriting snapshot." });

  const readiness = readinessFromValidationStatus(request.validationResult?.overallStatus);
  if (readiness === "unresolved_schema") errors.push({ code: "schema_unresolved", safeMessage: "Resolve the underwriting schema before creating a snapshot." });
  if (readiness === "unsupported") errors.push({ code: "schema_unsupported", safeMessage: "This underwriting schema or engine version is not supported." });
  if (readiness === "invalid") errors.push({ code: "validation_invalid", safeMessage: "Fix invalid underwriting inputs before creating a snapshot." });
  if (readiness === "blocked_conflict") errors.push({ code: "blocked_conflict", safeMessage: "Resolve material source conflicts before creating a snapshot." });
  return errors;
}

function readinessFromValidationStatus(status?: UnderwritingOverallValidationStatus): UnderwritingSnapshotReadinessState {
  if (status === "valid") return "ready_confirmed";
  if (status === "valid_with_accepted_assumptions") return "ready_with_accepted_assumptions";
  if (status === "preliminary") return "preliminary";
  if (status === "incomplete") return "incomplete";
  if (status === "blocked_conflict") return "blocked_conflict";
  if (status === "unresolved_schema") return "unresolved_schema";
  if (status === "unsupported") return "unsupported";
  return "invalid";
}

function buildSnapshotInputs(inputs: NormalizedUnderwritingInput[]): UnderwritingSnapshotInputRecord[] {
  return [...inputs]
    .sort((a, b) => a.inputId.localeCompare(b.inputId))
    .map((input, index) => ({
      inputId: input.inputId,
      requirementState: input.schemaRequirementState,
      validationStatus: input.validationStatus,
      canonicalDataType: input.canonicalDataType,
      normalizedValue: input.normalizedValue,
      displayValue: input.displayValue,
      canonicalUnit: input.canonicalUnit,
      canonicalPeriod: input.canonicalPeriod,
      canonicalCurrency: input.canonicalCurrency,
      rawAcceptedValueRef: input.rawValue,
      inputVersion: input.inputVersion,
      completenessState: input.completenessState,
      assumptionState: input.assumptionState,
      conflictState: input.conflictState,
      precisionApplied: input.precisionApplied,
      roundingApplied: input.roundingApplied,
      conversionApplied: input.conversionApplied,
      conversionVersion: input.conversionVersion,
      deterministicInputHash: input.deterministicNormalizedValueHash,
      stableOrdinal: index + 1,
    }));
}

function buildProvenance(snapshotInputs: UnderwritingSnapshotInputRecord[], normalizedInputs: NormalizedUnderwritingInput[]): UnderwritingSnapshotProvenanceReference[] {
  const byInput = new Map(normalizedInputs.map((input) => [input.inputId, input]));
  return snapshotInputs
    .map((snapshotInput, index) => {
      const input = byInput.get(snapshotInput.inputId);
      return {
        inputId: snapshotInput.inputId,
        sourceFactId: input?.sourceFactId,
        acceptedAssumptionId: input?.acceptedAssumptionId,
        preliminaryAssumptionId: input?.preliminaryAssumptionId,
        sourceRecordId: input?.sourceRecordId,
        evidenceId: input?.evidenceId,
        sourceAnchor: input?.sourceAnchor,
        verificationState: input?.completenessState === "missing" ? "missing" : input?.assumptionState ?? input?.validationStatus,
        stableOrdinal: index + 1,
      };
    })
    .filter((item) => Boolean(item.sourceFactId || item.acceptedAssumptionId || item.preliminaryAssumptionId || item.sourceRecordId || item.evidenceId || item.sourceAnchor));
}

function buildFormulaManifest(validation: UnderwritingValidationResult): UnderwritingSnapshotFormulaManifestEntry[] {
  return [...validation.formulaReadiness]
    .filter((formula) => !["formula_disabled", "unsupported_schema", "version_not_found"].includes(formula.status))
    .sort((a, b) => a.formulaId.localeCompare(b.formulaId))
    .map((formula, index) => {
      const definition = resolveFormulaDefinition(formula.formulaId, formula.formulaVersion ?? "latest");
      const formulaVersion = formula.formulaVersion ?? definition?.semanticVersion ?? "unknown";
      return {
        formulaId: formula.formulaId,
        formulaVersion,
        formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
        supportedBySchema: true,
        readinessStatus: formula.status,
        requiredInputIds: [...formula.requiredInputIds].sort(),
        missingInputIds: [...formula.missingInputIds].sort(),
        blockedInputIds: [...formula.invalidInputIds, ...formula.conflictedInputIds].sort(),
        assumptionDependentInputIds: [...formula.assumptionInputIds].sort(),
        preliminaryInputIds: [...formula.preliminaryInputIds].sort(),
        dependencyFormulaVersions: (definition?.dependencies ?? [])
          .map((dependency) => ({ formulaId: dependency.formulaId, formulaVersion: dependency.version }))
          .sort((a, b) => a.formulaId.localeCompare(b.formulaId)),
        executable: formula.status === "ready_confirmed" || formula.status === "ready_with_accepted_assumptions",
        stableOrdinal: index + 1,
      };
    });
}

function snapshotIdFromHash(hash: string) {
  return `snapshot_${hash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`;
}

function snapshotError(code: UnderwritingSnapshotCreationErrorCode, safeMessage: string) {
  const error = new Error(safeMessage) as Error & { code: UnderwritingSnapshotCreationErrorCode };
  error.code = code;
  return error;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      if (child && typeof child === "object") deepFreeze(child);
    }
  }
  return value;
}

function stableHash(value: unknown) {
  const text = stableSerialize(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(",")}}`;
}

function stableObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stableObject(entry)]));
  }
  return value;
}

function sortedUniqueStrings(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

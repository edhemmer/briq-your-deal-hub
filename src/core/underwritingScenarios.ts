import { FORMULA_REGISTRY_VERSION, type FormulaId, type FormulaPeriod, type FormulaUnit } from "./formulaRegistry";
import { resolveUnderwritingInputDefinition, type UnderwritingInputId } from "./underwritingInputSchemas";
import {
  buildUnderwritingCoreOutputRun,
  type UnderwritingCoreFormulaResultRecord,
  type UnderwritingCoreOutputRunRecord,
  type UnderwritingCoreOutputRunRequest,
  type UnderwritingRunStatus,
} from "./underwritingCoreOutputs";
import {
  buildUnderwritingSnapshotDraft,
  type UnderwritingSnapshotCreationRequest,
  type UnderwritingSnapshotInputRecord,
  type UnderwritingSnapshotRecord,
} from "./underwritingSnapshots";
import {
  PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
  UNDERWRITING_INPUT_REGISTRY_VERSION,
} from "./underwritingInputSchemas";
import {
  UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
  UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
  validateAndNormalizeUnderwritingInputs,
  type NormalizedUnderwritingInput,
  type UnderwritingRawInputValue,
  type UnderwritingValidationRequest,
  type UnderwritingValidationResult,
} from "./underwritingValidation";

export const UNDERWRITING_SCENARIO_CONTRACT_VERSION = "underwriting-scenario-contract-v1";
export const UNDERWRITING_SCENARIO_HASH_VERSION = "underwriting-scenario-hash-v1";

export type UnderwritingScenarioType =
  | "custom"
  | "financing"
  | "income"
  | "expense"
  | "acquisition"
  | "operating"
  | "sensitivity_point";

export type UnderwritingScenarioStatus =
  | "draft"
  | "validating"
  | "ready"
  | "calculating"
  | "complete"
  | "complete_with_warnings"
  | "preliminary"
  | "incomplete"
  | "blocked"
  | "failed"
  | "cancelled";

export type UnderwritingScenarioAssumptionClassification =
  | "user_scenario_assumption"
  | "accepted_underwriting_assumption"
  | "preliminary_scenario_assumption";

export type UnderwritingScenarioErrorCode =
  | "base_snapshot_not_found"
  | "base_snapshot_stale"
  | "base_run_not_found"
  | "base_run_incomplete"
  | "scenario_not_found"
  | "scenario_immutable"
  | "scenario_override_invalid"
  | "input_not_sensitivity_eligible"
  | "prohibited_override"
  | "unsupported_unit"
  | "unsupported_period"
  | "unsupported_currency"
  | "blocked_conflict"
  | "assumption_not_allowed"
  | "relationship_validation_failed"
  | "formula_manifest_mismatch"
  | "invalid_sensitivity_range"
  | "sensitivity_limit_exceeded"
  | "duplicate_sensitivity_point"
  | "scenario_run_failed"
  | "comparison_not_available"
  | "formula_version_mismatch"
  | "idempotency_conflict"
  | "unauthorized_scenario"
  | "internal_scenario_error";

export type UnderwritingScenarioError = {
  code: UnderwritingScenarioErrorCode;
  safeMessage: string;
  inputId?: UnderwritingInputId;
};

export type UnderwritingScenarioOverrideRequest = {
  inputId: UnderwritingInputId;
  proposedRawValue: string | number | boolean | null;
  originalUnit?: FormulaUnit;
  originalPeriod?: FormulaPeriod;
  currency?: string;
  assumptionClassification: UnderwritingScenarioAssumptionClassification;
  rationaleCategory?: "user_test" | "financing_term" | "income_assumption" | "expense_assumption" | "acquisition_assumption" | "operating_assumption";
  userNote?: string;
  sourceProvenanceType?: "scenario_user_entry" | "base_snapshot_reference";
};

export type UnderwritingScenarioOverrideRecord = {
  scenarioOverrideId: string;
  scenarioId: string;
  inputId: UnderwritingInputId;
  baseNormalizedValue: string | number | boolean | null;
  proposedRawValue: string | number | boolean | null;
  normalizedOverrideValue: string | number | boolean | null;
  originalUnit?: FormulaUnit;
  canonicalUnit: FormulaUnit;
  originalPeriod?: FormulaPeriod;
  canonicalPeriod: FormulaPeriod;
  currency?: string;
  validationStatus: string;
  assumptionClassification: UnderwritingScenarioAssumptionClassification;
  rationaleCategory?: string;
  userNote?: string;
  sourceProvenanceType: "scenario_user_entry" | "base_snapshot_reference";
  conversionApplied: boolean;
  normalizationVersion: typeof UNDERWRITING_NORMALIZATION_REGISTRY_VERSION;
  validationRuleVersion: typeof UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION;
  deterministicOverrideHash: string;
  stableOrdinal: number;
};

export type UnderwritingScenarioDefinitionRecord = {
  scenarioId: string;
  workspaceId: string;
  dealId: string;
  baseSnapshotId: string;
  baseRunId: string;
  scenarioName: string;
  description?: string;
  scenarioType: UnderwritingScenarioType;
  status: UnderwritingScenarioStatus;
  schemaId: string;
  schemaVersion: string;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  overrideCount: number;
  readinessState: string;
  confidenceState: "confirmed_inputs" | "accepted_assumptions" | "preliminary" | "incomplete" | "blocked";
  scenarioContentHash: string;
  idempotencyKey: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  version: number;
};

export type UnderwritingScenarioSnapshotRecord = {
  scenarioSnapshotId: string;
  scenarioId: string;
  baseSnapshotId: string;
  baseSnapshotHash: string;
  scenarioSnapshot: UnderwritingSnapshotRecord;
  changedInputIds: UnderwritingInputId[];
  unchangedInputIds: UnderwritingInputId[];
  overrideHashes: string[];
  validationId: string;
  validationHash: string;
  scenarioSnapshotHash: string;
};

export type UnderwritingScenarioComparisonOutput = {
  formulaId: FormulaId;
  stableOrdinal: number;
  changeType: "added" | "removed" | "changed" | "unchanged";
  statusChanged: boolean;
  confidenceChanged: boolean;
  formulaVersionMatches: boolean;
  baseStatus?: string;
  scenarioStatus?: string;
  baseRawValue?: number;
  scenarioRawValue?: number;
  rawDelta?: number;
  percentageDelta?: number;
  percentageDeltaUnavailableReason?: "base_zero" | "missing_numeric_value" | "formula_version_mismatch";
};

export type UnderwritingScenarioComparisonRecord = {
  baseRunId: string;
  scenarioRunId: string;
  baseSnapshotId: string;
  scenarioSnapshotId: string;
  changedInputIds: UnderwritingInputId[];
  addedOutputIds: FormulaId[];
  removedOutputIds: FormulaId[];
  changedOutputIds: FormulaId[];
  unchangedOutputIds: FormulaId[];
  statusChangedOutputIds: FormulaId[];
  confidenceChangedOutputIds: FormulaId[];
  warningChanges: string[];
  formulaVersionConfirmation: "all_match" | "mismatch";
  outputs: UnderwritingScenarioComparisonOutput[];
  comparisonHash: string;
};

export type UnderwritingScenarioRunRecord = {
  scenario: UnderwritingScenarioDefinitionRecord;
  overrides: UnderwritingScenarioOverrideRecord[];
  scenarioSnapshot: UnderwritingScenarioSnapshotRecord;
  scenarioRun: UnderwritingCoreOutputRunRecord;
  comparison: UnderwritingScenarioComparisonRecord;
  warnings: string[];
  errors: UnderwritingScenarioError[];
};

export type UnderwritingScenarioRunRequest = {
  workspaceId: string;
  dealId: string;
  baseSnapshot: UnderwritingSnapshotRecord;
  baseRun: UnderwritingCoreOutputRunRecord;
  scenarioName: string;
  description?: string;
  scenarioType: UnderwritingScenarioType;
  overrides: UnderwritingScenarioOverrideRequest[];
  actorId: string;
  idempotencyKey: string;
  requestedAt: string;
  version?: number;
};

export const UNDERWRITING_SENSITIVITY_LIMITS = Object.freeze({
  maxSensitivityPoints: 25,
  minStepAbs: 0.0001,
  maxConcurrentPointExecution: 4,
  maxTargetFormulaIds: 12,
  maxRetainedErrors: 25,
  maxResultSetSize: 250,
});

export type UnderwritingSensitivityMethod = "explicit_points" | "linear_range";

export type UnderwritingSensitivityDefinitionRequest = {
  workspaceId: string;
  dealId: string;
  baseSnapshot: UnderwritingSnapshotRecord;
  baseRun: UnderwritingCoreOutputRunRecord;
  inputId: UnderwritingInputId;
  method: UnderwritingSensitivityMethod;
  explicitPoints?: Array<string | number>;
  minimumValue?: number;
  maximumValue?: number;
  stepValue?: number;
  unit?: FormulaUnit;
  period?: FormulaPeriod;
  currency?: string;
  targetFormulaIds: FormulaId[];
  actorId: string;
  idempotencyKey: string;
  requestedAt: string;
};

export type UnderwritingSensitivityDefinitionRecord = {
  sensitivityId: string;
  workspaceId: string;
  dealId: string;
  baseSnapshotId: string;
  baseRunId: string;
  inputId: UnderwritingInputId;
  method: UnderwritingSensitivityMethod;
  minimumValue?: number;
  maximumValue?: number;
  stepValue?: number;
  explicitPoints: number[];
  unit: FormulaUnit;
  period: FormulaPeriod;
  currency?: string;
  pointCount: number;
  targetFormulaIds: FormulaId[];
  status: UnderwritingScenarioStatus;
  contentHash: string;
  idempotencyKey: string;
  createdBy: string;
  createdAt: string;
  version: number;
};

export type UnderwritingSensitivityPointRecord = {
  pointId: string;
  sensitivityId: string;
  pointOrdinal: number;
  testedInputValue: number;
  scenarioRun: UnderwritingScenarioRunRecord;
  targetOutputs: Array<{
    formulaId: FormulaId;
    status?: string;
    rawValue?: number;
    displayText?: string;
    resultHash?: string;
  }>;
  status: UnderwritingRunStatus;
  resultSetHash: string;
  warnings: string[];
  errors: UnderwritingScenarioError[];
};

export type UnderwritingSensitivityRunRecord = {
  definition: UnderwritingSensitivityDefinitionRecord;
  points: UnderwritingSensitivityPointRecord[];
  completedPointCount: number;
  failedPointCount: number;
  warnings: string[];
  errors: UnderwritingScenarioError[];
};

const prohibitedScenarioInputIds = new Set<UnderwritingInputId>(["property_type"]);

export function buildUnderwritingScenarioRun(request: UnderwritingScenarioRunRequest): UnderwritingScenarioRunRecord {
  const errors = validateScenarioRequest(request);
  if (errors.length) return failedScenarioRecord(request, errors);

  const scenarioBasis = {
    contractVersion: UNDERWRITING_SCENARIO_CONTRACT_VERSION,
    hashVersion: UNDERWRITING_SCENARIO_HASH_VERSION,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    baseSnapshotId: request.baseSnapshot.snapshotId,
    baseSnapshotHash: request.baseSnapshot.contentHash,
    baseRunId: request.baseRun.runId,
    baseResultSetHash: request.baseRun.resultSetHash,
    scenarioName: request.scenarioName.trim(),
    description: request.description?.trim(),
    scenarioType: request.scenarioType,
    overrides: request.overrides.map(stableOverrideRequest).sort((a, b) => a.inputId.localeCompare(b.inputId)),
    version: request.version ?? 1,
  };
  const scenarioContentHash = stableHash(scenarioBasis);
  const scenarioId = scenarioIdFromHash(stableHash({ scenarioContentHash, idempotencyKey: request.idempotencyKey.trim() }));

  const derivedValidationRequest = buildScenarioValidationRequest(request, scenarioId);
  const validation = validateAndNormalizeUnderwritingInputs(derivedValidationRequest);
  const overrideRecords = buildOverrideRecords(scenarioId, request.baseSnapshot, request.overrides, validation);
  const scenarioSnapshotDraft = buildUnderwritingSnapshotDraft(snapshotRequestForScenario(request, validation, scenarioId, scenarioContentHash));
  if (scenarioSnapshotDraft.errors.length) {
    return failedScenarioRecord(request, scenarioSnapshotDraft.errors.map((error) => scenarioError(mapSnapshotError(error.code), error.safeMessage)));
  }

  const scenarioSnapshot = scenarioSnapshotDraft.snapshot;
  const scenarioRun = buildUnderwritingCoreOutputRun(scenarioSnapshot, coreOutputRequestForScenario(request, scenarioSnapshot, scenarioId, scenarioContentHash));
  const comparison = compareScenarioToBase(request.baseSnapshot, request.baseRun, scenarioSnapshot, scenarioRun, overrideRecords.map((item) => item.inputId));
  const confidenceState = confidenceStateForScenario(scenarioRun, overrideRecords, scenarioSnapshot);
  const status = scenarioStatusForRun(scenarioRun.status, validation, overrideRecords);
  const changedInputIds = overrideRecords.map((item) => item.inputId).sort();
  const unchangedInputIds = request.baseSnapshot.inputs.map((input) => input.inputId).filter((inputId) => !changedInputIds.includes(inputId)).sort();
  const scenario: UnderwritingScenarioDefinitionRecord = {
    scenarioId,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    baseSnapshotId: request.baseSnapshot.snapshotId,
    baseRunId: request.baseRun.runId,
    scenarioName: request.scenarioName.trim(),
    description: request.description?.trim(),
    scenarioType: request.scenarioType,
    status,
    schemaId: scenarioSnapshot.schemaId,
    schemaVersion: scenarioSnapshot.schemaVersion,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    overrideCount: overrideRecords.length,
    readinessState: scenarioSnapshot.readinessState,
    confidenceState,
    scenarioContentHash,
    idempotencyKey: request.idempotencyKey.trim(),
    createdBy: request.actorId,
    createdAt: request.requestedAt,
    completedAt: status === "complete" || status === "complete_with_warnings" || status === "preliminary" ? request.requestedAt : undefined,
    version: request.version ?? 1,
  };

  return deepFreeze({
    scenario,
    overrides: overrideRecords,
    scenarioSnapshot: {
      scenarioSnapshotId: scenarioSnapshotIdFromHash(stableHash({ scenarioId, snapshotId: scenarioSnapshot.snapshotId, snapshotHash: scenarioSnapshot.contentHash })),
      scenarioId,
      baseSnapshotId: request.baseSnapshot.snapshotId,
      baseSnapshotHash: request.baseSnapshot.contentHash,
      scenarioSnapshot,
      changedInputIds,
      unchangedInputIds,
      overrideHashes: overrideRecords.map((item) => item.deterministicOverrideHash).sort(),
      validationId: validation.validationId,
      validationHash: validation.deterministicResultHash,
      scenarioSnapshotHash: scenarioSnapshot.contentHash,
    },
    scenarioRun,
    comparison,
    warnings: sortedUniqueStrings([...validation.warnings, ...scenarioRun.warnings]),
    errors: [],
  });
}

export function buildUnderwritingSensitivityRun(request: UnderwritingSensitivityDefinitionRequest): UnderwritingSensitivityRunRecord {
  const errors = validateSensitivityRequest(request);
  if (errors.length) {
    return deepFreeze({
      definition: failedSensitivityDefinition(request, errors),
      points: [],
      completedPointCount: 0,
      failedPointCount: 0,
      warnings: [],
      errors,
    });
  }

  const points = sensitivityPoints(request);
  const contentHash = stableHash({
    version: UNDERWRITING_SCENARIO_CONTRACT_VERSION,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    baseSnapshotId: request.baseSnapshot.snapshotId,
    baseSnapshotHash: request.baseSnapshot.contentHash,
    baseRunId: request.baseRun.runId,
    baseResultSetHash: request.baseRun.resultSetHash,
    inputId: request.inputId,
    method: request.method,
    points,
    targetFormulaIds: sortedUniqueStrings(request.targetFormulaIds),
  });
  const sensitivityId = sensitivityIdFromHash(stableHash({ contentHash, idempotencyKey: request.idempotencyKey.trim() }));
  const definition = deepFreeze({
    sensitivityId,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    baseSnapshotId: request.baseSnapshot.snapshotId,
    baseRunId: request.baseRun.runId,
    inputId: request.inputId,
    method: request.method,
    minimumValue: request.method === "linear_range" ? request.minimumValue : undefined,
    maximumValue: request.method === "linear_range" ? request.maximumValue : undefined,
    stepValue: request.method === "linear_range" ? request.stepValue : undefined,
    explicitPoints: points,
    unit: request.unit ?? resolveUnderwritingInputDefinition(request.inputId)?.canonicalUnit ?? "unitless",
    period: request.period ?? resolveUnderwritingInputDefinition(request.inputId)?.canonicalPeriod ?? "none",
    currency: request.currency,
    pointCount: points.length,
    targetFormulaIds: sortedUniqueStrings(request.targetFormulaIds) as FormulaId[],
    status: "calculating",
    contentHash,
    idempotencyKey: request.idempotencyKey.trim(),
    createdBy: request.actorId,
    createdAt: request.requestedAt,
    version: 1,
  } satisfies UnderwritingSensitivityDefinitionRecord);

  const pointRecords = points.map((point, index) => {
    const scenarioRun = buildUnderwritingScenarioRun({
      workspaceId: request.workspaceId,
      dealId: request.dealId,
      baseSnapshot: request.baseSnapshot,
      baseRun: request.baseRun,
      scenarioName: `Sensitivity ${request.inputId} ${formatPoint(point)}`,
      scenarioType: "sensitivity_point",
      overrides: [{
        inputId: request.inputId,
        proposedRawValue: point,
        originalUnit: definition.unit,
        originalPeriod: definition.period,
        currency: definition.currency,
        assumptionClassification: "user_scenario_assumption",
        rationaleCategory: "user_test",
        sourceProvenanceType: "scenario_user_entry",
      }],
      actorId: request.actorId,
      idempotencyKey: `${request.idempotencyKey.trim()}:point:${index + 1}:${stableHash(point)}`,
      requestedAt: request.requestedAt,
      version: 1,
    });
    return deepFreeze({
      pointId: sensitivityPointIdFromHash(stableHash({ sensitivityId, point, ordinal: index + 1, scenarioId: scenarioRun.scenario.scenarioId })),
      sensitivityId,
      pointOrdinal: index + 1,
      testedInputValue: point,
      scenarioRun,
      targetOutputs: definition.targetFormulaIds.map((formulaId) => {
        const result = scenarioRun.scenarioRun.results.find((item) => item.formulaId === formulaId);
        return {
          formulaId,
          status: result?.status,
          rawValue: result?.rawValue,
          displayText: result?.displayText,
          resultHash: result?.deterministicHash,
        };
      }),
      status: scenarioRun.scenarioRun.status,
      resultSetHash: scenarioRun.scenarioRun.resultSetHash,
      warnings: scenarioRun.warnings,
      errors: scenarioRun.errors,
    } satisfies UnderwritingSensitivityPointRecord);
  });

  const failedPointCount = pointRecords.filter((point) => point.status === "failed" || point.errors.length > 0).length;
  return deepFreeze({
    definition: {
      ...definition,
      status: failedPointCount > 0 ? "complete_with_warnings" : "complete",
    },
    points: pointRecords,
    completedPointCount: pointRecords.length - failedPointCount,
    failedPointCount,
    warnings: sortedUniqueStrings(pointRecords.flatMap((point) => point.warnings)),
    errors: pointRecords.flatMap((point) => point.errors).slice(0, UNDERWRITING_SENSITIVITY_LIMITS.maxRetainedErrors),
  });
}

export function projectScenarioSummary(record: UnderwritingScenarioRunRecord) {
  return {
    scenarioId: record.scenario.scenarioId,
    name: record.scenario.scenarioName,
    type: record.scenario.scenarioType,
    baseSnapshotSequence: record.scenarioSnapshot.scenarioSnapshot.snapshotSequence,
    status: record.scenario.status,
    changedInputCount: record.overrides.length,
    readiness: record.scenario.readinessState,
    confidenceState: record.scenario.confidenceState,
    runStatus: record.scenarioRun.status,
    warnings: record.warnings,
    createdDate: record.scenario.createdAt,
    resultSetShortHash: shortHash(record.scenarioRun.resultSetHash),
  };
}

export function projectScenarioOverrides(record: UnderwritingScenarioRunRecord) {
  return record.overrides.map((override) => ({
    inputId: override.inputId,
    baseValue: override.baseNormalizedValue,
    scenarioValue: override.normalizedOverrideValue,
    validationStatus: override.validationStatus,
    assumptionClassification: override.assumptionClassification,
    hash: override.deterministicOverrideHash,
    stableOrdinal: override.stableOrdinal,
  }));
}

export function projectScenarioComparison(record: UnderwritingScenarioRunRecord) {
  return record.comparison.outputs;
}

export function projectSensitivityPoints(record: UnderwritingSensitivityRunRecord) {
  return record.points.map((point) => ({
    pointOrdinal: point.pointOrdinal,
    testedInputValue: point.testedInputValue,
    targetOutputs: point.targetOutputs,
    status: point.status,
    warnings: point.warnings,
    resultSetHash: point.resultSetHash,
  }));
}

function validateScenarioRequest(request: UnderwritingScenarioRunRequest): UnderwritingScenarioError[] {
  const errors: UnderwritingScenarioError[] = [];
  if (!request.workspaceId || request.workspaceId !== request.baseSnapshot?.workspaceId || request.workspaceId !== request.baseRun?.workspaceId) errors.push(scenarioError("unauthorized_scenario", "Scenario workspace must match the base snapshot and run."));
  if (!request.dealId || request.dealId !== request.baseSnapshot?.dealId || request.dealId !== request.baseRun?.dealId) errors.push(scenarioError("unauthorized_scenario", "Scenario Deal must match the base snapshot and run."));
  if (!request.actorId?.trim()) errors.push(scenarioError("unauthorized_scenario", "Authentication is required to run a scenario."));
  if (!request.idempotencyKey?.trim()) errors.push(scenarioError("idempotency_conflict", "A retry key is required to run a scenario safely."));
  if (!request.scenarioName?.trim()) errors.push(scenarioError("scenario_override_invalid", "A scenario name is required."));
  if (!request.baseSnapshot) errors.push(scenarioError("base_snapshot_not_found", "Base underwriting snapshot is unavailable."));
  if (!request.baseRun) errors.push(scenarioError("base_run_not_found", "Base Core Outputs run is unavailable."));
  if (request.baseSnapshot && request.baseRun && request.baseRun.snapshotId !== request.baseSnapshot.snapshotId) errors.push(scenarioError("base_run_not_found", "Base run does not belong to the selected base snapshot."));
  if (request.baseSnapshot && request.baseRun && request.baseRun.snapshotHash !== request.baseSnapshot.contentHash) errors.push(scenarioError("base_snapshot_stale", "Base run no longer matches the base snapshot hash."));
  if (request.baseRun && !["complete", "complete_with_warnings", "preliminary"].includes(request.baseRun.status)) errors.push(scenarioError("base_run_incomplete", "A scenario requires a completed or preliminary base Core Outputs run."));
  if (!request.overrides.length) errors.push(scenarioError("scenario_override_invalid", "At least one explicit scenario override is required."));

  const inputIds = new Set<UnderwritingInputId>();
  for (const override of request.overrides) {
    if (inputIds.has(override.inputId)) errors.push(scenarioError("scenario_override_invalid", "Each scenario input may be changed only once.", override.inputId));
    inputIds.add(override.inputId);
    const definition = resolveUnderwritingInputDefinition(override.inputId);
    const baseInput = request.baseSnapshot?.inputs.find((input) => input.inputId === override.inputId);
    if (!definition || definition.status !== "active") errors.push(scenarioError("scenario_override_invalid", "Scenario input is not in the active underwriting input registry.", override.inputId));
    if (definition?.dataType === "derived") errors.push(scenarioError("scenario_override_invalid", "Derived underwriting outputs cannot be overridden.", override.inputId));
    if (prohibitedScenarioInputIds.has(override.inputId) || definition?.category === "identity") errors.push(scenarioError("prohibited_override", "Property identity and classification require a new base snapshot, not a scenario override.", override.inputId));
    if (!baseInput) errors.push(scenarioError("scenario_override_invalid", "Only inputs present in the base snapshot may be changed in this slice.", override.inputId));
    if (baseInput?.requirementState === "not_applicable" || baseInput?.requirementState === "prohibited") errors.push(scenarioError("scenario_override_invalid", "Not-applicable and prohibited inputs cannot be changed in a scenario.", override.inputId));
    if (baseInput?.conflictState === "unresolved") errors.push(scenarioError("blocked_conflict", "Resolve source conflicts before using an input in a scenario.", override.inputId));
  }
  return errors;
}

function validateSensitivityRequest(request: UnderwritingSensitivityDefinitionRequest): UnderwritingScenarioError[] {
  const errors = validateScenarioRequest({
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    baseSnapshot: request.baseSnapshot,
    baseRun: request.baseRun,
    scenarioName: "Sensitivity validation",
    scenarioType: "sensitivity_point",
    overrides: [{
      inputId: request.inputId,
      proposedRawValue: request.method === "explicit_points" ? request.explicitPoints?.[0] ?? null : request.minimumValue ?? null,
      assumptionClassification: "user_scenario_assumption",
    }],
    actorId: request.actorId,
    idempotencyKey: request.idempotencyKey,
    requestedAt: request.requestedAt,
  }).filter((error) => error.code !== "scenario_override_invalid" || error.inputId);
  const definition = resolveUnderwritingInputDefinition(request.inputId);
  if (!definition?.sensitivityEligible || definition.dataType === "derived") errors.push(scenarioError("input_not_sensitivity_eligible", "This input is not eligible for one-variable sensitivity.", request.inputId));
  if (request.targetFormulaIds.length === 0 || request.targetFormulaIds.length > UNDERWRITING_SENSITIVITY_LIMITS.maxTargetFormulaIds) errors.push(scenarioError("sensitivity_limit_exceeded", "Select between one and the allowed maximum number of target outputs."));
  const points = safeSensitivityPoints(request);
  if (points.ok === false) errors.push(points.error);
  return errors;
}

function buildScenarioValidationRequest(request: UnderwritingScenarioRunRequest, scenarioId: string): UnderwritingValidationRequest {
  const rawInputs = Object.fromEntries(request.baseSnapshot.inputs.map((input) => [input.inputId, rawFromSnapshotInput(input)])) as Record<string, UnderwritingRawInputValue>;
  for (const override of request.overrides) {
    const definition = resolveUnderwritingInputDefinition(override.inputId);
    rawInputs[override.inputId] = {
      inputId: override.inputId,
      rawValue: override.proposedRawValue,
      sourceUnit: override.originalUnit ?? definition?.canonicalUnit,
      sourcePeriod: override.originalPeriod ?? definition?.canonicalPeriod,
      sourceCurrency: override.currency ?? (definition?.currencyBehavior === "required" ? request.baseSnapshot.calculationCurrency : undefined),
      acceptedAssumptionId: override.assumptionClassification === "preliminary_scenario_assumption" ? undefined : `${scenarioId}:${override.inputId}`,
      preliminaryAssumptionId: override.assumptionClassification === "preliminary_scenario_assumption" ? `${scenarioId}:${override.inputId}` : undefined,
      inputVersion: `scenario:${scenarioId}:${override.inputId}`,
      classification: override.assumptionClassification === "preliminary_scenario_assumption" ? "preliminary_assumption" : "accepted_user_assumption",
      verificationState: "user_entered",
      conflictState: "none",
      proposalStatus: "accepted",
      sourceClassification: "manual",
    };
  }
  return {
    validationId: validationIdFromHash(stableHash({ scenarioId, baseSnapshotId: request.baseSnapshot.snapshotId, overrides: request.overrides.map(stableOverrideRequest) })),
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyIds: request.baseSnapshot.propertyIds,
    schemaId: request.baseSnapshot.schemaId,
    schemaVersion: request.baseSnapshot.schemaVersion,
    schemaRegistryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
    inputRegistryVersion: UNDERWRITING_INPUT_REGISTRY_VERSION,
    validationRegistryVersion: UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
    normalizationRegistryVersion: UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    calculationCurrency: request.baseSnapshot.calculationCurrency,
    calculationPeriodContext: periodContextFromSnapshot(request.baseSnapshot),
    inputs: rawInputs,
    requestTimestamp: request.requestedAt,
    authorization: {
      actorId: request.actorId,
      workspaceId: request.workspaceId,
      dealWorkspaceId: request.workspaceId,
      propertyWorkspaceId: request.workspaceId,
      membershipStatus: "active",
      permissions: ["underwriting.read", "underwriting.update", "deal.read", "property.read"],
    },
    authorizedSubjectIds: {
      workspaceIds: [request.workspaceId],
      dealIds: [request.dealId],
      propertyIds: request.baseSnapshot.propertyIds,
    },
  };
}

function snapshotRequestForScenario(
  request: UnderwritingScenarioRunRequest,
  validationResult: UnderwritingValidationResult,
  scenarioId: string,
  scenarioContentHash: string,
): UnderwritingSnapshotCreationRequest {
  return {
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    primaryPropertyId: request.baseSnapshot.primaryPropertyId,
    propertyIds: request.baseSnapshot.propertyIds,
    validationResult,
    actorId: request.actorId,
    idempotencyKey: `${request.idempotencyKey.trim()}:scenario-snapshot:${scenarioContentHash}`,
    reason: "user_requested_recalculation",
    createdAt: request.requestedAt,
    dealVersion: request.baseSnapshot.dealVersion,
    propertyVersions: request.baseSnapshot.propertyVersions,
    calculationCurrency: request.baseSnapshot.calculationCurrency,
    unitSystem: request.baseSnapshot.unitSystem,
    valuationDate: request.baseSnapshot.valuationDate,
    holdPeriodMonths: request.baseSnapshot.holdPeriodMonths,
    intendedUnderwritingMode: request.baseSnapshot.intendedUnderwritingMode,
    reportingPeriod: request.baseSnapshot.reportingPeriod,
  };
}

function coreOutputRequestForScenario(
  request: UnderwritingScenarioRunRequest,
  scenarioSnapshot: UnderwritingSnapshotRecord,
  scenarioId: string,
  scenarioContentHash: string,
): UnderwritingCoreOutputRunRequest {
  return {
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    snapshotId: scenarioSnapshot.snapshotId,
    expectedSnapshotHash: scenarioSnapshot.contentHash,
    actorId: request.actorId,
    idempotencyKey: `${request.idempotencyKey.trim()}:scenario-run:${scenarioId}:${scenarioContentHash}`,
    requestedAt: request.requestedAt,
  };
}

function buildOverrideRecords(
  scenarioId: string,
  baseSnapshot: UnderwritingSnapshotRecord,
  overrides: UnderwritingScenarioOverrideRequest[],
  validation: UnderwritingValidationResult,
): UnderwritingScenarioOverrideRecord[] {
  const normalizedById = new Map(validation.normalizedInputs.map((input) => [input.inputId, input]));
  return overrides
    .map((override, index) => {
      const baseInput = baseSnapshot.inputs.find((input) => input.inputId === override.inputId);
      const normalized = normalizedById.get(override.inputId);
      const deterministicOverrideHash = stableHash({
        scenarioId,
        inputId: override.inputId,
        baseNormalizedValue: baseInput?.normalizedValue ?? null,
        proposedRawValue: override.proposedRawValue,
        normalizedOverrideValue: normalized?.normalizedValue ?? null,
        unit: normalized?.canonicalUnit,
        period: normalized?.canonicalPeriod,
        currency: normalized?.canonicalCurrency,
        validationStatus: normalized?.validationStatus,
        assumptionClassification: override.assumptionClassification,
      });
      return deepFreeze({
        scenarioOverrideId: scenarioOverrideIdFromHash(stableHash({ scenarioId, deterministicOverrideHash })),
        scenarioId,
        inputId: override.inputId,
        baseNormalizedValue: baseInput?.normalizedValue ?? null,
        proposedRawValue: override.proposedRawValue,
        normalizedOverrideValue: normalized?.normalizedValue ?? null,
        originalUnit: normalized?.originalUnit ?? override.originalUnit,
        canonicalUnit: normalized?.canonicalUnit ?? resolveUnderwritingInputDefinition(override.inputId)?.canonicalUnit ?? "unitless",
        originalPeriod: normalized?.originalPeriod ?? override.originalPeriod,
        canonicalPeriod: normalized?.canonicalPeriod ?? resolveUnderwritingInputDefinition(override.inputId)?.canonicalPeriod ?? "none",
        currency: normalized?.canonicalCurrency ?? override.currency,
        validationStatus: normalized?.validationStatus ?? "invalid_type",
        assumptionClassification: override.assumptionClassification,
        rationaleCategory: override.rationaleCategory,
        userNote: override.userNote?.trim(),
        sourceProvenanceType: override.sourceProvenanceType ?? "scenario_user_entry",
        conversionApplied: normalized?.conversionApplied ?? false,
        normalizationVersion: UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
        validationRuleVersion: UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
        deterministicOverrideHash,
        stableOrdinal: index + 1,
      } satisfies UnderwritingScenarioOverrideRecord);
    })
    .sort((a, b) => a.inputId.localeCompare(b.inputId))
    .map((record, index) => deepFreeze({ ...record, stableOrdinal: index + 1 }));
}

function compareScenarioToBase(
  baseSnapshot: UnderwritingSnapshotRecord,
  baseRun: UnderwritingCoreOutputRunRecord,
  scenarioSnapshot: UnderwritingSnapshotRecord,
  scenarioRun: UnderwritingCoreOutputRunRecord,
  changedInputIds: UnderwritingInputId[],
): UnderwritingScenarioComparisonRecord {
  const baseByFormula = new Map(baseRun.results.map((result) => [result.formulaId, result]));
  const scenarioByFormula = new Map(scenarioRun.results.map((result) => [result.formulaId, result]));
  const formulaIds = sortedUniqueStrings([...baseByFormula.keys(), ...scenarioByFormula.keys()]) as FormulaId[];
  const outputs = formulaIds.map((formulaId, index) => compareFormulaResult(formulaId, baseByFormula.get(formulaId), scenarioByFormula.get(formulaId), index + 1));
  const addedOutputIds = outputs.filter((item) => item.changeType === "added").map((item) => item.formulaId);
  const removedOutputIds = outputs.filter((item) => item.changeType === "removed").map((item) => item.formulaId);
  const changedOutputIds = outputs.filter((item) => item.changeType === "changed").map((item) => item.formulaId);
  const unchangedOutputIds = outputs.filter((item) => item.changeType === "unchanged").map((item) => item.formulaId);
  const statusChangedOutputIds = outputs.filter((item) => item.statusChanged).map((item) => item.formulaId);
  const confidenceChangedOutputIds = outputs.filter((item) => item.confidenceChanged).map((item) => item.formulaId);
  const formulaVersionConfirmation: UnderwritingScenarioComparisonRecord["formulaVersionConfirmation"] = outputs.every((item) => item.formulaVersionMatches) ? "all_match" : "mismatch";
  const warningChanges = sortedUniqueStrings([...baseRun.warnings, ...scenarioRun.warnings]);
  const basis = {
    baseRunId: baseRun.runId,
    scenarioRunId: scenarioRun.runId,
    baseSnapshotId: baseSnapshot.snapshotId,
    scenarioSnapshotId: scenarioSnapshot.snapshotId,
    changedInputIds,
    addedOutputIds,
    removedOutputIds,
    changedOutputIds,
    unchangedOutputIds,
    statusChangedOutputIds,
    confidenceChangedOutputIds,
    warningChanges,
    formulaVersionConfirmation,
    outputs,
  };
  return deepFreeze({
    ...basis,
    comparisonHash: stableHash(basis),
  });
}

function compareFormulaResult(
  formulaId: FormulaId,
  base?: UnderwritingCoreFormulaResultRecord,
  scenario?: UnderwritingCoreFormulaResultRecord,
  stableOrdinal = 1,
): UnderwritingScenarioComparisonOutput {
  const formulaVersionMatches = !base || !scenario || base.formulaVersion === scenario.formulaVersion;
  const rawDelta = formulaVersionMatches && typeof base?.rawValue === "number" && typeof scenario?.rawValue === "number"
    ? round(scenario.rawValue - base.rawValue, 8)
    : undefined;
  const percentageDelta = rawDelta !== undefined && typeof base?.rawValue === "number" && base.rawValue !== 0
    ? round(rawDelta / Math.abs(base.rawValue), 8)
    : undefined;
  const percentageDeltaUnavailableReason = percentageDelta === undefined
    ? !formulaVersionMatches ? "formula_version_mismatch" : typeof base?.rawValue !== "number" || typeof scenario?.rawValue !== "number" ? "missing_numeric_value" : "base_zero"
    : undefined;
  const statusChanged = base?.status !== scenario?.status;
  const valueChanged = base?.deterministicHash !== scenario?.deterministicHash;
  const confidenceChanged = confidenceStateForResult(base) !== confidenceStateForResult(scenario);
  return {
    formulaId,
    stableOrdinal,
    changeType: !base ? "added" : !scenario ? "removed" : valueChanged || statusChanged || confidenceChanged ? "changed" : "unchanged",
    statusChanged,
    confidenceChanged,
    formulaVersionMatches,
    baseStatus: base?.status,
    scenarioStatus: scenario?.status,
    baseRawValue: base?.rawValue,
    scenarioRawValue: scenario?.rawValue,
    rawDelta,
    percentageDelta,
    percentageDeltaUnavailableReason,
  };
}

function rawFromSnapshotInput(input: UnderwritingSnapshotInputRecord): UnderwritingRawInputValue {
  return {
    inputId: input.inputId,
    rawValue: input.rawAcceptedValueRef ?? input.normalizedValue,
    sourceUnit: input.canonicalUnit as FormulaUnit,
    sourcePeriod: input.canonicalPeriod as FormulaPeriod,
    sourceCurrency: input.canonicalCurrency,
    sourceFactId: input.assumptionState === "none" ? `snapshot:${input.deterministicInputHash}` : undefined,
    acceptedAssumptionId: input.assumptionState === "accepted" ? `snapshot:${input.deterministicInputHash}` : undefined,
    preliminaryAssumptionId: input.assumptionState === "preliminary_allowed" ? `snapshot:${input.deterministicInputHash}` : undefined,
    inputVersion: input.inputVersion,
    classification: classificationFromSnapshotInput(input),
    verificationState: input.completenessState === "confirmed" ? "source_backed" : "user_entered",
    conflictState: input.conflictState === "unresolved" ? "unresolved" : "none",
    proposalStatus: "accepted",
    sourceClassification: "manual",
  };
}

function classificationFromSnapshotInput(input: UnderwritingSnapshotInputRecord): UnderwritingRawInputValue["classification"] {
  if (input.assumptionState === "accepted") return "accepted_user_assumption";
  if (input.assumptionState === "preliminary_allowed") return "preliminary_assumption";
  if (input.canonicalDataType === "derived") return "descriptive_input";
  return "accepted_fact";
}

function periodContextFromSnapshot(snapshot: UnderwritingSnapshotRecord) {
  const input = (id: UnderwritingInputId) => snapshot.inputs.find((item) => item.inputId === id)?.normalizedValue;
  const numeric = (id: UnderwritingInputId) => typeof input(id) === "number" ? input(id) as number : undefined;
  return {
    defaultPeriod: snapshot.reportingPeriod,
    unitCount: numeric("unit_count"),
    rentableSquareFeet: numeric("rentable_square_feet"),
    grossBuildingArea: numeric("gross_building_area"),
  };
}

function sensitivityPoints(request: UnderwritingSensitivityDefinitionRequest): number[] {
  const result = safeSensitivityPoints(request);
  if (result.ok === false) throw scenarioException(result.error);
  return result.points;
}

function safeSensitivityPoints(request: UnderwritingSensitivityDefinitionRequest): { ok: true; points: number[] } | { ok: false; error: UnderwritingScenarioError } {
  let points: number[] = [];
  if (request.method === "explicit_points") {
    points = (request.explicitPoints ?? []).map(Number).filter((value) => Number.isFinite(value));
  } else {
    const min = request.minimumValue;
    const max = request.maximumValue;
    const step = request.stepValue;
    if (typeof min !== "number" || typeof max !== "number" || typeof step !== "number" || !Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step)) {
      return { ok: false, error: scenarioError("invalid_sensitivity_range", "Linear sensitivity requires numeric minimum, maximum, and step values.") };
    }
    if (Math.abs(step) < UNDERWRITING_SENSITIVITY_LIMITS.minStepAbs) return { ok: false, error: scenarioError("invalid_sensitivity_range", "Sensitivity step must be non-zero and above the minimum step size.") };
    if ((max - min) * step < 0) return { ok: false, error: scenarioError("invalid_sensitivity_range", "Sensitivity step direction must move from minimum to maximum.") };
    for (let value = min, guard = 0; step > 0 ? value <= max + 1e-10 : value >= max - 1e-10; value += step, guard += 1) {
      points.push(round(value, 8));
      if (guard > UNDERWRITING_SENSITIVITY_LIMITS.maxSensitivityPoints) break;
    }
  }
  points = [...new Set(points.map((value) => round(value, 8)))].sort((a, b) => a - b);
  if (points.length === 0) return { ok: false, error: scenarioError("invalid_sensitivity_range", "Sensitivity must include at least one valid point.") };
  if (points.length > UNDERWRITING_SENSITIVITY_LIMITS.maxSensitivityPoints) return { ok: false, error: scenarioError("sensitivity_limit_exceeded", "Sensitivity point count exceeds the centralized BRIX limit.") };
  if (points.length > UNDERWRITING_SENSITIVITY_LIMITS.maxResultSetSize) return { ok: false, error: scenarioError("sensitivity_limit_exceeded", "Sensitivity result set exceeds the centralized BRIX limit.") };
  return { ok: true, points };
}

function scenarioStatusForRun(status: UnderwritingRunStatus, validation: UnderwritingValidationResult, overrides: UnderwritingScenarioOverrideRecord[]): UnderwritingScenarioStatus {
  if (status === "complete" && overrides.some((override) => override.assumptionClassification === "preliminary_scenario_assumption")) return "preliminary";
  if (status === "complete" && validation.overallStatus === "valid_with_accepted_assumptions") return "complete";
  if (status === "complete_with_warnings") return "complete_with_warnings";
  if (status === "preliminary" || validation.overallStatus === "preliminary") return "preliminary";
  if (status === "incomplete" || validation.overallStatus === "incomplete") return "incomplete";
  if (status === "blocked" || validation.overallStatus === "blocked_conflict") return "blocked";
  if (status === "failed") return "failed";
  return "complete";
}

function confidenceStateForScenario(
  run: UnderwritingCoreOutputRunRecord,
  overrides: UnderwritingScenarioOverrideRecord[],
  snapshot: UnderwritingSnapshotRecord,
): UnderwritingScenarioDefinitionRecord["confidenceState"] {
  if (run.status === "blocked" || snapshot.readinessState === "blocked_conflict") return "blocked";
  if (run.status === "incomplete" || snapshot.readinessState === "incomplete") return "incomplete";
  if (overrides.some((override) => override.assumptionClassification === "preliminary_scenario_assumption") || run.status === "preliminary") return "preliminary";
  if (overrides.length > 0 || run.assumptionDisclosures.length > 0) return "accepted_assumptions";
  return "confirmed_inputs";
}

function confidenceStateForResult(result?: UnderwritingCoreFormulaResultRecord) {
  if (!result) return "missing";
  if (result.status === "blocked_conflict") return "blocked";
  if (result.status === "incomplete") return "incomplete";
  if (result.status === "preliminary" || result.preliminaryInputIds.length > 0) return "preliminary";
  if (result.assumptionIds.length > 0 || result.assumptionDisclosure.length > 0) return "accepted_assumptions";
  return "confirmed_inputs";
}

function failedScenarioRecord(request: UnderwritingScenarioRunRequest, errors: UnderwritingScenarioError[]): UnderwritingScenarioRunRecord {
  const scenarioContentHash = stableHash({
    failed: true,
    baseSnapshotId: request.baseSnapshot?.snapshotId,
    baseRunId: request.baseRun?.runId,
    idempotencyKey: request.idempotencyKey,
    errors,
  });
  const scenarioId = scenarioIdFromHash(scenarioContentHash);
  const scenario: UnderwritingScenarioDefinitionRecord = {
    scenarioId,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    baseSnapshotId: request.baseSnapshot?.snapshotId ?? "",
    baseRunId: request.baseRun?.runId ?? "",
    scenarioName: request.scenarioName?.trim() || "Invalid scenario",
    description: request.description?.trim(),
    scenarioType: request.scenarioType,
    status: "failed",
    schemaId: request.baseSnapshot?.schemaId ?? "",
    schemaVersion: request.baseSnapshot?.schemaVersion ?? "",
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    overrideCount: request.overrides?.length ?? 0,
    readinessState: "failed",
    confidenceState: "blocked",
    scenarioContentHash,
    idempotencyKey: request.idempotencyKey?.trim() ?? "",
    createdBy: request.actorId,
    createdAt: request.requestedAt,
    version: request.version ?? 1,
  };
  const emptySnapshot = request.baseSnapshot ?? ({
    snapshotId: "",
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    contentHash: "",
    manifestHash: "",
    formulaManifest: [],
    inputs: [],
    provenance: [],
    propertyIds: [],
  } as UnderwritingSnapshotRecord);
  const emptyRun = request.baseRun ?? ({
    runId: "",
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    snapshotId: emptySnapshot.snapshotId,
    snapshotHash: emptySnapshot.contentHash,
    snapshotManifestHash: emptySnapshot.manifestHash,
    engineVersion: "underwriting-core-output-run-v1",
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    hashVersion: "underwriting-core-output-result-set-hash-v1",
    status: "failed",
    requestedBy: request.actorId,
    idempotencyKey: request.idempotencyKey ?? "",
    requestedAt: request.requestedAt,
    startedAt: request.requestedAt,
    completedAt: request.requestedAt,
    calculationOrder: [],
    resultSetHash: scenarioContentHash,
    dependencyGraphHash: scenarioContentHash,
    formulaVersionManifestHash: scenarioContentHash,
    resultCount: 0,
    calculatedResultCount: 0,
    warningCount: 0,
    blockedResultCount: 0,
    incompleteResultCount: 0,
    preliminaryResultCount: 0,
    warnings: [],
    errors: errors.map((error) => error.safeMessage),
    assumptionDisclosures: [],
    snapshotReadinessState: "failed",
    results: [],
  } as UnderwritingCoreOutputRunRecord);
  return deepFreeze({
    scenario,
    overrides: [],
    scenarioSnapshot: {
      scenarioSnapshotId: scenarioSnapshotIdFromHash(scenarioContentHash),
      scenarioId,
      baseSnapshotId: emptySnapshot.snapshotId,
      baseSnapshotHash: emptySnapshot.contentHash,
      scenarioSnapshot: emptySnapshot,
      changedInputIds: [],
      unchangedInputIds: [],
      overrideHashes: [],
      validationId: "",
      validationHash: "",
      scenarioSnapshotHash: emptySnapshot.contentHash,
    },
    scenarioRun: emptyRun,
    comparison: {
      baseRunId: emptyRun.runId,
      scenarioRunId: emptyRun.runId,
      baseSnapshotId: emptySnapshot.snapshotId,
      scenarioSnapshotId: emptySnapshot.snapshotId,
      changedInputIds: [],
      addedOutputIds: [],
      removedOutputIds: [],
      changedOutputIds: [],
      unchangedOutputIds: [],
      statusChangedOutputIds: [],
      confidenceChangedOutputIds: [],
      warningChanges: [],
      formulaVersionConfirmation: "all_match",
      outputs: [],
      comparisonHash: scenarioContentHash,
    },
    warnings: [],
    errors,
  });
}

function failedSensitivityDefinition(request: UnderwritingSensitivityDefinitionRequest, errors: UnderwritingScenarioError[]): UnderwritingSensitivityDefinitionRecord {
  const contentHash = stableHash({ failed: true, errors, inputId: request.inputId, baseSnapshotId: request.baseSnapshot?.snapshotId });
  return {
    sensitivityId: sensitivityIdFromHash(contentHash),
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    baseSnapshotId: request.baseSnapshot?.snapshotId ?? "",
    baseRunId: request.baseRun?.runId ?? "",
    inputId: request.inputId,
    method: request.method,
    explicitPoints: [],
    unit: request.unit ?? resolveUnderwritingInputDefinition(request.inputId)?.canonicalUnit ?? "unitless",
    period: request.period ?? resolveUnderwritingInputDefinition(request.inputId)?.canonicalPeriod ?? "none",
    currency: request.currency,
    pointCount: 0,
    targetFormulaIds: [],
    status: "failed",
    contentHash,
    idempotencyKey: request.idempotencyKey,
    createdBy: request.actorId,
    createdAt: request.requestedAt,
    version: 1,
  };
}

function stableOverrideRequest(override: UnderwritingScenarioOverrideRequest) {
  return {
    inputId: override.inputId,
    proposedRawValue: override.proposedRawValue,
    originalUnit: override.originalUnit,
    originalPeriod: override.originalPeriod,
    currency: override.currency,
    assumptionClassification: override.assumptionClassification,
    rationaleCategory: override.rationaleCategory,
    userNote: override.userNote?.trim(),
    sourceProvenanceType: override.sourceProvenanceType ?? "scenario_user_entry",
  };
}

function mapSnapshotError(code: string): UnderwritingScenarioErrorCode {
  if (code === "blocked_conflict") return "blocked_conflict";
  if (code === "idempotency_conflict") return "idempotency_conflict";
  if (code === "validation_invalid") return "scenario_override_invalid";
  return "internal_scenario_error";
}

function scenarioError(code: UnderwritingScenarioErrorCode, safeMessage: string, inputId?: UnderwritingInputId): UnderwritingScenarioError {
  return { code, safeMessage, inputId };
}

function scenarioException(error: UnderwritingScenarioError) {
  const err = new Error(error.safeMessage) as Error & { code: UnderwritingScenarioErrorCode; inputId?: UnderwritingInputId };
  err.code = error.code;
  err.inputId = error.inputId;
  return err;
}

function validationIdFromHash(hash: string) {
  return `validation_scenario_${hash.replace(/[^a-z0-9]/gi, "_")}`;
}

function scenarioIdFromHash(hash: string) {
  return `scenario_${hash.replace(/[^a-z0-9]/gi, "_")}`;
}

function scenarioOverrideIdFromHash(hash: string) {
  return `scenario_override_${hash.replace(/[^a-z0-9]/gi, "_")}`;
}

function scenarioSnapshotIdFromHash(hash: string) {
  return `scenario_snapshot_${hash.replace(/[^a-z0-9]/gi, "_")}`;
}

function sensitivityIdFromHash(hash: string) {
  return `sensitivity_${hash.replace(/[^a-z0-9]/gi, "_")}`;
}

function sensitivityPointIdFromHash(hash: string) {
  return `sensitivity_point_${hash.replace(/[^a-z0-9]/gi, "_")}`;
}

function shortHash(hash: string) {
  return hash.split(":").pop()?.slice(0, 8) ?? hash.slice(0, 8);
}

function formatPoint(point: number) {
  return Number.isInteger(point) ? String(point) : point.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function round(value: number, scale: number) {
  const factor = 10 ** scale;
  return Math.round(value * factor) / factor;
}

function sortedUniqueStrings<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort() as T[];
}

function stableHash(value: unknown) {
  const stringified = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < stringified.length; index += 1) {
    hash ^= stringified.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const property of Object.values(value as Record<string, unknown>)) {
      deepFreeze(property);
    }
  }
  return value;
}

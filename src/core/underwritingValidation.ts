import {
  FORMULA_REGISTRY_VERSION,
  applyPrecision,
  listFormulaDefinitions,
  resolveFormulaDefinition,
  type FormulaId,
  type FormulaPeriod,
  type FormulaPrecisionRule,
  type FormulaUnit,
} from "./formulaRegistry";
import type { CanonicalSourceClass } from "./sourceClassification";
import {
  PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
  UNDERWRITING_INPUT_REGISTRY_VERSION,
  authorizeUnderwritingSchemaAccess,
  evaluateConditionalRequirements,
  listUnderwritingInputDefinitions,
  projectInputStates,
  resolvePropertyUnderwritingSchema,
  resolveUnderwritingInputDefinition,
  type PropertyUnderwritingSchema,
  type UnderwritingConflictState,
  type UnderwritingInputDefinition,
  type UnderwritingInputId,
  type UnderwritingRegistryStatus,
  type UnderwritingRequirementState,
  type UnderwritingSchemaAccessRequest,
  type UnderwritingVerificationState,
  type ValueClassification,
} from "./underwritingInputSchemas";

export const UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION = "underwriting-validation-rules-v1";
export const UNDERWRITING_NORMALIZATION_REGISTRY_VERSION = "underwriting-normalization-registry-v1";

const EFFECTIVE_DATE = "2026-07-30";
const SUPPORTED_CURRENCY = "USD";
const DEFAULT_TOLERANCE = 0.01;

export type ValidationRuleStatus = "draft" | "active" | "deprecated" | "disabled";
export type ValidationSeverity = "informational" | "warning" | "error" | "blocking";
export type ValidationRuleCategory =
  | "presence"
  | "type"
  | "range"
  | "sign"
  | "precision"
  | "unit"
  | "currency"
  | "period"
  | "relationship"
  | "schema"
  | "provenance"
  | "assumption"
  | "conflict"
  | "consistency";

export type NormalizationDataType =
  | "money"
  | "decimal"
  | "integer"
  | "percentage"
  | "ratio"
  | "count"
  | "area"
  | "boolean"
  | "enum"
  | "date"
  | "duration"
  | "text"
  | "identifier"
  | "derived";

export type UnderwritingValidationStatus =
  | "valid"
  | "valid_with_warning"
  | "preliminary"
  | "missing"
  | "invalid_type"
  | "invalid_range"
  | "invalid_sign"
  | "invalid_precision"
  | "unsupported_unit"
  | "unsupported_period"
  | "unsupported_currency"
  | "ambiguous"
  | "blocked_conflict"
  | "prohibited"
  | "not_applicable";

export type UnderwritingOverallValidationStatus =
  | "valid"
  | "valid_with_accepted_assumptions"
  | "preliminary"
  | "incomplete"
  | "invalid"
  | "blocked_conflict"
  | "unresolved_schema"
  | "unsupported";

export type FormulaReadinessStatus =
  | "ready_confirmed"
  | "ready_with_accepted_assumptions"
  | "preliminary"
  | "missing_inputs"
  | "invalid_inputs"
  | "blocked_conflict"
  | "unsupported_schema"
  | "formula_disabled"
  | "version_not_found";

export type AssumptionValidationOutcome =
  | "accepted"
  | "preliminary_allowed"
  | "preliminary_not_allowed"
  | "assumption_not_allowed"
  | "missing_provenance"
  | "blocked_conflict"
  | "none";

export type UnderwritingValidationErrorCode =
  | "schema_not_found"
  | "schema_version_not_found"
  | "input_definition_not_found"
  | "validation_rule_not_found"
  | "normalization_rule_not_found"
  | "invalid_type"
  | "invalid_range"
  | "invalid_sign"
  | "invalid_precision"
  | "unsupported_unit"
  | "unsupported_period"
  | "unsupported_currency"
  | "mixed_currency"
  | "ambiguous_format"
  | "missing_required_input"
  | "prohibited_input"
  | "blocked_conflict"
  | "assumption_not_allowed"
  | "missing_provenance"
  | "unauthorized_subject"
  | "stale_input_version"
  | "internal_rule_error";

export type UnderwritingValidationError = {
  code: UnderwritingValidationErrorCode;
  inputId?: UnderwritingInputId;
  ruleId?: string;
  safeMessage: string;
  severity: ValidationSeverity;
};

export type ValidationRuleDefinition = {
  ruleId: string;
  displayName: string;
  description: string;
  semanticVersion: string;
  registryVersion: typeof UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION;
  applicableInputIds: UnderwritingInputId[] | "all";
  applicableSchemaIds: string[] | "all";
  applicableDataTypes: NormalizationDataType[] | "all";
  ruleCategory: ValidationRuleCategory;
  severity: ValidationSeverity;
  executionPriority: number;
  blockingBehavior: "blocks_input" | "blocks_result" | "warns_only";
  implementationRef: string;
  explanationTemplate: string;
  status: ValidationRuleStatus;
  effectiveDate: string;
  deprecatedDate?: string;
  replacementRuleId?: string;
};

export type NormalizationDefinition = {
  normalizationId: string;
  semanticVersion: string;
  registryVersion: typeof UNDERWRITING_NORMALIZATION_REGISTRY_VERSION;
  applicableInputIds: UnderwritingInputId[] | "all";
  sourceDataTypes: NormalizationDataType[];
  canonicalDataType: NormalizationDataType;
  acceptedSourceUnits: FormulaUnit[];
  canonicalUnit: FormulaUnit;
  acceptedSourcePeriods: FormulaPeriod[];
  canonicalPeriod: FormulaPeriod;
  currencyBehavior: "required" | "not_applicable" | "prohibited_conversion";
  localeBehavior: "explicit_only" | "not_applicable";
  transformationRef: string;
  precisionBehavior: "apply_input_precision" | "preserve_text";
  rawValuePreservation: "always";
  ambiguityBehavior: "typed_unresolved_result";
  status: UnderwritingRegistryStatus;
  effectiveDate: string;
  deprecatedDate?: string;
  replacementNormalizationId?: string;
};

export type UnderwritingRawInputValue = {
  inputId: UnderwritingInputId;
  rawValue?: string | number | boolean | null;
  sourceUnit?: FormulaUnit;
  sourcePeriod?: FormulaPeriod;
  sourceCurrency?: string;
  sourceFactId?: string;
  acceptedAssumptionId?: string;
  preliminaryAssumptionId?: string;
  sourceRecordId?: string;
  evidenceId?: string;
  sourceAnchor?: string | Record<string, unknown>;
  inputVersion?: string | number;
  expectedInputVersion?: string | number;
  classification: ValueClassification;
  verificationState: UnderwritingVerificationState;
  conflictState: UnderwritingConflictState;
  conflictMateriality?: "informational" | "material";
  proposalStatus?: "accepted" | "edited" | "pending" | "rejected" | "deferred" | "conflicted" | "superseded";
  sourceClassification?: CanonicalSourceClass;
  acceptedEnumValues?: string[];
  suppliedDataType?: NormalizationDataType;
};

export type UnderwritingValidationRequest = {
  validationId: string;
  workspaceId: string;
  dealId: string;
  propertyIds: string[];
  schemaId: string;
  schemaVersion: string;
  schemaRegistryVersion: typeof PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION;
  inputRegistryVersion: typeof UNDERWRITING_INPUT_REGISTRY_VERSION;
  validationRegistryVersion: typeof UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION;
  normalizationRegistryVersion: typeof UNDERWRITING_NORMALIZATION_REGISTRY_VERSION;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  calculationCurrency: string;
  calculationPeriodContext: {
    defaultPeriod?: FormulaPeriod;
    unitCount?: number;
    rentableSquareFeet?: number;
    grossBuildingArea?: number;
  };
  inputs: Record<string, UnderwritingRawInputValue>;
  requestTimestamp: string;
  requestedLocale?: string;
  authorization?: UnderwritingSchemaAccessRequest;
  authorizedSubjectIds?: {
    workspaceIds?: string[];
    dealIds?: string[];
    propertyIds?: string[];
    sourceFactIds?: string[];
    acceptedAssumptionIds?: string[];
    preliminaryAssumptionIds?: string[];
    sourceRecordIds?: string[];
    evidenceIds?: string[];
  };
};

export type NormalizedUnderwritingInput = {
  inputId: UnderwritingInputId;
  schemaRequirementState: UnderwritingRequirementState;
  validationStatus: UnderwritingValidationStatus;
  rawValue: string | number | boolean | null | undefined;
  normalizedValue: string | number | boolean | null;
  displayValue: string;
  canonicalDataType: NormalizationDataType;
  originalUnit?: FormulaUnit;
  canonicalUnit: FormulaUnit;
  originalPeriod?: FormulaPeriod;
  canonicalPeriod: FormulaPeriod;
  originalCurrency?: string;
  canonicalCurrency?: string;
  conversionApplied: boolean;
  conversionVersion?: string;
  precisionApplied?: FormulaPrecisionRule;
  roundingApplied: boolean;
  sourceFactId?: string;
  acceptedAssumptionId?: string;
  preliminaryAssumptionId?: string;
  sourceRecordId?: string;
  evidenceId?: string;
  sourceAnchor?: string | Record<string, unknown>;
  inputVersion?: string | number;
  warnings: string[];
  errors: UnderwritingValidationError[];
  blockingReasons: string[];
  completenessState: "confirmed" | "accepted_assumption" | "preliminary" | "missing" | "invalid" | "conflicted" | "not_applicable" | "prohibited" | "derived_pending";
  assumptionState: AssumptionValidationOutcome;
  conflictState: UnderwritingConflictState;
  deterministicNormalizedValueHash: string;
};

export type FormulaReadinessProjection = {
  formulaId: FormulaId;
  formulaVersion?: string;
  registryVersion: typeof FORMULA_REGISTRY_VERSION;
  status: FormulaReadinessStatus;
  requiredInputIds: string[];
  missingInputIds: string[];
  invalidInputIds: string[];
  conflictedInputIds: string[];
  preliminaryInputIds: string[];
  assumptionInputIds: string[];
};

export type UnderwritingValidationResult = {
  validationId: string;
  schemaId?: string;
  schemaVersion?: string;
  schemaRegistryVersion: typeof PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION;
  inputRegistryVersion: typeof UNDERWRITING_INPUT_REGISTRY_VERSION;
  validationRegistryVersion: typeof UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION;
  normalizationRegistryVersion: typeof UNDERWRITING_NORMALIZATION_REGISTRY_VERSION;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  overallStatus: UnderwritingOverallValidationStatus;
  normalizedInputs: NormalizedUnderwritingInput[];
  validRequiredInputs: UnderwritingInputId[];
  missingRequiredInputs: UnderwritingInputId[];
  invalidRequiredInputs: UnderwritingInputId[];
  conflictedRequiredInputs: UnderwritingInputId[];
  provisionalRequiredInputs: UnderwritingInputId[];
  optionalWarnings: string[];
  relationshipErrors: UnderwritingValidationError[];
  formulaReadiness: FormulaReadinessProjection[];
  blockingReasons: string[];
  warnings: string[];
  deterministicResultHash: string;
  validatedAt: string;
};

const validationRules: ValidationRuleDefinition[] = [
  rule("presence.required", "Required inputs are present", "Required inputs cannot be missing.", "presence", "blocking", 10, "blocks_result"),
  rule("type.canonical", "Canonical type is valid", "Raw values must normalize to the input data type.", "type", "blocking", 20, "blocks_input"),
  rule("range.input_specific", "Input range is valid", "Values must respect input-specific ranges.", "range", "blocking", 30, "blocks_input"),
  rule("sign.input_specific", "Input sign is valid", "Negative values are accepted only when the input definition permits them.", "sign", "blocking", 40, "blocks_input"),
  rule("precision.central", "Precision is applied centrally", "Rounding follows the input precision contract.", "precision", "warning", 50, "warns_only"),
  rule("unit.supported", "Unit is supported", "Only explicit supported units can be normalized.", "unit", "blocking", 60, "blocks_input"),
  rule("currency.single_supported", "Currency is supported", "Currency must be explicit and cannot be mixed.", "currency", "blocking", 70, "blocks_result"),
  rule("period.supported", "Period is supported", "Only explicit supported periods can be normalized.", "period", "blocking", 80, "blocks_input"),
  rule("schema.requirement_state", "Schema requirement is enforced", "Required, conditional, optional, derived, prohibited, and not-applicable states are enforced.", "schema", "blocking", 90, "blocks_result"),
  rule("provenance.required", "Provenance is present", "Inputs requiring provenance must carry an accepted fact, assumption, source record, or evidence reference.", "provenance", "blocking", 100, "blocks_input"),
  rule("assumption.policy", "Assumption policy is enforced", "Accepted and preliminary assumptions follow input and schema policy.", "assumption", "blocking", 110, "blocks_input"),
  rule("conflict.block_material", "Material conflicts block input", "Unresolved material conflicts cannot feed underwriting.", "conflict", "blocking", 120, "blocks_input"),
  rule("relationship.reconcile", "Cross-input relationships reconcile", "Inputs that must structurally agree are checked within deterministic tolerance.", "relationship", "blocking", 130, "blocks_result"),
  rule("consistency.formula_readiness", "Formula readiness is structural", "Formula dependencies are checked without executing formulas.", "consistency", "warning", 140, "warns_only"),
  rule("disabled.ai_semantic_validation", "Disabled AI semantic validation", "Disabled placeholder. AI never validates underwriting inputs.", "type", "blocking", 999, "blocks_input", "disabled"),
  { ...rule("presence.required", "Required inputs are present", "Deprecated prior version retained for historical results.", "presence", "blocking", 10, "blocks_result", "deprecated", "0.9.0"), replacementRuleId: "presence.required" },
];

const normalizationDefinitions: NormalizationDefinition[] = [
  normalization("money.usd", "money", "money", ["currency"], "currency", ["one_time", "monthly", "annual"], "one_time", "required"),
  normalization("percentage.decimal_fraction", "percentage", "percentage", ["percentage", "unitless"], "percentage", ["none"], "none", "not_applicable"),
  normalization("decimal.generic", "decimal", "decimal", ["unitless", "years", "months"], "unitless", ["none"], "none", "not_applicable"),
  normalization("integer.generic", "integer", "integer", ["unitless"], "unitless", ["none"], "none", "not_applicable"),
  normalization("count.integer", "count", "count", ["count", "unitless"], "count", ["none"], "none", "not_applicable"),
  normalization("area.square_feet", "area", "area", ["square_feet", "acres"], "square_feet", ["none"], "none", "not_applicable"),
  normalization("duration.months_years", "duration", "duration", ["months", "years"], "months", ["none"], "none", "not_applicable"),
  normalization("boolean.strict", "boolean", "boolean", ["unitless"], "unitless", ["none"], "none", "not_applicable"),
  normalization("enum.canonical_token", "enum", "enum", ["unitless"], "unitless", ["none"], "none", "not_applicable"),
  normalization("date.iso", "date", "date", ["unitless"], "unitless", ["none"], "none", "not_applicable"),
  normalization("text.trim", "text", "text", ["unitless"], "unitless", ["none"], "none", "not_applicable"),
  normalization("identifier.preserve", "identifier", "identifier", ["unitless"], "unitless", ["none"], "none", "not_applicable"),
  normalization("disabled.semantic_ai", "text", "text", ["unitless"], "unitless", ["none"], "none", "not_applicable", "disabled"),
];

export function listValidationRules() {
  return [...validationRules].sort((a, b) => a.executionPriority - b.executionPriority || a.ruleId.localeCompare(b.ruleId) || compareSemver(a.semanticVersion, b.semanticVersion));
}

export function resolveValidationRule(ruleId: string, version: string | "latest" = "latest") {
  const matches = validationRules.filter((item) => item.ruleId === ruleId);
  if (matches.length === 0) return undefined;
  if (version !== "latest") return matches.find((item) => item.semanticVersion === version);
  return matches.filter((item) => item.status === "active").sort((a, b) => compareSemver(b.semanticVersion, a.semanticVersion))[0];
}

export function listNormalizationDefinitions() {
  return [...normalizationDefinitions].sort((a, b) => a.normalizationId.localeCompare(b.normalizationId) || compareSemver(a.semanticVersion, b.semanticVersion));
}

export function resolveNormalizationDefinition(normalizationId: string, version: string | "latest" = "latest") {
  const matches = normalizationDefinitions.filter((item) => item.normalizationId === normalizationId);
  if (matches.length === 0) return undefined;
  if (version !== "latest") return matches.find((item) => item.semanticVersion === version);
  return matches.filter((item) => item.status === "active").sort((a, b) => compareSemver(b.semanticVersion, a.semanticVersion))[0];
}

export function validateUnderwritingValidationRegistry() {
  const errors: string[] = [];
  const keys = new Set<string>();
  for (const item of validationRules) {
    const key = `${item.ruleId}@${item.semanticVersion}`;
    if (keys.has(key)) errors.push(`Duplicate validation rule ${key}.`);
    keys.add(key);
    if (item.registryVersion !== UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION) errors.push(`Validation rule ${key} has wrong registry version.`);
    if (!item.implementationRef.startsWith("src/core/underwritingValidation.ts:")) errors.push(`Validation rule ${key} points outside the canonical engine.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateUnderwritingNormalizationRegistry() {
  const errors: string[] = [];
  const keys = new Set<string>();
  for (const item of normalizationDefinitions) {
    const key = `${item.normalizationId}@${item.semanticVersion}`;
    if (keys.has(key)) errors.push(`Duplicate normalization ${key}.`);
    keys.add(key);
    if (item.registryVersion !== UNDERWRITING_NORMALIZATION_REGISTRY_VERSION) errors.push(`Normalization ${key} has wrong registry version.`);
    if (!item.transformationRef.startsWith("src/core/underwritingValidation.ts:")) errors.push(`Normalization ${key} points outside the canonical engine.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateAndNormalizeUnderwritingInputs(request: UnderwritingValidationRequest): UnderwritingValidationResult {
  const authorizationError = validateAuthorization(request);
  if (authorizationError) return invalidResult(request, "unsupported", [authorizationError]);

  if (request.schemaRegistryVersion !== PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION || request.inputRegistryVersion !== UNDERWRITING_INPUT_REGISTRY_VERSION) {
    return invalidResult(request, "unsupported", [typedError("schema_version_not_found", "Schema and input registry versions must be explicit and current.", "blocking")]);
  }
  if (request.validationRegistryVersion !== UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION || request.normalizationRegistryVersion !== UNDERWRITING_NORMALIZATION_REGISTRY_VERSION) {
    return invalidResult(request, "unsupported", [typedError("validation_rule_not_found", "Validation and normalization registry versions must be explicit and current.", "blocking")]);
  }
  if (request.formulaRegistryVersion !== FORMULA_REGISTRY_VERSION) {
    return invalidResult(request, "unsupported", [typedError("validation_rule_not_found", "Formula registry version must be explicit and current.", "blocking")]);
  }
  if (normalizeCurrency(request.calculationCurrency) !== SUPPORTED_CURRENCY) {
    return invalidResult(request, "unsupported", [typedError("unsupported_currency", "Only USD underwriting validation is enabled until currency conversion is explicitly specified.", "blocking")]);
  }

  const schema = resolvePropertyUnderwritingSchema(request.schemaId, request.schemaVersion);
  if (!schema) {
    const hasSchema = Boolean(resolvePropertyUnderwritingSchema(request.schemaId, "latest"));
    return invalidResult(request, hasSchema ? "unsupported" : "unresolved_schema", [
      typedError(hasSchema ? "schema_version_not_found" : "schema_not_found", hasSchema ? "Requested schema version was not found." : "Requested underwriting schema was not found.", "blocking"),
    ]);
  }
  if (schema.status !== "active") return invalidResult(request, "unsupported", [typedError("schema_version_not_found", "Only active schema versions can be used for new validation.", "blocking")]);

  const requirementMap = buildRequirementMap(schema, request.inputs);
  const normalizedInputs = Object.keys(requirementMap)
    .sort()
    .map((inputId) => normalizeOneInput(inputId as UnderwritingInputId, requirementMap[inputId as UnderwritingInputId], request));
  const relationshipErrors = validateRelationships(normalizedInputs);
  const formulaReadiness = projectFormulaReadiness(schema, normalizedInputs);

  const required = normalizedInputs.filter((input) => input.schemaRequirementState === "required" || input.schemaRequirementState === "conditionally_required");
  const validRequiredInputs = required.filter((input) => ["valid", "valid_with_warning"].includes(input.validationStatus)).map((input) => input.inputId);
  const missingRequiredInputs = required.filter((input) => input.validationStatus === "missing").map((input) => input.inputId);
  const invalidRequiredInputs = required.filter((input) => ["invalid_type", "invalid_range", "invalid_sign", "invalid_precision", "unsupported_unit", "unsupported_period", "unsupported_currency", "ambiguous", "prohibited"].includes(input.validationStatus)).map((input) => input.inputId);
  const conflictedRequiredInputs = required.filter((input) => input.validationStatus === "blocked_conflict").map((input) => input.inputId);
  const provisionalRequiredInputs = required.filter((input) => input.validationStatus === "preliminary").map((input) => input.inputId);
  const warnings = normalizedInputs.flatMap((input) => input.warnings).sort();
  const blockingReasons = [...new Set([...normalizedInputs.flatMap((input) => input.blockingReasons), ...relationshipErrors.filter((error) => error.severity === "blocking").map((error) => error.safeMessage)])].sort();
  const optionalWarnings = normalizedInputs
    .filter((input) => input.schemaRequirementState === "optional" && input.warnings.length > 0)
    .flatMap((input) => input.warnings.map((warning) => `${input.inputId}: ${warning}`))
    .sort();
  const overallStatus = determineOverallStatus({
    relationshipErrors,
    missingRequiredInputs,
    invalidRequiredInputs,
    conflictedRequiredInputs,
    provisionalRequiredInputs,
    normalizedInputs,
  });

  return {
    validationId: request.validationId,
    schemaId: schema.schemaId,
    schemaVersion: schema.semanticVersion,
    schemaRegistryVersion: request.schemaRegistryVersion,
    inputRegistryVersion: request.inputRegistryVersion,
    validationRegistryVersion: request.validationRegistryVersion,
    normalizationRegistryVersion: request.normalizationRegistryVersion,
    formulaRegistryVersion: request.formulaRegistryVersion,
    overallStatus,
    normalizedInputs,
    validRequiredInputs: sortedUniqueInputIds(validRequiredInputs),
    missingRequiredInputs: sortedUniqueInputIds(missingRequiredInputs),
    invalidRequiredInputs: sortedUniqueInputIds(invalidRequiredInputs),
    conflictedRequiredInputs: sortedUniqueInputIds(conflictedRequiredInputs),
    provisionalRequiredInputs: sortedUniqueInputIds(provisionalRequiredInputs),
    optionalWarnings,
    relationshipErrors,
    formulaReadiness,
    blockingReasons,
    warnings,
    deterministicResultHash: resultHash(request, normalizedInputs, relationshipErrors, formulaReadiness),
    validatedAt: request.requestTimestamp,
  };
}

function normalizeOneInput(inputId: UnderwritingInputId, requirementState: UnderwritingRequirementState, request: UnderwritingValidationRequest): NormalizedUnderwritingInput {
  const definition = resolveUnderwritingInputDefinition(inputId);
  if (!definition) return missingDefinition(inputId, requirementState, request);
  const raw = request.inputs[inputId];
  const base = baseNormalizedInput(definition, raw, requirementState);
  if (requirementState === "prohibited") return finalizeInput({ ...base, validationStatus: raw ? "prohibited" : "prohibited", completenessState: "prohibited", blockingReasons: raw ? ["Prohibited input was supplied."] : [], errors: raw ? [typedError("prohibited_input", "This input is prohibited for the selected schema.", "blocking", inputId, "schema.requirement_state")] : [] });
  if (requirementState === "not_applicable") return finalizeInput({ ...base, validationStatus: "not_applicable", completenessState: "not_applicable" });
  if (requirementState === "derived" && (!raw || !definition.userEditable)) return finalizeInput({ ...base, validationStatus: "not_applicable", completenessState: "derived_pending", warnings: ["Derived value is excluded from user-supplied formula readiness."] });
  if (!raw || raw.rawValue === null || raw.rawValue === undefined || raw.rawValue === "") {
    return finalizeInput({
      ...base,
      validationStatus: requirementState === "optional" ? "missing" : "missing",
      completenessState: "missing",
      errors: requirementState === "optional" ? [] : [typedError("missing_required_input", "Required underwriting input is missing.", "blocking", inputId, "presence.required")],
      blockingReasons: requirementState === "optional" ? [] : ["Required underwriting input is missing."],
    });
  }
  const preflight = validateInputPreflight(definition, raw, request);
  if (preflight) return finalizeInput({ ...base, ...preflight });

  const normalized = normalizeRawValue(definition, raw, request);
  const assumptionState = assumptionStateFor(definition, raw);
  const validationStatus = normalized.status === "valid"
    ? assumptionState === "preliminary_allowed" ? "preliminary" : normalized.warnings.length ? "valid_with_warning" : "valid"
    : normalized.status;
  return finalizeInput({
    ...base,
    validationStatus,
    normalizedValue: normalized.value,
    displayValue: normalized.displayValue,
    canonicalDataType: normalized.dataType,
    originalUnit: raw.sourceUnit,
    canonicalUnit: normalized.canonicalUnit,
    originalPeriod: raw.sourcePeriod,
    canonicalPeriod: normalized.canonicalPeriod,
    originalCurrency: normalizeCurrency(raw.sourceCurrency),
    canonicalCurrency: normalized.canonicalCurrency,
    conversionApplied: normalized.conversionApplied,
    conversionVersion: normalized.conversionVersion,
    precisionApplied: definition.precision,
    roundingApplied: normalized.roundingApplied,
    warnings: [...normalized.warnings, ...assumptionWarning(assumptionState)].sort(),
    errors: normalized.errors,
    blockingReasons: normalized.errors.filter((error) => error.severity === "blocking").map((error) => error.safeMessage).sort(),
    completenessState: validationStatus === "valid" || validationStatus === "valid_with_warning"
      ? assumptionState === "accepted" ? "accepted_assumption" : "confirmed"
      : validationStatus === "preliminary" ? "preliminary" : "invalid",
    assumptionState,
  });
}

function normalizeRawValue(definition: UnderwritingInputDefinition, raw: UnderwritingRawInputValue, request: UnderwritingValidationRequest) {
  const dataType = raw.suppliedDataType ?? dataTypeFor(definition, raw);
  const normalizationDefinition = definitionForDataType(dataType);
  if (!normalizationDefinition) return unresolved("normalization_rule_not_found", "No active normalization rule supports this input.", definition.inputId);
  if (normalizationDefinition.status !== "active") return unresolved("normalization_rule_not_found", "Disabled normalization rules do not execute.", definition.inputId);
  const unitResult = normalizeUnit(definition, raw, dataType);
  if (!unitResult.ok) return unresolved("unsupported_unit", unitResult.message, definition.inputId);
  const periodResult = normalizePeriod(definition, raw, request, unitResult.factor);
  if (!periodResult.ok) return unresolved("unsupported_period", periodResult.message, definition.inputId);
  const parsed = parseByType(dataType, raw, definition);
  if (parsed.ok === false) return unresolved(parsed.code, parsed.message, definition.inputId, parsed.status);
  const currency = normalizeCurrency(raw.sourceCurrency);
  if (definition.currencyBehavior === "required") {
    if (!currency) return unresolved("unsupported_currency", "Currency is required for monetary underwriting inputs.", definition.inputId);
    if (currency !== request.calculationCurrency || currency !== SUPPORTED_CURRENCY) return unresolved(currency && currency !== SUPPORTED_CURRENCY ? "unsupported_currency" : "mixed_currency", "Currency conversion is not supported in this validation slice.", definition.inputId);
  }
  if (definition.currencyBehavior === "not_applicable" && currency) return unresolved("unsupported_currency", "This input does not accept currency.", definition.inputId);

  const numericBeforePeriod = typeof parsed.value === "number" ? applyUnitConversion(parsed.value, unitResult.factor) : parsed.value;
  const normalizedValue = typeof numericBeforePeriod === "number" ? applyPeriodConversion(numericBeforePeriod, periodResult.factor) : numericBeforePeriod;
  const rangeIssue = validateRange(definition, normalizedValue);
  if (rangeIssue) return unresolved(rangeIssue.code, rangeIssue.message, definition.inputId, rangeIssue.status);
  const precision = typeof normalizedValue === "number" ? applyPrecision(normalizedValue, definition.precision) : normalizedValue;
  const rounded = typeof normalizedValue === "number" && precision !== normalizedValue;
  return {
    status: "valid" as const,
    value: precision,
    displayValue: displayValue(precision, dataType, currency, periodResult.canonicalPeriod, unitResult.canonicalUnit),
    dataType,
    canonicalUnit: unitResult.canonicalUnit,
    canonicalPeriod: periodResult.canonicalPeriod,
    canonicalCurrency: definition.currencyBehavior === "required" ? currency : undefined,
    conversionApplied: unitResult.conversionApplied || periodResult.conversionApplied || rounded,
    conversionVersion: unitResult.conversionApplied || periodResult.conversionApplied ? "deterministic-normalization-v1" : undefined,
    roundingApplied: rounded,
    warnings: [...unitResult.warnings, ...periodResult.warnings, ...parsed.warnings].sort(),
    errors: [] as UnderwritingValidationError[],
  };
}

function validateInputPreflight(definition: UnderwritingInputDefinition, raw: UnderwritingRawInputValue, request: UnderwritingValidationRequest): Partial<NormalizedUnderwritingInput> | null {
  if (raw.inputVersion !== undefined && raw.expectedInputVersion !== undefined && raw.inputVersion !== raw.expectedInputVersion) {
    return invalidInput("stale_input_version", "Input version is stale. Refresh before validating.", definition.inputId, "blocking", "invalid_type");
  }
  if (raw.proposalStatus && !["accepted", "edited"].includes(raw.proposalStatus)) {
    return invalidInput(raw.proposalStatus === "deferred" ? "missing_required_input" : "invalid_type", "Only accepted or edited proposal values may enter underwriting validation.", definition.inputId, "blocking", raw.proposalStatus === "deferred" ? "missing" : "invalid_type");
  }
  if (raw.classification === "rejected" || raw.classification === "deferred") {
    return invalidInput(raw.classification === "deferred" ? "missing_required_input" : "invalid_type", "Rejected and deferred proposals are excluded from underwriting validation.", definition.inputId, "blocking", raw.classification === "deferred" ? "missing" : "invalid_type");
  }
  if (raw.conflictState === "unresolved" && raw.conflictMateriality !== "informational") {
    return invalidInput("blocked_conflict", "Unresolved material conflict blocks this input.", definition.inputId, "blocking", "blocked_conflict", "blocked_conflict");
  }
  if (!isProvenancePermitted(definition, raw)) {
    return invalidInput("missing_provenance", "Required source provenance is missing or not permitted for this input.", definition.inputId, "blocking", "invalid_type", "missing_provenance");
  }
  const authorizationIssue = validateValueAuthorization(raw, request);
  if (authorizationIssue) return invalidInput("unauthorized_subject", authorizationIssue, definition.inputId, "blocking", "invalid_type");
  const assumption = assumptionStateFor(definition, raw);
  if (assumption === "assumption_not_allowed" || assumption === "preliminary_not_allowed" || assumption === "missing_provenance") {
    return invalidInput(assumption === "missing_provenance" ? "missing_provenance" : "assumption_not_allowed", "Assumption policy does not permit this value for the selected input.", definition.inputId, "blocking", "invalid_type", assumption);
  }
  return null;
}

function validateRelationships(inputs: NormalizedUnderwritingInput[]): UnderwritingValidationError[] {
  const byId = new Map(inputs.map((input) => [input.inputId, input]));
  const errors: UnderwritingValidationError[] = [];
  const num = (id: UnderwritingInputId) => {
    const input = byId.get(id);
    return typeof input?.normalizedValue === "number" && ["valid", "valid_with_warning", "preliminary"].includes(input.validationStatus) ? input.normalizedValue : undefined;
  };
  const purchase = num("purchase_price");
  const loan = num("loan_amount");
  const down = num("down_payment_amount");
  if (purchase !== undefined && loan !== undefined && down !== undefined && !withinTolerance(loan + down, purchase, DEFAULT_TOLERANCE)) {
    errors.push(typedError("invalid_range", "Loan amount plus down payment must reconcile to purchase price.", "blocking", "loan_amount", "relationship.reconcile"));
  }
  const downPercent = num("down_payment_percent");
  if (purchase !== undefined && down !== undefined && downPercent !== undefined && !withinTolerance(down, purchase * downPercent, DEFAULT_TOLERANCE)) {
    errors.push(typedError("invalid_range", "Down payment percent must reconcile with down payment amount and purchase price.", "blocking", "down_payment_percent", "relationship.reconcile"));
  }
  const units = num("unit_count");
  const occupied = num("occupied_unit_count");
  if (units !== undefined && occupied !== undefined && occupied > units) {
    errors.push(typedError("invalid_range", "Occupied units cannot exceed total units.", "blocking", "occupied_unit_count", "relationship.reconcile"));
  }
  const monthlyPi = num("monthly_principal_interest");
  const annualDebt = num("annual_debt_service");
  if (monthlyPi !== undefined && annualDebt !== undefined && !withinTolerance(monthlyPi * 12, annualDebt, DEFAULT_TOLERANCE)) {
    errors.push(typedError("invalid_range", "Annual debt service must reconcile to monthly principal and interest.", "blocking", "annual_debt_service", "relationship.reconcile"));
  }
  const expenseLineItems = ["taxes", "insurance", "hoa", "utilities", "maintenance", "management", "payroll", "landscaping", "snow_removal", "pest_control", "licenses_and_permits", "legal_and_accounting", "advertising", "replacement_reserves", "other_operating_expenses"] as UnderwritingInputId[];
  const suppliedExpenses = expenseLineItems.map(num).filter((value): value is number => value !== undefined);
  const totalExpenses = num("total_operating_expenses");
  if (suppliedExpenses.length >= 2 && totalExpenses !== undefined && !withinTolerance(sum(suppliedExpenses), totalExpenses, DEFAULT_TOLERANCE)) {
    errors.push(typedError("invalid_range", "Operating expense total must reconcile to supplied line items.", "blocking", "total_operating_expenses", "relationship.reconcile"));
  }
  const egi = num("effective_gross_income");
  const gsi = num("gross_scheduled_income");
  const otherIncome = num("other_income") ?? 0;
  if (egi !== undefined && gsi !== undefined && egi > gsi + otherIncome + DEFAULT_TOLERANCE) {
    errors.push(typedError("invalid_range", "Effective gross income cannot exceed gross scheduled income plus other income when vacancy and concessions reduce income.", "blocking", "effective_gross_income", "relationship.reconcile"));
  }
  const loanTerm = num("loan_term_months");
  const amortizationYears = num("amortization_years");
  if (loanTerm !== undefined && loanTerm < 0) errors.push(typedError("invalid_range", "Loan term months cannot be negative.", "blocking", "loan_term_months", "relationship.reconcile"));
  if (amortizationYears !== undefined && amortizationYears <= 0) errors.push(typedError("invalid_range", "Amortization years must be greater than zero.", "blocking", "amortization_years", "relationship.reconcile"));
  return errors.sort((a, b) => `${a.inputId ?? ""}:${a.code}`.localeCompare(`${b.inputId ?? ""}:${b.code}`));
}

function projectFormulaReadiness(schema: PropertyUnderwritingSchema, inputs: NormalizedUnderwritingInput[]): FormulaReadinessProjection[] {
  const byId = new Map(inputs.map((input) => [input.inputId, input]));
  const memo = new Map<FormulaId, FormulaReadinessProjection>();
  const visit = (formulaId: FormulaId): FormulaReadinessProjection => {
    const existing = memo.get(formulaId);
    if (existing) return existing;
    const formula = resolveFormulaDefinition(formulaId);
    if (!formula) return readiness(formulaId, "version_not_found", [], [], [], [], [], []);
    if (formula.status !== "active") return readiness(formulaId, "formula_disabled", [], [], [], [], [], [], formula.semanticVersion);
    if (!schema.supportedFormulaIds.includes(formulaId)) return readiness(formulaId, "unsupported_schema", formula.inputs.map((input) => input.id), [], [], [], [], [], formula.semanticVersion);
    const missing: string[] = [];
    const invalid: string[] = [];
    const conflicts: string[] = [];
    const preliminary: string[] = [];
    const assumptions: string[] = [];
    for (const inputDefinition of formula.inputs) {
      const input = byId.get(inputDefinition.id as UnderwritingInputId);
      const dependency = formula.dependencies.find((item) => item.formulaId === inputDefinition.id);
      const dependencyReadiness = dependency ? visit(dependency.formulaId) : undefined;
      if (dependencyReadiness && !["ready_confirmed", "ready_with_accepted_assumptions"].includes(dependencyReadiness.status)) {
        if (dependencyReadiness.status === "preliminary") preliminary.push(inputDefinition.id);
        else if (dependencyReadiness.status === "blocked_conflict") conflicts.push(inputDefinition.id);
        else missing.push(inputDefinition.id);
        continue;
      }
      if (!input || input.validationStatus === "missing" || input.validationStatus === "not_applicable") missing.push(inputDefinition.id);
      else if (input.validationStatus === "blocked_conflict") conflicts.push(inputDefinition.id);
      else if (["invalid_type", "invalid_range", "invalid_sign", "invalid_precision", "unsupported_unit", "unsupported_period", "unsupported_currency", "ambiguous", "prohibited"].includes(input.validationStatus)) invalid.push(inputDefinition.id);
      else if (input.validationStatus === "preliminary") preliminary.push(inputDefinition.id);
      else if (input.assumptionState === "accepted") assumptions.push(inputDefinition.id);
      if (input && input.validationStatus !== "missing" && input.canonicalUnit !== inputDefinition.unit) invalid.push(inputDefinition.id);
      if (input && input.validationStatus !== "missing" && input.canonicalPeriod !== inputDefinition.period) invalid.push(inputDefinition.id);
    }
    const status: FormulaReadinessStatus = conflicts.length
      ? "blocked_conflict"
      : invalid.length
        ? "invalid_inputs"
        : missing.length
          ? "missing_inputs"
          : preliminary.length
            ? "preliminary"
            : assumptions.length
              ? "ready_with_accepted_assumptions"
              : "ready_confirmed";
    const result = readiness(formulaId, status, formula.inputs.map((input) => input.id), missing, invalid, conflicts, preliminary, assumptions, formula.semanticVersion);
    memo.set(formulaId, result);
    return result;
  };
  return schema.supportedFormulaIds.map(visit).sort((a, b) => a.formulaId.localeCompare(b.formulaId));
}

function readiness(
  formulaId: FormulaId,
  status: FormulaReadinessStatus,
  requiredInputIds: string[],
  missingInputIds: string[],
  invalidInputIds: string[],
  conflictedInputIds: string[],
  preliminaryInputIds: string[],
  assumptionInputIds: string[],
  formulaVersion?: string,
): FormulaReadinessProjection {
  return {
    formulaId,
    formulaVersion,
    registryVersion: FORMULA_REGISTRY_VERSION,
    status,
    requiredInputIds: sortedUniqueStrings(requiredInputIds),
    missingInputIds: sortedUniqueStrings(missingInputIds),
    invalidInputIds: sortedUniqueStrings(invalidInputIds),
    conflictedInputIds: sortedUniqueStrings(conflictedInputIds),
    preliminaryInputIds: sortedUniqueStrings(preliminaryInputIds),
    assumptionInputIds: sortedUniqueStrings(assumptionInputIds),
  };
}

function buildRequirementMap(schema: PropertyUnderwritingSchema, inputs: Record<string, UnderwritingRawInputValue>) {
  const compatibilityInputs = Object.fromEntries(Object.entries(inputs).map(([inputId, value]) => [inputId, {
    inputId: value.inputId,
    canonicalValue: value.rawValue,
    canonicalUnit: value.sourceUnit ?? resolveUnderwritingInputDefinition(value.inputId)?.canonicalUnit ?? "unitless",
    period: value.sourcePeriod ?? resolveUnderwritingInputDefinition(value.inputId)?.canonicalPeriod ?? "none",
    currency: value.sourceCurrency,
    classification: value.classification,
    verificationState: value.verificationState,
    conflictState: value.conflictState,
  }]));
  const projected = projectInputStates(schema, compatibilityInputs);
  const map = {} as Record<UnderwritingInputId, UnderwritingRequirementState>;
  for (const input of projected) map[input.inputId] = input.requirementState;
  for (const rule of evaluateConditionalRequirements(schema, compatibilityInputs)) {
    if (rule.applies) map[rule.targetInputId] = rule.requirementState;
  }
  return map;
}

function baseNormalizedInput(definition: UnderwritingInputDefinition, raw: UnderwritingRawInputValue | undefined, requirementState: UnderwritingRequirementState): NormalizedUnderwritingInput {
  return {
    inputId: definition.inputId,
    schemaRequirementState: requirementState,
    validationStatus: "missing",
    rawValue: raw?.rawValue,
    normalizedValue: null,
    displayValue: "",
    canonicalDataType: raw?.suppliedDataType ?? dataTypeFor(definition, raw),
    originalUnit: raw?.sourceUnit,
    canonicalUnit: definition.canonicalUnit,
    originalPeriod: raw?.sourcePeriod,
    canonicalPeriod: definition.canonicalPeriod,
    originalCurrency: normalizeCurrency(raw?.sourceCurrency),
    canonicalCurrency: definition.currencyBehavior === "required" ? normalizeCurrency(raw?.sourceCurrency) : undefined,
    conversionApplied: false,
    conversionVersion: undefined,
    roundingApplied: false,
    sourceFactId: raw?.sourceFactId,
    acceptedAssumptionId: raw?.acceptedAssumptionId,
    preliminaryAssumptionId: raw?.preliminaryAssumptionId,
    sourceRecordId: raw?.sourceRecordId,
    evidenceId: raw?.evidenceId,
    sourceAnchor: raw?.sourceAnchor,
    inputVersion: raw?.inputVersion,
    warnings: [],
    errors: [],
    blockingReasons: [],
    completenessState: "missing",
    assumptionState: "none",
    conflictState: raw?.conflictState ?? "none",
    precisionApplied: definition.precision,
    deterministicNormalizedValueHash: "",
  };
}

function finalizeInput(input: NormalizedUnderwritingInput): NormalizedUnderwritingInput {
  return {
    ...input,
    deterministicNormalizedValueHash: stableHash({
      inputId: input.inputId,
      status: input.validationStatus,
      rawValue: input.rawValue,
      normalizedValue: input.normalizedValue,
      canonicalDataType: input.canonicalDataType,
      originalUnit: input.originalUnit,
      canonicalUnit: input.canonicalUnit,
      originalPeriod: input.originalPeriod,
      canonicalPeriod: input.canonicalPeriod,
      originalCurrency: input.originalCurrency,
      canonicalCurrency: input.canonicalCurrency,
      sourceFactId: input.sourceFactId,
      acceptedAssumptionId: input.acceptedAssumptionId,
      preliminaryAssumptionId: input.preliminaryAssumptionId,
      sourceRecordId: input.sourceRecordId,
      evidenceId: input.evidenceId,
      inputVersion: input.inputVersion,
      warnings: input.warnings,
      errors: input.errors.map((error) => ({ code: error.code, ruleId: error.ruleId, inputId: error.inputId })),
    }),
  };
}

function missingDefinition(inputId: UnderwritingInputId, requirementState: UnderwritingRequirementState, request: UnderwritingValidationRequest): NormalizedUnderwritingInput {
  return finalizeInput({
    inputId,
    schemaRequirementState: requirementState,
    validationStatus: "invalid_type",
    rawValue: request.inputs[inputId]?.rawValue,
    normalizedValue: null,
    displayValue: "",
    canonicalDataType: "text",
    canonicalUnit: "unitless",
    canonicalPeriod: "none",
    conversionApplied: false,
    roundingApplied: false,
    warnings: [],
    errors: [typedError("input_definition_not_found", "Input definition was not found.", "blocking", inputId)],
    blockingReasons: ["Input definition was not found."],
    completenessState: "invalid",
    assumptionState: "none",
    conflictState: "none",
    deterministicNormalizedValueHash: "",
  });
}

function invalidInput(code: UnderwritingValidationErrorCode, message: string, inputId: UnderwritingInputId, severity: ValidationSeverity, status: UnderwritingValidationStatus, assumptionState: AssumptionValidationOutcome = "none"): Partial<NormalizedUnderwritingInput> {
  return {
    validationStatus: status,
    completenessState: status === "blocked_conflict" ? "conflicted" : status === "missing" ? "missing" : "invalid",
    assumptionState,
    errors: [typedError(code, message, severity, inputId)],
    blockingReasons: severity === "blocking" ? [message] : [],
  };
}

function unresolved(code: UnderwritingValidationErrorCode, message: string, inputId: UnderwritingInputId, status: UnderwritingValidationStatus = errorStatusFor(code)) {
  return {
    status,
    value: null,
    displayValue: "",
    dataType: "text" as NormalizationDataType,
    canonicalUnit: resolveUnderwritingInputDefinition(inputId)?.canonicalUnit ?? "unitless",
    canonicalPeriod: resolveUnderwritingInputDefinition(inputId)?.canonicalPeriod ?? "none",
    canonicalCurrency: undefined,
    conversionApplied: false,
    conversionVersion: undefined,
    roundingApplied: false,
    warnings: [] as string[],
    errors: [typedError(code, message, "blocking", inputId)],
  };
}

function parseByType(dataType: NormalizationDataType, raw: UnderwritingRawInputValue, definition: UnderwritingInputDefinition):
  | { ok: true; value: string | number | boolean; warnings: string[] }
  | { ok: false; code: UnderwritingValidationErrorCode; message: string; status?: UnderwritingValidationStatus; warnings?: string[] } {
  const value = raw.rawValue;
  if (dataType === "text") return { ok: true, value: String(value ?? "").trim(), warnings: [] };
  if (dataType === "identifier") return { ok: true, value: String(value ?? "").trim(), warnings: [] };
  if (dataType === "enum") {
    const normalized = normalizeToken(value);
    const accepted = (raw.acceptedEnumValues ?? []).map(normalizeToken).sort();
    if (accepted.length && !accepted.includes(normalized)) return { ok: false, code: "invalid_range", message: "Enum value is not permitted." };
    return { ok: true, value: normalized, warnings: [] };
  }
  if (dataType === "boolean") {
    if (typeof value === "boolean") return { ok: true, value, warnings: [] };
    if (typeof value === "string" && ["true", "false"].includes(value.trim().toLowerCase())) return { ok: true, value: value.trim().toLowerCase() === "true", warnings: [] };
    return { ok: false, code: "invalid_type", message: "Boolean inputs accept only true or false." };
  }
  if (dataType === "date") {
    if (typeof value !== "string") return { ok: false, code: "invalid_type", message: "Date input must be a string in an approved format." };
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { ok: false, code: "ambiguous_format", message: "Date format is ambiguous. Use YYYY-MM-DD.", status: "ambiguous" };
    const parsed = new Date(`${trimmed}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? { ok: false, code: "invalid_type", message: "Date is invalid." } : { ok: true, value: trimmed, warnings: [] };
  }
  if (dataType === "percentage" || dataType === "ratio") return parsePercentage(value);
  const numeric = parseNumeric(value, dataType === "money");
  if (numeric.ok === false) return { ok: false, code: numeric.code, message: numeric.message, status: numeric.status };
  if ((dataType === "integer" || dataType === "count") && !Number.isInteger(numeric.value)) {
    return { ok: false, code: "invalid_precision", message: "Integer and count inputs cannot contain fractional values.", status: "invalid_precision" };
  }
  if (definition.dataType === "derived") return { ok: false, code: "invalid_type", message: "Derived inputs cannot be user supplied." };
  return { ok: true, value: numeric.value, warnings: [] };
}

function parseNumeric(value: unknown, allowCurrencySyntax: boolean): { ok: true; value: number } | { ok: false; code: UnderwritingValidationErrorCode; message: string; status?: UnderwritingValidationStatus } {
  if (typeof value === "number") return Number.isFinite(value) ? { ok: true, value } : { ok: false, code: "invalid_type", message: "Non-finite numbers are not valid underwriting inputs.", status: "invalid_type" };
  if (typeof value !== "string") return { ok: false, code: "invalid_type", message: "Value must be numeric." };
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, code: "invalid_type", message: "Value is empty." };
  const isParenthesesNegative = /^\(.+\)$/.test(trimmed);
  const withoutParens = isParenthesesNegative ? trimmed.slice(1, -1).trim() : trimmed;
  const currencyPattern = allowCurrencySyntax ? "\\$?" : "";
  const re = new RegExp(`^-?${currencyPattern}(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?$`);
  if (!re.test(withoutParens)) return { ok: false, code: "ambiguous_format", message: "Numeric format is malformed or ambiguous.", status: "ambiguous" };
  const parsed = Number(withoutParens.replace(/[$,]/g, ""));
  if (!Number.isFinite(parsed)) return { ok: false, code: "invalid_type", message: "Non-finite numbers are not valid underwriting inputs.", status: "invalid_type" };
  return { ok: true, value: isParenthesesNegative ? -Math.abs(parsed) : parsed };
}

function parsePercentage(value: unknown): { ok: true; value: number; warnings: string[] } | { ok: false; code: UnderwritingValidationErrorCode; message: string; status?: UnderwritingValidationStatus } {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return { ok: false, code: "invalid_type", message: "Percentage must be finite." };
    if (value > 1) return { ok: false, code: "ambiguous_format", message: "Whole-number percentages require a percent sign.", status: "ambiguous" };
    return { ok: true, value, warnings: [] };
  }
  if (typeof value !== "string") return { ok: false, code: "invalid_type", message: "Percentage value must be numeric." };
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const numeric = parseNumeric(trimmed.slice(0, -1), false);
    if (numeric.ok === false) return numeric;
    return { ok: true, value: numeric.value / 100, warnings: [] };
  }
  const numeric = parseNumeric(trimmed, false);
  if (numeric.ok === false) return numeric;
  if (numeric.value > 1) return { ok: false, code: "ambiguous_format", message: "Whole-number percentages require a percent sign.", status: "ambiguous" };
  return { ok: true, value: numeric.value, warnings: [] };
}

function normalizeUnit(definition: UnderwritingInputDefinition, raw: UnderwritingRawInputValue, dataType: NormalizationDataType) {
  const original = raw.sourceUnit ?? definition.canonicalUnit;
  const canonical = definition.canonicalUnit;
  if (original === canonical) return { ok: true as const, canonicalUnit: canonical, factor: 1, conversionApplied: false, warnings: [] as string[] };
  if (dataType === "area" && original === "acres" && canonical === "square_feet") return { ok: true as const, canonicalUnit: canonical, factor: 43560, conversionApplied: true, warnings: ["Converted acres to square feet."] };
  if (dataType === "duration" && original === "years" && canonical === "months") return { ok: true as const, canonicalUnit: canonical, factor: 12, conversionApplied: true, warnings: ["Converted years to months."] };
  if (dataType === "duration" && original === "months" && canonical === "years") return { ok: true as const, canonicalUnit: canonical, factor: 1 / 12, conversionApplied: true, warnings: ["Converted months to years."] };
  return { ok: false as const, message: "Input unit is unsupported or incompatible with the canonical input." };
}

function normalizePeriod(definition: UnderwritingInputDefinition, raw: UnderwritingRawInputValue, request: UnderwritingValidationRequest, _value: unknown) {
  const original = raw.sourcePeriod ?? definition.canonicalPeriod;
  const canonical = definition.canonicalPeriod;
  if (original === canonical) return { ok: true as const, canonicalPeriod: canonical, factor: 1, conversionApplied: false, warnings: [] as string[] };
  if (original === "monthly" && canonical === "annual") return { ok: true as const, canonicalPeriod: canonical, factor: 12, conversionApplied: true, warnings: ["Converted monthly value to annual value."] };
  if (original === "annual" && canonical === "monthly") return { ok: true as const, canonicalPeriod: canonical, factor: 1 / 12, conversionApplied: true, warnings: ["Converted annual value to monthly value."] };
  if (original === "one_time" || canonical === "one_time") return { ok: false as const, message: "One-time values cannot be converted to recurring periods." };
  if (original === "per_unit") {
    if (!request.calculationPeriodContext.unitCount) return { ok: false as const, message: "Per-unit values require explicit unit-count context." };
    return { ok: true as const, canonicalPeriod: canonical, factor: request.calculationPeriodContext.unitCount, conversionApplied: true, warnings: ["Converted per-unit value using explicit unit count."] };
  }
  if (original === "per_square_foot") {
    const area = request.calculationPeriodContext.rentableSquareFeet ?? request.calculationPeriodContext.grossBuildingArea;
    if (!area) return { ok: false as const, message: "Per-square-foot values require an approved area basis." };
    return { ok: true as const, canonicalPeriod: canonical, factor: area, conversionApplied: true, warnings: ["Converted per-square-foot value using explicit area basis."] };
  }
  return { ok: false as const, message: "Input period is unsupported or incompatible with the canonical input." };
}

function dataTypeFor(definition: UnderwritingInputDefinition, raw?: UnderwritingRawInputValue): NormalizationDataType {
  if (raw?.suppliedDataType) return raw.suppliedDataType;
  if (definition.dataType === "money") return "money";
  if (definition.dataType === "percentage") return "percentage";
  if (definition.dataType === "integer" && definition.canonicalUnit === "count") return "count";
  if (definition.dataType === "integer") return "integer";
  if (definition.dataType === "number" && ["square_feet", "acres"].includes(definition.canonicalUnit)) return "area";
  if (definition.dataType === "number" && ["months", "years"].includes(definition.canonicalUnit)) return "duration";
  if (definition.dataType === "number" && definition.canonicalUnit === "ratio") return "ratio";
  if (definition.dataType === "number") return "decimal";
  if (definition.dataType === "boolean") return "boolean";
  if (definition.dataType === "date") return "date";
  if (definition.dataType === "derived") return "derived";
  if (definition.inputId === "property_type") return "enum";
  return "text";
}

function definitionForDataType(dataType: NormalizationDataType) {
  const mapping: Record<NormalizationDataType, string> = {
    money: "money.usd",
    decimal: "decimal.generic",
    integer: "integer.generic",
    percentage: "percentage.decimal_fraction",
    ratio: "percentage.decimal_fraction",
    count: "count.integer",
    area: "area.square_feet",
    boolean: "boolean.strict",
    enum: "enum.canonical_token",
    date: "date.iso",
    duration: "duration.months_years",
    text: "text.trim",
    identifier: "identifier.preserve",
    derived: "text.trim",
  };
  return resolveNormalizationDefinition(mapping[dataType]);
}

function validateRange(definition: UnderwritingInputDefinition, value: unknown): { code: UnderwritingValidationErrorCode; message: string; status?: UnderwritingValidationStatus } | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return { code: "invalid_type", message: "Non-finite values are not valid.", status: "invalid_type" };
  if (definition.allowedRange?.min !== undefined && value < definition.allowedRange.min) return { code: value < 0 ? "invalid_sign" : "invalid_range", message: "Value is below the allowed input range.", status: value < 0 ? "invalid_sign" : "invalid_range" };
  if (definition.allowedRange?.max !== undefined && value > definition.allowedRange.max) return { code: "invalid_range", message: "Value is above the allowed input range.", status: "invalid_range" };
  return null;
}

function assumptionStateFor(definition: UnderwritingInputDefinition, raw?: UnderwritingRawInputValue): AssumptionValidationOutcome {
  if (!raw) return "none";
  if (raw.conflictState === "unresolved" && raw.conflictMateriality !== "informational") return "blocked_conflict";
  if (raw.classification === "accepted_user_assumption") {
    if (!raw.acceptedAssumptionId) return "missing_provenance";
    return ["accepted_fact_or_accepted_assumption", "preliminary_assumption_allowed"].includes(definition.assumptionPolicy) ? "accepted" : "assumption_not_allowed";
  }
  if (raw.classification === "preliminary_assumption") {
    if (!raw.preliminaryAssumptionId) return "missing_provenance";
    return definition.assumptionPolicy === "preliminary_assumption_allowed" ? "preliminary_allowed" : "preliminary_not_allowed";
  }
  return "none";
}

function assumptionWarning(state: AssumptionValidationOutcome) {
  if (state === "accepted") return ["Accepted assumption remains visible in underwriting validation."];
  if (state === "preliminary_allowed") return ["Preliminary assumption is allowed but remains provisional."];
  return [];
}

function isProvenancePermitted(definition: UnderwritingInputDefinition, raw: UnderwritingRawInputValue) {
  if (!definition.provenanceRequired) return true;
  if (raw.sourceClassification && !definition.acceptedSourceClassifications.includes(raw.sourceClassification)) return false;
  return Boolean(raw.sourceFactId || raw.acceptedAssumptionId || raw.preliminaryAssumptionId || raw.sourceRecordId || raw.evidenceId || raw.classification === "accepted_fact" || raw.classification === "descriptive_input");
}

function validateAuthorization(request: UnderwritingValidationRequest): UnderwritingValidationError | null {
  if (request.authorization) {
    const access = authorizeUnderwritingSchemaAccess(request.authorization);
    if (!access.authorized) return typedError("unauthorized_subject", access.safeMessage, "blocking");
  }
  const authorized = request.authorizedSubjectIds;
  if (!authorized) return null;
  if (authorized.workspaceIds && !authorized.workspaceIds.includes(request.workspaceId)) return typedError("unauthorized_subject", "Workspace is not authorized for validation.", "blocking");
  if (authorized.dealIds && !authorized.dealIds.includes(request.dealId)) return typedError("unauthorized_subject", "Deal is not authorized for validation.", "blocking");
  if (authorized.propertyIds && request.propertyIds.some((id) => !authorized.propertyIds?.includes(id))) return typedError("unauthorized_subject", "Property is not authorized for validation.", "blocking");
  return null;
}

function validateValueAuthorization(raw: UnderwritingRawInputValue, request: UnderwritingValidationRequest) {
  const authorized = request.authorizedSubjectIds;
  if (!authorized) return null;
  if (raw.sourceFactId && authorized.sourceFactIds && !authorized.sourceFactIds.includes(raw.sourceFactId)) return "Source fact is not authorized for this workspace.";
  if (raw.acceptedAssumptionId && authorized.acceptedAssumptionIds && !authorized.acceptedAssumptionIds.includes(raw.acceptedAssumptionId)) return "Accepted assumption is not authorized for this workspace.";
  if (raw.preliminaryAssumptionId && authorized.preliminaryAssumptionIds && !authorized.preliminaryAssumptionIds.includes(raw.preliminaryAssumptionId)) return "Preliminary assumption is not authorized for this workspace.";
  if (raw.sourceRecordId && authorized.sourceRecordIds && !authorized.sourceRecordIds.includes(raw.sourceRecordId)) return "Source record is not authorized for this workspace.";
  if (raw.evidenceId && authorized.evidenceIds && !authorized.evidenceIds.includes(raw.evidenceId)) return "Evidence is not authorized for this workspace.";
  return null;
}

function determineOverallStatus(input: {
  relationshipErrors: UnderwritingValidationError[];
  missingRequiredInputs: UnderwritingInputId[];
  invalidRequiredInputs: UnderwritingInputId[];
  conflictedRequiredInputs: UnderwritingInputId[];
  provisionalRequiredInputs: UnderwritingInputId[];
  normalizedInputs: NormalizedUnderwritingInput[];
}): UnderwritingOverallValidationStatus {
  if (input.conflictedRequiredInputs.length) return "blocked_conflict";
  if (input.relationshipErrors.some((error) => error.code === "blocked_conflict")) return "blocked_conflict";
  if (input.relationshipErrors.some((error) => error.severity === "blocking") || input.invalidRequiredInputs.length) return "invalid";
  if (input.missingRequiredInputs.length) return "incomplete";
  if (input.provisionalRequiredInputs.length) return "preliminary";
  if (input.normalizedInputs.some((item) => item.assumptionState === "accepted")) return "valid_with_accepted_assumptions";
  return "valid";
}

function invalidResult(request: UnderwritingValidationRequest, status: UnderwritingOverallValidationStatus, errors: UnderwritingValidationError[]): UnderwritingValidationResult {
  return {
    validationId: request.validationId,
    schemaId: request.schemaId,
    schemaVersion: request.schemaVersion,
    schemaRegistryVersion: request.schemaRegistryVersion,
    inputRegistryVersion: request.inputRegistryVersion,
    validationRegistryVersion: request.validationRegistryVersion,
    normalizationRegistryVersion: request.normalizationRegistryVersion,
    formulaRegistryVersion: request.formulaRegistryVersion,
    overallStatus: status,
    normalizedInputs: [],
    validRequiredInputs: [],
    missingRequiredInputs: [],
    invalidRequiredInputs: [],
    conflictedRequiredInputs: [],
    provisionalRequiredInputs: [],
    optionalWarnings: [],
    relationshipErrors: errors,
    formulaReadiness: [],
    blockingReasons: errors.map((error) => error.safeMessage).sort(),
    warnings: [],
    deterministicResultHash: stableHash({ status, errors: errors.map((error) => ({ code: error.code, ruleId: error.ruleId, inputId: error.inputId })), request: stableRequestHashBasis(request) }),
    validatedAt: request.requestTimestamp,
  };
}

function resultHash(request: UnderwritingValidationRequest, inputs: NormalizedUnderwritingInput[], relationshipErrors: UnderwritingValidationError[], formulaReadiness: FormulaReadinessProjection[]) {
  return stableHash({
    schemaId: request.schemaId,
    schemaVersion: request.schemaVersion,
    schemaRegistryVersion: request.schemaRegistryVersion,
    inputRegistryVersion: request.inputRegistryVersion,
    validationRegistryVersion: request.validationRegistryVersion,
    normalizationRegistryVersion: request.normalizationRegistryVersion,
    formulaRegistryVersion: request.formulaRegistryVersion,
    inputs: inputs.map((input) => ({
      inputId: input.inputId,
      status: input.validationStatus,
      normalizedValue: input.normalizedValue,
      originalUnit: input.originalUnit,
      canonicalUnit: input.canonicalUnit,
      originalPeriod: input.originalPeriod,
      canonicalPeriod: input.canonicalPeriod,
      originalCurrency: input.originalCurrency,
      canonicalCurrency: input.canonicalCurrency,
      sourceFactId: input.sourceFactId,
      acceptedAssumptionId: input.acceptedAssumptionId,
      preliminaryAssumptionId: input.preliminaryAssumptionId,
      sourceRecordId: input.sourceRecordId,
      evidenceId: input.evidenceId,
      inputVersion: input.inputVersion,
      conflictState: input.conflictState,
      errors: input.errors.map((error) => ({ code: error.code, ruleId: error.ruleId })),
    })),
    relationshipErrors: relationshipErrors.map((error) => ({ code: error.code, inputId: error.inputId, ruleId: error.ruleId })),
    formulaReadiness,
  });
}

function stableRequestHashBasis(request: UnderwritingValidationRequest) {
  return {
    schemaId: request.schemaId,
    schemaVersion: request.schemaVersion,
    registryVersions: [
      request.schemaRegistryVersion,
      request.inputRegistryVersion,
      request.validationRegistryVersion,
      request.normalizationRegistryVersion,
      request.formulaRegistryVersion,
    ],
  };
}

function typedError(code: UnderwritingValidationErrorCode, safeMessage: string, severity: ValidationSeverity, inputId?: UnderwritingInputId, ruleId?: string): UnderwritingValidationError {
  return { code, inputId, ruleId, safeMessage, severity };
}

function errorStatusFor(code: UnderwritingValidationErrorCode): UnderwritingValidationStatus {
  if (code === "unsupported_unit") return "unsupported_unit";
  if (code === "unsupported_period") return "unsupported_period";
  if (code === "unsupported_currency" || code === "mixed_currency") return "unsupported_currency";
  if (code === "ambiguous_format") return "ambiguous";
  if (code === "invalid_range") return "invalid_range";
  if (code === "invalid_type") return "invalid_type";
  return "invalid_type";
}

function displayValue(value: string | number | boolean, dataType: NormalizationDataType, currency: string | undefined, period: FormulaPeriod, unit: FormulaUnit) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;
  const suffix = period === "none" ? "" : `/${period}`;
  if (dataType === "money") return `${currency ?? ""} ${value.toFixed(2)}${suffix}`.trim();
  if (dataType === "percentage" || dataType === "ratio") return `${(value * 100).toFixed(2)}%`;
  if (unit === "square_feet") return `${value} sq ft`;
  return `${value}${suffix}`;
}

function rule(ruleId: string, displayName: string, description: string, category: ValidationRuleCategory, severity: ValidationSeverity, priority: number, blockingBehavior: ValidationRuleDefinition["blockingBehavior"], status: ValidationRuleStatus = "active", semanticVersion = "1.0.0"): ValidationRuleDefinition {
  return {
    ruleId,
    displayName,
    description,
    semanticVersion,
    registryVersion: UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
    applicableInputIds: "all",
    applicableSchemaIds: "all",
    applicableDataTypes: "all",
    ruleCategory: category,
    severity,
    executionPriority: priority,
    blockingBehavior,
    implementationRef: `src/core/underwritingValidation.ts:${ruleId}`,
    explanationTemplate: description,
    status,
    effectiveDate: EFFECTIVE_DATE,
    deprecatedDate: status === "deprecated" || status === "disabled" ? EFFECTIVE_DATE : undefined,
  };
}

function normalization(normalizationId: string, sourceDataType: NormalizationDataType, canonicalDataType: NormalizationDataType, acceptedUnits: FormulaUnit[], canonicalUnit: FormulaUnit, acceptedPeriods: FormulaPeriod[], canonicalPeriod: FormulaPeriod, currencyBehavior: NormalizationDefinition["currencyBehavior"], status: UnderwritingRegistryStatus = "active"): NormalizationDefinition {
  return {
    normalizationId,
    semanticVersion: "1.0.0",
    registryVersion: UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
    applicableInputIds: "all",
    sourceDataTypes: [sourceDataType],
    canonicalDataType,
    acceptedSourceUnits: [...acceptedUnits].sort(),
    canonicalUnit,
    acceptedSourcePeriods: [...acceptedPeriods].sort(),
    canonicalPeriod,
    currencyBehavior,
    localeBehavior: "explicit_only",
    transformationRef: `src/core/underwritingValidation.ts:${normalizationId}`,
    precisionBehavior: canonicalDataType === "text" || canonicalDataType === "identifier" ? "preserve_text" : "apply_input_precision",
    rawValuePreservation: "always",
    ambiguityBehavior: "typed_unresolved_result",
    status,
    effectiveDate: EFFECTIVE_DATE,
    deprecatedDate: status === "deprecated" || status === "disabled" ? EFFECTIVE_DATE : undefined,
  };
}

function normalizeCurrency(value?: string) {
  return value?.trim().toUpperCase();
}

function normalizeToken(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function applyUnitConversion(value: number, factor: number) {
  return value * factor;
}

function applyPeriodConversion(value: number, factor: number) {
  return value * factor;
}

function withinTolerance(left: number, right: number, tolerance: number) {
  return Math.abs(left - right) <= tolerance;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function sortedUniqueInputIds(values: UnderwritingInputId[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function sortedUniqueStrings(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
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

function compareSemver(a: string, b: string) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

void listFormulaDefinitions;

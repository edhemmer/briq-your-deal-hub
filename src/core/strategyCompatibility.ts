import type { FormulaId } from "./formulaRegistry";
import {
  STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
  STRATEGY_REQUIREMENT_REGISTRY_VERSION,
  listStrategyHardDisqualifiers,
  listStrategyRequirements,
  type StrategyHardDisqualifierDefinition,
  type StrategyRequirementDefinition,
} from "./strategyRequirements";
import {
  STRATEGY_REGISTRY_VERSION,
  resolveStrategyDefinition,
  type StrategyDefinition,
} from "./strategyRegistry";
import {
  UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
  UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
  type UnderwritingCoreFormulaResultRecord,
  type UnderwritingCoreOutputRunRecord,
} from "./underwritingCoreOutputs";
import {
  UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
  type UnderwritingSnapshotInputRecord,
  type UnderwritingSnapshotRecord,
} from "./underwritingSnapshots";
import type { UnderwritingInputId, UnderwritingMode, UnderwritingPropertyProfile } from "./underwritingInputSchemas";

export const STRATEGY_COMPATIBILITY_ENGINE_ID = "strategy_compatibility_engine";
export const STRATEGY_COMPATIBILITY_ENGINE_VERSION = "1.0.0";
export const STRATEGY_COMPATIBILITY_RULE_ORDERING_VERSION = "strategy-compatibility-rule-order-v1";
export const STRATEGY_COMPATIBILITY_MISSING_DATA_BEHAVIOR_VERSION = "strategy-compatibility-missing-data-v1";
export const STRATEGY_COMPATIBILITY_CONFLICT_BEHAVIOR_VERSION = "strategy-compatibility-conflict-v1";
export const STRATEGY_COMPATIBILITY_EXPLANATION_CONTRACT_VERSION = "strategy-compatibility-explanation-v1";
export const STRATEGY_COMPATIBILITY_RESULT_VERSION = "strategy-compatibility-result-v1";
export const STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION = "strategy-compatibility-result-hash-v1";
export const STRATEGY_COMPATIBILITY_MAX_BATCH_CANDIDATES = 12;
const REQUIRED_COMPATIBILITY_PERMISSIONS = ["deal.read", "property.read", "underwriting.read", "strategy.evaluate"] as const;

export type StrategyCompatibilityEngineStatus = "draft" | "active" | "deprecated" | "disabled";
export type StrategyCompatibilityStatus = "compatible" | "compatible_with_conditions" | "uncertain" | "incompatible" | "not_evaluated";
export type StrategyCompatibilityCompletenessState =
  | "complete_evidence"
  | "accepted_assumptions"
  | "preliminary"
  | "incomplete"
  | "conflicted"
  | "unavailable_dependency";
export type StrategyDependencyAvailabilityState =
  | "available"
  | "missing"
  | "unavailable_module"
  | "stale"
  | "conflicted"
  | "unverified"
  | "not_applicable";
export type StrategyRequirementEvaluationStatus =
  | "satisfied"
  | "satisfied_with_condition"
  | "unsatisfied"
  | "uncertain"
  | "missing"
  | "conflicted"
  | "unavailable_dependency"
  | "not_applicable"
  | "not_evaluated";
export type StrategyHardDisqualifierEvaluationStatus =
  | "triggered"
  | "not_triggered"
  | "uncertain"
  | "missing_dependency"
  | "conflicted"
  | "unavailable_dependency"
  | "not_applicable"
  | "not_evaluated";
export type StrategyCompatibilityErrorCode =
  | "strategy_not_found"
  | "strategy_version_not_found"
  | "strategy_not_evaluation_ready"
  | "strategy_disabled"
  | "compatibility_engine_not_found"
  | "compatibility_engine_version_not_found"
  | "requirement_manifest_invalid"
  | "disqualifier_manifest_invalid"
  | "snapshot_not_found"
  | "snapshot_hash_mismatch"
  | "underwriting_run_not_found"
  | "result_set_hash_mismatch"
  | "dependency_not_found"
  | "dependency_unavailable"
  | "dependency_stale"
  | "blocked_conflict"
  | "ambiguous_legacy_strategy"
  | "unauthorized_deal"
  | "unauthorized_property"
  | "unauthorized_snapshot"
  | "unauthorized_source"
  | "idempotency_conflict"
  | "compatibility_result_not_found"
  | "compatibility_result_immutable"
  | "internal_compatibility_error";

export type StrategyCompatibilityEngineDefinition = {
  engineId: typeof STRATEGY_COMPATIBILITY_ENGINE_ID;
  semanticVersion: string;
  registryVersion: "strategy-compatibility-engine-registry-v1";
  status: StrategyCompatibilityEngineStatus;
  supportedStrategyRegistryVersions: Array<typeof STRATEGY_REGISTRY_VERSION>;
  supportedRequirementRegistryVersions: Array<typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION>;
  supportedDisqualifierRegistryVersions: Array<typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION>;
  supportedUnderwritingContractVersions: Array<typeof UNDERWRITING_SNAPSHOT_CONTRACT_VERSION | typeof UNDERWRITING_CORE_OUTPUT_RUN_VERSION | typeof UNDERWRITING_CORE_OUTPUT_HASH_VERSION>;
  ruleOrderingVersion: typeof STRATEGY_COMPATIBILITY_RULE_ORDERING_VERSION;
  missingDataBehaviorVersion: typeof STRATEGY_COMPATIBILITY_MISSING_DATA_BEHAVIOR_VERSION;
  conflictBehaviorVersion: typeof STRATEGY_COMPATIBILITY_CONFLICT_BEHAVIOR_VERSION;
  explanationContractVersion: typeof STRATEGY_COMPATIBILITY_EXPLANATION_CONTRACT_VERSION;
  effectiveDate: string;
  deprecatedDate: string | null;
  replacementEngineVersion: string | null;
};

export type StrategyCompatibilityActorContext = {
  actorId?: string;
  workspaceId: string;
  membershipStatus: "active" | "revoked" | "missing";
  permissions: Array<"deal.read" | "property.read" | "underwriting.read" | "strategy.evaluate">;
  sourceClient: "server" | "web" | "iphone" | "ipad" | "report" | "test";
};

export type StrategyCompatibilityDependencyValue = {
  dependencyId: string;
  availability: StrategyDependencyAvailabilityState;
  value?: string | number | boolean | null;
  canonicalValueHash?: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  verificationState: "confirmed" | "source_backed" | "estimated" | "user_entered" | "missing" | "unknown" | "professional_review_recommended";
  assumptionState: "none" | "accepted" | "preliminary";
  professionalReviewRequired: boolean;
  explanation: string;
};

export type StrategyCompatibilityDependencyContext = {
  contextVersion: "strategy-compatibility-dependency-context-v1";
  propertyProfile: UnderwritingPropertyProfile;
  underwritingMode: UnderwritingMode;
  transactionContext: string;
  propertyPhysicalCharacteristics: Record<string, string | number | boolean | null>;
  acceptedUserConstraints: StrategyCompatibilityDependencyValue[];
  acceptedAssumptions: StrategyCompatibilityDependencyValue[];
  explicitRestrictions: StrategyCompatibilityDependencyValue[];
  financingAvailability: StrategyCompatibilityDependencyValue[];
  futureDependencies: StrategyCompatibilityDependencyValue[];
};

export type StrategyCompatibilityEvaluationRequest = {
  evaluationRequestId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  underwritingSnapshotId: string;
  underwritingRunId: string;
  expectedSnapshotHash: string;
  expectedResultSetHash: string;
  strategyId: string;
  strategyVersion: string | "latest";
  strategyRegistryVersion: typeof STRATEGY_REGISTRY_VERSION;
  requirementRegistryVersion: typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION;
  disqualifierRegistryVersion: typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION;
  compatibilityEngineVersion: string;
  dependencyContext: StrategyCompatibilityDependencyContext;
  actorContext: StrategyCompatibilityActorContext;
  idempotencyKey: string;
  requestedAt: string;
};

export type StrategyRequirementEvaluationResult = {
  requirementId: string;
  requirementVersion: string;
  strategyId: string;
  strategyVersion: string;
  category: string;
  blockingClassification: StrategyRequirementDefinition["blockingClassification"];
  evaluationStatus: StrategyRequirementEvaluationStatus;
  canonicalSubjectReference: string;
  requiredInputRefs: UnderwritingInputId[];
  requiredOutputRefs: FormulaId[];
  actualCanonicalValuesUsed: Array<{ ref: string; state: StrategyDependencyAvailabilityState; valueHash: string | null }>;
  sourceRefs: string[];
  evidenceRefs: string[];
  conditionResult: "true" | "false" | "unknown" | "not_applicable";
  missingDependencies: string[];
  conflicts: string[];
  verificationState: string;
  assumptionState: "none" | "accepted" | "preliminary";
  professionalReviewRequired: boolean;
  explanation: string;
  deterministicResultHash: string;
  stableOrdinal: number;
};

export type StrategyHardDisqualifierEvaluationResult = {
  disqualifierId: string;
  disqualifierVersion: string;
  strategyId: string;
  strategyVersion: string;
  triggerCategory: string;
  severity: StrategyHardDisqualifierDefinition["severity"];
  evaluationStatus: StrategyHardDisqualifierEvaluationStatus;
  triggerResult: "true" | "false" | "unknown" | "not_applicable";
  controllingCanonicalValues: Array<{ ref: string; state: StrategyDependencyAvailabilityState; valueHash: string | null }>;
  sourceRefs: string[];
  evidenceRefs: string[];
  verificationState: string;
  assumptionState: "none" | "accepted" | "preliminary";
  professionalReviewRequired: boolean;
  remediationMetadata: StrategyHardDisqualifierDefinition["remediationHook"];
  explanation: string;
  deterministicResultHash: string;
  stableOrdinal: number;
};

export type StrategyCompatibilityResult = {
  compatibilityResultId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  snapshotId: string;
  underwritingRunId: string;
  strategyId: string;
  strategyVersion: string;
  strategyRegistryVersion: typeof STRATEGY_REGISTRY_VERSION;
  requirementRegistryVersion: typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION;
  disqualifierRegistryVersion: typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION;
  compatibilityEngineVersion: string;
  compatibilityStatus: StrategyCompatibilityStatus;
  evaluationReadiness: StrategyCompatibilityCompletenessState;
  hardDisqualifierCount: number;
  triggeredDisqualifierCount: number;
  satisfiedRequirementCount: number;
  conditionalRequirementCount: number;
  unsatisfiedRequirementCount: number;
  missingRequirementCount: number;
  conflictedRequirementCount: number;
  unavailableDependencyCount: number;
  acceptedAssumptionCount: number;
  preliminaryAssumptionCount: number;
  professionalReviewCount: number;
  requirementResultManifest: StrategyRequirementEvaluationResult[];
  disqualifierResultManifest: StrategyHardDisqualifierEvaluationResult[];
  controllingReasons: string[];
  missingDependencies: string[];
  requiredProfessionalReviews: string[];
  deterministicResultHash: string;
  idempotencyKey: string;
  evaluatedBy: string;
  requestedAt: string;
  completedAt: string;
  version: typeof STRATEGY_COMPATIBILITY_RESULT_VERSION;
  errors: Array<{ code: StrategyCompatibilityErrorCode; safeMessage: string }>;
};

export type StrategyCompatibilityBatchRequest = {
  batchRequestId: string;
  candidates: Array<Pick<StrategyCompatibilityEvaluationRequest, "strategyId" | "strategyVersion">>;
  baseRequest: Omit<StrategyCompatibilityEvaluationRequest, "evaluationRequestId" | "strategyId" | "strategyVersion" | "idempotencyKey">;
  maximumCandidateCount: number;
};

export type StrategyCompatibilityBatchResult = {
  batchRequestId: string;
  completionStatus: "complete" | "partial" | "failed";
  stableEvaluationOrder: string[];
  results: StrategyCompatibilityResult[];
  failedResults: Array<{ strategyId: string; strategyVersion: string; code: StrategyCompatibilityErrorCode; safeMessage: string }>;
  deterministicBatchHash: string;
};

export class StrategyCompatibilityError extends Error {
  constructor(
    public readonly code: StrategyCompatibilityErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StrategyCompatibilityError";
  }
}

export const strategyCompatibilityEngineDefinitions: readonly StrategyCompatibilityEngineDefinition[] = Object.freeze([
  {
    engineId: STRATEGY_COMPATIBILITY_ENGINE_ID,
    semanticVersion: "0.9.0",
    registryVersion: "strategy-compatibility-engine-registry-v1",
    status: "deprecated",
    supportedStrategyRegistryVersions: [STRATEGY_REGISTRY_VERSION],
    supportedRequirementRegistryVersions: [STRATEGY_REQUIREMENT_REGISTRY_VERSION],
    supportedDisqualifierRegistryVersions: [STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION],
    supportedUnderwritingContractVersions: [UNDERWRITING_SNAPSHOT_CONTRACT_VERSION, UNDERWRITING_CORE_OUTPUT_RUN_VERSION, UNDERWRITING_CORE_OUTPUT_HASH_VERSION],
    ruleOrderingVersion: STRATEGY_COMPATIBILITY_RULE_ORDERING_VERSION,
    missingDataBehaviorVersion: STRATEGY_COMPATIBILITY_MISSING_DATA_BEHAVIOR_VERSION,
    conflictBehaviorVersion: STRATEGY_COMPATIBILITY_CONFLICT_BEHAVIOR_VERSION,
    explanationContractVersion: STRATEGY_COMPATIBILITY_EXPLANATION_CONTRACT_VERSION,
    effectiveDate: "2026-07-30",
    deprecatedDate: "2026-07-31",
    replacementEngineVersion: STRATEGY_COMPATIBILITY_ENGINE_VERSION,
  },
  {
    engineId: STRATEGY_COMPATIBILITY_ENGINE_ID,
    semanticVersion: STRATEGY_COMPATIBILITY_ENGINE_VERSION,
    registryVersion: "strategy-compatibility-engine-registry-v1",
    status: "active",
    supportedStrategyRegistryVersions: [STRATEGY_REGISTRY_VERSION],
    supportedRequirementRegistryVersions: [STRATEGY_REQUIREMENT_REGISTRY_VERSION],
    supportedDisqualifierRegistryVersions: [STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION],
    supportedUnderwritingContractVersions: [UNDERWRITING_SNAPSHOT_CONTRACT_VERSION, UNDERWRITING_CORE_OUTPUT_RUN_VERSION, UNDERWRITING_CORE_OUTPUT_HASH_VERSION],
    ruleOrderingVersion: STRATEGY_COMPATIBILITY_RULE_ORDERING_VERSION,
    missingDataBehaviorVersion: STRATEGY_COMPATIBILITY_MISSING_DATA_BEHAVIOR_VERSION,
    conflictBehaviorVersion: STRATEGY_COMPATIBILITY_CONFLICT_BEHAVIOR_VERSION,
    explanationContractVersion: STRATEGY_COMPATIBILITY_EXPLANATION_CONTRACT_VERSION,
    effectiveDate: "2026-07-31",
    deprecatedDate: null,
    replacementEngineVersion: null,
  },
  {
    engineId: STRATEGY_COMPATIBILITY_ENGINE_ID,
    semanticVersion: "2.0.0",
    registryVersion: "strategy-compatibility-engine-registry-v1",
    status: "disabled",
    supportedStrategyRegistryVersions: [STRATEGY_REGISTRY_VERSION],
    supportedRequirementRegistryVersions: [STRATEGY_REQUIREMENT_REGISTRY_VERSION],
    supportedDisqualifierRegistryVersions: [STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION],
    supportedUnderwritingContractVersions: [UNDERWRITING_SNAPSHOT_CONTRACT_VERSION, UNDERWRITING_CORE_OUTPUT_RUN_VERSION, UNDERWRITING_CORE_OUTPUT_HASH_VERSION],
    ruleOrderingVersion: STRATEGY_COMPATIBILITY_RULE_ORDERING_VERSION,
    missingDataBehaviorVersion: STRATEGY_COMPATIBILITY_MISSING_DATA_BEHAVIOR_VERSION,
    conflictBehaviorVersion: STRATEGY_COMPATIBILITY_CONFLICT_BEHAVIOR_VERSION,
    explanationContractVersion: STRATEGY_COMPATIBILITY_EXPLANATION_CONTRACT_VERSION,
    effectiveDate: "2026-07-31",
    deprecatedDate: null,
    replacementEngineVersion: null,
  },
]);

export function resolveLatestActiveCompatibilityEngine() {
  const active = strategyCompatibilityEngineDefinitions
    .filter((definition) => definition.status === "active")
    .sort((a, b) => compareSemver(b.semanticVersion, a.semanticVersion));
  if (!active[0]) throw new StrategyCompatibilityError("compatibility_engine_not_found", "No active Strategy Compatibility engine is available.");
  return active[0];
}

export function resolveCompatibilityEngineVersion(version: string) {
  const engine = strategyCompatibilityEngineDefinitions.find((definition) => definition.semanticVersion === version);
  if (!engine) throw new StrategyCompatibilityError("compatibility_engine_version_not_found", "The requested Strategy Compatibility engine version is not available.");
  return engine;
}

export function evaluateStrategyCompatibility(
  request: StrategyCompatibilityEvaluationRequest,
  snapshot: UnderwritingSnapshotRecord,
  underwritingRun: UnderwritingCoreOutputRunRecord,
): StrategyCompatibilityResult {
  const engine = resolveCompatibilityEngineVersion(request.compatibilityEngineVersion);
  const preflight = validatePreflight(request, snapshot, underwritingRun, engine);
  let strategy: StrategyDefinition | undefined;
  try {
    strategy = resolveStrategyDefinition(request.strategyId, request.strategyVersion);
  } catch {
    return notEvaluatedResult(request, snapshot, underwritingRun, engine, "strategy_not_found", "The selected strategy/version is not registered.");
  }
  if (preflight) return notEvaluatedResult(request, snapshot, underwritingRun, engine, preflight.code, preflight.safeMessage, strategy);
  if (engine.status === "disabled") return notEvaluatedResult(request, snapshot, underwritingRun, engine, "compatibility_engine_version_not_found", "This compatibility engine version is disabled.", strategy);
  if (engine.status !== "active") return notEvaluatedResult(request, snapshot, underwritingRun, engine, "compatibility_engine_version_not_found", "This compatibility engine version is historical and cannot run new evaluations.", strategy);
  if (strategy.lifecycleStatus !== "active") return notEvaluatedResult(request, snapshot, underwritingRun, engine, strategy.lifecycleStatus === "disabled" ? "strategy_disabled" : "strategy_not_evaluation_ready", "This strategy version is not available for new compatibility evaluation.", strategy);

  const requirements = listStrategyRequirements({ strategyId: strategy.strategyId, includeInformational: true });
  const disqualifiers = listStrategyHardDisqualifiers({ strategyId: strategy.strategyId });
  if (requirements.length === 0) return notEvaluatedResult(request, snapshot, underwritingRun, engine, "requirement_manifest_invalid", "The selected strategy has no requirement manifest.", strategy);
  if (disqualifiers.length === 0) return notEvaluatedResult(request, snapshot, underwritingRun, engine, "disqualifier_manifest_invalid", "The selected strategy has no hard-disqualifier manifest.", strategy);

  const evidence = buildEvidenceIndex(snapshot, underwritingRun, request.dependencyContext);
  const disqualifierResults = disqualifiers.sort(compareDisqualifierDefinitions).map((definition, index) => evaluateHardDisqualifier(definition, strategy, evidence, index + 1));
  const requirementResults = requirements.sort(compareRequirementDefinitions).map((definition, index) => evaluateRequirement(definition, strategy, evidence, index + 1));
  return finalizeResult(request, snapshot, underwritingRun, strategy, engine, requirementResults, disqualifierResults);
}

export function evaluateStrategyCompatibilityBatch(
  request: StrategyCompatibilityBatchRequest,
  snapshot: UnderwritingSnapshotRecord,
  underwritingRun: UnderwritingCoreOutputRunRecord,
): StrategyCompatibilityBatchResult {
  const candidates = request.candidates.slice(0, Math.min(request.maximumCandidateCount, STRATEGY_COMPATIBILITY_MAX_BATCH_CANDIDATES));
  const ordered = [...candidates].sort((a, b) => {
    const left = safeStrategyOrdinal(a.strategyId, a.strategyVersion);
    const right = safeStrategyOrdinal(b.strategyId, b.strategyVersion);
    return left - right || a.strategyId.localeCompare(b.strategyId);
  });
  const results: StrategyCompatibilityResult[] = [];
  const failedResults: StrategyCompatibilityBatchResult["failedResults"] = [];
  for (const candidate of ordered) {
    try {
      results.push(evaluateStrategyCompatibility({
        ...request.baseRequest,
        evaluationRequestId: `${request.batchRequestId}:${candidate.strategyId}:${candidate.strategyVersion}`,
        strategyId: candidate.strategyId,
        strategyVersion: candidate.strategyVersion,
        idempotencyKey: `${request.batchRequestId}:${candidate.strategyId}:${candidate.strategyVersion}`,
      }, snapshot, underwritingRun));
    } catch (error) {
      failedResults.push({
        strategyId: candidate.strategyId,
        strategyVersion: candidate.strategyVersion,
        code: error instanceof StrategyCompatibilityError ? error.code : "internal_compatibility_error",
        safeMessage: error instanceof Error ? error.message : "Compatibility evaluation failed.",
      });
    }
  }
  return deepFreeze({
    batchRequestId: request.batchRequestId,
    completionStatus: failedResults.length === 0 ? "complete" : results.length > 0 ? "partial" : "failed",
    stableEvaluationOrder: ordered.map((candidate) => `${candidate.strategyId}@${candidate.strategyVersion}`),
    results,
    failedResults,
    deterministicBatchHash: stableHash({
      batchRequestId: request.batchRequestId,
      order: ordered.map((candidate) => `${candidate.strategyId}@${candidate.strategyVersion}`),
      resultHashes: results.map((result) => result.deterministicResultHash),
      failures: failedResults,
    }),
  });
}

export function computeStrategyCompatibilityRequestIdentity(request: StrategyCompatibilityEvaluationRequest, snapshot: UnderwritingSnapshotRecord, underwritingRun: UnderwritingCoreOutputRunRecord) {
  return stableHash({
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: snapshot.snapshotId,
    snapshotHash: snapshot.contentHash,
    underwritingRunId: underwritingRun.runId,
    resultSetHash: underwritingRun.resultSetHash,
    strategyId: request.strategyId,
    strategyVersion: request.strategyVersion,
    strategyRegistryVersion: request.strategyRegistryVersion,
    requirementRegistryVersion: request.requirementRegistryVersion,
    disqualifierRegistryVersion: request.disqualifierRegistryVersion,
    compatibilityEngineVersion: request.compatibilityEngineVersion,
    dependencyContextHash: stableHash(request.dependencyContext),
  });
}

function validatePreflight(
  request: StrategyCompatibilityEvaluationRequest,
  snapshot: UnderwritingSnapshotRecord,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  engine: StrategyCompatibilityEngineDefinition,
): { code: StrategyCompatibilityErrorCode; safeMessage: string } | null {
  if (!request.actorContext.actorId) return { code: "unauthorized_deal", safeMessage: "Sign in is required before protected Deal strategy compatibility can be evaluated." };
  if (request.actorContext.membershipStatus === "revoked") return { code: "unauthorized_deal", safeMessage: "Workspace access has been revoked." };
  if (request.actorContext.membershipStatus !== "active") return { code: "unauthorized_deal", safeMessage: "Active workspace membership is required." };
  if (!REQUIRED_COMPATIBILITY_PERMISSIONS.every((permission) => request.actorContext.permissions.includes(permission))) return { code: "unauthorized_deal", safeMessage: "You do not have permission to evaluate Strategy Compatibility." };
  if (request.actorContext.workspaceId !== request.workspaceId) return { code: "unauthorized_deal", safeMessage: "The actor context does not match the requested workspace." };
  if (snapshot.workspaceId !== request.workspaceId || snapshot.dealId !== request.dealId) return { code: "unauthorized_snapshot", safeMessage: "The underwriting snapshot does not belong to the requested workspace and Deal." };
  if (!snapshot.propertyIds.includes(request.propertyId)) return { code: "unauthorized_property", safeMessage: "The requested Property is not part of the underwriting snapshot." };
  if (underwritingRun.workspaceId !== request.workspaceId || underwritingRun.dealId !== request.dealId || underwritingRun.snapshotId !== request.underwritingSnapshotId) return { code: "underwriting_run_not_found", safeMessage: "The underwriting run does not match the requested Deal and snapshot." };
  if (request.expectedSnapshotHash !== snapshot.contentHash) return { code: "snapshot_hash_mismatch", safeMessage: "The selected underwriting snapshot is stale. Refresh and retry." };
  if (request.expectedResultSetHash !== underwritingRun.resultSetHash) return { code: "result_set_hash_mismatch", safeMessage: "The selected underwriting result set is stale. Refresh and retry." };
  if (!engine.supportedStrategyRegistryVersions.includes(request.strategyRegistryVersion)) return { code: "compatibility_engine_version_not_found", safeMessage: "The Strategy registry version is not supported by this compatibility engine." };
  if (!engine.supportedRequirementRegistryVersions.includes(request.requirementRegistryVersion)) return { code: "compatibility_engine_version_not_found", safeMessage: "The requirement registry version is not supported by this compatibility engine." };
  if (!engine.supportedDisqualifierRegistryVersions.includes(request.disqualifierRegistryVersion)) return { code: "compatibility_engine_version_not_found", safeMessage: "The hard-disqualifier registry version is not supported by this compatibility engine." };
  return null;
}

type EvidenceIndex = {
  snapshot: UnderwritingSnapshotRecord;
  underwritingRun: UnderwritingCoreOutputRunRecord;
  dependencyContext: StrategyCompatibilityDependencyContext;
  inputs: Map<UnderwritingInputId, UnderwritingSnapshotInputRecord>;
  outputs: Map<FormulaId, UnderwritingCoreFormulaResultRecord>;
  dependencies: Map<string, StrategyCompatibilityDependencyValue>;
};

function buildEvidenceIndex(snapshot: UnderwritingSnapshotRecord, underwritingRun: UnderwritingCoreOutputRunRecord, dependencyContext: StrategyCompatibilityDependencyContext): EvidenceIndex {
  const dependencies = new Map<string, StrategyCompatibilityDependencyValue>();
  for (const item of [
    ...dependencyContext.acceptedUserConstraints,
    ...dependencyContext.acceptedAssumptions,
    ...dependencyContext.explicitRestrictions,
    ...dependencyContext.financingAvailability,
    ...dependencyContext.futureDependencies,
  ]) dependencies.set(item.dependencyId, item);
  return {
    snapshot,
    underwritingRun,
    dependencyContext,
    inputs: new Map(snapshot.inputs.map((input) => [input.inputId, input])),
    outputs: new Map(underwritingRun.results.map((result) => [result.formulaId, result])),
    dependencies,
  };
}

function evaluateRequirement(definition: StrategyRequirementDefinition, strategy: StrategyDefinition, evidence: EvidenceIndex, ordinal: number): StrategyRequirementEvaluationResult {
  const inputValues = definition.requiredCanonicalInputIds.map((inputId) => inputState(inputId, evidence));
  const outputValues = definition.requiredUnderwritingOutputIds.map((outputId) => outputState(outputId, evidence));
  const futureValues = definition.dependencyClassifications
    .filter((classification) => classification !== "canonical_input" && classification !== "underwriting_output")
    .flatMap((classification) => futureDependencyStates(classification, strategy, evidence));
  const values = [...inputValues, ...outputValues, ...futureValues];
  const blockingValues = definition.blockingClassification === "blocking" ? values.filter((value) => value.required) : [];
  const missing = values.filter((value) => value.state === "missing").map((value) => value.ref);
  const conflicted = values.filter((value) => value.state === "conflicted").map((value) => value.ref);
  const unavailable = values.filter((value) => value.state === "unavailable_module").map((value) => value.ref);
  const stale = values.filter((value) => value.state === "stale").map((value) => value.ref);
  const preliminary = values.some((value) => value.assumptionState === "preliminary");
  const acceptedAssumption = values.some((value) => value.assumptionState === "accepted");
  const professionalReviewRequired = values.some((value) => value.professionalReviewRequired);
  const allRequiredAvailable = blockingValues.length === 0 || blockingValues.every((value) => value.state === "available" || value.state === "unverified");
  const status: StrategyRequirementEvaluationStatus =
    definition.blockingClassification === "informational" && values.length === 0 ? "not_applicable" :
    conflicted.length ? "conflicted" :
    unavailable.length ? "unavailable_dependency" :
    missing.length ? "missing" :
    stale.length ? "uncertain" :
    preliminary ? "uncertain" :
    acceptedAssumption || professionalReviewRequired || values.some((value) => value.state === "unverified") ? "satisfied_with_condition" :
    allRequiredAvailable ? "satisfied" :
    "uncertain";
  const actualCanonicalValuesUsed = values.map((value) => ({ ref: value.ref, state: value.state, valueHash: value.valueHash }));
  const resultBase = {
    requirementId: definition.requirementId,
    requirementVersion: definition.semanticVersion,
    strategyId: strategy.strategyId,
    strategyVersion: strategy.semanticVersion,
    category: definition.dependencyClassifications.join(","),
    blockingClassification: definition.blockingClassification,
    evaluationStatus: status,
    canonicalSubjectReference: `${evidence.snapshot.workspaceId}:${evidence.snapshot.dealId}:${evidence.snapshot.primaryPropertyId ?? evidence.snapshot.propertyIds[0]}`,
    requiredInputRefs: [...definition.requiredCanonicalInputIds],
    requiredOutputRefs: [...definition.requiredUnderwritingOutputIds],
    actualCanonicalValuesUsed,
    sourceRefs: sortedUnique(values.flatMap((value) => value.sourceRefs)),
    evidenceRefs: sortedUnique(values.flatMap((value) => value.evidenceRefs)),
    conditionResult: status === "not_applicable" ? "not_applicable" as const : status === "satisfied" || status === "satisfied_with_condition" ? "true" as const : "unknown" as const,
    missingDependencies: sortedUnique([...missing, ...unavailable, ...stale]),
    conflicts: sortedUnique(conflicted),
    verificationState: status === "missing" ? "missing" : status === "conflicted" ? "conflicted" : values.some((value) => value.verificationState === "user_entered" || value.verificationState === "estimated") ? "unverified" : "source_backed",
    assumptionState: preliminary ? "preliminary" as const : acceptedAssumption ? "accepted" as const : "none" as const,
    professionalReviewRequired,
    explanation: explainRequirement(status, definition, strategy, [...missing, ...unavailable, ...stale], conflicted),
    stableOrdinal: ordinal,
  };
  return { ...resultBase, deterministicResultHash: stableHash(resultBase) };
}

function evaluateHardDisqualifier(definition: StrategyHardDisqualifierDefinition, strategy: StrategyDefinition, evidence: EvidenceIndex, ordinal: number): StrategyHardDisqualifierEvaluationResult {
  const state = disqualifierDependencyState(definition, strategy, evidence);
  let status: StrategyHardDisqualifierEvaluationStatus;
  if (state.state === "not_applicable") status = "not_applicable";
  else if (state.state === "conflicted") status = "conflicted";
  else if (state.state === "unavailable_module") status = "unavailable_dependency";
  else if (state.state === "missing") status = "missing_dependency";
  else if (state.state === "stale" || state.state === "unverified" || state.assumptionState === "preliminary") status = "uncertain";
  else if (definition.disqualifierId.endsWith(".property_profile_ineligible")) status = strategy.supportedPropertyProfiles.includes(evidence.dependencyContext.propertyProfile) ? "not_triggered" : "triggered";
  else if (state.value === true && state.verificationState === "confirmed") status = "triggered";
  else status = state.professionalReviewRequired || state.assumptionState === "accepted" ? "uncertain" : "not_triggered";
  const resultBase = {
    disqualifierId: definition.disqualifierId,
    disqualifierVersion: definition.semanticVersion,
    strategyId: strategy.strategyId,
    strategyVersion: strategy.semanticVersion,
    triggerCategory: definition.triggeringDependency.dependencyType,
    severity: definition.severity,
    evaluationStatus: status,
    triggerResult: status === "triggered" ? "true" as const : status === "not_triggered" ? "false" as const : status === "not_applicable" ? "not_applicable" as const : "unknown" as const,
    controllingCanonicalValues: [{ ref: state.ref, state: state.state, valueHash: state.valueHash }],
    sourceRefs: sortedUnique(state.sourceRefs),
    evidenceRefs: sortedUnique(state.evidenceRefs),
    verificationState: state.verificationState,
    assumptionState: state.assumptionState,
    professionalReviewRequired: state.professionalReviewRequired,
    remediationMetadata: definition.remediationHook,
    explanation: explainDisqualifier(status, definition, strategy, state),
    stableOrdinal: ordinal,
  };
  return { ...resultBase, deterministicResultHash: stableHash(resultBase) };
}

type DependencyState = {
  ref: string;
  state: StrategyDependencyAvailabilityState;
  value?: string | number | boolean | null;
  valueHash: string | null;
  sourceRefs: string[];
  evidenceRefs: string[];
  verificationState: string;
  assumptionState: "none" | "accepted" | "preliminary";
  professionalReviewRequired: boolean;
  required: boolean;
};

function inputState(inputId: UnderwritingInputId, evidence: EvidenceIndex): DependencyState {
  const input = evidence.inputs.get(inputId);
  if (!input) return missingState(inputId, true);
  const state = input.conflictState === "unresolved" || input.completenessState === "conflicted" ? "conflicted" : input.completenessState === "missing" ? "missing" : input.completenessState === "preliminary" ? "unverified" : "available";
  return {
    ref: inputId,
    state,
    value: input.normalizedValue,
    valueHash: input.deterministicInputHash,
    sourceRefs: input.rawAcceptedValueRef !== undefined ? [`input:${inputId}`] : [],
    evidenceRefs: [],
    verificationState: input.completenessState === "missing" ? "missing" : input.validationStatus,
    assumptionState: input.assumptionState === "preliminary" ? "preliminary" : input.assumptionState === "accepted" ? "accepted" : "none",
    professionalReviewRequired: false,
    required: true,
  };
}

function outputState(outputId: FormulaId, evidence: EvidenceIndex): DependencyState {
  const result = evidence.outputs.get(outputId);
  if (!result) return missingState(outputId, true);
  const calculated = result.status === "calculated" || result.status === "calculated_with_warning";
  const state: StrategyDependencyAvailabilityState =
    result.status === "blocked_conflict" ? "conflicted" :
    result.status === "incomplete" ? "missing" :
    result.status === "preliminary" ? "unverified" :
    calculated ? "available" :
    "unavailable_module";
  return {
    ref: outputId,
    state,
    value: result.rawValue,
    valueHash: result.deterministicHash,
    sourceRefs: result.sourceFactIds,
    evidenceRefs: result.provenance.map((item) => item.evidenceId).filter((value): value is string => Boolean(value)),
    verificationState: result.status,
    assumptionState: result.preliminaryInputIds.length ? "preliminary" : result.assumptionIds.length ? "accepted" : "none",
    professionalReviewRequired: false,
    required: true,
  };
}

function futureDependencyStates(classification: string, strategy: StrategyDefinition, evidence: EvidenceIndex): DependencyState[] {
  const ids = futureDependencyIds(classification, strategy);
  if (ids.length === 0) return [];
  return ids.map((id) => {
    const dependency = evidence.dependencies.get(id);
    if (!dependency) return { ...missingState(id, false), state: "unavailable_module" };
    return {
      ref: id,
      state: dependency.availability,
      value: dependency.value,
      valueHash: dependency.canonicalValueHash ?? stableHash({ id, value: dependency.value, availability: dependency.availability }),
      sourceRefs: dependency.sourceRefs,
      evidenceRefs: dependency.evidenceRefs,
      verificationState: dependency.verificationState,
      assumptionState: dependency.assumptionState,
      professionalReviewRequired: dependency.professionalReviewRequired,
      required: false,
    };
  });
}

function disqualifierDependencyState(definition: StrategyHardDisqualifierDefinition, strategy: StrategyDefinition, evidence: EvidenceIndex): DependencyState {
  if (definition.triggeringDependency.canonicalInputId) return inputState(definition.triggeringDependency.canonicalInputId, evidence);
  if (definition.triggeringDependency.underwritingOutputId) return outputState(definition.triggeringDependency.underwritingOutputId, evidence);
  const id = definition.triggeringDependency.futureDependencyId;
  if (!id) return { ...missingState(definition.disqualifierId, true), state: "unavailable_module" };
  const dependency = evidence.dependencies.get(id);
  if (dependency) {
    return {
      ref: id,
      state: dependency.availability,
      value: dependency.value,
      valueHash: dependency.canonicalValueHash ?? stableHash({ id, value: dependency.value, availability: dependency.availability }),
      sourceRefs: dependency.sourceRefs,
      evidenceRefs: dependency.evidenceRefs,
      verificationState: dependency.verificationState,
      assumptionState: dependency.assumptionState,
      professionalReviewRequired: dependency.professionalReviewRequired,
      required: true,
    };
  }
  return { ...missingState(id, true), state: "unavailable_module" };
}

function missingState(ref: string, required: boolean): DependencyState {
  return {
    ref,
    state: "missing",
    valueHash: null,
    sourceRefs: [],
    evidenceRefs: [],
    verificationState: "missing",
    assumptionState: "none",
    professionalReviewRequired: false,
    required,
  };
}

function futureDependencyIds(classification: string, strategy: StrategyDefinition) {
  if (classification === "market_dependency") return strategy.futureMarketDependencies;
  if (classification === "financing_dependency") return strategy.futureFinancingDependencies;
  if (classification === "governance_legal_dependency") return strategy.futureGovernanceLegalDependencies;
  if (classification === "property_condition_dependency") return strategy.futurePropertyConditionDependencies;
  if (classification === "investor_fit_dependency") return strategy.futureInvestorFitDependencies;
  return [];
}

function finalizeResult(
  request: StrategyCompatibilityEvaluationRequest,
  snapshot: UnderwritingSnapshotRecord,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  strategy: StrategyDefinition,
  engine: StrategyCompatibilityEngineDefinition,
  requirementResults: StrategyRequirementEvaluationResult[],
  disqualifierResults: StrategyHardDisqualifierEvaluationResult[],
): StrategyCompatibilityResult {
  const triggered = disqualifierResults.filter((result) => result.evaluationStatus === "triggered");
  const required = requirementResults.filter((result) => result.blockingClassification === "blocking");
  const status = resolveCompatibilityStatus(required, disqualifierResults);
  const missingDependencies = sortedUnique([...requirementResults.flatMap((result) => result.missingDependencies), ...disqualifierResults.filter((result) => ["missing_dependency", "unavailable_dependency", "uncertain", "conflicted"].includes(result.evaluationStatus)).map((result) => result.controllingCanonicalValues[0]?.ref).filter(Boolean)]);
  const professionalReviews = sortedUnique([
    ...requirementResults.filter((result) => result.professionalReviewRequired).map((result) => result.requirementId),
    ...disqualifierResults.filter((result) => result.professionalReviewRequired).map((result) => result.disqualifierId),
  ]);
  const acceptedAssumptionCount = requirementResults.filter((result) => result.assumptionState === "accepted").length + disqualifierResults.filter((result) => result.assumptionState === "accepted").length;
  const preliminaryAssumptionCount = requirementResults.filter((result) => result.assumptionState === "preliminary").length + disqualifierResults.filter((result) => result.assumptionState === "preliminary").length;
  const resultBase = {
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: snapshot.snapshotId,
    underwritingRunId: underwritingRun.runId,
    strategyId: strategy.strategyId,
    strategyVersion: strategy.semanticVersion,
    strategyRegistryVersion: request.strategyRegistryVersion,
    requirementRegistryVersion: request.requirementRegistryVersion,
    disqualifierRegistryVersion: request.disqualifierRegistryVersion,
    compatibilityEngineVersion: engine.semanticVersion,
    compatibilityStatus: status,
    evaluationReadiness: completenessFor(status, requirementResults, disqualifierResults),
    hardDisqualifierCount: disqualifierResults.length,
    triggeredDisqualifierCount: triggered.length,
    satisfiedRequirementCount: requirementResults.filter((result) => result.evaluationStatus === "satisfied").length,
    conditionalRequirementCount: requirementResults.filter((result) => result.evaluationStatus === "satisfied_with_condition").length,
    unsatisfiedRequirementCount: requirementResults.filter((result) => result.evaluationStatus === "unsatisfied").length,
    missingRequirementCount: requirementResults.filter((result) => result.evaluationStatus === "missing").length,
    conflictedRequirementCount: requirementResults.filter((result) => result.evaluationStatus === "conflicted").length,
    unavailableDependencyCount: requirementResults.filter((result) => result.evaluationStatus === "unavailable_dependency").length + disqualifierResults.filter((result) => result.evaluationStatus === "unavailable_dependency").length,
    acceptedAssumptionCount,
    preliminaryAssumptionCount,
    professionalReviewCount: professionalReviews.length,
    requirementResultManifest: requirementResults,
    disqualifierResultManifest: disqualifierResults,
    controllingReasons: controllingReasonsFor(status, requirementResults, disqualifierResults),
    missingDependencies,
    requiredProfessionalReviews: professionalReviews,
    idempotencyKey: request.idempotencyKey.trim(),
    evaluatedBy: request.actorContext.actorId ?? "unknown",
    requestedAt: request.requestedAt,
    completedAt: request.requestedAt,
    version: STRATEGY_COMPATIBILITY_RESULT_VERSION as typeof STRATEGY_COMPATIBILITY_RESULT_VERSION,
    errors: [],
  };
  const deterministicResultHash = stableHash({
    hashVersion: STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION,
    ...resultBase,
    requestedAt: undefined,
    completedAt: undefined,
    evaluatedBy: undefined,
  });
  return deepFreeze({
    compatibilityResultId: `strategy_compat_${deterministicResultHash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`,
    ...resultBase,
    deterministicResultHash,
  });
}

function notEvaluatedResult(
  request: StrategyCompatibilityEvaluationRequest,
  snapshot: UnderwritingSnapshotRecord,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  engine: StrategyCompatibilityEngineDefinition,
  code: StrategyCompatibilityErrorCode,
  safeMessage: string,
  strategy?: StrategyDefinition,
): StrategyCompatibilityResult {
  const base = {
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: snapshot.snapshotId,
    underwritingRunId: underwritingRun.runId,
    strategyId: strategy?.strategyId ?? request.strategyId,
    strategyVersion: strategy?.semanticVersion ?? request.strategyVersion,
    strategyRegistryVersion: request.strategyRegistryVersion,
    requirementRegistryVersion: request.requirementRegistryVersion,
    disqualifierRegistryVersion: request.disqualifierRegistryVersion,
    compatibilityEngineVersion: engine.semanticVersion,
    compatibilityStatus: "not_evaluated" as const,
    evaluationReadiness: "unavailable_dependency" as const,
    hardDisqualifierCount: 0,
    triggeredDisqualifierCount: 0,
    satisfiedRequirementCount: 0,
    conditionalRequirementCount: 0,
    unsatisfiedRequirementCount: 0,
    missingRequirementCount: 0,
    conflictedRequirementCount: 0,
    unavailableDependencyCount: 0,
    acceptedAssumptionCount: 0,
    preliminaryAssumptionCount: 0,
    professionalReviewCount: 0,
    requirementResultManifest: [],
    disqualifierResultManifest: [],
    controllingReasons: [safeMessage],
    missingDependencies: [],
    requiredProfessionalReviews: [],
    idempotencyKey: request.idempotencyKey.trim(),
    evaluatedBy: request.actorContext.actorId ?? "unknown",
    requestedAt: request.requestedAt,
    completedAt: request.requestedAt,
    version: STRATEGY_COMPATIBILITY_RESULT_VERSION as typeof STRATEGY_COMPATIBILITY_RESULT_VERSION,
    errors: [{ code, safeMessage }],
  };
  const deterministicResultHash = stableHash({ hashVersion: STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION, ...base, requestedAt: undefined, completedAt: undefined, evaluatedBy: undefined });
  return deepFreeze({ compatibilityResultId: `strategy_compat_${deterministicResultHash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`, ...base, deterministicResultHash });
}

function resolveCompatibilityStatus(requirements: StrategyRequirementEvaluationResult[], disqualifiers: StrategyHardDisqualifierEvaluationResult[]): StrategyCompatibilityStatus {
  if (disqualifiers.some((result) => result.evaluationStatus === "triggered")) return "incompatible";
  if (requirements.some((result) => result.evaluationStatus === "unsatisfied")) return "incompatible";
  if (requirements.some((result) => ["missing", "conflicted", "unavailable_dependency", "uncertain"].includes(result.evaluationStatus))) return "uncertain";
  if (disqualifiers.some((result) => ["missing_dependency", "conflicted", "unavailable_dependency", "uncertain"].includes(result.evaluationStatus))) return "uncertain";
  if (requirements.some((result) => result.evaluationStatus === "satisfied_with_condition") || disqualifiers.some((result) => result.professionalReviewRequired) || requirements.some((result) => result.professionalReviewRequired)) return "compatible_with_conditions";
  return "compatible";
}

function completenessFor(status: StrategyCompatibilityStatus, requirements: StrategyRequirementEvaluationResult[], disqualifiers: StrategyHardDisqualifierEvaluationResult[]): StrategyCompatibilityCompletenessState {
  if (requirements.some((result) => result.evaluationStatus === "conflicted") || disqualifiers.some((result) => result.evaluationStatus === "conflicted")) return "conflicted";
  if (requirements.some((result) => result.evaluationStatus === "unavailable_dependency") || disqualifiers.some((result) => result.evaluationStatus === "unavailable_dependency")) return "unavailable_dependency";
  if (requirements.some((result) => result.assumptionState === "preliminary") || disqualifiers.some((result) => result.assumptionState === "preliminary")) return "preliminary";
  if (requirements.some((result) => result.evaluationStatus === "missing") || disqualifiers.some((result) => result.evaluationStatus === "missing_dependency")) return "incomplete";
  if (requirements.some((result) => result.assumptionState === "accepted") || disqualifiers.some((result) => result.assumptionState === "accepted")) return "accepted_assumptions";
  return status === "compatible" ? "complete_evidence" : "incomplete";
}

function controllingReasonsFor(status: StrategyCompatibilityStatus, requirements: StrategyRequirementEvaluationResult[], disqualifiers: StrategyHardDisqualifierEvaluationResult[]) {
  if (status === "incompatible") return [...disqualifiers.filter((result) => result.evaluationStatus === "triggered").map((result) => result.explanation), ...requirements.filter((result) => result.evaluationStatus === "unsatisfied").map((result) => result.explanation)].slice(0, 8);
  if (status === "uncertain") return [...requirements.filter((result) => ["missing", "conflicted", "unavailable_dependency", "uncertain"].includes(result.evaluationStatus)).map((result) => result.explanation), ...disqualifiers.filter((result) => ["missing_dependency", "conflicted", "unavailable_dependency", "uncertain"].includes(result.evaluationStatus)).map((result) => result.explanation)].slice(0, 8);
  if (status === "compatible_with_conditions") return [...requirements.filter((result) => result.evaluationStatus === "satisfied_with_condition").map((result) => result.explanation), ...disqualifiers.filter((result) => result.professionalReviewRequired).map((result) => result.explanation)].slice(0, 8);
  return ["All mandatory structural compatibility requirements evaluated as satisfied, and no hard disqualifier triggered."];
}

function explainRequirement(status: StrategyRequirementEvaluationStatus, definition: StrategyRequirementDefinition, strategy: StrategyDefinition, missing: string[], conflicts: string[]) {
  if (status === "satisfied") return `${strategy.displayName} requirement ${definition.requirementId} is structurally satisfied by the selected immutable context.`;
  if (status === "satisfied_with_condition") return `${strategy.displayName} requirement ${definition.requirementId} is structurally satisfied only with disclosed conditions, accepted assumptions, or professional review.`;
  if (status === "conflicted") return `${strategy.displayName} requirement ${definition.requirementId} cannot be satisfied while conflicting evidence remains: ${conflicts.join(", ")}.`;
  if (status === "missing" || status === "unavailable_dependency" || status === "uncertain") return `${strategy.displayName} requirement ${definition.requirementId} cannot be confirmed because dependencies are missing, stale, preliminary, or unavailable: ${missing.join(", ")}.`;
  if (status === "not_applicable") return `${strategy.displayName} requirement ${definition.requirementId} is not applicable to this immutable context.`;
  return `${strategy.displayName} requirement ${definition.requirementId} is not structurally satisfied.`;
}

function explainDisqualifier(status: StrategyHardDisqualifierEvaluationStatus, definition: StrategyHardDisqualifierDefinition, strategy: StrategyDefinition, state: DependencyState) {
  if (status === "triggered") return `${strategy.displayName} hard disqualifier ${definition.disqualifierId} is triggered by verified canonical evidence.`;
  if (status === "not_triggered") return `${strategy.displayName} hard disqualifier ${definition.disqualifierId} did not trigger from the selected immutable context.`;
  if (status === "conflicted") return `${strategy.displayName} hard disqualifier ${definition.disqualifierId} cannot be cleared because ${state.ref} is conflicted.`;
  if (status === "unavailable_dependency") return `${strategy.displayName} hard disqualifier ${definition.disqualifierId} cannot be cleared because ${state.ref} belongs to an unavailable dependency module.`;
  if (status === "missing_dependency" || status === "uncertain") return `${strategy.displayName} hard disqualifier ${definition.disqualifierId} cannot be cleared because ${state.ref} is missing, stale, unverified, or preliminary.`;
  return `${strategy.displayName} hard disqualifier ${definition.disqualifierId} is not applicable to this immutable context.`;
}

function compareRequirementDefinitions(a: StrategyRequirementDefinition, b: StrategyRequirementDefinition) {
  return a.stableOrdinal - b.stableOrdinal || a.requirementId.localeCompare(b.requirementId);
}

function compareDisqualifierDefinitions(a: StrategyHardDisqualifierDefinition, b: StrategyHardDisqualifierDefinition) {
  return a.stableOrdinal - b.stableOrdinal || a.disqualifierId.localeCompare(b.disqualifierId);
}

function safeStrategyOrdinal(strategyId: string, version: string) {
  try {
    return resolveStrategyDefinition(strategyId, version).stableOrdinal;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

function compareSemver(a: string, b: string) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((left[index] ?? 0) !== (right[index] ?? 0)) return (left[index] ?? 0) - (right[index] ?? 0);
  }
  return 0;
}

function sortedUnique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function stableHash(value: unknown) {
  const text = stableSerialize(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `strat_compat_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableSerialize(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(",")}}`;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) if (child && typeof child === "object") deepFreeze(child);
  }
  return value;
}

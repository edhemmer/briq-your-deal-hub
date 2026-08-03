import { FORMULA_REGISTRY_VERSION } from "./formulaRegistry";
import {
  STRATEGY_COMPATIBILITY_ENGINE_VERSION,
  STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION,
  STRATEGY_COMPATIBILITY_RESULT_VERSION,
  type StrategyCompatibilityResult,
} from "./strategyCompatibility";
import {
  STRATEGY_CONFIDENCE_MODEL_VERSION,
  STRATEGY_RANKING_RESULT_HASH_VERSION,
  STRATEGY_RANKING_RESULT_VERSION,
  STRATEGY_RANKING_TIE_BREAK_VERSION,
  STRATEGY_SCORING_ENGINE_VERSION,
  STRATEGY_SCORING_RESULT_HASH_VERSION,
  STRATEGY_SCORING_RESULT_VERSION,
  STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION,
  type StrategyRankingResult,
  type StrategyScoreResult,
} from "./strategyScoring";
import {
  STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
  STRATEGY_REQUIREMENT_REGISTRY_VERSION,
} from "./strategyRequirements";
import { STRATEGY_REGISTRY_VERSION } from "./strategyRegistry";
import {
  UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
  UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
  type UnderwritingCoreOutputRunRecord,
} from "./underwritingCoreOutputs";
import { UNDERWRITING_SNAPSHOT_CONTRACT_VERSION } from "./underwritingSnapshots";

export const STRATEGY_REEVALUATION_EVENT_REGISTRY_VERSION = "strategy-reevaluation-event-registry-v1";
export const STRATEGY_REEVALUATION_EVENT_VERSION = "strategy-reevaluation-event-v1";
export const STRATEGY_REEVALUATION_EVENT_HASH_VERSION = "strategy-reevaluation-event-hash-v1";
export const STRATEGY_REEVALUATION_DEPENDENCY_GRAPH_VERSION = "strategy-reevaluation-dependency-graph-v1";
export const STRATEGY_REEVALUATION_SCOPE_VERSION = "strategy-reevaluation-scope-v1";
export const STRATEGY_REEVALUATION_STALE_STATUS_VERSION = "strategy-reevaluation-stale-status-v1";
export const STRATEGY_REEVALUATION_AUTHORIZATION_VERSION = "strategy-reevaluation-authorization-v1";

const REQUIRED_PERMISSIONS = ["deal.read", "property.read", "underwriting.read", "strategy.evaluate"] as const;

export type StrategyReevaluationEventType =
  | "accepted_input_changed"
  | "accepted_assumption_changed"
  | "accepted_assumption_removed"
  | "snapshot_replaced"
  | "underwriting_output_changed"
  | "scenario_created"
  | "scenario_deleted"
  | "strategy_registry_changed"
  | "requirement_registry_changed"
  | "disqualifier_registry_changed"
  | "compatibility_engine_changed"
  | "score_engine_changed"
  | "confidence_engine_changed"
  | "formula_registry_changed"
  | "property_metadata_changed"
  | "market_input_changed"
  | "financing_input_changed"
  | "governance_input_changed"
  | "inspection_input_changed"
  | "appraisal_input_changed"
  | "lease_input_changed"
  | "expense_input_changed"
  | "income_input_changed"
  | "user_preference_changed"
  | "strategy_selected_changed"
  | "source_promoted"
  | "source_demoted"
  | "source_conflict_resolved"
  | "source_invalidated"
  | "manual_override_removed";

export type StrategyReevaluationScope =
  | "single_strategy"
  | "all_compatible_strategies"
  | "entire_strategy_set"
  | "ranking_only"
  | "confidence_only"
  | "underwriting_dependency"
  | "registry_version"
  | "scenario_only"
  | "report_only"
  | "comparison_only";

export type StrategyReevaluationStaleStatus = "current" | "stale" | "obsolete" | "superseded" | "not_affected";

export type StrategyReevaluationDependencyType =
  | "accepted_input"
  | "accepted_assumption"
  | "source"
  | "underwriting_output"
  | "underwriting_result_set"
  | "underwriting_snapshot"
  | "scenario_output"
  | "strategy_registry"
  | "requirement_registry"
  | "disqualifier_registry"
  | "compatibility_engine"
  | "compatibility_result"
  | "score_engine"
  | "score_result"
  | "confidence_engine"
  | "ranking_result"
  | "formula_registry"
  | "property_metadata"
  | "market_input"
  | "financing_input"
  | "governance_input"
  | "inspection_input"
  | "appraisal_input"
  | "lease_input"
  | "expense_input"
  | "income_input"
  | "user_preference"
  | "strategy_selected";

export type StrategyReevaluationPermission = typeof REQUIRED_PERMISSIONS[number] | "strategy.read";
export type StrategyReevaluationSourceClient = "server" | "trusted_access" | "system" | "test";
export type StrategyReevaluationTriggerSource =
  | "canonical_snapshot"
  | "canonical_underwriting"
  | "source_recording"
  | "source_conflict"
  | "proposal_acceptance"
  | "strategy_engine"
  | "governance_registry"
  | "system"
  | "test";

export type StrategyReevaluationActorContext = {
  actorId?: string;
  workspaceId: string;
  membershipStatus: "active" | "revoked" | "missing";
  permissions: StrategyReevaluationPermission[];
  sourceClient: StrategyReevaluationSourceClient;
};

export type StrategyReevaluationDependencyRef = {
  dependencyId: string;
  dependencyType: StrategyReevaluationDependencyType;
  dependencyHash: string;
  canonicalOwner: "underwriting" | "strategy" | "source" | "property" | "scenario" | "user_preference" | "registry";
  version: string;
  relatedStrategyIds: string[];
  relatedStrategyResultIds: string[];
  relatedCompatibilityResultIds: string[];
  relatedRankingIds: string[];
  relatedUnderwritingResultIds: string[];
  relatedScenarioIds: string[];
  sourceRefs: string[];
  evidenceRefs: string[];
};

export type StrategyReevaluationDependencyEdge = {
  fromDependencyId: string;
  toDependencyId: string;
  reason: string;
};

export type StrategyReevaluationDependencyGraph = {
  graphVersion: typeof STRATEGY_REEVALUATION_DEPENDENCY_GRAPH_VERSION;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  snapshotId: string;
  strategyResultIds: string[];
  rankingId: string | null;
  nodes: StrategyReevaluationDependencyRef[];
  edges: StrategyReevaluationDependencyEdge[];
  graphHash: string;
};

export type StrategyReevaluationEventDefinition = {
  eventType: StrategyReevaluationEventType;
  triggeringDependencyTypes: StrategyReevaluationDependencyType[];
  defaultScope: StrategyReevaluationScope;
  staleStatus: StrategyReevaluationStaleStatus;
  staleReason: string;
};

export type StrategyReevaluationObservedChange = {
  eventType: StrategyReevaluationEventType;
  triggeringDependency: Pick<StrategyReevaluationDependencyRef, "dependencyId" | "dependencyType" | "dependencyHash" | "canonicalOwner">;
  triggerSource: StrategyReevaluationTriggerSource;
  triggerTimestamp: string;
  sourceCommandId?: string;
};

export type StrategyReevaluationEventRequest = {
  workspaceId: string;
  dealId: string;
  propertyId: string;
  snapshotId: string;
  actorContext: StrategyReevaluationActorContext;
  observedChange: StrategyReevaluationObservedChange;
};

export type StrategyReevaluationEvent = {
  eventId: string;
  version: typeof STRATEGY_REEVALUATION_EVENT_VERSION;
  eventType: StrategyReevaluationEventType;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  snapshotId: string;
  strategyResultIds: string[];
  rankingId: string | null;
  triggeringDependency: StrategyReevaluationObservedChange["triggeringDependency"];
  triggerSource: StrategyReevaluationTriggerSource;
  triggerTimestamp: string;
  affectedStrategyIds: string[];
  affectedEngineVersions: string[];
  reevaluationScope: StrategyReevaluationScope;
  staleReason: string;
  staleStatuses: Array<{ strategyResultId: string; strategyId: string; staleStatus: StrategyReevaluationStaleStatus }>;
  eventHash: string;
  idempotencyKey: string;
};

export type StrategyReevaluationRegistrationResult =
  | { status: "registered"; event: StrategyReevaluationEvent; duplicateSuppressed: boolean; errors: [] }
  | { status: "denied" | "invalid"; event?: undefined; duplicateSuppressed: false; errors: Array<{ code: string; safeMessage: string }> };

export type StrategyReevaluationScenarioRef = {
  scenarioId: string;
  scenarioHash: string;
  strategyIds?: string[];
  strategyResultIds?: string[];
};

export type StrategyReevaluationSourceRef = {
  sourceId: string;
  sourceHash: string;
  sourceRefs?: string[];
  evidenceRefs?: string[];
  strategyIds?: string[];
  strategyResultIds?: string[];
};

export type StrategyReevaluationGraphRequest = {
  workspaceId: string;
  dealId: string;
  propertyId: string;
  snapshotId: string;
  strategyResults: StrategyScoreResult[];
  compatibilityResults: StrategyCompatibilityResult[];
  underwritingRun: UnderwritingCoreOutputRunRecord;
  ranking?: StrategyRankingResult;
  acceptedInputRefs?: StrategyReevaluationSourceRef[];
  acceptedAssumptionRefs?: StrategyReevaluationSourceRef[];
  sourceRefs?: StrategyReevaluationSourceRef[];
  scenarioRefs?: StrategyReevaluationScenarioRef[];
  userPreferenceRefs?: StrategyReevaluationSourceRef[];
  selectedStrategyRefs?: StrategyReevaluationSourceRef[];
};

export const strategyReevaluationEventDefinitions: readonly StrategyReevaluationEventDefinition[] = Object.freeze([
  define("accepted_input_changed", ["accepted_input"], "single_strategy", "stale", "Accepted canonical input changed."),
  define("accepted_assumption_changed", ["accepted_assumption"], "single_strategy", "stale", "Accepted assumption changed."),
  define("accepted_assumption_removed", ["accepted_assumption"], "single_strategy", "stale", "Accepted assumption was removed."),
  define("snapshot_replaced", ["underwriting_snapshot"], "entire_strategy_set", "superseded", "Immutable underwriting snapshot was replaced."),
  define("underwriting_output_changed", ["underwriting_output", "underwriting_result_set"], "underwriting_dependency", "stale", "Underwriting output dependency changed."),
  define("scenario_created", ["scenario_output"], "scenario_only", "stale", "Scenario set changed."),
  define("scenario_deleted", ["scenario_output"], "scenario_only", "stale", "Scenario set changed."),
  define("strategy_registry_changed", ["strategy_registry"], "registry_version", "obsolete", "Strategy registry version changed."),
  define("requirement_registry_changed", ["requirement_registry"], "registry_version", "obsolete", "Requirement registry version changed."),
  define("disqualifier_registry_changed", ["disqualifier_registry"], "registry_version", "obsolete", "Disqualifier registry version changed."),
  define("compatibility_engine_changed", ["compatibility_engine"], "registry_version", "obsolete", "Compatibility engine version changed."),
  define("score_engine_changed", ["score_engine"], "registry_version", "obsolete", "Score engine version changed."),
  define("confidence_engine_changed", ["confidence_engine"], "confidence_only", "stale", "Confidence engine version changed."),
  define("formula_registry_changed", ["formula_registry"], "registry_version", "obsolete", "Formula registry version changed."),
  define("property_metadata_changed", ["property_metadata"], "all_compatible_strategies", "stale", "Property metadata changed."),
  define("market_input_changed", ["market_input"], "all_compatible_strategies", "stale", "Market input changed."),
  define("financing_input_changed", ["financing_input"], "all_compatible_strategies", "stale", "Financing input changed."),
  define("governance_input_changed", ["governance_input"], "all_compatible_strategies", "stale", "Governance input changed."),
  define("inspection_input_changed", ["inspection_input"], "all_compatible_strategies", "stale", "Inspection input changed."),
  define("appraisal_input_changed", ["appraisal_input"], "all_compatible_strategies", "stale", "Appraisal input changed."),
  define("lease_input_changed", ["lease_input"], "all_compatible_strategies", "stale", "Lease input changed."),
  define("expense_input_changed", ["expense_input"], "all_compatible_strategies", "stale", "Expense input changed."),
  define("income_input_changed", ["income_input"], "all_compatible_strategies", "stale", "Income input changed."),
  define("user_preference_changed", ["user_preference"], "ranking_only", "current", "User preference changed ranking context."),
  define("strategy_selected_changed", ["strategy_selected"], "ranking_only", "current", "Selected strategy changed comparison context."),
  define("source_promoted", ["source"], "confidence_only", "stale", "Source was promoted."),
  define("source_demoted", ["source"], "confidence_only", "stale", "Source was demoted."),
  define("source_conflict_resolved", ["source"], "confidence_only", "stale", "Source conflict was resolved."),
  define("source_invalidated", ["source"], "all_compatible_strategies", "stale", "Source was invalidated."),
  define("manual_override_removed", ["accepted_assumption", "accepted_input"], "all_compatible_strategies", "stale", "Manual override was removed."),
]);

export function buildStrategyReevaluationDependencyGraph(request: StrategyReevaluationGraphRequest): StrategyReevaluationDependencyGraph {
  validateGraphScope(request);
  const nodes: StrategyReevaluationDependencyRef[] = [];
  const edges: StrategyReevaluationDependencyEdge[] = [];
  const add = (node: StrategyReevaluationDependencyRef) => nodes.push(normalizeNode(node));
  const allStrategyIds = sortedUnique(request.strategyResults.map((item) => item.strategyId));
  const allResultIds = sortedUnique(request.strategyResults.map((item) => item.scoreResultId));
  const allCompatibilityIds = sortedUnique(request.compatibilityResults.map((item) => item.compatibilityResultId));
  const rankingIds = request.ranking ? [request.ranking.rankingResultId] : [];

  add(node("underwriting_snapshot", request.snapshotId, request.underwritingRun.snapshotHash, "underwriting", UNDERWRITING_SNAPSHOT_CONTRACT_VERSION, allStrategyIds, allResultIds, allCompatibilityIds, rankingIds));
  add(node("underwriting_result_set", request.underwritingRun.runId, request.underwritingRun.resultSetHash, "underwriting", request.underwritingRun.engineVersion, allStrategyIds, allResultIds, allCompatibilityIds, rankingIds));
  add(node("formula_registry", FORMULA_REGISTRY_VERSION, request.underwritingRun.formulaVersionManifestHash, "registry", FORMULA_REGISTRY_VERSION, allStrategyIds, allResultIds, allCompatibilityIds, rankingIds));
  add(node("strategy_registry", STRATEGY_REGISTRY_VERSION, STRATEGY_REGISTRY_VERSION, "registry", STRATEGY_REGISTRY_VERSION, allStrategyIds, allResultIds, allCompatibilityIds, rankingIds));
  add(node("requirement_registry", STRATEGY_REQUIREMENT_REGISTRY_VERSION, STRATEGY_REQUIREMENT_REGISTRY_VERSION, "registry", STRATEGY_REQUIREMENT_REGISTRY_VERSION, allStrategyIds, allResultIds, allCompatibilityIds, rankingIds));
  add(node("disqualifier_registry", STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION, STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION, "registry", STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION, allStrategyIds, allResultIds, allCompatibilityIds, rankingIds));
  add(node("compatibility_engine", STRATEGY_COMPATIBILITY_ENGINE_VERSION, STRATEGY_COMPATIBILITY_ENGINE_VERSION, "strategy", STRATEGY_COMPATIBILITY_ENGINE_VERSION, allStrategyIds, allResultIds, allCompatibilityIds, rankingIds));
  add(node("score_engine", STRATEGY_SCORING_ENGINE_VERSION, STRATEGY_SCORING_ENGINE_VERSION, "strategy", STRATEGY_SCORING_ENGINE_VERSION, allStrategyIds, allResultIds, allCompatibilityIds, rankingIds));
  add(node("confidence_engine", STRATEGY_CONFIDENCE_MODEL_VERSION, STRATEGY_CONFIDENCE_MODEL_VERSION, "strategy", STRATEGY_CONFIDENCE_MODEL_VERSION, allStrategyIds, allResultIds, allCompatibilityIds, rankingIds));

  for (const result of [...request.underwritingRun.results].sort((a, b) => a.stableOrdinal - b.stableOrdinal || a.formulaId.localeCompare(b.formulaId))) {
    add({
      ...node("underwriting_output", result.formulaId, result.deterministicHash, "underwriting", result.formulaVersion, relatedStrategyIdsForOutput(request.strategyResults, result.formulaId), relatedScoreIdsForOutput(request.strategyResults, result.formulaId), relatedCompatibilityIdsForOutput(request.compatibilityResults, result.formulaId), rankingIds),
      relatedUnderwritingResultIds: [result.resultId],
      sourceRefs: sortedUnique(result.sourceFactIds),
      evidenceRefs: sortedUnique(result.provenance.map((item) => item.evidenceId ?? item.sourceRecordId).filter((value): value is string => Boolean(value))),
    });
    edges.push({ fromDependencyId: result.formulaId, toDependencyId: request.underwritingRun.runId, reason: "underwriting_output_feeds_result_set" });
  }

  for (const compatibility of [...request.compatibilityResults].sort((a, b) => a.strategyId.localeCompare(b.strategyId))) {
    add(node("compatibility_result", compatibility.compatibilityResultId, compatibility.deterministicResultHash, "strategy", compatibility.version, [compatibility.strategyId], relatedScoreIdsForStrategy(request.strategyResults, compatibility.strategyId), [compatibility.compatibilityResultId], rankingIds));
    for (const requirement of compatibility.requirementResultManifest) {
      for (const inputId of requirement.requiredInputRefs) edges.push({ fromDependencyId: inputId, toDependencyId: compatibility.compatibilityResultId, reason: "accepted_input_feeds_compatibility" });
      for (const outputId of requirement.requiredOutputRefs) edges.push({ fromDependencyId: outputId, toDependencyId: compatibility.compatibilityResultId, reason: "underwriting_output_feeds_compatibility" });
      for (const sourceId of requirement.sourceRefs) edges.push({ fromDependencyId: sourceId, toDependencyId: compatibility.compatibilityResultId, reason: "source_feeds_compatibility" });
    }
  }

  for (const score of [...request.strategyResults].sort((a, b) => a.strategyId.localeCompare(b.strategyId))) {
    add(node("score_result", score.scoreResultId, score.deterministicScoreHash, "strategy", score.version, [score.strategyId], [score.scoreResultId], [score.compatibilityResultId], rankingIds));
    edges.push({ fromDependencyId: score.compatibilityResultId, toDependencyId: score.scoreResultId, reason: "compatibility_feeds_score" });
    edges.push({ fromDependencyId: request.underwritingRun.runId, toDependencyId: score.scoreResultId, reason: "underwriting_result_set_feeds_score" });
    if (request.ranking) edges.push({ fromDependencyId: score.scoreResultId, toDependencyId: request.ranking.rankingResultId, reason: "score_feeds_ranking" });
  }

  if (request.ranking) {
    add(node("ranking_result", request.ranking.rankingResultId, request.ranking.deterministicRankingHash, "strategy", request.ranking.version, allStrategyIds, allResultIds, allCompatibilityIds, [request.ranking.rankingResultId]));
  }
  for (const ref of request.acceptedInputRefs ?? []) add(refNode("accepted_input", ref, "underwriting", request, rankingIds));
  for (const ref of request.acceptedAssumptionRefs ?? []) add(refNode("accepted_assumption", ref, "underwriting", request, rankingIds));
  for (const ref of request.sourceRefs ?? []) add(refNode("source", ref, "source", request, rankingIds));
  for (const ref of request.userPreferenceRefs ?? []) add(refNode("user_preference", ref, "user_preference", request, rankingIds));
  for (const ref of request.selectedStrategyRefs ?? []) add(refNode("strategy_selected", ref, "user_preference", request, rankingIds));
  for (const ref of request.scenarioRefs ?? []) add({
    ...node("scenario_output", ref.scenarioId, ref.scenarioHash, "scenario", "scenario-output-v1", ref.strategyIds ?? allStrategyIds, ref.strategyResultIds ?? allResultIds, allCompatibilityIds, rankingIds),
    relatedScenarioIds: [ref.scenarioId],
  });

  const uniqueNodes = dedupeNodes(nodes);
  const uniqueEdges = dedupeEdges(edges);
  const graphHash = stableHash({
    hashVersion: STRATEGY_REEVALUATION_DEPENDENCY_GRAPH_VERSION,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: request.snapshotId,
    nodes: uniqueNodes,
    edges: uniqueEdges,
  });
  return deepFreeze({
    graphVersion: STRATEGY_REEVALUATION_DEPENDENCY_GRAPH_VERSION,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: request.snapshotId,
    strategyResultIds: allResultIds,
    rankingId: request.ranking?.rankingResultId ?? null,
    nodes: uniqueNodes,
    edges: uniqueEdges,
    graphHash,
  });
}

export function registerStrategyReevaluationEvent(
  request: StrategyReevaluationEventRequest,
  graph: StrategyReevaluationDependencyGraph,
  existingEvents: StrategyReevaluationEvent[] = [],
): StrategyReevaluationRegistrationResult {
  const denied = validateRequest(request, graph);
  if (denied.length) return { status: denied.some((item) => item.code.startsWith("unauthorized")) ? "denied" : "invalid", duplicateSuppressed: false, errors: denied };
  const definition = strategyReevaluationDefinitionFor(request.observedChange.eventType);
  if (!definition) return { status: "invalid", duplicateSuppressed: false, errors: [{ code: "event_type_not_registered", safeMessage: "The reevaluation event type is not registered." }] };
  const trigger = graph.nodes.find((item) => item.dependencyId === request.observedChange.triggeringDependency.dependencyId && item.dependencyType === request.observedChange.triggeringDependency.dependencyType);
  if (!trigger || trigger.dependencyHash !== request.observedChange.triggeringDependency.dependencyHash) return { status: "invalid", duplicateSuppressed: false, errors: [{ code: "trigger_dependency_not_found", safeMessage: "The triggering dependency is not present in the canonical dependency graph." }] };
  if (!definition.triggeringDependencyTypes.includes(trigger.dependencyType)) return { status: "invalid", duplicateSuppressed: false, errors: [{ code: "trigger_dependency_type_invalid", safeMessage: "The triggering dependency type is not valid for this reevaluation event." }] };

  const scope = scopeFor(definition, trigger);
  const affectedStrategyIds = affectedStrategiesFor(scope, trigger, graph);
  const affectedEngineVersions = affectedVersionsFor(scope);
  const staleStatuses = graph.nodes
    .filter((nodeRef) => nodeRef.dependencyType === "score_result")
    .map((nodeRef) => ({
      strategyResultId: nodeRef.dependencyId,
      strategyId: nodeRef.relatedStrategyIds[0] ?? "unknown",
      staleStatus: statusFor(definition, scope, nodeRef.relatedStrategyIds[0], affectedStrategyIds),
    }));
  const identity = {
    hashVersion: STRATEGY_REEVALUATION_EVENT_HASH_VERSION,
    eventVersion: STRATEGY_REEVALUATION_EVENT_VERSION,
    eventType: request.observedChange.eventType,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: request.snapshotId,
    graphHash: graph.graphHash,
    triggeringDependency: request.observedChange.triggeringDependency,
    triggerSource: request.observedChange.triggerSource,
    affectedStrategyIds,
    affectedEngineVersions,
    reevaluationScope: scope,
    staleReason: definition.staleReason,
    staleStatuses,
  };
  const eventHash = stableHash(identity);
  const event: StrategyReevaluationEvent = deepFreeze({
    eventId: `strategy_reeval_${eventHash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`,
    version: STRATEGY_REEVALUATION_EVENT_VERSION,
    eventType: request.observedChange.eventType,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: request.snapshotId,
    strategyResultIds: graph.strategyResultIds,
    rankingId: graph.rankingId,
    triggeringDependency: request.observedChange.triggeringDependency,
    triggerSource: request.observedChange.triggerSource,
    triggerTimestamp: request.observedChange.triggerTimestamp,
    affectedStrategyIds,
    affectedEngineVersions,
    reevaluationScope: scope,
    staleReason: definition.staleReason,
    staleStatuses,
    eventHash,
    idempotencyKey: eventHash,
  });
  const duplicateSuppressed = existingEvents.some((existing) => existing.idempotencyKey === event.idempotencyKey);
  return { status: "registered", event, duplicateSuppressed, errors: [] };
}

export function strategyReevaluationDefinitionFor(eventType: StrategyReevaluationEventType) {
  return strategyReevaluationEventDefinitions.find((definition) => definition.eventType === eventType);
}

function define(
  eventType: StrategyReevaluationEventType,
  triggeringDependencyTypes: StrategyReevaluationDependencyType[],
  defaultScope: StrategyReevaluationScope,
  staleStatus: StrategyReevaluationStaleStatus,
  staleReason: string,
): StrategyReevaluationEventDefinition {
  return { eventType, triggeringDependencyTypes, defaultScope, staleStatus, staleReason };
}

function node(
  dependencyType: StrategyReevaluationDependencyType,
  dependencyId: string,
  dependencyHash: string,
  canonicalOwner: StrategyReevaluationDependencyRef["canonicalOwner"],
  version: string,
  strategyIds: string[],
  strategyResultIds: string[],
  compatibilityResultIds: string[],
  rankingIds: string[],
): StrategyReevaluationDependencyRef {
  return {
    dependencyId,
    dependencyType,
    dependencyHash,
    canonicalOwner,
    version,
    relatedStrategyIds: sortedUnique(strategyIds),
    relatedStrategyResultIds: sortedUnique(strategyResultIds),
    relatedCompatibilityResultIds: sortedUnique(compatibilityResultIds),
    relatedRankingIds: sortedUnique(rankingIds),
    relatedUnderwritingResultIds: [],
    relatedScenarioIds: [],
    sourceRefs: [],
    evidenceRefs: [],
  };
}

function refNode(
  dependencyType: "accepted_input" | "accepted_assumption" | "source" | "user_preference" | "strategy_selected",
  ref: StrategyReevaluationSourceRef,
  canonicalOwner: StrategyReevaluationDependencyRef["canonicalOwner"],
  request: StrategyReevaluationGraphRequest,
  rankingIds: string[],
): StrategyReevaluationDependencyRef {
  return {
    ...node(
      dependencyType,
      ref.sourceId,
      ref.sourceHash,
      canonicalOwner,
      `${dependencyType}-v1`,
      ref.strategyIds ?? sortedUnique(request.strategyResults.map((item) => item.strategyId)),
      ref.strategyResultIds ?? sortedUnique(request.strategyResults.map((item) => item.scoreResultId)),
      sortedUnique(request.compatibilityResults.map((item) => item.compatibilityResultId)),
      rankingIds,
    ),
    sourceRefs: sortedUnique(ref.sourceRefs ?? [ref.sourceId]),
    evidenceRefs: sortedUnique(ref.evidenceRefs ?? []),
  };
}

function validateGraphScope(request: StrategyReevaluationGraphRequest) {
  const mismatches = [
    ...request.strategyResults.map((item) => ({ workspaceId: item.workspaceId, dealId: item.dealId, propertyId: item.propertyId, snapshotId: item.snapshotId })),
    ...request.compatibilityResults.map((item) => ({ workspaceId: item.workspaceId, dealId: item.dealId, propertyId: item.propertyId, snapshotId: item.snapshotId })),
    { workspaceId: request.underwritingRun.workspaceId, dealId: request.underwritingRun.dealId, propertyId: request.propertyId, snapshotId: request.underwritingRun.snapshotId },
  ].filter((item) => item.workspaceId !== request.workspaceId || item.dealId !== request.dealId || item.propertyId !== request.propertyId || item.snapshotId !== request.snapshotId);
  if (mismatches.length) throw new Error("Strategy reevaluation dependency graph scope mismatch.");
}

function validateRequest(request: StrategyReevaluationEventRequest, graph: StrategyReevaluationDependencyGraph) {
  const errors: Array<{ code: string; safeMessage: string }> = [];
  const add = (code: string, safeMessage: string) => errors.push({ code, safeMessage });
  if (request.workspaceId !== graph.workspaceId) add("unauthorized_workspace", "The actor is not authorized for this workspace.");
  if (request.dealId !== graph.dealId) add("unauthorized_deal", "The actor is not authorized for this Deal.");
  if (request.propertyId !== graph.propertyId) add("unauthorized_property", "The actor is not authorized for this Property.");
  if (request.snapshotId !== graph.snapshotId) add("unauthorized_snapshot", "The actor is not authorized for this snapshot.");
  if (request.actorContext.membershipStatus !== "active" || request.actorContext.workspaceId !== request.workspaceId) add("unauthorized_membership", "Active workspace access is required.");
  for (const permission of REQUIRED_PERMISSIONS) if (!request.actorContext.permissions.includes(permission)) add("unauthorized_permission", "Required reevaluation permissions are missing.");
  return errors;
}

function scopeFor(definition: StrategyReevaluationEventDefinition, trigger: StrategyReevaluationDependencyRef): StrategyReevaluationScope {
  if ((definition.defaultScope === "single_strategy" || definition.defaultScope === "all_compatible_strategies") && trigger.relatedStrategyIds.length !== 1) {
    return "all_compatible_strategies";
  }
  return definition.defaultScope;
}

function affectedStrategiesFor(scope: StrategyReevaluationScope, trigger: StrategyReevaluationDependencyRef, graph: StrategyReevaluationDependencyGraph) {
  if (scope === "ranking_only" || scope === "report_only" || scope === "comparison_only" || scope === "scenario_only") return sortedUnique(trigger.relatedStrategyIds);
  if (scope === "entire_strategy_set" || scope === "registry_version" || scope === "underwriting_dependency") return sortedUnique(graph.nodes.flatMap((nodeRef) => nodeRef.dependencyType === "score_result" ? nodeRef.relatedStrategyIds : []));
  if (scope === "confidence_only" || scope === "single_strategy" || scope === "all_compatible_strategies") return sortedUnique(trigger.relatedStrategyIds);
  return [];
}

function affectedVersionsFor(scope: StrategyReevaluationScope) {
  const base = [
    STRATEGY_REEVALUATION_EVENT_REGISTRY_VERSION,
    STRATEGY_REGISTRY_VERSION,
    STRATEGY_REQUIREMENT_REGISTRY_VERSION,
    STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
    STRATEGY_COMPATIBILITY_ENGINE_VERSION,
    STRATEGY_SCORING_ENGINE_VERSION,
    STRATEGY_CONFIDENCE_MODEL_VERSION,
    FORMULA_REGISTRY_VERSION,
  ];
  if (scope === "ranking_only" || scope === "comparison_only") return sortedUnique([...base, STRATEGY_RANKING_TIE_BREAK_VERSION, STRATEGY_RANKING_RESULT_VERSION, STRATEGY_RANKING_RESULT_HASH_VERSION]);
  if (scope === "confidence_only") return sortedUnique([STRATEGY_CONFIDENCE_MODEL_VERSION, STRATEGY_SCORING_RESULT_VERSION, STRATEGY_SCORING_RESULT_HASH_VERSION]);
  if (scope === "underwriting_dependency") return sortedUnique([...base, UNDERWRITING_CORE_OUTPUT_RUN_VERSION, UNDERWRITING_CORE_OUTPUT_HASH_VERSION]);
  if (scope === "registry_version") return sortedUnique([...base, STRATEGY_COMPATIBILITY_RESULT_VERSION, STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION, STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION]);
  return sortedUnique(base);
}

function statusFor(
  definition: StrategyReevaluationEventDefinition,
  scope: StrategyReevaluationScope,
  strategyId: string | undefined,
  affectedStrategyIds: string[],
): StrategyReevaluationStaleStatus {
  if (!strategyId || !affectedStrategyIds.includes(strategyId)) return "not_affected";
  if (scope === "ranking_only" || scope === "report_only" || scope === "comparison_only") return "current";
  if (scope === "scenario_only") return "not_affected";
  return definition.staleStatus;
}

function relatedStrategyIdsForOutput(strategyResults: StrategyScoreResult[], formulaId: string) {
  return sortedUnique(strategyResults
    .filter((result) => result.normalizedMetrics.some((metric) => metric.metricId === formulaId || metric.rawValueHash === formulaId))
    .map((result) => result.strategyId));
}

function relatedScoreIdsForOutput(strategyResults: StrategyScoreResult[], formulaId: string) {
  return sortedUnique(strategyResults
    .filter((result) => result.normalizedMetrics.some((metric) => metric.metricId === formulaId || metric.rawValueHash === formulaId))
    .map((result) => result.scoreResultId));
}

function relatedCompatibilityIdsForOutput(compatibilityResults: StrategyCompatibilityResult[], formulaId: string) {
  return sortedUnique(compatibilityResults
    .filter((result) => result.requirementResultManifest.some((item) => item.requiredOutputRefs.includes(formulaId as never)))
    .map((result) => result.compatibilityResultId));
}

function relatedScoreIdsForStrategy(strategyResults: StrategyScoreResult[], strategyId: string) {
  return sortedUnique(strategyResults.filter((result) => result.strategyId === strategyId).map((result) => result.scoreResultId));
}

function normalizeNode(nodeRef: StrategyReevaluationDependencyRef): StrategyReevaluationDependencyRef {
  return {
    ...nodeRef,
    relatedStrategyIds: sortedUnique(nodeRef.relatedStrategyIds),
    relatedStrategyResultIds: sortedUnique(nodeRef.relatedStrategyResultIds),
    relatedCompatibilityResultIds: sortedUnique(nodeRef.relatedCompatibilityResultIds),
    relatedRankingIds: sortedUnique(nodeRef.relatedRankingIds),
    relatedUnderwritingResultIds: sortedUnique(nodeRef.relatedUnderwritingResultIds),
    relatedScenarioIds: sortedUnique(nodeRef.relatedScenarioIds),
    sourceRefs: sortedUnique(nodeRef.sourceRefs),
    evidenceRefs: sortedUnique(nodeRef.evidenceRefs),
  };
}

function dedupeNodes(nodes: StrategyReevaluationDependencyRef[]) {
  const byKey = new Map<string, StrategyReevaluationDependencyRef>();
  for (const nodeRef of nodes) {
    const key = `${nodeRef.dependencyType}:${nodeRef.dependencyId}`;
    const existing = byKey.get(key);
    byKey.set(key, existing ? normalizeNode({
      ...existing,
      relatedStrategyIds: [...existing.relatedStrategyIds, ...nodeRef.relatedStrategyIds],
      relatedStrategyResultIds: [...existing.relatedStrategyResultIds, ...nodeRef.relatedStrategyResultIds],
      relatedCompatibilityResultIds: [...existing.relatedCompatibilityResultIds, ...nodeRef.relatedCompatibilityResultIds],
      relatedRankingIds: [...existing.relatedRankingIds, ...nodeRef.relatedRankingIds],
      relatedUnderwritingResultIds: [...existing.relatedUnderwritingResultIds, ...nodeRef.relatedUnderwritingResultIds],
      relatedScenarioIds: [...existing.relatedScenarioIds, ...nodeRef.relatedScenarioIds],
      sourceRefs: [...existing.sourceRefs, ...nodeRef.sourceRefs],
      evidenceRefs: [...existing.evidenceRefs, ...nodeRef.evidenceRefs],
    }) : normalizeNode(nodeRef));
  }
  return [...byKey.values()].sort((a, b) => a.dependencyType.localeCompare(b.dependencyType) || a.dependencyId.localeCompare(b.dependencyId));
}

function dedupeEdges(edges: StrategyReevaluationDependencyEdge[]) {
  const byKey = new Map<string, StrategyReevaluationDependencyEdge>();
  for (const edge of edges) byKey.set(`${edge.fromDependencyId}:${edge.toDependencyId}:${edge.reason}`, edge);
  return [...byKey.values()].sort((a, b) => a.fromDependencyId.localeCompare(b.fromDependencyId) || a.toDependencyId.localeCompare(b.toDependencyId) || a.reason.localeCompare(b.reason));
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
  return `strat_reeval_${(hash >>> 0).toString(16).padStart(8, "0")}`;
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

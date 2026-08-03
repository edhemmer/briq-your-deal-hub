import type { FormulaId } from "./formulaRegistry";
import { FORMULA_REGISTRY_VERSION } from "./formulaRegistry";
import {
  STRATEGY_COMPATIBILITY_ENGINE_VERSION,
  STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION,
  STRATEGY_COMPATIBILITY_RESULT_VERSION,
  type StrategyCompatibilityResult,
  type StrategyCompatibilityStatus,
} from "./strategyCompatibility";
import {
  STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
  STRATEGY_REQUIREMENT_REGISTRY_VERSION,
} from "./strategyRequirements";
import {
  STRATEGY_CONFIDENCE_MODEL_VERSION_PENDING,
  STRATEGY_REGISTRY_VERSION,
  STRATEGY_SCORING_MODEL_VERSION_PENDING,
  resolveStrategyDefinition,
  type StrategyDefinition,
} from "./strategyRegistry";
import {
  UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
  UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
  type UnderwritingCoreFormulaResultRecord,
  type UnderwritingCoreOutputRunRecord,
} from "./underwritingCoreOutputs";
import { UNDERWRITING_SNAPSHOT_CONTRACT_VERSION } from "./underwritingSnapshots";

export const STRATEGY_SCORING_ENGINE_ID = "strategy_scoring_engine";
export const STRATEGY_SCORING_ENGINE_VERSION = "1.0.0";
export const STRATEGY_SCORING_ENGINE_REGISTRY_VERSION = "strategy-scoring-engine-registry-v1";
export const STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION = "strategy-scoring-weight-registry-v1";
export const STRATEGY_SCORING_RESULT_VERSION = "strategy-scoring-result-v1";
export const STRATEGY_SCORING_RESULT_HASH_VERSION = "strategy-scoring-result-hash-v1";
export const STRATEGY_RANKING_RESULT_VERSION = "strategy-ranking-result-v1";
export const STRATEGY_RANKING_RESULT_HASH_VERSION = "strategy-ranking-result-hash-v1";
export const STRATEGY_CONFIDENCE_MODEL_VERSION = "strategy-confidence-model-v1";
export const STRATEGY_NORMALIZATION_MODEL_VERSION = "strategy-normalization-model-v1";
export const STRATEGY_RANKING_TIE_BREAK_VERSION = "strategy-ranking-tie-break-v1";

const SCORE_BASIS_MAX = 10_000;
const WEIGHT_BASIS_TOTAL = 10_000;

export type StrategyScoringEngineStatus = "active" | "deprecated" | "disabled";
export type StrategyScoreEligibility = "scored" | "not_scoreable";
export type StrategyScoreCategoryId =
  | "financial_strength"
  | "risk"
  | "execution_complexity"
  | "capital_efficiency"
  | "cash_flow"
  | "leverage"
  | "stability"
  | "operational_burden"
  | "tax_efficiency"
  | "liquidity"
  | "sensitivity"
  | "professional_review_burden"
  | "future_expansion";
export type StrategyConfidenceLevel = "high" | "moderate" | "low" | "insufficient" | "not_applicable";
export type StrategyScoringErrorCode =
  | "scoring_engine_version_not_found"
  | "scoring_engine_disabled"
  | "unsupported_registry_version"
  | "strategy_not_found"
  | "compatibility_result_hash_mismatch"
  | "underwriting_result_set_hash_mismatch"
  | "compatibility_not_scoreable"
  | "underwriting_run_not_usable"
  | "scope_mismatch"
  | "internal_scoring_error";

export type StrategyScoringEngineDefinition = {
  engineId: typeof STRATEGY_SCORING_ENGINE_ID;
  semanticVersion: string;
  registryVersion: typeof STRATEGY_SCORING_ENGINE_REGISTRY_VERSION;
  status: StrategyScoringEngineStatus;
  supportedStrategyRegistryVersions: Array<typeof STRATEGY_REGISTRY_VERSION>;
  supportedCompatibilityEngineVersions: Array<typeof STRATEGY_COMPATIBILITY_ENGINE_VERSION>;
  supportedCompatibilityResultVersions: Array<typeof STRATEGY_COMPATIBILITY_RESULT_VERSION>;
  supportedCompatibilityHashVersions: Array<typeof STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION>;
  supportedRequirementRegistryVersions: Array<typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION>;
  supportedDisqualifierRegistryVersions: Array<typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION>;
  supportedFormulaRegistryVersions: Array<typeof FORMULA_REGISTRY_VERSION>;
  supportedUnderwritingContractVersions: Array<typeof UNDERWRITING_SNAPSHOT_CONTRACT_VERSION | typeof UNDERWRITING_CORE_OUTPUT_RUN_VERSION | typeof UNDERWRITING_CORE_OUTPUT_HASH_VERSION>;
  supportedStrategyScoringModelVersions: Array<typeof STRATEGY_SCORING_MODEL_VERSION_PENDING>;
  supportedStrategyConfidenceModelVersions: Array<typeof STRATEGY_CONFIDENCE_MODEL_VERSION_PENDING | typeof STRATEGY_CONFIDENCE_MODEL_VERSION>;
  weightRegistryVersion: typeof STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION;
  normalizationModelVersion: typeof STRATEGY_NORMALIZATION_MODEL_VERSION;
  confidenceModelVersion: typeof STRATEGY_CONFIDENCE_MODEL_VERSION;
  rankingTieBreakVersion: typeof STRATEGY_RANKING_TIE_BREAK_VERSION;
  effectiveDate: string;
  deprecatedDate: string | null;
  replacementEngineVersion: string | null;
};

export type StrategyScoringEvaluationRequest = {
  scoringRequestId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  underwritingSnapshotId: string;
  underwritingRunId: string;
  expectedCompatibilityResultHash: string;
  expectedResultSetHash: string;
  strategyId: string;
  strategyVersion: string | "latest";
  strategyRegistryVersion: typeof STRATEGY_REGISTRY_VERSION;
  requirementRegistryVersion: typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION;
  disqualifierRegistryVersion: typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  snapshotContractVersion: typeof UNDERWRITING_SNAPSHOT_CONTRACT_VERSION;
  scoringEngineVersion: string;
  weightRegistryVersion: typeof STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION;
  requestedAt: string;
};

export type StrategyNormalizedMetric = {
  metricId: FormulaId | "compatibility" | "assumption_burden" | "unresolved_risk" | "professional_review" | "strategy_complexity" | "strategy_liquidity" | "strategy_horizon" | "future_dependency_support";
  source: "underwriting_output" | "compatibility_result" | "strategy_registry";
  rawValue: number | string | null;
  rawValueHash: string | null;
  normalizedBasis: number;
  direction: "higher_is_better" | "lower_is_better" | "neutral";
  version: typeof STRATEGY_NORMALIZATION_MODEL_VERSION;
};

export type StrategyCategoryScore = {
  categoryId: StrategyScoreCategoryId;
  label: string;
  normalizedScore: number;
  normalizedBasis: number;
  metricRefs: string[];
  explanation: string;
};

export type StrategyWeightBreakdown = {
  categoryId: StrategyScoreCategoryId;
  weightBasis: number;
  weightPercent: number;
  strategyAdjustmentBasis: number;
  explanation: string;
};

export type StrategyConfidenceResult = {
  confidenceLevel: StrategyConfidenceLevel;
  confidenceScore: number | null;
  confidenceBasis: number | null;
  modelVersion: typeof STRATEGY_CONFIDENCE_MODEL_VERSION;
  drivers: string[];
  penalties: Array<{ reason: string; penaltyBasis: number }>;
};

export type StrategyScoreVersionReferences = {
  scoringEngineVersion: string;
  scoringEngineRegistryVersion: typeof STRATEGY_SCORING_ENGINE_REGISTRY_VERSION;
  scoringResultVersion: typeof STRATEGY_SCORING_RESULT_VERSION;
  scoringHashVersion: typeof STRATEGY_SCORING_RESULT_HASH_VERSION;
  weightRegistryVersion: typeof STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION;
  normalizationModelVersion: typeof STRATEGY_NORMALIZATION_MODEL_VERSION;
  confidenceModelVersion: typeof STRATEGY_CONFIDENCE_MODEL_VERSION;
  rankingTieBreakVersion: typeof STRATEGY_RANKING_TIE_BREAK_VERSION;
  strategyRegistryVersion: typeof STRATEGY_REGISTRY_VERSION;
  compatibilityEngineVersion: string;
  compatibilityResultVersion: typeof STRATEGY_COMPATIBILITY_RESULT_VERSION;
  compatibilityHashVersion: typeof STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION;
  requirementRegistryVersion: typeof STRATEGY_REQUIREMENT_REGISTRY_VERSION;
  disqualifierRegistryVersion: typeof STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION;
  formulaRegistryVersion: typeof FORMULA_REGISTRY_VERSION;
  underwritingRunVersion: typeof UNDERWRITING_CORE_OUTPUT_RUN_VERSION;
  underwritingHashVersion: typeof UNDERWRITING_CORE_OUTPUT_HASH_VERSION;
  snapshotContractVersion: typeof UNDERWRITING_SNAPSHOT_CONTRACT_VERSION;
};

export type StrategyScoreResult = {
  scoreResultId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  snapshotId: string;
  underwritingRunId: string;
  compatibilityResultId: string;
  strategyId: string;
  strategyVersion: string;
  scoreEligibility: StrategyScoreEligibility;
  compatibilityStatus: StrategyCompatibilityStatus;
  overallScore: number | null;
  overallScoreBasis: number | null;
  rank: number | null;
  categoryScores: StrategyCategoryScore[];
  normalizedMetrics: StrategyNormalizedMetric[];
  weightBreakdown: StrategyWeightBreakdown[];
  confidence: StrategyConfidenceResult;
  explanations: string[];
  scoreBreakdown: Array<{ categoryId: StrategyScoreCategoryId; normalizedBasis: number; weightBasis: number; weightedContributionBasis: number }>;
  versionReferences: StrategyScoreVersionReferences;
  deterministicScoreHash: string;
  requestedAt: string;
  completedAt: string;
  version: typeof STRATEGY_SCORING_RESULT_VERSION;
  errors: Array<{ code: StrategyScoringErrorCode; safeMessage: string }>;
};

export type StrategyRankingEvaluationRequest = {
  rankingRequestId: string;
  scoreRequests: StrategyScoringEvaluationRequest[];
};

export type StrategyRankingResult = {
  rankingResultId: string;
  rankingRequestId: string;
  workspaceId: string;
  dealId: string;
  rankedResults: StrategyScoreResult[];
  stableRankingOrder: string[];
  version: typeof STRATEGY_RANKING_RESULT_VERSION;
  deterministicRankingHash: string;
};

type CategoryWeightDefinition = {
  categoryId: StrategyScoreCategoryId;
  label: string;
  baseWeightBasis: number;
  explanation: string;
};

export const strategyScoringEngineDefinitions: readonly StrategyScoringEngineDefinition[] = Object.freeze([
  {
    engineId: STRATEGY_SCORING_ENGINE_ID,
    semanticVersion: "0.9.0",
    registryVersion: STRATEGY_SCORING_ENGINE_REGISTRY_VERSION,
    status: "deprecated",
    supportedStrategyRegistryVersions: [STRATEGY_REGISTRY_VERSION],
    supportedCompatibilityEngineVersions: [STRATEGY_COMPATIBILITY_ENGINE_VERSION],
    supportedCompatibilityResultVersions: [STRATEGY_COMPATIBILITY_RESULT_VERSION],
    supportedCompatibilityHashVersions: [STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION],
    supportedRequirementRegistryVersions: [STRATEGY_REQUIREMENT_REGISTRY_VERSION],
    supportedDisqualifierRegistryVersions: [STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION],
    supportedFormulaRegistryVersions: [FORMULA_REGISTRY_VERSION],
    supportedUnderwritingContractVersions: [UNDERWRITING_SNAPSHOT_CONTRACT_VERSION, UNDERWRITING_CORE_OUTPUT_RUN_VERSION, UNDERWRITING_CORE_OUTPUT_HASH_VERSION],
    supportedStrategyScoringModelVersions: [STRATEGY_SCORING_MODEL_VERSION_PENDING],
    supportedStrategyConfidenceModelVersions: [STRATEGY_CONFIDENCE_MODEL_VERSION_PENDING, STRATEGY_CONFIDENCE_MODEL_VERSION],
    weightRegistryVersion: STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION,
    normalizationModelVersion: STRATEGY_NORMALIZATION_MODEL_VERSION,
    confidenceModelVersion: STRATEGY_CONFIDENCE_MODEL_VERSION,
    rankingTieBreakVersion: STRATEGY_RANKING_TIE_BREAK_VERSION,
    effectiveDate: "2026-08-01",
    deprecatedDate: "2026-08-03",
    replacementEngineVersion: STRATEGY_SCORING_ENGINE_VERSION,
  },
  {
    engineId: STRATEGY_SCORING_ENGINE_ID,
    semanticVersion: STRATEGY_SCORING_ENGINE_VERSION,
    registryVersion: STRATEGY_SCORING_ENGINE_REGISTRY_VERSION,
    status: "active",
    supportedStrategyRegistryVersions: [STRATEGY_REGISTRY_VERSION],
    supportedCompatibilityEngineVersions: [STRATEGY_COMPATIBILITY_ENGINE_VERSION],
    supportedCompatibilityResultVersions: [STRATEGY_COMPATIBILITY_RESULT_VERSION],
    supportedCompatibilityHashVersions: [STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION],
    supportedRequirementRegistryVersions: [STRATEGY_REQUIREMENT_REGISTRY_VERSION],
    supportedDisqualifierRegistryVersions: [STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION],
    supportedFormulaRegistryVersions: [FORMULA_REGISTRY_VERSION],
    supportedUnderwritingContractVersions: [UNDERWRITING_SNAPSHOT_CONTRACT_VERSION, UNDERWRITING_CORE_OUTPUT_RUN_VERSION, UNDERWRITING_CORE_OUTPUT_HASH_VERSION],
    supportedStrategyScoringModelVersions: [STRATEGY_SCORING_MODEL_VERSION_PENDING],
    supportedStrategyConfidenceModelVersions: [STRATEGY_CONFIDENCE_MODEL_VERSION_PENDING, STRATEGY_CONFIDENCE_MODEL_VERSION],
    weightRegistryVersion: STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION,
    normalizationModelVersion: STRATEGY_NORMALIZATION_MODEL_VERSION,
    confidenceModelVersion: STRATEGY_CONFIDENCE_MODEL_VERSION,
    rankingTieBreakVersion: STRATEGY_RANKING_TIE_BREAK_VERSION,
    effectiveDate: "2026-08-03",
    deprecatedDate: null,
    replacementEngineVersion: null,
  },
  {
    engineId: STRATEGY_SCORING_ENGINE_ID,
    semanticVersion: "2.0.0",
    registryVersion: STRATEGY_SCORING_ENGINE_REGISTRY_VERSION,
    status: "disabled",
    supportedStrategyRegistryVersions: [STRATEGY_REGISTRY_VERSION],
    supportedCompatibilityEngineVersions: [STRATEGY_COMPATIBILITY_ENGINE_VERSION],
    supportedCompatibilityResultVersions: [STRATEGY_COMPATIBILITY_RESULT_VERSION],
    supportedCompatibilityHashVersions: [STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION],
    supportedRequirementRegistryVersions: [STRATEGY_REQUIREMENT_REGISTRY_VERSION],
    supportedDisqualifierRegistryVersions: [STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION],
    supportedFormulaRegistryVersions: [FORMULA_REGISTRY_VERSION],
    supportedUnderwritingContractVersions: [UNDERWRITING_SNAPSHOT_CONTRACT_VERSION, UNDERWRITING_CORE_OUTPUT_RUN_VERSION, UNDERWRITING_CORE_OUTPUT_HASH_VERSION],
    supportedStrategyScoringModelVersions: [STRATEGY_SCORING_MODEL_VERSION_PENDING],
    supportedStrategyConfidenceModelVersions: [STRATEGY_CONFIDENCE_MODEL_VERSION_PENDING, STRATEGY_CONFIDENCE_MODEL_VERSION],
    weightRegistryVersion: STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION,
    normalizationModelVersion: STRATEGY_NORMALIZATION_MODEL_VERSION,
    confidenceModelVersion: STRATEGY_CONFIDENCE_MODEL_VERSION,
    rankingTieBreakVersion: STRATEGY_RANKING_TIE_BREAK_VERSION,
    effectiveDate: "2026-08-03",
    deprecatedDate: null,
    replacementEngineVersion: null,
  },
]);

export const strategyScoringCategoryWeights: readonly CategoryWeightDefinition[] = Object.freeze([
  category("financial_strength", "Financial Strength", 1_200, "Uses accepted NOI, cash flow, cap rate, CoC return, and DSCR output strength."),
  category("risk", "Risk", 1_000, "Reflects unresolved dependencies, conflicts, assumptions, and condition-based compatibility."),
  category("execution_complexity", "Execution Complexity", 800, "Reflects strategy execution complexity and dependency burden."),
  category("capital_efficiency", "Capital Efficiency", 900, "Uses cash-on-cash return, LTV, and capital intensity."),
  category("cash_flow", "Cash Flow", 950, "Uses accepted pre-tax cash flow and DSCR support."),
  category("leverage", "Leverage", 750, "Uses LTV and DSCR output strength."),
  category("stability", "Stability", 850, "Reflects time horizon, liquidity, assumptions, and evidence completeness."),
  category("operational_burden", "Operational Burden", 650, "Reflects operating burden and professional review burden."),
  category("tax_efficiency", "Tax Efficiency", 500, "Reflects registry strategy category and professional review burden."),
  category("liquidity", "Liquidity", 650, "Reflects registry liquidity profile and exit dependency."),
  category("sensitivity", "Sensitivity", 750, "Reflects warning, preliminary, and incomplete output sensitivity."),
  category("professional_review_burden", "Professional Review Burden", 500, "Reflects required professional reviews from compatibility."),
  category("future_expansion", "Future Expansion", 500, "Reflects future dependency support and strategy horizon."),
]);

export function resolveLatestActiveScoringEngine() {
  const active = strategyScoringEngineDefinitions
    .filter((definition) => definition.status === "active")
    .sort((a, b) => compareSemver(b.semanticVersion, a.semanticVersion));
  if (!active[0]) throw scoringError("scoring_engine_version_not_found", "No active Strategy Scoring engine is available.");
  return active[0];
}

export function resolveScoringEngineVersion(version: string) {
  const engine = strategyScoringEngineDefinitions.find((definition) => definition.semanticVersion === version);
  if (!engine) throw scoringError("scoring_engine_version_not_found", "The requested Strategy Scoring engine version is not available.");
  return engine;
}

export function evaluateStrategyScore(
  request: StrategyScoringEvaluationRequest,
  compatibility: StrategyCompatibilityResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
): StrategyScoreResult {
  let engine: StrategyScoringEngineDefinition;
  try {
    engine = resolveScoringEngineVersion(request.scoringEngineVersion);
  } catch (error) {
    const safeMessage = error instanceof Error ? error.message : "The requested scoring engine is not available.";
    return notScoreableResult(request, compatibility, underwritingRun, "scoring_engine_version_not_found", safeMessage);
  }
  let strategy: StrategyDefinition;
  try {
    strategy = resolveStrategyDefinition(request.strategyId, request.strategyVersion);
  } catch {
    return notScoreableResult(request, compatibility, underwritingRun, "strategy_not_found", "The selected strategy/version is not registered.", engine);
  }
  const preflight = validatePreflight(request, compatibility, underwritingRun, engine, strategy);
  if (preflight) return notScoreableResult(request, compatibility, underwritingRun, preflight.code, preflight.safeMessage, engine, strategy);
  if (!isScoreableCompatibility(compatibility.compatibilityStatus)) {
    return notScoreableResult(request, compatibility, underwritingRun, "compatibility_not_scoreable", "Only compatible strategies and compatible-with-conditions strategies can receive a score.", engine, strategy);
  }

  const metrics = buildNormalizedMetrics(strategy, compatibility, underwritingRun);
  const categoryScores = buildCategoryScores(metrics);
  const weightBreakdown = resolveStrategyScoringWeights(strategy);
  const scoreBreakdown = categoryScores.map((score) => {
    const weight = weightBreakdown.find((item) => item.categoryId === score.categoryId)?.weightBasis ?? 0;
    return {
      categoryId: score.categoryId,
      normalizedBasis: score.normalizedBasis,
      weightBasis: weight,
      weightedContributionBasis: Math.round((score.normalizedBasis * weight) / WEIGHT_BASIS_TOTAL),
    };
  });
  const overallBasis = clampBasis(scoreBreakdown.reduce((sum, item) => sum + item.weightedContributionBasis, 0));
  const confidence = calculateStrategyConfidence(compatibility, underwritingRun);
  const base = {
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: compatibility.snapshotId,
    underwritingRunId: underwritingRun.runId,
    compatibilityResultId: compatibility.compatibilityResultId,
    strategyId: strategy.strategyId,
    strategyVersion: strategy.semanticVersion,
    scoreEligibility: "scored" as const,
    compatibilityStatus: compatibility.compatibilityStatus,
    overallScore: basisToScore(overallBasis),
    overallScoreBasis: overallBasis,
    rank: null,
    categoryScores,
    normalizedMetrics: metrics,
    weightBreakdown,
    confidence,
    explanations: [
      `${strategy.displayName} was scored only after compatibility allowed scoring.`,
      "The score references accepted underwriting outputs and compatibility state; it does not recalculate formulas.",
      confidence.confidenceLevel === "high" ? "Evidence quality supports high confidence in the scoring inputs." : "Confidence is reduced by disclosed assumptions, missing dependencies, conflicts, professional review, or output warnings.",
    ],
    scoreBreakdown,
    versionReferences: versionReferences(engine, compatibility),
    requestedAt: request.requestedAt,
    completedAt: request.requestedAt,
    version: STRATEGY_SCORING_RESULT_VERSION as typeof STRATEGY_SCORING_RESULT_VERSION,
    errors: [],
  };
  const deterministicScoreHash = stableHash({ hashVersion: STRATEGY_SCORING_RESULT_HASH_VERSION, ...base, requestedAt: undefined, completedAt: undefined });
  return deepFreeze({
    scoreResultId: `strategy_score_${deterministicScoreHash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`,
    ...base,
    deterministicScoreHash,
  });
}

export function evaluateStrategyRanking(
  request: StrategyRankingEvaluationRequest,
  compatibilities: StrategyCompatibilityResult[],
  underwritingRuns: UnderwritingCoreOutputRunRecord[],
): StrategyRankingResult {
  const compatibilityByKey = new Map(compatibilities.map((item) => [candidateKey(item.strategyId, item.strategyVersion), item]));
  const runById = new Map(underwritingRuns.map((run) => [run.runId, run]));
  const scored = request.scoreRequests.map((scoreRequest) => {
    const compatibility = compatibilityByKey.get(candidateKey(scoreRequest.strategyId, scoreRequest.strategyVersion === "latest" ? resolveStrategyDefinition(scoreRequest.strategyId).semanticVersion : scoreRequest.strategyVersion));
    const run = runById.get(scoreRequest.underwritingRunId);
    if (!compatibility || !run) {
      const fallbackCompatibility = compatibility ?? missingCompatibility(scoreRequest);
      const fallbackRun = run ?? missingUnderwritingRun(scoreRequest);
      return notScoreableResult(scoreRequest, fallbackCompatibility, fallbackRun, run ? "compatibility_not_scoreable" : "underwriting_run_not_usable", run ? "Compatibility result was not available for scoring." : "Underwriting run was not available for scoring.");
    }
    return evaluateStrategyScore(scoreRequest, compatibility, run);
  });
  const ranked = [...scored].sort(compareScoreResults).map((result, index) => ({ ...result, rank: index + 1 }));
  const base = {
    rankingRequestId: request.rankingRequestId,
    workspaceId: ranked[0]?.workspaceId ?? "",
    dealId: ranked[0]?.dealId ?? "",
    rankedResults: ranked,
    stableRankingOrder: ranked.map((result) => `${result.rank}:${result.strategyId}@${result.strategyVersion}:${result.scoreEligibility}:${result.overallScoreBasis ?? "none"}`),
    version: STRATEGY_RANKING_RESULT_VERSION as typeof STRATEGY_RANKING_RESULT_VERSION,
  };
  const deterministicRankingHash = stableHash({ hashVersion: STRATEGY_RANKING_RESULT_HASH_VERSION, ...base });
  return deepFreeze({
    rankingResultId: `strategy_rank_${deterministicRankingHash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`,
    ...base,
    deterministicRankingHash,
  });
}

export function resolveStrategyScoringWeights(strategy: StrategyDefinition): StrategyWeightBreakdown[] {
  const adjustments = adjustmentForStrategy(strategy);
  const rawWeights = strategyScoringCategoryWeights.map((definition) => ({
    ...definition,
    adjustmentBasis: adjustments[definition.categoryId] ?? 0,
    rawWeight: Math.max(100, definition.baseWeightBasis + (adjustments[definition.categoryId] ?? 0)),
  }));
  const rawTotal = rawWeights.reduce((sum, item) => sum + item.rawWeight, 0);
  let running = 0;
  return rawWeights.map((item, index) => {
    const isLast = index === rawWeights.length - 1;
    const weightBasis = isLast ? WEIGHT_BASIS_TOTAL - running : Math.round((item.rawWeight / rawTotal) * WEIGHT_BASIS_TOTAL);
    running += weightBasis;
    return {
      categoryId: item.categoryId,
      weightBasis,
      weightPercent: basisToPercent(weightBasis),
      strategyAdjustmentBasis: item.adjustmentBasis,
      explanation: item.explanation,
    };
  });
}

function validatePreflight(
  request: StrategyScoringEvaluationRequest,
  compatibility: StrategyCompatibilityResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  engine: StrategyScoringEngineDefinition,
  strategy: StrategyDefinition,
): { code: StrategyScoringErrorCode; safeMessage: string } | undefined {
  if (engine.status === "disabled") return { code: "scoring_engine_disabled", safeMessage: "This Strategy Scoring engine version is disabled." };
  if (!engine.supportedStrategyRegistryVersions.includes(request.strategyRegistryVersion) || !engine.supportedRequirementRegistryVersions.includes(request.requirementRegistryVersion) || !engine.supportedDisqualifierRegistryVersions.includes(request.disqualifierRegistryVersion) || !engine.supportedFormulaRegistryVersions.includes(request.formulaRegistryVersion) || request.snapshotContractVersion !== UNDERWRITING_SNAPSHOT_CONTRACT_VERSION || request.weightRegistryVersion !== engine.weightRegistryVersion) {
    return { code: "unsupported_registry_version", safeMessage: "One or more registry versions are unsupported by this Strategy Scoring engine." };
  }
  if (request.workspaceId !== compatibility.workspaceId || request.workspaceId !== underwritingRun.workspaceId || request.dealId !== compatibility.dealId || request.dealId !== underwritingRun.dealId || request.propertyId !== compatibility.propertyId || request.underwritingSnapshotId !== compatibility.snapshotId || request.underwritingSnapshotId !== underwritingRun.snapshotId || request.underwritingRunId !== compatibility.underwritingRunId || request.underwritingRunId !== underwritingRun.runId) {
    return { code: "scope_mismatch", safeMessage: "The scoring request, compatibility result, and underwriting run do not share the same immutable scope." };
  }
  if (request.strategyId !== compatibility.strategyId || strategy.strategyId !== compatibility.strategyId || strategy.semanticVersion !== compatibility.strategyVersion) {
    return { code: "scope_mismatch", safeMessage: "The scoring request does not match the strategy compatibility result." };
  }
  if (request.expectedCompatibilityResultHash !== compatibility.deterministicResultHash) return { code: "compatibility_result_hash_mismatch", safeMessage: "The compatibility result changed before scoring. Refresh and retry." };
  if (request.expectedResultSetHash !== underwritingRun.resultSetHash) return { code: "underwriting_result_set_hash_mismatch", safeMessage: "The underwriting run changed before scoring. Refresh and retry." };
  if (!["complete", "complete_with_warnings"].includes(underwritingRun.status)) return { code: "underwriting_run_not_usable", safeMessage: "Strategy scoring requires a complete immutable underwriting output run." };
  return undefined;
}

function buildNormalizedMetrics(
  strategy: StrategyDefinition,
  compatibility: StrategyCompatibilityResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
): StrategyNormalizedMetric[] {
  const outputs = new Map(underwritingRun.results.map((result) => [result.formulaId, result]));
  const metric = (metricId: FormulaId, rawValue: number | undefined, valueHash: string | null, basis: number, direction: StrategyNormalizedMetric["direction"]): StrategyNormalizedMetric => ({
    metricId,
    source: "underwriting_output",
    rawValue: rawValue ?? null,
    rawValueHash: valueHash,
    normalizedBasis: clampBasis(basis),
    direction,
    version: STRATEGY_NORMALIZATION_MODEL_VERSION,
  });
  const outputMetric = (formulaId: FormulaId, basis: (value: number) => number, direction: StrategyNormalizedMetric["direction"]) => {
    const result = outputs.get(formulaId);
    const raw = isUsableOutput(result) ? result.rawValue : undefined;
    return metric(formulaId, raw, result?.deterministicHash ?? null, raw === undefined ? 0 : basis(raw), direction);
  };
  return [
    outputMetric("net_operating_income", (value) => normalizeRange(value, -12_000, 48_000), "higher_is_better"),
    outputMetric("pre_tax_cash_flow", (value) => normalizeRange(value, -12_000, 24_000), "higher_is_better"),
    outputMetric("cash_on_cash_return", (value) => normalizeRange(value, -5, 15), "higher_is_better"),
    outputMetric("capitalization_rate", (value) => normalizeRange(value, 2, 10), "higher_is_better"),
    outputMetric("debt_service_coverage_ratio", (value) => normalizeRange(value, 0.8, 1.6), "higher_is_better"),
    outputMetric("loan_to_value_ratio", (value) => normalizeInverseRange(value, 95, 55), "lower_is_better"),
    {
      metricId: "compatibility",
      source: "compatibility_result",
      rawValue: compatibility.compatibilityStatus,
      rawValueHash: compatibility.deterministicResultHash,
      normalizedBasis: compatibility.compatibilityStatus === "compatible" ? 10_000 : compatibility.compatibilityStatus === "compatible_with_conditions" ? 8_000 : 0,
      direction: "higher_is_better",
      version: STRATEGY_NORMALIZATION_MODEL_VERSION,
    },
    {
      metricId: "assumption_burden",
      source: "compatibility_result",
      rawValue: compatibility.acceptedAssumptionCount + compatibility.preliminaryAssumptionCount,
      rawValueHash: compatibility.deterministicResultHash,
      normalizedBasis: penaltyToBasis(compatibility.acceptedAssumptionCount * 800 + compatibility.preliminaryAssumptionCount * 1_500),
      direction: "lower_is_better",
      version: STRATEGY_NORMALIZATION_MODEL_VERSION,
    },
    {
      metricId: "unresolved_risk",
      source: "compatibility_result",
      rawValue: unresolvedRiskCount(compatibility),
      rawValueHash: compatibility.deterministicResultHash,
      normalizedBasis: penaltyToBasis(unresolvedRiskCount(compatibility) * 1_100),
      direction: "lower_is_better",
      version: STRATEGY_NORMALIZATION_MODEL_VERSION,
    },
    {
      metricId: "professional_review",
      source: "compatibility_result",
      rawValue: compatibility.professionalReviewCount,
      rawValueHash: compatibility.deterministicResultHash,
      normalizedBasis: penaltyToBasis(compatibility.professionalReviewCount * 1_250),
      direction: "lower_is_better",
      version: STRATEGY_NORMALIZATION_MODEL_VERSION,
    },
    {
      metricId: "strategy_complexity",
      source: "strategy_registry",
      rawValue: strategy.executionComplexity,
      rawValueHash: strategy.metadataHash,
      normalizedBasis: complexityBasis(strategy.executionComplexity),
      direction: "lower_is_better",
      version: STRATEGY_NORMALIZATION_MODEL_VERSION,
    },
    {
      metricId: "strategy_liquidity",
      source: "strategy_registry",
      rawValue: strategy.liquidityProfile,
      rawValueHash: strategy.metadataHash,
      normalizedBasis: liquidityBasis(strategy.liquidityProfile),
      direction: "higher_is_better",
      version: STRATEGY_NORMALIZATION_MODEL_VERSION,
    },
    {
      metricId: "strategy_horizon",
      source: "strategy_registry",
      rawValue: strategy.timeHorizon,
      rawValueHash: strategy.metadataHash,
      normalizedBasis: horizonBasis(strategy.timeHorizon),
      direction: "neutral",
      version: STRATEGY_NORMALIZATION_MODEL_VERSION,
    },
    {
      metricId: "future_dependency_support",
      source: "strategy_registry",
      rawValue: strategy.futureMarketDependencies.length + strategy.futureFinancingDependencies.length + strategy.futureGovernanceLegalDependencies.length + strategy.futurePropertyConditionDependencies.length + strategy.futureInvestorFitDependencies.length,
      rawValueHash: strategy.metadataHash,
      normalizedBasis: normalizeInverseRange(strategy.futureMarketDependencies.length + strategy.futureFinancingDependencies.length + strategy.futureGovernanceLegalDependencies.length + strategy.futurePropertyConditionDependencies.length + strategy.futureInvestorFitDependencies.length, 20, 3),
      direction: "higher_is_better",
      version: STRATEGY_NORMALIZATION_MODEL_VERSION,
    },
  ];
}

function buildCategoryScores(metrics: StrategyNormalizedMetric[]): StrategyCategoryScore[] {
  const byId = new Map(metrics.map((metric) => [metric.metricId, metric]));
  const score = (categoryId: StrategyScoreCategoryId, label: string, metricIds: StrategyNormalizedMetric["metricId"][], explanation: string) => {
    const selected = metricIds.map((id) => byId.get(id)).filter((item): item is StrategyNormalizedMetric => Boolean(item));
    const normalizedBasis = selected.length ? Math.round(selected.reduce((sum, item) => sum + item.normalizedBasis, 0) / selected.length) : 0;
    return {
      categoryId,
      label,
      normalizedScore: basisToScore(normalizedBasis),
      normalizedBasis,
      metricRefs: selected.map((item) => String(item.metricId)).sort(),
      explanation,
    };
  };
  return [
    score("financial_strength", "Financial Strength", ["net_operating_income", "cash_on_cash_return", "capitalization_rate", "debt_service_coverage_ratio"], "Financial score references accepted return, NOI, and coverage outputs."),
    score("risk", "Risk", ["compatibility", "assumption_burden", "unresolved_risk", "professional_review"], "Risk score reflects compatibility quality and unresolved evidence burden."),
    score("execution_complexity", "Execution Complexity", ["strategy_complexity", "future_dependency_support"], "Execution score reflects registry complexity and unresolved future dependency burden."),
    score("capital_efficiency", "Capital Efficiency", ["cash_on_cash_return", "loan_to_value_ratio", "strategy_complexity"], "Capital score balances return on cash with leverage and strategy complexity."),
    score("cash_flow", "Cash Flow", ["pre_tax_cash_flow", "debt_service_coverage_ratio", "net_operating_income"], "Cash-flow score references accepted cash flow and debt coverage outputs."),
    score("leverage", "Leverage", ["loan_to_value_ratio", "debt_service_coverage_ratio"], "Leverage score references accepted LTV and DSCR outputs."),
    score("stability", "Stability", ["compatibility", "assumption_burden", "strategy_horizon", "strategy_liquidity"], "Stability score reflects compatibility quality, assumptions, horizon, and exit profile."),
    score("operational_burden", "Operational Burden", ["strategy_complexity", "professional_review"], "Operational score reflects complexity and required expert review."),
    score("tax_efficiency", "Tax Efficiency", ["professional_review", "strategy_horizon"], "Tax score is conservative until tax-specific support matures and review burden is low."),
    score("liquidity", "Liquidity", ["strategy_liquidity", "loan_to_value_ratio"], "Liquidity score reflects exit profile and leverage."),
    score("sensitivity", "Sensitivity", ["assumption_burden", "unresolved_risk", "cash_on_cash_return"], "Sensitivity score reflects how assumptions and unresolved risks may move the result."),
    score("professional_review_burden", "Professional Review Burden", ["professional_review"], "Professional-review score declines when more outside review is required."),
    score("future_expansion", "Future Expansion", ["future_dependency_support", "strategy_horizon"], "Future-expansion score reflects registry horizon and dependency readiness."),
  ];
}

function calculateStrategyConfidence(
  compatibility: StrategyCompatibilityResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
): StrategyConfidenceResult {
  const penalties: StrategyConfidenceResult["penalties"] = [];
  const add = (reason: string, penaltyBasis: number) => {
    if (penaltyBasis > 0) penalties.push({ reason, penaltyBasis });
  };
  add("Accepted assumptions remain in the compatibility result.", compatibility.acceptedAssumptionCount * 600);
  add("Preliminary assumptions remain in the compatibility result.", compatibility.preliminaryAssumptionCount * 1_000);
  add("Missing, conflicted, unavailable, or unsatisfied dependencies remain.", unresolvedRiskCount(compatibility) * 900);
  add("Professional review is still required.", compatibility.professionalReviewCount * 750);
  add("Underwriting warnings exist.", underwritingRun.warningCount * 350);
  add("Some underwriting outputs are incomplete or preliminary.", (underwritingRun.incompleteResultCount + underwritingRun.preliminaryResultCount + underwritingRun.blockedResultCount) * 800);
  const basis = clampBasis(10_000 - penalties.reduce((sum, item) => sum + item.penaltyBasis, 0));
  return {
    confidenceLevel: basis >= 8_500 ? "high" : basis >= 7_000 ? "moderate" : basis >= 5_000 ? "low" : "insufficient",
    confidenceScore: basisToScore(basis),
    confidenceBasis: basis,
    modelVersion: STRATEGY_CONFIDENCE_MODEL_VERSION,
    drivers: [
      "Confidence is a deterministic evidence-quality rating, not a probability of success.",
      `Compatibility status: ${compatibility.compatibilityStatus}.`,
      `Underwriting run status: ${underwritingRun.status}.`,
    ],
    penalties,
  };
}

function compareScoreResults(a: StrategyScoreResult, b: StrategyScoreResult) {
  const aStrategy = safeStrategy(a.strategyId, a.strategyVersion);
  const bStrategy = safeStrategy(b.strategyId, b.strategyVersion);
  return compatibilityOrder(b.compatibilityStatus) - compatibilityOrder(a.compatibilityStatus)
    || (b.overallScoreBasis ?? -1) - (a.overallScoreBasis ?? -1)
    || unresolvedRiskCountFromScore(a) - unresolvedRiskCountFromScore(b)
    || assumptionBurdenFromScore(a) - assumptionBurdenFromScore(b)
    || (aStrategy?.stableOrdinal ?? Number.MAX_SAFE_INTEGER) - (bStrategy?.stableOrdinal ?? Number.MAX_SAFE_INTEGER)
    || a.strategyId.localeCompare(b.strategyId)
    || a.strategyVersion.localeCompare(b.strategyVersion);
}

function notScoreableResult(
  request: StrategyScoringEvaluationRequest,
  compatibility: StrategyCompatibilityResult,
  underwritingRun: UnderwritingCoreOutputRunRecord,
  code: StrategyScoringErrorCode,
  safeMessage: string,
  engine = safeEngine(request.scoringEngineVersion),
  strategy = safeStrategy(request.strategyId, request.strategyVersion),
): StrategyScoreResult {
  const base = {
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: compatibility.snapshotId,
    underwritingRunId: underwritingRun.runId,
    compatibilityResultId: compatibility.compatibilityResultId,
    strategyId: strategy?.strategyId ?? request.strategyId,
    strategyVersion: strategy?.semanticVersion ?? request.strategyVersion,
    scoreEligibility: "not_scoreable" as const,
    compatibilityStatus: compatibility.compatibilityStatus,
    overallScore: null,
    overallScoreBasis: null,
    rank: null,
    categoryScores: [],
    normalizedMetrics: [],
    weightBreakdown: strategy ? resolveStrategyScoringWeights(strategy) : [],
    confidence: {
      confidenceLevel: "not_applicable" as const,
      confidenceScore: null,
      confidenceBasis: null,
      modelVersion: STRATEGY_CONFIDENCE_MODEL_VERSION as typeof STRATEGY_CONFIDENCE_MODEL_VERSION,
      drivers: ["This strategy did not meet the deterministic scoring gate."],
      penalties: [],
    },
    explanations: [safeMessage],
    scoreBreakdown: [],
    versionReferences: versionReferences(engine, compatibility),
    requestedAt: request.requestedAt,
    completedAt: request.requestedAt,
    version: STRATEGY_SCORING_RESULT_VERSION as typeof STRATEGY_SCORING_RESULT_VERSION,
    errors: [{ code, safeMessage }],
  };
  const deterministicScoreHash = stableHash({ hashVersion: STRATEGY_SCORING_RESULT_HASH_VERSION, ...base, requestedAt: undefined, completedAt: undefined });
  return deepFreeze({
    scoreResultId: `strategy_score_${deterministicScoreHash.replace(/[^a-z0-9]/gi, "").slice(0, 32)}`,
    ...base,
    deterministicScoreHash,
  });
}

function versionReferences(engine: StrategyScoringEngineDefinition | undefined, compatibility: StrategyCompatibilityResult): StrategyScoreVersionReferences {
  const resolved = engine ?? resolveLatestActiveScoringEngine();
  return {
    scoringEngineVersion: resolved.semanticVersion,
    scoringEngineRegistryVersion: STRATEGY_SCORING_ENGINE_REGISTRY_VERSION,
    scoringResultVersion: STRATEGY_SCORING_RESULT_VERSION,
    scoringHashVersion: STRATEGY_SCORING_RESULT_HASH_VERSION,
    weightRegistryVersion: resolved.weightRegistryVersion,
    normalizationModelVersion: resolved.normalizationModelVersion,
    confidenceModelVersion: resolved.confidenceModelVersion,
    rankingTieBreakVersion: resolved.rankingTieBreakVersion,
    strategyRegistryVersion: STRATEGY_REGISTRY_VERSION,
    compatibilityEngineVersion: compatibility.compatibilityEngineVersion,
    compatibilityResultVersion: STRATEGY_COMPATIBILITY_RESULT_VERSION,
    compatibilityHashVersion: STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION,
    requirementRegistryVersion: compatibility.requirementRegistryVersion,
    disqualifierRegistryVersion: compatibility.disqualifierRegistryVersion,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    underwritingRunVersion: UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
    underwritingHashVersion: UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
    snapshotContractVersion: UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
  };
}

function adjustmentForStrategy(strategy: StrategyDefinition): Partial<Record<StrategyScoreCategoryId, number>> {
  const adjustments: Partial<Record<StrategyScoreCategoryId, number>> = {};
  if (strategy.supportedUnderwritingModes.includes("rental") || strategy.supportedUnderwritingModes.includes("commercial_income")) {
    adjustments.cash_flow = 350;
    adjustments.financial_strength = 250;
    adjustments.leverage = 200;
  }
  if (strategy.supportedTransactionContexts.includes("renovation") || strategy.supportedTransactionContexts.includes("development")) {
    adjustments.execution_complexity = 300;
    adjustments.risk = 250;
    adjustments.capital_efficiency = 200;
  }
  if (strategy.category === "tax_or_exchange") {
    adjustments.tax_efficiency = 650;
    adjustments.professional_review_burden = 300;
  }
  if (strategy.category === "land" || strategy.category === "development") {
    adjustments.future_expansion = 400;
    adjustments.liquidity = 250;
    adjustments.cash_flow = -250;
  }
  if (strategy.executionComplexity === "expert") {
    adjustments.execution_complexity = (adjustments.execution_complexity ?? 0) + 250;
    adjustments.professional_review_burden = (adjustments.professional_review_burden ?? 0) + 250;
  }
  return adjustments;
}

function unresolvedRiskCount(compatibility: StrategyCompatibilityResult) {
  return compatibility.missingRequirementCount + compatibility.conflictedRequirementCount + compatibility.unavailableDependencyCount + compatibility.unsatisfiedRequirementCount + compatibility.triggeredDisqualifierCount;
}

function unresolvedRiskCountFromScore(result: StrategyScoreResult) {
  const metric = result.normalizedMetrics.find((item) => item.metricId === "unresolved_risk");
  return typeof metric?.rawValue === "number" ? metric.rawValue : Number.MAX_SAFE_INTEGER;
}

function assumptionBurdenFromScore(result: StrategyScoreResult) {
  const metric = result.normalizedMetrics.find((item) => item.metricId === "assumption_burden");
  return typeof metric?.rawValue === "number" ? metric.rawValue : Number.MAX_SAFE_INTEGER;
}

function isScoreableCompatibility(status: StrategyCompatibilityStatus) {
  return status === "compatible" || status === "compatible_with_conditions";
}

function compatibilityOrder(status: StrategyCompatibilityStatus) {
  if (status === "compatible") return 5;
  if (status === "compatible_with_conditions") return 4;
  if (status === "uncertain") return 3;
  if (status === "incompatible") return 2;
  return 1;
}

function isUsableOutput(result: UnderwritingCoreFormulaResultRecord | undefined) {
  return Boolean(result && (result.status === "calculated" || result.status === "calculated_with_warning") && typeof result.rawValue === "number" && Number.isFinite(result.rawValue));
}

function normalizeRange(value: number, floor: number, ceiling: number) {
  if (ceiling === floor) return 0;
  return clampBasis(Math.round(((value - floor) / (ceiling - floor)) * SCORE_BASIS_MAX));
}

function normalizeInverseRange(value: number, weak: number, strong: number) {
  if (weak === strong) return 0;
  return clampBasis(Math.round(((weak - value) / (weak - strong)) * SCORE_BASIS_MAX));
}

function penaltyToBasis(penaltyBasis: number) {
  return clampBasis(SCORE_BASIS_MAX - penaltyBasis);
}

function complexityBasis(value: StrategyDefinition["executionComplexity"]) {
  if (value === "low") return 10_000;
  if (value === "moderate") return 7_500;
  if (value === "high") return 5_000;
  return 2_500;
}

function liquidityBasis(value: StrategyDefinition["liquidityProfile"]) {
  if (value === "liquid_after_stabilization") return 8_500;
  if (value === "moderate") return 7_000;
  if (value === "exit_dependent") return 4_500;
  return 3_000;
}

function horizonBasis(value: StrategyDefinition["timeHorizon"]) {
  if (value === "medium") return 8_000;
  if (value === "long") return 7_000;
  if (value === "short") return 6_000;
  return 5_500;
}

function basisToScore(basis: number) {
  return Math.round(clampBasis(basis) / 100);
}

function basisToPercent(basis: number) {
  return Math.round((basis / 100) * 100) / 100;
}

function clampBasis(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(SCORE_BASIS_MAX, Math.round(value)));
}

function category(categoryId: StrategyScoreCategoryId, label: string, baseWeightBasis: number, explanation: string): CategoryWeightDefinition {
  return { categoryId, label, baseWeightBasis, explanation };
}

function candidateKey(strategyId: string, version: string) {
  return `${strategyId}@${version}`;
}

function safeStrategy(strategyId: string, version: string | "latest") {
  try {
    return resolveStrategyDefinition(strategyId, version);
  } catch {
    return undefined;
  }
}

function safeEngine(version: string) {
  try {
    return resolveScoringEngineVersion(version);
  } catch {
    return undefined;
  }
}

function missingCompatibility(request: StrategyScoringEvaluationRequest): StrategyCompatibilityResult {
  return {
    compatibilityResultId: "missing-compatibility",
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    propertyId: request.propertyId,
    snapshotId: request.underwritingSnapshotId,
    underwritingRunId: request.underwritingRunId,
    strategyId: request.strategyId,
    strategyVersion: request.strategyVersion,
    strategyRegistryVersion: request.strategyRegistryVersion,
    requirementRegistryVersion: request.requirementRegistryVersion,
    disqualifierRegistryVersion: request.disqualifierRegistryVersion,
    compatibilityEngineVersion: STRATEGY_COMPATIBILITY_ENGINE_VERSION,
    compatibilityStatus: "not_evaluated",
    evaluationReadiness: "unavailable_dependency",
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
    controllingReasons: ["Compatibility result missing."],
    missingDependencies: [],
    requiredProfessionalReviews: [],
    deterministicResultHash: "missing-compatibility-hash",
    idempotencyKey: "missing",
    evaluatedBy: "missing",
    requestedAt: request.requestedAt,
    completedAt: request.requestedAt,
    version: STRATEGY_COMPATIBILITY_RESULT_VERSION,
    errors: [],
  };
}

function missingUnderwritingRun(request: StrategyScoringEvaluationRequest): UnderwritingCoreOutputRunRecord {
  return {
    runId: request.underwritingRunId,
    workspaceId: request.workspaceId,
    dealId: request.dealId,
    snapshotId: request.underwritingSnapshotId,
    snapshotHash: "",
    snapshotManifestHash: "",
    engineVersion: UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    hashVersion: UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
    status: "failed",
    requestedBy: "",
    idempotencyKey: "missing",
    requestedAt: request.requestedAt,
    startedAt: request.requestedAt,
    completedAt: request.requestedAt,
    calculationOrder: [],
    resultSetHash: "missing",
    dependencyGraphHash: "missing",
    formulaVersionManifestHash: "missing",
    resultCount: 0,
    calculatedResultCount: 0,
    warningCount: 0,
    blockedResultCount: 0,
    incompleteResultCount: 0,
    preliminaryResultCount: 0,
    warnings: [],
    errors: ["Underwriting run missing."],
    assumptionDisclosures: [],
    snapshotReadinessState: "missing",
    results: [],
  };
}

function scoringError(code: StrategyScoringErrorCode, safeMessage: string) {
  const error = new Error(safeMessage) as Error & { code: StrategyScoringErrorCode };
  error.code = code;
  return error;
}

function compareSemver(a: string, b: string) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((left[index] ?? 0) !== (right[index] ?? 0)) return (left[index] ?? 0) - (right[index] ?? 0);
  }
  return 0;
}

function stableHash(value: unknown) {
  const text = stableSerialize(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `strat_score_${(hash >>> 0).toString(16).padStart(8, "0")}`;
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

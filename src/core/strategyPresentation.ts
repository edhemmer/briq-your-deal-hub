import type { PresentationMode } from "./presentationMode";
import { resolveStrategyDefinition } from "./strategyRegistry";
import type { StrategyCompatibilityResult, StrategyCompatibilityStatus } from "./strategyCompatibility";
import type { StrategyExplanationProjection, StrategyExplanationResult } from "./strategyExplanation";
import { projectStrategyExplanation } from "./strategyExplanation";
import type { StrategyReevaluationEvent, StrategyReevaluationStaleStatus } from "./strategyReevaluationEvents";
import type { StrategyRankingResult, StrategyScoreResult } from "./strategyScoring";
import type { UnderwritingPresentationModel } from "./underwritingPresentation";

export const STRATEGY_PRESENTATION_CONTRACT_VERSION = "strategy-presentation-contract-v1";
export const STRATEGY_COMPARISON_MAX_STRATEGIES = 4;

export type StrategyResultFreshnessState = StrategyReevaluationStaleStatus | "historical";
export type StrategyDisplayMode = PresentationMode;

export type StrategyUserPreferenceProjection = {
  strategyId: string;
  strategyVersion: string;
  displayName: string;
  relatedRankingId?: string;
  relatedSnapshotId?: string;
  relatedRunId?: string;
  rationale?: string;
  selectedAt?: string;
  acknowledgementRequired: boolean;
  compatibilityStatus?: StrategyCompatibilityStatus;
};

export type StrategyHistoryProjection = {
  resultId: string;
  strategyId: string;
  strategyVersion: string;
  displayName: string;
  createdAt: string;
  snapshotId?: string;
  underwritingRunId?: string;
  rank: number | null;
  score: number | null;
  compatibilityStatus: StrategyCompatibilityStatus;
  confidenceLabel: string;
  freshnessState: StrategyResultFreshnessState;
  hash: string;
  readOnly: true;
};

export type StrategyPresentationInput = {
  dealId: string;
  dealName?: string;
  mode: StrategyDisplayMode;
  ranking?: StrategyRankingResult;
  compatibilities?: StrategyCompatibilityResult[];
  explanations?: StrategyExplanationResult[];
  reevaluationEvents?: StrategyReevaluationEvent[];
  userPreference?: StrategyUserPreferenceProjection;
  underwriting?: UnderwritingPresentationModel;
  history?: StrategyHistoryProjection[];
  comparisonStrategyIds?: string[];
  selectedStrategyId?: string;
};

export type StrategyPresentationModel = {
  contractVersion: typeof STRATEGY_PRESENTATION_CONTRACT_VERSION;
  dealId: string;
  dealName: string;
  mode: StrategyDisplayMode;
  hasCanonicalStrategyResults: boolean;
  emptyState?: {
    title: string;
    detail: string;
  };
  overview: StrategyOverviewProjection;
  rankedStrategies: StrategyRankedRowProjection[];
  selectedStrategy?: StrategyDetailProjection;
  comparison: StrategyComparisonProjection;
  userPreference?: StrategyUserPreferenceProjection;
  staleEvents: StrategyStaleEventProjection[];
  history: StrategyHistoryProjection[];
  sourceBoundary: {
    usesCanonicalRanking: boolean;
    usesCanonicalCompatibility: boolean;
    usesCanonicalScoring: boolean;
    usesCanonicalExplanation: boolean;
    usesCanonicalReevaluation: boolean;
    clientBusinessLogicProhibited: true;
  };
};

export type StrategyOverviewProjection = {
  rankingId?: string;
  rankingVersion?: string;
  rankingHash?: string;
  createdAt?: string;
  snapshotId?: string;
  underwritingRunId?: string;
  freshnessState: StrategyResultFreshnessState | "none";
  candidateCount: number | null;
  compatibleCount: number | null;
  compatibleWithConditionsCount: number | null;
  uncertainCount: number | null;
  incompatibleCount: number | null;
  notEvaluatedCount: number | null;
  missingDependencyCount: number | null;
  professionalReviewCount: number | null;
  topRankedViable?: {
    strategyId: string;
    strategyVersion: string;
    displayName: string;
    rank: number | null;
  };
  userSelected?: StrategyUserPreferenceProjection;
  userSelectionMatchesSystemRank: boolean | null;
  staleWarning?: string;
};

export type StrategyRankedRowProjection = {
  scoreResultId: string;
  strategyId: string;
  strategyVersion: string;
  displayName: string;
  rank: number | null;
  canonicalOrdinal: number;
  compatibilityStatus: StrategyCompatibilityStatus;
  scoreEligibility: StrategyScoreResult["scoreEligibility"];
  totalScore: number | null;
  confidenceLabel: string;
  confidenceDescription: string;
  strengths: string[];
  weaknesses: string[];
  hardDisqualifierCount: number;
  hardDisqualifiers: string[];
  conditions: string[];
  acceptedAssumptionCount: number;
  preliminaryAssumptionCount: number;
  missingDependencyCount: number;
  professionalReviewCount: number;
  freshnessState: StrategyResultFreshnessState;
  selectedByUser: boolean;
  explanation?: StrategyExplanationProjection;
  hash: string;
};

export type StrategyDetailProjection = StrategyRankedRowProjection & {
  identity: {
    strategyId: string;
    strategyVersion: string;
    registryVersion: string;
    lifecycleStatus: string;
    supportStatus: string;
    category: string;
  };
  dimensionScores: Array<{
    categoryId: string;
    label: string;
    normalizedScore: number;
    normalizedBasis: number;
    explanation: string;
  }>;
  weights: Array<{
    categoryId: string;
    weightPercent: number;
    weightBasis: number;
    strategyAdjustmentBasis: number;
    explanation: string;
  }>;
  weightedContributions: Array<{
    categoryId: string;
    normalizedBasis: number;
    weightBasis: number;
    weightedContributionBasis: number;
  }>;
  bindingConstraints: string[];
  missingInformation: string[];
  staleInformation: string[];
  conflicts: string[];
  unavailableModules: string[];
  materialChangeFactors: string[];
  underwritingReferences: string[];
  versionReferences: string[];
};

export type StrategyComparisonProjection = {
  limit: typeof STRATEGY_COMPARISON_MAX_STRATEGIES;
  selectedStrategyIds: string[];
  rows: StrategyComparisonRowProjection[];
  columns: StrategyRankedRowProjection[];
};

export type StrategyComparisonRowProjection = {
  rowId: string;
  label: string;
  values: Array<{
    strategyId: string;
    value: string;
    state: "same" | "different" | "unavailable" | "not_applicable" | "blocked" | "preliminary" | "assumption_based" | "stale" | "historical";
  }>;
};

export type StrategyStaleEventProjection = {
  eventId: string;
  eventType: string;
  staleStatus: StrategyReevaluationStaleStatus;
  triggeredBy: string;
  affectedStrategies: string[];
  affectedEngines: string[];
  requiredScope: string;
  reason: string;
  eventHash: string;
  occurredAt: string;
};

export function buildStrategyPresentation(input: StrategyPresentationInput): StrategyPresentationModel {
  const rankedStrategies = buildRankedRows(input);
  const selectedStrategy = rankedStrategies.find((row) => row.strategyId === input.selectedStrategyId)
    ?? rankedStrategies.find((row) => row.selectedByUser)
    ?? rankedStrategies[0];
  const comparison = buildComparison(rankedStrategies, input.comparisonStrategyIds);
  const staleEvents = buildStaleEvents(input.reevaluationEvents ?? []);
  const history = [...(input.history ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 25);
  const overview = buildOverview(input, rankedStrategies, staleEvents);
  const hasCanonicalStrategyResults = Boolean(input.ranking && rankedStrategies.length);

  return {
    contractVersion: STRATEGY_PRESENTATION_CONTRACT_VERSION,
    dealId: input.dealId,
    dealName: input.dealName?.trim() || "Deal",
    mode: input.mode,
    hasCanonicalStrategyResults,
    emptyState: hasCanonicalStrategyResults ? undefined : {
      title: "No Strategy Intelligence result yet",
      detail: "Run canonical underwriting and Strategy Intelligence for this Deal to compare ranked strategies here. BRIX will not invent strategy scores without a saved ranking result.",
    },
    overview,
    rankedStrategies,
    selectedStrategy: selectedStrategy ? buildDetail(selectedStrategy, input.ranking) : undefined,
    comparison,
    userPreference: input.userPreference,
    staleEvents,
    history,
    sourceBoundary: {
      usesCanonicalRanking: Boolean(input.ranking),
      usesCanonicalCompatibility: Boolean(input.compatibilities?.length),
      usesCanonicalScoring: Boolean(input.ranking?.rankedResults.length),
      usesCanonicalExplanation: Boolean(input.explanations?.length),
      usesCanonicalReevaluation: Boolean(input.reevaluationEvents?.length),
      clientBusinessLogicProhibited: true,
    },
  };
}

function buildRankedRows(input: StrategyPresentationInput): StrategyRankedRowProjection[] {
  const compatibilityByResult = new Map((input.compatibilities ?? []).map((item) => [item.compatibilityResultId, item]));
  const explanationByScore = new Map((input.explanations ?? []).map((item) => [item.scoreResultId, item]));
  const staleByStrategy = stalenessByStrategy(input.reevaluationEvents ?? []);
  return [...(input.ranking?.rankedResults ?? [])]
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
    .map((score, index) => {
      const strategy = resolveStrategyDefinition(score.strategyId, score.strategyVersion);
      const compatibility = compatibilityByResult.get(score.compatibilityResultId);
      const explanation = explanationByScore.get(score.scoreResultId);
      return {
        scoreResultId: score.scoreResultId,
        strategyId: score.strategyId,
        strategyVersion: score.strategyVersion,
        displayName: strategy.displayName,
        rank: score.rank,
        canonicalOrdinal: index + 1,
        compatibilityStatus: score.compatibilityStatus,
        scoreEligibility: score.scoreEligibility,
        totalScore: score.scoreEligibility === "scored" ? score.overallScore : null,
        confidenceLabel: label(score.confidence.confidenceLevel),
        confidenceDescription: "Confidence describes evidence quality, not probability of success.",
        strengths: score.explanations.slice(0, 2),
        weaknesses: score.errors.map((item) => item.safeMessage).slice(0, 2),
        hardDisqualifierCount: compatibility?.triggeredDisqualifierCount ?? 0,
        hardDisqualifiers: (compatibility?.disqualifierResultManifest ?? [])
          .filter((item) => item.evaluationStatus === "triggered")
          .sort((a, b) => a.stableOrdinal - b.stableOrdinal)
          .map((item) => item.explanation),
        conditions: (compatibility?.requirementResultManifest ?? [])
          .filter((item) => item.evaluationStatus === "satisfied_with_condition" || item.evaluationStatus === "uncertain")
          .sort((a, b) => a.stableOrdinal - b.stableOrdinal)
          .map((item) => item.explanation),
        acceptedAssumptionCount: compatibility?.acceptedAssumptionCount ?? 0,
        preliminaryAssumptionCount: compatibility?.preliminaryAssumptionCount ?? 0,
        missingDependencyCount: compatibility?.missingRequirementCount ?? 0,
        professionalReviewCount: compatibility?.professionalReviewCount ?? 0,
        freshnessState: staleByStrategy.get(score.strategyId) ?? "current",
        selectedByUser: input.userPreference?.strategyId === score.strategyId && input.userPreference.strategyVersion === score.strategyVersion,
        explanation: explanation ? projectStrategyExplanation(explanation, {
          presentationMode: input.mode,
          detailLevel: input.mode === "professional" ? "detailed" : "summary",
          locale: "en-US",
        }) : undefined,
        hash: score.deterministicScoreHash,
      };
    });
}

function buildDetail(row: StrategyRankedRowProjection, ranking?: StrategyRankingResult): StrategyDetailProjection {
  const strategy = resolveStrategyDefinition(row.strategyId, row.strategyVersion);
  const score = ranking?.rankedResults.find((result) => result.scoreResultId === row.scoreResultId);
  return {
    ...row,
    identity: {
      strategyId: strategy.strategyId,
      strategyVersion: strategy.semanticVersion,
      registryVersion: strategy.registryVersion,
      lifecycleStatus: strategy.lifecycleStatus,
      supportStatus: strategy.supportStatus,
      category: strategy.category,
    },
    dimensionScores: score?.categoryScores.map((item) => ({
      categoryId: item.categoryId,
      label: item.label,
      normalizedScore: item.normalizedScore,
      normalizedBasis: item.normalizedBasis,
      explanation: item.explanation,
    })) ?? [],
    weights: score?.weightBreakdown.map((item) => ({
      categoryId: item.categoryId,
      weightPercent: item.weightPercent,
      weightBasis: item.weightBasis,
      strategyAdjustmentBasis: item.strategyAdjustmentBasis,
      explanation: item.explanation,
    })) ?? [],
    weightedContributions: score?.scoreBreakdown.map((item) => ({ ...item })) ?? [],
    bindingConstraints: [...row.hardDisqualifiers, ...row.conditions],
    missingInformation: row.missingDependencyCount ? [`${row.missingDependencyCount} missing dependenc${row.missingDependencyCount === 1 ? "y" : "ies"}`] : [],
    staleInformation: row.freshnessState === "stale" ? ["A canonical reevaluation event marked this strategy result stale."] : [],
    conflicts: [],
    unavailableModules: [],
    materialChangeFactors: row.explanation?.sections.flatMap((section) => section.items.map((item) => item.text)).slice(0, 8) ?? [],
    underwritingReferences: score ? [score.underwritingRunId, score.snapshotId] : [],
    versionReferences: score ? Object.values(score.versionReferences).filter((value): value is string => typeof value === "string") : [],
  };
}

function buildOverview(input: StrategyPresentationInput, rows: StrategyRankedRowProjection[], staleEvents: StrategyStaleEventProjection[]): StrategyOverviewProjection {
  const topRankedViable = rows.find((row) => row.scoreEligibility === "scored" && (row.compatibilityStatus === "compatible" || row.compatibilityStatus === "compatible_with_conditions"));
  return {
    rankingId: input.ranking?.rankingResultId,
    rankingVersion: input.ranking?.version,
    rankingHash: input.ranking?.deterministicRankingHash,
    createdAt: input.ranking?.rankedResults[0]?.completedAt,
    snapshotId: input.ranking?.rankedResults[0]?.snapshotId,
    underwritingRunId: input.ranking?.rankedResults[0]?.underwritingRunId,
    freshnessState: staleEvents.some((event) => event.staleStatus === "stale") ? "stale" : input.ranking ? "current" : "none",
    candidateCount: input.ranking ? rows.length : null,
    compatibleCount: input.ranking ? countStatus(rows, "compatible") : null,
    compatibleWithConditionsCount: input.ranking ? countStatus(rows, "compatible_with_conditions") : null,
    uncertainCount: input.ranking ? countStatus(rows, "uncertain") : null,
    incompatibleCount: input.ranking ? countStatus(rows, "incompatible") : null,
    notEvaluatedCount: input.ranking ? countStatus(rows, "not_evaluated") : null,
    missingDependencyCount: input.ranking ? rows.reduce((sum, row) => sum + row.missingDependencyCount, 0) : null,
    professionalReviewCount: input.ranking ? rows.reduce((sum, row) => sum + row.professionalReviewCount, 0) : null,
    topRankedViable: topRankedViable ? {
      strategyId: topRankedViable.strategyId,
      strategyVersion: topRankedViable.strategyVersion,
      displayName: topRankedViable.displayName,
      rank: topRankedViable.rank,
    } : undefined,
    userSelected: input.userPreference,
    userSelectionMatchesSystemRank: input.userPreference && topRankedViable ? input.userPreference.strategyId === topRankedViable.strategyId && input.userPreference.strategyVersion === topRankedViable.strategyVersion : null,
    staleWarning: staleEvents.length ? "One or more canonical dependency changes may require reevaluation. Prior valid results remain visible." : undefined,
  };
}

function buildComparison(rows: StrategyRankedRowProjection[], selectedIds: string[] = []): StrategyComparisonProjection {
  const selected = (selectedIds.length ? selectedIds.map((id) => rows.find((row) => row.strategyId === id)).filter((row): row is StrategyRankedRowProjection => Boolean(row)) : rows)
    .slice(0, STRATEGY_COMPARISON_MAX_STRATEGIES);
  return {
    limit: STRATEGY_COMPARISON_MAX_STRATEGIES,
    selectedStrategyIds: selected.map((row) => row.strategyId),
    columns: selected,
    rows: [
      comparisonRow("compatibility", "Compatibility", selected, (row) => label(row.compatibilityStatus)),
      comparisonRow("score", "Canonical score", selected, (row) => row.totalScore === null ? "Unscored" : `${row.totalScore}/100`),
      comparisonRow("rank", "Canonical rank", selected, (row) => row.rank ? String(row.rank) : "Unavailable"),
      comparisonRow("confidence", "Evidence quality", selected, (row) => row.confidenceLabel),
      comparisonRow("disqualifiers", "Hard disqualifiers", selected, (row) => String(row.hardDisqualifierCount)),
      comparisonRow("missing", "Missing inputs", selected, (row) => String(row.missingDependencyCount)),
      comparisonRow("professional", "Professional reviews", selected, (row) => String(row.professionalReviewCount)),
      comparisonRow("freshness", "Freshness", selected, (row) => label(row.freshnessState)),
    ],
  };
}

function comparisonRow(rowId: string, labelText: string, rows: StrategyRankedRowProjection[], valueFor: (row: StrategyRankedRowProjection) => string): StrategyComparisonRowProjection {
  const values = rows.map((row) => ({ strategyId: row.strategyId, value: valueFor(row), state: comparisonState(row) }));
  const unique = new Set(values.map((item) => item.value));
  return {
    rowId,
    label: labelText,
    values: values.map((item) => ({ ...item, state: item.state === "different" && unique.size === 1 ? "same" : item.state })),
  };
}

function comparisonState(row: StrategyRankedRowProjection): StrategyComparisonRowProjection["values"][number]["state"] {
  if (row.freshnessState === "stale") return "stale";
  if (row.freshnessState === "historical") return "historical";
  if (row.compatibilityStatus === "incompatible") return "blocked";
  if (row.preliminaryAssumptionCount) return "preliminary";
  if (row.acceptedAssumptionCount) return "assumption_based";
  return "different";
}

function buildStaleEvents(events: StrategyReevaluationEvent[]): StrategyStaleEventProjection[] {
  return [...events]
    .sort((a, b) => b.triggerTimestamp.localeCompare(a.triggerTimestamp))
    .slice(0, 20)
    .map((event) => ({
      eventId: event.eventId,
      eventType: event.eventType,
      staleStatus: event.staleStatuses.find((item) => item.staleStatus !== "not_affected")?.staleStatus ?? "current",
      triggeredBy: event.triggeringDependency.dependencyType,
      affectedStrategies: event.affectedStrategyIds,
      affectedEngines: event.affectedEngineVersions,
      requiredScope: event.reevaluationScope,
      reason: event.staleReason,
      eventHash: event.eventHash,
      occurredAt: event.triggerTimestamp,
    }));
}

function stalenessByStrategy(events: StrategyReevaluationEvent[]) {
  const map = new Map<string, StrategyResultFreshnessState>();
  for (const event of events) {
    for (const status of event.staleStatuses) {
      if (status.staleStatus === "stale") map.set(status.strategyId, "stale");
      else if (status.staleStatus === "obsolete" || status.staleStatus === "superseded") map.set(status.strategyId, "historical");
    }
  }
  return map;
}

function countStatus(rows: StrategyRankedRowProjection[], status: StrategyCompatibilityStatus) {
  return rows.filter((row) => row.compatibilityStatus === status).length;
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

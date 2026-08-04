import type { PresentationMode } from "./presentationMode";
import {
  UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
  type UnderwritingPresentationModel,
} from "./underwritingPresentation";
import {
  UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
  UNDERWRITING_REPORT_CONTRACT_VERSION,
  type UnderwritingReportPayload,
} from "./underwritingReportContract";
import {
  STRATEGY_PRESENTATION_CONTRACT_VERSION,
  type StrategyPresentationModel,
  type StrategyUserPreferenceProjection,
} from "./strategyPresentation";

export const DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION = "decision-cockpit-read-projection-contract-v1";

export type DecisionCockpitFreshnessState =
  | "no_source_results"
  | "current"
  | "stale"
  | "historical"
  | "partial"
  | "blocked";

export type DecisionCockpitReadProjectionInput = {
  workspaceId?: string;
  dealId: string;
  dealName?: string;
  mode?: PresentationMode;
  property?: {
    propertyId?: string;
    displayName?: string;
    address?: string;
    propertyType?: string;
  };
  underwriting?: UnderwritingPresentationModel;
  strategy?: StrategyPresentationModel;
  intendedStrategy?: StrategyUserPreferenceProjection;
  report?: UnderwritingReportPayload;
  generatedAt?: string;
};

export type DecisionCockpitReadProjection = {
  contractVersion: typeof DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION;
  dealId: string;
  workspaceId?: string;
  dealName: string;
  mode: PresentationMode;
  generatedAt?: string;
  property: {
    propertyId?: string;
    displayName?: string;
    address?: string;
    propertyType?: string;
  };
  freshness: {
    state: DecisionCockpitFreshnessState;
    staleEventCount: number;
    reevaluationRequired: boolean;
    staleWarnings: string[];
  };
  underwriting: {
    contractVersion: typeof UNDERWRITING_PRESENTATION_CONTRACT_VERSION | null;
    available: boolean;
    readinessLabel?: string;
    isExecutable: boolean;
    missingRequiredInputCount: number;
    conflictedRequiredInputCount: number;
    provisionalRequiredInputCount: number;
    snapshotCount: number;
    coreOutputGroupCount: number;
    coreOutputCount: number;
    scenarioCount: number;
    sensitivityCount: number;
    summary: UnderwritingPresentationModel["summary"];
    outputs: UnderwritingPresentationModel["coreOutputGroups"];
    scenarios: UnderwritingPresentationModel["scenarios"];
    sensitivities: UnderwritingPresentationModel["sensitivities"];
  };
  strategy: {
    contractVersion: typeof STRATEGY_PRESENTATION_CONTRACT_VERSION | null;
    available: boolean;
    rankingId?: string;
    rankingHash?: string;
    rankingVersion?: string;
    rankingFreshness: StrategyPresentationModel["overview"]["freshnessState"];
    intendedStrategy?: StrategyUserPreferenceProjection;
    topRankedViable?: StrategyPresentationModel["overview"]["topRankedViable"];
    userSelectionMatchesSystemRank: boolean | null;
    rankedStrategies: StrategyPresentationModel["rankedStrategies"];
    selectedStrategy?: StrategyPresentationModel["selectedStrategy"];
    comparison: StrategyPresentationModel["comparison"];
    compatibility: {
      candidateCount: number | null;
      compatibleCount: number | null;
      compatibleWithConditionsCount: number | null;
      uncertainCount: number | null;
      incompatibleCount: number | null;
      notEvaluatedCount: number | null;
      missingDependencyCount: number | null;
    };
  };
  confidence: {
    primaryLabel?: string;
    strategyConfidenceLabels: Array<{
      strategyId: string;
      displayName: string;
      label: string;
    }>;
  };
  explanations: {
    selectedStrategy?: StrategyPresentationModel["selectedStrategy"]["explanation"];
    rankedStrategyExplanations: Array<{
      strategyId: string;
      displayName: string;
      explanation: NonNullable<StrategyPresentationModel["rankedStrategies"][number]["explanation"]>;
    }>;
  };
  assumptions: {
    count: number;
    items: string[];
  };
  provenance: {
    sourceCount: number;
    rows: UnderwritingPresentationModel["sourcesAndAssumptions"]["provenance"];
  };
  warnings: {
    underwriting: string[];
    sources: string[];
    strategy: string[];
    totalCount: number;
  };
  professionalReviewFlags: {
    count: number;
    strategyFlags: Array<{
      strategyId: string;
      displayName: string;
      count: number;
    }>;
  };
  report: {
    available: boolean;
    contractVersion: typeof UNDERWRITING_REPORT_CONTRACT_VERSION | null;
    registryVersion: typeof UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION | null;
    reportType?: UnderwritingReportPayload["contract"]["reportType"];
    contentHash?: string;
    sectionCount: number;
    issueCount: number;
    warningIssueCount: number;
    blockingIssueCount: number;
  };
  sourceBoundary: {
    consumesUnderwritingPresentation: boolean;
    consumesStrategyPresentation: boolean;
    consumesUnderwritingReport: boolean;
    recalculationProhibited: true;
    rankingMutationProhibited: true;
    recommendationMutationProhibited: true;
    persistenceProhibited: true;
    providerCallsProhibited: true;
  };
};

export function buildDecisionCockpitReadProjection(
  input: DecisionCockpitReadProjectionInput,
): DecisionCockpitReadProjection {
  const underwritingWarnings = [
    ...(input.underwriting?.readiness.warnings ?? []),
    ...(input.underwriting?.readiness.blockedReasons ?? []),
  ];
  const sourceWarnings = input.underwriting?.sourcesAndAssumptions.warnings ?? [];
  const strategyWarnings = [
    ...(input.strategy?.overview.staleWarning ? [input.strategy.overview.staleWarning] : []),
    ...(input.strategy?.rankedStrategies.flatMap((strategy) => strategy.weaknesses) ?? []),
  ];
  const professionalReviewFlags = (input.strategy?.rankedStrategies ?? [])
    .filter((strategy) => strategy.professionalReviewCount > 0)
    .map((strategy) => ({
      strategyId: strategy.strategyId,
      displayName: strategy.displayName,
      count: strategy.professionalReviewCount,
    }));

  return {
    contractVersion: DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION,
    dealId: input.dealId,
    workspaceId: input.workspaceId,
    dealName: input.dealName?.trim() || input.underwriting?.dealName || input.strategy?.dealName || "Deal",
    mode: input.mode ?? input.underwriting?.mode ?? input.strategy?.mode ?? "guided",
    generatedAt: input.generatedAt,
    property: { ...input.property },
    freshness: {
      state: resolveFreshness(input.underwriting, input.strategy, input.report),
      staleEventCount: input.strategy?.staleEvents.length ?? 0,
      reevaluationRequired: input.strategy?.overview.freshnessState === "stale",
      staleWarnings: [
        ...(input.strategy?.overview.staleWarning ? [input.strategy.overview.staleWarning] : []),
        ...(input.strategy?.staleEvents.map((event) => event.reason) ?? []),
      ],
    },
    underwriting: {
      contractVersion: input.underwriting?.contractVersion ?? null,
      available: Boolean(input.underwriting?.hasCanonicalUnderwriting),
      readinessLabel: input.underwriting?.readiness.label,
      isExecutable: Boolean(input.underwriting?.readiness.isExecutable),
      missingRequiredInputCount: input.underwriting?.readiness.missingRequiredInputCount ?? 0,
      conflictedRequiredInputCount: input.underwriting?.readiness.conflictedRequiredInputCount ?? 0,
      provisionalRequiredInputCount: input.underwriting?.readiness.provisionalRequiredInputCount ?? 0,
      snapshotCount: input.underwriting?.snapshots.length ?? 0,
      coreOutputGroupCount: input.underwriting?.coreOutputGroups.length ?? 0,
      coreOutputCount: input.underwriting?.coreOutputGroups.reduce((count, group) => count + group.outputs.length, 0) ?? 0,
      scenarioCount: input.underwriting?.scenarios.length ?? 0,
      sensitivityCount: input.underwriting?.sensitivities.length ?? 0,
      summary: input.underwriting?.summary ?? [],
      outputs: input.underwriting?.coreOutputGroups ?? [],
      scenarios: input.underwriting?.scenarios ?? [],
      sensitivities: input.underwriting?.sensitivities ?? [],
    },
    strategy: {
      contractVersion: input.strategy?.contractVersion ?? null,
      available: Boolean(input.strategy?.hasCanonicalStrategyResults),
      rankingId: input.strategy?.overview.rankingId,
      rankingHash: input.strategy?.overview.rankingHash,
      rankingVersion: input.strategy?.overview.rankingVersion,
      rankingFreshness: input.strategy?.overview.freshnessState ?? "none",
      intendedStrategy: input.intendedStrategy ?? input.strategy?.overview.userSelected ?? input.strategy?.userPreference,
      topRankedViable: input.strategy?.overview.topRankedViable,
      userSelectionMatchesSystemRank: input.strategy?.overview.userSelectionMatchesSystemRank ?? null,
      rankedStrategies: input.strategy?.rankedStrategies ?? [],
      selectedStrategy: input.strategy?.selectedStrategy,
      comparison: input.strategy?.comparison ?? { limit: 4, selectedStrategyIds: [], rows: [], columns: [] },
      compatibility: {
        candidateCount: input.strategy?.overview.candidateCount ?? null,
        compatibleCount: input.strategy?.overview.compatibleCount ?? null,
        compatibleWithConditionsCount: input.strategy?.overview.compatibleWithConditionsCount ?? null,
        uncertainCount: input.strategy?.overview.uncertainCount ?? null,
        incompatibleCount: input.strategy?.overview.incompatibleCount ?? null,
        notEvaluatedCount: input.strategy?.overview.notEvaluatedCount ?? null,
        missingDependencyCount: input.strategy?.overview.missingDependencyCount ?? null,
      },
    },
    confidence: {
      primaryLabel: input.strategy?.selectedStrategy?.confidenceLabel ?? input.strategy?.rankedStrategies[0]?.confidenceLabel,
      strategyConfidenceLabels: (input.strategy?.rankedStrategies ?? []).map((strategy) => ({
        strategyId: strategy.strategyId,
        displayName: strategy.displayName,
        label: strategy.confidenceLabel,
      })),
    },
    explanations: {
      selectedStrategy: input.strategy?.selectedStrategy?.explanation,
      rankedStrategyExplanations: (input.strategy?.rankedStrategies ?? [])
        .filter((strategy): strategy is typeof strategy & { explanation: NonNullable<typeof strategy.explanation> } => Boolean(strategy.explanation))
        .map((strategy) => ({
          strategyId: strategy.strategyId,
          displayName: strategy.displayName,
          explanation: strategy.explanation,
        })),
    },
    assumptions: {
      count: input.underwriting?.sourcesAndAssumptions.assumptionCount ?? 0,
      items: input.underwriting?.sourcesAndAssumptions.assumptions ?? [],
    },
    provenance: {
      sourceCount: input.underwriting?.sourcesAndAssumptions.sourceCount ?? 0,
      rows: input.underwriting?.sourcesAndAssumptions.provenance ?? [],
    },
    warnings: {
      underwriting: underwritingWarnings,
      sources: sourceWarnings,
      strategy: strategyWarnings,
      totalCount: underwritingWarnings.length + sourceWarnings.length + strategyWarnings.length,
    },
    professionalReviewFlags: {
      count: professionalReviewFlags.reduce((sum, flag) => sum + flag.count, 0),
      strategyFlags: professionalReviewFlags,
    },
    report: {
      available: Boolean(input.report),
      contractVersion: input.report?.contract.contractVersion ?? null,
      registryVersion: input.report?.contract.registryVersion ?? null,
      reportType: input.report?.contract.reportType,
      contentHash: input.report?.contentHash,
      sectionCount: input.report?.sections.length ?? 0,
      issueCount: input.report?.status.issueCount ?? 0,
      warningIssueCount: input.report?.status.warningIssueCount ?? 0,
      blockingIssueCount: input.report?.status.blockingIssueCount ?? 0,
    },
    sourceBoundary: {
      consumesUnderwritingPresentation: Boolean(input.underwriting),
      consumesStrategyPresentation: Boolean(input.strategy),
      consumesUnderwritingReport: Boolean(input.report),
      recalculationProhibited: true,
      rankingMutationProhibited: true,
      recommendationMutationProhibited: true,
      persistenceProhibited: true,
      providerCallsProhibited: true,
    },
  };
}

function resolveFreshness(
  underwriting?: UnderwritingPresentationModel,
  strategy?: StrategyPresentationModel,
  report?: UnderwritingReportPayload,
): DecisionCockpitFreshnessState {
  if (!underwriting && !strategy && !report) return "no_source_results";
  if (strategy?.overview.freshnessState === "stale" || strategy?.staleEvents.some((event) => event.staleStatus === "stale")) return "stale";
  if (strategy?.overview.freshnessState === "historical" || strategy?.history.some((item) => item.freshnessState === "historical")) return "historical";
  if (underwriting?.readiness.blockedReasons.length || report?.status.blockingIssueCount) return "blocked";
  if (!underwriting?.hasCanonicalUnderwriting || (strategy && !strategy.hasCanonicalStrategyResults)) return "partial";
  return "current";
}

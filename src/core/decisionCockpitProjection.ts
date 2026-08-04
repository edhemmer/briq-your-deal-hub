import type { PresentationMode } from "./presentationMode";
import type { FormulaId } from "./formulaRegistry";
import {
  UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
  type UnderwritingPresentationOutputRow,
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
export const DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION = "decision-cockpit-recommendation-contract-v1";
export const DECISION_COCKPIT_KEY_METRIC_REGISTRY_VERSION = "decision-cockpit-key-metric-registry-v1";
export const DECISION_COCKPIT_PRIMARY_METRIC_LIMIT = 6;

export type DecisionCockpitFreshnessState =
  | "no_source_results"
  | "current"
  | "stale"
  | "historical"
  | "partial"
  | "blocked";

export type DecisionCockpitRecommendationState =
  | "research"
  | "visit"
  | "monitor"
  | "negotiate"
  | "prepare_offer"
  | "submit_offer"
  | "proceed_with_conditions"
  | "hold"
  | "pass"
  | "acquire"
  | "refinance"
  | "sell";

export type DecisionCockpitRecommendationStatus =
  | "current"
  | "current_with_warnings"
  | "processing"
  | "incomplete"
  | "blocked"
  | "stale"
  | "conflicted"
  | "partial_module_availability"
  | "failed_with_prior_valid"
  | "failed_without_prior_valid"
  | "unavailable"
  | "historical"
  | "permission_restricted"
  | "archived_or_closed";

export type DecisionCockpitActionType =
  | "review_underwriting"
  | "review_strategy"
  | "record_decision"
  | "schedule_visit"
  | "monitor"
  | "prepare_offer"
  | "submit_offer"
  | "open_existing_workflow";

export type DecisionCockpitWorkflowAvailability =
  | "available"
  | "unavailable_module"
  | "pending"
  | "stale"
  | "failed"
  | "permission_restricted"
  | "not_applicable";

export type DecisionCockpitUserDecisionType =
  | "continue_research"
  | "schedule_visit"
  | "monitor"
  | "negotiate"
  | "prepare_offer"
  | "submit_offer"
  | "proceed_with_conditions"
  | "hold"
  | "pass"
  | "acquire"
  | "refinance"
  | "sell";

export type DecisionCockpitUserDecisionStatus = "current" | "historical" | "superseded" | "withdrawn";

export type DecisionCockpitRecommendationRecord = {
  recommendationId: string;
  recommendationState: DecisionCockpitRecommendationState;
  recommendationStatus: DecisionCockpitRecommendationStatus;
  recommendedAction?: DecisionCockpitRecommendedAction;
  workspaceId?: string;
  dealId: string;
  propertyId?: string;
  snapshotId?: string;
  underwritingRunId?: string;
  rankingId?: string;
  strongestStrategyResultId?: string;
  selectedStrategyId?: string;
  selectedStrategyVersion?: string;
  userDecisionId?: string;
  confidenceState?: string;
  freshnessState: DecisionCockpitFreshnessState | DecisionCockpitRecommendationStatus;
  asOf?: string;
  reasonIds: string[];
  bindingConstraintIds: string[];
  hardDisqualifierIds: string[];
  missingInformationRefs: string[];
  professionalReviewRefs: string[];
  provenanceRefs: string[];
  engineVersion?: string;
  registryVersion?: string;
  deterministicHash?: string;
  stableOrdinal?: number;
};

export type DecisionCockpitRecommendedAction = {
  actionId: string;
  actionType: DecisionCockpitActionType;
  actionState: "active" | "unavailable" | "blocked" | "permission_restricted";
  displayLabel: string;
  reasonIds: string[];
  governingStrategyId?: string;
  governingRecommendationId?: string;
  requiredPermission: string;
  connectedWorkflow: string;
  workflowAvailability: DecisionCockpitWorkflowAvailability;
  blockingReason?: string;
  stableOrdinal: number;
  deterministicHash?: string;
};

export type DecisionCockpitUserDecisionRecord = {
  decisionId: string;
  decisionType: DecisionCockpitUserDecisionType;
  decisionStatus: DecisionCockpitUserDecisionStatus;
  selectedStrategyId?: string;
  selectedStrategyVersion?: string;
  relatedRecommendationId?: string;
  relatedSnapshotId?: string;
  relatedRunId?: string;
  relatedRankingId?: string;
  rationaleSummary?: string;
  decidedAt?: string;
  actorId?: string;
  supersededDecisionId?: string;
  version: string;
};

export type DecisionCockpitModuleAvailability = {
  moduleId:
    | "MarketIQ"
    | "FinanceIQ"
    | "GovernanceIQ"
    | "ContractIQ"
    | "OfferIQ"
    | "visit_media"
    | "inspection"
    | "appraisal";
  status: DecisionCockpitWorkflowAvailability;
  reason?: string;
};

export type DecisionCockpitAuthorization = {
  canReadCockpit: boolean;
  canReadRecommendation: boolean;
  canReadMetrics: boolean;
  canReadUserDecision: boolean;
  reason?: string;
};

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
  recommendation?: DecisionCockpitRecommendationRecord;
  priorValidRecommendation?: DecisionCockpitRecommendationRecord;
  userDecision?: DecisionCockpitUserDecisionRecord;
  activeScenarioId?: string;
  moduleAvailability?: DecisionCockpitModuleAvailability[];
  authorization?: DecisionCockpitAuthorization;
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
  recommendation: {
    contractVersion: typeof DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION;
    available: boolean;
    recommendationId?: string;
    deterministicRecommendationId: string;
    state: DecisionCockpitRecommendationState | "unavailable";
    status: DecisionCockpitRecommendationStatus;
    displayLabel: string;
    confidenceState?: string;
    freshnessState: DecisionCockpitRecommendationRecord["freshnessState"] | "unavailable";
    asOf?: string;
    sourceIdentity: {
      snapshotId?: string;
      underwritingRunId?: string;
      rankingId?: string;
      strongestStrategyResultId?: string;
      selectedStrategyId?: string;
      selectedStrategyVersion?: string;
      userDecisionId?: string;
      priorRecommendationId?: string;
    };
    priorValid?: {
      recommendationId: string;
      state: DecisionCockpitRecommendationState;
      status: DecisionCockpitRecommendationStatus;
      asOf?: string;
      label: string;
      deterministicHash: string;
    };
    deterministicHash: string;
  };
  recommendedAction?: DecisionCockpitRecommendedAction;
  rationale: {
    manifestHash: string;
    reasons: DecisionCockpitRationaleReference[];
  };
  strongestSystemRankedStrategy?: {
    strategyId: string;
    strategyVersion: string;
    displayName: string;
    scoreResultId: string;
    rank: number | null;
    compatibilityStatus: StrategyPresentationModel["rankedStrategies"][number]["compatibilityStatus"];
    totalScore: number | null;
    confidenceLabel: string;
    hardDisqualifierCount: number;
    conditions: string[];
    acceptedAssumptionCount: number;
    preliminaryAssumptionCount: number;
    freshnessState: StrategyPresentationModel["rankedStrategies"][number]["freshnessState"];
    rankingId?: string;
    resultHash: string;
    explanationResultId?: string;
  };
  userDecision: {
    available: boolean;
    record?: DecisionCockpitUserDecisionRecord;
    relationToRecommendation: "none" | "matches_recommendation" | "differs_from_recommendation";
    relationToStrongestStrategy: "none" | "matches_strongest_strategy" | "differs_from_strongest_strategy";
  };
  keyMetrics: {
    registryVersion: typeof DECISION_COCKPIT_KEY_METRIC_REGISTRY_VERSION;
    primaryLimit: typeof DECISION_COCKPIT_PRIMARY_METRIC_LIMIT;
    snapshotId?: string;
    underwritingRunId?: string;
    scenarioId?: string;
    selectionHash: string;
    metrics: DecisionCockpitKeyMetricProjection[];
    unavailable: DecisionCockpitUnavailableMetric[];
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
  partialModules: {
    materialUnavailableCount: number;
    modules: DecisionCockpitModuleAvailability[];
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
    recommendationEngineNotImplementedHere: true;
    metricSelectionOnly: true;
  };
};

export type DecisionCockpitRationaleReference = {
  reasonId: string;
  category:
    | "recommendation_record"
    | "strongest_strategy"
    | "compatibility"
    | "hard_disqualifier"
    | "binding_constraint"
    | "key_metric"
    | "assumption"
    | "missing_information"
    | "professional_review"
    | "stale_state"
    | "prior_valid";
  sourceType: string;
  sourceId: string;
  sourceVersion?: string;
  stableOrdinal: number;
};

export type DecisionCockpitMetricId =
  | "cash_required"
  | "loan_amount"
  | "noi"
  | "annual_cash_flow"
  | "cap_rate"
  | "cash_on_cash"
  | "dscr"
  | "ltv";

export type DecisionCockpitMetricCategory = "acquisition" | "income" | "cash_flow" | "return" | "coverage" | "leverage";

export type DecisionCockpitKeyMetricProjection = {
  metricId: DecisionCockpitMetricId;
  formulaId: FormulaId;
  formulaVersion: string;
  displayName: string;
  category: DecisionCockpitMetricCategory;
  canonicalResultReference: string;
  displayValue: string;
  dataType: "currency" | "percentage" | "ratio" | "number";
  unit?: string;
  currency?: string;
  period?: string;
  scenarioId?: string;
  snapshotId?: string;
  underwritingRunId?: string;
  resultStatus: string;
  confidenceState: string;
  assumptionIndicator: boolean;
  preliminaryIndicator: boolean;
  warningIndicator: boolean;
  blockedOrUnavailableReason?: string;
  freshnessState: DecisionCockpitFreshnessState;
  asOf?: string;
  lineageReference: {
    formulaId: FormulaId;
    formulaVersion: string;
    formulaRegistryVersion: string;
    technicalReferences: string[];
  };
  provenanceReference: {
    provenanceCount: number;
  };
  stableOrdinal: number;
  resultHash: string;
  projectionHash: string;
};

export type DecisionCockpitUnavailableMetric = {
  metricId: DecisionCockpitMetricId;
  formulaId: FormulaId;
  displayName: string;
  reason: "formula_not_in_active_outputs" | "status_unavailable" | "permission_restricted";
  stableOrdinal: number;
};

type KeyMetricDefinition = {
  metricId: DecisionCockpitMetricId;
  formulaId: FormulaId;
  displayName: string;
  category: DecisionCockpitMetricCategory;
  dataType: DecisionCockpitKeyMetricProjection["dataType"];
  stableOrdinal: number;
};

export const DECISION_COCKPIT_KEY_METRIC_REGISTRY: readonly KeyMetricDefinition[] = [
  metric("cash_required", "down_payment_amount", "Cash required", "acquisition", "currency", 10),
  metric("loan_amount", "loan_amount", "Loan amount", "acquisition", "currency", 20),
  metric("noi", "net_operating_income", "NOI", "income", "currency", 30),
  metric("annual_cash_flow", "pre_tax_cash_flow", "Annual cash flow", "cash_flow", "currency", 40),
  metric("cap_rate", "capitalization_rate", "Cap rate", "return", "percentage", 50),
  metric("cash_on_cash", "cash_on_cash_return", "Cash-on-cash", "return", "percentage", 60),
  metric("dscr", "debt_service_coverage_ratio", "DSCR", "coverage", "ratio", 70),
  metric("ltv", "loan_to_value_ratio", "LTV", "leverage", "percentage", 80),
] as const;

export function buildDecisionCockpitReadProjection(
  input: DecisionCockpitReadProjectionInput,
): DecisionCockpitReadProjection {
  const authorization = input.authorization ?? {
    canReadCockpit: true,
    canReadRecommendation: true,
    canReadMetrics: true,
    canReadUserDecision: true,
  };
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
  const strongestSystemRankedStrategy = selectStrongestSystemRankedStrategy(input.strategy);
  const recommendation = buildRecommendationProjection(input, authorization, strongestSystemRankedStrategy);
  const rationale = buildRationaleProjection(input, recommendation, strongestSystemRankedStrategy, authorization);
  const keyMetrics = buildKeyMetricsProjection(input, authorization);
  const userDecision = buildUserDecisionProjection(input.userDecision, recommendation, strongestSystemRankedStrategy, authorization);
  const moduleAvailability = input.moduleAvailability ?? [];

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
    recommendation,
    recommendedAction: recommendation.available
      && input.recommendation?.recommendedAction?.actionState === "active"
      && input.recommendation.recommendedAction.workflowAvailability === "available"
      ? input.recommendation.recommendedAction
      : undefined,
    rationale,
    strongestSystemRankedStrategy,
    userDecision,
    keyMetrics,
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
    partialModules: {
      materialUnavailableCount: moduleAvailability.filter((module) => module.status === "unavailable_module" || module.status === "failed" || module.status === "permission_restricted").length,
      modules: moduleAvailability,
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
      recommendationEngineNotImplementedHere: true,
      metricSelectionOnly: true,
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

function buildRecommendationProjection(
  input: DecisionCockpitReadProjectionInput,
  authorization: DecisionCockpitAuthorization,
  strongestSystemRankedStrategy: DecisionCockpitReadProjection["strongestSystemRankedStrategy"],
): DecisionCockpitReadProjection["recommendation"] {
  if (!authorization.canReadCockpit || !authorization.canReadRecommendation) {
    const hash = stableHash({ dealId: input.dealId, status: "permission_restricted", reason: authorization.reason });
    return {
      contractVersion: DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION,
      available: false,
      deterministicRecommendationId: `permission:${input.dealId}`,
      state: "unavailable",
      status: "permission_restricted",
      displayLabel: "Permission restricted",
      freshnessState: "unavailable",
      sourceIdentity: {},
      deterministicHash: hash,
    };
  }

  const current = input.recommendation;
  const status = current?.recommendationStatus ?? inferUnavailableRecommendationStatus(input);
  const state = current?.recommendationState ?? "unavailable";
  const prior = input.priorValidRecommendation;
  const deterministicRecommendationId = current?.recommendationId
    ?? stableHash({
      contractVersion: DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION,
      dealId: input.dealId,
      status,
      snapshotId: input.underwriting?.snapshots[0]?.snapshotId,
      rankingId: input.strategy?.overview.rankingId,
    });
  const hash = current?.deterministicHash ?? stableHash({
    contractVersion: DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION,
    recommendationId: current?.recommendationId,
    state,
    status,
    sourceIdentity: {
      snapshotId: current?.snapshotId,
      underwritingRunId: current?.underwritingRunId,
      rankingId: current?.rankingId,
      strongestStrategyResultId: current?.strongestStrategyResultId ?? strongestSystemRankedStrategy?.scoreResultId,
      selectedStrategyId: current?.selectedStrategyId,
      selectedStrategyVersion: current?.selectedStrategyVersion,
      userDecisionId: current?.userDecisionId,
    },
    reasonIds: current?.reasonIds ?? [],
    bindingConstraintIds: current?.bindingConstraintIds ?? [],
    hardDisqualifierIds: current?.hardDisqualifierIds ?? [],
    confidenceState: current?.confidenceState,
    freshnessState: current?.freshnessState,
    priorRecommendationId: prior?.recommendationId,
    engineVersion: current?.engineVersion,
    registryVersion: current?.registryVersion,
  });

  return {
    contractVersion: DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION,
    available: Boolean(current),
    recommendationId: current?.recommendationId,
    deterministicRecommendationId,
    state,
    status,
    displayLabel: current ? label(current.recommendationState) : unavailableRecommendationLabel(status),
    confidenceState: current?.confidenceState,
    freshnessState: current?.freshnessState ?? "unavailable",
    asOf: current?.asOf,
    sourceIdentity: {
      snapshotId: current?.snapshotId,
      underwritingRunId: current?.underwritingRunId,
      rankingId: current?.rankingId,
      strongestStrategyResultId: current?.strongestStrategyResultId ?? strongestSystemRankedStrategy?.scoreResultId,
      selectedStrategyId: current?.selectedStrategyId,
      selectedStrategyVersion: current?.selectedStrategyVersion,
      userDecisionId: current?.userDecisionId,
      priorRecommendationId: prior?.recommendationId,
    },
    priorValid: prior ? {
      recommendationId: prior.recommendationId,
      state: prior.recommendationState,
      status: prior.recommendationStatus,
      asOf: prior.asOf,
      label: label(prior.recommendationState),
      deterministicHash: prior.deterministicHash ?? stableHash(prior),
    } : undefined,
    deterministicHash: hash,
  };
}

function buildRationaleProjection(
  input: DecisionCockpitReadProjectionInput,
  recommendation: DecisionCockpitReadProjection["recommendation"],
  strongestSystemRankedStrategy: DecisionCockpitReadProjection["strongestSystemRankedStrategy"],
  authorization: DecisionCockpitAuthorization,
): DecisionCockpitReadProjection["rationale"] {
  if (!authorization.canReadRecommendation) return { manifestHash: stableHash({ denied: input.dealId }), reasons: [] };
  const current = input.recommendation;
  const reasons: DecisionCockpitRationaleReference[] = [];
  let ordinal = 1;
  if (current) {
    reasons.push(...current.reasonIds.map((reasonId) => ({
      reasonId,
      category: "recommendation_record" as const,
      sourceType: "recommendation",
      sourceId: current.recommendationId,
      sourceVersion: current.registryVersion,
      stableOrdinal: ordinal++,
    })));
    reasons.push(...current.bindingConstraintIds.map((reasonId) => ({
      reasonId,
      category: "binding_constraint" as const,
      sourceType: "recommendation",
      sourceId: current.recommendationId,
      sourceVersion: current.registryVersion,
      stableOrdinal: ordinal++,
    })));
    reasons.push(...current.hardDisqualifierIds.map((reasonId) => ({
      reasonId,
      category: "hard_disqualifier" as const,
      sourceType: "recommendation",
      sourceId: current.recommendationId,
      sourceVersion: current.registryVersion,
      stableOrdinal: ordinal++,
    })));
    reasons.push(...current.missingInformationRefs.map((reasonId) => ({
      reasonId,
      category: "missing_information" as const,
      sourceType: "recommendation",
      sourceId: current.recommendationId,
      sourceVersion: current.registryVersion,
      stableOrdinal: ordinal++,
    })));
    reasons.push(...current.professionalReviewRefs.map((reasonId) => ({
      reasonId,
      category: "professional_review" as const,
      sourceType: "recommendation",
      sourceId: current.recommendationId,
      sourceVersion: current.registryVersion,
      stableOrdinal: ordinal++,
    })));
  }
  if (strongestSystemRankedStrategy) {
    reasons.push({
      reasonId: `strongest_strategy:${strongestSystemRankedStrategy.scoreResultId}`,
      category: "strongest_strategy",
      sourceType: "strategy_score_result",
      sourceId: strongestSystemRankedStrategy.scoreResultId,
      sourceVersion: strongestSystemRankedStrategy.strategyVersion,
      stableOrdinal: ordinal++,
    });
  }
  if (recommendation.priorValid) {
    reasons.push({
      reasonId: `prior_valid:${recommendation.priorValid.recommendationId}`,
      category: "prior_valid",
      sourceType: "recommendation",
      sourceId: recommendation.priorValid.recommendationId,
      stableOrdinal: ordinal++,
    });
  }
  const metricReasons = buildKeyMetricsProjection(input, authorization).metrics.map((metric) => ({
    reasonId: `metric:${metric.metricId}`,
    category: "key_metric" as const,
    sourceType: "underwriting_result",
    sourceId: metric.canonicalResultReference,
    sourceVersion: metric.formulaVersion,
    stableOrdinal: ordinal++,
  }));
  reasons.push(...metricReasons);
  return {
    manifestHash: stableHash(reasons.map((reason) => ({
      reasonId: reason.reasonId,
      category: reason.category,
      sourceType: reason.sourceType,
      sourceId: reason.sourceId,
      sourceVersion: reason.sourceVersion,
      stableOrdinal: reason.stableOrdinal,
    }))),
    reasons,
  };
}

function buildUserDecisionProjection(
  decision: DecisionCockpitUserDecisionRecord | undefined,
  recommendation: DecisionCockpitReadProjection["recommendation"],
  strongestSystemRankedStrategy: DecisionCockpitReadProjection["strongestSystemRankedStrategy"],
  authorization: DecisionCockpitAuthorization,
): DecisionCockpitReadProjection["userDecision"] {
  if (!authorization.canReadUserDecision) return { available: false, relationToRecommendation: "none", relationToStrongestStrategy: "none" };
  return {
    available: Boolean(decision),
    record: decision,
    relationToRecommendation: !decision || !recommendation.recommendationId
      ? "none"
      : decision.relatedRecommendationId
        ? decision.relatedRecommendationId === recommendation.recommendationId
          ? "matches_recommendation"
          : "differs_from_recommendation"
        : decision.decisionType === recommendation.state
        ? "matches_recommendation"
        : "differs_from_recommendation",
    relationToStrongestStrategy: !decision || !strongestSystemRankedStrategy
      ? "none"
      : decision.selectedStrategyId === strongestSystemRankedStrategy.strategyId && decision.selectedStrategyVersion === strongestSystemRankedStrategy.strategyVersion
        ? "matches_strongest_strategy"
        : "differs_from_strongest_strategy",
  };
}

function buildKeyMetricsProjection(
  input: DecisionCockpitReadProjectionInput,
  authorization: DecisionCockpitAuthorization,
): DecisionCockpitReadProjection["keyMetrics"] {
  const snapshotId = input.underwriting?.snapshots[0]?.snapshotId ?? input.report?.reconciliation.snapshotId;
  const underwritingRunId = input.report?.reconciliation.runId ?? input.strategy?.overview.underwritingRunId;
  const freshnessState = resolveFreshness(input.underwriting, input.strategy, input.report);
  if (!authorization.canReadMetrics) {
    return {
      registryVersion: DECISION_COCKPIT_KEY_METRIC_REGISTRY_VERSION,
      primaryLimit: DECISION_COCKPIT_PRIMARY_METRIC_LIMIT,
      snapshotId,
      underwritingRunId,
      scenarioId: input.activeScenarioId,
      selectionHash: stableHash({ permission: "restricted", dealId: input.dealId }),
      metrics: [],
      unavailable: DECISION_COCKPIT_KEY_METRIC_REGISTRY.slice(0, DECISION_COCKPIT_PRIMARY_METRIC_LIMIT).map((definition) => ({
        metricId: definition.metricId,
        formulaId: definition.formulaId,
        displayName: definition.displayName,
        reason: "permission_restricted",
        stableOrdinal: definition.stableOrdinal,
      })),
    };
  }

  const rowsByFormulaId = new Map<FormulaId, UnderwritingPresentationOutputRow>();
  for (const row of input.underwriting?.coreOutputGroups.flatMap((group) => group.outputs) ?? []) {
    if (!rowsByFormulaId.has(row.formulaId)) rowsByFormulaId.set(row.formulaId, row);
  }

  const metrics: DecisionCockpitKeyMetricProjection[] = [];
  const unavailable: DecisionCockpitUnavailableMetric[] = [];
  for (const definition of DECISION_COCKPIT_KEY_METRIC_REGISTRY) {
    if (metrics.length >= DECISION_COCKPIT_PRIMARY_METRIC_LIMIT) break;
    const row = rowsByFormulaId.get(definition.formulaId);
    if (!row) {
      unavailable.push({
        metricId: definition.metricId,
        formulaId: definition.formulaId,
        displayName: definition.displayName,
        reason: "formula_not_in_active_outputs",
        stableOrdinal: definition.stableOrdinal,
      });
      continue;
    }
    const blockedOrUnavailableReason = metricUnavailableReason(row);
    const resultHash = canonicalResultHash(row);
    const metricProjection = {
      metricId: definition.metricId,
      formulaId: row.formulaId,
      formulaVersion: row.formulaVersion,
      displayName: definition.displayName,
      category: definition.category,
      canonicalResultReference: resultHash,
      displayValue: row.value,
      dataType: definition.dataType,
      unit: row.unit,
      currency: row.unit === "Currency" ? input.report?.identity.displayCurrency : undefined,
      period: row.period,
      scenarioId: input.activeScenarioId,
      snapshotId,
      underwritingRunId,
      resultStatus: row.status,
      confidenceState: row.assumptions.length > 0 ? "accepted_assumptions" : "confirmed_inputs",
      assumptionIndicator: row.assumptions.length > 0,
      preliminaryIndicator: row.status.toLowerCase().includes("preliminary"),
      warningIndicator: row.warnings.length > 0,
      blockedOrUnavailableReason,
      freshnessState,
      asOf: input.report?.identity.requestedAt ?? input.strategy?.overview.createdAt,
      lineageReference: {
        formulaId: row.formulaId,
        formulaVersion: row.formulaVersion,
        formulaRegistryVersion: row.formulaRegistryVersion,
        technicalReferences: row.technicalReferences,
      },
      provenanceReference: {
        provenanceCount: row.provenanceCount,
      },
      stableOrdinal: definition.stableOrdinal,
      resultHash,
      projectionHash: "",
    } satisfies Omit<DecisionCockpitKeyMetricProjection, "projectionHash"> & { projectionHash: string };
    metricProjection.projectionHash = stableHash({
      metricId: metricProjection.metricId,
      formulaId: metricProjection.formulaId,
      formulaVersion: metricProjection.formulaVersion,
      canonicalResultReference: metricProjection.canonicalResultReference,
      displayValue: metricProjection.displayValue,
      unit: metricProjection.unit,
      currency: metricProjection.currency,
      period: metricProjection.period,
      scenarioId: metricProjection.scenarioId,
      snapshotId: metricProjection.snapshotId,
      underwritingRunId: metricProjection.underwritingRunId,
      resultStatus: metricProjection.resultStatus,
      freshnessState: metricProjection.freshnessState,
      stableOrdinal: metricProjection.stableOrdinal,
    });
    metrics.push(metricProjection);
  }

  return {
    registryVersion: DECISION_COCKPIT_KEY_METRIC_REGISTRY_VERSION,
    primaryLimit: DECISION_COCKPIT_PRIMARY_METRIC_LIMIT,
    snapshotId,
    underwritingRunId,
    scenarioId: input.activeScenarioId,
    selectionHash: stableHash({
      registryVersion: DECISION_COCKPIT_KEY_METRIC_REGISTRY_VERSION,
      snapshotId,
      underwritingRunId,
      scenarioId: input.activeScenarioId,
      metrics: metrics.map((metric) => ({
        metricId: metric.metricId,
        resultHash: metric.resultHash,
        projectionHash: metric.projectionHash,
        stableOrdinal: metric.stableOrdinal,
      })),
    }),
    metrics,
    unavailable,
  };
}

function selectStrongestSystemRankedStrategy(strategy?: StrategyPresentationModel): DecisionCockpitReadProjection["strongestSystemRankedStrategy"] {
  const row = strategy?.rankedStrategies.find((item) => item.scoreEligibility === "scored" && (item.compatibilityStatus === "compatible" || item.compatibilityStatus === "compatible_with_conditions"));
  if (!row) return undefined;
  return {
    strategyId: row.strategyId,
    strategyVersion: row.strategyVersion,
    displayName: row.displayName,
    scoreResultId: row.scoreResultId,
    rank: row.rank,
    compatibilityStatus: row.compatibilityStatus,
    totalScore: row.totalScore,
    confidenceLabel: row.confidenceLabel,
    hardDisqualifierCount: row.hardDisqualifierCount,
    conditions: row.conditions,
    acceptedAssumptionCount: row.acceptedAssumptionCount,
    preliminaryAssumptionCount: row.preliminaryAssumptionCount,
    freshnessState: row.freshnessState,
    rankingId: strategy?.overview.rankingId,
    resultHash: row.hash,
    explanationResultId: row.explanation?.explanationResultId,
  };
}

function inferUnavailableRecommendationStatus(input: DecisionCockpitReadProjectionInput): DecisionCockpitRecommendationStatus {
  if (input.authorization && (!input.authorization.canReadCockpit || !input.authorization.canReadRecommendation)) return "permission_restricted";
  if (input.strategy?.overview.freshnessState === "stale") return "stale";
  if (input.underwriting?.readiness.blockedReasons.length) return "blocked";
  if (input.underwriting?.readiness.conflictedRequiredInputCount) return "conflicted";
  if (input.underwriting && !input.underwriting.readiness.isExecutable) return "incomplete";
  if (input.strategy && !input.strategy.hasCanonicalStrategyResults) return "partial_module_availability";
  return "unavailable";
}

function metricUnavailableReason(row: UnderwritingPresentationOutputRow) {
  const normalizedStatus = row.status.toLowerCase();
  if (normalizedStatus === "calculated") return undefined;
  return row.errors[0] ?? row.warnings[0] ?? `Metric status is ${row.status}.`;
}

function canonicalResultHash(row: UnderwritingPresentationOutputRow) {
  const explicit = row.technicalReferences.find((reference) => reference.startsWith("hash:"));
  if (explicit) return explicit.slice("hash:".length);
  return stableHash({
    formulaId: row.formulaId,
    formulaVersion: row.formulaVersion,
    formulaRegistryVersion: row.formulaRegistryVersion,
    value: row.value,
    status: row.status,
    unit: row.unit,
    period: row.period,
    technicalReferences: row.technicalReferences,
    stableOrdinal: row.stableOrdinal,
  });
}

function unavailableRecommendationLabel(status: DecisionCockpitRecommendationStatus) {
  if (status === "incomplete") return "Recommendation unavailable until required inputs are complete";
  if (status === "blocked") return "Recommendation blocked by required verification";
  if (status === "stale") return "Recommendation stale";
  if (status === "conflicted") return "Recommendation blocked by conflicting information";
  if (status === "permission_restricted") return "Permission restricted";
  return "No canonical recommendation available";
}

function metric(
  metricId: DecisionCockpitMetricId,
  formulaId: FormulaId,
  displayName: string,
  category: DecisionCockpitMetricCategory,
  dataType: DecisionCockpitKeyMetricProjection["dataType"],
  stableOrdinal: number,
): KeyMetricDefinition {
  return { metricId, formulaId, displayName, category, dataType, stableOrdinal };
}

function stableHash(value: unknown): string {
  let hash = 2166136261;
  const payload = stableStringify(value);
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `dc_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
}

function label(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

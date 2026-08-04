import type { PresentationMode } from "./presentationMode";
import type { FormulaId } from "./formulaRegistry";
import {
  UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
  type UnderwritingPresentationInputRow,
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
export const DECISION_COCKPIT_RISK_PANEL_CONTRACT_VERSION = "decision-cockpit-risk-panel-contract-v1";
export const DECISION_COCKPIT_CONFIDENCE_PANEL_CONTRACT_VERSION = "decision-cockpit-confidence-panel-contract-v1";
export const DECISION_COCKPIT_MISSING_INPUT_PANEL_CONTRACT_VERSION = "decision-cockpit-missing-input-panel-contract-v1";
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

export type DecisionCockpitPanelState =
  | "current"
  | "stale"
  | "processing"
  | "conflicted"
  | "partial"
  | "failed"
  | "unavailable"
  | "permission_restricted";

export type DecisionCockpitRiskCategory =
  | "hard_disqualifier"
  | "confirmed_material_risk"
  | "potential_concern"
  | "missing_evidence"
  | "conflicting_evidence"
  | "informational_observation";

export type DecisionCockpitRiskSeverity = "critical" | "high" | "medium" | "low" | "unknown";

export type DecisionCockpitRiskGroup = "blocking" | "material" | "moderate" | "informational";

export type DecisionCockpitVerificationState =
  | "verified"
  | "source_backed"
  | "corroborated"
  | "estimated"
  | "user_entered"
  | "missing"
  | "unknown";

export type DecisionCockpitRiskRecord = {
  riskId: string;
  workspaceId?: string;
  dealId?: string;
  category: DecisionCockpitRiskCategory;
  severity: DecisionCockpitRiskSeverity;
  confidenceState: string;
  verificationState: DecisionCockpitVerificationState;
  sourceReference: string;
  evidenceRefs: string[];
  governingModule: string;
  decisionImpact: string;
  recommendedReviewRef: string;
  staleState: DecisionCockpitPanelState;
  currentState: DecisionCockpitPanelState;
  stableOrdinal: number;
  deterministicHash?: string;
};

export type DecisionCockpitRiskProjection = DecisionCockpitRiskRecord & {
  group: DecisionCockpitRiskGroup;
  displayLabel: string;
  sourceBoundary: {
    clientGeneratedRiskProhibited: true;
    severityInferenceProhibited: true;
  };
};

export type DecisionCockpitMissingInputCategory =
  | "underwriting"
  | "financing"
  | "market"
  | "governance"
  | "contract"
  | "inspection"
  | "appraisal"
  | "strategy"
  | "evidence";

export type DecisionCockpitMissingInputImportance = "blocking" | "material" | "review" | "unknown";

export type DecisionCockpitMissingInputRecord = {
  missingInputId: string;
  workspaceId?: string;
  dealId?: string;
  category: DecisionCockpitMissingInputCategory;
  importance: DecisionCockpitMissingInputImportance;
  explanation: string;
  sourceModule: string;
  blocking: boolean;
  decisionImpact: string;
  requiredWorkflowRef: string;
  staleState: DecisionCockpitPanelState;
  status: "accepted" | "needs_review" | "missing" | "conflicted" | "deferred";
  stableOrdinal: number;
  deterministicHash?: string;
};

export type DecisionCockpitMissingInputProjection = DecisionCockpitMissingInputRecord & {
  sourceBoundary: {
    missingInformationIsNotEvidence: true;
    recommendationMutationProhibited: true;
  };
};

export type DecisionCockpitPriorPanelProjection<TItem> = {
  state: DecisionCockpitPanelState;
  itemCount: number;
  panelHash: string;
  generatedAt?: string;
  items: TItem[];
};

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
  canReadRisks?: boolean;
  canReadConfidence?: boolean;
  canReadMissingInputs?: boolean;
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
  riskRecords?: DecisionCockpitRiskRecord[];
  missingInputRecords?: DecisionCockpitMissingInputRecord[];
  riskPanelState?: DecisionCockpitPanelState;
  confidencePanelState?: DecisionCockpitPanelState;
  missingInputPanelState?: DecisionCockpitPanelState;
  priorValidRiskPanel?: DecisionCockpitPriorPanelProjection<DecisionCockpitRiskProjection>;
  priorValidConfidencePanel?: DecisionCockpitPriorPanelProjection<DecisionCockpitReadProjection["confidence"]>;
  priorValidMissingInputPanel?: DecisionCockpitPriorPanelProjection<DecisionCockpitMissingInputProjection>;
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
    contractVersion: typeof DECISION_COCKPIT_CONFIDENCE_PANEL_CONTRACT_VERSION;
    state: DecisionCockpitPanelState;
    primaryLabel?: string;
    primaryDescription?: string;
    sourceModule?: "Strategy Intelligence";
    sourceVersion?: string;
    evidenceQualityState: string;
    evidenceCompletenessState: "complete" | "incomplete" | "unknown";
    acceptedAssumptionCount: number;
    preliminaryAssumptionCount: number;
    missingDependencyCount: number;
    professionalReviewRequired: boolean;
    professionalReviewCount: number;
    staleIndicators: string[];
    explanationRef?: string;
    sourceIdentity: {
      rankingId?: string;
      selectedStrategyId?: string;
      selectedStrategyVersion?: string;
      scoreResultId?: string;
      resultHash?: string;
    };
    strategyConfidenceLabels: Array<{
      strategyId: string;
      displayName: string;
      label: string;
    }>;
    priorValid?: DecisionCockpitPriorPanelProjection<DecisionCockpitReadProjection["confidence"]>;
    deterministicHash: string;
  };
  risks: {
    contractVersion: typeof DECISION_COCKPIT_RISK_PANEL_CONTRACT_VERSION;
    state: DecisionCockpitPanelState;
    itemCount: number;
    groups: Array<{
      group: DecisionCockpitRiskGroup;
      itemCount: number;
    }>;
    items: DecisionCockpitRiskProjection[];
    priorValid?: DecisionCockpitPriorPanelProjection<DecisionCockpitRiskProjection>;
    unavailableModules: DecisionCockpitModuleAvailability[];
    panelHash: string;
    sourceBoundary: {
      canonicalRiskRecordsOnly: true;
      clientGeneratedRiskProhibited: true;
      severityInferenceProhibited: true;
      absenceDoesNotMeanLowRisk: true;
    };
  };
  missingInputs: {
    contractVersion: typeof DECISION_COCKPIT_MISSING_INPUT_PANEL_CONTRACT_VERSION;
    state: DecisionCockpitPanelState;
    itemCount: number;
    blockingCount: number;
    categories: Array<{
      category: DecisionCockpitMissingInputCategory;
      itemCount: number;
    }>;
    items: DecisionCockpitMissingInputProjection[];
    priorValid?: DecisionCockpitPriorPanelProjection<DecisionCockpitMissingInputProjection>;
    panelHash: string;
    sourceBoundary: {
      canonicalMissingInputsOnly: true;
      missingInformationIsNotEvidence: true;
      recommendationMutationProhibited: true;
    };
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
  const fullAuthorization: Required<DecisionCockpitAuthorization> = {
    reason: "",
    canReadCockpit: authorization.canReadCockpit,
    canReadRecommendation: authorization.canReadRecommendation,
    canReadMetrics: authorization.canReadMetrics,
    canReadUserDecision: authorization.canReadUserDecision,
    canReadRisks: authorization.canReadRisks ?? true,
    canReadConfidence: authorization.canReadConfidence ?? true,
    canReadMissingInputs: authorization.canReadMissingInputs ?? true,
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
  const recommendation = buildRecommendationProjection(input, fullAuthorization, strongestSystemRankedStrategy);
  const rationale = buildRationaleProjection(input, recommendation, strongestSystemRankedStrategy, fullAuthorization);
  const keyMetrics = buildKeyMetricsProjection(input, fullAuthorization);
  const userDecision = buildUserDecisionProjection(input.userDecision, recommendation, strongestSystemRankedStrategy, fullAuthorization);
  const moduleAvailability = input.moduleAvailability ?? [];
  const freshnessState = resolveFreshness(input.underwriting, input.strategy, input.report);
  const confidence = buildConfidenceProjection(input, fullAuthorization, freshnessState);
  const risks = buildRiskPanelProjection(input, fullAuthorization, moduleAvailability, freshnessState);
  const missingInputs = buildMissingInputPanelProjection(input, fullAuthorization, freshnessState);

  return {
    contractVersion: DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION,
    dealId: input.dealId,
    workspaceId: input.workspaceId,
    dealName: input.dealName?.trim() || input.underwriting?.dealName || input.strategy?.dealName || "Deal",
    mode: input.mode ?? input.underwriting?.mode ?? input.strategy?.mode ?? "guided",
    generatedAt: input.generatedAt,
    property: { ...input.property },
    freshness: {
      state: freshnessState,
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
    confidence,
    risks,
    missingInputs,
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

function buildRiskPanelProjection(
  input: DecisionCockpitReadProjectionInput,
  authorization: Required<DecisionCockpitAuthorization>,
  moduleAvailability: DecisionCockpitModuleAvailability[],
  freshnessState: DecisionCockpitFreshnessState,
): DecisionCockpitReadProjection["risks"] {
  if (!authorization.canReadCockpit || !authorization.canReadRisks) {
    const panelHash = stableHash({ dealId: input.dealId, state: "permission_restricted", reason: authorization.reason });
    return {
      contractVersion: DECISION_COCKPIT_RISK_PANEL_CONTRACT_VERSION,
      state: "permission_restricted",
      itemCount: 0,
      groups: [],
      items: [],
      unavailableModules: [],
      panelHash,
      sourceBoundary: riskSourceBoundary(),
    };
  }

  const currentItems = canonicalRiskItems(input);
  const state = input.riskPanelState ?? panelStateFromFreshness(freshnessState, currentItems.length > 0);
  const items = currentItems.length > 0 ? currentItems : priorItemsWhenNeeded(state, input.priorValidRiskPanel);
  const groups = groupRiskItems(items);
  const panelHash = stableHash({
    contractVersion: DECISION_COCKPIT_RISK_PANEL_CONTRACT_VERSION,
    state,
    items: items.map((item) => ({
      riskId: item.riskId,
      group: item.group,
      category: item.category,
      severity: item.severity,
      confidenceState: item.confidenceState,
      verificationState: item.verificationState,
      sourceReference: item.sourceReference,
      evidenceRefs: item.evidenceRefs,
      governingModule: item.governingModule,
      decisionImpact: item.decisionImpact,
      recommendedReviewRef: item.recommendedReviewRef,
      staleState: item.staleState,
      currentState: item.currentState,
      stableOrdinal: item.stableOrdinal,
    })),
  });

  return {
    contractVersion: DECISION_COCKPIT_RISK_PANEL_CONTRACT_VERSION,
    state,
    itemCount: items.length,
    groups,
    items,
    priorValid: input.priorValidRiskPanel,
    unavailableModules: moduleAvailability.filter((module) => module.status !== "available" && module.status !== "not_applicable"),
    panelHash,
    sourceBoundary: riskSourceBoundary(),
  };
}

function buildConfidenceProjection(
  input: DecisionCockpitReadProjectionInput,
  authorization: Required<DecisionCockpitAuthorization>,
  freshnessState: DecisionCockpitFreshnessState,
): DecisionCockpitReadProjection["confidence"] {
  if (!authorization.canReadCockpit || !authorization.canReadConfidence) {
    return {
      contractVersion: DECISION_COCKPIT_CONFIDENCE_PANEL_CONTRACT_VERSION,
      state: "permission_restricted",
      evidenceQualityState: "permission_restricted",
      evidenceCompletenessState: "unknown",
      acceptedAssumptionCount: 0,
      preliminaryAssumptionCount: 0,
      missingDependencyCount: 0,
      professionalReviewRequired: false,
      professionalReviewCount: 0,
      staleIndicators: [],
      sourceIdentity: {},
      strategyConfidenceLabels: [],
      deterministicHash: stableHash({ dealId: input.dealId, state: "permission_restricted", reason: authorization.reason }),
    };
  }

  const selected = input.strategy?.selectedStrategy ?? input.strategy?.rankedStrategies[0];
  const state = input.confidencePanelState ?? panelStateFromFreshness(freshnessState, Boolean(selected));
  const staleIndicators = [
    ...(input.strategy?.overview.staleWarning ? [input.strategy.overview.staleWarning] : []),
    ...(input.strategy?.staleEvents.map((event) => event.reason) ?? []),
  ];
  const missingDependencyCount = selected?.missingDependencyCount ?? input.strategy?.overview.missingDependencyCount ?? 0;
  const acceptedAssumptionCount = selected?.acceptedAssumptionCount ?? 0;
  const preliminaryAssumptionCount = selected?.preliminaryAssumptionCount ?? 0;
  const professionalReviewCount = selected?.professionalReviewCount ?? input.strategy?.overview.professionalReviewCount ?? 0;
  const evidenceCompletenessState = !selected
    ? "unknown"
    : missingDependencyCount > 0 || preliminaryAssumptionCount > 0
      ? "incomplete"
      : "complete";
  const projection = {
    contractVersion: DECISION_COCKPIT_CONFIDENCE_PANEL_CONTRACT_VERSION,
    state,
    primaryLabel: selected?.confidenceLabel,
    primaryDescription: selected?.confidenceDescription,
    sourceModule: selected ? "Strategy Intelligence" as const : undefined,
    sourceVersion: input.strategy?.overview.rankingVersion,
    evidenceQualityState: selected?.confidenceLabel ?? "unavailable",
    evidenceCompletenessState,
    acceptedAssumptionCount,
    preliminaryAssumptionCount,
    missingDependencyCount,
    professionalReviewRequired: professionalReviewCount > 0,
    professionalReviewCount,
    staleIndicators,
    explanationRef: selected?.explanation?.explanationResultId,
    sourceIdentity: {
      rankingId: input.strategy?.overview.rankingId,
      selectedStrategyId: selected?.strategyId,
      selectedStrategyVersion: selected?.strategyVersion,
      scoreResultId: selected?.scoreResultId,
      resultHash: selected?.hash,
    },
    strategyConfidenceLabels: (input.strategy?.rankedStrategies ?? []).map((strategy) => ({
      strategyId: strategy.strategyId,
      displayName: strategy.displayName,
      label: strategy.confidenceLabel,
    })),
    priorValid: input.priorValidConfidencePanel,
    deterministicHash: "",
  } satisfies DecisionCockpitReadProjection["confidence"];
  projection.deterministicHash = stableHash({
    contractVersion: projection.contractVersion,
    state: projection.state,
    primaryLabel: projection.primaryLabel,
    evidenceQualityState: projection.evidenceQualityState,
    evidenceCompletenessState: projection.evidenceCompletenessState,
    acceptedAssumptionCount: projection.acceptedAssumptionCount,
    preliminaryAssumptionCount: projection.preliminaryAssumptionCount,
    missingDependencyCount: projection.missingDependencyCount,
    professionalReviewRequired: projection.professionalReviewRequired,
    professionalReviewCount: projection.professionalReviewCount,
    staleIndicators: projection.staleIndicators,
    sourceIdentity: projection.sourceIdentity,
  });
  return projection;
}

function buildMissingInputPanelProjection(
  input: DecisionCockpitReadProjectionInput,
  authorization: Required<DecisionCockpitAuthorization>,
  freshnessState: DecisionCockpitFreshnessState,
): DecisionCockpitReadProjection["missingInputs"] {
  if (!authorization.canReadCockpit || !authorization.canReadMissingInputs) {
    const panelHash = stableHash({ dealId: input.dealId, state: "permission_restricted", reason: authorization.reason });
    return {
      contractVersion: DECISION_COCKPIT_MISSING_INPUT_PANEL_CONTRACT_VERSION,
      state: "permission_restricted",
      itemCount: 0,
      blockingCount: 0,
      categories: [],
      items: [],
      panelHash,
      sourceBoundary: missingInputSourceBoundary(),
    };
  }

  const currentItems = canonicalMissingInputItems(input);
  const state = input.missingInputPanelState ?? panelStateFromFreshness(freshnessState, currentItems.length > 0);
  const items = currentItems.length > 0 ? currentItems : priorItemsWhenNeeded(state, input.priorValidMissingInputPanel);
  const panelHash = stableHash({
    contractVersion: DECISION_COCKPIT_MISSING_INPUT_PANEL_CONTRACT_VERSION,
    state,
    items: items.map((item) => ({
      missingInputId: item.missingInputId,
      category: item.category,
      importance: item.importance,
      explanation: item.explanation,
      sourceModule: item.sourceModule,
      blocking: item.blocking,
      decisionImpact: item.decisionImpact,
      requiredWorkflowRef: item.requiredWorkflowRef,
      staleState: item.staleState,
      status: item.status,
      stableOrdinal: item.stableOrdinal,
    })),
  });

  return {
    contractVersion: DECISION_COCKPIT_MISSING_INPUT_PANEL_CONTRACT_VERSION,
    state,
    itemCount: items.length,
    blockingCount: items.filter((item) => item.blocking).length,
    categories: groupMissingInputItems(items),
    items,
    priorValid: input.priorValidMissingInputPanel,
    panelHash,
    sourceBoundary: missingInputSourceBoundary(),
  };
}

function canonicalRiskItems(input: DecisionCockpitReadProjectionInput): DecisionCockpitRiskProjection[] {
  const seen = new Set<string>();
  return [...(input.riskRecords ?? [])]
    .filter((record) => belongsToProjection(record.workspaceId, record.dealId, input.workspaceId, input.dealId))
    .sort((left, right) => left.stableOrdinal - right.stableOrdinal || left.riskId.localeCompare(right.riskId))
    .filter((record) => {
      if (seen.has(record.riskId)) return false;
      seen.add(record.riskId);
      return true;
    })
    .map((record) => {
      const projection = {
        ...record,
        group: riskGroupFor(record.category),
        displayLabel: label(record.category),
        sourceBoundary: {
          clientGeneratedRiskProhibited: true,
          severityInferenceProhibited: true,
        },
      } satisfies Omit<DecisionCockpitRiskProjection, "deterministicHash"> & { deterministicHash?: string };
      return {
        ...projection,
        deterministicHash: record.deterministicHash ?? stableHash({
          riskId: projection.riskId,
          category: projection.category,
          severity: projection.severity,
          confidenceState: projection.confidenceState,
          verificationState: projection.verificationState,
          sourceReference: projection.sourceReference,
          evidenceRefs: projection.evidenceRefs,
          governingModule: projection.governingModule,
          decisionImpact: projection.decisionImpact,
          recommendedReviewRef: projection.recommendedReviewRef,
          staleState: projection.staleState,
          currentState: projection.currentState,
          stableOrdinal: projection.stableOrdinal,
        }),
      };
    });
}

function canonicalMissingInputItems(input: DecisionCockpitReadProjectionInput): DecisionCockpitMissingInputProjection[] {
  const supplied = (input.missingInputRecords ?? [])
    .filter((record) => belongsToProjection(record.workspaceId, record.dealId, input.workspaceId, input.dealId));
  const fromUnderwriting = (input.underwriting?.inputs ?? [])
    .filter((row) => row.needsAttention)
    .map((row) => missingInputFromUnderwriting(row, input.dealId));
  const fromStrategy: DecisionCockpitMissingInputRecord[] = input.strategy?.selectedStrategy?.missingInformation.map((item, index) => ({
    missingInputId: `strategy:${input.strategy?.selectedStrategy?.strategyId}:${index + 1}`,
    dealId: input.dealId,
    category: "strategy" as const,
    importance: "review" as const,
    explanation: item,
    sourceModule: "Strategy Intelligence",
    blocking: false,
    decisionImpact: "May change strategy compatibility, ranking, or explanation once resolved.",
    requiredWorkflowRef: `strategy:${input.strategy?.selectedStrategy?.strategyId}:requirements`,
    staleState: panelStateFromFreshness(resolveFreshness(input.underwriting, input.strategy, input.report), true),
    status: "missing" as const,
    stableOrdinal: 5000 + index,
  })) ?? [];

  const seen = new Set<string>();
  return [...supplied, ...fromUnderwriting, ...fromStrategy]
    .sort((left, right) => missingImportanceOrder(left.importance) - missingImportanceOrder(right.importance)
      || left.stableOrdinal - right.stableOrdinal
      || left.missingInputId.localeCompare(right.missingInputId))
    .filter((record) => {
      if (seen.has(record.missingInputId)) return false;
      seen.add(record.missingInputId);
      return true;
    })
    .map((record) => ({
      ...record,
      deterministicHash: record.deterministicHash ?? stableHash({
        missingInputId: record.missingInputId,
        category: record.category,
        importance: record.importance,
        explanation: record.explanation,
        sourceModule: record.sourceModule,
        blocking: record.blocking,
        decisionImpact: record.decisionImpact,
        requiredWorkflowRef: record.requiredWorkflowRef,
        staleState: record.staleState,
        status: record.status,
        stableOrdinal: record.stableOrdinal,
      }),
      sourceBoundary: missingInputItemSourceBoundary(),
    }));
}

function missingInputFromUnderwriting(
  row: UnderwritingPresentationInputRow,
  dealId: string,
): DecisionCockpitMissingInputRecord {
  const status = missingInputStatusFromUnderwriting(row);
  const required = row.requirement.toLowerCase().includes("required");
  return {
    missingInputId: `underwriting:${row.inputId}`,
    dealId,
    category: "underwriting",
    importance: required ? "blocking" : "review",
    explanation: `${row.label} requires ${status === "conflicted" ? "conflict resolution" : "completion"} before this Deal can be relied on.`,
    sourceModule: "Deterministic Underwriting",
    blocking: required,
    decisionImpact: "May change underwriting readiness, core financial outputs, and strategy ranking.",
    requiredWorkflowRef: `underwriting:inputs:${row.inputId}`,
    staleState: "current",
    status,
    stableOrdinal: row.stableOrdinal,
  };
}

function missingInputStatusFromUnderwriting(row: UnderwritingPresentationInputRow): DecisionCockpitMissingInputRecord["status"] {
  const state = `${row.status} ${row.sourceState}`.toLowerCase();
  if (state.includes("conflict") || state.includes("unresolved")) return "conflicted";
  if (state.includes("defer")) return "deferred";
  if (state.includes("invalid") || state.includes("review")) return "needs_review";
  if (state.includes("missing")) return "missing";
  return "needs_review";
}

function priorItemsWhenNeeded<TItem>(
  state: DecisionCockpitPanelState,
  prior?: DecisionCockpitPriorPanelProjection<TItem>,
): TItem[] {
  if (!prior) return [];
  return state === "processing" || state === "failed" || state === "stale" ? prior.items : [];
}

function belongsToProjection(
  recordWorkspaceId: string | undefined,
  recordDealId: string | undefined,
  workspaceId: string | undefined,
  dealId: string,
) {
  if (recordWorkspaceId && workspaceId && recordWorkspaceId !== workspaceId) return false;
  if (recordDealId && recordDealId !== dealId) return false;
  return true;
}

function panelStateFromFreshness(
  freshnessState: DecisionCockpitFreshnessState,
  hasSourceItems: boolean,
): DecisionCockpitPanelState {
  if (freshnessState === "stale" || freshnessState === "historical") return "stale";
  if (freshnessState === "partial" || freshnessState === "blocked") return "partial";
  if (freshnessState === "no_source_results" && !hasSourceItems) return "unavailable";
  return "current";
}

function groupRiskItems(items: DecisionCockpitRiskProjection[]) {
  return (["blocking", "material", "moderate", "informational"] as const)
    .map((group) => ({ group, itemCount: items.filter((item) => item.group === group).length }))
    .filter((group) => group.itemCount > 0);
}

function groupMissingInputItems(items: DecisionCockpitMissingInputProjection[]) {
  const categories: DecisionCockpitMissingInputCategory[] = [
    "underwriting",
    "financing",
    "market",
    "governance",
    "contract",
    "inspection",
    "appraisal",
    "strategy",
    "evidence",
  ];
  return categories
    .map((category) => ({ category, itemCount: items.filter((item) => item.category === category).length }))
    .filter((category) => category.itemCount > 0);
}

function riskGroupFor(category: DecisionCockpitRiskCategory): DecisionCockpitRiskGroup {
  if (category === "hard_disqualifier") return "blocking";
  if (category === "confirmed_material_risk") return "material";
  if (category === "informational_observation") return "informational";
  return "moderate";
}

function missingImportanceOrder(importance: DecisionCockpitMissingInputImportance) {
  if (importance === "blocking") return 1;
  if (importance === "material") return 2;
  if (importance === "review") return 3;
  return 4;
}

function riskSourceBoundary() {
  return {
    canonicalRiskRecordsOnly: true,
    clientGeneratedRiskProhibited: true,
    severityInferenceProhibited: true,
    absenceDoesNotMeanLowRisk: true,
  } as const;
}

function missingInputSourceBoundary() {
  return {
    canonicalMissingInputsOnly: true,
    missingInformationIsNotEvidence: true,
    recommendationMutationProhibited: true,
  } as const;
}

function missingInputItemSourceBoundary() {
  return {
    missingInformationIsNotEvidence: true,
    recommendationMutationProhibited: true,
  } as const;
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

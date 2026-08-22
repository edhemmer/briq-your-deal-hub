import type {
  DecisionCockpitAuthorization,
  DecisionCockpitDeadlineProjection,
  DecisionCockpitKeyMetricProjection,
  DecisionCockpitMissingInputProjection,
  DecisionCockpitNextActionProjection,
  DecisionCockpitReadProjection,
  DecisionCockpitRiskProjection,
  DecisionCockpitWorkflowAvailability,
} from "./decisionCockpitProjection";
import type { UnderwritingPresentationModel } from "./underwritingPresentation";

export const DECISION_COCKPIT_DESTINATION_CONTRACT_VERSION = "decision-cockpit-destination-contract-v1";
export const DECISION_COCKPIT_ROUTE_REGISTRY_VERSION = "decision-cockpit-route-registry-v1";

export type DecisionCockpitDestinationType =
  | "deal_overview"
  | "property_detail"
  | "underwriting_summary"
  | "underwriting_input"
  | "underwriting_output"
  | "formula_lineage"
  | "snapshot_detail"
  | "scenario_detail"
  | "sensitivity_detail"
  | "strategy_overview"
  | "strategy_result"
  | "strategy_comparison"
  | "financeiq_overview"
  | "financing_structure"
  | "financing_condition"
  | "financing_covenant"
  | "financing_comparison"
  | "recommendation_detail"
  | "risk_detail"
  | "missing_input_detail"
  | "assumption_detail"
  | "conflict_detail"
  | "task_detail"
  | "deadline_detail"
  | "history_entry"
  | "report_preview"
  | "source_record"
  | "evidence_item"
  | "evidence_anchor"
  | "professional_review"
  | "governing_workflow";

export type DecisionCockpitGoverningModule =
  | "DecisionCockpit"
  | "Property"
  | "Underwriting"
  | "Strategy"
  | "FinanceIQ"
  | "Evidence"
  | "DealWork"
  | "Reports";

export type DecisionCockpitDestinationAvailability =
  | "available"
  | "permission_restricted"
  | "unavailable_module"
  | "record_not_found"
  | "version_not_found"
  | "stale"
  | "historical"
  | "superseded"
  | "archived"
  | "signed_out"
  | "invalid_destination";

export type DecisionCockpitNavigationErrorCode =
  | "destination_not_found"
  | "route_not_found"
  | "route_disabled"
  | "invalid_destination_type"
  | "invalid_route_parameter"
  | "unauthorized_destination"
  | "unauthorized_evidence"
  | "workspace_mismatch"
  | "deal_mismatch"
  | "record_not_found"
  | "historical_version_not_found"
  | "unavailable_module"
  | "signed_out"
  | "invalid_return_context"
  | "unsafe_external_url"
  | "internal_navigation_error";

export type DecisionCockpitRouteSection = "overview" | "property" | "underwriting" | "strategies" | "financeiq" | "work" | "history";

export type DecisionCockpitCanonicalRecordType =
  | "deal"
  | "property"
  | "recommendation"
  | "underwriting_snapshot"
  | "underwriting_run"
  | "underwriting_input"
  | "underwriting_output"
  | "formula"
  | "scenario"
  | "sensitivity"
  | "strategy_ranking"
  | "strategy_result"
  | "strategy_comparison"
  | "financing_structure"
  | "financing_condition"
  | "financing_covenant"
  | "financing_comparison"
  | "risk"
  | "missing_input"
  | "assumption"
  | "conflict"
  | "task"
  | "deadline"
  | "history_entry"
  | "report"
  | "source_record"
  | "evidence";

export type DecisionCockpitDestinationReference = {
  destinationId: string;
  destinationType: DecisionCockpitDestinationType;
  governingModule: DecisionCockpitGoverningModule;
  workspaceId?: string;
  dealId: string;
  propertyId?: string;
  canonicalRecordType: DecisionCockpitCanonicalRecordType;
  canonicalRecordId: string;
  exactRecordVersion?: string;
  snapshot?: {
    snapshotId?: string;
    underwritingRunId?: string;
    scenarioId?: string;
    sensitivityId?: string;
  };
  source?: {
    sourceRecordId?: string;
    evidenceId?: string;
    sourceFactId?: string;
  };
  routeId: string;
  routeParams: {
    dealId: string;
    section: DecisionCockpitRouteSection;
    focus?: DecisionCockpitDestinationType;
  };
  requiredPermission: string;
  availability: DecisionCockpitDestinationAvailability;
  state: "current" | "historical" | "superseded" | "archived" | "rejected" | "unavailable";
  fallbackDestinationId?: string;
  returnContext: {
    dealId: string;
    section: DecisionCockpitRouteSection;
    destinationId: string;
  };
  stableOrdinal: number;
  deterministicHash: string;
};

export type DecisionCockpitRouteDefinition = {
  routeId: string;
  governingModule: DecisionCockpitGoverningModule;
  supportedDestinationTypes: readonly DecisionCockpitDestinationType[];
  pathTemplate: "/deals/:dealId" | "/deals/:dealId?section=:section&focus=:focus";
  requiredParams: readonly ["dealId"];
  optionalParams: readonly ["section", "focus"];
  protectedParamRules: {
    canonicalIdsInQueryProhibited: true;
    rawSourceUrlsProhibited: true;
    protectedContentInQueryProhibited: true;
  };
  supportedVersionBehavior: "exact_record_version" | "current_route_with_exact_reference" | "safe_historical_fallback";
  signedOutRecovery: "require_sign_in";
  invalidIdFallback: "return_to_deal_overview" | "show_not_found";
  unavailableModuleBehavior: "return_to_cockpit_read_only";
  nativeDeepLinkIdentifier: string;
  returnContextBehavior: "preserve_cockpit_section";
  lifecycleStatus: "available" | "disabled";
};

export type DecisionCockpitDestinationManifest = {
  contractVersion: typeof DECISION_COCKPIT_DESTINATION_CONTRACT_VERSION;
  routeRegistryVersion: typeof DECISION_COCKPIT_ROUTE_REGISTRY_VERSION;
  dealId: string;
  workspaceId?: string;
  destinationCount: number;
  destinations: DecisionCockpitDestinationReference[];
  manifestHash: string;
  sourceBoundary: {
    canonicalProjectionOnly: true;
    noProviderCalls: true;
    noMutationOnResolve: true;
    noAuthorizationBypass: true;
    noProtectedQueryStrings: true;
  };
};

export type DecisionCockpitRouteResolution =
  | {
      ok: true;
      path: string;
      destination: DecisionCockpitDestinationReference;
      route: DecisionCockpitRouteDefinition;
      availability: DecisionCockpitDestinationAvailability;
    }
  | {
      ok: false;
      error: DecisionCockpitNavigationErrorCode;
      fallbackPath: string;
      destination?: DecisionCockpitDestinationReference;
    };

const route = (
  routeId: string,
  governingModule: DecisionCockpitGoverningModule,
  supportedDestinationTypes: readonly DecisionCockpitDestinationType[],
  lifecycleStatus: DecisionCockpitRouteDefinition["lifecycleStatus"] = "available",
): DecisionCockpitRouteDefinition => ({
  routeId,
  governingModule,
  supportedDestinationTypes,
  pathTemplate: "/deals/:dealId?section=:section&focus=:focus",
  requiredParams: ["dealId"],
  optionalParams: ["section", "focus"],
  protectedParamRules: {
    canonicalIdsInQueryProhibited: true,
    rawSourceUrlsProhibited: true,
    protectedContentInQueryProhibited: true,
  },
  supportedVersionBehavior: "current_route_with_exact_reference",
  signedOutRecovery: "require_sign_in",
  invalidIdFallback: "return_to_deal_overview",
  unavailableModuleBehavior: "return_to_cockpit_read_only",
  nativeDeepLinkIdentifier: `brix.deal.${routeId}`,
  returnContextBehavior: "preserve_cockpit_section",
  lifecycleStatus,
});

export const DECISION_COCKPIT_ROUTE_REGISTRY: readonly DecisionCockpitRouteDefinition[] = [
  route("decision_cockpit.overview", "DecisionCockpit", ["deal_overview", "recommendation_detail", "governing_workflow"]),
  route("decision_cockpit.property", "Property", ["property_detail"]),
  route("decision_cockpit.underwriting", "Underwriting", [
    "underwriting_summary",
    "underwriting_input",
    "underwriting_output",
    "formula_lineage",
    "snapshot_detail",
    "scenario_detail",
    "sensitivity_detail",
    "assumption_detail",
    "conflict_detail",
  ]),
  route("decision_cockpit.strategy", "Strategy", ["strategy_overview", "strategy_result", "strategy_comparison"]),
  route("decision_cockpit.financeiq", "FinanceIQ", ["financeiq_overview", "financing_structure", "financing_condition", "financing_covenant", "financing_comparison"]),
  route("decision_cockpit.evidence", "Evidence", ["source_record", "evidence_item", "evidence_anchor", "professional_review"]),
  route("decision_cockpit.work", "DealWork", ["task_detail", "deadline_detail", "missing_input_detail", "risk_detail"]),
  route("decision_cockpit.history", "DecisionCockpit", ["history_entry", "report_preview"]),
] as const;

type BuildDestinationManifestInput = {
  workspaceId?: string;
  dealId: string;
  propertyId?: string;
  property?: DecisionCockpitReadProjection["property"];
  authorization: Required<DecisionCockpitAuthorization>;
  recommendation: DecisionCockpitReadProjection["recommendation"];
  keyMetrics: DecisionCockpitReadProjection["keyMetrics"];
  risks: DecisionCockpitReadProjection["risks"];
  missingInputs: DecisionCockpitReadProjection["missingInputs"];
  nextActions: DecisionCockpitReadProjection["nextActions"];
  deadlines: DecisionCockpitReadProjection["deadlines"];
  changeHistory: DecisionCockpitReadProjection["changeHistory"];
  underwriting?: Pick<UnderwritingPresentationModel, "inputs" | "snapshots" | "scenarios" | "sensitivities" | "sourcesAndAssumptions">;
  strategy: DecisionCockpitReadProjection["strategy"];
  strongestSystemRankedStrategy?: DecisionCockpitReadProjection["strongestSystemRankedStrategy"];
  report: DecisionCockpitReadProjection["report"];
};

export function buildDecisionCockpitDestinationManifest(input: BuildDestinationManifestInput): DecisionCockpitDestinationManifest {
  const destinations: DecisionCockpitDestinationReference[] = [];
  const baseAvailability = input.authorization.canReadCockpit ? "available" : "permission_restricted";
  const base = {
    workspaceId: input.workspaceId,
    dealId: input.dealId,
    propertyId: input.propertyId,
    availability: baseAvailability as DecisionCockpitDestinationAvailability,
  };

  destinations.push(destination({
    ...base,
    destinationType: "deal_overview",
    governingModule: "DecisionCockpit",
    canonicalRecordType: "deal",
    canonicalRecordId: input.dealId,
    routeId: "decision_cockpit.overview",
    section: "overview",
    stableOrdinal: 10,
  }));

  if (input.propertyId) {
    destinations.push(destination({
      ...base,
      destinationType: "property_detail",
      governingModule: "Property",
      canonicalRecordType: "property",
      canonicalRecordId: input.propertyId,
      routeId: "decision_cockpit.property",
      section: "property",
      stableOrdinal: 20,
    }));
  }

  if (input.recommendation.available) {
    destinations.push(destination({
      ...base,
      destinationType: "recommendation_detail",
      governingModule: "DecisionCockpit",
      canonicalRecordType: "recommendation",
      canonicalRecordId: input.recommendation.recommendationId ?? input.recommendation.deterministicRecommendationId,
      exactRecordVersion: input.recommendation.contractVersion,
      routeId: "decision_cockpit.overview",
      section: "overview",
      stableOrdinal: 30,
    }));
  }

  destinations.push(...underwritingDestinations(input, base));
  destinations.push(...strategyDestinations(input, base));
  destinations.push(...riskDestinations(input.risks.items, base, 600));
  destinations.push(...missingInputDestinations(input.missingInputs.items, base, 700));
  destinations.push(...actionDestinations([input.nextActions.primaryAction, ...input.nextActions.alternateActions].filter(Boolean) as DecisionCockpitNextActionProjection[], base, 800));
  destinations.push(...deadlineDestinations(input.deadlines.items, base, 900));
  destinations.push(...historyDestinations(input.changeHistory.items, base, 1000));

  if (input.report.available && input.report.contentHash) {
    destinations.push(destination({
      ...base,
      destinationType: "report_preview",
      governingModule: "Reports",
      canonicalRecordType: "report",
      canonicalRecordId: input.report.contentHash,
      exactRecordVersion: input.report.contractVersion ?? undefined,
      routeId: "decision_cockpit.history",
      section: "history",
      state: "current",
      stableOrdinal: 1200,
    }));
  }

  const ordered = destinations
    .sort((left, right) => left.stableOrdinal - right.stableOrdinal || left.destinationId.localeCompare(right.destinationId))
    .map((item, index) => ({ ...item, stableOrdinal: index + 1 }));

  const finalized = ordered.map((item) => ({
    ...item,
    deterministicHash: stableHash(destinationHashBasis({ ...item, deterministicHash: "" })),
  }));

  return {
    contractVersion: DECISION_COCKPIT_DESTINATION_CONTRACT_VERSION,
    routeRegistryVersion: DECISION_COCKPIT_ROUTE_REGISTRY_VERSION,
    dealId: input.dealId,
    workspaceId: input.workspaceId,
    destinationCount: finalized.length,
    destinations: finalized,
    manifestHash: stableHash(finalized.map(destinationHashBasis)),
    sourceBoundary: {
      canonicalProjectionOnly: true,
      noProviderCalls: true,
      noMutationOnResolve: true,
      noAuthorizationBypass: true,
      noProtectedQueryStrings: true,
    },
  };
}

export function resolveDecisionCockpitDestination(
  destination: DecisionCockpitDestinationReference | undefined,
  options: {
    isSignedIn?: boolean;
    canOpen?: boolean;
    workspaceId?: string;
    dealId?: string;
  } = {},
): DecisionCockpitRouteResolution {
  if (!destination) return { ok: false, error: "destination_not_found", fallbackPath: "/deals", destination };
  if (options.isSignedIn === false) return { ok: false, error: "signed_out", fallbackPath: "/app", destination };
  if (options.workspaceId && destination.workspaceId && options.workspaceId !== destination.workspaceId) {
    return { ok: false, error: "workspace_mismatch", fallbackPath: safeDealPath(destination.dealId), destination };
  }
  if (options.dealId && destination.dealId !== options.dealId) {
    return { ok: false, error: "deal_mismatch", fallbackPath: safeDealPath(options.dealId), destination };
  }
  if (destination.availability === "permission_restricted" || options.canOpen === false) {
    return { ok: false, error: destination.destinationType.includes("evidence") ? "unauthorized_evidence" : "unauthorized_destination", fallbackPath: safeDealPath(destination.dealId), destination };
  }
  if (destination.availability === "unavailable_module") {
    return { ok: false, error: "unavailable_module", fallbackPath: safeDealPath(destination.dealId), destination };
  }
  if (destination.availability === "record_not_found") {
    return { ok: false, error: "record_not_found", fallbackPath: safeDealPath(destination.dealId), destination };
  }
  if (destination.availability === "version_not_found") {
    return { ok: false, error: "historical_version_not_found", fallbackPath: safeDealPath(destination.dealId), destination };
  }
  if (!isSafeDealId(destination.dealId)) {
    return { ok: false, error: "invalid_route_parameter", fallbackPath: "/deals", destination };
  }
  const routeDefinition = DECISION_COCKPIT_ROUTE_REGISTRY.find((item) => item.routeId === destination.routeId);
  if (!routeDefinition) return { ok: false, error: "route_not_found", fallbackPath: safeDealPath(destination.dealId), destination };
  if (routeDefinition.lifecycleStatus !== "available") return { ok: false, error: "route_disabled", fallbackPath: safeDealPath(destination.dealId), destination };
  if (!routeDefinition.supportedDestinationTypes.includes(destination.destinationType)) {
    return { ok: false, error: "invalid_destination_type", fallbackPath: safeDealPath(destination.dealId), destination };
  }
  if (!isSafeSection(destination.routeParams.section) || (destination.routeParams.focus && !isSafeFocus(destination.routeParams.focus))) {
    return { ok: false, error: "invalid_route_parameter", fallbackPath: safeDealPath(destination.dealId), destination };
  }
  return {
    ok: true,
    path: pathForDecisionCockpitDestination(destination),
    destination,
    route: routeDefinition,
    availability: destination.availability,
  };
}

export function pathForDecisionCockpitDestination(destination: DecisionCockpitDestinationReference) {
  const params = new URLSearchParams();
  params.set("section", destination.routeParams.section);
  if (destination.routeParams.focus) params.set("focus", destination.routeParams.focus);
  return `${safeDealPath(destination.dealId)}?${params.toString()}`;
}

function underwritingDestinations(input: BuildDestinationManifestInput, base: DestinationBase) {
  const destinations: DecisionCockpitDestinationReference[] = [];
  if (input.keyMetrics.metrics.length || input.underwriting?.snapshots.length) {
    destinations.push(destination({
      ...base,
      destinationType: "underwriting_summary",
      governingModule: "Underwriting",
      canonicalRecordType: "underwriting_run",
      canonicalRecordId: input.keyMetrics.underwritingRunId ?? input.dealId,
      exactRecordVersion: input.keyMetrics.registryVersion,
      snapshot: {
        snapshotId: input.keyMetrics.snapshotId,
        underwritingRunId: input.keyMetrics.underwritingRunId,
        scenarioId: input.keyMetrics.scenarioId,
      },
      routeId: "decision_cockpit.underwriting",
      section: "underwriting",
      stableOrdinal: 100,
    }));
  }
  for (const inputRow of input.underwriting?.inputs ?? []) {
    destinations.push(destination({
      ...base,
      destinationType: inputRow.status === "Conflicted" ? "conflict_detail" : "underwriting_input",
      governingModule: "Underwriting",
      canonicalRecordType: inputRow.status === "Conflicted" ? "conflict" : "underwriting_input",
      canonicalRecordId: inputRow.inputId,
      routeId: "decision_cockpit.underwriting",
      section: "underwriting",
      stableOrdinal: 120 + inputRow.stableOrdinal,
    }));
  }
  for (const metric of input.keyMetrics.metrics) {
    destinations.push(destination({
      ...base,
      destinationType: "formula_lineage",
      governingModule: "Underwriting",
      canonicalRecordType: "formula",
      canonicalRecordId: metric.canonicalResultReference,
      exactRecordVersion: metric.formulaVersion,
      snapshot: {
        snapshotId: metric.snapshotId,
        underwritingRunId: metric.underwritingRunId,
        scenarioId: metric.scenarioId,
      },
      routeId: "decision_cockpit.underwriting",
      section: "underwriting",
      stableOrdinal: 200 + metric.stableOrdinal,
    }));
  }
  for (const scenario of input.underwriting?.scenarios ?? []) {
    destinations.push(destination({
      ...base,
      destinationType: "scenario_detail",
      governingModule: "Underwriting",
      canonicalRecordType: "scenario",
      canonicalRecordId: scenario.scenarioId,
      snapshot: { scenarioId: scenario.scenarioId },
      routeId: "decision_cockpit.underwriting",
      section: "underwriting",
      stableOrdinal: 300 + destinations.length,
    }));
  }
  for (const sensitivity of input.underwriting?.sensitivities ?? []) {
    destinations.push(destination({
      ...base,
      destinationType: "sensitivity_detail",
      governingModule: "Underwriting",
      canonicalRecordType: "sensitivity",
      canonicalRecordId: sensitivity.sensitivityId,
      snapshot: { sensitivityId: sensitivity.sensitivityId },
      routeId: "decision_cockpit.underwriting",
      section: "underwriting",
      stableOrdinal: 350 + destinations.length,
    }));
  }
  for (const row of input.underwriting?.sourcesAndAssumptions.provenance ?? []) {
    if (row.sourceRecordId) {
      destinations.push(destination({
        ...base,
        destinationType: "source_record",
        governingModule: "Evidence",
        canonicalRecordType: "source_record",
        canonicalRecordId: row.sourceRecordId,
        source: {
          sourceRecordId: row.sourceRecordId,
          evidenceId: row.evidenceId,
          sourceFactId: row.sourceFactId,
        },
        routeId: "decision_cockpit.evidence",
        section: "underwriting",
        stableOrdinal: 400 + destinations.length,
      }));
    }
    if (row.evidenceId) {
      destinations.push(destination({
        ...base,
        destinationType: "evidence_item",
        governingModule: "Evidence",
        canonicalRecordType: "evidence",
        canonicalRecordId: row.evidenceId,
        source: {
          sourceRecordId: row.sourceRecordId,
          evidenceId: row.evidenceId,
          sourceFactId: row.sourceFactId,
        },
        routeId: "decision_cockpit.evidence",
        section: "underwriting",
        stableOrdinal: 450 + destinations.length,
      }));
    }
  }
  for (const assumption of input.underwriting?.sourcesAndAssumptions.assumptions ?? []) {
    destinations.push(destination({
      ...base,
      destinationType: "assumption_detail",
      governingModule: "Underwriting",
      canonicalRecordType: "assumption",
      canonicalRecordId: stableHash({ assumption }),
      routeId: "decision_cockpit.underwriting",
      section: "underwriting",
      stableOrdinal: 500 + destinations.length,
    }));
  }
  return destinations;
}

function strategyDestinations(input: BuildDestinationManifestInput, base: DestinationBase) {
  const destinations: DecisionCockpitDestinationReference[] = [];
  if (input.strategy.available && input.strategy.rankingId) {
    destinations.push(destination({
      ...base,
      destinationType: "strategy_overview",
      governingModule: "Strategy",
      canonicalRecordType: "strategy_ranking",
      canonicalRecordId: input.strategy.rankingId,
      exactRecordVersion: input.strategy.rankingVersion,
      routeId: "decision_cockpit.strategy",
      section: "strategies",
      stableOrdinal: 520,
    }));
    destinations.push(destination({
      ...base,
      destinationType: "strategy_comparison",
      governingModule: "Strategy",
      canonicalRecordType: "strategy_comparison",
      canonicalRecordId: input.strategy.rankingHash ?? input.strategy.rankingId,
      exactRecordVersion: input.strategy.rankingVersion,
      routeId: "decision_cockpit.strategy",
      section: "strategies",
      stableOrdinal: 530,
    }));
  }
  const rankedStrategies = input.strategy.rankedStrategies.slice(0, 8);
  rankedStrategies.forEach((strategy, index) => {
    destinations.push(destination({
      ...base,
      destinationType: "strategy_result",
      governingModule: "Strategy",
      canonicalRecordType: "strategy_result",
      canonicalRecordId: strategy.scoreResultId,
      exactRecordVersion: strategy.strategyVersion,
      routeId: "decision_cockpit.strategy",
      section: "strategies",
      state: strategy.freshnessState === "historical" || strategy.freshnessState === "stale" ? "historical" : "current",
      availability: availabilityFromWorkflow(strategy.freshnessState === "stale" ? "stale" : "available"),
      stableOrdinal: 540 + index,
    }));
  });
  return destinations;
}

function riskDestinations(items: DecisionCockpitRiskProjection[], base: DestinationBase, offset: number) {
  return items.map((risk) => destination({
    ...base,
    workspaceId: risk.workspaceId ?? base.workspaceId,
    dealId: risk.dealId ?? base.dealId,
    destinationType: "risk_detail",
    governingModule: moduleFromString(risk.governingModule),
    canonicalRecordType: "risk",
    canonicalRecordId: risk.riskId,
    source: {
      sourceRecordId: risk.sourceReference,
      evidenceId: risk.evidenceRefs[0],
    },
    routeId: "decision_cockpit.work",
    section: "work",
    requiredPermission: "deals:read",
    availability: availabilityFromPanelState(risk.currentState),
    stableOrdinal: offset + risk.stableOrdinal,
  }));
}

function missingInputDestinations(items: DecisionCockpitMissingInputProjection[], base: DestinationBase, offset: number) {
  return items.map((item) => destination({
    ...base,
    workspaceId: item.workspaceId ?? base.workspaceId,
    dealId: item.dealId ?? base.dealId,
    destinationType: item.status === "conflicted" ? "conflict_detail" : "missing_input_detail",
    governingModule: moduleFromString(item.sourceModule),
    canonicalRecordType: item.status === "conflicted" ? "conflict" : "missing_input",
    canonicalRecordId: item.missingInputId,
    routeId: "decision_cockpit.work",
    section: "work",
    requiredPermission: item.status === "missing" ? "deals:manage" : "deals:read",
    availability: availabilityFromPanelState(item.staleState),
    stableOrdinal: offset + item.stableOrdinal,
  }));
}

function actionDestinations(items: DecisionCockpitNextActionProjection[], base: DestinationBase, offset: number) {
  return items.map((item) => destination({
    ...base,
    workspaceId: item.workspaceId ?? base.workspaceId,
    dealId: item.dealId,
    propertyId: item.propertyId ?? base.propertyId,
    destinationType: item.relatedTaskId ? "task_detail" : item.relatedDeadlineId ? "deadline_detail" : "governing_workflow",
    governingModule: moduleFromWorkflow(item.workflowDestination.moduleId),
    canonicalRecordType: item.relatedTaskId ? "task" : item.relatedDeadlineId ? "deadline" : "recommendation",
    canonicalRecordId: item.relatedTaskId ?? item.relatedDeadlineId ?? item.sourceId,
    snapshot: {
      snapshotId: item.snapshotId,
      underwritingRunId: item.underwritingRunId,
    },
    routeId: item.relatedTaskId || item.relatedDeadlineId ? "decision_cockpit.work" : routeForWorkflow(item.workflowDestination.destination),
    section: sectionFromWorkflow(item.workflowDestination.destination),
    requiredPermission: item.requiredPermission,
    availability: availabilityFromWorkflow(item.workflowAvailability),
    state: stateFromPanel(item.staleState),
    stableOrdinal: offset + item.stableOrdinal,
  }));
}

function deadlineDestinations(items: DecisionCockpitDeadlineProjection[], base: DestinationBase, offset: number) {
  return items.map((item) => destination({
    ...base,
    workspaceId: item.workspaceId ?? base.workspaceId,
    dealId: item.dealId,
    destinationType: "deadline_detail",
    governingModule: "DealWork",
    canonicalRecordType: "deadline",
    canonicalRecordId: item.deadlineId,
    routeId: "decision_cockpit.work",
    section: "work",
    requiredPermission: "deals:read",
    availability: availabilityFromPanelState(item.staleState),
    state: item.deadlineStatus === "superseded" ? "superseded" : item.deadlineStatus === "cancelled" ? "archived" : "current",
    stableOrdinal: offset + item.stableOrdinal,
  }));
}

function historyDestinations(items: DecisionCockpitReadProjection["changeHistory"]["items"], base: DestinationBase, offset: number) {
  return items.map((item) => destination({
    ...base,
    workspaceId: item.workspaceId ?? base.workspaceId,
    dealId: item.dealId,
    propertyId: item.propertyId ?? base.propertyId,
    destinationType: "history_entry",
    governingModule: "DecisionCockpit",
    canonicalRecordType: "history_entry",
    canonicalRecordId: item.entryId,
    exactRecordVersion: item.sourceVersion,
    snapshot: {
      snapshotId: item.snapshotReference,
      scenarioId: item.scenarioReference,
    },
    routeId: "decision_cockpit.history",
    section: "history",
    state: item.historyState,
    availability: availabilityFromHistory(item.historyState),
    stableOrdinal: offset + item.stableOrdinal,
  }));
}

type DestinationBase = {
  workspaceId?: string;
  dealId: string;
  propertyId?: string;
  availability: DecisionCockpitDestinationAvailability;
};

function destination(input: Omit<DecisionCockpitDestinationReference, "destinationId" | "routeParams" | "returnContext" | "deterministicHash" | "state" | "requiredPermission" | "fallbackDestinationId"> & {
  section: DecisionCockpitRouteSection;
  state?: DecisionCockpitDestinationReference["state"];
  requiredPermission?: string;
  fallbackDestinationId?: string;
}): DecisionCockpitDestinationReference {
  const destinationId = `dc_dest_${stableHash({
    type: input.destinationType,
    dealId: input.dealId,
    recordType: input.canonicalRecordType,
    recordId: input.canonicalRecordId,
    version: input.exactRecordVersion,
    stableOrdinal: input.stableOrdinal,
  }).slice(3)}`;
  return {
    ...input,
    destinationId,
    state: input.state ?? "current",
    fallbackDestinationId: input.fallbackDestinationId ?? `dc_dest_${stableHash({ type: "deal_overview", dealId: input.dealId, recordType: "deal", recordId: input.dealId, stableOrdinal: 10 }).slice(3)}`,
    routeParams: {
      dealId: input.dealId,
      section: input.section,
      focus: input.destinationType,
    },
    requiredPermission: input.requiredPermission ?? "deals:read",
    returnContext: {
      dealId: input.dealId,
      section: input.section,
      destinationId,
    },
    deterministicHash: "",
  };
}

function availabilityFromWorkflow(status: DecisionCockpitWorkflowAvailability): DecisionCockpitDestinationAvailability {
  if (status === "available") return "available";
  if (status === "permission_restricted") return "permission_restricted";
  if (status === "stale") return "stale";
  return "unavailable_module";
}

function availabilityFromPanelState(state: string): DecisionCockpitDestinationAvailability {
  if (state === "permission_restricted") return "permission_restricted";
  if (state === "stale") return "stale";
  if (state === "unavailable") return "record_not_found";
  return "available";
}

function availabilityFromHistory(state: string): DecisionCockpitDestinationAvailability {
  if (state === "historical") return "historical";
  if (state === "superseded") return "superseded";
  if (state === "archived" || state === "rejected") return "archived";
  return "available";
}

function stateFromPanel(state: string): DecisionCockpitDestinationReference["state"] {
  if (state === "stale") return "historical";
  if (state === "unavailable") return "unavailable";
  return "current";
}

function routeForWorkflow(destination: string) {
  if (destination === "underwriting_inputs") return "decision_cockpit.underwriting";
  if (destination === "strategy_review") return "decision_cockpit.strategy";
  if (destination === "deal_work") return "decision_cockpit.work";
  if (destination === "evidence_review") return "decision_cockpit.evidence";
  return "decision_cockpit.overview";
}

function sectionFromWorkflow(destination: string): DecisionCockpitRouteSection {
  if (destination === "underwriting_inputs") return "underwriting";
  if (destination === "strategy_review") return "strategies";
  if (destination === "deal_work") return "work";
  if (destination === "evidence_review") return "underwriting";
  return "overview";
}

function moduleFromWorkflow(moduleId: string): DecisionCockpitGoverningModule {
  if (moduleId === "DealWork") return "DealWork";
  if (moduleId === "Underwriting") return "Underwriting";
  if (moduleId === "Strategy") return "Strategy";
  if (moduleId === "Evidence") return "Evidence";
  return "DecisionCockpit";
}

function moduleFromString(value: string): DecisionCockpitGoverningModule {
  const normalized = value.toLowerCase();
  if (normalized.includes("financeiq") || normalized.includes("financing")) return "FinanceIQ";
  if (normalized.includes("underwriting") || normalized.includes("market") || normalized.includes("finance")) return "Underwriting";
  if (normalized.includes("strategy")) return "Strategy";
  if (normalized.includes("evidence") || normalized.includes("source")) return "Evidence";
  if (normalized.includes("work") || normalized.includes("task") || normalized.includes("deadline")) return "DealWork";
  return "DecisionCockpit";
}

function safeDealPath(dealId: string) {
  return isSafeDealId(dealId) ? `/deals/${encodeURIComponent(dealId)}` : "/deals";
}

function isSafeDealId(value: string) {
  return /^[A-Za-z0-9._:-]{1,160}$/.test(value);
}

function isSafeSection(value: string): value is DecisionCockpitRouteSection {
  return ["overview", "property", "underwriting", "strategies", "financeiq", "work", "history"].includes(value);
}

function isSafeFocus(value: string): value is DecisionCockpitDestinationType {
  return [
    "deal_overview",
    "property_detail",
    "underwriting_summary",
    "underwriting_input",
    "underwriting_output",
    "formula_lineage",
    "snapshot_detail",
    "scenario_detail",
    "sensitivity_detail",
    "strategy_overview",
    "strategy_result",
    "strategy_comparison",
    "financeiq_overview",
    "financing_structure",
    "financing_condition",
    "financing_covenant",
    "financing_comparison",
    "recommendation_detail",
    "risk_detail",
    "missing_input_detail",
    "assumption_detail",
    "conflict_detail",
    "task_detail",
    "deadline_detail",
    "history_entry",
    "report_preview",
    "source_record",
    "evidence_item",
    "evidence_anchor",
    "professional_review",
    "governing_workflow",
  ].includes(value);
}

function destinationHashBasis(destination: DecisionCockpitDestinationReference) {
  return {
    destinationId: destination.destinationId,
    destinationType: destination.destinationType,
    governingModule: destination.governingModule,
    workspaceId: destination.workspaceId,
    dealId: destination.dealId,
    propertyId: destination.propertyId,
    canonicalRecordType: destination.canonicalRecordType,
    canonicalRecordId: destination.canonicalRecordId,
    exactRecordVersion: destination.exactRecordVersion,
    snapshot: destination.snapshot,
    source: destination.source,
    routeId: destination.routeId,
    routeParams: destination.routeParams,
    requiredPermission: destination.requiredPermission,
    availability: destination.availability,
    state: destination.state,
    fallbackDestinationId: destination.fallbackDestinationId,
    returnContext: destination.returnContext,
    stableOrdinal: destination.stableOrdinal,
  };
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

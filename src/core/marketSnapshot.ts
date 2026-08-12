import type { CanonicalMarketFreshnessState } from "./marketFreshness";
import type { GeographicLevel, LocationVerificationState, SourceEvidenceReference } from "./locationIdentity";
import type { MarketProviderProvenance, MarketSourceDataset, MarketSourceModule } from "./marketSourceIngestion";
import type { ProviderConfidence, ProviderState } from "./providerAdapters";

export const MARKET_SNAPSHOT_CONTRACT_VERSION = "market-snapshot-v1";
export const MARKET_METRIC_CONTRACT_VERSION = "market-metric-v1";
export const MARKET_FINDING_CONTRACT_VERSION = "market-finding-v1";
export const MARKET_CONFLICT_CONTRACT_VERSION = "market-conflict-v1";
export const MARKET_PROPOSAL_REFERENCE_CONTRACT_VERSION = "market-proposal-reference-v1";
export const MARKET_DOWNSTREAM_PROJECTION_CONTRACT_VERSION = "market-downstream-projection-v1";

export const marketSnapshotLifecycleStates = [
  "not_requested",
  "queued",
  "processing",
  "partial",
  "current",
  "current_with_conflicts",
  "stale",
  "provider_unavailable",
  "failed_with_prior_snapshot",
  "awaiting_verification",
  "offline_cached",
] as const;

export const marketMetricClassifications = [
  "confirmed_fact",
  "user_entered_fact",
  "external_estimate",
  "system_estimate",
  "user_assumption",
  "ai_observation",
  "professional_opinion",
  "inference",
  "unknown",
  "conflict",
] as const;

export const marketMetricTemporalStates = ["historical", "current", "projected", "inferred", "unknown"] as const;
export const marketMissingDataStates = ["none", "partial", "material_missing", "blocked", "unknown"] as const;
export const marketConflictStates = ["none", "unresolved", "retained", "resolved", "unknown"] as const;
export const marketModuleCoverageStates = [
  "not_requested",
  "available",
  "partial",
  "stale",
  "conflicted",
  "provider_unavailable",
  "failed",
  "missing",
  "awaiting_verification",
  "offline_cached",
] as const;

export const marketFindingTypes = [
  "market_context",
  "market_risk_context",
  "market_opportunity_context",
  "missing_data",
  "conflict",
  "stale_data",
  "provider_unavailable",
  "verification_needed",
  "strategy_impact_reference",
] as const;

export const marketFindingSeverities = ["informational", "watch", "material", "blocking"] as const;
export const marketFindingImpacts = [
  "decision_context",
  "assumption_review",
  "strategy_confidence_review",
  "verification_needed",
  "professional_review_recommended",
  "no_action",
] as const;

export const marketConflictCategories = [
  "provider",
  "period",
  "geography",
  "method",
  "classification",
  "property_segment",
  "overlapping_source_record",
  "freshness",
  "value",
  "unknown",
] as const;

export const marketConflictMaterialities = ["informational", "material", "blocking"] as const;
export const marketConflictResolutionStates = [
  "unresolved",
  "accepted_primary",
  "retained_conflict",
  "superseded",
  "resolved_by_verified_evidence",
] as const;

export const marketProposalKinds = [
  "rent_assumption_review",
  "growth_assumption_review",
  "vacancy_assumption_review",
  "exit_liquidity_assumption_review",
  "hold_period_review",
  "str_viability_review",
  "development_absorption_review",
  "commercial_demand_review",
  "financing_feasibility_review",
  "insurance_feasibility_review",
  "strategy_confidence_review",
  "verification_task",
] as const;

export const marketProposalTargets = ["underwriting", "strategy", "task", "decision_cockpit", "report", "portfolio"] as const;
export const marketProposalStatuses = ["proposed", "accepted", "rejected", "deferred"] as const;
export const marketReevaluationTriggers = [
  "none",
  "targeted_underwriting",
  "targeted_strategy",
  "task_creation",
  "report_stale",
] as const;

const unsupportedMarketClaims = [
  "safe neighborhood",
  "unsafe neighborhood",
  "good schools",
  "bad schools",
  "tenant quality",
  "guaranteed appreciation",
  "guaranteed rent",
  "crime-free",
  "no crime",
] as const;

export type MarketSnapshotLifecycleState = typeof marketSnapshotLifecycleStates[number];
export type MarketMetricClassification = typeof marketMetricClassifications[number];
export type MarketMetricTemporalState = typeof marketMetricTemporalStates[number];
export type MarketMissingDataState = typeof marketMissingDataStates[number];
export type MarketConflictState = typeof marketConflictStates[number];
export type MarketModuleCoverageState = typeof marketModuleCoverageStates[number];
export type MarketFindingType = typeof marketFindingTypes[number];
export type MarketFindingSeverity = typeof marketFindingSeverities[number];
export type MarketFindingImpact = typeof marketFindingImpacts[number];
export type MarketConflictCategory = typeof marketConflictCategories[number];
export type MarketConflictMateriality = typeof marketConflictMaterialities[number];
export type MarketConflictResolutionState = typeof marketConflictResolutionStates[number];
export type MarketProposalKind = typeof marketProposalKinds[number];
export type MarketProposalTarget = typeof marketProposalTargets[number];
export type MarketProposalStatus = typeof marketProposalStatuses[number];
export type MarketReevaluationTrigger = typeof marketReevaluationTriggers[number];

export type MarketSnapshotGeography = {
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  canonicalLocationId?: string;
  boundaryId?: string;
  boundaryVersion?: string;
  relationship?: "subject_property" | "containing_area" | "proxy_area" | "comparison_area";
  proxy: boolean;
  proxyReason?: string;
};

export type MarketSnapshotPeriod = {
  asOfDate: string;
  periodStart?: string;
  periodEnd?: string;
  periodLabel?: string;
  timeSemantics?: "observed" | "effective" | "published" | "retrieved" | "mixed" | "unknown";
  historical: boolean;
  current: boolean;
  projected: boolean;
  inferred: boolean;
};

export type MarketProviderCoverage = {
  providerId: string;
  providerVersion?: string;
  providerState: ProviderState;
  modules: readonly MarketSourceModule[];
  datasets: readonly MarketSourceDataset[];
  recordCount: number;
  confidence: ProviderConfidence;
  freshnessState?: CanonicalMarketFreshnessState;
  limitations: readonly string[];
};

export type MarketModuleCoverage = {
  module: MarketSourceModule;
  status: MarketModuleCoverageState;
  metricCount: number;
  findingCount: number;
  conflictCount: number;
  missingDataCount: number;
  providerStates: readonly ProviderState[];
  freshnessState?: CanonicalMarketFreshnessState;
  confidence?: ProviderConfidence;
};

export type CanonicalMarketMetric = {
  metricId: string;
  snapshotId?: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  module: MarketSourceModule;
  metricType: string;
  category?: string;
  geography: MarketSnapshotGeography;
  period: MarketSnapshotPeriod;
  value: string | number | boolean | null;
  unit: string;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance: readonly MarketProviderProvenance[];
  observationTime?: string;
  effectiveTime?: string;
  publicationTime?: string;
  retrievalTime?: string;
  classification: MarketMetricClassification;
  confidence: ProviderConfidence;
  freshnessState: CanonicalMarketFreshnessState;
  verificationState: LocationVerificationState;
  method: string;
  propertySegment?: string;
  temporalState: MarketMetricTemporalState;
  limitations: readonly string[];
  sourceContractVersion?: string;
  sourceRecordType?: string;
  sourceRecordHash?: string;
  materialHash: string;
  contractVersion: typeof MARKET_METRIC_CONTRACT_VERSION;
};

export type MarketAssumptionProposalReference = {
  proposalReferenceId: string;
  workspaceId: string;
  dealId: string;
  propertyId?: string;
  proposalKind: MarketProposalKind;
  sourceFindingId?: string;
  sourceMetricIds: readonly string[];
  targetSystem: MarketProposalTarget;
  targetField?: string;
  status: MarketProposalStatus;
  reevaluationTrigger: MarketReevaluationTrigger;
  underwritingMutationAllowed: false;
  strategyMutationAllowed: false;
  materialHash: string;
  contractVersion: typeof MARKET_PROPOSAL_REFERENCE_CONTRACT_VERSION;
};

export type CanonicalMarketFinding = {
  findingId: string;
  snapshotId?: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  findingType: MarketFindingType;
  summaryCode: string;
  impact: MarketFindingImpact;
  severity: MarketFindingSeverity;
  applicableStrategies: readonly string[];
  supportingMetricIds: readonly string[];
  supportingEvidenceReferences: readonly SourceEvidenceReference[];
  geography: MarketSnapshotGeography;
  timeframe: MarketSnapshotPeriod;
  method: string;
  confidence: ProviderConfidence;
  freshnessState: CanonicalMarketFreshnessState;
  verificationState: LocationVerificationState;
  limitations: readonly string[];
  suggestedAction?: string;
  proposalReferences: readonly MarketAssumptionProposalReference[];
  explanationCodes: readonly string[];
  sourceModule?: MarketSourceModule;
  sourceFindingId?: string;
  sourceFindingHash?: string;
  unsupportedConclusion: false;
  underwritingMutationAllowed: false;
  strategyMutationAllowed: false;
  materialHash: string;
  contractVersion: typeof MARKET_FINDING_CONTRACT_VERSION;
};

export type MarketConflictRecordReference = {
  recordId: string;
  module?: MarketSourceModule;
  providerId?: string;
  sourceRecordId?: string;
  metricId?: string;
  findingId?: string;
  value?: string | number | boolean | null;
  classification?: MarketMetricClassification;
  geographyIdentity?: string;
  periodLabel?: string;
  method?: string;
  propertySegment?: string;
  evidenceReference?: SourceEvidenceReference;
};

export type CanonicalMarketConflict = {
  conflictId: string;
  snapshotId?: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  conflictCategory: MarketConflictCategory;
  materiality: MarketConflictMateriality;
  resolutionState: MarketConflictResolutionState;
  conflictingRecordReferences: readonly MarketConflictRecordReference[];
  retainedValues: readonly (string | number | boolean | null)[];
  explanationCodes: readonly string[];
  reviewRequired: boolean;
  geography?: MarketSnapshotGeography;
  period?: MarketSnapshotPeriod;
  materialHash: string;
  contractVersion: typeof MARKET_CONFLICT_CONTRACT_VERSION;
};

export type CanonicalMarketSnapshot = {
  snapshotId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  canonicalLocationId?: string;
  geography: MarketSnapshotGeography;
  asOfDate: string;
  analysisPeriod: MarketSnapshotPeriod;
  workflowVersion: string;
  modelVersion: string;
  lifecycleState: MarketSnapshotLifecycleState;
  confidence: ProviderConfidence;
  freshnessState: CanonicalMarketFreshnessState;
  createdBy?: string;
  createdAt: string;
  serverTimeSemantics: "server_supplied" | "imported_canonical_time";
  providerCoverage: readonly MarketProviderCoverage[];
  moduleCoverage: readonly MarketModuleCoverage[];
  missingDataState: MarketMissingDataState;
  conflictState: MarketConflictState;
  metricIds: readonly string[];
  findingIds: readonly string[];
  conflictIds: readonly string[];
  proposalReferenceIds: readonly string[];
  priorSnapshotId?: string;
  priorSnapshotRetained: boolean;
  sourceRecordHashes: readonly string[];
  persistenceState: "contract_only";
  materialHash: string;
  contractVersion: typeof MARKET_SNAPSHOT_CONTRACT_VERSION;
};

export type MarketSnapshotProjection = {
  projectionId: string;
  snapshotId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  lifecycleState: MarketSnapshotLifecycleState;
  confidence: ProviderConfidence;
  freshnessState: CanonicalMarketFreshnessState;
  metricCount: number;
  findingCount: number;
  conflictCount: number;
  proposalReferenceCount: number;
  moduleCoverage: readonly MarketModuleCoverage[];
  unresolvedConflictIds: readonly string[];
  materialFindingIds: readonly string[];
  proposalReferences: readonly MarketAssumptionProposalReference[];
  underwritingMutationAllowed: false;
  strategyMutationAllowed: false;
  materialHash: string;
  contractVersion: typeof MARKET_DOWNSTREAM_PROJECTION_CONTRACT_VERSION;
};

export type MarketSnapshotScope = {
  workspaceId: string;
  dealId: string;
  propertyId: string;
};

export function createCanonicalMarketMetric(
  input: Omit<CanonicalMarketMetric, "materialHash" | "contractVersion">,
): CanonicalMarketMetric {
  const metric: Omit<CanonicalMarketMetric, "materialHash" | "contractVersion"> = {
    ...input,
    metricId: requiredClean(input.metricId, "Market metric requires metric id."),
    workspaceId: requiredClean(input.workspaceId, "Market metric requires workspace id."),
    dealId: requiredClean(input.dealId, "Market metric requires deal id."),
    propertyId: requiredClean(input.propertyId, "Market metric requires property id."),
    metricType: requiredClean(input.metricType, "Market metric requires metric type."),
    category: clean(input.category),
    geography: normalizeGeography(input.geography),
    period: normalizePeriod(input.period),
    unit: requiredClean(input.unit, "Market metric requires unit."),
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    sourceRecordId: clean(input.sourceRecordId),
    sourceRecordKey: clean(input.sourceRecordKey),
    provenance: sortProvenance(input.provenance),
    observationTime: clean(input.observationTime),
    effectiveTime: clean(input.effectiveTime),
    publicationTime: clean(input.publicationTime),
    retrievalTime: clean(input.retrievalTime),
    method: requiredClean(input.method, "Market metric requires method."),
    propertySegment: clean(input.propertySegment),
    limitations: uniqueSorted([
      ...input.limitations.map(clean).filter(isPresent),
      ...(input.provenance.length === 0 ? ["missing_provenance"] : []),
      ...(input.evidenceReference ? [] : ["missing_evidence_reference"]),
    ]),
    sourceContractVersion: clean(input.sourceContractVersion),
    sourceRecordType: clean(input.sourceRecordType),
    sourceRecordHash: clean(input.sourceRecordHash),
  };

  return {
    ...metric,
    materialHash: stableHash(metric),
    contractVersion: MARKET_METRIC_CONTRACT_VERSION,
  };
}

export function createMarketAssumptionProposalReference(
  input: Omit<
    MarketAssumptionProposalReference,
    "materialHash" | "contractVersion" | "underwritingMutationAllowed" | "strategyMutationAllowed"
  >,
): MarketAssumptionProposalReference {
  const proposal: Omit<MarketAssumptionProposalReference, "materialHash" | "contractVersion"> = {
    ...input,
    proposalReferenceId: requiredClean(input.proposalReferenceId, "Market proposal reference requires id."),
    workspaceId: requiredClean(input.workspaceId, "Market proposal reference requires workspace id."),
    dealId: requiredClean(input.dealId, "Market proposal reference requires deal id."),
    propertyId: clean(input.propertyId),
    sourceFindingId: clean(input.sourceFindingId),
    sourceMetricIds: uniqueSorted(input.sourceMetricIds.map(clean).filter(isPresent)),
    targetField: clean(input.targetField),
    underwritingMutationAllowed: false,
    strategyMutationAllowed: false,
  };

  return {
    ...proposal,
    materialHash: stableHash(proposal),
    contractVersion: MARKET_PROPOSAL_REFERENCE_CONTRACT_VERSION,
  };
}

export function createCanonicalMarketFinding(
  input: Omit<
    CanonicalMarketFinding,
    "materialHash" | "contractVersion" | "unsupportedConclusion" | "underwritingMutationAllowed" | "strategyMutationAllowed"
  >,
): CanonicalMarketFinding {
  assertNoUnsupportedMarketConclusion(input.summaryCode);
  if (input.suggestedAction) assertNoUnsupportedMarketConclusion(input.suggestedAction);

  const finding: Omit<CanonicalMarketFinding, "materialHash" | "contractVersion"> = {
    ...input,
    findingId: requiredClean(input.findingId, "Market finding requires finding id."),
    workspaceId: requiredClean(input.workspaceId, "Market finding requires workspace id."),
    dealId: requiredClean(input.dealId, "Market finding requires deal id."),
    propertyId: requiredClean(input.propertyId, "Market finding requires property id."),
    summaryCode: requiredClean(input.summaryCode, "Market finding requires summary code."),
    applicableStrategies: uniqueSorted(input.applicableStrategies.map(clean).filter(isPresent)),
    supportingMetricIds: uniqueSorted(input.supportingMetricIds.map(clean).filter(isPresent)),
    supportingEvidenceReferences: sortEvidence(input.supportingEvidenceReferences),
    geography: normalizeGeography(input.geography),
    timeframe: normalizePeriod(input.timeframe),
    method: requiredClean(input.method, "Market finding requires method."),
    limitations: uniqueSorted([
      ...input.limitations.map(clean).filter(isPresent),
      ...(input.supportingMetricIds.length === 0 && input.supportingEvidenceReferences.length === 0
        ? ["insufficient_supporting_context"]
        : []),
    ]),
    suggestedAction: clean(input.suggestedAction),
    proposalReferences: sortProposals(input.proposalReferences),
    explanationCodes: uniqueSorted(input.explanationCodes.map(clean).filter(isPresent)),
    sourceFindingId: clean(input.sourceFindingId),
    sourceFindingHash: clean(input.sourceFindingHash),
    unsupportedConclusion: false,
    underwritingMutationAllowed: false,
    strategyMutationAllowed: false,
  };

  return {
    ...finding,
    materialHash: stableHash(finding),
    contractVersion: MARKET_FINDING_CONTRACT_VERSION,
  };
}

export function createCanonicalMarketConflict(
  input: Omit<CanonicalMarketConflict, "materialHash" | "contractVersion" | "reviewRequired"> & {
    reviewRequired?: boolean;
  },
): CanonicalMarketConflict {
  const conflict: Omit<CanonicalMarketConflict, "materialHash" | "contractVersion"> = {
    ...input,
    conflictId: requiredClean(input.conflictId, "Market conflict requires conflict id."),
    workspaceId: requiredClean(input.workspaceId, "Market conflict requires workspace id."),
    dealId: requiredClean(input.dealId, "Market conflict requires deal id."),
    propertyId: requiredClean(input.propertyId, "Market conflict requires property id."),
    conflictingRecordReferences: sortConflictReferences(input.conflictingRecordReferences),
    retainedValues: [...input.retainedValues],
    explanationCodes: uniqueSorted(input.explanationCodes.map(clean).filter(isPresent)),
    reviewRequired: input.reviewRequired ?? input.resolutionState === "unresolved",
    geography: input.geography ? normalizeGeography(input.geography) : undefined,
    period: input.period ? normalizePeriod(input.period) : undefined,
  };

  return {
    ...conflict,
    materialHash: stableHash(conflict),
    contractVersion: MARKET_CONFLICT_CONTRACT_VERSION,
  };
}

export function assessCanonicalMarketMetricCompatibility(
  left: CanonicalMarketMetric,
  right: CanonicalMarketMetric,
): {
  compatible: boolean;
  conflictCategories: readonly MarketConflictCategory[];
} {
  const categories: MarketConflictCategory[] = [];

  if (left.geography.geographyIdentity !== right.geography.geographyIdentity) categories.push("geography");
  if (periodKey(left.period) !== periodKey(right.period)) categories.push("period");
  if (left.method !== right.method) categories.push("method");
  if (left.classification !== right.classification) categories.push("classification");
  if ((left.propertySegment ?? "") !== (right.propertySegment ?? "")) categories.push("property_segment");
  if ((left.sourceRecordKey ?? left.sourceRecordId ?? "") === (right.sourceRecordKey ?? right.sourceRecordId ?? "")) {
    categories.push("overlapping_source_record");
  }
  if (left.value !== right.value && left.metricType === right.metricType && left.unit === right.unit) categories.push("value");

  return {
    compatible: categories.length === 0,
    conflictCategories: uniqueSorted(categories),
  };
}

export function createCanonicalMarketSnapshot(input: {
  snapshotId: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  canonicalLocationId?: string;
  geography: MarketSnapshotGeography;
  asOfDate: string;
  analysisPeriod: MarketSnapshotPeriod;
  workflowVersion: string;
  modelVersion: string;
  lifecycleState?: MarketSnapshotLifecycleState;
  confidence?: ProviderConfidence;
  freshnessState?: CanonicalMarketFreshnessState;
  createdBy?: string;
  createdAt: string;
  serverTimeSemantics: CanonicalMarketSnapshot["serverTimeSemantics"];
  providerCoverage?: readonly MarketProviderCoverage[];
  moduleCoverage?: readonly MarketModuleCoverage[];
  missingDataState?: MarketMissingDataState;
  conflictState?: MarketConflictState;
  metrics: readonly CanonicalMarketMetric[];
  findings: readonly CanonicalMarketFinding[];
  conflicts: readonly CanonicalMarketConflict[];
  proposalReferences?: readonly MarketAssumptionProposalReference[];
  priorSnapshotId?: string;
  priorSnapshotRetained?: boolean;
}): CanonicalMarketSnapshot {
  const scope = normalizeScope(input);
  const metrics = assertScoped("metric", input.metrics, scope);
  const findings = assertScoped("finding", input.findings, scope);
  const conflicts = assertScoped("conflict", input.conflicts, scope);
  const proposals = assertScoped("proposal reference", input.proposalReferences ?? [], scope);
  const providerCoverage = input.providerCoverage ? sortProviderCoverage(input.providerCoverage) : deriveProviderCoverage(metrics);
  const moduleCoverage = input.moduleCoverage ? sortModuleCoverage(input.moduleCoverage) : deriveModuleCoverage(metrics, findings, conflicts);
  const conflictState = input.conflictState ?? deriveConflictState(conflicts);
  const missingDataState = input.missingDataState ?? deriveMissingDataState(findings, moduleCoverage);
  const freshnessState = input.freshnessState ?? deriveFreshnessState(metrics);
  const confidence = input.confidence ?? deriveConfidence(metrics, findings);
  const lifecycleState =
    input.lifecycleState ??
    deriveLifecycleState({
      conflictState,
      missingDataState,
      freshnessState,
      providerCoverage,
      priorSnapshotId: input.priorSnapshotId,
    });

  const snapshot: Omit<CanonicalMarketSnapshot, "materialHash" | "contractVersion"> = {
    snapshotId: requiredClean(input.snapshotId, "Market snapshot requires snapshot id."),
    workspaceId: scope.workspaceId,
    dealId: scope.dealId,
    propertyId: scope.propertyId,
    canonicalLocationId: clean(input.canonicalLocationId),
    geography: normalizeGeography(input.geography),
    asOfDate: requiredClean(input.asOfDate, "Market snapshot requires as-of date."),
    analysisPeriod: normalizePeriod(input.analysisPeriod),
    workflowVersion: requiredClean(input.workflowVersion, "Market snapshot requires workflow version."),
    modelVersion: requiredClean(input.modelVersion, "Market snapshot requires model version."),
    lifecycleState,
    confidence,
    freshnessState,
    createdBy: clean(input.createdBy),
    createdAt: requiredClean(input.createdAt, "Market snapshot requires created-at timestamp."),
    serverTimeSemantics: input.serverTimeSemantics,
    providerCoverage,
    moduleCoverage,
    missingDataState,
    conflictState,
    metricIds: uniqueSorted(metrics.map((metric) => metric.metricId)),
    findingIds: uniqueSorted(findings.map((finding) => finding.findingId)),
    conflictIds: uniqueSorted(conflicts.map((conflict) => conflict.conflictId)),
    proposalReferenceIds: uniqueSorted(proposals.map((proposal) => proposal.proposalReferenceId)),
    priorSnapshotId: clean(input.priorSnapshotId),
    priorSnapshotRetained: input.priorSnapshotRetained ?? Boolean(input.priorSnapshotId),
    sourceRecordHashes: uniqueSorted(metrics.map((metric) => metric.sourceRecordHash).filter(isPresent)),
    persistenceState: "contract_only",
  };

  return {
    ...snapshot,
    materialHash: stableHash(snapshot),
    contractVersion: MARKET_SNAPSHOT_CONTRACT_VERSION,
  };
}

export function projectCanonicalMarketSnapshot(
  snapshot: CanonicalMarketSnapshot,
  findings: readonly CanonicalMarketFinding[],
  proposalReferences: readonly MarketAssumptionProposalReference[],
): MarketSnapshotProjection {
  const scopedFindings = assertScoped("finding", findings, snapshot);
  const scopedProposals = assertScoped("proposal reference", proposalReferences, snapshot);
  const projection: Omit<MarketSnapshotProjection, "materialHash" | "contractVersion"> = {
    projectionId: stableHash({
      contract: MARKET_DOWNSTREAM_PROJECTION_CONTRACT_VERSION,
      snapshotId: snapshot.snapshotId,
      materialHash: snapshot.materialHash,
    }),
    snapshotId: snapshot.snapshotId,
    workspaceId: snapshot.workspaceId,
    dealId: snapshot.dealId,
    propertyId: snapshot.propertyId,
    lifecycleState: snapshot.lifecycleState,
    confidence: snapshot.confidence,
    freshnessState: snapshot.freshnessState,
    metricCount: snapshot.metricIds.length,
    findingCount: snapshot.findingIds.length,
    conflictCount: snapshot.conflictIds.length,
    proposalReferenceCount: snapshot.proposalReferenceIds.length,
    moduleCoverage: snapshot.moduleCoverage,
    unresolvedConflictIds: snapshot.conflictState === "unresolved" ? snapshot.conflictIds : [],
    materialFindingIds: scopedFindings
      .filter((finding) => finding.severity === "material" || finding.severity === "blocking")
      .map((finding) => finding.findingId)
      .sort(),
    proposalReferences: sortProposals(scopedProposals),
    underwritingMutationAllowed: false,
    strategyMutationAllowed: false,
  };

  return {
    ...projection,
    materialHash: stableHash(projection),
    contractVersion: MARKET_DOWNSTREAM_PROJECTION_CONTRACT_VERSION,
  };
}

export function assertNoUnsupportedMarketConclusion(text: string): void {
  const normalized = text.toLowerCase().replace(/[_-]+/g, " ");
  const match = unsupportedMarketClaims.find((claim) => normalized.includes(claim));
  if (match) {
    throw new Error(`MarketIQ finding contains unsupported market conclusion: ${match}.`);
  }
}

function normalizeScope(input: MarketSnapshotScope): MarketSnapshotScope {
  return {
    workspaceId: requiredClean(input.workspaceId, "Market snapshot requires workspace id."),
    dealId: requiredClean(input.dealId, "Market snapshot requires deal id."),
    propertyId: requiredClean(input.propertyId, "Market snapshot requires property id."),
  };
}

function assertScoped<T extends { workspaceId: string; dealId: string; propertyId?: string }>(
  label: string,
  records: readonly T[],
  scope: MarketSnapshotScope,
): readonly T[] {
  records.forEach((record) => {
    if (record.workspaceId !== scope.workspaceId) throw new Error(`Market ${label} belongs to a different workspace.`);
    if (record.dealId !== scope.dealId) throw new Error(`Market ${label} belongs to a different deal.`);
    if (record.propertyId && record.propertyId !== scope.propertyId) {
      throw new Error(`Market ${label} belongs to a different property.`);
    }
  });
  return records;
}

function deriveLifecycleState(input: {
  conflictState: MarketConflictState;
  missingDataState: MarketMissingDataState;
  freshnessState: CanonicalMarketFreshnessState;
  providerCoverage: readonly MarketProviderCoverage[];
  priorSnapshotId?: string;
}): MarketSnapshotLifecycleState {
  if (input.conflictState === "unresolved") return "current_with_conflicts";
  if (input.providerCoverage.some((provider) => provider.providerState === "offline" || provider.providerState === "maintenance")) {
    return input.priorSnapshotId ? "failed_with_prior_snapshot" : "provider_unavailable";
  }
  if (input.missingDataState === "blocked" || input.missingDataState === "material_missing") return "awaiting_verification";
  if (input.freshnessState === "stale" || input.freshnessState === "expired" || input.freshnessState === "review_due") return "stale";
  if (input.missingDataState === "partial") return "partial";
  return "current";
}

function deriveConflictState(conflicts: readonly CanonicalMarketConflict[]): MarketConflictState {
  if (conflicts.length === 0) return "none";
  if (conflicts.some((conflict) => conflict.resolutionState === "unresolved")) return "unresolved";
  if (conflicts.some((conflict) => conflict.resolutionState === "retained_conflict")) return "retained";
  return "resolved";
}

function deriveMissingDataState(
  findings: readonly CanonicalMarketFinding[],
  moduleCoverage: readonly MarketModuleCoverage[],
): MarketMissingDataState {
  if (findings.some((finding) => finding.findingType === "missing_data" && finding.severity === "blocking")) return "blocked";
  if (findings.some((finding) => finding.findingType === "missing_data" && finding.severity === "material")) return "material_missing";
  if (moduleCoverage.some((coverage) => coverage.missingDataCount > 0 || coverage.status === "partial" || coverage.status === "missing")) {
    return "partial";
  }
  return "none";
}

function deriveFreshnessState(metrics: readonly CanonicalMarketMetric[]): CanonicalMarketFreshnessState {
  if (metrics.some((metric) => metric.freshnessState === "conflicted")) return "conflicted";
  if (metrics.some((metric) => metric.freshnessState === "expired")) return "expired";
  if (metrics.some((metric) => metric.freshnessState === "stale")) return "stale";
  if (metrics.some((metric) => metric.freshnessState === "review_due")) return "review_due";
  if (metrics.some((metric) => metric.freshnessState === "missing_temporal_metadata")) return "missing_temporal_metadata";
  if (metrics.length === 0) return "unavailable";
  return "current";
}

function deriveConfidence(
  metrics: readonly CanonicalMarketMetric[],
  findings: readonly CanonicalMarketFinding[],
): ProviderConfidence {
  const confidences = [...metrics.map((metric) => metric.confidence), ...findings.map((finding) => finding.confidence)];
  if (confidences.length === 0) return "unknown";
  if (confidences.includes("unknown")) return "unknown";
  if (confidences.includes("estimated")) return "estimated";
  if (confidences.includes("source_backed")) return "source_backed";
  return "verified";
}

function deriveProviderCoverage(metrics: readonly CanonicalMarketMetric[]): readonly MarketProviderCoverage[] {
  const byProvider = new Map<string, CanonicalMarketMetric[]>();
  metrics.forEach((metric) => {
    const key = metric.providerId ?? "unattributed";
    byProvider.set(key, [...(byProvider.get(key) ?? []), metric]);
  });

  return [...byProvider.entries()]
    .map(([providerId, providerMetrics]) => ({
      providerId,
      providerVersion: providerMetrics.find((metric) => metric.providerVersion)?.providerVersion,
      providerState: providerMetrics.find((metric) => metric.providerState)?.providerState ?? "not_configured",
      modules: uniqueSorted(providerMetrics.map((metric) => metric.module)),
      datasets: [] as MarketSourceDataset[],
      recordCount: providerMetrics.length,
      confidence: deriveConfidence(providerMetrics, []),
      freshnessState: deriveFreshnessState(providerMetrics),
      limitations: uniqueSorted(providerMetrics.flatMap((metric) => metric.limitations)),
    }))
    .sort((left, right) => left.providerId.localeCompare(right.providerId));
}

function deriveModuleCoverage(
  metrics: readonly CanonicalMarketMetric[],
  findings: readonly CanonicalMarketFinding[],
  conflicts: readonly CanonicalMarketConflict[],
): readonly MarketModuleCoverage[] {
  const modules = uniqueSorted([
    ...metrics.map((metric) => metric.module),
    ...findings.map((finding) => finding.sourceModule).filter(isPresent),
    ...conflicts.flatMap((conflict) => conflict.conflictingRecordReferences.map((reference) => reference.module).filter(isPresent)),
  ]);

  return modules.map((module) => {
    const moduleMetrics = metrics.filter((metric) => metric.module === module);
    const moduleFindings = findings.filter((finding) => finding.sourceModule === module);
    const moduleConflicts = conflicts.filter((conflict) =>
      conflict.conflictingRecordReferences.some((reference) => reference.module === module),
    );
    const missingDataCount = moduleFindings.filter((finding) => finding.findingType === "missing_data").length;
    return {
      module,
      status: moduleConflicts.length > 0
        ? "conflicted"
        : missingDataCount > 0
          ? "partial"
          : moduleMetrics.some((metric) => metric.freshnessState === "stale" || metric.freshnessState === "expired")
            ? "stale"
            : "available",
      metricCount: moduleMetrics.length,
      findingCount: moduleFindings.length,
      conflictCount: moduleConflicts.length,
      missingDataCount,
      providerStates: uniqueSorted(moduleMetrics.map((metric) => metric.providerState).filter(isPresent)),
      freshnessState: deriveFreshnessState(moduleMetrics),
      confidence: deriveConfidence(moduleMetrics, moduleFindings),
    };
  });
}

function sortProviderCoverage(coverage: readonly MarketProviderCoverage[]): readonly MarketProviderCoverage[] {
  return coverage
    .map((provider) => ({
      ...provider,
      providerId: requiredClean(provider.providerId, "Market provider coverage requires provider id."),
      providerVersion: clean(provider.providerVersion),
      modules: uniqueSorted(provider.modules),
      datasets: uniqueSorted(provider.datasets),
      limitations: uniqueSorted(provider.limitations.map(clean).filter(isPresent)),
    }))
    .sort((left, right) => left.providerId.localeCompare(right.providerId));
}

function sortModuleCoverage(coverage: readonly MarketModuleCoverage[]): readonly MarketModuleCoverage[] {
  return coverage
    .map((module) => ({
      ...module,
      providerStates: uniqueSorted(module.providerStates),
    }))
    .sort((left, right) => left.module.localeCompare(right.module));
}

function normalizeGeography(input: MarketSnapshotGeography): MarketSnapshotGeography {
  const geography: MarketSnapshotGeography = {
    ...input,
    geographyIdentity: requiredClean(input.geographyIdentity, "Market geography requires identity."),
    canonicalLocationId: clean(input.canonicalLocationId),
    boundaryId: clean(input.boundaryId),
    boundaryVersion: clean(input.boundaryVersion),
    proxyReason: clean(input.proxyReason),
  };
  if (geography.proxy && !geography.proxyReason) throw new Error("Proxy market geography requires proxy reason.");
  return geography;
}

function normalizePeriod(input: MarketSnapshotPeriod): MarketSnapshotPeriod {
  return {
    ...input,
    asOfDate: requiredClean(input.asOfDate, "Market period requires as-of date."),
    periodStart: clean(input.periodStart),
    periodEnd: clean(input.periodEnd),
    periodLabel: clean(input.periodLabel),
  };
}

function sortProvenance(provenance: readonly MarketProviderProvenance[]): readonly MarketProviderProvenance[] {
  return [...provenance].sort((left, right) =>
    stableHash(left).localeCompare(stableHash(right)),
  );
}

function sortEvidence(evidence: readonly SourceEvidenceReference[]): readonly SourceEvidenceReference[] {
  return [...evidence].sort((left, right) => stableHash(left).localeCompare(stableHash(right)));
}

function sortProposals<T extends MarketAssumptionProposalReference>(proposals: readonly T[]): readonly T[] {
  return [...proposals].sort((left, right) => left.proposalReferenceId.localeCompare(right.proposalReferenceId));
}

function sortConflictReferences(references: readonly MarketConflictRecordReference[]): readonly MarketConflictRecordReference[] {
  return [...references].sort((left, right) => stableHash(left).localeCompare(stableHash(right)));
}

function periodKey(period: MarketSnapshotPeriod): string {
  return stableHash({
    asOfDate: period.asOfDate,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    periodLabel: period.periodLabel,
    temporal: {
      historical: period.historical,
      current: period.current,
      projected: period.projected,
      inferred: period.inferred,
    },
  });
}

function requiredClean(value: string | undefined, message: string): string {
  const cleaned = clean(value);
  if (!cleaned) throw new Error(message);
  return cleaned;
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isPresent<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}

function stableHash(input: unknown): string {
  let hash = 2166136261;
  const serialized = stableSerialize(input);
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `ms_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  return `{${Object.entries(value)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
    .join(",")}}`;
}

import type { CanonicalMarketFreshnessResult, CanonicalMarketFreshnessState } from "./marketFreshness";
import type { MarketProviderProvenance, MarketSourceDataset } from "./marketSourceIngestion";
import type { GeographicLevel, LocationVerificationState, SourceEvidenceReference } from "./locationIdentity";
import type { ProviderConfidence, ProviderState } from "./providerAdapters";

export const MARKET_INFRASTRUCTURE_CONTRACT_VERSION = "market-infrastructure-context-v1";
export const MARKET_INFRASTRUCTURE_REGISTRY_VERSION = "market-infrastructure-registry-v1";
export const MARKET_INFRASTRUCTURE_OBSERVATION_CONTRACT_VERSION = "market-infrastructure-observation-v1";
export const MARKET_INFRASTRUCTURE_FINDING_CONTRACT_VERSION = "market-infrastructure-finding-v1";
export const MARKET_INFRASTRUCTURE_CONFLICT_CONTRACT_VERSION = "market-infrastructure-conflict-v1";
export const MARKET_INFRASTRUCTURE_PROJECTION_CONTRACT_VERSION = "market-infrastructure-projection-v1";

export const marketInfrastructureCategories = [
  "transportation",
  "utilities",
  "development",
  "public_investment",
  "planning",
  "permitting",
  "pipeline",
] as const;

export const marketInfrastructureSubtypes = [
  "planned_road",
  "road_expansion",
  "interchange",
  "transit_extension",
  "rail_project",
  "station_project",
  "airport_project",
  "bike_pedestrian_project",
  "water_expansion",
  "sewer_expansion",
  "electric_grid",
  "gas_service",
  "broadband_expansion",
  "stormwater_project",
  "residential_development",
  "multifamily_development",
  "commercial_development",
  "industrial_development",
  "logistics_development",
  "mixed_use_development",
  "retail_development",
  "hospitality_development",
  "medical_development",
  "education_development",
  "civic_project",
  "school_project",
  "park_recreation",
  "streetscape",
  "downtown_redevelopment",
  "public_facility",
  "capital_improvement",
  "zoning_change",
  "rezoning_application",
  "land_use_plan",
  "comprehensive_plan",
  "annexation",
  "redevelopment_area",
  "special_district_plan",
  "development_pipeline",
  "permit_trend",
] as const;

export const marketInfrastructureProjectStatuses = [
  "conceptual",
  "proposed",
  "under_review",
  "approved",
  "funded",
  "permitted",
  "pre_construction",
  "under_construction",
  "partially_complete",
  "complete",
  "delayed",
  "paused",
  "cancelled",
  "superseded",
  "unknown",
] as const;

export const marketInfrastructureFundingStates = ["unfunded", "funding_proposed", "partially_funded", "funded", "funding_unknown"] as const;
export const marketInfrastructurePermitStates = ["application_submitted", "under_review", "approved", "denied", "expired", "withdrawn", "permit_issued", "permit_closed", "unknown"] as const;
export const marketInfrastructureApprovalStates = ["not_required", "not_submitted", "submitted", "under_review", "approved", "denied", "withdrawn", "expired", "unknown"] as const;
export const marketInfrastructureTimelineKinds = ["announced", "approval", "expected_start", "expected_completion", "actual_start", "actual_completion", "effective_period", "observation_period", "unknown"] as const;
export const marketInfrastructureDistanceMethods = ["straight_line", "drive_distance", "walk_distance", "corridor_adjacency", "within_boundary", "provider_reported", "unknown"] as const;
export const marketInfrastructureObservationMethods = ["authority_record", "planning_document", "permit_record", "capital_plan", "development_pipeline_record", "provider_normalized_record", "user_document", "professional_report", "calculated_from_source_values", "user_entered_evidence", "unknown"] as const;

export const marketInfrastructureFindingTypes = [
  "major_project_planned_nearby",
  "project_funded_not_started",
  "project_under_construction",
  "project_completed",
  "project_delayed",
  "project_cancelled",
  "utility_expansion_reported",
  "development_pipeline_reported",
  "permit_activity_changed",
  "zoning_change_proposed",
  "annexation_proposed",
  "public_investment_reported",
  "conflicting_project_status",
  "stale_project_timeline",
  "authority_verification_recommended",
] as const;

export const marketInfrastructureImpactClasses = ["informational", "assumption_review", "decision_context", "professional_review_required"] as const;
export const marketInfrastructureConflictStates = ["none", "source_disagreement", "project_status_disagreement", "timeline_disagreement", "funding_disagreement", "permit_disagreement", "zoning_plan_disagreement", "geography_conflict", "authority_provider_conflict", "current_stale_conflict", "unresolved"] as const;
export const marketInfrastructureDegradedStates = ["record_unavailable", "provider_unavailable", "authority_unavailable", "project_status_unknown", "timeline_unknown", "funding_unknown", "stale_prior_valid", "conflicting_sources", "unsupported_geography", "missing_temporal_metadata", "permission_restricted"] as const;
export const marketInfrastructureExplanationCodes = [
  "project_conceptual",
  "project_proposed",
  "project_approved",
  "project_funded",
  "project_under_construction",
  "project_completed",
  "project_delayed",
  "project_cancelled",
  "timeline_stale",
  "utility_expansion_reported",
  "development_pipeline_reported",
  "permit_activity_changed",
  "zoning_change_proposed",
  "annexation_proposed",
  "public_investment_reported",
  "conflicting_project_status",
  "authority_verification_recommended",
  "planned_not_completed",
  "proposed_not_approved",
  "funded_not_started",
  "permit_not_completion",
  "zoning_no_entitlement",
  "public_investment_not_guarantee",
  "underwriting_proposal_only",
  "professional_review_recommended",
] as const;

export type MarketInfrastructureCategory = typeof marketInfrastructureCategories[number];
export type MarketInfrastructureSubtype = typeof marketInfrastructureSubtypes[number];
export type MarketInfrastructureProjectStatus = typeof marketInfrastructureProjectStatuses[number];
export type MarketInfrastructureFundingState = typeof marketInfrastructureFundingStates[number];
export type MarketInfrastructurePermitState = typeof marketInfrastructurePermitStates[number];
export type MarketInfrastructureApprovalState = typeof marketInfrastructureApprovalStates[number];
export type MarketInfrastructureTimelineKind = typeof marketInfrastructureTimelineKinds[number];
export type MarketInfrastructureDistanceMethod = typeof marketInfrastructureDistanceMethods[number];
export type MarketInfrastructureObservationMethod = typeof marketInfrastructureObservationMethods[number];
export type MarketInfrastructureFindingType = typeof marketInfrastructureFindingTypes[number];
export type MarketInfrastructureImpactClass = typeof marketInfrastructureImpactClasses[number];
export type MarketInfrastructureConflictState = typeof marketInfrastructureConflictStates[number];
export type MarketInfrastructureDegradedState = typeof marketInfrastructureDegradedStates[number];
export type MarketInfrastructureExplanationCode = typeof marketInfrastructureExplanationCodes[number];
export type MarketInfrastructureLifecycleStatus = "active" | "deprecated" | "disabled";
export type MarketInfrastructureProfessionalBoundary = "municipal_verification" | "planning_or_zoning_review" | "utility_confirmation" | "engineering_review" | "attorney_review" | "title_or_survey_review" | "none";

export type MarketInfrastructureProjectReference = {
  projectId: string;
  projectName?: string;
  sponsorName?: string;
  authorityName?: string;
  developerName?: string;
  sourceReference?: SourceEvidenceReference;
};

export type MarketInfrastructureGeography = {
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  canonicalLocationId?: string;
  jurisdiction?: string;
  boundaryId?: string;
  boundaryVersion?: string;
  relationship: "on_site" | "nearby" | "within_boundary" | "corridor" | "market_area" | "proxy" | "unknown";
};

export type MarketInfrastructureProximity = {
  distance?: number;
  distanceUnit: "mi" | "km" | "ft" | "m" | "unknown";
  method: MarketInfrastructureDistanceMethod;
  relationship: MarketInfrastructureGeography["relationship"];
  sourceReference?: SourceEvidenceReference;
};

export type MarketInfrastructureTimeline = {
  announcedDate?: string;
  approvalDate?: string;
  expectedStart?: string;
  expectedCompletion?: string;
  actualStart?: string;
  actualCompletion?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  periodStart?: string;
  periodEnd?: string;
  retrievalTime?: string;
  timelineKind: MarketInfrastructureTimelineKind;
  projected: boolean;
  historical: boolean;
};

export type MarketInfrastructurePipelineMetrics = {
  unitsProposed?: number;
  unitsApproved?: number;
  unitsUnderConstruction?: number;
  unitsDelivered?: number;
  commercialSqFt?: number;
  industrialSqFt?: number;
  hotelRooms?: number;
  permitCount?: number;
  permitValue?: number;
  propertyTypeClass?: string;
  periodStart?: string;
  periodEnd?: string;
  noDoubleCountingBasis: "status_partitioned" | "source_declared" | "not_applicable" | "unknown";
};

export type MarketInfrastructureRegistryEntry = {
  contextId: string;
  semanticVersion: string;
  category: MarketInfrastructureCategory;
  subtype: MarketInfrastructureSubtype;
  dataset?: MarketSourceDataset;
  applicableGeographyLevels: readonly GeographicLevel[];
  supportedStatuses: readonly MarketInfrastructureProjectStatus[];
  supportedFundingStates: readonly MarketInfrastructureFundingState[];
  supportedPermitStates: readonly MarketInfrastructurePermitState[];
  supportedApprovalStates: readonly MarketInfrastructureApprovalState[];
  supportedObservationMethods: readonly MarketInfrastructureObservationMethod[];
  lifecycleStatus: MarketInfrastructureLifecycleStatus;
  professionalBoundary: MarketInfrastructureProfessionalBoundary;
  permittedProposalKinds: readonly string[];
  prohibitedInferenceCodes: readonly string[];
  replacementContextId?: string;
  replacementContextVersion?: string;
  registeredAt: string;
  contractVersion: typeof MARKET_INFRASTRUCTURE_CONTRACT_VERSION;
  materialHash: string;
};

export type MarketInfrastructureRegistry = {
  registryId: string;
  version: typeof MARKET_INFRASTRUCTURE_REGISTRY_VERSION;
  entries: MarketInfrastructureRegistryEntry[];
  materialHash: string;
};

export type MarketInfrastructureObservation = {
  observationId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  contextId: string;
  contextVersion: string;
  category: MarketInfrastructureCategory;
  subtype: MarketInfrastructureSubtype;
  project: MarketInfrastructureProjectReference;
  geography: MarketInfrastructureGeography;
  proximity?: MarketInfrastructureProximity;
  projectStatus: MarketInfrastructureProjectStatus;
  approvalState: MarketInfrastructureApprovalState;
  fundingState: MarketInfrastructureFundingState;
  permitState: MarketInfrastructurePermitState;
  timeline: MarketInfrastructureTimeline;
  pipelineMetrics?: MarketInfrastructurePipelineMetrics;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  dataset?: MarketSourceDataset;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance: MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  method: MarketInfrastructureObservationMethod;
  limitationCodes: string[];
  degradedStates: MarketInfrastructureDegradedState[];
  explanationCodes: MarketInfrastructureExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_INFRASTRUCTURE_OBSERVATION_CONTRACT_VERSION;
};

export type MarketInfrastructureFinding = {
  findingId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketInfrastructureFindingType;
  sourceObservationIds: string[];
  summaryCode: MarketInfrastructureExplanationCode;
  geography: MarketInfrastructureGeography;
  projectStatus: MarketInfrastructureProjectStatus;
  timeline: MarketInfrastructureTimeline;
  impactClass: MarketInfrastructureImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState;
  limitationCodes: string[];
  suggestedVerificationAction: MarketInfrastructureProfessionalBoundary;
  applicableStrategyReferences: string[];
  conflictState: MarketInfrastructureConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  professionalConclusionAllowed: false;
  stableOrdinal: number;
  deterministicHash: string;
  contractVersion: typeof MARKET_INFRASTRUCTURE_FINDING_CONTRACT_VERSION;
};

export type MarketInfrastructureConflictManifest = {
  conflictId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketInfrastructureConflictState, "none">;
  observationIds: string[];
  retainedObservationIds: string[];
  geography: MarketInfrastructureGeography;
  projectReferences: MarketInfrastructureProjectReference[];
  reasonCodes: MarketInfrastructureExplanationCode[];
  blockedUntilResolved: true;
  deterministicHash: string;
  contractVersion: typeof MARKET_INFRASTRUCTURE_CONFLICT_CONTRACT_VERSION;
};

export type MarketInfrastructureProjection = {
  findingId: string;
  findingType: MarketInfrastructureFindingType;
  sourceObservationIds: string[];
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  projectStatus: MarketInfrastructureProjectStatus;
  impactClass: MarketInfrastructureImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState;
  conflictState: MarketInfrastructureConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  contractVersion: typeof MARKET_INFRASTRUCTURE_PROJECTION_CONTRACT_VERSION;
  deterministicHash: string;
};

type InfrastructureEntryInput = Omit<MarketInfrastructureRegistryEntry, "contractVersion" | "materialHash">;

export function defineMarketInfrastructureRegistryEntry(input: InfrastructureEntryInput): MarketInfrastructureRegistryEntry {
  const contextId = normalizeId(input.contextId, "Market infrastructure registry entry requires a context ID.");
  const semanticVersion = requiredClean(input.semanticVersion, "Market infrastructure registry entry requires a semantic version.");
  if (!marketInfrastructureCategories.includes(input.category)) throw new Error("Market infrastructure category is not registered.");
  if (!marketInfrastructureSubtypes.includes(input.subtype)) throw new Error("Market infrastructure subtype is not registered.");
  if (input.lifecycleStatus === "disabled" && !input.replacementContextId) throw new Error("Disabled infrastructure entries require a replacement context reference.");
  const entry = {
    ...input,
    contextId,
    semanticVersion,
    applicableGeographyLevels: uniqueSorted(input.applicableGeographyLevels),
    supportedStatuses: uniqueSorted(input.supportedStatuses),
    supportedFundingStates: uniqueSorted(input.supportedFundingStates),
    supportedPermitStates: uniqueSorted(input.supportedPermitStates),
    supportedApprovalStates: uniqueSorted(input.supportedApprovalStates),
    supportedObservationMethods: uniqueSorted(input.supportedObservationMethods),
    permittedProposalKinds: uniqueSorted(input.permittedProposalKinds),
    prohibitedInferenceCodes: uniqueSorted(input.prohibitedInferenceCodes),
    replacementContextId: clean(input.replacementContextId),
    replacementContextVersion: clean(input.replacementContextVersion),
    registeredAt: requiredClean(input.registeredAt, "Market infrastructure registry entry requires registration time."),
  };
  if (!entry.applicableGeographyLevels.length) throw new Error("Market infrastructure registry entry requires at least one geography level.");
  if (!entry.supportedStatuses.every(isMarketInfrastructureProjectStatus)) throw new Error("Market infrastructure entry includes unsupported project status.");
  const material = infrastructureEntryMaterial(entry);
  return {
    ...entry,
    contractVersion: MARKET_INFRASTRUCTURE_CONTRACT_VERSION,
    materialHash: `mi_entryh_${stableHash(material).slice(0, 24)}`,
  };
}

export function createMarketInfrastructureRegistry(entries: readonly MarketInfrastructureRegistryEntry[]): MarketInfrastructureRegistry {
  const sorted = [...entries].sort((a, b) => infrastructureEntryKey(a).localeCompare(infrastructureEntryKey(b)));
  const materialHash = `mi_regh_${stableHash(sorted.map((entry) => entry.materialHash)).slice(0, 24)}`;
  return {
    registryId: `mi_reg_${stableHash({ materialHash, version: MARKET_INFRASTRUCTURE_REGISTRY_VERSION }).slice(0, 24)}`,
    version: MARKET_INFRASTRUCTURE_REGISTRY_VERSION,
    entries: sorted,
    materialHash,
  };
}

export function selectMarketInfrastructureRegistryEntry(input: {
  registry: MarketInfrastructureRegistry;
  contextId: string;
  semanticVersion?: string;
}): MarketInfrastructureRegistryEntry {
  const contextId = normalizeId(input.contextId, "Market infrastructure context selection requires context ID.");
  const entry = input.registry.entries.find((item) => item.contextId === contextId && (!input.semanticVersion || item.semanticVersion === input.semanticVersion));
  if (!entry) throw new Error("Market infrastructure registry entry was not found.");
  if (entry.lifecycleStatus === "disabled") throw new Error("Disabled market infrastructure entries cannot create new observations.");
  return entry;
}

export function createMarketInfrastructureObservation(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  entry: MarketInfrastructureRegistryEntry;
  project: MarketInfrastructureProjectReference;
  geography: MarketInfrastructureGeography;
  proximity?: MarketInfrastructureProximity;
  projectStatus: MarketInfrastructureProjectStatus;
  approvalState: MarketInfrastructureApprovalState;
  fundingState: MarketInfrastructureFundingState;
  permitState: MarketInfrastructurePermitState;
  timeline: MarketInfrastructureTimeline;
  pipelineMetrics?: MarketInfrastructurePipelineMetrics;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  dataset?: MarketSourceDataset;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  method: MarketInfrastructureObservationMethod;
  limitationCodes?: readonly string[];
  degradedStates?: readonly MarketInfrastructureDegradedState[];
  explanationCodes?: readonly MarketInfrastructureExplanationCode[];
}): MarketInfrastructureObservation {
  if (!marketInfrastructureObservationMethods.includes(input.method)) throw new Error("Market infrastructure observation method is not registered.");
  if (!input.entry.supportedStatuses.includes(input.projectStatus)) throw new Error("Project status is not supported by this infrastructure context.");
  if (!input.entry.supportedObservationMethods.includes(input.method)) throw new Error("Observation method is not supported by this infrastructure context.");
  const degradedStates = uniqueSorted([...degradedStatesFrom(input), ...(input.degradedStates ?? [])]);
  const explanationCodes = uniqueSorted([...explanationCodesFrom(input, degradedStates), ...(input.explanationCodes ?? []), "underwriting_proposal_only"]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market infrastructure observation requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    canonicalLocationId: clean(input.canonicalLocationId),
    contextId: input.entry.contextId,
    contextVersion: input.entry.semanticVersion,
    category: input.entry.category,
    subtype: input.entry.subtype,
    project: normalizeProject(input.project),
    geography: normalizeGeography(input.geography),
    proximity: normalizeProximity(input.proximity),
    projectStatus: input.projectStatus,
    approvalState: input.approvalState,
    fundingState: input.fundingState,
    permitState: input.permitState,
    timeline: normalizeTimeline(input.timeline),
    pipelineMetrics: normalizePipelineMetrics(input.pipelineMetrics),
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    dataset: input.dataset,
    sourceRecordId: clean(input.sourceRecordId),
    sourceRecordKey: clean(input.sourceRecordKey),
    evidenceReference: stableEvidence(input.evidenceReference),
    provenance: stableProvenance(input.provenance ?? []),
    freshness: input.freshness,
    verificationState: input.verificationState,
    confidence: input.confidence,
    method: input.method,
    limitationCodes: uniqueSorted(input.limitationCodes ?? []),
    degradedStates,
    explanationCodes,
  };
  return {
    ...basis,
    observationId: `mi_obs_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `mi_obsh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_INFRASTRUCTURE_OBSERVATION_CONTRACT_VERSION,
  };
}

export function createMarketInfrastructureFinding(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketInfrastructureFindingType;
  sourceObservations: readonly MarketInfrastructureObservation[];
  summaryCode: MarketInfrastructureExplanationCode;
  impactClass: MarketInfrastructureImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState?: CanonicalMarketFreshnessState;
  limitationCodes?: readonly string[];
  suggestedVerificationAction?: MarketInfrastructureProfessionalBoundary;
  applicableStrategyReferences?: readonly string[];
  conflictState?: MarketInfrastructureConflictState;
  assumptionProposalReferences?: readonly string[];
  stableOrdinal?: number;
}): MarketInfrastructureFinding {
  if (!marketInfrastructureFindingTypes.includes(input.findingType)) throw new Error("Market infrastructure finding type is not registered.");
  if (!marketInfrastructureExplanationCodes.includes(input.summaryCode)) throw new Error("Market infrastructure finding summary code is not registered.");
  if (!marketInfrastructureImpactClasses.includes(input.impactClass)) throw new Error("Market infrastructure impact class is not registered.");
  const observations = stableObservations(input.sourceObservations);
  if (!observations.length) throw new Error("Market infrastructure finding requires at least one source observation.");
  const conflictState = input.conflictState ?? (observations.some((item) => item.degradedStates.includes("conflicting_sources")) ? "unresolved" : "none");
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market infrastructure finding requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    findingType: input.findingType,
    sourceObservationIds: observations.map((item) => item.observationId),
    summaryCode: input.summaryCode,
    geography: observations[0].geography,
    projectStatus: observations[0].projectStatus,
    timeline: observations[0].timeline,
    impactClass: input.impactClass,
    confidence: input.confidence,
    verificationState: input.verificationState,
    freshnessState: input.freshnessState ?? worstFreshness(observations),
    limitationCodes: uniqueSorted([...(input.limitationCodes ?? []), ...observations.flatMap((item) => item.limitationCodes)]),
    suggestedVerificationAction: input.suggestedVerificationAction ?? suggestedActionFor(input.findingType, conflictState),
    applicableStrategyReferences: uniqueSorted(input.applicableStrategyReferences ?? []),
    conflictState,
    assumptionProposalReferences: uniqueSorted(input.assumptionProposalReferences ?? []),
    stableOrdinal: Math.max(0, Math.trunc(input.stableOrdinal ?? 0)),
  };
  return {
    ...basis,
    findingId: `mi_find_${stableHash({ type: basis.findingType, observations: basis.sourceObservationIds, stableOrdinal: basis.stableOrdinal }).slice(0, 24)}`,
    underwritingMutationAllowed: false,
    strategyRerankAllowed: false,
    recommendationMutationAllowed: false,
    professionalConclusionAllowed: false,
    deterministicHash: `mi_findh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_INFRASTRUCTURE_FINDING_CONTRACT_VERSION,
  };
}

export function createMarketInfrastructureConflictManifest(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketInfrastructureConflictState, "none">;
  observations: readonly MarketInfrastructureObservation[];
  reasonCodes: readonly MarketInfrastructureExplanationCode[];
  retainedObservationIds?: readonly string[];
}): MarketInfrastructureConflictManifest {
  if (!marketInfrastructureConflictStates.includes(input.conflictState)) throw new Error("Market infrastructure conflict state is not registered.");
  const observations = stableObservations(input.observations);
  if (observations.length < 2) throw new Error("Market infrastructure conflict requires at least two observations.");
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market infrastructure conflict requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    conflictState: input.conflictState,
    observationIds: observations.map((item) => item.observationId),
    retainedObservationIds: uniqueSorted(input.retainedObservationIds ?? observations.map((item) => item.observationId)),
    geography: observations[0].geography,
    projectReferences: observations.map((item) => item.project),
    reasonCodes: uniqueSorted(input.reasonCodes.length ? input.reasonCodes : ["authority_verification_recommended"]),
  };
  return {
    ...basis,
    conflictId: `mi_conf_${stableHash(basis).slice(0, 24)}`,
    blockedUntilResolved: true,
    deterministicHash: `mi_confh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_INFRASTRUCTURE_CONFLICT_CONTRACT_VERSION,
  };
}

export function projectMarketInfrastructureFinding(finding: MarketInfrastructureFinding): MarketInfrastructureProjection {
  const projection = {
    findingId: finding.findingId,
    findingType: finding.findingType,
    sourceObservationIds: finding.sourceObservationIds,
    geographyLevel: finding.geography.geographyLevel,
    geographyIdentity: finding.geography.geographyIdentity,
    projectStatus: finding.projectStatus,
    impactClass: finding.impactClass,
    confidence: finding.confidence,
    verificationState: finding.verificationState,
    freshnessState: finding.freshnessState,
    conflictState: finding.conflictState,
    assumptionProposalReferences: finding.assumptionProposalReferences,
    underwritingMutationAllowed: false as const,
    strategyRerankAllowed: false as const,
    recommendationMutationAllowed: false as const,
    contractVersion: MARKET_INFRASTRUCTURE_PROJECTION_CONTRACT_VERSION as typeof MARKET_INFRASTRUCTURE_PROJECTION_CONTRACT_VERSION,
  };
  return {
    ...projection,
    deterministicHash: `mi_projh_${stableHash(projection).slice(0, 24)}`,
  };
}

export function marketInfrastructureDiagnostics(event: "infrastructure_observed" | "infrastructure_finding_created" | "infrastructure_conflict_detected" | "infrastructure_degraded" | "infrastructure_proposal_referenced", input: {
  workspaceId?: string;
  propertyId?: string;
  observationId?: string;
  findingId?: string;
  conflictState?: string;
  projectStatus?: string;
}) {
  return {
    event,
    workspaceScoped: Boolean(clean(input.workspaceId)),
    propertyScoped: Boolean(clean(input.propertyId)),
    observationScoped: Boolean(clean(input.observationId)),
    findingScoped: Boolean(clean(input.findingId)),
    conflictState: clean(input.conflictState),
    projectStatus: clean(input.projectStatus),
  };
}

export function isMarketInfrastructureSubtype(value: string): value is MarketInfrastructureSubtype {
  return marketInfrastructureSubtypes.includes(value as MarketInfrastructureSubtype);
}

export function isMarketInfrastructureProjectStatus(value: string): value is MarketInfrastructureProjectStatus {
  return marketInfrastructureProjectStatuses.includes(value as MarketInfrastructureProjectStatus);
}

export function isMarketInfrastructureFindingType(value: string): value is MarketInfrastructureFindingType {
  return marketInfrastructureFindingTypes.includes(value as MarketInfrastructureFindingType);
}

function degradedStatesFrom(input: Parameters<typeof createMarketInfrastructureObservation>[0]): MarketInfrastructureDegradedState[] {
  const states: MarketInfrastructureDegradedState[] = [];
  if (input.providerState === "offline" || input.providerState === "maintenance" || input.providerState === "rate_limited" || input.providerState === "authentication_required") states.push("provider_unavailable");
  if (input.providerState === "not_configured" || input.providerState === "disabled" || input.providerState === "unsupported") states.push("record_unavailable");
  if (input.freshness?.priorValidResultId || input.freshness?.priorValidSourceRecordId) states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "stale" || input.freshness?.freshnessState === "expired" || input.freshness?.freshnessState === "historical") states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "unavailable") states.push("record_unavailable");
  if (input.freshness?.freshnessState === "missing_temporal_metadata") states.push("missing_temporal_metadata");
  if (input.freshness?.freshnessState === "conflicted") states.push("conflicting_sources");
  if (input.projectStatus === "unknown") states.push("project_status_unknown");
  if (input.fundingState === "funding_unknown") states.push("funding_unknown");
  if (input.timeline.timelineKind === "unknown" || !hasTimelineMetadata(input.timeline)) states.push("timeline_unknown");
  if (input.geography.geographyLevel === "unknown" || input.geography.relationship === "proxy") states.push("unsupported_geography");
  if (!input.sourceRecordId && !input.evidenceReference && !(input.provenance ?? []).length) states.push("record_unavailable");
  return states;
}

function explanationCodesFrom(input: Parameters<typeof createMarketInfrastructureObservation>[0], degradedStates: readonly MarketInfrastructureDegradedState[]): MarketInfrastructureExplanationCode[] {
  const codes: MarketInfrastructureExplanationCode[] = [];
  if (input.projectStatus === "conceptual") codes.push("project_conceptual", "planned_not_completed");
  if (input.projectStatus === "proposed" || input.projectStatus === "under_review") codes.push("project_proposed", "proposed_not_approved", "planned_not_completed");
  if (input.projectStatus === "approved" || input.approvalState === "approved") codes.push("project_approved", "planned_not_completed");
  if (input.projectStatus === "funded" || input.fundingState === "funded") codes.push("project_funded");
  if (input.fundingState === "funded" && input.projectStatus !== "under_construction" && input.projectStatus !== "partially_complete" && input.projectStatus !== "complete") codes.push("funded_not_started");
  if (input.projectStatus === "under_construction" || input.projectStatus === "partially_complete") codes.push("project_under_construction");
  if (input.projectStatus === "complete") codes.push("project_completed");
  if (input.projectStatus === "delayed" || input.projectStatus === "paused") codes.push("project_delayed", "timeline_stale");
  if (input.projectStatus === "cancelled" || input.projectStatus === "superseded") codes.push("project_cancelled");
  if (input.permitState === "permit_issued" && input.projectStatus !== "complete") codes.push("permit_not_completion");
  if (input.entry.subtype.includes("expansion") || input.entry.subtype === "electric_grid" || input.entry.subtype === "gas_service" || input.entry.subtype === "stormwater_project") codes.push("utility_expansion_reported");
  if (input.entry.subtype === "development_pipeline") codes.push("development_pipeline_reported");
  if (input.entry.subtype === "permit_trend") codes.push("permit_activity_changed");
  if (input.entry.subtype === "zoning_change" || input.entry.subtype === "rezoning_application" || input.entry.subtype === "land_use_plan" || input.entry.subtype === "comprehensive_plan") codes.push("zoning_change_proposed", "zoning_no_entitlement");
  if (input.entry.subtype === "annexation") codes.push("annexation_proposed");
  if (input.entry.category === "public_investment") codes.push("public_investment_reported", "public_investment_not_guarantee");
  if (degradedStates.includes("conflicting_sources")) codes.push("conflicting_project_status");
  if (degradedStates.includes("stale_prior_valid")) codes.push("timeline_stale");
  if (input.entry.professionalBoundary !== "none") codes.push("authority_verification_recommended", "professional_review_recommended");
  return codes;
}

function suggestedActionFor(findingType: MarketInfrastructureFindingType, conflictState: MarketInfrastructureConflictState): MarketInfrastructureProfessionalBoundary {
  if (conflictState !== "none") return "municipal_verification";
  if (findingType === "utility_expansion_reported") return "utility_confirmation";
  if (findingType === "zoning_change_proposed" || findingType === "annexation_proposed") return "planning_or_zoning_review";
  if (findingType === "public_investment_reported") return "municipal_verification";
  return "municipal_verification";
}

function worstFreshness(observations: readonly MarketInfrastructureObservation[]): CanonicalMarketFreshnessState {
  const priority: CanonicalMarketFreshnessState[] = ["conflicted", "unavailable", "missing_temporal_metadata", "expired", "stale", "review_due", "current_with_age_warning", "historical", "superseded", "future_effective", "not_applicable", "current"];
  return priority.find((state) => observations.some((observation) => (observation.freshness?.freshnessState ?? freshnessStateFromDegraded(observation.degradedStates)) === state)) ?? "current";
}

function freshnessStateFromDegraded(degradedStates: readonly MarketInfrastructureDegradedState[]): CanonicalMarketFreshnessState {
  if (degradedStates.includes("conflicting_sources")) return "conflicted";
  if (degradedStates.includes("timeline_unknown") || degradedStates.includes("missing_temporal_metadata")) return "missing_temporal_metadata";
  if (degradedStates.includes("record_unavailable") || degradedStates.includes("provider_unavailable")) return "unavailable";
  if (degradedStates.includes("stale_prior_valid")) return "stale";
  return "current";
}

function normalizeProject(project: MarketInfrastructureProjectReference): MarketInfrastructureProjectReference {
  return {
    projectId: normalizeId(project.projectId, "Infrastructure project requires project ID."),
    projectName: clean(project.projectName),
    sponsorName: clean(project.sponsorName),
    authorityName: clean(project.authorityName),
    developerName: clean(project.developerName),
    sourceReference: stableEvidence(project.sourceReference),
  };
}

function normalizeGeography(geography: MarketInfrastructureGeography): MarketInfrastructureGeography {
  return {
    geographyLevel: geography.geographyLevel,
    geographyIdentity: requiredClean(geography.geographyIdentity, "Market infrastructure geography requires explicit identity."),
    canonicalLocationId: clean(geography.canonicalLocationId),
    jurisdiction: clean(geography.jurisdiction),
    boundaryId: clean(geography.boundaryId),
    boundaryVersion: clean(geography.boundaryVersion),
    relationship: geography.relationship,
  };
}

function normalizeProximity(proximity: MarketInfrastructureProximity | undefined): MarketInfrastructureProximity | undefined {
  if (!proximity) return undefined;
  return {
    distance: proximity.distance === undefined ? undefined : Math.max(0, Number(proximity.distance)),
    distanceUnit: proximity.distanceUnit,
    method: proximity.method,
    relationship: proximity.relationship,
    sourceReference: stableEvidence(proximity.sourceReference),
  };
}

function normalizeTimeline(timeline: MarketInfrastructureTimeline): MarketInfrastructureTimeline {
  return {
    announcedDate: clean(timeline.announcedDate),
    approvalDate: clean(timeline.approvalDate),
    expectedStart: clean(timeline.expectedStart),
    expectedCompletion: clean(timeline.expectedCompletion),
    actualStart: clean(timeline.actualStart),
    actualCompletion: clean(timeline.actualCompletion),
    effectiveStart: clean(timeline.effectiveStart),
    effectiveEnd: clean(timeline.effectiveEnd),
    periodStart: clean(timeline.periodStart),
    periodEnd: clean(timeline.periodEnd),
    retrievalTime: clean(timeline.retrievalTime),
    timelineKind: timeline.timelineKind,
    projected: Boolean(timeline.projected),
    historical: Boolean(timeline.historical),
  };
}

function normalizePipelineMetrics(metrics: MarketInfrastructurePipelineMetrics | undefined): MarketInfrastructurePipelineMetrics | undefined {
  if (!metrics) return undefined;
  return {
    unitsProposed: integerOrUndefined(metrics.unitsProposed),
    unitsApproved: integerOrUndefined(metrics.unitsApproved),
    unitsUnderConstruction: integerOrUndefined(metrics.unitsUnderConstruction),
    unitsDelivered: integerOrUndefined(metrics.unitsDelivered),
    commercialSqFt: integerOrUndefined(metrics.commercialSqFt),
    industrialSqFt: integerOrUndefined(metrics.industrialSqFt),
    hotelRooms: integerOrUndefined(metrics.hotelRooms),
    permitCount: integerOrUndefined(metrics.permitCount),
    permitValue: metrics.permitValue === undefined ? undefined : Math.max(0, Number(metrics.permitValue)),
    propertyTypeClass: clean(metrics.propertyTypeClass),
    periodStart: clean(metrics.periodStart),
    periodEnd: clean(metrics.periodEnd),
    noDoubleCountingBasis: metrics.noDoubleCountingBasis,
  };
}

function hasTimelineMetadata(timeline: MarketInfrastructureTimeline) {
  return Boolean(timeline.announcedDate || timeline.approvalDate || timeline.expectedStart || timeline.expectedCompletion || timeline.actualStart || timeline.actualCompletion || timeline.effectiveStart || timeline.effectiveEnd || timeline.periodStart || timeline.periodEnd || timeline.retrievalTime);
}

function stableObservations(input: readonly MarketInfrastructureObservation[]) {
  return [...input].sort((a, b) => a.observationId.localeCompare(b.observationId));
}

function infrastructureEntryMaterial(input: Omit<MarketInfrastructureRegistryEntry, "contractVersion" | "materialHash">) {
  const { registeredAt: _registeredAt, ...material } = input;
  return material;
}

function infrastructureEntryKey(entry: MarketInfrastructureRegistryEntry) {
  return [entry.category, entry.subtype, entry.contextId, entry.semanticVersion].join(":");
}

function stableEvidence(input: SourceEvidenceReference | undefined): SourceEvidenceReference | undefined {
  if (!input) return undefined;
  return {
    sourceRecordId: clean(input.sourceRecordId),
    evidenceId: clean(input.evidenceId),
    sourceClassification: input.sourceClassification,
    sourceName: clean(input.sourceName),
    sourceUrl: clean(input.sourceUrl),
    sourceAnchor: input.sourceAnchor,
    observedAt: clean(input.observedAt),
    effectiveAt: clean(input.effectiveAt),
  };
}

function stableProvenance(input: readonly MarketProviderProvenance[]) {
  return input
    .map((item) => ({
      ...item,
      providerId: clean(item.providerId) ?? "",
      providerVersion: clean(item.providerVersion) ?? "",
      providerRecordReference: clean(item.providerRecordReference) ?? "",
      observationTime: clean(item.observationTime),
      effectiveTime: clean(item.effectiveTime),
      retrievalTime: clean(item.retrievalTime) ?? "",
    }))
    .sort((a, b) => stableSerialize(a).localeCompare(stableSerialize(b)));
}

function integerOrUndefined(value?: number) {
  return value === undefined ? undefined : Math.max(0, Math.trunc(value));
}

function normalizeId(value: unknown, message: string) {
  const cleaned = requiredClean(value, message);
  return cleaned.toLowerCase().replace(/[^a-z0-9_.:-]+/g, "_").replace(/^_+|_+$/g, "");
}

function requiredClean(value: unknown, message: string) {
  const cleaned = clean(value);
  if (!cleaned) throw new Error(message);
  return cleaned;
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function uniqueSorted<T extends string>(values: readonly T[]) {
  return [...new Set(values.map((value) => clean(value)).filter((value): value is T => Boolean(value)))].sort();
}

function stableHash(value: unknown) {
  const text = stableSerialize(value);
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) + hash) ^ text.charCodeAt(index);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableSerialize(value: unknown): string {
  if (value === undefined) return "";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(",")}}`;
}

import type { GeographicLevel, LocationVerificationState, SourceEvidenceReference } from "./locationIdentity";
import type { ProviderConfidence, ProviderState } from "./providerAdapters";
import type { CanonicalMarketFreshnessResult, CanonicalMarketFreshnessState } from "./marketFreshness";
import type { MarketProviderProvenance, MarketSourceDataset } from "./marketSourceIngestion";

export const MARKET_HAZARD_CONTRACT_VERSION = "market-hazard-context-v1";
export const MARKET_HAZARD_REGISTRY_VERSION = "market-hazard-registry-v1";
export const MARKET_HAZARD_OBSERVATION_CONTRACT_VERSION = "market-hazard-observation-v1";
export const MARKET_HAZARD_FINDING_CONTRACT_VERSION = "market-hazard-finding-v1";
export const MARKET_HAZARD_CONFLICT_CONTRACT_VERSION = "market-hazard-conflict-v1";

export const marketHazardCategories = [
  "flood",
  "coastal_flood",
  "wildfire",
  "wind",
  "hail",
  "hurricane_or_tropical_cyclone",
  "tornado",
  "seismic",
  "landslide",
  "subsidence",
  "sinkhole",
  "heat",
  "drought",
  "water_stress",
  "severe_storm",
  "winter_weather",
  "environmental_site",
  "brownfield",
  "superfund_or_regulated_site",
  "underground_storage",
  "radon",
  "soil_or_geologic",
  "industrial_proximity",
  "rail_proximity",
  "airport_or_noise_proximity",
  "utility_or_pipeline_proximity",
  "water_quality_context",
] as const;

export const marketHazardObservationMethods = [
  "mapped_indicator",
  "modeled_estimate",
  "statistical_area_indicator",
  "proximity_measure",
  "reported_event",
  "historical_record",
  "sensor_or_measured_value",
  "professional_report",
  "user_supplied_evidence",
  "inferred_proxy",
  "unknown",
] as const;

export const marketHazardSourceSeverityClasses = [
  "source_none_reported",
  "source_low",
  "source_moderate",
  "source_high",
  "source_very_high",
  "source_extreme",
  "source_zone",
  "source_present",
  "source_absent",
  "source_unknown",
  "source_not_classified",
] as const;

export const marketHazardImpactClasses = [
  "informational",
  "review_recommended",
  "material_context",
  "potentially_decision_changing",
  "professional_review_required",
] as const;

export const marketHazardFindingTypes = [
  "mapped_context",
  "proximity_context",
  "reported_context",
  "measured_context",
  "professional_context",
  "conflict_context",
  "unavailable_context",
] as const;

export const marketHazardProfessionalReviewTypes = [
  "none",
  "insurance_review",
  "survey_review",
  "structural_engineering_review",
  "environmental_professional_review",
  "geotechnical_review",
  "radon_testing",
  "flood_elevation_certificate_review",
  "wildfire_mitigation_review",
  "legal_or_zoning_review",
] as const;

export const marketHazardConflictStates = [
  "none",
  "provider_conflict",
  "vintage_conflict",
  "method_conflict",
  "geography_conflict",
  "professional_vs_modeled",
  "unresolved",
] as const;

export const marketHazardDegradedStates = [
  "source_unavailable",
  "provider_unavailable",
  "module_not_implemented",
  "record_not_found",
  "geography_not_supported",
  "stale_prior_valid",
  "conflicting_sources",
  "permission_restricted",
  "missing_temporal_metadata",
  "unsupported_hazard_type",
] as const;

export const marketHazardExplanationCodes = [
  "mapped_indicator_present",
  "mapped_indicator_absent_in_source",
  "property_specific_status_unknown",
  "proximity_context_present",
  "professional_review_recommended",
  "stale_prior_valid_retained",
  "conflicting_sources",
  "geography_proxy_used",
  "provider_data_unavailable",
  "evidence_required_for_property_specific_determination",
  "source_severity_preserved",
  "impact_is_context_not_score",
  "unsupported_hazard_type",
  "missing_temporal_metadata",
] as const;

export type MarketHazardCategory = typeof marketHazardCategories[number];
export type MarketHazardObservationMethod = typeof marketHazardObservationMethods[number];
export type MarketHazardSourceSeverityClass = typeof marketHazardSourceSeverityClasses[number];
export type MarketHazardImpactClass = typeof marketHazardImpactClasses[number];
export type MarketHazardFindingType = typeof marketHazardFindingTypes[number];
export type MarketHazardProfessionalReviewType = typeof marketHazardProfessionalReviewTypes[number];
export type MarketHazardConflictState = typeof marketHazardConflictStates[number];
export type MarketHazardDegradedState = typeof marketHazardDegradedStates[number];
export type MarketHazardExplanationCode = typeof marketHazardExplanationCodes[number];
export type MarketHazardLifecycleStatus = "active" | "deprecated" | "disabled";
export type MarketHazardDeterminationStatus =
  | "mapped_indicator_only"
  | "property_specific_not_determined"
  | "property_specific_professional_determination"
  | "property_specific_user_evidence"
  | "unavailable";

export type MarketHazardGeography = {
  canonicalLocationId?: string;
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  boundaryId?: string;
  boundaryVersion?: string;
  proxy: boolean;
  proxyReason?: string;
  radiusMiles?: number;
  driveTimeMinutes?: number;
  distanceMethod?: "provider_reported" | "coordinate_distance" | "user_defined" | "unknown";
};

export type MarketHazardRegistryEntry = {
  hazardId: string;
  semanticVersion: string;
  category: MarketHazardCategory;
  dataset?: MarketSourceDataset;
  lifecycleStatus: MarketHazardLifecycleStatus;
  applicableGeographyLevels: readonly GeographicLevel[];
  supportedObservationMethods: readonly MarketHazardObservationMethod[];
  supportedSourceSeverityClasses: readonly MarketHazardSourceSeverityClass[];
  supportedImpactClasses: readonly MarketHazardImpactClass[];
  professionalReviewType: MarketHazardProfessionalReviewType;
  limitations: readonly string[];
  prohibitedConclusionCodes: readonly string[];
  strategyImpactProposalKinds: readonly string[];
  replacementHazardId?: string;
  replacementHazardVersion?: string;
  registeredAt: string;
  contractVersion: typeof MARKET_HAZARD_CONTRACT_VERSION;
  materialHash: string;
};

export type MarketHazardRegistry = {
  registryId: string;
  version: typeof MARKET_HAZARD_REGISTRY_VERSION;
  entries: MarketHazardRegistryEntry[];
  materialHash: string;
};

export type MarketHazardObservation = {
  observationId: string;
  hazardId: string;
  hazardVersion: string;
  hazardCategory: MarketHazardCategory;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  dataset?: MarketSourceDataset;
  geography: MarketHazardGeography;
  observationMethod: MarketHazardObservationMethod;
  sourceSeverityClass: MarketHazardSourceSeverityClass;
  normalizedValue?: string | number | boolean;
  units?: string;
  period?: string;
  observationTime?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  publicationTime?: string;
  retrievalTime: string;
  mappedIndicator: boolean;
  propertySpecificDetermination: MarketHazardDeterminationStatus;
  professionalReviewType: MarketHazardProfessionalReviewType;
  evidenceReference?: SourceEvidenceReference;
  provenance: MarketProviderProvenance[];
  freshnessResultId?: string;
  freshnessState: CanonicalMarketFreshnessState;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitations: string[];
  degradedStates: MarketHazardDegradedState[];
  explanationCodes: MarketHazardExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_HAZARD_OBSERVATION_CONTRACT_VERSION;
};

export type MarketHazardFinding = {
  findingId: string;
  hazardId: string;
  hazardVersion: string;
  hazardCategory: MarketHazardCategory;
  findingType: MarketHazardFindingType;
  geography: MarketHazardGeography;
  sourceObservationIds: string[];
  sourceSeverityClass: MarketHazardSourceSeverityClass;
  impactClass: MarketHazardImpactClass;
  conflictState: MarketHazardConflictState;
  freshnessState: CanonicalMarketFreshnessState;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  professionalReviewType: MarketHazardProfessionalReviewType;
  professionalReviewRecommended: boolean;
  strategyImpactProposalReferences: string[];
  assumptionProposalReferences: string[];
  suggestedActionReference?: string;
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  limitations: string[];
  degradedStates: MarketHazardDegradedState[];
  explanationCodes: MarketHazardExplanationCode[];
  stableOrdinal: number;
  deterministicHash: string;
  contractVersion: typeof MARKET_HAZARD_FINDING_CONTRACT_VERSION;
};

export type MarketHazardConflictManifest = {
  conflictId: string;
  hazardId: string;
  hazardVersion: string;
  hazardCategory: MarketHazardCategory;
  conflictState: Exclude<MarketHazardConflictState, "none">;
  observationIds: string[];
  geography: MarketHazardGeography;
  reasonCodes: MarketHazardExplanationCode[];
  retainedObservationIds: string[];
  blockedUntilResolved: true;
  deterministicHash: string;
  contractVersion: typeof MARKET_HAZARD_CONFLICT_CONTRACT_VERSION;
};

export type MarketHazardProjection = {
  findingId: string;
  hazardCategory: MarketHazardCategory;
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  proxy: boolean;
  sourceSeverityClass: MarketHazardSourceSeverityClass;
  impactClass: MarketHazardImpactClass;
  conflictState: MarketHazardConflictState;
  freshnessState: CanonicalMarketFreshnessState;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  professionalReviewType: MarketHazardProfessionalReviewType;
  explanationCodes: MarketHazardExplanationCode[];
  degradedStates: MarketHazardDegradedState[];
  sourceObservationIds: string[];
  deterministicHash: string;
};

type HazardEntryInput = Omit<MarketHazardRegistryEntry, "contractVersion" | "materialHash">;

export function defineMarketHazardRegistryEntry(input: HazardEntryInput): MarketHazardRegistryEntry {
  const hazardId = normalizeId(input.hazardId, "Market hazard registry entry requires a hazard ID.");
  const semanticVersion = requiredClean(input.semanticVersion, "Market hazard registry entry requires a semantic version.");
  if (!marketHazardCategories.includes(input.category)) throw new Error("Market hazard category is not registered.");
  if (input.lifecycleStatus === "disabled" && !input.replacementHazardId) throw new Error("Disabled market hazard entries require a replacement hazard reference.");
  const applicableGeographyLevels = uniqueSorted(input.applicableGeographyLevels);
  const supportedObservationMethods = uniqueSorted(input.supportedObservationMethods);
  const supportedSourceSeverityClasses = uniqueSorted(input.supportedSourceSeverityClasses);
  const supportedImpactClasses = uniqueSorted(input.supportedImpactClasses);
  if (!applicableGeographyLevels.length) throw new Error("Market hazard registry entry requires at least one geography level.");
  if (!supportedObservationMethods.every(isMarketHazardObservationMethod)) throw new Error("Market hazard registry entry includes an unsupported observation method.");
  if (!supportedSourceSeverityClasses.every(isMarketHazardSourceSeverityClass)) throw new Error("Market hazard registry entry includes an unsupported source severity class.");
  if (!supportedImpactClasses.every(isMarketHazardImpactClass)) throw new Error("Market hazard registry entry includes an unsupported impact class.");
  const material = hazardEntryMaterial({
    ...input,
    hazardId,
    semanticVersion,
    applicableGeographyLevels,
    supportedObservationMethods,
    supportedSourceSeverityClasses,
    supportedImpactClasses,
  });
  return {
    ...input,
    hazardId,
    semanticVersion,
    applicableGeographyLevels,
    supportedObservationMethods,
    supportedSourceSeverityClasses,
    supportedImpactClasses,
    limitations: uniqueSorted(input.limitations),
    prohibitedConclusionCodes: uniqueSorted(input.prohibitedConclusionCodes),
    strategyImpactProposalKinds: uniqueSorted(input.strategyImpactProposalKinds),
    replacementHazardId: clean(input.replacementHazardId),
    replacementHazardVersion: clean(input.replacementHazardVersion),
    registeredAt: requiredClean(input.registeredAt, "Market hazard registry entry requires registration time."),
    contractVersion: MARKET_HAZARD_CONTRACT_VERSION,
    materialHash: `mh_entryh_${stableHash(material).slice(0, 24)}`,
  };
}

export function createMarketHazardRegistry(entries: readonly MarketHazardRegistryEntry[]): MarketHazardRegistry {
  const sorted = [...entries].sort((a, b) => hazardEntryKey(a).localeCompare(hazardEntryKey(b)));
  const seen = new Set<string>();
  for (const entry of sorted) {
    const key = `${entry.hazardId}@${entry.semanticVersion}`;
    if (seen.has(key)) throw new Error(`Duplicate market hazard registry entry ${key}.`);
    seen.add(key);
  }
  const material = sorted.map((entry) => ({
    hazardId: entry.hazardId,
    semanticVersion: entry.semanticVersion,
    materialHash: entry.materialHash,
  }));
  return {
    registryId: `mh_reg_${stableHash(material).slice(0, 24)}`,
    version: MARKET_HAZARD_REGISTRY_VERSION,
    entries: sorted,
    materialHash: `mh_regh_${stableHash(material).slice(0, 24)}`,
  };
}

export function selectMarketHazardRegistryEntry(input: {
  registry: MarketHazardRegistry;
  hazardId: string;
  semanticVersion?: string;
  allowDeprecated?: boolean;
}): MarketHazardRegistryEntry {
  const hazardId = normalizeId(input.hazardId, "Market hazard selection requires a hazard ID.");
  const candidates = input.registry.entries.filter((entry) =>
    entry.hazardId === hazardId &&
    (input.allowDeprecated ? entry.lifecycleStatus !== "disabled" : entry.lifecycleStatus === "active")
  );
  if (!candidates.length) throw new Error("No active market hazard registry entry matches the requested hazard.");
  if (input.semanticVersion) {
    const exact = candidates.find((entry) => entry.semanticVersion === input.semanticVersion);
    if (!exact) throw new Error("Requested market hazard registry version is not available.");
    return exact;
  }
  return candidates.sort((a, b) => b.semanticVersion.localeCompare(a.semanticVersion))[0];
}

export function createMarketHazardObservation(input: {
  entry: MarketHazardRegistryEntry;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  dataset?: MarketSourceDataset;
  geography: MarketHazardGeography;
  observationMethod: MarketHazardObservationMethod;
  sourceSeverityClass: MarketHazardSourceSeverityClass;
  normalizedValue?: string | number | boolean;
  units?: string;
  period?: string;
  observationTime?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  publicationTime?: string;
  retrievalTime: string;
  mappedIndicator?: boolean;
  propertySpecificDetermination?: MarketHazardDeterminationStatus;
  professionalReviewType?: MarketHazardProfessionalReviewType;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitations?: readonly string[];
  degradedStates?: readonly MarketHazardDegradedState[];
  explanationCodes?: readonly MarketHazardExplanationCode[];
}): MarketHazardObservation {
  const entry = assertActiveEntry(input.entry);
  if (!entry.supportedObservationMethods.includes(input.observationMethod)) throw new Error("Market hazard observation method is not supported by the hazard registry entry.");
  if (!entry.supportedSourceSeverityClasses.includes(input.sourceSeverityClass)) throw new Error("Market hazard source severity is not supported by the hazard registry entry.");
  const geography = normalizeHazardGeography(input.geography, entry);
  const retrievalTime = requiredClean(input.retrievalTime, "Market hazard observation requires retrieval time.");
  const propertySpecificDetermination = input.propertySpecificDetermination ?? defaultDetermination(input.observationMethod, input.mappedIndicator);
  const mappedIndicator = input.mappedIndicator ?? input.observationMethod === "mapped_indicator";
  const degradedStates = uniqueSorted(input.degradedStates ?? degradedStatesFrom(input.providerState, input.freshness?.freshnessState));
  const explanationCodes = uniqueSorted([
    ...(input.explanationCodes ?? []),
    ...explanationsFrom({
      mappedIndicator,
      propertySpecificDetermination,
      geography,
      degradedStates,
      freshnessState: input.freshness?.freshnessState,
    }),
  ]);
  const basis = {
    hazardId: entry.hazardId,
    hazardVersion: entry.semanticVersion,
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    sourceRecordId: clean(input.sourceRecordId),
    sourceRecordKey: clean(input.sourceRecordKey),
    dataset: input.dataset ?? entry.dataset,
    geography,
    observationMethod: input.observationMethod,
    sourceSeverityClass: input.sourceSeverityClass,
    normalizedValue: input.normalizedValue,
    units: clean(input.units),
    period: clean(input.period),
    observationTime: clean(input.observationTime),
    effectiveStart: clean(input.effectiveStart),
    effectiveEnd: clean(input.effectiveEnd),
    publicationTime: clean(input.publicationTime),
    retrievalTime,
    mappedIndicator,
    propertySpecificDetermination,
    professionalReviewType: input.professionalReviewType ?? entry.professionalReviewType,
    evidenceReference: stableEvidence(input.evidenceReference),
    provenance: stableProvenance(input.provenance ?? []),
    freshnessResultId: clean(input.freshness?.freshnessResultId),
    freshnessState: input.freshness?.freshnessState ?? freshnessStateFromDegraded(degradedStates),
    verificationState: input.verificationState,
    confidence: input.confidence,
    limitations: uniqueSorted([...(input.limitations ?? []), ...entry.limitations]),
    degradedStates,
    explanationCodes,
  };
  const deterministicHash = `mh_obsh_${stableHash(basis).slice(0, 24)}`;
  return {
    ...basis,
    observationId: `mh_obs_${stableHash({ ...basis, retrievalTime: undefined }).slice(0, 24)}`,
    hazardCategory: entry.category,
    contractVersion: MARKET_HAZARD_OBSERVATION_CONTRACT_VERSION,
    deterministicHash,
  };
}

export function createMarketHazardFinding(input: {
  entry: MarketHazardRegistryEntry;
  findingType: MarketHazardFindingType;
  geography: MarketHazardGeography;
  sourceObservations: readonly MarketHazardObservation[];
  sourceSeverityClass: MarketHazardSourceSeverityClass;
  impactClass: MarketHazardImpactClass;
  conflictState?: MarketHazardConflictState;
  freshnessState?: CanonicalMarketFreshnessState;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  professionalReviewType?: MarketHazardProfessionalReviewType;
  professionalReviewRecommended?: boolean;
  strategyImpactProposalReferences?: readonly string[];
  assumptionProposalReferences?: readonly string[];
  suggestedActionReference?: string;
  limitations?: readonly string[];
  degradedStates?: readonly MarketHazardDegradedState[];
  explanationCodes?: readonly MarketHazardExplanationCode[];
  stableOrdinal?: number;
}): MarketHazardFinding {
  const entry = assertActiveEntry(input.entry);
  if (!marketHazardFindingTypes.includes(input.findingType)) throw new Error("Market hazard finding type is not registered.");
  if (!entry.supportedSourceSeverityClasses.includes(input.sourceSeverityClass)) throw new Error("Market hazard finding source severity is not supported by the hazard registry entry.");
  if (!entry.supportedImpactClasses.includes(input.impactClass)) throw new Error("Market hazard finding impact class is not supported by the hazard registry entry.");
  const observations = [...input.sourceObservations].sort((a, b) => a.observationId.localeCompare(b.observationId));
  if (!observations.length) throw new Error("Market hazard finding requires at least one source observation.");
  if (!observations.every((observation) => observation.hazardId === entry.hazardId && observation.hazardVersion === entry.semanticVersion)) {
    throw new Error("Market hazard finding observations must match the registry entry.");
  }
  const geography = normalizeHazardGeography(input.geography, entry);
  const conflictState = input.conflictState ?? (observations.some((observation) => observation.degradedStates.includes("conflicting_sources")) ? "unresolved" : "none");
  const professionalReviewType = input.professionalReviewType ?? entry.professionalReviewType;
  const professionalReviewRecommended = input.professionalReviewRecommended ?? (professionalReviewType !== "none" || input.impactClass === "professional_review_required");
  const degradedStates = uniqueSorted([
    ...(input.degradedStates ?? []),
    ...observations.flatMap((observation) => observation.degradedStates),
    ...(conflictState === "none" ? [] : ["conflicting_sources" as const]),
  ]);
  const explanationCodes = uniqueSorted([
    ...(input.explanationCodes ?? []),
    "source_severity_preserved",
    "impact_is_context_not_score",
    ...(professionalReviewRecommended ? ["professional_review_recommended" as const] : []),
    ...(conflictState === "none" ? [] : ["conflicting_sources" as const]),
    ...(geography.proxy ? ["geography_proxy_used" as const] : []),
  ]);
  const basis = {
    hazardId: entry.hazardId,
    hazardVersion: entry.semanticVersion,
    hazardCategory: entry.category,
    findingType: input.findingType,
    geography,
    sourceObservationIds: observations.map((observation) => observation.observationId),
    sourceSeverityClass: input.sourceSeverityClass,
    impactClass: input.impactClass,
    conflictState,
    freshnessState: input.freshnessState ?? worstFreshness(observations),
    verificationState: input.verificationState,
    confidence: input.confidence,
    professionalReviewType,
    professionalReviewRecommended,
    strategyImpactProposalReferences: uniqueSorted(input.strategyImpactProposalReferences ?? []),
    assumptionProposalReferences: uniqueSorted(input.assumptionProposalReferences ?? []),
    suggestedActionReference: clean(input.suggestedActionReference),
    limitations: uniqueSorted([...(input.limitations ?? []), ...entry.limitations, ...observations.flatMap((observation) => observation.limitations)]),
    degradedStates,
    explanationCodes,
    stableOrdinal: Math.max(0, Math.trunc(input.stableOrdinal ?? 0)),
  };
  return {
    ...basis,
    findingId: `mh_find_${stableHash({ hazardId: basis.hazardId, geography, sourceObservationIds: basis.sourceObservationIds, stableOrdinal: basis.stableOrdinal }).slice(0, 24)}`,
    underwritingMutationAllowed: false,
    strategyRerankAllowed: false,
    deterministicHash: `mh_findh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_HAZARD_FINDING_CONTRACT_VERSION,
  };
}

export function createMarketHazardConflictManifest(input: {
  entry: MarketHazardRegistryEntry;
  conflictState: Exclude<MarketHazardConflictState, "none">;
  observations: readonly MarketHazardObservation[];
  geography: MarketHazardGeography;
  reasonCodes: readonly MarketHazardExplanationCode[];
  retainedObservationIds?: readonly string[];
}): MarketHazardConflictManifest {
  const entry = assertActiveEntry(input.entry);
  if (!marketHazardConflictStates.includes(input.conflictState)) throw new Error("Market hazard conflict requires a material conflict state.");
  const observations = [...input.observations].sort((a, b) => a.observationId.localeCompare(b.observationId));
  if (observations.length < 2) throw new Error("Market hazard conflict requires at least two observations.");
  const geography = normalizeHazardGeography(input.geography, entry);
  const reasonCodes = uniqueSorted(input.reasonCodes.length ? input.reasonCodes : ["conflicting_sources"]);
  const retainedObservationIds = uniqueSorted(input.retainedObservationIds ?? observations.map((observation) => observation.observationId));
  const basis = {
    hazardId: entry.hazardId,
    hazardVersion: entry.semanticVersion,
    hazardCategory: entry.category,
    conflictState: input.conflictState,
    observationIds: observations.map((observation) => observation.observationId),
    geography,
    reasonCodes,
    retainedObservationIds,
  };
  return {
    ...basis,
    conflictId: `mh_conf_${stableHash(basis).slice(0, 24)}`,
    blockedUntilResolved: true,
    deterministicHash: `mh_confh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_HAZARD_CONFLICT_CONTRACT_VERSION,
  };
}

export function projectMarketHazardFinding(finding: MarketHazardFinding): MarketHazardProjection {
  const projection = {
    findingId: finding.findingId,
    hazardCategory: finding.hazardCategory,
    geographyLevel: finding.geography.geographyLevel,
    geographyIdentity: finding.geography.geographyIdentity,
    proxy: finding.geography.proxy,
    sourceSeverityClass: finding.sourceSeverityClass,
    impactClass: finding.impactClass,
    conflictState: finding.conflictState,
    freshnessState: finding.freshnessState,
    verificationState: finding.verificationState,
    confidence: finding.confidence,
    professionalReviewType: finding.professionalReviewType,
    explanationCodes: finding.explanationCodes,
    degradedStates: finding.degradedStates,
    sourceObservationIds: finding.sourceObservationIds,
  };
  return {
    ...projection,
    deterministicHash: `mh_projh_${stableHash(projection).slice(0, 24)}`,
  };
}

export function marketHazardDiagnostics(event: "hazard_observed" | "hazard_finding_created" | "hazard_conflict_detected" | "hazard_degraded", input: {
  workspaceId?: string;
  hazardId?: string;
  findingId?: string;
  conflictState?: string;
  freshnessState?: string;
}) {
  return {
    event,
    workspaceScoped: Boolean(clean(input.workspaceId)),
    hazardScoped: Boolean(clean(input.hazardId)),
    findingScoped: Boolean(clean(input.findingId)),
    conflictState: clean(input.conflictState),
    freshnessState: clean(input.freshnessState),
  };
}

export function isMarketHazardCategory(value: string): value is MarketHazardCategory {
  return marketHazardCategories.includes(value as MarketHazardCategory);
}

export function isMarketHazardObservationMethod(value: string): value is MarketHazardObservationMethod {
  return marketHazardObservationMethods.includes(value as MarketHazardObservationMethod);
}

export function isMarketHazardSourceSeverityClass(value: string): value is MarketHazardSourceSeverityClass {
  return marketHazardSourceSeverityClasses.includes(value as MarketHazardSourceSeverityClass);
}

export function isMarketHazardImpactClass(value: string): value is MarketHazardImpactClass {
  return marketHazardImpactClasses.includes(value as MarketHazardImpactClass);
}

function assertActiveEntry(entry: MarketHazardRegistryEntry) {
  if (entry.lifecycleStatus === "disabled") throw new Error("Disabled market hazard registry entries cannot create new observations or findings.");
  return entry;
}

function normalizeHazardGeography(input: MarketHazardGeography, entry: MarketHazardRegistryEntry): MarketHazardGeography {
  const geographyLevel = input.geographyLevel;
  if (!entry.applicableGeographyLevels.includes(geographyLevel)) throw new Error("Market hazard geography is not supported by the hazard registry entry.");
  if (input.radiusMiles !== undefined && input.radiusMiles < 0) throw new Error("Market hazard radius must be non-negative.");
  if (input.driveTimeMinutes !== undefined && input.driveTimeMinutes < 0) throw new Error("Market hazard drive time must be non-negative.");
  return {
    canonicalLocationId: clean(input.canonicalLocationId),
    geographyLevel,
    geographyIdentity: requiredClean(input.geographyIdentity, "Market hazard geography requires explicit identity."),
    boundaryId: clean(input.boundaryId),
    boundaryVersion: clean(input.boundaryVersion),
    proxy: Boolean(input.proxy),
    proxyReason: clean(input.proxyReason),
    radiusMiles: input.radiusMiles,
    driveTimeMinutes: input.driveTimeMinutes,
    distanceMethod: input.distanceMethod,
  };
}

function degradedStatesFrom(providerState: ProviderState | undefined, freshnessState: CanonicalMarketFreshnessState | undefined): MarketHazardDegradedState[] {
  const states: MarketHazardDegradedState[] = [];
  if (providerState === "offline" || providerState === "maintenance" || providerState === "rate_limited" || providerState === "authentication_required") states.push("provider_unavailable");
  if (providerState === "not_configured" || providerState === "disabled" || providerState === "unsupported") states.push("source_unavailable");
  if (freshnessState === "stale" || freshnessState === "expired" || freshnessState === "historical") states.push("stale_prior_valid");
  if (freshnessState === "conflicted") states.push("conflicting_sources");
  if (freshnessState === "missing_temporal_metadata") states.push("missing_temporal_metadata");
  if (freshnessState === "unavailable") states.push("source_unavailable");
  return states;
}

function explanationsFrom(input: {
  mappedIndicator: boolean;
  propertySpecificDetermination: MarketHazardDeterminationStatus;
  geography: MarketHazardGeography;
  degradedStates: readonly MarketHazardDegradedState[];
  freshnessState?: CanonicalMarketFreshnessState;
}): MarketHazardExplanationCode[] {
  const explanations: MarketHazardExplanationCode[] = [];
  if (input.mappedIndicator) explanations.push("mapped_indicator_present");
  if (input.propertySpecificDetermination === "property_specific_not_determined" || input.propertySpecificDetermination === "mapped_indicator_only") {
    explanations.push("property_specific_status_unknown", "evidence_required_for_property_specific_determination");
  }
  if (input.geography.proxy) explanations.push("geography_proxy_used");
  if (input.degradedStates.includes("source_unavailable") || input.degradedStates.includes("provider_unavailable")) explanations.push("provider_data_unavailable");
  if (input.degradedStates.includes("conflicting_sources")) explanations.push("conflicting_sources");
  if (input.degradedStates.includes("stale_prior_valid")) explanations.push("stale_prior_valid_retained");
  if (input.degradedStates.includes("missing_temporal_metadata") || input.freshnessState === "missing_temporal_metadata") explanations.push("missing_temporal_metadata");
  return explanations;
}

function defaultDetermination(method: MarketHazardObservationMethod, mappedIndicator?: boolean): MarketHazardDeterminationStatus {
  if (method === "professional_report") return "property_specific_professional_determination";
  if (method === "user_supplied_evidence") return "property_specific_user_evidence";
  if (mappedIndicator || method === "mapped_indicator" || method === "modeled_estimate" || method === "statistical_area_indicator" || method === "proximity_measure") {
    return "mapped_indicator_only";
  }
  if (method === "unknown") return "unavailable";
  return "property_specific_not_determined";
}

function freshnessStateFromDegraded(degradedStates: readonly MarketHazardDegradedState[]): CanonicalMarketFreshnessState {
  if (degradedStates.includes("conflicting_sources")) return "conflicted";
  if (degradedStates.includes("missing_temporal_metadata")) return "missing_temporal_metadata";
  if (degradedStates.includes("source_unavailable") || degradedStates.includes("provider_unavailable")) return "unavailable";
  if (degradedStates.includes("stale_prior_valid")) return "stale";
  return "current";
}

function worstFreshness(observations: readonly MarketHazardObservation[]): CanonicalMarketFreshnessState {
  const priority: CanonicalMarketFreshnessState[] = [
    "conflicted",
    "unavailable",
    "missing_temporal_metadata",
    "expired",
    "stale",
    "review_due",
    "current_with_age_warning",
    "historical",
    "superseded",
    "future_effective",
    "not_applicable",
    "current",
  ];
  return priority.find((state) => observations.some((observation) => observation.freshnessState === state)) ?? "current";
}

function hazardEntryMaterial(input: HazardEntryInput) {
  const { registeredAt: _registeredAt, ...material } = input;
  return material;
}

function hazardEntryKey(entry: MarketHazardRegistryEntry) {
  return [entry.category, entry.hazardId, entry.semanticVersion].join(":");
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

function uniqueSorted<T extends string>(values: readonly T[]) {
  return [...new Set(values.map((value) => clean(value)).filter((value): value is T => Boolean(value)))].sort();
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

import type { CanonicalMarketFreshnessResult, CanonicalMarketFreshnessState } from "./marketFreshness";
import type { GeographicLevel, LocationVerificationState, SourceEvidenceReference } from "./locationIdentity";
import type { MarketProviderProvenance, MarketSourceDataset } from "./marketSourceIngestion";
import type { ProviderConfidence, ProviderState } from "./providerAdapters";

export const MARKET_CONVENIENCE_CONTRACT_VERSION = "market-convenience-context-v1";
export const MARKET_CONVENIENCE_REGISTRY_VERSION = "market-convenience-registry-v1";
export const MARKET_CONVENIENCE_DESTINATION_CONTRACT_VERSION = "market-convenience-destination-v1";
export const MARKET_CONVENIENCE_MEASUREMENT_CONTRACT_VERSION = "market-convenience-measurement-v1";
export const MARKET_CONVENIENCE_SERVICE_CONTRACT_VERSION = "market-convenience-service-v1";
export const MARKET_CONVENIENCE_SCHOOL_CONTRACT_VERSION = "market-convenience-school-v1";
export const MARKET_CONVENIENCE_FINDING_CONTRACT_VERSION = "market-convenience-finding-v1";
export const MARKET_CONVENIENCE_CONFLICT_CONTRACT_VERSION = "market-convenience-conflict-v1";
export const MARKET_CONVENIENCE_PROJECTION_CONTRACT_VERSION = "market-convenience-projection-v1";

export const marketConvenienceCategories = [
  "daily_needs",
  "healthcare",
  "education",
  "transportation",
  "employment_access",
  "digital_utility",
  "utility",
  "recreation",
] as const;

export const marketConvenienceServiceTypes = [
  "grocery",
  "pharmacy",
  "general_retail",
  "dining",
  "hospital",
  "urgent_care",
  "primary_care",
  "specialty_care",
  "assigned_school",
  "public_school",
  "private_school",
  "college_university",
  "vocational_education",
  "childcare",
  "transit_stop",
  "rail_station",
  "major_road",
  "highway_interchange",
  "airport",
  "park_and_ride",
  "bike_or_pedestrian_access",
  "employment_center",
  "major_employer_access",
  "business_district_access",
  "industrial_employment_access",
  "broadband_availability",
  "broadband_speed_tier",
  "electric_service",
  "gas_service",
  "water_service",
  "sewer_service",
  "park",
  "trail",
  "recreation_facility",
  "public_open_space",
] as const;

export const marketConvenienceDestinationStatuses = [
  "operating",
  "planned",
  "reported_available",
  "reported_unavailable",
  "temporarily_closed",
  "permanently_closed",
  "seasonal",
  "unknown",
] as const;

export const marketConvenienceObservationMethods = [
  "provider_reported",
  "public_record",
  "user_entered_evidence",
  "document_extracted",
  "measured_route",
  "source_reported",
  "unknown",
] as const;

export const marketConvenienceMeasurementTypes = [
  "nearest_destination",
  "count_within_radius",
  "count_within_travel_time",
  "distance_to_destination",
  "travel_time_to_destination",
  "service_area_overlap",
  "assignment_context",
  "availability_context",
] as const;

export const marketConvenienceDistanceMethods = [
  "straight_line",
  "road_network",
  "provider_reported_distance",
  "measured_route",
  "approximate_radius",
  "geographic_centroid_proxy",
  "unknown",
] as const;

export const marketConvenienceTravelTimeMethods = [
  "driving",
  "walking",
  "cycling",
  "public_transit",
  "provider_reported",
  "modeled",
  "historical",
  "unknown",
] as const;

export const marketConvenienceTravelTimeBases = [
  "typical_traffic",
  "live_traffic",
  "scheduled_transit",
  "historical_average",
  "provider_reported",
  "not_applicable",
  "unknown",
] as const;

export const marketConvenienceGeographyRelationships = [
  "property_exact",
  "parcel",
  "exact_point",
  "building",
  "neighborhood_proxy",
  "municipality_context",
  "custom_trade_area",
  "centroid_proxy",
  "area_average",
] as const;

export const marketConvenienceCoverageLevels = [
  "address_level",
  "parcel_level",
  "building_level",
  "census_block",
  "service_area",
  "municipality",
  "provider_reported_area",
  "unknown",
] as const;

export const marketConvenienceBroadbandTechnologies = ["fiber", "cable", "dsl", "fixed_wireless", "satellite", "cellular", "unknown"] as const;
export const marketConvenienceUtilityTypes = ["electric", "natural_gas", "municipal_water", "sewer", "other"] as const;
export const marketConvenienceAvailabilityStates = ["available", "reported_available", "reported_unavailable", "limited", "unknown"] as const;
export const marketConvenienceSchoolAssignmentStates = ["reported_assigned", "uncertain", "not_applicable", "unknown"] as const;
export const marketConvenienceSchoolTypes = ["public", "private", "charter", "magnet", "district", "unknown"] as const;
export const marketConvenienceSchoolMetricTypes = ["assignment", "grade_range", "district", "published_metric", "distance", "travel_time", "program", "unknown"] as const;

export const marketConvenienceFindingTypes = [
  "grocery_access_observed",
  "healthcare_access_observed",
  "transit_access_observed",
  "airport_access_observed",
  "major_road_access_observed",
  "employment_center_access_observed",
  "broadband_coverage_reported",
  "utility_availability_reported",
  "park_recreation_access_observed",
  "school_assignment_reported",
  "school_assignment_uncertain",
  "proxy_geography_used",
  "accessibility_data_stale",
  "facility_data_unavailable",
  "conflicting_destination_records",
  "source_coverage_incomplete",
] as const;

export const marketConvenienceConflictStates = [
  "none",
  "facility_identity_conflict",
  "facility_status_conflict",
  "distance_conflict",
  "travel_time_conflict",
  "school_assignment_conflict",
  "broadband_availability_conflict",
  "utility_availability_conflict",
  "geography_conflict",
  "timestamp_conflict",
  "provider_conflict",
  "unresolved",
] as const;

export const marketConvenienceDegradedStates = [
  "source_unavailable",
  "provider_unavailable",
  "destination_unavailable",
  "destination_status_unknown",
  "geography_unsupported",
  "proxy_only_geography",
  "route_method_unavailable",
  "travel_time_unavailable",
  "school_assignment_uncertain",
  "broadband_coverage_uncertain",
  "utility_availability_uncertain",
  "stale_prior_valid",
  "conflicting_sources",
  "permission_restricted",
  "missing_temporal_metadata",
  "no_source_coverage",
] as const;

export const marketConvenienceExplanationCodes = [
  "destination_access_observed",
  "distance_method_declared",
  "travel_time_method_declared",
  "geography_proxy_used",
  "facility_status_unverified",
  "school_assignment_reported",
  "school_assignment_uncertain",
  "school_metric_methodology_preserved",
  "broadband_coverage_reported",
  "broadband_address_verification_needed",
  "utility_service_area_reported",
  "utility_property_verification_needed",
  "accessibility_data_stale",
  "provider_unavailable_prior_valid_retained",
  "conflicting_accessibility_sources",
  "factual_context_only",
  "no_investment_quality_inference",
  "no_neighborhood_quality_score",
  "no_school_desirability_score",
  "no_protected_class_scoring",
  "no_demographic_steering",
  "no_safety_conclusion",
  "no_absence_inference",
  "straight_line_not_drive_time",
  "radius_not_route_access",
  "advertised_speed_not_measured_speed",
  "service_area_not_active_connection",
  "user_priority_presentation_only",
  "proposal_only",
] as const;

export const marketConvenienceImpactClasses = ["informational", "verification_needed", "assumption_review", "decision_context", "professional_review_required"] as const;
export const marketConvenienceVerificationActions = ["verify_source", "verify_route", "verify_school_assignment", "verify_address_level_broadband", "verify_utility_connection", "inspect_provider_source", "none"] as const;

export type MarketConvenienceCategory = typeof marketConvenienceCategories[number];
export type MarketConvenienceServiceType = typeof marketConvenienceServiceTypes[number];
export type MarketConvenienceDestinationStatus = typeof marketConvenienceDestinationStatuses[number];
export type MarketConvenienceObservationMethod = typeof marketConvenienceObservationMethods[number];
export type MarketConvenienceMeasurementType = typeof marketConvenienceMeasurementTypes[number];
export type MarketConvenienceDistanceMethod = typeof marketConvenienceDistanceMethods[number];
export type MarketConvenienceTravelTimeMethod = typeof marketConvenienceTravelTimeMethods[number];
export type MarketConvenienceTravelTimeBasis = typeof marketConvenienceTravelTimeBases[number];
export type MarketConvenienceGeographyRelationship = typeof marketConvenienceGeographyRelationships[number];
export type MarketConvenienceCoverageLevel = typeof marketConvenienceCoverageLevels[number];
export type MarketConvenienceBroadbandTechnology = typeof marketConvenienceBroadbandTechnologies[number];
export type MarketConvenienceUtilityType = typeof marketConvenienceUtilityTypes[number];
export type MarketConvenienceAvailabilityState = typeof marketConvenienceAvailabilityStates[number];
export type MarketConvenienceSchoolAssignmentState = typeof marketConvenienceSchoolAssignmentStates[number];
export type MarketConvenienceSchoolType = typeof marketConvenienceSchoolTypes[number];
export type MarketConvenienceSchoolMetricType = typeof marketConvenienceSchoolMetricTypes[number];
export type MarketConvenienceFindingType = typeof marketConvenienceFindingTypes[number];
export type MarketConvenienceConflictState = typeof marketConvenienceConflictStates[number];
export type MarketConvenienceDegradedState = typeof marketConvenienceDegradedStates[number];
export type MarketConvenienceExplanationCode = typeof marketConvenienceExplanationCodes[number];
export type MarketConvenienceImpactClass = typeof marketConvenienceImpactClasses[number];
export type MarketConvenienceVerificationAction = typeof marketConvenienceVerificationActions[number];
export type MarketConvenienceLifecycleStatus = "active" | "deprecated" | "disabled";
export type MarketConvenienceDistanceUnit = "mi" | "km" | "ft" | "m" | "unknown";
export type MarketConvenienceTimeUnit = "minutes" | "seconds" | "unknown";

export type MarketConvenienceGeography = {
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  canonicalLocationId?: string;
  boundaryId?: string;
  boundaryVersion?: string;
  relationship: MarketConvenienceGeographyRelationship;
  proxy: boolean;
};

export type MarketConvenienceRegistryEntry = {
  contextId: string;
  semanticVersion: string;
  category: MarketConvenienceCategory;
  serviceType: MarketConvenienceServiceType;
  applicableDatasets: readonly MarketSourceDataset[];
  supportedGeographyLevels: readonly GeographicLevel[];
  supportedMeasurementTypes: readonly MarketConvenienceMeasurementType[];
  supportedDistanceMethods: readonly MarketConvenienceDistanceMethod[];
  supportedTravelTimeMethods: readonly MarketConvenienceTravelTimeMethod[];
  supportedObservationMethods: readonly MarketConvenienceObservationMethod[];
  allowsSchoolContext: boolean;
  allowsServiceAvailability: boolean;
  lifecycleStatus: MarketConvenienceLifecycleStatus;
  permittedProposalKinds: readonly string[];
  prohibitedInferenceCodes: readonly string[];
  registeredAt: string;
  contractVersion: typeof MARKET_CONVENIENCE_CONTRACT_VERSION;
  materialHash: string;
};

export type MarketConvenienceRegistry = {
  registryId: string;
  version: typeof MARKET_CONVENIENCE_REGISTRY_VERSION;
  entries: MarketConvenienceRegistryEntry[];
  materialHash: string;
};

export type MarketConvenienceDestinationObservation = {
  observationId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  contextId: string;
  contextVersion: string;
  category: MarketConvenienceCategory;
  serviceType: MarketConvenienceServiceType;
  destinationIdentity: string;
  destinationName?: string;
  destinationStatus: MarketConvenienceDestinationStatus;
  observationMethod: MarketConvenienceObservationMethod;
  subjectGeography: MarketConvenienceGeography;
  destinationGeography?: MarketConvenienceGeography;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  dataset?: MarketSourceDataset;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  observationTime?: string;
  publicationTime?: string;
  retrievalTime?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance: MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes: string[];
  degradedStates: MarketConvenienceDegradedState[];
  explanationCodes: MarketConvenienceExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_CONVENIENCE_DESTINATION_CONTRACT_VERSION;
};

export type MarketConvenienceAccessibilityMeasurement = {
  measurementId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  destinationObservationId?: string;
  destinationIdentity?: string;
  serviceType: MarketConvenienceServiceType;
  measurementType: MarketConvenienceMeasurementType;
  subjectGeography: MarketConvenienceGeography;
  distanceValue?: number;
  distanceUnit: MarketConvenienceDistanceUnit;
  distanceMethod: MarketConvenienceDistanceMethod;
  travelTimeValue?: number;
  travelTimeUnit: MarketConvenienceTimeUnit;
  travelTimeMethod: MarketConvenienceTravelTimeMethod;
  travelTimeBasis: MarketConvenienceTravelTimeBasis;
  measurementTimestamp?: string;
  routeProviderReference?: string;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  evidenceReference?: SourceEvidenceReference;
  provenance: MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes: string[];
  degradedStates: MarketConvenienceDegradedState[];
  explanationCodes: MarketConvenienceExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_CONVENIENCE_MEASUREMENT_CONTRACT_VERSION;
};

export type MarketConvenienceServiceAvailability = {
  serviceAvailabilityId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  serviceType: MarketConvenienceServiceType;
  availabilityState: MarketConvenienceAvailabilityState;
  coverageLevel: MarketConvenienceCoverageLevel;
  geography: MarketConvenienceGeography;
  serviceProviderName?: string;
  broadbandTechnology?: MarketConvenienceBroadbandTechnology;
  utilityType?: MarketConvenienceUtilityType;
  advertisedDownMbps?: number;
  advertisedUpMbps?: number;
  measuredDownMbps?: number;
  measuredUpMbps?: number;
  sourcePeriodStart?: string;
  sourcePeriodEnd?: string;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  evidenceReference?: SourceEvidenceReference;
  provenance: MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes: string[];
  degradedStates: MarketConvenienceDegradedState[];
  explanationCodes: MarketConvenienceExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_CONVENIENCE_SERVICE_CONTRACT_VERSION;
};

export type MarketConvenienceSchoolContext = {
  schoolContextId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  schoolIdentity: string;
  schoolName?: string;
  assignmentState: MarketConvenienceSchoolAssignmentState;
  schoolType: MarketConvenienceSchoolType;
  gradeRange?: string;
  districtName?: string;
  sourceDate?: string;
  metricType?: MarketConvenienceSchoolMetricType;
  metricValue?: string | number;
  metricMethodology?: string;
  geography: MarketConvenienceGeography;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  evidenceReference?: SourceEvidenceReference;
  provenance: MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes: string[];
  degradedStates: MarketConvenienceDegradedState[];
  explanationCodes: MarketConvenienceExplanationCode[];
  prohibitedInferenceCodes: string[];
  deterministicHash: string;
  contractVersion: typeof MARKET_CONVENIENCE_SCHOOL_CONTRACT_VERSION;
};

export type MarketConvenienceFinding = {
  findingId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketConvenienceFindingType;
  sourceObservationIds: string[];
  sourceMeasurementIds: string[];
  serviceAvailabilityIds: string[];
  schoolContextIds: string[];
  summaryCode: MarketConvenienceExplanationCode;
  category: MarketConvenienceCategory;
  geography: MarketConvenienceGeography;
  impactClass: MarketConvenienceImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState | "unknown";
  limitationCodes: string[];
  suggestedVerificationAction: MarketConvenienceVerificationAction;
  applicableStrategyReferences: string[];
  conflictState: MarketConvenienceConflictState;
  assumptionProposalReferences: string[];
  userPriorityReferences: string[];
  stableOrdinal: number;
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  investmentQualityInferenceAllowed: false;
  neighborhoodQualityConclusionAllowed: false;
  schoolDesirabilityConclusionAllowed: false;
  protectedClassScoringAllowed: false;
  deterministicHash: string;
  contractVersion: typeof MARKET_CONVENIENCE_FINDING_CONTRACT_VERSION;
};

export type MarketConvenienceConflictManifest = {
  conflictId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketConvenienceConflictState, "none">;
  observationIds: string[];
  measurementIds: string[];
  serviceAvailabilityIds: string[];
  schoolContextIds: string[];
  retainedRecordIds: string[];
  geography?: MarketConvenienceGeography;
  reasonCodes: MarketConvenienceExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_CONVENIENCE_CONFLICT_CONTRACT_VERSION;
};

export type MarketConvenienceProjection = {
  findingId: string;
  findingType: MarketConvenienceFindingType;
  sourceObservationIds: string[];
  sourceMeasurementIds: string[];
  serviceAvailabilityIds: string[];
  schoolContextIds: string[];
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  impactClass: MarketConvenienceImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState | "unknown";
  conflictState: MarketConvenienceConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  investmentQualityInferenceAllowed: false;
  contractVersion: typeof MARKET_CONVENIENCE_PROJECTION_CONTRACT_VERSION;
  deterministicHash: string;
};

type RegistryEntryInput = Omit<MarketConvenienceRegistryEntry, "contractVersion" | "materialHash">;

export function defineMarketConvenienceRegistryEntry(input: RegistryEntryInput): MarketConvenienceRegistryEntry {
  const contextId = normalizeId(input.contextId, "Market convenience registry entry requires context ID.");
  if (!marketConvenienceCategories.includes(input.category)) throw new Error("Market convenience category is not registered.");
  if (!marketConvenienceServiceTypes.includes(input.serviceType)) throw new Error("Market convenience service type is not registered.");
  if (input.lifecycleStatus === "disabled") throw new Error("Disabled convenience entries cannot be used for new observations.");
  const entry = {
    ...input,
    contextId,
    semanticVersion: requiredClean(input.semanticVersion, "Market convenience registry entry requires semantic version."),
    applicableDatasets: uniqueSorted(input.applicableDatasets),
    supportedGeographyLevels: uniqueSorted(input.supportedGeographyLevels),
    supportedMeasurementTypes: uniqueSorted(input.supportedMeasurementTypes),
    supportedDistanceMethods: uniqueSorted(input.supportedDistanceMethods),
    supportedTravelTimeMethods: uniqueSorted(input.supportedTravelTimeMethods),
    supportedObservationMethods: uniqueSorted(input.supportedObservationMethods),
    permittedProposalKinds: uniqueSorted(input.permittedProposalKinds),
    prohibitedInferenceCodes: uniqueSorted([...input.prohibitedInferenceCodes, "no_investment_quality_inference", "no_protected_class_scoring"]),
    registeredAt: requiredClean(input.registeredAt, "Market convenience registry entry requires registration time."),
  };
  if (!entry.applicableDatasets.length) throw new Error("Market convenience registry entry requires at least one source dataset.");
  if (!entry.supportedMeasurementTypes.every(isMarketConvenienceMeasurementType)) throw new Error("Market convenience entry includes unsupported measurement type.");
  if (!entry.supportedDistanceMethods.every(isMarketConvenienceDistanceMethod)) throw new Error("Market convenience entry includes unsupported distance method.");
  if (!entry.supportedTravelTimeMethods.every(isMarketConvenienceTravelTimeMethod)) throw new Error("Market convenience entry includes unsupported travel-time method.");
  const material = entryMaterial(entry);
  return {
    ...entry,
    contractVersion: MARKET_CONVENIENCE_CONTRACT_VERSION,
    materialHash: `mc_entryh_${stableHash(material).slice(0, 24)}`,
  };
}

export function createMarketConvenienceRegistry(entries: readonly MarketConvenienceRegistryEntry[]): MarketConvenienceRegistry {
  const sorted = [...entries].sort((a, b) => entryKey(a).localeCompare(entryKey(b)));
  const materialHash = `mc_regh_${stableHash(sorted.map((entry) => entry.materialHash)).slice(0, 24)}`;
  return {
    registryId: `mc_reg_${stableHash({ materialHash, version: MARKET_CONVENIENCE_REGISTRY_VERSION }).slice(0, 24)}`,
    version: MARKET_CONVENIENCE_REGISTRY_VERSION,
    entries: sorted,
    materialHash,
  };
}

export function selectMarketConvenienceRegistryEntry(input: {
  registry: MarketConvenienceRegistry;
  contextId: string;
  semanticVersion?: string;
}): MarketConvenienceRegistryEntry {
  const contextId = normalizeId(input.contextId, "Market convenience entry selection requires context ID.");
  const entry = input.registry.entries.find((item) => item.contextId === contextId && (!input.semanticVersion || item.semanticVersion === input.semanticVersion));
  if (!entry) throw new Error("Market convenience registry entry was not found.");
  if (entry.lifecycleStatus === "disabled") throw new Error("Disabled market convenience entries cannot create new observations.");
  return entry;
}

export function createMarketConvenienceDestinationObservation(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  entry: MarketConvenienceRegistryEntry;
  destinationIdentity: string;
  destinationName?: string;
  destinationStatus: MarketConvenienceDestinationStatus;
  observationMethod: MarketConvenienceObservationMethod;
  subjectGeography: MarketConvenienceGeography;
  destinationGeography?: MarketConvenienceGeography;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  dataset?: MarketSourceDataset;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  observationTime?: string;
  publicationTime?: string;
  retrievalTime?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes?: readonly string[];
  degradedStates?: readonly MarketConvenienceDegradedState[];
  explanationCodes?: readonly MarketConvenienceExplanationCode[];
}): MarketConvenienceDestinationObservation {
  assertEntrySupportsDestination(input.entry, input.subjectGeography, input.observationMethod, input.dataset);
  if (!marketConvenienceDestinationStatuses.includes(input.destinationStatus)) throw new Error("Destination status is not registered.");
  const degradedStates = uniqueSorted([...degradedStatesFromShared(input), ...destinationDegradedStates(input), ...(input.degradedStates ?? [])]);
  const explanationCodes = uniqueSorted([...destinationExplanationCodes(input, degradedStates), ...(input.explanationCodes ?? []), ...baseGuardrails()]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market convenience destination requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    canonicalLocationId: clean(input.canonicalLocationId),
    contextId: input.entry.contextId,
    contextVersion: input.entry.semanticVersion,
    category: input.entry.category,
    serviceType: input.entry.serviceType,
    destinationIdentity: requiredClean(input.destinationIdentity, "Market convenience destination requires destination identity."),
    destinationName: clean(input.destinationName),
    destinationStatus: input.destinationStatus,
    observationMethod: input.observationMethod,
    subjectGeography: normalizeGeography(input.subjectGeography),
    destinationGeography: input.destinationGeography ? normalizeGeography(input.destinationGeography) : undefined,
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    dataset: input.dataset,
    sourceRecordId: clean(input.sourceRecordId),
    sourceRecordKey: clean(input.sourceRecordKey),
    observationTime: clean(input.observationTime),
    publicationTime: clean(input.publicationTime),
    retrievalTime: clean(input.retrievalTime),
    evidenceReference: stableEvidence(input.evidenceReference),
    provenance: stableProvenance(input.provenance ?? []),
    freshness: input.freshness,
    verificationState: input.verificationState,
    confidence: input.confidence,
    limitationCodes: uniqueSorted(input.limitationCodes ?? []),
    degradedStates,
    explanationCodes,
  };
  return {
    ...basis,
    observationId: `mc_dest_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `mc_desth_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_CONVENIENCE_DESTINATION_CONTRACT_VERSION,
  };
}

export function createMarketConvenienceAccessibilityMeasurement(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  destinationObservationId?: string;
  destinationIdentity?: string;
  serviceType: MarketConvenienceServiceType;
  measurementType: MarketConvenienceMeasurementType;
  subjectGeography: MarketConvenienceGeography;
  distanceValue?: number;
  distanceUnit?: MarketConvenienceDistanceUnit;
  distanceMethod: MarketConvenienceDistanceMethod;
  travelTimeValue?: number;
  travelTimeUnit?: MarketConvenienceTimeUnit;
  travelTimeMethod: MarketConvenienceTravelTimeMethod;
  travelTimeBasis: MarketConvenienceTravelTimeBasis;
  measurementTimestamp?: string;
  routeProviderReference?: string;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes?: readonly string[];
  degradedStates?: readonly MarketConvenienceDegradedState[];
  explanationCodes?: readonly MarketConvenienceExplanationCode[];
}): MarketConvenienceAccessibilityMeasurement {
  validateMeasurement(input);
  const degradedStates = uniqueSorted([...degradedStatesFromShared(input), ...measurementDegradedStates(input), ...(input.degradedStates ?? [])]);
  const explanationCodes = uniqueSorted([...measurementExplanationCodes(input, degradedStates), ...(input.explanationCodes ?? []), ...baseGuardrails()]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market convenience measurement requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    destinationObservationId: clean(input.destinationObservationId),
    destinationIdentity: clean(input.destinationIdentity),
    serviceType: input.serviceType,
    measurementType: input.measurementType,
    subjectGeography: normalizeGeography(input.subjectGeography),
    distanceValue: normalizedNumber(input.distanceValue),
    distanceUnit: input.distanceUnit ?? "unknown",
    distanceMethod: input.distanceMethod,
    travelTimeValue: normalizedNumber(input.travelTimeValue),
    travelTimeUnit: input.travelTimeUnit ?? "unknown",
    travelTimeMethod: input.travelTimeMethod,
    travelTimeBasis: input.travelTimeBasis,
    measurementTimestamp: clean(input.measurementTimestamp),
    routeProviderReference: clean(input.routeProviderReference),
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    evidenceReference: stableEvidence(input.evidenceReference),
    provenance: stableProvenance(input.provenance ?? []),
    freshness: input.freshness,
    verificationState: input.verificationState,
    confidence: input.confidence,
    limitationCodes: uniqueSorted(input.limitationCodes ?? []),
    degradedStates,
    explanationCodes,
  };
  return {
    ...basis,
    measurementId: `mc_meas_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `mc_meash_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_CONVENIENCE_MEASUREMENT_CONTRACT_VERSION,
  };
}

export function createMarketConvenienceServiceAvailability(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  serviceType: MarketConvenienceServiceType;
  availabilityState: MarketConvenienceAvailabilityState;
  coverageLevel: MarketConvenienceCoverageLevel;
  geography: MarketConvenienceGeography;
  serviceProviderName?: string;
  broadbandTechnology?: MarketConvenienceBroadbandTechnology;
  utilityType?: MarketConvenienceUtilityType;
  advertisedDownMbps?: number;
  advertisedUpMbps?: number;
  measuredDownMbps?: number;
  measuredUpMbps?: number;
  sourcePeriodStart?: string;
  sourcePeriodEnd?: string;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes?: readonly string[];
  degradedStates?: readonly MarketConvenienceDegradedState[];
  explanationCodes?: readonly MarketConvenienceExplanationCode[];
}): MarketConvenienceServiceAvailability {
  if (!marketConvenienceServiceTypes.includes(input.serviceType)) throw new Error("Market convenience service type is not registered.");
  if (!marketConvenienceAvailabilityStates.includes(input.availabilityState)) throw new Error("Service availability state is not registered.");
  const degradedStates = uniqueSorted([...degradedStatesFromShared(input), ...serviceDegradedStates(input), ...(input.degradedStates ?? [])]);
  const explanationCodes = uniqueSorted([...serviceExplanationCodes(input), ...(input.explanationCodes ?? []), ...baseGuardrails()]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market convenience service availability requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    serviceType: input.serviceType,
    availabilityState: input.availabilityState,
    coverageLevel: input.coverageLevel,
    geography: normalizeGeography(input.geography),
    serviceProviderName: clean(input.serviceProviderName),
    broadbandTechnology: input.broadbandTechnology,
    utilityType: input.utilityType,
    advertisedDownMbps: normalizedNumber(input.advertisedDownMbps),
    advertisedUpMbps: normalizedNumber(input.advertisedUpMbps),
    measuredDownMbps: normalizedNumber(input.measuredDownMbps),
    measuredUpMbps: normalizedNumber(input.measuredUpMbps),
    sourcePeriodStart: clean(input.sourcePeriodStart),
    sourcePeriodEnd: clean(input.sourcePeriodEnd),
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    evidenceReference: stableEvidence(input.evidenceReference),
    provenance: stableProvenance(input.provenance ?? []),
    freshness: input.freshness,
    verificationState: input.verificationState,
    confidence: input.confidence,
    limitationCodes: uniqueSorted(input.limitationCodes ?? []),
    degradedStates,
    explanationCodes,
  };
  return {
    ...basis,
    serviceAvailabilityId: `mc_srv_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `mc_srvh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_CONVENIENCE_SERVICE_CONTRACT_VERSION,
  };
}

export function createMarketConvenienceSchoolContext(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  schoolIdentity: string;
  schoolName?: string;
  assignmentState: MarketConvenienceSchoolAssignmentState;
  schoolType: MarketConvenienceSchoolType;
  gradeRange?: string;
  districtName?: string;
  sourceDate?: string;
  metricType?: MarketConvenienceSchoolMetricType;
  metricValue?: string | number;
  metricMethodology?: string;
  geography: MarketConvenienceGeography;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes?: readonly string[];
  degradedStates?: readonly MarketConvenienceDegradedState[];
  explanationCodes?: readonly MarketConvenienceExplanationCode[];
}): MarketConvenienceSchoolContext {
  validateSchool(input);
  const degradedStates = uniqueSorted([...degradedStatesFromShared(input), ...(input.assignmentState === "uncertain" || input.assignmentState === "unknown" ? ["school_assignment_uncertain" as const] : []), ...(input.degradedStates ?? [])]);
  const explanationCodes = uniqueSorted([...schoolExplanationCodes(input), ...(input.explanationCodes ?? []), ...baseGuardrails()]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market convenience school context requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    schoolIdentity: requiredClean(input.schoolIdentity, "School context requires school identity."),
    schoolName: clean(input.schoolName),
    assignmentState: input.assignmentState,
    schoolType: input.schoolType,
    gradeRange: clean(input.gradeRange),
    districtName: clean(input.districtName),
    sourceDate: clean(input.sourceDate),
    metricType: input.metricType,
    metricValue: input.metricValue,
    metricMethodology: clean(input.metricMethodology),
    geography: normalizeGeography(input.geography),
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    evidenceReference: stableEvidence(input.evidenceReference),
    provenance: stableProvenance(input.provenance ?? []),
    freshness: input.freshness,
    verificationState: input.verificationState,
    confidence: input.confidence,
    limitationCodes: uniqueSorted(input.limitationCodes ?? []),
    degradedStates,
    explanationCodes,
    prohibitedInferenceCodes: ["no_school_desirability_score", "no_neighborhood_quality_score", "no_protected_class_scoring", "no_demographic_steering"],
  };
  return {
    ...basis,
    schoolContextId: `mc_school_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `mc_schoolh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_CONVENIENCE_SCHOOL_CONTRACT_VERSION,
  };
}

export function createMarketConvenienceFinding(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketConvenienceFindingType;
  sourceObservations?: readonly MarketConvenienceDestinationObservation[];
  sourceMeasurements?: readonly MarketConvenienceAccessibilityMeasurement[];
  serviceAvailabilities?: readonly MarketConvenienceServiceAvailability[];
  schoolContexts?: readonly MarketConvenienceSchoolContext[];
  summaryCode: MarketConvenienceExplanationCode;
  category: MarketConvenienceCategory;
  impactClass: MarketConvenienceImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState?: CanonicalMarketFreshnessState | "unknown";
  limitationCodes?: readonly string[];
  suggestedVerificationAction?: MarketConvenienceVerificationAction;
  applicableStrategyReferences?: readonly string[];
  conflictState?: MarketConvenienceConflictState;
  assumptionProposalReferences?: readonly string[];
  userPriorityReferences?: readonly string[];
  stableOrdinal?: number;
}): MarketConvenienceFinding {
  if (!marketConvenienceFindingTypes.includes(input.findingType)) throw new Error("Market convenience finding type is not registered.");
  if (!marketConvenienceExplanationCodes.includes(input.summaryCode)) throw new Error("Market convenience finding summary code is not registered.");
  if (!marketConvenienceImpactClasses.includes(input.impactClass)) throw new Error("Market convenience impact class is not registered.");
  const observations = stableObservations(input.sourceObservations ?? []);
  const measurements = stableMeasurements(input.sourceMeasurements ?? []);
  const services = stableServices(input.serviceAvailabilities ?? []);
  const schools = stableSchools(input.schoolContexts ?? []);
  if (!observations.length && !measurements.length && !services.length && !schools.length) throw new Error("Market convenience finding requires source records.");
  const conflictState = input.conflictState ?? (hasConflict(observations, measurements, services, schools) ? "unresolved" : "none");
  const geography = firstGeography(observations, measurements, services, schools);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market convenience finding requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    findingType: input.findingType,
    sourceObservationIds: observations.map((item) => item.observationId),
    sourceMeasurementIds: measurements.map((item) => item.measurementId),
    serviceAvailabilityIds: services.map((item) => item.serviceAvailabilityId),
    schoolContextIds: schools.map((item) => item.schoolContextId),
    summaryCode: input.summaryCode,
    category: input.category,
    geography,
    impactClass: input.impactClass,
    confidence: input.confidence,
    verificationState: input.verificationState,
    freshnessState: input.freshnessState ?? worstFreshness([...observations, ...measurements, ...services, ...schools]),
    limitationCodes: uniqueSorted(["convenience_context_not_investment_score", ...(input.limitationCodes ?? []), ...observations.flatMap((item) => item.limitationCodes), ...measurements.flatMap((item) => item.limitationCodes), ...services.flatMap((item) => item.limitationCodes), ...schools.flatMap((item) => item.limitationCodes)]),
    suggestedVerificationAction: input.suggestedVerificationAction ?? suggestedActionFor(input.findingType, conflictState),
    applicableStrategyReferences: uniqueSorted(input.applicableStrategyReferences ?? []),
    conflictState,
    assumptionProposalReferences: uniqueSorted(input.assumptionProposalReferences ?? []),
    userPriorityReferences: uniqueSorted(input.userPriorityReferences ?? []),
    stableOrdinal: Math.max(0, Math.trunc(input.stableOrdinal ?? 0)),
  };
  return {
    ...basis,
    findingId: `mc_find_${stableHash({ findingType: basis.findingType, records: [...basis.sourceObservationIds, ...basis.sourceMeasurementIds, ...basis.serviceAvailabilityIds, ...basis.schoolContextIds], stableOrdinal: basis.stableOrdinal }).slice(0, 24)}`,
    underwritingMutationAllowed: false,
    strategyRerankAllowed: false,
    recommendationMutationAllowed: false,
    investmentQualityInferenceAllowed: false,
    neighborhoodQualityConclusionAllowed: false,
    schoolDesirabilityConclusionAllowed: false,
    protectedClassScoringAllowed: false,
    deterministicHash: `mc_findh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_CONVENIENCE_FINDING_CONTRACT_VERSION,
  };
}

export function createMarketConvenienceConflictManifest(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketConvenienceConflictState, "none">;
  observations?: readonly MarketConvenienceDestinationObservation[];
  measurements?: readonly MarketConvenienceAccessibilityMeasurement[];
  services?: readonly MarketConvenienceServiceAvailability[];
  schools?: readonly MarketConvenienceSchoolContext[];
  reasonCodes: readonly MarketConvenienceExplanationCode[];
  retainedRecordIds?: readonly string[];
}): MarketConvenienceConflictManifest {
  if (!marketConvenienceConflictStates.includes(input.conflictState)) throw new Error("Market convenience conflict state is not registered.");
  const observations = stableObservations(input.observations ?? []);
  const measurements = stableMeasurements(input.measurements ?? []);
  const services = stableServices(input.services ?? []);
  const schools = stableSchools(input.schools ?? []);
  if (observations.length + measurements.length + services.length + schools.length < 2) throw new Error("Market convenience conflict requires at least two source records.");
  const recordIds = [...observations.map((item) => item.observationId), ...measurements.map((item) => item.measurementId), ...services.map((item) => item.serviceAvailabilityId), ...schools.map((item) => item.schoolContextId)];
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market convenience conflict requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    conflictState: input.conflictState,
    observationIds: observations.map((item) => item.observationId),
    measurementIds: measurements.map((item) => item.measurementId),
    serviceAvailabilityIds: services.map((item) => item.serviceAvailabilityId),
    schoolContextIds: schools.map((item) => item.schoolContextId),
    retainedRecordIds: uniqueSorted(input.retainedRecordIds ?? recordIds),
    geography: firstGeography(observations, measurements, services, schools),
    reasonCodes: uniqueSorted(input.reasonCodes.length ? input.reasonCodes : ["conflicting_accessibility_sources"]),
  };
  return {
    ...basis,
    conflictId: `mc_conf_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `mc_confh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_CONVENIENCE_CONFLICT_CONTRACT_VERSION,
  };
}

export function projectMarketConvenienceFinding(finding: MarketConvenienceFinding): MarketConvenienceProjection {
  const projection = {
    findingId: finding.findingId,
    findingType: finding.findingType,
    sourceObservationIds: finding.sourceObservationIds,
    sourceMeasurementIds: finding.sourceMeasurementIds,
    serviceAvailabilityIds: finding.serviceAvailabilityIds,
    schoolContextIds: finding.schoolContextIds,
    geographyLevel: finding.geography.geographyLevel,
    geographyIdentity: finding.geography.geographyIdentity,
    impactClass: finding.impactClass,
    confidence: finding.confidence,
    verificationState: finding.verificationState,
    freshnessState: finding.freshnessState,
    conflictState: finding.conflictState,
    assumptionProposalReferences: finding.assumptionProposalReferences,
    underwritingMutationAllowed: false as const,
    strategyRerankAllowed: false as const,
    recommendationMutationAllowed: false as const,
    investmentQualityInferenceAllowed: false as const,
    contractVersion: MARKET_CONVENIENCE_PROJECTION_CONTRACT_VERSION as typeof MARKET_CONVENIENCE_PROJECTION_CONTRACT_VERSION,
  };
  return {
    ...projection,
    deterministicHash: `mc_projh_${stableHash(projection).slice(0, 24)}`,
  };
}

export function marketConvenienceDiagnostics(event: "convenience_observed" | "convenience_measured" | "convenience_finding_created" | "convenience_conflict_detected" | "convenience_degraded" | "convenience_proposal_referenced", input: {
  workspaceId?: string;
  propertyId?: string;
  observationId?: string;
  measurementId?: string;
  findingId?: string;
  serviceType?: string;
  conflictState?: string;
}) {
  return {
    event,
    workspaceScoped: Boolean(clean(input.workspaceId)),
    propertyScoped: Boolean(clean(input.propertyId)),
    observationScoped: Boolean(clean(input.observationId)),
    measurementScoped: Boolean(clean(input.measurementId)),
    findingScoped: Boolean(clean(input.findingId)),
    serviceType: clean(input.serviceType),
    conflictState: clean(input.conflictState),
  };
}

export function isMarketConvenienceServiceType(value: string): value is MarketConvenienceServiceType {
  return marketConvenienceServiceTypes.includes(value as MarketConvenienceServiceType);
}

export function isMarketConvenienceMeasurementType(value: string): value is MarketConvenienceMeasurementType {
  return marketConvenienceMeasurementTypes.includes(value as MarketConvenienceMeasurementType);
}

export function isMarketConvenienceDistanceMethod(value: string): value is MarketConvenienceDistanceMethod {
  return marketConvenienceDistanceMethods.includes(value as MarketConvenienceDistanceMethod);
}

export function isMarketConvenienceTravelTimeMethod(value: string): value is MarketConvenienceTravelTimeMethod {
  return marketConvenienceTravelTimeMethods.includes(value as MarketConvenienceTravelTimeMethod);
}

export function isMarketConvenienceFindingType(value: string): value is MarketConvenienceFindingType {
  return marketConvenienceFindingTypes.includes(value as MarketConvenienceFindingType);
}

function assertEntrySupportsDestination(entry: MarketConvenienceRegistryEntry, geography: MarketConvenienceGeography, method: MarketConvenienceObservationMethod, dataset?: MarketSourceDataset) {
  if (!entry.supportedGeographyLevels.includes(geography.geographyLevel)) throw new Error("Convenience context does not support this geography.");
  if (!entry.supportedObservationMethods.includes(method)) throw new Error("Convenience context does not support this observation method.");
  if (dataset && !entry.applicableDatasets.includes(dataset)) throw new Error("Convenience context does not support this source dataset.");
}

function validateMeasurement(input: Parameters<typeof createMarketConvenienceAccessibilityMeasurement>[0]) {
  if (!marketConvenienceServiceTypes.includes(input.serviceType)) throw new Error("Market convenience service type is not registered.");
  if (!marketConvenienceMeasurementTypes.includes(input.measurementType)) throw new Error("Market convenience measurement type is not registered.");
  if (!marketConvenienceDistanceMethods.includes(input.distanceMethod)) throw new Error("Market convenience distance method is not registered.");
  if (!marketConvenienceTravelTimeMethods.includes(input.travelTimeMethod)) throw new Error("Market convenience travel-time method is not registered.");
  if (input.distanceValue !== undefined && input.distanceValue < 0) throw new Error("Distance value cannot be negative.");
  if (input.travelTimeValue !== undefined && input.travelTimeValue < 0) throw new Error("Travel time value cannot be negative.");
  if (input.travelTimeValue !== undefined && input.travelTimeMethod === "unknown") throw new Error("Travel-time observation requires a stated method.");
  if (input.travelTimeValue !== undefined && !clean(input.measurementTimestamp)) throw new Error("Travel-time observation requires timestamp.");
}

function validateSchool(input: Parameters<typeof createMarketConvenienceSchoolContext>[0]) {
  if (!marketConvenienceSchoolAssignmentStates.includes(input.assignmentState)) throw new Error("School assignment state is not registered.");
  if (!marketConvenienceSchoolTypes.includes(input.schoolType)) throw new Error("School type is not registered.");
  if (input.assignmentState === "reported_assigned" && !clean(input.sourceDate)) throw new Error("Reported school assignment requires source date.");
  if (input.metricValue !== undefined && !clean(input.metricMethodology)) throw new Error("School metrics require source methodology.");
}

function degradedStatesFromShared(input: {
  providerState?: ProviderState;
  freshness?: CanonicalMarketFreshnessResult;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  sourceRecordId?: string;
  geography?: MarketConvenienceGeography;
  subjectGeography?: MarketConvenienceGeography;
}): MarketConvenienceDegradedState[] {
  const states: MarketConvenienceDegradedState[] = [];
  if (input.providerState === "offline" || input.providerState === "maintenance" || input.providerState === "rate_limited" || input.providerState === "authentication_required") states.push("provider_unavailable");
  if (input.providerState === "disabled" || input.providerState === "not_configured" || input.providerState === "unsupported") states.push("source_unavailable");
  if (!input.sourceRecordId && !input.evidenceReference && !(input.provenance ?? []).length) states.push("source_unavailable");
  if (input.freshness?.priorValidResultId || input.freshness?.priorValidSourceRecordId) states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "stale" || input.freshness?.freshnessState === "expired" || input.freshness?.freshnessState === "historical") states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "unavailable") states.push("source_unavailable");
  if (input.freshness?.freshnessState === "missing_temporal_metadata") states.push("missing_temporal_metadata");
  if (input.freshness?.freshnessState === "conflicted") states.push("conflicting_sources");
  const geography = input.geography ?? input.subjectGeography;
  if (geography?.geographyLevel === "unknown") states.push("geography_unsupported");
  if (geography?.proxy || geography?.relationship === "neighborhood_proxy" || geography?.relationship === "centroid_proxy" || geography?.relationship === "area_average") states.push("proxy_only_geography");
  return states;
}

function destinationDegradedStates(input: Parameters<typeof createMarketConvenienceDestinationObservation>[0]): MarketConvenienceDegradedState[] {
  const states: MarketConvenienceDegradedState[] = [];
  if (input.destinationStatus === "temporarily_closed" || input.destinationStatus === "permanently_closed" || input.destinationStatus === "reported_unavailable") states.push("destination_unavailable");
  if (input.destinationStatus === "unknown") states.push("destination_status_unknown");
  return states;
}

function measurementDegradedStates(input: Parameters<typeof createMarketConvenienceAccessibilityMeasurement>[0]): MarketConvenienceDegradedState[] {
  const states: MarketConvenienceDegradedState[] = [];
  if (input.distanceMethod === "unknown") states.push("route_method_unavailable");
  if (input.travelTimeMethod === "unknown") states.push("travel_time_unavailable");
  return states;
}

function serviceDegradedStates(input: Parameters<typeof createMarketConvenienceServiceAvailability>[0]): MarketConvenienceDegradedState[] {
  const states: MarketConvenienceDegradedState[] = [];
  if (input.coverageLevel !== "address_level") {
    if (input.serviceType === "broadband_availability" || input.serviceType === "broadband_speed_tier") states.push("broadband_coverage_uncertain");
    if (input.utilityType) states.push("utility_availability_uncertain");
  }
  if (input.availabilityState === "unknown" || input.availabilityState === "limited") states.push(input.utilityType ? "utility_availability_uncertain" : "broadband_coverage_uncertain");
  return states;
}

function destinationExplanationCodes(input: Parameters<typeof createMarketConvenienceDestinationObservation>[0], degradedStates: readonly MarketConvenienceDegradedState[]): MarketConvenienceExplanationCode[] {
  const codes: MarketConvenienceExplanationCode[] = ["destination_access_observed", "factual_context_only"];
  if (degradedStates.includes("destination_status_unknown") || input.destinationStatus !== "operating") codes.push("facility_status_unverified");
  if (degradedStates.includes("proxy_only_geography")) codes.push("geography_proxy_used");
  if (degradedStates.includes("stale_prior_valid")) codes.push("accessibility_data_stale", "provider_unavailable_prior_valid_retained");
  if (degradedStates.includes("provider_unavailable")) codes.push("provider_unavailable_prior_valid_retained");
  if (degradedStates.includes("source_unavailable") || degradedStates.includes("no_source_coverage")) codes.push("no_absence_inference");
  return codes;
}

function measurementExplanationCodes(input: Parameters<typeof createMarketConvenienceAccessibilityMeasurement>[0], degradedStates: readonly MarketConvenienceDegradedState[]): MarketConvenienceExplanationCode[] {
  const codes: MarketConvenienceExplanationCode[] = ["factual_context_only"];
  if (input.distanceMethod !== "unknown") codes.push("distance_method_declared");
  if (input.travelTimeMethod !== "unknown") codes.push("travel_time_method_declared");
  if (input.distanceMethod === "straight_line") codes.push("straight_line_not_drive_time");
  if (input.distanceMethod === "approximate_radius") codes.push("radius_not_route_access");
  if (input.distanceMethod === "geographic_centroid_proxy" || degradedStates.includes("proxy_only_geography")) codes.push("geography_proxy_used");
  if (degradedStates.includes("stale_prior_valid")) codes.push("accessibility_data_stale");
  return codes;
}

function serviceExplanationCodes(input: Parameters<typeof createMarketConvenienceServiceAvailability>[0]): MarketConvenienceExplanationCode[] {
  const codes: MarketConvenienceExplanationCode[] = ["factual_context_only"];
  if (input.serviceType === "broadband_availability" || input.serviceType === "broadband_speed_tier") codes.push("broadband_coverage_reported");
  if ((input.serviceType === "broadband_availability" || input.serviceType === "broadband_speed_tier") && input.coverageLevel !== "address_level") codes.push("broadband_address_verification_needed");
  if (input.utilityType) codes.push("utility_service_area_reported");
  if (input.utilityType && input.coverageLevel !== "address_level") codes.push("utility_property_verification_needed", "service_area_not_active_connection");
  if (input.advertisedDownMbps !== undefined || input.advertisedUpMbps !== undefined) codes.push("advertised_speed_not_measured_speed");
  return codes;
}

function schoolExplanationCodes(input: Parameters<typeof createMarketConvenienceSchoolContext>[0]): MarketConvenienceExplanationCode[] {
  const codes: MarketConvenienceExplanationCode[] = ["factual_context_only", "no_school_desirability_score"];
  if (input.assignmentState === "reported_assigned") codes.push("school_assignment_reported");
  if (input.assignmentState === "uncertain" || input.assignmentState === "unknown") codes.push("school_assignment_uncertain");
  if (input.metricValue !== undefined) codes.push("school_metric_methodology_preserved");
  return codes;
}

function baseGuardrails(): MarketConvenienceExplanationCode[] {
  return ["no_investment_quality_inference", "no_neighborhood_quality_score", "no_protected_class_scoring", "no_demographic_steering", "no_safety_conclusion", "proposal_only"];
}

function suggestedActionFor(findingType: MarketConvenienceFindingType, conflictState: MarketConvenienceConflictState): MarketConvenienceVerificationAction {
  if (conflictState !== "none") return "inspect_provider_source";
  if (findingType === "school_assignment_reported" || findingType === "school_assignment_uncertain") return "verify_school_assignment";
  if (findingType === "broadband_coverage_reported") return "verify_address_level_broadband";
  if (findingType === "utility_availability_reported") return "verify_utility_connection";
  if (findingType === "transit_access_observed" || findingType === "major_road_access_observed" || findingType === "airport_access_observed") return "verify_route";
  return "verify_source";
}

function firstGeography(
  observations: readonly MarketConvenienceDestinationObservation[],
  measurements: readonly MarketConvenienceAccessibilityMeasurement[],
  services: readonly MarketConvenienceServiceAvailability[],
  schools: readonly MarketConvenienceSchoolContext[],
): MarketConvenienceGeography {
  return observations[0]?.subjectGeography ?? measurements[0]?.subjectGeography ?? services[0]?.geography ?? schools[0]?.geography;
}

function hasConflict(
  observations: readonly MarketConvenienceDestinationObservation[],
  measurements: readonly MarketConvenienceAccessibilityMeasurement[],
  services: readonly MarketConvenienceServiceAvailability[],
  schools: readonly MarketConvenienceSchoolContext[],
) {
  return [...observations, ...measurements, ...services, ...schools].some((item) => item.degradedStates.includes("conflicting_sources"));
}

function worstFreshness(records: readonly { freshness?: CanonicalMarketFreshnessResult }[]): CanonicalMarketFreshnessState | "unknown" {
  const order: (CanonicalMarketFreshnessState | "unknown")[] = ["unknown", "current", "current_with_age_warning", "review_due", "stale", "expired", "historical", "future_effective", "missing_temporal_metadata", "conflicted", "unavailable", "not_applicable", "superseded"];
  return records
    .map((item) => item.freshness?.freshnessState ?? "unknown")
    .sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] ?? "unknown";
}

function normalizeGeography(geography: MarketConvenienceGeography): MarketConvenienceGeography {
  return {
    geographyLevel: geography.geographyLevel,
    geographyIdentity: requiredClean(geography.geographyIdentity, "Market convenience geography requires identity."),
    canonicalLocationId: clean(geography.canonicalLocationId),
    boundaryId: clean(geography.boundaryId),
    boundaryVersion: clean(geography.boundaryVersion),
    relationship: geography.relationship,
    proxy: Boolean(geography.proxy),
  };
}

function entryMaterial(entry: Omit<MarketConvenienceRegistryEntry, "contractVersion" | "materialHash">) {
  return {
    contextId: entry.contextId,
    semanticVersion: entry.semanticVersion,
    category: entry.category,
    serviceType: entry.serviceType,
    applicableDatasets: entry.applicableDatasets,
    supportedGeographyLevels: entry.supportedGeographyLevels,
    supportedMeasurementTypes: entry.supportedMeasurementTypes,
    supportedDistanceMethods: entry.supportedDistanceMethods,
    supportedTravelTimeMethods: entry.supportedTravelTimeMethods,
    supportedObservationMethods: entry.supportedObservationMethods,
    allowsSchoolContext: entry.allowsSchoolContext,
    allowsServiceAvailability: entry.allowsServiceAvailability,
    permittedProposalKinds: entry.permittedProposalKinds,
    prohibitedInferenceCodes: entry.prohibitedInferenceCodes,
  };
}

function entryKey(entry: MarketConvenienceRegistryEntry) {
  return `${entry.contextId}:${entry.semanticVersion}:${entry.category}:${entry.serviceType}`;
}

function stableObservations(records: readonly MarketConvenienceDestinationObservation[]) {
  return [...records].sort((a, b) => a.observationId.localeCompare(b.observationId));
}

function stableMeasurements(records: readonly MarketConvenienceAccessibilityMeasurement[]) {
  return [...records].sort((a, b) => a.measurementId.localeCompare(b.measurementId));
}

function stableServices(records: readonly MarketConvenienceServiceAvailability[]) {
  return [...records].sort((a, b) => a.serviceAvailabilityId.localeCompare(b.serviceAvailabilityId));
}

function stableSchools(records: readonly MarketConvenienceSchoolContext[]) {
  return [...records].sort((a, b) => a.schoolContextId.localeCompare(b.schoolContextId));
}

function stableEvidence(evidence?: SourceEvidenceReference): SourceEvidenceReference | undefined {
  if (!evidence) return undefined;
  return {
    sourceRecordId: clean(evidence.sourceRecordId),
    evidenceId: clean(evidence.evidenceId),
    sourceClassification: evidence.sourceClassification,
    sourceName: clean(evidence.sourceName),
    sourceUrl: clean(evidence.sourceUrl),
    sourceAnchor: evidence.sourceAnchor,
    observedAt: clean(evidence.observedAt),
    effectiveAt: clean(evidence.effectiveAt),
  };
}

function stableProvenance(provenance: readonly MarketProviderProvenance[]): MarketProviderProvenance[] {
  return [...provenance].sort((a, b) => `${a.providerId}:${a.providerRecordReference}`.localeCompare(`${b.providerId}:${b.providerRecordReference}`));
}

function normalizedNumber(value?: number) {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) throw new Error("Market convenience numeric value must be finite.");
  return Number(value.toFixed(4));
}

function uniqueSorted<T extends string>(items: readonly T[]): T[] {
  return Array.from(new Set(items.filter(Boolean))).sort();
}

function requiredClean(value: string | undefined, message: string) {
  const cleaned = clean(value);
  if (!cleaned) throw new Error(message);
  return cleaned;
}

function normalizeId(value: string | undefined, message: string) {
  return requiredClean(value, message).toLowerCase();
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
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

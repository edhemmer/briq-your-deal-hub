import type { CanonicalMarketFreshnessResult, CanonicalMarketFreshnessState } from "./marketFreshness";
import type { GeographicLevel, LocationVerificationState, SourceEvidenceReference } from "./locationIdentity";
import type { MarketProviderProvenance, MarketSourceDataset } from "./marketSourceIngestion";
import type { ProviderConfidence, ProviderState } from "./providerAdapters";

export const MARKET_LOCAL_RISK_CONTRACT_VERSION = "market-local-risk-context-v1";
export const MARKET_LOCAL_RISK_REGISTRY_VERSION = "market-local-risk-registry-v1";
export const MARKET_LOCAL_RISK_OBSERVATION_CONTRACT_VERSION = "market-local-risk-observation-v1";
export const MARKET_LOCAL_RISK_DERIVED_RATE_CONTRACT_VERSION = "market-local-risk-derived-rate-v1";
export const MARKET_LOCAL_RISK_COMPARISON_CONTRACT_VERSION = "market-local-risk-comparison-v1";
export const MARKET_LOCAL_RISK_FINDING_CONTRACT_VERSION = "market-local-risk-finding-v1";
export const MARKET_LOCAL_RISK_CONFLICT_CONTRACT_VERSION = "market-local-risk-conflict-v1";
export const MARKET_LOCAL_RISK_PROJECTION_CONTRACT_VERSION = "market-local-risk-projection-v1";

export const marketLocalRiskCategories = [
  "reported_activity",
  "property_related_incident",
  "person_related_incident",
  "traffic_incident",
  "emergency_response",
  "code_or_nuisance",
  "trend_context",
  "rate_context",
  "coverage_context",
] as const;

export const marketLocalRiskIncidentTypes = [
  "property_crime_reported",
  "violent_crime_reported",
  "theft_reported",
  "burglary_reported",
  "vehicle_incident_reported",
  "vandalism_reported",
  "disturbance_reported",
  "fire_incident_reported",
  "emergency_call_reported",
  "code_enforcement_reported",
  "nuisance_reported",
  "traffic_incident_reported",
  "other_source_reported_activity",
  "unknown",
] as const;

export const marketLocalRiskValueKinds = [
  "raw_count",
  "source_reported_rate",
  "brix_derived_rate",
  "population_normalized_rate",
  "household_normalized_rate",
  "property_unit_normalized_rate",
  "source_index",
  "coverage_state",
  "unknown",
] as const;

export const marketLocalRiskUnits = [
  "events",
  "incidents",
  "calls",
  "cases",
  "rate_per_1000_population",
  "rate_per_1000_households",
  "rate_per_100_properties",
  "percent",
  "index",
  "coverage",
  "unknown",
] as const;

export const marketLocalRiskMethods = [
  "source_reported",
  "public_record",
  "provider_normalized",
  "brix_derived",
  "count",
  "rate",
  "period_adjusted",
  "user_entered_evidence",
  "unknown",
] as const;

export const marketLocalRiskDenominatorTypes = [
  "population",
  "households",
  "housing_units",
  "properties",
  "parcels",
  "area",
  "source_defined",
  "none",
  "unknown",
] as const;

export const marketLocalRiskPeriodWindows = [
  "calendar_month",
  "calendar_quarter",
  "calendar_year",
  "trailing_12_months",
  "provider_defined_period",
  "custom_period",
  "unknown",
] as const;

export const marketLocalRiskCoverageStates = [
  "adequate_coverage",
  "partial_coverage",
  "thin_coverage",
  "insufficient_coverage",
  "no_verified_observations",
  "no_source_coverage",
  "provider_unavailable",
  "stale_prior_valid",
  "conflicting_sources",
  "incompatible_reporting_definitions",
  "awaiting_verification",
  "unknown",
] as const;

export const marketLocalRiskGeographyRelationships = [
  "property_or_parcel",
  "radius_area",
  "drive_time_area",
  "census_geography",
  "neighborhood_proxy",
  "municipality_context",
  "county_context",
  "metro_context",
  "state_context",
  "custom_trade_area",
  "provider_reporting_area",
] as const;

export const marketLocalRiskComparisonKinds = [
  "prior_period",
  "prior_year",
  "broader_geography",
  "peer_geography",
  "source_benchmark",
] as const;

export const marketLocalRiskConflictStates = [
  "none",
  "provider_conflict",
  "period_conflict",
  "geography_conflict",
  "category_definition_conflict",
  "methodology_conflict",
  "rate_conflict",
  "coverage_conflict",
  "denominator_conflict",
  "boundary_version_conflict",
  "unresolved",
] as const;

export const marketLocalRiskDegradedStates = [
  "provider_unavailable",
  "source_unavailable",
  "insufficient_coverage",
  "thin_coverage",
  "no_source_coverage",
  "no_verified_observations",
  "stale_prior_valid",
  "conflicting_sources",
  "incompatible_reporting_definitions",
  "missing_methodology",
  "missing_denominator",
  "zero_denominator",
  "incompatible_denominator",
  "missing_period",
  "proxy_only_geography",
  "geography_unsupported",
  "boundary_version_missing",
  "permission_restricted",
  "awaiting_verification",
] as const;

export const marketLocalRiskExplanationCodes = [
  "reported_activity_observed",
  "event_count_reported",
  "source_rate_reported",
  "brix_rate_derived",
  "denominator_method_declared",
  "period_declared",
  "geography_declared",
  "proxy_geography_used",
  "coverage_limitation_declared",
  "no_verified_observations_not_no_risk",
  "no_source_coverage_not_zero",
  "provider_unavailable_prior_valid_retained",
  "stale_prior_valid_retained",
  "conflicting_local_risk_sources",
  "incompatible_reporting_definitions",
  "comparison_compatible",
  "comparison_rejected",
  "methodology_preserved",
  "factual_context_only",
  "no_safety_label",
  "no_neighborhood_desirability_score",
  "no_demographic_proxy",
  "no_protected_class_scoring",
  "no_discriminatory_steering",
  "no_resident_character_inference",
  "no_future_crime_prediction",
  "no_property_value_conclusion",
  "no_rent_growth_conclusion",
  "no_investment_quality_inference",
  "proposal_only",
  "underwriting_not_mutated",
  "strategy_not_mutated",
] as const;

export const marketLocalRiskImpactClasses = [
  "informational",
  "verification_needed",
  "decision_context",
  "assumption_review",
  "professional_review_recommended",
] as const;

export const marketLocalRiskVerificationActions = [
  "verify_source",
  "verify_reporting_period",
  "verify_geography_boundary",
  "verify_denominator",
  "review_provider_methodology",
  "compare_public_records",
  "none",
] as const;

export const prohibitedMarketLocalRiskLabels = [
  "safe",
  "unsafe",
  "dangerous neighborhood",
  "good neighborhood",
  "bad neighborhood",
  "desirable area",
  "undesirable area",
  "family friendly demographics",
  "high quality residents",
  "low quality residents",
] as const;

export const prohibitedMarketLocalRiskProxyCodes = [
  "race",
  "color",
  "religion",
  "sex",
  "familial_status",
  "national_origin",
  "disability",
  "age",
  "income_proxy_as_resident_quality",
  "school_demographic_proxy",
  "crime_demographic_proxy",
] as const;

export type MarketLocalRiskCategory = typeof marketLocalRiskCategories[number];
export type MarketLocalRiskIncidentType = typeof marketLocalRiskIncidentTypes[number];
export type MarketLocalRiskValueKind = typeof marketLocalRiskValueKinds[number];
export type MarketLocalRiskUnit = typeof marketLocalRiskUnits[number];
export type MarketLocalRiskMethod = typeof marketLocalRiskMethods[number];
export type MarketLocalRiskDenominatorType = typeof marketLocalRiskDenominatorTypes[number];
export type MarketLocalRiskPeriodWindow = typeof marketLocalRiskPeriodWindows[number];
export type MarketLocalRiskCoverageState = typeof marketLocalRiskCoverageStates[number];
export type MarketLocalRiskGeographyRelationship = typeof marketLocalRiskGeographyRelationships[number];
export type MarketLocalRiskComparisonKind = typeof marketLocalRiskComparisonKinds[number];
export type MarketLocalRiskConflictState = typeof marketLocalRiskConflictStates[number];
export type MarketLocalRiskDegradedState = typeof marketLocalRiskDegradedStates[number];
export type MarketLocalRiskExplanationCode = typeof marketLocalRiskExplanationCodes[number];
export type MarketLocalRiskImpactClass = typeof marketLocalRiskImpactClasses[number];
export type MarketLocalRiskVerificationAction = typeof marketLocalRiskVerificationActions[number];
export type MarketLocalRiskLifecycleStatus = "active" | "deprecated" | "disabled";
export type MarketLocalRiskComparisonCompatibility = "compatible" | "rejected";

export type MarketLocalRiskGeography = {
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  canonicalLocationId?: string;
  boundaryId?: string;
  boundaryVersion?: string;
  relationship: MarketLocalRiskGeographyRelationship;
  proxy: boolean;
  proxyReason?: string;
};

export type MarketLocalRiskPeriod = {
  window: MarketLocalRiskPeriodWindow;
  periodStart?: string;
  periodEnd?: string;
  sourceFrequency: "monthly" | "quarterly" | "annual" | "provider_defined" | "unknown";
  historical: boolean;
  current: boolean;
  publicationTime?: string;
  retrievalTime?: string;
};

export type MarketLocalRiskDenominator = {
  denominatorType: MarketLocalRiskDenominatorType;
  value?: number;
  unit?: string;
  geographyIdentity?: string;
  periodStart?: string;
  periodEnd?: string;
  methodology: MarketLocalRiskMethod;
  sourceRecordId?: string;
};

export type MarketLocalRiskValue = {
  rawValue: number | string | null;
  normalizedValue: number | null;
  valueKind: MarketLocalRiskValueKind;
  unit: MarketLocalRiskUnit;
  denominator?: MarketLocalRiskDenominator;
  numeratorDefinition?: string;
  formulaId?: string;
  formulaVersion?: string;
  valueOrigin: "source_reported" | "brix_derived" | "user_entered";
};

export type MarketLocalRiskRegistryEntry = {
  contextId: string;
  semanticVersion: string;
  category: MarketLocalRiskCategory;
  incidentType: MarketLocalRiskIncidentType;
  valueKind: MarketLocalRiskValueKind;
  unit: MarketLocalRiskUnit;
  applicableDatasets: readonly MarketSourceDataset[];
  supportedGeographyLevels: readonly GeographicLevel[];
  supportedMethods: readonly MarketLocalRiskMethod[];
  supportedPeriodWindows: readonly MarketLocalRiskPeriodWindow[];
  allowedDenominatorTypes: readonly MarketLocalRiskDenominatorType[];
  lifecycleStatus: MarketLocalRiskLifecycleStatus;
  permittedProposalKinds: readonly string[];
  prohibitedInferenceCodes: readonly string[];
  registeredAt: string;
  contractVersion: typeof MARKET_LOCAL_RISK_CONTRACT_VERSION;
  materialHash: string;
};

export type MarketLocalRiskRegistry = {
  registryId: string;
  version: typeof MARKET_LOCAL_RISK_REGISTRY_VERSION;
  entries: MarketLocalRiskRegistryEntry[];
  materialHash: string;
};

export type MarketLocalRiskObservation = {
  observationId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  contextId: string;
  contextVersion: string;
  category: MarketLocalRiskCategory;
  incidentType: MarketLocalRiskIncidentType;
  geography: MarketLocalRiskGeography;
  period: MarketLocalRiskPeriod;
  value: MarketLocalRiskValue;
  method: MarketLocalRiskMethod;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  dataset?: MarketSourceDataset;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance: MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  coverageState: MarketLocalRiskCoverageState;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes: string[];
  degradedStates: MarketLocalRiskDegradedState[];
  explanationCodes: MarketLocalRiskExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_LOCAL_RISK_OBSERVATION_CONTRACT_VERSION;
};

export type MarketLocalRiskDerivedRate = {
  derivedRateId: string;
  workspaceId: string;
  sourceObservationId: string;
  value: MarketLocalRiskValue;
  denominator: MarketLocalRiskDenominator;
  coverageState: MarketLocalRiskCoverageState;
  degradedStates: MarketLocalRiskDegradedState[];
  explanationCodes: MarketLocalRiskExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_LOCAL_RISK_DERIVED_RATE_CONTRACT_VERSION;
};

export type MarketLocalRiskComparison = {
  comparisonId: string;
  workspaceId: string;
  comparisonKind: MarketLocalRiskComparisonKind;
  currentObservationId: string;
  comparisonObservationId: string;
  compatibility: MarketLocalRiskComparisonCompatibility;
  conflictState: MarketLocalRiskConflictState;
  reasonCodes: MarketLocalRiskExplanationCode[];
  currentValue?: number | null;
  comparisonValue?: number | null;
  difference?: number;
  percentChange?: number;
  deterministicHash: string;
  contractVersion: typeof MARKET_LOCAL_RISK_COMPARISON_CONTRACT_VERSION;
};

export type MarketLocalRiskFinding = {
  findingId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: "reported_context" | "rate_context" | "coverage_context" | "conflict_context" | "unavailable_context";
  sourceObservationIds: string[];
  comparisonIds: string[];
  category: MarketLocalRiskCategory;
  incidentType: MarketLocalRiskIncidentType;
  geography: MarketLocalRiskGeography;
  period: MarketLocalRiskPeriod;
  impactClass: MarketLocalRiskImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState | "unknown";
  coverageState: MarketLocalRiskCoverageState;
  limitationCodes: string[];
  degradedStates: MarketLocalRiskDegradedState[];
  applicableStrategyReferences: string[];
  suggestedVerificationAction: MarketLocalRiskVerificationAction;
  explanationCodes: MarketLocalRiskExplanationCode[];
  conflictState: MarketLocalRiskConflictState;
  assumptionProposalReferences: string[];
  stableOrdinal: number;
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  safetyConclusionAllowed: false;
  investmentQualityInferenceAllowed: false;
  neighborhoodDesirabilityConclusionAllowed: false;
  residentCharacterInferenceAllowed: false;
  protectedClassScoringAllowed: false;
  futureCrimePredictionAllowed: false;
  propertyValueConclusionAllowed: false;
  rentGrowthConclusionAllowed: false;
  deterministicHash: string;
  contractVersion: typeof MARKET_LOCAL_RISK_FINDING_CONTRACT_VERSION;
};

export type MarketLocalRiskConflictManifest = {
  conflictId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketLocalRiskConflictState, "none">;
  observationIds: string[];
  comparisonIds: string[];
  geography?: MarketLocalRiskGeography;
  reasonCodes: MarketLocalRiskExplanationCode[];
  retainedRecordIds: string[];
  blockedUntilResolved: true;
  deterministicHash: string;
  contractVersion: typeof MARKET_LOCAL_RISK_CONFLICT_CONTRACT_VERSION;
};

export type MarketLocalRiskProjection = {
  findingId: string;
  sourceObservationIds: string[];
  comparisonIds: string[];
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  category: MarketLocalRiskCategory;
  incidentType: MarketLocalRiskIncidentType;
  impactClass: MarketLocalRiskImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState | "unknown";
  coverageState: MarketLocalRiskCoverageState;
  conflictState: MarketLocalRiskConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  safetyConclusionAllowed: false;
  investmentQualityInferenceAllowed: false;
  neighborhoodDesirabilityConclusionAllowed: false;
  protectedClassScoringAllowed: false;
  contractVersion: typeof MARKET_LOCAL_RISK_PROJECTION_CONTRACT_VERSION;
  deterministicHash: string;
};

type RegistryEntryInput = Omit<MarketLocalRiskRegistryEntry, "contractVersion" | "materialHash">;

export function defineMarketLocalRiskRegistryEntry(input: RegistryEntryInput): MarketLocalRiskRegistryEntry {
  const contextId = normalizeId(input.contextId, "Market local-risk registry entry requires context ID.");
  if (!marketLocalRiskCategories.includes(input.category)) throw new Error("Market local-risk category is not registered.");
  if (!marketLocalRiskIncidentTypes.includes(input.incidentType)) throw new Error("Market local-risk incident type is not registered.");
  if (!marketLocalRiskValueKinds.includes(input.valueKind)) throw new Error("Market local-risk value kind is not registered.");
  if (!marketLocalRiskUnits.includes(input.unit)) throw new Error("Market local-risk unit is not registered.");
  if (input.lifecycleStatus === "disabled") throw new Error("Disabled local-risk registry entries cannot be used for new observations.");
  const entry = {
    ...input,
    contextId,
    semanticVersion: requiredClean(input.semanticVersion, "Market local-risk registry entry requires semantic version."),
    applicableDatasets: uniqueSorted(input.applicableDatasets),
    supportedGeographyLevels: uniqueSorted(input.supportedGeographyLevels),
    supportedMethods: uniqueSorted(input.supportedMethods),
    supportedPeriodWindows: uniqueSorted(input.supportedPeriodWindows),
    allowedDenominatorTypes: uniqueSorted(input.allowedDenominatorTypes),
    permittedProposalKinds: uniqueSorted(input.permittedProposalKinds),
    prohibitedInferenceCodes: uniqueSorted([...input.prohibitedInferenceCodes, ...baseProhibitedInferenceCodes()]),
    registeredAt: requiredClean(input.registeredAt, "Market local-risk registry entry requires registration time."),
    contractVersion: MARKET_LOCAL_RISK_CONTRACT_VERSION as typeof MARKET_LOCAL_RISK_CONTRACT_VERSION,
  };
  return {
    ...entry,
    materialHash: `mlr_entryh_${stableHash(registryMaterial(entry)).slice(0, 24)}`,
  };
}

export function createMarketLocalRiskRegistry(entries: readonly MarketLocalRiskRegistryEntry[]): MarketLocalRiskRegistry {
  const sorted = [...entries].sort((a, b) => entryKey(a).localeCompare(entryKey(b)));
  const seen = new Set<string>();
  for (const entry of sorted) {
    const key = `${entry.contextId}@${entry.semanticVersion}`;
    if (seen.has(key)) throw new Error(`Duplicate market local-risk registry entry ${key}.`);
    seen.add(key);
  }
  const material = sorted.map((entry) => ({ contextId: entry.contextId, semanticVersion: entry.semanticVersion, materialHash: entry.materialHash }));
  return {
    registryId: `mlr_reg_${stableHash(material).slice(0, 24)}`,
    version: MARKET_LOCAL_RISK_REGISTRY_VERSION,
    entries: sorted,
    materialHash: `mlr_regh_${stableHash(material).slice(0, 24)}`,
  };
}

export function selectMarketLocalRiskRegistryEntry(input: {
  registry: MarketLocalRiskRegistry;
  contextId: string;
  semanticVersion?: string;
  allowDeprecated?: boolean;
}): MarketLocalRiskRegistryEntry {
  const contextId = normalizeId(input.contextId, "Market local-risk selection requires context ID.");
  const candidates = input.registry.entries.filter((entry) =>
    entry.contextId === contextId &&
    (input.allowDeprecated ? entry.lifecycleStatus !== "disabled" : entry.lifecycleStatus === "active")
  );
  if (!candidates.length) throw new Error("No active market local-risk registry entry matches the requested context.");
  if (input.semanticVersion) {
    const exact = candidates.find((entry) => entry.semanticVersion === input.semanticVersion);
    if (!exact) throw new Error("Requested market local-risk registry version is not available.");
    return exact;
  }
  return candidates.sort((a, b) => b.semanticVersion.localeCompare(a.semanticVersion))[0];
}

export function createMarketLocalRiskObservation(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  entry: MarketLocalRiskRegistryEntry;
  geography: MarketLocalRiskGeography;
  period: MarketLocalRiskPeriod;
  value: MarketLocalRiskValue;
  method: MarketLocalRiskMethod;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  dataset?: MarketSourceDataset;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  coverageState?: MarketLocalRiskCoverageState;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  limitationCodes?: readonly string[];
  degradedStates?: readonly MarketLocalRiskDegradedState[];
  explanationCodes?: readonly MarketLocalRiskExplanationCode[];
}): MarketLocalRiskObservation {
  const entry = assertActiveEntry(input.entry);
  if (!entry.supportedMethods.includes(input.method)) throw new Error("Market local-risk method is not supported by the registry entry.");
  if (input.dataset && !entry.applicableDatasets.includes(input.dataset)) throw new Error("Market local-risk source dataset is not supported by the registry entry.");
  const geography = normalizeGeography(input.geography, entry);
  const period = normalizePeriod(input.period, entry);
  const value = normalizeValue(input.value, entry);
  const coverageState = input.coverageState ?? coverageStateFrom(input, value);
  const degradedStates = uniqueSorted([
    ...(input.degradedStates ?? []),
    ...degradedStatesFromShared(input.providerState, input.freshness, geography, period, value, coverageState),
  ]);
  const explanationCodes = uniqueSorted([
    ...(input.explanationCodes ?? []),
    ...explanationsForObservation(input.method, geography, value, coverageState, degradedStates),
    ...guardrailExplanations(),
  ]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market local-risk observation requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    canonicalLocationId: clean(input.canonicalLocationId),
    contextId: entry.contextId,
    contextVersion: entry.semanticVersion,
    category: entry.category,
    incidentType: entry.incidentType,
    geography,
    period,
    value,
    method: input.method,
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    dataset: input.dataset ?? entry.applicableDatasets[0],
    sourceRecordId: clean(input.sourceRecordId),
    sourceRecordKey: clean(input.sourceRecordKey),
    evidenceReference: stableEvidence(input.evidenceReference),
    provenance: stableProvenance(input.provenance ?? []),
    freshnessResultId: clean(input.freshness?.freshnessResultId),
    coverageState,
    verificationState: input.verificationState,
    confidence: input.confidence,
    limitationCodes: uniqueSorted([...(input.limitationCodes ?? []), ...(coverageState === "no_source_coverage" ? ["no_source_coverage_not_zero"] : [])]),
    degradedStates,
    explanationCodes,
  };
  return {
    ...basis,
    observationId: `mlr_obs_${stableHash({ ...basis, sourceRecordKey: undefined }).slice(0, 24)}`,
    freshness: input.freshness,
    deterministicHash: `mlr_obsh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LOCAL_RISK_OBSERVATION_CONTRACT_VERSION,
  };
}

export function deriveMarketLocalRiskRate(input: {
  workspaceId: string;
  sourceObservation: MarketLocalRiskObservation;
  denominator: MarketLocalRiskDenominator;
  ratePer: 100 | 1000;
  unit: Extract<MarketLocalRiskUnit, "rate_per_1000_population" | "rate_per_1000_households" | "rate_per_100_properties">;
  formulaId: string;
  formulaVersion: string;
}): MarketLocalRiskDerivedRate {
  const workspaceId = requiredClean(input.workspaceId, "Market local-risk rate derivation requires workspace scope.");
  if (workspaceId !== input.sourceObservation.workspaceId) throw new Error("Market local-risk rate derivation cannot cross workspace boundaries.");
  const denominator = normalizeDenominator(input.denominator);
  const degradedStates: MarketLocalRiskDegradedState[] = [];
  if (denominator.denominatorType === "none" || denominator.denominatorType === "unknown" || denominator.value === undefined) degradedStates.push("missing_denominator");
  if (denominator.value !== undefined && denominator.value <= 0) degradedStates.push("zero_denominator");
  if (denominator.methodology === "unknown") degradedStates.push("missing_methodology");
  if (degradedStates.length) {
    throw Object.assign(new Error("Market local-risk rate derivation requires a positive denominator with declared methodology."), { degradedStates });
  }
  const numerator = numericValue(input.sourceObservation.value);
  const normalizedValue = Number(((numerator / denominator.value!) * input.ratePer).toFixed(6));
  const value: MarketLocalRiskValue = {
    rawValue: normalizedValue,
    normalizedValue,
    valueKind: input.ratePer === 1000 ? denominatorRateKind(denominator.denominatorType) : "property_unit_normalized_rate",
    unit: input.unit,
    denominator,
    numeratorDefinition: input.sourceObservation.value.numeratorDefinition,
    formulaId: requiredClean(input.formulaId, "Market local-risk rate derivation requires formula ID."),
    formulaVersion: requiredClean(input.formulaVersion, "Market local-risk rate derivation requires formula version."),
    valueOrigin: "brix_derived",
  };
  const basis = {
    workspaceId,
    sourceObservationId: input.sourceObservation.observationId,
    value,
    denominator,
    coverageState: input.sourceObservation.coverageState,
  };
  return {
    ...basis,
    derivedRateId: `mlr_rate_${stableHash(basis).slice(0, 24)}`,
    degradedStates: [],
    explanationCodes: ["brix_rate_derived", "denominator_method_declared", "factual_context_only", "proposal_only"],
    deterministicHash: `mlr_rateh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LOCAL_RISK_DERIVED_RATE_CONTRACT_VERSION,
  };
}

export function createMarketLocalRiskComparison(input: {
  workspaceId: string;
  comparisonKind: MarketLocalRiskComparisonKind;
  currentObservation: MarketLocalRiskObservation;
  comparisonObservation: MarketLocalRiskObservation;
}): MarketLocalRiskComparison {
  const workspaceId = requiredClean(input.workspaceId, "Market local-risk comparison requires workspace scope.");
  if (workspaceId !== input.currentObservation.workspaceId || workspaceId !== input.comparisonObservation.workspaceId) throw new Error("Market local-risk comparison cannot cross workspace boundaries.");
  if (!marketLocalRiskComparisonKinds.includes(input.comparisonKind)) throw new Error("Market local-risk comparison kind is not registered.");
  const conflictState = comparisonConflict(input.currentObservation, input.comparisonObservation);
  const compatibility: MarketLocalRiskComparisonCompatibility = conflictState === "none" ? "compatible" : "rejected";
  const currentValue = input.currentObservation.value.normalizedValue;
  const comparisonValue = input.comparisonObservation.value.normalizedValue;
  const difference = compatibility === "compatible" && currentValue !== null && comparisonValue !== null ? Number((currentValue - comparisonValue).toFixed(6)) : undefined;
  const percentChange = difference !== undefined && comparisonValue !== 0 ? Number((difference / Math.abs(comparisonValue!)).toFixed(6)) : undefined;
  const basis = {
    workspaceId,
    comparisonKind: input.comparisonKind,
    currentObservationId: input.currentObservation.observationId,
    comparisonObservationId: input.comparisonObservation.observationId,
    compatibility,
    conflictState,
    currentValue,
    comparisonValue,
    difference,
    percentChange,
  };
  return {
    ...basis,
    comparisonId: `mlr_cmp_${stableHash(basis).slice(0, 24)}`,
    reasonCodes: compatibility === "compatible" ? ["comparison_compatible", "factual_context_only"] : ["comparison_rejected", "incompatible_reporting_definitions"],
    deterministicHash: `mlr_cmph_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LOCAL_RISK_COMPARISON_CONTRACT_VERSION,
  };
}

export function createMarketLocalRiskFinding(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketLocalRiskFinding["findingType"];
  sourceObservations: readonly MarketLocalRiskObservation[];
  comparisons?: readonly MarketLocalRiskComparison[];
  category?: MarketLocalRiskCategory;
  incidentType?: MarketLocalRiskIncidentType;
  geography?: MarketLocalRiskGeography;
  period?: MarketLocalRiskPeriod;
  impactClass: MarketLocalRiskImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState?: CanonicalMarketFreshnessState | "unknown";
  coverageState?: MarketLocalRiskCoverageState;
  limitationCodes?: readonly string[];
  degradedStates?: readonly MarketLocalRiskDegradedState[];
  applicableStrategyReferences?: readonly string[];
  suggestedVerificationAction?: MarketLocalRiskVerificationAction;
  explanationCodes?: readonly MarketLocalRiskExplanationCode[];
  conflictState?: MarketLocalRiskConflictState;
  assumptionProposalReferences?: readonly string[];
  stableOrdinal?: number;
}): MarketLocalRiskFinding {
  const workspaceId = requiredClean(input.workspaceId, "Market local-risk finding requires workspace scope.");
  const observations = [...input.sourceObservations].sort((a, b) => a.observationId.localeCompare(b.observationId));
  if (!observations.length) throw new Error("Market local-risk finding requires at least one source observation.");
  if (!observations.every((observation) => observation.workspaceId === workspaceId)) throw new Error("Market local-risk finding cannot cross workspace boundaries.");
  const comparisons = [...(input.comparisons ?? [])].sort((a, b) => a.comparisonId.localeCompare(b.comparisonId));
  const first = observations[0];
  const conflictState = input.conflictState ?? (comparisons.some((comparison) => comparison.compatibility === "rejected") ? "unresolved" : observations.some((observation) => observation.coverageState === "conflicting_sources") ? "unresolved" : "none");
  const degradedStates = uniqueSorted([
    ...(input.degradedStates ?? []),
    ...observations.flatMap((observation) => observation.degradedStates),
    ...(conflictState === "none" ? [] : ["conflicting_sources" as const]),
  ]);
  const explanationCodes = uniqueSorted([
    ...(input.explanationCodes ?? []),
    ...(conflictState === "none" ? [] : ["conflicting_local_risk_sources" as const]),
    ...guardrailExplanations(),
    "underwriting_not_mutated",
    "strategy_not_mutated",
  ]);
  const basis = {
    workspaceId,
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    findingType: input.findingType,
    sourceObservationIds: observations.map((observation) => observation.observationId),
    comparisonIds: comparisons.map((comparison) => comparison.comparisonId),
    category: input.category ?? first.category,
    incidentType: input.incidentType ?? first.incidentType,
    geography: input.geography ?? first.geography,
    period: input.period ?? first.period,
    impactClass: input.impactClass,
    confidence: input.confidence,
    verificationState: input.verificationState,
    freshnessState: input.freshnessState ?? worstFreshness(observations),
    coverageState: input.coverageState ?? worstCoverage(observations),
    limitationCodes: uniqueSorted([...(input.limitationCodes ?? []), ...observations.flatMap((observation) => observation.limitationCodes)]),
    degradedStates,
    applicableStrategyReferences: uniqueSorted(input.applicableStrategyReferences ?? []),
    suggestedVerificationAction: input.suggestedVerificationAction ?? actionFor(conflictState, worstCoverage(observations)),
    explanationCodes,
    conflictState,
    assumptionProposalReferences: uniqueSorted(input.assumptionProposalReferences ?? []),
    stableOrdinal: Math.max(0, Math.trunc(input.stableOrdinal ?? 0)),
  };
  return {
    ...basis,
    findingId: `mlr_find_${stableHash({ workspaceId, sourceObservationIds: basis.sourceObservationIds, stableOrdinal: basis.stableOrdinal }).slice(0, 24)}`,
    underwritingMutationAllowed: false,
    strategyRerankAllowed: false,
    recommendationMutationAllowed: false,
    safetyConclusionAllowed: false,
    investmentQualityInferenceAllowed: false,
    neighborhoodDesirabilityConclusionAllowed: false,
    residentCharacterInferenceAllowed: false,
    protectedClassScoringAllowed: false,
    futureCrimePredictionAllowed: false,
    propertyValueConclusionAllowed: false,
    rentGrowthConclusionAllowed: false,
    deterministicHash: `mlr_findh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LOCAL_RISK_FINDING_CONTRACT_VERSION,
  };
}

export function createMarketLocalRiskConflictManifest(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketLocalRiskConflictState, "none">;
  observations: readonly MarketLocalRiskObservation[];
  comparisons?: readonly MarketLocalRiskComparison[];
  geography?: MarketLocalRiskGeography;
  reasonCodes?: readonly MarketLocalRiskExplanationCode[];
  retainedRecordIds?: readonly string[];
}): MarketLocalRiskConflictManifest {
  const workspaceId = requiredClean(input.workspaceId, "Market local-risk conflict requires workspace scope.");
  const observations = [...input.observations].sort((a, b) => a.observationId.localeCompare(b.observationId));
  const comparisons = [...(input.comparisons ?? [])].sort((a, b) => a.comparisonId.localeCompare(b.comparisonId));
  if (observations.length + comparisons.length < 2) throw new Error("Market local-risk conflict requires at least two source records.");
  if (!observations.every((observation) => observation.workspaceId === workspaceId) || !comparisons.every((comparison) => comparison.workspaceId === workspaceId)) throw new Error("Market local-risk conflict cannot cross workspace boundaries.");
  const recordIds = observations.map((observation) => observation.observationId).concat(comparisons.map((comparison) => comparison.comparisonId));
  const basis = {
    workspaceId,
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    conflictState: input.conflictState,
    observationIds: observations.map((observation) => observation.observationId),
    comparisonIds: comparisons.map((comparison) => comparison.comparisonId),
    geography: input.geography ?? observations[0]?.geography,
    reasonCodes: uniqueSorted(input.reasonCodes ?? ["conflicting_local_risk_sources"]),
    retainedRecordIds: uniqueSorted(input.retainedRecordIds ?? recordIds),
  };
  return {
    ...basis,
    conflictId: `mlr_conf_${stableHash(basis).slice(0, 24)}`,
    blockedUntilResolved: true,
    deterministicHash: `mlr_confh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LOCAL_RISK_CONFLICT_CONTRACT_VERSION,
  };
}

export function projectMarketLocalRiskFinding(finding: MarketLocalRiskFinding): MarketLocalRiskProjection {
  const projection = {
    findingId: finding.findingId,
    sourceObservationIds: finding.sourceObservationIds,
    comparisonIds: finding.comparisonIds,
    geographyLevel: finding.geography.geographyLevel,
    geographyIdentity: finding.geography.geographyIdentity,
    category: finding.category,
    incidentType: finding.incidentType,
    impactClass: finding.impactClass,
    confidence: finding.confidence,
    verificationState: finding.verificationState,
    freshnessState: finding.freshnessState,
    coverageState: finding.coverageState,
    conflictState: finding.conflictState,
    assumptionProposalReferences: finding.assumptionProposalReferences,
    underwritingMutationAllowed: false as const,
    strategyRerankAllowed: false as const,
    recommendationMutationAllowed: false as const,
    safetyConclusionAllowed: false as const,
    investmentQualityInferenceAllowed: false as const,
    neighborhoodDesirabilityConclusionAllowed: false as const,
    protectedClassScoringAllowed: false as const,
    contractVersion: MARKET_LOCAL_RISK_PROJECTION_CONTRACT_VERSION as typeof MARKET_LOCAL_RISK_PROJECTION_CONTRACT_VERSION,
  };
  return {
    ...projection,
    deterministicHash: `mlr_projh_${stableHash(projection).slice(0, 24)}`,
  };
}

export function assertNoProhibitedMarketLocalRiskLanguage(text: string) {
  const normalized = text.toLowerCase();
  for (const label of prohibitedMarketLocalRiskLabels) {
    if (normalized.includes(label)) throw new Error("Market local-risk output cannot use safety, quality, resident-character, or desirability labels.");
  }
  return true;
}

export function assertNoProtectedMarketLocalRiskProxy(proxyCode?: string) {
  if (proxyCode && prohibitedMarketLocalRiskProxyCodes.includes(proxyCode as typeof prohibitedMarketLocalRiskProxyCodes[number])) {
    throw new Error("Market local-risk output cannot use protected-class or demographic proxy scoring.");
  }
  return true;
}

export function marketLocalRiskDiagnostics(event: "local_risk_observed" | "local_risk_rate_derived" | "local_risk_compared" | "local_risk_finding_created" | "local_risk_conflict_detected" | "local_risk_degraded", input: {
  workspaceId?: string;
  observationId?: string;
  findingId?: string;
  conflictState?: string;
  coverageState?: string;
}) {
  return {
    event,
    workspaceScoped: Boolean(clean(input.workspaceId)),
    observationScoped: Boolean(clean(input.observationId)),
    findingScoped: Boolean(clean(input.findingId)),
    conflictState: clean(input.conflictState),
    coverageState: clean(input.coverageState),
  };
}

export function isMarketLocalRiskIncidentType(value: string): value is MarketLocalRiskIncidentType {
  return marketLocalRiskIncidentTypes.includes(value as MarketLocalRiskIncidentType);
}

export function isMarketLocalRiskCoverageState(value: string): value is MarketLocalRiskCoverageState {
  return marketLocalRiskCoverageStates.includes(value as MarketLocalRiskCoverageState);
}

export function isMarketLocalRiskExplanationCode(value: string): value is MarketLocalRiskExplanationCode {
  return marketLocalRiskExplanationCodes.includes(value as MarketLocalRiskExplanationCode);
}

function assertActiveEntry(entry: MarketLocalRiskRegistryEntry) {
  if (entry.lifecycleStatus === "disabled") throw new Error("Disabled local-risk registry entries cannot create new observations.");
  return entry;
}

function normalizeGeography(geography: MarketLocalRiskGeography, entry: MarketLocalRiskRegistryEntry): MarketLocalRiskGeography {
  if (!entry.supportedGeographyLevels.includes(geography.geographyLevel)) throw new Error("Market local-risk geography is not supported by the registry entry.");
  return {
    geographyLevel: geography.geographyLevel,
    geographyIdentity: requiredClean(geography.geographyIdentity, "Market local-risk geography requires identity."),
    canonicalLocationId: clean(geography.canonicalLocationId),
    boundaryId: clean(geography.boundaryId),
    boundaryVersion: clean(geography.boundaryVersion),
    relationship: geography.relationship,
    proxy: Boolean(geography.proxy),
    proxyReason: clean(geography.proxyReason),
  };
}

function normalizePeriod(period: MarketLocalRiskPeriod, entry: MarketLocalRiskRegistryEntry): MarketLocalRiskPeriod {
  if (!entry.supportedPeriodWindows.includes(period.window)) throw new Error("Market local-risk period window is not supported by the registry entry.");
  const normalized = {
    window: period.window,
    periodStart: clean(period.periodStart),
    periodEnd: clean(period.periodEnd),
    sourceFrequency: period.sourceFrequency,
    historical: Boolean(period.historical),
    current: Boolean(period.current),
    publicationTime: clean(period.publicationTime),
    retrievalTime: clean(period.retrievalTime),
  };
  if (period.window !== "unknown" && (!normalized.periodStart || !normalized.periodEnd)) throw new Error("Market local-risk period requires start and end dates.");
  return normalized;
}

function normalizeValue(value: MarketLocalRiskValue, entry: MarketLocalRiskRegistryEntry): MarketLocalRiskValue {
  if (value.valueKind !== entry.valueKind) throw new Error("Market local-risk value kind must match the registry entry.");
  if (value.unit !== entry.unit) throw new Error("Market local-risk unit must match the registry entry.");
  if (value.denominator && !entry.allowedDenominatorTypes.includes(value.denominator.denominatorType)) throw new Error("Market local-risk denominator type is not allowed by the registry entry.");
  return {
    rawValue: value.rawValue,
    normalizedValue: value.normalizedValue === null ? null : normalizedNumber(value.normalizedValue),
    valueKind: value.valueKind,
    unit: value.unit,
    denominator: value.denominator ? normalizeDenominator(value.denominator) : undefined,
    numeratorDefinition: clean(value.numeratorDefinition),
    formulaId: clean(value.formulaId),
    formulaVersion: clean(value.formulaVersion),
    valueOrigin: value.valueOrigin,
  };
}

function normalizeDenominator(denominator: MarketLocalRiskDenominator): MarketLocalRiskDenominator {
  if (denominator.value !== undefined && !Number.isFinite(denominator.value)) throw new Error("Market local-risk denominator must be finite.");
  return {
    denominatorType: denominator.denominatorType,
    value: denominator.value === undefined ? undefined : normalizedNumber(denominator.value),
    unit: clean(denominator.unit),
    geographyIdentity: clean(denominator.geographyIdentity),
    periodStart: clean(denominator.periodStart),
    periodEnd: clean(denominator.periodEnd),
    methodology: denominator.methodology,
    sourceRecordId: clean(denominator.sourceRecordId),
  };
}

function coverageStateFrom(input: Parameters<typeof createMarketLocalRiskObservation>[0], value: MarketLocalRiskValue): MarketLocalRiskCoverageState {
  if (input.providerState === "offline" || input.providerState === "maintenance" || input.providerState === "authentication_required") return "provider_unavailable";
  if (!input.sourceRecordId && !input.evidenceReference && !(input.provenance ?? []).length) return "no_source_coverage";
  if (value.valueKind === "coverage_state") return "partial_coverage";
  return "adequate_coverage";
}

function degradedStatesFromShared(
  providerState: ProviderState | undefined,
  freshness: CanonicalMarketFreshnessResult | undefined,
  geography: MarketLocalRiskGeography,
  period: MarketLocalRiskPeriod,
  value: MarketLocalRiskValue,
  coverageState: MarketLocalRiskCoverageState,
): MarketLocalRiskDegradedState[] {
  const states: MarketLocalRiskDegradedState[] = [];
  if (providerState === "offline" || providerState === "maintenance" || providerState === "rate_limited" || providerState === "authentication_required") states.push("provider_unavailable");
  if (providerState === "disabled" || providerState === "not_configured" || providerState === "unsupported") states.push("source_unavailable");
  if (freshness?.priorValidResultId || freshness?.priorValidSourceRecordId || freshness?.freshnessState === "stale" || freshness?.freshnessState === "expired" || freshness?.freshnessState === "historical") states.push("stale_prior_valid");
  if (freshness?.freshnessState === "conflicted" || coverageState === "conflicting_sources") states.push("conflicting_sources");
  if (freshness?.freshnessState === "unavailable") states.push("source_unavailable");
  if (geography.proxy || geography.relationship === "neighborhood_proxy") states.push("proxy_only_geography");
  if (!geography.boundaryVersion && geography.geographyLevel !== "point" && geography.geographyLevel !== "address") states.push("boundary_version_missing");
  if (period.window === "unknown") states.push("missing_period");
  if (value.valueKind !== "raw_count" && value.denominator?.methodology === "unknown") states.push("missing_methodology");
  if (coverageState === "thin_coverage") states.push("thin_coverage");
  if (coverageState === "insufficient_coverage") states.push("insufficient_coverage");
  if (coverageState === "no_source_coverage") states.push("no_source_coverage");
  if (coverageState === "no_verified_observations") states.push("no_verified_observations");
  if (coverageState === "provider_unavailable") states.push("provider_unavailable");
  if (coverageState === "awaiting_verification") states.push("awaiting_verification");
  if (coverageState === "incompatible_reporting_definitions") states.push("incompatible_reporting_definitions");
  return states;
}

function explanationsForObservation(method: MarketLocalRiskMethod, geography: MarketLocalRiskGeography, value: MarketLocalRiskValue, coverageState: MarketLocalRiskCoverageState, degradedStates: readonly MarketLocalRiskDegradedState[]): MarketLocalRiskExplanationCode[] {
  const codes: MarketLocalRiskExplanationCode[] = ["factual_context_only", "geography_declared", "period_declared"];
  if (method !== "unknown") codes.push("methodology_preserved");
  if (value.valueKind === "raw_count") codes.push("event_count_reported");
  if (value.valueKind === "source_reported_rate") codes.push("source_rate_reported");
  if (value.valueKind.includes("normalized_rate") || value.valueKind === "brix_derived_rate") codes.push("brix_rate_derived", "denominator_method_declared");
  if (value.valueKind === "coverage_state" || coverageState !== "adequate_coverage") codes.push("coverage_limitation_declared");
  if (geography.proxy) codes.push("proxy_geography_used");
  if (coverageState === "no_verified_observations") codes.push("no_verified_observations_not_no_risk");
  if (coverageState === "no_source_coverage" || degradedStates.includes("no_source_coverage")) codes.push("no_source_coverage_not_zero");
  if (degradedStates.includes("provider_unavailable")) codes.push("provider_unavailable_prior_valid_retained");
  if (degradedStates.includes("stale_prior_valid")) codes.push("stale_prior_valid_retained");
  return codes;
}

function comparisonConflict(current: MarketLocalRiskObservation, comparison: MarketLocalRiskObservation): MarketLocalRiskConflictState {
  if (current.incidentType !== comparison.incidentType || current.category !== comparison.category) return "category_definition_conflict";
  if (current.value.valueKind !== comparison.value.valueKind || current.value.unit !== comparison.value.unit || current.method !== comparison.method) return "methodology_conflict";
  if (current.period.window !== comparison.period.window || current.period.sourceFrequency !== comparison.period.sourceFrequency) return "period_conflict";
  const currentDenominator = current.value.denominator?.denominatorType;
  const comparisonDenominator = comparison.value.denominator?.denominatorType;
  if (currentDenominator !== comparisonDenominator) return "denominator_conflict";
  if (current.geography.geographyIdentity === comparison.geography.geographyIdentity && current.geography.boundaryVersion && comparison.geography.boundaryVersion && current.geography.boundaryVersion !== comparison.geography.boundaryVersion) return "boundary_version_conflict";
  if (current.coverageState === "conflicting_sources" || comparison.coverageState === "conflicting_sources") return "coverage_conflict";
  return "none";
}

function actionFor(conflictState: MarketLocalRiskConflictState, coverageState: MarketLocalRiskCoverageState): MarketLocalRiskVerificationAction {
  if (conflictState !== "none") return "compare_public_records";
  if (coverageState === "incompatible_reporting_definitions") return "review_provider_methodology";
  if (coverageState === "no_source_coverage" || coverageState === "no_verified_observations") return "verify_source";
  if (coverageState === "partial_coverage" || coverageState === "thin_coverage") return "verify_geography_boundary";
  return "review_provider_methodology";
}

function worstFreshness(observations: readonly MarketLocalRiskObservation[]): CanonicalMarketFreshnessState | "unknown" {
  const priority: (CanonicalMarketFreshnessState | "unknown")[] = ["conflicted", "unavailable", "missing_temporal_metadata", "expired", "stale", "review_due", "current_with_age_warning", "historical", "superseded", "future_effective", "not_applicable", "current", "unknown"];
  return priority.find((state) => observations.some((observation) => (observation.freshness?.freshnessState ?? "unknown") === state)) ?? "unknown";
}

function worstCoverage(observations: readonly MarketLocalRiskObservation[]): MarketLocalRiskCoverageState {
  const priority: MarketLocalRiskCoverageState[] = ["conflicting_sources", "incompatible_reporting_definitions", "provider_unavailable", "no_source_coverage", "no_verified_observations", "insufficient_coverage", "thin_coverage", "partial_coverage", "awaiting_verification", "unknown", "stale_prior_valid", "adequate_coverage"];
  return priority.find((state) => observations.some((observation) => observation.coverageState === state)) ?? "unknown";
}

function denominatorRateKind(denominatorType: MarketLocalRiskDenominatorType): MarketLocalRiskValueKind {
  if (denominatorType === "population") return "population_normalized_rate";
  if (denominatorType === "households") return "household_normalized_rate";
  return "property_unit_normalized_rate";
}

function numericValue(value: MarketLocalRiskValue) {
  if (typeof value.normalizedValue !== "number" || !Number.isFinite(value.normalizedValue)) throw new Error("Market local-risk rate derivation requires a numeric source observation.");
  return value.normalizedValue;
}

function guardrailExplanations(): MarketLocalRiskExplanationCode[] {
  return ["no_safety_label", "no_neighborhood_desirability_score", "no_demographic_proxy", "no_protected_class_scoring", "no_discriminatory_steering", "no_resident_character_inference", "no_future_crime_prediction", "no_property_value_conclusion", "no_rent_growth_conclusion", "no_investment_quality_inference", "proposal_only"];
}

function baseProhibitedInferenceCodes() {
  return ["no_safety_label", "no_neighborhood_desirability_score", "no_demographic_proxy", "no_protected_class_scoring", "no_discriminatory_steering"];
}

function registryMaterial(entry: Omit<MarketLocalRiskRegistryEntry, "materialHash">) {
  const { registeredAt: _registeredAt, contractVersion: _contractVersion, ...material } = entry;
  return material;
}

function entryKey(entry: MarketLocalRiskRegistryEntry) {
  return `${entry.category}:${entry.incidentType}:${entry.contextId}:${entry.semanticVersion}`;
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
  return [...provenance].map((item) => ({
    ...item,
    providerId: clean(item.providerId) ?? "",
    providerVersion: clean(item.providerVersion) ?? "",
    providerRecordReference: clean(item.providerRecordReference) ?? "",
    observationTime: clean(item.observationTime),
    effectiveTime: clean(item.effectiveTime),
    retrievalTime: clean(item.retrievalTime) ?? "",
  })).sort((a, b) => stableSerialize(a).localeCompare(stableSerialize(b)));
}

function uniqueSorted<T extends string>(items: readonly T[]): T[] {
  return Array.from(new Set(items.filter(Boolean))).sort();
}

function normalizeId(value: string | undefined, message: string) {
  return requiredClean(value, message).toLowerCase().replace(/[^a-z0-9_.:-]+/g, "_").replace(/^_+|_+$/g, "");
}

function requiredClean(value: unknown, message: string) {
  const cleaned = clean(value);
  if (!cleaned) throw new Error(message);
  return cleaned;
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizedNumber(value: number) {
  if (!Number.isFinite(value)) throw new Error("Market local-risk numeric value must be finite.");
  return Number(value.toFixed(6));
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

import type { CanonicalMarketFreshnessResult, CanonicalMarketFreshnessState } from "./marketFreshness";
import type { GeographicLevel, LocationVerificationState, SourceEvidenceReference } from "./locationIdentity";
import type { MarketProviderProvenance, MarketSourceDataset } from "./marketSourceIngestion";
import type { ProviderConfidence, ProviderState } from "./providerAdapters";

export const MARKET_GROWTH_CONTRACT_VERSION = "market-growth-context-v1";
export const MARKET_GROWTH_REGISTRY_VERSION = "market-growth-registry-v1";
export const MARKET_GROWTH_OBSERVATION_CONTRACT_VERSION = "market-growth-observation-v1";
export const MARKET_GROWTH_DERIVED_METRIC_CONTRACT_VERSION = "market-growth-derived-metric-v1";
export const MARKET_GROWTH_COMPARISON_CONTRACT_VERSION = "market-growth-comparison-v1";
export const MARKET_GROWTH_FINDING_CONTRACT_VERSION = "market-growth-finding-v1";
export const MARKET_GROWTH_CONFLICT_CONTRACT_VERSION = "market-growth-conflict-v1";
export const MARKET_GROWTH_PROJECTION_CONTRACT_VERSION = "market-growth-projection-v1";

export const marketGrowthMetricTypes = [
  "population_level",
  "population_change",
  "population_growth_rate",
  "household_count",
  "household_change",
  "household_growth_rate",
  "household_formation",
  "age_distribution",
  "household_size",
  "tenure_mix",
  "ownership_rate",
  "renter_share",
  "net_migration",
  "in_migration",
  "out_migration",
  "median_household_income",
  "income_change",
  "income_growth_rate",
  "employment_level",
  "employment_change",
  "employment_growth_rate",
  "unemployment_rate",
  "labor_force",
  "labor_force_participation",
  "industry_employment_share",
  "industry_concentration",
  "employer_count",
  "major_employer_presence",
  "employer_announcement",
  "employer_closure",
  "economic_diversification",
  "commute_time",
  "commute_mode",
  "inbound_commuting",
  "outbound_commuting",
] as const;

export const marketGrowthCategories = [
  "population",
  "households",
  "demographic_structure",
  "migration",
  "income",
  "employment",
  "economic_base",
  "commuting",
  "housing_growth_context",
] as const;

export const marketGrowthUnits = ["people", "households", "jobs", "employers", "money", "minutes", "ratio", "percent", "rate", "distribution", "index", "event", "unknown"] as const;
export const marketGrowthValueKinds = ["level", "absolute_change", "growth_rate", "cagr", "distribution", "share", "event", "index"] as const;
export const marketGrowthPeriodWindows = ["calendar_month", "calendar_quarter", "calendar_year", "trailing_12_months", "five_year_period", "decennial", "acs_1_year", "acs_5_year", "provider_defined_period", "custom_period"] as const;
export const marketGrowthFrequencies = ["monthly", "quarterly", "annual", "decennial", "provider_defined", "unknown"] as const;
export const marketGrowthMethods = ["source_reported", "brix_derived", "count", "sum", "average", "median", "percent_change", "absolute_difference", "cagr", "share", "hhi", "top_n_share", "provider_specific", "user_entered_evidence", "unknown"] as const;
export const marketGrowthSegmentKinds = ["total_population", "household_population", "owner_households", "renter_households", "age_band", "income_band", "labor_force", "industry", "employer", "commuter", "housing_market", "unknown"] as const;
export const marketGrowthIndustryClassificationSystems = ["naics", "sic", "bls_supersector", "provider_defined", "unknown"] as const;
export const marketGrowthEmployerEventStates = ["announced", "planned", "hiring", "expansion", "operating", "downsizing", "closure_announced", "closed", "cancelled", "unknown"] as const;
export const marketGrowthSampleQualityStates = ["adequate_history", "insufficient_history", "no_source_coverage", "source_unavailable", "conflicted_sample", "partial_history", "unknown"] as const;
export const marketGrowthComparisonKinds = ["current_vs_prior_period", "current_vs_prior_year", "local_vs_county", "local_vs_metro", "metro_vs_state"] as const;
export const marketGrowthImpactClasses = ["informational", "assumption_review", "decision_context", "professional_review_required"] as const;
export const marketGrowthReviewActions = ["source_update", "economic_development_verification", "employer_announcement_verification", "labor_market_review", "additional_market_evidence", "none"] as const;

export const marketGrowthFindingTypes = [
  "population_increased",
  "population_decreased",
  "household_count_increased",
  "household_count_decreased",
  "household_formation_observed",
  "net_migration_positive",
  "net_migration_negative",
  "income_level_changed",
  "employment_increased",
  "employment_decreased",
  "unemployment_changed",
  "labor_force_participation_changed",
  "industry_concentration_elevated",
  "economic_base_diversified",
  "economic_base_less_diversified",
  "major_employer_expansion_announced",
  "major_employer_closure_announced",
  "growth_context_stale",
  "conflicting_providers",
] as const;

export const marketGrowthConflictStates = ["none", "provider_disagreement", "metric_disagreement", "method_disagreement", "geography_conflict", "period_conflict", "classification_conflict", "current_stale_conflict", "unresolved"] as const;
export const marketGrowthDegradedStates = ["provider_unavailable", "source_unavailable", "insufficient_history", "geography_unsupported", "metric_unsupported", "stale_prior_valid", "conflicting_providers", "missing_period", "missing_methodology", "permission_restricted"] as const;
export const marketGrowthExplanationCodes = [
  "population_increased",
  "population_decreased",
  "household_count_increased",
  "household_count_decreased",
  "household_formation_observed",
  "net_migration_positive",
  "net_migration_negative",
  "income_changed",
  "employment_increased",
  "employment_decreased",
  "unemployment_changed",
  "labor_force_participation_changed",
  "industry_concentration_observed",
  "economic_diversification_observed",
  "employer_expansion_announced",
  "employer_closure_announced",
  "announced_jobs_not_current_jobs",
  "insufficient_history",
  "growth_data_stale",
  "conflicting_growth_sources",
  "provider_unavailable_prior_valid_retained",
  "historical_trend_not_forecast",
  "correlation_not_causation",
  "demographic_context_factual_only",
  "no_protected_class_scoring",
  "no_demographic_desirability",
  "no_rent_or_price_forecast",
  "underwriting_proposal_only",
  "professional_review_recommended",
  "source_reported_value",
  "brix_derived_formula",
  "division_by_zero_handled",
] as const;

export type MarketGrowthMetricType = typeof marketGrowthMetricTypes[number];
export type MarketGrowthCategory = typeof marketGrowthCategories[number];
export type MarketGrowthUnit = typeof marketGrowthUnits[number];
export type MarketGrowthValueKind = typeof marketGrowthValueKinds[number];
export type MarketGrowthPeriodWindow = typeof marketGrowthPeriodWindows[number];
export type MarketGrowthFrequency = typeof marketGrowthFrequencies[number];
export type MarketGrowthMethod = typeof marketGrowthMethods[number];
export type MarketGrowthSegmentKind = typeof marketGrowthSegmentKinds[number];
export type MarketGrowthIndustryClassificationSystem = typeof marketGrowthIndustryClassificationSystems[number];
export type MarketGrowthEmployerEventState = typeof marketGrowthEmployerEventStates[number];
export type MarketGrowthSampleQualityState = typeof marketGrowthSampleQualityStates[number];
export type MarketGrowthComparisonKind = typeof marketGrowthComparisonKinds[number];
export type MarketGrowthImpactClass = typeof marketGrowthImpactClasses[number];
export type MarketGrowthReviewAction = typeof marketGrowthReviewActions[number];
export type MarketGrowthFindingType = typeof marketGrowthFindingTypes[number];
export type MarketGrowthConflictState = typeof marketGrowthConflictStates[number];
export type MarketGrowthDegradedState = typeof marketGrowthDegradedStates[number];
export type MarketGrowthExplanationCode = typeof marketGrowthExplanationCodes[number];
export type MarketGrowthLifecycleStatus = "active" | "deprecated" | "disabled";

export type MarketGrowthGeography = {
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  canonicalLocationId?: string;
  boundaryId?: string;
  boundaryVersion?: string;
  comparisonGeographyIdentity?: string;
  proxy: boolean;
};

export type MarketGrowthSegment = {
  segmentKind: MarketGrowthSegmentKind;
  demographicCohort?: string;
  householdTenure?: "owner" | "renter" | "mixed" | "unknown";
  incomeBand?: string;
  employmentSector?: string;
  industryCode?: string;
  industryClassificationSystem?: MarketGrowthIndustryClassificationSystem;
  employerName?: string;
  commutingContext?: "resident_workers" | "workplace_jobs" | "inbound" | "outbound" | "unknown";
  housingPropertyType?: string;
  segmentIdentity: string;
  sourceReference?: SourceEvidenceReference;
};

export type MarketGrowthPeriod = {
  window: MarketGrowthPeriodWindow;
  periodStart?: string;
  periodEnd?: string;
  comparisonPeriodStart?: string;
  comparisonPeriodEnd?: string;
  sourceFrequency: MarketGrowthFrequency;
  partialPeriod: boolean;
  historical: boolean;
  projected: boolean;
  inferred: boolean;
  annualized: false;
};

export type MarketGrowthValue = {
  rawValue: number | string | null;
  normalizedValue: number | null;
  unit: MarketGrowthUnit;
  valueKind: MarketGrowthValueKind;
  currency?: string;
  numeratorDefinition?: string;
  denominatorDefinition?: string;
  formulaId?: string;
  formulaVersion?: string;
  valueOrigin: "source_reported" | "brix_derived";
};

export type MarketGrowthSample = {
  sampleCount?: number;
  recordCount?: number;
  sourceCoverage: "complete" | "partial" | "none" | "unknown";
  minimumPeriodsRequired: number;
  periodsAvailable: number;
  minimumHistoryMet: boolean;
  completenessIndicator?: number;
  sampleQualityState: MarketGrowthSampleQualityState;
};

export type MarketGrowthEmployerEvent = {
  eventState: MarketGrowthEmployerEventState;
  employerName?: string;
  industryCode?: string;
  industryClassificationSystem?: MarketGrowthIndustryClassificationSystem;
  announcedJobs?: number;
  currentJobs?: number;
  announcementDate?: string;
  expectedEffectiveDate?: string;
  eventSourceReference?: SourceEvidenceReference;
};

export type MarketGrowthRegistryEntry = {
  metricId: string;
  semanticVersion: string;
  metricType: MarketGrowthMetricType;
  category: MarketGrowthCategory;
  unit: MarketGrowthUnit;
  valueKind: MarketGrowthValueKind;
  applicableDatasets: readonly MarketSourceDataset[];
  supportedGeographyLevels: readonly GeographicLevel[];
  supportedSegmentKinds: readonly MarketGrowthSegmentKind[];
  supportedPeriodWindows: readonly MarketGrowthPeriodWindow[];
  supportedMethods: readonly MarketGrowthMethod[];
  minimumPeriodsRequired: number;
  requiresIndustryClassification: boolean;
  allowsDerived: boolean;
  lifecycleStatus: MarketGrowthLifecycleStatus;
  permittedProposalKinds: readonly string[];
  prohibitedInferenceCodes: readonly string[];
  registeredAt: string;
  contractVersion: typeof MARKET_GROWTH_CONTRACT_VERSION;
  materialHash: string;
};

export type MarketGrowthRegistry = {
  registryId: string;
  version: typeof MARKET_GROWTH_REGISTRY_VERSION;
  entries: MarketGrowthRegistryEntry[];
  materialHash: string;
};

export type MarketGrowthObservation = {
  observationId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  metricId: string;
  metricVersion: string;
  metricType: MarketGrowthMetricType;
  category: MarketGrowthCategory;
  geography: MarketGrowthGeography;
  segment: MarketGrowthSegment;
  period: MarketGrowthPeriod;
  value: MarketGrowthValue;
  sample: MarketGrowthSample;
  method: MarketGrowthMethod;
  employerEvent?: MarketGrowthEmployerEvent;
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
  limitationCodes: string[];
  degradedStates: MarketGrowthDegradedState[];
  explanationCodes: MarketGrowthExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_GROWTH_OBSERVATION_CONTRACT_VERSION;
};

export type MarketGrowthDerivedMetric = {
  derivedMetricId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  metricType: Extract<MarketGrowthMetricType, "population_change" | "population_growth_rate" | "household_change" | "household_growth_rate" | "income_change" | "income_growth_rate" | "employment_change" | "employment_growth_rate" | "industry_concentration" | "economic_diversification">;
  sourceObservationIds: string[];
  formulaId: string;
  formulaVersion: string;
  value: MarketGrowthValue;
  sampleQualityState: MarketGrowthSampleQualityState;
  degradedStates: MarketGrowthDegradedState[];
  explanationCodes: MarketGrowthExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_GROWTH_DERIVED_METRIC_CONTRACT_VERSION;
};

export type MarketGrowthComparison = {
  comparisonId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  comparisonKind: MarketGrowthComparisonKind;
  currentObservationId: string;
  comparisonObservationId: string;
  metricType: MarketGrowthMetricType;
  geography: MarketGrowthGeography;
  comparisonGeography: MarketGrowthGeography;
  segment: MarketGrowthSegment;
  currentPeriod: MarketGrowthPeriod;
  comparisonPeriod: MarketGrowthPeriod;
  difference: number | null;
  percentChange: number | null;
  compatible: true;
  methodVersion: string;
  deterministicHash: string;
  contractVersion: typeof MARKET_GROWTH_COMPARISON_CONTRACT_VERSION;
};

export type MarketGrowthFinding = {
  findingId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketGrowthFindingType;
  sourceObservationIds: string[];
  summaryCode: MarketGrowthExplanationCode;
  geography: MarketGrowthGeography;
  segment: MarketGrowthSegment;
  period: MarketGrowthPeriod;
  impactClass: MarketGrowthImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState;
  limitationCodes: string[];
  sampleQualityState: MarketGrowthSampleQualityState;
  suggestedVerificationAction: MarketGrowthReviewAction;
  applicableStrategyReferences: string[];
  conflictState: MarketGrowthConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  rentForecastAllowed: false;
  valueForecastAllowed: false;
  safetyConclusionAllowed: false;
  protectedClassScoringAllowed: false;
  stableOrdinal: number;
  deterministicHash: string;
  contractVersion: typeof MARKET_GROWTH_FINDING_CONTRACT_VERSION;
};

export type MarketGrowthConflictManifest = {
  conflictId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketGrowthConflictState, "none">;
  observationIds: string[];
  retainedObservationIds: string[];
  geography: MarketGrowthGeography;
  segment: MarketGrowthSegment;
  reasonCodes: MarketGrowthExplanationCode[];
  blockedUntilResolved: true;
  deterministicHash: string;
  contractVersion: typeof MARKET_GROWTH_CONFLICT_CONTRACT_VERSION;
};

export type MarketGrowthProjection = {
  findingId: string;
  findingType: MarketGrowthFindingType;
  sourceObservationIds: string[];
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  segmentIdentity: string;
  impactClass: MarketGrowthImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState;
  conflictState: MarketGrowthConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  contractVersion: typeof MARKET_GROWTH_PROJECTION_CONTRACT_VERSION;
  deterministicHash: string;
};

type GrowthEntryInput = Omit<MarketGrowthRegistryEntry, "contractVersion" | "materialHash">;

export function defineMarketGrowthRegistryEntry(input: GrowthEntryInput): MarketGrowthRegistryEntry {
  const metricId = normalizeId(input.metricId, "Market growth registry entry requires metric ID.");
  if (!marketGrowthMetricTypes.includes(input.metricType)) throw new Error("Market growth metric type is not registered.");
  if (!marketGrowthCategories.includes(input.category)) throw new Error("Market growth category is not registered.");
  if (!marketGrowthUnits.includes(input.unit)) throw new Error("Market growth unit is not registered.");
  if (!marketGrowthValueKinds.includes(input.valueKind)) throw new Error("Market growth value kind is not registered.");
  if (input.lifecycleStatus === "disabled") throw new Error("Disabled growth entries cannot be used for new observations.");
  const entry = {
    ...input,
    metricId,
    semanticVersion: requiredClean(input.semanticVersion, "Market growth registry entry requires semantic version."),
    applicableDatasets: uniqueSorted(input.applicableDatasets),
    supportedGeographyLevels: uniqueSorted(input.supportedGeographyLevels),
    supportedSegmentKinds: uniqueSorted(input.supportedSegmentKinds),
    supportedPeriodWindows: uniqueSorted(input.supportedPeriodWindows),
    supportedMethods: uniqueSorted(input.supportedMethods),
    minimumPeriodsRequired: Math.max(0, Math.trunc(input.minimumPeriodsRequired)),
    permittedProposalKinds: uniqueSorted(input.permittedProposalKinds),
    prohibitedInferenceCodes: uniqueSorted(input.prohibitedInferenceCodes),
    registeredAt: requiredClean(input.registeredAt, "Market growth registry entry requires registration time."),
  };
  if (!entry.applicableDatasets.length) throw new Error("Market growth registry entry requires at least one source dataset.");
  if (!entry.supportedSegmentKinds.every(isMarketGrowthSegmentKind)) throw new Error("Market growth entry includes unsupported segment kind.");
  const material = growthEntryMaterial(entry);
  return {
    ...entry,
    contractVersion: MARKET_GROWTH_CONTRACT_VERSION,
    materialHash: `mg_entryh_${stableHash(material).slice(0, 24)}`,
  };
}

export function createMarketGrowthRegistry(entries: readonly MarketGrowthRegistryEntry[]): MarketGrowthRegistry {
  const sorted = [...entries].sort((a, b) => growthEntryKey(a).localeCompare(growthEntryKey(b)));
  const materialHash = `mg_regh_${stableHash(sorted.map((entry) => entry.materialHash)).slice(0, 24)}`;
  return {
    registryId: `mg_reg_${stableHash({ materialHash, version: MARKET_GROWTH_REGISTRY_VERSION }).slice(0, 24)}`,
    version: MARKET_GROWTH_REGISTRY_VERSION,
    entries: sorted,
    materialHash,
  };
}

export function selectMarketGrowthRegistryEntry(input: {
  registry: MarketGrowthRegistry;
  metricId: string;
  semanticVersion?: string;
}): MarketGrowthRegistryEntry {
  const metricId = normalizeId(input.metricId, "Market growth entry selection requires metric ID.");
  const entry = input.registry.entries.find((item) => item.metricId === metricId && (!input.semanticVersion || item.semanticVersion === input.semanticVersion));
  if (!entry) throw new Error("Market growth registry entry was not found.");
  if (entry.lifecycleStatus === "disabled") throw new Error("Disabled market growth entries cannot create new observations.");
  return entry;
}

export function createMarketGrowthObservation(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  entry: MarketGrowthRegistryEntry;
  geography: MarketGrowthGeography;
  segment: MarketGrowthSegment;
  period: MarketGrowthPeriod;
  value: MarketGrowthValue;
  sample: MarketGrowthSample;
  method: MarketGrowthMethod;
  employerEvent?: MarketGrowthEmployerEvent;
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
  limitationCodes?: readonly string[];
  degradedStates?: readonly MarketGrowthDegradedState[];
  explanationCodes?: readonly MarketGrowthExplanationCode[];
}): MarketGrowthObservation {
  assertEntrySupportsObservation(input.entry, input.geography, input.segment, input.period, input.method, input.dataset, input.value);
  const segment = normalizeSegment(input.segment);
  const period = normalizePeriod(input.period);
  const value = normalizeValue(input.value);
  const sample = normalizeSample(input.sample, input.entry.minimumPeriodsRequired);
  const employerEvent = input.employerEvent ? normalizeEmployerEvent(input.employerEvent) : undefined;
  const degradedStates = uniqueSorted([...degradedStatesFrom({ ...input, segment, period, sample, employerEvent }), ...(input.degradedStates ?? [])]);
  const explanationCodes = uniqueSorted([...explanationCodesFrom(input.entry, value, sample, degradedStates, period, employerEvent), ...(input.explanationCodes ?? []), "underwriting_proposal_only", "historical_trend_not_forecast", "correlation_not_causation", "demographic_context_factual_only", "no_protected_class_scoring", "no_demographic_desirability", "no_rent_or_price_forecast"]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market growth observation requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    canonicalLocationId: clean(input.canonicalLocationId),
    metricId: input.entry.metricId,
    metricVersion: input.entry.semanticVersion,
    metricType: input.entry.metricType,
    category: input.entry.category,
    geography: normalizeGeography(input.geography),
    segment,
    period,
    value,
    sample,
    method: input.method,
    employerEvent,
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
    limitationCodes: uniqueSorted([...(input.limitationCodes ?? []), ...limitationCodesFrom(input.entry, period, employerEvent)]),
    degradedStates,
    explanationCodes,
  };
  return {
    ...basis,
    observationId: `mg_obs_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `mg_obsh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_GROWTH_OBSERVATION_CONTRACT_VERSION,
  };
}

export function deriveMarketGrowthMetric(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  metricType: MarketGrowthDerivedMetric["metricType"];
  currentObservation?: MarketGrowthObservation;
  baselineObservation?: MarketGrowthObservation;
  componentObservations?: readonly MarketGrowthObservation[];
  formulaId: string;
  formulaVersion: string;
  unit: MarketGrowthUnit;
  valueKind: MarketGrowthValueKind;
  method?: Extract<MarketGrowthMethod, "percent_change" | "absolute_difference" | "cagr" | "hhi" | "top_n_share" | "share">;
}): MarketGrowthDerivedMetric {
  const components = stableObservations(input.componentObservations ?? []);
  const currentValue = input.currentObservation?.value.normalizedValue ?? null;
  const baselineValue = input.baselineObservation?.value.normalizedValue ?? null;
  const method = input.method ?? (input.valueKind === "absolute_change" ? "absolute_difference" : "percent_change");
  const normalizedValue = deriveValue(method, currentValue, baselineValue, components);
  const sourceObservationIds = uniqueSorted([input.currentObservation?.observationId, input.baselineObservation?.observationId, ...components.map((item) => item.observationId)].filter((id): id is string => Boolean(id)));
  const denominatorMissingOrZero = method !== "absolute_difference" && method !== "hhi" && method !== "top_n_share" && (baselineValue === null || baselineValue === 0);
  const degradedStates = uniqueSorted([
    ...(denominatorMissingOrZero || sourceObservationIds.length < 1 ? ["insufficient_history" as const] : []),
    ...(sourceObservationIds.length < 1 ? ["source_unavailable" as const] : []),
    ...(input.currentObservation?.degradedStates ?? []),
    ...(input.baselineObservation?.degradedStates ?? []),
    ...components.flatMap((item) => item.degradedStates),
  ]);
  const explanationCodes = uniqueSorted([
    "brix_derived_formula" as const,
    "underwriting_proposal_only" as const,
    "historical_trend_not_forecast" as const,
    ...(denominatorMissingOrZero ? ["division_by_zero_handled" as const, "insufficient_history" as const] : []),
  ]);
  const value: MarketGrowthValue = {
    rawValue: normalizedValue,
    normalizedValue,
    unit: input.unit,
    valueKind: input.valueKind,
    formulaId: requiredClean(input.formulaId, "Derived growth metric requires formula id."),
    formulaVersion: requiredClean(input.formulaVersion, "Derived growth metric requires formula version."),
    valueOrigin: "brix_derived",
  };
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Derived growth metric requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    metricType: input.metricType,
    sourceObservationIds,
    formulaId: value.formulaId,
    formulaVersion: value.formulaVersion,
    value,
    sampleQualityState: worseSampleQuality([input.currentObservation, input.baselineObservation, ...components]),
    degradedStates,
    explanationCodes,
  };
  return {
    ...basis,
    derivedMetricId: `mg_der_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `mg_derh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_GROWTH_DERIVED_METRIC_CONTRACT_VERSION,
  };
}

export function createMarketGrowthComparison(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  comparisonKind: MarketGrowthComparisonKind;
  currentObservation: MarketGrowthObservation;
  comparisonObservation: MarketGrowthObservation;
  methodVersion: string;
}): MarketGrowthComparison {
  if (!marketGrowthComparisonKinds.includes(input.comparisonKind)) throw new Error("Market growth comparison kind is not registered.");
  assertComparable(input.currentObservation, input.comparisonObservation, input.comparisonKind);
  const currentValue = input.currentObservation.value.normalizedValue;
  const comparisonValue = input.comparisonObservation.value.normalizedValue;
  const difference = currentValue === null || comparisonValue === null ? null : currentValue - comparisonValue;
  const percentChange = difference === null || !comparisonValue ? null : difference / comparisonValue;
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market growth comparison requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    comparisonKind: input.comparisonKind,
    currentObservationId: input.currentObservation.observationId,
    comparisonObservationId: input.comparisonObservation.observationId,
    metricType: input.currentObservation.metricType,
    geography: input.currentObservation.geography,
    comparisonGeography: input.comparisonObservation.geography,
    segment: input.currentObservation.segment,
    currentPeriod: input.currentObservation.period,
    comparisonPeriod: input.comparisonObservation.period,
    difference,
    percentChange,
    compatible: true as const,
    methodVersion: requiredClean(input.methodVersion, "Market growth comparison requires method version."),
  };
  return {
    ...basis,
    comparisonId: `mg_cmp_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `mg_cmph_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_GROWTH_COMPARISON_CONTRACT_VERSION,
  };
}

export function createMarketGrowthFinding(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketGrowthFindingType;
  sourceObservations: readonly MarketGrowthObservation[];
  summaryCode: MarketGrowthExplanationCode;
  impactClass: MarketGrowthImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState?: CanonicalMarketFreshnessState;
  limitationCodes?: readonly string[];
  sampleQualityState?: MarketGrowthSampleQualityState;
  suggestedVerificationAction?: MarketGrowthReviewAction;
  applicableStrategyReferences?: readonly string[];
  conflictState?: MarketGrowthConflictState;
  assumptionProposalReferences?: readonly string[];
  stableOrdinal?: number;
}): MarketGrowthFinding {
  if (!marketGrowthFindingTypes.includes(input.findingType)) throw new Error("Market growth finding type is not registered.");
  if (!marketGrowthExplanationCodes.includes(input.summaryCode)) throw new Error("Market growth finding summary code is not registered.");
  if (!marketGrowthImpactClasses.includes(input.impactClass)) throw new Error("Market growth impact class is not registered.");
  const observations = stableObservations(input.sourceObservations);
  if (!observations.length) throw new Error("Market growth finding requires at least one source observation.");
  const conflictState = input.conflictState ?? (observations.some((item) => item.degradedStates.includes("conflicting_providers")) ? "unresolved" : "none");
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market growth finding requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    findingType: input.findingType,
    sourceObservationIds: observations.map((item) => item.observationId),
    summaryCode: input.summaryCode,
    geography: observations[0].geography,
    segment: observations[0].segment,
    period: observations[0].period,
    impactClass: input.impactClass,
    confidence: input.confidence,
    verificationState: input.verificationState,
    freshnessState: input.freshnessState ?? worstFreshness(observations),
    limitationCodes: uniqueSorted([
      "growth_context_not_forecast",
      "demographic_context_not_quality_score",
      ...(input.limitationCodes ?? []),
      ...observations.flatMap((item) => item.limitationCodes),
    ]),
    sampleQualityState: input.sampleQualityState ?? worseSampleQuality(observations),
    suggestedVerificationAction: input.suggestedVerificationAction ?? suggestedActionFor(input.findingType, conflictState),
    applicableStrategyReferences: uniqueSorted(input.applicableStrategyReferences ?? []),
    conflictState,
    assumptionProposalReferences: uniqueSorted(input.assumptionProposalReferences ?? []),
    stableOrdinal: Math.max(0, Math.trunc(input.stableOrdinal ?? 0)),
  };
  return {
    ...basis,
    findingId: `mg_find_${stableHash(basis).slice(0, 24)}`,
    underwritingMutationAllowed: false,
    strategyRerankAllowed: false,
    recommendationMutationAllowed: false,
    rentForecastAllowed: false,
    valueForecastAllowed: false,
    safetyConclusionAllowed: false,
    protectedClassScoringAllowed: false,
    deterministicHash: `mg_findh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_GROWTH_FINDING_CONTRACT_VERSION,
  };
}

export function createMarketGrowthConflictManifest(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketGrowthConflictState, "none">;
  observations: readonly MarketGrowthObservation[];
  reasonCodes: readonly MarketGrowthExplanationCode[];
  retainedObservationIds?: readonly string[];
}): MarketGrowthConflictManifest {
  if (!marketGrowthConflictStates.includes(input.conflictState)) throw new Error("Market growth conflict state is not registered.");
  const observations = stableObservations(input.observations);
  if (observations.length < 2) throw new Error("Market growth conflict requires at least two observations.");
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market growth conflict requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    conflictState: input.conflictState,
    observationIds: observations.map((item) => item.observationId),
    retainedObservationIds: uniqueSorted(input.retainedObservationIds ?? observations.map((item) => item.observationId)),
    geography: observations[0].geography,
    segment: observations[0].segment,
    reasonCodes: uniqueSorted(input.reasonCodes.length ? input.reasonCodes : ["conflicting_growth_sources"]),
  };
  return {
    ...basis,
    conflictId: `mg_conf_${stableHash(basis).slice(0, 24)}`,
    blockedUntilResolved: true,
    deterministicHash: `mg_confh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_GROWTH_CONFLICT_CONTRACT_VERSION,
  };
}

export function projectMarketGrowthFinding(finding: MarketGrowthFinding): MarketGrowthProjection {
  const projection = {
    findingId: finding.findingId,
    findingType: finding.findingType,
    sourceObservationIds: finding.sourceObservationIds,
    geographyLevel: finding.geography.geographyLevel,
    geographyIdentity: finding.geography.geographyIdentity,
    segmentIdentity: finding.segment.segmentIdentity,
    impactClass: finding.impactClass,
    confidence: finding.confidence,
    verificationState: finding.verificationState,
    freshnessState: finding.freshnessState,
    conflictState: finding.conflictState,
    assumptionProposalReferences: finding.assumptionProposalReferences,
    underwritingMutationAllowed: false as const,
    strategyRerankAllowed: false as const,
    recommendationMutationAllowed: false as const,
    contractVersion: MARKET_GROWTH_PROJECTION_CONTRACT_VERSION as typeof MARKET_GROWTH_PROJECTION_CONTRACT_VERSION,
  };
  return {
    ...projection,
    deterministicHash: `mg_projh_${stableHash(projection).slice(0, 24)}`,
  };
}

export function marketGrowthDiagnostics(event: "growth_observed" | "growth_finding_created" | "growth_conflict_detected" | "growth_degraded" | "growth_proposal_referenced", input: {
  workspaceId?: string;
  propertyId?: string;
  observationId?: string;
  findingId?: string;
  conflictState?: string;
  metricType?: string;
}) {
  return {
    event,
    workspaceScoped: Boolean(clean(input.workspaceId)),
    propertyScoped: Boolean(clean(input.propertyId)),
    observationScoped: Boolean(clean(input.observationId)),
    findingScoped: Boolean(clean(input.findingId)),
    conflictState: clean(input.conflictState),
    metricType: clean(input.metricType),
  };
}

export function isMarketGrowthMetricType(value: string): value is MarketGrowthMetricType {
  return marketGrowthMetricTypes.includes(value as MarketGrowthMetricType);
}

export function isMarketGrowthSegmentKind(value: string): value is MarketGrowthSegmentKind {
  return marketGrowthSegmentKinds.includes(value as MarketGrowthSegmentKind);
}

export function isMarketGrowthFindingType(value: string): value is MarketGrowthFindingType {
  return marketGrowthFindingTypes.includes(value as MarketGrowthFindingType);
}

function assertEntrySupportsObservation(
  entry: MarketGrowthRegistryEntry,
  geography: MarketGrowthGeography,
  segment: MarketGrowthSegment,
  period: MarketGrowthPeriod,
  method: MarketGrowthMethod,
  dataset: MarketSourceDataset | undefined,
  value: MarketGrowthValue,
) {
  if (!entry.supportedGeographyLevels.includes(geography.geographyLevel)) throw new Error("Growth metric does not support this geography.");
  if (!entry.supportedSegmentKinds.includes(segment.segmentKind)) throw new Error("Growth metric does not support this segment.");
  if (!entry.supportedPeriodWindows.includes(period.window)) throw new Error("Growth metric does not support this period window.");
  if (!entry.supportedMethods.includes(method)) throw new Error("Growth metric does not support this method.");
  if (dataset && !entry.applicableDatasets.includes(dataset)) throw new Error("Growth metric does not support this source dataset.");
  if (value.valueKind !== entry.valueKind) throw new Error("Growth metric value kind must match the registry entry.");
  if (value.unit !== entry.unit) throw new Error("Growth metric unit must match the registry entry.");
  if (entry.requiresIndustryClassification && (!segment.industryClassificationSystem || segment.industryClassificationSystem === "unknown")) throw new Error("Growth metric requires industry classification.");
  if (value.valueOrigin === "brix_derived" && !entry.allowsDerived) throw new Error("Growth metric does not allow derived values.");
}

function degradedStatesFrom(input: {
  providerState?: ProviderState;
  sourceRecordId?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  geography: MarketGrowthGeography;
  segment: MarketGrowthSegment;
  period: MarketGrowthPeriod;
  method: MarketGrowthMethod;
  sample: MarketGrowthSample;
  employerEvent?: MarketGrowthEmployerEvent;
}): MarketGrowthDegradedState[] {
  const states: MarketGrowthDegradedState[] = [];
  if (input.providerState === "offline" || input.providerState === "maintenance" || input.providerState === "rate_limited" || input.providerState === "authentication_required") states.push("provider_unavailable");
  if (input.providerState === "disabled" || input.providerState === "not_configured" || input.providerState === "unsupported") states.push("metric_unsupported");
  if (!input.sourceRecordId && !input.evidenceReference && !(input.provenance ?? []).length) states.push("source_unavailable");
  if (input.freshness?.priorValidResultId || input.freshness?.priorValidSourceRecordId) states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "stale" || input.freshness?.freshnessState === "expired" || input.freshness?.freshnessState === "historical") states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "unavailable") states.push("source_unavailable");
  if (input.freshness?.freshnessState === "missing_temporal_metadata") states.push("missing_period");
  if (input.freshness?.freshnessState === "conflicted") states.push("conflicting_providers");
  if (input.freshness?.refreshEligibility.state === "permission_restricted") states.push("permission_restricted");
  if (input.geography.geographyLevel === "unknown" || input.geography.proxy) states.push("geography_unsupported");
  if (input.segment.segmentKind === "unknown" || !clean(input.segment.segmentIdentity)) states.push("metric_unsupported");
  if (!input.period.periodStart || !input.period.periodEnd) states.push("missing_period");
  if (input.method === "unknown") states.push("missing_methodology");
  if (!input.sample.minimumHistoryMet || input.sample.periodsAvailable < input.sample.minimumPeriodsRequired || input.sample.sampleQualityState === "insufficient_history") states.push("insufficient_history");
  if (input.sample.sourceCoverage === "none" || input.sample.sampleQualityState === "no_source_coverage") states.push("source_unavailable");
  if (input.sample.sampleQualityState === "source_unavailable") states.push("source_unavailable");
  if (input.sample.sampleQualityState === "conflicted_sample") states.push("conflicting_providers");
  return states;
}

function explanationCodesFrom(
  entry: MarketGrowthRegistryEntry,
  value: MarketGrowthValue,
  sample: MarketGrowthSample,
  degradedStates: readonly MarketGrowthDegradedState[],
  period: MarketGrowthPeriod,
  employerEvent?: MarketGrowthEmployerEvent,
): MarketGrowthExplanationCode[] {
  const codes: MarketGrowthExplanationCode[] = [];
  if (entry.metricType === "population_level" || entry.metricType === "population_change" || entry.metricType === "population_growth_rate") codes.push(value.normalizedValue !== null && value.normalizedValue < 0 ? "population_decreased" : "population_increased");
  if (entry.metricType === "household_count" || entry.metricType === "household_change" || entry.metricType === "household_growth_rate") codes.push(value.normalizedValue !== null && value.normalizedValue < 0 ? "household_count_decreased" : "household_count_increased");
  if (entry.metricType === "household_formation") codes.push("household_formation_observed");
  if (entry.metricType === "net_migration") codes.push(value.normalizedValue !== null && value.normalizedValue < 0 ? "net_migration_negative" : "net_migration_positive");
  if (entry.category === "income") codes.push("income_changed");
  if (entry.metricType === "employment_level" || entry.metricType === "employment_change" || entry.metricType === "employment_growth_rate") codes.push(value.normalizedValue !== null && value.normalizedValue < 0 ? "employment_decreased" : "employment_increased");
  if (entry.metricType === "unemployment_rate") codes.push("unemployment_changed");
  if (entry.metricType === "labor_force_participation") codes.push("labor_force_participation_changed");
  if (entry.metricType === "industry_concentration") codes.push("industry_concentration_observed");
  if (entry.metricType === "economic_diversification") codes.push("economic_diversification_observed");
  if (employerEvent?.eventState === "announced" || employerEvent?.eventState === "planned" || employerEvent?.eventState === "hiring" || employerEvent?.eventState === "expansion") codes.push("employer_expansion_announced");
  if (employerEvent?.eventState === "closure_announced" || employerEvent?.eventState === "closed" || employerEvent?.eventState === "downsizing") codes.push("employer_closure_announced");
  if (employerEvent?.announcedJobs !== undefined && (employerEvent.currentJobs === undefined || employerEvent.currentJobs !== employerEvent.announcedJobs)) codes.push("announced_jobs_not_current_jobs");
  if (!sample.minimumHistoryMet || degradedStates.includes("insufficient_history")) codes.push("insufficient_history");
  if (degradedStates.includes("stale_prior_valid")) codes.push("growth_data_stale", "provider_unavailable_prior_valid_retained");
  if (degradedStates.includes("conflicting_providers")) codes.push("conflicting_growth_sources");
  if (period.projected || period.inferred) codes.push("historical_trend_not_forecast");
  if (value.valueOrigin === "source_reported") codes.push("source_reported_value");
  if (value.valueOrigin === "brix_derived") codes.push("brix_derived_formula");
  codes.push("professional_review_recommended");
  return codes;
}

function limitationCodesFrom(entry: MarketGrowthRegistryEntry, period: MarketGrowthPeriod, employerEvent?: MarketGrowthEmployerEvent) {
  const codes = ["growth_context_not_forecast", "correlation_not_causation", "no_protected_class_scoring", "no_demographic_desirability"];
  if (entry.category === "demographic_structure" || entry.category === "population" || entry.category === "households") codes.push("demographic_context_factual_only");
  if (period.projected) codes.push("projected_period_retained_as_noncurrent_context");
  if (employerEvent?.announcedJobs !== undefined) codes.push("announced_jobs_not_current_jobs");
  return codes;
}

function deriveValue(method: MarketGrowthMethod, currentValue: number | null, baselineValue: number | null, components: readonly MarketGrowthObservation[]) {
  if (method === "absolute_difference") return currentValue === null || baselineValue === null ? null : currentValue - baselineValue;
  if (method === "percent_change" || method === "cagr") return currentValue === null || baselineValue === null || baselineValue === 0 ? null : (currentValue - baselineValue) / baselineValue;
  if (method === "hhi") {
    if (!components.length || components.some((item) => item.value.normalizedValue === null)) return null;
    return components.reduce((sum, item) => sum + (item.value.normalizedValue ?? 0) ** 2, 0);
  }
  if (method === "top_n_share") {
    if (!components.length || components.some((item) => item.value.normalizedValue === null)) return null;
    return components.reduce((sum, item) => sum + (item.value.normalizedValue ?? 0), 0);
  }
  if (method === "share") return currentValue === null || baselineValue === null || baselineValue === 0 ? null : currentValue / baselineValue;
  return null;
}

function suggestedActionFor(findingType: MarketGrowthFindingType, conflictState: MarketGrowthConflictState): MarketGrowthReviewAction {
  if (conflictState !== "none" || findingType === "conflicting_providers") return "additional_market_evidence";
  if (findingType === "major_employer_expansion_announced" || findingType === "major_employer_closure_announced") return "employer_announcement_verification";
  if (findingType === "employment_increased" || findingType === "employment_decreased" || findingType === "unemployment_changed") return "labor_market_review";
  if (findingType === "growth_context_stale") return "source_update";
  return "additional_market_evidence";
}

function assertComparable(current: MarketGrowthObservation, comparison: MarketGrowthObservation, kind: MarketGrowthComparisonKind) {
  if (current.metricType !== comparison.metricType) throw new Error("Growth comparison requires matching metric types.");
  if (current.value.valueKind !== comparison.value.valueKind) throw new Error("Growth comparison requires matching value kinds.");
  if (current.segment.segmentIdentity !== comparison.segment.segmentIdentity) throw new Error("Growth comparison requires matching market segment.");
  if ((kind === "current_vs_prior_period" || kind === "current_vs_prior_year") && current.geography.geographyIdentity !== comparison.geography.geographyIdentity) throw new Error("Growth period comparison requires matching geography.");
  if ((kind === "local_vs_county" || kind === "local_vs_metro" || kind === "metro_vs_state") && current.geography.geographyIdentity === comparison.geography.geographyIdentity) throw new Error("Growth geography comparison requires distinct geographies.");
  if (current.period.window !== comparison.period.window) throw new Error("Growth comparison cannot silently mix incompatible period windows.");
  if (current.period.sourceFrequency !== comparison.period.sourceFrequency) throw new Error("Growth comparison cannot silently mix source frequencies.");
}

function normalizeGeography(geography: MarketGrowthGeography): MarketGrowthGeography {
  return {
    geographyLevel: geography.geographyLevel,
    geographyIdentity: requiredClean(geography.geographyIdentity, "Market growth geography requires explicit identity."),
    canonicalLocationId: clean(geography.canonicalLocationId),
    boundaryId: clean(geography.boundaryId),
    boundaryVersion: clean(geography.boundaryVersion),
    comparisonGeographyIdentity: clean(geography.comparisonGeographyIdentity),
    proxy: Boolean(geography.proxy),
  };
}

function normalizeSegment(segment: MarketGrowthSegment): MarketGrowthSegment {
  return {
    segmentKind: segment.segmentKind,
    demographicCohort: clean(segment.demographicCohort),
    householdTenure: segment.householdTenure,
    incomeBand: clean(segment.incomeBand),
    employmentSector: clean(segment.employmentSector),
    industryCode: clean(segment.industryCode),
    industryClassificationSystem: segment.industryClassificationSystem,
    employerName: clean(segment.employerName),
    commutingContext: segment.commutingContext,
    housingPropertyType: clean(segment.housingPropertyType),
    segmentIdentity: requiredClean(segment.segmentIdentity, "Market growth segment requires stable identity."),
    sourceReference: stableEvidence(segment.sourceReference),
  };
}

function normalizePeriod(period: MarketGrowthPeriod): MarketGrowthPeriod {
  return {
    window: period.window,
    periodStart: clean(period.periodStart),
    periodEnd: clean(period.periodEnd),
    comparisonPeriodStart: clean(period.comparisonPeriodStart),
    comparisonPeriodEnd: clean(period.comparisonPeriodEnd),
    sourceFrequency: period.sourceFrequency,
    partialPeriod: Boolean(period.partialPeriod),
    historical: Boolean(period.historical),
    projected: Boolean(period.projected),
    inferred: Boolean(period.inferred),
    annualized: false,
  };
}

function normalizeValue(value: MarketGrowthValue): MarketGrowthValue {
  const normalizedValue = value.normalizedValue === null ? null : Number(value.normalizedValue);
  return {
    rawValue: value.rawValue,
    normalizedValue: Number.isFinite(normalizedValue ?? NaN) ? normalizedValue : null,
    unit: value.unit,
    valueKind: value.valueKind,
    currency: clean(value.currency),
    numeratorDefinition: clean(value.numeratorDefinition),
    denominatorDefinition: clean(value.denominatorDefinition),
    formulaId: clean(value.formulaId),
    formulaVersion: clean(value.formulaVersion),
    valueOrigin: value.valueOrigin,
  };
}

function normalizeSample(sample: MarketGrowthSample, entryMinimum: number): MarketGrowthSample {
  const minimumPeriodsRequired = Math.max(entryMinimum, Math.trunc(sample.minimumPeriodsRequired));
  const periodsAvailable = Math.max(0, Math.trunc(sample.periodsAvailable));
  return {
    sampleCount: integerOrUndefined(sample.sampleCount),
    recordCount: integerOrUndefined(sample.recordCount),
    sourceCoverage: sample.sourceCoverage,
    minimumPeriodsRequired,
    periodsAvailable,
    minimumHistoryMet: Boolean(sample.minimumHistoryMet) && periodsAvailable >= minimumPeriodsRequired,
    completenessIndicator: sample.completenessIndicator === undefined ? undefined : Math.max(0, Math.min(1, Number(sample.completenessIndicator))),
    sampleQualityState: sample.sampleQualityState,
  };
}

function normalizeEmployerEvent(event: MarketGrowthEmployerEvent): MarketGrowthEmployerEvent {
  return {
    eventState: event.eventState,
    employerName: clean(event.employerName),
    industryCode: clean(event.industryCode),
    industryClassificationSystem: event.industryClassificationSystem,
    announcedJobs: integerOrUndefined(event.announcedJobs),
    currentJobs: integerOrUndefined(event.currentJobs),
    announcementDate: clean(event.announcementDate),
    expectedEffectiveDate: clean(event.expectedEffectiveDate),
    eventSourceReference: stableEvidence(event.eventSourceReference),
  };
}

function worstFreshness(observations: readonly MarketGrowthObservation[]): CanonicalMarketFreshnessState {
  const priority: CanonicalMarketFreshnessState[] = ["conflicted", "unavailable", "missing_temporal_metadata", "expired", "stale", "review_due", "current_with_age_warning", "historical", "superseded", "future_effective", "not_applicable", "current"];
  return priority.find((state) => observations.some((observation) => (observation.freshness?.freshnessState ?? freshnessStateFromDegraded(observation.degradedStates)) === state)) ?? "current";
}

function freshnessStateFromDegraded(degradedStates: readonly MarketGrowthDegradedState[]): CanonicalMarketFreshnessState {
  if (degradedStates.includes("conflicting_providers")) return "conflicted";
  if (degradedStates.includes("missing_period")) return "missing_temporal_metadata";
  if (degradedStates.includes("source_unavailable") || degradedStates.includes("provider_unavailable")) return "unavailable";
  if (degradedStates.includes("stale_prior_valid")) return "stale";
  return "current";
}

function worseSampleQuality(observations: readonly (MarketGrowthObservation | undefined)[]): MarketGrowthSampleQualityState {
  const priority: MarketGrowthSampleQualityState[] = ["source_unavailable", "no_source_coverage", "conflicted_sample", "insufficient_history", "partial_history", "unknown", "adequate_history"];
  return priority.find((state) => observations.some((observation) => observation?.sample.sampleQualityState === state)) ?? "adequate_history";
}

function stableObservations(input: readonly MarketGrowthObservation[]) {
  return [...input].sort((a, b) => a.observationId.localeCompare(b.observationId));
}

function growthEntryMaterial(input: Omit<MarketGrowthRegistryEntry, "contractVersion" | "materialHash">) {
  const { registeredAt: _registeredAt, ...material } = input;
  return material;
}

function growthEntryKey(entry: MarketGrowthRegistryEntry) {
  return [entry.category, entry.metricType, entry.metricId, entry.semanticVersion].join(":");
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

function uniqueSorted<T extends string>(values: readonly (T | undefined)[]) {
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

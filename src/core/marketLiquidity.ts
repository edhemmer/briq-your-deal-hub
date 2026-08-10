import type { CanonicalMarketFreshnessResult, CanonicalMarketFreshnessState } from "./marketFreshness";
import type { MarketProviderProvenance, MarketSourceDataset } from "./marketSourceIngestion";
import type { GeographicLevel, LocationVerificationState, SourceEvidenceReference } from "./locationIdentity";
import type { ProviderConfidence, ProviderState } from "./providerAdapters";

export const MARKET_LIQUIDITY_CONTRACT_VERSION = "market-liquidity-context-v1";
export const MARKET_LIQUIDITY_REGISTRY_VERSION = "market-liquidity-registry-v1";
export const MARKET_LIQUIDITY_OBSERVATION_CONTRACT_VERSION = "market-liquidity-observation-v1";
export const MARKET_LIQUIDITY_DERIVED_METRIC_CONTRACT_VERSION = "market-liquidity-derived-metric-v1";
export const MARKET_LIQUIDITY_COMPARISON_CONTRACT_VERSION = "market-liquidity-comparison-v1";
export const MARKET_LIQUIDITY_FINDING_CONTRACT_VERSION = "market-liquidity-finding-v1";
export const MARKET_LIQUIDITY_CONFLICT_CONTRACT_VERSION = "market-liquidity-conflict-v1";
export const MARKET_LIQUIDITY_PROJECTION_CONTRACT_VERSION = "market-liquidity-projection-v1";

export const marketLiquidityMetricTypes = [
  "active_inventory",
  "new_listings",
  "pending_transactions",
  "closed_transactions",
  "transaction_volume",
  "transaction_count",
  "listing_count",
  "median_days_on_market",
  "average_days_on_market",
  "cumulative_days_on_market",
  "pending_velocity",
  "sales_velocity",
  "months_of_supply",
  "absorption_rate",
  "inventory_turnover",
  "vacancy_rate",
  "listing_to_closed_ratio",
  "pending_to_closed_ratio",
  "sale_to_list_ratio",
  "price_reduction_rate",
  "median_price_reduction",
  "failed_listing_rate",
  "delisting_rate",
  "relist_rate",
  "comparable_transaction_count",
  "recent_transaction_density",
  "transaction_frequency",
  "active_to_closed_ratio",
  "cap_rate_transaction_count",
  "cap_rate_range",
  "transaction_size_distribution",
  "institutional_transaction_share",
] as const;

export const marketLiquidityCategories = [
  "market_activity",
  "velocity",
  "supply_demand",
  "pricing_execution",
  "market_depth",
  "commercial_investment",
] as const;

export const marketLiquidityUnits = ["count", "money", "ratio", "percent", "days", "months", "rate", "frequency", "distribution", "unknown"] as const;
export const marketLiquidityPropertySectors = ["residential", "commercial", "multifamily", "land", "mixed_use", "specialty", "unknown"] as const;
export const marketLiquidityTransactionContexts = ["sale", "lease", "sale_or_lease", "unknown"] as const;
export const marketLiquidityOccupancyStates = ["occupied", "vacant", "stabilized", "lease_up", "owner_occupied", "unknown", "not_applicable"] as const;
export const marketLiquiditySampleQualityStates = ["adequate_sample", "thin_sample", "insufficient_sample", "zero_verified_activity", "no_source_coverage", "coverage_incomplete", "source_unavailable", "conflicted_sample", "unknown"] as const;
export const marketLiquidityPeriodWindows = ["trailing_30_days", "trailing_90_days", "trailing_6_months", "trailing_12_months", "calendar_quarter", "calendar_year", "rolling_annual", "provider_defined_period", "custom_period"] as const;
export const marketLiquidityAggregationMethods = ["source_reported", "brix_derived", "median", "average", "sum", "count", "ratio", "provider_specific", "unknown"] as const;
export const marketLiquidityDomMethods = ["days_on_market", "cumulative_days_on_market", "provider_marketing_time", "list_to_contract_time", "contract_to_close_time", "unknown"] as const;
export const marketLiquidityValueOrigins = ["source_reported", "brix_derived"] as const;
export const marketLiquidityComparisonKinds = ["current_vs_prior_period", "current_vs_prior_year", "property_geography_vs_broader_market", "submarket_vs_metro"] as const;
export const marketLiquidityImpactClasses = ["informational", "assumption_review", "decision_context", "professional_review_required"] as const;
export const marketLiquidityReviewActions = ["broker_market_verification", "appraiser_review", "updated_comparable_review", "lender_review", "additional_market_evidence", "none"] as const;

export const marketLiquidityFindingTypes = [
  "transaction_activity_elevated",
  "transaction_activity_reduced",
  "inventory_increased",
  "inventory_decreased",
  "marketing_time_increased",
  "marketing_time_decreased",
  "transaction_sample_thin",
  "transaction_data_unavailable",
  "sale_to_list_execution_changed",
  "absorption_changed",
  "comparable_transaction_count_limited",
  "recent_closed_activity_limited",
  "source_coverage_insufficient",
  "segment_mismatch_detected",
  "liquidity_context_stale",
  "conflicting_providers",
] as const;

export const marketLiquidityConflictStates = [
  "none",
  "provider_disagreement",
  "metric_disagreement",
  "sample_disagreement",
  "method_disagreement",
  "geography_conflict",
  "segment_conflict",
  "period_conflict",
  "current_stale_conflict",
  "unresolved",
] as const;

export const marketLiquidityDegradedStates = [
  "provider_unavailable",
  "source_unavailable",
  "sample_insufficient",
  "geography_unsupported",
  "segment_unsupported",
  "stale_prior_valid",
  "conflicting_providers",
  "missing_period",
  "missing_methodology",
  "permission_restricted",
  "record_not_found",
  "source_coverage_missing",
] as const;

export const marketLiquidityExplanationCodes = [
  "transaction_activity_observed",
  "transaction_activity_increased",
  "transaction_activity_decreased",
  "active_inventory_changed",
  "marketing_time_changed",
  "sale_to_list_changed",
  "absorption_changed",
  "comparable_sample_thin",
  "insufficient_sample",
  "source_coverage_incomplete",
  "liquidity_data_stale",
  "prior_valid_retained",
  "conflicting_provider_metrics",
  "segment_mismatch",
  "broker_verification_recommended",
  "zero_verified_activity",
  "no_source_coverage",
  "source_reported_value",
  "brix_derived_formula",
  "division_by_zero_handled",
  "no_sale_timing_guarantee",
  "no_market_value_conclusion",
  "underwriting_proposal_only",
  "professional_review_recommended",
] as const;

export type MarketLiquidityMetricType = typeof marketLiquidityMetricTypes[number];
export type MarketLiquidityCategory = typeof marketLiquidityCategories[number];
export type MarketLiquidityUnit = typeof marketLiquidityUnits[number];
export type MarketLiquidityPropertySector = typeof marketLiquidityPropertySectors[number];
export type MarketLiquidityTransactionContext = typeof marketLiquidityTransactionContexts[number];
export type MarketLiquidityOccupancyState = typeof marketLiquidityOccupancyStates[number];
export type MarketLiquiditySampleQualityState = typeof marketLiquiditySampleQualityStates[number];
export type MarketLiquidityPeriodWindow = typeof marketLiquidityPeriodWindows[number];
export type MarketLiquidityAggregationMethod = typeof marketLiquidityAggregationMethods[number];
export type MarketLiquidityDomMethod = typeof marketLiquidityDomMethods[number];
export type MarketLiquidityValueOrigin = typeof marketLiquidityValueOrigins[number];
export type MarketLiquidityComparisonKind = typeof marketLiquidityComparisonKinds[number];
export type MarketLiquidityImpactClass = typeof marketLiquidityImpactClasses[number];
export type MarketLiquidityReviewAction = typeof marketLiquidityReviewActions[number];
export type MarketLiquidityFindingType = typeof marketLiquidityFindingTypes[number];
export type MarketLiquidityConflictState = typeof marketLiquidityConflictStates[number];
export type MarketLiquidityDegradedState = typeof marketLiquidityDegradedStates[number];
export type MarketLiquidityExplanationCode = typeof marketLiquidityExplanationCodes[number];
export type MarketLiquidityLifecycleStatus = "active" | "deprecated" | "disabled";

export type MarketLiquidityGeography = {
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  canonicalLocationId?: string;
  boundaryId?: string;
  boundaryVersion?: string;
  comparisonGeographyIdentity?: string;
  proxy: boolean;
};

export type MarketLiquiditySegment = {
  propertySector: MarketLiquidityPropertySector;
  propertyType?: string;
  propertySubtype?: string;
  unitCountBand?: string;
  classBand?: string;
  sizeBand?: string;
  priceValueBand?: string;
  occupancyState: MarketLiquidityOccupancyState;
  transactionContext: MarketLiquidityTransactionContext;
  segmentIdentity: string;
  sourceReference?: SourceEvidenceReference;
};

export type MarketLiquidityPeriod = {
  window: MarketLiquidityPeriodWindow;
  periodStart?: string;
  periodEnd?: string;
  comparisonPeriodStart?: string;
  comparisonPeriodEnd?: string;
  partialPeriod: boolean;
  seasonalityLimitation?: string;
  annualized: false;
};

export type MarketLiquiditySample = {
  sampleCount?: number;
  transactionCount?: number;
  listingCount?: number;
  sourceCoverage: "complete" | "partial" | "none" | "unknown";
  excludedRecordCount?: number;
  minimumSampleRequired: number;
  minimumSampleMet: boolean;
  completenessIndicator?: number;
  sampleQualityState: MarketLiquiditySampleQualityState;
};

export type MarketLiquidityValue = {
  rawValue: number | string | null;
  normalizedValue: number | null;
  unit: MarketLiquidityUnit;
  currency?: string;
  numeratorDefinition?: string;
  denominatorDefinition?: string;
  formulaId?: string;
  formulaVersion?: string;
  valueOrigin: MarketLiquidityValueOrigin;
};

export type MarketLiquidityRegistryEntry = {
  metricId: string;
  semanticVersion: string;
  metricType: MarketLiquidityMetricType;
  category: MarketLiquidityCategory;
  unit: MarketLiquidityUnit;
  applicableDatasets: readonly MarketSourceDataset[];
  supportedPropertySectors: readonly MarketLiquidityPropertySector[];
  supportedTransactionContexts: readonly MarketLiquidityTransactionContext[];
  supportedPeriodWindows: readonly MarketLiquidityPeriodWindow[];
  supportedAggregationMethods: readonly MarketLiquidityAggregationMethod[];
  minimumSampleRequired: number;
  lifecycleStatus: MarketLiquidityLifecycleStatus;
  permittedProposalKinds: readonly string[];
  prohibitedInferenceCodes: readonly string[];
  registeredAt: string;
  contractVersion: typeof MARKET_LIQUIDITY_CONTRACT_VERSION;
  materialHash: string;
};

export type MarketLiquidityRegistry = {
  registryId: string;
  version: typeof MARKET_LIQUIDITY_REGISTRY_VERSION;
  entries: MarketLiquidityRegistryEntry[];
  materialHash: string;
};

export type MarketLiquidityObservation = {
  observationId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  metricId: string;
  metricVersion: string;
  metricType: MarketLiquidityMetricType;
  category: MarketLiquidityCategory;
  geography: MarketLiquidityGeography;
  segment: MarketLiquiditySegment;
  period: MarketLiquidityPeriod;
  value: MarketLiquidityValue;
  sample: MarketLiquiditySample;
  aggregationMethod: MarketLiquidityAggregationMethod;
  domMethod?: MarketLiquidityDomMethod;
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
  degradedStates: MarketLiquidityDegradedState[];
  explanationCodes: MarketLiquidityExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_LIQUIDITY_OBSERVATION_CONTRACT_VERSION;
};

export type MarketLiquidityDerivedMetric = {
  derivedMetricId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  metricType: MarketLiquidityMetricType;
  sourceObservationIds: string[];
  numeratorObservationId?: string;
  denominatorObservationId?: string;
  formulaId: string;
  formulaVersion: string;
  value: MarketLiquidityValue;
  sampleQualityState: MarketLiquiditySampleQualityState;
  degradedStates: MarketLiquidityDegradedState[];
  explanationCodes: MarketLiquidityExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_LIQUIDITY_DERIVED_METRIC_CONTRACT_VERSION;
};

export type MarketLiquidityComparison = {
  comparisonId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  comparisonKind: MarketLiquidityComparisonKind;
  currentObservationId: string;
  comparisonObservationId: string;
  metricType: MarketLiquidityMetricType;
  geography: MarketLiquidityGeography;
  comparisonGeography: MarketLiquidityGeography;
  segment: MarketLiquiditySegment;
  currentPeriod: MarketLiquidityPeriod;
  comparisonPeriod: MarketLiquidityPeriod;
  difference: number | null;
  percentChange: number | null;
  compatible: true;
  methodVersion: string;
  deterministicHash: string;
  contractVersion: typeof MARKET_LIQUIDITY_COMPARISON_CONTRACT_VERSION;
};

export type MarketLiquidityFinding = {
  findingId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketLiquidityFindingType;
  sourceObservationIds: string[];
  summaryCode: MarketLiquidityExplanationCode;
  geography: MarketLiquidityGeography;
  segment: MarketLiquiditySegment;
  period: MarketLiquidityPeriod;
  impactClass: MarketLiquidityImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState;
  limitationCodes: string[];
  sampleQualityState: MarketLiquiditySampleQualityState;
  suggestedVerificationAction: MarketLiquidityReviewAction;
  applicableStrategyReferences: string[];
  conflictState: MarketLiquidityConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  appraisalConclusionAllowed: false;
  saleTimingGuaranteeAllowed: false;
  futureDemandPredictionAllowed: false;
  stableOrdinal: number;
  deterministicHash: string;
  contractVersion: typeof MARKET_LIQUIDITY_FINDING_CONTRACT_VERSION;
};

export type MarketLiquidityConflictManifest = {
  conflictId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketLiquidityConflictState, "none">;
  observationIds: string[];
  retainedObservationIds: string[];
  geography: MarketLiquidityGeography;
  segment: MarketLiquiditySegment;
  reasonCodes: MarketLiquidityExplanationCode[];
  blockedUntilResolved: true;
  deterministicHash: string;
  contractVersion: typeof MARKET_LIQUIDITY_CONFLICT_CONTRACT_VERSION;
};

export type MarketLiquidityProjection = {
  findingId: string;
  findingType: MarketLiquidityFindingType;
  sourceObservationIds: string[];
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  segmentIdentity: string;
  impactClass: MarketLiquidityImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState;
  conflictState: MarketLiquidityConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  recommendationMutationAllowed: false;
  contractVersion: typeof MARKET_LIQUIDITY_PROJECTION_CONTRACT_VERSION;
  deterministicHash: string;
};

type LiquidityEntryInput = Omit<MarketLiquidityRegistryEntry, "contractVersion" | "materialHash">;

export function defineMarketLiquidityRegistryEntry(input: LiquidityEntryInput): MarketLiquidityRegistryEntry {
  const metricId = normalizeId(input.metricId, "Market liquidity registry entry requires metric ID.");
  if (!marketLiquidityMetricTypes.includes(input.metricType)) throw new Error("Market liquidity metric type is not registered.");
  if (!marketLiquidityCategories.includes(input.category)) throw new Error("Market liquidity category is not registered.");
  if (!marketLiquidityUnits.includes(input.unit)) throw new Error("Market liquidity unit is not registered.");
  if (input.lifecycleStatus === "disabled") throw new Error("Disabled liquidity entries cannot be used for new observations.");
  const entry = {
    ...input,
    metricId,
    semanticVersion: requiredClean(input.semanticVersion, "Market liquidity registry entry requires semantic version."),
    applicableDatasets: uniqueSorted(input.applicableDatasets),
    supportedPropertySectors: uniqueSorted(input.supportedPropertySectors),
    supportedTransactionContexts: uniqueSorted(input.supportedTransactionContexts),
    supportedPeriodWindows: uniqueSorted(input.supportedPeriodWindows),
    supportedAggregationMethods: uniqueSorted(input.supportedAggregationMethods),
    minimumSampleRequired: Math.max(0, Math.trunc(input.minimumSampleRequired)),
    permittedProposalKinds: uniqueSorted(input.permittedProposalKinds),
    prohibitedInferenceCodes: uniqueSorted(input.prohibitedInferenceCodes),
    registeredAt: requiredClean(input.registeredAt, "Market liquidity registry entry requires registration time."),
  };
  if (!entry.applicableDatasets.length) throw new Error("Market liquidity registry entry requires at least one source dataset.");
  if (!entry.supportedPropertySectors.every(isMarketLiquidityPropertySector)) throw new Error("Market liquidity entry includes unsupported property sector.");
  if (!entry.supportedTransactionContexts.every(isMarketLiquidityTransactionContext)) throw new Error("Market liquidity entry includes unsupported transaction context.");
  const material = liquidityEntryMaterial(entry);
  return {
    ...entry,
    contractVersion: MARKET_LIQUIDITY_CONTRACT_VERSION,
    materialHash: `ml_entryh_${stableHash(material).slice(0, 24)}`,
  };
}

export function createMarketLiquidityRegistry(entries: readonly MarketLiquidityRegistryEntry[]): MarketLiquidityRegistry {
  const sorted = [...entries].sort((a, b) => liquidityEntryKey(a).localeCompare(liquidityEntryKey(b)));
  const materialHash = `ml_regh_${stableHash(sorted.map((entry) => entry.materialHash)).slice(0, 24)}`;
  return {
    registryId: `ml_reg_${stableHash({ materialHash, version: MARKET_LIQUIDITY_REGISTRY_VERSION }).slice(0, 24)}`,
    version: MARKET_LIQUIDITY_REGISTRY_VERSION,
    entries: sorted,
    materialHash,
  };
}

export function selectMarketLiquidityRegistryEntry(input: {
  registry: MarketLiquidityRegistry;
  metricId: string;
  semanticVersion?: string;
}): MarketLiquidityRegistryEntry {
  const metricId = normalizeId(input.metricId, "Market liquidity entry selection requires metric ID.");
  const entry = input.registry.entries.find((item) => item.metricId === metricId && (!input.semanticVersion || item.semanticVersion === input.semanticVersion));
  if (!entry) throw new Error("Market liquidity registry entry was not found.");
  if (entry.lifecycleStatus === "disabled") throw new Error("Disabled market liquidity entries cannot create new observations.");
  return entry;
}

export function createMarketLiquidityObservation(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  entry: MarketLiquidityRegistryEntry;
  geography: MarketLiquidityGeography;
  segment: MarketLiquiditySegment;
  period: MarketLiquidityPeriod;
  value: MarketLiquidityValue;
  sample: MarketLiquiditySample;
  aggregationMethod: MarketLiquidityAggregationMethod;
  domMethod?: MarketLiquidityDomMethod;
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
  degradedStates?: readonly MarketLiquidityDegradedState[];
  explanationCodes?: readonly MarketLiquidityExplanationCode[];
}): MarketLiquidityObservation {
  assertEntrySupportsObservation(input.entry, input.segment, input.period, input.aggregationMethod, input.dataset);
  if (input.domMethod && !marketLiquidityDomMethods.includes(input.domMethod)) throw new Error("Market liquidity DOM method is not registered.");
  const sample = normalizeSample(input.sample, input.entry.minimumSampleRequired);
  const value = normalizeValue(input.value);
  const degradedStates = uniqueSorted([...degradedStatesFrom({ ...input, sample, value }), ...(input.degradedStates ?? [])]);
  const explanationCodes = uniqueSorted([...explanationCodesFrom(input.entry, sample, value, degradedStates), ...(input.explanationCodes ?? []), "underwriting_proposal_only", "no_sale_timing_guarantee"]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market liquidity observation requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    canonicalLocationId: clean(input.canonicalLocationId),
    metricId: input.entry.metricId,
    metricVersion: input.entry.semanticVersion,
    metricType: input.entry.metricType,
    category: input.entry.category,
    geography: normalizeGeography(input.geography),
    segment: normalizeSegment(input.segment),
    period: normalizePeriod(input.period),
    value,
    sample,
    aggregationMethod: input.aggregationMethod,
    domMethod: input.domMethod,
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
    limitationCodes: uniqueSorted(input.limitationCodes ?? []),
    degradedStates,
    explanationCodes,
  };
  return {
    ...basis,
    observationId: `ml_obs_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `ml_obsh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LIQUIDITY_OBSERVATION_CONTRACT_VERSION,
  };
}

export function deriveMarketLiquidityMetric(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  metricType: Extract<MarketLiquidityMetricType, "months_of_supply" | "absorption_rate" | "listing_to_closed_ratio" | "pending_to_closed_ratio" | "active_to_closed_ratio">;
  numeratorObservation?: MarketLiquidityObservation;
  denominatorObservation?: MarketLiquidityObservation;
  formulaId: string;
  formulaVersion: string;
  unit: MarketLiquidityUnit;
  multiplier?: number;
}): MarketLiquidityDerivedMetric {
  const numerator = input.numeratorObservation;
  const denominator = input.denominatorObservation;
  const denominatorValue = denominator?.value.normalizedValue ?? null;
  const numeratorValue = numerator?.value.normalizedValue ?? null;
  const denominatorMissingOrZero = denominatorValue === null || denominatorValue === 0;
  const normalizedValue = denominatorMissingOrZero || numeratorValue === null ? null : (numeratorValue / denominatorValue) * (input.multiplier ?? 1);
  const sourceObservationIds = uniqueSorted([numerator?.observationId, denominator?.observationId].filter((id): id is string => Boolean(id)));
  const degradedStates = uniqueSorted([
    ...(denominatorMissingOrZero ? ["sample_insufficient" as const] : []),
    ...(sourceObservationIds.length < 2 ? ["source_unavailable" as const] : []),
    ...(numerator?.degradedStates ?? []),
    ...(denominator?.degradedStates ?? []),
  ]);
  const explanationCodes = uniqueSorted([
    "brix_derived_formula",
    "underwriting_proposal_only",
    ...(denominatorMissingOrZero ? ["division_by_zero_handled" as const, "insufficient_sample" as const] : []),
  ]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Derived liquidity metric requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    metricType: input.metricType,
    sourceObservationIds,
    numeratorObservationId: numerator?.observationId,
    denominatorObservationId: denominator?.observationId,
    formulaId: requiredClean(input.formulaId, "Derived liquidity metric requires formula ID."),
    formulaVersion: requiredClean(input.formulaVersion, "Derived liquidity metric requires formula version."),
    value: {
      rawValue: normalizedValue,
      normalizedValue,
      unit: input.unit,
      numeratorDefinition: numerator?.metricType,
      denominatorDefinition: denominator?.metricType,
      formulaId: input.formulaId,
      formulaVersion: input.formulaVersion,
      valueOrigin: "brix_derived" as const,
    },
    sampleQualityState: denominatorMissingOrZero ? "insufficient_sample" as const : worseSampleQuality([numerator, denominator]),
    degradedStates,
    explanationCodes,
  };
  return {
    ...basis,
    derivedMetricId: `ml_der_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `ml_derh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LIQUIDITY_DERIVED_METRIC_CONTRACT_VERSION,
  };
}

export function createMarketLiquidityComparison(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  comparisonKind: MarketLiquidityComparisonKind;
  currentObservation: MarketLiquidityObservation;
  comparisonObservation: MarketLiquidityObservation;
  methodVersion: string;
}): MarketLiquidityComparison {
  if (!marketLiquidityComparisonKinds.includes(input.comparisonKind)) throw new Error("Market liquidity comparison kind is not registered.");
  assertComparable(input.currentObservation, input.comparisonObservation, input.comparisonKind);
  const currentValue = input.currentObservation.value.normalizedValue;
  const comparisonValue = input.comparisonObservation.value.normalizedValue;
  const difference = currentValue === null || comparisonValue === null ? null : currentValue - comparisonValue;
  const percentChange = difference === null || !comparisonValue ? null : difference / comparisonValue;
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market liquidity comparison requires workspace scope."),
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
    methodVersion: requiredClean(input.methodVersion, "Market liquidity comparison requires method version."),
  };
  return {
    ...basis,
    comparisonId: `ml_cmp_${stableHash(basis).slice(0, 24)}`,
    deterministicHash: `ml_cmph_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LIQUIDITY_COMPARISON_CONTRACT_VERSION,
  };
}

export function createMarketLiquidityFinding(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketLiquidityFindingType;
  sourceObservations: readonly MarketLiquidityObservation[];
  summaryCode: MarketLiquidityExplanationCode;
  impactClass: MarketLiquidityImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState?: CanonicalMarketFreshnessState;
  limitationCodes?: readonly string[];
  sampleQualityState?: MarketLiquiditySampleQualityState;
  suggestedVerificationAction?: MarketLiquidityReviewAction;
  applicableStrategyReferences?: readonly string[];
  conflictState?: MarketLiquidityConflictState;
  assumptionProposalReferences?: readonly string[];
  stableOrdinal?: number;
}): MarketLiquidityFinding {
  if (!marketLiquidityFindingTypes.includes(input.findingType)) throw new Error("Market liquidity finding type is not registered.");
  if (!marketLiquidityExplanationCodes.includes(input.summaryCode)) throw new Error("Market liquidity finding summary code is not registered.");
  if (!marketLiquidityImpactClasses.includes(input.impactClass)) throw new Error("Market liquidity impact class is not registered.");
  const observations = stableObservations(input.sourceObservations);
  if (!observations.length) throw new Error("Market liquidity finding requires at least one source observation.");
  const conflictState = input.conflictState ?? (observations.some((item) => item.degradedStates.includes("conflicting_providers")) ? "unresolved" : "none");
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market liquidity finding requires workspace scope."),
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
    limitationCodes: uniqueSorted([...(input.limitationCodes ?? []), ...observations.flatMap((item) => item.limitationCodes), "market_liquidity_context_not_sale_prediction"]),
    sampleQualityState: input.sampleQualityState ?? worseSampleQuality(observations),
    suggestedVerificationAction: input.suggestedVerificationAction ?? suggestedActionFor(input.findingType, conflictState),
    applicableStrategyReferences: uniqueSorted(input.applicableStrategyReferences ?? []),
    conflictState,
    assumptionProposalReferences: uniqueSorted(input.assumptionProposalReferences ?? []),
    stableOrdinal: Math.max(0, Math.trunc(input.stableOrdinal ?? 0)),
  };
  return {
    ...basis,
    findingId: `ml_find_${stableHash({ type: basis.findingType, observations: basis.sourceObservationIds, stableOrdinal: basis.stableOrdinal }).slice(0, 24)}`,
    underwritingMutationAllowed: false,
    strategyRerankAllowed: false,
    recommendationMutationAllowed: false,
    appraisalConclusionAllowed: false,
    saleTimingGuaranteeAllowed: false,
    futureDemandPredictionAllowed: false,
    deterministicHash: `ml_findh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LIQUIDITY_FINDING_CONTRACT_VERSION,
  };
}

export function createMarketLiquidityConflictManifest(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketLiquidityConflictState, "none">;
  observations: readonly MarketLiquidityObservation[];
  reasonCodes: readonly MarketLiquidityExplanationCode[];
  retainedObservationIds?: readonly string[];
}): MarketLiquidityConflictManifest {
  if (!marketLiquidityConflictStates.includes(input.conflictState)) throw new Error("Market liquidity conflict state is not registered.");
  const observations = stableObservations(input.observations);
  if (observations.length < 2) throw new Error("Market liquidity conflict requires at least two observations.");
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market liquidity conflict requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    conflictState: input.conflictState,
    observationIds: observations.map((item) => item.observationId),
    retainedObservationIds: uniqueSorted(input.retainedObservationIds ?? observations.map((item) => item.observationId)),
    geography: observations[0].geography,
    segment: observations[0].segment,
    reasonCodes: uniqueSorted(input.reasonCodes.length ? input.reasonCodes : ["broker_verification_recommended"]),
  };
  return {
    ...basis,
    conflictId: `ml_conf_${stableHash(basis).slice(0, 24)}`,
    blockedUntilResolved: true,
    deterministicHash: `ml_confh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_LIQUIDITY_CONFLICT_CONTRACT_VERSION,
  };
}

export function projectMarketLiquidityFinding(finding: MarketLiquidityFinding): MarketLiquidityProjection {
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
    contractVersion: MARKET_LIQUIDITY_PROJECTION_CONTRACT_VERSION as typeof MARKET_LIQUIDITY_PROJECTION_CONTRACT_VERSION,
  };
  return {
    ...projection,
    deterministicHash: `ml_projh_${stableHash(projection).slice(0, 24)}`,
  };
}

export function marketLiquidityDiagnostics(event: "liquidity_observed" | "liquidity_finding_created" | "liquidity_conflict_detected" | "liquidity_degraded" | "liquidity_proposal_referenced", input: {
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

export function isMarketLiquidityMetricType(value: string): value is MarketLiquidityMetricType {
  return marketLiquidityMetricTypes.includes(value as MarketLiquidityMetricType);
}

export function isMarketLiquidityPropertySector(value: string): value is MarketLiquidityPropertySector {
  return marketLiquidityPropertySectors.includes(value as MarketLiquidityPropertySector);
}

export function isMarketLiquidityTransactionContext(value: string): value is MarketLiquidityTransactionContext {
  return marketLiquidityTransactionContexts.includes(value as MarketLiquidityTransactionContext);
}

export function isMarketLiquidityFindingType(value: string): value is MarketLiquidityFindingType {
  return marketLiquidityFindingTypes.includes(value as MarketLiquidityFindingType);
}

function assertEntrySupportsObservation(
  entry: MarketLiquidityRegistryEntry,
  segment: MarketLiquiditySegment,
  period: MarketLiquidityPeriod,
  aggregationMethod: MarketLiquidityAggregationMethod,
  dataset?: MarketSourceDataset,
) {
  if (!entry.supportedPropertySectors.includes(segment.propertySector)) throw new Error("Liquidity metric does not support this property sector.");
  if (!entry.supportedTransactionContexts.includes(segment.transactionContext)) throw new Error("Liquidity metric does not support this transaction context.");
  if (!entry.supportedPeriodWindows.includes(period.window)) throw new Error("Liquidity metric does not support this period window.");
  if (!entry.supportedAggregationMethods.includes(aggregationMethod)) throw new Error("Liquidity metric does not support this aggregation method.");
  if (dataset && !entry.applicableDatasets.includes(dataset)) throw new Error("Liquidity metric does not support this source dataset.");
}

function degradedStatesFrom(input: {
  providerState?: ProviderState;
  sourceRecordId?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance?: readonly MarketProviderProvenance[];
  freshness?: CanonicalMarketFreshnessResult;
  geography: MarketLiquidityGeography;
  segment: MarketLiquiditySegment;
  period: MarketLiquidityPeriod;
  aggregationMethod: MarketLiquidityAggregationMethod;
  domMethod?: MarketLiquidityDomMethod;
  sample: MarketLiquiditySample;
  value: MarketLiquidityValue;
}): MarketLiquidityDegradedState[] {
  const states: MarketLiquidityDegradedState[] = [];
  if (input.providerState === "offline" || input.providerState === "maintenance" || input.providerState === "rate_limited" || input.providerState === "authentication_required") states.push("provider_unavailable");
  if (input.providerState === "not_configured" || input.providerState === "disabled" || input.providerState === "unsupported") states.push("record_not_found");
  if (!input.sourceRecordId && !input.evidenceReference && !(input.provenance ?? []).length) states.push("source_unavailable");
  if (input.freshness?.priorValidResultId || input.freshness?.priorValidSourceRecordId) states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "stale" || input.freshness?.freshnessState === "expired" || input.freshness?.freshnessState === "historical") states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "unavailable") states.push("source_unavailable");
  if (input.freshness?.freshnessState === "missing_temporal_metadata") states.push("missing_period");
  if (input.freshness?.freshnessState === "conflicted") states.push("conflicting_providers");
  if (input.geography.geographyLevel === "unknown" || input.geography.proxy) states.push("geography_unsupported");
  if (input.segment.propertySector === "unknown" || input.segment.transactionContext === "unknown" || !clean(input.segment.segmentIdentity)) states.push("segment_unsupported");
  if (!input.period.periodStart || !input.period.periodEnd) states.push("missing_period");
  if (input.aggregationMethod === "unknown") states.push("missing_methodology");
  if ((input.value.unit === "days" || input.value.unit === "months") && input.domMethod === "unknown") states.push("missing_methodology");
  if (input.sample.sampleQualityState === "insufficient_sample" || input.sample.sampleQualityState === "thin_sample") states.push("sample_insufficient");
  if (input.sample.sampleQualityState === "no_source_coverage" || input.sample.sourceCoverage === "none") states.push("source_coverage_missing");
  if (input.sample.sampleQualityState === "source_unavailable") states.push("source_unavailable");
  if (input.sample.sampleQualityState === "conflicted_sample") states.push("conflicting_providers");
  return states;
}

function explanationCodesFrom(
  entry: MarketLiquidityRegistryEntry,
  sample: MarketLiquiditySample,
  value: MarketLiquidityValue,
  degradedStates: readonly MarketLiquidityDegradedState[],
): MarketLiquidityExplanationCode[] {
  const codes: MarketLiquidityExplanationCode[] = [];
  if (entry.category === "market_activity" || entry.metricType === "closed_transactions" || entry.metricType === "transaction_count") codes.push("transaction_activity_observed");
  if (entry.metricType === "active_inventory") codes.push("active_inventory_changed");
  if (entry.metricType === "median_days_on_market" || entry.metricType === "average_days_on_market" || entry.metricType === "cumulative_days_on_market") codes.push("marketing_time_changed");
  if (entry.metricType === "sale_to_list_ratio") codes.push("sale_to_list_changed", "no_market_value_conclusion");
  if (entry.metricType === "absorption_rate" || entry.metricType === "months_of_supply") codes.push("absorption_changed");
  if (sample.sampleQualityState === "thin_sample") codes.push("comparable_sample_thin");
  if (sample.sampleQualityState === "insufficient_sample") codes.push("insufficient_sample");
  if (sample.sampleQualityState === "zero_verified_activity") codes.push("zero_verified_activity");
  if (sample.sampleQualityState === "no_source_coverage") codes.push("no_source_coverage");
  if (sample.sourceCoverage === "partial" || degradedStates.includes("source_coverage_missing")) codes.push("source_coverage_incomplete");
  if (degradedStates.includes("stale_prior_valid")) codes.push("liquidity_data_stale", "prior_valid_retained");
  if (degradedStates.includes("conflicting_providers")) codes.push("conflicting_provider_metrics");
  if (degradedStates.includes("segment_unsupported")) codes.push("segment_mismatch");
  if (value.valueOrigin === "source_reported") codes.push("source_reported_value");
  if (value.valueOrigin === "brix_derived") codes.push("brix_derived_formula");
  codes.push("broker_verification_recommended", "professional_review_recommended");
  return codes;
}

function suggestedActionFor(findingType: MarketLiquidityFindingType, conflictState: MarketLiquidityConflictState): MarketLiquidityReviewAction {
  if (conflictState !== "none") return "additional_market_evidence";
  if (findingType === "conflicting_providers" || findingType === "segment_mismatch_detected") return "additional_market_evidence";
  if (findingType === "sale_to_list_execution_changed") return "updated_comparable_review";
  if (findingType === "transaction_sample_thin" || findingType === "recent_closed_activity_limited") return "broker_market_verification";
  return "broker_market_verification";
}

function assertComparable(current: MarketLiquidityObservation, comparison: MarketLiquidityObservation, kind: MarketLiquidityComparisonKind) {
  if (current.metricType !== comparison.metricType) throw new Error("Liquidity comparison requires matching metric types.");
  if (current.segment.segmentIdentity !== comparison.segment.segmentIdentity) throw new Error("Liquidity comparison requires matching market segment.");
  if ((kind === "current_vs_prior_period" || kind === "current_vs_prior_year") && current.geography.geographyIdentity !== comparison.geography.geographyIdentity) throw new Error("Liquidity period comparison requires matching geography.");
  if ((kind === "property_geography_vs_broader_market" || kind === "submarket_vs_metro") && current.geography.geographyIdentity === comparison.geography.geographyIdentity) throw new Error("Broader-market liquidity comparison requires distinct geographies.");
  if (current.period.window !== comparison.period.window && (kind === "current_vs_prior_period" || kind === "current_vs_prior_year")) throw new Error("Liquidity comparison cannot silently mix incompatible period windows.");
}

function normalizeGeography(geography: MarketLiquidityGeography): MarketLiquidityGeography {
  return {
    geographyLevel: geography.geographyLevel,
    geographyIdentity: requiredClean(geography.geographyIdentity, "Market liquidity geography requires explicit identity."),
    canonicalLocationId: clean(geography.canonicalLocationId),
    boundaryId: clean(geography.boundaryId),
    boundaryVersion: clean(geography.boundaryVersion),
    comparisonGeographyIdentity: clean(geography.comparisonGeographyIdentity),
    proxy: Boolean(geography.proxy),
  };
}

function normalizeSegment(segment: MarketLiquiditySegment): MarketLiquiditySegment {
  return {
    propertySector: segment.propertySector,
    propertyType: clean(segment.propertyType),
    propertySubtype: clean(segment.propertySubtype),
    unitCountBand: clean(segment.unitCountBand),
    classBand: clean(segment.classBand),
    sizeBand: clean(segment.sizeBand),
    priceValueBand: clean(segment.priceValueBand),
    occupancyState: segment.occupancyState,
    transactionContext: segment.transactionContext,
    segmentIdentity: requiredClean(segment.segmentIdentity, "Market liquidity segment requires stable identity."),
    sourceReference: stableEvidence(segment.sourceReference),
  };
}

function normalizePeriod(period: MarketLiquidityPeriod): MarketLiquidityPeriod {
  return {
    window: period.window,
    periodStart: clean(period.periodStart),
    periodEnd: clean(period.periodEnd),
    comparisonPeriodStart: clean(period.comparisonPeriodStart),
    comparisonPeriodEnd: clean(period.comparisonPeriodEnd),
    partialPeriod: Boolean(period.partialPeriod),
    seasonalityLimitation: clean(period.seasonalityLimitation),
    annualized: false,
  };
}

function normalizeSample(sample: MarketLiquiditySample, entryMinimum: number): MarketLiquiditySample {
  const minimumSampleRequired = Math.max(entryMinimum, Math.trunc(sample.minimumSampleRequired));
  const sampleCount = integerOrUndefined(sample.sampleCount);
  const transactionCount = integerOrUndefined(sample.transactionCount);
  const listingCount = integerOrUndefined(sample.listingCount);
  return {
    sampleCount,
    transactionCount,
    listingCount,
    sourceCoverage: sample.sourceCoverage,
    excludedRecordCount: integerOrUndefined(sample.excludedRecordCount),
    minimumSampleRequired,
    minimumSampleMet: Boolean(sample.minimumSampleMet) && (sampleCount === undefined || sampleCount >= minimumSampleRequired),
    completenessIndicator: sample.completenessIndicator === undefined ? undefined : Math.max(0, Math.min(1, Number(sample.completenessIndicator))),
    sampleQualityState: sample.sampleQualityState,
  };
}

function normalizeValue(value: MarketLiquidityValue): MarketLiquidityValue {
  const normalizedValue = value.normalizedValue === null ? null : Number(value.normalizedValue);
  return {
    rawValue: value.rawValue,
    normalizedValue: Number.isFinite(normalizedValue ?? NaN) ? normalizedValue : null,
    unit: value.unit,
    currency: clean(value.currency),
    numeratorDefinition: clean(value.numeratorDefinition),
    denominatorDefinition: clean(value.denominatorDefinition),
    formulaId: clean(value.formulaId),
    formulaVersion: clean(value.formulaVersion),
    valueOrigin: value.valueOrigin,
  };
}

function worstFreshness(observations: readonly MarketLiquidityObservation[]): CanonicalMarketFreshnessState {
  const priority: CanonicalMarketFreshnessState[] = ["conflicted", "unavailable", "missing_temporal_metadata", "expired", "stale", "review_due", "current_with_age_warning", "historical", "superseded", "future_effective", "not_applicable", "current"];
  return priority.find((state) => observations.some((observation) => (observation.freshness?.freshnessState ?? freshnessStateFromDegraded(observation.degradedStates)) === state)) ?? "current";
}

function freshnessStateFromDegraded(degradedStates: readonly MarketLiquidityDegradedState[]): CanonicalMarketFreshnessState {
  if (degradedStates.includes("conflicting_providers")) return "conflicted";
  if (degradedStates.includes("missing_period")) return "missing_temporal_metadata";
  if (degradedStates.includes("source_unavailable") || degradedStates.includes("provider_unavailable")) return "unavailable";
  if (degradedStates.includes("stale_prior_valid")) return "stale";
  return "current";
}

function worseSampleQuality(observations: readonly (MarketLiquidityObservation | undefined)[]): MarketLiquiditySampleQualityState {
  const priority: MarketLiquiditySampleQualityState[] = ["source_unavailable", "no_source_coverage", "conflicted_sample", "insufficient_sample", "thin_sample", "coverage_incomplete", "zero_verified_activity", "unknown", "adequate_sample"];
  return priority.find((state) => observations.some((observation) => observation?.sample.sampleQualityState === state)) ?? "adequate_sample";
}

function stableObservations(input: readonly MarketLiquidityObservation[]) {
  return [...input].sort((a, b) => a.observationId.localeCompare(b.observationId));
}

function liquidityEntryMaterial(input: Omit<MarketLiquidityRegistryEntry, "contractVersion" | "materialHash">) {
  const { registeredAt: _registeredAt, ...material } = input;
  return material;
}

function liquidityEntryKey(entry: MarketLiquidityRegistryEntry) {
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

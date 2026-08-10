import type {
  GeographicLevel,
  LocationVerificationState,
  SourceEvidenceReference,
} from "./locationIdentity";
import type { ProviderConfidence, ProviderState } from "./providerAdapters";
import type { CanonicalMarketFreshnessResult, CanonicalMarketFreshnessState } from "./marketFreshness";
import type { MarketProviderProvenance, MarketSourceDataset } from "./marketSourceIngestion";

export const MARKET_TAX_CONTRACT_VERSION = "market-tax-context-v1";
export const MARKET_TAX_REGISTRY_VERSION = "market-tax-registry-v1";
export const MARKET_TAX_OBSERVATION_CONTRACT_VERSION = "market-tax-observation-v1";
export const MARKET_TAX_FINDING_CONTRACT_VERSION = "market-tax-finding-v1";
export const MARKET_TAX_CONFLICT_CONTRACT_VERSION = "market-tax-conflict-v1";
export const MARKET_TAX_PROJECTION_CONTRACT_VERSION = "market-tax-projection-v1";

export const marketTaxMetricTypes = [
  "assessed_value",
  "taxable_value",
  "market_value_assessor_estimate",
  "tax_bill_amount",
  "base_tax_amount",
  "tax_rate",
  "effective_tax_rate",
  "millage_rate",
  "levy",
  "exemption",
  "homestead_exemption",
  "senior_or_disabled_exemption",
  "special_assessment",
  "special_district_charge",
  "tax_district",
  "delinquency_status",
  "payment_status",
  "assessment_change",
  "tax_change",
] as const;

export const marketTaxCategories = [
  "valuation",
  "bill",
  "rate",
  "levy",
  "exemption",
  "special_assessment",
  "district",
  "status",
  "history",
  "change",
] as const;

export const marketTaxValueTypes = ["money", "rate", "text", "status", "boolean", "percent_change", "identifier"] as const;
export const marketTaxRateUnits = ["percent", "decimal", "mills"] as const;
export const marketTaxPeriodSemantics = ["assessment_year", "tax_year", "billing_period", "due_period", "effective_period", "publication_period", "unknown"] as const;
export const marketTaxObservationMethods = ["authority_record", "provider_normalized_record", "user_document", "professional_report", "calculated_from_source_values", "user_entered_evidence", "unknown"] as const;
export const marketTaxFindingTypes = [
  "tax_record_current",
  "tax_record_stale",
  "latest_tax_record_unavailable",
  "tax_bill_changed",
  "assessment_changed",
  "exemption_reported",
  "exemption_transfer_unknown",
  "special_assessment_reported",
  "special_district_reported",
  "conflicting_tax_records",
  "parcel_identity_requires_verification",
  "tax_year_missing",
  "authority_verification_recommended",
] as const;
export const marketTaxImpactClasses = ["informational", "assumption_review", "cash_flow_context", "decision_relevant", "professional_review_required"] as const;
export const marketTaxConflictStates = ["none", "parcel_mismatch", "authority_conflict", "period_conflict", "provider_conflict", "user_provider_conflict", "special_assessment_treatment_conflict", "stale_current_conflict", "unresolved"] as const;
export const marketTaxDegradedStates = ["record_unavailable", "provider_unavailable", "parcel_unresolved", "authority_unresolved", "stale_prior_valid", "conflicting_tax_records", "missing_tax_year", "unsupported_jurisdiction", "missing_source", "permission_restricted"] as const;
export const marketTaxExplanationCodes = [
  "tax_record_current",
  "tax_record_stale",
  "assessed_value_changed",
  "taxable_value_changed",
  "tax_bill_changed",
  "exemption_reported",
  "exemption_transfer_unknown",
  "special_assessment_reported",
  "special_district_reported",
  "parcel_identity_conflict",
  "provider_unavailable_prior_valid_retained",
  "tax_year_missing",
  "authority_verification_recommended",
  "value_distinction_preserved",
  "underwriting_proposal_only",
  "professional_tax_review_recommended",
] as const;

export type MarketTaxMetricType = typeof marketTaxMetricTypes[number];
export type MarketTaxCategory = typeof marketTaxCategories[number];
export type MarketTaxValueType = typeof marketTaxValueTypes[number];
export type MarketTaxRateUnit = typeof marketTaxRateUnits[number];
export type MarketTaxPeriodSemantic = typeof marketTaxPeriodSemantics[number];
export type MarketTaxObservationMethod = typeof marketTaxObservationMethods[number];
export type MarketTaxFindingType = typeof marketTaxFindingTypes[number];
export type MarketTaxImpactClass = typeof marketTaxImpactClasses[number];
export type MarketTaxConflictState = typeof marketTaxConflictStates[number];
export type MarketTaxDegradedState = typeof marketTaxDegradedStates[number];
export type MarketTaxExplanationCode = typeof marketTaxExplanationCodes[number];
export type MarketTaxLifecycleStatus = "active" | "deprecated" | "disabled";
export type MarketTaxCurrency = "USD" | "CAD" | "MXN" | "unknown";
export type MarketTaxSpecialAssessmentRecurrence = "recurring" | "nonrecurring" | "unknown";
export type MarketTaxVerificationBoundary = "county_or_municipal_verification" | "tax_professional_review" | "attorney_or_title_review" | "assessor_or_collector_confirmation" | "none";

export type MarketTaxAuthorityReference = {
  authorityId: string;
  authorityName?: string;
  authorityType: "county_assessor" | "county_treasurer" | "municipality" | "school_district" | "special_district" | "state" | "provider" | "user_document" | "unknown";
  jurisdiction?: string;
  jurisdictionLevel?: GeographicLevel;
  sourceReference?: SourceEvidenceReference;
};

export type MarketTaxParcelReference = {
  parcelId?: string;
  assessorId?: string;
  municipalityAccountId?: string;
  taxDistrictId?: string;
  specialDistrictId?: string;
  authorityId: string;
  parcelRole: "primary" | "component" | "mailing" | "historical" | "unresolved";
  matchState: "matched" | "multiple_parcels" | "mismatch" | "unresolved" | "not_applicable";
  sourceReference?: SourceEvidenceReference;
};

export type MarketTaxPeriod = {
  assessmentYear?: number;
  taxYear?: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  duePeriodStart?: string;
  duePeriodEnd?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  publicationDate?: string;
  retrievalTime?: string;
  semantics: MarketTaxPeriodSemantic;
  partialYear: boolean;
  futurePeriod: boolean;
};

export type MarketTaxValue = {
  rawValue: string | number | boolean | null;
  normalizedValue: string | number | boolean | null;
  valueType: MarketTaxValueType;
  currency?: MarketTaxCurrency;
  unit?: string;
  rateUnit?: MarketTaxRateUnit;
  rateBasis?: "assessed_value" | "taxable_value" | "tax_bill_amount" | "unknown";
  annualized: false;
};

export type MarketTaxRegistryEntry = {
  metricId: string;
  semanticVersion: string;
  metricType: MarketTaxMetricType;
  category: MarketTaxCategory;
  valueType: MarketTaxValueType;
  unit?: string;
  currency?: MarketTaxCurrency;
  applicableGeographyLevels: readonly GeographicLevel[];
  requiredPeriodSemantics: readonly MarketTaxPeriodSemantic[];
  authorityExpectations: readonly string[];
  lifecycleStatus: MarketTaxLifecycleStatus;
  professionalBoundary: MarketTaxVerificationBoundary;
  permittedProposalKinds: readonly string[];
  prohibitedInferenceCodes: readonly string[];
  replacementMetricId?: string;
  replacementMetricVersion?: string;
  registeredAt: string;
  contractVersion: typeof MARKET_TAX_CONTRACT_VERSION;
  materialHash: string;
};

export type MarketTaxRegistry = {
  registryId: string;
  version: typeof MARKET_TAX_REGISTRY_VERSION;
  entries: MarketTaxRegistryEntry[];
  materialHash: string;
};

export type MarketTaxObservation = {
  observationId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  metricId: string;
  metricVersion: string;
  metricType: MarketTaxMetricType;
  category: MarketTaxCategory;
  authority: MarketTaxAuthorityReference;
  parcel: MarketTaxParcelReference;
  geography: {
    geographyLevel: GeographicLevel;
    geographyIdentity: string;
    jurisdiction?: string;
    taxDistrict?: string;
    boundaryId?: string;
    boundaryVersion?: string;
  };
  period: MarketTaxPeriod;
  value: MarketTaxValue;
  exemption?: {
    exemptionType: "homestead" | "senior_or_disabled" | "other" | "unknown";
    amount?: number;
    basis?: string;
    qualifyingStatus?: "reported_for_current_owner" | "reported_unknown" | "not_reported";
    transferStatus: "not_assumed" | "unknown" | "not_applicable";
  };
  specialAssessment?: {
    districtId?: string;
    districtName?: string;
    purpose?: string;
    recurrence: MarketTaxSpecialAssessmentRecurrence;
    paymentStatus?: string;
  };
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  dataset?: MarketSourceDataset;
  sourceRecordId?: string;
  sourceRecordKey?: string;
  evidenceReference?: SourceEvidenceReference;
  provenance: MarketProviderProvenance[];
  freshnessResultId?: string;
  freshnessState: CanonicalMarketFreshnessState;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  method: MarketTaxObservationMethod;
  limitationCodes: string[];
  degradedStates: MarketTaxDegradedState[];
  explanationCodes: MarketTaxExplanationCode[];
  deterministicHash: string;
  contractVersion: typeof MARKET_TAX_OBSERVATION_CONTRACT_VERSION;
};

export type MarketTaxFinding = {
  findingId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketTaxFindingType;
  sourceObservationIds: string[];
  summaryCode: MarketTaxExplanationCode;
  geography: MarketTaxObservation["geography"];
  period: MarketTaxPeriod;
  impactClass: MarketTaxImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState;
  limitationCodes: string[];
  suggestedVerificationAction: MarketTaxVerificationBoundary;
  applicableStrategyReferences: string[];
  conflictState: MarketTaxConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  professionalConclusionAllowed: false;
  stableOrdinal: number;
  deterministicHash: string;
  contractVersion: typeof MARKET_TAX_FINDING_CONTRACT_VERSION;
};

export type MarketTaxConflictManifest = {
  conflictId: string;
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketTaxConflictState, "none">;
  observationIds: string[];
  retainedObservationIds: string[];
  geography: MarketTaxObservation["geography"];
  periodReferences: MarketTaxPeriod[];
  reasonCodes: MarketTaxExplanationCode[];
  blockedUntilResolved: true;
  deterministicHash: string;
  contractVersion: typeof MARKET_TAX_CONFLICT_CONTRACT_VERSION;
};

export type MarketTaxProjection = {
  findingId: string;
  findingType: MarketTaxFindingType;
  sourceObservationIds: string[];
  geographyLevel: GeographicLevel;
  geographyIdentity: string;
  taxYear?: number;
  assessmentYear?: number;
  impactClass: MarketTaxImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState: CanonicalMarketFreshnessState;
  conflictState: MarketTaxConflictState;
  assumptionProposalReferences: string[];
  underwritingMutationAllowed: false;
  strategyRerankAllowed: false;
  contractVersion: typeof MARKET_TAX_PROJECTION_CONTRACT_VERSION;
  deterministicHash: string;
};

type TaxEntryInput = Omit<MarketTaxRegistryEntry, "contractVersion" | "materialHash">;

export function defineMarketTaxRegistryEntry(input: TaxEntryInput): MarketTaxRegistryEntry {
  const metricId = normalizeId(input.metricId, "Market tax registry entry requires a metric ID.");
  const semanticVersion = requiredClean(input.semanticVersion, "Market tax registry entry requires a semantic version.");
  if (!marketTaxMetricTypes.includes(input.metricType)) throw new Error("Market tax metric type is not registered.");
  if (!marketTaxCategories.includes(input.category)) throw new Error("Market tax category is not registered.");
  if (!marketTaxValueTypes.includes(input.valueType)) throw new Error("Market tax value type is not registered.");
  if (input.lifecycleStatus === "disabled" && !input.replacementMetricId) throw new Error("Disabled market tax entries require a replacement metric reference.");
  const applicableGeographyLevels = uniqueSorted(input.applicableGeographyLevels);
  const requiredPeriodSemantics = uniqueSorted(input.requiredPeriodSemantics);
  if (!applicableGeographyLevels.length) throw new Error("Market tax registry entry requires at least one geography level.");
  if (!requiredPeriodSemantics.length) throw new Error("Market tax registry entry requires period semantics.");
  if (!requiredPeriodSemantics.every(isMarketTaxPeriodSemantic)) throw new Error("Market tax registry entry includes unsupported period semantics.");
  const material = taxEntryMaterial({ ...input, metricId, semanticVersion, applicableGeographyLevels, requiredPeriodSemantics });
  return {
    ...input,
    metricId,
    semanticVersion,
    applicableGeographyLevels,
    requiredPeriodSemantics,
    authorityExpectations: uniqueSorted(input.authorityExpectations),
    permittedProposalKinds: uniqueSorted(input.permittedProposalKinds),
    prohibitedInferenceCodes: uniqueSorted(input.prohibitedInferenceCodes),
    replacementMetricId: clean(input.replacementMetricId),
    replacementMetricVersion: clean(input.replacementMetricVersion),
    registeredAt: requiredClean(input.registeredAt, "Market tax registry entry requires registration time."),
    contractVersion: MARKET_TAX_CONTRACT_VERSION,
    materialHash: `mt_entryh_${stableHash(material).slice(0, 24)}`,
  };
}

export function createMarketTaxRegistry(entries: readonly MarketTaxRegistryEntry[]): MarketTaxRegistry {
  const sorted = [...entries].sort((a, b) => taxEntryKey(a).localeCompare(taxEntryKey(b)));
  const seen = new Set<string>();
  for (const entry of sorted) {
    const key = `${entry.metricId}@${entry.semanticVersion}`;
    if (seen.has(key)) throw new Error(`Duplicate market tax registry entry ${key}.`);
    seen.add(key);
  }
  const material = sorted.map((entry) => ({ metricId: entry.metricId, semanticVersion: entry.semanticVersion, materialHash: entry.materialHash }));
  return {
    registryId: `mt_reg_${stableHash(material).slice(0, 24)}`,
    version: MARKET_TAX_REGISTRY_VERSION,
    entries: sorted,
    materialHash: `mt_regh_${stableHash(material).slice(0, 24)}`,
  };
}

export function selectMarketTaxRegistryEntry(input: {
  registry: MarketTaxRegistry;
  metricId: string;
  semanticVersion?: string;
  allowDeprecated?: boolean;
}): MarketTaxRegistryEntry {
  const metricId = normalizeId(input.metricId, "Market tax selection requires a metric ID.");
  const candidates = input.registry.entries.filter((entry) =>
    entry.metricId === metricId &&
    (input.allowDeprecated ? entry.lifecycleStatus !== "disabled" : entry.lifecycleStatus === "active")
  );
  if (!candidates.length) throw new Error("No active market tax registry entry matches the requested metric.");
  if (input.semanticVersion) {
    const exact = candidates.find((entry) => entry.semanticVersion === input.semanticVersion);
    if (!exact) throw new Error("Requested market tax registry version is not available.");
    return exact;
  }
  return candidates.sort((a, b) => b.semanticVersion.localeCompare(a.semanticVersion))[0];
}

export function createMarketTaxObservation(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  canonicalLocationId?: string;
  entry: MarketTaxRegistryEntry;
  authority: MarketTaxAuthorityReference;
  parcel: MarketTaxParcelReference;
  geography: MarketTaxObservation["geography"];
  period: MarketTaxPeriod;
  value: MarketTaxValue;
  exemption?: MarketTaxObservation["exemption"];
  specialAssessment?: MarketTaxObservation["specialAssessment"];
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
  method: MarketTaxObservationMethod;
  limitationCodes?: readonly string[];
  degradedStates?: readonly MarketTaxDegradedState[];
  explanationCodes?: readonly MarketTaxExplanationCode[];
}): MarketTaxObservation {
  const entry = assertActiveEntry(input.entry);
  if (!entry.requiredPeriodSemantics.includes(input.period.semantics)) throw new Error("Market tax observation period semantics are not supported by the registry entry.");
  if (!entry.applicableGeographyLevels.includes(input.geography.geographyLevel)) throw new Error("Market tax observation geography is not supported by the registry entry.");
  if (!marketTaxObservationMethods.includes(input.method)) throw new Error("Market tax observation method is not registered.");
  assertValueMatchesEntry(input.value, entry);
  assertPeriodIntegrity(input.period);
  const authority = normalizeAuthorityReference(input.authority);
  const parcel = normalizeParcelReference(input.parcel);
  const value = normalizeTaxValue(input.value);
  const period = normalizeTaxPeriod(input.period);
  const degradedStates = uniqueSorted([...(input.degradedStates ?? []), ...degradedStatesFrom(input)]);
  const explanationCodes = uniqueSorted([...(input.explanationCodes ?? []), ...explanationCodesFrom(input, degradedStates)]);
  const degradedFreshnessState = freshnessStateFromDegraded(degradedStates);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market tax observation requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    canonicalLocationId: clean(input.canonicalLocationId),
    metricId: entry.metricId,
    metricVersion: entry.semanticVersion,
    metricType: entry.metricType,
    category: entry.category,
    authority,
    parcel,
    geography: normalizeGeography(input.geography),
    period,
    value,
    exemption: normalizeExemption(input.exemption),
    specialAssessment: normalizeSpecialAssessment(input.specialAssessment),
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    dataset: input.dataset,
    sourceRecordId: clean(input.sourceRecordId),
    sourceRecordKey: clean(input.sourceRecordKey),
    evidenceReference: stableEvidence(input.evidenceReference),
    provenance: stableProvenance(input.provenance ?? []),
    freshnessResultId: clean(input.freshness?.freshnessResultId),
    freshnessState: degradedFreshnessState === "current" ? input.freshness?.freshnessState ?? degradedFreshnessState : degradedFreshnessState,
    verificationState: input.verificationState,
    confidence: input.confidence,
    method: input.method,
    limitationCodes: uniqueSorted([...(input.limitationCodes ?? []), ...entry.prohibitedInferenceCodes]),
    degradedStates,
    explanationCodes,
  };
  const deterministicHash = `mt_obsh_${stableHash(basis).slice(0, 24)}`;
  return {
    ...basis,
    observationId: `mt_obs_${stableHash({
      metricId: basis.metricId,
      propertyId: basis.propertyId,
      canonicalLocationId: basis.canonicalLocationId,
      authorityId: basis.authority.authorityId,
      parcel: basis.parcel,
      period: basis.period,
      value: basis.value,
      sourceRecordId: basis.sourceRecordId,
    }).slice(0, 24)}`,
    contractVersion: MARKET_TAX_OBSERVATION_CONTRACT_VERSION,
    deterministicHash,
  };
}

export function createMarketTaxFinding(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  findingType: MarketTaxFindingType;
  sourceObservations: readonly MarketTaxObservation[];
  summaryCode: MarketTaxExplanationCode;
  impactClass: MarketTaxImpactClass;
  confidence: ProviderConfidence;
  verificationState: LocationVerificationState;
  freshnessState?: CanonicalMarketFreshnessState;
  limitationCodes?: readonly string[];
  suggestedVerificationAction?: MarketTaxVerificationBoundary;
  applicableStrategyReferences?: readonly string[];
  conflictState?: MarketTaxConflictState;
  assumptionProposalReferences?: readonly string[];
  stableOrdinal?: number;
}): MarketTaxFinding {
  if (!marketTaxFindingTypes.includes(input.findingType)) throw new Error("Market tax finding type is not registered.");
  if (!marketTaxExplanationCodes.includes(input.summaryCode)) throw new Error("Market tax finding summary code is not registered.");
  if (!marketTaxImpactClasses.includes(input.impactClass)) throw new Error("Market tax finding impact class is not registered.");
  const observations = stableObservations(input.sourceObservations);
  if (!observations.length) throw new Error("Market tax finding requires at least one source observation.");
  const conflictState = input.conflictState ?? (observations.some((item) => item.degradedStates.includes("conflicting_tax_records")) ? "unresolved" : "none");
  const geography = observations[0].geography;
  const period = observations[0].period;
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market tax finding requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    findingType: input.findingType,
    sourceObservationIds: observations.map((item) => item.observationId),
    summaryCode: input.summaryCode,
    geography,
    period,
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
    findingId: `mt_find_${stableHash({ type: basis.findingType, observations: basis.sourceObservationIds, stableOrdinal: basis.stableOrdinal }).slice(0, 24)}`,
    underwritingMutationAllowed: false,
    strategyRerankAllowed: false,
    professionalConclusionAllowed: false,
    deterministicHash: `mt_findh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_TAX_FINDING_CONTRACT_VERSION,
  };
}

export function createMarketTaxConflictManifest(input: {
  workspaceId: string;
  propertyId?: string;
  dealId?: string;
  conflictState: Exclude<MarketTaxConflictState, "none">;
  observations: readonly MarketTaxObservation[];
  reasonCodes: readonly MarketTaxExplanationCode[];
  retainedObservationIds?: readonly string[];
}): MarketTaxConflictManifest {
  if (!marketTaxConflictStates.includes(input.conflictState)) throw new Error("Market tax conflict state is not registered.");
  const observations = stableObservations(input.observations);
  if (observations.length < 2) throw new Error("Market tax conflict requires at least two observations.");
  const retainedObservationIds = uniqueSorted(input.retainedObservationIds ?? observations.map((item) => item.observationId));
  const reasonCodes = uniqueSorted(input.reasonCodes.length ? input.reasonCodes : ["authority_verification_recommended"]);
  const basis = {
    workspaceId: requiredClean(input.workspaceId, "Market tax conflict requires workspace scope."),
    propertyId: clean(input.propertyId),
    dealId: clean(input.dealId),
    conflictState: input.conflictState,
    observationIds: observations.map((item) => item.observationId),
    retainedObservationIds,
    geography: observations[0].geography,
    periodReferences: observations.map((item) => item.period),
    reasonCodes,
  };
  return {
    ...basis,
    conflictId: `mt_conf_${stableHash(basis).slice(0, 24)}`,
    blockedUntilResolved: true,
    deterministicHash: `mt_confh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_TAX_CONFLICT_CONTRACT_VERSION,
  };
}

export function projectMarketTaxFinding(finding: MarketTaxFinding): MarketTaxProjection {
  const projection = {
    findingId: finding.findingId,
    findingType: finding.findingType,
    sourceObservationIds: finding.sourceObservationIds,
    geographyLevel: finding.geography.geographyLevel,
    geographyIdentity: finding.geography.geographyIdentity,
    taxYear: finding.period.taxYear,
    assessmentYear: finding.period.assessmentYear,
    impactClass: finding.impactClass,
    confidence: finding.confidence,
    verificationState: finding.verificationState,
    freshnessState: finding.freshnessState,
    conflictState: finding.conflictState,
    assumptionProposalReferences: finding.assumptionProposalReferences,
    underwritingMutationAllowed: false as const,
    strategyRerankAllowed: false as const,
    contractVersion: MARKET_TAX_PROJECTION_CONTRACT_VERSION as typeof MARKET_TAX_PROJECTION_CONTRACT_VERSION,
  };
  return {
    ...projection,
    deterministicHash: `mt_projh_${stableHash(projection).slice(0, 24)}`,
  };
}

export function marketTaxDiagnostics(event: "tax_observed" | "tax_finding_created" | "tax_conflict_detected" | "tax_degraded" | "tax_proposal_referenced", input: {
  workspaceId?: string;
  propertyId?: string;
  observationId?: string;
  findingId?: string;
  conflictState?: string;
  freshnessState?: string;
}) {
  return {
    event,
    workspaceScoped: Boolean(clean(input.workspaceId)),
    propertyScoped: Boolean(clean(input.propertyId)),
    observationScoped: Boolean(clean(input.observationId)),
    findingScoped: Boolean(clean(input.findingId)),
    conflictState: clean(input.conflictState),
    freshnessState: clean(input.freshnessState),
  };
}

export function isMarketTaxMetricType(value: string): value is MarketTaxMetricType {
  return marketTaxMetricTypes.includes(value as MarketTaxMetricType);
}

export function isMarketTaxPeriodSemantic(value: string): value is MarketTaxPeriodSemantic {
  return marketTaxPeriodSemantics.includes(value as MarketTaxPeriodSemantic);
}

export function isMarketTaxFindingType(value: string): value is MarketTaxFindingType {
  return marketTaxFindingTypes.includes(value as MarketTaxFindingType);
}

function assertActiveEntry(entry: MarketTaxRegistryEntry) {
  if (entry.lifecycleStatus === "disabled") throw new Error("Disabled market tax registry entries cannot create new observations.");
  return entry;
}

function assertValueMatchesEntry(value: MarketTaxValue, entry: MarketTaxRegistryEntry) {
  if (value.valueType !== entry.valueType) throw new Error("Market tax value type does not match registry entry.");
  if (entry.valueType === "rate" && !value.rateUnit) throw new Error("Market tax rate values require explicit rate unit.");
  if (entry.valueType === "money" && !value.currency) throw new Error("Market tax money values require explicit currency.");
  if (entry.metricType === "effective_tax_rate" && value.rateBasis !== "tax_bill_amount") throw new Error("Effective tax rate must identify its calculated tax-bill basis.");
  if (entry.metricType === "special_assessment" && value.annualized !== false) throw new Error("Special assessment values may not be silently annualized.");
}

function assertPeriodIntegrity(period: MarketTaxPeriod) {
  if (!marketTaxPeriodSemantics.includes(period.semantics)) throw new Error("Market tax period semantics are not registered.");
  if (!period.assessmentYear && !period.taxYear && period.semantics !== "unknown" && !period.effectiveStart && !period.billingPeriodStart && !period.retrievalTime) {
    throw new Error("Market tax period requires explicit assessment year, tax year, billing period, or effective period.");
  }
}

function normalizeTaxPeriod(period: MarketTaxPeriod): MarketTaxPeriod {
  return {
    assessmentYear: normalizeYear(period.assessmentYear),
    taxYear: normalizeYear(period.taxYear),
    billingPeriodStart: clean(period.billingPeriodStart),
    billingPeriodEnd: clean(period.billingPeriodEnd),
    duePeriodStart: clean(period.duePeriodStart),
    duePeriodEnd: clean(period.duePeriodEnd),
    effectiveStart: clean(period.effectiveStart),
    effectiveEnd: clean(period.effectiveEnd),
    publicationDate: clean(period.publicationDate),
    retrievalTime: clean(period.retrievalTime),
    semantics: period.semantics,
    partialYear: Boolean(period.partialYear),
    futurePeriod: Boolean(period.futurePeriod),
  };
}

function normalizeTaxValue(value: MarketTaxValue): MarketTaxValue {
  return {
    rawValue: value.rawValue,
    normalizedValue: value.normalizedValue,
    valueType: value.valueType,
    currency: value.currency,
    unit: clean(value.unit),
    rateUnit: value.rateUnit,
    rateBasis: value.rateBasis,
    annualized: false,
  };
}

function normalizeAuthorityReference(authority: MarketTaxAuthorityReference): MarketTaxAuthorityReference {
  return {
    authorityId: normalizeId(authority.authorityId, "Market tax authority requires authority scope."),
    authorityName: clean(authority.authorityName),
    authorityType: authority.authorityType,
    jurisdiction: clean(authority.jurisdiction),
    jurisdictionLevel: authority.jurisdictionLevel,
    sourceReference: stableEvidence(authority.sourceReference),
  };
}

function normalizeParcelReference(parcel: MarketTaxParcelReference): MarketTaxParcelReference {
  return {
    parcelId: clean(parcel.parcelId),
    assessorId: clean(parcel.assessorId),
    municipalityAccountId: clean(parcel.municipalityAccountId),
    taxDistrictId: clean(parcel.taxDistrictId),
    specialDistrictId: clean(parcel.specialDistrictId),
    authorityId: normalizeId(parcel.authorityId, "Market tax parcel reference requires authority scope."),
    parcelRole: parcel.parcelRole,
    matchState: parcel.matchState,
    sourceReference: stableEvidence(parcel.sourceReference),
  };
}

function normalizeGeography(geography: MarketTaxObservation["geography"]): MarketTaxObservation["geography"] {
  return {
    geographyLevel: geography.geographyLevel,
    geographyIdentity: requiredClean(geography.geographyIdentity, "Market tax geography requires explicit identity."),
    jurisdiction: clean(geography.jurisdiction),
    taxDistrict: clean(geography.taxDistrict),
    boundaryId: clean(geography.boundaryId),
    boundaryVersion: clean(geography.boundaryVersion),
  };
}

function normalizeExemption(exemption: MarketTaxObservation["exemption"]): MarketTaxObservation["exemption"] {
  if (!exemption) return undefined;
  return {
    exemptionType: exemption.exemptionType,
    amount: exemption.amount,
    basis: clean(exemption.basis),
    qualifyingStatus: exemption.qualifyingStatus,
    transferStatus: exemption.transferStatus ?? "unknown",
  };
}

function normalizeSpecialAssessment(specialAssessment: MarketTaxObservation["specialAssessment"]): MarketTaxObservation["specialAssessment"] {
  if (!specialAssessment) return undefined;
  return {
    districtId: clean(specialAssessment.districtId),
    districtName: clean(specialAssessment.districtName),
    purpose: clean(specialAssessment.purpose),
    recurrence: specialAssessment.recurrence,
    paymentStatus: clean(specialAssessment.paymentStatus),
  };
}

function degradedStatesFrom(input: Parameters<typeof createMarketTaxObservation>[0]): MarketTaxDegradedState[] {
  const states: MarketTaxDegradedState[] = [];
  if (input.providerState === "offline" || input.providerState === "maintenance" || input.providerState === "rate_limited" || input.providerState === "authentication_required") states.push("provider_unavailable");
  if (input.providerState === "not_configured" || input.providerState === "disabled" || input.providerState === "unsupported") states.push("record_unavailable");
  if (input.freshness?.priorValidResultId || input.freshness?.priorValidSourceRecordId) states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "stale" || input.freshness?.freshnessState === "expired" || input.freshness?.freshnessState === "historical") states.push("stale_prior_valid");
  if (input.freshness?.freshnessState === "unavailable") states.push("record_unavailable");
  if (input.freshness?.freshnessState === "missing_temporal_metadata") states.push("missing_tax_year");
  if (input.freshness?.freshnessState === "conflicted") states.push("conflicting_tax_records");
  if (input.parcel.matchState === "mismatch") states.push("conflicting_tax_records");
  if (input.parcel.matchState === "unresolved") states.push("parcel_unresolved");
  if (!input.authority.authorityId || input.authority.authorityType === "unknown") states.push("authority_unresolved");
  if (!input.period.taxYear && ["tax_year", "billing_period", "due_period"].includes(input.period.semantics)) states.push("missing_tax_year");
  if (!input.sourceRecordId && !input.evidenceReference && !(input.provenance ?? []).length) states.push("missing_source");
  return states;
}

function explanationCodesFrom(input: Parameters<typeof createMarketTaxObservation>[0], degradedStates: readonly MarketTaxDegradedState[]): MarketTaxExplanationCode[] {
  const codes: MarketTaxExplanationCode[] = ["value_distinction_preserved"];
  const metricType = input.entry.metricType;
  if (input.freshness?.freshnessState === "current") codes.push("tax_record_current");
  if (degradedStates.includes("stale_prior_valid")) codes.push("tax_record_stale");
  if (metricType === "assessed_value") codes.push("assessed_value_changed");
  if (metricType === "taxable_value") codes.push("taxable_value_changed");
  if (metricType === "tax_bill_amount" || metricType === "tax_change") codes.push("tax_bill_changed");
  if (metricType === "exemption" || metricType === "homestead_exemption" || metricType === "senior_or_disabled_exemption") codes.push("exemption_reported");
  if (input.exemption && input.exemption.transferStatus !== "not_applicable") codes.push("exemption_transfer_unknown");
  if (metricType === "special_assessment") codes.push("special_assessment_reported");
  if (metricType === "special_district_charge" || metricType === "tax_district") codes.push("special_district_reported");
  if (degradedStates.includes("conflicting_tax_records")) codes.push("parcel_identity_conflict");
  if (degradedStates.includes("provider_unavailable") && degradedStates.includes("stale_prior_valid")) codes.push("provider_unavailable_prior_valid_retained");
  if (degradedStates.includes("missing_tax_year")) codes.push("tax_year_missing");
  if (input.entry.professionalBoundary !== "none") codes.push("authority_verification_recommended");
  return codes;
}

function suggestedActionFor(findingType: MarketTaxFindingType, conflictState: MarketTaxConflictState): MarketTaxVerificationBoundary {
  if (conflictState !== "none") return "assessor_or_collector_confirmation";
  if (findingType === "exemption_transfer_unknown") return "tax_professional_review";
  if (findingType === "special_assessment_reported" || findingType === "special_district_reported") return "attorney_or_title_review";
  if (findingType === "latest_tax_record_unavailable" || findingType === "tax_year_missing") return "county_or_municipal_verification";
  return "county_or_municipal_verification";
}

function freshnessStateFromDegraded(degradedStates: readonly MarketTaxDegradedState[]): CanonicalMarketFreshnessState {
  if (degradedStates.includes("conflicting_tax_records")) return "conflicted";
  if (degradedStates.includes("missing_tax_year") || degradedStates.includes("missing_source")) return "missing_temporal_metadata";
  if (degradedStates.includes("record_unavailable") || degradedStates.includes("provider_unavailable")) return "unavailable";
  if (degradedStates.includes("stale_prior_valid")) return "stale";
  return "current";
}

function worstFreshness(observations: readonly MarketTaxObservation[]): CanonicalMarketFreshnessState {
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

function stableObservations(input: readonly MarketTaxObservation[]) {
  return [...input].sort((a, b) => a.observationId.localeCompare(b.observationId));
}

function taxEntryMaterial(input: TaxEntryInput) {
  const { registeredAt: _registeredAt, ...material } = input;
  return material;
}

function taxEntryKey(entry: MarketTaxRegistryEntry) {
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

function normalizeYear(value?: number) {
  if (value === undefined) return undefined;
  const year = Math.trunc(value);
  if (year < 1800 || year > 2200) throw new Error("Market tax year is outside the supported range.");
  return year;
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

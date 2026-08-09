import type { GeographicLevel, LocationFreshnessState, SourceEvidenceReference } from "./locationIdentity";
import type { ProviderCapability, ProviderConfidence, ProviderNormalizedSourceRecord, ProviderState } from "./providerAdapters";
import type {
  MarketIngestionResult,
  MarketProviderProvenance,
  MarketSourceDataset,
  MarketSourceFreshness,
  MarketSourceModule,
} from "./marketSourceIngestion";

export const MARKET_FRESHNESS_CONTRACT_VERSION = "market-freshness-v1";
export const MARKET_FRESHNESS_POLICY_VERSION = "market-freshness-policy-v1";
export const CANONICAL_MARKET_FRESHNESS_CONTRACT_VERSION = "canonical-market-freshness-v1";
export const CANONICAL_MARKET_FRESHNESS_POLICY_VERSION = "canonical-market-freshness-policy-v1";
export const CANONICAL_MARKET_FRESHNESS_REGISTRY_VERSION = "canonical-market-freshness-registry-v1";

export const canonicalMarketDatasetCategories = [
  "hazard",
  "tax",
  "assessment",
  "infrastructure",
  "liquidity",
  "growth",
  "convenience",
  "demographic",
  "local_risk_input",
  "market_observation",
  "boundary",
  "authority_record",
] as const;

export const canonicalMarketFreshnessStates = [
  "current",
  "current_with_age_warning",
  "review_due",
  "stale",
  "expired",
  "future_effective",
  "historical",
  "superseded",
  "unavailable",
  "missing_temporal_metadata",
  "conflicted",
  "not_applicable",
] as const;

export const canonicalMarketRefreshEligibilityStates = [
  "refresh_supported",
  "refresh_not_supported",
  "refresh_not_needed",
  "refresh_due",
  "refresh_blocked",
  "provider_unavailable",
  "permission_restricted",
  "manual_only",
] as const;

export const canonicalMarketFreshnessExplanationCodes = [
  "within_policy_window",
  "nearing_review_threshold",
  "review_threshold_reached",
  "beyond_stale_threshold",
  "expiration_threshold_reached",
  "effective_period_ended",
  "future_effective_record",
  "historical_record_retained",
  "provider_failed_prior_valid_retained",
  "provider_unavailable_no_prior_valid",
  "temporal_metadata_missing",
  "boundary_version_superseded",
  "source_conflict",
  "not_applicable_to_dataset",
  "refresh_not_supported",
  "refresh_not_needed",
  "refresh_due",
  "refresh_blocked",
  "permission_required",
  "manual_review_required",
] as const;

export const marketFreshnessExplanationTemplates: Record<CanonicalMarketFreshnessExplanationCode, {
  guided: string;
  professional: string;
}> = {
  within_policy_window: {
    guided: "The source timing fits the approved freshness policy.",
    professional: "Temporal metadata is inside the registered policy window for this dataset and geography.",
  },
  nearing_review_threshold: {
    guided: "The source is still usable, but it is getting close to review age.",
    professional: "The source age has reached the policy warning threshold without crossing the review threshold.",
  },
  review_threshold_reached: {
    guided: "Review this source before relying on it heavily.",
    professional: "The source age has crossed the policy review threshold but has not crossed the stale threshold.",
  },
  beyond_stale_threshold: {
    guided: "The source is stale for this dataset.",
    professional: "The source age exceeds the registered stale threshold for this dataset and geography.",
  },
  expiration_threshold_reached: {
    guided: "The source is past the policy expiration threshold.",
    professional: "The source age exceeds the registered expiration threshold or explicit expiration date.",
  },
  effective_period_ended: {
    guided: "The period this source applies to has ended.",
    professional: "The effective period ended before the evaluation time under the registered effective-period behavior.",
  },
  future_effective_record: {
    guided: "This source applies in the future, not yet.",
    professional: "The effective start is after the evaluation time and is retained as a future-effective record.",
  },
  historical_record_retained: {
    guided: "This is useful as history, not current market context.",
    professional: "The policy classifies this record as historical and reproducible for past-context review.",
  },
  provider_failed_prior_valid_retained: {
    guided: "The latest refresh failed, so BRIX kept the prior valid source instead of deleting it.",
    professional: "Provider failure is recorded separately while the prior valid source remains available with unchanged observation time.",
  },
  provider_unavailable_no_prior_valid: {
    guided: "The source is unavailable and no prior valid value is available.",
    professional: "Provider or module unavailability produced no current or prior valid source record for this scope.",
  },
  temporal_metadata_missing: {
    guided: "BRIX cannot confirm freshness because timing metadata is missing.",
    professional: "A required observation, effective, publication, or retrieval timestamp is absent under the registered policy.",
  },
  boundary_version_superseded: {
    guided: "The geography boundary changed, so this source needs review.",
    professional: "A material geography boundary version changed or was superseded for this result.",
  },
  source_conflict: {
    guided: "Sources disagree and freshness is blocked until the conflict is resolved.",
    professional: "Conflicting source records remain explicit and prevent a current freshness classification.",
  },
  not_applicable_to_dataset: {
    guided: "Freshness does not apply to this dataset.",
    professional: "The registered policy marks this source category as not applicable for freshness evaluation.",
  },
  refresh_not_supported: {
    guided: "This source cannot be refreshed automatically.",
    professional: "No complete refresh workflow or provider capability is registered for this dataset scope.",
  },
  refresh_not_needed: {
    guided: "No refresh is needed right now.",
    professional: "The freshness state does not require refresh under the registered policy.",
  },
  refresh_due: {
    guided: "A refresh is due if an authorized source is available.",
    professional: "The freshness state is review due, stale, expired, missing metadata, or conflicted and refresh is supported.",
  },
  refresh_blocked: {
    guided: "A refresh is blocked until missing requirements are resolved.",
    professional: "Refresh metadata indicates a blocking capability, permission, provider, or workflow condition.",
  },
  permission_required: {
    guided: "Additional permission is required before refresh.",
    professional: "Refresh requires a permission or entitlement not present in the request context.",
  },
  manual_review_required: {
    guided: "Manual review is required before relying on this source.",
    professional: "The policy or result state requires manual review while preserving original source evidence.",
  },
};

export const marketFreshnessReasons = [
  "explicit_expiration",
  "stale_after_policy",
  "historical_period",
  "superseded_result",
  "missing_retrieval_time",
  "missing_effective_time",
  "missing_observation_time",
  "provider_marked_stale",
  "provider_marked_unknown",
  "within_policy_window",
  "manual_evidence_required",
] as const;

export type MarketFreshnessReason = typeof marketFreshnessReasons[number];
export type CanonicalMarketDatasetCategory = typeof canonicalMarketDatasetCategories[number];
export type CanonicalMarketFreshnessState = typeof canonicalMarketFreshnessStates[number];
export type CanonicalMarketRefreshEligibilityState = typeof canonicalMarketRefreshEligibilityStates[number];
export type CanonicalMarketFreshnessExplanationCode = typeof canonicalMarketFreshnessExplanationCodes[number];
export type MarketFreshnessPolicyLifecycleStatus = "active" | "deprecated" | "disabled";
export type MarketFreshnessTimeSemantics = "instant" | "date" | "month" | "year" | "period";
export type MarketFreshnessAgeBasis = "observation_time" | "effective_start" | "effective_end" | "publication_time" | "retrieval_time";
export type MarketFreshnessFutureBehavior = "future_effective" | "missing_temporal_metadata" | "not_applicable";
export type MarketFreshnessMissingTimestampBehavior = "missing_temporal_metadata" | "manual_review" | "not_applicable";
export type MarketFreshnessEffectivePeriodBehavior = "retains_until_effective_end" | "expires_after_effective_end" | "historical_after_effective_end";
export type MarketFreshnessProviderFailureBehavior = "retain_prior_valid" | "unavailable_without_prior" | "manual_review";
export type MarketFreshnessHistoricalBehavior = "historical_allowed" | "manual_review" | "expired";
export type MarketFreshnessProviderFailureKind =
  | "provider_unavailable"
  | "record_retrieval_failed"
  | "refresh_failed"
  | "provider_disabled"
  | "provider_deprecated"
  | "provider_licensing_unavailable"
  | "module_not_implemented"
  | "missing_capability";

export type CanonicalMarketFreshnessPolicy = {
  policyId: string;
  semanticVersion: string;
  lifecycleStatus: MarketFreshnessPolicyLifecycleStatus;
  datasetCategory: CanonicalMarketDatasetCategory;
  dataset?: MarketSourceDataset;
  module?: MarketSourceModule;
  geographyLevel: GeographicLevel;
  providerScope?: string;
  authorityScope?: string;
  expectedCadence?: "real_time" | "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "irregular" | "provider_declared" | "unknown";
  maxAcceptedAgeDays?: number;
  warningAfterDays?: number;
  reviewAfterDays?: number;
  staleAfterDays?: number;
  expirationAfterDays?: number;
  historicalAfterDays?: number;
  ageBasis: MarketFreshnessAgeBasis;
  effectivePeriodBehavior: MarketFreshnessEffectivePeriodBehavior;
  futureDatedDataBehavior: MarketFreshnessFutureBehavior;
  missingTimestampBehavior: MarketFreshnessMissingTimestampBehavior;
  providerFailureBehavior: MarketFreshnessProviderFailureBehavior;
  historicalRecordBehavior: MarketFreshnessHistoricalBehavior;
  refreshEligibility: CanonicalMarketRefreshEligibilityState;
  refreshWorkflowAvailable: boolean;
  requiredPermission?: string;
  providerCapability?: ProviderCapability;
  manualReviewRequired: boolean;
  replacementPolicyId?: string;
  replacementPolicyVersion?: string;
  registeredAt: string;
  contractVersion: typeof CANONICAL_MARKET_FRESHNESS_POLICY_VERSION;
  materialHash: string;
};

export type CanonicalMarketFreshnessPolicyRegistry = {
  registryId: string;
  version: typeof CANONICAL_MARKET_FRESHNESS_REGISTRY_VERSION;
  policies: CanonicalMarketFreshnessPolicy[];
  materialHash: string;
};

export type CanonicalMarketFreshnessInput = {
  policy: CanonicalMarketFreshnessPolicy;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  providerFailure?: MarketFreshnessProviderFailureKind;
  datasetId: string;
  dataset?: MarketSourceDataset;
  datasetCategory: CanonicalMarketDatasetCategory;
  module?: MarketSourceModule;
  sourceRecordId?: string;
  evidenceReference?: SourceEvidenceReference;
  canonicalLocationId?: string;
  geographyLevel: GeographicLevel;
  geographyIdentity?: string;
  boundaryVersion?: string;
  supersededBoundaryVersion?: string;
  observationTime?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  publicationTime?: string;
  retrievalTime?: string;
  evaluationTime: string;
  timeSemantics: MarketFreshnessTimeSemantics;
  timezone?: string;
  verificationState: "verified" | "source_backed" | "corroborated" | "estimated" | "user_entered" | "missing" | "unknown";
  sourceConfidence: ProviderConfidence;
  providerPublishedCadence?: CanonicalMarketFreshnessPolicy["expectedCadence"];
  providerDeclaredFreshnessState?: string;
  sourceConflict?: boolean;
  notApplicable?: boolean;
  priorValidResultId?: string;
  priorValidSourceRecordId?: string;
  replacementSourceRecordId?: string;
  supersededByResultId?: string;
  refreshSupported?: boolean;
  refreshBlocked?: boolean;
  permissionAvailable?: boolean;
  earliestRefreshTime?: string;
  requiredPermission?: string;
  providerCapability?: ProviderCapability;
};

export type CanonicalMarketFreshnessResult = {
  freshnessResultId: string;
  policyId: string;
  policyVersion: string;
  providerId?: string;
  providerVersion?: string;
  providerState?: ProviderState;
  datasetId: string;
  dataset?: MarketSourceDataset;
  datasetCategory: CanonicalMarketDatasetCategory;
  sourceRecordId?: string;
  evidenceReference?: SourceEvidenceReference;
  canonicalLocationId?: string;
  geographyLevel: GeographicLevel;
  geographyIdentity?: string;
  boundaryVersion?: string;
  observationTime?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  publicationTime?: string;
  retrievalTime?: string;
  evaluationAsOf: string;
  timeSemantics: MarketFreshnessTimeSemantics;
  timezone?: string;
  ageBasis: MarketFreshnessAgeBasis;
  calculatedAgeDays?: number;
  freshnessState: CanonicalMarketFreshnessState;
  staleReasons: CanonicalMarketFreshnessExplanationCode[];
  thresholdReferences: {
    warningAfterDays?: number;
    reviewAfterDays?: number;
    staleAfterDays?: number;
    expirationAfterDays?: number;
    historicalAfterDays?: number;
    expectedCadence?: CanonicalMarketFreshnessPolicy["expectedCadence"];
  };
  verificationState: CanonicalMarketFreshnessInput["verificationState"];
  sourceConfidence: ProviderConfidence;
  refreshEligibility: {
    state: CanonicalMarketRefreshEligibilityState;
    reason: CanonicalMarketFreshnessExplanationCode;
    governingProvider?: string;
    datasetId: string;
    earliestRefreshTime?: string;
    requiredPermission?: string;
    providerCapability?: ProviderCapability;
    workflowReference?: string;
  };
  priorValidResultId?: string;
  priorValidSourceRecordId?: string;
  replacementSourceRecordId?: string;
  supersededByResultId?: string;
  manualReviewRequired: boolean;
  explanationCodes: CanonicalMarketFreshnessExplanationCode[];
  contractVersion: typeof CANONICAL_MARKET_FRESHNESS_CONTRACT_VERSION;
  materialHash: string;
};

export function defineCanonicalMarketFreshnessPolicy(
  input: Omit<CanonicalMarketFreshnessPolicy, "contractVersion" | "materialHash">,
): CanonicalMarketFreshnessPolicy {
  const policyId = requiredClean(input.policyId, "Canonical freshness policy requires a policy ID.");
  const semanticVersion = requiredClean(input.semanticVersion, "Canonical freshness policy requires a semantic version.");
  if (!canonicalMarketDatasetCategories.includes(input.datasetCategory)) throw new Error("Canonical freshness policy dataset category is not registered.");
  if (input.lifecycleStatus === "disabled" && !input.replacementPolicyId) throw new Error("Disabled freshness policies require a replacement policy reference.");
  assertThresholds(input);
  const material = canonicalPolicyMaterial({ ...input, policyId, semanticVersion });
  return {
    ...input,
    policyId,
    semanticVersion,
    contractVersion: CANONICAL_MARKET_FRESHNESS_POLICY_VERSION,
    materialHash: `cmfp_${stableHash(material).slice(0, 24)}`,
  };
}

export function createCanonicalMarketFreshnessPolicyRegistry(
  policies: readonly CanonicalMarketFreshnessPolicy[],
): CanonicalMarketFreshnessPolicyRegistry {
  const sorted = [...policies].sort((a, b) => registryPolicyKey(a).localeCompare(registryPolicyKey(b)));
  const seen = new Set<string>();
  for (const policy of sorted) {
    const key = `${policy.policyId}@${policy.semanticVersion}`;
    if (seen.has(key)) throw new Error(`Duplicate canonical freshness policy ${key}.`);
    seen.add(key);
  }
  const material = sorted.map((policy) => ({ policyId: policy.policyId, semanticVersion: policy.semanticVersion, materialHash: policy.materialHash }));
  return {
    registryId: `cmfr_${stableHash(material).slice(0, 24)}`,
    version: CANONICAL_MARKET_FRESHNESS_REGISTRY_VERSION,
    policies: sorted,
    materialHash: `cmfrh_${stableHash(material).slice(0, 24)}`,
  };
}

export function selectCanonicalMarketFreshnessPolicy(input: {
  registry: CanonicalMarketFreshnessPolicyRegistry;
  datasetCategory: CanonicalMarketDatasetCategory;
  geographyLevel: GeographicLevel;
  providerId?: string;
  dataset?: MarketSourceDataset;
  module?: MarketSourceModule;
  asOfVersion?: string;
  allowDeprecated?: boolean;
}): CanonicalMarketFreshnessPolicy {
  const candidates = input.registry.policies.filter((policy) =>
    policy.datasetCategory === input.datasetCategory &&
    policy.geographyLevel === input.geographyLevel &&
    (!policy.providerScope || policy.providerScope === clean(input.providerId)) &&
    (!policy.dataset || policy.dataset === input.dataset) &&
    (!policy.module || policy.module === input.module) &&
    (input.allowDeprecated ? policy.lifecycleStatus !== "disabled" : policy.lifecycleStatus === "active")
  );
  if (!candidates.length) throw new Error("No canonical freshness policy matches the requested dataset and geography scope.");
  if (input.asOfVersion) {
    const exact = candidates.find((policy) => policy.semanticVersion === input.asOfVersion);
    if (!exact) throw new Error("Requested canonical freshness policy version is not registered for this scope.");
    return exact;
  }
  return candidates.sort((a, b) => b.semanticVersion.localeCompare(a.semanticVersion))[0];
}

export function evaluateCanonicalMarketFreshness(input: CanonicalMarketFreshnessInput): CanonicalMarketFreshnessResult {
  validateCanonicalFreshnessInput(input);
  const policy = input.policy;
  const evaluationAsOf = requiredClean(input.evaluationTime, "Canonical freshness evaluation requires server-authoritative evaluation time.");
  const temporalBasis = resolveAgeBasisTime(input, policy.ageBasis);
  const calculatedAgeDays = temporalBasis ? differenceDaysWithSemantics(evaluationAsOf, temporalBasis, input.timeSemantics) : undefined;
  const stateAndReasons = resolveCanonicalState(input, calculatedAgeDays);
  const refreshEligibility = resolveRefreshEligibility(input, stateAndReasons.state, stateAndReasons.explanationCodes);
  const explanationCodes = uniqueSorted([...stateAndReasons.explanationCodes, refreshEligibility.reason]);
  const manualReviewRequired = policy.manualReviewRequired ||
    stateAndReasons.manualReviewRequired ||
    refreshEligibility.state === "manual_only" ||
    explanationCodes.includes("manual_review_required");
  const material = {
    policyId: policy.policyId,
    policyVersion: policy.semanticVersion,
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    datasetId: requiredClean(input.datasetId, "Canonical freshness result requires dataset identity."),
    dataset: input.dataset,
    datasetCategory: input.datasetCategory,
    sourceRecordId: clean(input.sourceRecordId),
    canonicalLocationId: clean(input.canonicalLocationId),
    geographyLevel: input.geographyLevel,
    geographyIdentity: clean(input.geographyIdentity),
    boundaryVersion: clean(input.boundaryVersion),
    observationTime: normalizeTemporal(input.observationTime, input.timeSemantics),
    effectiveStart: normalizeTemporal(input.effectiveStart, input.timeSemantics),
    effectiveEnd: normalizeTemporal(input.effectiveEnd, input.timeSemantics),
    publicationTime: normalizeTemporal(input.publicationTime, input.timeSemantics),
    retrievalTime: normalizeTemporal(input.retrievalTime, input.timeSemantics),
    evaluationAsOf,
    timeSemantics: input.timeSemantics,
    timezone: clean(input.timezone),
    ageBasis: policy.ageBasis,
    calculatedAgeDays,
    freshnessState: stateAndReasons.state,
    staleReasons: stateAndReasons.explanationCodes,
    verificationState: input.verificationState,
    sourceConfidence: input.sourceConfidence,
    refreshEligibilityState: refreshEligibility.state,
    priorValidResultId: clean(input.priorValidResultId),
    priorValidSourceRecordId: clean(input.priorValidSourceRecordId),
    replacementSourceRecordId: clean(input.replacementSourceRecordId),
    supersededByResultId: clean(input.supersededByResultId),
    manualReviewRequired,
  };
  const materialHash = `cmfr_${stableHash(material).slice(0, 24)}`;
  return {
    freshnessResultId: `cmfres_${stableHash({ materialHash, contractVersion: CANONICAL_MARKET_FRESHNESS_CONTRACT_VERSION }).slice(0, 24)}`,
    policyId: policy.policyId,
    policyVersion: policy.semanticVersion,
    providerId: clean(input.providerId),
    providerVersion: clean(input.providerVersion),
    providerState: input.providerState,
    datasetId: material.datasetId,
    dataset: input.dataset,
    datasetCategory: input.datasetCategory,
    sourceRecordId: clean(input.sourceRecordId),
    evidenceReference: input.evidenceReference,
    canonicalLocationId: clean(input.canonicalLocationId),
    geographyLevel: input.geographyLevel,
    geographyIdentity: clean(input.geographyIdentity),
    boundaryVersion: clean(input.boundaryVersion),
    observationTime: material.observationTime,
    effectiveStart: material.effectiveStart,
    effectiveEnd: material.effectiveEnd,
    publicationTime: material.publicationTime,
    retrievalTime: material.retrievalTime,
    evaluationAsOf,
    timeSemantics: input.timeSemantics,
    timezone: clean(input.timezone),
    ageBasis: policy.ageBasis,
    calculatedAgeDays,
    freshnessState: stateAndReasons.state,
    staleReasons: stateAndReasons.explanationCodes,
    thresholdReferences: {
      warningAfterDays: policy.warningAfterDays,
      reviewAfterDays: policy.reviewAfterDays,
      staleAfterDays: policy.staleAfterDays,
      expirationAfterDays: policy.expirationAfterDays,
      historicalAfterDays: policy.historicalAfterDays,
      expectedCadence: input.providerPublishedCadence ?? policy.expectedCadence,
    },
    verificationState: input.verificationState,
    sourceConfidence: input.sourceConfidence,
    refreshEligibility,
    priorValidResultId: clean(input.priorValidResultId),
    priorValidSourceRecordId: clean(input.priorValidSourceRecordId),
    replacementSourceRecordId: clean(input.replacementSourceRecordId),
    supersededByResultId: clean(input.supersededByResultId),
    manualReviewRequired,
    explanationCodes,
    contractVersion: CANONICAL_MARKET_FRESHNESS_CONTRACT_VERSION,
    materialHash,
  };
}

export type MarketFreshnessPolicy = {
  policyId: string;
  dataset: MarketSourceDataset;
  module: MarketSourceModule;
  geographyLevel: GeographicLevel;
  maxAgeDays: number;
  historicalAfterDays?: number;
  requiresObservationTime: boolean;
  requiresEffectiveTime: boolean;
  requiresRetrievalTime: boolean;
  sourceUse: "current_context" | "historical_context" | "manual_evidence" | "provider_declaration";
  contractVersion: typeof MARKET_FRESHNESS_POLICY_VERSION;
  deterministicHash: string;
};

export type MarketFreshnessInput = {
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  locationId?: string;
  dataset: MarketSourceDataset;
  module: MarketSourceModule;
  geographyLevel: GeographicLevel;
  evaluatedAt: string;
  method: string;
  confidence: ProviderConfidence;
  freshness: MarketSourceFreshness;
  policy: MarketFreshnessPolicy;
  provenance: readonly MarketProviderProvenance[];
  sourceRecords?: readonly ProviderNormalizedSourceRecord[];
  supersededByResultId?: string;
  priorValidResultId?: string;
};

export type MarketFreshnessAssessment = {
  assessmentId: string;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  locationId?: string;
  dataset: MarketSourceDataset;
  module: MarketSourceModule;
  geographyLevel: GeographicLevel;
  evaluatedAt: string;
  method: string;
  confidence: ProviderConfidence;
  state: LocationFreshnessState;
  ageDays?: number;
  staleAfterDays: number;
  expiresAt?: string;
  observedAt?: string;
  effectiveAt?: string;
  retrievedAt?: string;
  supersededByResultId?: string;
  priorValidResultId?: string;
  reasons: MarketFreshnessReason[];
  limitations: string[];
  provenance: MarketProviderProvenance[];
  evidenceReferences: SourceEvidenceReference[];
  sourceRecordKeys: string[];
  deterministicHash: string;
  contractVersion: typeof MARKET_FRESHNESS_CONTRACT_VERSION;
};

export type MarketFreshnessRollup = {
  rollupId: string;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  locationId?: string;
  evaluatedAt: string;
  state: LocationFreshnessState;
  assessments: MarketFreshnessAssessment[];
  staleCount: number;
  unknownCount: number;
  currentCount: number;
  historicalCount: number;
  supersededCount: number;
  limitations: string[];
  deterministicHash: string;
  contractVersion: typeof MARKET_FRESHNESS_CONTRACT_VERSION;
};

export function buildMarketFreshnessPolicy(input: Omit<MarketFreshnessPolicy, "policyId" | "contractVersion" | "deterministicHash">): MarketFreshnessPolicy {
  const dataset = requiredClean(input.dataset, "Market freshness policy requires a dataset.") as MarketSourceDataset;
  const module = requiredClean(input.module, "Market freshness policy requires a module.") as MarketSourceModule;
  const geographyLevel = requiredClean(input.geographyLevel, "Market freshness policy requires geography.") as GeographicLevel;
  const maxAgeDays = Math.max(0, Math.trunc(input.maxAgeDays));
  const basis = {
    dataset,
    module,
    geographyLevel,
    maxAgeDays,
    historicalAfterDays: input.historicalAfterDays,
    requiresObservationTime: input.requiresObservationTime,
    requiresEffectiveTime: input.requiresEffectiveTime,
    requiresRetrievalTime: input.requiresRetrievalTime,
    sourceUse: input.sourceUse,
  };
  return {
    ...basis,
    policyId: `mf_policy_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_FRESHNESS_POLICY_VERSION,
    deterministicHash: `mf_policyh_${stableHash(basis).slice(0, 24)}`,
  };
}

export function assessMarketFreshness(input: MarketFreshnessInput): MarketFreshnessAssessment {
  assertPolicyMatches(input);
  const workspaceId = requiredClean(input.workspaceId, "Market freshness assessment requires workspace scope.");
  const evaluatedAt = requiredClean(input.evaluatedAt, "Market freshness assessment requires evaluation time.");
  const retrievedAt = clean(input.freshness.retrievedAt) ?? latestProvenanceTime(input.provenance, "retrievalTime");
  const effectiveAt = clean(input.freshness.effectiveAt) ?? latestProvenanceTime(input.provenance, "effectiveTime");
  const observedAt = clean(input.freshness.observedAt) ?? latestProvenanceTime(input.provenance, "observationTime");
  const expiresAt = clean(input.freshness.expiresAt) ?? expirationFrom(retrievedAt, input.freshness.staleAfterDays ?? input.policy.maxAgeDays);
  const reasons: MarketFreshnessReason[] = [];
  const limitations: string[] = [];

  if (input.supersededByResultId) reasons.push("superseded_result");
  if (input.freshness.state === "stale") reasons.push("provider_marked_stale");
  if (input.freshness.state === "unknown") reasons.push("provider_marked_unknown");
  if (input.policy.requiresRetrievalTime && !retrievedAt) reasons.push("missing_retrieval_time");
  if (input.policy.requiresEffectiveTime && !effectiveAt) reasons.push("missing_effective_time");
  if (input.policy.requiresObservationTime && !observedAt) reasons.push("missing_observation_time");

  const ageDays = retrievedAt ? differenceDays(evaluatedAt, retrievedAt) : undefined;
  if (expiresAt && compareIso(evaluatedAt, expiresAt) > 0) reasons.push("explicit_expiration");
  if (ageDays !== undefined && ageDays > input.policy.maxAgeDays) reasons.push("stale_after_policy");
  if (ageDays !== undefined && input.policy.historicalAfterDays !== undefined && ageDays > input.policy.historicalAfterDays) reasons.push("historical_period");
  if (!reasons.length) reasons.push("within_policy_window");

  const state = freshnessStateFromReasons(reasons, input.freshness.state);
  if (state === "unknown") limitations.push("Freshness cannot be confirmed because required timing metadata is missing.");
  if (state === "stale") limitations.push("Source context is stale for this dataset and should be refreshed or manually verified before relying on it.");
  if (state === "historical") limitations.push("Source context is historical and may explain past conditions but should not be treated as current.");
  if (state === "superseded") limitations.push("Source context has been superseded by a later result and is retained for history only.");
  if (input.policy.sourceUse === "manual_evidence") limitations.push("Manual evidence can support review but should remain clearly labeled until verified.");

  const sourceRecords = stableSourceRecordKeys(input.sourceRecords ?? []);
  const provenance = stableProvenance(input.provenance);
  const evidenceReferences = stableEvidenceReferences(provenance.map((item) => item.evidenceReference).filter((item): item is SourceEvidenceReference => Boolean(item)));
  const basis = {
    workspaceId,
    dealId: clean(input.dealId),
    propertyId: clean(input.propertyId),
    locationId: clean(input.locationId),
    dataset: input.dataset,
    module: input.module,
    geographyLevel: input.geographyLevel,
    evaluatedAt,
    method: requiredClean(input.method, "Market freshness assessment requires method."),
    confidence: input.confidence,
    state,
    ageDays,
    staleAfterDays: input.freshness.staleAfterDays ?? input.policy.maxAgeDays,
    expiresAt,
    observedAt,
    effectiveAt,
    retrievedAt,
    supersededByResultId: clean(input.supersededByResultId),
    priorValidResultId: clean(input.priorValidResultId),
    reasons: uniqueSorted(reasons),
    provenanceRefs: provenance.map((item) => `${item.providerId}:${item.providerRecordReference}:${item.retrievalTime}`),
    sourceRecords,
  };

  return {
    ...basis,
    assessmentId: `mf_assess_${stableHash(basis).slice(0, 24)}`,
    reasons: basis.reasons,
    limitations: uniqueSorted(limitations),
    provenance,
    evidenceReferences,
    sourceRecordKeys: sourceRecords,
    deterministicHash: `mf_assessh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_FRESHNESS_CONTRACT_VERSION,
  };
}

export function assessMarketFreshnessFromResult(input: {
  result: MarketIngestionResult;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  locationId?: string;
  dataset: MarketSourceDataset;
  module: MarketSourceModule;
  geographyLevel: GeographicLevel;
  evaluatedAt: string;
  method: string;
  policy: MarketFreshnessPolicy;
  supersededByResultId?: string;
  priorValidResultId?: string;
}): MarketFreshnessAssessment {
  return assessMarketFreshness({
    workspaceId: input.workspaceId,
    dealId: input.dealId,
    propertyId: input.propertyId,
    locationId: input.locationId,
    dataset: input.dataset,
    module: input.module,
    geographyLevel: input.geographyLevel,
    evaluatedAt: input.evaluatedAt,
    method: input.method,
    confidence: input.result.provenance[0]?.confidence ?? "unknown",
    freshness: input.result.freshness,
    policy: input.policy,
    provenance: input.result.provenance,
    sourceRecords: input.result.normalizedSourceRecords,
    supersededByResultId: input.supersededByResultId,
    priorValidResultId: input.priorValidResultId,
  });
}

export function rollupMarketFreshness(input: {
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  locationId?: string;
  evaluatedAt: string;
  assessments: readonly MarketFreshnessAssessment[];
}): MarketFreshnessRollup {
  const workspaceId = requiredClean(input.workspaceId, "Market freshness rollup requires workspace scope.");
  const evaluatedAt = requiredClean(input.evaluatedAt, "Market freshness rollup requires evaluation time.");
  const assessments = input.assessments
    .filter((assessment) => assessment.workspaceId === workspaceId)
    .slice()
    .sort((a, b) => assessmentOrderingKey(a).localeCompare(assessmentOrderingKey(b)));
  const state = rollupState(assessments);
  const limitations = uniqueSorted(assessments.flatMap((assessment) => assessment.limitations));
  const basis = {
    workspaceId,
    dealId: clean(input.dealId),
    propertyId: clean(input.propertyId),
    locationId: clean(input.locationId),
    evaluatedAt,
    assessmentHashes: assessments.map((assessment) => assessment.deterministicHash),
    state,
  };
  return {
    rollupId: `mf_rollup_${stableHash(basis).slice(0, 24)}`,
    workspaceId,
    dealId: clean(input.dealId),
    propertyId: clean(input.propertyId),
    locationId: clean(input.locationId),
    evaluatedAt,
    state,
    assessments,
    staleCount: assessments.filter((assessment) => assessment.state === "stale").length,
    unknownCount: assessments.filter((assessment) => assessment.state === "unknown").length,
    currentCount: assessments.filter((assessment) => assessment.state === "current").length,
    historicalCount: assessments.filter((assessment) => assessment.state === "historical").length,
    supersededCount: assessments.filter((assessment) => assessment.state === "superseded").length,
    limitations,
    deterministicHash: `mf_rolluph_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_FRESHNESS_CONTRACT_VERSION,
  };
}

export function marketFreshnessDiagnostics(event: "freshness_assessed" | "freshness_stale" | "freshness_unknown" | "freshness_superseded" | "freshness_rollup", input: {
  workspaceId?: string;
  assessmentId?: string;
  dataset?: string;
  state?: string;
}) {
  return {
    event,
    workspaceScoped: Boolean(clean(input.workspaceId)),
    assessmentScoped: Boolean(clean(input.assessmentId)),
    dataset: clean(input.dataset),
    state: clean(input.state),
  };
}

function assertThresholds(input: Pick<CanonicalMarketFreshnessPolicy, "warningAfterDays" | "reviewAfterDays" | "staleAfterDays" | "expirationAfterDays" | "historicalAfterDays" | "maxAcceptedAgeDays">) {
  const ordered = [
    ["warningAfterDays", input.warningAfterDays],
    ["reviewAfterDays", input.reviewAfterDays],
    ["staleAfterDays", input.staleAfterDays],
    ["expirationAfterDays", input.expirationAfterDays],
    ["historicalAfterDays", input.historicalAfterDays],
  ] as const;
  let previous = -1;
  for (const [name, raw] of ordered) {
    if (raw === undefined) continue;
    const value = Math.trunc(raw);
    if (value < 0) throw new Error(`Canonical freshness policy ${name} cannot be negative.`);
    if (value < previous) throw new Error("Canonical freshness policy thresholds must be ordered from warning to historical.");
    previous = value;
  }
  if (input.maxAcceptedAgeDays !== undefined && input.maxAcceptedAgeDays < 0) throw new Error("Canonical freshness policy maximum accepted age cannot be negative.");
}

function canonicalPolicyMaterial(input: Omit<CanonicalMarketFreshnessPolicy, "contractVersion" | "materialHash">) {
  const { registeredAt: _registeredAt, ...material } = input;
  return material;
}

function registryPolicyKey(policy: CanonicalMarketFreshnessPolicy) {
  return [
    policy.datasetCategory,
    policy.dataset ?? "",
    policy.module ?? "",
    policy.geographyLevel,
    policy.providerScope ?? "",
    policy.policyId,
    policy.semanticVersion,
  ].join(":");
}

function validateCanonicalFreshnessInput(input: CanonicalMarketFreshnessInput) {
  if (input.policy.lifecycleStatus === "disabled") throw new Error("Disabled canonical freshness policies cannot evaluate new freshness results.");
  if (input.policy.datasetCategory !== input.datasetCategory) throw new Error("Canonical freshness policy dataset category does not match the source record.");
  if (input.policy.dataset && input.dataset && input.policy.dataset !== input.dataset) throw new Error("Canonical freshness policy dataset does not match the source record.");
  if (input.policy.module && input.module && input.policy.module !== input.module) throw new Error("Canonical freshness policy module does not match the source record.");
  if (input.policy.geographyLevel !== input.geographyLevel) throw new Error("Canonical freshness policy geography does not match the source record.");
  if (input.policy.providerScope && input.policy.providerScope !== clean(input.providerId)) throw new Error("Canonical freshness policy provider scope does not match the source record.");
  requiredClean(input.datasetId, "Canonical freshness result requires dataset identity.");
  requiredClean(input.evaluationTime, "Canonical freshness evaluation requires server-authoritative evaluation time.");
  if (!isValidDateLike(input.evaluationTime, input.timeSemantics)) throw new Error("Canonical freshness evaluation time is invalid for the declared time semantics.");
}

function resolveAgeBasisTime(input: CanonicalMarketFreshnessInput, ageBasis: MarketFreshnessAgeBasis) {
  switch (ageBasis) {
  case "observation_time": return normalizeTemporal(input.observationTime, input.timeSemantics);
  case "effective_start": return normalizeTemporal(input.effectiveStart, input.timeSemantics);
  case "effective_end": return normalizeTemporal(input.effectiveEnd, input.timeSemantics);
  case "publication_time": return normalizeTemporal(input.publicationTime, input.timeSemantics);
  case "retrieval_time": return normalizeTemporal(input.retrievalTime, input.timeSemantics);
  }
}

function resolveCanonicalState(input: CanonicalMarketFreshnessInput, calculatedAgeDays: number | undefined): {
  state: CanonicalMarketFreshnessState;
  explanationCodes: CanonicalMarketFreshnessExplanationCode[];
  manualReviewRequired: boolean;
} {
  const policy = input.policy;
  const explanations: CanonicalMarketFreshnessExplanationCode[] = [];
  const manualReviewRequired = policy.manualReviewRequired;

  if (input.notApplicable || policy.futureDatedDataBehavior === "not_applicable") {
    return { state: "not_applicable", explanationCodes: ["not_applicable_to_dataset"], manualReviewRequired: false };
  }

  if (input.sourceConflict) {
    explanations.push("source_conflict");
    return { state: "conflicted", explanationCodes: explanations, manualReviewRequired: true };
  }

  if (input.supersededByResultId || input.replacementSourceRecordId || input.supersededBoundaryVersion) {
    explanations.push("boundary_version_superseded");
    return { state: "superseded", explanationCodes: explanations, manualReviewRequired };
  }

  const providerUnavailable = isProviderUnavailable(input);
  if (providerUnavailable) {
    if (input.priorValidResultId || input.priorValidSourceRecordId) {
      explanations.push("provider_failed_prior_valid_retained");
    } else if (policy.providerFailureBehavior === "unavailable_without_prior" || input.providerFailure) {
      return { state: "unavailable", explanationCodes: ["provider_unavailable_no_prior_valid"], manualReviewRequired: policy.providerFailureBehavior === "manual_review" };
    }
  }

  const missingRequiredTime = requiredTimeMissing(input);
  if (missingRequiredTime) {
    explanations.push("temporal_metadata_missing");
    return {
      state: policy.missingTimestampBehavior === "not_applicable" ? "not_applicable" : "missing_temporal_metadata",
      explanationCodes: explanations,
      manualReviewRequired: policy.missingTimestampBehavior === "manual_review" || manualReviewRequired,
    };
  }

  const evaluation = temporalDate(input.evaluationTime, input.timeSemantics);
  const effectiveStart = input.effectiveStart ? temporalDate(input.effectiveStart, input.timeSemantics) : undefined;
  const effectiveEnd = input.effectiveEnd ? temporalDate(input.effectiveEnd, input.timeSemantics) : undefined;

  if (effectiveStart && effectiveStart.getTime() > evaluation.getTime()) {
    explanations.push("future_effective_record");
    return {
      state: policy.futureDatedDataBehavior === "missing_temporal_metadata" ? "missing_temporal_metadata" : "future_effective",
      explanationCodes: explanations,
      manualReviewRequired,
    };
  }

  if (effectiveEnd && effectiveEnd.getTime() < evaluation.getTime()) {
    if (policy.effectivePeriodBehavior === "expires_after_effective_end") {
      explanations.push("effective_period_ended");
      return { state: "expired", explanationCodes: explanations, manualReviewRequired };
    }
    if (policy.effectivePeriodBehavior === "historical_after_effective_end") {
      explanations.push("historical_record_retained");
      return { state: "historical", explanationCodes: explanations, manualReviewRequired };
    }
  }

  if (calculatedAgeDays === undefined) {
    explanations.push("temporal_metadata_missing");
    return { state: "missing_temporal_metadata", explanationCodes: explanations, manualReviewRequired: true };
  }

  if (policy.historicalAfterDays !== undefined && calculatedAgeDays > policy.historicalAfterDays) {
    explanations.push("historical_record_retained");
    return {
      state: policy.historicalRecordBehavior === "expired" ? "expired" : "historical",
      explanationCodes: explanations,
      manualReviewRequired: policy.historicalRecordBehavior === "manual_review" || manualReviewRequired,
    };
  }
  if (policy.expirationAfterDays !== undefined && calculatedAgeDays > policy.expirationAfterDays) {
    explanations.push("expiration_threshold_reached");
    return { state: "expired", explanationCodes: explanations, manualReviewRequired };
  }
  if (policy.staleAfterDays !== undefined && calculatedAgeDays > policy.staleAfterDays) {
    explanations.push("beyond_stale_threshold");
    return { state: "stale", explanationCodes: explanations, manualReviewRequired };
  }
  if (policy.reviewAfterDays !== undefined && calculatedAgeDays >= policy.reviewAfterDays) {
    explanations.push("review_threshold_reached");
    return { state: "review_due", explanationCodes: explanations, manualReviewRequired };
  }
  if (policy.warningAfterDays !== undefined && calculatedAgeDays >= policy.warningAfterDays) {
    explanations.push("nearing_review_threshold");
    return { state: "current_with_age_warning", explanationCodes: explanations, manualReviewRequired };
  }

  explanations.push("within_policy_window");
  return { state: "current", explanationCodes: explanations, manualReviewRequired };
}

function resolveRefreshEligibility(
  input: CanonicalMarketFreshnessInput,
  state: CanonicalMarketFreshnessState,
  explanationCodes: readonly CanonicalMarketFreshnessExplanationCode[],
): CanonicalMarketFreshnessResult["refreshEligibility"] {
  const policy = input.policy;
  const supported = input.refreshSupported ?? policy.refreshWorkflowAvailable;
  const reasonBase = {
    governingProvider: clean(input.providerId),
    datasetId: requiredClean(input.datasetId, "Canonical freshness result requires dataset identity."),
    earliestRefreshTime: clean(input.earliestRefreshTime),
    requiredPermission: clean(input.requiredPermission) ?? policy.requiredPermission,
    providerCapability: input.providerCapability ?? policy.providerCapability,
  };
  if (input.refreshBlocked) return { ...reasonBase, state: "refresh_blocked", reason: "refresh_blocked" };
  if (reasonBase.requiredPermission && input.permissionAvailable === false) return { ...reasonBase, state: "permission_restricted", reason: "permission_required" };
  if (isProviderUnavailable(input)) return { ...reasonBase, state: "provider_unavailable", reason: explanationCodes.includes("provider_failed_prior_valid_retained") ? "provider_failed_prior_valid_retained" : "provider_unavailable_no_prior_valid" };
  if (!supported) return { ...reasonBase, state: "refresh_not_supported", reason: "refresh_not_supported" };
  if (policy.refreshEligibility === "manual_only") return { ...reasonBase, state: "manual_only", reason: "manual_review_required" };
  if (["current", "current_with_age_warning", "future_effective", "historical", "not_applicable"].includes(state)) return { ...reasonBase, state: "refresh_not_needed", reason: "refresh_not_needed" };
  if (policy.refreshEligibility === "refresh_blocked") return { ...reasonBase, state: "refresh_blocked", reason: "refresh_blocked" };
  if (policy.refreshEligibility === "refresh_not_supported") return { ...reasonBase, state: "refresh_not_supported", reason: "refresh_not_supported" };
  return { ...reasonBase, state: "refresh_due", reason: "refresh_due" };
}

function requiredTimeMissing(input: CanonicalMarketFreshnessInput) {
  const policy = input.policy;
  if (!input.evaluationTime) return true;
  const basis = resolveAgeBasisTime(input, policy.ageBasis);
  if (!basis) return true;
  if (policy.ageBasis !== "retrieval_time" && input.retrievalTime && !isValidDateLike(input.retrievalTime, input.timeSemantics)) return true;
  if (input.effectiveStart && !isValidDateLike(input.effectiveStart, input.timeSemantics)) return true;
  if (input.effectiveEnd && !isValidDateLike(input.effectiveEnd, input.timeSemantics)) return true;
  if (input.publicationTime && !isValidDateLike(input.publicationTime, input.timeSemantics)) return true;
  return false;
}

function isProviderUnavailable(input: CanonicalMarketFreshnessInput) {
  return Boolean(input.providerFailure) ||
    input.providerState === "offline" ||
    input.providerState === "maintenance" ||
    input.providerState === "rate_limited" ||
    input.providerState === "disabled" ||
    input.providerState === "not_configured" ||
    input.providerState === "authentication_required";
}

function differenceDaysWithSemantics(later: string, earlier: string, semantics: MarketFreshnessTimeSemantics) {
  const laterDate = temporalDate(later, semantics);
  const earlierDate = temporalDate(earlier, semantics);
  return Math.max(0, Math.floor((laterDate.getTime() - earlierDate.getTime()) / 86_400_000));
}

function normalizeTemporal(value: string | undefined, semantics: MarketFreshnessTimeSemantics) {
  if (!value) return undefined;
  if (!isValidDateLike(value, semantics)) return value;
  return temporalDate(value, semantics).toISOString();
}

function isValidDateLike(value: string, semantics: MarketFreshnessTimeSemantics) {
  try {
    temporalDate(value, semantics);
    return true;
  } catch {
    return false;
  }
}

function temporalDate(value: string, semantics: MarketFreshnessTimeSemantics) {
  const cleaned = requiredClean(value, "Canonical freshness time value is required.");
  let normalized = cleaned;
  if (semantics === "year") normalized = `${cleaned.slice(0, 4)}-01-01T00:00:00.000Z`;
  else if (semantics === "month") normalized = `${cleaned.slice(0, 7)}-01T00:00:00.000Z`;
  else if (semantics === "date") normalized = `${cleaned.slice(0, 10)}T00:00:00.000Z`;
  else if (!/[zZ]|[+-]\d\d:\d\d$/.test(cleaned)) normalized = `${cleaned}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error("Canonical freshness time value is invalid.");
  return date;
}

function assertPolicyMatches(input: MarketFreshnessInput) {
  if (input.policy.dataset !== input.dataset) throw new Error("Market freshness policy dataset does not match assessment dataset.");
  if (input.policy.module !== input.module) throw new Error("Market freshness policy module does not match assessment module.");
  if (input.policy.geographyLevel !== input.geographyLevel) throw new Error("Market freshness policy geography does not match assessment geography.");
}

function freshnessStateFromReasons(reasons: MarketFreshnessReason[], providerState: LocationFreshnessState): LocationFreshnessState {
  if (reasons.includes("superseded_result")) return "superseded";
  if (providerState === "superseded") return "superseded";
  if (reasons.includes("historical_period")) return "historical";
  if (reasons.includes("explicit_expiration") || reasons.includes("stale_after_policy") || reasons.includes("provider_marked_stale")) return "stale";
  if (reasons.some((reason) => reason.startsWith("missing_")) || reasons.includes("provider_marked_unknown")) return "unknown";
  if (providerState === "historical") return "historical";
  return "current";
}

function rollupState(assessments: MarketFreshnessAssessment[]): LocationFreshnessState {
  if (!assessments.length) return "unknown";
  if (assessments.some((assessment) => assessment.state === "stale")) return "stale";
  if (assessments.some((assessment) => assessment.state === "unknown")) return "unknown";
  if (assessments.every((assessment) => assessment.state === "superseded")) return "superseded";
  if (assessments.every((assessment) => assessment.state === "historical" || assessment.state === "superseded")) return "historical";
  return "current";
}

function expirationFrom(retrievedAt: string | undefined, staleAfterDays: number) {
  if (!retrievedAt || staleAfterDays < 0) return undefined;
  const date = new Date(retrievedAt);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setUTCDate(date.getUTCDate() + Math.max(0, Math.trunc(staleAfterDays)));
  return date.toISOString();
}

function differenceDays(later: string, earlier: string) {
  const laterDate = new Date(later);
  const earlierDate = new Date(earlier);
  if (Number.isNaN(laterDate.getTime()) || Number.isNaN(earlierDate.getTime())) return undefined;
  return Math.max(0, Math.floor((laterDate.getTime() - earlierDate.getTime()) / 86_400_000));
}

function compareIso(left: string, right: string) {
  const leftTime = new Date(left).getTime();
  const rightTime = new Date(right).getTime();
  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return 0;
  return leftTime === rightTime ? 0 : leftTime > rightTime ? 1 : -1;
}

function latestProvenanceTime(provenance: readonly MarketProviderProvenance[], field: "retrievalTime" | "effectiveTime" | "observationTime") {
  return provenance
    .map((item) => clean(item[field]))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
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

function stableEvidenceReferences(input: readonly SourceEvidenceReference[]) {
  return input
    .map((item) => ({
      ...item,
      sourceRecordId: clean(item.sourceRecordId),
      evidenceId: clean(item.evidenceId),
      sourceName: clean(item.sourceName),
      sourceUrl: clean(item.sourceUrl),
      observedAt: clean(item.observedAt),
      effectiveAt: clean(item.effectiveAt),
    }))
    .sort((a, b) => stableSerialize(a).localeCompare(stableSerialize(b)));
}

function stableSourceRecordKeys(input: readonly ProviderNormalizedSourceRecord[]) {
  return uniqueSorted(input.map((record) => record.sourceRecordKey));
}

function assessmentOrderingKey(assessment: MarketFreshnessAssessment) {
  return [assessment.state, assessment.dataset, assessment.geographyLevel, assessment.assessmentId].join(":");
}

function uniqueSorted<T extends string>(values: readonly T[]) {
  return [...new Set(values.map((value) => clean(value)).filter((value): value is T => Boolean(value)))].sort();
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

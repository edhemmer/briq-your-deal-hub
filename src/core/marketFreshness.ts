import type { GeographicLevel, LocationFreshnessState, SourceEvidenceReference } from "./locationIdentity";
import type { ProviderConfidence, ProviderNormalizedSourceRecord } from "./providerAdapters";
import type {
  MarketIngestionResult,
  MarketProviderProvenance,
  MarketSourceDataset,
  MarketSourceFreshness,
  MarketSourceModule,
} from "./marketSourceIngestion";

export const MARKET_FRESHNESS_CONTRACT_VERSION = "market-freshness-v1";
export const MARKET_FRESHNESS_POLICY_VERSION = "market-freshness-policy-v1";

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

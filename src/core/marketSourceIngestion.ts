import type {
  CanonicalLocationIdentity,
  GeographicLevel,
  LocationFreshnessState,
  LocationVerificationState,
  SourceEvidenceReference,
} from "./locationIdentity";
import type {
  ProviderAvailability,
  ProviderCapability,
  ProviderConfidence,
  ProviderMetadata,
  ProviderNormalizedSourceRecord,
  ProviderRateLimit,
  ProviderState,
} from "./providerAdapters";
import { assertNormalizedSourceRecord, assertProviderMetadata } from "./providerAdapters";
import type { SourceClassificationResult } from "./sourceClassification";

export const MARKET_SOURCE_INGESTION_CONTRACT_VERSION = "market-source-ingestion-v1";
export const MARKET_SOURCE_PROVIDER_CONTRACT_VERSION = "market-source-provider-v1";
export const MARKET_SOURCE_BATCH_CONTRACT_VERSION = "market-source-batch-v1";
export const MARKET_SOURCE_RESULT_CONTRACT_VERSION = "market-source-result-v1";

export const marketIngestionLifecycleStates = [
  "requested",
  "authorized",
  "accepted",
  "queued",
  "running",
  "partially_complete",
  "complete",
  "failed",
  "cancelled",
  "expired",
  "stale",
  "superseded",
  "blocked",
  "retrying",
] as const;

export const marketIngestionResultStatuses = [
  "not_started",
  "accepted",
  "partial_success",
  "success",
  "failed",
  "blocked",
  "stale",
  "superseded",
  "cancelled",
] as const;

export const marketSourceModules = [
  "population",
  "employment",
  "housing_market",
  "rental_market",
  "taxes",
  "insurance_pressure",
  "hazards",
  "environment",
  "convenience",
  "infrastructure",
  "schools",
  "crime",
  "liquidity",
  "growth",
  "local_risk",
] as const;

export const marketSourceDatasets = [
  "population_level",
  "population_trend",
  "household_context",
  "employment_level",
  "unemployment",
  "industry_concentration",
  "inventory",
  "sales_activity",
  "days_on_market",
  "sale_prices",
  "rent_levels",
  "vacancy",
  "permits",
  "property_tax",
  "assessment_context",
  "insurance_pressure",
  "flood",
  "wildfire",
  "wind_hail",
  "seismic",
  "environmental_sites",
  "grocery_access",
  "healthcare_access",
  "transportation_access",
  "airport_access",
  "broadband",
  "school_context",
  "crime_context",
  "major_development",
] as const;

export type MarketIngestionLifecycleState = typeof marketIngestionLifecycleStates[number];
export type MarketIngestionResultStatus = typeof marketIngestionResultStatuses[number];
export type MarketSourceModule = typeof marketSourceModules[number];
export type MarketSourceDataset = typeof marketSourceDatasets[number];

export type MarketSourceFreshness = {
  state: LocationFreshnessState;
  observedAt?: string;
  effectiveAt?: string;
  retrievedAt?: string;
  expiresAt?: string;
  staleAfterDays?: number;
  reason?: string;
};

export type MarketProviderPriority = {
  rank: number;
  tieBreaker: string;
  reason?: string;
};

export type MarketProviderLicensing = {
  licenseType: "public" | "commercial" | "restricted" | "user_supplied" | "unknown";
  attributionRequired: boolean;
  retentionPolicy?: string;
  redistributionAllowed?: boolean;
  notes?: string;
};

export type MarketProviderCapabilityDeclaration = {
  providerId: string;
  supportedCountries: readonly string[];
  supportedGeographies: readonly GeographicLevel[];
  supportedModules: readonly MarketSourceModule[];
  supportedDatasets: readonly MarketSourceDataset[];
  supportedFreshness: readonly LocationFreshnessState[];
  supportedConfidence: readonly ProviderConfidence[];
  supportedRateLimits?: ProviderRateLimit;
  supportedLicensing: MarketProviderLicensing;
  providerCapabilities: readonly ProviderCapability[];
};

export type MarketProviderDeclaration = {
  metadata: ProviderMetadata;
  priority: MarketProviderPriority;
  health: {
    state: ProviderState;
    availability: ProviderAvailability;
    checkedAt: string;
    freshness: MarketSourceFreshness;
  };
  capabilityDeclaration: MarketProviderCapabilityDeclaration;
  contractVersion: typeof MARKET_SOURCE_PROVIDER_CONTRACT_VERSION;
};

export type MarketAuthorizationBoundary = {
  workspaceId: string;
  authorizedWorkspaceIds: readonly string[];
  authorizedDealIds?: readonly string[];
  authorizedPropertyIds?: readonly string[];
  allowedProviderIds?: readonly string[];
  actorId?: string;
  reason?: string;
};

export type MarketValidationBoundary = {
  acceptedSourceClasses: readonly string[];
  requiredGeographyLevels: readonly GeographicLevel[];
  requiredFields: readonly string[];
  allowPartial: boolean;
};

export type MarketNormalizationBoundary = {
  normalizedRecordOnly: true;
  canonicalMarketRecordWriteAllowed: false;
  canonicalPropertyWriteAllowed: false;
  canonicalProviderIdsAllowed: false;
};

export type MarketProviderProvenance = {
  providerId: string;
  providerVersion: string;
  providerRecordReference: string;
  observationTime?: string;
  effectiveTime?: string;
  retrievalTime: string;
  verificationState: LocationVerificationState;
  confidence: ProviderConfidence;
  evidenceReference?: SourceEvidenceReference;
  sourceClassification?: SourceClassificationResult;
};

export type MarketIngestionRequest = {
  requestId: string;
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  location: CanonicalLocationIdentity;
  requestedModules: MarketSourceModule[];
  requestedDatasets: MarketSourceDataset[];
  requestedGeographyLevels: GeographicLevel[];
  providerIds: string[];
  requestedAt: string;
  idempotencyKey: string;
  authorization: MarketAuthorizationBoundary;
  validationBoundary: MarketValidationBoundary;
  normalizationBoundary: MarketNormalizationBoundary;
  deterministicHash: string;
  contractVersion: typeof MARKET_SOURCE_INGESTION_CONTRACT_VERSION;
};

export type MarketIngestionFailure = {
  failureId: string;
  providerId?: string;
  code:
    | "unsupported_provider"
    | "duplicate_provider"
    | "duplicate_batch"
    | "unauthorized_workspace"
    | "unauthorized_deal"
    | "unauthorized_property"
    | "provider_unavailable"
    | "provider_stale"
    | "normalization_boundary_violation"
    | "validation_failed"
    | "partial_result"
    | "retry_exhausted"
    | "internal_ingestion_error";
  safeMessage: string;
  retryable: boolean;
  field?: string;
  deterministicHash: string;
};

export type MarketRetryMetadata = {
  retryable: boolean;
  attempt: number;
  maxAttempts: number;
  nextRetryAt?: string;
  retryAfterSeconds?: number;
  backoffStrategy: "none" | "fixed" | "exponential";
  priorFailureHashes: readonly string[];
};

export type MarketIngestionSession = {
  sessionId: string;
  workspaceId: string;
  requestId: string;
  lifecycleState: MarketIngestionLifecycleState;
  startedAt?: string;
  completedAt?: string;
  supersededBySessionId?: string;
  retry: MarketRetryMetadata;
  failures: MarketIngestionFailure[];
  deterministicHash: string;
  contractVersion: typeof MARKET_SOURCE_INGESTION_CONTRACT_VERSION;
};

export type MarketIngestionResult = {
  resultId: string;
  requestId: string;
  sessionId: string;
  providerId: string;
  lifecycleState: MarketIngestionLifecycleState;
  status: MarketIngestionResultStatus;
  normalizedSourceRecords: ProviderNormalizedSourceRecord[];
  provenance: MarketProviderProvenance[];
  warnings: string[];
  failures: MarketIngestionFailure[];
  freshness: MarketSourceFreshness;
  processingTimeMs: number;
  deterministicHash: string;
  contractVersion: typeof MARKET_SOURCE_RESULT_CONTRACT_VERSION;
};

export type MarketIngestionBatch = {
  batchId: string;
  workspaceId: string;
  requestIds: string[];
  sessionIds: string[];
  lifecycleState: MarketIngestionLifecycleState;
  resultStatus: MarketIngestionResultStatus;
  results: MarketIngestionResult[];
  failures: MarketIngestionFailure[];
  duplicateRequestIds: string[];
  createdAt: string;
  deterministicHash: string;
  contractVersion: typeof MARKET_SOURCE_BATCH_CONTRACT_VERSION;
};

export type MarketIngestionResponse = {
  responseId: string;
  request: MarketIngestionRequest;
  session: MarketIngestionSession;
  results: MarketIngestionResult[];
  status: MarketIngestionResultStatus;
  lifecycleState: MarketIngestionLifecycleState;
  partial: boolean;
  failures: MarketIngestionFailure[];
  warnings: string[];
  deterministicHash: string;
  contractVersion: typeof MARKET_SOURCE_INGESTION_CONTRACT_VERSION;
};

export type MarketProviderRegistry = ReadonlyMap<string, MarketProviderDeclaration>;

export function isMarketIngestionLifecycleState(value: string): value is MarketIngestionLifecycleState {
  return marketIngestionLifecycleStates.includes(value as MarketIngestionLifecycleState);
}

export function isMarketSourceModule(value: string): value is MarketSourceModule {
  return marketSourceModules.includes(value as MarketSourceModule);
}

export function isMarketSourceDataset(value: string): value is MarketSourceDataset {
  return marketSourceDatasets.includes(value as MarketSourceDataset);
}

export function marketNormalizationBoundary(): MarketNormalizationBoundary {
  return {
    normalizedRecordOnly: true,
    canonicalMarketRecordWriteAllowed: false,
    canonicalPropertyWriteAllowed: false,
    canonicalProviderIdsAllowed: false,
  };
}

export function buildMarketProviderDeclaration(input: Omit<MarketProviderDeclaration, "contractVersion">): MarketProviderDeclaration {
  const metadata = assertProviderMetadata(input.metadata);
  const capabilityDeclaration = validateCapabilityDeclaration(input.capabilityDeclaration, metadata);
  const priority = normalizePriority(input.priority);
  const health = {
    state: input.health.state,
    availability: input.health.availability,
    checkedAt: requiredClean(input.health.checkedAt, "Market provider health requires checked time."),
    freshness: normalizeFreshness(input.health.freshness),
  };
  return {
    metadata,
    priority,
    health,
    capabilityDeclaration,
    contractVersion: MARKET_SOURCE_PROVIDER_CONTRACT_VERSION,
  };
}

export function createMarketProviderRegistry(providers: readonly MarketProviderDeclaration[]): MarketProviderRegistry {
  const registry = new Map<string, MarketProviderDeclaration>();
  for (const provider of providers.map(buildMarketProviderDeclaration)) {
    if (registry.has(provider.metadata.providerId)) {
      throw ingestionFailureError(failure({
        code: "duplicate_provider",
        providerId: provider.metadata.providerId,
        safeMessage: "Provider declaration is duplicated.",
        retryable: false,
      }));
    }
    registry.set(provider.metadata.providerId, provider);
  }
  return registry;
}

export function buildMarketIngestionRequest(input: {
  workspaceId: string;
  dealId?: string;
  propertyId?: string;
  location: CanonicalLocationIdentity;
  requestedModules: readonly MarketSourceModule[];
  requestedDatasets: readonly MarketSourceDataset[];
  requestedGeographyLevels: readonly GeographicLevel[];
  providerIds: readonly string[];
  requestedAt: string;
  idempotencyKey: string;
  authorization: MarketAuthorizationBoundary;
  validationBoundary?: Partial<MarketValidationBoundary>;
}): MarketIngestionRequest {
  const workspaceId = requiredClean(input.workspaceId, "Market ingestion requires workspace scope.");
  const requestedAt = requiredClean(input.requestedAt, "Market ingestion requires request time.");
  const idempotencyKey = requiredClean(input.idempotencyKey, "Market ingestion requires idempotency key.");
  assertAuthorized(input.authorization, workspaceId, input.dealId, input.propertyId);
  if (input.location.workspaceId !== workspaceId) {
    throw ingestionFailureError(failure({
      code: "unauthorized_workspace",
      safeMessage: "Location identity is outside the authorized workspace.",
      retryable: false,
      field: "location.workspaceId",
    }));
  }
  const requestedModules = uniqueSorted(input.requestedModules);
  const requestedDatasets = uniqueSorted(input.requestedDatasets);
  const requestedGeographyLevels = uniqueSorted(input.requestedGeographyLevels);
  const providerIds = uniqueSorted(input.providerIds.map(normalizeProviderId));
  if (!requestedModules.every(isMarketSourceModule)) throw new Error("Market ingestion request includes an unsupported module.");
  if (!requestedDatasets.every(isMarketSourceDataset)) throw new Error("Market ingestion request includes an unsupported dataset.");
  if (!providerIds.length) throw new Error("Market ingestion request requires at least one provider id.");
  const validationBoundary: MarketValidationBoundary = {
    acceptedSourceClasses: uniqueSorted(input.validationBoundary?.acceptedSourceClasses ?? []),
    requiredGeographyLevels: requestedGeographyLevels,
    requiredFields: uniqueSorted(input.validationBoundary?.requiredFields ?? []),
    allowPartial: input.validationBoundary?.allowPartial ?? true,
  };
  const basis = {
    workspaceId,
    dealId: clean(input.dealId),
    propertyId: clean(input.propertyId),
    locationHash: input.location.deterministicContentHash,
    requestedModules,
    requestedDatasets,
    requestedGeographyLevels,
    providerIds,
    requestedAt,
    idempotencyKey,
  };
  return {
    requestId: `mi_req_${stableHash(basis).slice(0, 24)}`,
    workspaceId,
    dealId: clean(input.dealId),
    propertyId: clean(input.propertyId),
    location: input.location,
    requestedModules,
    requestedDatasets,
    requestedGeographyLevels,
    providerIds,
    requestedAt,
    idempotencyKey,
    authorization: input.authorization,
    validationBoundary,
    normalizationBoundary: marketNormalizationBoundary(),
    deterministicHash: `mi_reqh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_SOURCE_INGESTION_CONTRACT_VERSION,
  };
}

export function acceptMarketIngestionRequest(input: {
  request: MarketIngestionRequest;
  registry: MarketProviderRegistry;
  now: string;
  retry?: Partial<MarketRetryMetadata>;
}): MarketIngestionSession {
  const failures = unsupportedOrUnavailableProviders(input.request, input.registry);
  const lifecycleState: MarketIngestionLifecycleState = failures.length === input.request.providerIds.length ? "blocked" : failures.length ? "partially_complete" : "accepted";
  const retry = normalizeRetry(input.retry, failures);
  const basis = {
    requestId: input.request.requestId,
    workspaceId: input.request.workspaceId,
    lifecycleState,
    startedAt: input.now,
    failures: failures.map((item) => item.deterministicHash),
    retry,
  };
  return {
    sessionId: `mi_sess_${stableHash({ requestId: input.request.requestId, startedAt: input.now }).slice(0, 24)}`,
    workspaceId: input.request.workspaceId,
    requestId: input.request.requestId,
    lifecycleState,
    startedAt: input.now,
    retry,
    failures,
    deterministicHash: `mi_sessh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_SOURCE_INGESTION_CONTRACT_VERSION,
  };
}

export function buildMarketIngestionResult(input: {
  request: MarketIngestionRequest;
  session: MarketIngestionSession;
  provider: MarketProviderDeclaration;
  lifecycleState: MarketIngestionLifecycleState;
  normalizedSourceRecords?: readonly ProviderNormalizedSourceRecord[];
  provenance?: readonly MarketProviderProvenance[];
  warnings?: readonly string[];
  failures?: readonly MarketIngestionFailure[];
  freshness: MarketSourceFreshness;
  processingTimeMs: number;
}): MarketIngestionResult {
  const providerId = input.provider.metadata.providerId;
  if (!input.request.providerIds.includes(providerId)) {
    throw ingestionFailureError(failure({
      code: "unsupported_provider",
      providerId,
      safeMessage: "Provider was not requested for this ingestion session.",
      retryable: false,
      field: "providerId",
    }));
  }
  assertNormalizationBoundary(input.request.normalizationBoundary);
  const normalizedSourceRecords = (input.normalizedSourceRecords ?? []).map(assertMarketNormalizedSourceRecord);
  const failures = stableFailures(input.failures ?? []);
  const provenance = stableProvenance(input.provenance ?? []);
  const lifecycleState = input.lifecycleState;
  const status = resultStatusFor(lifecycleState, normalizedSourceRecords.length, failures.length);
  const basis = {
    requestId: input.request.requestId,
    sessionId: input.session.sessionId,
    providerId,
    lifecycleState,
    status,
    normalizedRecordKeys: normalizedSourceRecords.map((record) => record.sourceRecordKey).sort(),
    provenance: provenance.map((item) => item.providerRecordReference).sort(),
    failures: failures.map((item) => item.deterministicHash),
    freshness: normalizeFreshness(input.freshness),
    processingTimeMs: Math.max(0, Math.round(input.processingTimeMs)),
  };
  return {
    resultId: `mi_res_${stableHash(basis).slice(0, 24)}`,
    requestId: input.request.requestId,
    sessionId: input.session.sessionId,
    providerId,
    lifecycleState,
    status,
    normalizedSourceRecords,
    provenance,
    warnings: uniqueSorted(input.warnings ?? []),
    failures,
    freshness: normalizeFreshness(input.freshness),
    processingTimeMs: Math.max(0, Math.round(input.processingTimeMs)),
    deterministicHash: `mi_resh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_SOURCE_RESULT_CONTRACT_VERSION,
  };
}

export function buildMarketIngestionResponse(input: {
  request: MarketIngestionRequest;
  session: MarketIngestionSession;
  results?: readonly MarketIngestionResult[];
  warnings?: readonly string[];
}): MarketIngestionResponse {
  const results = (input.results ?? []).slice().sort((a, b) => resultOrderingKey(a).localeCompare(resultOrderingKey(b)));
  const failures = stableFailures([...input.session.failures, ...results.flatMap((result) => result.failures)]);
  const lifecycleState = responseLifecycle(input.session, results, failures);
  const status = responseStatus(lifecycleState, results, failures);
  const basis = {
    request: input.request.requestId,
    session: input.session.sessionId,
    results: results.map((result) => result.deterministicHash),
    failures: failures.map((item) => item.deterministicHash),
    lifecycleState,
    status,
  };
  return {
    responseId: `mi_resp_${stableHash(basis).slice(0, 24)}`,
    request: input.request,
    session: input.session,
    results,
    status,
    lifecycleState,
    partial: status === "partial_success" || lifecycleState === "partially_complete",
    failures,
    warnings: uniqueSorted(input.warnings ?? []),
    deterministicHash: `mi_resph_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_SOURCE_INGESTION_CONTRACT_VERSION,
  };
}

export function buildMarketIngestionBatch(input: {
  workspaceId: string;
  requests: readonly MarketIngestionRequest[];
  sessions: readonly MarketIngestionSession[];
  results?: readonly MarketIngestionResult[];
  createdAt: string;
}): MarketIngestionBatch {
  const workspaceId = requiredClean(input.workspaceId, "Market ingestion batch requires workspace scope.");
  const createdAt = requiredClean(input.createdAt, "Market ingestion batch requires creation time.");
  const requests = input.requests.filter((request) => request.workspaceId === workspaceId).sort((a, b) => a.requestId.localeCompare(b.requestId));
  const sessions = input.sessions.filter((session) => session.workspaceId === workspaceId).sort((a, b) => a.sessionId.localeCompare(b.sessionId));
  const results = (input.results ?? []).slice().sort((a, b) => resultOrderingKey(a).localeCompare(resultOrderingKey(b)));
  const duplicateRequestIds = duplicates(requests.map((request) => request.requestId));
  const duplicateIdempotencyKeys = duplicates(requests.map((request) => request.idempotencyKey));
  const duplicateFailures = duplicateRequestIds.concat(duplicateIdempotencyKeys).map((id) => failure({
    code: "duplicate_batch",
    safeMessage: "Market ingestion batch contains a duplicate request or idempotency key.",
    retryable: false,
    field: id,
  }));
  const failures = stableFailures(duplicateFailures.concat(sessions.flatMap((session) => session.failures), results.flatMap((result) => result.failures)));
  const lifecycleState = failures.some((item) => item.code === "duplicate_batch") ? "blocked" : batchLifecycle(sessions, results, failures);
  const resultStatusValue = responseStatus(lifecycleState, results, failures);
  const basis = {
    workspaceId,
    requestIds: requests.map((request) => request.requestId),
    sessionIds: sessions.map((session) => session.sessionId),
    resultHashes: results.map((result) => result.deterministicHash),
    lifecycleState,
    resultStatusValue,
    failures: failures.map((item) => item.deterministicHash),
    createdAt,
  };
  return {
    batchId: `mi_batch_${stableHash(basis).slice(0, 24)}`,
    workspaceId,
    requestIds: requests.map((request) => request.requestId),
    sessionIds: sessions.map((session) => session.sessionId),
    lifecycleState,
    resultStatus: resultStatusValue,
    results,
    failures,
    duplicateRequestIds: uniqueSorted(duplicateRequestIds.concat(duplicateIdempotencyKeys)),
    createdAt,
    deterministicHash: `mi_batchh_${stableHash(basis).slice(0, 24)}`,
    contractVersion: MARKET_SOURCE_BATCH_CONTRACT_VERSION,
  };
}

export function createMarketProviderProvenance(input: MarketProviderProvenance): MarketProviderProvenance {
  return {
    providerId: normalizeProviderId(input.providerId),
    providerVersion: requiredClean(input.providerVersion, "Market source provenance requires provider version."),
    providerRecordReference: requiredClean(input.providerRecordReference, "Market source provenance requires provider record reference."),
    observationTime: clean(input.observationTime),
    effectiveTime: clean(input.effectiveTime),
    retrievalTime: requiredClean(input.retrievalTime, "Market source provenance requires retrieval time."),
    verificationState: input.verificationState,
    confidence: input.confidence,
    evidenceReference: input.evidenceReference,
    sourceClassification: input.sourceClassification,
  };
}

export function marketIngestionMaterialHash(input: unknown) {
  return stableHash(input);
}

export function marketIngestionDiagnostics(event: "request_created" | "request_authorized" | "provider_blocked" | "session_started" | "partial_result" | "result_completed" | "retry_scheduled" | "batch_blocked" | "operation_failed", input: {
  workspaceId?: string;
  requestId?: string;
  providerId?: string;
  lifecycleState?: string;
  failureCode?: string;
}) {
  return {
    event,
    workspaceScoped: Boolean(clean(input.workspaceId)),
    requestScoped: Boolean(clean(input.requestId)),
    providerScoped: Boolean(clean(input.providerId)),
    lifecycleState: clean(input.lifecycleState),
    failureCode: clean(input.failureCode),
  };
}

function validateCapabilityDeclaration(input: MarketProviderCapabilityDeclaration, metadata: ProviderMetadata): MarketProviderCapabilityDeclaration {
  const providerId = normalizeProviderId(input.providerId);
  if (providerId !== metadata.providerId) throw new Error("Market provider capability declaration must match provider metadata.");
  const supportedCountries = uniqueSorted(input.supportedCountries.map((country) => country.toUpperCase()));
  const supportedGeographies = uniqueSorted(input.supportedGeographies);
  const supportedModules = uniqueSorted(input.supportedModules);
  const supportedDatasets = uniqueSorted(input.supportedDatasets);
  const supportedFreshness = uniqueSorted(input.supportedFreshness);
  const supportedConfidence = uniqueSorted(input.supportedConfidence);
  const providerCapabilities = uniqueSorted(input.providerCapabilities);
  if (!supportedCountries.length) throw new Error("Market provider must declare supported countries.");
  if (!supportedGeographies.length) throw new Error("Market provider must declare supported geographies.");
  if (!supportedModules.every(isMarketSourceModule)) throw new Error("Market provider declares unsupported modules.");
  if (!supportedDatasets.every(isMarketSourceDataset)) throw new Error("Market provider declares unsupported datasets.");
  return {
    providerId,
    supportedCountries,
    supportedGeographies,
    supportedModules,
    supportedDatasets,
    supportedFreshness,
    supportedConfidence,
    supportedRateLimits: input.supportedRateLimits,
    supportedLicensing: input.supportedLicensing,
    providerCapabilities,
  };
}

function assertAuthorized(boundary: MarketAuthorizationBoundary, workspaceId: string, dealId?: string, propertyId?: string) {
  if (!boundary.authorizedWorkspaceIds.includes(workspaceId) || boundary.workspaceId !== workspaceId) {
    throw ingestionFailureError(failure({
      code: "unauthorized_workspace",
      safeMessage: "Market ingestion request is outside the authorized workspace.",
      retryable: false,
      field: "workspaceId",
    }));
  }
  if (dealId && boundary.authorizedDealIds && !boundary.authorizedDealIds.includes(dealId)) {
    throw ingestionFailureError(failure({
      code: "unauthorized_deal",
      safeMessage: "Market ingestion request is outside the authorized Deal scope.",
      retryable: false,
      field: "dealId",
    }));
  }
  if (propertyId && boundary.authorizedPropertyIds && !boundary.authorizedPropertyIds.includes(propertyId)) {
    throw ingestionFailureError(failure({
      code: "unauthorized_property",
      safeMessage: "Market ingestion request is outside the authorized Property scope.",
      retryable: false,
      field: "propertyId",
    }));
  }
}

function unsupportedOrUnavailableProviders(request: MarketIngestionRequest, registry: MarketProviderRegistry) {
  return request.providerIds.flatMap((providerId) => {
    const provider = registry.get(providerId);
    if (!provider) return [failure({ code: "unsupported_provider", providerId, safeMessage: "Provider is not registered for MarketIQ ingestion.", retryable: false })];
    if (request.authorization.allowedProviderIds && !request.authorization.allowedProviderIds.includes(providerId)) {
      return [failure({ code: "unsupported_provider", providerId, safeMessage: "Provider is outside the authorized provider boundary.", retryable: false })];
    }
    if (provider.metadata.state === "disabled" || provider.metadata.state === "not_configured" || provider.metadata.state === "unsupported") {
      return [failure({ code: "unsupported_provider", providerId, safeMessage: "Provider is unavailable for ingestion.", retryable: false })];
    }
    if (provider.metadata.state === "maintenance" || provider.metadata.state === "offline" || provider.metadata.state === "authentication_required" || provider.metadata.state === "rate_limited") {
      return [failure({ code: "provider_unavailable", providerId, safeMessage: "Provider cannot currently accept ingestion work.", retryable: provider.metadata.state === "rate_limited" || provider.metadata.state === "offline" })];
    }
    if (provider.health.freshness.state === "stale" || provider.health.freshness.state === "superseded") {
      return [failure({ code: "provider_stale", providerId, safeMessage: "Provider declaration is stale and must be reviewed before ingestion.", retryable: false })];
    }
    return [];
  });
}

function assertMarketNormalizedSourceRecord(record: ProviderNormalizedSourceRecord): ProviderNormalizedSourceRecord {
  const normalized = assertNormalizedSourceRecord(record);
  if ("marketSnapshotId" in normalized || "marketMetricId" in normalized || "marketFindingId" in normalized) {
    throw ingestionFailureError(failure({
      code: "normalization_boundary_violation",
      providerId: normalized.provider,
      safeMessage: "Provider output may not write canonical MarketIQ records.",
      retryable: false,
    }));
  }
  if ("propertyId" in normalized || "canonicalProperty" in normalized) {
    throw ingestionFailureError(failure({
      code: "normalization_boundary_violation",
      providerId: normalized.provider,
      safeMessage: "Provider output may not write canonical Property records.",
      retryable: false,
    }));
  }
  return normalized;
}

function assertNormalizationBoundary(boundary: MarketNormalizationBoundary) {
  if (!boundary.normalizedRecordOnly || boundary.canonicalMarketRecordWriteAllowed || boundary.canonicalPropertyWriteAllowed || boundary.canonicalProviderIdsAllowed) {
    throw ingestionFailureError(failure({
      code: "normalization_boundary_violation",
      safeMessage: "Market ingestion normalization boundary is invalid.",
      retryable: false,
    }));
  }
}

function resultStatusFor(lifecycleState: MarketIngestionLifecycleState, recordCount: number, failureCount: number): MarketIngestionResultStatus {
  if (lifecycleState === "cancelled") return "cancelled";
  if (lifecycleState === "stale") return "stale";
  if (lifecycleState === "superseded") return "superseded";
  if (lifecycleState === "blocked") return "blocked";
  if (lifecycleState === "failed" || (failureCount && !recordCount)) return "failed";
  if (failureCount && recordCount) return "partial_success";
  if (lifecycleState === "partially_complete") return "partial_success";
  if (recordCount || lifecycleState === "complete") return "success";
  return "accepted";
}

function responseLifecycle(session: MarketIngestionSession, results: MarketIngestionResult[], failures: MarketIngestionFailure[]): MarketIngestionLifecycleState {
  if (failures.some((item) => item.code === "duplicate_batch" || item.code === "unauthorized_workspace")) return "blocked";
  if (results.some((result) => result.lifecycleState === "failed") && results.some((result) => result.normalizedSourceRecords.length)) return "partially_complete";
  if (results.some((result) => result.lifecycleState === "stale")) return "stale";
  if (results.some((result) => result.lifecycleState === "superseded")) return "superseded";
  if (results.length && results.every((result) => result.lifecycleState === "complete")) return failures.length ? "partially_complete" : "complete";
  return session.lifecycleState;
}

function batchLifecycle(sessions: MarketIngestionSession[], results: MarketIngestionResult[], failures: MarketIngestionFailure[]): MarketIngestionLifecycleState {
  if (failures.length && !results.length) return "blocked";
  if (sessions.some((session) => session.lifecycleState === "retrying")) return "retrying";
  if (results.length && results.every((result) => result.lifecycleState === "complete")) return failures.length ? "partially_complete" : "complete";
  if (results.length && failures.length) return "partially_complete";
  return sessions[0]?.lifecycleState ?? "requested";
}

function responseStatus(lifecycleState: MarketIngestionLifecycleState, results: MarketIngestionResult[], failures: MarketIngestionFailure[]): MarketIngestionResultStatus {
  if (lifecycleState === "complete") return "success";
  if (lifecycleState === "partially_complete") return "partial_success";
  if (lifecycleState === "blocked") return "blocked";
  if (lifecycleState === "failed" || failures.length && !results.length) return "failed";
  if (lifecycleState === "stale") return "stale";
  if (lifecycleState === "superseded") return "superseded";
  if (lifecycleState === "cancelled") return "cancelled";
  return "accepted";
}

function normalizeRetry(input: Partial<MarketRetryMetadata> | undefined, failures: MarketIngestionFailure[]): MarketRetryMetadata {
  const retryable = input?.retryable ?? failures.some((item) => item.retryable);
  const attempt = Math.max(0, Math.trunc(input?.attempt ?? 0));
  const maxAttempts = Math.max(attempt, Math.trunc(input?.maxAttempts ?? 3));
  return {
    retryable,
    attempt,
    maxAttempts,
    nextRetryAt: clean(input?.nextRetryAt),
    retryAfterSeconds: input?.retryAfterSeconds,
    backoffStrategy: input?.backoffStrategy ?? (retryable ? "exponential" : "none"),
    priorFailureHashes: uniqueSorted(input?.priorFailureHashes ?? failures.map((item) => item.deterministicHash)),
  };
}

function normalizeFreshness(input: MarketSourceFreshness): MarketSourceFreshness {
  return {
    state: input.state,
    observedAt: clean(input.observedAt),
    effectiveAt: clean(input.effectiveAt),
    retrievedAt: clean(input.retrievedAt),
    expiresAt: clean(input.expiresAt),
    staleAfterDays: input.staleAfterDays,
    reason: clean(input.reason),
  };
}

function normalizePriority(input: MarketProviderPriority): MarketProviderPriority {
  return {
    rank: Math.max(1, Math.trunc(Number.isFinite(input.rank) ? input.rank : 999)),
    tieBreaker: requiredClean(input.tieBreaker, "Market provider priority requires a deterministic tie breaker."),
    reason: clean(input.reason),
  };
}

function stableProvenance(input: readonly MarketProviderProvenance[]) {
  return input.map(createMarketProviderProvenance).sort((a, b) => stableSerialize(a).localeCompare(stableSerialize(b)));
}

function stableFailures(input: readonly MarketIngestionFailure[]) {
  const map = new Map<string, MarketIngestionFailure>();
  for (const item of input) map.set(item.deterministicHash, item);
  return [...map.values()].sort((a, b) => a.deterministicHash.localeCompare(b.deterministicHash));
}

function failure(input: Omit<MarketIngestionFailure, "failureId" | "deterministicHash">): MarketIngestionFailure {
  const basis = {
    providerId: normalizeProviderId(input.providerId),
    code: input.code,
    safeMessage: requiredClean(input.safeMessage, "Market ingestion failure requires a safe message."),
    retryable: input.retryable,
    field: clean(input.field),
  };
  const deterministicHash = `mi_failh_${stableHash(basis).slice(0, 24)}`;
  return {
    ...basis,
    failureId: `mi_fail_${stableHash({ ...basis, retryable: undefined }).slice(0, 24)}`,
    deterministicHash,
  };
}

function ingestionFailureError(item: MarketIngestionFailure) {
  return Object.assign(new Error(item.safeMessage), { failure: item });
}

function resultOrderingKey(result: MarketIngestionResult) {
  return [
    String(1000 - result.normalizedSourceRecords.length).padStart(4, "0"),
    result.providerId,
    result.resultId,
  ].join(":");
}

function duplicates(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicate = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate].sort();
}

function uniqueSorted<T extends string>(values: readonly T[]) {
  return [...new Set(values.map((value) => clean(value)).filter((value): value is T => Boolean(value)))].sort();
}

function normalizeProviderId(value?: string) {
  return clean(value)?.toLowerCase().replace(/[^a-z0-9_:-]+/g, "_").replace(/^_+|_+$/g, "") ?? "";
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

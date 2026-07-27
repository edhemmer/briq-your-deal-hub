import type { DuplicateIdentity } from "./duplicateDetection";
import type { SourceConflictValue } from "./sourceConflicts";
import {
  classifySource,
  serializeSourceClassification,
  type SourceClassificationResult,
} from "./sourceClassification";

export const PROVIDER_ADAPTER_FRAMEWORK_VERSION = "provider-adapter-framework-v1";
export const PROVIDER_RESPONSE_CONTRACT_VERSION = 1;

export const providerStates = [
  "disabled",
  "not_configured",
  "healthy",
  "degraded",
  "maintenance",
  "rate_limited",
  "authentication_required",
  "unsupported",
  "offline",
] as const;

export const providerCapabilities = [
  "address_lookup",
  "parcel_lookup",
  "listing_lookup",
  "photo_support",
  "document_support",
  "valuation_support",
  "history_support",
  "owner_support",
  "tax_support",
  "permit_support",
  "environment_support",
  "school_support",
  "crime_support",
  "walk_score_support",
  "rental_support",
  "commercial_support",
  "international_support",
] as const;

export const providerErrorCodes = [
  "provider_disabled",
  "provider_not_configured",
  "provider_unsupported",
  "provider_offline",
  "provider_maintenance",
  "provider_rate_limited",
  "provider_authentication_required",
  "provider_timeout",
  "provider_unavailable",
  "provider_invalid_request",
  "provider_invalid_response",
  "provider_license_restricted",
  "normalization_failed",
  "unknown_provider_error",
] as const;

export type ProviderState = typeof providerStates[number];
export type ProviderCapability = typeof providerCapabilities[number];
export type ProviderErrorCode = typeof providerErrorCodes[number];
export type ProviderResponseStatus = "success" | "partial" | "empty" | "failed" | "unsupported";
export type ProviderConfidence = "verified" | "source_backed" | "estimated" | "unknown";
export type ProviderAvailability = {
  state: ProviderState;
  checkedAt: string;
  reason?: string;
  retryAfterSeconds?: number;
};

export type ProviderVersion = {
  frameworkVersion: typeof PROVIDER_ADAPTER_FRAMEWORK_VERSION;
  adapterVersion: string;
  contractVersion: typeof PROVIDER_RESPONSE_CONTRACT_VERSION;
};

export type ProviderMetadata = {
  providerId: string;
  displayName: string;
  version: ProviderVersion;
  state: ProviderState;
  capabilities: readonly ProviderCapability[];
  supportedCountries?: readonly string[];
  supportedRegions?: readonly string[];
  licenseSummary?: string;
};

export type ProviderConfiguration = {
  providerId: string;
  enabled: false;
  state: Extract<ProviderState, "disabled" | "not_configured" | "unsupported">;
  requestedCapabilities?: readonly ProviderCapability[];
  environment?: "production" | "staging" | "development";
};

export type ProviderHealth = {
  providerId: string;
  state: ProviderState;
  checkedAt: string;
  availability: ProviderAvailability;
  latencyMs?: number;
  warningCount: number;
  errorCount: number;
};

export type ProviderRateLimit = {
  limited: boolean;
  limit?: number;
  remaining?: number;
  resetAt?: string;
  retryAfterSeconds?: number;
};

export type ProviderRequestContext = {
  workspaceId: string;
  requestId: string;
  requestedAt: string;
  capability: ProviderCapability;
  subject?: {
    propertyId?: string;
    dealId?: string;
    sourceRecordId?: string;
  };
  inputSummary: Record<string, string | number | boolean | null>;
};

export type ProviderProvenance = {
  sourceClassification: SourceClassificationResult;
  providerId: string;
  sourceName: string;
  sourceRecordId?: string;
  evidenceId?: string;
  sourceUrl?: string;
  sourceIdentifier?: string;
  retrievedAt: string;
  effectiveAt?: string;
  licenseUse?: string;
  confidence: ProviderConfidence;
};

export type ProviderNormalizedValue = {
  subjectType: "property" | "deal" | "source_record" | "evidence" | "assumption";
  targetField: string;
  rawValue: string | number | boolean | null;
  normalizedValue: string | number | boolean | null;
  displayValue?: string;
  unit?: string;
  currency?: string;
  period?: string;
  scope?: string;
  effectiveDate?: string;
  confidence: ProviderConfidence;
  provenance: ProviderProvenance;
};

export type ProviderNormalizedSourceRecord = {
  sourceRecordKey: string;
  provider: string;
  providerVersion: ProviderVersion;
  sourceType: string;
  status: ProviderResponseStatus;
  provenance: ProviderProvenance;
  values: ProviderNormalizedValue[];
  duplicateIdentity?: DuplicateIdentity;
  conflictValues?: SourceConflictValue[];
  metadata: Record<string, string | number | boolean | null>;
};

export type ProviderWarning = {
  code: string;
  message: string;
  field?: string;
};

export type ProviderError = {
  code: ProviderErrorCode;
  message: string;
  retryable: boolean;
  field?: string;
};

export type ProviderResponse<TRawPayload = unknown> = {
  status: ProviderResponseStatus;
  provider: string;
  version: ProviderVersion;
  requestId: string;
  processingTimeMs: number;
  confidence: ProviderConfidence;
  rawPayload: TRawPayload;
  normalizedPayload: ProviderNormalizedSourceRecord[];
  provenance: ProviderProvenance[];
  warnings: ProviderWarning[];
  errors: ProviderError[];
  rateLimit?: ProviderRateLimit;
  availability: ProviderAvailability;
};

export type ProviderNormalizationInput<TRawPayload = unknown> = {
  metadata: ProviderMetadata;
  request: ProviderRequestContext;
  rawPayload: TRawPayload;
  retrievedAt: string;
};

export type ProviderAdapter<TRawPayload = unknown> = {
  metadata: ProviderMetadata;
  getHealth: () => Promise<ProviderHealth> | ProviderHealth;
  normalize: (input: ProviderNormalizationInput<TRawPayload>) => ProviderResponse<TRawPayload>;
};

export type ProviderRegistry = ReadonlyMap<string, ProviderAdapter<unknown>>;

const providerRegistry: ProviderRegistry = new Map();

export function getProviderRegistry(): ProviderRegistry {
  return providerRegistry;
}

export function listRegisteredProviders(): ProviderMetadata[] {
  return [];
}

export function getProviderAdapter(_providerId: string): ProviderAdapter<unknown> | undefined {
  return undefined;
}

export function isProviderCapability(value: string): value is ProviderCapability {
  return providerCapabilities.includes(value as ProviderCapability);
}

export function isProviderState(value: string): value is ProviderState {
  return providerStates.includes(value as ProviderState);
}

export function createDisabledProviderConfiguration(providerId: string): ProviderConfiguration {
  const cleanedProviderId = normalizeProviderId(providerId);
  if (!cleanedProviderId) throw new Error("Provider configuration requires a provider id.");
  return {
    providerId: cleanedProviderId,
    enabled: false,
    state: "disabled",
  };
}

export function createProviderVersion(adapterVersion: string): ProviderVersion {
  const cleanedAdapterVersion = clean(adapterVersion);
  if (!cleanedAdapterVersion) throw new Error("Provider adapter version is required.");
  return {
    frameworkVersion: PROVIDER_ADAPTER_FRAMEWORK_VERSION,
    adapterVersion: cleanedAdapterVersion,
    contractVersion: PROVIDER_RESPONSE_CONTRACT_VERSION,
  };
}

export function createProviderProvenance(input: {
  providerId: string;
  sourceName: string;
  sourceType: string;
  retrievedAt: string;
  confidence?: ProviderConfidence;
  sourceRecordId?: string;
  evidenceId?: string;
  sourceUrl?: string;
  sourceIdentifier?: string;
  effectiveAt?: string;
  licenseUse?: string;
}): ProviderProvenance {
  const providerId = normalizeProviderId(input.providerId);
  const sourceName = clean(input.sourceName);
  const sourceType = clean(input.sourceType);
  const retrievedAt = clean(input.retrievedAt);
  if (!providerId || !sourceName || !sourceType || !retrievedAt) {
    throw new Error("Provider provenance requires provider, source, source type, and retrieval time.");
  }
  const sourceClassification = classifySource({
    sourceType,
    sourceName: `${sourceName} ${sourceType.replace(/_/g, " ")}`,
    sourceUrl: clean(input.sourceUrl),
    providerKind: providerId,
    metadata: { providerKind: providerId },
  });
  return {
    sourceClassification: serializeSourceClassification(sourceClassification),
    providerId,
    sourceName,
    sourceRecordId: clean(input.sourceRecordId),
    evidenceId: clean(input.evidenceId),
    sourceUrl: clean(input.sourceUrl),
    sourceIdentifier: clean(input.sourceIdentifier),
    retrievedAt,
    effectiveAt: clean(input.effectiveAt),
    licenseUse: clean(input.licenseUse),
    confidence: input.confidence ?? "unknown",
  };
}

export function createProviderResponse<TRawPayload>(input: {
  status: ProviderResponseStatus;
  metadata: ProviderMetadata;
  requestId: string;
  processingTimeMs: number;
  confidence: ProviderConfidence;
  rawPayload: TRawPayload;
  normalizedPayload?: ProviderNormalizedSourceRecord[];
  provenance?: ProviderProvenance[];
  warnings?: ProviderWarning[];
  errors?: ProviderError[];
  rateLimit?: ProviderRateLimit;
  availability?: ProviderAvailability;
}): ProviderResponse<TRawPayload> {
  const requestId = clean(input.requestId);
  if (!requestId) throw new Error("Provider response requires a request id.");
  assertProviderMetadata(input.metadata);
  return {
    status: input.status,
    provider: input.metadata.providerId,
    version: input.metadata.version,
    requestId,
    processingTimeMs: Math.max(0, Math.round(input.processingTimeMs)),
    confidence: input.confidence,
    rawPayload: input.rawPayload,
    normalizedPayload: input.normalizedPayload ?? [],
    provenance: input.provenance ?? [],
    warnings: input.warnings ?? [],
    errors: input.errors ?? [],
    rateLimit: input.rateLimit,
    availability: input.availability ?? {
      state: input.metadata.state,
      checkedAt: new Date(0).toISOString(),
    },
  };
}

export function assertNormalizedSourceRecord(record: ProviderNormalizedSourceRecord): ProviderNormalizedSourceRecord {
  if (!clean(record.sourceRecordKey)) throw new Error("Normalized source record requires a stable source record key.");
  if (!clean(record.provider)) throw new Error("Normalized source record requires provider provenance.");
  if (!record.values.every((value) => value.provenance.providerId === record.provenance.providerId)) {
    throw new Error("Normalized source values must preserve the same provider provenance boundary.");
  }
  return record;
}

export function assertProviderMetadata(metadata: ProviderMetadata): ProviderMetadata {
  const providerId = normalizeProviderId(metadata.providerId);
  if (!providerId) throw new Error("Provider metadata requires a provider id.");
  if (providerId !== metadata.providerId) throw new Error("Provider id must already be normalized.");
  if (!clean(metadata.displayName)) throw new Error("Provider metadata requires a display name.");
  if (metadata.version.frameworkVersion !== PROVIDER_ADAPTER_FRAMEWORK_VERSION) throw new Error("Unsupported provider framework version.");
  if (metadata.version.contractVersion !== PROVIDER_RESPONSE_CONTRACT_VERSION) throw new Error("Unsupported provider response contract version.");
  if (!isProviderState(metadata.state)) throw new Error("Unsupported provider state.");
  for (const capability of metadata.capabilities) {
    if (!isProviderCapability(capability)) throw new Error(`Unsupported provider capability: ${capability}`);
  }
  return metadata;
}

function normalizeProviderId(value: string) {
  return clean(value).toLowerCase().replace(/[^a-z0-9_:-]+/g, "_").replace(/^_+|_+$/g, "");
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

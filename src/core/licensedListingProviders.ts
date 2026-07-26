import type { Json } from "./supabaseDatabase.types";
import type { ListingUrlProposal } from "./types";

export const LISTING_PROVIDER_FEATURE_FLAG = "licensed_listing_provider_integration" as const;
export const LISTING_PROVIDER_SCAFFOLD_VERSION = "licensed-listing-provider-scaffold-v1" as const;

export type ListingProviderType = "licensed_listing_provider";
export type ListingProviderAvailability = "disabled" | "test_only" | "staging" | "production";
export type ListingProviderConfigurationState = "not_configured" | "configured";
export type ListingProviderLicensingState = "not_licensed" | "licensed";
export type ListingProviderResultErrorCode =
  | "disabled"
  | "not_configured"
  | "not_licensed"
  | "unknown_provider"
  | "unsupported_operation"
  | "invalid_provider_identity";

export type ListingProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ListingProviderSafeError };

export type ListingProviderSafeError = {
  code: ListingProviderResultErrorCode;
  category: "disabled" | "configuration" | "authorization" | "validation" | "unsupported";
  safeMessage: string;
  retryable: false;
};

export type ListingProviderCapabilities = {
  listingSearch: boolean;
  listingLookup: boolean;
  propertyLookup: boolean;
  listingHistory: boolean;
  statusUpdates: boolean;
  mediaReferences: boolean;
  openHouseData: boolean;
  agentOrBrokerageData: boolean;
  parcelOrTaxData: boolean;
  pagination: boolean;
  incrementalSynchronization: boolean;
};

export type ListingProviderRestrictions = {
  dataRetentionCategory: "none" | "metadata_only" | "licensed_contract_required";
  displayRestrictions: string[];
  attributionRequired: boolean;
  refreshInterval: "none" | "provider_terms_required";
  deletionRequirement: "none" | "provider_terms_required";
  fieldLevelUseRestrictions: string[];
  mediaRestrictions: string[];
  geographicScope: string[];
  licensingNotes: string;
};

export type ListingProviderDefinition = {
  providerKey: string;
  displayName: string;
  providerType: ListingProviderType;
  enabled: boolean;
  configured: boolean;
  configurationState: ListingProviderConfigurationState;
  licensingState: ListingProviderLicensingState;
  environmentAvailability: ListingProviderAvailability;
  adapterVersion: string;
  featureFlag: typeof LISTING_PROVIDER_FEATURE_FLAG;
  licenseRequired: true;
  capabilities: ListingProviderCapabilities;
  restrictions: ListingProviderRestrictions;
};

export type ServerListingProviderFeatureState = {
  featureFlag: typeof LISTING_PROVIDER_FEATURE_FLAG;
  enabledByServer: boolean;
  approvedProviderKeys: string[];
  licensingConfirmed: boolean;
  configurationConfirmed: boolean;
};

export type ListingProviderSourceIdentity = {
  providerKey: string;
  providerListingId: string;
  providerPropertyId?: string;
  sourceUrl?: string;
  sourceVersion?: string;
  retrievedAt: string;
  effectiveAt?: string;
  geographicScope?: string;
  attribution?: Record<string, Json>;
  licensing?: ListingProviderLicensingMetadata;
};

export type ListingProviderLicensingMetadata = {
  retentionCategory: ListingProviderRestrictions["dataRetentionCategory"];
  displayRestrictions: string[];
  attributionRequired: boolean;
  deletionRequirement: ListingProviderRestrictions["deletionRequirement"];
  licensingNotes?: string;
};

export type NormalizedListingProviderValue = {
  field:
    | ListingUrlProposal["field"]
    | "unit"
    | "country"
    | "coordinates"
    | "listing_status"
    | "original_list_price"
    | "bedrooms"
    | "bathrooms"
    | "building_area"
    | "lot_size"
    | "year_built"
    | "unit_count"
    | "listing_dates"
    | "source_agent_or_brokerage"
    | "attribution"
    | "media_reference";
  providerSource: ListingProviderSourceIdentity;
  providerFieldPath: string;
  rawValue: Json;
  normalizedValue: Json;
  displayValue: string;
  effectiveAt?: string;
  retrievedAt: string;
  classification: "source_backed_candidate" | "external_estimate" | "unknown";
  verificationState: "unverified";
  adapterVersion: string;
  licensing: ListingProviderLicensingMetadata;
};

export type NormalizedListingProviderPayload = {
  sourceIdentity: ListingProviderSourceIdentity;
  adapterVersion: string;
  proposedValues: NormalizedListingProviderValue[];
  rawProviderFieldReferences: Record<string, string>;
};

export type ListingProviderConfigurationReference = {
  providerKey: string;
  serverConfigurationRef: string;
  configurationState: ListingProviderConfigurationState;
  licensingState: ListingProviderLicensingState;
};

export type ListingProviderAdapter = {
  providerKey: string;
  adapterVersion: string;
  validateConfiguration(configuration?: ListingProviderConfigurationReference): ListingProviderResult<ListingProviderConfigurationState>;
  getCapabilities(): ListingProviderResult<ListingProviderCapabilities>;
  searchListings(): Promise<ListingProviderResult<NormalizedListingProviderPayload[]>>;
  getListing(identity: ListingProviderSourceIdentity): Promise<ListingProviderResult<NormalizedListingProviderPayload>>;
  normalizeListing(payload: unknown): ListingProviderResult<NormalizedListingProviderPayload>;
  mapProviderError(error: unknown): ListingProviderSafeError;
  getAttribution(identity?: ListingProviderSourceIdentity): ListingProviderResult<Record<string, Json>>;
  getRetentionPolicy(): ListingProviderResult<ListingProviderLicensingMetadata>;
};

export const disabledListingProviderCapabilities: ListingProviderCapabilities = Object.freeze({
  listingSearch: false,
  listingLookup: false,
  propertyLookup: false,
  listingHistory: false,
  statusUpdates: false,
  mediaReferences: false,
  openHouseData: false,
  agentOrBrokerageData: false,
  parcelOrTaxData: false,
  pagination: false,
  incrementalSynchronization: false,
});

export const disabledListingProviderRestrictions: ListingProviderRestrictions = Object.freeze({
  dataRetentionCategory: "none",
  displayRestrictions: [],
  attributionRequired: false,
  refreshInterval: "none",
  deletionRequirement: "none",
  fieldLevelUseRestrictions: [],
  mediaRestrictions: [],
  geographicScope: [],
  licensingNotes: "No licensed listing provider is configured.",
});

export const defaultListingProviderFeatureState: ServerListingProviderFeatureState = Object.freeze({
  featureFlag: LISTING_PROVIDER_FEATURE_FLAG,
  enabledByServer: false,
  approvedProviderKeys: [],
  licensingConfirmed: false,
  configurationConfirmed: false,
});

export const disabledListingProviderAdapter: ListingProviderAdapter = Object.freeze({
  providerKey: "disabled",
  adapterVersion: LISTING_PROVIDER_SCAFFOLD_VERSION,
  validateConfiguration() {
    return failure("disabled");
  },
  getCapabilities() {
    return { ok: true, data: disabledListingProviderCapabilities };
  },
  async searchListings() {
    return failure("disabled");
  },
  async getListing(identity: ListingProviderSourceIdentity) {
    const validation = validateListingProviderSourceIdentity(identity);
    return validation.ok ? failure("disabled") : failure("invalid_provider_identity");
  },
  normalizeListing() {
    return failure("disabled");
  },
  mapProviderError() {
    return safeError("disabled");
  },
  getAttribution() {
    return { ok: true, data: {} };
  },
  getRetentionPolicy() {
    return {
      ok: true,
      data: {
        retentionCategory: "none",
        displayRestrictions: [],
        attributionRequired: false,
        deletionRequirement: "none",
        licensingNotes: "No licensed listing provider is configured.",
      },
    };
  },
});

export function createListingProviderRegistry(definitions: ListingProviderDefinition[] = []) {
  const normalized = definitions.map(normalizeProviderDefinition);
  const seen = new Set<string>();
  for (const definition of normalized) {
    if (seen.has(definition.providerKey)) throw new Error(`Duplicate listing provider key: ${definition.providerKey}`);
    seen.add(definition.providerKey);
  }

  const providers = new Map(normalized.map((definition) => [definition.providerKey, definition]));

  return Object.freeze({
    providers: Object.freeze([...providers.values()]),
    hasDefaultProvider: false,
    getDefaultProvider(): ListingProviderDefinition | undefined {
      return undefined;
    },
    getProvider(providerKey: string): ListingProviderDefinition | undefined {
      return providers.get(normalizeProviderKey(providerKey));
    },
    enabledProviders(): ListingProviderDefinition[] {
      return [...providers.values()].filter((provider) => provider.enabled);
    },
    configuredProviders(): ListingProviderDefinition[] {
      return [...providers.values()].filter((provider) => provider.configured);
    },
    getAdapter(providerKey: string, featureState: ServerListingProviderFeatureState = defaultListingProviderFeatureState): ListingProviderAdapter {
      const normalizedKey = normalizeProviderKey(providerKey);
      const provider = providers.get(normalizedKey);
      if (!provider) return disabledAdapterFor(normalizedKey, "unknown_provider");
      if (!isListingProviderFeatureAvailable(featureState, provider)) {
        const code = !provider.enabled ? "disabled" : !provider.configured ? "not_configured" : "not_licensed";
        return disabledAdapterFor(normalizedKey, code);
      }
      return disabledAdapterFor(normalizedKey, "disabled");
    },
    routeAvailable(pathname: string, featureState: ServerListingProviderFeatureState = defaultListingProviderFeatureState): boolean {
      return resolveListingProviderRouteAccess(pathname, featureState, [...providers.values()]);
    },
  });
}

export const listingProviderRegistry = createListingProviderRegistry();

export function normalizeProviderKey(providerKey: string) {
  const normalized = providerKey.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!normalized) throw new Error("Listing provider key is required.");
  return normalized;
}

export function providerListingIdentityKey(identity: ListingProviderSourceIdentity) {
  const validation = validateListingProviderSourceIdentity(identity);
  if (validation.ok === false) throw new Error(validation.error.safeMessage);
  return `${normalizeProviderKey(identity.providerKey)}:${identity.providerListingId.trim()}`;
}

export function validateListingProviderSourceIdentity(identity: ListingProviderSourceIdentity): ListingProviderResult<ListingProviderSourceIdentity> {
  try {
    const providerKey = normalizeProviderKey(identity.providerKey);
    const providerListingId = identity.providerListingId.trim();
    if (!providerListingId) return failure("invalid_provider_identity");
    return { ok: true, data: { ...identity, providerKey, providerListingId } };
  } catch {
    return failure("invalid_provider_identity");
  }
}

export function isListingProviderFeatureAvailable(
  featureState: ServerListingProviderFeatureState,
  provider?: ListingProviderDefinition,
) {
  if (featureState.featureFlag !== LISTING_PROVIDER_FEATURE_FLAG) return false;
  if (!featureState.enabledByServer || !featureState.configurationConfirmed || !featureState.licensingConfirmed) return false;
  if (!provider || !provider.enabled || !provider.configured || provider.licensingState !== "licensed") return false;
  return featureState.approvedProviderKeys.map(normalizeProviderKey).includes(provider.providerKey);
}

export function resolveListingProviderRouteAccess(
  pathname: string,
  featureState: ServerListingProviderFeatureState = defaultListingProviderFeatureState,
  providers: ListingProviderDefinition[] = [],
) {
  if (!/^\/?(listing-providers|licensed-listing-providers|provider-listings)(\/|$)/i.test(pathname)) return false;
  return providers.some((provider) => isListingProviderFeatureAvailable(featureState, provider));
}

export function normalizeProviderDefinition(definition: ListingProviderDefinition): ListingProviderDefinition {
  const providerKey = normalizeProviderKey(definition.providerKey);
  return {
    ...definition,
    providerKey,
    providerType: "licensed_listing_provider",
    featureFlag: LISTING_PROVIDER_FEATURE_FLAG,
    licenseRequired: true,
    enabled: Boolean(definition.enabled),
    configured: Boolean(definition.configured),
    configurationState: definition.configured ? "configured" : "not_configured",
    licensingState: definition.licensingState === "licensed" ? "licensed" : "not_licensed",
    capabilities: { ...disabledListingProviderCapabilities, ...definition.capabilities },
    restrictions: { ...disabledListingProviderRestrictions, ...definition.restrictions },
  };
}

function disabledAdapterFor(providerKey: string, code: ListingProviderResultErrorCode): ListingProviderAdapter {
  return {
    ...disabledListingProviderAdapter,
    providerKey,
    validateConfiguration() {
      return failure(code);
    },
    async searchListings() {
      return failure(code);
    },
    async getListing(identity: ListingProviderSourceIdentity) {
      const validation = validateListingProviderSourceIdentity(identity);
      return validation.ok ? failure(code) : failure("invalid_provider_identity");
    },
    normalizeListing() {
      return failure(code);
    },
    mapProviderError() {
      return safeError(code);
    },
  };
}

function failure<T = never>(code: ListingProviderResultErrorCode): ListingProviderResult<T> {
  return { ok: false, error: safeError(code) };
}

function safeError(code: ListingProviderResultErrorCode): ListingProviderSafeError {
  const messages: Record<ListingProviderResultErrorCode, ListingProviderSafeError> = {
    disabled: {
      code,
      category: "disabled",
      safeMessage: "Licensed listing provider integration is disabled.",
      retryable: false,
    },
    not_configured: {
      code,
      category: "configuration",
      safeMessage: "Licensed listing provider integration is not configured.",
      retryable: false,
    },
    not_licensed: {
      code,
      category: "authorization",
      safeMessage: "Licensed listing provider access is not licensed.",
      retryable: false,
    },
    unknown_provider: {
      code,
      category: "unsupported",
      safeMessage: "The listing data provider is not registered.",
      retryable: false,
    },
    unsupported_operation: {
      code,
      category: "unsupported",
      safeMessage: "This listing provider operation is not available.",
      retryable: false,
    },
    invalid_provider_identity: {
      code,
      category: "validation",
      safeMessage: "The listing source identity is incomplete.",
      retryable: false,
    },
  };
  return messages[code];
}

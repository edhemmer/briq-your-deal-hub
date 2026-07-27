import { describe, expect, it } from "vitest";
import {
  PROVIDER_ADAPTER_FRAMEWORK_VERSION,
  PROVIDER_RESPONSE_CONTRACT_VERSION,
  assertNormalizedSourceRecord,
  assertProviderMetadata,
  createDisabledProviderConfiguration,
  createProviderProvenance,
  createProviderResponse,
  createProviderVersion,
  getProviderAdapter,
  getProviderRegistry,
  isProviderCapability,
  isProviderState,
  listRegisteredProviders,
  providerCapabilities,
  providerErrorCodes,
  providerStates,
  type ProviderMetadata,
  type ProviderNormalizedSourceRecord,
} from "../core/providerAdapters";

describe("canonical provider adapter framework", () => {
  const version = createProviderVersion("adapter-v1");
  const metadata: ProviderMetadata = {
    providerId: "future_provider",
    displayName: "Future Provider",
    version,
    state: "disabled",
    capabilities: ["address_lookup", "tax_support", "photo_support"],
  };

  it("defines the approved provider states and capabilities", () => {
    expect(providerStates).toEqual([
      "disabled",
      "not_configured",
      "healthy",
      "degraded",
      "maintenance",
      "rate_limited",
      "authentication_required",
      "unsupported",
      "offline",
    ]);
    expect(providerCapabilities).toContain("address_lookup");
    expect(providerCapabilities).toContain("parcel_lookup");
    expect(providerCapabilities).toContain("listing_lookup");
    expect(providerCapabilities).toContain("commercial_support");
    expect(providerCapabilities).toContain("international_support");
    expect(providerCapabilities).toHaveLength(17);
    expect(isProviderState("rate_limited")).toBe(true);
    expect(isProviderCapability("owner_support")).toBe(true);
    expect(isProviderCapability("canonical_property")).toBe(false);
  });

  it("keeps the provider registry present but empty", () => {
    expect(getProviderRegistry().size).toBe(0);
    expect(listRegisteredProviders()).toEqual([]);
    expect(getProviderAdapter("future_provider")).toBeUndefined();
  });

  it("creates disabled configuration without credentials, secrets, OAuth, tokens, or endpoints", () => {
    expect(createDisabledProviderConfiguration(" Future Provider ")).toEqual({
      providerId: "future_provider",
      enabled: false,
      state: "disabled",
    });
  });

  it("requires versioned provider metadata and validates supported capabilities", () => {
    expect(version).toEqual({
      frameworkVersion: PROVIDER_ADAPTER_FRAMEWORK_VERSION,
      adapterVersion: "adapter-v1",
      contractVersion: PROVIDER_RESPONSE_CONTRACT_VERSION,
    });
    expect(assertProviderMetadata(metadata)).toEqual(metadata);
    expect(() => assertProviderMetadata({ ...metadata, providerId: "Future Provider" })).toThrow("Provider id must already be normalized.");
  });

  it("returns only normalized source records, never canonical Property objects", () => {
    const provenance = createProviderProvenance({
      providerId: metadata.providerId,
      sourceName: metadata.displayName,
      sourceType: "tax_record",
      retrievedAt: "2026-07-27T14:30:00.000Z",
      confidence: "source_backed",
      sourceIdentifier: "source-1",
    });
    const sourceRecord: ProviderNormalizedSourceRecord = assertNormalizedSourceRecord({
      sourceRecordKey: "future_provider:source-1",
      provider: metadata.providerId,
      providerVersion: metadata.version,
      sourceType: "tax_record",
      status: "success",
      provenance,
      values: [{
        subjectType: "property",
        targetField: "annual_property_tax",
        rawValue: 6100,
        normalizedValue: 6100,
        displayValue: "$6,100",
        currency: "USD",
        period: "annual",
        confidence: "source_backed",
        provenance,
      }],
      metadata: { rowCount: 1 },
    });
    const response = createProviderResponse({
      status: "success",
      metadata,
      requestId: "request-1",
      processingTimeMs: 18.4,
      confidence: "source_backed",
      rawPayload: { providerSpecific: true },
      normalizedPayload: [sourceRecord],
      provenance: [provenance],
    });

    expect(response).toMatchObject({
      status: "success",
      provider: "future_provider",
      requestId: "request-1",
      processingTimeMs: 18,
      confidence: "source_backed",
    });
    expect(response.normalizedPayload[0]).not.toHaveProperty("propertyId");
    expect(response.normalizedPayload[0]).not.toHaveProperty("canonicalProperty");
    expect(response.provenance[0].sourceClassification.canonicalClass).toBe("tax_record");
  });

  it("preserves warning, error, rate-limit, and availability contracts", () => {
    expect(providerErrorCodes).toContain("provider_rate_limited");
    const response = createProviderResponse({
      status: "failed",
      metadata: { ...metadata, state: "rate_limited" },
      requestId: "request-2",
      processingTimeMs: -5,
      confidence: "unknown",
      rawPayload: null,
      warnings: [{ code: "partial_scope", message: "Only part of the requested geography is available." }],
      errors: [{ code: "provider_rate_limited", message: "Provider is rate limited.", retryable: true }],
      rateLimit: { limited: true, retryAfterSeconds: 60 },
      availability: { state: "rate_limited", checkedAt: "2026-07-27T14:31:00.000Z", retryAfterSeconds: 60 },
    });

    expect(response.processingTimeMs).toBe(0);
    expect(response.errors[0].retryable).toBe(true);
    expect(response.rateLimit?.limited).toBe(true);
    expect(response.availability.state).toBe("rate_limited");
  });
});

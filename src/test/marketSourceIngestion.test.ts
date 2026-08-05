import { describe, expect, it } from "vitest";
import { buildCanonicalLocationIdentity, type CanonicalLocationIdentity } from "../core/locationIdentity";
import {
  buildExternalLocationReference,
} from "../core/locationIdentity";
import {
  assertNormalizedSourceRecord,
  createProviderProvenance,
  createProviderVersion,
  type ProviderMetadata,
  type ProviderNormalizedSourceRecord,
} from "../core/providerAdapters";
import {
  MARKET_SOURCE_BATCH_CONTRACT_VERSION,
  MARKET_SOURCE_INGESTION_CONTRACT_VERSION,
  MARKET_SOURCE_PROVIDER_CONTRACT_VERSION,
  MARKET_SOURCE_RESULT_CONTRACT_VERSION,
  acceptMarketIngestionRequest,
  buildMarketIngestionBatch,
  buildMarketIngestionRequest,
  buildMarketIngestionResponse,
  buildMarketIngestionResult,
  buildMarketProviderDeclaration,
  createMarketProviderProvenance,
  createMarketProviderRegistry,
  isMarketIngestionLifecycleState,
  isMarketSourceDataset,
  isMarketSourceModule,
  marketIngestionDiagnostics,
  marketIngestionLifecycleStates,
  marketNormalizationBoundary,
  marketSourceDatasets,
  marketSourceModules,
  type MarketProviderDeclaration,
} from "../core/marketSourceIngestion";

describe("provider-neutral MarketIQ source ingestion contract", () => {
  const location = (): CanonicalLocationIdentity => buildCanonicalLocationIdentity({
    workspaceId: "workspace-1",
    propertyId: "property-1",
    locationKind: "property_site",
    geographicLevel: "address",
    addressLine1: "204 Oak Ridge Ave",
    municipality: "Cortland",
    regionCode: "IL",
    postalCode: "60112",
    countryCode: "US",
    verificationState: "source_backed",
    confidenceTier: "moderate",
    freshnessState: "current",
    sourceReferences: [{
      sourceRecordId: "source-1",
      sourceName: "Manual Intake",
      observedAt: "2026-07-27T14:30:00.000Z",
    }],
  });

  const providerMetadata = (providerId = "future_market_provider", state: ProviderMetadata["state"] = "healthy"): ProviderMetadata => ({
    providerId,
    displayName: "Future Market Provider",
    version: createProviderVersion("market-adapter-v1"),
    state,
    capabilities: ["address_lookup", "tax_support", "environment_support"],
    supportedCountries: ["US"],
  });

  const provider = (providerId = "future_market_provider", state: ProviderMetadata["state"] = "healthy"): MarketProviderDeclaration => buildMarketProviderDeclaration({
    metadata: providerMetadata(providerId, state),
    priority: { rank: providerId === "county_context" ? 1 : 2, tieBreaker: providerId },
    health: {
      state,
      checkedAt: "2026-07-27T14:30:00.000Z",
      availability: { state, checkedAt: "2026-07-27T14:30:00.000Z" },
      freshness: { state: state === "healthy" ? "current" : "unknown", retrievedAt: "2026-07-27T14:29:00.000Z" },
    },
    capabilityDeclaration: {
      providerId,
      supportedCountries: ["US"],
      supportedGeographies: ["address", "county", "municipality"],
      supportedModules: ["taxes", "hazards", "convenience"],
      supportedDatasets: ["property_tax", "flood", "grocery_access"],
      supportedFreshness: ["current", "stale", "unknown"],
      supportedConfidence: ["source_backed", "estimated", "unknown"],
      supportedLicensing: { licenseType: "public", attributionRequired: true },
      providerCapabilities: ["address_lookup", "tax_support", "environment_support"],
    },
  });

  const request = (providerIds = ["future_market_provider"]) => buildMarketIngestionRequest({
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    location: location(),
    requestedModules: ["taxes", "hazards", "convenience"],
    requestedDatasets: ["property_tax", "flood", "grocery_access"],
    requestedGeographyLevels: ["address", "county"],
    providerIds,
    requestedAt: "2026-07-27T14:31:00.000Z",
    idempotencyKey: "market-ingestion-1",
    authorization: {
      workspaceId: "workspace-1",
      authorizedWorkspaceIds: ["workspace-1"],
      authorizedDealIds: ["deal-1"],
      authorizedPropertyIds: ["property-1"],
      allowedProviderIds: providerIds,
      actorId: "user-1",
    },
    validationBoundary: {
      acceptedSourceClasses: ["tax_record", "map"],
      requiredFields: ["value", "period", "geography"],
    },
  });

  const sourceRecord = (providerId = "future_market_provider"): ProviderNormalizedSourceRecord => {
    const provenance = createProviderProvenance({
      providerId,
      sourceName: "Future County Tax Feed",
      sourceType: "tax_record",
      sourceRecordId: "tax-record-1",
      retrievedAt: "2026-07-27T14:31:10.000Z",
      effectiveAt: "2025-01-01",
      confidence: "source_backed",
      evidenceId: "evidence-1",
    });
    return assertNormalizedSourceRecord({
      sourceRecordKey: `${providerId}:tax-record-1`,
      provider: providerId,
      providerVersion: createProviderVersion("market-adapter-v1"),
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
      metadata: { geography: "county" },
    });
  };

  it("declares the approved lifecycle, modules, datasets, and normalized-only boundary", () => {
    expect(marketIngestionLifecycleStates).toEqual([
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
    ]);
    expect(marketSourceModules).toContain("taxes");
    expect(marketSourceModules).toContain("convenience");
    expect(marketSourceDatasets).toContain("property_tax");
    expect(marketSourceDatasets).toContain("healthcare_access");
    expect(isMarketIngestionLifecycleState("retrying")).toBe(true);
    expect(isMarketSourceModule("hazards")).toBe(true);
    expect(isMarketSourceDataset("flood")).toBe(true);
    expect(marketNormalizationBoundary()).toEqual({
      normalizedRecordOnly: true,
      canonicalMarketRecordWriteAllowed: false,
      canonicalPropertyWriteAllowed: false,
      canonicalProviderIdsAllowed: false,
    });
  });

  it("validates provider registration metadata and rejects duplicate providers", () => {
    const declaration = provider();
    expect(declaration.contractVersion).toBe(MARKET_SOURCE_PROVIDER_CONTRACT_VERSION);
    expect(declaration.metadata.providerId).toBe("future_market_provider");
    expect(declaration.capabilityDeclaration.supportedDatasets).toEqual(["flood", "grocery_access", "property_tax"]);

    const registry = createMarketProviderRegistry([declaration]);
    expect(registry.get("future_market_provider")?.priority.rank).toBe(2);
    expect(() => createMarketProviderRegistry([declaration, declaration])).toThrow("Provider declaration is duplicated.");
  });

  it("creates deterministic authorized ingestion requests without canonical write permissions", () => {
    const first = request();
    const second = request();

    expect(first.requestId).toBe(second.requestId);
    expect(first.contractVersion).toBe(MARKET_SOURCE_INGESTION_CONTRACT_VERSION);
    expect(first.requestedDatasets).toEqual(["flood", "grocery_access", "property_tax"]);
    expect(first.requestedModules).toEqual(["convenience", "hazards", "taxes"]);
    expect(first.normalizationBoundary.canonicalMarketRecordWriteAllowed).toBe(false);
    expect(first.normalizationBoundary.canonicalPropertyWriteAllowed).toBe(false);
  });

  it("blocks unauthorized workspace, Deal, and Property scopes before ingestion starts", () => {
    expect(() => buildMarketIngestionRequest({
      ...request(),
      authorization: {
        workspaceId: "workspace-2",
        authorizedWorkspaceIds: ["workspace-2"],
      },
    })).toThrow("Market ingestion request is outside the authorized workspace.");

    expect(() => buildMarketIngestionRequest({
      ...request(),
      authorization: {
        workspaceId: "workspace-1",
        authorizedWorkspaceIds: ["workspace-1"],
        authorizedDealIds: ["other-deal"],
      },
    })).toThrow("Market ingestion request is outside the authorized Deal scope.");
  });

  it("reports unsupported and stale providers without starting provider logic", () => {
    const activeRequest = request(["missing_provider", "stale_provider"]);
    const staleProvider = provider("stale_provider");
    const staleRegistry = createMarketProviderRegistry([{
      ...staleProvider,
      health: {
        ...staleProvider.health,
        freshness: { state: "stale", retrievedAt: "2026-01-01T00:00:00.000Z" },
      },
    }]);
    const session = acceptMarketIngestionRequest({
      request: activeRequest,
      registry: staleRegistry,
      now: "2026-07-27T14:31:01.000Z",
    });

    expect(session.lifecycleState).toBe("blocked");
    expect(session.failures.map((item) => item.code).sort()).toEqual(["provider_stale", "unsupported_provider"]);
  });

  it("accepts healthy providers and preserves retry metadata", () => {
    const session = acceptMarketIngestionRequest({
      request: request(),
      registry: createMarketProviderRegistry([provider()]),
      now: "2026-07-27T14:31:01.000Z",
      retry: { attempt: 1, maxAttempts: 4, nextRetryAt: "2026-07-27T14:36:01.000Z" },
    });

    expect(session.lifecycleState).toBe("accepted");
    expect(session.retry).toMatchObject({
      retryable: false,
      attempt: 1,
      maxAttempts: 4,
      nextRetryAt: "2026-07-27T14:36:01.000Z",
      backoffStrategy: "none",
    });
  });

  it("builds complete ingestion results from normalized source records only", () => {
    const activeRequest = request();
    const activeProvider = provider();
    const session = acceptMarketIngestionRequest({
      request: activeRequest,
      registry: createMarketProviderRegistry([activeProvider]),
      now: "2026-07-27T14:31:01.000Z",
    });
    const provenance = createMarketProviderProvenance({
      providerId: "future_market_provider",
      providerVersion: "market-adapter-v1",
      providerRecordReference: "tax-record-1",
      observationTime: "2025-01-01",
      effectiveTime: "2025-01-01",
      retrievalTime: "2026-07-27T14:31:10.000Z",
      verificationState: "source_backed",
      confidence: "source_backed",
      evidenceReference: { evidenceId: "evidence-1", sourceRecordId: "tax-record-1" },
      sourceClassification: sourceRecord().provenance.sourceClassification,
    });

    const result = buildMarketIngestionResult({
      request: activeRequest,
      session,
      provider: activeProvider,
      lifecycleState: "complete",
      normalizedSourceRecords: [sourceRecord()],
      provenance: [provenance],
      freshness: { state: "current", retrievedAt: "2026-07-27T14:31:10.000Z" },
      processingTimeMs: 12.6,
    });

    expect(result.contractVersion).toBe(MARKET_SOURCE_RESULT_CONTRACT_VERSION);
    expect(result.status).toBe("success");
    expect(result.normalizedSourceRecords[0]).not.toHaveProperty("marketSnapshotId");
    expect(result.normalizedSourceRecords[0]).not.toHaveProperty("canonicalProperty");
    expect(result.provenance[0]).toMatchObject({
      providerId: "future_market_provider",
      providerRecordReference: "tax-record-1",
      retrievalTime: "2026-07-27T14:31:10.000Z",
      verificationState: "source_backed",
    });
  });

  it("rejects normalization boundary violations that try to write canonical records", () => {
    const activeRequest = request();
    const activeProvider = provider();
    const session = acceptMarketIngestionRequest({
      request: activeRequest,
      registry: createMarketProviderRegistry([activeProvider]),
      now: "2026-07-27T14:31:01.000Z",
    });

    expect(() => buildMarketIngestionResult({
      request: activeRequest,
      session,
      provider: activeProvider,
      lifecycleState: "complete",
      normalizedSourceRecords: [{
        ...sourceRecord(),
        marketSnapshotId: "snapshot-1",
      } as ProviderNormalizedSourceRecord,
      ],
      freshness: { state: "current" },
      processingTimeMs: 3,
    })).toThrow("Provider output may not write canonical MarketIQ records.");
  });

  it("supports partial completion and failed ingestion without fake success", () => {
    const activeRequest = request(["future_market_provider", "offline_provider"]);
    const healthyProvider = provider();
    const offlineProvider = provider("offline_provider", "offline");
    const registry = createMarketProviderRegistry([healthyProvider, offlineProvider]);
    const session = acceptMarketIngestionRequest({
      request: activeRequest,
      registry,
      now: "2026-07-27T14:31:01.000Z",
    });
    const result = buildMarketIngestionResult({
      request: activeRequest,
      session,
      provider: healthyProvider,
      lifecycleState: "complete",
      normalizedSourceRecords: [sourceRecord()],
      freshness: { state: "current", retrievedAt: "2026-07-27T14:31:10.000Z" },
      processingTimeMs: 10,
    });
    const response = buildMarketIngestionResponse({
      request: activeRequest,
      session,
      results: [result],
    });

    expect(session.lifecycleState).toBe("partially_complete");
    expect(response.lifecycleState).toBe("partially_complete");
    expect(response.status).toBe("partial_success");
    expect(response.partial).toBe(true);
    expect(response.failures[0].code).toBe("provider_unavailable");
  });

  it("preserves deterministic batch ordering and blocks duplicate batches", () => {
    const first = request(["future_market_provider"]);
    const second = buildMarketIngestionRequest({
      ...request(["county_context"]),
      idempotencyKey: "market-ingestion-2",
      providerIds: ["county_context"],
      authorization: {
        workspaceId: "workspace-1",
        authorizedWorkspaceIds: ["workspace-1"],
        authorizedDealIds: ["deal-1"],
        authorizedPropertyIds: ["property-1"],
        allowedProviderIds: ["county_context"],
      },
    });
    const firstSession = acceptMarketIngestionRequest({ request: first, registry: createMarketProviderRegistry([provider()]), now: "2026-07-27T14:31:01.000Z" });
    const secondSession = acceptMarketIngestionRequest({ request: second, registry: createMarketProviderRegistry([provider("county_context")]), now: "2026-07-27T14:31:02.000Z" });

    const batch = buildMarketIngestionBatch({
      workspaceId: "workspace-1",
      requests: [second, first, first],
      sessions: [secondSession, firstSession],
      createdAt: "2026-07-27T14:31:03.000Z",
    });

    expect(batch.contractVersion).toBe(MARKET_SOURCE_BATCH_CONTRACT_VERSION);
    expect(batch.requestIds).toEqual([first.requestId, first.requestId, second.requestId].sort());
    expect(batch.lifecycleState).toBe("blocked");
    expect(batch.resultStatus).toBe("blocked");
    expect(batch.duplicateRequestIds).toContain(first.idempotencyKey);
  });

  it("keeps hash stability independent of input ordering", () => {
    const left = request(["future_market_provider", "county_context"]);
    const right = buildMarketIngestionRequest({
      ...request(["county_context", "future_market_provider"]),
      requestedModules: ["convenience", "taxes", "hazards"],
      requestedDatasets: ["grocery_access", "property_tax", "flood"],
      requestedGeographyLevels: ["county", "address"],
      providerIds: ["county_context", "future_market_provider"],
      authorization: {
        workspaceId: "workspace-1",
        authorizedWorkspaceIds: ["workspace-1"],
        authorizedDealIds: ["deal-1"],
        authorizedPropertyIds: ["property-1"],
        allowedProviderIds: ["future_market_provider", "county_context"],
      },
    });

    expect(left.requestId).toBe(right.requestId);
    expect(left.deterministicHash).toBe(right.deterministicHash);
  });

  it("keeps provider IDs external and separate from canonical location references", () => {
    const external = buildExternalLocationReference({
      workspaceId: "workspace-1",
      locationId: location().locationId,
      providerOrAuthorityId: "Future Market Provider",
      providerScopedExternalId: "provider-location-123",
      externalIdentityType: "provider_record",
      observedAt: "2026-07-27T14:31:00.000Z",
    });

    expect(external.providerOrAuthorityId).toBe("future_market_provider");
    expect(external.providerScopedExternalId).toBe("provider-location-123");
    expect(external.locationId).not.toBe(external.providerScopedExternalId);
  });

  it("keeps MarketIQ ingestion runtime-neutral and out of UI/provider/network layers", () => {
    const source = String.raw`
      ${marketNormalizationBoundary.toString()}
      ${buildMarketIngestionRequest.toString()}
      ${buildMarketIngestionResult.toString()}
    `;
    expect(source).not.toMatch(/\bfetch\b|XMLHttpRequest|supabase|invokeBrixFunction|React|useState|URLSession|OpenAI|Zillow|Realtor|ATTOM|CoreLogic|FEMA|NOAA|Google|Apple Maps|OpenStreetMap/i);
  });

  it("emits safe diagnostics without source payloads or secrets", () => {
    expect(marketIngestionDiagnostics("provider_blocked", {
      workspaceId: "workspace-1",
      requestId: "request-1",
      providerId: "provider-1",
      lifecycleState: "blocked",
      failureCode: "provider_unavailable",
    })).toEqual({
      event: "provider_blocked",
      workspaceScoped: true,
      requestScoped: true,
      providerScoped: true,
      lifecycleState: "blocked",
      failureCode: "provider_unavailable",
    });
  });
});

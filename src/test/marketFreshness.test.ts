import { describe, expect, it } from "vitest";
import { buildCanonicalLocationIdentity } from "../core/locationIdentity";
import {
  assertNormalizedSourceRecord,
  createProviderProvenance,
  createProviderVersion,
  type ProviderNormalizedSourceRecord,
} from "../core/providerAdapters";
import {
  acceptMarketIngestionRequest,
  buildMarketIngestionRequest,
  buildMarketIngestionResult,
  buildMarketProviderDeclaration,
  createMarketProviderProvenance,
  createMarketProviderRegistry,
} from "../core/marketSourceIngestion";
import {
  MARKET_FRESHNESS_CONTRACT_VERSION,
  MARKET_FRESHNESS_POLICY_VERSION,
  assessMarketFreshness,
  assessMarketFreshnessFromResult,
  buildMarketFreshnessPolicy,
  marketFreshnessDiagnostics,
  marketFreshnessReasons,
  rollupMarketFreshness,
} from "../core/marketFreshness";

describe("MarketIQ freshness contract", () => {
  const location = buildCanonicalLocationIdentity({
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
  });

  const policy = (overrides: Partial<Parameters<typeof buildMarketFreshnessPolicy>[0]> = {}) => buildMarketFreshnessPolicy({
    dataset: "property_tax",
    module: "taxes",
    geographyLevel: "county",
    maxAgeDays: 45,
    historicalAfterDays: 365,
    requiresObservationTime: false,
    requiresEffectiveTime: true,
    requiresRetrievalTime: true,
    sourceUse: "current_context",
    ...overrides,
  });

  const provenance = (overrides: Partial<ReturnType<typeof createMarketProviderProvenance>> = {}) => createMarketProviderProvenance({
    providerId: "county_context",
    providerVersion: "market-adapter-v1",
    providerRecordReference: "tax-record-1",
    observationTime: "2025-01-01T00:00:00.000Z",
    effectiveTime: "2025-01-01T00:00:00.000Z",
    retrievalTime: "2026-07-01T00:00:00.000Z",
    verificationState: "source_backed",
    confidence: "source_backed",
    evidenceReference: {
      sourceRecordId: "tax-record-1",
      evidenceId: "evidence-1",
      sourceName: "County context source",
      observedAt: "2025-01-01T00:00:00.000Z",
      effectiveAt: "2025-01-01T00:00:00.000Z",
    },
    ...overrides,
  });

  const sourceRecord = (): ProviderNormalizedSourceRecord => {
    const providerProvenance = createProviderProvenance({
      providerId: "county_context",
      sourceName: "County context source",
      sourceType: "tax_record",
      sourceRecordId: "tax-record-1",
      retrievedAt: "2026-07-01T00:00:00.000Z",
      effectiveAt: "2025-01-01T00:00:00.000Z",
      confidence: "source_backed",
      evidenceId: "evidence-1",
    });
    return assertNormalizedSourceRecord({
      sourceRecordKey: "county_context:tax-record-1",
      provider: "county_context",
      providerVersion: createProviderVersion("market-adapter-v1"),
      sourceType: "tax_record",
      status: "success",
      provenance: providerProvenance,
      values: [{
        subjectType: "property",
        targetField: "annual_property_tax",
        rawValue: 6100,
        normalizedValue: 6100,
        period: "annual",
        confidence: "source_backed",
        provenance: providerProvenance,
      }],
      metadata: { geography: "county" },
    });
  };

  it("defines deterministic freshness reason and policy contracts", () => {
    const freshnessPolicy = policy();

    expect(marketFreshnessReasons).toEqual([
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
    ]);
    expect(freshnessPolicy.contractVersion).toBe(MARKET_FRESHNESS_POLICY_VERSION);
    expect(freshnessPolicy.policyId).toMatch(/^mf_policy_/);
    expect(policy({ maxAgeDays: 45 }).deterministicHash).toBe(freshnessPolicy.deterministicHash);
  });

  it("assesses current freshness within the policy window while preserving source references", () => {
    const assessment = assessMarketFreshness({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      propertyId: "property-1",
      locationId: location.locationId,
      dataset: "property_tax",
      module: "taxes",
      geographyLevel: "county",
      evaluatedAt: "2026-07-20T00:00:00.000Z",
      method: "provider_normalized_record_timestamp",
      confidence: "source_backed",
      freshness: {
        state: "current",
        retrievedAt: "2026-07-01T00:00:00.000Z",
        effectiveAt: "2025-01-01T00:00:00.000Z",
        staleAfterDays: 45,
      },
      policy: policy(),
      provenance: [provenance()],
      sourceRecords: [sourceRecord()],
    });

    expect(assessment.contractVersion).toBe(MARKET_FRESHNESS_CONTRACT_VERSION);
    expect(assessment.state).toBe("current");
    expect(assessment.ageDays).toBe(19);
    expect(assessment.reasons).toEqual(["within_policy_window"]);
    expect(assessment.sourceRecordKeys).toEqual(["county_context:tax-record-1"]);
    expect(assessment.evidenceReferences[0]).toMatchObject({ evidenceId: "evidence-1", sourceRecordId: "tax-record-1" });
  });

  it("marks source context stale when explicit expiration or policy age is exceeded", () => {
    const expired = assessMarketFreshness({
      workspaceId: "workspace-1",
      dataset: "property_tax",
      module: "taxes",
      geographyLevel: "county",
      evaluatedAt: "2026-08-10T00:00:00.000Z",
      method: "provider_expiration",
      confidence: "source_backed",
      freshness: {
        state: "current",
        retrievedAt: "2026-07-01T00:00:00.000Z",
        effectiveAt: "2025-01-01T00:00:00.000Z",
        expiresAt: "2026-08-01T00:00:00.000Z",
        staleAfterDays: 20,
      },
      policy: policy({ maxAgeDays: 20 }),
      provenance: [provenance()],
    });

    expect(expired.state).toBe("stale");
    expect(expired.reasons).toEqual(["explicit_expiration", "stale_after_policy"]);
    expect(expired.limitations[0]).toContain("stale");
  });

  it("distinguishes historical context from current context", () => {
    const historical = assessMarketFreshness({
      workspaceId: "workspace-1",
      dataset: "property_tax",
      module: "taxes",
      geographyLevel: "county",
      evaluatedAt: "2026-08-10T00:00:00.000Z",
      method: "historical_record_review",
      confidence: "source_backed",
      freshness: {
        state: "current",
        retrievedAt: "2025-01-01T00:00:00.000Z",
        effectiveAt: "2024-01-01T00:00:00.000Z",
      },
      policy: policy({ maxAgeDays: 30, historicalAfterDays: 180 }),
      provenance: [provenance({ retrievalTime: "2025-01-01T00:00:00.000Z", effectiveTime: "2024-01-01T00:00:00.000Z" })],
    });

    expect(historical.state).toBe("historical");
    expect(historical.reasons).toContain("historical_period");
    expect(historical.limitations[0]).toContain("historical");
  });

  it("marks freshness unknown when required timing metadata is missing", () => {
    const unknown = assessMarketFreshness({
      workspaceId: "workspace-1",
      dataset: "property_tax",
      module: "taxes",
      geographyLevel: "county",
      evaluatedAt: "2026-08-10T00:00:00.000Z",
      method: "provider_missing_timestamp",
      confidence: "unknown",
      freshness: { state: "unknown" },
      policy: policy(),
      provenance: [],
    });

    expect(unknown.state).toBe("unknown");
    expect(unknown.reasons).toEqual(["missing_effective_time", "missing_retrieval_time", "provider_marked_unknown"]);
    expect(unknown.limitations[0]).toContain("cannot be confirmed");
  });

  it("marks superseded source context as historical-only even when timestamps are recent", () => {
    const superseded = assessMarketFreshness({
      workspaceId: "workspace-1",
      dataset: "property_tax",
      module: "taxes",
      geographyLevel: "county",
      evaluatedAt: "2026-07-20T00:00:00.000Z",
      method: "result_supersession",
      confidence: "source_backed",
      freshness: {
        state: "current",
        retrievedAt: "2026-07-01T00:00:00.000Z",
        effectiveAt: "2025-01-01T00:00:00.000Z",
      },
      policy: policy(),
      provenance: [provenance()],
      supersededByResultId: "newer-result",
      priorValidResultId: "older-result",
    });

    expect(superseded.state).toBe("superseded");
    expect(superseded.supersededByResultId).toBe("newer-result");
    expect(superseded.priorValidResultId).toBe("older-result");
    expect(superseded.reasons).toContain("superseded_result");
  });

  it("builds freshness assessments from ingestion results without changing ingestion records", () => {
    const provider = buildMarketProviderDeclaration({
      metadata: {
        providerId: "county_context",
        displayName: "County Context",
        version: createProviderVersion("market-adapter-v1"),
        state: "healthy",
        capabilities: ["tax_support"],
      },
      priority: { rank: 1, tieBreaker: "county_context" },
      health: {
        state: "healthy",
        checkedAt: "2026-07-01T00:00:00.000Z",
        availability: { state: "healthy", checkedAt: "2026-07-01T00:00:00.000Z" },
        freshness: { state: "current", retrievedAt: "2026-07-01T00:00:00.000Z" },
      },
      capabilityDeclaration: {
        providerId: "county_context",
        supportedCountries: ["US"],
        supportedGeographies: ["county"],
        supportedModules: ["taxes"],
        supportedDatasets: ["property_tax"],
        supportedFreshness: ["current", "stale", "unknown"],
        supportedConfidence: ["source_backed", "unknown"],
        supportedLicensing: { licenseType: "public", attributionRequired: true },
        providerCapabilities: ["tax_support"],
      },
    });
    const request = buildMarketIngestionRequest({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      propertyId: "property-1",
      location,
      requestedModules: ["taxes"],
      requestedDatasets: ["property_tax"],
      requestedGeographyLevels: ["county"],
      providerIds: ["county_context"],
      requestedAt: "2026-07-01T00:00:00.000Z",
      idempotencyKey: "freshness-ingestion-1",
      authorization: {
        workspaceId: "workspace-1",
        authorizedWorkspaceIds: ["workspace-1"],
        authorizedDealIds: ["deal-1"],
        authorizedPropertyIds: ["property-1"],
        allowedProviderIds: ["county_context"],
      },
    });
    const session = acceptMarketIngestionRequest({
      request,
      registry: createMarketProviderRegistry([provider]),
      now: "2026-07-01T00:00:01.000Z",
    });
    const result = buildMarketIngestionResult({
      request,
      session,
      provider,
      lifecycleState: "complete",
      normalizedSourceRecords: [sourceRecord()],
      provenance: [provenance()],
      freshness: { state: "current", retrievedAt: "2026-07-01T00:00:00.000Z", effectiveAt: "2025-01-01T00:00:00.000Z" },
      processingTimeMs: 12,
    });

    const assessment = assessMarketFreshnessFromResult({
      result,
      workspaceId: "workspace-1",
      dealId: "deal-1",
      propertyId: "property-1",
      locationId: location.locationId,
      dataset: "property_tax",
      module: "taxes",
      geographyLevel: "county",
      evaluatedAt: "2026-07-20T00:00:00.000Z",
      method: "ingestion_result_freshness",
      policy: policy(),
    });

    expect(assessment.state).toBe("current");
    expect(assessment.sourceRecordKeys).toEqual(["county_context:tax-record-1"]);
    expect(result.normalizedSourceRecords[0].sourceRecordKey).toBe("county_context:tax-record-1");
  });

  it("rolls up freshness by worst material state with deterministic ordering", () => {
    const current = assessMarketFreshness({
      workspaceId: "workspace-1",
      dataset: "property_tax",
      module: "taxes",
      geographyLevel: "county",
      evaluatedAt: "2026-07-20T00:00:00.000Z",
      method: "current",
      confidence: "source_backed",
      freshness: { state: "current", retrievedAt: "2026-07-01T00:00:00.000Z", effectiveAt: "2025-01-01T00:00:00.000Z" },
      policy: policy(),
      provenance: [provenance()],
    });
    const stale = assessMarketFreshness({
      workspaceId: "workspace-1",
      dataset: "property_tax",
      module: "taxes",
      geographyLevel: "county",
      evaluatedAt: "2026-09-20T00:00:00.000Z",
      method: "stale",
      confidence: "source_backed",
      freshness: { state: "current", retrievedAt: "2026-07-01T00:00:00.000Z", effectiveAt: "2025-01-01T00:00:00.000Z" },
      policy: policy(),
      provenance: [provenance()],
    });

    const rollup = rollupMarketFreshness({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      propertyId: "property-1",
      locationId: location.locationId,
      evaluatedAt: "2026-09-20T00:00:00.000Z",
      assessments: [current, stale],
    });

    expect(rollup.state).toBe("stale");
    expect(rollup.staleCount).toBe(1);
    expect(rollup.currentCount).toBe(1);
    expect(rollup.assessments.map((item) => item.method)).toEqual(["current", "stale"]);
  });

  it("rejects mismatched policy scope before assessing freshness", () => {
    expect(() => assessMarketFreshness({
      workspaceId: "workspace-1",
      dataset: "property_tax",
      module: "taxes",
      geographyLevel: "county",
      evaluatedAt: "2026-07-20T00:00:00.000Z",
      method: "mismatch",
      confidence: "source_backed",
      freshness: { state: "current", retrievedAt: "2026-07-01T00:00:00.000Z", effectiveAt: "2025-01-01T00:00:00.000Z" },
      policy: policy({ dataset: "flood", module: "hazards" }),
      provenance: [provenance()],
    })).toThrow("Market freshness policy dataset does not match assessment dataset.");
  });

  it("keeps MarketIQ freshness runtime-neutral and out of provider/API/UI layers", () => {
    const source = String.raw`
      ${assessMarketFreshness.toString()}
      ${rollupMarketFreshness.toString()}
      ${buildMarketFreshnessPolicy.toString()}
    `;
    expect(source).not.toMatch(/\bfetch\b|XMLHttpRequest|supabase|invokeBrixFunction|React|useState|URLSession|OpenAI|Zillow|Realtor|ATTOM|CoreLogic|FEMA|NOAA|Google|Apple Maps|OpenStreetMap/i);
  });

  it("emits safe diagnostics without source payloads or secrets", () => {
    expect(marketFreshnessDiagnostics("freshness_stale", {
      workspaceId: "workspace-1",
      assessmentId: "assessment-1",
      dataset: "property_tax",
      state: "stale",
    })).toEqual({
      event: "freshness_stale",
      workspaceScoped: true,
      assessmentScoped: true,
      dataset: "property_tax",
      state: "stale",
    });
  });
});

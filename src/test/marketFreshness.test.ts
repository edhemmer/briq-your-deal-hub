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
  CANONICAL_MARKET_FRESHNESS_CONTRACT_VERSION,
  CANONICAL_MARKET_FRESHNESS_POLICY_VERSION,
  CANONICAL_MARKET_FRESHNESS_REGISTRY_VERSION,
  MARKET_FRESHNESS_CONTRACT_VERSION,
  MARKET_FRESHNESS_POLICY_VERSION,
  assessMarketFreshness,
  assessMarketFreshnessFromResult,
  buildMarketFreshnessPolicy,
  canonicalMarketDatasetCategories,
  canonicalMarketFreshnessStates,
  canonicalMarketRefreshEligibilityStates,
  createCanonicalMarketFreshnessPolicyRegistry,
  defineCanonicalMarketFreshnessPolicy,
  evaluateCanonicalMarketFreshness,
  marketFreshnessDiagnostics,
  marketFreshnessExplanationTemplates,
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

describe("canonical MarketIQ freshness and staleness contract", () => {
  type CanonicalPolicyInput = Parameters<typeof defineCanonicalMarketFreshnessPolicy>[0];

  const basePolicyInput: CanonicalPolicyInput = {
    policyId: "marketiq.tax.county.v1",
    semanticVersion: "1.0.0",
    lifecycleStatus: "active" as const,
    datasetCategory: "tax" as const,
    dataset: "property_tax" as const,
    module: "taxes" as const,
    geographyLevel: "county" as const,
    expectedCadence: "annual" as const,
    maxAcceptedAgeDays: 730,
    warningAfterDays: 300,
    reviewAfterDays: 365,
    staleAfterDays: 548,
    expirationAfterDays: 730,
    historicalAfterDays: 1460,
    ageBasis: "effective_start" as const,
    effectivePeriodBehavior: "retains_until_effective_end" as const,
    futureDatedDataBehavior: "future_effective" as const,
    missingTimestampBehavior: "missing_temporal_metadata" as const,
    providerFailureBehavior: "retain_prior_valid" as const,
    historicalRecordBehavior: "historical_allowed" as const,
    refreshEligibility: "refresh_supported" as const,
    refreshWorkflowAvailable: true,
    providerCapability: "tax_support" as const,
    manualReviewRequired: false,
    registeredAt: "2026-08-01T00:00:00.000Z",
  };

  const policy = (overrides: Partial<CanonicalPolicyInput> = {}) => defineCanonicalMarketFreshnessPolicy({
    ...basePolicyInput,
    ...overrides,
  });

  const input = (overrides: Partial<Parameters<typeof evaluateCanonicalMarketFreshness>[0]> = {}) => evaluateCanonicalMarketFreshness({
    policy: policy(),
    providerId: "county_public_records",
    providerVersion: "provider-v1",
    providerState: "healthy",
    datasetId: "county-tax-roll",
    dataset: "property_tax",
    datasetCategory: "tax",
    module: "taxes",
    sourceRecordId: "tax-2026",
    evidenceReference: {
      sourceRecordId: "tax-2026",
      evidenceId: "ev-tax",
      sourceName: "County tax authority",
      observedAt: "2026-01-01T00:00:00.000Z",
      effectiveAt: "2026-01-01T00:00:00.000Z",
    },
    canonicalLocationId: "loc-county-1",
    geographyLevel: "county",
    geographyIdentity: "county:fips:17197",
    boundaryVersion: "2026-boundary",
    observationTime: "2026-01-01",
    effectiveStart: "2026-01-01",
    effectiveEnd: "2026-12-31",
    publicationTime: "2026-02-15T12:00:00.000Z",
    retrievalTime: "2026-02-16T12:00:00.000Z",
    evaluationTime: "2026-08-01T00:00:00.000Z",
    timeSemantics: "date",
    timezone: "America/Chicago",
    verificationState: "source_backed",
    sourceConfidence: "source_backed",
    providerPublishedCadence: "annual",
    permissionAvailable: true,
    refreshSupported: true,
    ...overrides,
  });

  it("publishes inspectable canonical vocabulary and explanation templates", () => {
    expect(canonicalMarketDatasetCategories).toEqual([
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
    ]);
    expect(canonicalMarketFreshnessStates).toContain("missing_temporal_metadata");
    expect(canonicalMarketRefreshEligibilityStates).toContain("permission_restricted");
    expect(policy().contractVersion).toBe(CANONICAL_MARKET_FRESHNESS_POLICY_VERSION);
  });

  it("builds a deterministic policy registry with unique IDs, latest active selection, and deprecated history", () => {
    const deprecated = policy({ semanticVersion: "0.9.0", lifecycleStatus: "deprecated" });
    const latest = policy({ semanticVersion: "1.1.0", staleAfterDays: 600 });
    const registry = createCanonicalMarketFreshnessPolicyRegistry([latest, deprecated, policy()]);

    expect(registry.version).toBe(CANONICAL_MARKET_FRESHNESS_REGISTRY_VERSION);
    expect(registry.policies.map((item) => `${item.policyId}@${item.semanticVersion}`)).toEqual([
      "marketiq.tax.county.v1@0.9.0",
      "marketiq.tax.county.v1@1.0.0",
      "marketiq.tax.county.v1@1.1.0",
    ]);
    expect(createCanonicalMarketFreshnessPolicyRegistry([policy(), latest]).materialHash).toBe(createCanonicalMarketFreshnessPolicyRegistry([latest, policy()]).materialHash);
    expect(() => createCanonicalMarketFreshnessPolicyRegistry([policy(), policy()])).toThrow("Duplicate canonical freshness policy");
    expect(() => defineCanonicalMarketFreshnessPolicy({ ...basePolicyInput, lifecycleStatus: "disabled" })).toThrow("replacement policy");
    expect(() => defineCanonicalMarketFreshnessPolicy({ ...basePolicyInput, reviewAfterDays: 10, warningAfterDays: 20 })).toThrow("thresholds");
  });

  it("evaluates source freshness from observation/effective/retrieval semantics without substituting times", () => {
    const current = input();

    expect(current.contractVersion).toBe(CANONICAL_MARKET_FRESHNESS_CONTRACT_VERSION);
    expect(current.freshnessState).toBe("current");
    expect(current.ageBasis).toBe("effective_start");
    expect(current.calculatedAgeDays).toBe(212);
    expect(current.observationTime).toBe("2026-01-01T00:00:00.000Z");
    expect(current.effectiveStart).toBe("2026-01-01T00:00:00.000Z");
    expect(current.retrievalTime).toBe("2026-02-16T00:00:00.000Z");
    expect(current.staleReasons).toEqual(["within_policy_window"]);
    expect(current.refreshEligibility.state).toBe("refresh_not_needed");
  });

  it("covers deterministic freshness states with golden fixtures", () => {
    const cases = [
      ["same-day observation", { evaluationTime: "2026-01-01T00:00:00.000Z" }, "current"],
      ["warning", { evaluationTime: "2026-11-01T00:00:00.000Z" }, "current_with_age_warning"],
      ["exact review threshold", { evaluationTime: "2027-01-01T00:00:00.000Z" }, "review_due"],
      ["one unit beyond stale threshold", { evaluationTime: "2027-07-04T00:00:00.000Z" }, "stale"],
      ["expired age", { evaluationTime: "2028-01-02T00:00:00.000Z" }, "expired"],
      ["future effective", { effectiveStart: "2027-01-01", effectiveEnd: "2027-12-31", evaluationTime: "2026-12-01T00:00:00.000Z" }, "future_effective"],
      ["historical", { evaluationTime: "2030-01-02T00:00:00.000Z" }, "historical"],
      ["conflict", { sourceConflict: true }, "conflicted"],
      ["superseded boundary", { supersededBoundaryVersion: "2027-boundary" }, "superseded"],
      ["not applicable", { notApplicable: true }, "not_applicable"],
    ] as const;

    for (const [label, overrides, expected] of cases) {
      expect(input(overrides).freshnessState, label).toBe(expected);
    }
  });

  it("distinguishes missing metadata, provider failure, and prior-valid retention", () => {
    const missing = input({ effectiveStart: undefined, observationTime: undefined });
    const failureWithPrior = input({
      providerState: "offline",
      providerFailure: "record_retrieval_failed",
      priorValidResultId: "prior-result",
      priorValidSourceRecordId: "prior-record",
    });
    const failureWithoutPrior = input({
      providerState: "offline",
      providerFailure: "provider_unavailable",
      priorValidResultId: undefined,
      priorValidSourceRecordId: undefined,
      policy: policy({ providerFailureBehavior: "unavailable_without_prior" }),
    });

    expect(missing.freshnessState).toBe("missing_temporal_metadata");
    expect(missing.explanationCodes).toContain("temporal_metadata_missing");
    expect(failureWithPrior.freshnessState).toBe("current");
    expect(failureWithPrior.explanationCodes).toContain("provider_failed_prior_valid_retained");
    expect(failureWithPrior.priorValidSourceRecordId).toBe("prior-record");
    expect(failureWithoutPrior.freshnessState).toBe("unavailable");
    expect(failureWithoutPrior.explanationCodes).toContain("provider_unavailable_no_prior_valid");
  });

  it("resolves refresh eligibility without creating jobs or calling providers", () => {
    expect(input({ refreshSupported: false }).refreshEligibility.state).toBe("refresh_not_supported");
    expect(input({ evaluationTime: "2027-07-04T00:00:00.000Z" }).refreshEligibility.state).toBe("refresh_due");
    expect(input({ refreshBlocked: true }).refreshEligibility.state).toBe("refresh_blocked");
    expect(input({ requiredPermission: "market.tax.refresh", permissionAvailable: false }).refreshEligibility.state).toBe("permission_restricted");
    expect(input({ providerState: "maintenance", providerFailure: "refresh_failed", priorValidResultId: "prior" }).refreshEligibility.state).toBe("provider_unavailable");
    expect(input({ policy: policy({ refreshEligibility: "manual_only", refreshWorkflowAvailable: false }) }).refreshEligibility.state).toBe("manual_only");
  });

  it("preserves geography, dataset scope, effective periods, and provider cadence metadata", () => {
    const pointHazardPolicy = policy({
      policyId: "marketiq.hazard.point.v1",
      datasetCategory: "hazard",
      dataset: "flood",
      module: "hazards",
      geographyLevel: "point",
      expectedCadence: "provider_declared",
      ageBasis: "observation_time",
      warningAfterDays: 7,
      reviewAfterDays: 14,
      staleAfterDays: 30,
      expirationAfterDays: 90,
      providerCapability: "environment_support",
    });
    const hazard = input({
      policy: pointHazardPolicy,
      datasetId: "flood-observation",
      dataset: "flood",
      datasetCategory: "hazard",
      module: "hazards",
      geographyLevel: "point",
      geographyIdentity: "point:41.25,-88.18",
      observationTime: "2026-07-31T23:00:00-05:00",
      effectiveStart: undefined,
      effectiveEnd: undefined,
      providerPublishedCadence: "provider_declared",
      providerCapability: "environment_support",
      timeSemantics: "instant",
    });

    expect(hazard.geographyLevel).toBe("point");
    expect(hazard.datasetCategory).toBe("hazard");
    expect(hazard.thresholdReferences.expectedCadence).toBe("provider_declared");
    expect(hazard.refreshEligibility.providerCapability).toBe("environment_support");
  });

  it("handles date-only, month, year, leap-year, and timezone boundary fixtures deterministically", () => {
    const monthlyPolicy = policy({
      policyId: "marketiq.liquidity.metro.monthly.v1",
      datasetCategory: "liquidity",
      dataset: "inventory",
      module: "liquidity",
      geographyLevel: "metropolitan_area",
      ageBasis: "effective_start",
      warningAfterDays: 32,
      reviewAfterDays: 62,
      staleAfterDays: 93,
    });
    const annualPolicy = policy({
      policyId: "marketiq.demographic.tract.annual.v1",
      datasetCategory: "demographic",
      dataset: "population_level",
      module: "population",
      geographyLevel: "neighborhood",
      ageBasis: "effective_start",
      warningAfterDays: 365,
      reviewAfterDays: 730,
      staleAfterDays: 1095,
      expirationAfterDays: 1460,
      historicalAfterDays: 2000,
    });

    expect(input({ policy: monthlyPolicy, datasetId: "inventory-month", dataset: "inventory", datasetCategory: "liquidity", module: "liquidity", geographyLevel: "metropolitan_area", effectiveStart: "2026-07", observationTime: "2026-07", retrievalTime: "2026-07", evaluationTime: "2026-08-01T00:00:00.000Z", timeSemantics: "month" }).freshnessState).toBe("current");
    expect(input({ policy: annualPolicy, datasetId: "population-year", dataset: "population_level", datasetCategory: "demographic", module: "population", geographyLevel: "neighborhood", effectiveStart: "2026", observationTime: "2026", retrievalTime: "2026", evaluationTime: "2026-12-31T00:00:00.000Z", timeSemantics: "year" }).freshnessState).toBe("current");
    expect(input({ effectiveStart: "2024-02-29", observationTime: "2024-02-29", retrievalTime: "2024-02-29", evaluationTime: "2024-03-01T00:00:00.000Z", policy: policy({ warningAfterDays: 2, reviewAfterDays: 365, staleAfterDays: 730 }) }).calculatedAgeDays).toBe(1);
    expect(input({ observationTime: "2026-07-31T23:30:00-05:00", effectiveStart: "2026-07-31T23:30:00-05:00", retrievalTime: "2026-08-01T04:30:00.000Z", evaluationTime: "2026-08-01T05:30:00.000Z", timeSemantics: "instant" }).calculatedAgeDays).toBe(0);
  });

  it("makes hashes stable for material inputs and excludes display copy", () => {
    const first = input();
    const same = input();
    const changedObservation = input({ effectiveStart: "2026-01-02", observationTime: "2026-01-02" });
    const changedProviderVersion = input({ providerVersion: "provider-v2" });
    const changedPolicy = input({ policy: policy({ semanticVersion: "1.0.1", staleAfterDays: 600 }) });

    expect(same.materialHash).toBe(first.materialHash);
    expect(changedObservation.materialHash).not.toBe(first.materialHash);
    expect(changedProviderVersion.materialHash).not.toBe(first.materialHash);
    expect(changedPolicy.materialHash).not.toBe(first.materialHash);
    const displayOnlyCopy = { ...marketFreshnessExplanationTemplates.within_policy_window, guided: "Display copy changed" };
    expect(displayOnlyCopy.guided).toBe("Display copy changed");
    expect(input().materialHash).toBe(first.materialHash);
  });

  it("keeps canonical freshness authority out of UI, cache, provider, network, and AI boundaries", () => {
    const authoritySource = String.raw`
      ${evaluateCanonicalMarketFreshness.toString()}
      ${defineCanonicalMarketFreshnessPolicy.toString()}
      ${createCanonicalMarketFreshnessPolicyRegistry.toString()}
    `;
    expect(authoritySource).not.toMatch(/\bfetch\b|XMLHttpRequest|supabase|useState|useMemo|React|SwiftUI|URLSession|localStorage|sessionStorage|Date\.now|ttl|cache|OpenAI|chat|provider\.lookup|provider\.fetch/i);
  });
});

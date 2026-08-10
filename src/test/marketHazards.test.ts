import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CANONICAL_MARKET_FRESHNESS_CONTRACT_VERSION,
  defineCanonicalMarketFreshnessPolicy,
  evaluateCanonicalMarketFreshness,
  type CanonicalMarketFreshnessResult,
} from "../core/marketFreshness";
import {
  MARKET_HAZARD_CONFLICT_CONTRACT_VERSION,
  MARKET_HAZARD_CONTRACT_VERSION,
  MARKET_HAZARD_FINDING_CONTRACT_VERSION,
  MARKET_HAZARD_OBSERVATION_CONTRACT_VERSION,
  MARKET_HAZARD_REGISTRY_VERSION,
  createMarketHazardConflictManifest,
  createMarketHazardFinding,
  createMarketHazardObservation,
  createMarketHazardRegistry,
  defineMarketHazardRegistryEntry,
  isMarketHazardCategory,
  isMarketHazardImpactClass,
  isMarketHazardObservationMethod,
  isMarketHazardSourceSeverityClass,
  marketHazardCategories,
  marketHazardConflictStates,
  marketHazardDegradedStates,
  marketHazardDiagnostics,
  marketHazardExplanationCodes,
  marketHazardFindingTypes,
  marketHazardImpactClasses,
  marketHazardObservationMethods,
  marketHazardProfessionalReviewTypes,
  marketHazardSourceSeverityClasses,
  projectMarketHazardFinding,
  selectMarketHazardRegistryEntry,
  type MarketHazardGeography,
  type MarketHazardObservation,
  type MarketHazardRegistryEntry,
} from "../core/marketHazards";
import { createMarketProviderProvenance } from "../core/marketSourceIngestion";

describe("MarketIQ hazard and environmental context contract", () => {
  const geography: MarketHazardGeography = {
    canonicalLocationId: "loc-property-1",
    geographyLevel: "parcel",
    geographyIdentity: "parcel:will:0000-000-000",
    boundaryId: "parcel-boundary-1",
    boundaryVersion: "2026-01",
    proxy: false,
  };

  const proxyGeography: MarketHazardGeography = {
    canonicalLocationId: "loc-property-1",
    geographyLevel: "county",
    geographyIdentity: "county:fips:17197",
    boundaryId: "will-county",
    boundaryVersion: "2026-01",
    proxy: true,
    proxyReason: "County-level context is available before parcel-level evidence.",
  };

  const entry = (overrides: Partial<Parameters<typeof defineMarketHazardRegistryEntry>[0]> = {}): MarketHazardRegistryEntry => defineMarketHazardRegistryEntry({
    hazardId: "flood.context",
    semanticVersion: "1.0.0",
    category: "flood",
    dataset: "flood",
    lifecycleStatus: "active",
    applicableGeographyLevels: ["parcel", "point", "county"],
    supportedObservationMethods: ["mapped_indicator", "modeled_estimate", "proximity_measure", "professional_report", "user_supplied_evidence"],
    supportedSourceSeverityClasses: ["source_absent", "source_low", "source_moderate", "source_high", "source_zone", "source_unknown"],
    supportedImpactClasses: ["informational", "review_recommended", "material_context", "professional_review_required"],
    professionalReviewType: "flood_elevation_certificate_review",
    limitations: [
      "Mapped hazard context is not an insurance quote.",
      "Mapped hazard context is not a property-specific professional determination.",
    ],
    prohibitedConclusionCodes: ["do_not_claim_insurable", "do_not_claim_no_flood_risk", "do_not_claim_safe"],
    strategyImpactProposalKinds: ["insurance_assumption_review", "reserve_assumption_review"],
    registeredAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  });

  const freshnessPolicy = defineCanonicalMarketFreshnessPolicy({
    policyId: "marketiq.hazard.parcel.v1",
    semanticVersion: "1.0.0",
    lifecycleStatus: "active",
    datasetCategory: "hazard",
    dataset: "flood",
    module: "hazards",
    geographyLevel: "parcel",
    expectedCadence: "provider_declared",
    warningAfterDays: 180,
    reviewAfterDays: 365,
    staleAfterDays: 730,
    expirationAfterDays: 1095,
    historicalAfterDays: 1825,
    ageBasis: "observation_time",
    effectivePeriodBehavior: "retains_until_effective_end",
    futureDatedDataBehavior: "future_effective",
    missingTimestampBehavior: "missing_temporal_metadata",
    providerFailureBehavior: "retain_prior_valid",
    historicalRecordBehavior: "historical_allowed",
    refreshEligibility: "refresh_not_supported",
    refreshWorkflowAvailable: false,
    providerCapability: "environment_support",
    manualReviewRequired: false,
    registeredAt: "2026-08-10T00:00:00.000Z",
  });

  const freshness = (overrides: Partial<Parameters<typeof evaluateCanonicalMarketFreshness>[0]> = {}): CanonicalMarketFreshnessResult => evaluateCanonicalMarketFreshness({
    policy: freshnessPolicy,
    providerId: "future_hazard_provider",
    providerVersion: "hazard-provider-v1",
    providerState: "healthy",
    datasetId: "future-flood-layer",
    dataset: "flood",
    datasetCategory: "hazard",
    module: "hazards",
    sourceRecordId: "flood-record-1",
    canonicalLocationId: "loc-property-1",
    geographyLevel: "parcel",
    geographyIdentity: "parcel:will:0000-000-000",
    boundaryVersion: "2026-01",
    observationTime: "2026-07-01T00:00:00.000Z",
    effectiveStart: "2026-07-01T00:00:00.000Z",
    retrievalTime: "2026-07-02T00:00:00.000Z",
    evaluationTime: "2026-08-10T00:00:00.000Z",
    timeSemantics: "instant",
    verificationState: "source_backed",
    sourceConfidence: "source_backed",
    ...overrides,
  });

  const provenance = createMarketProviderProvenance({
    providerId: "future_hazard_provider",
    providerVersion: "hazard-provider-v1",
    providerRecordReference: "flood-record-1",
    observationTime: "2026-07-01T00:00:00.000Z",
    retrievalTime: "2026-07-02T00:00:00.000Z",
    verificationState: "source_backed",
    confidence: "source_backed",
    evidenceReference: {
      sourceRecordId: "flood-record-1",
      evidenceId: "evidence-flood-1",
      sourceName: "Future hazard provider",
      observedAt: "2026-07-01T00:00:00.000Z",
    },
  });

  const observation = (overrides: Partial<Parameters<typeof createMarketHazardObservation>[0]> = {}): MarketHazardObservation => createMarketHazardObservation({
    entry: entry(),
    providerId: "future_hazard_provider",
    providerVersion: "hazard-provider-v1",
    providerState: "healthy",
    sourceRecordId: "flood-record-1",
    sourceRecordKey: "future_hazard_provider:flood-record-1",
    dataset: "flood",
    geography,
    observationMethod: "mapped_indicator",
    sourceSeverityClass: "source_zone",
    normalizedValue: true,
    units: "zone",
    period: "current",
    observationTime: "2026-07-01T00:00:00.000Z",
    retrievalTime: "2026-07-02T00:00:00.000Z",
    mappedIndicator: true,
    evidenceReference: { sourceRecordId: "flood-record-1", evidenceId: "evidence-flood-1", sourceName: "Future hazard provider" },
    provenance: [provenance],
    freshness: freshness(),
    verificationState: "source_backed",
    confidence: "source_backed",
    ...overrides,
  });

  it("publishes the provider-neutral hazard taxonomy and registered state vocabularies", () => {
    expect(marketHazardCategories).toEqual([
      "flood",
      "coastal_flood",
      "wildfire",
      "wind",
      "hail",
      "hurricane_or_tropical_cyclone",
      "tornado",
      "seismic",
      "landslide",
      "subsidence",
      "sinkhole",
      "heat",
      "drought",
      "water_stress",
      "severe_storm",
      "winter_weather",
      "environmental_site",
      "brownfield",
      "superfund_or_regulated_site",
      "underground_storage",
      "radon",
      "soil_or_geologic",
      "industrial_proximity",
      "rail_proximity",
      "airport_or_noise_proximity",
      "utility_or_pipeline_proximity",
      "water_quality_context",
    ]);
    expect(marketHazardObservationMethods).toContain("professional_report");
    expect(marketHazardSourceSeverityClasses).toContain("source_extreme");
    expect(marketHazardImpactClasses).toContain("professional_review_required");
    expect(marketHazardFindingTypes).toContain("unavailable_context");
    expect(marketHazardProfessionalReviewTypes).toContain("environmental_professional_review");
    expect(marketHazardConflictStates).toContain("professional_vs_modeled");
    expect(marketHazardDegradedStates).toContain("stale_prior_valid");
    expect(marketHazardExplanationCodes).toContain("property_specific_status_unknown");
    expect(isMarketHazardCategory("flood")).toBe(true);
    expect(isMarketHazardObservationMethod("mapped_indicator")).toBe(true);
    expect(isMarketHazardSourceSeverityClass("source_zone")).toBe(true);
    expect(isMarketHazardImpactClass("material_context")).toBe(true);
  });

  it("creates a deterministic hazard registry without providers or live integrations", () => {
    const flood = entry();
    const wildfire = entry({ hazardId: "wildfire.context", category: "wildfire", dataset: "wildfire", professionalReviewType: "wildfire_mitigation_review" });
    const registry = createMarketHazardRegistry([wildfire, flood]);

    expect(flood.contractVersion).toBe(MARKET_HAZARD_CONTRACT_VERSION);
    expect(registry.version).toBe(MARKET_HAZARD_REGISTRY_VERSION);
    expect(registry.entries.map((item) => item.hazardId)).toEqual(["flood.context", "wildfire.context"]);
    expect(createMarketHazardRegistry([flood, wildfire]).materialHash).toBe(registry.materialHash);
    expect(selectMarketHazardRegistryEntry({ registry, hazardId: "flood.context" }).hazardId).toBe("flood.context");
    expect(() => createMarketHazardRegistry([flood, flood])).toThrow("Duplicate market hazard registry entry");
    expect(() => defineMarketHazardRegistryEntry({ ...flood, lifecycleStatus: "disabled" })).toThrow("replacement hazard reference");
  });

  it("distinguishes mapped indicators from property-specific determinations", () => {
    const mapped = observation();
    const professional = observation({
      observationMethod: "professional_report",
      mappedIndicator: false,
      propertySpecificDetermination: "property_specific_professional_determination",
      professionalReviewType: "survey_review",
    });

    expect(mapped.contractVersion).toBe(MARKET_HAZARD_OBSERVATION_CONTRACT_VERSION);
    expect(mapped.mappedIndicator).toBe(true);
    expect(mapped.propertySpecificDetermination).toBe("mapped_indicator_only");
    expect(mapped.explanationCodes).toContain("property_specific_status_unknown");
    expect(professional.mappedIndicator).toBe(false);
    expect(professional.propertySpecificDetermination).toBe("property_specific_professional_determination");
  });

  it("preserves source severity separately from BRIX impact context", () => {
    const source = observation({ sourceSeverityClass: "source_high" });
    const informational = createMarketHazardFinding({
      entry: entry(),
      findingType: "mapped_context",
      geography,
      sourceObservations: [source],
      sourceSeverityClass: "source_high",
      impactClass: "informational",
      verificationState: "source_backed",
      confidence: "source_backed",
    });
    const material = createMarketHazardFinding({
      entry: entry(),
      findingType: "mapped_context",
      geography,
      sourceObservations: [source],
      sourceSeverityClass: "source_high",
      impactClass: "material_context",
      verificationState: "source_backed",
      confidence: "source_backed",
    });

    expect(informational.sourceSeverityClass).toBe("source_high");
    expect(informational.impactClass).toBe("informational");
    expect(material.sourceSeverityClass).toBe("source_high");
    expect(material.impactClass).toBe("material_context");
    expect(material.deterministicHash).not.toBe(informational.deterministicHash);
    expect(material.explanationCodes).toContain("impact_is_context_not_score");
  });

  it("returns only proposal references for strategy and underwriting impact", () => {
    const finding = createMarketHazardFinding({
      entry: entry(),
      findingType: "mapped_context",
      geography,
      sourceObservations: [observation()],
      sourceSeverityClass: "source_zone",
      impactClass: "review_recommended",
      verificationState: "source_backed",
      confidence: "source_backed",
      strategyImpactProposalReferences: ["proposal.strategy.insurance_review"],
      assumptionProposalReferences: ["proposal.assumption.insurance_quote"],
      suggestedActionReference: "action.review_flood_elevation",
    });

    expect(finding.strategyImpactProposalReferences).toEqual(["proposal.strategy.insurance_review"]);
    expect(finding.assumptionProposalReferences).toEqual(["proposal.assumption.insurance_quote"]);
    expect(finding.underwritingMutationAllowed).toBe(false);
    expect(finding.strategyRerankAllowed).toBe(false);
  });

  it("handles proxy geography, degraded freshness, unavailable providers, and prior valid context", () => {
    const staleFreshness = freshness({
      evaluationTime: "2028-08-10T00:00:00.000Z",
      priorValidResultId: "prior-flood-result",
      priorValidSourceRecordId: "prior-flood-record",
    });
    const proxyObservation = observation({
      geography: proxyGeography,
      providerState: "offline",
      freshness: staleFreshness,
      degradedStates: ["stale_prior_valid"],
    });
    const unavailable = observation({
      providerState: "offline",
      freshness: freshness({
        providerState: "offline",
        providerFailure: "provider_unavailable",
        policy: defineCanonicalMarketFreshnessPolicy({
          ...freshnessPolicy,
          policyId: "marketiq.hazard.parcel.unavailable.v1",
          providerFailureBehavior: "unavailable_without_prior",
        }),
        priorValidResultId: undefined,
        priorValidSourceRecordId: undefined,
      }),
      degradedStates: ["provider_unavailable", "source_unavailable"],
    });

    expect(proxyObservation.geography.proxy).toBe(true);
    expect(proxyObservation.explanationCodes).toContain("geography_proxy_used");
    expect(proxyObservation.explanationCodes).toContain("stale_prior_valid_retained");
    expect(unavailable.freshnessState).toBe("unavailable");
    expect(unavailable.explanationCodes).toContain("provider_data_unavailable");
  });

  it("creates blocked conflict manifests instead of choosing a silent winner", () => {
    const modeled = observation({ sourceRecordId: "modeled-1", sourceRecordKey: "provider:modeled-1", observationMethod: "modeled_estimate", sourceSeverityClass: "source_low" });
    const professional = observation({ sourceRecordId: "professional-1", sourceRecordKey: "provider:professional-1", observationMethod: "professional_report", sourceSeverityClass: "source_high" });
    const conflict = createMarketHazardConflictManifest({
      entry: entry(),
      conflictState: "professional_vs_modeled",
      observations: [professional, modeled],
      geography,
      reasonCodes: ["conflicting_sources"],
    });
    const finding = createMarketHazardFinding({
      entry: entry(),
      findingType: "conflict_context",
      geography,
      sourceObservations: [modeled, professional],
      sourceSeverityClass: "source_unknown",
      impactClass: "professional_review_required",
      conflictState: "professional_vs_modeled",
      verificationState: "source_backed",
      confidence: "unknown",
    });

    expect(conflict.contractVersion).toBe(MARKET_HAZARD_CONFLICT_CONTRACT_VERSION);
    expect(conflict.blockedUntilResolved).toBe(true);
    expect(conflict.observationIds).toEqual([modeled.observationId, professional.observationId].sort());
    expect(finding.conflictState).toBe("professional_vs_modeled");
    expect(finding.degradedStates).toContain("conflicting_sources");
  });

  it("projects runtime-neutral findings with stable hashes and no raw payloads", () => {
    const finding = createMarketHazardFinding({
      entry: entry(),
      findingType: "mapped_context",
      geography,
      sourceObservations: [observation()],
      sourceSeverityClass: "source_zone",
      impactClass: "review_recommended",
      verificationState: "source_backed",
      confidence: "source_backed",
    });
    const projection = projectMarketHazardFinding(finding);

    expect(finding.contractVersion).toBe(MARKET_HAZARD_FINDING_CONTRACT_VERSION);
    expect(projection.findingId).toBe(finding.findingId);
    expect(projection.sourceObservationIds).toEqual(finding.sourceObservationIds);
    expect(projection.deterministicHash).toBe(projectMarketHazardFinding(finding).deterministicHash);
    expect(JSON.stringify(projection)).not.toMatch(/rawPayload|normalizedPayload|secret|token/i);
  });

  it("keeps deterministic hashes sensitive to material source, geography, freshness, and conflict changes", () => {
    const base = observation();
    const same = observation();
    const changedGeography = observation({ geography: proxyGeography });
    const changedSource = observation({ sourceRecordId: "flood-record-2", sourceRecordKey: "future_hazard_provider:flood-record-2" });
    const changedMethod = observation({ observationMethod: "modeled_estimate" });
    const changedFreshness = observation({ freshness: freshness({ sourceConflict: true }) });

    expect(same.deterministicHash).toBe(base.deterministicHash);
    expect(changedGeography.deterministicHash).not.toBe(base.deterministicHash);
    expect(changedSource.deterministicHash).not.toBe(base.deterministicHash);
    expect(changedMethod.deterministicHash).not.toBe(base.deterministicHash);
    expect(changedFreshness.deterministicHash).not.toBe(base.deterministicHash);
    expect(freshness().contractVersion).toBe(CANONICAL_MARKET_FRESHNESS_CONTRACT_VERSION);
  });

  it("emits safe diagnostics without provider payloads or sensitive material", () => {
    expect(marketHazardDiagnostics("hazard_conflict_detected", {
      workspaceId: "workspace-1",
      hazardId: "flood.context",
      findingId: "finding-1",
      conflictState: "provider_conflict",
      freshnessState: "conflicted",
    })).toEqual({
      event: "hazard_conflict_detected",
      workspaceScoped: true,
      hazardScoped: true,
      findingScoped: true,
      conflictState: "provider_conflict",
      freshnessState: "conflicted",
    });
  });

  it("keeps hazard authority runtime-neutral and out of UI, provider, network, AI, and live data layers", () => {
    const source = readFileSync(join(process.cwd(), "src/core/marketHazards.ts"), "utf8");
    expect(source).not.toMatch(/\bfetch\b|XMLHttpRequest|supabase|invokeBrixFunction|React|useState|useMemo|SwiftUI|URLSession|OpenAI|chat|Zillow|Realtor|LoopNet|Crexi|MLS|FEMA|NOAA|Google|Apple Maps|Mapbox|localStorage|sessionStorage/i);
  });
});

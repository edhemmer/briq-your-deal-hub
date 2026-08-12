import { describe, expect, it } from "vitest";
import {
  MARKET_LOCAL_RISK_COMPARISON_CONTRACT_VERSION,
  MARKET_LOCAL_RISK_CONFLICT_CONTRACT_VERSION,
  MARKET_LOCAL_RISK_CONTRACT_VERSION,
  MARKET_LOCAL_RISK_DERIVED_RATE_CONTRACT_VERSION,
  MARKET_LOCAL_RISK_FINDING_CONTRACT_VERSION,
  MARKET_LOCAL_RISK_OBSERVATION_CONTRACT_VERSION,
  MARKET_LOCAL_RISK_PROJECTION_CONTRACT_VERSION,
  MARKET_LOCAL_RISK_REGISTRY_VERSION,
  assertNoProhibitedMarketLocalRiskLanguage,
  assertNoProtectedMarketLocalRiskProxy,
  createMarketLocalRiskComparison,
  createMarketLocalRiskConflictManifest,
  createMarketLocalRiskFinding,
  createMarketLocalRiskObservation,
  createMarketLocalRiskRegistry,
  defineMarketLocalRiskRegistryEntry,
  deriveMarketLocalRiskRate,
  isMarketLocalRiskCoverageState,
  isMarketLocalRiskExplanationCode,
  isMarketLocalRiskIncidentType,
  marketLocalRiskCategories,
  marketLocalRiskComparisonKinds,
  marketLocalRiskConflictStates,
  marketLocalRiskCoverageStates,
  marketLocalRiskDegradedStates,
  marketLocalRiskDenominatorTypes,
  marketLocalRiskExplanationCodes,
  marketLocalRiskGeographyRelationships,
  marketLocalRiskIncidentTypes,
  marketLocalRiskMethods,
  marketLocalRiskPeriodWindows,
  marketLocalRiskUnits,
  marketLocalRiskValueKinds,
  projectMarketLocalRiskFinding,
  selectMarketLocalRiskRegistryEntry,
  type MarketLocalRiskGeography,
  type MarketLocalRiskObservation,
  type MarketLocalRiskPeriod,
  type MarketLocalRiskRegistryEntry,
  type MarketLocalRiskValue,
} from "../core/marketLocalRisk";
import { createMarketProviderProvenance } from "../core/marketSourceIngestion";

describe("MarketIQ local risk context contract", () => {
  const sourceReference = {
    sourceRecordId: "local-risk-source-1",
    evidenceId: "evidence-local-risk-1",
    sourceName: "Future public local risk source",
    observedAt: "2026-01-01T00:00:00.000Z",
    effectiveAt: "2026-01-01T00:00:00.000Z",
  };

  const provenance = createMarketProviderProvenance({
    providerId: "future_local_risk_provider",
    providerVersion: "local-risk-provider-v1",
    providerRecordReference: "local-risk-source-1",
    observationTime: "2026-01-01T00:00:00.000Z",
    effectiveTime: "2026-01-01T00:00:00.000Z",
    retrievalTime: "2026-08-12T00:00:00.000Z",
    verificationState: "source_backed",
    confidence: "source_backed",
    evidenceReference: sourceReference,
  });

  const entry = (overrides: Partial<Parameters<typeof defineMarketLocalRiskRegistryEntry>[0]> = {}): MarketLocalRiskRegistryEntry =>
    defineMarketLocalRiskRegistryEntry({
      contextId: "local-risk.property-crime",
      semanticVersion: "1.0.0",
      category: "property_related_incident",
      incidentType: "property_crime_reported",
      valueKind: "raw_count",
      unit: "incidents",
      applicableDatasets: ["crime_context"],
      supportedGeographyLevels: ["address", "municipality", "county", "custom_market_boundary", "neighborhood"],
      supportedMethods: ["count", "public_record", "source_reported", "user_entered_evidence"],
      supportedPeriodWindows: ["calendar_month", "calendar_year", "trailing_12_months"],
      allowedDenominatorTypes: ["none", "population", "households", "properties", "source_defined"],
      lifecycleStatus: "active",
      permittedProposalKinds: ["market_context_reference", "verification_task"],
      prohibitedInferenceCodes: ["do_not_score_safety"],
      registeredAt: "2026-08-12T00:00:00.000Z",
      ...overrides,
    });

  const geography = (overrides: Partial<MarketLocalRiskGeography> = {}): MarketLocalRiskGeography => ({
    geographyLevel: "municipality",
    geographyIdentity: "municipality:example-il",
    canonicalLocationId: "loc-local-risk-1",
    boundaryId: "municipality-boundary-1",
    boundaryVersion: "2026",
    relationship: "municipality_context",
    proxy: false,
    ...overrides,
  });

  const period = (overrides: Partial<MarketLocalRiskPeriod> = {}): MarketLocalRiskPeriod => ({
    window: "calendar_year",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    sourceFrequency: "annual",
    historical: true,
    current: false,
    retrievalTime: "2026-08-12T00:00:00.000Z",
    ...overrides,
  });

  const value = (overrides: Partial<MarketLocalRiskValue> = {}): MarketLocalRiskValue => ({
    rawValue: 42,
    normalizedValue: 42,
    valueKind: "raw_count",
    unit: "incidents",
    numeratorDefinition: "Source-reported incidents",
    valueOrigin: "source_reported",
    ...overrides,
  });

  const observation = (overrides: Partial<Parameters<typeof createMarketLocalRiskObservation>[0]> = {}): MarketLocalRiskObservation => {
    const selectedEntry = overrides.entry ?? entry();
    return createMarketLocalRiskObservation({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      canonicalLocationId: "loc-local-risk-1",
      entry: selectedEntry,
      geography: geography(),
      period: period(),
      value: value(),
      method: "source_reported",
      providerId: "future_local_risk_provider",
      providerVersion: "local-risk-provider-v1",
      providerState: "healthy",
      dataset: "crime_context",
      sourceRecordId: "local-risk-source-1",
      sourceRecordKey: "future_local_risk_provider:local-risk-source-1",
      evidenceReference: sourceReference,
      provenance: [provenance],
      verificationState: "source_backed",
      confidence: "source_backed",
      ...overrides,
    });
  };

  it("publishes local-risk taxonomy without safety, desirability, or protected-class scoring", () => {
    expect(marketLocalRiskCategories).toEqual(expect.arrayContaining(["reported_activity", "property_related_incident", "person_related_incident", "traffic_incident", "coverage_context"]));
    expect(marketLocalRiskIncidentTypes).toEqual(expect.arrayContaining(["property_crime_reported", "violent_crime_reported", "emergency_call_reported", "code_enforcement_reported", "unknown"]));
    expect(marketLocalRiskValueKinds).toEqual(expect.arrayContaining(["raw_count", "source_reported_rate", "brix_derived_rate", "population_normalized_rate", "coverage_state"]));
    expect(marketLocalRiskUnits).toEqual(expect.arrayContaining(["incidents", "calls", "rate_per_1000_population", "rate_per_100_properties"]));
    expect(marketLocalRiskMethods).toEqual(expect.arrayContaining(["source_reported", "public_record", "brix_derived", "user_entered_evidence"]));
    expect(marketLocalRiskDenominatorTypes).toEqual(expect.arrayContaining(["population", "households", "properties", "none", "unknown"]));
    expect(marketLocalRiskPeriodWindows).toEqual(expect.arrayContaining(["calendar_month", "calendar_year", "trailing_12_months"]));
    expect(marketLocalRiskCoverageStates).toEqual(expect.arrayContaining(["adequate_coverage", "no_source_coverage", "provider_unavailable", "stale_prior_valid", "incompatible_reporting_definitions"]));
    expect(marketLocalRiskGeographyRelationships).toEqual(expect.arrayContaining(["property_or_parcel", "neighborhood_proxy", "municipality_context", "county_context"]));
    expect(marketLocalRiskComparisonKinds).toEqual(expect.arrayContaining(["prior_period", "broader_geography", "peer_geography"]));
    expect(marketLocalRiskConflictStates).toEqual(expect.arrayContaining(["methodology_conflict", "denominator_conflict", "category_definition_conflict"]));
    expect(marketLocalRiskDegradedStates).toEqual(expect.arrayContaining(["zero_denominator", "missing_denominator", "provider_unavailable", "proxy_only_geography"]));
    expect(marketLocalRiskExplanationCodes).toEqual(expect.arrayContaining(["no_safety_label", "no_neighborhood_desirability_score", "no_demographic_proxy", "no_protected_class_scoring", "proposal_only"]));
    expect(isMarketLocalRiskIncidentType("property_crime_reported")).toBe(true);
    expect(isMarketLocalRiskCoverageState("no_source_coverage")).toBe(true);
    expect(isMarketLocalRiskExplanationCode("no_safety_label")).toBe(true);
  });

  it("creates deterministic provider-neutral registries and rejects duplicates", () => {
    const property = entry();
    const traffic = entry({
      contextId: "local-risk.traffic",
      category: "traffic_incident",
      incidentType: "traffic_incident_reported",
      applicableDatasets: ["transportation_access"],
    });
    const registry = createMarketLocalRiskRegistry([traffic, property]);
    const registryAgain = createMarketLocalRiskRegistry([property, traffic]);

    expect(property.contractVersion).toBe(MARKET_LOCAL_RISK_CONTRACT_VERSION);
    expect(registry.version).toBe(MARKET_LOCAL_RISK_REGISTRY_VERSION);
    expect(registry.entries.map((item) => item.contextId)).toEqual(["local-risk.property-crime", "local-risk.traffic"]);
    expect(registry.materialHash).toBe(registryAgain.materialHash);
    expect(selectMarketLocalRiskRegistryEntry({ registry, contextId: "local-risk.property-crime" }).contextId).toBe("local-risk.property-crime");
    expect(() => createMarketLocalRiskRegistry([property, property])).toThrow(/Duplicate market local-risk registry entry/);
    expect(JSON.stringify(registry)).not.toMatch(/apiKey|secret|oauth|token/i);
  });

  it("records source, provenance, geography, period, methodology, coverage, and deterministic hashes", () => {
    const observed = observation();

    expect(observed.contractVersion).toBe(MARKET_LOCAL_RISK_OBSERVATION_CONTRACT_VERSION);
    expect(observed.workspaceId).toBe("workspace-1");
    expect(observed.dataset).toBe("crime_context");
    expect(observed.providerId).toBe("future_local_risk_provider");
    expect(observed.geography.geographyLevel).toBe("municipality");
    expect(observed.period.window).toBe("calendar_year");
    expect(observed.value.valueKind).toBe("raw_count");
    expect(observed.coverageState).toBe("adequate_coverage");
    expect(observed.provenance[0].providerRecordReference).toBe("local-risk-source-1");
    expect(observed.explanationCodes).toEqual(expect.arrayContaining(["event_count_reported", "period_declared", "geography_declared", "methodology_preserved", "factual_context_only", "proposal_only"]));
    expect(observed.deterministicHash).toMatch(/^mlr_obsh_/);
  });

  it("flags proxy geography and unsupported geography without turning context into a conclusion", () => {
    const proxy = observation({
      geography: geography({
        geographyLevel: "county",
        geographyIdentity: "county:example-il",
        relationship: "county_context",
        proxy: true,
        proxyReason: "Only county-level records were available.",
      }),
    });

    expect(proxy.degradedStates).toContain("proxy_only_geography");
    expect(proxy.explanationCodes).toEqual(expect.arrayContaining(["proxy_geography_used", "no_safety_label", "no_neighborhood_desirability_score", "no_demographic_proxy"]));
    expect(proxy.explanationCodes).toContain("no_safety_label");
  });

  it("derives rates only with positive denominators and declared methodology", () => {
    const observed = observation();
    const rate = deriveMarketLocalRiskRate({
      workspaceId: "workspace-1",
      sourceObservation: observed,
      denominator: {
        denominatorType: "population",
        value: 50_000,
        sourceRecordId: "population-source-1",
        methodology: "public_record",
      },
      ratePer: 1000,
      unit: "rate_per_1000_population",
      formulaId: "local-risk-rate-per-population",
      formulaVersion: "1.0.0",
    });

    expect(rate.contractVersion).toBe(MARKET_LOCAL_RISK_DERIVED_RATE_CONTRACT_VERSION);
    expect(rate.value.normalizedValue).toBe(0.84);
    expect(rate.value.valueKind).toBe("population_normalized_rate");
    expect(rate.explanationCodes).toEqual(expect.arrayContaining(["brix_rate_derived", "denominator_method_declared", "proposal_only"]));
    expect(() => deriveMarketLocalRiskRate({
      workspaceId: "workspace-1",
      sourceObservation: observed,
      denominator: { denominatorType: "population", value: 0, methodology: "public_record" },
      ratePer: 1000,
      unit: "rate_per_1000_population",
      formulaId: "local-risk-rate-per-population",
      formulaVersion: "1.0.0",
    })).toThrow(/positive denominator/);
  });

  it("supports compatible comparisons and rejects incompatible reporting definitions", () => {
    const current = observation({ value: value({ rawValue: 42, normalizedValue: 42 }) });
    const prior = observation({
      sourceRecordId: "local-risk-source-2",
      sourceRecordKey: "future_local_risk_provider:local-risk-source-2",
      period: period({ periodStart: "2025-01-01", periodEnd: "2025-12-31" }),
      value: value({ rawValue: 50, normalizedValue: 50 }),
    });
    const comparison = createMarketLocalRiskComparison({
      workspaceId: "workspace-1",
      comparisonKind: "prior_year",
      currentObservation: current,
      comparisonObservation: prior,
    });

    expect(comparison.contractVersion).toBe(MARKET_LOCAL_RISK_COMPARISON_CONTRACT_VERSION);
    expect(comparison.compatibility).toBe("compatible");
    expect(comparison.difference).toBe(-8);
    expect(comparison.percentChange).toBe(-0.16);

    const incompatible = createMarketLocalRiskComparison({
      workspaceId: "workspace-1",
      comparisonKind: "prior_year",
      currentObservation: current,
      comparisonObservation: observation({
        sourceRecordId: "local-risk-source-3",
        sourceRecordKey: "future_local_risk_provider:local-risk-source-3",
        method: "public_record",
      }),
    });
    expect(incompatible.compatibility).toBe("rejected");
    expect(incompatible.conflictState).toBe("methodology_conflict");
    expect(incompatible.reasonCodes).toContain("comparison_rejected");
  });

  it("fails closed for no coverage, no verified observations, provider unavailable, and stale prior valid states", () => {
    const coverageEntry = entry({
      contextId: "local-risk.coverage",
      category: "coverage_context",
      incidentType: "unknown",
      valueKind: "coverage_state",
      unit: "coverage",
    });
    const noCoverage = observation({
      entry: coverageEntry,
      coverageState: "no_source_coverage",
      value: value({ rawValue: null, normalizedValue: null, valueKind: "coverage_state", unit: "coverage" }),
    });
    const unavailable = observation({ providerState: "offline", coverageState: "provider_unavailable" });
    const stalePrior = observation({
      coverageState: "stale_prior_valid",
      freshness: {
        freshnessResultId: "freshness-local-risk-1",
        policyId: "local-risk-freshness-policy",
        policyVersion: "1.0.0",
        providerId: "future_local_risk_provider",
        providerVersion: "local-risk-provider-v1",
        datasetId: "crime_context",
        dataset: "crime_context",
        datasetCategory: "local_risk_input",
        sourceRecordId: "local-risk-source-1",
        evidenceReference: sourceReference,
        canonicalLocationId: "loc-local-risk-1",
        geographyLevel: "municipality",
        geographyIdentity: "municipality:example-il",
        boundaryVersion: "2026",
        observationTime: "2025-01-01T00:00:00.000Z",
        retrievalTime: "2026-08-12T00:00:00.000Z",
        evaluationAsOf: "2026-08-12T00:00:00.000Z",
        timeSemantics: "instant",
        ageBasis: "observation_time",
        calculatedAgeDays: 588,
        freshnessState: "stale",
        staleReasons: ["beyond_stale_threshold"],
        thresholdReferences: { staleAfterDays: 365, expectedCadence: "annual" },
        verificationState: "source_backed",
        sourceConfidence: "source_backed",
        refreshEligibility: {
          state: "provider_unavailable",
          reason: "provider_failed_prior_valid_retained",
          datasetId: "crime_context",
        },
        priorValidResultId: "freshness-prior-valid-1",
        priorValidSourceRecordId: "local-risk-source-1",
        manualReviewRequired: true,
        explanationCodes: ["provider_failed_prior_valid_retained"],
        contractVersion: "canonical-market-freshness-v1",
        materialHash: "cmfr_stale_local_risk_1",
      },
    });

    expect(noCoverage.coverageState).toBe("no_source_coverage");
    expect(noCoverage.limitationCodes).toContain("no_source_coverage_not_zero");
    expect(noCoverage.explanationCodes).toContain("no_source_coverage_not_zero");
    expect(unavailable.degradedStates).toContain("provider_unavailable");
    expect(stalePrior.coverageState).toBe("stale_prior_valid");
    expect(stalePrior.degradedStates).toContain("stale_prior_valid");
    expect(stalePrior.explanationCodes).toContain("stale_prior_valid_retained");
  });

  it("creates findings, projections, and conflict manifests without underwriting or strategy mutation", () => {
    const current = observation();
    const conflicting = observation({
      sourceRecordId: "local-risk-source-2",
      sourceRecordKey: "future_local_risk_provider:local-risk-source-2",
      coverageState: "conflicting_sources",
    });
    const comparison = createMarketLocalRiskComparison({
      workspaceId: "workspace-1",
      comparisonKind: "peer_geography",
      currentObservation: current,
      comparisonObservation: conflicting,
    });
    const finding = createMarketLocalRiskFinding({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      findingType: "coverage_context",
      sourceObservations: [conflicting, current],
      comparisons: [comparison],
      impactClass: "verification_needed",
      confidence: "source_backed",
      verificationState: "source_backed",
      stableOrdinal: 2,
    });
    const projection = projectMarketLocalRiskFinding(finding);
    const manifest = createMarketLocalRiskConflictManifest({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      conflictState: "coverage_conflict",
      observations: [conflicting, current],
    });

    expect(finding.contractVersion).toBe(MARKET_LOCAL_RISK_FINDING_CONTRACT_VERSION);
    expect(finding.underwritingMutationAllowed).toBe(false);
    expect(finding.strategyRerankAllowed).toBe(false);
    expect(finding.safetyConclusionAllowed).toBe(false);
    expect(finding.investmentQualityInferenceAllowed).toBe(false);
    expect(finding.explanationCodes).toEqual(expect.arrayContaining(["underwriting_not_mutated", "strategy_not_mutated", "no_protected_class_scoring"]));
    expect(projection.contractVersion).toBe(MARKET_LOCAL_RISK_PROJECTION_CONTRACT_VERSION);
    expect(projection.recommendationMutationAllowed).toBe(false);
    expect(manifest.contractVersion).toBe(MARKET_LOCAL_RISK_CONFLICT_CONTRACT_VERSION);
    expect(manifest.blockedUntilResolved).toBe(true);
  });

  it("blocks prohibited safety/desirability labels and protected proxy fields", () => {
    expect(assertNoProhibitedMarketLocalRiskLanguage("Reported activity count for the period.")).toBe(true);
    expect(() => assertNoProhibitedMarketLocalRiskLanguage("This is a safe neighborhood.")).toThrow(/cannot use safety/);
    expect(assertNoProtectedMarketLocalRiskProxy("source_reporting_boundary")).toBe(true);
    expect(() => assertNoProtectedMarketLocalRiskProxy("race")).toThrow(/protected-class/);
  });

  it("prevents workspace leakage and preserves deterministic ordering across inputs", () => {
    const current = observation();
    const outside = observation({ workspaceId: "workspace-2", propertyId: "property-2", dealId: "deal-2" });

    expect(() => createMarketLocalRiskComparison({
      workspaceId: "workspace-1",
      comparisonKind: "peer_geography",
      currentObservation: current,
      comparisonObservation: outside,
    })).toThrow(/cross workspace/);

    const first = observation({ sourceRecordId: "local-risk-source-a", sourceRecordKey: "a" });
    const second = observation({ sourceRecordId: "local-risk-source-b", sourceRecordKey: "b" });
    const findingA = createMarketLocalRiskFinding({
      workspaceId: "workspace-1",
      findingType: "reported_context",
      sourceObservations: [first, second],
      impactClass: "informational",
      confidence: "source_backed",
      verificationState: "source_backed",
    });
    const findingB = createMarketLocalRiskFinding({
      workspaceId: "workspace-1",
      findingType: "reported_context",
      sourceObservations: [second, first],
      impactClass: "informational",
      confidence: "source_backed",
      verificationState: "source_backed",
    });

    expect(findingA.deterministicHash).toBe(findingB.deterministicHash);
    expect(findingA.sourceObservationIds).toEqual(findingB.sourceObservationIds);
  });

  it("has no network, AI, provider SDK, or canonical property/deal write surface", () => {
    const observed = observation();
    const serialized = JSON.stringify(observed);

    expect(serialized).not.toMatch(/fetch|XMLHttpRequest|openai|anthropic|sdk|apiKey|secret|oauth|token/i);
    expect(serialized).not.toMatch(/canonicalPropertyCreated|dealCreated|underwritingUpdated|strategyScoreUpdated/i);
    expect(observed.explanationCodes).toEqual(expect.arrayContaining(["no_future_crime_prediction", "no_property_value_conclusion", "no_rent_growth_conclusion", "no_investment_quality_inference"]));
  });
});

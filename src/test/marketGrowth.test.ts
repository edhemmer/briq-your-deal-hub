import { describe, expect, it } from "vitest";
import {
  MARKET_GROWTH_COMPARISON_CONTRACT_VERSION,
  MARKET_GROWTH_CONFLICT_CONTRACT_VERSION,
  MARKET_GROWTH_CONTRACT_VERSION,
  MARKET_GROWTH_DERIVED_METRIC_CONTRACT_VERSION,
  MARKET_GROWTH_FINDING_CONTRACT_VERSION,
  MARKET_GROWTH_OBSERVATION_CONTRACT_VERSION,
  MARKET_GROWTH_PROJECTION_CONTRACT_VERSION,
  MARKET_GROWTH_REGISTRY_VERSION,
  createMarketGrowthComparison,
  createMarketGrowthConflictManifest,
  createMarketGrowthFinding,
  createMarketGrowthObservation,
  createMarketGrowthRegistry,
  defineMarketGrowthRegistryEntry,
  deriveMarketGrowthMetric,
  isMarketGrowthFindingType,
  isMarketGrowthMetricType,
  isMarketGrowthSegmentKind,
  marketGrowthCategories,
  marketGrowthComparisonKinds,
  marketGrowthConflictStates,
  marketGrowthDegradedStates,
  marketGrowthEmployerEventStates,
  marketGrowthExplanationCodes,
  marketGrowthFindingTypes,
  marketGrowthFrequencies,
  marketGrowthImpactClasses,
  marketGrowthIndustryClassificationSystems,
  marketGrowthMethods,
  marketGrowthMetricTypes,
  marketGrowthPeriodWindows,
  marketGrowthReviewActions,
  marketGrowthSampleQualityStates,
  marketGrowthSegmentKinds,
  marketGrowthUnits,
  marketGrowthValueKinds,
  projectMarketGrowthFinding,
  selectMarketGrowthRegistryEntry,
  type MarketGrowthObservation,
  type MarketGrowthRegistryEntry,
} from "../core/marketGrowth";
import { createMarketProviderProvenance } from "../core/marketSourceIngestion";

describe("MarketIQ growth and economic-direction context contract", () => {
  const sourceReference = {
    sourceRecordId: "growth-source-1",
    evidenceId: "evidence-growth-1",
    sourceName: "Future public demographic source",
    observedAt: "2026-06-30T00:00:00.000Z",
    effectiveAt: "2026-01-01T00:00:00.000Z",
  };

  const provenance = createMarketProviderProvenance({
    providerId: "future_growth_provider",
    providerVersion: "growth-provider-v1",
    providerRecordReference: "growth-source-1",
    observationTime: "2026-06-30T00:00:00.000Z",
    effectiveTime: "2026-01-01T00:00:00.000Z",
    retrievalTime: "2026-08-11T00:00:00.000Z",
    verificationState: "source_backed",
    confidence: "source_backed",
    evidenceReference: sourceReference,
  });

  const entry = (overrides: Partial<Parameters<typeof defineMarketGrowthRegistryEntry>[0]> = {}): MarketGrowthRegistryEntry => defineMarketGrowthRegistryEntry({
    metricId: "growth.population-level",
    semanticVersion: "1.0.0",
    metricType: "population_level",
    category: "population",
    unit: "people",
    valueKind: "level",
    applicableDatasets: ["population_level"],
    supportedGeographyLevels: ["municipality", "county", "metropolitan_area", "region"],
    supportedSegmentKinds: ["total_population"],
    supportedPeriodWindows: ["calendar_year", "acs_5_year", "decennial"],
    supportedMethods: ["source_reported", "count"],
    minimumPeriodsRequired: 1,
    requiresIndustryClassification: false,
    allowsDerived: false,
    lifecycleStatus: "active",
    permittedProposalKinds: ["market_context_reference", "strategy_confidence_review"],
    prohibitedInferenceCodes: ["do_not_forecast_value", "do_not_score_protected_classes", "do_not_infer_neighborhood_quality"],
    registeredAt: "2026-08-11T00:00:00.000Z",
    ...overrides,
  });

  const geography = (overrides: Partial<Parameters<typeof createMarketGrowthObservation>[0]["geography"]> = {}) => ({
    geographyLevel: "municipality" as const,
    geographyIdentity: "municipality:future-il",
    canonicalLocationId: "loc-market-1",
    boundaryId: "municipality-boundary-1",
    boundaryVersion: "2026",
    proxy: false,
    ...overrides,
  });

  const segment = (overrides: Partial<Parameters<typeof createMarketGrowthObservation>[0]["segment"]> = {}) => ({
    segmentKind: "total_population" as const,
    segmentIdentity: "total_population",
    sourceReference,
    ...overrides,
  });

  const period = (overrides: Partial<Parameters<typeof createMarketGrowthObservation>[0]["period"]> = {}) => ({
    window: "calendar_year" as const,
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    sourceFrequency: "annual" as const,
    partialPeriod: false,
    historical: true,
    projected: false,
    inferred: false,
    annualized: false as const,
    ...overrides,
  });

  const sample = (overrides: Partial<Parameters<typeof createMarketGrowthObservation>[0]["sample"]> = {}) => ({
    sampleCount: 1,
    recordCount: 1,
    sourceCoverage: "complete" as const,
    minimumPeriodsRequired: 1,
    periodsAvailable: 1,
    minimumHistoryMet: true,
    completenessIndicator: 1,
    sampleQualityState: "adequate_history" as const,
    ...overrides,
  });

  const value = (overrides: Partial<Parameters<typeof createMarketGrowthObservation>[0]["value"]> = {}) => ({
    rawValue: 50_000,
    normalizedValue: 50_000,
    unit: "people" as const,
    valueKind: "level" as const,
    valueOrigin: "source_reported" as const,
    ...overrides,
  });

  const observation = (overrides: Partial<Parameters<typeof createMarketGrowthObservation>[0]> = {}): MarketGrowthObservation => {
    const selectedEntry = overrides.entry ?? entry();
    return createMarketGrowthObservation({
    workspaceId: "workspace-1",
    propertyId: "property-1",
    dealId: "deal-1",
    canonicalLocationId: "loc-market-1",
    entry: selectedEntry,
    geography: geography(),
    segment: segment(),
    period: period(),
    value: value(),
    sample: sample(),
    method: "source_reported",
    providerId: "future_growth_provider",
    providerVersion: "growth-provider-v1",
    providerState: "healthy",
    dataset: selectedEntry.applicableDatasets[0],
    sourceRecordId: "growth-source-1",
    sourceRecordKey: "future_growth_provider:growth-source-1",
    evidenceReference: sourceReference,
    provenance: [provenance],
    verificationState: "source_backed",
    confidence: "source_backed",
    ...overrides,
    });
  };

  it("publishes the complete provider-neutral growth taxonomy and fair-housing guardrails", () => {
    expect(marketGrowthMetricTypes).toEqual(expect.arrayContaining(["population_level", "household_formation", "net_migration", "median_household_income", "employment_growth_rate", "industry_concentration", "major_employer_presence", "employer_closure", "commute_time"]));
    expect(marketGrowthCategories).toEqual(expect.arrayContaining(["population", "households", "income", "employment", "economic_base", "commuting"]));
    expect(marketGrowthUnits).toEqual(expect.arrayContaining(["people", "households", "jobs", "money", "event"]));
    expect(marketGrowthValueKinds).toEqual(expect.arrayContaining(["level", "absolute_change", "growth_rate", "distribution", "event"]));
    expect(marketGrowthPeriodWindows).toEqual(expect.arrayContaining(["calendar_year", "acs_5_year", "decennial", "trailing_12_months"]));
    expect(marketGrowthFrequencies).toContain("annual");
    expect(marketGrowthMethods).toEqual(expect.arrayContaining(["percent_change", "absolute_difference", "cagr", "hhi", "top_n_share"]));
    expect(marketGrowthSegmentKinds).toEqual(expect.arrayContaining(["total_population", "owner_households", "renter_households", "industry", "employer", "commuter"]));
    expect(marketGrowthIndustryClassificationSystems).toContain("naics");
    expect(marketGrowthEmployerEventStates).toEqual(expect.arrayContaining(["announced", "expansion", "closure_announced", "closed", "cancelled"]));
    expect(marketGrowthSampleQualityStates).toContain("insufficient_history");
    expect(marketGrowthComparisonKinds).toContain("local_vs_county");
    expect(marketGrowthConflictStates).toContain("classification_conflict");
    expect(marketGrowthDegradedStates).toEqual(expect.arrayContaining(["provider_unavailable", "insufficient_history", "stale_prior_valid", "permission_restricted"]));
    expect(marketGrowthExplanationCodes).toEqual(expect.arrayContaining(["no_protected_class_scoring", "no_demographic_desirability", "historical_trend_not_forecast", "no_rent_or_price_forecast"]));
    expect(marketGrowthReviewActions).toContain("employer_announcement_verification");
    expect(marketGrowthImpactClasses).toContain("assumption_review");
    expect(isMarketGrowthMetricType("employment_level")).toBe(true);
    expect(isMarketGrowthSegmentKind("industry")).toBe(true);
    expect(isMarketGrowthFindingType("major_employer_closure_announced")).toBe(true);
  });

  it("creates deterministic metric registry entries for level, change, rate, and distribution without provider write paths", () => {
    const popLevel = entry();
    const popRate = entry({
      metricId: "growth.population-growth-rate",
      metricType: "population_growth_rate",
      unit: "rate",
      valueKind: "growth_rate",
      applicableDatasets: ["population_trend"],
      supportedMethods: ["source_reported", "percent_change"],
      minimumPeriodsRequired: 2,
      allowsDerived: true,
    });
    const ageDistribution = entry({
      metricId: "growth.age-distribution",
      metricType: "age_distribution",
      category: "demographic_structure",
      unit: "distribution",
      valueKind: "distribution",
      applicableDatasets: ["population_level"],
      supportedSegmentKinds: ["age_band"],
      supportedMethods: ["source_reported", "share"],
    });
    const registry = createMarketGrowthRegistry([popRate, ageDistribution, popLevel]);

    expect(registry.version).toBe(MARKET_GROWTH_REGISTRY_VERSION);
    expect(registry.entries.map((item) => item.metricId)).toEqual(["growth.age-distribution", "growth.population-growth-rate", "growth.population-level"]);
    expect(popLevel.contractVersion).toBe(MARKET_GROWTH_CONTRACT_VERSION);
    expect(popLevel.materialHash).toMatch(/^mg_entryh_/);
    expect(selectMarketGrowthRegistryEntry({ registry, metricId: "growth.population-growth-rate" }).allowsDerived).toBe(true);
    expect(Object.keys(popLevel)).not.toEqual(expect.arrayContaining(["providerCredential", "apiKey", "score"]));
  });

  it("preserves population, household, migration, income, and tenure facts as source-linked observations", () => {
    const household = observation({
      entry: entry({ metricId: "growth.households", metricType: "household_count", category: "households", unit: "households", applicableDatasets: ["household_context"], supportedSegmentKinds: ["household_population"] }),
      dataset: "household_context",
      segment: segment({ segmentKind: "household_population", segmentIdentity: "household_population" }),
      value: value({ rawValue: 18_400, normalizedValue: 18_400, unit: "households" }),
    });
    const migration = observation({
      entry: entry({ metricId: "growth.net-migration", metricType: "net_migration", category: "migration", unit: "people", applicableDatasets: ["population_trend"], valueKind: "absolute_change", supportedMethods: ["source_reported"] }),
      dataset: "population_trend",
      value: value({ rawValue: -320, normalizedValue: -320, unit: "people", valueKind: "absolute_change" }),
    });
    const income = observation({
      entry: entry({ metricId: "growth.median-income", metricType: "median_household_income", category: "income", unit: "money", applicableDatasets: ["household_context"], supportedSegmentKinds: ["household_population"], supportedMethods: ["source_reported", "median"] }),
      dataset: "household_context",
      segment: segment({ segmentKind: "household_population", segmentIdentity: "household_population" }),
      value: value({ rawValue: 88_000, normalizedValue: 88_000, unit: "money", currency: "USD" }),
    });
    const tenure = observation({
      entry: entry({ metricId: "growth.ownership-rate", metricType: "ownership_rate", category: "households", unit: "percent", valueKind: "share", applicableDatasets: ["household_context"], supportedSegmentKinds: ["owner_households"], supportedMethods: ["source_reported", "share"] }),
      dataset: "household_context",
      segment: segment({ segmentKind: "owner_households", householdTenure: "owner", segmentIdentity: "owner_households" }),
      value: value({ rawValue: 0.68, normalizedValue: 0.68, unit: "percent", valueKind: "share" }),
    });

    expect(household.explanationCodes).toContain("household_count_increased");
    expect(migration.explanationCodes).toContain("net_migration_negative");
    expect(income.explanationCodes).toContain("income_changed");
    expect(tenure.segment.householdTenure).toBe("owner");
    expect([household, migration, income, tenure].every((item) => item.provenance.length === 1)).toBe(true);
  });

  it("keeps employment, unemployment, labor force, and commuting definitions separate", () => {
    const employment = observation({
      entry: entry({ metricId: "growth.employment", metricType: "employment_level", category: "employment", unit: "jobs", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["labor_force"] }),
      dataset: "employment_level",
      segment: segment({ segmentKind: "labor_force", segmentIdentity: "labor_force" }),
      value: value({ rawValue: 24_000, normalizedValue: 24_000, unit: "jobs" }),
    });
    const unemployment = observation({
      entry: entry({ metricId: "growth.unemployment", metricType: "unemployment_rate", category: "employment", unit: "percent", valueKind: "share", applicableDatasets: ["unemployment"], supportedSegmentKinds: ["labor_force"], supportedMethods: ["source_reported", "share"] }),
      dataset: "unemployment",
      segment: segment({ segmentKind: "labor_force", segmentIdentity: "labor_force" }),
      value: value({ rawValue: 0.047, normalizedValue: 0.047, unit: "percent", valueKind: "share" }),
    });
    const participation = observation({
      entry: entry({ metricId: "growth.lfp", metricType: "labor_force_participation", category: "employment", unit: "percent", valueKind: "share", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["labor_force"], supportedMethods: ["source_reported", "share"] }),
      dataset: "employment_level",
      segment: segment({ segmentKind: "labor_force", segmentIdentity: "labor_force" }),
      value: value({ rawValue: 0.64, normalizedValue: 0.64, unit: "percent", valueKind: "share" }),
    });
    const commute = observation({
      entry: entry({ metricId: "growth.commute-time", metricType: "commute_time", category: "commuting", unit: "minutes", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["commuter"], supportedMethods: ["source_reported", "median"] }),
      dataset: "employment_level",
      segment: segment({ segmentKind: "commuter", commutingContext: "resident_workers", segmentIdentity: "resident_workers:commute_time" }),
      value: value({ rawValue: 31, normalizedValue: 31, unit: "minutes" }),
    });

    expect(employment.explanationCodes).toContain("employment_increased");
    expect(unemployment.explanationCodes).toContain("unemployment_changed");
    expect(participation.explanationCodes).toContain("labor_force_participation_changed");
    expect(commute.segment.commutingContext).toBe("resident_workers");
  });

  it("models industry concentration, diversified employment base, and major-employer events without treating announcements as current jobs", () => {
    const industry = observation({
      entry: entry({ metricId: "growth.industry-share", metricType: "industry_employment_share", category: "economic_base", unit: "percent", valueKind: "share", applicableDatasets: ["industry_concentration"], supportedSegmentKinds: ["industry"], supportedMethods: ["source_reported", "share"], requiresIndustryClassification: true }),
      dataset: "industry_concentration",
      segment: segment({ segmentKind: "industry", industryCode: "62", industryClassificationSystem: "naics", segmentIdentity: "industry:naics:62" }),
      value: value({ rawValue: 0.22, normalizedValue: 0.22, unit: "percent", valueKind: "share" }),
    });
    const concentration = deriveMarketGrowthMetric({
      workspaceId: "workspace-1",
      metricType: "industry_concentration",
      componentObservations: [
        industry,
        observation({ entry: industryEntry("growth.industry-share-2"), segment: segment({ segmentKind: "industry", industryCode: "44", industryClassificationSystem: "naics", segmentIdentity: "industry:naics:44" }), value: value({ rawValue: 0.18, normalizedValue: 0.18, unit: "percent", valueKind: "share" }) }),
        observation({ entry: industryEntry("growth.industry-share-3"), segment: segment({ segmentKind: "industry", industryCode: "31", industryClassificationSystem: "naics", segmentIdentity: "industry:naics:31" }), value: value({ rawValue: 0.12, normalizedValue: 0.12, unit: "percent", valueKind: "share" }) }),
      ],
      formulaId: "economic_base.hhi",
      formulaVersion: "1.0.0",
      unit: "index",
      valueKind: "index",
      method: "hhi",
    });
    const expansion = observation({
      entry: entry({ metricId: "growth.employer-announcement", metricType: "employer_announcement", category: "economic_base", unit: "event", valueKind: "event", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["employer"] }),
      dataset: "employment_level",
      segment: segment({ segmentKind: "employer", employerName: "Future Employer", segmentIdentity: "employer:future-employer" }),
      value: value({ rawValue: "expansion", normalizedValue: null, unit: "event", valueKind: "event" }),
      employerEvent: { eventState: "announced", employerName: "Future Employer", announcedJobs: 500, currentJobs: 0, announcementDate: "2026-05-01", eventSourceReference: sourceReference },
    });
    const closure = observation({
      entry: entry({ metricId: "growth.employer-closure", metricType: "employer_closure", category: "economic_base", unit: "event", valueKind: "event", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["employer"] }),
      dataset: "employment_level",
      segment: segment({ segmentKind: "employer", employerName: "Closing Employer", segmentIdentity: "employer:closing-employer" }),
      value: value({ rawValue: "closure_announced", normalizedValue: null, unit: "event", valueKind: "event" }),
      employerEvent: { eventState: "closure_announced", employerName: "Closing Employer", announcedJobs: 300, currentJobs: 300, announcementDate: "2026-04-01", eventSourceReference: sourceReference },
    });

    expect(concentration.contractVersion).toBe(MARKET_GROWTH_DERIVED_METRIC_CONTRACT_VERSION);
    expect(concentration.value.normalizedValue).toBeCloseTo(0.0904);
    expect(expansion.explanationCodes).toEqual(expect.arrayContaining(["employer_expansion_announced", "announced_jobs_not_current_jobs"]));
    expect(closure.explanationCodes).toContain("employer_closure_announced");
    expect(expansion.limitationCodes).toContain("announced_jobs_not_current_jobs");
  });

  it("supports historical comparisons and broader geography comparisons while rejecting unequal period definitions", () => {
    const current = observation({ value: value({ rawValue: 50_000, normalizedValue: 50_000 }) });
    const prior = observation({ period: period({ periodStart: "2025-01-01", periodEnd: "2025-12-31" }), value: value({ rawValue: 48_000, normalizedValue: 48_000 }) });
    const county = observation({ geography: geography({ geographyLevel: "county", geographyIdentity: "county:future-il" }), value: value({ rawValue: 250_000, normalizedValue: 250_000 }) });
    const priorComparison = createMarketGrowthComparison({
      workspaceId: "workspace-1",
      comparisonKind: "current_vs_prior_year",
      currentObservation: current,
      comparisonObservation: prior,
      methodVersion: "growth-comparison-v1",
    });
    const geographyComparison = createMarketGrowthComparison({
      workspaceId: "workspace-1",
      comparisonKind: "local_vs_county",
      currentObservation: current,
      comparisonObservation: county,
      methodVersion: "growth-comparison-v1",
    });

    expect(priorComparison.contractVersion).toBe(MARKET_GROWTH_COMPARISON_CONTRACT_VERSION);
    expect(priorComparison.difference).toBe(2_000);
    expect(priorComparison.percentChange).toBeCloseTo(0.041666);
    expect(geographyComparison.comparisonGeography.geographyIdentity).toBe("county:future-il");
    expect(() => createMarketGrowthComparison({
      workspaceId: "workspace-1",
      comparisonKind: "current_vs_prior_period",
      currentObservation: current,
      comparisonObservation: observation({ period: period({ window: "acs_5_year", periodStart: "2021-01-01", periodEnd: "2025-12-31" }) }),
      methodVersion: "growth-comparison-v1",
    })).toThrow("period windows");
    expect(() => createMarketGrowthComparison({
      workspaceId: "workspace-1",
      comparisonKind: "current_vs_prior_period",
      currentObservation: current,
      comparisonObservation: observation({ period: period({ sourceFrequency: "quarterly" }) }),
      methodVersion: "growth-comparison-v1",
    })).toThrow("source frequencies");
  });

  it("derives level changes and rates with explicit formulas and no hidden forecasts", () => {
    const current = observation({ value: value({ rawValue: 50_000, normalizedValue: 50_000 }) });
    const baseline = observation({ period: period({ periodStart: "2021-01-01", periodEnd: "2021-12-31" }), value: value({ rawValue: 45_000, normalizedValue: 45_000 }) });
    const change = deriveMarketGrowthMetric({
      workspaceId: "workspace-1",
      metricType: "population_change",
      currentObservation: current,
      baselineObservation: baseline,
      formulaId: "population.absolute_change",
      formulaVersion: "1.0.0",
      unit: "people",
      valueKind: "absolute_change",
      method: "absolute_difference",
    });
    const rate = deriveMarketGrowthMetric({
      workspaceId: "workspace-1",
      metricType: "population_growth_rate",
      currentObservation: current,
      baselineObservation: baseline,
      formulaId: "population.percent_change",
      formulaVersion: "1.0.0",
      unit: "rate",
      valueKind: "growth_rate",
      method: "percent_change",
    });

    expect(change.value.normalizedValue).toBe(5_000);
    expect(rate.value.normalizedValue).toBeCloseTo(0.111111);
    expect(rate.explanationCodes).toEqual(expect.arrayContaining(["brix_derived_formula", "historical_trend_not_forecast"]));
  });

  it("handles stale prior-valid, provider-unavailable, insufficient-history, conflicts, and permission-restricted states", () => {
    const stale = observation({
      providerState: "offline",
      freshness: {
        freshnessResultId: "freshness-result-growth-1",
        policyId: "growth-freshness-policy",
        policyVersion: "1.0.0",
        providerId: "future_growth_provider",
        providerVersion: "growth-provider-v1",
        providerState: "offline",
        datasetId: "population_level",
        dataset: "population_level",
        datasetCategory: "growth",
        sourceRecordId: "growth-source-1",
        canonicalLocationId: "loc-market-1",
        geographyLevel: "municipality",
        geographyIdentity: "municipality:future-il",
        retrievalTime: "2025-01-01T00:00:00.000Z",
        evaluationAsOf: "2026-08-11T00:00:00.000Z",
        timeSemantics: "instant",
        ageBasis: "retrieval_time",
        calculatedAgeDays: 587,
        freshnessState: "stale",
        staleReasons: ["beyond_stale_threshold", "provider_failed_prior_valid_retained"],
        thresholdReferences: { staleAfterDays: 365, expirationAfterDays: 730 },
        verificationState: "source_backed",
        sourceConfidence: "source_backed",
        refreshEligibility: { state: "provider_unavailable", reason: "provider_failed_prior_valid_retained", datasetId: "population_level" },
        priorValidResultId: "freshness-prior-growth",
        manualReviewRequired: true,
        explanationCodes: ["provider_failed_prior_valid_retained"],
        contractVersion: "canonical-market-freshness-v1",
        materialHash: "freshness-growth-hash",
      },
    });
    const insufficient = observation({
      sample: sample({ minimumPeriodsRequired: 3, periodsAvailable: 1, minimumHistoryMet: false, sampleQualityState: "insufficient_history" }),
    });
    const permission = observation({ degradedStates: ["permission_restricted"] });

    expect(stale.degradedStates).toEqual(expect.arrayContaining(["provider_unavailable", "stale_prior_valid"]));
    expect(stale.explanationCodes).toEqual(expect.arrayContaining(["growth_data_stale", "provider_unavailable_prior_valid_retained"]));
    expect(insufficient.degradedStates).toContain("insufficient_history");
    expect(permission.degradedStates).toContain("permission_restricted");
  });

  it("creates source-linked findings and projections that are proposal-only for underwriting and strategy", () => {
    const obs = observation();
    const finding = createMarketGrowthFinding({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      findingType: "population_increased",
      sourceObservations: [obs],
      summaryCode: "population_increased",
      impactClass: "decision_context",
      confidence: "source_backed",
      verificationState: "source_backed",
      applicableStrategyReferences: ["owner_occupied_context", "rental_demand_context"],
      assumptionProposalReferences: ["proposal:market-growth-context"],
    });
    const projection = projectMarketGrowthFinding(finding);

    expect(finding.contractVersion).toBe(MARKET_GROWTH_FINDING_CONTRACT_VERSION);
    expect(finding.underwritingMutationAllowed).toBe(false);
    expect(finding.strategyRerankAllowed).toBe(false);
    expect(finding.recommendationMutationAllowed).toBe(false);
    expect(finding.rentForecastAllowed).toBe(false);
    expect(finding.valueForecastAllowed).toBe(false);
    expect(finding.safetyConclusionAllowed).toBe(false);
    expect(finding.protectedClassScoringAllowed).toBe(false);
    expect(finding.limitationCodes).toEqual(expect.arrayContaining(["growth_context_not_forecast", "demographic_context_not_quality_score"]));
    expect(projection.contractVersion).toBe(MARKET_GROWTH_PROJECTION_CONTRACT_VERSION);
    expect(projection.assumptionProposalReferences).toEqual(["proposal:market-growth-context"]);
  });

  it("preserves conflicting providers, geographies, periods, methods, and classifications without averaging them", () => {
    const sourceA = observation({ sourceRecordId: "provider-a-population", value: value({ rawValue: 50_000, normalizedValue: 50_000 }) });
    const sourceB = observation({ sourceRecordId: "provider-b-population", value: value({ rawValue: 46_000, normalizedValue: 46_000 }), degradedStates: ["conflicting_providers"] });
    const providerConflict = createMarketGrowthConflictManifest({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      conflictState: "provider_disagreement",
      observations: [sourceB, sourceA],
      reasonCodes: ["conflicting_growth_sources"],
    });
    const classificationConflict = createMarketGrowthConflictManifest({
      workspaceId: "workspace-1",
      conflictState: "classification_conflict",
      observations: [
        observation({ entry: industryEntry("growth.industry-a"), segment: segment({ segmentKind: "industry", industryCode: "62", industryClassificationSystem: "naics", segmentIdentity: "industry:naics:62" }), value: value({ rawValue: 0.2, normalizedValue: 0.2, unit: "percent", valueKind: "share" }) }),
        observation({ entry: industryEntry("growth.industry-b"), segment: segment({ segmentKind: "industry", industryCode: "healthcare", industryClassificationSystem: "provider_defined", segmentIdentity: "industry:provider:healthcare" }), value: value({ rawValue: 0.2, normalizedValue: 0.2, unit: "percent", valueKind: "share" }) }),
      ],
      reasonCodes: ["industry_concentration_observed"],
    });

    expect(providerConflict.contractVersion).toBe(MARKET_GROWTH_CONFLICT_CONTRACT_VERSION);
    expect(providerConflict.blockedUntilResolved).toBe(true);
    expect(providerConflict.observationIds).toEqual([sourceA.observationId, sourceB.observationId].sort());
    expect(classificationConflict.conflictState).toBe("classification_conflict");
  });

  it("keeps golden growth fixtures deterministic across required market states", () => {
    const fixtures = [
      observation(),
      observation({ value: value({ rawValue: -200, normalizedValue: -200, valueKind: "absolute_change" }), entry: entry({ metricId: "growth.population-change", metricType: "population_change", unit: "people", valueKind: "absolute_change", applicableDatasets: ["population_trend"], supportedMethods: ["source_reported"] }), dataset: "population_trend" }),
      observation({ entry: entry({ metricId: "growth.household-growth", metricType: "household_growth_rate", category: "households", unit: "rate", valueKind: "growth_rate", applicableDatasets: ["household_context"], supportedSegmentKinds: ["household_population"] }), dataset: "household_context", segment: segment({ segmentKind: "household_population", segmentIdentity: "household_population" }), value: value({ rawValue: 0.03, normalizedValue: 0.03, unit: "rate", valueKind: "growth_rate" }) }),
      observation({ entry: entry({ metricId: "growth.household-decline", metricType: "household_change", category: "households", unit: "households", valueKind: "absolute_change", applicableDatasets: ["household_context"], supportedSegmentKinds: ["household_population"] }), dataset: "household_context", segment: segment({ segmentKind: "household_population", segmentIdentity: "household_population" }), value: value({ rawValue: -80, normalizedValue: -80, unit: "households", valueKind: "absolute_change" }) }),
      observation({ entry: entry({ metricId: "growth.household-formation", metricType: "household_formation", category: "households", unit: "households", valueKind: "absolute_change", applicableDatasets: ["household_context"], supportedSegmentKinds: ["household_population"] }), dataset: "household_context", segment: segment({ segmentKind: "household_population", segmentIdentity: "household_population" }), value: value({ rawValue: 120, normalizedValue: 120, unit: "households", valueKind: "absolute_change" }) }),
      observation({ entry: entry({ metricId: "growth.migration-positive", metricType: "net_migration", category: "migration", unit: "people", valueKind: "absolute_change", applicableDatasets: ["population_trend"], supportedMethods: ["source_reported"] }), dataset: "population_trend", value: value({ rawValue: 250, normalizedValue: 250, unit: "people", valueKind: "absolute_change" }) }),
      observation({ entry: entry({ metricId: "growth.migration-negative", metricType: "net_migration", category: "migration", unit: "people", valueKind: "absolute_change", applicableDatasets: ["population_trend"], supportedMethods: ["source_reported"] }), dataset: "population_trend", value: value({ rawValue: -250, normalizedValue: -250, unit: "people", valueKind: "absolute_change" }) }),
      observation({ entry: entry({ metricId: "growth.income-change", metricType: "income_change", category: "income", unit: "money", valueKind: "absolute_change", applicableDatasets: ["household_context"], supportedSegmentKinds: ["household_population"] }), dataset: "household_context", segment: segment({ segmentKind: "household_population", segmentIdentity: "household_population" }), value: value({ rawValue: 4_000, normalizedValue: 4_000, unit: "money", valueKind: "absolute_change" }) }),
      observation({ entry: entry({ metricId: "growth.employment-growth", metricType: "employment_growth_rate", category: "employment", unit: "rate", valueKind: "growth_rate", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["labor_force"] }), dataset: "employment_level", segment: segment({ segmentKind: "labor_force", segmentIdentity: "labor_force" }), value: value({ rawValue: 0.02, normalizedValue: 0.02, unit: "rate", valueKind: "growth_rate" }) }),
      observation({ entry: entry({ metricId: "growth.employment-decline", metricType: "employment_change", category: "employment", unit: "jobs", valueKind: "absolute_change", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["labor_force"] }), dataset: "employment_level", segment: segment({ segmentKind: "labor_force", segmentIdentity: "labor_force" }), value: value({ rawValue: -140, normalizedValue: -140, unit: "jobs", valueKind: "absolute_change" }) }),
      observation({ entry: entry({ metricId: "growth.unemployment-change", metricType: "unemployment_rate", category: "employment", unit: "percent", valueKind: "share", applicableDatasets: ["unemployment"], supportedSegmentKinds: ["labor_force"] }), dataset: "unemployment", segment: segment({ segmentKind: "labor_force", segmentIdentity: "labor_force" }), value: value({ rawValue: 0.052, normalizedValue: 0.052, unit: "percent", valueKind: "share" }) }),
      observation({ entry: entry({ metricId: "growth.lfp-change", metricType: "labor_force_participation", category: "employment", unit: "percent", valueKind: "share", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["labor_force"] }), dataset: "employment_level", segment: segment({ segmentKind: "labor_force", segmentIdentity: "labor_force" }), value: value({ rawValue: 0.62, normalizedValue: 0.62, unit: "percent", valueKind: "share" }) }),
      observation({ entry: industryEntry("growth.high-industry-concentration"), dataset: "industry_concentration", segment: segment({ segmentKind: "industry", industryCode: "62", industryClassificationSystem: "naics", segmentIdentity: "industry:naics:62" }), value: value({ rawValue: 0.31, normalizedValue: 0.31, unit: "percent", valueKind: "share" }) }),
      observation({ entry: entry({ metricId: "growth.diversified-base", metricType: "economic_diversification", category: "economic_base", unit: "index", valueKind: "index", applicableDatasets: ["industry_concentration"], supportedSegmentKinds: ["industry"] }), dataset: "industry_concentration", segment: segment({ segmentKind: "industry", industryClassificationSystem: "naics", segmentIdentity: "industry:diversification" }), value: value({ rawValue: 0.74, normalizedValue: 0.74, unit: "index", valueKind: "index" }) }),
      observation({ employerEvent: { eventState: "expansion", employerName: "Expansion Employer", announcedJobs: 100, currentJobs: 10, eventSourceReference: sourceReference }, entry: entry({ metricId: "growth.employer-expansion", metricType: "employer_announcement", category: "economic_base", unit: "event", valueKind: "event", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["employer"] }), segment: segment({ segmentKind: "employer", segmentIdentity: "employer:expansion" }), value: value({ rawValue: "expansion", normalizedValue: null, unit: "event", valueKind: "event" }) }),
      observation({ employerEvent: { eventState: "closure_announced", employerName: "Closing Employer", announcedJobs: 50, currentJobs: 50, eventSourceReference: sourceReference }, entry: entry({ metricId: "growth.employer-closure", metricType: "employer_closure", category: "economic_base", unit: "event", valueKind: "event", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["employer"] }), segment: segment({ segmentKind: "employer", segmentIdentity: "employer:closure" }), value: value({ rawValue: "closure", normalizedValue: null, unit: "event", valueKind: "event" }) }),
      observation({ employerEvent: { eventState: "cancelled", employerName: "Cancelled Employer", announcedJobs: 400, currentJobs: 0, eventSourceReference: sourceReference }, entry: entry({ metricId: "growth.cancelled-jobs", metricType: "employer_announcement", category: "economic_base", unit: "event", valueKind: "event", applicableDatasets: ["employment_level"], supportedSegmentKinds: ["employer"] }), segment: segment({ segmentKind: "employer", segmentIdentity: "employer:cancelled" }), value: value({ rawValue: "cancelled", normalizedValue: null, unit: "event", valueKind: "event" }) }),
      observation({ sample: sample({ minimumPeriodsRequired: 3, periodsAvailable: 1, minimumHistoryMet: false, sampleQualityState: "insufficient_history" }) }),
      observation({ providerState: "offline" }),
      observation({ degradedStates: ["conflicting_providers"] }),
      observation({ geography: geography({ proxy: true }), degradedStates: ["geography_unsupported"] }),
      observation({ period: period({ window: "acs_5_year", periodStart: "2021-01-01", periodEnd: "2025-12-31" }) }),
      observation({ period: period({ periodStart: "2025-01-01", periodEnd: "2025-12-31" }) }),
    ];

    expect(fixtures).toHaveLength(23);
    expect(new Set(fixtures.map((item) => item.deterministicHash)).size).toBe(23);
    expect(fixtures.every((item) => item.provenance.length > 0 || item.evidenceReference)).toBe(true);
    expect(fixtures.some((item) => item.explanationCodes.includes("announced_jobs_not_current_jobs"))).toBe(true);
    expect(fixtures.some((item) => item.degradedStates.includes("geography_unsupported"))).toBe(true);
    expect(fixtures.some((item) => item.degradedStates.includes("provider_unavailable"))).toBe(true);
    expect(fixtures.every((item) => item.explanationCodes.includes("no_protected_class_scoring"))).toBe(true);
  });

  function industryEntry(metricId: string) {
    return entry({
      metricId,
      metricType: "industry_employment_share",
      category: "economic_base",
      unit: "percent",
      valueKind: "share",
      applicableDatasets: ["industry_concentration"],
      supportedSegmentKinds: ["industry"],
      supportedMethods: ["source_reported", "share"],
      requiresIndustryClassification: true,
    });
  }
});

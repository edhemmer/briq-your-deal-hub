import { describe, expect, it } from "vitest";
import {
  MARKET_LIQUIDITY_COMPARISON_CONTRACT_VERSION,
  MARKET_LIQUIDITY_CONFLICT_CONTRACT_VERSION,
  MARKET_LIQUIDITY_CONTRACT_VERSION,
  MARKET_LIQUIDITY_DERIVED_METRIC_CONTRACT_VERSION,
  MARKET_LIQUIDITY_FINDING_CONTRACT_VERSION,
  MARKET_LIQUIDITY_OBSERVATION_CONTRACT_VERSION,
  MARKET_LIQUIDITY_PROJECTION_CONTRACT_VERSION,
  MARKET_LIQUIDITY_REGISTRY_VERSION,
  createMarketLiquidityComparison,
  createMarketLiquidityConflictManifest,
  createMarketLiquidityFinding,
  createMarketLiquidityObservation,
  createMarketLiquidityRegistry,
  defineMarketLiquidityRegistryEntry,
  deriveMarketLiquidityMetric,
  isMarketLiquidityFindingType,
  isMarketLiquidityMetricType,
  isMarketLiquidityPropertySector,
  marketLiquidityAggregationMethods,
  marketLiquidityCategories,
  marketLiquidityComparisonKinds,
  marketLiquidityConflictStates,
  marketLiquidityDegradedStates,
  marketLiquidityDomMethods,
  marketLiquidityExplanationCodes,
  marketLiquidityFindingTypes,
  marketLiquidityMetricTypes,
  marketLiquidityPeriodWindows,
  marketLiquidityPropertySectors,
  marketLiquidityReviewActions,
  marketLiquiditySampleQualityStates,
  marketLiquidityTransactionContexts,
  marketLiquidityUnits,
  projectMarketLiquidityFinding,
  selectMarketLiquidityRegistryEntry,
  type MarketLiquidityObservation,
  type MarketLiquidityRegistryEntry,
} from "../core/marketLiquidity";
import { createMarketProviderProvenance } from "../core/marketSourceIngestion";

describe("MarketIQ liquidity and transaction-activity context contract", () => {
  const sourceReference = {
    sourceRecordId: "liquidity-source-1",
    evidenceId: "evidence-liquidity-1",
    sourceName: "Future market activity source",
    observedAt: "2026-06-30T00:00:00.000Z",
    effectiveAt: "2026-06-01T00:00:00.000Z",
  };

  const provenance = createMarketProviderProvenance({
    providerId: "future_liquidity_provider",
    providerVersion: "liquidity-provider-v1",
    providerRecordReference: "liquidity-source-1",
    observationTime: "2026-06-30T00:00:00.000Z",
    effectiveTime: "2026-06-01T00:00:00.000Z",
    retrievalTime: "2026-08-10T00:00:00.000Z",
    verificationState: "source_backed",
    confidence: "source_backed",
    evidenceReference: sourceReference,
  });

  const entry = (overrides: Partial<Parameters<typeof defineMarketLiquidityRegistryEntry>[0]> = {}): MarketLiquidityRegistryEntry => defineMarketLiquidityRegistryEntry({
    metricId: "liquidity.closed-transactions",
    semanticVersion: "1.0.0",
    metricType: "closed_transactions",
    category: "market_activity",
    unit: "count",
    applicableDatasets: ["sales_activity"],
    supportedPropertySectors: ["residential", "multifamily", "commercial", "land"],
    supportedTransactionContexts: ["sale"],
    supportedPeriodWindows: ["trailing_90_days", "trailing_12_months", "calendar_year"],
    supportedAggregationMethods: ["source_reported", "count", "sum"],
    minimumSampleRequired: 5,
    lifecycleStatus: "active",
    permittedProposalKinds: ["exit_liquidity_context_reference", "hold_period_assumption_review"],
    prohibitedInferenceCodes: ["do_not_predict_specific_property_sale_time", "do_not_establish_appraisal_value"],
    registeredAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  });

  const segment = (overrides: Partial<Parameters<typeof createMarketLiquidityObservation>[0]["segment"]> = {}) => ({
    propertySector: "residential" as const,
    propertyType: "single_family",
    propertySubtype: "detached",
    unitCountBand: "1_unit",
    classBand: "existing_standard",
    sizeBand: "1500_2500_sqft",
    priceValueBand: "250k_400k",
    occupancyState: "not_applicable" as const,
    transactionContext: "sale" as const,
    segmentIdentity: "residential:single_family:detached:1_unit:250k_400k:sale",
    sourceReference,
    ...overrides,
  });

  const geography = (overrides: Partial<Parameters<typeof createMarketLiquidityObservation>[0]["geography"]> = {}) => ({
    geographyLevel: "municipality" as const,
    geographyIdentity: "municipality:future-il",
    canonicalLocationId: "loc-market-1",
    boundaryId: "municipality-boundary-1",
    boundaryVersion: "2026",
    proxy: false,
    ...overrides,
  });

  const period = (overrides: Partial<Parameters<typeof createMarketLiquidityObservation>[0]["period"]> = {}) => ({
    window: "trailing_90_days" as const,
    periodStart: "2026-04-01",
    periodEnd: "2026-06-30",
    partialPeriod: false,
    annualized: false as const,
    ...overrides,
  });

  const sample = (overrides: Partial<Parameters<typeof createMarketLiquidityObservation>[0]["sample"]> = {}) => ({
    sampleCount: 18,
    transactionCount: 18,
    listingCount: 42,
    sourceCoverage: "complete" as const,
    excludedRecordCount: 2,
    minimumSampleRequired: 5,
    minimumSampleMet: true,
    completenessIndicator: 0.96,
    sampleQualityState: "adequate_sample" as const,
    ...overrides,
  });

  const value = (overrides: Partial<Parameters<typeof createMarketLiquidityObservation>[0]["value"]> = {}) => ({
    rawValue: 18,
    normalizedValue: 18,
    unit: "count" as const,
    valueOrigin: "source_reported" as const,
    ...overrides,
  });

  const observation = (overrides: Partial<Parameters<typeof createMarketLiquidityObservation>[0]> = {}): MarketLiquidityObservation => createMarketLiquidityObservation({
    workspaceId: "workspace-1",
    propertyId: "property-1",
    dealId: "deal-1",
    canonicalLocationId: "loc-market-1",
    entry: entry(),
    geography: geography(),
    segment: segment(),
    period: period(),
    value: value(),
    sample: sample(),
    aggregationMethod: "count",
    providerId: "future_liquidity_provider",
    providerVersion: "liquidity-provider-v1",
    providerState: "healthy",
    dataset: "sales_activity",
    sourceRecordId: "liquidity-source-1",
    sourceRecordKey: "future_liquidity_provider:liquidity-source-1",
    evidenceReference: sourceReference,
    provenance: [provenance],
    verificationState: "source_backed",
    confidence: "source_backed",
    ...overrides,
  });

  it("publishes provider-neutral liquidity taxonomy and review boundaries", () => {
    expect(marketLiquidityMetricTypes).toEqual(expect.arrayContaining(["active_inventory", "closed_transactions", "median_days_on_market", "sale_to_list_ratio", "months_of_supply", "absorption_rate", "cap_rate_transaction_count"]));
    expect(marketLiquidityCategories).toEqual(["market_activity", "velocity", "supply_demand", "pricing_execution", "market_depth", "commercial_investment"]);
    expect(marketLiquidityUnits).toEqual(expect.arrayContaining(["count", "ratio", "percent", "days", "months"]));
    expect(marketLiquidityPropertySectors).toEqual(expect.arrayContaining(["residential", "commercial", "multifamily", "land"]));
    expect(marketLiquidityTransactionContexts).toContain("lease");
    expect(marketLiquiditySampleQualityStates).toEqual(expect.arrayContaining(["adequate_sample", "thin_sample", "zero_verified_activity", "no_source_coverage"]));
    expect(marketLiquidityPeriodWindows).toContain("trailing_12_months");
    expect(marketLiquidityAggregationMethods).toContain("brix_derived");
    expect(marketLiquidityDomMethods).toContain("cumulative_days_on_market");
    expect(marketLiquidityFindingTypes).toContain("source_coverage_insufficient");
    expect(marketLiquidityComparisonKinds).toContain("submarket_vs_metro");
    expect(marketLiquidityConflictStates).toContain("method_disagreement");
    expect(marketLiquidityDegradedStates).toContain("source_coverage_missing");
    expect(marketLiquidityExplanationCodes).toContain("no_sale_timing_guarantee");
    expect(marketLiquidityReviewActions).toContain("appraiser_review");
    expect(isMarketLiquidityMetricType("sale_to_list_ratio")).toBe(true);
    expect(isMarketLiquidityPropertySector("land")).toBe(true);
    expect(isMarketLiquidityFindingType("liquidity_context_stale")).toBe(true);
  });

  it("creates deterministic metric registry entries with explicit segments and no score", () => {
    const inventory = entry({ metricId: "liquidity.active-inventory", metricType: "active_inventory", category: "market_activity", applicableDatasets: ["inventory"] });
    const dom = entry({ metricId: "liquidity.median-dom", metricType: "median_days_on_market", category: "velocity", unit: "days", applicableDatasets: ["days_on_market"], supportedAggregationMethods: ["median", "source_reported"] });
    const registry = createMarketLiquidityRegistry([dom, inventory]);

    expect(registry.version).toBe(MARKET_LIQUIDITY_REGISTRY_VERSION);
    expect(registry.entries.map((item) => item.metricId)).toEqual(["liquidity.active-inventory", "liquidity.median-dom"]);
    expect(inventory.contractVersion).toBe(MARKET_LIQUIDITY_CONTRACT_VERSION);
    expect(inventory.materialHash).toMatch(/^ml_entryh_/);
    expect(selectMarketLiquidityRegistryEntry({ registry, metricId: "liquidity.median-dom" }).unit).toBe("days");
    expect(Object.keys(inventory)).not.toContain("score");
  });

  it("preserves property segment and rejects incompatible metric application", () => {
    const multifamily = observation({ segment: segment({ propertySector: "multifamily", propertyType: "multifamily", unitCountBand: "5_20_units", segmentIdentity: "multifamily:5_20_units:sale" }) });
    const commercial = observation({ segment: segment({ propertySector: "commercial", propertyType: "industrial", classBand: "class_b", segmentIdentity: "commercial:industrial:class_b:sale" }) });
    const land = observation({ segment: segment({ propertySector: "land", propertyType: "raw_land", segmentIdentity: "land:raw:sale" }) });

    expect(multifamily.segment.propertySector).toBe("multifamily");
    expect(commercial.segment.propertyType).toBe("industrial");
    expect(land.segment.segmentIdentity).toBe("land:raw:sale");
    expect(() => observation({
      entry: entry({ supportedPropertySectors: ["commercial"], metricId: "liquidity.commercial-only" }),
      segment: segment({ propertySector: "residential" }),
    })).toThrow("property sector");
  });

  it("distinguishes active, new, pending, closed, months supply, and absorption context", () => {
    const active = observation({ entry: entry({ metricId: "liquidity.active-inventory", metricType: "active_inventory", applicableDatasets: ["inventory"] }), dataset: "inventory", value: value({ rawValue: 36, normalizedValue: 36 }) });
    const pending = observation({ entry: entry({ metricId: "liquidity.pending", metricType: "pending_transactions" }), value: value({ rawValue: 14, normalizedValue: 14 }) });
    const closed = observation({ value: value({ rawValue: 18, normalizedValue: 18 }) });
    const monthsSupply = deriveMarketLiquidityMetric({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      metricType: "months_of_supply",
      numeratorObservation: active,
      denominatorObservation: closed,
      formulaId: "months_supply.active_inventory_divided_by_closed_monthly_velocity",
      formulaVersion: "1.0.0",
      unit: "months",
    });
    const absorption = deriveMarketLiquidityMetric({
      workspaceId: "workspace-1",
      metricType: "absorption_rate",
      numeratorObservation: closed,
      denominatorObservation: active,
      formulaId: "absorption.closed_transactions_divided_by_active_inventory",
      formulaVersion: "1.0.0",
      unit: "ratio",
    });

    expect(active.metricType).toBe("active_inventory");
    expect(pending.metricType).toBe("pending_transactions");
    expect(closed.metricType).toBe("closed_transactions");
    expect(monthsSupply.contractVersion).toBe(MARKET_LIQUIDITY_DERIVED_METRIC_CONTRACT_VERSION);
    expect(monthsSupply.value.normalizedValue).toBe(2);
    expect(monthsSupply.value.valueOrigin).toBe("brix_derived");
    expect(absorption.value.normalizedValue).toBe(0.5);
  });

  it("keeps zero verified activity separate from missing source coverage", () => {
    const zeroVerified = observation({
      value: value({ rawValue: 0, normalizedValue: 0 }),
      sample: sample({ sampleCount: 0, transactionCount: 0, sourceCoverage: "complete", minimumSampleMet: true, sampleQualityState: "zero_verified_activity" }),
    });
    const noCoverage = observation({
      value: value({ rawValue: null, normalizedValue: null }),
      sample: sample({ sampleCount: undefined, transactionCount: undefined, sourceCoverage: "none", minimumSampleMet: false, sampleQualityState: "no_source_coverage" }),
    });

    expect(zeroVerified.explanationCodes).toContain("zero_verified_activity");
    expect(zeroVerified.degradedStates).not.toContain("source_coverage_missing");
    expect(noCoverage.explanationCodes).toContain("no_source_coverage");
    expect(noCoverage.degradedStates).toContain("source_coverage_missing");
  });

  it("preserves DOM and CDOM methodologies instead of merging velocity definitions", () => {
    const dom = observation({
      entry: entry({ metricId: "liquidity.median-dom", metricType: "median_days_on_market", category: "velocity", unit: "days", applicableDatasets: ["days_on_market"], supportedAggregationMethods: ["median", "source_reported"] }),
      dataset: "days_on_market",
      value: value({ rawValue: 22, normalizedValue: 22, unit: "days" }),
      aggregationMethod: "median",
      domMethod: "days_on_market",
    });
    const cdom = observation({
      entry: entry({ metricId: "liquidity.cdom", metricType: "cumulative_days_on_market", category: "velocity", unit: "days", applicableDatasets: ["days_on_market"], supportedAggregationMethods: ["average", "source_reported"] }),
      dataset: "days_on_market",
      value: value({ rawValue: 41, normalizedValue: 41, unit: "days" }),
      aggregationMethod: "average",
      domMethod: "cumulative_days_on_market",
    });

    expect(dom.domMethod).toBe("days_on_market");
    expect(cdom.domMethod).toBe("cumulative_days_on_market");
    expect(dom.explanationCodes).toContain("marketing_time_changed");
    expect(cdom.deterministicHash).not.toBe(dom.deterministicHash);
  });

  it("stores sale-to-list execution as context without establishing value", () => {
    const ratio = observation({
      entry: entry({ metricId: "liquidity.sale-to-list", metricType: "sale_to_list_ratio", category: "pricing_execution", unit: "ratio", applicableDatasets: ["sale_prices"], supportedAggregationMethods: ["ratio", "source_reported"] }),
      dataset: "sale_prices",
      value: value({ rawValue: 0.982, normalizedValue: 0.982, unit: "ratio" }),
      aggregationMethod: "ratio",
      sample: sample({ sampleCount: 12, transactionCount: 12 }),
    });

    expect(ratio.explanationCodes).toEqual(expect.arrayContaining(["sale_to_list_changed", "no_market_value_conclusion"]));
    expect(ratio.value.valueOrigin).toBe("source_reported");
    expect(ratio.sample.sampleCount).toBe(12);
  });

  it("handles derived metric divide-by-zero without hidden provider math", () => {
    const active = observation({ entry: entry({ metricId: "liquidity.active-inventory", metricType: "active_inventory", applicableDatasets: ["inventory"] }), dataset: "inventory", value: value({ rawValue: 12, normalizedValue: 12 }) });
    const closedZero = observation({ value: value({ rawValue: 0, normalizedValue: 0 }), sample: sample({ sampleCount: 0, transactionCount: 0, sampleQualityState: "zero_verified_activity", minimumSampleMet: true }) });
    const derived = deriveMarketLiquidityMetric({
      workspaceId: "workspace-1",
      metricType: "months_of_supply",
      numeratorObservation: active,
      denominatorObservation: closedZero,
      formulaId: "months_supply.safe_divide",
      formulaVersion: "1.0.0",
      unit: "months",
    });

    expect(derived.value.normalizedValue).toBeNull();
    expect(derived.degradedStates).toContain("sample_insufficient");
    expect(derived.explanationCodes).toEqual(expect.arrayContaining(["brix_derived_formula", "division_by_zero_handled"]));
  });

  it("supports compatible historical and broader-market comparisons and rejects silent mismatches", () => {
    const current = observation({ value: value({ rawValue: 18, normalizedValue: 18 }) });
    const prior = observation({ period: period({ periodStart: "2026-01-01", periodEnd: "2026-03-31" }), value: value({ rawValue: 12, normalizedValue: 12 }) });
    const broader = observation({ geography: geography({ geographyLevel: "county", geographyIdentity: "county:future-il" }), value: value({ rawValue: 120, normalizedValue: 120 }) });
    const priorComparison = createMarketLiquidityComparison({
      workspaceId: "workspace-1",
      comparisonKind: "current_vs_prior_period",
      currentObservation: current,
      comparisonObservation: prior,
      methodVersion: "liquidity-comparison-v1",
    });
    const broaderComparison = createMarketLiquidityComparison({
      workspaceId: "workspace-1",
      comparisonKind: "property_geography_vs_broader_market",
      currentObservation: current,
      comparisonObservation: broader,
      methodVersion: "liquidity-comparison-v1",
    });

    expect(priorComparison.contractVersion).toBe(MARKET_LIQUIDITY_COMPARISON_CONTRACT_VERSION);
    expect(priorComparison.difference).toBe(6);
    expect(priorComparison.percentChange).toBe(0.5);
    expect(broaderComparison.comparisonGeography.geographyIdentity).toBe("county:future-il");
    expect(() => createMarketLiquidityComparison({
      workspaceId: "workspace-1",
      comparisonKind: "current_vs_prior_period",
      currentObservation: current,
      comparisonObservation: observation({ segment: segment({ propertySector: "land", segmentIdentity: "land:raw:sale" }) }),
      methodVersion: "liquidity-comparison-v1",
    })).toThrow("market segment");
    expect(() => createMarketLiquidityComparison({
      workspaceId: "workspace-1",
      comparisonKind: "current_vs_prior_period",
      currentObservation: current,
      comparisonObservation: observation({ period: period({ window: "calendar_year", periodStart: "2025-01-01", periodEnd: "2025-12-31" }) }),
      methodVersion: "liquidity-comparison-v1",
    })).toThrow("period windows");
  });

  it("reuses freshness and preserves prior valid stale context during provider failure", () => {
    const stale = observation({
      providerState: "offline",
      freshness: {
        freshnessResultId: "freshness-result-1",
        policyId: "liquidity-freshness-policy",
        policyVersion: "1.0.0",
        providerId: "future_liquidity_provider",
        providerVersion: "liquidity-provider-v1",
        providerState: "offline",
        datasetId: "sales_activity",
        dataset: "sales_activity",
        datasetCategory: "liquidity",
        sourceRecordId: "liquidity-source-1",
        canonicalLocationId: "loc-market-1",
        geographyLevel: "municipality",
        geographyIdentity: "municipality:future-il",
        retrievalTime: "2026-01-01T00:00:00.000Z",
        evaluationAsOf: "2026-08-10T00:00:00.000Z",
        timeSemantics: "instant",
        ageBasis: "retrieval_time",
        calculatedAgeDays: 222,
        freshnessState: "stale",
        staleReasons: ["beyond_stale_threshold", "provider_failed_prior_valid_retained"],
        thresholdReferences: { staleAfterDays: 90, expirationAfterDays: 180 },
        verificationState: "source_backed",
        sourceConfidence: "source_backed",
        refreshEligibility: { state: "provider_unavailable", reason: "provider_failed_prior_valid_retained", datasetId: "sales_activity" },
        priorValidResultId: "freshness-prior-1",
        manualReviewRequired: true,
        explanationCodes: ["provider_failed_prior_valid_retained"],
        contractVersion: "canonical-market-freshness-v1",
        materialHash: "freshness-hash-1",
      },
    });

    expect(stale.degradedStates).toEqual(expect.arrayContaining(["provider_unavailable", "stale_prior_valid"]));
    expect(stale.explanationCodes).toEqual(expect.arrayContaining(["liquidity_data_stale", "prior_valid_retained"]));
  });

  it("creates deterministic source-linked findings with proposal-only strategy and underwriting references", () => {
    const obs = observation({ sample: sample({ sampleCount: 3, transactionCount: 3, minimumSampleMet: false, sampleQualityState: "thin_sample" }) });
    const finding = createMarketLiquidityFinding({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      findingType: "transaction_sample_thin",
      sourceObservations: [obs],
      summaryCode: "comparable_sample_thin",
      impactClass: "assumption_review",
      confidence: "source_backed",
      verificationState: "source_backed",
      applicableStrategyReferences: ["disposition_timing_context", "development_exit_context"],
      assumptionProposalReferences: ["proposal:exit-liquidity-review"],
    });
    const projection = projectMarketLiquidityFinding(finding);

    expect(finding.contractVersion).toBe(MARKET_LIQUIDITY_FINDING_CONTRACT_VERSION);
    expect(finding.sampleQualityState).toBe("thin_sample");
    expect(finding.suggestedVerificationAction).toBe("broker_market_verification");
    expect(finding.underwritingMutationAllowed).toBe(false);
    expect(finding.strategyRerankAllowed).toBe(false);
    expect(finding.recommendationMutationAllowed).toBe(false);
    expect(finding.appraisalConclusionAllowed).toBe(false);
    expect(finding.saleTimingGuaranteeAllowed).toBe(false);
    expect(finding.futureDemandPredictionAllowed).toBe(false);
    expect(projection.contractVersion).toBe(MARKET_LIQUIDITY_PROJECTION_CONTRACT_VERSION);
    expect(projection.assumptionProposalReferences).toEqual(["proposal:exit-liquidity-review"]);
  });

  it("preserves conflicting counts, DOM methods, geographies, and segments without averaging them", () => {
    const sourceA = observation({ sourceRecordId: "provider-a-count", value: value({ rawValue: 18, normalizedValue: 18 }) });
    const sourceB = observation({ sourceRecordId: "provider-b-count", value: value({ rawValue: 11, normalizedValue: 11 }), degradedStates: ["conflicting_providers"] });
    const manifest = createMarketLiquidityConflictManifest({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      conflictState: "provider_disagreement",
      observations: [sourceB, sourceA],
      reasonCodes: ["conflicting_provider_metrics"],
    });
    const methodConflict = createMarketLiquidityConflictManifest({
      workspaceId: "workspace-1",
      conflictState: "method_disagreement",
      observations: [
        observation({ entry: entry({ metricId: "liquidity.dom", metricType: "median_days_on_market", category: "velocity", unit: "days", applicableDatasets: ["days_on_market"], supportedAggregationMethods: ["median"] }), dataset: "days_on_market", aggregationMethod: "median", domMethod: "days_on_market", value: value({ rawValue: 22, normalizedValue: 22, unit: "days" }) }),
        observation({ entry: entry({ metricId: "liquidity.cdom", metricType: "cumulative_days_on_market", category: "velocity", unit: "days", applicableDatasets: ["days_on_market"], supportedAggregationMethods: ["average"] }), dataset: "days_on_market", aggregationMethod: "average", domMethod: "cumulative_days_on_market", value: value({ rawValue: 44, normalizedValue: 44, unit: "days" }) }),
      ],
      reasonCodes: ["marketing_time_changed"],
    });

    expect(manifest.contractVersion).toBe(MARKET_LIQUIDITY_CONFLICT_CONTRACT_VERSION);
    expect(manifest.blockedUntilResolved).toBe(true);
    expect(manifest.observationIds).toEqual([sourceA.observationId, sourceB.observationId].sort());
    expect(methodConflict.conflictState).toBe("method_disagreement");
  });

  it("keeps authorization/source boundary diagnostic data scoped without client formulas or provider calls", () => {
    const obs = observation({ workspaceId: "workspace-authorized", propertyId: "property-authorized" });
    const finding = createMarketLiquidityFinding({
      workspaceId: "workspace-authorized",
      findingType: "transaction_activity_elevated",
      sourceObservations: [obs],
      summaryCode: "transaction_activity_observed",
      impactClass: "decision_context",
      confidence: "source_backed",
      verificationState: "source_backed",
    });

    expect(obs.workspaceId).toBe("workspace-authorized");
    expect(obs.contractVersion).toBe(MARKET_LIQUIDITY_OBSERVATION_CONTRACT_VERSION);
    expect(finding.sourceObservationIds).toEqual([obs.observationId]);
    expect(finding.limitationCodes).toContain("market_liquidity_context_not_sale_prediction");
  });

  it("keeps golden liquidity fixtures deterministic and source-bound across expected market states", () => {
    const fixtures = [
      observation(),
      observation({ sample: sample({ sampleCount: 3, transactionCount: 3, minimumSampleMet: false, sampleQualityState: "thin_sample" }) }),
      observation({ value: value({ rawValue: 0, normalizedValue: 0 }), sample: sample({ sampleCount: 0, transactionCount: 0, sampleQualityState: "zero_verified_activity", minimumSampleMet: true }) }),
      observation({ value: value({ rawValue: null, normalizedValue: null }), sample: sample({ sourceCoverage: "none", minimumSampleMet: false, sampleQualityState: "no_source_coverage" }) }),
      observation({ entry: entry({ metricId: "liquidity.inventory-rising", metricType: "active_inventory", applicableDatasets: ["inventory"] }), dataset: "inventory", value: value({ rawValue: 48, normalizedValue: 48 }) }),
      observation({ entry: entry({ metricId: "liquidity.inventory-declining", metricType: "active_inventory", applicableDatasets: ["inventory"] }), dataset: "inventory", value: value({ rawValue: 21, normalizedValue: 21 }) }),
      observation({ entry: entry({ metricId: "liquidity.sale-to-list", metricType: "sale_to_list_ratio", category: "pricing_execution", unit: "ratio", applicableDatasets: ["sale_prices"], supportedAggregationMethods: ["ratio"] }), dataset: "sale_prices", aggregationMethod: "ratio", value: value({ rawValue: 1.01, normalizedValue: 1.01, unit: "ratio" }) }),
      observation({ entry: entry({ metricId: "liquidity.multifamily", supportedPropertySectors: ["multifamily"] }), segment: segment({ propertySector: "multifamily", segmentIdentity: "multifamily:5_20_units:sale" }) }),
      observation({ entry: entry({ metricId: "liquidity.commercial", supportedPropertySectors: ["commercial"] }), segment: segment({ propertySector: "commercial", propertyType: "retail", segmentIdentity: "commercial:retail:sale" }) }),
      observation({ entry: entry({ metricId: "liquidity.land", supportedPropertySectors: ["land"] }), segment: segment({ propertySector: "land", segmentIdentity: "land:raw:sale" }) }),
      observation({ geography: geography({ geographyLevel: "unknown", geographyIdentity: "provider-proxy", proxy: true }) }),
      observation({ providerState: "maintenance" }),
      observation({ freshness: { freshnessResultId: "fresh-stale", policyId: "liquidity-freshness-policy", policyVersion: "1.0.0", providerId: "future_liquidity_provider", providerVersion: "liquidity-provider-v1", providerState: "healthy", datasetId: "sales_activity", dataset: "sales_activity", datasetCategory: "liquidity", sourceRecordId: "liquidity-source-1", canonicalLocationId: "loc-market-1", geographyLevel: "municipality", geographyIdentity: "municipality:future-il", retrievalTime: "2026-01-01T00:00:00.000Z", evaluationAsOf: "2026-08-10T00:00:00.000Z", timeSemantics: "instant", ageBasis: "retrieval_time", calculatedAgeDays: 200, freshnessState: "stale", staleReasons: ["beyond_stale_threshold"], thresholdReferences: { staleAfterDays: 90, expirationAfterDays: 180 }, verificationState: "source_backed", sourceConfidence: "source_backed", refreshEligibility: { state: "refresh_due", reason: "refresh_due", datasetId: "sales_activity" }, priorValidResultId: "fresh-prior", manualReviewRequired: true, explanationCodes: ["provider_failed_prior_valid_retained"], contractVersion: "canonical-market-freshness-v1", materialHash: "fresh-stale-hash" } }),
      observation({ period: period({ periodStart: "2025-04-01", periodEnd: "2025-06-30" }) }),
    ];

    expect(fixtures).toHaveLength(14);
    expect(new Set(fixtures.map((item) => item.deterministicHash)).size).toBe(14);
    expect(fixtures.every((item) => item.provenance.length > 0 || item.evidenceReference)).toBe(true);
    expect(fixtures.some((item) => item.degradedStates.includes("source_coverage_missing"))).toBe(true);
    expect(fixtures.some((item) => item.degradedStates.includes("geography_unsupported"))).toBe(true);
    expect(fixtures.some((item) => item.degradedStates.includes("provider_unavailable"))).toBe(true);
  });
});

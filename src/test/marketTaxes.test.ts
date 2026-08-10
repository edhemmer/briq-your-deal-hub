import { describe, expect, it } from "vitest";
import {
  defineCanonicalMarketFreshnessPolicy,
  evaluateCanonicalMarketFreshness,
  type CanonicalMarketFreshnessResult,
} from "../core/marketFreshness";
import {
  MARKET_TAX_CONFLICT_CONTRACT_VERSION,
  MARKET_TAX_CONTRACT_VERSION,
  MARKET_TAX_FINDING_CONTRACT_VERSION,
  MARKET_TAX_OBSERVATION_CONTRACT_VERSION,
  MARKET_TAX_PROJECTION_CONTRACT_VERSION,
  MARKET_TAX_REGISTRY_VERSION,
  createMarketTaxConflictManifest,
  createMarketTaxFinding,
  createMarketTaxObservation,
  createMarketTaxRegistry,
  defineMarketTaxRegistryEntry,
  isMarketTaxFindingType,
  isMarketTaxMetricType,
  isMarketTaxPeriodSemantic,
  marketTaxCategories,
  marketTaxConflictStates,
  marketTaxDegradedStates,
  marketTaxExplanationCodes,
  marketTaxFindingTypes,
  marketTaxImpactClasses,
  marketTaxMetricTypes,
  marketTaxObservationMethods,
  marketTaxPeriodSemantics,
  projectMarketTaxFinding,
  selectMarketTaxRegistryEntry,
  type MarketTaxObservation,
  type MarketTaxRegistryEntry,
} from "../core/marketTaxes";
import { createMarketProviderProvenance } from "../core/marketSourceIngestion";

describe("MarketIQ tax and assessment context contract", () => {
  const authority = {
    authorityId: "will-county-assessor",
    authorityName: "Will County Assessor",
    authorityType: "county_assessor" as const,
    jurisdiction: "Will County, IL",
    jurisdictionLevel: "county" as const,
  };

  const parcel = {
    parcelId: "00-00-000-000",
    authorityId: "will-county-assessor",
    parcelRole: "primary" as const,
    matchState: "matched" as const,
  };

  const geography = {
    geographyLevel: "parcel" as const,
    geographyIdentity: "parcel:will:00-00-000-000",
    jurisdiction: "Will County, IL",
    taxDistrict: "tax-district-1",
    boundaryId: "parcel-boundary-1",
    boundaryVersion: "2025",
  };

  const entry = (overrides: Partial<Parameters<typeof defineMarketTaxRegistryEntry>[0]> = {}): MarketTaxRegistryEntry => defineMarketTaxRegistryEntry({
    metricId: "property.tax.bill",
    semanticVersion: "1.0.0",
    metricType: "tax_bill_amount",
    category: "bill",
    valueType: "money",
    currency: "USD",
    applicableGeographyLevels: ["parcel"],
    requiredPeriodSemantics: ["tax_year", "billing_period"],
    authorityExpectations: ["county_treasurer", "county_assessor"],
    lifecycleStatus: "active",
    professionalBoundary: "assessor_or_collector_confirmation",
    permittedProposalKinds: ["underwriting_tax_assumption_reference", "cash_flow_sensitivity_reference"],
    prohibitedInferenceCodes: ["do_not_treat_as_tax_advice", "do_not_overwrite_underwriting_tax_input"],
    registeredAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  });

  const freshnessPolicy = defineCanonicalMarketFreshnessPolicy({
    policyId: "marketiq.tax.parcel.v1",
    semanticVersion: "1.0.0",
    lifecycleStatus: "active",
    datasetCategory: "tax",
    dataset: "property_tax",
    module: "taxes",
    geographyLevel: "parcel",
    expectedCadence: "annual",
    warningAfterDays: 365,
    reviewAfterDays: 548,
    staleAfterDays: 730,
    expirationAfterDays: 1095,
    historicalAfterDays: 1825,
    ageBasis: "effective_start",
    effectivePeriodBehavior: "retains_until_effective_end",
    futureDatedDataBehavior: "future_effective",
    missingTimestampBehavior: "missing_temporal_metadata",
    providerFailureBehavior: "retain_prior_valid",
    historicalRecordBehavior: "historical_allowed",
    refreshEligibility: "refresh_not_supported",
    refreshWorkflowAvailable: false,
    providerCapability: "tax_support",
    manualReviewRequired: true,
    registeredAt: "2026-08-10T00:00:00.000Z",
  });

  const freshness = (overrides: Partial<Parameters<typeof evaluateCanonicalMarketFreshness>[0]> = {}): CanonicalMarketFreshnessResult => evaluateCanonicalMarketFreshness({
    policy: freshnessPolicy,
    providerId: "future_tax_provider",
    providerVersion: "tax-provider-v1",
    providerState: "healthy",
    datasetId: "future-tax-roll",
    dataset: "property_tax",
    datasetCategory: "tax",
    module: "taxes",
    sourceRecordId: "tax-record-1",
    canonicalLocationId: "loc-property-1",
    geographyLevel: "parcel",
    geographyIdentity: "parcel:will:00-00-000-000",
    boundaryVersion: "2025",
    observationTime: "2025-11-01T00:00:00.000Z",
    effectiveStart: "2025-01-01T00:00:00.000Z",
    effectiveEnd: "2025-12-31T23:59:59.000Z",
    retrievalTime: "2026-01-15T00:00:00.000Z",
    evaluationTime: "2026-08-10T00:00:00.000Z",
    timeSemantics: "year",
    verificationState: "source_backed",
    sourceConfidence: "source_backed",
    ...overrides,
  });

  const provenance = createMarketProviderProvenance({
    providerId: "future_tax_provider",
    providerVersion: "tax-provider-v1",
    providerRecordReference: "tax-record-1",
    observationTime: "2025-11-01T00:00:00.000Z",
    effectiveTime: "2025-01-01T00:00:00.000Z",
    retrievalTime: "2026-01-15T00:00:00.000Z",
    verificationState: "source_backed",
    confidence: "source_backed",
    evidenceReference: {
      sourceRecordId: "tax-record-1",
      evidenceId: "evidence-tax-1",
      sourceName: "Future tax provider",
      observedAt: "2025-11-01T00:00:00.000Z",
      effectiveAt: "2025-01-01T00:00:00.000Z",
    },
  });

  const observation = (overrides: Partial<Parameters<typeof createMarketTaxObservation>[0]> = {}): MarketTaxObservation => createMarketTaxObservation({
    workspaceId: "workspace-1",
    propertyId: "property-1",
    dealId: "deal-1",
    canonicalLocationId: "loc-property-1",
    entry: entry(),
    authority,
    parcel,
    geography,
    period: {
      taxYear: 2025,
      effectiveStart: "2025-01-01T00:00:00.000Z",
      effectiveEnd: "2025-12-31T23:59:59.000Z",
      retrievalTime: "2026-01-15T00:00:00.000Z",
      semantics: "tax_year",
      partialYear: false,
      futurePeriod: false,
    },
    value: {
      rawValue: 6125,
      normalizedValue: 6125,
      valueType: "money",
      currency: "USD",
      annualized: false,
    },
    providerId: "future_tax_provider",
    providerVersion: "tax-provider-v1",
    providerState: "healthy",
    dataset: "property_tax",
    sourceRecordId: "tax-record-1",
    sourceRecordKey: "future_tax_provider:tax-record-1",
    evidenceReference: { sourceRecordId: "tax-record-1", evidenceId: "evidence-tax-1", sourceName: "Future tax provider" },
    provenance: [provenance],
    freshness: freshness(),
    verificationState: "source_backed",
    confidence: "source_backed",
    method: "authority_record",
    ...overrides,
  });

  it("publishes provider-neutral tax and assessment taxonomy without live providers", () => {
    expect(marketTaxMetricTypes).toContain("assessed_value");
    expect(marketTaxMetricTypes).toContain("taxable_value");
    expect(marketTaxMetricTypes).toContain("market_value_assessor_estimate");
    expect(marketTaxMetricTypes).toContain("tax_bill_amount");
    expect(marketTaxMetricTypes).toContain("tax_rate");
    expect(marketTaxMetricTypes).toContain("levy");
    expect(marketTaxMetricTypes).toContain("homestead_exemption");
    expect(marketTaxMetricTypes).toContain("special_assessment");
    expect(marketTaxCategories).toContain("exemption");
    expect(marketTaxPeriodSemantics).toContain("assessment_year");
    expect(marketTaxPeriodSemantics).toContain("tax_year");
    expect(marketTaxObservationMethods).toContain("authority_record");
    expect(marketTaxFindingTypes).toContain("latest_tax_record_unavailable");
    expect(marketTaxImpactClasses).toContain("professional_review_required");
    expect(marketTaxConflictStates).toContain("authority_conflict");
    expect(marketTaxDegradedStates).toContain("provider_unavailable");
    expect(marketTaxExplanationCodes).toContain("underwriting_proposal_only");
    expect(isMarketTaxMetricType("taxable_value")).toBe(true);
    expect(isMarketTaxPeriodSemantic("tax_year")).toBe(true);
    expect(isMarketTaxFindingType("tax_bill_changed")).toBe(true);
  });

  it("creates a deterministic registry with explicit authority and period expectations", () => {
    const assessedValue = entry({
      metricId: "property.assessed.value",
      metricType: "assessed_value",
      category: "valuation",
      requiredPeriodSemantics: ["assessment_year"],
      professionalBoundary: "assessor_or_collector_confirmation",
    });
    const taxBill = entry();
    const registry = createMarketTaxRegistry([taxBill, assessedValue]);

    expect(registry.version).toBe(MARKET_TAX_REGISTRY_VERSION);
    expect(registry.entries.map((item) => item.metricId)).toEqual(["property.tax.bill", "property.assessed.value"]);
    expect(taxBill.contractVersion).toBe(MARKET_TAX_CONTRACT_VERSION);
    expect(taxBill.materialHash).toMatch(/^mt_entryh_/);
    expect(selectMarketTaxRegistryEntry({ registry, metricId: "property.tax.bill" }).metricType).toBe("tax_bill_amount");
  });

  it("preserves tax year, assessment year, assessed value, taxable value, and market value distinctions", () => {
    const assessed = observation({
      entry: entry({
        metricId: "property.assessed.value",
        metricType: "assessed_value",
        category: "valuation",
        requiredPeriodSemantics: ["assessment_year"],
      }),
      period: {
        assessmentYear: 2025,
        effectiveStart: "2025-01-01T00:00:00.000Z",
        semantics: "assessment_year",
        partialYear: false,
        futurePeriod: false,
      },
      value: { rawValue: 158000, normalizedValue: 158000, valueType: "money", currency: "USD", annualized: false },
    });
    const taxable = observation({
      entry: entry({
        metricId: "property.taxable.value",
        metricType: "taxable_value",
        category: "valuation",
        requiredPeriodSemantics: ["tax_year"],
      }),
      value: { rawValue: 141000, normalizedValue: 141000, valueType: "money", currency: "USD", annualized: false },
    });

    expect(assessed.metricType).toBe("assessed_value");
    expect(assessed.period.assessmentYear).toBe(2025);
    expect(assessed.explanationCodes).toContain("assessed_value_changed");
    expect(taxable.metricType).toBe("taxable_value");
    expect(taxable.explanationCodes).toContain("taxable_value_changed");
    expect(assessed.explanationCodes).toContain("value_distinction_preserved");
    expect(taxable.explanationCodes).toContain("value_distinction_preserved");
  });

  it("marks unavailable, stale, missing-year, and parcel-resolution states without inventing values", () => {
    const staleUnavailable = observation({
      providerState: "offline",
      freshness: freshness({
        providerState: "offline",
        providerFailure: "provider_unavailable",
        priorValidResultId: "freshness-prior-1",
        priorValidSourceRecordId: "tax-record-prior",
      }),
      parcel: { ...parcel, matchState: "unresolved" },
      period: {
        retrievalTime: "2026-01-15T00:00:00.000Z",
        semantics: "tax_year",
        partialYear: false,
        futurePeriod: false,
      },
    });

    expect(staleUnavailable.freshnessState).toBe("missing_temporal_metadata");
    expect(staleUnavailable.degradedStates).toEqual(expect.arrayContaining(["provider_unavailable", "parcel_unresolved", "missing_tax_year"]));
    expect(staleUnavailable.explanationCodes).toEqual(expect.arrayContaining(["provider_unavailable_prior_valid_retained", "tax_year_missing"]));
    expect(staleUnavailable.value.normalizedValue).toBe(6125);
  });

  it("blocks conflicting tax records until authority or parcel conflict resolution", () => {
    const first = observation();
    const second = observation({
      sourceRecordId: "tax-record-2",
      sourceRecordKey: "future_tax_provider:tax-record-2",
      parcel: { ...parcel, parcelId: "00-00-000-999", matchState: "mismatch" },
      value: { rawValue: 7300, normalizedValue: 7300, valueType: "money", currency: "USD", annualized: false },
      degradedStates: ["conflicting_tax_records"],
    });
    const conflict = createMarketTaxConflictManifest({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      conflictState: "parcel_mismatch",
      observations: [first, second],
      reasonCodes: ["parcel_identity_conflict"],
      retainedObservationIds: [first.observationId],
    });

    expect(conflict.contractVersion).toBe(MARKET_TAX_CONFLICT_CONTRACT_VERSION);
    expect(conflict.blockedUntilResolved).toBe(true);
    expect(conflict.observationIds).toHaveLength(2);
    expect(conflict.retainedObservationIds).toEqual([first.observationId]);
  });

  it("surfaces findings as proposal references only and never mutates underwriting or strategy outputs", () => {
    const taxObservation = observation();
    const finding = createMarketTaxFinding({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      findingType: "tax_record_current",
      sourceObservations: [taxObservation],
      summaryCode: "tax_record_current",
      impactClass: "cash_flow_context",
      confidence: "source_backed",
      verificationState: "source_backed",
      applicableStrategyReferences: ["owner_occupied", "long_term_rental"],
      assumptionProposalReferences: ["proposal.taxes.annual.2025"],
    });
    const projection = projectMarketTaxFinding(finding);

    expect(finding.contractVersion).toBe(MARKET_TAX_FINDING_CONTRACT_VERSION);
    expect(finding.underwritingMutationAllowed).toBe(false);
    expect(finding.strategyRerankAllowed).toBe(false);
    expect(finding.professionalConclusionAllowed).toBe(false);
    expect(projection.contractVersion).toBe(MARKET_TAX_PROJECTION_CONTRACT_VERSION);
    expect(projection.assumptionProposalReferences).toEqual(["proposal.taxes.annual.2025"]);
    expect(projection.underwritingMutationAllowed).toBe(false);
    expect(projection.strategyRerankAllowed).toBe(false);
  });

  it("requires special assessments and exemptions to remain explicit and professionally bounded", () => {
    const specialAssessment = observation({
      entry: entry({
        metricId: "property.special.assessment",
        metricType: "special_assessment",
        category: "special_assessment",
        requiredPeriodSemantics: ["tax_year"],
        professionalBoundary: "attorney_or_title_review",
      }),
      value: { rawValue: 450, normalizedValue: 450, valueType: "money", currency: "USD", annualized: false },
      specialAssessment: {
        districtId: "ssa-1",
        districtName: "Special Service Area 1",
        purpose: "Road maintenance",
        recurrence: "unknown",
        paymentStatus: "reported",
      },
    });
    const exemption = observation({
      entry: entry({
        metricId: "property.homestead.exemption",
        metricType: "homestead_exemption",
        category: "exemption",
        valueType: "boolean",
        currency: undefined,
        requiredPeriodSemantics: ["tax_year"],
        professionalBoundary: "tax_professional_review",
      }),
      value: { rawValue: true, normalizedValue: true, valueType: "boolean", annualized: false },
      exemption: {
        exemptionType: "homestead",
        qualifyingStatus: "reported_for_current_owner",
        transferStatus: "unknown",
      },
    });

    expect(specialAssessment.explanationCodes).toContain("special_assessment_reported");
    expect(specialAssessment.specialAssessment?.recurrence).toBe("unknown");
    expect(exemption.explanationCodes).toEqual(expect.arrayContaining(["exemption_reported", "exemption_transfer_unknown"]));
  });
});

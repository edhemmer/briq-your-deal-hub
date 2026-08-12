import { describe, expect, it } from "vitest";
import {
  MARKET_CONVENIENCE_CONFLICT_CONTRACT_VERSION,
  MARKET_CONVENIENCE_CONTRACT_VERSION,
  MARKET_CONVENIENCE_DESTINATION_CONTRACT_VERSION,
  MARKET_CONVENIENCE_FINDING_CONTRACT_VERSION,
  MARKET_CONVENIENCE_MEASUREMENT_CONTRACT_VERSION,
  MARKET_CONVENIENCE_PROJECTION_CONTRACT_VERSION,
  MARKET_CONVENIENCE_REGISTRY_VERSION,
  MARKET_CONVENIENCE_SCHOOL_CONTRACT_VERSION,
  MARKET_CONVENIENCE_SERVICE_CONTRACT_VERSION,
  createMarketConvenienceAccessibilityMeasurement,
  createMarketConvenienceConflictManifest,
  createMarketConvenienceDestinationObservation,
  createMarketConvenienceFinding,
  createMarketConvenienceRegistry,
  createMarketConvenienceSchoolContext,
  createMarketConvenienceServiceAvailability,
  defineMarketConvenienceRegistryEntry,
  isMarketConvenienceDistanceMethod,
  isMarketConvenienceFindingType,
  isMarketConvenienceServiceType,
  marketConvenienceBroadbandTechnologies,
  marketConvenienceCategories,
  marketConvenienceConflictStates,
  marketConvenienceCoverageLevels,
  marketConvenienceDegradedStates,
  marketConvenienceDestinationStatuses,
  marketConvenienceDistanceMethods,
  marketConvenienceExplanationCodes,
  marketConvenienceFindingTypes,
  marketConvenienceGeographyRelationships,
  marketConvenienceMeasurementTypes,
  marketConvenienceSchoolAssignmentStates,
  marketConvenienceSchoolMetricTypes,
  marketConvenienceServiceTypes,
  marketConvenienceTravelTimeBases,
  marketConvenienceTravelTimeMethods,
  marketConvenienceUtilityTypes,
  projectMarketConvenienceFinding,
  selectMarketConvenienceRegistryEntry,
  type MarketConvenienceRegistryEntry,
} from "../core/marketConvenience";
import { createMarketProviderProvenance } from "../core/marketSourceIngestion";

describe("MarketIQ convenience and accessibility context contract", () => {
  const sourceReference = {
    sourceRecordId: "convenience-source-1",
    evidenceId: "evidence-convenience-1",
    sourceName: "Future public convenience source",
    observedAt: "2026-08-01T00:00:00.000Z",
    effectiveAt: "2026-08-01T00:00:00.000Z",
  };

  const provenance = createMarketProviderProvenance({
    providerId: "future_convenience_provider",
    providerVersion: "convenience-provider-v1",
    providerRecordReference: "convenience-source-1",
    observationTime: "2026-08-01T00:00:00.000Z",
    effectiveTime: "2026-08-01T00:00:00.000Z",
    retrievalTime: "2026-08-12T00:00:00.000Z",
    verificationState: "source_backed",
    confidence: "source_backed",
    evidenceReference: sourceReference,
  });

  const entry = (overrides: Partial<Parameters<typeof defineMarketConvenienceRegistryEntry>[0]> = {}): MarketConvenienceRegistryEntry => defineMarketConvenienceRegistryEntry({
    contextId: "convenience.grocery",
    semanticVersion: "1.0.0",
    category: "daily_needs",
    serviceType: "grocery",
    applicableDatasets: ["grocery_access"],
    supportedGeographyLevels: ["address", "parcel", "point", "municipality", "custom_market_boundary"],
    supportedMeasurementTypes: ["nearest_destination", "distance_to_destination", "travel_time_to_destination", "count_within_radius"],
    supportedDistanceMethods: ["straight_line", "road_network", "provider_reported_distance", "approximate_radius", "geographic_centroid_proxy"],
    supportedTravelTimeMethods: ["driving", "walking", "public_transit", "provider_reported", "historical", "unknown"],
    supportedObservationMethods: ["provider_reported", "public_record", "user_entered_evidence", "measured_route", "source_reported"],
    allowsSchoolContext: false,
    allowsServiceAvailability: false,
    lifecycleStatus: "active",
    permittedProposalKinds: ["market_context_reference", "assumption_review"],
    prohibitedInferenceCodes: ["do_not_score_neighborhood_quality"],
    registeredAt: "2026-08-12T00:00:00.000Z",
    ...overrides,
  });

  const subjectGeography = (overrides: Partial<Parameters<typeof createMarketConvenienceDestinationObservation>[0]["subjectGeography"]> = {}) => ({
    geographyLevel: "address" as const,
    geographyIdentity: "address:sample-property",
    canonicalLocationId: "loc-convenience-1",
    boundaryId: "parcel-1",
    boundaryVersion: "2026",
    relationship: "property_exact" as const,
    proxy: false,
    ...overrides,
  });

  const destination = (overrides: Partial<Parameters<typeof createMarketConvenienceDestinationObservation>[0]> = {}) => createMarketConvenienceDestinationObservation({
    workspaceId: "workspace-1",
    propertyId: "property-1",
    dealId: "deal-1",
    canonicalLocationId: "loc-convenience-1",
    entry: entry(),
    destinationIdentity: "poi:grocery-1",
    destinationName: "Source-backed grocery",
    destinationStatus: "operating",
    observationMethod: "provider_reported",
    subjectGeography: subjectGeography(),
    destinationGeography: subjectGeography({ geographyIdentity: "poi:grocery-1", relationship: "exact_point" }),
    providerId: "future_convenience_provider",
    providerVersion: "convenience-provider-v1",
    providerState: "healthy",
    dataset: "grocery_access",
    sourceRecordId: "convenience-source-1",
    sourceRecordKey: "future_convenience_provider:convenience-source-1",
    observationTime: "2026-08-01T00:00:00.000Z",
    retrievalTime: "2026-08-12T00:00:00.000Z",
    evidenceReference: sourceReference,
    provenance: [provenance],
    verificationState: "source_backed",
    confidence: "source_backed",
    ...overrides,
  });

  const measurement = (overrides: Partial<Parameters<typeof createMarketConvenienceAccessibilityMeasurement>[0]> = {}) => createMarketConvenienceAccessibilityMeasurement({
    workspaceId: "workspace-1",
    propertyId: "property-1",
    dealId: "deal-1",
    destinationObservationId: destination().observationId,
    destinationIdentity: "poi:grocery-1",
    serviceType: "grocery",
    measurementType: "distance_to_destination",
    subjectGeography: subjectGeography(),
    distanceValue: 1.2,
    distanceUnit: "mi",
    distanceMethod: "straight_line",
    travelTimeMethod: "unknown",
    travelTimeBasis: "not_applicable",
    providerId: "future_convenience_provider",
    providerVersion: "convenience-provider-v1",
    providerState: "healthy",
    evidenceReference: sourceReference,
    provenance: [provenance],
    verificationState: "source_backed",
    confidence: "source_backed",
    ...overrides,
  });

  it("publishes the complete convenience taxonomy and fair-housing guardrails", () => {
    expect(marketConvenienceCategories).toEqual(expect.arrayContaining(["daily_needs", "healthcare", "education", "transportation", "employment_access", "digital_utility", "utility", "recreation"]));
    expect(marketConvenienceServiceTypes).toEqual(expect.arrayContaining(["grocery", "hospital", "transit_stop", "airport", "major_road", "employment_center", "broadband_availability", "electric_service", "park", "assigned_school"]));
    expect(marketConvenienceDestinationStatuses).toEqual(expect.arrayContaining(["operating", "temporarily_closed", "permanently_closed", "unknown"]));
    expect(marketConvenienceDistanceMethods).toEqual(expect.arrayContaining(["straight_line", "road_network", "measured_route", "geographic_centroid_proxy", "unknown"]));
    expect(marketConvenienceTravelTimeMethods).toEqual(expect.arrayContaining(["driving", "walking", "public_transit", "historical", "unknown"]));
    expect(marketConvenienceTravelTimeBases).toContain("typical_traffic");
    expect(marketConvenienceMeasurementTypes).toContain("count_within_travel_time");
    expect(marketConvenienceCoverageLevels).toEqual(expect.arrayContaining(["address_level", "census_block", "service_area", "provider_reported_area"]));
    expect(marketConvenienceBroadbandTechnologies).toContain("fiber");
    expect(marketConvenienceUtilityTypes).toContain("municipal_water");
    expect(marketConvenienceSchoolAssignmentStates).toContain("uncertain");
    expect(marketConvenienceSchoolMetricTypes).toContain("published_metric");
    expect(marketConvenienceGeographyRelationships).toEqual(expect.arrayContaining(["property_exact", "neighborhood_proxy", "centroid_proxy", "area_average"]));
    expect(marketConvenienceFindingTypes).toEqual(expect.arrayContaining(["grocery_access_observed", "healthcare_access_observed", "school_assignment_uncertain", "broadband_coverage_reported", "utility_availability_reported", "proxy_geography_used"]));
    expect(marketConvenienceConflictStates).toEqual(expect.arrayContaining(["travel_time_conflict", "school_assignment_conflict", "broadband_availability_conflict"]));
    expect(marketConvenienceDegradedStates).toEqual(expect.arrayContaining(["route_method_unavailable", "provider_unavailable", "school_assignment_uncertain", "proxy_only_geography", "no_source_coverage"]));
    expect(marketConvenienceExplanationCodes).toEqual(expect.arrayContaining(["no_investment_quality_inference", "no_school_desirability_score", "no_neighborhood_quality_score", "no_protected_class_scoring", "straight_line_not_drive_time"]));
    expect(isMarketConvenienceServiceType("grocery")).toBe(true);
    expect(isMarketConvenienceDistanceMethod("road_network")).toBe(true);
    expect(isMarketConvenienceFindingType("major_road_access_observed")).toBe(true);
  });

  it("creates deterministic provider-neutral registry entries without provider access", () => {
    const grocery = entry();
    const hospital = entry({ contextId: "convenience.hospital", category: "healthcare", serviceType: "hospital", applicableDatasets: ["healthcare_access"] });
    const registry = createMarketConvenienceRegistry([hospital, grocery]);

    expect(registry.version).toBe(MARKET_CONVENIENCE_REGISTRY_VERSION);
    expect(registry.entries.map((item) => item.contextId)).toEqual(["convenience.grocery", "convenience.hospital"]);
    expect(grocery.contractVersion).toBe(MARKET_CONVENIENCE_CONTRACT_VERSION);
    expect(grocery.materialHash).toMatch(/^mc_entryh_/);
    expect(selectMarketConvenienceRegistryEntry({ registry, contextId: "convenience.hospital" }).serviceType).toBe("hospital");
    expect(Object.keys(grocery)).not.toEqual(expect.arrayContaining(["credential", "apiKey", "oauthToken", "score"]));
  });

  it("separates straight-line distance from route and travel-time measurements", () => {
    const straightLineGrocery = measurement({ distanceMethod: "straight_line", distanceValue: 0.8, travelTimeMethod: "unknown" });
    const roadNetworkGrocery = measurement({ distanceMethod: "road_network", distanceValue: 1.3, travelTimeValue: 6, travelTimeMethod: "driving", travelTimeBasis: "typical_traffic", measurementTimestamp: "2026-08-12T14:00:00.000Z" });

    expect(straightLineGrocery.contractVersion).toBe(MARKET_CONVENIENCE_MEASUREMENT_CONTRACT_VERSION);
    expect(straightLineGrocery.explanationCodes).toContain("straight_line_not_drive_time");
    expect(straightLineGrocery.degradedStates).toContain("travel_time_unavailable");
    expect(roadNetworkGrocery.explanationCodes).toContain("travel_time_method_declared");
    expect(roadNetworkGrocery.travelTimeValue).toBe(6);
  });

  it("requires timestamp and method for travel-time facts", () => {
    expect(() => measurement({ travelTimeValue: 9, travelTimeMethod: "unknown" })).toThrow("Travel-time observation requires a stated method.");
    expect(() => measurement({ travelTimeValue: 9, travelTimeMethod: "driving" })).toThrow("Travel-time observation requires timestamp.");
  });

  it("represents hospital, transit, airport, highway, employment, and recreation destinations as factual observations", () => {
    const cases = [
      destination({ entry: entry({ contextId: "convenience.hospital", category: "healthcare", serviceType: "hospital", applicableDatasets: ["healthcare_access"] }), destinationIdentity: "poi:hospital-1", dataset: "healthcare_access" }),
      destination({ entry: entry({ contextId: "convenience.transit", category: "transportation", serviceType: "transit_stop", applicableDatasets: ["transportation_access"] }), destinationIdentity: "poi:transit-1", dataset: "transportation_access" }),
      destination({ entry: entry({ contextId: "convenience.airport", category: "transportation", serviceType: "airport", applicableDatasets: ["airport_access"] }), destinationIdentity: "poi:airport-1", dataset: "airport_access" }),
      destination({ entry: entry({ contextId: "convenience.highway", category: "transportation", serviceType: "highway_interchange", applicableDatasets: ["transportation_access"] }), destinationIdentity: "poi:highway-1", dataset: "transportation_access" }),
      destination({ entry: entry({ contextId: "convenience.employment", category: "employment_access", serviceType: "employment_center", applicableDatasets: ["employment_level"] }), destinationIdentity: "poi:employment-1", dataset: "employment_level" }),
      destination({ entry: entry({ contextId: "convenience.park", category: "recreation", serviceType: "park", applicableDatasets: ["transportation_access"] }), destinationIdentity: "poi:park-1", dataset: "transportation_access" }),
    ];

    expect(cases.map((item) => item.contractVersion)).toEqual(cases.map(() => MARKET_CONVENIENCE_DESTINATION_CONTRACT_VERSION));
    expect(cases.every((item) => item.explanationCodes.includes("factual_context_only"))).toBe(true);
  });

  it("marks stale records, unavailable providers, closed facilities, missing route methods, and no coverage as degraded without absence inference", () => {
    const stale = destination({ freshness: { freshnessResultId: "fresh-1", policyId: "policy", policyVersion: "1.0.0", datasetId: "grocery_access", datasetCategory: "convenience", geographyLevel: "address", evaluationAsOf: "2026-08-12T00:00:00.000Z", timeSemantics: "instant", ageBasis: "retrieval_time", freshnessState: "stale", staleReasons: ["review_threshold_reached"], thresholdReferences: { warningAfterDays: 20, reviewAfterDays: 30, staleAfterDays: 60, historicalAfterDays: 365 }, verificationState: "source_backed", sourceConfidence: "source_backed", refreshEligibility: { state: "refresh_due", reason: "refresh_due", datasetId: "grocery_access" }, manualReviewRequired: false, explanationCodes: ["review_threshold_reached"], calculatedAgeDays: 90, contractVersion: "canonical-market-freshness-v1", materialHash: "fresh-hash" } });
    const providerDown = destination({ providerState: "offline", freshness: { ...stale.freshness!, freshnessState: "unavailable", priorValidResultId: "fresh-prior" } });
    const closed = destination({ destinationIdentity: "poi:closed-grocery", destinationStatus: "permanently_closed" });
    const noCoverage = destination({ sourceRecordId: undefined, evidenceReference: undefined, provenance: [], degradedStates: ["no_source_coverage"] });
    const missingRoute = measurement({ distanceMethod: "unknown" });

    expect(stale.degradedStates).toContain("stale_prior_valid");
    expect(providerDown.explanationCodes).toContain("provider_unavailable_prior_valid_retained");
    expect(closed.degradedStates).toContain("destination_unavailable");
    expect(noCoverage.explanationCodes).toContain("no_absence_inference");
    expect(missingRoute.degradedStates).toEqual(expect.arrayContaining(["route_method_unavailable", "travel_time_unavailable"]));
  });

  it("keeps broadband and utility availability as source-linked availability context, not confirmed service", () => {
    const areaBroadband = createMarketConvenienceServiceAvailability({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      serviceType: "broadband_availability",
      availabilityState: "reported_available",
      coverageLevel: "provider_reported_area",
      geography: subjectGeography({ geographyLevel: "postal_area", geographyIdentity: "postal:60404", relationship: "area_average", proxy: true }),
      broadbandTechnology: "fiber",
      advertisedDownMbps: 1000,
      providerId: "future_broadband_provider",
      providerVersion: "v1",
      providerState: "healthy",
      evidenceReference: sourceReference,
      provenance: [provenance],
      verificationState: "source_backed",
      confidence: "source_backed",
    });
    const addressBroadband = createMarketConvenienceServiceAvailability({
      ...areaBroadband,
      coverageLevel: "address_level",
      geography: subjectGeography(),
      measuredDownMbps: 820,
      degradedStates: [],
      explanationCodes: [],
    });
    const utility = createMarketConvenienceServiceAvailability({
      ...areaBroadband,
      serviceType: "electric_service",
      utilityType: "electric",
      coverageLevel: "service_area",
      broadbandTechnology: undefined,
      degradedStates: [],
      explanationCodes: [],
    });

    expect(areaBroadband.contractVersion).toBe(MARKET_CONVENIENCE_SERVICE_CONTRACT_VERSION);
    expect(areaBroadband.explanationCodes).toEqual(expect.arrayContaining(["broadband_coverage_reported", "broadband_address_verification_needed", "advertised_speed_not_measured_speed"]));
    expect(areaBroadband.degradedStates).toEqual(expect.arrayContaining(["broadband_coverage_uncertain", "proxy_only_geography"]));
    expect(addressBroadband.degradedStates).not.toContain("broadband_coverage_uncertain");
    expect(utility.explanationCodes).toEqual(expect.arrayContaining(["utility_service_area_reported", "utility_property_verification_needed", "service_area_not_active_connection"]));
  });

  it("preserves school assignments and metrics as factual context with fair-housing boundaries", () => {
    const assigned = createMarketConvenienceSchoolContext({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      schoolIdentity: "school:assigned-1",
      schoolName: "Source Reported Elementary",
      assignmentState: "reported_assigned",
      schoolType: "public",
      gradeRange: "K-5",
      districtName: "Example District",
      sourceDate: "2026-08-01",
      metricType: "published_metric",
      metricValue: "source-published metric",
      metricMethodology: "Provider-published methodology retained verbatim by reference.",
      geography: subjectGeography({ geographyLevel: "parcel", relationship: "parcel" }),
      providerId: "future_school_provider",
      providerVersion: "v1",
      providerState: "healthy",
      evidenceReference: sourceReference,
      provenance: [provenance],
      verificationState: "source_backed",
      confidence: "source_backed",
    });
    const uncertain = createMarketConvenienceSchoolContext({ ...assigned, schoolIdentity: "school:uncertain", assignmentState: "uncertain", sourceDate: undefined, metricValue: undefined, metricMethodology: undefined });

    expect(assigned.contractVersion).toBe(MARKET_CONVENIENCE_SCHOOL_CONTRACT_VERSION);
    expect(assigned.explanationCodes).toEqual(expect.arrayContaining(["school_assignment_reported", "school_metric_methodology_preserved", "no_school_desirability_score"]));
    expect(assigned.prohibitedInferenceCodes).toContain("no_protected_class_scoring");
    expect(uncertain.degradedStates).toContain("school_assignment_uncertain");
    expect(uncertain.explanationCodes).toContain("school_assignment_uncertain");
    expect(() => createMarketConvenienceSchoolContext({ ...assigned, sourceDate: undefined })).toThrow("Reported school assignment requires source date.");
    expect(() => createMarketConvenienceSchoolContext({ ...assigned, metricMethodology: undefined })).toThrow("School metrics require source methodology.");
  });

  it("creates conflicts for conflicting travel times and conflicting school assignments", () => {
    const fastRoute = measurement({ destinationIdentity: "poi:hospital-1", serviceType: "hospital", travelTimeValue: 8, travelTimeMethod: "driving", travelTimeBasis: "typical_traffic", measurementTimestamp: "2026-08-12T14:00:00.000Z" });
    const slowRoute = measurement({ destinationIdentity: "poi:hospital-1", serviceType: "hospital", travelTimeValue: 18, travelTimeMethod: "driving", travelTimeBasis: "typical_traffic", measurementTimestamp: "2026-08-12T14:00:00.000Z", degradedStates: ["conflicting_sources"] });
    const conflict = createMarketConvenienceConflictManifest({
      workspaceId: "workspace-1",
      conflictState: "travel_time_conflict",
      measurements: [slowRoute, fastRoute],
      reasonCodes: ["conflicting_accessibility_sources"],
    });

    expect(conflict.contractVersion).toBe(MARKET_CONVENIENCE_CONFLICT_CONTRACT_VERSION);
    expect(conflict.measurementIds).toEqual([fastRoute.measurementId, slowRoute.measurementId].sort());
    expect(conflict.reasonCodes).toContain("conflicting_accessibility_sources");
  });

  it("creates factual findings and projections that cannot mutate recommendations or strategy rankings", () => {
    const grocery = destination();
    const groceryDistance = measurement({ destinationObservationId: grocery.observationId });
    const finding = createMarketConvenienceFinding({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      findingType: "grocery_access_observed",
      sourceObservations: [grocery],
      sourceMeasurements: [groceryDistance],
      summaryCode: "destination_access_observed",
      category: "daily_needs",
      impactClass: "decision_context",
      confidence: "source_backed",
      verificationState: "source_backed",
      applicableStrategyReferences: ["owner_occupied", "short_term_rental"],
      assumptionProposalReferences: ["proposal-market-context-1"],
      userPriorityReferences: ["user-priority-commute-1"],
    });
    const projection = projectMarketConvenienceFinding(finding);

    expect(finding.contractVersion).toBe(MARKET_CONVENIENCE_FINDING_CONTRACT_VERSION);
    expect(finding.underwritingMutationAllowed).toBe(false);
    expect(finding.strategyRerankAllowed).toBe(false);
    expect(finding.recommendationMutationAllowed).toBe(false);
    expect(finding.investmentQualityInferenceAllowed).toBe(false);
    expect(finding.neighborhoodQualityConclusionAllowed).toBe(false);
    expect(finding.schoolDesirabilityConclusionAllowed).toBe(false);
    expect(finding.protectedClassScoringAllowed).toBe(false);
    expect(projection.contractVersion).toBe(MARKET_CONVENIENCE_PROJECTION_CONTRACT_VERSION);
    expect(projection.investmentQualityInferenceAllowed).toBe(false);
  });
});

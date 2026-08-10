import { describe, expect, it } from "vitest";
import {
  MARKET_INFRASTRUCTURE_CONFLICT_CONTRACT_VERSION,
  MARKET_INFRASTRUCTURE_CONTRACT_VERSION,
  MARKET_INFRASTRUCTURE_FINDING_CONTRACT_VERSION,
  MARKET_INFRASTRUCTURE_OBSERVATION_CONTRACT_VERSION,
  MARKET_INFRASTRUCTURE_PROJECTION_CONTRACT_VERSION,
  MARKET_INFRASTRUCTURE_REGISTRY_VERSION,
  createMarketInfrastructureConflictManifest,
  createMarketInfrastructureFinding,
  createMarketInfrastructureObservation,
  createMarketInfrastructureRegistry,
  defineMarketInfrastructureRegistryEntry,
  isMarketInfrastructureFindingType,
  isMarketInfrastructureProjectStatus,
  isMarketInfrastructureSubtype,
  marketInfrastructureApprovalStates,
  marketInfrastructureCategories,
  marketInfrastructureConflictStates,
  marketInfrastructureDegradedStates,
  marketInfrastructureDistanceMethods,
  marketInfrastructureExplanationCodes,
  marketInfrastructureFindingTypes,
  marketInfrastructureFundingStates,
  marketInfrastructureImpactClasses,
  marketInfrastructureObservationMethods,
  marketInfrastructurePermitStates,
  marketInfrastructureProjectStatuses,
  marketInfrastructureSubtypes,
  marketInfrastructureTimelineKinds,
  projectMarketInfrastructureFinding,
  selectMarketInfrastructureRegistryEntry,
  type MarketInfrastructureObservation,
  type MarketInfrastructureRegistryEntry,
} from "../core/marketInfrastructure";
import { createMarketProviderProvenance } from "../core/marketSourceIngestion";

describe("MarketIQ infrastructure and development direction context contract", () => {
  const sourceReference = {
    sourceRecordId: "capital-plan-record-1",
    evidenceId: "evidence-infra-1",
    sourceName: "Future municipal capital plan",
    observedAt: "2026-01-15T00:00:00.000Z",
    effectiveAt: "2026-01-01T00:00:00.000Z",
  };

  const provenance = createMarketProviderProvenance({
    providerId: "future_infrastructure_provider",
    providerVersion: "infra-provider-v1",
    providerRecordReference: "capital-plan-record-1",
    observationTime: "2026-01-15T00:00:00.000Z",
    effectiveTime: "2026-01-01T00:00:00.000Z",
    retrievalTime: "2026-08-10T00:00:00.000Z",
    verificationState: "source_backed",
    confidence: "source_backed",
    evidenceReference: sourceReference,
  });

  const entry = (overrides: Partial<Parameters<typeof defineMarketInfrastructureRegistryEntry>[0]> = {}): MarketInfrastructureRegistryEntry => defineMarketInfrastructureRegistryEntry({
    contextId: "infrastructure.planned.road",
    semanticVersion: "1.0.0",
    category: "transportation",
    subtype: "planned_road",
    dataset: "major_development",
    applicableGeographyLevels: ["municipality", "county", "custom_market_boundary"],
    supportedStatuses: ["conceptual", "proposed", "under_review", "approved", "funded", "under_construction", "complete", "delayed", "cancelled", "unknown"],
    supportedFundingStates: ["unfunded", "funding_proposed", "partially_funded", "funded", "funding_unknown"],
    supportedPermitStates: ["unknown"],
    supportedApprovalStates: ["not_required", "submitted", "under_review", "approved", "denied", "unknown"],
    supportedObservationMethods: ["authority_record", "planning_document", "capital_plan", "provider_normalized_record", "user_document"],
    lifecycleStatus: "active",
    professionalBoundary: "municipal_verification",
    permittedProposalKinds: ["underwriting_context_reference", "strategy_assumption_reference"],
    prohibitedInferenceCodes: ["do_not_treat_planned_as_completed", "do_not_mutate_underwriting_from_infrastructure"],
    registeredAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  });

  const observation = (overrides: Partial<Parameters<typeof createMarketInfrastructureObservation>[0]> = {}): MarketInfrastructureObservation => createMarketInfrastructureObservation({
    workspaceId: "workspace-1",
    propertyId: "property-1",
    dealId: "deal-1",
    canonicalLocationId: "loc-market-1",
    entry: entry(),
    project: {
      projectId: "road-project-1",
      projectName: "North corridor improvement",
      sponsorName: "Municipal transportation department",
      authorityName: "Future municipality",
      sourceReference,
    },
    geography: {
      geographyLevel: "municipality",
      geographyIdentity: "municipality:future-il",
      canonicalLocationId: "loc-market-1",
      jurisdiction: "Future Municipality, IL",
      boundaryId: "municipality-boundary-1",
      boundaryVersion: "2026",
      relationship: "corridor",
    },
    proximity: {
      distance: 1.2,
      distanceUnit: "mi",
      method: "corridor_adjacency",
      relationship: "corridor",
      sourceReference,
    },
    projectStatus: "proposed",
    approvalState: "under_review",
    fundingState: "funding_proposed",
    permitState: "unknown",
    timeline: {
      announcedDate: "2026-01-15T00:00:00.000Z",
      expectedStart: "2027-04-01T00:00:00.000Z",
      expectedCompletion: "2028-12-31T00:00:00.000Z",
      retrievalTime: "2026-08-10T00:00:00.000Z",
      timelineKind: "expected_start",
      projected: true,
      historical: false,
    },
    providerId: "future_infrastructure_provider",
    providerVersion: "infra-provider-v1",
    providerState: "healthy",
    dataset: "major_development",
    sourceRecordId: "capital-plan-record-1",
    sourceRecordKey: "future_infrastructure_provider:capital-plan-record-1",
    evidenceReference: sourceReference,
    provenance: [provenance],
    verificationState: "source_backed",
    confidence: "source_backed",
    method: "capital_plan",
    ...overrides,
  });

  it("publishes a provider-neutral infrastructure taxonomy without provider activation", () => {
    expect(marketInfrastructureCategories).toEqual(["transportation", "utilities", "development", "public_investment", "planning", "permitting", "pipeline"]);
    expect(marketInfrastructureSubtypes).toEqual(expect.arrayContaining(["planned_road", "transit_extension", "water_expansion", "development_pipeline", "permit_trend", "zoning_change", "land_use_plan", "annexation"]));
    expect(marketInfrastructureProjectStatuses).toEqual(expect.arrayContaining(["proposed", "approved", "funded", "under_construction", "complete", "delayed", "cancelled"]));
    expect(marketInfrastructureFundingStates).toContain("funded");
    expect(marketInfrastructurePermitStates).toContain("permit_issued");
    expect(marketInfrastructureApprovalStates).toContain("under_review");
    expect(marketInfrastructureTimelineKinds).toContain("effective_period");
    expect(marketInfrastructureDistanceMethods).toContain("corridor_adjacency");
    expect(marketInfrastructureObservationMethods).toContain("capital_plan");
    expect(marketInfrastructureFindingTypes).toContain("public_investment_reported");
    expect(marketInfrastructureImpactClasses).toContain("professional_review_required");
    expect(marketInfrastructureConflictStates).toContain("zoning_plan_disagreement");
    expect(marketInfrastructureDegradedStates).toContain("permission_restricted");
    expect(marketInfrastructureExplanationCodes).toContain("underwriting_proposal_only");
    expect(isMarketInfrastructureSubtype("annexation")).toBe(true);
    expect(isMarketInfrastructureProjectStatus("funded")).toBe(true);
    expect(isMarketInfrastructureFindingType("major_project_planned_nearby")).toBe(true);
  });

  it("creates deterministic registry entries with explicit professional and inference boundaries", () => {
    const road = entry();
    const publicInvestment = entry({
      contextId: "infrastructure.public.capital",
      category: "public_investment",
      subtype: "capital_improvement",
      professionalBoundary: "municipal_verification",
    });
    const registry = createMarketInfrastructureRegistry([publicInvestment, road]);

    expect(registry.version).toBe(MARKET_INFRASTRUCTURE_REGISTRY_VERSION);
    expect(registry.entries.map((item) => item.contextId)).toEqual(["infrastructure.public.capital", "infrastructure.planned.road"]);
    expect(road.contractVersion).toBe(MARKET_INFRASTRUCTURE_CONTRACT_VERSION);
    expect(road.materialHash).toMatch(/^mi_entryh_/);
    expect(selectMarketInfrastructureRegistryEntry({ registry, contextId: "infrastructure.planned.road" }).subtype).toBe("planned_road");
  });

  it("preserves planned, funded, under-construction, and completed project distinctions", () => {
    const proposed = observation();
    const funded = observation({ projectStatus: "funded", fundingState: "funded", approvalState: "approved" });
    const underConstruction = observation({ projectStatus: "under_construction", fundingState: "funded", approvalState: "approved" });
    const complete = observation({
      projectStatus: "complete",
      fundingState: "funded",
      approvalState: "approved",
      timeline: {
        actualCompletion: "2026-06-30T00:00:00.000Z",
        retrievalTime: "2026-08-10T00:00:00.000Z",
        timelineKind: "actual_completion",
        projected: false,
        historical: true,
      },
    });

    expect(proposed.explanationCodes).toEqual(expect.arrayContaining(["project_proposed", "proposed_not_approved", "planned_not_completed"]));
    expect(funded.explanationCodes).toEqual(expect.arrayContaining(["project_funded", "funded_not_started"]));
    expect(underConstruction.explanationCodes).toContain("project_under_construction");
    expect(complete.explanationCodes).toContain("project_completed");
    expect(complete.timeline.projected).toBe(false);
    expect(complete.timeline.historical).toBe(true);
  });

  it("keeps public investment and permitting observations source-linked and non-guaranteed", () => {
    const publicInvestment = observation({
      entry: entry({ contextId: "public.investment.capital.plan", category: "public_investment", subtype: "capital_improvement", supportedObservationMethods: ["capital_plan"] }),
      projectStatus: "approved",
      fundingState: "partially_funded",
      method: "capital_plan",
    });
    const permitTrend = observation({
      entry: entry({ contextId: "permit.activity.trend", category: "permitting", subtype: "permit_trend", supportedObservationMethods: ["permit_record"], supportedPermitStates: ["approved", "permit_issued", "permit_closed", "unknown"] }),
      projectStatus: "complete",
      permitState: "permit_issued",
      method: "permit_record",
      pipelineMetrics: { permitCount: 18, permitValue: 4_200_000, propertyTypeClass: "single_family", periodStart: "2026-01-01", periodEnd: "2026-06-30", noDoubleCountingBasis: "source_declared" },
    });

    expect(publicInvestment.explanationCodes).toEqual(expect.arrayContaining(["public_investment_reported", "public_investment_not_guarantee"]));
    expect(publicInvestment.sourceRecordId).toBe("capital-plan-record-1");
    expect(permitTrend.explanationCodes).toContain("permit_activity_changed");
    expect(permitTrend.pipelineMetrics?.permitCount).toBe(18);
    expect(permitTrend.pipelineMetrics?.noDoubleCountingBasis).toBe("source_declared");
  });

  it("preserves zoning, land-use, and annexation as legal/planning context only", () => {
    const zoning = observation({
      entry: entry({ contextId: "planning.zoning.change", category: "planning", subtype: "zoning_change", professionalBoundary: "planning_or_zoning_review" }),
      projectStatus: "under_review",
      approvalState: "under_review",
    });
    const annexation = observation({
      entry: entry({ contextId: "planning.annexation", category: "planning", subtype: "annexation", professionalBoundary: "attorney_review" }),
      projectStatus: "proposed",
      approvalState: "submitted",
    });

    expect(zoning.explanationCodes).toEqual(expect.arrayContaining(["zoning_change_proposed", "zoning_no_entitlement", "professional_review_recommended"]));
    expect(annexation.explanationCodes).toContain("annexation_proposed");
    expect(zoning.degradedStates).not.toContain("record_unavailable");
  });

  it("captures development pipeline metrics without double-counting status buckets", () => {
    const pipeline = observation({
      entry: entry({ contextId: "development.pipeline.residential", category: "pipeline", subtype: "development_pipeline", supportedObservationMethods: ["development_pipeline_record"] }),
      projectStatus: "under_construction",
      method: "development_pipeline_record",
      pipelineMetrics: {
        unitsProposed: 120,
        unitsApproved: 96,
        unitsUnderConstruction: 40,
        unitsDelivered: 18,
        commercialSqFt: 25000,
        propertyTypeClass: "mixed_use",
        periodStart: "2026-01-01",
        periodEnd: "2026-12-31",
        noDoubleCountingBasis: "status_partitioned",
      },
    });

    expect(pipeline.explanationCodes).toContain("development_pipeline_reported");
    expect(pipeline.pipelineMetrics).toMatchObject({
      unitsProposed: 120,
      unitsApproved: 96,
      unitsUnderConstruction: 40,
      unitsDelivered: 18,
      noDoubleCountingBasis: "status_partitioned",
    });
  });

  it("marks stale, unavailable, unknown, proxy, and missing timeline observations as degraded", () => {
    const stale = observation({ providerState: "offline", degradedStates: ["stale_prior_valid"] });
    const proxy = observation({
      geography: { geographyLevel: "unknown", geographyIdentity: "provider-proxy:future", relationship: "proxy" },
      timeline: { timelineKind: "unknown", projected: true, historical: false },
    });

    expect(stale.degradedStates).toEqual(expect.arrayContaining(["provider_unavailable", "stale_prior_valid"]));
    expect(stale.explanationCodes).toContain("timeline_stale");
    expect(proxy.degradedStates).toEqual(expect.arrayContaining(["timeline_unknown", "unsupported_geography"]));
  });

  it("creates blocked conflict manifests while retaining competing source evidence", () => {
    const sourceBacked = observation({ projectStatus: "approved", sourceRecordId: "authority-approved" });
    const conflicting = observation({ projectStatus: "cancelled", sourceRecordId: "provider-cancelled", degradedStates: ["conflicting_sources"] });
    const manifest = createMarketInfrastructureConflictManifest({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      conflictState: "project_status_disagreement",
      observations: [conflicting, sourceBacked],
      reasonCodes: ["conflicting_project_status"],
    });

    expect(manifest.contractVersion).toBe(MARKET_INFRASTRUCTURE_CONFLICT_CONTRACT_VERSION);
    expect(manifest.blockedUntilResolved).toBe(true);
    expect(manifest.observationIds).toEqual([conflicting.observationId, sourceBacked.observationId].sort());
    expect(manifest.projectReferences).toHaveLength(2);
  });

  it("projects findings only as underwriting and strategy proposal references", () => {
    const obs = observation({ projectStatus: "funded", fundingState: "funded", approvalState: "approved" });
    const finding = createMarketInfrastructureFinding({
      workspaceId: "workspace-1",
      propertyId: "property-1",
      dealId: "deal-1",
      findingType: "project_funded_not_started",
      sourceObservations: [obs],
      summaryCode: "funded_not_started",
      impactClass: "decision_context",
      confidence: "source_backed",
      verificationState: "source_backed",
      applicableStrategyReferences: ["owner_occupied_location_context", "long_term_hold_context"],
      assumptionProposalReferences: ["proposal:traffic-disruption-review"],
    });
    const projection = projectMarketInfrastructureFinding(finding);

    expect(finding.contractVersion).toBe(MARKET_INFRASTRUCTURE_FINDING_CONTRACT_VERSION);
    expect(finding.underwritingMutationAllowed).toBe(false);
    expect(finding.strategyRerankAllowed).toBe(false);
    expect(finding.recommendationMutationAllowed).toBe(false);
    expect(projection.contractVersion).toBe(MARKET_INFRASTRUCTURE_PROJECTION_CONTRACT_VERSION);
    expect(projection.assumptionProposalReferences).toEqual(["proposal:traffic-disruption-review"]);
  });

  it("keeps golden infrastructure fixtures deterministic and source-bound", () => {
    const fixtures = [
      observation(),
      observation({ projectStatus: "complete", timeline: { actualCompletion: "2026-06-30", retrievalTime: "2026-08-10", timelineKind: "actual_completion", projected: false, historical: true } }),
      observation({ projectStatus: "delayed", timeline: { expectedCompletion: "2026-01-01", retrievalTime: "2026-08-10", timelineKind: "expected_completion", projected: true, historical: false } }),
      observation({ projectStatus: "cancelled", timeline: { actualCompletion: "2026-02-01", retrievalTime: "2026-08-10", timelineKind: "actual_completion", projected: false, historical: true } }),
      observation({ entry: entry({ contextId: "public.investment.fixture", category: "public_investment", subtype: "capital_improvement" }) }),
      observation({ geography: { geographyLevel: "unknown", geographyIdentity: "proxy-market-area", relationship: "proxy" }, timeline: { timelineKind: "unknown", projected: true, historical: false } }),
    ];

    expect(fixtures).toHaveLength(6);
    expect(new Set(fixtures.map((item) => item.deterministicHash)).size).toBe(6);
    expect(fixtures.every((item) => item.contractVersion === MARKET_INFRASTRUCTURE_OBSERVATION_CONTRACT_VERSION)).toBe(true);
    expect(fixtures.every((item) => item.provenance.length > 0 || item.evidenceReference)).toBe(true);
    expect(fixtures.some((item) => item.degradedStates.includes("unsupported_geography"))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  assessCanonicalMarketMetricCompatibility,
  assertNoUnsupportedMarketConclusion,
  createCanonicalMarketConflict,
  createCanonicalMarketFinding,
  createCanonicalMarketMetric,
  createCanonicalMarketSnapshot,
  createMarketAssumptionProposalReference,
  projectCanonicalMarketSnapshot,
  type CanonicalMarketMetric,
  type MarketSnapshotGeography,
  type MarketSnapshotPeriod,
} from "../core/marketSnapshot";
import { createMarketProviderProvenance } from "../core/marketSourceIngestion";
import type { SourceEvidenceReference } from "../core/locationIdentity";

const scope = {
  workspaceId: "workspace-1",
  dealId: "deal-1",
  propertyId: "property-1",
};

const geography: MarketSnapshotGeography = {
  geographyLevel: "municipality",
  geographyIdentity: "municipality:shorewood-il",
  canonicalLocationId: "location-1",
  boundaryId: "shorewood-boundary",
  boundaryVersion: "2026",
  relationship: "containing_area",
  proxy: false,
};

const period: MarketSnapshotPeriod = {
  asOfDate: "2026-08-12",
  periodStart: "2026-01-01",
  periodEnd: "2026-12-31",
  periodLabel: "2026 current market",
  timeSemantics: "observed",
  historical: false,
  current: true,
  projected: false,
  inferred: false,
};

const evidence: SourceEvidenceReference = {
  sourceRecordId: "source-record-1",
  evidenceId: "evidence-1",
  sourceName: "County published market record",
  sourceUrl: "https://example.test/source",
  observedAt: "2026-08-01",
  effectiveAt: "2026-08-01",
};

const provenance = createMarketProviderProvenance({
  providerId: "public_authority",
  providerVersion: "2026.08",
  providerRecordReference: "public_authority:record-1",
  observationTime: "2026-08-01",
  effectiveTime: "2026-08-01",
  retrievalTime: "2026-08-12T12:00:00Z",
  verificationState: "source_backed",
  confidence: "source_backed",
  evidenceReference: evidence,
});

function metric(overrides: Partial<CanonicalMarketMetric> = {}) {
  return createCanonicalMarketMetric({
    ...scope,
    metricId: "metric-1",
    module: "growth",
    metricType: "population_trend",
    category: "population",
    geography,
    period,
    value: 1.8,
    unit: "percent",
    providerId: "public_authority",
    providerVersion: "2026.08",
    providerState: "healthy",
    sourceRecordId: "source-record-1",
    sourceRecordKey: "public_authority:source-record-1",
    evidenceReference: evidence,
    provenance: [provenance],
    observationTime: "2026-08-01",
    effectiveTime: "2026-08-01",
    publicationTime: "2026-08-02",
    retrievalTime: "2026-08-12T12:00:00Z",
    classification: "external_estimate",
    confidence: "source_backed",
    freshnessState: "current",
    verificationState: "source_backed",
    method: "source_reported",
    propertySegment: "single_family",
    temporalState: "current",
    limitations: [],
    sourceContractVersion: "market-growth-observation-v1",
    sourceRecordType: "market_growth_observation",
    sourceRecordHash: "source-hash-1",
    ...overrides,
  });
}

describe("canonical MarketIQ snapshot integration", () => {
  it("assembles a deterministic source-linked snapshot from canonical metrics and findings", () => {
    const growthMetric = metric();
    const proposal = createMarketAssumptionProposalReference({
      ...scope,
      proposalReferenceId: "proposal-1",
      proposalKind: "growth_assumption_review",
      sourceMetricIds: [growthMetric.metricId],
      targetSystem: "underwriting",
      targetField: "appreciation_assumption",
      status: "proposed",
      reevaluationTrigger: "targeted_underwriting",
    });
    const finding = createCanonicalMarketFinding({
      ...scope,
      findingId: "finding-1",
      findingType: "market_context",
      summaryCode: "population_trend_requires_assumption_review",
      impact: "assumption_review",
      severity: "watch",
      applicableStrategies: ["buy_and_hold"],
      supportingMetricIds: [growthMetric.metricId],
      supportingEvidenceReferences: [evidence],
      geography,
      timeframe: period,
      method: "deterministic_context_assembly",
      confidence: "source_backed",
      freshnessState: "current",
      verificationState: "source_backed",
      limitations: ["market_context_not_underwriting"],
      proposalReferences: [proposal],
      explanationCodes: ["source_backed_market_context"],
      sourceModule: "growth",
      sourceFindingId: "growth-finding-1",
      sourceFindingHash: "growth-hash-1",
    });

    const snapshot = createCanonicalMarketSnapshot({
      ...scope,
      snapshotId: "snapshot-1",
      canonicalLocationId: "location-1",
      geography,
      asOfDate: "2026-08-12",
      analysisPeriod: period,
      workflowVersion: "marketiq-workflow-v1",
      modelVersion: "marketiq-model-v1",
      createdAt: "2026-08-12T12:10:00Z",
      serverTimeSemantics: "server_supplied",
      metrics: [growthMetric],
      findings: [finding],
      conflicts: [],
      proposalReferences: [proposal],
    });

    const repeated = createCanonicalMarketSnapshot({
      ...scope,
      snapshotId: "snapshot-1",
      canonicalLocationId: "location-1",
      geography,
      asOfDate: "2026-08-12",
      analysisPeriod: period,
      workflowVersion: "marketiq-workflow-v1",
      modelVersion: "marketiq-model-v1",
      createdAt: "2026-08-12T12:10:00Z",
      serverTimeSemantics: "server_supplied",
      metrics: [growthMetric],
      findings: [finding],
      conflicts: [],
      proposalReferences: [proposal],
    });

    expect(snapshot.lifecycleState).toBe("current");
    expect(snapshot.confidence).toBe("source_backed");
    expect(snapshot.metricIds).toEqual(["metric-1"]);
    expect(snapshot.findingIds).toEqual(["finding-1"]);
    expect(snapshot.proposalReferenceIds).toEqual(["proposal-1"]);
    expect(snapshot.sourceRecordHashes).toEqual(["source-hash-1"]);
    expect(snapshot.moduleCoverage).toMatchObject([{ module: "growth", status: "available", metricCount: 1 }]);
    expect(snapshot.providerCoverage).toMatchObject([{ providerId: "public_authority", providerState: "healthy" }]);
    expect(snapshot.persistenceState).toBe("contract_only");
    expect(snapshot.materialHash).toBe(repeated.materialHash);
  });

  it("surfaces metric compatibility conflicts instead of resolving them silently", () => {
    const left = metric({ metricId: "metric-left", value: 1.8, method: "source_reported" });
    const right = metric({
      metricId: "metric-right",
      value: 2.4,
      method: "model_normalized",
      geography: { ...geography, geographyIdentity: "county:will-il", geographyLevel: "county" },
      period: { ...period, periodLabel: "2025 historical market", historical: true, current: false },
      classification: "system_estimate",
      propertySegment: "all_residential",
      sourceRecordKey: "public_authority:source-record-2",
    });

    expect(assessCanonicalMarketMetricCompatibility(left, right)).toEqual({
      compatible: false,
      conflictCategories: ["classification", "geography", "method", "period", "property_segment", "value"],
    });
  });

  it("preserves explicit conflict records as unresolved snapshot state", () => {
    const left = metric({ metricId: "metric-left", value: 1.8 });
    const right = metric({ metricId: "metric-right", value: 2.4, sourceRecordKey: "public_authority:source-record-2" });
    const conflict = createCanonicalMarketConflict({
      ...scope,
      conflictId: "conflict-1",
      conflictCategory: "value",
      materiality: "material",
      resolutionState: "unresolved",
      conflictingRecordReferences: [
        { recordId: "source-record-2", metricId: right.metricId, providerId: "public_authority", value: right.value },
        { recordId: "source-record-1", metricId: left.metricId, providerId: "public_authority", value: left.value },
      ],
      retainedValues: [left.value, right.value],
      explanationCodes: ["source_values_disagree"],
      geography,
      period,
    });

    const snapshot = createCanonicalMarketSnapshot({
      ...scope,
      snapshotId: "snapshot-conflicted",
      geography,
      asOfDate: "2026-08-12",
      analysisPeriod: period,
      workflowVersion: "marketiq-workflow-v1",
      modelVersion: "marketiq-model-v1",
      createdAt: "2026-08-12T12:10:00Z",
      serverTimeSemantics: "server_supplied",
      metrics: [right, left],
      findings: [],
      conflicts: [conflict],
    });

    expect(conflict.reviewRequired).toBe(true);
    expect(snapshot.lifecycleState).toBe("current_with_conflicts");
    expect(snapshot.conflictState).toBe("unresolved");
    expect(snapshot.conflictIds).toEqual(["conflict-1"]);
  });

  it("marks stale, provider-unavailable, and prior-retained states deterministically", () => {
    const staleSnapshot = createCanonicalMarketSnapshot({
      ...scope,
      snapshotId: "snapshot-stale",
      geography,
      asOfDate: "2026-08-12",
      analysisPeriod: period,
      workflowVersion: "marketiq-workflow-v1",
      modelVersion: "marketiq-model-v1",
      createdAt: "2026-08-12T12:10:00Z",
      serverTimeSemantics: "server_supplied",
      metrics: [metric({ freshnessState: "stale" })],
      findings: [],
      conflicts: [],
    });
    const unavailableSnapshot = createCanonicalMarketSnapshot({
      ...scope,
      snapshotId: "snapshot-unavailable",
      geography,
      asOfDate: "2026-08-12",
      analysisPeriod: period,
      workflowVersion: "marketiq-workflow-v1",
      modelVersion: "marketiq-model-v1",
      createdAt: "2026-08-12T12:10:00Z",
      serverTimeSemantics: "server_supplied",
      providerCoverage: [{
        providerId: "public_authority",
        providerState: "offline",
        modules: ["growth"],
        datasets: ["population_trend"],
        recordCount: 0,
        confidence: "unknown",
        freshnessState: "unavailable",
        limitations: ["provider_unavailable"],
      }],
      metrics: [],
      findings: [],
      conflicts: [],
      priorSnapshotId: "snapshot-prior",
    });

    expect(staleSnapshot.lifecycleState).toBe("stale");
    expect(unavailableSnapshot.lifecycleState).toBe("failed_with_prior_snapshot");
    expect(unavailableSnapshot.priorSnapshotRetained).toBe(true);
  });

  it("records missing-data findings without forcing users to re-enter accepted evidence", () => {
    const finding = createCanonicalMarketFinding({
      ...scope,
      findingId: "finding-missing-1",
      findingType: "missing_data",
      summaryCode: "hospital_access_metric_missing",
      impact: "verification_needed",
      severity: "material",
      applicableStrategies: ["owner_occupied"],
      supportingMetricIds: [],
      supportingEvidenceReferences: [],
      geography,
      timeframe: period,
      method: "module_gap_detection",
      confidence: "unknown",
      freshnessState: "unavailable",
      verificationState: "missing",
      limitations: [],
      proposalReferences: [],
      explanationCodes: ["source_missing"],
      sourceModule: "convenience",
    });
    const snapshot = createCanonicalMarketSnapshot({
      ...scope,
      snapshotId: "snapshot-missing",
      geography,
      asOfDate: "2026-08-12",
      analysisPeriod: period,
      workflowVersion: "marketiq-workflow-v1",
      modelVersion: "marketiq-model-v1",
      createdAt: "2026-08-12T12:10:00Z",
      serverTimeSemantics: "server_supplied",
      metrics: [],
      findings: [finding],
      conflicts: [],
    });

    expect(finding.limitations).toContain("insufficient_supporting_context");
    expect(snapshot.missingDataState).toBe("material_missing");
    expect(snapshot.lifecycleState).toBe("awaiting_verification");
  });

  it("creates downstream projections that cannot mutate underwriting or strategy assumptions", () => {
    const growthMetric = metric();
    const proposal = createMarketAssumptionProposalReference({
      ...scope,
      proposalReferenceId: "proposal-1",
      proposalKind: "growth_assumption_review",
      sourceMetricIds: [growthMetric.metricId],
      targetSystem: "strategy",
      targetField: "appreciation_assumption",
      status: "accepted",
      reevaluationTrigger: "targeted_strategy",
    });
    const finding = createCanonicalMarketFinding({
      ...scope,
      findingId: "finding-1",
      findingType: "strategy_impact_reference",
      summaryCode: "growth_context_changes_strategy_confidence",
      impact: "strategy_confidence_review",
      severity: "material",
      applicableStrategies: ["buy_and_hold", "flip"],
      supportingMetricIds: [growthMetric.metricId],
      supportingEvidenceReferences: [evidence],
      geography,
      timeframe: period,
      method: "deterministic_context_assembly",
      confidence: "source_backed",
      freshnessState: "current",
      verificationState: "source_backed",
      limitations: ["proposal_only"],
      proposalReferences: [proposal],
      explanationCodes: ["strategy_review_needed"],
      sourceModule: "growth",
    });
    const snapshot = createCanonicalMarketSnapshot({
      ...scope,
      snapshotId: "snapshot-1",
      geography,
      asOfDate: "2026-08-12",
      analysisPeriod: period,
      workflowVersion: "marketiq-workflow-v1",
      modelVersion: "marketiq-model-v1",
      createdAt: "2026-08-12T12:10:00Z",
      serverTimeSemantics: "server_supplied",
      metrics: [growthMetric],
      findings: [finding],
      conflicts: [],
      proposalReferences: [proposal],
    });

    const projection = projectCanonicalMarketSnapshot(snapshot, [finding], [proposal]);

    expect(proposal.underwritingMutationAllowed).toBe(false);
    expect(proposal.strategyMutationAllowed).toBe(false);
    expect(projection.underwritingMutationAllowed).toBe(false);
    expect(projection.strategyMutationAllowed).toBe(false);
    expect(projection.materialFindingIds).toEqual(["finding-1"]);
    expect(projection.proposalReferences).toMatchObject([{ status: "accepted", reevaluationTrigger: "targeted_strategy" }]);
  });

  it("blocks cross-workspace, cross-deal, and cross-property assembly", () => {
    expect(() =>
      createCanonicalMarketSnapshot({
        ...scope,
        snapshotId: "snapshot-scope",
        geography,
        asOfDate: "2026-08-12",
        analysisPeriod: period,
        workflowVersion: "marketiq-workflow-v1",
        modelVersion: "marketiq-model-v1",
        createdAt: "2026-08-12T12:10:00Z",
        serverTimeSemantics: "server_supplied",
        metrics: [metric({ workspaceId: "workspace-2" })],
        findings: [],
        conflicts: [],
      }),
    ).toThrow("different workspace");

    expect(() =>
      createCanonicalMarketSnapshot({
        ...scope,
        snapshotId: "snapshot-scope",
        geography,
        asOfDate: "2026-08-12",
        analysisPeriod: period,
        workflowVersion: "marketiq-workflow-v1",
        modelVersion: "marketiq-model-v1",
        createdAt: "2026-08-12T12:10:00Z",
        serverTimeSemantics: "server_supplied",
        metrics: [metric({ dealId: "deal-2" })],
        findings: [],
        conflicts: [],
      }),
    ).toThrow("different deal");

    expect(() =>
      createCanonicalMarketSnapshot({
        ...scope,
        snapshotId: "snapshot-scope",
        geography,
        asOfDate: "2026-08-12",
        analysisPeriod: period,
        workflowVersion: "marketiq-workflow-v1",
        modelVersion: "marketiq-model-v1",
        createdAt: "2026-08-12T12:10:00Z",
        serverTimeSemantics: "server_supplied",
        metrics: [metric({ propertyId: "property-2" })],
        findings: [],
        conflicts: [],
      }),
    ).toThrow("different property");
  });

  it("rejects unsupported broad market conclusions", () => {
    expect(() => assertNoUnsupportedMarketConclusion("This is a safe neighborhood")).toThrow("unsupported market conclusion");
    expect(() =>
      createCanonicalMarketFinding({
        ...scope,
        findingId: "finding-unsafe",
        findingType: "market_context",
        summaryCode: "good_schools_claim",
        impact: "decision_context",
        severity: "informational",
        applicableStrategies: [],
        supportingMetricIds: [],
        supportingEvidenceReferences: [],
        geography,
        timeframe: period,
        method: "unsupported_summary",
        confidence: "unknown",
        freshnessState: "unavailable",
        verificationState: "unknown",
        limitations: [],
        proposalReferences: [],
        explanationCodes: [],
      }),
    ).toThrow("unsupported market conclusion");
  });
});

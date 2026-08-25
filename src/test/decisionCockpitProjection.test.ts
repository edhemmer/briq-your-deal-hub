import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DECISION_COCKPIT_KEY_METRIC_REGISTRY_VERSION,
  DECISION_COCKPIT_CONFIDENCE_PANEL_CONTRACT_VERSION,
  DECISION_COCKPIT_MISSING_INPUT_PANEL_CONTRACT_VERSION,
  DECISION_COCKPIT_ACTIVE_NEXT_ACTION_CONTRACT,
  DECISION_COCKPIT_CHANGE_HISTORY_CONTRACT_VERSION,
  DECISION_COCKPIT_CHANGE_HISTORY_ORDERING_VERSION,
  DECISION_COCKPIT_CHANGE_HISTORY_REGISTRY_VERSION,
  DECISION_COCKPIT_DEADLINE_PANEL_CONTRACT_VERSION,
  DECISION_COCKPIT_NEXT_ACTION_CONTRACT_VERSION,
  DECISION_COCKPIT_PRIMARY_METRIC_LIMIT,
  DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION,
  DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION,
  DECISION_COCKPIT_RISK_PANEL_CONTRACT_VERSION,
  buildDecisionCockpitReadProjection,
  type DecisionCockpitChangeHistoryEntry,
  type DecisionCockpitDeadlineProjection,
  type DecisionCockpitMissingInputRecord,
  type DecisionCockpitNextActionProjection,
  type DecisionCockpitPriorPanelProjection,
  type DecisionCockpitRecommendationRecord,
  type DecisionCockpitRecommendedAction,
  type DecisionCockpitRiskRecord,
  type DecisionCockpitUserDecisionRecord,
} from "../core/decisionCockpitProjection";
import type { DealWorkItem } from "../core/types";
import { STRATEGY_PRESENTATION_CONTRACT_VERSION, type StrategyPresentationModel } from "../core/strategyPresentation";
import {
  UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
  type UnderwritingPresentationInputRow,
  type UnderwritingPresentationOutputRow,
  type UnderwritingPresentationModel,
} from "../core/underwritingPresentation";
import {
  UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
  UNDERWRITING_REPORT_CONTRACT_VERSION,
  type UnderwritingReportPayload,
} from "../core/underwritingReportContract";
import {
  DECISION_COCKPIT_DESTINATION_CONTRACT_VERSION,
  DECISION_COCKPIT_ROUTE_REGISTRY,
  resolveDecisionCockpitDestination,
} from "../core/decisionCockpitDestinations";

describe("decision cockpit read projection contract", () => {
  it("returns an empty read projection without fabricating underwriting, strategy, or report data", () => {
    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-empty",
      dealName: "Empty Deal",
    });

    expect(projection.contractVersion).toBe(DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION);
    expect(projection.freshness.state).toBe("no_source_results");
    expect(projection.underwriting.available).toBe(false);
    expect(projection.underwriting.coreOutputCount).toBe(0);
    expect(projection.strategy.available).toBe(false);
    expect(projection.strategy.rankedStrategies).toEqual([]);
    expect(projection.report.available).toBe(false);
    expect(projection.sourceBoundary).toMatchObject({
      recalculationProhibited: true,
      rankingMutationProhibited: true,
      recommendationMutationProhibited: true,
      persistenceProhibited: true,
      providerCallsProhibited: true,
      recommendationEngineNotImplementedHere: true,
      metricSelectionOnly: true,
    });
  });

  it("aggregates existing underwriting, strategy, and report projections without changing their values", () => {
    const underwriting = underwritingPresentation();
    const strategy = strategyPresentation();
    const report = underwritingReport();

    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      dealName: "1615 Augusta",
      property: {
        propertyId: "property-1",
        displayName: "1615 Augusta Ln",
        address: "1615 Augusta Ln, Shorewood, IL 60404",
        propertyType: "single_family",
      },
      underwriting,
      strategy,
      report,
      generatedAt: "2026-08-04T12:00:00.000Z",
    });

    expect(projection.freshness.state).toBe("current");
    expect(projection.underwriting).toMatchObject({
      contractVersion: UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
      available: true,
      readinessLabel: "Decision Ready",
      coreOutputGroupCount: 1,
      coreOutputCount: 1,
      scenarioCount: 1,
      sensitivityCount: 1,
    });
    expect(projection.strategy).toMatchObject({
      contractVersion: STRATEGY_PRESENTATION_CONTRACT_VERSION,
      available: true,
      rankingId: "ranking-1",
      rankingHash: "ranking-hash-1",
      topRankedViable: {
        strategyId: "owner_occupied",
        displayName: "Owner Occupied",
        rank: 1,
      },
    });
    expect(projection.confidence.primaryLabel).toBe("High");
    expect(projection.report).toMatchObject({
      available: true,
      contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
      registryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
      reportType: "underwriting_summary",
      contentHash: "report-content-hash",
    });
    expect(projection.underwriting.outputs).toBe(underwriting.coreOutputGroups);
    expect(projection.strategy.rankedStrategies).toBe(strategy.rankedStrategies);
    expect(projection.report.sectionCount).toBe(1);
    expect(projection.changeHistory.contractVersion).toBe(DECISION_COCKPIT_CHANGE_HISTORY_CONTRACT_VERSION);
    expect(projection.changeHistory.registryVersion).toBe(DECISION_COCKPIT_CHANGE_HISTORY_REGISTRY_VERSION);
    expect(projection.changeHistory.orderingVersion).toBe(DECISION_COCKPIT_CHANGE_HISTORY_ORDERING_VERSION);
  });

  it("projects deterministic change history from canonical underwriting, strategy, recommendation, risk, missing-input, and report sources", () => {
    const recommendation = recommendationRecord({
      recommendationId: "recommendation-current",
      recommendationState: "prepare_offer",
      asOf: "2026-08-04T12:20:00.000Z",
    });
    const priorRecommendation = recommendationRecord({
      recommendationId: "recommendation-prior",
      recommendationState: "monitor",
      asOf: "2026-08-04T11:00:00.000Z",
    });
    const strategy = strategyPresentation({
      stale: true,
      professionalReviewCount: 1,
      selectedStrategyId: "brrrr",
      history: [{
        resultId: "strategy-history-1",
        strategyId: "owner_occupied",
        strategyVersion: "1.0.0",
        displayName: "Owner Occupied",
        createdAt: "2026-08-04T11:10:00.000Z",
        snapshotId: "snapshot-prior",
        underwritingRunId: "run-prior",
        rank: 1,
        score: 80,
        compatibilityStatus: "compatible",
        confidenceLabel: "Moderate",
        freshnessState: "historical",
        hash: "strategy-history-hash-1",
        readOnly: true,
      }],
    });
    const underwriting = underwritingPresentation({
      inputs: [
        underwritingInput({
          inputId: "monthly_rent",
          label: "Monthly rent",
          requirement: "Required",
          status: "Accepted assumption",
          sourceState: "Accepted assumption",
          stableOrdinal: 10,
        }),
        underwritingInput({
          inputId: "purchase_price",
          label: "Purchase price",
          requirement: "Required",
          status: "Rejected assumption",
          sourceState: "Rejected assumption",
          stableOrdinal: 20,
        }),
      ],
      snapshots: [
        {
          snapshotId: "snapshot-2",
          sequence: 2,
          readiness: "Decision Ready",
          executable: true,
          createdAt: "2026-08-04T12:15:00.000Z",
          reason: "Inputs changed",
          inputCount: 11,
          changedInputIds: ["monthly_rent"],
          changedFormulaIds: ["cash_on_cash_return"],
          contentHash: "snapshot-hash-2",
        },
        {
          snapshotId: "snapshot-1",
          sequence: 1,
          readiness: "Decision Ready",
          executable: true,
          createdAt: "2026-08-04T11:15:00.000Z",
          reason: "Initial underwriting run",
          inputCount: 10,
          changedInputIds: [],
          changedFormulaIds: [],
          contentHash: "snapshot-hash-1",
        },
      ],
      scenarios: [{
        scenarioId: "scenario-2",
        name: "Stress Case",
        type: "Stress",
        status: "Complete",
        readiness: "Executable",
        changedInputCount: 3,
        changedOutputCount: 2,
        warnings: [],
        comparisonRows: [],
      }],
      sensitivities: [{
        sensitivityId: "sensitivity-2",
        inputId: "monthly_rent",
        inputLabel: "Monthly rent",
        status: "Complete",
        pointCount: 5,
        targetFormulaIds: ["cash_on_cash_return"],
        points: [],
      }],
    });

    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      underwriting,
      strategy,
      recommendation,
      priorValidRecommendation: priorRecommendation,
      report: underwritingReport({ contentHash: "report-content-hash-2", requestedAt: "2026-08-04T12:25:00.000Z" }),
      riskRecords: [
        riskRecord({ riskId: "risk-current", stableOrdinal: 10, category: "confirmed_material_risk" }),
        riskRecord({ riskId: "risk-superseded", stableOrdinal: 20, currentState: "stale", staleState: "stale" }),
      ],
      missingInputRecords: [
        missingInputRecord({ missingInputId: "missing-resolved", status: "accepted", stableOrdinal: 5 }),
        missingInputRecord({ missingInputId: "missing-open", status: "missing", stableOrdinal: 6 }),
      ],
      generatedAt: "2026-08-04T13:00:00.000Z",
    });
    const eventTypes = projection.changeHistory.items.map((item) => item.eventType);

    expect(projection.changeHistory.sourceBoundary).toEqual({
      canonicalSourcesOnly: true,
      noUiDerivedHistory: true,
      noAiSummaries: true,
      noWritesOnRead: true,
      noProviderCalls: true,
      explanationEngineReused: true,
    });
    expect(eventTypes).toEqual(expect.arrayContaining([
      "recommendation_changed",
      "strategy_ranking_changed",
      "compatibility_changed",
      "confidence_changed",
      "underwriting_rerun",
      "scenario_rerun",
      "sensitivity_rerun",
      "missing_input_resolved",
      "risk_introduced",
      "risk_removed",
      "assumption_accepted",
      "assumption_rejected",
      "professional_review_required",
      "report_regenerated",
      "targeted_reevaluation",
    ]));
    expect(projection.changeHistory.items[0]).toMatchObject({
      eventType: "report_regenerated",
      sourceId: "report-content-hash-2",
      timestamp: "2026-08-04T12:25:00.000Z",
    });
    expect(projection.changeHistory.items.find((item) => item.eventType === "recommendation_changed")).toMatchObject({
      previousStateReference: "recommendation-prior",
      newStateReference: "recommendation-current",
      recommendationReference: "recommendation-current",
      supersededState: "supersedes_prior",
    });
    expect(projection.changeHistory.items.find((item) => item.sourceId === "snapshot-1")).toMatchObject({
      eventType: "underwriting_rerun",
      historyState: "historical",
      supersededState: "superseded",
    });
    expect(projection.changeHistory.items.find((item) => item.sourceId === "risk-superseded")).toMatchObject({
      eventType: "risk_removed",
      historyState: "superseded",
    });
    expect(projection.changeHistory.items.find((item) => item.sourceId === "strategy-history-1")).toMatchObject({
      sourceType: "strategy_result",
      historyState: "superseded",
    });
    expect(projection.changeHistory.groups.every((group) => group.itemCount > 0)).toBe(true);
    expect(projection.changeHistory.items.every((item) => item.deterministicHash.startsWith("dc_"))).toBe(true);
  });

  it("keeps change-history ordering and hashes reproducible across input order and render time", () => {
    const left = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      underwriting: underwritingPresentation(),
      strategy: strategyPresentation(),
      recommendation: recommendationRecord(),
      riskRecords: [
        riskRecord({ riskId: "risk-b", stableOrdinal: 20 }),
        riskRecord({ riskId: "risk-a", stableOrdinal: 10 }),
      ],
      generatedAt: "2026-08-04T12:00:00.000Z",
    });
    const right = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      underwriting: underwritingPresentation(),
      strategy: strategyPresentation(),
      recommendation: recommendationRecord(),
      riskRecords: [
        riskRecord({ riskId: "risk-a", stableOrdinal: 10 }),
        riskRecord({ riskId: "risk-b", stableOrdinal: 20 }),
      ],
      generatedAt: "2026-08-04T12:30:00.000Z",
    });

    expect(stripEventReasons(left.changeHistory.items)).toEqual(stripEventReasons(right.changeHistory.items));
    expect(left.changeHistory.manifestHash).toBe(right.changeHistory.manifestHash);
  });

  it("filters protected change history by cockpit permissions without leaking source records", () => {
    const denied = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      underwriting: underwritingPresentation(),
      strategy: strategyPresentation(),
      recommendation: recommendationRecord(),
      riskRecords: [riskRecord()],
      missingInputRecords: [missingInputRecord({ status: "accepted" })],
      report: underwritingReport(),
      authorization: {
        canReadCockpit: false,
        canReadRecommendation: false,
        canReadMetrics: false,
        canReadUserDecision: false,
        canReadRisks: false,
        canReadConfidence: false,
        canReadMissingInputs: false,
        canReadActions: false,
        canReadDeadlines: false,
      },
    });
    const partial = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      underwriting: underwritingPresentation(),
      strategy: strategyPresentation(),
      recommendation: recommendationRecord(),
      riskRecords: [riskRecord()],
      missingInputRecords: [missingInputRecord({ status: "accepted" })],
      report: underwritingReport(),
      authorization: {
        canReadCockpit: true,
        canReadRecommendation: false,
        canReadMetrics: false,
        canReadUserDecision: false,
        canReadRisks: false,
        canReadConfidence: false,
        canReadMissingInputs: false,
        canReadActions: false,
        canReadDeadlines: false,
      },
    });

    expect(denied.changeHistory).toMatchObject({
      state: "permission_restricted",
      itemCount: 0,
      items: [],
    });
    expect(partial.changeHistory.items).toEqual([]);
    expect(partial.changeHistory.state).toBe("unavailable");
  });

  it("does not turn the strongest ranked strategy into a recommendation when no canonical recommendation exists", () => {
    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting: underwritingPresentation(),
      strategy: strategyPresentation(),
    });

    expect(projection.strongestSystemRankedStrategy).toMatchObject({
      strategyId: "owner_occupied",
      scoreResultId: "score-1",
    });
    expect(projection.recommendation).toMatchObject({
      contractVersion: DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION,
      available: false,
      state: "unavailable",
      status: "unavailable",
      displayLabel: "No canonical recommendation available",
    });
    expect(projection.recommendedAction).toBeUndefined();
    expect(projection.userDecision).toMatchObject({
      available: false,
      relationToRecommendation: "none",
      relationToStrongestStrategy: "none",
    });
  });

  it("keeps recommendation, intended strategy, strongest strategy, and user decision distinct", () => {
    const intendedStrategy = {
      strategyId: "long_term_rental",
      strategyVersion: "1.0.0",
      displayName: "Long-Term Rental",
      acknowledgementRequired: true,
      compatibilityStatus: "compatible_with_conditions" as const,
    };
    const recommendation = recommendationRecord({
      recommendationState: "proceed_with_conditions",
      selectedStrategyId: "long_term_rental",
      selectedStrategyVersion: "1.0.0",
      strongestStrategyResultId: "score-1",
      recommendedAction: recommendedAction(),
    });
    const userDecision = userDecisionRecord({
      decisionType: "prepare_offer",
      relatedRecommendationId: "recommendation-1",
      selectedStrategyId: "long_term_rental",
      selectedStrategyVersion: "1.0.0",
    });

    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting: underwritingPresentation(),
      strategy: strategyPresentation({
        userPreference: intendedStrategy,
        userSelectionMatchesSystemRank: false,
      }),
      intendedStrategy,
      recommendation,
      userDecision,
    });

    expect(projection.strategy.intendedStrategy?.strategyId).toBe("long_term_rental");
    expect(projection.strategy.userSelectionMatchesSystemRank).toBe(false);
    expect(projection.strongestSystemRankedStrategy?.strategyId).toBe("owner_occupied");
    expect(projection.recommendation).toMatchObject({
      available: true,
      recommendationId: "recommendation-1",
      state: "proceed_with_conditions",
      status: "current_with_warnings",
      displayLabel: "Proceed With Conditions",
      sourceIdentity: {
        strongestStrategyResultId: "score-1",
        selectedStrategyId: "long_term_rental",
        selectedStrategyVersion: "1.0.0",
      },
    });
    expect(projection.recommendedAction).toMatchObject({
      actionType: "prepare_offer",
      workflowAvailability: "available",
    });
    expect(projection.userDecision).toMatchObject({
      available: true,
      relationToRecommendation: "matches_recommendation",
      relationToStrongestStrategy: "differs_from_strongest_strategy",
    });
  });

  it("keeps intended strategy separate from the top ranked viable strategy", () => {
    const strategy = strategyPresentation({
      userPreference: {
        strategyId: "long_term_rental",
        strategyVersion: "1.0.0",
        displayName: "Long-Term Rental",
        acknowledgementRequired: true,
        compatibilityStatus: "compatible_with_conditions",
      },
      userSelectionMatchesSystemRank: false,
    });

    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      strategy,
    });

    expect(projection.strategy.intendedStrategy?.strategyId).toBe("long_term_rental");
    expect(projection.strategy.topRankedViable?.strategyId).toBe("owner_occupied");
    expect(projection.strategy.userSelectionMatchesSystemRank).toBe(false);
  });

  it("surfaces stale or failed recommendation state with prior valid recommendation without replacing it", () => {
    const current = recommendationRecord({
      recommendationId: "recommendation-current",
      recommendationState: "visit",
      recommendationStatus: "failed_with_prior_valid",
      freshnessState: "failed_with_prior_valid",
      deterministicHash: "current-hash",
    });
    const prior = recommendationRecord({
      recommendationId: "recommendation-prior",
      recommendationState: "monitor",
      recommendationStatus: "current",
      freshnessState: "current",
      deterministicHash: "prior-hash",
      asOf: "2026-08-04T11:00:00.000Z",
    });

    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting: underwritingPresentation(),
      strategy: strategyPresentation({ stale: true }),
      recommendation: current,
      priorValidRecommendation: prior,
    });

    expect(projection.recommendation).toMatchObject({
      available: true,
      recommendationId: "recommendation-current",
      status: "failed_with_prior_valid",
      deterministicHash: "current-hash",
      priorValid: {
        recommendationId: "recommendation-prior",
        state: "monitor",
        status: "current",
        deterministicHash: "prior-hash",
      },
    });
    expect(projection.freshness.state).toBe("stale");
    expect(projection.rationale.reasons.some((reason) => reason.category === "prior_valid")).toBe(true);
  });

  it("selects key metrics only from canonical underwriting rows and preserves lineage, warnings, and negative values", () => {
    const underwriting = underwritingPresentation({
      outputs: [
        outputRow({
          formulaId: "down_payment_amount",
          label: "Down payment",
          value: "$200,000",
          group: "acquisition",
          stableOrdinal: 1,
          unit: "Currency",
          technicalReferences: ["hash:down-payment-hash", "result:down-payment-result"],
        }),
        outputRow({
          formulaId: "net_operating_income",
          label: "NOI",
          value: "$36,000",
          group: "income",
          stableOrdinal: 2,
        }),
        outputRow({
          formulaId: "pre_tax_cash_flow",
          label: "Annual cash flow",
          value: "-$2,400",
          group: "operating_performance",
          stableOrdinal: 3,
          warnings: ["Debt service exceeds operating income in the stress view"],
        }),
        outputRow({
          formulaId: "capitalization_rate",
          label: "Cap rate",
          value: "5.8%",
          group: "returns",
          stableOrdinal: 4,
          unit: "Percentage",
        }),
        outputRow({
          formulaId: "cash_on_cash_return",
          label: "Cash-on-cash return",
          value: "-1.2%",
          group: "returns",
          stableOrdinal: 5,
          unit: "Percentage",
          assumptions: ["Rent remains at listing-supported estimate"],
        }),
      ],
    });

    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting,
      strategy: strategyPresentation(),
      report: underwritingReport(),
    });

    expect(projection.keyMetrics.registryVersion).toBe(DECISION_COCKPIT_KEY_METRIC_REGISTRY_VERSION);
    expect(projection.keyMetrics.primaryLimit).toBe(DECISION_COCKPIT_PRIMARY_METRIC_LIMIT);
    expect(projection.keyMetrics.metrics.map((metric) => metric.metricId)).toEqual([
      "cash_required",
      "noi",
      "annual_cash_flow",
      "cap_rate",
      "cash_on_cash",
    ]);
    expect(projection.keyMetrics.unavailable).toContainEqual(expect.objectContaining({
      metricId: "loan_amount",
      reason: "formula_not_in_active_outputs",
    }));
    expect(projection.keyMetrics.metrics[0]).toMatchObject({
      metricId: "cash_required",
      canonicalResultReference: "down-payment-hash",
      displayValue: "$200,000",
      currency: "USD",
      lineageReference: {
        formulaId: "down_payment_amount",
        formulaVersion: "1.0.0",
        formulaRegistryVersion: "formula-registry-v1",
        technicalReferences: ["hash:down-payment-hash", "result:down-payment-result"],
      },
    });
    expect(projection.keyMetrics.metrics.find((metric) => metric.metricId === "annual_cash_flow")).toMatchObject({
      displayValue: "-$2,400",
      warningIndicator: true,
    });
    expect(projection.keyMetrics.metrics.find((metric) => metric.metricId === "cash_on_cash")).toMatchObject({
      displayValue: "-1.2%",
      assumptionIndicator: true,
    });
  });

  it("keeps key metric projection hashes stable across projection generation times", () => {
    const underwriting = underwritingPresentation({
      outputs: [
        outputRow({
          formulaId: "cash_on_cash_return",
          label: "Cash-on-cash return",
          value: "8.2%",
          group: "returns",
          stableOrdinal: 1,
          technicalReferences: ["hash:cash-on-cash-hash"],
        }),
      ],
    });
    const left = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting,
      generatedAt: "2026-08-04T12:00:00.000Z",
    });
    const right = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting,
      generatedAt: "2026-08-04T12:30:00.000Z",
    });

    expect(left.keyMetrics.selectionHash).toBe(right.keyMetrics.selectionHash);
    expect(left.keyMetrics.metrics[0]?.projectionHash).toBe(right.keyMetrics.metrics[0]?.projectionHash);
  });

  it("returns permission-restricted recommendation, user decision, and metrics without leaking protected data", () => {
    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting: underwritingPresentation(),
      strategy: strategyPresentation(),
      recommendation: recommendationRecord(),
      userDecision: userDecisionRecord(),
      authorization: {
        canReadCockpit: true,
        canReadRecommendation: false,
        canReadMetrics: false,
        canReadUserDecision: false,
        reason: "membership revoked",
      },
    });

    expect(projection.recommendation).toMatchObject({
      available: false,
      status: "permission_restricted",
      state: "unavailable",
    });
    expect(projection.recommendedAction).toBeUndefined();
    expect(projection.userDecision).toMatchObject({
      available: false,
      relationToRecommendation: "none",
      relationToStrongestStrategy: "none",
    });
    expect(projection.keyMetrics.metrics).toEqual([]);
    expect(projection.keyMetrics.unavailable).toHaveLength(DECISION_COCKPIT_PRIMARY_METRIC_LIMIT);
    expect(projection.rationale.reasons).toEqual([]);
  });

  it("projects only supplied partial module availability and does not fabricate unavailable modules", () => {
    const empty = buildDecisionCockpitReadProjection({ dealId: "deal-empty" });
    const partial = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      moduleAvailability: [
        { moduleId: "MarketIQ", status: "unavailable_module", reason: "No canonical market result is attached." },
        { moduleId: "inspection", status: "available" },
      ],
    });

    expect(empty.partialModules).toEqual({ materialUnavailableCount: 0, modules: [] });
    expect(partial.partialModules).toMatchObject({
      materialUnavailableCount: 1,
      modules: [
        { moduleId: "MarketIQ", status: "unavailable_module" },
        { moduleId: "inspection", status: "available" },
      ],
    });
  });

  it("surfaces stale state, warnings, assumptions, provenance, and professional review flags from source projections", () => {
    const underwriting = underwritingPresentation({
      blockedReasons: ["Insurance quote missing"],
      sourceWarnings: ["Rent support is preliminary"],
    });
    const strategy = strategyPresentation({
      stale: true,
      professionalReviewCount: 2,
    });

    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting,
      strategy,
    });

    expect(projection.freshness.state).toBe("stale");
    expect(projection.freshness.reevaluationRequired).toBe(true);
    expect(projection.freshness.staleEventCount).toBe(1);
    expect(projection.warnings.underwriting).toContain("Insurance quote missing");
    expect(projection.warnings.sources).toContain("Rent support is preliminary");
    expect(projection.assumptions).toEqual({ count: 1, items: ["Projected monthly rent"] });
    expect(projection.provenance.sourceCount).toBe(1);
    expect(projection.professionalReviewFlags).toEqual({
      count: 4,
      strategyFlags: [
        { strategyId: "owner_occupied", displayName: "Owner Occupied", count: 2 },
        { strategyId: "brrrr", displayName: "BRRRR", count: 2 },
      ],
    });
  });

  it("projects canonical risk records with deterministic ordering, grouping, duplicate elimination, and stable hashes", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      riskRecords: [
        riskRecord({ riskId: "risk-duplicate", stableOrdinal: 30, category: "potential_concern", severity: "unknown" }),
        riskRecord({ riskId: "risk-duplicate", stableOrdinal: 40, category: "confirmed_material_risk", severity: "high" }),
        riskRecord({ riskId: "risk-hard", stableOrdinal: 10, category: "hard_disqualifier", severity: "critical" }),
        riskRecord({ riskId: "risk-info", stableOrdinal: 50, category: "informational_observation", severity: "low" }),
        riskRecord({ riskId: "risk-other-workspace", workspaceId: "workspace-2", stableOrdinal: 1 }),
        riskRecord({ riskId: "risk-conflict", stableOrdinal: 20, category: "conflicting_evidence", severity: "unknown" }),
      ],
      generatedAt: "2026-08-04T12:00:00.000Z",
    });
    const sameProjection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      riskRecords: [
        riskRecord({ riskId: "risk-conflict", stableOrdinal: 20, category: "conflicting_evidence", severity: "unknown" }),
        riskRecord({ riskId: "risk-hard", stableOrdinal: 10, category: "hard_disqualifier", severity: "critical" }),
        riskRecord({ riskId: "risk-duplicate", stableOrdinal: 30, category: "potential_concern", severity: "unknown" }),
        riskRecord({ riskId: "risk-info", stableOrdinal: 50, category: "informational_observation", severity: "low" }),
      ],
      generatedAt: "2026-08-04T12:30:00.000Z",
    });

    expect(projection.risks.contractVersion).toBe(DECISION_COCKPIT_RISK_PANEL_CONTRACT_VERSION);
    expect(projection.risks.items.map((item) => item.riskId)).toEqual(["risk-hard", "risk-conflict", "risk-duplicate", "risk-info"]);
    expect(projection.risks.items.find((item) => item.riskId === "risk-conflict")).toMatchObject({
      category: "conflicting_evidence",
      severity: "unknown",
      group: "moderate",
      sourceBoundary: {
        clientGeneratedRiskProhibited: true,
        severityInferenceProhibited: true,
      },
    });
    expect(projection.risks.groups).toEqual([
      { group: "blocking", itemCount: 1 },
      { group: "moderate", itemCount: 2 },
      { group: "informational", itemCount: 1 },
    ]);
    expect(projection.risks.panelHash).toBe(sameProjection.risks.panelHash);
    expect(projection.risks.sourceBoundary).toMatchObject({
      canonicalRiskRecordsOnly: true,
      clientGeneratedRiskProhibited: true,
      severityInferenceProhibited: true,
      absenceDoesNotMeanLowRisk: true,
    });
  });

  it("preserves prior valid risk projections during processing and does not hide risks while new records are processing", () => {
    const priorValid = {
      state: "current" as const,
      itemCount: 1,
      panelHash: "prior-risk-panel-hash",
      generatedAt: "2026-08-04T11:00:00.000Z",
      items: [{
        ...riskRecord({ riskId: "prior-risk", stableOrdinal: 1, category: "confirmed_material_risk", severity: "high" }),
        group: "material" as const,
        displayLabel: "Confirmed Material Risk",
        sourceBoundary: {
          clientGeneratedRiskProhibited: true as const,
          severityInferenceProhibited: true as const,
        },
      }],
    };
    const withCurrent = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      riskPanelState: "processing",
      priorValidRiskPanel: priorValid,
      riskRecords: [riskRecord({ riskId: "current-risk", stableOrdinal: 1, category: "missing_evidence", severity: "unknown" })],
    });
    const withPriorOnly = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      riskPanelState: "failed",
      priorValidRiskPanel: priorValid,
    });

    expect(withCurrent.risks.state).toBe("processing");
    expect(withCurrent.risks.items.map((item) => item.riskId)).toEqual(["current-risk"]);
    expect(withCurrent.risks.priorValid?.panelHash).toBe("prior-risk-panel-hash");
    expect(withPriorOnly.risks.state).toBe("failed");
    expect(withPriorOnly.risks.items.map((item) => item.riskId)).toEqual(["prior-risk"]);
  });

  it("projects confidence only from Strategy Intelligence evidence quality and flags completeness and professional review needs", () => {
    const projection = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting: underwritingPresentation(),
      strategy: strategyPresentation({
        selectedStrategyId: "brrrr",
        professionalReviewCount: 2,
        selectedStrategyOverrides: {
          confidenceLabel: "Moderate",
          confidenceDescription: "Source quality is mixed.",
          acceptedAssumptionCount: 2,
          preliminaryAssumptionCount: 1,
          missingDependencyCount: 3,
        },
      }),
    });

    expect(projection.confidence).toMatchObject({
      contractVersion: DECISION_COCKPIT_CONFIDENCE_PANEL_CONTRACT_VERSION,
      state: "current",
      primaryLabel: "Moderate",
      primaryDescription: "Source quality is mixed.",
      sourceModule: "Strategy Intelligence",
      evidenceQualityState: "Moderate",
      evidenceCompletenessState: "incomplete",
      acceptedAssumptionCount: 2,
      preliminaryAssumptionCount: 1,
      missingDependencyCount: 3,
      professionalReviewRequired: true,
      professionalReviewCount: 2,
      sourceIdentity: {
        selectedStrategyId: "brrrr",
        selectedStrategyVersion: "1.0.0",
        scoreResultId: "score-2",
      },
    });
    expect(projection.confidence.deterministicHash).toMatch(/^dc_/);
    expect(projection.recommendation.available).toBe(false);
  });

  it("projects missing inputs from canonical underwriting and strategy sources without changing recommendations", () => {
    const recommendation = recommendationRecord();
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      underwriting: underwritingPresentation({
        inputs: [
          underwritingInput({ inputId: "monthly_rent", label: "Monthly rent", requirement: "Required", sourceState: "Missing", status: "Missing", stableOrdinal: 20 }),
          underwritingInput({ inputId: "taxes", label: "Property taxes", requirement: "Required", sourceState: "Complete", status: "Invalid", stableOrdinal: 10 }),
          underwritingInput({ inputId: "insurance", label: "Insurance", requirement: "Optional", sourceState: "Complete", status: "Valid", needsAttention: false, stableOrdinal: 30 }),
        ],
      }),
      strategy: strategyPresentation({
        selectedStrategyId: "brrrr",
        selectedStrategyOverrides: {
          missingDependencyCount: 1,
        },
      }),
      missingInputRecords: [
        missingInputRecord({ missingInputId: "market:rent-comps", category: "market", importance: "material", stableOrdinal: 5 }),
        missingInputRecord({ missingInputId: "other-workspace", workspaceId: "workspace-2", stableOrdinal: 1 }),
      ],
      recommendation,
    });

    expect(projection.missingInputs.contractVersion).toBe(DECISION_COCKPIT_MISSING_INPUT_PANEL_CONTRACT_VERSION);
    expect(projection.missingInputs.items.map((item) => item.missingInputId)).toEqual([
      "underwriting:taxes",
      "underwriting:monthly_rent",
      "market:rent-comps",
      "strategy:brrrr:1",
    ]);
    expect(projection.missingInputs).toMatchObject({
      state: "current",
      itemCount: 4,
      blockingCount: 2,
      categories: [
        { category: "underwriting", itemCount: 2 },
        { category: "market", itemCount: 1 },
        { category: "strategy", itemCount: 1 },
      ],
      sourceBoundary: {
        canonicalMissingInputsOnly: true,
        missingInformationIsNotEvidence: true,
        recommendationMutationProhibited: true,
      },
    });
    expect(projection.missingInputs.items.find((item) => item.missingInputId === "underwriting:taxes")).toMatchObject({
      status: "needs_review",
      blocking: true,
      requiredWorkflowRef: "underwriting:inputs:taxes",
    });
    expect(projection.recommendation.recommendationId).toBe(recommendation.recommendationId);
    expect(projection.recommendation.deterministicHash).toBe(buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      recommendation,
    }).recommendation.deterministicHash);
  });

  it("handles unavailable, partial, stale, failed, and permission-restricted panel states without fabricating data", () => {
    const unavailable = buildDecisionCockpitReadProjection({ dealId: "deal-empty" });
    const partial = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      underwriting: underwritingPresentation({ blockedReasons: ["Required insurance input missing"] }),
    });
    const stale = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      strategy: strategyPresentation({ stale: true }),
    });
    const permission = buildDecisionCockpitReadProjection({
      dealId: "deal-1",
      riskRecords: [riskRecord()],
      missingInputRecords: [missingInputRecord()],
      authorization: {
        canReadCockpit: true,
        canReadRecommendation: true,
        canReadMetrics: true,
        canReadUserDecision: true,
        canReadRisks: false,
        canReadConfidence: false,
        canReadMissingInputs: false,
        reason: "membership revoked",
      },
    });

    expect(unavailable.risks.state).toBe("unavailable");
    expect(unavailable.missingInputs.state).toBe("unavailable");
    expect(partial.risks.state).toBe("partial");
    expect(partial.missingInputs.state).toBe("partial");
    expect(stale.confidence.state).toBe("stale");
    expect(permission.risks).toMatchObject({ state: "permission_restricted", items: [] });
    expect(permission.confidence).toMatchObject({ state: "permission_restricted" });
    expect(permission.confidence.primaryLabel).toBeUndefined();
    expect(permission.missingInputs).toMatchObject({ state: "permission_restricted", items: [] });
  });

  it("does not import or call calculators, rankers, UI, Supabase, providers, or persistence paths", () => {
    const source = readFileSync("src/core/decisionCockpitProjection.ts", "utf8");

    expect(source).not.toMatch(/from "\.\/underwritingCoreOutputs"/);
    expect(source).not.toMatch(/from "\.\/underwritingScenarios"/);
    expect(source).not.toMatch(/from "\.\/strategyScoring"/);
    expect(source).not.toMatch(/from "\.\/strategyCompatibility"/);
    expect(source).not.toMatch(/from "\.\/strategyExplanation"/);
    expect(source).not.toMatch(/from "react"/);
    expect(source).not.toMatch(/supabase/i);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\binsert\s*\(/);
    expect(source).not.toMatch(/\bupdate\s*\(/);
    expect(source).not.toMatch(/\bdelete\s*\(/);
    expect(source).not.toMatch(/buildUnderwritingPresentation\s*\(/);
    expect(source).not.toMatch(/buildStrategyPresentation\s*\(/);
    expect(source).not.toMatch(/buildUnderwritingReportPayload\s*\(/);
  });

  it("projects the active next-action contract with deterministic ordering and hashes", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      property: { propertyId: "property-1" },
      recommendation: recommendationRecord({ recommendedAction: recommendedAction({ actionId: "recommendation-action", stableOrdinal: 99 }) }),
      riskRecords: [riskRecord({ riskId: "risk-hard", category: "hard_disqualifier", severity: "critical", stableOrdinal: 2 })],
      missingInputRecords: [missingInputRecord({ missingInputId: "taxes", importance: "blocking", requiredWorkflowRef: "underwriting:inputs:taxes", stableOrdinal: 1 })],
      workItems: [taskWorkItem({ recordId: "task-urgent", priority: "urgent", dueAt: "2026-08-04T16:00:00.000Z" })],
      generatedAt: "2026-08-04T12:00:00.000Z",
    });
    const repeated = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      property: { propertyId: "property-1" },
      recommendation: recommendationRecord({ recommendedAction: recommendedAction({ actionId: "recommendation-action", stableOrdinal: 99 }) }),
      missingInputRecords: [missingInputRecord({ missingInputId: "taxes", importance: "blocking", requiredWorkflowRef: "underwriting:inputs:taxes", stableOrdinal: 1 })],
      riskRecords: [riskRecord({ riskId: "risk-hard", category: "hard_disqualifier", severity: "critical", stableOrdinal: 2 })],
      workItems: [taskWorkItem({ recordId: "task-urgent", priority: "urgent", dueAt: "2026-08-04T16:00:00.000Z" })],
      generatedAt: "2026-08-04T13:00:00.000Z",
    });

    expect(projection.nextActions.contract).toEqual(DECISION_COCKPIT_ACTIVE_NEXT_ACTION_CONTRACT);
    expect(projection.nextActions.contract.status).toBe("active");
    expect(projection.nextActions.contract.supportedRecommendationVersions).toContain(DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION);
    expect(projection.nextActions.primaryAction).toMatchObject({
      actionType: "complete_task",
      sourceType: "task",
      sourceId: "task-urgent",
      priority: "critical",
      actionState: "required",
      workflowAvailability: "available",
    });
    expect(projection.nextActions.alternateActions).toContainEqual(expect.objectContaining({
      actionType: "verify_taxes",
      sourceType: "missing_input",
      sourceId: "taxes",
    }));
    expect(projection.nextActions.alternateActions.map((action) => action.actionType)).toContain("review_hard_disqualifier");
    expect(projection.nextActions.manifestHash).toBe(repeated.nextActions.manifestHash);
    expect(projection.nextActions.primaryAction?.deterministicHash).toMatch(/^dc_/);
  });

  it("does not fabricate next actions or deadlines when canonical sources are absent", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-empty",
      generatedAt: "2026-08-04T12:00:00.000Z",
    });

    expect(projection.nextActions).toMatchObject({
      state: "unavailable",
      itemCount: 0,
      activeCount: 0,
      primaryAction: undefined,
      alternateActions: [],
    });
    expect(projection.deadlines).toMatchObject({
      contractVersion: DECISION_COCKPIT_DEADLINE_PANEL_CONTRACT_VERSION,
      state: "unavailable",
      itemCount: 0,
      overdueCount: 0,
      dueTodayCount: 0,
      dueSoonCount: 0,
      upcomingCount: 0,
    });
  });

  it("projects canonical deadline urgency with server-supplied as-of time and timezone-aware all-day dates", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      workItems: [
        deadlineWorkItem({ recordId: "deadline-overdue", dueAt: "2026-08-04T10:00:00.000Z", verificationState: "source_verified" }),
        deadlineWorkItem({ recordId: "deadline-today", dueAt: "2026-08-04T21:00:00.000Z", verificationState: "source_verified" }),
        deadlineWorkItem({ recordId: "deadline-soon", dueDate: "2026-08-06", dueAt: undefined, isAllDay: true, timezone: "America/Chicago", verificationState: "user_verified" }),
        deadlineWorkItem({ recordId: "deadline-unverified", dueAt: "2026-08-08T21:00:00.000Z", verificationState: "unverified" }),
        deadlineWorkItem({ recordId: "deadline-completed", status: "completed", completedAt: "2026-08-04T11:00:00.000Z", dueAt: "2026-08-04T10:00:00.000Z" }),
      ],
      generatedAt: "2026-08-04T12:00:00.000Z",
    });

    expect(projection.deadlines.items.map((deadline) => [deadline.deadlineId, deadline.deadlineStatus, deadline.urgency])).toEqual([
      ["deadline-completed", "completed", "none"],
      ["deadline-overdue", "overdue", "overdue"],
      ["deadline-today", "due_today", "due_today"],
      ["deadline-soon", "due_soon", "due_soon"],
      ["deadline-unverified", "unverified", "upcoming"],
    ]);
    expect(projection.deadlines).toMatchObject({
      overdueCount: 1,
      dueTodayCount: 1,
      dueSoonCount: 1,
      upcomingCount: 0,
      unverifiedCount: 1,
      nextControllingDeadline: { deadlineId: "deadline-overdue" },
    });
    expect(projection.nextActions.primaryAction).toMatchObject({
      sourceType: "deadline",
      relatedDeadlineId: "deadline-overdue",
      urgency: "overdue",
      priority: "critical",
    });
  });

  it("marks deadline urgency unavailable when server as-of time is absent instead of using the browser clock", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      workItems: [deadlineWorkItem({ recordId: "deadline-1", dueAt: "2026-08-04T10:00:00.000Z", verificationState: "source_verified" })],
    });

    expect(projection.deadlines.items[0]).toMatchObject({
      deadlineId: "deadline-1",
      deadlineStatus: "unavailable",
      urgency: "none",
    });
  });

  it("deduplicates actions from the same canonical task or deadline and removes completed work from active actions", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      workItems: [
        taskWorkItem({ recordId: "task-repeat", priority: "urgent" }),
        taskWorkItem({ recordId: "task-repeat", priority: "normal", updatedAt: "2026-08-04T12:05:00.000Z" }),
        taskWorkItem({ recordId: "task-complete", status: "completed", completedAt: "2026-08-04T12:00:00.000Z" }),
        deadlineWorkItem({ recordId: "deadline-repeat", dueAt: "2026-08-04T10:00:00.000Z", verificationState: "source_verified" }),
        deadlineWorkItem({ recordId: "deadline-repeat", dueAt: "2026-08-04T11:00:00.000Z", verificationState: "source_verified" }),
      ],
      generatedAt: "2026-08-04T12:00:00.000Z",
    });

    expect([projection.nextActions.primaryAction, ...projection.nextActions.alternateActions].filter((action) => action?.relatedTaskId === "task-repeat")).toHaveLength(1);
    expect(projection.nextActions.primaryAction?.relatedDeadlineId).toBe("deadline-repeat");
    expect([projection.nextActions.primaryAction, ...projection.nextActions.alternateActions].some((action) => action?.relatedTaskId === "task-complete")).toBe(false);
  });

  it("preserves prior valid action and deadline panels during failed projections", () => {
    const priorAction: DecisionCockpitPriorPanelProjection<DecisionCockpitNextActionProjection> = {
      state: "current",
      itemCount: 1,
      panelHash: "prior-actions-hash",
      generatedAt: "2026-08-04T11:00:00.000Z",
      items: [nextActionProjectionFixture({ actionId: "prior-action" })],
    };
    const priorDeadline: DecisionCockpitPriorPanelProjection<DecisionCockpitDeadlineProjection> = {
      state: "current",
      itemCount: 1,
      panelHash: "prior-deadlines-hash",
      generatedAt: "2026-08-04T11:00:00.000Z",
      items: [deadlineProjectionFixture({ deadlineId: "prior-deadline" })],
    };
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      nextActionPanelState: "failed",
      deadlinePanelState: "failed",
      priorValidNextActionPanel: priorAction,
      priorValidDeadlinePanel: priorDeadline,
    });

    expect(projection.nextActions.state).toBe("failed");
    expect(projection.nextActions.primaryAction?.actionId).toBe("prior-action");
    expect(projection.nextActions.priorValid?.panelHash).toBe("prior-actions-hash");
    expect(projection.deadlines.state).toBe("failed");
    expect(projection.deadlines.items[0]?.deadlineId).toBe("prior-deadline");
    expect(projection.deadlines.priorValid?.panelHash).toBe("prior-deadlines-hash");
  });

  it("applies permission-aware action and deadline projection without leaking protected records", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      workItems: [taskWorkItem(), deadlineWorkItem()],
      riskRecords: [riskRecord()],
      missingInputRecords: [missingInputRecord()],
      authorization: {
        canReadCockpit: true,
        canReadRecommendation: true,
        canReadMetrics: true,
        canReadUserDecision: true,
        canReadActions: false,
        canReadDeadlines: false,
        canManageDealWork: false,
        reason: "membership revoked",
      },
      generatedAt: "2026-08-04T12:00:00.000Z",
    });

    expect(projection.nextActions).toMatchObject({
      state: "permission_restricted",
      itemCount: 0,
      activeCount: 0,
      alternateActions: [],
    });
    expect(projection.nextActions.primaryAction).toBeUndefined();
    expect(projection.deadlines).toMatchObject({
      state: "permission_restricted",
      itemCount: 0,
    });
    expect(projection.deadlines.nextControllingDeadline).toBeUndefined();
  });

  it("keeps unavailable future-module workflows read-only rather than exposing dead controls", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      moduleAvailability: [{ moduleId: "OfferIQ", status: "unavailable_module", reason: "OfferIQ is not active for this Deal." }],
      recommendation: recommendationRecord({
        recommendedAction: recommendedAction({
          actionType: "prepare_offer",
          connectedWorkflow: "OfferIQ",
          requiredPermission: "deals:manage",
        }),
      }),
      generatedAt: "2026-08-04T12:00:00.000Z",
    });

    expect(projection.nextActions.primaryAction).toBeUndefined();
    expect(projection.nextActions.alternateActions[0]).toMatchObject({
      workflowAvailability: "unavailable_module",
      actionState: "unavailable",
      workflowDestination: { fallbackBehavior: "show_read_only" },
    });
  });

  it("projects permission-aware deep-link destinations from canonical cockpit records only", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      dealName: "1615 Augusta",
      property: { propertyId: "property-1", displayName: "1615 Augusta Ln" },
      underwriting: underwritingPresentation({
        outputs: [
          outputRow({
            formulaId: "down_payment_amount",
            label: "Down payment",
            value: "$200,000",
            group: "acquisition",
            stableOrdinal: 1,
            technicalReferences: ["hash:down-payment-hash", "result:down-payment-result"],
          }),
          outputRow({
            formulaId: "cash_on_cash_return",
            label: "Cash-on-cash return",
            value: "8.2%",
            group: "returns",
            stableOrdinal: 2,
            unit: "Percentage",
          }),
        ],
        inputs: [
          underwritingInput({
            inputId: "monthly_rent",
            label: "Monthly rent",
            requirement: "required",
            status: "Missing",
            sourceState: "missing",
            stableOrdinal: 1,
          }),
        ],
      }),
      strategy: strategyPresentation({ stale: true, selectedStrategyId: "brrrr" }),
      recommendation: recommendationRecord({ recommendedAction: recommendedAction({ connectedWorkflow: "OfferIQ" }) }),
      riskRecords: [riskRecord({ riskId: "risk-road", evidenceRefs: ["evidence-road"], sourceReference: "source-road", stableOrdinal: 1 })],
      missingInputRecords: [missingInputRecord({ missingInputId: "market:hoa-rules", status: "missing", requiredWorkflowRef: "underwriting:hoa", stableOrdinal: 2 })],
      workItems: [
        taskWorkItem({ recordId: "task-visit", workType: "visit", priority: "urgent" }),
        deadlineWorkItem({ recordId: "deadline-inspection", verificationState: "source_verified", dueAt: "2026-08-04T10:00:00.000Z" }),
      ],
      report: underwritingReport(),
      generatedAt: "2026-08-04T12:00:00.000Z",
    });

    expect(projection.destinations.contractVersion).toBe(DECISION_COCKPIT_DESTINATION_CONTRACT_VERSION);
    expect(projection.destinations.sourceBoundary).toEqual({
      canonicalProjectionOnly: true,
      noProviderCalls: true,
      noMutationOnResolve: true,
      noAuthorizationBypass: true,
      noProtectedQueryStrings: true,
    });
    expect(projection.destinations.destinations.map((item) => item.destinationType)).toEqual(expect.arrayContaining([
      "deal_overview",
      "property_detail",
      "recommendation_detail",
      "formula_lineage",
      "strategy_result",
      "strategy_comparison",
      "risk_detail",
      "missing_input_detail",
      "task_detail",
      "deadline_detail",
      "history_entry",
      "report_preview",
      "source_record",
      "evidence_item",
    ]));

    const metricDestination = projection.destinations.destinations.find((item) => item.destinationType === "formula_lineage");
    expect(metricDestination).toMatchObject({
      governingModule: "Underwriting",
      canonicalRecordType: "formula",
      canonicalRecordId: "down-payment-hash",
      exactRecordVersion: "1.0.0",
      snapshot: {
        snapshotId: "snapshot-1",
        underwritingRunId: "run-1",
      },
      routeParams: {
        dealId: "deal-1",
        section: "underwriting",
        focus: "formula_lineage",
      },
    });
    const resolvedMetric = resolveDecisionCockpitDestination(metricDestination, {
      isSignedIn: true,
      canOpen: true,
      workspaceId: "workspace-1",
      dealId: "deal-1",
    });
    expect(resolvedMetric).toMatchObject({
      ok: true,
      path: "/deals/deal-1?section=underwriting&focus=formula_lineage",
    });
    expect(resolvedMetric.ok && resolvedMetric.path).not.toContain("down-payment-hash");

    const evidenceDestination = projection.destinations.destinations.find((item) => item.destinationType === "evidence_item");
    expect(evidenceDestination).toMatchObject({
      governingModule: "Evidence",
      canonicalRecordType: "evidence",
      source: {
        evidenceId: "evidence-1",
        sourceRecordId: "source-record-1",
      },
    });
    const resolvedEvidence = resolveDecisionCockpitDestination(evidenceDestination, { isSignedIn: true, canOpen: true });
    expect(resolvedEvidence).toMatchObject({
      ok: true,
      path: "/deals/deal-1?section=underwriting&focus=evidence_item",
    });
    expect(resolvedEvidence.ok && resolvedEvidence.path).not.toContain("source-record-1");
    expect(resolvedEvidence.ok && resolvedEvidence.path).not.toContain("evidence-1");

    const staleStrategy = projection.destinations.destinations.find((item) => item.destinationType === "strategy_result");
    expect(staleStrategy).toMatchObject({
      availability: "stale",
      state: "historical",
      governingModule: "Strategy",
    });
    expect(projection.destinations.destinations.every((item) => item.deterministicHash.startsWith("dc_"))).toBe(true);
    expect(projection.destinations.manifestHash).toMatch(/^dc_/);
  });

  it("routes GovernanceIQ risks and missing inputs into the GovernanceIQ workspace", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      riskRecords: [riskRecord({ riskId: "risk-governance", governingModule: "GovernanceIQ", sourceReference: "governance:finding-1" })],
      missingInputRecords: [missingInputRecord({ missingInputId: "governance:question-1", sourceModule: "GovernanceIQ", status: "missing" })],
    });

    const governanceRisk = projection.destinations.destinations.find((item) => item.canonicalRecordId === "risk-governance");
    const governanceMissing = projection.destinations.destinations.find((item) => item.canonicalRecordId === "governance:question-1");

    expect(governanceRisk).toMatchObject({
      governingModule: "GovernanceIQ",
      routeId: "decision_cockpit.governanceiq",
      routeParams: { section: "governanceiq", focus: "risk_detail" },
    });
    expect(resolveDecisionCockpitDestination(governanceRisk, { isSignedIn: true, canOpen: true })).toMatchObject({
      ok: true,
      path: "/deals/deal-1?section=governanceiq&focus=risk_detail",
    });
    expect(governanceMissing).toMatchObject({
      governingModule: "GovernanceIQ",
      routeId: "decision_cockpit.governanceiq",
      routeParams: { section: "governanceiq", focus: "missing_input_detail" },
    });
  });

  it("enforces route registry, permission, workspace, historical, and unavailable-module safety", () => {
    const projection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      riskRecords: [riskRecord()],
      authorization: {
        canReadCockpit: true,
        canReadRecommendation: true,
        canReadMetrics: true,
        canReadUserDecision: true,
        canReadRisks: false,
        reason: "revoked",
      },
    });
    const restricted = projection.destinations.destinations.find((item) => item.destinationType === "risk_detail");
    expect(restricted).toBeUndefined();

    const availableProjection = buildDecisionCockpitReadProjection({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      riskRecords: [riskRecord()],
    });
    const riskDestination = availableProjection.destinations.destinations.find((item) => item.destinationType === "risk_detail");
    expect(resolveDecisionCockpitDestination(riskDestination, { workspaceId: "other-workspace" })).toMatchObject({
      ok: false,
      error: "workspace_mismatch",
      fallbackPath: "/deals/deal-1",
    });
    expect(resolveDecisionCockpitDestination(riskDestination, { canOpen: false })).toMatchObject({
      ok: false,
      error: "unauthorized_destination",
    });
    expect(resolveDecisionCockpitDestination({ ...riskDestination!, routeId: "missing-route" })).toMatchObject({
      ok: false,
      error: "route_not_found",
    });
    expect(resolveDecisionCockpitDestination({ ...riskDestination!, routeId: "decision_cockpit.strategy" })).toMatchObject({
      ok: false,
      error: "invalid_destination_type",
    });

    const routeIds = new Set(DECISION_COCKPIT_ROUTE_REGISTRY.map((route) => route.routeId));
    expect(availableProjection.destinations.destinations.every((item) => routeIds.has(item.routeId))).toBe(true);
    expect(DECISION_COCKPIT_ROUTE_REGISTRY.every((route) => route.protectedParamRules.canonicalIdsInQueryProhibited)).toBe(true);
    expect(DECISION_COCKPIT_ROUTE_REGISTRY.every((route) => route.lifecycleStatus === "available")).toBe(true);
  });

  it("keeps action and deadline projection source boundaries out of UI, reports, native, AI, and notifications", () => {
    const source = readFileSync("src/core/decisionCockpitProjection.ts", "utf8");
    const destinations = readFileSync("src/core/decisionCockpitDestinations.ts", "utf8");
    const app = readFileSync("src/App.tsx", "utf8");

    expect(DECISION_COCKPIT_NEXT_ACTION_CONTRACT_VERSION).toBe("decision-cockpit-next-action-contract-v1");
    expect(source).not.toMatch(/from "react"/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/createNotification|sendNotification|sendReminder|notification\.|reminder\./i);
    expect(source).not.toMatch(/\bDate\.now\s*\(/);
    expect(source).not.toMatch(/from ["']openai|openai\./i);
    expect(destinations).not.toMatch(/from "react"/);
    expect(destinations).not.toMatch(/\bfetch\s*\(/);
    expect(destinations).not.toMatch(/supabase/i);
    expect(destinations).not.toMatch(/\binsert\s*\(|\bupdate\s*\(|\bdelete\s*\(/);
    expect(destinations).not.toMatch(/https?:\/\//);
    expect(app).not.toMatch(/buildNextAction|deadlineUrgency|DECISION_COCKPIT_NEXT_ACTION/);
    expect(app).not.toMatch(/\bDate\.now\s*\(/);
  });
});

function underwritingPresentation(overrides: {
  blockedReasons?: string[];
  sourceWarnings?: string[];
  outputs?: UnderwritingPresentationOutputRow[];
  inputs?: UnderwritingPresentationInputRow[];
  snapshots?: UnderwritingPresentationModel["snapshots"];
  scenarios?: UnderwritingPresentationModel["scenarios"];
  sensitivities?: UnderwritingPresentationModel["sensitivities"];
} = {}): UnderwritingPresentationModel {
  return {
    contractVersion: UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
    dealId: "deal-1",
    dealName: "1615 Augusta",
    mode: "guided",
    hasCanonicalUnderwriting: true,
    schema: {
      schemaId: "residential_purchase",
      schemaVersion: "1.0.0",
      formulaRegistryVersion: "formula-registry-v1",
    },
    readiness: {
      label: "Decision Ready",
      isExecutable: true,
      missingRequiredInputCount: 0,
      conflictedRequiredInputCount: 0,
      provisionalRequiredInputCount: 1,
      warnings: ["Verify HOA rules"],
      blockedReasons: overrides.blockedReasons ?? [],
    },
    summary: [{ label: "Readiness", value: "Decision Ready", tone: "success" }],
    inputs: overrides.inputs ?? [],
    coreOutputGroups: [{
      id: "returns",
      label: "Returns",
      outputs: overrides.outputs ?? [{
        formulaId: "cash_on_cash_return",
        label: "Cash-on-cash return",
        value: "8.2%",
        status: "Calculated",
        group: "returns",
        formulaVersion: "1.0.0",
        formulaRegistryVersion: "formula-registry-v1",
        explanation: "Existing canonical output.",
        warnings: [],
        errors: [],
        assumptions: ["Projected monthly rent"],
        provenanceCount: 1,
        technicalReferences: ["result:result-1"],
        stableOrdinal: 1,
      }],
    }],
    snapshots: overrides.snapshots ?? [{
      snapshotId: "snapshot-1",
      sequence: 1,
      readiness: "Decision Ready",
      executable: true,
      createdAt: "2026-08-04T12:00:00.000Z",
      reason: "Initial Run",
      inputCount: 10,
      changedInputIds: [],
      changedFormulaIds: [],
      contentHash: "snapshot-hash-1",
    }],
    scenarios: overrides.scenarios ?? [{
      scenarioId: "scenario-1",
      name: "Stress Case",
      type: "Stress",
      status: "Complete",
      readiness: "Executable",
      changedInputCount: 2,
      changedOutputCount: 1,
      warnings: ["Stress case lowers coverage"],
      comparisonRows: [],
    }],
    sensitivities: overrides.sensitivities ?? [{
      sensitivityId: "sensitivity-1",
      inputId: "monthly_rent",
      inputLabel: "Monthly rent",
      status: "Complete",
      pointCount: 3,
      targetFormulaIds: ["cash_on_cash_return"],
      points: [],
    }],
    sourcesAndAssumptions: {
      sourceCount: 1,
      assumptionCount: 1,
      warningCount: overrides.sourceWarnings?.length ?? 0,
      provenance: [{
        inputId: "monthly_rent",
        inputLabel: "Monthly rent",
        sourceFactId: "source-fact-1",
        evidenceId: "evidence-1",
        sourceRecordId: "source-record-1",
        verificationState: "source_backed",
      }],
      assumptions: ["Projected monthly rent"],
      warnings: overrides.sourceWarnings ?? [],
    },
  } as unknown as UnderwritingPresentationModel;
}

function underwritingInput(
  overrides: Pick<UnderwritingPresentationInputRow, "inputId" | "label" | "requirement" | "status" | "sourceState" | "stableOrdinal">
    & Partial<UnderwritingPresentationInputRow>,
): UnderwritingPresentationInputRow {
  return {
    value: "",
    unit: "Currency",
    period: "Annual",
    locked: false,
    needsAttention: true,
    ...overrides,
  };
}

function outputRow(
  overrides: Pick<UnderwritingPresentationOutputRow, "formulaId" | "label" | "value" | "group" | "stableOrdinal">
    & Partial<UnderwritingPresentationOutputRow>,
): UnderwritingPresentationOutputRow {
  return {
    status: "Calculated",
    unit: "Currency",
    period: "Annual",
    formulaVersion: "1.0.0",
    formulaRegistryVersion: "formula-registry-v1",
    explanation: "Existing canonical output.",
    warnings: [],
    errors: [],
    assumptions: [],
    provenanceCount: 1,
    technicalReferences: [`result:${overrides.formulaId}`],
    ...overrides,
  };
}

function recommendationRecord(
  overrides: Partial<DecisionCockpitRecommendationRecord> = {},
): DecisionCockpitRecommendationRecord {
  return {
    recommendationId: "recommendation-1",
    recommendationState: "proceed_with_conditions",
    recommendationStatus: "current_with_warnings",
    dealId: "deal-1",
    propertyId: "property-1",
    snapshotId: "snapshot-1",
    underwritingRunId: "run-1",
    rankingId: "ranking-1",
    strongestStrategyResultId: "score-1",
    selectedStrategyId: "owner_occupied",
    selectedStrategyVersion: "1.0.0",
    confidenceState: "high_source_quality",
    freshnessState: "current",
    asOf: "2026-08-04T12:00:00.000Z",
    reasonIds: ["rent_support", "budget_fit"],
    bindingConstraintIds: ["verify_hoa_rules"],
    hardDisqualifierIds: [],
    missingInformationRefs: ["hoa_parking_rules"],
    professionalReviewRefs: ["attorney_review_if_offer"],
    provenanceRefs: ["source-record-1"],
    engineVersion: "decision-recommendation-v1",
    registryVersion: "decision-recommendation-registry-v1",
    ...overrides,
  };
}

function recommendedAction(overrides: Partial<DecisionCockpitRecommendedAction> = {}): DecisionCockpitRecommendedAction {
  return {
    actionId: "action-1",
    actionType: "prepare_offer",
    actionState: "active",
    displayLabel: "Prepare offer package",
    reasonIds: ["budget_fit"],
    governingStrategyId: "long_term_rental",
    governingRecommendationId: "recommendation-1",
    requiredPermission: "deal:write",
    connectedWorkflow: "OfferIQ",
    workflowAvailability: "available",
    stableOrdinal: 1,
    ...overrides,
  };
}

function userDecisionRecord(overrides: Partial<DecisionCockpitUserDecisionRecord> = {}): DecisionCockpitUserDecisionRecord {
  return {
    decisionId: "decision-1",
    decisionType: "proceed_with_conditions",
    decisionStatus: "current",
    selectedStrategyId: "owner_occupied",
    selectedStrategyVersion: "1.0.0",
    relatedRecommendationId: "recommendation-1",
    relatedSnapshotId: "snapshot-1",
    relatedRunId: "run-1",
    relatedRankingId: "ranking-1",
    rationaleSummary: "Proceed only after HOA rules are verified.",
    decidedAt: "2026-08-04T12:10:00.000Z",
    actorId: "user-1",
    version: "user-decision-v1",
    ...overrides,
  };
}

function riskRecord(overrides: Partial<DecisionCockpitRiskRecord> = {}): DecisionCockpitRiskRecord {
  return {
    riskId: "risk-1",
    workspaceId: "workspace-1",
    dealId: "deal-1",
    category: "potential_concern",
    severity: "unknown",
    confidenceState: "source_backed",
    verificationState: "source_backed",
    sourceReference: "source-record-1",
    evidenceRefs: ["evidence-1"],
    governingModule: "Strategy Intelligence",
    decisionImpact: "Could change whether the Deal should proceed before offer preparation.",
    recommendedReviewRef: "review:risk-1",
    staleState: "current",
    currentState: "current",
    stableOrdinal: 10,
    ...overrides,
  };
}

function missingInputRecord(overrides: Partial<DecisionCockpitMissingInputRecord> = {}): DecisionCockpitMissingInputRecord {
  return {
    missingInputId: "market:rent-comps",
    workspaceId: "workspace-1",
    dealId: "deal-1",
    category: "market",
    importance: "material",
    explanation: "Rent support requires market evidence before relying on the result.",
    sourceModule: "MarketIQ",
    blocking: false,
    decisionImpact: "May change rent support, underwriting confidence, and strategy comparison.",
    requiredWorkflowRef: "market:rent-comps",
    staleState: "current",
    status: "missing",
    stableOrdinal: 10,
    ...overrides,
  };
}

function taskWorkItem(overrides: Partial<DealWorkItem> = {}): DealWorkItem {
  return {
    recordType: "task",
    recordId: "task-1",
    recordVersion: 1,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    title: "Verify financing",
    body: "Confirm lender terms before relying on the Deal.",
    status: "open",
    priority: "normal",
    workType: "financing",
    dueAt: undefined,
    dueDate: undefined,
    isAllDay: false,
    timezone: "America/Chicago",
    sourceType: "manual",
    sourceRecordId: "task-source-1",
    completedAt: undefined,
    archivedAt: undefined,
    createdAt: "2026-08-04T10:00:00.000Z",
    updatedAt: "2026-08-04T11:00:00.000Z",
    ...overrides,
  };
}

function deadlineWorkItem(overrides: Partial<DealWorkItem> = {}): DealWorkItem {
  return {
    recordType: "deadline",
    recordId: "deadline-1",
    recordVersion: 1,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    title: "Inspection period",
    body: "Confirm inspection response deadline from the accepted contract.",
    status: "open",
    workType: "deadline",
    dueAt: "2026-08-05T17:00:00.000Z",
    dueDate: undefined,
    isAllDay: false,
    timezone: "America/Chicago",
    sourceType: "contract",
    sourceRecordId: "contract-term-1",
    verificationState: "unverified",
    completedAt: undefined,
    archivedAt: undefined,
    createdAt: "2026-08-04T10:00:00.000Z",
    updatedAt: "2026-08-04T11:00:00.000Z",
    ...overrides,
  };
}

function nextActionProjectionFixture(overrides: Partial<DecisionCockpitNextActionProjection> = {}): DecisionCockpitNextActionProjection {
  return {
    actionId: "action-fixture",
    actionType: "complete_task",
    sourceType: "task",
    sourceId: "task-fixture",
    workspaceId: "workspace-1",
    dealId: "deal-1",
    displayLabel: "Complete task",
    conciseReason: "Prior valid action.",
    detailedReasonRef: "task:task-fixture",
    priority: "normal",
    urgency: "none",
    actionState: "recommended",
    requiredPermission: "deals:manage",
    workflowDestination: {
      routeId: "DealWork:deal_work:task-fixture",
      moduleId: "DealWork",
      destination: "deal_work",
      requiredIds: { workspaceId: "workspace-1", dealId: "deal-1", taskId: "task-fixture", sourceId: "task-fixture" },
      requiredPermission: "deals:manage",
      workflowStatus: "available",
      fallbackBehavior: "return_to_cockpit",
      returnToCockpit: { dealId: "deal-1", section: "next_actions" },
    },
    workflowAvailability: "available",
    relatedTaskId: "task-fixture",
    professionalReviewRequired: false,
    staleState: "current",
    stableOrdinal: 1,
    deterministicHash: "dc_prior_action",
    ...overrides,
  };
}

function deadlineProjectionFixture(overrides: Partial<DecisionCockpitDeadlineProjection> = {}): DecisionCockpitDeadlineProjection {
  return {
    deadlineId: "deadline-fixture",
    title: "Prior deadline",
    type: "deadline",
    sourceType: "contract",
    sourceId: "contract-term-fixture",
    workspaceId: "workspace-1",
    dealId: "deal-1",
    dueAt: "2026-08-05T17:00:00.000Z",
    dueDate: undefined,
    isAllDay: false,
    timezone: "America/Chicago",
    deadlineStatus: "upcoming",
    urgency: "upcoming",
    verificationState: "source_verified",
    sourceDescription: "Prior valid deadline.",
    completedAt: undefined,
    staleState: "current",
    stableOrdinal: 1,
    deterministicHash: "dc_prior_deadline",
    ...overrides,
  };
}

function strategyPresentation(overrides: {
  userPreference?: StrategyPresentationModel["userPreference"];
  userSelectionMatchesSystemRank?: boolean;
  stale?: boolean;
  professionalReviewCount?: number;
  selectedStrategyId?: string;
  selectedStrategyOverrides?: Partial<StrategyPresentationModel["rankedStrategies"][number]>;
  history?: StrategyPresentationModel["history"];
} = {}): StrategyPresentationModel {
  const userPreference = overrides.userPreference;
  const staleEvents = overrides.stale ? [{
    eventId: "stale-1",
    eventType: "underwriting_changed",
    staleStatus: "stale",
    triggeredBy: "underwriting_snapshot",
    affectedStrategies: ["owner_occupied"],
    affectedEngines: ["strategy-engine-v1"],
    requiredScope: "full_strategy_reevaluation",
    reason: "Underwriting inputs changed",
    eventHash: "stale-hash-1",
    occurredAt: "2026-08-04T12:05:00.000Z",
  }] : [];

  return {
    contractVersion: STRATEGY_PRESENTATION_CONTRACT_VERSION,
    dealId: "deal-1",
    dealName: "1615 Augusta",
    mode: "guided",
    hasCanonicalStrategyResults: true,
    overview: {
      rankingId: "ranking-1",
      rankingVersion: "strategy-ranking-v1",
      rankingHash: "ranking-hash-1",
      createdAt: "2026-08-04T12:00:00.000Z",
      snapshotId: "snapshot-1",
      underwritingRunId: "run-1",
      freshnessState: overrides.stale ? "stale" : "current",
      candidateCount: 2,
      compatibleCount: 1,
      compatibleWithConditionsCount: 1,
      uncertainCount: 0,
      incompatibleCount: 0,
      notEvaluatedCount: 0,
      missingDependencyCount: 1,
      professionalReviewCount: overrides.professionalReviewCount ?? 0,
      topRankedViable: {
        strategyId: "owner_occupied",
        strategyVersion: "1.0.0",
        displayName: "Owner Occupied",
        rank: 1,
      },
      userSelected: userPreference,
      userSelectionMatchesSystemRank: overrides.userSelectionMatchesSystemRank ?? null,
      staleWarning: overrides.stale ? "One or more canonical dependency changes may require reevaluation. Prior valid results remain visible." : undefined,
    },
    rankedStrategies: [{
      scoreResultId: "score-1",
      strategyId: "owner_occupied",
      strategyVersion: "1.0.0",
      displayName: "Owner Occupied",
      rank: 1,
      canonicalOrdinal: 1,
      compatibilityStatus: "compatible",
      scoreEligibility: "scored",
      totalScore: 88,
      confidenceLabel: "High",
      confidenceDescription: "Evidence quality, not certainty.",
      strengths: ["Fits budget"],
      weaknesses: ["HOA parking needs verification"],
      hardDisqualifierCount: 0,
      hardDisqualifiers: [],
      conditions: [],
      acceptedAssumptionCount: 1,
      preliminaryAssumptionCount: 0,
      missingDependencyCount: 0,
      professionalReviewCount: overrides.professionalReviewCount ?? 0,
      freshnessState: overrides.stale ? "stale" : "current",
      selectedByUser: false,
      explanation: {
        contractVersion: "strategy-explanation-projection-v1",
        resultId: "explanation-1",
        strategyId: "owner_occupied",
        strategyVersion: "1.0.0",
        displayName: "Owner Occupied",
        confidenceLabel: "High",
        sections: [{ title: "Why it fits", items: [{ text: "Fits budget and location profile.", tone: "success" }] }],
        sourceBoundary: {
          usesCanonicalScore: true,
          usesCanonicalCompatibility: true,
          aiGenerated: false,
          clientBusinessLogicProhibited: true,
        },
      },
      hash: "score-hash-1",
    }, {
      scoreResultId: "score-2",
      strategyId: "brrrr",
      strategyVersion: "1.0.0",
      displayName: "BRRRR",
      rank: 2,
      canonicalOrdinal: 2,
      compatibilityStatus: "compatible_with_conditions",
      scoreEligibility: "scored",
      totalScore: 74,
      confidenceLabel: "Moderate",
      confidenceDescription: "Confidence describes evidence quality, not probability of success.",
      strengths: ["Equity creation potential"],
      weaknesses: ["Refinance and rehab scope need verification"],
      hardDisqualifierCount: 0,
      hardDisqualifiers: [],
      conditions: ["Confirm refinance terms"],
      acceptedAssumptionCount: 1,
      preliminaryAssumptionCount: 1,
      missingDependencyCount: 1,
      professionalReviewCount: overrides.professionalReviewCount ?? 0,
      freshnessState: overrides.stale ? "stale" : "current",
      selectedByUser: overrides.selectedStrategyId === "brrrr",
      explanation: {
        contractVersion: "strategy-explanation-projection-v1",
        resultId: "explanation-2",
        strategyId: "brrrr",
        strategyVersion: "1.0.0",
        displayName: "BRRRR",
        confidenceLabel: "Moderate",
        sections: [{ title: "Why it needs review", items: [{ text: "Refinance terms and rehab scope drive the outcome.", tone: "warning" }] }],
        sourceBoundary: {
          usesCanonicalScore: true,
          usesCanonicalCompatibility: true,
          aiGenerated: false,
          clientBusinessLogicProhibited: true,
        },
      },
      hash: "score-hash-2",
      ...overrides.selectedStrategyOverrides,
    }],
    selectedStrategy: overrides.selectedStrategyId === "brrrr"
      ? {
        scoreResultId: "score-2",
        strategyId: "brrrr",
        strategyVersion: "1.0.0",
        displayName: "BRRRR",
        rank: 2,
        canonicalOrdinal: 2,
        compatibilityStatus: "compatible_with_conditions",
        scoreEligibility: "scored",
        totalScore: 74,
        confidenceLabel: "Moderate",
        confidenceDescription: "Confidence describes evidence quality, not probability of success.",
        strengths: ["Equity creation potential"],
        weaknesses: ["Refinance and rehab scope need verification"],
        hardDisqualifierCount: 0,
        hardDisqualifiers: [],
        conditions: ["Confirm refinance terms"],
        acceptedAssumptionCount: 1,
        preliminaryAssumptionCount: 1,
        missingDependencyCount: 1,
        professionalReviewCount: overrides.professionalReviewCount ?? 0,
        freshnessState: overrides.stale ? "stale" : "current",
        selectedByUser: true,
        explanation: {
          contractVersion: "strategy-explanation-projection-v1",
          resultId: "explanation-2",
          strategyId: "brrrr",
          strategyVersion: "1.0.0",
          displayName: "BRRRR",
          confidenceLabel: "Moderate",
          sections: [{ title: "Why it needs review", items: [{ text: "Refinance terms and rehab scope drive the outcome.", tone: "warning" }] }],
          sourceBoundary: {
            usesCanonicalScore: true,
            usesCanonicalCompatibility: true,
            aiGenerated: false,
            clientBusinessLogicProhibited: true,
          },
        },
        hash: "score-hash-2",
        identity: {
          strategyId: "brrrr",
          strategyVersion: "1.0.0",
          registryVersion: "strategy-registry-v1",
          lifecycleStatus: "active",
          supportStatus: "supported",
          category: "residential",
        },
        dimensionScores: [],
        weights: [],
        weightedContributions: [],
        bindingConstraints: ["Confirm refinance terms"],
        missingInformation: ["Refinance terms require verification"],
        staleInformation: [],
        conflicts: [],
        unavailableModules: [],
        materialChangeFactors: [],
        underwritingReferences: ["run-1", "snapshot-1"],
        versionReferences: ["strategy-registry-v1"],
        ...overrides.selectedStrategyOverrides,
      } as StrategyPresentationModel["selectedStrategy"]
      : undefined,
    comparison: {
      limit: 4,
      selectedStrategyIds: ["owner_occupied"],
      rows: [{
        rowId: "confidence",
        label: "Evidence quality",
        values: [{ strategyId: "owner_occupied", value: "High", state: overrides.stale ? "stale" : "same" }],
      }],
      columns: [],
    },
    userPreference,
    staleEvents,
    history: overrides.history ?? [],
    sourceBoundary: {
      usesCanonicalRanking: true,
      usesCanonicalCompatibility: true,
      usesCanonicalScoring: true,
      usesCanonicalExplanation: true,
      usesCanonicalReevaluation: overrides.stale ?? false,
      clientBusinessLogicProhibited: true,
    },
  } as unknown as StrategyPresentationModel;
}

function underwritingReport(overrides: {
  contentHash?: string;
  requestedAt?: string;
} = {}): UnderwritingReportPayload {
  return {
    contract: {
      contractId: "canonical_underwriting_report",
      contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
      contractSemanticVersion: "1.0.0",
      registryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
      reportType: "underwriting_summary",
      payloadHashVersion: "underwriting-report-payload-hash-v1",
    },
    identity: {
      workspaceId: "workspace-1",
      dealId: "deal-1",
      dealDisplayName: "1615 Augusta",
      propertyIds: ["property-1"],
      requestedBy: "user-1",
      requestedAt: overrides.requestedAt ?? "2026-08-04T12:00:00.000Z",
      locale: "en-US",
      timezone: "America/Chicago",
      displayCurrency: "USD",
    },
    reconciliation: {
      snapshotId: "snapshot-1",
      runId: "run-1",
      snapshotHash: "snapshot-hash-1",
      resultSetHash: "result-set-hash-1",
      manifestHash: "manifest-hash-1",
      dependencyGraphHash: "dependency-hash-1",
      formulaVersionManifestHash: "formula-hash-1",
      schemaId: "residential_purchase",
      schemaVersion: "1.0.0",
      engineVersion: "underwriting-core-output-run-v1",
      snapshotContractVersion: "underwriting-snapshot-contract-v1",
    },
    status: {
      sectionStatus: "available",
      readinessState: "decision_ready",
      runStatus: "complete",
      isExecutable: true,
      issueCount: 1,
      blockingIssueCount: 0,
      warningIssueCount: 1,
      sourceLimitationSummary: ["HOA rules require verification"],
    },
    sections: [{ id: "executive_summary", title: "Executive Summary", status: "available", rows: [] }],
    appendices: {
      formulaManifest: [],
      provenanceIndex: [],
      versionManifest: {
        reportContractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
        reportRegistryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
        formulaRegistryVersion: "formula-registry-v1",
        inputRegistryVersion: "underwriting-input-registry-v1",
        snapshotContractVersion: "underwriting-snapshot-contract-v1",
        coreOutputContractVersion: "underwriting-core-output-run-v1",
        scenarioContractVersion: "underwriting-scenario-contract-v1",
      },
    },
    warnings: [],
    errors: [],
    contentHash: overrides.contentHash ?? "report-content-hash",
  } as unknown as UnderwritingReportPayload;
}

function stripEventReasons(items: DecisionCockpitChangeHistoryEntry[]) {
  return items.map(({ eventReason: _eventReason, ...item }) => item);
}

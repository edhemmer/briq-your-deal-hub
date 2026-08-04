import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DECISION_COCKPIT_KEY_METRIC_REGISTRY_VERSION,
  DECISION_COCKPIT_PRIMARY_METRIC_LIMIT,
  DECISION_COCKPIT_READ_PROJECTION_CONTRACT_VERSION,
  DECISION_COCKPIT_RECOMMENDATION_CONTRACT_VERSION,
  buildDecisionCockpitReadProjection,
  type DecisionCockpitRecommendationRecord,
  type DecisionCockpitRecommendedAction,
  type DecisionCockpitUserDecisionRecord,
} from "../core/decisionCockpitProjection";
import { STRATEGY_PRESENTATION_CONTRACT_VERSION, type StrategyPresentationModel } from "../core/strategyPresentation";
import {
  UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
  type UnderwritingPresentationOutputRow,
  type UnderwritingPresentationModel,
} from "../core/underwritingPresentation";
import {
  UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
  UNDERWRITING_REPORT_CONTRACT_VERSION,
  type UnderwritingReportPayload,
} from "../core/underwritingReportContract";

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
      count: 2,
      strategyFlags: [{ strategyId: "owner_occupied", displayName: "Owner Occupied", count: 2 }],
    });
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
});

function underwritingPresentation(overrides: {
  blockedReasons?: string[];
  sourceWarnings?: string[];
  outputs?: UnderwritingPresentationOutputRow[];
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
    inputs: [],
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
    snapshots: [{
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
    scenarios: [{
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
    sensitivities: [{
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

function strategyPresentation(overrides: {
  userPreference?: StrategyPresentationModel["userPreference"];
  userSelectionMatchesSystemRank?: boolean;
  stale?: boolean;
  professionalReviewCount?: number;
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
    }],
    selectedStrategy: undefined,
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
    history: [],
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

function underwritingReport(): UnderwritingReportPayload {
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
      requestedAt: "2026-08-04T12:00:00.000Z",
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
    contentHash: "report-content-hash",
  } as unknown as UnderwritingReportPayload;
}

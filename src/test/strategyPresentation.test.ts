import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  STRATEGY_COMPARISON_MAX_STRATEGIES,
  buildStrategyPresentation,
} from "../core/strategyPresentation";
import type { StrategyCompatibilityResult } from "../core/strategyCompatibility";
import { STRATEGY_EXPLANATION_CONTRACT_VERSION, assembleStrategyExplanation } from "../core/strategyExplanation";
import type { StrategyExplanationRequest } from "../core/strategyExplanation";
import { STRATEGY_REEVALUATION_EVENT_VERSION, type StrategyReevaluationEvent } from "../core/strategyReevaluationEvents";
import type { StrategyRankingResult, StrategyScoreResult } from "../core/strategyScoring";
import {
  STRATEGY_CONFIDENCE_MODEL_VERSION,
  STRATEGY_NORMALIZATION_MODEL_VERSION,
  STRATEGY_RANKING_RESULT_VERSION,
  STRATEGY_SCORING_RESULT_VERSION,
} from "../core/strategyScoring";
import { STRATEGY_REGISTRY_VERSION, resolveStrategyDefinition } from "../core/strategyRegistry";
import { FORMULA_REGISTRY_VERSION } from "../core/formulaRegistry";
import { STRATEGY_COMPATIBILITY_ENGINE_VERSION, STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION, STRATEGY_COMPATIBILITY_RESULT_VERSION } from "../core/strategyCompatibility";
import { STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION, STRATEGY_REQUIREMENT_REGISTRY_VERSION } from "../core/strategyRequirements";
import { UNDERWRITING_CORE_OUTPUT_HASH_VERSION, UNDERWRITING_CORE_OUTPUT_RUN_VERSION, type UnderwritingCoreOutputRunRecord } from "../core/underwritingCoreOutputs";
import { UNDERWRITING_SNAPSHOT_CONTRACT_VERSION } from "../core/underwritingSnapshots";

describe("strategy presentation contract", () => {
  it("renders an honest empty projection without fake strategy data", () => {
    const model = buildStrategyPresentation({ dealId: "deal-1", mode: "guided" });

    expect(model.hasCanonicalStrategyResults).toBe(false);
    expect(model.rankedStrategies).toEqual([]);
    expect(model.overview.candidateCount).toBeNull();
    expect(model.emptyState?.detail).toContain("will not invent strategy scores");
  });

  it("preserves canonical rank order, disqualifiers, and user preference separately", () => {
    const fixture = strategyPresentationFixture();
    const model = buildStrategyPresentation({
      dealId: "deal-1",
      dealName: "100 Main St",
      mode: "guided",
      ranking: fixture.ranking,
      compatibilities: fixture.compatibilities,
      explanations: [fixture.explanation],
      userPreference: {
        strategyId: "residential.brrrr",
        strategyVersion: "1.0.0",
        displayName: "BRRRR",
        relatedRankingId: fixture.ranking.rankingResultId,
        relatedSnapshotId: "snapshot-1",
        relatedRunId: "run-1",
        acknowledgementRequired: true,
        compatibilityStatus: "compatible_with_conditions",
      },
    });

    expect(model.hasCanonicalStrategyResults).toBe(true);
    expect(model.rankedStrategies.map((row) => row.strategyId)).toEqual(["residential.long_term_rental", "residential.brrrr", "residential.fix_and_flip"]);
    expect(model.overview.topRankedViable?.strategyId).toBe("residential.long_term_rental");
    expect(model.overview.userSelectionMatchesSystemRank).toBe(false);
    expect(model.rankedStrategies.find((row) => row.strategyId === "residential.brrrr")?.selectedByUser).toBe(true);
    expect(model.rankedStrategies.find((row) => row.strategyId === "residential.fix_and_flip")?.hardDisqualifiers[0]).toContain("governance restriction");
    expect(model.rankedStrategies.find((row) => row.strategyId === "residential.fix_and_flip")?.totalScore).toBeNull();
  });

  it("builds bounded comparison without a winner, new score, or client-derived deltas", () => {
    const fixture = strategyPresentationFixture();
    const model = buildStrategyPresentation({
      dealId: "deal-1",
      mode: "professional",
      ranking: fixture.ranking,
      compatibilities: fixture.compatibilities,
      comparisonStrategyIds: ["residential.brrrr", "residential.long_term_rental", "residential.fix_and_flip", "residential.short_term_rental", "extra"],
    });

    expect(model.comparison.limit).toBe(STRATEGY_COMPARISON_MAX_STRATEGIES);
    expect(model.comparison.columns).toHaveLength(3);
    expect(model.comparison.rows.map((row) => row.label)).not.toContain("Winner");
    expect(model.comparison.rows.map((row) => row.label)).not.toContain("Comparison score");
    expect(JSON.stringify(model.comparison)).not.toMatch(/delta|best|winner|recommended/i);
  });

  it("projects stale events without executing reevaluation", () => {
    const fixture = strategyPresentationFixture();
    const model = buildStrategyPresentation({
      dealId: "deal-1",
      mode: "guided",
      ranking: fixture.ranking,
      compatibilities: fixture.compatibilities,
      reevaluationEvents: [fixture.staleEvent],
    });

    expect(model.overview.freshnessState).toBe("stale");
    expect(model.staleEvents[0]?.requiredScope).toBe("single_strategy");
    expect(model.rankedStrategies.find((row) => row.strategyId === "residential.brrrr")?.freshnessState).toBe("stale");
  });

  it("keeps presentation source boundaries free of authoritative strategy logic", () => {
    const sourceFiles = [
      path.join(process.cwd(), "src", "core", "strategyPresentation.ts"),
      path.join(process.cwd(), "src", "components", "StrategyWorkspace.tsx"),
    ];
    for (const file of sourceFiles) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(/\bevaluateStrategyCompatibility\b|\bevaluateStrategyScore\b|\bevaluateStrategyRanking\b|\bcalculateStrategyConfidence\b|\bapplyHardDisqualifier\b/i);
      expect(source).not.toMatch(/\bbuy\b|\bpass\b|\bwinner\b|\bbest deal\b|\brecommended strategy\b/i);
    }
  });
});

function strategyPresentationFixture() {
  const run = underwritingRun();
  const ltr = scoreResult("residential.long_term_rental", 1, 82, "compatible");
  const brrrr = scoreResult("residential.brrrr", 2, 74, "compatible_with_conditions");
  const flip = scoreResult("residential.fix_and_flip", 3, null, "incompatible");
  const compatibilities = [
    compatibilityResult(ltr, "compatible"),
    compatibilityResult(brrrr, "compatible_with_conditions", { condition: "Rehab scope must be source backed." }),
    compatibilityResult(flip, "incompatible", { disqualifier: "A governance restriction blocks this strategy until professionally reviewed." }),
  ];
  const ranking: StrategyRankingResult = {
    rankingResultId: "ranking-1",
    rankingRequestId: "ranking-request-1",
    workspaceId: "workspace-1",
    dealId: "deal-1",
    rankedResults: [ltr, brrrr, flip],
    stableRankingOrder: [ltr.scoreResultId, brrrr.scoreResultId, flip.scoreResultId],
    version: STRATEGY_RANKING_RESULT_VERSION,
    deterministicRankingHash: "ranking-hash-1",
  };
  const explanation = assembleStrategyExplanation(explanationRequest(ltr, ranking), compatibilities[0], ltr, run, ranking);
  const staleEvent = {
    eventId: "event-1",
    eventType: "accepted_assumption_changed",
    version: STRATEGY_REEVALUATION_EVENT_VERSION,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    snapshotId: "snapshot-1",
    strategyResultIds: [brrrr.scoreResultId],
    rankingId: "ranking-1",
    triggeringDependency: {
      dependencyId: "assumption-1",
      dependencyType: "accepted_assumption",
      dependencyHash: "dependency-hash",
      canonicalOwner: "underwriting",
    },
    triggerSource: "test",
    triggerTimestamp: "2026-01-02T00:00:00.000Z",
    reevaluationScope: "single_strategy",
    staleReason: "Accepted rehab assumptions changed this strategy result.",
    staleStatuses: [{ strategyResultId: brrrr.scoreResultId, strategyId: "residential.brrrr", staleStatus: "stale" }],
    affectedStrategyIds: ["residential.brrrr"],
    affectedEngineVersions: ["strategy_scoring_engine@1.0.0"],
    eventHash: "event-hash-1",
    idempotencyKey: "event-key-1",
  } as StrategyReevaluationEvent;
  return { ranking, compatibilities, run, explanation, staleEvent };
}

function scoreResult(strategyId: string, rank: number, score: number | null, compatibilityStatus: StrategyScoreResult["compatibilityStatus"]): StrategyScoreResult {
  const strategy = resolveStrategyDefinition(strategyId);
  const scored = score !== null && compatibilityStatus !== "incompatible";
  return {
    scoreResultId: `score-${strategyId}`,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    snapshotId: "snapshot-1",
    underwritingRunId: "run-1",
    compatibilityResultId: `compat-${strategyId}`,
    strategyId,
    strategyVersion: strategy.semanticVersion,
    scoreEligibility: scored ? "scored" : "not_scoreable",
    compatibilityStatus,
    overallScore: score,
    overallScoreBasis: score === null ? null : score * 100,
    rank,
    categoryScores: scored ? [{ categoryId: "financial_strength", label: "Financial strength", normalizedScore: score, normalizedBasis: score * 100, metricRefs: ["noi"], explanation: "Uses canonical underwriting output references." }] : [],
    normalizedMetrics: [],
    weightBreakdown: scored ? [{ categoryId: "financial_strength", weightBasis: 1000, weightPercent: 10, strategyAdjustmentBasis: 0, explanation: "Canonical score weighting." }] : [],
    confidence: { confidenceLevel: scored ? "moderate" : "insufficient", confidenceScore: scored ? 72 : null, confidenceBasis: scored ? 7200 : null, modelVersion: STRATEGY_CONFIDENCE_MODEL_VERSION, drivers: ["Source-linked underwriting output available."], penalties: [] },
    explanations: scored ? ["Canonical scoring result references accepted underwriting outputs."] : [],
    scoreBreakdown: scored ? [{ categoryId: "financial_strength", normalizedBasis: score * 100, weightBasis: 1000, weightedContributionBasis: score * 10 }] : [],
    versionReferences: {
      scoringEngineVersion: "1.0.0",
      scoringEngineRegistryVersion: "strategy-scoring-engine-registry-v1",
      scoringResultVersion: STRATEGY_SCORING_RESULT_VERSION,
      scoringHashVersion: "strategy-scoring-result-hash-v1",
      weightRegistryVersion: "strategy-scoring-weight-registry-v1",
      normalizationModelVersion: STRATEGY_NORMALIZATION_MODEL_VERSION,
      confidenceModelVersion: STRATEGY_CONFIDENCE_MODEL_VERSION,
      rankingTieBreakVersion: "strategy-ranking-tie-break-v1",
      strategyRegistryVersion: STRATEGY_REGISTRY_VERSION,
      compatibilityEngineVersion: STRATEGY_COMPATIBILITY_ENGINE_VERSION,
      compatibilityResultVersion: STRATEGY_COMPATIBILITY_RESULT_VERSION,
      compatibilityHashVersion: STRATEGY_COMPATIBILITY_RESULT_HASH_VERSION,
      requirementRegistryVersion: STRATEGY_REQUIREMENT_REGISTRY_VERSION,
      disqualifierRegistryVersion: STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
      formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
      underwritingRunVersion: UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
      underwritingHashVersion: UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
      snapshotContractVersion: UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
    },
    deterministicScoreHash: `hash-${strategyId}`,
    requestedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:00.000Z",
    version: STRATEGY_SCORING_RESULT_VERSION,
    errors: scored ? [] : [{ code: "compatibility_not_scoreable", safeMessage: "Only compatible strategies and compatible-with-conditions strategies can receive a score." }],
  };
}

function compatibilityResult(score: StrategyScoreResult, status: StrategyScoreResult["compatibilityStatus"], options: { condition?: string; disqualifier?: string } = {}): StrategyCompatibilityResult {
  return {
    compatibilityResultId: score.compatibilityResultId,
    workspaceId: score.workspaceId,
    dealId: score.dealId,
    propertyId: score.propertyId,
    snapshotId: score.snapshotId,
    underwritingRunId: score.underwritingRunId,
    strategyId: score.strategyId,
    strategyVersion: score.strategyVersion,
    strategyRegistryVersion: STRATEGY_REGISTRY_VERSION,
    requirementRegistryVersion: STRATEGY_REQUIREMENT_REGISTRY_VERSION,
    disqualifierRegistryVersion: STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
    compatibilityEngineVersion: STRATEGY_COMPATIBILITY_ENGINE_VERSION,
    compatibilityStatus: status,
    evaluationReadiness: status === "incompatible" ? "conflicted" : "accepted_assumptions",
    hardDisqualifierCount: options.disqualifier ? 1 : 0,
    triggeredDisqualifierCount: options.disqualifier ? 1 : 0,
    satisfiedRequirementCount: status === "compatible" ? 1 : 0,
    conditionalRequirementCount: options.condition ? 1 : 0,
    unsatisfiedRequirementCount: 0,
    missingRequirementCount: options.condition ? 1 : 0,
    conflictedRequirementCount: 0,
    unavailableDependencyCount: 0,
    acceptedAssumptionCount: options.condition ? 1 : 0,
    preliminaryAssumptionCount: 0,
    professionalReviewCount: options.disqualifier ? 1 : 0,
    requirementResultManifest: options.condition ? [{
      requirementId: "requirement-1",
      requirementVersion: "1.0.0",
      strategyId: score.strategyId,
      strategyVersion: score.strategyVersion,
      category: "execution",
      blockingClassification: "informational",
      evaluationStatus: "satisfied_with_condition",
      canonicalSubjectReference: "rehabBudget",
      requiredInputRefs: [],
      requiredOutputRefs: [],
      actualCanonicalValuesUsed: [],
      sourceRefs: [],
      evidenceRefs: [],
      conditionResult: "unknown",
      missingDependencies: [],
      conflicts: [],
      verificationState: "user_entered",
      assumptionState: "accepted",
      professionalReviewRequired: false,
      explanation: options.condition,
      deterministicResultHash: "requirement-hash",
      stableOrdinal: 1,
    }] : [],
    disqualifierResultManifest: options.disqualifier ? [{
      disqualifierId: "disqualifier-1",
      disqualifierVersion: "1.0.0",
      strategyId: score.strategyId,
      strategyVersion: score.strategyVersion,
      triggerCategory: "governance",
      severity: "high",
      evaluationStatus: "triggered",
      triggerResult: "true",
      controllingCanonicalValues: [],
      sourceRefs: [],
      evidenceRefs: [],
      verificationState: "professional_review_recommended",
      assumptionState: "none",
      professionalReviewRequired: true,
      remediationMetadata: { hookId: "strategy_disqualifier.test.remediation", hookVersion: "pending", actionCategory: "professional_review" },
      explanation: options.disqualifier,
      deterministicResultHash: "disqualifier-hash",
      stableOrdinal: 1,
    }] : [],
    controllingReasons: [`${score.strategyId} canonical compatibility result.`],
    missingDependencies: options.condition ? ["rehabBudget"] : [],
    requiredProfessionalReviews: options.disqualifier ? ["Review restriction"] : [],
    deterministicResultHash: `compat-hash-${score.strategyId}`,
    idempotencyKey: `compat-key-${score.strategyId}`,
    evaluatedBy: "strategy-compatibility-engine",
    requestedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:00.000Z",
    version: STRATEGY_COMPATIBILITY_RESULT_VERSION,
    errors: [],
  };
}

function underwritingRun(): UnderwritingCoreOutputRunRecord {
  return {
    runId: "run-1",
    workspaceId: "workspace-1",
    dealId: "deal-1",
    snapshotId: "snapshot-1",
    snapshotHash: "snapshot-hash",
    snapshotManifestHash: "snapshot-manifest-hash",
    snapshotReadinessState: "executable",
    engineVersion: UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    hashVersion: UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
    status: "complete",
    requestedBy: "user-1",
    idempotencyKey: "run-key-1",
    requestedAt: "2026-01-01T00:00:00.000Z",
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:00.000Z",
    calculationOrder: [],
    resultCount: 1,
    calculatedResultCount: 1,
    warningCount: 0,
    blockedResultCount: 0,
    incompleteResultCount: 0,
    preliminaryResultCount: 0,
    results: [],
    resultSetHash: "run-result-hash",
    dependencyGraphHash: "dependency-graph-hash",
    formulaVersionManifestHash: "formula-manifest-hash",
    warnings: [],
    errors: [],
    assumptionDisclosures: [],
  };
}

function explanationRequest(score: StrategyScoreResult, ranking: StrategyRankingResult): StrategyExplanationRequest {
  return {
    explanationRequestId: "explanation-request-1",
    workspaceId: score.workspaceId,
    dealId: score.dealId,
    propertyId: score.propertyId,
    underwritingSnapshotId: score.snapshotId,
    underwritingRunId: score.underwritingRunId,
    expectedCompatibilityResultId: score.compatibilityResultId,
    expectedCompatibilityResultHash: "compat-hash-residential.long_term_rental",
    expectedScoreResultId: score.scoreResultId,
    expectedScoreHash: score.deterministicScoreHash,
    expectedConfidenceHash: "confidence-hash",
    expectedUnderwritingResultSetHash: "run-result-hash",
    expectedRankingResultId: ranking.rankingResultId,
    expectedRankingHash: ranking.deterministicRankingHash,
    strategyId: score.strategyId,
    strategyVersion: score.strategyVersion,
    explanationContractVersion: STRATEGY_EXPLANATION_CONTRACT_VERSION,
    detailLevel: "summary",
    presentationMode: "guided",
    locale: "en-US",
    actorContext: {
      actorId: "user-1",
      workspaceId: score.workspaceId,
      membershipStatus: "active",
      permissions: ["strategy.explain", "strategy.evaluate", "strategy.read"],
      sourceClient: "test",
    },
    idempotencyKey: "explanation-key-1",
    requestedAt: "2026-01-01T00:00:00.000Z",
  };
}

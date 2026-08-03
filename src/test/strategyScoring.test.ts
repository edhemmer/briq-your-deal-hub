import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FORMULA_REGISTRY_VERSION, type FormulaId } from "../core/formulaRegistry";
import {
  STRATEGY_COMPATIBILITY_ENGINE_VERSION,
  STRATEGY_COMPATIBILITY_RESULT_VERSION,
  type StrategyCompatibilityResult,
} from "../core/strategyCompatibility";
import {
  evaluateStrategyRanking,
  evaluateStrategyScore,
  resolveLatestActiveScoringEngine,
  resolveScoringEngineVersion,
  resolveStrategyScoringWeights,
  STRATEGY_CONFIDENCE_MODEL_VERSION,
  STRATEGY_NORMALIZATION_MODEL_VERSION,
  STRATEGY_RANKING_TIE_BREAK_VERSION,
  STRATEGY_SCORING_ENGINE_VERSION,
  STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION,
  type StrategyScoringEvaluationRequest,
} from "../core/strategyScoring";
import {
  STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
  STRATEGY_REQUIREMENT_REGISTRY_VERSION,
} from "../core/strategyRequirements";
import {
  STRATEGY_REGISTRY_VERSION,
  resolveStrategyDefinition,
} from "../core/strategyRegistry";
import {
  UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
  UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
  type UnderwritingCoreFormulaResultRecord,
  type UnderwritingCoreOutputRunRecord,
} from "../core/underwritingCoreOutputs";
import { UNDERWRITING_SNAPSHOT_CONTRACT_VERSION } from "../core/underwritingSnapshots";

describe("strategy scoring, ranking, and confidence", () => {
  it("resolves versioned engines and refuses disabled versions", () => {
    expect(resolveLatestActiveScoringEngine().semanticVersion).toBe(STRATEGY_SCORING_ENGINE_VERSION);
    expect(resolveScoringEngineVersion("0.9.0").status).toBe("deprecated");
    expect(resolveScoringEngineVersion("2.0.0").status).toBe("disabled");

    const { request, compatibility, run } = fixture("residential.long_term_rental");
    const disabled = evaluateStrategyScore({ ...request, scoringEngineVersion: "2.0.0" }, compatibility, run);
    expect(disabled.scoreEligibility).toBe("not_scoreable");
    expect(disabled.errors[0]?.code).toBe("scoring_engine_disabled");
  });

  it("produces identical scores and hashes for identical immutable inputs", () => {
    const { request, compatibility, run } = fixture("residential.long_term_rental");

    const first = evaluateStrategyScore(request, compatibility, run);
    const second = evaluateStrategyScore({ ...request }, { ...compatibility }, { ...run, results: [...run.results] });

    expect(first.overallScore).toBeGreaterThan(0);
    expect(first).toEqual(second);
    expect(first.deterministicScoreHash).toBe(second.deterministicScoreHash);
    expect(first.versionReferences.scoringEngineVersion).toBe(STRATEGY_SCORING_ENGINE_VERSION);
    expect(first.versionReferences.normalizationModelVersion).toBe(STRATEGY_NORMALIZATION_MODEL_VERSION);
    expect(first.versionReferences.confidenceModelVersion).toBe(STRATEGY_CONFIDENCE_MODEL_VERSION);
    expect(first.versionReferences.rankingTieBreakVersion).toBe(STRATEGY_RANKING_TIE_BREAK_VERSION);
  });

  it("scores only compatible and compatible-with-conditions results", () => {
    const compatible = fixture("residential.long_term_rental");
    const conditional = fixture("residential.long_term_rental", {
      compatibilityOverrides: { compatibilityStatus: "compatible_with_conditions", acceptedAssumptionCount: 2 },
    });
    const incompatible = fixture("residential.long_term_rental", {
      compatibilityOverrides: { compatibilityStatus: "incompatible", triggeredDisqualifierCount: 1 },
    });
    const uncertain = fixture("residential.long_term_rental", {
      compatibilityOverrides: { compatibilityStatus: "uncertain", missingRequirementCount: 1 },
    });

    expect(evaluateStrategyScore(compatible.request, compatible.compatibility, compatible.run).scoreEligibility).toBe("scored");
    expect(evaluateStrategyScore(conditional.request, conditional.compatibility, conditional.run).scoreEligibility).toBe("scored");
    expect(evaluateStrategyScore(incompatible.request, incompatible.compatibility, incompatible.run).overallScore).toBeNull();
    expect(evaluateStrategyScore(uncertain.request, uncertain.compatibility, uncertain.run).errors[0]?.code).toBe("compatibility_not_scoreable");
  });

  it("uses strategy-aware visible weights and changes outputs when weights change by strategy", () => {
    const rental = resolveStrategyDefinition("residential.long_term_rental");
    const land = resolveStrategyDefinition("land.raw_land_hold");

    const rentalWeights = resolveStrategyScoringWeights(rental);
    const landWeights = resolveStrategyScoringWeights(land);

    expect(rentalWeights.reduce((sum, item) => sum + item.weightBasis, 0)).toBe(10_000);
    expect(landWeights.reduce((sum, item) => sum + item.weightBasis, 0)).toBe(10_000);
    expect(rentalWeights.find((item) => item.categoryId === "cash_flow")?.weightBasis).toBeGreaterThan(landWeights.find((item) => item.categoryId === "cash_flow")?.weightBasis ?? 0);
    expect(landWeights.find((item) => item.categoryId === "future_expansion")?.weightBasis).toBeGreaterThan(rentalWeights.find((item) => item.categoryId === "future_expansion")?.weightBasis ?? 0);

    const rentalFixture = fixture("residential.long_term_rental");
    const landFixture = fixture("land.raw_land_hold", { mode: "land_hold", outputValues: { pre_tax_cash_flow: 0, cash_on_cash_return: 0, capitalization_rate: 0, debt_service_coverage_ratio: 0 } });

    expect(evaluateStrategyScore(rentalFixture.request, rentalFixture.compatibility, rentalFixture.run).weightBreakdown).not.toEqual(evaluateStrategyScore(landFixture.request, landFixture.compatibility, landFixture.run).weightBreakdown);
  });

  it("ranks deterministically by compatibility, score, risk, assumptions, and stable registry ordering", () => {
    const strong = fixture("residential.long_term_rental", { outputValues: { pre_tax_cash_flow: 18_000, cash_on_cash_return: 12, debt_service_coverage_ratio: 1.45 } });
    const conditional = fixture("residential.brrrr", {
      outputValues: { pre_tax_cash_flow: 18_000, cash_on_cash_return: 12, debt_service_coverage_ratio: 1.45 },
      compatibilityOverrides: { compatibilityStatus: "compatible_with_conditions", acceptedAssumptionCount: 1 },
    });
    const tieLeft = fixture("residential.owner_occupied", { outputValues: { pre_tax_cash_flow: 12_000, cash_on_cash_return: 8, debt_service_coverage_ratio: 1.2 } });
    const tieRight = fixture("residential.buy_and_hold", { outputValues: { pre_tax_cash_flow: 12_000, cash_on_cash_return: 8, debt_service_coverage_ratio: 1.2 } });

    const ranking = evaluateStrategyRanking(
      { rankingRequestId: "rank-1", scoreRequests: [conditional.request, tieRight.request, strong.request, tieLeft.request] },
      [conditional.compatibility, tieRight.compatibility, strong.compatibility, tieLeft.compatibility],
      [conditional.run, tieRight.run, strong.run, tieLeft.run],
    );

    expect(ranking.rankedResults[0].strategyId).toBe("residential.long_term_rental");
    expect(ranking.rankedResults.find((item) => item.strategyId === "residential.brrrr")?.rank).toBeGreaterThan(1);
    expect(ranking.rankedResults.map((item) => item.rank)).toEqual([1, 2, 3, 4]);
    expect(ranking.stableRankingOrder).toEqual(evaluateStrategyRanking(
      { rankingRequestId: "rank-1", scoreRequests: [strong.request, tieLeft.request, tieRight.request, conditional.request] },
      [tieLeft.compatibility, strong.compatibility, conditional.compatibility, tieRight.compatibility],
      [tieLeft.run, strong.run, tieRight.run, conditional.run],
    ).stableRankingOrder);
  });

  it("calculates deterministic confidence as evidence quality, not probability", () => {
    const clean = fixture("residential.long_term_rental");
    const burdened = fixture("residential.long_term_rental", {
      compatibilityOverrides: {
        compatibilityStatus: "compatible_with_conditions",
        acceptedAssumptionCount: 2,
        preliminaryAssumptionCount: 1,
        missingRequirementCount: 1,
        conflictedRequirementCount: 1,
        professionalReviewCount: 1,
      },
      runOverrides: { warningCount: 2, incompleteResultCount: 1 },
    });

    const cleanScore = evaluateStrategyScore(clean.request, clean.compatibility, clean.run);
    const burdenedScore = evaluateStrategyScore(burdened.request, burdened.compatibility, burdened.run);

    expect(cleanScore.confidence.confidenceLevel).toBe("high");
    expect(burdenedScore.confidence.confidenceScore).toBeLessThan(cleanScore.confidence.confidenceScore ?? 100);
    expect(burdenedScore.confidence.drivers.join(" ")).toContain("not a probability");
    expect(burdenedScore.confidence.penalties.length).toBeGreaterThan(0);
  });

  it("rejects stale compatibility and underwriting hashes without writing a score", () => {
    const { request, compatibility, run } = fixture("residential.long_term_rental");

    expect(evaluateStrategyScore({ ...request, expectedCompatibilityResultHash: "old" }, compatibility, run).errors[0]?.code).toBe("compatibility_result_hash_mismatch");
    expect(evaluateStrategyScore({ ...request, expectedResultSetHash: "old" }, compatibility, run).errors[0]?.code).toBe("underwriting_result_set_hash_mismatch");
  });

  it("preserves historical reproducibility and immutable inputs", () => {
    const { request, compatibility, run } = fixture("residential.long_term_rental");
    const historicalRequest = { ...request, scoringEngineVersion: "0.9.0" };
    const runBefore = JSON.stringify(run);
    const compatibilityBefore = JSON.stringify(compatibility);

    const first = evaluateStrategyScore(historicalRequest, compatibility, run);
    const second = evaluateStrategyScore(historicalRequest, compatibility, run);

    expect(first).toEqual(second);
    expect(first.versionReferences.scoringEngineVersion).toBe("0.9.0");
    expect(JSON.stringify(run)).toBe(runBefore);
    expect(JSON.stringify(compatibility)).toBe(compatibilityBefore);
  });

  it("keeps the scoring layer server-core only and free of UI, network, AI, provider, formula execution, snapshots, and strategy mutation", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "core", "strategyScoring.ts"), "utf8");

    expect(source).not.toMatch(/from\s+["']react["']|JSX|SwiftUI|UIKit|ViewBuilder/i);
    expect(source).not.toMatch(/\bfetch\s*\(|supabase\.|OpenAI|ai\.|provider|MLS|Zillow|Realtor|LoopNet|Crexi/i);
    expect(source).not.toMatch(/\bexecuteFormula\b|\bbuildUnderwritingCoreOutputRun\b|\bcreateUnderwritingSnapshot\b/i);
    expect(source).not.toMatch(/\bcreateDeal\b|\bcreateProperty\b|\bsaveRun\b|\binsert\b|\bupdate\b|\bdelete\b/i);
    expect(source).not.toMatch(/\brecommendation\b|\brecommend\b/i);
  });
});

type FixtureOptions = {
  mode?: string;
  outputValues?: Partial<Record<FormulaId, number>>;
  compatibilityOverrides?: Partial<StrategyCompatibilityResult>;
  runOverrides?: Partial<UnderwritingCoreOutputRunRecord>;
};

function fixture(strategyId: string, options: FixtureOptions = {}) {
  const strategy = resolveStrategyDefinition(strategyId);
  const compatibility = compatibilityFixture(strategy.strategyId, strategy.semanticVersion, options.compatibilityOverrides);
  const run = runFixtureRecord(strategy.strategyId, compatibility, options);
  const request: StrategyScoringEvaluationRequest = {
    scoringRequestId: `score-${strategy.machineKey}`,
    workspaceId: compatibility.workspaceId,
    dealId: compatibility.dealId,
    propertyId: compatibility.propertyId,
    underwritingSnapshotId: compatibility.snapshotId,
    underwritingRunId: compatibility.underwritingRunId,
    expectedCompatibilityResultHash: compatibility.deterministicResultHash,
    expectedResultSetHash: run.resultSetHash,
    strategyId: strategy.strategyId,
    strategyVersion: "latest",
    strategyRegistryVersion: STRATEGY_REGISTRY_VERSION,
    requirementRegistryVersion: STRATEGY_REQUIREMENT_REGISTRY_VERSION,
    disqualifierRegistryVersion: STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    snapshotContractVersion: UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
    scoringEngineVersion: STRATEGY_SCORING_ENGINE_VERSION,
    weightRegistryVersion: STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION,
    requestedAt: "2026-08-03T12:00:00.000Z",
  };
  return { request, compatibility, run };
}

function compatibilityFixture(strategyId: string, strategyVersion: string, overrides: Partial<StrategyCompatibilityResult> = {}): StrategyCompatibilityResult {
  const base = {
    compatibilityResultId: `compat-${strategyId.replace(/[^a-z0-9]/gi, "-")}`,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    snapshotId: `snapshot-${strategyId.replace(/[^a-z0-9]/gi, "-")}`,
    underwritingRunId: `run-${strategyId.replace(/[^a-z0-9]/gi, "-")}`,
    strategyId,
    strategyVersion,
    strategyRegistryVersion: STRATEGY_REGISTRY_VERSION,
    requirementRegistryVersion: STRATEGY_REQUIREMENT_REGISTRY_VERSION,
    disqualifierRegistryVersion: STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
    compatibilityEngineVersion: STRATEGY_COMPATIBILITY_ENGINE_VERSION,
    compatibilityStatus: "compatible" as const,
    evaluationReadiness: "complete_evidence" as const,
    hardDisqualifierCount: 3,
    triggeredDisqualifierCount: 0,
    satisfiedRequirementCount: 3,
    conditionalRequirementCount: 0,
    unsatisfiedRequirementCount: 0,
    missingRequirementCount: 0,
    conflictedRequirementCount: 0,
    unavailableDependencyCount: 0,
    acceptedAssumptionCount: 0,
    preliminaryAssumptionCount: 0,
    professionalReviewCount: 0,
    requirementResultManifest: [],
    disqualifierResultManifest: [],
    controllingReasons: ["Fixture compatibility is scoreable."],
    missingDependencies: [],
    requiredProfessionalReviews: [],
    idempotencyKey: `compat-idem-${strategyId}`,
    evaluatedBy: "user-1",
    requestedAt: "2026-08-03T12:00:00.000Z",
    completedAt: "2026-08-03T12:00:00.000Z",
    version: STRATEGY_COMPATIBILITY_RESULT_VERSION,
    errors: [],
    ...overrides,
  } satisfies Omit<StrategyCompatibilityResult, "deterministicResultHash">;
  return {
    ...base,
    deterministicResultHash: `compat-hash-${strategyId}-${base.compatibilityStatus}-${base.acceptedAssumptionCount}-${base.preliminaryAssumptionCount}-${base.missingRequirementCount}-${base.conflictedRequirementCount}-${base.unavailableDependencyCount}-${base.professionalReviewCount}-${base.triggeredDisqualifierCount}`,
  };
}

function runFixtureRecord(strategyId: string, compatibility: StrategyCompatibilityResult, options: FixtureOptions): UnderwritingCoreOutputRunRecord {
  const values: Record<FormulaId, number> = {
    loan_amount: 260_000,
    down_payment_amount: 65_000,
    monthly_principal_interest_fixed: 1_700,
    gross_scheduled_income: 31_200,
    effective_gross_income: 29_640,
    total_operating_expenses: 9_500,
    net_operating_income: 20_140,
    annual_debt_service: 20_400,
    pre_tax_cash_flow: -260,
    capitalization_rate: 6.2,
    cash_on_cash_return: -0.4,
    loan_to_value_ratio: 80,
    debt_service_coverage_ratio: 0.99,
    ...options.outputValues,
  };
  const results = (Object.entries(values) as Array<[FormulaId, number]>).map(([formulaId, rawValue], index) => outputRecord(formulaId, compatibility, rawValue, index + 1));
  return {
    runId: compatibility.underwritingRunId,
    workspaceId: compatibility.workspaceId,
    dealId: compatibility.dealId,
    snapshotId: compatibility.snapshotId,
    snapshotHash: `snapshot-hash-${strategyId}`,
    snapshotManifestHash: `manifest-hash-${strategyId}`,
    engineVersion: UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    hashVersion: UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
    status: "complete",
    requestedBy: "user-1",
    idempotencyKey: `run-idem-${strategyId}`,
    requestedAt: "2026-08-03T12:00:00.000Z",
    startedAt: "2026-08-03T12:00:00.000Z",
    completedAt: "2026-08-03T12:00:01.000Z",
    calculationOrder: results.map((result) => result.formulaId),
    resultSetHash: `result-hash-${strategyId}-${Object.values(values).join("-")}`,
    dependencyGraphHash: `dependency-hash-${strategyId}`,
    formulaVersionManifestHash: `formula-version-hash-${strategyId}`,
    resultCount: results.length,
    calculatedResultCount: results.length,
    warningCount: 0,
    blockedResultCount: 0,
    incompleteResultCount: 0,
    preliminaryResultCount: 0,
    warnings: [],
    errors: [],
    assumptionDisclosures: [],
    snapshotReadinessState: "ready_confirmed",
    results,
    ...options.runOverrides,
  };
}

function outputRecord(
  formulaId: FormulaId,
  compatibility: StrategyCompatibilityResult,
  rawValue: number,
  stableOrdinal: number,
): UnderwritingCoreFormulaResultRecord {
  return {
    resultId: `result-${formulaId}`,
    runId: compatibility.underwritingRunId,
    workspaceId: compatibility.workspaceId,
    dealId: compatibility.dealId,
    snapshotId: compatibility.snapshotId,
    formulaId,
    formulaVersion: "1.0.0",
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    outputGroup: "returns",
    status: "calculated",
    rawValue,
    displayValue: rawValue,
    displayText: String(rawValue),
    outputUnit: "currency",
    outputPeriod: "annual",
    currency: "USD",
    inputRefs: [],
    dependencyResultIds: [],
    sourceFactIds: [`source-${formulaId}`],
    assumptionIds: [],
    preliminaryInputIds: [],
    missingInputIds: [],
    blockedInputIds: [],
    warnings: [],
    errors: [],
    formulaExplanation: "Fixture accepted output.",
    assumptionDisclosure: [],
    provenance: [],
    deterministicHash: `output-hash-${formulaId}-${rawValue}`,
    stableOrdinal,
  };
}

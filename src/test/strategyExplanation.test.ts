import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FORMULA_REGISTRY_VERSION, type FormulaId } from "../core/formulaRegistry";
import {
  STRATEGY_COMPATIBILITY_ENGINE_VERSION,
  STRATEGY_COMPATIBILITY_RESULT_VERSION,
  type StrategyCompatibilityResult,
  type StrategyHardDisqualifierEvaluationResult,
  type StrategyRequirementEvaluationResult,
} from "../core/strategyCompatibility";
import {
  assembleStrategyExplanation,
  computeStrategyConfidenceHash,
  projectStrategyExplanation,
  resolveLatestActiveStrategyExplanationContract,
  resolveStrategyExplanationContractVersion,
  STRATEGY_EXPLANATION_CONTRACT_VERSION,
  STRATEGY_EXPLANATION_HASH_VERSION,
  STRATEGY_EXPLANATION_RESULT_VERSION,
  strategyExplanationSectionOrder,
  type StrategyExplanationRequest,
} from "../core/strategyExplanation";
import {
  evaluateStrategyRanking,
  evaluateStrategyScore,
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

describe("strategy explanation contract", () => {
  it("resolves versioned contracts and refuses disabled versions for new assembly", () => {
    expect(resolveLatestActiveStrategyExplanationContract().semanticVersion).toBe(STRATEGY_EXPLANATION_CONTRACT_VERSION);
    expect(resolveStrategyExplanationContractVersion("0.9.0").status).toBe("deprecated");
    expect(resolveStrategyExplanationContractVersion("2.0.0").status).toBe("disabled");

    const { explanationRequest, compatibility, score, run } = explanationFixture("residential.long_term_rental");
    const disabled = assembleStrategyExplanation(
      { ...explanationRequest, explanationContractVersion: "2.0.0" },
      compatibility,
      score,
      run,
    );

    expect(disabled.errors[0]?.code).toBe("explanation_contract_disabled");
    expect(disabled.sections.every((section) => section.status === "not_applicable")).toBe(true);
  });

  it("creates a deterministic compatible explanation with every required section present", () => {
    const { explanationRequest, compatibility, score, run } = explanationFixture("residential.long_term_rental", {
      requirementFixtures: "satisfied",
    });

    const first = assembleStrategyExplanation(explanationRequest, compatibility, score, run);
    const second = assembleStrategyExplanation({ ...explanationRequest }, { ...compatibility }, { ...score }, { ...run, results: [...run.results] });

    expect(first).toEqual(second);
    expect(first.semanticExplanationHash).toBe(second.semanticExplanationHash);
    expect(first.version).toBe(STRATEGY_EXPLANATION_RESULT_VERSION);
    expect(first.versionReferences.explanationHashVersion).toBe(STRATEGY_EXPLANATION_HASH_VERSION);
    expect(first.sections.map((section) => section.sectionId)).toEqual(strategyExplanationSectionOrder);
    expect(items(first, "compatibility").some((item) => item.reasonType === "satisfied_requirement")).toBe(true);
    expect(section(first, "hard_disqualifiers").status).toBe("not_applicable");
  });

  it("describes compatible-with-conditions without changing accepted assumptions or score", () => {
    const { explanationRequest, compatibility, score, run } = explanationFixture("residential.brrrr", {
      compatibilityOverrides: {
        compatibilityStatus: "compatible_with_conditions",
        acceptedAssumptionCount: 1,
        preliminaryAssumptionCount: 1,
        conditionalRequirementCount: 1,
        professionalReviewCount: 1,
        requiredProfessionalReviews: ["contractor-scope"],
      },
      requirementFixtures: "conditional",
    });

    const result = assembleStrategyExplanation(explanationRequest, compatibility, score, run);

    expect(result.overallScore).toBe(score.overallScore);
    expect(items(result, "conditions_and_constraints").some((item) => item.reasonType === "conditional_requirement")).toBe(true);
    expect(items(result, "assumptions_and_preliminary_values").map((item) => item.reasonType)).toContain("accepted_assumption");
    expect(items(result, "professional_verification").some((item) => item.reasonType === "professional_review")).toBe(true);
  });

  it("describes uncertain results as source-bound missing, stale, and conflict items", () => {
    const { explanationRequest, compatibility, score, run } = explanationFixture("residential.fix_and_flip", {
      compatibilityOverrides: {
        compatibilityStatus: "uncertain",
        missingRequirementCount: 1,
        conflictedRequirementCount: 1,
        unavailableDependencyCount: 1,
        missingDependencies: ["disposition_price"],
      },
      requirementFixtures: "uncertain",
    });

    const result = assembleStrategyExplanation(explanationRequest, compatibility, score, run);
    const reasonTypes = items(result, "missing_or_uncertain_information").map((item) => item.reasonType);

    expect(result.scoreEligibility).toBe("not_scoreable");
    expect(reasonTypes).toContain("missing_dependency");
    expect(reasonTypes).toContain("conflict");
    expect(reasonTypes).toContain("stale_dependency");
  });

  it("keeps triggered hard disqualifiers visible even when source outputs look strong", () => {
    const { explanationRequest, compatibility, score, run } = explanationFixture("residential.long_term_rental", {
      outputValues: { pre_tax_cash_flow: 30_000, cash_on_cash_return: 14, debt_service_coverage_ratio: 1.6 },
      compatibilityOverrides: {
        compatibilityStatus: "incompatible",
        triggeredDisqualifierCount: 1,
        hardDisqualifierCount: 1,
      },
      disqualifierFixtures: "triggered",
    });

    const result = assembleStrategyExplanation(explanationRequest, compatibility, score, run);

    expect(result.scoreEligibility).toBe("not_scoreable");
    expect(result.overallScore).toBeNull();
    expect(section(result, "hard_disqualifiers").status).toBe("blocked");
    expect(items(result, "hard_disqualifiers").some((item) => item.reasonType === "triggered_disqualifier")).toBe(true);
  });

  it("uses stored ranking order without favoring the user-selected strategy", () => {
    const ltr = explanationFixture("residential.long_term_rental", {
      outputValues: { pre_tax_cash_flow: 20_000, cash_on_cash_return: 10, debt_service_coverage_ratio: 1.4 },
    });
    const brrrr = explanationFixture("residential.brrrr", {
      compatibilityOverrides: { compatibilityStatus: "compatible_with_conditions", acceptedAssumptionCount: 1 },
      outputValues: { pre_tax_cash_flow: 20_000, cash_on_cash_return: 10, debt_service_coverage_ratio: 1.4 },
    });
    const ranking = evaluateStrategyRanking(
      { rankingRequestId: "ranking-explain-1", scoreRequests: [brrrr.scoreRequest, ltr.scoreRequest] },
      [brrrr.compatibility, ltr.compatibility],
      [brrrr.run, ltr.run],
    );
    const request = requestFrom(brrrr, ranking);

    const result = assembleStrategyExplanation(request, brrrr.compatibility, brrrr.score, brrrr.run, ranking);

    expect(result.rank).toBe(ranking.rankedResults.find((item) => item.scoreResultId === brrrr.score.scoreResultId)?.rank);
    expect(items(result, "ranking_rationale")[0]?.professionalText).toContain(ranking.stableRankingOrder.join(" > "));
  });

  it("hashes compatibility, score, ranking, confidence, and assumptions while projection mode does not alter semantic identity", () => {
    const base = explanationFixture("residential.long_term_rental");
    const changed = explanationFixture("residential.long_term_rental", {
      compatibilityOverrides: { acceptedAssumptionCount: 1 },
      requirementFixtures: "conditional",
    });
    const baseResult = assembleStrategyExplanation(base.explanationRequest, base.compatibility, base.score, base.run);
    const changedResult = assembleStrategyExplanation(changed.explanationRequest, changed.compatibility, changed.score, changed.run);

    expect(baseResult.semanticExplanationHash).not.toBe(changedResult.semanticExplanationHash);
    expect(projectStrategyExplanation(baseResult, { presentationMode: "guided", detailLevel: "summary", locale: "en-US" }).semanticExplanationHash).toBe(baseResult.semanticExplanationHash);
    expect(projectStrategyExplanation(baseResult, { presentationMode: "professional", detailLevel: "detailed", locale: "en-US" }).semanticExplanationHash).toBe(baseResult.semanticExplanationHash);
    expect(projectStrategyExplanation(baseResult, { presentationMode: "guided", detailLevel: "summary", locale: "en-US" }).sections[0].items[0].text)
      .not.toBe(projectStrategyExplanation(baseResult, { presentationMode: "professional", detailLevel: "detailed", locale: "en-US" }).sections[0].items[0].text);
  });

  it("fails closed for source hash mismatches, revoked actors, and workspace drift", () => {
    const { explanationRequest, compatibility, score, run } = explanationFixture("residential.long_term_rental");

    expect(assembleStrategyExplanation({ ...explanationRequest, expectedScoreHash: "old" }, compatibility, score, run).errors[0]?.code).toBe("score_hash_mismatch");
    expect(assembleStrategyExplanation({ ...explanationRequest, expectedConfidenceHash: "old" }, compatibility, score, run).errors[0]?.code).toBe("confidence_hash_mismatch");
    expect(assembleStrategyExplanation({ ...explanationRequest, actorContext: { ...explanationRequest.actorContext, membershipStatus: "revoked" } }, compatibility, score, run).errors[0]?.code).toBe("unauthorized_strategy_explanation");
    expect(assembleStrategyExplanation({ ...explanationRequest, workspaceId: "other-workspace" }, compatibility, score, run).errors.some((item) => item.code === "workspace_mismatch")).toBe(true);
  });

  it("keeps the explanation contract in core only and free of UI, network, AI, write paths, and calculation execution", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "core", "strategyExplanation.ts"), "utf8");
    const surfaceDirs = ["components", "pages", "hooks"].flatMap((segment) => filesUnder(path.join(process.cwd(), "src", segment)));
    const reportFiles = filesUnder(path.join(process.cwd(), "src", "core")).filter((file) => /report|export/i.test(file));
    const iosFiles = filesUnder(path.join(process.cwd(), "ios"));

    expect(source).not.toMatch(/from\s+["']react["']|JSX|SwiftUI|UIKit|ViewBuilder/i);
    expect(source).not.toMatch(/\bfetch\s*\(|supabase\.|OpenAI|ai\.|provider|MLS|Zillow|Realtor|LoopNet|Crexi/i);
    expect(source).not.toMatch(/\bevaluateStrategyCompatibility\b|\bevaluateStrategyScore\b|\bevaluateStrategyRanking\b|\bexecuteFormula\b|\bbuildUnderwritingCoreOutputRun\b|\bcreateUnderwritingSnapshot\b/i);
    expect(source).not.toMatch(/\bcreateDeal\b|\bcreateProperty\b|\bsaveRun\b|\binsert\b|\bupdate\b|\bdelete\b/i);
    expect([...surfaceDirs, ...reportFiles, ...iosFiles].some((file) => fs.readFileSync(file, "utf8").includes("assembleStrategyExplanation"))).toBe(false);
  });
});

type FixtureOptions = {
  outputValues?: Partial<Record<FormulaId, number>>;
  compatibilityOverrides?: Partial<StrategyCompatibilityResult>;
  requirementFixtures?: "satisfied" | "conditional" | "uncertain";
  disqualifierFixtures?: "none" | "triggered";
  runOverrides?: Partial<UnderwritingCoreOutputRunRecord>;
};

function explanationFixture(strategyId: string, options: FixtureOptions = {}) {
  const strategy = resolveStrategyDefinition(strategyId);
  const compatibility = compatibilityFixture(strategy.strategyId, strategy.semanticVersion, options);
  const run = runFixtureRecord(strategy.strategyId, compatibility, options);
  const scoreRequest: StrategyScoringEvaluationRequest = {
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
  const score = evaluateStrategyScore(scoreRequest, compatibility, run);
  const explanationRequest = requestFrom({ scoreRequest, compatibility, score, run });
  return { scoreRequest, explanationRequest, compatibility, score, run };
}

function requestFrom(
  fixture: {
    scoreRequest: StrategyScoringEvaluationRequest;
    compatibility: StrategyCompatibilityResult;
    score: ReturnType<typeof evaluateStrategyScore>;
    run: UnderwritingCoreOutputRunRecord;
  },
  ranking?: ReturnType<typeof evaluateStrategyRanking>,
): StrategyExplanationRequest {
  return {
    explanationRequestId: `explain-${fixture.score.strategyId}`,
    workspaceId: fixture.score.workspaceId,
    dealId: fixture.score.dealId,
    propertyId: fixture.score.propertyId,
    underwritingSnapshotId: fixture.score.snapshotId,
    underwritingRunId: fixture.score.underwritingRunId,
    strategyId: fixture.score.strategyId,
    strategyVersion: fixture.score.strategyVersion,
    expectedCompatibilityResultId: fixture.compatibility.compatibilityResultId,
    expectedCompatibilityResultHash: fixture.compatibility.deterministicResultHash,
    expectedScoreResultId: fixture.score.scoreResultId,
    expectedScoreHash: fixture.score.deterministicScoreHash,
    expectedConfidenceHash: computeStrategyConfidenceHash(fixture.score.confidence),
    expectedUnderwritingResultSetHash: fixture.run.resultSetHash,
    expectedRankingResultId: ranking?.rankingResultId,
    expectedRankingHash: ranking?.deterministicRankingHash,
    explanationContractVersion: STRATEGY_EXPLANATION_CONTRACT_VERSION,
    detailLevel: "standard",
    presentationMode: "guided",
    locale: "en-US",
    actorContext: {
      actorId: "user-1",
      workspaceId: fixture.score.workspaceId,
      membershipStatus: "active",
      permissions: ["strategy.explain"],
      sourceClient: "server",
    },
    idempotencyKey: `explain-idem-${fixture.score.strategyId}`,
    requestedAt: "2026-08-03T12:00:00.000Z",
  };
}

function compatibilityFixture(strategyId: string, strategyVersion: string, options: FixtureOptions): StrategyCompatibilityResult {
  const requirementResultManifest = requirementManifest(strategyId, strategyVersion, options.requirementFixtures ?? "satisfied");
  const disqualifierResultManifest = disqualifierManifest(strategyId, strategyVersion, options.disqualifierFixtures ?? "none");
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
    hardDisqualifierCount: disqualifierResultManifest.length,
    triggeredDisqualifierCount: disqualifierResultManifest.filter((item) => item.evaluationStatus === "triggered").length,
    satisfiedRequirementCount: requirementResultManifest.filter((item) => item.evaluationStatus === "satisfied").length,
    conditionalRequirementCount: requirementResultManifest.filter((item) => item.evaluationStatus === "satisfied_with_condition").length,
    unsatisfiedRequirementCount: requirementResultManifest.filter((item) => item.evaluationStatus === "unsatisfied").length,
    missingRequirementCount: requirementResultManifest.filter((item) => item.evaluationStatus === "missing").length,
    conflictedRequirementCount: requirementResultManifest.filter((item) => item.evaluationStatus === "conflicted").length,
    unavailableDependencyCount: requirementResultManifest.filter((item) => item.evaluationStatus === "unavailable_dependency").length,
    acceptedAssumptionCount: requirementResultManifest.filter((item) => item.assumptionState === "accepted").length,
    preliminaryAssumptionCount: requirementResultManifest.filter((item) => item.assumptionState === "preliminary").length,
    professionalReviewCount: [...requirementResultManifest, ...disqualifierResultManifest].filter((item) => item.professionalReviewRequired).length,
    requirementResultManifest,
    disqualifierResultManifest,
    controllingReasons: ["Fixture source-bound compatibility reason."],
    missingDependencies: [],
    requiredProfessionalReviews: [],
    idempotencyKey: `compat-idem-${strategyId}`,
    evaluatedBy: "user-1",
    requestedAt: "2026-08-03T12:00:00.000Z",
    completedAt: "2026-08-03T12:00:00.000Z",
    version: STRATEGY_COMPATIBILITY_RESULT_VERSION,
    errors: [],
    ...options.compatibilityOverrides,
  } satisfies Omit<StrategyCompatibilityResult, "deterministicResultHash">;
  return {
    ...base,
    deterministicResultHash: `compat-hash-${strategyId}-${base.compatibilityStatus}-${base.acceptedAssumptionCount}-${base.preliminaryAssumptionCount}-${base.missingRequirementCount}-${base.conflictedRequirementCount}-${base.unavailableDependencyCount}-${base.professionalReviewCount}-${base.triggeredDisqualifierCount}`,
  };
}

function requirementManifest(
  strategyId: string,
  strategyVersion: string,
  mode: "satisfied" | "conditional" | "uncertain",
): StrategyRequirementEvaluationResult[] {
  const rows: StrategyRequirementEvaluationResult[] = [
    requirement(strategyId, strategyVersion, "property-type", "satisfied", "Property type matches the strategy.", 1),
  ];
  if (mode === "conditional") {
    rows.push(requirement(strategyId, strategyVersion, "rent-support", "satisfied_with_condition", "Rent support is accepted but still source-limited.", 2, { assumptionState: "accepted", professionalReviewRequired: true }));
    rows.push(requirement(strategyId, strategyVersion, "scope-quality", "satisfied_with_condition", "Scope quality is preliminary.", 3, { assumptionState: "preliminary" }));
  }
  if (mode === "uncertain") {
    rows.push(requirement(strategyId, strategyVersion, "exit-value", "missing", "Exit value is missing.", 2, { missingDependencies: ["disposition_price"] }));
    rows.push(requirement(strategyId, strategyVersion, "market-support", "conflicted", "Market support conflicts with available evidence.", 3, { conflicts: ["market-rent-conflict"] }));
    rows.push(requirement(strategyId, strategyVersion, "financing-source", "unavailable_dependency", "Financing source is stale or unavailable.", 4));
  }
  return rows;
}

function requirement(
  strategyId: string,
  strategyVersion: string,
  requirementId: string,
  evaluationStatus: StrategyRequirementEvaluationResult["evaluationStatus"],
  explanation: string,
  stableOrdinal: number,
  overrides: Partial<StrategyRequirementEvaluationResult> = {},
): StrategyRequirementEvaluationResult {
  return {
    requirementId,
    requirementVersion: "1.0.0",
    strategyId,
    strategyVersion,
    category: "fixture",
    blockingClassification: "blocking",
    evaluationStatus,
    canonicalSubjectReference: `fixture-${requirementId}`,
    requiredInputRefs: [],
    requiredOutputRefs: [],
    actualCanonicalValuesUsed: [],
    sourceRefs: [`source-${requirementId}`],
    evidenceRefs: [`evidence-${requirementId}`],
    conditionResult: evaluationStatus === "satisfied" || evaluationStatus === "satisfied_with_condition" ? "true" : "unknown",
    missingDependencies: [],
    conflicts: [],
    verificationState: "source_backed",
    assumptionState: "none",
    professionalReviewRequired: false,
    explanation,
    deterministicResultHash: `requirement-hash-${requirementId}-${evaluationStatus}`,
    stableOrdinal,
    ...overrides,
  };
}

function disqualifierManifest(
  strategyId: string,
  strategyVersion: string,
  mode: "none" | "triggered",
): StrategyHardDisqualifierEvaluationResult[] {
  if (mode === "none") return [];
  return [{
    disqualifierId: "rental-use-restricted",
    disqualifierVersion: "1.0.0",
    strategyId,
    strategyVersion,
    triggerCategory: "governance",
    severity: "critical",
    evaluationStatus: "triggered",
    triggerResult: "true",
    controllingCanonicalValues: [],
    sourceRefs: ["source-governance"],
    evidenceRefs: ["evidence-governance"],
    verificationState: "source_backed",
    assumptionState: "none",
    professionalReviewRequired: true,
    remediationMetadata: { hookId: "fixture-professional-review", hookVersion: "pending", actionCategory: "professional_review" },
    explanation: "A source-backed governance restriction blocks this strategy.",
    deterministicResultHash: "disqualifier-hash-triggered",
    stableOrdinal: 1,
  }];
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
    provenance: [{ inputId: "purchase_price", sourceRecordId: `source-record-${formulaId}`, evidenceId: `evidence-output-${formulaId}` }],
    deterministicHash: `output-hash-${formulaId}-${rawValue}`,
    stableOrdinal,
  };
}

function section(result: ReturnType<typeof assembleStrategyExplanation>, sectionId: Parameters<typeof items>[1]) {
  const found = result.sections.find((item) => item.sectionId === sectionId);
  if (!found) throw new Error(`Missing section ${sectionId}`);
  return found;
}

function items(result: ReturnType<typeof assembleStrategyExplanation>, sectionId: typeof strategyExplanationSectionOrder[number]) {
  return section(result, sectionId).items;
}

function filesUnder(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return filesUnder(fullPath);
    return /\.(ts|tsx|swift)$/.test(entry.name) ? [fullPath] : [];
  });
}

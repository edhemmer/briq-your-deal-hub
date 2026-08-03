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
  STRATEGY_CONFIDENCE_MODEL_VERSION,
  STRATEGY_SCORING_ENGINE_VERSION,
  STRATEGY_SCORING_WEIGHT_REGISTRY_VERSION,
  evaluateStrategyRanking,
  evaluateStrategyScore,
  type StrategyScoringEvaluationRequest,
} from "../core/strategyScoring";
import {
  buildStrategyReevaluationDependencyGraph,
  registerStrategyReevaluationEvent,
  strategyReevaluationEventDefinitions,
  STRATEGY_REEVALUATION_DEPENDENCY_GRAPH_VERSION,
  STRATEGY_REEVALUATION_EVENT_HASH_VERSION,
  STRATEGY_REEVALUATION_EVENT_REGISTRY_VERSION,
  type StrategyReevaluationDependencyType,
  type StrategyReevaluationEventRequest,
  type StrategyReevaluationEventType,
  type StrategyReevaluationPermission,
} from "../core/strategyReevaluationEvents";
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

describe("strategy targeted reevaluation events", () => {
  it("registers every supported event type with deterministic scopes and stale statuses", () => {
    const eventTypes: StrategyReevaluationEventType[] = [
      "accepted_input_changed",
      "accepted_assumption_changed",
      "accepted_assumption_removed",
      "snapshot_replaced",
      "underwriting_output_changed",
      "scenario_created",
      "scenario_deleted",
      "strategy_registry_changed",
      "requirement_registry_changed",
      "disqualifier_registry_changed",
      "compatibility_engine_changed",
      "score_engine_changed",
      "confidence_engine_changed",
      "formula_registry_changed",
      "property_metadata_changed",
      "market_input_changed",
      "financing_input_changed",
      "governance_input_changed",
      "inspection_input_changed",
      "appraisal_input_changed",
      "lease_input_changed",
      "expense_input_changed",
      "income_input_changed",
      "user_preference_changed",
      "strategy_selected_changed",
      "source_promoted",
      "source_demoted",
      "source_conflict_resolved",
      "source_invalidated",
      "manual_override_removed",
    ];

    expect(strategyReevaluationEventDefinitions.map((definition) => definition.eventType).sort()).toEqual(eventTypes.sort());
    expect(strategyReevaluationEventDefinitions.every((definition) => definition.triggeringDependencyTypes.length > 0)).toBe(true);
    expect(STRATEGY_REEVALUATION_EVENT_REGISTRY_VERSION).toContain("v1");
  });

  it("builds the canonical dependency graph from immutable strategy, ranking, underwriting, source, assumption, and scenario records", () => {
    const fixture = rankingFixture();
    const graph = buildStrategyReevaluationDependencyGraph(graphRequest(fixture));

    expect(graph.graphVersion).toBe(STRATEGY_REEVALUATION_DEPENDENCY_GRAPH_VERSION);
    expect(graph.nodes.map((node) => node.dependencyType)).toEqual(expect.arrayContaining([
      "underwriting_output",
      "underwriting_result_set",
      "accepted_input",
      "accepted_assumption",
      "source",
      "strategy_registry",
      "requirement_registry",
      "disqualifier_registry",
      "compatibility_engine",
      "score_engine",
      "confidence_engine",
      "score_result",
      "compatibility_result",
      "ranking_result",
      "scenario_output",
      "formula_registry",
    ]));
    expect(graph.nodes.find((node) => node.dependencyId === "purchase_price")?.relatedStrategyIds).toEqual(["residential.long_term_rental"]);
    expect(graph.graphHash).toContain("strat_reeval_");
    expect(buildStrategyReevaluationDependencyGraph(graphRequest(fixture)).graphHash).toBe(graph.graphHash);
  });

  it("marks only the targeted strategy stale when one accepted input changes", () => {
    const fixture = rankingFixture();
    const graph = buildStrategyReevaluationDependencyGraph(graphRequest(fixture));
    const event = registered(eventRequest("accepted_input_changed", graph, "accepted_input", "purchase_price"), graph);

    expect(event.reevaluationScope).toBe("single_strategy");
    expect(event.affectedStrategyIds).toEqual(["residential.long_term_rental"]);
    expect(event.staleStatuses).toContainEqual(expect.objectContaining({ strategyId: "residential.long_term_rental", staleStatus: "stale" }));
    expect(event.staleStatuses).toContainEqual(expect.objectContaining({ strategyId: "residential.brrrr", staleStatus: "not_affected" }));
  });

  it("uses all-compatible scope when assumptions or sources are broad", () => {
    const fixture = rankingFixture();
    const graph = buildStrategyReevaluationDependencyGraph(graphRequest(fixture));
    const event = registered(eventRequest("accepted_assumption_changed", graph, "accepted_assumption", "market-rent-assumption"), graph);

    expect(event.reevaluationScope).toBe("all_compatible_strategies");
    expect(event.affectedStrategyIds).toEqual(["residential.brrrr", "residential.long_term_rental"]);
    expect(event.staleStatuses.every((status) => status.staleStatus === "stale")).toBe(true);
  });

  it("handles snapshot, underwriting, registry, confidence, ranking, and scenario changes with the required scopes", () => {
    const fixture = rankingFixture();
    const graph = buildStrategyReevaluationDependencyGraph(graphRequest(fixture));

    expect(registered(eventRequest("snapshot_replaced", graph, "underwriting_snapshot", fixture.run.snapshotId), graph).reevaluationScope).toBe("entire_strategy_set");
    expect(registered(eventRequest("snapshot_replaced", graph, "underwriting_snapshot", fixture.run.snapshotId), graph).staleStatuses[0].staleStatus).toBe("superseded");
    expect(registered(eventRequest("underwriting_output_changed", graph, "underwriting_output", "net_operating_income"), graph).reevaluationScope).toBe("underwriting_dependency");
    expect(registered(eventRequest("strategy_registry_changed", graph, "strategy_registry", STRATEGY_REGISTRY_VERSION), graph).staleStatuses[0].staleStatus).toBe("obsolete");
    expect(registered(eventRequest("confidence_engine_changed", graph, "confidence_engine", STRATEGY_CONFIDENCE_MODEL_VERSION), graph).reevaluationScope).toBe("confidence_only");
    expect(registered(eventRequest("user_preference_changed", graph, "user_preference", "risk-preference"), graph).staleStatuses[0].staleStatus).toBe("current");
    expect(registered(eventRequest("scenario_created", graph, "scenario_output", "scenario-downside"), graph).reevaluationScope).toBe("scenario_only");
  });

  it("suppresses duplicate events through identity hashes while excluding timestamps, display strings, actors, locale, and UI state", () => {
    const fixture = rankingFixture();
    const graph = buildStrategyReevaluationDependencyGraph(graphRequest(fixture));
    const first = registered(eventRequest("source_invalidated", graph, "source", "source-tax-record", "2026-08-03T12:00:00.000Z"), graph);
    const second = registerStrategyReevaluationEvent(
      {
        ...eventRequest("source_invalidated", graph, "source", "source-tax-record", "2026-08-04T12:00:00.000Z"),
        actorContext: { ...baseActor(), actorId: "different-actor" },
      },
      graph,
      [first],
    );

    expect(second.status).toBe("registered");
    if (second.status !== "registered") throw new Error("Expected registered event");
    expect(second.event.eventHash).toBe(first.eventHash);
    expect(second.event.eventId).toBe(first.eventId);
    expect(second.event.idempotencyKey).toBe(first.idempotencyKey);
    expect(second.duplicateSuppressed).toBe(true);
    expect(first.eventHash).not.toContain("2026-08-03");
  });

  it("denies cross-workspace and revoked access without leaking affected strategy data", () => {
    const fixture = rankingFixture();
    const graph = buildStrategyReevaluationDependencyGraph(graphRequest(fixture));
    const crossWorkspace = registerStrategyReevaluationEvent({ ...eventRequest("source_demoted", graph, "source", "source-tax-record"), workspaceId: "workspace-2" }, graph);
    const revoked = registerStrategyReevaluationEvent({
      ...eventRequest("source_demoted", graph, "source", "source-tax-record"),
      actorContext: { ...baseActor(), membershipStatus: "revoked" },
    }, graph);

    expect(crossWorkspace.status).toBe("denied");
    expect(crossWorkspace).not.toHaveProperty("event");
    expect(revoked.status).toBe("denied");
    expect(revoked).not.toHaveProperty("event");
  });

  it("preserves historical score, ranking, compatibility, and underwriting records", () => {
    const fixture = rankingFixture();
    const before = JSON.stringify(fixture);
    const graph = buildStrategyReevaluationDependencyGraph(graphRequest(fixture));
    registered(eventRequest("accepted_input_changed", graph, "accepted_input", "purchase_price"), graph);

    expect(JSON.stringify(fixture)).toBe(before);
    expect(Object.isFrozen(graph)).toBe(true);
  });

  it("keeps the reevaluation layer deterministic and isolated from UI, reports, native, AI, providers, scoring execution, and persistence", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "core", "strategyReevaluationEvents.ts"), "utf8");
    const surfaceFiles = ["components", "pages", "hooks"].flatMap((segment) => filesUnder(path.join(process.cwd(), "src", segment)));
    const reportFiles = filesUnder(path.join(process.cwd(), "src", "core")).filter((file) => /report|export/i.test(file));
    const iosFiles = filesUnder(path.join(process.cwd(), "ios"));

    expect(source).not.toMatch(/from\s+["']react["']|JSX|SwiftUI|UIKit|ViewBuilder/i);
    expect(source).not.toMatch(/\bfetch\s*\(|supabase\.|OpenAI|ai\.|provider|MLS|Zillow|Realtor|LoopNet|Crexi/i);
    expect(source).not.toMatch(/\bevaluateStrategyCompatibility\b|\bevaluateStrategyScore\b|\bevaluateStrategyRanking\b|\bexecuteFormula\b|\bbuildUnderwritingCoreOutputRun\b|\bcreateUnderwritingSnapshot\b/i);
    expect(source).not.toMatch(/\bcreateDeal\b|\bcreateProperty\b|\bsaveRun\b|\binsert\b|\bupdate\b|\bdelete\b|\brpc\s*\(/i);
    expect([...surfaceFiles, ...reportFiles, ...iosFiles].some((file) => fs.readFileSync(file, "utf8").includes("registerStrategyReevaluationEvent"))).toBe(false);
    expect(source).toContain(STRATEGY_REEVALUATION_EVENT_HASH_VERSION);
  });
});

function rankingFixture() {
  const rental = fixture("residential.long_term_rental", { outputValues: { pre_tax_cash_flow: 18_000, cash_on_cash_return: 12, debt_service_coverage_ratio: 1.45 } });
  const brrrr = fixture("residential.brrrr", {
    outputValues: { pre_tax_cash_flow: 14_000, cash_on_cash_return: 9, debt_service_coverage_ratio: 1.28 },
    compatibilityOverrides: { compatibilityStatus: "compatible_with_conditions", acceptedAssumptionCount: 1 },
  });
  const ranking = evaluateStrategyRanking(
    { rankingRequestId: "reeval-ranking-1", scoreRequests: [rental.request, brrrr.request] },
    [rental.compatibility, brrrr.compatibility],
    [rental.run, brrrr.run],
  );
  return {
    strategyResults: ranking.rankedResults,
    compatibilityResults: [rental.compatibility, brrrr.compatibility],
    run: rental.run,
    ranking,
  };
}

function graphRequest(fixture: ReturnType<typeof rankingFixture>) {
  return {
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    snapshotId: fixture.run.snapshotId,
    strategyResults: fixture.strategyResults,
    compatibilityResults: fixture.compatibilityResults,
    underwritingRun: fixture.run,
    ranking: fixture.ranking,
    acceptedInputRefs: [
      { sourceId: "purchase_price", sourceHash: "input-hash-purchase-price", strategyIds: ["residential.long_term_rental"], strategyResultIds: [fixture.strategyResults.find((item) => item.strategyId === "residential.long_term_rental")?.scoreResultId ?? ""] },
    ],
    acceptedAssumptionRefs: [
      { sourceId: "market-rent-assumption", sourceHash: "assumption-hash-market-rent" },
    ],
    sourceRefs: [
      { sourceId: "source-tax-record", sourceHash: "source-hash-tax", sourceRefs: ["source-tax-record"], evidenceRefs: ["evidence-tax-record"] },
    ],
    scenarioRefs: [
      { scenarioId: "scenario-downside", scenarioHash: "scenario-hash-downside", strategyIds: ["residential.long_term_rental"] },
    ],
    userPreferenceRefs: [
      { sourceId: "risk-preference", sourceHash: "preference-hash-balanced" },
    ],
  };
}

function eventRequest(
  eventType: StrategyReevaluationEventType,
  graph: ReturnType<typeof buildStrategyReevaluationDependencyGraph>,
  dependencyType: StrategyReevaluationDependencyType,
  dependencyId: string,
  timestamp = "2026-08-03T12:00:00.000Z",
): StrategyReevaluationEventRequest {
  const trigger = graph.nodes.find((node) => node.dependencyType === dependencyType && node.dependencyId === dependencyId);
  if (!trigger) throw new Error(`Missing trigger ${dependencyType}:${dependencyId}`);
  return {
    workspaceId: graph.workspaceId,
    dealId: graph.dealId,
    propertyId: graph.propertyId,
    snapshotId: graph.snapshotId,
    actorContext: baseActor(),
    observedChange: {
      eventType,
      triggeringDependency: {
        dependencyId: trigger.dependencyId,
        dependencyType: trigger.dependencyType,
        dependencyHash: trigger.dependencyHash,
        canonicalOwner: trigger.canonicalOwner,
      },
      triggerSource: "test",
      triggerTimestamp: timestamp,
    },
  };
}

function registered(request: StrategyReevaluationEventRequest, graph: ReturnType<typeof buildStrategyReevaluationDependencyGraph>) {
  const result = registerStrategyReevaluationEvent(request, graph);
  expect(result.status).toBe("registered");
  if (result.status !== "registered") throw new Error("Expected registered event");
  return result.event;
}

function baseActor() {
  return {
    actorId: "user-1",
    workspaceId: "workspace-1",
    membershipStatus: "active" as const,
    permissions: ["deal.read", "property.read", "underwriting.read", "strategy.evaluate"] as StrategyReevaluationPermission[],
    sourceClient: "server" as const,
  };
}

type FixtureOptions = {
  outputValues?: Partial<Record<FormulaId, number>>;
  compatibilityOverrides?: Partial<StrategyCompatibilityResult>;
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
  const score = evaluateStrategyScore(request, compatibility, run);
  return { request, compatibility, run, score };
}

function compatibilityFixture(strategyId: string, strategyVersion: string, overrides: Partial<StrategyCompatibilityResult> = {}): StrategyCompatibilityResult {
  const requirementResultManifest: StrategyCompatibilityResult["requirementResultManifest"] = [{
    requirementId: "income-support",
    requirementVersion: "1.0.0",
    strategyId,
    strategyVersion,
    category: "fixture",
    blockingClassification: "blocking" as const,
    evaluationStatus: "satisfied" as const,
    canonicalSubjectReference: "income-support",
    requiredInputRefs: ["purchase_price"],
    requiredOutputRefs: ["net_operating_income"],
    actualCanonicalValuesUsed: [{ ref: "net_operating_income", state: "available" as const, valueHash: "output-hash-net_operating_income" }],
    sourceRefs: ["source-tax-record"],
    evidenceRefs: ["evidence-tax-record"],
    conditionResult: "true" as const,
    missingDependencies: [],
    conflicts: [],
    verificationState: "source_backed",
    assumptionState: overrides.acceptedAssumptionCount ? "accepted" as const : "none" as const,
    professionalReviewRequired: false,
    explanation: "Fixture requirement satisfied.",
    deterministicResultHash: `requirement-hash-${strategyId}`,
    stableOrdinal: 1,
  }];
  const base = {
    compatibilityResultId: `compat-${strategyId.replace(/[^a-z0-9]/gi, "-")}`,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyId: "property-1",
    snapshotId: "snapshot-1",
    underwritingRunId: "run-1",
    strategyId,
    strategyVersion,
    strategyRegistryVersion: STRATEGY_REGISTRY_VERSION,
    requirementRegistryVersion: STRATEGY_REQUIREMENT_REGISTRY_VERSION,
    disqualifierRegistryVersion: STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
    compatibilityEngineVersion: STRATEGY_COMPATIBILITY_ENGINE_VERSION,
    compatibilityStatus: "compatible" as const,
    evaluationReadiness: "complete_evidence" as const,
    hardDisqualifierCount: 0,
    triggeredDisqualifierCount: 0,
    satisfiedRequirementCount: 1,
    conditionalRequirementCount: 0,
    unsatisfiedRequirementCount: 0,
    missingRequirementCount: 0,
    conflictedRequirementCount: 0,
    unavailableDependencyCount: 0,
    acceptedAssumptionCount: 0,
    preliminaryAssumptionCount: 0,
    professionalReviewCount: 0,
    requirementResultManifest,
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
    deterministicResultHash: `compat-hash-${strategyId}-${base.compatibilityStatus}-${base.acceptedAssumptionCount}`,
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
    runId: "run-1",
    workspaceId: compatibility.workspaceId,
    dealId: compatibility.dealId,
    snapshotId: compatibility.snapshotId,
    snapshotHash: "snapshot-hash-1",
    snapshotManifestHash: "manifest-hash-1",
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
    inputRefs: ["purchase_price"],
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

function filesUnder(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return filesUnder(fullPath);
    return /\.(ts|tsx|swift)$/.test(entry.name) ? [fullPath] : [];
  });
}

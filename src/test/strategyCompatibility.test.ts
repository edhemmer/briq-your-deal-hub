import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FORMULA_REGISTRY_VERSION, type FormulaId } from "../core/formulaRegistry";
import {
  evaluateStrategyCompatibility,
  evaluateStrategyCompatibilityBatch,
  resolveCompatibilityEngineVersion,
  resolveLatestActiveCompatibilityEngine,
  STRATEGY_COMPATIBILITY_ENGINE_VERSION,
  type StrategyCompatibilityDependencyContext,
  type StrategyCompatibilityDependencyValue,
  type StrategyCompatibilityEvaluationRequest,
} from "../core/strategyCompatibility";
import {
  STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
  STRATEGY_REQUIREMENT_REGISTRY_VERSION,
} from "../core/strategyRequirements";
import {
  STRATEGY_REGISTRY_VERSION,
  resolveStrategyDefinition,
  type StrategyDefinition,
} from "../core/strategyRegistry";
import {
  UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
  UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
  type UnderwritingCoreFormulaResultRecord,
  type UnderwritingCoreOutputRunRecord,
} from "../core/underwritingCoreOutputs";
import {
  UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
  UNDERWRITING_SNAPSHOT_HASH_VERSION,
  type UnderwritingSnapshotInputRecord,
  type UnderwritingSnapshotRecord,
} from "../core/underwritingSnapshots";
import type { UnderwritingInputId, UnderwritingMode, UnderwritingPropertyProfile } from "../core/underwritingInputSchemas";
import { UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION } from "../core/underwritingValidation";

describe("strategy compatibility engine", () => {
  it("resolves active engine versions and refuses non-active versions for new evaluations", () => {
    expect(resolveLatestActiveCompatibilityEngine().semanticVersion).toBe(STRATEGY_COMPATIBILITY_ENGINE_VERSION);
    expect(resolveCompatibilityEngineVersion("0.9.0").status).toBe("deprecated");
    expect(resolveCompatibilityEngineVersion("2.0.0").status).toBe("disabled");
  });

  it("evaluates long-term rental compatibility without creating scores, ranks, confidence, or recommendations", () => {
    const compatible = runFixture("residential.long_term_rental", { profile: "single_family", mode: "rental" });
    const withAssumptions = runFixture("residential.long_term_rental", { profile: "single_family", mode: "rental", inputStates: { scheduled_income_monthly: { assumptionState: "accepted" } } });
    const missingRent = runFixture("residential.long_term_rental", { profile: "single_family", mode: "rental", missingInputs: ["scheduled_income_monthly"] });
    const wrongProfile = runFixture("residential.long_term_rental", { profile: "land", mode: "rental" });

    expect(compatible.compatibilityStatus).toBe("compatible");
    expect(compatible.satisfiedRequirementCount).toBeGreaterThan(0);
    expect(compatible).not.toHaveProperty("score");
    expect(compatible).not.toHaveProperty("rank");
    expect(compatible).not.toHaveProperty("recommendation");
    expect(withAssumptions.compatibilityStatus).toBe("compatible_with_conditions");
    expect(withAssumptions.acceptedAssumptionCount).toBeGreaterThan(0);
    expect(missingRent.compatibilityStatus).toBe("uncertain");
    expect(missingRent.missingDependencies).toContain("scheduled_income_monthly");
    expect(wrongProfile.compatibilityStatus).toBe("incompatible");
    expect(wrongProfile.triggeredDisqualifierCount).toBeGreaterThan(0);
  });

  it("handles house hack, BRRRR, flip, multifamily, commercial, land, and development structural compatibility", () => {
    expect(runFixture("residential.house_hack", { profile: "two_to_four_unit", mode: "owner_occupied" }).compatibilityStatus).toBe("compatible");
    expect(runFixture("residential.house_hack", { profile: "office", mode: "owner_occupied" }).compatibilityStatus).toBe("incompatible");
    expect(runFixture("residential.brrrr", { profile: "single_family", mode: "rental", outputStates: { net_operating_income: "preliminary" } }).compatibilityStatus).toBe("uncertain");
    expect(runFixture("residential.fix_and_flip", { profile: "single_family", mode: "flip", missingInputs: ["disposition_price"] }).compatibilityStatus).toBe("uncertain");
    expect(runFixture("multifamily.stabilized_hold", { profile: "multifamily", mode: "rental" }).compatibilityStatus).toBe("compatible");
    expect(runFixture("multifamily.stabilized_hold", { profile: "single_family", mode: "rental" }).compatibilityStatus).toBe("incompatible");
    expect(runFixture("commercial.owner_user", { profile: "office", mode: "commercial_income" }).compatibilityStatus).toBe("compatible");
    expect(runFixture("commercial.owner_user", { profile: "single_family", mode: "commercial_income" }).compatibilityStatus).toBe("incompatible");
    expect(runFixture("land.raw_land_hold", { profile: "land", mode: "land_hold" }).compatibilityStatus).toBe("compatible");
    expect(runFixture("development.entitlement", { profile: "land", mode: "development", futureOverrides: { "zoning-and-entitlements": { value: true, verificationState: "confirmed" } } }).compatibilityStatus).toBe("incompatible");
  });

  it("fails closed when required future or underwriting dependencies are unavailable and never treats later modules as clearance", () => {
    const noLegalClearance = runFixture("residential.long_term_rental", {
      profile: "single_family",
      mode: "rental",
      omitFutureDependencies: ["governance-legal-clearance"],
    });
    const unavailableUnderwriting = runFixture("residential.long_term_rental", {
      profile: "single_family",
      mode: "rental",
      outputStates: { net_operating_income: "schema_unsupported" },
    });

    expect(noLegalClearance.compatibilityStatus).toBe("uncertain");
    expect(noLegalClearance.missingDependencies).toContain("governance-legal-clearance");
    expect(unavailableUnderwriting.compatibilityStatus).toBe("uncertain");
    expect(unavailableUnderwriting.unavailableDependencyCount).toBeGreaterThan(0);
  });

  it("evaluates multiple user-selected strategies in stable registry order without ranking them", () => {
    const strategy = resolveStrategyDefinition("residential.long_term_rental");
    const { snapshot, run, request } = fixtureParts(strategy, { profile: "single_family", mode: "rental" });
    const result = evaluateStrategyCompatibilityBatch(
      {
        batchRequestId: "batch-1",
        maximumCandidateCount: 12,
        candidates: [
          { strategyId: "residential.brrrr", strategyVersion: "latest" },
          { strategyId: "residential.long_term_rental", strategyVersion: "latest" },
          { strategyId: "residential.owner_occupied", strategyVersion: "latest" },
        ],
        baseRequest: omitRequestCandidate(request),
      },
      snapshot,
      run,
    );

    expect(result.completionStatus).toBe("complete");
    expect(result.stableEvaluationOrder).toEqual([
      "residential.owner_occupied@latest",
      "residential.long_term_rental@latest",
      "residential.brrrr@latest",
    ]);
    expect(result.results.map((item) => item.strategyId)).toEqual([
      "residential.owner_occupied",
      "residential.long_term_rental",
      "residential.brrrr",
    ]);
  });

  it("returns not_evaluated for stale hashes, unauthorized actors, and disabled engines", () => {
    const strategy = resolveStrategyDefinition("residential.long_term_rental");
    const { snapshot, run, request } = fixtureParts(strategy, { profile: "single_family", mode: "rental" });

    expect(evaluateStrategyCompatibility({ ...request, expectedSnapshotHash: "stale" }, snapshot, run).compatibilityStatus).toBe("not_evaluated");
    expect(evaluateStrategyCompatibility({ ...request, actorContext: { ...request.actorContext, membershipStatus: "revoked" } }, snapshot, run).errors[0]?.code).toBe("unauthorized_deal");
    expect(evaluateStrategyCompatibility({ ...request, compatibilityEngineVersion: "2.0.0" }, snapshot, run).errors[0]?.code).toBe("compatibility_engine_version_not_found");
  });

  it("keeps the compatibility layer runtime-neutral and free of UI, network, AI, scoring, ranking, and calculation execution", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src", "core", "strategyCompatibility.ts"), "utf8");

    expect(source).not.toMatch(/from\s+["']react["']|JSX|SwiftUI|UIKit|ViewBuilder/i);
    expect(source).not.toMatch(/\bfetch\s*\(|supabase\.|OpenAI|ai\./i);
    expect(source).not.toMatch(/\bexecuteFormula\b|\bbuildUnderwritingCoreOutputRun\b|\bcreateUnderwritingSnapshot\b/i);
    expect(source).not.toMatch(/\b(score|rank|ranking|recommendation|recommend)\b/i);
  });
});

type FixtureOptions = {
  profile: UnderwritingPropertyProfile;
  mode: UnderwritingMode;
  missingInputs?: UnderwritingInputId[];
  inputStates?: Partial<Record<UnderwritingInputId, { completenessState?: string; assumptionState?: string; conflictState?: string }>>;
  outputStates?: Partial<Record<FormulaId, UnderwritingCoreFormulaResultRecord["status"]>>;
  futureOverrides?: Record<string, Partial<StrategyCompatibilityDependencyValue>>;
  omitFutureDependencies?: string[];
};

function runFixture(strategyId: string, options: FixtureOptions) {
  const strategy = resolveStrategyDefinition(strategyId);
  const { request, snapshot, run } = fixtureParts(strategy, options);
  return evaluateStrategyCompatibility(request, snapshot, run);
}

function fixtureParts(strategy: StrategyDefinition, options: FixtureOptions) {
  const snapshot = snapshotFixture(strategy, options);
  const run = runFixtureRecord(strategy, snapshot, options);
  const request: StrategyCompatibilityEvaluationRequest = {
    evaluationRequestId: `eval-${strategy.strategyId}`,
    workspaceId: snapshot.workspaceId,
    dealId: snapshot.dealId,
    propertyId: snapshot.propertyIds[0],
    underwritingSnapshotId: snapshot.snapshotId,
    underwritingRunId: run.runId,
    expectedSnapshotHash: snapshot.contentHash,
    expectedResultSetHash: run.resultSetHash,
    strategyId: strategy.strategyId,
    strategyVersion: "latest",
    strategyRegistryVersion: STRATEGY_REGISTRY_VERSION,
    requirementRegistryVersion: STRATEGY_REQUIREMENT_REGISTRY_VERSION,
    disqualifierRegistryVersion: STRATEGY_HARD_DISQUALIFIER_REGISTRY_VERSION,
    compatibilityEngineVersion: STRATEGY_COMPATIBILITY_ENGINE_VERSION,
    dependencyContext: dependencyContextFixture(strategy, options),
    actorContext: {
      actorId: "user-1",
      workspaceId: snapshot.workspaceId,
      membershipStatus: "active",
      permissions: ["deal.read", "property.read", "underwriting.read", "strategy.evaluate"],
      sourceClient: "server",
    },
    idempotencyKey: `idem-${strategy.strategyId}`,
    requestedAt: "2026-07-31T12:00:00.000Z",
  };
  return { snapshot, run, request };
}

function omitRequestCandidate(request: StrategyCompatibilityEvaluationRequest) {
  const { evaluationRequestId, strategyId, strategyVersion, idempotencyKey, ...base } = request;
  void evaluationRequestId;
  void strategyId;
  void strategyVersion;
  void idempotencyKey;
  return base;
}

function snapshotFixture(strategy: StrategyDefinition, options: FixtureOptions): UnderwritingSnapshotRecord {
  const inputs = strategy.requiredCanonicalInputIds
    .filter((inputId) => !options.missingInputs?.includes(inputId))
    .map((inputId, index) => inputRecord(inputId, inputValue(inputId, options.profile), index + 1, options.inputStates?.[inputId]));

  return {
    snapshotId: `snapshot-${strategy.machineKey}`,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    primaryPropertyId: "property-1",
    propertyIds: ["property-1"],
    snapshotSequence: 1,
    schemaId: "schema-test",
    schemaVersion: "1.0.0",
    schemaRegistryVersion: "schema-registry-test",
    inputRegistryVersion: "underwriting-input-registry-v1",
    validationRegistryVersion: UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
    normalizationRegistryVersion: "underwriting-normalization-registry-v1",
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    snapshotContractVersion: UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
    snapshotHashVersion: UNDERWRITING_SNAPSHOT_HASH_VERSION,
    sourceValidationId: "validation-1",
    sourceValidationHash: "validation-hash-1",
    propertyVersions: { "property-1": "1" },
    calculationCurrency: "USD",
    unitSystem: "imperial",
    reportingPeriod: "annual",
    readinessState: "ready_confirmed",
    isExecutable: true,
    inputCount: inputs.length,
    missingRequiredInputIds: [...(options.missingInputs ?? [])].sort(),
    invalidRequiredInputIds: [],
    conflictedRequiredInputIds: [],
    provisionalRequiredInputIds: [],
    blockingReasons: [],
    warnings: [],
    contentHash: `snapshot-hash-${strategy.machineKey}`,
    manifestHash: `manifest-hash-${strategy.machineKey}`,
    reason: "initial_underwriting",
    actorId: "user-1",
    idempotencyKey: `snapshot-idem-${strategy.strategyId}`,
    createdAt: "2026-07-31T12:00:00.000Z",
    inputs,
    provenance: [],
    formulaManifest: [],
  };
}

function inputRecord(
  inputId: UnderwritingInputId,
  normalizedValue: string | number | boolean | null,
  stableOrdinal: number,
  state?: { completenessState?: string; assumptionState?: string; conflictState?: string },
): UnderwritingSnapshotInputRecord {
  return {
    inputId,
    requirementState: "required",
    validationStatus: "valid",
    canonicalDataType: typeof normalizedValue,
    normalizedValue,
    displayValue: String(normalizedValue ?? ""),
    canonicalUnit: typeof normalizedValue === "number" ? "currency" : "text",
    canonicalPeriod: "one_time",
    canonicalCurrency: typeof normalizedValue === "number" ? "USD" : undefined,
    rawAcceptedValueRef: normalizedValue,
    completenessState: state?.completenessState ?? "complete",
    assumptionState: state?.assumptionState ?? "none",
    conflictState: state?.conflictState ?? "none",
    roundingApplied: false,
    conversionApplied: false,
    deterministicInputHash: `input-hash-${inputId}-${stableOrdinal}`,
    stableOrdinal,
  };
}

function runFixtureRecord(strategy: StrategyDefinition, snapshot: UnderwritingSnapshotRecord, options: FixtureOptions): UnderwritingCoreOutputRunRecord {
  const results = strategy.requiredUnderwritingOutputIds.map((formulaId, index) => outputRecord(formulaId, snapshot, index + 1, options.outputStates?.[formulaId] ?? "calculated"));
  return {
    runId: `run-${strategy.machineKey}`,
    workspaceId: snapshot.workspaceId,
    dealId: snapshot.dealId,
    snapshotId: snapshot.snapshotId,
    snapshotHash: snapshot.contentHash,
    snapshotManifestHash: snapshot.manifestHash,
    engineVersion: UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    hashVersion: UNDERWRITING_CORE_OUTPUT_HASH_VERSION,
    status: "complete",
    requestedBy: "user-1",
    idempotencyKey: `run-idem-${strategy.strategyId}`,
    requestedAt: "2026-07-31T12:00:00.000Z",
    startedAt: "2026-07-31T12:00:00.000Z",
    completedAt: "2026-07-31T12:00:01.000Z",
    calculationOrder: strategy.requiredUnderwritingOutputIds,
    resultSetHash: `result-hash-${strategy.machineKey}`,
    dependencyGraphHash: `dependency-hash-${strategy.machineKey}`,
    formulaVersionManifestHash: `formula-version-hash-${strategy.machineKey}`,
    resultCount: results.length,
    calculatedResultCount: results.filter((result) => result.status === "calculated").length,
    warningCount: 0,
    blockedResultCount: 0,
    incompleteResultCount: results.filter((result) => result.status === "incomplete").length,
    preliminaryResultCount: results.filter((result) => result.status === "preliminary").length,
    warnings: [],
    errors: [],
    assumptionDisclosures: [],
    snapshotReadinessState: snapshot.readinessState,
    results,
  };
}

function outputRecord(
  formulaId: FormulaId,
  snapshot: UnderwritingSnapshotRecord,
  stableOrdinal: number,
  status: UnderwritingCoreFormulaResultRecord["status"],
): UnderwritingCoreFormulaResultRecord {
  return {
    resultId: `result-${formulaId}`,
    runId: `run-${snapshot.snapshotId}`,
    workspaceId: snapshot.workspaceId,
    dealId: snapshot.dealId,
    snapshotId: snapshot.snapshotId,
    formulaId,
    formulaVersion: "1.0.0",
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    outputGroup: "returns",
    status,
    rawValue: status === "calculated" || status === "calculated_with_warning" || status === "preliminary" ? 100 : undefined,
    displayValue: status === "calculated" || status === "calculated_with_warning" || status === "preliminary" ? 100 : undefined,
    displayText: "100",
    outputUnit: "currency",
    outputPeriod: "annual",
    currency: "USD",
    inputRefs: [],
    dependencyResultIds: [],
    sourceFactIds: [`source-${formulaId}`],
    assumptionIds: status === "calculated_with_warning" ? [`assumption-${formulaId}`] : [],
    preliminaryInputIds: status === "preliminary" ? [`preliminary-${formulaId}`] : [],
    missingInputIds: status === "incomplete" ? [`missing-${formulaId}`] : [],
    blockedInputIds: [],
    warnings: [],
    errors: [],
    formulaExplanation: "Fixture output.",
    assumptionDisclosure: [],
    provenance: [],
    deterministicHash: `output-hash-${formulaId}-${status}`,
    stableOrdinal,
  };
}

function dependencyContextFixture(strategy: StrategyDefinition, options: FixtureOptions): StrategyCompatibilityDependencyContext {
  const futureIds = new Set([
    ...strategy.futureMarketDependencies,
    ...strategy.futureFinancingDependencies,
    ...strategy.futureGovernanceLegalDependencies,
    ...strategy.futurePropertyConditionDependencies,
    ...strategy.futureInvestorFitDependencies,
    "governance-legal-clearance",
  ]);
  for (const omitted of options.omitFutureDependencies ?? []) futureIds.delete(omitted);
  const futureDependencies = [...futureIds].sort().map((dependencyId) => dependencyValue(dependencyId, options.futureOverrides?.[dependencyId]));
  return {
    contextVersion: "strategy-compatibility-dependency-context-v1",
    propertyProfile: options.profile,
    underwritingMode: options.mode,
    transactionContext: strategy.supportedTransactionContexts[0],
    propertyPhysicalCharacteristics: { property_type: options.profile },
    acceptedUserConstraints: [],
    acceptedAssumptions: [],
    explicitRestrictions: [],
    financingAvailability: [],
    futureDependencies,
  };
}

function dependencyValue(dependencyId: string, override?: Partial<StrategyCompatibilityDependencyValue>): StrategyCompatibilityDependencyValue {
  return {
    dependencyId,
    availability: "available",
    value: false,
    canonicalValueHash: `dependency-hash-${dependencyId}`,
    sourceRefs: [`source-${dependencyId}`],
    evidenceRefs: [`evidence-${dependencyId}`],
    verificationState: "confirmed",
    assumptionState: "none",
    professionalReviewRequired: false,
    explanation: "Fixture dependency.",
    ...override,
  };
}

function inputValue(inputId: UnderwritingInputId, profile: UnderwritingPropertyProfile) {
  if (inputId === "property_type") return profile;
  if (inputId === "financing_used") return true;
  if (inputId === "unit_count") return profile === "multifamily" ? 8 : 1;
  if (inputId === "scheduled_income_monthly" || inputId === "monthly_rent") return 2200;
  if (inputId === "property_value" || inputId === "disposition_price") return 300000;
  if (inputId === "initial_repairs" || inputId === "development_costs") return 40000;
  if (inputId === "annual_interest_rate") return 7;
  if (inputId === "amortization_years") return 30;
  return 100000;
}

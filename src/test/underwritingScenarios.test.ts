import { describe, expect, it } from "vitest";
import { FORMULA_REGISTRY_VERSION, type FormulaId } from "../core/formulaRegistry";
import {
  PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
  UNDERWRITING_INPUT_REGISTRY_VERSION,
  resolveUnderwritingInputDefinition,
  type UnderwritingInputId,
} from "../core/underwritingInputSchemas";
import {
  UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
  UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
  validateAndNormalizeUnderwritingInputs,
  type UnderwritingRawInputValue,
  type UnderwritingValidationRequest,
} from "../core/underwritingValidation";
import {
  buildUnderwritingSnapshotDraft,
  type UnderwritingSnapshotCreationRequest,
  type UnderwritingSnapshotRecord,
} from "../core/underwritingSnapshots";
import {
  buildUnderwritingCoreOutputRun,
  type UnderwritingCoreOutputRunRecord,
  type UnderwritingCoreOutputRunRequest,
} from "../core/underwritingCoreOutputs";
import {
  UNDERWRITING_SENSITIVITY_LIMITS,
  buildUnderwritingScenarioRun,
  buildUnderwritingSensitivityRun,
  projectScenarioComparison,
  projectScenarioOverrides,
  projectScenarioSummary,
  projectSensitivityPoints,
  type UnderwritingScenarioOverrideRequest,
} from "../core/underwritingScenarios";

const timestamp = "2026-07-30T16:00:00.000Z";

function raw(inputId: UnderwritingInputId, rawValue: string | number | boolean | null, overrides: Partial<UnderwritingRawInputValue> = {}): UnderwritingRawInputValue {
  const definition = resolveUnderwritingInputDefinition(inputId);
  if (!definition) throw new Error(`Missing underwriting input definition ${inputId}`);
  return {
    inputId,
    rawValue,
    sourceUnit: definition.canonicalUnit,
    sourcePeriod: definition.canonicalPeriod,
    sourceCurrency: definition.currencyBehavior === "required" ? "USD" : undefined,
    sourceFactId: `fact-${inputId}`,
    sourceRecordId: `source-${inputId}`,
    evidenceId: "11111111-1111-4111-8111-111111111111",
    inputVersion: `input-${inputId}-v1`,
    classification: "accepted_fact",
    verificationState: "source_backed",
    conflictState: "none",
    proposalStatus: "accepted",
    sourceClassification: "manual",
    ...overrides,
  };
}

function rentalInputs(overrides: Partial<Record<UnderwritingInputId, UnderwritingRawInputValue | undefined>> = {}) {
  const inputs = {
    property_type: raw("property_type", "single_family"),
    purchase_price: raw("purchase_price", "$200,000"),
    down_payment_amount: raw("down_payment_amount", "$50,000"),
    down_payment_percent: raw("down_payment_percent", "25%"),
    closing_costs: raw("closing_costs", "$4,000"),
    initial_repairs: raw("initial_repairs", "$0"),
    initial_reserves: raw("initial_reserves", "$3,000"),
    total_cash_invested: raw("total_cash_invested", "$57,000"),
    value_basis: raw("value_basis", "$200,000"),
    property_value: raw("property_value", "$200,000"),
    financing_used: raw("financing_used", true),
    association_exists: raw("association_exists", false),
    third_party_management_selected: raw("third_party_management_selected", false),
    loan_amount: raw("loan_amount", "$150,000"),
    annual_interest_rate: raw("annual_interest_rate", "7%"),
    amortization_years: raw("amortization_years", 30),
    loan_term_months: raw("loan_term_months", 360),
    monthly_principal_interest: raw("monthly_principal_interest", "$997.95"),
    monthly_rent: raw("monthly_rent", "$2,000"),
    scheduled_income_monthly: raw("scheduled_income_monthly", "$2,000"),
    other_income: raw("other_income", "$0"),
    vacancy_loss: raw("vacancy_loss", "$1,200"),
    credit_loss: raw("credit_loss", "$0"),
    taxes: raw("taxes", "$5,000"),
    insurance: raw("insurance", "$1,200"),
    hoa: raw("hoa", "$0"),
    utilities: raw("utilities", "$0"),
    maintenance: raw("maintenance", "$2,400"),
    management: raw("management", "$1,920"),
    other_operating_expenses: raw("other_operating_expenses", "$0"),
    ...overrides,
  } satisfies Record<string, UnderwritingRawInputValue | undefined>;
  return Object.fromEntries(Object.entries(inputs).filter(([, value]) => value !== undefined)) as Record<string, UnderwritingRawInputValue>;
}

function validationRequest(inputs: Record<string, UnderwritingRawInputValue>, overrides: Partial<UnderwritingValidationRequest> = {}): UnderwritingValidationRequest {
  return {
    validationId: "validation-scenario-base-1",
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyIds: ["property-1"],
    schemaId: "single_family_rental",
    schemaVersion: "1.0.0",
    schemaRegistryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
    inputRegistryVersion: UNDERWRITING_INPUT_REGISTRY_VERSION,
    validationRegistryVersion: UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
    normalizationRegistryVersion: UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    calculationCurrency: "USD",
    calculationPeriodContext: { unitCount: 1, rentableSquareFeet: 1_200, grossBuildingArea: 1_400 },
    inputs,
    requestTimestamp: timestamp,
    authorization: {
      actorId: "user-1",
      workspaceId: "workspace-1",
      dealWorkspaceId: "workspace-1",
      propertyWorkspaceId: "workspace-1",
      membershipStatus: "active",
      permissions: ["deal.read", "property.read", "underwriting.read"],
    },
    ...overrides,
  };
}

function baseSnapshot(overrides: Partial<UnderwritingSnapshotCreationRequest> = {}) {
  const validationResult = overrides.validationResult ?? validateAndNormalizeUnderwritingInputs(validationRequest(rentalInputs()));
  return buildUnderwritingSnapshotDraft({
    workspaceId: "workspace-1",
    dealId: "deal-1",
    primaryPropertyId: "property-1",
    propertyIds: ["property-1"],
    validationResult,
    actorId: "user-1",
    idempotencyKey: "snapshot-scenario-base-1",
    reason: "initial_underwriting",
    createdAt: timestamp,
    dealVersion: 3,
    propertyVersions: { "property-1": 2 },
    calculationCurrency: "USD",
    unitSystem: "imperial",
    valuationDate: "2026-07-30",
    holdPeriodMonths: 120,
    intendedUnderwritingMode: "rental",
    reportingPeriod: "annual",
    ...overrides,
  }).snapshot;
}

function runRequest(targetSnapshot: UnderwritingSnapshotRecord, overrides: Partial<UnderwritingCoreOutputRunRequest> = {}): UnderwritingCoreOutputRunRequest {
  return {
    workspaceId: targetSnapshot.workspaceId,
    dealId: targetSnapshot.dealId,
    snapshotId: targetSnapshot.snapshotId,
    expectedSnapshotHash: targetSnapshot.contentHash,
    actorId: "user-1",
    idempotencyKey: "core-output-scenario-base-1",
    requestedAt: timestamp,
    ...overrides,
  };
}

function baseRun(targetSnapshot = baseSnapshot()) {
  return buildUnderwritingCoreOutputRun(targetSnapshot, runRequest(targetSnapshot));
}

function override(inputId: UnderwritingInputId, proposedRawValue: string | number | boolean | null, changes: Partial<UnderwritingScenarioOverrideRequest> = {}): UnderwritingScenarioOverrideRequest {
  const definition = resolveUnderwritingInputDefinition(inputId);
  return {
    inputId,
    proposedRawValue,
    originalUnit: definition?.canonicalUnit,
    originalPeriod: definition?.canonicalPeriod,
    currency: definition?.currencyBehavior === "required" ? "USD" : undefined,
    assumptionClassification: "user_scenario_assumption",
    rationaleCategory: "user_test",
    sourceProvenanceType: "scenario_user_entry",
    ...changes,
  };
}

function scenario(overrides: UnderwritingScenarioOverrideRequest[], snapshot = baseSnapshot(), run: UnderwritingCoreOutputRunRecord = baseRun(snapshot)) {
  return buildUnderwritingScenarioRun({
    workspaceId: "workspace-1",
    dealId: "deal-1",
    baseSnapshot: snapshot,
    baseRun: run,
    scenarioName: "Rent and financing test",
    scenarioType: "custom",
    overrides,
    actorId: "user-1",
    idempotencyKey: "scenario-run-1",
    requestedAt: timestamp,
  });
}

describe("underwriting scenarios", () => {
  it("creates named scenarios by deriving one immutable scenario snapshot from a base snapshot and reusing Core Outputs", () => {
    const snapshot = baseSnapshot();
    const run = baseRun(snapshot);
    const beforeHash = snapshot.contentHash;
    const record = scenario([
      override("purchase_price", "$210,000"),
      override("annual_interest_rate", "7.5%", { rationaleCategory: "financing_term" }),
      override("scheduled_income_monthly", "$2,100", { rationaleCategory: "income_assumption" }),
      override("taxes", "$5,400", { rationaleCategory: "expense_assumption" }),
      override("insurance", "$1,300", { rationaleCategory: "operating_assumption" }),
    ], snapshot, run);

    expect(record.scenario.scenarioName).toBe("Rent and financing test");
    expect(record.scenario.scenarioType).toBe("custom");
    expect(record.scenario.overrideCount).toBe(5);
    expect(record.scenario.baseSnapshotId).toBe(snapshot.snapshotId);
    expect(record.scenario.baseRunId).toBe(run.runId);
    expect(record.scenarioRun.snapshotId).toBe(record.scenarioSnapshot.scenarioSnapshot.snapshotId);
    expect(record.scenarioRun.resultSetHash).toContain("fnv1a32:");
    expect(record.scenarioSnapshot.baseSnapshotHash).toBe(beforeHash);
    expect(snapshot.contentHash).toBe(beforeHash);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.scenarioSnapshot.scenarioSnapshot)).toBe(true);
    expect(record.scenarioRun.formulaRegistryVersion).toBe(FORMULA_REGISTRY_VERSION);
  });

  it("supports approved scenario types without adding ranking or recommendations", () => {
    const snapshot = baseSnapshot();
    const run = baseRun(snapshot);
    for (const scenarioType of ["financing", "income", "expense", "acquisition", "operating"] as const) {
      const record = buildUnderwritingScenarioRun({
        workspaceId: "workspace-1",
        dealId: "deal-1",
        baseSnapshot: snapshot,
        baseRun: run,
        scenarioName: `${scenarioType} scenario`,
        scenarioType,
        overrides: [override("monthly_rent", "$2,050")],
        actorId: "user-1",
        idempotencyKey: `scenario-${scenarioType}`,
        requestedAt: timestamp,
      });
      expect(record.scenario.scenarioType).toBe(scenarioType);
      expect(JSON.stringify(record)).not.toMatch(/recommend|ranking|best|worst|likely/i);
    }
  });

  it("rejects prohibited identity overrides, derived outputs, duplicate inputs, stale bases, and incomplete base runs", () => {
    expect(scenario([override("property_type", "townhouse")]).errors[0]).toMatchObject({ code: "prohibited_override" });
    expect(scenario([override("net_operating_income", "$1")]).errors[0]).toMatchObject({ code: "scenario_override_invalid" });
    expect(scenario([override("taxes", "$5,100"), override("taxes", "$5,200")]).errors[0]).toMatchObject({ code: "scenario_override_invalid" });

    const snapshot = baseSnapshot();
    const run = baseRun(snapshot);
    const stale = buildUnderwritingScenarioRun({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      baseSnapshot: { ...snapshot, contentHash: "fnv1a32:stale" },
      baseRun: run,
      scenarioName: "Stale",
      scenarioType: "custom",
      overrides: [override("taxes", "$5,100")],
      actorId: "user-1",
      idempotencyKey: "stale-scenario",
      requestedAt: timestamp,
    });
    expect(stale.errors[0]).toMatchObject({ code: "base_snapshot_stale" });

    const incompleteRun = { ...run, status: "incomplete" as const };
    expect(scenario([override("taxes", "$5,100")], snapshot, incompleteRun).errors[0]).toMatchObject({ code: "base_run_incomplete" });
  });

  it("preserves raw override values, normalizes units, discloses assumptions, and blocks invalid relationships", () => {
    const record = scenario([
      override("annual_interest_rate", "7.25%"),
      override("insurance", "$150", { originalPeriod: "monthly" }),
    ]);
    const overrides = projectScenarioOverrides(record);
    expect(overrides.find((item) => item.inputId === "insurance")).toMatchObject({
      baseValue: 1200,
      scenarioValue: 1800,
      assumptionClassification: "user_scenario_assumption",
      validationStatus: "valid_with_warning",
    });
    expect(record.scenario.confidenceState).toBe("accepted_assumptions");
    expect(record.scenarioRun.assumptionDisclosures.length).toBeGreaterThan(0);

    const brokenRelationship = scenario([override("down_payment_amount", "$300,000")]);
    expect(brokenRelationship.scenario.status).toBe("failed");
    expect(brokenRelationship.errors[0]?.code ?? brokenRelationship.scenarioRun.status).toBeTruthy();
  });

  it("marks preliminary overrides as preliminary and keeps unchanged inputs referenced in the derived snapshot", () => {
    const record = scenario([override("vacancy_loss", "$1,500", { assumptionClassification: "preliminary_scenario_assumption" })]);
    expect(record.scenario.status).toBe("preliminary");
    expect(record.scenario.confidenceState).toBe("preliminary");
    expect(record.scenarioSnapshot.changedInputIds).toEqual(["vacancy_loss"]);
    expect(record.scenarioSnapshot.unchangedInputIds).toContain("purchase_price");
  });

  it("creates deterministic base-versus-scenario comparison without judgment labels", () => {
    const first = scenario([override("insurance", "$1,350")]);
    const second = scenario([override("insurance", "$1,350")]);
    expect(first.scenario.scenarioContentHash).toBe(second.scenario.scenarioContentHash);
    expect(first.scenarioSnapshot.scenarioSnapshotHash).toBe(second.scenarioSnapshot.scenarioSnapshotHash);
    expect(first.comparison.comparisonHash).toBe(second.comparison.comparisonHash);
    expect(first.comparison.changedInputIds).toEqual(["insurance"]);
    expect(first.comparison.changedOutputIds.length).toBeGreaterThan(0);
    expect(projectScenarioComparison(first).some((item) => item.rawDelta !== undefined)).toBe(true);
    expect(JSON.stringify(first.comparison)).not.toMatch(/better|worse|winner|recommend/i);
  });

  it("builds bounded explicit and linear one-variable sensitivity points using scenario point runs", () => {
    const snapshot = baseSnapshot();
    const run = baseRun(snapshot);
    const explicit = buildUnderwritingSensitivityRun({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      baseSnapshot: snapshot,
      baseRun: run,
      inputId: "purchase_price",
      method: "explicit_points",
      explicitPoints: [190000, 200000, 200000, 210000],
      targetFormulaIds: ["cash_on_cash_return", "loan_to_value_ratio"],
      actorId: "user-1",
      idempotencyKey: "sensitivity-explicit",
      requestedAt: timestamp,
    });
    expect(explicit.definition.pointCount).toBe(3);
    expect(projectSensitivityPoints(explicit).map((point) => point.testedInputValue)).toEqual([190000, 200000, 210000]);
    expect(explicit.points.every((point) => point.scenarioRun.scenario.scenarioType === "sensitivity_point")).toBe(true);

    const linear = buildUnderwritingSensitivityRun({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      baseSnapshot: snapshot,
      baseRun: run,
      inputId: "annual_interest_rate",
      method: "linear_range",
      minimumValue: 0.06,
      maximumValue: 0.08,
      stepValue: 0.01,
      targetFormulaIds: ["monthly_principal_interest_fixed"],
      actorId: "user-1",
      idempotencyKey: "sensitivity-linear",
      requestedAt: timestamp,
    });
    expect(linear.definition.pointCount).toBe(3);
    expect(linear.points.map((point) => point.testedInputValue)).toEqual([0.06, 0.07, 0.08]);
  });

  it("enforces sensitivity eligibility and centralized limits", () => {
    const snapshot = baseSnapshot();
    const run = baseRun(snapshot);
    const tooMany = buildUnderwritingSensitivityRun({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      baseSnapshot: snapshot,
      baseRun: run,
      inputId: "purchase_price",
      method: "explicit_points",
      explicitPoints: Array.from({ length: UNDERWRITING_SENSITIVITY_LIMITS.maxSensitivityPoints + 1 }, (_, index) => index + 1),
      targetFormulaIds: ["cash_on_cash_return"],
      actorId: "user-1",
      idempotencyKey: "sensitivity-too-many",
      requestedAt: timestamp,
    });
    expect(tooMany.errors[0]).toMatchObject({ code: "sensitivity_limit_exceeded" });

    const notEligible = buildUnderwritingSensitivityRun({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      baseSnapshot: snapshot,
      baseRun: run,
      inputId: "property_type",
      method: "explicit_points",
      explicitPoints: [1],
      targetFormulaIds: ["cash_on_cash_return"],
      actorId: "user-1",
      idempotencyKey: "sensitivity-not-eligible",
      requestedAt: timestamp,
    });
    expect(notEligible.errors.map((error) => error.code)).toContain("input_not_sensitivity_eligible");

    const invalidStep = buildUnderwritingSensitivityRun({
      workspaceId: "workspace-1",
      dealId: "deal-1",
      baseSnapshot: snapshot,
      baseRun: run,
      inputId: "purchase_price",
      method: "linear_range",
      minimumValue: 100000,
      maximumValue: 120000,
      stepValue: 0,
      targetFormulaIds: ["cash_on_cash_return"],
      actorId: "user-1",
      idempotencyKey: "sensitivity-invalid-step",
      requestedAt: timestamp,
    });
    expect(invalidStep.errors[0]).toMatchObject({ code: "invalid_sensitivity_range" });
  });

  it("projects safe summaries and does not write authenticated scenario output to anonymous storage", () => {
    const record = scenario([override("scheduled_income_monthly", "$2,150")]);
    expect(projectScenarioSummary(record)).toMatchObject({
      scenarioId: record.scenario.scenarioId,
      name: "Rent and financing test",
      changedInputCount: 1,
      resultSetShortHash: expect.any(String),
    });
    expect(JSON.stringify(record)).not.toMatch(/localStorage|anonymous|openai|anthropic|market data|zillow/i);
  });

  it("supports target formula IDs with exact formula versions and detects version mismatches structurally", () => {
    const record = scenario([override("insurance", "$1,250")]);
    const formulaId: FormulaId = "total_operating_expenses";
    const output = record.comparison.outputs.find((item) => item.formulaId === formulaId);
    expect(output?.formulaVersionMatches).toBe(true);
    expect(record.scenarioRun.results.every((result) => result.formulaVersion === "1.0.0")).toBe(true);
  });
});

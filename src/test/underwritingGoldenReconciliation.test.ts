import { describe, expect, it } from "vitest";
import {
  FORMULA_REGISTRY_VERSION,
  executeFormula,
  listFormulaDefinitions,
  type FormulaId,
  type FormulaExecutionRequest,
  type FormulaInputValue,
  type FormulaUnit,
  type FormulaPeriod,
} from "../core/formulaRegistry";
import {
  PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
  UNDERWRITING_INPUT_REGISTRY_VERSION,
  resolveUnderwritingInputDefinition,
  resolvePropertyUnderwritingSchema,
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
  projectCoreOutputs,
  type UnderwritingCoreOutputRunRecord,
  type UnderwritingCoreOutputRunRequest,
} from "../core/underwritingCoreOutputs";
import {
  UNDERWRITING_SENSITIVITY_LIMITS,
  buildUnderwritingScenarioRun,
  buildUnderwritingSensitivityRun,
  projectScenarioComparison,
  projectSensitivityPoints,
  type UnderwritingScenarioOverrideRequest,
} from "../core/underwritingScenarios";

const GOLDEN_TIMESTAMP = "2026-07-30T17:00:00.000Z";
const GOLDEN_WORKSPACE_ID = "workspace-golden";
const GOLDEN_ACTOR_ID = "user-golden";
const GOLDEN_PROPERTY_ID = "property-golden";
const MONEY_TOLERANCE = 0.01;
const RATIO_TOLERANCE = 0.0001;

const CORE_FORMULA_IDS: FormulaId[] = [
  "annual_debt_service",
  "capitalization_rate",
  "cash_on_cash_return",
  "debt_service_coverage_ratio",
  "down_payment_amount",
  "effective_gross_income",
  "gross_scheduled_income",
  "loan_amount",
  "loan_to_value_ratio",
  "monthly_principal_interest_fixed",
  "net_operating_income",
  "pre_tax_cash_flow",
  "total_operating_expenses",
];

type GoldenFixture = {
  fixtureId: string;
  title: string;
  schemaId: string;
  propertyType: string;
  expectedNormalized: Partial<Record<UnderwritingInputId, number | string | boolean>>;
  expectedOutputs: Partial<Record<FormulaId, number>>;
  rawInputs: Partial<Record<UnderwritingInputId, string | number | boolean | null>>;
};

const goldenFixtures: GoldenFixture[] = [
  fixture("cash-single-family-rental", "Cash single-family rental", "single_family_rental", {
    financing_used: false,
    property_type: "single_family",
    purchase_price: 180_000,
    down_payment_amount: 180_000,
    down_payment_percent: "100%",
    monthly_principal_interest: 0,
    annual_interest_rate: "0%",
    amortization_years: 30,
    scheduled_income_monthly: 1_950,
    monthly_rent: 1_950,
    vacancy_loss: 1_170,
    taxes: 4_900,
    insurance: 1_100,
    maintenance: 2_340,
    management: 0,
    total_cash_invested: 184_000,
    value_basis: 180_000,
    property_value: 180_000,
  }),
  fixture("financed-single-family-rental", "Financed single-family rental", "single_family_rental", {
    property_type: "single_family",
    purchase_price: 240_000,
    down_payment_amount: 60_000,
    down_payment_percent: "25%",
    loan_amount: 180_000,
    annual_interest_rate: "6.75%",
    amortization_years: 30,
    monthly_principal_interest: 1_167.15,
    scheduled_income_monthly: 2_550,
    monthly_rent: 2_550,
    vacancy_loss: 1_530,
    taxes: 5_950,
    insurance: 1_450,
    maintenance: 3_060,
    management: 2_448,
    total_cash_invested: 69_000,
    value_basis: 240_000,
    property_value: 240_000,
  }),
  fixture("condo-rental-with-hoa", "Condo or townhouse rental with HOA", "condominium_rental", {
    association_exists: true,
    property_type: "condominium",
    purchase_price: 195_000,
    down_payment_amount: 48_750,
    down_payment_percent: "25%",
    loan_amount: 146_250,
    annual_interest_rate: "7%",
    amortization_years: 30,
    monthly_principal_interest: 972.31,
    scheduled_income_monthly: 2_200,
    monthly_rent: 2_200,
    vacancy_loss: 1_320,
    taxes: 4_200,
    insurance: 900,
    hoa: 3_600,
    maintenance: 1_200,
    management: 2_112,
    total_cash_invested: 55_000,
    value_basis: 195_000,
    property_value: 195_000,
  }),
  fixture("two-to-four-unit-rental", "Two-to-four-unit property", "two_to_four_unit_rental", {
    property_type: "two_to_four_unit",
    unit_count: 4,
    occupied_unit_count: 3,
    purchase_price: 420_000,
    down_payment_amount: 105_000,
    down_payment_percent: "25%",
    loan_amount: 315_000,
    annual_interest_rate: "7.25%",
    amortization_years: 30,
    monthly_principal_interest: 2_148.48,
    scheduled_income_monthly: 5_600,
    vacancy_loss: 4_032,
    taxes: 10_800,
    insurance: 3_400,
    maintenance: 6_720,
    management: 5_376,
    utilities: 1_800,
    total_cash_invested: 126_000,
    value_basis: 420_000,
    property_value: 420_000,
  }),
  fixture("multifamily-rental", "Multifamily property", "multifamily_rental", {
    property_type: "multifamily",
    unit_count: 12,
    occupied_unit_count: 11,
    purchase_price: 1_250_000,
    down_payment_amount: 312_500,
    down_payment_percent: "25%",
    loan_amount: 937_500,
    annual_interest_rate: "6.9%",
    amortization_years: 30,
    monthly_principal_interest: 6_174.11,
    scheduled_income_monthly: 18_000,
    vacancy_loss: 12_960,
    other_income: 4_800,
    taxes: 31_000,
    insurance: 11_500,
    maintenance: 21_600,
    management: 17_280,
    utilities: 7_200,
    replacement_reserves: 6_000,
    total_cash_invested: 380_000,
    value_basis: 1_250_000,
    property_value: 1_250_000,
  }),
  fixture("mixed-use-income", "Mixed-use income property", "mixed_use_income", {
    property_type: "mixed_use",
    residential_income_monthly: 4_800,
    commercial_income_monthly: 3_700,
    scheduled_income_monthly: 8_500,
    gross_building_area: 4_800,
    rentable_square_feet: 4_200,
    purchase_price: 780_000,
    down_payment_amount: 195_000,
    down_payment_percent: "25%",
    loan_amount: 585_000,
    annual_interest_rate: "7.1%",
    amortization_years: 25,
    monthly_principal_interest: 4_177.88,
    vacancy_loss: 7_650,
    taxes: 18_500,
    insurance: 7_400,
    maintenance: 12_000,
    management: 8_160,
    total_cash_invested: 235_000,
    value_basis: 780_000,
    property_value: 780_000,
  }),
  fixture("commercial-income", "Commercial income property", "office_commercial_income", {
    property_type: "office",
    rentable_square_feet: 8_000,
    purchase_price: 980_000,
    down_payment_amount: 245_000,
    down_payment_percent: "25%",
    loan_amount: 735_000,
    annual_interest_rate: "7.4%",
    amortization_years: 25,
    monthly_principal_interest: 5_393.52,
    scheduled_income_monthly: 12_400,
    vacancy_loss: 11_904,
    taxes: 24_500,
    insurance: 8_900,
    maintenance: 14_880,
    management: 8_928,
    legal_and_accounting: 2_400,
    total_cash_invested: 298_000,
    value_basis: 980_000,
    property_value: 980_000,
  }),
  fixture("land-hold", "Land or non-income property", "land_hold", {
    property_type: "land",
    lot_size: 2.5,
    purchase_price: 150_000,
    down_payment_amount: 45_000,
    down_payment_percent: "30%",
    loan_amount: 105_000,
    annual_interest_rate: "8%",
    amortization_years: 20,
    monthly_principal_interest: 878.21,
    property_value: 150_000,
    taxes: 2_100,
    insurance: 600,
  }, {
    annual_debt_service: 10_538.52,
    down_payment_amount: 45_000,
    loan_amount: 105_000,
    loan_to_value_ratio: 70,
    monthly_principal_interest_fixed: 878.26,
  }),
];

const edgeFixtures = [
  {
    name: "missing denominator",
    request: formulaRequest("capitalization_rate", {
      net_operating_income: formulaValue(12_000, "currency", "annual"),
      value_basis: formulaValue(0, "currency", "one_time"),
    }),
    expectedStatus: "divide_by_zero",
  },
  {
    name: "unsupported mixed currency",
    request: formulaRequest("loan_amount", {
      purchase_price: formulaValue(200_000, "currency", "one_time", "USD"),
      down_payment_amount: formulaValue(50_000, "currency", "one_time", "CAD"),
    }),
    expectedStatus: "unsupported_currency",
  },
  {
    name: "unsupported unit",
    request: formulaRequest("gross_scheduled_income", {
      scheduled_income_monthly: formulaValue(2_000, "currency", "annual"),
    }),
    expectedStatus: "invalid_input",
  },
  {
    name: "blocked conflict",
    request: formulaRequest("loan_amount", {
      purchase_price: formulaValue(200_000, "currency", "one_time"),
      down_payment_amount: { ...formulaValue(50_000, "currency", "one_time"), conflictState: "unresolved" },
    }),
    expectedStatus: "blocked_conflict",
  },
  {
    name: "formula version missing",
    request: { ...formulaRequest("loan_amount", {
      purchase_price: formulaValue(200_000, "currency", "one_time"),
      down_payment_amount: formulaValue(50_000, "currency", "one_time"),
    }), formulaVersion: "99.0.0" },
    expectedStatus: "version_not_found",
  },
  {
    name: "half-cent rounding",
    request: formulaRequest("down_payment_amount", {
      purchase_price: formulaValue(100.005, "currency", "one_time"),
      down_payment_percent: formulaValue("50%", "percentage", "none"),
    }),
    expectedStatus: "calculated",
    expectedDisplay: 50.01,
  },
];

describe("underwriting golden reconciliation", () => {
  it("covers the canonical property fixture set with stable schema and formula contracts", () => {
    expect(goldenFixtures.map((item) => item.fixtureId)).toEqual([
      "cash-single-family-rental",
      "financed-single-family-rental",
      "condo-rental-with-hoa",
      "two-to-four-unit-rental",
      "multifamily-rental",
      "mixed-use-income",
      "commercial-income",
      "land-hold",
    ]);
    expect(new Set(goldenFixtures.map((item) => item.fixtureId)).size).toBe(goldenFixtures.length);
    expect(listFormulaDefinitions().map((definition) => definition.id).sort()).toEqual(CORE_FORMULA_IDS);
    expect(goldenFixtures.every((item) => resolvePropertyUnderwritingSchema(item.schemaId))).toBe(true);
  });

  it("reconciles production output against an independent oracle for every golden fixture", () => {
    for (const fixtureItem of goldenFixtures) {
      const { validation, snapshot, run } = executeGoldenFixture(fixtureItem);
      const oracle = oracleOutputs(fixtureItem.expectedNormalized);

      expect(validation.overallStatus, fixtureItem.fixtureId).not.toBe("blocked");
      expect(snapshot.formulaManifest.map((entry) => entry.formulaId)).toEqual([...snapshot.formulaManifest.map((entry) => entry.formulaId)].sort());
      expect(snapshot.contentHash).toMatch(/^fnv1a32:/);
      expect(snapshot.manifestHash).toMatch(/^fnv1a32:/);
      expect(run.resultSetHash).toMatch(/^fnv1a32:/);
      expect(run.resultSetHash).toBe(buildUnderwritingCoreOutputRun(snapshot, runRequest(snapshot, fixtureItem.fixtureId)).resultSetHash);
      expect(projectCoreOutputs(run).map((item) => item.formulaId)).toEqual(run.results.map((result) => result.formulaId));

      for (const [inputId, expected] of Object.entries(fixtureItem.expectedNormalized).filter(([inputId, value]) => typeof value !== "boolean" && inputId !== "monthly_rent")) {
        const normalized = validation.normalizedInputs.find((input) => input.inputId === inputId);
        if (normalized?.normalizedValue === null) continue;
        const expectedNormalized = typeof expected === "string" && expected.includes("%") ? normalizePercent(numberInput(expected)) : expected;
        if (typeof normalized?.normalizedValue === "number" && typeof expectedNormalized === "number") {
          expect(normalized.normalizedValue, `${fixtureItem.fixtureId}:${inputId}`).toBeCloseTo(expectedNormalized, 10);
          continue;
        }
        expect(normalized?.normalizedValue, `${fixtureItem.fixtureId}:${inputId}`).toBe(expectedNormalized);
      }

      const expected = fixtureItem.schemaId === "land_hold" ? fixtureItem.expectedOutputs : { ...oracle, ...fixtureItem.expectedOutputs };
      for (const [formulaId, expectedValue] of Object.entries(expected) as Array<[FormulaId, number]>) {
        const actual = run.results.find((result) => result.formulaId === formulaId);
        if (!["calculated", "calculated_with_warning"].includes(String(actual?.status))) {
          throw new Error(`${fixtureItem.fixtureId}:${formulaId} expected calculated output but received ${actual?.status ?? "missing"}; snapshotMissing=${snapshot.missingRequiredInputIds.join(",")} missing=${actual?.missingInputIds.join(",") ?? "n/a"} blocked=${actual?.blockedInputIds.join(",") ?? "n/a"} errors=${actual?.errors.join("|") ?? "n/a"}`);
        }
        expect(actual?.formulaVersion, `${fixtureItem.fixtureId}:${formulaId}`).toBe("1.0.0");
        expect(actual?.formulaRegistryVersion, `${fixtureItem.fixtureId}:${formulaId}`).toBe(FORMULA_REGISTRY_VERSION);
        expect(actual?.rawValue, `${fixtureItem.fixtureId}:${formulaId}`).toBeCloseTo(expectedValue, toleranceDigits(formulaId));
        expect(actual?.deterministicHash, `${fixtureItem.fixtureId}:${formulaId}`).toMatch(/^fnv1a32:/);
      }
    }
  });

  it("proves formula edge contracts for rounding, units, currency, conflict, missing denominator, and version drift", () => {
    for (const edge of edgeFixtures) {
      const result = executeFormula(edge.request);
      expect(result.status, edge.name).toBe(edge.expectedStatus);
      if ("expectedDisplay" in edge) expect(result.displayResult).toBe(edge.expectedDisplay);
      expect(result.deterministicHash).toMatch(/^fnv1a32:/);
    }
  });

  it("reconciles scenarios and sensitivities without mutating the base snapshot or result set", () => {
    const fixtureItem = goldenFixtures.find((item) => item.fixtureId === "financed-single-family-rental");
    if (!fixtureItem) throw new Error("Missing financed fixture");
    const { snapshot, run } = executeGoldenFixture(fixtureItem);
    const baseSnapshotHash = snapshot.contentHash;
    const baseRunHash = run.resultSetHash;

    const scenario = buildUnderwritingScenarioRun({
      workspaceId: GOLDEN_WORKSPACE_ID,
      dealId: dealId(fixtureItem.fixtureId),
      baseSnapshot: snapshot,
      baseRun: run,
      scenarioName: "Golden rent and rate stress",
      scenarioType: "custom",
      overrides: [
        scenarioOverride("purchase_price", 250_000),
        scenarioOverride("annual_interest_rate", "7.5%"),
        scenarioOverride("scheduled_income_monthly", 2_450),
        scenarioOverride("vacancy_loss", 2_940),
        scenarioOverride("taxes", 6_250),
      ],
      actorId: GOLDEN_ACTOR_ID,
      idempotencyKey: "golden-scenario-financed-single-family-rental",
      requestedAt: GOLDEN_TIMESTAMP,
    });

    expect(snapshot.contentHash).toBe(baseSnapshotHash);
    expect(run.resultSetHash).toBe(baseRunHash);
    expect(scenario.scenarioRun.status).toBe("complete_with_warnings");
    expect(scenario.scenarioRun.resultSetHash).toMatch(/^fnv1a32:/);
    expect(projectScenarioComparison(scenario)).toEqual(scenario.comparison.outputs);
    expect(scenario.comparison.formulaVersionConfirmation).toBe("all_match");

    const sensitivity = buildUnderwritingSensitivityRun({
      workspaceId: GOLDEN_WORKSPACE_ID,
      dealId: dealId(fixtureItem.fixtureId),
      baseSnapshot: snapshot,
      baseRun: run,
      inputId: "scheduled_income_monthly",
      method: "explicit_points",
      explicitPoints: [2_350, 2_550, 2_750],
      targetFormulaIds: ["net_operating_income", "cash_on_cash_return"],
      actorId: GOLDEN_ACTOR_ID,
      idempotencyKey: "golden-sensitivity-financed-single-family-rental",
      requestedAt: GOLDEN_TIMESTAMP,
    });

    const points = projectSensitivityPoints(sensitivity);
    expect(sensitivity.definition.status).toBe("complete");
    expect(points.map((point) => point.pointOrdinal)).toEqual([1, 2, 3]);
    expect(points[1]?.testedInputValue).toBe(2_550);
    expect(points[1]?.status).toBe("complete_with_warnings");
    expect(buildUnderwritingSensitivityRun({
      ...sensitivity.definition,
      explicitPoints: [2_350, 2_550, 2_750],
      targetFormulaIds: ["net_operating_income", "cash_on_cash_return"],
      baseSnapshot: snapshot,
      baseRun: run,
      actorId: GOLDEN_ACTOR_ID,
      idempotencyKey: "golden-sensitivity-financed-single-family-rental",
      requestedAt: GOLDEN_TIMESTAMP,
    }).definition.contentHash).toBe(sensitivity.definition.contentHash);
    expect(UNDERWRITING_SENSITIVITY_LIMITS.maxSensitivityPoints).toBeGreaterThanOrEqual(3);
  });
});

function fixture(
  fixtureId: string,
  title: string,
  schemaId: string,
  inputOverrides: Partial<Record<UnderwritingInputId, string | number | boolean | null>>,
  expectedOutputOverrides: Partial<Record<FormulaId, number>> = {},
): GoldenFixture {
  const rawInputs = {
    financing_used: true,
    association_exists: false,
    third_party_management_selected: true,
    closing_costs: 0,
    initial_repairs: 0,
    initial_reserves: 0,
    other_income: 0,
    credit_loss: 0,
    hoa: 0,
    utilities: 0,
    other_operating_expenses: 0,
    ...inputOverrides,
  };
  return {
    fixtureId,
    title,
    schemaId,
    propertyType: String(rawInputs.property_type),
    rawInputs,
    expectedNormalized: rawInputs,
    expectedOutputs: expectedOutputOverrides,
  };
}

function executeGoldenFixture(fixtureItem: GoldenFixture) {
  const inputs = Object.fromEntries(
    Object.entries(fixtureItem.rawInputs).map(([inputId, rawValue]) => [inputId, raw(inputId as UnderwritingInputId, rawValue)]),
  ) as Record<string, UnderwritingRawInputValue>;
  const validation = validateAndNormalizeUnderwritingInputs(validationRequest(fixtureItem, inputs));
  const snapshot = buildSnapshot(fixtureItem, validation);
  const run = buildUnderwritingCoreOutputRun(snapshot, runRequest(snapshot, fixtureItem.fixtureId));
  return { validation, snapshot, run };
}

function raw(inputId: UnderwritingInputId, rawValue: string | number | boolean | null): UnderwritingRawInputValue {
  const definition = resolveUnderwritingInputDefinition(inputId);
  if (!definition) throw new Error(`Missing underwriting input definition ${inputId}`);
  return {
    inputId,
    rawValue,
    sourceUnit: definition.canonicalUnit,
    sourcePeriod: definition.canonicalPeriod,
    sourceCurrency: definition.currencyBehavior === "required" ? "USD" : undefined,
    sourceFactId: `golden-fact-${inputId}`,
    sourceRecordId: `golden-source-${inputId}`,
    evidenceId: "22222222-2222-4222-8222-222222222222",
    inputVersion: `golden-${inputId}-v1`,
    classification: ["vacancy_loss", "maintenance", "management"].includes(inputId) ? "accepted_user_assumption" : "accepted_fact",
    acceptedAssumptionId: ["vacancy_loss", "maintenance", "management"].includes(inputId) ? `golden-assumption-${inputId}` : undefined,
    verificationState: ["vacancy_loss", "maintenance", "management"].includes(inputId) ? "estimated" : "source_backed",
    conflictState: "none",
    proposalStatus: "accepted",
    sourceClassification: "manual",
  };
}

function validationRequest(fixtureItem: GoldenFixture, inputs: Record<string, UnderwritingRawInputValue>): UnderwritingValidationRequest {
  return {
    validationId: `golden-validation-${fixtureItem.fixtureId}`,
    workspaceId: GOLDEN_WORKSPACE_ID,
    dealId: dealId(fixtureItem.fixtureId),
    propertyIds: [GOLDEN_PROPERTY_ID],
    schemaId: fixtureItem.schemaId,
    schemaVersion: "1.0.0",
    schemaRegistryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
    inputRegistryVersion: UNDERWRITING_INPUT_REGISTRY_VERSION,
    validationRegistryVersion: UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
    normalizationRegistryVersion: UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    calculationCurrency: "USD",
    calculationPeriodContext: { unitCount: 1, rentableSquareFeet: 1_000, grossBuildingArea: 1_100 },
    inputs,
    requestTimestamp: GOLDEN_TIMESTAMP,
    authorization: {
      actorId: GOLDEN_ACTOR_ID,
      workspaceId: GOLDEN_WORKSPACE_ID,
      dealWorkspaceId: GOLDEN_WORKSPACE_ID,
      propertyWorkspaceId: GOLDEN_WORKSPACE_ID,
      membershipStatus: "active",
      permissions: ["deal.read", "property.read", "underwriting.read"],
    },
    authorizedSubjectIds: {
      workspaceIds: [GOLDEN_WORKSPACE_ID],
      dealIds: [dealId(fixtureItem.fixtureId)],
      propertyIds: [GOLDEN_PROPERTY_ID],
      sourceFactIds: Object.values(inputs).flatMap((input) => input.sourceFactId ? [input.sourceFactId] : []),
      sourceRecordIds: Object.values(inputs).flatMap((input) => input.sourceRecordId ? [input.sourceRecordId] : []),
      evidenceIds: ["22222222-2222-4222-8222-222222222222"],
      acceptedAssumptionIds: Object.values(inputs).flatMap((input) => input.acceptedAssumptionId ? [input.acceptedAssumptionId] : []),
    },
  };
}

function buildSnapshot(fixtureItem: GoldenFixture, validationResult: ReturnType<typeof validateAndNormalizeUnderwritingInputs>): UnderwritingSnapshotRecord {
  return buildUnderwritingSnapshotDraft({
    workspaceId: GOLDEN_WORKSPACE_ID,
    dealId: dealId(fixtureItem.fixtureId),
    primaryPropertyId: GOLDEN_PROPERTY_ID,
    propertyIds: [GOLDEN_PROPERTY_ID],
    validationResult,
    actorId: GOLDEN_ACTOR_ID,
    idempotencyKey: `golden-snapshot-${fixtureItem.fixtureId}`,
    reason: "initial_underwriting",
    createdAt: GOLDEN_TIMESTAMP,
    dealVersion: 1,
    propertyVersions: { [GOLDEN_PROPERTY_ID]: 1 },
    calculationCurrency: "USD",
    unitSystem: "imperial",
    valuationDate: "2026-07-30",
    holdPeriodMonths: 120,
    intendedUnderwritingMode: fixtureItem.schemaId === "land_hold" ? "land_hold" : "rental",
    reportingPeriod: "annual",
  } satisfies UnderwritingSnapshotCreationRequest).snapshot;
}

function runRequest(targetSnapshot: UnderwritingSnapshotRecord, fixtureId: string): UnderwritingCoreOutputRunRequest {
  return {
    workspaceId: targetSnapshot.workspaceId,
    dealId: targetSnapshot.dealId,
    snapshotId: targetSnapshot.snapshotId,
    expectedSnapshotHash: targetSnapshot.contentHash,
    actorId: GOLDEN_ACTOR_ID,
    idempotencyKey: `golden-run-${fixtureId}`,
    requestedAt: GOLDEN_TIMESTAMP,
  };
}

function oracleOutputs(input: Partial<Record<UnderwritingInputId, number | string | boolean>>) {
  const purchasePrice = numberInput(input.purchase_price);
  const downPaymentAmount = numberInput(input.down_payment_amount);
  const downPaymentPercent = normalizePercent(numberInput(input.down_payment_percent));
  const loanAmount = purchasePrice - downPaymentAmount;
  const monthlyPayment = mortgagePayment(loanAmount, normalizePercent(numberInput(input.annual_interest_rate)), numberInput(input.amortization_years));
  const grossScheduledIncome = numberInput(input.scheduled_income_monthly) * 12;
  const effectiveGrossIncome = grossScheduledIncome - numberInput(input.vacancy_loss) - numberInput(input.credit_loss) + numberInput(input.other_income);
  const operatingExpenses = ["taxes", "insurance", "maintenance", "management", "hoa", "utilities", "other_operating_expenses"]
    .reduce((sum, inputId) => sum + numberInput(input[inputId as UnderwritingInputId]), 0);
  const noi = effectiveGrossIncome - operatingExpenses;
  const annualDebtService = numberInput(input.monthly_principal_interest) * 12;
  const preTaxCashFlow = noi - annualDebtService;
  return {
    annual_debt_service: annualDebtService,
    capitalization_rate: safeDivide(noi, numberInput(input.value_basis)) * 100,
    cash_on_cash_return: safeDivide(preTaxCashFlow, numberInput(input.total_cash_invested)) * 100,
    ...(annualDebtService === 0 ? {} : { debt_service_coverage_ratio: safeDivide(noi, annualDebtService) }),
    down_payment_amount: purchasePrice * downPaymentPercent,
    effective_gross_income: effectiveGrossIncome,
    gross_scheduled_income: grossScheduledIncome,
    loan_amount: loanAmount,
    loan_to_value_ratio: safeDivide(loanAmount, numberInput(input.property_value)) * 100,
    monthly_principal_interest_fixed: monthlyPayment,
    net_operating_income: noi,
    pre_tax_cash_flow: preTaxCashFlow,
    total_operating_expenses: operatingExpenses,
  } satisfies Partial<Record<FormulaId, number>>;
}

function numberInput(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[$,%\s,]/g, ""));
  return 0;
}

function normalizePercent(value: number) {
  return value > 1 ? value / 100 : value;
}

function mortgagePayment(loanAmount: number, annualRate: number, amortizationYears: number) {
  const months = amortizationYears * 12;
  if (loanAmount === 0 || months === 0) return 0;
  const monthlyRate = annualRate / 12;
  return monthlyRate === 0 ? loanAmount / months : loanAmount * (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
}

function safeDivide(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function formulaValue(value: number | string, unit: FormulaUnit, period: FormulaPeriod, currency = "USD"): FormulaInputValue {
  return { value, unit, period, currency: unit === "currency" ? currency : undefined, classification: "accepted_fact", conflictState: "none", proposalStatus: "accepted", inputVersion: "golden-edge-v1" };
}

function formulaRequest(formulaId: FormulaId, inputs: Record<string, FormulaInputValue>): FormulaExecutionRequest {
  return {
    formulaId,
    formulaVersion: "1.0.0",
    registryVersion: FORMULA_REGISTRY_VERSION,
    calculationId: `golden-edge-${formulaId}`,
    workspaceId: GOLDEN_WORKSPACE_ID,
    dealId: "golden-edge-deal",
    propertyIds: [GOLDEN_PROPERTY_ID],
    inputs,
    requestedAt: GOLDEN_TIMESTAMP,
  };
}

function scenarioOverride(inputId: UnderwritingInputId, proposedRawValue: string | number | boolean | null): UnderwritingScenarioOverrideRequest {
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
  };
}

function toleranceDigits(formulaId: FormulaId) {
  return ["capitalization_rate", "cash_on_cash_return", "loan_to_value_ratio", "debt_service_coverage_ratio"].includes(formulaId)
    ? Math.abs(Math.log10(RATIO_TOLERANCE))
    : Math.abs(Math.log10(MONEY_TOLERANCE));
}

function dealId(fixtureId: string) {
  return `deal-golden-${fixtureId}`;
}

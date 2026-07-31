import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { UnderwritingWorkspace } from "../components/UnderwritingWorkspace";
import { FORMULA_REGISTRY_VERSION, type FormulaId } from "../core/formulaRegistry";
import {
  PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
  UNDERWRITING_INPUT_REGISTRY_VERSION,
  resolveUnderwritingInputDefinition,
  type UnderwritingInputId,
} from "../core/underwritingInputSchemas";
import {
  buildUnderwritingPresentation,
  UNDERWRITING_PRESENTATION_CONTRACT_VERSION,
} from "../core/underwritingPresentation";
import {
  buildUnderwritingCoreOutputRun,
  type UnderwritingCoreOutputRunRequest,
} from "../core/underwritingCoreOutputs";
import {
  buildUnderwritingScenarioRun,
  buildUnderwritingSensitivityRun,
  type UnderwritingScenarioOverrideRequest,
} from "../core/underwritingScenarios";
import {
  buildUnderwritingSnapshotDraft,
  type UnderwritingSnapshotCreationRequest,
  type UnderwritingSnapshotRecord,
} from "../core/underwritingSnapshots";
import {
  UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
  UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
  validateAndNormalizeUnderwritingInputs,
  type UnderwritingRawInputValue,
  type UnderwritingValidationRequest,
} from "../core/underwritingValidation";

const WORKSPACE_ID = "workspace-presentation";
const DEAL_ID = "deal-presentation";
const PROPERTY_ID = "property-presentation";
const ACTOR_ID = "user-presentation";
const NOW = "2026-07-30T18:00:00.000Z";

describe("underwriting presentation", () => {
  it("builds a safe empty model without fabricated outputs", () => {
    const model = buildUnderwritingPresentation({ dealId: DEAL_ID, dealName: "Empty Deal", mode: "guided" });

    expect(model.contractVersion).toBe(UNDERWRITING_PRESENTATION_CONTRACT_VERSION);
    expect(model.hasCanonicalUnderwriting).toBe(false);
    expect(model.emptyState?.title).toBe("No underwriting record yet");
    expect(model.coreOutputGroups).toEqual([]);
    expect(model.summary).toEqual([]);
  });

  it("projects canonical schema, readiness, inputs, core outputs, snapshots, scenarios, sensitivity, and provenance", () => {
    const snapshot = snapshotRecord();
    const run = buildUnderwritingCoreOutputRun(snapshot, runRequest(snapshot));
    const scenario = buildUnderwritingScenarioRun({
      workspaceId: WORKSPACE_ID,
      dealId: DEAL_ID,
      baseSnapshot: snapshot,
      baseRun: run,
      scenarioName: "Lower rent case",
      scenarioType: "income",
      overrides: [scenarioOverride("scheduled_income_monthly", 2350)],
      actorId: ACTOR_ID,
      idempotencyKey: "scenario-key",
      requestedAt: NOW,
    });
    const sensitivity = buildUnderwritingSensitivityRun({
      workspaceId: WORKSPACE_ID,
      dealId: DEAL_ID,
      baseSnapshot: snapshot,
      baseRun: run,
      inputId: "purchase_price",
      method: "explicit_points",
      explicitPoints: [230000, 240000, 250000],
      unit: "currency",
      period: "one_time",
      currency: "USD",
      targetFormulaIds: ["cash_on_cash_return", "debt_service_coverage_ratio"],
      actorId: ACTOR_ID,
      idempotencyKey: "sensitivity-key",
      requestedAt: NOW,
    });

    const model = buildUnderwritingPresentation({
      dealId: DEAL_ID,
      dealName: "Presentation Deal",
      mode: "professional",
      validationResult: validationResult(),
      snapshots: [snapshot],
      runs: [run],
      scenarios: [scenario],
      sensitivities: [sensitivity],
    });

    expect(model.hasCanonicalUnderwriting).toBe(true);
    expect(model.schema).toMatchObject({
      schemaId: "single_family_rental",
      schemaVersion: "1.0.0",
      formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    });
    expect(model.readiness).toMatchObject({ label: "Ready With Accepted Assumptions", isExecutable: true });
    expect(model.inputs.some((input) => input.label.toLowerCase() === "purchase price" && input.locked)).toBe(true);
    expect(model.coreOutputGroups.flatMap((group) => group.outputs).some((output) => output.formulaId === "net_operating_income")).toBe(true);
    expect(model.snapshots).toHaveLength(1);
    expect(model.scenarios[0]).toMatchObject({ name: "Lower rent case", changedInputCount: 1 });
    expect(model.sensitivities[0]).toMatchObject({ inputLabel: expect.stringMatching(/purchase price/i), pointCount: 3 });
    expect(model.sourcesAndAssumptions.sourceCount).toBeGreaterThan(0);
    expect(model.coreOutputGroups.flatMap((group) => group.outputs)[0].technicalReferences.length).toBeGreaterThan(0);
  });

  it("keeps guided mode readable while professional mode exposes technical references", () => {
    const snapshot = snapshotRecord();
    const run = buildUnderwritingCoreOutputRun(snapshot, runRequest(snapshot));
    const guided = buildUnderwritingPresentation({ dealId: DEAL_ID, mode: "guided", snapshots: [snapshot], runs: [run] });
    const professional = buildUnderwritingPresentation({ dealId: DEAL_ID, mode: "professional", snapshots: [snapshot], runs: [run] });

    const guidedOutput = guided.coreOutputGroups.flatMap((group) => group.outputs)[0];
    const professionalOutput = professional.coreOutputGroups.flatMap((group) => group.outputs)[0];

    expect(guidedOutput.explanation).toBeTruthy();
    expect(guidedOutput.technicalReferences).toEqual([]);
    expect(professionalOutput.technicalReferences).toEqual(expect.arrayContaining([expect.stringMatching(/^result:/)]));
  });

  it("renders the web underwriting workspace without calculating in the component", () => {
    const snapshot = snapshotRecord();
    const run = buildUnderwritingCoreOutputRun(snapshot, runRequest(snapshot));
    const model = buildUnderwritingPresentation({ dealId: DEAL_ID, dealName: "Rendered Deal", mode: "professional", snapshots: [snapshot], runs: [run] });

    render(<UnderwritingWorkspace model={model} />);

    expect(screen.getByRole("region", { name: "Underwriting workspace" })).toBeInTheDocument();
    expect(screen.getByText("Rendered Deal")).toBeInTheDocument();
    expect(screen.getAllByText("Core Outputs").length).toBeGreaterThan(0);
    expect(screen.getByText("Traceability")).toBeInTheDocument();
    expect(screen.getByText(/underwriting-formula-registry-v1/i)).toBeInTheDocument();
  });

  it("renders the empty state when the active Deal has no canonical underwriting records", () => {
    const model = buildUnderwritingPresentation({ dealId: DEAL_ID, dealName: "No Outputs", mode: "guided" });
    render(<UnderwritingWorkspace model={model} />);

    const section = screen.getByRole("region", { name: /No underwriting record yet/i });
    expect(within(section).getByText("No underwriting record yet")).toBeInTheDocument();
    expect(screen.queryByText("Net Operating Income")).not.toBeInTheDocument();
  });

  it("keeps presentation source free of authoritative formula execution and persistence writes", () => {
    const core = readFileSync(join(process.cwd(), "src/core/underwritingPresentation.ts"), "utf8");
    const component = readFileSync(join(process.cwd(), "src/components/UnderwritingWorkspace.tsx"), "utf8");

    expect(core).not.toMatch(/executeFormula|buildUnderwritingCoreOutputRun|createUnderwritingCoreOutputRun|validateAndNormalizeUnderwritingInputs|supabase\.rpc|supabase\.from/i);
    expect(component).not.toMatch(/executeFormula|buildUnderwritingCoreOutputRun|createUnderwritingCoreOutputRun|validateAndNormalizeUnderwritingInputs|supabase\.rpc|supabase\.from/i);
  });
});

function raw(inputId: UnderwritingInputId, rawValue: string | number | boolean | null, overrides: Partial<UnderwritingRawInputValue> = {}): UnderwritingRawInputValue {
  const definition = resolveUnderwritingInputDefinition(inputId);
  if (!definition) throw new Error(`Missing underwriting input definition ${inputId}`);
  return {
    inputId,
    rawValue,
    sourceUnit: definition.canonicalUnit,
    sourcePeriod: definition.canonicalPeriod,
    sourceCurrency: definition.currencyBehavior === "required" ? "USD" : undefined,
    sourceFactId: `source-${inputId}`,
    sourceRecordId: `record-${inputId}`,
    evidenceId: "33333333-3333-4333-8333-333333333333",
    inputVersion: `${inputId}-v1`,
    classification: ["vacancy_loss", "maintenance", "management"].includes(inputId) ? "accepted_user_assumption" : "accepted_fact",
    acceptedAssumptionId: ["vacancy_loss", "maintenance", "management"].includes(inputId) ? `assumption-${inputId}` : undefined,
    verificationState: ["vacancy_loss", "maintenance", "management"].includes(inputId) ? "estimated" : "source_backed",
    conflictState: "none",
    proposalStatus: "accepted",
    sourceClassification: "manual",
    ...overrides,
  };
}

function rentalInputs(overrides: Partial<Record<UnderwritingInputId, UnderwritingRawInputValue | undefined>> = {}) {
  const inputs = {
    property_type: raw("property_type", "single_family"),
    financing_used: raw("financing_used", true),
    association_exists: raw("association_exists", false),
    third_party_management_selected: raw("third_party_management_selected", true),
    purchase_price: raw("purchase_price", 240000),
    down_payment_amount: raw("down_payment_amount", 60000),
    down_payment_percent: raw("down_payment_percent", "25%"),
    loan_amount: raw("loan_amount", 180000),
    annual_interest_rate: raw("annual_interest_rate", "6.75%"),
    amortization_years: raw("amortization_years", 30),
    monthly_principal_interest: raw("monthly_principal_interest", 1167.15),
    scheduled_income_monthly: raw("scheduled_income_monthly", 2550),
    monthly_rent: raw("monthly_rent", 2550),
    vacancy_loss: raw("vacancy_loss", 1530),
    taxes: raw("taxes", 5950),
    insurance: raw("insurance", 1450),
    maintenance: raw("maintenance", 3060),
    management: raw("management", 2448),
    hoa: raw("hoa", 0),
    utilities: raw("utilities", 0),
    other_income: raw("other_income", 0),
    credit_loss: raw("credit_loss", 0),
    other_operating_expenses: raw("other_operating_expenses", 0),
    total_cash_invested: raw("total_cash_invested", 69000),
    value_basis: raw("value_basis", 240000),
    property_value: raw("property_value", 240000),
    ...overrides,
  } satisfies Record<string, UnderwritingRawInputValue | undefined>;
  return Object.fromEntries(Object.entries(inputs).filter(([, value]) => value !== undefined)) as Record<string, UnderwritingRawInputValue>;
}

function validationRequest(inputs: Record<string, UnderwritingRawInputValue> = rentalInputs()): UnderwritingValidationRequest {
  return {
    validationId: "validation-presentation",
    workspaceId: WORKSPACE_ID,
    dealId: DEAL_ID,
    propertyIds: [PROPERTY_ID],
    schemaId: "single_family_rental",
    schemaVersion: "1.0.0",
    schemaRegistryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
    inputRegistryVersion: UNDERWRITING_INPUT_REGISTRY_VERSION,
    validationRegistryVersion: UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
    normalizationRegistryVersion: UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
    formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
    calculationCurrency: "USD",
    calculationPeriodContext: { unitCount: 1, rentableSquareFeet: 1600, grossBuildingArea: 1800 },
    inputs,
    requestTimestamp: NOW,
    authorization: {
      actorId: ACTOR_ID,
      workspaceId: WORKSPACE_ID,
      dealWorkspaceId: WORKSPACE_ID,
      propertyWorkspaceId: WORKSPACE_ID,
      membershipStatus: "active",
      permissions: ["deal.read", "property.read", "underwriting.read"],
    },
    authorizedSubjectIds: {
      workspaceIds: [WORKSPACE_ID],
      dealIds: [DEAL_ID],
      propertyIds: [PROPERTY_ID],
    },
  };
}

function validationResult() {
  return validateAndNormalizeUnderwritingInputs(validationRequest());
}

function snapshotRecord(overrides: Partial<UnderwritingSnapshotCreationRequest> = {}) {
  const { snapshot, errors } = buildUnderwritingSnapshotDraft({
    workspaceId: WORKSPACE_ID,
    dealId: DEAL_ID,
    primaryPropertyId: PROPERTY_ID,
    propertyIds: [PROPERTY_ID],
    validationResult: validationResult(),
    actorId: ACTOR_ID,
    idempotencyKey: "snapshot-presentation",
    reason: "initial_underwriting",
    createdAt: NOW,
    dealVersion: 1,
    propertyVersions: { [PROPERTY_ID]: 1 },
    calculationCurrency: "USD",
    unitSystem: "imperial",
    holdPeriodMonths: 60,
    intendedUnderwritingMode: "rental",
    reportingPeriod: "annual",
    ...overrides,
  });
  if (errors.length > 0) throw new Error(errors[0].safeMessage);
  return { ...snapshot, snapshotSequence: overrides.validationResult ? 2 : 1 } satisfies UnderwritingSnapshotRecord;
}

function runRequest(snapshot: UnderwritingSnapshotRecord): UnderwritingCoreOutputRunRequest {
  return {
    workspaceId: snapshot.workspaceId,
    dealId: snapshot.dealId,
    snapshotId: snapshot.snapshotId,
    expectedSnapshotHash: snapshot.contentHash,
    actorId: ACTOR_ID,
    idempotencyKey: "run-presentation",
    requestedAt: NOW,
  };
}

function scenarioOverride(inputId: UnderwritingInputId, proposedRawValue: string | number | boolean | null): UnderwritingScenarioOverrideRequest {
  const definition = resolveUnderwritingInputDefinition(inputId);
  if (!definition) throw new Error(`Missing underwriting input definition ${inputId}`);
  return {
    inputId,
    proposedRawValue,
    originalUnit: definition.canonicalUnit,
    originalPeriod: definition.canonicalPeriod,
    currency: definition.currencyBehavior === "required" ? "USD" : undefined,
    assumptionClassification: "user_scenario_assumption",
    rationaleCategory: "user_test",
    userNote: "Presentation test scenario.",
    sourceProvenanceType: "scenario_user_entry",
  };
}

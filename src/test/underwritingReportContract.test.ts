import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { FORMULA_REGISTRY_VERSION } from "../core/formulaRegistry";
import {
  PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
  UNDERWRITING_INPUT_REGISTRY_VERSION,
  resolveUnderwritingInputDefinition,
  type UnderwritingInputId,
} from "../core/underwritingInputSchemas";
import {
  buildUnderwritingCoreOutputRun,
  type UnderwritingCoreOutputRunRequest,
} from "../core/underwritingCoreOutputs";
import {
  buildUnderwritingReportPayload,
  listUnderwritingReportContracts,
  resolveUnderwritingReportContract,
  UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
  UNDERWRITING_REPORT_CONTRACT_VERSION,
  type UnderwritingReportMetricRow,
} from "../core/underwritingReportContract";
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

const WORKSPACE_ID = "workspace-report-contract";
const DEAL_ID = "deal-report-contract";
const PROPERTY_ID = "property-report-contract";
const ACTOR_ID = "user-report-contract";
const NOW = "2026-07-31T15:00:00.000Z";

describe("underwriting report contract", () => {
  it("registers exactly one active report contract and leaves future report identifiers disabled", () => {
    const contracts = listUnderwritingReportContracts();
    const keys = contracts.map((contract) => `${contract.reportType}:${contract.semanticVersion}`);

    expect(new Set(keys).size).toBe(keys.length);
    expect(resolveUnderwritingReportContract("underwriting_summary")).toMatchObject({
      status: "active",
      contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
      registryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
      requiredSourceProjections: ["underwriting_snapshot", "underwriting_core_output_run"],
    });
    expect(() => resolveUnderwritingReportContract("underwriting_detail")).toThrow(/not enabled/i);
    expect(contracts.filter((contract) => contract.status === "active").map((contract) => contract.reportType)).toEqual(["underwriting_summary"]);
  });

  it("builds a deterministic report-ready payload from canonical snapshot, run, scenario, sensitivity, and provenance records", () => {
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
      idempotencyKey: "scenario-report-contract",
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
      idempotencyKey: "sensitivity-report-contract",
      requestedAt: NOW,
    });

    const payload = buildUnderwritingReportPayload({
      request: reportRequest(snapshot, run),
      dealDisplayName: "Report Contract Deal",
      propertyDisplayName: "1248 W Maple Ave",
      propertyProfile: "single_family",
      underwritingMode: "rental",
      snapshot,
      run,
      scenarios: [scenario],
      sensitivities: [sensitivity],
    });

    expect(payload.contract).toMatchObject({
      reportType: "underwriting_summary",
      contractVersion: UNDERWRITING_REPORT_CONTRACT_VERSION,
    });
    expect(payload.identity).toMatchObject({
      workspaceId: WORKSPACE_ID,
      dealId: DEAL_ID,
      dealDisplayName: "Report Contract Deal",
      propertyDisplayName: "1248 W Maple Ave",
      underwritingMode: "rental",
    });
    expect(payload.reconciliation).toMatchObject({
      snapshotId: snapshot.snapshotId,
      runId: run.runId,
      snapshotHash: snapshot.contentHash,
      resultSetHash: run.resultSetHash,
      schemaId: "single_family_rental",
    });
    expect(payload.sections.map((section) => section.id)).toEqual(resolveUnderwritingReportContract("underwriting_summary").sectionOrder);
    expect(payload.sections.find((section) => section.id === "scenario_comparison")?.rows).toHaveLength(1);
    expect(payload.sections.find((section) => section.id === "sensitivity_summary")?.rows).toHaveLength(1);
    expect(payload.appendices.versionManifest).toMatchObject({
      formulaRegistryVersion: FORMULA_REGISTRY_VERSION,
      reportContractRegistryVersion: UNDERWRITING_REPORT_CONTRACT_REGISTRY_VERSION,
    });
    expect(payload.appendices.provenanceIndex.length).toBeGreaterThan(0);
    expect(payload.contentHash).toMatch(/^report_[0-9a-f]{8}$/);

    const noi = metricRows(payload).find((row) => row.formulaId === "net_operating_income");
    const canonicalNoi = run.results.find((row) => row.formulaId === "net_operating_income");
    expect(noi).toBeTruthy();
    expect(noi?.displayText).toBe(canonicalNoi?.displayText);
    expect(noi?.rawValue).toBe(canonicalNoi?.rawValue);
    expect(noi?.deterministicHash).toBe(canonicalNoi?.deterministicHash);
  });

  it("is stable for identical canonical records and changes when the canonical result set changes", () => {
    const snapshot = snapshotRecord();
    const run = buildUnderwritingCoreOutputRun(snapshot, runRequest(snapshot));
    const first = buildUnderwritingReportPayload({ request: reportRequest(snapshot, run), snapshot, run });
    const second = buildUnderwritingReportPayload({ request: reportRequest(snapshot, run), snapshot, run });

    const changedSnapshot = snapshotRecord({
      validationResult: validateAndNormalizeUnderwritingInputs(validationRequest(rentalInputs({ scheduled_income_monthly: raw("scheduled_income_monthly", 2850), monthly_rent: raw("monthly_rent", 2850) }))),
      idempotencyKey: "snapshot-report-contract-higher-rent",
    });
    const changedRun = buildUnderwritingCoreOutputRun(changedSnapshot, { ...runRequest(changedSnapshot), idempotencyKey: "run-report-contract-higher-rent" });
    const changed = buildUnderwritingReportPayload({ request: reportRequest(changedSnapshot, changedRun), snapshot: changedSnapshot, run: changedRun });

    expect(second.contentHash).toBe(first.contentHash);
    expect(changed.contentHash).not.toBe(first.contentHash);
    expect(changed.reconciliation.resultSetHash).not.toBe(first.reconciliation.resultSetHash);
  });

  it("rejects stale, mismatched, or cross-scope report requests before building a payload", () => {
    const snapshot = snapshotRecord();
    const run = buildUnderwritingCoreOutputRun(snapshot, runRequest(snapshot));

    expect(() => buildUnderwritingReportPayload({
      request: { ...reportRequest(snapshot, run), expectedSnapshotHash: "wrong" },
      snapshot,
      run,
    })).toThrow(/snapshot hash/i);

    expect(() => buildUnderwritingReportPayload({
      request: { ...reportRequest(snapshot, run), expectedResultSetHash: "wrong" },
      snapshot,
      run,
    })).toThrow(/result set hash/i);

    expect(() => buildUnderwritingReportPayload({
      request: { ...reportRequest(snapshot, run), workspaceId: "other-workspace" },
      snapshot,
      run,
    })).toThrow(/workspace/i);
  });

  it("keeps the contract source free of calculation, persistence, provider, and renderer implementation", () => {
    const source = readFileSync(join(process.cwd(), "src/core/underwritingReportContract.ts"), "utf8");

    expect(source).not.toMatch(/executeFormula|buildUnderwritingCoreOutputRun|createUnderwritingCoreOutputRun|validateAndNormalizeUnderwritingInputs/i);
    expect(source).not.toMatch(/supabase\.|from\(|rpc\(|insert\(|update\(|upsert\(|delete\(/i);
    expect(source).not.toMatch(/jsPDF|pdfmake|xlsx|papaparse|csv-stringify|react-native|SwiftUI|fetch\(/i);
  });
});

function metricRows(payload: ReturnType<typeof buildUnderwritingReportPayload>) {
  return payload.sections.flatMap((section) => section.rows).filter((row): row is UnderwritingReportMetricRow => row.rowType === "metric");
}

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
    evidenceId: "44444444-4444-4444-8444-444444444444",
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
    validationId: "validation-report-contract",
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

function snapshotRecord(overrides: Partial<UnderwritingSnapshotCreationRequest> = {}) {
  const { snapshot, errors } = buildUnderwritingSnapshotDraft({
    workspaceId: WORKSPACE_ID,
    dealId: DEAL_ID,
    primaryPropertyId: PROPERTY_ID,
    propertyIds: [PROPERTY_ID],
    validationResult: validateAndNormalizeUnderwritingInputs(validationRequest()),
    actorId: ACTOR_ID,
    idempotencyKey: "snapshot-report-contract",
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
    idempotencyKey: "run-report-contract",
    requestedAt: NOW,
  };
}

function reportRequest(snapshot: UnderwritingSnapshotRecord, run: ReturnType<typeof buildUnderwritingCoreOutputRun>) {
  return {
    workspaceId: WORKSPACE_ID,
    dealId: DEAL_ID,
    reportType: "underwriting_summary" as const,
    snapshotId: snapshot.snapshotId,
    runId: run.runId,
    expectedSnapshotHash: snapshot.contentHash,
    expectedResultSetHash: run.resultSetHash,
    requestedBy: ACTOR_ID,
    requestedAt: NOW,
    idempotencyKey: "report-contract-request",
    locale: "en-US",
    timezone: "America/Chicago",
    displayCurrency: "USD",
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
    userNote: "Report contract test scenario.",
    sourceProvenanceType: "scenario_user_entry",
  };
}

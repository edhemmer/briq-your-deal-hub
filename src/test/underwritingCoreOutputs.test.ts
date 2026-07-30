import { describe, expect, it } from "vitest";
import { FORMULA_REGISTRY_VERSION } from "../core/formulaRegistry";
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
  UNDERWRITING_CORE_OUTPUT_RUN_VERSION,
  buildUnderwritingCoreOutputRun,
  compareUnderwritingCoreOutputRuns,
  createUnderwritingCoreOutputRun,
  getCoreOutputResultDetail,
  getLatestConfirmedExecutableResultSet,
  projectCoreOutputGroup,
  projectCoreOutputs,
  summarizeUnderwritingCoreOutputRun,
  type UnderwritingCoreOutputRunRecord,
  type UnderwritingCoreOutputRunRequest,
  type UnderwritingCoreOutputRunStore,
} from "../core/underwritingCoreOutputs";

const timestamp = "2026-07-30T15:00:00.000Z";

class MemoryRunStore implements UnderwritingCoreOutputRunStore {
  readonly runs: UnderwritingCoreOutputRunRecord[] = [];

  constructor(private readonly snapshots: UnderwritingSnapshotRecord[]) {}

  async loadSnapshot(workspaceId: string, snapshotId: string) {
    return this.snapshots.find((snapshot) => snapshot.workspaceId === workspaceId && snapshot.snapshotId === snapshotId);
  }

  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    return this.runs.find((run) => run.workspaceId === workspaceId && run.idempotencyKey === idempotencyKey);
  }

  async findByResultSetHash(workspaceId: string, snapshotId: string, resultSetHash: string) {
    return this.runs.find((run) => run.workspaceId === workspaceId && run.snapshotId === snapshotId && run.resultSetHash === resultSetHash);
  }

  async saveRun(run: UnderwritingCoreOutputRunRecord) {
    this.runs.push(run);
    return run;
  }
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
    validationId: "validation-core-output-1",
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
    authorizedSubjectIds: {
      workspaceIds: ["workspace-1"],
      dealIds: ["deal-1"],
      propertyIds: ["property-1"],
      sourceFactIds: Object.values(inputs).flatMap((input) => input.sourceFactId ? [input.sourceFactId] : []),
      sourceRecordIds: Object.values(inputs).flatMap((input) => input.sourceRecordId ? [input.sourceRecordId] : []),
      evidenceIds: Object.values(inputs).flatMap((input) => input.evidenceId ? [input.evidenceId] : []),
    },
    ...overrides,
  };
}

function snapshot(overrides: Partial<UnderwritingSnapshotCreationRequest> = {}) {
  const validationResult = overrides.validationResult ?? validateAndNormalizeUnderwritingInputs(validationRequest(rentalInputs()));
  return buildUnderwritingSnapshotDraft({
    workspaceId: "workspace-1",
    dealId: "deal-1",
    primaryPropertyId: "property-1",
    propertyIds: ["property-1"],
    validationResult,
    actorId: "user-1",
    idempotencyKey: "snapshot-core-output-1",
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
    idempotencyKey: "core-output-run-1",
    requestedAt: timestamp,
    ...overrides,
  };
}

describe("underwriting core outputs", () => {
  it("creates an immutable canonical run from one immutable snapshot and exact formula manifest versions", () => {
    const targetSnapshot = snapshot();
    const run = buildUnderwritingCoreOutputRun(targetSnapshot, runRequest(targetSnapshot));

    expect(targetSnapshot.missingRequiredInputIds).toEqual([]);
    expect(targetSnapshot.blockingReasons).toEqual([]);
    expect(run.results.filter((result) => result.status !== "calculated").map((result) => ({
      formulaId: result.formulaId,
      status: result.status,
      missingInputIds: result.missingInputIds,
      errors: result.errors,
    }))).toEqual([]);
    expect(run.engineVersion).toBe(UNDERWRITING_CORE_OUTPUT_RUN_VERSION);
    expect(run.status).toBe("complete");
    expect(run.snapshotHash).toBe(targetSnapshot.contentHash);
    expect(run.snapshotManifestHash).toBe(targetSnapshot.manifestHash);
    expect(run.formulaVersionManifestHash).toContain("fnv1a32:");
    expect(run.dependencyGraphHash).toContain("fnv1a32:");
    expect(run.resultSetHash).toContain("fnv1a32:");
    expect(run.results.every((result) => result.formulaVersion === "1.0.0")).toBe(true);
    expect(run.results.every((result) => result.formulaRegistryVersion === FORMULA_REGISTRY_VERSION)).toBe(true);
    expect(Object.isFrozen(run)).toBe(true);
    expect(Object.isFrozen(run.results)).toBe(true);
  });

  it("executes current core outputs with raw/display separation, lineage, provenance, and deterministic hashes", () => {
    const targetSnapshot = snapshot();
    const run = buildUnderwritingCoreOutputRun(targetSnapshot, runRequest(targetSnapshot));

    const noi = getCoreOutputResultDetail(run, "net_operating_income");
    const dscr = getCoreOutputResultDetail(run, "debt_service_coverage_ratio");
    const coc = getCoreOutputResultDetail(run, "cash_on_cash_return");

    expect(noi?.status).toBe("calculated");
    expect(noi?.rawValue).toBe(12_280);
    expect(noi?.displayText).toBe("USD 12,280.00");
    expect(noi?.inputRefs).toEqual(["effective_gross_income", "total_operating_expenses"]);
    expect(noi?.dependencyResultIds.length).toBeGreaterThan(0);
    expect(noi?.provenance.length).toBeGreaterThan(0);
    expect(dscr?.displayText).toMatch(/x$/);
    expect(coc?.displayText).toMatch(/%$/);
    expect(run.calculationOrder).toEqual(run.results.map((result) => result.formulaId));
    expect(run.results.map((result) => result.deterministicHash).every((hash) => hash.startsWith("fnv1a32:"))).toBe(true);
  });

  it("blocks incomplete snapshots without fabricating partial authoritative outputs", () => {
    const validationResult = validateAndNormalizeUnderwritingInputs(validationRequest(rentalInputs({ insurance: undefined })));
    const incompleteSnapshot = snapshot({ validationResult });
    const run = buildUnderwritingCoreOutputRun(incompleteSnapshot, runRequest(incompleteSnapshot));

    expect(incompleteSnapshot.isExecutable).toBe(false);
    expect(run.status).toBe("incomplete");
    expect(run.results.every((result) => result.status === "incomplete")).toBe(true);
    expect(run.results.every((result) => result.displayText === "Not calculated")).toBe(true);
    expect(run.errors[0]).toContain("Complete missing required underwriting inputs");
  });

  it("blocks conflicted and unsupported snapshots with explicit result statuses", () => {
    const conflicted = snapshot();
    const conflictedRun = buildUnderwritingCoreOutputRun({
      ...conflicted,
      readinessState: "blocked_conflict",
      isExecutable: false,
      conflictedRequiredInputIds: ["taxes"],
      inputs: [...conflicted.inputs],
      provenance: [...conflicted.provenance],
      formulaManifest: [...conflicted.formulaManifest],
    }, runRequest(conflicted));

    const unsupported = snapshot();
    const unsupportedRun = buildUnderwritingCoreOutputRun({
      ...unsupported,
      readinessState: "unsupported",
      isExecutable: false,
      inputs: [...unsupported.inputs],
      provenance: [...unsupported.provenance],
      formulaManifest: [...unsupported.formulaManifest],
    }, runRequest(unsupported));

    expect(conflictedRun.status).toBe("blocked");
    expect(conflictedRun.results.every((result) => result.status === "blocked_conflict")).toBe(true);
    expect(unsupportedRun.status).toBe("blocked");
    expect(unsupportedRun.results.every((result) => result.status === "schema_unsupported")).toBe(true);
  });

  it("keeps accepted assumptions visible and produces warning projections", () => {
    const validationResult = validateAndNormalizeUnderwritingInputs(validationRequest(rentalInputs({
      management: raw("management", "$1,920", { classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-management" }),
      third_party_management_selected: raw("third_party_management_selected", true),
    }), {
      validationId: "validation-core-output-assumption",
      authorizedSubjectIds: {
        workspaceIds: ["workspace-1"],
        dealIds: ["deal-1"],
        propertyIds: ["property-1"],
        sourceFactIds: Object.values(rentalInputs({
          management: raw("management", "$1,920", { classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-management" }),
          third_party_management_selected: raw("third_party_management_selected", true),
        })).flatMap((input) => input.sourceFactId ? [input.sourceFactId] : []),
        sourceRecordIds: Object.values(rentalInputs({
          management: raw("management", "$1,920", { classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-management" }),
          third_party_management_selected: raw("third_party_management_selected", true),
        })).flatMap((input) => input.sourceRecordId ? [input.sourceRecordId] : []),
        evidenceIds: ["11111111-1111-4111-8111-111111111111"],
        acceptedAssumptionIds: ["assumption-management"],
      },
    }));
    const assumptionSnapshot = snapshot({ validationResult });
    const run = buildUnderwritingCoreOutputRun(assumptionSnapshot, runRequest(assumptionSnapshot));

    expect(run.status).toBe("complete_with_warnings");
    expect(run.assumptionDisclosures.some((item) => item.includes("management"))).toBe(true);
    expect(projectCoreOutputGroup(run, "expenses").some((item) => item.status === "calculated_with_warning")).toBe(true);
  });

  it("deduplicates idempotent requests and identical result-set hashes", async () => {
    const targetSnapshot = snapshot();
    const store = new MemoryRunStore([targetSnapshot]);
    const first = await createUnderwritingCoreOutputRun(runRequest(targetSnapshot), store);
    const retry = await createUnderwritingCoreOutputRun(runRequest(targetSnapshot), store);
    const sameResultNewKey = await createUnderwritingCoreOutputRun(runRequest(targetSnapshot, { idempotencyKey: "core-output-run-2" }), store);

    expect(first.reusedByIdempotency).toBe(false);
    expect(retry.reusedByIdempotency).toBe(true);
    expect(sameResultNewKey.reusedByResultSetHash).toBe(true);
    expect(store.runs).toHaveLength(1);
  });

  it("rejects stale snapshot hashes, scope mismatches, and idempotency conflicts", async () => {
    const targetSnapshot = snapshot();
    const store = new MemoryRunStore([targetSnapshot]);
    await createUnderwritingCoreOutputRun(runRequest(targetSnapshot), store);

    await expect(createUnderwritingCoreOutputRun(runRequest(targetSnapshot, { expectedSnapshotHash: "fnv1a32:stale" }), store)).rejects.toMatchObject({ code: "snapshot_hash_mismatch" });
    await expect(createUnderwritingCoreOutputRun(runRequest(targetSnapshot, { workspaceId: "workspace-2" }), store)).rejects.toMatchObject({ code: "snapshot_not_found" });

    const changedValidation = validateAndNormalizeUnderwritingInputs(validationRequest(rentalInputs({
      purchase_price: raw("purchase_price", "$210,000", { inputVersion: "input-purchase_price-v2" }),
      loan_amount: raw("loan_amount", "$160,000", { inputVersion: "input-loan_amount-v2" }),
    }), { validationId: "validation-core-output-2" }));
    const changedSnapshot = snapshot({ validationResult: changedValidation });
    const conflictStore = new MemoryRunStore([targetSnapshot, changedSnapshot]);
    await createUnderwritingCoreOutputRun(runRequest(targetSnapshot), conflictStore);
    await expect(createUnderwritingCoreOutputRun(runRequest(changedSnapshot), conflictStore)).rejects.toMatchObject({ code: "idempotency_conflict" });
  });

  it("projects summaries, groups, result details, latest executable result set, and comparisons", () => {
    const firstSnapshot = snapshot();
    const secondValidation = validateAndNormalizeUnderwritingInputs(validationRequest(rentalInputs({
      scheduled_income_monthly: raw("scheduled_income_monthly", "$2,100", { inputVersion: "input-scheduled_income_monthly-v2" }),
      monthly_rent: raw("monthly_rent", "$2,100", { inputVersion: "input-monthly_rent-v2" }),
    }), { validationId: "validation-core-output-rent-change" }));
    const secondSnapshot = snapshot({ validationResult: secondValidation });
    const first = buildUnderwritingCoreOutputRun(firstSnapshot, runRequest(firstSnapshot));
    const second = buildUnderwritingCoreOutputRun(secondSnapshot, runRequest(secondSnapshot, { idempotencyKey: "core-output-run-2" }));

    expect(summarizeUnderwritingCoreOutputRun(first).calculatedResultCount).toBe(first.results.length);
    expect(projectCoreOutputs(first).length).toBe(first.results.length);
    expect(projectCoreOutputGroup(first, "returns").map((item) => item.formulaId)).toContain("cash_on_cash_return");
    expect(getLatestConfirmedExecutableResultSet([first, second])?.runId).toBe(second.runId);

    const comparison = compareUnderwritingCoreOutputRuns(first, second);
    expect(comparison.sameResultSetHash).toBe(false);
    expect(comparison.changedFormulaIds).toContain("gross_scheduled_income");
    expect(comparison.changedValueFormulaIds).toContain("net_operating_income");
  });
});

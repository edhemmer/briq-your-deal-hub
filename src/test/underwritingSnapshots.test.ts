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
  UNDERWRITING_SNAPSHOT_CONTRACT_VERSION,
  UNDERWRITING_SNAPSHOT_HASH_VERSION,
  buildUnderwritingSnapshotDraft,
  compareUnderwritingSnapshots,
  createUnderwritingSnapshot,
  summarizeUnderwritingSnapshot,
  type UnderwritingSnapshotCreationRequest,
  type UnderwritingSnapshotRecord,
  type UnderwritingSnapshotStore,
} from "../core/underwritingSnapshots";

const timestamp = "2026-07-30T12:00:00.000Z";

class MemorySnapshotStore implements UnderwritingSnapshotStore {
  private snapshots: UnderwritingSnapshotRecord[] = [];

  async findByIdempotencyKey(workspaceId: string, idempotencyKey: string) {
    return this.snapshots.find((snapshot) => snapshot.workspaceId === workspaceId && snapshot.idempotencyKey === idempotencyKey);
  }

  async findByContentHash(workspaceId: string, dealId: string, contentHash: string) {
    return this.snapshots.find((snapshot) => snapshot.workspaceId === workspaceId && snapshot.dealId === dealId && snapshot.contentHash === contentHash);
  }

  async getLatestForDeal(workspaceId: string, dealId: string) {
    return [...this.snapshots]
      .filter((snapshot) => snapshot.workspaceId === workspaceId && snapshot.dealId === dealId)
      .sort((a, b) => b.snapshotSequence - a.snapshotSequence)[0];
  }

  async saveSnapshot(snapshot: UnderwritingSnapshotRecord) {
    this.snapshots.push(snapshot);
    return snapshot;
  }

  list() {
    return this.snapshots;
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

function validRentalInputs(overrides: Partial<Record<UnderwritingInputId, UnderwritingRawInputValue | undefined>> = {}) {
  const inputs = {
    property_type: raw("property_type", "single_family"),
    purchase_price: raw("purchase_price", "$200,000"),
    scheduled_income_monthly: raw("scheduled_income_monthly", "$2,000"),
    vacancy_loss: raw("vacancy_loss", "$1,200"),
    taxes: raw("taxes", "$5,000"),
    insurance: raw("insurance", "$1,200"),
    maintenance: raw("maintenance", "$2,400"),
    total_cash_invested: raw("total_cash_invested", "$50,000"),
    value_basis: raw("value_basis", "$210,000"),
    property_value: raw("property_value", "$210,000"),
    ...overrides,
  } satisfies Record<string, UnderwritingRawInputValue | undefined>;
  return Object.fromEntries(Object.entries(inputs).filter(([, value]) => value !== undefined)) as Record<string, UnderwritingRawInputValue>;
}

function validationRequest(inputs: Record<string, UnderwritingRawInputValue>, overrides: Partial<UnderwritingValidationRequest> = {}): UnderwritingValidationRequest {
  return {
    validationId: "validation-1",
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
      acceptedAssumptionIds: Object.values(inputs).flatMap((input) => input.acceptedAssumptionId ? [input.acceptedAssumptionId] : []),
      preliminaryAssumptionIds: Object.values(inputs).flatMap((input) => input.preliminaryAssumptionId ? [input.preliminaryAssumptionId] : []),
      sourceRecordIds: Object.values(inputs).flatMap((input) => input.sourceRecordId ? [input.sourceRecordId] : []),
      evidenceIds: Object.values(inputs).flatMap((input) => input.evidenceId ? [input.evidenceId] : []),
    },
    ...overrides,
  };
}

function snapshotRequest(overrides: Partial<UnderwritingSnapshotCreationRequest> = {}): UnderwritingSnapshotCreationRequest {
  const inputs = validRentalInputs(overrides.validationResult ? {} : undefined);
  const validationResult = overrides.validationResult ?? validateAndNormalizeUnderwritingInputs(validationRequest(inputs));
  return {
    workspaceId: "workspace-1",
    dealId: "deal-1",
    primaryPropertyId: "property-1",
    propertyIds: ["property-1"],
    validationResult,
    actorId: "user-1",
    idempotencyKey: "snapshot-key-1",
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
  };
}

describe("underwriting immutable snapshots", () => {
  it("freezes exact validation, formula, version, input, and provenance state without calculating outputs", () => {
    const { snapshot, errors } = buildUnderwritingSnapshotDraft(snapshotRequest());

    expect(errors).toEqual([]);
    expect(snapshot.snapshotContractVersion).toBe(UNDERWRITING_SNAPSHOT_CONTRACT_VERSION);
    expect(snapshot.snapshotHashVersion).toBe(UNDERWRITING_SNAPSHOT_HASH_VERSION);
    expect(snapshot.readinessState).toBe("ready_confirmed");
    expect(snapshot.isExecutable).toBe(true);
    expect(snapshot.schemaId).toBe("single_family_rental");
    expect(snapshot.schemaVersion).toBe("1.0.0");
    expect(snapshot.formulaRegistryVersion).toBe(FORMULA_REGISTRY_VERSION);
    expect(snapshot.sourceValidationHash).toBe(snapshot.sourceValidationHash);
    expect(snapshot.inputs.find((input) => input.inputId === "purchase_price")?.deterministicInputHash).toContain("fnv1a32:");
    expect(snapshot.provenance.some((item) => item.inputId === "purchase_price" && item.sourceFactId === "fact-purchase_price")).toBe(true);
    expect(snapshot.formulaManifest.every((entry) => entry.formulaVersion === "1.0.0")).toBe(true);
    expect(snapshot.formulaManifest.some((entry) => entry.formulaId === "net_operating_income")).toBe(true);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.inputs)).toBe(true);
  });

  it("allows incomplete non-executable snapshots but rejects invalid, unsupported, unresolved, and conflicted snapshots", async () => {
    const incompleteValidation = validateAndNormalizeUnderwritingInputs(validationRequest(validRentalInputs({ insurance: undefined })));
    const incomplete = await createUnderwritingSnapshot(snapshotRequest({ validationResult: incompleteValidation }), new MemorySnapshotStore());

    expect(incomplete.snapshot.readinessState).toBe("incomplete");
    expect(incomplete.snapshot.isExecutable).toBe(false);
    expect(incomplete.snapshot.missingRequiredInputIds).toContain("insurance");

    const conflictedValidation = validateAndNormalizeUnderwritingInputs(validationRequest(validRentalInputs({
      taxes: raw("taxes", "$5,000", { conflictState: "unresolved", conflictMateriality: "material" }),
    })));
    await expect(createUnderwritingSnapshot(snapshotRequest({ validationResult: conflictedValidation }), new MemorySnapshotStore())).rejects.toMatchObject({ code: "blocked_conflict" });

    const invalidValidation = validateAndNormalizeUnderwritingInputs(validationRequest(validRentalInputs({
      scheduled_income_monthly: raw("scheduled_income_monthly", "$2,000", { sourceCurrency: "CAD" }),
    })));
    await expect(createUnderwritingSnapshot(snapshotRequest({ validationResult: invalidValidation }), new MemorySnapshotStore())).rejects.toMatchObject({ code: "validation_invalid" });
  });

  it("deduplicates idempotent retries and identical content without creating duplicate sequences", async () => {
    const store = new MemorySnapshotStore();
    const first = await createUnderwritingSnapshot(snapshotRequest(), store);
    const retry = await createUnderwritingSnapshot(snapshotRequest(), store);
    const sameContentNewKey = await createUnderwritingSnapshot(snapshotRequest({ idempotencyKey: "snapshot-key-2" }), store);

    expect(first.snapshot.snapshotSequence).toBe(1);
    expect(retry.reusedByIdempotency).toBe(true);
    expect(sameContentNewKey.reusedByContentHash).toBe(true);
    expect(store.list()).toHaveLength(1);
  });

  it("rejects idempotency conflicts and supersedes prior snapshots when accepted inputs change", async () => {
    const store = new MemorySnapshotStore();
    const first = await createUnderwritingSnapshot(snapshotRequest(), store);

    const changedValidation = validateAndNormalizeUnderwritingInputs(validationRequest(validRentalInputs({
      purchase_price: raw("purchase_price", "$205,000", { inputVersion: "input-purchase_price-v2" }),
    }), { validationId: "validation-2" }));

    await expect(createUnderwritingSnapshot(snapshotRequest({ validationResult: changedValidation }), store)).rejects.toMatchObject({ code: "idempotency_conflict" });

    const second = await createUnderwritingSnapshot(snapshotRequest({
      validationResult: changedValidation,
      idempotencyKey: "snapshot-key-2",
      reason: "accepted_input_changed",
      dealVersion: 4,
      propertyVersions: { "property-1": 3 },
    }), store);

    expect(second.snapshot.snapshotSequence).toBe(2);
    expect(second.snapshot.priorSnapshotId).toBe(first.snapshot.snapshotId);
    expect(second.snapshot.supersedesSnapshotId).toBe(first.snapshot.snapshotId);
    expect(second.snapshot.contentHash).not.toBe(first.snapshot.contentHash);
    expect(compareUnderwritingSnapshots(first.snapshot, second.snapshot).changedInputIds).toContain("purchase_price");
  });

  it("excludes actor, timestamps, and retry keys from deterministic content identity", () => {
    const first = buildUnderwritingSnapshotDraft(snapshotRequest()).snapshot;
    const second = buildUnderwritingSnapshotDraft(snapshotRequest({
      actorId: "different-user",
      createdAt: "2026-08-01T00:00:00.000Z",
      idempotencyKey: "different-key",
    })).snapshot;

    expect(second.contentHash).toBe(first.contentHash);
    expect(second.snapshotId).toBe(first.snapshotId);
  });

  it("detects formula-manifest and readiness differences for future comparisons", () => {
    const confirmed = buildUnderwritingSnapshotDraft(snapshotRequest()).snapshot;
    const assumptionValidation = validateAndNormalizeUnderwritingInputs(validationRequest(validRentalInputs({
      maintenance: raw("maintenance", "$2,400", { classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-maintenance" }),
    }), { validationId: "validation-assumption" }));
    const assumptionSnapshot = buildUnderwritingSnapshotDraft(snapshotRequest({ validationResult: assumptionValidation })).snapshot;

    const comparison = compareUnderwritingSnapshots(confirmed, assumptionSnapshot);

    expect(assumptionSnapshot.readinessState).toBe("ready_with_accepted_assumptions");
    expect(comparison.sameContentHash).toBe(false);
    expect(comparison.readinessChanged).toBe(true);
    expect(comparison.changedInputIds).toContain("maintenance");
    expect(summarizeUnderwritingSnapshot(assumptionSnapshot).provisionalRequiredInputCount).toBe(0);
  });
});

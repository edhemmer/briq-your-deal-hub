import { describe, expect, it } from "vitest";
import { FORMULA_REGISTRY_VERSION } from "../core/formulaRegistry";
import {
  PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
  UNDERWRITING_INPUT_REGISTRY_VERSION,
  resolvePropertyUnderwritingSchema,
  resolveUnderwritingInputDefinition,
  type UnderwritingInputId,
} from "../core/underwritingInputSchemas";
import {
  UNDERWRITING_NORMALIZATION_REGISTRY_VERSION,
  UNDERWRITING_VALIDATION_RULE_REGISTRY_VERSION,
  listNormalizationDefinitions,
  listValidationRules,
  resolveNormalizationDefinition,
  resolveValidationRule,
  validateAndNormalizeUnderwritingInputs,
  validateUnderwritingNormalizationRegistry,
  validateUnderwritingValidationRegistry,
  type UnderwritingRawInputValue,
  type UnderwritingValidationRequest,
} from "../core/underwritingValidation";

const timestamp = "2026-07-30T00:00:00.000Z";

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
    evidenceId: `evidence-${inputId}`,
    inputVersion: `input-${inputId}-v1`,
    classification: "accepted_fact",
    verificationState: "source_backed",
    conflictState: "none",
    proposalStatus: "accepted",
    sourceClassification: "manual",
    ...overrides,
  };
}

function request(inputs: Record<string, UnderwritingRawInputValue>, overrides: Partial<UnderwritingValidationRequest> = {}): UnderwritingValidationRequest {
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
    calculationPeriodContext: {
      unitCount: 1,
      rentableSquareFeet: 1_200,
      grossBuildingArea: 1_400,
    },
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

function validRentalInputs(overrides: Partial<Record<UnderwritingInputId, UnderwritingRawInputValue | undefined>> = {}) {
  const inputs = {
    property_type: raw("property_type", "single_family"),
    purchase_price: raw("purchase_price", "$200,000"),
    scheduled_income_monthly: raw("scheduled_income_monthly", "$2,000"),
    vacancy_loss: raw("vacancy_loss", "$1,200", { classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-vacancy" }),
    taxes: raw("taxes", "$5,000"),
    insurance: raw("insurance", "$1,200"),
    maintenance: raw("maintenance", "$2,400", { classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-maintenance" }),
    total_cash_invested: raw("total_cash_invested", "$50,000"),
    value_basis: raw("value_basis", "$210,000"),
    property_value: raw("property_value", "$210,000"),
    ...overrides,
  } satisfies Record<string, UnderwritingRawInputValue | undefined>;
  return Object.fromEntries(Object.entries(inputs).filter(([, value]) => value !== undefined)) as Record<string, UnderwritingRawInputValue>;
}

function byId(result: ReturnType<typeof validateAndNormalizeUnderwritingInputs>, inputId: UnderwritingInputId) {
  const input = result.normalizedInputs.find((item) => item.inputId === inputId);
  if (!input) throw new Error(`Missing normalized input ${inputId}`);
  return input;
}

describe("underwriting validation and normalization registries", () => {
  it("registers deterministic active, deprecated, and disabled validation and normalization definitions", () => {
    const validationKeys = listValidationRules().map((rule) => `${rule.ruleId}@${rule.semanticVersion}`);
    const normalizationKeys = listNormalizationDefinitions().map((definition) => `${definition.normalizationId}@${definition.semanticVersion}`);

    expect(new Set(validationKeys).size).toBe(validationKeys.length);
    expect(new Set(normalizationKeys).size).toBe(normalizationKeys.length);
    expect(validateUnderwritingValidationRegistry()).toEqual({ valid: true, errors: [] });
    expect(validateUnderwritingNormalizationRegistry()).toEqual({ valid: true, errors: [] });
    expect(resolveValidationRule("type.canonical")?.status).toBe("active");
    expect(resolveValidationRule("presence.required", "0.9.0")?.status).toBe("deprecated");
    expect(resolveValidationRule("disabled.ai_semantic_validation")).toBeUndefined();
    expect(resolveValidationRule("disabled.ai_semantic_validation", "1.0.0")?.status).toBe("disabled");
    expect(resolveNormalizationDefinition("money.usd")?.canonicalDataType).toBe("money");
    expect(resolveNormalizationDefinition("disabled.semantic_ai", "1.0.0")?.status).toBe("disabled");
  });

  it("normalizes money, percentage, unit, period, and precision without executing formulas", () => {
    const result = validateAndNormalizeUnderwritingInputs(request(validRentalInputs({
      financing_used: raw("financing_used", true),
      scheduled_income_monthly: raw("scheduled_income_monthly", "2000", { sourcePeriod: "monthly" }),
      vacancy_loss: raw("vacancy_loss", "100", { sourcePeriod: "monthly", classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-vacancy" }),
      vacancy_rate: raw("vacancy_rate", "5%", { classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-vacancy-rate" }),
      amortization_years: raw("amortization_years", 30, { sourceUnit: "years" }),
    })));

    expect(byId(result, "scheduled_income_monthly").normalizedValue).toBe(2_000);
    expect(byId(result, "vacancy_loss").normalizedValue).toBe(1_200);
    expect(byId(result, "vacancy_loss").conversionApplied).toBe(true);
    expect(byId(result, "amortization_years").normalizedValue).toBe(30);
    expect(byId(result, "vacancy_rate").normalizedValue).toBe(0.05);
    expect(result.formulaReadiness.find((formula) => formula.formulaId === "gross_scheduled_income")?.status).not.toBe("formula_disabled");
  });

  it("blocks ambiguous percentages, unsupported currencies, prohibited inputs, stale versions, and missing required inputs", () => {
    const result = validateAndNormalizeUnderwritingInputs(request(validRentalInputs({
      scheduled_income_monthly: raw("scheduled_income_monthly", "$2,000", { sourceCurrency: "CAD" }),
      vacancy_rate: raw("vacancy_rate", "5"),
      rentable_square_feet: raw("rentable_square_feet", 1_200),
      taxes: raw("taxes", "$5,000", { inputVersion: "v1", expectedInputVersion: "v2" }),
    }), { schemaId: "single_family_rental" }));
    const missingInsurance = validateAndNormalizeUnderwritingInputs(request(validRentalInputs({ insurance: undefined })));

    expect(byId(result, "scheduled_income_monthly").validationStatus).toBe("unsupported_currency");
    expect(byId(result, "vacancy_rate").validationStatus).toBe("ambiguous");
    expect(byId(result, "rentable_square_feet").validationStatus).toBe("prohibited");
    expect(byId(result, "taxes").errors.map((error) => error.code)).toContain("stale_input_version");
    expect(byId(missingInsurance, "insurance").validationStatus).toBe("missing");
    expect(missingInsurance.missingRequiredInputs).toContain("insurance");
  });

  it("distinguishes accepted assumptions, preliminary assumptions, provenance, and conflicts", () => {
    const result = validateAndNormalizeUnderwritingInputs(request(validRentalInputs({
      vacancy_loss: raw("vacancy_loss", "$1,200", {
        classification: "preliminary_assumption",
        preliminaryAssumptionId: "prelim-vacancy",
      }),
      maintenance: raw("maintenance", "$2,400", {
        classification: "preliminary_assumption",
        preliminaryAssumptionId: "prelim-maintenance",
      }),
      property_type: raw("property_type", "single_family", {
        classification: "accepted_user_assumption",
        acceptedAssumptionId: "bad-property-type-assumption",
      }),
      insurance: raw("insurance", "$1,200", {
        classification: "accepted_user_assumption",
        acceptedAssumptionId: undefined,
        sourceFactId: undefined,
        sourceRecordId: undefined,
        evidenceId: undefined,
      }),
      taxes: raw("taxes", "$5,000", {
        conflictState: "unresolved",
        conflictMateriality: "material",
      }),
    })));

    expect(byId(result, "vacancy_loss").validationStatus).toBe("preliminary");
    expect(byId(result, "maintenance").validationStatus).toBe("preliminary");
    expect(byId(result, "property_type").errors.map((error) => error.code)).toContain("assumption_not_allowed");
    expect(byId(result, "insurance").errors.map((error) => error.code)).toContain("missing_provenance");
    expect(byId(result, "taxes").validationStatus).toBe("blocked_conflict");
    expect(result.overallStatus).toBe("blocked_conflict");
  });

  it("validates cross-input relationships and formula readiness from normalized inputs", () => {
    const result = validateAndNormalizeUnderwritingInputs(request(validRentalInputs({
      financing_used: raw("financing_used", true),
      purchase_price: raw("purchase_price", "$200,000"),
      loan_amount: raw("loan_amount", "$170,000"),
      down_payment_amount: raw("down_payment_amount", "$20,000"),
      annual_interest_rate: raw("annual_interest_rate", "6%"),
      amortization_years: raw("amortization_years", 30),
      monthly_principal_interest: raw("monthly_principal_interest", "$1,000"),
    }), { calculationPeriodContext: { unitCount: 2 } }));
    const unitResult = validateAndNormalizeUnderwritingInputs(request(validRentalInputs({
      property_type: raw("property_type", "multifamily"),
      management: raw("management", "$1,200", { classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-management" }),
      unit_count: raw("unit_count", 2),
      occupied_unit_count: raw("occupied_unit_count", 3),
    }), {
      schemaId: "multifamily_rental",
      schemaVersion: "1.0.0",
      calculationPeriodContext: { unitCount: 2 },
    }));

    expect(result.relationshipErrors.map((error) => error.safeMessage)).toEqual(expect.arrayContaining([
      "Loan amount plus down payment must reconcile to purchase price.",
    ]));
    expect(unitResult.relationshipErrors.map((error) => error.safeMessage)).toEqual(expect.arrayContaining([
      "Occupied units cannot exceed total units.",
    ]));
    expect(result.formulaReadiness.find((formula) => formula.formulaId === "loan_to_value_ratio")?.status).toBe("ready_confirmed");
  });

  it("fails closed on authorization boundaries and does not include unauthorized data as valid inputs", () => {
    const unauthorizedWorkspace = validateAndNormalizeUnderwritingInputs(request(validRentalInputs(), {
      authorization: {
        actorId: "user-1",
        workspaceId: "workspace-1",
        dealWorkspaceId: "workspace-2",
        propertyWorkspaceId: "workspace-1",
        membershipStatus: "active",
        permissions: ["deal.read", "property.read", "underwriting.read"],
      },
    }));
    const unauthorizedSubject = validateAndNormalizeUnderwritingInputs(request(validRentalInputs({
      purchase_price: raw("purchase_price", "$200,000", { sourceFactId: "foreign-fact" }),
    }), {
      authorizedSubjectIds: {
        workspaceIds: ["workspace-1"],
        dealIds: ["deal-1"],
        propertyIds: ["property-1"],
        sourceFactIds: ["fact-property_type"],
      },
    }));

    expect(unauthorizedWorkspace.overallStatus).toBe("unsupported");
    expect(unauthorizedWorkspace.relationshipErrors.map((error) => error.code)).toContain("unauthorized_subject");
    expect(byId(unauthorizedSubject, "purchase_price").errors.map((error) => error.code)).toContain("unauthorized_subject");
  });

  it("produces deterministic hashes and changes hashes when accepted source evidence changes", () => {
    const first = validateAndNormalizeUnderwritingInputs(request(validRentalInputs()));
    const second = validateAndNormalizeUnderwritingInputs(request(validRentalInputs()));
    const changedSource = validateAndNormalizeUnderwritingInputs(request(validRentalInputs({
      purchase_price: raw("purchase_price", "$200,000", { sourceFactId: "different-fact" }),
    })));

    expect(first.deterministicResultHash).toBe(second.deterministicResultHash);
    expect(first.deterministicResultHash).not.toBe(changedSource.deterministicResultHash);
    expect(byId(first, "purchase_price").deterministicNormalizedValueHash).toBe(byId(second, "purchase_price").deterministicNormalizedValueHash);
    expect(byId(first, "purchase_price").deterministicNormalizedValueHash).not.toBe(byId(changedSource, "purchase_price").deterministicNormalizedValueHash);
  });

  it("returns unresolved schema results without creating canonical property or deal records", () => {
    const result = validateAndNormalizeUnderwritingInputs(request(validRentalInputs(), {
      schemaId: "missing_schema",
      schemaVersion: "1.0.0",
    }));

    expect(result.overallStatus).toBe("unresolved_schema");
    expect(result.normalizedInputs).toEqual([]);
    expect(result.relationshipErrors.map((error) => error.code)).toContain("schema_not_found");
    expect(resolvePropertyUnderwritingSchema("single_family_rental")?.status).toBe("active");
  });
});

import { describe, expect, it } from "vitest";
import { listFormulaDefinitions } from "../core/formulaRegistry";
import {
  PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
  UNDERWRITING_INPUT_REGISTRY_VERSION,
  authorizeUnderwritingSchemaAccess,
  evaluateConditionalRequirements,
  listPropertyUnderwritingSchemas,
  listUnderwritingInputDefinitions,
  projectInputStates,
  projectSchemaReadiness,
  resolvePropertyUnderwritingSchema,
  resolveUnderwritingInputDefinition,
  selectPropertyUnderwritingSchema,
  validatePropertyUnderwritingSchemaRegistry,
  validateUnderwritingInputRegistry,
  type PropertyUnderwritingSchema,
  type UnderwritingInputId,
  type UnderwritingInputValue,
} from "../core/underwritingInputSchemas";

function value(inputId: UnderwritingInputId, canonicalValue: string | number | boolean, overrides: Partial<UnderwritingInputValue> = {}): UnderwritingInputValue {
  const definition = resolveUnderwritingInputDefinition(inputId);
  if (!definition) throw new Error(`Missing test input definition ${inputId}`);
  return {
    inputId,
    canonicalValue,
    rawAcceptedValue: canonicalValue,
    canonicalUnit: definition.canonicalUnit,
    period: definition.canonicalPeriod,
    currency: definition.currencyBehavior === "required" || definition.currencyBehavior === "inherits_input_currency" ? "USD" : undefined,
    sourceFactId: "source-1",
    classification: "accepted_fact",
    verificationState: "confirmed",
    conflictState: "none",
    proposalStatus: "accepted",
    ...overrides,
  };
}

function values(inputIds: UnderwritingInputId[]) {
  return Object.fromEntries(inputIds.map((inputId) => [inputId, value(inputId, sampleValue(inputId))])) as Record<string, UnderwritingInputValue>;
}

function sampleValue(inputId: UnderwritingInputId) {
  if (inputId.endsWith("_exists") || inputId.endsWith("_used") || inputId.endsWith("_selected") || inputId.endsWith("_included") || inputId.endsWith("_active") || inputId.endsWith("_requested")) return true;
  if (inputId.includes("percent") || inputId.includes("rate")) return 6;
  if (inputId.includes("year")) return 30;
  if (inputId === "property_type") return "single_family";
  return 1000;
}

describe("underwriting input registry", () => {
  it("registers unique versioned inputs with deterministic active, deprecated, and disabled behavior", () => {
    const definitions = listUnderwritingInputDefinitions();
    const keys = definitions.map((definition) => `${definition.inputId}@${definition.semanticVersion}`);

    expect(keys).toEqual([...keys].sort());
    expect(new Set(keys).size).toBe(keys.length);
    expect(definitions.every((definition) => definition.registryVersion === UNDERWRITING_INPUT_REGISTRY_VERSION)).toBe(true);
    expect(resolveUnderwritingInputDefinition("purchase_price")?.status).toBe("active");
    expect(resolveUnderwritingInputDefinition("legacy_rent_guess")?.status).toBeUndefined();
    expect(resolveUnderwritingInputDefinition("legacy_rent_guess", "1.0.0")?.status).toBe("disabled");
    expect(resolveUnderwritingInputDefinition("legacy_rent_guess", "1.0.0")?.replacementInputId).toBe("monthly_rent");
  });

  it("documents units, periods, currency, assumption policies, provenance, and formula consumers", () => {
    const purchasePrice = resolveUnderwritingInputDefinition("purchase_price");
    const vacancyLoss = resolveUnderwritingInputDefinition("vacancy_loss");
    const propertyType = resolveUnderwritingInputDefinition("property_type");
    const noi = resolveUnderwritingInputDefinition("net_operating_income");

    expect(purchasePrice).toMatchObject({
      canonicalUnit: "currency",
      canonicalPeriod: "one_time",
      currencyBehavior: "required",
      assumptionPolicy: "accepted_fact_or_accepted_assumption",
      conflictPolicy: "block_unresolved",
      canonicalDealField: "deals.facts.expectedPrice",
      provenanceRequired: true,
    });
    expect(vacancyLoss?.assumptionPolicy).toBe("preliminary_assumption_allowed");
    expect(propertyType?.assumptionPolicy).toBe("accepted_fact_only");
    expect(noi).toMatchObject({ dataType: "derived", userEditable: false, assumptionPolicy: "no_assumptions" });
    expect(resolveUnderwritingInputDefinition("loan_amount")?.formulaConsumers).toContain("monthly_principal_interest_fixed");
    expect(validateUnderwritingInputRegistry()).toMatchObject({ valid: true });
  });
});

describe("property underwriting schema registry", () => {
  it("registers deterministic active schemas and resolvable deprecated/disabled versions", () => {
    const schemas = listPropertyUnderwritingSchemas();
    const keys = schemas.map((schema) => `${schema.schemaId}@${schema.semanticVersion}`);

    expect(listPropertyUnderwritingSchemas().map((schema) => `${schema.schemaId}@${schema.semanticVersion}`)).toEqual(keys);
    expect(new Set(keys).size).toBe(keys.length);
    expect(schemas.every((schema) => schema.registryVersion === PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION)).toBe(true);
    expect(resolvePropertyUnderwritingSchema("single_family_rental")?.semanticVersion).toBe("1.0.0");
    expect(resolvePropertyUnderwritingSchema("single_family_rental", "0.9.0")?.status).toBe("deprecated");
    expect(resolvePropertyUnderwritingSchema("single_family_rental", "0.9.0")?.replacementSchemaId).toBe("single_family_rental");
    expect(resolvePropertyUnderwritingSchema("single_family_disabled_experimental")?.status).toBeUndefined();
    expect(resolvePropertyUnderwritingSchema("single_family_disabled_experimental", "9.9.9")?.status).toBe("disabled");
    expect(validatePropertyUnderwritingSchemaRegistry()).toMatchObject({ valid: true });
  });

  it("keeps formula registry compatibility explicit without executing formulas", () => {
    const registry = validatePropertyUnderwritingSchemaRegistry();
    const formulaIds = new Set(listFormulaDefinitions().map((definition) => definition.id));
    const rental = resolvePropertyUnderwritingSchema("single_family_rental");

    expect(registry.errors).toEqual([]);
    expect(rental?.supportedFormulaIds.every((formulaId) => formulaIds.has(formulaId))).toBe(true);
    expect(rental?.supportedFormulaIds).toContain("net_operating_income");
    expect(rental?.excludedInputIds).toContain("rentable_square_feet");
  });
});

describe("schema selection", () => {
  it.each([
    ["single_family", "rental", "single_family_rental"],
    ["condominium", "rental", "condominium_rental"],
    ["townhouse", "rental", "townhouse_rental"],
    ["duplex", "rental", "two_to_four_unit_rental"],
    ["multifamily", "rental", "multifamily_rental"],
    ["mixed_use", "mixed_use_income", "mixed_use_income"],
    ["office", "commercial_income", "office_commercial_income"],
    ["retail", "commercial_income", "retail_commercial_income"],
    ["land", "land_hold", "land_hold"],
  ])("selects %s / %s deterministically", (propertyType, mode, schemaId) => {
    const first = selectPropertyUnderwritingSchema({ acceptedPropertyType: propertyType, intendedUnderwritingMode: mode, registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION });
    const second = selectPropertyUnderwritingSchema({ acceptedPropertyType: propertyType, intendedUnderwritingMode: mode, registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION });

    expect(first.selectionStatus).toBe("selected");
    expect(first.selectedSchemaId).toBe(schemaId);
    expect(second).toEqual(first);
  });

  it("fails safely for unknown, unsupported, missing mode, ambiguous classification, exact version, and disabled version", () => {
    expect(selectPropertyUnderwritingSchema({ acceptedPropertyType: "unknown", intendedUnderwritingMode: "rental", registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION }).selectionStatus).toBe("unresolved_property_type");
    expect(selectPropertyUnderwritingSchema({ acceptedPropertyType: "single_family", registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION }).selectionStatus).toBe("unresolved_mode");
    expect(selectPropertyUnderwritingSchema({ acceptedPropertyType: "special_purpose", intendedUnderwritingMode: "commercial_income", registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION }).selectionStatus).toBe("unsupported_property_type");
    expect(selectPropertyUnderwritingSchema({ acceptedPropertyType: "single_family", intendedUnderwritingMode: "rental", unitCount: 5, registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION }).selectionStatus).toBe("ambiguous");
    expect(selectPropertyUnderwritingSchema({ acceptedPropertyType: "single_family", intendedUnderwritingMode: "rental", schemaVersionRequest: "1.0.0", registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION }).selectionStatus).toBe("selected");
    expect(selectPropertyUnderwritingSchema({ acceptedPropertyType: "single_family", intendedUnderwritingMode: "rental", schemaVersionRequest: "9.9.9", registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION }).selectionStatus).toBe("schema_disabled");
  });

  it("preserves residential, multifamily, mixed-use, commercial, and land boundaries", () => {
    const singleFamily = resolvePropertyUnderwritingSchema("single_family_owner_occupied");
    const multifamily = resolvePropertyUnderwritingSchema("multifamily_rental");
    const mixedUse = resolvePropertyUnderwritingSchema("mixed_use_income");
    const office = resolvePropertyUnderwritingSchema("office_commercial_income");
    const land = resolvePropertyUnderwritingSchema("land_hold");

    expect(singleFamily?.requiredInputIds).not.toContain("scheduled_income_monthly");
    expect(singleFamily?.excludedInputIds).toContain("monthly_rent");
    expect(multifamily?.requiredInputIds).toContain("unit_count");
    expect(multifamily?.requiredInputIds).not.toContain("bedroom_count");
    expect(mixedUse?.requiredInputIds).toEqual(expect.arrayContaining(["residential_income_monthly", "commercial_income_monthly"]));
    expect(office?.requiredInputIds).toContain("rentable_square_feet");
    expect(office?.excludedInputIds).toContain("bedroom_count");
    expect(land?.requiredInputIds).not.toContain("scheduled_income_monthly");
    expect(land?.excludedInputIds).toEqual(expect.arrayContaining(["bedroom_count", "bathroom_count", "net_operating_income", "capitalization_rate"]));
  });
});

describe("conditional requirements, input states, readiness, and authorization", () => {
  it("evaluates conditional requirements without false missing warnings and rejects circular conditions", () => {
    const schema = resolvePropertyUnderwritingSchema("single_family_rental");
    if (!schema) throw new Error("Missing single-family rental schema");
    const cashValues = { financing_used: value("financing_used", false), association_exists: value("association_exists", false) };
    const debtValues = { financing_used: value("financing_used", true), association_exists: value("association_exists", true), third_party_management_selected: value("third_party_management_selected", true) };

    expect(evaluateConditionalRequirements(schema, cashValues).filter((rule) => rule.applies).map((rule) => rule.targetInputId)).toEqual([]);
    expect(evaluateConditionalRequirements(schema, debtValues).filter((rule) => rule.applies).map((rule) => rule.targetInputId)).toEqual(expect.arrayContaining(["loan_amount", "annual_interest_rate", "amortization_years", "monthly_principal_interest", "hoa", "management"]));

    const circular: PropertyUnderwritingSchema = {
      ...schema,
      conditionalRequirements: [
        { ruleId: "a", conditionVersion: "1.0.0", targetInputId: "loan_amount", requirementState: "conditionally_required", condition: { inputId: "annual_interest_rate", operator: "truthy", value: true }, explanation: "a" },
        { ruleId: "b", conditionVersion: "1.0.0", targetInputId: "annual_interest_rate", requirementState: "conditionally_required", condition: { inputId: "loan_amount", operator: "truthy", value: true }, explanation: "b" },
      ],
    };
    expect(() => evaluateConditionalRequirements(circular, {})).toThrow(/Circular conditional requirement/);
  });

  it("projects accepted facts, assumptions, preliminary values, missing, conflicted, invalid, not applicable, prohibited, and derived pending", () => {
    const schema = resolvePropertyUnderwritingSchema("single_family_rental");
    if (!schema) throw new Error("Missing single-family rental schema");
    const states = projectInputStates(schema, {
      property_type: value("property_type", "single_family"),
      purchase_price: value("purchase_price", 250000, { classification: "accepted_user_assumption", acceptedAssumptionId: "assumption-1" }),
      scheduled_income_monthly: value("scheduled_income_monthly", 2200),
      vacancy_loss: value("vacancy_loss", 1200, { classification: "preliminary_assumption", acceptedAssumptionId: "assumption-2" }),
      taxes: value("taxes", 6000, { conflictState: "unresolved" }),
      insurance: value("insurance", 1600, { canonicalUnit: "percentage" }),
      financing_used: value("financing_used", false),
      rentable_square_feet: value("rentable_square_feet", 1000),
    });
    const byId = new Map(states.map((state) => [state.inputId, state]));

    expect(byId.get("property_type")?.completenessState).toBe("available_confirmed");
    expect(byId.get("purchase_price")?.completenessState).toBe("available_accepted_assumption");
    expect(byId.get("vacancy_loss")?.completenessState).toBe("available_preliminary");
    expect(byId.get("total_cash_invested")?.completenessState).toBe("missing");
    expect(byId.get("taxes")?.completenessState).toBe("conflicted");
    expect(byId.get("insurance")?.completenessState).toBe("invalid");
    expect(byId.get("rentable_square_feet")?.completenessState).toBe("prohibited");
    expect(byId.get("net_operating_income")?.completenessState).toBe("derived_pending");
    expect(byId.get("purchase_price")?.acceptedAssumptionId).toBe("assumption-1");
    expect(byId.get("property_type")?.sourceFactId).toBe("source-1");
  });

  it("projects readiness states and formula input readiness without running calculations", () => {
    const selection = selectPropertyUnderwritingSchema({ acceptedPropertyType: "single_family", intendedUnderwritingMode: "rental", registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION });
    const schema = selection.schema;
    if (!schema) throw new Error("Missing selected schema");
    const required = values(schema.requiredInputIds);

    expect(projectSchemaReadiness(selection, required).overallInputReadinessState).toBe("ready");
    expect(projectSchemaReadiness(selection, { ...required, purchase_price: value("purchase_price", 250000, { classification: "accepted_user_assumption", acceptedAssumptionId: "a1" }) }).overallInputReadinessState).toBe("ready_with_accepted_assumptions");
    expect(projectSchemaReadiness(selection, { ...required, vacancy_loss: value("vacancy_loss", 1000, { classification: "preliminary_assumption" }) }).overallInputReadinessState).toBe("preliminary");
    expect(projectSchemaReadiness(selection, { property_type: value("property_type", "single_family") }).overallInputReadinessState).toBe("incomplete");
    expect(projectSchemaReadiness(selection, { ...required, purchase_price: value("purchase_price", 250000, { conflictState: "unresolved" }) }).overallInputReadinessState).toBe("blocked_conflict");
    expect(projectSchemaReadiness(selectPropertyUnderwritingSchema({ acceptedPropertyType: "unknown", intendedUnderwritingMode: "rental", registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION })).overallInputReadinessState).toBe("unresolved_schema");
    expect(projectSchemaReadiness(selectPropertyUnderwritingSchema({ acceptedPropertyType: "special_purpose", intendedUnderwritingMode: "commercial_income", registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION })).overallInputReadinessState).toBe("unsupported");
    expect(projectSchemaReadiness(selection, required).formulasInputReady).not.toContain("capitalization_rate");
    expect(projectSchemaReadiness(selection, required).formulasBlockedByMissingInputs.capitalization_rate).toContain("net_operating_income");
  });

  it("fails closed for protected-data access and allows owner or trusted read access", () => {
    expect(authorizeUnderwritingSchemaAccess({ workspaceId: "w1", membershipStatus: "missing", permissions: [] }).status).toBe("authentication_required");
    expect(authorizeUnderwritingSchemaAccess({ actorId: "u1", workspaceId: "w1", dealWorkspaceId: "w2", membershipStatus: "active", permissions: ["deal.read", "property.read", "underwriting.read"] }).status).toBe("workspace_mismatch");
    expect(authorizeUnderwritingSchemaAccess({ actorId: "u1", workspaceId: "w1", propertyWorkspaceId: "w2", membershipStatus: "active", permissions: ["deal.read", "property.read", "underwriting.read"] }).status).toBe("workspace_mismatch");
    expect(authorizeUnderwritingSchemaAccess({ actorId: "u1", workspaceId: "w1", membershipStatus: "revoked", permissions: ["deal.read", "property.read", "underwriting.read"] }).status).toBe("access_revoked");
    expect(authorizeUnderwritingSchemaAccess({ actorId: "u1", workspaceId: "w1", membershipStatus: "active", permissions: ["deal.read"] }).status).toBe("permission_denied");
    expect(authorizeUnderwritingSchemaAccess({ actorId: "owner", workspaceId: "w1", dealWorkspaceId: "w1", propertyWorkspaceId: "w1", membershipStatus: "active", permissions: ["deal.read", "property.read", "underwriting.read", "underwriting.update"] }).authorized).toBe(true);
    expect(authorizeUnderwritingSchemaAccess({ actorId: "trusted", workspaceId: "w1", dealWorkspaceId: "w1", propertyWorkspaceId: "w1", membershipStatus: "active", permissions: ["deal.read", "property.read", "underwriting.read"] }).authorized).toBe(true);
  });
});

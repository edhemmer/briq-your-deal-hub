import { describe, expect, it } from "vitest";
import {
  FORMULA_REGISTRY_VERSION,
  applyPrecision,
  executeFormula,
  executeFormulaPlan,
  formulaInput,
  getFormulaRegistry,
  listFormulaDefinitions,
  resolveFormulaDefinition,
  type FormulaExecutionRequest,
} from "../core/formulaRegistry";

function request(formulaId: string, inputs: FormulaExecutionRequest["inputs"], calculationId = formulaId): FormulaExecutionRequest {
  return {
    formulaId,
    formulaVersion: "latest",
    registryVersion: FORMULA_REGISTRY_VERSION,
    calculationId,
    workspaceId: "workspace-1",
    dealId: "deal-1",
    propertyIds: ["property-1"],
    inputs,
    requestedAt: "2026-07-29T12:00:00.000Z",
  };
}

describe("underwriting formula registry", () => {
  it("registers unique versioned active formula identities in deterministic order", () => {
    const definitions = listFormulaDefinitions();
    const keys = definitions.map((definition) => `${definition.id}@${definition.semanticVersion}`);

    expect(keys).toEqual([...keys].sort());
    expect(new Set(keys).size).toBe(keys.length);
    expect(definitions).toHaveLength(13);
    expect(definitions.every((definition) => definition.registryVersion === FORMULA_REGISTRY_VERSION)).toBe(true);
    expect(definitions.every((definition) => definition.status === "active")).toBe(true);
    expect(getFormulaRegistry().size).toBe(13);
  });

  it("resolves latest active formulas and safely reports missing versions", () => {
    expect(resolveFormulaDefinition("net_operating_income")?.semanticVersion).toBe("1.0.0");
    expect(resolveFormulaDefinition("net_operating_income", "1.0.0")?.status).toBe("active");
    expect(resolveFormulaDefinition("net_operating_income", "9.9.9")).toBeUndefined();

    expect(executeFormula(request("missing_formula", {})).status).toBe("formula_not_found");
    expect(executeFormula({ ...request("net_operating_income", {}), formulaVersion: "9.9.9" }).status).toBe("version_not_found");
  });

  it("documents required formula contracts, precision, implementation references, and explanations", () => {
    const capRate = resolveFormulaDefinition("capitalization_rate");
    expect(capRate).toMatchObject({
      displayName: "Capitalization rate",
      category: "return",
      semanticVersion: "1.0.0",
      implementationRef: "src/core/formulaRegistry.ts:capitalization_rate",
    });
    expect(capRate?.inputs.map((input) => input.id)).toEqual(["net_operating_income", "value_basis"]);
    expect(capRate?.output).toMatchObject({ unit: "percentage", period: "none", precision: { scale: 4 } });
    expect(capRate?.explanationTemplate).toContain("Divides annual NOI");
  });

  it("calculates the initial formula set with traceable result contracts", () => {
    expect(executeFormula(request("down_payment_amount", {
      purchase_price: formulaInput(250000, "currency", "one_time"),
      down_payment_percent: formulaInput(20, "percentage", "none", "USD", "accepted_user_assumption"),
    })).displayResult).toBe(50000);

    expect(executeFormula(request("loan_amount", {
      purchase_price: formulaInput(250000, "currency", "one_time"),
      down_payment_amount: formulaInput(50000, "currency", "one_time"),
    })).displayResult).toBe(200000);

    expect(executeFormula(request("monthly_principal_interest_fixed", {
      loan_amount: formulaInput(200000, "currency", "one_time"),
      annual_interest_rate: formulaInput(7, "percentage", "none"),
      amortization_years: formulaInput(30, "years", "none"),
    })).displayResult).toBe(1330.6);

    const gross = executeFormula(request("gross_scheduled_income", {
      scheduled_income_monthly: formulaInput(2400, "currency", "monthly"),
    }));
    expect(gross.displayResult).toBe(28800);

    const effective = executeFormula(request("effective_gross_income", {
      gross_scheduled_income: formulaInput(28800, "currency", "annual"),
      vacancy_loss: formulaInput(1728, "currency", "annual", "USD", "accepted_user_assumption"),
      other_income: formulaInput(300, "currency", "annual"),
    }));
    expect(effective.displayResult).toBe(27372);

    const expenses = executeFormula(request("total_operating_expenses", {
      taxes: formulaInput(5000, "currency", "annual"),
      insurance: formulaInput(1800, "currency", "annual"),
      maintenance: formulaInput(2304, "currency", "annual", "USD", "accepted_user_assumption"),
      management: formulaInput(2304, "currency", "annual", "USD", "accepted_user_assumption"),
      hoa: formulaInput(1200, "currency", "annual"),
    }));
    expect(expenses.displayResult).toBe(12608);

    const noi = executeFormula(request("net_operating_income", {
      effective_gross_income: formulaInput(27372, "currency", "annual"),
      total_operating_expenses: formulaInput(12608, "currency", "annual"),
    }));
    expect(noi.displayResult).toBe(14764);

    const debt = executeFormula(request("annual_debt_service", {
      monthly_principal_interest: formulaInput(1330.6, "currency", "monthly"),
    }));
    expect(debt.displayResult).toBe(15967.2);

    const cashFlow = executeFormula(request("pre_tax_cash_flow", {
      net_operating_income: formulaInput(14764, "currency", "annual"),
      annual_debt_service: formulaInput(15967.2, "currency", "annual"),
    }));
    expect(cashFlow.displayResult).toBe(-1203.2);

    expect(executeFormula(request("capitalization_rate", {
      net_operating_income: formulaInput(14764, "currency", "annual"),
      value_basis: formulaInput(250000, "currency", "one_time"),
    })).displayResult).toBe(5.9056);
    expect(executeFormula(request("cash_on_cash_return", {
      pre_tax_cash_flow: formulaInput(-1203.2, "currency", "annual"),
      total_cash_invested: formulaInput(56250, "currency", "one_time"),
    })).displayResult).toBe(-2.139);
    expect(executeFormula(request("loan_to_value_ratio", {
      loan_amount: formulaInput(200000, "currency", "one_time"),
      property_value: formulaInput(250000, "currency", "one_time"),
    })).displayResult).toBe(80);
    expect(executeFormula(request("debt_service_coverage_ratio", {
      net_operating_income: formulaInput(14764, "currency", "annual"),
      annual_debt_service: formulaInput(15967.2, "currency", "annual"),
    })).displayResult).toBe(0.9246);
  });

  it("rejects missing inputs, unknown units, mixed currency, raw proposals, and unresolved conflicts", () => {
    expect(executeFormula(request("net_operating_income", {
      effective_gross_income: formulaInput(10000, "currency", "annual"),
    })).status).toBe("incomplete");

    expect(executeFormula(request("net_operating_income", {
      effective_gross_income: formulaInput(10000, "percentage", "annual"),
      total_operating_expenses: formulaInput(6000, "currency", "annual"),
    })).status).toBe("unsupported_unit");

    expect(executeFormula(request("net_operating_income", {
      effective_gross_income: formulaInput(10000, "currency", "annual", "USD"),
      total_operating_expenses: formulaInput(6000, "currency", "annual", "CAD"),
    })).status).toBe("unsupported_currency");

    expect(executeFormula(request("net_operating_income", {
      effective_gross_income: { ...formulaInput(10000, "currency", "annual"), proposalStatus: "pending" },
      total_operating_expenses: formulaInput(6000, "currency", "annual"),
    })).status).toBe("blocked_conflict");

    expect(executeFormula(request("net_operating_income", {
      effective_gross_income: { ...formulaInput(10000, "currency", "annual"), conflictState: "unresolved" },
      total_operating_expenses: formulaInput(6000, "currency", "annual"),
    })).status).toBe("blocked_conflict");
  });

  it("discloses assumptions and blocks preliminary assumptions unless the formula permits them", () => {
    const accepted = executeFormula(request("monthly_principal_interest_fixed", {
      loan_amount: formulaInput(200000, "currency", "one_time", "USD", "accepted_user_assumption"),
      annual_interest_rate: formulaInput(7, "percentage", "none", "USD", "accepted_user_assumption"),
      amortization_years: formulaInput(30, "years", "none", "USD", "accepted_user_assumption"),
    }));
    expect(accepted.status).toBe("calculated");
    expect(accepted.confidenceState).toBe("accepted_assumptions");

    const blocked = executeFormula(request("monthly_principal_interest_fixed", {
      loan_amount: formulaInput(200000, "currency", "one_time", "USD", "preliminary_assumption"),
      annual_interest_rate: formulaInput(7, "percentage", "none"),
      amortization_years: formulaInput(30, "years", "none"),
    }));
    expect(blocked.status).toBe("blocked_conflict");
  });

  it("handles zero-rate amortization, divide by zero, negative cash flow, and half-cent boundaries", () => {
    expect(executeFormula(request("monthly_principal_interest_fixed", {
      loan_amount: formulaInput(120000, "currency", "one_time"),
      annual_interest_rate: formulaInput(0, "percentage", "none"),
      amortization_years: formulaInput(30, "years", "none"),
    })).displayResult).toBe(333.33);

    expect(executeFormula(request("debt_service_coverage_ratio", {
      net_operating_income: formulaInput(10000, "currency", "annual"),
      annual_debt_service: formulaInput(0, "currency", "annual"),
    })).status).toBe("divide_by_zero");

    expect(executeFormula(request("pre_tax_cash_flow", {
      net_operating_income: formulaInput(10000, "currency", "annual"),
      annual_debt_service: formulaInput(12000, "currency", "annual"),
    })).displayResult).toBe(-2000);

    expect(applyPrecision(1.005, { scale: 2, roundingMode: "half_away_from_zero" })).toBe(1.01);
    expect(applyPrecision(-1.005, { scale: 2, roundingMode: "half_away_from_zero" })).toBe(-1.01);
  });

  it("executes dependency plans deterministically and rejects cycles", () => {
    const loan = request("loan_amount", {
      purchase_price: formulaInput(250000, "currency", "one_time"),
      down_payment_amount: formulaInput(50000, "currency", "one_time"),
    }, "a-loan");
    const debt = request("monthly_principal_interest_fixed", {
      loan_amount: formulaInput(200000, "currency", "one_time"),
      annual_interest_rate: formulaInput(7, "percentage", "none"),
      amortization_years: formulaInput(30, "years", "none"),
    }, "b-debt");

    const results = executeFormulaPlan([
      { request: debt, dependsOnCalculationIds: ["a-loan"] },
      { request: loan },
    ]);
    expect(results.map((result) => result.calculationId)).toEqual(["a-loan", "b-debt"]);

    expect(() => executeFormulaPlan([
      { request: loan, dependsOnCalculationIds: ["b-debt"] },
      { request: debt, dependsOnCalculationIds: ["a-loan"] },
    ])).toThrow("Formula dependency cycle detected.");
  });

  it("produces stable hashes and changes hashes when inputs or versions change", () => {
    const first = executeFormula(request("capitalization_rate", {
      net_operating_income: formulaInput(15000, "currency", "annual"),
      value_basis: formulaInput(250000, "currency", "one_time"),
    }, "calc-1"));
    const second = executeFormula({ ...request("capitalization_rate", {
      value_basis: formulaInput(250000, "currency", "one_time"),
      net_operating_income: formulaInput(15000, "currency", "annual"),
    }, "calc-2"), requestedAt: "2026-07-30T12:00:00.000Z" });
    const changed = executeFormula(request("capitalization_rate", {
      net_operating_income: formulaInput(15500, "currency", "annual"),
      value_basis: formulaInput(250000, "currency", "one_time"),
    }, "calc-3"));

    expect(first.deterministicHash).toBe(second.deterministicHash);
    expect(first.deterministicHash).not.toBe(changed.deterministicHash);
  });
});

import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS, type AnalyzerInputs } from "../core/investorMath";
import { analyzeOwned, monthsBetween, portfolioTotals } from "../core/portfolio";

const inputs: AnalyzerInputs = {
  ...DEFAULT_ASSUMPTIONS,
  purchasePrice: 229000,
  monthlyRent: 2050,
  annualTaxes: 6100,
  annualInsurance: 1650,
  rehabBudget: 18000,
  arv: 265000,
};
const asOf = new Date("2026-11-18T12:00:00Z");

describe("owned performance", () => {
  // Golden values computed independently (Python closed-form amortization).
  const p = analyzeOwned(inputs, { purchaseDate: "2024-11-18", actualMonthlyRent: 2150, actualMonthlyExpenses: 900, currentValue: 280000 }, asOf);

  it("counts whole months owned", () => {
    expect(p.monthsOwned).toBe(24);
    expect(monthsBetween("2024-11-19", asOf)).toBe(23);
    expect(monthsBetween("not-a-date", asOf)).toBe(0);
  });

  it("amortizes the loan to today and reports equity", () => {
    expect(p.monthlyPrincipalAndInterest).toBeCloseTo(1230.44, 2);
    expect(p.loanBalanceToday).toBeCloseTo(168614.07, 1);
    expect(p.equity).toBeCloseTo(111385.93, 1);
  });

  it("compares actual cash flow to the underwriting", () => {
    expect(p.actualCashFlowMonthly).toBeCloseTo(19.56, 2);
    expect(p.actualDscr!).toBeCloseTo(1.0159, 3);
    expect(p.cashFlowVariance).toBeCloseTo(19.56 - p.projectedCashFlowMonthly, 2);
  });

  it("computes total and annualized return since purchase", () => {
    expect(p.totalReturnToDate).toBeCloseTo(36605.41, 0);
    expect(p.annualizedReturn!).toBeCloseTo(0.202396, 4);
  });

  it("flags rent shortfalls and expense overruns", () => {
    const weak = analyzeOwned(inputs, { purchaseDate: "2025-11-18", actualMonthlyRent: 1800, actualMonthlyExpenses: 1300 }, asOf);
    expect(weak.notes.some((n) => n.startsWith("Collected rent is 12% below plan"))).toBe(true);
    expect(weak.notes.some((n) => n.startsWith("Expenses run"))).toBe(true);
  });
});

describe("portfolio totals", () => {
  it("rolls up value, debt, equity, LTV, DSCR and cash-on-cash", () => {
    const a = analyzeOwned(inputs, { purchaseDate: "2024-11-18", actualMonthlyRent: 2150, actualMonthlyExpenses: 900, currentValue: 280000 }, asOf);
    const b = analyzeOwned({ ...inputs, purchasePrice: 300000, rehabBudget: 0 }, { purchaseDate: "2025-05-18", actualMonthlyRent: 2600, actualMonthlyExpenses: 950 }, asOf);
    const t = portfolioTotals([a, b]);
    expect(t.properties).toBe(2);
    expect(t.value).toBeCloseTo(a.currentValue + b.currentValue, 6);
    expect(t.equity).toBeCloseTo(t.value - t.debt, 6);
    expect(t.dscr!).toBeCloseTo((a.actualNoiMonthly + b.actualNoiMonthly) / (a.monthlyPrincipalAndInterest + b.monthlyPrincipalAndInterest), 6);
    expect(t.cashOnCash!).toBeCloseTo(((a.actualCashFlowMonthly + b.actualCashFlowMonthly) * 12) / (a.cashInvested + b.cashInvested), 6);
  });
});

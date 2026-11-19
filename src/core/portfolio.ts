/**
 * Owned-property performance: actual results vs the underwriting, today's loan balance, equity,
 * and return since purchase. Pure and deterministic, built on core/investorMath.
 */
import { analyzeRental, remainingBalance, type AnalyzerInputs } from "./investorMath";

export type OwnedActuals = {
  purchaseDate: string; // YYYY-MM-DD (closing date)
  actualMonthlyRent: number; // rent actually collected, averaged per month
  actualMonthlyExpenses: number; // operating expenses actually paid per month (taxes, insurance, repairs, mgmt, utilities, HOA) — excludes the mortgage
  currentValue?: number;
  monthsVacantLast12?: number;
};

export type OwnedPerformance = {
  monthsOwned: number;
  actualNoiMonthly: number;
  monthlyPrincipalAndInterest: number;
  actualCashFlowMonthly: number;
  projectedCashFlowMonthly: number;
  cashFlowVariance: number;
  actualDscr: number | null;
  loanBalanceToday: number;
  principalPaidSoFar: number;
  currentValue: number;
  equity: number;
  ltv: number | null;
  appreciationSinceBuy: number;
  totalReturnToDate: number;
  annualizedReturn: number | null;
  cashInvested: number;
  rentVariancePct: number | null;
  expenseVariancePct: number | null;
  notes: string[];
};

export function monthsBetween(fromIso: string, to: Date): number {
  const from = new Date(`${fromIso}T12:00:00Z`);
  if (Number.isNaN(from.getTime())) return 0;
  const months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth()) - (to.getUTCDate() < from.getUTCDate() ? 1 : 0);
  return Math.max(0, months);
}

export function analyzeOwned(inputs: AnalyzerInputs, actuals: OwnedActuals, asOf: Date = new Date()): OwnedPerformance {
  const projected = analyzeRental(inputs);
  const monthsOwned = monthsBetween(actuals.purchaseDate, asOf);
  const pi = projected.monthlyPrincipalAndInterest;
  const actualNoiMonthly = actuals.actualMonthlyRent - actuals.actualMonthlyExpenses;
  const actualCashFlowMonthly = actualNoiMonthly - pi;
  const loanBalanceToday = remainingBalance(projected.loanAmount, inputs.interestRate, inputs.loanTermYears, monthsOwned);
  const principalPaidSoFar = projected.loanAmount - loanBalanceToday;
  const basis = inputs.purchasePrice + inputs.rehabBudget;
  const currentValue = actuals.currentValue && actuals.currentValue > 0 ? actuals.currentValue : basis;
  const equity = currentValue - loanBalanceToday;
  const appreciationSinceBuy = currentValue - basis;
  const cashInvested = projected.totalCashInvested;
  // Cash flow to date is estimated from today's run rate; enter actual totals in Notes for exact tracking.
  const cashFlowToDate = actualCashFlowMonthly * monthsOwned;
  const totalReturnToDate = cashFlowToDate + principalPaidSoFar + appreciationSinceBuy;
  const years = monthsOwned / 12;
  const annualizedReturn = cashInvested > 0 && years >= 1 && cashInvested + totalReturnToDate > 0
    ? Math.pow((cashInvested + totalReturnToDate) / cashInvested, 1 / years) - 1
    : null;
  const projectedRent = inputs.monthlyRent + inputs.otherMonthlyIncome;
  const projectedExpenses = projected.operating.totalOperatingExpenses / 12;
  const notes: string[] = [];
  const rentVariancePct = projectedRent > 0 ? actuals.actualMonthlyRent / projectedRent - 1 : null;
  const expenseVariancePct = projectedExpenses > 0 ? actuals.actualMonthlyExpenses / projectedExpenses - 1 : null;
  if (rentVariancePct !== null && rentVariancePct < -0.05) notes.push(`Collected rent is ${Math.round(-rentVariancePct * 100)}% below plan. Check vacancy, concessions, and delinquency.`);
  if (expenseVariancePct !== null && expenseVariancePct > 0.1) notes.push(`Expenses run ${Math.round(expenseVariancePct * 100)}% over plan. Your reserves for repairs and CapEx may be too thin for this property.`);
  if (expenseVariancePct !== null && expenseVariancePct < -0.25 && monthsOwned < 24) notes.push("Expenses are well under plan, which is common early on. Keep reserving for CapEx; big-ticket items arrive unevenly.");
  if ((actuals.monthsVacantLast12 ?? 0) >= 2) notes.push(`${actuals.monthsVacantLast12} vacant months in the last year. Review pricing, listing quality, and lease timing.`);
  if (equity > 0 && currentValue > 0 && loanBalanceToday / currentValue < 0.6 && monthsOwned >= 12) notes.push(`Loan-to-value is ${Math.round((loanBalanceToday / currentValue) * 100)}%. A cash-out refinance to 70-75% LTV could free equity for the next deal if the new payment still cash flows.`);
  return {
    monthsOwned,
    actualNoiMonthly,
    monthlyPrincipalAndInterest: pi,
    actualCashFlowMonthly,
    projectedCashFlowMonthly: projected.monthlyCashFlow,
    cashFlowVariance: actualCashFlowMonthly - projected.monthlyCashFlow,
    actualDscr: pi > 0 ? actualNoiMonthly / pi : null,
    loanBalanceToday,
    principalPaidSoFar,
    currentValue,
    equity,
    ltv: currentValue > 0 ? loanBalanceToday / currentValue : null,
    appreciationSinceBuy,
    totalReturnToDate,
    annualizedReturn,
    cashInvested,
    rentVariancePct,
    expenseVariancePct,
    notes,
  };
}

export type PortfolioTotals = {
  properties: number;
  value: number;
  debt: number;
  equity: number;
  ltv: number | null;
  monthlyCashFlow: number;
  monthlyNoi: number;
  monthlyDebtService: number;
  dscr: number | null;
  cashInvested: number;
  cashOnCash: number | null;
};

export function portfolioTotals(items: OwnedPerformance[]): PortfolioTotals {
  const sum = (f: (p: OwnedPerformance) => number) => items.reduce((a, p) => a + f(p), 0);
  const value = sum((p) => p.currentValue);
  const debt = sum((p) => p.loanBalanceToday);
  const monthlyNoi = sum((p) => p.actualNoiMonthly);
  const monthlyDebtService = sum((p) => p.monthlyPrincipalAndInterest);
  const monthlyCashFlow = sum((p) => p.actualCashFlowMonthly);
  const cashInvested = sum((p) => p.cashInvested);
  return {
    properties: items.length,
    value,
    debt,
    equity: value - debt,
    ltv: value > 0 ? debt / value : null,
    monthlyCashFlow,
    monthlyNoi,
    monthlyDebtService,
    dscr: monthlyDebtService > 0 ? monthlyNoi / monthlyDebtService : null,
    cashInvested,
    cashOnCash: cashInvested > 0 ? (monthlyCashFlow * 12) / cashInvested : null,
  };
}

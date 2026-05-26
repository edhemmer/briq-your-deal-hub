// Returns Engine — deterministic N-year hold model.
// Levered & unlevered IRR (Newton-Raphson), Equity Multiple, AAR, year-by-year cash flow.
// No AI. Pure math. Conservative defaults. Truthful partial degradation.

import type { DealInput, AnalysisResult } from "@/lib/dealAnalysisEngine";

export interface ReturnsAssumptions {
  hold_years: number;            // default 5
  rent_growth: number;           // annual, default 0.025
  expense_growth: number;        // annual, default 0.030
  appreciation: number;          // annual, default 0.030
  exit_cap_rate: number | null;  // if null, exit on appreciation; if set, exit on year-N NOI / exit_cap
  cost_of_sale_pct: number;      // default 0.06 (broker + closing)
}

export const DEFAULT_RETURNS_ASSUMPTIONS: ReturnsAssumptions = {
  hold_years: 5,
  rent_growth: 0.025,
  expense_growth: 0.030,
  appreciation: 0.030,
  exit_cap_rate: null,
  cost_of_sale_pct: 0.06,
};

export interface YearRow {
  year: number;
  gross_rent: number;
  vacancy_loss: number;
  other_income: number;
  effective_income: number;
  operating_expenses: number;
  noi: number;
  debt_service: number;
  cash_flow_before_tax: number;
  cumulative_cash_flow: number;
  loan_balance_eoy: number;
  coc_return: number;            // cf_year / initial equity
}

export interface ExitDetails {
  year: number;
  projected_value: number;
  sale_costs: number;
  loan_balance_at_exit: number;
  net_sale_proceeds: number;     // value - sale_costs - loan_balance
  basis_method: "exit_cap" | "appreciation";
}

export interface ReturnsResult {
  assumptions: ReturnsAssumptions;
  initial_equity: number;
  years: YearRow[];
  exit: ExitDetails | null;
  summary: {
    total_cash_flow: number;
    total_appreciation_gain: number;
    total_return: number;          // total cf + net proceeds - initial equity
    equity_multiple: number | null;
    levered_irr: number | null;
    unlevered_irr: number | null;
    average_coc: number;
    aar: number | null;            // average annual return (total_return / equity / years)
  };
  warnings: string[];
}

// ── Loan amortization: remaining balance after k months ─────────────────
function remainingBalance(loan: number, monthlyRate: number, totalMonths: number, monthsPaid: number): number {
  if (loan <= 0) return 0;
  if (monthsPaid >= totalMonths) return 0;
  if (monthlyRate === 0) {
    return loan * (1 - monthsPaid / totalMonths);
  }
  const pmt = loan * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  const bal = loan * Math.pow(1 + monthlyRate, monthsPaid) - pmt * ((Math.pow(1 + monthlyRate, monthsPaid) - 1) / monthlyRate);
  return Math.max(0, bal);
}

// ── IRR via Newton-Raphson ──────────────────────────────────────────────
function npv(rate: number, cashflows: number[]): number {
  let v = 0;
  for (let t = 0; t < cashflows.length; t++) v += cashflows[t] / Math.pow(1 + rate, t);
  return v;
}
function dnpv(rate: number, cashflows: number[]): number {
  let v = 0;
  for (let t = 1; t < cashflows.length; t++) v -= (t * cashflows[t]) / Math.pow(1 + rate, t + 1);
  return v;
}
export function irr(cashflows: number[], guess = 0.1): number | null {
  if (cashflows.length < 2) return null;
  const hasPos = cashflows.some(c => c > 0);
  const hasNeg = cashflows.some(c => c < 0);
  if (!hasPos || !hasNeg) return null;
  let r = guess;
  for (let i = 0; i < 100; i++) {
    const f = npv(r, cashflows);
    const df = dnpv(r, cashflows);
    if (Math.abs(df) < 1e-10) break;
    const next = r - f / df;
    if (!isFinite(next)) return null;
    if (Math.abs(next - r) < 1e-7) return next;
    r = next;
    if (r < -0.999) r = -0.999;
  }
  // Fallback bisection
  let lo = -0.99, hi = 10;
  let fLo = npv(lo, cashflows), fHi = npv(hi, cashflows);
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fM = npv(mid, cashflows);
    if (Math.abs(fM) < 1e-6) return mid;
    if (fLo * fM < 0) { hi = mid; fHi = fM; } else { lo = mid; fLo = fM; }
  }
  return (lo + hi) / 2;
}

export function buildReturns(
  input: DealInput,
  analysis: AnalysisResult,
  assumptions: Partial<ReturnsAssumptions> = {}
): ReturnsResult {
  const a: ReturnsAssumptions = { ...DEFAULT_RETURNS_ASSUMPTIONS, ...assumptions };
  const warnings: string[] = [];

  const purchasePrice = input.purchase_price || 0;
  const arv = input.arv || purchasePrice;
  const loanAmount = analysis.financing.loan_amount;
  const monthlyRate = (input.interest_rate || 0) / 12;
  const totalMonths = (input.loan_term_years || 0) * 12;
  const annualDS = analysis.financing.annual_debt_service;
  const initialEquity = analysis.metrics.initial_cash_required;

  if (initialEquity <= 0) warnings.push("Initial equity not modeled — returns metrics suppressed.");
  if (purchasePrice <= 0) warnings.push("Purchase price missing — returns degraded.");
  if (loanAmount > 0 && totalMonths === 0) warnings.push("Loan term missing — amortization not modeled.");

  // Year-0 baseline (annual figures from analysis)
  const baseGross = analysis.income.gross_rent;
  const baseOpex = analysis.expenses.operating_expenses;
  const baseOther = analysis.income.other_income;
  const vacPct = input.vacancy_percent || 0;

  const years: YearRow[] = [];
  let cumCF = 0;
  for (let y = 1; y <= a.hold_years; y++) {
    const growthFactor = Math.pow(1 + a.rent_growth, y - 1);
    const expFactor = Math.pow(1 + a.expense_growth, y - 1);
    const gross = baseGross * growthFactor;
    const other = baseOther * growthFactor;
    const vacancy = gross * vacPct;
    const eff = gross - vacancy + other;
    const opex = baseOpex * expFactor;
    const noi = eff - opex;
    const cf = noi - annualDS;
    cumCF += cf;
    const loanBalEoy = totalMonths > 0 ? remainingBalance(loanAmount, monthlyRate, totalMonths, y * 12) : loanAmount;
    years.push({
      year: y,
      gross_rent: gross,
      vacancy_loss: vacancy,
      other_income: other,
      effective_income: eff,
      operating_expenses: opex,
      noi,
      debt_service: annualDS,
      cash_flow_before_tax: cf,
      cumulative_cash_flow: cumCF,
      loan_balance_eoy: loanBalEoy,
      coc_return: initialEquity > 0 ? cf / initialEquity : 0,
    });
  }

  // Exit value
  let exit: ExitDetails | null = null;
  if (purchasePrice > 0 && years.length > 0) {
    const lastYear = years[years.length - 1];
    let projectedValue: number;
    let method: "exit_cap" | "appreciation";
    if (a.exit_cap_rate && a.exit_cap_rate > 0) {
      projectedValue = lastYear.noi / a.exit_cap_rate;
      method = "exit_cap";
    } else {
      projectedValue = arv * Math.pow(1 + a.appreciation, a.hold_years);
      method = "appreciation";
    }
    const saleCosts = projectedValue * a.cost_of_sale_pct;
    const loanBal = lastYear.loan_balance_eoy;
    exit = {
      year: a.hold_years,
      projected_value: projectedValue,
      sale_costs: saleCosts,
      loan_balance_at_exit: loanBal,
      net_sale_proceeds: projectedValue - saleCosts - loanBal,
      basis_method: method,
    };
  }

  // IRR cashflow series
  let leveredIRR: number | null = null;
  let unleveredIRR: number | null = null;
  if (initialEquity > 0 && exit) {
    const leveredCF = [-initialEquity];
    for (let i = 0; i < years.length; i++) {
      const isLast = i === years.length - 1;
      leveredCF.push(years[i].cash_flow_before_tax + (isLast ? exit.net_sale_proceeds : 0));
    }
    leveredIRR = irr(leveredCF);
  }
  // Unlevered: invest full purchase + costs, receive NOI annually + gross sale net of costs (no loan)
  const unleveredEquity = purchasePrice + (input.closing_costs || 0) + (input.rehab_cost || 0) + (input.rehab_contingency || 0);
  if (unleveredEquity > 0 && exit) {
    const unleveredCF = [-unleveredEquity];
    for (let i = 0; i < years.length; i++) {
      const isLast = i === years.length - 1;
      const unleveredExit = isLast ? exit.projected_value - exit.sale_costs : 0;
      unleveredCF.push(years[i].noi + unleveredExit);
    }
    unleveredIRR = irr(unleveredCF);
  }

  const totalCF = cumCF;
  const totalAppreciation = exit ? exit.net_sale_proceeds : 0;
  const totalReturn = totalCF + totalAppreciation - initialEquity;
  const equityMultiple = initialEquity > 0 && exit ? (totalCF + totalAppreciation) / initialEquity : null;
  const avgCoc = years.length > 0 ? years.reduce((s, y) => s + y.coc_return, 0) / years.length : 0;
  const aar = initialEquity > 0 && a.hold_years > 0 ? totalReturn / initialEquity / a.hold_years : null;

  return {
    assumptions: a,
    initial_equity: initialEquity,
    years,
    exit,
    summary: {
      total_cash_flow: totalCF,
      total_appreciation_gain: totalAppreciation - initialEquity + (initialEquity - (exit ? exit.projected_value - exit.sale_costs - exit.loan_balance_at_exit : 0)), // not used externally
      total_return: totalReturn,
      equity_multiple: equityMultiple,
      levered_irr: leveredIRR,
      unlevered_irr: unleveredIRR,
      average_coc: avgCoc,
      aar,
    },
    warnings,
  };
}

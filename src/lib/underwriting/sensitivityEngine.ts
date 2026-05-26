// Sensitivity Engine — deterministic 2-D matrices, tornado, and break-evens.
// No AI. Pure math. Conservative-bias on missing inputs.
//
// Builds scenario re-pricing on top of the canonical analysis + returns engine
// by perturbing a small set of drivers (rent, price, rate, vacancy, exit cap,
// rent growth) and recomputing key outcomes (Cap Rate, CoC, DSCR, Levered IRR).

import type { DealInput, AnalysisResult } from "@/lib/dealAnalysisEngine";
import { buildReturns, DEFAULT_RETURNS_ASSUMPTIONS, irr, type ReturnsAssumptions } from "@/lib/underwriting/returnsEngine";

// ── Driver definitions ─────────────────────────────────────────────────
export type DriverKey =
  | "rent_pct"
  | "price_pct"
  | "interest_rate_bps"
  | "vacancy_pct"
  | "exit_cap_bps"
  | "rent_growth_bps";

export interface ScenarioDelta {
  rent_pct?: number;          // +0.05 = +5% rent
  price_pct?: number;         // +0.05 = +5% purchase price
  interest_rate_bps?: number; // +50 = +50 bps on note rate
  vacancy_pct?: number;       // +0.02 = +2 pts vacancy (absolute)
  exit_cap_bps?: number;      // +50 = exit cap higher by 50 bps
  rent_growth_bps?: number;   // +100 = +100 bps annual rent growth
}

export interface ScenarioMetrics {
  cap_rate: number;
  cash_on_cash: number;
  dscr: number;
  monthly_cashflow: number;
  levered_irr: number | null;
  equity_multiple: number | null;
}

// ── Core scenario re-pricer (analytical, no canonical re-run) ──────────
// Mirrors the formulas in dealAnalysisEngine without round-tripping it.
function priceScenario(
  input: DealInput,
  analysis: AnalysisResult,
  assumptions: ReturnsAssumptions,
  d: ScenarioDelta
): ScenarioMetrics {
  const rentMult = 1 + (d.rent_pct ?? 0);
  const priceMult = 1 + (d.price_pct ?? 0);
  const vacAdj = (input.vacancy_percent || 0) + (d.vacancy_pct ?? 0);
  const noteRate = (input.interest_rate || 0) + (d.interest_rate_bps ?? 0) / 10000;

  const purchasePrice = (input.purchase_price || 0) * priceMult;
  const grossRent = analysis.income.gross_rent * rentMult;
  const otherInc = analysis.income.other_income;
  const effective = grossRent * (1 - Math.max(0, Math.min(1, vacAdj))) + otherInc;
  const opex = analysis.expenses.operating_expenses;
  const noi = effective - opex;

  // Loan re-priced on new purchase price at original LTV
  const origPrice = input.purchase_price || purchasePrice || 1;
  const origLoan = analysis.financing.loan_amount;
  const ltv = origPrice > 0 ? origLoan / origPrice : 0;
  const loanAmount = purchasePrice * ltv;
  const termMonths = (input.loan_term_years || 0) * 12;
  const monthlyRate = noteRate / 12;
  const monthlyPmt = termMonths > 0 && loanAmount > 0
    ? (monthlyRate === 0
        ? loanAmount / termMonths
        : loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1))
    : 0;
  const annualDS = monthlyPmt * 12;

  const cashFlow = noi - annualDS;
  const capRate = purchasePrice > 0 ? noi / purchasePrice : 0;
  const dscr = annualDS > 0 ? noi / annualDS : (noi > 0 ? Infinity : 0);

  // Initial equity scales with price delta (down payment + costs); keep rehab fixed
  const downPayment = purchasePrice - loanAmount;
  const closingCosts = input.closing_costs || 0;
  const rehab = (input.rehab_cost || 0) + (input.rehab_contingency || 0);
  const initialEquity = downPayment + closingCosts + rehab;
  const coc = initialEquity > 0 ? cashFlow / initialEquity : 0;

  // ── Multi-year for IRR / EM ─────────────────────────────────────────
  const a: ReturnsAssumptions = {
    ...assumptions,
    rent_growth: assumptions.rent_growth + (d.rent_growth_bps ?? 0) / 10000,
    exit_cap_rate:
      d.exit_cap_bps != null
        ? Math.max(0.001, (assumptions.exit_cap_rate ?? Math.max(capRate, 0.05)) + d.exit_cap_bps / 10000)
        : assumptions.exit_cap_rate,
  };

  let leveredIRR: number | null = null;
  let equityMultiple: number | null = null;
  if (initialEquity > 0 && termMonths > 0) {
    const cf: number[] = [-initialEquity];
    let lastNoi = noi;
    let lastLoanBal = loanAmount;
    let totalCF = 0;
    for (let y = 1; y <= a.hold_years; y++) {
      const growth = Math.pow(1 + a.rent_growth, y - 1);
      const expGrowth = Math.pow(1 + a.expense_growth, y - 1);
      const yGross = grossRent * growth;
      const yOther = otherInc * growth;
      const yEff = yGross * (1 - Math.max(0, Math.min(1, vacAdj))) + yOther;
      const yOpex = opex * expGrowth;
      const yNoi = yEff - yOpex;
      const yCF = yNoi - annualDS;
      totalCF += yCF;
      lastNoi = yNoi;
      // Amortize loan balance
      if (monthlyRate === 0) {
        lastLoanBal = loanAmount * Math.max(0, 1 - (y * 12) / termMonths);
      } else {
        lastLoanBal = Math.max(
          0,
          loanAmount * Math.pow(1 + monthlyRate, y * 12) -
            monthlyPmt * ((Math.pow(1 + monthlyRate, y * 12) - 1) / monthlyRate)
        );
      }
      // Exit on last year
      if (y === a.hold_years) {
        let exitValue: number;
        if (a.exit_cap_rate && a.exit_cap_rate > 0) {
          exitValue = yNoi / a.exit_cap_rate;
        } else {
          const arv = (input.arv || purchasePrice) * priceMult;
          exitValue = arv * Math.pow(1 + a.appreciation, a.hold_years);
        }
        const saleCosts = exitValue * a.cost_of_sale_pct;
        const netProceeds = exitValue - saleCosts - lastLoanBal;
        cf.push(yCF + netProceeds);
        equityMultiple = (totalCF + netProceeds) / initialEquity;
      } else {
        cf.push(yCF);
      }
    }
    leveredIRR = irr(cf);
  }

  return {
    cap_rate: capRate,
    cash_on_cash: coc,
    dscr: dscr === Infinity ? 99 : dscr,
    monthly_cashflow: cashFlow / 12,
    levered_irr: leveredIRR,
    equity_multiple: equityMultiple,
  };
}

// ── 2-D matrix builder ─────────────────────────────────────────────────
export interface MatrixAxis {
  driver: DriverKey;
  label: string;
  values: number[];           // raw delta values
  format: (v: number) => string;
}

export interface MatrixResult {
  metric: keyof ScenarioMetrics;
  metricLabel: string;
  rowAxis: MatrixAxis;
  colAxis: MatrixAxis;
  cells: ScenarioMetrics[][];
}

export function buildMatrix(
  input: DealInput,
  analysis: AnalysisResult,
  assumptions: ReturnsAssumptions,
  rowAxis: MatrixAxis,
  colAxis: MatrixAxis,
  metric: keyof ScenarioMetrics = "levered_irr"
): MatrixResult {
  const cells: ScenarioMetrics[][] = [];
  for (const rv of rowAxis.values) {
    const row: ScenarioMetrics[] = [];
    for (const cv of colAxis.values) {
      const delta: ScenarioDelta = { [rowAxis.driver]: rv, [colAxis.driver]: cv } as ScenarioDelta;
      row.push(priceScenario(input, analysis, assumptions, delta));
    }
    cells.push(row);
  }
  return {
    metric,
    metricLabel: METRIC_LABELS[metric],
    rowAxis,
    colAxis,
    cells,
  };
}

const METRIC_LABELS: Record<keyof ScenarioMetrics, string> = {
  cap_rate: "Cap Rate",
  cash_on_cash: "Cash-on-Cash",
  dscr: "DSCR",
  monthly_cashflow: "Monthly Cash Flow",
  levered_irr: "Levered IRR",
  equity_multiple: "Equity Multiple",
};

// ── Tornado chart: ± single-variable sensitivity ───────────────────────
export interface TornadoBar {
  driver: DriverKey;
  label: string;
  low: { delta: ScenarioDelta; metric: number | null };
  high: { delta: ScenarioDelta; metric: number | null };
  base: number | null;
  swing: number;              // |high - low|
}

const TORNADO_RANGES: Record<DriverKey, { low: number; high: number; label: string }> = {
  rent_pct:           { low: -0.10,  high:  0.10,  label: "Rent ±10%" },
  price_pct:          { low: -0.05,  high:  0.05,  label: "Price ±5%" },
  interest_rate_bps:  { low: -100,   high:  100,   label: "Rate ±100 bps" },
  vacancy_pct:        { low: -0.03,  high:  0.03,  label: "Vacancy ±3 pts" },
  exit_cap_bps:       { low: -50,    high:  100,   label: "Exit Cap −50/+100 bps" },
  rent_growth_bps:    { low: -100,   high:  100,   label: "Rent Growth ±100 bps" },
};

export function buildTornado(
  input: DealInput,
  analysis: AnalysisResult,
  assumptions: ReturnsAssumptions,
  metric: keyof ScenarioMetrics = "levered_irr"
): { metric: keyof ScenarioMetrics; metricLabel: string; base: number | null; bars: TornadoBar[] } {
  const baseScenario = priceScenario(input, analysis, assumptions, {});
  const base = baseScenario[metric] as number | null;

  const drivers: DriverKey[] = ["rent_pct", "price_pct", "interest_rate_bps", "vacancy_pct", "exit_cap_bps", "rent_growth_bps"];
  const bars: TornadoBar[] = drivers.map(d => {
    const lo = { [d]: TORNADO_RANGES[d].low } as ScenarioDelta;
    const hi = { [d]: TORNADO_RANGES[d].high } as ScenarioDelta;
    const loRes = priceScenario(input, analysis, assumptions, lo)[metric] as number | null;
    const hiRes = priceScenario(input, analysis, assumptions, hi)[metric] as number | null;
    const swing = loRes != null && hiRes != null ? Math.abs(hiRes - loRes) : 0;
    return {
      driver: d,
      label: TORNADO_RANGES[d].label,
      low: { delta: lo, metric: loRes },
      high: { delta: hi, metric: hiRes },
      base,
      swing,
    };
  });

  bars.sort((a, b) => b.swing - a.swing);
  return { metric, metricLabel: METRIC_LABELS[metric], base, bars };
}

// ── Break-even table ───────────────────────────────────────────────────
// Bisection search for the delta that drives a target metric to a threshold.
export interface BreakEvenRow {
  label: string;
  metric: string;
  target: string;
  current_value: number | null;
  break_even_delta: number | null;
  break_even_display: string;
}

function bisect(
  fn: (x: number) => number,
  lo: number,
  hi: number,
  target: number,
  tol = 1e-4
): number | null {
  let fLo = fn(lo) - target;
  let fHi = fn(hi) - target;
  if (!isFinite(fLo) || !isFinite(fHi)) return null;
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fMid = fn(mid) - target;
    if (Math.abs(fMid) < tol) return mid;
    if (fLo * fMid < 0) { hi = mid; fHi = fMid; } else { lo = mid; fLo = fMid; }
  }
  return (lo + hi) / 2;
}

export function buildBreakEvens(
  input: DealInput,
  analysis: AnalysisResult,
  assumptions: ReturnsAssumptions
): BreakEvenRow[] {
  const rows: BreakEvenRow[] = [];

  // Break-even occupancy: vacancy delta that drives DSCR to 1.0
  const dscrAtVac = (v: number) => priceScenario(input, analysis, assumptions, { vacancy_pct: v }).dscr;
  const beVacancy = bisect(dscrAtVac, -0.5, 0.99, 1.0);
  rows.push({
    label: "Break-even Vacancy (DSCR = 1.00)",
    metric: "DSCR",
    target: "1.00",
    current_value: analysis.metrics.dscr,
    break_even_delta: beVacancy,
    break_even_display: beVacancy == null
      ? "Not reachable in range"
      : `${(((input.vacancy_percent || 0) + beVacancy) * 100).toFixed(1)}% vacancy`,
  });

  // Break-even rent: rent delta that drives CF to 0
  const cfAtRent = (r: number) => priceScenario(input, analysis, assumptions, { rent_pct: r }).monthly_cashflow;
  const beRent = bisect(cfAtRent, -0.8, 0.8, 0);
  rows.push({
    label: "Break-even Rent (CF = $0)",
    metric: "Monthly Cash Flow",
    target: "$0",
    current_value: analysis.metrics.monthly_cashflow,
    break_even_delta: beRent,
    break_even_display: beRent == null
      ? "Not reachable in range"
      : `${beRent >= 0 ? "+" : ""}${(beRent * 100).toFixed(1)}% rent (${(analysis.income.gross_rent * (1 + beRent) / 12).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}/mo)`,
  });

  // Break-even rate: interest-rate bps delta that drives DSCR to 1.25
  const dscrAtRate = (b: number) => priceScenario(input, analysis, assumptions, { interest_rate_bps: b }).dscr;
  const beRate = bisect(dscrAtRate, -500, 1000, 1.25);
  rows.push({
    label: "Break-even Rate (DSCR = 1.25)",
    metric: "DSCR",
    target: "1.25",
    current_value: analysis.metrics.dscr,
    break_even_delta: beRate,
    break_even_display: beRate == null
      ? "Not reachable in range"
      : `${beRate >= 0 ? "+" : ""}${beRate.toFixed(0)} bps (${(((input.interest_rate || 0) + beRate / 10000) * 100).toFixed(2)}% rate)`,
  });

  // Break-even exit cap: cap bps delta that drives Levered IRR to 0.10
  const irrAtCap = (b: number) => {
    const v = priceScenario(input, analysis, assumptions, { exit_cap_bps: b }).levered_irr;
    return v == null ? -99 : v;
  };
  const beCap = bisect(irrAtCap, -300, 500, 0.10);
  const baseCap = assumptions.exit_cap_rate ?? Math.max(analysis.metrics.cap_rate, 0.05);
  rows.push({
    label: "Break-even Exit Cap (IRR = 10%)",
    metric: "Levered IRR",
    target: "10.00%",
    current_value: null,
    break_even_delta: beCap,
    break_even_display: beCap == null
      ? "Not reachable in range"
      : `${beCap >= 0 ? "+" : ""}${beCap.toFixed(0)} bps (${((baseCap + beCap / 10000) * 100).toFixed(2)}% cap)`,
  });

  return rows;
}

// ── Convenience: standard axis presets ─────────────────────────────────
export const AXIS_PRESETS = {
  rentPct: (steps = 5): MatrixAxis => ({
    driver: "rent_pct",
    label: "Rent Δ",
    values: linspace(-0.10, 0.10, steps),
    format: v => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`,
  }),
  pricePct: (steps = 5): MatrixAxis => ({
    driver: "price_pct",
    label: "Price Δ",
    values: linspace(-0.05, 0.05, steps),
    format: v => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`,
  }),
  rateBps: (steps = 5): MatrixAxis => ({
    driver: "interest_rate_bps",
    label: "Rate Δ",
    values: linspace(-100, 100, steps),
    format: v => `${v >= 0 ? "+" : ""}${v.toFixed(0)} bps`,
  }),
  exitCapBps: (steps = 5): MatrixAxis => ({
    driver: "exit_cap_bps",
    label: "Exit Cap Δ",
    values: linspace(-50, 100, steps),
    format: v => `${v >= 0 ? "+" : ""}${v.toFixed(0)} bps`,
  }),
  vacancyPct: (steps = 5): MatrixAxis => ({
    driver: "vacancy_pct",
    label: "Vacancy Δ",
    values: linspace(-0.02, 0.04, steps),
    format: v => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)} pts`,
  }),
};

function linspace(a: number, b: number, n: number): number[] {
  if (n <= 1) return [a];
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(a + ((b - a) * i) / (n - 1));
  return out;
}

// Re-export defaults for convenience
export { DEFAULT_RETURNS_ASSUMPTIONS };

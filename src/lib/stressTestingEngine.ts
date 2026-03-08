// BRIQ Stress Testing Engine v1.7.0 — deterministic scenario modeling.
// Consumes finalized deal outputs; never mutates baseline values.

import type { DealInput, AnalysisResult } from "./dealAnalysisEngine";
import { analyzeDeal } from "./dealAnalysisEngine";

// ── Types ──────────────────────────────────────────────────────────────

export type ScenarioCategory = "interest" | "rent" | "vacancy" | "rehab" | "expenses";

export interface StressScenario {
  id: string;
  category: ScenarioCategory;
  label: string;
  shortLabel: string;
  description: string;
}

export interface StressedMetrics {
  monthly_cashflow: number;
  annual_cashflow: number;
  dscr: number;
  cash_on_cash: number;
  break_even_occupancy: number;
}

export interface ScenarioResult {
  scenario: StressScenario;
  baseline: StressedMetrics;
  stressed: StressedMetrics;
  delta: StressedMetrics;
}

export type ResilienceLevel = "Strong" | "Moderate" | "Fragile";

export interface StressTestResults {
  resilience: ResilienceLevel;
  resilienceInsight: string;
  scenarios: ScenarioResult[];
}

// ── Canonical Scenarios ────────────────────────────────────────────────

export const STRESS_SCENARIOS: StressScenario[] = [
  // Interest rate
  { id: "ir_1", category: "interest", label: "Interest Rate +1%", shortLabel: "+1%", description: "Rate increases by 1 percentage point" },
  { id: "ir_2", category: "interest", label: "Interest Rate +2%", shortLabel: "+2%", description: "Rate increases by 2 percentage points" },
  // Rent
  { id: "rent_5", category: "rent", label: "Rent −5%", shortLabel: "−5%", description: "Monthly rent decreases by 5%" },
  { id: "rent_10", category: "rent", label: "Rent −10%", shortLabel: "−10%", description: "Monthly rent decreases by 10%" },
  // Vacancy
  { id: "vac_5", category: "vacancy", label: "Vacancy +5%", shortLabel: "+5%", description: "Vacancy rate increases by 5 percentage points" },
  { id: "vac_10", category: "vacancy", label: "Vacancy +10%", shortLabel: "+10%", description: "Vacancy rate increases by 10 percentage points" },
  // Rehab
  { id: "rehab_10", category: "rehab", label: "Rehab +10%", shortLabel: "+10%", description: "Rehab costs increase by 10%" },
  { id: "rehab_20", category: "rehab", label: "Rehab +20%", shortLabel: "+20%", description: "Rehab costs increase by 20%" },
  // Expenses
  { id: "exp_5", category: "expenses", label: "OpEx +5%", shortLabel: "+5%", description: "Operating expenses increase by 5%" },
  { id: "exp_10", category: "expenses", label: "OpEx +10%", shortLabel: "+10%", description: "Operating expenses increase by 10%" },
];

// ── Helpers ────────────────────────────────────────────────────────────

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function safeDivide(a: number, b: number): number {
  if (!b || !Number.isFinite(b)) return 0;
  const r = a / b;
  return Number.isFinite(r) ? r : 0;
}

function extractMetrics(input: DealInput, result: AnalysisResult): StressedMetrics {
  const grossRent = result.income.gross_rent;
  const opEx = result.expenses.operating_expenses;
  const debtService = result.financing.annual_debt_service;
  // Break-even occupancy = (OpEx + Debt Service) / Gross Rent
  const breakEven = grossRent > 0 ? safe((opEx + debtService) / grossRent) : 0;

  return {
    monthly_cashflow: safe(result.metrics.monthly_cashflow),
    annual_cashflow: safe(result.metrics.annual_cashflow),
    dscr: safe(result.metrics.dscr),
    cash_on_cash: safe(result.metrics.cash_on_cash),
    break_even_occupancy: Math.min(breakEven, 1.5), // clamp for display
  };
}

function applyScenario(base: DealInput, scenario: StressScenario): DealInput {
  // Clone — never mutate original
  const d = { ...base };

  switch (scenario.id) {
    case "ir_1":
      d.interest_rate = base.interest_rate + 0.01;
      break;
    case "ir_2":
      d.interest_rate = base.interest_rate + 0.02;
      break;
    case "rent_5":
      d.monthly_rent = base.monthly_rent * 0.95;
      break;
    case "rent_10":
      d.monthly_rent = base.monthly_rent * 0.90;
      break;
    case "vac_5":
      d.vacancy_percent = base.vacancy_percent + 0.05;
      break;
    case "vac_10":
      d.vacancy_percent = base.vacancy_percent + 0.10;
      break;
    case "rehab_10":
      d.rehab_cost = base.rehab_cost * 1.10;
      d.rehab_contingency = base.rehab_contingency * 1.10;
      break;
    case "rehab_20":
      d.rehab_cost = base.rehab_cost * 1.20;
      d.rehab_contingency = base.rehab_contingency * 1.20;
      break;
    case "exp_5": {
      d.taxes = base.taxes * 1.05;
      d.insurance = base.insurance * 1.05;
      d.maintenance_percent = base.maintenance_percent * 1.05;
      d.management_percent = base.management_percent * 1.05;
      d.capex_percent = base.capex_percent * 1.05;
      break;
    }
    case "exp_10": {
      d.taxes = base.taxes * 1.10;
      d.insurance = base.insurance * 1.10;
      d.maintenance_percent = base.maintenance_percent * 1.10;
      d.management_percent = base.management_percent * 1.10;
      d.capex_percent = base.capex_percent * 1.10;
      break;
    }
  }
  return d;
}

function deltaMetrics(baseline: StressedMetrics, stressed: StressedMetrics): StressedMetrics {
  return {
    monthly_cashflow: safe(stressed.monthly_cashflow - baseline.monthly_cashflow),
    annual_cashflow: safe(stressed.annual_cashflow - baseline.annual_cashflow),
    dscr: safe(stressed.dscr - baseline.dscr),
    cash_on_cash: safe(stressed.cash_on_cash - baseline.cash_on_cash),
    break_even_occupancy: safe(stressed.break_even_occupancy - baseline.break_even_occupancy),
  };
}

// ── Resilience Assessment ──────────────────────────────────────────────

function assessResilience(scenarios: ScenarioResult[]): { level: ResilienceLevel; insight: string } {
  // Count how many scenarios produce negative cash flow
  const negativeCount = scenarios.filter(s => s.stressed.monthly_cashflow < 0).length;
  // Count how many scenarios break DSCR below 1.0
  const dscrBreakCount = scenarios.filter(s => s.stressed.dscr < 1.0).length;
  // Count scenarios where break-even occupancy exceeds 95%
  const breakEvenStressed = scenarios.filter(s => s.stressed.break_even_occupancy > 0.95).length;

  const total = scenarios.length;
  const failRate = (negativeCount + dscrBreakCount + breakEvenStressed) / (total * 3);

  if (failRate <= 0.15) {
    return {
      level: "Strong",
      insight: "This deal maintains positive performance across most stress scenarios. Cash flow and debt coverage remain healthy under moderate downside conditions.",
    };
  }
  if (failRate <= 0.40) {
    return {
      level: "Moderate",
      insight: "This deal shows vulnerability under some stress conditions. Cash flow turns negative or DSCR drops below coverage in select scenarios — monitor rate and vacancy exposure.",
    };
  }
  return {
    level: "Fragile",
    insight: "This deal is highly sensitive to market changes. Multiple scenarios produce negative cash flow or insufficient debt coverage — consider renegotiating terms or adjusting the investment thesis.",
  };
}

// ── Public API ─────────────────────────────────────────────────────────

export function runStressTests(dealInput: DealInput, baselineAnalysis: AnalysisResult): StressTestResults {
  const baseline = extractMetrics(dealInput, baselineAnalysis);

  const scenarios: ScenarioResult[] = STRESS_SCENARIOS.map(scenario => {
    const stressedInput = applyScenario(dealInput, scenario);
    const stressedAnalysis = analyzeDeal(stressedInput);
    const stressed = extractMetrics(stressedInput, stressedAnalysis);
    const delta = deltaMetrics(baseline, stressed);

    return { scenario, baseline, stressed, delta };
  });

  const { level, insight } = assessResilience(scenarios);

  return {
    resilience: level,
    resilienceInsight: insight,
    scenarios,
  };
}

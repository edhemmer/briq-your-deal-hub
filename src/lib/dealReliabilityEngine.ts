// BRIX Deal Reliability Engine v1.7.3 — deterministic downside testing,
// break detection, and fragility scoring.
// Runs AFTER the financial engine. Uses existing inputs only.
// No UI logic. No mutation of upstream data.

import type { DealInput, AnalysisResult } from "./dealAnalysisEngine";
import { analyzeDeal } from "./dealAnalysisEngine";

// ── Types ──────────────────────────────────────────────────────────────

export type BreakStatus = "stable" | "at_risk" | "breaks";
export type FragilityLevel = "low" | "moderate" | "high";

export interface ScenarioOutcome {
  cash_flow: number;
  dscr: number;
  break_status: BreakStatus;
}

export interface DealReliabilityResult {
  sensitivity: {
    rent_drop_10: ScenarioOutcome;
    expense_increase_15: ScenarioOutcome;
    tax_increase_20: ScenarioOutcome;
  };
  fragility_score: number; // 0–100
  fragility_level: FragilityLevel;
}

// ── Helpers ────────────────────────────────────────────────────────────

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function classifyBreakStatus(cashFlow: number, dscr: number): BreakStatus {
  if (cashFlow < 0 || dscr < 1.0) return "breaks";
  if (cashFlow <= 50 || (dscr >= 1.0 && dscr < 1.2)) return "at_risk";
  return "stable";
}

function mapFragilityLevel(score: number): FragilityLevel {
  if (score >= 60) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

// ── Scenario Runners ──────────────────────────────────────────────────

function runRentDrop10(input: DealInput): ScenarioOutcome {
  const stressed = { ...input, monthly_rent: input.monthly_rent * 0.9 };
  const result = analyzeDeal(stressed);
  return {
    cash_flow: safe(result.metrics.monthly_cashflow),
    dscr: safe(result.metrics.dscr),
    break_status: classifyBreakStatus(result.metrics.monthly_cashflow, result.metrics.dscr),
  };
}

function runExpenseIncrease15(input: DealInput): ScenarioOutcome {
  const stressed: DealInput = {
    ...input,
    taxes: input.taxes * 1.15,
    insurance: input.insurance * 1.15,
    maintenance_percent: input.maintenance_percent * 1.15,
    management_percent: input.management_percent * 1.15,
    capex_percent: input.capex_percent * 1.15,
  };
  const result = analyzeDeal(stressed);
  return {
    cash_flow: safe(result.metrics.monthly_cashflow),
    dscr: safe(result.metrics.dscr),
    break_status: classifyBreakStatus(result.metrics.monthly_cashflow, result.metrics.dscr),
  };
}

function runTaxIncrease20(input: DealInput): ScenarioOutcome {
  const stressed = { ...input, taxes: input.taxes * 1.20 };
  const result = analyzeDeal(stressed);
  return {
    cash_flow: safe(result.metrics.monthly_cashflow),
    dscr: safe(result.metrics.dscr),
    break_status: classifyBreakStatus(result.metrics.monthly_cashflow, result.metrics.dscr),
  };
}

// ── Fragility Scoring ─────────────────────────────────────────────────

function computeFragilityScore(
  scenarios: ScenarioOutcome[],
  baselineCashFlow: number
): number {
  let score = 0;

  for (const s of scenarios) {
    if (s.break_status === "breaks") score += 30;
    else if (s.break_status === "at_risk") score += 15;
  }

  // Multiple weak scenarios bonus
  const weakCount = scenarios.filter(s => s.break_status !== "stable").length;
  if (weakCount >= 2) score += 10;

  // Tight baseline cash flow bonus (monthly < $100)
  if (baselineCashFlow >= 0 && baselineCashFlow < 100) score += 10;

  return Math.min(score, 100);
}

// ── Public API ─────────────────────────────────────────────────────────

export function evaluateDealReliability(
  dealInput: DealInput,
  baselineAnalysis: AnalysisResult
): DealReliabilityResult {
  const rent_drop_10 = runRentDrop10(dealInput);
  const expense_increase_15 = runExpenseIncrease15(dealInput);
  const tax_increase_20 = runTaxIncrease20(dealInput);

  const allScenarios = [rent_drop_10, expense_increase_15, tax_increase_20];
  const fragility_score = computeFragilityScore(
    allScenarios,
    baselineAnalysis.metrics.monthly_cashflow
  );

  return {
    sensitivity: {
      rent_drop_10,
      expense_increase_15,
      tax_increase_20,
    },
    fragility_score,
    fragility_level: mapFragilityLevel(fragility_score),
  };
}

// BRIX Deal Intelligence Engine — deterministic, no AI judgement.

import type { AnalysisResult } from "./dealAnalysisEngine";

export interface DealIntelligenceResult {
  score: number;
  scoreLabel: string;
  decision: string;
  strengths: string[];
  warnings: string[];
  dealKillers: string[];
  refinanceViability: string;
  executionComplexity: string;
  summary: string;
}

function safeDivide(a: number, b: number): number {
  if (!b || !Number.isFinite(b)) return 0;
  const r = a / b;
  return Number.isFinite(r) ? r : 0;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function analyzeDealIntelligence(a: AnalysisResult): DealIntelligenceResult {
  const { metrics, refinance, expenses, rehab, acquisition } = a;
  const { dscr, cap_rate, monthly_cashflow, cash_on_cash, initial_cash_required } = metrics;
  const { equity_created, cash_out, refinance_amount } = refinance;
  const { loan_amount } = a.financing;
  const pp = acquisition.purchase_price;
  const rehab_cost = rehab.rehab_cost;
  const rehab_ratio = safeDivide(rehab_cost, pp);

  // --- Scoring ---
  let score = 100;

  // Negative adjustments
  if (dscr < 1.0) score -= 25;
  else if (dscr < 1.2) score -= 12;

  if (cap_rate < 0.05) score -= 15;
  else if (cap_rate < 0.06) score -= 8;

  if (monthly_cashflow < 0) score -= 20;
  else if (monthly_cashflow < 150) score -= 8;

  if (cash_on_cash < 0.08) score -= 15;
  else if (cash_on_cash < 0.12) score -= 6;

  if (equity_created <= 0) score -= 20;
  if (cash_out <= 0) score -= 10;
  if (initial_cash_required > 100000) score -= 6;

  if (rehab_ratio >= 0.25) score -= 10;
  else if (rehab_ratio >= 0.15) score -= 5;

  // Positive adjustments
  if (dscr >= 1.25) score += 5;
  if (cap_rate >= 0.08) score += 5;
  if (monthly_cashflow >= 300) score += 5;
  if (cash_on_cash >= 0.12) score += 5;
  if (equity_created > 0 && cash_out > 0) score += 5;

  score = clamp(score, 0, 100);

  // --- Score Label ---
  let scoreLabel: string;
  if (score >= 85) scoreLabel = "Excellent";
  else if (score >= 70) scoreLabel = "Strong";
  else if (score >= 55) scoreLabel = "Borderline";
  else scoreLabel = "Weak";

  // --- Deal Killers ---
  const dealKillers: string[] = [];
  if (dscr < 1) dealKillers.push("DSCR below 1.0 — debt service exceeds net operating income.");
  if (monthly_cashflow < 0) dealKillers.push("Negative monthly cash flow — the deal loses money each month.");
  if (equity_created <= 0) dealKillers.push("No equity created — ARV does not exceed total project cost.");
  if (refinance_amount <= loan_amount) dealKillers.push("Refinance does not cover existing loan balance.");

  // --- Warnings ---
  const warnings: string[] = [];
  if (cap_rate < 0.06) warnings.push("Cap rate below 6% — thin return relative to property value.");
  if (cash_on_cash < 0.08) warnings.push("Cash-on-cash below 8% — modest return on invested capital.");
  if (rehab_ratio > 0.15) warnings.push("Rehab exceeds 15% of purchase price — higher execution risk.");
  if (initial_cash_required > 100000) warnings.push("Over $100K initial cash required — high capital commitment.");
  if (monthly_cashflow >= 0 && monthly_cashflow < 150) warnings.push("Cash flow under $150/mo — limited margin of safety.");
  if (cash_out <= 0 && equity_created > 0) warnings.push("Positive equity but no cash-out at refinance.");

  // --- Strengths ---
  const strengths: string[] = [];
  if (dscr >= 1.25) strengths.push("DSCR at or above 1.25x — strong debt coverage.");
  if (cap_rate >= 0.08) strengths.push("Cap rate at or above 8% — excellent yield.");
  if (monthly_cashflow >= 300) strengths.push("Cash flow at or above $300/mo — healthy margin.");
  if (cash_on_cash >= 0.12) strengths.push("Cash-on-cash at or above 12% — strong investor return.");
  if (equity_created > 0) strengths.push("Positive equity created through value-add strategy.");
  if (cash_out > 0) strengths.push("Cash-out refinance viable — capital recycling possible.");

  // --- Decision ---
  let decision: string;
  if (dealKillers.length > 0) decision = "Caution";
  else if (score >= 85) decision = "Strong Buy";
  else if (score >= 70) decision = "Worth Pursuing";
  else if (score >= 55) decision = "Needs Negotiation";
  else decision = "High Risk";

  // --- Refinance Viability ---
  let refinanceViability: string;
  if (cash_out > 0 && equity_created > 0) refinanceViability = "Strong";
  else if (equity_created > 0 && cash_out <= 0) refinanceViability = "Moderate";
  else refinanceViability = "Weak";

  // --- Execution Complexity ---
  let executionComplexity: string;
  if (rehab_ratio < 0.10) executionComplexity = "Low";
  else if (rehab_ratio < 0.25) executionComplexity = "Moderate";
  else executionComplexity = "High";

  // --- Summary ---
  const primaryStrength = strengths.length > 0 ? strengths[0].split("—")[1]?.trim() ?? strengths[0] : "no notable strengths";
  const largestWarning = warnings.length > 0 ? warnings[0].split("—")[1]?.trim() ?? warnings[0] : "no major concerns";
  const summary = `${scoreLabel} deal with ${primaryStrength}. Watch for ${largestWarning}.`;

  return {
    score,
    scoreLabel,
    decision,
    strengths,
    warnings,
    dealKillers,
    refinanceViability,
    executionComplexity,
    summary,
  };
}

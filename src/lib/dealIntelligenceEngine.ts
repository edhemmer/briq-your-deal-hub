// BRIX Deal Intelligence Engine. Deterministic, strategy-aware, no AI judgment.

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

export interface DealIntelligenceOptions {
  strategy?: string | null;
}

function safeDivide(a: number, b: number): number {
  if (!b || !Number.isFinite(b)) return 0;
  const r = a / b;
  return Number.isFinite(r) ? r : 0;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function analyzeDealIntelligence(
  analysis: AnalysisResult,
  options: DealIntelligenceOptions = {},
): DealIntelligenceResult {
  const { metrics, refinance, rehab, acquisition } = analysis;
  const { dscr, cap_rate, monthly_cashflow, cash_on_cash, initial_cash_required } = metrics;
  const { equity_created, cash_out, refinance_amount } = refinance;
  const { loan_amount } = analysis.financing;
  const purchasePrice = acquisition.purchase_price;
  const rehabRatio = safeDivide(rehab.rehab_cost, purchasePrice);
  const strategy = normalizeStrategy(options.strategy);

  const isOwnerOccupant = strategy === "owner_occupant";
  const isIncomeStrategy = [
    "buy_and_hold",
    "long_term_rental",
    "mid_term_rental",
    "short_term_rental",
    "hybrid_rental",
    "house_hack",
    "seller_finance",
    "subject_to",
    "wrap_mortgage",
  ].includes(strategy);
  const isValueOrExitStrategy = [
    "brrrr",
    "hybrid_brrrr",
    "fix_flip",
    "value_add",
    "refinance",
    "adu",
    "lot_split",
    "mixed_use_conversion",
    "commercial_repositioning",
    "development",
  ].includes(strategy);
  const requiresRefinanceStrength = ["brrrr", "hybrid_brrrr", "refinance"].includes(strategy);

  let score = 100;

  if (isIncomeStrategy) {
    if (dscr < 1.0) score -= 25;
    else if (dscr < 1.2) score -= 12;

    if (cap_rate < 0.05) score -= 15;
    else if (cap_rate < 0.06) score -= 8;

    if (monthly_cashflow < 0) score -= 20;
    else if (monthly_cashflow < 150) score -= 8;

    if (cash_on_cash < 0.08) score -= 15;
    else if (cash_on_cash < 0.12) score -= 6;
  }

  if (isValueOrExitStrategy && equity_created <= 0) score -= 20;
  if (requiresRefinanceStrength && cash_out <= 0) score -= 10;
  if (initial_cash_required > 100000) score -= 6;
  if (rehabRatio >= 0.25) score -= 10;
  else if (rehabRatio >= 0.15) score -= 5;

  if (isIncomeStrategy && dscr >= 1.25) score += 5;
  if (isIncomeStrategy && cap_rate >= 0.08) score += 5;
  if (isIncomeStrategy && monthly_cashflow >= 300) score += 5;
  if (isIncomeStrategy && cash_on_cash >= 0.12) score += 5;
  if (isValueOrExitStrategy && equity_created > 0 && (!requiresRefinanceStrength || cash_out > 0)) score += 5;
  if (isOwnerOccupant && equity_created > 0) score += 5;

  score = clamp(score, 0, 100);

  let scoreLabel: string;
  if (score >= 85) scoreLabel = "Excellent";
  else if (score >= 70) scoreLabel = "Strong";
  else if (score >= 55) scoreLabel = "Borderline";
  else scoreLabel = "Weak";

  const dealKillers: string[] = [];
  if (isIncomeStrategy && dscr < 1) dealKillers.push("DSCR below 1.0 - debt service exceeds net operating income.");
  if (isIncomeStrategy && monthly_cashflow < 0) dealKillers.push("Negative monthly cash flow - the deal loses money each month.");
  if (isValueOrExitStrategy && equity_created <= 0) dealKillers.push("No equity created - ARV does not exceed total project cost.");
  if (requiresRefinanceStrength && refinance_amount <= loan_amount) dealKillers.push("Refinance does not cover existing loan balance.");

  const warnings: string[] = [];
  if (isIncomeStrategy && cap_rate < 0.06) warnings.push("Cap rate below 6% - thin return relative to total cost basis.");
  if (isIncomeStrategy && cash_on_cash < 0.08) warnings.push("Cash-on-cash below 8% - modest return on invested capital.");
  if (rehabRatio > 0.15) warnings.push("Rehab exceeds 15% of purchase price - higher execution risk.");
  if (initial_cash_required > 100000) warnings.push("Over $100K initial cash required - high capital commitment.");
  if (isIncomeStrategy && monthly_cashflow >= 0 && monthly_cashflow < 150) warnings.push("Cash flow under $150/mo - limited margin of safety.");
  if (requiresRefinanceStrength && cash_out <= 0 && equity_created > 0) warnings.push("Positive equity but no cash-out at refinance.");
  if (isOwnerOccupant && monthly_cashflow < 0) warnings.push("Owner-occupant cash flow is negative by design; verify full monthly housing cost against household budget.");

  const strengths: string[] = [];
  if (isIncomeStrategy && dscr >= 1.25) strengths.push("DSCR at or above 1.25x - strong debt coverage.");
  if (isIncomeStrategy && cap_rate >= 0.08) strengths.push("Cap rate at or above 8% - excellent yield on total cost basis.");
  if (isIncomeStrategy && monthly_cashflow >= 300) strengths.push("Cash flow at or above $300/mo - healthy margin.");
  if (isIncomeStrategy && cash_on_cash >= 0.12) strengths.push("Cash-on-cash at or above 12% - strong investor return.");
  if (isValueOrExitStrategy && equity_created > 0) strengths.push("Positive equity created through value-add strategy.");
  if (requiresRefinanceStrength && cash_out > 0) strengths.push("Cash-out refinance viable - capital recycling possible.");
  if (isOwnerOccupant && equity_created > 0) strengths.push("Positive equity support improves resale margin.");

  let decision: string;
  if (score < 35 || dealKillers.length >= 2) decision = "Pass";
  else if (dealKillers.length > 0) decision = "Do Not Chase";
  else if (score >= 85) decision = "Strong Buy";
  else if (score >= 70) decision = "Worth Pursuing";
  else if (score >= 55) decision = "Needs Negotiation";
  else decision = "High Risk";

  let refinanceViability: string;
  if (cash_out > 0 && equity_created > 0) refinanceViability = "Strong";
  else if (equity_created > 0 && cash_out <= 0) refinanceViability = "Moderate";
  else refinanceViability = "Weak";

  let executionComplexity: string;
  if (rehabRatio < 0.10) executionComplexity = "Low";
  else if (rehabRatio < 0.25) executionComplexity = "Moderate";
  else executionComplexity = "High";

  const primaryStrength = strengths.length > 0 ? strengths[0].split("-")[1]?.trim() ?? strengths[0] : "no notable strengths";
  const largestWarning = warnings.length > 0 ? warnings[0].split("-")[1]?.trim() ?? warnings[0] : "no major concerns";
  const summary = `${scoreLabel} ${strategyLabel(strategy)} read with ${primaryStrength}. Watch for ${largestWarning}.`;

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

function normalizeStrategy(strategy: string | null | undefined): string {
  const normalized = (strategy ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.includes("owneroccup") || normalized.includes("livein") || normalized.includes("primary")) return "owner_occupant";
  if (normalized.includes("hybridbrrrr")) return "hybrid_brrrr";
  if (normalized.includes("brrrr")) return "brrrr";
  if (normalized.includes("longterm")) return "long_term_rental";
  if (normalized.includes("midterm")) return "mid_term_rental";
  if (normalized.includes("shortterm")) return "short_term_rental";
  if (normalized.includes("hybrid")) return "hybrid_rental";
  if (normalized.includes("househack")) return "house_hack";
  if (normalized.includes("flip")) return "fix_flip";
  if (normalized.includes("valueadd")) return "value_add";
  if (normalized.includes("refinance")) return "refinance";
  if (normalized.includes("sellerfinance")) return "seller_finance";
  if (normalized.includes("subjectto")) return "subject_to";
  if (normalized.includes("wrap")) return "wrap_mortgage";
  if (normalized.includes("adu")) return "adu";
  if (normalized.includes("lotsplit")) return "lot_split";
  if (normalized.includes("mixeduse")) return "mixed_use_conversion";
  if (normalized.includes("commercial")) return "commercial_repositioning";
  if (normalized.includes("development")) return "development";
  if (normalized.includes("sell")) return "sell";
  if (normalized === "hold") return "hold";
  return "buy_and_hold";
}

function strategyLabel(strategy: string): string {
  switch (strategy) {
    case "owner_occupant": return "owner-occupant";
    case "brrrr": return "BRRRR";
    case "hybrid_brrrr": return "hybrid BRRRR";
    case "fix_flip": return "flip";
    case "refinance": return "refinance";
    case "short_term_rental": return "short-term rental";
    case "mid_term_rental": return "mid-term rental";
    case "long_term_rental": return "long-term rental";
    default: return "strategy";
  }
}

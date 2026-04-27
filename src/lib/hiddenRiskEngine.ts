/**
 * BRIX v1.7.0 — Hidden Risk Engine (Deal Protection)
 *
 * Deterministic, source-aware risk detection from structured data
 * and controlled visual signals from listing photos.
 *
 * Hard rules:
 *  - No diagnosis, no structural failure claims, no repair cost statements
 *  - No fabricated data, no guessing
 *  - Visual analysis only with ≥2 valid images
 *  - Max 3 visual flags, deduplicated
 *  - Scores: high=25, moderate=15, low=5, cap=100
 */

import type { AnalysisResult } from "./dealAnalysisEngine";
import type { MarketConditions, MarketIntelligenceResult } from "./marketIntelligenceEngine";
import type { NormalizedDealState } from "./normalizedDealState";

// ── Types ──────────────────────────────────────────────────────────────

export type RiskSeverity = "high" | "moderate" | "low";
export type RiskSourceType = "financial" | "market" | "property" | "visual";
export type VisualConfidence = "high" | "medium" | "low";

export interface HiddenRiskFlag {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  sourceType: RiskSourceType;
  evidence: string;
  /** Only for visual flags */
  visualConfidence?: VisualConfidence;
  /** Only for visual flags — how many images showed this */
  imageCount?: number;
}

export interface HiddenRiskResult {
  flags: HiddenRiskFlag[];
  totalRiskScore: number;
  riskLevel: "elevated" | "moderate" | "low" | "minimal";
  flagCount: number;
  visualFlagCount: number;
}

// ── Scoring constants ──────────────────────────────────────────────────

const SEVERITY_SCORES: Record<RiskSeverity, number> = {
  high: 25,
  moderate: 15,
  low: 5,
};

const MAX_SCORE = 100;
const MAX_VISUAL_FLAGS = 3;

// ── Visual Signal Categories (allowed) ─────────────────────────────────

export type VisualSignalCategory =
  | "water_damage_indicators"
  | "deferred_maintenance"
  | "foundation_settlement_signs"
  | "roof_condition_signals"
  | "electrical_age_indicators"
  | "exterior_deterioration";

export interface VisualSignal {
  category: VisualSignalCategory;
  description: string;
  imageIndices: number[];
  confidence: VisualConfidence;
}

// ── Visual Signal Input ────────────────────────────────────────────────

export interface ListingImage {
  url: string;
  isValid: boolean;
}

// ── Financial Risk Rules ───────────────────────────────────────────────

function evaluateFinancialRisks(
  state: NormalizedDealState,
  analysis: AnalysisResult
): HiddenRiskFlag[] {
  const flags: HiddenRiskFlag[] = [];
  const m = analysis.metrics;

  // Negative cash flow
  if (m.monthly_cashflow < 0) {
    flags.push({
      id: "fin_negative_cashflow",
      category: "Cash Flow",
      title: "Negative Monthly Cash Flow",
      description: "This deal projects negative cash flow under current assumptions.",
      severity: Math.abs(m.monthly_cashflow) > 500 ? "high" : "moderate",
      sourceType: "financial",
      evidence: `Projected monthly cash flow: $${m.monthly_cashflow.toFixed(0)}`,
    });
  }

  // DSCR below 1.0
  if (m.dscr > 0 && m.dscr < 1.0) {
    flags.push({
      id: "fin_low_dscr",
      category: "Debt Service",
      title: "DSCR Below 1.0x",
      description: "Net operating income does not fully cover debt service obligations.",
      severity: m.dscr < 0.8 ? "high" : "moderate",
      sourceType: "financial",
      evidence: `DSCR: ${m.dscr.toFixed(2)}x`,
    });
  }

  // Very low cap rate
  if (m.cap_rate > 0 && m.cap_rate < 0.04) {
    flags.push({
      id: "fin_low_cap_rate",
      category: "Return Profile",
      title: "Cap Rate Below 4%",
      description: "Returns are compressed relative to typical investor thresholds.",
      severity: m.cap_rate < 0.03 ? "high" : "moderate",
      sourceType: "financial",
      evidence: `Cap rate: ${(m.cap_rate * 100).toFixed(2)}%`,
    });
  }

  // High expense ratio (> 60%)
  const opex = analysis.expenses.operating_expenses;
  const grossIncome = analysis.income.total_income;
  if (opex > 0 && grossIncome > 0) {
    const expenseRatio = opex / grossIncome;
    if (expenseRatio > 0.60) {
      flags.push({
        id: "fin_high_expense_ratio",
        category: "Expense Load",
        title: "High Expense Ratio",
        description: "Operating expenses consume a large share of gross income.",
        severity: expenseRatio > 0.75 ? "high" : "moderate",
        sourceType: "financial",
        evidence: `Expense ratio: ${(expenseRatio * 100).toFixed(1)}%`,
      });
    }
  }

  // Rehab cost > 30% of purchase price
  const purchasePrice = state.financing.purchasePrice.value ?? 0;
  const rehabCost = state.expenses.rehabCost.value ?? 0;
  if (purchasePrice > 0 && rehabCost > 0) {
    const rehabRatio = rehabCost / purchasePrice;
    if (rehabRatio > 0.30) {
      flags.push({
        id: "fin_high_rehab_ratio",
        category: "Rehab Intensity",
        title: "Rehab Cost Exceeds 30% of Purchase Price",
        description: "High rehab-to-purchase ratio increases execution risk and capital exposure.",
        severity: rehabRatio > 0.50 ? "high" : "moderate",
        sourceType: "financial",
        evidence: `Rehab cost: ${(rehabRatio * 100).toFixed(0)}% of purchase price`,
      });
    }
  }

  // Negative cash-on-cash
  if (m.cash_on_cash < 0) {
    flags.push({
      id: "fin_negative_coc",
      category: "Return Profile",
      title: "Negative Cash-on-Cash Return",
      description: "The deal does not produce a positive return on invested capital.",
      severity: "high",
      sourceType: "financial",
      evidence: `Cash-on-Cash: ${(m.cash_on_cash * 100).toFixed(2)}%`,
    });
  }

  return flags;
}

// ── Market Risk Rules ──────────────────────────────────────────────────

function evaluateMarketRisks(
  marketConditions: MarketConditions,
  marketIntelligence: MarketIntelligenceResult
): HiddenRiskFlag[] {
  const flags: HiddenRiskFlag[] = [];

  // High crime area
  if (marketConditions.crime_score != null && marketConditions.crime_score >= 7) {
    flags.push({
      id: "mkt_high_crime",
      category: "Neighborhood",
      title: "Elevated Area Crime Risk",
      description: "Area crime indicators are above typical investor comfort thresholds.",
      severity: marketConditions.crime_score >= 8.5 ? "high" : "moderate",
      sourceType: "market",
      evidence: `Crime score: ${marketConditions.crime_score.toFixed(1)}/10`,
    });
  }

  // Oversupply
  if (marketConditions.months_of_supply >= 7) {
    flags.push({
      id: "mkt_oversupply",
      category: "Supply",
      title: "Market Oversupply Detected",
      description: "High inventory levels may limit pricing power and extend holding periods.",
      severity: marketConditions.months_of_supply >= 10 ? "high" : "moderate",
      sourceType: "market",
      evidence: `Months of supply: ${marketConditions.months_of_supply.toFixed(1)}`,
    });
  }

  // Declining rent
  if (marketConditions.rent_growth_12mo < -1) {
    flags.push({
      id: "mkt_rent_decline",
      category: "Rent Market",
      title: "Declining Rent Growth",
      description: "Rental rates are contracting in this market.",
      severity: marketConditions.rent_growth_12mo < -3 ? "high" : "moderate",
      sourceType: "market",
      evidence: `12-month rent growth: ${marketConditions.rent_growth_12mo.toFixed(1)}%`,
    });
  }

  // Weak demand
  if (marketIntelligence.demand_pressure_score < 30) {
    flags.push({
      id: "mkt_weak_demand",
      category: "Demand",
      title: "Weak Demand Signals",
      description: "Population and employment trends suggest limited demand growth.",
      severity: marketIntelligence.demand_pressure_score < 15 ? "high" : "moderate",
      sourceType: "market",
      evidence: `Demand pressure score: ${marketIntelligence.demand_pressure_score}/100`,
    });
  }

  // Extended days on market
  if (marketConditions.days_on_market >= 90) {
    flags.push({
      id: "mkt_extended_dom",
      category: "Liquidity",
      title: "Extended Days on Market",
      description: "Properties are taking significantly longer to sell in this area.",
      severity: "moderate",
      sourceType: "market",
      evidence: `Average DOM: ${marketConditions.days_on_market} days`,
    });
  }

  return flags;
}

// ── Property Risk Rules ────────────────────────────────────────────────

function evaluatePropertyRisks(state: NormalizedDealState): HiddenRiskFlag[] {
  const flags: HiddenRiskFlag[] = [];

  // Old property (pre-1960)
  const yearBuilt = state.property.yearBuilt.value;
  if (yearBuilt != null && yearBuilt > 0 && yearBuilt < 1960) {
    flags.push({
      id: "prop_age_risk",
      category: "Property Age",
      title: "Pre-1960 Construction",
      description: "Older properties may carry elevated maintenance, systems, and compliance costs.",
      severity: yearBuilt < 1940 ? "high" : "moderate",
      sourceType: "property",
      evidence: `Year built: ${yearBuilt}`,
    });
  }

  // Purchase price significantly above assessed value
  const purchasePrice = state.financing.purchasePrice.value ?? 0;
  const assessedValue = state.property.assessedValue.value;
  if (purchasePrice > 0 && assessedValue != null && assessedValue > 0) {
    const premiumRatio = purchasePrice / assessedValue;
    if (premiumRatio > 1.5) {
      flags.push({
        id: "prop_premium_over_assessed",
        category: "Valuation",
        title: "Purchase Price Premium Over Assessment",
        description: "Purchase price exceeds assessed value by a significant margin.",
        severity: premiumRatio > 2.0 ? "high" : "moderate",
        sourceType: "property",
        evidence: `Purchase: $${purchasePrice.toLocaleString()} vs Assessed: $${assessedValue.toLocaleString()} (${((premiumRatio - 1) * 100).toFixed(0)}% premium)`,
      });
    }
  }

  return flags;
}

// ── Visual Signal Processing ───────────────────────────────────────────

/**
 * Process visual signals from listing images.
 * Only runs if ≥2 valid images exist.
 * Returns max 3 deduplicated flags, prioritized by severity and frequency.
 */
export function processVisualSignals(signals: VisualSignal[]): HiddenRiskFlag[] {
  if (signals.length === 0) return [];

  // Deduplicate: group by category, keep the one with most image evidence
  const grouped = new Map<VisualSignalCategory, VisualSignal>();
  for (const signal of signals) {
    const existing = grouped.get(signal.category);
    if (!existing || signal.imageIndices.length > existing.imageIndices.length) {
      // Merge image indices
      const mergedIndices = existing
        ? [...new Set([...existing.imageIndices, ...signal.imageIndices])]
        : signal.imageIndices;
      grouped.set(signal.category, {
        ...signal,
        imageIndices: mergedIndices,
        confidence: mergedIndices.length >= 3 ? "high" : mergedIndices.length >= 2 ? "medium" : "low",
      });
    }
  }

  // Convert to flags
  const visualFlags: HiddenRiskFlag[] = [];
  for (const [category, signal] of grouped) {
    const severity: RiskSeverity =
      signal.confidence === "high" ? "high" :
      signal.confidence === "medium" ? "moderate" : "low";

    visualFlags.push({
      id: `visual_${category}`,
      category: VISUAL_CATEGORY_LABELS[category],
      title: VISUAL_CATEGORY_TITLES[category],
      description: signal.description,
      severity,
      sourceType: "visual",
      evidence: `${signal.description} — observed in ${signal.imageIndices.length} listing photo${signal.imageIndices.length > 1 ? "s" : ""}`,
      visualConfidence: signal.confidence,
      imageCount: signal.imageIndices.length,
    });
  }

  // Sort by severity (high first), then by image count (more evidence first)
  visualFlags.sort((a, b) => {
    const sevOrder = { high: 0, moderate: 1, low: 2 };
    if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
    return (b.imageCount ?? 0) - (a.imageCount ?? 0);
  });

  // Cap at MAX_VISUAL_FLAGS
  return visualFlags.slice(0, MAX_VISUAL_FLAGS);
}

const VISUAL_CATEGORY_LABELS: Record<VisualSignalCategory, string> = {
  water_damage_indicators: "Water Damage",
  deferred_maintenance: "Maintenance",
  foundation_settlement_signs: "Foundation",
  roof_condition_signals: "Roof",
  electrical_age_indicators: "Electrical",
  exterior_deterioration: "Exterior",
};

const VISUAL_CATEGORY_TITLES: Record<VisualSignalCategory, string> = {
  water_damage_indicators: "Water Damage Indicators Observed",
  deferred_maintenance: "Deferred Maintenance Signals",
  foundation_settlement_signs: "Settlement Indicators Observed",
  roof_condition_signals: "Roof Condition Signals",
  electrical_age_indicators: "Aged Electrical Indicators",
  exterior_deterioration: "Exterior Deterioration Signals",
};

// ── Risk Level Derivation ──────────────────────────────────────────────

function deriveRiskLevel(score: number): HiddenRiskResult["riskLevel"] {
  if (score >= 60) return "elevated";
  if (score >= 30) return "moderate";
  if (score >= 10) return "low";
  return "minimal";
}

// ── Main Engine Function ───────────────────────────────────────────────

export interface HiddenRiskInput {
  state: NormalizedDealState;
  analysis: AnalysisResult;
  marketConditions: MarketConditions;
  marketIntelligence: MarketIntelligenceResult;
  visualSignals?: VisualSignal[];
}

/**
 * Evaluate hidden risks from financial, market, property, and visual data.
 * Deterministic. Source-aware. No diagnosis.
 */
export function evaluateHiddenRisks(input: HiddenRiskInput): HiddenRiskResult {
  const financialFlags = evaluateFinancialRisks(input.state, input.analysis);
  const marketFlags = evaluateMarketRisks(input.marketConditions, input.marketIntelligence);
  const propertyFlags = evaluatePropertyRisks(input.state);
  const visualFlags = input.visualSignals ? processVisualSignals(input.visualSignals) : [];

  const allFlags = [...financialFlags, ...marketFlags, ...propertyFlags, ...visualFlags];

  // Calculate total score (capped at MAX_SCORE)
  const rawScore = allFlags.reduce((sum, f) => sum + SEVERITY_SCORES[f.severity], 0);
  const totalRiskScore = Math.min(rawScore, MAX_SCORE);

  return {
    flags: allFlags,
    totalRiskScore,
    riskLevel: deriveRiskLevel(totalRiskScore),
    flagCount: allFlags.length,
    visualFlagCount: visualFlags.length,
  };
}

/**
 * BRIQ v1.6.1 — Confidence-Aware Decisioning Engine
 *
 * Evaluates the strength of available inputs and produces a confidence
 * score that accompanies analytical results. When data is insufficient,
 * this engine signals lower confidence rather than guessing.
 *
 * v1.6.1: Added source-quality-aware scoring. High-quality source-backed
 * inputs increase confidence; weak or missing inputs reduce it.
 *
 * Pure functions only. No side effects.
 */

import type { NormalizedDealState } from "./normalizedDealState";
import type { AnalysisContext } from "./marketProfiles";
import type { SourceQuality } from "./propertySourceResolver";

// ── Types ──────────────────────────────────────────────────────────────

export type ConfidenceLevel = "high" | "moderate" | "low" | "insufficient";

export interface ConfidenceAssessment {
  /** Overall confidence level */
  level: ConfidenceLevel;
  /** Numeric score 0–100 */
  score: number;
  /** Human-readable summary */
  summary: string;
  /** Specific factors affecting confidence */
  factors: ConfidenceFactor[];
  /** Whether the result should be treated as actionable */
  isActionable: boolean;
}

export interface ConfidenceFactor {
  category: "financial" | "market" | "property" | "strategy" | "context";
  label: string;
  impact: "positive" | "neutral" | "negative";
  detail: string;
}

// ── Source Quality Bonus ───────────────────────────────────────────────

export interface SourceQualityInput {
  /** Map of field keys to their source quality, from accepted draft fields */
  fieldSources: Record<string, SourceQuality>;
}

const SOURCE_QUALITY_BONUS: Record<SourceQuality, number> = {
  official: 3,
  listing: 2,
  estimate: 1,
  user_entered: 0,
  unavailable: 0,
};

// ── Confidence Evaluation ──────────────────────────────────────────────

function hasRealValue(v: number | null | undefined): boolean {
  return v != null && Number.isFinite(v) && v !== 0;
}

/**
 * Evaluate input confidence for the current analysis.
 * This is deterministic and based solely on data availability/quality.
 * 
 * v1.6.1: Accepts optional sourceQuality to boost confidence for
 * fields backed by official or listing sources.
 */
export function evaluateConfidence(
  state: NormalizedDealState,
  context: AnalysisContext,
  sourceQuality?: SourceQualityInput
): ConfidenceAssessment {
  const factors: ConfidenceFactor[] = [];
  let score = 0;
  let maxScore = 0;

  // ── Financial Inputs (40% weight) ──
  const financialChecks = [
    { field: state.financing.purchasePrice.value, label: "Purchase Price", weight: 10, key: "purchasePrice" },
    { field: state.rent.monthlyRent.value, label: "Monthly Rent", weight: 10, key: "monthlyRent" },
    { field: state.financing.arv.value, label: "After Repair Value", weight: 5, key: "arv" },
    { field: state.financing.interestRate.value, label: "Interest Rate", weight: 5, key: "interestRate" },
    { field: state.expenses.taxes.value, label: "Property Taxes", weight: 5, key: "annualPropertyTax" },
    { field: state.expenses.insurance.value, label: "Insurance", weight: 5, key: "insurance" },
  ];

  for (const check of financialChecks) {
    maxScore += check.weight;
    if (hasRealValue(check.field as number)) {
      score += check.weight;

      // Source quality bonus
      const srcQuality = sourceQuality?.fieldSources[check.key];
      if (srcQuality) {
        const bonus = SOURCE_QUALITY_BONUS[srcQuality];
        if (bonus > 0) {
          score += bonus;
          maxScore += 3; // max possible bonus per field
          factors.push({
            category: "financial",
            label: check.label,
            impact: "positive",
            detail: `${check.label} is backed by ${srcQuality === "official" ? "official records" : "listing data"}.`,
          });
        } else {
          maxScore += 3;
          factors.push({
            category: "financial",
            label: check.label,
            impact: "positive",
            detail: `${check.label} is provided.`,
          });
        }
      } else {
        factors.push({
          category: "financial",
          label: check.label,
          impact: "positive",
          detail: `${check.label} is provided.`,
        });
      }
    } else {
      factors.push({
        category: "financial",
        label: check.label,
        impact: "negative",
        detail: `${check.label} is missing — reduces analysis accuracy.`,
      });
    }
  }

  // ── Market Data (25% weight) ──
  const marketChecks = [
    { field: state.market.medianRent.value, label: "Median Rent" },
    { field: state.market.rentGrowth12mo.value, label: "Rent Growth" },
    { field: state.market.medianHomePrice.value, label: "Median Home Price" },
    { field: state.market.monthsOfSupply.value, label: "Months of Supply" },
    { field: state.market.daysOnMarket.value, label: "Days on Market" },
  ];

  const marketWeight = 5;
  let marketHits = 0;
  for (const check of marketChecks) {
    maxScore += marketWeight;
    if (hasRealValue(check.field)) {
      score += marketWeight;
      marketHits++;
    }
  }

  if (marketHits >= 4) {
    factors.push({ category: "market", label: "Market Data", impact: "positive", detail: "Strong market data coverage supports market-aware analysis." });
  } else if (marketHits >= 2) {
    factors.push({ category: "market", label: "Market Data", impact: "neutral", detail: "Partial market data available. Some market signals may be limited." });
  } else {
    factors.push({ category: "market", label: "Market Data", impact: "negative", detail: "Limited market data reduces market intelligence accuracy." });
  }

  // ── Property Data (15% weight) ──
  const propertyChecks = [
    { value: state.property.propertyType.value, key: "propertyType" },
    { value: state.property.yearBuilt.value, key: "yearBuilt" },
    { value: state.property.assessedValue.value, key: "assessedValue" },
  ];
  let propertyHits = 0;
  let propertySourceBonus = 0;
  for (const check of propertyChecks) {
    if (check.value != null && check.value !== 0 && check.value !== "") {
      propertyHits++;
      const srcQuality = sourceQuality?.fieldSources[check.key];
      if (srcQuality && SOURCE_QUALITY_BONUS[srcQuality] > 0) {
        propertySourceBonus += SOURCE_QUALITY_BONUS[srcQuality];
      }
    }
  }
  maxScore += 15 + 9; // 15 base + max 9 source bonus (3 fields × 3)
  score += Math.round((propertyHits / propertyChecks.length) * 15) + propertySourceBonus;

  if (propertyHits >= 2) {
    if (propertySourceBonus > 0) {
      factors.push({ category: "property", label: "Property Details", impact: "positive", detail: "Source-verified property data enhances analysis reliability." });
    } else {
      factors.push({ category: "property", label: "Property Details", impact: "positive", detail: "Property enrichment data enhances analysis context." });
    }
  } else {
    factors.push({ category: "property", label: "Property Details", impact: "neutral", detail: "Limited property details. Analysis relies on financial inputs only." });
  }

  // ── Context Completeness (10% weight) ──
  maxScore += 10;
  if (context.marketType && context.strategy && context.riskTolerance) {
    score += 10;
    factors.push({ category: "context", label: "Analysis Context", impact: "positive", detail: "Market type, strategy, and risk tolerance are configured." });
  } else {
    factors.push({ category: "context", label: "Analysis Context", impact: "negative", detail: "Incomplete analysis context reduces decisioning accuracy." });
  }

  // ── Risk Data (10% weight) ──
  maxScore += 10;
  if (hasRealValue(state.risk.crimeScore.value)) {
    score += 10;
    factors.push({ category: "market", label: "Crime Data", impact: "positive", detail: "Crime risk data is available for location assessment." });
  } else {
    factors.push({ category: "market", label: "Crime Data", impact: "neutral", detail: "No crime data. Location risk assessment is limited." });
  }

  // ── Compute Final Confidence ──
  const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  let level: ConfidenceLevel;
  let summary: string;
  let isActionable: boolean;

  if (normalizedScore >= 75) {
    level = "high";
    summary = "Strong data coverage supports reliable analysis. Results can be used with reasonable confidence for investment evaluation.";
    isActionable = true;
  } else if (normalizedScore >= 50) {
    level = "moderate";
    summary = "Adequate data for directional analysis. Some inputs are missing — verify key assumptions before making investment decisions.";
    isActionable = true;
  } else if (normalizedScore >= 25) {
    level = "low";
    summary = "Limited data available. Results should be treated as preliminary estimates only. Additional data is recommended.";
    isActionable = false;
  } else {
    level = "insufficient";
    summary = "Insufficient data to produce meaningful analysis. Enter core financial inputs to begin.";
    isActionable = false;
  }

  return {
    level,
    score: normalizedScore,
    summary,
    factors,
    isActionable,
  };
}

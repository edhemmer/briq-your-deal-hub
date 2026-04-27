/**
 * BRIX v1.7.2 — Deal Guidance Engine (Investor Trust Layer)
 *
 * Synthesizes all prior analysis layers into a final, investor-safe
 * confidence + guidance output. Deterministic. No AI. No guessing.
 *
 * Runs AFTER: financial, market, hidden risk, and confidence engines.
 * Reads upstream outputs — never mutates them.
 */

import type { AnalysisResult } from "./dealAnalysisEngine";
import type { DealIntelligenceResult } from "./dealIntelligenceEngine";
import type { ConfidenceAssessment } from "./confidenceEngine";
import type { HiddenRiskResult } from "./hiddenRiskEngine";
import type { MarketOutlook } from "./marketOutlookEngine";
import type { NormalizedDealState } from "./normalizedDealState";

// ── Types ──────────────────────────────────────────────────────────────

export type GuidanceLevel = "proceed" | "proceed_with_caution" | "high_risk";
export type OverallConfidenceLevel = "high" | "medium" | "low";

export interface DealGuidanceResult {
  /** Overall confidence score 0–100 */
  overallConfidenceScore: number;
  /** Overall confidence level */
  overallConfidenceLevel: OverallConfidenceLevel;
  /** Data completeness score 0–100 */
  dataCompletenessScore: number;
  /** Signal confidence average 0–100 */
  signalConfidenceAvg: number;
  /** Risk confidence contribution 0–100 */
  riskConfidence: number;
  /** Final guidance */
  guidance: GuidanceLevel;
  /** 2–4 reasoning bullets */
  reasoning: string[];
  /** Standard uncertainties */
  uncertainties: string[];
  /** Critical uncertainties */
  criticalUncertainties: string[];
}

// ── Data Completeness ──────────────────────────────────────────────────

interface CompletenessInput {
  purchasePrice: number | null;
  rentUserInput: number | null;
  rentValidatedVsMarket: boolean;
  taxes: number | null;
  insurance: number | null;
  financingInputs: boolean; // down_payment, interest_rate, loan_term all present
  propertyConditionKnown: boolean; // photos or confirmed
  marketOutlookSignals: number; // signals_used_count from market outlook
}

const COMPLETENESS_WEIGHTS: { key: keyof CompletenessInput; weight: number }[] = [
  { key: "purchasePrice", weight: 10 },
  { key: "rentUserInput", weight: 15 },
  { key: "rentValidatedVsMarket", weight: 15 },
  { key: "taxes", weight: 15 },
  { key: "insurance", weight: 15 },
  { key: "financingInputs", weight: 10 },
  { key: "propertyConditionKnown", weight: 10 },
  { key: "marketOutlookSignals", weight: 10 },
];

function computeDataCompleteness(input: CompletenessInput): number {
  let score = 0;
  const totalWeight = COMPLETENESS_WEIGHTS.reduce((s, w) => s + w.weight, 0);

  for (const { key, weight } of COMPLETENESS_WEIGHTS) {
    const val = input[key];
    if (typeof val === "boolean") {
      score += val ? weight : 0;
    } else if (typeof val === "number") {
      if (key === "marketOutlookSignals") {
        // Partial credit: 0 signals = 0, 1-2 = 50%, 3+ = 100%
        if (val >= 3) score += weight;
        else if (val >= 1) score += weight * 0.5;
      } else {
        // Numeric field: present and non-zero = full, otherwise 0
        score += (val != null && Number.isFinite(val) && val !== 0) ? weight : 0;
      }
    }
  }

  return Math.round((score / totalWeight) * 100);
}

// ── Signal Confidence Normalization ────────────────────────────────────

function normalizeConfidence(level: string | undefined | null): number {
  switch (level) {
    case "high": return 90;
    case "medium":
    case "moderate": return 65;
    case "low": return 40;
    default: return 40;
  }
}

// ── Core Engine ────────────────────────────────────────────────────────

export interface DealGuidanceInput {
  state: NormalizedDealState;
  analysis: AnalysisResult;
  intelligence: DealIntelligenceResult;
  confidence: ConfidenceAssessment;
  hiddenRisks: HiddenRiskResult;
  marketOutlook: MarketOutlook | null;
}

function hasRealValue(v: number | null | undefined): boolean {
  return v != null && Number.isFinite(v) && v !== 0;
}

export function evaluateDealGuidance(input: DealGuidanceInput): DealGuidanceResult {
  const { state, analysis, intelligence, confidence, hiddenRisks, marketOutlook } = input;

  // ── 1. Data Completeness ──
  const medianRent = state.market.medianRent.value ?? 0;
  const monthlyRent = state.rent.monthlyRent.value ?? 0;
  const rentValidated = medianRent > 0 && monthlyRent > 0 && Math.abs(monthlyRent - medianRent) / medianRent < 0.3;

  const hasFinancing =
    hasRealValue(state.financing.downPaymentPercent.value) &&
    hasRealValue(state.financing.interestRate.value) &&
    hasRealValue(state.financing.loanTermYears.value);

  // Property condition: photos or year_built as proxy
  const propertyConditionKnown =
    (state.property.yearBuilt.value != null && state.property.yearBuilt.value !== 0);

  const completenessInput: CompletenessInput = {
    purchasePrice: state.financing.purchasePrice.value,
    rentUserInput: state.rent.monthlyRent.value,
    rentValidatedVsMarket: rentValidated,
    taxes: state.expenses.taxes.value,
    insurance: state.expenses.insurance.value,
    financingInputs: hasFinancing,
    propertyConditionKnown,
    marketOutlookSignals: marketOutlook?.signals_used_count ?? 0,
  };

  const dataCompletenessScore = computeDataCompleteness(completenessInput);

  // ── 2. Signal Confidence Normalization ──
  const outlookConfidence = normalizeConfidence(marketOutlook?.data_confidence);
  const riskConfidenceLevel = hiddenRisks.riskLevel;
  const riskConfidenceNorm = normalizeConfidence(
    riskConfidenceLevel === "minimal" ? "high" :
    riskConfidenceLevel === "low" ? "high" :
    riskConfidenceLevel === "moderate" ? "medium" : "low"
  );

  // Average upstream signal confidences
  const signalValues = [outlookConfidence, riskConfidenceNorm];
  const signalConfidenceAvg = Math.round(signalValues.reduce((a, b) => a + b, 0) / signalValues.length);

  // ── 3. Risk Profile Normalization ──
  const riskConfidence = Math.max(0, Math.min(100, 100 - hiddenRisks.totalRiskScore));

  // ── 4. Overall Confidence Score ──
  const overallConfidenceScore = Math.round(
    Math.max(0, Math.min(100,
      (dataCompletenessScore * 0.4) +
      (signalConfidenceAvg * 0.3) +
      (riskConfidence * 0.3)
    ))
  );

  let overallConfidenceLevel: OverallConfidenceLevel;
  if (overallConfidenceScore >= 70) overallConfidenceLevel = "high";
  else if (overallConfidenceScore >= 40) overallConfidenceLevel = "medium";
  else overallConfidenceLevel = "low";

  // ── 5. Deal Guidance (Priority-Based Rules) ──
  let guidance: GuidanceLevel;

  // Rule 1: Hard stop on high risk
  if (hiddenRisks.riskLevel === "elevated") {
    guidance = "high_risk";
  }
  // Rule 2: Low overall confidence
  else if (overallConfidenceScore < 40) {
    guidance = "high_risk";
  }
  // Rule 3: Moderate risk or medium confidence
  else if (hiddenRisks.riskLevel === "moderate" || overallConfidenceLevel === "medium") {
    guidance = "proceed_with_caution";
  }
  // Rule 4: High confidence + low risk
  else {
    guidance = "proceed";
  }

  // ── 6. Reasoning (2–4 bullets) ──
  const reasoning: string[] = [];

  if (intelligence.dealKillers.length > 0) {
    reasoning.push(`${intelligence.dealKillers.length} deal killer(s) detected in financial analysis`);
  }
  if (dataCompletenessScore < 50) {
    reasoning.push(`Data completeness is ${dataCompletenessScore}% — key inputs are missing`);
  } else if (dataCompletenessScore >= 80) {
    reasoning.push(`Strong data coverage at ${dataCompletenessScore}%`);
  }
  if (hiddenRisks.totalRiskScore > 30) {
    reasoning.push(`Elevated hidden risk score of ${hiddenRisks.totalRiskScore}/100`);
  } else if (hiddenRisks.totalRiskScore <= 10) {
    reasoning.push("Low hidden risk exposure detected");
  }
  if (overallConfidenceScore >= 70) {
    reasoning.push("High overall confidence supports decision-making");
  } else if (overallConfidenceScore < 40) {
    reasoning.push("Low confidence — additional data needed before proceeding");
  }

  // Cap at 4
  while (reasoning.length > 4) reasoning.pop();
  // Ensure at least 2
  if (reasoning.length < 2) {
    reasoning.push(`Deal score: ${intelligence.score}/100 (${intelligence.scoreLabel})`);
  }
  if (reasoning.length < 2) {
    reasoning.push(`Overall confidence: ${overallConfidenceScore}/100`);
  }

  // ── 7. Uncertainties ──
  const uncertainties: string[] = [];
  const criticalUncertainties: string[] = [];

  // Critical uncertainties
  if (!rentValidated && hasRealValue(state.rent.monthlyRent.value)) {
    criticalUncertainties.push("Rent not validated against market data — deal performance may materially change");
  }
  if (!hasRealValue(state.expenses.insurance.value) && hasRealValue(state.risk.crimeScore.value) && (state.risk.crimeScore.value ?? 0) >= 6) {
    criticalUncertainties.push("Insurance exposure unknown in high-risk region");
  }
  if (!propertyConditionKnown) {
    criticalUncertainties.push("Property condition unknown — inspection risk is unquantified");
  }
  if (dataCompletenessScore < 50) {
    criticalUncertainties.push("Data completeness below 50% — results are preliminary");
  }

  // Standard uncertainties
  if (!hasRealValue(state.expenses.taxes.value)) {
    uncertainties.push("Property tax data not provided");
  }
  if (!hasRealValue(state.expenses.insurance.value)) {
    uncertainties.push("Insurance cost not provided");
  }
  if (!marketOutlook || marketOutlook.signals_used_count < 2) {
    uncertainties.push("Limited market outlook data available");
  }
  if (!hasRealValue(state.market.medianRent.value)) {
    uncertainties.push("No market rent comparison data");
  }
  if (!hasRealValue(state.financing.arv.value)) {
    uncertainties.push("After Repair Value not provided — refinance analysis limited");
  }

  return {
    overallConfidenceScore,
    overallConfidenceLevel,
    dataCompletenessScore,
    signalConfidenceAvg,
    riskConfidence,
    guidance,
    reasoning,
    uncertainties,
    criticalUncertainties,
  };
}

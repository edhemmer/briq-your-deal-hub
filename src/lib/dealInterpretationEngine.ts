/**
 * BRIQ v1.7.3.1 — Investor Interpretation Layer
 * 
 * Translates technical stress test and deal reliability outputs
 * into plain-English insights and action guidance.
 * 
 * Rules:
 *  - No new calculations — derived entirely from upstream signals
 *  - No jargon (no DSCR, IRR, CoC in user-facing text)
 *  - No investment advice or buy/sell recommendations
 *  - Max 2-sentence summary, 3 takeaways, 3 actions
 */

import type { StressTestResults, ResilienceLevel, ScenarioResult } from "./stressTestingEngine";
import type { DealIntelligenceResult } from "./dealIntelligenceEngine";
import type { HiddenRiskResult } from "./hiddenRiskEngine";
import type { ConfidenceAssessment } from "./confidenceEngine";

// ── Types ──────────────────────────────────────────────────────────────

export interface DealInterpretation {
  summary: string;
  keyTakeaways: string[];
  recommendedActions: string[];
}

// ── Summary Logic ──────────────────────────────────────────────────────

function generateSummary(
  resilience: ResilienceLevel,
  breakScenarios: number,
  totalScenarios: number,
  hasHighRisk: boolean
): string {
  if (resilience === "Fragile" || breakScenarios > totalScenarios * 0.5 || hasHighRisk) {
    return "This deal breaks under downside scenarios and carries elevated risk based on current inputs. Review assumptions carefully before proceeding.";
  }
  if (resilience === "Moderate" || breakScenarios > 0) {
    return "This deal shows sensitivity to key assumptions and may underperform if conditions change. Some scenarios produce weaker results.";
  }
  return "This deal appears stable under current assumptions and performs well under stress scenarios.";
}

// ── Takeaway Logic ─────────────────────────────────────────────────────

function generateTakeaways(
  stressResults: StressTestResults,
  intelligence: DealIntelligenceResult | null,
  hiddenRisks: HiddenRiskResult | null,
  confidence: ConfidenceAssessment | null
): string[] {
  const takeaways: string[] = [];

  // Priority 1: Break scenarios
  const breakScenarios = stressResults.scenarios.filter(s => s.stressed.monthly_cashflow < 0);
  if (breakScenarios.length > 0) {
    const worst = findWorstBreak(breakScenarios);
    if (worst) {
      takeaways.push(`${worst.scenario.label} causes this deal to turn negative`);
    }
  }

  // Priority 2: Deal killers from intelligence
  if (intelligence && intelligence.dealKillers.length > 0) {
    takeaways.push("Critical financial issues detected that may prevent viability");
  }

  // Priority 3: Fragility
  if (stressResults.resilience === "Fragile" && takeaways.length < 3) {
    takeaways.push("Performance is fragile across multiple downside conditions");
  }

  // Priority 4: Hidden risks
  if (hiddenRisks && hiddenRisks.riskLevel === "elevated" && takeaways.length < 3) {
    takeaways.push("Hidden risk signals detected that warrant further investigation");
  }

  // Priority 5: Data confidence
  if (confidence && confidence.level === "low" && takeaways.length < 3) {
    takeaways.push("Key inputs rely on incomplete or unvalidated data");
  }

  // Priority 6: Positive signal if nothing else
  if (takeaways.length === 0 && stressResults.resilience === "Strong") {
    takeaways.push("Deal maintains positive performance across all tested scenarios");
  }

  return takeaways.slice(0, 3);
}

function findWorstBreak(scenarios: ScenarioResult[]): ScenarioResult | null {
  if (scenarios.length === 0) return null;
  return scenarios.reduce((worst, s) =>
    s.stressed.monthly_cashflow < worst.stressed.monthly_cashflow ? s : worst
  );
}

// ── Action Logic ───────────────────────────────────────────────────────

function generateActions(
  stressResults: StressTestResults,
  intelligence: DealIntelligenceResult | null,
  hiddenRisks: HiddenRiskResult | null,
  confidence: ConfidenceAssessment | null
): string[] {
  const actions: string[] = [];

  const breakScenarios = stressResults.scenarios.filter(s => s.stressed.monthly_cashflow < 0);

  // Break scenarios → stress financing or lower price
  if (breakScenarios.length > 0 && actions.length < 3) {
    const hasRentBreak = breakScenarios.some(s => s.scenario.category === "rent");
    const hasRateBreak = breakScenarios.some(s => s.scenario.category === "interest");
    if (hasRentBreak) {
      actions.push("Verify rent using local comparable properties");
    }
    if (hasRateBreak && actions.length < 3) {
      actions.push("Stress test financing or negotiate a lower purchase price");
    }
  }

  // High fragility → add buffer
  if (stressResults.resilience === "Fragile" && actions.length < 3) {
    actions.push("Re-run analysis with more conservative assumptions");
  }

  // Hidden risks with visual flags
  if (hiddenRisks && actions.length < 3) {
    const hasVisual = hiddenRisks.flags.some(f => f.sourceType === "visual");
    if (hasVisual) {
      actions.push("Inspect property condition before final underwriting");
    }
  }

  // Low confidence → validate inputs
  if (confidence && confidence.level === "low" && actions.length < 3) {
    actions.push("Validate missing inputs before proceeding");
  }

  // Intelligence warnings
  if (intelligence && intelligence.warnings.length > 0 && actions.length < 3) {
    actions.push("Review flagged financial metrics and adjust where possible");
  }

  // Fallback for strong deals
  if (actions.length === 0) {
    actions.push("Continue due diligence and confirm assumptions with local data");
  }

  return actions.slice(0, 3);
}

// ── Public API ─────────────────────────────────────────────────────────

export function generateDealInterpretation(input: {
  stressResults: StressTestResults;
  intelligence: DealIntelligenceResult | null;
  hiddenRisks: HiddenRiskResult | null;
  confidence: ConfidenceAssessment | null;
}): DealInterpretation {
  const { stressResults, intelligence, hiddenRisks, confidence } = input;

  const breakScenarios = stressResults.scenarios.filter(s => s.stressed.monthly_cashflow < 0);
  const hasHighRisk = hiddenRisks?.riskLevel === "elevated";

  const summary = generateSummary(
    stressResults.resilience,
    breakScenarios.length,
    stressResults.scenarios.length,
    hasHighRisk
  );

  const keyTakeaways = generateTakeaways(stressResults, intelligence, hiddenRisks, confidence);
  const recommendedActions = generateActions(stressResults, intelligence, hiddenRisks, confidence);

  return { summary, keyTakeaways, recommendedActions };
}

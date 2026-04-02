/**
 * BRIQ v1.6.0 — Canonical Engine Layer
 * 
 * Single orchestration point: normalizedDealState → all analytical engines → outputs.
 * Pure functions only. No side effects. No component-level math.
 * 
 * v1.6.0: Added profile-driven decisioning, unseen-risk buffers,
 *         and confidence-aware output support.
 * 
 * Architecture:
 *   dataSourceLayer → normalizedDealState → canonicalEngineLayer → UI
 */

import type { NormalizedDealState } from "./normalizedDealState";
import type { DealInput, AnalysisResult } from "./dealAnalysisEngine";
import type { DealIntelligenceResult } from "./dealIntelligenceEngine";
import type { StrategyFitInput, StrategyFitResults } from "./strategyFitEngine";
import type { MarketConditions, MarketIntelligenceResult } from "./marketIntelligenceEngine";
import type { StressTestResults } from "./stressTestingEngine";
import type { AnalysisContext, MarketProfileThresholds } from "./marketProfiles";
import type { ConfidenceAssessment, SourceQualityInput } from "./confidenceEngine";
import type { FinancingResult } from "./financingEngine";
import type { MarketOutlook } from "./marketOutlookEngine";

import { analyzeDeal } from "./dealAnalysisEngine";
import { analyzeDealIntelligence } from "./dealIntelligenceEngine";
import { evaluateDealStrategies } from "./strategyFitEngine";
import { evaluateMarketIntelligence } from "./marketIntelligenceEngine";
import { runStressTests } from "./stressTestingEngine";
import { getMarketThresholds, applyUnseenRiskBuffers, isContextComplete } from "./marketProfiles";
import { evaluateConfidence } from "./confidenceEngine";
import { evaluateFinancingOptions } from "./financingEngine";
import { evaluateMarketOutlook } from "./marketOutlookEngine";

// ── Derive DealInput from NormalizedDealState ──────────────────────────

export function deriveDealInput(state: NormalizedDealState): DealInput {
  return {
    purchase_price: state.financing.purchasePrice.value ?? 0,
    closing_costs: state.financing.closingCosts.value ?? 0,
    rehab_cost: state.expenses.rehabCost.value ?? 0,
    rehab_contingency: state.expenses.rehabContingency.value ?? 0,
    down_payment_percent: state.financing.downPaymentPercent.value ?? 0,
    interest_rate: state.financing.interestRate.value ?? 0,
    loan_term_years: state.financing.loanTermYears.value ?? 0,
    monthly_rent: state.rent.monthlyRent.value ?? 0,
    other_income: state.rent.otherIncome.value ?? 0,
    taxes: state.expenses.taxes.value ?? 0,
    insurance: state.expenses.insurance.value ?? 0,
    maintenance_percent: state.expenses.maintenancePercent.value ?? 0,
    vacancy_percent: state.expenses.vacancyPercent.value ?? 0,
    management_percent: state.expenses.managementPercent.value ?? 0,
    capex_percent: state.expenses.capexPercent.value ?? 0,
    arv: state.financing.arv.value ?? 0,
  };
}

/**
 * Apply unseen-risk buffers to a DealInput based on market profile thresholds.
 * Returns a new DealInput — never mutates original.
 */
export function applyBuffersToDealInput(
  input: DealInput,
  thresholds: MarketProfileThresholds
): DealInput {
  const buffers = applyUnseenRiskBuffers(
    input.interest_rate,
    input.vacancy_percent,
    thresholds
  );
  return {
    ...input,
    interest_rate: buffers.adjustedInterestRate,
    vacancy_percent: buffers.adjustedVacancyPercent,
    taxes: input.taxes * buffers.adjustedExpenseMultiplier,
    insurance: input.insurance * buffers.adjustedExpenseMultiplier,
  };
}

// ── Derive MarketConditions from NormalizedDealState ────────────────────

export function deriveMarketConditions(state: NormalizedDealState): MarketConditions {
  return {
    median_rent: state.market.medianRent.value ?? 0,
    rent_growth_12mo: state.market.rentGrowth12mo.value ?? 0,
    rent_growth_36mo: state.market.rentGrowth36mo.value ?? 0,
    median_home_price: state.market.medianHomePrice.value ?? 0,
    price_growth_12mo: state.market.priceGrowth12mo.value ?? 0,
    price_growth_36mo: state.market.priceGrowth36mo.value ?? 0,
    price_per_sqft: state.market.pricePerSqft.value ?? 0,
    inventory_level: state.market.inventoryLevel.value ?? 0,
    months_of_supply: state.market.monthsOfSupply.value ?? 0,
    days_on_market: state.market.daysOnMarket.value ?? 0,
    sale_to_list_ratio: state.market.saleToListRatio.value ?? 0,
    absorption_rate: state.market.absorptionRate.value ?? 0,
    population_growth_rate: state.market.populationGrowthRate.value ?? 0,
    job_growth_rate: state.market.jobGrowthRate.value ?? 0,
    crime_score: state.risk.crimeScore.value,
  };
}

// ── Derive StrategyFitInput ────────────────────────────────────────────

export function deriveStrategyFitInput(
  state: NormalizedDealState,
  analysis: AnalysisResult,
  marketConditions: MarketConditions
): StrategyFitInput {
  return {
    purchasePrice: state.financing.purchasePrice.value ?? 0,
    rehabCost: state.expenses.rehabCost.value ?? 0,
    arv: state.financing.arv.value ?? 0,
    projectedRent: state.rent.monthlyRent.value ?? 0,
    cashFlowMonthly: analysis.metrics.monthly_cashflow,
    capRate: analysis.metrics.cap_rate,
    cashOnCashReturn: analysis.metrics.cash_on_cash,
    rentTrend: marketConditions.rent_growth_12mo || null,
    priceTrend: marketConditions.price_growth_12mo || null,
    inventoryTrend: marketConditions.months_of_supply || null,
    crimeScore: marketConditions.crime_score ?? null,
  };
}

// ── Full Canonical Analysis Result ─────────────────────────────────────

export interface CanonicalAnalysisOutput {
  dealInput: DealInput;
  bufferedDealInput: DealInput;
  analysis: AnalysisResult;
  bufferedAnalysis: AnalysisResult;
  intelligence: DealIntelligenceResult;
  marketConditions: MarketConditions;
  marketIntelligence: MarketIntelligenceResult;
  strategyFit: StrategyFitResults;
  stressResults: StressTestResults;
  thresholds: MarketProfileThresholds;
  confidence: ConfidenceAssessment;
  financingOptions: FinancingResult[];
  marketOutlook: MarketOutlook | null;
  context: AnalysisContext;
}

/**
 * Run the full canonical analysis pipeline from a NormalizedDealState.
 * This is the single entry point for all analytical outputs.
 * Pure function — no side effects.
 * 
 * v1.6.0: Now requires AnalysisContext for profile-driven routing.
 */
export function runCanonicalAnalysis(
  state: NormalizedDealState,
  context?: AnalysisContext,
  sourceQuality?: SourceQualityInput
): CanonicalAnalysisOutput {
  // Default context for backward compatibility
  const resolvedContext: AnalysisContext = context ?? {
    marketType: "us_residential",
    assetType: "single_family",
    strategy: "long_term_rental",
    riskTolerance: "balanced",
  };

  // Get profile-specific thresholds
  const thresholds = getMarketThresholds(resolvedContext.marketType, resolvedContext.riskTolerance);

  // Derive raw deal input
  const dealInput = deriveDealInput(state);

  // Apply unseen-risk buffers for conservative analysis
  const bufferedDealInput = applyBuffersToDealInput(dealInput, thresholds);

  // Run analysis on both raw and buffered inputs
  const analysis = analyzeDeal(dealInput);
  const bufferedAnalysis = analyzeDeal(bufferedDealInput);

  // Intelligence uses buffered analysis for conservative decisioning
  const intelligence = analyzeDealIntelligence(bufferedAnalysis);

  // Market analysis
  const marketConditions = deriveMarketConditions(state);
  const marketIntelligence = evaluateMarketIntelligence(marketConditions);

  // Strategy fit uses raw analysis (buffers are for downside, not fit evaluation)
  const strategyFitInput = deriveStrategyFitInput(state, analysis, marketConditions);
  const strategyFit = evaluateDealStrategies(strategyFitInput);

  // Stress tests use buffered baseline for conservative modeling
  const stressResults = runStressTests(bufferedDealInput, bufferedAnalysis);

  // Confidence assessment with source quality awareness
  const confidence = evaluateConfidence(state, resolvedContext, sourceQuality);

  // Financing intelligence
  const financingOptions = evaluateFinancingOptions(dealInput, resolvedContext, analysis.metrics.dscr);

  // Market outlook (3–5 year forward intelligence)
  const marketOutlook = evaluateMarketOutlook({
    population_growth_rate: marketConditions.population_growth_rate || null,
    job_growth_rate: marketConditions.job_growth_rate || null,
    rent_growth_36mo: marketConditions.rent_growth_36mo || null,
    rent_growth_12mo: marketConditions.rent_growth_12mo || null,
    price_growth_36mo: marketConditions.price_growth_36mo || null,
    absorption_rate: marketConditions.absorption_rate || null,
    months_of_supply: marketConditions.months_of_supply || null,
    inventory_level: marketConditions.inventory_level || null,
  });

  return {
    dealInput,
    bufferedDealInput,
    analysis,
    bufferedAnalysis,
    intelligence,
    marketConditions,
    marketIntelligence,
    strategyFit,
    stressResults,
    thresholds,
    confidence,
    financingOptions,
    marketOutlook,
    context: resolvedContext,
  };
}

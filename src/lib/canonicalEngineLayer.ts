/**
 * BRIQ v1.5.3 — Canonical Engine Layer
 * 
 * Single orchestration point: normalizedDealState → all analytical engines → outputs.
 * Pure functions only. No side effects. No component-level math.
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

import { analyzeDeal } from "./dealAnalysisEngine";
import { analyzeDealIntelligence } from "./dealIntelligenceEngine";
import { evaluateDealStrategies } from "./strategyFitEngine";
import { evaluateMarketIntelligence } from "./marketIntelligenceEngine";
import { runStressTests } from "./stressTestingEngine";

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
  analysis: AnalysisResult;
  intelligence: DealIntelligenceResult;
  marketConditions: MarketConditions;
  marketIntelligence: MarketIntelligenceResult;
  strategyFit: StrategyFitResults;
  stressResults: StressTestResults;
}

/**
 * Run the full canonical analysis pipeline from a NormalizedDealState.
 * This is the single entry point for all analytical outputs.
 * Pure function — no side effects.
 */
export function runCanonicalAnalysis(state: NormalizedDealState): CanonicalAnalysisOutput {
  const dealInput = deriveDealInput(state);
  const analysis = analyzeDeal(dealInput);
  const intelligence = analyzeDealIntelligence(analysis);
  const marketConditions = deriveMarketConditions(state);
  const marketIntelligence = evaluateMarketIntelligence(marketConditions);
  const strategyFitInput = deriveStrategyFitInput(state, analysis, marketConditions);
  const strategyFit = evaluateDealStrategies(strategyFitInput);
  const stressResults = runStressTests(dealInput, analysis);

  return {
    dealInput,
    analysis,
    intelligence,
    marketConditions,
    marketIntelligence,
    strategyFit,
    stressResults,
  };
}

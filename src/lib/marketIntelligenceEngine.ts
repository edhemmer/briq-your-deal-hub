/**
 * BRIQ v1.5.0 — Local Market Conditions Intelligence Engine
 * Deterministic market signal evaluation and scoring.
 * Never modifies financial analysis outputs.
 */

export interface MarketConditions {
  median_rent: number;
  rent_growth_12mo: number;
  rent_growth_36mo: number;
  median_home_price: number;
  price_growth_12mo: number;
  price_growth_36mo: number;
  price_per_sqft: number;
  inventory_level: number;
  months_of_supply: number;
  days_on_market: number;
  sale_to_list_ratio: number;
  absorption_rate: number;
  population_growth_rate: number;
  job_growth_rate: number;
}

export interface MarketSignalScore {
  label: string;
  score: number;
  level: "strong" | "neutral" | "weak";
}

export interface MarketInsight {
  type: "positive" | "caution" | "risk";
  message: string;
}

export interface MarketIntelligenceResult {
  market_strength_score: number;
  market_risk_score: number;
  demand_pressure_score: number;
  strengthLabel: string;
  riskLabel: string;
  signals: {
    rent: MarketSignalScore;
    price: MarketSignalScore;
    supply: MarketSignalScore;
    liquidity: MarketSignalScore;
    demand: MarketSignalScore;
  };
  insights: MarketInsight[];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function signalLevel(score: number): "strong" | "neutral" | "weak" {
  if (score >= 61) return "strong";
  if (score >= 31) return "neutral";
  return "weak";
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Soft";
  return "Weak";
}

function riskLabel(score: number): string {
  if (score >= 70) return "High Risk";
  if (score >= 40) return "Moderate Risk";
  return "Low Risk";
}

/**
 * Evaluate rent signal from 12mo and 36mo rent growth.
 * Baseline: 3% annual growth = 50 score.
 */
function evaluateRentSignal(rent_growth_12mo: number, rent_growth_36mo: number): MarketSignalScore {
  let score = 50;
  // 12mo growth contribution (dominant signal)
  if (rent_growth_12mo >= 6) score += 30;
  else if (rent_growth_12mo >= 4) score += 20;
  else if (rent_growth_12mo >= 2) score += 5;
  else if (rent_growth_12mo >= 0) score -= 10;
  else score -= 30;

  // 36mo trend (supporting signal)
  if (rent_growth_36mo >= 12) score += 15;
  else if (rent_growth_36mo >= 6) score += 5;
  else if (rent_growth_36mo < 0) score -= 15;

  score = clamp(score, 0, 100);
  return { label: "Rent Signal", score, level: signalLevel(score) };
}

/**
 * Evaluate price signal from 12mo and 36mo price growth.
 */
function evaluatePriceSignal(price_growth_12mo: number, price_growth_36mo: number): MarketSignalScore {
  let score = 50;
  if (price_growth_12mo >= 8) score += 30;
  else if (price_growth_12mo >= 5) score += 20;
  else if (price_growth_12mo >= 2) score += 5;
  else if (price_growth_12mo >= 0) score -= 10;
  else score -= 30;

  if (price_growth_36mo >= 15) score += 15;
  else if (price_growth_36mo >= 8) score += 5;
  else if (price_growth_36mo < 0) score -= 15;

  score = clamp(score, 0, 100);
  return { label: "Price Signal", score, level: signalLevel(score) };
}

/**
 * Evaluate supply signal: months_of_supply and inventory_level.
 * Lower supply = stronger market for investors.
 */
function evaluateSupplySignal(months_of_supply: number, inventory_level: number): MarketSignalScore {
  let score = 50;
  // Months of supply (lower is better for investors)
  if (months_of_supply > 0 && months_of_supply < 3) score += 30;
  else if (months_of_supply >= 3 && months_of_supply < 5) score += 10;
  else if (months_of_supply >= 5 && months_of_supply < 7) score -= 5;
  else if (months_of_supply >= 7) score -= 25;

  // Inventory level as supporting context
  if (inventory_level > 0 && inventory_level < 500) score += 10;
  else if (inventory_level >= 2000) score -= 10;

  score = clamp(score, 0, 100);
  return { label: "Supply Signal", score, level: signalLevel(score) };
}

/**
 * Evaluate liquidity: days_on_market and sale_to_list_ratio.
 */
function evaluateLiquiditySignal(days_on_market: number, sale_to_list_ratio: number): MarketSignalScore {
  let score = 50;
  // Days on market (lower = more liquid)
  if (days_on_market > 0 && days_on_market < 20) score += 30;
  else if (days_on_market >= 20 && days_on_market < 40) score += 15;
  else if (days_on_market >= 40 && days_on_market < 60) score -= 5;
  else if (days_on_market >= 60) score -= 20;

  // Sale to list ratio
  if (sale_to_list_ratio >= 1.02) score += 15;
  else if (sale_to_list_ratio >= 0.98) score += 5;
  else if (sale_to_list_ratio > 0 && sale_to_list_ratio < 0.95) score -= 15;

  score = clamp(score, 0, 100);
  return { label: "Liquidity Signal", score, level: signalLevel(score) };
}

/**
 * Evaluate demand: population_growth_rate and job_growth_rate.
 */
function evaluateDemandSignal(population_growth_rate: number, job_growth_rate: number): MarketSignalScore {
  let score = 50;
  if (population_growth_rate >= 2) score += 25;
  else if (population_growth_rate >= 1) score += 10;
  else if (population_growth_rate >= 0) score -= 5;
  else score -= 25;

  if (job_growth_rate >= 3) score += 20;
  else if (job_growth_rate >= 1.5) score += 10;
  else if (job_growth_rate >= 0) score -= 5;
  else score -= 20;

  score = clamp(score, 0, 100);
  return { label: "Demand Signal", score, level: signalLevel(score) };
}

/**
 * Generate deterministic market insights from signal data.
 */
function generateInsights(conditions: MarketConditions, signals: MarketIntelligenceResult["signals"]): MarketInsight[] {
  const insights: MarketInsight[] = [];

  // Strong rental demand with limited supply
  if (conditions.rent_growth_12mo > 4 && conditions.months_of_supply < 4) {
    insights.push({ type: "positive", message: "Strong rental demand with limited housing supply." });
  }

  // High liquidity
  if (conditions.days_on_market > 0 && conditions.days_on_market < 25 && conditions.sale_to_list_ratio >= 0.99) {
    insights.push({ type: "positive", message: "Properties are selling quickly and near or above list price." });
  }

  // Strong job and population growth
  if (conditions.job_growth_rate >= 2 && conditions.population_growth_rate >= 1) {
    insights.push({ type: "positive", message: "Healthy job and population growth supports long-term demand." });
  }

  // Price appreciation
  if (conditions.price_growth_12mo >= 5) {
    insights.push({ type: "positive", message: "Home prices are appreciating, supporting equity growth." });
  }

  // Rising inventory risk
  if (conditions.months_of_supply >= 6 && conditions.days_on_market >= 50) {
    insights.push({ type: "risk", message: "Increasing inventory may place downward pressure on pricing." });
  }

  // Rent stagnation
  if (conditions.rent_growth_12mo < 1 && conditions.rent_growth_12mo >= -999) {
    insights.push({ type: "caution", message: "Rent growth is stagnant or declining in this market." });
  }

  // High days on market
  if (conditions.days_on_market >= 60) {
    insights.push({ type: "risk", message: "Extended days on market indicate reduced buyer interest." });
  }

  // Weak demand signals
  if (signals.demand.level === "weak") {
    insights.push({ type: "risk", message: "Population and job growth signals are weak for this area." });
  }

  // Oversupply
  if (conditions.months_of_supply >= 7) {
    insights.push({ type: "risk", message: "Market oversupply detected. Pricing power may be limited." });
  }

  // Sale below list
  if (conditions.sale_to_list_ratio > 0 && conditions.sale_to_list_ratio < 0.95) {
    insights.push({ type: "caution", message: "Properties are selling significantly below list price." });
  }

  return insights;
}

/**
 * Main market intelligence evaluation function.
 * Consumes market condition data and returns deterministic intelligence.
 */
export function evaluateMarketIntelligence(conditions: MarketConditions): MarketIntelligenceResult {
  const rent = evaluateRentSignal(conditions.rent_growth_12mo, conditions.rent_growth_36mo);
  const price = evaluatePriceSignal(conditions.price_growth_12mo, conditions.price_growth_36mo);
  const supply = evaluateSupplySignal(conditions.months_of_supply, conditions.inventory_level);
  const liquidity = evaluateLiquiditySignal(conditions.days_on_market, conditions.sale_to_list_ratio);
  const demand = evaluateDemandSignal(conditions.population_growth_rate, conditions.job_growth_rate);

  const signals = { rent, price, supply, liquidity, demand };

  const allScores = [rent.score, price.score, supply.score, liquidity.score, demand.score];
  const market_strength_score = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

  // Risk score: inverse of strength, adjusted for supply pressure
  const supplyPressure = supply.score < 40 ? 10 : 0;
  const market_risk_score = clamp(100 - market_strength_score + supplyPressure, 0, 100);

  // Demand pressure: weighted average of demand and supply signals
  const demand_pressure_score = Math.round((demand.score * 0.6 + supply.score * 0.4));

  const insights = generateInsights(conditions, signals);

  return {
    market_strength_score,
    market_risk_score,
    demand_pressure_score,
    strengthLabel: scoreLabel(market_strength_score),
    riskLabel: riskLabel(market_risk_score),
    signals,
    insights,
  };
}

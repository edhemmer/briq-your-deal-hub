// BRIQ Strategy Fit Engine v1.6.0 — deterministic, no external data.

import type { AnalysisResult } from "./dealAnalysisEngine";

export interface StrategySignals {
  financial: string[];
  property: string[];
  market: string[];
}

export interface StrategyScore {
  score: number;
  fitLevel: "Strong" | "Moderate" | "Weak";
  explanation: string;
  confidenceLevel: "High" | "Medium" | "Low";
  disqualifiers: string[];
  signals: StrategySignals;
}

export interface StrategyFitResults {
  brrrr: StrategyScore;
  longTermRental: StrategyScore;
  midTermRental: StrategyScore;
  shortTermRental: StrategyScore;
  fixFlip: StrategyScore;
  valueAdd: StrategyScore;
  appreciationHold: StrategyScore;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function fitLevel(score: number): "Strong" | "Moderate" | "Weak" {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Moderate";
  return "Weak";
}

function finalScore(financial: number, property: number, market: number): number {
  return clamp(Math.round(financial * 0.4 + property * 0.3 + market * 0.3), 0, 100);
}

// Normalize a value into a 0-100 score given a range where low=0 and high=100
function normalize(value: number, low: number, high: number): number {
  if (high <= low) return 50;
  return clamp(((value - low) / (high - low)) * 100, 0, 100);
}

export interface StrategyFitInput {
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  projectedRent: number;       // monthly rent
  cashFlowMonthly: number;
  capRate: number;
  cashOnCashReturn: number;
  rentTrend: number | null;    // rent_growth_12mo
  priceTrend: number | null;   // price_growth_12mo
  inventoryTrend: number | null; // months_of_supply
  crimeScore: number | null;   // 0-10
}

function safeNum(v: number | null | undefined): number {
  return v != null && Number.isFinite(v) ? v : 0;
}

export function evaluateDealStrategies(input: StrategyFitInput): StrategyFitResults {
  const pp = safeNum(input.purchasePrice);
  const rehab = safeNum(input.rehabCost);
  const arv = safeNum(input.arv);
  const rent = safeNum(input.projectedRent);
  const cf = safeNum(input.cashFlowMonthly);
  const cap = safeNum(input.capRate);
  const coc = safeNum(input.cashOnCashReturn);
  const rentTrend = input.rentTrend;
  const priceTrend = input.priceTrend;
  const inventory = input.inventoryTrend;
  const crime = input.crimeScore;

  // Shared helpers
  const totalCost = pp + rehab;
  const arvSpread = totalCost > 0 ? (arv - totalCost) / totalCost : 0;
  const rentTrendScore = rentTrend != null ? normalize(rentTrend, -5, 10) : 50;
  const priceTrendScore = priceTrend != null ? normalize(priceTrend, -5, 15) : 50;
  // Lower months_of_supply = tighter inventory = better for sellers
  const inventoryScore = inventory != null ? normalize(12 - inventory, 0, 12) : 50;
  const crimeAdjust = crime != null ? normalize(10 - crime, 0, 10) : 50; // higher = safer = better

  // ---- BRRRR ----
  const brrrrFinancial = clamp(
    normalize(arvSpread, 0, 0.4) * 0.5 +
    normalize(cf, -200, 500) * 0.3 +
    normalize(rent * 12, 0, 30000) * 0.2,
    0, 100
  );
  const brrrrProperty = clamp(
    normalize(arvSpread, 0, 0.5) * 0.6 +
    normalize(rehab > 0 ? 1 : 0, 0, 1) * 40,
    0, 100
  );
  const brrrrMarket = clamp(rentTrendScore * 0.5 + inventoryScore * 0.5, 0, 100);
  const brrrrScore = finalScore(brrrrFinancial, brrrrProperty, brrrrMarket);

  // ---- Long Term Rental ----
  const ltrFinancial = clamp(
    normalize(cf, -200, 500) * 0.4 +
    normalize(cap, 0, 0.12) * 0.3 +
    normalize(coc, 0, 0.15) * 0.3,
    0, 100
  );
  const ltrProperty = clamp(
    normalize(rent * 12, 0, 30000) * 0.6 +
    normalize(cf, -200, 500) * 0.4,
    0, 100
  );
  const ltrMarket = clamp(rentTrendScore * 0.6 + crimeAdjust * 0.4, 0, 100);
  const ltrScore = finalScore(ltrFinancial, ltrProperty, ltrMarket);

  // ---- Mid Term Rental ----
  const mtrFinancial = clamp(
    normalize(rent * 12, 0, 36000) * 0.5 +
    normalize(cf, -200, 500) * 0.5,
    0, 100
  );
  const mtrProperty = clamp(
    normalize(rent, 0, 3000) * 0.5 +
    rentTrendScore * 0.5,
    0, 100
  );
  const mtrMarket = clamp(
    priceTrendScore * 0.3 + rentTrendScore * 0.4 + inventoryScore * 0.3,
    0, 100
  );
  const mtrScore = finalScore(mtrFinancial, mtrProperty, mtrMarket);

  // ---- Short Term Rental ----
  const strFinancial = clamp(
    normalize(rent * 12, 0, 48000) * 0.6 +
    normalize(cf, -200, 600) * 0.4,
    0, 100
  );
  const strProperty = clamp(
    normalize(rent, 0, 4000) * 0.5 +
    priceTrendScore * 0.5,
    0, 100
  );
  const strMarket = clamp(
    priceTrendScore * 0.3 + inventoryScore * 0.3 + crimeAdjust * 0.4,
    0, 100
  );
  const strScore = finalScore(strFinancial, strProperty, strMarket);

  // ---- Fix & Flip ----
  const flipFinancial = clamp(
    normalize(arvSpread, 0, 0.4) * 0.7 +
    normalize(arv - totalCost, 0, 100000) * 0.3,
    0, 100
  );
  const flipProperty = clamp(
    normalize(arvSpread, 0, 0.5) * 0.5 +
    normalize(rehab > 0 && pp > 0 ? rehab / pp : 0, 0, 0.3) * 50,
    0, 100
  );
  const flipMarket = clamp(
    priceTrendScore * 0.5 + inventoryScore * 0.5,
    0, 100
  );
  const flipScore = finalScore(flipFinancial, flipProperty, flipMarket);

  // ---- Value Add ----
  const vaFinancial = clamp(
    normalize(cf, -200, 500) * 0.4 +
    normalize(rent * 12 - rehab * 0.1, 0, 25000) * 0.3 +
    normalize(coc, 0, 0.15) * 0.3,
    0, 100
  );
  const vaProperty = clamp(
    normalize(rehab > 0 ? rent * 12 / rehab : 0, 0, 2) * 0.6 +
    normalize(arvSpread, 0, 0.3) * 40,
    0, 100
  );
  const vaMarket = clamp(rentTrendScore * 0.6 + priceTrendScore * 0.4, 0, 100);
  const vaScore = finalScore(vaFinancial, vaProperty, vaMarket);

  // ---- Appreciation Hold ----
  const ahFinancial = clamp(
    priceTrendScore * 0.6 +
    normalize(cf, -300, 300) * 0.4,
    0, 100
  );
  const ahProperty = clamp(
    priceTrendScore * 0.5 + inventoryScore * 0.5,
    0, 100
  );
  const ahMarket = clamp(
    priceTrendScore * 0.4 + inventoryScore * 0.3 + crimeAdjust * 0.3,
    0, 100
  );
  const ahScore = finalScore(ahFinancial, ahProperty, ahMarket);

  // --- Confidence & Disqualifiers ---
  function confidenceLevel(score: number): "High" | "Medium" | "Low" {
    if (score >= 80) return "High";
    if (score >= 60) return "Medium";
    return "Low";
  }

  // Compute disqualifiers from existing inputs
  const allDisqualifiers: string[] = [];
  const thinArvSpread = arv - totalCost < pp * 0.10;
  const negativeCashFlow = cf < 0;
  const elevatedCrime = crime != null && crime >= 7;
  const softPriceTrend = priceTrend != null && priceTrend <= 0;
  const highRehabBurden = pp > 0 && rehab > pp * 0.40;
  const lowProjectedRent = rent > 0 && cf < 0; // rent produces negative cash flow

  if (thinArvSpread) allDisqualifiers.push("Thin ARV spread");
  if (negativeCashFlow) allDisqualifiers.push("Negative monthly cash flow");
  if (elevatedCrime) allDisqualifiers.push("Elevated crime signal");
  if (softPriceTrend) allDisqualifiers.push("Soft price trend");
  if (highRehabBurden) allDisqualifiers.push("High rehab burden");
  if (lowProjectedRent && !negativeCashFlow) allDisqualifiers.push("Low projected rent");

  // Strategy-specific disqualifier selection (max 3 per strategy)
  function pickDisqualifiers(relevant: string[]): string[] {
    return relevant.filter(d => allDisqualifiers.includes(d)).slice(0, 3);
  }

  const brrrrDQ = pickDisqualifiers(["Thin ARV spread", "Negative monthly cash flow", "High rehab burden", "Elevated crime signal"]);
  const ltrDQ = pickDisqualifiers(["Negative monthly cash flow", "Elevated crime signal", "Low projected rent", "Soft price trend"]);
  const mtrDQ = pickDisqualifiers(["Negative monthly cash flow", "Soft price trend", "Low projected rent", "Elevated crime signal"]);
  const strDQ = pickDisqualifiers(["Elevated crime signal", "Negative monthly cash flow", "Soft price trend", "Low projected rent"]);
  const flipDQ = pickDisqualifiers(["Thin ARV spread", "Soft price trend", "High rehab burden", "Elevated crime signal"]);
  const vaDQ = pickDisqualifiers(["High rehab burden", "Negative monthly cash flow", "Low projected rent", "Thin ARV spread"]);
  const ahDQ = pickDisqualifiers(["Soft price trend", "Elevated crime signal", "Thin ARV spread", "Negative monthly cash flow"]);

  // --- Signal Transparency Layer ---
  const financialSignals: string[] = [];
  if (cf > 0) financialSignals.push("Positive monthly cash flow");
  if (cf < 0) financialSignals.push("Negative monthly cash flow");
  const arvSpreadAmt = arv - totalCost;
  if (arvSpreadAmt >= pp * 0.20) financialSignals.push("Strong ARV spread");
  else if (arvSpreadAmt >= pp * 0.10) financialSignals.push("Moderate ARV spread");
  else financialSignals.push("Weak ARV spread");
  if (rent > 0 && cf < 0) financialSignals.push("Low projected rent");

  const propertySignals: string[] = [];
  if (pp > 0 && rehab > pp * 0.40) propertySignals.push("High rehab burden");
  else if (pp > 0 && rehab >= pp * 0.20) propertySignals.push("Moderate rehab burden");
  else if (pp > 0) propertySignals.push("Low rehab burden");

  const marketSignals: string[] = [];
  if (priceTrend != null) {
    if (priceTrend > 0) marketSignals.push("Positive price trend");
    else if (priceTrend === 0) marketSignals.push("Stable price trend");
    else marketSignals.push("Declining price trend");
  }
  if (crime != null && crime >= 7) marketSignals.push("Elevated crime signal");
  if (crime != null && crime <= 3) marketSignals.push("Low crime signal");

  // Each strategy gets the shared signals (max 3 per group)
  const signals: StrategySignals = {
    financial: financialSignals.slice(0, 3),
    property: propertySignals.slice(0, 3),
    market: marketSignals.slice(0, 3),
  };

  return {
    brrrr: {
      score: brrrrScore,
      fitLevel: fitLevel(brrrrScore),
      confidenceLevel: confidenceLevel(brrrrScore),
      disqualifiers: brrrrDQ,
      signals,
      explanation: brrrrScore >= 80
        ? "Strong rent support and deal spread make this a good BRRRR candidate."
        : brrrrScore >= 60
        ? "Moderate BRRRR potential — ARV spread or cash flow could be stronger."
        : "Thin margin and weaker cash flow reduce BRRRR viability.",
    },
    longTermRental: {
      score: ltrScore,
      fitLevel: fitLevel(ltrScore),
      confidenceLevel: confidenceLevel(ltrScore),
      disqualifiers: ltrDQ,
      signals,
      explanation: ltrScore >= 80
        ? "Solid cash flow and cap rate support long-term rental strategy."
        : ltrScore >= 60
        ? "Adequate rental metrics — cash flow margins are moderate."
        : "Weak cash flow or cap rate limits long-term rental fit.",
    },
    midTermRental: {
      score: mtrScore,
      fitLevel: fitLevel(mtrScore),
      confidenceLevel: confidenceLevel(mtrScore),
      disqualifiers: mtrDQ,
      signals,
      explanation: mtrScore >= 80
        ? "Rent levels and market signals support mid-term rental positioning."
        : mtrScore >= 60
        ? "Mid-term rental shows moderate potential based on available signals."
        : "Limited market demand signals for mid-term rental strategy.",
    },
    shortTermRental: {
      score: strScore,
      fitLevel: fitLevel(strScore),
      confidenceLevel: confidenceLevel(strScore),
      disqualifiers: strDQ,
      signals,
      explanation: strScore >= 80
        ? "Strong income potential and favorable market for short-term rental."
        : strScore >= 60
        ? "Moderate short-term rental fit — market conditions are mixed."
        : crime != null && crime >= 7
        ? "Elevated crime risk and weaker demand reduce short-term rental appeal."
        : "Limited signals to support short-term rental strategy.",
    },
    fixFlip: {
      score: flipScore,
      fitLevel: fitLevel(flipScore),
      confidenceLevel: confidenceLevel(flipScore),
      disqualifiers: flipDQ,
      signals,
      explanation: flipScore >= 80
        ? "Strong ARV spread and price momentum support a fix-and-flip exit."
        : flipScore >= 60
        ? "Moderate flip margin — profit depends on execution and market timing."
        : "Thin resale margin reduces fix-and-flip viability.",
    },
    valueAdd: {
      score: vaScore,
      fitLevel: fitLevel(vaScore),
      confidenceLevel: confidenceLevel(vaScore),
      disqualifiers: vaDQ,
      signals,
      explanation: vaScore >= 80
        ? "Rehab costs are well supported by rent upside and cash flow."
        : vaScore >= 60
        ? "Moderate value-add potential — rehab burden and rent support are balanced."
        : "High rehab burden relative to rent support weakens value-add fit.",
    },
    appreciationHold: {
      score: ahScore,
      fitLevel: fitLevel(ahScore),
      confidenceLevel: confidenceLevel(ahScore),
      disqualifiers: ahDQ,
      signals,
      explanation: ahScore >= 80
        ? "Positive price trend and tighter inventory support an appreciation hold."
        : ahScore >= 60
        ? "Moderate appreciation outlook — price trend or inventory could be stronger."
        : "Weak price trend and loose inventory reduce appreciation hold appeal.",
    },
  };
}

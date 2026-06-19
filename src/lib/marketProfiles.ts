/**
 * BRIX v1.6.0 — Market Profile & Strategy Profile Definitions
 *
 * Canonical type system for market-aware, strategy-aware, risk-adjusted decisioning.
 * Pure types and deterministic config — no side effects.
 */

// ── Market Type Gate ───────────────────────────────────────────────────

export type MarketType = "us_residential" | "us_commercial" | "international";

export const MARKET_TYPE_LABELS: Record<MarketType, string> = {
  us_residential: "US Residential",
  us_commercial: "US Commercial",
  international: "International",
};

// ── Asset Type Sub-Gates ───────────────────────────────────────────────

export type USResidentialAssetType =
  | "single_family"
  | "multi_family_2_4"
  | "multi_family_5_plus"
  | "condo"
  | "townhouse"
  | "manufactured";

export type USCommercialAssetType =
  | "office"
  | "retail"
  | "industrial"
  | "mixed_use"
  | "multifamily_commercial"
  | "hospitality"
  | "self_storage";

export const US_RESIDENTIAL_ASSET_LABELS: Record<USResidentialAssetType, string> = {
  single_family: "Single Family",
  multi_family_2_4: "Multi-Family (2–4 Units)",
  multi_family_5_plus: "Multi-Family (5+ Units)",
  condo: "Condo / Co-op",
  townhouse: "Townhouse",
  manufactured: "Manufactured / Mobile Home",
};

export const US_COMMERCIAL_ASSET_LABELS: Record<USCommercialAssetType, string> = {
  office: "Office",
  retail: "Retail",
  industrial: "Industrial / Warehouse",
  mixed_use: "Mixed Use",
  multifamily_commercial: "Multifamily (Commercial)",
  hospitality: "Hospitality",
  self_storage: "Self-Storage",
};

// ── International Context ──────────────────────────────────────────────

export interface InternationalContext {
  country: string;
  region: string; // city or region
}

// ── Strategy Selection ─────────────────────────────────────────────────

export type InvestmentStrategy =
  | "buy_and_hold"
  | "long_term_rental"
  | "mid_term_rental"
  | "short_term_rental"
  | "hybrid"
  | "house_hack"
  | "brrrr"
  | "hybrid_brrrr"
  | "fix_flip"
  | "value_add"
  | "refinance"
  | "hold"
  | "sell"
  | "seller_finance"
  | "subject_to"
  | "lease_option"
  | "wrap_mortgage"
  | "adu"
  | "lot_split"
  | "mixed_use_conversion"
  | "commercial_repositioning"
  | "development"
  | "exchange_1031";

export const STRATEGY_LABELS: Record<InvestmentStrategy, string> = {
  buy_and_hold: "Buy and Hold",
  long_term_rental: "Long-Term Rental",
  mid_term_rental: "Mid-Term Rental",
  short_term_rental: "Short-Term Rental",
  hybrid: "Hybrid (LTR + STR)",
  house_hack: "House Hack",
  brrrr: "BRRRR",
  hybrid_brrrr: "Hybrid BRRRR",
  fix_flip: "Fix and Flip",
  value_add: "Value-Add",
  refinance: "Refinance",
  hold: "Hold",
  sell: "Sell",
  seller_finance: "Seller Finance",
  subject_to: "Subject-To",
  lease_option: "Lease Option",
  wrap_mortgage: "Wrap Mortgage",
  adu: "ADU Addition",
  lot_split: "Lot Split",
  mixed_use_conversion: "Mixed Use Conversion",
  commercial_repositioning: "Commercial Repositioning",
  development: "Development",
  exchange_1031: "1031 Exchange",
};

export const STRATEGY_DESCRIPTIONS: Record<InvestmentStrategy, string> = {
  buy_and_hold: "Acquire and operate the property over time. Prioritizes durable economics, risk controls, and long-term wealth creation.",
  long_term_rental: "Buy and hold for steady monthly rental income with long-term tenants. Prioritizes cash flow stability and predictable returns.",
  mid_term_rental: "Operate with furnished monthly stays. Requires stronger demand validation, operating assumptions, and regulation checks.",
  short_term_rental: "Operate as a furnished rental (Airbnb, VRBO). Higher income potential but more operational complexity and regulatory risk.",
  hybrid: "Combine long-term and short-term strategies across units or seasons. Balances income upside with cash flow stability.",
  house_hack: "Live in part of the property while offsetting ownership costs with rental income. Evaluates both life and investment outcomes.",
  brrrr: "Buy, renovate, rent, refinance, and repeat. Requires strong rehab scope, rent support, refinance assumptions, and equity creation.",
  hybrid_brrrr: "Use a staged BRRRR plan with flexible timing or partial refinance. Requires explicit scenario and capital planning.",
  fix_flip: "Renovate and resell. Depends on verified ARV, rehab scope, carry costs, resale liquidity, and execution control.",
  value_add: "Improve income, condition, layout, or market position. Requires clear scope, budget confidence, and realistic upside.",
  refinance: "Replace or restructure debt to improve cash flow, reduce risk, or access equity. Requires lender and valuation verification.",
  hold: "Keep the asset and monitor performance. Evaluates risk, liquidity, opportunity cost, and future optionality.",
  sell: "Dispose of the asset or pass on the acquisition. Evaluates net proceeds, market timing, tax impact, and redeployment options.",
  seller_finance: "Use seller-provided financing. Requires professional review of terms, legal structure, default risk, and exit plan.",
  subject_to: "Acquire subject to existing debt. High legal and lender-risk strategy requiring professional review before action.",
  lease_option: "Control the asset through lease and purchase option terms. Requires careful contract, financing, and exit verification.",
  wrap_mortgage: "Use a wraparound financing structure. Requires professional legal review and conservative default-risk analysis.",
  adu: "Add or convert an accessory dwelling unit. Requires zoning, permit, cost, rent, and timeline verification.",
  lot_split: "Create value by subdividing land. Requires zoning, entitlement, survey, utility, and saleability verification.",
  mixed_use_conversion: "Reposition a property across residential and commercial use. Requires zoning, demand, and execution review.",
  commercial_repositioning: "Improve commercial use, tenant mix, lease structure, or operating profile. Requires market and lease diligence.",
  development: "Build or substantially redevelop. Highest complexity; requires entitlement, budget, schedule, financing, and exit verification.",
  exchange_1031: "Evaluate tax-deferred exchange fit. Educational only; requires CPA/intermediary review before execution.",
};

// ── Risk Tolerance ─────────────────────────────────────────────────────

export type RiskTolerance = "conservative" | "balanced" | "aggressive";

export const RISK_TOLERANCE_LABELS: Record<RiskTolerance, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  aggressive: "Aggressive",
};

export const RISK_TOLERANCE_DESCRIPTIONS: Record<RiskTolerance, string> = {
  conservative: "Tighter thresholds, stronger downside protection. Prioritizes capital preservation and margin of safety.",
  balanced: "Standard industry thresholds. Balances upside potential with reasonable downside protection.",
  aggressive: "More tolerant of tighter margins and higher risk. Accepts lower coverage ratios for higher potential returns.",
};

// ── Analysis Context (Gating Result) ──────────────────────────────────

export interface AnalysisContext {
  marketType: MarketType;
  assetType: string; // USResidentialAssetType | USCommercialAssetType | "international"
  strategy: InvestmentStrategy;
  riskTolerance: RiskTolerance;
  internationalContext?: InternationalContext;
}

/**
 * Validate that all required gates are satisfied before analysis can run.
 */
export function isContextComplete(ctx: Partial<AnalysisContext>): ctx is AnalysisContext {
  if (!ctx.marketType || !ctx.strategy || !ctx.riskTolerance) return false;
  if (!ctx.assetType) return false;
  if (ctx.marketType === "international") {
    if (!ctx.internationalContext?.country || !ctx.internationalContext?.region) return false;
  }
  return true;
}

// ── Market Profile: Threshold Configuration ───────────────────────────
// Each market type gets a different set of decision thresholds.

export interface MarketProfileThresholds {
  /** Minimum cap rate considered acceptable */
  minCapRate: number;
  /** Minimum DSCR for debt coverage */
  minDscr: number;
  /** Minimum monthly cash flow target */
  minMonthlyCashFlow: number;
  /** Minimum cash-on-cash return */
  minCashOnCash: number;
  /** Maximum acceptable vacancy rate */
  maxVacancyRate: number;
  /** Buffer multiplier for expense assumptions (e.g. 1.05 = 5% buffer) */
  expenseBuffer: number;
  /** Buffer added to interest rate assumptions (absolute, e.g. 0.005 = 0.5%) */
  interestRateBuffer: number;
  /** Buffer added to vacancy assumptions (absolute, e.g. 0.02 = 2%) */
  vacancyBuffer: number;
}

/**
 * Get deterministic thresholds based on market type + risk tolerance.
 * These are rules-based — no AI, no guessing.
 */
export function getMarketThresholds(
  marketType: MarketType,
  riskTolerance: RiskTolerance
): MarketProfileThresholds {
  // Base thresholds by market type
  const baseByMarket: Record<MarketType, MarketProfileThresholds> = {
    us_residential: {
      minCapRate: 0.05,
      minDscr: 1.20,
      minMonthlyCashFlow: 150,
      minCashOnCash: 0.08,
      maxVacancyRate: 0.10,
      expenseBuffer: 1.05,
      interestRateBuffer: 0.005,
      vacancyBuffer: 0.02,
    },
    us_commercial: {
      minCapRate: 0.06,
      minDscr: 1.25,
      minMonthlyCashFlow: 500,
      minCashOnCash: 0.08,
      maxVacancyRate: 0.12,
      expenseBuffer: 1.07,
      interestRateBuffer: 0.0075,
      vacancyBuffer: 0.03,
    },
    international: {
      minCapRate: 0.06,
      minDscr: 1.25,
      minMonthlyCashFlow: 200,
      minCashOnCash: 0.08,
      maxVacancyRate: 0.12,
      expenseBuffer: 1.10,
      interestRateBuffer: 0.01,
      vacancyBuffer: 0.03,
    },
  };

  const base = { ...baseByMarket[marketType] };

  // Risk tolerance adjustments
  switch (riskTolerance) {
    case "conservative":
      base.minCapRate += 0.01;
      base.minDscr += 0.10;
      base.minMonthlyCashFlow *= 1.25;
      base.minCashOnCash += 0.02;
      base.maxVacancyRate -= 0.02;
      base.expenseBuffer += 0.03;
      base.interestRateBuffer += 0.005;
      base.vacancyBuffer += 0.02;
      break;
    case "aggressive":
      base.minCapRate -= 0.01;
      base.minDscr -= 0.05;
      base.minMonthlyCashFlow *= 0.75;
      base.minCashOnCash -= 0.02;
      base.maxVacancyRate += 0.02;
      base.expenseBuffer -= 0.02;
      base.interestRateBuffer = Math.max(0, base.interestRateBuffer - 0.0025);
      base.vacancyBuffer = Math.max(0, base.vacancyBuffer - 0.01);
      break;
    // "balanced" uses base values as-is
  }

  return base;
}

// ── Unseen-Risk Buffer Application ────────────────────────────────────
// Applies conservative buffers to raw deal inputs before analysis.

export interface BufferedDealAdjustments {
  adjustedInterestRate: number;
  adjustedVacancyPercent: number;
  adjustedExpenseMultiplier: number;
}

/**
 * Apply unseen-risk buffers to deal inputs based on market profile.
 * This is not random padding — it is a deterministic, defensible downside adjustment.
 */
export function applyUnseenRiskBuffers(
  interestRate: number,
  vacancyPercent: number,
  thresholds: MarketProfileThresholds
): BufferedDealAdjustments {
  return {
    adjustedInterestRate: interestRate + thresholds.interestRateBuffer,
    adjustedVacancyPercent: Math.min(vacancyPercent + thresholds.vacancyBuffer, 0.30), // cap at 30%
    adjustedExpenseMultiplier: thresholds.expenseBuffer,
  };
}

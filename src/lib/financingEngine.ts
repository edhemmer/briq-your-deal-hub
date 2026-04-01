/**
 * BRIQ v1.6.2 — Financing Intelligence Engine
 *
 * Deterministic, rules-based financing path evaluation.
 * No AI, no external APIs, no approval language.
 */

import type { DealInput } from "./dealAnalysisEngine";
import type { AnalysisContext, MarketType, RiskTolerance } from "./marketProfiles";

// ── Types ──────────────────────────────────────────────────────────────

export type FinancingFitScore = "strong" | "moderate" | "weak" | "not_recommended";

export type FinancingType =
  | "conventional"
  | "dscr"
  | "bridge"
  | "portfolio"
  | "commercial_bank"
  | "agency"
  | "sba"
  | "cash"
  | "local_bank"
  | "developer"
  | "private_hard_money";

export interface FinancingResult {
  type: FinancingType;
  label: string;
  fitScore: FinancingFitScore;
  rateRange: { min: number; max: number };
  downPaymentRange: { min: number; max: number };
  estimatedMonthlyPayment: number;
  estimatedCashToClose: number;
  termStructure: string;
  pros: string[];
  cons: string[];
  confidenceImpact: "increase" | "neutral" | "decrease";
  sourceTag: string;
  lastUpdated: string;
}

// ── Base Rate Table ────────────────────────────────────────────────────

const BASE_RATES: Record<string, [number, number]> = {
  conventional:      [0.0625, 0.0775],
  dscr:              [0.0675, 0.085],
  bridge:            [0.085,  0.12],
  portfolio:         [0.065,  0.085],
  commercial_bank:   [0.065,  0.085],
  agency:            [0.055,  0.075],
  sba:               [0.065,  0.08],
  cash:              [0, 0],
  local_bank:        [0.07,   0.10],
  developer:         [0.06,   0.09],
  private_hard_money:[0.09,   0.14],
};

const DOWN_PAYMENT_RANGES: Record<string, [number, number]> = {
  conventional:      [0.20, 0.25],
  dscr:              [0.20, 0.30],
  bridge:            [0.10, 0.20],
  portfolio:         [0.15, 0.25],
  commercial_bank:   [0.25, 0.35],
  agency:            [0.20, 0.30],
  sba:               [0.10, 0.20],
  cash:              [1.0,  1.0],
  local_bank:        [0.20, 0.35],
  developer:         [0.10, 0.30],
  private_hard_money:[0.15, 0.30],
};

// ── Amortization Calculation ───────────────────────────────────────────

function calcMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0;
  if (annualRate <= 0) return principal / (termYears * 12);
  const r = annualRate / 12;
  const n = termYears * 12;
  const factor = Math.pow(1 + r, n);
  const payment = principal * (r * factor) / (factor - 1);
  return Number.isFinite(payment) ? payment : 0;
}

// ── Profile Definitions ────────────────────────────────────────────────

interface FinancingProfile {
  type: FinancingType;
  label: string;
  termStructure: string;
  termYears: number;
  pros: string[];
  cons: string[];
}

const US_RESIDENTIAL_PROFILES: FinancingProfile[] = [
  {
    type: "conventional",
    label: "Conventional Investor Loan",
    termStructure: "30-year fixed amortization",
    termYears: 30,
    pros: ["Lowest rates available", "Fixed long-term rate", "Widely available"],
    cons: ["Strict qualification requirements", "Limited to 10 financed properties", "Longer closing timeline"],
  },
  {
    type: "dscr",
    label: "DSCR Loan",
    termStructure: "30-year amortization, rate lock 5–7yr",
    termYears: 30,
    pros: ["No personal income verification", "Based on property cash flow", "Faster qualification"],
    cons: ["Higher rates than conventional", "Higher down payment typical", "Prepayment penalties common"],
  },
  {
    type: "bridge",
    label: "Bridge / Rehab Loan",
    termStructure: "12–24 month interest-only with balloon",
    termYears: 2,
    pros: ["Fast closing", "Finances rehab costs", "Lower initial down payment"],
    cons: ["Very high rates", "Short term requires exit plan", "Balloon payment risk"],
  },
  {
    type: "portfolio",
    label: "Portfolio / Local Bank",
    termStructure: "15–25 year amortization, 5yr balloon typical",
    termYears: 20,
    pros: ["Flexible underwriting", "Relationship-based", "Can finance non-standard properties"],
    cons: ["Balloon refinance risk", "Higher rates than conventional", "Limited availability"],
  },
];

const US_COMMERCIAL_PROFILES: FinancingProfile[] = [
  {
    type: "commercial_bank",
    label: "Commercial Bank Loan",
    termStructure: "20–25 year amortization, 5–10yr term",
    termYears: 25,
    pros: ["Established lending path", "Moderate rates", "Suitable for stabilized assets"],
    cons: ["Requires strong financials", "Higher down payment", "Balloon refinance exposure"],
  },
  {
    type: "bridge",
    label: "Commercial Bridge Loan",
    termStructure: "12–36 month interest-only",
    termYears: 2,
    pros: ["Fast execution", "Finances value-add", "Flexible terms"],
    cons: ["High cost of capital", "Short duration", "Exit strategy required"],
  },
  {
    type: "agency",
    label: "Agency Loan (Multifamily)",
    termStructure: "30-year fixed, non-recourse",
    termYears: 30,
    pros: ["Best commercial rates", "Non-recourse available", "Long-term stability"],
    cons: ["Multifamily only (5+ units)", "Strict occupancy requirements", "Lengthy approval process"],
  },
  {
    type: "sba",
    label: "SBA Loan",
    termStructure: "25-year amortization, variable rate",
    termYears: 25,
    pros: ["Low down payment (10%)", "Government-backed", "Competitive rates"],
    cons: ["Owner-occupied requirement (51%+)", "Slow processing", "Personal guarantee required"],
  },
];

const INTERNATIONAL_PROFILES: FinancingProfile[] = [
  {
    type: "cash",
    label: "Cash Purchase",
    termStructure: "No financing — full equity",
    termYears: 0,
    pros: ["No interest costs", "Fastest closing", "No lender requirements"],
    cons: ["Full capital commitment", "No leverage benefit", "Opportunity cost"],
  },
  {
    type: "local_bank",
    label: "Local Bank Financing",
    termStructure: "10–20 year amortization, variable rate",
    termYears: 15,
    pros: ["Local market expertise", "Established path for residents", "May accept local collateral"],
    cons: ["Foreign borrower restrictions common", "Higher rates for non-residents", "Currency risk"],
  },
  {
    type: "developer",
    label: "Developer Financing",
    termStructure: "Varies — staged payments common",
    termYears: 5,
    pros: ["No bank qualification needed", "Flexible payment structure", "Common in new developments"],
    cons: ["Limited negotiation leverage", "Developer default risk", "Often above-market rates"],
  },
  {
    type: "private_hard_money",
    label: "Private / Hard Money",
    termStructure: "6–24 month interest-only",
    termYears: 1,
    pros: ["Fast access to capital", "Minimal documentation", "Available globally"],
    cons: ["Very high cost", "Short term only", "High default risk"],
  },
];

// ── Rate Adjustments ───────────────────────────────────────────────────

function adjustRates(
  base: [number, number],
  riskTolerance: RiskTolerance,
  rehabIntensity: "none" | "light" | "heavy",
): { min: number; max: number } {
  let [min, max] = base;

  // Risk tolerance shifts perception of rate range
  if (riskTolerance === "conservative") {
    min += 0.0025;
    max += 0.005;
  } else if (riskTolerance === "aggressive") {
    min -= 0.0025;
    max -= 0.0025;
  }

  // Rehab intensity shifts rate expectations
  if (rehabIntensity === "heavy") {
    min += 0.005;
    max += 0.01;
  } else if (rehabIntensity === "light") {
    min += 0.0025;
    max += 0.005;
  }

  return { min: Math.max(0, min), max: Math.max(min, max) };
}

// ── Fit Scoring ────────────────────────────────────────────────────────

function evaluateFit(
  profile: FinancingProfile,
  input: DealInput,
  context: AnalysisContext,
  dscr: number,
): FinancingFitScore {
  const pp = input.purchase_price;
  const rehabRatio = pp > 0 ? input.rehab_cost / pp : 0;
  const rehabIntensity: "none" | "light" | "heavy" = rehabRatio > 0.3 ? "heavy" : rehabRatio > 0.05 ? "light" : "none";
  const strategy = context.strategy;

  switch (profile.type) {
    case "conventional": {
      if (rehabIntensity === "heavy") return "not_recommended";
      if (dscr >= 1.25 && strategy !== "short_term_rental") return "strong";
      if (dscr >= 1.0) return "moderate";
      return "weak";
    }
    case "dscr": {
      if (dscr >= 1.25) return "strong";
      if (dscr >= 1.0) return "moderate";
      if (dscr >= 0.75) return "weak";
      return "not_recommended";
    }
    case "bridge": {
      if (rehabIntensity === "heavy" || rehabIntensity === "light") return "strong";
      if (strategy === "short_term_rental") return "moderate";
      return "weak";
    }
    case "portfolio": {
      if (dscr >= 1.1) return "strong";
      if (dscr >= 0.9) return "moderate";
      return "weak";
    }
    case "commercial_bank": {
      if (dscr >= 1.25 && pp >= 500000) return "strong";
      if (dscr >= 1.1) return "moderate";
      return "weak";
    }
    case "agency": {
      // Multifamily only
      if (context.assetType === "multi_family_5_plus" || context.assetType === "multifamily_commercial") {
        if (dscr >= 1.25) return "strong";
        if (dscr >= 1.1) return "moderate";
        return "weak";
      }
      return "not_recommended";
    }
    case "sba": {
      // Owner-occupied only — generally weak for investors
      return "weak";
    }
    case "cash": {
      if (pp > 0 && pp < 300000) return "strong";
      return "moderate";
    }
    case "local_bank": {
      return "moderate";
    }
    case "developer": {
      if (rehabIntensity === "none") return "moderate";
      return "weak";
    }
    case "private_hard_money": {
      if (rehabIntensity === "heavy") return "moderate";
      return "weak";
    }
    default:
      return "weak";
  }
}

const FIT_SCORE_RANK: Record<FinancingFitScore, number> = {
  strong: 4,
  moderate: 3,
  weak: 2,
  not_recommended: 1,
};

// ── Main Evaluation Function ───────────────────────────────────────────

export function evaluateFinancingOptions(
  input: DealInput,
  context: AnalysisContext,
  dscr: number,
): FinancingResult[] {
  const profiles = getProfilesForMarket(context.marketType);
  const pp = input.purchase_price;
  const rehabRatio = pp > 0 ? input.rehab_cost / pp : 0;
  const rehabIntensity: "none" | "light" | "heavy" = rehabRatio > 0.3 ? "heavy" : rehabRatio > 0.05 ? "light" : "none";
  const now = new Date().toISOString();

  const results: FinancingResult[] = profiles.map(profile => {
    const fitScore = evaluateFit(profile, input, context, dscr);
    const baseRate = BASE_RATES[profile.type] ?? [0.07, 0.10];
    const rateRange = adjustRates(baseRate, context.riskTolerance, rehabIntensity);
    const dpRange = DOWN_PAYMENT_RANGES[profile.type] ?? [0.20, 0.30];

    // Use midpoint rate and midpoint down payment for estimates
    const midRate = (rateRange.min + rateRange.max) / 2;
    const midDp = (dpRange[0] + dpRange[1]) / 2;
    const downPayment = pp * midDp;
    const loanAmount = Math.max(0, pp - downPayment);
    const monthlyPayment = profile.type === "cash"
      ? 0
      : calcMonthlyPayment(loanAmount, midRate, profile.termYears);

    const cashToClose = downPayment + input.closing_costs + input.rehab_cost + input.rehab_contingency;

    const confidenceImpact: "increase" | "neutral" | "decrease" =
      fitScore === "strong" && dscr >= 1.2 ? "increase"
      : fitScore === "not_recommended" || fitScore === "weak" ? "decrease"
      : "neutral";

    return {
      type: profile.type,
      label: profile.label,
      fitScore,
      rateRange,
      downPaymentRange: { min: dpRange[0], max: dpRange[1] },
      estimatedMonthlyPayment: Math.round(monthlyPayment * 100) / 100,
      estimatedCashToClose: Math.round(cashToClose),
      termStructure: profile.termStructure,
      pros: profile.pros,
      cons: profile.cons,
      confidenceImpact,
      sourceTag: "BRIQ Financing Model (Market-Based Estimates)",
      lastUpdated: now,
    };
  });

  // Sort by fit score descending, return top 3
  results.sort((a, b) => FIT_SCORE_RANK[b.fitScore] - FIT_SCORE_RANK[a.fitScore]);
  return results.slice(0, 3);
}

function getProfilesForMarket(marketType: MarketType): FinancingProfile[] {
  switch (marketType) {
    case "us_residential": return US_RESIDENTIAL_PROFILES;
    case "us_commercial": return US_COMMERCIAL_PROFILES;
    case "international": return INTERNATIONAL_PROFILES;
    default: return US_RESIDENTIAL_PROFILES;
  }
}

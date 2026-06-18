import type { AnalysisResult, DealInput } from "./dealAnalysisEngine";
import type { HiddenRiskResult } from "./hiddenRiskEngine";
import type { MarketIntelligenceResult } from "./marketIntelligenceEngine";

export type HoldPeriod = 5 | 10 | 15;

export interface ResidentialDecisionInput {
  dealInput: DealInput;
  analysis: AnalysisResult;
  marketIntelligence: MarketIntelligenceResult;
  hiddenRisks: HiddenRiskResult | null;
  holdPeriodYears: HoldPeriod;
  priceGrowthAnnual?: number | null;
  rentGrowthAnnual?: number | null;
  assessedValue?: number | null;
  annualPropertyTax?: number | null;
  yearBuilt?: number | null;
}

export interface ResidentialDecisionResult {
  score: number;
  verdict: "Strong Fit" | "Workable" | "Negotiate Hard" | "Do Not Chase";
  projectedEquity: number;
  estimatedValueAtExit: number;
  ownershipCostMonthly: number;
  rentEquivalentGapMonthly: number;
  priceToAssessmentRatio: number | null;
  signals: string[];
  questions: string[];
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(n)));
const safe = (n: number | null | undefined) => (Number.isFinite(n ?? NaN) ? Number(n) : 0);

export function evaluateResidentialDecision(input: ResidentialDecisionInput): ResidentialDecisionResult {
  const price = safe(input.dealInput.purchase_price);
  const assessed = safe(input.assessedValue);
  const annualTax = safe(input.annualPropertyTax) || input.analysis.expenses.taxes;
  const insurance = input.analysis.expenses.insurance;
  const monthlyDebt = input.analysis.financing.monthly_payment;
  const maintenanceReserve = price * 0.01 / 12;
  const ownershipCostMonthly = monthlyDebt + annualTax / 12 + insurance / 12 + maintenanceReserve;
  const marketRent = safe(input.dealInput.monthly_rent);
  const rentEquivalentGapMonthly = ownershipCostMonthly - marketRent;
  const annualGrowth = (input.priceGrowthAnnual ?? 0.025) || 0.025;
  const estimatedValueAtExit = price * Math.pow(1 + annualGrowth, input.holdPeriodYears);
  const projectedEquity = estimatedValueAtExit - input.analysis.financing.loan_amount;
  const priceToAssessmentRatio = assessed > 0 && price > 0 ? price / assessed : null;

  let score = 62;
  if (rentEquivalentGapMonthly <= 250) score += 10;
  else if (rentEquivalentGapMonthly > 1000) score -= 12;
  if (annualGrowth >= 0.03) score += 9;
  if (annualGrowth < 0) score -= 15;
  if (priceToAssessmentRatio != null && priceToAssessmentRatio > 1.25) score -= 8;
  if (priceToAssessmentRatio != null && priceToAssessmentRatio <= 1.05) score += 6;
  if (input.marketIntelligence.market_risk_score > 65) score -= 10;
  if (input.marketIntelligence.demand_pressure_score > 65) score += 8;
  if ((input.hiddenRisks?.totalRiskScore ?? 0) > 35) score -= 12;
  if (input.yearBuilt && input.yearBuilt < 1978) score -= 5;
  score = clamp(score);

  const verdict =
    score >= 78 ? "Strong Fit" :
    score >= 64 ? "Workable" :
    score >= 48 ? "Negotiate Hard" :
    "Do Not Chase";

  const signals: string[] = [
    `${input.holdPeriodYears}-year projected value uses ${(annualGrowth * 100).toFixed(1)}% annual price growth.`,
    `Estimated all-in owner cost is ${ownershipCostMonthly.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}/mo before utilities and personal tax treatment.`,
  ];
  if (marketRent > 0) {
    signals.push(`Own-vs-rent gap is ${rentEquivalentGapMonthly.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}/mo.`);
  }
  if (priceToAssessmentRatio != null) {
    signals.push(`Price is ${priceToAssessmentRatio.toFixed(2)}x assessed value; confirm the assessor cycle and exemptions.`);
  }
  if (input.yearBuilt && input.yearBuilt < 1978) {
    signals.push("Older-home diligence required: lead paint, asbestos, galvanized plumbing, electrical capacity, roof age, and foundation movement.");
  }

  const questions = [
    "What are the roof, HVAC, electrical panel, plumbing, sewer line, and foundation ages or known defects?",
    "Are there permits, code violations, insurance claims, flood events, special assessments, or HOA restrictions tied to this property?",
    "What changed in the last three comparable sales that supports this price, and which comps should be excluded?",
    "What seller repairs, credits, rate buydown, or price concession should we request before inspection contingency expires?",
  ];

  return {
    score,
    verdict,
    projectedEquity,
    estimatedValueAtExit,
    ownershipCostMonthly,
    rentEquivalentGapMonthly,
    priceToAssessmentRatio,
    signals,
    questions,
  };
}

export interface DueDiligenceQuestionSet {
  realtor: string[];
  attorney: string[];
  lender: string[];
  inspector: string[];
}

export function buildDueDiligenceQuestions(input: {
  analysis: AnalysisResult;
  hiddenRisks: HiddenRiskResult | null;
  marketIntelligence: MarketIntelligenceResult;
  propertyType?: string | null;
}): DueDiligenceQuestionSet {
  const questions: DueDiligenceQuestionSet = {
    realtor: [
      "Which three closed comps best defend this price, and what adjustments were made for condition, concessions, lot, beds/baths, and timing?",
      "What seller motivation, days-on-market pattern, price reductions, or inspection history can we use for negotiation?",
      "Are rents, occupancy, taxes, insurance, utilities, HOA dues, and repair history documented by source files?",
    ],
    attorney: [
      "Do the contingencies, deadlines, remedies, assignment rights, inspection access, and termination rights protect our downside?",
      "Is title clean of liens, easements, encroachments, open permits, municipal violations, rent restrictions, or seller possession issues?",
      "What language should be added for repair credits, seller disclosures, appraisal gaps, financing failure, and prorations?",
    ],
    lender: [
      "What financing structures reduce cash-to-close without weakening reserves: grants, DPA, seller credits, renovation loan, DSCR, FHA/VA, or portfolio loan?",
      "What rate, points, prepayment penalties, reserve requirements, and renovation draw rules change our true return?",
      "At what appraisal value, insurance premium, tax reassessment, or rent haircut does the financing no longer work?",
    ],
    inspector: [
      "Prioritize roof, foundation, moisture intrusion, grading/drainage, electrical, plumbing, HVAC, sewer scope, pests, and environmental hazards.",
      "Estimate immediate safety repairs separately from optional upgrades and tenant-ready or move-in-ready work.",
      "Flag hidden-cost items visible in photos: staining, uneven floors, patched walls, old panels, roof waves, window failure, and drainage defects.",
    ],
  };

  if (input.analysis.metrics.dscr < 1.15) {
    questions.lender.push("Can we improve DSCR through lower leverage, seller concessions, buydown, longer amortization, or verified higher rent?");
  }
  if (input.analysis.metrics.monthly_cashflow < 0) {
    questions.realtor.push("What price reduction or credit makes the monthly cash flow non-negative after reserves?");
  }
  if ((input.hiddenRisks?.flagCount ?? 0) > 0) {
    questions.inspector.push("Review each BRIX hidden-risk flag and quote remediation ranges before contingency removal.");
  }
  if ((input.propertyType ?? "").toLowerCase().includes("multi")) {
    questions.attorney.push("Confirm leases, deposits, estoppels, rent roll accuracy, tenant notices, local rental registration, and inherited obligations.");
  }
  if (input.marketIntelligence.market_risk_score > 65) {
    questions.realtor.push("What neighborhood-level risks are affecting buyer demand: crime, schools, supply, employer concentration, zoning, or insurance availability?");
  }

  return questions;
}

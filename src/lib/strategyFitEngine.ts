// BRIX Strategy Fit Engine v1.6.0 — deterministic, no external data.

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
  requiredInputs: string[];
  assumptions: string[];
  verificationQuestions: string[];
  successCriteria: string[];
  whatMustBeTrue: string[];
  failureScenarios: string[];
}

export interface StrategyFitResults {
  buyAndHold: StrategyScore;
  brrrr: StrategyScore;
  hybridBrrrr: StrategyScore;
  longTermRental: StrategyScore;
  midTermRental: StrategyScore;
  shortTermRental: StrategyScore;
  hybridRental: StrategyScore;
  houseHack: StrategyScore;
  fixFlip: StrategyScore;
  valueAdd: StrategyScore;
  appreciationHold: StrategyScore;
  refinance: StrategyScore;
  hold: StrategyScore;
  sell: StrategyScore;
  sellerFinance: StrategyScore;
  subjectTo: StrategyScore;
  leaseOption: StrategyScore;
  wrapMortgage: StrategyScore;
  adu: StrategyScore;
  lotSplit: StrategyScore;
  mixedUseConversion: StrategyScore;
  commercialRepositioning: StrategyScore;
  development: StrategyScore;
  exchange1031: StrategyScore;
}

type StrategyKey = keyof StrategyFitResults;

type StrategyMetadata = Pick<
  StrategyScore,
  "requiredInputs" | "assumptions" | "verificationQuestions" | "successCriteria" | "whatMustBeTrue" | "failureScenarios"
>;

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

const STRATEGY_METADATA: Record<StrategyKey, StrategyMetadata> = {
  buyAndHold: {
    requiredInputs: ["Purchase price", "Rent", "Taxes", "Insurance", "Financing terms", "Vacancy", "Maintenance", "Exit assumptions"],
    assumptions: ["Income is durable", "Operating expenses are complete", "Debt terms remain serviceable", "Hold period is long enough for compounding"],
    verificationQuestions: ["Is market rent supported by comps?", "Are taxes and insurance verified?", "Does the deal survive conservative vacancy?", "Is the property financeable and insurable?"],
    successCriteria: ["Positive risk-adjusted cash flow", "DSCR above target", "Reasonable cap rate", "Durable location demand", "Manageable maintenance burden"],
    whatMustBeTrue: ["Rent and expenses must be accurate", "Debt service must remain affordable", "The property must not require surprise capital beyond reserves"],
    failureScenarios: ["Negative cash flow after true expenses", "Insurance or tax shock", "Major deferred maintenance", "Weak tenant demand"],
  },
  brrrr: {
    requiredInputs: ["Purchase price", "Rehab scope", "Rehab budget", "ARV", "Rent", "Refinance LTV", "Refinance rate", "Timeline"],
    assumptions: ["ARV is supported by comps", "Rehab budget includes contingency", "Refinance lender accepts stabilized value", "Rent supports DSCR after refinance"],
    verificationQuestions: ["Are contractor bids itemized?", "Are ARV comps recent and similar?", "What refinance LTV and seasoning rules apply?", "Does cash-out return enough capital?"],
    successCriteria: ["Meaningful equity creation", "Refinance proceeds recover capital", "Post-refi DSCR clears lender threshold", "Rehab timeline is controllable"],
    whatMustBeTrue: ["ARV spread must be real", "Scope must not expand materially", "Rent must support takeout financing"],
    failureScenarios: ["ARV misses", "Rehab overruns", "Delayed refinance", "Post-rehab rent is too low", "Capital remains trapped"],
  },
  hybridBrrrr: {
    requiredInputs: ["Purchase price", "Phase-one rehab", "Future rehab", "Current rent", "Stabilized rent", "ARV", "Refinance timing"],
    assumptions: ["Phased scope reduces execution risk", "Value can be created before full stabilization", "Capital plan supports a delayed refinance"],
    verificationQuestions: ["Which scope is required before rent-up?", "What can wait?", "How long can capital remain tied up?", "Does partial stabilization support lender review?"],
    successCriteria: ["Lower initial capital stress", "Clear phase gates", "Improving valuation after each phase", "Refinance optionality preserved"],
    whatMustBeTrue: ["The property can operate during phases", "Deferred scope does not create safety or insurance issues", "The lender accepts the stabilization path"],
    failureScenarios: ["Phase-one scope is underestimated", "Tenant disruption", "Refinance delayed", "Capital plan becomes underfunded"],
  },
  longTermRental: {
    requiredInputs: ["Market rent", "Lease assumptions", "Taxes", "Insurance", "Repairs", "Vacancy", "Management", "Debt terms"],
    assumptions: ["Tenant demand is stable", "Rent estimate is realistic", "Operating expenses are recurring and complete"],
    verificationQuestions: ["Are rent comps current?", "What is local vacancy?", "Are tenant-paid utilities confirmed?", "Does DSCR survive stress case?"],
    successCriteria: ["Stable monthly cash flow", "DSCR above threshold", "Rent growth supports expense growth", "Low operational complexity"],
    whatMustBeTrue: ["Rent must be achievable", "Expenses must not be understated", "Property condition must support leasing"],
    failureScenarios: ["Vacancy rises", "Repairs exceed reserves", "Rent is overstated", "Debt service consumes cash flow"],
  },
  midTermRental: {
    requiredInputs: ["Furnished rent", "Occupancy", "Cleaning/turn costs", "Utilities", "Local demand drivers", "Regulations"],
    assumptions: ["Monthly-stay demand exists", "Furnished premium offsets operating burden", "Regulations allow intended use"],
    verificationQuestions: ["Who is the target tenant?", "Are hospitals, employers, or relocation drivers nearby?", "What are furnishing and utility costs?", "Are stays legally allowed?"],
    successCriteria: ["Premium rent after added expenses", "Reliable occupancy", "Low turnover friction", "Regulatory fit"],
    whatMustBeTrue: ["Demand must be verified beyond optimism", "Operating costs must be included", "Regulations must permit the use"],
    failureScenarios: ["Occupancy misses", "Furnishing costs run high", "Regulatory restriction", "Management burden exceeds expectations"],
  },
  shortTermRental: {
    requiredInputs: ["ADR", "Occupancy", "Seasonality", "Cleaning", "Platform fees", "Furnishing", "STR regulations", "Insurance"],
    assumptions: ["Short-term rental is legal", "ADR and occupancy are supported", "Guest operations are manageable"],
    verificationQuestions: ["Is STR allowed by city, HOA, and zoning?", "What are true seasonal occupancy rates?", "What insurance is required?", "Are comparable STRs actually performing?"],
    successCriteria: ["Strong net operating income after all STR costs", "Regulatory clearance", "Demand resilience", "Professional operations plan"],
    whatMustBeTrue: ["STR must be legally allowed", "ADR and occupancy must be evidence-backed", "Insurance and management costs must be included"],
    failureScenarios: ["Regulation changes", "Seasonality crushes occupancy", "Guest damage/operations issues", "ADR optimism"],
  },
  hybridRental: {
    requiredInputs: ["LTR rent", "STR/MTR income", "Seasonality", "Regulations", "Operating costs", "Fallback rent"],
    assumptions: ["Multiple rental paths are available", "Fallback LTR protects downside", "Operational complexity is acceptable"],
    verificationQuestions: ["What is the fallback rent if STR/MTR fails?", "Can the property switch uses quickly?", "Do regulations allow both paths?"],
    successCriteria: ["Higher upside with credible fallback", "Regulatory flexibility", "Operational plan supports mode switching"],
    whatMustBeTrue: ["Fallback LTR must protect downside", "Use changes must be legal", "Furnished operations must be budgeted"],
    failureScenarios: ["Both demand channels underperform", "Regulatory restriction", "Operating complexity overwhelms returns"],
  },
  houseHack: {
    requiredInputs: ["Owner housing cost", "Unit/room rent", "Financing type", "Personal budget", "Privacy/lifestyle constraints"],
    assumptions: ["User can tolerate shared or nearby tenancy", "Owner-occupant financing is available", "Rental income offsets housing cost"],
    verificationQuestions: ["What is the real out-of-pocket monthly cost?", "Can units/rooms be legally rented?", "Does the layout support privacy?", "What happens if a tenant leaves?"],
    successCriteria: ["Lower net housing cost", "Financeable property", "Acceptable life impact", "Clear tenantability"],
    whatMustBeTrue: ["The user must be comfortable living with the strategy", "Rent must materially offset ownership cost", "Layout must support tenancy"],
    failureScenarios: ["Tenant vacancy", "Lifestyle stress", "Financing mismatch", "Unexpected repairs while owner-occupied"],
  },
  fixFlip: {
    requiredInputs: ["Purchase price", "ARV", "Rehab budget", "Carry costs", "Selling costs", "Timeline", "Exit comps"],
    assumptions: ["ARV comps are valid", "Scope and timeline are controlled", "Market remains liquid through resale"],
    verificationQuestions: ["Are ARV comps recent and truly comparable?", "What are carry costs per month?", "Are permits required?", "What is the minimum acceptable profit?"],
    successCriteria: ["Large enough resale spread", "Controlled scope", "Fast liquidity", "Profit survives high rehab and slow sale scenarios"],
    whatMustBeTrue: ["ARV must hold", "Rehab cannot overrun materially", "Resale demand must exist"],
    failureScenarios: ["ARV misses", "Scope creep", "Permit delay", "Market softens", "Carrying costs erase profit"],
  },
  valueAdd: {
    requiredInputs: ["Current NOI/rent", "Post-improvement NOI/rent", "Scope", "Budget", "Timeline", "Exit value"],
    assumptions: ["Improvements translate to income or value", "Scope is achievable", "Tenants/market accept repositioning"],
    verificationQuestions: ["What exact improvement creates value?", "How is the rent lift supported?", "Can work be done while occupied?", "What is the payback period?"],
    successCriteria: ["Clear ROI on improvements", "Income lift verified", "Manageable disruption", "Value increases more than cost"],
    whatMustBeTrue: ["The market must reward the improvement", "Budget must be controlled", "Rent/value lift must be evidence-backed"],
    failureScenarios: ["Improvement does not increase rent/value", "Tenant disruption", "Budget overrun", "Over-improvement for market"],
  },
  appreciationHold: {
    requiredInputs: ["Market appreciation trend", "Inventory", "Demand drivers", "Cash flow", "Hold period", "Liquidity reserves"],
    assumptions: ["Market growth can compensate for lower current yield", "User can hold through volatility", "Cash flow does not create distress"],
    verificationQuestions: ["What demand driver supports appreciation?", "Can the user carry the property if appreciation stalls?", "Is the price already above trend?"],
    successCriteria: ["Strong location fundamentals", "Affordable carry", "Long enough hold period", "Optionality to rent/sell/refi"],
    whatMustBeTrue: ["Growth thesis must be evidence-backed", "Cash flow cannot force a bad sale", "Hold period must match strategy"],
    failureScenarios: ["Flat market", "Negative carry", "Liquidity need forces sale", "Local demand weakens"],
  },
  refinance: {
    requiredInputs: ["Current loan", "Current value", "New rate", "New terms", "Closing costs", "DSCR", "Equity"],
    assumptions: ["Value and income support lender terms", "Rate/term improvement offsets closing costs", "Cash-out does not overleverage asset"],
    verificationQuestions: ["What loan terms are actually available?", "Does DSCR clear lender threshold?", "What is break-even on closing costs?", "How much reserve remains after refinance?"],
    successCriteria: ["Improved cash flow or risk profile", "Acceptable DSCR", "Reasonable leverage", "Clear use of proceeds"],
    whatMustBeTrue: ["Appraised value must support terms", "New debt must be safer or strategically useful", "Closing costs must be justified"],
    failureScenarios: ["Appraisal shortfall", "Higher payment", "Overleverage", "Rate changes before lock"],
  },
  hold: {
    requiredInputs: ["Current performance", "Market outlook", "Debt terms", "Maintenance needs", "Opportunity cost"],
    assumptions: ["Current asset remains competitive", "Holding beats available alternatives", "Risks are manageable"],
    verificationQuestions: ["What is the opportunity cost of keeping capital here?", "Are repairs or capex coming?", "Does the asset still fit the portfolio?"],
    successCriteria: ["Stable or improving performance", "Risk-adjusted return beats alternatives", "No near-term forced liquidity need"],
    whatMustBeTrue: ["Future risk must be tolerable", "Capital must not have a clearly better use", "Asset performance must justify attention"],
    failureScenarios: ["Deferred capex spike", "Market decline", "Better redeployment missed", "Debt reset risk"],
  },
  sell: {
    requiredInputs: ["Current value", "Loan payoff", "Selling costs", "Tax impact", "Redeployment options", "Market liquidity"],
    assumptions: ["Net proceeds can be redeployed better", "Market liquidity supports sale", "Tax consequences are understood"],
    verificationQuestions: ["What are true net proceeds?", "What taxes apply?", "What will proceeds buy next?", "Is market timing favorable?"],
    successCriteria: ["Clear net proceeds", "Better alternative use of capital", "Risk reduction or strategic upgrade"],
    whatMustBeTrue: ["Net proceeds must be known", "Redeployment plan must exist", "Tax impact must not erase benefit"],
    failureScenarios: ["Low sale price", "Tax surprise", "No better redeployment", "Transaction costs too high"],
  },
  sellerFinance: {
    requiredInputs: ["Seller note terms", "Down payment", "Rate", "Amortization", "Balloon", "Default terms", "Legal docs"],
    assumptions: ["Seller terms improve feasibility", "Legal structure is enforceable", "Balloon/refinance risk is manageable"],
    verificationQuestions: ["Who drafts/reviews the note?", "Is there a balloon?", "Can the deal refinance before maturity?", "What happens on default?"],
    successCriteria: ["Better terms than market debt", "Clear legal documentation", "Manageable balloon risk", "Cash flow supports note"],
    whatMustBeTrue: ["Terms must be legally reviewed", "Payment must fit cash flow", "Exit/refinance before balloon must be credible"],
    failureScenarios: ["Balloon cannot be refinanced", "Ambiguous documents", "Seller default dispute", "Payment exceeds cash flow"],
  },
  subjectTo: {
    requiredInputs: ["Existing loan terms", "Due-on-sale risk", "Payment status", "Insurance", "Title", "Legal structure"],
    assumptions: ["Existing debt can be serviced", "Legal and lender risks are understood", "Title/insurance can be handled properly"],
    verificationQuestions: ["What is the due-on-sale risk?", "Is the loan current?", "Who remains liable?", "Can insurance and title be structured correctly?"],
    successCriteria: ["Attractive existing debt", "Professional legal review", "Clear payment control", "Exit plan"],
    whatMustBeTrue: ["Loan must remain serviceable", "Legal structure must be professionally reviewed", "Seller and buyer obligations must be explicit"],
    failureScenarios: ["Due-on-sale acceleration", "Seller liability dispute", "Insurance/title issue", "Payment default"],
  },
  leaseOption: {
    requiredInputs: ["Lease terms", "Option price", "Option fee", "Term length", "Maintenance responsibility", "Exit plan"],
    assumptions: ["Control has value without immediate ownership", "Option price is favorable", "Lease terms protect downside"],
    verificationQuestions: ["Is the option enforceable?", "Who pays repairs?", "What happens if financing is unavailable?", "Is the option price below expected value?"],
    successCriteria: ["Low upfront risk", "Clear option upside", "Financeable exit", "Protective contract terms"],
    whatMustBeTrue: ["Option terms must be enforceable", "Exit financing must be plausible", "Control period must be long enough"],
    failureScenarios: ["Cannot exercise option", "Repair burden too high", "Value does not rise", "Contract ambiguity"],
  },
  wrapMortgage: {
    requiredInputs: ["Underlying loan", "Wrap terms", "Payment spread", "Legal docs", "Due-on-sale risk", "Default remedies"],
    assumptions: ["Payment spread compensates risk", "Underlying loan remains current", "Legal structure is enforceable"],
    verificationQuestions: ["How is the underlying loan paid?", "What are default remedies?", "Is due-on-sale risk addressed?", "Who verifies payment flow?"],
    successCriteria: ["Clear spread", "Documented payment controls", "Professional legal review", "Manageable default risk"],
    whatMustBeTrue: ["Underlying debt must be protected", "Buyer payments must reliably cover obligations", "Legal review must be complete"],
    failureScenarios: ["Underlying default", "Due-on-sale issue", "Payment dispute", "Unclear lien position"],
  },
  adu: {
    requiredInputs: ["Zoning", "Permits", "Build cost", "Rent", "Utility access", "Timeline", "Financing"],
    assumptions: ["ADU is legal and buildable", "Rent/value lift exceeds cost", "Utilities/site conditions support construction"],
    verificationQuestions: ["Is ADU allowed by zoning?", "What permits are required?", "Are utilities sufficient?", "What is the realistic build cost?"],
    successCriteria: ["Permit feasibility", "Strong cost-to-income/value ratio", "Manageable timeline", "Financeable scope"],
    whatMustBeTrue: ["ADU must be legally allowed", "Cost must be verified", "Rent/value increase must be supported"],
    failureScenarios: ["Permit denial", "Utility constraint", "Construction overrun", "Rent premium misses"],
  },
  lotSplit: {
    requiredInputs: ["Zoning", "Lot dimensions", "Survey", "Utility access", "Entitlement timeline", "Sale/build value"],
    assumptions: ["Subdivision is legally possible", "Resulting parcels are marketable", "Entitlement cost/timeline is manageable"],
    verificationQuestions: ["Does zoning allow split?", "Are minimum lot sizes met?", "What utilities are needed?", "Who buys or builds the new parcel?"],
    successCriteria: ["Clear entitlement path", "Marketable resulting lots", "Value exceeds split and carry costs"],
    whatMustBeTrue: ["Zoning and survey must support split", "Utility access must be feasible", "Exit demand must exist"],
    failureScenarios: ["Entitlement denial", "Survey constraint", "Utility cost shock", "No buyer for split parcel"],
  },
  mixedUseConversion: {
    requiredInputs: ["Zoning", "Current use", "Proposed use", "Tenant demand", "Conversion cost", "Permits", "Lease/rent assumptions"],
    assumptions: ["Use change is legal", "Demand supports the new mix", "Conversion cost is controlled"],
    verificationQuestions: ["Is the proposed use allowed?", "What code upgrades apply?", "Who is the target tenant/user?", "What permits and timeline are required?"],
    successCriteria: ["Legal use conversion", "Verified demand", "Income/value lift exceeds cost", "Manageable compliance burden"],
    whatMustBeTrue: ["Zoning/code must allow conversion", "Demand must be evidence-backed", "Cost/timeline must be financeable"],
    failureScenarios: ["Use denied", "Code upgrade shock", "Tenant demand misses", "Conversion delays"],
  },
  commercialRepositioning: {
    requiredInputs: ["Current NOI", "Lease terms", "Tenant demand", "Capex", "Market rents", "Exit cap", "Financing"],
    assumptions: ["NOI can be improved", "Tenant market supports repositioning", "Exit value follows stabilized income"],
    verificationQuestions: ["What leases roll and when?", "What tenant demand exists?", "What capex is required?", "What exit cap is defensible?"],
    successCriteria: ["NOI growth", "Lease-up feasibility", "Capex discipline", "Exit valuation support"],
    whatMustBeTrue: ["Tenant demand must exist", "Lease and capex assumptions must be verified", "Exit cap must be realistic"],
    failureScenarios: ["Lease-up misses", "Capex overrun", "Exit cap expands", "Tenant credit risk"],
  },
  development: {
    requiredInputs: ["Land/control cost", "Entitlements", "Hard costs", "Soft costs", "Timeline", "Financing", "Exit value", "Contingency"],
    assumptions: ["Entitlements are achievable", "Budget includes contingency", "Market demand exists at delivery", "Financing covers carry and overruns"],
    verificationQuestions: ["What approvals are required?", "What is the guaranteed maximum price?", "What is the delivery timeline?", "Who is the exit buyer/tenant?"],
    successCriteria: ["Entitlement path", "Adequate contingency", "Strong exit demand", "Financing and reserves for delays"],
    whatMustBeTrue: ["Approvals must be achievable", "Costs must be controlled", "Exit demand must survive delivery timing"],
    failureScenarios: ["Entitlement failure", "Cost escalation", "Financing gap", "Market changes before delivery"],
  },
  exchange1031: {
    requiredInputs: ["Relinquished asset basis", "Sale proceeds", "Debt replacement", "Identification timeline", "Replacement options", "CPA/QI review"],
    assumptions: ["Exchange rules can be satisfied", "Replacement asset improves portfolio", "Tax deferral is worth constraints"],
    verificationQuestions: ["Has a qualified intermediary been engaged?", "Can debt/equity replacement rules be met?", "Are deadlines realistic?", "Does replacement improve risk-adjusted outcome?"],
    successCriteria: ["Compliant timeline", "Suitable replacement asset", "Tax deferral preserved", "Portfolio improves after exchange"],
    whatMustBeTrue: ["Professional tax/QI review must occur", "Replacement asset must be better than holding cash", "Deadlines must be met"],
    failureScenarios: ["Missed identification deadline", "Failed closing", "Boot/tax surprise", "Forced into weak replacement asset"],
  },
};

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

  const buyAndHoldScore = Math.round(ltrScore * 0.55 + ahScore * 0.25 + vaScore * 0.2);
  const hybridBrrrrScore = Math.round(brrrrScore * 0.7 + vaScore * 0.3);
  const hybridRentalScore = Math.round(Math.max(ltrScore, mtrScore, strScore) * 0.55 + (ltrScore + mtrScore + strScore) / 3 * 0.45);
  const houseHackScore = Math.round(ltrScore * 0.65 + normalize(cf, -500, 300) * 0.2 + crimeAdjust * 0.15);
  const refinanceScore = Math.round(normalize(arvSpread, 0, 0.35) * 0.35 + normalize(cf, -200, 500) * 0.35 + normalize(coc, 0, 0.12) * 0.3);
  const holdScore = Math.round(ltrScore * 0.45 + ahScore * 0.35 + normalize(cf, -300, 300) * 0.2);
  const sellScore = Math.round((100 - holdScore) * 0.5 + normalize(arvSpread, 0, 0.35) * 0.25 + inventoryScore * 0.25);
  const sellerFinanceScore = Math.round(ltrScore * 0.45 + normalize(cf, -200, 500) * 0.25 + normalize(pp > 0 ? rent * 12 / pp : 0, 0.04, 0.14) * 0.3);
  const subjectToScore = Math.round(sellerFinanceScore * 0.6 + normalize(cf, -200, 500) * 0.25 + (negativeCashFlow ? 0 : 15));
  const leaseOptionScore = Math.round(ahScore * 0.4 + vaScore * 0.3 + normalize(arvSpread, 0, 0.25) * 0.3);
  const wrapMortgageScore = Math.round(sellerFinanceScore * 0.75 + normalize(cf, -200, 500) * 0.25);
  const aduScore = Math.round(vaScore * 0.5 + ltrScore * 0.25 + normalize(arvSpread, 0, 0.3) * 0.25);
  const lotSplitScore = Math.round(ahScore * 0.45 + vaScore * 0.25 + inventoryScore * 0.3);
  const mixedUseConversionScore = Math.round(vaScore * 0.4 + commercialScore(ltrScore, ahScore, inventoryScore) * 0.35 + priceTrendScore * 0.25);
  const commercialRepositioningScore = Math.round(vaScore * 0.45 + commercialScore(ltrScore, ahScore, inventoryScore) * 0.4 + priceTrendScore * 0.15);
  const developmentScore = Math.round(normalize(arvSpread, 0.1, 0.6) * 0.35 + priceTrendScore * 0.25 + inventoryScore * 0.25 + normalize(rehab, 0, pp * 0.6 || 1) * 0.15);
  const exchange1031Score = Math.round(holdScore * 0.35 + ltrScore * 0.25 + ahScore * 0.25 + normalize(cf, -200, 500) * 0.15);

  function commercialScore(a: number, b: number, c: number) {
    return clamp(Math.round(a * 0.35 + b * 0.35 + c * 0.3), 0, 100);
  }

  function withMeta(key: StrategyKey, score: Omit<StrategyScore, keyof StrategyMetadata>): StrategyScore {
    return { ...score, ...STRATEGY_METADATA[key] };
  }

  function standardScore(key: StrategyKey, score: number, explanation: string, disqualifiers: string[] = []): StrategyScore {
    return withMeta(key, {
      score: clamp(score, 0, 100),
      fitLevel: fitLevel(score),
      confidenceLevel: confidenceLevel(score),
      disqualifiers,
      signals,
      explanation,
    });
  }

  return {
    buyAndHold: standardScore(
      "buyAndHold",
      buyAndHoldScore,
      buyAndHoldScore >= 80
        ? "Strong blend of income durability, hold optionality, and long-term value support."
        : buyAndHoldScore >= 60
          ? "Moderate buy-and-hold fit; verify cash flow, reserves, and long-term demand."
          : "Weak buy-and-hold fit based on current income, risk, or value signals.",
      pickDisqualifiers(["Negative monthly cash flow", "Elevated crime signal", "Soft price trend"]),
    ),
    brrrr: withMeta("brrrr", {
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
    }),
    hybridBrrrr: standardScore(
      "hybridBrrrr",
      hybridBrrrrScore,
      hybridBrrrrScore >= 80
        ? "Strong phased BRRRR fit; value-add and refinance potential appear aligned."
        : hybridBrrrrScore >= 60
          ? "Moderate hybrid BRRRR fit; phase scope, rent-up, and refinance timing need verification."
          : "Weak hybrid BRRRR fit; staged execution may not solve margin or refinance risk.",
      brrrrDQ,
    ),
    longTermRental: withMeta("longTermRental", {
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
    }),
    midTermRental: withMeta("midTermRental", {
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
    }),
    shortTermRental: withMeta("shortTermRental", {
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
    }),
    hybridRental: standardScore(
      "hybridRental",
      hybridRentalScore,
      hybridRentalScore >= 80
        ? "Strong rental flexibility; multiple income paths appear plausible."
        : hybridRentalScore >= 60
          ? "Moderate hybrid rental fit; verify fallback rent and operating complexity."
          : "Weak hybrid rental fit; available income paths do not yet support the added complexity.",
      [...new Set([...ltrDQ, ...mtrDQ, ...strDQ])].slice(0, 3),
    ),
    houseHack: standardScore(
      "houseHack",
      houseHackScore,
      houseHackScore >= 80
        ? "Strong house-hack fit if the life impact is acceptable."
        : houseHackScore >= 60
          ? "Moderate house-hack fit; personal budget, layout, and tenantability need review."
          : "Weak house-hack fit based on current affordability or rental-offset signals.",
      ltrDQ,
    ),
    fixFlip: withMeta("fixFlip", {
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
    }),
    valueAdd: withMeta("valueAdd", {
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
    }),
    appreciationHold: withMeta("appreciationHold", {
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
    }),
    refinance: standardScore("refinance", refinanceScore, refinanceScore >= 80 ? "Strong refinance potential based on equity and cash-flow support." : refinanceScore >= 60 ? "Moderate refinance fit; lender terms, appraisal, and closing costs need verification." : "Weak refinance fit until value, DSCR, or terms improve.", pickDisqualifiers(["Negative monthly cash flow", "Thin ARV spread"])),
    hold: standardScore("hold", holdScore, holdScore >= 80 ? "Holding appears defensible based on current performance and market support." : holdScore >= 60 ? "Holding is plausible; compare opportunity cost and upcoming capital needs." : "Hold case is weak; review sell, refinance, or reposition alternatives.", ahDQ),
    sell: standardScore("sell", sellScore, sellScore >= 80 ? "Sell should be investigated because hold economics or risks appear weak." : sellScore >= 60 ? "Sale may be a reasonable alternative depending on net proceeds and tax impact." : "Sell is not clearly favored by current signals.", pickDisqualifiers(["Soft price trend", "Negative monthly cash flow"])),
    sellerFinance: standardScore("sellerFinance", sellerFinanceScore, sellerFinanceScore >= 80 ? "Seller finance may improve acquisition feasibility if terms are professionally documented." : sellerFinanceScore >= 60 ? "Seller finance could help, but payment terms, balloon risk, and legal review drive viability." : "Seller finance does not appear to solve the deal constraints yet.", ltrDQ),
    subjectTo: standardScore("subjectTo", subjectToScore, subjectToScore >= 80 ? "Subject-to may be worth professional review if existing debt is attractive and cash flow supports payments." : subjectToScore >= 60 ? "Subject-to is possible but legal, insurance, title, and due-on-sale risks are material." : "Subject-to is weak or too risky based on current economics.", ltrDQ),
    leaseOption: standardScore("leaseOption", leaseOptionScore, leaseOptionScore >= 80 ? "Lease option may create attractive control with limited upfront capital." : leaseOptionScore >= 60 ? "Lease option may fit if option terms, financing exit, and repair duties are favorable." : "Lease option does not yet show enough upside or control value.", ahDQ),
    wrapMortgage: standardScore("wrapMortgage", wrapMortgageScore, wrapMortgageScore >= 80 ? "Wrap structure may work if payment spread and legal controls are strong." : wrapMortgageScore >= 60 ? "Wrap mortgage requires professional review; default and underlying-loan risk drive the decision." : "Wrap mortgage appears weak without better payment spread or cash-flow support.", ltrDQ),
    adu: standardScore("adu", aduScore, aduScore >= 80 ? "ADU potential appears strong if zoning, utilities, and build costs verify." : aduScore >= 60 ? "ADU is worth investigating; permitting, utilities, and rent lift are the gating facts." : "ADU value is not supported enough by current signals.", vaDQ),
    lotSplit: standardScore("lotSplit", lotSplitScore, lotSplitScore >= 80 ? "Lot split may create value if zoning and utility access verify." : lotSplitScore >= 60 ? "Lot split is investigable; entitlement and survey constraints drive confidence." : "Lot split appears weak without stronger entitlement or market evidence.", ahDQ),
    mixedUseConversion: standardScore("mixedUseConversion", mixedUseConversionScore, mixedUseConversionScore >= 80 ? "Mixed-use conversion may be attractive if use, code, and demand are verified." : mixedUseConversionScore >= 60 ? "Mixed-use conversion needs deeper zoning, cost, and tenant-demand diligence." : "Mixed-use conversion is weak or too uncertain on current data.", vaDQ),
    commercialRepositioning: standardScore("commercialRepositioning", commercialRepositioningScore, commercialRepositioningScore >= 80 ? "Commercial repositioning shows strong upside if tenant demand and capex validate." : commercialRepositioningScore >= 60 ? "Commercial repositioning is plausible but depends on lease-up, capex, and exit cap support." : "Commercial repositioning lacks enough support from current data.", vaDQ),
    development: standardScore("development", developmentScore, developmentScore >= 80 ? "Development may be worth advanced diligence if entitlement and cost assumptions verify." : developmentScore >= 60 ? "Development is possible but high-risk; entitlement, budget, financing, and exit must be verified." : "Development is not supported enough by current data.", pickDisqualifiers(["High rehab burden", "Soft price trend", "Thin ARV spread"])),
    exchange1031: standardScore("exchange1031", exchange1031Score, exchange1031Score >= 80 ? "1031 exchange fit may be strong if replacement improves portfolio quality and tax rules are met." : exchange1031Score >= 60 ? "1031 exchange should be modeled with CPA/QI review and replacement-asset comparison." : "1031 exchange is not clearly advantageous from current deal signals.", ahDQ),
  };
}

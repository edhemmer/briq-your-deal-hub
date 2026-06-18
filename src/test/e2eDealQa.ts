import { buildNormalizedDealState, enrichWithMarketData, evaluateInputSufficiency } from "@/lib/normalizedDealState";
import { runCanonicalAnalysis } from "@/lib/canonicalEngineLayer";
import { evaluateResidentialDecision } from "@/lib/residentialDecisionEngine";
import { calculateVerifiedAnnualTax, evaluateTrustGate } from "@/lib/sourceVerificationEngine";
import { mergePublicRecordData } from "@/lib/publicRecordResolver";
import { normalizeListingData } from "@/lib/listingDataNormalizer";
import { detectPropertyConflicts } from "@/lib/propertyConflictDetector";
import { resolvePropertyForAnalysis } from "@/lib/analysisDataResolver";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

const listingOnlyDeal = {
  id: "qa-zillow-united-ave",
  user_id: "qa-user",
  created_at: new Date().toISOString(),
  property_address: "1147 United Ave SE",
  city: "Atlanta",
  state: "GA",
  zip_code: "30316",
  property_type: "Duplex",
  purchase_price: null,
  closing_costs: 0,
  rehab_cost: 0,
  rehab_contingency: 0,
  down_payment_percent: 0.25,
  interest_rate: 0.0725,
  loan_term_years: 30,
  monthly_rent: 0,
  other_income: 0,
  taxes: 0,
  insurance: 0,
  vacancy_percent: 0.08,
  maintenance_percent: 0.08,
  management_percent: 0.08,
  capex_percent: 0.06,
  arv: 0,
  assessed_value: null,
  annual_property_tax: null,
  year_built: null,
  lot_size: null,
  zoning_type: null,
  property_record_url: null,
  deal_status: "draft",
  strategy_primary: "Buy & Hold",
};

const provisionalDeal = {
  ...listingOnlyDeal,
  purchase_price: 455000,
  monthly_rent: 1349,
  taxes: 5643,
  annual_property_tax: 5643,
  insurance: 3000,
  arv: 452000,
  assessed_value: 170440,
  year_built: 1930,
  property_record_url: "https://qpublic.schneidercorp.com/",
};

const marketRow = {
  median_rent: 1349,
  rent_growth_12mo: 2.5,
  rent_growth_36mo: 10,
  median_home_price: 452000,
  price_growth_12mo: 2,
  price_growth_36mo: 12,
  price_per_sqft: 0,
  inventory_level: 4,
  months_of_supply: 3.8,
  days_on_market: 35,
  sale_to_list_ratio: 0.98,
  absorption_rate: 26,
  population_growth_rate: 1.1,
  job_growth_rate: 1.4,
  crime_score: 5.5,
};

const context = {
  marketType: "us_residential",
  assetType: "small_multifamily",
  strategy: "long_term_rental",
  riskTolerance: "conservative",
} as const;

const listingState = buildNormalizedDealState(listingOnlyDeal);
const listingSufficiency = evaluateInputSufficiency({
  purchase_price: listingOnlyDeal.purchase_price,
  monthly_rent: listingOnlyDeal.monthly_rent,
  arv: listingOnlyDeal.arv,
  interest_rate: listingOnlyDeal.interest_rate,
  loan_term_years: listingOnlyDeal.loan_term_years,
  down_payment_percent: listingOnlyDeal.down_payment_percent,
  taxes: listingOnlyDeal.taxes,
  insurance: listingOnlyDeal.insurance,
}, { hasAnyMarketFields: false });

const state = enrichWithMarketData(buildNormalizedDealState(provisionalDeal), marketRow);
const output = runCanonicalAnalysis(state, context, {
  fieldSources: {
    purchase_price: "listing",
    monthly_rent: "listing",
    taxes: "official",
    insurance: "user_reported",
  },
});

const rawProperty = mergePublicRecordData(normalizeListingData({
  address: provisionalDeal.property_address,
  price: provisionalDeal.purchase_price,
  rent: provisionalDeal.monthly_rent,
  taxes: provisionalDeal.taxes,
  yearBuilt: provisionalDeal.year_built,
}), {
  annualPropertyTax: provisionalDeal.annual_property_tax,
  yearBuilt: provisionalDeal.year_built,
});
const resolved = resolvePropertyForAnalysis(rawProperty);
const conflicts = detectPropertyConflicts(rawProperty);
const verifiedTax = calculateVerifiedAnnualTax({ year1: 6978, year2: 4386, year3: 5564 }, provisionalDeal.annual_property_tax);
const trustGate = evaluateTrustGate({
  resolved,
  tax: verifiedTax,
  hiddenRisks: output.hiddenRisks,
  hasCountyRecordUrl: true,
  hasMarketData: true,
  hasRentData: true,
  hasInsurance: true,
});
const residential = evaluateResidentialDecision({
  dealInput: output.dealInput,
  analysis: output.analysis,
  marketIntelligence: output.marketIntelligence,
  hiddenRisks: output.hiddenRisks,
  holdPeriodYears: 10,
  priceGrowthAnnual: marketRow.price_growth_12mo / 100,
  rentGrowthAnnual: marketRow.rent_growth_12mo / 100,
  assessedValue: provisionalDeal.assessed_value,
  annualPropertyTax: provisionalDeal.annual_property_tax,
  yearBuilt: provisionalDeal.year_built,
});

const summary = {
  fixture: "Zillow search-result fixture: 1147 United Ave SE, Atlanta, GA 30316, duplex/multifamily",
  listingOnly: {
    canAnalyze: listingSufficiency.canAnalyze,
    missingFields: listingSufficiency.missingFields,
  },
  provisionalAssumptions: {
    purchasePrice: fmt(provisionalDeal.purchase_price),
    monthlyRent: fmt(provisionalDeal.monthly_rent),
    annualTaxes: fmt(provisionalDeal.taxes),
    insurance: fmt(provisionalDeal.insurance),
    taxBasis: "Zillow public tax history average: 2024 $6,978, 2023 $4,386, 2022 $5,564",
    rentBasis: "Zillow Rent Zestimate $1,349/mo; actual rent roll not exposed in public search result",
    investorRisk: "moderate-to-low / conservative context",
  },
  math: {
    monthlyPayment: fmt(output.analysis.financing.monthly_payment),
    noi: fmt(output.analysis.metrics.noi),
    monthlyCashFlow: fmt(output.analysis.metrics.monthly_cashflow),
    capRate: pct(output.analysis.metrics.cap_rate),
    cashOnCash: pct(output.analysis.metrics.cash_on_cash),
    dscr: `${output.analysis.metrics.dscr.toFixed(2)}x`,
    initialCashRequired: fmt(output.analysis.metrics.initial_cash_required),
  },
  decision: {
    dealScore: output.intelligence.score,
    decision: output.intelligence.decision,
    guidance: output.dealGuidance.guidance,
    trustStatus: trustGate.status,
    trustScore: trustGate.score,
    trustBlockers: trustGate.blockers,
    trustWarnings: trustGate.warnings,
    hiddenRiskFlags: output.hiddenRisks.flags.map((flag) => flag.title),
    residentialScore: residential.score,
    residentialVerdict: residential.verdict,
  },
  flowFindings: {
    conflicts: conflicts.length,
    reportLanguage: trustGate.reportLanguage,
    plainEnglishVerdict: output.analysis.metrics.monthly_cashflow < 0 || output.analysis.metrics.dscr < 1.15
      ? "Lose / pass for a conservative investor unless price, rent, financing, or verified tax basis materially improves."
      : "Potential win, but only after source blockers are cleared.",
  },
};

console.log(JSON.stringify(summary, null, 2));

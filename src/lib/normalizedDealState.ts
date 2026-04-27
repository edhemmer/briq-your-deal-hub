/**
 * BRIX v1.5.2 — Canonical Normalized Deal State
 * 
 * Single source of truth for downstream calculations.
 * Clearly distinguishes sourced, user-entered, and unavailable values.
 * 
 * Architecture direction:
 *   dataSourceLayer → normalizedDealState → canonical engines → UI
 * 
 * v1.5.2: Added enriched property, rent range, and financing range fields.
 * All data flows through canonical resolvers before reaching this state.
 * 
 * This is the migration target for future engine rewiring.
 * Do not create competing state systems.
 */

import type { SourcedValue } from "./dataSourceLayer";
import { userValue, unavailableValue, marketValue, hasValue } from "./dataSourceLayer";
import { getPropertyData } from "./resolvers/propertyDataResolver";
import { getRentData } from "./resolvers/rentDataResolver";
import { getFinancingData } from "./resolvers/financingDataResolver";

// ── Normalized Deal State ──────────────────────────────────────────────

export interface NormalizedDealState {
  property: {
    address: SourcedValue<string>;
    city: SourcedValue<string>;
    state: SourcedValue<string>;
    zipCode: SourcedValue<string | null>;
    propertyType: SourcedValue<string | null>;
    yearBuilt: SourcedValue<number | null>;
    squareFootage: SourcedValue<number | null>;
    lotSize: SourcedValue<string | null>;
    zoningType: SourcedValue<string | null>;
    assessedValue: SourcedValue<number | null>;
    annualPropertyTax: SourcedValue<number | null>;
    propertyRecordUrl: SourcedValue<string | null>;
  };
  rent: {
    monthlyRent: SourcedValue<number>;
    otherIncome: SourcedValue<number>;
    estimatedRentLow: SourcedValue<number | null>;
    estimatedRentMedian: SourcedValue<number | null>;
    estimatedRentHigh: SourcedValue<number | null>;
    rentPerSqft: SourcedValue<number | null>;
  };
  financing: {
    purchasePrice: SourcedValue<number>;
    closingCosts: SourcedValue<number>;
    downPaymentPercent: SourcedValue<number>;
    interestRate: SourcedValue<number>;
    loanTermYears: SourcedValue<number>;
    arv: SourcedValue<number>;
    rateMin: SourcedValue<number | null>;
    rateMax: SourcedValue<number | null>;
    loanType: SourcedValue<string | null>;
  };
  expenses: {
    taxes: SourcedValue<number>;
    insurance: SourcedValue<number>;
    vacancyPercent: SourcedValue<number>;
    maintenancePercent: SourcedValue<number>;
    managementPercent: SourcedValue<number>;
    capexPercent: SourcedValue<number>;
    rehabCost: SourcedValue<number>;
    rehabContingency: SourcedValue<number>;
  };
  market: {
    medianRent: SourcedValue<number | null>;
    rentGrowth12mo: SourcedValue<number | null>;
    rentGrowth36mo: SourcedValue<number | null>;
    medianHomePrice: SourcedValue<number | null>;
    priceGrowth12mo: SourcedValue<number | null>;
    priceGrowth36mo: SourcedValue<number | null>;
    pricePerSqft: SourcedValue<number | null>;
    inventoryLevel: SourcedValue<number | null>;
    monthsOfSupply: SourcedValue<number | null>;
    daysOnMarket: SourcedValue<number | null>;
    saleToListRatio: SourcedValue<number | null>;
    absorptionRate: SourcedValue<number | null>;
    populationGrowthRate: SourcedValue<number | null>;
    jobGrowthRate: SourcedValue<number | null>;
  };
  risk: {
    crimeScore: SourcedValue<number | null>;
  };
  metadata: {
    dealId: string;
    userId: string;
    createdAt: string;
    dealStatus: string;
    strategyPrimary: string | null;
  };
}

// ── Input Sufficiency ──────────────────────────────────────────────────
// Determines whether enough real data exists to produce meaningful analysis.

export interface InputSufficiency {
  /** Core financial inputs are present (purchase price, rent, etc.) */
  hasFinancialInputs: boolean;
  /** Market condition data has been entered */
  hasMarketData: boolean;
  /** Property enrichment data is available */
  hasPropertyData: boolean;
  /** Minimum viable analysis is possible */
  canAnalyze: boolean;
  /** Missing required fields for core analysis */
  missingFields: string[];
}

/**
 * Evaluate whether the deal has sufficient inputs for meaningful analysis.
 * This prevents presenting empty/zero-input analysis as real investment data.
 */
export function evaluateInputSufficiency(
  dealData: {
    purchase_price: number | null;
    monthly_rent: number;
    arv: number;
    interest_rate: number;
    loan_term_years: number;
    down_payment_percent: number;
    taxes: number;
    insurance: number;
  },
  marketData?: {
    hasAnyMarketFields: boolean;
  }
): InputSufficiency {
  const missing: string[] = [];

  if (!hasValue(dealData.purchase_price)) missing.push("Purchase Price");
  if (!hasValue(dealData.monthly_rent)) missing.push("Monthly Rent");
  if (!hasValue(dealData.arv)) missing.push("After Repair Value (ARV)");

  const hasFinancialInputs =
    hasValue(dealData.purchase_price) &&
    hasValue(dealData.monthly_rent);

  const hasMarketData = marketData?.hasAnyMarketFields ?? false;
  const hasPropertyData = hasValue(dealData.purchase_price);

  // Minimum viable: purchase price AND rent
  const canAnalyze = hasFinancialInputs;

  return {
    hasFinancialInputs,
    hasMarketData,
    hasPropertyData,
    canAnalyze,
    missingFields: missing,
  };
}

// ── Factory: Build from DB row ─────────────────────────────────────────

function sv<T>(value: T): SourcedValue<T> {
  return hasValue(value as any) ? userValue(value) : unavailableValue(value);
}

function svStr(value: string | null): SourcedValue<string | null> {
  return value ? userValue(value) : unavailableValue(value);
}

/**
 * Build a NormalizedDealState from a raw database deal row.
 * This is the canonical entry point for creating the normalized state.
 */
export function buildNormalizedDealState(
  deal: {
    id: string;
    user_id: string;
    created_at: string;
    property_address: string;
    city: string;
    state: string;
    zip_code: string | null;
    property_type: string | null;
    purchase_price: number | null;
    closing_costs: number;
    rehab_cost: number;
    rehab_contingency: number;
    down_payment_percent: number;
    interest_rate: number;
    loan_term_years: number;
    monthly_rent: number;
    other_income: number;
    taxes: number;
    insurance: number;
    vacancy_percent: number;
    maintenance_percent: number;
    management_percent: number;
    capex_percent: number;
    arv: number;
    assessed_value: number | null;
    annual_property_tax: number | null;
    year_built: number | null;
    lot_size: string | null;
    zoning_type: string | null;
    property_record_url: string | null;
    deal_status: string | null;
    strategy_primary: string | null;
  }
): NormalizedDealState {
  // Resolve property data through canonical resolver
  const propertyResolved = getPropertyData(
    { address: deal.property_address, city: deal.city, state: deal.state, zipCode: deal.zip_code },
    {
      propertyType: deal.property_type,
      yearBuilt: deal.year_built,
      lotSize: deal.lot_size,
      assessedValue: deal.assessed_value,
      annualPropertyTax: deal.annual_property_tax,
      zoningType: deal.zoning_type,
      propertyRecordUrl: deal.property_record_url,
    }
  );

  // Resolve rent data through canonical resolver
  const rentResolved = getRentData(
    { address: deal.property_address, city: deal.city, state: deal.state, zipCode: deal.zip_code, propertyType: deal.property_type },
    { monthlyRent: deal.monthly_rent, otherIncome: deal.other_income }
  );

  // Resolve financing data through canonical resolver
  const financingResolved = getFinancingData(
    {},
    {
      interestRate: deal.interest_rate,
      loanTermYears: deal.loan_term_years,
      downPaymentPercent: deal.down_payment_percent,
      purchasePrice: deal.purchase_price,
      closingCosts: deal.closing_costs,
      arv: deal.arv,
    }
  );

  return {
    property: {
      address: propertyResolved.address,
      city: userValue(deal.city),
      state: userValue(deal.state),
      zipCode: svStr(deal.zip_code),
      propertyType: propertyResolved.propertyType,
      yearBuilt: propertyResolved.yearBuilt,
      squareFootage: propertyResolved.squareFootage,
      lotSize: propertyResolved.lotSize,
      zoningType: propertyResolved.zoningType,
      assessedValue: propertyResolved.assessedValue,
      annualPropertyTax: propertyResolved.annualPropertyTax,
      propertyRecordUrl: propertyResolved.propertyRecordUrl,
    },
    rent: {
      monthlyRent: sv(deal.monthly_rent),
      otherIncome: sv(deal.other_income),
      estimatedRentLow: rentResolved.estimatedRentLow,
      estimatedRentMedian: rentResolved.estimatedRentMedian,
      estimatedRentHigh: rentResolved.estimatedRentHigh,
      rentPerSqft: rentResolved.rentPerSqft,
    },
    financing: {
      purchasePrice: sv(deal.purchase_price),
      closingCosts: sv(deal.closing_costs),
      downPaymentPercent: sv(deal.down_payment_percent),
      interestRate: sv(deal.interest_rate),
      loanTermYears: sv(deal.loan_term_years),
      arv: sv(deal.arv),
      rateMin: financingResolved.rateMin,
      rateMax: financingResolved.rateMax,
      loanType: financingResolved.loanType,
    },
    expenses: {
      taxes: sv(deal.taxes),
      insurance: sv(deal.insurance),
      vacancyPercent: sv(deal.vacancy_percent),
      maintenancePercent: sv(deal.maintenance_percent),
      managementPercent: sv(deal.management_percent),
      capexPercent: sv(deal.capex_percent),
      rehabCost: sv(deal.rehab_cost),
      rehabContingency: sv(deal.rehab_contingency),
    },
    market: {
      medianRent: unavailableValue(null),
      rentGrowth12mo: unavailableValue(null),
      rentGrowth36mo: unavailableValue(null),
      medianHomePrice: unavailableValue(null),
      priceGrowth12mo: unavailableValue(null),
      priceGrowth36mo: unavailableValue(null),
      pricePerSqft: unavailableValue(null),
      inventoryLevel: unavailableValue(null),
      monthsOfSupply: unavailableValue(null),
      daysOnMarket: unavailableValue(null),
      saleToListRatio: unavailableValue(null),
      absorptionRate: unavailableValue(null),
      populationGrowthRate: unavailableValue(null),
      jobGrowthRate: unavailableValue(null),
    },
    risk: {
      crimeScore: unavailableValue(null),
    },
    metadata: {
      dealId: deal.id,
      userId: deal.user_id,
      createdAt: deal.created_at,
      dealStatus: deal.deal_status ?? "draft",
      strategyPrimary: deal.strategy_primary,
    },
  };
}

// ── Market Data Enrichment ─────────────────────────────────────────────

function svMarket(value: number | null | undefined): SourcedValue<number | null> {
  return value != null && Number.isFinite(value) && value !== 0
    ? marketValue(value)
    : unavailableValue(null);
}

/**
 * Enrich a NormalizedDealState with market condition data.
 * Returns a new state — never mutates the original.
 */
export function enrichWithMarketData(
  state: NormalizedDealState,
  marketRow: {
    median_rent?: number | null;
    rent_growth_12mo?: number | null;
    rent_growth_36mo?: number | null;
    median_home_price?: number | null;
    price_growth_12mo?: number | null;
    price_growth_36mo?: number | null;
    price_per_sqft?: number | null;
    inventory_level?: number | null;
    months_of_supply?: number | null;
    days_on_market?: number | null;
    sale_to_list_ratio?: number | null;
    absorption_rate?: number | null;
    population_growth_rate?: number | null;
    job_growth_rate?: number | null;
    crime_score?: number | null;
  }
): NormalizedDealState {
  return {
    ...state,
    market: {
      medianRent: svMarket(marketRow.median_rent),
      rentGrowth12mo: svMarket(marketRow.rent_growth_12mo),
      rentGrowth36mo: svMarket(marketRow.rent_growth_36mo),
      medianHomePrice: svMarket(marketRow.median_home_price),
      priceGrowth12mo: svMarket(marketRow.price_growth_12mo),
      priceGrowth36mo: svMarket(marketRow.price_growth_36mo),
      pricePerSqft: svMarket(marketRow.price_per_sqft),
      inventoryLevel: svMarket(marketRow.inventory_level),
      monthsOfSupply: svMarket(marketRow.months_of_supply),
      daysOnMarket: svMarket(marketRow.days_on_market),
      saleToListRatio: svMarket(marketRow.sale_to_list_ratio),
      absorptionRate: svMarket(marketRow.absorption_rate),
      populationGrowthRate: svMarket(marketRow.population_growth_rate),
      jobGrowthRate: svMarket(marketRow.job_growth_rate),
    },
    risk: {
      crimeScore: svMarket(marketRow.crime_score),
    },
  };
}

/**
 * Update specific financial fields on a NormalizedDealState from user input.
 * Returns a new state — never mutates the original.
 */
export function updateFinancialFields(
  state: NormalizedDealState,
  fields: Partial<Record<string, number>>
): NormalizedDealState {
  return {
    ...state,
    financing: {
      ...state.financing,
      purchasePrice: fields.purchase_price !== undefined ? userValue(fields.purchase_price) : state.financing.purchasePrice,
      closingCosts: fields.closing_costs !== undefined ? userValue(fields.closing_costs) : state.financing.closingCosts,
      downPaymentPercent: fields.down_payment_percent !== undefined ? userValue(fields.down_payment_percent) : state.financing.downPaymentPercent,
      interestRate: fields.interest_rate !== undefined ? userValue(fields.interest_rate) : state.financing.interestRate,
      loanTermYears: fields.loan_term_years !== undefined ? userValue(fields.loan_term_years) : state.financing.loanTermYears,
      arv: fields.arv !== undefined ? userValue(fields.arv) : state.financing.arv,
    },
    rent: {
      ...state.rent,
      monthlyRent: fields.monthly_rent !== undefined ? userValue(fields.monthly_rent) : state.rent.monthlyRent,
      otherIncome: fields.other_income !== undefined ? userValue(fields.other_income) : state.rent.otherIncome,
    },
    expenses: {
      ...state.expenses,
      taxes: fields.taxes !== undefined ? userValue(fields.taxes) : state.expenses.taxes,
      insurance: fields.insurance !== undefined ? userValue(fields.insurance) : state.expenses.insurance,
      vacancyPercent: fields.vacancy_percent !== undefined ? userValue(fields.vacancy_percent) : state.expenses.vacancyPercent,
      maintenancePercent: fields.maintenance_percent !== undefined ? userValue(fields.maintenance_percent) : state.expenses.maintenancePercent,
      managementPercent: fields.management_percent !== undefined ? userValue(fields.management_percent) : state.expenses.managementPercent,
      capexPercent: fields.capex_percent !== undefined ? userValue(fields.capex_percent) : state.expenses.capexPercent,
      rehabCost: fields.rehab_cost !== undefined ? userValue(fields.rehab_cost) : state.expenses.rehabCost,
      rehabContingency: fields.rehab_contingency !== undefined ? userValue(fields.rehab_contingency) : state.expenses.rehabContingency,
    },
  };
}

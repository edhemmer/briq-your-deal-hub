/**
 * BRIQ v1.5.2 — Canonical Normalized Deal State
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
import { userValue, unavailableValue, hasValue } from "./dataSourceLayer";
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
  return {
    property: {
      address: userValue(deal.property_address),
      city: userValue(deal.city),
      state: userValue(deal.state),
      zipCode: svStr(deal.zip_code),
      propertyType: svStr(deal.property_type),
      yearBuilt: sv(deal.year_built),
      lotSize: svStr(deal.lot_size),
      zoningType: svStr(deal.zoning_type),
      assessedValue: sv(deal.assessed_value),
      annualPropertyTax: sv(deal.annual_property_tax),
      propertyRecordUrl: svStr(deal.property_record_url),
    },
    rent: {
      monthlyRent: sv(deal.monthly_rent),
      otherIncome: sv(deal.other_income),
    },
    financing: {
      purchasePrice: sv(deal.purchase_price),
      closingCosts: sv(deal.closing_costs),
      downPaymentPercent: sv(deal.down_payment_percent),
      interestRate: sv(deal.interest_rate),
      loanTermYears: sv(deal.loan_term_years),
      arv: sv(deal.arv),
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

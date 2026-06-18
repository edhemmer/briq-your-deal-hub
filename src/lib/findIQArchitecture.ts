import type { TablesInsert } from "@/integrations/supabase/types";

export type ProviderKey =
  | "rentcast"
  | "attom"
  | "mls"
  | "county_records"
  | "census"
  | "future_provider";

export type ProviderStatus = "architecture_ready" | "connected" | "needs_credentials";

export interface OpportunityProvider {
  key: ProviderKey;
  label: string;
  role: string;
  status: ProviderStatus;
}

export interface AcquisitionProfile {
  id: string;
  name: string;
  budgetMin: number;
  budgetMax: number;
  markets: string[];
  propertyTypes: string[];
  minBedrooms: number;
  minBathrooms: number;
  garageRequired: boolean;
  preferredMaxTaxes: number;
  requiresFutureRentalPotential: boolean;
  requiresFutureResalePotential: boolean;
  preferredValueAdd: string[];
}

export interface FindIQOpportunity {
  id: string;
  photoUrl: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
  opportunityType: string;
  listPrice: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: string;
  garage: boolean;
  estimatedAnnualTaxes: number;
  daysOnMarket: number;
  rentalPotential: "strong" | "moderate" | "weak" | "unknown";
  resalePotential: "strong" | "moderate" | "weak" | "unknown";
  valueAddSignals: string[];
  risks: string[];
  missingData: string[];
  providerSignals: ProviderKey[];
}

export interface RankedOpportunity extends FindIQOpportunity {
  score: number;
  fit: "Strong Match" | "Good Match" | "Watchlist" | "Investigate Carefully";
  reasons: string[];
  nextAction: string;
}

export const findIQProviders: OpportunityProvider[] = [
  {
    key: "rentcast",
    label: "RentCast",
    role: "Rent estimates, rental comps, and rental demand signals",
    status: "needs_credentials",
  },
  {
    key: "attom",
    label: "ATTOM",
    role: "Property facts, valuation signals, taxes, and ownership data",
    status: "needs_credentials",
  },
  {
    key: "mls",
    label: "MLS feeds",
    role: "Listing inventory and status changes through approved feeds",
    status: "architecture_ready",
  },
  {
    key: "county_records",
    label: "County Records",
    role: "Tax, deed, permit, and official property record verification",
    status: "architecture_ready",
  },
  {
    key: "census",
    label: "Census",
    role: "Population, household, and market context",
    status: "architecture_ready",
  },
  {
    key: "future_provider",
    label: "Future providers",
    role: "Provider adapter slot for new sources without changing product logic",
    status: "architecture_ready",
  },
];

export const defaultAcquisitionProfile: AcquisitionProfile = {
  id: "ed-paula-illinois",
  name: "Ed & Paula Illinois",
  budgetMin: 200000,
  budgetMax: 270000,
  markets: [
    "Plano",
    "Montgomery",
    "Sugar Grove",
    "Sycamore",
    "Sandwich",
    "Yorkville",
    "West Aurora",
    "Big Rock",
    "DeKalb",
    "Cortland",
    "Elburn",
  ],
  propertyTypes: ["Single Family"],
  minBedrooms: 3,
  minBathrooms: 1.5,
  garageRequired: true,
  preferredMaxTaxes: 6000,
  requiresFutureRentalPotential: true,
  requiresFutureResalePotential: true,
  preferredValueAdd: ["Cosmetic value-add", "Light rehab", "Rent-ready after updates"],
};

export const sampleOpportunities: FindIQOpportunity[] = [
  {
    id: "sandhurst-sandwich",
    photoUrl: "/placeholder.svg",
    address: "1019 Sandhurst Dr",
    city: "Sandwich",
    state: "IL",
    zip: "60548",
    propertyType: "Single Family",
    opportunityType: "Active Listing",
    listPrice: 249900,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1688,
    lotSize: "0.24 ac",
    garage: true,
    estimatedAnnualTaxes: 5140,
    daysOnMarket: 18,
    rentalPotential: "moderate",
    resalePotential: "strong",
    valueAddSignals: ["Cosmetic refresh", "Family layout", "Garage"],
    risks: ["Rent support requires verification", "Condition details incomplete"],
    missingData: ["Insurance quote", "Rent comps", "Inspection photos"],
    providerSignals: ["mls", "county_records", "future_provider"],
  },
  {
    id: "dekalb-ranch",
    photoUrl: "/placeholder.svg",
    address: "428 Prairie View Ln",
    city: "DeKalb",
    state: "IL",
    zip: "60115",
    propertyType: "Single Family",
    opportunityType: "Price Reduction",
    listPrice: 219000,
    bedrooms: 3,
    bathrooms: 1.5,
    squareFeet: 1435,
    lotSize: "0.18 ac",
    garage: true,
    estimatedAnnualTaxes: 6420,
    daysOnMarket: 42,
    rentalPotential: "strong",
    resalePotential: "moderate",
    valueAddSignals: ["Below top of budget", "Rental demand signal"],
    risks: ["Taxes above preference", "Resale upside may be capped"],
    missingData: ["Updated tax bill", "Lease comp support", "Roof age"],
    providerSignals: ["rentcast", "county_records"],
  },
  {
    id: "yorkville-cosmetic",
    photoUrl: "/placeholder.svg",
    address: "716 Birchwood Ct",
    city: "Yorkville",
    state: "IL",
    zip: "60560",
    propertyType: "Single Family",
    opportunityType: "Coming Soon",
    listPrice: 279500,
    bedrooms: 4,
    bathrooms: 2.5,
    squareFeet: 2040,
    lotSize: "0.27 ac",
    garage: true,
    estimatedAnnualTaxes: 5880,
    daysOnMarket: 0,
    rentalPotential: "moderate",
    resalePotential: "strong",
    valueAddSignals: ["Cosmetic value-add", "Extra bedroom", "Stronger resale market"],
    risks: ["Above budget", "Offer would require discount"],
    missingData: ["Seller flexibility", "Comparable sales", "Insurance quote"],
    providerSignals: ["mls", "attom", "census"],
  },
  {
    id: "cortland-no-garage",
    photoUrl: "/placeholder.svg",
    address: "204 Oak Ridge Ave",
    city: "Cortland",
    state: "IL",
    zip: "60112",
    propertyType: "Single Family",
    opportunityType: "Back On Market",
    listPrice: 205000,
    bedrooms: 3,
    bathrooms: 1,
    squareFeet: 1220,
    lotSize: "0.2 ac",
    garage: false,
    estimatedAnnualTaxes: 4380,
    daysOnMarket: 61,
    rentalPotential: "unknown",
    resalePotential: "moderate",
    valueAddSignals: ["Low entry price"],
    risks: ["Garage requirement not met", "Bathroom count below target", "Rental demand unknown"],
    missingData: ["Garage feasibility", "Bath expansion scope", "Rent comps"],
    providerSignals: ["county_records"],
  },
];

const potentialScore = (value: FindIQOpportunity["rentalPotential"] | FindIQOpportunity["resalePotential"]) => {
  if (value === "strong") return 14;
  if (value === "moderate") return 9;
  if (value === "weak") return 2;
  return 0;
};

export function rankOpportunity(profile: AcquisitionProfile, opportunity: FindIQOpportunity): RankedOpportunity {
  let score = 0;
  const reasons: string[] = [];

  const inBudget = opportunity.listPrice >= profile.budgetMin && opportunity.listPrice <= profile.budgetMax;
  if (inBudget) {
    score += 20;
    reasons.push("Price is within the acquisition profile budget.");
  } else if (opportunity.listPrice <= profile.budgetMax * 1.05) {
    score += 10;
    reasons.push("Price is slightly above budget and may require negotiation.");
  } else {
    reasons.push("Price is outside the target budget.");
  }

  if (profile.markets.includes(opportunity.city)) {
    score += 15;
    reasons.push(`${opportunity.city} is in the target market list.`);
  }

  if (profile.propertyTypes.includes(opportunity.propertyType)) {
    score += 12;
    reasons.push("Property type matches the acquisition profile.");
  }

  if (opportunity.bedrooms >= profile.minBedrooms) score += 8;
  if (opportunity.bathrooms >= profile.minBathrooms) score += 8;

  if (!profile.garageRequired || opportunity.garage) {
    score += 8;
    if (opportunity.garage) reasons.push("Garage requirement is met.");
  } else {
    score -= 12;
    reasons.push("Garage requirement is not met.");
  }

  if (opportunity.estimatedAnnualTaxes <= profile.preferredMaxTaxes) {
    score += 10;
    reasons.push("Estimated taxes are within preference.");
  } else {
    score -= 8;
    reasons.push("Estimated taxes are above preference.");
  }

  score += potentialScore(opportunity.rentalPotential);
  score += potentialScore(opportunity.resalePotential);

  if (opportunity.valueAddSignals.some((signal) => /cosmetic|light rehab|updates/i.test(signal))) {
    score += 10;
    reasons.push("Cosmetic value-add signal is present.");
  }

  if (opportunity.opportunityType === "Price Reduction" || opportunity.opportunityType === "Back On Market") {
    score += 5;
    reasons.push(`${opportunity.opportunityType} may create negotiating leverage.`);
  }

  if (opportunity.daysOnMarket >= 30) {
    score += 4;
    reasons.push("Longer market exposure may justify deeper investigation.");
  }

  score += Math.min(opportunity.providerSignals.length * 3, 9);
  score -= Math.min(opportunity.risks.length * 4, 16);
  score -= Math.min(opportunity.missingData.length * 2, 10);

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const fit =
    boundedScore >= 82
      ? "Strong Match"
      : boundedScore >= 70
        ? "Good Match"
        : boundedScore >= 55
          ? "Watchlist"
          : "Investigate Carefully";

  const nextAction =
    fit === "Strong Match" || fit === "Good Match"
      ? "Move to DealIQ for underwriting"
      : fit === "Watchlist"
        ? "Monitor and verify missing data"
        : "Do not underwrite until constraints are resolved";

  return {
    ...opportunity,
    score: boundedScore,
    fit,
    reasons: reasons.slice(0, 5),
    nextAction,
  };
}

export function rankOpportunities(profile: AcquisitionProfile, opportunities: FindIQOpportunity[]) {
  return opportunities
    .map((opportunity) => rankOpportunity(profile, opportunity))
    .sort((a, b) => b.score - a.score);
}

export function opportunityToDealInsert(opportunity: RankedOpportunity): Omit<TablesInsert<"deals">, "user_id"> {
  return {
    property_address: opportunity.address,
    city: opportunity.city,
    state: opportunity.state,
    zip_code: opportunity.zip,
    property_type: opportunity.propertyType,
    purchase_price: opportunity.listPrice,
    taxes: opportunity.estimatedAnnualTaxes,
    annual_property_tax: opportunity.estimatedAnnualTaxes,
    strategy_primary: "Buy & Hold",
    asset_type: "investment",
    deal_status: "draft",
  };
}

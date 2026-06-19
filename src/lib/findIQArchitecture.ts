import type { TablesInsert } from "@/integrations/supabase/types";

export type ProviderKey = "user_entered" | "uploaded_document" | "uploaded_image" | "provider_result";

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

export const defaultAcquisitionProfile: AcquisitionProfile = {
  id: "custom-acquisition-profile",
  name: "Custom Acquisition Profile",
  budgetMin: 200000,
  budgetMax: 270000,
  markets: [],
  propertyTypes: ["Single Family"],
  minBedrooms: 3,
  minBathrooms: 1.5,
  garageRequired: true,
  preferredMaxTaxes: 6000,
  requiresFutureRentalPotential: true,
  requiresFutureResalePotential: true,
  preferredValueAdd: ["Cosmetic value-add", "Light rehab", "Rent-ready after updates"],
};

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

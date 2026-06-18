export type DataCategory = "Property Data" | "Listing Data" | "Rental Data" | "Market Data" | "Risk Data" | "Financial Data";

export type DataConfidence = "Verified" | "Estimated" | "AI Generated";

export type RefreshCadence = "Near Real-Time" | "Periodic" | "Scheduled" | "User Configurable";

export interface DataQualityMetadata {
  source: string;
  retrievalDate: string;
  confidenceLevel: DataConfidence;
  lastUpdated: string;
  dataType: DataCategory;
}

export interface ProviderAdapter<TProviderResponse, TNormalizedObject> {
  providerName: string;
  categories: DataCategory[];
  normalize: (response: TProviderResponse) => TNormalizedObject;
}

export interface NormalizedBrixObject {
  id: string;
  objectType:
    | "Property"
    | "Listing"
    | "Opportunity"
    | "Rental Estimate"
    | "Market Snapshot"
    | "Risk Assessment"
    | "Asset";
  metadata: DataQualityMetadata;
}

export const dataCategories: Record<DataCategory, string[]> = {
  "Property Data": ["Address", "Parcel ID", "Ownership", "Property Type", "Square Footage", "Year Built", "Lot Size"],
  "Listing Data": ["Listing Price", "Listing Status", "Days On Market", "Price Changes", "Listing History"],
  "Rental Data": ["Rent Estimates", "Rental Comps", "Vacancy Indicators", "Rental Demand"],
  "Market Data": ["Inventory", "Appreciation", "Absorption", "Population Growth", "Employment Trends"],
  "Risk Data": ["Flood Risk", "Crime Risk", "Insurance Risk", "Natural Disaster Risk"],
  "Financial Data": ["Taxes", "HOA", "Insurance", "Financing Inputs", "Operating Expenses"],
};

export const providerRoadmap = [
  {
    phase: "Phase 1",
    provider: "RentCast",
    reason: "Property, rental, valuation, and market data for MVP functionality.",
  },
  {
    phase: "Phase 2",
    provider: "ATTOM",
    reason: "Ownership, property history, foreclosure, and expanded market intelligence.",
  },
  {
    phase: "Phase 3",
    provider: "Authorized MLS Integrations",
    reason: "Listing coverage through approved integrations only. No scraping.",
  },
];

export const refreshStrategy: Record<DataCategory | "Portfolio Data", RefreshCadence> = {
  "Listing Data": "Near Real-Time",
  "Property Data": "Periodic",
  "Rental Data": "Scheduled",
  "Market Data": "Scheduled",
  "Risk Data": "Scheduled",
  "Financial Data": "Periodic",
  "Portfolio Data": "User Configurable",
};

export const providerIndependenceRules = [
  "Modules must never communicate directly with external providers.",
  "All providers connect through the Provider Adapter Layer.",
  "Provider responses must normalize into BRIX-standard objects.",
  "BRIX modules consume normalized objects only.",
  "No module should know which provider supplied data or how vendor schemas are structured.",
];

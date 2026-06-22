import type { FindIQOpportunity } from "@/lib/findIQArchitecture";

export type FindIQProviderStatus = "not_configured" | "configured" | "disabled";

export interface FindIQSearchRequest {
  location: string;
  budgetMin?: number;
  budgetMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
}

export interface FindIQProviderResult {
  providerName: string;
  status: FindIQProviderStatus;
  opportunities: FindIQOpportunity[];
  sourceQuality: "provider_sourced" | "user_entered" | "unavailable";
  message?: string;
}

export interface FindIQProviderAdapter {
  providerName: string;
  status: FindIQProviderStatus;
  search: (request: FindIQSearchRequest) => Promise<FindIQProviderResult>;
}

const unavailableProvider = (providerName: string, message: string): FindIQProviderAdapter => ({
  providerName,
  status: "not_configured",
  search: async () => ({
    providerName,
    status: "not_configured",
    opportunities: [],
    sourceQuality: "unavailable",
    message,
  }),
});

export const findIQProviderAdapters: FindIQProviderAdapter[] = [
  unavailableProvider("RentCast", "Property, rent, and listing data adapter slot is ready. Enable when credentials are available."),
  unavailableProvider("ATTOM", "Ownership, property history, and foreclosure adapter slot is ready. Enable when credentials are available."),
  unavailableProvider("Authorized MLS Feed", "MLS adapter slot is ready for approved feed access. BRIX does not scrape listing portals."),
];

export const hasConfiguredFindIQProvider = () =>
  findIQProviderAdapters.some((adapter) => adapter.status === "configured");

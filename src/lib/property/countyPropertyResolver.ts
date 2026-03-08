import { findCountyEntry } from "./countyRegistry";

export interface PropertyResolverInput {
  property_address: string;
  city: string;
  state: string;
  zip_code?: string | null;
  county?: string;
}

export interface PropertyResolverResult {
  url: string;
  county: string;
  source: "registry" | "fallback";
}

/**
 * Deterministic county property URL resolver.
 * Tries registry match first, falls back to Google search.
 */
export function resolveCountyPropertyUrl(input: PropertyResolverInput): PropertyResolverResult {
  const county = input.county || inferCountyFromCity(input.city, input.state);

  const entry = findCountyEntry(input.state, county);

  if (entry) {
    let url = entry.propertySearchUrl;
    if (entry.supportsAddressQuery && entry.queryParam) {
      const encoded = encodeURIComponent(input.property_address);
      url = `${url}?${entry.queryParam}=${encoded}`;
    }
    return { url, county, source: "registry" };
  }

  // Fallback: Google search
  const query = encodeURIComponent(`${county} county ${input.state} property tax records`);
  return {
    url: `https://www.google.com/search?q=${query}`,
    county,
    source: "fallback",
  };
}

/**
 * Simple city-to-county inference for major metros.
 * This is a deterministic lookup, not AI inference.
 */
function inferCountyFromCity(city: string, state: string): string {
  const key = `${city.trim().toLowerCase()}|${state.trim().toUpperCase()}`;
  const map: Record<string, string> = {
    "miami|FL": "Miami-Dade",
    "fort lauderdale|FL": "Broward",
    "west palm beach|FL": "Palm Beach",
    "orlando|FL": "Orange",
    "tampa|FL": "Hillsborough",
    "jacksonville|FL": "Duval",
    "st. petersburg|FL": "Pinellas",
    "houston|TX": "Harris",
    "dallas|TX": "Dallas",
    "fort worth|TX": "Tarrant",
    "san antonio|TX": "Bexar",
    "austin|TX": "Travis",
    "los angeles|CA": "Los Angeles",
    "san diego|CA": "San Diego",
    "san francisco|CA": "San Francisco",
    "new york|NY": "New York",
    "brooklyn|NY": "Kings",
    "atlanta|GA": "Fulton",
    "decatur|GA": "DeKalb",
    "cleveland|OH": "Cuyahoga",
    "columbus|OH": "Franklin",
    "chicago|IL": "Cook",
    "phoenix|AZ": "Maricopa",
    "las vegas|NV": "Clark",
    "charlotte|NC": "Mecklenburg",
    "nashville|TN": "Davidson",
    "denver|CO": "Denver",
    "detroit|MI": "Wayne",
    "philadelphia|PA": "Philadelphia",
    "seattle|WA": "King",
    "baltimore|MD": "Baltimore",
  };
  return map[key] || city;
}

import type { DealFacts } from "./types";

export function taxSearchUrl(deal: DealFacts) {
  const query = [deal.county, deal.state, deal.address, "property tax records"].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(query || `${deal.address} property tax records`)}`;
}

export function areaSearchUrl(deal: DealFacts, need: string) {
  const query = [need, "near", deal.address, deal.city, deal.state, deal.zip].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
}

export const ownerOccupiedConveniences = [
  { label: "Hospital / urgent care", greenMiles: 5, cautionMiles: 12 },
  { label: "Grocery", greenMiles: 2, cautionMiles: 6 },
  { label: "Highway access", greenMiles: 5, cautionMiles: 12 },
  { label: "Airport access", greenMiles: 35, cautionMiles: 60 },
  { label: "Pharmacy", greenMiles: 3, cautionMiles: 8 },
];

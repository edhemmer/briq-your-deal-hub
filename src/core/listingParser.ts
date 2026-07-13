import type { DealFacts } from "./types";
import type { StrategyId } from "./strategyCatalog";

const money = /\$[\d,]+(?:\.\d{2})?/g;
const zipAddress = /([0-9]{1,6}[\w\s.-]+?),?\s+([A-Za-z .'-]+),?\s+([A-Z]{2})\s+(\d{5})(?:-\d{4})?/;

export function createBlankDeal(strategyId: StrategyId): DealFacts {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "draft",
    address: "",
    strategyId,
    notes: [],
    photoUrls: [],
    uploadedPhotoNames: [],
    verification: {},
  };
}

export function parseListingInput(input: string, strategyId: StrategyId): DealFacts {
  const deal = createBlankDeal(strategyId);
  const source = input.trim();
  deal.sourceText = source;
  if (/^https?:\/\//i.test(source)) {
    deal.sourceUrl = source;
  }

  const decoded = decodeURIComponent(source).replace(/[-_]+/g, " ");
  const slugAddress = parseAddressFromUrlSlug(source);
  const addressMatch = decoded.match(zipAddress);
  if (slugAddress) {
    deal.address = slugAddress.address;
    deal.city = slugAddress.city;
    deal.state = slugAddress.state;
    deal.zip = slugAddress.zip;
    deal.verification.address = "source_backed";
  } else if (addressMatch) {
    deal.address = compact(addressMatch[1]);
    deal.city = compact(addressMatch[2]);
    deal.state = addressMatch[3].toUpperCase();
    deal.zip = addressMatch[4];
    deal.verification.address = "source_backed";
  } else if (!/^https?:\/\//i.test(source)) {
    const firstLine = source.split(/\n|,/).map((part) => part.trim()).find(Boolean);
    deal.address = firstLine ?? "";
    if (deal.address) deal.verification.address = "entered";
  }

  const priceFromText = source.match(/(?:list(?:ing)? price|asking|price)\D{0,20}(\$[\d,]+)/i)?.[1] ?? source.match(money)?.[0];
  deal.listPrice = parseMoney(priceFromText);
  if (deal.listPrice) deal.verification.listPrice = "source_backed";

  deal.beds = parseNumber(source.match(/(\d+(?:\.\d+)?)\s*(?:beds?|bedrooms?|bd)\b/i)?.[1]);
  deal.baths = parseNumber(source.match(/(\d+(?:\.\d+)?)\s*(?:baths?|bathrooms?|ba)\b/i)?.[1]);
  deal.squareFeet = parseNumber(source.match(/([\d,]+)\s*(?:sq\.?\s*ft|square feet|sqft)\b/i)?.[1]);
  deal.yearBuilt = parseNumber(source.match(/(?:built|year built)\D{0,20}(\d{4})/i)?.[1]);

  const taxMatch = source.match(/(?:tax(?:es)?|property tax(?:es)?)\D{0,35}(\$[\d,]+)/i);
  deal.annualTaxes = parseMoney(taxMatch?.[1]);
  if (deal.annualTaxes) deal.verification.annualTaxes = "source_backed";

  const hoaMatch = source.match(/(?:hoa|association)\D{0,25}(\$[\d,]+)/i);
  deal.hoaMonthly = parseMoney(hoaMatch?.[1]);
  if (deal.hoaMonthly) deal.verification.hoaMonthly = "source_backed";

  const imageMatches = [...source.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]+)?/gi)];
  deal.photoUrls = imageMatches.map((match) => match[0]);
  if (deal.photoUrls.length > 0) deal.verification.photoUrls = "source_backed";

  const conditionSignals = extractSignals(source);
  if (conditionSignals.length > 0) deal.notes.push(...conditionSignals);

  return deal;
}

function parseAddressFromUrlSlug(input: string) {
  if (!/^https?:\/\//i.test(input)) return null;
  const decoded = decodeURIComponent(input);
  const segment = decoded.split("/").find((part) => /\d{5}/.test(part) && /-\w{2}-\d{5}/i.test(part));
  if (!segment) return null;
  const tokens = segment.replace(/_zpid.*/i, "").replace(/\?.*/g, "").split("-").filter(Boolean);
  const zipIndex = tokens.findIndex((token) => /^\d{5}$/.test(token));
  if (zipIndex < 3) return null;
  const state = tokens[zipIndex - 1]?.toUpperCase();
  const beforeState = tokens.slice(0, zipIndex - 1);
  const suffixes = new Set(["st", "street", "ave", "avenue", "rd", "road", "dr", "drive", "ln", "lane", "ct", "court", "cir", "circle", "blvd", "way", "pl", "place", "trl", "trail", "pkwy", "parkway", "ter", "terrace"]);
  const suffixIndex = beforeState.findIndex((token, index) => index > 0 && suffixes.has(token.toLowerCase()));
  const addressEnd = suffixIndex >= 0 ? suffixIndex + 1 : Math.max(2, beforeState.length - 1);
  const address = beforeState.slice(0, addressEnd).join(" ");
  const city = beforeState.slice(addressEnd).join(" ");
  return {
    address: compact(address),
    city: compact(city),
    state,
    zip: tokens[zipIndex],
  };
}

export function compact(value: string) {
  return value.replace(/\s+/g, " ").replace(/\bHomedetails\b/i, "").trim();
}

export function parseMoney(value?: string | null) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseNumber(value?: string | null) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractSignals(source: string) {
  const signals = [
    "updated", "renovated", "new roof", "new hvac", "basement", "ranch", "busy road", "as-is", "needs work",
    "water damage", "foundation", "hoa", "garage", "airport", "hospital", "grocery", "school", "parking",
  ];
  return signals.filter((signal) => source.toLowerCase().includes(signal)).map((signal) => `Listing mentions ${signal}.`);
}

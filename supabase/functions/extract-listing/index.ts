import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SourceSupport = "supported" | "limited" | "unsupported";
type RegistryEntry = {
  sourceKey: string;
  displayName: string;
  hostPatterns: RegExp[];
  supportLevel: SourceSupport;
  retrievalMethod: "url_metadata" | "none";
  adapterVersion: string;
  rateLimit: string;
  licensingNotes: string;
  evidenceRule: string;
  fallback: string;
  enabled: boolean;
};

const registry: RegistryEntry[] = [
  {
    sourceKey: "zillow_public_listing",
    displayName: "Public listing URL",
    hostPatterns: [/^zillow\.com$/i, /^www\.zillow\.com$/i],
    supportLevel: "limited",
    retrievalMethod: "url_metadata",
    adapterVersion: "listing-url-v1",
    rateLimit: "metadata only",
    licensingNotes: "BRIX preserves the URL and extracts only URL-visible candidate values. Full listing enrichment requires an authorized provider.",
    evidenceRule: "URL path candidate; verify against the listing or official records before relying on it.",
    fallback: "Continue with manual intake when URL metadata is insufficient.",
    enabled: true,
  },
  {
    sourceKey: "redfin_public_listing",
    displayName: "Public listing URL",
    hostPatterns: [/^redfin\.com$/i, /^www\.redfin\.com$/i],
    supportLevel: "limited",
    retrievalMethod: "url_metadata",
    adapterVersion: "listing-url-v1",
    rateLimit: "metadata only",
    licensingNotes: "BRIX preserves the URL and extracts only URL-visible candidate values. Full listing enrichment requires an authorized provider.",
    evidenceRule: "URL path candidate; verify against the listing or official records before relying on it.",
    fallback: "Continue with manual intake when URL metadata is insufficient.",
    enabled: true,
  },
  {
    sourceKey: "realtor_public_listing",
    displayName: "Public listing URL",
    hostPatterns: [/^realtor\.com$/i, /^www\.realtor\.com$/i],
    supportLevel: "limited",
    retrievalMethod: "url_metadata",
    adapterVersion: "listing-url-v1",
    rateLimit: "metadata only",
    licensingNotes: "BRIX preserves the URL and extracts only URL-visible candidate values. Full listing enrichment requires an authorized provider.",
    evidenceRule: "URL path candidate; verify against the listing or official records before relying on it.",
    fallback: "Continue with manual intake when URL metadata is insufficient.",
    enabled: true,
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST for listing URL intake." }, 405);
  try {
    const body = await req.json();
    const result = extractListingUrl(String(body?.url ?? body?.input ?? ""));
    return json(result);
  } catch (error) {
    return json({
      originalUrl: "",
      normalizedUrl: "",
      sourceKey: "invalid",
      sourceDisplayName: "Invalid URL",
      supportLevel: "unsupported",
      retrievalMethod: "none",
      adapterVersion: "listing-url-v1",
      status: "failed",
      retrievedAt: new Date().toISOString(),
      safeMessage: error instanceof Error ? error.message : "BRIX could not process that listing URL.",
      licensingNotes: "No source content was imported.",
      proposals: [],
    }, 400);
  }
});

function extractListingUrl(input: string) {
  const { originalUrl, normalizedUrl, url } = validateAndNormalizeUrl(input);
  const source = resolveSource(url.hostname);
  const retrievedAt = new Date().toISOString();
  const proposals = source.supportLevel === "unsupported" ? [] : buildUrlMetadataProposals(url, source);
  const status = source.supportLevel === "unsupported" ? "unsupported" : proposals.length ? "partially_complete" : "failed";
  return {
    originalUrl,
    normalizedUrl,
    sourceKey: source.sourceKey,
    sourceDisplayName: source.displayName,
    supportLevel: source.supportLevel,
    retrievalMethod: source.retrievalMethod,
    adapterVersion: source.adapterVersion,
    status,
    retrievedAt,
    safeMessage: source.supportLevel === "unsupported"
      ? "This source is not connected for listing import. BRIX saved no values from it."
      : proposals.length
        ? "BRIX found URL-visible candidate values. Review and accept only what you trust."
        : "BRIX could not extract candidate values from the URL. Continue manually.",
    licensingNotes: source.licensingNotes,
    proposals,
  };
}

function validateAndNormalizeUrl(input: string) {
  const originalUrl = input.trim();
  if (!originalUrl) throw new Error("Paste a listing URL before importing.");
  if (originalUrl.length > 2048) throw new Error("Listing URL is too long to import safely.");
  let url: URL;
  try {
    url = new URL(originalUrl);
  } catch {
    throw new Error("Enter a valid listing URL.");
  }
  if (url.protocol !== "https:") throw new Error("BRIX accepts secure HTTPS listing URLs only.");
  if (url.username || url.password) throw new Error("Remove credentials from the URL before importing.");
  if (isUnsafeHostname(url.hostname)) throw new Error("BRIX cannot import URLs from local or private network addresses.");
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|msclkid$|yclid$|igshid$|mc_)/i.test(key)) url.searchParams.delete(key);
  }
  url.hash = "";
  return { originalUrl, normalizedUrl: url.toString(), url };
}

function resolveSource(hostname: string): RegistryEntry {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  const match = registry.find((entry) => entry.enabled && entry.hostPatterns.some((pattern) => pattern.test(normalized)));
  return match ?? {
    sourceKey: "unsupported_listing_url",
    displayName: "Unsupported listing URL",
    hostPatterns: [],
    supportLevel: "unsupported",
    retrievalMethod: "none",
    adapterVersion: "listing-url-v1",
    rateLimit: "none",
    licensingNotes: "BRIX does not import values from this source without an approved adapter.",
    evidenceRule: "URL saved only after the user continues manually.",
    fallback: "Continue with manual intake.",
    enabled: true,
  };
}

function buildUrlMetadataProposals(url: URL, source: RegistryEntry) {
  const parsed = parseAddressFromUrlPath(url);
  const proposals = [];
  if (parsed?.address) proposals.push(proposal("address", "Address", parsed.address, 68, source));
  if (parsed?.city) proposals.push(proposal("city", "City", parsed.city, 66, source));
  if (parsed?.state) proposals.push(proposal("region", "State", parsed.state, 66, source));
  if (parsed?.zip) proposals.push(proposal("postal_code", "ZIP code", parsed.zip, 66, source));
  return proposals;
}

function parseAddressFromUrlPath(url: URL) {
  const decoded = decodeURIComponent(url.pathname);
  const segments = decoded.split("/").filter(Boolean);
  const segment = segments.find((part) => /\d{5}/.test(part) && /-\w{2}-\d{5}/i.test(part));
  if (!segment) return null;
  const tokens = segment.replace(/_zpid.*/i, "").replace(/\?.*/g, "").split("-").filter(Boolean);
  const zipIndex = tokens.findIndex((token) => /^\d{5}$/.test(token));
  if (zipIndex < 3) return null;
  const state = tokens[zipIndex - 1]?.toUpperCase();
  const beforeState = tokens.slice(0, zipIndex - 1);
  const suffixes = new Set(["st", "street", "ave", "avenue", "rd", "road", "dr", "drive", "ln", "lane", "ct", "court", "cir", "circle", "blvd", "way", "pl", "place", "trl", "trail", "pkwy", "parkway", "ter", "terrace", "ct", "court"]);
  const suffixIndex = beforeState.findIndex((token, index) => index > 0 && suffixes.has(token.toLowerCase()));
  const addressEnd = suffixIndex >= 0 ? suffixIndex + 1 : Math.max(2, beforeState.length - 1);
  return {
    address: titleCase(beforeState.slice(0, addressEnd).join(" ")),
    city: titleCase(beforeState.slice(addressEnd).join(" ")),
    state,
    zip: tokens[zipIndex],
  };
}

function proposal(field: string, label: string, value: string, confidence: number, source: RegistryEntry) {
  return {
    id: `${source.sourceKey}:${field}`,
    field,
    label,
    rawValue: value,
    normalizedValue: value,
    displayValue: value,
    classification: "source_backed_candidate",
    verificationState: "unverified",
    confidence,
    status: "pending",
    sourceKey: source.sourceKey,
    evidenceRule: source.evidenceRule,
  };
}

function isUnsafeHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".localhost") || host === "0.0.0.0") return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const parts = host.split(".").map(Number);
    return parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168);
  }
  if (host === "::1" || host.startsWith("[::1]")) return true;
  return false;
}

function titleCase(value: string) {
  return value.split(/\s+/).filter(Boolean).map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join(" ");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

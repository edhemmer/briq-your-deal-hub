import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { input = "", strategy_id = "owner_occupant" } = await req.json();
    const parsed = parseListing(String(input), String(strategy_id));
    return json({ deal: parsed, confidence: parsed.address ? 72 : 28 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to extract listing." }, 400);
  }
});

function parseListing(input: string, strategyId: string) {
  const decoded = decodeURIComponent(input).replace(/[-_]+/g, " ");
  const slugAddress = parseAddressFromUrlSlug(input);
  const match = decoded.match(/([0-9]{1,6}[\w\s.]+?)\s+([A-Za-z .'-]+)\s+([A-Z]{2})\s+(\d{5})/);
  return {
    source_url: /^https?:\/\//i.test(input) ? input : null,
    source_text: input,
    address: slugAddress?.address ?? match?.[1]?.trim() ?? input.split(/\n|,/)[0]?.trim() ?? "",
    city: slugAddress?.city ?? match?.[2]?.trim() ?? null,
    state: slugAddress?.state ?? match?.[3] ?? null,
    zip: slugAddress?.zip ?? match?.[4] ?? null,
    strategy_id: strategyId,
    facts: {
      listPrice: money(input.match(/\$[\d,]+/)?.[0]),
      beds: number(input.match(/(\d+(?:\.\d+)?)\s*(?:beds?|bd|bedrooms?)/i)?.[1]),
      baths: number(input.match(/(\d+(?:\.\d+)?)\s*(?:baths?|ba|bathrooms?)/i)?.[1]),
      squareFeet: number(input.match(/([\d,]+)\s*(?:sqft|sq\.?\s*ft|square feet)/i)?.[1]),
      annualTaxes: money(input.match(/(?:tax|taxes)\D{0,35}(\$[\d,]+)/i)?.[1]),
    },
    verification: { address: slugAddress || match ? "source_backed" : "entered" },
  };
}

function parseAddressFromUrlSlug(input: string) {
  if (!/^https?:\/\//i.test(input)) return null;
  const decoded = decodeURIComponent(input);
  const segment = decoded.split("/").find((part) => /\d{5}/.test(part) && /-\w{2}-\d{5}/i.test(part));
  if (!segment) return null;
  const tokens = segment.replace(/_zpid.*/i, "").replace(/\?.*/g, "").split("-").filter(Boolean);
  const zipIndex = tokens.findIndex((token) => /^\d{5}$/.test(token));
  if (zipIndex < 3) return null;
  const beforeState = tokens.slice(0, zipIndex - 1);
  const suffixes = new Set(["st", "street", "ave", "avenue", "rd", "road", "dr", "drive", "ln", "lane", "ct", "court", "cir", "circle", "blvd", "way", "pl", "place", "trl", "trail", "pkwy", "parkway", "ter", "terrace"]);
  const suffixIndex = beforeState.findIndex((token, index) => index > 0 && suffixes.has(token.toLowerCase()));
  const addressEnd = suffixIndex >= 0 ? suffixIndex + 1 : Math.max(2, beforeState.length - 1);
  return {
    address: beforeState.slice(0, addressEnd).join(" ").trim(),
    city: beforeState.slice(addressEnd).join(" ").trim(),
    state: tokens[zipIndex - 1]?.toUpperCase(),
    zip: tokens[zipIndex],
  };
}

function money(value?: string | null) {
  if (!value) return null;
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function number(value?: string | null) {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

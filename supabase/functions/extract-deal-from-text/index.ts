import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_BASE_URL = (Deno.env.get("AI_GATEWAY_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
const AI_MODEL = Deno.env.get("AI_TEXT_MODEL") ?? "gpt-4o-mini";

const toNumber = (value: string | undefined | null) => {
  if (!value) return null;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const firstMatch = (text: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
};

const firstURL = (text: string) => text.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? null;

function parseListingURL(urlString: string | null): {
  property_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
} {
  if (!urlString) return {};
  try {
    const url = new URL(urlString);
    const marker = "/homedetails/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return {};

    const slug = decodeURIComponent(url.pathname)
      .slice(markerIndex + marker.length)
      .split("/")[0]
      .replace(/_zpid.*$/i, "")
      .replace(/\d+_zpid.*$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!slug) return {};
    const parts = slug.split(" ");
    const zip = /^\d{5}$/.test(parts.at(-1) ?? "") ? parts.at(-1) : null;
    const state = zip ? parts.at(-2) ?? null : null;
    const city = zip ? parts.at(-3) ?? null : null;
    const addressParts = zip ? parts.slice(0, -3) : parts;

    return {
      property_address: addressParts.join(" ") || null,
      city,
      state,
      zip_code: zip,
    };
  } catch {
    return {};
  }
}

async function fetchListingPage(urlString: string) {
  try {
    const response = await fetch(urlString, {
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 BRIXRealEstate/1.0 property-intake",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return { text: "", warning: `The listing page returned HTTP ${response.status}. Paste listing text or screenshots to extract more fields.` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { text: "", warning: "The listing URL did not return readable page content. Paste listing text or upload screenshots to extract more fields." };
    }

    const html = await response.text();
    const text = htmlToReadableListingText(html);
    if (text.length < 80) {
      return { text, warning: "The listing page did not expose enough readable content. Paste listing text or upload screenshots to extract more fields." };
    }
    return { text, warning: "" };
  } catch {
    return { text: "", warning: "BRIX could not read that listing page. Paste listing text or upload screenshots to extract more fields." };
  }
}

function htmlToReadableListingText(html: string) {
  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .join("\n");
  const meta = [...html.matchAll(/<meta\s+[^>]*(?:property|name)=["'](?:og:title|og:description|description|twitter:title|twitter:description)["'][^>]*content=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .join("\n");
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return [title, meta, jsonLd, body]
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60000);
}

const extractCounty = (text: string) => {
  const match = text.match(/\b([A-Za-z][A-Za-z .'-]{1,40})\s+County\b/i);
  if (!match?.[1]) return null;
  return match[1]
    .replace(/\b(county|il|illinois)\b/gi, "")
    .replace(/[,.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

function deterministicListingExtract(listingText: string) {
  const text = listingText.replace(/\s+/g, " ").trim();
  const listingUrl = firstURL(text);
  const urlParts = parseListingURL(listingUrl);
  const addressMatch = text.match(/\b(\d{1,6}\s+[A-Za-z0-9.' -]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Cir|Circle|Way|Blvd|Boulevard|Pl|Place|Ter|Terrace|Trl|Trail)\b[^,\n]*)(?:,\s*([A-Za-z .'-]+),\s*([A-Z]{2})\s*(\d{5})?)?/i);
  const cityStateZip = text.match(/\b([A-Za-z .'-]+),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?\b/);
  const price = toNumber(firstMatch(text, [
    /(?:listed|asking|price|for sale|offered)\s*(?:at|for|:)?\s*\$?\s*([\d,]{5,9})/i,
    /\$\s*([\d,]{5,9})\b/,
  ]));
  const taxes = toNumber(firstMatch(text, [
    /(?:taxes|property tax|annual tax)[^\d$]{0,20}\$?\s*([\d,]{3,8})/i,
  ]));

  const lower = text.toLowerCase();
  const propertyType =
    /duplex/.test(lower) ? "Duplex" :
    /triplex/.test(lower) ? "Triplex" :
    /fourplex|4-plex/.test(lower) ? "Fourplex" :
    /multi[\s-]?family|multifamily|apartment/.test(lower) ? "Small Multifamily" :
    /commercial|retail|office|industrial/.test(lower) ? "Commercial" :
    /land|lot/.test(lower) ? "Land" :
    /mixed use|mixed-use/.test(lower) ? "Mixed Use" :
    /single family|sfh|home|house/.test(lower) ? "Single Family" :
    null;

  const conditionNotes: string[] = [];
  if (/cosmetic|paint|flooring|update|refresh/i.test(text)) conditionNotes.push("Cosmetic updates mentioned.");
  if (/new roof|roof/i.test(text)) conditionNotes.push("Roof mentioned; verify age and condition.");
  if (/as-is|as is/i.test(text)) conditionNotes.push("As-is sale language mentioned.");
  if (/fixer|rehab|needs work|tlc/i.test(text)) conditionNotes.push("Repair or rehab need mentioned.");

  const risks: string[] = [];
  if (/flood|foundation|mold|water damage|structural|fire damage/i.test(text)) {
    risks.push("Material condition concern mentioned in listing text.");
  }
  if (/short sale|foreclosure|auction|probate|estate/i.test(text)) {
    risks.push("Special transaction context mentioned; verify process and timelines.");
  }

  const extracted = {
    property_address: addressMatch?.[1] ?? urlParts.property_address ?? null,
    city: addressMatch?.[2]?.trim() ?? cityStateZip?.[1]?.trim() ?? urlParts.city ?? null,
    county: extractCounty(text),
    state: addressMatch?.[3] ?? cityStateZip?.[2] ?? urlParts.state ?? null,
    zip_code: addressMatch?.[4] ?? cityStateZip?.[3] ?? urlParts.zip_code ?? null,
    property_type: propertyType,
    purchase_price: price,
    estimated_arv: toNumber(firstMatch(text, [/(?:arv|after repair value)[^\d$]{0,20}\$?\s*([\d,]{5,9})/i])),
    monthly_rent: toNumber(firstMatch(text, [/(?:rent|rental income)[^\d$]{0,20}\$?\s*([\d,]{3,8})(?:\s*\/?\s*(?:mo|month|monthly))?/i])),
    annual_property_tax: taxes,
    taxes,
    insurance: toNumber(firstMatch(text, [/(?:insurance|premium)[^\d$]{0,20}\$?\s*([\d,]{3,8})/i])),
    beds: toNumber(firstMatch(text, [/(\d+(?:\.\d+)?)\s*(?:beds?|bedrooms?)\b/i])),
    baths: toNumber(firstMatch(text, [/(\d+(?:\.\d+)?)\s*(?:baths?|bathrooms?)\b/i])),
    sqft: toNumber(firstMatch(text, [/([\d,]{3,6})\s*(?:sq\.?\s*ft\.?|sqft|square feet)\b/i])),
    year_built: toNumber(firstMatch(text, [/(?:built|year built)[^\d]{0,12}(\d{4})/i])),
    condition_notes: conditionNotes,
    visible_or_stated_risks: risks,
    missing_questions: [
      "Verify rent comps with a reliable source.",
      "Verify taxes from official records.",
      "Verify insurance quote before offer.",
      "Verify condition through inspection or field photos.",
    ],
    strategy_primary: /owner[-\s]?occup|primary residence|live[-\s]?in|house hack|home search/i.test(text) ? "Owner Occupant" : /flip|resale/i.test(text) ? "Fix & Flip" : /brrrr/i.test(text) ? "BRRRR" : null,
    source_confidence: price || addressMatch ? "medium" : "low",
  };

  return {
    extracted,
    mode: "deterministic_fallback",
    warning: "AI extraction was unavailable. BRIX used deterministic text parsing with lower confidence. Review and verify every field.",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listing_text, listing_url } = await req.json();

    if ((!listing_text || typeof listing_text !== "string" || listing_text.trim().length < 10) && (!listing_url || typeof listing_url !== "string")) {
      return new Response(JSON.stringify({ error: "Please paste more listing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputText = typeof listing_text === "string" ? listing_text.trim() : "";
    const url = typeof listing_url === "string" ? listing_url.trim() : firstURL(inputText);
    let pageWarning = "";
    let pageText = "";
    if (url) {
      const fetched = await fetchListingPage(url);
      pageText = fetched.text;
      pageWarning = fetched.warning;
    }

    const extractionText = [inputText, pageText].filter(Boolean).join("\n\n").slice(0, 60000);

    const apiKey = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      const fallback = deterministicListingExtract(extractionText || inputText || url);
      return new Response(JSON.stringify({ ...fallback, warning: pageWarning || fallback.warning }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: `You extract real estate property listing and due-diligence data from text. Return ONLY valid JSON with these fields (use null for missing values, arrays for notes):
{
  "property_address": string | null,
  "city": string | null,
  "county": string | null,
  "state": string | null (2-letter code),
  "zip_code": string | null,
  "property_type": string | null (one of: "Single Family", "Duplex", "Triplex", "Fourplex", "Small Multifamily", "Commercial", "Land", "Mixed Use"),
  "purchase_price": number | null (no commas or $),
  "estimated_arv": number | null,
  "monthly_rent": number | null,
  "annual_property_tax": number | null,
  "taxes": number | null,
  "insurance": number | null,
  "beds": number | null,
  "baths": number | null,
  "sqft": number | null,
  "year_built": number | null,
  "condition_notes": string[],
  "visible_or_stated_risks": string[],
  "missing_questions": string[],
  "strategy_primary": string | null (one of: "Buy & Hold", "Fix & Flip", "Wholesale", "BRRRR", "Development", "Owner Occupant"),
  "source_confidence": "low" | "medium" | "high"
}
Only extract facts actually present in the text. Do not invent rent, taxes, ARV, expenses, condition, or risk values. Put unknown diligence items in missing_questions.
Do not include any markdown formatting, code fences, or explanation. Only output the JSON object.`
          },
          {
            role: "user",
            content: `Extract the property deal information from this listing text:\n\n${extractionText.slice(0, 12000)}`
          }
        ],
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        const fallback = deterministicListingExtract(extractionText || inputText || url);
        return new Response(JSON.stringify({ ...fallback, warning: pageWarning || fallback.warning }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", errText);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Could not parse listing data", raw: content }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deterministic = deterministicListingExtract(extractionText || inputText || url).extracted;
    const merged = {
      ...deterministic,
      ...Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== null && value !== "" && value !== undefined)),
    };

    return new Response(JSON.stringify({ extracted: merged, warning: pageWarning || undefined }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

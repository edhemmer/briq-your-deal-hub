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

const hasAny = (text: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text));

const isPlausibleAnnualPropertyTax = (value: number) => Number.isFinite(value) && value >= 500 && value <= 250000;

const STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
  "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]);

function titleCase(value: string | null | undefined) {
  if (!value) return null;
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.length <= 2 && STATE_CODES.has(part.toUpperCase()) ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function extractPhotoUrls(text: string) {
  const urls = text.match(/https?:\/\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp|avif)(?:\?[^\s"'<>]*)?/gi) ?? [];
  return Array.from(new Set(urls)).slice(0, 12);
}

function parseListingURL(urlString: string | null): {
  property_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
} {
  if (!urlString) return {};
  try {
    const url = new URL(urlString);
    const slugCandidates = decodeURIComponent(url.pathname)
      .split("/")
      .filter(Boolean)
      .map((segment) => segment
        .replace(/_zpid.*$/i, "")
        .replace(/\d+_zpid.*$/i, "")
        .replace(/\b(?:home|homes|details|property|real-estate|for-sale|listing|listings|house|houses)\b/gi, " ")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
      )
      .filter((segment) => /\d{1,6}\s+\S+/.test(segment) || /\b[A-Z]{2}\s+\d{5}\b/i.test(segment));

    const slug = (slugCandidates.find((segment) => /\d{1,6}\s+\S+/.test(segment)) ?? slugCandidates.at(-1) ?? "")
      .replace(/_zpid.*$/i, "")
      .replace(/\d+_zpid.*$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!slug) return {};
    const parts = slug.split(" ").filter(Boolean);
    const zipIndex = parts.findLastIndex((part) => /^\d{5}$/.test(part));
    const zip = zipIndex >= 0 ? parts[zipIndex] : null;
    const state = zipIndex > 0 && STATE_CODES.has((parts[zipIndex - 1] ?? "").toUpperCase()) ? parts[zipIndex - 1].toUpperCase() : null;
    const city = state && zipIndex > 1 ? parts[zipIndex - 2] : null;
    const addressParts = zip && state ? parts.slice(0, Math.max(0, zipIndex - 2)) : parts;

    return {
      property_address: titleCase(addressParts.join(" ")) || null,
      city: titleCase(city),
      state,
      zip_code: zip,
    };
  } catch {
    return {};
  }
}

function extractTaxYear(text: string) {
  const match = text.match(/\b(20\d{2})\s*(?:property\s*)?(?:tax|taxes)\b|\b(?:property\s*)?(?:tax|taxes)\s*(?:year)?\s*(20\d{2})\b/i);
  return match?.[1] ?? match?.[2] ?? null;
}

function applyExtractionGuardrails(
  extracted: Record<string, unknown>,
  deterministic: Record<string, unknown>,
  extractionText: string,
  userText: string,
) {
  const guarded = { ...extracted };

  if (!hasAny(extractionText, [
    /(?:monthly\s+rent|rent estimate|rental income|leased for|lease rent|market rent)[^\d$]{0,30}\$?\s*[\d,]{3,8}/i,
  ])) {
    guarded.monthly_rent = null;
  }

  if (!hasAny(extractionText, [
    /(?:arv|after repair value)[^\d$]{0,30}\$?\s*[\d,]{5,9}/i,
  ])) {
    guarded.estimated_arv = null;
  }

  if (hasAny(userText, [
    /(?:annual\s+insurance|yearly\s+insurance|homeowners?\s+insurance|hazard\s+insurance|insurance\s+quote|insurance\s+premium|premium)[^\d$]{0,30}\$?\s*[\d,]{3,8}/i,
  ])) {
    guarded.insurance = deterministic.insurance ?? guarded.insurance ?? null;
  } else {
    guarded.insurance = null;
  }

  if (!hasAny(extractionText, [
    /owner[-\s]?occup|primary residence|live[-\s]?in|house hack|home search|flip|resale|brrrr|buy\s*&?\s*hold|rental strategy|development/i,
  ])) {
    guarded.strategy_primary = null;
  }

  const hasListingTax = hasAny(extractionText, [
    /(?:20\d{2}\s*)?(?:property\s*)?(?:tax|taxes|annual tax|tax amount|tax assessed)[^\d$]{0,40}\$?\s*[\d,]{3,8}/i,
    /\$?\s*[\d,]{3,8}[^\n]{0,40}(?:20\d{2}\s*)?(?:property\s*)?(?:tax|taxes|annual tax)/i,
  ]);
  if (hasListingTax && typeof deterministic.annual_property_tax === "number" && typeof guarded.annual_property_tax !== "number") {
    guarded.annual_property_tax = deterministic.annual_property_tax;
  }
  if (typeof guarded.annual_property_tax === "number") {
    if (!isPlausibleAnnualPropertyTax(guarded.annual_property_tax)) {
      guarded.annual_property_tax = null;
    }
  }
  if (typeof guarded.annual_property_tax === "number") {
    guarded.taxes = guarded.annual_property_tax;
  } else {
    guarded.taxes = null;
  }

  const questions = Array.isArray(guarded.missing_questions) ? [...guarded.missing_questions] : [];
  const addQuestion = (question: string) => {
    if (!questions.some((item) => String(item).toLowerCase() === question.toLowerCase())) questions.push(question);
  };
  if (!guarded.monthly_rent) addQuestion("Verify market rent with reliable rent comps.");
  if (!guarded.insurance) addQuestion("Obtain an annual insurance quote.");
  if (!guarded.estimated_arv) addQuestion("Verify resale value or ARV with relevant comps.");
  const taxYear = extractTaxYear(extractionText);
  if (guarded.annual_property_tax) {
    addQuestion(`${taxYear ? `${taxYear} ` : ""}property tax was found in the listing. Verify it against county records and add prior-year history if available.`);
  } else if (hasListingTax) {
    addQuestion("A tax-related value was found, but BRIX did not treat it as annual property tax. Verify taxes against county records.");
  } else {
    addQuestion("Open county tax records and enter the last three years of property taxes.");
  }
  guarded.missing_questions = questions;

  return guarded;
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
      return { text: "", warning: `The listing page returned HTTP ${response.status}. Unsupported fields will remain blank until readable listing facts or evidence are available.` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { text: "", warning: "The listing page did not return readable content. BRIX will keep unsupported fields blank until readable listing facts or evidence are available." };
    }

    const html = await response.text();
    const text = htmlToReadableListingText(html);
    if (text.length < 80) {
      return { text, warning: "The listing page exposed limited readable content. BRIX will fill supported fields and keep unsupported fields blank." };
    }
    return { text, warning: "" };
  } catch {
    return { text: "", warning: "BRIX could not read that listing page. Unsupported fields will remain blank until readable listing facts or evidence are available." };
  }
}

function htmlToReadableListingText(html: string) {
  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .join("\n");
  const meta = [...html.matchAll(/<meta\s+[^>]*(?:property|name)=["'](?:og:title|og:description|description|twitter:title|twitter:description)["'][^>]*content=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .join("\n");
  const imageMeta = [...html.matchAll(/<meta\s+[^>]*(?:property|name)=["'](?:og:image|twitter:image|image)["'][^>]*content=["']([^"']+)["'][^>]*>/gi)]
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

  return [title, meta, imageMeta, jsonLd, body]
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
    /(?:20\d{2}\s*)?(?:property\s*)?(?:taxes|tax|annual tax|tax amount|tax assessed)[^\d$]{0,40}\$?\s*([\d,]{3,8})/i,
    /\$?\s*([\d,]{3,8})[^\n]{0,40}(?:20\d{2}\s*)?(?:property\s*)?(?:taxes|tax|annual tax)/i,
  ]));
  const taxYear = extractTaxYear(text);

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
    photo_urls: extractPhotoUrls(text),
    missing_questions: [
      "Verify rent comps with a reliable source.",
      taxes ? `${taxYear ? `${taxYear} ` : ""}property tax was found in the listing. Verify it against county records and add prior-year history if available.` : "Verify taxes from official records.",
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
  "property_tax_year": string | null,
  "taxes": number | null,
  "insurance": number | null,
  "beds": number | null,
  "baths": number | null,
  "sqft": number | null,
  "year_built": number | null,
  "condition_notes": string[],
  "visible_or_stated_risks": string[],
  "photo_urls": string[],
  "missing_questions": string[],
  "strategy_primary": string | null (one of: "Buy & Hold", "Fix & Flip", "Wholesale", "BRRRR", "Development", "Owner Occupant"),
  "source_confidence": "low" | "medium" | "high"
}
Only extract facts actually present in the text. Do not invent rent, taxes, ARV, expenses, condition, strategy, or risk values. Put unknown diligence items in missing_questions.
If the listing states a property tax amount or tax year, extract it as listing-stated data. It is acceptable to extract listing-stated taxes, but include a missing_questions item telling the user to verify taxes against county records.
Do not extract insurance from mortgage calculators, payment estimates, affordability widgets, or general listing estimates. Use null unless an actual insurance quote or premium is explicitly supplied by the user.
Do not infer an investment strategy unless the text explicitly states one.
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
    const guarded = applyExtractionGuardrails(merged, deterministic, extractionText, inputText);

    return new Response(JSON.stringify({ extracted: guarded, warning: pageWarning || undefined }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

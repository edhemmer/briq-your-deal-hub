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

function deterministicListingExtract(listingText: string) {
  const text = listingText.replace(/\s+/g, " ").trim();
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
    property_address: addressMatch?.[1] ?? null,
    city: addressMatch?.[2]?.trim() ?? cityStateZip?.[1]?.trim() ?? null,
    state: addressMatch?.[3] ?? cityStateZip?.[2] ?? null,
    zip_code: addressMatch?.[4] ?? cityStateZip?.[3] ?? null,
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
    strategy_primary: /flip|resale/i.test(text) ? "Fix & Flip" : /brrrr/i.test(text) ? "BRRRR" : "Buy & Hold",
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
    const { listing_text } = await req.json();

    if (!listing_text || typeof listing_text !== "string" || listing_text.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Please paste more listing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify(deterministicListingExtract(listing_text)), {
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
            content: `Extract the property deal information from this listing text:\n\n${listing_text.slice(0, 4000)}`
          }
        ],
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify(deterministicListingExtract(listing_text)), {
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

    return new Response(JSON.stringify({ extracted: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

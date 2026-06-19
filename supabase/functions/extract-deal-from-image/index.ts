import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_BASE_URL = (Deno.env.get("AI_GATEWAY_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
const AI_MODEL = Deno.env.get("AI_VISION_MODEL") ?? Deno.env.get("AI_TEXT_MODEL") ?? "gpt-4o-mini";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
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
            content: `You extract real estate property listing and visual due-diligence data from images. Return ONLY valid JSON with these fields (use null for missing values, arrays for notes):
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
Only extract facts visible in the image. For property photos, identify visible concerns such as staining, roof wear, foundation cracks, old panels, water intrusion, deferred maintenance, grading/drainage, or safety issues, but do not diagnose hidden defects. Put unknown diligence items in missing_questions.
Do not include any markdown formatting, code fences, or explanation. Only output the JSON object.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the property deal information from this listing image." },
              { type: "image_url", image_url: { url: image_base64.startsWith("data:") ? image_base64 : `data:image/jpeg;base64,${image_base64}` } }
            ]
          }
        ],
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", errText);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    
    // Parse JSON from response, handling possible markdown fences
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Could not parse listing data", raw: content }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ extracted: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

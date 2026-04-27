// Deterministic ContractIQ extraction:
// - Caller sends raw text (already extracted client-side from PDF/DOCX/XLSX/EML)
//   plus optional file metadata. Or sends image_base64 for OCR-only flows.
// - We call Gemini 2.5 Flash with a strict tool-call schema (temperature 0)
//   so the model is forced to return our canonical fields. No free-form JSON.
// - We compute a SHA-256 hash of the input text so the same input always maps
//   to a stable, traceable extraction record.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CANONICAL_TOOL = {
  type: "function",
  function: {
    name: "extract_contract_fields",
    description:
      "Extract canonical real estate contract fields from the provided document text. " +
      "Use null for any field that is not explicitly stated. Do NOT infer or guess. " +
      "Return monetary values as plain numbers (no currency symbols or commas).",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        contract_type: {
          type: ["string", "null"],
          description:
            "Type of contract, e.g. 'Purchase Agreement', 'LOI', 'Lease', 'Option'.",
        },
        buyer_name: { type: ["string", "null"] },
        seller_name: { type: ["string", "null"] },
        property_address: {
          type: ["string", "null"],
          description: "Full street address including city/state/zip if present.",
        },
        purchase_price: {
          type: ["number", "null"],
          description: "Total purchase price as a number, e.g. 450000.",
        },
        earnest_money: { type: ["number", "null"] },
        closing_date: {
          type: ["string", "null"],
          description: "ISO 8601 date YYYY-MM-DD if a specific closing date is stated.",
        },
        inspection_period_days: {
          type: ["integer", "null"],
          description: "Inspection / due diligence period in days.",
        },
        financing_contingency: {
          type: ["boolean", "null"],
          description: "True if a financing contingency is explicitly present.",
        },
        appraisal_contingency: { type: ["boolean", "null"] },
        inspection_contingency: { type: ["boolean", "null"] },
        confidence: {
          type: "object",
          additionalProperties: false,
          description:
            "Per-field confidence on a 0–1 scale (0 = not found, 1 = explicitly stated).",
          properties: {
            contract_type: { type: "number" },
            buyer_name: { type: "number" },
            seller_name: { type: "number" },
            property_address: { type: "number" },
            purchase_price: { type: "number" },
            earnest_money: { type: "number" },
            closing_date: { type: "number" },
            inspection_period_days: { type: "number" },
            financing_contingency: { type: "number" },
            appraisal_contingency: { type: "number" },
            inspection_contingency: { type: "number" },
          },
          required: [
            "contract_type",
            "buyer_name",
            "seller_name",
            "property_address",
            "purchase_price",
            "earnest_money",
            "closing_date",
            "inspection_period_days",
            "financing_contingency",
            "appraisal_contingency",
            "inspection_contingency",
          ],
        },
        source_excerpts: {
          type: "object",
          additionalProperties: false,
          description:
            "Short verbatim quote (<=160 chars) from the document supporting each populated field. Empty string if the field is null.",
          properties: {
            contract_type: { type: "string" },
            buyer_name: { type: "string" },
            seller_name: { type: "string" },
            property_address: { type: "string" },
            purchase_price: { type: "string" },
            earnest_money: { type: "string" },
            closing_date: { type: "string" },
            inspection_period_days: { type: "string" },
            financing_contingency: { type: "string" },
            appraisal_contingency: { type: "string" },
            inspection_contingency: { type: "string" },
          },
          required: [
            "contract_type",
            "buyer_name",
            "seller_name",
            "property_address",
            "purchase_price",
            "earnest_money",
            "closing_date",
            "inspection_period_days",
            "financing_contingency",
            "appraisal_contingency",
            "inspection_contingency",
          ],
        },
      },
      required: [
        "contract_type",
        "buyer_name",
        "seller_name",
        "property_address",
        "purchase_price",
        "earnest_money",
        "closing_date",
        "inspection_period_days",
        "financing_contingency",
        "appraisal_contingency",
        "inspection_contingency",
        "confidence",
        "source_excerpts",
      ],
    },
  },
};

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const text: string | undefined = body.text;
    const image_base64: string | undefined = body.image_base64;
    const source_files: unknown = body.source_files ?? [];

    if (!text && !image_base64) {
      return new Response(
        JSON.stringify({ error: "Provide `text` or `image_base64`." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cap the text we send to keep latency + cost predictable.
    // Front-loaded + tail-loaded so we capture the parties at the top
    // and signatures/closing terms at the bottom.
    const MAX = 60_000;
    let normalized = text ?? "";
    if (normalized.length > MAX) {
      const head = normalized.slice(0, Math.floor(MAX * 0.7));
      const tail = normalized.slice(-Math.floor(MAX * 0.3));
      normalized = `${head}\n\n...[truncated]...\n\n${tail}`;
    }

    const userContent: Array<Record<string, unknown>> = [];
    if (text) {
      userContent.push({
        type: "text",
        text:
          "Extract canonical contract fields from the document text below. " +
          "Only use information that is explicitly stated. Use null for missing fields.\n\n" +
          "DOCUMENT TEXT:\n" +
          normalized,
      });
    }
    if (image_base64) {
      userContent.push({
        type: "text",
        text:
          "Extract canonical contract fields from the contract image. " +
          "Only use information that is explicitly visible. Use null for missing fields.",
      });
      userContent.push({
        type: "image_url",
        image_url: {
          url: image_base64.startsWith("data:")
            ? image_base64
            : `data:image/jpeg;base64,${image_base64}`,
        },
      });
    }

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                "You are a deterministic real-estate contract parser. Extract only fields that are explicitly present. " +
                "Never infer, estimate, or hallucinate. If a field is not in the document, return null with confidence 0. " +
                "You MUST call the extract_contract_fields tool with the canonical schema.",
            },
            { role: "user", content: userContent },
          ],
          tools: [CANONICAL_TOOL],
          tool_choice: {
            type: "function",
            function: { name: "extract_contract_fields" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in workspace settings.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "AI extraction failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(data).slice(0, 800));
      return new Response(
        JSON.stringify({ error: "Could not parse contract structure" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid extraction payload" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const inputHash = text ? await sha256(text) : null;

    return new Response(
      JSON.stringify({
        extracted,
        meta: {
          model: "google/gemini-2.5-flash",
          temperature: 0,
          input_hash: inputHash,
          input_length: text?.length ?? null,
          had_image: !!image_base64,
          source_files,
          extracted_at: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("extract-contract-from-document error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

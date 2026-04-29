// Deterministic ContractIQ extraction:
// - Caller sends raw text (already extracted client-side from PDF/DOCX/XLSX/EML)
//   plus optional file metadata. Or sends image_base64 for OCR-only flows.
// - We call Gemini 2.5 Flash with a strict tool-call schema (temperature 0)
//   so the model is forced to return our canonical fields. No free-form JSON.
// - The model is ONLY responsible for EXTRACTION (pulling stated text into
//   structured slots). All scoring / pros / cons / questions are computed
//   deterministically downstream by contractIQEngine.ts.

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
      "Extract canonical real estate contract fields and clauses from the provided document text. " +
      "Use null (or empty array) for any field that is not explicitly stated. Do NOT infer or guess. " +
      "Return monetary values as plain numbers (no currency symbols or commas). " +
      "Return dates as YYYY-MM-DD when an explicit date is given.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        // ---- Core deal terms ----
        contract_type: {
          type: ["string", "null"],
          description:
            "Type of contract, e.g. 'Purchase Agreement', 'LOI', 'Lease', 'Option', 'Assignment'.",
        },
        buyer_name: { type: ["string", "null"] },
        seller_name: { type: ["string", "null"] },
        buyer_entity_type: {
          type: ["string", "null"],
          description: "e.g. 'individual', 'LLC', 'trust', 'corporation' if stated.",
        },
        seller_entity_type: { type: ["string", "null"] },
        property_address: {
          type: ["string", "null"],
          description: "Full street address including city/state/zip if present.",
        },
        property_legal_description: {
          type: ["string", "null"],
          description: "Legal description / parcel ID / lot & block if present.",
        },
        purchase_price: {
          type: ["number", "null"],
          description: "Total purchase price as a number, e.g. 450000.",
        },
        earnest_money: { type: ["number", "null"] },
        earnest_money_due_days: {
          type: ["integer", "null"],
          description: "Days after effective date earnest money is due, if stated.",
        },
        down_payment: { type: ["number", "null"] },
        loan_amount: { type: ["number", "null"] },
        seller_concessions: { type: ["number", "null"] },

        // ---- Dates / timeline ----
        effective_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
        closing_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
        possession_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
        inspection_period_days: { type: ["integer", "null"] },
        financing_contingency_days: { type: ["integer", "null"] },
        appraisal_contingency_days: { type: ["integer", "null"] },
        title_review_days: { type: ["integer", "null"] },

        // ---- Contingencies ----
        financing_contingency: { type: ["boolean", "null"] },
        appraisal_contingency: { type: ["boolean", "null"] },
        inspection_contingency: { type: ["boolean", "null"] },
        sale_of_other_home_contingency: { type: ["boolean", "null"] },
        as_is_clause: {
          type: ["boolean", "null"],
          description: "True if property is sold as-is.",
        },

        // ---- Allocations & responsibilities ----
        title_insurance_paid_by: {
          type: ["string", "null"],
          enum: ["buyer", "seller", "split", null],
        },
        survey_paid_by: {
          type: ["string", "null"],
          enum: ["buyer", "seller", "split", null],
        },
        transfer_tax_paid_by: {
          type: ["string", "null"],
          enum: ["buyer", "seller", "split", null],
        },
        hoa_transfer_fee_paid_by: {
          type: ["string", "null"],
          enum: ["buyer", "seller", "split", null],
        },
        home_warranty_paid_by: {
          type: ["string", "null"],
          enum: ["buyer", "seller", "split", null],
        },

        // ---- Risk-bearing clauses (free-text quotes) ----
        special_stipulations: {
          type: "array",
          description:
            "Verbatim text of special stipulations, addenda, or non-standard clauses (each <=400 chars).",
          items: { type: "string" },
        },
        included_personal_property: {
          type: "array",
          description: "Items conveyed (appliances, fixtures, etc.) if listed.",
          items: { type: "string" },
        },
        excluded_personal_property: {
          type: "array",
          description: "Items explicitly excluded from sale.",
          items: { type: "string" },
        },
        seller_disclosures_referenced: {
          type: "array",
          description: "Disclosure documents referenced by name.",
          items: { type: "string" },
        },
        liquidated_damages_clause: {
          type: ["boolean", "null"],
          description: "True if a liquidated damages clause is present.",
        },
        specific_performance_clause: { type: ["boolean", "null"] },
        attorney_review_period_days: { type: ["integer", "null"] },
        assignment_allowed: {
          type: ["boolean", "null"],
          description: "True if buyer can assign the contract.",
        },
        governing_law_state: {
          type: ["string", "null"],
          description: "Two-letter state code if specified.",
        },

        // ---- Confidence & evidence ----
        confidence: {
          type: "object",
          additionalProperties: true,
          description:
            "Per-field confidence on a 0–1 scale (0 = not found, 1 = explicitly stated).",
        },
        source_excerpts: {
          type: "object",
          additionalProperties: true,
          description:
            "Short verbatim quote (<=200 chars) from the document supporting each populated field.",
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
        "special_stipulations",
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
    // Real-estate purchase contracts (incl. addenda) are typically 30–80k chars
    // after PDF text extraction, so we cap at 180k and only truncate the
    // middle if we exceed it. Truncating loses contingency and stipulation
    // language, so we keep both ends generous.
    const MAX = 180_000;
    let normalized = text ?? "";
    if (normalized.length > MAX) {
      const head = normalized.slice(0, Math.floor(MAX * 0.65));
      const tail = normalized.slice(-Math.floor(MAX * 0.35));
      normalized = `${head}\n\n...[truncated middle ${normalized.length - MAX} chars]...\n\n${tail}`;
    }

    const userContent: Array<Record<string, unknown>> = [];
    if (text) {
      userContent.push({
        type: "text",
        text:
          "Extract canonical real-estate contract fields from the document text below.\n\n" +
          "RULES (production-grade, zero tolerance for hallucination):\n" +
          "1. Every populated field MUST be supported by a verbatim quote from the document, returned in source_excerpts[field_name].\n" +
          "2. If a value is not literally written in the document, return null and confidence 0. Do NOT infer party names from email signatures, do NOT infer addresses from headers, do NOT round numbers.\n" +
          "3. Names: copy the exact party name as written (including LLC / Trust / Inc.). Do not strip suffixes.\n" +
          "4. Addresses: copy the full address as written, in one line, with city/state/zip.\n" +
          "5. Money: return as a plain number (450000, not '$450,000.00'). Confidence = 1 only if the dollar amount appears verbatim.\n" +
          "6. Dates: return as YYYY-MM-DD. If the document says 'on or before March 1, 2026', the closing_date is 2026-03-01. If it says 'TBD' or '___', return null.\n" +
          "7. Contingency booleans: true ONLY if the contract explicitly grants that contingency to the buyer. 'Buyer waives financing contingency' = false.\n" +
          "8. special_stipulations: copy each non-standard clause verbatim (one per array entry, ≤400 chars each).\n\n" +
          "DOCUMENT TEXT:\n" + normalized,
      });
    }
    if (image_base64) {
      userContent.push({
        type: "text",
        text:
          "Extract canonical contract fields from the contract image. " +
          "Only use information that is explicitly visible. Use null for missing fields. " +
          "Provide a verbatim source_excerpt for every populated field.",
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
          model: "google/gemini-2.5-pro",
          temperature: 0,
          max_tokens: 12000,
          messages: [
            {
              role: "system",
              content:
                "You are a deterministic real-estate contract parser used in a production legal-tech pipeline. " +
                "Extract only fields that are EXPLICITLY present in the document. " +
                "Never infer, estimate, paraphrase, or hallucinate. " +
                "If a field is not literally stated, return null (or empty array) with confidence 0. " +
                "For every populated field you MUST return a verbatim source_excerpts entry — a copied snippet (≤200 chars) from the document where that exact value appears. " +
                "If you cannot produce a verbatim excerpt, the field is not extractable; return null. " +
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
      // Be defensive — model can return slightly malformed JSON. Strip control
      // chars and try once more before failing.
      const raw = toolCall.function.arguments as string;
      try {
        extracted = JSON.parse(raw);
      } catch {
        const cleaned = raw.replace(/[\x00-\x1F\x7F]/g, "").replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        extracted = JSON.parse(cleaned);
      }
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
          model: "google/gemini-2.5-pro",
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

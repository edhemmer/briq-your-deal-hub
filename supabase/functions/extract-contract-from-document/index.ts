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

const AI_BASE_URL = (Deno.env.get("AI_GATEWAY_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
const AI_MODEL = Deno.env.get("AI_CONTRACT_MODEL") ?? Deno.env.get("AI_TEXT_MODEL") ?? "gpt-4o";

const PAID_BY_ENUM = ["buyer", "seller", "split", null];

const CANONICAL_TOOL = {
  type: "function",
  function: {
    name: "extract_contract_fields",
    description:
      "Extract canonical real-estate contract fields, deal structure, tax allocation, prorations, commercial terms, and option/wholesale terms. " +
      "Use null (or empty array) for any field not explicitly stated. Do NOT infer. Money as plain numbers. Dates as YYYY-MM-DD.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        // Core
        contract_type: { type: ["string", "null"], description: "e.g. 'Purchase Agreement','LOI','Option','Lease-Option','Assignment','Wholesale Assignment','1031 Exchange Addendum','Commercial PSA','Land Contract','Installment Sale'." },
        deal_structure: {
          type: ["string", "null"],
          enum: [
            "cash","conventional","fha","va","hard_money","private_lender",
            "seller_financing","subject_to","wrap_mortgage","assumption",
            "lease_option","option_to_purchase","assignment_wholesale",
            "1031_exchange","installment_sale","joint_venture","auction",
            "reverse_exchange","build_to_suit","unknown",null,
          ],
          description: "Best-fit transaction structure. Distinguish option (right to buy at strike for a period) from lease-option (lease + option) from assignment/wholesale (transfer of contract rights).",
        },
        buyer_name: { type: ["string", "null"] },
        seller_name: { type: ["string", "null"] },
        buyer_entity_type: { type: ["string", "null"], description: "individual, LLC, trust, corporation, partnership, etc." },
        seller_entity_type: { type: ["string", "null"] },
        property_address: { type: ["string", "null"] },
        property_legal_description: { type: ["string", "null"] },
        parcel_id: { type: ["string", "null"], description: "APN / PIN / tax parcel ID." },
        property_use: { type: ["string", "null"], description: "residential, multifamily, commercial, mixed-use, industrial, land." },

        purchase_price: { type: ["number", "null"] },
        earnest_money: { type: ["number", "null"] },
        earnest_money_due_days: { type: ["integer", "null"] },
        earnest_money_hard_date: { type: ["string", "null"], description: "YYYY-MM-DD. Date EM goes hard / non-refundable, if stated." },
        earnest_money_holder: { type: ["string", "null"], description: "Title company / escrow / broker holding EM." },
        down_payment: { type: ["number", "null"] },
        loan_amount: { type: ["number", "null"] },
        seller_concessions: { type: ["number", "null"] },

        effective_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
        closing_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
        possession_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
        inspection_period_days: { type: ["integer", "null"] },
        financing_contingency_days: { type: ["integer", "null"] },
        appraisal_contingency_days: { type: ["integer", "null"] },
        title_review_days: { type: ["integer", "null"] },
        attorney_review_period_days: { type: ["integer", "null"] },
        due_diligence_period_days: { type: ["integer", "null"], description: "Commercial DD window if separate from inspection." },

        financing_contingency: { type: ["boolean", "null"] },
        appraisal_contingency: { type: ["boolean", "null"] },
        inspection_contingency: { type: ["boolean", "null"] },
        sale_of_other_home_contingency: { type: ["boolean", "null"] },
        as_is_clause: { type: ["boolean", "null"] },
        time_is_of_essence: { type: ["boolean", "null"] },
        per_diem_late_close: { type: ["number", "null"], description: "Per-diem penalty for late closing." },
        post_close_occupancy_days: { type: ["integer", "null"], description: "Seller post-close occupancy / rent-back days." },
        post_close_occupancy_rent: { type: ["number", "null"] },

        // Closing accounting
        title_insurance_paid_by: { type: ["string", "null"], enum: PAID_BY_ENUM },
        owners_title_policy: { type: ["boolean", "null"] },
        lenders_title_policy: { type: ["boolean", "null"] },
        survey_paid_by: { type: ["string", "null"], enum: PAID_BY_ENUM },
        survey_type: { type: ["string", "null"], description: "ALTA, boundary, none." },
        transfer_tax_paid_by: { type: ["string", "null"], enum: PAID_BY_ENUM },
        transfer_tax_amount: { type: ["number", "null"] },
        recordation_tax_paid_by: { type: ["string", "null"], enum: PAID_BY_ENUM },
        recordation_tax_amount: { type: ["number", "null"] },
        mansion_tax_applies: { type: ["boolean", "null"], description: "NY/NJ/CA mansion tax (typically >$1M)." },
        documentary_stamps_paid_by: { type: ["string", "null"], enum: PAID_BY_ENUM },
        hoa_transfer_fee_paid_by: { type: ["string", "null"], enum: PAID_BY_ENUM },
        hoa_assessments_outstanding: { type: ["number", "null"] },
        home_warranty_paid_by: { type: ["string", "null"], enum: PAID_BY_ENUM },
        home_warranty_amount: { type: ["number", "null"] },
        escrow_fee_split: { type: ["string", "null"], enum: PAID_BY_ENUM },
        attorney_fees_paid_by: { type: ["string", "null"], enum: PAID_BY_ENUM },

        // Prorations
        proration_method: { type: ["string", "null"], enum: ["calendar_day", "30_360", null] },
        property_tax_proration: { type: ["boolean", "null"] },
        rent_proration: { type: ["boolean", "null"] },
        utilities_proration: { type: ["boolean", "null"] },
        hoa_dues_proration: { type: ["boolean", "null"] },
        insurance_proration: { type: ["boolean", "null"] },
        tax_proration_basis: { type: ["string", "null"], description: "last_known, current_year_estimate, or supplemental." },

        // Tax structure
        is_1031_exchange: { type: ["boolean", "null"] },
        exchange_party: { type: ["string", "null"], description: "buyer, seller, or both." },
        qualified_intermediary: { type: ["string", "null"] },
        firpta_applies: { type: ["boolean", "null"], description: "True if seller is foreign person and FIRPTA withholding required." },
        firpta_withholding_pct: { type: ["number", "null"] },
        responsible_for_1099s: { type: ["string", "null"], description: "buyer, seller, or closing_agent." },
        opportunity_zone: { type: ["boolean", "null"] },

        // Closing agent
        title_company: { type: ["string", "null"] },
        escrow_holder: { type: ["string", "null"] },
        closing_agent: { type: ["string", "null"] },
        deed_form: { type: ["string", "null"], description: "warranty, special_warranty, quitclaim, grant, bargain_sale, trustee." },

        // Broker / commissions
        listing_broker: { type: ["string", "null"] },
        buyer_broker: { type: ["string", "null"] },
        broker_commission_pct: { type: ["number", "null"] },
        broker_commission_amount: { type: ["number", "null"] },
        commission_paid_by: { type: ["string", "null"], enum: PAID_BY_ENUM },
        dual_agency_disclosed: { type: ["boolean", "null"] },

        // Financing detail
        financing_type: { type: ["string", "null"] },
        interest_rate_max: { type: ["number", "null"], description: "Max rate buyer will accept under financing contingency." },
        loan_program: { type: ["string", "null"] },
        seller_carry_amount: { type: ["number", "null"] },
        seller_carry_rate: { type: ["number", "null"] },
        seller_carry_term_years: { type: ["number", "null"] },
        balloon_payment: { type: ["boolean", "null"] },
        prepayment_penalty: { type: ["boolean", "null"] },

        // Option / lease-option / wholesale
        option_fee: { type: ["number", "null"] },
        option_period_days: { type: ["integer", "null"] },
        option_strike_price: { type: ["number", "null"] },
        option_fee_credited: { type: ["boolean", "null"], description: "True if option fee credits against purchase price at exercise." },
        extension_fee: { type: ["number", "null"] },
        extension_periods: { type: ["integer", "null"] },
        assignment_fee: { type: ["number", "null"], description: "Wholesaler / assignor fee." },
        rent_credit_to_purchase: { type: ["number", "null"], description: "Monthly rent credit in a lease-option." },
        monthly_rent_lease_option: { type: ["number", "null"] },

        // Commercial / investment
        rent_roll_attached: { type: ["boolean", "null"] },
        estoppel_required: { type: ["boolean", "null"] },
        snda_required: { type: ["boolean", "null"] },
        existing_leases_assigned: { type: ["boolean", "null"] },
        security_deposits_amount: { type: ["number", "null"] },
        cam_reconciliation: { type: ["boolean", "null"] },
        environmental_phase_required: { type: ["boolean", "null"] },
        environmental_indemnity: { type: ["boolean", "null"] },

        // Risk shifting
        liquidated_damages_clause: { type: ["boolean", "null"] },
        specific_performance_clause: { type: ["boolean", "null"] },
        assignment_allowed: { type: ["boolean", "null"] },
        right_of_first_refusal: { type: ["boolean", "null"] },
        right_of_first_offer: { type: ["boolean", "null"] },
        mediation_required: { type: ["boolean", "null"] },
        arbitration_required: { type: ["boolean", "null"] },
        jurisdiction_venue: { type: ["string", "null"] },
        governing_law_state: { type: ["string", "null"], description: "Two-letter state code." },

        // Free-text arrays
        special_stipulations: { type: "array", items: { type: "string" }, description: "Verbatim non-standard clauses." },
        included_personal_property: { type: "array", items: { type: "string" } },
        excluded_personal_property: { type: "array", items: { type: "string" } },
        seller_disclosures_referenced: { type: "array", items: { type: "string" } },
        addenda_referenced: { type: "array", items: { type: "string" } },

        confidence: { type: "object", additionalProperties: true, description: "Per-field 0-1 confidence." },
        source_excerpts: { type: "object", additionalProperties: true, description: "Verbatim ≤200-char quote per populated field." },
      },
      required: [
        "contract_type","deal_structure","buyer_name","seller_name","property_address",
        "purchase_price","earnest_money","closing_date","inspection_period_days",
        "financing_contingency","appraisal_contingency","inspection_contingency",
        "special_stipulations","confidence","source_excerpts",
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

const moneyValue = (value: string | undefined | null) => {
  if (!value) return null;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const excerptFor = (text: string, value: string | number | null) => {
  if (value == null) return undefined;
  const needle = String(value).replace(/[$,\s]/g, "");
  const compactText = text.replace(/\s+/g, " ");
  const idx = compactText.toLowerCase().indexOf(String(value).toLowerCase());
  if (idx >= 0) return compactText.slice(Math.max(0, idx - 80), idx + String(value).length + 80);
  if (typeof value === "number") {
    const match = compactText.match(new RegExp(`\\$?\\s*${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/(\d)(?=(\d{3})+$)/g, "$1,?")}`));
    if (match?.index != null) return compactText.slice(Math.max(0, match.index - 80), match.index + match[0].length + 80);
  }
  return undefined;
};

function deterministicContractExtract(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const pick = (patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return null;
  };
  const purchasePrice = moneyValue(pick([
    /(?:purchase price|price)[^\d$]{0,40}\$?\s*([\d,]{5,12})/i,
    /\$\s*([\d,]{5,12})/i,
  ]));
  const earnestMoney = moneyValue(pick([
    /(?:earnest money|initial deposit|deposit)[^\d$]{0,40}\$?\s*([\d,]{3,12})/i,
  ]));
  const propertyAddress = pick([
    /(?:property(?: address)?|premises|real property)[\s:,-]+(.{8,140}?)(?:\.|;|\n| purchase price| buyer| seller)/i,
    /\b(\d{1,6}\s+[A-Za-z0-9.' -]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Cir|Circle|Way|Blvd|Boulevard|Pl|Place|Ter|Terrace|Trl|Trail)\b[^.;\n]{0,90})/i,
  ]);
  const buyerName = pick([/(?:buyer|purchaser)[\s:]+([A-Z][A-Za-z0-9 &.,'-]{2,100}?)(?:\s+(?:seller|property|agrees|and)|;|\.|, as)/i]);
  const sellerName = pick([/(?:seller|vendor)[\s:]+([A-Z][A-Za-z0-9 &.,'-]{2,100}?)(?:\s+(?:buyer|property|agrees|and)|;|\.|, as)/i]);
  const closingDate = pick([/(?:closing date|date of closing|close of escrow)[^\d]{0,30}(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i]);
  const inspectionDaysRaw = pick([/(?:inspection period|due diligence period)[^\d]{0,30}(\d{1,3})\s*(?:days?)/i]);
  const inspectionDays = inspectionDaysRaw ? Number(inspectionDaysRaw) : null;
  const financingContingency = /financing contingency|mortgage contingency|loan contingency/i.test(normalized)
    ? !/waiv(?:e|es|ed)\s+(?:the\s+)?(?:financing|mortgage|loan)\s+contingency/i.test(normalized)
    : null;
  const appraisalContingency = /appraisal contingency/i.test(normalized)
    ? !/waiv(?:e|es|ed)\s+(?:the\s+)?appraisal\s+contingency/i.test(normalized)
    : null;
  const inspectionContingency = /inspection contingency|inspection period/i.test(normalized)
    ? !/waiv(?:e|es|ed)\s+(?:the\s+)?inspection\s+contingency/i.test(normalized)
    : null;

  const confidence: Record<string, number> = {};
  const source_excerpts: Record<string, string> = {};
  const addEvidence = (key: string, value: string | number | boolean | null) => {
    if (value == null) {
      confidence[key] = 0;
      return;
    }
    confidence[key] = typeof value === "boolean" ? 0.4 : 0.55;
    const excerpt = excerptFor(normalized, typeof value === "boolean" ? key.replace(/_/g, " ") : value);
    if (excerpt) source_excerpts[key] = excerpt.slice(0, 200);
  };

  const extracted = {
    contract_type: /letter of intent|\bLOI\b/i.test(normalized) ? "LOI" : "Purchase Agreement",
    deal_structure: /seller financ|seller carry/i.test(normalized) ? "seller_financing" : /cash/i.test(normalized) ? "cash" : "unknown",
    buyer_name: buyerName,
    seller_name: sellerName,
    buyer_entity_type: null,
    seller_entity_type: null,
    property_address: propertyAddress,
    property_legal_description: null,
    parcel_id: null,
    property_use: null,
    purchase_price: purchasePrice,
    earnest_money: earnestMoney,
    earnest_money_due_days: null,
    earnest_money_hard_date: null,
    earnest_money_holder: null,
    down_payment: null,
    loan_amount: null,
    seller_concessions: null,
    effective_date: null,
    closing_date: closingDate,
    possession_date: null,
    inspection_period_days: inspectionDays,
    financing_contingency_days: null,
    appraisal_contingency_days: null,
    title_review_days: null,
    attorney_review_period_days: null,
    due_diligence_period_days: null,
    financing_contingency: financingContingency,
    appraisal_contingency: appraisalContingency,
    inspection_contingency: inspectionContingency,
    sale_of_other_home_contingency: null,
    as_is_clause: /as-is|as is/i.test(normalized) ? true : null,
    time_is_of_essence: /time is of the essence/i.test(normalized) ? true : null,
    special_stipulations: [],
    included_personal_property: [],
    excluded_personal_property: [],
    seller_disclosures_referenced: [],
    addenda_referenced: [],
    confidence,
    source_excerpts,
  };

  for (const [key, value] of Object.entries(extracted)) {
    if (key !== "confidence" && key !== "source_excerpts" && !Array.isArray(value)) addEvidence(key, value as string | number | boolean | null);
  }

  return extracted;
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

    const apiKey = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      const fallback = text ? deterministicContractExtract(text) : null;
      return new Response(
        JSON.stringify({
          extracted: fallback,
          meta: {
            model: "deterministic-fallback",
            warning: "AI extraction is not configured. BRIX extracted only obvious fields with low confidence.",
            input_hash: text ? await sha256(text) : null,
            input_length: text?.length ?? null,
            had_image: !!image_base64,
            source_files,
            extracted_at: new Date().toISOString(),
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
          "You are reading a real-estate transaction document as an experienced real-estate paralegal would. " +
          "Identify the deal structure (cash, conventional, FHA/VA, hard-money, seller-financing, subject-to, wrap, assumption, " +
          "lease-option, pure option, wholesale assignment, 1031 exchange, installment sale, JV, auction, build-to-suit). " +
          "Extract every closing accounting line (title, survey, transfer/recordation tax, mansion tax, doc stamps, escrow, attorney, HOA transfer, warranty) " +
          "and proration item (taxes, rent, utilities, HOA, insurance) with the responsible party as written. " +
          "Capture FIRPTA, 1031 intermediary, 1099-S responsibility, opportunity zone, option fee + strike + period + credit, assignment fee, " +
          "rent-credit, lease-option monthly rent, seller-carry terms (amount/rate/term/balloon/prepay), commercial diligence items " +
          "(rent roll, estoppels, SNDA, security deposits, CAM reconciliation, environmental Phase I, indemnity), and risk-shifting clauses " +
          "(ROFR/ROFO, mediation/arbitration, venue, time-is-of-essence, per-diem late fees).\n\n" +
          "RULES (zero tolerance for hallucination):\n" +
          "1. Every populated field MUST be supported by a verbatim quote in source_excerpts[field_name].\n" +
          "2. If a value is not literally written, return null and confidence 0. Never infer.\n" +
          "3. Names: copy verbatim including LLC / Trust / Inc. Do not strip suffixes.\n" +
          "4. Addresses: copy full address as written including city/state/zip.\n" +
          "5. Money: plain number (450000, not '$450,000'). Confidence 1 only if amount appears verbatim.\n" +
          "6. Dates: YYYY-MM-DD. 'TBD' / blanks return null.\n" +
          "7. Contingencies: true only if explicitly granted to buyer. 'Buyer waives' = false.\n" +
          "8. deal_structure: pick the single best fit; if cash + 1031 addendum present and exchange_party is seller, deal_structure may still be 'cash'.\n" +
          "9. special_stipulations: copy each non-standard clause verbatim (≤400 chars each).\n\n" +
          "DOCUMENT TEXT:\n" + normalized,
      });
    }
    if (image_base64) {
      userContent.push({
        type: "text",
        text:
          "Extract canonical contract fields from the contract image at paralegal level. " +
          "Only use information explicitly visible. Use null for missing fields. " +
          "Provide a verbatim source_excerpt for every populated field.",
      });
      userContent.push({
        type: "image_url",
        image_url: {
          url: image_base64.startsWith("data:") ? image_base64 : `data:image/jpeg;base64,${image_base64}`,
        },
      });
    }

    const aiResp = await fetch(
      `${AI_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODEL,
          temperature: 0,
          max_tokens: 16000,
          messages: [
            {
              role: "system",
              content:
                "You are a senior real-estate paralegal extraction engine used in a production legal-tech pipeline. " +
                "You understand residential, multifamily, commercial, land, option, lease-option, wholesale, sub-to, seller-carry, " +
                "1031, installment sale, and JV structures, plus FIRPTA, mansion tax, transfer/recordation tax, prorations, and " +
                "commercial diligence (estoppels, SNDA, rent roll, CAM, Phase I). " +
                "Extract ONLY fields explicitly present. Never infer, estimate, paraphrase, or hallucinate. " +
                "For every populated field return a verbatim source_excerpts entry (≤200 chars). " +
                "If you cannot produce a verbatim excerpt, the field is not extractable; return null. " +
                "You MUST call the extract_contract_fields tool with the canonical schema.",
            },
            { role: "user", content: userContent },
          ],
          tools: [CANONICAL_TOOL],
          tool_choice: { type: "function", function: { name: "extract_contract_fields" } },
        }),
      },
    );

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        const fallback = text ? deterministicContractExtract(text) : null;
        return new Response(
          JSON.stringify({
            extracted: fallback,
            meta: {
              model: "deterministic-fallback",
              warning: "AI rate limit reached. BRIX extracted only obvious fields with low confidence.",
              input_hash: text ? await sha256(text) : null,
              input_length: text?.length ?? null,
              had_image: !!image_base64,
              source_files,
              extracted_at: new Date().toISOString(),
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        const fallback = text ? deterministicContractExtract(text) : null;
        return new Response(
          JSON.stringify({
            extracted: fallback,
            meta: {
              model: "deterministic-fallback",
              warning: "AI credits are unavailable. BRIX extracted only obvious fields with low confidence.",
              input_hash: text ? await sha256(text) : null,
              input_length: text?.length ?? null,
              had_image: !!image_base64,
              source_files,
              extracted_at: new Date().toISOString(),
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        const cleaned = Array.from(raw)
          .filter((char) => {
            const code = char.charCodeAt(0);
            return (code >= 32 && code !== 127) || char === "\n" || char === "\r" || char === "\t";
          })
          .join("")
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]");
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
          model: AI_MODEL,
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

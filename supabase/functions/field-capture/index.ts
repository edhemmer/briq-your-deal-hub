import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FieldCaptureBody = {
  deal_id?: string;
  property_twin_id?: string;
  local_identifier?: string;
  capture_type?: string;
  note?: string;
  storage_path?: string;
  created_at?: string;
  latitude?: number;
  longitude?: number;
};

const allowedCaptureTypes = new Set([
  "photo",
  "video",
  "document_scan",
  "voice_note",
  "inspection_report",
  "contractor_estimate",
]);

const AI_BASE_URL = (Deno.env.get("AI_GATEWAY_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
const AI_MODEL = Deno.env.get("AI_VISION_MODEL") ?? Deno.env.get("AI_TEXT_MODEL") ?? "gpt-4o-mini";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Supabase environment is not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Missing authorization header" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Invalid session" }, 401);
  }

  const body = (await req.json().catch(() => ({}))) as FieldCaptureBody;
  const captureType = normalizeCaptureType(body.capture_type);
  if (!allowedCaptureTypes.has(captureType)) {
    return json({ error: "Unsupported capture type" }, 400);
  }

  if (!body.deal_id && !body.property_twin_id) {
    return json({ error: "A deal_id or property_twin_id is required" }, 400);
  }

  if (body.deal_id) {
    const { data: deal, error: dealError } = await adminClient
      .from("deals")
      .select("id")
      .eq("id", body.deal_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (dealError || !deal) {
      return json({ error: "Deal was not found for this user" }, 404);
    }
  }

  if (body.property_twin_id) {
    const { data: twin, error: twinError } = await adminClient
      .from("property_digital_twins")
      .select("id")
      .eq("id", body.property_twin_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (twinError || !twin) {
      return json({ error: "Property record was not found for this user" }, 404);
    }
  }

  if (body.storage_path && !body.storage_path.startsWith(`${userData.user.id}/`)) {
    return json({ error: "Storage path must be scoped to the signed-in user" }, 400);
  }

  const { data, error } = await adminClient
    .from("brix_field_captures")
    .insert({
      user_id: userData.user.id,
      deal_id: body.deal_id ?? null,
      property_twin_id: body.property_twin_id ?? null,
      capture_type: captureType,
      storage_path: body.storage_path || null,
      local_identifier: body.local_identifier || null,
      user_note: body.note ? String(body.note).slice(0, 5000) : null,
      latitude: typeof body.latitude === "number" ? body.latitude : null,
      longitude: typeof body.longitude === "number" ? body.longitude : null,
      captured_at: body.created_at || new Date().toISOString(),
      uploaded_at: new Date().toISOString(),
      sync_status: "synced",
      source_quality: "user_entered",
      verification_recommendation: "Review uploaded evidence before relying on visual findings.",
    })
    .select("id, deal_id, property_twin_id, capture_type, storage_path, sync_status, created_at")
    .single();

  if (error) {
    console.error("Failed to record field capture:", error);
    return json({ error: "Could not record field capture" }, 500);
  }

  let analysis: VisualAnalysisResult | null = null;
  if (captureType === "photo" && body.storage_path) {
    analysis = await analyzeStoredCapture(adminClient, body.storage_path);
    if (analysis) {
      const { error: updateError } = await adminClient
        .from("brix_field_captures")
        .update({
          ai_findings: analysis.findings,
          confidence_score: analysis.confidence_score,
          severity: analysis.severity,
          verification_recommendation: analysis.verification_recommendation,
          source_quality: "ai_generated_requires_verification",
        })
        .eq("id", data.id)
        .eq("user_id", userData.user.id);

      if (updateError) {
        console.error("Failed to attach visual findings:", updateError);
      }
    }
  }

  return json({ fieldCapture: { ...data, ai_findings: analysis?.findings ?? [] }, status: "synced", analysis_status: analysis ? "completed" : "not_run" });
});

function normalizeCaptureType(value?: string) {
  const normalized = String(value ?? "photo").trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized === "document") return "document_scan";
  if (normalized === "voice") return "voice_note";
  if (normalized === "general_note") return "photo";
  return normalized;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type VisualAnalysisResult = {
  findings: Array<{
    area: string;
    finding: string;
    evidence: string;
    severity: "critical" | "important" | "informational";
    confidence: number;
    limitation: string;
    recommended_action: string;
  }>;
  confidence_score: number;
  severity: "critical" | "important" | "informational";
  verification_recommendation: string;
};

async function analyzeStoredCapture(adminClient: any, storagePath: string): Promise<VisualAnalysisResult | null> {
  const apiKey = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const { data: signed, error } = await adminClient.storage
    .from("field-captures")
    .createSignedUrl(storagePath, 60);

  if (error || !signed?.signedUrl) {
    console.error("Could not create signed URL for visual analysis:", error);
    return null;
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
          content: `You review property field photos for real estate acquisition due diligence. Perform a detailed visual triage pass and report every visible, supportable concern or opportunity you can identify from the image. Return ONLY valid JSON:
{
  "findings": [
    {
      "area": "Exterior | Roof | Foundation | Interior | Plumbing | Electrical | HVAC | Safety | Site | Unknown",
      "finding": "specific visible observation with the visual evidence that supports it",
      "evidence": "what is visible in the image that supports this finding",
      "severity": "critical | important | informational",
      "confidence": number 0-100,
      "limitation": "what cannot be confirmed from this photo",
      "recommended_action": "specific verification step"
    }
  ],
  "confidence_score": number 0-100,
  "severity": "critical | important | informational",
  "verification_recommendation": "plain language next step"
}
Review checklist:
- Exterior: roof wear, siding damage, windows, gutters, drainage, grading, foundation visibility, site hazards.
- Interior: staining, water intrusion indicators, ceiling/wall/floor damage, outdated finishes, deferred maintenance, layout/value-add clues.
- Systems if visible: HVAC age/condition clues, electrical panel/wiring concerns, plumbing/water heater clues.
- Safety: trip hazards, missing railings, exposed wiring, blocked access, visible fire/life-safety concerns.
- Renovation: cosmetic refresh, functional obsolescence, capital repair indicators, scope clues.
Rules: identify visible concerns or opportunities only. Be thorough, but do not invent issues. Do not diagnose mold, structural failure, code violations, roof failure, electrical safety, or hidden conditions. Use language like "possible", "visible indicator", or "requires verification" where appropriate. If image quality, angle, or lighting limits review, say so and lower confidence. Prefer many specific findings over one generic summary when the image supports them. Include at least one limitation for every finding so the investor knows what the photo cannot prove.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Review this property field photo and return visual due-diligence findings." },
            { type: "image_url", image_url: { url: signed.signedUrl } },
          ],
        },
      ],
      max_tokens: 1800,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    console.error("Visual analysis failed:", await response.text());
    return null;
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(String(content).replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    const findings = Array.isArray(parsed.findings) ? parsed.findings.slice(0, 20).map(normalizeFinding) : [];
    return {
      findings,
      confidence_score: clampNumber(parsed.confidence_score, 0, 100) ?? aggregateConfidence(findings),
      severity: normalizeSeverity(parsed.severity),
      verification_recommendation: typeof parsed.verification_recommendation === "string"
        ? parsed.verification_recommendation.slice(0, 500)
        : "Verify visual findings during due diligence before relying on them.",
    };
  } catch (err) {
    console.error("Could not parse visual analysis:", err, content);
    return null;
  }
}

function normalizeFinding(item: Record<string, unknown>) {
  return {
    area: typeof item.area === "string" ? item.area.slice(0, 80) : "Unknown",
    finding: typeof item.finding === "string" ? item.finding.slice(0, 500) : "Visible condition requires verification.",
    evidence: typeof item.evidence === "string" ? item.evidence.slice(0, 500) : "Visible evidence was not specified by the model.",
    severity: normalizeSeverity(item.severity),
    confidence: clampNumber(item.confidence, 0, 100) ?? 50,
    limitation: typeof item.limitation === "string"
      ? item.limitation.slice(0, 500)
      : "This photo cannot confirm hidden conditions or replace professional inspection.",
    recommended_action: typeof item.recommended_action === "string"
      ? item.recommended_action.slice(0, 500)
      : "Verify with inspection or qualified professional review.",
  };
}

function normalizeSeverity(value: unknown): "critical" | "important" | "informational" {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "critical") return "critical";
  if (normalized === "important") return "important";
  return "informational";
}

function clampNumber(value: unknown, min: number, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function aggregateConfidence(findings: Array<{ confidence: number }>) {
  if (!findings.length) return 40;
  return Math.round(findings.reduce((sum, item) => sum + item.confidence, 0) / findings.length);
}

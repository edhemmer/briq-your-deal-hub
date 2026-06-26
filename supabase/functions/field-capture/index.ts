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

  return json({ fieldCapture: data, status: "synced" });
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

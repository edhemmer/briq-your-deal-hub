import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Authentication required." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const userScopedKey = Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRoleKey;

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const userScoped = createClient(supabaseUrl, userScopedKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
  if (userError || !userData.user) return json({ error: "Authentication required." }, 401);

  const source = sourceFromRequest(req);
  const { data, error } = await userScoped.rpc("request_brix_account_deletion", { request_source: source });
  if (error) return json({ error: safeError(error.message) }, statusForError(error.message));

  const request = Array.isArray(data) ? data[0] : data;
  return json({
    ok: true,
    requestId: request?.request_id ?? null,
    status: request?.status ?? "requested",
    requestedAt: request?.requested_at ?? null,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function sourceFromRequest(req: Request) {
  const raw = req.headers.get("x-brix-client") ?? "web";
  const source = raw.toLowerCase();
  return source === "ios" || source === "ipad" ? source : "web";
}

function safeError(message = "") {
  const lower = message.toLowerCase();
  if (lower.includes("authentication") || lower.includes("permission") || lower.includes("42501")) return "Authentication required.";
  return "BRIX could not record the account deletion request. Try again.";
}

function statusForError(message = "") {
  const lower = message.toLowerCase();
  return lower.includes("authentication") || lower.includes("permission") || lower.includes("42501") ? 401 : 400;
}

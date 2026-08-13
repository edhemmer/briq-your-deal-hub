import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const allowedOrigins = new Set([
  "https://brixrealestate.app",
  "https://www.brixrealestate.app",
  "http://localhost:3000",
  "http://localhost:8080",
]);

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") {
    if (!headers["Access-Control-Allow-Origin"]) return json({ error: "Origin is not allowed." }, 403, headers);
    return new Response("ok", { headers });
  }
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Method not allowed." }, 405, headers);

  const supabaseURL = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseURL || !anonKey || !serviceRoleKey) return json({ error: "Admin controls are not configured." }, 503, headers);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authHeader)) return json({ error: "Authentication required." }, 401, headers);
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const userClient = createClient(supabaseURL, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseURL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Authentication required." }, 401, headers);

  const { data: profile, error: profileError } = await adminClient
    .from("brix_profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) return json({ error: "BRIX could not verify admin access." }, 503, headers);
  if (!["admin", "superadmin", "developer"].includes(profile?.role ?? "")) return json({ error: "Admin access required." }, 403, headers);

  const [usersResult, dealsResult, deletesResult] = await Promise.all([
    adminClient.from("brix_profiles").select("*", { count: "exact", head: true }),
    adminClient.from("brix_deals").select("*", { count: "exact", head: true }),
    adminClient.from("brix_profiles").select("*", { count: "exact", head: true }).not("account_delete_requested_at", "is", null),
  ]);

  if (usersResult.error || dealsResult.error || deletesResult.error) {
    return json({ error: "BRIX could not load admin metrics." }, 503, headers);
  }

  return json({
    users: usersResult.count ?? 0,
    deals: dealsResult.count ?? 0,
    deletionRequests: deletesResult.count ?? 0,
  }, 200, headers);
});

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
  if (allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...extraHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

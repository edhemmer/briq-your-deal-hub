import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) return json({ error: "Authentication required." }, 401);
  const { data: profile } = await supabase.from("brix_profiles").select("role").eq("id", userData.user.id).single();
  if (!["admin", "superadmin", "developer"].includes(profile?.role)) return json({ error: "Admin access required." }, 403);

  const [{ count: users }, { count: deals }, { count: deletes }] = await Promise.all([
    supabase.from("brix_profiles").select("*", { count: "exact", head: true }),
    supabase.from("brix_deals").select("*", { count: "exact", head: true }),
    supabase.from("brix_profiles").select("*", { count: "exact", head: true }).not("account_delete_requested_at", "is", null),
  ]);

  return json({ users: users ?? 0, deals: deals ?? 0, deletionRequests: deletes ?? 0 });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

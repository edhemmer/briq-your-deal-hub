import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  return new Response(JSON.stringify({
    error: "canonical_analysis_required",
    message: "Use the canonical underwriting snapshot/output, strategy, and Decision Cockpit contracts.",
  }), {
    status: 409,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});

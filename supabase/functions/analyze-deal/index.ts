import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { deal = {} } = await req.json();
    const facts = deal.facts ?? deal;
    const missing = ["address", "listPrice", "annualTaxes", "annualInsurance"].filter((key) => !facts[key] && !deal[key]);
    if ((deal.strategy_id ?? deal.strategyId) !== "owner_occupant" && !facts.monthlyRent) missing.push("monthlyRent");
    const score = Math.max(0, Math.min(100, 86 - missing.length * 12));
    return json({
      decision: score >= 78 ? "Visit" : score >= 55 ? "Research first" : "Do not visit yet",
      confidence: score,
      readiness: Math.max(0, 100 - missing.length * 15),
      missing,
      next_actions: missing.map((item) => `Add or verify ${item}.`),
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to analyze deal." }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

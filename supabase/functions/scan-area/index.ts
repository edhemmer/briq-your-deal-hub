import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { address = "", city = "", state = "", zip = "" } = await req.json();
  const origin = [address, city, state, zip].filter(Boolean).join(" ");
  const needs = ["hospital", "grocery", "pharmacy", "highway access", "airport"];
  return json({
    origin,
    checks: needs.map((need) => ({
      need,
      map_url: `https://www.google.com/maps/search/${encodeURIComponent(`${need} near ${origin}`)}`,
      status: "verify_on_map",
    })),
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

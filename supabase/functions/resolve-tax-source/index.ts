import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { address = "", city = "", state = "", county = "" } = await req.json();
    const query = [county, state, address, city, "property tax records"].filter(Boolean).join(" ");
    return json({
      status: "source_required",
      search_url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      message: "Open the county tax source and verify annual taxes before relying on cash flow.",
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to resolve tax source." }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

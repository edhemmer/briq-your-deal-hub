import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { file_names = [], notes = "" } = await req.json();
  const source = `${(file_names as string[]).join(" ")} ${notes}`;
  const findings = [
    [/roof|shingle|gutter/i, "Roof / drainage", "Verify age, wear, drainage, and request inspection."],
    [/foundation|basement|crack/i, "Foundation / basement", "Require professional review before relying on scope or price."],
    [/water|mold|stain|ceiling/i, "Moisture", "Verify source, extent, and remediation requirements."],
    [/hvac|furnace|ac|condenser/i, "HVAC", "Confirm age, service history, and replacement exposure."],
    [/electric|panel|breaker/i, "Electrical", "Verify panel condition, capacity, and safety concerns."],
    [/kitchen|bath|floor|paint/i, "Interior scope", "Estimate cosmetic scope and material quality."],
  ].filter(([pattern]) => (pattern as RegExp).test(source)).map(([, area, action]) => ({ severity: "Review", area, action }));
  return json({ findings, confidence: findings.length ? 70 : 35, requires_inspection: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

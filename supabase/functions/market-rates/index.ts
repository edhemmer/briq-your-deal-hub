// Public, read-only market rates for BRIX underwriting defaults.
// Source: Freddie Mac Primary Mortgage Market Survey via FRED's public CSV (no API key, free).
// No user data is read or written, so this function does not require a signed-in user.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US,MORTGAGE15US";

type Rates = { asOf: string; primaryRate30y: number; primaryRate15y: number | null; source: string; fetchedAt: string };
let cache: { at: number; rates: Rates } | null = null;
const CACHE_MS = 6 * 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "Use GET." }, 405);
  try {
    if (!cache || Date.now() - cache.at > CACHE_MS) {
      const response = await fetch(FRED_CSV, { headers: { accept: "text/csv" } });
      if (!response.ok) throw new Error(`FRED responded ${response.status}`);
      cache = { at: Date.now(), rates: parse(await response.text()) };
    }
    return json(cache.rates, 200, { "Cache-Control": "public, max-age=21600" });
  } catch (error) {
    if (cache) return json({ ...cache.rates, stale: true }, 200);
    return json({ error: error instanceof Error ? error.message : "Rates unavailable." }, 502);
  }
});

function parse(csv: string): Rates {
  const rows = csv.trim().split(/\r?\n/).slice(1).map((line) => line.split(","));
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const [date, r30, r15] = rows[i];
    const thirty = Number(r30);
    if (date && Number.isFinite(thirty) && thirty > 0) {
      const fifteen = Number(r15);
      return {
        asOf: date,
        primaryRate30y: thirty,
        primaryRate15y: Number.isFinite(fifteen) && fifteen > 0 ? fifteen : null,
        source: "Freddie Mac Primary Mortgage Market Survey (via FRED)",
        fetchedAt: new Date().toISOString(),
      };
    }
  }
  throw new Error("No rate rows in FRED response.");
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", ...extra } });
}

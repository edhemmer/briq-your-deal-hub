// Public, read-only local market context by ZIP code. Free sources, no API keys:
//  - U.S. Census Bureau ACS 2020-2024 5-year estimates (ZCTA level); needs the free CENSUS_API_KEY secret
//  - BLS CPI "Rent of primary residence" (CUUR0000SEHA) via FRED, to bring survey-period rents to today
// No user data is read or written.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACS_YEAR = 2024;
const VARS = {
  medianGrossRent: "B25064_001E",
  rentStudio: "B25031_002E",
  rent1: "B25031_003E",
  rent2: "B25031_004E",
  rent3: "B25031_005E",
  rent4: "B25031_006E",
  rent5: "B25031_007E",
  medianHomeValue: "B25077_001E",
  medianHouseholdIncome: "B19013_001E",
  occupied: "B25003_001E",
  renterOccupied: "B25003_003E",
  forRentVacant: "B25004_002E",
  rentedNotOccupied: "B25004_003E",
  housingUnits: "B25002_001E",
} as const;

const cache = new Map<string, { at: number; body: unknown }>();
let rentIndex: { at: number; factor: number; latest: string } | null = null;
const DAY = 24 * 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const zip = new URL(req.url).searchParams.get("zip")?.trim() ?? "";
  if (!/^\d{5}$/.test(zip)) return json({ error: "Provide a 5-digit ZIP code." }, 400);
  if (!Deno.env.get("CENSUS_API_KEY")) return json({ error: "Local market data is not configured.", code: "census_key_missing" }, 503);
  const hit = cache.get(zip);
  if (hit && Date.now() - hit.at < DAY) return json(hit.body, 200, { "Cache-Control": "public, max-age=86400" });
  try {
    const [acs, adj] = await Promise.all([loadAcs(zip), loadRentAdjustment().catch(() => null)]);
    if (!acs) return json({ error: "No Census data for this ZIP code." }, 404);
    const factor = adj?.factor ?? 1;
    const adjust = (v: number | null) => (v === null ? null : Math.round(v * factor));
    const renterPool = (acs.renterOccupied ?? 0) + (acs.rentedNotOccupied ?? 0) + (acs.forRentVacant ?? 0);
    const body = {
      zip,
      survey: `ACS ${ACS_YEAR - 4}-${ACS_YEAR} 5-year estimates (U.S. Census Bureau)`,
      rentAdjustment: adj ? { factor: Math.round(factor * 1000) / 1000, through: adj.latest, source: "BLS CPI-U Rent of primary residence (CUUR0000SEHA) via FRED" } : null,
      medianGrossRent: acs.medianGrossRent,
      medianGrossRentToday: adjust(acs.medianGrossRent),
      medianRentByBedroomsToday: {
        studio: adjust(acs.rentStudio),
        "1": adjust(acs.rent1),
        "2": adjust(acs.rent2),
        "3": adjust(acs.rent3),
        "4": adjust(acs.rent4),
        "5": adjust(acs.rent5),
      },
      medianHomeValue: acs.medianHomeValue,
      medianHouseholdIncome: acs.medianHouseholdIncome,
      renterShare: acs.occupied ? round((acs.renterOccupied ?? 0) / acs.occupied, 3) : null,
      rentalVacancyRate: renterPool > 0 ? round((acs.forRentVacant ?? 0) / renterPool, 3) : null,
      housingUnits: acs.housingUnits,
      fetchedAt: new Date().toISOString(),
    };
    cache.set(zip, { at: Date.now(), body });
    return json(body, 200, { "Cache-Control": "public, max-age=86400" });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Market data unavailable." }, 502);
  }
});

async function loadAcs(zip: string) {
  const names = Object.values(VARS).join(",");
  const key = encodeURIComponent(Deno.env.get("CENSUS_API_KEY") ?? "");
  const url = `https://api.census.gov/data/${ACS_YEAR}/acs/acs5?get=${names}&for=zip%20code%20tabulation%20area:${zip}&key=${key}`;
  const response = await fetch(url);
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`Census responded ${response.status}`);
  if (!(response.headers.get("content-type") ?? "").includes("json")) throw new Error("Census rejected the request (check CENSUS_API_KEY).");
  const rows = (await response.json()) as string[][];
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const [header, values] = rows;
  const read = (code: string) => {
    const v = Number(values[header.indexOf(code)]);
    return Number.isFinite(v) && v >= 0 ? v : null; // ACS uses large negatives for "not available"
  };
  const out: Record<keyof typeof VARS, number | null> = {} as never;
  for (const [key, code] of Object.entries(VARS)) out[key as keyof typeof VARS] = read(code);
  return out;
}

async function loadRentAdjustment() {
  if (rentIndex && Date.now() - rentIndex.at < DAY) return rentIndex;
  const response = await fetch("https://fred.stlouisfed.org/graph/fredgraph.csv?id=CUUR0000SEHA");
  if (!response.ok) throw new Error(`FRED responded ${response.status}`);
  const rows = (await response.text()).trim().split(/\r?\n/).slice(1).map((l) => l.split(",")).map(([d, v]) => [d, Number(v)] as const).filter(([, v]) => Number.isFinite(v) && v > 0);
  const survey = rows.filter(([d]) => d >= `${ACS_YEAR - 4}-01-01` && d <= `${ACS_YEAR}-12-31`);
  const latest = rows[rows.length - 1];
  if (!survey.length || !latest) throw new Error("Rent index unavailable.");
  const surveyMean = survey.reduce((a, [, v]) => a + v, 0) / survey.length;
  rentIndex = { at: Date.now(), factor: latest[1] / surveyMean, latest: latest[0] };
  return rentIndex;
}

function round(v: number, digits: number) {
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", ...extra } });
}

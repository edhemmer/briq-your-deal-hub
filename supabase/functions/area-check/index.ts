// Public, read-only area check for a property address. Free sources, no API keys:
//  - U.S. Census Bureau Geocoder (address -> coordinates)
//  - FEMA National Flood Hazard Layer (effective flood zone at the point)
// Nearby features (rail, highways, industrial land...) come from OpenStreetMap's Overpass API, which is
// meant for browser-based tools, so the BRIX web app queries it directly from the user's browser.
// Only physical features are measured. Nothing about residents or demographics is used.
// No user data is read or written.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA = "BRIX Real Estate area check (https://brixrealestate.app)";
const WEEK = 7 * 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; body: unknown }>();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const params = new URL(req.url).searchParams;
  const address = (params.get("address") ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (address.length < 6) return json({ error: "Provide a full street address." }, 400);
  const key = address.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < WEEK) return json(hit.body, 200, { "Cache-Control": "public, max-age=86400" });

  try {
    const location = await geocode(address);
    if (!location) return json({ error: "We couldn't place that address on a map. Check the street, city, state and ZIP.", code: "not_found" }, 404);
    // FEMA's map server is occasionally slow; give it one retry before reporting the flood zone as unavailable.
    const flood = await floodZone(location.lat, location.lon).catch(() => floodZone(location.lat, location.lon)).catch(() => null);
    const body = {
      location,
      flood,
      sources: {
        geocoder: "U.S. Census Bureau Geocoder",
        flood: flood ? "FEMA National Flood Hazard Layer" : "unavailable",
      },
      checkedAt: new Date().toISOString(),
    };
    if (flood) cache.set(key, { at: Date.now(), body });
    return json(body, 200, { "Cache-Control": flood ? "public, max-age=86400" : "no-store" });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Area check unavailable." }, 502);
  }
});

async function geocode(address: string) {
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  const response = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
  const data = await response.json();
  const match = data?.result?.addressMatches?.[0];
  if (!match?.coordinates) return null;
  return {
    lat: Number(match.coordinates.y),
    lon: Number(match.coordinates.x),
    matchedAddress: String(match.matchedAddress ?? address),
  };
}

async function floodZone(lat: number, lon: number) {
  // Layer 28 = Flood Hazard Zones (S_FLD_HAZ_AR) in FEMA's public NFHL MapServer.
  const url = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF&returnGeometry=false&f=json`;
  const response = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`FEMA returned ${response.status}`);
  const data = await response.json();
  if (data?.error) throw new Error("FEMA query failed");
  const features = Array.isArray(data?.features) ? data.features : [];
  if (!features.length) return { zone: null, subtype: null, highRisk: false, mapped: false };
  // A point can sit on a boundary; report the riskiest zone that touches it.
  const zones = features.map((f: { attributes?: Record<string, unknown> }) => f.attributes ?? {});
  const worst = zones.find((z: Record<string, unknown>) => z.SFHA_TF === "T") ?? zones[0];
  return {
    zone: worst.FLD_ZONE ? String(worst.FLD_ZONE) : null,
    subtype: worst.ZONE_SUBTY ? String(worst.ZONE_SUBTY) : null,
    highRisk: worst.SFHA_TF === "T",
    mapped: true,
  };
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", ...extra } });
}

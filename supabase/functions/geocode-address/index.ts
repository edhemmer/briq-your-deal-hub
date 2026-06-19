// Geocodes an address with the public U.S. Census Geocoding Services API.
// No third-party builder connector or Google Maps key is required.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const CENSUS_GEOCODER_URL =
  "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { address } = await req.json();
    if (!address || typeof address !== "string" || address.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(CENSUS_GEOCODER_URL);
    url.searchParams.set("address", address);
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("vintage", "Current_Current");
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "BRIX Real Estate geocoder" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Census geocoder failed [${res.status}]: ${JSON.stringify(data)}`);

    const first = data.result?.addressMatches?.[0];
    if (!first) {
      return new Response(JSON.stringify({ found: false, source: "US Census Geocoder" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const components = first.addressComponents ?? {};
    const counties = first.geographies?.Counties ?? [];
    const tracts = first.geographies?.["Census Tracts"] ?? [];
    const county = counties[0] ?? null;
    const tract = tracts[0] ?? null;

    return new Response(
      JSON.stringify({
        found: true,
        source: "US Census Geocoder",
        source_quality: "official",
        formatted_address: first.matchedAddress ?? null,
        location: first.coordinates
          ? { lat: Number(first.coordinates.y), lng: Number(first.coordinates.x) }
          : null,
        place_id: null,
        city: components.city ?? null,
        county: county?.NAME ?? null,
        county_geoid: county?.GEOID ?? null,
        census_tract: tract?.GEOID ?? null,
        state: components.state ?? null,
        zip: components.zip ?? null,
        country: "US",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("geocode-address error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

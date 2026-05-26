// Fetches BLS regional employment data. Works without an API key (25 req/day limit per IP).
// If BLS_API_KEY is set, uses v2 (500 req/day).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { seriesIds, startYear, endYear } = await req.json();
    if (!Array.isArray(seriesIds) || seriesIds.length === 0 || seriesIds.length > 25) {
      return new Response(JSON.stringify({ error: 'seriesIds must be an array of 1-25 BLS series IDs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('BLS_API_KEY');
    const version = apiKey ? 'v2' : 'v1';
    const url = `https://api.bls.gov/publicAPI/${version}/timeseries/data/`;

    const body: Record<string, unknown> = { seriesid: seriesIds };
    if (startYear) body.startyear = String(startYear);
    if (endYear) body.endyear = String(endYear);
    if (apiKey) body.registrationkey = apiKey;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API failed: ${JSON.stringify(data.message ?? data)}`);
    }

    // Normalize: compute YoY growth per series when possible
    const series = (data.Results?.series ?? []).map((s: any) => {
      const points = (s.data ?? [])
        .map((d: any) => ({
          year: Number(d.year),
          period: d.period,
          value: Number(d.value),
        }))
        .filter((d: any) => Number.isFinite(d.value));
      const latest = points[0];
      const yearAgo = points.find((p: any) => latest && p.year === latest.year - 1 && p.period === latest.period);
      const yoy_pct = latest && yearAgo && yearAgo.value > 0
        ? ((latest.value - yearAgo.value) / yearAgo.value) * 100
        : null;
      return { seriesId: s.seriesID, latest, yoy_pct, points };
    });

    return new Response(JSON.stringify({ series }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('fetch-bls-employment error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

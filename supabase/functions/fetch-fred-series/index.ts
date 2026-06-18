// Fetches a FRED economic series (e.g. MORTGAGE30US, FEDFUNDS, CPIAUCSL).
// Requires FRED_API_KEY (free from https://fred.stlouisfed.org/docs/api/api_key.html).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface FredObservation {
  date: string;
  value: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const FRED_API_KEY = Deno.env.get('FRED_API_KEY');
    if (!FRED_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'FRED_API_KEY not configured. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { seriesId, limit } = await req.json();
    if (!seriesId || typeof seriesId !== 'string' || !/^[A-Z0-9_]{1,40}$/i.test(seriesId)) {
      return new Response(JSON.stringify({ error: 'Invalid seriesId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const n = Math.min(Math.max(Number(limit) || 24, 1), 1000);

    const url = new URL('https://api.stlouisfed.org/fred/series/observations');
    url.searchParams.set('series_id', seriesId);
    url.searchParams.set('api_key', FRED_API_KEY);
    url.searchParams.set('file_type', 'json');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', String(n));

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) throw new Error(`FRED API failed [${res.status}]: ${JSON.stringify(data)}`);

    const observations = ((data.observations ?? []) as FredObservation[])
      .map((o) => ({ date: o.date, value: o.value === '.' ? null : Number(o.value) }))
      .filter((o) => o.value === null || Number.isFinite(o.value));

    const latest = observations.find((o) => o.value !== null) ?? null;
    const yearAgoIdx = 12; // monthly series approximation
    const yearAgo = observations[yearAgoIdx] ?? null;
    const yoy_pct = latest && yearAgo && yearAgo.value && yearAgo.value !== 0
      ? ((latest.value - yearAgo.value) / yearAgo.value) * 100
      : null;

    return new Response(JSON.stringify({ seriesId, latest, yoy_pct, observations }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('fetch-fred-series error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

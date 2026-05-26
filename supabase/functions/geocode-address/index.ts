// Geocodes an address via the Google Maps Platform connector gateway.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_maps';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
    if (!GOOGLE_MAPS_API_KEY) throw new Error('GOOGLE_MAPS_API_KEY is not configured');

    const { address } = await req.json();
    if (!address || typeof address !== 'string' || address.length > 500) {
      return new Response(JSON.stringify({ error: 'Invalid address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': GOOGLE_MAPS_API_KEY,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Geocode failed [${res.status}]: ${JSON.stringify(data)}`);

    const first = data.results?.[0];
    if (!first) {
      return new Response(JSON.stringify({ found: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const components: Record<string, string> = {};
    for (const c of first.address_components ?? []) {
      for (const t of c.types ?? []) components[t] = c.short_name;
    }

    return new Response(
      JSON.stringify({
        found: true,
        formatted_address: first.formatted_address,
        location: first.geometry?.location ?? null,
        place_id: first.place_id ?? null,
        city: components.locality ?? components.postal_town ?? null,
        county: components.administrative_area_level_2 ?? null,
        state: components.administrative_area_level_1 ?? null,
        zip: components.postal_code ?? null,
        country: components.country ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('geocode-address error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

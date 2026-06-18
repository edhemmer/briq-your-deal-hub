// Fetches official Census ACS profile variables for a state/county.
// Requires CENSUS_API_KEY. Use county/state FIPS codes.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ACS_VARIABLES = [
  'DP05_0001E', // population
  'DP03_0062E', // median household income
  'DP04_0046PE', // owner-occupied housing %
  'DP04_0047PE', // renter-occupied housing %
  'DP04_0004PE', // vacancy rate %
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { stateFips, countyFips, year } = await req.json();
    const acsYear = Number(year) || 2023;
    const apiKey = Deno.env.get('CENSUS_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'CENSUS_API_KEY not configured. Request a free key at https://api.census.gov/data/key_signup.html',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!/^\d{2}$/.test(String(stateFips)) || !/^\d{3}$/.test(String(countyFips))) {
      return new Response(JSON.stringify({ error: 'Provide stateFips as 2 digits and countyFips as 3 digits.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(`https://api.census.gov/data/${acsYear}/acs/acs5/profile`);
    url.searchParams.set('get', ['NAME', ...ACS_VARIABLES].join(','));
    url.searchParams.set('for', `county:${countyFips}`);
    url.searchParams.set('in', `state:${stateFips}`);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok) throw new Error(`Census API failed [${res.status}]: ${JSON.stringify(data)}`);
    if (!Array.isArray(data) || data.length < 2) throw new Error('Census API returned no county profile.');

    const [headers, row] = data as [string[], string[]];
    const record = Object.fromEntries(headers.map((key, index) => [key, row[index] ?? null]));

    return new Response(JSON.stringify({
      source: 'US Census ACS 5-Year Profile',
      year: acsYear,
      geography: record.NAME,
      population: Number(record.DP05_0001E),
      median_household_income: Number(record.DP03_0062E),
      owner_occupied_pct: Number(record.DP04_0046PE),
      renter_occupied_pct: Number(record.DP04_0047PE),
      vacancy_rate_pct: Number(record.DP04_0004PE),
      raw: record,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('fetch-census-acs error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS county text;

CREATE INDEX IF NOT EXISTS idx_deals_state_county_city
  ON public.deals(state, county, city);

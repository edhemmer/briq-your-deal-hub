ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS beds numeric,
  ADD COLUMN IF NOT EXISTS baths numeric,
  ADD COLUMN IF NOT EXISTS square_feet numeric,
  ADD COLUMN IF NOT EXISTS listing_url text,
  ADD COLUMN IF NOT EXISTS listing_source text,
  ADD COLUMN IF NOT EXISTS listing_remarks text,
  ADD COLUMN IF NOT EXISTS listing_photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS condition_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS visible_or_stated_risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS missing_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_confidence text NOT NULL DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS photo_analysis_status text NOT NULL DEFAULT 'not_requested';

CREATE INDEX IF NOT EXISTS idx_deals_listing_source ON public.deals(listing_source);
CREATE INDEX IF NOT EXISTS idx_deals_source_confidence ON public.deals(source_confidence);

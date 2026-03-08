
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS assessed_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_property_tax numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS year_built numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lot_size text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS zoning_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS property_record_url text DEFAULT NULL;

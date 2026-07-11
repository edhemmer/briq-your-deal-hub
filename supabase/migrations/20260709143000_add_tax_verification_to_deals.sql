ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS tax_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tax_record_url text,
  ADD COLUMN IF NOT EXISTS tax_verification_status text NOT NULL DEFAULT 'missing';

COMMENT ON COLUMN public.deals.tax_history IS
  'Official or user-verified property tax history. Expected shape: [{year, amount, source, status}].';

COMMENT ON COLUMN public.deals.tax_record_url IS
  'County or official property tax lookup URL used for verification.';

COMMENT ON COLUMN public.deals.tax_verification_status IS
  'Tax verification state: missing, lookup_available, user_verified, official_verified, provider_required, unsupported.';

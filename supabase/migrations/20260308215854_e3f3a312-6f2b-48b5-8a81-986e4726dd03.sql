
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manual_premium_override boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_override_note text,
  ADD COLUMN IF NOT EXISTS manual_override_updated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS manual_override_updated_by uuid;

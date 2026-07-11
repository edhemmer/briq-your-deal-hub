-- Free accounts are limited to 15 lifetime deal files.
-- Paid, admin, and manually comped accounts are unlimited.
-- Usage is tracked separately from public.deals so deleting a deal does not reset the free limit.

CREATE TABLE IF NOT EXISTS public.deal_file_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deal_file_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deal file usage" ON public.deal_file_usage;
CREATE POLICY "Users can view own deal file usage" ON public.deal_file_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_deal_file_usage_user_id_created_at
  ON public.deal_file_usage(user_id, created_at DESC);

INSERT INTO public.deal_file_usage (user_id, deal_id, created_at)
SELECT d.user_id, d.id, d.created_at
FROM public.deals d
WHERE NOT EXISTS (
  SELECT 1
  FROM public.deal_file_usage u
  WHERE u.deal_id = d.id
);

CREATE OR REPLACE FUNCTION public.enforce_free_deal_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles%ROWTYPE;
  lifetime_deal_count integer;
  is_unlimited boolean;
BEGIN
  SELECT *
  INTO profile_row
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account profile is required before creating deal files.'
      USING ERRCODE = 'P0001';
  END IF;

  is_unlimited :=
    COALESCE(profile_row.admin_override, false)
    OR COALESCE(profile_row.manual_premium_override, false)
    OR COALESCE(profile_row.subscription_status, 'free') IN ('active', 'admin_override');

  IF is_unlimited THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO lifetime_deal_count
  FROM public.deal_file_usage
  WHERE user_id = NEW.user_id;

  IF lifetime_deal_count >= 15 THEN
    RAISE EXCEPTION 'Free plan includes 15 deal files. Upgrade to create more deal files.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_deal_file_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.deal_file_usage (user_id, deal_id, created_at)
  VALUES (NEW.user_id, NEW.id, NEW.created_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_free_deal_limit_before_insert ON public.deals;

CREATE TRIGGER enforce_free_deal_limit_before_insert
BEFORE INSERT ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_free_deal_limit();

DROP TRIGGER IF EXISTS record_deal_file_usage_after_insert ON public.deals;

CREATE TRIGGER record_deal_file_usage_after_insert
AFTER INSERT ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.record_deal_file_usage();

CREATE OR REPLACE FUNCTION public.ensure_current_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
  profile_row public.profiles%ROWTYPE;
  is_owner boolean := current_email = 'edhemmer@gmail.com';
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.profiles (
    id,
    account_status,
    subscription_status,
    free_deal_used,
    admin_override,
    manual_premium_override
  )
  VALUES (
    current_user_id,
    'active',
    CASE WHEN is_owner THEN 'admin_override' ELSE 'free' END,
    false,
    is_owner,
    is_owner
  )
  ON CONFLICT (id) DO UPDATE
  SET
    account_status = COALESCE(public.profiles.account_status, 'active'),
    subscription_status = CASE
      WHEN is_owner THEN 'admin_override'
      ELSE COALESCE(public.profiles.subscription_status, 'free')
    END,
    admin_override = CASE
      WHEN is_owner THEN true
      ELSE COALESCE(public.profiles.admin_override, false)
    END,
    manual_premium_override = CASE
      WHEN is_owner THEN true
      ELSE COALESCE(public.profiles.manual_premium_override, false)
    END;

  SELECT *
  INTO profile_row
  FROM public.profiles
  WHERE id = current_user_id;

  RETURN profile_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_current_profile() TO authenticated;

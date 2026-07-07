CREATE TABLE IF NOT EXISTS public.admin_owner_emails (
  email text PRIMARY KEY,
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_owner_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view owner email allowlist" ON public.admin_owner_emails;
CREATE POLICY "Admins can view owner email allowlist"
  ON public.admin_owner_emails FOR SELECT TO authenticated
  USING (public.has_admin_access(auth.uid()));

INSERT INTO public.admin_owner_emails (email, label)
VALUES ('edhemmer@gmail.com', 'BRIX founder and developer')
ON CONFLICT (email) DO UPDATE
SET label = EXCLUDED.label;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deactivated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deactivated_by uuid;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status
  ON public.profiles(account_status);

CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role IN ('admin'::public.app_role, 'superadmin'::public.app_role)
    )
    OR EXISTS (
      SELECT 1
      FROM auth.users au
      JOIN public.admin_owner_emails owners
        ON owners.email = lower(au.email)
      WHERE au.id = _user_id
    )
$$;

CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.admin_owner_emails
    WHERE email = lower(NEW.email)
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'superadmin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.profiles (
      id,
      subscription_status,
      admin_override,
      manual_premium_override,
      manual_override_note,
      manual_override_updated_at
    )
    VALUES (
      NEW.id,
      'admin_override',
      true,
      true,
      'Founder/developer super admin access',
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET subscription_status = 'admin_override',
        admin_override = true,
        manual_premium_override = true,
        manual_override_note = COALESCE(public.profiles.manual_override_note, 'Founder/developer super admin access'),
        manual_override_updated_at = now(),
        account_status = 'active',
        deletion_status = 'active';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT id INTO owner_id
  FROM auth.users
  WHERE lower(email) = 'edhemmer@gmail.com'
  LIMIT 1;

  IF owner_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (owner_id, 'superadmin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (owner_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.profiles (
      id,
      subscription_status,
      admin_override,
      manual_premium_override,
      manual_override_note,
      manual_override_updated_at
    )
    VALUES (
      owner_id,
      'admin_override',
      true,
      true,
      'Founder/developer super admin access',
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET subscription_status = 'admin_override',
        admin_override = true,
        manual_premium_override = true,
        manual_override_note = COALESCE(public.profiles.manual_override_note, 'Founder/developer super admin access'),
        manual_override_updated_at = now(),
        account_status = 'active',
        deletion_status = 'active';
  END IF;
END $$;

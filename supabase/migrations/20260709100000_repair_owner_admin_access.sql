INSERT INTO public.admin_owner_emails (email, label)
VALUES ('edhemmer@gmail.com', 'BRIX founder and developer')
ON CONFLICT (email) DO UPDATE
SET label = EXCLUDED.label;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_signup();

DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT id INTO owner_id
  FROM auth.users
  WHERE lower(email) = 'edhemmer@gmail.com'
  ORDER BY created_at DESC
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
      manual_override_updated_at,
      account_status,
      deletion_status
    )
    VALUES (
      owner_id,
      'admin_override',
      true,
      true,
      'Founder/developer super admin access',
      now(),
      'active',
      'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET subscription_status = 'admin_override',
        admin_override = true,
        manual_premium_override = true,
        manual_override_note = 'Founder/developer super admin access',
        manual_override_updated_at = now(),
        account_status = 'active',
        deletion_status = 'active',
        deactivated_at = NULL,
        deactivated_by = NULL;
  END IF;
END $$;

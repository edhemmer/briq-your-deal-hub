
-- Fix 1: Convert all RESTRICTIVE policies to PERMISSIVE so RLS actually works for authenticated clients

-- profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Replace the permissive user self-update with a restricted version that blocks privilege escalation
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own non-privileged fields" ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND admin_override IS NOT DISTINCT FROM (SELECT p.admin_override FROM public.profiles p WHERE p.id = auth.uid())
  AND manual_premium_override IS NOT DISTINCT FROM (SELECT p.manual_premium_override FROM public.profiles p WHERE p.id = auth.uid())
  AND subscription_status IS NOT DISTINCT FROM (SELECT p.subscription_status FROM public.profiles p WHERE p.id = auth.uid())
  AND stripe_customer_id IS NOT DISTINCT FROM (SELECT p.stripe_customer_id FROM public.profiles p WHERE p.id = auth.uid())
  AND stripe_subscription_id IS NOT DISTINCT FROM (SELECT p.stripe_subscription_id FROM public.profiles p WHERE p.id = auth.uid())
  AND subscription_start_date IS NOT DISTINCT FROM (SELECT p.subscription_start_date FROM public.profiles p WHERE p.id = auth.uid())
  AND subscription_end_date IS NOT DISTINCT FROM (SELECT p.subscription_end_date FROM public.profiles p WHERE p.id = auth.uid())
  AND manual_override_note IS NOT DISTINCT FROM (SELECT p.manual_override_note FROM public.profiles p WHERE p.id = auth.uid())
  AND manual_override_updated_at IS NOT DISTINCT FROM (SELECT p.manual_override_updated_at FROM public.profiles p WHERE p.id = auth.uid())
  AND manual_override_updated_by IS NOT DISTINCT FROM (SELECT p.manual_override_updated_by FROM public.profiles p WHERE p.id = auth.uid())
);

-- deals table
DROP POLICY IF EXISTS "Users can view own deals" ON public.deals;
CREATE POLICY "Users can view own deals" ON public.deals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own deals" ON public.deals;
CREATE POLICY "Users can create own deals" ON public.deals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own deals" ON public.deals;
CREATE POLICY "Users can update own deals" ON public.deals FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own deals" ON public.deals;
CREATE POLICY "Users can delete own deals" ON public.deals FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all deals" ON public.deals;
CREATE POLICY "Admins can view all deals" ON public.deals FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- market_conditions table
DROP POLICY IF EXISTS "Users can view own market conditions" ON public.market_conditions;
CREATE POLICY "Users can view own market conditions" ON public.market_conditions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own market conditions" ON public.market_conditions;
CREATE POLICY "Users can create own market conditions" ON public.market_conditions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own market conditions" ON public.market_conditions;
CREATE POLICY "Users can update own market conditions" ON public.market_conditions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own market conditions" ON public.market_conditions;
CREATE POLICY "Users can delete own market conditions" ON public.market_conditions FOR DELETE USING (auth.uid() = user_id);

-- user_roles table
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- admin_audit_log table
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_log FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

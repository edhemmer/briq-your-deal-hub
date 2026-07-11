DROP POLICY IF EXISTS "Users can delete own deals" ON public.deals;

CREATE POLICY "Paid users can delete own deals"
ON public.deals
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        COALESCE(p.admin_override, false)
        OR COALESCE(p.manual_premium_override, false)
        OR COALESCE(p.subscription_status, 'free') IN ('active', 'admin_override')
      )
  )
);

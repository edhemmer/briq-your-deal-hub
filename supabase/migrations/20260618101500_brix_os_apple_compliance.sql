-- BRIX Real Estate OS + Apple/iOS compliance foundation.
-- Business logic and scoring remain in services; these tables store traceable,
-- user-owned outputs, evidence, and mobile workflow records.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS apple_user_identifier text,
  ADD COLUMN IF NOT EXISTS apple_private_relay_email boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS apple_full_name_captured_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deletion_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deletion_completed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_profiles_apple_user_identifier
  ON public.profiles(apple_user_identifier)
  WHERE apple_user_identifier IS NOT NULL;

DROP POLICY IF EXISTS "Users can update own non-privileged fields" ON public.profiles;
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
  AND auth_provider IS NOT DISTINCT FROM (SELECT p.auth_provider FROM public.profiles p WHERE p.id = auth.uid())
  AND apple_user_identifier IS NOT DISTINCT FROM (SELECT p.apple_user_identifier FROM public.profiles p WHERE p.id = auth.uid())
  AND apple_private_relay_email IS NOT DISTINCT FROM (SELECT p.apple_private_relay_email FROM public.profiles p WHERE p.id = auth.uid())
  AND apple_full_name_captured_at IS NOT DISTINCT FROM (SELECT p.apple_full_name_captured_at FROM public.profiles p WHERE p.id = auth.uid())
  AND deletion_requested_at IS NOT DISTINCT FROM (SELECT p.deletion_requested_at FROM public.profiles p WHERE p.id = auth.uid())
  AND deletion_status IS NOT DISTINCT FROM (SELECT p.deletion_status FROM public.profiles p WHERE p.id = auth.uid())
  AND deletion_completed_at IS NOT DISTINCT FROM (SELECT p.deletion_completed_at FROM public.profiles p WHERE p.id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_name text;
  apple_email text;
  full_name text;
BEGIN
  provider_name := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  apple_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    trim(concat_ws(' ', NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'family_name'))
  );

  INSERT INTO public.profiles (
    id,
    auth_provider,
    apple_user_identifier,
    apple_private_relay_email,
    apple_full_name_captured_at
  )
  VALUES (
    NEW.id,
    provider_name,
    CASE WHEN provider_name = 'apple' THEN COALESCE(NEW.raw_user_meta_data->>'sub', NEW.raw_user_meta_data->>'provider_id') ELSE NULL END,
    CASE WHEN provider_name = 'apple' AND apple_email ILIKE '%@privaterelay.appleid.com' THEN true ELSE false END,
    CASE WHEN provider_name = 'apple' AND NULLIF(full_name, '') IS NOT NULL THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    auth_provider = EXCLUDED.auth_provider,
    apple_user_identifier = COALESCE(public.profiles.apple_user_identifier, EXCLUDED.apple_user_identifier),
    apple_private_relay_email = EXCLUDED.apple_private_relay_email,
    apple_full_name_captured_at = COALESCE(public.profiles.apple_full_name_captured_at, EXCLUDED.apple_full_name_captured_at);

  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'requested',
  reason text,
  request_source text NOT NULL DEFAULT 'ios',
  apple_user_identifier text,
  revoked_apple_token_at timestamp with time zone,
  legal_retention_note text,
  processor_note text,
  CONSTRAINT account_deletion_requests_status_check
    CHECK (status IN ('requested', 'processing', 'completed', 'rejected', 'failed'))
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own deletion requests"
  ON public.account_deletion_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own deletion requests"
  ON public.account_deletion_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deletion requests"
  ON public.account_deletion_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deletion requests"
  ON public.account_deletion_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.property_digital_twins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  property_id text NOT NULL DEFAULT ('BRX-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  address text NOT NULL,
  property_type text,
  ownership_status text NOT NULL DEFAULT 'prospect',
  trust_score integer NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  decision_readiness_score integer NOT NULL DEFAULT 0 CHECK (decision_readiness_score BETWEEN 0 AND 100),
  verification_status text NOT NULL DEFAULT 'missing',
  data_freshness jsonb NOT NULL DEFAULT '{}'::jsonb,
  physical_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  condition_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  financial_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  market_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  legal_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  insurance_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  tax_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  strategy_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  portfolio_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  memory_layer jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.property_digital_twins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own property twins"
  ON public.property_digital_twins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own property twins"
  ON public.property_digital_twins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property twins"
  ON public.property_digital_twins FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own property twins"
  ON public.property_digital_twins FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_property_digital_twins_user_id ON public.property_digital_twins(user_id);
CREATE INDEX IF NOT EXISTS idx_property_digital_twins_deal_id ON public.property_digital_twins(deal_id);

CREATE TABLE IF NOT EXISTS public.brix_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_twin_id uuid REFERENCES public.property_digital_twins(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  decision_type text NOT NULL,
  recommendation_class text NOT NULL,
  recommendation_summary text NOT NULL,
  confidence_level text NOT NULL,
  trust_score integer NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  decision_readiness_score integer NOT NULL DEFAULT 0 CHECK (decision_readiness_score BETWEEN 0 AND 100),
  supporting_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_information jsonb NOT NULL DEFAULT '[]'::jsonb,
  alternative_strategies jsonb NOT NULL DEFAULT '[]'::jsonb,
  bull_case text,
  bear_case text,
  neutral_view text,
  what_must_be_true jsonb NOT NULL DEFAULT '[]'::jsonb,
  failure_scenarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  committee_analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  scenario_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_decision text,
  outcome_tracking jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.brix_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own decisions"
  ON public.brix_decisions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own decisions"
  ON public.brix_decisions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions"
  ON public.brix_decisions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions"
  ON public.brix_decisions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_brix_decisions_user_id ON public.brix_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_brix_decisions_property_twin_id ON public.brix_decisions(property_twin_id);

CREATE TABLE IF NOT EXISTS public.brix_field_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_twin_id uuid REFERENCES public.property_digital_twins(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  project_id uuid,
  capture_type text NOT NULL,
  storage_path text,
  local_identifier text,
  capture_category text,
  user_note text,
  voice_note_transcript text,
  latitude numeric,
  longitude numeric,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  uploaded_at timestamp with time zone,
  sync_status text NOT NULL DEFAULT 'queued',
  ai_findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence_score integer CHECK (confidence_score BETWEEN 0 AND 100),
  severity text,
  verification_recommendation text,
  source_quality text NOT NULL DEFAULT 'user_entered',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brix_field_captures_sync_status_check
    CHECK (sync_status IN ('queued', 'uploading', 'synced', 'failed')),
  CONSTRAINT brix_field_captures_capture_type_check
    CHECK (capture_type IN ('photo', 'video', 'document_scan', 'voice_note', 'inspection_report', 'contractor_estimate'))
);

ALTER TABLE public.brix_field_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own field captures"
  ON public.brix_field_captures FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own field captures"
  ON public.brix_field_captures FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own field captures"
  ON public.brix_field_captures FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own field captures"
  ON public.brix_field_captures FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_brix_field_captures_user_id ON public.brix_field_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_brix_field_captures_property_twin_id ON public.brix_field_captures(property_twin_id);

CREATE TABLE IF NOT EXISTS public.brix_visual_scope_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_twin_id uuid REFERENCES public.property_digital_twins(id) ON DELETE CASCADE,
  field_capture_id uuid REFERENCES public.brix_field_captures(id) ON DELETE SET NULL,
  room_or_system text NOT NULL,
  condition_score text,
  scope_type text NOT NULL,
  finding text NOT NULL,
  recommended_action text,
  low_estimate numeric,
  expected_estimate numeric,
  high_estimate numeric,
  budget_confidence integer CHECK (budget_confidence BETWEEN 0 AND 100),
  detection_confidence integer CHECK (detection_confidence BETWEEN 0 AND 100),
  scope_confidence integer CHECK (scope_confidence BETWEEN 0 AND 100),
  materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  labor_assumptions jsonb NOT NULL DEFAULT '{}'::jsonb,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_required boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.brix_visual_scope_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visual scope items"
  ON public.brix_visual_scope_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own visual scope items"
  ON public.brix_visual_scope_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visual scope items"
  ON public.brix_visual_scope_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visual scope items"
  ON public.brix_visual_scope_items FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_brix_visual_scope_items_user_id ON public.brix_visual_scope_items(user_id);
CREATE INDEX IF NOT EXISTS idx_brix_visual_scope_items_property_twin_id ON public.brix_visual_scope_items(property_twin_id);

CREATE TABLE IF NOT EXISTS public.brix_project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_twin_id uuid REFERENCES public.property_digital_twins(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  decision_id uuid REFERENCES public.brix_decisions(id) ON DELETE SET NULL,
  title text NOT NULL,
  task_type text NOT NULL DEFAULT 'due_diligence',
  owner text,
  due_at timestamp with time zone,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'important',
  dependency_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  verification_required boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brix_project_tasks_status_check
    CHECK (status IN ('open', 'in_progress', 'blocked', 'complete', 'cancelled')),
  CONSTRAINT brix_project_tasks_priority_check
    CHECK (priority IN ('critical', 'important', 'informational'))
);

ALTER TABLE public.brix_project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project tasks"
  ON public.brix_project_tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project tasks"
  ON public.brix_project_tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project tasks"
  ON public.brix_project_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project tasks"
  ON public.brix_project_tasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_brix_project_tasks_user_id ON public.brix_project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_brix_project_tasks_property_twin_id ON public.brix_project_tasks(property_twin_id);

CREATE TABLE IF NOT EXISTS public.brix_portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT current_date,
  total_equity numeric,
  total_debt numeric,
  net_worth numeric,
  monthly_cash_flow numeric,
  liquidity numeric,
  portfolio_score integer CHECK (portfolio_score BETWEEN 0 AND 100),
  risk_analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  concentration_analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  capital_allocation jsonb NOT NULL DEFAULT '{}'::jsonb,
  opportunities jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.brix_portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portfolio snapshots"
  ON public.brix_portfolio_snapshots FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolio snapshots"
  ON public.brix_portfolio_snapshots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolio snapshots"
  ON public.brix_portfolio_snapshots FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_brix_portfolio_snapshots_user_id ON public.brix_portfolio_snapshots(user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('field-captures', 'field-captures', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can view own field capture files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'field-captures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own field capture files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'field-captures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own field capture files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'field-captures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'field-captures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own field capture files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'field-captures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP TRIGGER IF EXISTS update_property_digital_twins_updated_at ON public.property_digital_twins;
CREATE TRIGGER update_property_digital_twins_updated_at
  BEFORE UPDATE ON public.property_digital_twins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brix_decisions_updated_at ON public.brix_decisions;
CREATE TRIGGER update_brix_decisions_updated_at
  BEFORE UPDATE ON public.brix_decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brix_field_captures_updated_at ON public.brix_field_captures;
CREATE TRIGGER update_brix_field_captures_updated_at
  BEFORE UPDATE ON public.brix_field_captures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brix_visual_scope_items_updated_at ON public.brix_visual_scope_items;
CREATE TRIGGER update_brix_visual_scope_items_updated_at
  BEFORE UPDATE ON public.brix_visual_scope_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brix_project_tasks_updated_at ON public.brix_project_tasks;
CREATE TRIGGER update_brix_project_tasks_updated_at
  BEFORE UPDATE ON public.brix_project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

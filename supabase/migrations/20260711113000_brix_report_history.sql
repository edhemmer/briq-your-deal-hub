CREATE TABLE IF NOT EXISTS public.brix_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  report_type text NOT NULL DEFAULT 'deal_snapshot',
  report_status text NOT NULL DEFAULT 'saved',
  title text NOT NULL,
  summary text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brix_reports_type_check
    CHECK (report_type IN ('deal_snapshot', 'comparison_snapshot', 'portfolio_snapshot', 'contract_snapshot')),
  CONSTRAINT brix_reports_status_check
    CHECK (report_status IN ('saved', 'exported', 'archived'))
);

ALTER TABLE public.brix_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.brix_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reports"
  ON public.brix_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON public.brix_reports FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
  ON public.brix_reports FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_brix_reports_user_id ON public.brix_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_brix_reports_deal_id ON public.brix_reports(deal_id);
CREATE INDEX IF NOT EXISTS idx_brix_reports_created_at ON public.brix_reports(created_at DESC);

DROP TRIGGER IF EXISTS update_brix_reports_updated_at ON public.brix_reports;
CREATE TRIGGER update_brix_reports_updated_at
  BEFORE UPDATE ON public.brix_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

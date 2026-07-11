CREATE TABLE IF NOT EXISTS public.brix_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  offer_status text NOT NULL DEFAULT 'draft',
  offer_type text NOT NULL DEFAULT 'standard',
  purchase_price numeric,
  earnest_money numeric,
  due_diligence_days integer,
  closing_timeline_days integer,
  contingencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  seller_concessions numeric,
  repair_requests text,
  walkaway_price numeric,
  strategy_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT brix_offers_status_check
    CHECK (offer_status IN ('draft', 'ready', 'submitted', 'countered', 'accepted', 'rejected', 'withdrawn'))
);

ALTER TABLE public.brix_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own offers"
  ON public.brix_offers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own offers"
  ON public.brix_offers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offers"
  ON public.brix_offers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft offers"
  ON public.brix_offers FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND offer_status = 'draft');

CREATE INDEX IF NOT EXISTS idx_brix_offers_user_id ON public.brix_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_brix_offers_deal_id ON public.brix_offers(deal_id);
CREATE INDEX IF NOT EXISTS idx_brix_offers_status ON public.brix_offers(offer_status);

DROP TRIGGER IF EXISTS update_brix_offers_updated_at ON public.brix_offers;
CREATE TRIGGER update_brix_offers_updated_at
  BEFORE UPDATE ON public.brix_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

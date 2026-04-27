-- ContractIQ: contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  contract_name TEXT NOT NULL,
  contract_type TEXT,
  perspective TEXT NOT NULL DEFAULT 'buyer' CHECK (perspective IN ('buyer','seller')),
  buyer_name TEXT,
  seller_name TEXT,
  property_address TEXT,
  purchase_price NUMERIC,
  earnest_money NUMERIC,
  closing_date DATE,
  inspection_period_days INTEGER,
  financing_contingency BOOLEAN DEFAULT false,
  appraisal_contingency BOOLEAN DEFAULT false,
  inspection_contingency BOOLEAN DEFAULT false,
  contract_text TEXT,
  contract_file_url TEXT,
  contractiq_analysis JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts" ON public.contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contracts" ON public.contracts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contracts" ON public.contracts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX idx_contracts_deal_id ON public.contracts(deal_id);
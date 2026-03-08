
CREATE TABLE public.market_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  city text NOT NULL,
  state text NOT NULL,
  zipcode text,
  median_rent numeric DEFAULT 0,
  rent_growth_12mo numeric DEFAULT 0,
  rent_growth_36mo numeric DEFAULT 0,
  median_home_price numeric DEFAULT 0,
  price_growth_12mo numeric DEFAULT 0,
  price_growth_36mo numeric DEFAULT 0,
  price_per_sqft numeric DEFAULT 0,
  inventory_level numeric DEFAULT 0,
  months_of_supply numeric DEFAULT 0,
  days_on_market numeric DEFAULT 0,
  sale_to_list_ratio numeric DEFAULT 0,
  absorption_rate numeric DEFAULT 0,
  population_growth_rate numeric DEFAULT 0,
  job_growth_rate numeric DEFAULT 0,
  demand_pressure_score numeric DEFAULT 0,
  market_risk_score numeric DEFAULT 0,
  market_strength_score numeric DEFAULT 0,
  data_last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.market_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own market conditions"
  ON public.market_conditions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own market conditions"
  ON public.market_conditions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own market conditions"
  ON public.market_conditions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own market conditions"
  ON public.market_conditions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

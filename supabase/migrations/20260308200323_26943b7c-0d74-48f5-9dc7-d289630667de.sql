
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS closing_costs numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rehab_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rehab_contingency numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS down_payment_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loan_term_years numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_rent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_income numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxes numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maintenance_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vacancy_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS management_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capex_percent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS arv numeric NOT NULL DEFAULT 0;

-- Set existing purchase_price and estimated_arv defaults to 0 for consistency
ALTER TABLE public.deals ALTER COLUMN purchase_price SET DEFAULT 0;
ALTER TABLE public.deals ALTER COLUMN estimated_arv SET DEFAULT 0;

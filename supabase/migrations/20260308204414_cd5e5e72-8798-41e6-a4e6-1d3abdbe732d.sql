ALTER TABLE public.market_conditions
ADD COLUMN crime_score numeric NULL,
ADD COLUMN crime_risk_band text NULL,
ADD COLUMN crime_data_last_updated timestamp with time zone NULL;
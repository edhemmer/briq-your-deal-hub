import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MarketConditionsRow {
  id: string;
  user_id: string;
  deal_id: string | null;
  city: string;
  state: string;
  zipcode: string | null;
  median_rent: number;
  rent_growth_12mo: number;
  rent_growth_36mo: number;
  median_home_price: number;
  price_growth_12mo: number;
  price_growth_36mo: number;
  price_per_sqft: number;
  inventory_level: number;
  months_of_supply: number;
  days_on_market: number;
  sale_to_list_ratio: number;
  absorption_rate: number;
  population_growth_rate: number;
  job_growth_rate: number;
  demand_pressure_score: number;
  market_risk_score: number;
  market_strength_score: number;
  data_last_updated: string;
}

export function useMarketConditions(dealId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["market_conditions", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_conditions")
        .select("*")
        .eq("deal_id", dealId!)
        .maybeSingle();
      if (error) throw error;
      return data as MarketConditionsRow | null;
    },
    enabled: !!user && !!dealId,
  });
}

export function useUpsertMarketConditions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      deal_id: string;
      city: string;
      state: string;
      zipcode?: string;
      existing_id?: string;
      [key: string]: string | number | null | undefined;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { existing_id, ...fields } = input;

      if (existing_id) {
        const { data, error } = await supabase
          .from("market_conditions")
          .update({ ...fields, data_last_updated: new Date().toISOString() })
          .eq("id", existing_id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("market_conditions")
          .insert({ ...fields, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["market_conditions", variables.deal_id] });
    },
  });
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          annual_property_tax: number | null
          arv: number
          assessed_value: number | null
          capex_percent: number
          city: string
          closing_costs: number
          created_at: string
          deal_status: string | null
          down_payment_percent: number
          estimated_arv: number | null
          id: string
          insurance: number
          interest_rate: number
          loan_term_years: number
          lot_size: string | null
          maintenance_percent: number
          management_percent: number
          monthly_rent: number
          other_income: number
          property_address: string
          property_record_url: string | null
          property_type: string | null
          purchase_price: number | null
          rehab_contingency: number
          rehab_cost: number
          state: string
          strategy_primary: string | null
          taxes: number
          user_id: string
          vacancy_percent: number
          year_built: number | null
          zip_code: string | null
          zoning_type: string | null
        }
        Insert: {
          annual_property_tax?: number | null
          arv?: number
          assessed_value?: number | null
          capex_percent?: number
          city: string
          closing_costs?: number
          created_at?: string
          deal_status?: string | null
          down_payment_percent?: number
          estimated_arv?: number | null
          id?: string
          insurance?: number
          interest_rate?: number
          loan_term_years?: number
          lot_size?: string | null
          maintenance_percent?: number
          management_percent?: number
          monthly_rent?: number
          other_income?: number
          property_address: string
          property_record_url?: string | null
          property_type?: string | null
          purchase_price?: number | null
          rehab_contingency?: number
          rehab_cost?: number
          state: string
          strategy_primary?: string | null
          taxes?: number
          user_id: string
          vacancy_percent?: number
          year_built?: number | null
          zip_code?: string | null
          zoning_type?: string | null
        }
        Update: {
          annual_property_tax?: number | null
          arv?: number
          assessed_value?: number | null
          capex_percent?: number
          city?: string
          closing_costs?: number
          created_at?: string
          deal_status?: string | null
          down_payment_percent?: number
          estimated_arv?: number | null
          id?: string
          insurance?: number
          interest_rate?: number
          loan_term_years?: number
          lot_size?: string | null
          maintenance_percent?: number
          management_percent?: number
          monthly_rent?: number
          other_income?: number
          property_address?: string
          property_record_url?: string | null
          property_type?: string | null
          purchase_price?: number | null
          rehab_contingency?: number
          rehab_cost?: number
          state?: string
          strategy_primary?: string | null
          taxes?: number
          user_id?: string
          vacancy_percent?: number
          year_built?: number | null
          zip_code?: string | null
          zoning_type?: string | null
        }
        Relationships: []
      }
      market_conditions: {
        Row: {
          absorption_rate: number | null
          city: string
          created_at: string
          crime_data_last_updated: string | null
          crime_risk_band: string | null
          crime_score: number | null
          data_last_updated: string | null
          days_on_market: number | null
          deal_id: string | null
          demand_pressure_score: number | null
          id: string
          inventory_level: number | null
          job_growth_rate: number | null
          market_risk_score: number | null
          market_strength_score: number | null
          median_home_price: number | null
          median_rent: number | null
          months_of_supply: number | null
          population_growth_rate: number | null
          price_growth_12mo: number | null
          price_growth_36mo: number | null
          price_per_sqft: number | null
          rent_growth_12mo: number | null
          rent_growth_36mo: number | null
          sale_to_list_ratio: number | null
          state: string
          user_id: string
          zipcode: string | null
        }
        Insert: {
          absorption_rate?: number | null
          city: string
          created_at?: string
          crime_data_last_updated?: string | null
          crime_risk_band?: string | null
          crime_score?: number | null
          data_last_updated?: string | null
          days_on_market?: number | null
          deal_id?: string | null
          demand_pressure_score?: number | null
          id?: string
          inventory_level?: number | null
          job_growth_rate?: number | null
          market_risk_score?: number | null
          market_strength_score?: number | null
          median_home_price?: number | null
          median_rent?: number | null
          months_of_supply?: number | null
          population_growth_rate?: number | null
          price_growth_12mo?: number | null
          price_growth_36mo?: number | null
          price_per_sqft?: number | null
          rent_growth_12mo?: number | null
          rent_growth_36mo?: number | null
          sale_to_list_ratio?: number | null
          state: string
          user_id: string
          zipcode?: string | null
        }
        Update: {
          absorption_rate?: number | null
          city?: string
          created_at?: string
          crime_data_last_updated?: string | null
          crime_risk_band?: string | null
          crime_score?: number | null
          data_last_updated?: string | null
          days_on_market?: number | null
          deal_id?: string | null
          demand_pressure_score?: number | null
          id?: string
          inventory_level?: number | null
          job_growth_rate?: number | null
          market_risk_score?: number | null
          market_strength_score?: number | null
          median_home_price?: number | null
          median_rent?: number | null
          months_of_supply?: number | null
          population_growth_rate?: number | null
          price_growth_12mo?: number | null
          price_growth_36mo?: number | null
          price_per_sqft?: number | null
          rent_growth_12mo?: number | null
          rent_growth_36mo?: number | null
          sale_to_list_ratio?: number | null
          state?: string
          user_id?: string
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_conditions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_override: boolean | null
          created_at: string
          free_deal_used: boolean | null
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
        }
        Insert: {
          admin_override?: boolean | null
          created_at?: string
          free_deal_used?: boolean | null
          id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
        }
        Update: {
          admin_override?: boolean | null
          created_at?: string
          free_deal_used?: boolean | null
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

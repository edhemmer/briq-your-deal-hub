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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          apple_user_identifier: string | null
          completed_at: string | null
          id: string
          legal_retention_note: string | null
          processor_note: string | null
          reason: string | null
          request_source: string
          requested_at: string
          revoked_apple_token_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          apple_user_identifier?: string | null
          completed_at?: string | null
          id?: string
          legal_retention_note?: string | null
          processor_note?: string | null
          reason?: string | null
          request_source?: string
          requested_at?: string
          revoked_apple_token_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          apple_user_identifier?: string | null
          completed_at?: string | null
          id?: string
          legal_retention_note?: string | null
          processor_note?: string | null
          reason?: string | null
          request_source?: string
          requested_at?: string
          revoked_apple_token_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
      brix_decisions: {
        Row: {
          alternative_strategies: Json
          assumptions: Json
          bear_case: string | null
          bull_case: string | null
          committee_analysis: Json
          confidence_level: string
          created_at: string
          deal_id: string | null
          decision_readiness_score: number
          decision_type: string
          failure_scenarios: Json
          id: string
          key_risks: Json
          missing_information: Json
          neutral_view: string | null
          next_actions: Json
          outcome_tracking: Json
          property_twin_id: string | null
          recommendation_class: string
          recommendation_summary: string
          scenario_results: Json
          supporting_evidence: Json
          trust_score: number
          updated_at: string
          user_decision: string | null
          user_id: string
          what_must_be_true: Json
        }
        Insert: {
          alternative_strategies?: Json
          assumptions?: Json
          bear_case?: string | null
          bull_case?: string | null
          committee_analysis?: Json
          confidence_level: string
          created_at?: string
          deal_id?: string | null
          decision_readiness_score?: number
          decision_type: string
          failure_scenarios?: Json
          id?: string
          key_risks?: Json
          missing_information?: Json
          neutral_view?: string | null
          next_actions?: Json
          outcome_tracking?: Json
          property_twin_id?: string | null
          recommendation_class: string
          recommendation_summary: string
          scenario_results?: Json
          supporting_evidence?: Json
          trust_score?: number
          updated_at?: string
          user_decision?: string | null
          user_id: string
          what_must_be_true?: Json
        }
        Update: {
          alternative_strategies?: Json
          assumptions?: Json
          bear_case?: string | null
          bull_case?: string | null
          committee_analysis?: Json
          confidence_level?: string
          created_at?: string
          deal_id?: string | null
          decision_readiness_score?: number
          decision_type?: string
          failure_scenarios?: Json
          id?: string
          key_risks?: Json
          missing_information?: Json
          neutral_view?: string | null
          next_actions?: Json
          outcome_tracking?: Json
          property_twin_id?: string | null
          recommendation_class?: string
          recommendation_summary?: string
          scenario_results?: Json
          supporting_evidence?: Json
          trust_score?: number
          updated_at?: string
          user_decision?: string | null
          user_id?: string
          what_must_be_true?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brix_decisions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brix_decisions_property_twin_id_fkey"
            columns: ["property_twin_id"]
            isOneToOne: false
            referencedRelation: "property_digital_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      brix_field_captures: {
        Row: {
          ai_findings: Json
          capture_category: string | null
          capture_type: string
          captured_at: string
          confidence_score: number | null
          created_at: string
          deal_id: string | null
          id: string
          latitude: number | null
          local_identifier: string | null
          longitude: number | null
          project_id: string | null
          property_twin_id: string | null
          severity: string | null
          source_quality: string
          storage_path: string | null
          sync_status: string
          updated_at: string
          uploaded_at: string | null
          user_id: string
          user_note: string | null
          verification_recommendation: string | null
          voice_note_transcript: string | null
        }
        Insert: {
          ai_findings?: Json
          capture_category?: string | null
          capture_type: string
          captured_at?: string
          confidence_score?: number | null
          created_at?: string
          deal_id?: string | null
          id?: string
          latitude?: number | null
          local_identifier?: string | null
          longitude?: number | null
          project_id?: string | null
          property_twin_id?: string | null
          severity?: string | null
          source_quality?: string
          storage_path?: string | null
          sync_status?: string
          updated_at?: string
          uploaded_at?: string | null
          user_id: string
          user_note?: string | null
          verification_recommendation?: string | null
          voice_note_transcript?: string | null
        }
        Update: {
          ai_findings?: Json
          capture_category?: string | null
          capture_type?: string
          captured_at?: string
          confidence_score?: number | null
          created_at?: string
          deal_id?: string | null
          id?: string
          latitude?: number | null
          local_identifier?: string | null
          longitude?: number | null
          project_id?: string | null
          property_twin_id?: string | null
          severity?: string | null
          source_quality?: string
          storage_path?: string | null
          sync_status?: string
          updated_at?: string
          uploaded_at?: string | null
          user_id?: string
          user_note?: string | null
          verification_recommendation?: string | null
          voice_note_transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brix_field_captures_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brix_field_captures_property_twin_id_fkey"
            columns: ["property_twin_id"]
            isOneToOne: false
            referencedRelation: "property_digital_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      brix_portfolio_snapshots: {
        Row: {
          capital_allocation: Json
          concentration_analysis: Json
          created_at: string
          id: string
          liquidity: number | null
          monthly_cash_flow: number | null
          net_worth: number | null
          opportunities: Json
          portfolio_score: number | null
          risk_analysis: Json
          snapshot_date: string
          total_debt: number | null
          total_equity: number | null
          user_id: string
        }
        Insert: {
          capital_allocation?: Json
          concentration_analysis?: Json
          created_at?: string
          id?: string
          liquidity?: number | null
          monthly_cash_flow?: number | null
          net_worth?: number | null
          opportunities?: Json
          portfolio_score?: number | null
          risk_analysis?: Json
          snapshot_date?: string
          total_debt?: number | null
          total_equity?: number | null
          user_id: string
        }
        Update: {
          capital_allocation?: Json
          concentration_analysis?: Json
          created_at?: string
          id?: string
          liquidity?: number | null
          monthly_cash_flow?: number | null
          net_worth?: number | null
          opportunities?: Json
          portfolio_score?: number | null
          risk_analysis?: Json
          snapshot_date?: string
          total_debt?: number | null
          total_equity?: number | null
          user_id?: string
        }
        Relationships: []
      }
      brix_project_tasks: {
        Row: {
          created_at: string
          deal_id: string | null
          decision_id: string | null
          dependency_ids: string[]
          due_at: string | null
          id: string
          notes: string | null
          owner: string | null
          priority: string
          property_twin_id: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
          user_id: string
          verification_required: boolean
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          decision_id?: string | null
          dependency_ids?: string[]
          due_at?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          priority?: string
          property_twin_id?: string | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
          user_id: string
          verification_required?: boolean
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          decision_id?: string | null
          dependency_ids?: string[]
          due_at?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          priority?: string
          property_twin_id?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
          verification_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "brix_project_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brix_project_tasks_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "brix_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brix_project_tasks_property_twin_id_fkey"
            columns: ["property_twin_id"]
            isOneToOne: false
            referencedRelation: "property_digital_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      brix_visual_scope_items: {
        Row: {
          budget_confidence: number | null
          condition_score: string | null
          created_at: string
          detection_confidence: number | null
          expected_estimate: number | null
          field_capture_id: string | null
          finding: string
          high_estimate: number | null
          id: string
          labor_assumptions: Json
          low_estimate: number | null
          materials: Json
          property_twin_id: string | null
          recommended_action: string | null
          risks: Json
          room_or_system: string
          scope_confidence: number | null
          scope_type: string
          updated_at: string
          user_id: string
          verification_required: boolean
        }
        Insert: {
          budget_confidence?: number | null
          condition_score?: string | null
          created_at?: string
          detection_confidence?: number | null
          expected_estimate?: number | null
          field_capture_id?: string | null
          finding: string
          high_estimate?: number | null
          id?: string
          labor_assumptions?: Json
          low_estimate?: number | null
          materials?: Json
          property_twin_id?: string | null
          recommended_action?: string | null
          risks?: Json
          room_or_system: string
          scope_confidence?: number | null
          scope_type: string
          updated_at?: string
          user_id: string
          verification_required?: boolean
        }
        Update: {
          budget_confidence?: number | null
          condition_score?: string | null
          created_at?: string
          detection_confidence?: number | null
          expected_estimate?: number | null
          field_capture_id?: string | null
          finding?: string
          high_estimate?: number | null
          id?: string
          labor_assumptions?: Json
          low_estimate?: number | null
          materials?: Json
          property_twin_id?: string | null
          recommended_action?: string | null
          risks?: Json
          room_or_system?: string
          scope_confidence?: number | null
          scope_type?: string
          updated_at?: string
          user_id?: string
          verification_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "brix_visual_scope_items_field_capture_id_fkey"
            columns: ["field_capture_id"]
            isOneToOne: false
            referencedRelation: "brix_field_captures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brix_visual_scope_items_property_twin_id_fkey"
            columns: ["property_twin_id"]
            isOneToOne: false
            referencedRelation: "property_digital_twins"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          appraisal_contingency: boolean | null
          buyer_name: string | null
          closing_date: string | null
          contract_file_url: string | null
          contract_name: string
          contract_text: string | null
          contract_type: string | null
          contractiq_analysis: Json | null
          created_at: string
          deal_id: string | null
          earnest_money: number | null
          extraction_confidence: Json | null
          extraction_meta: Json | null
          financing_contingency: boolean | null
          id: string
          inspection_contingency: boolean | null
          inspection_period_days: number | null
          perspective: string
          property_address: string | null
          purchase_price: number | null
          seller_name: string | null
          source_files: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appraisal_contingency?: boolean | null
          buyer_name?: string | null
          closing_date?: string | null
          contract_file_url?: string | null
          contract_name: string
          contract_text?: string | null
          contract_type?: string | null
          contractiq_analysis?: Json | null
          created_at?: string
          deal_id?: string | null
          earnest_money?: number | null
          extraction_confidence?: Json | null
          extraction_meta?: Json | null
          financing_contingency?: boolean | null
          id?: string
          inspection_contingency?: boolean | null
          inspection_period_days?: number | null
          perspective?: string
          property_address?: string | null
          purchase_price?: number | null
          seller_name?: string | null
          source_files?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appraisal_contingency?: boolean | null
          buyer_name?: string | null
          closing_date?: string | null
          contract_file_url?: string | null
          contract_name?: string
          contract_text?: string | null
          contract_type?: string | null
          contractiq_analysis?: Json | null
          created_at?: string
          deal_id?: string | null
          earnest_money?: number | null
          extraction_confidence?: Json | null
          extraction_meta?: Json | null
          financing_contingency?: boolean | null
          id?: string
          inspection_contingency?: boolean | null
          inspection_period_days?: number | null
          perspective?: string
          property_address?: string | null
          purchase_price?: number | null
          seller_name?: string | null
          source_files?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          annual_property_tax: number | null
          arv: number
          assessed_value: number | null
          asset_type: string | null
          baths: number | null
          beds: number | null
          buyer_name: string | null
          capex_percent: number
          city: string
          closing_costs: number
          condition_notes: Json
          created_at: string
          deal_name: string | null
          deal_status: string | null
          dealiq_analysis: Json | null
          down_payment_percent: number
          estimated_arv: number | null
          future_contractiq_analysis: Json | null
          id: string
          insurance: number
          interest_rate: number
          listing_photo_urls: Json
          listing_remarks: string | null
          listing_source: string | null
          listing_url: string | null
          loan_term_years: number
          lot_size: string | null
          maintenance_percent: number
          management_percent: number
          missing_questions: Json
          monthly_rent: number
          other_income: number
          photo_analysis_status: string
          property_address: string
          property_record_url: string | null
          property_type: string | null
          purchase_price: number | null
          rehab_contingency: number
          rehab_cost: number
          seller_name: string | null
          state: string
          strategy_primary: string | null
          source_confidence: string
          square_feet: number | null
          taxes: number
          updated_at: string
          user_id: string
          vacancy_percent: number
          visible_or_stated_risks: Json
          year_built: number | null
          zip_code: string | null
          zoning_type: string | null
        }
        Insert: {
          annual_property_tax?: number | null
          arv?: number
          assessed_value?: number | null
          asset_type?: string | null
          baths?: number | null
          beds?: number | null
          buyer_name?: string | null
          capex_percent?: number
          city: string
          closing_costs?: number
          condition_notes?: Json
          created_at?: string
          deal_name?: string | null
          deal_status?: string | null
          dealiq_analysis?: Json | null
          down_payment_percent?: number
          estimated_arv?: number | null
          future_contractiq_analysis?: Json | null
          id?: string
          insurance?: number
          interest_rate?: number
          listing_photo_urls?: Json
          listing_remarks?: string | null
          listing_source?: string | null
          listing_url?: string | null
          loan_term_years?: number
          lot_size?: string | null
          maintenance_percent?: number
          management_percent?: number
          missing_questions?: Json
          monthly_rent?: number
          other_income?: number
          photo_analysis_status?: string
          property_address: string
          property_record_url?: string | null
          property_type?: string | null
          purchase_price?: number | null
          rehab_contingency?: number
          rehab_cost?: number
          seller_name?: string | null
          state: string
          strategy_primary?: string | null
          source_confidence?: string
          square_feet?: number | null
          taxes?: number
          updated_at?: string
          user_id: string
          vacancy_percent?: number
          visible_or_stated_risks?: Json
          year_built?: number | null
          zip_code?: string | null
          zoning_type?: string | null
        }
        Update: {
          annual_property_tax?: number | null
          arv?: number
          assessed_value?: number | null
          asset_type?: string | null
          baths?: number | null
          beds?: number | null
          buyer_name?: string | null
          capex_percent?: number
          city?: string
          closing_costs?: number
          condition_notes?: Json
          created_at?: string
          deal_name?: string | null
          deal_status?: string | null
          dealiq_analysis?: Json | null
          down_payment_percent?: number
          estimated_arv?: number | null
          future_contractiq_analysis?: Json | null
          id?: string
          insurance?: number
          interest_rate?: number
          listing_photo_urls?: Json
          listing_remarks?: string | null
          listing_source?: string | null
          listing_url?: string | null
          loan_term_years?: number
          lot_size?: string | null
          maintenance_percent?: number
          management_percent?: number
          missing_questions?: Json
          monthly_rent?: number
          other_income?: number
          photo_analysis_status?: string
          property_address?: string
          property_record_url?: string | null
          property_type?: string | null
          purchase_price?: number | null
          rehab_contingency?: number
          rehab_cost?: number
          seller_name?: string | null
          state?: string
          strategy_primary?: string | null
          source_confidence?: string
          square_feet?: number | null
          taxes?: number
          updated_at?: string
          user_id?: string
          vacancy_percent?: number
          visible_or_stated_risks?: Json
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
          apple_full_name_captured_at: string | null
          apple_private_relay_email: boolean | null
          apple_user_identifier: string | null
          auth_provider: string | null
          created_at: string
          deletion_completed_at: string | null
          deletion_requested_at: string | null
          deletion_status: string | null
          free_deal_used: boolean | null
          id: string
          manual_override_note: string | null
          manual_override_updated_at: string | null
          manual_override_updated_by: string | null
          manual_premium_override: boolean | null
          privacy_policy_accepted_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          terms_accepted_at: string | null
        }
        Insert: {
          admin_override?: boolean | null
          apple_full_name_captured_at?: string | null
          apple_private_relay_email?: boolean | null
          apple_user_identifier?: string | null
          auth_provider?: string | null
          created_at?: string
          deletion_completed_at?: string | null
          deletion_requested_at?: string | null
          deletion_status?: string | null
          free_deal_used?: boolean | null
          id: string
          manual_override_note?: string | null
          manual_override_updated_at?: string | null
          manual_override_updated_by?: string | null
          manual_premium_override?: boolean | null
          privacy_policy_accepted_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          terms_accepted_at?: string | null
        }
        Update: {
          admin_override?: boolean | null
          apple_full_name_captured_at?: string | null
          apple_private_relay_email?: boolean | null
          apple_user_identifier?: string | null
          auth_provider?: string | null
          created_at?: string
          deletion_completed_at?: string | null
          deletion_requested_at?: string | null
          deletion_status?: string | null
          free_deal_used?: boolean | null
          id?: string
          manual_override_note?: string | null
          manual_override_updated_at?: string | null
          manual_override_updated_by?: string | null
          manual_premium_override?: boolean | null
          privacy_policy_accepted_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          terms_accepted_at?: string | null
        }
        Relationships: []
      }
      property_digital_twins: {
        Row: {
          address: string
          condition_layer: Json
          created_at: string
          data_freshness: Json
          deal_id: string | null
          decision_readiness_score: number
          financial_layer: Json
          id: string
          insurance_layer: Json
          legal_layer: Json
          market_layer: Json
          memory_layer: Json
          ownership_status: string
          physical_layer: Json
          portfolio_layer: Json
          property_id: string
          property_type: string | null
          strategy_layer: Json
          tax_layer: Json
          trust_score: number
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          address: string
          condition_layer?: Json
          created_at?: string
          data_freshness?: Json
          deal_id?: string | null
          decision_readiness_score?: number
          financial_layer?: Json
          id?: string
          insurance_layer?: Json
          legal_layer?: Json
          market_layer?: Json
          memory_layer?: Json
          ownership_status?: string
          physical_layer?: Json
          portfolio_layer?: Json
          property_id?: string
          property_type?: string | null
          strategy_layer?: Json
          tax_layer?: Json
          trust_score?: number
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          address?: string
          condition_layer?: Json
          created_at?: string
          data_freshness?: Json
          deal_id?: string | null
          decision_readiness_score?: number
          financial_layer?: Json
          id?: string
          insurance_layer?: Json
          legal_layer?: Json
          market_layer?: Json
          memory_layer?: Json
          ownership_status?: string
          physical_layer?: Json
          portfolio_layer?: Json
          property_id?: string
          property_type?: string | null
          strategy_layer?: Json
          tax_layer?: Json
          trust_score?: number
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_digital_twins_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
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
      has_admin_access: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "superadmin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

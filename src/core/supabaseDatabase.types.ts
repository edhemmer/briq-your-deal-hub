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
      admin_owner_emails: {
        Row: {
          created_at: string
          email: string
          label: string | null
        }
        Insert: {
          created_at?: string
          email: string
          label?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          label?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_table: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_table?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_table?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      brix_admin_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      brix_assets: {
        Row: {
          address: string
          asset_data: Json
          created_at: string
          deal_id: string | null
          id: string
          owner_id: string
        }
        Insert: {
          address: string
          asset_data?: Json
          created_at?: string
          deal_id?: string | null
          id?: string
          owner_id: string
        }
        Update: {
          address?: string
          asset_data?: Json
          created_at?: string
          deal_id?: string | null
          id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brix_assets_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      brix_deal_evidence: {
        Row: {
          ai_findings: Json
          created_at: string
          deal_id: string
          evidence_type: string
          id: string
          notes: string | null
          owner_id: string
          source: string | null
          storage_path: string | null
        }
        Insert: {
          ai_findings?: Json
          created_at?: string
          deal_id: string
          evidence_type: string
          id?: string
          notes?: string | null
          owner_id: string
          source?: string | null
          storage_path?: string | null
        }
        Update: {
          ai_findings?: Json
          created_at?: string
          deal_id?: string
          evidence_type?: string
          id?: string
          notes?: string | null
          owner_id?: string
          source?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brix_deal_evidence_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      brix_deals: {
        Row: {
          address: string
          analysis: Json
          archived_at: string | null
          city: string | null
          county: string | null
          created_at: string
          created_by: string | null
          deal_type: string
          deleted_at: string | null
          display_name: string
          facts: Json
          id: string
          operating_status: string
          owner_id: string
          priority: string
          source: string
          source_text: string | null
          source_url: string | null
          stage: string
          state: string | null
          status: Database["public"]["Enums"]["brix_deal_status"]
          strategy_id: string
          strategy_intent: string | null
          updated_at: string
          updated_by: string | null
          verification: Json
          version: number
          workspace_id: string
          zip: string | null
        }
        Insert: {
          address: string
          analysis?: Json
          archived_at?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          deal_type?: string
          deleted_at?: string | null
          display_name: string
          facts?: Json
          id?: string
          operating_status?: string
          owner_id: string
          priority?: string
          source?: string
          source_text?: string | null
          source_url?: string | null
          stage?: string
          state?: string | null
          status?: Database["public"]["Enums"]["brix_deal_status"]
          strategy_id: string
          strategy_intent?: string | null
          updated_at?: string
          updated_by?: string | null
          verification?: Json
          version?: number
          workspace_id: string
          zip?: string | null
        }
        Update: {
          address?: string
          analysis?: Json
          archived_at?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          deal_type?: string
          deleted_at?: string | null
          display_name?: string
          facts?: Json
          id?: string
          operating_status?: string
          owner_id?: string
          priority?: string
          source?: string
          source_text?: string | null
          source_url?: string | null
          stage?: string
          state?: string | null
          status?: Database["public"]["Enums"]["brix_deal_status"]
          strategy_id?: string
          strategy_intent?: string | null
          updated_at?: string
          updated_by?: string | null
          verification?: Json
          version?: number
          workspace_id?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brix_deals_operating_status_fk"
            columns: ["operating_status"]
            isOneToOne: false
            referencedRelation: "deal_operating_status_definitions"
            referencedColumns: ["status_key"]
          },
          {
            foreignKeyName: "brix_deals_stage_fk"
            columns: ["stage"]
            isOneToOne: false
            referencedRelation: "deal_stage_definitions"
            referencedColumns: ["stage_key"]
          },
          {
            foreignKeyName: "brix_deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      brix_offers: {
        Row: {
          closing_timeline_days: number | null
          contingencies: Json
          created_at: string
          deal_id: string | null
          due_diligence_days: number | null
          earnest_money: number | null
          generated_summary: string | null
          id: string
          memo: Json
          offer_status: string
          offer_type: string
          owner_id: string | null
          purchase_price: number | null
          repair_requests: string | null
          seller_concessions: number | null
          strategy_snapshot: Json
          terms: Json
          updated_at: string
          user_id: string
          walkaway_price: number | null
        }
        Insert: {
          closing_timeline_days?: number | null
          contingencies?: Json
          created_at?: string
          deal_id?: string | null
          due_diligence_days?: number | null
          earnest_money?: number | null
          generated_summary?: string | null
          id?: string
          memo?: Json
          offer_status?: string
          offer_type?: string
          owner_id?: string | null
          purchase_price?: number | null
          repair_requests?: string | null
          seller_concessions?: number | null
          strategy_snapshot?: Json
          terms?: Json
          updated_at?: string
          user_id: string
          walkaway_price?: number | null
        }
        Update: {
          closing_timeline_days?: number | null
          contingencies?: Json
          created_at?: string
          deal_id?: string | null
          due_diligence_days?: number | null
          earnest_money?: number | null
          generated_summary?: string | null
          id?: string
          memo?: Json
          offer_status?: string
          offer_type?: string
          owner_id?: string | null
          purchase_price?: number | null
          repair_requests?: string | null
          seller_concessions?: number | null
          strategy_snapshot?: Json
          terms?: Json
          updated_at?: string
          user_id?: string
          walkaway_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brix_offers_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
      brix_profiles: {
        Row: {
          account_delete_requested_at: string | null
          billing_override: boolean
          created_at: string
          created_deal_count: number
          email: string
          free_deal_limit: number
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["brix_plan"]
          role: string
          updated_at: string
        }
        Insert: {
          account_delete_requested_at?: string | null
          billing_override?: boolean
          created_at?: string
          created_deal_count?: number
          email: string
          free_deal_limit?: number
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["brix_plan"]
          role?: string
          updated_at?: string
        }
        Update: {
          account_delete_requested_at?: string | null
          billing_override?: boolean
          created_at?: string
          created_deal_count?: number
          email?: string
          free_deal_limit?: number
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["brix_plan"]
          role?: string
          updated_at?: string
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
            foreignKeyName: "brix_project_tasks_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "mobile_decision_snapshots"
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
      brix_reports: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          payload: Json
          report_status: string
          report_type: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          payload?: Json
          report_status?: string
          report_type?: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          payload?: Json
          report_status?: string
          report_type?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brix_reports_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      brix_tasks: {
        Row: {
          created_at: string
          deal_id: string
          due_at: string | null
          id: string
          owner_id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          due_at?: string | null
          id?: string
          owner_id: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          due_at?: string | null
          id?: string
          owner_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "brix_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
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
      contacts: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          display_name: string
          first_name: string | null
          id: string
          last_name: string | null
          normalized_email: string | null
          normalized_phone: string | null
          notes: string | null
          preferred_contact_method: string | null
          primary_email: string | null
          primary_phone: string | null
          updated_at: string
          updated_by: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          display_name: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          notes?: string | null
          preferred_contact_method?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          notes?: string | null
          preferred_contact_method?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      deal_creation_requests: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string | null
          deal_property_id: string | null
          id: string
          idempotency_key: string
          property_id: string | null
          request_hash: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          deal_property_id?: string | null
          id?: string
          idempotency_key: string
          property_id?: string | null
          request_hash: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          deal_property_id?: string | null
          id?: string
          idempotency_key?: string
          property_id?: string | null
          request_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_creation_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_file_usage: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_file_usage_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_operating_status_definitions: {
        Row: {
          created_at: string
          is_initial: boolean
          is_terminal: boolean
          label: string
          sort_order: number
          status_key: string
        }
        Insert: {
          created_at?: string
          is_initial?: boolean
          is_terminal?: boolean
          label: string
          sort_order: number
          status_key: string
        }
        Update: {
          created_at?: string
          is_initial?: boolean
          is_terminal?: boolean
          label?: string
          sort_order?: number
          status_key?: string
        }
        Relationships: []
      }
      deal_properties: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
          inclusion_status: string
          notes: string | null
          property_id: string
          role: string
          updated_at: string
          updated_by: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
          inclusion_status?: string
          notes?: string | null
          property_id: string
          role?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
          inclusion_status?: string
          notes?: string | null
          property_id?: string
          role?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_properties_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "deal_properties_inclusion_status_fk"
            columns: ["inclusion_status"]
            isOneToOne: false
            referencedRelation: "deal_property_inclusion_status_definitions"
            referencedColumns: ["status_key"]
          },
          {
            foreignKeyName: "deal_properties_property_fk"
            columns: ["workspace_id", "property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "deal_properties_role_fk"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "deal_property_role_definitions"
            referencedColumns: ["role_key"]
          },
        ]
      }
      deal_property_inclusion_status_definitions: {
        Row: {
          created_at: string
          label: string
          sort_order: number
          status_key: string
        }
        Insert: {
          created_at?: string
          label: string
          sort_order: number
          status_key: string
        }
        Update: {
          created_at?: string
          label?: string
          sort_order?: number
          status_key?: string
        }
        Relationships: []
      }
      deal_property_role_definitions: {
        Row: {
          created_at: string
          label: string
          role_key: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          label: string
          role_key: string
          sort_order: number
        }
        Update: {
          created_at?: string
          label?: string
          role_key?: string
          sort_order?: number
        }
        Relationships: []
      }
      deal_relationship_role_definitions: {
        Row: {
          created_at: string
          label: string
          role_key: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          label: string
          role_key: string
          sort_order: number
        }
        Update: {
          created_at?: string
          label?: string
          role_key?: string
          sort_order?: number
        }
        Relationships: []
      }
      deal_relationship_status_definitions: {
        Row: {
          created_at: string
          is_active: boolean
          label: string
          sort_order: number
          status_key: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          label: string
          sort_order: number
          status_key: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          status_key?: string
        }
        Relationships: []
      }
      deal_relationships: {
        Row: {
          archived_at: string | null
          communication_preference: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
          is_primary: boolean
          notes: string | null
          organization_id: string | null
          role: string
          status: string
          updated_at: string
          updated_by: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          communication_preference?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          organization_id?: string | null
          role: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          communication_preference?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          organization_id?: string | null
          role?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_relationships_contact_fk"
            columns: ["workspace_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "deal_relationships_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "deal_relationships_organization_fk"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "deal_relationships_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "deal_relationship_role_definitions"
            referencedColumns: ["role_key"]
          },
          {
            foreignKeyName: "deal_relationships_status_fkey"
            columns: ["status"]
            isOneToOne: false
            referencedRelation: "deal_relationship_status_definitions"
            referencedColumns: ["status_key"]
          },
          {
            foreignKeyName: "deal_relationships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_definitions: {
        Row: {
          created_at: string
          is_initial: boolean
          is_terminal: boolean
          label: string
          sort_order: number
          stage_key: string
        }
        Insert: {
          created_at?: string
          is_initial?: boolean
          is_terminal?: boolean
          label: string
          sort_order: number
          stage_key: string
        }
        Update: {
          created_at?: string
          is_initial?: boolean
          is_terminal?: boolean
          label?: string
          sort_order?: number
          stage_key?: string
        }
        Relationships: []
      }
      deal_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string
          deal_id: string
          from_stage: string | null
          id: string
          idempotency_key: string | null
          reason: string | null
          to_stage: string
          workspace_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          deal_id: string
          from_stage?: string | null
          id?: string
          idempotency_key?: string | null
          reason?: string | null
          to_stage: string
          workspace_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          deal_id?: string
          from_stage?: string | null
          id?: string
          idempotency_key?: string | null
          reason?: string | null
          to_stage?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "deal_stage_history_from_stage_fkey"
            columns: ["from_stage"]
            isOneToOne: false
            referencedRelation: "deal_stage_definitions"
            referencedColumns: ["stage_key"]
          },
          {
            foreignKeyName: "deal_stage_history_to_stage_fkey"
            columns: ["to_stage"]
            isOneToOne: false
            referencedRelation: "deal_stage_definitions"
            referencedColumns: ["stage_key"]
          },
        ]
      }
      deal_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          created_at: string
          deal_id: string
          from_status: string | null
          id: string
          idempotency_key: string | null
          reason: string | null
          to_status: string
          workspace_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          deal_id: string
          from_status?: string | null
          id?: string
          idempotency_key?: string | null
          reason?: string | null
          to_status: string
          workspace_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          deal_id?: string
          from_status?: string | null
          id?: string
          idempotency_key?: string | null
          reason?: string | null
          to_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_status_history_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "deal_status_history_from_status_fkey"
            columns: ["from_status"]
            isOneToOne: false
            referencedRelation: "deal_operating_status_definitions"
            referencedColumns: ["status_key"]
          },
          {
            foreignKeyName: "deal_status_history_to_status_fkey"
            columns: ["to_status"]
            isOneToOne: false
            referencedRelation: "deal_operating_status_definitions"
            referencedColumns: ["status_key"]
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
          county: string | null
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
          source_confidence: string
          square_feet: number | null
          state: string
          strategy_primary: string | null
          tax_history: Json
          tax_record_url: string | null
          tax_verification_status: string
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
          county?: string | null
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
          source_confidence?: string
          square_feet?: number | null
          state: string
          strategy_primary?: string | null
          tax_history?: Json
          tax_record_url?: string | null
          tax_verification_status?: string
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
          county?: string | null
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
          source_confidence?: string
          square_feet?: number | null
          state?: string
          strategy_primary?: string | null
          tax_history?: Json
          tax_record_url?: string | null
          tax_verification_status?: string
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
      domain_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          workspace_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          workspace_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          archived_at: string | null
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          legal_name: string | null
          normalized_email: string | null
          normalized_phone: string | null
          normalized_website_domain: string | null
          notes: string | null
          organization_type: string | null
          postal_code: string | null
          primary_email: string | null
          primary_phone: string | null
          region: string | null
          updated_at: string
          updated_by: string | null
          version: number
          website: string | null
          workspace_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          legal_name?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          normalized_website_domain?: string | null
          notes?: string | null
          organization_type?: string | null
          postal_code?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          region?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          website?: string | null
          workspace_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          legal_name?: string | null
          normalized_email?: string | null
          normalized_phone?: string | null
          normalized_website_domain?: string | null
          notes?: string | null
          organization_type?: string | null
          postal_code?: string | null
          primary_email?: string | null
          primary_phone?: string | null
          region?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          admin_override: boolean | null
          apple_full_name_captured_at: string | null
          apple_private_relay_email: boolean | null
          apple_user_identifier: string | null
          auth_provider: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          deletion_completed_at: string | null
          deletion_requested_at: string | null
          deletion_status: string | null
          email: string | null
          free_deal_used: boolean | null
          full_name: string | null
          id: string
          manual_override_note: string | null
          manual_override_updated_at: string | null
          manual_override_updated_by: string | null
          manual_premium_override: boolean | null
          presentation_mode: string
          privacy_policy_accepted_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          admin_override?: boolean | null
          apple_full_name_captured_at?: string | null
          apple_private_relay_email?: boolean | null
          apple_user_identifier?: string | null
          auth_provider?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deletion_completed_at?: string | null
          deletion_requested_at?: string | null
          deletion_status?: string | null
          email?: string | null
          free_deal_used?: boolean | null
          full_name?: string | null
          id: string
          manual_override_note?: string | null
          manual_override_updated_at?: string | null
          manual_override_updated_by?: string | null
          manual_premium_override?: boolean | null
          presentation_mode?: string
          privacy_policy_accepted_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          admin_override?: boolean | null
          apple_full_name_captured_at?: string | null
          apple_private_relay_email?: boolean | null
          apple_user_identifier?: string | null
          auth_provider?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          deletion_completed_at?: string | null
          deletion_requested_at?: string | null
          deletion_status?: string | null
          email?: string | null
          free_deal_used?: boolean | null
          full_name?: string | null
          id?: string
          manual_override_note?: string | null
          manual_override_updated_at?: string | null
          manual_override_updated_by?: string | null
          manual_premium_override?: boolean | null
          presentation_mode?: string
          privacy_policy_accepted_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          archived_at: string | null
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          display_address: string
          id: string
          latitude: number | null
          longitude: number | null
          parcel_identifier: string | null
          postal_code: string | null
          region: string | null
          source_identifiers: Json
          updated_at: string
          updated_by: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_address: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          parcel_identifier?: string | null
          postal_code?: string | null
          region?: string | null
          source_identifiers?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          archived_at?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          display_address?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          parcel_identifier?: string | null
          postal_code?: string | null
          region?: string | null
          source_identifiers?: Json
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      relationship_command_requests: {
        Row: {
          command_name: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          idempotency_key: string
          organization_id: string | null
          relationship_id: string | null
          request_hash: string
          workspace_id: string
        }
        Insert: {
          command_name: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idempotency_key: string
          organization_id?: string | null
          relationship_id?: string | null
          request_hash: string
          workspace_id: string
        }
        Update: {
          command_name?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idempotency_key?: string
          organization_id?: string | null
          relationship_id?: string | null
          request_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_command_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          normalized_email: string | null
          resent_at: string | null
          revoked_at: string | null
          role_id: string
          status: string
          token_hash: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          normalized_email?: string | null
          resent_at?: string | null
          revoked_at?: string | null
          role_id: string
          status?: string
          token_hash?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          normalized_email?: string | null
          resent_at?: string | null
          revoked_at?: string | null
          role_id?: string
          status?: string
          token_hash?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          role_changed_at: string | null
          role_changed_by: string | null
          role_id: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_changed_at?: string | null
          role_changed_by?: string | null
          role_id: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_changed_at?: string | null
          role_changed_by?: string | null
          role_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      mobile_decision_snapshots: {
        Row: {
          confidence: number | null
          created_at: string | null
          deal_id: string | null
          evidence_summary: string | null
          id: string | null
          next_action: string | null
          primary_risk: string | null
          readiness_score: number | null
          recommendation: string | null
          trust_score: number | null
          updated_at: string | null
        }
        Insert: {
          confidence?: never
          created_at?: string | null
          deal_id?: string | null
          evidence_summary?: string | null
          id?: string | null
          next_action?: never
          primary_risk?: never
          readiness_score?: number | null
          recommendation?: string | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Update: {
          confidence?: never
          created_at?: string | null
          deal_id?: string | null
          evidence_summary?: string | null
          id?: string | null
          next_action?: never
          primary_risk?: never
          readiness_score?: number | null
          recommendation?: string | null
          trust_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brix_decisions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_workspace_invitation: {
        Args: { invitation_token: string }
        Returns: {
          invitation_id: string
          membership_id: string
          role_id: string
          status: string
          workspace_id: string
          workspace_name: string
        }[]
      }
      attach_contact_to_deal: {
        Args: {
          idempotency_key?: string
          relationship_input?: Json
          target_contact_id: string
          target_deal_id: string
        }
        Returns: {
          idempotency_key_out: string
          relationship_id: string
          relationship_version: number
        }[]
      }
      attach_organization_to_deal: {
        Args: {
          idempotency_key?: string
          relationship_input?: Json
          target_deal_id: string
          target_organization_id: string
        }
        Returns: {
          idempotency_key_out: string
          relationship_id: string
          relationship_version: number
        }[]
      }
      can_create_brix_deal: { Args: never; Returns: boolean }
      change_workspace_member_role: {
        Args: {
          expected_updated_at?: string
          new_role_id: string
          target_membership_id: string
        }
        Returns: {
          membership_id: string
          role_id: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }[]
      }
      create_brix_contact: {
        Args: {
          contact_input?: Json
          idempotency_key?: string
          target_workspace_id: string
        }
        Returns: {
          contact_id: string
          contact_version: number
          duplicate_candidates: Json
          idempotency_key_out: string
        }[]
      }
      create_brix_organization: {
        Args: {
          idempotency_key?: string
          organization_input?: Json
          target_workspace_id: string
        }
        Returns: {
          duplicate_candidates: Json
          idempotency_key_out: string
          organization_id: string
          organization_version: number
        }[]
      }
      create_canonical_deal: {
        Args: {
          deal_input?: Json
          existing_property_id?: string
          idempotency_key: string
          property_input?: Json
          target_workspace_id: string
        }
        Returns: {
          deal_id: string
          deal_property_id: string
          deal_property_version: number
          deal_version: number
          idempotency_key_out: string
          property_id: string
          property_version: number
          stage: string
          status: string
        }[]
      }
      create_deal_deadline: {
        Args: { deadline_input: Json; idempotency_key: string; target_deal_id: string }
        Returns: { deadline_id: string; deadline_version: number }[]
      }
      create_deal_note: {
        Args: { idempotency_key: string; note_input: Json; target_deal_id: string }
        Returns: { note_id: string; note_version: number }[]
      }
      create_deal_task: {
        Args: { idempotency_key: string; target_deal_id: string; task_input: Json }
        Returns: { task_id: string; task_version: number }[]
      }
      create_workspace_invitation: {
        Args: {
          invite_email: string
          invite_role_id?: string
          target_workspace_id: string
        }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_link: string
          invited_email: string
          role_id: string
          status: string
        }[]
      }
      deactivate_deal_relationship: {
        Args: { expected_version?: number; target_relationship_id: string }
        Returns: {
          relationship_id: string
          relationship_version: number
        }[]
      }
      archive_deal_note: {
        Args: { expected_version?: number; target_note_id: string }
        Returns: { note_id: string; note_version: number }[]
      }
      cancel_deal_task: {
        Args: { expected_version?: number; target_task_id: string }
        Returns: { task_id: string; task_version: number }[]
      }
      complete_deal_deadline: {
        Args: { expected_version?: number; target_deadline_id: string }
        Returns: { deadline_id: string; deadline_version: number }[]
      }
      complete_deal_task: {
        Args: { expected_version?: number; target_task_id: string }
        Returns: { task_id: string; task_version: number }[]
      }
      ensure_current_profile: {
        Args: never
        Returns: {
          account_status: string
          admin_override: boolean | null
          apple_full_name_captured_at: string | null
          apple_private_relay_email: boolean | null
          apple_user_identifier: string | null
          auth_provider: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          deletion_completed_at: string | null
          deletion_requested_at: string | null
          deletion_status: string | null
          email: string | null
          free_deal_used: boolean | null
          full_name: string | null
          id: string
          manual_override_note: string | null
          manual_override_updated_at: string | null
          manual_override_updated_by: string | null
          manual_premium_override: boolean | null
          presentation_mode: string
          privacy_policy_accepted_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_workspace_context: {
        Args: never
        Returns: {
          profile_id: string
          role_id: string
          workspace_id: string
          workspace_name: string
        }[]
      }
      find_contact_candidates: {
        Args: { contact_input?: Json; target_workspace_id: string }
        Returns: {
          contact_id: string
          display_name: string
          match_reasons: string[]
          primary_email: string
          primary_phone: string
          version: number
        }[]
      }
      find_organization_candidates: {
        Args: { organization_input?: Json; target_workspace_id: string }
        Returns: {
          display_name: string
          legal_name: string
          match_reasons: string[]
          organization_id: string
          primary_phone: string
          version: number
          website: string
        }[]
      }
      has_admin_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_permission: {
        Args: { required_permission: string; target_workspace_id: string }
        Returns: boolean
      }
      hash_invitation_token: {
        Args: { invitation_token: string }
        Returns: string
      }
      is_brix_admin: { Args: never; Returns: boolean }
      is_workspace_member: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      list_deal_relationships: {
        Args: { target_deal_id: string }
        Returns: {
          communication_preference: string
          contact_id: string
          deal_id: string
          is_primary: boolean
          notes: string
          organization_id: string
          relationship_id: string
          relationship_version: number
          role: string
          role_label: string
          status: string
          status_label: string
          target_archived_at: string
          target_display_name: string
          target_email: string
          target_phone: string
          target_type: string
          target_website: string
          updated_at: string
          workspace_id: string
        }[]
      }
      list_deal_notes: {
        Args: { target_deal_id: string }
        Returns: {
          archived_at: string | null
          body: string
          created_at: string
          deal_id: string
          note_id: string
          note_type: string
          note_version: number
          pinned: boolean
          source_record_id: string | null
          source_type: string
          updated_at: string
          workspace_id: string
        }[]
      }
      list_deal_work: {
        Args: { target_deal_id: string }
        Returns: {
          archived_at: string | null
          body: string | null
          completed_at: string | null
          created_at: string
          deal_id: string
          due_at: string | null
          due_date: string | null
          is_all_day: boolean
          pinned: boolean
          priority: string | null
          record_id: string
          record_type: string
          record_version: number
          source_record_id: string | null
          source_type: string
          status: string
          timezone: string
          title: string
          updated_at: string
          verification_state: string | null
          work_type: string
          workspace_id: string
        }[]
      }
      load_deal_timeline: {
        Args: { before_time?: string | null; page_size?: number; target_deal_id: string }
        Returns: {
          actor_id: string | null
          canonical_order: string
          deal_id: string
          event_type: string
          occurred_at: string
          safe_summary: string
          safe_title: string
          source_record_id: string | null
          source_type: string
          timeline_id: string
          workspace_id: string
        }[]
      }
      list_workspace_access_roles: {
        Args: never
        Returns: {
          role_description: string
          role_id: string
          role_name: string
        }[]
      }
      list_workspace_memberships: {
        Args: { target_workspace_id: string }
        Returns: {
          can_change_role: boolean
          can_revoke: boolean
          email: string
          full_name: string
          invited_at: string
          joined_at: string
          membership_id: string
          revoked_at: string
          role_description: string
          role_id: string
          role_name: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }[]
      }
      load_brix_contact: {
        Args: { target_contact_id: string }
        Returns: {
          archived_at: string
          contact_id: string
          display_name: string
          first_name: string
          last_name: string
          notes: string
          preferred_contact_method: string
          primary_email: string
          primary_phone: string
          version: number
          workspace_id: string
        }[]
      }
      load_brix_organization: {
        Args: { target_organization_id: string }
        Returns: {
          address_line1: string
          archived_at: string
          city: string
          country: string
          display_name: string
          legal_name: string
          notes: string
          organization_id: string
          organization_type: string
          postal_code: string
          primary_email: string
          primary_phone: string
          region: string
          version: number
          website: string
          workspace_id: string
        }[]
      }
      normalize_contact_phone: { Args: { raw_phone: string }; Returns: string }
      normalize_invitation_email: {
        Args: { invite_email: string }
        Returns: string
      }
      normalize_website_domain: {
        Args: { raw_website: string }
        Returns: string
      }
      relationship_workspace_for_deal: {
        Args: { target_deal_id: string }
        Returns: string
      }
      request_brix_account_deletion: {
        Args: { request_source?: string }
        Returns: {
          request_id: string
          requested_at: string
          status: string
        }[]
      }
      resend_workspace_invitation: {
        Args: { target_invitation_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_link: string
          invited_email: string
          role_id: string
          status: string
        }[]
      }
      revoke_workspace_invitation: {
        Args: { target_invitation_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          invited_email: string
          role_id: string
          status: string
        }[]
      }
      revoke_workspace_member: {
        Args: {
          expected_updated_at?: string
          revoke_reason?: string
          target_membership_id: string
        }
        Returns: {
          membership_id: string
          role_id: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }[]
      }
      update_brix_contact: {
        Args: {
          contact_input?: Json
          expected_version: number
          target_contact_id: string
        }
        Returns: {
          contact_id: string
          contact_version: number
        }[]
      }
      update_brix_organization: {
        Args: {
          expected_version: number
          organization_input?: Json
          target_organization_id: string
        }
        Returns: {
          organization_id: string
          organization_version: number
        }[]
      }
      update_deal_relationship: {
        Args: {
          expected_version: number
          relationship_input?: Json
          target_relationship_id: string
        }
        Returns: {
          relationship_id: string
          relationship_version: number
        }[]
      }
      update_deal_deadline: {
        Args: {
          deadline_input: Json
          expected_version?: number
          target_deadline_id: string
        }
        Returns: { deadline_id: string; deadline_version: number }[]
      }
      update_deal_note: {
        Args: {
          expected_version?: number
          note_input: Json
          target_note_id: string
        }
        Returns: { note_id: string; note_version: number }[]
      }
      update_deal_task: {
        Args: {
          expected_version?: number
          target_task_id: string
          task_input: Json
        }
        Returns: { task_id: string; task_version: number }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "superadmin"
      brix_deal_status:
        | "draft"
        | "reviewing"
        | "underwriting"
        | "pursuing"
        | "under_contract"
        | "closed"
        | "passed"
      brix_plan: "free" | "paid" | "admin"
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
      app_role: ["admin", "moderator", "user", "superadmin"],
      brix_deal_status: [
        "draft",
        "reviewing",
        "underwriting",
        "pursuing",
        "under_contract",
        "closed",
        "passed",
      ],
      brix_plan: ["free", "paid", "admin"],
    },
  },
} as const

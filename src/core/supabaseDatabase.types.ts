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
          actor_type: string
          after_values: Json
          before_values: Json
          causation_id: string | null
          changed_fields: string[]
          correlation_id: string
          created_at: string
          deal_id: string | null
          id: string
          idempotency_key: string | null
          metadata: Json
          occurred_at: string
          property_id: string | null
          reason: string | null
          source_client: string
          source_command: string | null
          success: boolean
          target_id: string | null
          target_table: string | null
          target_type: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          after_values?: Json
          before_values?: Json
          causation_id?: string | null
          changed_fields?: string[]
          correlation_id?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          occurred_at?: string
          property_id?: string | null
          reason?: string | null
          source_client?: string
          source_command?: string | null
          success?: boolean
          target_id?: string | null
          target_table?: string | null
          target_type?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          after_values?: Json
          before_values?: Json
          causation_id?: string | null
          changed_fields?: string[]
          correlation_id?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          occurred_at?: string
          property_id?: string | null
          reason?: string | null
          source_client?: string
          source_command?: string | null
          success?: boolean
          target_id?: string | null
          target_table?: string | null
          target_type?: string | null
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
      deadline_status_definitions: {
        Row: {
          created_at: string
          is_terminal: boolean
          label: string
          sort_order: number
          status_key: string
        }
        Insert: {
          created_at?: string
          is_terminal?: boolean
          label: string
          sort_order: number
          status_key: string
        }
        Update: {
          created_at?: string
          is_terminal?: boolean
          label?: string
          sort_order?: number
          status_key?: string
        }
        Relationships: []
      }
      deadline_verification_state_definitions: {
        Row: {
          created_at: string
          label: string
          requires_review: boolean
          sort_order: number
          state_key: string
        }
        Insert: {
          created_at?: string
          label: string
          requires_review?: boolean
          sort_order: number
          state_key: string
        }
        Update: {
          created_at?: string
          label?: string
          requires_review?: boolean
          sort_order?: number
          state_key?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          archived_at: string | null
          calculation_rule: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          due_at: string | null
          due_date: string | null
          id: string
          is_all_day: boolean
          source_description: string | null
          source_record_id: string | null
          source_term: string | null
          source_type: string
          status: string
          timezone: string
          title: string
          trigger_date: string | null
          updated_at: string
          updated_by: string | null
          verification_state: string
          version: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          calculation_rule?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          due_at?: string | null
          due_date?: string | null
          id?: string
          is_all_day?: boolean
          source_description?: string | null
          source_record_id?: string | null
          source_term?: string | null
          source_type?: string
          status?: string
          timezone?: string
          title: string
          trigger_date?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_state?: string
          version?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          calculation_rule?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          due_at?: string | null
          due_date?: string | null
          id?: string
          is_all_day?: boolean
          source_description?: string | null
          source_record_id?: string | null
          source_term?: string | null
          source_type?: string
          status?: string
          timezone?: string
          title?: string
          trigger_date?: string | null
          updated_at?: string
          updated_by?: string | null
          verification_state?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "deadlines_status_fkey"
            columns: ["status"]
            isOneToOne: false
            referencedRelation: "deadline_status_definitions"
            referencedColumns: ["status_key"]
          },
          {
            foreignKeyName: "deadlines_verification_state_fkey"
            columns: ["verification_state"]
            isOneToOne: false
            referencedRelation: "deadline_verification_state_definitions"
            referencedColumns: ["state_key"]
          },
          {
            foreignKeyName: "deadlines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_command_requests: {
        Row: {
          command_name: string
          created_at: string
          created_by: string | null
          deal_id: string | null
          id: string
          idempotency_key: string
          property_id: string | null
          request_hash: string
          result: Json
          workspace_id: string
        }
        Insert: {
          command_name: string
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          idempotency_key: string
          property_id?: string | null
          request_hash: string
          result?: Json
          workspace_id: string
        }
        Update: {
          command_name?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          idempotency_key?: string
          property_id?: string | null
          request_hash?: string
          result?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_command_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          actor_type: string
          causation_id: string | null
          correlation_id: string
          created_at: string
          deal_id: string | null
          entity_id: string | null
          entity_type: string | null
          entity_version: number | null
          event_type: string
          event_version: number
          id: string
          idempotency_key: string | null
          metadata: Json
          occurred_at: string
          payload: Json
          persisted_at: string
          property_id: string | null
          source_client: string
          source_command: string | null
          workspace_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: string
          causation_id?: string | null
          correlation_id?: string
          created_at?: string
          deal_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          entity_version?: number | null
          event_type: string
          event_version?: number
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          occurred_at?: string
          payload?: Json
          persisted_at?: string
          property_id?: string | null
          source_client?: string
          source_command?: string | null
          workspace_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: string
          causation_id?: string | null
          correlation_id?: string
          created_at?: string
          deal_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          entity_version?: number | null
          event_type?: string
          event_version?: number
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          occurred_at?: string
          payload?: Json
          persisted_at?: string
          property_id?: string | null
          source_client?: string
          source_command?: string | null
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
      duplicate_decisions: {
        Row: {
          candidate_canonical_id: string | null
          candidate_identity: Json
          candidate_subject_type: string | null
          created_at: string
          decided_at: string
          decided_by: string
          decision: string
          duplicate_confidence: string | null
          duplicate_rule_id: string | null
          duplicate_rule_registry_version: string
          duplicate_rule_version: number | null
          duplicate_score: number | null
          id: string
          idempotency_key: string
          rationale_category: string
          request_hash: string
          safe_user_note: string | null
          subject_identity: Json
          subject_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          candidate_canonical_id?: string | null
          candidate_identity?: Json
          candidate_subject_type?: string | null
          created_at?: string
          decided_at?: string
          decided_by: string
          decision: string
          duplicate_confidence?: string | null
          duplicate_rule_id?: string | null
          duplicate_rule_registry_version: string
          duplicate_rule_version?: number | null
          duplicate_score?: number | null
          id?: string
          idempotency_key: string
          rationale_category: string
          request_hash: string
          safe_user_note?: string | null
          subject_identity?: Json
          subject_type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          candidate_canonical_id?: string | null
          candidate_identity?: Json
          candidate_subject_type?: string | null
          created_at?: string
          decided_at?: string
          decided_by?: string
          decision?: string
          duplicate_confidence?: string | null
          duplicate_rule_id?: string | null
          duplicate_rule_registry_version?: string
          duplicate_rule_version?: number | null
          duplicate_score?: number | null
          id?: string
          idempotency_key?: string
          rationale_category?: string
          request_hash?: string
          safe_user_note?: string | null
          subject_identity?: Json
          subject_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_decisions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      email_source_attachments: {
        Row: {
          allowed_extraction_engines: string[]
          byte_size: number | null
          canonical_source_class: string | null
          canonical_source_subtype: string | null
          classification_confidence_tier: string | null
          classification_evidence: Json
          classification_method: string | null
          classification_review_status: string
          classification_version: string | null
          classified_at: string | null
          classified_by: string | null
          content_hash: string | null
          content_id: string | null
          content_type: string | null
          created_at: string
          disposition: string | null
          email_source_id: string
          evidence_id: string | null
          filename: string
          id: string
          import_status: string
          parser_version: string
          processing_eligibility: Json
          safe_message: string | null
          supported_downstream_modules: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          allowed_extraction_engines?: string[]
          byte_size?: number | null
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          content_hash?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          disposition?: string | null
          email_source_id: string
          evidence_id?: string | null
          filename: string
          id?: string
          import_status?: string
          parser_version?: string
          processing_eligibility?: Json
          safe_message?: string | null
          supported_downstream_modules?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          allowed_extraction_engines?: string[]
          byte_size?: number | null
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          content_hash?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          disposition?: string | null
          email_source_id?: string
          evidence_id?: string | null
          filename?: string
          id?: string
          import_status?: string
          parser_version?: string
          processing_eligibility?: Json
          safe_message?: string | null
          supported_downstream_modules?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_source_attachments_email_source_id_fkey"
            columns: ["email_source_id"]
            isOneToOne: false
            referencedRelation: "email_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_source_attachments_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_source_attachments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sources: {
        Row: {
          allowed_extraction_engines: string[]
          attachment_count: number
          bcc_addresses: string[]
          body_hash: string
          canonical_source_class: string | null
          canonical_source_subtype: string | null
          cc_addresses: string[]
          classification_confidence_tier: string | null
          classification_evidence: Json
          classification_method: string | null
          classification_review_status: string
          classification_version: string | null
          classified_at: string | null
          classified_by: string | null
          created_at: string
          deal_id: string | null
          duplicate_of_email_source_id: string | null
          from_address: string | null
          html_body: string | null
          id: string
          imported_at: string
          imported_by: string | null
          intake_id: string | null
          message_id: string | null
          parser_version: string
          plain_text_body: string | null
          processing_eligibility: Json
          processing_status: string
          property_id: string | null
          received_headers: Json
          reply_to_address: string | null
          retention_state: string
          safe_error: string | null
          sent_at: string | null
          source_record_id: string | null
          subject: string | null
          supported_downstream_modules: string[]
          thread_id: string | null
          to_addresses: string[]
          updated_at: string
          verification_state: string
          version: number
          workspace_id: string
        }
        Insert: {
          allowed_extraction_engines?: string[]
          attachment_count?: number
          bcc_addresses?: string[]
          body_hash: string
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          cc_addresses?: string[]
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          created_at?: string
          deal_id?: string | null
          duplicate_of_email_source_id?: string | null
          from_address?: string | null
          html_body?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          intake_id?: string | null
          message_id?: string | null
          parser_version?: string
          plain_text_body?: string | null
          processing_eligibility?: Json
          processing_status?: string
          property_id?: string | null
          received_headers?: Json
          reply_to_address?: string | null
          retention_state?: string
          safe_error?: string | null
          sent_at?: string | null
          source_record_id?: string | null
          subject?: string | null
          supported_downstream_modules?: string[]
          thread_id?: string | null
          to_addresses?: string[]
          updated_at?: string
          verification_state?: string
          version?: number
          workspace_id: string
        }
        Update: {
          allowed_extraction_engines?: string[]
          attachment_count?: number
          bcc_addresses?: string[]
          body_hash?: string
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          cc_addresses?: string[]
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          created_at?: string
          deal_id?: string | null
          duplicate_of_email_source_id?: string | null
          from_address?: string | null
          html_body?: string | null
          id?: string
          imported_at?: string
          imported_by?: string | null
          intake_id?: string | null
          message_id?: string | null
          parser_version?: string
          plain_text_body?: string | null
          processing_eligibility?: Json
          processing_status?: string
          property_id?: string | null
          received_headers?: Json
          reply_to_address?: string | null
          retention_state?: string
          safe_error?: string | null
          sent_at?: string | null
          source_record_id?: string | null
          subject?: string | null
          supported_downstream_modules?: string[]
          thread_id?: string | null
          to_addresses?: string[]
          updated_at?: string
          verification_state?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sources_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sources_duplicate_of_email_source_id_fkey"
            columns: ["duplicate_of_email_source_id"]
            isOneToOne: false
            referencedRelation: "email_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sources_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "property_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sources_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sources_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "manual_source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_items: {
        Row: {
          allowed_extraction_engines: string[]
          byte_size: number
          canonical_source_class: string | null
          canonical_source_subtype: string | null
          classification_confidence_tier: string | null
          classification_evidence: Json
          classification_method: string | null
          classification_review_status: string
          classification_version: string | null
          classified_at: string | null
          classified_by: string | null
          content_hash: string
          created_at: string
          deal_id: string | null
          declared_mime_type: string | null
          detected_mime_type: string
          evidence_type: string
          extraction_status: string
          extraction_version: string | null
          id: string
          image_height: number | null
          image_width: number | null
          intake_id: string | null
          license_use_restrictions: string | null
          original_filename: string
          page_count: number | null
          processing_eligibility: Json
          processing_status: string
          property_id: string | null
          retention_state: string
          safe_error: string | null
          sanitized_filename: string
          source_record_id: string | null
          storage_bucket: string
          storage_object_key: string
          storage_version: number
          supersedes_evidence_id: string | null
          supported_downstream_modules: string[]
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          allowed_extraction_engines?: string[]
          byte_size: number
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          content_hash: string
          created_at?: string
          deal_id?: string | null
          declared_mime_type?: string | null
          detected_mime_type: string
          evidence_type: string
          extraction_status?: string
          extraction_version?: string | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          intake_id?: string | null
          license_use_restrictions?: string | null
          original_filename: string
          page_count?: number | null
          processing_eligibility?: Json
          processing_status?: string
          property_id?: string | null
          retention_state?: string
          safe_error?: string | null
          sanitized_filename: string
          source_record_id?: string | null
          storage_bucket?: string
          storage_object_key: string
          storage_version?: number
          supersedes_evidence_id?: string | null
          supported_downstream_modules?: string[]
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          allowed_extraction_engines?: string[]
          byte_size?: number
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          content_hash?: string
          created_at?: string
          deal_id?: string | null
          declared_mime_type?: string | null
          detected_mime_type?: string
          evidence_type?: string
          extraction_status?: string
          extraction_version?: string | null
          id?: string
          image_height?: number | null
          image_width?: number | null
          intake_id?: string | null
          license_use_restrictions?: string | null
          original_filename?: string
          page_count?: number | null
          processing_eligibility?: Json
          processing_status?: string
          property_id?: string | null
          retention_state?: string
          safe_error?: string | null
          sanitized_filename?: string
          source_record_id?: string | null
          storage_bucket?: string
          storage_object_key?: string
          storage_version?: number
          supersedes_evidence_id?: string | null
          supported_downstream_modules?: string[]
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "property_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "manual_source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_supersedes_evidence_id_fkey"
            columns: ["supersedes_evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_batch_items: {
        Row: {
          allowed_extraction_engines: string[]
          assignment: Json
          batch_id: string
          canonical_source_class: string | null
          canonical_source_subtype: string | null
          classification_confidence_tier: string | null
          classification_evidence: Json
          classification_method: string | null
          classification_review_status: string
          classification_version: string | null
          classified_at: string | null
          classified_by: string | null
          content_hash: string | null
          created_at: string
          deal_id: string | null
          duplicate_candidates: Json
          evidence_id: string | null
          id: string
          intake_id: string | null
          item_index: number
          item_type: string
          mapped_values: Json
          original_filename: string | null
          processing_eligibility: Json
          property_id: string | null
          proposals: Json
          retry_count: number
          safe_error: string | null
          source_anchor: Json
          source_record_id: string | null
          source_url: string | null
          status: string
          supported_downstream_modules: string[]
          target_deal_group_key: string | null
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          allowed_extraction_engines?: string[]
          assignment?: Json
          batch_id: string
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          content_hash?: string | null
          created_at?: string
          deal_id?: string | null
          duplicate_candidates?: Json
          evidence_id?: string | null
          id?: string
          intake_id?: string | null
          item_index: number
          item_type: string
          mapped_values?: Json
          original_filename?: string | null
          processing_eligibility?: Json
          property_id?: string | null
          proposals?: Json
          retry_count?: number
          safe_error?: string | null
          source_anchor?: Json
          source_record_id?: string | null
          source_url?: string | null
          status?: string
          supported_downstream_modules?: string[]
          target_deal_group_key?: string | null
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          allowed_extraction_engines?: string[]
          assignment?: Json
          batch_id?: string
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          content_hash?: string | null
          created_at?: string
          deal_id?: string | null
          duplicate_candidates?: Json
          evidence_id?: string | null
          id?: string
          intake_id?: string | null
          item_index?: number
          item_type?: string
          mapped_values?: Json
          original_filename?: string | null
          processing_eligibility?: Json
          property_id?: string | null
          proposals?: Json
          retry_count?: number
          safe_error?: string | null
          source_anchor?: Json
          source_record_id?: string | null
          source_url?: string | null
          status?: string
          supported_downstream_modules?: string[]
          target_deal_group_key?: string | null
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "intake_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_batch_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_batch_items_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_batch_items_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "property_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_batch_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_batch_items_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "manual_source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_batch_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_batches: {
        Row: {
          batch_type: string
          created_at: string
          created_by: string | null
          duplicate_candidate_count: number
          failed_item_count: number
          id: string
          idempotency_key: string
          item_count: number
          limits: Json
          ready_item_count: number
          safe_error: string | null
          skipped_item_count: number
          source_summary: Json
          status: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          batch_type: string
          created_at?: string
          created_by?: string | null
          duplicate_candidate_count?: number
          failed_item_count?: number
          id?: string
          idempotency_key: string
          item_count?: number
          limits?: Json
          ready_item_count?: number
          safe_error?: string | null
          skipped_item_count?: number
          source_summary?: Json
          status?: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          batch_type?: string
          created_at?: string
          created_by?: string | null
          duplicate_candidate_count?: number
          failed_item_count?: number
          id?: string
          idempotency_key?: string
          item_count?: number
          limits?: Json
          ready_item_count?: number
          safe_error?: string | null
          skipped_item_count?: number
          source_summary?: Json
          status?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_batches_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_processing_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          evidence_id: string | null
          failed_at: string | null
          id: string
          idempotency_key: string
          intake_id: string | null
          job_type: string
          output_refs: Json
          progress: number
          requested_by: string | null
          safe_error_category: string | null
          safe_error_message: string | null
          started_at: string | null
          status: string
          updated_at: string
          workflow_version: string
          workspace_id: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          evidence_id?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key: string
          intake_id?: string | null
          job_type: string
          output_refs?: Json
          progress?: number
          requested_by?: string | null
          safe_error_category?: string | null
          safe_error_message?: string | null
          started_at?: string | null
          status: string
          updated_at?: string
          workflow_version?: string
          workspace_id: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          evidence_id?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          intake_id?: string | null
          job_type?: string
          output_refs?: Json
          progress?: number
          requested_by?: string | null
          safe_error_category?: string | null
          safe_error_message?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          workflow_version?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_processing_jobs_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_processing_jobs_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "property_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_processing_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_value_proposals: {
        Row: {
          canonical_field: string
          canonical_subject: string
          classification: string
          confidence: number
          created_at: string
          created_by: string | null
          currency: string | null
          deal_id: string | null
          display_value: string | null
          effective_date: string | null
          evidence_id: string | null
          evidence_rule: string | null
          extractor_version: string | null
          freshness_state: string
          id: string
          intake_id: string
          normalized_value: string | null
          property_id: string | null
          proposal_status: string
          proposed_action: string
          raw_value: string | null
          source_anchor: Json
          source_key: string | null
          source_record_id: string
          unit: string | null
          updated_at: string
          verification_state: string
          workspace_id: string
        }
        Insert: {
          canonical_field: string
          canonical_subject?: string
          classification: string
          confidence: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deal_id?: string | null
          display_value?: string | null
          effective_date?: string | null
          evidence_id?: string | null
          evidence_rule?: string | null
          extractor_version?: string | null
          freshness_state?: string
          id?: string
          intake_id: string
          normalized_value?: string | null
          property_id?: string | null
          proposal_status?: string
          proposed_action?: string
          raw_value?: string | null
          source_anchor?: Json
          source_key?: string | null
          source_record_id: string
          unit?: string | null
          updated_at?: string
          verification_state?: string
          workspace_id: string
        }
        Update: {
          canonical_field?: string
          canonical_subject?: string
          classification?: string
          confidence?: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deal_id?: string | null
          display_value?: string | null
          effective_date?: string | null
          evidence_id?: string | null
          evidence_rule?: string | null
          extractor_version?: string | null
          freshness_state?: string
          id?: string
          intake_id?: string
          normalized_value?: string | null
          property_id?: string | null
          proposal_status?: string
          proposed_action?: string
          raw_value?: string | null
          source_anchor?: Json
          source_key?: string | null
          source_record_id?: string
          unit?: string | null
          updated_at?: string
          verification_state?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_value_proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_value_proposals_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_value_proposals_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "property_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_value_proposals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_value_proposals_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "manual_source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_value_proposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_source_records: {
        Row: {
          adapter_version: string | null
          allowed_extraction_engines: string[]
          canonical_source_class: string | null
          canonical_source_subtype: string | null
          classification: Json
          classification_confidence_tier: string | null
          classification_evidence: Json
          classification_method: string | null
          classification_review_status: string
          classification_version: string | null
          classified_at: string | null
          classified_by: string | null
          content_hash: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          effective_date: string | null
          entered_at: string
          evidence_id: string | null
          id: string
          intake_id: string
          license_use_restrictions: string | null
          original_values: Json
          processing_eligibility: Json
          processing_version: string | null
          property_id: string | null
          retrieved_at: string | null
          safe_error: string | null
          source_contact: string | null
          source_key: string | null
          source_name: string | null
          source_type: string
          source_url: string | null
          source_version: number
          status: string
          support_level: string | null
          supported_downstream_modules: string[]
          updated_at: string
          verification_state: string
          workspace_id: string
        }
        Insert: {
          adapter_version?: string | null
          allowed_extraction_engines?: string[]
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          classification?: Json
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          effective_date?: string | null
          entered_at?: string
          evidence_id?: string | null
          id?: string
          intake_id: string
          license_use_restrictions?: string | null
          original_values?: Json
          processing_eligibility?: Json
          processing_version?: string | null
          property_id?: string | null
          retrieved_at?: string | null
          safe_error?: string | null
          source_contact?: string | null
          source_key?: string | null
          source_name?: string | null
          source_type?: string
          source_url?: string | null
          source_version?: number
          status?: string
          support_level?: string | null
          supported_downstream_modules?: string[]
          updated_at?: string
          verification_state?: string
          workspace_id: string
        }
        Update: {
          adapter_version?: string | null
          allowed_extraction_engines?: string[]
          canonical_source_class?: string | null
          canonical_source_subtype?: string | null
          classification?: Json
          classification_confidence_tier?: string | null
          classification_evidence?: Json
          classification_method?: string | null
          classification_review_status?: string
          classification_version?: string | null
          classified_at?: string | null
          classified_by?: string | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          effective_date?: string | null
          entered_at?: string
          evidence_id?: string | null
          id?: string
          intake_id?: string
          license_use_restrictions?: string | null
          original_values?: Json
          processing_eligibility?: Json
          processing_version?: string | null
          property_id?: string | null
          retrieved_at?: string | null
          safe_error?: string | null
          source_contact?: string | null
          source_key?: string | null
          source_name?: string | null
          source_type?: string
          source_url?: string | null
          source_version?: number
          status?: string
          support_level?: string | null
          supported_downstream_modules?: string[]
          updated_at?: string
          verification_state?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_source_records_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_source_records_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_source_records_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "property_intakes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_source_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_source_records_workspace_id_fkey"
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
      note_type_definitions: {
        Row: {
          created_at: string
          label: string
          sort_order: number
          type_key: string
        }
        Insert: {
          created_at?: string
          label: string
          sort_order: number
          type_key: string
        }
        Update: {
          created_at?: string
          label?: string
          sort_order?: number
          type_key?: string
        }
        Relationships: []
      }
      note_versions: {
        Row: {
          body: string
          changed_at: string
          changed_by: string | null
          deal_id: string
          id: string
          note_id: string
          note_type: string
          pinned: boolean
          version: number
          workspace_id: string
        }
        Insert: {
          body: string
          changed_at?: string
          changed_by?: string | null
          deal_id: string
          id?: string
          note_id: string
          note_type: string
          pinned?: boolean
          version: number
          workspace_id: string
        }
        Update: {
          body?: string
          changed_at?: string
          changed_by?: string | null
          deal_id?: string
          id?: string
          note_id?: string
          note_type?: string
          pinned?: boolean
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_versions_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "note_versions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_versions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          archived_at: string | null
          body: string
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
          note_type: string
          pinned: boolean
          source_record_id: string | null
          source_type: string
          updated_at: string
          updated_by: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          body: string
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
          note_type?: string
          pinned?: boolean
          source_record_id?: string | null
          source_type?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
          note_type?: string
          pinned?: boolean
          source_record_id?: string | null
          source_type?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "notes_note_type_fkey"
            columns: ["note_type"]
            isOneToOne: false
            referencedRelation: "note_type_definitions"
            referencedColumns: ["type_key"]
          },
          {
            foreignKeyName: "notes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      property_intakes: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          duplicate_decision: string | null
          failed_at: string | null
          id: string
          idempotency_key: string
          normalized_location: Json
          original_input: Json
          resulting_deal_id: string | null
          resulting_property_id: string | null
          safe_error_category: string | null
          selected_property_id: string | null
          source_type: string
          state: string
          updated_at: string
          user_id: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          duplicate_decision?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key: string
          normalized_location?: Json
          original_input?: Json
          resulting_deal_id?: string | null
          resulting_property_id?: string | null
          safe_error_category?: string | null
          selected_property_id?: string | null
          source_type?: string
          state?: string
          updated_at?: string
          user_id?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          duplicate_decision?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          normalized_location?: Json
          original_input?: Json
          resulting_deal_id?: string | null
          resulting_property_id?: string | null
          safe_error_category?: string | null
          selected_property_id?: string | null
          source_type?: string
          state?: string
          updated_at?: string
          user_id?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_intakes_resulting_deal_id_fkey"
            columns: ["resulting_deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_intakes_resulting_property_id_fkey"
            columns: ["resulting_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_intakes_selected_property_id_fkey"
            columns: ["selected_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_intakes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      source_conflict_resolutions: {
        Row: {
          canonical_target_field: string
          conflict_key: string
          conflict_rule_registry_version: string
          created_at: string
          decided_at: string
          decided_by: string
          decision_input_hash: string
          edited_value: Json
          id: string
          idempotency_key: string
          prior_accepted_value_version: number | null
          rationale_category: string
          resolution_action: string
          resulting_accepted_value_version: number | null
          safe_note: string | null
          selected_proposal_id: string | null
          source_conflict_id: string
          subject_id: string | null
          subject_type: string
          workspace_id: string
        }
        Insert: {
          canonical_target_field: string
          conflict_key: string
          conflict_rule_registry_version: string
          created_at?: string
          decided_at?: string
          decided_by: string
          decision_input_hash: string
          edited_value?: Json
          id?: string
          idempotency_key: string
          prior_accepted_value_version?: number | null
          rationale_category: string
          resolution_action: string
          resulting_accepted_value_version?: number | null
          safe_note?: string | null
          selected_proposal_id?: string | null
          source_conflict_id: string
          subject_id?: string | null
          subject_type: string
          workspace_id: string
        }
        Update: {
          canonical_target_field?: string
          conflict_key?: string
          conflict_rule_registry_version?: string
          created_at?: string
          decided_at?: string
          decided_by?: string
          decision_input_hash?: string
          edited_value?: Json
          id?: string
          idempotency_key?: string
          prior_accepted_value_version?: number | null
          rationale_category?: string
          resolution_action?: string
          resulting_accepted_value_version?: number | null
          safe_note?: string | null
          selected_proposal_id?: string | null
          source_conflict_id?: string
          subject_id?: string | null
          subject_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_conflict_resolutions_selected_proposal_id_fkey"
            columns: ["selected_proposal_id"]
            isOneToOne: false
            referencedRelation: "intake_value_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_conflict_resolutions_source_conflict_id_fkey"
            columns: ["source_conflict_id"]
            isOneToOne: false
            referencedRelation: "source_conflicts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_conflict_resolutions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      source_conflicts: {
        Row: {
          canonical_target_field: string
          compared_normalized_values: Json
          conflict_classification: string
          conflict_context: Json
          conflict_key: string
          conflict_rule_id: string
          conflict_rule_registry_version: string
          conflict_rule_version: number
          detected_at: string
          detected_by: string
          deterministic_explanation: string
          downstream_safety: Json
          id: string
          idempotency_key: string
          involved_accepted_value_version: number | null
          involved_proposal_ids: string[]
          last_resolution_id: string | null
          lifecycle_state: string
          materiality_tier: string
          request_hash: string
          safe_summary: string
          source_summaries: Json
          stable_ordering_key: string
          subject_id: string | null
          subject_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          canonical_target_field: string
          compared_normalized_values?: Json
          conflict_classification: string
          conflict_context?: Json
          conflict_key: string
          conflict_rule_id: string
          conflict_rule_registry_version: string
          conflict_rule_version: number
          detected_at?: string
          detected_by: string
          deterministic_explanation: string
          downstream_safety?: Json
          id?: string
          idempotency_key: string
          involved_accepted_value_version?: number | null
          involved_proposal_ids?: string[]
          last_resolution_id?: string | null
          lifecycle_state?: string
          materiality_tier: string
          request_hash: string
          safe_summary: string
          source_summaries?: Json
          stable_ordering_key: string
          subject_id?: string | null
          subject_type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          canonical_target_field?: string
          compared_normalized_values?: Json
          conflict_classification?: string
          conflict_context?: Json
          conflict_key?: string
          conflict_rule_id?: string
          conflict_rule_registry_version?: string
          conflict_rule_version?: number
          detected_at?: string
          detected_by?: string
          deterministic_explanation?: string
          downstream_safety?: Json
          id?: string
          idempotency_key?: string
          involved_accepted_value_version?: number | null
          involved_proposal_ids?: string[]
          last_resolution_id?: string | null
          lifecycle_state?: string
          materiality_tier?: string
          request_hash?: string
          safe_summary?: string
          source_summaries?: Json
          stable_ordering_key?: string
          subject_id?: string | null
          subject_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_conflicts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_priority_definitions: {
        Row: {
          created_at: string
          label: string
          priority_key: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          label: string
          priority_key: string
          sort_order: number
        }
        Update: {
          created_at?: string
          label?: string
          priority_key?: string
          sort_order?: number
        }
        Relationships: []
      }
      task_status_definitions: {
        Row: {
          created_at: string
          is_terminal: boolean
          label: string
          sort_order: number
          status_key: string
        }
        Insert: {
          created_at?: string
          is_terminal?: boolean
          label: string
          sort_order: number
          status_key: string
        }
        Update: {
          created_at?: string
          is_terminal?: boolean
          label?: string
          sort_order?: number
          status_key?: string
        }
        Relationships: []
      }
      task_type_definitions: {
        Row: {
          created_at: string
          label: string
          sort_order: number
          type_key: string
        }
        Insert: {
          created_at?: string
          label: string
          sort_order: number
          type_key: string
        }
        Update: {
          created_at?: string
          label?: string
          sort_order?: number
          type_key?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          description: string | null
          due_at: string | null
          due_date: string | null
          id: string
          is_all_day: boolean
          priority: string
          source_record_id: string | null
          source_type: string
          status: string
          task_type: string
          timezone: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          description?: string | null
          due_at?: string | null
          due_date?: string | null
          id?: string
          is_all_day?: boolean
          priority?: string
          source_record_id?: string | null
          source_type?: string
          status?: string
          task_type?: string
          timezone?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          description?: string | null
          due_at?: string | null
          due_date?: string | null
          id?: string
          is_all_day?: boolean
          priority?: string
          source_record_id?: string | null
          source_type?: string
          status?: string
          task_type?: string
          timezone?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "tasks_priority_fkey"
            columns: ["priority"]
            isOneToOne: false
            referencedRelation: "task_priority_definitions"
            referencedColumns: ["priority_key"]
          },
          {
            foreignKeyName: "tasks_status_fkey"
            columns: ["status"]
            isOneToOne: false
            referencedRelation: "task_status_definitions"
            referencedColumns: ["status_key"]
          },
          {
            foreignKeyName: "tasks_task_type_fkey"
            columns: ["task_type"]
            isOneToOne: false
            referencedRelation: "task_type_definitions"
            referencedColumns: ["type_key"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      underwriting_snapshot_formula_manifest: {
        Row: {
          assumption_dependent_input_ids: string[]
          blocked_input_ids: string[]
          dependency_formula_versions: Json
          executable: boolean
          formula_id: string
          formula_registry_version: string
          formula_version: string
          id: string
          manifest_hash: string
          missing_input_ids: string[]
          preliminary_input_ids: string[]
          readiness_status: string
          required_input_ids: string[]
          snapshot_id: string
          stable_ordinal: number
          supported_by_schema: boolean
          workspace_id: string
        }
        Insert: {
          assumption_dependent_input_ids?: string[]
          blocked_input_ids?: string[]
          dependency_formula_versions?: Json
          executable?: boolean
          formula_id: string
          formula_registry_version: string
          formula_version: string
          id?: string
          manifest_hash: string
          missing_input_ids?: string[]
          preliminary_input_ids?: string[]
          readiness_status: string
          required_input_ids?: string[]
          snapshot_id: string
          stable_ordinal: number
          supported_by_schema?: boolean
          workspace_id: string
        }
        Update: {
          assumption_dependent_input_ids?: string[]
          blocked_input_ids?: string[]
          dependency_formula_versions?: Json
          executable?: boolean
          formula_id?: string
          formula_registry_version?: string
          formula_version?: string
          id?: string
          manifest_hash?: string
          missing_input_ids?: string[]
          preliminary_input_ids?: string[]
          readiness_status?: string
          required_input_ids?: string[]
          snapshot_id?: string
          stable_ordinal?: number
          supported_by_schema?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_snapshot_formula_manifest_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_comparison_basis"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_formula_manifest_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_summaries"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_formula_manifest_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_formula_manifest_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      underwriting_snapshot_inputs: {
        Row: {
          assumption_state: string
          canonical_currency: string | null
          canonical_data_type: string
          canonical_period: string
          canonical_unit: string
          completeness_state: string
          conflict_state: string
          conversion_applied: boolean
          conversion_version: string | null
          deterministic_input_hash: string
          display_value: string
          id: string
          input_id: string
          input_version: string | null
          normalized_value: Json
          precision_applied: Json
          raw_accepted_value_ref: Json
          requirement_state: string
          rounding_applied: boolean
          snapshot_id: string
          stable_ordinal: number
          validation_status: string
          workspace_id: string
        }
        Insert: {
          assumption_state: string
          canonical_currency?: string | null
          canonical_data_type: string
          canonical_period: string
          canonical_unit: string
          completeness_state: string
          conflict_state: string
          conversion_applied?: boolean
          conversion_version?: string | null
          deterministic_input_hash: string
          display_value?: string
          id?: string
          input_id: string
          input_version?: string | null
          normalized_value?: Json
          precision_applied?: Json
          raw_accepted_value_ref?: Json
          requirement_state: string
          rounding_applied?: boolean
          snapshot_id: string
          stable_ordinal: number
          validation_status: string
          workspace_id: string
        }
        Update: {
          assumption_state?: string
          canonical_currency?: string | null
          canonical_data_type?: string
          canonical_period?: string
          canonical_unit?: string
          completeness_state?: string
          conflict_state?: string
          conversion_applied?: boolean
          conversion_version?: string | null
          deterministic_input_hash?: string
          display_value?: string
          id?: string
          input_id?: string
          input_version?: string | null
          normalized_value?: Json
          precision_applied?: Json
          raw_accepted_value_ref?: Json
          requirement_state?: string
          rounding_applied?: boolean
          snapshot_id?: string
          stable_ordinal?: number
          validation_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_snapshot_inputs_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_comparison_basis"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_inputs_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_summaries"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_inputs_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_inputs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      underwriting_snapshot_provenance: {
        Row: {
          accepted_assumption_id: string | null
          evidence_id: string | null
          id: string
          input_id: string
          preliminary_assumption_id: string | null
          snapshot_id: string
          snapshot_input_id: string | null
          source_anchor: Json
          source_classification: string | null
          source_fact_id: string | null
          source_record_id: string | null
          stable_ordinal: number
          verification_state: string | null
          workspace_id: string
        }
        Insert: {
          accepted_assumption_id?: string | null
          evidence_id?: string | null
          id?: string
          input_id: string
          preliminary_assumption_id?: string | null
          snapshot_id: string
          snapshot_input_id?: string | null
          source_anchor?: Json
          source_classification?: string | null
          source_fact_id?: string | null
          source_record_id?: string | null
          stable_ordinal: number
          verification_state?: string | null
          workspace_id: string
        }
        Update: {
          accepted_assumption_id?: string | null
          evidence_id?: string | null
          id?: string
          input_id?: string
          preliminary_assumption_id?: string | null
          snapshot_id?: string
          snapshot_input_id?: string | null
          source_anchor?: Json
          source_classification?: string | null
          source_fact_id?: string | null
          source_record_id?: string | null
          stable_ordinal?: number
          verification_state?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_snapshot_provenance_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_provenance_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_comparison_basis"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_provenance_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_summaries"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_provenance_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_provenance_snapshot_input_id_fkey"
            columns: ["snapshot_input_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_inputs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_provenance_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      underwriting_snapshot_requests: {
        Row: {
          content_hash: string
          created_at: string
          created_by: string
          deal_id: string
          id: string
          idempotency_key: string
          request_hash: string
          snapshot_id: string
          workspace_id: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          created_by: string
          deal_id: string
          id?: string
          idempotency_key: string
          request_hash: string
          snapshot_id: string
          workspace_id: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          created_by?: string
          deal_id?: string
          id?: string
          idempotency_key?: string
          request_hash?: string
          snapshot_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_snapshot_requests_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_requests_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_comparison_basis"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_requests_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_summaries"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_requests_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_snapshot_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      underwriting_snapshots: {
        Row: {
          blocking_reasons: Json
          calculation_currency: string
          conflicted_required_input_ids: string[]
          content_hash: string
          created_at: string
          created_by: string
          deal_id: string
          deal_version: string | null
          formula_registry_version: string
          hold_period_months: number | null
          id: string
          idempotency_key: string
          input_count: number
          input_registry_version: string
          intended_underwriting_mode: string | null
          invalid_required_input_ids: string[]
          is_executable: boolean
          manifest_hash: string
          missing_required_input_ids: string[]
          normalization_registry_version: string
          primary_property_id: string | null
          prior_snapshot_id: string | null
          property_ids: string[]
          property_versions: Json
          provisional_required_input_ids: string[]
          readiness_state: string
          reason: string
          reporting_period: string
          schema_id: string
          schema_registry_version: string
          schema_version: string
          snapshot_contract_version: string
          snapshot_hash_version: string
          snapshot_sequence: number
          source_validation_hash: string
          source_validation_id: string
          supersedes_snapshot_id: string | null
          unit_system: string
          validation_registry_version: string
          valuation_date: string | null
          warnings: Json
          workspace_id: string
        }
        Insert: {
          blocking_reasons?: Json
          calculation_currency?: string
          conflicted_required_input_ids?: string[]
          content_hash: string
          created_at?: string
          created_by: string
          deal_id: string
          deal_version?: string | null
          formula_registry_version: string
          hold_period_months?: number | null
          id?: string
          idempotency_key: string
          input_count?: number
          input_registry_version: string
          intended_underwriting_mode?: string | null
          invalid_required_input_ids?: string[]
          is_executable?: boolean
          manifest_hash: string
          missing_required_input_ids?: string[]
          normalization_registry_version: string
          primary_property_id?: string | null
          prior_snapshot_id?: string | null
          property_ids?: string[]
          property_versions?: Json
          provisional_required_input_ids?: string[]
          readiness_state: string
          reason: string
          reporting_period?: string
          schema_id: string
          schema_registry_version: string
          schema_version: string
          snapshot_contract_version?: string
          snapshot_hash_version?: string
          snapshot_sequence: number
          source_validation_hash: string
          source_validation_id: string
          supersedes_snapshot_id?: string | null
          unit_system?: string
          validation_registry_version: string
          valuation_date?: string | null
          warnings?: Json
          workspace_id: string
        }
        Update: {
          blocking_reasons?: Json
          calculation_currency?: string
          conflicted_required_input_ids?: string[]
          content_hash?: string
          created_at?: string
          created_by?: string
          deal_id?: string
          deal_version?: string | null
          formula_registry_version?: string
          hold_period_months?: number | null
          id?: string
          idempotency_key?: string
          input_count?: number
          input_registry_version?: string
          intended_underwriting_mode?: string | null
          invalid_required_input_ids?: string[]
          is_executable?: boolean
          manifest_hash?: string
          missing_required_input_ids?: string[]
          normalization_registry_version?: string
          primary_property_id?: string | null
          prior_snapshot_id?: string | null
          property_ids?: string[]
          property_versions?: Json
          provisional_required_input_ids?: string[]
          readiness_state?: string
          reason?: string
          reporting_period?: string
          schema_id?: string
          schema_registry_version?: string
          schema_version?: string
          snapshot_contract_version?: string
          snapshot_hash_version?: string
          snapshot_sequence?: number
          source_validation_hash?: string
          source_validation_id?: string
          supersedes_snapshot_id?: string | null
          unit_system?: string
          validation_registry_version?: string
          valuation_date?: string | null
          warnings?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_snapshots_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_primary_property_fk"
            columns: ["workspace_id", "primary_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_prior_snapshot_id_fkey"
            columns: ["prior_snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_comparison_basis"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_prior_snapshot_id_fkey"
            columns: ["prior_snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_summaries"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_prior_snapshot_id_fkey"
            columns: ["prior_snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_supersedes_snapshot_id_fkey"
            columns: ["supersedes_snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_comparison_basis"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_supersedes_snapshot_id_fkey"
            columns: ["supersedes_snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshot_summaries"
            referencedColumns: ["snapshot_id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_supersedes_snapshot_id_fkey"
            columns: ["supersedes_snapshot_id"]
            isOneToOne: false
            referencedRelation: "underwriting_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      work_command_requests: {
        Row: {
          command_name: string
          created_at: string
          created_by: string | null
          deadline_id: string | null
          deal_id: string | null
          id: string
          idempotency_key: string
          note_id: string | null
          request_hash: string
          task_id: string | null
          workspace_id: string
        }
        Insert: {
          command_name: string
          created_at?: string
          created_by?: string | null
          deadline_id?: string | null
          deal_id?: string | null
          id?: string
          idempotency_key: string
          note_id?: string | null
          request_hash: string
          task_id?: string | null
          workspace_id: string
        }
        Update: {
          command_name?: string
          created_at?: string
          created_by?: string | null
          deadline_id?: string | null
          deal_id?: string | null
          id?: string
          idempotency_key?: string
          note_id?: string | null
          request_hash?: string
          task_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_command_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      underwriting_snapshot_comparison_basis: {
        Row: {
          conflicted_required_input_ids: string[] | null
          content_hash: string | null
          created_at: string | null
          deal_id: string | null
          invalid_required_input_ids: string[] | null
          is_executable: boolean | null
          manifest_hash: string | null
          missing_required_input_ids: string[] | null
          property_versions: Json | null
          provisional_required_input_ids: string[] | null
          readiness_state: string | null
          snapshot_id: string | null
          snapshot_sequence: number | null
          workspace_id: string | null
        }
        Insert: {
          conflicted_required_input_ids?: string[] | null
          content_hash?: string | null
          created_at?: string | null
          deal_id?: string | null
          invalid_required_input_ids?: string[] | null
          is_executable?: boolean | null
          manifest_hash?: string | null
          missing_required_input_ids?: string[] | null
          property_versions?: Json | null
          provisional_required_input_ids?: string[] | null
          readiness_state?: string | null
          snapshot_id?: string | null
          snapshot_sequence?: number | null
          workspace_id?: string | null
        }
        Update: {
          conflicted_required_input_ids?: string[] | null
          content_hash?: string | null
          created_at?: string | null
          deal_id?: string | null
          invalid_required_input_ids?: string[] | null
          is_executable?: boolean | null
          manifest_hash?: string | null
          missing_required_input_ids?: string[] | null
          property_versions?: Json | null
          provisional_required_input_ids?: string[] | null
          readiness_state?: string | null
          snapshot_id?: string | null
          snapshot_sequence?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_snapshots_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      underwriting_snapshot_summaries: {
        Row: {
          conflicted_required_input_count: number | null
          content_hash: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          input_count: number | null
          is_executable: boolean | null
          manifest_hash: string | null
          missing_required_input_count: number | null
          primary_property_id: string | null
          provisional_required_input_count: number | null
          readiness_state: string | null
          reason: string | null
          snapshot_id: string | null
          snapshot_sequence: number | null
          workspace_id: string | null
        }
        Insert: {
          conflicted_required_input_count?: never
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          input_count?: number | null
          is_executable?: boolean | null
          manifest_hash?: string | null
          missing_required_input_count?: never
          primary_property_id?: string | null
          provisional_required_input_count?: never
          readiness_state?: string | null
          reason?: string | null
          snapshot_id?: string | null
          snapshot_sequence?: number | null
          workspace_id?: string | null
        }
        Update: {
          conflicted_required_input_count?: never
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          input_count?: number | null
          is_executable?: boolean | null
          manifest_hash?: string | null
          missing_required_input_count?: never
          primary_property_id?: string | null
          provisional_required_input_count?: never
          readiness_state?: string | null
          reason?: string | null
          snapshot_id?: string | null
          snapshot_sequence?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "underwriting_snapshots_deal_fk"
            columns: ["workspace_id", "deal_id"]
            isOneToOne: false
            referencedRelation: "brix_deals"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_primary_property_fk"
            columns: ["workspace_id", "primary_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "underwriting_snapshots_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      archive_deal: {
        Args: {
          archive_reason?: string
          expected_version: number
          idempotency_key: string
          target_deal_id: string
        }
        Returns: {
          archived_at: string
          deal_id: string
          deal_version: number
          stage: string
          status: string
          updated_at: string
          workspace_id: string
        }[]
      }
      archive_deal_note: {
        Args: { expected_version?: number; target_note_id: string }
        Returns: {
          note_id: string
          note_version: number
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
      attach_email_source_to_deal: {
        Args: {
          target_deal_id: string
          target_email_source_id: string
          target_intake_id: string
          target_property_id: string
          target_workspace_id: string
        }
        Returns: {
          deal_id: string
          email_source_id: string
          intake_id: string
          property_id: string
          source_record_id: string
        }[]
      }
      attach_file_evidence_to_deal: {
        Args: {
          target_deal_id: string
          target_evidence_id: string
          target_intake_id: string
          target_property_id: string
          target_workspace_id: string
        }
        Returns: {
          deal_id: string
          evidence_id: string
          intake_id: string
          property_id: string
          source_record_id: string
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
      authorized_deal_for_read: {
        Args: { target_deal_id: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "brix_deals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_create_brix_deal: { Args: never; Returns: boolean }
      can_record_email_intake: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      can_record_file_evidence_intake: {
        Args: { target_workspace_id: string }
        Returns: boolean
      }
      cancel_deal_task: {
        Args: { expected_version?: number; target_task_id: string }
        Returns: {
          task_id: string
          task_version: number
        }[]
      }
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
      classify_manual_intake_values: {
        Args: { manual_input: Json }
        Returns: Json
      }
      complete_deal_deadline: {
        Args: { expected_version?: number; target_deadline_id: string }
        Returns: {
          deadline_id: string
          deadline_version: number
        }[]
      }
      complete_deal_task: {
        Args: { expected_version?: number; target_task_id: string }
        Returns: {
          task_id: string
          task_version: number
        }[]
      }
      complete_manual_property_intake: {
        Args: {
          duplicate_decision: string
          idempotency_key: string
          manual_input: Json
          selected_property_id?: string
          target_workspace_id: string
        }
        Returns: {
          deal_id: string
          deal_property_id: string
          deal_version: number
          idempotency_key_out: string
          intake_id: string
          intake_state: string
          property_id: string
          property_version: number
          source_record_id: string
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
        Args: {
          deadline_input: Json
          idempotency_key: string
          target_deal_id: string
        }
        Returns: {
          deadline_id: string
          deadline_version: number
        }[]
      }
      create_deal_note: {
        Args: {
          idempotency_key: string
          note_input: Json
          target_deal_id: string
        }
        Returns: {
          note_id: string
          note_version: number
        }[]
      }
      create_deal_task: {
        Args: {
          idempotency_key: string
          target_deal_id: string
          task_input: Json
        }
        Returns: {
          task_id: string
          task_version: number
        }[]
      }
      create_underwriting_snapshot: {
        Args: {
          idempotency_key: string
          snapshot_payload: Json
          target_deal_id: string
          target_workspace_id: string
        }
        Returns: {
          content_hash: string
          idempotency_key_out: string
          readiness_state: string
          reused: boolean
          snapshot_id: string
          snapshot_sequence: number
        }[]
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
      deal_projection_attention_state: {
        Args: { target_deal_id: string; target_workspace_id: string }
        Returns: string
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
      ensure_deal_command: {
        Args: {
          command_name: string
          idempotency_key: string
          request_body: Json
          target_deal_id: string
          target_property_id: string
          target_workspace_id: string
        }
        Returns: {
          command_name: string
          created_at: string
          created_by: string | null
          deal_id: string | null
          id: string
          idempotency_key: string
          property_id: string | null
          request_hash: string
          result: Json
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "deal_command_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ensure_work_command: {
        Args: {
          command_name: string
          idempotency_key: string
          request_body: Json
          target_deal_id: string
          target_workspace_id: string
        }
        Returns: {
          command_name: string
          created_at: string
          created_by: string | null
          deadline_id: string | null
          deal_id: string | null
          id: string
          idempotency_key: string
          note_id: string | null
          request_hash: string
          task_id: string | null
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "work_command_requests"
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
      event_entity_id: {
        Args: { event_name: string; event_payload: Json }
        Returns: string
      }
      event_entity_type: { Args: { event_name: string }; Returns: string }
      event_entity_version: {
        Args: { event_name: string; event_payload: Json }
        Returns: number
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
      get_authorized_deal: {
        Args: { target_deal_id: string }
        Returns: {
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
        SetofOptions: {
          from: "*"
          to: "brix_deals"
          isOneToOne: true
          isSetofReturn: false
        }
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
      list_deal_notes: {
        Args: { target_deal_id: string }
        Returns: {
          archived_at: string
          body: string
          created_at: string
          deal_id: string
          note_id: string
          note_type: string
          note_version: number
          pinned: boolean
          source_record_id: string
          source_type: string
          updated_at: string
          workspace_id: string
        }[]
      }
      list_deal_projection: {
        Args: {
          filter_input?: Json
          include_archived?: boolean
          page_offset?: number
          page_size?: number
          search_query?: string
          sort_key?: string
          target_workspace_id: string
        }
        Returns: {
          active_count: number
          archived_at: string
          archived_count: number
          attention_state: string
          created_at: string
          deal_id: string
          deal_version: number
          display_name: string
          next_due_at: string
          open_work_count: number
          primary_property_address: string
          primary_property_id: string
          primary_property_version: number
          priority: string
          relationship_count: number
          source: string
          stage: string
          status: string
          strategy_intent: string
          total_count: number
          updated_at: string
          workspace_id: string
        }[]
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
      list_deal_work: {
        Args: { target_deal_id: string }
        Returns: {
          archived_at: string
          body: string
          completed_at: string
          created_at: string
          deal_id: string
          due_at: string
          due_date: string
          is_all_day: boolean
          pinned: boolean
          priority: string
          record_id: string
          record_type: string
          record_version: number
          source_record_id: string
          source_type: string
          status: string
          timezone: string
          title: string
          updated_at: string
          verification_state: string
          work_type: string
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
      load_active_deal_shell_projection: {
        Args: { target_deal_id: string }
        Returns: {
          deal_id: string
          deal_version: number
          display_name: string
          loaded_at: string
          next_due_at: string
          open_work_count: number
          primary_property_address: string
          priority: string
          stage: string
          status: string
          updated_at: string
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
      load_deal_detail_projection: {
        Args: { target_deal_id: string }
        Returns: {
          deal_id: string
          deal_type: string
          deal_updated_at: string
          deal_version: number
          display_name: string
          facts: Json
          loaded_at: string
          open_deadline_count: number
          open_task_count: number
          pinned_note_count: number
          primary_property_address: string
          primary_property_address_line1: string
          primary_property_address_line2: string
          primary_property_city: string
          primary_property_country: string
          primary_property_id: string
          primary_property_parcel_identifier: string
          primary_property_postal_code: string
          primary_property_region: string
          primary_property_version: number
          priority: string
          property_updated_at: string
          recent_event_count: number
          relationship_count: number
          source: string
          source_text: string
          source_url: string
          stage: string
          status: string
          strategy_id: string
          strategy_intent: string
          verification: Json
          workspace_id: string
        }[]
      }
      load_deal_timeline: {
        Args: {
          before_time?: string
          page_size?: number
          target_deal_id: string
        }
        Returns: {
          actor_id: string
          canonical_order: string
          deal_id: string
          event_type: string
          occurred_at: string
          safe_summary: string
          safe_title: string
          source_record_id: string
          source_type: string
          timeline_id: string
          workspace_id: string
        }[]
      }
      load_property_summary: {
        Args: { target_property_id: string }
        Returns: {
          active_deal_count: number
          address_line1: string
          address_line2: string
          city: string
          country: string
          display_address: string
          parcel_identifier: string
          postal_code: string
          property_id: string
          property_version: number
          region: string
          updated_at: string
          workspace_id: string
        }[]
      }
      normalize_contact_phone: { Args: { raw_phone: string }; Returns: string }
      normalize_invitation_email: {
        Args: { invite_email: string }
        Returns: string
      }
      normalize_manual_location: { Args: { manual_input: Json }; Returns: Json }
      normalize_website_domain: {
        Args: { raw_website: string }
        Returns: string
      }
      record_duplicate_decision: {
        Args: {
          decision_input: Json
          idempotency_key: string
          target_workspace_id: string
        }
        Returns: {
          candidate_subject_type: string
          decision: string
          duplicate_decision_id: string
          idempotency_key_out: string
          subject_type: string
        }[]
      }
      record_email_intake_result: {
        Args: {
          attachment_metadata?: Json
          email_metadata: Json
          extracted_proposals?: Json
          idempotency_key: string
          target_workspace_id: string
        }
        Returns: {
          attachment_count: number
          duplicate_of_email_source_id: string
          email_source_id: string
          import_status: string
          intake_id: string
          job_id: string
          proposal_count: number
          safe_message: string
          source_record_id: string
        }[]
      }
      record_file_evidence_intake_result: {
        Args: {
          extracted_proposals?: Json
          file_metadata: Json
          idempotency_key: string
          target_workspace_id: string
        }
        Returns: {
          duplicate_of_evidence_id: string
          evidence_id: string
          import_status: string
          intake_id: string
          job_id: string
          proposal_count: number
          safe_message: string
          source_record_id: string
        }[]
      }
      record_intake_batch_review: {
        Args: {
          batch_input: Json
          idempotency_key: string
          item_inputs?: Json
          target_workspace_id: string
        }
        Returns: {
          batch_id: string
          batch_status: string
          duplicate_candidate_count: number
          failed_item_count: number
          item_count: number
          ready_item_count: number
          skipped_item_count: number
        }[]
      }
      record_listing_url_import_result: {
        Args: {
          listing_import: Json
          listing_proposals?: Json
          target_intake_id: string
          target_source_record_id: string
          target_workspace_id: string
        }
        Returns: {
          accepted_count: number
          deferred_count: number
          proposal_count: number
          rejected_count: number
          source_record_id: string
        }[]
      }
      record_source_classification: {
        Args: {
          classification_input: Json
          idempotency_key: string
          target_id: string
          target_table: string
          target_workspace_id: string
        }
        Returns: {
          canonical_source_class: string
          canonical_source_subtype: string
          classification_confidence_tier: string
          classification_review_status: string
          classification_version: string
          classified_target_id: string
          classified_target_table: string
          event_type: string
        }[]
      }
      record_source_conflict: {
        Args: {
          conflict_input: Json
          idempotency_key: string
          target_workspace_id: string
        }
        Returns: {
          conflict_key: string
          idempotency_key_out: string
          lifecycle_state: string
          source_conflict_id: string
        }[]
      }
      record_source_conflict_resolution: {
        Args: {
          idempotency_key: string
          resolution_input: Json
          target_conflict_key: string
          target_workspace_id: string
        }
        Returns: {
          conflict_key: string
          idempotency_key_out: string
          lifecycle_state: string
          resolution_action: string
          source_conflict_id: string
          source_conflict_resolution_id: string
        }[]
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
      restore_deal: {
        Args: {
          expected_version: number
          idempotency_key: string
          restore_reason?: string
          target_deal_id: string
        }
        Returns: {
          archived_at: string
          deal_id: string
          deal_version: number
          stage: string
          status: string
          updated_at: string
          workspace_id: string
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
      safe_changed_fields: {
        Args: { after_state: Json; before_state: Json }
        Returns: string[]
      }
      safe_event_jsonb: { Args: { input_value: Json }; Returns: Json }
      safe_uuid: { Args: { value: string }; Returns: string }
      search_manual_property_candidates: {
        Args: {
          candidate_limit?: number
          manual_input: Json
          target_workspace_id: string
        }
        Returns: {
          active_deal_count: number
          city: string
          country: string
          display_address: string
          match_reasons: string[]
          material_differences: string[]
          postal_code: string
          property_id: string
          property_version: number
          region: string
          updated_at: string
        }[]
      }
      source_conflict_uuid_array: { Args: { value: Json }; Returns: string[] }
      underwriting_snapshot_text_array: {
        Args: { value: Json }
        Returns: string[]
      }
      underwriting_snapshot_uuid_array: {
        Args: { value: Json }
        Returns: string[]
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
      update_canonical_deal: {
        Args: {
          deal_input: Json
          expected_version: number
          idempotency_key: string
          target_deal_id: string
        }
        Returns: {
          deal_id: string
          deal_type: string
          deal_version: number
          display_name: string
          priority: string
          source: string
          stage: string
          status: string
          strategy_intent: string
          updated_at: string
          workspace_id: string
        }[]
      }
      update_canonical_property: {
        Args: {
          expected_version: number
          idempotency_key: string
          property_input: Json
          target_property_id: string
        }
        Returns: {
          address_line1: string
          address_line2: string
          city: string
          country: string
          display_address: string
          parcel_identifier: string
          postal_code: string
          property_id: string
          property_version: number
          region: string
          updated_at: string
          workspace_id: string
        }[]
      }
      update_deal_deadline: {
        Args: {
          deadline_input: Json
          expected_version?: number
          target_deadline_id: string
        }
        Returns: {
          deadline_id: string
          deadline_version: number
        }[]
      }
      update_deal_lifecycle: {
        Args: {
          expected_version: number
          idempotency_key: string
          lifecycle_input: Json
          target_deal_id: string
        }
        Returns: {
          deal_id: string
          deal_version: number
          stage: string
          status: string
          updated_at: string
          workspace_id: string
        }[]
      }
      update_deal_note: {
        Args: {
          expected_version?: number
          note_input: Json
          target_note_id: string
        }
        Returns: {
          note_id: string
          note_version: number
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
      update_deal_task: {
        Args: {
          expected_version?: number
          target_task_id: string
          task_input: Json
        }
        Returns: {
          task_id: string
          task_version: number
        }[]
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

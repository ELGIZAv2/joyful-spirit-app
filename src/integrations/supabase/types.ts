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
      admin_error_log: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
          notified: boolean
          raw_error: string | null
          route: string | null
          source: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          notified?: boolean
          raw_error?: string | null
          route?: string | null
          source: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          notified?: boolean
          raw_error?: string | null
          route?: string | null
          source?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_artifacts: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          metadata: Json
          mime_type: string | null
          session_id: string
          size_bytes: number | null
          storage_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          metadata?: Json
          mime_type?: string | null
          session_id: string
          size_bytes?: number | null
          storage_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          metadata?: Json
          mime_type?: string | null
          session_id?: string
          size_bytes?: number | null
          storage_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_artifacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          metadata: Json
          role: string
          session_id: string
          tool_calls: Json | null
          tool_results: Json | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          role: string
          session_id: string
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          role?: string
          session_id?: string
          tool_calls?: Json | null
          tool_results?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_sessions: {
        Row: {
          agent_slug: string
          created_at: string
          ended_at: string | null
          id: string
          last_message_at: string | null
          metadata: Json
          sandbox_id: string | null
          sandbox_status: string | null
          started_at: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_slug: string
          created_at?: string
          ended_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json
          sandbox_id?: string | null
          sandbox_status?: string | null
          started_at?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_slug?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json
          sandbox_id?: string | null
          sandbox_status?: string | null
          started_at?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_squads: {
        Row: {
          agent_slugs: string[]
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          orchestrator_prompt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_slugs?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          orchestrator_prompt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_slugs?: string[]
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          orchestrator_prompt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agents_catalog: {
        Row: {
          capabilities: Json
          category: string
          color: string | null
          created_at: string
          credits_per_message: number
          default_tools: Json
          description: string
          description_ar: string | null
          icon: string
          id: string
          install_count: number
          is_active: boolean
          is_featured: boolean
          is_premium: boolean
          model: string
          name: string
          name_ar: string | null
          slug: string
          sort_order: number
          subcategory: string | null
          system_prompt: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          capabilities?: Json
          category: string
          color?: string | null
          created_at?: string
          credits_per_message?: number
          default_tools?: Json
          description: string
          description_ar?: string | null
          icon?: string
          id?: string
          install_count?: number
          is_active?: boolean
          is_featured?: boolean
          is_premium?: boolean
          model?: string
          name: string
          name_ar?: string | null
          slug: string
          sort_order?: number
          subcategory?: string | null
          system_prompt: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          capabilities?: Json
          category?: string
          color?: string | null
          created_at?: string
          credits_per_message?: number
          default_tools?: Json
          description?: string
          description_ar?: string | null
          icon?: string
          id?: string
          install_count?: number
          is_active?: boolean
          is_featured?: boolean
          is_premium?: boolean
          model?: string
          name?: string
          name_ar?: string | null
          slug?: string
          sort_order?: number
          subcategory?: string | null
          system_prompt?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_personalization: {
        Row: {
          about: string | null
          ai_traits: string | null
          call_name: string | null
          created_at: string | null
          custom_instructions: string | null
          id: string
          interests: string[]
          language_style: string
          preferred_tier: string
          profession: string | null
          tone_creativity: number
          tone_formality: number
          tone_verbosity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          about?: string | null
          ai_traits?: string | null
          call_name?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          id?: string
          interests?: string[]
          language_style?: string
          preferred_tier?: string
          profession?: string | null
          tone_creativity?: number
          tone_formality?: number
          tone_verbosity?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          about?: string | null
          ai_traits?: string | null
          call_name?: string | null
          created_at?: string | null
          custom_instructions?: string | null
          id?: string
          interests?: string[]
          language_style?: string
          preferred_tier?: string
          profession?: string | null
          tone_creativity?: number
          tone_formality?: number
          tone_verbosity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_project_files: {
        Row: {
          content: string
          created_at: string
          id: string
          path: string
          project_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          path: string
          project_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          path?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_project_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json
          project_id: string
          role: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          project_id: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_project_snapshots: {
        Row: {
          created_at: string
          created_by: string | null
          file_count: number
          files: Json
          id: string
          label: string | null
          project_id: string
          total_bytes: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_count?: number
          files?: Json
          id?: string
          label?: string | null
          project_id: string
          total_bytes?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_count?: number
          files?: Json
          id?: string
          label?: string | null
          project_id?: string
          total_bytes?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_project_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_project_usage: {
        Row: {
          action: string
          completion_tokens: number
          created_at: string
          duration_ms: number
          id: string
          mc_cost: number
          model: string | null
          project_id: string
          prompt_tokens: number
          user_id: string | null
        }
        Insert: {
          action?: string
          completion_tokens?: number
          created_at?: string
          duration_ms?: number
          id?: string
          mc_cost?: number
          model?: string | null
          project_id: string
          prompt_tokens?: number
          user_id?: string | null
        }
        Update: {
          action?: string
          completion_tokens?: number
          created_at?: string
          duration_ms?: number
          id?: string
          mc_cost?: number
          model?: string | null
          project_id?: string
          prompt_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      anonymous_chat_usage: {
        Row: {
          fingerprint_hash: string
          id: string
          ip_hash: string
          used_at: string
          user_agent: string | null
        }
        Insert: {
          fingerprint_hash: string
          id?: string
          ip_hash: string
          used_at?: string
          user_agent?: string | null
        }
        Update: {
          fingerprint_hash?: string
          id?: string
          ip_hash?: string
          used_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          api_key: string
          block_reason: string | null
          created_at: string | null
          credit_limit_usd: number
          credit_used_usd: number
          error_count: number | null
          id: string
          is_active: boolean | null
          is_blocked: boolean | null
          label: string | null
          last_error_at: string | null
          last_used_at: string | null
          provider_meta: Json
          service: string
          usage_count: number | null
        }
        Insert: {
          api_key: string
          block_reason?: string | null
          created_at?: string | null
          credit_limit_usd?: number
          credit_used_usd?: number
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          is_blocked?: boolean | null
          label?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          provider_meta?: Json
          service: string
          usage_count?: number | null
        }
        Update: {
          api_key?: string
          block_reason?: string | null
          created_at?: string | null
          credit_limit_usd?: number
          credit_used_usd?: number
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          is_blocked?: boolean | null
          label?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          provider_meta?: Json
          service?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      app_kv: {
        Row: {
          created_at: string
          id: string
          key: string
          project_id: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          project_id: string
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          project_id?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      attachment_chunks: {
        Row: {
          chunk_index: number
          content: string
          conversation_id: string | null
          created_at: string
          embedding: string | null
          file_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          chunk_index?: number
          content: string
          conversation_id?: string | null
          created_at?: string
          embedding?: string | null
          file_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          conversation_id?: string | null
          created_at?: string
          embedding?: string | null
          file_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      background_jobs: {
        Row: {
          clarify: Json | null
          conversation_id: string | null
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          kind: string
          last_heartbeat_at: string
          message_id: string | null
          meta: Json
          output: Json
          phase: string | null
          progress: number
          status: string
          status_text: string | null
          stream_text: string
          tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          clarify?: Json | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          kind: string
          last_heartbeat_at?: string
          message_id?: string | null
          meta?: Json
          output?: Json
          phase?: string | null
          progress?: number
          status?: string
          status_text?: string | null
          stream_text?: string
          tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          clarify?: Json | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          kind?: string
          last_heartbeat_at?: string
          message_id?: string | null
          meta?: Json
          output?: Json
          phase?: string | null
          progress?: number
          status?: string
          status_text?: string | null
          stream_text?: string
          tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          content: Json | null
          cover_url: string | null
          created_at: string
          credits_used: number | null
          id: string
          language: string
          outline: Json | null
          pages_count: number
          pdf_url: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string
          credits_used?: number | null
          id?: string
          language?: string
          outline?: Json | null
          pages_count?: number
          pdf_url?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string
          credits_used?: number | null
          id?: string
          language?: string
          outline?: Json | null
          pages_count?: number
          pdf_url?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_admin_pending: {
        Row: {
          awaiting_service: string
          created_at: string
          expires_at: string
          telegram_chat_id: number
        }
        Insert: {
          awaiting_service: string
          created_at?: string
          expires_at?: string
          telegram_chat_id: number
        }
        Update: {
          awaiting_service?: string
          created_at?: string
          expires_at?: string
          telegram_chat_id?: number
        }
        Relationships: []
      }
      bot_admins: {
        Row: {
          added_by: number | null
          created_at: string | null
          id: string
          telegram_chat_id: number
        }
        Insert: {
          added_by?: number | null
          created_at?: string | null
          id?: string
          telegram_chat_id: number
        }
        Update: {
          added_by?: number | null
          created_at?: string | null
          id?: string
          telegram_chat_id?: number
        }
        Relationships: []
      }
      calendar_connections: {
        Row: {
          access_token: string | null
          calendar_email: string | null
          created_at: string
          id: string
          provider: string
          refresh_token: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_email?: string | null
          created_at?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_email?: string | null
          created_at?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_citations: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          index_num: number
          message_id: string | null
          snippet: string | null
          source_type: string | null
          title: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          index_num: number
          message_id?: string | null
          snippet?: string | null
          source_type?: string | null
          title?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          index_num?: number
          message_id?: string | null
          snippet?: string | null
          source_type?: string | null
          title?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_citations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_citations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_followups: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string | null
          questions: Json
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          questions?: Json
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          questions?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_followups_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_followups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_router_logs: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          latency_ms: number | null
          routed: Json
          user_id: string | null
          user_text: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          routed?: Json
          user_id?: string | null
          user_text?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          latency_ms?: number | null
          routed?: Json
          user_id?: string | null
          user_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_router_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_router_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_semantic_cache: {
        Row: {
          created_at: string
          expires_at: string
          hits: number
          id: string
          model: string | null
          query_embedding: Json | null
          query_hash: string
          query_text: string
          response: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          hits?: number
          id?: string
          model?: string | null
          query_embedding?: Json | null
          query_hash: string
          query_text: string
          response: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          hits?: number
          id?: string
          model?: string | null
          query_embedding?: Json | null
          query_hash?: string
          query_text?: string
          response?: string
        }
        Relationships: []
      }
      code_agent_events: {
        Row: {
          agent_name: string
          created_at: string
          event_type: string
          id: number
          payload: Json
          run_id: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          event_type: string
          id?: number
          payload?: Json
          run_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          event_type?: string
          id?: number
          payload?: Json
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_agent_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "code_agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      code_agent_runs: {
        Row: {
          assistant_message_id: string | null
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          last_poll_at: string | null
          preview_url: string | null
          project_id: string
          started_at: string
          status: string
          table_name: string
          user_id: string
          user_prompt: string
          v0_chat_id: string | null
          v0_version_id: string | null
        }
        Insert: {
          assistant_message_id?: string | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          last_poll_at?: string | null
          preview_url?: string | null
          project_id: string
          started_at?: string
          status?: string
          table_name?: string
          user_id: string
          user_prompt: string
          v0_chat_id?: string | null
          v0_version_id?: string | null
        }
        Update: {
          assistant_message_id?: string | null
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          last_poll_at?: string | null
          preview_url?: string | null
          project_id?: string
          started_at?: string
          status?: string
          table_name?: string
          user_id?: string
          user_prompt?: string
          v0_chat_id?: string | null
          v0_version_id?: string | null
        }
        Relationships: []
      }
      code_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          project_id: string
          role: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          project_id: string
          role: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "code_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "code_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_project_deployments: {
        Row: {
          created_at: string
          error: string | null
          id: string
          inspector_url: string | null
          project_id: string
          status: string
          updated_at: string
          url: string | null
          user_id: string
          v0_chat_id: string | null
          v0_deployment_id: string | null
          v0_version_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          inspector_url?: string | null
          project_id: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id: string
          v0_chat_id?: string | null
          v0_deployment_id?: string | null
          v0_version_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          inspector_url?: string | null
          project_id?: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          v0_chat_id?: string | null
          v0_deployment_id?: string | null
          v0_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code_project_deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "code_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_project_files: {
        Row: {
          content: string
          created_at: string
          id: string
          path: string
          project_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          path: string
          project_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          path?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "code_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_project_sandboxes: {
        Row: {
          created_at: string
          last_error: string | null
          last_synced_at: string | null
          manager_url: string | null
          preview_url: string | null
          project_id: string
          sandbox_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          last_error?: string | null
          last_synced_at?: string | null
          manager_url?: string | null
          preview_url?: string | null
          project_id: string
          sandbox_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          last_error?: string | null
          last_synced_at?: string | null
          manager_url?: string | null
          preview_url?: string | null
          project_id?: string
          sandbox_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_project_sandboxes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "code_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_projects: {
        Row: {
          accent_color: string | null
          created_at: string
          description: string | null
          entry_file: string
          id: string
          initial_prompt: string | null
          instructions: string | null
          model_tier: string
          name: string
          owner_id: string
          preview_url: string | null
          published_url: string | null
          slug: string | null
          template: string
          updated_at: string
          v0_chat_id: string | null
          v0_latest_version_id: string | null
          v0_project_id: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          description?: string | null
          entry_file?: string
          id?: string
          initial_prompt?: string | null
          instructions?: string | null
          model_tier?: string
          name?: string
          owner_id: string
          preview_url?: string | null
          published_url?: string | null
          slug?: string | null
          template?: string
          updated_at?: string
          v0_chat_id?: string | null
          v0_latest_version_id?: string | null
          v0_project_id?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          description?: string | null
          entry_file?: string
          id?: string
          initial_prompt?: string | null
          instructions?: string | null
          model_tier?: string
          name?: string
          owner_id?: string
          preview_url?: string | null
          published_url?: string | null
          slug?: string | null
          template?: string
          updated_at?: string
          v0_chat_id?: string | null
          v0_latest_version_id?: string | null
          v0_project_id?: string | null
        }
        Relationships: []
      }
      code_publishes: {
        Row: {
          bundle_path: string | null
          created_at: string
          id: string
          project_id: string
          public_url: string | null
          status: string
          version: number
        }
        Insert: {
          bundle_path?: string | null
          created_at?: string
          id?: string
          project_id: string
          public_url?: string | null
          status?: string
          version?: number
        }
        Update: {
          bundle_path?: string | null
          created_at?: string
          id?: string
          project_id?: string
          public_url?: string | null
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "code_publishes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "code_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_v0_tasks: {
        Row: {
          created_at: string
          detail: string | null
          external_id: string | null
          id: string
          project_id: string
          run_id: string
          sequence: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          external_id?: string | null
          id?: string
          project_id: string
          run_id: string
          sequence?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          external_id?: string | null
          id?: string
          project_id?: string
          run_id?: string
          sequence?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_v0_tasks_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "code_agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      composio_auth_configs: {
        Row: {
          app_slug: string
          auth_config_id: string
          created_at: string
        }
        Insert: {
          app_slug: string
          auth_config_id: string
          created_at?: string
        }
        Update: {
          app_slug?: string
          auth_config_id?: string
          created_at?: string
        }
        Relationships: []
      }
      composio_connections: {
        Row: {
          app_slug: string
          connected_account_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_slug: string
          connected_account_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_slug?: string
          connected_account_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          ai_reply: string | null
          created_at: string
          email: string
          form_type: string
          id: string
          message: string
          name: string
          reply_sent: boolean
          subject: string | null
        }
        Insert: {
          ai_reply?: string | null
          created_at?: string
          email: string
          form_type?: string
          id?: string
          message: string
          name: string
          reply_sent?: boolean
          subject?: string | null
        }
        Update: {
          ai_reply?: string | null
          created_at?: string
          email?: string
          form_type?: string
          id?: string
          message?: string
          name?: string
          reply_sent?: boolean
          subject?: string | null
        }
        Relationships: []
      }
      conversation_invites: {
        Row: {
          accepted_by: string | null
          conversation_id: string
          created_at: string
          expires_at: string
          id: string
          invite_email: string | null
          invite_token: string
          invited_by: string
          status: string
        }
        Insert: {
          accepted_by?: string | null
          conversation_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_email?: string | null
          invite_token?: string
          invited_by: string
          status?: string
        }
        Update: {
          accepted_by?: string | null
          conversation_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invite_email?: string | null
          invite_token?: string
          invited_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_invites_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          key_points: Json
          last_message_at: string | null
          metadata: Json
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          key_points?: Json
          last_message_at?: string | null
          metadata?: Json
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          key_points?: Json
          last_message_at?: string | null
          metadata?: Json
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean
          is_shared: boolean | null
          mode: string
          model: string | null
          pinned_at: string | null
          share_id: string | null
          title: string
          ui_state: Json
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_shared?: boolean | null
          mode?: string
          model?: string | null
          pinned_at?: string | null
          share_id?: string | null
          title?: string
          ui_state?: Json
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_shared?: boolean | null
          mode?: string
          model?: string | null
          pinned_at?: string | null
          share_id?: string | null
          title?: string
          ui_state?: Json
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      corn_agents: {
        Row: {
          agent_key: string
          completed_at: string | null
          created_at: string
          current_task: string | null
          id: string
          name: string
          progress: number
          result: Json | null
          role: string
          run_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          agent_key: string
          completed_at?: string | null
          created_at?: string
          current_task?: string | null
          id?: string
          name: string
          progress?: number
          result?: Json | null
          role: string
          run_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          agent_key?: string
          completed_at?: string | null
          created_at?: string
          current_task?: string | null
          id?: string
          name?: string
          progress?: number
          result?: Json | null
          role?: string
          run_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "corn_agents_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "corn_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      corn_events: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          kind: string
          payload: Json | null
          run_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json | null
          run_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json | null
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corn_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "corn_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corn_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "corn_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      corn_runs: {
        Row: {
          approved_at: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          goal: string
          id: string
          plan: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          goal: string
          id?: string
          plan?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          goal?: string
          id?: string
          plan?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          description: string | null
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_free_usage: {
        Row: {
          created_at: string
          feature: string
          id: string
          usage_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature?: string
          id?: string
          usage_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          usage_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_promo_slots: {
        Row: {
          claimed_count: number
          created_at: string
          date: string
          total_slots: number
          updated_at: string
        }
        Insert: {
          claimed_count?: number
          created_at?: string
          date?: string
          total_slots?: number
          updated_at?: string
        }
        Update: {
          claimed_count?: number
          created_at?: string
          date?: string
          total_slots?: number
          updated_at?: string
        }
        Relationships: []
      }
      deapi_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          last_used_at: string | null
          usage_count: number | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          last_used_at?: string | null
          usage_count?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          last_used_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      document_premium_usage: {
        Row: {
          id: string
          kind: string | null
          template_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          kind?: string | null
          template_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          kind?: string | null
          template_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_template_images: {
        Row: {
          created_at: string
          image_url: string
          source: string
          template_id: string
          updated_at: string
          uploaded_by_chat_id: number | null
        }
        Insert: {
          created_at?: string
          image_url: string
          source?: string
          template_id: string
          updated_at?: string
          uploaded_by_chat_id?: number | null
        }
        Update: {
          created_at?: string
          image_url?: string
          source?: string
          template_id?: string
          updated_at?: string
          uploaded_by_chat_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_template_images_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          kind: string
          name: string
          preview_url: string | null
          sort_order: number
          structure: Json
          style: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id: string
          kind: string
          name: string
          preview_url?: string | null
          sort_order?: number
          structure?: Json
          style?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name?: string
          preview_url?: string | null
          sort_order?: number
          structure?: Json
          style?: Json
          updated_at?: string
        }
        Relationships: []
      }
      dodo_products: {
        Row: {
          active: boolean
          created_at: string
          id: string
          interval: string
          product_id: string
          tier: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          interval: string
          product_id: string
          tier: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          interval?: string
          product_id?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      e2b_executions: {
        Row: {
          conversation_id: string | null
          created_at: string
          credits_used: number | null
          duration_ms: number | null
          error: string | null
          files: Json | null
          id: string
          input: Json
          kind: string
          language: string | null
          result: Json | null
          status: string
          stderr: string | null
          stdout: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          credits_used?: number | null
          duration_ms?: number | null
          error?: string | null
          files?: Json | null
          id?: string
          input?: Json
          kind: string
          language?: string | null
          result?: Json | null
          status?: string
          stderr?: string | null
          stdout?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          credits_used?: number | null
          duration_ms?: number | null
          error?: string | null
          files?: Json | null
          id?: string
          input?: Json
          kind?: string
          language?: string | null
          result?: Json | null
          status?: string
          stderr?: string | null
          stdout?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          id: string
          status: string
          subject: string
          to_email: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          subject: string
          to_email: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          subject?: string
          to_email?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      external_subscription_api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          notes: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      fal_image_models: {
        Row: {
          api_version: string
          created_at: string
          credits: number
          default_aspect: string
          default_resolution: string
          description: string | null
          display_name: string
          endpoint_image_to_image: string | null
          endpoint_multi_reference: string | null
          endpoint_text_to_image: string | null
          fal_unit_cost_usd: number
          id: string
          is_active: boolean
          is_featured: boolean
          is_new: boolean
          is_premium: boolean
          max_input_images: number
          provider: string
          slug: string
          sort_order: number
          supported_aspects: Json
          supported_resolutions: Json
          supports_multi_image: boolean
          thumbnail_url: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          api_version?: string
          created_at?: string
          credits?: number
          default_aspect?: string
          default_resolution?: string
          description?: string | null
          display_name: string
          endpoint_image_to_image?: string | null
          endpoint_multi_reference?: string | null
          endpoint_text_to_image?: string | null
          fal_unit_cost_usd?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_premium?: boolean
          max_input_images?: number
          provider: string
          slug: string
          sort_order?: number
          supported_aspects?: Json
          supported_resolutions?: Json
          supports_multi_image?: boolean
          thumbnail_url?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          api_version?: string
          created_at?: string
          credits?: number
          default_aspect?: string
          default_resolution?: string
          description?: string | null
          display_name?: string
          endpoint_image_to_image?: string | null
          endpoint_multi_reference?: string | null
          endpoint_text_to_image?: string | null
          fal_unit_cost_usd?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_premium?: boolean
          max_input_images?: number
          provider?: string
          slug?: string
          sort_order?: number
          supported_aspects?: Json
          supported_resolutions?: Json
          supports_multi_image?: boolean
          thumbnail_url?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      fal_video_models: {
        Row: {
          api_version: string
          cost_per_second_usd: number | null
          cost_per_video_usd: number | null
          created_at: string
          credits_per_second: number | null
          credits_per_video: number | null
          default_aspect: string
          default_duration: number
          default_resolution: string
          description: string | null
          display_name: string
          endpoint_image_to_video: string | null
          endpoint_reference_to_video: string | null
          endpoint_start_end_frame: string | null
          endpoint_text_to_video: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_new: boolean
          is_premium: boolean
          max_input_images: number
          provider: string
          slug: string
          sort_order: number
          supported_aspects: Json
          supported_durations: Json
          supported_resolutions: Json
          supports_audio: boolean
          supports_multi_image: boolean
          supports_start_end_frame: boolean
          thumbnail_url: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          api_version?: string
          cost_per_second_usd?: number | null
          cost_per_video_usd?: number | null
          created_at?: string
          credits_per_second?: number | null
          credits_per_video?: number | null
          default_aspect?: string
          default_duration?: number
          default_resolution?: string
          description?: string | null
          display_name: string
          endpoint_image_to_video?: string | null
          endpoint_reference_to_video?: string | null
          endpoint_start_end_frame?: string | null
          endpoint_text_to_video?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_premium?: boolean
          max_input_images?: number
          provider: string
          slug: string
          sort_order?: number
          supported_aspects?: Json
          supported_durations?: Json
          supported_resolutions?: Json
          supports_audio?: boolean
          supports_multi_image?: boolean
          supports_start_end_frame?: boolean
          thumbnail_url?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          api_version?: string
          cost_per_second_usd?: number | null
          cost_per_video_usd?: number | null
          created_at?: string
          credits_per_second?: number | null
          credits_per_video?: number | null
          default_aspect?: string
          default_duration?: number
          default_resolution?: string
          description?: string | null
          display_name?: string
          endpoint_image_to_video?: string | null
          endpoint_reference_to_video?: string | null
          endpoint_start_end_frame?: string | null
          endpoint_text_to_video?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_premium?: boolean
          max_input_images?: number
          provider?: string
          slug?: string
          sort_order?: number
          supported_aspects?: Json
          supported_durations?: Json
          supported_resolutions?: Json
          supports_audio?: boolean
          supports_multi_image?: boolean
          supports_start_end_frame?: boolean
          thumbnail_url?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          actual_seconds: number
          completed: boolean
          created_at: string
          ended_at: string | null
          id: string
          planned_minutes: number
          status: string
          task_name: string
          user_id: string
        }
        Insert: {
          actual_seconds?: number
          completed?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          planned_minutes?: number
          status?: string
          task_name: string
          user_id: string
        }
        Update: {
          actual_seconds?: number
          completed?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          planned_minutes?: number
          status?: string
          task_name?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_sites: {
        Row: {
          created_at: string
          error_message: string | null
          html_compiled: string | null
          id: string
          is_public: boolean
          jsx_code: string | null
          model_used: string | null
          prompt: string
          share_slug: string | null
          status: string
          title: string
          tokens_used: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          html_compiled?: string | null
          id?: string
          is_public?: boolean
          jsx_code?: string | null
          model_used?: string | null
          prompt: string
          share_slug?: string | null
          status?: string
          title?: string
          tokens_used?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          html_compiled?: string | null
          id?: string
          is_public?: boolean
          jsx_code?: string | null
          model_used?: string | null
          prompt?: string
          share_slug?: string | null
          status?: string
          title?: string
          tokens_used?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_songs: {
        Row: {
          audio_url: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          prompt: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          prompt: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          prompt?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generation_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          input_data: Json
          job_type: string
          progress: number | null
          result_data: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          job_type?: string
          progress?: number | null
          result_data?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          job_type?: string
          progress?: number | null
          result_data?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      github_oauth_states: {
        Row: {
          created_at: string
          redirect_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          redirect_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          redirect_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      headshot_templates: {
        Row: {
          created_at: string | null
          display_order: number | null
          gender: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_url: string | null
          prompt: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_url?: string | null
          prompt: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_url?: string | null
          prompt?: string
        }
        Relationships: []
      }
      image_templates: {
        Row: {
          created_at: string
          display_order: number
          example_image_url: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          prompt: string
          type: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          example_image_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          prompt: string
          type?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          example_image_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          prompt?: string
          type?: string
        }
        Relationships: []
      }
      learn_profile: {
        Row: {
          analogy_style: string | null
          created_at: string
          interests: string[] | null
          level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analogy_style?: string | null
          created_at?: string
          interests?: string[] | null
          level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analogy_style?: string | null
          created_at?: string
          interests?: string[] | null
          level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learn_sessions: {
        Row: {
          conversation_id: string | null
          created_at: string
          duration_min: number | null
          id: string
          mastered_topics: Json | null
          questions_correct: number | null
          questions_total: number | null
          topic: string | null
          user_id: string
          weak_topics: Json | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          mastered_topics?: Json | null
          questions_correct?: number | null
          questions_total?: number | null
          topic?: string | null
          user_id: string
          weak_topics?: Json | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          mastered_topics?: Json | null
          questions_correct?: number | null
          questions_total?: number | null
          topic?: string | null
          user_id?: string
          weak_topics?: Json | null
        }
        Relationships: []
      }
      lemondata_keys: {
        Row: {
          api_key: string
          block_reason: string | null
          created_at: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          is_blocked: boolean | null
          label: string | null
          last_error_at: string | null
          last_used_at: string | null
          usage_count: number | null
        }
        Insert: {
          api_key: string
          block_reason?: string | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          is_blocked?: boolean | null
          label?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          usage_count?: number | null
        }
        Update: {
          api_key?: string
          block_reason?: string | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          is_blocked?: boolean | null
          label?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      letta_user_agents: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          letta_agent_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          letta_agent_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          letta_agent_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_ads: {
        Row: {
          aspect_ratio: string | null
          body_copy: string | null
          campaign_id: string
          color_mood: string | null
          created_at: string
          cta: string | null
          error: string | null
          headline: string
          id: string
          image_url: string | null
          platform: string | null
          status: string
          subheadline: string | null
          user_id: string
          visual_prompt: string
        }
        Insert: {
          aspect_ratio?: string | null
          body_copy?: string | null
          campaign_id: string
          color_mood?: string | null
          created_at?: string
          cta?: string | null
          error?: string | null
          headline: string
          id?: string
          image_url?: string | null
          platform?: string | null
          status?: string
          subheadline?: string | null
          user_id: string
          visual_prompt: string
        }
        Update: {
          aspect_ratio?: string | null
          body_copy?: string | null
          campaign_id?: string
          color_mood?: string | null
          created_at?: string
          cta?: string | null
          error?: string | null
          headline?: string
          id?: string
          image_url?: string | null
          platform?: string | null
          status?: string
          subheadline?: string | null
          user_id?: string
          visual_prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_ads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          brief: Json
          created_at: string
          id: string
          name: string
          product_description: string | null
          product_name: string | null
          target_audience: string | null
          tone: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          brief?: Json
          created_at?: string
          id?: string
          name: string
          product_description?: string | null
          product_name?: string | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          brief?: Json
          created_at?: string
          id?: string
          name?: string
          product_description?: string | null
          product_name?: string | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          cost_credits: number
          created_at: string
          duration_seconds: number | null
          height: number | null
          id: string
          kind: string
          metadata: Json
          model: string
          prompt: string | null
          provider: string
          public_url: string
          storage_path: string
          user_id: string
          width: number | null
          workspace_id: string | null
        }
        Insert: {
          cost_credits?: number
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind: string
          metadata?: Json
          model: string
          prompt?: string | null
          provider: string
          public_url: string
          storage_path: string
          user_id: string
          width?: number | null
          workspace_id?: string | null
        }
        Update: {
          cost_credits?: number
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: string
          metadata?: Json
          model?: string
          prompt?: string | null
          provider?: string
          public_url?: string
          storage_path?: string
          user_id?: string
          width?: number | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      meeting_recordings: {
        Row: {
          action_items: Json | null
          audio_url: string | null
          created_at: string
          credits_used: number | null
          decisions: Json | null
          duration_minutes: number | null
          id: string
          key_points: Json | null
          meeting_id: string
          status: string
          summary: string | null
          transcript: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          audio_url?: string | null
          created_at?: string
          credits_used?: number | null
          decisions?: Json | null
          duration_minutes?: number | null
          id?: string
          key_points?: Json | null
          meeting_id: string
          status?: string
          summary?: string | null
          transcript?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: Json | null
          audio_url?: string | null
          created_at?: string
          credits_used?: number | null
          decisions?: Json | null
          duration_minutes?: number | null
          id?: string
          key_points?: Json | null
          meeting_id?: string
          status?: string
          summary?: string | null
          transcript?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          bot_enabled: boolean
          bot_id: string | null
          calendar_event_id: string | null
          created_at: string
          end_time: string
          id: string
          meeting_url: string | null
          platform: string | null
          start_time: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_enabled?: boolean
          bot_id?: string | null
          calendar_event_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          meeting_url?: string | null
          platform?: string | null
          start_time: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_enabled?: boolean
          bot_id?: string | null
          calendar_event_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          meeting_url?: string | null
          platform?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      megsy_code_skills: {
        Row: {
          category: string
          content: string
          created_at: string
          enabled: boolean
          id: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          created_at: string
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      message_feedback: {
        Row: {
          created_at: string
          id: string
          message_id: string
          project_id: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          project_id: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          project_id?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          conversation_id: string
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          conversation_id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          images: string[] | null
          liked: boolean | null
          metadata: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          images?: string[] | null
          liked?: boolean | null
          metadata?: Json | null
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          images?: string[] | null
          liked?: boolean | null
          metadata?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      model_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          model_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          model_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          model_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      model_pricing: {
        Row: {
          badge: string | null
          created_at: string
          credits_per_unit: number | null
          enabled: boolean
          endpoint: string
          icon: string | null
          id: string
          in_price_per_m: number | null
          kind: string
          label: string
          max_credits: number | null
          metadata: Json
          min_credits: number | null
          out_price_per_m: number | null
          provider: string
          sort_order: number
          unit: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          credits_per_unit?: number | null
          enabled?: boolean
          endpoint: string
          icon?: string | null
          id: string
          in_price_per_m?: number | null
          kind: string
          label: string
          max_credits?: number | null
          metadata?: Json
          min_credits?: number | null
          out_price_per_m?: number | null
          provider: string
          sort_order?: number
          unit: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          credits_per_unit?: number | null
          enabled?: boolean
          endpoint?: string
          icon?: string | null
          id?: string
          in_price_per_m?: number | null
          kind?: string
          label?: string
          max_credits?: number | null
          metadata?: Json
          min_credits?: number | null
          out_price_per_m?: number | null
          provider?: string
          sort_order?: number
          unit?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          app_credits: boolean
          app_generation: boolean
          app_referral: boolean
          app_system: boolean
          created_at: string
          email_low_balance: boolean
          email_newsletter: boolean
          email_transactions: boolean
          email_welcome: boolean
          id: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          app_credits?: boolean
          app_generation?: boolean
          app_referral?: boolean
          app_system?: boolean
          created_at?: string
          email_low_balance?: boolean
          email_newsletter?: boolean
          email_transactions?: boolean
          email_welcome?: boolean
          id?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          app_credits?: boolean
          app_generation?: boolean
          app_referral?: boolean
          app_system?: boolean
          created_at?: string
          email_low_balance?: boolean
          email_newsletter?: boolean
          email_transactions?: boolean
          email_welcome?: boolean
          id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          client_id: string
          client_secret_hash: string
          created_at: string | null
          id: string
          is_public: boolean | null
          logo_url: string | null
          name: string
          redirect_uris: string[]
          user_id: string
        }
        Insert: {
          client_id: string
          client_secret_hash: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          name: string
          redirect_uris?: string[]
          user_id: string
        }
        Update: {
          client_id?: string
          client_secret_hash?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          logo_url?: string | null
          name?: string
          redirect_uris?: string[]
          user_id?: string
        }
        Relationships: []
      }
      oauth_codes: {
        Row: {
          client_id: string
          code: string
          created_at: string | null
          expires_at: string
          id: string
          redirect_uri: string
          scope: string | null
          used: boolean | null
          user_id: string
        }
        Insert: {
          client_id: string
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          redirect_uri: string
          scope?: string | null
          used?: boolean | null
          user_id: string
        }
        Update: {
          client_id?: string
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          redirect_uri?: string
          scope?: string | null
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          access_token: string
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          scope: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          scope?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          scope?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operator_agent_messages: {
        Row: {
          agent: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          run_id: string
        }
        Insert: {
          agent: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          run_id: string
        }
        Update: {
          agent?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_agent_messages_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "operator_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_artifacts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          kind: string
          metadata: Json | null
          run_id: string
          step_id: string | null
          url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          kind: string
          metadata?: Json | null
          run_id: string
          step_id?: string | null
          url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json | null
          run_id?: string
          step_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_artifacts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "operator_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_artifacts_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "operator_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_audit_log: {
        Row: {
          action: string
          agent: string
          created_at: string
          error: string | null
          id: string
          payload: Json
          result: Json | null
          run_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          agent: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          result?: Json | null
          run_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          agent?: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          result?: Json | null
          run_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operator_dynamic_agents: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          key: string
          label: string
          last_used_at: string | null
          spawned_from_run_id: string | null
          system_prompt: string
          usage_count: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          key: string
          label: string
          last_used_at?: string | null
          spawned_from_run_id?: string | null
          system_prompt: string
          usage_count?: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          key?: string
          label?: string
          last_used_at?: string | null
          spawned_from_run_id?: string | null
          system_prompt?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      operator_memory: {
        Row: {
          category: string | null
          created_at: string
          fact: string
          id: string
          importance: number
          last_accessed_at: string | null
          source_run_id: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          fact: string
          id?: string
          importance?: number
          last_accessed_at?: string | null
          source_run_id?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          fact?: string
          id?: string
          importance?: number
          last_accessed_at?: string | null
          source_run_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operator_runs: {
        Row: {
          browser_session_id: string | null
          chat_response: string | null
          created_at: string
          current_phase: string | null
          error: string | null
          goal: string
          id: string
          last_tick_at: string | null
          live_view_url: string | null
          metadata: Json | null
          mode: string
          project_id: string | null
          published_url: string | null
          result: Json | null
          status: string
          updated_at: string
          user_id: string
          user_jwt: string | null
        }
        Insert: {
          browser_session_id?: string | null
          chat_response?: string | null
          created_at?: string
          current_phase?: string | null
          error?: string | null
          goal: string
          id?: string
          last_tick_at?: string | null
          live_view_url?: string | null
          metadata?: Json | null
          mode?: string
          project_id?: string | null
          published_url?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          user_jwt?: string | null
        }
        Update: {
          browser_session_id?: string | null
          chat_response?: string | null
          created_at?: string
          current_phase?: string | null
          error?: string | null
          goal?: string
          id?: string
          last_tick_at?: string | null
          live_view_url?: string | null
          metadata?: Json | null
          mode?: string
          project_id?: string | null
          published_url?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          user_jwt?: string | null
        }
        Relationships: []
      }
      operator_steps: {
        Row: {
          agent: string
          created_at: string
          description: string | null
          error: string | null
          finished_at: string | null
          id: string
          retries: number
          run_id: string
          started_at: string | null
          status: string
          step_no: number
          title: string
          tool: string | null
          tool_input: Json | null
          tool_output: Json | null
        }
        Insert: {
          agent?: string
          created_at?: string
          description?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          retries?: number
          run_id: string
          started_at?: string | null
          status?: string
          step_no: number
          title: string
          tool?: string | null
          tool_input?: Json | null
          tool_output?: Json | null
        }
        Update: {
          agent?: string
          created_at?: string
          description?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          retries?: number
          run_id?: string
          started_at?: string | null
          status?: string
          step_no?: number
          title?: string
          tool?: string | null
          tool_input?: Json | null
          tool_output?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "operator_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_user_settings: {
        Row: {
          allow_browser_automation: boolean
          allow_dynamic_agents: boolean
          allow_free_shell: boolean
          ask_before_anything: boolean
          ask_before_sensitive: boolean
          budget_cap_cents: number
          created_at: string
          max_parallel_agents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_browser_automation?: boolean
          allow_dynamic_agents?: boolean
          allow_free_shell?: boolean
          ask_before_anything?: boolean
          ask_before_sensitive?: boolean
          budget_cap_cents?: number
          created_at?: string
          max_parallel_agents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_browser_automation?: boolean
          allow_dynamic_agents?: boolean
          allow_free_shell?: boolean
          ask_before_anything?: boolean
          ask_before_sensitive?: boolean
          budget_cap_cents?: number
          created_at?: string
          max_parallel_agents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          polar_event_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          polar_event_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          polar_event_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pipedream_accounts: {
        Row: {
          account_id: string
          account_name: string | null
          app_slug: string
          created_at: string
          external_user_id: string
          healthy: boolean | null
          id: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          account_name?: string | null
          app_slug: string
          created_at?: string
          external_user_id: string
          healthy?: boolean | null
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          account_name?: string | null
          app_slug?: string
          created_at?: string
          external_user_id?: string
          healthy?: boolean | null
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pipedream_tool_settings: {
        Row: {
          app_slug: string
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_slug: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_slug?: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pptx_jobs: {
        Row: {
          created_at: string
          doc_type: string
          error: string | null
          file_name: string | null
          file_url: string | null
          id: string
          logs: Json | null
          prompt: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          doc_type?: string
          error?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          logs?: Json | null
          prompt: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          error?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          logs?: Json | null
          prompt?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      premium_usage: {
        Row: {
          id: string
          template_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          template_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processed_orders: {
        Row: {
          created_at: string
          credits: number
          id: string
          plan: string | null
          polar_order_id: string
          product_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          plan?: string | null
          polar_order_id: string
          product_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          plan?: string | null
          polar_order_id?: string
          product_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_workspace_id: string | null
          age_gate_acked_at: string | null
          agents_onboarding_seen: boolean
          avatar_url: string | null
          chat_greeted: boolean
          created_at: string
          credits: number
          display_name: string | null
          id: string
          plan: string
          two_factor_enabled: boolean
          updated_at: string
        }
        Insert: {
          active_workspace_id?: string | null
          age_gate_acked_at?: string | null
          agents_onboarding_seen?: boolean
          avatar_url?: string | null
          chat_greeted?: boolean
          created_at?: string
          credits?: number
          display_name?: string | null
          id: string
          plan?: string
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Update: {
          active_workspace_id?: string | null
          age_gate_acked_at?: string | null
          agents_onboarding_seen?: boolean
          avatar_url?: string | null
          chat_greeted?: boolean
          created_at?: string
          credits?: number
          display_name?: string | null
          id?: string
          plan?: string
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_workspace_id_fkey"
            columns: ["active_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_custom_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_custom_domains_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_drafts: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_versions: {
        Row: {
          created_at: string
          id: string
          message: string | null
          project_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          project_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          project_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_visits: {
        Row: {
          country: string | null
          created_at: string
          device: string | null
          id: string
          path: string
          project_id: string
          referrer: string | null
          ua_hash: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          path?: string
          project_id: string
          referrer?: string | null
          ua_hash?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          path?: string
          project_id?: string
          referrer?: string | null
          ua_hash?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          custom_domain: string | null
          description: string | null
          files_snapshot: Json | null
          github_repo: string | null
          id: string
          linked_supabase_project_name: string | null
          linked_supabase_project_ref: string | null
          linked_supabase_url: string | null
          model_tier: string | null
          name: string
          preview_url: string | null
          publish_settings: Json
          published_url: string | null
          status: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          v0_chat_id: string | null
          v0_latest_version_id: string | null
          v0_project_id: string | null
          visibility: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          files_snapshot?: Json | null
          github_repo?: string | null
          id?: string
          linked_supabase_project_name?: string | null
          linked_supabase_project_ref?: string | null
          linked_supabase_url?: string | null
          model_tier?: string | null
          name?: string
          preview_url?: string | null
          publish_settings?: Json
          published_url?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          v0_chat_id?: string | null
          v0_latest_version_id?: string | null
          v0_project_id?: string | null
          visibility?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          files_snapshot?: Json | null
          github_repo?: string | null
          id?: string
          linked_supabase_project_name?: string | null
          linked_supabase_project_ref?: string | null
          linked_supabase_url?: string | null
          model_tier?: string | null
          name?: string
          preview_url?: string | null
          publish_settings?: Json
          published_url?: string | null
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          v0_chat_id?: string | null
          v0_latest_version_id?: string | null
          v0_project_id?: string | null
          visibility?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      promo_deadlines: {
        Row: {
          created_at: string
          deadline_at: string
          id: string
          promo_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline_at: string
          id?: string
          promo_key?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline_at?: string
          id?: string
          promo_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_buckets: {
        Row: {
          blocked_until: string | null
          bucket: string
          count: number
          created_at: string
          hour_count: number
          hour_start: string
          id: string
          ip_hash: string | null
          updated_at: string
          user_id: string | null
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          bucket: string
          count?: number
          created_at?: string
          hour_count?: number
          hour_start?: string
          id?: string
          ip_hash?: string | null
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          bucket?: string
          count?: number
          created_at?: string
          hour_count?: number
          hour_start?: string
          id?: string
          ip_hash?: string | null
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          code: string
          converted_at: string | null
          converted_user_id: string | null
          country: string | null
          created_at: string
          id: string
          ip_hash: string | null
          landing_path: string | null
          referer: string | null
          referrer_user_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          code: string
          converted_at?: string | null
          converted_user_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          referer?: string | null
          referrer_user_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          code?: string
          converted_at?: string | null
          converted_user_id?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_path?: string | null
          referer?: string | null
          referrer_user_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount: number
          available_at: string
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          source_action: string
        }
        Insert: {
          amount?: number
          available_at?: string
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          source_action: string
        }
        Update: {
          amount?: number
          available_at?: string
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          source_action?: string
        }
        Relationships: []
      }
      referral_milestones: {
        Row: {
          achieved_at: string
          id: string
          milestone_key: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          id?: string
          milestone_key: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          id?: string
          milestone_key?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_shortlinks: {
        Row: {
          clicks: number
          code: string
          created_at: string
          slug: string
          target_path: string
          user_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          clicks?: number
          code: string
          created_at?: string
          slug: string
          target_path?: string
          user_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          clicks?: number
          code?: string
          created_at?: string
          slug?: string
          target_path?: string
          user_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      referral_tiers: {
        Row: {
          commission_rate: number
          created_at: string
          id: number
          min_conversions: number
          sort_order: number
          tier_name: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: number
          min_conversions: number
          sort_order?: number
          tier_name: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: number
          min_conversions?: number
          sort_order?: number
          tier_name?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          fingerprint_hash: string | null
          id: string
          ip_hash: string | null
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          fingerprint_hash?: string | null
          id?: string
          ip_hash?: string | null
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          fingerprint_hash?: string | null
          id?: string
          ip_hash?: string | null
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      research_jobs: {
        Row: {
          approved_at: string | null
          awaiting_approval: boolean
          context_excerpts: Json | null
          conversation_id: string | null
          created_at: string
          depth: string
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          id: string
          images: Json
          language: string | null
          needs_images: boolean
          outline: Json | null
          plan: Json
          plan_goal: string | null
          plan_intro: string | null
          plan_ready: string | null
          progress: number
          query: string
          report: string | null
          report_sections: Json | null
          sources: Json
          stage: string | null
          started_at: string | null
          status: string
          steps: Json
          thinking: string | null
          unused_sources: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          awaiting_approval?: boolean
          context_excerpts?: Json | null
          conversation_id?: string | null
          created_at?: string
          depth?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          images?: Json
          language?: string | null
          needs_images?: boolean
          outline?: Json | null
          plan?: Json
          plan_goal?: string | null
          plan_intro?: string | null
          plan_ready?: string | null
          progress?: number
          query: string
          report?: string | null
          report_sections?: Json | null
          sources?: Json
          stage?: string | null
          started_at?: string | null
          status?: string
          steps?: Json
          thinking?: string | null
          unused_sources?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          awaiting_approval?: boolean
          context_excerpts?: Json | null
          conversation_id?: string | null
          created_at?: string
          depth?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          id?: string
          images?: Json
          language?: string | null
          needs_images?: boolean
          outline?: Json | null
          plan?: Json
          plan_goal?: string | null
          plan_intro?: string | null
          plan_ready?: string | null
          progress?: number
          query?: string
          report?: string | null
          report_sections?: Json | null
          sources?: Json
          stage?: string | null
          started_at?: string | null
          status?: string
          steps?: Json
          thinking?: string | null
          unused_sources?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      research_reports: {
        Row: {
          created_at: string
          id: string
          images: Json
          plan: Json
          query: string
          report: string
          session_key: string
          share_token: string | null
          steps: Json
          thinking: string | null
          unused_sources: Json
          updated_at: string
          used_sources: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          images?: Json
          plan?: Json
          query: string
          report?: string
          session_key: string
          share_token?: string | null
          steps?: Json
          thinking?: string | null
          unused_sources?: Json
          updated_at?: string
          used_sources?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          images?: Json
          plan?: Json
          query?: string
          report?: string
          session_key?: string
          share_token?: string | null
          steps?: Json
          thinking?: string | null
          unused_sources?: Json
          updated_at?: string
          used_sources?: Json
          user_id?: string
        }
        Relationships: []
      }
      research_sessions: {
        Row: {
          created_at: string
          depth: string
          id: string
          plan: Json | null
          query: string
          report: string | null
          sources_count: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          depth?: string
          id?: string
          plan?: Json | null
          query: string
          report?: string | null
          sources_count?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          depth?: string
          id?: string
          plan?: Json | null
          query?: string
          report?: string | null
          sources_count?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_sources: {
        Row: {
          created_at: string
          id: string
          reliability: string | null
          session_id: string
          snippet: string | null
          source_type: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reliability?: string | null
          session_id: string
          snippet?: string | null
          source_type?: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reliability?: string | null
          session_id?: string
          snippet?: string | null
          source_type?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_sources_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "research_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_portal_settings: {
        Row: {
          created_at: string
          id: string
          notify_on_earning: boolean | null
          notify_on_signup: boolean | null
          payment_details: string | null
          payment_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_on_earning?: boolean | null
          notify_on_signup?: boolean | null
          payment_details?: string | null
          payment_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_on_earning?: boolean | null
          notify_on_signup?: boolean | null
          payment_details?: string | null
          payment_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rp_referral_clicks: {
        Row: {
          clicked_at: string
          country: string | null
          id: string
          ip_hash: string | null
          referral_code: string
          referrer_url: string | null
          user_agent: string | null
        }
        Insert: {
          clicked_at?: string
          country?: string | null
          id?: string
          ip_hash?: string | null
          referral_code: string
          referrer_url?: string | null
          user_agent?: string | null
        }
        Update: {
          clicked_at?: string
          country?: string | null
          id?: string
          ip_hash?: string | null
          referral_code?: string
          referrer_url?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      security_findings: {
        Row: {
          created_at: string
          description: string
          details: string
          fix_prompt: string
          id: string
          ignored_reason: string | null
          internal_id: string
          learn_more_url: string | null
          level: string
          project_id: string
          scan_id: string
          scanner_name: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          details?: string
          fix_prompt?: string
          id?: string
          ignored_reason?: string | null
          internal_id: string
          learn_more_url?: string | null
          level: string
          project_id: string
          scan_id: string
          scanner_name: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          details?: string
          fix_prompt?: string
          id?: string
          ignored_reason?: string | null
          internal_id?: string
          learn_more_url?: string | null
          level?: string
          project_id?: string
          scan_id?: string
          scanner_name?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_findings_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "security_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      security_memory: {
        Row: {
          content: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_scans: {
        Row: {
          completed_at: string | null
          created_at: string
          error_count: number
          id: string
          info_count: number
          project_id: string
          started_at: string
          status: string
          summary: Json
          user_id: string
          warning_count: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_count?: number
          id?: string
          info_count?: number
          project_id: string
          started_at?: string
          status?: string
          summary?: Json
          user_id: string
          warning_count?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_count?: number
          id?: string
          info_count?: number
          project_id?: string
          started_at?: string
          status?: string
          summary?: Json
          user_id?: string
          warning_count?: number
        }
        Relationships: []
      }
      service_incidents: {
        Row: {
          created_at: string
          id: string
          message: string | null
          resolved_at: string | null
          service_name: string
          started_at: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          service_name: string
          started_at?: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          resolved_at?: string | null
          service_name?: string
          started_at?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      service_status: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          response_time_ms: number | null
          service_name: string
          service_url: string
          status: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          service_name: string
          service_url: string
          status?: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          service_name?: string
          service_url?: string
          status?: string
        }
        Relationships: []
      }
      shopping_product_reports: {
        Row: {
          ai_report: string
          created_at: string
          currency: string
          id: string
          product_data: Json
          product_key: string
          user_id: string
        }
        Insert: {
          ai_report?: string
          created_at?: string
          currency?: string
          id?: string
          product_data?: Json
          product_key: string
          user_id: string
        }
        Update: {
          ai_report?: string
          created_at?: string
          currency?: string
          id?: string
          product_data?: Json
          product_key?: string
          user_id?: string
        }
        Relationships: []
      }
      showcase_items: {
        Row: {
          aspect_ratio: string
          category: string | null
          created_at: string
          display_order: number
          duration: string | null
          id: string
          is_trending: boolean
          media_type: string
          media_url: string
          model_id: string
          model_name: string
          prompt: string
          quality: string
          style: string | null
          thumbnail_url: string | null
          trending_at: string | null
        }
        Insert: {
          aspect_ratio?: string
          category?: string | null
          created_at?: string
          display_order?: number
          duration?: string | null
          id?: string
          is_trending?: boolean
          media_type?: string
          media_url: string
          model_id?: string
          model_name?: string
          prompt?: string
          quality?: string
          style?: string | null
          thumbnail_url?: string | null
          trending_at?: string | null
        }
        Update: {
          aspect_ratio?: string
          category?: string | null
          created_at?: string
          display_order?: number
          duration?: string | null
          id?: string
          is_trending?: boolean
          media_type?: string
          media_url?: string
          model_id?: string
          model_name?: string
          prompt?: string
          quality?: string
          style?: string | null
          thumbnail_url?: string | null
          trending_at?: string | null
        }
        Relationships: []
      }
      skill_files: {
        Row: {
          created_at: string
          id: string
          mime_type: string
          path: string
          size_bytes: number
          skill_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string
          path: string
          size_bytes?: number
          skill_id: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string
          path?: string
          size_bytes?: number
          skill_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_files_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          body: string
          created_at: string
          description: string
          enabled_tools: string[]
          icon: string | null
          id: string
          instructions: string
          is_active: boolean
          is_enabled: boolean
          name: string
          preferred_model: string | null
          triggers: string[]
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          description?: string
          enabled_tools?: string[]
          icon?: string | null
          id?: string
          instructions?: string
          is_active?: boolean
          is_enabled?: boolean
          name: string
          preferred_model?: string | null
          triggers?: string[]
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          description?: string
          enabled_tools?: string[]
          icon?: string | null
          id?: string
          instructions?: string
          is_active?: boolean
          is_enabled?: boolean
          name?: string
          preferred_model?: string | null
          triggers?: string[]
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      slide_projects: {
        Row: {
          created_at: string
          id: string
          pptx_url: string | null
          slide_count: number
          slides_data: Json | null
          status: string
          style: string
          template_id: string | null
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pptx_url?: string | null
          slide_count?: number
          slides_data?: Json | null
          status?: string
          style?: string
          template_id?: string | null
          title?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pptx_url?: string | null
          slide_count?: number
          slides_data?: Json | null
          status?: string
          style?: string
          template_id?: string | null
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      slide_templates: {
        Row: {
          component_name: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string | null
          template_engine: string
          template_id: string
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string | null
          template_engine?: string
          template_id: string
        }
        Update: {
          component_name?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string | null
          template_engine?: string
          template_id?: string
        }
        Relationships: []
      }
      spreadsheet_projects: {
        Row: {
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          sheet_data: Json | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          sheet_data?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          sheet_data?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      status_subscribers: {
        Row: {
          channel: string
          contact: string
          created_at: string
          id: string
        }
        Insert: {
          channel?: string
          contact: string
          created_at?: string
          id?: string
        }
        Update: {
          channel?: string
          contact?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      student_exams: {
        Row: {
          answers: Json
          created_at: string
          difficulty: string
          duration_seconds: number
          id: string
          questions: Json
          score: number
          subject: string
          topic: string | null
          total_questions: number
          user_id: string
          weak_areas: Json
        }
        Insert: {
          answers?: Json
          created_at?: string
          difficulty?: string
          duration_seconds?: number
          id?: string
          questions?: Json
          score?: number
          subject: string
          topic?: string | null
          total_questions?: number
          user_id: string
          weak_areas?: Json
        }
        Update: {
          answers?: Json
          created_at?: string
          difficulty?: string
          duration_seconds?: number
          id?: string
          questions?: Json
          score?: number
          subject?: string
          topic?: string | null
          total_questions?: number
          user_id?: string
          weak_areas?: Json
        }
        Relationships: []
      }
      student_mistakes: {
        Row: {
          concept: string
          created_at: string
          id: string
          mistake_count: number
          mistake_type: string
          next_review_at: string
          resolved: boolean
          review_stage: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concept: string
          created_at?: string
          id?: string
          mistake_count?: number
          mistake_type?: string
          next_review_at?: string
          resolved?: boolean
          review_stage?: number
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concept?: string
          created_at?: string
          id?: string
          mistake_count?: number
          mistake_type?: string
          next_review_at?: string
          resolved?: boolean
          review_stage?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          age: number | null
          country: string | null
          created_at: string
          id: string
          learning_style: string | null
          native_language: string | null
          preferred_study_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          country?: string | null
          created_at?: string
          id?: string
          learning_style?: string | null
          native_language?: string | null
          preferred_study_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          country?: string | null
          created_at?: string
          id?: string
          learning_style?: string | null
          native_language?: string | null
          preferred_study_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_topics: {
        Row: {
          created_at: string
          curriculum_map: Json
          id: string
          last_position: string | null
          last_studied_at: string | null
          level: string
          progress: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          curriculum_map?: Json
          id?: string
          last_position?: string | null
          last_studied_at?: string | null
          level?: string
          progress?: number
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          curriculum_map?: Json
          id?: string
          last_position?: string | null
          last_studied_at?: string | null
          level?: string
          progress?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          created_at: string
          exam_date: string | null
          hours_per_day: number
          id: string
          is_active: boolean
          level: string
          plan_content: string
          subjects: string
          tasks: Json
          updated_at: string
          user_id: string
          weak_areas: string | null
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          hours_per_day?: number
          id?: string
          is_active?: boolean
          level?: string
          plan_content?: string
          subjects: string
          tasks?: Json
          updated_at?: string
          user_id: string
          weak_areas?: string | null
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          hours_per_day?: number
          id?: string
          is_active?: boolean
          level?: string
          plan_content?: string
          subjects?: string
          tasks?: Json
          updated_at?: string
          user_id?: string
          weak_areas?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          id: string
          plan: string
          polar_customer_id: string | null
          polar_product_id: string | null
          polar_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string
          polar_customer_id?: string | null
          polar_product_id?: string | null
          polar_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string
          polar_customer_id?: string | null
          polar_product_id?: string | null
          polar_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supabase_oauth_states: {
        Row: {
          created_at: string
          redirect_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          redirect_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          redirect_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      system_skills: {
        Row: {
          body: string
          created_at: string
          description: string
          display_order: number
          enabled_tools: string[]
          icon: string | null
          id: string
          instructions: string
          is_active: boolean
          name: string
          preferred_model: string | null
          triggers: string[]
        }
        Insert: {
          body?: string
          created_at?: string
          description?: string
          display_order?: number
          enabled_tools?: string[]
          icon?: string | null
          id?: string
          instructions?: string
          is_active?: boolean
          name: string
          preferred_model?: string | null
          triggers?: string[]
        }
        Update: {
          body?: string
          created_at?: string
          description?: string
          display_order?: number
          enabled_tools?: string[]
          icon?: string | null
          id?: string
          instructions?: string
          is_active?: boolean
          name?: string
          preferred_model?: string | null
          triggers?: string[]
        }
        Relationships: []
      }
      template_images: {
        Row: {
          created_at: string
          image_url: string
          source: string
          template_id: string
          updated_at: string
          uploaded_by_chat_id: number | null
        }
        Insert: {
          created_at?: string
          image_url: string
          source?: string
          template_id: string
          updated_at?: string
          uploaded_by_chat_id?: number | null
        }
        Update: {
          created_at?: string
          image_url?: string
          source?: string
          template_id?: string
          updated_at?: string
          uploaded_by_chat_id?: number | null
        }
        Relationships: []
      }
      tool_landing_images: {
        Row: {
          description: string | null
          image_url: string | null
          tool_id: string
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          image_url?: string | null
          tool_id: string
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          image_url?: string | null
          tool_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tool_templates: {
        Row: {
          created_at: string | null
          display_order: number | null
          gender: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_url: string | null
          prompt: string | null
          tool_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_url?: string | null
          prompt?: string | null
          tool_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_url?: string | null
          prompt?: string | null
          tool_id?: string
        }
        Relationships: []
      }
      tts_voices: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          preview_audio_url: string
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_audio_url: string
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_audio_url?: string
          voice_id?: string | null
        }
        Relationships: []
      }
      user_assets: {
        Row: {
          created_at: string
          height: number | null
          id: string
          kind: string
          mime_type: string | null
          original_filename: string | null
          public_url: string
          size_bytes: number | null
          storage_key: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          original_filename?: string | null
          public_url: string
          size_bytes?: number | null
          storage_key: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string | null
          original_filename?: string | null
          public_url?: string
          size_bytes?: number | null
          storage_key?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      user_chat_settings: {
        Row: {
          created_at: string
          custom_instructions: string | null
          enable_citations: boolean
          enable_followups: boolean
          enable_pii_redaction: boolean
          enable_semantic_cache: boolean
          learning_mode_default: boolean
          persona: string
          preferred_dialect: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          custom_instructions?: string | null
          enable_citations?: boolean
          enable_followups?: boolean
          enable_pii_redaction?: boolean
          enable_semantic_cache?: boolean
          learning_mode_default?: boolean
          persona?: string
          preferred_dialect?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          custom_instructions?: string | null
          enable_citations?: boolean
          enable_followups?: boolean
          enable_pii_redaction?: boolean
          enable_semantic_cache?: boolean
          learning_mode_default?: boolean
          persona?: string
          preferred_dialect?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_chat_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_chat_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connector_state: {
        Row: {
          connector_id: string
          enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          connector_id: string
          enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          connector_id?: string
          enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_drafts: {
        Row: {
          created_at: string
          draft_key: string
          id: string
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          draft_key: string
          id?: string
          payload?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          draft_key?: string
          id?: string
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gallery: {
        Row: {
          created_at: string
          id: string
          image_url: string
          source_type: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          source_type?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          source_type?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gallery_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "image_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_github_connections: {
        Row: {
          access_token: string
          avatar_url: string | null
          created_at: string
          github_id: number | null
          github_login: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          avatar_url?: string | null
          created_at?: string
          github_id?: number | null
          github_login?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          avatar_url?: string | null
          created_at?: string
          github_id?: number | null
          github_login?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_installed_agents: {
        Row: {
          agent_slug: string
          id: string
          installed_at: string
          pinned: boolean
          sort_order: number
          user_id: string
        }
        Insert: {
          agent_slug: string
          id?: string
          installed_at?: string
          pinned?: boolean
          sort_order?: number
          user_id: string
        }
        Update: {
          agent_slug?: string
          id?: string
          installed_at?: string
          pinned?: boolean
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          created_at: string
          email_address: string | null
          email_enabled: boolean
          telegram_chat_id: string | null
          telegram_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_address?: string | null
          email_enabled?: boolean
          telegram_chat_id?: string | null
          telegram_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_address?: string | null
          email_enabled?: boolean
          telegram_chat_id?: string | null
          telegram_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_knowledge_graph: {
        Row: {
          confidence: number
          created_at: string
          entity: string
          entity_type: string
          id: string
          metadata: Json
          relation: string | null
          source_message_id: string | null
          target_entity: string | null
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          entity: string
          entity_type: string
          id?: string
          metadata?: Json
          relation?: string | null
          source_message_id?: string | null
          target_entity?: string | null
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          entity?: string
          entity_type?: string
          id?: string
          metadata?: Json
          relation?: string | null
          source_message_id?: string | null
          target_entity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_knowledge_graph_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memory_entries: {
        Row: {
          created_at: string
          id: string
          scope: string | null
          summary: string | null
          title: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          scope?: string | null
          summary?: string | null
          title?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          scope?: string | null
          summary?: string | null
          title?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      user_memory_profiles: {
        Row: {
          account_summary: string | null
          created_at: string
          id: string
          preferences: Json
          profile_snapshot: Json
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          account_summary?: string | null
          created_at?: string
          id?: string
          preferences?: Json
          profile_snapshot?: Json
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          account_summary?: string | null
          created_at?: string
          id?: string
          preferences?: Json
          profile_snapshot?: Json
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_memory_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memory_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_music_tracks: {
        Row: {
          created_at: string
          id: string
          name: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          active_workspace_id: string | null
          ai_personalization: Json
          created_at: string
          customization: Json
          language: string | null
          memory: Json
          notification_settings: Json
          page_settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          active_workspace_id?: string | null
          ai_personalization?: Json
          created_at?: string
          customization?: Json
          language?: string | null
          memory?: Json
          notification_settings?: Json
          page_settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          active_workspace_id?: string | null
          ai_personalization?: Json
          created_at?: string
          customization?: Json
          language?: string | null
          memory?: Json
          notification_settings?: Json
          page_settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_supabase_connections: {
        Row: {
          access_token: string
          account_email: string | null
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          account_email?: string | null
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          account_email?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      v0_api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          is_blocked: boolean
          last_error: string | null
          last_used_at: string | null
          message_limit: number
          messages_used: number
          name: string
          window_started_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          last_error?: string | null
          last_used_at?: string | null
          message_limit?: number
          messages_used?: number
          name: string
          window_started_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          last_error?: string | null
          last_used_at?: string | null
          message_limit?: number
          messages_used?: number
          name?: string
          window_started_at?: string
        }
        Relationships: []
      }
      voice_templates: {
        Row: {
          audio_file_url: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          preview_image_url: string | null
        }
        Insert: {
          audio_file_url: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_image_url?: string | null
        }
        Update: {
          audio_file_url?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_image_url?: string | null
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          payment_details: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          payment_details?: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          payment_details?: string
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_api_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_api_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_brand_kit: {
        Row: {
          accent_color: string | null
          body_font: string | null
          brand_description: string | null
          cover_url: string | null
          heading_font: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          tone_of_voice: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accent_color?: string | null
          body_font?: string | null
          brand_description?: string | null
          cover_url?: string | null
          heading_font?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accent_color?: string | null
          body_font?: string | null
          brand_description?: string | null
          cover_url?: string | null
          heading_font?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_brand_kit_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_credit_topups: {
        Row: {
          amount_credits: number
          amount_usd: number
          created_at: string
          id: string
          initiated_by: string
          invoice_number: string | null
          metadata: Json | null
          polar_order_id: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          amount_credits: number
          amount_usd: number
          created_at?: string
          id?: string
          initiated_by: string
          invoice_number?: string | null
          metadata?: Json | null
          polar_order_id?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          amount_credits?: number
          amount_usd?: number
          created_at?: string
          id?: string
          initiated_by?: string
          invoice_number?: string | null
          metadata?: Json | null
          polar_order_id?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_credit_topups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          accepted_by: string | null
          created_at: string
          expires_at: string
          id: string
          invite_email: string
          invite_token: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          status: Database["public"]["Enums"]["workspace_invite_status"]
          workspace_id: string
        }
        Insert: {
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invite_email: string
          invite_token?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["workspace_invite_status"]
          workspace_id: string
        }
        Update: {
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invite_email?: string
          invite_token?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          status?: Database["public"]["Enums"]["workspace_invite_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_join_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_join_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_member_status: {
        Row: {
          id: string
          suspended: boolean
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          suspended?: boolean
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          suspended?: boolean
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_member_status_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          joined_at: string
          monthly_limit: number | null
          monthly_period_start: string
          monthly_used: number
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          monthly_limit?: number | null
          monthly_period_start?: string
          monthly_used?: number
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          monthly_limit?: number | null
          monthly_period_start?: string
          monthly_used?: number
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_notification_prefs: {
        Row: {
          email: Json
          id: string
          in_app: Json
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          email?: Json
          id?: string
          in_app?: Json
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          email?: Json
          id?: string
          in_app?: Json
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_notification_prefs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          blocked_keywords: string[] | null
          content_policy: string
          default_language: string | null
          default_timezone: string | null
          require_join_approval: boolean
          sso_enabled: boolean
          sso_entity_id: string | null
          sso_metadata_url: string | null
          sso_provider: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          blocked_keywords?: string[] | null
          content_policy?: string
          default_language?: string | null
          default_timezone?: string | null
          require_join_approval?: boolean
          sso_enabled?: boolean
          sso_entity_id?: string | null
          sso_metadata_url?: string | null
          sso_provider?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          blocked_keywords?: string[] | null
          content_policy?: string
          default_language?: string | null
          default_timezone?: string | null
          require_join_approval?: boolean
          sso_enabled?: boolean
          sso_entity_id?: string | null
          sso_metadata_url?: string | null
          sso_provider?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_shared_resources: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          resource_type: string
          shared_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          resource_type: string
          shared_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          resource_type?: string
          shared_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_shared_resources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_task_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string | null
          position: number
          priority: Database["public"]["Enums"]["workspace_task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["workspace_task_status"]
          tags: string[]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["workspace_task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["workspace_task_status"]
          tags?: string[]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["workspace_task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["workspace_task_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "workspace_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_usage: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          description: string | null
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_usage_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          credits: number
          default_member_monthly_limit: number | null
          id: string
          name: string
          owner_id: string
          plan: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          credits?: number
          default_member_monthly_limit?: number | null
          id?: string
          name: string
          owner_id: string
          plan?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          credits?: number
          default_member_monthly_limit?: number | null
          id?: string
          name?: string
          owner_id?: string
          plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      youtube_conversations: {
        Row: {
          channel_name: string | null
          created_at: string
          duration: string | null
          id: string
          thumbnail_url: string | null
          transcript: string | null
          updated_at: string
          user_id: string
          video_id: string
          video_title: string | null
          video_url: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string
          user_id: string
          video_id: string
          video_title?: string | null
          video_url: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
          video_title?: string | null
          video_url?: string
        }
        Relationships: []
      }
      youtube_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "youtube_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "youtube_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      yt_video_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "yt_video_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "yt_video_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      yt_video_chats: {
        Row: {
          channel_name: string | null
          created_at: string
          id: string
          session_id: string
          thumbnail_url: string | null
          transcript: string | null
          updated_at: string
          user_id: string | null
          video_id: string
          video_title: string | null
          video_url: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string
          id?: string
          session_id: string
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string | null
          video_id?: string
          video_title?: string | null
          video_url: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string
          id?: string
          session_id?: string
          thumbnail_url?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string | null
          video_id?: string
          video_title?: string | null
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      service_status_public: {
        Row: {
          checked_at: string | null
          response_time_ms: number | null
          service_name: string | null
          status: string | null
        }
        Insert: {
          checked_at?: string | null
          response_time_ms?: number | null
          service_name?: string | null
          status?: string | null
        }
        Update: {
          checked_at?: string | null
          response_time_ms?: number | null
          service_name?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_conversation_invite: { Args: { p_token: string }; Returns: Json }
      add_credits: {
        Args: { p_amount: number; p_description?: string; p_user_id: string }
        Returns: Json
      }
      admin_add_api_key: {
        Args: {
          p_credit_limit?: number
          p_key: string
          p_label?: string
          p_service: string
        }
        Returns: string
      }
      block_v0_key: {
        Args: { p_id: string; p_reason: string }
        Returns: undefined
      }
      bump_conversation: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      check_profile_update_safe_policy: {
        Args: { profile_row: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_block_seconds?: number
          p_bucket: string
          p_ip_hash: string
          p_per_hour?: number
          p_per_minute?: number
          p_user_id: string
        }
        Returns: Json
      }
      claim_promo_slot: { Args: never; Returns: number }
      cleanup_old_research_reports: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_workspace: {
        Args: { p_name: string; p_plan?: string }
        Returns: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          credits: number
          default_member_monthly_limit: number | null
          id: string
          name: string
          owner_id: string
          plan: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "workspaces"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      deduct_credits: {
        Args: {
          p_action_type: string
          p_amount: number
          p_description?: string
          p_user_id: string
        }
        Returns: Json
      }
      get_invite_details: { Args: { p_token: string }; Returns: Json }
      get_referrer_commission_rate: {
        Args: { _user_id: string }
        Returns: number
      }
      get_today_promo_slots: {
        Args: never
        Returns: {
          claimed_count: number
          date: string
          remaining: number
          total_slots: number
        }[]
      }
      get_user_referral_tier: {
        Args: { _user_id: string }
        Returns: {
          commission_rate: number
          conversions: number
          tier_name: string
        }[]
      }
      get_user_subscription_status: {
        Args: { p_email?: string; p_user_id?: string }
        Returns: Json
      }
      get_workspace_invite_details: { Args: { p_token: string }; Returns: Json }
      has_unlimited_plan: { Args: { p_user_id: string }; Returns: boolean }
      is_conversation_member: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      is_invite_for_current_user: {
        Args: { p_invite_email: string }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { _user: string; _ws: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user: string; _ws: string }
        Returns: boolean
      }
      mark_notifications_read: {
        Args: { p_notification_ids?: string[]; p_user_id: string }
        Returns: undefined
      }
      owns_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      pick_api_key: {
        Args: { p_service: string }
        Returns: {
          api_key: string
          id: string
        }[]
      }
      pick_v0_key: {
        Args: never
        Returns: {
          api_key: string
          id: string
        }[]
      }
      process_polar_order: {
        Args: {
          p_credits: number
          p_order_id: string
          p_plan: string
          p_product_id: string
          p_user_id: string
        }
        Returns: Json
      }
      record_api_key_usage: {
        Args: {
          p_cost_usd?: number
          p_error?: string
          p_id: string
          p_ok?: boolean
          p_status_code?: number
        }
        Returns: undefined
      }
      search_attachment_chunks: {
        Args: {
          p_conversation_id: string
          p_match_count?: number
          p_query_embedding: string
          p_user_id: string
        }
        Returns: {
          chunk_index: number
          content: string
          file_name: string
          id: string
          similarity: number
        }[]
      }
      spend_credits_auto:
        | {
            Args: {
              p_action_type: string
              p_amount: number
              p_description?: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_action_type: string
              p_amount: number
              p_description?: string
              p_user_id: string
              p_workspace_id: string
            }
            Returns: Json
          }
      update_profile_safe: {
        Args: {
          p_avatar_url?: string
          p_display_name?: string
          p_two_factor_enabled?: boolean
          p_user_id: string
        }
        Returns: undefined
      }
      verify_external_api_key: { Args: { p_key_hash: string }; Returns: string }
      workspace_accept_invite: { Args: { p_token: string }; Returns: Json }
      workspace_apply_topup: {
        Args: {
          p_amount_credits: number
          p_amount_usd: number
          p_initiated_by: string
          p_polar_order_id: string
          p_workspace_id: string
        }
        Returns: Json
      }
      workspace_approve_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      workspace_archive: { Args: { p_ws: string }; Returns: Json }
      workspace_create_api_key: {
        Args: { p_name: string; p_ws: string }
        Returns: Json
      }
      workspace_create_invite: {
        Args: {
          p_email: string
          p_role?: Database["public"]["Enums"]["workspace_role"]
          p_workspace_id: string
        }
        Returns: Json
      }
      workspace_decline_invite: { Args: { p_token: string }; Returns: Json }
      workspace_deduct_credits: {
        Args: {
          p_action_type: string
          p_amount: number
          p_description?: string
          p_workspace_id: string
        }
        Returns: Json
      }
      workspace_export_gdpr: { Args: { p_ws: string }; Returns: Json }
      workspace_log: {
        Args: {
          p_action: string
          p_meta?: Json
          p_target_id?: string
          p_target_type?: string
          p_ws: string
        }
        Returns: undefined
      }
      workspace_reject_request: {
        Args: { p_request_id: string }
        Returns: Json
      }
      workspace_revoke_api_key: { Args: { p_key_id: string }; Returns: Json }
      workspace_role_of: {
        Args: { _user: string; _ws: string }
        Returns: Database["public"]["Enums"]["workspace_role"]
      }
      workspace_set_member_role: {
        Args: {
          p_role: Database["public"]["Enums"]["workspace_role"]
          p_user: string
          p_ws: string
        }
        Returns: Json
      }
      workspace_set_member_status: {
        Args: {
          p_reason?: string
          p_suspended: boolean
          p_user: string
          p_ws: string
        }
        Returns: Json
      }
      workspace_transfer_ownership: {
        Args: { p_new_owner: string; p_ws: string }
        Returns: Json
      }
      workspace_transfer_project: {
        Args: { p_project_id: string; p_target_ws: string }
        Returns: Json
      }
    }
    Enums: {
      memory_scope:
        | "account"
        | "conversation"
        | "project"
        | "file"
        | "preference"
      workspace_invite_status: "pending" | "accepted" | "revoked" | "expired"
      workspace_role:
        | "owner"
        | "admin"
        | "member"
        | "editor"
        | "viewer"
        | "billing_manager"
      workspace_task_priority: "low" | "medium" | "high"
      workspace_task_status: "todo" | "doing" | "done"
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
      memory_scope: [
        "account",
        "conversation",
        "project",
        "file",
        "preference",
      ],
      workspace_invite_status: ["pending", "accepted", "revoked", "expired"],
      workspace_role: [
        "owner",
        "admin",
        "member",
        "editor",
        "viewer",
        "billing_manager",
      ],
      workspace_task_priority: ["low", "medium", "high"],
      workspace_task_status: ["todo", "doing", "done"],
    },
  },
} as const

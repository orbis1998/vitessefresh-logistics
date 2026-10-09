export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Types Vita Express (`fppxpycgtevlugyiwbfb`). Régénérer via `supabase gen types` si le schéma change. */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          phone: string | null
          role: string
          company_id: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          phone?: string | null
          role?: string
          company_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          client_id: string
          driver_id: string | null
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          delivery_address: string
          delivery_lat: number
          delivery_lng: number
          distance: number | null
          base_price: number | null
          total_price: number | null
          status: string
          package_description: string | null
          special_instructions: string | null
          evaluation_level: string | null
          evaluation_payload: Json
          quote_snapshot: Json | null
          otp_hash: string | null
          weight_kg: number | null
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      zones: {
        Row: {
          id: string
          name: string
          commune: string | null
          boundary: Json | null
          category: string
          active: boolean
          base_price: number | null
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      plans: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      subscriptions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      tracking: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      driver_profiles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      driver_pings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      vehicles: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      pricing_rules: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      parcel_photos: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      evaluation_logs: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      cost_entries: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      notifications: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      audit_events: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      groq_analyses: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      companies: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      company_members: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      support_threads: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      support_messages: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
      ops_settings: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: {
      is_staff: { Args: { _uid: string }; Returns: boolean }
      assign_driver: { Args: { p_order_id: string; p_driver_id: string }; Returns: Json }
      verify_delivery_code: { Args: { p_order_id: string; p_code: string }; Returns: Json }
      enqueue_notification: {
        Args: { p_event_key: string; p_phone: string; p_body: string; p_order_id?: string; p_channel?: string }
        Returns: string
      }
    }
    Enums: {
      user_role: "CLIENT" | "DRIVER" | "ADMIN" | "GESTIONNAIRE" | "DISPATCH" | "SUIVI" | "SUPPORT" | "COMPTABLE" | "FINANCE" | "ENTREPRISE"
      order_status:
        | "PENDING"
        | "ACCEPTED"
        | "PICKED_UP"
        | "IN_TRANSIT"
        | "DELIVERED"
        | "CANCELLED"
        | "DRAFT"
        | "SUBMITTED"
        | "EVALUATING"
        | "PENDING_VALIDATION"
        | "ASSIGNED"
        | "COLLECTING"
        | "REJECTED"
        | "FAILED"
        | "DISPUTE"
        | "RETURN_NEEDED"
    }
    CompositeTypes: Record<string, never>
  }
}

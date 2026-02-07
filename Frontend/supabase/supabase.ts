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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount_due: number
          amount_paid: number
          cancelled_at: string | null
          class_id: number
          created_at: string
          guest_contact: string | null
          guest_name: string | null
          id: number
          is_attended: boolean | null
          kind: Database["public"]["Enums"]["booking_kind"]
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_note: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["booking_status"]
          user_id: string | null
          user_package_id: number | null
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          cancelled_at?: string | null
          class_id: number
          created_at?: string
          guest_contact?: string | null
          guest_name?: string | null
          id?: number
          is_attended?: boolean | null
          kind?: Database["public"]["Enums"]["booking_kind"]
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_note?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["booking_status"]
          user_id?: string | null
          user_package_id?: number | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          cancelled_at?: string | null
          class_id?: number
          created_at?: string
          guest_contact?: string | null
          guest_name?: string | null
          id?: number
          is_attended?: boolean | null
          kind?: Database["public"]["Enums"]["booking_kind"]
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_note?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["booking_status"]
          user_id?: string | null
          user_package_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_package_id_fkey"
            columns: ["user_package_id"]
            isOneToOne: false
            referencedRelation: "user_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_types: {
        Row: {
          color: string | null
          color_code: string | null
          cover_image_url: string | null
          created_at: string | null
          default_price: number | null
          description: string | null
          duration_minutes: number | null
          gallery_images: string[] | null
          id: number
          level: string | null
          long_description: string | null
          price: number | null
          title: string
        }
        Insert: {
          color?: string | null
          color_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          default_price?: number | null
          description?: string | null
          duration_minutes?: number | null
          gallery_images?: string[] | null
          id?: number
          level?: string | null
          long_description?: string | null
          price?: number | null
          title: string
        }
        Update: {
          color?: string | null
          color_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          default_price?: number | null
          description?: string | null
          duration_minutes?: number | null
          gallery_images?: string[] | null
          id?: number
          level?: string | null
          long_description?: string | null
          price?: number | null
          title?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          booked_count: number
          capacity: number
          category: string | null
          class_type_id: number | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          early_bird_deadline: string | null
          early_bird_price: number | null
          ends_at: string | null
          gallery_images: string[] | null
          id: number
          instructor_id: string | null
          is_cancelled: boolean
          level: string | null
          location: string | null
          long_description: string | null
          price: number | null
          registration_opens_at: string | null
          starts_at: string
          title: string
        }
        Insert: {
          booked_count?: number
          capacity: number
          category?: string | null
          class_type_id?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          early_bird_deadline?: string | null
          early_bird_price?: number | null
          ends_at?: string | null
          gallery_images?: string[] | null
          id?: number
          instructor_id?: string | null
          is_cancelled?: boolean
          level?: string | null
          location?: string | null
          long_description?: string | null
          price?: number | null
          registration_opens_at?: string | null
          starts_at: string
          title: string
        }
        Update: {
          booked_count?: number
          capacity?: number
          category?: string | null
          class_type_id?: number | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          early_bird_deadline?: string | null
          early_bird_price?: number | null
          ends_at?: string | null
          gallery_images?: string[] | null
          id?: number
          instructor_id?: string | null
          is_cancelled?: boolean
          level?: string | null
          location?: string | null
          long_description?: string | null
          price?: number | null
          registration_opens_at?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_type_id_fkey"
            columns: ["class_type_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          created_by: string | null
          expense_date: string | null
          id: number
          note: string | null
          title: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          expense_date?: string | null
          id?: number
          note?: string | null
          title: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          expense_date?: string | null
          id?: number
          note?: string | null
          title?: string
        }
        Relationships: []
      }
      kv_store_baa97425: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          credits: number | null
          duration_days: number
          id: number
          is_active: boolean
          name: string
          price: number | null
          type: Database["public"]["Enums"]["package_type"]
        }
        Insert: {
          created_at?: string
          credits?: number | null
          duration_days: number
          id?: number
          is_active?: boolean
          name: string
          price?: number | null
          type: Database["public"]["Enums"]["package_type"]
        }
        Update: {
          created_at?: string
          credits?: number | null
          duration_days?: number
          id?: number
          is_active?: boolean
          name?: string
          price?: number | null
          type?: Database["public"]["Enums"]["package_type"]
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: number | null
          created_at: string
          currency: string
          evidence_url: string | null
          id: number
          log_status: Database["public"]["Enums"]["payment_log_status"]
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_at: string
          recorded_by: string | null
          user_id: string
          user_package_id: number | null
        }
        Insert: {
          amount: number
          booking_id?: number | null
          created_at?: string
          currency?: string
          evidence_url?: string | null
          id?: number
          log_status?: Database["public"]["Enums"]["payment_log_status"]
          method: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string
          recorded_by?: string | null
          user_id: string
          user_package_id?: number | null
        }
        Update: {
          amount?: number
          booking_id?: number | null
          created_at?: string
          currency?: string
          evidence_url?: string | null
          id?: number
          log_status?: Database["public"]["Enums"]["payment_log_status"]
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string
          recorded_by?: string | null
          user_id?: string
          user_package_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_package_fk"
            columns: ["user_package_id"]
            isOneToOne: false
            referencedRelation: "user_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contact_info: string | null
          created_at: string
          full_name: string | null
          id: string
          nationality: string | null
          phone: string | null
          role: Database["public"]["Enums"]["role_type"]
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contact_info?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          nationality?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role_type"]
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contact_info?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          nationality?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["role_type"]
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_packages: {
        Row: {
          activated_at: string | null
          created_at: string
          credits_remaining: number | null
          expire_at: string
          id: number
          package_id: number
          start_at: string
          status: Database["public"]["Enums"]["user_package_status"]
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          credits_remaining?: number | null
          expire_at: string
          id?: number
          package_id: number
          start_at?: string
          status?: Database["public"]["Enums"]["user_package_status"]
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          credits_remaining?: number | null
          expire_at?: string
          id?: number
          package_id?: number
          start_at?: string
          status?: Database["public"]["Enums"]["user_package_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_schedule: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: number
          instructor: string | null
          room: string | null
          start_time: string
          template_id: number | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: number
          instructor?: string | null
          room?: string | null
          start_time: string
          template_id?: number | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: number
          instructor?: string | null
          room?: string | null
          start_time?: string
          template_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_schedule_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "class_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_book_dropin: {
        Args: { p_amount_due: number; p_class_id: number; p_user_id: string }
        Returns: number
      }
      admin_book_package: {
        Args: { p_class_id: number; p_user_id: string }
        Returns: number
      }
      book_dropin: {
        Args: { p_amount_due: number; p_class_id: number }
        Returns: number
      }
      book_with_package: { Args: { p_class_id: number }; Returns: number }
      cancel_booking: { Args: { p_booking_id: number }; Returns: undefined }
      generate_monthly_schedule: {
        Args: { target_month: number; target_year: number }
        Returns: undefined
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_monthly_financials: {
        Args: { month_input: number; year_input: number }
        Returns: Json
      }
      get_monthly_report_stats: {
        Args: { target_month: number; target_year: number }
        Returns: Json
      }
      get_setting_bool: {
        Args: { p_default: boolean; p_key: string }
        Returns: boolean
      }
      get_setting_int: {
        Args: { p_default: number; p_key: string }
        Returns: number
      }
      get_yearly_report_stats: { Args: { target_year: number }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      record_dropin_payment: {
        Args: {
          p_amount: number
          p_booking_id: number
          p_evidence_url?: string
          p_method: Database["public"]["Enums"]["payment_method"]
          p_note?: string
        }
        Returns: number
      }
    }
    Enums: {
      booking_kind: "package" | "dropin"
      booking_status: "booked" | "cancelled" | "attended" | "no_show"
      package_type: "credit" | "unlimited"
      payment_log_status: "recorded" | "void" | "refunded"
      payment_method: "cash" | "bank_transfer" | "promptpay" | "card" | "other"
      payment_status: "unpaid" | "partial" | "paid" | "waived" | "refunded"
      role_type: "member" | "admin" | "instructor"
      user_package_status:
        | "pending_activation"
        | "active"
        | "expired"
        | "used_up"
        | "revoked"
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
      booking_kind: ["package", "dropin"],
      booking_status: ["booked", "cancelled", "attended", "no_show"],
      package_type: ["credit", "unlimited"],
      payment_log_status: ["recorded", "void", "refunded"],
      payment_method: ["cash", "bank_transfer", "promptpay", "card", "other"],
      payment_status: ["unpaid", "partial", "paid", "waived", "refunded"],
      role_type: ["member", "admin", "instructor"],
      user_package_status: [
        "pending_activation",
        "active",
        "expired",
        "used_up",
        "revoked",
      ],
    },
  },
} as const

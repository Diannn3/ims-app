export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      academic_dates: {
        Row: {
          category: string | null
          ends_on: string | null
          id: string
          official_url: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          source_id: string | null
          starts_on: string
          term_id: string | null
          title: string
        }
        Insert: {
          category?: string | null
          ends_on?: string | null
          id?: string
          official_url?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          starts_on: string
          term_id?: string | null
          title: string
        }
        Update: {
          category?: string | null
          ends_on?: string | null
          id?: string
          official_url?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          starts_on?: string
          term_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_dates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_dates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_dates_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_dates_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_events: {
        Row: {
          description: string | null
          ends_at: string | null
          id: string
          official_url: string | null
          organizer: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id: string | null
          space_id: string | null
          starts_at: string
          title: string
        }
        Insert: {
          description?: string | null
          ends_at?: string | null
          id?: string
          official_url?: string | null
          organizer?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id?: string | null
          space_id?: string | null
          starts_at: string
          title: string
        }
        Update: {
          description?: string | null
          ends_at?: string | null
          id?: string
          official_url?: string | null
          organizer?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          slug?: string
          source_id?: string | null
          space_id?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_events_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_events_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_resources: {
        Row: {
          category: string
          description: string | null
          id: string
          last_checked_at: string | null
          official_url: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id: string | null
          title: string
        }
        Insert: {
          category: string
          description?: string | null
          id?: string
          last_checked_at?: string | null
          official_url: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id?: string | null
          title: string
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          last_checked_at?: string | null
          official_url?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          slug?: string
          source_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_resources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_resources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_services: {
        Row: {
          description: string | null
          id: string
          last_verified_at: string | null
          name: string
          official_url: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id: string | null
          space_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          last_verified_at?: string | null
          name: string
          official_url?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id?: string | null
          space_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          last_verified_at?: string | null
          name?: string
          official_url?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          slug?: string
          source_id?: string | null
          space_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_services_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_services_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_services_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_services_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_terms: {
        Row: {
          academic_year: string
          ends_on: string | null
          id: string
          is_current: boolean
          source_id: string | null
          starts_on: string | null
          term_name: string
        }
        Insert: {
          academic_year: string
          ends_on?: string | null
          id: string
          is_current?: boolean
          source_id?: string | null
          starts_on?: string | null
          term_name: string
        }
        Update: {
          academic_year?: string
          ends_on?: string | null
          id?: string
          is_current?: boolean
          source_id?: string | null
          starts_on?: string | null
          term_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_terms_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_terms_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          created_at: string
          id: string
          last_verified_at: string | null
          name: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          short_name: string | null
          source_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          last_verified_at?: string | null
          name: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          short_name?: string | null
          source_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_verified_at?: string | null
          name?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          short_name?: string | null
          source_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_hours: {
        Row: {
          appointment_url: string | null
          ends_at: string | null
          faculty_id: string
          id: string
          last_verified_at: string | null
          mode: Database["public"]["Enums"]["consultation_mode"]
          notes: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          source_id: string | null
          source_record_id: string | null
          space_id: string | null
          starts_at: string | null
          term_id: string
          weekday: number | null
        }
        Insert: {
          appointment_url?: string | null
          ends_at?: string | null
          faculty_id: string
          id?: string
          last_verified_at?: string | null
          mode: Database["public"]["Enums"]["consultation_mode"]
          notes?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          source_record_id?: string | null
          space_id?: string | null
          starts_at?: string | null
          term_id: string
          weekday?: number | null
        }
        Update: {
          appointment_url?: string | null
          ends_at?: string | null
          faculty_id?: string
          id?: string
          last_verified_at?: string | null
          mode?: Database["public"]["Enums"]["consultation_mode"]
          notes?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          source_record_id?: string | null
          space_id?: string | null
          starts_at?: string | null
          term_id?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_hours_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      correction_reports: {
        Row: {
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          report_type: string
          reporter_user_id: string | null
          resolution_notes: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          report_type: string
          reporter_user_id?: string | null
          resolution_notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          report_type?: string
          reporter_user_id?: string | null
          resolution_notes?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "correction_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "correction_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_aliases: {
        Row: {
          alias: string
          course_id: string
          id: number
          normalized_alias: string
        }
        Insert: {
          alias: string
          course_id: string
          id?: never
          normalized_alias: string
        }
        Update: {
          alias?: string
          course_id?: string
          id?: never
          normalized_alias?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_aliases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_aliases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "public_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_prerequisites: {
        Row: {
          course_id: string
          notes: string | null
          prerequisite_course_id: string
          relationship_type: string
          source_id: string | null
        }
        Insert: {
          course_id: string
          notes?: string | null
          prerequisite_course_id: string
          relationship_type?: string
          source_id?: string | null
        }
        Update: {
          course_id?: string
          notes?: string | null
          prerequisite_course_id?: string
          relationship_type?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "public_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "public_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          last_verified_at: string | null
          normalized_code: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          source_id: string | null
          title: string | null
          units: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          last_verified_at?: string | null
          normalized_code: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          title?: string | null
          units?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          last_verified_at?: string | null
          normalized_code?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          title?: string | null
          units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          authority: string | null
          created_at: string
          id: string
          label: string
          notes: string | null
          public_metadata: boolean
          source_type: string
          source_url: string | null
        }
        Insert: {
          authority?: string | null
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          public_metadata?: boolean
          source_type: string
          source_url?: string | null
        }
        Update: {
          authority?: string | null
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          public_metadata?: boolean
          source_type?: string
          source_url?: string | null
        }
        Relationships: []
      }
      faculty: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          id: string
          last_verified_at: string | null
          official_email: string | null
          official_profile_url: string | null
          photo_url: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          publications_url: string | null
          review_status: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          last_verified_at?: string | null
          official_email?: string | null
          official_profile_url?: string | null
          photo_url?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          publications_url?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          last_verified_at?: string | null
          official_email?: string | null
          official_profile_url?: string | null
          photo_url?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          publications_url?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          slug?: string
          source_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      faculty_notices: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          faculty_id: string
          id: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          starts_at: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          faculty_id: string
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          starts_at?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          faculty_id?: string
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "faculty_notices_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_notices_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_offices: {
        Row: {
          faculty_id: string
          id: string
          is_primary: boolean
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          source_id: string | null
          source_record_id: string | null
          space_id: string
          term_id: string | null
        }
        Insert: {
          faculty_id: string
          id?: string
          is_primary?: boolean
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          source_record_id?: string | null
          space_id: string
          term_id?: string | null
        }
        Update: {
          faculty_id?: string
          id?: string
          is_primary?: boolean
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          source_record_id?: string | null
          space_id?: string
          term_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_offices_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_research_areas: {
        Row: {
          faculty_id: string
          research_area_id: string
          source_id: string | null
        }
        Insert: {
          faculty_id: string
          research_area_id: string
          source_id?: string | null
        }
        Update: {
          faculty_id?: string
          research_area_id?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_research_areas_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_research_areas_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_research_areas_research_area_id_fkey"
            columns: ["research_area_id"]
            isOneToOne: false
            referencedRelation: "public_research_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_research_areas_research_area_id_fkey"
            columns: ["research_area_id"]
            isOneToOne: false
            referencedRelation: "research_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_research_areas_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_research_areas_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_section_assignment_sources: {
        Row: {
          assignment_role: string
          created_at: string
          faculty_id: string
          section_id: string
          source_record_id: string
        }
        Insert: {
          assignment_role: string
          created_at?: string
          faculty_id: string
          section_id: string
          source_record_id: string
        }
        Update: {
          assignment_role?: string
          created_at?: string
          faculty_id?: string
          section_id?: string
          source_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faculty_section_assignment_so_faculty_id_section_id_assign_fkey"
            columns: ["faculty_id", "section_id", "assignment_role"]
            isOneToOne: false
            referencedRelation: "faculty_section_assignments"
            referencedColumns: ["faculty_id", "section_id", "assignment_role"]
          },
          {
            foreignKeyName: "faculty_section_assignment_so_faculty_id_section_id_assign_fkey"
            columns: ["faculty_id", "section_id", "assignment_role"]
            isOneToOne: false
            referencedRelation: "public_faculty_section_assignments"
            referencedColumns: ["faculty_id", "section_id", "assignment_role"]
          },
          {
            foreignKeyName: "faculty_section_assignment_sources_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      faculty_section_assignments: {
        Row: {
          assignment_role: string
          faculty_id: string
          import_managed: boolean
          section_id: string
          source_id: string | null
          source_record_id: string | null
        }
        Insert: {
          assignment_role?: string
          faculty_id: string
          import_managed?: boolean
          section_id: string
          source_id?: string | null
          source_record_id?: string | null
        }
        Update: {
          assignment_role?: string
          faculty_id?: string
          import_managed?: boolean
          section_id?: string
          source_id?: string | null
          source_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_section_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_section_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_section_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "public_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_section_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_section_assignments_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_section_assignments_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_section_assignments_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          building_id: string
          display_order: number
          id: string
          level: number
          name: string
        }
        Insert: {
          building_id: string
          display_order?: number
          id: string
          level: number
          name: string
        }
        Update: {
          building_id?: string
          display_order?: number
          id?: string
          level?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          applied_at: string | null
          authoritative_snapshot: boolean
          created_at: string
          error_count: number
          filename: string | null
          id: string
          imported_by: string | null
          preview_hash: string | null
          row_count: number
          schema_version: number
          source_id: string | null
          staging_integrity_version: number
          status: string
          summary: Json
          term_id: string | null
          updated_at: string
          valid_row_count: number
          warning_count: number
        }
        Insert: {
          applied_at?: string | null
          authoritative_snapshot?: boolean
          created_at?: string
          error_count?: number
          filename?: string | null
          id?: string
          imported_by?: string | null
          preview_hash?: string | null
          row_count?: number
          schema_version?: number
          source_id?: string | null
          staging_integrity_version?: number
          status?: string
          summary?: Json
          term_id?: string | null
          updated_at?: string
          valid_row_count?: number
          warning_count?: number
        }
        Update: {
          applied_at?: string | null
          authoritative_snapshot?: boolean
          created_at?: string
          error_count?: number
          filename?: string | null
          id?: string
          imported_by?: string | null
          preview_hash?: string | null
          row_count?: number
          schema_version?: number
          source_id?: string | null
          staging_integrity_version?: number
          status?: string
          summary?: Json
          term_id?: string | null
          updated_at?: string
          valid_row_count?: number
          warning_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "import_batches_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_batches_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      import_issues: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          error_code: string
          field: string | null
          id: string
          import_row_id: string
          issue_type: string
          message: string
          normalized_value: string | null
          original_value: string | null
          suggested_value: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          error_code: string
          field?: string | null
          id?: string
          import_row_id: string
          issue_type: string
          message: string
          normalized_value?: string | null
          original_value?: string | null
          suggested_value?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          error_code?: string
          field?: string | null
          id?: string
          import_row_id?: string
          issue_type?: string
          message?: string
          normalized_value?: string | null
          original_value?: string | null
          suggested_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_issues_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "import_issues_import_row_id_fkey"
            columns: ["import_row_id"]
            isOneToOne: false
            referencedRelation: "import_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rows: {
        Row: {
          batch_id: string
          content_hash: string | null
          created_at: string
          entity_type: string
          id: string
          normalized_payload: Json | null
          raw_payload: Json
          row_number: number
          source_record_key: string | null
          status: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          content_hash?: string | null
          created_at?: string
          entity_type?: string
          id?: string
          normalized_payload?: Json | null
          raw_payload: Json
          row_number: number
          source_record_key?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          content_hash?: string | null
          created_at?: string
          entity_type?: string
          id?: string
          normalized_payload?: Json | null
          raw_payload?: Json
          row_number?: number
          source_record_key?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      location_anchors: {
        Row: {
          building_id: string
          created_at: string
          floor_id: string
          graph_node_id: string
          id: string
          label: string
          last_verified_at: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          qr_slug: string
          review_status: Database["public"]["Enums"]["review_status"]
          space_id: string | null
        }
        Insert: {
          building_id: string
          created_at?: string
          floor_id: string
          graph_node_id: string
          id: string
          label: string
          last_verified_at?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          qr_slug: string
          review_status?: Database["public"]["Enums"]["review_status"]
          space_id?: string | null
        }
        Update: {
          building_id?: string
          created_at?: string
          floor_id?: string
          graph_node_id?: string
          id?: string
          label?: string
          last_verified_at?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          qr_slug?: string
          review_status?: Database["public"]["Enums"]["review_status"]
          space_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_anchors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_floor_building_fkey"
            columns: ["floor_id", "building_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id", "building_id"]
          },
          {
            foreignKeyName: "location_anchors_floor_building_fkey"
            columns: ["floor_id", "building_id"]
            isOneToOne: false
            referencedRelation: "public_floors"
            referencedColumns: ["id", "building_id"]
          },
          {
            foreignKeyName: "location_anchors_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "public_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      map_publish_snapshots: {
        Row: {
          approved_at: string
          approved_by: string
          canonical_revision: string
          created_at: string
          id: string
          payload: Json
          session_id: string
        }
        Insert: {
          approved_at?: string
          approved_by: string
          canonical_revision: string
          created_at?: string
          id?: string
          payload: Json
          session_id: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          canonical_revision?: string
          created_at?: string
          id?: string
          payload?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_publish_snapshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "map_verification_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      map_verification_changes: {
        Row: {
          after_value: Json
          before_value: Json
          change_kind: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          session_id: string
        }
        Insert: {
          after_value: Json
          before_value: Json
          change_kind?: string
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          session_id: string
        }
        Update: {
          after_value?: Json
          before_value?: Json
          change_kind?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_verification_changes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "map_verification_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      map_verification_evidence: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          metadata: Json
          session_id: string
          storage_path: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by: string
          id?: string
          kind: string
          metadata?: Json
          session_id: string
          storage_path?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          metadata?: Json
          session_id?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "map_verification_evidence_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "map_verification_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      map_verification_sessions: {
        Row: {
          assigned_to: string | null
          base_revision: string
          building_id: string
          checklist: Json
          created_at: string
          created_by: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scope: string
          status: string
          submitted_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          base_revision: string
          building_id: string
          checklist?: Json
          created_at?: string
          created_by: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope?: string
          status?: string
          submitted_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          base_revision?: string
          building_id?: string
          checklist?: Json
          created_at?: string
          created_by?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope?: string
          status?: string
          submitted_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_verification_sessions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_verification_sessions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_areas: {
        Row: {
          description: string | null
          id: string
          name: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          slug: string
          source_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          slug?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_areas_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_areas_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      route_restrictions: {
        Row: {
          active: boolean
          building_id: string
          created_at: string
          created_by: string | null
          edge_from: string
          edge_to: string
          ends_at: string | null
          id: string
          reason: string
          source_id: string | null
          starts_at: string | null
        }
        Insert: {
          active?: boolean
          building_id: string
          created_at?: string
          created_by?: string | null
          edge_from: string
          edge_to: string
          ends_at?: string | null
          id?: string
          reason: string
          source_id?: string | null
          starts_at?: string | null
        }
        Update: {
          active?: boolean
          building_id?: string
          created_at?: string
          created_by?: string | null
          edge_from?: string
          edge_to?: string
          ends_at?: string | null
          id?: string
          reason?: string
          source_id?: string | null
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_restrictions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_restrictions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_restrictions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "route_restrictions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_restrictions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_review_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          note: string | null
          section_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          section_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_review_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "schedule_review_events_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "public_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_review_events_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      section_meetings: {
        Row: {
          ends_at: string
          id: string
          notes: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          section_id: string
          source_id: string | null
          source_record_id: string | null
          space_id: string | null
          starts_at: string
          weekday: number
        }
        Insert: {
          ends_at: string
          id?: string
          notes?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          section_id: string
          source_id?: string | null
          source_record_id?: string | null
          space_id?: string | null
          starts_at: string
          weekday: number
        }
        Update: {
          ends_at?: string
          id?: string
          notes?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          section_id?: string
          source_id?: string | null
          source_record_id?: string | null
          space_id?: string | null
          starts_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "section_meetings_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "public_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_meetings_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_meetings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_meetings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_meetings_source_record_id_fkey"
            columns: ["source_record_id"]
            isOneToOne: false
            referencedRelation: "source_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_meetings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_meetings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          course_id: string
          created_at: string
          id: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          section_code: string
          source_id: string | null
          term_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          section_code: string
          source_id?: string | null
          term_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          section_code?: string
          source_id?: string | null
          term_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "public_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      source_records: {
        Row: {
          content_hash: string
          entity_type: string
          id: string
          import_batch_id: string | null
          last_applied_at: string
          source_id: string
          source_record_key: string
          source_updated_at: string | null
          term_id: string | null
        }
        Insert: {
          content_hash: string
          entity_type: string
          id?: string
          import_batch_id?: string | null
          last_applied_at?: string
          source_id: string
          source_record_key: string
          source_updated_at?: string | null
          term_id?: string | null
        }
        Update: {
          content_hash?: string
          entity_type?: string
          id?: string
          import_batch_id?: string | null
          last_applied_at?: string
          source_id?: string
          source_record_key?: string
          source_updated_at?: string | null
          term_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_records_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_records_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_records_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_records_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      space_aliases: {
        Row: {
          alias: string
          id: number
          normalized_alias: string
          space_id: string
        }
        Insert: {
          alias: string
          id?: never
          normalized_alias: string
          space_id: string
        }
        Update: {
          alias?: string
          id?: never
          normalized_alias?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_aliases_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_aliases_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          building_id: string
          created_at: string
          floor_id: string
          id: string
          is_public: boolean
          kind: string
          last_verified_at: string | null
          metadata: Json
          name: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          review_status: Database["public"]["Enums"]["review_status"]
          source_id: string | null
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          building_id: string
          created_at?: string
          floor_id: string
          id: string
          is_public?: boolean
          kind: string
          last_verified_at?: string | null
          metadata?: Json
          name: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          building_id?: string
          created_at?: string
          floor_id?: string
          id?: string
          is_public?: boolean
          kind?: string
          last_verified_at?: string | null
          metadata?: Json
          name?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          review_status?: Database["public"]["Enums"]["review_status"]
          source_id?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_floor_building_fkey"
            columns: ["floor_id", "building_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id", "building_id"]
          },
          {
            foreignKeyName: "spaces_floor_building_fkey"
            columns: ["floor_id", "building_id"]
            isOneToOne: false
            referencedRelation: "public_floors"
            referencedColumns: ["id", "building_id"]
          },
          {
            foreignKeyName: "spaces_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "public_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "public_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_academic_dates: {
        Row: {
          category: string | null
          ends_on: string | null
          id: string | null
          official_url: string | null
          source_id: string | null
          starts_on: string | null
          term_id: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_dates_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_dates_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      public_academic_events: {
        Row: {
          description: string | null
          ends_at: string | null
          id: string | null
          official_url: string | null
          organizer: string | null
          slug: string | null
          source_id: string | null
          space_id: string | null
          starts_at: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      public_academic_resources: {
        Row: {
          category: string | null
          description: string | null
          id: string | null
          last_checked_at: string | null
          official_url: string | null
          slug: string | null
          source_id: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string | null
          last_checked_at?: string | null
          official_url?: string | null
          slug?: string | null
          source_id?: never
          title?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string | null
          last_checked_at?: string | null
          official_url?: string | null
          slug?: string | null
          source_id?: never
          title?: string | null
        }
        Relationships: []
      }
      public_academic_services: {
        Row: {
          description: string | null
          id: string | null
          last_verified_at: string | null
          name: string | null
          official_url: string | null
          slug: string | null
          source_id: string | null
          space_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_services_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_services_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      public_academic_terms: {
        Row: {
          academic_year: string | null
          ends_on: string | null
          id: string | null
          is_current: boolean | null
          starts_on: string | null
          term_name: string | null
        }
        Insert: {
          academic_year?: string | null
          ends_on?: string | null
          id?: string | null
          is_current?: boolean | null
          starts_on?: string | null
          term_name?: string | null
        }
        Update: {
          academic_year?: string | null
          ends_on?: string | null
          id?: string | null
          is_current?: boolean | null
          starts_on?: string | null
          term_name?: string | null
        }
        Relationships: []
      }
      public_buildings: {
        Row: {
          id: string | null
          last_verified_at: string | null
          name: string | null
          short_name: string | null
        }
        Insert: {
          id?: string | null
          last_verified_at?: string | null
          name?: string | null
          short_name?: string | null
        }
        Update: {
          id?: string | null
          last_verified_at?: string | null
          name?: string | null
          short_name?: string | null
        }
        Relationships: []
      }
      public_consultation_hours: {
        Row: {
          appointment_url: string | null
          ends_at: string | null
          faculty_id: string | null
          id: string | null
          last_verified_at: string | null
          mode: Database["public"]["Enums"]["consultation_mode"] | null
          notes: string | null
          source_id: string | null
          space_id: string | null
          starts_at: string | null
          term_id: string | null
          weekday: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_hours_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_hours_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      public_course_aliases: {
        Row: {
          alias: string | null
          course_id: string | null
          id: number | null
          normalized_alias: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_aliases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_aliases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "public_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      public_course_prerequisites: {
        Row: {
          course_id: string | null
          notes: string | null
          prerequisite_course_id: string | null
          relationship_type: string | null
          source_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "public_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "public_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      public_courses: {
        Row: {
          code: string | null
          description: string | null
          id: string | null
          last_verified_at: string | null
          normalized_code: string | null
          source_id: string | null
          title: string | null
          units: number | null
        }
        Insert: {
          code?: string | null
          description?: string | null
          id?: string | null
          last_verified_at?: string | null
          normalized_code?: string | null
          source_id?: never
          title?: string | null
          units?: number | null
        }
        Update: {
          code?: string | null
          description?: string | null
          id?: string | null
          last_verified_at?: string | null
          normalized_code?: string | null
          source_id?: never
          title?: string | null
          units?: number | null
        }
        Relationships: []
      }
      public_data_sources: {
        Row: {
          authority: string | null
          created_at: string | null
          id: string | null
          label: string | null
          source_type: string | null
          source_url: string | null
        }
        Insert: {
          authority?: string | null
          created_at?: string | null
          id?: string | null
          label?: string | null
          source_type?: string | null
          source_url?: string | null
        }
        Update: {
          authority?: string | null
          created_at?: string | null
          id?: string | null
          label?: string | null
          source_type?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      public_faculty: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          last_verified_at: string | null
          official_email: string | null
          official_profile_url: string | null
          photo_url: string | null
          publications_url: string | null
          slug: string | null
          source_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          last_verified_at?: string | null
          official_email?: string | null
          official_profile_url?: string | null
          photo_url?: string | null
          publications_url?: string | null
          slug?: string | null
          source_id?: never
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          last_verified_at?: string | null
          official_email?: string | null
          official_profile_url?: string | null
          photo_url?: string | null
          publications_url?: string | null
          slug?: string | null
          source_id?: never
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_faculty_notices: {
        Row: {
          body: string | null
          created_at: string | null
          ends_at: string | null
          faculty_id: string | null
          id: string | null
          starts_at: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_notices_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_notices_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
        ]
      }
      public_faculty_offices: {
        Row: {
          faculty_id: string | null
          id: string | null
          is_primary: boolean | null
          space_id: string | null
          term_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_offices_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_offices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      public_faculty_research_areas: {
        Row: {
          faculty_id: string | null
          research_area_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_research_areas_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_research_areas_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_research_areas_research_area_id_fkey"
            columns: ["research_area_id"]
            isOneToOne: false
            referencedRelation: "public_research_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_research_areas_research_area_id_fkey"
            columns: ["research_area_id"]
            isOneToOne: false
            referencedRelation: "research_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      public_faculty_section_assignments: {
        Row: {
          assignment_role: string | null
          faculty_id: string | null
          section_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculty_section_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_section_assignments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "public_faculty"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_section_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "public_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faculty_section_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      public_floors: {
        Row: {
          building_id: string | null
          display_order: number | null
          id: string | null
          level: number | null
          name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      public_location_anchors: {
        Row: {
          building_id: string | null
          floor_id: string | null
          graph_node_id: string | null
          id: string | null
          label: string | null
          last_verified_at: string | null
          qr_slug: string | null
          space_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_anchors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_floor_building_fkey"
            columns: ["floor_id", "building_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id", "building_id"]
          },
          {
            foreignKeyName: "location_anchors_floor_building_fkey"
            columns: ["floor_id", "building_id"]
            isOneToOne: false
            referencedRelation: "public_floors"
            referencedColumns: ["id", "building_id"]
          },
          {
            foreignKeyName: "location_anchors_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "public_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_anchors_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      public_research_areas: {
        Row: {
          description: string | null
          id: string | null
          name: string | null
          slug: string | null
          source_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          source_id?: never
        }
        Update: {
          description?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
          source_id?: never
        }
        Relationships: []
      }
      public_route_restrictions: {
        Row: {
          active: boolean | null
          building_id: string | null
          created_at: string | null
          edge_from: string | null
          edge_to: string | null
          ends_at: string | null
          id: string | null
          reason: string | null
          starts_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_restrictions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_restrictions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      public_section_meetings: {
        Row: {
          ends_at: string | null
          id: string | null
          notes: string | null
          section_id: string | null
          space_id: string | null
          starts_at: string | null
          weekday: number | null
        }
        Relationships: [
          {
            foreignKeyName: "section_meetings_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "public_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_meetings_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_meetings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "section_meetings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      public_sections: {
        Row: {
          course_id: string | null
          id: string | null
          section_code: string | null
          source_id: string | null
          term_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "public_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "public_academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      public_space_aliases: {
        Row: {
          alias: string | null
          id: number | null
          normalized_alias: string | null
          space_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_aliases_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "public_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_aliases_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      public_spaces: {
        Row: {
          building_id: string | null
          floor_id: string | null
          id: string | null
          is_public: boolean | null
          kind: string | null
          last_verified_at: string | null
          name: string | null
          source_id: string | null
          subtitle: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spaces_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "public_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_floor_building_fkey"
            columns: ["floor_id", "building_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id", "building_id"]
          },
          {
            foreignKeyName: "spaces_floor_building_fkey"
            columns: ["floor_id", "building_id"]
            isOneToOne: false
            referencedRelation: "public_floors"
            referencedColumns: ["id", "building_id"]
          },
          {
            foreignKeyName: "spaces_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "public_floors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_map_verification_evidence: {
        Args: {
          p_caption?: string
          p_kind: string
          p_metadata?: Json
          p_session_id: string
          p_storage_path?: string
        }
        Returns: string
      }
      apply_import_batch: {
        Args: { p_batch_id: string; p_preview_hash: string }
        Returns: Json
      }
      approve_map_verification_session: {
        Args: {
          p_canonical_revision: string
          p_session_id: string
          p_snapshot: Json
        }
        Returns: string
      }
      create_map_verification_session: {
        Args: {
          p_base_revision: string
          p_building_id: string
          p_scope?: string
          p_title?: string
        }
        Returns: string
      }
      rebase_map_verification_session: {
        Args: {
          p_current_entities: Json
          p_current_revision: string
          p_session_id: string
        }
        Returns: undefined
      }
      reject_map_verification_session: {
        Args: { p_reason: string; p_session_id: string }
        Returns: undefined
      }
      save_map_verification_session: {
        Args: {
          p_checklist: Json
          p_scope: string
          p_session_id: string
          p_title: string
        }
        Returns: undefined
      }
      set_current_academic_term: {
        Args: { p_term_id: string }
        Returns: undefined
      }
      set_schedule_section_publication: {
        Args: { p_note?: string; p_publish: boolean; p_section_id: string }
        Returns: undefined
      }
      set_schedule_section_review: {
        Args: {
          p_note?: string
          p_section_id: string
          p_status: Database["public"]["Enums"]["review_status"]
        }
        Returns: undefined
      }
      stage_schedule_import_batch: {
        Args: {
          p_authoritative_snapshot?: boolean
          p_filename: string
          p_preview_hash: string
          p_rows: Json
          p_schema_version?: number
          p_source_id: string
          p_term_id: string
        }
        Returns: string
      }
      submit_map_verification_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      upsert_map_verification_change: {
        Args: {
          p_after_value: Json
          p_before_value: Json
          p_change_kind: string
          p_entity_id: string
          p_entity_type: string
          p_session_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "student"
        | "faculty"
        | "content_editor"
        | "map_editor"
        | "admin"
      consultation_mode: "in_person" | "online" | "hybrid" | "by_appointment"
      publication_status:
        | "draft"
        | "needs_verification"
        | "verified"
        | "published"
        | "archived"
      report_status: "open" | "reviewing" | "accepted" | "rejected" | "resolved"
      review_status: "draft" | "needs_verification" | "verified"
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
      app_role: ["student", "faculty", "content_editor", "map_editor", "admin"],
      consultation_mode: ["in_person", "online", "hybrid", "by_appointment"],
      publication_status: [
        "draft",
        "needs_verification",
        "verified",
        "published",
        "archived",
      ],
      report_status: ["open", "reviewing", "accepted", "rejected", "resolved"],
      review_status: ["draft", "needs_verification", "verified"],
    },
  },
} as const


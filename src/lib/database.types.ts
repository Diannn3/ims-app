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
            foreignKeyName: "academic_dates_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
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
        ]
      }
      buildings: {
        Row: {
          created_at: string
          id: string
          last_verified_at: string | null
          name: string
          publication_status: Database["public"]["Enums"]["publication_status"]
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
          source_id: string | null
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
          source_id?: string | null
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
          source_id?: string | null
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
            foreignKeyName: "consultation_hours_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
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
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
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
        ]
      }
      data_sources: {
        Row: {
          authority: string | null
          created_at: string
          id: string
          label: string
          notes: string | null
          source_type: string
          source_url: string | null
        }
        Insert: {
          authority?: string | null
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          source_type: string
          source_url?: string | null
        }
        Update: {
          authority?: string | null
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
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
        ]
      }
      faculty_offices: {
        Row: {
          faculty_id: string
          id: string
          is_primary: boolean
          publication_status: Database["public"]["Enums"]["publication_status"]
          source_id: string | null
          space_id: string
          term_id: string | null
        }
        Insert: {
          faculty_id: string
          id?: string
          is_primary?: boolean
          publication_status?: Database["public"]["Enums"]["publication_status"]
          source_id?: string | null
          space_id: string
          term_id?: string | null
        }
        Update: {
          faculty_id?: string
          id?: string
          is_primary?: boolean
          publication_status?: Database["public"]["Enums"]["publication_status"]
          source_id?: string | null
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
            foreignKeyName: "faculty_offices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
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
        ]
      }
      faculty_section_assignments: {
        Row: {
          assignment_role: string
          faculty_id: string
          section_id: string
          source_id: string | null
        }
        Insert: {
          assignment_role?: string
          faculty_id: string
          section_id: string
          source_id?: string | null
        }
        Update: {
          assignment_role?: string
          faculty_id?: string
          section_id?: string
          source_id?: string | null
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
        ]
      }
      import_batches: {
        Row: {
          applied_at: string | null
          created_at: string
          error_count: number
          id: string
          imported_by: string | null
          row_count: number
          source_id: string | null
          status: string
          summary: Json
          term_id: string | null
          valid_row_count: number
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          error_count?: number
          id?: string
          imported_by?: string | null
          row_count?: number
          source_id?: string | null
          status?: string
          summary?: Json
          term_id?: string | null
          valid_row_count?: number
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          error_count?: number
          id?: string
          imported_by?: string | null
          row_count?: number
          source_id?: string | null
          status?: string
          summary?: Json
          term_id?: string | null
          valid_row_count?: number
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
            foreignKeyName: "import_batches_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      import_issues: {
        Row: {
          created_at: string
          field: string | null
          id: string
          import_row_id: string
          issue_type: string
          message: string
        }
        Insert: {
          created_at?: string
          field?: string | null
          id?: string
          import_row_id: string
          issue_type: string
          message: string
        }
        Update: {
          created_at?: string
          field?: string | null
          id?: string
          import_row_id?: string
          issue_type?: string
          message?: string
        }
        Relationships: [
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
            foreignKeyName: "location_anchors_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
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
          slug: string
          source_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          slug: string
          source_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
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
        ]
      }
      section_meetings: {
        Row: {
          ends_at: string
          id: string
          notes: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          section_id: string
          source_id: string | null
          space_id: string | null
          starts_at: string
          weekday: number
        }
        Insert: {
          ends_at: string
          id?: string
          notes?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          section_id: string
          source_id?: string | null
          space_id?: string | null
          starts_at: string
          weekday: number
        }
        Update: {
          ends_at?: string
          id?: string
          notes?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          section_id?: string
          source_id?: string | null
          space_id?: string | null
          starts_at?: string
          weekday?: number
        }
        Relationships: [
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
            foreignKeyName: "sections_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
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
            foreignKeyName: "spaces_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    },
  },
} as const


import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient | null;
      supabaseConfigured: boolean;
      claims: Record<string, unknown> | null;
      profile: {
        user_id: string;
        display_name: string | null;
        role: 'student' | 'faculty' | 'content_editor' | 'map_editor' | 'admin';
      } | null;
    }
  }
}

export {};

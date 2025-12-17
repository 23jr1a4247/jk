import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          roll_number: string | null;
          mobile_number: string | null;
          profile_picture: string | null;
          role: 'student' | 'admin';
          current_level: number;
          total_xp: number;
          theme_preference: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          roll_number?: string | null;
          mobile_number?: string | null;
          profile_picture?: string | null;
          role?: 'student' | 'admin';
          current_level?: number;
          total_xp?: number;
          theme_preference?: string;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          mobile_number?: string | null;
          profile_picture?: string | null;
          theme_preference?: string;
        };
      };
    };
  };
};

/**
 * lib/supabase.ts
 * Supabase client singleton for both browser and server-side usage.
 * Gracefully returns null if environment variables are not configured
 * so database-backed routes can fail clearly when configuration is missing.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Browser client — used in Client Components and API routes
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; role: 'citizen' | 'admin'; created_at: string };
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          author_name: string;
          title: string;
          description: string;
          category: string;
          status: 'pending' | 'in_progress' | 'completed';
          lat: number | null;
          lng: number | null;
          image_url: string | null;
          created_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          seller_name: string;
          name: string;
          price: number;
          phone_number: string;
          image_url: string | null;
          description: string | null;
          category: string;
          featured: boolean;
        };
      };
      comments: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          category: string;
          status: 'planning' | 'ongoing' | 'completed' | 'paused';
          budget: number;
          spent: number;
          progress: number;
          description: string | null;
          contractor: string | null;
          start_date: string | null;
          end_date: string | null;
          image_url: string | null;
          created_at: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          company: string;
          description: string;
          category: string;
          type: 'full_time' | 'part_time' | 'freelance' | 'volunteer';
          location: string | null;
          deadline: string | null;
          salary_range: string | null;
          requirements: string[] | null;
          phone_number: string | null;
          is_active: boolean;
          created_at: string;
        };
      };
      training_modules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          level: 'Pemula' | 'Menengah' | 'Lanjutan';
          duration_minutes: number;
          image_url: string | null;
          rating: number;
          enrolled: number;
          is_published: boolean;
          created_at: string;
        };
      };
      community_actions: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          date: string | null;
          time: string | null;
          location: string | null;
          max_participants: number;
          current_participants: number;
          status: 'open' | 'full' | 'done';
          image_url: string | null;
          created_at: string;
        };
      };
      articles: {
        Row: {
          id: string;
          title: string;
          excerpt: string | null;
          content: string | null;
          category: string;
          author: string;
          image_url: string | null;
          is_published: boolean;
          created_at: string;
        };
      };
    };
  };
};

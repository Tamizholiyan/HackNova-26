import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ngqgzlcfxfexgpirggi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ncWd6bGNmZnhmZXhncGlyZ2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjYxMjIsImV4cCI6MjEwMjcwMjEyMn0.-qJxb6RYMaELt4KaT38FXiNyws2lzlz4UsOK2hGbscA';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

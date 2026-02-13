import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Database table names
export const TABLES = {
  PROFILES: 'prpsct_profiles',
  CLIENTS: 'prpsct_clients',
  POSTS: 'prpsct_posts',
  COMMENTS: 'prpsct_comments',
  APPROVAL_ACTIONS: 'prpsct_approval_actions',
  ACTIVITY_LOGS: 'prpsct_activity_logs',
  LOOKER_REPORTS: 'prpsct_looker_reports',
};

// Storage buckets
export const STORAGE_BUCKETS = {
  POST_MEDIA: 'post-media',
  AVATARS: 'avatars',
};

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { config } from '../util/config';

// Admin client for server-side operations
export const createAdminSupabaseClient = () => {
  return createClient(config.supabase.url, process.env.SUPABASE_SERVICE_ROLE_KEY || '', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/util/config';
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(config.supabase.url, config.supabase.anonKey);
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/util/config';

export const supabase = createClient(config.supabase.url, config.supabase.anonKey);
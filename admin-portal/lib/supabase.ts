import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from './supabase-env';

export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());

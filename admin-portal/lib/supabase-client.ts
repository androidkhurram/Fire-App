'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from './supabase-env';

let supabaseInstance: SupabaseClient | null = null;

export function createSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;
  supabaseInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  return supabaseInstance;
}

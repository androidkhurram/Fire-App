/**
 * Server-side Supabase client with service role.
 * Bypasses RLS - use only in server components/API routes.
 * Never expose this client to the browser.
 */
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl } from './supabase-env';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

function getServerSupabase() {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side data fetching');
  }
  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseServer = getServerSupabase();

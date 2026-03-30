/**
 * App config — loaded via Babel from `admin-portal/.env.local` when that file exists
 * (same keys as the Next.js admin: NEXT_PUBLIC_SUPABASE_*), otherwise `mobile-app/.env`.
 * Restart Metro after env changes.
 *
 * DEMO MODE: Leave Supabase vars empty; the app uses local storage.
 *
 * ADDRESS AUTOCOMPLETE (add to the same env file you use for Supabase):
 * - Google Places: GOOGLE_PLACES_API_KEY
 * - LocationIQ fallback: LOCATIONIQ_API_KEY
 */
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_URL as _supabaseUrl,
  SUPABASE_ANON_KEY as _supabaseAnonKey,
  GOOGLE_PLACES_API_KEY as _googlePlacesKey,
  LOCATIONIQ_API_KEY as _locationIqKey,
} from '@env';

function pickSupabaseUrl(): string {
  const fromNext =
    NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_URL.length > 10
      ? NEXT_PUBLIC_SUPABASE_URL
      : '';
  if (fromNext) return fromNext;
  return _supabaseUrl ?? '';
}

function pickSupabaseAnonKey(): string {
  const fromNext =
    NEXT_PUBLIC_SUPABASE_ANON_KEY && NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 10
      ? NEXT_PUBLIC_SUPABASE_ANON_KEY
      : '';
  if (fromNext) return fromNext;
  return _supabaseAnonKey ?? '';
}

export const SUPABASE_URL = pickSupabaseUrl();
export const SUPABASE_ANON_KEY = pickSupabaseAnonKey();
export const GOOGLE_PLACES_API_KEY = _googlePlacesKey ?? '';
export const LOCATIONIQ_API_KEY = _locationIqKey ?? '';

export const useAddressAutocomplete = Boolean(
  (GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY.length > 10) ||
    (LOCATIONIQ_API_KEY && LOCATIONIQ_API_KEY.length > 10),
);

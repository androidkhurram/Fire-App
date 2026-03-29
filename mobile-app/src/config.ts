/**
 * App config — secrets come from `mobile-app/.env` (gitignored).
 * Copy `.env.example` to `.env` and set values. Restart Metro after edits.
 *
 * DEMO MODE: Leave Supabase vars empty; the app uses local storage.
 *
 * ADDRESS AUTOCOMPLETE:
 * - Google Places: GOOGLE_PLACES_API_KEY (restrict the key in Google Cloud Console)
 * - LocationIQ fallback: LOCATIONIQ_API_KEY
 */
import {
  SUPABASE_URL as _supabaseUrl,
  SUPABASE_ANON_KEY as _supabaseAnonKey,
  GOOGLE_PLACES_API_KEY as _googlePlacesKey,
  LOCATIONIQ_API_KEY as _locationIqKey,
} from '@env';

export const SUPABASE_URL = _supabaseUrl ?? '';
export const SUPABASE_ANON_KEY = _supabaseAnonKey ?? '';
export const GOOGLE_PLACES_API_KEY = _googlePlacesKey ?? '';
export const LOCATIONIQ_API_KEY = _locationIqKey ?? '';

export const useAddressAutocomplete = Boolean(
  (GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY.length > 10) ||
    (LOCATIONIQ_API_KEY && LOCATIONIQ_API_KEY.length > 10),
);

/**
 * App config - Supabase credentials, address autocomplete
 *
 * DEMO MODE (default): Leave both empty. App works fully with local storage.
 *
 * PRODUCTION: Set your Supabase credentials below, or use react-native-config
 * with .env file for SUPABASE_URL and SUPABASE_ANON_KEY.
 *
 * ADDRESS AUTOCOMPLETE:
 * - Google Places (primary): Set GOOGLE_PLACES_API_KEY (enable Places API in Google Cloud)
 * - LocationIQ (fallback): Set LOCATIONIQ_API_KEY (5k requests/day free at locationiq.com)
 */
// @ts-ignore - process.env may be injected by bundler
const env = typeof process !== 'undefined' ? process.env : {};
export const SUPABASE_URL = (env.SUPABASE_URL as string) ?? 'https://bcgicangqapwetciwlgb.supabase.co';
export const SUPABASE_ANON_KEY = (env.SUPABASE_ANON_KEY as string) ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZ2ljYW5ncWFwd2V0Y2l3bGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzgxNzcsImV4cCI6MjA4OTE1NDE3N30.RLPZDd5d3GiLwTQ6W5sfM3L_wFQgG2igl_JeZ5bxr74';

// For production, use env var GOOGLE_PLACES_API_KEY. Below is for local testing.
export const GOOGLE_PLACES_API_KEY =
  (env.GOOGLE_PLACES_API_KEY as string) ?? 'AIzaSyA-hepVmZA-k7cSzKeqWwWcyDguH3lMSnA';
export const LOCATIONIQ_API_KEY = (env.LOCATIONIQ_API_KEY as string) ?? '';

export const useAddressAutocomplete = Boolean(
  (GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY.length > 10) ||
  (LOCATIONIQ_API_KEY && LOCATIONIQ_API_KEY.length > 10),
);

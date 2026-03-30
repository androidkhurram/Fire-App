declare module '@env' {
  /** Same names as admin-portal (Next.js) when using `admin-portal/.env.local` */
  export const NEXT_PUBLIC_SUPABASE_URL: string | undefined;
  export const NEXT_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
  /** Fallback when using `mobile-app/.env` only */
  export const SUPABASE_URL: string | undefined;
  export const SUPABASE_ANON_KEY: string | undefined;
  export const GOOGLE_PLACES_API_KEY: string | undefined;
  export const LOCATIONIQ_API_KEY: string | undefined;
}

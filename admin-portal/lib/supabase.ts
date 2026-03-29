import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://bcgicangqapwetciwlgb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjZ2ljYW5ncWFwd2V0Y2l3bGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzgxNzcsImV4cCI6MjA4OTE1NDE3N30.RLPZDd5d3GiLwTQ6W5sfM3L_wFQgG2igl_JeZ5bxr74';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

-- Fix infinite recursion in RLS policies
-- Policies that check "SELECT FROM users" cause recursion when evaluating users table RLS.
-- Use SECURITY DEFINER functions to bypass RLS during the check.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

-- Drop and recreate policies that cause recursion
DROP POLICY IF EXISTS "Admins full access on users" ON public.users;
CREATE POLICY "Admins full access on users" ON public.users
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access on customers" ON public.customers;
CREATE POLICY "Admins full access on customers" ON public.customers
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access on inspections" ON public.inspections;
CREATE POLICY "Admins full access on inspections" ON public.inspections
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Technicians view assigned inspections" ON public.inspections;
CREATE POLICY "Technicians view assigned inspections" ON public.inspections
  FOR SELECT USING (
    technician_id = auth.uid() OR public.is_admin()
  );

-- Fix system_field_templates (from migration 008) - only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_field_templates') THEN
    DROP POLICY IF EXISTS "Admins full access on system_field_templates" ON public.system_field_templates;
    CREATE POLICY "Admins full access on system_field_templates" ON public.system_field_templates
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- Fix invoices (from migration 005) - only if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
    DROP POLICY IF EXISTS "Admins full access on invoices" ON public.invoices;
    CREATE POLICY "Admins full access on invoices" ON public.invoices
      FOR ALL USING (public.is_admin());
  END IF;
END $$;

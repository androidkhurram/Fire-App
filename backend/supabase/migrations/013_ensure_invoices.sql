-- Ensure invoices table exists (fix for PGRST205 when Create Invoice fails)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  service_type TEXT CHECK (service_type IN ('installation', 'inspection', 'maintenance')),
  invoice_date DATE DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'invoice', 'check', 'other')),
  payment_status TEXT CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON public.invoices(project_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Admins full access on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Technicians view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Technicians create invoices" ON public.invoices;

-- Create policies (is_admin from migration 011 avoids RLS recursion)
CREATE POLICY "Admins full access on invoices" ON public.invoices
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians view invoices" ON public.invoices
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Technicians create invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

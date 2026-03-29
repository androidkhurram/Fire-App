-- Invoice items: admin-managed catalog (description, price) for line items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_active ON public.invoice_items(active);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on invoice_items" ON public.invoice_items
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians read invoice_items" ON public.invoice_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Invoice line items: per-invoice rows (description, price editable, tax toggle)
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  invoice_item_id UUID REFERENCES public.invoice_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  tax_applied BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on invoice_line_items" ON public.invoice_line_items
  FOR ALL USING (public.is_admin());

CREATE POLICY "Technicians manage invoice_line_items" ON public.invoice_line_items
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

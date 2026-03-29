-- Add inspection_id to invoices for linking
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS inspection_id UUID REFERENCES public.inspections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_inspection ON public.invoices(inspection_id);

-- Technicians can update customers
DROP POLICY IF EXISTS "Technicians update customers" ON public.customers;
CREATE POLICY "Technicians update customers" ON public.customers
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Technicians can update invoices (e.g. pdf_url)
DROP POLICY IF EXISTS "Technicians update invoices" ON public.invoices;
CREATE POLICY "Technicians update invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Storage policies for inspection-photos and invoice-pdfs
-- Allow authenticated users to upload to inspection-photos
DROP POLICY IF EXISTS "Authenticated upload inspection-photos" ON storage.objects;
CREATE POLICY "Authenticated upload inspection-photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'inspection-photos' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated read inspection-photos" ON storage.objects;
CREATE POLICY "Authenticated read inspection-photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'inspection-photos' AND auth.uid() IS NOT NULL
  );

-- Allow authenticated users to upload to invoice-pdfs
DROP POLICY IF EXISTS "Authenticated upload invoice-pdfs" ON storage.objects;
CREATE POLICY "Authenticated upload invoice-pdfs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoice-pdfs' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated read invoice-pdfs" ON storage.objects;
CREATE POLICY "Authenticated read invoice-pdfs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoice-pdfs' AND auth.uid() IS NOT NULL
  );

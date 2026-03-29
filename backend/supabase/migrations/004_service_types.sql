-- Service types: installation, inspection, maintenance
-- Extend inspections table

ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('installation', 'inspection', 'maintenance'));

-- Default existing rows to 'inspection'
UPDATE public.inspections SET service_type = 'inspection' WHERE service_type IS NULL;

-- Add report_url for inspection/maintenance reports
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS report_url TEXT;

-- Add permit fields to inspections (or create permits table - using inspections for simplicity)
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS permit_applied BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS permit_application_date DATE,
  ADD COLUMN IF NOT EXISTS permit_status TEXT CHECK (permit_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS permit_approval_date DATE,
  ADD COLUMN IF NOT EXISTS permit_notes TEXT,
  ADD COLUMN IF NOT EXISTS permit_document_url TEXT,
  ADD COLUMN IF NOT EXISTS inspection_scheduled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS inspection_date DATE,
  ADD COLUMN IF NOT EXISTS inspection_result TEXT CHECK (inspection_result IN ('pass', 'fail', 'needs_repair'));

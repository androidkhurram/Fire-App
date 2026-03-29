-- Add all columns the app expects (safe to run multiple times - uses IF NOT EXISTS)
-- Fixes PGRST204 "Could not find permit_..." and similar errors

-- Service types and permit fields (from 004)
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS report_url TEXT,
  ADD COLUMN IF NOT EXISTS permit_applied BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS permit_application_date DATE,
  ADD COLUMN IF NOT EXISTS permit_status TEXT,
  ADD COLUMN IF NOT EXISTS permit_approval_date DATE,
  ADD COLUMN IF NOT EXISTS permit_notes TEXT,
  ADD COLUMN IF NOT EXISTS permit_document_url TEXT,
  ADD COLUMN IF NOT EXISTS inspection_scheduled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS inspection_date DATE,
  ADD COLUMN IF NOT EXISTS inspection_result TEXT;

-- Systems table (from 009) - only if systems exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'systems') THEN
    ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE;
    ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS brand TEXT;
    ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS model TEXT;
    ALTER TABLE public.systems ADD COLUMN IF NOT EXISTS serial_number TEXT;
    ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES public.systems(id) ON DELETE SET NULL;
  END IF;
END $$;

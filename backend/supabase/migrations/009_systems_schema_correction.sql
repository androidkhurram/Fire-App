-- Systems table correction: systems belong to customer, have brand/model/serial
-- Inspections reference system_id

-- Add new systems table structure (customer-level systems)
-- Keep existing systems table but add customer_id and brand/model/serial if not present
ALTER TABLE public.systems
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS serial_number TEXT;

-- Add system_id to inspections (nullable for backward compatibility)
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES public.systems(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_systems_customer ON public.systems(customer_id);
CREATE INDEX IF NOT EXISTS idx_inspections_system ON public.inspections(system_id);

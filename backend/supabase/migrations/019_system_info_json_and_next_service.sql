-- Store full system info for pre-loading on inspection
-- next_service_date already exists on customers

ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS system_info_json JSONB;

-- Index for efficient lookup of last inspection per customer
CREATE INDEX IF NOT EXISTS idx_inspections_customer_date
  ON public.inspections(customer_id, inspection_date DESC NULLS LAST);

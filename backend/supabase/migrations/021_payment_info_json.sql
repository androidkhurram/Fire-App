-- Store payment info for inspections (for reports and receipts)
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS payment_info_json JSONB;

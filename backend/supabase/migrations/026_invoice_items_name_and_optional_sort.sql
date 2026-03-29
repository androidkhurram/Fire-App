-- Add name column to invoice_items; sort_order remains optional (nullable when empty)
ALTER TABLE public.invoice_items
  ADD COLUMN IF NOT EXISTS name TEXT;

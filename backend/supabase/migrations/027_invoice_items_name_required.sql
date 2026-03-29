-- Make name required: backfill null names with description, then add NOT NULL
UPDATE public.invoice_items SET name = description WHERE name IS NULL OR name = '';
ALTER TABLE public.invoice_items ALTER COLUMN name SET NOT NULL;

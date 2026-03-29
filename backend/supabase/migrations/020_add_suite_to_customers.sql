-- Add optional suite field for business addresses
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS suite TEXT;

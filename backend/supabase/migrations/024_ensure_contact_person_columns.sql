-- Ensure contact person columns exist on customers (fixes schema cache error)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_person_email TEXT;

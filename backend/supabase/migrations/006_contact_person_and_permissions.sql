-- Contact person fields on customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_person_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_person_email TEXT;

-- Technician permissions on users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS can_create_installation BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS can_create_inspection BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS can_create_invoice BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN DEFAULT TRUE;

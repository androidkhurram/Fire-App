-- System checks (inspection checklist items) - admin-managed, shown in System Checks step
CREATE TABLE IF NOT EXISTS public.system_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default checklist items (same as hardcoded SYSTEM_CHECKS)
INSERT INTO public.system_checks (label, sort_order) VALUES
  ('All appliances properly covered w/correct nozzles', 1),
  ('Nozzles aimed correctly at appliances', 2),
  ('System installed in accordance w/MFG UL listing', 3),
  ('Piping properly supported', 4),
  ('Correct pipe size used', 5),
  ('Pressure gauge in proper range', 6),
  ('Has system has been discharged? report same', 7),
  ('Fusible links in proper position', 8),
  ('Manual pull station accessible', 9),
  ('Gas valve properly installed', 10),
  ('Electrical connections correct', 11),
  ('System tagged and dated', 12),
  ('Replaced fusible links', 13),
  ('Replaced thermal detectors', 14),
  ('Portable extinguishers properly serviced', 15),
  ('Service & Certification tag on system', 16)
ON CONFLICT (label) DO NOTHING;

ALTER TABLE public.system_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on system_checks" ON public.system_checks
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Technicians read system_checks" ON public.system_checks
  FOR SELECT USING (auth.uid() IS NOT NULL);

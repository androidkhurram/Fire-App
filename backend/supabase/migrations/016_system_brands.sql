-- System brands (admin-managed, shown in System Information step)
CREATE TABLE IF NOT EXISTS public.system_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default brands
INSERT INTO public.system_brands (name, sort_order) VALUES
  ('Protex', 1),
  ('PyroChem', 2),
  ('Kidde-range Guard', 3),
  ('Buckeye', 4),
  ('Ansul', 5),
  ('Amerex', 6)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.system_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on system_brands" ON public.system_brands
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Technicians read system_brands" ON public.system_brands
  FOR SELECT USING (auth.uid() IS NOT NULL);

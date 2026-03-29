-- Sub-values (models) per system brand - admin configurable
CREATE TABLE IF NOT EXISTS public.system_brand_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES public.system_brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- Seed default models for existing brands
INSERT INTO public.system_brand_models (brand_id, name, sort_order)
SELECT b.id, m.name, m.ord::int
FROM public.system_brands b
CROSS JOIN (VALUES ('L3000', 1), ('L460', 2), ('L6000', 3), ('L1600', 4)) AS m(name, ord)
ON CONFLICT (brand_id, name) DO NOTHING;

ALTER TABLE public.system_brand_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on system_brand_models" ON public.system_brand_models
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Technicians read system_brand_models" ON public.system_brand_models
  FOR SELECT USING (auth.uid() IS NOT NULL);

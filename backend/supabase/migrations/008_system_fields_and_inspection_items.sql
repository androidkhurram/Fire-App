-- Dynamic system field templates (admin-defined)
CREATE TABLE IF NOT EXISTS public.system_field_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'checkbox', 'dropdown')),
  required BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspection field values (values for dynamic fields per inspection)
CREATE TABLE IF NOT EXISTS public.inspection_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.system_field_templates(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inspection_id, field_id)
);

-- Inspection checklist items
CREATE TABLE IF NOT EXISTS public.inspection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'na')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inspection_field_values_inspection ON public.inspection_field_values(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection ON public.inspection_items(inspection_id);

ALTER TABLE public.system_field_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on system_field_templates" ON public.system_field_templates
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Technicians read system_field_templates" ON public.system_field_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Technicians manage inspection_field_values" ON public.inspection_field_values
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Technicians manage inspection_items" ON public.inspection_items
  FOR ALL USING (auth.uid() IS NOT NULL);

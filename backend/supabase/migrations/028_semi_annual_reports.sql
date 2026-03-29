-- Semi-Annual Inspection Report - dynamic checklist items
CREATE TABLE IF NOT EXISTS public.semi_annual_report_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  special_field_type TEXT CHECK (special_field_type IN ('psi', 'lb', 'old_links', 'mfg_date')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default checklist items (matches PDF 20 items)
INSERT INTO public.semi_annual_report_items (description, sort_order, special_field_type) VALUES
  ('Proper Hood and Duct Protection?', 1, NULL),
  ('Proper Cooking Surface Protection?', 2, NULL),
  ('Pipe/Conduit Secure and Correct?', 3, NULL),
  ('Chemical Cylinder Full?', 4, NULL),
  ('Cylinder Pressure Correct?', 5, 'psi'),
  ('Cartridge Weight Correct?', 6, 'lb'),
  ('System Actuation Tested? (Automatic - Terminal Detector)', 7, NULL),
  ('System Actuation Tested? (Manual - Remote Pull Station)', 8, NULL),
  ('Appliances Shut Down upon System Actuation? (Electrical)', 9, NULL),
  ('Appliances Shut Down upon System Actuation? (Gas Fired)', 10, NULL),
  ('All Appliances Under Exhaust Hood?', 11, NULL),
  ('Fusible Links Changed?', 12, 'old_links'),
  ('Discharge Nozzles Cleaned/Capped?', 13, NULL),
  ('Gas Pilots Relit?', 14, NULL),
  ('Filters have U.L. Listing?', 15, NULL),
  ('Hood & Filters Reasonably Clean?', 16, NULL),
  ('System is OK to Certify?', 17, NULL),
  ('System is Red Tagged?', 18, NULL),
  ('Kitchen Personnel Instructed in System/Portables Operation?', 19, NULL),
  ('40B:C Rated Portable Fire Extinguisher Installed?', 20, 'mfg_date')
ON CONFLICT (description) DO NOTHING;

-- Semi-Annual Reports (saved form data)
CREATE TABLE IF NOT EXISTS public.semi_annual_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_semi_annual_reports_customer ON public.semi_annual_reports(customer_id);
CREATE INDEX IF NOT EXISTS idx_semi_annual_reports_created ON public.semi_annual_reports(created_at DESC);

ALTER TABLE public.semi_annual_report_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semi_annual_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on semi_annual_report_items" ON public.semi_annual_report_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Technicians read semi_annual_report_items" ON public.semi_annual_report_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins full access on semi_annual_reports" ON public.semi_annual_reports
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Technicians manage semi_annual_reports" ON public.semi_annual_reports
  FOR ALL USING (auth.uid() IS NOT NULL);

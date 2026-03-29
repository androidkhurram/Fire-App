-- Fire Inspection & Installation System - Database Schema
-- Run with: supabase db push (or apply via Supabase Dashboard)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'technician')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT,
  business_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  system_type TEXT,
  notes TEXT,
  last_service_date DATE,
  next_service_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  project_name TEXT,
  project_address TEXT,
  technician_id UUID REFERENCES public.users(id),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  start_date DATE,
  completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id),
  technician_id UUID REFERENCES public.users(id),
  inspection_date DATE,
  system_brand TEXT,
  system_model TEXT,
  serial_number TEXT,
  inspection_status TEXT CHECK (inspection_status IN ('pass', 'fail', 'needs_repair')),
  phase TEXT CHECK (phase IN ('site_inspection', 'installation', 'testing', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Systems (detailed system config)
CREATE TABLE public.systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  system_name_modal TEXT,
  system_type TEXT,
  ul300_requirement TEXT,
  cylinder_size TEXT,
  cylinder_location TEXT,
  fuel_shut_off_type TEXT,
  last_hydrostatic_test_date DATE,
  last_recharge_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'invoice')),
  payment_status TEXT CHECK (payment_status IN ('paid', 'pending')),
  date DATE DEFAULT CURRENT_DATE
);

-- Reminders (for cron job tracking)
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT CHECK (channel IN ('sms', 'email')),
  next_service_date DATE
);

-- Indexes for performance
CREATE INDEX idx_customers_next_service ON public.customers(next_service_date);
CREATE INDEX idx_inspections_customer ON public.inspections(customer_id);
CREATE INDEX idx_inspections_technician ON public.inspections(technician_id);
CREATE INDEX idx_photos_inspection ON public.photos(inspection_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admins full access on users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins full access on customers" ON public.customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins full access on inspections" ON public.inspections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Technician: view assigned, create, update (no delete on customers)
CREATE POLICY "Technicians view assigned inspections" ON public.inspections
  FOR SELECT USING (
    technician_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Technicians create inspections" ON public.inspections
  FOR INSERT WITH CHECK (technician_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Technicians update inspections" ON public.inspections
  FOR UPDATE USING (technician_id = auth.uid());

CREATE POLICY "Technicians view customers" ON public.customers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Technicians insert customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

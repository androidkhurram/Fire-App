-- Demo: allow anon read users and payments (for admin panel)
-- Run after 002_demo_access.sql

CREATE POLICY "Demo: anon read users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Demo: anon read payments" ON public.payments
  FOR SELECT USING (true);

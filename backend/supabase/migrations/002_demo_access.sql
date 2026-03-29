-- Demo policies: allow anon read/insert for customers and inspections
-- Use this for demo only. Remove when adding proper auth.
-- Run this AFTER 001_initial_schema.sql

CREATE POLICY "Demo: anon read customers" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Demo: anon insert customers" ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Demo: anon read inspections" ON public.inspections
  FOR SELECT USING (true);

CREATE POLICY "Demo: anon insert inspections" ON public.inspections
  FOR INSERT WITH CHECK (true);

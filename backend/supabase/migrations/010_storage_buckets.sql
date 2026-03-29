-- Create storage buckets for inspection reports and permit documents
-- Buckets: inspection-reports (PDFs), permit-documents (PDFs/images)
-- Create via Supabase Dashboard if this fails: Storage > New Bucket

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('inspection-reports', 'inspection-reports', false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('permit-documents', 'permit-documents', false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

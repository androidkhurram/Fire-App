-- Add inspection-photos and invoice-pdfs storage buckets
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('inspection-photos', 'inspection-photos', false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('invoice-pdfs', 'invoice-pdfs', false);
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

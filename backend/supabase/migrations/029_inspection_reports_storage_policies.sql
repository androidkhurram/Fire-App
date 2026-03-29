-- Storage policies for inspection-reports bucket (used for inspection PDFs and semi-annual report PDFs)
DROP POLICY IF EXISTS "Authenticated upload inspection-reports" ON storage.objects;
CREATE POLICY "Authenticated upload inspection-reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'inspection-reports' AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated read inspection-reports" ON storage.objects;
CREATE POLICY "Authenticated read inspection-reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'inspection-reports' AND auth.uid() IS NOT NULL
  );

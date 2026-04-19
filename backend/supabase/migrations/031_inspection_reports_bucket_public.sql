-- inspection-reports: mobile app stores getPublicUrl() URLs (/object/public/inspection-reports/...).
-- Without the bucket, Supabase returns 404 "Bucket not found". Private bucket + public URL returns 403.
-- This migration ensures the bucket exists and is world-readable like inspection-photos (030).

INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-reports', 'inspection-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read inspection-reports" ON storage.objects;
CREATE POLICY "Public read inspection-reports" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'inspection-reports');

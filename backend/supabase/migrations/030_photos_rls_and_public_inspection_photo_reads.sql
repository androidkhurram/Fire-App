-- photos table had RLS enabled in 001 but no policies, so authenticated inserts from the app were denied.

DROP POLICY IF EXISTS "Authenticated insert photos for inspections" ON public.photos;
CREATE POLICY "Authenticated insert photos for inspections" ON public.photos
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id)
  );

DROP POLICY IF EXISTS "Technicians select photos for visible inspections" ON public.photos;
CREATE POLICY "Technicians select photos for visible inspections" ON public.photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = photos.inspection_id
      AND (
        i.technician_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
      )
    )
  );

-- Allow browser / <img> to load photo URLs without passing Supabase JWT (admin portal detail page).
UPDATE storage.buckets SET public = true WHERE id = 'inspection-photos';

DROP POLICY IF EXISTS "Public read inspection-photos" ON storage.objects;
CREATE POLICY "Public read inspection-photos" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'inspection-photos');

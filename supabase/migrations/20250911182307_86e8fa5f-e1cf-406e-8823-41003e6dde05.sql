-- Criar buckets para fotos
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('checklist-photos', 'checklist-photos', true),
  ('signatures', 'signatures', true);

-- Políticas para bucket checklist-photos
CREATE POLICY "Allow authenticated users to upload photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'checklist-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to view photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'checklist-photos');

CREATE POLICY "Allow authenticated users to update their photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'checklist-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete their photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'checklist-photos' 
  AND auth.role() = 'authenticated'
);

-- Políticas para bucket signatures
CREATE POLICY "Allow authenticated users to upload signatures" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'signatures' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public access to view signatures" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'signatures');

CREATE POLICY "Allow authenticated users to update their signatures" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'signatures' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete their signatures" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'signatures' 
  AND auth.role() = 'authenticated'
);
-- Create storage bucket for checklist PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('checklist-pdfs', 'checklist-pdfs', false);

-- Create storage policies for checklist PDFs
CREATE POLICY "Users can view their company checklist PDFs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'checklist-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT unnest(
      CASE
        WHEN (profiles.unique_id IS NOT NULL) THEN array_append(COALESCE(profiles.company_ids, ARRAY[]::text[]), profiles.unique_id)
        ELSE COALESCE(profiles.company_ids, ARRAY[]::text[])
      END
    ) 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload checklist PDFs to their company folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'checklist-pdfs' AND
  (storage.foldername(name))[1] IN (
    SELECT unnest(
      CASE
        WHEN (profiles.unique_id IS NOT NULL) THEN array_append(COALESCE(profiles.company_ids, ARRAY[]::text[]), profiles.unique_id)
        ELSE COALESCE(profiles.company_ids, ARRAY[]::text[])
      END
    ) 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);
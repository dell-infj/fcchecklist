-- Add new columns to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN fuel_type text,
ADD COLUMN chassis text,
ADD COLUMN renavam text,
ADD COLUMN crv_number text,
ADD COLUMN crlv_pdf_url text,
DROP COLUMN customer_phone;

-- Rename customer_name to owner_unique_id to better reflect its purpose
ALTER TABLE public.vehicles 
RENAME COLUMN customer_name TO owner_unique_id;

-- Create storage bucket for CRLV PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'crlv-pdfs', 
  'crlv-pdfs', 
  false, 
  5242880, -- 5MB limit
  ARRAY['application/pdf']
);

-- Create RLS policies for CRLV PDFs storage
CREATE POLICY "Users can view their own CRLV PDFs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'crlv-pdfs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own CRLV PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'crlv-pdfs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own CRLV PDFs" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'crlv-pdfs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own CRLV PDFs" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'crlv-pdfs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
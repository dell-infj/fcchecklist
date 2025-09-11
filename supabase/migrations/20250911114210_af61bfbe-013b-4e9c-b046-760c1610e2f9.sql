-- Remover políticas existentes que podem estar restritivas
DROP POLICY IF EXISTS "Users can upload checklist PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their checklist PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update checklist PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete checklist PDFs" ON storage.objects;

-- Criar políticas mais flexíveis para o bucket checklist-pdfs
-- Política para permitir inserção de arquivos PDF
CREATE POLICY "Allow authenticated uploads to checklist-pdfs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'checklist-pdfs' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir visualização de PDFs
CREATE POLICY "Allow authenticated access to checklist-pdfs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'checklist-pdfs' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir atualização de PDFs
CREATE POLICY "Allow authenticated updates to checklist-pdfs" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'checklist-pdfs' 
  AND auth.uid() IS NOT NULL
);
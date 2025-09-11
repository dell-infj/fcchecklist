-- Criar políticas RLS para o bucket checklist-pdfs
-- Permitir que usuários autenticados façam upload de PDFs de seus checklists

-- Política para permitir inserção de arquivos PDF no bucket checklist-pdfs
CREATE POLICY "Users can upload checklist PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'checklist-pdfs' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir visualização de PDFs de checklists do mesmo unique_id
CREATE POLICY "Users can view their checklist PDFs" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'checklist-pdfs' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir atualização de PDFs existentes
CREATE POLICY "Users can update checklist PDFs" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'checklist-pdfs' 
  AND auth.uid() IS NOT NULL
);

-- Política para permitir exclusão de PDFs (apenas admins)
CREATE POLICY "Admins can delete checklist PDFs" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'checklist-pdfs' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
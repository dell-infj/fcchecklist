-- Remover política restritiva existente
DROP POLICY IF EXISTS "Users can view checklist items from their unique_id" ON public.checklist_items;

-- Criar nova política que permite todos os usuários autenticados vejam todos os itens de checklist
CREATE POLICY "Authenticated users can view all checklist items" 
ON public.checklist_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Manter a política de admin para modificações
-- (A política "Admins can manage checklist items from their unique_id" já existe e continuará funcionando)
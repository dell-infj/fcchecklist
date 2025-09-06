-- Adicionar coluna para armazenar dados dinâmicos dos itens do checklist
ALTER TABLE public.checklists 
ADD COLUMN checklist_data jsonb DEFAULT '{}'::jsonb;

-- Comentário: Esta coluna irá armazenar todos os dados dos itens do checklist 
-- no formato: {"campo_item": {"status": "funcionando|revisao|ausente", "observation": "texto"}}
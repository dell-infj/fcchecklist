-- Criar tabela para gerenciar itens configuráveis de checklist
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('interior', 'exterior', 'safety', 'mechanical')),
  required BOOLEAN NOT NULL DEFAULT false,
  item_order INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  unique_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_checklist_items_unique_id ON public.checklist_items(unique_id);
CREATE INDEX idx_checklist_items_active ON public.checklist_items(active);
CREATE INDEX idx_checklist_items_order ON public.checklist_items(item_order);

-- Habilitar RLS
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para checklist_items
CREATE POLICY "Users can view checklist items from their unique_id" 
ON public.checklist_items 
FOR SELECT 
USING (unique_id IN ( 
  SELECT unnest(
    CASE
      WHEN (profiles.unique_id IS NOT NULL) THEN array_append(COALESCE(profiles.company_ids, ARRAY[]::text[]), profiles.unique_id)
      ELSE COALESCE(profiles.company_ids, ARRAY[]::text[])
    END) AS unnest
  FROM profiles
  WHERE (profiles.user_id = auth.uid())
));

CREATE POLICY "Admins can manage checklist items from their unique_id" 
ON public.checklist_items 
FOR ALL 
USING (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text) AND ((profiles.unique_id = checklist_items.unique_id) OR (checklist_items.unique_id = ANY (profiles.company_ids))))
))
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'admin'::text) AND ((profiles.unique_id = checklist_items.unique_id) OR (checklist_items.unique_id = ANY (profiles.company_ids))))
));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_checklist_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_checklist_items_updated_at();

-- Inserir itens padrão (será ajustado baseado no unique_id do usuário posteriormente)
INSERT INTO public.checklist_items (name, description, category, required, item_order, unique_id) VALUES
('Todas as luzes internas funcionando', 'Verificar se todas as luzes internas estão funcionando corretamente', 'interior', true, 1, NULL),
('Banco do passageiro', 'Verificar condições do banco do passageiro', 'interior', true, 2, NULL),
('Extintor de incêndio', 'Verificar presença e validade do extintor', 'safety', true, 3, NULL),
('Todas as luzes externas funcionando', 'Verificar luzes externas, faróis, lanternas', 'exterior', true, 4, NULL),
('Fechaduras de todos os armários', 'Testar fechaduras dos compartimentos de carga', 'mechanical', false, 5, NULL),
('Acendedor de cigarro', 'Verificar funcionamento do acendedor', 'interior', false, 6, NULL),
('Câmera funcional', 'Verificar funcionamento da câmera', 'interior', false, 7, NULL),
('Cortinas da cabine', 'Verificar estado das cortinas', 'interior', false, 8, NULL),
('Limpadores de para-brisa', 'Verificar funcionamento dos limpadores', 'exterior', false, 9, NULL),
('Pneus', 'Verificar estado e pressão dos pneus', 'mechanical', true, 10, NULL),
('Correntes', 'Verificar presença e estado das correntes', 'safety', false, 11, NULL),
('Triângulos de segurança', 'Verificar presença dos triângulos', 'safety', true, 12, NULL),
('Óleo do motor', 'Verificar nível do óleo do motor', 'mechanical', true, 13, NULL),
('Água do veículo', 'Verificar nível da água', 'mechanical', true, 14, NULL),
('Bateria', 'Verificar estado da bateria', 'mechanical', true, 15, NULL);
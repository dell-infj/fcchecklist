-- Criar tabela para categorias de veículos personalizadas
CREATE TABLE public.vehicle_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Car',
  active BOOLEAN NOT NULL DEFAULT true,
  unique_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, unique_id)
);

-- Enable RLS
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view vehicle categories from their unique_id"
ON public.vehicle_categories
FOR SELECT
USING (unique_id IN (
  SELECT unnest(
    CASE 
      WHEN profiles.unique_id IS NOT NULL 
      THEN array_append(COALESCE(profiles.company_ids, ARRAY[]::text[]), profiles.unique_id)
      ELSE COALESCE(profiles.company_ids, ARRAY[]::text[])
    END
  )
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Admins can manage vehicle categories from their unique_id"
ON public.vehicle_categories
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin' 
  AND (profiles.unique_id = vehicle_categories.unique_id OR vehicle_categories.unique_id = ANY(profiles.company_ids))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin' 
  AND (profiles.unique_id = vehicle_categories.unique_id OR vehicle_categories.unique_id = ANY(profiles.company_ids))
));

-- Trigger para updated_at
CREATE TRIGGER update_vehicle_categories_updated_at
  BEFORE UPDATE ON public.vehicle_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias padrão para facilitar a migração
INSERT INTO public.vehicle_categories (name, label, icon_name, unique_id) VALUES
('CARRO', 'Veículos Leves (Carro/Moto)', 'Car', 'default'),
('CAMINHAO', 'Caminhão/Caminhão-Munck', 'Truck', 'default'),
('RETROESCAVADEIRA', 'Retroescavadeira', 'Construction', 'default'),
('MOTO', 'Motocicleta', 'Bike', 'default'),
('ESCAVADEIRA', 'Escavadeira', 'HardHat', 'default'),
('ONIBUS', 'Ônibus', 'Bus', 'default');
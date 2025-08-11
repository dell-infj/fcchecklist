-- Primeiro, vamos adicionar a coluna unique_id às tabelas vehicles e checklists
-- para vincular todos os dados ao ID único

-- Adicionar unique_id à tabela vehicles
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS unique_id text;

-- Adicionar unique_id à tabela checklists  
ALTER TABLE public.checklists 
ADD COLUMN IF NOT EXISTS unique_id text;

-- Atualizar veículos existentes para usar o unique_id do administrador
-- (assumindo que existe pelo menos um admin com unique_id)
UPDATE public.vehicles 
SET unique_id = 'FACILITACONSTTRUÇÕES'
WHERE unique_id IS NULL;

-- Atualizar checklists existentes para usar o unique_id
-- vinculando através do inspector_id para o profile do inspetor
UPDATE public.checklists 
SET unique_id = (
  SELECT profiles.unique_id 
  FROM profiles 
  WHERE profiles.id = checklists.inspector_id
)
WHERE unique_id IS NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vehicles_unique_id ON public.vehicles(unique_id);
CREATE INDEX IF NOT EXISTS idx_checklists_unique_id ON public.checklists(unique_id);

-- Atualizar políticas RLS para vehicles
DROP POLICY IF EXISTS "All authenticated users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Only admins can manage vehicles" ON public.vehicles;

-- Nova política para visualização de veículos baseada no unique_id
CREATE POLICY "Users can view vehicles from their unique_id" 
ON public.vehicles 
FOR SELECT 
USING (
  unique_id IN (
    SELECT unnest(
      CASE 
        WHEN profiles.unique_id IS NOT NULL THEN 
          array_append(COALESCE(profiles.company_ids, ARRAY[]::text[]), profiles.unique_id)
        ELSE 
          COALESCE(profiles.company_ids, ARRAY[]::text[])
      END
    )
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);

-- Política para admins gerenciarem veículos do seu unique_id
CREATE POLICY "Admins can manage vehicles from their unique_id" 
ON public.vehicles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
    AND (
      profiles.unique_id = vehicles.unique_id 
      OR vehicles.unique_id = ANY(profiles.company_ids)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
    AND (
      profiles.unique_id = vehicles.unique_id 
      OR vehicles.unique_id = ANY(profiles.company_ids)
    )
  )
);

-- Atualizar políticas RLS para checklists
DROP POLICY IF EXISTS "Admins can manage all checklists" ON public.checklists;
DROP POLICY IF EXISTS "Admins can view all checklists" ON public.checklists;
DROP POLICY IF EXISTS "Inspectors can view their own checklists" ON public.checklists;
DROP POLICY IF EXISTS "Inspectors can insert their own checklists" ON public.checklists;
DROP POLICY IF EXISTS "Inspectors can update their own checklists" ON public.checklists;

-- Nova política para visualização de checklists baseada no unique_id
CREATE POLICY "Users can view checklists from their unique_id" 
ON public.checklists 
FOR SELECT 
USING (
  unique_id IN (
    SELECT unnest(
      CASE 
        WHEN profiles.unique_id IS NOT NULL THEN 
          array_append(COALESCE(profiles.company_ids, ARRAY[]::text[]), profiles.unique_id)
        ELSE 
          COALESCE(profiles.company_ids, ARRAY[]::text[])
      END
    )
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);

-- Política para inspetores criarem checklists
CREATE POLICY "Inspectors can insert checklists" 
ON public.checklists 
FOR INSERT 
WITH CHECK (
  inspector_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
  AND unique_id IN (
    SELECT unnest(
      CASE 
        WHEN profiles.unique_id IS NOT NULL THEN 
          array_append(COALESCE(profiles.company_ids, ARRAY[]::text[]), profiles.unique_id)
        ELSE 
          COALESCE(profiles.company_ids, ARRAY[]::text[])
      END
    )
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);

-- Política para atualização de checklists
CREATE POLICY "Users can update checklists from their unique_id" 
ON public.checklists 
FOR UPDATE 
USING (
  unique_id IN (
    SELECT unnest(
      CASE 
        WHEN profiles.unique_id IS NOT NULL THEN 
          array_append(COALESCE(profiles.company_ids, ARRAY[]::text[]), profiles.unique_id)
        ELSE 
          COALESCE(profiles.company_ids, ARRAY[]::text[])
      END
    )
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
  AND (
    -- Inspetores podem editar seus próprios checklists
    inspector_id IN (
      SELECT profiles.id 
      FROM profiles 
      WHERE profiles.user_id = auth.uid()
    )
    -- OU admins podem editar qualquer checklist do mesmo unique_id
    OR EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
);

-- Política para deletion de checklists (apenas admins)
CREATE POLICY "Admins can delete checklists from their unique_id" 
ON public.checklists 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
    AND (
      profiles.unique_id = checklists.unique_id 
      OR checklists.unique_id = ANY(profiles.company_ids)
    )
  )
);
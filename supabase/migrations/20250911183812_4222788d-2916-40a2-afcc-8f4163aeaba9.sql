-- Criar um unique_id único para coordenadores existentes sem unique_id
UPDATE profiles 
SET unique_id = 'FACILITACONSTRUÇÕES-COORD-' || SUBSTRING(id::text, 1, 8),
    company_ids = ARRAY['FACILITACONSTRUÇÕES']
WHERE id = '170df46d-c7cf-4552-8dab-57187e4aad9c' 
  AND unique_id IS NULL;
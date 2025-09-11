-- Atualizar coordenadores existentes para herdar o unique_id do seu gerenciador
UPDATE profiles 
SET unique_id = parent.unique_id,
    company_ids = parent.company_ids
FROM profiles parent 
WHERE profiles.managed_by = parent.id 
  AND profiles.role = 'admin' 
  AND profiles.unique_id IS NULL;
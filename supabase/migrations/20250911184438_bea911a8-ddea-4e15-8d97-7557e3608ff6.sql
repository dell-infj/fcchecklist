-- Remover a constraint que impede múltiplos admins com mesmo unique_id
-- para permitir coordenadores da mesma empresa
DROP INDEX IF EXISTS idx_profiles_unique_id_admin_unique;
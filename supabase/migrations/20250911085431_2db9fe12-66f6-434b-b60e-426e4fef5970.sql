-- Corrigir inconsistência de case na categoria caminhao_carroceria
UPDATE checklist_items 
SET category = 'CAMINHAO_CARROCERIA' 
WHERE category = 'caminhao_carroceria' AND active = true;
-- Corrigir coordenador existente para seguir as regras de visibilidade
UPDATE public.profiles
SET role = 'coordinator',
    unique_id = 'FACILITACONSTRUÇÕES',
    company_ids = ARRAY['FACILITACONSTRUÇÕES']
WHERE id = '170df46d-c7cf-4552-8dab-57187e4aad9c';
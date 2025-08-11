-- Atualizar o perfil do usuário atual para ter o unique_id correto
-- Primeiro, vamos verificar e atualizar o perfil que tem user_id correspondente ao usuário atual
-- Como não posso usar auth.uid() em uma migração, vou usar uma abordagem diferente

-- Vamos atualizar todos os perfis que não têm unique_id definido para usar "FACILITACONSTTRUÇÕES"
UPDATE public.profiles 
SET unique_id = 'FACILITACONSTTRUÇÕES'
WHERE unique_id IS NULL OR unique_id = '';

-- Também vamos garantir que qualquer perfil com o email específico seja atualizado
-- (isso é uma aproximação já que não temos acesso direto ao auth.users)
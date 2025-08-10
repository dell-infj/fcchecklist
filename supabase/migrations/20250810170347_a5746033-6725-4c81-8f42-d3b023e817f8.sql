-- Verificar se o usuário já tem um profile criado
-- Primeiro, vamos garantir que o usuário tem um profile
INSERT INTO public.profiles (user_id, first_name, last_name, role, company_name, unique_id)
SELECT 
  '4292fdc1-5019-4511-b1e9-09cff7e3bbfd'::uuid,
  'Wendell',
  'Halas', 
  'admin',
  'Facilita Serviços e ConstruçõesLTDA',
  'FACILITACONSTRUÇÕES'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = '4292fdc1-5019-4511-b1e9-09cff7e3bbfd'::uuid
);

-- Temporariamente, vamos simplificar as políticas RLS para debug
DROP POLICY IF EXISTS "Users can select their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin access" ON public.profiles;

-- Política mais simples para permitir acesso
CREATE POLICY "Allow authenticated users to manage profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
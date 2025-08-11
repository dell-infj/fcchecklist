-- Configurar validação de email para aceitar domínios .online
-- Nota: Esta configuração pode precisar ser ajustada no painel do Supabase

-- Criar função personalizada para validar emails incluindo .online
CREATE OR REPLACE FUNCTION public.is_valid_email(email_address text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Validação básica de email que aceita .online
  RETURN email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND (
      email_address ~* '\.(com|org|net|edu|gov|mil|int|online|com\.br|org\.br|net\.br)$'
    );
END;
$$;

-- Atualizar função handle_new_user para incluir validação personalizada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar email customizado (incluindo .online)
  IF NOT public.is_valid_email(NEW.email) THEN
    RAISE EXCEPTION 'Email address format is invalid. Please use a valid domain.';
  END IF;

  INSERT INTO public.profiles (user_id, first_name, last_name, role, company_name, admin_id, unique_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'First'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'inspector'),
    NEW.raw_user_meta_data->>'company_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'admin_unique_id' IS NOT NULL THEN
        (SELECT id FROM public.profiles WHERE unique_id = NEW.raw_user_meta_data->>'admin_unique_id')
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'unique_id'
  );
  RETURN NEW;
END;
$$;

-- Recriar trigger para usar a função atualizada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
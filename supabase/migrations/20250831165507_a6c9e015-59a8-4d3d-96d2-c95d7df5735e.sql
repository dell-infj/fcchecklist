-- Fix the handle_new_user trigger to properly handle inspector creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_profile_id UUID;
BEGIN
  -- Validar email customizado (incluindo .online)
  IF NOT public.is_valid_email(NEW.email) THEN
    RAISE EXCEPTION 'Email address format is invalid. Please use a valid domain.';
  END IF;

  -- Se admin_unique_id foi fornecido, buscar o admin_id
  IF NEW.raw_user_meta_data->>'admin_unique_id' IS NOT NULL THEN
    SELECT id INTO admin_profile_id 
    FROM public.profiles 
    WHERE unique_id = NEW.raw_user_meta_data->>'admin_unique_id' 
    AND role = 'admin'
    LIMIT 1;
  END IF;

  -- Inserir o novo profile
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    role, 
    company_name, 
    admin_id, 
    unique_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'First'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'inspector'),
    NEW.raw_user_meta_data->>'company_name',
    admin_profile_id,
    NEW.raw_user_meta_data->>'unique_id'
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
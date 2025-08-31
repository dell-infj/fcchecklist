-- Fix security issues by setting search_path on all functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_checklist_items_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_data()
 RETURNS TABLE(profile_id uuid, profile_role text, profile_unique_id text, profile_company_ids text[])
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT id, role, unique_id, company_ids 
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_valid_email(email_address text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $$
BEGIN
  -- Validação básica de email que aceita .online
  RETURN email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND (
      email_address ~* '\.(com|org|net|edu|gov|mil|int|online|com\.br|org\.br|net\.br)$'
    );
END;
$$;
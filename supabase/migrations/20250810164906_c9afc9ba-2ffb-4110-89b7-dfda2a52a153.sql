-- Remove policies that are causing infinite recursion
DROP POLICY IF EXISTS "Inspectors can view their admin profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view their inspectors profiles" ON public.profiles;

-- Add unique_id field for admins to share with inspectors
ALTER TABLE public.profiles 
ADD COLUMN unique_id TEXT UNIQUE;

-- Create security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to get current user profile id
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies using security definer functions
CREATE POLICY "Inspectors can view their admin profile" 
ON public.profiles 
FOR SELECT 
USING (
  id = (
    SELECT admin_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view their inspectors profiles" 
ON public.profiles 
FOR SELECT 
USING (admin_id = public.get_current_user_profile_id());

-- Update the handle_new_user function to include unique_id for admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
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
$function$;
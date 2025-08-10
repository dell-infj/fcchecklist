-- Add company_name field for admins and admin_id for inspectors
ALTER TABLE public.profiles 
ADD COLUMN company_name TEXT,
ADD COLUMN admin_id UUID REFERENCES public.profiles(id);

-- Create index for better performance when querying inspectors by admin
CREATE INDEX idx_profiles_admin_id ON public.profiles(admin_id);

-- Update RLS policies to allow inspectors to see their admin's profile and admins to see their inspectors
CREATE POLICY "Inspectors can view their admin profile" 
ON public.profiles 
FOR SELECT 
USING (id IN (
  SELECT admin_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view their inspectors profiles" 
ON public.profiles 
FOR SELECT 
USING (admin_id IN (
  SELECT id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- Update the handle_new_user function to include the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role, company_name, admin_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'First'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'inspector'),
    NEW.raw_user_meta_data->>'company_name',
    (NEW.raw_user_meta_data->>'admin_id')::uuid
  );
  RETURN NEW;
END;
$function$;
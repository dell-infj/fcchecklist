-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update team profiles" ON public.profiles;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_profile_data()
RETURNS TABLE(
  profile_id uuid,
  profile_role text,
  profile_unique_id text,
  profile_company_ids text[]
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id, role, unique_id, company_ids 
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$;

-- Create admin policies using the security definer function
CREATE POLICY "Admins can view team profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile_data() admin_data
    WHERE admin_data.profile_role = 'admin'
    AND (
      profiles.unique_id = admin_data.profile_unique_id
      OR 
      profiles.unique_id = ANY(admin_data.profile_company_ids)
    )
  )
);

CREATE POLICY "Admins can update team profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_profile_data() admin_data
    WHERE admin_data.profile_role = 'admin'
    AND (
      profiles.unique_id = admin_data.profile_unique_id
      OR 
      profiles.unique_id = ANY(admin_data.profile_company_ids)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.get_user_profile_data() admin_data
    WHERE admin_data.profile_role = 'admin'
    AND (
      profiles.unique_id = admin_data.profile_unique_id
      OR 
      profiles.unique_id = ANY(admin_data.profile_company_ids)
    )
  )
);
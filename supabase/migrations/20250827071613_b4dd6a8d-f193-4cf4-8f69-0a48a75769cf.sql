-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow authenticated users to manage profiles" ON public.profiles;

-- Create secure policies that only allow users to access their own data
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view profiles within their company hierarchy
CREATE POLICY "Admins can view team profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin'
    AND (
      -- Admin can see profiles with their unique_id
      profiles.unique_id = admin_profile.unique_id
      OR 
      -- Admin can see profiles from companies they manage
      profiles.unique_id = ANY(admin_profile.company_ids)
    )
  )
);

-- Allow admins to update profiles within their company hierarchy  
CREATE POLICY "Admins can update team profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin'
    AND (
      profiles.unique_id = admin_profile.unique_id
      OR 
      profiles.unique_id = ANY(admin_profile.company_ids)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.role = 'admin'
    AND (
      profiles.unique_id = admin_profile.unique_id
      OR 
      profiles.unique_id = ANY(admin_profile.company_ids)
    )
  )
);
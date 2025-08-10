-- Fix infinite recursion in profiles RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view inspector profiles" ON public.profiles;

-- Create corrected policies without recursion
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view inspector profiles (non-recursive approach)
CREATE POLICY "Admins can view inspector profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  (
    role = 'inspector' 
    AND admin_id IN (
      SELECT id FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  )
);
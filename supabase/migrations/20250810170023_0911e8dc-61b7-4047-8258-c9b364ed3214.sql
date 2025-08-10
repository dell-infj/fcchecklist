-- Remove ALL existing problematic policies and functions
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view inspector profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view their inspectors profiles" ON public.profiles;
DROP POLICY IF EXISTS "Inspectors can view their admin profile" ON public.profiles;

-- Drop existing functions that might cause recursion
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.get_current_user_profile_id();

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE PLPGSQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.get_user_profile_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE PLPGSQL SECURITY DEFINER STABLE;

-- Create simple, non-recursive policies
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.get_user_role() = 'admin');

-- Allow inspectors to view their admin profile
CREATE POLICY "Inspectors can view admin profile"
ON public.profiles
FOR SELECT
USING (
  id = (
    SELECT admin_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);
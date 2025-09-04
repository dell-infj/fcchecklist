-- Add username field to profiles table for inspector login
ALTER TABLE public.profiles 
ADD COLUMN username text;

-- Create unique constraint for username within the same unique_id (company)
-- This ensures usernames are unique per company
CREATE UNIQUE INDEX idx_profiles_username_unique_id 
ON public.profiles (username, unique_id) 
WHERE username IS NOT NULL;
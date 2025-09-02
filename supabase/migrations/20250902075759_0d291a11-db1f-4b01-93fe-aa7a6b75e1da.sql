-- Fix inspector creation issue by removing unique constraint on unique_id
-- and creating partial unique index for admins only

-- Drop the constraint instead of the index
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_unique_id_key;

-- Create partial unique index - only enforce uniqueness for admin users
CREATE UNIQUE INDEX idx_profiles_unique_id_admin_unique 
ON profiles (unique_id) 
WHERE role = 'admin';

-- Create regular index on unique_id for performance
CREATE INDEX idx_profiles_unique_id 
ON profiles (unique_id);

-- This allows multiple inspectors to share the same company unique_id
-- while ensuring admin unique_ids remain unique
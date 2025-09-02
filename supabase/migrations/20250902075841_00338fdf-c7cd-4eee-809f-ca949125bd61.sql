-- Fix inspector creation issue - check and drop existing constraints/indexes

-- Drop existing constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_unique_id_key;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_profiles_unique_id_admin_unique;
DROP INDEX IF EXISTS idx_profiles_unique_id;
DROP INDEX IF EXISTS profiles_unique_id_key;

-- Create partial unique index - only enforce uniqueness for admin users
CREATE UNIQUE INDEX idx_profiles_unique_id_admin_unique 
ON profiles (unique_id) 
WHERE role = 'admin' AND unique_id IS NOT NULL;

-- Create regular index on unique_id for performance
CREATE INDEX idx_profiles_unique_id 
ON profiles (unique_id)
WHERE unique_id IS NOT NULL;
-- Remove user Marcio Marcelo from the system
-- First delete any checklists associated with this inspector
DELETE FROM checklists WHERE inspector_id = 'f9d643bc-6e2a-46b8-8b17-b31f433386fa';

-- Delete the profile record
DELETE FROM profiles WHERE id = 'f9d643bc-6e2a-46b8-8b17-b31f433386fa';

-- Delete the auth user record
DELETE FROM auth.users WHERE id = 'd42944c3-866d-495c-bc89-32daaa9fe225';
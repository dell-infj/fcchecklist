-- Add coordinator role to profiles if not exists
DO $$ 
BEGIN
  -- Check if coordinator role exists, if not, we need to handle coordinator as admin with managed_by field
  -- Add managed_by field to track which admin created this coordinator
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'managed_by') THEN
    ALTER TABLE public.profiles ADD COLUMN managed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
-- First, let's properly rename the truck_number column to vehicle_category
ALTER TABLE public.vehicles 
RENAME COLUMN truck_number TO vehicle_category;

-- Also make sure customer_name was properly renamed (in case it wasn't)
-- Check if customer_name still exists and rename if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'vehicles' 
              AND column_name = 'customer_name') THEN
        ALTER TABLE public.vehicles RENAME COLUMN customer_name TO owner_unique_id;
    END IF;
END $$;
-- Fix wrong unique constraint causing only 1 vehicle per category
-- 1) Drop the incorrect unique index (misnamed as truck_number but applied to vehicle_category)
DROP INDEX IF EXISTS public.vehicles_truck_number_key;

-- 2) Create a sensible uniqueness rule: prevent duplicate license plates per company
--    Only enforce when both fields are present
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_unique_company_plate
ON public.vehicles (unique_id, license_plate)
WHERE license_plate IS NOT NULL AND unique_id IS NOT NULL;

-- 3) Keep a fast lookup by category without enforcing uniqueness
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_category ON public.vehicles (vehicle_category);

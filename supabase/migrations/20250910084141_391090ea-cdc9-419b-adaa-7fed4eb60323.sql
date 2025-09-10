-- Fix wrong uniqueness constraint on vehicles
-- 1) Drop the UNIQUE constraint that enforces 1 row per category
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_truck_number_key;

-- 2) Create a sensible uniqueness rule: one license plate per company
CREATE UNIQUE INDEX IF NOT EXISTS vehicles_unique_company_plate
ON public.vehicles (unique_id, license_plate)
WHERE license_plate IS NOT NULL AND unique_id IS NOT NULL;

-- 3) Optional: non-unique index to keep category filters fast
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_category ON public.vehicles (vehicle_category);

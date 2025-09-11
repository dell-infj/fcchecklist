-- Normalize checklist_items.category to lowercase for consistency with vehicles
UPDATE public.checklist_items
SET category = lower(category)
WHERE category IS NOT NULL AND category <> lower(category);
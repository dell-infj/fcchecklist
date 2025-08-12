-- Add pdf_url column to checklists table
ALTER TABLE public.checklists 
ADD COLUMN pdf_url TEXT;
-- Add additional profile fields for user information
ALTER TABLE public.profiles 
ADD COLUMN address TEXT,
ADD COLUMN cnpj TEXT,
ADD COLUMN company_ids TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add index for better performance on company_ids array queries
CREATE INDEX idx_profiles_company_ids ON public.profiles USING GIN(company_ids);
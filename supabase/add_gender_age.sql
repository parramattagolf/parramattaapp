-- Add gender and age_group columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS age_group TEXT;

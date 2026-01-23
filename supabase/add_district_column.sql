-- Add district column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district TEXT;

-- Verify
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'district';

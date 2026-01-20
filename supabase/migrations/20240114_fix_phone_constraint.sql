-- Remove NOT NULL constraint from phone column in users table
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

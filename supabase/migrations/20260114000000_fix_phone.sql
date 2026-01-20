-- Fix phone constraint
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

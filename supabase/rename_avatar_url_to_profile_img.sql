-- Rename avatar_url to profile_img if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users RENAME COLUMN avatar_url TO profile_img;
    END IF;
END $$;

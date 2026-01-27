-- Create deleted_users table
CREATE TABLE IF NOT EXISTS public.deleted_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    kakao_id bigint UNIQUE,
    email text,
    nickname text,
    deleted_at timestamptz DEFAULT now(),
    PRIMARY KEY (id)
);

-- RLS for deleted_users
ALTER TABLE public.deleted_users ENABLE ROW LEVEL SECURITY;

-- Only Service Role can do everything (default denylist for others usually, but let's be explicit)
-- Admin usage might strictly use Service Role in server actions for safety.

CREATE POLICY "Service role full access"
    ON public.deleted_users
    USING (true)
    WITH CHECK (true);

-- Update the handle_new_user_with_metadata trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS trigger AS $$
DECLARE
    v_kakao_id BIGINT;
    v_raw_id TEXT;
    v_exists BOOLEAN;
BEGIN
    -- Extract Kakao ID
    BEGIN
        v_raw_id := COALESCE(
            new.raw_user_meta_data->>'provider_id',
            new.raw_user_meta_data->>'sub',
            new.raw_user_meta_data->>'id'
        );
        IF v_raw_id ~ '^[0-9]+$' THEN
            v_kakao_id := v_raw_id::BIGINT;
        ELSE
            v_kakao_id := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_kakao_id := NULL;
    END;

    -- CHECK BLOCKLIST
    IF v_kakao_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM public.deleted_users WHERE kakao_id = v_kakao_id) INTO v_exists;
        IF v_exists THEN
            RAISE EXCEPTION 'This account has been permanently deleted and cannot be restored.';
        END IF;
    END IF;

    -- Normal Insertion
    INSERT INTO public.users (id, email, nickname, avatar_url, full_name, kakao_id)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', '골퍼'),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
        new.raw_user_meta_data->>'full_name',
        v_kakao_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nickname = COALESCE(public.users.nickname, EXCLUDED.nickname),
        avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
        kakao_id = COALESCE(public.users.kakao_id, EXCLUDED.kakao_id),
        updated_at = now();
        
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

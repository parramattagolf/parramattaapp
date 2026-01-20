-- Disable real_name requirement and stop fetching it from Kakao
-- 1. Make real_name nullable
ALTER TABLE public.users ALTER COLUMN real_name DROP NOT NULL;

-- 2. Update the trigger function to stop extracting real_name
CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS trigger AS $$
DECLARE
    v_kakao_id BIGINT;
    v_raw_id TEXT;
BEGIN
    -- Kakao ID extraction logic
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

    -- Update: real_name is now NULL (specifically not fetched)
    INSERT INTO public.users (id, email, nickname, profile_img, real_name, kakao_id)
    VALUES (
        new.id,
        new.email,
        -- Nickname fallback
        COALESCE(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '골퍼'),
        -- Profile image
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
        -- Real Name: Set to NULL explicitly as requested
        NULL,
        v_kakao_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nickname = COALESCE(public.users.nickname, EXCLUDED.nickname),
        profile_img = COALESCE(public.users.profile_img, EXCLUDED.profile_img),
        -- Preserve existing real_name if one exists, otherwise ignore new NULL
        real_name = COALESCE(public.users.real_name, EXCLUDED.real_name),
        kakao_id = COALESCE(public.users.kakao_id, EXCLUDED.kakao_id),
        updated_at = now();
        
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

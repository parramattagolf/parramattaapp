-- Fix handle_new_user_with_metadata to use correct column names:
-- avatar_url -> profile_img
-- full_name -> real_name

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
    INSERT INTO public.users (id, email, nickname, profile_img, real_name, kakao_id)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', '골퍼'),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
        COALESCE(new.raw_user_meta_data->>'full_name', ''), -- Map full_name meta to real_name column, default empty
        v_kakao_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nickname = COALESCE(public.users.nickname, EXCLUDED.nickname),
        profile_img = COALESCE(public.users.profile_img, EXCLUDED.profile_img),
        real_name = COALESCE(public.users.real_name, EXCLUDED.real_name),
        kakao_id = COALESCE(public.users.kakao_id, EXCLUDED.kakao_id),
        updated_at = now();
        
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

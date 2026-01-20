-- 1. phone 컬럼 NOT NULL 제거 (카카오 로그인 오류 해결)
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- 2. kakao_id 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kakao_id BIGINT UNIQUE;

-- 3. 트리거 함수 수정 (raw_user_metadata 오타 수정 위함)
CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS trigger AS $$
DECLARE
    v_kakao_id BIGINT;
    v_raw_id TEXT;
BEGIN
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

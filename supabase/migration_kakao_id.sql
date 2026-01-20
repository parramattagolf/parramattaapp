-- Kakao ID Storage Migration
-- 카카오 고유 식별자를 저장하기 위한 컬럼 추가

-- 1. kakao_id 컬럼 추가 (BigInt로 저장, 카카오 ID는 숫자)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kakao_id BIGINT UNIQUE;

-- 2. 인덱스 추가 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON public.users(kakao_id);

-- 3. 기존 트리거 함수 업데이트 - kakao_id 추출 추가
CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS trigger AS $$
DECLARE
    v_kakao_id BIGINT;
BEGIN
    -- 카카오 ID 추출 (provider_id 또는 sub 필드에서)
    v_kakao_id := NULLIF(
        COALESCE(
            new.raw_user_meta_data->>'provider_id',
            new.raw_user_meta_data->>'sub',
            new.raw_user_meta_data->>'id'
        ), ''
    )::BIGINT;

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
        nickname = COALESCE(EXCLUDED.nickname, public.users.nickname),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        kakao_id = COALESCE(EXCLUDED.kakao_id, public.users.kakao_id),
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 기존 사용자의 kakao_id 동기화
UPDATE public.users u
SET kakao_id = NULLIF(
    COALESCE(
        au.raw_user_meta_data->>'provider_id',
        au.raw_user_meta_data->>'sub',
        au.raw_user_meta_data->>'id'
    ), ''
)::BIGINT
FROM auth.users au
WHERE u.id = au.id AND u.kakao_id IS NULL;

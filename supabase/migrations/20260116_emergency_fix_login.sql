-- [긴급] 로그인 에러 해결을 위한 제약 조건 해제 및 트리거 수정
-- 1. users 테이블의 nickname, phone 제약 조건 해제
ALTER TABLE public.users ALTER COLUMN nickname DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- 2. 트리거 함수 로직 정정 (raw_user_metadata 오타 수정 및 컬럼 매핑 정확화)
CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS trigger AS $$
DECLARE
    v_kakao_id BIGINT;
    v_raw_id TEXT;
BEGIN
    -- 카카오 ID 추출 로직
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

    -- users 테이블에 정보 입력 (컬럼명: profile_img, real_name 확인)
    INSERT INTO public.users (id, email, nickname, profile_img, real_name, kakao_id)
    VALUES (
        new.id,
        new.email,
        -- 닉네임이 없으면 '골퍼'로 기본값 설정하여 NULL 에러 2차 방지
        COALESCE(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '골퍼'),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Unknown'),
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

-- 3. 트리거 재연결 (안전장치)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_metadata();

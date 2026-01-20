-- Kakao Login Fix Migration
-- 로그인이 실패하는 원인이 될 수 있는 트리거 함수의 예외 처리를 강화합니다.

-- 1. kakao_id 컬럼이 없으면 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kakao_id BIGINT UNIQUE;

-- 2. 트리거 함수 수정 (안전한 형변환 및 예외 처리 추가)
CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS trigger AS $$
DECLARE
    v_kakao_id BIGINT;
    v_raw_id TEXT;
BEGIN
    -- 카카오 ID 추출 및 안전한 변환
    BEGIN
        v_raw_id := COALESCE(
            new.raw_user_meta_data->>'provider_id',
            new.raw_user_meta_data->>'sub',
            new.raw_user_meta_data->>'id'
        );
        
        -- 숫자만 있는지 확인하여 변환
        IF v_raw_id ~ '^[0-9]+$' THEN
            v_kakao_id := v_raw_id::BIGINT;
        ELSE
            v_kakao_id := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- 어떤 오류가 발생하더라도 로그인은 성공시켜야 함
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
        -- 기존 닉네임/아바타가 있으면 유지, 없으면 새 값으로 업데이트
        nickname = COALESCE(public.users.nickname, EXCLUDED.nickname),
        avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
        kakao_id = COALESCE(public.users.kakao_id, EXCLUDED.kakao_id),
        updated_at = now();
        
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 재설정 (확실히 하기 위해)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_metadata();

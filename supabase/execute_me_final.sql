-- ============================================================
-- PARRAMATTA GOLF 최종 긴급 수정 스크립트 (로그인 차단 해결)
-- 이 파일의 내용을 모두 복사하여 Supabase SQL Editor에서 실행해주세요.
-- ============================================================

-- [Part 0] phone 컬럼 제약조건 해제 (가장 중요한 부분)
-- 카카오 로그인 등 소셜 로그인 시 전화번호가 없을 수 있으므로 NULL 허용으로 변경
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- [Part 1] 카카오 로그인 오류 수정 (트리거 함수 오타 수정)
-- 1. kakao_id 컬럼 추가 (안전 장치)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kakao_id BIGINT UNIQUE;

-- 2. 트리거 함수 수정 (오타 수정: raw_user_metadata -> raw_user_meta_data 및 안전한 형변환)
CREATE OR REPLACE FUNCTION public.handle_new_user_with_metadata()
RETURNS trigger AS $$
DECLARE
    v_kakao_id BIGINT;
    v_raw_id TEXT;
BEGIN
    BEGIN
        -- 올바른 필드명(raw_user_meta_data) 사용
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

-- 3. 트리거 재설정 (확실히 적용하기 위해 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_metadata();


-- [Part 2] 멤버 리스트 본인 표시 수정
-- 1. 기존 함수 삭제 (파라미터 변경 등에 대비)
DROP FUNCTION IF EXISTS get_member_list_with_distance;

-- 2. 함수 재생성 (본인 제외 조건 삭제됨)
CREATE OR REPLACE FUNCTION get_member_list_with_distance(query_user_id UUID, max_depth INT DEFAULT 5)
RETURNS TABLE (
    id UUID,
    nickname TEXT,
    real_name TEXT,
    job TEXT,
    avatar_url TEXT,
    manner_score FLOAT,
    best_dresser_score FLOAT,
    golf_experience TEXT,
    distance INT,
    is_blocked BOOLEAN
) AS $$
DECLARE
BEGIN
    RETURN QUERY
    WITH RECURSIVE bfs_tree AS (
        SELECT 
            u.id, 
            0 AS dist
        FROM public.users u
        WHERE u.id = query_user_id
        
        UNION ALL
        
        SELECT 
            CASE 
                WHEN r.user_id = b.id THEN r.friend_id 
                ELSE r.user_id 
            END AS id,
            b.dist + 1
        FROM public.relationships r
        JOIN bfs_tree b ON (r.user_id = b.id OR r.friend_id = b.id)
        WHERE 
            r.status = 'accepted'
            AND b.dist < max_depth
    ),
    shortest_paths AS (
        SELECT 
            s.id, 
            MIN(s.dist) as dist
        FROM bfs_tree s
        GROUP BY s.id
    )
    SELECT 
        u.id,
        u.nickname,
        u.real_name,
        u.job,
        COALESCE(u.avatar_url, '') as avatar_url,
        u.manner_score,
        u.best_dresser_score,
        u.golf_experience,
        sp.dist as distance,
        EXISTS (
            SELECT 1 FROM public.blocks b 
            WHERE (b.blocker_id = query_user_id AND b.blocked_id = u.id)
               OR (b.blocker_id = u.id AND b.blocked_id = query_user_id)
        ) as is_blocked
    FROM public.users u
    LEFT JOIN shortest_paths sp ON u.id = sp.id
    WHERE 
        (sp.dist IS NOT NULL OR true) -- 본인 포함
    ORDER BY 
        CASE WHEN sp.dist IS NULL THEN 999 ELSE sp.dist END ASC, 
        u.manner_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 실행 권한 부여
GRANT EXECUTE ON FUNCTION get_member_list_with_distance TO authenticated;

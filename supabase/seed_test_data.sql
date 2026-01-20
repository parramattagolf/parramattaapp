-- ============================================================
-- 테스트 데이터 생성 스크립트 (멤버 10명 + 라운딩 10개)
-- 이 파일의 내용을 복사하여 Supabase SQL Editor에서 실행해주세요.
-- ============================================================

-- 필수 확장 기능 확인
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 테스트 멤버 10명 생성
DO $$
DECLARE
    i INT;
    new_uid UUID;
    fake_email TEXT;
    fake_name TEXT;
    -- 더미 아바타 이미지들
    avatars TEXT[] := ARRAY[
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Cal',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Say',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=George',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Precious',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Coco'
    ];
BEGIN
    FOR i IN 1..10 LOOP
        new_uid := gen_random_uuid();
        fake_email := 'testuser' || i || '@example.com';
        fake_name := 'Member' || i;
        
        -- auth.users 테이블에 사용자 삽입
        -- (비밀번호는 'password123'으로 설정되지만 실제 로그인은 이메일 인증 등이 필요할 수 있음. 리스트 표시용)
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token, 
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_uid,
            'authenticated',
            'authenticated',
            fake_email,
            crypt('password123', gen_salt('bf')),
            now(),
            jsonb_build_object(
                'nickname', fake_name,
                'full_name', fake_name,
                'avatar_url', avatars[i],
                'provider', 'email'
            ),
            now(),
            now(),
            '', 
            ''
        );
        
        -- 주의: auth.users에 insert되면 트리거에 의해 public.users에도 자동 insert 됩니다.
        -- 하지만 트리거가 실패하거나 덮어써야 할 데이터를 위해 잠시 대기 후 update (동기 처리라 바로 해도 됨)
        
        -- public.users 데이터 풍부하게 업데이트
        UPDATE public.users 
        SET 
            manner_score = (floor(random() * 40) + 10) / 10.0, -- 1.0 ~ 5.0
            best_dresser_score = (floor(random() * 40) + 10) / 10.0,
            job = (ARRAY['개발자', '의사', '프로골퍼', '선생님', 'CEO', '디자이너', '변호사'])[floor(random()*7 + 1)],
            golf_experience = (ARRAY['1년차', '3년차', '5년차', '싱글', '프로', '머리올림'])[floor(random()*6 + 1)],
            -- 닉네임이 트리거 기본값일 수 있으므로 확실하게 설정
            nickname = fake_name
        WHERE id = new_uid;
        
    END LOOP;
END $$;


-- 2. 테스트 라운딩 일정 10개 생성 (admin_schedules)
INSERT INTO public.admin_schedules (
    course_name,
    course_region,
    tee_time,
    max_participants,
    min_participants,
    cost,
    status,
    description,
    image_url
)
SELECT
    'CC ' || (ARRAY['Sky', 'Valley', 'Ocean', 'Mountain', 'Lake', 'Forest', 'Royal'])[floor(random()*7 + 1)],
    (ARRAY['경기', '강원', '충청', '제주', '부산', '서울'])[floor(random()*6 + 1)],
    now() + (i || ' days')::interval + '09:00:00' + ((floor(random()*5)) || ' hours')::interval,
    4,
    3,
    (floor(random() * 20) + 10) * 10000, -- 10~30만원
    'active',
    '함께 즐거운 라운딩하실 분 모집합니다! #' || i,
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000&auto=format&fit=crop' -- 골프장 더미 이미지
FROM generate_series(1, 10) AS i;

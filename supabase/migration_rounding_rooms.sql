-- ============================================
-- 라운딩 방 시스템 리뉴얼 마이그레이션
-- ============================================

-- 1. admin_schedules 테이블: 관리자가 등록한 일정
CREATE TABLE IF NOT EXISTS public.admin_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 기본 정보
    course_name TEXT NOT NULL,                    -- 골프장명
    course_region TEXT,                           -- 지역 (예: 경기, 강원)
    tee_time TIMESTAMPTZ NOT NULL,               -- 티오프 시간
    
    -- 참가 조건
    max_participants INT NOT NULL DEFAULT 4,      -- 인원 제한
    min_participants INT NOT NULL DEFAULT 4,      -- 최소 인원 (미달 시 무산)
    cost INT NOT NULL,                           -- 비용 (원)
    
    -- 상태
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'full', 'closed', 'cancelled')),
    
    -- 메타
    description TEXT,                             -- 추가 설명
    image_url TEXT,                              -- 골프장 이미지
    created_by UUID REFERENCES public.users(id), -- 등록한 관리자
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_admin_schedules_tee_time ON public.admin_schedules(tee_time);
CREATE INDEX IF NOT EXISTS idx_admin_schedules_status ON public.admin_schedules(status);

-- 2. rounding_rooms 테이블: 사용자가 만든 방
CREATE TABLE IF NOT EXISTS public.rounding_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 연결된 일정
    admin_schedule_id UUID NOT NULL REFERENCES public.admin_schedules(id) ON DELETE CASCADE,
    
    -- 방 정보
    title TEXT NOT NULL,                          -- 방 제목
    description TEXT,                             -- 멤버 성향 상세설명
    
    -- 상태
    status TEXT DEFAULT 'pending_payment' CHECK (status IN (
        'pending_payment',  -- 결제 대기 (개설 직후)
        'active',           -- 활성 (결제 완료 후)
        'full',             -- 인원 마감
        'confirmed',        -- 라운딩 확정
        'cancelled',        -- 무산 (결제 미완료)
        'completed'         -- 완료
    )),
    
    -- 개설자
    created_by UUID NOT NULL REFERENCES public.users(id),
    
    -- 결제 관련
    payment_deadline TIMESTAMPTZ,                 -- 결제 마감 시간 (개설 후 3시간)
    
    -- 메타
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_rounding_rooms_schedule ON public.rounding_rooms(admin_schedule_id);
CREATE INDEX IF NOT EXISTS idx_rounding_rooms_status ON public.rounding_rooms(status);
CREATE INDEX IF NOT EXISTS idx_rounding_rooms_created_by ON public.rounding_rooms(created_by);

-- 3. room_participants 테이블: 방 참가자
CREATE TABLE IF NOT EXISTS public.room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    room_id UUID NOT NULL REFERENCES public.rounding_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 참가 정보
    role TEXT DEFAULT 'member' CHECK (role IN ('host', 'member')),  -- 역할
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    
    -- 메타
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(room_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON public.room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON public.room_participants(user_id);

-- 4. RLS 정책
ALTER TABLE public.admin_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounding_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- admin_schedules: 모두 읽기 가능
CREATE POLICY "Anyone can view admin schedules" ON public.admin_schedules
    FOR SELECT USING (true);

-- rounding_rooms: 모두 읽기, 로그인 유저만 생성
CREATE POLICY "Anyone can view rooms" ON public.rounding_rooms
    FOR SELECT USING (true);
    
CREATE POLICY "Logged in users can create rooms" ON public.rounding_rooms
    FOR INSERT WITH CHECK (auth.uid() = created_by);
    
CREATE POLICY "Room creator can update" ON public.rounding_rooms
    FOR UPDATE USING (auth.uid() = created_by);

-- room_participants: 로그인 유저만 참가 가능
CREATE POLICY "Anyone can view participants" ON public.room_participants
    FOR SELECT USING (true);
    
CREATE POLICY "Logged in users can join" ON public.room_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can leave" ON public.room_participants
    FOR DELETE USING (auth.uid() = user_id);

-- 5. 방 개설 시 호스트 자동 등록 트리거
CREATE OR REPLACE FUNCTION public.auto_add_room_host()
RETURNS TRIGGER AS $$
BEGIN
    -- 방 개설자를 첫 번째 참가자(호스트)로 자동 등록
    INSERT INTO public.room_participants (room_id, user_id, role, payment_status)
    VALUES (NEW.id, NEW.created_by, 'host', 'pending');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_room_created ON public.rounding_rooms;
CREATE TRIGGER on_room_created
    AFTER INSERT ON public.rounding_rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_add_room_host();

-- 6. 결제 마감 자동 설정 트리거 (개설 후 3시간)
CREATE OR REPLACE FUNCTION public.set_payment_deadline()
RETURNS TRIGGER AS $$
BEGIN
    NEW.payment_deadline := NOW() + INTERVAL '3 hours';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_room_deadline ON public.rounding_rooms;
CREATE TRIGGER set_room_deadline
    BEFORE INSERT ON public.rounding_rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.set_payment_deadline();

-- 7. 미결제 방 자동 취소 함수
CREATE OR REPLACE FUNCTION public.cancel_expired_rooms()
RETURNS TABLE (cancelled_count INT) AS $$
DECLARE
    v_count INT;
BEGIN
    -- 결제 마감 시간이 지난 pending_payment 상태의 방을 cancelled로 변경
    UPDATE public.rounding_rooms
    SET status = 'cancelled', updated_at = NOW()
    WHERE status = 'pending_payment'
    AND payment_deadline < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 1. 포인트 시스템 테이블 생성 (만약 없다면)
-- ==========================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    balance_snapshot INTEGER
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);


-- ==========================================
-- 2. RLS (Row Level Security) 정책 초기화 (모든 테이블)
-- ==========================================

-- A. users 테이블
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
-- (단순화를 위해 인증된 모든 사용자가 보고, 본인만 수정 가능하게 설정)
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);


-- B. point_transactions 테이블
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.point_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.point_transactions;

CREATE POLICY "Users can view their own transactions" ON public.point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Server/Admin can insert transactions" ON public.point_transactions FOR INSERT WITH CHECK (true); -- Service Role이 처리하거나 누구나 insert 가능 (앱 로직 의존)


-- C. events, participants 등 다른 테이블도 필요시 추가
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.events FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on email" ON public.events FOR UPDATE USING (auth.uid() = host_id); 
CREATE POLICY "Enable delete for users based on email" ON public.events FOR DELETE USING (auth.uid() = host_id);


ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on id" ON public.participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on id" ON public.participants FOR DELETE USING (auth.uid() = user_id OR auth.uid() IN (SELECT host_id FROM events WHERE id = event_id));


-- ==========================================
-- 3. 관리자 권한 강제 부여 (카카오 ID 기준)
-- ==========================================
-- 카카오 ID '4691771243' 사용자를 찾아 관리자로 승격
UPDATE public.users 
SET is_admin = true 
WHERE kakao_id = '4691771243';

-- (선택) 현재 로그인한 모든 유저에게 임시로 RLS 우회 권한 부여 (필요시)
-- 권장하지 않음.


-- 1. 유저 테이블에 포인트 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 2. 포인트 내역 테이블 생성
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    balance_snapshot INTEGER
);

-- 3. 검색 성능을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);

-- 4. RLS (Row Level Security) 정책 설정 (선택사항, 필요시 적용)
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- 유저는 자신의 거래 내역만 볼 수 있음
CREATE POLICY "Users can view their own transactions" 
ON public.point_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- 삽입은 서버 사이드(Service Role)에서만 수행하거나, 또는 본인만 가능하게 하려면 아래 추가
-- (현재 로직상 서버 액션에서 처리하므로 Service Role이 처리하거나, RLS가 있어도 insert는 가능해야 함)
CREATE POLICY "Users can insert their own transactions" 
ON public.point_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

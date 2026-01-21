-- 1. 매너 점수 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS public.manner_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    score_snapshot INTEGER
);

CREATE INDEX IF NOT EXISTS idx_manner_score_history_user_id ON public.manner_score_history(user_id);

-- 2. RLS 정책 설정
ALTER TABLE public.manner_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own manner history" 
ON public.manner_score_history FOR SELECT 
USING (auth.uid() = user_id);

-- 3. 유저 테이블에 manner_score 컬럼이 없으면 추가 (기본값 100)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS manner_score INTEGER DEFAULT 100;

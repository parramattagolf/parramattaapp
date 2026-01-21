-- 테이블 초기화 (기존 데이터 삭제 및 재생성)
DROP TABLE IF EXISTS public.manner_score_history;

-- 1. 매너 점수 히스토리 테이블 생성 (포인트 내역과 동일 구조)
CREATE TABLE public.manner_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    score_snapshot INTEGER
);

-- 2. 인덱스 생성
CREATE INDEX idx_manner_score_history_user_id ON public.manner_score_history(user_id);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE public.manner_score_history ENABLE ROW LEVEL SECURITY;

-- 4. 정책 설정 (포인트 테이블과 동일 방식)
-- 조회: 본인 내역만 조회 가능
CREATE POLICY "Users can view their own manner history" 
ON public.manner_score_history FOR SELECT 
USING (auth.uid() = user_id);

-- 삽입: 본인 내역만 추가 가능 (서버 액션에서 insert 수행 시 필요)
CREATE POLICY "Users can insert their own manner history" 
ON public.manner_score_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. 유저 테이블에 manner_score 컬럼 확인 (없으면 추가, 기본값 100)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS manner_score INTEGER DEFAULT 100;

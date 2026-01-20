-- Phase 7 Enhancement: Sponsor Ecosystem Complete

-- 1. Add external purchase link and featured flag to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- 2. Featured banners table for carousel
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    link_type TEXT DEFAULT 'internal' CHECK (link_type IN ('internal', 'external', 'event', 'sponsor')),
    link_id UUID,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = TRUE);

-- 3. Prize conditions for sponsors
CREATE TABLE IF NOT EXISTS public.prize_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    prize_name TEXT NOT NULL,
    prize_description TEXT,
    condition_type TEXT CHECK (condition_type IN ('ranking', 'purchase', 'combined')),
    min_ranking INT,
    max_ranking INT,
    requires_product_purchase BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prize_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view conditions" ON public.prize_conditions;
CREATE POLICY "Anyone can view conditions" ON public.prize_conditions FOR SELECT USING (TRUE);

-- 4. Prize winners table
CREATE TABLE IF NOT EXISTS public.prize_winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_id UUID NOT NULL REFERENCES public.prize_conditions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    ranking INT,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    claimed BOOLEAN DEFAULT FALSE,
    UNIQUE(condition_id, user_id)
);

ALTER TABLE public.prize_winners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view winners" ON public.prize_winners;
CREATE POLICY "Anyone can view winners" ON public.prize_winners FOR SELECT USING (TRUE);

-- 5. Sample banners
INSERT INTO public.banners (title, subtitle, link_type, sort_order, image_url) VALUES
    ('2026 신년 라운딩 페스티벌', '1월 한정 특별 이벤트 참가하세요', 'internal', 1, NULL),
    ('TITLEIST Pro V1 출시 기념', '구매자 전원 버디 찬스 이벤트', 'sponsor', 2, NULL),
    ('파라마타 골프 첫 1촌 이벤트', '친구 초대하고 라운딩권 받자!', 'internal', 3, NULL)
ON CONFLICT DO NOTHING;

-- 6. Function to allocate prizes based on conditions
CREATE OR REPLACE FUNCTION allocate_event_prizes(p_event_id UUID)
RETURNS TABLE (
    winners_count INT,
    conditions_processed INT
) AS $$
DECLARE
    v_condition RECORD;
    v_winners INT := 0;
    v_conditions INT := 0;
BEGIN
    FOR v_condition IN 
        SELECT * FROM public.prize_conditions 
        WHERE (event_id = p_event_id OR event_id IS NULL) AND is_active = TRUE
    LOOP
        v_conditions := v_conditions + 1;
        
        -- Find eligible winners
        INSERT INTO public.prize_winners (condition_id, user_id, event_id, ranking)
        SELECT 
            v_condition.id,
            es.user_id,
            es.event_id,
            es.ranking
        FROM public.event_scores es
        WHERE 
            es.event_id = p_event_id
            AND es.ranking BETWEEN COALESCE(v_condition.min_ranking, 1) AND COALESCE(v_condition.max_ranking, 999)
            AND (
                NOT v_condition.requires_product_purchase 
                OR EXISTS (
                    SELECT 1 FROM public.purchases p 
                    WHERE p.user_id = es.user_id 
                    AND p.product_id = v_condition.product_id
                )
            )
        ON CONFLICT (condition_id, user_id) DO NOTHING;
        
        GET DIAGNOSTICS v_winners = v_winners + ROW_COUNT;
    END LOOP;
    
    RETURN QUERY SELECT v_winners, v_conditions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

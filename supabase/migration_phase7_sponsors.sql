-- Phase 7: Sponsor Ecosystem & Final Integration
-- Complete Migration Script

-- 1. Sponsors table
CREATE TABLE IF NOT EXISTS public.sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    website_url TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    image_url TEXT,
    category TEXT CHECK (category IN ('equipment', 'apparel', 'lesson', 'accessory', 'other')),
    badge_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    total_price NUMERIC NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_code TEXT NOT NULL,
    sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_code)
);

-- 5. Event Scores table (for ranking)
CREATE TABLE IF NOT EXISTS public.event_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    gross_score INT,
    net_score INT,
    ranking INT,
    prize_won TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 6. RLS Policies
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view sponsors" ON public.sponsors;
CREATE POLICY "Anyone can view sponsors" ON public.sponsors FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users view own purchases" ON public.purchases;
CREATE POLICY "Users view own purchases" ON public.purchases FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert purchases" ON public.purchases;
CREATE POLICY "System can insert purchases" ON public.purchases FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Anyone can view badges" ON public.user_badges;
CREATE POLICY "Anyone can view badges" ON public.user_badges FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;
CREATE POLICY "System can insert badges" ON public.user_badges FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Anyone can view scores" ON public.event_scores;
CREATE POLICY "Anyone can view scores" ON public.event_scores FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage scores" ON public.event_scores;
CREATE POLICY "Admins can manage scores" ON public.event_scores FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- 7. Sample Data: Sponsors
INSERT INTO public.sponsors (name, description) VALUES
    ('TITLEIST', '세계 최고의 골프볼과 클럽 브랜드'),
    ('CALLAWAY', '혁신적인 골프 장비의 선두주자'),
    ('PING', '정밀한 커스텀 피팅의 대명사'),
    ('FootJoy', '골프 신발과 장갑의 명가')
ON CONFLICT DO NOTHING;

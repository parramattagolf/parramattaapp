-- Phase 6 Complete Migration Script
-- Run this in Supabase SQL Editor

-- 1. Add is_admin flag to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Admin Logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('payment_unmatched', 'payment_duplicate', 'manual_action', 'auto_kick')),
    description TEXT,
    payload JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payment confirmed timestamp
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;

-- 4. Manner Score History table
CREATE TABLE IF NOT EXISTS public.manner_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    change_amount NUMERIC NOT NULL,
    old_score NUMERIC NOT NULL,
    new_score NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    source TEXT CHECK (source IN ('auto_kick', 'admin', 'review', 'system')),
    related_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notification Templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    kakao_template_id TEXT,
    push_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Insert default notification templates
INSERT INTO public.notification_templates (code, title, body) VALUES
    ('reservation_confirmed', '예약 확정', '{{event_title}} 참가가 확정되었습니다! 🎉'),
    ('payment_pending', '결제 대기 중', '{{event_title}} 참가 신청이 완료되었습니다. 3시간 이내에 결제를 완료해주세요.'),
    ('payment_reminder_1h', '결제 마감 1시간 전', '{{event_title}} 결제 기한이 1시간 남았습니다. 미결제 시 자동 취소됩니다.'),
    ('payment_expired', '결제 기한 만료', '{{event_title}} 결제 기한이 만료되어 참가가 취소되었습니다. 매너점수 50점이 차감되었습니다.'),
    ('kicked_by_host', '호스트에 의한 퇴출', '{{event_title}}에서 호스트에 의해 퇴출되었습니다.'),
    ('manner_review_request', '매너 평가 요청', '{{event_title}} 라운딩이 종료되었습니다. 함께한 멤버들의 매너를 평가해주세요! ⭐'),
    ('friend_invite', '친구 초대', '{{sender_name}}님이 {{event_title}} 라운딩에 초대했습니다!')
ON CONFLICT (code) DO NOTHING;

-- 7. RLS Policies
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manner_score_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read logs" ON public.admin_logs;
CREATE POLICY "Admins can read logs" ON public.admin_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "System can insert logs" ON public.admin_logs;
CREATE POLICY "System can insert logs" ON public.admin_logs FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view own history" ON public.manner_score_history;
CREATE POLICY "Users can view own history" ON public.manner_score_history
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all history" ON public.manner_score_history;
CREATE POLICY "Admins can view all history" ON public.manner_score_history
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "System can insert history" ON public.manner_score_history;
CREATE POLICY "System can insert history" ON public.manner_score_history FOR INSERT WITH CHECK (TRUE);

-- 8. Auto-Kick Function with History Logging
CREATE OR REPLACE FUNCTION auto_kick_unpaid_users()
RETURNS TABLE (kicked_count INT) AS $$
DECLARE
    rows_deleted INT;
BEGIN
    WITH to_kick AS (
        SELECT p.user_id, p.event_id
        FROM public.participants p
        WHERE p.payment_status = 'pending' AND p.joined_at < NOW() - INTERVAL '3 hours'
    ),
    user_scores AS (
        SELECT u.id, u.manner_score FROM public.users u WHERE u.id IN (SELECT user_id FROM to_kick)
    ),
    deleted AS (
        DELETE FROM public.participants
        WHERE (user_id, event_id) IN (SELECT user_id, event_id FROM to_kick)
        RETURNING user_id, event_id
    ),
    updated AS (
        UPDATE public.users u
        SET manner_score = GREATEST(0, u.manner_score - 50)
        FROM user_scores us WHERE u.id = us.id
        RETURNING u.id, us.manner_score as old_score, u.manner_score as new_score
    ),
    history_logged AS (
        INSERT INTO public.manner_score_history (user_id, change_amount, old_score, new_score, reason, source, related_event_id)
        SELECT d.user_id, -50, COALESCE(u.old_score, 0), COALESCE(u.new_score, 0),
               '3시간 미결제로 인한 자동 퇴출', 'auto_kick', d.event_id
        FROM deleted d LEFT JOIN updated u ON d.user_id = u.id
        RETURNING id
    ),
    notified AS (
        INSERT INTO public.notifications (user_id, type, sender_id)
        SELECT user_id, 'system', NULL FROM deleted
        RETURNING id
    ),
    logged AS (
        INSERT INTO public.admin_logs (type, description, payload)
        SELECT 'auto_kick', 'Auto-kicked user for unpaid participation after 3 hours (-50 manner score)',
               jsonb_build_object('user_id', user_id, 'event_id', event_id)
        FROM deleted RETURNING id
    )
    SELECT COUNT(*)::INT INTO rows_deleted FROM deleted;
    RETURN QUERY SELECT rows_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Payment Confirm Function
CREATE OR REPLACE FUNCTION confirm_payment_by_identity(
    p_phone TEXT DEFAULT NULL,
    p_name TEXT DEFAULT NULL,
    p_event_id UUID DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT, matched_user_id UUID, matched_event_id UUID) AS $$
DECLARE
    v_user_id UUID;
    v_event_id UUID;
    v_count INT;
BEGIN
    SELECT u.id, p.event_id INTO v_user_id, v_event_id
    FROM public.participants p
    JOIN public.users u ON p.user_id = u.id
    WHERE p.payment_status = 'pending'
        AND ((p_phone IS NOT NULL AND u.phone = p_phone) OR (p_name IS NOT NULL AND u.real_name = p_name))
        AND (p_event_id IS NULL OR p.event_id = p_event_id)
    LIMIT 1;
    
    SELECT COUNT(*) INTO v_count
    FROM public.participants p JOIN public.users u ON p.user_id = u.id
    WHERE p.payment_status = 'pending'
        AND ((p_phone IS NOT NULL AND u.phone = p_phone) OR (p_name IS NOT NULL AND u.real_name = p_name))
        AND (p_event_id IS NULL OR p.event_id = p_event_id);
    
    IF v_count = 0 THEN
        INSERT INTO public.admin_logs (type, description, payload)
        VALUES ('payment_unmatched', 'Payment received but no matching pending user found',
                jsonb_build_object('phone', p_phone, 'name', p_name, 'event_id', p_event_id));
        RETURN QUERY SELECT FALSE, 'No matching pending user found'::TEXT, NULL::UUID, NULL::UUID;
    ELSIF v_count > 1 THEN
        INSERT INTO public.admin_logs (type, description, payload)
        VALUES ('payment_duplicate', 'Payment received but multiple matching users found',
                jsonb_build_object('phone', p_phone, 'name', p_name, 'event_id', p_event_id, 'count', v_count));
        RETURN QUERY SELECT FALSE, 'Multiple matching users found - admin review required'::TEXT, NULL::UUID, NULL::UUID;
    ELSE
        UPDATE public.participants SET payment_status = 'paid', payment_confirmed_at = NOW()
        WHERE user_id = v_user_id AND event_id = v_event_id;
        RETURN QUERY SELECT TRUE, 'Payment confirmed successfully'::TEXT, v_user_id, v_event_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Manner Score Deduction Function
CREATE OR REPLACE FUNCTION deduct_manner_score(
    target_user_id UUID,
    amount NUMERIC,
    p_reason TEXT DEFAULT 'Admin action',
    p_source TEXT DEFAULT 'admin',
    p_event_id UUID DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, new_score NUMERIC) AS $$
DECLARE
    v_old_score NUMERIC;
    v_new_score NUMERIC;
BEGIN
    SELECT manner_score INTO v_old_score FROM public.users WHERE id = target_user_id;
    v_new_score := GREATEST(0, v_old_score - amount);
    UPDATE public.users SET manner_score = v_new_score WHERE id = target_user_id;
    INSERT INTO public.manner_score_history (user_id, change_amount, old_score, new_score, reason, source, related_event_id)
    VALUES (target_user_id, -amount, v_old_score, v_new_score, p_reason, p_source, p_event_id);
    RETURN QUERY SELECT TRUE, v_new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

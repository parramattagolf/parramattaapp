-- Phase 4: Room Booking & Matching

-- 1. Add Theme to Events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'General', -- e.g. 'Serious', 'Fun', 'Beginner'
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- 2. Add Payment Status to Participants
ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW(); -- Ensure this exists

-- 3. Create RPC to fetch events excluding blocked users
-- Function: get_safe_events(viewer_id)
CREATE OR REPLACE FUNCTION get_safe_events(viewer_id UUID)
RETURNS TABLE (
    id UUID,
    host_id UUID,
    title TEXT,
    course_name TEXT,
    start_date TIMESTAMPTZ,
    cost NUMERIC,
    max_participants INT,
    theme TEXT,
    location TEXT,
    status TEXT,
    host_nickname TEXT,
    host_avatar TEXT,
    participant_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.host_id,
        e.title,
        e.course_name,
        e.start_date,
        e.cost,
        e.max_participants,
        e.theme,
        e.location,
        e.status,
        u.nickname as host_nickname,
        u.avatar_url as host_avatar,
        (SELECT count(*) FROM public.participants p WHERE p.event_id = e.id) as participant_count
    FROM public.events e
    JOIN public.users u ON e.host_id = u.id
    WHERE 
        e.status = 'open'
        AND NOT EXISTS (
            -- Exclude if Host blocked Viewer
            SELECT 1 FROM public.blocks b WHERE b.blocker_id = e.host_id AND b.blocked_id = viewer_id
        )
        AND NOT EXISTS (
            -- Exclude if Viewer blocked Host
            SELECT 1 FROM public.blocks b WHERE b.blocker_id = viewer_id AND b.blocked_id = e.host_id
        )
    ORDER BY e.start_date ASC;
END;
$$ LANGUAGE plpgsql;

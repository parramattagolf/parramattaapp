-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL, -- Receiver
    type TEXT CHECK (type IN ('like_received', 'like_accepted', 'system')) NOT NULL,
    sender_id UUID REFERENCES public.users(id), -- Triggered by whom
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: When A likes B (relationship insert with status 'pending'), notify B
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' THEN
        INSERT INTO public.notifications (user_id, type, sender_id)
        VALUES (NEW.friend_id, 'like_received', NEW.user_id);
    ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
         -- Optional: Notify original requester that request was accepted?
         -- The requester is NEW.user_id in standard flow if B accepts A's request.
         -- But 'relationships' usually stores (user_id=A, friend_id=B).
         -- If B accepts, we update status to 'accepted'.
         -- Notify A that B accepted.
         INSERT INTO public.notifications (user_id, type, sender_id)
         VALUES (NEW.user_id, 'like_accepted', NEW.friend_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_like ON public.relationships;
CREATE TRIGGER trigger_notify_on_like
AFTER INSERT OR UPDATE ON public.relationships
FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true); -- Triggers run as distinct, but for direct inserts if needed.

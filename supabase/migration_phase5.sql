-- Phase 5: Event Chat

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages" ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.participants p 
            WHERE p.event_id = event_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can send messages" ON public.messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.participants p 
            WHERE p.event_id = event_id 
            AND p.user_id = auth.uid()
        )
    );

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

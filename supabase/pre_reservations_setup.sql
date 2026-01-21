-- Create pre_reservations table
CREATE TABLE IF NOT EXISTS public.pre_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- RLS Policies
ALTER TABLE public.pre_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all"
ON public.pre_reservations FOR SELECT
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON public.pre_reservations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow delete for own reservation"
ON public.pre_reservations FOR DELETE
USING (auth.uid() = user_id);

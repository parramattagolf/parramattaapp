-- Phase 3: Events & Commerce Refinements

-- 1. Add Cost and Course Name to Events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS course_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('open', 'closed', 'cancelled')) DEFAULT 'open',
ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES public.sponsors(id);

-- 2. Add Sponsor ID to Events (already added above)

-- 3. RLS for Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view open events
CREATE POLICY "Everyone can view open events"
ON public.events FOR SELECT
USING (true);

-- Only authenticated users can insert (Host)
CREATE POLICY "Authenticated users can create events"
ON public.events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id);

-- Only Host can update their events
CREATE POLICY "Hosts can update their own events"
ON public.events FOR UPDATE
TO authenticated
USING (auth.uid() = host_id);

-- 4. RLS for Participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Everyone can view participants
CREATE POLICY "Everyone can view participants"
ON public.participants FOR SELECT
USING (true);

-- Authenticated users can join (insert)
CREATE POLICY "Authenticated users can join"
ON public.participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own status (e.g. leave?) OR Host can update
CREATE POLICY "Users can update own, Host can update all"
ON public.participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.events WHERE id = event_id AND host_id = auth.uid()
));

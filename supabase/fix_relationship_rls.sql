-- Enable RLS on relationships table
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Policy: View own relationships (sender or receiver)
CREATE POLICY "Users can view their own relationships" 
ON public.relationships FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Insert new relationship (sender must be auth user)
CREATE POLICY "Users can insert relationships (send request)" 
ON public.relationships FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Update own relationships (e.g. accept)
CREATE POLICY "Users can update their own relationships" 
ON public.relationships FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Delete own relationships (e.g. cancel or unfriend)
CREATE POLICY "Users can delete their own relationships" 
ON public.relationships FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

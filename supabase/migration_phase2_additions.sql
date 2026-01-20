-- Add Golf Experience to Users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS golf_experience TEXT;

-- FIX: "Auto block on 0 manner score" when default is 0 causes loop.
-- Let's Update the trigger logic to block only if score < 0 (Negative).
CREATE OR REPLACE FUNCTION check_manner_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.manner_score < 0 THEN
        NEW.is_banned = true;
        -- Optional: Insert into blocks table too if strictly needed
        INSERT INTO public.blocks (blocker_id, blocked_id, reason)
        VALUES (NULL, NEW.id, 'System Ban: Negative Manner Score')
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create trigger just in case
DROP TRIGGER IF EXISTS auto_ban_on_zero_score ON public.users;
CREATE TRIGGER auto_ban_on_zero_score
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION check_manner_score();

-- Add payment_url column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS payment_url TEXT;

COMMENT ON COLUMN public.events.payment_url IS 'External payment link for the rounding event';

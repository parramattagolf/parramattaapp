-- Sync Schema with Admin Web Project
-- This migration adds missing columns to users, events, and participants tables

-- 1. Users Table Enhancements
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS golf_experience text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS partner_style_preference text[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS partner_style_avoid text[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- 2. Events Table Enhancements
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsor_id uuid REFERENCES public.sponsors(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS course_name text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cost bigint DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS theme text;
-- Note: host_id, location, max_participants already exist

-- 3. Participants Table Enhancements
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS role text DEFAULT 'guest';
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- 4. Products Table (Ensure Basic Structure Matches)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    type text,
    cost bigint DEFAULT 0,
    stock int DEFAULT 0,
    image_url text,
    external_url text, -- Added in previous migration, strictly ensuring
    featured boolean DEFAULT FALSE, -- Added in previous migration, strictly ensuring
    created_at timestamptz DEFAULT now()
);

-- 5. Purchases Table (Ensure Basic Structure Matches)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    product_id UUID REFERENCES public.products(id),
    amount bigint DEFAULT 0,
    status text DEFAULT 'completed',
    created_at timestamptz DEFAULT now()
);

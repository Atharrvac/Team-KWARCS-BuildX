-- ============================================
-- MARKETPLACE TABLE - COMPLETE FIXED VERSION
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing table if you want to recreate (CAREFUL - deletes data!)
-- DROP TABLE IF EXISTS public.marketplace_listings CASCADE;

-- Create marketplace listings table with ALL required columns
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  seller_name TEXT NOT NULL,
  crop TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  location TEXT,
  description TEXT,
  quality_grade TEXT DEFAULT 'A',
  contact_phone TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='marketplace_listings' AND column_name='quality_grade') THEN
    ALTER TABLE public.marketplace_listings ADD COLUMN quality_grade TEXT DEFAULT 'A';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='marketplace_listings' AND column_name='contact_phone') THEN
    ALTER TABLE public.marketplace_listings ADD COLUMN contact_phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='marketplace_listings' AND column_name='image_url') THEN
    ALTER TABLE public.marketplace_listings ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can create listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.marketplace_listings;

-- Create policies
CREATE POLICY "Anyone can view active listings" 
  ON public.marketplace_listings FOR SELECT 
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Users can create listings" 
  ON public.marketplace_listings FOR INSERT 
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own listings" 
  ON public.marketplace_listings FOR UPDATE 
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete own listings" 
  ON public.marketplace_listings FOR DELETE 
  USING (auth.uid() = seller_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_crop ON public.marketplace_listings(crop);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_created ON public.marketplace_listings(created_at DESC);

-- ============================================
-- DONE! Marketplace table is ready.
-- Test with: SELECT * FROM marketplace_listings;
-- ============================================

-- ============================================
-- MARKETPLACE TABLE FOR REAL-TIME TRADING
-- Run this in Supabase SQL Editor
-- ============================================

-- Create marketplace listings table
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  crop TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit TEXT DEFAULT 'quintal',
  price DECIMAL NOT NULL,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view active listings
CREATE POLICY "Anyone can view active listings" 
  ON public.marketplace_listings FOR SELECT 
  USING (status = 'active' OR seller_id = auth.uid());

-- Allow users to create their own listings
CREATE POLICY "Users can create listings" 
  ON public.marketplace_listings FOR INSERT 
  WITH CHECK (auth.uid() = seller_id);

-- Allow users to update their own listings
CREATE POLICY "Users can update own listings" 
  ON public.marketplace_listings FOR UPDATE 
  USING (auth.uid() = seller_id);

-- Allow users to delete their own listings
CREATE POLICY "Users can delete own listings" 
  ON public.marketplace_listings FOR DELETE 
  USING (auth.uid() = seller_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_crop ON public.marketplace_listings(crop);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON public.marketplace_listings(seller_id);

-- ============================================
-- DONE! Marketplace table is ready.
-- ============================================

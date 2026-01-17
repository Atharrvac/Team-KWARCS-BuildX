-- =====================================================
-- 🚨 RUN THIS SQL IN SUPABASE SQL EDITOR NOW! 🚨
-- =====================================================
-- Go to: Supabase Dashboard → SQL Editor → New Query
-- Paste this ENTIRE file and click RUN
-- =====================================================

-- Step 1: Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  seller_name TEXT NOT NULL DEFAULT 'Anonymous',
  crop TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  quality_grade TEXT DEFAULT 'A',
  contact_phone TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add any missing columns (safe to run multiple times)
DO $$ 
BEGIN
  -- Add quality_grade if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'marketplace_listings' AND column_name = 'quality_grade') 
  THEN
    ALTER TABLE public.marketplace_listings ADD COLUMN quality_grade TEXT DEFAULT 'A';
  END IF;
  
  -- Add contact_phone if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'marketplace_listings' AND column_name = 'contact_phone') 
  THEN
    ALTER TABLE public.marketplace_listings ADD COLUMN contact_phone TEXT DEFAULT '';
  END IF;
  
  -- Add image_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'marketplace_listings' AND column_name = 'image_url') 
  THEN
    ALTER TABLE public.marketplace_listings ADD COLUMN image_url TEXT DEFAULT '';
  END IF;
  
  -- Add description if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'marketplace_listings' AND column_name = 'description') 
  THEN
    ALTER TABLE public.marketplace_listings ADD COLUMN description TEXT DEFAULT '';
  END IF;
END $$;

-- Step 3: Enable Row Level Security
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can create listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can update own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.marketplace_listings;

-- Step 5: Create new policies
-- Allow anyone to read active listings
CREATE POLICY "Anyone can view active listings" 
  ON public.marketplace_listings 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to create listings
CREATE POLICY "Users can create listings" 
  ON public.marketplace_listings 
  FOR INSERT 
  WITH CHECK (auth.uid() = seller_id);

-- Allow users to update their own listings
CREATE POLICY "Users can update own listings" 
  ON public.marketplace_listings 
  FOR UPDATE 
  USING (auth.uid() = seller_id);

-- Allow users to delete their own listings
CREATE POLICY "Users can delete own listings" 
  ON public.marketplace_listings 
  FOR DELETE 
  USING (auth.uid() = seller_id);

-- Step 6: Enable realtime (optional but recommended)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_created ON public.marketplace_listings(created_at DESC);

-- =====================================================
-- ✅ VERIFICATION - Check if everything is set up
-- =====================================================

-- Show all columns in the table
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'marketplace_listings'
ORDER BY ordinal_position;

-- Show all policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'marketplace_listings';

-- =====================================================
-- 🎉 DONE! Now go back to the app and try creating a listing!
-- =====================================================

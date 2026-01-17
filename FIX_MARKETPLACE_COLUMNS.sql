-- ============================================
-- FIX MARKETPLACE LISTINGS TABLE
-- Run this in Supabase SQL Editor NOW
-- ============================================

-- 1. Add images array column (for multiple images)
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS images TEXT[];

-- 2. Add video_url column
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. Make sure image_url column exists
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Make sure all other columns exist
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS quality_grade TEXT;

ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 5. Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_listings'
ORDER BY ordinal_position;

-- ============================================
-- STORAGE BUCKETS SETUP
-- Go to Supabase Dashboard > Storage and create:
-- 1. Bucket: marketplace-images (Public: Yes)
-- 2. Bucket: marketplace-videos (Public: Yes)
-- ============================================

-- 6. Storage policies for images bucket (run after creating bucket)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('marketplace-images', 'marketplace-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('marketplace-videos', 'marketplace-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Allow uploads to images bucket
DROP POLICY IF EXISTS "Allow uploads to marketplace-images" ON storage.objects;
CREATE POLICY "Allow uploads to marketplace-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketplace-images');

-- 8. Allow public read from images bucket
DROP POLICY IF EXISTS "Allow public read marketplace-images" ON storage.objects;
CREATE POLICY "Allow public read marketplace-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace-images');

-- 9. Allow uploads to videos bucket
DROP POLICY IF EXISTS "Allow uploads to marketplace-videos" ON storage.objects;
CREATE POLICY "Allow uploads to marketplace-videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketplace-videos');

-- 10. Allow public read from videos bucket
DROP POLICY IF EXISTS "Allow public read marketplace-videos" ON storage.objects;
CREATE POLICY "Allow public read marketplace-videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace-videos');

-- ============================================
-- DONE! Now you can create listings with:
-- - Multiple images (1-5)
-- - Video (max 20 sec)
-- ============================================

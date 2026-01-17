-- ============================================
-- ADD VIDEO AND MULTIPLE IMAGES SUPPORT
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add images array column (for multiple images)
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 2. Add video_url column
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. Create storage bucket for videos (if not exists)
-- Go to Supabase Dashboard > Storage > Create new bucket
-- Name: marketplace-videos
-- Public: Yes

-- 4. Set up storage policies for videos bucket
-- Run these after creating the bucket:

-- Allow authenticated users to upload videos
CREATE POLICY "Allow authenticated uploads to videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketplace-videos');

-- Allow public read access to videos
CREATE POLICY "Allow public read access to videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketplace-videos');

-- Allow users to delete their own videos
CREATE POLICY "Allow users to delete own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'marketplace-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- VERIFY CHANGES
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketplace_listings' 
AND column_name IN ('images', 'video_url');

-- ============================================
-- DONE! Now sellers can upload:
-- - 1-5 images (stored in images array)
-- - 1 video (max 20 sec, stored in video_url)
-- ============================================

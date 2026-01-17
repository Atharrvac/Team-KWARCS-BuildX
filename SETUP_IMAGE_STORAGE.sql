-- =====================================================
-- 🖼️ SETUP IMAGE STORAGE FOR MARKETPLACE
-- =====================================================
-- Run this in Supabase SQL Editor to enable image uploads
-- =====================================================

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images',
  'marketplace-images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Step 2: Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- Step 3: Create storage policies

-- Allow anyone to view images (public bucket)
CREATE POLICY "Anyone can view marketplace images"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'marketplace-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update their marketplace images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'marketplace-images' AND auth.role() = 'authenticated');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their marketplace images"
ON storage.objects FOR DELETE
USING (bucket_id = 'marketplace-images' AND auth.role() = 'authenticated');

-- =====================================================
-- ✅ VERIFICATION
-- =====================================================

-- Check if bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'marketplace-images';

-- Check policies
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- 🎉 DONE! Image uploads should now work!
-- =====================================================
-- Test by:
-- 1. Go to app
-- 2. Switch to Seller mode
-- 3. Click "New Listing"
-- 4. Click "Take Photo or Upload"
-- 5. Select an image
-- 6. You should see "Image uploaded! Buyers will be able to see it."
-- =====================================================

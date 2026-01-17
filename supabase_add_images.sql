-- ============================================
-- ADD IMAGE AND MORE DETAILS TO MARKETPLACE
-- Run this in Supabase SQL Editor
-- ============================================

-- Add image_url column for product images
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add quality grade
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS quality_grade TEXT;

-- Add harvest_date
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS harvest_date DATE;

-- Add contact_phone
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- ============================================
-- DONE! Marketplace now supports images and more details
-- ============================================

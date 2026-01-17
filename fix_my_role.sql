-- ============================================
-- CHECK AND FIX YOUR ROLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check all users and their roles
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Step 2: Update YOUR role to buyer_seller
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles 
SET role = 'buyer_seller' 
WHERE email = 'your-email@example.com';

-- Step 3: Verify the change
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE email = 'your-email@example.com';

-- ============================================
-- After running this, close and reopen the app
-- You should see the buyer/seller dashboard
-- ============================================

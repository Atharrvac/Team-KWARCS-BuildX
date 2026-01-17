-- Run this in Supabase SQL Editor to update contracts table

-- Add new columns
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS seller_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location TEXT;

-- Drop old restrictive policy
DROP POLICY IF EXISTS contracts_select ON contracts;

-- Create new policy that allows everyone to see active contracts
CREATE POLICY contracts_select ON contracts FOR SELECT USING (
  user_id = auth.uid()::text OR status = 'active'
);

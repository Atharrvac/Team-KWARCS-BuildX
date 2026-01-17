-- Run this in Supabase SQL Editor
-- This allows ALL authenticated users (buyers) to see ALL contracts in real-time

-- First, add seller_name and location columns if they don't exist
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Drop existing restrictive policies
DROP POLICY IF EXISTS contracts_select ON contracts;
DROP POLICY IF EXISTS contracts_insert ON contracts;
DROP POLICY IF EXISTS contracts_update ON contracts;
DROP POLICY IF EXISTS contracts_delete ON contracts;

-- NEW POLICY: Allow ALL authenticated users to READ all contracts (for buyers)
CREATE POLICY contracts_select ON contracts 
  FOR SELECT 
  USING (true);  -- Everyone can see all contracts

-- Only contract owner can INSERT their own contracts
CREATE POLICY contracts_insert ON contracts 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid()::text);

-- Only contract owner can UPDATE their own contracts
CREATE POLICY contracts_update ON contracts 
  FOR UPDATE 
  USING (user_id = auth.uid()::text);

-- Only contract owner can DELETE their own contracts
CREATE POLICY contracts_delete ON contracts 
  FOR DELETE 
  USING (user_id = auth.uid()::text);

-- Enable Realtime for contracts table (IMPORTANT for live updates!)
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;

-- Verify the setup
SELECT 'RLS policies updated! All buyers can now see all contracts in real-time.' as status;

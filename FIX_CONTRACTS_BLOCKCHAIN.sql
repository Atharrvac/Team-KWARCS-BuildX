-- Run this in Supabase SQL Editor to add blockchain columns to contracts table

-- Add missing columns for blockchain integration
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS blockchain_contract_id BIGINT;

-- Update RLS policies to allow buyers to view all contracts
DROP POLICY IF EXISTS contracts_select ON contracts;
DROP POLICY IF EXISTS "contracts_select_all" ON contracts;

-- Allow all authenticated users to view all contracts (for marketplace)
CREATE POLICY "contracts_select_all" ON contracts 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow users to insert their own contracts
DROP POLICY IF EXISTS contracts_insert ON contracts;
CREATE POLICY "contracts_insert_own" ON contracts 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid()::text);

-- Allow users to update their own contracts
DROP POLICY IF EXISTS contracts_update ON contracts;
DROP POLICY IF EXISTS "Users can update their own contracts" ON contracts;
CREATE POLICY "contracts_update_own" ON contracts 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid()::text);

-- Allow users to delete their own contracts
DROP POLICY IF EXISTS contracts_delete ON contracts;
DROP POLICY IF EXISTS "Users can delete their own contracts" ON contracts;
CREATE POLICY "contracts_delete_own" ON contracts 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid()::text);

-- Enable realtime for contracts table
ALTER PUBLICATION supabase_realtime ADD TABLE contracts;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contracts' 
ORDER BY ordinal_position;

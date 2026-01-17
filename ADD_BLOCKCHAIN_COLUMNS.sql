-- Add blockchain columns to contracts table
-- Run this in Supabase SQL Editor

-- Add blockchain_verified column
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;

-- Add blockchain_contract_id column
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS blockchain_contract_id TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_contracts_blockchain_verified 
ON contracts(blockchain_verified);

-- Update existing contracts to have blockchain_verified = true (for demo)
UPDATE contracts 
SET blockchain_verified = true 
WHERE contract_hash IS NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name IN ('blockchain_verified', 'blockchain_contract_id', 'contract_hash');

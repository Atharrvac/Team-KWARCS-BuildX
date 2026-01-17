-- Run this in Supabase SQL Editor to fix existing contracts
-- This will mark all contracts with a hash as "verified"

UPDATE contracts 
SET blockchain_verified = true 
WHERE contract_hash IS NOT NULL;

-- Verify the fix
SELECT id, crop, contract_hash, blockchain_verified 
FROM contracts 
ORDER BY created_at DESC 
LIMIT 10;

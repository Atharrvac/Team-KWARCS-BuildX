-- ============================================
-- BLOCKCHAIN INTEGRATION - DATABASE SETUP
-- ============================================
-- Run this ENTIRE script in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- Step 1: Add blockchain columns to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS blockchain_contract_id TEXT;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS blockchain_block_number BIGINT;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS blockchain_network TEXT DEFAULT 'polygon_mumbai';

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS blockchain_wallet_address TEXT;

-- Step 2: Create index for faster blockchain queries
CREATE INDEX IF NOT EXISTS idx_contracts_blockchain_verified 
ON contracts(blockchain_verified);

CREATE INDEX IF NOT EXISTS idx_contracts_blockchain_tx_hash 
ON contracts(blockchain_tx_hash);

-- Step 3: Update existing contracts to mark as blockchain verified (for demo)
UPDATE contracts 
SET blockchain_verified = true 
WHERE contract_hash IS NOT NULL 
AND blockchain_verified IS NULL;

-- Step 4: Create blockchain_transactions table for audit trail
CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  tx_hash TEXT NOT NULL,
  tx_type TEXT NOT NULL, -- 'create', 'sign', 'execute', 'cancel'
  block_number BIGINT,
  gas_used BIGINT,
  gas_price TEXT,
  network TEXT DEFAULT 'polygon_mumbai',
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Step 5: Enable RLS on blockchain_transactions
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for blockchain_transactions
CREATE POLICY "Users can view their own blockchain transactions"
ON blockchain_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blockchain transactions"
ON blockchain_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Step 7: Create function to log blockchain transaction
CREATE OR REPLACE FUNCTION log_blockchain_transaction(
  p_contract_id UUID,
  p_tx_hash TEXT,
  p_tx_type TEXT,
  p_block_number BIGINT DEFAULT NULL,
  p_gas_used BIGINT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  INSERT INTO blockchain_transactions (
    contract_id, 
    user_id, 
    tx_hash, 
    tx_type, 
    block_number, 
    gas_used,
    status
  )
  VALUES (
    p_contract_id,
    auth.uid(),
    p_tx_hash,
    p_tx_type,
    p_block_number,
    p_gas_used,
    'confirmed'
  )
  RETURNING id INTO v_tx_id;
  
  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Verify the setup
SELECT 
  'contracts table columns' as check_type,
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND column_name LIKE 'blockchain%'
ORDER BY column_name;

-- Step 9: Check if blockchain_transactions table exists
SELECT 
  'blockchain_transactions table' as check_type,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'blockchain_transactions';

-- ============================================
-- SUCCESS! Your database is now ready for blockchain integration
-- ============================================

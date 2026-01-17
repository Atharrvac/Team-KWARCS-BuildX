-- Run this in Supabase SQL Editor

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  crop VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  locked_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  hedge_type VARCHAR(20) DEFAULT 'Long',
  status VARCHAR(20) DEFAULT 'active',
  expiry_date DATE,
  contract_hash VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS contracts_select ON contracts;
DROP POLICY IF EXISTS contracts_insert ON contracts;
DROP POLICY IF EXISTS contracts_update ON contracts;
DROP POLICY IF EXISTS contracts_delete ON contracts;

-- Create policies
CREATE POLICY contracts_select ON contracts FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY contracts_insert ON contracts FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY contracts_update ON contracts FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY contracts_delete ON contracts FOR DELETE USING (user_id = auth.uid()::text);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE POLICY "Users can update their own contracts"
  ON contracts FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own contracts"
  ON contracts FOR DELETE
  USING (user_id = auth.uid()::text);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

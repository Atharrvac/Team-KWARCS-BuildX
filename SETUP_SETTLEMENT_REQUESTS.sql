-- Settlement Requests Table for Real-time Contract Settlement
-- Run this in Supabase SQL Editor

-- Create settlement_requests table
CREATE TABLE IF NOT EXISTS settlement_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  buyer_name TEXT,
  farmer_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id)
);

-- Enable RLS
ALTER TABLE settlement_requests ENABLE ROW LEVEL SECURITY;

-- Policies for settlement_requests
CREATE POLICY "Users can view their own settlement requests"
  ON settlement_requests FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

CREATE POLICY "Buyers can create settlement requests"
  ON settlement_requests FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Farmers can update settlement requests for their contracts"
  ON settlement_requests FOR UPDATE
  USING (auth.uid() = farmer_id);

-- Allow anonymous access for development (remove in production)
CREATE POLICY "Allow anonymous read" ON settlement_requests FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON settlement_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON settlement_requests FOR UPDATE USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settlement_requests_contract ON settlement_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_farmer ON settlement_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_buyer ON settlement_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_status ON settlement_requests(status);

-- Grant permissions
GRANT ALL ON settlement_requests TO anon;
GRANT ALL ON settlement_requests TO authenticated;

SELECT 'Settlement requests table created successfully!' as status;

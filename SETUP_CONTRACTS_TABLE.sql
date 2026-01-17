
-- Drop existing table
DROP TABLE IF EXISTS public.contracts CASCADE;

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  crop VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  locked_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'active',
  type VARCHAR(50) DEFAULT 'futures',
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  settled_date TIMESTAMPTZ,
  pnl DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Allow all access for demo
CREATE POLICY "Allow all for demo" ON public.contracts FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_crop ON public.contracts(crop);
CREATE INDEX idx_contracts_created_at ON public.contracts(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;

-- Grant permissions
GRANT ALL ON public.contracts TO authenticated;
GRANT ALL ON public.contracts TO anon;

-- Verify
SELECT 'contracts table created!' as status;

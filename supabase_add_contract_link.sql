-- ============================================
-- ADD CONTRACT LINK TO MARKETPLACE
-- Run this in Supabase SQL Editor
-- ============================================

-- Add contract_id column to link marketplace listings with contracts
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS contract_id UUID;

-- Add contract_type to know if it's a buy or sell contract
ALTER TABLE public.marketplace_listings 
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'sell' CHECK (contract_type IN ('buy', 'sell'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_contract_id ON public.marketplace_listings(contract_id);

-- ============================================
-- DONE! Now marketplace listings can be linked to contracts
-- ============================================

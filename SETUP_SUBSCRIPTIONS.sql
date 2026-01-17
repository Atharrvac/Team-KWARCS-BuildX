-- =====================================================
-- SUBSCRIPTIONS & PAYMENTS TABLES FOR AGRISURE
-- Production Ready - Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'superseded', 'paused')),
  
  -- Payment details
  amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT DEFAULT 'upi',
  
  -- Razorpay/UPI references (nullable for manual payments)
  razorpay_subscription_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  
  -- Dates
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create payments table (transaction history)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Payment identifiers
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'failed', 'refunded')),
  plan_id TEXT,
  payment_method TEXT DEFAULT 'upi',
  
  -- Metadata
  receipt_url TEXT,
  notes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 4. Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create own payments" ON payments;

-- 6. RLS Policies for subscriptions
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can create own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions (for cancellation)
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. RLS Policies for payments
-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger for updated_at
DROP TRIGGER IF EXISTS subscription_updated_at ON subscriptions;
CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_timestamp();

-- 10. Function to auto-expire subscriptions (run daily via cron)
CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 11. View for subscription analytics (admin use)
CREATE OR REPLACE VIEW subscription_stats AS
SELECT 
  plan_id,
  status,
  COUNT(*) as subscription_count,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_revenue
FROM subscriptions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY plan_id, status
ORDER BY plan_id, status;

-- 12. View for payment analytics
CREATE OR REPLACE VIEW payment_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  plan_id,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount,
  COUNT(CASE WHEN status = 'captured' THEN 1 END) as successful_payments,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments
FROM payments
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), plan_id
ORDER BY date DESC;

-- =====================================================
-- VERIFICATION: Check tables created successfully
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Subscriptions table created';
  RAISE NOTICE '✅ Payments table created';
  RAISE NOTICE '✅ Indexes created';
  RAISE NOTICE '✅ RLS policies applied';
  RAISE NOTICE '✅ Triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Run these queries to verify:';
  RAISE NOTICE '   SELECT COUNT(*) FROM subscriptions;';
  RAISE NOTICE '   SELECT COUNT(*) FROM payments;';
  RAISE NOTICE '   SELECT * FROM subscription_stats;';
END $$;

-- Show table counts
SELECT 'subscriptions' as table_name, COUNT(*) as rows FROM subscriptions
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as rows FROM payments;

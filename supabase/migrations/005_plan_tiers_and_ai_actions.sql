-- Migration 005: Plan tiers and AI action tracking
-- Date: 2026-03-28
-- Purpose: Support multi-tier pricing and AI action metering

-- Add plan tier and AI feature columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'starter';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_actions_daily_limit INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_forwarding_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_forwarding_address TEXT UNIQUE;

-- AI action log
CREATE TABLE IF NOT EXISTS ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'sonnet',
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_cents NUMERIC(10,4) DEFAULT 0,
  source TEXT DEFAULT 'manual',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily action counter for fast lookups
CREATE TABLE IF NOT EXISTS ai_action_daily_counts (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  action_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- Overage buckets
CREATE TABLE IF NOT EXISTS ai_action_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  actions_total INTEGER DEFAULT 600,
  actions_remaining INTEGER DEFAULT 600,
  expires_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT
);

-- Enable RLS on new tables
ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_daily_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_buckets ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see their own data
CREATE POLICY "Users can view own ai_actions" ON ai_actions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own daily counts" ON ai_action_daily_counts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own buckets" ON ai_action_buckets
  FOR SELECT USING (user_id = auth.uid());

-- Service role can insert/update (for API routes)
CREATE POLICY "Service can manage ai_actions" ON ai_actions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service can manage daily counts" ON ai_action_daily_counts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service can manage buckets" ON ai_action_buckets
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast daily count lookups
CREATE INDEX IF NOT EXISTS idx_ai_actions_user_date ON ai_actions (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_daily_counts_lookup ON ai_action_daily_counts (user_id, date);

-- Migration 004: Add Stripe billing and subscription columns to users table
-- Required for the signup flow, Stripe integration, and account provisioning

-- Add profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_name TEXT;

-- Add Stripe billing fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'solo';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_ended_at TIMESTAMPTZ;

-- Index for Stripe lookups (webhook handler uses these)
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users (subscription_status);

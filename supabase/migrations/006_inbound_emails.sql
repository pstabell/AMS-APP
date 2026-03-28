-- Migration 006: Inbound email tracking for statement auto-processing
-- Date: 2026-03-28
-- Purpose: Track emails received from agents' forwarded carrier statements

CREATE TABLE IF NOT EXISTS inbound_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_address TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',
  -- 'pending', 'processing', 'completed', 'failed', 'no_attachment'
  attachment_count INTEGER DEFAULT 0,
  processed_statement_id UUID,
  error_message TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inbound emails" ON inbound_emails
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can manage inbound emails" ON inbound_emails
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_inbound_emails_user ON inbound_emails (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_status ON inbound_emails (status);

-- Reconciliation Matches table
-- This table stores confirmed matches between uploaded statement rows and existing policies
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to the matched policy
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  
  -- Details from the original statement row that was matched
  statement_customer TEXT NOT NULL,
  statement_policy_number TEXT,
  statement_carrier TEXT,
  statement_premium NUMERIC(12, 2) NOT NULL DEFAULT 0,
  statement_commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
  statement_effective_date TEXT,
  
  -- Metadata
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_score INTEGER DEFAULT 0,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_user_id ON reconciliation_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_policy_id ON reconciliation_matches(policy_id);

-- RLS Policies for reconciliation_matches
ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY reconciliation_matches_select ON reconciliation_matches FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY reconciliation_matches_insert ON reconciliation_matches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY reconciliation_matches_update ON reconciliation_matches FOR UPDATE 
  USING (auth.uid() = user_id);
  
CREATE POLICY reconciliation_matches_delete ON reconciliation_matches FOR DELETE 
  USING (auth.uid() = user_id);
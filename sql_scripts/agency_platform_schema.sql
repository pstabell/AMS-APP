-- Agency Platform Schema Migration
-- This adds multi-tenant support to existing commission tracker database
-- Created: 2025-10-09
-- Branch: agency-platform

-- ============================================
-- 1. ADD AGENCY COLUMNS TO EXISTING POLICIES TABLE
-- ============================================

-- Add agency-related columns to policies table
ALTER TABLE policies
ADD COLUMN IF NOT EXISTS agency_id TEXT,
ADD COLUMN IF NOT EXISTS agent_id TEXT,
ADD COLUMN IF NOT EXISTS agent_name TEXT;

-- Add index for faster agency queries
CREATE INDEX IF NOT EXISTS idx_policies_agency_id ON policies(agency_id);
CREATE INDEX IF NOT EXISTS idx_policies_agent_id ON policies(agent_id);

-- ============================================
-- 2. CREATE AGENCIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agencies (
    id TEXT PRIMARY KEY,
    agency_name TEXT NOT NULL,
    owner_email TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB DEFAULT '{
        "commission_rules": {
            "new_business": 0.50,
            "renewal": 0.25,
            "service": 0.10
        },
        "features": {
            "agent_rankings": true,
            "white_label": false,
            "api_access": false
        }
    }'::jsonb
);

-- Index for faster owner lookup
CREATE INDEX IF NOT EXISTS idx_agencies_owner_email ON agencies(owner_email);

-- ============================================
-- 3. CREATE AGENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    agency_id TEXT REFERENCES agencies(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'agent' CHECK (role IN ('agent', 'manager', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_agents_agency_id ON agents(agency_id);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);

-- ============================================
-- 4. CREATE AGENCY INTEGRATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agency_integrations (
    id SERIAL PRIMARY KEY,
    agency_id TEXT REFERENCES agencies(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL, -- 'applied_epic', 'quickbooks', etc.
    is_enabled BOOLEAN DEFAULT TRUE,
    credentials_encrypted TEXT, -- Store encrypted API keys/tokens
    sync_frequency TEXT DEFAULT 'daily', -- 'realtime', 'hourly', 'daily', 'manual'
    last_sync_at TIMESTAMP,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(agency_id, integration_type)
);

-- Index for faster agency lookup
CREATE INDEX IF NOT EXISTS idx_agency_integrations_agency_id ON agency_integrations(agency_id);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on policies table
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Policy: Solo agents see only their own policies (where agency_id IS NULL)
CREATE POLICY "solo_agents_see_own_policies" ON policies
    FOR SELECT
    USING (
        agency_id IS NULL
        AND user_email = current_setting('app.current_user_email', TRUE)
    );

-- Policy: Agency agents see only their assigned policies
CREATE POLICY "agency_agents_see_own_policies" ON policies
    FOR SELECT
    USING (
        agent_id = current_setting('app.current_agent_id', TRUE)
    );

-- Policy: Agency admins/managers see all policies in their agency
CREATE POLICY "agency_admins_see_all_policies" ON policies
    FOR SELECT
    USING (
        agency_id IN (
            SELECT id FROM agencies
            WHERE owner_email = current_setting('app.current_user_email', TRUE)
        )
    );

-- Enable RLS on agencies table
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_agencies" ON agencies
    FOR ALL
    USING (owner_email = current_setting('app.current_user_email', TRUE));

-- Enable RLS on agents table
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_owners_manage_agents" ON agents
    FOR ALL
    USING (
        agency_id IN (
            SELECT id FROM agencies
            WHERE owner_email = current_setting('app.current_user_email', TRUE)
        )
    );

-- ============================================
-- 6. DEMO DATA (FOR DEMO MODE)
-- ============================================

-- Insert demo agency
INSERT INTO agencies (id, agency_name, owner_email, is_demo, settings)
VALUES (
    'demo_agency_001',
    'Demo Insurance Agency',
    'demo@example.com',
    TRUE,
    '{
        "commission_rules": {
            "new_business": 0.50,
            "renewal": 0.25,
            "service": 0.10
        },
        "features": {
            "agent_rankings": true,
            "white_label": false,
            "api_access": false
        },
        "integrations": ["Applied Epic", "QuickBooks", "HubSpot"]
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Insert demo agents
INSERT INTO agents (id, agency_id, agent_name, email, role)
VALUES
    ('demo_agent_001', 'demo_agency_001', 'John Smith', 'john@demoagency.com', 'agent'),
    ('demo_agent_002', 'demo_agency_001', 'Sarah Johnson', 'sarah@demoagency.com', 'agent'),
    ('demo_agent_003', 'demo_agency_001', 'Mike Davis', 'mike@demoagency.com', 'manager')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to get agency ID for a user
CREATE OR REPLACE FUNCTION get_user_agency_id(p_email TEXT)
RETURNS TEXT AS $$
    SELECT id FROM agencies WHERE owner_email = p_email LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Function to check if user is agency owner
CREATE OR REPLACE FUNCTION is_agency_owner(p_email TEXT)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(SELECT 1 FROM agencies WHERE owner_email = p_email);
$$ LANGUAGE SQL STABLE;

-- Function to get agent count for agency
CREATE OR REPLACE FUNCTION get_agency_agent_count(p_agency_id TEXT)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER FROM agents WHERE agency_id = p_agency_id AND is_active = TRUE;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables exist
SELECT
    'agencies' as table_name,
    COUNT(*) as record_count
FROM agencies
UNION ALL
SELECT
    'agents' as table_name,
    COUNT(*) as record_count
FROM agents;

-- Create agent_notification_preferences table for Sprint 5 - Task 5.2
-- This table stores email notification preferences for agents

CREATE TABLE IF NOT EXISTS agent_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    commission_statement_email BOOLEAN DEFAULT TRUE,
    critical_renewal_email BOOLEAN DEFAULT TRUE,
    achievement_email BOOLEAN DEFAULT TRUE,
    discrepancy_email BOOLEAN DEFAULT TRUE,
    digest_day VARCHAR(20) DEFAULT 'monday',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_agent
        FOREIGN KEY (agent_id)
        REFERENCES agents(id)
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_notification_preferences_agent_id ON agent_notification_preferences(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_notification_preferences_email_enabled ON agent_notification_preferences(email_enabled);
CREATE INDEX IF NOT EXISTS idx_agent_notification_preferences_digest_day ON agent_notification_preferences(digest_day);

-- Add RLS (Row Level Security) policies
ALTER TABLE agent_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can only view their own preferences
CREATE POLICY agent_notification_preferences_select_policy ON agent_notification_preferences
    FOR SELECT
    USING (agent_id = current_setting('app.current_agent_id')::UUID);

-- Policy: Agents can update their own preferences
CREATE POLICY agent_notification_preferences_update_policy ON agent_notification_preferences
    FOR UPDATE
    USING (agent_id = current_setting('app.current_agent_id')::UUID);

-- Policy: Agents can insert their own preferences
CREATE POLICY agent_notification_preferences_insert_policy ON agent_notification_preferences
    FOR INSERT
    WITH CHECK (agent_id = current_setting('app.current_agent_id')::UUID);

COMMENT ON TABLE agent_notification_preferences IS 'Stores email notification preferences for agents';
COMMENT ON COLUMN agent_notification_preferences.email_enabled IS 'Master switch for all email notifications';
COMMENT ON COLUMN agent_notification_preferences.weekly_digest IS 'Receive weekly performance digest emails';
COMMENT ON COLUMN agent_notification_preferences.commission_statement_email IS 'Receive emails when new commission statements are available';
COMMENT ON COLUMN agent_notification_preferences.critical_renewal_email IS 'Receive emails for critical renewals (past due or due soon)';
COMMENT ON COLUMN agent_notification_preferences.achievement_email IS 'Receive emails when badges/achievements are earned';
COMMENT ON COLUMN agent_notification_preferences.discrepancy_email IS 'Receive emails when commission discrepancies are resolved';
COMMENT ON COLUMN agent_notification_preferences.digest_day IS 'Day of week to receive weekly digest: monday, tuesday, wednesday, thursday, friday, saturday, sunday';

-- Create agent_notifications table for Sprint 5
-- This table stores in-app notifications for agents

CREATE TABLE IF NOT EXISTS agent_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'normal',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_agent
        FOREIGN KEY (agent_id)
        REFERENCES agents(id)
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_id ON agent_notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_read ON agent_notifications(read);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_type ON agent_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_created_at ON agent_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_priority ON agent_notifications(priority);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_read ON agent_notifications(agent_id, read);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_type ON agent_notifications(agent_id, notification_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can only view their own notifications
CREATE POLICY agent_notifications_select_policy ON agent_notifications
    FOR SELECT
    USING (agent_id = current_setting('app.current_agent_id')::UUID);

-- Policy: Agents can update their own notifications (mark as read/unread)
CREATE POLICY agent_notifications_update_policy ON agent_notifications
    FOR UPDATE
    USING (agent_id = current_setting('app.current_agent_id')::UUID);

-- Policy: Agents can delete their own notifications
CREATE POLICY agent_notifications_delete_policy ON agent_notifications
    FOR DELETE
    USING (agent_id = current_setting('app.current_agent_id')::UUID);

-- Policy: System can insert notifications for any agent
CREATE POLICY agent_notifications_insert_policy ON agent_notifications
    FOR INSERT
    WITH CHECK (true);

COMMENT ON TABLE agent_notifications IS 'Stores in-app notifications for agents';
COMMENT ON COLUMN agent_notifications.notification_type IS 'Type: commission_statement, renewal_due, badge_earned, agency_announcement, new_team_member';
COMMENT ON COLUMN agent_notifications.priority IS 'Priority level: critical, high, normal, low';
COMMENT ON COLUMN agent_notifications.action_url IS 'Optional URL to navigate when notification is clicked';

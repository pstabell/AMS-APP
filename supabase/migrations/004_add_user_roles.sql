-- Add user roles support for Floor 1 (Agent) vs Floor 2 (Agency/Admin) architecture
-- This migration adds role column to users table and sets up role-based access

-- Add role column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'agent' CHECK (role IN ('agent', 'agency', 'admin'));
    END IF;
END $$;

-- Update existing users to have a default role of 'agent'
UPDATE users 
SET role = 'agent' 
WHERE role IS NULL;

-- Make role column NOT NULL now that all existing records have a value
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comments for documentation
COMMENT ON COLUMN users.role IS 'User role: agent (Floor 1 - limited access), agency (Floor 2 - full access), admin (Floor 2 - admin access)';

-- Optional: Create a view for role statistics (useful for admin reporting)
CREATE OR REPLACE VIEW user_role_stats AS
SELECT 
    role,
    COUNT(*) as count,
    COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_count
FROM users 
GROUP BY role;

COMMENT ON VIEW user_role_stats IS 'Statistics on user roles and subscription status';
# SQL Migration 003: Reconciliation Matches Table

## Overview
This document provides manual execution steps for running the `003_reconciliation_matches.sql` migration on Supabase.

**Migration File Location:** `supabase/migrations/003_reconciliation_matches.sql`

## Schema Created
The migration creates a `reconciliation_matches` table with the following structure:

```sql
CREATE TABLE reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  statement_customer TEXT NOT NULL,
  statement_policy_number TEXT,
  statement_carrier TEXT,
  statement_premium NUMERIC(12, 2) NOT NULL DEFAULT 0,
  statement_commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
  statement_effective_date TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Prerequisites
1. **Supabase Project Access** - Ensure you have admin access to the Supabase project
2. **Policies Table Exists** - This table references `policies(id)` and `auth.users(id)`
3. **Previous Migrations Run** - Ensure migrations 001 and 002 have been executed

## Manual Execution Options

### Option 1: Supabase Dashboard (Recommended)
1. Navigate to your Supabase project dashboard
2. Go to "SQL Editor" in the left sidebar
3. Open the migration file (`003_reconciliation_matches.sql`)
4. Copy the entire content and paste into a new SQL query
5. Execute the query
6. Verify the table was created successfully

### Option 2: Command Line (psql)
```bash
# Using psql (if you have PostgreSQL client installed)
psql "postgresql://postgres:[PASSWORD]@[DB_HOST]:5432/postgres" -f supabase/migrations/003_reconciliation_matches.sql
```

**Connection Details:**
- Host: Found in Supabase project settings > Database > Connection string
- Password: Database password from Supabase project settings
- Port: Usually 5432

### Option 3: Supabase CLI
```bash
# If you have Supabase CLI installed and linked to the project
supabase db push
```

## Verification Steps
After running the migration, verify it was successful:

```sql
-- 1. Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'reconciliation_matches';

-- 2. Check table structure
\d reconciliation_matches

-- 3. Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reconciliation_matches';

-- 4. Check RLS policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reconciliation_matches';
```

## Security Features Included
- **Row Level Security (RLS)** enabled
- **User-specific policies** for SELECT, INSERT, UPDATE, DELETE operations
- **Proper foreign key constraints** to policies and auth.users tables
- **Performance indexes** on user_id and policy_id

## Notes
- The actual schema differs slightly from the original specification in the task description
- This implementation includes more comprehensive statement data fields
- RLS policies ensure data isolation per user
- Indexes are created for optimal query performance

## Rollback (if needed)
```sql
-- Emergency rollback if needed
DROP TABLE IF EXISTS reconciliation_matches;
```

## Environment Variables Needed
Ensure your `.env.local` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Migration completed successfully when no errors are returned and verification queries show the table exists with proper structure and policies.**
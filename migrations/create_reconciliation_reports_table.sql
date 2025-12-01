-- Migration: Create reconciliation_reports table for commission reconciliation
-- Phase 3, Sprint 5, Task 5.2: Automated Commission Reconciliation
-- Created: December 1, 2025
--
-- IMPORTANT: This table can be dropped cleanly if Task 5.2 is removed
-- Rollback: DROP TABLE IF EXISTS reconciliation_reports CASCADE;

-- =============================================================================
-- Reconciliation Reports Table
-- =============================================================================
-- Stores results from automated commission reconciliation
-- Each report represents one reconciliation run (agency vs carrier statement)

CREATE TABLE IF NOT EXISTS reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Agency relationship
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

    -- User who ran the reconciliation
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Period covered by this reconciliation
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Carrier information
    carrier VARCHAR(100),  -- State Farm, Progressive, Allstate, etc.

    -- Summary statistics
    total_expected INTEGER NOT NULL DEFAULT 0,  -- Expected transactions from DB
    total_in_statement INTEGER NOT NULL DEFAULT 0,  -- Transactions in carrier statement
    matched_count INTEGER NOT NULL DEFAULT 0,  -- Successfully matched
    missing_count INTEGER NOT NULL DEFAULT 0,  -- Expected but not in statement
    unexpected_count INTEGER NOT NULL DEFAULT 0,  -- In statement but not expected
    discrepancy_count INTEGER NOT NULL DEFAULT 0,  -- Matched but wrong amount

    -- Match rate (0-100)
    match_rate DECIMAL(5,2) DEFAULT 0,

    -- Financial summary
    total_expected_amount DECIMAL(12,2) DEFAULT 0,  -- Expected commission total
    total_actual_amount DECIMAL(12,2) DEFAULT 0,  -- Actual commission total
    total_difference DECIMAL(12,2) DEFAULT 0,  -- Difference (actual - expected)

    -- Full results (JSONB for detailed drill-down)
    full_results JSONB,  -- Complete reconciliation results

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Agency filter (most common query)
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_agency
ON reconciliation_reports(agency_id);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_period
ON reconciliation_reports(period_start, period_end);

-- Carrier filter
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_carrier
ON reconciliation_reports(carrier);

-- Recent reports (for dashboard)
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_created
ON reconciliation_reports(created_at DESC);

-- Low match rate (for alerts)
CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_match_rate
ON reconciliation_reports(match_rate) WHERE match_rate < 90;

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE reconciliation_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see reports from their own agency
CREATE POLICY reconciliation_reports_agency_isolation ON reconciliation_reports
    FOR SELECT
    USING (
        agency_id IN (
            SELECT agencies.id FROM agencies
            WHERE agencies.owner_user_id = auth.uid()
        )
        OR
        agency_id IN (
            SELECT agents.agency_id FROM agents
            WHERE agents.user_id = auth.uid()
        )
    );

-- Policy: Users can insert reports for their own agency
CREATE POLICY reconciliation_reports_agency_insert ON reconciliation_reports
    FOR INSERT
    WITH CHECK (
        agency_id IN (
            SELECT agencies.id FROM agencies
            WHERE agencies.owner_user_id = auth.uid()
        )
        OR
        agency_id IN (
            SELECT agents.agency_id FROM agents
            WHERE agents.user_id = auth.uid()
        )
    );

-- Policy: Users can delete reports from their own agency
CREATE POLICY reconciliation_reports_agency_delete ON reconciliation_reports
    FOR DELETE
    USING (
        agency_id IN (
            SELECT agencies.id FROM agencies
            WHERE agencies.owner_user_id = auth.uid()
        )
    );

-- =============================================================================
-- Helper Views
-- =============================================================================

-- View for recent reconciliation summary (last 90 days)
CREATE OR REPLACE VIEW recent_reconciliation_summary AS
SELECT
    r.agency_id,
    r.carrier,
    COUNT(*) as total_reconciliations,
    AVG(r.match_rate) as avg_match_rate,
    SUM(r.missing_count) as total_missing,
    SUM(r.discrepancy_count) as total_discrepancies,
    SUM(ABS(r.total_difference)) as total_amount_variance,
    MAX(r.created_at) as last_reconciliation_date
FROM reconciliation_reports r
WHERE r.created_at >= NOW() - INTERVAL '90 days'
GROUP BY r.agency_id, r.carrier;

-- =============================================================================
-- Comments for Documentation
-- =============================================================================

COMMENT ON TABLE reconciliation_reports IS
'Stores commission reconciliation reports. Each report compares expected commissions from policies vs actual carrier statements. Part of Task 5.2 (Phase 3, Sprint 5).';

COMMENT ON COLUMN reconciliation_reports.match_rate IS
'Percentage of expected transactions that were successfully matched (0-100). Low match rate (<90%) indicates issues.';

COMMENT ON COLUMN reconciliation_reports.total_difference IS
'Net difference between actual and expected commission amounts. Positive = overpaid, Negative = underpaid.';

COMMENT ON COLUMN reconciliation_reports.full_results IS
'Complete reconciliation results as JSONB. Contains matched[], missing_from_statement[], unexpected_in_statement[], amount_discrepancies[].';

-- =============================================================================
-- Sample Queries for Testing
-- =============================================================================

-- Get recent reconciliation reports for an agency
-- SELECT * FROM reconciliation_reports
-- WHERE agency_id = 'your-agency-id'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Find reconciliations with low match rates (< 90%)
-- SELECT * FROM reconciliation_reports
-- WHERE agency_id = 'your-agency-id'
-- AND match_rate < 90
-- ORDER BY match_rate ASC;

-- Get reconciliation summary by carrier (last 90 days)
-- SELECT * FROM recent_reconciliation_summary
-- WHERE agency_id = 'your-agency-id'
-- ORDER BY avg_match_rate ASC;

-- Find largest discrepancies
-- SELECT * FROM reconciliation_reports
-- WHERE agency_id = 'your-agency-id'
-- ORDER BY ABS(total_difference) DESC
-- LIMIT 10;

-- =============================================================================
-- Rollback Script (if Task 5.2 needs to be removed)
-- =============================================================================

-- Uncomment and run these lines to completely remove Task 5.2:

-- DROP VIEW IF EXISTS recent_reconciliation_summary;
-- DROP TABLE IF EXISTS reconciliation_reports CASCADE;

-- After running rollback, also delete:
-- 1. File: utils/commission_reconciliation.py
-- 2. Remove reconciliation functions from utils/agent_data_helpers.py
-- 3. Remove "Commission Reconciliation" from navigation in commission_app.py
-- 4. Set FEATURES['commission_reconciliation'] = False in config.py

-- =============================================================================
-- Migration Complete
-- =============================================================================

-- Verify table was created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'reconciliation_reports') as column_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'reconciliation_reports') as index_count
FROM information_schema.tables
WHERE table_name = 'reconciliation_reports';

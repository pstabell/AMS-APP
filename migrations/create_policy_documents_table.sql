-- Migration: Create policy_documents table for OneDrive document indexing
-- Phase 3, Sprint 5, Task 5.3: Policy Document Auto-Filing
-- Created: December 1, 2025
--
-- IMPORTANT: This table can be dropped cleanly if Task 5.3 is removed
-- Rollback: DROP TABLE IF EXISTS policy_documents CASCADE;

-- =============================================================================
-- Policy Documents Table
-- =============================================================================
-- Stores metadata and references to documents stored in OneDrive/SharePoint
-- Does NOT store the actual files (files are in client's OneDrive)
-- This table is only for indexing and fast search

CREATE TABLE IF NOT EXISTS policy_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Agency relationship
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

    -- Policy relationship (optional - may not know policy at upload time)
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,

    -- OneDrive/SharePoint information
    onedrive_file_id VARCHAR(255) NOT NULL,  -- Microsoft Graph file ID
    onedrive_path TEXT NOT NULL,  -- Full path: "AMS Documents/Clients/Smith_John/AUTO_12345/01_Declarations/2024-01-15_Declaration.pdf"
    onedrive_web_url TEXT,  -- Direct link to open in browser
    onedrive_download_url TEXT,  -- Direct download link (temporary, expires)

    -- Document metadata (extracted from PDF or manually entered)
    client_name VARCHAR(255),
    policy_number VARCHAR(100),
    carrier VARCHAR(100),
    document_type VARCHAR(50),  -- declaration, endorsement, correspondence, claim, etc.
    document_date DATE,  -- Effective date or document date

    -- Extracted content for search
    extracted_text TEXT,  -- First 500 chars from PDF for preview
    file_size_bytes INTEGER,

    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Full-text search vector (auto-generated)
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english',
            coalesce(client_name, '') || ' ' ||
            coalesce(policy_number, '') || ' ' ||
            coalesce(carrier, '') || ' ' ||
            coalesce(document_type, '') || ' ' ||
            coalesce(extracted_text, '')
        )
    ) STORED
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Agency filter (most common query)
CREATE INDEX IF NOT EXISTS idx_policy_documents_agency
ON policy_documents(agency_id);

-- Policy relationship
CREATE INDEX IF NOT EXISTS idx_policy_documents_policy
ON policy_documents(policy_id);

-- Client name search
CREATE INDEX IF NOT EXISTS idx_policy_documents_client
ON policy_documents(client_name);

-- Policy number search
CREATE INDEX IF NOT EXISTS idx_policy_documents_policy_number
ON policy_documents(policy_number);

-- Document type filter
CREATE INDEX IF NOT EXISTS idx_policy_documents_type
ON policy_documents(document_type);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_policy_documents_date
ON policy_documents(document_date);

-- Upload date (for "recent documents")
CREATE INDEX IF NOT EXISTS idx_policy_documents_uploaded
ON policy_documents(uploaded_at DESC);

-- Full-text search (most powerful)
CREATE INDEX IF NOT EXISTS idx_policy_documents_search
ON policy_documents USING GIN(search_vector);

-- OneDrive file ID (for lookups)
CREATE INDEX IF NOT EXISTS idx_policy_documents_onedrive_id
ON policy_documents(onedrive_file_id);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see documents from their own agency
CREATE POLICY policy_documents_agency_isolation ON policy_documents
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

-- Policy: Users can insert documents for their own agency
CREATE POLICY policy_documents_agency_insert ON policy_documents
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

-- Policy: Users can update documents from their own agency
CREATE POLICY policy_documents_agency_update ON policy_documents
    FOR UPDATE
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

-- Policy: Users can delete documents from their own agency
CREATE POLICY policy_documents_agency_delete ON policy_documents
    FOR DELETE
    USING (
        agency_id IN (
            SELECT agencies.id FROM agencies
            WHERE agencies.owner_user_id = auth.uid()
        )
    );

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Function to link document to policy based on policy number
CREATE OR REPLACE FUNCTION link_document_to_policy()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to find matching policy by policy number
    IF NEW.policy_number IS NOT NULL AND NEW.policy_id IS NULL THEN
        UPDATE policy_documents
        SET policy_id = (
            SELECT id FROM policies
            WHERE policy_number = NEW.policy_number
            AND agency_id = NEW.agency_id
            LIMIT 1
        )
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-link documents to policies
CREATE TRIGGER trigger_link_document_to_policy
AFTER INSERT ON policy_documents
FOR EACH ROW
EXECUTE FUNCTION link_document_to_policy();

-- =============================================================================
-- Comments for Documentation
-- =============================================================================

COMMENT ON TABLE policy_documents IS
'Indexes policy documents stored in OneDrive/SharePoint. Does not store actual files - only metadata and links. Part of Task 5.3 (Phase 3, Sprint 5).';

COMMENT ON COLUMN policy_documents.onedrive_file_id IS
'Microsoft Graph API file ID - used to retrieve/update file in OneDrive';

COMMENT ON COLUMN policy_documents.onedrive_path IS
'Full path in OneDrive, e.g., "AMS Documents/Clients/Smith_John/AUTO_12345/01_Declarations/2024-01-15_Declaration.pdf"';

COMMENT ON COLUMN policy_documents.onedrive_download_url IS
'Temporary download URL from Microsoft Graph API - expires after ~1 hour';

COMMENT ON COLUMN policy_documents.extracted_text IS
'First 500 characters extracted from PDF for preview and full-text search';

COMMENT ON COLUMN policy_documents.search_vector IS
'Full-text search vector for fast document search across all text fields';

-- =============================================================================
-- Sample Queries for Testing
-- =============================================================================

-- Search for all documents for a client
-- SELECT * FROM policy_documents
-- WHERE agency_id = 'your-agency-id'
-- AND client_name ILIKE '%Smith%'
-- ORDER BY uploaded_at DESC;

-- Full-text search across all documents
-- SELECT * FROM policy_documents
-- WHERE agency_id = 'your-agency-id'
-- AND search_vector @@ to_tsquery('english', 'auto & insurance')
-- ORDER BY uploaded_at DESC;

-- Get recent uploads
-- SELECT * FROM policy_documents
-- WHERE agency_id = 'your-agency-id'
-- ORDER BY uploaded_at DESC
-- LIMIT 20;

-- Count documents by type
-- SELECT document_type, COUNT(*) as count
-- FROM policy_documents
-- WHERE agency_id = 'your-agency-id'
-- GROUP BY document_type
-- ORDER BY count DESC;

-- =============================================================================
-- Rollback Script (if Task 5.3 needs to be removed)
-- =============================================================================

-- Uncomment and run these lines to completely remove Task 5.3:

-- DROP TRIGGER IF EXISTS trigger_link_document_to_policy ON policy_documents;
-- DROP FUNCTION IF EXISTS link_document_to_policy();
-- DROP TABLE IF EXISTS policy_documents CASCADE;

-- After running rollback, also delete:
-- 1. File: utils/onedrive_manager.py
-- 2. Remove "📁 Documents" from navigation in commission_app.py
-- 3. Remove document page handler from commission_app.py

-- =============================================================================
-- Migration Complete
-- =============================================================================

-- Verify table was created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'policy_documents') as column_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'policy_documents') as index_count
FROM information_schema.tables
WHERE table_name = 'policy_documents';

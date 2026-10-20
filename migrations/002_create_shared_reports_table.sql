-- migrations/002_create_shared_reports_table.sql
-- Persistent Shared Reports Table for ShikshaGap
-- Used for read-only gap report sharing with parents & guardians.
-- Row Level Security (RLS) is enabled; service role key bypasses RLS for server-side route handlers.

CREATE TABLE IF NOT EXISTS shared_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE,
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    first_name TEXT NOT NULL,
    class TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_shared_reports_token ON shared_reports (token);

-- Index for checking active tokens (non-revoked & non-expired)
CREATE INDEX IF NOT EXISTS idx_shared_reports_active ON shared_reports (token, revoked, expires_at);

-- Enable Row Level Security
ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;

-- Deny all direct public client-side access by default
-- Access must only happen server-side via Supabase Service Role Key
CREATE POLICY no_direct_anon_access ON shared_reports
    FOR ALL
    TO anon, authenticated
    USING (false);

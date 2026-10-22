-- Migration: 20261022000001_shared_reports.sql
-- Description: Server-side persistent storage for private, time-limited student assessment gap reports.
-- Access: Restricted strictly to server-side service role. RLS enabled with NO public access policies.

CREATE TABLE IF NOT EXISTS public.shared_reports (
    token TEXT PRIMARY KEY,
    report_data JSONB NOT NULL,
    first_name TEXT NOT NULL,
    class TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    creator_secret TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    last_viewed_at TIMESTAMPTZ
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- Revoke all direct public permissions (anon & authenticated roles cannot SELECT, INSERT, UPDATE, DELETE)
REVOKE ALL ON public.shared_reports FROM anon;
REVOKE ALL ON public.shared_reports FROM authenticated;

-- Service role has full management capabilities through server API routes
GRANT ALL ON public.shared_reports TO service_role;

-- Fast index on expiration and revocation for querying and cleanup
CREATE INDEX IF NOT EXISTS idx_shared_reports_lookup 
ON public.shared_reports (token, revoked, expires_at);

COMMENT ON TABLE public.shared_reports IS 'Server-side storage for shared formative assessment reports with 30-day expiry and revocation support.';

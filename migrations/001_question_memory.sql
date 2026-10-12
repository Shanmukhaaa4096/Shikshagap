-- migrations/001_question_memory.sql
-- Persistent Question Memory with pgvector
-- Do not run automatically; apply when provisioning PostgreSQL.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Validated Questions Table
-- Stores generated questions ONLY AFTER passing every validation and blind solver check.
-- STRICT PRIVACY INVARIANT: Never store student names, roll numbers, typed answers, or identifying telemetry.
CREATE TABLE IF NOT EXISTS validated_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade INTEGER NOT NULL CHECK (grade IN (3, 4, 5)),
    concept_id VARCHAR(64) NOT NULL,
    language VARCHAR(8) NOT NULL CHECK (language IN ('en', 'hi', 'te')),
    theme VARCHAR(128) NOT NULL,
    text TEXT NOT NULL,
    operands JSONB NOT NULL,
    embedding vector(128),
    quality_score DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    times_shown INTEGER NOT NULL DEFAULT 0,
    times_correct INTEGER NOT NULL DEFAULT 0,
    times_reported INTEGER NOT NULL DEFAULT 0,
    is_retired BOOLEAN NOT NULL DEFAULT FALSE,
    approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for semantic similarity search with pgvector (cosine distance)
CREATE INDEX IF NOT EXISTS idx_validated_questions_embedding 
ON validated_questions USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Filtering index for concept, grade, and language selection
CREATE INDEX IF NOT EXISTS idx_validated_questions_lookup
ON validated_questions (concept_id, grade, language, is_retired, approved);

-- 2. Anonymous Misconception Tallies
-- Strictly aggregate statistics: counts occurrences of misconception codes per grade/concept.
-- Zero student personal data is ever recorded.
CREATE TABLE IF NOT EXISTS anonymous_misconception_tallies (
    id SERIAL PRIMARY KEY,
    grade INTEGER NOT NULL CHECK (grade IN (3, 4, 5)),
    concept_id VARCHAR(64) NOT NULL,
    language VARCHAR(8) NOT NULL CHECK (language IN ('en', 'hi', 'te')),
    error_type VARCHAR(64) NOT NULL,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    last_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_misconception_tally UNIQUE (grade, concept_id, language, error_type)
);

-- 3. Rate Limit Counters Table
-- Ephemeral counters by client hash to prevent API abuse without logging clear IPs
CREATE TABLE IF NOT EXISTS rate_limit_counters (
    key VARCHAR(128) PRIMARY KEY,
    call_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 4. Daily Budget Counters Table
-- Tracks total daily Gemini calls globally to enforce the hard 150/day cost boundary
CREATE TABLE IF NOT EXISTS daily_budget_counters (
    call_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    call_count INTEGER NOT NULL DEFAULT 0,
    max_budget INTEGER NOT NULL DEFAULT 150
);

-- 5. Anonymous Session Summaries Table (Step 10)
-- Strictly anonymous: sessionId generated client-side, hour-precision timestamp, zero student PII.
-- 90-day retention policy: entries older than 90 days are purged by memory upkeep cron.
CREATE TABLE IF NOT EXISTS anonymous_session_summaries (
    session_id VARCHAR(64) PRIMARY KEY,
    grade INTEGER NOT NULL CHECK (grade IN (3, 4, 5)),
    language VARCHAR(8) NOT NULL CHECK (language IN ('en', 'hi', 'te')),
    hour_timestamp TIMESTAMPTZ NOT NULL,
    questions_attempted INTEGER NOT NULL DEFAULT 0,
    questions_correct INTEGER NOT NULL DEFAULT 0,
    topic_outcomes JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_summaries_created_at
ON anonymous_session_summaries (created_at);

-- 6. Anonymous Topic Outcome Tallies (Step 10)
-- Aggregate performance counts per topic status (mastered, developing, gap).
CREATE TABLE IF NOT EXISTS anonymous_topic_outcome_tallies (
    id SERIAL PRIMARY KEY,
    grade INTEGER NOT NULL CHECK (grade IN (3, 4, 5)),
    topic_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('mastered', 'developing', 'gap', 'pending')),
    count INTEGER NOT NULL DEFAULT 1,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_topic_outcome UNIQUE (grade, topic_id, status)
);

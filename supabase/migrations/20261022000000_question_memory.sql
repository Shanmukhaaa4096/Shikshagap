-- supabase/migrations/20261022000000_question_memory.sql
-- Persistent Question-Memory with pgvector for ShikshaGap
-- Enables storing validated questions, vector similarity search, and aggregate outcome counters.
-- STRICT SECURITY: Service-role only access. RLS enabled with NO public policies.
-- STRICT PRIVACY: Zero student identifiers, session tokens, or individual responses are stored.

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Question Memory Table
CREATE TABLE IF NOT EXISTS question_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    board TEXT NOT NULL,
    class INTEGER NOT NULL,
    concept_id TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'en',
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    question_text TEXT NOT NULL,
    answer_value TEXT NOT NULL,
    answer_format TEXT NOT NULL,
    template_or_source TEXT NOT NULL CHECK (template_or_source IN ('hybrid', 'gemini')),
    fingerprint TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    times_served INTEGER NOT NULL DEFAULT 0,
    times_correct INTEGER NOT NULL DEFAULT 0,
    flagged BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Indexes
-- Cosine distance index for 768-dim semantic search using HNSW
CREATE INDEX IF NOT EXISTS idx_question_memory_embedding 
ON question_memory USING hnsw (embedding vector_cosine_ops);

-- Btree index for strict board, class, concept, and difficulty filtering
CREATE INDEX IF NOT EXISTS idx_question_memory_lookup
ON question_memory (board, class, concept_id, difficulty);

-- Unique constraint index on normalized question text fingerprint
CREATE UNIQUE INDEX IF NOT EXISTS uq_question_memory_fingerprint
ON question_memory (fingerprint);

-- Flagged index for excluding retired/flagged questions
CREATE INDEX IF NOT EXISTS idx_question_memory_flagged
ON question_memory (flagged);

-- 4. Vector Match Function (Metadata filtered first, then similarity sorted)
CREATE OR REPLACE FUNCTION match_questions(
    query_embedding vector(768),
    match_board TEXT,
    match_class INTEGER,
    match_concept_id TEXT,
    difficulty_min INTEGER DEFAULT 1,
    difficulty_max INTEGER DEFAULT 5,
    match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    question_text TEXT,
    answer_value TEXT,
    answer_format TEXT,
    template_or_source TEXT,
    difficulty INTEGER,
    board TEXT,
    class INTEGER,
    concept_id TEXT,
    lang TEXT,
    times_served INTEGER,
    times_correct INTEGER,
    similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        qm.id,
        qm.question_text,
        qm.answer_value,
        qm.answer_format,
        qm.template_or_source,
        qm.difficulty,
        qm.board,
        qm.class,
        qm.concept_id,
        qm.lang,
        qm.times_served,
        qm.times_correct,
        (1.0 - (qm.embedding <=> query_embedding))::DOUBLE PRECISION AS similarity
    FROM question_memory qm
    WHERE qm.flagged = FALSE
      AND qm.board = match_board
      AND qm.class = match_class
      AND qm.concept_id = match_concept_id
      AND qm.difficulty BETWEEN difficulty_min AND difficulty_max
    ORDER BY qm.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 5. Row Level Security
-- Enabled with NO public policies so only service-role can read/write.
ALTER TABLE question_memory ENABLE ROW LEVEL SECURITY;

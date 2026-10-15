-- ShikshaGap Teacher Account & Verification Schema (001_create_teachers_table.sql)
-- Target: PostgreSQL 14+ / Supabase / Neon / Vercel Postgres

CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  institution_name VARCHAR(160) NOT NULL,
  grades_taught TEXT[] NOT NULL DEFAULT '{}',
  subjects_taught TEXT[] NOT NULL DEFAULT '{}',
  designation VARCHAR(50),
  phone VARCHAR(30) NOT NULL UNIQUE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified_at TIMESTAMPTZ,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'teacher',
  status VARCHAR(30) NOT NULL DEFAULT 'registration_incomplete',
  age INT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive lookup indexes
CREATE INDEX IF NOT EXISTS idx_teachers_email_lower ON teachers (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_teachers_phone ON teachers (phone);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers (status);

-- Verification Tokens Table (SHA-256 hashed tokens for phone OTP, email verification & password recovery)
CREATE TABLE IF NOT EXISTS verification_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL, -- 'phone', 'email', 'password_reset'
  target VARCHAR(255) NOT NULL, -- normalized phone or email
  token_hash VARCHAR(64) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_target_channel ON verification_tokens (target, channel);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens (expires_at);

-- Teacher-Scoped Classroom / Student Data Table
CREATE TABLE IF NOT EXISTS teacher_classroom_records (
  teacher_id VARCHAR(64) NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id VARCHAR(50) NOT NULL,
  student_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (teacher_id, class_id)
);

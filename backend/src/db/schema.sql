-- ==============================================================================
-- Web-Based Examination Management System - Database Schema (Supabase / PostgreSQL)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in reverse dependency order if recreating
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores credentials and roles for Administrators, Teachers, and Students
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rapid lookup during authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ------------------------------------------------------------------------------
-- 2. EXAMS TABLE
-- Stores exam metadata, duration, passing criteria, and publication state
-- ------------------------------------------------------------------------------
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    total_marks INTEGER NOT NULL DEFAULT 100 CHECK (total_marks >= 0),
    passing_marks INTEGER NOT NULL DEFAULT 40 CHECK (passing_marks >= 0),
    is_published BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for filtering published exams and exams by teacher
CREATE INDEX idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX idx_exams_is_published ON exams(is_published);
CREATE INDEX idx_exams_dates ON exams(start_date, end_date);

-- ------------------------------------------------------------------------------
-- 3. QUESTIONS TABLE
-- Stores questions associated with each exam, question types, and scoring points
-- ------------------------------------------------------------------------------
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
    points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
    options JSONB DEFAULT '[]'::jsonb, -- Array of strings e.g. ["Option A", "Option B", "Option C", "Option D"]
    correct_answer TEXT NOT NULL,      -- Secret answer key used by backend auto-grader
    explanation TEXT DEFAULT '',       -- Explanatory note shown to student during result review
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_exam_id ON questions(exam_id);

-- ------------------------------------------------------------------------------
-- 4. EXAM ATTEMPTS / RESULTS TABLE
-- Tracks student attempts, timers, submitted answers, and calculated grading
-- ------------------------------------------------------------------------------
CREATE TABLE exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'timed_out')),
    total_score NUMERIC(6, 2) DEFAULT 0,
    max_score NUMERIC(6, 2) DEFAULT 0,
    percentage NUMERIC(5, 2) DEFAULT 0,
    is_passed BOOLEAN DEFAULT FALSE,
    answers JSONB DEFAULT '{}'::jsonb,      -- Keyed by question_id: {"q-uuid": "student's answer"}
    feedback JSONB DEFAULT '[]'::jsonb,     -- Breakdown of each question's evaluation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX idx_attempts_student_id ON exam_attempts(student_id);
CREATE INDEX idx_attempts_status ON exam_attempts(status);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS) & Triggers
-- ------------------------------------------------------------------------------

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- Base Public Policies (for Service Role / backend authenticated access)
CREATE POLICY "Allow service role full access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow service role full access to exams" ON exams FOR ALL USING (true);
CREATE POLICY "Allow service role full access to questions" ON questions FOR ALL USING (true);
CREATE POLICY "Allow service role full access to attempts" ON exam_attempts FOR ALL USING (true);

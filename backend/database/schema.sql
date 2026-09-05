-- =============================================================================
-- SKILLVANTAGE AI - POSTGRESQL DATABASE SCHEMA (SIH Problem Statement 26134)
-- Student Career Intelligence Platform
-- =============================================================================

-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS student_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    education_level VARCHAR(100),
    degree VARCHAR(255),
    branch VARCHAR(255),
    college VARCHAR(255),
    graduation_year INT,
    target_role VARCHAR(255),
    preferred_location VARCHAR(255),
    linkedin VARCHAR(500),
    github VARCHAR(500),
    portfolio VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);

-- 3. RESUMES TABLE
CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    extracted_text TEXT,
    parser_version VARCHAR(50) DEFAULT '1.0.0',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'uploaded'
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);

-- 4. SKILLS MASTER TABLE
CREATE TABLE IF NOT EXISTS skills (
    id VARCHAR(50) PRIMARY KEY,
    canonical_name VARCHAR(150) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    aliases JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skills_canonical_name ON skills(canonical_name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- 5. STUDENT SKILLS RELATION
CREATE TABLE IF NOT EXISTS student_skills (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_id VARCHAR(50) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    source VARCHAR(50) DEFAULT 'resume',
    verification_status VARCHAR(50) DEFAULT 'unverified',
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_skill UNIQUE (student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_student_skills_student ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill ON student_skills(skill_id);

-- 6. SKILL EVIDENCE
CREATE TABLE IF NOT EXISTS skill_evidence (
    id VARCHAR(36) PRIMARY KEY,
    student_skill_id VARCHAR(36) NOT NULL REFERENCES student_skills(id) ON DELETE CASCADE,
    resume_id VARCHAR(36) REFERENCES resumes(id) ON DELETE CASCADE,
    source_section VARCHAR(100),
    original_text VARCHAR(255),
    evidence_text TEXT,
    confidence FLOAT DEFAULT 1.0
);

CREATE INDEX IF NOT EXISTS idx_skill_evidence_student_skill ON skill_evidence(student_skill_id);

-- 7. EDUCATION
CREATE TABLE IF NOT EXISTS education (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    degree VARCHAR(255),
    field VARCHAR(255),
    institution VARCHAR(255),
    graduation_year INT,
    cgpa FLOAT,
    percentage FLOAT
);

CREATE INDEX IF NOT EXISTS idx_education_student ON education(student_id);

-- 8. EXPERIENCE
CREATE TABLE IF NOT EXISTS experience (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    company VARCHAR(255),
    role VARCHAR(255),
    start_date VARCHAR(50),
    end_date VARCHAR(50),
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_experience_student ON experience(student_id);

-- 9. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT,
    technologies JSONB DEFAULT '[]'::jsonb,
    url VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_projects_student ON projects(student_id);

-- 10. CERTIFICATIONS
CREATE TABLE IF NOT EXISTS certifications (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255),
    issuer VARCHAR(255),
    date VARCHAR(50),
    credential_url VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_certifications_student ON certifications(student_id);

-- 11. EXTRACTION RUNS
CREATE TABLE IF NOT EXISTS extraction_runs (
    id VARCHAR(36) PRIMARY KEY,
    resume_id VARCHAR(36) NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    parser_version VARCHAR(50) DEFAULT '1.0.0',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'running',
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_extraction_runs_resume ON extraction_runs(resume_id);

CREATE TABLE IF NOT EXISTS extraction_conflicts (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    user_value TEXT,
    resume_value TEXT,
    resolution VARCHAR(100) DEFAULT 'preserved_user_input',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_extraction_conflicts_student ON extraction_conflicts(student_id);

-- =============================================================================
-- 13. RAW JOBS TABLE (Immutable staging of fetched API payloads)
-- =============================================================================
CREATE TABLE IF NOT EXISTS raw_jobs (
    id VARCHAR(36) PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    source_job_id VARCHAR(255) NOT NULL,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_jobs_source_id ON raw_jobs(source, source_job_id);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_fetched_at ON raw_jobs(fetched_at);

-- =============================================================================
-- 14. NORMALIZED JOBS TABLE (Validated, Deduplicated, Standardized)
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(36) PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    source_job_id VARCHAR(255) NOT NULL,
    canonical_role VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    country VARCHAR(10) NOT NULL,
    job_type VARCHAR(50) DEFAULT 'Full-time',
    description TEXT NOT NULL,
    salary_min FLOAT,
    salary_max FLOAT,
    currency VARCHAR(10),
    posted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    job_url VARCHAR(1000) NOT NULL,
    category VARCHAR(100),
    remote BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, REMOVED, INVALID
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_canonical_role ON jobs(canonical_role);
CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_content_hash ON jobs(content_hash);
CREATE INDEX IF NOT EXISTS idx_jobs_source_id ON jobs(source, source_job_id);

-- =============================================================================
-- 15. JOB SOURCES (Multi-source cross reference for deduplicated jobs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_sources (
    id VARCHAR(36) PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    source_job_id VARCHAR(255) NOT NULL,
    source_url VARCHAR(1000),
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_job_source UNIQUE (source, source_job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_sources_job_id ON job_sources(job_id);
CREATE INDEX IF NOT EXISTS idx_job_sources_lookup ON job_sources(source, source_job_id);

-- =============================================================================
-- 16. JOB COLLECTION ERRORS (Invalid / Malformed / Rejected Records)
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_collection_errors (
    id VARCHAR(36) PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    source_job_id VARCHAR(255),
    error_type VARCHAR(100) NOT NULL,
    error_details TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_errors_source ON job_collection_errors(source);
CREATE INDEX IF NOT EXISTS idx_job_errors_type ON job_collection_errors(error_type);

-- =============================================================================
-- 17. JOB SKILLS (Mapped from Skill Extraction Pipeline)
-- =============================================================================
CREATE TABLE IF NOT EXISTS job_skills (
    id VARCHAR(36) PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id VARCHAR(50) NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    confidence FLOAT DEFAULT 1.0,
    source_text VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_job_skill UNIQUE (job_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_job_skills_job ON job_skills(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill ON job_skills(skill_id);

-- =============================================================================
-- 18. COLLECTION RUNS (Monitoring, Audit & Health Tracker)
-- =============================================================================
CREATE TABLE IF NOT EXISTS collection_runs (
    id VARCHAR(36) PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    jobs_fetched INT DEFAULT 0,
    jobs_inserted INT DEFAULT 0,
    jobs_updated INT DEFAULT 0,
    duplicates_found INT DEFAULT 0,
    invalid_jobs INT DEFAULT 0,
    errors INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'RUNNING' -- SUCCESS, PARTIAL, FAILED
);

CREATE INDEX IF NOT EXISTS idx_collection_runs_source ON collection_runs(source);
CREATE INDEX IF NOT EXISTS idx_collection_runs_started ON collection_runs(started_at);

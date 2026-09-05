# SKILLVANTAGE AI — Student Career Intelligence Platform
> **"From Skills to Careers"** | Built for **SIH 2026 Problem Statement 26134**

*"Challenges in aligning skill development programs with industry requirements and emerging job market demands."*

SKILLVANTAGE AI bridges the gap between student competencies and evolving industry expectations. It provides a complete, deterministic, local-first Career Intelligence Platform for:
- Student registration and onboarding
- Resume upload (PDF & DOCX)
- Local deterministic resume text extraction & section segmentation
- Structured entity extraction (Personal, Education, Experience, Projects, Certifications)
- Expandable 120+ skill dictionary lookup, alias normalization, and evidence tracking
- Strict **Student Input > Resume Data** priority and conflict resolution engine
- Human-in-the-loop review and verification screen before database persistence
- PostgreSQL database schema with SQLAlchemy models
- Preparing structured profiles for future Skill Gap Analysis, Career Roadmaps, and Job Matching

---

## 🏗️ End-to-End System Architecture

```
Student
  ↓
Registration (Step 01 Account)
  ↓
Basic Profile (Step 02 Academic Info - Highest Priority)
  ↓
Resume Upload (Step 03 Drag & Drop PDF/DOCX)
  ↓
Deterministic Resume Parser (PyMuPDF & python-docx)
  ↓
Section Detection (Canonical Aliases Mapping)
  ↓
Section Segmentation (SKILLS, PROJECTS, EXPERIENCE, EDUCATION)
  ↓
Skill Extraction & Normalization (120+ Skill Dictionary)
  ↓
Conflict Detection (Student Input > Resume Extracted Data)
  ↓
Review Screen (Step 05 Confirmed vs Needs Review / Conflict Alert)
  ↓
Confirmation & Database Persistence (PostgreSQL / SQLite)
  ↓
Dashboard (Future Skill Gap & Career Roadmap Readiness)
```

---

## ⚙️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | FastAPI, Python 3.13, Uvicorn, Pydantic v2, PyJWT, Bcrypt |
| **Database** | PostgreSQL (DDL script in `backend/database/schema.sql`) / SQLite (local dev default) |
| **Parsing Engine** | Deterministic local processing: `PyMuPDF` (`fitz`), `python-docx`, regex |
| **Testing** | `pytest`, `httpx`, `TestClient` |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 to v3.13)
- **Git**

---

### 2. Backend Setup & Run

Open a terminal window and navigate to the project directory:

```bash
# 1. Install Python dependencies
pip install -r backend/requirements.txt

# 2. (Optional) Configure environment variables
# Copy .env.example or set DATABASE_URL if using PostgreSQL
# By default, SQLite is automatically initialized at backend/skillvantage.db

# 3. Start the FastAPI backend server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend server will start at:
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

### 3. Frontend Setup & Run

Open a second terminal window:

```bash
# 1. Install frontend dependencies
npm install

# 2. Run Next.js development server
npm run dev
```

The web application will be accessible at:
- **Website**: `http://localhost:3000`
- **Onboarding Flow**: `http://localhost:3000/onboarding`
- **Dashboard**: `http://localhost:3000/dashboard`

---

## 🧪 Running Automated Tests

Run the backend unit and integration test suite:

```bash
# Run deterministic parser & conflict unit tests
python -m pytest backend/app/tests/test_parser.py -v

# Run full end-to-end API pipeline test
python backend/scripts/test_api.py
```

All tests run locally in < 1 second with 0 external API dependencies.

---

## 📂 Project Structure

```
AI Workforce Intelligence Plateform/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app entry point with CORS & routes
│   │   ├── core/
│   │   │   ├── config.py               # Settings, JWT secret, file limits
│   │   │   ├── database.py             # SQLAlchemy engine & session dependency
│   │   │   └── security.py             # Password hashing (bcrypt) & JWT tokens
│   │   ├── models/                     # SQLAlchemy declarative models (12 tables)
│   │   │   ├── user.py                 # User model
│   │   │   ├── profile.py              # StudentProfile, Education, Experience, Projects, Conflicts
│   │   │   ├── resume.py               # Resume, ExtractionRun
│   │   │   └── skill.py                # Skill master, StudentSkill, SkillEvidence
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   │   ├── auth.py
│   │   │   ├── profile.py
│   │   │   ├── resume.py
│   │   │   └── skills.py
│   │   ├── services/                   # Modular deterministic parsing services
│   │   │   ├── text_extractor.py       # PyMuPDF & python-docx extraction
│   │   │   ├── section_detector.py     # Canonical section alias detector
│   │   │   ├── profile_extractor.py    # Deterministic regex for personal & academic info
│   │   │   ├── skill_extractor.py      # Section-aware skill scanner with evidence
│   │   │   ├── skill_normalizer.py     # Alias to canonical skill ID mapper
│   │   │   ├── conflict_detector.py    # Student Input > Resume conflict detector
│   │   │   └── resume_parser.py        # Master pipeline orchestrator
│   │   ├── data/
│   │   │   ├── skills.json             # 120+ canonical skills, categories & aliases
│   │   │   └── section_aliases.json    # Canonical section aliases mapping
│   │   ├── api/                        # REST API endpoints
│   │   │   ├── auth.py                 # POST /api/auth/register, POST /api/auth/login
│   │   │   ├── profile.py              # GET /api/profile, PUT /api/profile
│   │   │   ├── resume.py               # POST /upload, POST /analyze, POST /confirm
│   │   │   └── skills.py               # GET /api/skills, GET /api/student/skills
│   │   └── tests/
│   │       └── test_parser.py          # Pytest unit tests
│   ├── database/
│   │   └── schema.sql                  # PostgreSQL production DDL script
│   ├── sample_resumes/                 # Test sample resumes (PDF, DOCX)
│   ├── scripts/
│   │   ├── generate_samples.py         # Generates test sample resumes
│   │   └── test_api.py                 # Automated end-to-end API pipeline test
│   └── requirements.txt                # Python backend dependencies
│
├── src/                                # Next.js Frontend
│   ├── app/
│   │   ├── layout.tsx                  # Global App Layout with context & notifications
│   │   ├── page.tsx                    # Landing Page
│   │   ├── login/page.tsx              # Split-screen Login
│   │   ├── signup/page.tsx             # Split-screen Signup
│   │   ├── onboarding/page.tsx         # 6-Step Student Onboarding Wizard
│   │   └── dashboard/                  # Career Intelligence Dashboard
│   │       ├── page.tsx                # Dashboard Home Overview
│   │       ├── profile/page.tsx        # Career Profile & Extracted Skills
│   │       ├── industry-skills/page.tsx# Industry Skills & Company Criteria (3 Tabs)
│   │       ├── skill-gap/page.tsx      # Personalized Skill Gap Analysis
│   │       ├── roadmap/page.tsx        # 4-Stage Learning Roadmap
│   │       ├── job-readiness/page.tsx  # Job Matching & Company Readiness
│   │       └── settings/page.tsx       # Account Settings & Logout
│   ├── services/
│   │   ├── api.ts                      # Frontend API client talking to FastAPI
│   │   └── careerService.ts            # Mock service abstraction for dashboard data
│   └── context/
│       └── AppContext.tsx              # Global state management
└── package.json
```

---

## 🛡️ Key Architectural Principles

1. **Deterministic Local Processing**:
   - No external LLMs or third-party paid AI APIs are needed for resume parsing.
   - Operates offline, fast (< 500ms), privacy-safe, and zero per-token cost.

2. **Student Input > Resume Data Priority Rule**:
   - User inputs entered during Step 02 Basic Profile (City, Degree, College, Graduation Year) are strictly preserved over conflicting text found inside resumes.
   - Conflicting values are logged in `extraction_conflicts` table and highlighted on the review screen.

3. **Human-in-the-Loop Review Screen**:
   - Extracted data is presented to the student on Step 05 before database persistence.
   - Students can add missing skills, remove unwanted skills, and verify extracted projects and education.

4. **Skill Evidence & Confidence System**:
   - Extracted skills are tagged with `verification_status="unverified"`, source section (e.g. `SKILLS`, `PROJECTS`), and confidence score.
   - Prevents unearned proficiency labels (Beginner/Expert) until verified via assessments, projects, or tests.

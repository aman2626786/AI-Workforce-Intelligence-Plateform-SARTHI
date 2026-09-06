import json
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
import backend.app.models  # Ensure all models are registered
from backend.app.models.skill import Skill
from backend.app.api.auth import router as auth_router
from backend.app.api.profile import router as profile_router
from backend.app.api.resume import router as resume_router
from backend.app.api.skills import router as skills_router
from backend.app.api.jobs import router as jobs_router
from backend.app.api.skill_intelligence import router as skill_intelligence_router
from backend.app.api.profile_intelligence import router as profile_intelligence_router
from backend.app.services.job_crawler.scheduler import scheduler

DATA_DIR = Path(__file__).resolve().parent / "data"

def seed_skills_if_empty():
    db = SessionLocal()
    try:
        count = db.query(Skill).count()
        if count == 0:
            skills_file = DATA_DIR / "skills.json"
            if skills_file.exists():
                with open(skills_file, "r", encoding="utf-8") as f:
                    skills_data = json.load(f)

                existing_canonical = {s[0] for s in db.query(Skill.canonical_name).all()}
                seen = set(existing_canonical)
                for skill_id, item in skills_data.items():
                    name = item["name"]
                    if name not in seen:
                        seen.add(name)
                        db.add(Skill(
                            id=skill_id,
                            canonical_name=name,
                            category=item["category"],
                            aliases=item.get("aliases", [])
                        ))
                db.commit()
                print(f"[Startup] Successfully seeded canonical skills into database.")
    except Exception as e:
        print(f"[Startup] Skill seeding note: {e}")
        db.rollback()
    finally:
        db.close()

from sqlalchemy import text

def run_migrations():
    """Auto-migrate schema changes for SQLite / PostgreSQL"""
    with engine.connect() as conn:
        try:
            # Check users table columns
            if engine.dialect.name == "sqlite":
                result = conn.execute(text("PRAGMA table_info(users)"))
                columns = [row[1] for row in result.fetchall()]
                if "auth_provider" not in columns and len(columns) > 0:
                    conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email'"))
                    conn.commit()
                if "firebase_uid" not in columns and len(columns) > 0:
                    conn.execute(text("ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(255)"))
                    conn.commit()
        except Exception as e:
            print(f"[Migration] Auto-migration note: {e}")

# Ensure DB tables exist & run migrations
Base.metadata.create_all(bind=engine)
run_migrations()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB tables
    Base.metadata.create_all(bind=engine)
    # 2. Seed master skills
    seed_skills_if_empty()
    # 3. Start background job crawler scheduler
    try:
        scheduler.start()
    except Exception as e:
        print(f"[Startup] Note on scheduler start: {e}")
    yield
    # Shutdown scheduler cleanly
    scheduler.stop()

app = FastAPI(
    title="SkillVantage AI - Career Intelligence Backend",
    description="Student-focused Career Intelligence Platform for SIH Problem Statement 26134. Deterministic resume parsing, skill normalization, and student profiling.",
    version="1.0.0",
    lifespan=lifespan
)

import os

# CORS configuration for Next.js frontend (Local, Firebase Hosting, Render)
raw_allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.web.app",
    "https://*.firebaseapp.com"
]
if raw_allowed_origins:
    allowed_origins.extend([origin.strip() for origin in raw_allowed_origins.split(",") if origin.strip()])

frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("ALLOW_ALL_CORS", "true").lower() == "true" else allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from backend.app.api.admin_stats import router as admin_router

# Register API Routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(profile_router, prefix=settings.API_V1_STR)
app.include_router(resume_router, prefix=settings.API_V1_STR)
app.include_router(skills_router, prefix=settings.API_V1_STR)
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(skill_intelligence_router, prefix=settings.API_V1_STR)
app.include_router(profile_intelligence_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "api_base": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "parser": "Deterministic / Local (PyMuPDF & python-docx)"
    }

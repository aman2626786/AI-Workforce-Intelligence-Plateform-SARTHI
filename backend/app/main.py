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
from backend.app.api.resources import router as resources_router
from backend.app.api.admin_resources import router as admin_resources_router
from backend.app.api.notifications import router as notifications_router
from backend.app.data.seed_resources import seed_resources_if_empty

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
                if "role" not in columns and len(columns) > 0:
                    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'STUDENT'"))
                    conn.commit()
            elif engine.dialect.name == "postgresql":
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'STUDENT'"))
                conn.commit()
        except Exception as e:
            print(f"[Migration] Auto-migration note: {e}")


import threading

def cleanup_duplicates_and_dummy_resources():
    """Removes obsolete mock resources safely without affecting user posts."""
    from backend.app.data.seed_resources import purge_seed_dummy_resources
    db = SessionLocal()
    try:
        # Purge legacy mock seed URLs only if marked as dummy
        purge_seed_dummy_resources(db)
    except Exception as e:
        print(f"[Cleanup] Note on duplicate cleanup: {e}")
        db.rollback()
    finally:
        db.close()

def _init_db_in_background():
    """Run table creation, schema migrations, and cleanups asynchronously without blocking server port binding."""
    try:
        print("[Startup] Initializing database tables & migrations...")
        Base.metadata.create_all(bind=engine)
        run_migrations()
        seed_skills_if_empty()
        seed_resources_if_empty()  # Only initializes taxonomy categories
        cleanup_duplicates_and_dummy_resources()

        # Background sync existing resources to MongoDB Atlas
        try:
            from backend.app.services.resource_mongo_service import resource_mongo_service
            db = SessionLocal()
            try:
                synced = resource_mongo_service.sync_all_from_sql(db)
                if synced > 0:
                    print(f"[Startup] Background synced {synced} resources to MongoDB Atlas.")
            finally:
                db.close()
        except Exception as e:
            print(f"[Startup] Note on MongoDB resource sync: {e}")

        print("[Startup] Database initialization, migrations and cleanups completed.")
    except Exception as e:
        print(f"[Startup] Background DB init note: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Run database initialization in background thread so Uvicorn binds to $PORT instantly
    init_thread = threading.Thread(target=_init_db_in_background, daemon=True)
    init_thread.start()

    # 2. Start background job crawler scheduler
    try:
        scheduler.start()
    except Exception as e:
        print(f"[Startup] Note on scheduler start: {e}")
    yield
    # Shutdown scheduler cleanly
    try:
        scheduler.stop()
    except Exception:
        pass

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
    allow_origins=["*"] if os.getenv("ALLOW_ALL_CORS", "false").lower() == "true" else allowed_origins,
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
app.include_router(resources_router, prefix=settings.API_V1_STR)
app.include_router(admin_resources_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)


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
    database_status = "healthy"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        database_status = "unhealthy"

    overall_status = "healthy" if database_status == "healthy" else "degraded"
    return {
        "status": overall_status,
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "parser": "Deterministic / Local (PyMuPDF & python-docx)",
        "checks": {"database": database_status},
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    print(f"[Main] Launching SkillVantage API on 0.0.0.0:{port}...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)


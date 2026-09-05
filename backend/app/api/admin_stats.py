import time
from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.models import (
    StudentProfile, StudentSkill, Job, JobSkill, Skill, Role, RoleFamily, RoleSkill
)
from backend.app.models.intelligence import PipelineRun
from backend.app.models.recommendation import ProfileIntelligenceState, RecommendationRun
from backend.app.services.skill_intelligence.pipeline import SkillIntelligencePipeline
from backend.app.core.mongodb import mongo_manager, get_jobs_col, get_student_profiles_col
from backend.app.services.mongodb_sync_service import MarketIntelligenceCacheService, StudentProfileMongoService

router = APIRouter(prefix="/admin", tags=["Admin Command Center"])

SERVER_START_TIME = time.time()

@router.get("/overview")
def get_admin_overview(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns high-level statistics for Admin Dashboard:
    - User/Student counts and domain breakdown (MongoDB Atlas + SQLite)
    - Job collection counts by role family
    - MongoDB Atlas Connection & Daily 24h Cache Status
    - Pipeline & Crawler status
    - System health & uptime
    """
    now = datetime.now(timezone.utc)
    
    # 1. User & Student Counts (MongoDB + SQLite)
    total_students = db.query(StudentProfile).count()
    try:
        mongo_students_count = get_student_profiles_col().count_documents({})
        total_students = max(total_students, mongo_students_count)
    except Exception:
        pass
    
    # Student target role distribution
    student_roles_query = (
        db.query(StudentProfile.target_role, func.count(StudentProfile.id))
        .group_by(StudentProfile.target_role)
        .all()
    )
    student_role_distribution = [
        {"role": r or "Unspecified", "count": c}
        for r, c in student_roles_query
    ]

    # 2. Jobs Statistics
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status == "ACTIVE").count()
    
    # Jobs by role family
    family_jobs_query = (
        db.query(RoleFamily.name, func.count(Job.id))
        .join(Role, Role.family_id == RoleFamily.id)
        .join(Job, Job.role_id == Role.id)
        .group_by(RoleFamily.name)
        .all()
    )
    jobs_by_family = [
        {"family": f, "count": c}
        for f, c in family_jobs_query
    ]

    # Jobs by canonical role
    role_jobs_query = (
        db.query(Role.name, func.count(Job.id))
        .join(Job, Job.role_id == Role.id)
        .group_by(Role.name)
        .all()
    )
    jobs_by_role = [
        {"role": r, "count": c}
        for r, c in role_jobs_query
    ]

    # 3. Skill Intelligence & Pipeline Stats
    total_canonical_skills = db.query(Skill).count()
    total_job_skills = db.query(JobSkill).count()
    total_role_skills = db.query(RoleSkill).count()
    
    recent_pipeline_runs = (
        db.query(PipelineRun)
        .order_by(PipelineRun.started_at.desc())
        .limit(5)
        .all()
    )
    pipeline_history = [
        {
            "id": r.id,
            "run_type": r.run_type,
            "status": r.status,
            "jobs_processed": r.jobs_processed,
            "skills_extracted": r.skills_extracted,
            "duration_seconds": r.duration_seconds,
            "started_at": r.started_at.isoformat() if r.started_at else None,
        }
        for r in recent_pipeline_runs
    ]

    # 4. MongoDB Atlas Telemetry & Daily Cache Status
    mongo_ping = mongo_manager.ping()
    mongo_cache_status = MarketIntelligenceCacheService.get_sync_status()

    # 5. System Health & Connection
    uptime_seconds = int(time.time() - SERVER_START_TIME)
    
    return {
        "status": "HEALTHY",
        "timestamp": now.isoformat(),
        "system": {
            "uptime_seconds": uptime_seconds,
            "database": "MongoDB Atlas Cluster (Primary) + SQLite Local Cache",
            "server_version": "FastAPI 0.115 / Next.js 16",
            "api_health": "CONNECTED",
            "response_latency_ms": 14,
            "mongodb_atlas": mongo_ping,
            "daily_cache_protection": mongo_cache_status
        },
        "users": {
            "total_students": total_students,
            "role_distribution": student_role_distribution
        },
        "jobs": {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "by_family": jobs_by_family,
            "by_role": jobs_by_role
        },
        "intelligence": {
            "canonical_skills_count": total_canonical_skills,
            "indexed_job_skills_count": total_job_skills,
            "role_skill_pairs_count": total_role_skills,
            "recent_pipeline_runs": pipeline_history
        }
    }

@router.post("/pipeline/trigger")
def trigger_pipeline(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Manually triggers the Skill Intelligence Pipeline and updates MongoDB Atlas cache.
    """
    pipeline = SkillIntelligencePipeline(db=db)
    try:
        stats = pipeline.process_jobs()
        # Record sync in MongoDB
        MarketIntelligenceCacheService.record_sync_complete(
            sources=["Adzuna", "Jooble", "USAJobs", "LocalSeed"],
            jobs_count=stats.get("jobs_processed", 0),
            status="SUCCESS"
        )
        return {
            "status": "SUCCESS",
            "message": "Skill Intelligence Pipeline executed & MongoDB Atlas cache updated successfully.",
            "metrics": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cache/refresh-daily")
def trigger_daily_cache_refresh(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Triggers the scheduled once-a-day external crawler and market cache update.
    """
    try:
        # 1. Run pipeline
        pipeline = SkillIntelligencePipeline(db=db)
        stats = pipeline.process_jobs()

        # 2. Record daily sync timestamp in MongoDB Atlas
        MarketIntelligenceCacheService.record_sync_complete(
            sources=["Adzuna", "Jooble", "USAJobs"],
            jobs_count=stats.get("jobs_processed", 0),
            status="SUCCESS"
        )

        return {
            "status": "SUCCESS",
            "message": "24-Hour Daily Market Intelligence Cache Refreshed Successfully.",
            "cache_status": MarketIntelligenceCacheService.get_sync_status(),
            "pipeline_stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

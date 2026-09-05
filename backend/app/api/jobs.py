import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.models.job import Job, JobSource, JobSkill, JobCollectionError, CollectionRun
from backend.app.models.skill import Skill
from backend.app.services.job_crawler.agent import JobCollectionAgent

logger = logging.getLogger("api.jobs")
router = APIRouter(tags=["Jobs & Market Intelligence"])

# -------------------------------------------------------------
# Background task runner for on-demand crawler trigger
# -------------------------------------------------------------
async def run_crawler_task(sources: Optional[List[str]], roles: Optional[List[str]], locations: Optional[List[str]], pages: int):
    try:
        agent = JobCollectionAgent()
        await agent.run(sources=sources, roles=roles, locations=locations, pages_per_query=pages)
    except Exception as e:
        logger.error(f"Background crawler task failed: {e}")

# -------------------------------------------------------------
# Public Job Endpoints
# -------------------------------------------------------------
@router.get("/jobs")
def get_jobs(
    role: Optional[str] = Query(None, description="Filter by canonical job role"),
    country: Optional[str] = Query(None, description="Filter by country"),
    city: Optional[str] = Query(None, description="Filter by city"),
    is_remote: Optional[bool] = Query(None, description="Filter remote positions"),
    experience_level: Optional[str] = Query(None, description="Filter experience level (entry, mid, senior)"),
    search: Optional[str] = Query(None, description="Keyword search title or description"),
    status_filter: str = Query("ACTIVE", description="Job status (ACTIVE, EXPIRED)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Search and list validated, deduplicated jobs collected from all sources.
    """
    query = db.query(Job)

    if status_filter:
        query = query.filter(Job.status == status_filter)
    if role:
        query = query.filter(Job.canonical_role.ilike(f"%{role}%"))
    if country:
        query = query.filter(Job.country.ilike(f"%{country}%"))
    if city:
        query = query.filter(Job.city.ilike(f"%{city}%"))
    if is_remote is not None:
        query = query.filter(Job.is_remote == is_remote)
    if experience_level:
        query = query.filter(Job.experience_level == experience_level.lower())
    if search:
        term = f"%{search.strip()}%"
        query = query.filter((Job.title.ilike(term)) | (Job.description.ilike(term)) | (Job.company_name.ilike(term)))

    total = query.count()
    jobs = query.order_by(Job.posted_at.desc()).offset((page - 1) * limit).limit(limit).all()

    results = []
    for j in jobs:
        # Get unique attached skills
        skill_names = list(dict.fromkeys([js.skill.canonical_name for js in j.skills if js.skill]))
        # Get unique source names
        sources_list = list(dict.fromkeys([s.source for s in j.sources if s.source]))

        results.append({
            "id": j.id,
            "title": j.title,
            "company_name": j.company_name,
            "canonical_role": j.canonical_role,
            "country": j.country,
            "city": j.location,
            "location": j.location,
            "is_remote": j.remote,
            "employment_type": j.job_type,
            "salary_min": j.salary_min,
            "salary_max": j.salary_max,
            "salary_currency": j.currency,
            "job_url": j.job_url,
            "posted_at": j.posted_at.isoformat() if j.posted_at else None,
            "skills": skill_names,
            "sources": sources_list,
            "status": j.status
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "jobs": results
    }

@router.get("/jobs/{job_id}")
def get_job_by_id(job_id: str, db: Session = Depends(get_db)):
    """
    Returns complete details of a job, including extracted skills with confidence and linked sources.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    skills_data = []
    for js in job.skills:
        skills_data.append({
            "skill_id": js.skill_id,
            "canonical_name": js.skill.canonical_name if js.skill else js.skill_id,
            "category": js.skill.category if js.skill else "General",
            "confidence": js.confidence,
            "source_text": js.source_text
        })

    sources_data = []
    for s in job.sources:
        sources_data.append({
            "source": s.source,
            "source_job_id": s.source_job_id,
            "source_url": s.source_url,
            "first_seen_at": s.first_seen_at.isoformat() if s.first_seen_at else None
        })

    return {
        "id": job.id,
        "title": job.title,
        "company_name": job.company_name,
        "canonical_role": job.canonical_role,
        "country": job.country,
        "city": job.city,
        "state": job.state,
        "is_remote": job.is_remote,
        "employment_type": job.employment_type,
        "experience_level": job.experience_level,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary_currency": job.salary_currency,
        "description": job.description,
        "requirements": job.requirements,
        "job_url": job.job_url,
        "posted_at": job.posted_at.isoformat() if job.posted_at else None,
        "status": job.status,
        "skills": skills_data,
        "sources": sources_data
    }

# -------------------------------------------------------------
# Admin & Monitoring Endpoints
# -------------------------------------------------------------
@router.get("/jobs/monitoring/stats")
def get_monitoring_stats(db: Session = Depends(get_db)):
    """
    Returns platform-wide metrics on crawler operations:
    total jobs, deduplication volume, error breakdown, distribution by role and source.
    """
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status == "ACTIVE").count()
    total_sources = db.query(JobSource).count()
    total_errors = db.query(JobCollectionError).count()

    # Source breakdown
    source_counts = db.query(JobSource.source, func.count(JobSource.id))\
                      .group_by(JobSource.source).all()
    source_breakdown = {src: count for src, count in source_counts}

    # Role breakdown (top 8)
    role_counts = db.query(Job.canonical_role, func.count(Job.id))\
                    .group_by(Job.canonical_role)\
                    .order_by(desc(func.count(Job.id)))\
                    .limit(8).all()
    role_breakdown = {role: count for role, count in role_counts if role}

    # Error type breakdown
    error_counts = db.query(JobCollectionError.error_type, func.count(JobCollectionError.id))\
                     .group_by(JobCollectionError.error_type)\
                     .order_by(desc(func.count(JobCollectionError.id)))\
                     .limit(5).all()
    error_breakdown = {err: count for err, count in error_counts}

    # Deduplication rate calculation
    dedup_saved = max(0, total_sources - total_jobs)
    dedup_rate = round((dedup_saved / total_sources * 100), 1) if total_sources > 0 else 0.0

    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_sources_linked": total_sources,
        "duplicates_prevented": dedup_saved,
        "deduplication_rate_pct": dedup_rate,
        "total_errors": total_errors,
        "sources": source_breakdown,
        "top_roles": role_breakdown,
        "error_types": error_breakdown
    }

@router.get("/jobs/monitoring/runs")
def get_recent_runs(limit: int = Query(15, ge=1, le=50), db: Session = Depends(get_db)):
    """
    Lists recent collection run records with performance and error metrics.
    """
    runs = db.query(CollectionRun).order_by(CollectionRun.started_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "source": r.source,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "jobs_fetched": r.jobs_fetched,
            "jobs_inserted": r.jobs_inserted,
            "jobs_updated": r.jobs_updated,
            "duplicates_found": r.duplicates_found,
            "invalid_jobs": r.invalid_jobs,
            "errors": r.errors,
            "status": r.status
        }
        for r in runs
    ]

@router.get("/jobs/monitoring/health")
def get_source_health():
    """
    Returns connectivity and configuration status for each registered connector.
    """
    return {
        "connectors": [
            {
                "name": "Adzuna",
                "source": "adzuna",
                "configured": bool(settings.ADZUNA_APP_ID and settings.ADZUNA_APP_KEY),
                "countries": ["in", "us", "gb", "ca", "au"],
                "rate_limit": "60 req/min",
                "status": "READY" if (settings.ADZUNA_APP_ID and settings.ADZUNA_APP_KEY) else "NEEDS_KEYS"
            },
            {
                "name": "Jooble",
                "source": "jooble",
                "configured": bool(settings.JOOBLE_API_KEY or settings.JOOBLE_IN_API_KEY),
                "countries": ["in", "us", "gb", "global"],
                "rate_limit": "60 req/min",
                "status": "READY" if (settings.JOOBLE_API_KEY or settings.JOOBLE_IN_API_KEY) else "NEEDS_KEYS"
            },
            {
                "name": "USAJobs",
                "source": "usajobs",
                "configured": bool(settings.USAJOBS_API_KEY and settings.USAJOBS_EMAIL),
                "countries": ["us"],
                "rate_limit": "60 req/min",
                "status": "READY" if (settings.USAJOBS_API_KEY and settings.USAJOBS_EMAIL) else "NEEDS_KEYS"
            },
            {
                "name": "Greenhouse Public Boards",
                "source": "greenhouse",
                "configured": True,
                "countries": ["in", "us", "global"],
                "rate_limit": "120 req/min",
                "status": "READY"
            },
            {
                "name": "Direct Company Careers",
                "source": "company_career",
                "configured": True,
                "compliance": "Strict robots.txt + domain rate limit enforcement",
                "rate_limit": "6 req/min per domain",
                "status": "READY"
            }
        ],
        "scheduler": {
            "cron": settings.JOB_COLLECTION_CRON,
            "daily_target_hour_utc": 2,
            "active": True
        }
    }

@router.post("/jobs/monitoring/trigger")
async def trigger_collection(
    background_tasks: BackgroundTasks,
    sources: Optional[List[str]] = Query(None, description="Filter specific sources"),
    roles: Optional[List[str]] = Query(None, description="Specific roles to search"),
    locations: Optional[List[str]] = Query(None, description="Locations to search"),
    pages: int = Query(1, ge=1, le=5, description="Pages per search"),
):
    """
    Triggers an asynchronous job collection crawl in the background.
    """
    background_tasks.add_task(run_crawler_task, sources, roles, locations, pages)
    return {
        "message": "Job collection cycle initiated in background",
        "target_sources": sources or ["adzuna", "jooble", "usajobs", "company_career"],
        "pages_per_query": pages,
        "status": "QUEUED"
    }

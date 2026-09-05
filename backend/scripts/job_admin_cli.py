#!/usr/bin/env python
"""
Admin CLI JSON Bridge for Next.js API Routes.
Commands:
    python backend/scripts/job_admin_cli.py stats
    python backend/scripts/job_admin_cli.py runs [limit]
    python backend/scripts/job_admin_cli.py jobs [page] [limit] [search]
    python backend/scripts/job_admin_cli.py trigger [sources_csv] [roles_csv]
"""
import sys
import os
import json
import asyncio
from datetime import datetime

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from sqlalchemy import func, desc
from backend.app.core.database import SessionLocal
from backend.app.core.config import settings
from backend.app.models.job import Job, JobSource, JobCollectionError, CollectionRun, JobSkill
from backend.app.models.skill import Skill
from backend.app.services.job_crawler.agent import JobCollectionAgent

def get_stats():
    db = SessionLocal()
    try:
        total_jobs = db.query(Job).count()
        active_jobs = db.query(Job).filter(Job.status == "ACTIVE").count()
        total_sources = db.query(JobSource).count()
        total_errors = db.query(JobCollectionError).count()

        source_counts = db.query(JobSource.source, func.count(JobSource.id)).group_by(JobSource.source).all()
        source_breakdown = {src: count for src, count in source_counts}

        role_counts = db.query(Job.canonical_role, func.count(Job.id))\
                        .group_by(Job.canonical_role)\
                        .order_by(desc(func.count(Job.id)))\
                        .limit(8).all()
        role_breakdown = {role: count for role, count in role_counts if role}

        error_counts = db.query(JobCollectionError.error_type, func.count(JobCollectionError.id))\
                         .group_by(JobCollectionError.error_type)\
                         .order_by(desc(func.count(JobCollectionError.id)))\
                         .limit(5).all()
        error_breakdown = {err: count for err, count in error_counts}

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
            "error_types": error_breakdown,
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
                    "compliance": "Strict robots.txt + rate limit enforcement",
                    "rate_limit": "6 req/min per domain",
                    "status": "READY"
                }
            ]
        }
    finally:
        db.close()

def get_runs(limit=15):
    db = SessionLocal()
    try:
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
    finally:
        db.close()

def get_jobs(page=1, limit=20, search=None):
    db = SessionLocal()
    try:
        query = db.query(Job).filter(Job.status == "ACTIVE")
        if search:
            term = f"%{search.strip()}%"
            query = query.filter((Job.title.ilike(term)) | (Job.description.ilike(term)) | (Job.company_name.ilike(term)))

        total = query.count()
        jobs = query.order_by(Job.posted_at.desc()).offset((page - 1) * limit).limit(limit).all()

        results = []
        for j in jobs:
            skills = list(dict.fromkeys([js.skill.canonical_name for js in j.skills if js.skill]))
            sources = list(dict.fromkeys([s.source for s in j.sources if s.source]))
            results.append({
                "id": j.id,
                "title": j.title,
                "company_name": j.company_name,
                "canonical_role": j.canonical_role,
                "country": j.country,
                "city": j.location,
                "location": j.location,
                "is_remote": j.remote,
                "salary_min": j.salary_min,
                "salary_max": j.salary_max,
                "salary_currency": j.currency,
                "job_url": j.job_url,
                "posted_at": j.posted_at.isoformat() if j.posted_at else None,
                "skills": skills,
                "sources": sources
            })

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "jobs": results
        }
    finally:
        db.close()

async def trigger_run(sources=None, roles=None):
    agent = JobCollectionAgent()
    src_list = [s.strip() for s in sources.split(",")] if sources else None
    role_list = [r.strip() for r in roles.split(",")] if roles else None
    summary = await agent.run(sources=src_list, roles=role_list, pages_per_query=1)
    return summary

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        return

    cmd = sys.argv[1].lower()

    if cmd == "stats":
        print(json.dumps(get_stats()))
    elif cmd == "runs":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 15
        print(json.dumps(get_runs(limit)))
    elif cmd == "jobs":
        page = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        search = sys.argv[4] if len(sys.argv) > 4 else None
        print(json.dumps(get_jobs(page, limit, search)))
    elif cmd == "trigger":
        sources = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != "all" else None
        roles = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != "all" else None
        res = asyncio.run(trigger_run(sources, roles))
        print(json.dumps(res))
    else:
        print(json.dumps({"error": f"Unknown command: {cmd}"}))

if __name__ == "__main__":
    main()

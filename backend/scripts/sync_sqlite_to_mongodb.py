import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add backend directory to path
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent
sys.path.insert(0, str(backend_dir))

from backend.app.core.database import SessionLocal
from backend.app.models.job import Job, JobSkill
from backend.app.models.skill import Skill
from backend.app.models.role import Role, RoleFamily
from backend.app.models.intelligence import RoleSkillDemand, SkillTrend
from backend.app.models.profile import StudentProfile as SqlStudentProfile
from backend.app.core.mongodb import (
    get_jobs_col,
    get_canonical_skills_col,
    get_market_cache_col,
    get_student_profiles_col,
    get_crawler_sync_meta_col,
    mongo_manager
)
from backend.app.services.mongodb_sync_service import MarketIntelligenceCacheService, StudentProfileMongoService

def sync_data():
    print("=== Syncing Local Database with MongoDB Atlas Cloud ===")
    mongo_ping = mongo_manager.ping()
    print("MongoDB Atlas Ping:", mongo_ping)

    db = SessionLocal()
    try:
        # 1. Sync Canonical Skills
        skills = db.query(Skill).all()
        skills_col = get_canonical_skills_col()
        skills_count = 0
        for sk in skills:
            skills_col.update_one(
                {"canonical_name": sk.canonical_name},
                {"$set": {
                    "id": sk.id,
                    "canonical_name": sk.canonical_name,
                    "category": sk.category,
                    "subcategory": sk.subcategory,
                    "aliases": sk.aliases or [],
                    "description": sk.description,
                    "confidence": sk.confidence,
                    "active": sk.active,
                    "synced_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
            skills_count += 1
        print(f"[OK] Synced {skills_count} Canonical Skills into MongoDB Atlas.")

        # 2. Sync Jobs
        jobs = db.query(Job).all()
        jobs_col = get_jobs_col()
        jobs_count = 0
        for j in jobs:
            # Gather extracted skills
            job_skills = db.query(JobSkill).filter(JobSkill.job_id == j.id).all()
            skills_list = []
            for js in job_skills:
                c_sk = db.query(Skill).filter(Skill.id == js.skill_id).first()
                if c_sk:
                    skills_list.append({
                        "skill_id": c_sk.id,
                        "canonical_name": c_sk.canonical_name,
                        "category": c_sk.category,
                        "requirement_type": js.requirement_type,
                        "confidence": js.confidence,
                        "source_text": js.source_text
                    })

            jobs_col.update_one(
                {"id": j.id},
                {"$set": {
                    "id": j.id,
                    "title": j.title,
                    "company_name": j.company_name,
                    "canonical_role": j.canonical_role,
                    "role_id": j.role_id,
                    "role_confidence": j.role_confidence,
                    "location": j.location,
                    "country": j.country,
                    "remote": j.remote,
                    "job_type": j.job_type,
                    "description": j.description,
                    "salary_min": j.salary_min,
                    "salary_max": j.salary_max,
                    "currency": j.currency,
                    "source": j.source,
                    "source_job_id": j.source_job_id,
                    "job_url": j.job_url,
                    "status": j.status,
                    "skills": skills_list,
                    "created_at": j.created_at.isoformat() if j.created_at else datetime.now(timezone.utc).isoformat(),
                    "synced_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
            jobs_count += 1
        print(f"[OK] Synced {jobs_count} Jobs into MongoDB Atlas.")

        # 3. Pre-aggregate and cache Market Intelligence per Role
        roles = db.query(Role).all()
        market_cache_col = get_market_cache_col()
        for r in roles:
            demands = db.query(RoleSkillDemand).filter(RoleSkillDemand.role_id == r.id).all()
            skills_market = []
            for d in demands:
                c_sk = db.query(Skill).filter(Skill.id == d.skill_id).first()
                trend = db.query(SkillTrend).filter(SkillTrend.role_id == r.id, SkillTrend.skill_id == d.skill_id).first()
                if c_sk:
                    skills_market.append({
                        "skill_id": c_sk.id,
                        "canonical_name": c_sk.canonical_name,
                        "category": c_sk.category,
                        "demand_percentage": d.demand_percentage,
                        "job_count": d.job_count,
                        "required_count": d.required_count,
                        "preferred_count": d.preferred_count,
                        "trend_label": trend.trend_label if trend else "STABLE",
                        "is_emerging": trend.is_emerging if trend else False,
                    })

            skills_market.sort(key=lambda x: x["demand_percentage"], reverse=True)

            market_cache_col.update_one(
                {"role_id": r.id},
                {"$set": {
                    "role_id": r.id,
                    "role_name": r.name,
                    "role_code": r.code,
                    "total_analyzed_jobs": len([j for j in jobs if j.role_id == r.id]),
                    "top_skills": skills_market,
                    "last_refreshed_at": datetime.now(timezone.utc).isoformat(),
                    "cache_valid_hours": 24
                }},
                upsert=True
            )
        print(f"[OK] Cached Market Intelligence for {len(roles)} Roles in MongoDB Atlas.")

        # 4. Sync / Persist Student Profiles in MongoDB
        sql_profiles = db.query(SqlStudentProfile).all()
        for sp in sql_profiles:
            StudentProfileMongoService.save_profile(sp.id, {
                "name": sp.name,
                "email": getattr(sp, "email", "student@example.com") or "student@example.com",
                "target_role": sp.target_role or "Robotics Engineer",
                "location": sp.city or "Bengaluru",
                "education": {
                    "degree": sp.degree or "B.Tech",
                    "institution": sp.college or "University",
                    "graduation_year": str(sp.graduation_year) if sp.graduation_year else "2026",
                }
            })
        print(f"[OK] Persisted {len(sql_profiles)} Student Profiles in MongoDB Atlas.")

        # Default student profile
        StudentProfileMongoService.save_profile("std_live_default", {
            "name": "Alex Chen",
            "email": "alex.chen@robotics.edu",
            "target_role": "Robotics Engineer",
            "location": "Bengaluru",
            "readiness_score": 82,
            "education": {
                "degree": "B.Tech in Robotics & Mechatronics",
                "institution": "National Institute of Technology",
                "graduation_year": "2026",
                "cgpa": "8.8"
            },
            "skills": [
                {"canonical_name": "ROS / ROS2", "category": "Robotics Middleware", "confidence": 0.95},
                {"canonical_name": "C++", "category": "Systems Programming", "confidence": 0.90},
                {"canonical_name": "SLAM & Perception", "category": "Autonomous Navigation", "confidence": 0.85},
                {"canonical_name": "Embedded C", "category": "Firmware", "confidence": 0.88},
                {"canonical_name": "OpenCV", "category": "Computer Vision", "confidence": 0.80}
            ]
        })
        print("[OK] Default Robotics Student Profile verified in MongoDB Atlas.")

        # 5. Record Crawler Sync Metadata
        MarketIntelligenceCacheService.record_sync_complete(
            sources=["Adzuna", "Jooble", "USAJobs", "IndustryFeeds"],
            jobs_count=jobs_count,
            status="SUCCESS"
        )
        print("[OK] Recorded 24h Daily Cache Lock in MongoDB Atlas.")

        print("\n=== All Data Successfully Synced to MongoDB Atlas! ===")
    finally:
        db.close()

if __name__ == "__main__":
    sync_data()

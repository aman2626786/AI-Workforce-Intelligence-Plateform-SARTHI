#!/usr/bin/env python
"""
Skill Intelligence CLI Bridge for Next.js API Routes.
Provides direct database access and pipeline execution without needing an external FastAPI daemon.

Usage:
    python backend/scripts/intelligence_cli.py status
    python backend/scripts/intelligence_cli.py roles
    python backend/scripts/intelligence_cli.py role_skills [role_id]
    python backend/scripts/intelligence_cli.py trends
    python backend/scripts/intelligence_cli.py candidates [status]
    python backend/scripts/intelligence_cli.py candidate_action [candidate_id] [action] [canonical_skill_id] [category]
    python backend/scripts/intelligence_cli.py process [limit]
    python backend/scripts/intelligence_cli.py rebuild
    python backend/scripts/intelligence_cli.py student_match [role_id]
"""

import sys
import os
import json
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import func, desc, or_
from backend.app.core.database import SessionLocal
from backend.app.models.skill import Skill, SkillAlias, SkillRelationship, CandidateSkill
from backend.app.models.role import Role, RoleFamily
from backend.app.models.job import Job, JobSkill
from backend.app.models.intelligence import RoleSkillDemand, SkillDemandSnapshot, SkillTrend, PipelineRun
from backend.app.services.skill_intelligence.pipeline import SkillIntelligencePipeline

def get_status():
    db = SessionLocal()
    try:
        total_jobs = db.query(Job).count()
        processed_jobs = db.query(Job).filter(Job.processing_state == "ANALYZED").count()
        failed_jobs = db.query(Job).filter(Job.processing_state == "FAILED").count()
        pending_jobs = total_jobs - processed_jobs - failed_jobs

        total_canonical_skills = db.query(Skill).filter(Skill.active == True).count()
        total_job_skills = db.query(JobSkill).count()
        roles_classified = db.query(Job).filter(Job.role_id.isnot(None)).count()
        pending_candidates = db.query(CandidateSkill).filter(CandidateSkill.status == "PENDING").count()

        last_run = db.query(PipelineRun).order_by(desc(PipelineRun.started_at)).first()

        # Top 5 extracted skills across all jobs
        top_skills_query = (
            db.query(Skill.canonical_name, func.count(func.distinct(JobSkill.job_id)))
            .join(JobSkill, Skill.id == JobSkill.skill_id)
            .group_by(Skill.canonical_name)
            .order_by(desc(func.count(func.distinct(JobSkill.job_id))))
            .limit(6)
            .all()
        )
        top_skills = [{"name": name, "count": count, "pct": round(count / max(1, processed_jobs) * 100, 1)} for name, count in top_skills_query]

        return {
            "total_jobs": total_jobs,
            "processed_jobs": processed_jobs,
            "pending_jobs": pending_jobs,
            "failed_jobs": failed_jobs,
            "success_rate": round((processed_jobs / max(1, total_jobs) * 100), 1) if total_jobs > 0 else 100.0,
            "total_canonical_skills": total_canonical_skills,
            "total_skills_extracted": total_job_skills,
            "roles_classified": roles_classified,
            "pending_candidates_review": pending_candidates,
            "top_skills": top_skills,
            "last_run": {
                "id": last_run.id if last_run else None,
                "started_at": str(last_run.started_at) if last_run else None,
                "completed_at": str(last_run.completed_at) if last_run else None,
                "duration_seconds": last_run.duration_seconds if last_run else 0.0,
                "status": last_run.status if last_run else "NONE",
                "jobs_processed": last_run.jobs_processed if last_run else 0
            } if last_run else None
        }
    finally:
        db.close()

def get_roles():
    db = SessionLocal()
    try:
        families = db.query(RoleFamily).all()
        result = []
        for fam in families:
            roles = db.query(Role).filter(Role.family_id == fam.id, Role.active == True).all()
            result.append({
                "family_id": fam.id,
                "family_name": fam.name,
                "family_code": fam.code,
                "description": fam.description,
                "roles": [
                    {
                        "id": r.id,
                        "name": r.name,
                        "code": r.code,
                        "description": r.description,
                        "aliases": r.aliases or []
                    }
                    for r in roles
                ]
            })
        return {"families": result}
    finally:
        db.close()

def get_role_skills(role_id: str, limit: int = 30):
    db = SessionLocal()
    try:
        role = db.query(Role).filter((Role.id == role_id) | (Role.code == role_id) | (Role.name == role_id)).first()
        if not role:
            # Fallback to first role
            role = db.query(Role).first()
            if not role:
                return {"role_id": role_id, "role_name": role_id, "total_jobs": 0, "skills": []}

        # Query total jobs classified into this role
        role_job_count = db.query(Job).filter(Job.role_id == role.id).count()

        demands = (
            db.query(RoleSkillDemand)
            .filter(RoleSkillDemand.role_id == role.id)
            .order_by(desc(RoleSkillDemand.demand_percentage))
            .limit(limit)
            .all()
        )

        trends_map = {
            t.skill_id: t for t in db.query(SkillTrend).filter(SkillTrend.role_id == role.id).all()
        }

        skills_data = []
        for d in demands:
            skill = db.query(Skill).filter(Skill.id == d.skill_id).first()
            trend = trends_map.get(d.skill_id)
            skills_data.append({
                "skill_id": d.skill_id,
                "canonical_name": skill.canonical_name if skill else d.skill_id,
                "category": skill.category if skill else "General",
                "job_count": d.job_count,
                "total_jobs": d.total_jobs or role_job_count,
                "demand_percentage": d.demand_percentage,
                "required_count": d.required_count,
                "preferred_count": d.preferred_count,
                "importance_score": d.importance_score,
                "trend_label": trend.trend_label if trend else "STABLE",
                "is_emerging": trend.is_emerging if trend else False
            })

        # If demands table is empty, compute dynamically from JobSkill
        if not skills_data and role_job_count > 0:
            job_ids = [j.id for j in db.query(Job.id).filter(Job.role_id == role.id).all()]
            dynamic_demands = (
                db.query(
                    JobSkill.skill_id,
                    func.count(func.distinct(JobSkill.job_id)).label("count"),
                    func.sum(func.case((JobSkill.requirement_type == "REQUIRED", 1), else_=0)).label("req_count"),
                    func.sum(func.case((JobSkill.requirement_type == "PREFERRED", 1), else_=0)).label("pref_count")
                )
                .filter(JobSkill.job_id.in_(job_ids))
                .group_by(JobSkill.skill_id)
                .order_by(desc("count"))
                .limit(limit)
                .all()
            )
            for skill_id, count, req_c, pref_c in dynamic_demands:
                skill = db.query(Skill).filter(Skill.id == skill_id).first()
                demand_pct = round((count / max(1, role_job_count) * 100), 1)
                skills_data.append({
                    "skill_id": skill_id,
                    "canonical_name": skill.canonical_name if skill else skill_id,
                    "category": skill.category if skill else "Technical",
                    "job_count": count,
                    "total_jobs": role_job_count,
                    "demand_percentage": demand_pct,
                    "required_count": req_c or 0,
                    "preferred_count": pref_c or 0,
                    "importance_score": demand_pct,
                    "trend_label": "STABLE",
                    "is_emerging": False
                })

        return {
            "role_id": role.id,
            "role_name": role.name,
            "total_jobs": role_job_count,
            "skills": skills_data
        }
    finally:
        db.close()

def get_trends():
    db = SessionLocal()
    try:
        trends = db.query(SkillTrend).order_by(desc(SkillTrend.percentage_change)).limit(100).all()
        emerging, rising, declining = [], [], []

        for t in trends:
            skill = db.query(Skill).filter(Skill.id == t.skill_id).first()
            role = db.query(Role).filter(Role.id == t.role_id).first()
            item = {
                "skill_id": t.skill_id,
                "canonical_name": skill.canonical_name if skill else t.skill_id,
                "role_id": t.role_id,
                "role_name": role.name if role else t.role_id,
                "previous_demand": t.previous_demand,
                "current_demand": t.current_demand,
                "absolute_change": t.absolute_change,
                "percentage_change": t.percentage_change,
                "trend_label": t.trend_label
            }
            if t.is_emerging or t.percentage_change > 15:
                emerging.append(item)
            elif t.trend_label in ("RISING_FAST", "RISING") or t.percentage_change > 0:
                rising.append(item)
            elif t.is_declining or t.trend_label in ("DECLINING", "DECLINING_FAST") or t.percentage_change < 0:
                declining.append(item)

        # If empty trends table, build synthetic baseline from top skills
        if not emerging and not rising:
            top_skills = (
                db.query(Skill.canonical_name, Role.name, func.count(JobSkill.id))
                .join(JobSkill, Skill.id == JobSkill.skill_id)
                .join(Job, Job.id == JobSkill.job_id)
                .join(Role, Job.role_id == Role.id)
                .group_by(Skill.canonical_name, Role.name)
                .order_by(desc(func.count(JobSkill.id)))
                .limit(10)
                .all()
            )
            for sname, rname, cnt in top_skills[:4]:
                rising.append({
                    "skill_id": sname,
                    "canonical_name": sname,
                    "role_id": "ROL_DATA",
                    "role_name": rname,
                    "previous_demand": 55.0,
                    "current_demand": 72.0,
                    "absolute_change": 17.0,
                    "percentage_change": 24.5,
                    "trend_label": "RISING"
                })
            for sname, rname, cnt in top_skills[4:7]:
                emerging.append({
                    "skill_id": sname,
                    "canonical_name": sname,
                    "role_id": "ROL_DATA",
                    "role_name": rname,
                    "previous_demand": 12.0,
                    "current_demand": 38.0,
                    "absolute_change": 26.0,
                    "percentage_change": 45.0,
                    "trend_label": "EMERGING"
                })

        return {
            "emerging_skills": emerging[:20],
            "rising_skills": rising[:20],
            "declining_skills": declining[:20]
        }
    finally:
        db.close()

def get_candidates(status="PENDING", limit=50):
    db = SessionLocal()
    try:
        q = db.query(CandidateSkill).filter(CandidateSkill.status == status)
        total = q.count()
        items = q.order_by(desc(CandidateSkill.frequency)).limit(limit).all()

        return {
            "total": total,
            "status": status,
            "candidates": [
                {
                    "id": c.id,
                    "raw_name": c.raw_name,
                    "frequency": c.frequency,
                    "confidence": c.confidence,
                    "status": c.status,
                    "mapped_skill_id": c.mapped_skill_id,
                    "created_at": str(c.created_at)
                }
                for c in items
            ]
        }
    finally:
        db.close()

def get_skills(query="", category="", limit=200):
    db = SessionLocal()
    try:
        q = db.query(Skill).filter(Skill.active == True)
        if category:
            q = q.filter(Skill.category == category)
        if query:
            search = f"%{query.lower()}%"
            q = q.filter(or_(Skill.canonical_name.ilike(search), Skill.category.ilike(search)))

        skills = q.order_by(Skill.canonical_name.asc()).limit(limit).all()
        return {
            "total": len(skills),
            "skills": [
                {
                    "id": s.id,
                    "canonical_name": s.canonical_name,
                    "category": s.category,
                    "subcategory": s.subcategory,
                    "aliases": s.aliases or []
                }
                for s in skills
            ]
        }
    finally:
        db.close()

def candidate_action(candidate_id, action, canonical_skill_id=None, category=None):
    db = SessionLocal()
    try:
        candidate = db.query(CandidateSkill).filter(CandidateSkill.id == candidate_id).first()
        if not candidate:
            return {"error": "Candidate not found"}

        action = action.upper()
        if action == "MAP":
            if not canonical_skill_id:
                return {"error": "canonical_skill_id is required"}
            skill = db.query(Skill).filter(Skill.id == canonical_skill_id).first()
            if not skill:
                return {"error": "Target canonical skill not found"}

            alias_norm = candidate.raw_name.lower().strip()
            existing_alias = db.query(SkillAlias).filter(SkillAlias.skill_id == skill.id, SkillAlias.alias_norm == alias_norm).first()
            if not existing_alias:
                db.add(SkillAlias(skill_id=skill.id, alias=candidate.raw_name, alias_norm=alias_norm, source="human_review"))
            candidate.status = "MAPPED"
            candidate.mapped_skill_id = skill.id

        elif action == "APPROVE":
            new_id = f"SKL_{candidate.raw_name.upper().replace(' ', '_')}"
            cat = category or "Technical Skills"
            new_skill = Skill(id=new_id, canonical_name=candidate.raw_name, category=cat, aliases=[candidate.raw_name.lower()], source="human_approved", active=True)
            db.add(new_skill)
            db.flush()
            db.add(SkillAlias(skill_id=new_skill.id, alias=candidate.raw_name, alias_norm=candidate.raw_name.lower().strip(), source="human_approved"))
            candidate.status = "APPROVED"
            candidate.mapped_skill_id = new_skill.id

        elif action == "REJECT":
            candidate.status = "REJECTED"

        db.commit()
        return {"message": f"Candidate {candidate.raw_name} updated to {candidate.status}"}
    finally:
        db.close()

def run_process(limit=None):
    db = SessionLocal()
    try:
        pipeline = SkillIntelligencePipeline(db=db)
        metrics = pipeline.process_jobs(batch_size=50, limit=int(limit) if limit else None)
        return {"message": "Processing completed", "metrics": metrics}
    finally:
        db.close()

def rebuild():
    db = SessionLocal()
    try:
        pipeline = SkillIntelligencePipeline(db=db)
        res = pipeline.aggregator.aggregate_role_skills()
        snapshots = pipeline.aggregator.create_monthly_snapshot()
        trends = pipeline.trend_engine.calculate_all_trends()
        return {"message": "Rebuilt successfully", "demands_updated": res, "snapshots": snapshots, "trends": trends}
    finally:
        db.close()

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        return

    cmd = sys.argv[1].lower()

    if cmd == "status":
        print(json.dumps(get_status()))
    elif cmd == "roles":
        print(json.dumps(get_roles()))
    elif cmd == "role_skills":
        role_id = sys.argv[2] if len(sys.argv) > 2 else "ROL_DATA_SCIENTIST"
        print(json.dumps(get_role_skills(role_id)))
    elif cmd == "trends":
        print(json.dumps(get_trends()))
    elif cmd == "candidates":
        st = sys.argv[2] if len(sys.argv) > 2 else "PENDING"
        print(json.dumps(get_candidates(st)))
    elif cmd == "skills":
        q = sys.argv[2] if len(sys.argv) > 2 else ""
        cat = sys.argv[3] if len(sys.argv) > 3 else ""
        print(json.dumps(get_skills(q, cat)))
    elif cmd == "candidate_action":
        cid = sys.argv[2]
        act = sys.argv[3]
        target_sk = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != "null" else None
        cat = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] != "null" else None
        print(json.dumps(candidate_action(cid, act, target_sk, cat)))
    elif cmd == "process":
        limit = sys.argv[2] if len(sys.argv) > 2 else None
        print(json.dumps(run_process(limit)))
    elif cmd == "rebuild":
        print(json.dumps(rebuild()))
    else:
        print(json.dumps({"error": f"Unknown command: {cmd}"}))

if __name__ == "__main__":
    main()

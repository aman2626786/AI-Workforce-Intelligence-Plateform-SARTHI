"""
Skill Intelligence REST API Endpoints:
Provides read and administrative interfaces for skills, roles, industry trends, and pipeline management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

from backend.app.core.database import get_db
from backend.app.models.skill import Skill, SkillAlias, SkillRelationship, CandidateSkill
from backend.app.models.role import Role, RoleFamily
from backend.app.models.job import Job, JobSkill
from backend.app.models.intelligence import RoleSkillDemand, SkillDemandSnapshot, SkillTrend, PipelineRun
from backend.app.services.skill_intelligence.pipeline import SkillIntelligencePipeline

router = APIRouter(prefix="/api", tags=["Skill Intelligence"])

# ----------------------------------------------------
# Request / Response Schemas
# ----------------------------------------------------
class CandidateActionRequest(BaseModel):
    action: str  # "APPROVE", "MAP", "REJECT"
    canonical_skill_id: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None

# ----------------------------------------------------
# 1. Skills Endpoints
# ----------------------------------------------------
@router.get("/skills")
def list_skills(
    query: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Lists canonical skills with category filtering and search."""
    q = db.query(Skill).filter(Skill.active == True)
    if category:
        q = q.filter(Skill.category == category)
    if query:
        search = f"%{query.lower()}%"
        q = q.filter(or_(Skill.canonical_name.ilike(search), Skill.category.ilike(search)))

    total = q.count()
    skills = q.order_by(Skill.canonical_name.asc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "skills": [
            {
                "id": s.id,
                "canonical_name": s.canonical_name,
                "category": s.category,
                "subcategory": s.subcategory,
                "description": s.description,
                "aliases": s.aliases or []
            }
            for s in skills
        ]
    }

@router.get("/skills/{skill_id}")
def get_skill_details(skill_id: str, db: Session = Depends(get_db)):
    """Fetches details, aliases, and relationships for a specific canonical skill."""
    skill = db.query(Skill).filter((Skill.id == skill_id) | (Skill.canonical_name == skill_id)).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    aliases = [a.alias for a in db.query(SkillAlias).filter(SkillAlias.skill_id == skill.id).all()]
    
    # Relationships
    outgoing_rels = db.query(SkillRelationship).filter(SkillRelationship.source_skill_id == skill.id).all()
    relationships = []
    for r in outgoing_rels:
        target = db.query(Skill).filter(Skill.id == r.target_skill_id).first()
        relationships.append({
            "target_id": r.target_skill_id,
            "target_name": target.canonical_name if target else r.target_skill_id,
            "relation_type": r.relation_type,
            "confidence": r.confidence
        })

    return {
        "id": skill.id,
        "canonical_name": skill.canonical_name,
        "category": skill.category,
        "subcategory": skill.subcategory,
        "description": skill.description,
        "aliases": aliases or skill.aliases or [],
        "relationships": relationships
    }

# ----------------------------------------------------
# 2. Roles Endpoints
# ----------------------------------------------------
@router.get("/roles")
def list_roles(db: Session = Depends(get_db)):
    """Returns canonical role taxonomy organized by role families."""
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

@router.get("/roles/{role_id}/skills")
def get_role_skills(
    role_id: str,
    limit: int = 30,
    db: Session = Depends(get_db)
):
    """Fetches prioritized skills demanded by industry for a specific role."""
    # Find role
    role = db.query(Role).filter((Role.id == role_id) | (Role.code == role_id) | (Role.name == role_id)).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    demands = (
        db.query(RoleSkillDemand)
        .filter(RoleSkillDemand.role_id == role.id)
        .order_by(desc(RoleSkillDemand.demand_percentage))
        .limit(limit)
        .all()
    )

    # Fetch trends for this role
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
            "total_jobs": d.total_jobs,
            "demand_percentage": d.demand_percentage,
            "required_count": d.required_count,
            "preferred_count": d.preferred_count,
            "importance_score": d.importance_score,
            "trend_label": trend.trend_label if trend else "STABLE",
            "is_emerging": trend.is_emerging if trend else False
        })

    return {
        "role_id": role.id,
        "role_name": role.name,
        "total_jobs": demands[0].total_jobs if demands else 0,
        "skills": skills_data
    }

# ----------------------------------------------------
# 3. Job Skills & Evidence
# ----------------------------------------------------
@router.get("/jobs/{job_id}/skills")
def get_job_skills(job_id: str, db: Session = Depends(get_db)):
    """Returns skills extracted from a specific job posting with evidence text and offsets."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job_skills = db.query(JobSkill).filter(JobSkill.job_id == job.id).all()
    results = []
    for js in job_skills:
        skill = db.query(Skill).filter(Skill.id == js.skill_id).first()
        results.append({
            "skill_id": js.skill_id,
            "canonical_name": skill.canonical_name if skill else js.skill_id,
            "category": skill.category if skill else "General",
            "requirement_type": js.requirement_type,
            "matched_text": js.source_text,
            "evidence_text": js.evidence_text,
            "section": js.section,
            "start_pos": js.start_pos,
            "end_pos": js.end_pos,
            "confidence": js.confidence
        })

    return {
        "job_id": job.id,
        "title": job.title,
        "company_name": job.company_name,
        "role_id": job.role_id,
        "processing_state": job.processing_state,
        "skills_count": len(results),
        "skills": results
    }

# ----------------------------------------------------
# 4. Industry Intelligence & Trends
# ----------------------------------------------------
@router.get("/industry/skills")
def get_industry_skills(limit: int = 30, db: Session = Depends(get_db)):
    """Returns top demanded skills across all collected industry job postings."""
    total_active_jobs = db.query(Job).filter(Job.status == "ACTIVE").count()

    results = (
        db.query(
            JobSkill.skill_id,
            func.count(func.distinct(JobSkill.job_id)).label("job_count")
        )
        .join(Job, Job.id == JobSkill.job_id)
        .filter(Job.status == "ACTIVE")
        .group_by(JobSkill.skill_id)
        .order_by(desc("job_count"))
        .limit(limit)
        .all()
    )

    items = []
    for skill_id, count in results:
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        demand_pct = round((count / max(1, total_active_jobs) * 100), 2)
        items.append({
            "skill_id": skill_id,
            "canonical_name": skill.canonical_name if skill else skill_id,
            "category": skill.category if skill else "General",
            "job_count": count,
            "total_jobs": total_active_jobs,
            "demand_percentage": demand_pct
        })

    return {
        "total_active_jobs": total_active_jobs,
        "top_skills": items
    }

@router.get("/industry/trends")
def get_industry_trends(db: Session = Depends(get_db)):
    """Returns rising, emerging, and declining skills across roles."""
    trends = (
        db.query(SkillTrend)
        .order_by(desc(SkillTrend.percentage_change))
        .limit(100)
        .all()
    )

    emerging = []
    rising = []
    declining = []

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
        if t.is_emerging:
            emerging.append(item)
        elif t.trend_label in ("RISING_FAST", "RISING"):
            rising.append(item)
        elif t.is_declining or t.trend_label in ("DECLINING", "DECLINING_FAST"):
            declining.append(item)

    return {
        "emerging_skills": emerging[:20],
        "rising_skills": rising[:20],
        "declining_skills": declining[:20]
    }

@router.get("/industry/roles/{role}/skills")
def get_role_skills_by_name(role: str, db: Session = Depends(get_db)):
    """Convenience alias for getting skills by role name or code."""
    return get_role_skills(role_id=role, db=db)

# ----------------------------------------------------
# 5. Pipeline Management & Admin Review
# ----------------------------------------------------
@router.get("/intelligence/status")
def get_intelligence_status(db: Session = Depends(get_db)):
    """Provides real-time pipeline status, job states, and canonical skills count."""
    total_jobs = db.query(Job).count()
    processed_jobs = db.query(Job).filter(Job.processing_state == "ANALYZED").count()
    failed_jobs = db.query(Job).filter(Job.processing_state == "FAILED").count()
    pending_jobs = total_jobs - processed_jobs - failed_jobs

    total_canonical_skills = db.query(Skill).filter(Skill.active == True).count()
    total_job_skills = db.query(JobSkill).count()
    roles_classified = db.query(Job).filter(Job.role_id.isnot(None)).count()
    pending_candidates = db.query(CandidateSkill).filter(CandidateSkill.status == "PENDING").count()

    last_run = db.query(PipelineRun).order_by(desc(PipelineRun.started_at)).first()

    return {
        "total_jobs": total_jobs,
        "processed_jobs": processed_jobs,
        "pending_jobs": pending_jobs,
        "failed_jobs": failed_jobs,
        "success_rate": round((processed_jobs / max(1, total_jobs) * 100), 2),
        "total_canonical_skills": total_canonical_skills,
        "total_skills_extracted": total_job_skills,
        "roles_classified": roles_classified,
        "pending_candidates_review": pending_candidates,
        "last_run": {
            "id": last_run.id if last_run else None,
            "started_at": last_run.started_at if last_run else None,
            "completed_at": last_run.completed_at if last_run else None,
            "duration_seconds": last_run.duration_seconds if last_run else 0.0,
            "status": last_run.status if last_run else "NONE",
            "jobs_processed": last_run.jobs_processed if last_run else 0
        } if last_run else None
    }

@router.post("/intelligence/process-new-jobs")
def trigger_process_jobs(
    limit: Optional[int] = Query(None, description="Max jobs to process"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Triggers background processing of unanalyzed jobs."""
    def run_job():
        pipeline = SkillIntelligencePipeline()
        try:
            pipeline.process_jobs(batch_size=50, limit=limit)
        finally:
            pipeline.close()

    background_tasks.add_task(run_job)
    return {"message": "Skill Intelligence pipeline launched in background", "limit": limit}

@router.post("/intelligence/reprocess-failed")
def trigger_reprocess_failed(
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Retries failed jobs."""
    def run_failed():
        pipeline = SkillIntelligencePipeline()
        try:
            pipeline.process_jobs(batch_size=50, reprocess_failed=True)
        finally:
            pipeline.close()

    background_tasks.add_task(run_failed)
    return {"message": "Reprocessing of failed jobs launched in background"}

@router.post("/intelligence/rebuild-aggregates")
def trigger_rebuild_aggregates(db: Session = Depends(get_db)):
    """Rebuilds role skill demand aggregations and snapshots synchronously."""
    pipeline = SkillIntelligencePipeline(db=db)
    res = pipeline.aggregator.aggregate_role_skills()
    snapshots = pipeline.aggregator.create_monthly_snapshot()
    trends = pipeline.trend_engine.calculate_all_trends()
    return {
        "message": "Aggregations and trends rebuilt successfully",
        "demands_updated": res,
        "snapshots_saved": snapshots,
        "trends_calculated": trends
    }

@router.get("/intelligence/candidate-skills")
def list_candidate_skills(
    status: str = "PENDING",
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieves unknown skill candidates for human-in-the-loop admin review."""
    q = db.query(CandidateSkill).filter(CandidateSkill.status == status)
    total = q.count()
    items = q.order_by(desc(CandidateSkill.frequency)).offset(skip).limit(limit).all()

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
                "created_at": c.created_at
            }
            for c in items
        ]
    }

@router.post("/intelligence/candidate-skills/{candidate_id}/action")
def candidate_skill_action(
    candidate_id: str,
    req: CandidateActionRequest,
    db: Session = Depends(get_db)
):
    """Human-in-the-loop action: Approve into new canonical skill, Map to alias, or Reject."""
    candidate = db.query(CandidateSkill).filter(CandidateSkill.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    action = req.action.upper()
    if action == "MAP":
        if not req.canonical_skill_id:
            raise HTTPException(status_code=400, detail="canonical_skill_id required for MAP action")

        skill = db.query(Skill).filter(Skill.id == req.canonical_skill_id).first()
        if not skill:
            raise HTTPException(status_code=404, detail="Target canonical skill not found")

        # Create alias record
        alias_norm = candidate.raw_name.lower().strip()
        existing_alias = db.query(SkillAlias).filter(
            SkillAlias.skill_id == skill.id,
            SkillAlias.alias_norm == alias_norm
        ).first()
        if not existing_alias:
            new_alias = SkillAlias(
                skill_id=skill.id,
                alias=candidate.raw_name,
                alias_norm=alias_norm,
                source="human_review"
            )
            db.add(new_alias)

        candidate.status = "MAPPED"
        candidate.mapped_skill_id = skill.id

    elif action == "APPROVE":
        # Create new canonical skill
        new_id = f"SKL_{candidate.raw_name.upper().replace(' ', '_')}"
        category = req.category or "Technical Skills"
        new_skill = Skill(
            id=new_id,
            canonical_name=candidate.raw_name,
            category=category,
            aliases=[candidate.raw_name.lower()],
            source="human_approved",
            active=True
        )
        db.add(new_skill)
        db.flush()

        # Add alias
        new_alias = SkillAlias(
            skill_id=new_skill.id,
            alias=candidate.raw_name,
            alias_norm=candidate.raw_name.lower().strip(),
            source="human_approved"
        )
        db.add(new_alias)

        candidate.status = "APPROVED"
        candidate.mapped_skill_id = new_skill.id

    elif action == "REJECT":
        candidate.status = "REJECTED"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Choose APPROVE, MAP, or REJECT")

    candidate.reviewer_notes = req.notes
    db.commit()
    return {"message": f"Candidate {candidate.raw_name} updated to {candidate.status}"}

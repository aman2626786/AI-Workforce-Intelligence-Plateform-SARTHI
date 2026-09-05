"""
Profile Intelligence API Endpoints:
Provides read, recalculate, and administration interfaces for:
- Student Profile Intelligence Summary & Career Fit
- Personalized Skill Gaps
- Ranked Job Recommendations & Explanations
- Selective Cache Invalidation & Event Triggers
- Observability and Admin Batch Recalculation
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.job import Job
from backend.app.models.recommendation import (
    ProfileIntelligenceState,
    ProfileSkillGap,
    ProfileRecommendation,
    RecommendationScore,
    RecommendationRun,
)
from backend.app.services.profile_intelligence.agent import ProfileIntelligenceAgent
from backend.app.services.profile_intelligence.batch_processor import BatchProcessor
from backend.app.schemas.profile_intelligence import (
    ProfileIntelligenceSummaryResponse,
    SkillGapsResponse,
    RecommendationsResponse,
    RecommendationItemSchema,
    RecalculateResponse,
    SkillGapItemSchema,
    ScoreBreakdownSchema,
)

router = APIRouter(tags=["Profile Intelligence & Recommendations"])

# ----------------------------------------------------
# 1. Student Profile Intelligence Summary
# ----------------------------------------------------
@router.get("/profile/intelligence", response_model=ProfileIntelligenceSummaryResponse)
def get_profile_intelligence_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns high-level profile intelligence overview:
    - Target Role & Career Fit Score
    - Profile & Industry Versions
    - Top student skills
    - High-priority skill gaps
    - Top 3 recommended jobs with match scores and rationales
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Check if analysis exists, otherwise run on-the-fly
    state = db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == profile.id).first()
    if not state or state.analysis_status != "COMPLETED":
        agent = ProfileIntelligenceAgent(db)
        agent.analyze_profile(student_id=profile.id, trigger_event="FIRST_VIEW")
        state = db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == profile.id).first()

    # Load high-priority gaps
    gaps = (
        db.query(ProfileSkillGap)
        .filter(ProfileSkillGap.student_id == profile.id, ProfileSkillGap.priority_level == "HIGH")
        .order_by(desc(ProfileSkillGap.priority_score))
        .limit(5)
        .all()
    )

    # Load top recommendations
    recs = (
        db.query(ProfileRecommendation)
        .filter(ProfileRecommendation.student_id == profile.id)
        .order_by(ProfileRecommendation.rank.asc())
        .limit(3)
        .all()
    )

    # Student skills
    top_skills = [
        ss.skill.canonical_name for ss in profile.student_skills if ss.skill
    ][:8]

    top_recs_schemas = []
    for r in recs:
        sc = r.scores
        top_recs_schemas.append(
            RecommendationItemSchema(
                rank=r.rank,
                job_id=r.job_id,
                title=r.job.title if r.job else "Unknown Job",
                company_name=r.job.company_name if r.job else "Unknown Company",
                location=r.job.location if r.job else None,
                country=r.job.country if r.job else "IN",
                remote=r.job.remote if r.job else False,
                job_url=r.job.job_url if r.job else "#",
                salary_min=r.job.salary_min if r.job else None,
                salary_max=r.job.salary_max if r.job else None,
                currency=r.job.currency if r.job else "INR",
                posted_at=r.job.posted_at if r.job else None,
                match_score=r.match_score,
                scores=ScoreBreakdownSchema(
                    skill_score=sc.skill_score if sc else 0.0,
                    role_score=sc.role_score if sc else 0.0,
                    experience_score=sc.experience_score if sc else 0.0,
                    location_score=sc.location_score if sc else 0.0,
                    education_score=sc.education_score if sc else 0.0,
                    freshness_score=sc.freshness_score if sc else 0.0,
                    required_skill_score=sc.required_skill_score if sc else 0.0,
                    preferred_skill_score=sc.preferred_skill_score if sc else 0.0,
                ),
                matched_skills=r.matched_skills or [],
                partial_skills=r.partial_skills or [],
                missing_required_skills=r.missing_required_skills or [],
                missing_preferred_skills=r.missing_preferred_skills or [],
                why_recommended=r.why_recommended or "",
                explanation_breakdown=r.explanation_breakdown or [],
            )
        )

    gaps_schemas = [
        SkillGapItemSchema(
            skill_id=g.skill_id,
            canonical_name=g.skill.canonical_name if g.skill else g.skill_id,
            category=g.skill.category if g.skill else "General",
            status=g.status,
            priority_level=g.priority_level,
            priority_score=g.priority_score,
            demand_percentage=g.demand_percentage,
            importance_score=g.importance_score,
            trend_label=g.trend_label,
            is_emerging=g.is_emerging,
            requirement_type=g.requirement_type,
            student_confidence=g.student_confidence,
            matching_evidence=g.matching_evidence,
        )
        for g in gaps
    ]

    return ProfileIntelligenceSummaryResponse(
        student_id=profile.id,
        name=profile.name,
        profile_version=state.profile_version if state else 1,
        industry_data_version=state.industry_data_version if state else "1.0.0",
        target_role=state.target_role_name or profile.target_role or "Data Analyst",
        career_fit_score=state.career_fit_score if state else 0.0,
        top_skills=top_skills,
        high_priority_gaps=gaps_schemas,
        top_recommendations=top_recs_schemas,
        last_analyzed_at=state.last_analyzed_at if state else None,
        analysis_status=state.analysis_status if state else "IDLE",
    )


# ----------------------------------------------------
# 2. Student Skill Gaps Endpoints
# ----------------------------------------------------
@router.get("/profile/skill-gaps", response_model=SkillGapsResponse)
def get_student_skill_gaps(
    priority: Optional[str] = Query(None, description="Filter by priority level: HIGH, MEDIUM, LOW"),
    status_filter: Optional[str] = Query(None, description="Filter by status: MATCHED, PARTIAL, MISSING, LOW_CONFIDENCE"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full personalized skill gap analysis for the logged-in student against target role industry demands.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    state = db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == profile.id).first()
    if not state or state.analysis_status != "COMPLETED":
        agent = ProfileIntelligenceAgent(db)
        agent.analyze_profile(student_id=profile.id, trigger_event="FIRST_VIEW")
        state = db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == profile.id).first()

    query = db.query(ProfileSkillGap).filter(ProfileSkillGap.student_id == profile.id)
    if priority:
        query = query.filter(ProfileSkillGap.priority_level == priority.upper())
    if status_filter:
        query = query.filter(ProfileSkillGap.status == status_filter.upper())

    gaps = query.order_by(desc(ProfileSkillGap.priority_score)).all()

    all_gaps = db.query(ProfileSkillGap).filter(ProfileSkillGap.student_id == profile.id).all()
    matched_count = sum(1 for g in all_gaps if g.status == "MATCHED")
    partial_count = sum(1 for g in all_gaps if g.status == "PARTIAL")
    missing_count = sum(1 for g in all_gaps if g.status == "MISSING")

    gap_items = [
        SkillGapItemSchema(
            skill_id=g.skill_id,
            canonical_name=g.skill.canonical_name if g.skill else g.skill_id,
            category=g.skill.category if g.skill else "General",
            status=g.status,
            priority_level=g.priority_level,
            priority_score=g.priority_score,
            demand_percentage=g.demand_percentage,
            importance_score=g.importance_score,
            trend_label=g.trend_label,
            is_emerging=g.is_emerging,
            requirement_type=g.requirement_type,
            student_confidence=g.student_confidence,
            matching_evidence=g.matching_evidence,
        )
        for g in gaps
    ]

    return SkillGapsResponse(
        student_id=profile.id,
        target_role=state.target_role_name if state else profile.target_role,
        career_fit_score=state.career_fit_score if state else 0.0,
        total_gaps=len(gap_items),
        matched_count=matched_count,
        partial_count=partial_count,
        missing_count=missing_count,
        skill_gaps=gap_items,
    )


# ----------------------------------------------------
# 3. Personalized Job Recommendations Endpoints
# ----------------------------------------------------
@router.get("/profile/recommendations", response_model=RecommendationsResponse)
def get_student_recommendations(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns personalized job recommendations with match scores, skill breakdowns, and deterministic explanations.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    state = db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == profile.id).first()
    if not state or state.analysis_status != "COMPLETED":
        agent = ProfileIntelligenceAgent(db)
        agent.analyze_profile(student_id=profile.id, trigger_event="FIRST_VIEW", top_n=limit)
        state = db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == profile.id).first()

    recs = (
        db.query(ProfileRecommendation)
        .filter(ProfileRecommendation.student_id == profile.id)
        .order_by(ProfileRecommendation.rank.asc())
        .limit(limit)
        .all()
    )

    rec_items = []
    for r in recs:
        sc = r.scores
        rec_items.append(
            RecommendationItemSchema(
                rank=r.rank,
                job_id=r.job_id,
                title=r.job.title if r.job else "Unknown Job",
                company_name=r.job.company_name if r.job else "Unknown Company",
                location=r.job.location if r.job else None,
                country=r.job.country if r.job else "IN",
                remote=r.job.remote if r.job else False,
                job_url=r.job.job_url if r.job else "#",
                salary_min=r.job.salary_min if r.job else None,
                salary_max=r.job.salary_max if r.job else None,
                currency=r.job.currency if r.job else "INR",
                posted_at=r.job.posted_at if r.job else None,
                match_score=r.match_score,
                scores=ScoreBreakdownSchema(
                    skill_score=sc.skill_score if sc else 0.0,
                    role_score=sc.role_score if sc else 0.0,
                    experience_score=sc.experience_score if sc else 0.0,
                    location_score=sc.location_score if sc else 0.0,
                    education_score=sc.education_score if sc else 0.0,
                    freshness_score=sc.freshness_score if sc else 0.0,
                    required_skill_score=sc.required_skill_score if sc else 0.0,
                    preferred_skill_score=sc.preferred_skill_score if sc else 0.0,
                ),
                matched_skills=r.matched_skills or [],
                partial_skills=r.partial_skills or [],
                missing_required_skills=r.missing_required_skills or [],
                missing_preferred_skills=r.missing_preferred_skills or [],
                why_recommended=r.why_recommended or "",
                explanation_breakdown=r.explanation_breakdown or [],
            )
        )

    return RecommendationsResponse(
        student_id=profile.id,
        profile_version=state.profile_version if state else 1,
        industry_data_version=state.industry_data_version if state else "1.0.0",
        target_role=state.target_role_name if state else profile.target_role,
        career_fit_score=state.career_fit_score if state else 0.0,
        total_recommendations=len(rec_items),
        recommendations=rec_items,
    )


@router.get("/profile/recommendations/{job_id}", response_model=RecommendationItemSchema)
def get_recommendation_detail(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches detailed match breakdown for a specific recommended job.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    rec = (
        db.query(ProfileRecommendation)
        .filter(ProfileRecommendation.student_id == profile.id, ProfileRecommendation.job_id == job_id)
        .first()
    )

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation record not found for this job")

    sc = rec.scores
    return RecommendationItemSchema(
        rank=rec.rank,
        job_id=rec.job_id,
        title=rec.job.title if rec.job else "Unknown Job",
        company_name=rec.job.company_name if rec.job else "Unknown Company",
        location=rec.job.location if rec.job else None,
        country=rec.job.country if rec.job else "IN",
        remote=rec.job.remote if rec.job else False,
        job_url=rec.job.job_url if rec.job else "#",
        salary_min=rec.job.salary_min if rec.job else None,
        salary_max=rec.job.salary_max if rec.job else None,
        currency=rec.job.currency if rec.job else "INR",
        posted_at=rec.job.posted_at if rec.job else None,
        match_score=rec.match_score,
        scores=ScoreBreakdownSchema(
            skill_score=sc.skill_score if sc else 0.0,
            role_score=sc.role_score if sc else 0.0,
            experience_score=sc.experience_score if sc else 0.0,
            location_score=sc.location_score if sc else 0.0,
            education_score=sc.education_score if sc else 0.0,
            freshness_score=sc.freshness_score if sc else 0.0,
            required_skill_score=sc.required_skill_score if sc else 0.0,
            preferred_skill_score=sc.preferred_skill_score if sc else 0.0,
        ),
        matched_skills=rec.matched_skills or [],
        partial_skills=rec.partial_skills or [],
        missing_required_skills=rec.missing_required_skills or [],
        missing_preferred_skills=rec.missing_preferred_skills or [],
        why_recommended=rec.why_recommended or "",
        explanation_breakdown=rec.explanation_breakdown or [],
    )


# ----------------------------------------------------
# 4. Trigger Recalculate / Refresh
# ----------------------------------------------------
@router.post("/profile/intelligence/recalculate", response_model=RecalculateResponse)
def recalculate_profile_intelligence(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Forces immediate re-analysis of student skill gaps and job recommendations.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    agent = ProfileIntelligenceAgent(db)
    result = agent.analyze_profile(student_id=profile.id, trigger_event="USER_RECALCULATE_CLICK", force_recalculate=True)

    return RecalculateResponse(
        status="success",
        message="Profile intelligence and recommendations recalculated successfully.",
        student_id=profile.id,
        profile_version=result["profile_version"],
        duration_seconds=result["metrics"]["duration_seconds"],
        career_fit_score=result["career_fit_score"],
        recommendations_count=len(result["recommendations"]),
    )


@router.post("/profile/intelligence/refresh")
def refresh_profile_intelligence_if_stale(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Checks if student intelligence is stale or missing and refreshes if necessary.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    state = db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == profile.id).first()
    if not state or state.analysis_status != "COMPLETED":
        agent = ProfileIntelligenceAgent(db)
        result = agent.analyze_profile(student_id=profile.id, trigger_event="STALE_REFRESH")
        return {"refreshed": True, "career_fit_score": result["career_fit_score"]}

    return {"refreshed": False, "career_fit_score": state.career_fit_score, "last_analyzed_at": state.last_analyzed_at}


# ----------------------------------------------------
# 5. Admin Endpoints
# ----------------------------------------------------
@router.post("/admin/profile-intelligence/recalculate/{student_id}")
def admin_recalculate_student(
    student_id: str,
    db: Session = Depends(get_db)
):
    """
    Admin: Triggers immediate recalculation for a specific student ID.
    """
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student not found")

    agent = ProfileIntelligenceAgent(db)
    result = agent.analyze_profile(student_id=student_id, trigger_event="ADMIN_TRIGGER", force_recalculate=True)
    return {"status": "success", "result": result}


@router.post("/admin/profile-intelligence/recalculate-all")
def admin_recalculate_all_students(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Admin: Triggers asynchronous batch recalculation for all registered students.
    """
    def run_batch():
        from backend.app.core.database import SessionLocal
        batch_db = SessionLocal()
        try:
            processor = BatchProcessor(batch_db)
            processor.process_all_students(trigger_event="ADMIN_RECALCULATE_ALL")
        finally:
            batch_db.close()

    background_tasks.add_task(run_batch)
    return {"status": "queued", "message": "Batch recomputation for all students has been queued in background."}


@router.get("/admin/profile-intelligence/status")
def get_admin_intelligence_status(db: Session = Depends(get_db)):
    """
    Admin: Returns operational health metrics of the Profile Intelligence subsystem.
    """
    total_profiles = db.query(StudentProfile).count()
    analyzed_states = db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.analysis_status == "COMPLETED").count()
    failed_states = db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.analysis_status == "FAILED").count()
    total_recommendations = db.query(ProfileRecommendation).count()
    total_gaps = db.query(ProfileSkillGap).count()

    return {
        "total_student_profiles": total_profiles,
        "analyzed_profiles": analyzed_states,
        "failed_profiles": failed_states,
        "total_recommendations_stored": total_recommendations,
        "total_skill_gaps_stored": total_gaps,
        "system_status": "OPERATIONAL"
    }


@router.get("/admin/profile-intelligence/runs")
def get_admin_recommendation_runs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Admin: Lists audit logs of recent recommendation pipeline runs.
    """
    runs = (
        db.query(RecommendationRun)
        .order_by(desc(RecommendationRun.created_at))
        .limit(limit)
        .all()
    )

    return {
        "total": len(runs),
        "runs": [
            {
                "id": r.id,
                "student_id": r.student_id,
                "trigger_event": r.trigger_event,
                "profile_version": r.profile_version,
                "industry_data_version": r.industry_data_version,
                "candidate_jobs_count": r.candidate_jobs_count,
                "eligible_jobs_count": r.eligible_jobs_count,
                "ranked_jobs_count": r.ranked_jobs_count,
                "skill_gaps_count": r.skill_gaps_count,
                "recommendations_count": r.recommendations_count,
                "duration_seconds": r.duration_seconds,
                "status": r.status,
                "error_message": r.error_message,
                "created_at": r.created_at
            }
            for r in runs
        ]
    }

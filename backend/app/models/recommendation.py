import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, Boolean, DateTime, Integer, ForeignKey, UniqueConstraint, Index, JSON
)
from sqlalchemy.orm import relationship, backref
from backend.app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class ProfileIntelligenceState(Base):
    """
    Tracks the processing status, profile version, and industry version for a student profile.
    Prevents redundant recalculation and supports selective cache invalidation.
    """
    __tablename__ = "profile_intelligence_states"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    profile_version = Column(Integer, default=1, nullable=False)
    industry_data_version = Column(String(50), default="1.0.0", nullable=False)
    target_role_id = Column(String(50), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True)
    target_role_name = Column(String(100), nullable=True)
    career_fit_score = Column(Float, default=0.0)
    
    analysis_status = Column(String(30), default="IDLE", index=True)  # IDLE, RUNNING, COMPLETED, FAILED
    last_analyzed_at = Column(DateTime, nullable=True)
    error_log = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("StudentProfile", backref=backref("intelligence_state", uselist=False))
    target_role = relationship("Role", foreign_keys=[target_role_id])


class ProfileSkillGap(Base):
    """
    Calculated skill gaps comparing student skills against target role industry demands.
    """
    __tablename__ = "profile_skill_gaps"
    __table_args__ = (
        UniqueConstraint("student_id", "skill_id", name="uq_profile_skill_gap"),
        Index("idx_psg_student_priority", "student_id", "priority_score"),
        Index("idx_psg_student_status", "student_id", "status"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(50), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Status: MATCHED (student has skill), PARTIAL (related skill), MISSING (demanded but student lacks), LOW_CONFIDENCE
    status = Column(String(30), nullable=False, index=True)
    priority_level = Column(String(20), default="MEDIUM", index=True)  # HIGH, MEDIUM, LOW
    priority_score = Column(Float, default=0.0)  # Normalized 0-100 score
    
    demand_percentage = Column(Float, default=0.0)
    importance_score = Column(Float, default=0.0)
    trend_label = Column(String(30), default="STABLE")  # RISING_FAST, RISING, STABLE, DECLINING
    is_emerging = Column(Boolean, default=False)
    requirement_type = Column(String(20), default="UNKNOWN")  # REQUIRED, PREFERRED, GENERAL
    
    student_confidence = Column(Float, default=0.0)
    matching_evidence = Column(Text, nullable=True)  # e.g. "Matched via related skill: PostgreSQL"
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("StudentProfile", backref="skill_gaps")
    skill = relationship("Skill")


class ProfileRecommendation(Base):
    """
    Top personalized job recommendations generated for a student.
    """
    __tablename__ = "profile_recommendations"
    __table_args__ = (
        UniqueConstraint("student_id", "job_id", name="uq_profile_recommendation"),
        Index("idx_pr_student_rank", "student_id", "rank"),
        Index("idx_pr_student_score", "student_id", "match_score"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    rank = Column(Integer, nullable=False)
    match_score = Column(Float, nullable=False)  # Composite 0-100 score
    
    # Skill breakdown stored as JSON lists of objects/names
    matched_skills = Column(JSON, default=list)
    partial_skills = Column(JSON, default=list)
    missing_required_skills = Column(JSON, default=list)
    missing_preferred_skills = Column(JSON, default=list)
    
    # Deterministic explanation
    why_recommended = Column(Text, nullable=False)
    explanation_breakdown = Column(JSON, default=list)  # list of key explanation points
    
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)

    student = relationship("StudentProfile", backref="recommendations")
    job = relationship("Job")
    scores = relationship("RecommendationScore", back_populates="recommendation", uselist=False, cascade="all, delete-orphan")


class RecommendationScore(Base):
    """
    Granular dimensional score breakdown for a specific recommendation.
    """
    __tablename__ = "recommendation_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recommendation_id = Column(String(36), ForeignKey("profile_recommendations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    skill_score = Column(Float, default=0.0)
    role_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    location_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    freshness_score = Column(Float, default=0.0)
    
    required_skill_score = Column(Float, default=0.0)
    preferred_skill_score = Column(Float, default=0.0)
    
    recommendation = relationship("ProfileRecommendation", back_populates="scores")


class RecommendationRun(Base):
    """
    Observability and audit log for recommendation engine executions.
    """
    __tablename__ = "recommendation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    trigger_event = Column(String(50), default="MANUAL")  # MANUAL, PROFILE_UPDATED, SCHEDULED, RECALCULATE_ALL
    profile_version = Column(Integer, default=1)
    industry_data_version = Column(String(50), default="1.0.0")
    
    candidate_jobs_count = Column(Integer, default=0)
    eligible_jobs_count = Column(Integer, default=0)
    ranked_jobs_count = Column(Integer, default=0)
    skill_gaps_count = Column(Integer, default=0)
    recommendations_count = Column(Integer, default=0)
    
    duration_seconds = Column(Float, default=0.0)
    status = Column(String(30), default="COMPLETED")  # COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

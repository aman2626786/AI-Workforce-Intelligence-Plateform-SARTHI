import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, Boolean, DateTime, Integer, ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class RoleSkillDemand(Base):
    """
    Current calculated aggregated demand of skills for a given canonical role.
    """
    __tablename__ = "role_skill_demands"
    __table_args__ = (
        UniqueConstraint("role_id", "skill_id", name="uq_role_skill_demand"),
        Index("idx_rsd_role_demand", "role_id", "demand_percentage"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(50), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    job_count = Column(Integer, default=0)
    total_jobs = Column(Integer, default=0)
    demand_percentage = Column(Float, default=0.0)
    required_count = Column(Integer, default=0)
    preferred_count = Column(Integer, default=0)
    importance_score = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    role = relationship("Role")
    skill = relationship("Skill")

class SkillDemandSnapshot(Base):
    """
    Immutable historical snapshot of skill demand by role, country, and month.
    """
    __tablename__ = "skill_demand_snapshots"
    __table_args__ = (
        UniqueConstraint("role_id", "country", "snapshot_month", "skill_id", name="uq_skill_demand_snapshot"),
        Index("idx_snapshot_lookup", "role_id", "snapshot_month", "country"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    country = Column(String(10), default="ALL", index=True)
    snapshot_month = Column(String(7), nullable=False, index=True)  # e.g. "2026-08", "2026-09"
    skill_id = Column(String(50), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    job_count = Column(Integer, default=0)
    total_jobs = Column(Integer, default=0)
    demand_percentage = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    role = relationship("Role")
    skill = relationship("Skill")

class SkillTrend(Base):
    """
    Calculated momentum and directional trends between historical snapshots.
    """
    __tablename__ = "skill_trends"
    __table_args__ = (
        UniqueConstraint("role_id", "skill_id", name="uq_skill_trend"),
        Index("idx_skill_trend_momentum", "role_id", "trend_label"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(50), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_demand = Column(Float, default=0.0)
    current_demand = Column(Float, default=0.0)
    absolute_change = Column(Float, default=0.0)
    percentage_change = Column(Float, default=0.0)
    trend_label = Column(String(30), default="STABLE", index=True)  # RISING_FAST, RISING, STABLE, DECLINING, DECLINING_FAST
    is_emerging = Column(Boolean, default=False, index=True)
    is_declining = Column(Boolean, default=False, index=True)
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    role = relationship("Role")
    skill = relationship("Skill")

class PipelineRun(Base):
    """
    Log of skill intelligence pipeline execution runs.
    """
    __tablename__ = "pipeline_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_type = Column(String(50), default="INCREMENTAL")  # INCREMENTAL, FULL_REPROCESS, AGGREGATE_ONLY
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    completed_at = Column(DateTime, nullable=True)
    jobs_found = Column(Integer, default=0)
    jobs_processed = Column(Integer, default=0)
    skills_extracted = Column(Integer, default=0)
    skills_normalized = Column(Integer, default=0)
    roles_classified = Column(Integer, default=0)
    failed_jobs = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    status = Column(String(30), default="RUNNING")  # RUNNING, SUCCESS, PARTIAL, FAILED
    error_log = Column(Text, nullable=True)

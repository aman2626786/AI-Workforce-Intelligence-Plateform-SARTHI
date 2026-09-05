import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Float, Boolean, DateTime, Integer, ForeignKey, UniqueConstraint, Index, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class RawJob(Base):
    __tablename__ = "raw_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source = Column(String(50), nullable=False, index=True)
    source_job_id = Column(String(255), nullable=False)
    raw_payload = Column(JSON, nullable=False, default=dict)
    fetched_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_raw_jobs_source_id", "source", "source_job_id"),
    )

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source = Column(String(50), nullable=False, index=True)
    source_job_id = Column(String(255), nullable=False)
    canonical_role = Column(String(100), nullable=False, index=True)
    role_id = Column(String(50), ForeignKey("roles.id", ondelete="SET NULL"), nullable=True, index=True)
    role_confidence = Column(Float, default=0.0)
    role_classification_method = Column(String(50), nullable=True)  # EXACT_TITLE, KEYWORD_RULES, TFIDF_COSINE
    title = Column(String(255), nullable=False)
    company_name = Column(String(255), nullable=False, index=True)
    location = Column(String(255), nullable=True)
    country = Column(String(10), nullable=False, index=True)
    job_type = Column(String(50), default="Full-time")
    description = Column(Text, nullable=False)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    job_url = Column(String(1000), nullable=False)
    category = Column(String(100), nullable=True)
    remote = Column(Boolean, default=False)
    status = Column(String(20), default="ACTIVE", index=True)  # ACTIVE, EXPIRED, REMOVED, INVALID
    
    # Pipeline Processing State (RAW -> CLEANED -> SKILLS_EXTRACTED -> NORMALIZED -> ROLE_CLASSIFIED -> ANALYZED -> FAILED)
    processing_state = Column(String(30), default="RAW", index=True)
    processing_attempts = Column(Integer, default=0)
    last_processed_at = Column(DateTime(timezone=True), nullable=True)
    processing_error = Column(Text, nullable=True)

    content_hash = Column(String(64), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_seen_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    sources = relationship("JobSource", back_populates="job", cascade="all, delete-orphan")
    skills = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")
    role = relationship("Role")

    __table_args__ = (
        Index("idx_jobs_source_id", "source", "source_job_id"),
        Index("idx_jobs_processing_state", "processing_state"),
    )

class JobSource(Base):
    __tablename__ = "job_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(50), nullable=False)
    source_job_id = Column(String(255), nullable=False)
    source_url = Column(String(1000), nullable=True)
    fetched_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    job = relationship("Job", back_populates="sources")

    __table_args__ = (
        UniqueConstraint("source", "source_job_id", name="uq_job_source"),
        Index("idx_job_sources_lookup", "source", "source_job_id"),
    )

class JobCollectionError(Base):
    __tablename__ = "job_collection_errors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source = Column(String(50), nullable=False, index=True)
    source_job_id = Column(String(255), nullable=True)
    error_type = Column(String(100), nullable=False, index=True)
    error_details = Column(Text, nullable=True)
    raw_payload = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class JobSkill(Base):
    __tablename__ = "job_skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(50), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    confidence = Column(Float, default=1.0)
    source_text = Column(String(255), nullable=True)  # matched token/alias text
    
    # Skill Intelligence Extensions
    requirement_type = Column(String(20), default="UNKNOWN", index=True)  # REQUIRED, PREFERRED, UNKNOWN
    evidence_text = Column(Text, nullable=True)  # Sentence context
    section = Column(String(50), nullable=True)  # REQUIRED, PREFERRED, RESPONSIBILITIES, GENERAL
    start_pos = Column(Integer, nullable=True)
    end_pos = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    job = relationship("Job", back_populates="skills")
    skill = relationship("Skill")

    __table_args__ = (
        UniqueConstraint("job_id", "skill_id", name="uq_job_skill"),
        Index("idx_job_skill_req_type", "job_id", "requirement_type"),
    )

class CollectionRun(Base):
    __tablename__ = "collection_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source = Column(String(50), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    jobs_fetched = Column(Integer, default=0)
    jobs_inserted = Column(Integer, default=0)
    jobs_updated = Column(Integer, default=0)
    duplicates_found = Column(Integer, default=0)
    invalid_jobs = Column(Integer, default=0)
    errors = Column(Integer, default=0)
    status = Column(String(50), default="RUNNING")  # RUNNING, SUCCESS, PARTIAL, FAILED

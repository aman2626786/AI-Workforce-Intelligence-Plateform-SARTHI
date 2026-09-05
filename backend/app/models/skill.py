import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, JSON, Boolean, Integer, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(50), primary_key=True)  # Canonical ID e.g. "SKL_001" or "SKL_PYTHON"
    canonical_name = Column(String(150), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100), nullable=True, index=True)
    description = Column(Text, nullable=True)
    parent_skill_id = Column(String(50), ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    aliases = Column(JSON, default=list)  # list of lowercased alias strings for backward compatibility
    source = Column(String(50), default="mind_ontology")
    confidence = Column(Float, default=1.0)
    active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student_skills = relationship("StudentSkill", back_populates="skill", cascade="all, delete-orphan")
    alias_records = relationship("SkillAlias", back_populates="skill", cascade="all, delete-orphan")
    parent_skill = relationship("Skill", remote_side=[id], backref="child_skills")

class SkillAlias(Base):
    __tablename__ = "skill_aliases"
    __table_args__ = (
        UniqueConstraint('skill_id', 'alias_norm', name='uq_skill_alias_norm'),
        Index("idx_skill_alias_norm", "alias_norm"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    skill_id = Column(String(50), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    alias = Column(String(150), nullable=False)
    alias_norm = Column(String(150), nullable=False)
    source = Column(String(50), default="mind_ontology")
    is_abbreviation = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    skill = relationship("Skill", back_populates="alias_records")

class SkillRelationship(Base):
    __tablename__ = "skill_relationships"
    __table_args__ = (
        UniqueConstraint('source_skill_id', 'target_skill_id', 'relation_type', name='uq_skill_relationship'),
        Index("idx_skill_rel_source", "source_skill_id"),
        Index("idx_skill_rel_target", "target_skill_id"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_skill_id = Column(String(50), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    target_skill_id = Column(String(50), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String(50), nullable=False, index=True)  # EXACT, RELATED, PARENT, CHILD, PREREQUISITE, ALTERNATIVE, TOOL_OF, FRAMEWORK_OF
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    source_skill = relationship("Skill", foreign_keys=[source_skill_id])
    target_skill = relationship("Skill", foreign_keys=[target_skill_id])

class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    raw_name = Column(String(150), unique=True, nullable=False, index=True)
    source_job_id = Column(String(36), nullable=True)
    frequency = Column(Integer, default=1)
    confidence = Column(Float, default=0.5)
    status = Column(String(30), default="PENDING", index=True)  # PENDING, APPROVED, MAPPED, REJECTED
    mapped_skill_id = Column(String(50), ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    mapped_skill = relationship("Skill", foreign_keys=[mapped_skill_id])

class StudentSkill(Base):
    __tablename__ = "student_skills"
    __table_args__ = (
        UniqueConstraint('student_id', 'skill_id', name='uq_student_skill'),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String(50), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(50), default="resume")  # resume, student_input, assessment, project, certificate
    verification_status = Column(String(50), default="unverified")  # unverified, verified
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("StudentProfile", back_populates="student_skills")
    skill = relationship("Skill", back_populates="student_skills")
    evidence = relationship("SkillEvidence", back_populates="student_skill", cascade="all, delete-orphan")

class SkillEvidence(Base):
    __tablename__ = "skill_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_skill_id = Column(String(36), ForeignKey("student_skills.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=True, index=True)
    source_section = Column(String(100), nullable=True)  # SKILLS, PROJECTS, EXPERIENCE, etc.
    original_text = Column(String(255), nullable=True)   # Exact string in resume e.g. "ML"
    evidence_text = Column(Text, nullable=True)          # Sentence or snippet context
    confidence = Column(Float, default=1.0)

    student_skill = relationship("StudentSkill", back_populates="evidence")
    resume = relationship("Resume", back_populates="skill_evidence")

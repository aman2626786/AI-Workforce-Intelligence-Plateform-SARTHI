import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=True)
    parser_version = Column(String(50), default="1.0.0")
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="uploaded")  # uploaded, analyzing, completed, failed

    # Relationships
    user = relationship("User", back_populates="resumes")
    extraction_runs = relationship("ExtractionRun", back_populates="resume", cascade="all, delete-orphan")
    skill_evidence = relationship("SkillEvidence", back_populates="resume", cascade="all, delete-orphan")

class ExtractionRun(Base):
    __tablename__ = "extraction_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    parser_version = Column(String(50), default="1.0.0")
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="running")  # running, success, failed
    error_message = Column(Text, nullable=True)

    resume = relationship("Resume", back_populates="extraction_runs")

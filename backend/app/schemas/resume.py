from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.app.schemas.skills import ExtractedSkillPreview
from backend.app.schemas.profile import EducationItem, ExperienceItem, ProjectItem, CertificationItem, ConflictItem

class ResumeUploadResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_size_bytes: int
    status: str
    uploaded_at: datetime

class ResumeAnalysisPreview(BaseModel):
    resume_id: str
    file_name: str
    parser_version: str
    raw_text_length: int
    sections_detected: List[str]
    personal_info: Dict[str, Any]
    education: List[EducationItem]
    experience: List[ExperienceItem]
    projects: List[ProjectItem]
    certifications: List[CertificationItem]
    skills: List[ExtractedSkillPreview]
    conflicts: List[ConflictItem]
    confidence_summary: Dict[str, float]

class ResumeConfirmRequest(BaseModel):
    personal_info: Optional[Dict[str, Any]] = None
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    certifications: List[CertificationItem] = []
    skills: List[ExtractedSkillPreview] = []
    resolved_conflicts: List[ConflictItem] = []

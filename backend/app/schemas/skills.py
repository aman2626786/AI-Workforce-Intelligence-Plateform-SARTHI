from pydantic import BaseModel
from typing import Optional, List

class SkillMasterResponse(BaseModel):
    id: str
    canonical_name: str
    category: str
    aliases: List[str] = []

    class Config:
        from_attributes = True

class SkillEvidenceSchema(BaseModel):
    source_section: Optional[str] = None
    original_text: Optional[str] = None
    evidence_text: Optional[str] = None
    confidence: float = 1.0

class StudentSkillResponse(BaseModel):
    id: str
    skill_id: str
    canonical_name: str
    category: str
    source: str = "resume"
    verification_status: str = "unverified"
    confidence: float = 1.0
    evidence: List[SkillEvidenceSchema] = []

    class Config:
        from_attributes = True

class ExtractedSkillPreview(BaseModel):
    skill_id: str
    canonical_name: str
    category: str
    original_text: str
    source_section: str
    confidence: float
    confirmed: bool = True

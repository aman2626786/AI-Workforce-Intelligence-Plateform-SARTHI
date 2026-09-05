from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from datetime import datetime

class EducationItem(BaseModel):
    id: Optional[str] = None
    degree: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    percentage: Optional[float] = None

class ExperienceItem(BaseModel):
    id: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class ProjectItem(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    technologies: List[str] = []
    url: Optional[str] = None

class CertificationItem(BaseModel):
    id: Optional[str] = None
    name: str
    issuer: Optional[str] = None
    date: Optional[str] = None
    credential_url: Optional[str] = None

class ConflictItem(BaseModel):
    id: Optional[str] = None
    field_name: str
    user_value: Optional[str] = None
    resume_value: Optional[str] = None
    resolution: str = "preserved_user_input"

class BasicProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    city: str = Field(..., description="Current City")
    education_level: str = Field(..., description="e.g. Undergraduate, Postgraduate")
    degree: str = Field(..., description="e.g. B.Tech, BCA, B.Sc")
    branch: Optional[str] = None
    college: str = Field(..., description="College or University Name")
    graduation_year: int = Field(..., ge=1990, le=2035)
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    target_role: Optional[str] = None
    preferred_location: Optional[str] = None

class StudentProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    city: Optional[str] = None
    education_level: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    college: Optional[str] = None
    graduation_year: Optional[int] = None
    target_role: Optional[str] = None
    preferred_location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    certifications: List[CertificationItem] = []
    conflicts: List[ConflictItem] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

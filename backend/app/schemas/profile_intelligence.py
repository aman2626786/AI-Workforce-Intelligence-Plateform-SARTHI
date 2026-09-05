from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ScoreBreakdownSchema(BaseModel):
    skill_score: float
    role_score: float
    experience_score: float
    location_score: float
    education_score: float
    freshness_score: float
    required_skill_score: float
    preferred_skill_score: float

class SkillGapItemSchema(BaseModel):
    skill_id: str
    canonical_name: str
    category: str
    status: str  # MATCHED, PARTIAL, MISSING, LOW_CONFIDENCE
    priority_level: str  # HIGH, MEDIUM, LOW
    priority_score: float
    demand_percentage: float
    importance_score: float
    trend_label: str
    is_emerging: bool
    requirement_type: str
    student_confidence: float
    matching_evidence: Optional[str] = None

class SkillGapsResponse(BaseModel):
    student_id: str
    target_role: Optional[str] = None
    career_fit_score: float
    total_gaps: int
    matched_count: int
    partial_count: int
    missing_count: int
    skill_gaps: List[SkillGapItemSchema]

class RecommendationItemSchema(BaseModel):
    rank: int
    job_id: str
    title: str
    company_name: str
    location: Optional[str] = None
    country: str
    remote: bool
    job_url: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    posted_at: Optional[datetime] = None
    match_score: float
    scores: ScoreBreakdownSchema
    matched_skills: List[Dict[str, Any]]
    partial_skills: List[Dict[str, Any]]
    missing_required_skills: List[Dict[str, Any]]
    missing_preferred_skills: List[Dict[str, Any]]
    why_recommended: str
    explanation_breakdown: List[str]

class RecommendationsResponse(BaseModel):
    student_id: str
    profile_version: int
    industry_data_version: str
    target_role: Optional[str] = None
    career_fit_score: float
    total_recommendations: int
    recommendations: List[RecommendationItemSchema]

class ProfileIntelligenceSummaryResponse(BaseModel):
    student_id: str
    name: str
    profile_version: int
    industry_data_version: str
    target_role: Optional[str] = None
    career_fit_score: float
    top_skills: List[str]
    high_priority_gaps: List[SkillGapItemSchema]
    top_recommendations: List[RecommendationItemSchema]
    last_analyzed_at: Optional[datetime] = None
    analysis_status: str

class RecalculateResponse(BaseModel):
    status: str
    message: str
    student_id: str
    profile_version: int
    duration_seconds: float
    career_fit_score: float
    recommendations_count: int

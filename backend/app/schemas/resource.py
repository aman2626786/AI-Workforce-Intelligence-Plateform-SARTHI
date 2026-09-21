from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field

class ResourceBase(BaseModel):
    title: str = Field(..., max_length=500)
    resource_type: str = Field(..., max_length=50)  # INDUSTRY_NEWS, RESEARCH_PAPER, LEARNING_RESOURCE, TECH_UPDATE, OPPORTUNITY
    short_description: str
    content_summary: Optional[str] = None
    content_markdown: Optional[str] = None
    attached_links: Optional[List[Dict[str, Any]]] = []
    original_url: str = Field(..., max_length=1000)
    source_name: Optional[str] = None
    source_domain: Optional[str] = None
    author: Optional[str] = None
    organization: Optional[str] = None
    publisher: Optional[str] = None
    published_at: Optional[datetime] = None
    thumbnail_url: Optional[str] = None
    language: str = "en"
    difficulty: str = "All Levels"
    category: str
    subcategory: Optional[str] = None
    tags: List[str] = []
    hashtags: List[str] = []
    keywords: List[str] = []
    skills: List[str] = []
    target_roles: List[str] = []
    location: Optional[str] = None
    deadline: Optional[datetime] = None
    is_verified: bool = False
    verification_status: str = "UNVERIFIED"  # UNVERIFIED, VERIFIED, NEEDS_REVIEW
    license: Optional[str] = None
    license_url: Optional[str] = None
    status: str = "PUBLISHED"  # DRAFT, NEEDS_REVIEW, PUBLISHED, ARCHIVED

class ResourceCreate(ResourceBase):
    slug: Optional[str] = None

class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    resource_type: Optional[str] = None
    short_description: Optional[str] = None
    content_summary: Optional[str] = None
    content_markdown: Optional[str] = None
    attached_links: Optional[List[Dict[str, Any]]] = None
    original_url: Optional[str] = None
    source_name: Optional[str] = None
    source_domain: Optional[str] = None
    author: Optional[str] = None
    organization: Optional[str] = None
    publisher: Optional[str] = None
    published_at: Optional[datetime] = None
    thumbnail_url: Optional[str] = None
    language: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    tags: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    target_roles: Optional[List[str]] = None
    location: Optional[str] = None
    deadline: Optional[datetime] = None
    is_verified: Optional[bool] = None
    verification_status: Optional[str] = None
    license: Optional[str] = None
    license_url: Optional[str] = None
    status: Optional[str] = None

class ResourceCommentCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=2000)

class ResourceCommentResponse(BaseModel):
    id: str
    resource_id: str
    user_id: str
    user_name: Optional[str] = "Student"
    content: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResourceResponse(BaseModel):
    id: str
    title: str
    slug: str
    resource_type: str
    short_description: str
    content_summary: Optional[str] = None
    content_markdown: Optional[str] = None
    attached_links: Optional[List[Dict[str, Any]]] = []
    original_url: str
    source_name: Optional[str] = None
    source_domain: Optional[str] = None
    author: Optional[str] = None
    organization: Optional[str] = None
    publisher: Optional[str] = None
    published_at: Optional[datetime] = None
    thumbnail_url: Optional[str] = None
    language: str
    difficulty: str
    category: str
    subcategory: Optional[str] = None
    tags: List[str] = []
    hashtags: List[str] = []
    keywords: List[str] = []
    skills: List[str] = []
    target_roles: List[str] = []
    location: Optional[str] = None
    deadline: Optional[datetime] = None
    is_verified: bool
    verification_status: str
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    status: str
    license: Optional[str] = None
    license_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    view_count: int = 0
    like_count: int = 0
    save_count: int = 0
    share_count: int = 0
    comment_count: int = 0

    # User-specific contextual state
    is_liked: Optional[bool] = False
    is_saved: Optional[bool] = False
    match_score: Optional[float] = None
    match_reasons: Optional[List[str]] = []
    skill_gap_covered: Optional[str] = None

    class Config:
        from_attributes = True

class ResourceListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    resources: List[ResourceResponse]

class ResourceMetadataFetchRequest(BaseModel):
    url: str

class ResourceMetadataFetchResponse(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    source_name: Optional[str] = None
    source_domain: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    published_date: Optional[str] = None
    thumbnail_url: Optional[str] = None
    inferred_type: str = "LEARNING_RESOURCE"
    inferred_category: str = "Technology"
    detected_skills: List[str] = []
    tags: List[str] = []
    keywords: List[str] = []

class ResourceAnalyticsResponse(BaseModel):
    total_resources: int
    published_count: int
    draft_count: int
    needs_review_count: int
    verified_count: int
    total_views: int
    total_likes: int
    total_saves: int
    total_shares: int
    total_comments: int
    by_type: Dict[str, int]
    by_category: Dict[str, int]
    top_skills: List[Dict[str, Any]]
    top_sources: List[Dict[str, Any]]
    top_student_interests: List[Dict[str, Any]]

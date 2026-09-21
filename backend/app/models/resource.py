import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Resource(Base):
    __tablename__ = "resources"
    __table_args__ = (
        Index("idx_res_type_status", "resource_type", "status"),
        Index("idx_res_category_status", "category", "status"),
        Index("idx_res_pub_status", "published_at", "status"),
        Index("idx_res_slug", "slug", unique=True),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(500), nullable=False)
    slug = Column(String(500), nullable=False, unique=True)
    resource_type = Column(String(50), nullable=False, index=True)
    # Types: INDUSTRY_NEWS, RESEARCH_PAPER, LEARNING_RESOURCE, TECH_UPDATE, OPPORTUNITY

    short_description = Column(Text, nullable=False)
    content_summary = Column(Text, nullable=True)
    content_markdown = Column(Text, nullable=True)
    attached_links = Column(JSON, default=list)
    original_url = Column(String(1000), nullable=False, index=True)
    source_name = Column(String(255), nullable=True, index=True)
    source_domain = Column(String(255), nullable=True)
    author = Column(String(255), nullable=True)
    organization = Column(String(255), nullable=True)
    publisher = Column(String(255), nullable=True)
    published_at = Column(DateTime, nullable=True, index=True)
    thumbnail_url = Column(String(1000), nullable=True)
    language = Column(String(50), default="en")
    difficulty = Column(String(50), default="All Levels")  # Beginner, Intermediate, Advanced, All Levels

    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100), nullable=True)
    tags = Column(JSON, default=list)
    hashtags = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    target_roles = Column(JSON, default=list)

    # Specific to Opportunities (internships, hackathons, fellowships)
    location = Column(String(255), nullable=True)
    deadline = Column(DateTime, nullable=True)

    # Verification
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String(30), default="UNVERIFIED", index=True)  # UNVERIFIED, VERIFIED, NEEDS_REVIEW
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(36), nullable=True)

    # Status
    status = Column(String(30), default="PUBLISHED", index=True)  # DRAFT, NEEDS_REVIEW, PUBLISHED, ARCHIVED
    license = Column(String(100), nullable=True)
    license_url = Column(String(500), nullable=True)

    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Counters
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    save_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)

    # Relationships
    likes = relationship("ResourceLike", back_populates="resource", cascade="all, delete-orphan")
    saves = relationship("SavedResource", back_populates="resource", cascade="all, delete-orphan")
    comments = relationship("ResourceComment", back_populates="resource", cascade="all, delete-orphan")
    views = relationship("ResourceView", back_populates="resource", cascade="all, delete-orphan")


class ResourceLike(Base):
    __tablename__ = "resource_likes"
    __table_args__ = (
        UniqueConstraint("user_id", "resource_id", name="uq_user_resource_like"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="likes")
    resource = relationship("Resource", back_populates="likes")


class SavedResource(Base):
    __tablename__ = "saved_resources"
    __table_args__ = (
        UniqueConstraint("user_id", "resource_id", name="uq_user_saved_resource"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="saved_resources")
    resource = relationship("Resource", back_populates="saves")


class ResourceComment(Base):
    __tablename__ = "resource_comments"
    __table_args__ = (
        Index("idx_comment_resource_status", "resource_id", "status"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    status = Column(String(30), default="APPROVED", index=True)  # APPROVED, FLAGGED, HIDDEN
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="comments")
    resource = relationship("Resource", back_populates="comments")


class ResourceView(Base):
    __tablename__ = "resource_views"
    __table_args__ = (
        Index("idx_view_resource", "resource_id"),
        Index("idx_view_user", "user_id"),
        Index("idx_view_session", "session_id"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String(100), nullable=True)
    viewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    resource = relationship("Resource", back_populates="views")


class ResourceCategory(Base):
    __tablename__ = "resource_categories"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    parent_id = Column(String(50), ForeignKey("resource_categories.id", ondelete="SET NULL"), nullable=True)
    icon = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

    children = relationship("ResourceCategory", backref="parent", remote_side=[id])

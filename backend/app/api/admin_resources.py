from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.resource import Resource, ResourceCategory, ResourceLike, SavedResource, ResourceComment
from backend.app.models.profile import StudentProfile
from backend.app.api.auth import require_admin
from backend.app.services.resource_service import resource_service, slugify
from backend.app.services.metadata_extractor import metadata_extractor
from backend.app.services.resource_ingestion import arxiv_adapter
from backend.app.schemas.resource import (
    ResourceResponse, ResourceCreate, ResourceUpdate, ResourceListResponse,
    ResourceMetadataFetchRequest, ResourceMetadataFetchResponse, ResourceAnalyticsResponse
)

router = APIRouter(
    prefix="/admin/resources",
    tags=["Admin Resource Intelligence"],
)

@router.get("/activity")
def get_resource_activity(
    limit: int = Query(100, ge=1, le=500),
    activity_type: Optional[str] = Query(None, alias="type"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    from_date = datetime.fromisoformat(date_from) if date_from else None
    to_date = datetime.fromisoformat(date_to).replace(hour=23, minute=59, second=59, microsecond=999999) if date_to else None

    def apply_dates(query, created_at):
        if from_date:
            query = query.filter(created_at >= from_date)
        if to_date:
            query = query.filter(created_at <= to_date)
        return query

    include_likes = not activity_type or activity_type == "like"
    include_saves = not activity_type or activity_type == "save"
    include_comments = not activity_type or activity_type == "comment"
    likes = []
    if include_likes:
        likes = apply_dates(
            db.query(ResourceLike, Resource, User, StudentProfile), ResourceLike.created_at
        ).join(Resource, Resource.id == ResourceLike.resource_id).join(
            User, User.id == ResourceLike.user_id
        ).outerjoin(
            StudentProfile, StudentProfile.user_id == User.id
        ).order_by(ResourceLike.created_at.desc()).limit(limit).all()

    saves = []
    if include_saves:
        saves = apply_dates(
            db.query(SavedResource, Resource, User, StudentProfile), SavedResource.created_at
        ).join(Resource, Resource.id == SavedResource.resource_id).join(
            User, User.id == SavedResource.user_id
        ).outerjoin(
            StudentProfile, StudentProfile.user_id == User.id
        ).order_by(SavedResource.created_at.desc()).limit(limit).all()

    comments = []
    if include_comments:
        comments = apply_dates(
            db.query(ResourceComment, Resource, User, StudentProfile), ResourceComment.created_at
        ).join(Resource, Resource.id == ResourceComment.resource_id).join(
            User, User.id == ResourceComment.user_id
        ).outerjoin(
            StudentProfile, StudentProfile.user_id == User.id
        ).order_by(ResourceComment.created_at.desc()).limit(limit).all()

    activity = []
    for item, resource, user, profile in likes:
        activity.append({"id": item.id, "type": "like", "user_id": user.id, "user_name": profile.name if profile else user.email, "email": user.email, "resource_id": resource.id, "resource_title": resource.title, "resource_slug": resource.slug, "content": None, "created_at": item.created_at})
    for item, resource, user, profile in saves:
        activity.append({"id": item.id, "type": "save", "user_id": user.id, "user_name": profile.name if profile else user.email, "email": user.email, "resource_id": resource.id, "resource_title": resource.title, "resource_slug": resource.slug, "content": None, "created_at": item.created_at})
    for item, resource, user, profile in comments:
        activity.append({"id": item.id, "type": "comment", "user_id": user.id, "user_name": profile.name if profile else user.email, "email": user.email, "resource_id": resource.id, "resource_title": resource.title, "resource_slug": resource.slug, "content": item.content, "created_at": item.created_at})
    activity.sort(key=lambda item: item["created_at"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return {"total": len(activity), "activity": activity[:limit]}

@router.delete("/comments/{comment_id}")
def delete_resource_comment(
    comment_id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    comment = db.query(ResourceComment).filter(ResourceComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    resource = db.query(Resource).filter(Resource.id == comment.resource_id).first()
    if resource:
        resource.comment_count = max(0, (resource.comment_count or 0) - 1)
    db.delete(comment)
    db.commit()
    return {"status": "success", "comment_id": comment_id}

@router.get("", response_model=ResourceListResponse)
def admin_list_resources(
    status_filter: Optional[str] = Query(None, alias="status", description="DRAFT, NEEDS_REVIEW, PUBLISHED, ARCHIVED"),
    type: Optional[str] = Query(None, alias="type"),
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Resource)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Resource.status == status_filter.upper())
    if type:
        query = query.filter(Resource.resource_type == type)
    if q:
        clean_q = f"%{q.strip().lower()}%"
        query = query.filter(
            Resource.title.ilike(clean_q) |
            Resource.source_name.ilike(clean_q) |
            Resource.category.ilike(clean_q)
        )

    total = query.count()
    offset = (page - 1) * page_size
    resources = query.order_by(Resource.created_at.desc()).offset(offset).limit(page_size).all()

    items = [
        {
            "id": r.id,
            "title": r.title,
            "slug": r.slug,
            "resource_type": r.resource_type,
            "short_description": r.short_description,
            "content_summary": r.content_summary,
            "content_markdown": r.content_markdown,
            "attached_links": r.attached_links or [],
            "original_url": r.original_url,
            "source_name": r.source_name,
            "source_domain": r.source_domain,
            "author": r.author,
            "organization": r.organization,
            "publisher": r.publisher,
            "published_at": r.published_at,
            "thumbnail_url": r.thumbnail_url,
            "language": r.language,
            "difficulty": r.difficulty,
            "category": r.category,
            "subcategory": r.subcategory,
            "tags": r.tags or [],
            "hashtags": r.hashtags or [],
            "keywords": r.keywords or [],
            "skills": r.skills or [],
            "target_roles": r.target_roles or [],
            "location": r.location,
            "deadline": r.deadline,
            "is_verified": r.is_verified,
            "verification_status": r.verification_status,
            "verified_at": r.verified_at,
            "verified_by": r.verified_by,
            "status": r.status,
            "license": r.license,
            "license_url": r.license_url,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "view_count": r.view_count or 0,
            "like_count": r.like_count or 0,
            "save_count": r.save_count or 0,
            "share_count": r.share_count or 0,
            "comment_count": r.comment_count or 0,
        }
        for r in resources
    ]

    total_pages = max(1, (total + page_size - 1) // page_size)
    return ResourceListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        resources=items
    )

@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def admin_create_resource(
    data: ResourceCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    base_slug = data.slug or slugify(data.title)
    slug = base_slug
    counter = 1
    while db.query(Resource).filter(Resource.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    resource = Resource(
        title=data.title.strip(),
        slug=slug,
        resource_type=data.resource_type,
        short_description=data.short_description.strip(),
        content_summary=data.content_summary,
        content_markdown=data.content_markdown,
        attached_links=data.attached_links or [],
        original_url=str(data.original_url).strip(),
        source_name=data.source_name,
        source_domain=data.source_domain,
        author=data.author,
        organization=data.organization,
        publisher=data.publisher,
        published_at=data.published_at or datetime.now(timezone.utc),
        thumbnail_url=data.thumbnail_url,
        language=data.language or "en",
        difficulty=data.difficulty or "All Levels",
        category=data.category,
        subcategory=data.subcategory,
        tags=data.tags or [],
        hashtags=data.hashtags or [],
        keywords=data.keywords or [],
        skills=data.skills or [],
        target_roles=data.target_roles or [],
        location=data.location,
        deadline=data.deadline,
        is_verified=data.verification_status == "VERIFIED",
        verification_status=data.verification_status,
        verified_at=datetime.now(timezone.utc) if data.verification_status == "VERIFIED" else None,
        status=data.status or "PUBLISHED",
        license=data.license,
        license_url=data.license_url,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource

@router.put("/{id}", response_model=ResourceResponse)
def admin_update_resource(
    id: str,
    data: ResourceUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    update_dict = data.dict(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(resource, field, val)

    if "verification_status" in update_dict:
        resource.is_verified = (update_dict["verification_status"] == "VERIFIED")
        if resource.is_verified:
            resource.verified_at = datetime.now(timezone.utc)

    resource.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(resource)
    return resource

@router.delete("/{id}")
def admin_delete_resource(
    id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    db.delete(resource)
    db.commit()
    return {"status": "success", "message": "Resource deleted"}

@router.post("/{id}/publish")
def admin_publish_resource(
    id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    resource.status = "PUBLISHED"
    db.commit()
    return {"status": "success", "message": "Resource published"}

@router.post("/{id}/archive")
def admin_archive_resource(
    id: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    resource.status = "ARCHIVED"
    db.commit()
    return {"status": "success", "message": "Resource archived"}

@router.post("/{id}/verify")
def admin_verify_resource(
    id: str,
    verification_status: str = Query(..., description="UNVERIFIED, VERIFIED, NEEDS_REVIEW"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    resource.verification_status = verification_status
    resource.is_verified = (verification_status == "VERIFIED")
    if resource.is_verified:
        resource.verified_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "success", "verification_status": verification_status, "is_verified": resource.is_verified}

@router.post("/fetch-metadata", response_model=ResourceMetadataFetchResponse)
async def admin_fetch_metadata(
    data: ResourceMetadataFetchRequest,
    current_admin: User = Depends(require_admin),
):
    """
    Extracts OpenGraph, schema.org, title, author, and autodetects canonical skills from external URL.
    Does NOT auto-publish. Gives structured preview to admin for review.
    """
    try:
        res = await metadata_extractor.fetch_metadata(data.url)
        return ResourceMetadataFetchResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to fetch metadata: {str(e)}")

@router.get("/analytics", response_model=ResourceAnalyticsResponse)
def admin_get_analytics(db: Session = Depends(get_db)):
    data = resource_service.get_analytics(db)
    return ResourceAnalyticsResponse(**data)

@router.post("/ingest")
async def admin_trigger_ingest(
    source: str = Query("arxiv", description="arxiv, rss"),
    topic: str = Query("cs.AI"),
    limit: int = Query(5, ge=1, le=20),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Automated source adapter fetching.
    All newly fetched resources are queued as NEEDS_REVIEW so admin can review before publishing.
    """
    fetched = []
    if source == "arxiv":
        fetched = await arxiv_adapter.fetch_latest(topic=topic, limit=limit)

    inserted_count = 0
    existing_urls = {r[0] for r in db.query(Resource.original_url).all()}
    for item in fetched:
        if item["original_url"] in existing_urls:
            continue
        base_slug = slugify(item["title"])
        slug = base_slug
        counter = 1
        while db.query(Resource).filter(Resource.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        res = Resource(
            title=item["title"],
            slug=slug,
            resource_type=item["resource_type"],
            short_description=item["short_description"],
            content_summary=item.get("content_summary"),
            original_url=item["original_url"],
            source_name=item["source_name"],
            source_domain=item.get("source_domain"),
            author=item.get("author"),
            publisher=item.get("publisher"),
            published_at=item.get("published_at") or datetime.now(timezone.utc),
            category=item.get("category", "Research"),
            subcategory=item.get("subcategory"),
            skills=item.get("skills", []),
            tags=item.get("tags", []),
            verification_status="NEEDS_REVIEW",
            status="NEEDS_REVIEW",
        )
        db.add(res)
        existing_urls.add(item["original_url"])
        inserted_count += 1

    db.commit()
    return {"status": "success", "fetched": len(fetched), "inserted": inserted_count}

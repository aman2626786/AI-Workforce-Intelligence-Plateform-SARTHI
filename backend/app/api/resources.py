from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.user import User
from backend.app.api.auth import oauth2_scheme, get_current_user
from backend.app.services.resource_service import resource_service
from backend.app.services.resource_recommender import resource_recommender
from backend.app.models.resource import Resource, ResourceCategory
from backend.app.schemas.resource import (
    ResourceResponse, ResourceListResponse, ResourceCommentCreate, ResourceCommentResponse
)

router = APIRouter(prefix="/resources", tags=["Resource Intelligence Hub"])

def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
        return db.query(User).filter(User.id == payload["sub"]).first()
    except Exception:
        return None

@router.get("", response_model=ResourceListResponse)
def list_resources(
    type: Optional[str] = Query(None, alias="type", description="Resource type e.g. INDUSTRY_NEWS, RESEARCH_PAPER"),
    category: Optional[str] = None,
    skill: Optional[str] = None,
    tag: Optional[str] = None,
    difficulty: Optional[str] = None,
    source: Optional[str] = None,
    q: Optional[str] = None,
    sort_by: str = Query("latest", description="latest, viewed, liked, saved, trending"),
    verified_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Public discovery feed for verified resources.
    Supports multi-attribute search, category/skill filtering, and optional student score boosting.
    """
    items, total = resource_service.list_resources(
        db=db,
        resource_type=type,
        category=category,
        skill=skill,
        tag=tag,
        difficulty=difficulty,
        source=source,
        q=q,
        sort_by=sort_by,
        verified_only=verified_only,
        page=page,
        page_size=page_size,
        current_user=current_user,
        include_unapproved=False
    )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return ResourceListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        resources=items
    )

@router.get("/trending", response_model=List[ResourceResponse])
def get_trending_resources(
    limit: int = Query(6, ge=1, le=20),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Returns time-decayed trending resources calculated via view, like, save, and share activity.
    """
    items, _ = resource_service.list_resources(
        db=db,
        sort_by="trending",
        page=1,
        page_size=limit,
        current_user=current_user,
        include_unapproved=False
    )
    return items

@router.get("/recommended", response_model=List[ResourceResponse])
def get_recommended_resources(
    limit: int = Query(8, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns personalized resources matched against student resume skills and skill gaps.
    """
    items, _ = resource_service.list_resources(
        db=db,
        page=1,
        page_size=limit * 3,
        current_user=current_user,
        include_unapproved=False
    )
    # Sort descending by calculated match_score
    items.sort(key=lambda x: (x.get("match_score") or 0.0), reverse=True)
    return items[:limit]

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(ResourceCategory).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "icon": c.icon,
            "description": c.description,
            "count": db.query(Resource).filter(Resource.category == c.name, Resource.status == "PUBLISHED").count()
        }
        for c in categories
    ]

@router.get("/guest-status")
def get_guest_status(
    x_session_id: Optional[str] = Header(None, alias="X-Anonymous-Session-Id"),
    db: Session = Depends(get_db)
):
    """
    Returns the number of resource details explored by this anonymous session.
    Always returns has_reached_limit: False to keep learning resources accessible.
    """
    count = resource_service.get_guest_view_count(db, x_session_id) if x_session_id else 0
    return {
        "session_id": x_session_id,
        "views_count": count,
        "views_limit": 999,
        "has_reached_limit": False
    }

@router.get("/user/saved")
def get_user_saved_resources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the student's saved/bookmarked resources library.
    """
    items, total = resource_service.get_saved_resources(db, current_user.id, page, page_size)
    return {"total": total, "page": page, "page_size": page_size, "resources": items}

@router.get("/{slug}", response_model=ResourceResponse)
def get_resource_by_slug(
    slug: str,
    x_session_id: Optional[str] = Header(None, alias="X-Anonymous-Session-Id"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Returns full metadata for a resource.
    Fully accessible for all users and guest readers without 403 Forbidden blocking.
    """
    resource_item = resource_service.get_by_slug(db, slug, current_user)
    if not resource_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    # Record view safely in background/try-except
    try:
        resource_service.record_view(
            db=db,
            resource_id=resource_item["id"],
            user_id=current_user.id if current_user else None,
            session_id=x_session_id
        )
    except Exception as e:
        print(f"[ResourceView] Note on record_view: {e}")

    return resource_item

@router.post("/{id}/like")
def like_resource(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return resource_service.toggle_like(db, id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{id}/like")
def unlike_resource(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return resource_service.toggle_like(db, id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{id}/save")
def save_resource(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return resource_service.toggle_save(db, id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{id}/save")
def unsave_resource(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return resource_service.toggle_save(db, id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{id}/share")
def share_resource(id: str, db: Session = Depends(get_db)):
    share_count = resource_service.increment_share(db, id)
    return {"status": "success", "share_count": share_count}

@router.get("/{id}/comments", response_model=List[ResourceCommentResponse])
def get_resource_comments(id: str, db: Session = Depends(get_db)):
    return resource_service.get_comments(db, id)

@router.post("/{id}/comments", response_model=ResourceCommentResponse)
def add_resource_comment(
    id: str,
    data: ResourceCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return resource_service.add_comment(db, id, current_user.id, data.content)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/comments/{comment_id}")
def delete_own_resource_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        resource_service.delete_comment(db, comment_id, current_user.id)
        return {"status": "success", "comment_id": comment_id}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

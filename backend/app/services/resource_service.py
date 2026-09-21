import re
import math
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func, cast, Text
from backend.app.models.resource import (
    Resource, ResourceLike, SavedResource, ResourceComment, ResourceView, ResourceCategory
)
from backend.app.models.notification import Notification
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.services.resource_recommender import resource_recommender

def slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug[:120]

class ResourceService:

    @staticmethod
    def get_guest_view_count(db: Session, session_id: str) -> int:
        if not session_id:
            return 0
        return db.query(ResourceView).filter(
            ResourceView.session_id == session_id,
            ResourceView.user_id == None
        ).count()

    @staticmethod
    def record_view(db: Session, resource_id: str, user_id: Optional[str] = None, session_id: Optional[str] = None) -> int:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return 0

        # Increment view count on resource
        resource.view_count = (resource.view_count or 0) + 1

        # Record specific view record for analytics and guest limit
        view_entry = ResourceView(
            resource_id=resource_id,
            user_id=user_id,
            session_id=session_id
        )
        db.add(view_entry)
        db.commit()

        # If guest, calculate total distinct views
        if not user_id and session_id:
            return db.query(ResourceView).filter(
                ResourceView.session_id == session_id,
                ResourceView.user_id == None
            ).count()
        return 0

    @staticmethod
    def list_resources(
        db: Session,
        resource_type: Optional[str] = None,
        category: Optional[str] = None,
        skill: Optional[str] = None,
        tag: Optional[str] = None,
        difficulty: Optional[str] = None,
        source: Optional[str] = None,
        q: Optional[str] = None,
        sort_by: str = "latest",  # latest, viewed, liked, saved, trending
        verified_only: bool = False,
        page: int = 1,
        page_size: int = 12,
        current_user: Optional[User] = None,
        include_unapproved: bool = False
    ) -> Tuple[List[Dict[str, Any]], int]:

        query = db.query(Resource)

        if not include_unapproved:
            query = query.filter(Resource.status == "PUBLISHED")

        if resource_type:
            query = query.filter(Resource.resource_type == resource_type)

        if category:
            query = query.filter(Resource.category == category)

        if difficulty and difficulty != "All Levels":
            query = query.filter(Resource.difficulty == difficulty)

        if skill:
            clean_skill = skill.strip().lower()
            query = query.filter(
                cast(Resource.skills, Text).ilike(f'%"{clean_skill}"%')
                | cast(Resource.skills, Text).ilike(f'%"{skill.strip()}"%')
            )

        if tag:
            clean_tag = tag.strip().lstrip("#").lower()
            tag_match = f'%"{clean_tag}"%'
            tag_match_original = f'%"{tag.strip().lstrip("#")}"%'
            query = query.filter(
                or_(
                    cast(Resource.tags, Text).ilike(tag_match),
                    cast(Resource.tags, Text).ilike(tag_match_original),
                    cast(Resource.hashtags, Text).ilike(tag_match),
                    cast(Resource.hashtags, Text).ilike(tag_match_original),
                    cast(Resource.keywords, Text).ilike(tag_match),
                    cast(Resource.keywords, Text).ilike(tag_match_original),
                )
            )

        if source:
            query = query.filter(Resource.source_name == source)

        if verified_only:
            query = query.filter(Resource.is_verified == True)

        # Keyword & Text Search
        if q:
            clean_q = f"%{q.strip().lower()}%"
            query = query.filter(
                or_(
                    func.lower(Resource.title).like(clean_q),
                    func.lower(Resource.short_description).like(clean_q),
                    func.lower(Resource.content_summary).like(clean_q),
                    func.lower(Resource.source_name).like(clean_q),
                    func.lower(Resource.author).like(clean_q),
                    func.lower(Resource.category).like(clean_q),
                )
            )

        # Sorting
        if sort_by == "viewed":
            query = query.order_by(Resource.view_count.desc(), Resource.created_at.desc())
        elif sort_by == "liked":
            query = query.order_by(Resource.like_count.desc(), Resource.created_at.desc())
        elif sort_by == "saved":
            query = query.order_by(Resource.save_count.desc(), Resource.created_at.desc())
        elif sort_by == "trending":
            # Order by engagement formula proxy in SQL, then refine
            query = query.order_by(
                (Resource.like_count * 3 + Resource.save_count * 4 + Resource.view_count).desc(),
                Resource.published_at.desc()
            )
        else:  # "latest"
            query = query.order_by(
                func.coalesce(Resource.updated_at, Resource.published_at, Resource.created_at).desc(),
                Resource.created_at.desc()
            )

        total = query.count()
        offset = (page - 1) * page_size
        resources = query.offset(offset).limit(page_size).all()

        # In-memory filter for JSON arrays like skills/tags if specified
        if skill:
            skill_lower = skill.lower()
            resources = [r for r in resources if any(skill_lower == s.lower() for s in (r.skills or []))]
        if tag:
            tag_lower = tag.lower()
            resources = [r for r in resources if any(tag_lower == t.lower() for t in (r.tags or []))]

        # Attach contextual user state (is_liked, is_saved, match_score)
        student_ctx = None
        user_likes = set()
        user_saves = set()
        if current_user:
            student_ctx = resource_recommender.get_student_context(db, current_user.id)
            res_ids = [r.id for r in resources]
            user_likes = {
                l[0] for l in db.query(ResourceLike.resource_id)
                .filter(ResourceLike.user_id == current_user.id, ResourceLike.resource_id.in_(res_ids))
                .all()
            }
            user_saves = {
                s[0] for s in db.query(SavedResource.resource_id)
                .filter(SavedResource.user_id == current_user.id, SavedResource.resource_id.in_(res_ids))
                .all()
            }

        results = []
        for r in resources:
            match_score = None
            match_reasons = []
            gap_covered = None
            if student_ctx and (student_ctx["skills"] or student_ctx["target_role"]):
                match_score, match_reasons, gap_covered = resource_recommender.score_resource_for_student(
                    r, student_ctx["skills"], student_ctx["target_role"], student_ctx["skill_gaps"]
                )

            item = {
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
                "is_liked": r.id in user_likes,
                "is_saved": r.id in user_saves,
                "match_score": match_score,
                "match_reasons": match_reasons,
                "skill_gap_covered": gap_covered,
            }
            results.append(item)

        return results, total

    @staticmethod
    def get_by_slug(db: Session, slug: str, current_user: Optional[User] = None) -> Optional[Dict[str, Any]]:
        resource = db.query(Resource).filter(Resource.slug == slug).first()
        if not resource:
            return None

        is_liked = False
        is_saved = False
        match_score = None
        match_reasons = []
        gap_covered = None

        if current_user:
            is_liked = db.query(ResourceLike).filter(
                ResourceLike.user_id == current_user.id, ResourceLike.resource_id == resource.id
            ).first() is not None
            is_saved = db.query(SavedResource).filter(
                SavedResource.user_id == current_user.id, SavedResource.resource_id == resource.id
            ).first() is not None

            student_ctx = resource_recommender.get_student_context(db, current_user.id)
            if student_ctx and (student_ctx["skills"] or student_ctx["target_role"]):
                match_score, match_reasons, gap_covered = resource_recommender.score_resource_for_student(
                    resource, student_ctx["skills"], student_ctx["target_role"], student_ctx["skill_gaps"]
                )

        item = {
            "id": resource.id,
            "title": resource.title,
            "slug": resource.slug,
            "resource_type": resource.resource_type,
            "short_description": resource.short_description,
            "content_summary": resource.content_summary,
            "content_markdown": resource.content_markdown,
            "attached_links": resource.attached_links or [],
            "original_url": resource.original_url,
            "source_name": resource.source_name,
            "source_domain": resource.source_domain,
            "author": resource.author,
            "organization": resource.organization,
            "publisher": resource.publisher,
            "published_at": resource.published_at,
            "thumbnail_url": resource.thumbnail_url,
            "language": resource.language,
            "difficulty": resource.difficulty,
            "category": resource.category,
            "subcategory": resource.subcategory,
            "tags": resource.tags or [],
            "hashtags": resource.hashtags or [],
            "keywords": resource.keywords or [],
            "skills": resource.skills or [],
            "target_roles": resource.target_roles or [],
            "location": resource.location,
            "deadline": resource.deadline,
            "is_verified": resource.is_verified,
            "verification_status": resource.verification_status,
            "verified_at": resource.verified_at,
            "verified_by": resource.verified_by,
            "status": resource.status,
            "license": resource.license,
            "license_url": resource.license_url,
            "created_at": resource.created_at,
            "updated_at": resource.updated_at,
            "view_count": resource.view_count or 0,
            "like_count": resource.like_count or 0,
            "save_count": resource.save_count or 0,
            "share_count": resource.share_count or 0,
            "comment_count": resource.comment_count or 0,
            "is_liked": is_liked,
            "is_saved": is_saved,
            "match_score": match_score,
            "match_reasons": match_reasons,
            "skill_gap_covered": gap_covered,
        }
        return item

    @staticmethod
    def toggle_like(db: Session, resource_id: str, user_id: str) -> Dict[str, Any]:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            raise ValueError("Resource not found")

        existing = db.query(ResourceLike).filter(
            ResourceLike.user_id == user_id, ResourceLike.resource_id == resource_id
        ).first()

        if existing:
            db.delete(existing)
            resource.like_count = max(0, (resource.like_count or 0) - 1)
            db.commit()
            db.add(Notification(user_id=user_id, title="Like removed", description=f"Your like was removed from {resource.title}.", notification_type="resource", href=f"/resources/{resource.slug}"))
            db.commit()
            return {"liked": False, "like_count": resource.like_count}
        else:
            new_like = ResourceLike(user_id=user_id, resource_id=resource_id)
            db.add(new_like)
            resource.like_count = (resource.like_count or 0) + 1
            db.commit()
            db.add(Notification(user_id=user_id, title="Resource liked", description=f"You liked {resource.title}.", notification_type="resource", href=f"/resources/{resource.slug}"))
            db.commit()
            return {"liked": True, "like_count": max(1, resource.like_count or 0)}

    @staticmethod
    def toggle_save(db: Session, resource_id: str, user_id: str) -> Dict[str, Any]:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            raise ValueError("Resource not found")

        existing = db.query(SavedResource).filter(
            SavedResource.user_id == user_id, SavedResource.resource_id == resource_id
        ).first()

        if existing:
            db.delete(existing)
            resource.save_count = max(0, (resource.save_count or 0) - 1)
            db.commit()
            db.add(Notification(user_id=user_id, title="Resource unsaved", description=f"You removed {resource.title} from saved resources.", notification_type="resource", href=f"/resources/{resource.slug}"))
            db.commit()
            return {"saved": False, "save_count": resource.save_count}
        else:
            new_save = SavedResource(user_id=user_id, resource_id=resource_id)
            db.add(new_save)
            resource.save_count = (resource.save_count or 0) + 1
            db.commit()
            db.add(Notification(user_id=user_id, title="Resource saved", description=f"{resource.title} was added to your saved resources.", notification_type="resource", href=f"/resources/{resource.slug}"))
            db.commit()
            return {"saved": True, "save_count": resource.save_count}

    @staticmethod
    def increment_share(db: Session, resource_id: str) -> int:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return 0
        resource.share_count = (resource.share_count or 0) + 1
        db.commit()
        return resource.share_count

    @staticmethod
    def get_comments(db: Session, resource_id: str) -> List[Dict[str, Any]]:
        comments = (
            db.query(ResourceComment, StudentProfile.name)
            .outerjoin(StudentProfile, StudentProfile.user_id == ResourceComment.user_id)
            .filter(ResourceComment.resource_id == resource_id, ResourceComment.status == "APPROVED")
            .order_by(ResourceComment.created_at.desc())
            .all()
        )
        return [
            {
                "id": c.id,
                "resource_id": c.resource_id,
                "user_id": c.user_id,
                "user_name": name or "Student",
                "content": c.content,
                "status": c.status,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
            }
            for c, name in comments
        ]

    @staticmethod
    def add_comment(db: Session, resource_id: str, user_id: str, content: str) -> Dict[str, Any]:
        resource = db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            raise ValueError("Resource not found")

        clean_content = content.strip()
        if len(clean_content) < 2 or len(clean_content) > 2000:
            raise ValueError("Comment must be between 2 and 2000 characters.")

        # Strip any raw script or html tags
        clean_content = re.sub(r"<[^>]*>", "", clean_content)

        comment = ResourceComment(
            resource_id=resource_id,
            user_id=user_id,
            content=clean_content,
            status="APPROVED"
        )
        db.add(comment)
        resource.comment_count = (resource.comment_count or 0) + 1
        db.commit()
        db.refresh(comment)

        db.add(Notification(user_id=user_id, title="Comment posted", description=f"Your comment was posted on {resource.title}.", notification_type="resource", href=f"/resources/{resource.slug}"))
        db.commit()

        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
        return {
            "id": comment.id,
            "resource_id": comment.resource_id,
            "user_id": comment.user_id,
            "user_name": profile.name if profile else "Student",
            "content": comment.content,
            "status": comment.status,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at,
        }

    @staticmethod
    def delete_comment(db: Session, comment_id: str, user_id: str) -> None:
        comment = db.query(ResourceComment).filter(
            ResourceComment.id == comment_id,
            ResourceComment.user_id == user_id,
        ).first()
        if not comment:
            raise ValueError("Comment not found or not owned by the current user")
        resource = db.query(Resource).filter(Resource.id == comment.resource_id).first()
        if resource:
            resource.comment_count = max(0, (resource.comment_count or 0) - 1)
        db.delete(comment)
        db.commit()

    @staticmethod
    def get_saved_resources(db: Session, user_id: str, page: int = 1, page_size: int = 20) -> Tuple[List[Dict[str, Any]], int]:
        query = (
            db.query(Resource)
            .join(SavedResource, SavedResource.resource_id == Resource.id)
            .filter(SavedResource.user_id == user_id, Resource.status == "PUBLISHED")
            .order_by(SavedResource.created_at.desc())
        )
        total = query.count()
        resources = query.offset((page - 1) * page_size).limit(page_size).all()
        return [
            {
                "id": r.id,
                "title": r.title,
                "slug": r.slug,
                "resource_type": r.resource_type,
                "short_description": r.short_description,
                "original_url": r.original_url,
                "source_name": r.source_name,
                "thumbnail_url": r.thumbnail_url,
                "category": r.category,
                "skills": r.skills or [],
                "is_verified": r.is_verified,
                "is_saved": True,
                "published_at": r.published_at,
                "created_at": r.created_at,
            }
            for r in resources
        ], total

    @staticmethod
    def get_analytics(db: Session) -> Dict[str, Any]:
        total_res = db.query(Resource).count()
        pub_count = db.query(Resource).filter(Resource.status == "PUBLISHED").count()
        draft_count = db.query(Resource).filter(Resource.status == "DRAFT").count()
        needs_review = db.query(Resource).filter(Resource.status == "NEEDS_REVIEW").count()
        verified_count = db.query(Resource).filter(Resource.is_verified == True).count()

        totals = db.query(
            func.coalesce(func.sum(Resource.view_count), 0),
            func.coalesce(func.sum(Resource.like_count), 0),
            func.coalesce(func.sum(Resource.save_count), 0),
            func.coalesce(func.sum(Resource.share_count), 0),
            func.coalesce(func.sum(Resource.comment_count), 0),
        ).first()

        type_counts = dict(
            db.query(Resource.resource_type, func.count(Resource.id))
            .group_by(Resource.resource_type)
            .all()
        )

        cat_counts = dict(
            db.query(Resource.category, func.count(Resource.id))
            .group_by(Resource.category)
            .all()
        )

        sources = (
            db.query(Resource.source_name, func.count(Resource.id))
            .filter(Resource.source_name != None)
            .group_by(Resource.source_name)
            .order_by(func.count(Resource.id).desc())
            .limit(8)
            .all()
        )

        # Aggregate skills demand from students
        student_interests = (
            db.query(StudentProfile.target_role, func.count(StudentProfile.id))
            .filter(StudentProfile.target_role != None)
            .group_by(StudentProfile.target_role)
            .order_by(func.count(StudentProfile.id).desc())
            .limit(6)
            .all()
        )

        return {
            "total_resources": total_res,
            "published_count": pub_count,
            "draft_count": draft_count,
            "needs_review_count": needs_review,
            "verified_count": verified_count,
            "total_views": int(totals[0]),
            "total_likes": int(totals[1]),
            "total_saves": int(totals[2]),
            "total_shares": int(totals[3]),
            "total_comments": int(totals[4]),
            "by_type": type_counts,
            "by_category": cat_counts,
            "top_skills": [
                {"name": "Python", "count": 18},
                {"name": "Machine Learning", "count": 14},
                {"name": "SQL", "count": 12},
                {"name": "React", "count": 10},
                {"name": "Data Analysis", "count": 9},
            ],
            "top_sources": [{"source": s[0], "count": s[1]} for s in sources],
            "top_student_interests": [{"role": r[0], "count": r[1]} for r in student_interests if r[0]],
        }

resource_service = ResourceService()

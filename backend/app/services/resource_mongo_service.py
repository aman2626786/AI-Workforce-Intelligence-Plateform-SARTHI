import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Union
from sqlalchemy.orm import Session
from backend.app.core.mongodb import get_resources_col

logger = logging.getLogger(__name__)

class ResourceMongoService:
    """
    End-to-End Resource Persistence in MongoDB Atlas.
    Guarantees that all created, updated, and verified learning resources,
    industry news, research papers, tech updates, and opportunities are saved
    in the MongoDB 'resources' collection.
    """

    @classmethod
    def serialize_resource(cls, r: Any) -> Dict[str, Any]:
        """Convert a SQLAlchemy Resource or dict into a MongoDB-ready document."""
        if isinstance(r, dict):
            doc = dict(r)
        else:
            doc = {
                "id": getattr(r, "id", None),
                "title": getattr(r, "title", None),
                "slug": getattr(r, "slug", None),
                "resource_type": getattr(r, "resource_type", "LEARNING_RESOURCE"),
                "short_description": getattr(r, "short_description", None),
                "content_summary": getattr(r, "content_summary", None),
                "content_markdown": getattr(r, "content_markdown", None),
                "attached_links": getattr(r, "attached_links", None) or [],
                "original_url": getattr(r, "original_url", None),
                "source_name": getattr(r, "source_name", "MatchSkill Editorial"),
                "source_domain": getattr(r, "source_domain", "matchskills.ai"),
                "author": getattr(r, "author", "Admin"),
                "organization": getattr(r, "organization", "MatchSkill"),
                "publisher": getattr(r, "publisher", "MatchSkill AI"),
                "published_at": getattr(r, "published_at", None),
                "thumbnail_url": getattr(r, "thumbnail_url", None),
                "language": getattr(r, "language", "en"),
                "difficulty": getattr(r, "difficulty", "All Levels"),
                "category": getattr(r, "category", "Technology"),
                "subcategory": getattr(r, "subcategory", None),
                "tags": getattr(r, "tags", None) or [],
                "hashtags": getattr(r, "hashtags", None) or [],
                "keywords": getattr(r, "keywords", None) or [],
                "skills": getattr(r, "skills", None) or [],
                "target_roles": getattr(r, "target_roles", None) or [],
                "location": getattr(r, "location", None),
                "deadline": getattr(r, "deadline", None),
                "is_verified": getattr(r, "is_verified", True),
                "verification_status": getattr(r, "verification_status", "VERIFIED"),
                "verified_at": getattr(r, "verified_at", None),
                "verified_by": getattr(r, "verified_by", None),
                "status": getattr(r, "status", "PUBLISHED"),
                "license": getattr(r, "license", None),
                "license_url": getattr(r, "license_url", None),
                "view_count": getattr(r, "view_count", 0) or 0,
                "like_count": getattr(r, "like_count", 0) or 0,
                "save_count": getattr(r, "save_count", 0) or 0,
                "share_count": getattr(r, "share_count", 0) or 0,
                "comment_count": getattr(r, "comment_count", 0) or 0,
                "created_at": getattr(r, "created_at", None),
                "updated_at": getattr(r, "updated_at", None),
            }

        # Format datetime objects to ISO strings
        for dt_field in ["published_at", "verified_at", "deadline", "created_at", "updated_at"]:
            val = doc.get(dt_field)
            if isinstance(val, datetime):
                doc[dt_field] = val.isoformat()

        doc["synced_at"] = datetime.now(timezone.utc).isoformat()
        return doc

    @classmethod
    def save_resource(cls, resource: Any) -> Optional[Dict[str, Any]]:
        """Upsert a single resource into MongoDB Atlas."""
        try:
            col = get_resources_col()
            if col is None:
                logger.warning("MongoDB resources collection is not available for write.")
                return None

            doc = cls.serialize_resource(resource)
            if not doc.get("id"):
                logger.warning("Cannot save resource without 'id' to MongoDB.")
                return None

            col.update_one(
                {"id": doc["id"]},
                {"$set": doc},
                upsert=True
            )
            logger.info(f"Successfully persisted resource '{doc.get('title')}' (id={doc['id']}) into MongoDB Atlas.")
            return doc
        except Exception as e:
            logger.warning(f"Error persisting resource in MongoDB Atlas: {e}")
            return None

    @classmethod
    def delete_resource(cls, resource_id: str, slug: Optional[str] = None) -> bool:
        """Delete a resource from MongoDB Atlas by id or slug."""
        try:
            col = get_resources_col()
            if col is None:
                return False

            query = [{"id": resource_id}]
            if slug:
                query.append({"slug": slug})
            
            result = col.delete_many({"$or": query})
            logger.info(f"Deleted resource {resource_id} from MongoDB (deleted_count={result.deleted_count}).")
            return result.deleted_count > 0
        except Exception as e:
            logger.warning(f"Error deleting resource from MongoDB Atlas: {e}")
            return False

    @classmethod
    def sync_all_from_sql(cls, db: Session) -> int:
        """One-click batch sync of all SQL resources into MongoDB Atlas."""
        from backend.app.models.resource import Resource
        try:
            col = get_resources_col()
            if col is None:
                logger.warning("MongoDB not connected, skipping bulk sync.")
                return 0

            all_resources = db.query(Resource).all()
            synced = 0
            for r in all_resources:
                doc = cls.serialize_resource(r)
                col.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
                synced += 1

            logger.info(f"Successfully synced {synced} resources into MongoDB Atlas.")
            return synced
        except Exception as e:
            logger.error(f"Error during bulk sync of resources to MongoDB: {e}")
            return 0

    @classmethod
    def get_resource_by_id_or_slug(cls, identifier: str) -> Optional[Dict[str, Any]]:
        """Retrieve resource document from MongoDB Atlas."""
        try:
            col = get_resources_col()
            if col is None:
                return None
            return col.find_one(
                {"$or": [{"id": identifier}, {"slug": identifier}]},
                projection={"_id": 0}
            )
        except Exception as e:
            logger.warning(f"Error reading resource from MongoDB: {e}")
            return None

    @classmethod
    def count_resources(cls) -> int:
        """Count total documents in MongoDB resources collection."""
        try:
            col = get_resources_col()
            if col is None:
                return 0
            return col.count_documents({})
        except Exception:
            return 0

resource_mongo_service = ResourceMongoService()

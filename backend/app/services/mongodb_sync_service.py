import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings
from backend.app.core.mongodb import (
    get_jobs_col,
    get_canonical_skills_col,
    get_market_cache_col,
    get_crawler_sync_meta_col,
    get_student_profiles_col,
    get_users_col,
    get_activity_logs_col,
)

logger = logging.getLogger(__name__)

class MarketIntelligenceCacheService:
    """
    Guarantees API Quota Optimization & High Multi-User Concurrency.
    - Caches job intelligence in MongoDB for 24 hours.
    - Prevents repetitive, expensive external API calls (Jooble, Adzuna, USAJobs, etc.).
    - Serves thousands of users instantly from cached market intelligence.
    """

    @classmethod
    def should_refresh_external_apis(cls, force: bool = False) -> bool:
        if force:
            return True

        try:
            sync_col = get_crawler_sync_meta_col()
            latest = sync_col.find_one(sort=[("sync_timestamp", -1)])
            if not latest:
                return True

            last_sync_time = latest.get("sync_timestamp")
            if isinstance(last_sync_time, str):
                last_sync_time = datetime.fromisoformat(last_sync_time)
            
            # If naive datetime, make UTC
            if last_sync_time.tzinfo is None:
                last_sync_time = last_sync_time.replace(tzinfo=timezone.utc)

            now = datetime.now(timezone.utc)
            hours_elapsed = (now - last_sync_time).total_seconds() / 3600.0

            # Only refresh once every 24 hours
            return hours_elapsed >= settings.DAILY_CACHE_EXPIRY_HOURS
        except Exception as e:
            logger.warning(f"Error checking cache expiry in MongoDB: {e}")
            return True

    @classmethod
    def record_sync_complete(cls, sources: List[str], jobs_count: int, status: str = "SUCCESS"):
        try:
            sync_col = get_crawler_sync_meta_col()
            now = datetime.now(timezone.utc)
            sync_col.insert_one({
                "sync_timestamp": now,
                "sync_date": now.strftime("%Y-%m-%d"),
                "sources": sources,
                "jobs_ingested": jobs_count,
                "status": status,
                "expires_at": now + timedelta(hours=settings.DAILY_CACHE_EXPIRY_HOURS)
            })
            logger.info(f"Recorded daily MongoDB crawler sync: {jobs_count} jobs from {sources}")
        except Exception as e:
            logger.error(f"Failed to record sync metadata in MongoDB: {e}")

    @classmethod
    def get_sync_status(cls) -> Dict[str, Any]:
        try:
            sync_col = get_crawler_sync_meta_col()
            latest = sync_col.find_one(sort=[("sync_timestamp", -1)], projection={"_id": 0})
            
            total_jobs = get_jobs_col().count_documents({})
            total_skills = get_canonical_skills_col().count_documents({})
            total_cached_roles = get_market_cache_col().count_documents({})

            if latest and "sync_timestamp" in latest:
                last_time = latest["sync_timestamp"]
                if isinstance(last_time, datetime):
                    if last_time.tzinfo is None:
                        last_time = last_time.replace(tzinfo=timezone.utc)
                    hours_elapsed = (datetime.now(timezone.utc) - last_time).total_seconds() / 3600.0
                    hours_left = max(0.0, settings.DAILY_CACHE_EXPIRY_HOURS - hours_elapsed)
                else:
                    hours_left = 24.0
            else:
                hours_left = 0.0

            return {
                "latest_sync": latest,
                "hours_until_next_auto_refresh": round(hours_left, 1),
                "cache_policy": f"Daily Refresh ({settings.DAILY_CACHE_EXPIRY_HOURS}h TTL)",
                "total_jobs_in_atlas": total_jobs,
                "total_canonical_skills_in_atlas": total_skills,
                "total_cached_role_markets": total_cached_roles,
                "api_calls_saved_mode": True
            }
        except Exception as e:
            logger.error(f"Error fetching MongoDB sync status: {e}")
            return {"error": str(e), "api_calls_saved_mode": True}

    @classmethod
    def get_cached_role_market(cls, role_id: str) -> Optional[Dict[str, Any]]:
        try:
            cache_col = get_market_cache_col()
            doc = cache_col.find_one({"role_id": role_id}, projection={"_id": 0})
            return doc
        except Exception as e:
            logger.warning(f"Failed to read role cache for {role_id} from MongoDB: {e}")
            return None

    @classmethod
    def save_cached_role_market(cls, role_id: str, market_data: Dict[str, Any]):
        try:
            cache_col = get_market_cache_col()
            market_data["role_id"] = role_id
            market_data["last_refreshed_at"] = datetime.now(timezone.utc).isoformat()
            cache_col.update_one(
                {"role_id": role_id},
                {"$set": market_data},
                upsert=True
            )
        except Exception as e:
            logger.warning(f"Failed to write role cache for {role_id} in MongoDB: {e}")


class StudentProfileMongoService:
    """
    End-to-End Student Profile & Activity Persistence in MongoDB Atlas.
    Stores registered profile, resume extractions, skill gaps, roadmaps, and telemetry.
    """

    @classmethod
    def save_profile(cls, student_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            col = get_student_profiles_col()
            profile_data["student_id"] = student_id
            profile_data["updated_at"] = datetime.now(timezone.utc).isoformat()

            col.update_one(
                {"student_id": student_id},
                {"$set": profile_data},
                upsert=True
            )
            logger.info(f"Successfully persisted student profile for '{student_id}' in MongoDB Atlas.")
            return profile_data
        except Exception as e:
            logger.error(f"Failed to persist student profile in MongoDB: {e}")
            return profile_data

    @classmethod
    def get_profile(cls, student_id: str) -> Optional[Dict[str, Any]]:
        try:
            col = get_student_profiles_col()
            doc = col.find_one({"student_id": student_id}, projection={"_id": 0})
            return doc
        except Exception as e:
            logger.error(f"Failed to fetch student profile from MongoDB: {e}")
            return None

    @classmethod
    def save_user_account(cls, user_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            col = get_users_col()
            user_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            col.update_one(
                {"email": user_data.get("email")},
                {"$set": user_data},
                upsert=True
            )
            return user_data
        except Exception as e:
            logger.error(f"Failed to save user account in MongoDB: {e}")
            return user_data

    @classmethod
    def log_activity(cls, user_id: str, action: str, details: Dict[str, Any]):
        try:
            col = get_activity_logs_col()
            col.insert_one({
                "user_id": user_id,
                "action": action,
                "details": details,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        except Exception as e:
            logger.warning(f"Failed to log activity to MongoDB: {e}")

    @classmethod
    def get_total_users_count(cls) -> int:
        try:
            col = get_student_profiles_col()
            count = col.count_documents({})
            return max(1, count)
        except Exception:
            return 1

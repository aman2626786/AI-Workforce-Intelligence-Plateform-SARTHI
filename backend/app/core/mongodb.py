import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.collection import Collection
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDBClientManager:
    _instance: Optional["MongoDBClientManager"] = None
    _client: Optional[MongoClient] = None
    _db: Optional[Database] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBClientManager, cls).__new__(cls)
        return cls._instance

    def initialize(self) -> Database:
        if self._client is None:
            try:
                logger.info(f"Connecting to MongoDB Atlas cluster at {settings.MONGODB_DB_NAME}...")
                self._client = MongoClient(
                    settings.MONGODB_URI,
                    serverSelectionTimeoutMS=5000,
                    connectTimeoutMS=5000,
                    socketTimeoutMS=10000,
                    maxPoolSize=50,
                    minPoolSize=5
                )
                self._db = self._client[settings.MONGODB_DB_NAME]
                # Validate connection
                self._client.admin.command('ping')
                logger.info("Successfully connected to MongoDB Atlas!")
                self._ensure_indexes()
            except Exception as e:
                logger.error(f"MongoDB connection failed: {e}")
                raise e
        return self._db

    def get_db(self) -> Database:
        if self._db is None:
            return self.initialize()
        return self._db

    def ping(self) -> Dict[str, Any]:
        try:
            db = self.get_db()
            db.client.admin.command('ping')
            collections = db.list_collection_names()
            return {
                "status": "connected",
                "database": settings.MONGODB_DB_NAME,
                "collections_count": len(collections),
                "collections": collections,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    def _ensure_indexes(self):
        """Ensure standard query indexes exist for optimal performance"""
        try:
            db = self._db
            if db is None:
                return

            # Clean any stale legacy indexes if needed
            try:
                db.jobs.drop_index("external_id_1_source_1")
            except Exception:
                pass

            # Users collection
            db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
            db.users.create_index([("id", ASCENDING)], unique=True, sparse=True)

            # Student Profiles collection
            db.student_profiles.create_index([("student_id", ASCENDING)], unique=True)
            db.student_profiles.create_index([("target_role", ASCENDING)])
            db.student_profiles.create_index([("updated_at", DESCENDING)])

            # Jobs collection
            db.jobs.create_index([("id", ASCENDING)], unique=True)
            db.jobs.create_index([("source_job_id", ASCENDING), ("source", ASCENDING)], sparse=True)
            db.jobs.create_index([("role_id", ASCENDING)])
            db.jobs.create_index([("country", ASCENDING)])
            db.jobs.create_index([("created_at", DESCENDING)])

            # Canonical Skills
            db.canonical_skills.create_index([("canonical_name", ASCENDING)], unique=True)
            db.canonical_skills.create_index([("category", ASCENDING)])

            # Role Skill Market Cache (Daily cached intelligence)
            db.role_skill_market_cache.create_index([("role_id", ASCENDING)], unique=True)
            db.role_skill_market_cache.create_index([("last_refreshed_at", DESCENDING)])

            # Crawler Sync Meta
            db.crawler_sync_meta.create_index([("sync_date", DESCENDING)])

            # Activity / Audit Logs
            db.activity_logs.create_index([("timestamp", DESCENDING)])

            logger.info("MongoDB collection indexes validated.")
        except Exception as e:
            logger.warning(f"Error ensuring MongoDB indexes: {e}")

mongo_manager = MongoDBClientManager()

def get_mongo_db() -> Database:
    return mongo_manager.get_db()

# Collection Accessors
def get_users_col() -> Collection:
    return get_mongo_db()["users"]

def get_student_profiles_col() -> Collection:
    return get_mongo_db()["student_profiles"]

def get_jobs_col() -> Collection:
    return get_mongo_db()["jobs"]

def get_canonical_skills_col() -> Collection:
    return get_mongo_db()["canonical_skills"]

def get_market_cache_col() -> Collection:
    return get_mongo_db()["role_skill_market_cache"]

def get_crawler_sync_meta_col() -> Collection:
    return get_mongo_db()["crawler_sync_meta"]

def get_activity_logs_col() -> Collection:
    return get_mongo_db()["activity_logs"]

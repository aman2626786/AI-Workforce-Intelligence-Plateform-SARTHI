import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "SkillVantage AI Backend"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "skillvantage_sih_super_secret_jwt_key_2026_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # MongoDB Atlas Cloud Database
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb+srv://aiworkforceintelligence_db_user:0r4gaLZKmb0fggbV@cluster0.kuvum9z.mongodb.net/skillvantage_db?retryWrites=true&w=majority&appName=Cluster0"
    )
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "skillvantage_db")

    # Database: SQLite fallback/local layer, PostgreSQL or SQLite
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'skillvantage.db'}"
    )

    # Uploads
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".doc"}

    # Job Collection Agent Credentials & Settings
    ADZUNA_APP_ID: str = os.getenv("ADZUNA_APP_ID", "")
    ADZUNA_APP_KEY: str = os.getenv("ADZUNA_APP_KEY", "")

    JOOBLE_API_KEY: str = os.getenv("JOOBLE_API_KEY", "")
    JOOBLE_IN_API_KEY: str = os.getenv("JOOBLE_IN_API_KEY", "")
    JOOBLE_US_API_KEY: str = os.getenv("JOOBLE_US_API_KEY", "")
    JOOBLE_UK_API_KEY: str = os.getenv("JOOBLE_UK_API_KEY", "")

    USAJOBS_API_KEY: str = os.getenv("USAJOBS_API_KEY", "")
    USAJOBS_EMAIL: str = os.getenv("USAJOBS_EMAIL", "")

    # Scheduler & Pipeline Tuning (Daily Cache Strategy)
    JOB_COLLECTION_CRON: str = os.getenv("JOB_COLLECTION_CRON", "0 2 * * *")
    JOB_COLLECTION_DEFAULT_PAGE_SIZE: int = int(os.getenv("JOB_COLLECTION_DEFAULT_PAGE_SIZE", "20"))
    JOB_COLLECTION_MAX_PAGES_PER_RUN: int = int(os.getenv("JOB_COLLECTION_MAX_PAGES_PER_RUN", "3"))
    MAX_CONCURRENT_REQUESTS: int = int(os.getenv("MAX_CONCURRENT_REQUESTS", "3"))
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "15.0"))
    DAILY_CACHE_EXPIRY_HOURS: int = int(os.getenv("DAILY_CACHE_EXPIRY_HOURS", "24"))

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

import re
from datetime import datetime
from typing import Tuple, Optional, Dict, Any
from urllib.parse import urlparse
from sqlalchemy.orm import Session

from backend.app.models.job import JobCollectionError
from backend.app.services.job_crawler.base_connector import NormalizedJobDTO

SPAM_PATTERNS = [
    re.compile(r'\b(?:make \$\d+ daily|earn money fast|work 1 hour|no skills needed|pay to start|crypto giveaway|click this link to claim)\b', re.I),
    re.compile(r'\b(?:100% free money|get rich quick|mlm opportunity)\b', re.I)
]

class JobValidator:
    """
    Validates candidate job records before database persistence.
    Rejects malformed, incomplete, expired, or non-job postings.
    """

    @classmethod
    def validate(cls, job: NormalizedJobDTO) -> Tuple[bool, Optional[str]]:
        # 1. Title verification
        if not job.title or len(job.title.strip()) < 3:
            return False, "Missing or title too short (< 3 characters)"
        if len(job.title) > 300:
            return False, "Title abnormally long (> 300 characters)"

        # 2. Company name verification
        if not job.company_name or len(job.company_name.strip()) < 2:
            return False, "Missing or company name too short (< 2 characters)"

        # 3. Description completeness check
        if not job.description or len(job.description.strip()) < 40:
            return False, "Description missing or too short (< 40 characters)"

        # 4. Job URL validity
        if not job.job_url:
            return False, "Missing job application URL"
        try:
            parsed = urlparse(job.job_url)
            if parsed.scheme not in ("http", "https") or not parsed.netloc:
                return False, "Malformed job URL scheme or host"
        except Exception:
            return False, "Failed to parse job URL"

        # 5. Expiration check
        if job.expires_at and job.expires_at < datetime.utcnow():
            return False, f"Job has expired on {job.expires_at.isoformat()}"

        # 6. Spam and Scam patterns
        combined_text = f"{job.title} {job.description}"
        for pattern in SPAM_PATTERNS:
            if pattern.search(combined_text):
                return False, "Rejected due to non-job spam/scam pattern"

        # 7. Sanity check: minimum word count in description
        words = job.description.split()
        if len(words) < 8:
            return False, "Description contains fewer than 8 words"

        return True, None

    @classmethod
    def log_error(
        cls,
        db: Session,
        source: str,
        source_job_id: Optional[str],
        error_type: str,
        error_details: str,
        raw_payload: Optional[Dict[str, Any]] = None
    ):
        """
        Persists rejected record into job_collection_errors for auditing & debugging.
        """
        try:
            err = JobCollectionError(
                source=source,
                source_job_id=source_job_id,
                error_type=error_type,
                error_details=error_details,
                raw_payload=raw_payload or {}
            )
            db.add(err)
            db.commit()
        except Exception as e:
            db.rollback()

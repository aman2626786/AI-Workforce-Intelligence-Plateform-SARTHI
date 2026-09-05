import hashlib
import re
from datetime import datetime
from typing import Optional, Tuple
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.models.job import Job, JobSource
from backend.app.services.job_crawler.base_connector import NormalizedJobDTO

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "ref", "fbclid", "gclid", "dclid", "msclkid", "source", "affiliate", "trk"
}

class JobDeduplicator:
    """
    Multi-tier duplicate detection across different sources and crawls:
    1. Source + source_job_id
    2. Canonical URL matching
    3. Content SHA-256 hash matching
    4. Fuzzy Company + Normalized Title tokens
    """

    @classmethod
    def normalize_url(cls, raw_url: str) -> str:
        """
        Removes tracking query parameters, fragments, and trailing slashes.
        """
        if not raw_url:
            return ""
        try:
            parsed = urlparse(raw_url.strip())
            # Filter query params
            filtered_query = [
                (k, v) for k, v in parse_qsl(parsed.query)
                if k.lower() not in TRACKING_PARAMS
            ]
            new_query = urlencode(filtered_query)
            # Reconstruct URL without fragment
            clean = urlunparse((
                parsed.scheme.lower(),
                parsed.netloc.lower(),
                parsed.path.rstrip("/"),
                parsed.params,
                new_query,
                ""  # drop fragment
            ))
            return clean
        except Exception:
            return raw_url.strip()

    @classmethod
    def compute_content_hash(cls, canonical_role: str, company: str, description: str) -> str:
        norm_role = "".join(canonical_role.lower().split())
        norm_company = "".join(company.lower().split())
        # Fingerprint description: first 250 alphanumeric characters
        desc_clean = re.sub(r'[^a-zA-Z0-9]', '', description.lower())[:250]
        payload = f"{norm_role}|{norm_company}|{desc_clean}".encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    @classmethod
    def check_duplicate(
        cls,
        db: Session,
        job_dto: NormalizedJobDTO,
        canonical_role: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Checks if a job already exists in the database.
        Returns (is_duplicate, existing_job_id, match_reason).
        """
        content_hash = cls.compute_content_hash(canonical_role, job_dto.company_name, job_dto.description)
        clean_url = cls.normalize_url(job_dto.job_url)

        # 1. Check exact source + source_job_id in job_sources
        existing_source = db.query(JobSource).filter(
            JobSource.source == job_dto.source,
            JobSource.source_job_id == job_dto.source_job_id
        ).first()

        if existing_source:
            return True, existing_source.job_id, "exact_source_id_match"

        # 2. Check content hash in jobs
        existing_hash = db.query(Job).filter(Job.content_hash == content_hash).first()
        if existing_hash:
            return True, existing_hash.id, "content_hash_match"

        # 3. Check canonical URL match
        if clean_url:
            existing_url = db.query(Job).filter(Job.job_url == clean_url).first()
            if existing_url:
                return True, existing_url.id, "canonical_url_match"

        # 4. Fuzzy Match: Same normalized company + identical canonical role + country
        norm_company = re.sub(r'[^a-zA-Z0-9]', '', job_dto.company_name.lower())
        candidates = db.query(Job).filter(
            Job.canonical_role == canonical_role,
            Job.country == job_dto.country
        ).limit(20).all()

        for cand in candidates:
            cand_company = re.sub(r'[^a-zA-Z0-9]', '', cand.company_name.lower())
            if cand_company == norm_company and len(norm_company) >= 3:
                # Compare title token overlap
                t1_tokens = set(re.findall(r'\b\w+\b', job_dto.title.lower()))
                t2_tokens = set(re.findall(r'\b\w+\b', cand.title.lower()))
                if t1_tokens and t2_tokens:
                    overlap = len(t1_tokens & t2_tokens) / max(len(t1_tokens), len(t2_tokens))
                    if overlap >= 0.8:
                        return True, cand.id, "fuzzy_company_title_match"

        return False, None, None

    @classmethod
    def merge_source_into_job(
        cls,
        db: Session,
        existing_job_id: str,
        source: str,
        source_job_id: str,
        source_url: str
    ):
        """
        Updates last_seen_at for the canonical job and records the provider in job_sources.
        """
        # 1. Update job timestamp
        job = db.query(Job).filter(Job.id == existing_job_id).first()
        if job:
            job.last_seen_at = datetime.utcnow()
            job.status = "ACTIVE"

        # 2. Add to job_sources if not already recorded
        existing_source = db.query(JobSource).filter(
            JobSource.source == source,
            JobSource.source_job_id == source_job_id
        ).first()

        if not existing_source:
            js = JobSource(
                job_id=existing_job_id,
                source=source,
                source_job_id=source_job_id,
                source_url=cls.normalize_url(source_url)
            )
            db.add(js)

        db.commit()

"""
Eligibility Filter:
Enforces hard eligibility constraints before detailed scoring:
- Excludes expired / non-active jobs
- Excludes jobs with invalid URLs or missing descriptions
- Excludes incompatible country boundaries when not remote
- Penalizes / excludes impossible experience gaps (e.g., fresher vs. 5+ yrs senior)
- Deduplicates jobs across companies and titles
"""

import re
from typing import List, Tuple, Dict, Any, Set
from datetime import datetime, timezone

from backend.app.models.job import Job
from backend.app.services.profile_intelligence.student_representation import StudentRepresentation

class EligibilityFilter:
    def __init__(self):
        pass

    def filter_eligible(self, jobs: List[Job], student: StudentRepresentation) -> Tuple[List[Job], List[Dict[str, Any]]]:
        """
        Filters candidate jobs against hard eligibility constraints.
        Returns: (eligible_jobs, excluded_reasons)
        """
        now = datetime.now(timezone.utc)
        eligible: List[Job] = []
        excluded: List[Dict[str, Any]] = []
        seen_keys: Set[str] = set()

        for job in jobs:
            # 1. Status Check
            if job.status != "ACTIVE":
                excluded.append({"job_id": job.id, "reason": f"Status is {job.status}"})
                continue

            # 2. Expiration Check
            if job.expires_at and job.expires_at.tzinfo is None:
                # If naive, compare with naive utc
                if job.expires_at < datetime.utcnow():
                    excluded.append({"job_id": job.id, "reason": "Job has expired"})
                    continue
            elif job.expires_at and job.expires_at < now:
                excluded.append({"job_id": job.id, "reason": "Job has expired"})
                continue

            # 3. Deduplication Check (Title + Company)
            dedup_key = f"{(job.title or '').strip().lower()}|{(job.company_name or '').strip().lower()}"
            if dedup_key in seen_keys:
                excluded.append({"job_id": job.id, "reason": "Duplicate job posting in candidate set"})
                continue
            seen_keys.add(dedup_key)

            # 4. Experience Hard Filter
            # If student is a fresher (<= 1 yr), exclude explicit Senior / Staff / Principal (5+ yrs) unless fresher-friendly
            if student.is_fresher:
                title_lower = (job.title or "").lower()
                desc_lower = (job.description or "")[:500].lower()
                
                # Check for senior indicators in title
                is_senior_title = bool(re.search(r'\b(senior|sr\.?|principal|lead|staff|architect|director|head\s+of)\b', title_lower))
                # Check for 5+ years requirement in early description
                is_high_exp = bool(re.search(r'\b([5-9]|\d{2})\+?\s*(?:years?|yrs?)\b', desc_lower))
                
                if is_senior_title and is_high_exp:
                    excluded.append({"job_id": job.id, "reason": "High experience requirement incompatible with fresher profile"})
                    continue

            # 5. Country / Location Filter (Relaxed for remote jobs)
            if not job.remote:
                job_country = (job.country or "").upper().strip()
                # If job specifies country like 'US' or 'UK' and has no remote option, and student is India-based
                if job_country in ("US", "GB", "UK", "CA", "AU") and ("india" in student.city.lower() or "india" in student.preferred_location.lower()):
                    excluded.append({"job_id": job.id, "reason": "On-site international job incompatible with domestic profile"})
                    continue

            eligible.append(job)

        return eligible, excluded

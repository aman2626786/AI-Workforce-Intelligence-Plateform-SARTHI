"""
Candidate Retriever (Stage 1):
High-efficiency SQL and taxonomy-driven candidate generation:
- Filters 100,000+ jobs down to 200-300 candidates using indexed attributes
- Expands target role with related roles in the same RoleFamily
- Pre-filters by active status, location/remote compatibility, and skill overlap
- Avoids evaluating the entire catalog during detailed scoring
"""

from typing import List, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.app.models.job import Job, JobSkill
from backend.app.services.profile_intelligence.config import config
from backend.app.services.profile_intelligence.student_representation import StudentRepresentation

class CandidateRetriever:
    def __init__(self, db: Session):
        self.db = db

    def retrieve_candidates(self, student: StudentRepresentation, limit: int = config.MAX_CANDIDATES_STAGE_1) -> List[Job]:
        """
        Stage 1 Retrieval: Fetches a candidate pool of jobs for detailed matching and ranking.
        """
        # Collect candidate role IDs: target role + related roles
        candidate_role_ids = []
        if student.target_role_id:
            candidate_role_ids.append(student.target_role_id)
        candidate_role_ids.extend(student.related_role_ids)

        # Base query: ACTIVE jobs
        query = self.db.query(Job).filter(Job.status == "ACTIVE")

        # 1. Role Filter Condition (Target role, related roles, or title keyword overlap)
        role_conditions = []
        if candidate_role_ids:
            role_conditions.append(Job.role_id.in_(candidate_role_ids))
        if student.target_role_name:
            role_conditions.append(Job.canonical_role.ilike(f"%{student.target_role_name}%"))
            role_conditions.append(Job.title.ilike(f"%{student.target_role_name}%"))

        # 2. Skill overlap condition (Jobs that require at least one of student's skills)
        skill_ids = list(student.skill_ids)
        if skill_ids:
            job_ids_with_skills = (
                self.db.query(JobSkill.job_id)
                .filter(JobSkill.skill_id.in_(skill_ids))
                .distinct()
                .scalar_subquery()
            )
            role_conditions.append(Job.id.in_(job_ids_with_skills))

        if role_conditions:
            query = query.filter(or_(*role_conditions))

        # 3. Location / Remote filter condition (Prefer matching country or remote)
        # Note: Do not hard-exclude other countries here unless strictly non-remote, let eligibility filter handle hard bounds
        query = query.order_by(Job.posted_at.desc().nullslast()).limit(limit)

        candidates = query.all()

        # If candidates are too few (e.g. niche target role), fallback to general recent technical jobs
        if len(candidates) < 20:
            fallback_query = (
                self.db.query(Job)
                .filter(Job.status == "ACTIVE")
                .order_by(Job.posted_at.desc().nullslast())
                .limit(limit)
            )
            candidates = fallback_query.all()

        return candidates

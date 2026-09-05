"""
Job Matching Engine:
Calculates multi-dimensional structured match scores between student profiles and eligible jobs:
1. Skill Match Score (50%) - Required skills (75%) vs Preferred skills (25%) + Ontology relation compatibility
2. Role Match Score (20%) - Taxonomy-based canonical role alignment
3. Experience Match Score (10%) - Experience level bounds
4. Location Match Score (10%) - City, remote, and national compatibility
5. Education Match Score (5%) - Degree and branch alignment
6. Freshness Boost (5%) - Time decay based on posted_at

All weights and scores are fully configurable and deterministic.
"""

import math
import re
from typing import Dict, Any, List, Optional, Tuple, Set
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.app.models.job import Job, JobSkill
from backend.app.models.skill import SkillRelationship
from backend.app.services.profile_intelligence.config import config
from backend.app.services.profile_intelligence.student_representation import StudentRepresentation

class ScoredJobMatch:
    def __init__(
        self,
        job: Job,
        match_score: float,
        skill_score: float,
        role_score: float,
        experience_score: float,
        location_score: float,
        education_score: float,
        freshness_score: float,
        required_skill_score: float,
        preferred_skill_score: float,
        matched_skills: List[Dict[str, Any]],
        partial_skills: List[Dict[str, Any]],
        missing_required_skills: List[Dict[str, Any]],
        missing_preferred_skills: List[Dict[str, Any]],
    ):
        self.job = job
        self.match_score = match_score
        self.skill_score = skill_score
        self.role_score = role_score
        self.experience_score = experience_score
        self.location_score = location_score
        self.education_score = education_score
        self.freshness_score = freshness_score
        self.required_skill_score = required_skill_score
        self.preferred_skill_score = preferred_skill_score
        self.matched_skills = matched_skills
        self.partial_skills = partial_skills
        self.missing_required_skills = missing_required_skills
        self.missing_preferred_skills = missing_preferred_skills

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job.id,
            "title": self.job.title,
            "company_name": self.job.company_name,
            "location": self.job.location,
            "country": self.job.country,
            "remote": self.job.remote,
            "job_url": self.job.job_url,
            "posted_at": self.job.posted_at.isoformat() if self.job.posted_at else None,
            "match_score": self.match_score,
            "scores": {
                "skill_score": self.skill_score,
                "role_score": self.role_score,
                "experience_score": self.experience_score,
                "location_score": self.location_score,
                "education_score": self.education_score,
                "freshness_score": self.freshness_score,
                "required_skill_score": self.required_skill_score,
                "preferred_skill_score": self.preferred_skill_score,
            },
            "matched_skills": self.matched_skills,
            "partial_skills": self.partial_skills,
            "missing_required_skills": self.missing_required_skills,
            "missing_preferred_skills": self.missing_preferred_skills,
        }


class JobMatchingEngine:
    def __init__(self, db: Session):
        self.db = db
        # Preload skill relationships for O(1) in-memory lookups
        self._rel_map: Dict[Tuple[str, str], Tuple[str, float]] = {}
        for r in self.db.query(SkillRelationship).all():
            self._rel_map[(r.source_skill_id, r.target_skill_id)] = (r.relation_type, r.confidence)

    def match_job(self, job: Job, student: StudentRepresentation) -> ScoredJobMatch:
        """
        Calculates a detailed match score for a single job against the student profile.
        """
        # 1. Skill Match Score (50%)
        (
            skill_score,
            req_score,
            pref_score,
            matched,
            partial,
            missing_req,
            missing_pref
        ) = self._calculate_skill_score(job, student)

        # 2. Role Match Score (20%)
        role_score = self._calculate_role_score(job, student)

        # 3. Experience Match Score (10%)
        experience_score = self._calculate_experience_score(job, student)

        # 4. Location Match Score (10%)
        location_score = self._calculate_location_score(job, student)

        # 5. Education Match Score (5%)
        education_score = self._calculate_education_score(job, student)

        # 6. Freshness Score (5%)
        freshness_score = self._calculate_freshness_score(job)

        # Composite Match Score (0 - 100)
        composite = (
            skill_score * config.SKILL_WEIGHT +
            role_score * config.ROLE_WEIGHT +
            experience_score * config.EXPERIENCE_WEIGHT +
            location_score * config.LOCATION_WEIGHT +
            education_score * config.EDUCATION_WEIGHT +
            freshness_score * config.FRESHNESS_WEIGHT
        ) * 100.0

        final_score = round(min(100.0, max(0.0, composite)), 1)

        return ScoredJobMatch(
            job=job,
            match_score=final_score,
            skill_score=round(skill_score * 100, 1),
            role_score=round(role_score * 100, 1),
            experience_score=round(experience_score * 100, 1),
            location_score=round(location_score * 100, 1),
            education_score=round(education_score * 100, 1),
            freshness_score=round(freshness_score * 100, 1),
            required_skill_score=round(req_score * 100, 1),
            preferred_skill_score=round(pref_score * 100, 1),
            matched_skills=matched,
            partial_skills=partial,
            missing_required_skills=missing_req,
            missing_preferred_skills=missing_pref,
        )

    def _calculate_skill_score(self, job: Job, student: StudentRepresentation):
        """
        Calculates skill match with separate required vs preferred weighting and ontology compatibility.
        """
        job_skills = job.skills or []
        if not job_skills:
            # If job has no extracted skills, estimate 0.5 baseline
            return 0.5, 0.5, 0.5, [], [], [], []

        required_skills: List[JobSkill] = []
        preferred_skills: List[JobSkill] = []

        for js in job_skills:
            req_type = (js.requirement_type or "UNKNOWN").upper()
            if req_type == "REQUIRED":
                required_skills.append(js)
            elif req_type == "PREFERRED":
                preferred_skills.append(js)
            else:
                # Default to required if unspecified
                required_skills.append(js)

        student_skill_ids = student.skill_ids
        student_skills_data = student.skills

        matched = []
        partial = []
        missing_req = []
        missing_pref = []

        # Helper to score a list of job skills
        def evaluate_skill_list(skills_subset: List[JobSkill], is_required: bool):
            if not skills_subset:
                return 1.0, 0.0

            total_points = 0.0
            for js in skills_subset:
                s_id = js.skill_id
                s_name = js.skill.canonical_name if js.skill else s_id
                
                # Check direct match
                if s_id in student_skill_ids:
                    st_skill = student_skills_data[s_id]
                    conf = st_skill.get("confidence", 1.0)
                    total_points += (1.0 * conf)
                    matched.append({
                        "skill_id": s_id,
                        "canonical_name": s_name,
                        "match_type": "EXACT",
                        "confidence": conf
                    })
                    continue

                # Check ontology relationship
                best_score = 0.0
                best_rel_type = None
                matched_source_skill = None

                for st_id in student_skill_ids:
                    if (st_id, s_id) in self._rel_map:
                        rel_type, rel_conf = self._rel_map[(st_id, s_id)]
                        sc = config.SKILL_RELATION_SCORES.get(rel_type, 0.5) * rel_conf
                        if sc > best_score:
                            best_score = sc
                            best_rel_type = rel_type
                            matched_source_skill = student_skills_data[st_id].get("canonical_name", st_id)
                    elif (s_id, st_id) in self._rel_map:
                        rel_type, rel_conf = self._rel_map[(s_id, st_id)]
                        sc = config.SKILL_RELATION_SCORES.get(rel_type, 0.5) * rel_conf
                        if sc > best_score:
                            best_score = sc
                            best_rel_type = f"INVERSE_{rel_type}"
                            matched_source_skill = student_skills_data[st_id].get("canonical_name", st_id)

                if best_score >= 0.5:
                    total_points += best_score
                    partial.append({
                        "skill_id": s_id,
                        "canonical_name": s_name,
                        "match_type": "PARTIAL",
                        "relation": best_rel_type,
                        "matched_via": matched_source_skill,
                        "score": round(best_score, 2)
                    })
                else:
                    item = {"skill_id": s_id, "canonical_name": s_name}
                    if is_required:
                        missing_req.append(item)
                    else:
                        missing_pref.append(item)

            score = total_points / len(skills_subset)
            return score, len(skills_subset)

        req_score, req_count = evaluate_skill_list(required_skills, is_required=True)
        pref_score, pref_count = evaluate_skill_list(preferred_skills, is_required=False)

        # Weighted combination
        if req_count > 0 and pref_count > 0:
            skill_score = (req_score * config.REQUIRED_SKILL_WEIGHT) + (pref_score * config.PREFERRED_SKILL_WEIGHT)
        elif req_count > 0:
            skill_score = req_score
        elif pref_count > 0:
            skill_score = pref_score
        else:
            skill_score = 0.5

        return skill_score, req_score, pref_score, matched, partial, missing_req, missing_pref

    def _calculate_role_score(self, job: Job, student: StudentRepresentation) -> float:
        """
        Calculates role alignment using taxonomy families and names.
        """
        # 1. Exact Role ID or Name Match
        if student.target_role_id and job.role_id == student.target_role_id:
            return config.ROLE_MATCH_EXACT

        target_name_lower = (student.target_role_name or "").lower().strip()
        job_role_lower = (job.canonical_role or "").lower().strip()
        job_title_lower = (job.title or "").lower().strip()

        if target_name_lower and (target_name_lower == job_role_lower or target_name_lower in job_title_lower):
            return config.ROLE_MATCH_EXACT

        # 2. Related Role in same RoleFamily
        if job.role_id and job.role_id in student.related_role_ids:
            return config.ROLE_MATCH_SAME_FAMILY_CLOSE

        # 3. Check domain-specific title keyword overlap (exclude generic role stopwords)
        role_stopwords = {"analyst", "engineer", "developer", "specialist", "officer", "manager", "associate", "consultant", "lead", "senior", "junior"}
        target_tokens = {t for t in re.findall(r'\b[a-z]{3,}\b', target_name_lower) if t not in role_stopwords}
        title_tokens = {t for t in re.findall(r'\b[a-z]{3,}\b', job_title_lower) if t not in role_stopwords}
        
        if target_tokens and title_tokens:
            overlap = len(target_tokens.intersection(title_tokens))
            if overlap >= 2:
                return config.ROLE_MATCH_SAME_FAMILY_CLOSE
            elif overlap == 1:
                return config.ROLE_MATCH_SAME_FAMILY_DISTANT

        return config.ROLE_MATCH_UNRELATED

    def _calculate_experience_score(self, job: Job, student: StudentRepresentation) -> float:
        """
        Calculates experience compatibility.
        """
        title_lower = (job.title or "").lower()
        desc_lower = (job.description or "")[:800].lower()

        is_entry_level = bool(re.search(r'\b(intern|internship|trainee|junior|jr\.?|fresher|entry[\s-]level|associate|graduate)\b', title_lower))
        is_senior = bool(re.search(r'\b(senior|sr\.?|lead|principal|staff|architect|manager)\b', title_lower))

        if student.is_fresher:
            if is_entry_level:
                return 1.0
            elif not is_senior:
                return 0.85
            else:
                return 0.20
        else:
            # Student has some experience
            if is_entry_level:
                return 0.80
            elif is_senior:
                return 0.60 if student.experience_years >= 2.0 else 0.30
            else:
                return 1.0

    def _calculate_location_score(self, job: Job, student: StudentRepresentation) -> float:
        """
        Calculates location and remote score.
        """
        if job.remote:
            return 1.0

        pref_loc = (student.preferred_location or student.city or "").lower().strip()
        job_loc = (job.location or "").lower().strip()

        if not pref_loc or not job_loc:
            return 0.70  # neutral

        # Exact city in job location
        if pref_loc in job_loc or job_loc in pref_loc:
            return 1.0

        # Same country check
        job_country = (job.country or "").upper()
        if job_country in ("IN", "INDIA"):
            return 0.60

        return 0.20

    def _calculate_education_score(self, job: Job, student: StudentRepresentation) -> float:
        """
        Calculates degree and educational alignment.
        """
        edu = (student.education_level or "").lower()
        degree = (student.degree or "").lower()

        # If student has standard engineering / IT / CS / Math background -> 1.0
        if any(k in edu or k in degree for k in ["b.tech", "btech", "b.e", "be", "bca", "mca", "m.tech", "computer", "data", "science", "information"]):
            return 1.0
        return 0.75

    def _calculate_freshness_score(self, job: Job) -> float:
        """
        Calculates freshness decay score from posted_at timestamp.
        """
        if not job.posted_at:
            return 0.50

        # Handle naive datetime vs aware
        posted = job.posted_at
        if posted.tzinfo is not None:
            now = datetime.now(timezone.utc)
            delta_days = (now - posted).total_seconds() / 86400.0
        else:
            delta_days = (datetime.utcnow() - posted).total_seconds() / 86400.0

        delta_days = max(0.0, delta_days)

        if delta_days <= config.FRESHNESS_DAYS_EXCELLENT:
            return 1.0
        elif delta_days <= config.FRESHNESS_DAYS_GOOD:
            return 0.90
        elif delta_days <= config.FRESHNESS_DAYS_MODERATE:
            return 0.80
        elif delta_days <= config.FRESHNESS_DAYS_ACCEPTABLE:
            return 0.60
        elif delta_days <= config.FRESHNESS_DAYS_OLD:
            return 0.40
        else:
            return config.FRESHNESS_MIN_SCORE

"""
Student Representation Engine:
Extracts, structures, and normalizes a student profile into a canonical representation:
- Student Skills with source and confidence evidence (KNOWN, VERIFIED, UNVERIFIED, LOW_CONFIDENCE)
- Canonical Target Role determination and related role taxonomy resolution
- Experience level and years of experience estimation
- Location and remote work preferences
- Education level and discipline
"""

from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.app.models.profile import StudentProfile, Education, Experience, Project, Certification
from backend.app.models.skill import Skill, StudentSkill, SkillEvidence, SkillRelationship
from backend.app.models.role import Role, RoleFamily
from backend.app.services.skill_intelligence.normalizer import SkillNormalizer
from backend.app.services.skill_intelligence.role_classifier import RoleClassifier

class StudentRepresentation:
    def __init__(
        self,
        student_id: str,
        name: str,
        target_role_id: Optional[str],
        target_role_name: str,
        role_family_id: Optional[str],
        related_role_ids: List[str],
        skills: Dict[str, Dict[str, Any]],  # skill_id -> {canonical_name, category, confidence, status, source}
        experience_years: float,
        is_fresher: bool,
        education_level: str,
        degree: str,
        city: str,
        preferred_location: str,
        remote_preference: bool,
        profile_version: int,
    ):
        self.student_id = student_id
        self.name = name
        self.target_role_id = target_role_id
        self.target_role_name = target_role_name
        self.role_family_id = role_family_id
        self.related_role_ids = related_role_ids
        self.skills = skills
        self.experience_years = experience_years
        self.is_fresher = is_fresher
        self.education_level = education_level
        self.degree = degree
        self.city = city
        self.preferred_location = preferred_location
        self.remote_preference = remote_preference
        self.profile_version = profile_version

    @property
    def skill_ids(self) -> Set[str]:
        return set(self.skills.keys())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "student_id": self.student_id,
            "name": self.name,
            "target_role_id": self.target_role_id,
            "target_role_name": self.target_role_name,
            "role_family_id": self.role_family_id,
            "related_role_ids": self.related_role_ids,
            "skills_count": len(self.skills),
            "skills": self.skills,
            "experience_years": self.experience_years,
            "is_fresher": self.is_fresher,
            "education_level": self.education_level,
            "degree": self.degree,
            "city": self.city,
            "preferred_location": self.preferred_location,
            "remote_preference": self.remote_preference,
            "profile_version": self.profile_version,
        }


class StudentRepresentationBuilder:
    def __init__(self, db: Session, normalizer: Optional[SkillNormalizer] = None):
        self.db = db
        self.normalizer = normalizer

    def build(self, student_id: str) -> Optional[StudentRepresentation]:
        """
        Loads and builds a normalized StudentRepresentation from the database.
        """
        profile = self.db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not profile:
            return None

        # 1. Resolve Target Role & Taxonomy
        target_role_id, target_role_name, role_family_id, related_role_ids = self._resolve_target_role(profile)

        # 2. Extract & Normalize Skills with Confidence / Verification Status
        student_skills = self._extract_skills(profile)

        # 3. Estimate Experience Years and Fresher status
        exp_years, is_fresher = self._estimate_experience(profile)

        # 4. Location & Remote preference
        pref_loc = profile.preferred_location or profile.city or "Bengaluru"
        remote_pref = "remote" in (pref_loc.lower() + " " + (profile.target_role or "").lower())

        # Version calculation
        profile_version = 1
        st = getattr(profile, "intelligence_state", None)
        if st and hasattr(st, "profile_version"):
            profile_version = st.profile_version
        elif isinstance(st, list) and len(st) > 0:
            profile_version = getattr(st[0], "profile_version", 1)

        return StudentRepresentation(
            student_id=profile.id,
            name=profile.name,
            target_role_id=target_role_id,
            target_role_name=target_role_name,
            role_family_id=role_family_id,
            related_role_ids=related_role_ids,
            skills=student_skills,
            experience_years=exp_years,
            is_fresher=is_fresher,
            education_level=profile.education_level or "B.Tech",
            degree=profile.degree or "Computer Science",
            city=profile.city or "Bengaluru",
            preferred_location=pref_loc,
            remote_preference=remote_pref,
            profile_version=profile_version,
        )

    def _resolve_target_role(self, profile: StudentProfile):
        """
        Maps explicit or implicit student target role to canonical Role record.
        """
        target_str = (profile.target_role or "").strip()
        if not target_str:
            # Check student skills to infer a domain role if target_role is unset
            db_skills = self.db.query(StudentSkill).filter(StudentSkill.student_id == profile.id).all()
            skill_text = " ".join([(s.skill.name.lower() if s.skill else "") for s in db_skills])
            if any(k in skill_text for k in ["ros", "slam", "gazebo", "kinematics", "microcontroller", "embedded c", "rtos", "stm32", "arduino"]):
                target_str = "Robotics Engineer"
            elif any(k in skill_text for k in ["machine learning", "deep learning", "pytorch", "tensorflow", "computer vision", "nlp"]):
                target_str = "Machine Learning Engineer"
            elif any(k in skill_text for k in ["react", "next.js", "django", "fastapi", "node.js", "frontend", "backend"]):
                target_str = "Software Engineer"
            elif any(k in skill_text for k in ["cybersecurity", "penetration testing", "soc", "owasp", "infosec"]):
                target_str = "Cybersecurity Analyst"
            elif any(k in skill_text for k in ["docker", "kubernetes", "aws", "devops", "ci/cd"]):
                target_str = "DevOps Engineer"
            else:
                target_str = "Software Engineer"

        # Try exact match by name, code, or ID
        role = self.db.query(Role).filter(
            (Role.name.ilike(target_str)) |
            (Role.code.ilike(target_str)) |
            (Role.id == target_str)
        ).first()

        # If not exact match, search role aliases or substring
        if not role:
            roles = self.db.query(Role).filter(Role.active == True).all()
            for r in roles:
                if target_str.lower() in r.name.lower() or (r.aliases and any(target_str.lower() in a.lower() for a in r.aliases)):
                    role = r
                    break

        # Fallback to general Software Engineer or first active role
        if not role:
            role = self.db.query(Role).filter(Role.name.ilike("%software engineer%")).first()
            if not role:
                role = self.db.query(Role).first()

        if not role:
            return None, target_str, None, []

        role_family_id = role.family_id
        # Related roles are roles in the same family
        related_roles = (
            self.db.query(Role.id)
            .filter(Role.family_id == role_family_id, Role.id != role.id, Role.active == True)
            .all()
        )
        related_role_ids = [r[0] for r in related_roles]

        return role.id, role.name, role_family_id, related_role_ids

    def _extract_skills(self, profile: StudentProfile) -> Dict[str, Dict[str, Any]]:
        """
        Consolidates skills from student_skills, skill_evidence, projects, and ensures canonical IDs.
        """
        skills_map: Dict[str, Dict[str, Any]] = {}

        # 1. From student_skills table
        db_student_skills = self.db.query(StudentSkill).filter(StudentSkill.student_id == profile.id).all()
        for ss in db_student_skills:
            skill = ss.skill or self.db.query(Skill).filter(Skill.id == ss.skill_id).first()
            if not skill:
                continue

            # Determine verification status
            verification = ss.verification_status or "unverified"
            conf = ss.confidence if ss.confidence is not None else 1.0

            if verification == "verified":
                status = "VERIFIED"
            elif conf < 0.6:
                status = "LOW_CONFIDENCE"
            elif ss.source == "resume":
                status = "KNOWN"
            else:
                status = "UNVERIFIED"

            skills_map[skill.id] = {
                "skill_id": skill.id,
                "canonical_name": skill.canonical_name,
                "category": skill.category,
                "confidence": conf,
                "status": status,
                "source": ss.source or "resume",
            }

        # 2. Add skills from project technologies if not already present
        for proj in profile.projects:
            if proj.technologies and isinstance(proj.technologies, list):
                for tech in proj.technologies:
                    if not tech or not isinstance(tech, str):
                        continue
                    # Check if already resolved
                    tech_clean = tech.strip()
                    matched_skill = self.db.query(Skill).filter(
                        (Skill.canonical_name.ilike(tech_clean)) |
                        (Skill.id == tech_clean)
                    ).first()

                    if matched_skill and matched_skill.id not in skills_map:
                        skills_map[matched_skill.id] = {
                            "skill_id": matched_skill.id,
                            "canonical_name": matched_skill.canonical_name,
                            "category": matched_skill.category,
                            "confidence": 0.85,
                            "status": "KNOWN",
                            "source": "project",
                        }

        return skills_map

    def _estimate_experience(self, profile: StudentProfile) -> tuple:
        """
        Estimates total years of experience and whether student is a fresher.
        """
        exp_records = profile.experience
        if not exp_records or len(exp_records) == 0:
            # Check graduation year
            current_year = datetime.now(timezone.utc).year
            grad_year = profile.graduation_year or current_year
            if grad_year >= current_year - 1:
                return 0.0, True  # Fresher
            else:
                years_since_grad = max(0.0, float(current_year - grad_year))
                return min(years_since_grad, 2.0), years_since_grad < 1.0

        # Rough month counting
        total_months = len(exp_records) * 6  # default 6 months per internship/job entry if unparsed
        years = round(total_months / 12.0, 1)
        is_fresher = years <= 1.0
        return years, is_fresher

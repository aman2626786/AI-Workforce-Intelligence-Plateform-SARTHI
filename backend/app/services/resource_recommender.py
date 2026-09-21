from datetime import datetime, timezone
import math
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from backend.app.models.resource import Resource
from backend.app.models.profile import StudentProfile
from backend.app.models.skill import StudentSkill, Skill
from backend.app.models.recommendation import ProfileSkillGap

class ResourceRecommender:
    """
    Transparent, deterministic recommendation and ranking engine for Sarthi Resources.
    Combines:
    - Skill Match (50%)
    - Target Role / Career Interest Match (20%)
    - Category Match (10%)
    - Keyword Match (10%)
    - Freshness (10%)
    With special bridge bonuses for identified student Skill Gaps.
    """

    @staticmethod
    def calculate_trending_score(resource: Resource) -> float:
        now = datetime.now(timezone.utc)
        pub_date = resource.published_at or resource.created_at
        if pub_date.tzinfo is None:
            pub_date = pub_date.replace(tzinfo=timezone.utc)

        hours_elapsed = max(0.5, (now - pub_date).total_seconds() / 3600.0)

        raw_engagement = (
            (resource.view_count * 1.0) +
            (resource.like_count * 3.0) +
            (resource.save_count * 4.0) +
            (resource.share_count * 5.0) +
            (resource.comment_count * 3.0)
        )

        # Time-decay formula
        gravity = 1.2
        return round(raw_engagement / math.pow(hours_elapsed + 2.0, gravity), 4)

    @staticmethod
    def calculate_freshness_score(resource: Resource) -> float:
        now = datetime.now(timezone.utc)
        pub_date = resource.published_at or resource.created_at
        if pub_date.tzinfo is None:
            pub_date = pub_date.replace(tzinfo=timezone.utc)

        days_elapsed = max(0.0, (now - pub_date).total_seconds() / 86400.0)

        # Freshness half-lives in days per resource type
        half_lives = {
            "INDUSTRY_NEWS": 5.0,
            "TECH_UPDATE": 10.0,
            "OPPORTUNITY": 20.0,
            "RESEARCH_PAPER": 90.0,
            "LEARNING_RESOURCE": 365.0,  # Evergreen
        }
        half_life = half_lives.get(resource.resource_type, 30.0)
        # Exponential decay: 1.0 at 0 days, 0.5 at half-life
        return math.exp(-0.693 * (days_elapsed / half_life))

    def score_resource_for_student(
        self,
        resource: Resource,
        student_skills: List[str],
        target_role: Optional[str],
        skill_gaps: List[Dict[str, Any]]
    ) -> Tuple[float, List[str], Optional[str]]:
        """
        Calculates a deterministic 0-100 score with explainable reasons.
        """
        reasons = []
        gap_covered = None

        res_skills = [s.lower() for s in (resource.skills or [])]
        std_skills = [s.lower() for s in student_skills]

        # 1. Skill Match (Weight: 50 points)
        skill_match_score = 0.0
        matched_skills = []
        if res_skills and std_skills:
            intersection = set(res_skills).intersection(set(std_skills))
            matched_skills = list(intersection)
            overlap_ratio = len(intersection) / max(1, len(res_skills))
            # Up to 50 points
            skill_match_score = min(50.0, overlap_ratio * 50.0)
            if matched_skills:
                capitalized = [s.title() for s in matched_skills[:3]]
                reasons.append(f"Matches your skills: {', '.join(capitalized)}")

        # Skill Gap Bonus / Bridge Check
        for gap in skill_gaps:
            gap_name = gap["skill_name"].lower()
            if gap_name in res_skills or any(gap_name in s for s in res_skills):
                gap_covered = gap["skill_name"]
                # Add bridge bonus
                skill_match_score = min(50.0, skill_match_score + 15.0)
                reasons.append(f"Bridges critical skill gap: {gap['skill_name']} for {target_role or 'Target Career'}")
                break

        # 2. Target Role Match (Weight: 20 points)
        role_match_score = 0.0
        if target_role:
            target_lower = target_role.lower()
            res_roles = [r.lower() for r in (resource.target_roles or [])]
            if any(target_lower in r or r in target_lower for r in res_roles):
                role_match_score = 20.0
                reasons.append(f"Directly relevant to your target role ({target_role})")
            elif any(word in target_lower for word in resource.title.lower().split() if len(word) > 3):
                role_match_score = 10.0

        # 3. Category Match (Weight: 10 points)
        category_score = 7.0  # baseline relevance
        if resource.category:
            category_score = 10.0

        # 4. Keyword Match (Weight: 10 points)
        keyword_score = 0.0
        res_keywords = [k.lower() for k in (resource.keywords or []) + (resource.tags or [])]
        if std_skills and res_keywords:
            common_kw = set(res_keywords).intersection(set(std_skills))
            keyword_score = min(10.0, len(common_kw) * 3.5)

        # 5. Freshness Score (Weight: 10 points)
        freshness_ratio = self.calculate_freshness_score(resource)
        freshness_score = freshness_ratio * 10.0

        total_score = round(skill_match_score + role_match_score + category_score + keyword_score + freshness_score, 1)
        # Clamp between 0 and 99.0
        final_score = min(98.5, max(15.0, total_score))

        return final_score, reasons, gap_covered

    def get_student_context(self, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Gathers student extracted skills, target role, and identified skill gaps.
        """
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
        if not profile:
            return {"skills": [], "target_role": None, "skill_gaps": []}

        # Student skills from StudentSkill
        skills_records = (
            db.query(Skill.canonical_name)
            .join(StudentSkill, StudentSkill.skill_id == Skill.id)
            .filter(StudentSkill.student_id == profile.id)
            .all()
        )
        student_skills = [s[0] for s in skills_records]

        # Skill gaps from ProfileSkillGap
        gaps_records = (
            db.query(ProfileSkillGap, Skill.canonical_name)
            .join(Skill, ProfileSkillGap.skill_id == Skill.id)
            .filter(ProfileSkillGap.student_id == profile.id)
            .order_by(ProfileSkillGap.priority_score.desc())
            .limit(5)
            .all()
        )
        skill_gaps = [
            {"skill_id": gap.skill_id, "skill_name": canon_name, "priority": gap.priority_level}
            for gap, canon_name in gaps_records
        ]

        return {
            "skills": student_skills,
            "target_role": profile.target_role,
            "skill_gaps": skill_gaps,
            "profile_id": profile.id,
            "name": profile.name
        }

resource_recommender = ResourceRecommender()

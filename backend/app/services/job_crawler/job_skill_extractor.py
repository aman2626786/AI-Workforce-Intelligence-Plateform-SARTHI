import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.app.services.skill_extractor import SkillExtractor
from backend.app.models.job import Job, JobSkill
from backend.app.models import Skill

logger = logging.getLogger("job_crawler.job_skill_extractor")

class JobSkillExtractor:
    """
    Extracts canonical skills from normalized job postings and persists them to job_skills.
    Reuses the existing SkillExtractor and canonical skill taxonomy.
    """

    def __init__(self, skill_extractor: Optional[SkillExtractor] = None):
        self.extractor = skill_extractor or SkillExtractor()

    def extract_from_job(self, db: Session, job: Job) -> List[JobSkill]:
        """
        Extracts skills from a Job instance (title, description, requirements)
        and persists them into the job_skills table.
        """
        combined_text = f"{job.title or ''} {job.description or ''}".strip()
        if not combined_text:
            return []

        # Use SkillExtractor to get matched canonical skills directly from text
        extracted = self.extractor.extract_skills_from_text(combined_text, "JOB_POSTING", base_confidence=0.95)
        if not extracted:
            return []

        # Lookup existing skills by ID and by canonical name to avoid unique constraints
        all_db_skills = db.query(Skill.id, Skill.canonical_name).all()
        id_map = {s.id: s.id for s in all_db_skills}
        name_map = {s.canonical_name.lower(): s.id for s in all_db_skills}

        created_skills: List[JobSkill] = []
        for item in extracted:
            s_id = item["skill_id"]
            c_name = item["canonical_name"]

            target_skill_id = id_map.get(s_id) or name_map.get(c_name.lower())

            if not target_skill_id:
                try:
                    new_skill = Skill(
                        id=s_id,
                        canonical_name=c_name,
                        category=item.get("category", "General"),
                        aliases=[]
                    )
                    db.add(new_skill)
                    db.flush()
                    target_skill_id = s_id
                    id_map[s_id] = s_id
                    name_map[c_name.lower()] = s_id
                except Exception as e:
                    logger.debug(f"Could not auto-seed skill {c_name}: {e}")
                    continue

            # Check if JobSkill already exists for this job
            existing_link = db.query(JobSkill).filter_by(job_id=job.id, skill_id=target_skill_id).first()
            if existing_link:
                # Update confidence or snippet if higher
                if item["confidence"] > (existing_link.confidence or 0):
                    existing_link.confidence = item["confidence"]
                    existing_link.source_text = item.get("original_text", "")[:255]
                continue

            job_skill = JobSkill(
                job_id=job.id,
                skill_id=target_skill_id,
                confidence=item.get("confidence", 0.9),
                source_text=item.get("original_text", "")[:255]
            )
            db.add(job_skill)
            created_skills.append(job_skill)

        try:
            db.flush()
        except IntegrityError as e:
            db.rollback()
            logger.warning(f"Integrity error persisting job skills for job {job.id}: {e}")
            return []

        return created_skills

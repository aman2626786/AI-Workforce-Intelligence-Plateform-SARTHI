"""
SkillIntelligencePipeline:
Master orchestrator for processing collected jobs into skill intelligence:
- Incremental batching (processes jobs in chunks of 50)
- State transitions: RAW -> CLEANED -> SKILLS_EXTRACTED -> NORMALIZED -> ROLE_CLASSIFIED -> ANALYZED
- Failure isolation per job (try/except wrapper preventing batch crashes)
- Triggers aggregations and snapshots upon batch completion
- Records execution run metrics in `pipeline_runs` table
"""

import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.database import SessionLocal
from backend.app.models.job import Job, JobSkill
from backend.app.models.skill import Skill, CandidateSkill
from backend.app.models.role import Role
from backend.app.models.intelligence import PipelineRun

from backend.app.services.skill_intelligence.normalizer import SkillNormalizer
from backend.app.services.skill_intelligence.extractor import SkillExtractor
from backend.app.services.skill_intelligence.role_classifier import RoleClassifier
from backend.app.services.skill_intelligence.aggregator import RoleSkillAggregator
from backend.app.services.skill_intelligence.trend_engine import TrendEngine

logger = logging.getLogger("skill_pipeline")

APP_DIR = Path(__file__).resolve().parent.parent.parent

class SkillIntelligencePipeline:
    def __init__(self, db: Optional[Session] = None):
        self._external_db = db is not None
        self.db = db or SessionLocal()

        # Load ontology and taxonomy data
        ontology_path = APP_DIR / "data" / "skills_ontology.json"
        with open(ontology_path, "r", encoding="utf-8") as f:
            ontology_data = json.load(f)

        roles_path = APP_DIR / "data" / "roles_taxonomy.json"
        with open(roles_path, "r", encoding="utf-8") as f:
            roles_data = json.load(f)

        # Initialize engines
        self.normalizer = SkillNormalizer(ontology_data)
        self.extractor = SkillExtractor(self.normalizer)
        self.role_classifier = RoleClassifier(roles_data)
        self.aggregator = RoleSkillAggregator(self.db)
        self.trend_engine = TrendEngine(self.db)

    def close(self):
        if not self._external_db:
            self.db.close()

    def process_jobs(self, batch_size: int = 50, limit: Optional[int] = None, reprocess_failed: bool = False) -> Dict[str, Any]:
        """
        Executes an incremental processing run on jobs requiring intelligence analysis.
        """
        start_time = time.time()
        run_record = PipelineRun(
            run_type="REPROCESS_FAILED" if reprocess_failed else "INCREMENTAL",
            started_at=datetime.now(timezone.utc),
            status="RUNNING"
        )
        self.db.add(run_record)
        self.db.commit()

        # Find target jobs
        query = self.db.query(Job)
        if reprocess_failed:
            query = query.filter(Job.processing_state == "FAILED")
        else:
            query = query.filter(
                or_(
                    Job.processing_state == "RAW",
                    Job.processing_state.is_(None),
                    Job.processing_state != "ANALYZED"
                )
            )

        total_candidates = query.count()
        if limit:
            query = query.limit(limit)

        jobs_to_process = query.all()
        run_record.jobs_found = len(jobs_to_process)

        logger.info(f"Skill Pipeline: Found {len(jobs_to_process)} jobs to process (Total in queue: {total_candidates}).")

        processed_count = 0
        skills_extracted_count = 0
        roles_classified_count = 0
        failed_count = 0

        # In-memory cache for candidate skills in this batch to avoid unique constraint errors
        batch_candidates = {}

        # Process in chunks
        for i in range(0, len(jobs_to_process), batch_size):
            chunk = jobs_to_process[i:i + batch_size]
            batch_candidates.clear()

            for job in chunk:
                try:
                    job.processing_attempts = (job.processing_attempts or 0) + 1
                    job.last_processed_at = datetime.now(timezone.utc)

                    # 1. Classify Role
                    role_res = self.role_classifier.classify(job.title, job.description)
                    if role_res["role_id"]:
                        job.role_id = role_res["role_id"]
                        job.role_confidence = role_res["confidence"]
                        job.role_classification_method = role_res["method"]
                        roles_classified_count += 1
                    else:
                        job.role_confidence = role_res["confidence"]
                        job.role_classification_method = "LOW_CONFIDENCE"

                    # 2. Extract Skills with Evidence
                    extract_res = self.extractor.extract_skills_from_jd(job.description)
                    extracted_skills = extract_res["skills"]
                    unknown_candidates = extract_res["unknown_candidates"]

                    # Remove existing job_skills for this job to prevent duplicates on rerun
                    self.db.query(JobSkill).filter(JobSkill.job_id == job.id).delete()

                    # Insert new skills
                    for s in extracted_skills:
                        # Ensure skill exists in DB (handle potential custom skills)
                        db_skill = self.db.query(Skill).filter(Skill.id == s["skill_id"]).first()
                        if not db_skill:
                            # Try finding by canonical name
                            db_skill = self.db.query(Skill).filter(Skill.canonical_name == s["canonical_name"]).first()

                        if db_skill:
                            job_skill = JobSkill(
                                job_id=job.id,
                                skill_id=db_skill.id,
                                confidence=s["confidence"],
                                source_text=s["matched_text"],
                                requirement_type=s["requirement_type"],
                                evidence_text=s["evidence_text"],
                                section=s["section"],
                                start_pos=s["start_pos"],
                                end_pos=s["end_pos"]
                            )
                            self.db.add(job_skill)
                            skills_extracted_count += 1

                    # Harvest unknown candidates for human review
                    for cand in unknown_candidates[:5]:  # Top 5 candidates per job to keep review queue clean
                        raw_name = cand["raw_name"]
                        if raw_name in batch_candidates:
                            batch_candidates[raw_name].frequency += cand["frequency"]
                        else:
                            existing_cand = self.db.query(CandidateSkill).filter(
                                CandidateSkill.raw_name == raw_name
                            ).first()
                            if not existing_cand:
                                new_cand = CandidateSkill(
                                    raw_name=raw_name,
                                    source_job_id=job.id,
                                    frequency=cand["frequency"],
                                    confidence=cand["confidence"],
                                    status="PENDING"
                                )
                                self.db.add(new_cand)
                                batch_candidates[raw_name] = new_cand
                            else:
                                existing_cand.frequency += cand["frequency"]
                                batch_candidates[raw_name] = existing_cand

                    # Mark job completed
                    job.processing_state = "ANALYZED"
                    job.processing_error = None
                    processed_count += 1

                except Exception as e:
                    logger.error(f"Error processing job {job.id}: {e}", exc_info=True)
                    job.processing_state = "FAILED"
                    job.processing_error = str(e)[:1000]
                    failed_count += 1

            # Commit batch
            self.db.commit()

        # Update Aggregations & Trends if jobs were processed
        if processed_count > 0:
            logger.info("Updating role-skill aggregations and taking historical snapshot...")
            self.aggregator.aggregate_role_skills()
            self.aggregator.create_monthly_snapshot()
            self.trend_engine.calculate_all_trends()

        # Finalize run record
        duration = round(time.time() - start_time, 2)
        run_record.jobs_processed = processed_count
        run_record.skills_extracted = skills_extracted_count
        run_record.skills_normalized = skills_extracted_count
        run_record.roles_classified = roles_classified_count
        run_record.failed_jobs = failed_count
        run_record.duration_seconds = duration
        run_record.completed_at = datetime.now(timezone.utc)
        run_record.status = "SUCCESS" if failed_count == 0 else "PARTIAL"
        self.db.commit()

        metrics = {
            "run_id": run_record.id,
            "jobs_found": run_record.jobs_found,
            "jobs_processed": processed_count,
            "skills_extracted": skills_extracted_count,
            "roles_classified": roles_classified_count,
            "failed_jobs": failed_count,
            "duration_seconds": duration,
            "status": run_record.status
        }
        logger.info(f"Skill Intelligence Pipeline finished: {metrics}")
        return metrics

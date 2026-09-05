import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.models.job import Job, RawJob, JobSource, CollectionRun
from backend.app.services.job_crawler.base_connector import JobSourceConnector
from backend.app.services.job_crawler.connectors.adzuna import AdzunaConnector
from backend.app.services.job_crawler.connectors.jooble import JoobleConnector
from backend.app.services.job_crawler.connectors.usajobs import USAJobsConnector
from backend.app.services.job_crawler.connectors.company_career import CompanyCareerConnector
from backend.app.services.job_crawler.connectors.greenhouse import GreenhouseConnector
from backend.app.services.job_crawler.validator import JobValidator
from backend.app.services.job_crawler.deduplicator import JobDeduplicator
from backend.app.services.job_crawler.role_classifier import RoleClassifier
from backend.app.services.job_crawler.job_skill_extractor import JobSkillExtractor

logger = logging.getLogger("job_crawler.agent")

class JobCollectionAgent:
    """
    Production-ready orchestrator for automated job collection across multiple sources.
    Handles:
    - Scheduling & Multi-source dispatch
    - Raw data preservation
    - Quality & Spam validation
    - Multi-tier deduplication & canonical merge
    - Role classification & taxonomy mapping
    - Database insertion
    - Automated skill extraction handoff
    - Collection run metric tracking
    """

    def __init__(self, connectors: Optional[List[JobSourceConnector]] = None):
        self.connectors = connectors or [
            AdzunaConnector(),
            JoobleConnector(),
            GreenhouseConnector(),
            USAJobsConnector(),
            CompanyCareerConnector()
        ]
        self.role_classifier = RoleClassifier()
        self.skill_extractor = JobSkillExtractor()

    async def collect_from_source(
        self,
        connector: JobSourceConnector,
        db: Session,
        roles: List[str],
        locations: List[str],
        pages_per_query: int = 1
    ) -> Dict[str, Any]:
        """
        Runs collection for a specific connector across designated roles and locations.
        """
        run = CollectionRun(
            source=connector.source_name,
            started_at=datetime.utcnow(),
            status="RUNNING"
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        metrics = {
            "source": connector.source_name,
            "jobs_fetched": 0,
            "jobs_inserted": 0,
            "jobs_updated": 0,
            "duplicates_found": 0,
            "invalid_jobs": 0,
            "errors": 0,
            "status": "SUCCESS"
        }

        try:
            for role_name in roles:
                for location in locations:
                    for page in range(1, pages_per_query + 1):
                        try:
                            raw_dtos = await connector.fetch_jobs(query=role_name, location=location, page=page)
                        except Exception as e:
                            logger.error(f"Error fetching from {connector.source_name} for '{role_name}' in '{location}': {e}")
                            metrics["errors"] += 1
                            JobValidator.log_error(
                                db,
                                source=connector.source_name,
                                error_type="fetch_exception",
                                error_details=str(e)
                            )
                            continue

                        metrics["jobs_fetched"] += len(raw_dtos)

                        for raw_dto in raw_dtos:
                            # 1. Store Raw Job
                            raw_record = RawJob(
                                source=raw_dto.source,
                                source_job_id=raw_dto.source_job_id,
                                raw_payload=raw_dto.raw_payload
                            )
                            db.add(raw_record)
                            try:
                                db.flush()
                            except Exception:
                                db.rollback()

                            # 2. Normalize
                            norm_dto = connector.normalize_job(raw_dto)

                            # 3. Validate
                            is_valid, reject_reason = JobValidator.validate(norm_dto)
                            if not is_valid:
                                metrics["invalid_jobs"] += 1
                                JobValidator.log_error(
                                    db,
                                    source=norm_dto.source,
                                    error_type="validation_failure",
                                    error_details=reject_reason,
                                    source_job_id=norm_dto.source_job_id,
                                    raw_payload=raw_dto.raw_payload
                                )
                                continue

                            # 4. Classify Role
                            canonical_role, confidence = self.role_classifier.classify(
                                norm_dto.title,
                                norm_dto.description
                            )

                            # 5. Deduplicate
                            is_dup, existing_job_id, match_reason = JobDeduplicator.check_duplicate(
                                db,
                                norm_dto,
                                canonical_role
                            )

                            clean_url = JobDeduplicator.normalize_url(norm_dto.job_url)
                            content_hash = JobDeduplicator.compute_content_hash(
                                canonical_role,
                                norm_dto.company_name,
                                norm_dto.description
                            )

                            if is_dup and existing_job_id:
                                # Merge into existing canonical job
                                metrics["duplicates_found"] += 1
                                metrics["jobs_updated"] += 1
                                JobDeduplicator.merge_source_into_job(
                                    db,
                                    existing_job_id=existing_job_id,
                                    source=norm_dto.source,
                                    source_job_id=norm_dto.source_job_id,
                                    source_url=clean_url
                                )
                            else:
                                # Insert new canonical job
                                new_job = Job(
                                    source=norm_dto.source,
                                    source_job_id=norm_dto.source_job_id,
                                    canonical_role=canonical_role,
                                    title=norm_dto.title,
                                    company_name=norm_dto.company_name,
                                    location=norm_dto.location,
                                    country=norm_dto.country or "IN",
                                    job_type=norm_dto.job_type or "Full-time",
                                    description=norm_dto.description,
                                    salary_min=norm_dto.salary_min,
                                    salary_max=norm_dto.salary_max,
                                    currency=norm_dto.currency,
                                    job_url=clean_url,
                                    category=norm_dto.category,
                                    remote=norm_dto.remote,
                                    content_hash=content_hash,
                                    posted_at=norm_dto.posted_at or datetime.utcnow(),
                                    expires_at=norm_dto.expires_at,
                                    status="ACTIVE"
                                )
                                db.add(new_job)
                                db.flush()

                                # Link primary source
                                job_source = JobSource(
                                    job_id=new_job.id,
                                    source=norm_dto.source,
                                    source_job_id=norm_dto.source_job_id,
                                    source_url=clean_url
                                )
                                db.add(job_source)
                                db.flush()

                                # 6. Extract and persist skills
                                try:
                                    self.skill_extractor.extract_from_job(db, new_job)
                                except Exception as e:
                                    logger.warning(f"Error extracting skills for job {new_job.id}: {e}")

                                metrics["jobs_inserted"] += 1

                        # Periodic commit per page
                        try:
                            db.commit()
                        except Exception as e:
                            db.rollback()
                            logger.error(f"Error committing page batch for {connector.source_name}: {e}")

            # Determine final status
            if metrics["errors"] > 0 and metrics["jobs_inserted"] == 0 and metrics["duplicates_found"] == 0:
                metrics["status"] = "FAILED"
            elif metrics["errors"] > 0:
                metrics["status"] = "PARTIAL"
            else:
                metrics["status"] = "SUCCESS"

        except Exception as e:
            logger.critical(f"Critical unhandled exception in {connector.source_name} collector: {e}")
            metrics["status"] = "FAILED"
            metrics["errors"] += 1
            db.rollback()

        finally:
            run.completed_at = datetime.utcnow()
            run.jobs_fetched = metrics["jobs_fetched"]
            run.jobs_inserted = metrics["jobs_inserted"]
            run.jobs_updated = metrics["jobs_updated"]
            run.duplicates_found = metrics["duplicates_found"]
            run.invalid_jobs = metrics["invalid_jobs"]
            run.errors = metrics["errors"]
            run.status = metrics["status"]
            try:
                db.commit()
            except Exception:
                db.rollback()

        return metrics

    async def run(
        self,
        sources: Optional[List[str]] = None,
        roles: Optional[List[str]] = None,
        locations: Optional[List[str]] = None,
        pages_per_query: int = 1
    ) -> Dict[str, Any]:
        """
        Executes a complete collection cycle across selected connectors.
        """
        active_connectors = self.connectors
        if sources:
            source_set = {s.lower() for s in sources}
            active_connectors = [c for c in self.connectors if c.source_name.lower() in source_set]

        # Default search matrix if unspecified
        search_roles = roles or [
            "Software Engineer",
            "Data Scientist",
            "DevOps Engineer",
            "Frontend Developer",
            "Backend Developer",
            "Machine Learning Engineer"
        ]
        search_locations = locations or ["India", "Remote", "United States"]

        overall_metrics = {
            "started_at": datetime.utcnow().isoformat(),
            "sources_run": len(active_connectors),
            "total_fetched": 0,
            "total_inserted": 0,
            "total_updated": 0,
            "total_duplicates": 0,
            "total_invalid": 0,
            "total_errors": 0,
            "source_results": []
        }

        db = SessionLocal()
        try:
            for connector in active_connectors:
                logger.info(f"Starting job collection for source: {connector.source_name}")
                res = await self.collect_from_source(
                    connector=connector,
                    db=db,
                    roles=search_roles,
                    locations=search_locations,
                    pages_per_query=pages_per_query
                )
                overall_metrics["source_results"].append(res)
                overall_metrics["total_fetched"] += res["jobs_fetched"]
                overall_metrics["total_inserted"] += res["jobs_inserted"]
                overall_metrics["total_updated"] += res["jobs_updated"]
                overall_metrics["total_duplicates"] += res["duplicates_found"]
                overall_metrics["total_invalid"] += res["invalid_jobs"]
                overall_metrics["total_errors"] += res["errors"]
        finally:
            db.close()
            overall_metrics["completed_at"] = datetime.utcnow().isoformat()

        logger.info(f"Job collection cycle completed. Inserted: {overall_metrics['total_inserted']}, "
                    f"Duplicates/Updated: {overall_metrics['total_duplicates']}, Errors: {overall_metrics['total_errors']}")
        return overall_metrics

    def run_sync(self, **kwargs) -> Dict[str, Any]:
        """Synchronous wrapper for scheduled runners and CLI commands."""
        return asyncio.run(self.run(**kwargs))

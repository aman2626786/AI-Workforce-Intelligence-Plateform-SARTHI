"""
Migration Script: Process all existing jobs through the new Skill Intelligence Engine.
"""

import sys
import os
import logging
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.database import SessionLocal
from backend.app.services.skill_intelligence.pipeline import SkillIntelligencePipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("process_existing_jobs")

def main():
    logger.info("Initializing Skill Intelligence Pipeline for existing jobs...")
    db = SessionLocal()
    try:
        pipeline = SkillIntelligencePipeline(db=db)
        # Process in chunks of 50 until all are done
        total_processed = 0
        total_failed = 0
        while True:
            metrics = pipeline.process_jobs(batch_size=50, limit=50)
            processed = metrics["jobs_processed"]
            failed = metrics["failed_jobs"]
            total_processed += processed
            total_failed += failed
            
            if processed == 0 and failed == 0:
                break
                
        logger.info(f"Migration completed! Total Jobs Processed: {total_processed}, Total Failed: {total_failed}")
    finally:
        db.close()

if __name__ == "__main__":
    main()

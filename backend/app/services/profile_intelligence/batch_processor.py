"""
Batch Processor:
Executes scheduled background refreshes and batch recalculations:
- Memory-safe batch iteration (100 students / chunk)
- Error isolation (single failure does not crash the batch)
- Progress tracking and summary reporting
"""

import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.models.profile import StudentProfile
from backend.app.services.profile_intelligence.agent import ProfileIntelligenceAgent
from backend.app.services.profile_intelligence.config import config

logger = logging.getLogger("profile_intelligence.batch")

class BatchProcessor:
    def __init__(self, db: Session):
        self.db = db
        self.agent = ProfileIntelligenceAgent(db)

    def process_all_students(
        self,
        batch_size: int = config.BATCH_SIZE,
        trigger_event: str = "SCHEDULED_BATCH"
    ) -> Dict[str, Any]:
        """
        Processes all student profiles in batches with isolated exception handling.
        """
        total_students = self.db.query(StudentProfile.id).count()
        processed = 0
        succeeded = 0
        failed = 0
        errors = []

        offset = 0
        while offset < total_students:
            batch_ids = [
                row[0] for row in self.db.query(StudentProfile.id)
                .order_by(StudentProfile.created_at.asc())
                .offset(offset)
                .limit(batch_size)
                .all()
            ]

            if not batch_ids:
                break

            for s_id in batch_ids:
                processed += 1
                try:
                    self.agent.analyze_profile(student_id=s_id, trigger_event=trigger_event)
                    succeeded += 1
                except Exception as e:
                    failed += 1
                    errors.append({"student_id": s_id, "error": str(e)})
                    logger.error(f"Batch processing error for student {s_id}: {e}")

            offset += batch_size

        return {
            "total_students": total_students,
            "processed_count": processed,
            "succeeded_count": succeeded,
            "failed_count": failed,
            "errors": errors[:10]
        }

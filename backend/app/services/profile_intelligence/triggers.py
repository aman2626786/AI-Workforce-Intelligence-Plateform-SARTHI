"""
Profile Intelligence Event Triggers:
Reacts to lifecycle events across the platform:
- PROFILE_UPDATED
- RESUME_CONFIRMED
- TARGET_ROLE_CHANGED
- INDUSTRY_DATA_UPDATED
"""

import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.models.profile import StudentProfile
from backend.app.models.recommendation import ProfileIntelligenceState
from backend.app.services.profile_intelligence.agent import ProfileIntelligenceAgent

logger = logging.getLogger("profile_intelligence.triggers")

class ProfileIntelligenceTriggers:
    def __init__(self, db: Session):
        self.db = db
        self.agent = ProfileIntelligenceAgent(db)

    def trigger_profile_updated(self, student_id: str) -> dict:
        """
        Triggered when student modifies profile fields, skills, education, or experience.
        Increments profile_version and triggers immediate recommendation recomputation.
        """
        state = self.db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == student_id).first()
        if state:
            state.profile_version += 1
            self.db.commit()
        
        return self.agent.analyze_profile(student_id=student_id, trigger_event="PROFILE_UPDATED")

    def trigger_resume_confirmed(self, student_id: str) -> dict:
        """
        Triggered when new resume parsing results are confirmed and saved.
        """
        state = self.db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == student_id).first()
        if state:
            state.profile_version += 1
            self.db.commit()
            
        return self.agent.analyze_profile(student_id=student_id, trigger_event="RESUME_CONFIRMED")

    def trigger_target_role_changed(self, student_id: str, new_target_role: str) -> dict:
        """
        Triggered when student explicitly changes target career role.
        """
        profile = self.db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if profile:
            profile.target_role = new_target_role
            self.db.commit()

        state = self.db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == student_id).first()
        if state:
            state.profile_version += 1
            self.db.commit()

        return self.agent.analyze_profile(student_id=student_id, trigger_event="TARGET_ROLE_CHANGED")

    def trigger_industry_update(self, new_version: str, affected_role_ids: Optional[List[str]] = None) -> dict:
        """
        Triggered when Skill Intelligence pipeline produces a new industry trend snapshot.
        Only recalculates students whose target role is in the affected role set.
        """
        query = self.db.query(ProfileIntelligenceState)
        if affected_role_ids:
            query = query.filter(ProfileIntelligenceState.target_role_id.in_(affected_role_ids))
        
        states = query.all()
        updated = 0
        failed = 0

        for s in states:
            try:
                s.industry_data_version = new_version
                self.db.commit()
                self.agent.analyze_profile(student_id=s.student_id, trigger_event="INDUSTRY_DATA_UPDATED")
                updated += 1
            except Exception as e:
                logger.error(f"Failed industry recalculation for student {s.student_id}: {e}")
                failed += 1

        return {
            "industry_data_version": new_version,
            "profiles_recalculated": updated,
            "failed_count": failed
        }

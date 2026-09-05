"""
Profile Intelligence Agent:
Main orchestrator coordinating the end-to-end profile intelligence lifecycle:
1. Student profile loading and normalization (StudentRepresentationBuilder)
2. Skill gap analysis & prioritized gap scoring (SkillGapEngine)
3. Stage 1 candidate job retrieval (CandidateRetriever)
4. Hard eligibility filtering (EligibilityFilter)
5. Stage 2 detailed ranking, diversity rules & explanations (RecommendationRankingEngine)
6. Transactional persistence in database
7. Execution audit logging (RecommendationRun)
8. Graceful error handling (preserves prior state on failure)
"""

import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.app.models.profile import StudentProfile
from backend.app.models.intelligence import PipelineRun
from backend.app.models.recommendation import (
    ProfileIntelligenceState,
    ProfileSkillGap,
    ProfileRecommendation,
    RecommendationScore,
    RecommendationRun,
)
from backend.app.services.profile_intelligence.student_representation import StudentRepresentationBuilder, StudentRepresentation
from backend.app.services.profile_intelligence.skill_gap_engine import SkillGapEngine
from backend.app.services.profile_intelligence.candidate_retriever import CandidateRetriever
from backend.app.services.profile_intelligence.eligibility_filter import EligibilityFilter
from backend.app.services.profile_intelligence.ranking_engine import RecommendationRankingEngine
from backend.app.services.profile_intelligence.config import config

logger = logging.getLogger("profile_intelligence.agent")

class ProfileIntelligenceAgent:
    def __init__(self, db: Session):
        self.db = db
        self.builder = StudentRepresentationBuilder(db)
        self.gap_engine = SkillGapEngine(db)
        self.retriever = CandidateRetriever(db)
        self.eligibility_filter = EligibilityFilter()
        self.ranker = RecommendationRankingEngine(db)

    def analyze_profile(
        self,
        student_id: str,
        trigger_event: str = "MANUAL",
        top_n: int = config.DEFAULT_RECOMMENDATION_LIMIT,
        force_recalculate: bool = False
    ) -> Dict[str, Any]:
        """
        Executes complete profile intelligence analysis for a given student.
        """
        start_time = time.time()
        
        # 1. Fetch Student Profile
        profile = self.db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not profile:
            raise ValueError(f"StudentProfile with ID {student_id} not found.")

        # 2. Get or initialize ProfileIntelligenceState
        state = self.db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == student_id).first()
        if not state:
            state = ProfileIntelligenceState(
                student_id=student_id,
                profile_version=1,
                industry_data_version="1.0.0",
                analysis_status="RUNNING"
            )
            self.db.add(state)
            self.db.flush()
        else:
            state.analysis_status = "RUNNING"
            self.db.commit()

        # Audit run record
        run = RecommendationRun(
            student_id=student_id,
            trigger_event=trigger_event,
            profile_version=state.profile_version,
            industry_data_version=state.industry_data_version,
            status="RUNNING"
        )
        self.db.add(run)
        self.db.flush()

        try:
            # 3. Build normalized StudentRepresentation
            student = self.builder.build(student_id)
            if not student:
                raise ValueError(f"Failed to build representation for student {student_id}")

            # 4. Analyze Skill Gaps & Career Fit
            gap_results = self.gap_engine.analyze_gaps(student)
            career_fit_score = gap_results["career_fit_score"]

            # 5. Candidate Job Retrieval (Stage 1)
            candidates = self.retriever.retrieve_candidates(student)
            candidate_count = len(candidates)

            # 6. Hard Eligibility Filtering
            eligible_jobs, excluded = self.eligibility_filter.filter_eligible(candidates, student)
            eligible_count = len(eligible_jobs)

            # 7. Job Matching, Ranking & Explanations (Stage 2)
            ranked_recommendations = self.ranker.rank_and_explain(
                eligible_jobs=eligible_jobs,
                student=student,
                top_n=top_n
            )
            ranked_count = len(ranked_recommendations)

            # 8. Persist Skill Gaps (Replace previous gaps transactionally)
            self.db.query(ProfileSkillGap).filter(ProfileSkillGap.student_id == student_id).delete()
            for gap in gap_results["skill_gaps"]:
                gap_rec = ProfileSkillGap(
                    student_id=student_id,
                    skill_id=gap["skill_id"],
                    status=gap["status"],
                    priority_level=gap["priority_level"],
                    priority_score=gap["priority_score"],
                    demand_percentage=gap["demand_percentage"],
                    importance_score=gap["importance_score"],
                    trend_label=gap["trend_label"],
                    is_emerging=gap["is_emerging"],
                    requirement_type=gap["requirement_type"],
                    student_confidence=gap["student_confidence"],
                    matching_evidence=gap["matching_evidence"]
                )
                self.db.add(gap_rec)

            # 9. Persist Recommendations (Replace previous recommendations)
            self.db.query(ProfileRecommendation).filter(ProfileRecommendation.student_id == student_id).delete()
            for rec in ranked_recommendations:
                rec_rec = ProfileRecommendation(
                    student_id=student_id,
                    job_id=rec["job_id"],
                    rank=rec["rank"],
                    match_score=rec["match_score"],
                    matched_skills=rec["matched_skills"],
                    partial_skills=rec["partial_skills"],
                    missing_required_skills=rec["missing_required_skills"],
                    missing_preferred_skills=rec["missing_preferred_skills"],
                    why_recommended=rec["why_recommended"],
                    explanation_breakdown=rec["explanation_breakdown"]
                )
                self.db.add(rec_rec)
                self.db.flush()

                # Add score breakdown
                sc = rec["scores"]
                score_rec = RecommendationScore(
                    recommendation_id=rec_rec.id,
                    skill_score=sc["skill_score"],
                    role_score=sc["role_score"],
                    experience_score=sc["experience_score"],
                    location_score=sc["location_score"],
                    education_score=sc["education_score"],
                    freshness_score=sc["freshness_score"],
                    required_skill_score=sc["required_skill_score"],
                    preferred_skill_score=sc["preferred_skill_score"]
                )
                self.db.add(score_rec)

            # 10. Update State Record
            state.target_role_id = student.target_role_id
            state.target_role_name = student.target_role_name
            state.career_fit_score = career_fit_score
            state.analysis_status = "COMPLETED"
            state.last_analyzed_at = datetime.now(timezone.utc)
            state.error_log = None

            # 11. Complete Audit Log Run
            duration = round(time.time() - start_time, 2)
            run.candidate_jobs_count = candidate_count
            run.eligible_jobs_count = eligible_count
            run.ranked_jobs_count = ranked_count
            run.skill_gaps_count = len(gap_results["skill_gaps"])
            run.recommendations_count = ranked_count
            run.duration_seconds = duration
            run.status = "COMPLETED"

            self.db.commit()

            # 12. Persist to MongoDB Atlas Cloud
            try:
                from backend.app.services.mongodb_sync_service import StudentProfileMongoService
                StudentProfileMongoService.save_profile(student_id, {
                    "name": profile.name,
                    "target_role": student.target_role_name,
                    "career_fit_score": career_fit_score,
                    "total_gaps": len(gap_results["skill_gaps"]),
                    "total_recommendations": len(ranked_recommendations),
                    "top_recommendations": ranked_recommendations[:5],
                    "skill_gaps": gap_results["skill_gaps"][:10],
                    "last_analyzed_at": datetime.now(timezone.utc).isoformat()
                })
            except Exception as mongo_err:
                logger.warning(f"Failed to sync student intelligence to MongoDB Atlas: {mongo_err}")

            return {
                "student_id": student_id,
                "profile_version": state.profile_version,
                "industry_data_version": state.industry_data_version,
                "target_role": student.target_role_name,
                "career_fit_score": career_fit_score,
                "skill_gaps": gap_results,
                "recommendations": ranked_recommendations,
                "metrics": {
                    "candidate_jobs": candidate_count,
                    "eligible_jobs": eligible_count,
                    "ranked_jobs": ranked_count,
                    "duration_seconds": duration
                }
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Profile analysis failed for student {student_id}: {str(e)}", exc_info=True)
            
            # Record failure in state and run without destroying previous data
            duration = round(time.time() - start_time, 2)
            state.analysis_status = "FAILED"
            state.error_log = str(e)
            
            run.status = "FAILED"
            run.error_message = str(e)
            run.duration_seconds = duration
            
            self.db.commit()
            raise e

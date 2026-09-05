"""
Recommendation Ranking Engine (Stage 2):
Performs detailed ranking, scoring, diversity filtering, and explanation enrichment:
- Scores all eligible candidate jobs
- Sorts by composite match score and freshness
- Enforces company diversity constraints (maximum N jobs per company)
- Enriches recommendations with deterministic explanations
- Selects top N recommendations
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.job import Job
from backend.app.services.profile_intelligence.config import config
from backend.app.services.profile_intelligence.matching_engine import JobMatchingEngine, ScoredJobMatch
from backend.app.services.profile_intelligence.explanation_engine import ExplanationEngine
from backend.app.services.profile_intelligence.student_representation import StudentRepresentation

class RecommendationRankingEngine:
    def __init__(self, db: Session):
        self.db = db
        self.matching_engine = JobMatchingEngine(db)
        self.explanation_engine = ExplanationEngine()

    def rank_and_explain(
        self,
        eligible_jobs: List[Job],
        student: StudentRepresentation,
        top_n: int = config.DEFAULT_RECOMMENDATION_LIMIT
    ) -> List[Dict[str, Any]]:
        """
        Calculates match scores for all eligible jobs, applies diversity limits, and attaches explanations.
        """
        if not eligible_jobs:
            return []

        # 1. Score each eligible job
        scored_matches: List[ScoredJobMatch] = []
        for job in eligible_jobs:
            match = self.matching_engine.match_job(job, student)
            scored_matches.append(match)

        # 2. Sort by match_score descending, freshness_score descending
        scored_matches.sort(
            key=lambda m: (m.match_score, m.freshness_score, m.skill_score),
            reverse=True
        )

        # 3. Apply Company Diversity Constraints
        company_counts: Dict[str, int] = {}
        diverse_ranked: List[ScoredJobMatch] = []
        deferred_matches: List[ScoredJobMatch] = []

        for match in scored_matches:
            company = (match.job.company_name or "Unknown").strip().lower()
            current_c = company_counts.get(company, 0)
            if current_c < config.MAX_JOBS_PER_COMPANY:
                company_counts[company] = current_c + 1
                diverse_ranked.append(match)
            else:
                deferred_matches.append(match)

        # Fill remaining slots if diverse list is shorter than top_n
        if len(diverse_ranked) < top_n and deferred_matches:
            needed = top_n - len(diverse_ranked)
            diverse_ranked.extend(deferred_matches[:needed])

        # Slice top N
        final_top = diverse_ranked[:top_n]

        # 4. Attach deterministic explanations and ranks
        results: List[Dict[str, Any]] = []
        for rank_idx, match in enumerate(final_top, start=1):
            exp = self.explanation_engine.explain(match, student)
            item = {
                "rank": rank_idx,
                "job": match.job,
                "job_id": match.job.id,
                "title": match.job.title,
                "company_name": match.job.company_name,
                "location": match.job.location,
                "country": match.job.country,
                "remote": match.job.remote,
                "job_url": match.job.job_url,
                "salary_min": match.job.salary_min,
                "salary_max": match.job.salary_max,
                "currency": match.job.currency,
                "posted_at": match.job.posted_at,
                "match_score": match.match_score,
                "scores": {
                    "skill_score": match.skill_score,
                    "role_score": match.role_score,
                    "experience_score": match.experience_score,
                    "location_score": match.location_score,
                    "education_score": match.education_score,
                    "freshness_score": match.freshness_score,
                    "required_skill_score": match.required_skill_score,
                    "preferred_skill_score": match.preferred_skill_score,
                },
                "matched_skills": match.matched_skills,
                "partial_skills": match.partial_skills,
                "missing_required_skills": match.missing_required_skills,
                "missing_preferred_skills": match.missing_preferred_skills,
                "why_recommended": exp["why_recommended"],
                "explanation_breakdown": exp["explanation_breakdown"],
            }
            results.append(item)

        return results

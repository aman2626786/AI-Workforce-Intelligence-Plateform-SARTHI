"""
Explanation Engine:
Generates deterministic, template-based recommendation rationales:
- Bullet-point match evidence (skills, role, location, freshness, experience)
- Explicit required vs preferred skill breakdown
- Zero LLM dependency or ungrounded assertions
"""

from typing import Dict, Any, List
from backend.app.services.profile_intelligence.matching_engine import ScoredJobMatch
from backend.app.services.profile_intelligence.student_representation import StudentRepresentation

class ExplanationEngine:
    def __init__(self):
        pass

    def explain(self, match: ScoredJobMatch, student: StudentRepresentation) -> Dict[str, Any]:
        """
        Generates deterministic summary and breakdown points for a scored job match.
        """
        points: List[str] = []

        # 1. Skill Match Explanation
        matched_names = [s["canonical_name"] for s in match.matched_skills]
        partial_names = [s["canonical_name"] for s in match.partial_skills]
        missing_req_names = [s["canonical_name"] for s in match.missing_required_skills]
        missing_pref_names = [s["canonical_name"] for s in match.missing_preferred_skills]

        total_req_count = len(matched_names) + len(missing_req_names)
        if total_req_count > 0:
            points.append(
                f"Matched {len(matched_names)} of {total_req_count} key required skills"
                + (f" ({', '.join(matched_names[:4])})" if matched_names else "")
            )
        elif matched_names:
            points.append(f"Matched strong profile skills: {', '.join(matched_names[:4])}")

        if partial_names:
            points.append(f"Transferable knowledge via related skills: {', '.join(partial_names[:3])}")

        # 2. Role Match Explanation
        if match.role_score >= 80.0:
            points.append(f"Target role matches: {student.target_role_name}")
        elif match.role_score >= 60.0:
            points.append(f"Adjacent role in your career track: {match.job.canonical_role}")

        # 3. Location / Remote Explanation
        if match.job.remote:
            points.append("Fully remote position matching remote preferences")
        elif match.location_score >= 90.0:
            points.append(f"Location aligns with preference ({match.job.location})")

        # 4. Experience Explanation
        if student.is_fresher and match.experience_score >= 80.0:
            points.append("Fresher and entry-level friendly position")

        # 5. Missing skills note
        if missing_req_names:
            points.append(f"Skill to acquire: {', '.join(missing_req_names[:2])}")
        elif missing_pref_names:
            points.append(f"Bonus skill: {', '.join(missing_pref_names[:2])}")

        # Generate single-line summary
        headline_parts = [f"{int(match.match_score)}% Match"]
        if matched_names:
            headline_parts.append(f"{len(matched_names)} skills matched")
        if match.job.remote:
            headline_parts.append("Remote")
        elif match.job.location:
            headline_parts.append(match.job.location.split(",")[0])

        if student.is_fresher and match.experience_score >= 80.0:
            headline_parts.append("Fresher-friendly")

        why_recommended = " • ".join(headline_parts)

        return {
            "why_recommended": why_recommended,
            "explanation_breakdown": points
        }

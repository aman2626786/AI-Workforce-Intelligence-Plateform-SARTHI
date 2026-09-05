"""
Evaluation Benchmark Runner for Profile Intelligence Agent:
Tests deterministic recommendation matching, skill gap precision, ranking metrics (NDCG@10, Precision@5/10),
and role classification accuracy against the ground truth evaluation dataset.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# Add parent directory to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.core.database import SessionLocal
from backend.app.models.job import Job, JobSkill
from backend.app.models.skill import Skill
from backend.app.models.role import Role
from backend.app.services.profile_intelligence.student_representation import StudentRepresentation
from backend.app.services.profile_intelligence.matching_engine import JobMatchingEngine
from backend.app.services.profile_intelligence.ranking_engine import RecommendationRankingEngine
from backend.app.services.profile_intelligence.evaluator import RecommendationEvaluator

def run_evaluation():
    db = SessionLocal()
    evaluator = RecommendationEvaluator()
    matching_engine = JobMatchingEngine(db)

    eval_file = root_dir / "backend" / "app" / "data" / "recommendation_eval_dataset.json"
    if not eval_file.exists():
        print(f"[Error] Evaluation dataset not found at {eval_file}")
        return

    with open(eval_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print("=" * 70)
    print("PROFILE INTELLIGENCE AGENT - RECOMMENDATION EVALUATION BENCHMARK")
    print("=" * 70)

    total_scenarios = 0
    passed_scenarios = 0

    for profile_data in data.get("test_profiles", []):
        print(f"\nEvaluating Profile: {profile_data['name']} (Target: {profile_data['target_role']})")
        print(f"Skills: {[s['canonical_name'] for s in profile_data['skills']]}")

        # Build mock student representation
        skills_dict = {
            s["skill_id"]: {
                "skill_id": s["skill_id"],
                "canonical_name": s["canonical_name"],
                "confidence": s["confidence"],
                "status": s["status"],
                "source": "evaluation"
            }
            for s in profile_data["skills"]
        }

        # Query canonical target role
        target_role_rec = db.query(Role).filter(Role.name.ilike(profile_data["target_role"])).first()
        target_role_id = target_role_rec.id if target_role_rec else "ROL_DATA_ANALYST"
        related_role_ids = [
            r.id for r in db.query(Role).filter(Role.family_id == target_role_rec.family_id, Role.id != target_role_id).all()
        ] if target_role_rec else []

        student = StudentRepresentation(
            student_id=profile_data["id"],
            name=profile_data["name"],
            target_role_id=target_role_id,
            target_role_name=profile_data["target_role"],
            role_family_id=target_role_rec.family_id if target_role_rec else "FAM_DATA",
            related_role_ids=related_role_ids,
            skills=skills_dict,
            experience_years=profile_data["experience_years"],
            is_fresher=profile_data["is_fresher"],
            education_level=profile_data["education_level"],
            degree=profile_data["degree"],
            city=profile_data["city"],
            preferred_location=profile_data["preferred_location"],
            remote_preference=True,
            profile_version=1
        )

        mock_jobs = []
        ground_truth_map = {}

        for scenario in profile_data.get("test_scenarios", []):
            total_scenarios += 1
            j_data = scenario["job"]
            
            # Create transient Job object
            job = Job(
                id=j_data["id"],
                source="eval",
                source_job_id=j_data["id"],
                canonical_role=j_data["canonical_role"],
                role_id=j_data["role_id"],
                title=j_data["title"],
                company_name=j_data["company_name"],
                location=j_data["location"],
                country=j_data["country"],
                description=f"{j_data['title']} at {j_data['company_name']}",
                remote=j_data["remote"],
                status=j_data["status"],
                job_url="https://example.com/jobs/" + j_data["id"],
                posted_at=datetime.now(timezone.utc),
                content_hash=j_data["id"]
            )

            # Attach mock JobSkills
            job.skills = []
            for sk_item in j_data["skills"]:
                skill_obj = db.query(Skill).filter(Skill.id == sk_item["skill_id"]).first()
                if not skill_obj:
                    skill_obj = Skill(id=sk_item["skill_id"], canonical_name=sk_item["canonical_name"], category="General")
                js = JobSkill(
                    job_id=job.id,
                    skill_id=sk_item["skill_id"],
                    requirement_type=sk_item["requirement_type"],
                    skill=skill_obj
                )
                job.skills.append(js)

            mock_jobs.append(job)
            ground_truth_map[job.id] = scenario["expected_relevance"]

            # Match and check assertions
            match = matching_engine.match_job(job, student)
            score = match.match_score
            min_exp = scenario.get("expected_min_score", 0.0)
            max_exp = scenario.get("expected_max_score", 100.0)

            status_str = "PASS" if min_exp <= score <= max_exp else "FAIL"
            if status_str == "PASS":
                passed_scenarios += 1

            print(f"  [{status_str}] Scenario: {scenario['scenario_name']}")
            print(f"         Match Score: {score}% (Expected range: [{min_exp}, {max_exp}])")
            print(f"         Skills matched: {[s['canonical_name'] for s in match.matched_skills]}")
            print(f"         Scores: Skill={match.skill_score}%, Role={match.role_score}%, Exp={match.experience_score}%")

        # Rank all scenario jobs
        ranking_engine = RecommendationRankingEngine(db)
        ranked = ranking_engine.rank_and_explain(mock_jobs, student, top_n=10)

        # Run evaluator metrics
        metrics = evaluator.evaluate_recommendations(ranked, ground_truth_map)
        print("\nRanking Quality Metrics:")
        print(f"  Precision@5:     {metrics['precision@5']:.4f}")
        print(f"  Precision@10:    {metrics['precision@10']:.4f}")
        print(f"  Recall@10:       {metrics['recall@10']:.4f}")
        print(f"  NDCG@10:         {metrics['ndcg@10']:.4f}")
        print(f"  Role Accuracy:   {metrics['role_accuracy@10']:.4f}")

    print("\n" + "=" * 70)
    pass_pct = (passed_scenarios / max(1, total_scenarios)) * 100
    print(f"OVERALL EVALUATION RESULT: {passed_scenarios}/{total_scenarios} SCENARIOS PASSED ({pass_pct:.1f}%)")
    print("=" * 70)

    db.close()

if __name__ == "__main__":
    run_evaluation()

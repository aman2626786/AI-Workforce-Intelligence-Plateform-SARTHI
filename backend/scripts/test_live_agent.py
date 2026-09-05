import sys
from pathlib import Path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.core.database import SessionLocal, engine, Base
import backend.app.models
from backend.app.models import StudentProfile
from backend.app.services.profile_intelligence.agent import ProfileIntelligenceAgent

Base.metadata.create_all(bind=engine)

def test_live_agent():
    db = SessionLocal()
    profiles = db.query(StudentProfile).all()
    agent = ProfileIntelligenceAgent(db)

    for p in profiles:
        print(f"\n==================================================")
        print(f"Testing Student: {p.name} (Target: {p.target_role})")
        print(f"==================================================")
        result = agent.analyze_profile(p.id, trigger_event="SMOKE_TEST", top_n=5)
        print(f"Career Fit Score: {result['career_fit_score']}%")
        print(f"Total Skill Gaps: {len(result['skill_gaps']['skill_gaps'])}")
        print(f"Top Missing Demanded Skills:")
        for g in result['skill_gaps']['top_missing_skills'][:5]:
            print(f"  - {g['canonical_name']} (Priority: {g['priority_level']}, Demand: {g['demand_percentage']}%, Trend: {g['trend_label']})")
        print(f"\nTop 5 Personalized Job Recommendations:")
        for r in result['recommendations']:
            print(f"  #{r['rank']} [{r['match_score']}% Match] {r['title']} @ {r['company_name']}")
            print(f"     Why: {r['why_recommended']}")
            print(f"     Breakdown: {r['explanation_breakdown'][:2]}")
            print(f"     Scores: Skill={r['scores']['skill_score']}%, Role={r['scores']['role_score']}%, Freshness={r['scores']['freshness_score']}%")

    db.close()

if __name__ == "__main__":
    test_live_agent()

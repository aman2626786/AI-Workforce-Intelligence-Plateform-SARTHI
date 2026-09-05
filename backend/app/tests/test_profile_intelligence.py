"""
Unit and Integration Test Suite for Profile Intelligence Agent:
Tests all deterministic recommendation and skill-gap capabilities:
1. Normalization & Student Representation
2. Target Role Taxonomy Determination
3. Personalized Skill Gap Analysis & Priority Scoring
4. Two-Stage Candidate Retrieval & Hard Eligibility Filtering
5. Multi-Factor Scoring (Skill 50%, Role 20%, Exp 10%, Loc 10%, Edu 5%, Freshness 5%)
6. Related Skill Ontology Compatibility
7. Recommendation Diversity Rules (Company limit)
8. Deterministic Template Rationales
9. Lifecycle Event Triggers & Profile Versioning
10. Evaluation Metrics (Precision@K, Recall@K, NDCG@10)
"""

import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile, Education, Experience, Project
from backend.app.models.skill import Skill, StudentSkill, SkillRelationship
from backend.app.models.role import RoleFamily, Role
from backend.app.models.job import Job, JobSkill
from backend.app.models.intelligence import RoleSkillDemand, SkillTrend
from backend.app.models.recommendation import (
    ProfileIntelligenceState,
    ProfileSkillGap,
    ProfileRecommendation,
    RecommendationScore,
    RecommendationRun,
)
from backend.app.services.profile_intelligence.config import config
from backend.app.services.profile_intelligence.student_representation import StudentRepresentationBuilder, StudentRepresentation
from backend.app.services.profile_intelligence.skill_gap_engine import SkillGapEngine
from backend.app.services.profile_intelligence.candidate_retriever import CandidateRetriever
from backend.app.services.profile_intelligence.eligibility_filter import EligibilityFilter
from backend.app.services.profile_intelligence.matching_engine import JobMatchingEngine
from backend.app.services.profile_intelligence.ranking_engine import RecommendationRankingEngine
from backend.app.services.profile_intelligence.explanation_engine import ExplanationEngine
from backend.app.services.profile_intelligence.agent import ProfileIntelligenceAgent
from backend.app.services.profile_intelligence.triggers import ProfileIntelligenceTriggers
from backend.app.services.profile_intelligence.evaluator import RecommendationEvaluator

# Test DB fixture
@pytest.fixture(scope="function")
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # Seed Role Families & Roles
    fam_data = RoleFamily(id="FAM_DATA", name="Data & Analytics", code="DATA")
    fam_swe = RoleFamily(id="FAM_SWE", name="Software Engineering", code="SWE")
    db.add_all([fam_data, fam_swe])

    role_da = Role(id="ROL_DATA_ANALYST", family_id="FAM_DATA", name="Data Analyst", code="DATA_ANALYST", aliases=["data analyst", "junior data analyst"])
    role_bi = Role(id="ROL_BI_ANALYST", family_id="FAM_DATA", name="BI Analyst", code="BI_ANALYST", aliases=["bi analyst", "power bi analyst"])
    role_swe = Role(id="ROL_SOFTWARE_ENGINEER", family_id="FAM_SWE", name="Software Engineer", code="SWE", aliases=["software developer", "backend engineer"])
    db.add_all([role_da, role_bi, role_swe])

    # Seed Canonical Skills
    s_py = Skill(id="SKL_PYTHON", canonical_name="Python", category="Programming Languages", aliases=["python", "python3"])
    s_sql = Skill(id="SKL_SQL", canonical_name="SQL", category="Databases & Storage", aliases=["sql", "structured query language"])
    s_psql = Skill(id="SKL_POSTGRESQL", canonical_name="PostgreSQL", category="Databases & Storage", aliases=["postgres", "postgresql"])
    s_pbi = Skill(id="SKL_POWER_BI", canonical_name="Power BI", category="Data & Analytics", aliases=["powerbi", "power bi"])
    s_aws = Skill(id="SKL_AWS", canonical_name="AWS", category="Cloud & DevOps", aliases=["aws", "amazon web services"])
    s_stats = Skill(id="SKL_STATISTICS", canonical_name="Statistics", category="Data & Analytics", aliases=["statistics", "statistical analysis"])
    s_ml = Skill(id="SKL_ML", canonical_name="Machine Learning", category="AI & Machine Learning", aliases=["ml", "machine learning"])
    db.add_all([s_py, s_sql, s_psql, s_pbi, s_aws, s_stats, s_ml])

    # Seed Skill Relationship (PostgreSQL -> SQL)
    rel = SkillRelationship(source_skill_id="SKL_POSTGRESQL", target_skill_id="SKL_SQL", relation_type="CHILD", confidence=1.0)
    db.add(rel)

    # Seed Role Skill Demands for Data Analyst
    dem_sql = RoleSkillDemand(role_id="ROL_DATA_ANALYST", skill_id="SKL_SQL", job_count=82, total_jobs=100, demand_percentage=82.0, required_count=70, preferred_count=12, importance_score=1.5)
    dem_py = RoleSkillDemand(role_id="ROL_DATA_ANALYST", skill_id="SKL_PYTHON", job_count=71, total_jobs=100, demand_percentage=71.0, required_count=60, preferred_count=11, importance_score=1.3)
    dem_pbi = RoleSkillDemand(role_id="ROL_DATA_ANALYST", skill_id="SKL_POWER_BI", job_count=54, total_jobs=100, demand_percentage=54.0, required_count=40, preferred_count=14, importance_score=1.0)
    dem_stats = RoleSkillDemand(role_id="ROL_DATA_ANALYST", skill_id="SKL_STATISTICS", job_count=42, total_jobs=100, demand_percentage=42.0, required_count=35, preferred_count=7, importance_score=0.9)
    dem_aws = RoleSkillDemand(role_id="ROL_DATA_ANALYST", skill_id="SKL_AWS", job_count=21, total_jobs=100, demand_percentage=21.0, required_count=5, preferred_count=16, importance_score=0.4)
    dem_ml = RoleSkillDemand(role_id="ROL_DATA_ANALYST", skill_id="SKL_ML", job_count=18, total_jobs=100, demand_percentage=18.0, required_count=4, preferred_count=14, importance_score=0.3)
    db.add_all([dem_sql, dem_py, dem_pbi, dem_stats, dem_aws, dem_ml])

    # Seed Trends
    tr_stats = SkillTrend(role_id="ROL_DATA_ANALYST", skill_id="SKL_STATISTICS", trend_label="RISING", is_emerging=False)
    tr_ml = SkillTrend(role_id="ROL_DATA_ANALYST", skill_id="SKL_ML", trend_label="RISING_FAST", is_emerging=True)
    tr_aws = SkillTrend(role_id="ROL_DATA_ANALYST", skill_id="SKL_AWS", trend_label="STABLE", is_emerging=False)
    db.add_all([tr_stats, tr_ml, tr_aws])

    # Seed Student User and Profile
    user = User(id="USR_001", email="student@example.com", password_hash="pw")
    db.add(user)

    profile = StudentProfile(
        id="STU_001",
        user_id="USR_001",
        name="Aman Sharma",
        city="Jaipur",
        preferred_location="Jaipur / Remote",
        target_role="Data Analyst",
        education_level="B.Tech",
        degree="Computer Science",
        graduation_year=datetime.now(timezone.utc).year
    )
    db.add(profile)

    # Attach Student Skills (Python, PostgreSQL, Power BI)
    st_py = StudentSkill(student_id="STU_001", skill_id="SKL_PYTHON", source="resume", verification_status="verified", confidence=1.0)
    st_psql = StudentSkill(student_id="STU_001", skill_id="SKL_POSTGRESQL", source="resume", verification_status="unverified", confidence=0.90)
    st_pbi = StudentSkill(student_id="STU_001", skill_id="SKL_POWER_BI", source="project", verification_status="unverified", confidence=0.85)
    db.add_all([st_py, st_psql, st_pbi])

    db.commit()

    yield db
    db.close()


def test_student_representation_builder(test_db):
    builder = StudentRepresentationBuilder(test_db)
    student = builder.build("STU_001")

    assert student is not None
    assert student.name == "Aman Sharma"
    assert student.target_role_id == "ROL_DATA_ANALYST"
    assert student.target_role_name == "Data Analyst"
    assert student.role_family_id == "FAM_DATA"
    assert "ROL_BI_ANALYST" in student.related_role_ids
    assert student.is_fresher is True
    assert "SKL_PYTHON" in student.skill_ids
    assert "SKL_POSTGRESQL" in student.skill_ids


def test_skill_gap_analysis_and_priority(test_db):
    builder = StudentRepresentationBuilder(test_db)
    student = builder.build("STU_001")

    gap_engine = SkillGapEngine(test_db)
    results = gap_engine.analyze_gaps(student)

    assert results["career_fit_score"] > 0.0
    gaps_by_id = {g["skill_id"]: g for g in results["skill_gaps"]}

    # Python is exact match
    assert gaps_by_id["SKL_PYTHON"]["status"] == "MATCHED"
    assert gaps_by_id["SKL_PYTHON"]["priority_score"] == 0.0

    # SQL is partial match via PostgreSQL child relation
    assert gaps_by_id["SKL_SQL"]["status"] == "PARTIAL"
    assert "Related to" in gaps_by_id["SKL_SQL"]["matching_evidence"]

    # Statistics and AWS are missing
    assert gaps_by_id["SKL_STATISTICS"]["status"] == "MISSING"
    assert gaps_by_id["SKL_AWS"]["status"] == "MISSING"

    # Statistics (Required, 42% demand, Rising trend) should have higher priority score than AWS (Preferred, 21% demand, Stable)
    assert gaps_by_id["SKL_STATISTICS"]["priority_score"] > gaps_by_id["SKL_AWS"]["priority_score"]
    assert gaps_by_id["SKL_STATISTICS"]["priority_level"] in ("HIGH", "MEDIUM")


def test_job_matching_and_scoring(test_db):
    builder = StudentRepresentationBuilder(test_db)
    student = builder.build("STU_001")

    # Create High-fit Data Analyst job
    job_high = Job(
        id="JOB_HIGH",
        source="eval",
        source_job_id="J1",
        canonical_role="Data Analyst",
        role_id="ROL_DATA_ANALYST",
        title="Junior Data Analyst",
        company_name="Analytics Inc",
        location="Jaipur",
        country="IN",
        remote=False,
        description="Data analyst role with SQL and Python requirements",
        status="ACTIVE",
        job_url="https://example.com/j1",
        posted_at=datetime.now(timezone.utc),
        content_hash="H1"
    )
    test_db.add(job_high)
    js1 = JobSkill(job_id="JOB_HIGH", skill_id="SKL_PYTHON", requirement_type="REQUIRED")
    js2 = JobSkill(job_id="JOB_HIGH", skill_id="SKL_SQL", requirement_type="REQUIRED")
    js3 = JobSkill(job_id="JOB_HIGH", skill_id="SKL_POWER_BI", requirement_type="REQUIRED")
    test_db.add_all([js1, js2, js3])

    # Create Unrelated Software Engineer job
    job_low = Job(
        id="JOB_LOW",
        source="eval",
        source_job_id="J2",
        canonical_role="Software Engineer",
        role_id="ROL_SOFTWARE_ENGINEER",
        title="Senior Backend Systems Engineer",
        company_name="CloudNet",
        location="Mumbai",
        country="IN",
        remote=False,
        description="Senior backend software engineering position",
        status="ACTIVE",
        job_url="https://example.com/j2",
        posted_at=datetime.now(timezone.utc),
        content_hash="H2"
    )
    test_db.add(job_low)
    js4 = JobSkill(job_id="JOB_LOW", skill_id="SKL_AWS", requirement_type="REQUIRED")
    test_db.add(js4)
    test_db.commit()

    matching_engine = JobMatchingEngine(test_db)
    match_high = matching_engine.match_job(job_high, student)
    match_low = matching_engine.match_job(job_low, student)

    assert match_high.match_score >= 80.0
    assert match_low.match_score <= 40.0
    assert match_high.role_score == 100.0
    assert match_high.location_score == 100.0


def test_eligibility_filter(test_db):
    builder = StudentRepresentationBuilder(test_db)
    student = builder.build("STU_001")

    # Inactive job
    j_inactive = Job(id="J_INACT", source="t", source_job_id="ji", canonical_role="Data Analyst", title="Data Analyst", company_name="C1", country="IN", description="Inactive job", status="EXPIRED", job_url="http://x", content_hash="h1")
    
    # Senior job with 5+ yrs requirement for fresher student
    j_senior = Job(id="J_SENIOR", source="t", source_job_id="js", canonical_role="Data Analyst", title="Senior Lead Architect (7+ years)", company_name="C2", country="IN", status="ACTIVE", description="Requires 7+ years of industry experience", job_url="http://x", content_hash="h2")

    # Active valid entry level job
    j_valid = Job(id="J_VALID", source="t", source_job_id="jv", canonical_role="Data Analyst", title="Junior Data Analyst", company_name="C3", country="IN", status="ACTIVE", description="Entry level data analyst position", job_url="http://x", content_hash="h3")

    test_db.add_all([j_inactive, j_senior, j_valid])
    test_db.commit()

    filter_engine = EligibilityFilter()
    eligible, excluded = filter_engine.filter_eligible([j_inactive, j_senior, j_valid], student)

    eligible_ids = [j.id for j in eligible]
    assert "J_VALID" in eligible_ids
    assert "J_INACT" not in eligible_ids
    assert "J_SENIOR" not in eligible_ids


def test_ranking_and_company_diversity(test_db):
    builder = StudentRepresentationBuilder(test_db)
    student = builder.build("STU_001")

    # Create 6 jobs from MegaCorp, 4 jobs from StarCorp, 4 jobs from NovaCorp
    jobs = []
    for i in range(6):
        j1 = Job(
            id=f"JOB_SAME_CO_{i}",
            source="test",
            source_job_id=f"SC_{i}",
            canonical_role="Data Analyst",
            role_id="ROL_DATA_ANALYST",
            title=f"Data Analyst Role {i}",
            company_name="MegaCorp",
            location="Jaipur",
            country="IN",
            remote=True,
            description=f"Data Analyst description {i}",
            status="ACTIVE",
            job_url=f"https://megacorp.com/{i}",
            posted_at=datetime.now(timezone.utc),
            content_hash=f"HASH_SC_{i}"
        )
        jobs.append(j1)
        test_db.add(j1)

    for i in range(4):
        j2 = Job(
            id=f"JOB_OTHER_CO_{i}",
            source="test",
            source_job_id=f"OC_{i}",
            canonical_role="Data Analyst",
            role_id="ROL_DATA_ANALYST",
            title=f"Data Analyst Role Star {i}",
            company_name="StarCorp",
            location="Jaipur",
            country="IN",
            remote=True,
            description=f"StarCorp Data Analyst description {i}",
            status="ACTIVE",
            job_url=f"https://starcorp.com/{i}",
            posted_at=datetime.now(timezone.utc),
            content_hash=f"HASH_OC_{i}"
        )
        j3 = Job(
            id=f"JOB_NOVA_CO_{i}",
            source="test",
            source_job_id=f"NC_{i}",
            canonical_role="Data Analyst",
            role_id="ROL_DATA_ANALYST",
            title=f"Data Analyst Role Nova {i}",
            company_name="NovaCorp",
            location="Jaipur",
            country="IN",
            remote=True,
            description=f"NovaCorp Data Analyst description {i}",
            status="ACTIVE",
            job_url=f"https://novacorp.com/{i}",
            posted_at=datetime.now(timezone.utc),
            content_hash=f"HASH_NC_{i}"
        )
        jobs.extend([j2, j3])
        test_db.add_all([j2, j3])

    test_db.commit()

    ranker = RecommendationRankingEngine(test_db)
    ranked = ranker.rank_and_explain(jobs, student, top_n=10)

    # Count jobs from MegaCorp in top results (should be strictly capped at config.MAX_JOBS_PER_COMPANY = 4)
    megacorp_count = sum(1 for r in ranked if r["company_name"] == "MegaCorp")
    assert megacorp_count <= config.MAX_JOBS_PER_COMPANY
    assert len(ranked) == 10


def test_explanation_generation(test_db):
    builder = StudentRepresentationBuilder(test_db)
    student = builder.build("STU_001")

    job = Job(
        id="JOB_EXP_TEST",
        source="test",
        source_job_id="ET1",
        canonical_role="Data Analyst",
        role_id="ROL_DATA_ANALYST",
        title="Junior Data Analyst",
        company_name="FinData",
        location="Jaipur",
        country="IN",
        remote=True,
        description="Entry level data analyst role",
        status="ACTIVE",
        job_url="https://findata.com/1",
        posted_at=datetime.now(timezone.utc),
        content_hash="HASH_ET1"
    )
    test_db.add(job)
    js1 = JobSkill(job_id="JOB_EXP_TEST", skill_id="SKL_PYTHON", requirement_type="REQUIRED")
    test_db.add(js1)
    test_db.commit()

    matching_engine = JobMatchingEngine(test_db)
    match = matching_engine.match_job(job, student)
    explainer = ExplanationEngine()
    exp = explainer.explain(match, student)

    assert "why_recommended" in exp
    assert "% Match" in exp["why_recommended"]
    assert len(exp["explanation_breakdown"]) > 0


def test_end_to_end_agent_execution_and_triggers(test_db):
    agent = ProfileIntelligenceAgent(test_db)
    result = agent.analyze_profile("STU_001", trigger_event="UNIT_TEST")

    assert result["student_id"] == "STU_001"
    assert result["career_fit_score"] > 0.0
    assert len(result["skill_gaps"]["skill_gaps"]) > 0

    # Verify state record created
    state = test_db.query(ProfileIntelligenceState).filter(ProfileIntelligenceState.student_id == "STU_001").first()
    assert state is not None
    assert state.analysis_status == "COMPLETED"
    assert state.profile_version == 1

    # Verify audit run logged
    run = test_db.query(RecommendationRun).filter(RecommendationRun.student_id == "STU_001").first()
    assert run is not None
    assert run.status == "COMPLETED"

    # Test profile update trigger increments version
    triggers = ProfileIntelligenceTriggers(test_db)
    trigger_res = triggers.trigger_profile_updated("STU_001")
    assert trigger_res["profile_version"] == 2


def test_recommendation_evaluator_metrics():
    evaluator = RecommendationEvaluator()

    recommended = ["J1", "J2", "J3", "J4", "J5"]
    relevant = {"J1", "J2", "J6"}

    p5 = evaluator.calculate_precision_at_k(recommended, relevant, 5)
    r5 = evaluator.calculate_recall_at_k(recommended, relevant, 5)
    ndcg = evaluator.calculate_ndcg_at_k([1.0, 1.0, 0.0, 0.0, 0.0], [1.0, 1.0, 1.0, 0.0, 0.0], 5)

    assert p5 == 0.4  # 2 hits out of 5
    assert round(r5, 2) == 0.67  # 2 hits out of 3
    assert ndcg >= 0.75  # 2 relevant items in top 2 gives high DCG

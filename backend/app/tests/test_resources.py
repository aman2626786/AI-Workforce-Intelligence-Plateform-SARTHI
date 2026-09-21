import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.resource import Resource, ResourceLike, SavedResource, ResourceView
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.skill import StudentSkill, Skill
from backend.app.services.resource_recommender import resource_recommender

client = TestClient(app)

def test_list_resources_public():
    res = client.get("/api/resources")
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "resources" in data
    assert data["total"] >= 50
    assert len(data["resources"]) > 0

def test_filter_by_type():
    res = client.get("/api/resources?type=RESEARCH_PAPER")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 10
    for r in data["resources"]:
        assert r["resource_type"] == "RESEARCH_PAPER"

def test_filter_by_category():
    res = client.get("/api/resources?category=Career")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 10
    for r in data["resources"]:
        assert r["category"] == "Career"

def test_search_resources():
    res = client.get("/api/resources?q=Python")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    # At least one result should mention Python
    found = any("python" in r["title"].lower() or "python" in r["short_description"].lower() for r in data["resources"])
    assert found

def test_trending_resources():
    res = client.get("/api/resources/trending?limit=5")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) <= 5

def test_categories_endpoint():
    res = client.get("/api/resources/categories")
    assert res.status_code == 200
    cats = res.json()
    assert len(cats) >= 4
    names = [c["name"] for c in cats]
    assert "Technology" in names
    assert "Research" in names
    assert "Career" in names
    assert "Learning" in names

def test_guest_three_resource_limit():
    db = SessionLocal()
    try:
        # Create a fresh test session
        test_session = f"test_guest_session_{import_time()}"

        # Clean any prior views for this session
        db.query(ResourceView).filter(ResourceView.session_id == test_session).delete()
        db.commit()

        # Get 4 different resource slugs
        resources = db.query(Resource).filter(Resource.status == "PUBLISHED").limit(5).all()
        assert len(resources) >= 4

        # 1st view -> success
        res1 = client.get(f"/api/resources/{resources[0].slug}", headers={"X-Anonymous-Session-Id": test_session})
        assert res1.status_code == 200

        # 2nd view -> success
        res2 = client.get(f"/api/resources/{resources[1].slug}", headers={"X-Anonymous-Session-Id": test_session})
        assert res2.status_code == 200

        # 3rd view -> success
        res3 = client.get(f"/api/resources/{resources[2].slug}", headers={"X-Anonymous-Session-Id": test_session})
        assert res3.status_code == 200

        # Check guest status
        status_res = client.get("/api/resources/guest-status", headers={"X-Anonymous-Session-Id": test_session})
        assert status_res.status_code == 200
        assert status_res.json()["views_count"] == 3
        assert status_res.json()["has_reached_limit"] is True

        # 4th view -> BLOCKED by Guest Limit Gate
        res4 = client.get(f"/api/resources/{resources[3].slug}", headers={"X-Anonymous-Session-Id": test_session})
        assert res4.status_code == 403
        assert "GUEST_LIMIT_REACHED" in res4.json()["detail"]
    finally:
        db.close()

def test_deterministic_scoring_calculation():
    db = SessionLocal()
    try:
        res = db.query(Resource).filter(Resource.skills != None).first()
        assert res is not None

        # Matching skills
        student_skills = ["Python", "Machine Learning", "SQL"]
        score, reasons, gap = resource_recommender.score_resource_for_student(
            resource=res,
            student_skills=student_skills,
            target_role="Machine Learning Engineer",
            skill_gaps=[{"skill_name": "SQL", "priority": "HIGH"}]
        )
        assert isinstance(score, float)
        assert 15.0 <= score <= 99.0
        assert isinstance(reasons, list)
    finally:
        db.close()

def test_admin_analytics_endpoint():
    res = client.get("/api/admin/resources/analytics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_resources"] >= 50
    assert data["published_count"] >= 50
    assert "by_type" in data
    assert "by_category" in data

def import_time():
    import time
    return int(time.time() * 1000)

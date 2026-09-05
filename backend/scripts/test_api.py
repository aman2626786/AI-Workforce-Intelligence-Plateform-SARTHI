import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import httpx
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)
SAMPLE_DIR = Path(__file__).resolve().parent.parent / "sample_resumes"

def test_full_api_flow():
    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    print("[PASS] /health passed")

    # 2. Register
    reg_payload = {
        "name": "Yogesh Kumar",
        "email": "yogesh.sih2026@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    if res.status_code == 400 and "already registered" in res.text:
        # Try login
        res = client.post("/api/auth/login", json={
            "email": reg_payload["email"],
            "password": reg_payload["password"]
        })
    assert res.status_code in [200, 201]
    token_data = res.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Auth Registration/Login passed, token received")

    # 3. Save Basic Profile (Step 2)
    profile_payload = {
        "city": "Jaipur",
        "education_level": "Undergraduate",
        "degree": "B.Tech",
        "branch": "Computer Science and Engineering",
        "college": "National Institute of Technology",
        "graduation_year": 2026,
        "target_role": "Data Analyst",
        "preferred_location": "Bengaluru"
    }
    res = client.put("/api/profile", json=profile_payload, headers=headers)
    assert res.status_code == 200
    print("[PASS] PUT /api/profile basic profile updated")

    # 4. Upload Resume (Step 3) - Uploading conflicting resume (Resume City = Bengaluru vs Profile City = Jaipur)
    pdf_path = SAMPLE_DIR / "conflicting_resume.pdf"
    with open(pdf_path, "rb") as f:
        res = client.post(
            "/api/resume/upload",
            files={"file": ("conflicting_resume.pdf", f, "application/pdf")},
            headers=headers
        )
    assert res.status_code == 200
    upload_data = res.json()
    resume_id = upload_data["id"]
    print(f"[PASS] POST /api/resume/upload passed, resume_id: {resume_id}")

    # 5. Analyze Resume (Step 4)
    res = client.post(f"/api/resume/{resume_id}/analyze", headers=headers)
    assert res.status_code == 200
    analysis = res.json()
    print("[PASS] POST /api/resume/{id}/analyze passed")
    print(f"  - Sections detected: {analysis['sections_detected']}")
    print(f"  - Skills extracted: {len(analysis['skills'])} skills")
    print(f"  - Conflicts flagged: {len(analysis['conflicts'])}")

    # Verify conflict was correctly caught: User City "Jaipur" vs Resume City "Bengaluru"
    assert len(analysis["conflicts"]) == 1
    assert analysis["conflicts"][0]["field_name"] == "Current City"
    assert analysis["conflicts"][0]["user_value"] == "Jaipur"
    assert analysis["conflicts"][0]["resume_value"] == "Bengaluru"
    print("[PASS] Conflict Detection accurately preserved User City 'Jaipur' over Resume City 'Bengaluru'!")

    # 6. Confirm & Persist Profile (Step 5 -> 6)
    confirm_payload = {
        "personal_info": analysis["personal_info"],
        "education": analysis["education"],
        "experience": analysis["experience"],
        "projects": analysis["projects"],
        "certifications": analysis["certifications"],
        "skills": analysis["skills"],
        "resolved_conflicts": analysis["conflicts"]
    }
    res = client.post(f"/api/resume/{resume_id}/confirm", json=confirm_payload, headers=headers)
    assert res.status_code == 200
    print("[PASS] POST /api/resume/{id}/confirm passed, profile & skills saved to DB")

    # 7. Check Student Skills stored
    res = client.get("/api/student/skills", headers=headers)
    assert res.status_code == 200
    student_skills = res.json()
    assert len(student_skills) >= 5
    print(f"[PASS] GET /api/student/skills retrieved {len(student_skills)} confirmed skills with evidence")

    print("\n========================================================")
    print("SUCCESS: ALL END-TO-END BACKEND API PIPELINE TESTS PASSED 100%!")
    print("========================================================")

if __name__ == "__main__":
    test_full_api_flow()

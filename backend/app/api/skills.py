from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.models.skill import Skill, StudentSkill, SkillEvidence
from backend.app.schemas.skills import SkillMasterResponse, StudentSkillResponse, SkillEvidenceSchema

router = APIRouter(tags=["Skills"])

@router.get("/skills", response_model=List[SkillMasterResponse])
def get_all_canonical_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).order_by(Skill.category, Skill.canonical_name).all()
    return skills

@router.get("/student/skills", response_model=List[StudentSkillResponse])
def get_student_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    student_skills = db.query(StudentSkill).filter(StudentSkill.student_id == profile.id).all()
    results = []

    for ss in student_skills:
        evidence_items = []
        for ev in ss.evidence:
            evidence_items.append(SkillEvidenceSchema(
                source_section=ev.source_section,
                original_text=ev.original_text,
                evidence_text=ev.evidence_text,
                confidence=ev.confidence or 1.0
            ))

        results.append(StudentSkillResponse(
            id=ss.id,
            skill_id=ss.skill_id,
            canonical_name=ss.skill.canonical_name if ss.skill else "Unknown",
            category=ss.skill.category if ss.skill else "General",
            source=ss.source or "resume",
            verification_status=ss.verification_status or "unverified",
            confidence=ss.confidence or 1.0,
            evidence=evidence_items
        ))

    return results

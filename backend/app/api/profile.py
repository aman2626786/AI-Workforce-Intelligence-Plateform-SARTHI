from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.schemas.profile import BasicProfileUpdateRequest, StudentProfileResponse

router = APIRouter(prefix="/profile", tags=["Student Profile"])

@router.get("", response_model=StudentProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")
    return profile

@router.put("", response_model=StudentProfileResponse)
def update_basic_profile(
    data: BasicProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    # Update basic profile fields
    if data.name:
        profile.name = data.name.strip()
    profile.city = data.city.strip()
    profile.education_level = data.education_level.strip()
    profile.degree = data.degree.strip()
    profile.branch = data.branch.strip() if data.branch else None
    profile.college = data.college.strip()
    profile.graduation_year = data.graduation_year
    profile.linkedin = data.linkedin.strip() if data.linkedin else None
    profile.github = data.github.strip() if data.github else None
    profile.portfolio = data.portfolio.strip() if data.portfolio else None
    profile.target_role = data.target_role.strip() if data.target_role else "Data Analyst"
    profile.preferred_location = data.preferred_location.strip() if data.preferred_location else "Bengaluru"

    db.commit()
    db.refresh(profile)

    # Trigger Profile Intelligence recalculation
    try:
        from backend.app.services.profile_intelligence.triggers import ProfileIntelligenceTriggers
        triggers = ProfileIntelligenceTriggers(db)
        triggers.trigger_profile_updated(profile.id)
    except Exception as e:
        print(f"[ProfileTrigger] Profile intelligence update note: {e}")

    return profile

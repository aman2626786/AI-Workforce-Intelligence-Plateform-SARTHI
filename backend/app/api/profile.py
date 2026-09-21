from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.schemas.profile import BasicProfileUpdateRequest, CareerPreferenceUpdateRequest, StudentProfileResponse

router = APIRouter(prefix="/profile", tags=["Student Profile"])

def get_or_create_student_profile(current_user: User, db: Session) -> StudentProfile:
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        display_name = "Student"
        if getattr(current_user, "name", None):
            display_name = current_user.name
        elif getattr(current_user, "email", None):
            display_name = current_user.email.split("@")[0].replace(".", " ").title()

        profile = StudentProfile(
            user_id=current_user.id,
            name=display_name,
            city="Bengaluru",
            education_level="Bachelor's Degree",
            degree="B.Tech / B.E.",
            college="University",
            graduation_year=datetime.now(timezone.utc).year,
            target_role="Data Analyst",
            preferred_location="Bengaluru"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.get("", response_model=StudentProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = get_or_create_student_profile(current_user, db)
    return profile

@router.put("", response_model=StudentProfileResponse)
def update_basic_profile(
    data: BasicProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = get_or_create_student_profile(current_user, db)

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

@router.patch("/preferences", response_model=StudentProfileResponse)
def update_career_preferences(
    data: CareerPreferenceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = get_or_create_student_profile(current_user, db)

    if data.target_role is not None:
        profile.target_role = data.target_role.strip() or None
    if data.preferred_location is not None:
        profile.preferred_location = data.preferred_location.strip() or None

    db.commit()
    db.refresh(profile)
    return profile


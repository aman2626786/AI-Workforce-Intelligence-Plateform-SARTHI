import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.api.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.profile import (
    StudentProfile,
    Education,
    Experience,
    Project,
    Certification,
    ExtractionConflict,
)
from backend.app.models.resume import Resume, ExtractionRun
from backend.app.models.skill import Skill, StudentSkill, SkillEvidence
from backend.app.schemas.resume import (
    ResumeUploadResponse,
    ResumeAnalysisPreview,
    ResumeConfirmRequest,
)
from backend.app.services.resume_parser import ResumeParser

router = APIRouter(prefix="/resume", tags=["Resume Processing"])
parser = ResumeParser()

# Cache parsed analysis temporarily in memory or file for quick retrieval
_analysis_cache = {}

@router.post("/analyze-direct")
async def analyze_resume_direct(
    file: UploadFile = File(...),
):
    """Directly parse uploaded resume file and return extracted sections & skills."""
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: '{ext}'. Please upload PDF or DOCX format."
        )

    contents = await file.read()
    if len(contents) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
        )

    unique_filename = f"temp_{uuid.uuid4()}{ext}"
    temp_path = settings.UPLOAD_DIR / unique_filename
    with open(temp_path, "wb") as f:
        f.write(contents)

    try:
        parsed_result = parser.parse_resume(temp_path)
        return parsed_result
    finally:
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. File extension validation
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: '{ext}'. Please upload PDF or DOCX format."
        )

    # 2. Read and validate file size
    contents = await file.read()
    file_size = len(contents)
    if file_size > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
        )
    if file_size < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file appears to be empty or corrupted."
        )

    # 3. Secure file storage (never expose internal paths)
    unique_filename = f"{uuid.uuid4()}{ext}"
    saved_path = settings.UPLOAD_DIR / unique_filename
    with open(saved_path, "wb") as f:
        f.write(contents)

    # 4. Create Resume Record in DB
    resume_record = Resume(
        user_id=current_user.id,
        file_name=file.filename,
        file_type=ext.replace(".", "").upper(),
        file_path=str(saved_path),
        status="uploaded"
    )
    db.add(resume_record)
    db.commit()
    db.refresh(resume_record)

    return ResumeUploadResponse(
        id=resume_record.id,
        file_name=resume_record.file_name,
        file_type=resume_record.file_type,
        file_size_bytes=file_size,
        status=resume_record.status,
        uploaded_at=resume_record.uploaded_at
    )

@router.post("/{resume_id}/analyze", response_model=ResumeAnalysisPreview)
def analyze_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume record not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    user_profile_data = {
        "city": profile.city if profile else None,
        "degree": profile.degree if profile else None,
        "college": profile.college if profile else None,
        "graduation_year": profile.graduation_year if profile else None,
    }

    # Start Extraction Run
    run = ExtractionRun(
        resume_id=resume.id,
        parser_version="1.0.0",
        started_at=datetime.now(timezone.utc),
        status="running"
    )
    db.add(run)
    db.commit()

    try:
        parsed_result = parser.parse_resume(resume.file_path, user_profile_data)
        
        # Update resume record with extracted raw text
        resume.extracted_text = parsed_result["raw_text"]
        resume.processed_at = datetime.now(timezone.utc)
        resume.status = "analyzed"

        run.status = "success"
        run.completed_at = datetime.now(timezone.utc)
        db.commit()

        analysis_preview = ResumeAnalysisPreview(
            resume_id=resume.id,
            file_name=resume.file_name,
            parser_version="1.0.0",
            raw_text_length=parsed_result["raw_text_length"],
            sections_detected=parsed_result["sections_detected"],
            personal_info=parsed_result["personal_info"],
            education=parsed_result["education"],
            experience=parsed_result["experience"],
            projects=parsed_result["projects"],
            certifications=parsed_result["certifications"],
            skills=parsed_result["skills"],
            conflicts=parsed_result["conflicts"],
            confidence_summary=parsed_result["confidence_summary"]
        )

        _analysis_cache[resume.id] = analysis_preview
        return analysis_preview

    except Exception as e:
        run.status = "failed"
        run.error_message = str(e)
        run.completed_at = datetime.now(timezone.utc)
        resume.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Resume extraction failed: {str(e)}"
        )

@router.get("/{resume_id}/analysis", response_model=ResumeAnalysisPreview)
def get_resume_analysis(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if resume_id in _analysis_cache:
        return _analysis_cache[resume_id]
    return analyze_resume(resume_id, current_user, db)

@router.post("/{resume_id}/confirm", status_code=status.HTTP_200_OK)
def confirm_and_save_profile(
    resume_id: str,
    data: ResumeConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    After student reviews and confirms/edits extracted fields on the review screen:
    Persists data to student_profiles, education, experience, projects, certifications, student_skills.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume record not found")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    # 1. Update personal info if user allowed or if empty
    if data.personal_info:
        if not profile.linkedin and data.personal_info.get("linkedin"):
            profile.linkedin = data.personal_info["linkedin"]
        if not profile.github and data.personal_info.get("github"):
            profile.github = data.personal_info["github"]
        if not profile.portfolio and data.personal_info.get("portfolio"):
            profile.portfolio = data.personal_info["portfolio"]

    # 2. Save Education records
    # Remove older extracted education to prevent duplicates
    db.query(Education).filter(Education.student_id == profile.id).delete()
    for edu in data.education:
        new_edu = Education(
            student_id=profile.id,
            degree=edu.degree,
            field=edu.field,
            institution=edu.institution,
            graduation_year=edu.graduation_year,
            cgpa=edu.cgpa,
            percentage=edu.percentage
        )
        db.add(new_edu)

    # 3. Save Experience records
    db.query(Experience).filter(Experience.student_id == profile.id).delete()
    for exp in data.experience:
        new_exp = Experience(
            student_id=profile.id,
            company=exp.company,
            role=exp.role,
            start_date=exp.start_date,
            end_date=exp.end_date,
            description=exp.description
        )
        db.add(new_exp)

    # 4. Save Projects records
    db.query(Project).filter(Project.student_id == profile.id).delete()
    for proj in data.projects:
        new_proj = Project(
            student_id=profile.id,
            name=proj.name,
            description=proj.description,
            technologies=proj.technologies,
            url=proj.url
        )
        db.add(new_proj)

    # 5. Save Certifications
    db.query(Certification).filter(Certification.student_id == profile.id).delete()
    for cert in data.certifications:
        new_cert = Certification(
            student_id=profile.id,
            name=cert.name,
            issuer=cert.issuer,
            date=cert.date,
            credential_url=cert.credential_url
        )
        db.add(new_cert)

    # 6. Save Confirmed Skills & Evidence
    for sk in data.skills:
        if not sk.confirmed:
            continue

        # Ensure canonical skill exists in master table
        skill_master = db.query(Skill).filter(Skill.id == sk.skill_id).first()
        if not skill_master:
            skill_master = Skill(
                id=sk.skill_id,
                canonical_name=sk.canonical_name,
                category=sk.category,
                aliases=[]
            )
            db.add(skill_master)
            db.flush()

        # Check or create StudentSkill
        st_skill = db.query(StudentSkill).filter(
            StudentSkill.student_id == profile.id,
            StudentSkill.skill_id == sk.skill_id
        ).first()

        if not st_skill:
            st_skill = StudentSkill(
                student_id=profile.id,
                skill_id=sk.skill_id,
                source="resume",
                verification_status="unverified",
                confidence=sk.confidence
            )
            db.add(st_skill)
            db.flush()

            # Record Skill Evidence
            evidence = SkillEvidence(
                student_skill_id=st_skill.id,
                resume_id=resume.id,
                source_section=sk.source_section,
                original_text=sk.original_text,
                evidence_text=f"Detected in {sk.source_section} section with confidence {sk.confidence}",
                confidence=sk.confidence
            )
            db.add(evidence)

    # 7. Save Conflicts
    db.query(ExtractionConflict).filter(ExtractionConflict.student_id == profile.id).delete()
    for c in data.resolved_conflicts:
        conflict_rec = ExtractionConflict(
            student_id=profile.id,
            field_name=c.field_name,
            user_value=c.user_value,
            resume_value=c.resume_value,
            resolution=c.resolution
        )
        db.add(conflict_rec)

    resume.status = "confirmed"
    db.commit()

    # Trigger Profile Intelligence recalculation
    try:
        from backend.app.services.profile_intelligence.triggers import ProfileIntelligenceTriggers
        triggers = ProfileIntelligenceTriggers(db)
        triggers.trigger_resume_confirmed(profile.id)
    except Exception as e:
        print(f"[ResumeTrigger] Profile intelligence update note: {e}")

    return {
        "status": "success",
        "message": "Student profile, extracted skills, and evidence successfully confirmed and persisted."
    }

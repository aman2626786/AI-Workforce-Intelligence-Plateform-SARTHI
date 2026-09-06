from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from backend.app.models.user import User
from backend.app.models.profile import StudentProfile
from backend.app.schemas.auth import UserRegisterRequest, UserLoginRequest, FirebaseLoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegisterRequest, db: Session = Depends(get_db)):
    # 1. Validation
    if data.password != data.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")

    existing_user = db.query(User).filter(User.email == data.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    # 2. Create User Account
    user = User(
        email=data.email.lower(),
        password_hash=get_password_hash(data.password),
        auth_provider="email"
    )
    db.add(user)
    db.flush()

    # 3. Create initial Student Profile
    profile = StudentProfile(
        user_id=user.id,
        name=data.name.strip()
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    db.refresh(profile)

    # 4. Return JWT Token
    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        student_id=profile.id,
        email=user.email,
        name=profile.name
    )

@router.post("/login", response_model=TokenResponse)
def login(data: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    access_token = create_access_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        student_id=profile.id if profile else None,
        email=user.email,
        name=profile.name if profile else "Student"
    )

@router.post("/firebase-login", response_model=TokenResponse)
def firebase_login(data: FirebaseLoginRequest, db: Session = Depends(get_db)):
    """
    Handles Google OAuth and Firebase Authentication for real users.
    Creates user and profile if new, or links and issues JWT token.
    """
    clean_email = str(data.email).lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        # Create user with Google/Firebase auth
        user = User(
            email=clean_email,
            password_hash="OAUTH_USER_NO_PASSWORD",
            auth_provider="google",
            firebase_uid=data.firebase_uid
        )
        db.add(user)
        db.flush()


        # Create student profile
        profile_name = (data.name or "Student").strip()
        profile = StudentProfile(
            user_id=user.id,
            name=profile_name
        )
        db.add(profile)
        db.commit()
        db.refresh(user)
        db.refresh(profile)
    else:
        # Update firebase UID if provided
        if data.firebase_uid and not user.firebase_uid:
            user.firebase_uid = data.firebase_uid
            db.commit()

        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
        if not profile:
            profile = StudentProfile(
                user_id=user.id,
                name=(data.name or user.email.split("@")[0]).strip()
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        student_id=profile.id if profile else None,
        email=user.email,
        name=profile.name if profile else "Student"
    )

@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "auth_provider": current_user.auth_provider,
        "profile": {
            "id": profile.id if profile else None,
            "name": profile.name if profile else "Student",
            "city": profile.city if profile else None,
            "degree": profile.degree if profile else None,
            "target_role": profile.target_role if profile else None,
            "preferred_location": profile.preferred_location if profile else None,
        } if profile else None
    }


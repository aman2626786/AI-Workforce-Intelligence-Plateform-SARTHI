from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Student Full Name")
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")
    confirm_password: str = Field(..., min_length=8)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class FirebaseLoginRequest(BaseModel):
    # Identity fields are retained for client compatibility, but the server
    # derives the authoritative values from the verified Firebase token.
    email: Optional[EmailStr] = None
    name: Optional[str] = "Student"
    firebase_uid: Optional[str] = None
    photo_url: Optional[str] = None
    id_token: str = Field(..., min_length=20)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    student_id: Optional[str] = None
    email: str
    name: str


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

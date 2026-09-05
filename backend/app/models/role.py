import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class RoleFamily(Base):
    __tablename__ = "role_families"

    id = Column(String(50), primary_key=True)  # e.g. "FAM_DATA", "FAM_SWE", "FAM_AI_ML"
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    roles = relationship("Role", back_populates="family", cascade="all, delete-orphan")

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(50), primary_key=True)  # e.g. "ROL_DATA_ANALYST", "ROL_ML_ENGINEER"
    family_id = Column(String(50), ForeignKey("role_families.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    aliases = Column(JSON, default=list)  # list of titles mapped to this role
    queries = Column(JSON, default=list)  # search queries / keywords
    active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    family = relationship("RoleFamily", back_populates="roles")

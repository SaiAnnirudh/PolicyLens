from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from pgvector.sqlalchemy import Vector
from database import Base
import uuid
import datetime
import enum

class PolicyType(str, enum.Enum):
    HEALTH = "health"
    AUTO = "auto"
    HOME = "home"
    LIFE = "life"

class ClaimStatus(str, enum.Enum):
    DRAFT = "draft"
    FILED = "filed"
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True) # Nullable for OTP-only users
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class OTP(Base):
    __tablename__ = "otps"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, index=True, nullable=False)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)

class Policy(Base):
    __tablename__ = "policies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    policy_text = Column(String, nullable=False)
    policy_type = Column(Enum(PolicyType), nullable=True)
    filename = Column(String, nullable=True)
    extracted_data = Column(JSONB, nullable=True) # coverage, deductible, exclusions
    s3_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

class PolicyClause(Base):
    """Stores individual clauses for semantic RAG search"""
    __tablename__ = "policy_clauses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"), nullable=False)
    clause_text = Column(String, nullable=False)
    clause_type = Column(String, nullable=True) # e.g. "coverage", "exclusion"
    embedding = Column(Vector(768)) # Using gemini-embedding-2 outputting 768 dimensions

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"), nullable=False)
    claim_type = Column(String, nullable=False)
    claimed_amount = Column(Float, nullable=False)
    predicted_approval_score = Column(Float, nullable=True)
    missing_docs = Column(ARRAY(String), nullable=True)
    status = Column(Enum(ClaimStatus), default=ClaimStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

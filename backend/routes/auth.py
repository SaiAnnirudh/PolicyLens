import os
import json
import urllib.request
import random
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models.schema import User, OTP
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey_for_development_only")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    
class EmailRequest(BaseModel):
    email: str
    
class OTPVerify(BaseModel):
    email: str
    code: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def send_otp_email(to_email: str, code: str):
    resend_api_key = os.getenv("RESEND_API_KEY")
    
    if not resend_api_key:
        print(f"MOCK EMAIL TO {to_email}: Your OTP code is {code}")
        return
        
    print(f"Attempting to send email to {to_email} via Resend API...")
    
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {resend_api_key}",
        "Content-Type": "application/json"
    }
    data = {
        # Resend's free tier requires you to use their onboarding domain
        "from": "PolicyLens <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Your Login OTP",
        "text": f"Your PolicyLens login code is: {code}\nThis code expires in 10 minutes."
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            print(f"Successfully sent OTP email to {to_email} via Resend")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"Failed to send email via Resend: HTTP {e.code} - {error_body}", flush=True)
    except Exception as e:
        print(f"Failed to send email via Resend: {e}", flush=True)

@router.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = User(email=user.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email, "id": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not db_user.password_hash or not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": db_user.email, "id": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/request-otp")
def request_otp(req: EmailRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Store OTP in DB
    new_otp = OTP(email=req.email, code=code, expires_at=expires_at)
    db.add(new_otp)
    db.commit()
    
    # Send email in background to prevent API timeout
    background_tasks.add_task(send_otp_email, req.email, code)
    return {"status": "success", "message": "OTP sent"}

@router.post("/verify-otp", response_model=Token)
def verify_otp(req: OTPVerify, db: Session = Depends(get_db)):
    # Find active OTP
    otp = db.query(OTP).filter(
        OTP.email == req.email,
        OTP.code == req.code,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # Valid OTP, find or create user
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Provide a dummy password to satisfy the old DB constraint
        user = User(email=req.email, password_hash="passwordless_otp_user")
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Delete the used OTP
    db.delete(otp)
    db.commit()
    
    access_token = create_access_token(data={"sub": user.email, "id": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

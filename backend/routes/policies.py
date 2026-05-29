from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
import uuid

router = APIRouter(prefix="/policies", tags=["policies"])

@router.post("/upload")
async def upload_policy(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # In a real app, we would save to S3 here.
    # For MVP, we can save locally or pass directly to parsing.
    content = await file.read()
    
    # Generate a dummy task ID for the async Celery job
    task_id = str(uuid.uuid4())
    
    return {"status": "processing", "policy_id": task_id, "filename": file.filename}

@router.get("/{policy_id}/extract")
def get_extracted_policy(policy_id: str, db: Session = Depends(get_db)):
    # Placeholder for fetching extracted JSON from DB
    return {
        "id": policy_id,
        "status": "completed", # Or "processing" if not done
        "extracted_data": {
            "coverage_amount": 500000,
            "deductible": 5000,
            "exclusions": ["pre-existing conditions"],
            "policy_type": "health",
            "insurer": "Mock Insurer"
        }
    }

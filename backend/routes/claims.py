from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from services.ml_model import feature_engineering, predict_claim_approval
from models.schema import Policy, Claim
import uuid

router = APIRouter(prefix="/claims", tags=["claims"])

class ClaimRequest(BaseModel):
    policy_id: str
    claim_type: str
    amount: float

@router.post("/predict")
def predict_claim(request: ClaimRequest, db: Session = Depends(get_db)):
    """
    Predicts the approval probability of a claim based on the policy data and claim amount.
    """
    # 1. Fetch policy data from DB
    try:
        policy_uuid = uuid.UUID(request.policy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Policy ID format")
        
    policy = db.query(Policy).filter(Policy.id == policy_uuid).first()
    if not policy:
        # Mock policy data if not found for MVP testing purposes without full DB population
        policy_data = {"coverage_amount": 500000.0, "deductible": 5000.0}
    else:
        policy_data = policy.extracted_data or {}
        
    claim_data = {"amount": request.amount, "type": request.claim_type}
    
    # 2. Extract Features
    features = feature_engineering(claim_data, policy_data)
    
    # 3. Predict Outcome
    prediction_result = predict_claim_approval(features)
    
    return {
        "status": "success",
        "policy_id": request.policy_id,
        "claim_amount": request.amount,
        "prediction": prediction_result
    }

@router.post("/file")
def file_claim(request: ClaimRequest, db: Session = Depends(get_db)):
    """
    Endpoint to actually file the claim after the user reviews the prediction.
    """
    # In MVP, we just return a success message
    # In production, this would generate a PDF form and save to the Claim table
    return {
        "status": "success",
        "message": "Claim filed successfully",
        "claim_id": str(uuid.uuid4())
    }

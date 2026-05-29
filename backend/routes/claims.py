from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from services.ml_model import feature_engineering, predict_claim_approval
from models.schema import Policy, Claim, User, ClaimStatus
from routes.auth import get_current_user
from google import genai
import uuid
import os

router = APIRouter(prefix="/claims", tags=["claims"])

class ClaimRequest(BaseModel):
    policy_id: str
    claim_type: str
    amount: float

@router.post("/predict")
async def predict_claim(
    policy_id: str = Form(...),
    claim_type: str = Form(...),
    amount: float = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Predicts the approval probability of a claim. If a file is uploaded (Hospital Bill),
    it uses Gemini Vision to extract the billed amount and assess fraud.
    """
    try:
        policy_uuid = uuid.UUID(policy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Policy ID format")
        
    policy = db.query(Policy).filter(Policy.id == policy_uuid, Policy.user_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    policy_data = policy.extracted_data or {}
        
    claim_data = {"amount": amount, "type": claim_type}
    
    # Optional OCR on the bill
    extracted_bill_info = ""
    if file:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key and gemini_api_key != "your_gemini_api_key_here":
            try:
                client = genai.Client(api_key=gemini_api_key)
                file_bytes = await file.read()
                mime_type = file.content_type
                
                resp = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[
                        {"mime_type": mime_type, "data": file_bytes},
                        f"Extract the total billed amount from this medical bill. Does it match ${amount}? Are there any discrepancies or obvious signs of fraud? Explain briefly."
                    ]
                )
                extracted_bill_info = resp.text
            except Exception as e:
                print(f"Vision OCR failed: {e}")
                
    # We pass the extracted OCR info into the ML model feature extraction
    claim_data["ocr_notes"] = extracted_bill_info
    
    features = feature_engineering(claim_data, policy_data)
    prediction_result = predict_claim_approval(features)
    
    # If there was a major discrepancy detected by OCR, lower probability heavily
    if extracted_bill_info:
        prediction_result["ocr_notes"] = extracted_bill_info
    
    return {
        "status": "success",
        "policy_id": policy_id,
        "claim_amount": amount,
        "prediction": prediction_result
    }

@router.post("/file")
def file_claim(request: ClaimRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Endpoint to actually file the claim and save it persistently to the database.
    """
    try:
        policy_uuid = uuid.UUID(request.policy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Policy ID format")
        
    policy = db.query(Policy).filter(Policy.id == policy_uuid, Policy.user_id == current_user.id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    # Re-run prediction to get the score to save (in a real app, the score might be passed or recalculated)
    features = feature_engineering({"amount": request.amount, "type": request.claim_type}, policy.extracted_data or {})
    prediction = predict_claim_approval(features)
    
    new_claim = Claim(
        id=uuid.uuid4(),
        user_id=current_user.id,
        policy_id=policy_uuid,
        claim_type=request.claim_type,
        claimed_amount=request.amount,
        predicted_approval_score=prediction.get("approval_probability"),
        missing_docs=prediction.get("missing_documents", []),
        status=ClaimStatus.FILED
    )
    
    db.add(new_claim)
    db.commit()
    
    return {
        "status": "success",
        "message": "Claim filed successfully",
        "claim_id": str(new_claim.id)
    }

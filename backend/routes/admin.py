from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.schema import Claim, User, ClaimStatus, Policy
from routes.auth import get_current_user
from websocket_manager import manager
from typing import List
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])

class StatusUpdateRequest(BaseModel):
    status: ClaimStatus

@router.get("/claims")
def get_all_claims(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get all filed claims across the platform (Admin only).
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized. Admins only.")
        
    claims = db.query(Claim).all()
    
    # We will format this nicely for the frontend table
    result = []
    for c in claims:
        user = db.query(User).filter(User.id == c.user_id).first()
        policy = db.query(Policy).filter(Policy.id == c.policy_id).first()
        result.append({
            "id": str(c.id),
            "user_email": user.email if user else "Unknown",
            "policy_type": policy.policy_type if policy else "Unknown",
            "claim_type": c.claim_type,
            "claimed_amount": c.claimed_amount,
            "predicted_approval_score": c.predicted_approval_score,
            "missing_docs": c.missing_docs,
            "status": c.status.value,
            "created_at": c.created_at.isoformat()
        })
        
    return {"claims": result}

@router.post("/claims/{claim_id}/status")
async def update_claim_status(claim_id: str, request: StatusUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Approve or Deny a claim (Admin only).
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized. Admins only.")
        
    try:
        c_id = uuid.UUID(claim_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Claim ID")
        
    claim = db.query(Claim).filter(Claim.id == c_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    claim.status = request.status
    db.commit()
    
    # Send WebSocket notification to the user who owns this claim
    notification_msg = {
        "type": "CLAIM_STATUS_UPDATED",
        "claim_id": str(claim.id),
        "status": claim.status.value,
        "message": f"Your claim for {claim.claim_type} has been {claim.status.value}."
    }
    await manager.send_personal_message(notification_msg, str(claim.user_id))
    
    return {"status": "success", "message": f"Claim status updated to {request.status.value}"}

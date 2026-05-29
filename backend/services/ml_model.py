import random
from typing import Dict, Any, List

def feature_engineering(claim_data: Dict[str, Any], policy_data: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract features from the claim and policy data for the XGBoost model.
    """
    claim_amount = claim_data.get("amount", 0.0)
    coverage_limit = policy_data.get("coverage_amount", 100000.0)
    deductible = policy_data.get("deductible", 0.0)
    
    # Calculate ratio of claim to coverage
    ratio = claim_amount / coverage_limit if coverage_limit > 0 else 1.0
    
    return {
        "claim_amount": claim_amount,
        "coverage_limit": coverage_limit,
        "ratio": ratio,
        "deductible_amount": deductible,
    }

def predict_claim_approval(features: Dict[str, float]) -> Dict[str, Any]:
    """
    Mock XGBoost prediction for the MVP phase.
    Returns approval probability and identified missing documents.
    """
    # In production, this would be: 
    # model = load_model('claim_model.pkl')
    # prob = model.predict_proba([list(features.values())])[0][1]
    
    ratio = features.get("ratio", 0.5)
    
    # Simple logic for mock: high ratio means lower probability
    base_prob = 0.95
    if ratio > 0.8:
        base_prob = 0.40
    elif ratio > 0.4:
        base_prob = 0.75
        
    # Add some randomness for realism in MVP
    prob = base_prob - (random.random() * 0.1)
    prob = max(0.01, min(0.99, prob))
    
    # Determine risk category
    if prob >= 0.80:
        risk_category = "LOW"
    elif prob >= 0.50:
        risk_category = "MEDIUM"
    else:
        risk_category = "HIGH"
        
    # Mock missing documents logic
    missing_docs: List[str] = []
    if prob < 0.7:
        missing_docs = ["hospital_discharge_summary", "doctor_consultation_note"]
        if features.get("claim_amount", 0) > 100000:
            missing_docs.append("detailed_itemized_bill")
            
    return {
        "approval_probability": round(prob * 100, 1),
        "risk_category": risk_category,
        "missing_documents": missing_docs
    }

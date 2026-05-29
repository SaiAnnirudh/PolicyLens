import os
import json
from typing import Dict, Any, List
from google import genai

def feature_engineering(claim_data: Dict[str, Any], policy_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract features from the claim and policy data to feed into the AI model.
    """
    claim_amount = claim_data.get("amount", 0.0)
    claim_type = claim_data.get("type", "unknown")
    
    coverage_limit = policy_data.get("coverage_amount")
    if coverage_limit is None:
        coverage_limit = 100000.0
        
    deductible = policy_data.get("deductible")
    if deductible is None:
        deductible = 0.0
        
    exclusions = policy_data.get("exclusions", [])
    
    return {
        "claim_amount": claim_amount,
        "claim_type": claim_type,
        "coverage_limit": coverage_limit,
        "deductible_amount": deductible,
        "exclusions": exclusions
    }

def predict_claim_approval(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use Gemini AI as an intelligent claims adjuster to predict approval probability.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_api_key or gemini_api_key == "your_gemini_api_key_here":
        # Fallback if no API key
        return _fallback_prediction(features)
        
    try:
        client = genai.Client(api_key=gemini_api_key)
        
        prompt = f"""
        You are an expert insurance claims adjuster AI.
        Assess the probability that the following claim will be approved based on the policy limits.
        
        CLAIM DETAILS:
        - Type: {features.get('claim_type')}
        - Amount: ${features.get('claim_amount')}
        
        POLICY LIMITS:
        - Total Coverage Limit: ${features.get('coverage_limit')}
        - Deductible: ${features.get('deductible_amount')}
        - Exclusions: {', '.join(features.get('exclusions', [])) if features.get('exclusions') else 'None specifically noted'}
        
        INSTRUCTIONS:
        1. If the claim amount far exceeds the coverage limit, the probability should be very low.
        2. If the claim type is generally related to the exclusions, lower the probability.
        3. List any missing documents (e.g. "hospital_bill", "doctor_note", "police_report") that are strictly required to verify this type of claim.
        4. Categorize the risk as "LOW", "MEDIUM", or "HIGH".
        
        Return ONLY a valid JSON object with the following exact keys:
        - "approval_probability": float (0.0 to 100.0)
        - "risk_category": string ("LOW", "MEDIUM", "HIGH")
        - "missing_documents": list of strings
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        resp_text = response.text.strip()
        if resp_text.startswith("```json"):
            resp_text = resp_text[7:-3]
        elif resp_text.startswith("```"):
            resp_text = resp_text[3:-3]
            
        result = json.loads(resp_text.strip())
        
        return {
            "approval_probability": float(result.get("approval_probability", 50.0)),
            "risk_category": result.get("risk_category", "MEDIUM"),
            "missing_documents": result.get("missing_documents", [])
        }
        
    except Exception as e:
        print(f"Gemini Prediction Error: {e}")
        return _fallback_prediction(features)

def _fallback_prediction(features: Dict[str, Any]) -> Dict[str, Any]:
    claim_amount = features.get("claim_amount", 0.0)
    coverage_limit = features.get("coverage_limit", 100000.0)
    ratio = claim_amount / coverage_limit if coverage_limit > 0 else 1.0
    
    prob = 95.0
    if ratio > 0.8:
        prob = 40.0
    elif ratio > 0.4:
        prob = 75.0
        
    risk_category = "LOW" if prob >= 80 else "MEDIUM" if prob >= 50 else "HIGH"
    
    missing_docs = []
    if prob < 70:
        missing_docs = ["hospital_discharge_summary", "doctor_consultation_note"]
        
    return {
        "approval_probability": prob,
        "risk_category": risk_category,
        "missing_documents": missing_docs
    }

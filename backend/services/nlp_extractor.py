import spacy
import re
from typing import Dict, Any

# You will need to run: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: en_core_web_sm not found. Run 'python -m spacy download en_core_web_sm'")
    nlp = None

def extract_structured_data(text: str) -> Dict[str, Any]:
    """
    Extracts structured data from raw policy text using spaCy and Regex.
    """
    data = {
        "coverage_amount": None,
        "deductible": None,
        "exclusions": [],
        "policy_type": "unknown",
        "insurer": "Unknown Insurer"
    }
    
    if not nlp:
        return data

    doc = nlp(text)
    
    # 1. Extract Money (Coverage/Deductibles)
    moneys = [ent.text for ent in doc.ents if ent.label_ == "MONEY"]
    # Simplistic logic: highest money is coverage, lowest is deductible
    amounts = []
    for m in moneys:
        # Extract digits
        digits = re.sub(r'[^\d]', '', m)
        if digits:
            amounts.append(float(digits))
            
    if amounts:
        amounts.sort(reverse=True)
        data["coverage_amount"] = amounts[0]
        if len(amounts) > 1:
            data["deductible"] = amounts[-1]
            
    # 2. Extract Insurer (ORG)
    orgs = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
    # Very simplistic: take the first mentioned organization that looks like an insurer
    for org in orgs:
        if "insurance" in org.lower() or "health" in org.lower() or "life" in org.lower():
            data["insurer"] = org
            break
            
    # 3. Regex for Exclusions
    # Look for sentences containing "excluded", "not covered", etc.
    sentences = [sent.text for sent in doc.sents]
    for sent in sentences:
        sent_lower = sent.lower()
        if "excluded" in sent_lower or "not covered" in sent_lower or "exclusion" in sent_lower:
            # Clean up and add to exclusions
            clean_sent = sent.strip().replace('\n', ' ')
            if len(clean_sent) > 10: # avoid very short meaningless matches
                data["exclusions"].append(clean_sent)
                
    return data

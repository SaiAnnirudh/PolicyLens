import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from models.schema import Policy, PolicyClause
from google import genai
from sentence_transformers import SentenceTransformer

router = APIRouter(prefix="/qa", tags=["qa"])

# Initialize models (in a real app, this should be done at startup)
try:
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Failed to load sentence-transformers: {e}")
    embedding_model = None

class QuestionRequest(BaseModel):
    policy_id: str
    question: str

@router.post("/ask")
def ask_question(request: QuestionRequest, db: Session = Depends(get_db)):
    """
    Advanced RAG using pgvector and Gemini 2.5 Flash.
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key or gemini_api_key == "your_gemini_api_key_here":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured")
        
    if not embedding_model:
        raise HTTPException(status_code=500, detail="Embedding model not initialized")

    # 1. Generate embedding for the question
    question_embedding = embedding_model.encode(request.question).tolist()
    
    # 2. Retrieve top 5 semantically similar clauses from pgvector
    # Using L2 distance (<->) or inner product (<#>) or cosine distance (<=>)
    # Cosine distance is standard for sentence transformers
    try:
        # Assuming PolicyClause has an embedding column of type Vector
        # We find clauses matching this policy_id, ordered by cosine distance
        query = text("""
            SELECT clause_text, 1 - (embedding <=> :emb) as similarity
            FROM policy_clauses 
            WHERE policy_id = :pid
            ORDER BY embedding <=> :emb
            LIMIT 5
        """)
        result = db.execute(query, {"emb": str(question_embedding), "pid": request.policy_id})
        retrieved_clauses = [row[0] for row in result]
        
        if not retrieved_clauses:
            # Fallback for MVP if vector db is empty
            retrieved_clauses = [
                "Your policy covers up to $500,000 for inpatient care.",
                "Dental procedures are strictly excluded.",
                "There is a $5,000 deductible."
            ]
            
    except Exception as e:
        print(f"Vector search failed: {e}")
        retrieved_clauses = ["Error retrieving clauses from vector DB."]

    # 3. Augment and Generate with Gemini
    context = "\n".join(retrieved_clauses)
    prompt = f"""
    You are an expert insurance policy assistant. 
    Answer the user's question accurately based ONLY on the provided policy clauses.
    If the answer is not in the clauses, state that you cannot find the information in the policy.
    
    POLICY CLAUSES:
    {context}
    
    USER QUESTION: {request.question}
    """
    
    try:
        client = genai.Client(api_key=gemini_api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        answer = response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate answer from LLM")
        
    return {
        "question": request.question,
        "answer": answer,
        "sources": retrieved_clauses
    }

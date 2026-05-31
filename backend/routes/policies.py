import pdfplumber
import os
import uuid
import tempfile
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.schema import Policy, PolicyClause, User
from routes.auth import get_current_user

router = APIRouter(prefix="/policies", tags=["policies"])

# Removed sentence-transformers in favor of Gemini embeddings

@router.post("/upload")
async def upload_policy(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    
    # Write to a temp file for pdfplumber
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        tmp.write(content)
        tmp_path = tmp.name
    finally:
        tmp.close()
        
    extracted_text = ""
    images_descriptions = []
    try:
        import fitz
        import re
        from google import genai
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        
        client = None
        if gemini_api_key and gemini_api_key != "your_gemini_api_key_here":
            client = genai.Client(api_key=gemini_api_key)
            
        with fitz.open(tmp_path) as doc:
            for page_num, page in enumerate(doc):
                # 1. Extract Text
                text = page.get_text("text")
                if text:
                    text = re.sub(r'(?m)^\s*[C|o|•|·]\s+', '- ', text)
                    text = re.sub(r' C ', ' ', text)
                    extracted_text += text + "\n"
                    
                # 2. Extract Images (Multi-modal)
                if client:
                    image_list = page.get_images(full=True)
                    import time
                    for img_index, img in enumerate(image_list):
                        try:
                            xref = img[0]
                            base_image = doc.extract_image(xref)
                            
                            # Filter out tiny logos and bullet point icons to save API quota
                            if base_image["width"] < 100 or base_image["height"] < 100:
                                continue
                                
                            image_bytes = base_image["image"]
                            image_ext = base_image["ext"]
                            
                            # Ask Gemini to describe the image/table
                            from google.genai import types
                            response = client.models.generate_content(
                                model='gemini-2.5-flash',
                                contents=[
                                    types.Part.from_bytes(
                                        data=image_bytes,
                                        mime_type=f"image/{image_ext}",
                                    ),
                                    "Describe this image in detail. If it's a table, extract all rows and columns. Focus specifically on any numbers, coverage limits, deductibles, and exclusions."
                                ]
                            )
                            if response.text:
                                images_descriptions.append(response.text)
                                
                            # Sleep for 2 seconds to avoid Gemini's free tier 15 RPM limit
                            time.sleep(2)
                        except Exception as img_e:
                            print(f"Failed to extract/describe image {img_index} on page {page_num}: {img_e}")
                            
    except Exception as e:
        os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {e}")
        
    os.remove(tmp_path)
    
    # Sanitize text to remove null bytes which crash PostgreSQL
    extracted_text = extracted_text.replace("\x00", "").replace("\u0000", "")
    
    # We will compute structured data AFTER inserting into vector DB
    # 1. Save Policy to DB initially with empty extracted_data
    policy_id = uuid.uuid4()
    
    policy = Policy(
        id=policy_id,
        user_id=current_user.id,
        policy_text=extracted_text,
        extracted_data={}
    )
    db.add(policy)
    
    # 2. Chunk text and images into clauses and embed
    if 'client' in locals() and client:
        # Simple chunking by paragraph
        paragraphs = [p.strip() for p in extracted_text.split('\n\n') if len(p.strip()) > 15]
        
        # Combine text chunks and image descriptions
        all_chunks = paragraphs + images_descriptions
        
        try:
            for p in all_chunks:
                # Use Gemini Embeddings
                emb_res = client.models.embed_content(
                    model="text-embedding-004",
                    contents=p
                )
                emb = emb_res.embeddings[0].values
                clause = PolicyClause(
                    policy_id=policy_id,
                    clause_text=p,
                    embedding=emb
                )
                db.add(clause)
        except Exception as e:
            print(f"Failed to embed chunks: {e}")
            
    db.commit()
    
    # 3. RAG-Based Structured Data Extraction using Gemini
    try:
        from sqlalchemy import text as sa_text
        import json
        
        # Search the Vector DB for coverage and extraction-related info
        search_query = "What is the total coverage amount, deductible, exclusions, insurer name, and policy type?"
        
        q_emb = None
        if 'client' in locals() and client:
            emb_res = client.models.embed_content(
                model="text-embedding-004",
                contents=search_query
            )
            q_emb = emb_res.embeddings[0].values
        
        if not q_emb:
            raise Exception("No embedding generated for query")
        
        res = db.execute(sa_text("""
            SELECT clause_text 
            FROM policy_clauses 
            WHERE policy_id = :pid
            ORDER BY embedding <=> :emb
            LIMIT 10
        """), {"emb": str(q_emb), "pid": policy_id})
        
        retrieved_context = "\n".join([row[0] for row in res])
        
        prompt = f"""
        You are an expert insurance data extractor. 
        Extract the following fields from the policy context provided below:
        - coverage_amount (number, e.g. 500000)
        - deductible (number, e.g. 5000)
        - exclusions (list of strings)
        - policy_type (string, e.g. "health", "auto")
        - insurer (string, e.g. "Star Health", "HDFC Ergo")
        
        Return ONLY a valid JSON object matching these keys. If you cannot find a value, use null or an empty list.
        
        CONTEXT:
        {retrieved_context}
        """
        
        if client:
            json_response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            
            # Clean JSON response
            resp_text = json_response.text.strip()
            if resp_text.startswith("```json"):
                resp_text = resp_text[7:-3]
            elif resp_text.startswith("```"):
                resp_text = resp_text[3:-3]
                
            structured_data = json.loads(resp_text.strip())
            
            # Update the policy with the final structured data
            policy.extracted_data = structured_data
            db.commit()
            
    except Exception as e:
        print(f"RAG extraction failed: {e}")
    
    return {"status": "success", "policy_id": str(policy_id), "filename": file.filename}

@router.get("/mine")
def get_my_policies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    policies = db.query(Policy).filter(Policy.user_id == current_user.id).order_by(Policy.uploaded_at.desc()).all()
    return [{"id": str(p.id), "uploaded_at": p.uploaded_at, "extracted_data": p.extracted_data} for p in policies]

@router.get("/{policy_id}/extract")
def get_extracted_policy(policy_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        policy_uuid = uuid.UUID(policy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Policy ID format")
        
    policy = db.query(Policy).filter(Policy.id == policy_uuid).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    return {
        "id": policy_id,
        "status": "completed",
        "extracted_data": policy.extracted_data
    }

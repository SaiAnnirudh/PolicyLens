# Insurance Policy Simplifier: Complete One-Page Overview

## PROJECT VISION
Convert chaotic insurance policies into actionable insights using AI-powered extraction, NLP-based explanations, and ML-driven claim predictions—helping users save ₹50k-500k by avoiding claim denials.

---

## PROBLEM → SOLUTION

| Problem | Impact | Solution |
|---------|--------|----------|
| 40-page policies in legal jargon | Users don't understand coverage | Extract & explain in plain English |
| Claims get denied due to missing docs | ₹50k-500k loss per denied claim | Predict approval probability + flag missing docs |
| No guidance through claim filing | High rejection rates | Step-by-step claims wizard with auto-generated forms |
| Scattered insurer information | Information asymmetry | Index all policies for semantic search (Q&A) |

---

## CORE FEATURES (MVP)

1. **Upload Policy PDF** → App extracts text (OCR for scans, pdfplumber for structured)
2. **View Extracted Data** → Coverage amount, deductible, exclusions, policy type in structured JSON
3. **Ask Questions** → "Am I covered for dental?" → Elasticsearch searches relevant clauses (no LLM)
4. **Predict Claim Outcome** → XGBoost model: "82% approval probability, missing: [hospital receipt, doctor note]"
5. **File Claim** → Step-by-step wizard generates claim form, auto-populated from policy data
6. **Track Claims** → Dashboard shows status (draft → filed → pending → approved/denied)

---

## COMPLETE TECH STACK (ALL FREE TOOLS)

### FRONTEND
```
React 18 + Vite + Tailwind CSS
├─ PDFUploader component (drag-drop, file validation)
├─ PolicyAnalysis (display extracted data, risk score)
├─ ChatBot (search clauses via Elasticsearch)
├─ ClaimsWizard (5-step form generator)
├─ RiskScoreCard (visual red/yellow/green badges)
└─ Dashboard (track all claims, policies)

HTTP Client: Axios
Authentication: JWT (stored in localStorage)
State Management: React Context API + useReducer
```

### BACKEND
```
FastAPI + Python 3.10
├─ 6 Router modules (auth, policies, claims, extraction, search, health)
├─ Authentication: JWT (python-jose) + password hashing (passlib)
├─ Database: SQLAlchemy ORM (PostgreSQL)
├─ Async: Uvicorn ASGI server (async endpoints)
└─ Rate limiting: slowapi (prevent abuse)

Key Endpoints:
POST   /auth/signup, /auth/login
POST   /policies/upload → Extract text
GET    /policies/{id}/extract → Return structured data
POST   /claims/predict → ML model prediction
GET    /search/clauses?q=dental&policy_id=X → Elasticsearch
POST   /claims/file → Generate claim form
GET    /dashboard → User's policies + claims
```

### PDF EXTRACTION (3-Step Pipeline)
```
PDF Upload
├─ Check if structured or scanned
├─ If structured: pdfplumber.extract_text() → 95% accuracy
├─ If scanned: PyMuPDF (rasterize) → Tesseract OCR → 80% accuracy
└─ Store raw text in PostgreSQL
```

### NLP PROCESSING (Extract Structured Data)
```
Raw Policy Text
├─ spaCy NER (Named Entity Recognition)
│  ├─ Extract amounts: MONEY entities → coverage_amount (₹500k)
│  ├─ Extract dates: DATE entities → policy_start, policy_end
│  ├─ Extract organizations: ORG entities → insurer name
│  └─ Extract policy numbers: REGEX patterns
├─ Exclusion Detection: Regex + keyword matching
│  └─ Find: "excluded", "not covered", "not applicable"
├─ Clause Classification: Simple text patterns
│  ├─ COVERAGE: "covers", "includes", "covered under"
│  ├─ EXCLUSION: "excluded", "not covered"
│  ├─ DEDUCTIBLE: "deductible", "out of pocket"
│  └─ WAITING_PERIOD: "waiting period", "after X days"
└─ Return structured JSON:
   {
     "coverage_amount": 500000,
     "deductible": 5000,
     "exclusions": ["pre-existing", "dental"],
     "policy_type": "health",
     "insurer": "HDFC",
     "clauses": [
       {"type": "coverage", "text": "..."},
       {"type": "exclusion", "text": "..."}
     ]
   }
```

### ML PREDICTION MODEL (XGBoost)
```
User Files Claim (Amount: ₹200k, Type: Hospitalization)
↓
Feature Engineering:
├─ claim_amount (₹200k)
├─ coverage_limit (₹500k) → ratio = 40%
├─ claim_type (hospitalization) → encoded = 3
├─ days_since_policy_start (180 days)
├─ has_pre_existing_exclusion (0 or 1)
├─ missing_documents_count (2)
├─ insurer_type (HDFC) → encoded = 1
├─ deductible_amount (₹5k)
└─ historical_denial_rate_for_insurer (8%)

↓ XGBoost Model (trained on 1000+ claim outcomes from NCDRC)

Output:
├─ Approval Probability: 82%
├─ Risk Category: MEDIUM (60-80% approval)
├─ Confidence Score: 0.85
└─ Missing Documents: ["hospital_discharge_summary", "doctor_consultation_note"]
```

### Q&A SYSTEM (Elasticsearch, No LLM)
```
User Question: "Am I covered for dental work?"

Process:
1. Index policy text in Elasticsearch (on upload)
   └─ Create document with policy text split into clauses
2. User asks question
3. BM25 search in Elasticsearch (keyword + semantic matching)
4. Retrieve top 5 relevant clauses from policy
5. Return clauses to user (not generated answer, actual policy text)

Example Output:
- Clause 1: "Dental treatment is covered under additional rider..."
- Clause 2: "Exclusion: Cosmetic dental procedures not covered"
- Clause 3: "Waiting period for dental: 30 days from policy start"
```

### DATABASE SCHEMA (PostgreSQL)
```
users
├─ id (UUID)
├─ email (unique)
├─ password_hash
└─ created_at

policies
├─ id (UUID)
├─ user_id (FK)
├─ policy_text (full PDF text)
├─ policy_type (enum: health, auto, home, life)
├─ extracted_data (JSONB: coverage, deductible, exclusions)
├─ s3_url (where PDF stored)
└─ uploaded_at

claims
├─ id (UUID)
├─ user_id (FK)
├─ policy_id (FK)
├─ claim_type (text)
├─ claimed_amount (numeric)
├─ predicted_approval_score (float: 0-1)
├─ missing_docs (array of strings)
├─ status (enum: draft, filed, pending, approved, denied)
└─ created_at

claim_outcomes (for ML training)
├─ id (UUID)
├─ claim_id (FK)
├─ actual_outcome (boolean: approved/denied)
├─ denial_reason (text)
└─ created_at
```

### CACHING & SEARCH
```
Redis (in-memory cache)
├─ Cache extracted policies: key = "policy:{id}:extracted", TTL = 7 days
├─ Cache model predictions: key = "claim:{id}:prediction", TTL = 30 days
├─ Rate limiting: track API calls per user
└─ Session management

Milvus (Vector Database)
├─ Store policy embeddings (sentence-transformers)
├─ Query: "policies similar to this one" (not used in MVP)
└─ For future: semantic policy comparison
```

### ASYNC PROCESSING (Celery + Redis)
```
Large PDF uploaded (50MB scan with 200 pages)
↓
FastAPI endpoint returns immediately: {"status": "processing", "policy_id": "xyz"}
↓
Celery task runs async in background:
├─ Parse PDF (30 seconds)
├─ Extract text via OCR (60 seconds)
├─ Run NLP extraction (10 seconds)
├─ Generate embeddings (5 seconds)
├─ Index in Elasticsearch (2 seconds)
├─ Store in PostgreSQL
└─ Emit WebSocket event: "policy_ready"
↓
Frontend receives event → displays results (user sees updates in real-time)
```

### DEPLOYMENT ARCHITECTURE
```
Docker Compose (Local Dev):
├─ PostgreSQL container
├─ Redis container
├─ Elasticsearch container
├─ Backend FastAPI container
├─ Frontend React container
└─ Celery worker container

AWS (Production):
├─ EC2 (t3.medium) for FastAPI
├─ RDS (PostgreSQL) managed
├─ Redis ElastiCache
├─ S3 (PDF storage) + CloudFront CDN
├─ GitHub Actions (auto-deploy on git push)
└─ CloudWatch (monitoring, logs)

Cost: ~₹5,000/month
```

---

## COMPLETE USER FLOW (End-to-End)

```
1. USER SIGNUP
   └─ POST /auth/signup → Create user account → Return JWT

2. UPLOAD POLICY
   User → "Select PDF" → Frontend
   └─ POST /policies/upload (multipart file) → FastAPI
      ├─ Save to S3
      ├─ Trigger Celery task: parse_and_extract()
      ├─ Return: {"policy_id": "xyz", "status": "processing"}
      └─ Frontend shows progress bar

3. ASYNC PROCESSING (Celery Worker)
   ├─ Detect: PDF is scanned or structured
   ├─ Extract text: pdfplumber or Tesseract
   ├─ NLP extraction: spaCy NER + regex
   ├─ Generate risk score: 0-100
   ├─ Index in Elasticsearch
   ├─ Store in PostgreSQL.policies
   └─ Emit WebSocket: "policy_ready"

4. VIEW EXTRACTED DATA
   Frontend receives WebSocket → GET /policies/{id}/extract
   └─ Returns:
      {
        "coverage_amount": 500000,
        "deductible": 5000,
        "exclusions": ["pre-existing"],
        "risk_score": 75,
        "policy_type": "health",
        "clauses": [...]
      }
   Frontend displays with visual badges (Red=High Risk, Green=Low Risk)

5. USER ASKS QUESTION: "Am I covered for dental?"
   POST /search/clauses
   ├─ Elasticsearch BM25 search for "dental" + "covered"
   ├─ Retrieve top 5 relevant clauses from policy
   └─ Return to frontend:
      [
        "Dental treatment is covered under additional rider",
        "Exclusion: Cosmetic dental procedures",
        "Waiting period: 30 days"
      ]
   Frontend displays clauses (user can scroll)

6. USER WANTS TO FILE CLAIM
   ├─ Select claim type: "Hospitalization" (dropdown)
   ├─ Enter amount: ₹200,000
   ├─ Frontend → POST /claims/predict
      ├─ Feature engineering (extract 8 features from policy + claim)
      ├─ Load XGBoost model
      ├─ Model inference: 82% approval probability
      ├─ Return: Missing documents + risk level
      └─ Frontend shows: "Good news! 82% likely to be approved. You need: Hospital receipt, Doctor note"
   ├─ User uploads documents
   ├─ Frontend generates form (Jinja2 template)
      └─ Auto-fills: policyholder name, coverage limit, deductible, claim amount
   ├─ User reviews & clicks "Submit"
   └─ POST /claims/file → Store in DB, generate PDF, send email to insurer

7. TRACK CLAIM
   GET /user/dashboard → Returns all policies + claims with status
   Frontend shows timeline:
   ├─ Claim filed: 2024-05-27
   ├─ Current status: PENDING (expected decision: 2024-06-10)
   ├─ Approval probability: 82%
   └─ Last update: "Insurer acknowledges receipt"

8. CLAIM APPROVED (30 days later)
   Backend receives approval from insurer (webhook or manual input)
   └─ Update DB: claims.status = "approved"
   └─ Send email: "Your ₹200k claim was approved!"
   └─ Store outcome: claim_outcomes table (for retraining ML model)
```

---

## ML MODEL LIFECYCLE

```
TRAINING PHASE (Before Launch)
├─ Scrape claim outcomes from NCDRC website (~1000 examples)
├─ Extract features: claim amount, type, coverage, insurer, outcome
├─ Split: 80% train, 20% test
├─ Train XGBoost: xgb.XGBClassifier()
├─ Validate: Cross-validation (5-fold)
├─ Metrics: Accuracy 85%, Precision 80%, Recall 88%
├─ Save model: claim_model.pkl
└─ Deploy: Load at FastAPI startup

INFERENCE PHASE (In Production)
├─ User files claim
├─ Extract features from policy + claim data
├─ Load model from disk
├─ Predict: model.predict_proba([features]) → 0.82 (82% approval)
└─ Return to user

RETRAINING PHASE (Monthly)
├─ Collect actual claim outcomes (from users, insurers)
├─ Add to training dataset
├─ Retrain model (background job)
├─ If accuracy improved: deploy new model
└─ Keep versioning: v1, v2, v3...
```

---

## NLP FEATURES EXPLAINED

| NLP Task | Tool | Use Case | Example |
|----------|------|----------|---------|
| **Entity Extraction** | spaCy NER | Extract coverage amount, dates, insurer | "₹500,000 coverage" → MONEY = 500000 |
| **Text Classification** | Regex patterns | Categorize clauses (coverage vs exclusion) | "Excluded from coverage" → EXCLUSION |
| **Keyword Search** | Elasticsearch BM25 | Find relevant clauses for user questions | "dental" → returns all dental-related clauses |
| **Semantic Similarity** | sentence-transformers | Find similar policies (future) | "health insurance with ₹500k" → similar policies |
| **Text Preprocessing** | NLTK + spaCy | Tokenization, lemmatization | "Covers" + "covers" + "covered" → normalize |

---

## REVENUE MODEL (How It Makes Money)

| Stream | Amount | Timeline | Effort |
|--------|--------|----------|--------|
| **Premium Tier** | ₹99/month per user | Month 5 | Medium |
| **Lawyer Referrals** | 15% commission on appeal fees | Month 6 | Medium |
| **B2B (Insurers)** | ₹5-10L/year per insurer | Month 6 | High |
| **Total Target (Month 6)** | ₹100k/month MRR | 6 months | Achievable |

---

## SUCCESS METRICS (Measurable Goals)

| Metric | Target | Timeline |
|--------|--------|----------|
| Users | 1,000 | Week 26 |
| Premium subscribers | 100 | Week 26 |
| Claims filed | 500 | Week 26 |
| Avg. claim recovered | ₹100,000 | Week 26 |
| Model accuracy | 88%+ | Week 14 |
| Extraction accuracy | 95%+ | Week 13 |
| API response time | <500ms | Week 15 |
| User retention | 70% | Week 26 |
| NPS (Net Promoter Score) | >40 | Week 26 |

---

## WHY THIS STACK IS IDEAL

✅ **All Free** - No LLM API costs (₹0/month for Claude), all tools MIT/Apache licensed  
✅ **Scalable** - FastAPI async, Celery for background jobs, PostgreSQL scales to millions  
✅ **Production-Ready** - Used by companies like Uber, Netflix (core tech)  
✅ **Fast to Build** - Minimal boilerplate, can move quickly  
✅ **Data Science Friendly** - Python ecosystem best-in-class for ML/NLP  
✅ **Easy to Deploy** - Docker, GitHub Actions, AWS simple setup  

---

## TIMELINE SUMMARY

| Phase | Weeks | Goal |
|-------|-------|------|
| **Foundation** | 1-4 | Core infra + PDF parsing |
| **MVP** | 5-10 | Full product (extract → predict → file claim) |
| **Scale** | 11-18 | 5+ insurers, improve ML, optimize performance |
| **Launch** | 19-26 | Deploy to AWS, get 1,000 users, start revenue |

---

## FILES YOU HAVE

1. **INSURANCE_SIMPLIFIER_IMPLEMENTATION_PLAN.md** - 26-week detailed breakdown
2. **WEEKLY_CHECKLIST.md** - Daily tasks with code snippets
3. **DEPENDENCIES_AND_SETUP.md** - docker-compose.yml + requirements.txt

---

## NEXT IMMEDIATE STEPS

```bash
# Week 1 (This Week)
1. git clone + create folder structure
2. docker-compose up (PostgreSQL + Redis + Elasticsearch + Backend + Frontend)
3. Implement authentication (JWT signup/login)
4. Build PDF upload endpoint

# Week 2
5. Implement pdfplumber + Tesseract OCR
6. Build NLP extraction (spaCy)

# Week 3
7. Create XGBoost model + prediction endpoint

# Week 4
8. Set up Elasticsearch + search endpoint
```

---

**Project Status:** Ready to Build  
**Total Dev Time:** 26 weeks (solo developer)  
**Expected Launch:** Month 6  
**Potential Exit:** ₹100k/month MRR in year 2, acquirable by PolicyBazaar/Digit  

# PolicyLens 🔍🛡️

PolicyLens is an advanced, AI-powered Insurance Policy Management and Claim Prediction platform. It leverages state-of-the-art Large Language Models (LLMs) and Vector Databases to instantly parse complex insurance PDF documents, extract critical coverage data, and provide an interactive AI assistant to answer policy-specific questions and file claims.

## 🚀 Features

- **Passwordless Authentication:** Secure, lightning-fast OTP email login powered by the Resend API.
- **Intelligent PDF Parsing:** Upload raw insurance policies (PDFs). The system uses **Gemini 2.5 Flash** to read text, understand complex tables, and analyze images/logos natively.
- **Automated Data Extraction:** Automatically identifies and extracts the Coverage Amount, Deductible, Exclusions, and Policy Type directly from the raw document into structured JSON data.
- **Semantic RAG Search:** Every paragraph and image description is embedded using the **Gemini Embedding 2** model and stored in a **pgvector** database.
- **AI Policy Assistant:** Chat with your policy! Ask questions like *"What is my deductible?"* or *"Are dental procedures covered?"* and get accurate answers based *strictly* on your document's semantic context.
- **Smart Claim Filing:** Tell the chatbot to file a claim (e.g., *"File a claim for $500 for a hospital visit"*). The system uses feature engineering to calculate a mock **Approval Probability Score** and flags missing documents before filing.

---

## 🛠️ Tech Stack

### Frontend
- **React (Vite):** Lightning-fast frontend build tool.
- **Tailwind CSS:** Utility-first CSS framework for a beautiful, responsive, and modern glassmorphism UI.
- **Lucide React:** Clean and modern iconography.
- **React Router:** Client-side routing.
- **Vercel:** Cloud hosting for the frontend.

### Backend
- **Python 3.13 & FastAPI:** Ultra-fast, async Python web framework.
- **PostgreSQL & pgvector:** Relational database with vector search capabilities for RAG.
- **SQLAlchemy:** Object Relational Mapper (ORM) for secure database interactions.
- **PyJWT:** Secure JSON Web Tokens for API authentication.
- **PyMuPDF (`fitz`) & pdfplumber:** Advanced PDF processing and image extraction.
- **Railway:** Cloud deployment platform for the FastAPI backend and Postgres database.

### AI & Integrations
- **Google GenAI SDK (v0.5+):** 
  - `gemini-2.5-flash`: Used for multimodal PDF analysis, image understanding, and JSON-based structured RAG extraction.
  - `gemini-embedding-2`: Used to map policy clauses into 768-dimensional vectors for semantic search.
- **Resend API:** Bypasses traditional SMTP port blocks to reliably deliver OTP emails via HTTP requests.

---

## ⚙️ Local Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/SaiAnnirudh/PolicyLens.git
cd PolicyLens
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Activate virtual environment (Windows: .\venv\Scripts\activate | Mac/Linux: source venv/bin/activate)

pip install -r requirements.txt
```
Create a `.env` file inside the `backend` folder:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/policylens
JWT_SECRET_KEY=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
RESEND_API_KEY=your_resend_api_key
```
Run the backend:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file inside the `frontend` folder:
```env
VITE_API_URL=http://127.0.0.1:8000
```
Run the frontend:
```bash
npm run dev
```

---

## 🧠 System Architecture

1. **Upload Phase:** User uploads a PDF. The backend extracts the raw text and images.
2. **Vision Phase:** Images are sent to `gemini-2.5-flash` to extract tables and visual data.
3. **Embedding Phase:** Text and image descriptions are chunked and embedded using `gemini-embedding-2` (768 dimensions) and saved to PostgreSQL via `pgvector`.
4. **Extraction Phase:** A semantic search retrieves the most relevant chunks, and Gemini generates a structured JSON object containing the coverage, deductible, and exclusions.
5. **Chat Phase:** User messages trigger a vector search against the policy clauses. The retrieved context is injected into a strict prompt for Gemini to answer the question or trigger a `file_claim` JSON action.

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.preprocessing import preprocess
from services.extraction import extract_symptoms
from services.retriever import retrieve_documents
from services.llm_generator import generate_response
from services.postprocessing import postprocess_response


# -------------------------------
# FastAPI App Initialization
# -------------------------------
app = FastAPI(
    title="SymptoTrackAI",
    description="AI-powered symptom analysis and medical guidance system",
    version="1.0.0"
)


# -------------------------------
# CORS (for frontend later)
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------
# Request & Response Models
# -------------------------------
class SymptomRequest(BaseModel):
    symptoms: str


class SymptomResponse(BaseModel):
    status: str
    data: dict


# -------------------------------
# Root Endpoint
# -------------------------------
@app.get("/")
def root():
    return {"message": "SymptoTrackAI API is running. Use POST /analyze to get results."}


# -------------------------------
# Main Pipeline Endpoint
# -------------------------------
@app.post("/analyze", response_model=SymptomResponse)
def analyze_symptoms(request: SymptomRequest):

    if not request.symptoms or len(request.symptoms.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please provide a valid symptom description.")

    print("\n📥 User Input:", request.symptoms)

    # 🔹 Step 1: Preprocessing
    cleaned = preprocess(request.symptoms)
    print("🧹 Cleaned:", cleaned)

    # 🔹 Step 2: Symptom Extraction
    extracted = extract_symptoms(cleaned)
    print("🧠 Extracted:", extracted)

    # 🔹 Step 3: Retrieval (FAISS)
    docs = retrieve_documents(cleaned)
    print(f"📚 Retrieved Docs: {len(docs)}")

    # 🔹 Convert docs → text for LLM
    retrieved_texts = [doc["text"] for doc in docs]

    # 🔹 Step 4: LLM Generation (RAG + fallback)
    raw_response = generate_response(cleaned, retrieved_texts)

    # 🔹 Step 5: Postprocessing
    final_output = postprocess_response(raw_response, docs, extracted)

    return {
        "status": "success",
        "data": final_output
    }


# -------------------------------
# Health Check Endpoint
# -------------------------------
@app.get("/health")
def health_check():
    return {"status": "healthy"}

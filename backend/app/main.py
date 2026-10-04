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

# ML classifier — lazy load, won't crash if model not trained yet
try:
    from models.triage_model import TriageModel
    _triage_model = TriageModel()
    ML_AVAILABLE = True
except Exception:
    _triage_model = None
    ML_AVAILABLE = False


app = FastAPI(
    title="SymptoTrackAI",
    description="AI-powered symptom analysis using RAG + ML",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SymptomRequest(BaseModel):
    symptoms: str


class SymptomResponse(BaseModel):
    status: str
    data: dict


@app.get("/")
def root():
    return {
        "message": "SymptoTrackAI API is running.",
        "ml_classifier": "loaded" if ML_AVAILABLE else "not trained yet"
    }


@app.post("/analyze", response_model=SymptomResponse)
def analyze_symptoms(request: SymptomRequest):

    if not request.symptoms or len(request.symptoms.strip()) < 3:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid symptom description."
        )

    print("\nUser Input:", request.symptoms)

    # Preprocessing
    cleaned = preprocess(request.symptoms)
    print("Cleaned:", cleaned)

    # Symptom Extraction
    extracted = extract_symptoms(cleaned)
    print("Extracted:", extracted)

    # ML Classification
    ml_prediction = None
    if ML_AVAILABLE and _triage_model and extracted:
        try:
            ml_prediction = _triage_model.predict(extracted)
            print(f"ML Prediction: {ml_prediction.get('primary_disease')} "
                  f"({ml_prediction.get('primary_confidence', 0)*100:.0f}%)")
        except Exception as e:
            print(f"ML prediction failed: {e}")

    # Retrieval (FAISS)
    docs = retrieve_documents(cleaned)
    print(f"Retrieved Docs: {len(docs)}")

    retrieved_texts = [doc["text"] for doc in docs]

    # LLM Generation (RAG + ML context)
    raw_response = generate_response(cleaned, retrieved_texts, ml_prediction)

    # Step 5: Postprocessing
    final_output = postprocess_response(
        raw_response, docs, extracted, ml_prediction
    )

    return {"status": "success", "data": final_output}


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "ml_classifier": "loaded" if ML_AVAILABLE else "not trained"
    }


@app.post("/login")
async def login(data: dict):
    return {"user": {"email": data.get("email"), "name": "User"}}

@app.post("/signup")
async def signup(data: dict):
    return {"message": "Account created"}

@app.get("/profile")
async def get_profile():
    return {"full_name": "", "email": "", "age": 0,
            "blood_group": "", "height": 0, "weight": 0}

@app.post("/profile")
async def save_profile(data: dict):
    return {"message": "Profile saved"}


class EvaluationRequest(BaseModel):
    symptoms: str

@app.post("/evaluate")
def evaluate(request: EvaluationRequest):
    from services.evaluation import evaluate_responses
    cleaned = preprocess(request.symptoms)
    docs = retrieve_documents(cleaned)
    result = evaluate_responses(cleaned, docs)
    return {"status": "success", "data": result}
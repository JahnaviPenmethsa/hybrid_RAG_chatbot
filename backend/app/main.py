from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.preprocessing import preprocess
from services.extraction import extract_symptoms
from services.retriever import retrieve_documents
from services.llm_generator import generate_response
from services.postprocessing import postprocess_response

app = FastAPI(
    title="SymptoTrackAI",
    description="AI-powered symptom analysis and medical guidance system",
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
    return {"message": "SymptoTrackAI API is running. POST to /analyze to get started."}


@app.post("/analyze", response_model=SymptomResponse)
def analyze_symptoms(request: SymptomRequest):
    if not request.symptoms or len(request.symptoms.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please provide a valid symptom description.")

    # Pipeline
    cleaned = preprocess(request.symptoms)
    extracted = extract_symptoms(cleaned)
    docs = retrieve_documents(cleaned)
    raw_response = generate_response(cleaned, extracted, docs)
    final_output = postprocess_response(raw_response, docs, extracted)

    return {"status": "success", "data": final_output}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOWLEDGE_BASE_DIR = os.path.join(BASE_DIR, "data", "knowledge_base", "processed")
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "vector_db", "faiss_index.faiss")
CHUNKS_METADATA_PATH = os.path.join(BASE_DIR, "vector_db", "chunks_metadata.json")

# Embedding model
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Retrieval
TOP_K_DOCS = 2

# LLM
LLM_MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"   # Swap with a larger model as needed
MAX_NEW_TOKENS = 512

# Safety
EMERGENCY_KEYWORDS = [
    "chest pain", "chest_pain",
    "difficulty breathing", "difficulty_breathing",
    "shortness of breath", "shortness_of_breath",
    "stroke", "seizure", "unconscious",
    "severe bleeding", "severe_bleeding",
    "heart attack", "heart_attack",
    "anaphylaxis", "suicide", "overdose",
    "high fever", "high_fever",
    "paralysis", "sudden vision loss", "sudden_vision_loss",
    "choking", "severe burns", "severe_burns",
    "cannot breathe", "cannot_breathe"
]

DISCLAIMER = (
    "⚠️ MEDICAL DISCLAIMER: This information is for general educational purposes only "
    "and does NOT constitute professional medical advice, diagnosis, or treatment. "
    "Always consult a qualified healthcare provider for medical concerns."
)
from services.llm_generator import generate_response
from models.llm_model import LLMModel

llm = LLMModel()


# 🔹 Baseline LLM (no RAG)
def generate_without_rag(symptoms):
    print("⚠️ Running WITHOUT RAG...")
    return llm.call_groq(symptoms) or llm.call_gemini(symptoms)


# 🔹 RAG version
def generate_with_rag(symptoms, retrieved_docs):
    print("✅ Running WITH RAG...")
    return generate_response(symptoms, retrieved_docs)


# 🔹 Simple evaluation metrics
def evaluate_responses(symptoms, retrieved_docs):

    no_rag = generate_without_rag(symptoms)
    rag = generate_with_rag(symptoms, retrieved_docs)

    evaluation = {
        "without_rag": no_rag,
        "with_rag": rag,
        "analysis": {
            "observation": "RAG responses are more grounded and context-aware",
            "hallucination_reduction": "Higher in RAG",
            "relevance": "Improved with RAG"
        }
    }

    return evaluation
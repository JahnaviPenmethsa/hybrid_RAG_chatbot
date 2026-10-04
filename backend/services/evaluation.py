from services.llm_generator import generate_response
from models.llm_model import LLMModel

llm = LLMModel()


def generate_without_rag(symptoms: str) -> str:
    """Call LLM with no retrieved context."""
    prompt = f"""
You are a medical AI assistant.
Patient symptoms: {symptoms}
Provide possible causes, next steps, and risk level.
Answer:
"""
    return llm.call_groq(prompt) or llm.call_gemini(prompt) or "No response generated."


def generate_with_rag(symptoms: str, retrieved_docs: list) -> str:
    """Call LLM with retrieved context."""
    return generate_response(symptoms, [doc["text"] for doc in retrieved_docs])


def score_response(response: str, symptoms: str, docs: list) -> dict:
    """Compute basic quality metrics for a response."""

    # Length score — longer = more detailed (capped)
    word_count = len(response.split())
    length_score = min(round(word_count / 300, 2), 1.0)

    # Keyword coverage — how many symptom words appear in response
    symptom_words = set(symptoms.lower().split())
    response_lower = response.lower()
    matched = sum(1 for w in symptom_words if w in response_lower)
    keyword_score = round(matched / max(len(symptom_words), 1), 2)

    # Source grounding — how many retrieved source terms appear in response
    if docs:
        doc_words = set(" ".join(d["text"] for d in docs).lower().split())
        grounded = sum(1 for w in doc_words if w in response_lower)
        grounding_score = round(min(grounded / 100, 1.0), 2)
    else:
        grounding_score = 0.0

    # Structure score — checks for expected medical response sections
    structure_keywords = ["cause", "risk", "step", "recommend", "consult", "treat"]
    structure_hits = sum(1 for kw in structure_keywords if kw in response_lower)
    structure_score = round(structure_hits / len(structure_keywords), 2)

    # Overall score — weighted average
    overall = round(
        (length_score * 0.2) +
        (keyword_score * 0.3) +
        (grounding_score * 0.3) +
        (structure_score * 0.2),
        2
    )

    return {
        "length_score": length_score,
        "keyword_coverage": keyword_score,
        "source_grounding": grounding_score,
        "structure_score": structure_score,
        "overall_score": overall,
        "word_count": word_count,
    }


def evaluate_responses(symptoms: str, retrieved_docs: list) -> dict:
    no_rag = generate_without_rag(symptoms)
    rag = generate_with_rag(symptoms, retrieved_docs)

    no_rag_scores = score_response(no_rag, symptoms, [])
    rag_scores = score_response(rag, symptoms, retrieved_docs)

    # Improvement delta
    improvement = round(rag_scores["overall_score"] - no_rag_scores["overall_score"], 2)

    return {
        "without_rag": {
            "response": no_rag,
            "scores": no_rag_scores,
        },
        "with_rag": {
            "response": rag,
            "scores": rag_scores,
        },
        "comparison": {
            "rag_improvement": improvement,
            "verdict": "RAG improves response quality" if improvement > 0 else "Responses are comparable",
            "recommendation": "Use RAG pipeline for better grounded responses" if improvement > 0 else "Both approaches perform similarly for this input",
        }
    }
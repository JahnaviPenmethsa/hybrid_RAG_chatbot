from models.llm_model import LLMModel

llm = LLMModel()


def build_prompt(symptoms: str, retrieved_docs: list, ml_prediction: dict = None) -> str:
    context = "\n".join(retrieved_docs) if retrieved_docs else "No context retrieved."

    # Build ML prediction section
    ml_section = ""
    if ml_prediction and ml_prediction.get("primary_disease"):
        top = ml_prediction.get("top_predictions", [])
        predictions_text = "\n".join(
            f"  - {p['disease']}: {p['confidence']*100:.0f}% confidence"
            for p in top[:3]
        )
        ml_section = f"""
ML Classifier Predictions (Random Forest, trained on symptom-disease dataset):
{predictions_text}

Consider these predictions when forming your response, but rely primarily on the medical context below.
"""

    prompt = f"""You are a medical AI assistant trained on WHO, ICMR, and Ministry of Health guidelines.

Patient symptoms: {symptoms}
{ml_section}
Relevant medical knowledge:
{context}

Instructions:
- Give 2-3 possible causes (consider the ML predictions above as supporting evidence)
- Suggest next steps and home care
- Mention risk level (low/medium/high)
- Do NOT hallucinate or invent information
- Use only the provided context and ML predictions

Answer:
"""
    return prompt


def generate_response(symptoms: str, retrieved_docs: list,
                      ml_prediction: dict = None) -> str:

    prompt = build_prompt(symptoms, retrieved_docs, ml_prediction)

    print("Trying GROQ...")
    response = llm.call_groq(prompt)
    if response and len(response.strip()) > 0:
        print("Using GROQ")
        return response

    print("GROQ failed, trying GEMINI...")
    response = llm.call_gemini(prompt)
    if response and len(response.strip()) > 0:
        print("Using GEMINI")
        return response

    print("Both LLMs failed, using rule-based fallback...")
    return fallback_response(symptoms, retrieved_docs, ml_prediction)


def fallback_response(symptoms: str, retrieved_docs: list,
                      ml_prediction: dict = None) -> str:
    if not retrieved_docs and not ml_prediction:
        return ("Insufficient data to analyze symptoms. "
                "Please consult a healthcare professional.")

    symptoms_lower = symptoms.lower()
    combined_text = " ".join(retrieved_docs).lower() if retrieved_docs else ""

    possible_causes = []

    # Use ML predictions first if available
    if ml_prediction and ml_prediction.get("top_predictions"):
        for p in ml_prediction["top_predictions"][:2]:
            possible_causes.append(
                f"{p['disease']} ({p['confidence']*100:.0f}% ML confidence)"
            )

    # Supplement with symptom-based rules
    if any(w in symptoms_lower for w in ["stress", "anxiety", "tension"]):
        possible_causes.append("Stress or anxiety")
    if any(w in symptoms_lower for w in ["fever", "temperature", "chills"]):
        possible_causes.append("Viral or bacterial infection")
    if any(w in symptoms_lower for w in ["headache", "head", "migraine"]):
        possible_causes.append("Tension headache or migraine")
    if any(w in symptoms_lower for w in ["cough", "cold", "throat"]):
        possible_causes.append("Respiratory infection")
    if any(w in symptoms_lower for w in ["stomach", "nausea", "vomit", "diarrhea"]):
        possible_causes.append("Gastrointestinal issue")
    if any(w in symptoms_lower for w in ["chest", "heart", "breathing"]):
        possible_causes.append("Cardiac or respiratory concern")

    # Remove duplicates
    seen = set()
    unique_causes = []
    for c in possible_causes:
        key = c.lower().split("(")[0].strip()
        if key not in seen:
            seen.add(key)
            unique_causes.append(c)

    if not unique_causes:
        unique_causes = ["General discomfort — further assessment needed"]

    # Risk from symptoms
    if any(w in symptoms_lower for w in
           ["severe", "extreme", "chest pain", "can't breathe", "unconscious"]):
        risk = "high"
    elif any(w in symptoms_lower for w in
             ["persistent", "days", "weeks", "worsening"]):
        risk = "medium"
    else:
        risk = "low"

    steps = [
        "Stay hydrated and get adequate rest",
        "Monitor your symptoms regularly",
        "Avoid self-medicating without professional advice",
    ]
    if risk == "high":
        steps.append("Seek immediate medical attention")

    causes_text = "\n".join(f"- {c}" for c in unique_causes)
    steps_text = "\n".join(f"- {s}" for s in steps)

    ml_note = ""
    if ml_prediction and ml_prediction.get("primary_disease"):
        ml_note = (f"\n\n**ML Model Prediction:** The Random Forest classifier "
                   f"suggests **{ml_prediction['primary_disease']}** as the most "
                   f"likely condition based on your symptoms "
                   f"({ml_prediction['primary_confidence']*100:.0f}% confidence).")

    return f"""**Possible Causes:**
{causes_text}

**Risk Level:** {risk.upper()}

**Recommended Next Steps:**
{steps_text}{ml_note}

*Note: This is a rule-based assessment. Please consult a qualified healthcare professional for accurate diagnosis.*"""
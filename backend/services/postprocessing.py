"""
postprocessing.py
-----------------
Structures the final response including ML predictions.
"""

from typing import List, Dict, Any, Optional
from app.config import EMERGENCY_KEYWORDS, DISCLAIMER


def detect_emergency(text: str, extracted_symptoms: List[str]) -> bool:
    symptoms_text = " ".join(
        s.replace("_", " ") for s in extracted_symptoms
    ).lower()
    return any(kw in symptoms_text for kw in EMERGENCY_KEYWORDS)


def build_citations(docs: List[Dict]) -> List[Dict]:
    citations = []
    for i, doc in enumerate(docs, 1):
        citations.append({
            "ref": i,
            "source": doc.get("source", "Unknown"),
            "relevance_score": round(doc.get("score", 0.0), 4),
            "excerpt": doc.get("text", "")[:200] + "..."
        })
    return citations


def calculate_triage(extracted_symptoms: list, is_emergency: bool) -> dict:
    if is_emergency:
        return {"level": 4, "label": "EMERGENCY", "color": "red",
                "description": "Call 112 immediately"}

    symptoms_normalized = [s.replace("_", " ").lower() for s in extracted_symptoms]
    symptoms_text = " ".join(symptoms_normalized)

    high_risk = [
        "chest pain", "shortness of breath", "seizure",
        "unconscious", "difficulty breathing", "paralysis",
        "severe bleeding", "anaphylaxis"
    ]
    medium_risk = [
        "fever", "vomiting", "diarrhea", "headache",
        "fainting", "palpitations", "blurred vision",
        "rapid heartbeat", "jaundice", "swelling"
    ]

    for risk in high_risk:
        if risk in symptoms_text or any(risk in s for s in symptoms_normalized):
            return {"level": 3, "label": "HIGH", "color": "orange",
                    "description": "Seek medical attention today"}

    for risk in medium_risk:
        if risk in symptoms_text or any(risk in s for s in symptoms_normalized):
            return {"level": 2, "label": "MODERATE", "color": "yellow",
                    "description": "See a doctor within 24-48 hours"}

    return {"level": 1, "label": "LOW", "color": "green",
            "description": "Monitor symptoms, self-care appropriate"}


def postprocess_response(
    raw_llm_output: str,
    docs: List[Dict],
    extracted_symptoms: List[str],
    ml_prediction: Optional[Dict] = None,
) -> Dict[str, Any]:

    is_emergency = detect_emergency(raw_llm_output, extracted_symptoms)

    emergency_message = (
        "🚨 EMERGENCY ALERT: Your symptoms may indicate a serious or "
        "life-threatening condition. Please call emergency services "
        "(112 / 102 in India) or go to the nearest emergency room immediately."
        if is_emergency else ""
    )

    symptom_display = [s.replace("_", " ").title() for s in extracted_symptoms]
    citations = build_citations(docs)

    # Format ML prediction for response
    ml_result = None
    if ml_prediction and ml_prediction.get("primary_disease"):
        ml_result = {
            "primary_disease": ml_prediction["primary_disease"],
            "primary_confidence": round(
                ml_prediction["primary_confidence"] * 100, 1
            ),
            "top_predictions": [
                {
                    "disease": p["disease"],
                    "confidence_pct": round(p["confidence"] * 100, 1)
                }
                for p in ml_prediction.get("top_predictions", [])[:3]
            ],
            "model": "XGBoost · DDXPlus · 223 evidence features · 49 disease classes"
        }

    return {
        "symptoms_identified": symptom_display,
        "triage": calculate_triage(extracted_symptoms, is_emergency),
        "emergency_alert": is_emergency,
        "emergency_message": emergency_message,
        "ml_prediction": ml_result,
        "guidance": raw_llm_output or (
            "Unable to generate guidance. Please consult a healthcare provider."
        ),
        "citations": citations,
        "disclaimer": DISCLAIMER,
    }
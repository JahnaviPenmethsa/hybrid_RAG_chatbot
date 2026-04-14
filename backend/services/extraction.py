"""
extraction.py
-------------
Extracts and normalizes recognized medical symptoms from cleaned text.

Strategy (Phase 1):
  - Keyword matching against a curated symptom dictionary.
  - Each canonical symptom maps to a list of aliases/variants.
  - Returns a list of matched canonical symptom names.
"""

from typing import List

# ---------------------------------------------------------------------------
# Symptom dictionary: canonical_name -> list of aliases
# Extend this as needed.
# ---------------------------------------------------------------------------
SYMPTOM_DICT = {
    "fever": ["fever", "high temperature", "high temp", "pyrexia", "febrile", "temperature"],
    "headache": ["headache", "head pain", "head ache", "migraine", "cephalgia"],
    "cough": ["cough", "coughing", "dry cough", "wet cough", "productive cough"],
    "sore_throat": ["sore throat", "throat pain", "throat ache", "pharyngitis"],
    "runny_nose": ["runny nose", "nasal discharge", "rhinorrhea", "stuffy nose", "blocked nose"],
    "fatigue": ["fatigue", "tiredness", "exhaustion", "weakness", "lethargy", "malaise"],
    "nausea": ["nausea", "nauseated", "feeling sick", "queasiness"],
    "vomiting": ["vomiting", "vomit", "throwing up", "emesis"],
    "diarrhea": ["diarrhea", "diarrhoea", "loose stool", "loose motions", "watery stool"],
    "abdominal_pain": ["abdominal pain", "stomach pain", "belly pain", "stomach ache", "stomach cramp"],
    "chest_pain": ["chest pain", "chest tightness", "chest pressure", "chest discomfort"],
    "shortness_of_breath": ["shortness of breath", "difficulty breathing", "breathlessness",
                            "dyspnea", "short of breath", "breathing difficulty"],
    "dizziness": ["dizziness", "dizzy", "lightheaded", "vertigo", "spinning"],
    "rash": ["rash", "skin rash", "hives", "urticaria", "skin eruption"],
    "joint_pain": ["joint pain", "arthralgia", "joint ache", "painful joints"],
    "muscle_pain": ["muscle pain", "myalgia", "body ache", "body pain", "muscle ache"],
    "loss_of_appetite": ["loss of appetite", "no appetite", "not hungry", "anorexia"],
    "chills": ["chills", "shivering", "rigors", "feeling cold"],
    "sweating": ["sweating", "sweats", "night sweats", "excessive sweating"],
    "back_pain": ["back pain", "lower back pain", "upper back pain", "backache"],
    "eye_pain": ["eye pain", "red eye", "itchy eyes", "burning eyes", "conjunctivitis"],
    "ear_pain": ["ear pain", "earache", "ear ache", "otitis"],
    "swollen_lymph_nodes": ["swollen lymph nodes", "swollen glands", "lymphadenopathy"],
    "urinary_symptoms": ["burning urination", "frequent urination", "painful urination",
                         "dysuria", "urgency to urinate"],
    "confusion": ["confusion", "confused", "disoriented", "altered consciousness"],
    "seizure": ["seizure", "convulsion", "fit", "epileptic episode"],
    "palpitations": ["palpitations", "heart racing", "rapid heartbeat", "irregular heartbeat"],
}


def extract_symptoms(cleaned_text: str) -> List[str]:
    """
    Match cleaned input text against the symptom dictionary.

    Args:
        cleaned_text: Pre-processed (lowercased, no punctuation) symptom string.

    Returns:
        List of matched canonical symptom names (deduplicated, sorted).
    """
    matched = set()

    for canonical, aliases in SYMPTOM_DICT.items():
        for alias in aliases:
            if alias in cleaned_text:
                matched.add(canonical)
                break  # No need to check more aliases for this symptom

    return sorted(list(matched))


def get_symptom_display_names(symptom_keys: List[str]) -> List[str]:
    """Convert underscore keys to readable names, e.g. 'chest_pain' -> 'Chest Pain'."""
    return [key.replace("_", " ").title() for key in symptom_keys]


# ------- Quick self-test -------
if __name__ == "__main__":
    samples = [
        "fever high temperature headache for 2 days",
        "chest pain shortness of breath dizziness",
        "nausea vomiting stomach pain loss of appetite",
    ]
    for s in samples:
        matched = extract_symptoms(s)
        print(f"Input    : {s}")
        print(f"Extracted: {get_symptom_display_names(matched)}\n")
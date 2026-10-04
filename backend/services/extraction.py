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
    # General / Systemic
    "fever": ["fever", "high temperature", "high temp", "pyrexia", "febrile", "temperature", "burning up", "running a temperature"],
    "chills": ["chills", "shivering", "rigors", "feeling cold", "cold and shivery"],
    "fatigue": ["fatigue", "tiredness", "exhaustion", "weakness", "lethargy", "malaise", "no energy", "feeling weak", "drained", "worn out"],
    "sweating": ["sweating", "sweats", "night sweats", "excessive sweating", "drenched in sweat"],
    "weight_loss": ["weight loss", "losing weight", "unintentional weight loss"],
    "loss_of_appetite": ["loss of appetite", "no appetite", "not hungry", "anorexia", "no hunger", "don't feel like eating", "not eating", "poor appetite"],
    "swollen_lymph_nodes": ["swollen lymph nodes", "swollen glands", "lymphadenopathy", "lumps in neck"],

    # Head / Neurological
    "headache": ["headache", "head pain", "head ache", "migraine", "cephalgia", "pounding head", "throbbing head", "splitting headache"],
    "dizziness": ["dizziness", "dizzy", "lightheaded", "vertigo", "spinning", "feeling faint", "off balance", "woozy"],
    "confusion": ["confusion", "confused", "disoriented", "altered consciousness", "not thinking clearly", "brain fog", "memory loss", "forgetful"],
    "seizure": ["seizure", "convulsion", "fit", "epileptic episode", "shaking uncontrollably", "blackout with shaking"],
    "fainting": ["fainting", "fainted", "passed out", "loss of consciousness", "blacked out", "collapsed"],
    "numbness": ["numbness", "tingling", "pins and needles", "numb", "loss of sensation"],
    "blurred_vision": ["blurred vision", "vision problems", "double vision", "can't see clearly", "visual disturbance"],

    # Mental Health
    "stress": ["stress", "stressed", "overwhelmed", "under pressure", "burnout", "burnt out", "too much stress"],
    "anxiety": ["anxiety", "anxious", "panic", "panic attack", "nervousness", "nervous", "worry", "worrying", "on edge", "restless"],
    "depression": ["depression", "depressed", "sadness", "feeling low", "hopeless", "helpless", "deep disappointment", "feeling empty", "no motivation", "worthless"],
    "insomnia": ["insomnia", "no sleep", "can't sleep", "difficulty sleeping", "sleeplessness", "not sleeping", "poor sleep", "trouble sleeping", "waking up at night", "sleep problems"],
    "mood_changes": ["mood swings", "irritable", "irritability", "angry for no reason", "emotional", "crying", "tearful"],

    # Respiratory
    "cough": ["cough", "coughing", "dry cough", "wet cough", "productive cough", "persistent cough", "hacking cough", "whooping cough"],
    "sore_throat": ["sore throat", "throat pain", "throat ache", "pharyngitis", "painful swallowing", "scratchy throat", "throat irritation"],
    "runny_nose": ["runny nose", "nasal discharge", "rhinorrhea", "stuffy nose", "blocked nose", "congestion", "nasal congestion", "sneezing"],
    "shortness_of_breath": ["shortness of breath", "difficulty breathing", "breathlessness", "dyspnea", "short of breath", "breathing difficulty", "can't breathe", "struggling to breathe", "out of breath"],
    "wheezing": ["wheezing", "whistling breath", "noisy breathing", "tight chest when breathing"],

    # Cardiac
    "chest_pain": ["chest pain", "chest tightness", "chest pressure", "chest discomfort", "pain in chest", "heaviness in chest", "squeezing in chest"],
    "palpitations": ["palpitations", "heart racing", "rapid heartbeat", "irregular heartbeat", "heart fluttering", "pounding heart", "skipped heartbeat", "heart pounding"],

    # Gastrointestinal
    "nausea": ["nausea", "nauseated", "feeling sick", "queasiness", "feel like vomiting", "want to vomit", "sick to stomach"],
    "vomiting": ["vomiting", "vomit", "throwing up", "emesis", "puking", "threw up"],
    "diarrhea": ["diarrhea", "diarrhoea", "loose stool", "loose motions", "watery stool", "frequent stools", "runny stomach", "stomach running"],
    "abdominal_pain": ["abdominal pain", "stomach pain", "belly pain", "stomach ache", "stomach cramp", "tummy ache", "abdominal cramp", "gut pain", "lower abdominal pain"],
    "bloating": ["bloating", "bloated", "gassy", "gas", "flatulence", "distended stomach", "stomach fullness"],
    "constipation": ["constipation", "no bowel movement", "can't pass stool", "hard stool", "straining to pass stool"],
    "heartburn": ["heartburn", "acidity", "acid reflux", "burning in chest after eating", "indigestion", "sour taste in mouth"],
    "blood_in_stool": ["blood in stool", "bloody stool", "rectal bleeding", "black stool", "tarry stool"],

    # Musculoskeletal
    "joint_pain": ["joint pain", "arthralgia", "joint ache", "painful joints", "stiff joints", "swollen joints", "joint swelling"],
    "muscle_pain": ["muscle pain", "myalgia", "body ache", "body pain", "muscle ache", "sore muscles", "muscle soreness", "muscle cramps"],
    "back_pain": ["back pain", "lower back pain", "upper back pain", "backache", "spine pain", "lumbar pain"],
    "neck_pain": ["neck pain", "stiff neck", "neck stiffness", "neck ache"],
    "swelling": ["swelling", "edema", "swollen", "puffiness", "swollen feet", "swollen ankles", "swollen hands"],

    # Skin
    "rash": ["rash", "skin rash", "hives", "urticaria", "skin eruption", "red spots", "red patches", "skin bumps"],
    "itching": ["itching", "itchy", "pruritus", "itchy skin", "scratching", "skin irritation"],
    "jaundice": ["jaundice", "yellow skin", "yellow eyes", "yellowing", "yellow tinge"],
    "skin_lesion": ["wound", "ulcer", "sore", "blister", "boil", "abscess", "cut that won't heal"],

    # Eyes / Ears / Nose
    "eye_pain": ["eye pain", "red eye", "itchy eyes", "burning eyes", "conjunctivitis", "pink eye", "eye irritation", "watery eyes", "eye discharge"],
    "ear_pain": ["ear pain", "earache", "ear ache", "otitis", "ear infection", "ringing in ears", "tinnitus", "hearing loss"],

    # Urinary
    "urinary_symptoms": ["burning urination", "frequent urination", "painful urination", "dysuria", "urgency to urinate", "blood in urine", "cloudy urine", "dark urine"],

    # Reproductive / Hormonal
    "menstrual_pain": ["period pain", "menstrual cramps", "dysmenorrhea", "painful periods", "heavy periods", "irregular periods"],

    # Specific Conditions / Red Flags
    "high_fever": ["very high fever", "fever above 103", "fever above 104", "extremely high temperature", "fever with rash"],
    "blood_in_vomit": ["blood in vomit", "vomiting blood", "hematemesis", "red vomit"],
    "difficulty_swallowing": ["difficulty swallowing", "dysphagia", "can't swallow", "painful swallowing", "food stuck in throat"],
    "sudden_weakness": ["sudden weakness", "sudden numbness", "one side weakness", "arm weakness", "face drooping", "facial drooping", "slurred speech", "speech difficulty"],
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


# Quick self-test 
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